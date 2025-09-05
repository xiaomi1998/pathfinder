<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold text-gray-900">
          {{ isEditMode ? '编辑漏斗' : '漏斗构建器' }}
        </h1>
        <!-- 漏斗名称输入框 -->
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-600">名称:</label>
          <input 
            v-model="funnelName" 
            type="text" 
            placeholder="输入漏斗名称..."
            class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
            @blur="scheduleAutoSave"
          />
        </div>
        <div class="flex space-x-2">
          <button @click="zoomOut" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">缩小</button>
          <span class="px-3 py-1 text-sm text-gray-600">{{ Math.round(zoom * 100) }}%</span>
          <button @click="zoomIn" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">放大</button>
          <button @click="resetZoom" class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">重置</button>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <button @click="toggleConnectionMode" 
                :class="isConnecting ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'"
                class="px-4 py-2 rounded text-sm hover:bg-opacity-80">
          {{ isConnecting ? '完成连接' : '连接模式' }}
        </button>
        <button @click="saveFunnel" 
                :disabled="isSaving"
                class="px-4 py-2 rounded text-sm transition-all"
                :class="isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'">
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <div class="flex-1 flex">
      <!-- 左侧节点库 -->
      <div class="w-64 bg-white border-r border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">节点库</h3>
        <div class="space-y-2">
          <button v-for="nodeType in nodeTypes" :key="nodeType.type"
                  @click="addNode(nodeType)"
                  class="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-all hover:border-blue-300">
            <div class="flex items-center gap-2 mb-1">
              <div class="font-medium text-gray-900">{{ nodeType.label }}</div>
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: nodeType.color }"></div>
            </div>
            <div class="text-sm text-gray-600">{{ nodeType.description }}</div>
          </button>
        </div>
      </div>

      <!-- 中央画布区域 -->
      <div class="flex-1 relative overflow-hidden" ref="canvasContainer">
        <!-- 画布容器 -->
        <div class="absolute inset-0 bg-gray-100"
             @wheel="handleZoom"
             @mousedown="startPan">
          
          <!-- 网格背景 -->
          <div class="absolute inset-0" 
               :style="gridBackground"></div>
          
          <div class="absolute inset-0 bg-transparent"
               :style="canvasTransform"
               @click="clearSelection"
               @mousedown="startSelection">
            
            <!-- 框选区域 -->
            <div v-if="isSelecting" 
                 class="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                 :style="selectionBoxStyle"></div>
            
            <!-- 节点 -->
            <div v-for="node in nodes" :key="node.id"
                 :style="nodeStyle(node)"
                 @mousedown="startNodeDrag($event, node)"
                 @click.stop="selectNode(node, $event)"
                 class="absolute bg-white border-2 rounded-lg p-3 cursor-move shadow-md hover:shadow-lg transition-shadow"
                 :class="{ 
                   'border-blue-500': selectedNodeId === node.id || selectedNodeIds.includes(node.id), 
                   'border-gray-300': selectedNodeId !== node.id && !selectedNodeIds.includes(node.id),
                   'ring-2 ring-blue-300': selectedNodeIds.includes(node.id) && selectedNodeIds.length > 1
                 }">
              
              <div class="font-medium text-gray-900">{{ node.label }}</div>
              <div class="text-sm text-gray-600">{{ nodeTypes.find(t => t.type === node.type)?.description || node.type }}</div>
              
              <!-- 数据显示 -->
              <div v-if="node.data !== undefined && node.data !== 0" 
                   class="mt-2 space-y-1">
                <div class="px-2 py-1 bg-blue-100 rounded text-sm font-medium text-blue-800">
                  📊 {{ node.data.toLocaleString() }}
                </div>
                
                <!-- 转化率显示 -->
                <div v-if="getNodeConversionInfo(node)" 
                     class="px-2 py-1 rounded text-xs font-medium"
                     :class="getNodeConversionInfo(node).class">
                  {{ getNodeConversionInfo(node).text }}
                </div>
              </div>
              
              <!-- 连接锚点 -->
              <div v-if="isConnecting" class="absolute inset-0 pointer-events-none">
                <div v-for="anchor in ['top', 'right', 'bottom', 'left']" :key="anchor"
                     @click.stop="handleAnchorClick(node.id, anchor)"
                     :style="anchorStyle(anchor)"
                     class="absolute w-4 h-4 rounded-full cursor-pointer pointer-events-auto z-10 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg bg-blue-500 hover:bg-blue-600">
                </div>
              </div>
            </div>
            
            <!-- 连接线 SVG -->
            <svg class="absolute inset-0 pointer-events-none" 
                 style="width: 100%; height: 100%; overflow: visible;">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
                </marker>
                <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" 
                        refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
                </marker>
              </defs>
              <path v-for="connection in connections" :key="connection.id"
                    :d="getSimpleConnectionPath(connection)"
                    :stroke="selectedConnectionId === connection.id ? '#3B82F6' : '#6B7280'"
                    :stroke-width="selectedConnectionId === connection.id ? '3' : '2'"
                    fill="none"
                    :marker-end="selectedConnectionId === connection.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'"
                    class="cursor-pointer pointer-events-auto hover:stroke-blue-500 transition-colors duration-200"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    @click="selectConnection(connection.id)">
              </path>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-80 bg-white border-l border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">属性面板</h3>
        
        <!-- 选中节点属性 -->
        <div v-if="selectedNode" class="mb-6 p-3 bg-blue-50 rounded-lg">
          <h4 class="font-medium text-blue-900 mb-2">节点属性</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input v-model="selectedNode.label" type="text"
                     @input="scheduleAutoSave()"
                     class="w-full px-2 py-1 text-sm border rounded">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select v-model="selectedNode.type"
                      @change="scheduleAutoSave()"
                      class="w-full px-2 py-1 text-sm border rounded">
                <option v-for="type in nodeTypes" :key="type.type" :value="type.type">
                  {{ type.label }}
                </option>
              </select>
            </div>
            
            <!-- 数据输入 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">数据值</label>
              <input v-model.number="selectedNode.data" 
                     type="number" 
                     min="0" 
                     step="1"
                     placeholder="输入数量..."
                     @input="selectedNode.data = selectedNode.data || 0; scheduleAutoSave()"
                     class="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <div class="text-xs text-gray-500 mt-1">
                用户数量、访问量等数据指标
              </div>
            </div>
          </div>
        </div>
        
        <!-- 连接线属性 -->
        <div v-if="selectedConnection" class="mb-6 p-3 bg-green-50 rounded-lg">
          <h4 class="font-medium text-green-900 mb-2">连接线属性</h4>
          <div class="space-y-2">
            <div class="text-sm text-gray-600">
              从: {{ nodes.find(n => n.id === selectedConnection.from)?.label }}
            </div>
            <div class="text-sm text-gray-600">
              到: {{ nodes.find(n => n.id === selectedConnection.to)?.label }}
            </div>
            
            <!-- 转化率分析 -->
            <div v-if="getConnectionMetrics(selectedConnection)" 
                 class="mt-3 p-2 bg-white rounded border">
              <div class="text-xs font-medium text-gray-700 mb-1">📈 漏斗分析</div>
              <div class="text-sm space-y-1">
                <div class="flex justify-between">
                  <span class="text-gray-600">转化率:</span>
                  <span :class="getConversionRateColor(getConnectionMetrics(selectedConnection).conversionRate)"
                        class="font-medium">
                    {{ getConnectionMetrics(selectedConnection).conversionRate }}%
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">流失:</span>
                  <span class="text-red-600 font-medium">
                    {{ getConnectionMetrics(selectedConnection).dropout.toLocaleString() }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">流失率:</span>
                  <span class="text-red-600 font-medium">
                    {{ getConnectionMetrics(selectedConnection).dropoutRate }}%
                  </span>
                </div>
              </div>
            </div>
            
            <button @click="removeConnection(selectedConnection.id)" 
                    class="w-full mt-3 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm">
              🗑️ 删除连接线
            </button>
          </div>
        </div>
        
        <!-- 漏斗数据统计 -->
        <div v-if="getFunnelStats().totalUsers > 0" class="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 class="font-medium text-blue-900 mb-2">📈 漏斗统计</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">总用户数:</span>
              <span class="font-medium text-blue-800">{{ getFunnelStats().totalUsers.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">最终转化:</span>
              <span class="font-medium text-green-600">{{ getFunnelStats().finalConversions.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">整体转化率:</span>
              <span :class="getConversionRateColor(getFunnelStats().overallConversionRate)"
                    class="font-medium">
                {{ getFunnelStats().overallConversionRate }}%
              </span>
            </div>
          </div>
        </div>
        
        <!-- 保存状态 -->
        <div v-if="currentFunnel" class="mb-4 p-3 bg-green-50 rounded-lg">
          <h4 class="font-medium text-green-900 mb-1">💾 漏斗状态</h4>
          <div class="text-sm space-y-1">
            <div class="text-green-700">{{ currentFunnel.name }}</div>
            <div class="text-green-600 text-xs">
              ID: {{ currentFunnel.id }}
            </div>
            <div v-if="isSaving" class="text-blue-600 text-xs">
              🔄 正在保存...
            </div>
          </div>
        </div>
        
        <div class="space-y-2 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>节点数量</span>
            <span>{{ nodes.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>连接数量</span>
            <span>{{ connections.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>缩放比例</span>
            <span>{{ Math.round(zoom * 100) }}%</span>
          </div>
          <div v-if="selectedNodeId" class="text-blue-600 font-medium">
            ✓ 已选中单个节点
          </div>
          <div v-if="selectedNodeIds.length > 0" class="text-purple-600 font-medium">
            ✓ 已选中 {{ selectedNodeIds.length }} 个节点
          </div>
          <div v-if="selectedConnectionId" class="text-green-600 font-medium">
            ✓ 已选中连接线
          </div>
        </div>
        
        <div class="mt-6 space-y-2">
          <button @click="clearAll" 
                  class="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm">
            🗑️ 清空画布
          </button>
          
          <!-- 数据库操作按钮 -->
          <div class="space-y-2 pt-2 border-t border-gray-200">
            <button @click="() => loadFunnel()" 
                    :disabled="isLoading"
                    class="w-full px-3 py-2 rounded text-sm transition-all"
                    :class="isLoading ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'">
              {{ isLoading ? '加载中...' : '📂 加载漏斗' }}
            </button>
            
            <button @click="createNewFunnel" 
                    class="w-full px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-sm">
              ✨ 新建漏斗
            </button>
            
            <!-- 删除当前漏斗 -->
            <button v-if="currentFunnel && currentFunnel.id"
                    @click="deleteCurrentFunnel" 
                    :disabled="isDeleting"
                    class="w-full px-3 py-2 rounded text-sm transition-colors"
                    :class="isDeleting ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-red-100 hover:bg-red-200 text-red-700'">
              {{ isDeleting ? '删除中...' : '🗑️ 删除漏斗' }}
            </button>
          </div>
          
          <!-- 快捷键提示 -->
          <div class="p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div class="font-medium mb-1">⌨️ 快捷键:</div>
            <div>• Del - 删除选中</div>
            <div>• Ctrl+A - 全选节点</div>
            <div>• Ctrl+C/V - 复制/粘贴</div>
            <div>• Ctrl+Z/Y - 撤销/重做</div>
            <div>• Esc - 取消选中</div>
            <div>• 拖拽空白 - 框选多选</div>
            <div>• Ctrl+点击 - 多选节点</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通知消息 -->
    <div v-if="notification.show" 
         class="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300"
         :class="{
           'bg-green-500 text-white': notification.type === 'success',
           'bg-blue-500 text-white': notification.type === 'info',
           'bg-red-500 text-white': notification.type === 'error'
         }">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { funnelAPI } from '@/api/funnel'

// 数据
const nodeTypes = ref([
  { type: 'start', label: '🚀 开始节点', description: '流程起点', color: '#10B981' },
  { type: 'process', label: '⚙️ 处理节点', description: '执行操作', color: '#3B82F6' },
  { type: 'decision', label: '❓ 决策节点', description: '条件判断', color: '#F59E0B' },
  { type: 'end', label: '🏁 结束节点', description: '流程终点', color: '#EF4444' },
  { type: 'input', label: '📥 输入节点', description: '数据输入', color: '#8B5CF6' },
  { type: 'output', label: '📤 输出节点', description: '数据输出', color: '#EC4899' }
])

const nodes = ref([])
const connections = ref([])
const selectedNodeId = ref(null)
const selectedNodeIds = ref([]) // 多选节点
const selectedConnectionId = ref(null)
const canvasContainer = ref(null)

// 状态
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const isConnecting = ref(false)
const connectingFrom = ref(null)
const spacePressed = ref(false)
const clipboard = ref([])
const history = ref([])
const historyIndex = ref(-1)
const isSelecting = ref(false)
const selectionStart = ref({ x: 0, y: 0 })
const selectionEnd = ref({ x: 0, y: 0 })
const notification = ref({ show: false, message: '', type: 'success' })

// 路由和模式
const route = useRoute()
const isEditMode = computed(() => !!route.params.id)
const funnelId = computed(() => route.params.id)

// 漏斗数据保存状态
const currentFunnel = ref(null)
const funnelName = ref('我的漏斗')
const isSaving = ref(false)
const isLoading = ref(false)
const isDeleting = ref(false)
const autoSaveTimer = ref(null)

// 计算属性
const selectedNode = computed(() => 
  nodes.value.find(n => n.id === selectedNodeId.value)
)

const selectedConnection = computed(() => 
  connections.value.find(c => c.id === selectedConnectionId.value)
)

const canvasTransform = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
  transformOrigin: '0 0'
}))

const gridBackground = computed(() => {
  const gridSize = 20 * zoom.value
  return {
    backgroundImage: `
      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
    `,
    backgroundSize: `${gridSize}px ${gridSize}px`,
    backgroundPosition: `${panX.value % gridSize}px ${panY.value % gridSize}px`
  }
})

// 工具函数
const generateId = () => Math.random().toString(36).substring(2, 15)

// 节点操作
const addNode = (nodeType) => {
  const newNode = {
    id: generateId(),
    type: nodeType.type,
    label: nodeType.label,
    x: 50 + nodes.value.length * 30,
    y: 50 + nodes.value.length * 20,
    width: 120,
    height: 80,
    data: 0
  }
  nodes.value.push(newNode)
  saveToHistory()
  scheduleAutoSave()
}

const removeNode = (nodeId) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = null
  }
  selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  saveToHistory()
  scheduleAutoSave()
}

const removeConnection = (connectionId) => {
  connections.value = connections.value.filter(c => c.id !== connectionId)
  if (selectedConnectionId.value === connectionId) {
    selectedConnectionId.value = null
  }
  saveToHistory()
  scheduleAutoSave()
}

const selectNode = (node, event) => {
  if (event && (event.ctrlKey || event.metaKey)) {
    // Ctrl+点击多选模式
    if (selectedNodeIds.value.includes(node.id)) {
      selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== node.id)
    } else {
      selectedNodeIds.value.push(node.id)
    }
    selectedNodeId.value = null
  } else {
    // 单选模式
    selectedNodeId.value = node.id
    selectedNodeIds.value = []
  }
  selectedConnectionId.value = null
}

const selectConnection = (connectionId) => {
  selectedConnectionId.value = selectedConnectionId.value === connectionId ? null : connectionId
  selectedNodeId.value = null
  selectedNodeIds.value = []
}

// 框选功能
const startSelection = (event) => {
  if (event.target.classList.contains('bg-transparent') && 
      !spacePressed.value && 
      !event.ctrlKey && 
      !event.metaKey) {
    
    event.preventDefault()
    isSelecting.value = true
    
    const rect = canvasContainer.value.getBoundingClientRect()
    const canvasX = (event.clientX - rect.left - panX.value) / zoom.value
    const canvasY = (event.clientY - rect.top - panY.value) / zoom.value
    
    selectionStart.value = { x: canvasX, y: canvasY }
    selectionEnd.value = { x: canvasX, y: canvasY }
    
    const handleSelectionMove = (e) => {
      if (!isSelecting.value) return
      
      const canvasX = (e.clientX - rect.left - panX.value) / zoom.value
      const canvasY = (e.clientY - rect.top - panY.value) / zoom.value
      
      selectionEnd.value = { x: canvasX, y: canvasY }
      
      // 实时更新选中的节点
      updateSelectionNodes()
    }
    
    const endSelection = () => {
      isSelecting.value = false
      document.removeEventListener('mousemove', handleSelectionMove)
      document.removeEventListener('mouseup', endSelection)
    }
    
    document.addEventListener('mousemove', handleSelectionMove)
    document.addEventListener('mouseup', endSelection)
  }
}

const updateSelectionNodes = () => {
  const left = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const top = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const right = Math.max(selectionStart.value.x, selectionEnd.value.x)
  const bottom = Math.max(selectionStart.value.y, selectionEnd.value.y)
  
  const selectedIds = []
  nodes.value.forEach(node => {
    if (node.x < right && 
        node.x + node.width > left && 
        node.y < bottom && 
        node.y + node.height > top) {
      selectedIds.push(node.id)
    }
  })
  
  selectedNodeIds.value = selectedIds
  selectedNodeId.value = null
  selectedConnectionId.value = null
}

// 框选区域样式
const selectionBoxStyle = computed(() => {
  if (!isSelecting.value) return {}
  
  const left = Math.min(selectionStart.value.x, selectionEnd.value.x)
  const top = Math.min(selectionStart.value.y, selectionEnd.value.y)
  const width = Math.abs(selectionEnd.value.x - selectionStart.value.x)
  const height = Math.abs(selectionEnd.value.y - selectionStart.value.y)
  
  return {
    left: left + 'px',
    top: top + 'px',
    width: width + 'px',
    height: height + 'px'
  }
})

const clearSelection = () => {
  selectedNodeId.value = null
  selectedNodeIds.value = []
  selectedConnectionId.value = null
}

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 2000)
}

