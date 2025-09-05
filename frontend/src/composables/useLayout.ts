import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { FunnelNode, FunnelEdge, Position } from '@/types/funnel'
import type { 
  LayoutConfig, 
  LayoutAnalysis, 
  LayoutTransition,
  SnapGuide,
  LayoutAlgorithm 
} from '@/types/layout'
import { LayoutManager } from '@/managers/LayoutManager'
import { LAYOUT_CONSTANTS } from '@/utils/layout'

export function useLayout(
  nodes: Ref<FunnelNode[]>,
  edges: Ref<FunnelEdge[]>
) {
  // State
  const layoutManager = new LayoutManager()
  const isApplyingLayout = ref(false)
  const layoutConfig = ref<LayoutConfig>({
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
  })

  const layoutAnalysis = ref<LayoutAnalysis | null>(null)
  const activeSnapGuides = ref<SnapGuide[]>([])
  const layoutHistory = ref<string[]>([])
  const currentLayoutIndex = ref(-1)

  // Computed
  const canUndo = computed(() => currentLayoutIndex.value > 0)
  const canRedo = computed(() => currentLayoutIndex.value < layoutHistory.value.length - 1)

  const layoutQualityScore = computed(() => {
    return layoutAnalysis.value?.layoutScore ?? 0
  })

  const hasLayoutIssues = computed(() => {
    if (!layoutAnalysis.value) return false
    return layoutAnalysis.value.isMessy || 
           layoutAnalysis.value.hasCircularDependencies ||
           layoutAnalysis.value.overlappingNodes.length > 0 ||
           layoutAnalysis.value.disconnectedClusters.some(c => c.isDisconnected)
  })

  const layoutSuggestions = computed(() => {
    return layoutAnalysis.value?.suggestions ?? []
  })

  // Methods
  const applyLayout = async (algorithm?: LayoutAlgorithm, customConfig?: Partial<LayoutConfig>) => {
    if (isApplyingLayout.value || nodes.value.length === 0) return

    isApplyingLayout.value = true

    try {
      const config: LayoutConfig = {
        ...layoutConfig.value,
        ...(algorithm && { algorithm }),
        ...customConfig
      }

      const layoutedNodes = await layoutManager.applyLayout(nodes.value, edges.value, config)
      
      if (config.animationDuration > 0) {
        await animateLayout(nodes.value, layoutedNodes, {
          duration: config.animationDuration,
          easing: 'ease-in-out',
          stagger: 50,
          groupByLevel: algorithm === 'hierarchical'
        })
      } else {
        // Apply immediately
        updateNodePositions(layoutedNodes)
      }

      layoutConfig.value = config
      analyzeCurrentLayout()

    } catch (error) {
      console.error('Failed to apply layout:', error)
    } finally {
      isApplyingLayout.value = false
    }
  }

  const autoArrange = async (preferences?: {
    prioritizeFlow?: boolean;
    maintainClusters?: boolean;
    optimizeForReadability?: boolean;
  }) => {
    if (isApplyingLayout.value || nodes.value.length === 0) return

    isApplyingLayout.value = true

    try {
      const layoutedNodes = await layoutManager.autoArrange(nodes.value, edges.value, preferences)
      
      await animateLayout(nodes.value, layoutedNodes, {
        duration: layoutConfig.value.animationDuration,
        easing: 'ease-in-out',
        stagger: 30,
        groupByLevel: true
      })

      analyzeCurrentLayout()

    } catch (error) {
      console.error('Failed to auto-arrange layout:', error)
    } finally {
      isApplyingLayout.value = false
    }
  }

  const optimizeSpacing = async () => {
    if (isApplyingLayout.value || nodes.value.length === 0) return

    isApplyingLayout.value = true

    try {
      const optimizedNodes = layoutManager.optimizeSpacing(nodes.value, edges.value)
      
      await animateLayout(nodes.value, optimizedNodes, {
        duration: 300,
        easing: 'ease-out',
        stagger: 20,
        groupByLevel: false
      })

      analyzeCurrentLayout()

    } catch (error) {
      console.error('Failed to optimize spacing:', error)
    } finally {
      isApplyingLayout.value = false
    }
  }

  const analyzeCurrentLayout = () => {
    if (nodes.value.length === 0) {
      layoutAnalysis.value = null
      return
    }

    layoutAnalysis.value = layoutManager.analyzeLayout(nodes.value, edges.value)
  }

  const handleDragPosition = (
    dragPosition: Position,
    dragNodeId: string,
    options: {
      enableGridSnap?: boolean;
      enableMagneticAlignment?: boolean;
    } = {}
  ) => {
    const opts = {
      enableGridSnap: options.enableGridSnap ?? layoutConfig.value.snapToGrid,
      enableMagneticAlignment: options.enableMagneticAlignment ?? layoutConfig.value.enableMagneticAlignment,
      gridSize: layoutConfig.value.gridSize
    }

    const result = layoutManager.handleDragPositioning(dragPosition, dragNodeId, nodes.value, opts)
    
    // Update active snap guides
    activeSnapGuides.value = result.snapInfo.activeGuides

    return result
  }

  const positionNewNode = (
    nodeType: string,
    context?: {
      nearNode?: string;
      preferredDirection?: 'top' | 'right' | 'bottom' | 'left';
    }
  ) => {
    return layoutManager.positionNewNode(nodes.value, nodeType, context)
  }

  const animateLayout = (
    fromNodes: FunnelNode[],
    toNodes: FunnelNode[],
    config: {
      duration: number;
      easing: string;
      stagger: number;
      groupByLevel: boolean;
    }
  ): Promise<void> => {
    return new Promise((resolve) => {
      const transitions = layoutManager.createLayoutTransitions(fromNodes, toNodes, config)
      
      if (transitions.length === 0) {
        updateNodePositions(toNodes)
        resolve()
        return
      }

      let completedTransitions = 0
      const totalTransitions = transitions.length

      transitions.forEach((transition, index) => {
        const delay = config.groupByLevel ? 0 : config.stagger * index
        
        setTimeout(() => {
          animateNodePosition(transition, () => {
            completedTransitions++
            if (completedTransitions === totalTransitions) {
              resolve()
            }
          })
        }, delay)
      })
    })
  }

  const animateNodePosition = (transition: LayoutTransition, onComplete: () => void) => {
    const nodeIndex = nodes.value.findIndex(n => n.id === transition.nodeId)
    if (nodeIndex === -1) {
      onComplete()
      return
    }

    // Create D3 transition
    d3.select({})
      .transition()
      .duration(transition.duration)
      .ease(d3.easeInOut)
      .tween('position', () => {
        const interpolateX = d3.interpolate(transition.fromPosition.x, transition.toPosition.x)
        const interpolateY = d3.interpolate(transition.fromPosition.y, transition.toPosition.y)
        
        return (t: number) => {
          if (nodeIndex < nodes.value.length) {
            nodes.value[nodeIndex] = {
              ...nodes.value[nodeIndex],
              position: {
                x: interpolateX(t),
                y: interpolateY(t)
              }
            }
          }
        }
      })
      .on('end', onComplete)
  }

  const updateNodePositions = (newNodes: FunnelNode[]) => {
    newNodes.forEach(newNode => {
      const existingIndex = nodes.value.findIndex(n => n.id === newNode.id)
      if (existingIndex >= 0) {
        nodes.value[existingIndex] = {
          ...nodes.value[existingIndex],
          position: newNode.position
        }
      }
    })
  }

  const undoLayout = () => {
    const result = layoutManager.undo()
    if (result) {
      updateNodePositions(result.nodes)
      layoutConfig.value = result.config
      analyzeCurrentLayout()
    }
  }

  const redoLayout = () => {
    const result = layoutManager.redo()
    if (result) {
      updateNodePositions(result.nodes)
      layoutConfig.value = result.config
      analyzeCurrentLayout()
    }
  }

  const updateLayoutConfig = (updates: Partial<LayoutConfig>) => {
    layoutConfig.value = { ...layoutConfig.value, ...updates }
  }

  const detectLayoutIssues = () => {
    analyzeCurrentLayout()
    return {
      hasIssues: hasLayoutIssues.value,
      issues: layoutAnalysis.value,
      suggestions: layoutSuggestions.value
    }
  }

  const clearSnapGuides = () => {
    activeSnapGuides.value = []
  }

  // Auto-analysis when nodes or edges change
  watch([nodes, edges], () => {
    if (nodes.value.length > 0) {
      // Debounce analysis to avoid too frequent updates
      setTimeout(() => analyzeCurrentLayout(), 100)
    }
  }, { deep: true })

  // Initialize
  onMounted(() => {
    analyzeCurrentLayout()
  })

  // Cleanup
  onUnmounted(() => {
    layoutManager.dispose()
  })

  return {
    // State
    isApplyingLayout,
    layoutConfig,
    layoutAnalysis,
    activeSnapGuides,
    
    // Computed
    canUndo,
    canRedo,
    layoutQualityScore,
    hasLayoutIssues,
    layoutSuggestions,
    
    // Methods
    applyLayout,
    autoArrange,
    optimizeSpacing,
    analyzeCurrentLayout,
    handleDragPosition,
    positionNewNode,
    undoLayout,
    redoLayout,
    updateLayoutConfig,
    detectLayoutIssues,
    clearSnapGuides,
    
    // Layout algorithms
    applyHierarchicalLayout: () => applyLayout('hierarchical'),
    applyForceDirectedLayout: () => applyLayout('force-directed'),
    applyGridLayout: () => applyLayout('grid'),
    applyCircularLayout: () => applyLayout('circular'),
    
    // Quick actions
    quickFix: async () => {
      if (hasLayoutIssues.value && layoutSuggestions.value.length > 0) {
        // Apply the highest priority suggestion
        const topSuggestion = layoutSuggestions.value[0]
        if (topSuggestion.action) {
          topSuggestion.action()
        }
      }
    },
    
    resetToManualLayout: () => applyLayout('manual')
  }
}