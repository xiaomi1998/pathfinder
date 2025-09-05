<template>
  <g 
    :class="[
      'funnel-node cursor-pointer transition-all duration-200',
      { 
        'selected': selected, 
        'multi-selected': isMultiSelected && !selected,
        'batch-operation': isPartOfBatchOperation,
        'dragging': isDragging || isTouchDragging,
        'touch-enabled': isTouchSupported,
        'mobile-optimized': isTouchSupported
      }
    ]"
    :transform="`translate(${node.position.x}, ${node.position.y})`"
    :data-node-id="node.id"
    :data-touch-target="optimalTouchTarget"
    :data-multi-selected="isMultiSelected"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @mousedown="startDrag"
    @contextmenu.prevent="handleContextMenu"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- Node shadow -->
    <rect
      x="2"
      y="2"
      :width="nodeWidth"
      :height="nodeHeight"
      :rx="borderRadius"
      fill="rgba(0,0,0,0.1)"
      class="node-shadow"
    />
    
    <!-- Main node body -->
    <rect
      ref="nodeRect"
      x="0"
      y="0"
      :width="Math.max(nodeWidth, isTouchSupported ? optimalTouchTarget : nodeWidth)"
      :height="Math.max(nodeHeight, isTouchSupported ? optimalTouchTarget : nodeHeight)"
      :rx="borderRadius"
      :fill="getNodeFill()"
      :stroke="getNodeStroke()"
      :stroke-width="selected ? 3 : 2"
      class="node-body transition-all duration-200"
    />
    
    <!-- Touch target overlay (invisible, for better touch precision) -->
    <rect
      v-if="isTouchSupported"
      x="-10"
      y="-10"
      :width="nodeWidth + 20"
      :height="nodeHeight + 20"
      fill="transparent"
      class="touch-target-overlay"
    />
    
    <!-- Node icon -->
    <g :transform="`translate(8, 8)`">
      <foreignObject width="20" height="20">
        <div class="flex items-center justify-center w-5 h-5">
          <component
            :is="getNodeIcon()"
            class="w-4 h-4 text-white"
          />
        </div>
      </foreignObject>
    </g>
    
    <!-- Node label -->
    <text
      x="32"
      y="16"
      class="node-label text-sm font-medium fill-white"
      dominant-baseline="middle"
    >
      {{ truncatedLabel }}
    </text>
    
    <!-- Node description -->
    <text
      v-if="node.data.description && nodeHeight > 40"
      x="32"
      y="32"
      class="node-description text-xs fill-white opacity-80"
      dominant-baseline="middle"
    >
      {{ truncatedDescription }}
    </text>
    
    <!-- Analytics display -->
    <g v-if="analytics && showAnalytics" class="analytics">
      <rect
        :x="nodeWidth - 60"
        y="4"
        width="56"
        height="20"
        rx="10"
        fill="rgba(0,0,0,0.3)"
        class="analytics-bg"
      />
      
      <!-- Conversion rate -->
      <text
        :x="nodeWidth - 32"
        y="16"
        text-anchor="middle"
        class="analytics-text text-xs font-medium fill-white"
        dominant-baseline="middle"
      >
        {{ formatConversionRate(analytics.conversion_rate) }}
      </text>
      
      <!-- Visitor count -->
      <text
        :x="nodeWidth - 32"
        y="nodeHeight - 6"
        text-anchor="middle"
        class="analytics-count text-xs fill-white opacity-75"
        dominant-baseline="middle"
      >
        {{ formatCount(analytics.visits) }}
      </text>
    </g>
    
    <!-- Connection points -->
    <g v-if="!readonly" class="connection-points">
      <!-- Input connection points -->
      <g v-if="canHaveInputs">
        <circle
          v-for="(inputPoint, index) in inputPoints"
          :key="`input-${index}`"
          :cx="inputPoint.x"
          :cy="inputPoint.y"
          r="8"
          fill="#3b82f6"
          stroke="white"
          stroke-width="3"
          :class="[
            'connection-point input-point cursor-crosshair transition-all duration-200',
            showConnectionPoints || isHovered ? 'opacity-100' : 'opacity-0'
          ]"
          @mouseenter="highlightConnectionPoint(true, 'input', index)"
          @mouseleave="highlightConnectionPoint(false, 'input', index)"
          @mouseup.stop="handleConnectionEnd"
        />
        <!-- Input connection point labels -->
        <text
          v-for="(inputPoint, index) in inputPoints"
          v-if="showConnectionPoints && inputPoints.length > 1"
          :key="`input-label-${index}`"
          :x="inputPoint.x"
          :y="inputPoint.y - 15"
          text-anchor="middle"
          class="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
        >
          {{ inputPoint.label }}
        </text>
      </g>
      
      <!-- Output connection points -->
      <g v-if="canHaveOutputs">
        <circle
          v-for="(outputPoint, index) in outputPoints"
          :key="`output-${index}`"
          :cx="outputPoint.x"
          :cy="outputPoint.y"
          r="8"
          fill="#10b981"
          stroke="white"
          stroke-width="3"
          :class="[
            'connection-point output-point cursor-crosshair transition-all duration-200',
            showConnectionPoints || isHovered ? 'opacity-100' : 'opacity-0'
          ]"
          @mouseenter="highlightConnectionPoint(true, 'output', index)"
          @mouseleave="highlightConnectionPoint(false, 'output', index)"
          @mousedown.stop="handleConnectionStart(outputPoint, index)"
        />
        <!-- Output connection point labels -->
        <text
          v-for="(outputPoint, index) in outputPoints"
          v-if="showConnectionPoints && outputPoints.length > 1"
          :key="`output-label-${index}`"
          :x="outputPoint.x"
          :y="outputPoint.y - 15"
          text-anchor="middle"
          class="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
        >
          {{ outputPoint.label }}
        </text>
      </g>
    </g>
    
    <!-- Node actions (visible on hover) -->
    <g v-if="!readonly && (selected || isHovered)" class="node-actions">
      <!-- Edit button -->
      <g class="action-button" @click.stop="handleEdit">
        <circle
          :cx="nodeWidth - 16"
          :cy="16"
          r="10"
          fill="rgba(59, 130, 246, 0.9)"
          class="action-bg cursor-pointer hover:fill-blue-600 transition-colors duration-200"
        />
        <foreignObject :x="nodeWidth - 22" y="10" width="12" height="12">
          <div class="flex items-center justify-center w-3 h-3">
            <PencilIcon class="w-2.5 h-2.5 text-white" />
          </div>
        </foreignObject>
      </g>
      
      <!-- Delete button -->
      <g class="action-button" @click.stop="handleDelete">
        <circle
          :cx="nodeWidth - 16"
          :cy="nodeHeight - 16"
          r="10"
          fill="rgba(239, 68, 68, 0.9)"
          class="action-bg cursor-pointer hover:fill-red-600 transition-colors duration-200"
        />
        <foreignObject :x="nodeWidth - 22" :y="nodeHeight - 22" width="12" height="12">
          <div class="flex items-center justify-center w-3 h-3">
            <TrashIcon class="w-2.5 h-2.5 text-white" />
          </div>
        </foreignObject>
      </g>
      
      <!-- Data entry button (for event nodes) -->
      <g v-if="node.type === 'event'" class="action-button" @click.stop="handleDataEntry">
        <circle
          :cx="nodeWidth - 42"
          :cy="16"
          r="10"
          fill="rgba(16, 185, 129, 0.9)"
          class="action-bg cursor-pointer hover:fill-green-600 transition-colors duration-200"
        />
        <foreignObject :x="nodeWidth - 48" y="10" width="12" height="12">
          <div class="flex items-center justify-center w-3 h-3">
            <ChartBarIcon class="w-2.5 h-2.5 text-white" />
          </div>
        </foreignObject>
      </g>
    </g>
    
    <!-- Progress indicator for processing nodes -->
    <g v-if="isProcessing" class="processing-indicator">
      <rect
        x="0"
        :y="nodeHeight - 4"
        :width="nodeWidth"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="0"
        :y="nodeHeight - 4"
        :width="processingProgress * nodeWidth / 100"
        height="4"
        rx="2"
        fill="#3b82f6"
        class="processing-bar"
      >
        <animate
          attributeName="width"
          :values="`0;${nodeWidth};0`"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>
    </g>
    
    <!-- Validation errors -->
    <g v-if="validationErrors.length > 0" class="validation-errors">
      <circle
        :cx="nodeWidth - 8"
        cy="8"
        r="8"
        fill="#ef4444"
        class="error-indicator"
      />
      <text
        :x="nodeWidth - 8"
        y="8"
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-xs font-bold fill-white"
      >
        !
      </text>
    </g>
  </g>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, inject, watch } from 'vue'