const nodeStyle = (node) => ({
  left: node.x + 'px',
  top: node.y + 'px',
  width: node.width + 'px',
  height: node.height + 'px'
})

const anchorStyle = (position) => {
  const positions = {
    top: { left: '50%', top: '0' },
    right: { left: '100%', top: '50%' },
    bottom: { left: '50%', top: '100%' },
    left: { left: '0', top: '50%' }
  }
  return positions[position]
}

// 连接功能
const toggleConnectionMode = () => {
  isConnecting.value = !isConnecting.value
  connectingFrom.value = null
}

const handleAnchorClick = (nodeId, anchor) => {
  if (!connectingFrom.value) {
    connectingFrom.value = { nodeId, anchor }
  } else if (connectingFrom.value.nodeId !== nodeId) {
    const connection = {
      id: generateId(),
      from: connectingFrom.value.nodeId,
      fromAnchor: connectingFrom.value.anchor,
      to: nodeId,
      toAnchor: anchor
    }
    connections.value.push(connection)
    connectingFrom.value = null
    saveToHistory()
    scheduleAutoSave()
  }
}

const getSimpleConnectionPath = (connection) => {
  const fromNode = nodes.value.find(n => n.id === connection.from)
  const toNode = nodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode) return ''
  
  const fromPoint = getAnchorPosition(fromNode, connection.fromAnchor)
  const toPoint = getAnchorPosition(toNode, connection.toAnchor)
  
  // 创建平滑的贝塞尔曲线
  const dx = toPoint.x - fromPoint.x
  const dy = toPoint.y - fromPoint.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // 根据锥点方向计算控制点
  const getControlOffset = (anchor) => {
    const offset = Math.min(distance * 0.3, 80)
    switch (anchor) {
      case 'top': return { x: 0, y: -offset }
      case 'right': return { x: offset, y: 0 }
      case 'bottom': return { x: 0, y: offset }
      case 'left': return { x: -offset, y: 0 }
      default: return { x: 0, y: 0 }
    }
  }
  
  const fromOffset = getControlOffset(connection.fromAnchor)
  const toOffset = getControlOffset(connection.toAnchor)
  
  const cp1x = fromPoint.x + fromOffset.x
  const cp1y = fromPoint.y + fromOffset.y
  const cp2x = toPoint.x + toOffset.x
  const cp2y = toPoint.y + toOffset.y
  
  return `M ${fromPoint.x} ${fromPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toPoint.x} ${toPoint.y}`
}

