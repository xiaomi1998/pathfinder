import type { FunnelNode, FunnelEdge, Position } from './funnel'

// Layout Algorithm Types
export type LayoutAlgorithm = 
  | 'hierarchical'
  | 'force-directed'
  | 'grid'
  | 'circular'
  | 'manual'

export type LayoutDirection = 
  | 'top-to-bottom'
  | 'bottom-to-top'
  | 'left-to-right'
  | 'right-to-left'

export type AlignmentType = 
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom'

// Layout Configuration
export interface LayoutConfig {
  algorithm: LayoutAlgorithm
  direction: LayoutDirection
  nodeSpacing: {
    horizontal: number
    vertical: number
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  alignment: {
    horizontal: AlignmentType
    vertical: AlignmentType
  }
  gridSize: number
  snapToGrid: boolean
  enableMagneticAlignment: boolean
  magneticThreshold: number
  animationDuration: number
  autoLayout: boolean
}

// Layout Detection Results
export interface LayoutAnalysis {
  isMessy: boolean
  hasCircularDependencies: boolean
  disconnectedClusters: NodeCluster[]
  overlappingNodes: NodeOverlap[]
  optimalSpacing: SpacingAnalysis
  layoutScore: number // 0-100, higher is better
  suggestions: LayoutSuggestion[]
}

export interface NodeCluster {
  id: string
  nodes: string[]
  position: Position
  bounds: LayoutBounds
  isDisconnected: boolean
}

export interface NodeOverlap {
  node1: string
  node2: string
  overlapArea: number
  severity: 'low' | 'medium' | 'high'
}

export interface SpacingAnalysis {
  averageNodeSpacing: number
  optimalHorizontalSpacing: number
  optimalVerticalSpacing: number
  densityScore: number
  spacingVariance: number
}

export interface LayoutSuggestion {
  type: 'spacing' | 'alignment' | 'algorithm' | 'grouping'
  severity: 'low' | 'medium' | 'high'
  message: string
  action: () => void
  estimatedImprovement: number
}

export interface LayoutBounds {
  x: number
  y: number
  width: number
  height: number
}

// Layout Animation
export interface LayoutTransition {
  nodeId: string
  fromPosition: Position
  toPosition: Position
  duration: number
  easing: string
}

export interface LayoutAnimationConfig {
  duration: number
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  stagger: number
  groupByLevel: boolean
}

// Force-directed layout specific types
export interface ForceLayoutConfig {
  linkDistance: number
  linkStrength: number
  chargeStrength: number
  centerForce: number
  iterations: number
  alpha: number
  alphaDecay: number
  velocityDecay: number
}

// Hierarchical layout specific types
export interface HierarchicalLayoutConfig {
  levelHeight: number
  nodeSpacing: number
  alignment: 'left' | 'center' | 'right'
  sortNodes: boolean
  rankDirection: 'TB' | 'BT' | 'LR' | 'RL'
}

// Grid layout specific types
export interface GridLayoutConfig {
  columns: number
  rows: number
  cellWidth: number
  cellHeight: number
  centerInCell: boolean
}

// Smart positioning types
export interface SnapGuide {
  type: 'horizontal' | 'vertical'
  position: number
  nodes: string[]
  strength: number
}

export interface MagneticAlignment {
  sourceNode: string
  targetNodes: string[]
  direction: 'horizontal' | 'vertical'
  threshold: number
}

// Layout Manager Interface
export interface ILayoutManager {
  applyLayout(nodes: FunnelNode[], edges: FunnelEdge[], config: LayoutConfig): Promise<FunnelNode[]>
  analyzeLayout(nodes: FunnelNode[], edges: FunnelEdge[]): LayoutAnalysis
  optimizeSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): FunnelNode[]
  detectCircularDependencies(edges: FunnelEdge[]): string[][]
  findDisconnectedClusters(nodes: FunnelNode[], edges: FunnelEdge[]): NodeCluster[]
}

// Auto-layout agent interface
export interface IAutoLayoutAgent {
  generateHierarchicalLayout(nodes: FunnelNode[], edges: FunnelEdge[], config: HierarchicalLayoutConfig): FunnelNode[]
  generateForceDirectedLayout(nodes: FunnelNode[], edges: FunnelEdge[], config: ForceLayoutConfig): Promise<FunnelNode[]>
  generateGridLayout(nodes: FunnelNode[], config: GridLayoutConfig): FunnelNode[]
  optimizeSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): FunnelNode[]
}

// Layout detection agent interface
export interface ILayoutDetectionAgent {
  analyzeLayoutQuality(nodes: FunnelNode[], edges: FunnelEdge[]): LayoutAnalysis
  detectMessyLayout(nodes: FunnelNode[]): boolean
  detectCircularDependencies(edges: FunnelEdge[]): string[][]
  findDisconnectedClusters(nodes: FunnelNode[], edges: FunnelEdge[]): NodeCluster[]
  calculateOptimalSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): SpacingAnalysis
}

// Smart positioning agent interface
export interface ISmartPositioningAgent {
  snapToGrid(position: Position, gridSize: number): Position
  findMagneticAlignments(nodeId: string, nodes: FunnelNode[], threshold: number): MagneticAlignment[]
  generateSnapGuides(nodes: FunnelNode[]): SnapGuide[]
  calculateOptimalPositionForNewNode(existingNodes: FunnelNode[], nodeType: string): Position
  preserveLayoutDuringZoom(nodes: FunnelNode[], zoomFactor: number, center: Position): FunnelNode[]
}

// Layout history for undo/redo
export interface LayoutHistoryEntry {
  id: string
  timestamp: Date
  description: string
  nodePositions: Map<string, Position>
  config: LayoutConfig
}

// Performance optimization types
export interface LayoutPerformanceConfig {
  enableViewportCulling: boolean
  maxVisibleNodes: number
  enableLevelOfDetail: boolean
  simplifyEdgesThreshold: number
  enableWebWorkers: boolean
  batchSize: number
}