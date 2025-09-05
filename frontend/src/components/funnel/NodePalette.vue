<template>
  <div class="node-palette w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">节点面板</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">拖拽节点到画布上创建流程</p>
    </div>

    <!-- Search -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="relative">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索节点..."
          class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="category in categories"
        :key="category.id"
        @click="activeCategory = category.id"
        :class="[
          'flex-1 px-4 py-2 text-sm font-medium transition-colors',
          activeCategory === category.id
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        ]"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- Node List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-for="nodeType in filteredNodeTypes"
        :key="nodeType.type"
        :draggable="true"
        @dragstart="handleDragStart($event, nodeType)"
        @dragend="handleDragEnd"
        class="node-palette-item group relative cursor-grab active:cursor-grabbing"
      >
        <div
          :class="[
            'p-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200',
            'hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700',
            'group-hover:shadow-md'
          ]"
        >
          <!-- Node Preview -->
          <div class="flex items-start space-x-3">
            <!-- Icon -->
            <div
              :class="[
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm',
                nodeType.color
              ]"
            >
              <component :is="nodeType.icon" class="w-5 h-5" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ nodeType.label }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                {{ nodeType.description }}
              </p>
              
              <!-- Tags -->
              <div class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="tag in nodeType.tags"
                  :key="tag"
                  class="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- Connection Info -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <!-- Input Ports -->
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>{{ nodeType.maxInputs || (nodeType.canHaveInputs ? '∞' : '0') }}</span>
              </div>
              <!-- Output Ports -->
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 rounded-full bg-green-400"></div>
                <span>{{ nodeType.maxOutputs || (nodeType.canHaveOutputs ? '∞' : '0') }}</span>
              </div>
            </div>

            <!-- Enhanced Drag Indicator -->
            <div class="drag-indicator opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div class="flex flex-col space-y-1">
                <div class="flex space-x-1">
                  <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
                <div class="flex space-x-1">
                  <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div class="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dragging Ghost -->
        <div
          v-if="isDragging && draggedNodeType?.type === nodeType.type"
          class="absolute inset-0 opacity-50 pointer-events-none"
        >
          <div class="p-3 border-2 border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div class="flex items-center space-x-3">
              <div :class="['w-10 h-10 rounded-lg flex items-center justify-center text-white', nodeType.color]">
                <component :is="nodeType.icon" class="w-5 h-5" />
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ nodeType.label }}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredNodeTypes.length === 0" class="text-center py-8">
        <CubeIcon class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400">没有找到匹配的节点类型</p>
        <button
          @click="clearSearch"
          class="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          清除搜索
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div class="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div class="flex items-center space-x-1">
          <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
          <span>输入连接点</span>
        </div>
        <div class="flex items-center space-x-1">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>输出连接点</span>
        </div>
        <p class="pt-2">💡 拖拽节点到画布创建流程</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  MagnifyingGlassIcon,
  CubeIcon,
  PlayIcon,
  StopIcon,
  QuestionMarkCircleIcon,
  BoltIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingInIcon,
  FunnelIcon,
  Squares2X2Icon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline'
import type { NodeType } from '@/types/funnel'

// Props & Emits
interface NodeTypeConfig {
  type: NodeType
  label: string
  description: string
  icon: any
  color: string
  category: string
  tags: string[]
  canHaveInputs: boolean
  canHaveOutputs: boolean
  maxInputs?: number
  maxOutputs?: number
  allowedParents?: NodeType[]
  allowedChildren?: NodeType[]
  defaultConfig: Record<string, any>
}

const emit = defineEmits<{
  'node-drop': [nodeType: NodeTypeConfig, position: { x: number, y: number }]
}>()

// State
const searchTerm = ref('')
const activeCategory = ref('all')
const isDragging = ref(false)
const draggedNodeType = ref<NodeTypeConfig | null>(null)

// Categories
const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'flow', name: '流程' },
  { id: 'action', name: '动作' },
  { id: 'condition', name: '条件' },
  { id: 'data', name: '数据' }
])

