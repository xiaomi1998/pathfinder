<template>
  <div class="advanced-interaction-demo p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Demo Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        高级交互特性演示
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
        体验专业级编辑器的高级交互功能：多选、批量操作、手势识别、智能对齐等
      </p>
      
      <!-- Feature Status Dashboard -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              multiSelectionEnabled ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">多选系统</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ selectedNodeIds.length }} 个节点被选中
          </p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              batchOperationActive ? 'bg-green-500' : 'bg-gray-400'
            ]"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">批量操作</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ lastBatchOperation || '无操作' }}
          </p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              gestureRecognitionActive ? 'bg-green-500' : 'bg-gray-400'
            ]"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">手势识别</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ lastGesture || '无手势' }}
          </p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div class="flex items-center gap-2 mb-2">
            <div :class="[
              'w-3 h-3 rounded-full',
              smartAlignmentActive ? 'bg-green-500' : 'bg-gray-400'
            ]"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">智能对齐</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ activeAlignments }} 个对齐建议
          </p>
        </div>
      </div>
    </div>

    <!-- Control Panel -->
    <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">控制面板</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Multi-Selection Controls -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">多选操作</h3>
          <div class="space-y-2">
            <button
              @click="selectAllNodes"
              class="w-full px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
            >
              全选节点 (Ctrl+A)
            </button>
            <button
              @click="clearSelection"
              :disabled="selectedNodeIds.length === 0"
              class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              清除选择 (Esc)
            </button>
            <button
              @click="invertSelection"
              class="w-full px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600 rounded-md hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors"
            >
              反选
            </button>
          </div>
        </div>

        <!-- Batch Operations -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">批量操作</h3>
          <div class="space-y-2">
            <button
              @click="performBatchDelete"
              :disabled="selectedNodeIds.length === 0"
              class="w-full px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors disabled:opacity-50"
            >
              批量删除
            </button>
            <button
              @click="performBatchDuplicate"
              :disabled="selectedNodeIds.length === 0"
              class="w-full px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600 rounded-md hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors disabled:opacity-50"
            >
              批量复制
            </button>
            <button
              @click="performBatchAlign"
              :disabled="selectedNodeIds.length < 2"
              class="w-full px-3 py-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-600 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors disabled:opacity-50"
            >
              批量对齐
            </button>
          </div>
        </div>

        <!-- Smart Features -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">智能功能</h3>
          <div class="space-y-2">
            <button
              @click="performSmartLayout"
              class="w-full px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-colors"
            >
              智能布局
            </button>
            <button
              @click="analyzeSpacing"
              class="w-full px-3 py-2 text-sm bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-600 rounded-md hover:bg-teal-100 dark:hover:bg-teal-800/30 transition-colors"
            >
              分析间距
            </button>
            <button
              @click="optimizeConnections"
              class="w-full px-3 py-2 text-sm bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-300 dark:border-pink-600 rounded-md hover:bg-pink-100 dark:hover:bg-pink-800/30 transition-colors"
            >
              优化连线
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Canvas -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">交互画布</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          使用鼠标和键盘组合进行多选，拖拽节点体验智能对齐，右键查看上下文菜单
        </p>
      </div>
      
      <div class="h-96 relative">
        <FunnelCanvas
          ref="canvasRef"
          :width="800"
          :height="400"
          :show-grid="true"
          :snap-to-grid="snapToGrid"
          @node-select="handleNodeSelect"
          @multi-select="handleMultiSelect"
          @gesture-detected="handleGestureDetected"
          @context-menu="handleContextMenu"
          @batch-update="handleBatchUpdate"
        />
        
        <!-- Selection Rectangle -->
        <div
          v-if="selectionRectangle.active"
          :style="{
            position: 'absolute',
            left: `${selectionRectangle.x}px`,
            top: `${selectionRectangle.y}px`,
            width: `${selectionRectangle.width}px`,
            height: `${selectionRectangle.height}px`,
            border: '2px dashed #3b82f6',
            background: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none'
          }"
          class="selection-rectangle"
        ></div>
        
        <!-- Gesture Trail Visualization -->
        <svg
          v-if="gestureTrail.length > 0"
          class="absolute inset-0 pointer-events-none"
          style="z-index: 10;"
        >
          <path
            :d="gestureTrailPath"
            stroke="#8b5cf6"
            stroke-width="3"
            fill="none"
            stroke-dasharray="5,5"
            opacity="0.7"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0;10"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>
    </div>

    <!-- Event Log -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">事件日志</h2>
          <button
            @click="clearEventLog"
            class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            清除日志
          </button>
        </div>
      </div>
      
      <div class="p-4 max-h-48 overflow-y-auto">
        <div v-if="eventLog.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          暂无事件记录，开始与画布交互查看事件日志
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="(event, index) in eventLog.slice().reverse()"
            :key="index"
            class="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
          >
            <div class="flex-shrink-0 mt-0.5">
              <div :class="[
                'w-2 h-2 rounded-full',
                getEventColor(event.type)
              ]"></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white font-medium">{{ event.type }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ event.message }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">{{ formatTime(event.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Stats -->
    <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">性能指标</h3>
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">平均帧率</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ performanceStats.fps }} FPS</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">内存使用</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ performanceStats.memory }} MB</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">响应延迟</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ performanceStats.latency }} ms</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">交互统计</h3>
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">总点击次数</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ interactionStats.clicks }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">拖拽次数</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ interactionStats.drags }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">手势识别</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ interactionStats.gestures }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">系统状态</h3>
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">活跃节点</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ systemStats.activeNodes }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">缓存命中率</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ systemStats.cacheHitRate }}%</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-600 dark:text-gray-400">优化等级</span>
            <span class="text-gray-900 dark:text-white font-mono">{{ systemStats.optimizationLevel }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, provide } from 'vue'