import type { FunnelNode, NodeAnalytics, Position } from '@types/funnel'
import { Vector2D, createDragCalculator, BoundaryConstraint, GridSnapper } from '@/utils/coordinate-transform'
import { preciseRound } from '@/utils/math-precision'
import { memoryManager, acquireVector2D, releaseVector2D } from '@/utils/memory-manager'
import { renderOptimizer, optimizeDragTransform, enableGPUAcceleration } from '@/utils/render-optimizer'
import { eventOptimizer, optimizeDragEvents } from '@/utils/event-optimizer'
import { cacheOptimizer } from '@/utils/cache-optimizer'
import { touchEventHandler, TouchMouseMapper, isTouchDevice, getMobileOptimalTouchTarget, type TouchPointInfo } from '@/utils/touch-event-handler'
import { MultiSelectionManager } from '@/utils/multi-selection-manager'
import { BatchOperationsEngine } from '@/utils/batch-operations-engine'
import { AdvancedGestureRecognition } from '@/utils/advanced-gesture-recognition'
import { SmartSnappingAlignmentManager } from '@/utils/smart-snapping-alignment'
// Agent 6: Physics Engine Integration
import { PhysicsAnimationIntegrationManager, PhysicsEnhancedNode, createStandardPhysicsEnhancement } from '@/utils/physics-animation-integration'
import { AdvancedEasingFunctions, createElasticConfig } from '@/utils/spring-animation-system'
import { createStandardPhysicsConfig } from '@/utils/physics-interaction-effects'
import { 
  PlayIcon, 
  StopIcon, 
  CubeIcon, 
  QuestionMarkCircleIcon,
  BoltIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingInIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CodeBracketIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
interface Props {
  node: FunnelNode
  selected?: boolean
  readonly?: boolean
  analytics?: NodeAnalytics
  showAnalytics?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  readonly: false,
  showAnalytics: true
})

const emit = defineEmits<{
  select: [nodeId: string, modifiers?: { ctrl?: boolean, shift?: boolean, alt?: boolean }]
  multiselect: [nodeIds: string[]]
  update: [nodeId: string, updates: Partial<FunnelNode>]
  batchUpdate: [updates: Array<{ nodeId: string, updates: Partial<FunnelNode> }>]
  delete: [nodeId: string]
  batchDelete: [nodeIds: string[]]
  edit: [nodeId: string]
  'data-entry': [nodeId: string]
  'connection-start': [nodeId: string, position: Position]
  'connection-end': [nodeId: string]
  'gesture-detected': [nodeId: string, gesture: string, data: any]
  'context-menu': [nodeId: string, position: Position, event: MouseEvent]
}>()

// State
const isDragging = ref(false)
const isHovered = ref(false)
const showConnectionPoints = ref(false)
const isProcessing = ref(false)
const processingProgress = ref(0)

// Precision Drag State
const dragCalculator = ref<any>(null)
const boundaryConstraint = ref<BoundaryConstraint | null>(null)
const gridSnapper = ref<GridSnapper | null>(null)
const dragStartTime = ref(0)
const dragPrecisionError = ref(0)

// Performance Optimization State
const dragCache = ref<any>(null)
const isGPUAccelerated = ref(false)
const optimizedEventHandlers = ref<any>(null)

// Touch Support State
const isTouchSupported = ref(isTouchDevice())
const touchStartPoint = ref<TouchPointInfo | null>(null)
const isTouchDragging = ref(false)
const touchPrecisionError = ref(0)
const optimalTouchTarget = ref(getMobileOptimalTouchTarget())

// Advanced Interaction State
const isMultiSelected = ref(false)
const isPartOfBatchOperation = ref(false)
const gestureRecognizer = ref<AdvancedGestureRecognition | null>(null)
const snappingManager = ref<SmartSnappingAlignmentManager | null>(null)
const longPressTimer = ref<number | null>(null)
const doubleClickTimer = ref<number | null>(null)
const lastClickTime = ref(0)

// Injected managers from parent
const multiSelectionManager = inject<MultiSelectionManager>('multiSelectionManager')
const batchOperationsEngine = inject<BatchOperationsEngine>('batchOperationsEngine')

// Agent 6: Physics Integration State
const physicsManager = inject<PhysicsAnimationIntegrationManager>('physicsManager')
const physicsNode = ref<PhysicsEnhancedNode | null>(null)
const physicsEnabled = ref(true)
const showPhysicsEffects = ref(false)
const physicsDebugMode = ref(false)

// Physics animation states
const isPhysicsDragging = ref(false)
const isThrowing = ref(false)
const isBouncing = ref(false)
const springAnimationActive = ref(false)

// Physics configuration
const physicsConfig = ref({
  enableInertia: true,
  enableBouncing: true,
  enableSprings: true,
  enableMagnetics: true,
  elasticity: 0.6,
  friction: 0.1,
  mass: 1.0,
  magneticStrength: 1.0
})

// Computed properties
const nodeWidth = computed(() => {
  const baseWidth = 120
  const labelWidth = props.node.data.label.length * 8
  return Math.max(baseWidth, Math.min(labelWidth + 40, 200))
})

const nodeHeight = computed(() => {
  let height = 40
  if (props.node.data.description) height += 16
  if (props.analytics && props.showAnalytics) height += 12
  return height
})

const borderRadius = computed(() => {
  switch (props.node.type) {
    case 'start':
    case 'end':
      return nodeHeight.value / 2 // Circular for start/end
    case 'condition':
      return 8 // Rounded rectangle for conditions
    default:
      return 4 // Slightly rounded for others
  }
})

