import type { FunnelNode, FunnelEdge, Position } from '@/types/funnel'
import type { LayoutBounds, LayoutPerformanceConfig } from '@/types/layout'
import { getNodeBounds, getNodeCollectionBounds } from './layout'

/**
 * Performance optimization utilities for large funnel graphs
 */

export class PerformanceOptimizer {
  private config: LayoutPerformanceConfig
  private visibilityCache = new Map<string, boolean>()
  private boundsCache = new Map<string, LayoutBounds>()
  private lastViewport: LayoutBounds | null = null
  private renderQueue: Set<string> = new Set()
  private frameId: number | null = null

  constructor(config: LayoutPerformanceConfig) {
    this.config = config
  }

  /**
   * Determine which nodes should be rendered based on viewport culling
   */
  getVisibleNodes(
    nodes: FunnelNode[],
    viewport: LayoutBounds,
    zoomLevel: number = 1
  ): FunnelNode[] {
    if (!this.config.enableViewportCulling || nodes.length < this.config.maxVisibleNodes) {
      return nodes
    }

    // Clear cache if viewport changed significantly
    if (this.shouldClearCache(viewport)) {
      this.visibilityCache.clear()
      this.boundsCache.clear()
      this.lastViewport = viewport
    }

    const visibleNodes: FunnelNode[] = []
    const margin = 100 // Extra margin for smooth scrolling

    nodes.forEach(node => {
      const cacheKey = `${node.id}-${zoomLevel.toFixed(2)}`
      
      if (!this.visibilityCache.has(cacheKey)) {
        const nodeBounds = this.getNodeBoundsWithCache(node)
        const isVisible = this.isNodeInViewport(nodeBounds, viewport, margin)
        this.visibilityCache.set(cacheKey, isVisible)
      }

      if (this.visibilityCache.get(cacheKey)) {
        visibleNodes.push(node)
      }
    })

    // Ensure we don't exceed the max visible nodes limit
    if (visibleNodes.length > this.config.maxVisibleNodes) {
      return this.prioritizeNodes(visibleNodes, viewport).slice(0, this.config.maxVisibleNodes)
    }

    return visibleNodes
  }

  /**
   * Get visible edges based on visible nodes
   */
  getVisibleEdges(
    edges: FunnelEdge[],
    visibleNodes: Set<string>,
    simplifyThreshold?: number
  ): FunnelEdge[] {
    const threshold = simplifyThreshold ?? this.config.simplifyEdgesThreshold
    
    let visibleEdges = edges.filter(edge => 
      visibleNodes.has(edge.source) && visibleNodes.has(edge.target)
    )

    // Simplify edges if we exceed the threshold
    if (visibleEdges.length > threshold) {
      visibleEdges = this.simplifyEdges(visibleEdges)
    }

    return visibleEdges
  }

  /**
   * Implement level of detail (LOD) for nodes based on zoom level
   */
  applyLevelOfDetail(
    nodes: FunnelNode[],
    zoomLevel: number
  ): Array<FunnelNode & { lodLevel: 'full' | 'simplified' | 'minimal' }> {
    if (!this.config.enableLevelOfDetail) {
      return nodes.map(node => ({ ...node, lodLevel: 'full' as const }))
    }

    return nodes.map(node => {
      let lodLevel: 'full' | 'simplified' | 'minimal'

      if (zoomLevel > 1.5) {
        lodLevel = 'full'
      } else if (zoomLevel > 0.5) {
        lodLevel = 'simplified'
      } else {
        lodLevel = 'minimal'
      }

      return { ...node, lodLevel }
    })
  }

  /**
   * Batch node updates to reduce DOM manipulations
   */
  batchNodeUpdates(
    nodeUpdates: Array<{ nodeId: string; updates: any }>,
    batchSize?: number
  ): Promise<void> {
    const batch = batchSize ?? this.config.batchSize

    return new Promise((resolve) => {
      let currentIndex = 0

      const processBatch = () => {
        const endIndex = Math.min(currentIndex + batch, nodeUpdates.length)
        
        for (let i = currentIndex; i < endIndex; i++) {
          const { nodeId, updates } = nodeUpdates[i]
          this.renderQueue.add(nodeId)
          // Apply updates here
        }

        currentIndex = endIndex

        if (currentIndex < nodeUpdates.length) {
          // Use requestAnimationFrame for smooth batching
          requestAnimationFrame(processBatch)
        } else {
          resolve()
        }
      }

      processBatch()
    })
  }

  /**
   * Optimize layout calculations using spatial indexing
   */
  createSpatialIndex(nodes: FunnelNode[], cellSize: number = 200): Map<string, FunnelNode[]> {
    const spatialIndex = new Map<string, FunnelNode[]>()

    nodes.forEach(node => {
      const bounds = this.getNodeBoundsWithCache(node)
      const cellX = Math.floor(bounds.x / cellSize)
      const cellY = Math.floor(bounds.y / cellSize)
      const cellKey = `${cellX}-${cellY}`

      if (!spatialIndex.has(cellKey)) {
        spatialIndex.set(cellKey, [])
      }
      spatialIndex.get(cellKey)!.push(node)
    })

    return spatialIndex
  }

