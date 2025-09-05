import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateNodeInput, UpdateNodeInput, CreateNodeDataInput, UpdateNodeDataInput } from '@/types';
import { ApiError } from '@/utils/ApiError';

export class NodeService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createNode(data: CreateNodeInput, userId: string): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: data.funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    return this.prisma.node.create({ data });
  }

  async getNodeById(nodeId: string, userId: string): Promise<any> {
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      },
      include: {
        nodeData: true
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    return node;
  }

  async updateNode(nodeId: string, data: UpdateNodeInput, userId: string): Promise<any> {
    // 验证节点所有权
    const existingNode = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!existingNode) {
      throw new ApiError('节点不存在', 404);
    }

    return this.prisma.node.update({
      where: { id: nodeId },
      data
    });
  }

  async deleteNode(nodeId: string, userId: string): Promise<void> {
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    await this.prisma.node.delete({
      where: { id: nodeId }
    });
  }

  async getNodeData(nodeId: string, userId: string, options: any): Promise<any> {
    // 验证节点所有权
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.nodeData.findMany({
        where: { nodeId },
        skip,
        take: limit,
        orderBy: { weekStartDate: 'desc' }
      }),
      this.prisma.nodeData.count({ where: { nodeId } })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data,
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

  async createNodeData(data: CreateNodeDataInput, userId: string): Promise<any> {
    // 验证节点所有权
    const node = await this.prisma.node.findFirst({
      where: {
        id: data.nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    // 计算转化率
    const conversionRate = data.entryCount > 0 
      ? Number((data.convertedCount / data.entryCount).toFixed(4))
      : null;

    return this.prisma.nodeData.create({
      data: {
        ...data,
        conversionRate
      }
    });
  }

  async updateNodeData(nodeId: string, dataId: string, data: UpdateNodeDataInput, userId: string): Promise<any> {
    // 验证节点所有权
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    const existingData = await this.prisma.nodeData.findFirst({
      where: { id: dataId, nodeId }
    });

    if (!existingData) {
      throw new ApiError('节点数据不存在', 404);
    }

    // 重新计算转化率
    let conversionRate = existingData.conversionRate;
    const entryCount = data.entryCount ?? existingData.entryCount;
    const convertedCount = data.convertedCount ?? existingData.convertedCount;

    if (entryCount > 0) {
      conversionRate = new Decimal((convertedCount / entryCount).toFixed(4));
    }

    return this.prisma.nodeData.update({
      where: { id: dataId },
      data: {
        ...data,
        conversionRate
      }
    });
  }

  async deleteNodeData(nodeId: string, dataId: string, userId: string): Promise<void> {
    // 验证节点所有权
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    const existingData = await this.prisma.nodeData.findFirst({
      where: { id: dataId, nodeId }
    });

    if (!existingData) {
      throw new ApiError('节点数据不存在', 404);
    }

    await this.prisma.nodeData.delete({
      where: { id: dataId }
    });
  }

  async getNodeStats(nodeId: string, userId: string): Promise<any> {
    // 验证节点所有权并获取统计数据
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    // 简化的统计实现
    return {
      nodeId,
      nodeName: node.label,
      nodeType: node.nodeType,
      totalEntries: 0,
      totalConversions: 0,
      averageConversionRate: null,
      performanceCategory: 'average'
    };
  }

  async getNodeTrends(nodeId: string, weeks: number, userId: string): Promise<any> {
    // 验证节点所有权
    const node = await this.prisma.node.findFirst({
      where: {
        id: nodeId,
        funnel: { userId }
      }
    });

    if (!node) {
      throw new ApiError('节点不存在', 404);
    }

    // 简化的趋势数据
    return [];
  }

  async updateNodePositions(nodes: any[], userId: string): Promise<any[]> {
    // 验证所有节点的所有权
    const nodeIds = nodes.map(n => n.id);
    const existingNodes = await this.prisma.node.findMany({
      where: {
        id: { in: nodeIds },
        funnel: { userId }
      }
    });

    if (existingNodes.length !== nodes.length) {
      throw new ApiError('部分节点不存在或无权限', 404);
    }

    // 批量更新位置
    const updatePromises = nodes.map(node =>
      this.prisma.node.update({
        where: { id: node.id },
        data: {
          positionX: node.positionX,
          positionY: node.positionY
        }
      })
    );

    return Promise.all(updatePromises);
  }
}