const truncatedLabel = computed(() => {
  const maxLength = Math.floor((nodeWidth.value - 40) / 8)
  return props.node.data.label.length > maxLength 
    ? props.node.data.label.substring(0, maxLength - 3) + '...'
    : props.node.data.label
})

const truncatedDescription = computed(() => {
  if (!props.node.data.description) return ''
  const maxLength = Math.floor((nodeWidth.value - 40) / 6)
  return props.node.data.description.length > maxLength
    ? props.node.data.description.substring(0, maxLength - 3) + '...'
    : props.node.data.description
})

const canHaveInputs = computed(() => {
  return props.node.type !== 'start'
})

const canHaveOutputs = computed(() => {
  return props.node.type !== 'end'
})

const inputPoints = computed(() => {
  const points = []
  
  if (!canHaveInputs.value) return points
  
  // Most nodes have single input
  if (props.node.type === 'merge') {
    // Merge nodes have multiple inputs
    const maxInputs = 3
    const spacing = nodeHeight.value / (maxInputs + 1)
    for (let i = 0; i < maxInputs; i++) {
      points.push({
        x: 0,
        y: spacing * (i + 1),
        label: `输入 ${i + 1}`
      })
    }
  } else {
    // Single input point
    points.push({
      x: 0,
      y: nodeHeight.value / 2,
      label: '输入'
    })
  }
  
  return points
})

const outputPoints = computed(() => {
  const points = []
  
  if (!canHaveOutputs.value) return points
  
  if (props.node.type === 'decision') {
    // Decision nodes have multiple outputs
    const spacing = nodeHeight.value / 4
    points.push(
      { x: nodeWidth.value, y: spacing, label: '是' },
      { x: nodeWidth.value, y: spacing * 2, label: '否' },
      { x: nodeWidth.value, y: spacing * 3, label: '其他' }
    )
  } else if (props.node.type === 'split') {
    // Split nodes have multiple outputs
    const spacing = nodeHeight.value / 3
    points.push(
      { x: nodeWidth.value, y: spacing, label: '分支 A' },
      { x: nodeWidth.value, y: spacing * 2, label: '分支 B' }
    )
  } else if (props.node.type === 'condition') {
    // Condition nodes have true/false outputs
    const spacing = nodeHeight.value / 3
    points.push(
      { x: nodeWidth.value, y: spacing, label: '通过' },
      { x: nodeWidth.value, y: spacing * 2, label: '失败' }
    )
  } else if (props.node.type === 'custom' && props.node.data.config.maxOutputs > 1) {
    // Custom nodes with multiple outputs
    const maxOutputs = Math.min(props.node.data.config.maxOutputs || 1, 3)
    const spacing = nodeHeight.value / (maxOutputs + 1)
    for (let i = 0; i < maxOutputs; i++) {
      points.push({
        x: nodeWidth.value,
        y: spacing * (i + 1),
        label: `输出 ${i + 1}`
      })
    }
  } else {
    // Single output point
    points.push({
      x: nodeWidth.value,
      y: nodeHeight.value / 2,
      label: '输出'
    })
  }
  
  return points
})

const validationErrors = computed(() => {
  const errors = []
  
  // Check for required configuration
  if (props.node.type === 'event' && !props.node.data.config.event_name) {
    errors.push('Event name is required')
  }
  
  if (props.node.type === 'condition' && !props.node.data.config.conditions?.length) {
    errors.push('Conditions are required')
  }
  
  if (props.node.type === 'delay' && !props.node.data.config.delay_value) {
    errors.push('Delay value is required')
  }
  
  return errors
})

// Methods
const getNodeIcon = () => {
  switch (props.node.type) {
    case 'start': return PlayIcon
    case 'end': return StopIcon
    case 'decision': return QuestionMarkCircleIcon
    case 'action': return BoltIcon
    case 'conversion': return CubeIcon
    case 'condition': return CubeIcon
    case 'merge': return ArrowsPointingInIcon
    case 'custom': return CodeBracketIcon
    default: return CubeIcon
  }
}

const getNodeFill = () => {
  if (props.selected) {
    return `url(#${props.node.type}NodeGradient)`
  }
  
  switch (props.node.type) {
    case 'start': return '#10b981'
    case 'decision': return '#f59e0b'
    case 'action': return '#8b5cf6'
    case 'conversion': return '#10b981'
    case 'condition': return '#3b82f6'
    case 'merge': return '#ec4899'
    case 'end': return '#ef4444'
    case 'custom': return '#6b7280'
    default: return '#6b7280'
  }
}

const getNodeStroke = () => {
  if (props.selected) return '#1d4ed8'
  if (validationErrors.value.length > 0) return '#ef4444'
  return 'transparent'
}

const formatConversionRate = (rate: number) => {
  return `${(rate * 100).toFixed(1)}%`
}

const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}

const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  
  const currentTime = performance.now()
  const timeSinceLastClick = currentTime - lastClickTime.value
  lastClickTime.value = currentTime
  
  // Handle double-click detection
  if (timeSinceLastClick < 300) {
    if (doubleClickTimer.value) {
      clearTimeout(doubleClickTimer.value)
      doubleClickTimer.value = null
    }
    handleDoubleClick(event)
    return
  }
  
  // Handle multi-selection with keyboard modifiers
  const modifiers = {
    ctrl: event.ctrlKey || event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey
  }
  
  if (multiSelectionManager) {
    if (modifiers.ctrl) {
      // Toggle selection
      multiSelectionManager.toggleSelection(props.node.id)
      isMultiSelected.value = multiSelectionManager.isSelected(props.node.id)
    } else if (modifiers.shift) {
      // Range selection
      multiSelectionManager.extendSelection(props.node.id)
      isMultiSelected.value = true
    } else {
      // Clear other selections and select this node
      multiSelectionManager.clearSelection()
      multiSelectionManager.addToSelection(props.node.id)
      isMultiSelected.value = true
    }
    
    // Emit multi-selection event
    emit('multiselect', multiSelectionManager.getSelectedIds())
  } else {
    // Fallback to single selection
    emit('select', props.node.id, modifiers)
  }
  
  // Schedule single-click action (if not followed by double-click)
  doubleClickTimer.value = setTimeout(() => {
    doubleClickTimer.value = null
    // Single-click actions can be handled here
  }, 300)
}

const handleDoubleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('edit', props.node.id)
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  // If this node is not selected and we have multi-selection, 
  // select this node for context menu
  if (multiSelectionManager && !multiSelectionManager.isSelected(props.node.id)) {
    if (!event.ctrlKey && !event.shiftKey) {
      multiSelectionManager.clearSelection()
    }
    multiSelectionManager.addToSelection(props.node.id)
    isMultiSelected.value = true
  }
  
  const position = {
    x: event.clientX,
    y: event.clientY
  }
  
  emit('context-menu', props.node.id, position, event)
}

const handleEdit = () => {
  emit('edit', props.node.id)
}

const handleDelete = () => {
  emit('delete', props.node.id)
}

const handleDataEntry = () => {
  emit('data-entry', props.node.id)
}

