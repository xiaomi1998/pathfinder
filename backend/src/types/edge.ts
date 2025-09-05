import { Edge, Node } from '@prisma/client';

// 边创建输入类型
export interface CreateEdgeInput {
  funnelId: string;
  sourceNodeId: string;
  targetNodeId: string;
}

// 边响应类型（包含节点信息）
export interface EdgeResponse extends Edge {
  sourceNode?: Pick<Node, 'id' | 'label' | 'nodeType'>;
  targetNode?: Pick<Node, 'id' | 'label' | 'nodeType'>;
}

// 边详情类型
export interface EdgeDetails extends Edge {
  sourceNode: Node;
  targetNode: Node;
  conversionFlow?: EdgeConversionFlow;
}

// 边转化流类型
export interface EdgeConversionFlow {
  sourceNodeEntries: number;
  targetNodeEntries: number;
  flowConversionRate: number | null;
  weeklyFlows: {
    weekStartDate: Date;
    sourceEntries: number;
    targetEntries: number;
    flowRate: number | null;
  }[];
}

// 边验证结果类型
export interface EdgeValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}