const getExtendedConnectionPath = (connection) => {
  const fromNode = nodes.value.find(n => n.id === connection.from)
  const toNode = nodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode) return ''
  
  const fromPoint = getAnchorPosition(fromNode, connection.fromAnchor)
  const toPoint = getAnchorPosition(toNode, connection.toAnchor)
  
  // 计算考虑更大偏移的坐标以匹配新的viewBox
  const adjustedFromX = fromPoint.x + 2000
  const adjustedFromY = fromPoint.y + 2000
  const adjustedToX = toPoint.x + 2000
  const adjustedToY = toPoint.y + 2000
  
  // 创建平滑的贝塞尔曲线连接
  const dx = adjustedToX - adjustedFromX
  const dy = adjustedToY - adjustedFromY
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // 根据锚点方向计算控制点偏移
  const getControlOffset = (anchor, dist) => {
    const offset = Math.min(dist * 0.3, 60)
    switch (anchor) {
      case 'top': return { x: 0, y: -offset }
      case 'right': return { x: offset, y: 0 }
      case 'bottom': return { x: 0, y: offset }
      case 'left': return { x: -offset, y: 0 }
      default: return { x: 0, y: 0 }
    }
  }
  
  const fromOffset = getControlOffset(connection.fromAnchor, distance)
  const toOffset = getControlOffset(connection.toAnchor, distance)
  
  const cp1x = adjustedFromX + fromOffset.x
  const cp1y = adjustedFromY + fromOffset.y
  const cp2x = adjustedToX + toOffset.x
  const cp2y = adjustedToY + toOffset.y
  
  return `M ${adjustedFromX} ${adjustedFromY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${adjustedToX} ${adjustedToY}`
}

