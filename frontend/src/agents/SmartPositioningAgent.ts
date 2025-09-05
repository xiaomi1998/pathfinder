import type { FunnelNode, Position } from '@/types/funnel'
import type { 
  ISmartPositioningAgent,
  SnapGuide,
  MagneticAlignment
} from '@/types/layout'
import {
  LAYOUT_CONSTANTS,
  snapToGrid,
  shouldSnapToGuide,
  getNodeBounds,
  getNodeCenter,
  calculateDistance,
  generateOptimalPositionForNewNode,
  checkNodeOverlap
} from '@/utils/layout'

export class SmartPositioningAgent implements ISmartPositioningAgent {
  private magneticThreshold = LAYOUT_CONSTANTS.MAGNETIC_THRESHOLD

  /**
   * Snap position to grid with intelligent threshold
   */
  snapToGrid(position: Position, gridSize: number): Position {
    return snapToGrid(position, gridSize)
  }

  /**
   * Find magnetic alignment opportunities for a node
   */
  findMagneticAlignments(nodeId: string, nodes: FunnelNode[], threshold: number): MagneticAlignment[] {
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return []

    const alignments: MagneticAlignment[] = []
    const targetCenter = getNodeCenter(targetNode)

    // Group other nodes by proximity in X and Y axes
    const horizontalCandidates: FunnelNode[] = []
    const verticalCandidates: FunnelNode[] = []

    nodes.forEach(node => {
      if (node.id === nodeId) return

      const nodeCenter = getNodeCenter(node)
      const xDiff = Math.abs(nodeCenter.x - targetCenter.x)
      const yDiff = Math.abs(nodeCenter.y - targetCenter.y)

      if (xDiff <= threshold) {
        verticalCandidates.push(node)
      }
      if (yDiff <= threshold) {
        horizontalCandidates.push(node)
      }
    })

    // Create horizontal alignment if candidates exist
    if (horizontalCandidates.length > 0) {
      alignments.push({
        sourceNode: nodeId,
        targetNodes: horizontalCandidates.map(n => n.id),
        direction: 'horizontal',
        threshold
      })
    }

    // Create vertical alignment if candidates exist
    if (verticalCandidates.length > 0) {
      alignments.push({
        sourceNode: nodeId,
        targetNodes: verticalCandidates.map(n => n.id),
        direction: 'vertical',
        threshold
      })
    }

    return alignments
  }

  /**
   * Generate snap guides for all nodes
   */
  generateSnapGuides(nodes: FunnelNode[]): SnapGuide[] {
    if (nodes.length < 2) return []

    const guides: SnapGuide[] = []
    const positions = nodes.map(node => ({
      id: node.id,
      center: getNodeCenter(node),
      bounds: getNodeBounds(node)
    }))

    // Generate horizontal guides (same Y coordinate)
    const yPositions = new Map<number, string[]>()
    positions.forEach(pos => {
      const y = Math.round(pos.center.y)
      if (!yPositions.has(y)) {
        yPositions.set(y, [])
      }
      yPositions.get(y)!.push(pos.id)

      // Also add guides for top and bottom edges
      const topY = Math.round(pos.bounds.y)
      const bottomY = Math.round(pos.bounds.y + pos.bounds.height)
      
      if (!yPositions.has(topY)) yPositions.set(topY, [])
      if (!yPositions.has(bottomY)) yPositions.set(bottomY, [])
      yPositions.get(topY)!.push(`${pos.id}-top`)
      yPositions.get(bottomY)!.push(`${pos.id}-bottom`)
    })

    yPositions.forEach((nodeIds, y) => {
      if (nodeIds.length > 1) {
        guides.push({
          type: 'horizontal',
          position: y,
          nodes: nodeIds,
          strength: nodeIds.length / nodes.length
        })
      }
    })

    // Generate vertical guides (same X coordinate)
    const xPositions = new Map<number, string[]>()
    positions.forEach(pos => {
      const x = Math.round(pos.center.x)
      if (!xPositions.has(x)) {
        xPositions.set(x, [])
      }
      xPositions.get(x)!.push(pos.id)

      // Also add guides for left and right edges
      const leftX = Math.round(pos.bounds.x)
      const rightX = Math.round(pos.bounds.x + pos.bounds.width)
      
      if (!xPositions.has(leftX)) xPositions.set(leftX, [])
      if (!xPositions.has(rightX)) xPositions.set(rightX, [])
      xPositions.get(leftX)!.push(`${pos.id}-left`)
      xPositions.get(rightX)!.push(`${pos.id}-right`)
    })

    xPositions.forEach((nodeIds, x) => {
      if (nodeIds.length > 1) {
        guides.push({
          type: 'vertical',
          position: x,
          nodes: nodeIds,
          strength: nodeIds.length / nodes.length
        })
      }
    })

    // Sort guides by strength (more nodes aligned = stronger guide)
    return guides.sort((a, b) => b.strength - a.strength)
  }

  /**
   * Calculate optimal position for a new node
   */
  calculateOptimalPositionForNewNode(existingNodes: FunnelNode[], nodeType: string): Position {
    const canvasSize = { width: 800, height: 600 } // Default canvas size
    return generateOptimalPositionForNewNode(existingNodes, nodeType, canvasSize)
  }

