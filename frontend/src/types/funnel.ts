export interface Funnel {
  id: string
  name: string
  description?: string
  user_id: string
  status: 'active' | 'archived'
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
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<FunnelSettings>
}

export interface UpdateFunnelRequest {
  name?: string
  description?: string
  status?: Funnel['status']
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<FunnelSettings>
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