import FunnelCanvas from '@/components/funnel/FunnelCanvas.vue'
import { MultiSelectionManager } from '@/utils/multi-selection-manager'
import { BatchOperationsEngine } from '@/utils/batch-operations-engine'
import { AdvancedGestureRecognition } from '@/utils/advanced-gesture-recognition'
import { SmartSnappingAlignmentManager } from '@/utils/smart-snapping-alignment'

// State
const canvasRef = ref()
const multiSelectionManager = ref<MultiSelectionManager>()
const batchOperationsEngine = ref<BatchOperationsEngine>()
const gestureRecognizer = ref<AdvancedGestureRecognition>()
const snappingManager = ref<SmartSnappingAlignmentManager>()

// Feature Status
const multiSelectionEnabled = ref(true)
const batchOperationActive = ref(false)
const gestureRecognitionActive = ref(false)
const smartAlignmentActive = ref(false)

// Selection State
const selectedNodeIds = ref<string[]>([])
const lastBatchOperation = ref<string>('')
const lastGesture = ref<string>('')
const activeAlignments = ref(0)

// UI State
const snapToGrid = ref(true)
const selectionRectangle = ref({
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

// Gesture Trail
const gestureTrail = ref<Array<{x: number, y: number}>>([])
const gestureTrailPath = computed(() => {
  if (gestureTrail.value.length < 2) return ''
  
  const path = gestureTrail.value.map((point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
  }).join(' ')
  
  return path
})

// Event Log
const eventLog = ref<Array<{
  type: string
  message: string
  timestamp: number
  data?: any
}>>([])

// Performance Statistics
const performanceStats = ref({
  fps: 60,
  memory: 12.5,
  latency: 2.3
})

const interactionStats = ref({
  clicks: 0,
  drags: 0,
  gestures: 0
})

const systemStats = ref({
  activeNodes: 8,
  cacheHitRate: 94,
  optimizationLevel: 'High'
})

// Methods
const addToEventLog = (type: string, message: string, data?: any) => {
  eventLog.value.push({
    type,
    message,
    timestamp: Date.now(),
    data
  })
  
  // Keep only last 50 events
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(-50)
  }
}

const clearEventLog = () => {
  eventLog.value = []
}

const getEventColor = (type: string): string => {
  const colors = {
    'multi-select': 'bg-blue-500',
    'batch-operation': 'bg-orange-500',
    'gesture': 'bg-purple-500',
    'alignment': 'bg-green-500',
    'drag': 'bg-indigo-500',
    'click': 'bg-gray-500',
    'error': 'bg-red-500'
  }
  
  return colors[type as keyof typeof colors] || 'bg-gray-400'
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

// Event Handlers
const handleNodeSelect = (nodeId: string | null, modifiers?: any) => {
  if (nodeId) {
    interactionStats.value.clicks++
    addToEventLog('click', `节点 ${nodeId} 被点击`, { nodeId, modifiers })
  }
}

const handleMultiSelect = (nodeIds: string[]) => {
  selectedNodeIds.value = nodeIds
  addToEventLog('multi-select', `选择了 ${nodeIds.length} 个节点`, { nodeIds })
}

const handleGestureDetected = (nodeId: string, gesture: string, data: any) => {
  lastGesture.value = gesture
  gestureRecognitionActive.value = true
  interactionStats.value.gestures++
  
  addToEventLog('gesture', `检测到 ${gesture} 手势在节点 ${nodeId}`, { nodeId, gesture, data })
  
  // Reset gesture status after 3 seconds
  setTimeout(() => {
    gestureRecognitionActive.value = false
    lastGesture.value = ''
  }, 3000)
}

const handleContextMenu = (nodeId: string, position: any, event: MouseEvent) => {
  addToEventLog('context-menu', `节点 ${nodeId} 显示右键菜单`, { nodeId, position })
}

const handleBatchUpdate = (updates: any[]) => {
  lastBatchOperation.value = `更新了 ${updates.length} 个节点`
  batchOperationActive.value = true
  
  addToEventLog('batch-operation', lastBatchOperation.value, { updates })
  
  // Reset batch operation status after 2 seconds
  setTimeout(() => {
    batchOperationActive.value = false
  }, 2000)
}

// Control Panel Actions
const selectAllNodes = () => {
  if (multiSelectionManager.value) {
    multiSelectionManager.value.selectAll()
    selectedNodeIds.value = multiSelectionManager.value.getSelectedItemIds()
    addToEventLog('multi-select', '全选所有节点')
  }
}

const clearSelection = () => {
  if (multiSelectionManager.value) {
    multiSelectionManager.value.clearSelection()
    selectedNodeIds.value = []
    addToEventLog('multi-select', '清除所有选择')
  }
}

const invertSelection = () => {
  if (multiSelectionManager.value) {
    multiSelectionManager.value.invertSelection()
    selectedNodeIds.value = multiSelectionManager.value.getSelectedItemIds()
    addToEventLog('multi-select', '反转选择')
  }
}

const performBatchDelete = () => {
  if (batchOperationsEngine.value && selectedNodeIds.value.length > 0) {
    try {
      batchOperationsEngine.value.deleteBatch(selectedNodeIds.value)
      lastBatchOperation.value = `删除了 ${selectedNodeIds.value.length} 个节点`
      addToEventLog('batch-operation', lastBatchOperation.value)
      selectedNodeIds.value = []
    } catch (error) {
      console.error('Batch delete failed:', error)
    }
  }
}

const performBatchDuplicate = () => {
  if (batchOperationsEngine.value && selectedNodeIds.value.length > 0) {
    try {
      batchOperationsEngine.value.duplicateBatch(selectedNodeIds.value)
      lastBatchOperation.value = `复制了 ${selectedNodeIds.value.length} 个节点`
      addToEventLog('batch-operation', lastBatchOperation.value)
    } catch (error) {
      console.error('Batch duplicate failed:', error)
    }
  }
}

const performBatchAlign = () => {
  if (batchOperationsEngine.value && selectedNodeIds.value.length >= 2) {
    try {
      batchOperationsEngine.value.alignBatch(selectedNodeIds.value, 'left')
      lastBatchOperation.value = `对齐了 ${selectedNodeIds.value.length} 个节点`
      addToEventLog('batch-operation', lastBatchOperation.value)
      smartAlignmentActive.value = true
      
      setTimeout(() => {
        smartAlignmentActive.value = false
      }, 3000)
    } catch (error) {
      console.error('Batch align failed:', error)
    }
  }
}

const performSmartLayout = () => {
  addToEventLog('alignment', '执行智能布局')
  smartAlignmentActive.value = true
  activeAlignments.value = 3
  
  setTimeout(() => {
    smartAlignmentActive.value = false
    activeAlignments.value = 0
  }, 4000)
}

const analyzeSpacing = () => {
  addToEventLog('alignment', '分析节点间距')
  smartAlignmentActive.value = true
  activeAlignments.value = 2
  
  setTimeout(() => {
    smartAlignmentActive.value = false
    activeAlignments.value = 0
  }, 3000)
}

const optimizeConnections = () => {
  addToEventLog('alignment', '优化连接线路径')
}

// Performance monitoring
const updatePerformanceStats = () => {
  // Simulate performance monitoring
  performanceStats.value = {
    fps: Math.floor(Math.random() * 5) + 58, // 58-62 FPS
    memory: parseFloat((Math.random() * 3 + 10).toFixed(1)), // 10-13 MB
    latency: parseFloat((Math.random() * 2 + 1).toFixed(1)) // 1-3 ms
  }
  
  systemStats.value = {
    activeNodes: selectedNodeIds.value.length || Math.floor(Math.random() * 5) + 5,
    cacheHitRate: Math.floor(Math.random() * 10) + 90, // 90-99%
    optimizationLevel: selectedNodeIds.value.length > 5 ? 'Ultra' : 'High'
  }
}

// Provide managers to child components
provide('multiSelectionManager', multiSelectionManager)
provide('batchOperationsEngine', batchOperationsEngine)

// Lifecycle
onMounted(() => {
  // Initialize managers
  multiSelectionManager.value = new MultiSelectionManager()
  batchOperationsEngine.value = new BatchOperationsEngine()
  gestureRecognizer.value = new AdvancedGestureRecognition()
  snappingManager.value = new SmartSnappingAlignmentManager()
  
  addToEventLog('system', '高级交互演示系统已初始化')
  
  // Start performance monitoring
  const performanceInterval = setInterval(updatePerformanceStats, 1000)
  
  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(performanceInterval)
    
    if (multiSelectionManager.value) {
      multiSelectionManager.value.dispose()
    }
    if (batchOperationsEngine.value) {
      batchOperationsEngine.value.dispose()
    }
    if (gestureRecognizer.value) {
      gestureRecognizer.value.dispose()
    }
    if (snappingManager.value) {
      snappingManager.value.dispose()
    }
  })
})
</script>

<style scoped>
.advanced-interaction-demo {
  font-family: 'Inter', system-ui, sans-serif;
}

.selection-rectangle {
  animation: selectionPulse 1s ease-in-out infinite;
}

@keyframes selectionPulse {
  0%, 100% {
    border-opacity: 0.8;
    background-opacity: 0.05;
  }
  50% {
    border-opacity: 1;
    background-opacity: 0.15;
  }
}

/* Smooth transitions for all interactive elements */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}

/* Status indicators with smooth animations */
.status-indicator {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Event log scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>