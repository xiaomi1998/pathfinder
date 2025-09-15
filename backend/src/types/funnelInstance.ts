import { FunnelInstance, NodeInstance, FunnelInstanceStatus, MetricPeriodType } from '@prisma/client';

// ==============================================================
// Funnel Instance Types
// ==============================================================

export { FunnelInstance, NodeInstance, FunnelInstanceStatus, MetricPeriodType };

// Base funnel instance response type
export interface FunnelInstanceResponse extends FunnelInstance {
  funnel?: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    industry?: string;
  };
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  analytics?: FunnelInstanceAnalytics;
}

// Detailed funnel instance with node instances
export interface FunnelInstanceDetails extends FunnelInstanceResponse {
  nodeInstances: NodeInstanceResponse[];
  funnelMetrics?: FunnelMetricsResponse[];
  aiSessions?: AiSessionSummary[];
  performanceInsights?: PerformanceInsight[];
}

// Node instance response type
export interface NodeInstanceResponse extends NodeInstance {
  node?: {
    id: string;
    label: string;
    nodeType: string;
    isRequired: boolean;
  };
  nodeMetrics?: NodeMetricsResponse[];
  calculatedMetrics?: {
    conversionRate: number | null;
    revenuePerEntry: number | null;
    costPerConversion: number | null;
    efficiencyScore: number | null;
  };
}

// ==============================================================
// Create/Update Input Types
// ==============================================================

// Create funnel instance input
export interface CreateFunnelInstanceInput {
  funnelId: string; // Template reference
  name: string;
  description?: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  targetConversionRate?: number;
  targetRevenue?: number;
  budgetAllocated?: number;
  tags?: string[];
  notes?: string;
}

// Update funnel instance input
export interface UpdateFunnelInstanceInput {
  name?: string;
  description?: string;
  status?: FunnelInstanceStatus;
  targetConversionRate?: number;
  targetRevenue?: number;
  budgetAllocated?: number;
  tags?: string[];
  notes?: string;
}

// Bulk create instances from template
export interface BulkCreateInstancesInput {
  funnelId: string;
  instances: {
    name: string;
    description?: string;
    periodType: MetricPeriodType;
    periodStartDate: Date;
    periodEndDate: Date;
    targetConversionRate?: number;
    targetRevenue?: number;
    budgetAllocated?: number;
  }[];
}

// Update node instance data
export interface UpdateNodeInstanceInput {
  nodeInstanceId: string;
  customLabel?: string;
  currentEntryCount?: number;
  currentConvertedCount?: number;
  currentRevenue?: number;
  currentCost?: number;
  customConfig?: any;
}

// Batch update node instances
export interface BatchUpdateNodeInstancesInput {
  funnelInstanceId: string;
  updates: UpdateNodeInstanceInput[];
}

// ==============================================================
// Query and Filter Types
// ==============================================================

// Funnel instance query parameters
export interface FunnelInstanceQueryParams {
  funnelId?: string; // Template filter
  status?: FunnelInstanceStatus[];
  periodType?: MetricPeriodType;
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
  hasData?: boolean;
  minCompleteness?: number;
  maxCompleteness?: number;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  includeAnalytics?: boolean;
  includeNodeInstances?: boolean;
}