// Touch Event Handlers
const handleTouchStart = (event: TouchEvent) => {
  if (props.readonly || !isTouchSupported.value) return
  
  console.log('FunnelNode: Starting touch interaction for node:', props.node.id)
  
  event.preventDefault() // 防止滚动和其他默认行为
  event.stopPropagation()
  
  const touch = event.touches[0]
  if (!touch) return
  
  // 创建TouchPointInfo对象
  const touchPoint: TouchPointInfo = {
    id: touch.identifier,
    position: new Vector2D(touch.clientX, touch.clientY),
    pressure: (touch as any).force || (touch as any).webkitForce || 0.5,
    radius: new Vector2D(touch.radiusX || 10, touch.radiusY || 10),
    angle: (touch as any).rotationAngle || 0,
    timestamp: performance.now(),
    velocity: Vector2D.zero(),
    acceleration: Vector2D.zero()
  }
  
  touchStartPoint.value = touchPoint
  dragStartTime.value = performance.now()
  
  // Start long press timer for context menu
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
  }
  
  longPressTimer.value = setTimeout(() => {
    if (touchStartPoint.value && !isTouchDragging.value) {
      console.log('FunnelNode: Long press detected on touch')
      
      // Create synthetic context menu event
      const contextEvent = new MouseEvent('contextmenu', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      })
      
      handleContextMenu(contextEvent)
      
      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
    longPressTimer.value = null
  }, 600) // Long press threshold: 600ms
  
  // Delay drag start to allow for long press detection
  setTimeout(() => {
    if (touchStartPoint.value && longPressTimer.value) {
      isTouchDragging.value = true
      const compatibleEvent = TouchMouseMapper.createCompatibleEvent(touchPoint)
      startDragLogic(compatibleEvent, true) // true表示是触控事件
    }
  }, 100) // Small delay to differentiate tap from drag
}

const handleTouchMove = (event: TouchEvent) => {
  if (props.readonly || !touchStartPoint.value) return
  
  event.preventDefault()
  
  const touch = event.touches[0]
  if (!touch) return
  
  const currentTouchPoint: TouchPointInfo = {
    id: touch.identifier,
    position: new Vector2D(touch.clientX, touch.clientY),
    pressure: (touch as any).force || (touch as any).webkitForce || 0.5,
    radius: new Vector2D(touch.radiusX || 10, touch.radiusY || 10),
    angle: (touch as any).rotationAngle || 0,
    timestamp: performance.now(),
    velocity: Vector2D.zero(),
    acceleration: Vector2D.zero()
  }
  
  // 计算触控精度误差
  const deltaFromStart = currentTouchPoint.position.distanceTo(touchStartPoint.value.position)
  touchPrecisionError.value = deltaFromStart
  
  // Cancel long press if we've moved significantly
  if (deltaFromStart > 10 && longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
    
    // Start dragging if not already
    if (!isTouchDragging.value) {
      isTouchDragging.value = true
      const compatibleEvent = TouchMouseMapper.createCompatibleEvent(touchStartPoint.value)
      startDragLogic(compatibleEvent, true)
    }
  }
  
  // Continue dragging if active
  if (isTouchDragging.value) {
    // 如果移动距离太小，忽略此次移动（减少噪声）
    if (deltaFromStart < 3) return
    
    // 创建兼容的事件对象
    const compatibleEvent = TouchMouseMapper.createCompatibleEvent(currentTouchPoint)
    onDragMove(compatibleEvent)
  }
}

const handleTouchEnd = (event: TouchEvent) => {
  console.log('FunnelNode: Touch end for node:', props.node.id)
  
  // Clear timers
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  // Handle tap if no drag occurred
  if (touchStartPoint.value && !isTouchDragging.value && touchPrecisionError.value < 10) {
    // This is a tap, handle as click
    const touch = event.changedTouches[0]
    if (touch) {
      const syntheticEvent = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      })
      handleClick(syntheticEvent)
    }
  }
  
  // Handle drag end if dragging was active
  if (isTouchDragging.value) {
    const touchDuration = performance.now() - dragStartTime.value
    console.log('FunnelNode: Touch drag duration:', touchDuration.toFixed(2), 'ms')
    console.log('FunnelNode: Touch precision error:', touchPrecisionError.value.toFixed(3), 'px')
    
    onDragEnd()
  }
  
  // Reset touch state
  isTouchDragging.value = false
  touchStartPoint.value = null
  touchPrecisionError.value = 0
}

const startDrag = (event: MouseEvent) => {
  if (props.readonly) return
  
  // 如果是触控设备且有触控事件，优先使用触控处理
  if (isTouchSupported.value && isTouchDragging.value) {
    return
  }
  
  console.log('FunnelNode: Starting physics-enhanced drag for node:', props.node.id)
  
  // Agent 6: Start physics-enhanced drag
  if (physicsEnabled.value && physicsManager && physicsNode.value) {
    startPhysicsDrag(event)
  } else {
    startDragLogic(event, false) // Fallback to standard drag
  }
}

// Agent 6: Physics-enhanced drag start
const startPhysicsDrag = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  isPhysicsDragging.value = true
  isDragging.value = true
  dragStartTime.value = performance.now()
  
  const dragPosition = new Vector2D(event.clientX, event.clientY)
  
  // Start physics drag with enhanced effects
  if (physicsManager && physicsNode.value) {
    physicsManager.startNodeDrag(physicsNode.value.id, dragPosition)
  }
  
  // Apply spring animation feedback
  if (physicsConfig.value.enableSprings) {
    applySpringFeedback('drag-start')
  }
  
  // Enable GPU acceleration for smooth dragging
  if (!isGPUAccelerated.value) {
    const nodeElement = event.currentTarget as Element
    enableGPUAcceleration(nodeElement)
    isGPUAccelerated.value = true
  }
  
  // Set up mouse event listeners
  document.addEventListener('mousemove', onPhysicsDragMove, { passive: false })
  document.addEventListener('mouseup', onPhysicsDragEnd)
  
  console.log(`FunnelNode: Physics drag started for node ${props.node.id}`)
}

