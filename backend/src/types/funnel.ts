import { Funnel, Node, Edge } from '@prisma/client';

export { Funnel };
export type { BenchmarkData as PrismaBenchmarkData, AdviceRule as PrismaAdviceRule } from '@prisma/client';

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

// ==============================================
// Funnel Template Types
// ==============================================

// 漏斗模板数据类型
export interface FunnelTemplateData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  version: string;
  metadata?: {
    description?: string;
    tags?: string[];
    createdWith?: string;
    [key: string]: any;
  };
}

// 创建漏斗模板输入类型
export interface CreateFunnelTemplateRequest {
  name: string;
  description?: string;
  templateData: FunnelTemplateData;
  isDefault?: boolean;
}

// 更新漏斗模板输入类型
export interface UpdateFunnelTemplateRequest {
  name?: string;
  description?: string;
  templateData?: FunnelTemplateData;
  isDefault?: boolean;
}

// 漏斗模板响应类型
export interface FunnelTemplate {
  id: string;
  name: string;
  description?: string;
  templateData: FunnelTemplateData;
  isDefault: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联数据
  creator?: {
    id: string;
    username: string;
    email: string;
  };
}

// 漏斗模板列表响应类型
export interface FunnelTemplateListItem {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  nodeCount: number;
  edgeCount: number;
  creator?: {
    id: string;
    username: string;
  };
}

// ==============================================
// Analysis and Metrics Types
// ==============================================

// 漏斗阶段数据类型
export interface FunnelStageData {
  visitors: number;
  converted: number;
  conversionRate: number;
}

// 漏斗指标数据类型
export interface FunnelMetricData {
  stage_1: FunnelStageData;
  stage_2: FunnelStageData;
  stage_3: FunnelStageData;
  stage_4: FunnelStageData;
}

// 基准数据类型
export interface BenchmarkData {
  id: string;
  industry: string;
  companySize?: string;
  region?: string;
  metricType: 'conversion_rate' | 'volume' | 'time' | 'quality';
  metricName: string;
  percentile: number;
  value: number;
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
  companySize?: string;
  region?: string;
  metricType: 'conversion_rate' | 'volume' | 'time' | 'quality';
  metricName: string;
  percentile: number;
  value: number;
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
}

// 建议规则类型
export interface AdviceRule {
  id: string;
  name: string;
  ruleType: string;
  conditions: any;
  advice: any;
  priority: number;
  isActive: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 生成建议类型
export interface GeneratedRecommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImpact: string;
  implementationTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  roiEstimate: number;
  resources: string[];
  successMetrics: string[];
  applicableStages: (keyof FunnelMetricData)[];
  customizedContent?: any;
}

// 诊断结果类型
export interface DiagnosticResult {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  healthScore: number;
  stageGrades: {
    stage_1: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_2: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_3: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
    stage_4: { grade: 'A' | 'B' | 'C' | 'D' | 'F'; percentile: number; status: string };
  };
  weakPoints: Array<{
    stage: keyof FunnelMetricData;
    severity: 'critical' | 'major' | 'minor';
    description: string;
    currentRate: number;
    benchmarkRate: number;
    improvementNeeded: number;
  }>;
  improvementPriorities: Array<{
    stage: keyof FunnelMetricData;
    priority: 'high' | 'medium' | 'low';
    impactScore: number;
    difficultyScore: number;
    roiEstimate: number;
  }>;
  crossStageAnalysis: {
    dropOffPoints: Array<{ from: string; to: string; dropOffRate: number; severity: string }>;
    flowConsistency: number;
    bottleneckStage: keyof FunnelMetricData | null;
  };
}

// 对比分析结果类型
export interface PeerComparisonResult {
  rankings: {
    stage_1: { percentile: number; rank: string };
    stage_2: { percentile: number; rank: string };
    stage_3: { percentile: number; rank: string };
    stage_4: { percentile: number; rank: string };
    overall: { percentile: number; rank: string };
  };
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  benchmarkData: any;
}

// 改进潜力分析类型
export interface ImprovementPotential {
  stage_1: { current: number; benchmark: number; potential: number; impact: number };
  stage_2: { current: number; benchmark: number; potential: number; impact: number };
  stage_3: { current: number; benchmark: number; potential: number; impact: number };
  stage_4: { current: number; benchmark: number; potential: number; impact: number };
  overallPotential: number;
}

// 分析请求参数类型
export interface AnalysisRequest {
  companyData: FunnelMetricData;
  industry: string;
  companySize?: string;
  region?: string;
  includeRecommendations?: boolean;
  includeDiagnostics?: boolean;
  includePeerComparison?: boolean;
  includeImprovementPotential?: boolean;
  maxRecommendations?: number;
}

// 完整分析响应类型
export interface AnalysisResponse {
  diagnostics?: DiagnosticResult;
  recommendations?: GeneratedRecommendation[];
  peerComparison?: PeerComparisonResult;
  improvementPotential?: ImprovementPotential;
  timestamp: Date;
}