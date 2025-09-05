import { Node, NodeData, NodeType } from '@prisma/client';

// 节点创建输入类型
export interface CreateNodeInput {
  funnelId: string;
  nodeType: NodeType;
  label: string;
  positionX: number;
  positionY: number;
}

// 节点更新输入类型
export interface UpdateNodeInput {
  label?: string;
  positionX?: number;
  positionY?: number;
}

// 节点响应类型（包含数据）
export interface NodeResponse extends Node {
  data?: NodeData[];
  latestData?: NodeData;
  totalEntries?: number;
  totalConversions?: number;
  averageConversionRate?: number | null;
}

// 节点详情类型
export interface NodeDetails extends Node {
  data: NodeData[];
  incomingEdges: number;
  outgoingEdges: number;
}

// 节点数据创建输入类型
export interface CreateNodeDataInput {
  nodeId: string;
  weekStartDate: Date;
  entryCount: number;
  convertedCount: number;
}

// 节点数据更新输入类型
export interface UpdateNodeDataInput {
  entryCount?: number;
  convertedCount?: number;
}

// 节点统计类型
export interface NodeStats {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  totalEntries: number;
  totalConversions: number;
  averageConversionRate: number | null;
  bestWeekConversionRate: number | null;
  worstWeekConversionRate: number | null;
  dataPointsCount: number;
  lastDataUpdate: Date | null;
  performanceCategory: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
}

// 节点性能趋势类型
export interface NodePerformanceTrend {
  weekStartDate: Date;
  entryCount: number;
  convertedCount: number;
  conversionRate: number | null;
  trend: 'up' | 'down' | 'stable';
  weekOverWeekChange: number | null;
}

// 节点类型统计
export interface NodeTypeStats {
  nodeType: NodeType;
  count: number;
  averageConversionRate: number | null;
  totalEntries: number;
  totalConversions: number;
  performanceDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    critical: number;
  };
}