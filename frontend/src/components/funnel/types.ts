import type { FunnelNode, FunnelEdge, Position } from '@/types/funnel'

// Canvas-specific types
export interface CanvasSettings {
  width: number
  height: number
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  readonly: boolean
}

export interface ZoomTransform {
  x: number
  y: number
  k: number
}

export interface CanvasViewport {
  x: number
  y: number
  width: number
  height: number
  zoom: number
}

// Node rendering types
export interface NodeDimensions {
  width: number
  height: number
  borderRadius: number
}

export interface NodeRenderOptions {
  showAnalytics: boolean
  showConnectionPoints: boolean
  highlightConnections: boolean
}

// Connection types
export interface ConnectionPoint {
  nodeId: string
  position: Position
  type: 'input' | 'output'
  index?: number
}

export interface ConnectionState {
  isConnecting: boolean
  sourcePoint: ConnectionPoint | null
  targetPoint: ConnectionPoint | null
  previewPath: string
}

// Data entry types
export interface DataTemplate {
  id: string
  name: string
  description: string
  icon?: string
  category: string
  count: number
  generator: () => any[]
  schema: DataSchema
}

export interface DataSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'date' | 'object'
    required?: boolean
    format?: string
    options?: any[]
    validation?: ValidationRule[]
  }
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

export interface TableColumn {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date'
  sortable?: boolean
  filterable?: boolean
  width?: number
}

// Editor types
export interface EditorTab {
  id: string
  label: string
  icon?: string
  component: string
}

export interface NodeConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'checkbox' | 'date' | 'json'
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  validation?: ValidationRule[]
  dependency?: {
    field: string
    value: any
  }
  description?: string
}

export interface NodeTypeConfig {
  type: string
  label: string
  description: string
  icon: string
  color: string
  category: 'flow' | 'action' | 'condition' | 'data'
  fields: NodeConfigField[]
  defaultConfig: Record<string, any>
  canHaveInputs: boolean
  canHaveOutputs: boolean
  maxInputs?: number
  maxOutputs?: number
  allowedParents?: string[]
  allowedChildren?: string[]
}

// Analytics types
export interface NodeAnalytics {
  nodeId: string
  visits: number
  uniqueVisits: number
  conversionRate: number
  averageTimeSpent: number
  dropOffCount: number
  dropOffRate: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
}

export interface EdgeAnalytics {
  edgeId: string
  traversals: number
  conversionRate: number
  averageTraversalTime: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
}

export interface FunnelAnalytics {
  totalSessions: number
  uniqueUsers: number
  overallConversionRate: number
  averageSessionTime: number
  totalDropOffs: number
  nodes: NodeAnalytics[]
  edges: EdgeAnalytics[]
  timeRange: {
    start: Date
    end: Date
  }
  lastCalculated: Date
}

// Event types for component communication
export interface NodeEvent {
  type: 'select' | 'update' | 'delete' | 'edit' | 'data-entry' | 'connection-start' | 'connection-end'
  nodeId: string
  data?: any
  position?: Position
}

export interface EdgeEvent {
  type: 'select' | 'update' | 'delete' | 'edit'
  edgeId: string
  data?: any
}

export interface CanvasEvent {
  type: 'click' | 'drag' | 'zoom' | 'pan' | 'contextmenu'
  position: Position
  target?: string
  data?: any
}

// Simulation types
export interface SimulationConfig {
  enabled: boolean
  speed: number
  batchSize: number
  dataSource: 'generated' | 'imported' | 'live'
  rules: SimulationRule[]
}

export interface SimulationRule {
  id: string
  nodeId: string
  type: 'conversion-rate' | 'delay' | 'split-ratio' | 'drop-off'
  parameters: Record<string, any>
  enabled: boolean
}

export interface SimulationResult {
  nodeId: string
  timestamp: Date
  eventType: string
  userId: string
  sessionId: string
  data: Record<string, any>
}

// Export utility types
export interface D3Selection extends d3.Selection<any, any, any, any> {}
export interface D3ZoomBehavior extends d3.ZoomBehavior<any, any> {}
export interface D3DragBehavior extends d3.DragBehavior<any, any, any> {}

// Component prop types
export interface FunnelCanvasProps {
  nodes?: FunnelNode[]
  edges?: FunnelEdge[]
  settings?: Partial<CanvasSettings>
  readonly?: boolean
  showAnalytics?: boolean
  enableSimulation?: boolean
}

export interface FunnelNodeProps {
  node: FunnelNode
  selected?: boolean
  readonly?: boolean
  analytics?: NodeAnalytics
  showAnalytics?: boolean
  renderOptions?: Partial<NodeRenderOptions>
}

export interface NodeEditorProps {
  node: FunnelNode
  config?: NodeTypeConfig
  tabs?: EditorTab[]
}

export interface DataEntryModalProps {
  node: FunnelNode
  template?: DataTemplate
  schema?: DataSchema
}