// 统一的拖拽启动逻辑
const startDragLogic = (event: any, isTouch: boolean) => {
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  dragStartTime.value = performance.now()
  
  console.log(`FunnelNode: Starting ${isTouch ? 'touch' : 'mouse'} drag with precision mode`)
  
  // 获取clientX和clientY，无论是触控还是鼠标事件
  const clientX = event.clientX || 0
  const clientY = event.clientY || 0
  
  // Acquire drag cache from memory pool
  dragCache.value = memoryManager.acquireDragCache()
  
  // Enable GPU acceleration for smooth dragging
  if (!isGPUAccelerated.value) {
    const nodeElement = event.currentTarget as Element
    enableGPUAcceleration(nodeElement)
    isGPUAccelerated.value = true
  }
  
  // Get the SVG element
  const svgElement = (event.currentTarget as Element).closest('svg')
  if (!svgElement) return
  
  // Initialize precision drag calculator
  try {
    // Get current transform state with better precision
    let zoom = 1, panX = 0, panY = 0
    
    const d3Transform = (svgElement as any).__zoom
    if (d3Transform) {
      zoom = d3Transform.k || 1
      panX = d3Transform.x || 0
      panY = d3Transform.y || 0
    } else {
      // Fallback: parse transform attribute with improved precision
      const containerGroup = svgElement.querySelector('g[transform]') as SVGGElement
      if (containerGroup) {
        const transformAttr = containerGroup.getAttribute('transform')
        if (transformAttr) {
          const translateMatch = transformAttr.match(/translate\(([^,)]+)[,\s]+([^,)]+)\)/)
          const scaleMatch = transformAttr.match(/scale\(([^)]+)\)/)
          if (translateMatch) {
            panX = parseFloat(translateMatch[1]) || 0
            panY = parseFloat(translateMatch[2]) || 0
          }
          if (scaleMatch) {
            zoom = parseFloat(scaleMatch[1]) || 1
          }
        }
      }
    }
    
    // Create drag calculator with precise transforms
    dragCalculator.value = createDragCalculator(
      svgElement, 
      zoom, 
      new Vector2D(panX, panY)
    )
    
    // Initialize boundary constraints
    const svgRect = svgElement.getBoundingClientRect()
    boundaryConstraint.value = new BoundaryConstraint(
      {
        min: new Vector2D(0, 0),
        max: new Vector2D(svgRect.width / zoom, svgRect.height / zoom)
      },
      10, // margin
      0.3  // elasticity
    )
    
    // Initialize grid snapper
    gridSnapper.value = new GridSnapper(
      new Vector2D(20, 20), // 20px grid
      false, // disabled by default
      8 // snap threshold
    )
    
    // Start precise drag calculation with memory-optimized vectors
    const screenPosition = acquireVector2D(clientX, clientY)
    const nodePosition = acquireVector2D(props.node.position.x, props.node.position.y)
    
    // Cache the drag start state
    dragCache.value.startPosition = screenPosition.clone()
    dragCache.value.currentPosition = nodePosition.clone()
    dragCache.value.timestamp = performance.now()
    
    dragCalculator.value.startDrag(screenPosition, nodePosition)
    
    // Release temporary vectors
    releaseVector2D(screenPosition)
    releaseVector2D(nodePosition)
    
    // Add visual feedback
    const nodeElement = event.currentTarget as Element
    nodeElement.classList.add('dragging')
    
    // Set cursor for entire document (only for mouse events)
    if (!isTouch) {
      document.body.style.cursor = 'grabbing'
    }
    document.body.style.userSelect = 'none'
    
    console.log(`FunnelNode: ${isTouch ? 'Touch' : 'Mouse'} precision drag initialized - Zoom:`, zoom, 'Pan:', { panX, panY })
    
  } catch (error) {
    console.error('FunnelNode: Failed to initialize precision drag:', error)
    // Fallback to basic drag
    isDragging.value = false
    if (isTouch) {
      isTouchDragging.value = false
    }
    return
  }
  
  // Add event listeners - use unified handlers for both touch and mouse
  if (isTouch) {
    // Touch events are handled by the component's touch handlers
    // We don't need to add document listeners for touch events
  } else {
    document.addEventListener('mousemove', onDragMove, { passive: false })
    document.addEventListener('mouseup', onDragEnd)
  }
}

// Agent 6: Physics-enhanced drag move
const onPhysicsDragMove = (event: MouseEvent) => {
  if (!isPhysicsDragging.value) return
  
  event.preventDefault()
  
  const startCalcTime = performance.now()
  const dragPosition = new Vector2D(event.clientX, event.clientY)
  const deltaTime = (performance.now() - dragStartTime.value) / 1000
  
  // Update physics drag
  if (physicsManager && physicsNode.value) {
    physicsManager.updateNodeDrag(physicsNode.value.id, dragPosition, deltaTime)
    
    // Get updated physics position
    const updatedNode = physicsManager.getNode(physicsNode.value.id)
    if (updatedNode) {
      const physicsPosition = {
        x: preciseRound(updatedNode.visualPosition.x, 3),
        y: preciseRound(updatedNode.visualPosition.y, 3)
      }
      
      // Apply magnetic effects if enabled
      if (physicsConfig.value.enableMagnetics && snappingManager.value) {
        const snapResult = snappingManager.value.calculateAdvancedSnap(
          updatedNode.position,
          updatedNode.velocity,
          props.node.id
        )
        
        if (snapResult.snapStrength > 0.1) {
          // Apply magnetic snapping with smooth transition
          const magneticPosition = {
            x: preciseRound(snapResult.snappedPosition.x, 3),
            y: preciseRound(snapResult.snappedPosition.y, 3)
          }
          
          // Smooth interpolation between physics and magnetic position
          const blendFactor = snapResult.snapStrength * 0.3
          physicsPosition.x = MathUtils.lerp(physicsPosition.x, magneticPosition.x, blendFactor)
          physicsPosition.y = MathUtils.lerp(physicsPosition.y, magneticPosition.y, blendFactor)
        }
      }
      
      // Use optimized rendering for smooth dragging
      optimizeDragTransform(event.currentTarget as Element, physicsPosition.x, physicsPosition.y)
      
      // Emit the update with physics-enhanced position
      renderOptimizer.getScheduler().addTask({
        id: `physics_drag_update_${props.node.id}_${Date.now()}`,
        type: 'animation',
        priority: 'high',
        execute: () => {
          emit('update', props.node.id, { position: physicsPosition })
        }
      })
    }
  }
  
  // Apply spring resistance feedback
  if (physicsConfig.value.enableSprings && springAnimationActive.value) {
    applySpringResistanceFeedback(dragPosition)
  }
  
  const calcTime = performance.now() - startCalcTime
  dragPrecisionError.value = calcTime
}

// Fallback to standard drag move for non-physics mode
const onDragMove = (event: any) => {
  if (!isDragging.value || !dragCalculator.value) return
  
  event.preventDefault()
  
  try {
    const startCalcTime = performance.now()
    
    // Use memory-optimized vector calculation
    const screenPosition = acquireVector2D(event.clientX, event.clientY)
    
    // Check cache for recent similar position
    const cacheKey = `drag_${props.node.id}_${Math.floor(screenPosition.x / 5)}_${Math.floor(screenPosition.y / 5)}`
    let newPosition = cacheOptimizer.getCachedTransform(cacheKey)
    
    if (!newPosition) {
      // Calculate precise position using our drag calculator
      newPosition = dragCalculator.value.calculateDragPosition(screenPosition)
      
      // Cache the calculated position
      cacheOptimizer.cacheTransform(cacheKey, newPosition.toObject())
    } else {
      // Use cached position but update with current screen position
      newPosition = dragCalculator.value.calculateDragPosition(screenPosition)
    }
    
    // Apply boundary constraints
    if (boundaryConstraint.value) {
      const nodeSize = new Vector2D(nodeWidth.value, nodeHeight.value)
      newPosition = boundaryConstraint.value.constrainPositionElastic(newPosition, nodeSize)
    }
    
    // Apply grid snapping if enabled
    if (gridSnapper.value && gridSnapper.value.enabled) {
      newPosition = gridSnapper.value.snapToGrid(newPosition)
    }
    
    // Calculate precision error for monitoring
    const calcTime = performance.now() - startCalcTime
    dragPrecisionError.value = calcTime // Use calculation time as a precision metric
    
    // Apply additional precision rounding
    const precisePosition = {
      x: preciseRound(newPosition.x, 3),
      y: preciseRound(newPosition.y, 3)
    }
    
    // Use optimized rendering for smooth dragging
    optimizeDragTransform(event.currentTarget as Element, precisePosition.x, precisePosition.y)
    
    // Emit the update with render optimization
    renderOptimizer.getScheduler().addTask({
      id: `drag_update_${props.node.id}_${Date.now()}`,
      type: 'animation',
      priority: 'high',
      execute: () => {
        emit('update', props.node.id, { position: precisePosition })
      }
    })
    
    // Update drag cache
    if (dragCache.value) {
      dragCache.value.currentPosition = acquireVector2D(precisePosition.x, precisePosition.y)
    }
    
    // Release temporary vector
    releaseVector2D(screenPosition)
    
  } catch (error) {
    console.error('FunnelNode: Optimized drag calculation failed:', error)
    // Fallback: maintain current position
  }
}

