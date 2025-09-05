import { PrismaClient } from '@prisma/client';
import { CreateEdgeInput } from '@/types';
import { ApiError } from '@/utils/ApiError';

export class EdgeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createEdge(data: CreateEdgeInput, userId: string): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: data.funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 验证节点存在且属于该漏斗
    const [sourceNode, targetNode] = await Promise.all([
      this.prisma.node.findFirst({
        where: { id: data.sourceNodeId, funnelId: data.funnelId }
      }),
      this.prisma.node.findFirst({
        where: { id: data.targetNodeId, funnelId: data.funnelId }
      })
    ]);

    if (!sourceNode || !targetNode) {
      throw new ApiError('源节点或目标节点不存在', 404);
    }

    return this.prisma.edge.create({
      data,
      include: {
        sourceNode: true,
        targetNode: true
      }
    });
  }

  async getEdgeById(edgeId: string, userId: string): Promise<any> {
    const edge = await this.prisma.edge.findFirst({
      where: {
        id: edgeId,
        funnel: { userId }
      },
      include: {
        sourceNode: true,
        targetNode: true
      }
    });

    if (!edge) {
      throw new ApiError('连接不存在', 404);
    }

    return edge;
  }

  async deleteEdge(edgeId: string, userId: string): Promise<void> {
    const edge = await this.prisma.edge.findFirst({
      where: {
        id: edgeId,
        funnel: { userId }
      }
    });

    if (!edge) {
      throw new ApiError('连接不存在', 404);
    }

    await this.prisma.edge.delete({
      where: { id: edgeId }
    });
  }

  async getEdgeConversionFlow(edgeId: string, userId: string): Promise<any> {
    const edge = await this.getEdgeById(edgeId, userId);
    
    // 简化的转化流数据
    return {
      sourceNodeEntries: 0,
      targetNodeEntries: 0,
      flowConversionRate: null,
      weeklyFlows: []
    };
  }

  async validateEdge(funnelId: string, sourceNodeId: string, targetNodeId: string, userId: string): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      return {
        isValid: false,
        error: '漏斗不存在'
      };
    }

    // 检查连接是否已存在
    const existingEdge = await this.prisma.edge.findFirst({
      where: {
        funnelId,
        sourceNodeId,
        targetNodeId
      }
    });

    if (existingEdge) {
      return {
        isValid: false,
        error: '连接已存在'
      };
    }

    return {
      isValid: true
    };
  }

  async createBatchEdges(edges: CreateEdgeInput[], userId: string): Promise<any[]> {
    // 验证所有漏斗的所有权
    const funnelIds = [...new Set(edges.map(e => e.funnelId))];
    const userFunnels = await this.prisma.funnel.findMany({
      where: {
        id: { in: funnelIds },
        userId
      }
    });

    if (userFunnels.length !== funnelIds.length) {
      throw new ApiError('部分漏斗不存在或无权限', 404);
    }

    // 批量创建连接
    return this.prisma.$transaction(
      edges.map(edge => 
        this.prisma.edge.create({
          data: edge,
          include: {
            sourceNode: true,
            targetNode: true
          }
        })
      )
    );
  }

  async deleteBatchEdges(edgeIds: string[], userId: string): Promise<void> {
    // 验证所有连接的所有权
    const existingEdges = await this.prisma.edge.findMany({
      where: {
        id: { in: edgeIds },
        funnel: { userId }
      }
    });

    if (existingEdges.length !== edgeIds.length) {
      throw new ApiError('部分连接不存在或无权限', 404);
    }

    await this.prisma.edge.deleteMany({
      where: { id: { in: edgeIds } }
    });
  }

  async checkForCycles(funnelId: string, userId: string): Promise<boolean> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 简化的循环检测（应该实现图算法）
    return false;
  }
}