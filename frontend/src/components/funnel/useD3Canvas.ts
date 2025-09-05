import { ref, computed, onMounted, onUnmounted, nextTick, type Ref } from 'vue'
import * as d3 from 'd3'
import type { Position, FunnelNode, FunnelEdge } from '@/types/funnel'
import type { ZoomTransform, CanvasViewport } from './types'
import { calculateNodeBounds, snapToGrid } from './utils'

export function useD3Canvas(
  svgRef: Ref<SVGElement | undefined>,
  containerRef: Ref<SVGGElement | undefined>,
  options: {
    snapToGrid?: boolean
    gridSize?: number
    minZoom?: number
    maxZoom?: number
    wheelDelta?: number
  } = {}
) {
  // Default options
  const {
    snapToGrid: enableSnap = false,
    gridSize = 20,
    minZoom = 0.1,
    maxZoom = 3,
    wheelDelta = 0.002
  } = options

  // State
  const isInitialized = ref(false)
  const currentTransform = ref<ZoomTransform>({ x: 0, y: 0, k: 1 })
  const viewport = ref<CanvasViewport>({ 
    x: 0, 
    y: 0, 
    width: 800, 
    height: 600, 
    zoom: 1 
  })

  // D3 behaviors
  let zoom: d3.ZoomBehavior<SVGElement, unknown>
  let drag: d3.DragBehavior<SVGGElement, unknown, unknown>

  // Computed
  const zoomLevel = computed(() => currentTransform.value.k)
  const panPosition = computed(() => ({
    x: currentTransform.value.x,
    y: currentTransform.value.y
  }))

  // Initialize D3 behaviors
  const initializeD3 = async () => {
    await nextTick()
    
    if (!svgRef.value || !containerRef.value) {
      console.warn('SVG or container ref not available for D3 initialization')
      return
    }

    const svg = d3.select(svgRef.value)
    const container = d3.select(containerRef.value)

    // Update viewport dimensions
    const rect = svgRef.value.getBoundingClientRect()
    viewport.value = {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height,
      zoom: 1
    }

    // Initialize zoom behavior
    zoom = d3.zoom<SVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .wheelDelta((event) => -event.deltaY * wheelDelta)
      .on('zoom', (event: d3.D3ZoomEvent<SVGElement, unknown>) => {
        const { transform } = event
        currentTransform.value = {
          x: transform.x,
          y: transform.y,
          k: transform.k
        }
        
        container.attr('transform', transform.toString())
        
        // Update viewport
        viewport.value = {
          x: -transform.x / transform.k,
          y: -transform.y / transform.k,
          width: rect.width / transform.k,
          height: rect.height / transform.k,
          zoom: transform.k
        }
      })

    // Apply zoom to SVG
    svg.call(zoom)
      .on('dblclick.zoom', null) // Disable double-click zoom

    isInitialized.value = true
  }

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = (screenPos: Position): Position => {
    if (!svgRef.value) return screenPos

    const rect = svgRef.value.getBoundingClientRect()
    const transform = currentTransform.value
    
    const canvasPos = {
      x: (screenPos.x - rect.left - transform.x) / transform.k,
      y: (screenPos.y - rect.top - transform.y) / transform.k
    }

    return enableSnap ? snapToGrid(canvasPos, gridSize) : canvasPos
  }

  // Transform canvas coordinates to screen coordinates
  const canvasToScreen = (canvasPos: Position): Position => {
    if (!svgRef.value) return canvasPos

    const rect = svgRef.value.getBoundingClientRect()
    const transform = currentTransform.value
    
    return {
      x: canvasPos.x * transform.k + transform.x + rect.left,
      y: canvasPos.y * transform.k + transform.y + rect.top
    }
  }

  // Zoom and pan controls
  const zoomIn = (factor = 1.2) => {
    if (!svgRef.value || !zoom) return
    
    d3.select(svgRef.value)
      .transition()
      .duration(300)
      .call(zoom.scaleBy, factor)
  }

  const zoomOut = (factor = 0.8) => {
    if (!svgRef.value || !zoom) return
    
    d3.select(svgRef.value)
      .transition()
      .duration(300)
      .call(zoom.scaleBy, factor)
  }

  const zoomToFit = (
    nodes: FunnelNode[], 
    padding = 50,
    duration = 500
  ) => {
    if (!svgRef.value || !zoom || nodes.length === 0) return

    const bounds = calculateNodeBounds(nodes)
    const width = bounds.maxX - bounds.minX + padding * 2
    const height = bounds.maxY - bounds.minY + padding * 2
    
    const rect = svgRef.value.getBoundingClientRect()
    const scale = Math.min(
      rect.width / width,
      rect.height / height,
      maxZoom
    )
    
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const translateX = rect.width / 2 - centerX * scale
    const translateY = rect.height / 2 - centerY * scale
    
    d3.select(svgRef.value)
      .transition()
      .duration(duration)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(translateX, translateY)
          .scale(scale)
      )
  }

  const resetZoom = (duration = 500) => {
    if (!svgRef.value || !zoom) return
    
    d3.select(svgRef.value)
      .transition()
      .duration(duration)
      .call(zoom.transform, d3.zoomIdentity)
  }

  const panTo = (position: Position, duration = 300) => {
    if (!svgRef.value || !zoom) return
    
    const rect = svgRef.value.getBoundingClientRect()
    const transform = currentTransform.value
    
    const targetX = rect.width / 2 - position.x * transform.k
    const targetY = rect.height / 2 - position.y * transform.k
    
    d3.select(svgRef.value)
      .transition()
      .duration(duration)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(targetX, targetY)
          .scale(transform.k)
      )
  }

  const zoomToNode = (node: FunnelNode, duration = 300) => {
    panTo(node.position, duration)
  }

  // Get visible area in canvas coordinates
  const getVisibleArea = () => {
    return viewport.value
  }

  // Check if a point is visible in the current viewport
  const isPointVisible = (position: Position, margin = 0): boolean => {
    const v = viewport.value
    return (
      position.x >= v.x - margin &&
      position.x <= v.x + v.width + margin &&
      position.y >= v.y - margin &&
      position.y <= v.y + v.height + margin
    )
  }

  // Check if a node is visible
  const isNodeVisible = (node: FunnelNode): boolean => {
    const nodeWidth = 120 // approximate
    const nodeHeight = 60 // approximate
    
    return (
      isPointVisible(node.position) ||
      isPointVisible({
        x: node.position.x + nodeWidth,
        y: node.position.y + nodeHeight
      })
    )
  }

  // Event handlers
  const handleResize = () => {
    if (!svgRef.value) return
    
    const rect = svgRef.value.getBoundingClientRect()
    viewport.value = {
      ...viewport.value,
      width: rect.width,
      height: rect.height
    }
  }

  // Lifecycle
  onMounted(() => {
    initializeD3()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  // Create minimap data
  const createMinimapData = (nodes: FunnelNode[], edges: FunnelEdge[]) => {
    const bounds = calculateNodeBounds(nodes)
    const scale = 0.1 // Minimap scale factor
    
    return {
      nodes: nodes.map(node => ({
        ...node,
        position: {
          x: (node.position.x - bounds.minX) * scale,
          y: (node.position.y - bounds.minY) * scale
        }
      })),
      edges: edges.map(edge => ({
        ...edge,
        // Edge paths will be recalculated with scaled positions
      })),
      bounds: {
        width: (bounds.maxX - bounds.minX) * scale,
        height: (bounds.maxY - bounds.minY) * scale
      },
      viewport: {
        x: (-currentTransform.value.x / currentTransform.value.k - bounds.minX) * scale,
        y: (-currentTransform.value.y / currentTransform.value.k - bounds.minY) * scale,
        width: (viewport.value.width) * scale,
        height: (viewport.value.height) * scale
      }
    }
  }

  return {
    // State
    isInitialized,
    currentTransform,
    viewport,
    zoomLevel,
    panPosition,
    
    // Methods
    initializeD3,
    screenToCanvas,
    canvasToScreen,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,
    panTo,
    zoomToNode,
    getVisibleArea,
    isPointVisible,
    isNodeVisible,
    createMinimapData,
    
    // Event handlers
    handleResize
  }
}