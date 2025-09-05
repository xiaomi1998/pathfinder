import type { FunnelNode, FunnelEdge, Position } from '@/types/funnel'
import type { 
  LayoutBounds, 
  NodeCluster, 
  NodeOverlap, 
  LayoutConfig,
  SpacingAnalysis 
} from '@/types/layout'

// Constants for layout calculations
export const LAYOUT_CONSTANTS = {
  DEFAULT_NODE_WIDTH: 120,
  DEFAULT_NODE_HEIGHT: 60,
  MIN_NODE_SPACING: 50,
  OPTIMAL_NODE_SPACING: 100,
  MAX_NODE_SPACING: 200,
  MAGNETIC_THRESHOLD: 10,
  GRID_SNAP_THRESHOLD: 5,
  LAYOUT_PADDING: 50,
  FORCE_SIMULATION_ITERATIONS: 300,
  ANIMATION_DURATION: 500,
  CLUSTER_DETECTION_THRESHOLD: 150
} as const

/**
 * Calculate the bounds of a node
 */
export function getNodeBounds(node: FunnelNode): LayoutBounds {
  const width = node.style?.width || LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH
  const height = node.style?.height || LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT
  
  return {
    x: node.position.x,
    y: node.position.y,
    width,
    height
  }
}

/**
 * Calculate the bounds of a collection of nodes
 */
export function getNodeCollectionBounds(nodes: FunnelNode[]): LayoutBounds {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach(node => {
    const bounds = getNodeBounds(node)
    minX = Math.min(minX, bounds.x)
    minY = Math.min(minY, bounds.y)
    maxX = Math.max(maxX, bounds.x + bounds.width)
    maxY = Math.max(maxY, bounds.y + bounds.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Check if two nodes overlap
 */
export function checkNodeOverlap(node1: FunnelNode, node2: FunnelNode): NodeOverlap | null {
  const bounds1 = getNodeBounds(node1)
  const bounds2 = getNodeBounds(node2)

  const overlapX = Math.max(0, Math.min(bounds1.x + bounds1.width, bounds2.x + bounds2.width) - Math.max(bounds1.x, bounds2.x))
  const overlapY = Math.max(0, Math.min(bounds1.y + bounds1.height, bounds2.y + bounds2.height) - Math.max(bounds1.y, bounds2.y))
  
  const overlapArea = overlapX * overlapY

  if (overlapArea > 0) {
    const totalArea = bounds1.width * bounds1.height + bounds2.width * bounds2.height
    const overlapPercentage = (overlapArea * 2) / totalArea

    let severity: 'low' | 'medium' | 'high' = 'low'
    if (overlapPercentage > 0.5) severity = 'high'
    else if (overlapPercentage > 0.2) severity = 'medium'

    return {
      node1: node1.id,
      node2: node2.id,
      overlapArea,
      severity
    }
  }

  return null
}

/**
 * Find all overlapping nodes in a collection
 */
export function findOverlappingNodes(nodes: FunnelNode[]): NodeOverlap[] {
  const overlaps: NodeOverlap[] = []

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const overlap = checkNodeOverlap(nodes[i], nodes[j])
      if (overlap) {
        overlaps.push(overlap)
      }
    }
  }

  return overlaps
}

/**
 * Calculate the distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = pos2.y - pos1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate the center point of a node
 */
export function getNodeCenter(node: FunnelNode): Position {
  const bounds = getNodeBounds(node)
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2
  }
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize: number): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  }
}

/**
 * Check if a position is close enough to snap to a guide
 */
export function shouldSnapToGuide(position: number, guidePosition: number, threshold: number): boolean {
  return Math.abs(position - guidePosition) <= threshold
}

/**
 * Build adjacency list from edges
 */
export function buildAdjacencyList(edges: FunnelEdge[]): Map<string, string[]> {
  const adjacencyList = new Map<string, string[]>()

  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, [])
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, [])
    }
    
    adjacencyList.get(edge.source)!.push(edge.target)
  })

  return adjacencyList
}

/**
 * Detect circular dependencies using DFS
 */