// Instance comparison filter
export interface InstanceComparisonFilter {
  instanceIds: string[];
  metrics?: string[];
  periodRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// Template usage analytics
export interface TemplateUsageAnalytics {
  funnelId: string;
  templateName: string;
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  avgCompleteness: number;
  avgConversionRate: number | null;
  totalRevenue: number | null;
  lastUsed: Date | null;
  popularPeriods: {
    periodType: MetricPeriodType;
    count: number;
  }[];
}

// ==============================================================
// Analytics and Reporting Types
// ==============================================================

// Instance analytics summary
export interface FunnelInstanceAnalytics {
  progressToTarget: {
    conversion: number | null; // % of target achieved
    revenue: number | null;
  };
  budgetUtilization: number | null; // % of budget used
  efficiency: number | null; // Revenue per unit cost
  timeToComplete: number | null; // Days from start to completion
  nodePerformance: {
    nodeId: string;
    nodeName: string;
    performance: 'excellent' | 'good' | 'average' | 'poor';
    conversionRate: number | null;
    bottleneckRisk: 'high' | 'medium' | 'low' | 'none';
  }[];
  trends: {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
  }[];
}

// Instance comparison result
export interface InstanceComparison {
  instances: FunnelInstanceResponse[];
  comparisonMetrics: {
    metric: string;
    values: { instanceId: string; value: number | null }[];
    winner: string | null; // Instance ID with best performance
    insights: string[];
  }[];
  relativePerformance: {
    instanceId: string;
    overallScore: number; // 0-100
    strengths: string[];
    weaknesses: string[];
  }[];
}

// Performance insight
export interface PerformanceInsight {
  type: 'opportunity' | 'risk' | 'achievement' | 'trend';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedNodes: string[];
  recommendedActions: string[];
  impact: {
    metric: string;
    estimatedImprovement: number;
    confidence: number; // 0-100
  };
}

// AI session summary
export interface AiSessionSummary {
  id: string;
  sessionContext: string;
  createdAt: Date;
  messageCount: number;
  topics: string[];
  recommendations: string[];
}

// ==============================================================
// Template Management Types
// ==============================================================

// Template with instance statistics
export interface FunnelTemplateWithStats {
  id: string;
  name: string;
  description?: string;
  category?: string;
  industry?: string;
  isPublic: boolean;
  instanceCount: number;
  lastUsedAt: Date | null;
  avgInstanceCompleteness: number;
  successRate: number; // % of instances marked as successful
  tags: string[];
  createdBy: {
    id: string;
    username: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

// Template instance creation wizard
export interface InstanceCreationWizard {
  template: {
    id: string;
    name: string;
    description?: string;
    nodeCount: number;
    recommendedPeriodType: MetricPeriodType;
    estimatedSetupTime: number; // minutes
  };
  configuration: {
    requiredFields: string[];
    optionalFields: string[];
    defaultValues: Partial<CreateFunnelInstanceInput>;
    validationRules: ValidationRule[];
  };
  examples: {
    name: string;
    description: string;
    periodType: MetricPeriodType;
    targets: {
      conversionRate: number;
      revenue: number;
    };
    tags: string[];
  }[];
}

// Validation rule for instance creation
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  condition?: string;
}

// ==============================================================
// Export and Import Types
// ==============================================================

// Instance export configuration
export interface InstanceExportConfig {
  instanceIds: string[];
  format: 'json' | 'csv' | 'xlsx';
  includeNodeInstances: boolean;
  includeMetrics: boolean;
  includeAnalytics: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

// Instance import configuration
export interface InstanceImportConfig {
  templateId: string;
  data: any;
  options: {
    createMissingNodes: boolean;
    updateExisting: boolean;
    validateData: boolean;
  };
}

// Import result
export interface InstanceImportResult {
  success: boolean;
  instancesCreated: number;
  instancesUpdated: number;
  errors: {
    row: number;
    message: string;
    data?: any;
  }[];
  warnings: {
    message: string;
    count: number;
  }[];
}

// ==============================================================
// Legacy Support Types
// ==============================================================

// For backward compatibility with existing funnel metrics types
export interface FunnelMetricsResponse {
  id: string;
  funnelInstanceId: string;
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  totalEntries: number;
  totalConversions: number;
  overallConversionRate: number | null;
  totalRevenue: number | null;
  totalCost: number | null;
  roi: number | null;
  efficiency: number | null;
  progressToTarget: number | null;
  budgetUtilization: number | null;
  calculatedMetrics?: {
    costPerConversion: number | null;
    revenuePerEntry: number | null;
    marginPerConversion: number | null;
  };
}

export interface NodeMetricsResponse {
  id: string;
  nodeInstanceId: string | null;
  nodeId: string; // Legacy support
  periodType: MetricPeriodType;
  periodStartDate: Date;
  periodEndDate: Date;
  entryCount: number;
  convertedCount: number;
  conversionRate: number | null;
  revenue: number | null;
  cost: number | null;
  retentionRate: number | null;
  engagementScore: number | null;
  qualityScore: number | null;
  calculatedMetrics?: {
    ctr: number | null;
    cpc: number | null;
    cpm: number | null;
    costPerConversion: number | null;
    revenuePerEntry: number | null;
    exitRate: number | null;
  };
}