<template>
  <div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
    <!-- Top Header Bar -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex items-center justify-between px-6 py-4">
        <!-- Left: Navigation & Title -->
        <div class="flex items-center space-x-4">
          <router-link
            to="/funnels"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon class="h-5 w-5" />
          </router-link>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ isEditing ? '编辑漏斗' : '漏斗构建器' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ funnel.name || '新建漏斗' }}
            </p>
          </div>
        </div>

        <!-- Center: Quick Actions -->
        <div class="hidden md:flex items-center space-x-2">
          <div class="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
            <span class="text-gray-600 dark:text-gray-300">节点:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ nodes.length }}</span>
          </div>
          <div class="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
            <span class="text-gray-600 dark:text-gray-300">连接:</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ edges.length }}</span>
          </div>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center space-x-3">
          <button
            @click="saveDraft"
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            保存草稿
          </button>
          <button
            @click="publishFunnel"
            :disabled="loading || !isValidFunnel"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ isEditing ? '更新漏斗' : '发布漏斗' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar: Node Palette -->
      <div class="w-80 flex-shrink-0">
        <NodePalette
          @node-drop="handleNodeDrop"
        />
      </div>

      <!-- Main Canvas Area -->
      <div class="flex-1 flex flex-col">
        <!-- Canvas Toolbar -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div class="flex items-center justify-between">
            <!-- Canvas Controls -->
            <div class="flex items-center space-x-2">
              <button
                @click="resetView"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ViewfinderCircleIcon class="h-4 w-4 mr-1" />
                重置视图
              </button>
              <button
                @click="fitToView"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Square3Stack3DIcon class="h-4 w-4 mr-1" />
                适应画布
              </button>
              
              <div class="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <!-- Smart Layout Controls -->
              <div class="relative">
                <button
                  @click="toggleLayoutPanel"
                  :class="[
                    'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    showLayoutPanel
                      ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30'
                      : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  ]"
                >
                  <SparklesIcon class="h-4 w-4 mr-1" />
                  智能布局
                </button>
                
                <!-- Layout Options Dropdown -->
                <div v-if="showLayoutPanel" class="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                  <div class="p-2 space-y-1">
                    <button
                      @click="applyAutoLayout('hierarchical')"
                      class="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🌲 层次布局
                    </button>
                    <button
                      @click="applyAutoLayout('force')"
                      class="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      🔗 力导向布局
                    </button>
                    <button
                      @click="applyAutoLayout('grid')"
                      class="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      ⚏ 网格布局
                    </button>
                    <button
                      @click="applyAutoLayout('circular')"
                      class="w-full text-left px-3 py-2 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      ⭕ 环形布局
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Data Flow Controls -->
              <button
                @click="toggleDataFlow"
                :class="[
                  'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  showDataFlow
                    ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30'
                    : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                <BoltIcon class="h-4 w-4 mr-1" />
                数据流
              </button>
              
              <button
                @click="toggleGrid"
                :class="[
                  'inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                  showGrid
                    ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30'
                    : 'text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                ]"
              >
                <Squares2X2Icon class="h-4 w-4 mr-1" />
                网格
              </button>
            </div>

            <!-- Canvas Settings -->
            <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <label class="flex items-center space-x-2">
                <input
                  v-model="snapToGrid"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>对齐网格</span>
              </label>
              
              <span class="text-gray-300 dark:text-gray-600">|</span>
              
              <!-- Analytics Toggle -->
              <label class="flex items-center space-x-2">
                <input
                  v-model="showAnalytics"
                  type="checkbox"
                  class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>分析数据</span>
              </label>
              
              <span class="text-gray-300 dark:text-gray-600">|</span>
              
              <!-- Performance Indicator -->
              <div class="flex items-center space-x-1">
                <div :class="[
                  'w-2 h-2 rounded-full',
                  performanceStatus === 'good' ? 'bg-green-500' :
                  performanceStatus === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                ]"></div>
                <span>性能: {{ performanceScore }}/100</span>
              </div>
              
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span>缩放: {{ Math.round(currentZoom * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- Canvas -->
        <div class="flex-1 relative">
          <FunnelCanvas
            ref="canvasRef"
            :readonly="false"
            :show-grid="showGrid"
            :snap-to-grid="snapToGrid"
            :grid-size="20"
            @node-select="handleNodeSelect"
            @edge-select="handleEdgeSelect"
            @canvas-click="handleCanvasClick"
          />
        </div>
      </div>

      <!-- Right Sidebar: Properties Panel -->
      <div class="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <div class="h-full flex flex-col">
          <!-- Properties Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectedNode ? '节点属性' : selectedEdge ? '连接属性' : '漏斗属性' }}
            </h3>
          </div>

          <!-- Properties Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- Node Properties -->
            <div v-if="selectedNode" class="space-y-6">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {{ getNodeTypeLabel(selectedNode.type) }}
                </h4>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      节点名称
                    </label>
                    <input
                      v-model="selectedNode.data.label"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      v-model="selectedNode.data.description"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="节点描述..."
                    ></textarea>
                  </div>

                  <div class="pt-4">
                    <button
                      @click="openNodeEditor"
                      class="w-full px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      高级设置
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Funnel Properties -->
            <div v-else-if="!selectedEdge" class="space-y-6">
              <div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">基本设置</h4>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      漏斗名称
                    </label>
                    <input
                      v-model="funnel.name"
                      type="text"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="输入漏斗名称"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      描述
                    </label>
                    <textarea
                      v-model="funnel.description"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="描述您的漏斗..."
                    ></textarea>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      类别
                    </label>
                    <select
                      v-model="funnel.category"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">选择类别</option>
                      <option value="ecommerce">电商</option>
                      <option value="saas">SaaS</option>
                      <option value="marketing">营销</option>
                      <option value="content">内容</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      跟踪代码
                    </label>
                    <div class="flex space-x-2">
                      <input
                        v-model="funnel.trackingCode"
                        type="text"
                        readonly
                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <button
                        @click="generateTrackingCode"
                        class="px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        生成
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!selectedNode && !selectedEdge" class="text-center py-8">
              <CubeIcon class="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                从左侧面板拖拽节点到画布创建流程
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                双击节点可编辑属性
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFunnel } from '@composables/useFunnel'
import type { FunnelNode, FunnelEdge, Position, NodeType } from '@/types/funnel'
import {
  ArrowLeftIcon,
  ViewfinderCircleIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  CubeIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/vue/24/outline'
import NodePalette from '@/components/funnel/NodePalette.vue'
import FunnelCanvas from '@/components/funnel/FunnelCanvas.vue'

const route = useRoute()
const router = useRouter()

// Composables
const {
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  selectNode,
  selectEdge,
  clearSelection
} = useFunnel()

// Refs
const canvasRef = ref()
const loading = ref(false)
const showGrid = ref(true)
const snapToGrid = ref(true)
const currentZoom = ref(1)
const showLayoutPanel = ref(false)
const showDataFlow = ref(false)
const showAnalytics = ref(false)
const performanceScore = ref(95)
const performanceStatus = computed(() => {
  if (performanceScore.value >= 80) return 'good'
  if (performanceScore.value >= 60) return 'fair'
  return 'poor'
})

// State
const isEditing = computed(() => route.name === 'funnel-edit')

const funnel = ref({
  name: '',
  description: '',
  category: '',
  trackingCode: '',
  status: 'draft'
})

const isValidFunnel = computed(() => {
  return funnel.value.name && nodes.value.length >= 2
})

// Node type labels mapping
const nodeTypeLabels = {
  start: '起始节点',
  end: '结束节点',
  event: '事件节点',
  condition: '条件节点',
  action: '行动节点',
  delay: '延迟节点',
  split: '分流节点',
  merge: '合并节点',
  conversion: '转化节点',
  custom: '自定义节点'
}

// Methods
const getNodeTypeLabel = (type: NodeType) => {
  return nodeTypeLabels[type] || '未知节点'
}

const handleNodeDrop = (nodeType: any, position: Position) => {
  const newNode: Omit<FunnelNode, 'id'> = {
    type: nodeType.type,
    position: {
      x: Math.max(0, position.x - 60), // Center the node on drop
      y: Math.max(0, position.y - 30)
    },
    data: {
      label: nodeType.label,
      description: nodeType.description,
      config: { ...nodeType.defaultConfig }
    }
  }
  
  addNode(newNode)
}

const handleNodeSelect = (nodeId: string | null) => {
  selectNode(nodeId)
}

const handleEdgeSelect = (edgeId: string | null) => {
  selectEdge(edgeId)
}

const handleCanvasClick = (position: Position) => {
  clearSelection()
}

const resetView = () => {
  if (canvasRef.value?.resetView) {
    canvasRef.value.resetView()
  }
}

const fitToView = () => {
  if (canvasRef.value?.fitToView) {
    canvasRef.value.fitToView()
  }
}

const openNodeEditor = () => {
  if (selectedNode.value && canvasRef.value?.editNode) {
    canvasRef.value.editNode(selectedNode.value.id)
  }
}

const generateTrackingCode = () => {
  funnel.value.trackingCode = `pf_${Math.random().toString(36).substr(2, 9)}`
}

const saveDraft = async () => {
  loading.value = true
  try {
    const funnelData = {
      ...funnel.value,
      nodes: nodes.value,
      edges: edges.value
    }
    console.log('Saving draft:', funnelData)
    // TODO: Implement API call to save draft
    await new Promise(resolve => setTimeout(resolve, 1000))
  } catch (error) {
    console.error('Save draft failed:', error)
  } finally {
    loading.value = false
  }
}

const publishFunnel = async () => {
  loading.value = true
  try {
    const funnelData = {
      ...funnel.value,
      nodes: nodes.value,
      edges: edges.value,
      status: 'published'
    }
    console.log('Publishing funnel:', funnelData)
    // TODO: Implement API call to publish funnel
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push('/funnels')
  } catch (error) {
    console.error('Publish failed:', error)
  } finally {
    loading.value = false
  }
}

// Layout and canvas control methods
const toggleLayoutPanel = () => {
  showLayoutPanel.value = !showLayoutPanel.value
}

const applyAutoLayout = (type: string) => {
  console.log('Applying auto layout:', type)
  showLayoutPanel.value = false
  // TODO: Implement auto layout logic
}

const toggleDataFlow = () => {
  showDataFlow.value = !showDataFlow.value
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

// Lifecycle
onMounted(() => {
  generateTrackingCode()
  
  if (isEditing.value) {
    // TODO: Load existing funnel data
    console.log('Loading funnel for editing:', route.params.id)
  }
})
</script>