  /**
   * Find nearby nodes efficiently using spatial index
   */
  findNearbyNodes(
    targetNode: FunnelNode,
    allNodes: FunnelNode[],
    radius: number,
    spatialIndex?: Map<string, FunnelNode[]>
  ): FunnelNode[] {
    if (!spatialIndex) {
      // Fallback to brute force for small datasets
      return this.findNearbyNodesBruteForce(targetNode, allNodes, radius)
    }

    const targetBounds = this.getNodeBoundsWithCache(targetNode)
    const cellSize = 200
    const searchRadius = Math.ceil(radius / cellSize)
    const centerCellX = Math.floor(targetBounds.x / cellSize)
    const centerCellY = Math.floor(targetBounds.y / cellSize)

    const nearbyNodes: FunnelNode[] = []
    const processed = new Set<string>()

    // Search in nearby cells
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        const cellX = centerCellX + dx
        const cellY = centerCellY + dy
        const cellKey = `${cellX}-${cellY}`
        const cellNodes = spatialIndex.get(cellKey) || []

        cellNodes.forEach(node => {
          if (processed.has(node.id) || node.id === targetNode.id) return
          processed.add(node.id)

          const distance = this.calculateDistance(targetBounds, this.getNodeBoundsWithCache(node))
          if (distance <= radius) {
            nearbyNodes.push(node)
          }
        })
      }
    }

    return nearbyNodes
  }

  /**
   * Debounce layout calculations to avoid excessive recalculations
   */
  debounceLayoutCalculation(
    calculationFn: () => void,
    delay: number = 150
  ): () => void {
    let timeoutId: NodeJS.Timeout | null = null

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        calculationFn()
        timeoutId = null
      }, delay)
    }
  }

  /**
   * Use Web Workers for heavy layout calculations if available
   */
  async calculateLayoutInWorker(
    nodes: FunnelNode[],
    edges: FunnelEdge[],
    algorithm: string,
    config: any
  ): Promise<FunnelNode[]> {
    if (!this.config.enableWebWorkers || !window.Worker) {
      // Fallback to main thread
      throw new Error('Web Workers not available')
    }

    return new Promise((resolve, reject) => {
      const worker = new Worker('/layout-worker.js')
      
      worker.postMessage({
        type: 'CALCULATE_LAYOUT',
        payload: {
          nodes: nodes.map(n => ({ id: n.id, position: n.position, type: n.type })),
          edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
          algorithm,
          config
        }
      })

      worker.onmessage = (event) => {
        const { type, payload } = event.data

        if (type === 'LAYOUT_RESULT') {
          // Merge results with original node data
          const resultNodes = payload.nodes.map((resultNode: any) => {
            const originalNode = nodes.find(n => n.id === resultNode.id)
            return originalNode ? { ...originalNode, position: resultNode.position } : null
          }).filter(Boolean)

          resolve(resultNodes)
        } else if (type === 'LAYOUT_ERROR') {
          reject(new Error(payload.message))
        }

        worker.terminate()
      }

      worker.onerror = (error) => {
        reject(error)
        worker.terminate()
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        worker.terminate()
        reject(new Error('Layout calculation timeout'))
      }, 30000)
    })
  }

  /**
   * Optimize rendering with requestIdleCallback
   */
  scheduleRenderOptimization(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 1000 })
    } else {
      // Fallback to setTimeout
      setTimeout(callback, 0)
    }
  }

  /**
   * Monitor performance metrics
   */
  measurePerformance<T>(
    operation: string,
    fn: () => T
  ): { result: T; duration: number; memoryUsage?: number } {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize

    const result = fn()

    const endTime = performance.now()
    const endMemory = (performance as any).memory?.usedJSHeapSize
    const duration = endTime - startTime

    const metrics = {
      result,
      duration,
      ...(startMemory && endMemory && {
        memoryUsage: endMemory - startMemory
      })
    }

    console.debug(`Performance [${operation}]:`, {
      duration: `${duration.toFixed(2)}ms`,
      ...(metrics.memoryUsage && {
        memory: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      })
    })

    return metrics
  }

  /**
   * Private helper methods
   */

  private shouldClearCache(viewport: LayoutBounds): boolean {
    if (!this.lastViewport) return true

    const threshold = 100
    return (
      Math.abs(viewport.x - this.lastViewport.x) > threshold ||
      Math.abs(viewport.y - this.lastViewport.y) > threshold ||
      Math.abs(viewport.width - this.lastViewport.width) > threshold ||
      Math.abs(viewport.height - this.lastViewport.height) > threshold
    )
  }

  private getNodeBoundsWithCache(node: FunnelNode): LayoutBounds {
    const cacheKey = `${node.id}-${node.position.x}-${node.position.y}`
    
    if (!this.boundsCache.has(cacheKey)) {
      const bounds = getNodeBounds(node)
      this.boundsCache.set(cacheKey, bounds)
    }

    return this.boundsCache.get(cacheKey)!
  }

  private isNodeInViewport(
    nodeBounds: LayoutBounds,
    viewport: LayoutBounds,
    margin: number = 0
  ): boolean {
    return !(
      nodeBounds.x + nodeBounds.width < viewport.x - margin ||
      nodeBounds.x > viewport.x + viewport.width + margin ||
      nodeBounds.y + nodeBounds.height < viewport.y - margin ||
      nodeBounds.y > viewport.y + viewport.height + margin
    )
  }

  private prioritizeNodes(nodes: FunnelNode[], viewport: LayoutBounds): FunnelNode[] {
    const viewportCenter = {
      x: viewport.x + viewport.width / 2,
      y: viewport.y + viewport.height / 2
    }

    // Sort by distance from viewport center and node importance
    return nodes.sort((a, b) => {
      const distanceA = this.calculateDistanceToPoint(this.getNodeBoundsWithCache(a), viewportCenter)
      const distanceB = this.calculateDistanceToPoint(this.getNodeBoundsWithCache(b), viewportCenter)
      
      // Prioritize start/end nodes
      const importanceA = (a.type === 'start' || a.type === 'end') ? 0 : 1
      const importanceB = (b.type === 'start' || b.type === 'end') ? 0 : 1
      
      return (importanceA - importanceB) || (distanceA - distanceB)
    })
  }

  private simplifyEdges(edges: FunnelEdge[]): FunnelEdge[] {
    // Remove duplicate edges and prioritize important connections
    const uniqueConnections = new Map<string, FunnelEdge>()

    edges.forEach(edge => {
      const connectionKey = `${edge.source}-${edge.target}`
      const reverseKey = `${edge.target}-${edge.source}`
      
      if (!uniqueConnections.has(connectionKey) && !uniqueConnections.has(reverseKey)) {
        uniqueConnections.set(connectionKey, edge)
      }
    })

    return Array.from(uniqueConnections.values())
  }

  private findNearbyNodesBruteForce(
    targetNode: FunnelNode,
    allNodes: FunnelNode[],
    radius: number
  ): FunnelNode[] {
    const targetBounds = this.getNodeBoundsWithCache(targetNode)
    
    return allNodes.filter(node => {
      if (node.id === targetNode.id) return false
      
      const nodeBounds = this.getNodeBoundsWithCache(node)
      const distance = this.calculateDistance(targetBounds, nodeBounds)
      
      return distance <= radius
    })
  }

  private calculateDistance(bounds1: LayoutBounds, bounds2: LayoutBounds): number {
    const center1 = {
      x: bounds1.x + bounds1.width / 2,
      y: bounds1.y + bounds1.height / 2
    }
    const center2 = {
      x: bounds2.x + bounds2.width / 2,
      y: bounds2.y + bounds2.height / 2
    }

    return Math.sqrt(
      Math.pow(center2.x - center1.x, 2) +
      Math.pow(center2.y - center1.y, 2)
    )
  }

  private calculateDistanceToPoint(bounds: LayoutBounds, point: Position): number {
    const center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2
    }

    return Math.sqrt(
      Math.pow(point.x - center.x, 2) +
      Math.pow(point.y - center.y, 2)
    )
  }

  /**
   * Clean up caches and resources
   */
  dispose(): void {
    this.visibilityCache.clear()
    this.boundsCache.clear()
    this.renderQueue.clear()
    this.lastViewport = null
    
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LayoutPerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Clear caches when config changes
    this.visibilityCache.clear()
    this.boundsCache.clear()
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number;
    visibilityCacheSize: number;
    boundsCache: number;
    renderQueueSize: number;
  } {
    return {
      cacheSize: this.visibilityCache.size + this.boundsCache.size,
      visibilityCacheSize: this.visibilityCache.size,
      boundsCache: this.boundsCache.size,
      renderQueueSize: this.renderQueue.size
    }
  }
}

/**
 * Create a performance optimizer with default settings
 */
export function createPerformanceOptimizer(
  overrides?: Partial<LayoutPerformanceConfig>
): PerformanceOptimizer {
  const defaultConfig: LayoutPerformanceConfig = {
    enableViewportCulling: true,
    maxVisibleNodes: 100,
    enableLevelOfDetail: true,
    simplifyEdgesThreshold: 200,
    enableWebWorkers: false, // Disabled by default
    batchSize: 10
  }

  return new PerformanceOptimizer({ ...defaultConfig, ...overrides })
}

/**
 * Utility functions for performance monitoring
 */

export function measureRenderTime<T>(fn: () => T): { result: T; renderTime: number } {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  
  return {
    result,
    renderTime: end - start
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): T {
  let timeout: NodeJS.Timeout | null
  
  return ((...args: any[]) => {
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(this, args)
  }) as T
}