export function detectCircularDependencies(edges: FunnelEdge[]): string[][] {
  const adjacencyList = buildAdjacencyList(edges)
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cycles: string[][] = []

  function dfs(node: string, path: string[]): void {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node)
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), node])
      }
      return
    }

    if (visited.has(node)) {
      return
    }

    visited.add(node)
    recursionStack.add(node)

    const neighbors = adjacencyList.get(node) || []
    neighbors.forEach(neighbor => {
      dfs(neighbor, [...path, node])
    })

    recursionStack.delete(node)
  }

  // Start DFS from all unvisited nodes
  adjacencyList.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, [])
    }
  })

  return cycles
}

/**
 * Find connected components (clusters)
 */
export function findConnectedComponents(nodes: FunnelNode[], edges: FunnelEdge[]): NodeCluster[] {
  const nodeIds = new Set(nodes.map(n => n.id))
  const adjacencyList = new Map<string, Set<string>>()
  
  // Initialize adjacency list
  nodes.forEach(node => {
    adjacencyList.set(node.id, new Set())
  })

  // Build undirected graph
  edges.forEach(edge => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacencyList.get(edge.source)!.add(edge.target)
      adjacencyList.get(edge.target)!.add(edge.source)
    }
  })

  const visited = new Set<string>()
  const clusters: NodeCluster[] = []

  function dfs(nodeId: string, cluster: string[]): void {
    if (visited.has(nodeId)) return
    
    visited.add(nodeId)
    cluster.push(nodeId)

    const neighbors = adjacencyList.get(nodeId) || new Set()
    neighbors.forEach(neighbor => {
      dfs(neighbor, cluster)
    })
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const cluster: string[] = []
      dfs(node.id, cluster)
      
      if (cluster.length > 0) {
        const clusterNodes = nodes.filter(n => cluster.includes(n.id))
        const bounds = getNodeCollectionBounds(clusterNodes)
        
        clusters.push({
          id: `cluster-${clusters.length}`,
          nodes: cluster,
          position: { x: bounds.x, y: bounds.y },
          bounds,
          isDisconnected: cluster.length === 1 && adjacencyList.get(cluster[0])!.size === 0
        })
      }
    }
  })

  return clusters
}

/**
 * Calculate spacing analysis for layout optimization
 */
export function calculateSpacingAnalysis(nodes: FunnelNode[], edges: FunnelEdge[]): SpacingAnalysis {
  if (nodes.length < 2) {
    return {
      averageNodeSpacing: 0,
      optimalHorizontalSpacing: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING,
      optimalVerticalSpacing: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING,
      densityScore: 0,
      spacingVariance: 0
    }
  }

  // Calculate distances between all connected nodes
  const connectedDistances: number[] = []
  const adjacencyList = buildAdjacencyList(edges)

  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    
    if (sourceNode && targetNode) {
      const distance = calculateDistance(getNodeCenter(sourceNode), getNodeCenter(targetNode))
      connectedDistances.push(distance)
    }
  })

  // Calculate average spacing
  const averageNodeSpacing = connectedDistances.length > 0 
    ? connectedDistances.reduce((sum, dist) => sum + dist, 0) / connectedDistances.length
    : 0

  // Calculate optimal spacing based on node density and canvas size
  const bounds = getNodeCollectionBounds(nodes)
  const nodeArea = nodes.length * LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH * LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT
  const totalArea = bounds.width * bounds.height
  const densityScore = totalArea > 0 ? Math.min(1, nodeArea / totalArea) : 0

  // Calculate spacing variance
  const spacingVariance = connectedDistances.length > 0
    ? connectedDistances.reduce((sum, dist) => sum + Math.pow(dist - averageNodeSpacing, 2), 0) / connectedDistances.length
    : 0

  // Determine optimal spacing based on analysis
  let optimalHorizontalSpacing = LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING
  let optimalVerticalSpacing = LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING

  if (densityScore > 0.8) {
    // High density - reduce spacing
    optimalHorizontalSpacing = LAYOUT_CONSTANTS.MIN_NODE_SPACING
    optimalVerticalSpacing = LAYOUT_CONSTANTS.MIN_NODE_SPACING
  } else if (densityScore < 0.3) {
    // Low density - increase spacing
    optimalHorizontalSpacing = LAYOUT_CONSTANTS.MAX_NODE_SPACING
    optimalVerticalSpacing = LAYOUT_CONSTANTS.MAX_NODE_SPACING
  }

  return {
    averageNodeSpacing,
    optimalHorizontalSpacing,
    optimalVerticalSpacing,
    densityScore,
    spacingVariance
  }
}