// Agent 6: Physics-enhanced drag end
const onPhysicsDragEnd = () => {
  const dragDuration = performance.now() - dragStartTime.value
  
  console.log('FunnelNode: Physics drag ended for node:', props.node.id)
  console.log('FunnelNode: Drag duration:', dragDuration.toFixed(2), 'ms')
  
  isPhysicsDragging.value = false
  isDragging.value = false
  
  // End physics drag with throwing effects
  if (physicsManager && physicsNode.value) {
    physicsManager.endNodeDrag(physicsNode.value.id)
    
    // Check if we should apply throwing effects
    const node = physicsManager.getNode(physicsNode.value.id)
    if (node && node.velocity.length() > 100) {
      isThrowing.value = true
      console.log('FunnelNode: Throwing effect triggered with velocity:', node.velocity.length())
      
      // Add elastic settling animation
      setTimeout(() => {
        if (physicsConfig.value.enableSprings) {
          applyElasticSettling()
        }
        isThrowing.value = false
      }, 1000)
    }
  }
  
  // Apply bounce feedback if enabled
  if (physicsConfig.value.enableBouncing) {
    applyBounceEffect()
  }
  
  // Clean up event listeners
  document.removeEventListener('mousemove', onPhysicsDragMove)
  document.removeEventListener('mouseup', onPhysicsDragEnd)
  
  // Reset document cursor and selection
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  console.log('FunnelNode: Physics drag cleanup completed')
}

// Fallback standard drag end
const onDragEnd = () => {
  const dragDuration = performance.now() - dragStartTime.value
  
  console.log('FunnelNode: Precision drag ended for node:', props.node.id)
  console.log('FunnelNode: Drag duration:', dragDuration.toFixed(2), 'ms')
  console.log('FunnelNode: Average precision error:', dragPrecisionError.value.toFixed(3), 'ms')
  
  isDragging.value = false
  isTouchDragging.value = false
  
  // Finalize drag calculation
  if (dragCalculator.value) {
    const finalPosition = dragCalculator.value.endDrag()
    if (finalPosition) {
      console.log('FunnelNode: Final precise position:', finalPosition.toObject())
    }
  }
  
  // Clean up drag calculator and constraints
  dragCalculator.value = null
  boundaryConstraint.value = null
  gridSnapper.value = null
  dragPrecisionError.value = 0
  
  // Release drag cache back to memory pool
  if (dragCache.value) {
    memoryManager.releaseDragCache(dragCache.value)
    dragCache.value = null
  }
  
  // Remove visual feedback
  const nodeElements = document.querySelectorAll('.funnel-node.dragging')
  nodeElements.forEach(el => el.classList.remove('dragging'))
  
  // Reset document cursor and selection
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // Clean up event listeners
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  
  console.log('FunnelNode: Precision drag cleanup completed')
}

const handleConnectionStart = (point: { x: number; y: number; label: string }, index: number) => {
  console.log('FunnelNode: Starting connection from node:', props.node.id, 'point:', index)
  
  const absolutePosition = {
    x: props.node.position.x + point.x,
    y: props.node.position.y + point.y
  }
  
  console.log('FunnelNode: Connection start position:', absolutePosition)
  
  // Add visual feedback for connection start
  showConnectionPoints.value = true
  
  emit('connection-start', props.node.id, absolutePosition)
}

const highlightConnectionPoint = (highlight: boolean, type: 'input' | 'output', index: number) => {
  if (highlight) {
    showConnectionPoints.value = true
  }
  // Could add more visual feedback here
}

const handleConnectionEnd = () => {
  console.log('FunnelNode: Connection end at node:', props.node.id)
  
  // Reset connection points visibility after a short delay
  setTimeout(() => {
    showConnectionPoints.value = false
  }, 500)
  
  emit('connection-end', props.node.id)
}

// Mouse enter/leave handlers for hover effects
const onMouseEnter = () => {
  isHovered.value = true
}

const onMouseLeave = () => {
  isHovered.value = false
  showConnectionPoints.value = false
}

// Processing simulation (for demo purposes)
const simulateProcessing = () => {
  if (props.node.type === 'action' || props.node.type === 'delay') {
    isProcessing.value = true
    processingProgress.value = 0
    
    const interval = setInterval(() => {
      processingProgress.value += 10
      if (processingProgress.value >= 100) {
        clearInterval(interval)
        isProcessing.value = false
        processingProgress.value = 0
      }
    }, 100)
  }
}

// Agent 6: Physics effect helper functions
const applySpringFeedback = (type: 'drag-start' | 'drag-move' | 'drag-end') => {
  if (!springAnimationActive.value || !physicsNode.value) return
  
  const config = createElasticConfig('medium')
  config.stiffness = physicsConfig.value.elasticity * 200
  config.damping = physicsConfig.value.friction * 20
  
  // Apply different feedback based on interaction type
  switch (type) {
    case 'drag-start':
      springAnimationActive.value = true
      break
    case 'drag-end':
      springAnimationActive.value = false
      break
  }
}

const applySpringResistanceFeedback = (dragPosition: Vector2D) => {
  if (!physicsNode.value) return
  
  const resistance = 0.95 // Slight resistance during drag
  const dampedPosition = dragPosition.multiply(resistance)
  
  // Could add visual spring compression effect here
}

const applyElasticSettling = () => {
  if (!physicsManager || !physicsNode.value) return
  
  // Create settling spring animation
  const currentPos = physicsNode.value.visualPosition
  const targetPos = physicsNode.value.position
  
  if (currentPos.distanceTo(targetPos) > 2) {
    physicsManager.addSpringAnimation(
      physicsNode.value.id,
      targetPos,
      createElasticConfig('strong')
    )
  }
}

const applyBounceEffect = () => {
  if (!isBouncing.value && physicsConfig.value.enableBouncing) {
    isBouncing.value = true
    
    // Add CSS class for bounce animation
    const nodeElement = document.querySelector(`[data-node-id="${props.node.id}"]`)
    if (nodeElement) {
      nodeElement.classList.add('bouncing')
      
      setTimeout(() => {
        nodeElement.classList.remove('bouncing')
        isBouncing.value = false
      }, 300)
    }
  }
}

