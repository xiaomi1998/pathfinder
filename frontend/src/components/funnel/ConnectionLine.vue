<template>
  <g 
    :class="[
      'connection-line cursor-pointer transition-all duration-300',
      { 
        'selected': selected,
        'highlighted': highlighted,
        'animated': animated 
      }
    ]"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Main connection path -->
    <path
      :d="connectionPath"
      fill="none"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      stroke-dasharray="none"
      marker-end="url(#arrow)"
      class="connection-path"
    />
    
    <!-- Invisible thick path for easier clicking -->
    <path
      :d="connectionPath"
      fill="none"
      stroke="transparent"
      stroke-width="20"
      class="connection-hitbox"
    />
    
    <!-- Connection label -->
    <g v-if="edge.data.label || showLabel" class="connection-label">
      <rect
        :x="labelPosition.x - labelWidth / 2"
        :y="labelPosition.y - 12"
        :width="labelWidth"
        height="24"
        rx="12"
        :fill="labelBackgroundColor"
        opacity="0.9"
        class="label-background"
      />
      <text
        :x="labelPosition.x"
        :y="labelPosition.y"
        text-anchor="middle"
        dominant-baseline="middle"
        :class="[
          'text-xs font-medium pointer-events-none',
          selected ? 'fill-white' : 'fill-gray-700 dark:fill-gray-300'
        ]"
      >
        {{ displayLabel }}
      </text>
    </g>
    
    <!-- Flow animation -->
    <circle
      v-if="showFlowAnimation"
      r="3"
      :fill="flowAnimationColor"
      opacity="0.8"
      class="flow-particle"
    >
      <animateMotion
        :dur="flowAnimationDuration"
        repeatCount="indefinite"
        :path="connectionPath"
      />
    </circle>
    
    <!-- Connection statistics -->
    <g v-if="analytics && showAnalytics" class="connection-analytics">
      <rect
        :x="analyticsPosition.x - 30"
        :y="analyticsPosition.y - 10"
        width="60"
        height="20"
        rx="10"
        fill="rgba(0,0,0,0.7)"
        class="analytics-background"
      />
      <text
        :x="analyticsPosition.x"
        :y="analyticsPosition.y"
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-xs font-medium fill-white pointer-events-none"
      >
        {{ formatAnalytics(analytics) }}
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FunnelEdge, FunnelNode, Position } from '@/types/funnel'

// Props & Emits
interface Props {
  edge: FunnelEdge
  sourceNode: FunnelNode
  targetNode: FunnelNode
  selected?: boolean
  highlighted?: boolean
  animated?: boolean
  showLabel?: boolean
  showAnalytics?: boolean
  showFlowAnimation?: boolean
  analytics?: {
    traversals: number
    conversionRate: number
    averageTraversalTime: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  highlighted: false,
  animated: false,
  showLabel: false,
  showAnalytics: false,
  showFlowAnimation: false
})

const emit = defineEmits<{
  select: [edgeId: string]
  hover: [edgeId: string, isHovering: boolean]
  'context-menu': [edgeId: string, position: Position]
}>()

// State
const isHovered = ref(false)

// Computed Properties - Enhanced with intelligent routing
const connectionPath = computed(() => {
  // Calculate node dimensions
  const sourceNodeWidth = Math.max(120, props.sourceNode.data.label.length * 8 + 40)
  const sourceNodeHeight = 40 + (props.sourceNode.data.description ? 16 : 0)
  const targetNodeWidth = Math.max(120, props.targetNode.data.label.length * 8 + 40)
  const targetNodeHeight = 40 + (props.targetNode.data.description ? 16 : 0)
  
  // Calculate connection points
  const sourceX = props.sourceNode.position.x + sourceNodeWidth // Right edge of source
  const sourceY = props.sourceNode.position.y + sourceNodeHeight / 2  // Middle of source
  const targetX = props.targetNode.position.x       // Left edge of target
  const targetY = props.targetNode.position.y + targetNodeHeight / 2  // Middle of target
  
  // Calculate intelligent control points
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Adaptive control point calculation
  let controlPointOffset: number
  if (Math.abs(dx) < 50 && Math.abs(dy) > 100) {
    // Vertical routing for closely aligned nodes
    controlPointOffset = Math.max(100, Math.abs(dy) * 0.3)
  } else {
    // Standard horizontal routing
    controlPointOffset = Math.max(Math.abs(dx) * 0.5, Math.min(distance * 0.4, 120))
  }
  
  // Handle special cases for better routing
  if (dx < 0) {
    // Reverse connection - route around
    const midY = (sourceY + targetY) / 2
    const routeOffset = Math.max(100, Math.abs(dx) * 0.3)
    
    return `M ${sourceX},${sourceY} 
            C ${sourceX + routeOffset},${sourceY} 
            ${sourceX + routeOffset},${midY} 
            ${sourceX + routeOffset},${midY}
            C ${sourceX + routeOffset},${targetY} 
            ${targetX - routeOffset},${targetY} 
            ${targetX},${targetY}`
  }
  
  const cp1x = sourceX + controlPointOffset
  const cp1y = sourceY
  const cp2x = targetX - controlPointOffset
  const cp2y = targetY
  
  return `M ${sourceX},${sourceY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${targetX},${targetY}`
})

