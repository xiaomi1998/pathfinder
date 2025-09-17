import { FunnelMetrics, NodeMetrics, MetricPeriodType } from '@prisma/client';

// ==============================================================
// Funnel Metrics Types
// ==============================================================

export { FunnelMetrics, NodeMetrics, MetricPeriodType };

// 创建漏斗指标输入类型
export interface CreateFunnelMetricsInput {
  funnelId: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  totalEntries?: number;
  totalConversions?: number;
  totalRevenue?: number;
  totalCost?: number;
  avgTimeSpent?: number;
  notes?: string;
  customMetrics?: any;
}

// 更新漏斗指标输入类型
export interface UpdateFunnelMetricsInput {
  totalEntries?: number;
  totalConversions?: number;
  totalRevenue?: number;
  totalCost?: number;
  avgTimeSpent?: number;
  notes?: string;
  customMetrics?: any;
}

// 漏斗指标响应类型
export interface FunnelMetricsResponse extends FunnelMetrics {
  funnel?: {
    id: string;
    name: string;
    description?: string;
  };
  calculatedMetrics?: {
    overallConversionRate: number | null;
    roi: number | null;
    bounceRate: number | null;
    costPerConversion: number | null;
    revenuePerEntry: number | null;
  };
}

// 漏斗指标详情类型（包含节点指标）
export interface FunnelMetricsDetails extends FunnelMetricsResponse {
  nodeMetrics: NodeMetricsResponse[];
}

// ==============================================================
// Node Metrics Types
// ==============================================================

// 创建节点指标输入类型
export interface CreateNodeMetricsInput {
  nodeId: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  entryCount?: number;
  exitCount?: number;
  convertedCount?: number;
  bounceCount?: number;
  avgTimeSpent?: number;
  revenue?: number;
  cost?: number;
  impressions?: number;
  clicks?: number;
  notes?: string;
  customMetrics?: any;
}

// 更新节点指标输入类型
export interface UpdateNodeMetricsInput {
  entryCount?: number;
  exitCount?: number;
  convertedCount?: number;
  bounceCount?: number;
  avgTimeSpent?: number;
  revenue?: number;
  cost?: number;
  impressions?: number;
  clicks?: number;
  notes?: string;
  customMetrics?: any;
}

// 节点指标响应类型
export interface NodeMetricsResponse extends NodeMetrics {
  node?: {
    id: string;
    label: string;
    nodeType: string;
  };
  calculatedMetrics?: {
    conversionRate: number | null;
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
    costPerConversion: number | null;
    revenuePerEntry: number | null;
    exitRate: number | null;
  };
}

// 节点指标详情类型
export interface NodeMetricsDetails extends NodeMetricsResponse {
  performanceTrend: MetricTrend[];
  benchmarkComparison?: BenchmarkComparison;
}

// ==============================================================
// Batch Operations Types
// ==============================================================

// 批量创建节点指标输入类型
export interface BatchCreateNodeMetricsInput {
  nodeMetrics: CreateNodeMetricsInput[];
}

// 批量更新节点指标输入类型
export interface BatchUpdateNodeMetricsInput {
  updates: {
    id: string;
    data: UpdateNodeMetricsInput;
  }[];
}

// ==============================================================
// Query and Filter Types
// ==============================================================

// 指标查询参数类型
export interface MetricsQueryParams {
  funnelId?: string;
  nodeId?: string;
  periodType?: MetricPeriodType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 指标筛选条件类型
export interface MetricsFilter {
  periodType?: MetricPeriodType[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  nodeTypes?: string[];
  minConversionRate?: number;
  maxConversionRate?: number;
  minRevenue?: number;
  maxRevenue?: number;
}

// ==============================================================
// Analytics and Reporting Types
// ==============================================================

// 指标趋势类型
export interface MetricTrend {
  periodStartDate: Date;
  periodEndDate: Date;
  value: number;
  change: number | null;
  changePercentage: number | null;
  trend: 'up' | 'down' | 'stable';
}

// 指标对比类型
export interface MetricsComparison {
  current: FunnelMetricsResponse;
  previous: FunnelMetricsResponse | null;
  changes: {
    totalEntries: number;
    totalConversions: number;
    overallConversionRate: number | null;
    totalRevenue: number | null;
    roi: number | null;
  };
  percentageChanges: {
    totalEntries: number | null;
    totalConversions: number | null;
    overallConversionRate: number | null;
    totalRevenue: number | null;
    roi: number | null;
  };
}

// 基准对比类型
export interface BenchmarkComparison {
  metricName: string;
  currentValue: number;
  benchmarkValue: number;
  percentile: number;
  performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  improvement: number;
}

// 漏斗性能报告类型
export interface FunnelPerformanceReport {
  funnelId: string;
  funnelName: string;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
    periodType: MetricPeriodType;
  };
  overallMetrics: FunnelMetricsResponse;
  nodePerformances: NodePerformanceReport[];
  keyInsights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
}

// 节点性能报告类型
export interface NodePerformanceReport {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  metrics: NodeMetricsResponse;
  trend: MetricTrend[];
  performance: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  bottleneckRisk: 'high' | 'medium' | 'low' | 'none';
}

// 性能洞察类型
export interface PerformanceInsight {
  type: 'improvement' | 'decline' | 'opportunity' | 'risk';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedNodes: string[];
  impact: number;
  confidence: number;
}

// 性能建议类型
export interface PerformanceRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'optimization' | 'targeting' | 'content' | 'technical';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  roiEstimate: number;
  affectedMetrics: string[];
}

// ==============================================================
// Data Entry and Template Types
// ==============================================================

// 数据录入模板类型
export interface DataEntryTemplate {
  funnelId: string;
  funnelName: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  nodeTemplates: NodeDataTemplate[];
  requiredFields: string[];
  optionalFields: string[];
  validationRules: ValidationRule[];
}

// 节点数据录入模板类型
export interface NodeDataTemplate {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  position: number;
  requiredMetrics: string[];
  optionalMetrics: string[];
  defaultValues?: Partial<CreateNodeMetricsInput>;
  validationRules?: ValidationRule[];
}

// 验证规则类型
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'range' | 'custom';
  value?: any;
  message: string;
  condition?: string;
}

// 数据录入会话类型
export interface DataEntrySession {
  id: string;
  funnelId: string;
  userId: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  completedNodes: string[];
  totalNodes: number;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ==============================================================
// Export Types
// ==============================================================

// 导出配置类型
export interface MetricsExportConfig {
  format: 'json' | 'csv' | 'xlsx';
  includeCalculatedMetrics: boolean;
  includeNodeMetrics: boolean;
  includeTrends: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  periodTypes?: MetricPeriodType[];
  nodeTypes?: string[];
}

// 导出数据类型
export interface MetricsExportData {
  filename: string;
  contentType: string;
  data: string | Buffer;
  metadata: {
    funnelId: string;
    funnelName: string;
    exportDate: Date;
    recordCount: number;
    periodRange: {
      startDate: Date;
      endDate: Date;
    };
  };
}