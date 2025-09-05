import type { FunnelNode, FunnelEdge } from '@/types/funnel'
import type { 
  ILayoutDetectionAgent,
  LayoutAnalysis,
  LayoutSuggestion,
  SpacingAnalysis,
  NodeCluster
} from '@/types/layout'
import {
  LAYOUT_CONSTANTS,
  findOverlappingNodes,
  detectCircularDependencies,
  findConnectedComponents,
  calculateSpacingAnalysis,
  calculateLayoutScore,
  getNodeCollectionBounds,
  calculateDistance,
  getNodeCenter
} from '@/utils/layout'

export class LayoutDetectionAgent implements ILayoutDetectionAgent {
  /**
   * Analyze the overall layout quality and provide comprehensive feedback
   */
  analyzeLayoutQuality(nodes: FunnelNode[], edges: FunnelEdge[]): LayoutAnalysis {
    const overlappingNodes = findOverlappingNodes(nodes)
    const circularDependencies = detectCircularDependencies(edges)
    const disconnectedClusters = findConnectedComponents(nodes, edges)
    const optimalSpacing = calculateSpacingAnalysis(nodes, edges)
    const layoutScore = calculateLayoutScore(nodes, edges)
    const isMessy = this.detectMessyLayout(nodes)

    const suggestions = this.generateLayoutSuggestions(
      nodes, 
      overlappingNodes, 
      circularDependencies, 
      disconnectedClusters,
      optimalSpacing,
      isMessy
    )

    return {
      isMessy,
      hasCircularDependencies: circularDependencies.length > 0,
      disconnectedClusters,
      overlappingNodes,
      optimalSpacing,
      layoutScore,
      suggestions
    }
  }

  /**
   * Detect if the layout appears messy based on various heuristics
   */
  detectMessyLayout(nodes: FunnelNode[]): boolean {
    if (nodes.length < 3) return false

    let messyScore = 0

    // Check for overlapping nodes
    const overlaps = findOverlappingNodes(nodes)
    const overlapsFactor = overlaps.length / nodes.length
    messyScore += overlapsFactor * 0.3

    // Check spacing variation
    const distances: number[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = calculateDistance(getNodeCenter(nodes[i]), getNodeCenter(nodes[j]))
        distances.push(distance)
      }
    }

    if (distances.length > 0) {
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length
      const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length
      const spacingVariationFactor = Math.min(1, variance / (avgDistance * avgDistance))
      messyScore += spacingVariationFactor * 0.25
    }

    // Check alignment
    const alignmentFactor = this.calculateAlignmentScore(nodes)
    messyScore += (1 - alignmentFactor) * 0.2

    // Check distribution
    const distributionFactor = this.calculateDistributionScore(nodes)
    messyScore += (1 - distributionFactor) * 0.15

    // Check clustering quality
    const clusteringFactor = this.calculateClusteringScore(nodes)
    messyScore += (1 - clusteringFactor) * 0.1

