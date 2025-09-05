import { Funnel, Node, Edge } from '@prisma/client';

// 漏斗创建输入类型
export interface CreateFunnelInput {
  name: string;
  description?: string;
  canvasData?: any;
}

// 漏斗更新输入类型
export interface UpdateFunnelInput {
  name?: string;
  description?: string;
  canvasData?: any;
}

// 漏斗响应类型（包含关联数据）
export interface FunnelResponse extends Funnel {
  nodeCount?: number;
  edgeCount?: number;
  lastModified?: Date;
}

// 漏斗详情类型（包含节点和边）
export interface FunnelDetails extends Funnel {
  nodes: Node[];
  edges: Edge[];
}

// 漏斗统计类型
export interface FunnelStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  totalDataEntries: number;
  averageConversionRate: number | null;
  lastDataUpdate: Date | null;
}

// 漏斗性能类型
export interface FunnelPerformance {
  funnelId: string;
  funnelName: string;
  overallConversionRate: number | null;
  totalEntries: number;
  totalConversions: number;
  performanceScore: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  bottlenecks: {
    nodeId: string;
    nodeName: string;
    conversionRate: number;
    impact: 'high' | 'medium' | 'low';
  }[];
}

// 画布数据类型
export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    [key: string]: any;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: any;
}