// Metrics data entry types for funnel-based analytics

export interface MetricDataEntry {
  id: string
  funnelId: string
  nodeId: string
  nodeName: string
  period: MetricsPeriod
  metrics: FunnelNodeMetrics
  metadata?: MetricsMetadata
  createdAt: Date
  updatedAt: Date
}

export interface FunnelNodeMetrics {
  // Core volume metrics
  totalVisitors?: number
  uniqueVisitors?: number
  newVisitors?: number
  returningVisitors?: number
  
  // Conversion metrics
  conversions?: number
  conversionRate?: number
  
  // Time-based metrics
  averageTimeSpent?: number // in seconds
  medianTimeSpent?: number
  bounceRate?: number
  
  // Cost metrics
  acquisitionCost?: number
  totalCost?: number
  costPerConversion?: number
  
  // Revenue metrics
  revenue?: number
  averageOrderValue?: number
  
  // Engagement metrics
  engagementScore?: number
  clickThroughRate?: number
  
  // Custom metrics (flexible for different funnel stages)
  customMetrics?: Record<string, number>
}

export interface MetricsPeriod {
  type: 'weekly' | 'monthly' | 'custom'
  startDate: Date
  endDate: Date
  label: string // e.g., "Week 12, 2024" or "March 2024"
}

export interface MetricsMetadata {
  source?: string
  confidence?: number // 0-1 scale
  methodology?: string
  notes?: string
  tags?: string[]
  verified?: boolean
  verifiedBy?: string
  verifiedAt?: Date
}

// Form and UI related types

export interface MetricsTableColumn {
  key: keyof FunnelNodeMetrics | 'nodeName' | 'actions'
  label: string
  type: 'number' | 'percentage' | 'currency' | 'time' | 'text'
  required?: boolean
  editable?: boolean
  validation?: MetricValidationRule[]
  format?: MetricsNumberFormat
  width?: string
  group?: string // For grouping related columns
}

export interface MetricValidationRule {
  type: 'required' | 'min' | 'max' | 'range' | 'percentage' | 'positive' | 'custom'
  value?: number | [number, number]
  message: string
  validator?: (value: number) => boolean | string
}

export interface MetricsNumberFormat {
  type: 'number' | 'percentage' | 'currency' | 'time'
  decimals?: number
  prefix?: string
  suffix?: string
  locale?: string
  currency?: string
}

export interface DynamicMetricsTableConfig {
  columns: MetricsTableColumn[]
  allowAdd?: boolean
  allowRemove?: boolean
  allowReorder?: boolean
  validation?: boolean
  autoSave?: boolean
  saveInterval?: number // milliseconds
}

// Period selector types

export interface PeriodOption {
  value: string
  label: string
  type: MetricsPeriod['type']
  startDate: Date
  endDate: Date
  disabled?: boolean
}

export interface PeriodSelectorConfig {
  allowCustomRange?: boolean
  defaultPeriod?: 'current_week' | 'current_month' | 'last_week' | 'last_month'
  availablePeriods?: ('weekly' | 'monthly' | 'custom')[]
  maxHistoricalPeriods?: number
}

// API related types

export interface CreateMetricsRequest {
  funnelId: string
  period: MetricsPeriod
  entries: Array<{
    nodeId: string
    metrics: FunnelNodeMetrics
    metadata?: MetricsMetadata
  }>
}

export interface UpdateMetricsRequest {
  entries: Array<{
    id?: string // If updating existing
    nodeId: string
    metrics: Partial<FunnelNodeMetrics>
    metadata?: Partial<MetricsMetadata>
  }>
}

export interface MetricsQueryParams {
  funnelId: string
  periodType?: MetricsPeriod['type']
  startDate?: Date
  endDate?: Date
  nodeIds?: string[]
  includeMetadata?: boolean
}

export interface MetricsResponse {
  entries: MetricDataEntry[]
  summary: MetricsSummary
  period: MetricsPeriod
  funnel: {
    id: string
    name: string
    nodeCount: number
  }
}

export interface MetricsSummary {
  totalVisitors: number
  overallConversionRate: number
  totalRevenue: number
  averageTimeInFunnel: number
  dropoffPoints: Array<{
    nodeId: string
    nodeName: string
    dropoffRate: number
    impact: 'high' | 'medium' | 'low'
  }>
  trends: {
    visitorsChange: number // percentage change from previous period
    conversionChange: number
    revenueChange: number
  }
}

// Store types

export interface MetricsStoreState {
  // Current data
  entries: MetricDataEntry[]
  currentFunnelId: string | null
  currentPeriod: MetricsPeriod | null
  
  // UI state
  isLoading: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  
  // Table state
  selectedNodeIds: string[]
  tableConfig: DynamicMetricsTableConfig
  
  // Filters
  filters: {
    search: string
    nodeTypes: string[]
    dateRange: { start: Date; end: Date } | null
  }
  
  // Cache
  cachedSummaries: Record<string, MetricsSummary> // key: funnelId_period
  lastFetchTime: Date | null
}

// Validation types

export interface MetricsValidationResult {
  isValid: boolean
  errors: MetricsValidationError[]
  warnings: MetricsValidationWarning[]
}

export interface MetricsValidationError {
  nodeId?: string
  field: keyof FunnelNodeMetrics
  value: any
  rule: string
  message: string
}

export interface MetricsValidationWarning {
  nodeId?: string
  field: keyof FunnelNodeMetrics
  value: any
  message: string
  suggestion?: string
}

// Chart/visualization types

export interface MetricsChartData {
  type: 'line' | 'bar' | 'area' | 'funnel'
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string
      borderColor?: string
      fill?: boolean
    }>
  }
  options?: any
}

export interface FunnelVisualizationData {
  stages: Array<{
    id: string
    name: string
    value: number
    percentage: number
    dropoff?: number
    color?: string
  }>
  totalStarting: number
  totalConverted: number
  overallConversionRate: number
}

// Export and import types

export interface MetricsExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  includeMetadata?: boolean
  dateRange?: { start: Date; end: Date }
  nodeIds?: string[]
  columns?: string[]
}

export interface MetricsImportData {
  entries: Array<{
    nodeId: string
    nodeName?: string
    period: MetricsPeriod
    metrics: FunnelNodeMetrics
  }>
  mapping: Record<string, string> // CSV column to metrics field mapping
  validation: MetricsValidationResult
}

// Preset and template types

export interface MetricsTemplate {
  id: string
  name: string
  description?: string
  columns: MetricsTableColumn[]
  defaultValues?: Partial<FunnelNodeMetrics>
  category: 'ecommerce' | 'saas' | 'content' | 'lead_generation' | 'custom'
  tags?: string[]
}

export interface MetricsPreset {
  id: string
  name: string
  template: MetricsTemplate
  periodConfig: PeriodSelectorConfig
  autoCalculations?: Array<{
    target: keyof FunnelNodeMetrics
    formula: string // e.g., "conversions / totalVisitors * 100"
    dependencies: (keyof FunnelNodeMetrics)[]
  }>
}

// Comparison types

export interface MetricsComparison {
  baseline: MetricsResponse
  comparison: MetricsResponse
  differences: Array<{
    nodeId: string
    metric: keyof FunnelNodeMetrics
    baselineValue: number
    comparisonValue: number
    change: number
    changePercent: number
    significance: 'high' | 'medium' | 'low'
  }>
}

// Collaboration types

export interface MetricsComment {
  id: string
  entryId: string
  nodeId?: string
  field?: keyof FunnelNodeMetrics
  userId: string
  userName: string
  message: string
  createdAt: Date
  resolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface MetricsApproval {
  id: string
  entryId: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  comments?: string
}