const getAnchorPosition = (node, anchor) => {
  const x = node.x + (anchor === 'left' ? 0 : anchor === 'right' ? node.width : node.width / 2)
  const y = node.y + (anchor === 'top' ? 0 : anchor === 'bottom' ? node.height : node.height / 2)
  return { x, y }
}

// 缩放功能
const zoomIn = () => {
  zoom.value = Math.min(zoom.value * 1.2, 3)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value / 1.2, 0.3)
}

const resetZoom = () => {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

const handleZoom = (event) => {
  event.preventDefault()
  
  const rect = canvasContainer.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // 计算鼠标在画布坐标系中的位置
  const canvasMouseX = (mouseX - panX.value) / zoom.value
  const canvasMouseY = (mouseY - panY.value) / zoom.value
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.min(Math.max(zoom.value * delta, 0.3), 3)
  
  // 调整平移以保持鼠标点为中心
  panX.value = mouseX - canvasMouseX * newZoom
  panY.value = mouseY - canvasMouseY * newZoom
  
  zoom.value = newZoom
}

// 拖拽功能
const startPan = (event) => {
  if (event.target.classList.contains('bg-transparent') || 
      event.target === canvasContainer.value ||
      event.target.classList.contains('absolute')) {
    event.preventDefault()
    isPanning.value = true
    const startX = event.clientX - panX.value
    const startY = event.clientY - panY.value
    
    const handleMove = (e) => {
      if (isPanning.value) {
        panX.value = e.clientX - startX
        panY.value = e.clientY - startY
      }
    }
    
    const handleUp = () => {
      isPanning.value = false
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }
}

const startNodeDrag = (event, node) => {
  event.preventDefault()
  event.stopPropagation()
  
  selectedNodeId.value = node.id
  const startX = event.clientX
  const startY = event.clientY
  const startNodeX = node.x
  const startNodeY = node.y
  
  const handleMove = (e) => {
    const dx = (e.clientX - startX) / zoom.value
    const dy = (e.clientY - startY) / zoom.value
    node.x = startNodeX + dx
    node.y = startNodeY + dy
  }
  
  const handleUp = () => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }
  
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}

// 其他功能
const clearAll = () => {
  if (confirm('确定要清空整个画布吗？')) {
    nodes.value = []
    connections.value = []
    selectedNodeId.value = null
  }
}

const saveFunnel = async () => {
  if (isSaving.value) return
  
  try {
    isSaving.value = true
    
    const funnelData = {
      nodes: nodes.value,
      connections: connections.value,
      zoom: zoom.value,
      panX: panX.value,
      panY: panY.value,
      savedAt: new Date().toISOString()
    }
    
    console.log('保存逻辑判断:')
    console.log('- isEditMode.value:', isEditMode.value)
    console.log('- funnelId.value:', funnelId.value)
    console.log('- currentFunnel.value:', currentFunnel.value)
    console.log('- currentFunnel.value?.id:', currentFunnel.value?.id)
    
    // 检查是否为编辑模式且有funnelId
    if (isEditMode.value && funnelId.value) {
      // 编辑模式：更新现有漏斗
      console.log('编辑模式更新漏斗 ID:', funnelId.value)
      const updateResponse = await funnelAPI.updateFunnel(funnelId.value, {
        canvasData: funnelData,
        name: funnelName.value || '未命名漏斗'
      })
      console.log('更新响应:', updateResponse)
      showNotification('漏斗已保存', 'success')
      
      // 确保currentFunnel指向正确的数据
      if (!currentFunnel.value) {
        currentFunnel.value = updateResponse.data
      }
    } else if (currentFunnel.value && currentFunnel.value.id) {
      // 已有漏斗：更新现有漏斗
      console.log('更新现有漏斗 ID:', currentFunnel.value.id)
      const updateResponse = await funnelAPI.updateFunnel(currentFunnel.value.id, {
        canvasData: funnelData,
        name: funnelName.value || '未命名漏斗'
      })
      console.log('更新响应:', updateResponse)
      showNotification('漏斗已保存', 'success')
    } else {
      // 创建新漏斗
      console.log('创建新漏斗')
      const newFunnelResponse = await funnelAPI.createFunnel({
        name: funnelName.value || '未命名漏斗',
        description: '由漏斗构建器创建',
        canvasData: funnelData
      })
      currentFunnel.value = newFunnelResponse.data
      console.log('新创建的漏斗:', currentFunnel.value)
      console.log('设置currentFunnel.value.id为:', currentFunnel.value.id)
      showNotification('漏斗已创建并保存', 'success')
    }
    
    console.log('漏斗数据已保存到数据库')
  } catch (error) {
    console.error('保存失败:', error)
    showNotification('保存失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    isSaving.value = false
  }
}

// 自动保存功能 - 暂时禁用以调试重复保存问题
const scheduleAutoSave = () => {
  console.log('scheduleAutoSave 调用，但已禁用以防止重复保存')
  // 暂时完全禁用自动保存
  /*
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
  
  autoSaveTimer.value = setTimeout(() => {
    if (nodes.value.length > 0 && !isSaving.value) {
      console.log('自动保存触发')
      saveFunnel()
    }
  }, 5000) // 5秒后自动保存（延长时间避免与手动保存冲突）
  */
}

// 漏斗分析功能
const getConnectionMetrics = (connection) => {
  const fromNode = nodes.value.find(n => n.id === connection.from)
  const toNode = nodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode || fromNode.data === 0) return null
  
  const conversionRate = Math.round((toNode.data / fromNode.data) * 100)
  const dropout = fromNode.data - toNode.data
  const dropoutRate = Math.round((dropout / fromNode.data) * 100)
  
  return {
    conversionRate,
    dropout: Math.max(0, dropout),
    dropoutRate: Math.max(0, dropoutRate)
  }
}

const getFunnelStats = () => {
  if (nodes.value.length === 0) {
    return { totalUsers: 0, finalConversions: 0, overallConversionRate: 0 }
  }
  
  // 找到最高和最低数据值
  const dataValues = nodes.value.map(n => n.data).filter(d => d > 0)
  if (dataValues.length === 0) {
    return { totalUsers: 0, finalConversions: 0, overallConversionRate: 0 }
  }
  
  const totalUsers = Math.max(...dataValues)
  const finalConversions = Math.min(...dataValues)
  const overallConversionRate = totalUsers > 0 ? Math.round((finalConversions / totalUsers) * 100) : 0
  
  return {
    totalUsers,
    finalConversions,
    overallConversionRate
  }
}

const getConversionRateColor = (rate) => {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  if (rate >= 40) return 'text-orange-600'
  return 'text-red-600'
}

const getNodeConversionInfo = (node) => {
  // 查找从当前节点出发的连接
  const outgoingConnection = connections.value.find(c => c.from === node.id)
  if (!outgoingConnection) return null
  
  const metrics = getConnectionMetrics(outgoingConnection)
  if (!metrics) return null
  
  if (metrics.conversionRate >= 80) {
    return {
      text: `↗ ${metrics.conversionRate}%`,
      class: 'bg-green-100 text-green-700'
    }
  } else if (metrics.conversionRate >= 60) {
    return {
      text: `→ ${metrics.conversionRate}%`,
      class: 'bg-yellow-100 text-yellow-700'
    }
  } else {
    return {
      text: `↘ ${metrics.conversionRate}%`,
      class: 'bg-red-100 text-red-700'
    }
  }
}

// 键盘事件处理
const handleKeyDown = (event) => {
  // 防止在输入框中触发快捷键
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return

  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      deleteSelected()
      break
    
    case 'a':
    case 'A':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        selectAll()
      }
      break
    
    case 'c':
    case 'C':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        copySelected()
      }
      break
    
    case 'v':
    case 'V':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        pasteNodes()
      }
      break
    
    case 'z':
    case 'Z':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      break
    
    case 'y':
    case 'Y':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        redo()
      }
      break
    
    case 'Escape':
      event.preventDefault()
      clearSelection()
      if (isConnecting.value) {
        toggleConnectionMode()
      }
      break
    
    case ' ':
      event.preventDefault()
      spacePressed.value = true
      break
  }
}