const initializePhysicsNode = () => {
  if (!physicsManager || !physicsEnabled.value) return
  
  try {
    const nodePosition = new Vector2D(props.node.position.x, props.node.position.y)
    
    physicsNode.value = physicsManager.createPhysicsNode(
      props.node.id,
      nodePosition,
      {
        mass: physicsConfig.value.mass,
        friction: physicsConfig.value.friction,
        restitution: physicsConfig.value.elasticity,
        magneticStrength: physicsConfig.value.magneticStrength,
        springStiffness: 100 * physicsConfig.value.elasticity,
        springDamping: 10 * physicsConfig.value.friction
      }
    )
    
    // Set up physics callbacks
    if (physicsNode.value) {
      physicsNode.value.onStateChange = (oldState, newState) => {
        console.log(`FunnelNode ${props.node.id}: Physics state changed from ${oldState} to ${newState}`)
        
        // Update visual state based on physics state
        switch (newState) {
          case 'throwing':
            isThrowing.value = true
            break
          case 'bouncing':
            applyBounceEffect()
            break
          case 'settling':
            if (physicsConfig.value.enableSprings) {
              applyElasticSettling()
            }
            break
          case 'idle':
            isThrowing.value = false
            isBouncing.value = false
            springAnimationActive.value = false
            break
        }
      }
      
      physicsNode.value.onPhysicsUpdate = (node) => {
        // Sync visual position with physics position
        const position = {
          x: preciseRound(node.visualPosition.x, 3),
          y: preciseRound(node.visualPosition.y, 3)
        }
        
        // Only emit update if position changed significantly
        const currentPos = props.node.position
        const deltaX = Math.abs(position.x - currentPos.x)
        const deltaY = Math.abs(position.y - currentPos.y)
        
        if (deltaX > 0.1 || deltaY > 0.1) {
          emit('update', props.node.id, { position })
        }
      }
    }
    
    console.log(`FunnelNode: Initialized physics node for ${props.node.id}`)
    
  } catch (error) {
    console.warn('FunnelNode: Failed to initialize physics node:', error)
    physicsEnabled.value = false // Graceful degradation
  }
}

const updatePhysicsNodePosition = () => {
  if (physicsNode.value && !isDragging.value) {
    const nodePosition = new Vector2D(props.node.position.x, props.node.position.y)
    
    // Update physics position to match props
    physicsNode.value.position = nodePosition
    physicsNode.value.visualPosition = nodePosition
  }
}

