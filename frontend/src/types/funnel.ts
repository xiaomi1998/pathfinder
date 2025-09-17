export type DataPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Funnel {
  id: string
  name: string
  description?: string
  user_id: string
  status: 'active' | 'archived'
  dataPeriod?: DataPeriod
  nodes: FunnelNode[]
  edges: FunnelEdge[]
  settings: FunnelSettings
  analytics: FunnelAnalytics
  created_at: Date
  updated_at: Date
  published_at?: Date
  // Canvas data compatibility
  canvasData?: {
    nodes: FunnelNode[]
    edges: FunnelEdge[]
  }
  // Count compatibility
  nodeCount?: number
  edgeCount?: number
}

export interface FunnelNode {
  id: string
  type: NodeType
  position: Position
  data: NodeData
  style?: NodeStyle
  metadata?: NodeMetadata
}

export interface FunnelEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  data: EdgeData
  style?: EdgeStyle
  metadata?: EdgeMetadata
}

export type NodeType = 
  | 'start'
  | 'end' 
  | 'event'
  | 'condition'
  | 'action'
  | 'delay'
  | 'split'
  | 'merge'

export type EdgeType = 
  | 'default'
  | 'conditional'
  | 'fallback'
  | 'trigger'

export interface Position {
  x: number
  y: number
}

export interface NodeData {
  label: string
  description?: string
  config: NodeConfig
  validation?: ValidationRule[]
  // Structure-only mode: no data values stored in template
}

export interface EdgeData {
  label?: string
  condition?: EdgeCondition
  weight?: number
  config: EdgeConfig
}

export interface NodeConfig {
  [key: string]: any
  // Event node config
  event_name?: string
  event_properties?: Record<string, any>
  
  // Condition node config
  conditions?: ConditionRule[]
  
  // Action node config
  action_type?: string
  action_params?: Record<string, any>
  
  // Delay node config
  delay_type?: 'fixed' | 'dynamic'
  delay_value?: number
  delay_unit?: 'seconds' | 'minutes' | 'hours' | 'days'
  
  // Split node config
  split_type?: 'random' | 'weighted' | 'property'
  split_ratio?: number[]
  split_property?: string
}

export interface EdgeConfig {
  [key: string]: any
  priority?: number
  enabled?: boolean
}

export interface ConditionRule {
  property: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists'
  value: any
  logical_operator?: 'and' | 'or'
}

export interface EdgeCondition {
  rules: ConditionRule[]
  logic?: 'and' | 'or'
}

export interface ValidationRule {
  type: 'required' | 'format' | 'range' | 'custom'
  message: string
  params?: Record<string, any>
}

export interface NodeStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  textColor?: string
  width?: number
  height?: number
  borderRadius?: number
}

export interface EdgeStyle {
  strokeColor?: string
  strokeWidth?: number
  strokeDasharray?: string
  markerEnd?: string
}

export interface NodeMetadata {
  created_at: Date
  updated_at: Date
  version: number
  tags?: string[]
  notes?: string
}

export interface EdgeMetadata {
  created_at: Date
  updated_at: Date
  version: number
  tags?: string[]
  notes?: string
}

export interface FunnelSettings {
  auto_save: boolean
  save_interval: number // seconds
  grid_enabled: boolean
  grid_size: number
  snap_to_grid: boolean
  theme: 'light' | 'dark'
  zoom_level: number
  pan_position: Position
}

export interface FunnelAnalytics {
  total_sessions: number
  unique_users: number
  conversion_rate: number
  average_time: number // milliseconds
  drop_off_rate: number
  node_analytics: NodeAnalytics[]
  edge_analytics: EdgeAnalytics[]
  last_calculated_at: Date
}

export interface NodeAnalytics {
  node_id: string
  visits: number
  unique_visits: number
  conversion_rate: number
  average_time_spent: number
  drop_off_count: number
  drop_off_rate: number
}

export interface EdgeAnalytics {
  edge_id: string
  traversals: number
  conversion_rate: number
  average_traversal_time: number
}

export interface CreateFunnelRequest {
  name: string
  description?: string
  dataPeriod?: DataPeriod
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<FunnelSettings>
  canvasData?: any
}

