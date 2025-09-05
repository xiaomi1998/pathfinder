import type { FunnelNode, FunnelEdge } from '@/types/funnel'
import type { 
  ILayoutManager,
  LayoutConfig,
  LayoutAnalysis,
  NodeCluster,
  LayoutTransition,
  LayoutAnimationConfig,
  LayoutHistoryEntry
} from '@/types/layout'
import { AutoLayoutAgent } from '@/agents/AutoLayoutAgent'
import { LayoutDetectionAgent } from '@/agents/LayoutDetectionAgent'
import { SmartPositioningAgent } from '@/agents/SmartPositioningAgent'
import {
  LAYOUT_CONSTANTS,
  normalizePositions
} from '@/utils/layout'

export class LayoutManager implements ILayoutManager {
  private autoLayoutAgent: AutoLayoutAgent
  private detectionAgent: LayoutDetectionAgent
  private positioningAgent: SmartPositioningAgent
  private layoutHistory: LayoutHistoryEntry[] = []
  private currentHistoryIndex: number = -1

  constructor() {
    this.autoLayoutAgent = new AutoLayoutAgent()
    this.detectionAgent = new LayoutDetectionAgent()
    this.positioningAgent = new SmartPositioningAgent()
  }

  /**
   * Apply the specified layout algorithm to nodes
   */
  async applyLayout(
    nodes: FunnelNode[], 
    edges: FunnelEdge[], 
    config: LayoutConfig
  ): Promise<FunnelNode[]> {
    if (nodes.length === 0) return nodes

    // Save current layout to history
    this.saveToHistory('Before Layout Application', nodes, config)

    let layoutedNodes: FunnelNode[] = []

    try {
      switch (config.algorithm) {
        case 'hierarchical':
          layoutedNodes = this.autoLayoutAgent.generateHierarchicalLayout(nodes, edges, {
            levelHeight: config.nodeSpacing.vertical,
            nodeSpacing: config.nodeSpacing.horizontal,
            alignment: config.alignment.horizontal as 'left' | 'center' | 'right',
            sortNodes: true,
            rankDirection: this.getHierarchicalDirection(config.direction)
          })
          break

        case 'force-directed':
          layoutedNodes = await this.autoLayoutAgent.generateForceDirectedLayout(nodes, edges, {
            linkDistance: config.nodeSpacing.horizontal,
            linkStrength: 0.1,
            chargeStrength: 200,
            centerForce: 0.1,
            iterations: LAYOUT_CONSTANTS.FORCE_SIMULATION_ITERATIONS,
            alpha: 1,
            alphaDecay: 0.01,
            velocityDecay: 0.4
          })
          break

        case 'grid':
          const columns = Math.ceil(Math.sqrt(nodes.length))
          layoutedNodes = this.autoLayoutAgent.generateGridLayout(nodes, {
            columns,
            rows: Math.ceil(nodes.length / columns),
            cellWidth: LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH + config.nodeSpacing.horizontal,
            cellHeight: LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT + config.nodeSpacing.vertical,
            centerInCell: true
          })
          break

        case 'circular':
          const center = { x: 400, y: 300 }
          const radius = Math.max(150, nodes.length * 20)
          layoutedNodes = this.autoLayoutAgent.generateCircularLayout(nodes, center, radius)
          break

        default:
          // For 'manual' or unknown algorithms, return nodes as-is
          layoutedNodes = [...nodes]
      }

      // Apply additional optimizations
      if (config.algorithm !== 'manual') {
        if (config.snapToGrid) {
          layoutedNodes = this.applyGridSnapping(layoutedNodes, config.gridSize)
        }

        // Apply spacing optimization
        layoutedNodes = this.autoLayoutAgent.optimizeSpacing(layoutedNodes, edges)

        // Apply padding
        layoutedNodes = this.applyPadding(layoutedNodes, config.padding)

        // Normalize positions to prevent negative coordinates
        layoutedNodes = normalizePositions(layoutedNodes)
      }

      // Save result to history
      this.saveToHistory(`Applied ${config.algorithm} Layout`, layoutedNodes, config)

      return layoutedNodes

    } catch (error) {
      console.error('Failed to apply layout:', error)
      return nodes // Return original nodes if layout fails
    }
  }

  /**
   * Analyze the current layout quality
   */
  analyzeLayout(nodes: FunnelNode[], edges: FunnelEdge[]): LayoutAnalysis {
    return this.detectionAgent.analyzeLayoutQuality(nodes, edges)
  }