// Watch for position changes to sync with physics
watch(() => props.node.position, (newPosition, oldPosition) => {
  if (newPosition && oldPosition && !isDragging.value) {
    const positionChanged = 
      Math.abs(newPosition.x - oldPosition.x) > 0.1 ||
      Math.abs(newPosition.y - oldPosition.y) > 0.1
    
    if (positionChanged) {
      updatePhysicsNodePosition()
    }
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Initialize gesture recognition
  if (gestureRecognizer.value === null) {
    gestureRecognizer.value = new AdvancedGestureRecognition({
      touchThreshold: 10,
      longPressDelay: 600,
      doubleTapDelay: 300,
      gestureTimeout: 2000,
      enableComplexGestures: true,
      enableTrajectoryAnalysis: true
    })
    
    // Set up gesture event handlers
    gestureRecognizer.value.setGestureHandlers({
      onLongPress: (gestureData) => {
        console.log('FunnelNode: Long press gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'long-press', gestureData)
      },
      onDoubleTap: (gestureData) => {
        console.log('FunnelNode: Double tap gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'double-tap', gestureData)
        emit('edit', props.node.id)
      },
      onSwipe: (gestureData) => {
        console.log('FunnelNode: Swipe gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'swipe', gestureData)
      },
      onPinch: (gestureData) => {
        console.log('FunnelNode: Pinch gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'pinch', gestureData)
      },
      onRotate: (gestureData) => {
        console.log('FunnelNode: Rotate gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'rotate', gestureData)
      },
      onComplexPath: (gestureData) => {
        console.log('FunnelNode: Complex path gesture detected:', gestureData)
        emit('gesture-detected', props.node.id, 'complex-path', gestureData)
      }
    })
  }
  
  // Initialize smart snapping
  if (snappingManager.value === null) {
    snappingManager.value = new SmartSnappingAlignmentManager({
      gridSize: new Vector2D(20, 20),
      snapThreshold: 10,
      enabledTypes: ['grid', 'object', 'guide'],
      magneticStrength: 0.5,
      showGuides: true,
      showPreview: true,
      animationDuration: 200
    })
  }
  
  // Initialize touch support
  if (isTouchSupported.value) {
    console.log('FunnelNode: Initializing touch support for node:', props.node.id)
    
    // Setup touch event handlers through the touch event handler
    touchEventHandler.setDragHandlers({
      onDragStart: (touchPoint: TouchPointInfo, element: Element) => {
        if (element.getAttribute('data-node-id') === props.node.id) {
          console.log('FunnelNode: Touch drag start via touchEventHandler')
        }
      },
      onDragMove: (touchPoint: TouchPointInfo, element: Element) => {
        if (element.getAttribute('data-node-id') === props.node.id) {
          // Handle touch move through existing logic
        }
      },
      onDragEnd: (touchPoint: TouchPointInfo, element: Element) => {
        if (element.getAttribute('data-node-id') === props.node.id) {
          console.log('FunnelNode: Touch drag end via touchEventHandler')
        }
      }
    })
  }
  
  // Agent 6: Initialize physics integration
  if (physicsManager) {
    initializePhysicsNode()
    
    // Set up physics configuration watchers
    const updatePhysicsConfig = () => {
      if (physicsNode.value) {
        physicsNode.value.config.mass = physicsConfig.value.mass
        physicsNode.value.config.friction = physicsConfig.value.friction
        physicsNode.value.config.restitution = physicsConfig.value.elasticity
        physicsNode.value.config.magneticStrength = physicsConfig.value.magneticStrength
      }
    }
    
    // Apply initial configuration
    updatePhysicsConfig()
  }
  
  // Setup optimized event handlers
  const nodeElement = document.querySelector(`[data-node-id="${props.node.id}"]`) as Element
  if (nodeElement) {
    // Use event optimizer for better performance
    eventOptimizer.addListener(nodeElement, 'mouseenter', onMouseEnter, {
      type: 'mouseenter',
      passive: true,
      priority: 'normal'
    })
    
    eventOptimizer.addListener(nodeElement, 'mouseleave', onMouseLeave, {
      type: 'mouseleave',
      passive: true,
      priority: 'normal'
    })
    
    // Setup optimized drag events
    optimizedEventHandlers.value = optimizeDragEvents(nodeElement)
    
    // Update spatial index for collision detection
    const nodeSize = acquireVector2D(nodeWidth.value, nodeHeight.value)
    const nodePos = acquireVector2D(props.node.position.x, props.node.position.y)
    
    cacheOptimizer.getSpatialIndex().insert({
      id: props.node.id,
      bounds: {
        min: nodePos,
        max: nodePos.add(nodeSize),
        width: nodeSize.x,
        height: nodeSize.y,
        center: nodePos.add(nodeSize.divide(2)),
        intersects: (other: any) => {
          return !(nodePos.x + nodeSize.x < other.min.x || 
                  other.max.x < nodePos.x || 
                  nodePos.y + nodeSize.y < other.min.y || 
                  other.max.y < nodePos.y)
        }
      },
      data: props.node
    })
    
    releaseVector2D(nodeSize)
    releaseVector2D(nodePos)
  }
})

onUnmounted(() => {
  // Agent 6: Clean up physics integration
  if (physicsManager && physicsNode.value) {
    physicsManager.removeObject(physicsNode.value.id)
    physicsNode.value = null
  }
  
  // Clean up physics state
  isPhysicsDragging.value = false
  isThrowing.value = false
  isBouncing.value = false
  springAnimationActive.value = false
  
  // Clean up timers
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
  
  if (doubleClickTimer.value) {
    clearTimeout(doubleClickTimer.value)
    doubleClickTimer.value = null
  }
  
  // Clean up gesture recognizer
  if (gestureRecognizer.value) {
    gestureRecognizer.value.dispose()
    gestureRecognizer.value = null
  }
  
  // Clean up snapping manager
  if (snappingManager.value) {
    snappingManager.value.dispose()
    snappingManager.value = null
  }
  
  // Clean up optimized event listeners
  const nodeElement = document.querySelector(`[data-node-id="${props.node.id}"]`) as Element
  if (nodeElement) {
    eventOptimizer.removeListener(nodeElement, 'mouseenter', onMouseEnter)
    eventOptimizer.removeListener(nodeElement, 'mouseleave', onMouseLeave)
  }
  
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  
  // Clean up spatial index
  cacheOptimizer.getSpatialIndex().remove(props.node.id)
  
  // Release any remaining memory pool objects
  if (dragCache.value) {
    memoryManager.releaseDragCache(dragCache.value)
    dragCache.value = null
  }
})
</script>

<style scoped>
.funnel-node:hover .connection-point {
  opacity: 1;
}

.funnel-node.selected .node-body {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

.funnel-node.dragging {
  cursor: move;
  opacity: 0.8;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

/* Multi-selection styling */
.funnel-node.multi-selected .node-body {
  stroke: #8b5cf6 !important;
  stroke-width: 2;
  stroke-dasharray: 3,3;
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.4));
}

.funnel-node.batch-operation .node-body {
  stroke: #f59e0b !important;
  stroke-width: 3;
  stroke-dasharray: 5,5;
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
  animation: batchPulse 1.5s ease-in-out infinite;
}

@keyframes batchPulse {
  0%, 100% { 
    stroke-opacity: 0.7;
    transform: scale(1);
  }
  50% { 
    stroke-opacity: 1;
    transform: scale(1.02);
  }
}

/* Multi-selection indicator */
.funnel-node.multi-selected::before {
  content: '';
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  background: #8b5cf6;
  border: 2px solid white;
  border-radius: 50%;
  z-index: 10;
}

/* Touch-specific optimizations */
.funnel-node.touch-enabled {
  /* Ensure minimum touch target size */
  min-width: 44px;
  min-height: 44px;
}

.funnel-node.mobile-optimized {
  /* Larger hit area for mobile devices */
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.funnel-node.mobile-optimized .node-body {
  /* Enhanced visual feedback for touch */
  transition: all 0.15s ease-out;
}

.funnel-node.mobile-optimized:active .node-body,
.funnel-node.touch-enabled.dragging .node-body {
  transform: scale(1.05);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
}

.touch-target-overlay {
  /* Invisible overlay for better touch precision */
  pointer-events: all;
  cursor: grab;
}

.touch-target-overlay:active {
  cursor: grabbing;
}

.funnel-node.dragging .node-body {
  stroke-width: 3;
  stroke-dasharray: 5,5;
  animation: dragPulse 1s ease-in-out infinite;
}

@keyframes dragPulse {
  0%, 100% { 
    stroke-opacity: 0.8; 
    filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
  }
  50% { 
    stroke-opacity: 1; 
    filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
  }
}

.connection-point:hover {
  r: 8;
  opacity: 1 !important;
}

.action-button:hover .action-bg {
  r: 12;
}

.processing-bar {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-indicator {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Smooth transitions for all interactive elements */
.node-body,
.connection-point,
.action-bg {
  transition: all 0.2s ease-in-out;
}

/* Agent 6: Physics-enhanced visual effects */
.funnel-node.physics-enabled {
  transition: transform 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}

.funnel-node.physics-dragging {
  cursor: move;
  opacity: 0.9;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4));
  transform-origin: center;
  z-index: 1001;
}

.funnel-node.throwing {
  animation: throwTrail 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes throwTrail {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.03);
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)) blur(0.5px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: none;
  }
}

.funnel-node.bouncing {
  animation: physicsBounceFeedback 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes physicsBounceFeedback {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.5));
  }
  60% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    filter: none;
  }
}

.funnel-node.spring-active .node-body {
  animation: springCompress 0.6s ease-out infinite;
}

@keyframes springCompress {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }
  50% {
    transform: scale(1.02);
    filter: drop-shadow(0 6px 12px rgba(59, 130, 246, 0.2));
  }
}

.funnel-node.magnetic-attraction {
  animation: magneticPull 0.4s ease-out;
}

@keyframes magneticPull {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05) rotate(1deg);
    filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.4));
  }
  100% {
    transform: scale(1) rotate(0deg);
    filter: none;
  }
}

/* Physics debug visualization */
.funnel-node.physics-debug .node-body {
  stroke: #3b82f6 !important;
  stroke-width: 2 !important;
  stroke-dasharray: 2,2 !important;
}

.funnel-node.physics-debug::after {
  content: attr(data-physics-state);
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-family: monospace;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}

/* Enhanced touch feedback for physics interactions */
.funnel-node.mobile-optimized.physics-enabled:active {
  transform: scale(1.08);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) brightness(1.1);
  transition: all 0.1s cubic-bezier(0.23, 1, 0.32, 1);
}

/* Magnetic field visualization */
.magnetic-field-lines {
  stroke: rgba(59, 130, 246, 0.3);
  stroke-width: 1;
  fill: none;
  pointer-events: none;
  animation: magneticFieldPulse 2s ease-in-out infinite;
}

@keyframes magneticFieldPulse {
  0%, 100% {
    opacity: 0.3;
    stroke-width: 1;
  }
  50% {
    opacity: 0.6;
    stroke-width: 1.5;
  }
}

/* Elastic constraint visualization */
.spring-constraint {
  stroke: rgba(16, 185, 129, 0.4);
  stroke-width: 2;
  stroke-dasharray: 3,3;
  fill: none;
  pointer-events: none;
  animation: springOscillation 1s ease-in-out infinite;
}

@keyframes springOscillation {
  0%, 100% {
    stroke-dashoffset: 0;
    opacity: 0.4;
  }
  50% {
    stroke-dashoffset: 6;
    opacity: 0.7;
  }
}

/* Performance optimized animations */
@media (prefers-reduced-motion: reduce) {
  .funnel-node.throwing,
  .funnel-node.bouncing,
  .funnel-node.spring-active .node-body {
    animation: none;
  }
  
  .funnel-node.physics-enabled {
    transition: none;
  }
}

/* GPU acceleration hints */
.funnel-node.physics-enabled,
.funnel-node.physics-dragging,
.funnel-node.throwing {
  will-change: transform, opacity, filter;
  transform: translateZ(0); /* Force GPU layer */
}
</style>