// Node Types Configuration - 8 Core Node Types
const nodeTypes = ref<NodeTypeConfig[]>([
  {
    type: 'start',
    label: '起始节点',
    description: '流程的起始点，用户进入漏斗的入口',
    icon: PlayIcon,
    color: 'bg-green-500',
    category: 'flow',
    tags: ['入口', '开始'],
    canHaveInputs: false,
    canHaveOutputs: true,
    maxInputs: 0,
    maxOutputs: 1,
    defaultConfig: {
      entry_point: 'landing_page',
      tracking_enabled: true,
      welcome_message: '欢迎来到漏斗'
    }
  },
  {
    type: 'decision',
    label: '决策节点',
    description: '根据条件判断用户流向，支持多路分支',
    icon: QuestionMarkCircleIcon,
    color: 'bg-amber-500',
    category: 'condition',
    tags: ['决策', '判断', '分支'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 3,
    defaultConfig: {
      conditions: [
        {
          property: 'user.premium',
          operator: 'equals',
          value: true,
          label: '会员用户'
        }
      ],
      default_path: 'else'
    }
  },
  {
    type: 'action',
    label: '行动节点',
    description: '执行具体操作，如发送邮件、调用API、记录数据',
    icon: BoltIcon,
    color: 'bg-purple-500',
    category: 'action',
    tags: ['执行', '操作', '自动化'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 1,
    defaultConfig: {
      action_type: 'email',
      action_params: {
        to: '{{ user.email }}',
        subject: '欢迎使用我们的服务',
        template: 'welcome_email'
      },
      retry_attempts: 3
    }
  },
  {
    type: 'conversion',
    label: '转化节点',
    description: '标记关键转化事件，用于衡量漏斗效果',
    icon: FunnelIcon,
    color: 'bg-emerald-500',
    category: 'data',
    tags: ['转化', '目标', '成功'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 1,
    defaultConfig: {
      conversion_type: 'primary_goal',
      conversion_value: 1,
      revenue_value: 0,
      conversion_name: '主要转化'
    }
  },
  {
    type: 'condition',
    label: '条件节点',
    description: '根据用户属性或行为数据进行条件筛选',
    icon: CubeIcon,
    color: 'bg-blue-500',
    category: 'condition',
    tags: ['筛选', '条件', '过滤'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 1,
    maxOutputs: 2,
    defaultConfig: {
      filter_type: 'user_property',
      conditions: [
        {
          field: 'user.age',
          operator: 'greater_than',
          value: 18
        }
      ],
      match_all: true
    }
  },
  {
    type: 'merge',
    label: '合并节点',
    description: '将多个路径的用户流汇聚到一个出口',
    icon: ArrowsPointingInIcon,
    color: 'bg-pink-500',
    category: 'flow',
    tags: ['合并', '汇聚', '统一'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 5,
    maxOutputs: 1,
    defaultConfig: {
      merge_strategy: 'union',
      preserve_properties: true,
      deduplication: false
    }
  },
  {
    type: 'end',
    label: '结束节点',
    description: '流程的终点，可设置成功或失败结果',
    icon: StopIcon,
    color: 'bg-red-500',
    category: 'flow',
    tags: ['结束', '终点', '出口'],
    canHaveInputs: true,
    canHaveOutputs: false,
    maxInputs: 1,
    maxOutputs: 0,
    defaultConfig: {
      end_type: 'success',
      final_message: '流程完成',
      redirect_url: null,
      conversion_goal: true
    }
  },
  {
    type: 'custom',
    label: '自定义节点',
    description: '创建自定义业务逻辑节点，支持脚本执行',
    icon: CubeIcon,
    color: 'bg-gray-500',
    category: 'action',
    tags: ['自定义', '脚本', '高级'],
    canHaveInputs: true,
    canHaveOutputs: true,
    maxInputs: 3,
    maxOutputs: 3,
    defaultConfig: {
      custom_logic: '',
      input_schema: {},
      output_schema: {},
      timeout: 5000
    }
  }
])

// Computed
const filteredNodeTypes = computed(() => {
  let filtered = nodeTypes.value

  // Filter by category
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(node => node.category === activeCategory.value)
  }

  // Filter by search term
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(node => 
      node.label.toLowerCase().includes(term) ||
      node.description.toLowerCase().includes(term) ||
      node.tags.some(tag => tag.toLowerCase().includes(term))
    )
  }

  return filtered
})

// Methods
const handleDragStart = (event: DragEvent, nodeType: NodeTypeConfig) => {
  if (!event.dataTransfer) return

  console.log('NodePalette: Starting drag for node type:', nodeType.type)
  
  isDragging.value = true
  draggedNodeType.value = nodeType

  // Set drag data with enhanced information
  const dragData = {
    type: 'palette-node',
    nodeType: {
      type: nodeType.type,
      label: nodeType.label,
      description: nodeType.description,
      color: nodeType.color,
      category: nodeType.category,
      canHaveInputs: nodeType.canHaveInputs,
      canHaveOutputs: nodeType.canHaveOutputs,
      maxInputs: nodeType.maxInputs,
      maxOutputs: nodeType.maxOutputs,
      defaultConfig: nodeType.defaultConfig
    },
    timestamp: Date.now()
  }
  
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.setData('text/plain', nodeType.label) // Fallback for older browsers
  
  // Set drag effect
  event.dataTransfer.effectAllowed = 'copy'

  // Create custom drag image with better styling
  const dragImage = createDragImage(nodeType)
  event.dataTransfer.setDragImage(dragImage, 60, 30)

  // Clean up drag image
  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage)
    }
  }, 0)

  // Add drag start visual feedback
  const paletteItem = event.currentTarget as HTMLElement
  paletteItem.classList.add('dragging')
}

