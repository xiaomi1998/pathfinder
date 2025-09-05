import { User } from './user';
import { Funnel, FunnelTemplate } from './funnel';

// 组织用户角色枚举
export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}

// 计划类型枚举
export enum PlanType {
  FREE = 'free',
  PRO = 'pro', 
  ENTERPRISE = 'enterprise'
}

// 组织基础类型
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  planType: PlanType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 带关联的组织类型
export interface OrganizationWithRelations extends Organization {
  users?: User[];
  funnels?: Funnel[];
  funnelTemplates?: FunnelTemplate[];
  metricDatasets?: MetricDataset[];
  benchmarkData?: BenchmarkData[];
  adviceRules?: AdviceRule[];
  usageLimit?: OrgUsageLimit;
}

// 创建组织请求类型
export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  planType?: PlanType;
}

// 更新组织请求类型
export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
  planType?: PlanType;
  isActive?: boolean;
}


// 指标数据集类型
export interface MetricDataset {
  id: string;
  name: string;
  datasetType: string; // "conversion", "engagement", "revenue" etc.
  dataSource: string;  // "manual", "api", "import" etc.
  config: any;         // JSON configuration
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创建指标数据集请求类型
export interface CreateMetricDatasetRequest {
  name: string;
  datasetType: string;
  dataSource: string;
  config: any;
}

// 扩展的指标数据集类型，包含漏斗数据
export interface MetricDatasetWithFunnelData extends MetricDataset {
  funnelData?: FunnelMetricData;
  analysis?: AnalysisResult;
}

// 更新指标数据集请求类型
export interface UpdateMetricDatasetRequest {
  name?: string;
  datasetType?: string;
  dataSource?: string;
  config?: any;
}

// 漏斗阶段数据类型
export interface FunnelStageData {
  visitors: number;
  converted: number;
  conversionRate?: number; // 自动计算
}

// 4阶段漏斗数据类型
export interface FunnelMetricData {
  stage_1: FunnelStageData; // 线索
  stage_2: FunnelStageData; // 有效触达
  stage_3: FunnelStageData; // 商机
  stage_4: FunnelStageData; // 成交
}

// 漏斗数据集创建请求类型
export interface CreateFunnelMetricDatasetRequest {
  name: string;
  description?: string;
  stageData: FunnelMetricData;
  industry?: string;
  dataSource?: string;
}

// 分析结果类型
export interface AnalysisResult {
  id: string;
  datasetId: string;
  companyData: FunnelMetricData & {
    overallConversionRate: number;
    stageNames: string[];
  };
  benchmarkData: {
    industry: string;
    averageRates: FunnelMetricData;
    percentiles: {
      p25: FunnelMetricData;
      p50: FunnelMetricData;
      p75: FunnelMetricData;
      p90: FunnelMetricData;
    };
  };
  comparison: {
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    improvementPotential: {
      stage_1: number;
      stage_2: number;
      stage_3: number;
      stage_4: number;
    };
    recommendations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// 获取分析数据的查询参数
export interface AnalysisQueryParams {
  includeBenchmarks?: boolean;
  includeSuggestions?: boolean;
}

// 基准数据类型
export interface BenchmarkData {
  id: string;
  industry: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number; // P10, P25, P50, P75, P90等
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创建基准数据请求类型
export interface CreateBenchmarkDataRequest {
  industry: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number;
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
}

// 建议规则类型
export interface AdviceRule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;    // "conversion", "engagement", "revenue", "general"
  conditions: any;     // JSON for trigger conditions
  advice: any;         // JSON for advice content
  priority: number;    // 1-10
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 创建建议规则请求类型
export interface CreateAdviceRuleRequest {
  name: string;
  description?: string;
  ruleType: string;
  conditions: any;
  advice: any;
  priority?: number;
  isActive?: boolean;
}

// 更新建议规则请求类型
export interface UpdateAdviceRuleRequest {
  name?: string;
  description?: string;
  ruleType?: string;
  conditions?: any;
  advice?: any;
  priority?: number;
  isActive?: boolean;
}

// 组织使用限制类型
export interface OrgUsageLimit {
  id: string;
  organizationId: string;
  maxFunnels: number;
  maxTemplates: number;
  maxUsers: number;
  currentFunnels: number;
  currentTemplates: number;
  currentUsers: number;
  planType: PlanType;
  createdAt: Date;
  updatedAt: Date;
}

// 更新使用限制请求类型
export interface UpdateOrgUsageLimitRequest {
  maxFunnels?: number;
  maxTemplates?: number;
  maxUsers?: number;
  planType?: PlanType;
}

// 组织统计类型
export interface OrganizationStats {
  totalUsers: number;
  activeFunnels: number;
  totalTemplates: number;
  usagePercentage: {
    funnels: number;
    templates: number;
    users: number;
  };
}

// 组织查询参数类型
export interface OrganizationQueryParams {
  planType?: PlanType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}