import { PrismaClient } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class DashboardService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // 获取漏斗概览数据
  async getFunnelMetrics(funnelId: string, userId: string) {
    try {
      // 验证漏斗所有权
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: funnelId, userId }
      });

      if (!funnel) {
        throw new ApiError('漏斗不存在', 404);
      }

      // 从canvasData中获取节点信息（因为节点可能只存储在canvas中而不在Node表中）
      let nodes: Array<{id: string, label: string, x: number}> = [];
      if (funnel.canvasData && (funnel.canvasData as any).nodes) {
        nodes = (funnel.canvasData as any).nodes.map((node: any) => ({
          id: node.id,
          label: node.label || node.name,
          x: node.x
        })).sort((a: any, b: any) => a.x - b.x); // 按X坐标排序
      }

      logger.info(`查询到的漏斗信息:`, {
        id: funnel?.id,
        name: funnel?.name,
        nodesCount: nodes.length,
        nodes: nodes
      });

      // 获取最后一次录入的漏斗指标数据（按录入时间）
      const latestMetrics = await this.prisma.funnelMetrics.findFirst({
        where: { funnelId },
        orderBy: { createdAt: 'desc' }  // 改为按创建时间排序
      });


      if (!latestMetrics) {
        return {
          funnelId,
          overallConversionRate: 0,
          totalEntries: 0,
          totalConversions: 0,
          totalRevenue: 0,
          stageMetrics: [],
          lastUpdated: null
        };
      }

      // 从customMetrics中获取阶段数据
      const customMetrics = latestMetrics.customMetrics as Record<string, any> | null;
      const stageData = customMetrics?.stageData || {};
      
      logger.info(`漏斗节点:`, nodes.map(n => ({ id: n.id, label: n.label })));
      logger.info(`阶段数据:`, stageData);
      logger.info(`节点数量: ${nodes.length}, 数据项数量: ${Object.keys(stageData).length}`);
      
      const stageMetrics = nodes.map((node, index) => {
        // 尝试多种ID格式匹配
        let entries = 0;
        let directMatch = false;
        
        // 检查直接匹配
        if (stageData.hasOwnProperty(node.id) && stageData[node.id] != null) {
          entries = stageData[node.id];
          directMatch = true;
          logger.info(`节点 ${node.id} 直接匹配成功: ${entries}`);
        }
        
        // 如果直接匹配失败，尝试其他可能的ID格式
        if (!directMatch) {
          // 尝试匹配所有可能的key
          const possibleKeys = Object.keys(stageData);
          const nodeIdStr = node.id.toString();
          
          // 1. 尝试部分匹配（如果stageData的key包含nodeId的一部分）
          let matchedKey = possibleKeys.find(key => 
            key.includes(nodeIdStr) || nodeIdStr.includes(key)
          );
          
          // 2. 按位置匹配 - 使用原始key的顺序
          if (!matchedKey && possibleKeys.length > index) {
            // 使用原始key的顺序，不排序
            matchedKey = possibleKeys[index];
            logger.info(`节点 ${node.id} (索引${index}) 尝试按位置匹配key: ${matchedKey}`);
          }
          
          // 3. 尝试匹配 node_1, node_2 等格式
          if (!matchedKey) {
            matchedKey = possibleKeys.find(key => 
              key.startsWith('node_') || key.includes(`_${index + 1}`)
            );
          }
          
          // 4. 如果节点数量和数据键数量相等，按索引顺序匹配
          if (!matchedKey && possibleKeys.length === nodes.length) {
            matchedKey = possibleKeys[index];
            logger.info(`节点数量匹配，${node.id} (索引${index}) 强制匹配key: ${matchedKey}`);
          }
          
          if (matchedKey) {
            entries = stageData[matchedKey];
            logger.info(`节点 ${node.id} 通过key "${matchedKey}" 匹配到数据: ${entries}`);
          } else {
            logger.warn(`节点 ${node.id} 在stageData中找不到匹配的数据`);
            logger.info('可用的stageData keys:', possibleKeys);
          }
        }
        
        const nextNode = nodes[index + 1];
        let conversions = entries; // 默认转化数等于流入数
        if (nextNode) {
          conversions = stageData[nextNode.id] || 0;
          
          // 如果下一个节点也匹配失败，使用同样的匹配策略
          if (conversions === 0) {
            const possibleKeys = Object.keys(stageData);
            const nextNodeIdStr = nextNode.id.toString();
            
            let matchedKey = possibleKeys.find(key => 
              key.includes(nextNodeIdStr) || nextNodeIdStr.includes(key)
            );
            
            if (!matchedKey && possibleKeys.length > index + 1) {
              // 使用原始key的顺序，不排序
              matchedKey = possibleKeys[index + 1];
              logger.info(`下一节点 ${nextNode.id} (索引${index + 1}) 按位置匹配key: ${matchedKey}`);
            }
            
            if (!matchedKey) {
              matchedKey = possibleKeys.find(key => 
                key.startsWith('node_') || key.includes(`_${index + 2}`)
              );
            }
            
            if (matchedKey) {
              conversions = stageData[matchedKey];
              logger.info(`下一节点 ${nextNode.id} 通过key "${matchedKey}" 匹配到转化数据: ${conversions}`);
            }
          }
        }
        
        const conversionRate = entries > 0 ? (conversions / entries) * 100 : 0;

        return {
          nodeId: node.id,
          nodeName: node.label,
          entries,
          conversions,
          conversionRate: Math.round(conversionRate * 100) / 100
        };
      });
      
      logger.info(`生成的stageMetrics:`, stageMetrics);

      return {
        funnelId,
        overallConversionRate: latestMetrics.overallConversionRate 
          ? Math.round(Number(latestMetrics.overallConversionRate) * 100 * 100) / 100 
          : 0,
        totalEntries: latestMetrics.totalEntries || 0,
        totalConversions: latestMetrics.totalConversions || 0,
        totalRevenue: latestMetrics.totalRevenue 
          ? Math.round(Number(latestMetrics.totalRevenue) * 100) / 100 
          : 0,
        stageMetrics,
        lastUpdated: latestMetrics.createdAt  // 改为返回录入时间而不是数据日期
      };
    } catch (error) {
      logger.error('获取漏斗概览数据失败:', error);
      throw error;
    }
  }

  // 获取转化趋势数据
  async getTrendData(funnelId: string, userId: string, period?: string) {
    try {
      // 验证漏斗所有权
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: funnelId, userId }
      });

      if (!funnel) {
        throw new ApiError('漏斗不存在', 404);
      }

      // 获取指标数据
      let metrics;
      
      if (period) {
        // 如果指定了period，计算日期范围
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
          case '7d':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(endDate.getDate() - 90);
            break;
          case '365d':
            startDate.setDate(endDate.getDate() - 365);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        metrics = await this.prisma.funnelMetrics.findMany({
          where: {
            funnelId,
            periodStartDate: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: { createdAt: 'asc' }  // 改为按录入时间排序
        });
      } else {
        // 不指定period时，获取所有数据
        metrics = await this.prisma.funnelMetrics.findMany({
          where: { funnelId },
          orderBy: { createdAt: 'asc' },  // 改为按录入时间排序
          take: 100 // 限制最多100条数据防止数据过多
        });
      }

      // 转换为前端期望的格式
      const labels: string[] = [];
      const conversionRates: number[] = [];
      const leadCounts: number[] = [];

      metrics.forEach(metric => {
        labels.push(metric.periodStartDate.toISOString().split('T')[0]);
        conversionRates.push(
          metric.overallConversionRate 
            ? Math.round(Number(metric.overallConversionRate) * 100 * 100) / 100 
            : 0
        );
        leadCounts.push(metric.totalEntries || 0);
      });

      return {
        labels,
        conversionRates,
        leadCounts
      };
    } catch (error) {
      logger.error('获取趋势数据失败:', error);
      throw error;
    }
  }

  // 获取最近活动
  async getRecentActivities(userId: string, limit: number = 10) {
    try {
      const activities: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        timestamp: string;
      }> = [];

      // 获取最近的数据录入活动
      const recentMetrics = await this.prisma.funnelMetrics.findMany({
        where: {
          funnel: { userId }
        },
        include: {
          funnel: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      activities.push(...recentMetrics.map(metric => ({
        id: `metrics_${metric.id}`,
        type: 'data_entry',
        title: '更新了漏斗数据',
        description: `为 "${metric.funnel.name}" 录入了 ${metric.periodStartDate.toLocaleDateString('zh-CN')} 的数据`,
        timestamp: metric.createdAt.toISOString()
      })));

      // 获取最近创建的漏斗
      const recentFunnels = await this.prisma.funnel.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      activities.push(...recentFunnels.map(funnel => ({
        id: `funnel_${funnel.id}`,
        type: 'funnel_created',
        title: '创建了新漏斗',
        description: `创建了漏斗 "${funnel.name}"`,
        timestamp: funnel.createdAt.toISOString()
      })));

      // 检查数据缺失
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const userFunnels = await this.prisma.funnel.findMany({
        where: { userId },
        select: { id: true, name: true }
      });

      for (const funnel of userFunnels) {
        const metricsCount = await this.prisma.funnelMetrics.count({
          where: {
            funnelId: funnel.id,
            periodStartDate: {
              gte: thirtyDaysAgo,
              lte: today
            }
          }
        });

        const expectedDays = Math.floor((today.getTime() - thirtyDaysAgo.getTime()) / (1000 * 60 * 60 * 24));
        if (metricsCount < expectedDays * 0.8) { // 如果缺失超过20%的数据
          activities.push({
            id: `missing_${funnel.id}`,
            type: 'data_missing',
            title: '检测到数据缺失',
            description: `漏斗 "${funnel.name}" 最近30天有数据缺失，建议及时补录`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // 按时间排序并限制数量
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return sortedActivities;
    } catch (error) {
      logger.error('获取最近活动失败:', error);
      throw error;
    }
  }

  // 获取数据录入状态 - 最近14天
  async getDataEntryStatus(userId: string) {
    try {
      const today = new Date();
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 13); // 包含今天，所以是13天前

      // 获取用户的所有漏斗
      const userFunnels = await this.prisma.funnel.findMany({
        where: { userId },
        select: { id: true, name: true }
      });

      if (userFunnels.length === 0) {
        return {};
      }

      const dataStatus: Record<string, { hasData: boolean; funnelId: string }> = {};

      // 检查最近14天的数据状态
      for (let i = 13; i >= 0; i--) { // 从13天前到今天
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // 检查是否有任何漏斗在这一天有数据
        const hasAnyData = await this.prisma.funnelMetrics.findFirst({
          where: {
            funnelId: { in: userFunnels.map(f => f.id) },
            periodStartDate: new Date(dateStr)
          },
          select: { funnelId: true, periodStartDate: true }
        });

        dataStatus[dateStr] = {
          hasData: !!hasAnyData,
          funnelId: hasAnyData?.funnelId || ''
        };
      }
      return dataStatus;
    } catch (error) {
      logger.error('获取数据录入状态失败:', error);
      throw error;
    }
  }

  // 获取概览统计
  async getOverviewStats(userId: string) {
    try {
      const [
        funnelsCount,
        totalMetricsCount,
        recentMetricsCount,
        avgConversionRate
      ] = await Promise.all([
        // 漏斗总数
        this.prisma.funnel.count({
          where: { userId }
        }),
        
        // 总数据条数
        this.prisma.funnelMetrics.count({
          where: { funnel: { userId } }
        }),
        
        // 最近7天数据条数
        this.prisma.funnelMetrics.count({
          where: {
            funnel: { userId },
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // 平均转化率
        this.prisma.funnelMetrics.aggregate({
          where: { funnel: { userId } },
          _avg: { overallConversionRate: true }
        })
      ]);

      return {
        funnelsCount,
        totalMetricsCount,
        recentMetricsCount,
        avgConversionRate: avgConversionRate._avg.overallConversionRate 
          ? Math.round(Number(avgConversionRate._avg.overallConversionRate) * 100 * 100) / 100
          : 0
      };
    } catch (error) {
      logger.error('获取概览统计失败:', error);
      throw error;
    }
  }
}