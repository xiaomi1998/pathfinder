import { PrismaClient } from '@prisma/client';
import { CreateFunnelInput, UpdateFunnelInput, FunnelResponse, FunnelDetails } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class FunnelService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createFunnel(userId: string, data: CreateFunnelInput): Promise<FunnelResponse> {
    try {
      // 只传递schema中存在的字段
      const funnel = await this.prisma.funnel.create({
        data: {
          name: data.name,
          description: data.description,
          canvasData: data.canvasData,
          userId,
          status: 'active' // 使用schema中存在的枚举值
        }
      });

      logger.info(`新漏斗已创建: ${funnel.name} by user ${userId}`);
      return funnel;
    } catch (error) {
      logger.error('创建漏斗失败:', error);
      throw new ApiError('创建漏斗失败', 500);
    }
  }

  async getUserFunnels(userId: string, options: any): Promise<any> {
    const { page, limit, search, sort, order } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const orderBy: any = {};
    orderBy[sort] = order;

    const [funnels, total] = await Promise.all([
      this.prisma.funnel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              nodes: true,
              edges: true
            }
          }
        }
      }),
      this.prisma.funnel.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      funnels: funnels.map(funnel => ({
        ...funnel,
        nodeCount: funnel._count.nodes,
        edgeCount: funnel._count.edges
      })),
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  async getFunnelById(funnelId: string, userId: string): Promise<FunnelDetails> {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
        nodes: true,
        edges: {
          include: {
            sourceNode: true,
            targetNode: true
          }
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    return funnel;
  }

  async updateFunnel(funnelId: string, userId: string, data: UpdateFunnelInput): Promise<FunnelResponse> {
    // 验证漏斗所有权
    const existingFunnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!existingFunnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    try {
      const funnel = await this.prisma.funnel.update({
        where: { id: funnelId },
        data
      });

      logger.info(`漏斗已更新: ${funnel.name}`);
      return funnel;
    } catch (error) {
      logger.error('更新漏斗失败:', error);
      throw new ApiError('更新漏斗失败', 500);
    }
  }

  async deleteFunnel(funnelId: string, userId: string): Promise<void> {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    try {
      await this.prisma.funnel.delete({
        where: { id: funnelId }
      });

      logger.info(`漏斗已删除: ${funnel.name}`);
    } catch (error) {
      logger.error('删除漏斗失败:', error);
      throw new ApiError('删除漏斗失败', 500);
    }
  }

  async duplicateFunnel(funnelId: string, userId: string, newName?: string): Promise<FunnelResponse> {
    const originalFunnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
        nodes: true,
        edges: true
      }
    });

    if (!originalFunnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    try {
      const duplicatedFunnel = await this.prisma.funnel.create({
        data: {
          name: newName || `${originalFunnel.name} (副本)`,
          description: originalFunnel.description,
          canvasData: originalFunnel.canvasData || undefined,
          userId
        }
      });

      logger.info(`漏斗已复制: ${duplicatedFunnel.name}`);
      return duplicatedFunnel;
    } catch (error) {
      logger.error('复制漏斗失败:', error);
      throw new ApiError('复制漏斗失败', 500);
    }
  }

  async getFunnelStats(funnelId: string, userId: string): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 获取统计信息（简化实现）
    const [nodeCount, edgeCount, dataEntriesCount] = await Promise.all([
      this.prisma.node.count({ where: { funnelId } }),
      this.prisma.edge.count({ where: { funnelId } }),
      this.prisma.nodeData.count({
        where: {
          node: { funnelId }
        }
      })
    ]);

    return {
      totalNodes: nodeCount,
      totalEdges: edgeCount,
      totalDataEntries: dataEntriesCount,
      averageConversionRate: null, // 需要复杂计算
      lastDataUpdate: null // 需要查询最新数据时间
    };
  }

  async getFunnelPerformance(funnelId: string, userId: string, timeRange?: any): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 简化的性能数据
    return {
      funnelId,
      funnelName: funnel.name,
      overallConversionRate: null,
      totalEntries: 0,
      totalConversions: 0,
      performanceScore: 'average',
      bottlenecks: []
    };
  }

  async exportFunnel(funnelId: string, userId: string, options: any): Promise<any> {
    const funnel = await this.getFunnelById(funnelId, userId);
    
    const exportData = {
      filename: `${funnel.name}_export.json`,
      contentType: 'application/json',
      data: JSON.stringify(funnel, null, 2)
    };

    return exportData;
  }
}