const handleKeyUp = (event) => {
  if (event.key === ' ') {
    spacePressed.value = false
  }
}

// 快捷键功能实现
const deleteSelected = () => {
  if (selectedNodeIds.value.length > 0) {
    // 批量删除多选节点
    const count = selectedNodeIds.value.length
    selectedNodeIds.value.forEach(nodeId => {
      nodes.value = nodes.value.filter(n => n.id !== nodeId)
      connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)
    })
    selectedNodeIds.value = []
    showNotification(`已删除 ${count} 个节点`, 'success')
    saveToHistory()
    scheduleAutoSave()
  } else if (selectedNodeId.value) {
    removeNode(selectedNodeId.value)
    showNotification('已删除节点', 'success')
  } else if (selectedConnectionId.value) {
    removeConnection(selectedConnectionId.value)
    showNotification('已删除连接线', 'success')
  }
}

const selectAll = () => {
  if (nodes.value.length > 0) {
    selectedNodeIds.value = nodes.value.map(node => node.id)
    selectedNodeId.value = null
    selectedConnectionId.value = null
    showNotification(`已全选 ${nodes.value.length} 个节点`, 'info')
    console.log('全选所有节点:', selectedNodeIds.value.length)
  }
}

const copySelected = () => {
  if (selectedNodeIds.value.length > 0) {
    // 复制多选节点
    const selectedNodes = nodes.value.filter(n => selectedNodeIds.value.includes(n.id))
    clipboard.value = selectedNodes.map(node => ({ ...node }))
    console.log('已复制', clipboard.value.length, '个节点到剪贴板')
    showNotification(`已复制 ${clipboard.value.length} 个节点`, 'success')
  } else if (selectedNodeId.value) {
    const node = nodes.value.find(n => n.id === selectedNodeId.value)
    if (node) {
      clipboard.value = [{ ...node }]
      console.log('已复制节点到剪贴板')
      showNotification('已复制节点', 'success')
    }
  }
}

