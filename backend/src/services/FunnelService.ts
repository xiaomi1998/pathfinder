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
          dataPeriod: data.dataPeriod || 'DAILY',
          userId,
          status: 'active' // 使用schema中存在的枚举值
        }
      });

      logger.info(`新漏斗已创建: ${funnel.name} (${funnel.dataPeriod}) by user ${userId}`);
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
          nodes: {
            select: {
              id: true,
              label: true,
              nodeType: true,
              positionX: true,
              positionY: true
            }
          },
          edges: {
            select: {
              id: true,
              sourceNodeId: true,
              targetNodeId: true
            }
          },
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
      funnels: funnels.map(funnel => {
        // 如果没有关联的节点数据，但有 canvasData，则从 canvasData 获取数量
        let nodeCount = funnel._count.nodes;
        let edgeCount = funnel._count.edges;
        let nodes = funnel.nodes;
        let edges = funnel.edges;

        if (nodeCount === 0 && funnel.canvasData) {
          try {
            const canvasData = funnel.canvasData as any;
            if (canvasData.nodes && Array.isArray(canvasData.nodes)) {
              nodeCount = canvasData.nodes.length;
              nodes = canvasData.nodes.map((node: any) => ({
                id: node.id,
                label: node.data?.label || node.label || '未命名节点',
                nodeType: node.type || 'default',
                positionX: node.position?.x || node.x || 0,
                positionY: node.position?.y || node.y || 0
              }));
            }
            if (canvasData.edges && Array.isArray(canvasData.edges)) {
              edgeCount = canvasData.edges.length;
              edges = canvasData.edges.map((edge: any) => ({
                id: edge.id,
                sourceNodeId: edge.source,
                targetNodeId: edge.target
              }));
            }
          } catch (error) {
            logger.error('解析 canvasData 失败:', error);
          }
        }

        return {
          ...funnel,
          node_count: nodeCount, // 使用 node_count 字段名，匹配前端类型定义
          edge_count: edgeCount,
          nodeCount, // 保持向后兼容
          edgeCount, // 保持向后兼容
          // 确保包含 nodes 和 edges 数据
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.nodeType,
            position: { x: Number(node.positionX), y: Number(node.positionY) },
            data: { label: node.label }
          })),
          edges: edges.map(edge => ({
            id: edge.id,
            source: edge.sourceNodeId,
            target: edge.targetNodeId
          }))
        };
      }),
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
        nodes: {
          select: {
            id: true,
            label: true,
            nodeType: true,
            positionX: true,
            positionY: true
          }
        },
        edges: {
          include: {
            sourceNode: {
              select: {
                id: true,
                label: true
              }
            },
            targetNode: {
              select: {
                id: true,
                label: true
              }
            }
          }
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 如果没有关联的节点数据，但有 canvasData，则从 canvasData 解析
    let nodes = funnel.nodes;
    let edges = funnel.edges;

    if (nodes.length === 0 && funnel.canvasData) {
      try {
        const canvasData = funnel.canvasData as any;
        if (canvasData.nodes && Array.isArray(canvasData.nodes)) {
          nodes = canvasData.nodes.map((node: any) => ({
            id: node.id,
            label: node.data?.label || node.label || '未命名节点',
            nodeType: node.type || 'default',
            positionX: node.position?.x || node.x || 0,
            positionY: node.position?.y || node.y || 0
          }));
        }
        if (canvasData.edges && Array.isArray(canvasData.edges)) {
          edges = canvasData.edges.map((edge: any) => ({
            id: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceNode: null,
            targetNode: null
          }));
        }
        logger.info(`从 canvasData 解析得到 ${nodes.length} 个节点和 ${edges.length} 条边`);
      } catch (error) {
        logger.error('解析 canvasData 失败:', error);
      }
    }

    // 转换数据格式以匹配前端期望
    const transformedFunnel = {
      ...funnel,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.nodeType,
        position: { x: Number(node.positionX), y: Number(node.positionY) },
        data: { label: node.label }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.sourceNodeId,
        target: edge.targetNodeId,
        sourceNode: edge.sourceNode,
        targetNode: edge.targetNode
      }))
    };

    return transformedFunnel as any;
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