    return messyScore > 0.4 // Threshold for considering layout "messy"
  }

  /**
   * Detect circular dependencies in the edge graph
   */
  detectCircularDependencies(edges: FunnelEdge[]): string[][] {
    return detectCircularDependencies(edges)
  }

  /**
   * Find disconnected node clusters
   */
  findDisconnectedClusters(nodes: FunnelNode[], edges: FunnelEdge[]): NodeCluster[] {
    const clusters = findConnectedComponents(nodes, edges)
    return clusters.filter(cluster => cluster.isDisconnected || cluster.nodes.length === 1)
  }

  /**
   * Calculate optimal spacing analysis
   */
  calculateOptimalSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): SpacingAnalysis {
    return calculateSpacingAnalysis(nodes, edges)
  }

  /**
   * Calculate alignment score (0-1, higher is better)
   */
  private calculateAlignmentScore(nodes: FunnelNode[]): number {
    if (nodes.length < 3) return 1

    const positions = nodes.map(n => n.position)

    // Count nodes that share similar X or Y coordinates (within threshold)
    const threshold = 20
    let alignedCount = 0

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (Math.abs(positions[i].x - positions[j].x) <= threshold ||
            Math.abs(positions[i].y - positions[j].y) <= threshold) {
          alignedCount++
        }
      }
    }

    const maxPairs = (nodes.length * (nodes.length - 1)) / 2
    return alignedCount / maxPairs
  }

  /**
   * Calculate distribution score (0-1, higher is better)
   */
  private calculateDistributionScore(nodes: FunnelNode[]): number {
    if (nodes.length < 4) return 1

    const bounds = getNodeCollectionBounds(nodes)
    if (bounds.width === 0 || bounds.height === 0) return 0

    // Divide space into grid and check distribution
    const gridSize = 3
    const cellWidth = bounds.width / gridSize
    const cellHeight = bounds.height / gridSize
    
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))
    
    nodes.forEach(node => {
      const relativeX = node.position.x - bounds.x
      const relativeY = node.position.y - bounds.y
      
      const gridX = Math.min(gridSize - 1, Math.floor(relativeX / cellWidth))
      const gridY = Math.min(gridSize - 1, Math.floor(relativeY / cellHeight))
      
      grid[gridY][gridX]++
    })

    // Calculate distribution uniformity
    const totalCells = gridSize * gridSize
    const expectedNodesPerCell = nodes.length / totalCells
    
    let variance = 0
    grid.flat().forEach(count => {
      variance += Math.pow(count - expectedNodesPerCell, 2)
    })
    
    const maxVariance = totalCells * Math.pow(expectedNodesPerCell, 2)
    return Math.max(0, 1 - (variance / maxVariance))
  }

  /**
   * Calculate clustering score (0-1, higher is better)
   */
  private calculateClusteringScore(nodes: FunnelNode[]): number {
    if (nodes.length < 3) return 1

    // Analyze node density distribution
    const densityRadius = LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING * 2
    let totalDensity = 0

    nodes.forEach(node => {
      const nodeCenter = getNodeCenter(node)
      const nearbyNodes = nodes.filter(other => {
        if (other.id === node.id) return false
        const distance = calculateDistance(nodeCenter, getNodeCenter(other))
        return distance <= densityRadius
      })
      
      // Optimal density is 2-4 nearby nodes
      const density = nearbyNodes.length
      const optimalDensity = 3
      const densityScore = 1 - Math.abs(density - optimalDensity) / optimalDensity
      totalDensity += Math.max(0, densityScore)
    })

    return totalDensity / nodes.length
  }

  /**
   * Generate actionable layout suggestions
   */
  private generateLayoutSuggestions(
    nodes: FunnelNode[],
    overlappingNodes: any[],
    circularDependencies: string[][],
    disconnectedClusters: NodeCluster[],
    optimalSpacing: SpacingAnalysis,
    isMessy: boolean
  ): LayoutSuggestion[] {
    const suggestions: LayoutSuggestion[] = []

    // Suggest fixing overlaps
    if (overlappingNodes.length > 0) {
      suggestions.push({
        type: 'spacing',
        severity: overlappingNodes.some(o => o.severity === 'high') ? 'high' : 'medium',
        message: `${overlappingNodes.length} node(s) are overlapping. Consider using auto-spacing or manual adjustment.`,
        action: () => {
          // This would trigger spacing optimization
        },
        estimatedImprovement: 20
      })
    }

    // Suggest fixing circular dependencies
    if (circularDependencies.length > 0) {
      suggestions.push({
        type: 'algorithm',
        severity: 'high',
        message: `${circularDependencies.length} circular dependency(ies) detected. Review flow logic or use force-directed layout.`,
        action: () => {
          // This would trigger circular dependency resolution
        },
        estimatedImprovement: 30
      })
    }

    // Suggest connecting disconnected clusters
    const reallyDisconnected = disconnectedClusters.filter(c => c.isDisconnected)
    if (reallyDisconnected.length > 0) {
      suggestions.push({
        type: 'grouping',
        severity: 'medium',
        message: `${reallyDisconnected.length} disconnected node(s) found. Consider connecting them or grouping logically.`,
        action: () => {
          // This would highlight disconnected nodes
        },
        estimatedImprovement: 15
      })
    }

    // Suggest layout algorithm if messy
    if (isMessy) {
      suggestions.push({
        type: 'algorithm',
        severity: 'medium',
        message: 'Layout appears disorganized. Try hierarchical layout for better flow visualization.',
        action: () => {
          // This would apply hierarchical layout
        },
        estimatedImprovement: 25
      })
    }

    // Suggest spacing optimization
    if (optimalSpacing.spacingVariance > 1000) {
      suggestions.push({
        type: 'spacing',
        severity: 'low',
        message: 'Node spacing is inconsistent. Apply uniform spacing for better visual hierarchy.',
        action: () => {
          // This would normalize spacing
        },
        estimatedImprovement: 10
      })
    }

    // Suggest alignment improvements
    const alignmentScore = this.calculateAlignmentScore(nodes)
    if (alignmentScore < 0.3) {
      suggestions.push({
        type: 'alignment',
        severity: 'low',
        message: 'Improve node alignment by using snap-to-grid or magnetic alignment features.',
        action: () => {
          // This would enable alignment helpers
        },
        estimatedImprovement: 12
      })
    }

    return suggestions.sort((a, b) => {
      // Sort by severity and estimated improvement
      const severityWeight = { high: 3, medium: 2, low: 1 }
      const aSeverity = severityWeight[a.severity]
      const bSeverity = severityWeight[b.severity]
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity
      }
      
      return b.estimatedImprovement - a.estimatedImprovement
    })
  }

  /**
   * Analyze edge crossing patterns
   */
  analyzeEdgeCrossings(nodes: FunnelNode[], edges: FunnelEdge[]): {
    crossingCount: number;
    crossingScore: number;
    problematicEdges: string[];
  } {
    const crossings: string[] = []
    let crossingCount = 0

    // Check all edge pairs for crossings
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 1; j < edges.length; j++) {
        const edge1 = edges[i]
        const edge2 = edges[j]

        // Skip if edges share a node
        if (edge1.source === edge2.source || edge1.source === edge2.target ||
            edge1.target === edge2.source || edge1.target === edge2.target) {
          continue
        }

        const source1 = nodes.find(n => n.id === edge1.source)
        const target1 = nodes.find(n => n.id === edge1.target)
        const source2 = nodes.find(n => n.id === edge2.source)
        const target2 = nodes.find(n => n.id === edge2.target)

        if (source1 && target1 && source2 && target2) {
          if (this.doLinesCross(
            getNodeCenter(source1), getNodeCenter(target1),
            getNodeCenter(source2), getNodeCenter(target2)
          )) {
            crossingCount++
            crossings.push(edge1.id, edge2.id)
          }
        }
      }
    }

    const maxPossibleCrossings = (edges.length * (edges.length - 1)) / 2
    const crossingScore = maxPossibleCrossings > 0 ? 1 - (crossingCount / maxPossibleCrossings) : 1

    return {
      crossingCount,
      crossingScore,
      problematicEdges: Array.from(new Set(crossings))
    }
  }

  /**
   * Check if two line segments cross
   */
  private doLinesCross(
    p1: { x: number; y: number }, 
    p2: { x: number; y: number },
    p3: { x: number; y: number }, 
    p4: { x: number; y: number }
  ): boolean {
    const denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y)
    
    if (denominator === 0) return false // Lines are parallel

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
  }

  /**
   * Analyze layout performance for large graphs
   */
  analyzePerformanceImpact(nodes: FunnelNode[], edges: FunnelEdge[]): {
    recommendViewportCulling: boolean;
    recommendLevelOfDetail: boolean;
    recommendEdgeSimplification: boolean;
    estimatedRenderTime: number;
  } {
    const nodeCount = nodes.length
    const edgeCount = edges.length

    // Estimate render complexity
    const renderComplexity = nodeCount * 2 + edgeCount * 1.5
    const estimatedRenderTime = renderComplexity / 1000 // Rough estimate in ms

    return {
      recommendViewportCulling: nodeCount > 50,
      recommendLevelOfDetail: nodeCount > 100,
      recommendEdgeSimplification: edgeCount > 200,
      estimatedRenderTime
    }
  }
}