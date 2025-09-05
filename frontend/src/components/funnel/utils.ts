import type { 
  FunnelNode, 
  FunnelEdge, 
  Position, 
  NodeType,
  EdgeType
} from '@/types/funnel'
import type { 
  NodeDimensions, 
  ConnectionPoint, 
  NodeTypeConfig,
  NodeAnalytics,
  EdgeAnalytics,
  ValidationRule
} from './types'

// Node dimension calculations
export const calculateNodeDimensions = (node: FunnelNode): NodeDimensions => {
  const baseWidth = 120
  const baseHeight = 40
  
  // Calculate width based on label length
  const labelWidth = node.data.label.length * 8
  const width = Math.max(baseWidth, Math.min(labelWidth + 40, 200))
  
  // Calculate height based on content
  let height = baseHeight
  if (node.data.description) height += 16
  
  // Border radius based on node type
  let borderRadius = 4
  if (node.type === 'start' || node.type === 'end') {
    borderRadius = height / 2 // Circular for start/end
  } else if (node.type === 'condition') {
    borderRadius = 8 // More rounded for conditions
  }
  
  return { width, height, borderRadius }
}

// Node positioning utilities
export const snapToGrid = (position: Position, gridSize: number): Position => {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

export const calculateNodeBounds = (nodes: FunnelNode[]): { 
  minX: number, maxX: number, minY: number, maxY: number 
} => {
  if (nodes.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  nodes.forEach(node => {
    const dimensions = calculateNodeDimensions(node)
    minX = Math.min(minX, node.position.x)
    maxX = Math.max(maxX, node.position.x + dimensions.width)
    minY = Math.min(minY, node.position.y)
    maxY = Math.max(maxY, node.position.y + dimensions.height)
  })
  
  return { minX, maxX, minY, maxY }
}

// Connection point calculations
export const getConnectionPoints = (node: FunnelNode): ConnectionPoint[] => {
  const dimensions = calculateNodeDimensions(node)
  const points: ConnectionPoint[] = []
  
  // Input connection point (left side, center)
  if (canHaveInputs(node.type)) {
    points.push({
      nodeId: node.id,
      position: { x: node.position.x, y: node.position.y + dimensions.height / 2 },
      type: 'input',
      index: 0
    })
  }
  
  // Output connection points (right side)
  if (canHaveOutputs(node.type)) {
    const outputCount = getOutputCount(node.type)
    const spacing = dimensions.height / (outputCount + 1)
    
    for (let i = 0; i < outputCount; i++) {
      points.push({
        nodeId: node.id,
        position: {
          x: node.position.x + dimensions.width,
          y: node.position.y + spacing * (i + 1)
        },
        type: 'output',
        index: i
      })
    }
  }
  
  return points
}

export const canHaveInputs = (nodeType: NodeType): boolean => {
  return nodeType !== 'start'
}

export const canHaveOutputs = (nodeType: NodeType): boolean => {
  return nodeType !== 'end'
}

export const getOutputCount = (nodeType: NodeType): number => {
  switch (nodeType) {
    case 'split': return 2
    case 'condition': return 2 // true/false branches
    default: return 1
  }
}

// Path generation for edges
export const generateEdgePath = (
  sourceNode: FunnelNode,
  targetNode: FunnelNode,
  sourceOutputIndex = 0,
  smooth = true
): string => {
  const sourceDim = calculateNodeDimensions(sourceNode)
  const targetDim = calculateNodeDimensions(targetNode)
  
  // Calculate connection points
  const sourceOutputs = getOutputCount(sourceNode.type)
  const sourceSpacing = sourceDim.height / (sourceOutputs + 1)
  const sourceY = sourceNode.position.y + sourceSpacing * (sourceOutputIndex + 1)
  
  const sourceX = sourceNode.position.x + sourceDim.width
  const targetX = targetNode.position.x
  const targetY = targetNode.position.y + targetDim.height / 2
  
  if (smooth) {
    // Create smooth bezier curve
    const dx = targetX - sourceX
    const controlPointX = sourceX + dx * 0.5
    
    return `M ${sourceX},${sourceY} C ${controlPointX},${sourceY} ${controlPointX},${targetY} ${targetX},${targetY}`
  } else {
    // Simple straight line
    return `M ${sourceX},${sourceY} L ${targetX},${targetY}`
  }
}

export const calculateEdgeLabelPosition = (
  sourceNode: FunnelNode,
  targetNode: FunnelNode,
  sourceOutputIndex = 0
): Position => {
  const sourceDim = calculateNodeDimensions(sourceNode)
  const targetDim = calculateNodeDimensions(targetNode)
  
  const sourceOutputs = getOutputCount(sourceNode.type)
  const sourceSpacing = sourceDim.height / (sourceOutputs + 1)
  const sourceY = sourceNode.position.y + sourceSpacing * (sourceOutputIndex + 1)
  
  const sourceX = sourceNode.position.x + sourceDim.width
  const targetX = targetNode.position.x
  const targetY = targetNode.position.y + targetDim.height / 2
  
  return {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2 - 10
  }
}

// Node type configurations
export const nodeTypeConfigs: Record<NodeType, NodeTypeConfig> = {
  start: {
    type: 'start',
    label: 'Start',
    description: 'Entry point for the funnel',
    icon: 'PlayIcon',
    color: '#10b981',
    category: 'flow',
    fields: [
      {
        key: 'trigger_event',
        label: 'Trigger Event',
        type: 'text',
        placeholder: 'Event that starts the funnel',
        description: 'Optional event that triggers this funnel start'
      }
    ],
    defaultConfig: {},
    canHaveInputs: false,
    canHaveOutputs: true,
    maxOutputs: 1
  },
  end: {
    type: 'end',
    label: 'End',
    description: 'Exit point for the funnel',
    icon: 'StopIcon',
    color: '#ef4444',
    category: 'flow',
    fields: [
      {
        key: 'success',
        label: 'Success Goal',
        type: 'checkbox',
        description: 'Mark this as a successful conversion endpoint'
      },
      {
        key: 'value',
        label: 'Conversion Value',
        type: 'number',
        placeholder: 'Optional monetary value',
        dependency: { field: 'success', value: true }
      }
    ],
    defaultConfig: { success: true },
    canHaveInputs: true,
    canHaveOutputs: false
  },
  event: {
    type: 'event',
    label: 'Event',
    description: 'Track a specific user action or event',
    icon: 'CubeIcon',
    color: '#3b82f6',
    category: 'data',
    fields: [
      {
        key: 'event_name',
        label: 'Event Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., button_click, page_view'
      },
      {
        key: 'event_properties',
        label: 'Event Properties',
        type: 'json',
        placeholder: '{"property": "value"}',
        description: 'Additional properties to track with this event'
      }
    ],
    defaultConfig: {},
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 1
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'Branch the flow based on user properties or behavior',
    icon: 'QuestionMarkCircleIcon',
    color: '#f59e0b',
    category: 'condition',
    fields: [
      {
        key: 'conditions',
        label: 'Conditions',
        type: 'json',
        required: true,
        description: 'Array of condition rules to evaluate'
      }
    ],
    defaultConfig: { conditions: [] },
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 2
  },
  action: {
    type: 'action',
    label: 'Action',
    description: 'Perform an action like sending emails or webhooks',
    icon: 'BoltIcon',
    color: '#8b5cf6',
    category: 'action',
    fields: [
      {
        key: 'action_type',
        label: 'Action Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Send Email', value: 'email' },
          { label: 'Call Webhook', value: 'webhook' },
          { label: 'Send Notification', value: 'notification' },
          { label: 'Add Tag', value: 'tag' },
          { label: 'Update Score', value: 'score' }
        ]
      },
      {
        key: 'action_params',
        label: 'Action Parameters',
        type: 'json',
        description: 'Parameters specific to the action type'
      }
    ],
    defaultConfig: {},
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 1
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified amount of time',
    icon: 'ClockIcon',
    color: '#f97316',
    category: 'flow',
    fields: [
      {
        key: 'delay_type',
        label: 'Delay Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Fixed Delay', value: 'fixed' },
          { label: 'Dynamic Delay', value: 'dynamic' }
        ]
      },
      {
        key: 'delay_value',
        label: 'Delay Value',
        type: 'number',
        required: true,
        placeholder: 'Amount to delay'
      },
      {
        key: 'delay_unit',
        label: 'Time Unit',
        type: 'select',
        required: true,
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
          { label: 'Days', value: 'days' }
        ]
      }
    ],
    defaultConfig: { delay_type: 'fixed', delay_unit: 'minutes' },
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 1
  },
  split: {
    type: 'split',
    label: 'Split',
    description: 'Split users into multiple paths',
    icon: 'ArrowsRightLeftIcon',
    color: '#6366f1',
    category: 'flow',
    fields: [
      {
        key: 'split_type',
        label: 'Split Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Random Split', value: 'random' },
          { label: 'Weighted Split', value: 'weighted' },
          { label: 'Property-based Split', value: 'property' }
        ]
      },
      {
        key: 'split_ratio',
        label: 'Split Ratio',
        type: 'json',
        dependency: { field: 'split_type', value: 'weighted' },
        placeholder: '[50, 50]',
        description: 'Percentage split between branches'
      },
      {
        key: 'split_property',
        label: 'Property Name',
        type: 'text',
        dependency: { field: 'split_type', value: 'property' },
        placeholder: 'e.g., user.segment',
        description: 'User property to split on'
      }
    ],
    defaultConfig: { split_type: 'random' },
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 2
  },
  merge: {
    type: 'merge',
    label: 'Merge',
    description: 'Merge multiple paths into one',
    icon: 'ArrowsPointingInIcon',
    color: '#ec4899',
    category: 'flow',
    fields: [],
    defaultConfig: {},
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 10,
    maxOutputs: 1
  }
}