export interface UpdateFunnelRequest {
  name?: string
  description?: string
  status?: Funnel['status']
  dataPeriod?: DataPeriod
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<FunnelSettings>
  canvasData?: any
}

export interface DuplicateFunnelRequest {
  name: string
  description?: string
}

export interface FunnelListItem {
  id: string
  name: string
  description?: string
  status: Funnel['status']
  node_count: number
  edge_count: number
  conversion_rate?: number
  last_session_count: number
  created_at: Date
  updated_at: Date
  published_at?: Date
}

export interface FunnelFilters {
  status?: Funnel['status'][]
  search?: string
  created_after?: Date
  created_before?: Date
  has_analytics?: boolean
}

export interface FunnelSort {
  field: 'name' | 'created_at' | 'updated_at' | 'conversion_rate'
  order: 'asc' | 'desc'
}

// Structure-focused types for the new funnel builder
export interface FunnelTemplate {
  id: string
  name: string
  description?: string
  user_id: string
  structure: FunnelStructure
  metadata: TemplateMetadata
  created_at: Date
  updated_at: Date
}

export interface FunnelStructure {
  nodes: StructureNode[]
  connections: StructureConnection[]
  layout?: CanvasLayout
}

export interface StructureNode {
  id: string
  type: NodeType
  label: string
  description?: string
  position: Position
  style?: NodeStyle
  metadata?: {
    category?: string
    tags?: string[]
    requirements?: string[]
  }
}

export interface StructureConnection {
  id: string
  from: string
  to: string
  fromAnchor: 'top' | 'right' | 'bottom' | 'left'
  toAnchor: 'top' | 'right' | 'bottom' | 'left'
  type: 'default' | 'conditional' | 'fallback' | 'parallel'
  label?: string
  description?: string
}

export interface CanvasLayout {
  zoom: number
  panX: number
  panY: number
  gridEnabled?: boolean
  snapToGrid?: boolean
}

export interface TemplateMetadata {
  version: string
  author?: string
  category?: 'marketing' | 'sales' | 'support' | 'product' | 'custom'
  complexity?: 'simple' | 'medium' | 'complex'
  estimatedSetupTime?: string
  requiredIntegrations?: string[]
  tags?: string[]
  notes?: string
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  structure: FunnelStructure
  metadata?: Partial<TemplateMetadata>
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  structure?: FunnelStructure
  metadata?: Partial<TemplateMetadata>
}

// Analysis types
export interface AnalysisRequest {
  funnelId: string
  timeRange: {
    start: Date
    end: Date
  }
  includeComparison?: boolean
  includeRecommendations?: boolean
}

export interface AnalysisResponse {
  funnelId: string
  diagnostics: DiagnosticResult[]
  recommendations: GeneratedRecommendation[]
  peerComparison?: PeerComparisonResult
  improvementPotential: ImprovementPotential
  metricData: FunnelMetricData
  generatedAt: Date
}

export interface DiagnosticResult {
  id: string
  category: 'performance' | 'conversion' | 'user_experience' | 'technical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  metric: string
  currentValue: number
  benchmarkValue?: number
  impact: string
  recommendations: string[]
  dataPoints: Array<{
    date: Date
    value: number
  }>
  // Additional properties for DiagnosticBar component
  healthScore: number
  overallGrade: string
  stageGrades: Record<string, {
    score: number
    grade: string
    label: string
    status: string
  }>
  weakPoints: Array<{
    id: string
    title: string
    description: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    impact: string
    recommendations: string[]
  }>
  improvementPriorities: Array<{
    id: string
    title: string
    description: string
    priority: number
    estimatedImpact: string
    difficulty: 'easy' | 'medium' | 'hard'
    timeframe: string
  }>
}

export interface GeneratedRecommendation {
  id: string
  title: string
  description: string
  category: 'traffic_acquisition' | 'landing_page_optimization' | 'user_experience_improvement' | 'content_optimization' | 'technical_performance' | 'personalization' | 'conversion_path_optimization' | 'customer_service_improvement' | 'pricing_strategy_adjustment'
  priority: 'high' | 'medium' | 'low'
  difficulty: 'easy' | 'medium' | 'hard'
  implementationTime: string
  expectedImpact: string
  roiEstimate: number
  actionItems: string[]
  resources: string[]
  successMetrics: string[]
  applicableStages: string[]
  customizedContent?: {
    currentPerformance?: {
      overall: number
    }
    targetImprovement?: {
      overall?: number
    }
  }
}