const strokeColor = computed(() => {
  if (props.selected) return '#3b82f6'
  if (props.highlighted) return '#10b981'
  if (isHovered.value) return '#6366f1'
  
  // Color by edge type or condition
  switch (props.edge.type) {
    case 'conditional': return '#f59e0b'
    case 'fallback': return '#ef4444'
    case 'success': return '#10b981'
    case 'failure': return '#ef4444'
    default: return '#6b7280'
  }
})

const strokeWidth = computed(() => {
  if (props.selected) return 3
  if (props.highlighted || isHovered.value) return 2.5
  return 2
})

const labelPosition = computed((): Position => {
  // Use the same calculation as connectionPath for consistency
  const sourceNodeWidth = Math.max(120, props.sourceNode.data.label.length * 8 + 40)
  const sourceNodeHeight = 40 + (props.sourceNode.data.description ? 16 : 0)
  const targetNodeHeight = 40 + (props.targetNode.data.description ? 16 : 0)
  
  const sourceX = props.sourceNode.position.x + sourceNodeWidth
  const sourceY = props.sourceNode.position.y + sourceNodeHeight / 2
  const targetX = props.targetNode.position.x
  const targetY = props.targetNode.position.y + targetNodeHeight / 2
  
  // Calculate the actual midpoint of the bezier curve
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  
  if (dx < 0) {
    // For reverse connections, place label at the furthest point
    const routeOffset = Math.max(100, Math.abs(dx) * 0.3)
    return {
      x: sourceX + routeOffset,
      y: (sourceY + targetY) / 2 - 15
    }
  }
  
  // For normal connections, use the cubic bezier midpoint approximation
  const t = 0.5 // Parameter for midpoint
  const controlPointOffset = Math.max(Math.abs(dx) * 0.5, Math.min(Math.sqrt(dx * dx + dy * dy) * 0.4, 120))
  
  const cp1x = sourceX + controlPointOffset
  const cp1y = sourceY
  const cp2x = targetX - controlPointOffset
  const cp2y = targetY
  
  // Cubic bezier curve evaluation at t = 0.5
  const midX = Math.pow(1-t, 3) * sourceX + 3 * Math.pow(1-t, 2) * t * cp1x + 
               3 * (1-t) * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * targetX
  const midY = Math.pow(1-t, 3) * sourceY + 3 * Math.pow(1-t, 2) * t * cp1y + 
               3 * (1-t) * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * targetY
  
  return {
    x: midX,
    y: midY - 15
  }
})

const analyticsPosition = computed((): Position => {
  const sourceX = props.sourceNode.position.x + 120
  const sourceY = props.sourceNode.position.y + 30
  const targetX = props.targetNode.position.x
  const targetY = props.targetNode.position.y + 30
  
  // Position analytics closer to target
  return {
    x: targetX - 80,
    y: (sourceY + targetY) / 2
  }
})

const displayLabel = computed(() => {
  if (props.edge.data.label) return props.edge.data.label
  
  // Generate label based on edge type
  switch (props.edge.type) {
    case 'conditional': return '条件'
    case 'success': return '成功'
    case 'failure': return '失败'
    case 'fallback': return '兜底'
    default: return ''
  }
})

const labelWidth = computed(() => {
  return Math.max(displayLabel.value.length * 8 + 16, 40)
})

const labelBackgroundColor = computed(() => {
  if (props.selected) return '#3b82f6'
  if (isHovered.value) return '#6366f1'
  return '#f3f4f6'
})

const flowAnimationColor = computed(() => {
  return props.selected ? '#3b82f6' : '#10b981'
})

const flowAnimationDuration = computed(() => {
  // Faster animation for shorter connections
  const sourceX = props.sourceNode.position.x + 120
  const targetX = props.targetNode.position.x
  const distance = Math.abs(targetX - sourceX)
  return `${Math.max(distance / 100, 1)}s`
})

// Methods
const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('select', props.edge.id)
}

const handleMouseEnter = () => {
  isHovered.value = true
  emit('hover', props.edge.id, true)
}

const handleMouseLeave = () => {
  isHovered.value = false
  emit('hover', props.edge.id, false)
}

const formatAnalytics = (analytics: any) => {
  if (analytics.traversals >= 1000) {
    return `${(analytics.traversals / 1000).toFixed(1)}K`
  }
  return analytics.traversals.toString()
}
</script>

<style scoped>
.connection-line {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.connection-line.selected {
  filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
}

.connection-line.highlighted {
  filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.5));
}

.connection-line.animated .connection-path {
  stroke-dasharray: 8 4;
  animation: dash 2s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: -24;
  }
}

.connection-path {
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.label-background {
  transition: fill 0.2s ease;
}

.flow-particle {
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.8));
}

.analytics-background {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.connection-line:hover .analytics-background {
  opacity: 1;
}
</style>