<template>
  <div class="funnel-builder h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            漏斗构建器
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            设计和配置您的客户旅程漏斗
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <span>{{ hasUnsavedChanges ? '未保存的更改' : '所有更改已保存' }}</span>
          </div>
          <button
            @click="saveFunnel"
            :disabled="!hasUnsavedChanges || isSaving"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isSaving ? '保存中...' : '保存漏斗' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <div class="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        <!-- Funnel Info -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                漏斗名称
              </label>
              <input
                v-model="funnelName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="输入漏斗名称..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述
              </label>
              <textarea
                v-model="funnel描述"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="描述您的漏斗..."
              />
            </div>
          </div>
        </div>

        <!-- Node Properties -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="selectedNode" class="space-y-4">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              节点属性
            </h3>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  节点类型
                </label>
                <div class="flex items-center gap-2">
                  <div 
                    :class="[
                      'w-4 h-4 rounded',
                      getNodeTypeColor(selectedNode.type)
                    ]"
                  ></div>
                  <span class="text-sm text-gray-900 dark:text-gray-100">
                    {{ getNodeType标签(selectedNode.type) }}
                  </span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标签
                </label>
                <input
                  v-model="selectedNode.data.label"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述
                </label>
                <textarea
                  v-model="selectedNode.data.description"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Position
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      v-model.number="selectedNode.position.x"
                      type="number"
                      placeholder="X"
                      class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <input
                      v-model.number="selectedNode.position.y"
                      type="number"
                      placeholder="Y"
                      class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex gap-2">
                <button
                  @click="editSelectedNode"
                  class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Edit Node
                </button>
                <button
                  @click="deleteSelectedNode"
                  class="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="selectedEdge" class="space-y-4">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              Connection Properties
            </h3>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Connection Type
                </label>
                <select
                  v-model="selectedEdge.type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="default">Default</option>
                  <option value="conditional">Conditional</option>
                  <option value="fallback">Fallback</option>
                  <option value="trigger">Trigger</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  标签
                </label>
                <input
                  v-model="selectedEdge.data.label"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Connection label..."
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weight
                </label>
                <input
                  v-model.number="selectedEdge.data.weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="0.5"
                />
              </div>
            </div>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="deleteSelectedEdge"
                class="w-full px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Delete Connection
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <CubeIcon class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Select a node or connection to view properties
            </p>
          </div>
        </div>
      </div>

      <!-- Canvas Area -->
      <div class="flex-1 relative">
        <FunnelCanvas
          ref="canvasRef"
          :readonly="false"
          :show-grid="showGrid"
          :grid-size="20"
          @node-select="handleNodeSelect"
          @edge-select="handleEdgeSelect"
          @canvas-click="handleCanvasClick"
        />

        <!-- Canvas Controls -->
        <div class="absolute bottom-4 left-4 flex flex-col gap-2">
          <div class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm p-2">
            <div class="flex items-center gap-2 mb-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">Grid:</label>
              <input
                v-model="showGrid"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600"
              />
            </div>
            <div class="flex gap-1">
              <button
                @click="validateFunnelStructure"
                class="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                title="Validate Funnel"
              >
                <CheckIcon class="w-4 h-4" />
              </button>
              <button
                @click="clearCanvas"
                class="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                title="Clear Canvas"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Validation Results -->
        <div v-if="validationErrors.length > 0" class="absolute top-4 right-4 max-w-sm">
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
              <h4 class="font-medium text-red-800 dark:text-red-200">Validation Errors</h4>
            </div>
            <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li v-for="error in validationErrors" :key="error">
                • {{ error }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFunnel } from '@composables/useFunnel'
import type { FunnelNode, FunnelEdge } from '@/types/funnel'
import FunnelCanvas from './FunnelCanvas.vue'
import { 
  CubeIcon, 
  CheckIcon, 
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { nodeTypeConfigs, validateFunnelStructure as validateStructure } from './utils'

// Composables
const { 
  nodes, 
  edges, 
  selectedNode, 
  selectedEdge, 
  hasUnsavedChanges,
  selectNode,
  selectEdge,
  clearSelection,
  deleteNode,
  deleteEdge,
  saveFunnelFromBuilder,
  clearBuilder
} = useFunnel()

// State
const canvasRef = ref<InstanceType<typeof FunnelCanvas>>()
const funnelName = ref('New Funnel')
const funnel描述 = ref('')
const showGrid = ref(true)
const isSaving = ref(false)
const validationErrors = ref<string[]>([])

// Methods
const getNodeType标签 = (type: string) => {
  return nodeTypeConfigs[type as keyof typeof nodeTypeConfigs]?.label || type
}

const getNodeTypeColor = (type: string) => {
  const config = nodeTypeConfigs[type as keyof typeof nodeTypeConfigs]
  return config?.color ? `bg-[${config.color}]` : 'bg-gray-500'
}

const handleNodeSelect = (nodeId: string | null) => {
  selectNode(nodeId)
}

const handleEdgeSelect = (edgeId: string | null) => {
  selectEdge(edgeId)
}

const handleCanvasClick = () => {
  clearSelection()
  validationErrors.value = []
}

const editSelectedNode = () => {
  if (selectedNode.value) {
    // This would typically open the NodeEditor modal
    console.log('Edit node:', selectedNode.value.id)
  }
}

const deleteSelectedNode = () => {
  if (selectedNode.value) {
    deleteNode(selectedNode.value.id)
  }
}

const deleteSelectedEdge = () => {
  if (selectedEdge.value) {
    deleteEdge(selectedEdge.value.id)
  }
}

const saveFunnel = async () => {
  if (!hasUnsavedChanges.value) return
  
  try {
    isSaving.value = true
    await saveFunnelFromBuilder()
  } catch (error) {
    console.error('Failed to save funnel:', error)
  } finally {
    isSaving.value = false
  }
}

const validateFunnelStructure = () => {
  validationErrors.value = validateStructure(nodes.value, edges.value)
  
  if (validationErrors.value.length === 0) {
    // Show success message
    console.log('Funnel structure is valid')
  }
}

const clearCanvas = () => {
  if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
    clearBuilder()
    validationErrors.value = []
  }
}

// Auto-save functionality
watch(
  [funnelName, funnel描述, hasUnsavedChanges],
  () => {
    if (hasUnsavedChanges.value) {
      // Debounced auto-save could be implemented here
    }
  }
)
</script>

<style scoped>
.funnel-builder {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Custom scrollbar for sidebar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>