  /**
   * Preserve layout proportions during zoom operations
   */
  preserveLayoutDuringZoom(nodes: FunnelNode[], zoomFactor: number, center: Position): FunnelNode[] {
    if (nodes.length === 0) return nodes

    return nodes.map(node => {
      // Calculate relative position from zoom center
      const relativeX = node.position.x - center.x
      const relativeY = node.position.y - center.y

      // Scale relative position
      const scaledX = relativeX * zoomFactor
      const scaledY = relativeY * zoomFactor

      // Calculate new absolute position
      return {
        ...node,
        position: {
          x: center.x + scaledX,
          y: center.y + scaledY
        }
      }
    })
  }

  /**
   * Apply magnetic alignment to a node position
   */
  applyMagneticAlignment(
    position: Position, 
    nodes: FunnelNode[], 
    threshold: number = this.magneticThreshold
  ): Position {
    let adjustedPosition = { ...position }
    const snapGuides = this.generateSnapGuides(nodes)

    // Apply horizontal snapping
    const horizontalGuides = snapGuides.filter(g => g.type === 'horizontal')
    for (const guide of horizontalGuides) {
      if (shouldSnapToGuide(position.y, guide.position, threshold)) {
        adjustedPosition.y = guide.position
        break // Apply only the strongest guide
      }
    }

    // Apply vertical snapping
    const verticalGuides = snapGuides.filter(g => g.type === 'vertical')
    for (const guide of verticalGuides) {
      if (shouldSnapToGuide(position.x, guide.position, threshold)) {
        adjustedPosition.x = guide.position
        break // Apply only the strongest guide
      }
    }

    return adjustedPosition
  }

  /**
   * Calculate smart spacing when inserting a node between existing nodes
   */
  calculateInsertPosition(
    sourceNode: FunnelNode, 
    targetNode: FunnelNode, 
    insertRatio: number = 0.5
  ): Position {
    const sourceCenter = getNodeCenter(sourceNode)
    const targetCenter = getNodeCenter(targetNode)

    // Calculate base position
    const baseX = sourceCenter.x + (targetCenter.x - sourceCenter.x) * insertRatio
    const baseY = sourceCenter.y + (targetCenter.y - sourceCenter.y) * insertRatio

    // Offset slightly to avoid overlap
    const offsetDistance = LAYOUT_CONSTANTS.MIN_NODE_SPACING
    const angle = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x)
    const perpendicular = angle + Math.PI / 2