// Validation utilities
export const validateNodeConfiguration = (node: FunnelNode): ValidationRule[] => {
  const errors: ValidationRule[] = []
  const config = nodeTypeConfigs[node.type]
  
  if (!config) {
    errors.push({
      type: 'custom',
      message: `Unknown node type: ${node.type}`,
      validator: () => false
    })
    return errors
  }
  
  config.fields.forEach(field => {
    const value = node.data.config[field.key]
    
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors.push({
        type: 'required',
        message: `${field.label} is required`,
        validator: () => false
      })
    }
    
    if (field.validation) {
      field.validation.forEach(rule => {
        if (rule.validator && !rule.validator(value)) {
          errors.push(rule)
        }
      })
    }
  })
  
  return errors
}

export const validateFunnelStructure = (nodes: FunnelNode[], edges: FunnelEdge[]): string[] => {
  const errors: string[] = []
  
  // Check for at least one start node
  const startNodes = nodes.filter(node => node.type === 'start')
  if (startNodes.length === 0) {
    errors.push('Funnel must have at least one start node')
  }
  
  // Check for at least one end node
  const endNodes = nodes.filter(node => node.type === 'end')
  if (endNodes.length === 0) {
    errors.push('Funnel must have at least one end node')
  }
  
  // Check for disconnected nodes
  const connectedNodeIds = new Set([
    ...edges.map(edge => edge.source),
    ...edges.map(edge => edge.target)
  ])
  
  const disconnectedNodes = nodes.filter(node => 
    !connectedNodeIds.has(node.id) && 
    node.type !== 'start' && 
    node.type !== 'end'
  )
  
  if (disconnectedNodes.length > 0) {
    errors.push(`${disconnectedNodes.length} disconnected node(s) found`)
  }
  
  // Check for circular dependencies
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  const hasCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    const outgoingEdges = edges.filter(edge => edge.source === nodeId)
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) return true
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  for (const node of nodes) {
    if (hasCycle(node.id)) {
      errors.push('Circular dependency detected in funnel flow')
      break
    }
  }
  
  return errors
}