const pasteNodes = () => {
  if (clipboard.value.length > 0) {
    const pastedIds = []
    clipboard.value.forEach(nodeTemplate => {
      const newNode = {
        ...nodeTemplate,
        id: generateId(),
        x: nodeTemplate.x + 30, // 偏移位置
        y: nodeTemplate.y + 30,
        data: nodeTemplate.data || 0 // 确保数据字段被复制
      }
      nodes.value.push(newNode)
      pastedIds.push(newNode.id)
    })
    // 选中新粘贴的节点
    selectedNodeIds.value = pastedIds
    selectedNodeId.value = null
    selectedConnectionId.value = null
    console.log('已粘贴节点')
    showNotification(`已粘贴 ${clipboard.value.length} 个节点`, 'success')
    saveToHistory()
    scheduleAutoSave()
  }
}

const saveToHistory = () => {
  const state = {
    nodes: JSON.parse(JSON.stringify(nodes.value)),
    connections: JSON.parse(JSON.stringify(connections.value))
  }
  
  // 移除当前位置之后的历史记录
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(state)
  historyIndex.value++
  
  // 限制历史记录数量
  if (history.value.length > 50) {
    history.value.shift()
    historyIndex.value--
  }
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    const state = history.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(state.nodes))
    connections.value = JSON.parse(JSON.stringify(state.connections))
    clearSelection()
    console.log('撤销操作')
  }
}

