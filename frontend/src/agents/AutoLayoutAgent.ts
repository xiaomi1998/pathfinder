import * as d3 from 'd3'
import type { FunnelNode, FunnelEdge } from '@/types/funnel'
import type { 
  IAutoLayoutAgent,
  HierarchicalLayoutConfig,
  ForceLayoutConfig,
  GridLayoutConfig
} from '@/types/layout'
import {
  LAYOUT_CONSTANTS,
  buildAdjacencyList,
  normalizePositions,
  getNodeCenter,
  calculateDistance
} from '@/utils/layout'

export class AutoLayoutAgent implements IAutoLayoutAgent {
  /**
   * Generate hierarchical layout (top-to-bottom flow)
   */
  generateHierarchicalLayout(
    nodes: FunnelNode[], 
    edges: FunnelEdge[], 
    config: HierarchicalLayoutConfig
  ): FunnelNode[] {
    if (nodes.length === 0) return nodes

    // Build adjacency list and find root nodes (start nodes or nodes with no incoming edges)
    const adjacencyList = buildAdjacencyList(edges)
    const incomingEdges = new Set<string>()
    edges.forEach(edge => incomingEdges.add(edge.target))
    
    const rootNodes = nodes.filter(node => 
      node.type === 'start' || !incomingEdges.has(node.id)
    )

    if (rootNodes.length === 0) {
      console.warn('No root nodes found for hierarchical layout')
      return this.generateGridLayout(nodes, {
        columns: Math.ceil(Math.sqrt(nodes.length)),
        rows: Math.ceil(nodes.length / Math.ceil(Math.sqrt(nodes.length))),
        cellWidth: LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH + config.nodeSpacing,
        cellHeight: LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT + config.levelHeight,
        centerInCell: true
      })
    }

    // Assign levels using BFS
    const levels = new Map<string, number>()
    const visited = new Set<string>()
    const queue: Array<{ nodeId: string; level: number }> = []

    // Start with root nodes at level 0
    rootNodes.forEach(node => {
      levels.set(node.id, 0)
      queue.push({ nodeId: node.id, level: 0 })
    })

    let maxLevel = 0

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!
      
      if (visited.has(nodeId)) continue
      visited.add(nodeId)

      const children = adjacencyList.get(nodeId) || []
      children.forEach(childId => {
        if (!visited.has(childId)) {
          const childLevel = level + 1
          levels.set(childId, childLevel)
          maxLevel = Math.max(maxLevel, childLevel)
          queue.push({ nodeId: childId, level: childLevel })
        }
      })
    }

    // Handle unconnected nodes
    nodes.forEach(node => {
      if (!levels.has(node.id)) {
        levels.set(node.id, maxLevel + 1)
      }
    })