export interface PeerComparisonResult {
  industry: string
  segment: string
  metricComparisons: Array<{
    metric: string
    yourValue: number
    industryAverage: number
    topPercentile: number
    percentile: number
  }>
  ranking: {
    overall: number
    category: string
  }
}

export interface ImprovementPotential {
  overall: {
    currentRate: number
    potentialRate: number
    improvementPercentage: number
  }
  byStage: Array<{
    stage: string
    currentRate: number
    potentialRate: number
    improvementPercentage: number
    priority: 'high' | 'medium' | 'low'
  }>
}

export interface FunnelMetricData {
  conversionRates: Array<{
    stage: string
    rate: number
    count: number
  }>
  timeSeriesData: Array<{
    date: Date
    stage: string
    value: number
  }>
  demographics: Array<{
    segment: string
    conversionRate: number
    volume: number
  }>
}

// Funnel Instance Types
export type FunnelInstanceStatus = 'draft' | 'active' | 'in_progress' | 'completed' | 'paused' | 'archived'

export interface FunnelInstance {
  id: string
  name: string
  description?: string
  funnelTemplateId: string
  userId: string
  organizationId?: string
  status: FunnelInstanceStatus
  periodStartDate?: Date
  periodEndDate?: Date
  instanceData?: any
  tags: string[]
  notes?: string
  isActive: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  // Relations
  funnelTemplate?: {
    id: string
    name: string
    description?: string
  }
  user?: {
    id: string
    username: string
    email: string
  }
  instanceMetrics?: FunnelInstanceMetrics[]
}

export interface FunnelInstanceMetrics {
  id: string
  instanceId: string
  periodType: 'weekly' | 'monthly'
  periodStartDate: Date
  periodEndDate: Date
  totalEntries: number
  totalConversions: number
  overallConversionRate?: number
  totalRevenue?: number
  totalCost?: number
  roi?: number
  avgTimeSpent?: number
  bounceRate?: number
  notes?: string
  customMetrics?: any
  createdAt: Date
  updatedAt: Date
}

export interface FunnelInstanceListItem {
  id: string
  name: string
  description?: string
  funnelTemplateId: string
  status: FunnelInstanceStatus
  periodStartDate?: Date
  periodEndDate?: Date
  tags: string[]
  isActive: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  funnelTemplate?: {
    name: string
  }
  metricsCount: number
  latestMetrics?: {
    overallConversionRate?: number
    totalRevenue?: number
  }
}

export interface CreateFunnelInstanceRequest {
  name: string
  description?: string
  funnelTemplateId: string
  periodStartDate?: Date
  periodEndDate?: Date
  tags?: string[]
  notes?: string
}

export interface UpdateFunnelInstanceRequest {
  name?: string
  description?: string
  status?: FunnelInstanceStatus
  periodStartDate?: Date
  periodEndDate?: Date
  instanceData?: any
  tags?: string[]
  notes?: string
  isActive?: boolean
}

export interface InstanceUsageStats {
  templateId: string
  templateName: string
  totalInstances: number
  activeInstances: number
  completedInstances: number
  draftInstances: number
  averageConversionRate?: number
  totalRevenue?: number
  lastUsed?: Date
}

export interface InstanceComparison {
  instanceId: string
  instanceName: string
  metrics: FunnelInstanceMetrics[]
}

export interface BulkInstanceOperationRequest {
  instanceIds: string[]
  operation: 'archive' | 'activate' | 'pause' | 'delete'
}

export interface TemplateUsageTracking {
  templateId: string
  usageCount: number
  lastUsedAt: Date
  popularTags: string[]
  averageCompletionTime?: number
}

export interface InstanceFilters {
  status?: FunnelInstanceStatus[]
  templateId?: string
  search?: string
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  periodStartAfter?: Date
  periodStartBefore?: Date
}

export interface InstanceSort {
  field: 'name' | 'status' | 'createdAt' | 'updatedAt' | 'periodStartDate'
  order: 'asc' | 'desc'
}