const redo = () => {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    const state = history.value[historyIndex.value]
    nodes.value = JSON.parse(JSON.stringify(state.nodes))
    connections.value = JSON.parse(JSON.stringify(state.connections))
    clearSelection()
    console.log('重做操作')
  }
}

// 漏斗管理功能
const loadFunnel = async (specificFunnelId) => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    
    if (specificFunnelId) {
      // 加载指定的漏斗（编辑模式）
      console.log('=== 开始加载指定漏斗 ===')
      console.log('漏斗ID:', specificFunnelId)
      console.log('调用 funnelAPI.getFunnelById...')
      
      const funnelDetailResponse = await funnelAPI.getFunnelById(specificFunnelId)
      // 修复：后端返回的数据结构是 {success: true, data: {...}}，需要访问嵌套的data字段
      const funnelDetail = funnelDetailResponse.data.data
      console.log('加载漏斗详情:', funnelDetail.name)
      
      if (funnelDetail) {
        currentFunnel.value = funnelDetail
        
        // 设置漏斗名称
        funnelName.value = funnelDetail.name || '未命名漏斗'
        console.log('加载的漏斗名称:', funnelName.value)
        
        console.log('检查画布数据:', funnelDetail.canvasData)
        
        if (funnelDetail.canvasData) {
          console.log('=== 恢复画布数据 ===')
          console.log('原始canvasData:', funnelDetail.canvasData)
          
          // 恢复画布数据
          const originalNodes = nodes.value.length
          const originalConnections = connections.value.length
          
          nodes.value = funnelDetail.canvasData.nodes || []
          connections.value = funnelDetail.canvasData.connections || []
          zoom.value = funnelDetail.canvasData.zoom || 1
          panX.value = funnelDetail.canvasData.panX || 0
          panY.value = funnelDetail.canvasData.panY || 0
          
          console.log('=== 数据恢复对比 ===')
          console.log('恢复前 - 节点数:', originalNodes, '连接数:', originalConnections)
          console.log('恢复后 - 节点数:', nodes.value.length, '连接数:', connections.value.length)
          console.log('恢复后的节点详情:', nodes.value)
          console.log('恢复后的连接详情:', connections.value)
          console.log('画布状态 - zoom:', zoom.value, 'panX:', panX.value, 'panY:', panY.value)
          
          // 强制触发响应式更新
          nextTick(() => {
            console.log('nextTick后 - 节点数:', nodes.value.length, '连接数:', connections.value.length)
            console.log('DOM更新完成，数据应该已渲染')
          })
          
          showNotification(`已加载漏斗: ${funnelDetail.name}`, 'success')
        } else {
          console.log('漏斗无画布数据，开始新的设计')
          showNotification('漏斗数据为空，开始新的设计', 'info')
        }
        
        // 清空选中状态
        clearSelection()
        saveToHistory()
        return
      } else {
        console.log('未找到漏斗详情数据')
        showNotification('未找到漏斗数据', 'error')
        return
      }
    } else {
      // 加载最新的漏斗（创建模式）
      const response = await funnelAPI.getFunnels({ page: 1, per_page: 10 })
      console.log('漏斗列表响应:', response)
      
      if (response.data && response.data.funnels && response.data.funnels.length > 0) {
        // 取最新的漏斗
        const latestFunnel = response.data.funnels[0]
        console.log('加载漏斗:', latestFunnel)
        const funnelDetailResponse = await funnelAPI.getFunnelById(latestFunnel.id)
        const funnelDetail = funnelDetailResponse.data.data  // 修复：需要访问嵌套的data字段
        
        if (funnelDetail.canvasData) {
          // 恢复画布数据
          nodes.value = funnelDetail.canvasData.nodes || []
          connections.value = funnelDetail.canvasData.connections || []
          zoom.value = funnelDetail.canvasData.zoom || 1
          panX.value = funnelDetail.canvasData.panX || 0
          panY.value = funnelDetail.canvasData.panY || 0
          
          currentFunnel.value = funnelDetail
          funnelName.value = funnelDetail.name || '未命名漏斗'
          showNotification(`已加载漏斗: ${funnelDetail.name}`, 'success')
          
          // 清空选中状态
          clearSelection()
          saveToHistory()
        } else {
          showNotification('漏斗数据为空', 'info')
        }
      } else {
        showNotification('没有找到保存的漏斗', 'info')
      }
    }
  } catch (error) {
    console.error('加载失败:', error)
    showNotification('加载失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    isLoading.value = false
  }
}