  /**
   * Optimize spacing between nodes
   */
  optimizeSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): FunnelNode[] {
    this.saveToHistory('Before Spacing Optimization', nodes, this.getDefaultConfig())
    const optimizedNodes = this.autoLayoutAgent.optimizeSpacing(nodes, edges)
    this.saveToHistory('After Spacing Optimization', optimizedNodes, this.getDefaultConfig())
    return optimizedNodes
  }

  /**
   * Detect circular dependencies in the flow
   */
  detectCircularDependencies(edges: FunnelEdge[]): string[][] {
    return this.detectionAgent.detectCircularDependencies(edges)
  }

  /**
   * Find disconnected node clusters
   */
  findDisconnectedClusters(nodes: FunnelNode[], edges: FunnelEdge[]): NodeCluster[] {
    return this.detectionAgent.findDisconnectedClusters(nodes, edges)
  }

  /**
   * Auto-arrange nodes with intelligent algorithm selection
   */
  async autoArrange(
    nodes: FunnelNode[], 
    edges: FunnelEdge[],
    preferences?: {
      prioritizeFlow?: boolean;
      maintainClusters?: boolean;
      optimizeForReadability?: boolean;
    }
  ): Promise<FunnelNode[]> {
    const analysis = this.analyzeLayout(nodes, edges)
    const prefs = { prioritizeFlow: true, maintainClusters: false, optimizeForReadability: true, ...preferences }

    // Choose the best layout algorithm based on analysis
    let selectedAlgorithm: LayoutConfig['algorithm'] = 'hierarchical'

    if (analysis.hasCircularDependencies && !prefs.prioritizeFlow) {
      selectedAlgorithm = 'force-directed'
    } else if (analysis.disconnectedClusters.length > 3) {
      selectedAlgorithm = 'grid'
    } else if (nodes.length > 20 && prefs.optimizeForReadability) {
      selectedAlgorithm = 'hierarchical'
    }

    const config: LayoutConfig = {
      algorithm: selectedAlgorithm,
      direction: 'top-to-bottom',
      nodeSpacing: {
        horizontal: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING,
        vertical: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING
      },
      padding: {
        top: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        right: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        bottom: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        left: LAYOUT_CONSTANTS.LAYOUT_PADDING
      },
      alignment: {
        horizontal: 'center',
        vertical: 'top'
      },
      gridSize: 20,
      snapToGrid: true,
      enableMagneticAlignment: true,
      magneticThreshold: LAYOUT_CONSTANTS.MAGNETIC_THRESHOLD,
      animationDuration: LAYOUT_CONSTANTS.ANIMATION_DURATION,
      autoLayout: true
    }

    return this.applyLayout(nodes, edges, config)
  }

  /**
   * Create smooth layout transitions
   */
  createLayoutTransitions(
    fromNodes: FunnelNode[], 
    toNodes: FunnelNode[], 
    config: LayoutAnimationConfig
  ): LayoutTransition[] {
    const transitions: LayoutTransition[] = []
    const nodeMap = new Map(toNodes.map(n => [n.id, n]))

    fromNodes.forEach((fromNode, index) => {
      const toNode = nodeMap.get(fromNode.id)
      if (toNode) {
        transitions.push({
          nodeId: fromNode.id,
          fromPosition: fromNode.position,
          toPosition: toNode.position,
          duration: config.duration + (config.stagger * index),
          easing: config.easing
        })
      }
    })

    return transitions
  }

  /**
   * Apply smart positioning for a new node
   */
  positionNewNode(
    existingNodes: FunnelNode[], 
    nodeType: string,
    context?: {
      nearNode?: string;
      preferredDirection?: 'top' | 'right' | 'bottom' | 'left';
    }
  ): { position: Position; suggestions: Position[] } {
    const suggestions = this.positioningAgent.generatePositionSuggestions(existingNodes, nodeType, context)
    const optimalPosition = suggestions[0] || this.positioningAgent.calculateOptimalPositionForNewNode(existingNodes, nodeType)

    return {
      position: optimalPosition,
      suggestions
    }
  }

  /**
   * Handle drag operations with smart positioning
   */
  handleDragPositioning(
    dragPosition: Position,
    dragNodeId: string,
    allNodes: FunnelNode[],
    options: {
      enableGridSnap: boolean;
      enableMagneticAlignment: boolean;
      gridSize: number;
    }
  ) {
    return this.positioningAgent.adjustPositionDuringDrag(dragPosition, dragNodeId, allNodes, options)
  }

  /**
   * Maintain layout integrity when nodes are added/removed
   */
  maintainLayoutIntegrity(
    nodes: FunnelNode[], 
    edges: FunnelEdge[],
    changes: {
      addedNodes: FunnelNode[];
      removedNodes: string[];
      modifiedEdges: FunnelEdge[];
    }
  ): FunnelNode[] {
    let updatedNodes = [...nodes]

    // Handle added nodes - position them optimally
    changes.addedNodes.forEach(newNode => {
      const existingNodes = updatedNodes.filter(n => n.id !== newNode.id)
      const optimalPosition = this.positioningAgent.calculateOptimalPositionForNewNode(existingNodes, newNode.type)
      
      updatedNodes.push({
        ...newNode,
        position: optimalPosition
      })
    })

    // Handle removed nodes - adjust layout if needed
    if (changes.removedNodes.length > 0) {
      updatedNodes = updatedNodes.filter(n => !changes.removedNodes.includes(n.id))
      
      // If significant nodes were removed, consider re-optimizing spacing
      if (changes.removedNodes.length > nodes.length * 0.2) {
        updatedNodes = this.autoLayoutAgent.optimizeSpacing(updatedNodes, edges)
      }
    }

    return updatedNodes
  }

  /**
   * Undo last layout operation
   */
  undo(): { nodes: FunnelNode[]; config: LayoutConfig } | null {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--
      const entry = this.layoutHistory[this.currentHistoryIndex]
      return {
        nodes: Array.from(entry.nodePositions.entries()).map(([id, position]) => ({
          id,
          position,
          type: 'event', // This would need to be stored in history
          data: { label: '', config: {} }
        })) as FunnelNode[],
        config: entry.config
      }
    }
    return null
  }

  /**
   * Redo last undone layout operation
   */
  redo(): { nodes: FunnelNode[]; config: LayoutConfig } | null {
    if (this.currentHistoryIndex < this.layoutHistory.length - 1) {
      this.currentHistoryIndex++
      const entry = this.layoutHistory[this.currentHistoryIndex]
      return {
        nodes: Array.from(entry.nodePositions.entries()).map(([id, position]) => ({
          id,
          position,
          type: 'event', // This would need to be stored in history
          data: { label: '', config: {} }
        })) as FunnelNode[],
        config: entry.config
      }
    }
    return null
  }

  /**
   * Get layout suggestions based on current state
   */
  getLayoutSuggestions(nodes: FunnelNode[], edges: FunnelEdge[]) {
    const analysis = this.analyzeLayout(nodes, edges)
    return analysis.suggestions
  }

  /**
   * Save current layout to history
   */
  private saveToHistory(description: string, nodes: FunnelNode[], config: LayoutConfig) {
    const entry: LayoutHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      description,
      nodePositions: new Map(nodes.map(n => [n.id, n.position])),
      config
    }

    // Remove any entries after current index (for redo functionality)
    this.layoutHistory = this.layoutHistory.slice(0, this.currentHistoryIndex + 1)
    
    // Add new entry
    this.layoutHistory.push(entry)
    this.currentHistoryIndex = this.layoutHistory.length - 1

    // Limit history size
    if (this.layoutHistory.length > 50) {
      this.layoutHistory.shift()
      this.currentHistoryIndex--
    }
  }

  /**
   * Convert direction to hierarchical layout direction
   */
  private getHierarchicalDirection(direction: LayoutConfig['direction']): 'TB' | 'BT' | 'LR' | 'RL' {
    switch (direction) {
      case 'top-to-bottom': return 'TB'
      case 'bottom-to-top': return 'BT'
      case 'left-to-right': return 'LR'
      case 'right-to-left': return 'RL'
      default: return 'TB'
    }
  }

  /**
   * Apply grid snapping to all nodes
   */
  private applyGridSnapping(nodes: FunnelNode[], gridSize: number): FunnelNode[] {
    return nodes.map(node => ({
      ...node,
      position: this.positioningAgent.snapToGrid(node.position, gridSize)
    }))
  }

  /**
   * Apply padding to layout bounds
   */
  private applyPadding(
    nodes: FunnelNode[], 
    padding: { top: number; right: number; bottom: number; left: number }
  ): FunnelNode[] {
    return nodes.map(node => ({
      ...node,
      position: {
        x: node.position.x + padding.left,
        y: node.position.y + padding.top
      }
    }))
  }

  /**
   * Get default layout configuration
   */
  private getDefaultConfig(): LayoutConfig {
    return {
      algorithm: 'hierarchical',
      direction: 'top-to-bottom',
      nodeSpacing: {
        horizontal: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING,
        vertical: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING
      },
      padding: {
        top: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        right: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        bottom: LAYOUT_CONSTANTS.LAYOUT_PADDING,
        left: LAYOUT_CONSTANTS.LAYOUT_PADDING
      },
      alignment: {
        horizontal: 'center',
        vertical: 'top'
      },
      gridSize: 20,
      snapToGrid: true,
      enableMagneticAlignment: true,
      magneticThreshold: LAYOUT_CONSTANTS.MAGNETIC_THRESHOLD,
      animationDuration: LAYOUT_CONSTANTS.ANIMATION_DURATION,
      autoLayout: false
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.layoutHistory = []
    this.currentHistoryIndex = -1
  }
}