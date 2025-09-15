import { PrismaClient, FunnelInstanceStatus, MetricPeriodType } from '@prisma/client';
import { 
  CreateFunnelInstanceInput,
  UpdateFunnelInstanceInput,
  BulkCreateInstancesInput,
  UpdateNodeInstanceInput,
  BatchUpdateNodeInstancesInput,
  FunnelInstanceResponse,
  FunnelInstanceDetails,
  FunnelInstanceQueryParams,
  NodeInstanceResponse,
  FunnelInstanceAnalytics,
  InstanceComparison,
  InstanceComparisonFilter,
  TemplateUsageAnalytics,
  InstanceCreationWizard
} from '@/types/funnelInstance';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class FunnelInstanceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // ==============================================================
  // Funnel Instance CRUD Operations
  // ==============================================================

  async createFunnelInstance(userId: string, data: CreateFunnelInstanceInput): Promise<FunnelInstanceResponse> {
    try {
      // Verify funnel template exists and user has access
      const funnelTemplate = await this.prisma.funnel.findFirst({
        where: { 
          id: data.funnelId, 
          OR: [
            { userId },
            { isPublic: true },
            { organizationId: { in: await this.getUserOrganizationIds(userId) } }
          ]
        },
        include: {
          nodes: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!funnelTemplate) {
        throw new ApiError('漏斗模板不存在或无权限访问', 404);
      }

      // Check for duplicate instance
      const existingInstance = await this.prisma.funnelInstance.findFirst({
        where: {
          funnelId: data.funnelId,
          userId,
          periodType: data.periodType,
          periodStartDate: data.periodStartDate
        }
      });

      if (existingInstance) {
        throw new ApiError('该时间段的实例已存在', 400);
      }

      // Create funnel instance
      const instance = await this.prisma.funnelInstance.create({
        data: {
          funnelId: data.funnelId,
          userId,
          organizationId: await this.getUserOrganizationId(userId),
          name: data.name,
          description: data.description,
          periodType: data.periodType,
          periodStartDate: data.periodStartDate,
          periodEndDate: data.periodEndDate,
          targetConversionRate: data.targetConversionRate,
          targetRevenue: data.targetRevenue,
          budgetAllocated: data.budgetAllocated,
          tags: data.tags || [],
          notes: data.notes
        },
        include: {
          funnel: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              industry: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Create node instances for all template nodes
      const nodeInstances = await Promise.all(
        funnelTemplate.nodes.map(node => 
          this.prisma.nodeInstance.create({
            data: {
              nodeId: node.id,
              funnelInstanceId: instance.id,
              customLabel: node.label
            }
          })
        )
      );

      // Update template usage statistics
      await this.updateTemplateUsageStats(data.funnelId);

      logger.info(`Created funnel instance: ${instance.name} from template: ${funnelTemplate.name}`);
      return this.formatFunnelInstanceResponse(instance);
    } catch (error) {
      logger.error('Failed to create funnel instance:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('创建漏斗实例失败', 500);
    }
  }

  async getFunnelInstances(userId: string, params: FunnelInstanceQueryParams): Promise<{ instances: FunnelInstanceResponse[], total: number }> {
    try {
      const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = params;
      const skip = (page - 1) * limit;

      const where: any = { 
        userId,
        ...(params.funnelId && { funnelId: params.funnelId }),
        ...(params.status && { status: { in: params.status } }),
        ...(params.periodType && { periodType: params.periodType }),
        ...(params.hasData !== undefined && { dataCompleteness: params.hasData ? { gt: 0 } : 0 }),
        ...(params.minCompleteness && { dataCompleteness: { gte: params.minCompleteness } }),
        ...(params.maxCompleteness && { dataCompleteness: { lte: params.maxCompleteness } }),
        ...(params.tags && { tags: { hasSome: params.tags } }),
        ...(params.startDate && params.endDate && {
          periodStartDate: { gte: params.startDate },
          periodEndDate: { lte: params.endDate }
        })
      };

      const orderBy: any = {};
      orderBy[sort] = order;

      const [instances, total] = await Promise.all([
        this.prisma.funnelInstance.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            funnel: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                industry: true
              }
            },
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            },
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            ...(params.includeNodeInstances && {
              nodeInstances: {
                include: {
                  node: {
                    select: {
                      id: true,
                      label: true,
                      nodeType: true,
                      isRequired: true
                    }
                  }
                }
              }
            })
          }
        }),
        this.prisma.funnelInstance.count({ where })
      ]);

      const formattedInstances = await Promise.all(
        instances.map(async instance => {
          const formatted = this.formatFunnelInstanceResponse(instance);
          if (params.includeAnalytics) {
            formatted.analytics = await this.getFunnelInstanceAnalytics(instance.id);
          }
          return formatted;
        })
      );

      return {
        instances: formattedInstances,
        total
      };
    } catch (error) {
      logger.error('Failed to get funnel instances:', error);
      throw new ApiError('获取漏斗实例失败', 500);
    }
  }

  async getFunnelInstanceById(userId: string, instanceId: string): Promise<FunnelInstanceDetails> {
    try {
      const instance = await this.prisma.funnelInstance.findFirst({
        where: {
          id: instanceId,
          userId
        },
        include: {
          funnel: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              industry: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          nodeInstances: {
            include: {
              node: {
                select: {
                  id: true,
                  label: true,
                  nodeType: true,
                  isRequired: true
                }
              },
              nodeMetrics: {
                orderBy: { createdAt: 'desc' },  // 按录入时间排序
                take: 10
              }
            },
            orderBy: {
              node: { createdAt: 'asc' }
            }
          },
          funnelMetrics: {
            orderBy: { createdAt: 'desc' },  // 按录入时间排序
            take: 10
          },
          aiSessions: {
            select: {
              id: true,
              sessionContext: true,
              createdAt: true,
              messages: {
                select: { role: true, content: true },
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!instance) {
        throw new ApiError('漏斗实例不存在或无权限访问', 404);
      }

      const analytics = await this.getFunnelInstanceAnalytics(instanceId);
      
      return {
        ...this.formatFunnelInstanceResponse(instance),
        nodeInstances: instance.nodeInstances.map(ni => this.formatNodeInstanceResponse(ni)),
        funnelMetrics: instance.funnelMetrics,
        aiSessions: instance.aiSessions.map(session => ({
          id: session.id,
          sessionContext: session.sessionContext || 'general',
          createdAt: session.createdAt,
          messageCount: session.messages.length,
          topics: [], // Could extract from messages
          recommendations: [] // Could extract from messages
        })),
        analytics
      };
    } catch (error) {
      logger.error('Failed to get funnel instance details:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('获取漏斗实例详情失败', 500);
    }
  }

  async updateFunnelInstance(userId: string, instanceId: string, data: UpdateFunnelInstanceInput): Promise<FunnelInstanceResponse> {
    try {
      const existingInstance = await this.prisma.funnelInstance.findFirst({
        where: {
          id: instanceId,
          userId
        }
      });

      if (!existingInstance) {
        throw new ApiError('漏斗实例不存在或无权限访问', 404);
      }

      const updatedInstance = await this.prisma.funnelInstance.update({
        where: { id: instanceId },
        data: {
          ...data,
          ...(data.status === 'completed' && !existingInstance.completedAt && {
            completedAt: new Date()
          }),
          ...(data.status === 'archived' && !existingInstance.archivedAt && {
            archivedAt: new Date()
          })
        },
        include: {
          funnel: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              industry: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logger.info(`Updated funnel instance: ${instanceId}`);
      return this.formatFunnelInstanceResponse(updatedInstance);
    } catch (error) {
      logger.error('Failed to update funnel instance:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('更新漏斗实例失败', 500);
    }
  }

  async deleteFunnelInstance(userId: string, instanceId: string): Promise<void> {
    try {
      const instance = await this.prisma.funnelInstance.findFirst({
        where: {
          id: instanceId,
          userId
        }
      });

      if (!instance) {
        throw new ApiError('漏斗实例不存在或无权限访问', 404);
      }

      await this.prisma.funnelInstance.delete({
        where: { id: instanceId }
      });

      // Update template usage statistics
      await this.updateTemplateUsageStats(instance.funnelId);

      logger.info(`Deleted funnel instance: ${instanceId}`);
    } catch (error) {
      logger.error('Failed to delete funnel instance:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('删除漏斗实例失败', 500);
    }
  }

  // ==============================================================
  // Node Instance Operations
  // ==============================================================

  async updateNodeInstance(userId: string, data: UpdateNodeInstanceInput): Promise<NodeInstanceResponse> {
    try {
      // Verify ownership through funnel instance
      const nodeInstance = await this.prisma.nodeInstance.findFirst({
        where: {
          id: data.nodeInstanceId,
          funnelInstance: { userId }
        }
      });

      if (!nodeInstance) {
        throw new ApiError('节点实例不存在或无权限访问', 404);
      }

      const updatedInstance = await this.prisma.nodeInstance.update({
        where: { id: data.nodeInstanceId },
        data: {
          customLabel: data.customLabel,
          currentEntryCount: data.currentEntryCount,
          currentConvertedCount: data.currentConvertedCount,
          currentRevenue: data.currentRevenue,
          currentCost: data.currentCost,
          customConfig: data.customConfig,
          // Conversion rate is calculated automatically by trigger
          ...(data.currentEntryCount && data.currentConvertedCount && {
            currentConversionRate: data.currentConvertedCount / data.currentEntryCount
          })
        },
        include: {
          node: {
            select: {
              id: true,
              label: true,
              nodeType: true,
              isRequired: true
            }
          }
        }
      });

      logger.info(`Updated node instance: ${data.nodeInstanceId}`);
      return this.formatNodeInstanceResponse(updatedInstance);
    } catch (error) {
      logger.error('Failed to update node instance:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('更新节点实例失败', 500);
    }
  }

  async batchUpdateNodeInstances(userId: string, data: BatchUpdateNodeInstancesInput): Promise<NodeInstanceResponse[]> {
    try {
      // Verify ownership
      const funnelInstance = await this.prisma.funnelInstance.findFirst({
        where: {
          id: data.funnelInstanceId,
          userId
        }
      });

      if (!funnelInstance) {
        throw new ApiError('漏斗实例不存在或无权限访问', 404);
      }

      const results: NodeInstanceResponse[] = [];

      await this.prisma.$transaction(async (prisma) => {
        for (const update of data.updates) {
          const updatedInstance = await prisma.nodeInstance.update({
            where: { id: update.nodeInstanceId },
            data: {
              customLabel: update.customLabel,
              currentEntryCount: update.currentEntryCount,
              currentConvertedCount: update.currentConvertedCount,
              currentRevenue: update.currentRevenue,
              currentCost: update.currentCost,
              customConfig: update.customConfig,
              ...(update.currentEntryCount && update.currentConvertedCount && {
                currentConversionRate: update.currentConvertedCount / update.currentEntryCount
              })
            },
            include: {
              node: {
                select: {
                  id: true,
                  label: true,
                  nodeType: true,
                  isRequired: true
                }
              }
            }
          });

          results.push(this.formatNodeInstanceResponse(updatedInstance));
        }
      });

      logger.info(`Batch updated ${results.length} node instances for funnel instance: ${data.funnelInstanceId}`);
      return results;
    } catch (error) {
      logger.error('Failed to batch update node instances:', error);
      if (error instanceof ApiError) throw error;
      throw new ApiError('批量更新节点实例失败', 500);
    }
  }

  // ==============================================================
  // Analytics and Comparison
  // ==============================================================

  async getFunnelInstanceAnalytics(instanceId: string): Promise<FunnelInstanceAnalytics> {
    try {
      const instance = await this.prisma.funnelInstance.findUnique({
        where: { id: instanceId },
        include: {
          nodeInstances: {
            include: {
              node: true
            }
          },
          funnelMetrics: {
            orderBy: { createdAt: 'desc' },  // 按录入时间排序
            take: 1
          }
        }
      });

      if (!instance) {
        throw new ApiError('漏斗实例不存在', 404);
      }

      const latestMetrics = instance.funnelMetrics[0];

      // Calculate progress to targets
      const progressToTarget = {
        conversion: instance.targetConversionRate && latestMetrics?.overallConversionRate 
          ? Number(latestMetrics.overallConversionRate) / Number(instance.targetConversionRate)
          : null,
        revenue: instance.targetRevenue && latestMetrics?.totalRevenue
          ? Number(latestMetrics.totalRevenue) / Number(instance.targetRevenue) 
          : null
      };

      // Calculate budget utilization
      const budgetUtilization = instance.budgetAllocated && latestMetrics?.totalCost
        ? Math.min(1.0, Number(latestMetrics.totalCost) / Number(instance.budgetAllocated))
        : null;

      // Calculate efficiency (revenue per cost)
      const efficiency = latestMetrics?.totalRevenue && latestMetrics?.totalCost && Number(latestMetrics.totalCost) > 0
        ? Number(latestMetrics.totalRevenue) / Number(latestMetrics.totalCost)
        : null;

      // Calculate time to complete
      const timeToComplete = instance.completedAt
        ? Math.ceil((instance.completedAt.getTime() - instance.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Node performance analysis
      const nodePerformance = instance.nodeInstances.map(ni => {
        const conversionRate = ni.currentConversionRate ? Number(ni.currentConversionRate) : null;
        let performance: 'excellent' | 'good' | 'average' | 'poor' = 'average';
        
        if (conversionRate !== null) {
          if (conversionRate >= 0.8) performance = 'excellent';
          else if (conversionRate >= 0.6) performance = 'good';
          else if (conversionRate >= 0.3) performance = 'average';
          else performance = 'poor';
        }

        return {
          nodeId: ni.nodeId,
          nodeName: ni.customLabel || ni.node.label,
          performance,
          conversionRate,
          bottleneckRisk: performance === 'poor' ? 'high' as const : 
                         performance === 'average' ? 'medium' as const : 'low' as const
        };
      });

      // Simple trend analysis (would be more complex with historical data)
      const trends = [
        {
          metric: 'conversion_rate',
          direction: 'stable' as const,
          change: 0,
          significance: 'low' as const
        }
      ];

      return {
        progressToTarget,
        budgetUtilization,
        efficiency,
        timeToComplete,
        nodePerformance,
        trends
      };
    } catch (error) {
      logger.error('Failed to get funnel instance analytics:', error);
      throw new ApiError('获取分析数据失败', 500);
    }
  }

  // ==============================================================
  // Private Helper Methods
  // ==============================================================

  private async getUserOrganizationId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    return user?.organizationId || null;
  }

  private async getUserOrganizationIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    return user?.organizationId ? [user.organizationId] : [];
  }

  private async updateTemplateUsageStats(funnelId: string): Promise<void> {
    const instanceCount = await this.prisma.funnelInstance.count({
      where: { funnelId }
    });

    const latestInstance = await this.prisma.funnelInstance.findFirst({
      where: { funnelId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    await this.prisma.funnel.update({
      where: { id: funnelId },
      data: {
        instanceCount,
        lastUsedAt: latestInstance?.createdAt
      }
    });
  }

  private formatFunnelInstanceResponse(instance: any): FunnelInstanceResponse {
    return {
      ...instance,
      // Add any additional formatting here
    };
  }

  private formatNodeInstanceResponse(nodeInstance: any): NodeInstanceResponse {
    const calculatedMetrics = {
      conversionRate: nodeInstance.currentConversionRate ? Number(nodeInstance.currentConversionRate) : null,
      revenuePerEntry: nodeInstance.currentRevenue && nodeInstance.currentEntryCount > 0
        ? Number(nodeInstance.currentRevenue) / nodeInstance.currentEntryCount
        : null,
      costPerConversion: nodeInstance.currentCost && nodeInstance.currentConvertedCount > 0
        ? Number(nodeInstance.currentCost) / nodeInstance.currentConvertedCount
        : null,
      efficiencyScore: nodeInstance.currentRevenue && nodeInstance.currentCost && Number(nodeInstance.currentCost) > 0
        ? Number(nodeInstance.currentRevenue) / Number(nodeInstance.currentCost)
        : null
    };

    return {
      ...nodeInstance,
      calculatedMetrics
    };
  }
}