// Analytics utilities
export const calculateConversionRate = (
  nodeAnalytics: NodeAnalytics[],
  sourceNodeId: string,
  targetNodeId: string
): number => {
  const sourceNode = nodeAnalytics.find(n => n.nodeId === sourceNodeId)
  const targetNode = nodeAnalytics.find(n => n.nodeId === targetNodeId)
  
  if (!sourceNode || !targetNode || sourceNode.visits === 0) return 0
  
  return targetNode.visits / sourceNode.visits
}

export const formatAnalyticsValue = (value: number, type: 'count' | 'rate' | 'time'): string => {
  switch (type) {
    case 'count':
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
      return value.toString()
    
    case 'rate':
      return `${(value * 100).toFixed(1)}%`
    
    case 'time':
      if (value >= 3600) return `${(value / 3600).toFixed(1)}h`
      if (value >= 60) return `${(value / 60).toFixed(1)}m`
      return `${value.toFixed(1)}s`
    
    default:
      return value.toString()
  }
}

// Color utilities
export const getNodeColor = (nodeType: NodeType): string => {
  return nodeTypeConfigs[nodeType]?.color || '#6b7280'
}

export const getEdgeColor = (edgeType: EdgeType): string => {
  switch (edgeType) {
    case 'conditional': return '#f59e0b'
    case 'fallback': return '#ef4444'
    case 'trigger': return '#10b981'
    default: return '#6b7280'
  }
}

// ID generation utilities
export const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateEdgeId = (): string => {
  return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export all utilities as default
export default {
  calculateNodeDimensions,
  snapToGrid,
  calculateNodeBounds,
  getConnectionPoints,
  canHaveInputs,
  canHaveOutputs,
  getOutputCount,
  generateEdgePath,
  calculateEdgeLabelPosition,
  nodeTypeConfigs,
  validateNodeConfiguration,
  validateFunnelStructure,
  calculateConversionRate,
  formatAnalyticsValue,
  getNodeColor,
  getEdgeColor,
  generateNodeId,
  generateEdgeId
}