    return {
      x: baseX + Math.cos(perpendicular) * offsetDistance - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
      y: baseY + Math.sin(perpendicular) * offsetDistance - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
    }
  }

  /**
   * Auto-arrange nodes in a local area to prevent overlaps
   */
  autoArrangeLocalArea(
    nodes: FunnelNode[], 
    centerPosition: Position, 
    radius: number
  ): FunnelNode[] {
    // Filter nodes within the radius
    const localNodes = nodes.filter(node => {
      const nodeCenter = getNodeCenter(node)
      const distance = calculateDistance(nodeCenter, centerPosition)
      return distance <= radius
    })

    if (localNodes.length < 2) return nodes

    // Sort by distance from center
    localNodes.sort((a, b) => {
      const distanceA = calculateDistance(getNodeCenter(a), centerPosition)
      const distanceB = calculateDistance(getNodeCenter(b), centerPosition)
      return distanceA - distanceB
    })

    // Arrange in spiral pattern to avoid overlaps
    const arrangedNodes = [...nodes]
    const angleStep = (2 * Math.PI) / Math.max(8, localNodes.length)
    let currentRadius = LAYOUT_CONSTANTS.MIN_NODE_SPACING

    localNodes.forEach((node, index) => {
      const angle = index * angleStep
      const spiralRadius = currentRadius + (index * LAYOUT_CONSTANTS.MIN_NODE_SPACING / 4)
      
      const newPosition = {
        x: centerPosition.x + spiralRadius * Math.cos(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
        y: centerPosition.y + spiralRadius * Math.sin(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
      }

      const nodeIndex = arrangedNodes.findIndex(n => n.id === node.id)
      if (nodeIndex >= 0) {
        arrangedNodes[nodeIndex] = {
          ...arrangedNodes[nodeIndex],
          position: newPosition
        }
      }
    })

    return arrangedNodes
  }

  /**
   * Intelligent position adjustment during drag operations
   */
  adjustPositionDuringDrag(
    dragPosition: Position,
    dragNodeId: string,
    allNodes: FunnelNode[],
    options: {
      enableGridSnap: boolean;
      enableMagneticAlignment: boolean;
      gridSize: number;
    }
  ): {
    position: Position;
    snapInfo: {
      snappedToGrid: boolean;
      snappedToGuide: boolean;
      activeGuides: SnapGuide[];
    };
  } {
    let adjustedPosition = { ...dragPosition }
    let snappedToGrid = false
    let snappedToGuide = false
    let activeGuides: SnapGuide[] = []

    const otherNodes = allNodes.filter(n => n.id !== dragNodeId)

    // Apply grid snapping first
    if (options.enableGridSnap) {
      const gridSnapped = this.snapToGrid(dragPosition, options.gridSize)
      if (gridSnapped.x !== dragPosition.x || gridSnapped.y !== dragPosition.y) {
        adjustedPosition = gridSnapped
        snappedToGrid = true
      }
    }

    // Apply magnetic alignment if not snapped to grid or if magnetic alignment is stronger
    if (options.enableMagneticAlignment) {
      const magneticPosition = this.applyMagneticAlignment(
        snappedToGrid ? adjustedPosition : dragPosition,
        otherNodes,
        this.magneticThreshold
      )

      if (magneticPosition.x !== adjustedPosition.x || magneticPosition.y !== adjustedPosition.y) {
        adjustedPosition = magneticPosition
        snappedToGuide = true
        activeGuides = this.generateSnapGuides(otherNodes).filter(guide => {
          const threshold = this.magneticThreshold
          return (guide.type === 'horizontal' && shouldSnapToGuide(dragPosition.y, guide.position, threshold)) ||
                 (guide.type === 'vertical' && shouldSnapToGuide(dragPosition.x, guide.position, threshold))
        })
      }
    }

    return {
      position: adjustedPosition,
      snapInfo: {
        snappedToGrid,
        snappedToGuide,
        activeGuides
      }
    }
  }

  /**
   * Calculate balanced position for a node with multiple connections
   */
  calculateBalancedPosition(
    connectedNodes: FunnelNode[],
    constraints: {
      minDistance: number;
      preferredDistance: number;
      avoidOverlaps: boolean;
    }
  ): Position {
    if (connectedNodes.length === 0) {
      return { x: 400, y: 300 } // Default center
    }

    if (connectedNodes.length === 1) {
      // Position near the single connected node
      const connectedCenter = getNodeCenter(connectedNodes[0])
      return {
        x: connectedCenter.x + constraints.preferredDistance,
        y: connectedCenter.y
      }
    }

    // Calculate center of mass of connected nodes
    let totalX = 0
    let totalY = 0
    let totalWeight = 0

    connectedNodes.forEach(node => {
      const center = getNodeCenter(node)
      const weight = 1 // Could be based on edge importance
      totalX += center.x * weight
      totalY += center.y * weight
      totalWeight += weight
    })

    const centerOfMass = {
      x: totalX / totalWeight,
      y: totalY / totalWeight
    }

    let candidatePosition = {
      x: centerOfMass.x - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
      y: centerOfMass.y - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
    }

    // Avoid overlaps if required
    if (constraints.avoidOverlaps) {
      const testNode: FunnelNode = {
        id: 'test',
        type: 'event',
        position: candidatePosition,
        data: { label: 'test', config: {} }
      }

      let attempts = 0
      const maxAttempts = 8
      const offsetDistance = constraints.preferredDistance

      while (attempts < maxAttempts) {
        const hasOverlap = connectedNodes.some(node => checkNodeOverlap(node, testNode))
        
        if (!hasOverlap) break

        // Try positions around the center of mass
        const angle = (attempts * Math.PI * 2) / maxAttempts
        candidatePosition = {
          x: centerOfMass.x + offsetDistance * Math.cos(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2,
          y: centerOfMass.y + offsetDistance * Math.sin(angle) - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2
        }
        
        testNode.position = candidatePosition
        attempts++
      }
    }

    return candidatePosition
  }

  /**
   * Generate position suggestions for node placement
   */
  generatePositionSuggestions(
    existingNodes: FunnelNode[],
    nodeType: string,
    context?: {
      nearNode?: string;
      preferredDirection?: 'top' | 'right' | 'bottom' | 'left';
      maintainSpacing?: boolean;
    }
  ): Position[] {
    const suggestions: Position[] = []

    if (context?.nearNode) {
      const referenceNode = existingNodes.find(n => n.id === context.nearNode)
      if (referenceNode) {
        const refCenter = getNodeCenter(referenceNode)
        const spacing = LAYOUT_CONSTANTS.OPTIMAL_NODE_SPACING

        // Generate positions around the reference node
        const directions = context.preferredDirection ? [context.preferredDirection] : ['top', 'right', 'bottom', 'left']
        
        directions.forEach(direction => {
          let position: Position
          switch (direction) {
            case 'top':
              position = { x: refCenter.x - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2, y: refCenter.y - spacing - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT }
              break
            case 'right':
              position = { x: refCenter.x + spacing, y: refCenter.y - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2 }
              break
            case 'bottom':
              position = { x: refCenter.x - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH / 2, y: refCenter.y + spacing }
              break
            case 'left':
            default:
              position = { x: refCenter.x - spacing - LAYOUT_CONSTANTS.DEFAULT_NODE_WIDTH, y: refCenter.y - LAYOUT_CONSTANTS.DEFAULT_NODE_HEIGHT / 2 }
              break
          }
          suggestions.push(position)
        })
      }
    } else {
      // Generate general optimal positions
      suggestions.push(this.calculateOptimalPositionForNewNode(existingNodes, nodeType))
    }

    return suggestions
  }
}