const handleDragEnd = (event: DragEvent) => {
  console.log('NodePalette: Drag ended')
  
  isDragging.value = false
  draggedNodeType.value = null
  
  // Remove drag visual feedback
  const paletteItem = event.currentTarget as HTMLElement
  paletteItem.classList.remove('dragging')
  
  // Clean up any remaining drag images
  const dragImages = document.querySelectorAll('.drag-image-clone')
  dragImages.forEach(img => {
    if (document.body.contains(img)) {
      document.body.removeChild(img)
    }
  })
}

const createDragImage = (nodeType: NodeTypeConfig): HTMLElement => {
  const dragImage = document.createElement('div')
  dragImage.className = 'drag-image-clone fixed top-0 left-0 pointer-events-none z-50'
  dragImage.style.transform = 'translate(-2000px, -2000px)'
  dragImage.style.width = '140px'
  dragImage.style.height = '60px'
  
  // Create more detailed drag image
  dragImage.innerHTML = `
    <div class="p-3 bg-white dark:bg-gray-800 border-2 border-blue-400 rounded-lg shadow-xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 ${nodeType.color} rounded-lg flex items-center justify-center text-white shadow-sm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-900 dark:text-white truncate">${nodeType.label}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 truncate">${nodeType.category}</div>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(dragImage)
  return dragImage
}

const clearSearch = () => {
  searchTerm.value = ''
}

// Enhanced drag feedback with better visual indicators
const provideDragFeedback = (event: DragEvent) => {
  if (!isDragging.value || !draggedNodeType.value) return
  
  // Update cursor based on drop target
  const target = event.target as Element
  const canvasElement = target.closest('.funnel-canvas')
  
  if (canvasElement) {
    event.dataTransfer!.dropEffect = 'copy'
  } else {
    event.dataTransfer!.dropEffect = 'none'
  }
}

// Global drag event handlers with enhanced feedback
const handleGlobalDragOver = (event: DragEvent) => {
  if (isDragging.value) {
    event.preventDefault()
    provideDragFeedback(event)
  }
}

const handleGlobalDrop = (event: DragEvent) => {
  event.preventDefault()
  console.log('NodePalette: Global drop detected')
  
  if (!isDragging.value || !event.dataTransfer) return

  try {
    const jsonData = event.dataTransfer.getData('application/json')
    const textData = event.dataTransfer.getData('text/plain')
    
    if (jsonData) {
      const data = JSON.parse(jsonData)
      console.log('NodePalette: Parsed drop data:', data)
      
      if (data.type === 'palette-node' && data.nodeType) {
        // This drop is handled by the canvas - just log for debugging
        console.log('NodePalette: Node drop will be handled by canvas:', data.nodeType.type)
      }
    }
  } catch (error) {
    console.warn('NodePalette: Failed to parse drag data:', error)
  }

  handleDragEnd(event as any)
}

// Lifecycle
onMounted(() => {
  document.addEventListener('dragover', handleGlobalDragOver)
  document.addEventListener('drop', handleGlobalDrop)
})

onUnmounted(() => {
  document.removeEventListener('dragover', handleGlobalDragOver)
  document.removeEventListener('drop', handleGlobalDrop)
})
</script>

<style scoped>
.node-palette-item {
  transition: transform 0.2s ease;
}

.node-palette-item:hover {
  transform: translateY(-1px);
}

.node-palette-item:active {
  transform: scale(0.98);
}

/* Custom scrollbar */
.node-palette ::-webkit-scrollbar {
  width: 6px;
}

.node-palette ::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700;
}

.node-palette ::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-500 rounded-full;
}

.node-palette ::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-400;
}

/* Enhanced drag state styles */
.node-palette-item[draggable="true"]:hover {
  cursor: grab;
}

.node-palette-item[draggable="true"]:active {
  cursor: grabbing;
}

.node-palette-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* Drag image styling */
.drag-image-clone {
  animation: dragImageFloat 0.3s ease-out;
}

@keyframes dragImageFloat {
  from {
    opacity: 0;
    transform: translate(-2000px, -2000px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-2000px, -2000px) scale(1);
  }
}

/* Enhanced hover effects */
.node-palette-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.node-palette-item:hover .drag-indicator {
  opacity: 1;
  transform: translateX(2px);
}

/* Smooth transitions for better UX */
.node-palette-item {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-palette-item > div {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>