    // Group nodes by level
    const nodesByLevel = new Map<number, FunnelNode[]>()
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, [])
      }
      nodesByLevel.get(level)!.push(node)
    })

    // Sort nodes within each level if configured
    if (config.sortNodes) {
      nodesByLevel.forEach(levelNodes => {
        levelNodes.sort((a, b) => a.data.label.localeCompare(b.data.label))
      })
    }

    // Calculate positions
    const layoutedNodes: FunnelNode[] = []
    let currentY = LAYOUT_CONSTANTS.LAYOUT_PADDING

    for (let level = 0; level <= maxLevel + 1; level++) {
      const levelNodes = nodesByLevel.get(level) || []
      if (levelNodes.length === 0) continue

      const totalWidth = levelNodes.length * (LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH + config.nodeSpacing) - config.nodeSpacing
      let startX: number

      // Apply horizontal alignment
      switch (config.alignment) {
        case 'left':
          startX = LAYOUT_CONSTANTS.LAYOUT_PADDING
          break
        case 'right':
          startX = 800 - totalWidth - LAYOUT_CONSTANTS.LAYOUT_PADDING // Assuming canvas width
          break
        case 'center':
        default:
          startX = (800 - totalWidth) / 2 // Assuming canvas width
          break
      }

      levelNodes.forEach((node, index) => {
        const x = startX + index * (LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH + config.nodeSpacing)
        layoutedNodes.push({
          ...node,
          position: { x, y: currentY }
        })
      })

      currentY += LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT + config.levelHeight
    }

    return normalizePositions(layoutedNodes)
  }

  /**
   * Generate force-directed layout using D3 force simulation
   */
  async generateForceDirectedLayout(
    nodes: FunnelNode[], 
    edges: FunnelEdge[], 
    config: ForceLayoutConfig
  ): Promise<FunnelNode[]> {
    if (nodes.length === 0) return nodes

    return new Promise((resolve) => {
      // Create D3 nodes and links
      const d3Nodes = nodes.map(node => ({
        id: node.id,
        ...getNodeCenter(node),
        node
      }))

      const d3Links = edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        edge
      }))

      // Create force simulation
      const simulation = d3.forceSimulation(d3Nodes)
        .force('link', d3.forceLink(d3Links)
          .id((d: any) => d.id)
          .distance(config.linkDistance)
          .strength(config.linkStrength)
        )
        .force('charge', d3.forceManyBody()
          .strength(-config.chargeStrength)
        )
        .force('center', d3.forceCenter(400, 300) // Center of canvas
          .strength(config.centerForce)
        )
        .force('collision', d3.forceCollide()
          .radius(LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2 + 10)
          .strength(0.7)
        )
        .alpha(config.alpha)
        .alphaDecay(config.alphaDecay)
        .velocityDecay(config.velocityDecay)

      // Let simulation run for specified iterations
      for (let i = 0; i < config.iterations; i++) {
        simulation.tick()
      }
      
      // Process final positions and resolve
      const layoutedNodes = d3Nodes.map(d3Node => ({
        ...d3Node.node,
        position: {
          x: (d3Node.x || 0) - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
          y: (d3Node.y || 0) - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
        }
      }))

      resolve(normalizePositions(layoutedNodes))
      
      simulation.stop()
    })
  }

  /**
   * Generate grid layout
   */
  generateGridLayout(nodes: FunnelNode[], config: GridLayoutConfig): FunnelNode[] {
    if (nodes.length === 0) return nodes

    const layoutedNodes: FunnelNode[] = []
    let currentRow = 0
    let currentCol = 0

    // Sort nodes by type priority (start, then others, then end)
    const sortedNodes = [...nodes].sort((a, b) => {
      const typePriority = { start: 0, end: 2 }
      const aPriority = (typePriority as any)[a.type] ?? 1
      const bPriority = (typePriority as any)[b.type] ?? 1
      return aPriority - bPriority
    })

    sortedNodes.forEach(node => {
      const x = currentCol * config.cellWidth + (config.centerInCell ? 
        (config.cellWidth - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH) / 2 : 0)
      const y = currentRow * config.cellHeight + (config.centerInCell ? 
        (config.cellHeight - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT) / 2 : 0)

      layoutedNodes.push({
        ...node,
        position: { x, y }
      })

      currentCol++
      if (currentCol >= config.columns) {
        currentCol = 0
        currentRow++
      }
    })

    return normalizePositions(layoutedNodes)
  }

  /**
   * Optimize spacing between nodes to prevent overlaps and improve readability
   */
  optimizeSpacing(nodes: FunnelNode[], edges: FunnelEdge[]): FunnelNode[] {
    if (nodes.length < 2) return nodes

    const layoutedNodes = [...nodes]
    const adjacencyList = buildAdjacencyList(edges)
    const minSpacing = LAYOUT_CONSTANTS.MIN_NODE_SPACING

    // Iterative spacing optimization
    for (let iteration = 0; iteration < 10; iteration++) {
      let improved = false

      for (let i = 0; i < layoutedNodes.length; i++) {
        for (let j = i + 1; j < layoutedNodes.length; j++) {
          const node1 = layoutedNodes[i]
          const node2 = layoutedNodes[j]
          
          const center1 = getNodeCenter(node1)
          const center2 = getNodeCenter(node2)
          const distance = calculateDistance(center1, center2)

          // Check if nodes are too close
          const requiredDistance = minSpacing + LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2
          
          if (distance < requiredDistance && distance > 0) {
            // Calculate repulsion force
            const force = (requiredDistance - distance) / requiredDistance
            const dx = (center2.x - center1.x) / distance
            const dy = (center2.y - center1.y) / distance

            // Apply force (stronger for connected nodes)
            const isConnected = adjacencyList.get(node1.id)?.includes(node2.id) || 
                               adjacencyList.get(node2.id)?.includes(node1.id)
            const forceMultiplier = isConnected ? 0.3 : 0.5

            const pushDistance = force * forceMultiplier * 10

            // Move nodes apart
            layoutedNodes[i] = {
              ...node1,
              position: {
                x: node1.position.x - dx * pushDistance,
                y: node1.position.y - dy * pushDistance
              }
            }

            layoutedNodes[j] = {
              ...node2,
              position: {
                x: node2.position.x + dx * pushDistance,
                y: node2.position.y + dy * pushDistance
              }
            }

            improved = true
          }
        }
      }

      if (!improved) break
    }

    return normalizePositions(layoutedNodes)
  }

  /**
   * Generate circular layout for better visualization of cyclic flows
   */
  generateCircularLayout(
    nodes: FunnelNode[], 
    center: { x: number; y: number }, 
    radius: number
  ): FunnelNode[] {
    if (nodes.length === 0) return nodes

    const layoutedNodes: FunnelNode[] = []
    const angleStep = (2 * Math.PI) / nodes.length

    nodes.forEach((node, index) => {
      const angle = index * angleStep
      const x = center.x + radius * Math.cos(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2
      const y = center.y + radius * Math.sin(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2

      layoutedNodes.push({
        ...node,
        position: { x, y }
      })
    })

    return normalizePositions(layoutedNodes)
  }

  /**
   * Generate organic layout that respects the flow direction while maintaining natural clustering
   */
  generateOrganicLayout(
    nodes: FunnelNode[], 
    edges: FunnelEdge[]
  ): FunnelNode[] {
    if (nodes.length === 0) return nodes

    // Start with hierarchical layout as base
    const hierarchicalConfig: HierarchicalLayoutConfig = {
      levelHeight: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING,
      nodeSpacing: LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING * 0.8,
      alignment: 'center',
      sortNodes: true,
      rankDirection: 'TB'
    }

    let layoutedNodes = this.generateHierarchicalLayout(nodes, edges, hierarchicalConfig)

    // Apply organic adjustments
    const adjacencyList = buildAdjacencyList(edges)

    for (let iteration = 0; iteration < 5; iteration++) {
      layoutedNodes = layoutedNodes.map(node => {
        const connectedNodes = (adjacencyList.get(node.id) || [])
          .map(id => layoutedNodes.find(n => n.id === id))
          .filter((n): n is FunnelNode => n !== undefined)

        if (connectedNodes.length === 0) return node

        // Calculate center of mass of connected nodes
        const centerOfMass = {
          x: connectedNodes.reduce((sum, n) => sum + n.position.x, 0) / connectedNodes.length,
          y: connectedNodes.reduce((sum, n) => sum + n.position.y, 0) / connectedNodes.length
        }

        // Move slightly towards center of mass
        const attraction = 0.1
        return {
          ...node,
          position: {
            x: node.position.x + (centerOfMass.x - node.position.x) * attraction,
            y: node.position.y + (centerOfMass.y - node.position.y) * attraction
          }
        }
      })

      // Apply spacing optimization
      layoutedNodes = this.optimizeSpacing(layoutedNodes, edges)
    }

    return normalizePositions(layoutedNodes)
  }
}