const createNewFunnel = () => {
  // 清空当前漏斗
  currentFunnel.value = null
  nodes.value = []
  connections.value = []
  zoom.value = 1
  panX.value = 0
  panY.value = 0
  clearSelection()
  saveToHistory()
  showNotification('已创建新漏斗', 'info')
}

// 删除当前漏斗
const deleteCurrentFunnel = async () => {
  if (!currentFunnel.value || !currentFunnel.value.id) {
    showNotification('没有可删除的漏斗', 'error')
    return
  }
  
  const confirmed = confirm(`确定要删除漏斗 "${currentFunnel.value.name}" 吗？\n\n此操作将永久删除漏斗及其所有数据，无法恢复。`)
  
  if (!confirmed) return
  
  try {
    isDeleting.value = true
    
    // 调用API删除漏斗
    await funnelAPI.deleteFunnel(currentFunnel.value.id)
    
    // 删除成功，清空当前画布
    const deletedName = currentFunnel.value.name
    currentFunnel.value = null
    nodes.value = []
    connections.value = []
    zoom.value = 1
    panX.value = 0
    panY.value = 0
    clearSelection()
    saveToHistory()
    
    // 删除成功，无需显示通知
    
  } catch (error) {
    console.error('删除漏斗失败:', error)
    showNotification('删除失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    isDeleting.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  
  // 保存初始状态
  saveToHistory()
  
  // 根据模式加载数据
  console.log('=== 页面初始化 ===')
  console.log('isEditMode.value:', isEditMode.value)
  console.log('funnelId.value:', funnelId.value)
  console.log('route.params:', route.params)
  console.log('route.path:', route.path)
  
  if (isEditMode.value) {
    console.log('编辑模式，加载漏斗 ID:', funnelId.value)
    if (funnelId.value) {
      loadFunnel(funnelId.value)
    } else {
      console.error('编辑模式但没有找到漏斗ID')
    }
  } else {
    console.log('创建模式，不加载现有数据')
    // 创建模式下不加载任何现有数据，保持空白画布
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
  
  // 清理自动保存定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
})
</script>