/**
 * Calculate layout score (0-100)
 */
export function calculateLayoutScore(nodes: FunnelNode[], edges: FunnelEdge[]): number {
  let score = 100

  // Deduct points for overlapping nodes
  const overlaps = findOverlappingNodes(nodes)
  score -= overlaps.length * 10

  // Deduct points for circular dependencies
  const cycles = detectCircularDependencies(edges)
  score -= cycles.length * 15

  // Deduct points for poor spacing
  const spacingAnalysis = calculateSpacingAnalysis(nodes, edges)
  const spacingScore = Math.max(0, 100 - spacingAnalysis.spacingVariance / 100)
  score = (score + spacingScore) / 2

  // Deduct points for disconnected clusters
  const clusters = findConnectedComponents(nodes, edges)
  const disconnectedClusters = clusters.filter(c => c.isDisconnected).length
  score -= disconnectedClusters * 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Normalize positions to prevent negative coordinates
 */
export function normalizePositions(nodes: FunnelNode[]): FunnelNode[] {
  if (nodes.length === 0) return nodes

  const bounds = getNodeCollectionBounds(nodes)
  const padding = LAYOUT_CONSTANTS.LAYOUT_PADDING

  return nodes.map(node => ({
    ...node,
    position: {
      x: node.position.x - bounds.x + padding,
      y: node.position.y - bounds.y + padding
    }
  }))
}

/**
 * Interpolate between two positions for animations
 */
export function interpolatePosition(from: Position, to: Position, t: number): Position {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  }
}

/**
 * Create easing function for animations
 */
export function createEasingFunction(type: string) {
  const easingFunctions = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  return easingFunctions[type as keyof typeof easingFunctions] || easingFunctions.easeInOut
}

/**
 * Generate optimal position for a new node
 */
export function generateOptimalPositionForNewNode(
  existingNodes: FunnelNode[], 
  nodeType: string,
  canvasSize: { width: number; height: number }
): Position {
  if (existingNodes.length === 0) {
    return { x: canvasSize.width / 2 - 60, y: canvasSize.height / 2 - 30 }
  }

  const bounds = getNodeCollectionBounds(existingNodes)
  const spacing = LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING

  // For start nodes, place at the beginning of the flow
  if (nodeType === 'start') {
    return {
      x: bounds.x - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH - spacing,
      y: bounds.y + bounds.height / 2 - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
    }
  }

  // For end nodes, place at the end of the flow
  if (nodeType === 'end') {
    return {
      x: bounds.x + bounds.width + spacing,
      y: bounds.y + bounds.height / 2 - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
    }
  }

  // For other nodes, find the best position to avoid overlaps
  const candidates: Position[] = []
  const step = 50

  for (let x = bounds.x; x <= bounds.x + bounds.width; x += step) {
    for (let y = bounds.y; y <= bounds.y + bounds.height; y += step) {
      const testPosition = { x, y }
      const testNode: FunnelNode = {
        id: 'test',
        type: nodeType as any,
        position: testPosition,
        data: { label: 'test', config: {} }
      }

      const hasOverlap = existingNodes.some(node => checkNodeOverlap(node, testNode))
      if (!hasOverlap) {
        candidates.push(testPosition)
      }
    }
  }

  if (candidates.length > 0) {
    // Return the position closest to the center of existing nodes
    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2

    return candidates.reduce((best, candidate) => {
      const candidateDistance = calculateDistance(candidate, { x: centerX, y: centerY })
      const bestDistance = calculateDistance(best, { x: centerX, y: centerY })
      return candidateDistance < bestDistance ? candidate : best
    })
  }

  // Fallback: place below the existing layout
  return {
    x: bounds.x + bounds.width / 2 - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
    y: bounds.y + bounds.height + spacing
  }
}