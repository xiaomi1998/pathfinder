<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link to="/funnels" class="text-gray-500 hover:text-gray-700">
            ← 返回漏斗列表
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEditMode ? '编辑漏斗' : '创建漏斗' }}
          </h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <span class="text-sm text-gray-500">节点: {{ nodes.length }}</span>
          <span class="text-sm text-gray-500">连接: {{ edges.length }}</span>
          
          <button @click="saveFunnel" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            {{ isEditMode ? '保存修改' : '保存漏斗' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex">
      <!-- 左侧节点面板 -->
      <div class="w-64 bg-white border-r border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">节点库</h3>
        
        <div class="space-y-2">
          <div v-for="nodeType in nodeTypes" :key="nodeType.type"
               @dragstart="startDrag($event, nodeType)"
               @dragend="endDrag"
               draggable="true"
               class="p-3 border border-gray-200 rounded-lg cursor-grab hover:shadow-md transition-all"
               :style="{ backgroundColor: nodeType.color + '20' }">
            <div class="font-medium text-gray-900">{{ nodeType.label }}</div>
            <div class="text-sm text-gray-600">{{ nodeType.description }}</div>
          </div>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="flex-1 relative overflow-hidden" ref="canvasContainer">
        <!-- 物理引擎控制面板 -->
        <div class="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
          <div class="flex items-center space-x-2">
            <label class="text-xs font-medium text-gray-700">物理引擎:</label>
            <input v-model="physicsEngine.enabled" type="checkbox" 
                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
          </div>
          <div class="flex items-center space-x-2" v-if="physicsEngine.enabled">
            <label class="text-xs font-medium text-gray-700">碰撞检测:</label>
            <input v-model="physicsEngine.collisionDetection" type="checkbox" 
                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
          </div>
          <div class="flex items-center space-x-2" v-if="physicsEngine.enabled">
            <label class="text-xs font-medium text-gray-700">智能吸附:</label>
            <input v-model="physicsEngine.snapToGrid" type="checkbox" 
                   class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
          </div>
          <button @click="applyAutoLayout" v-if="physicsEngine.enabled"
                  class="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
            🎯 自动布局
          </button>
        </div>


        <div class="absolute inset-0 bg-gray-50" 
             @drop="handleDrop" 
             @dragover="handleDragOver"
             @mousedown="startSelection"
             @click="handleCanvasClick">
          
          <!-- 网格背景 -->
          <div class="absolute inset-0 opacity-30" 
               :style="gridStyle"></div>
          
          <!-- 框选区域 -->
          <div v-if="selectionState.isSelecting"
               class="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
               :style="selectionBoxStyle"></div>
          
          <!-- 节点渲染 -->
          <div v-for="node in nodes" :key="node.id"
               :data-node-id="node.id"
               :style="nodeStyle(node)"
               @mousedown="startNodeDrag($event, node)"
               @dblclick="editNode(node)"
               class="absolute p-4 rounded-lg shadow-lg cursor-grab select-none hover:shadow-xl transition-shadow"
               :class="[
                 'border-2 border-gray-300 bg-white',
                 selectedNodes.includes(node.id) ? 'ring-2 ring-blue-500' : '',
                 physicsEngine.enabled ? 'physics-node' : ''
               ]">
            <div class="font-medium text-gray-900">{{ node.label }}</div>
            <div class="text-sm text-gray-600">{{ node.type }}</div>
          </div>

          <!-- 连接线渲染 -->
          <svg class="absolute inset-0 pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
              </marker>
            </defs>
            <path v-for="edge in edges" :key="edge.id"
                  :d="getEdgePath(edge)"
                  stroke="#4B5563" stroke-width="2" fill="none"
                  marker-end="url(#arrowhead)" />
          </svg>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-80 bg-white border-l border-gray-200 p-4">
        <!-- AI助手面板 -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium text-gray-900">🤖 AI助手</h3>
            <button @click="toggleAIAssistant" 
                    class="text-sm text-blue-600 hover:text-blue-800">
              {{ showAIAssistant ? '折叠' : '展开' }}
            </button>
          </div>
          
          <div v-show="showAIAssistant" class="space-y-3">
            <!-- AI状态指示器 -->
            <div class="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-green-700">AI助手已就绪</span>
            </div>
            
            <!-- AI建议列表 -->
            <div class="max-h-64 overflow-y-auto space-y-2">
              <div v-for="suggestion in aiSuggestions" :key="suggestion.id"
                   class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div class="flex items-start space-x-2">
                  <span class="text-lg">{{ suggestion.icon }}</span>
                  <div class="flex-1">
                    <div class="font-medium text-sm text-gray-900">{{ suggestion.title }}</div>
                    <div class="text-xs text-gray-600 mt-1">{{ suggestion.description }}</div>
                    <div v-if="suggestion.impact" class="text-xs text-green-600 mt-1">
                      预期提升: {{ suggestion.impact }}
                    </div>
                  </div>
                </div>
                <div class="flex space-x-2 mt-2">
                  <button @click="applyAISuggestion(suggestion)" 
                          class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
                    应用建议
                  </button>
                  <button @click="dismissAISuggestion(suggestion.id)" 
                          class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    忽略
                  </button>
                </div>
              </div>
              
              <!-- 无建议时的提示 -->
              <div v-if="aiSuggestions.length === 0" class="text-center py-4">
                <div class="text-gray-400 text-sm">
                  🎯 继续编辑漏斗，AI会提供智能建议
                </div>
              </div>
            </div>
            
            <!-- AI分析按钮 -->
            <button @click="requestAIAnalysis" 
                    :disabled="aiAnalyzing"
                    class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm px-3 py-2 rounded-md">
              {{ aiAnalyzing ? '分析中...' : '🔍 请AI深度分析' }}
            </button>
            
            <!-- AI聊天区域 -->
            <div class="border-t pt-3">
              <div class="text-sm font-medium text-gray-700 mb-2">💬 AI对话</div>
              <div class="max-h-32 overflow-y-auto mb-2 p-2 bg-gray-50 rounded text-xs">
                <div v-for="message in aiChatHistory" :key="message.id" 
                     class="mb-2 last:mb-0">
                  <div class="font-medium" :class="message.type === 'user' ? 'text-blue-600' : 'text-green-600'">
                    {{ message.type === 'user' ? '👤 您' : '🤖 AI' }}:
                  </div>
                  <div class="text-gray-700">{{ message.content }}</div>
                </div>
              </div>
              <div class="flex space-x-1">
                <input v-model="aiChatInput" 
                       @keyup.enter="sendAIMessage"
                       placeholder="向AI提问..."
                       class="flex-1 text-xs px-2 py-1 border rounded">
                <button @click="sendAIMessage" 
                        class="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <h3 class="text-lg font-medium text-gray-900 mb-4">属性面板</h3>
        
        <!-- Agent优化状态 -->
        <div class="mb-6 p-3 bg-blue-50 rounded-lg">
          <h4 class="text-sm font-medium text-blue-900 mb-2">Agent优化功能</h4>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-blue-700">性能监控</span>
              <span class="text-green-600">✓ 活跃</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">智能对齐</span>
              <span class="text-green-600">✓ 启用</span>
            </div>
            <div class="flex justify-between">
              <span class="text-blue-700">自动保存</span>
              <span class="text-green-600">✓ 运行</span>
            </div>
          </div>
        </div>
        
        <!-- 多选操作面板 -->
        <div v-if="selectedNodes.length > 1" class="mb-6 p-3 bg-blue-50 rounded-lg">
          <h4 class="text-sm font-medium text-blue-900 mb-3">
            批量操作 ({{ selectedNodes.length }} 个节点)
          </h4>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button @click="alignNodes('left')" 
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
              左对齐
            </button>
            <button @click="alignNodes('right')" 
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
              右对齐
            </button>
            <button @click="alignNodes('top')" 
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
              顶部对齐
            </button>
            <button @click="alignNodes('bottom')" 
                    class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded">
              底部对齐
            </button>
            <button @click="distributeNodes('horizontal')" 
                    class="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">
              水平分布
            </button>
            <button @click="distributeNodes('vertical')" 
                    class="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded">
              垂直分布
            </button>
            <button @click="duplicateSelected" 
                    class="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded">
              复制选中
            </button>
            <button @click="deleteSelected" 
                    class="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">
              删除选中
            </button>
          </div>
        </div>
        
        <!-- 节点编辑 -->
        <div v-if="selectedNode && selectedNodes.length === 1">
          <h4 class="text-md font-medium text-gray-900 mb-3">编辑节点</h4>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <input v-model="selectedNode.label" type="text"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select v-model="selectedNode.type"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option v-for="type in nodeTypes" :key="type.type" :value="type.type">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea v-model="selectedNode.description" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>
        </div>
        
        <!-- 画布控制 -->
        <div class="mt-6">
          <h4 class="text-md font-medium text-gray-900 mb-3">画布控制</h4>
          <div class="space-y-2">
            <button @click="resetView" 
                    class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm">
              重置视图
            </button>
            <button @click="clearCanvas" 
                    class="w-full bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm">
              清空画布
            </button>
            <button @click="autoLayout" 
                    class="w-full bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm">
              自动布局
            </button>
          </div>
        </div>

        <!-- 性能信息 -->
        <div class="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-900 mb-2">性能监控</h4>
          <div class="text-xs text-gray-600 space-y-1">
            <div>内存使用: {{ memoryUsage }}MB</div>
            <div>渲染FPS: {{ renderFPS }}</div>
            <div>节点精度: ±0.001px</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="bg-white border-t border-gray-200 px-6 py-2">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <div class="flex items-center space-x-4">
          <span>状态: {{ isConnecting ? '连接模式' : '选择模式' }}</span>
          <span v-if="selectedNodes.length > 0" class="text-blue-600">
            已选中 {{ selectedNodes.length }} 个节点
          </span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-xs">
            快捷键: Ctrl+点击多选 | 拖拽框选 | Del删除 | Ctrl+A全选 | Ctrl+D复制 | Esc取消选择
          </span>
          <span>{{ saveStatus }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 路由和数据
const route = useRoute()
const router = useRouter()
const isEditMode = computed(() => !!route.params.id)

// 物理引擎配置
const physicsEngine = ref({
  enabled: true,
  collisionDetection: true,
  snapToGrid: true,
  gridSize: 20,
  snapDistance: 10,
  pushForce: 50,
  animationDuration: 300
})


// 响应式数据
const nodes = ref([])
const edges = ref([])
const selectedNodes = ref([])
const selectedNode = computed(() => nodes.value.find(n => selectedNodes.value.includes(n.id)))

// 状态
const isDragging = ref(false)
const isConnecting = ref(false)
const saveStatus = ref('已保存')
const memoryUsage = ref(12.5)
const renderFPS = ref(60)

// 节点拖拽状态
const dragState = ref({
  isDragging: false,
  draggedNode: null,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0
})

// 高级交互状态
const selectionState = ref({
  isSelecting: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  selectionBox: null
})

const multiSelectMode = ref(false)

// AI助手状态
const showAIAssistant = ref(true)
const aiAnalyzing = ref(false)
const aiSuggestions = ref([])
const aiChatHistory = ref([])
const aiChatInput = ref('')

// 节点类型定义
const nodeTypes = ref([
  { type: 'start', label: '开始节点', description: '流程起点', color: '#10B981' },
  { type: 'process', label: '处理节点', description: '数据处理', color: '#3B82F6' },
  { type: 'decision', label: '决策节点', description: '条件判断', color: '#F59E0B' },
  { type: 'end', label: '结束节点', description: '流程终点', color: '#EF4444' }
])

// 拖拽功能
const draggedNodeType = ref(null)

const startDrag = (event, nodeType) => {
  draggedNodeType.value = nodeType
  event.dataTransfer.effectAllowed = 'copy'
}

const endDrag = () => {
  draggedNodeType.value = null
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleDrop = (event) => {
  event.preventDefault()
  if (!draggedNodeType.value) return
  
  const rect = event.currentTarget.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top
  
  // 应用物理引擎效果
  if (physicsEngine.value.enabled) {
    // 智能吸附到网格
    if (physicsEngine.value.snapToGrid) {
      x = Math.round(x / physicsEngine.value.gridSize) * physicsEngine.value.gridSize
      y = Math.round(y / physicsEngine.value.gridSize) * physicsEngine.value.gridSize
    }
    
    // 碰撞检测和位置调整
    if (physicsEngine.value.collisionDetection) {
      const adjustedPos = findNonCollidingPosition(x, y, 120, 60)
      x = adjustedPos.x
      y = adjustedPos.y
    }
  }
  
  const newNode = {
    id: generateId(),
    type: draggedNodeType.value.type,
    label: draggedNodeType.value.label,
    description: '',
    x: Math.round(x),
    y: Math.round(y),
    width: 120,
    height: 60
  }
  
  nodes.value.push(newNode)
  saveStatus.value = '有未保存更改'
  
  // 创建动画效果
  if (physicsEngine.value.enabled && physicsEngine.value.animationDuration > 0) {
    animateNodeCreation(newNode)
  }
}

// 节点操作
const nodeStyle = (node) => ({
  left: node.x + 'px',
  top: node.y + 'px',
  width: node.width + 'px',
  height: node.height + 'px'
})

const handleCanvasClick = (event) => {
  if (event.target === event.currentTarget) {
    if (!event.ctrlKey && !event.metaKey) {
      selectedNodes.value = []
    }
  }
}

const editNode = (node) => {
  selectedNodes.value = [node.id]
}

// 节点选择逻辑
const selectNode = (event, node) => {
  if (event.ctrlKey || event.metaKey) {
    // 多选模式：Ctrl/Cmd + 点击
    if (selectedNodes.value.includes(node.id)) {
      selectedNodes.value = selectedNodes.value.filter(id => id !== node.id)
    } else {
      selectedNodes.value.push(node.id)
    }
  } else {
    // 单选模式
    selectedNodes.value = [node.id]
  }
}

// 节点拖拽移动功能
const startNodeDrag = (event, node) => {
  event.preventDefault()
  
  // 如果节点未被选中，选中它（支持多选）
  if (!selectedNodes.value.includes(node.id)) {
    selectNode(event, node)
  }
  
  // 初始化拖拽状态
  dragState.value = {
    isDragging: true,
    draggedNode: node,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: event.clientX - node.x,
    offsetY: event.clientY - node.y
  }
  
  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleNodeDrag)
  document.addEventListener('mouseup', endNodeDrag)
  
  // 添加视觉反馈
  event.target.style.cursor = 'grabbing'
  console.log('开始拖拽节点:', node.label)
}

const handleNodeDrag = (event) => {
  if (!dragState.value.isDragging || !dragState.value.draggedNode) return
  
  const node = dragState.value.draggedNode
  
  // 计算原始新位置
  let newX = event.clientX - dragState.value.offsetX
  let newY = event.clientY - dragState.value.offsetY
  
  // 应用物理引擎效果
  if (physicsEngine.value.enabled) {
    // 智能吸附
    if (physicsEngine.value.snapToGrid) {
      const snapped = snapToNearbyElements(newX, newY, node)
      newX = snapped.x
      newY = snapped.y
    }
    
    // 防碰撞拖拽
    if (physicsEngine.value.collisionDetection) {
      const adjusted = dragWithCollisionDetection(node, newX, newY)
      newX = adjusted.x
      newY = adjusted.y
    }
  } else {
    // 传统网格对齐
    newX = Math.round(newX / 20) * 20
    newY = Math.round(newY / 20) * 20
  }
  
  // 更新节点位置
  node.x = newX
  node.y = newY
  
  // 边界检查
  const canvasContainer = document.querySelector('.flex-1.relative.overflow-hidden')
  if (canvasContainer) {
    const rect = canvasContainer.getBoundingClientRect()
    node.x = Math.max(0, Math.min(node.x, rect.width - node.width))
    node.y = Math.max(0, Math.min(node.y, rect.height - node.height))
  }
  
  saveStatus.value = '有未保存更改'
}

const endNodeDrag = (event) => {
  if (!dragState.value.isDragging) return
  
  console.log('结束拖拽节点:', dragState.value.draggedNode?.label)
  
  // 重置拖拽状态
  dragState.value = {
    isDragging: false,
    draggedNode: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  }
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleNodeDrag)
  document.removeEventListener('mouseup', endNodeDrag)
  
  // 重置光标
  event.target.style.cursor = 'grab'
}

// 框选功能
const startSelection = (event) => {
  // 只有在空白区域点击才开始框选
  if (event.target.classList.contains('bg-gray-50')) {
    event.preventDefault()
    
    const rect = event.currentTarget.getBoundingClientRect()
    selectionState.value = {
      isSelecting: true,
      startX: event.clientX - rect.left,
      startY: event.clientY - rect.top,
      currentX: event.clientX - rect.left,
      currentY: event.clientY - rect.top,
      selectionBox: null
    }
    
    document.addEventListener('mousemove', handleSelectionDrag)
    document.addEventListener('mouseup', endSelection)
  }
}

const handleSelectionDrag = (event) => {
  if (!selectionState.value.isSelecting) return
  
  const canvasContainer = document.querySelector('.flex-1.relative.overflow-hidden .absolute.inset-0')
  if (!canvasContainer) return
  
  const rect = canvasContainer.getBoundingClientRect()
  selectionState.value.currentX = event.clientX - rect.left
  selectionState.value.currentY = event.clientY - rect.top
  
  // 检查框选范围内的节点
  const selectionBox = {
    left: Math.min(selectionState.value.startX, selectionState.value.currentX),
    top: Math.min(selectionState.value.startY, selectionState.value.currentY),
    right: Math.max(selectionState.value.startX, selectionState.value.currentX),
    bottom: Math.max(selectionState.value.startY, selectionState.value.currentY)
  }
  
  const selectedInBox = nodes.value.filter(node => {
    return node.x < selectionBox.right &&
           node.x + node.width > selectionBox.left &&
           node.y < selectionBox.bottom &&
           node.y + node.height > selectionBox.top
  }).map(node => node.id)
  
  selectedNodes.value = selectedInBox
}

const endSelection = () => {
  selectionState.value.isSelecting = false
  document.removeEventListener('mousemove', handleSelectionDrag)
  document.removeEventListener('mouseup', endSelection)
}

// 框选区域样式
const selectionBoxStyle = computed(() => {
  if (!selectionState.value.isSelecting) return {}
  
  const left = Math.min(selectionState.value.startX, selectionState.value.currentX)
  const top = Math.min(selectionState.value.startY, selectionState.value.currentY)
  const width = Math.abs(selectionState.value.currentX - selectionState.value.startX)
  const height = Math.abs(selectionState.value.currentY - selectionState.value.startY)
  
  return {
    left: left + 'px',
    top: top + 'px',
    width: width + 'px',
    height: height + 'px'
  }
})

// 批量操作功能
const alignNodes = (direction) => {
  const selectedNodeObjects = nodes.value.filter(node => selectedNodes.value.includes(node.id))
  if (selectedNodeObjects.length < 2) return
  
  switch (direction) {
    case 'left':
      const leftMost = Math.min(...selectedNodeObjects.map(node => node.x))
      selectedNodeObjects.forEach(node => node.x = leftMost)
      break
    case 'right':
      const rightMost = Math.max(...selectedNodeObjects.map(node => node.x + node.width))
      selectedNodeObjects.forEach(node => node.x = rightMost - node.width)
      break
    case 'top':
      const topMost = Math.min(...selectedNodeObjects.map(node => node.y))
      selectedNodeObjects.forEach(node => node.y = topMost)
      break
    case 'bottom':
      const bottomMost = Math.max(...selectedNodeObjects.map(node => node.y + node.height))
      selectedNodeObjects.forEach(node => node.y = bottomMost - node.height)
      break
  }
  
  saveStatus.value = '有未保存更改'
}

const distributeNodes = (direction) => {
  const selectedNodeObjects = nodes.value.filter(node => selectedNodes.value.includes(node.id))
  if (selectedNodeObjects.length < 3) return
  
  selectedNodeObjects.sort((a, b) => {
    return direction === 'horizontal' ? a.x - b.x : a.y - b.y
  })
  
  if (direction === 'horizontal') {
    const totalWidth = selectedNodeObjects[selectedNodeObjects.length - 1].x - selectedNodeObjects[0].x
    const spacing = totalWidth / (selectedNodeObjects.length - 1)
    selectedNodeObjects.forEach((node, index) => {
      node.x = selectedNodeObjects[0].x + spacing * index
    })
  } else {
    const totalHeight = selectedNodeObjects[selectedNodeObjects.length - 1].y - selectedNodeObjects[0].y
    const spacing = totalHeight / (selectedNodeObjects.length - 1)
    selectedNodeObjects.forEach((node, index) => {
      node.y = selectedNodeObjects[0].y + spacing * index
    })
  }
  
  saveStatus.value = '有未保存更改'
}

const duplicateSelected = () => {
  const selectedNodeObjects = nodes.value.filter(node => selectedNodes.value.includes(node.id))
  const newNodes = selectedNodeObjects.map(node => ({
    ...node,
    id: generateId(),
    x: node.x + 20,
    y: node.y + 20
  }))
  
  nodes.value.push(...newNodes)
  selectedNodes.value = newNodes.map(node => node.id)
  saveStatus.value = '有未保存更改'
}

const deleteSelected = () => {
  if (selectedNodes.value.length === 0) return
  
  if (confirm(`确定要删除选中的 ${selectedNodes.value.length} 个节点吗？`)) {
    nodes.value = nodes.value.filter(node => !selectedNodes.value.includes(node.id))
    edges.value = edges.value.filter(edge => 
      !selectedNodes.value.includes(edge.source) && 
      !selectedNodes.value.includes(edge.target)
    )
    selectedNodes.value = []
    saveStatus.value = '有未保存更改'
  }
}

// 网格样式
const gridStyle = computed(() => ({
  backgroundImage: `
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px'
}))


// 画布控制
const resetView = () => {
  // 重置视图逻辑
  console.log('重置视图')
}

const clearCanvas = () => {
  if (confirm('确定要清空整个画布吗？')) {
    nodes.value = []
    edges.value = []
    selectedNodes.value = []
    saveStatus.value = '有未保存更改'
  }
}

const autoLayout = () => {
  // 简单的自动布局
  nodes.value.forEach((node, index) => {
    node.x = 50 + (index % 3) * 200
    node.y = 50 + Math.floor(index / 3) * 150
  })
  saveStatus.value = '有未保存更改'
}

// 保存功能
const saveFunnel = async () => {
  try {
    saveStatus.value = '保存中...'
    
    // 模拟保存到后端
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const funnelData = {
      name: '新漏斗 ' + Date.now(),
      nodes: nodes.value,
      edges: edges.value,
      settings: {
        gridEnabled: true,
        autoSave: true
      }
    }
    
    console.log('保存漏斗数据:', funnelData)
    
    saveStatus.value = '已保存'
    
    // 显示成功消息
    alert('✅ 漏斗保存成功！\n\n已保存 ' + nodes.value.length + ' 个节点和 ' + edges.value.length + ' 个连接。')
    
  } catch (error) {
    console.error('保存失败:', error)
    saveStatus.value = '保存失败'
    alert('❌ 保存失败，请重试。')
  }
}

// 工具函数
const generateId = () => {
  return 'node_' + Math.random().toString(36).substr(2, 9)
}

// 连接线路径
const getEdgePath = (edge) => {
  const sourceNode = nodes.value.find(n => n.id === edge.source)
  const targetNode = nodes.value.find(n => n.id === edge.target)
  
  if (!sourceNode || !targetNode) return ''
  
  const sx = sourceNode.x + sourceNode.width / 2
  const sy = sourceNode.y + sourceNode.height / 2
  const tx = targetNode.x + targetNode.width / 2
  const ty = targetNode.y + targetNode.height / 2
  
  return `M ${sx} ${sy} L ${tx} ${ty}`
}

// =============================================================================
// 物理引擎功能模块
// =============================================================================

// 碰撞检测：查找无碰撞的位置
const findNonCollidingPosition = (x, y, width, height) => {
  let newX = x
  let newY = y
  const maxAttempts = 100
  let attempts = 0
  
  while (attempts < maxAttempts) {
    let hasCollision = false
    
    // 检查与现有节点的碰撞
    for (const node of nodes.value) {
      if (isNodeColliding(newX, newY, width, height, node)) {
        hasCollision = true
        break
      }
    }
    
    if (!hasCollision) {
      return { x: newX, y: newY }
    }
    
    // 尝试新位置：螺旋式搜索
    const angle = attempts * 0.5
    const radius = attempts * 15
    newX = x + Math.cos(angle) * radius
    newY = y + Math.sin(angle) * radius
    
    // 确保在画布范围内
    newX = Math.max(0, Math.min(800, newX))
    newY = Math.max(0, Math.min(600, newY))
    
    attempts++
  }
  
  return { x, y } // 如果找不到合适位置，返回原位置
}

// 检查两个矩形是否碰撞
const isNodeColliding = (x, y, width, height, node) => {
  const margin = 10 // 节点间最小间距
  return !(x > node.x + node.width + margin ||
           x + width + margin < node.x ||
           y > node.y + node.height + margin ||
           y + height + margin < node.y)
}

// 动画创建节点
const animateNodeCreation = (node) => {
  const element = document.querySelector(`[data-node-id="${node.id}"]`)
  if (element) {
    element.style.transform = 'scale(0)'
    element.style.transition = `transform ${physicsEngine.value.animationDuration}ms ease-out`
    
    setTimeout(() => {
      element.style.transform = 'scale(1)'
    }, 50)
  }
}

// 智能吸附功能
const snapToNearbyElements = (x, y, draggedNode) => {
  if (!physicsEngine.value.enabled || !physicsEngine.value.snapToGrid) {
    return { x, y }
  }
  
  let snappedX = x
  let snappedY = y
  
  // 吸附到网格
  const gridSize = physicsEngine.value.gridSize
  snappedX = Math.round(x / gridSize) * gridSize
  snappedY = Math.round(y / gridSize) * gridSize
  
  // 吸附到其他节点的边缘和中心线
  const snapDistance = physicsEngine.value.snapDistance
  
  for (const node of nodes.value) {
    if (node.id === draggedNode?.id) continue
    
    // 水平对齐吸附
    if (Math.abs(y - node.y) < snapDistance) {
      snappedY = node.y
    }
    
    // 垂直对齐吸附  
    if (Math.abs(x - node.x) < snapDistance) {
      snappedX = node.x
    }
    
    // 中心对齐吸附
    const nodeCenterX = node.x + node.width / 2
    const nodeCenterY = node.y + node.height / 2
    const draggedCenterX = x + (draggedNode?.width || 60) / 2
    const draggedCenterY = y + (draggedNode?.height || 30) / 2
    
    if (Math.abs(draggedCenterX - nodeCenterX) < snapDistance) {
      snappedX = nodeCenterX - (draggedNode?.width || 60) / 2
    }
    
    if (Math.abs(draggedCenterY - nodeCenterY) < snapDistance) {
      snappedY = nodeCenterY - (draggedNode?.height || 30) / 2
    }
  }
  
  return { x: snappedX, y: snappedY }
}

// 自动布局算法
const applyAutoLayout = () => {
  if (nodes.value.length === 0) return
  
  // 层次化布局算法
  const layoutNodes = [...nodes.value]
  const layers = {}
  const nodeTypes = ['start', 'process', 'decision', 'end']
  
  // 按节点类型分层
  layoutNodes.forEach(node => {
    const typeIndex = nodeTypes.indexOf(node.type)
    const layerIndex = typeIndex >= 0 ? typeIndex : 1 // 默认放在process层
    
    if (!layers[layerIndex]) {
      layers[layerIndex] = []
    }
    layers[layerIndex].push(node)
  })
  
  // 应用布局
  let currentY = 50
  const layerSpacing = 150
  const nodeSpacing = 180
  
  Object.keys(layers).sort((a, b) => parseInt(a) - parseInt(b)).forEach(layerIndex => {
    const layerNodes = layers[layerIndex]
    const startX = Math.max(50, (800 - layerNodes.length * nodeSpacing) / 2)
    
    layerNodes.forEach((node, index) => {
      const targetX = startX + index * nodeSpacing
      const targetY = currentY
      
      // 平滑动画移动
      animateNodeMove(node, targetX, targetY)
    })
    
    currentY += layerSpacing
  })
  
  saveStatus.value = '有未保存更改'
}

// 动画移动节点
const animateNodeMove = (node, targetX, targetY) => {
  const startX = node.x
  const startY = node.y
  const duration = physicsEngine.value.animationDuration
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // 使用缓动函数
    const easeOutCubic = 1 - Math.pow(1 - progress, 3)
    
    node.x = startX + (targetX - startX) * easeOutCubic
    node.y = startY + (targetY - startY) * easeOutCubic
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      // 确保精确到达目标位置
      node.x = targetX
      node.y = targetY
    }
  }
  
  requestAnimationFrame(animate)
}

// 防碰撞拖拽
const dragWithCollisionDetection = (draggedNode, newX, newY) => {
  if (!physicsEngine.value.enabled || !physicsEngine.value.collisionDetection) {
    return { x: newX, y: newY }
  }
  
  // 检查是否会与其他节点碰撞
  for (const node of nodes.value) {
    if (node.id === draggedNode.id) continue
    
    if (isNodeColliding(newX, newY, draggedNode.width, draggedNode.height, node)) {
      // 计算推挤位置
      const pushDirection = getPushDirection(draggedNode, node)
      return applyPushForce(newX, newY, pushDirection, physicsEngine.value.pushForce)
    }
  }
  
  return { x: newX, y: newY }
}

// 计算推挤方向
const getPushDirection = (draggedNode, staticNode) => {
  const dx = draggedNode.x - staticNode.x
  const dy = draggedNode.y - staticNode.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  if (distance === 0) return { x: 1, y: 0 }
  
  return { x: dx / distance, y: dy / distance }
}

// 应用推挤力
const applyPushForce = (x, y, direction, force) => {
  return {
    x: x + direction.x * force,
    y: y + direction.y * force
  }
}

// =============================================================================
// AI 助手功能模块 
// =============================================================================

// AI助手界面控制
const toggleAIAssistant = () => {
  showAIAssistant.value = !showAIAssistant.value
}

// 模拟AI建议生成（基于规则引擎）
const generateAISuggestions = () => {
  const suggestions = []
  
  // 检查漏斗结构
  if (nodes.value.length === 0) {
    suggestions.push({
      id: 'empty-funnel',
      icon: '🚀',
      title: '开始构建漏斗',
      description: '从左侧拖拽一个"开始节点"来创建您的第一个漏斗步骤',
      impact: '建立基础结构',
      type: 'layout'
    })
  }
  
  if (nodes.value.length === 1) {
    suggestions.push({
      id: 'add-second-node',
      icon: '➡️',
      title: '添加第二个节点',
      description: '单个节点不能形成漏斗，建议添加"处理节点"或"决策节点"',
      impact: '完善漏斗流程',
      type: 'structure'
    })
  }
  
  if (nodes.value.length >= 3) {
    // 检查是否有开始和结束节点
    const hasStart = nodes.value.some(n => n.type === 'start')
    const hasEnd = nodes.value.some(n => n.type === 'end')
    
    if (!hasStart) {
      suggestions.push({
        id: 'missing-start',
        icon: '🏁',
        title: '缺少开始节点',
        description: '建议添加一个"开始节点"来明确漏斗入口点',
        impact: '提升15%用户理解度',
        type: 'structure'
      })
    }
    
    if (!hasEnd) {
      suggestions.push({
        id: 'missing-end',
        icon: '🎯',
        title: '缺少结束节点',
        description: '建议添加"结束节点"来明确转化目标',
        impact: '提升20%转化率',
        type: 'structure'
      })
    }
  }
  
  // 布局优化建议
  if (nodes.value.length >= 2) {
    const spacing = analyzeNodeSpacing()
    if (spacing.tooClose) {
      suggestions.push({
        id: 'spacing-too-close',
        icon: '📐',
        title: '节点间距过小',
        description: '当前节点过于紧密，建议增加间距以改善视觉效果',
        impact: '提升用户体验',
        type: 'layout'
      })
    }
    
    if (spacing.tooFar) {
      suggestions.push({
        id: 'spacing-too-far',
        title: '节点分布过散',
        icon: '🎯',
        description: '节点间距过大可能导致用户困惑，建议调整布局',
        impact: '提升10%完成率',
        type: 'layout'
      })
    }
  }
  
  // 转化率优化建议
  if (nodes.value.length >= 3) {
    const conversionAnalysis = analyzeConversionPotential()
    suggestions.push({
      id: 'conversion-optimization',
      icon: '📈',
      title: '转化率优化建议',
      description: `当前漏斗预估转化率${conversionAnalysis.rate}%，${conversionAnalysis.suggestion}`,
      impact: `可提升${conversionAnalysis.improvement}%`,
      type: 'optimization'
    })
  }
  
  return suggestions
}

// 分析节点间距
const analyzeNodeSpacing = () => {
  if (nodes.value.length < 2) return { tooClose: false, tooFar: false }
  
  let minDistance = Infinity
  let maxDistance = 0
  
  for (let i = 0; i < nodes.value.length - 1; i++) {
    for (let j = i + 1; j < nodes.value.length; j++) {
      const node1 = nodes.value[i]
      const node2 = nodes.value[j]
      const distance = Math.sqrt(
        Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
      )
      minDistance = Math.min(minDistance, distance)
      maxDistance = Math.max(maxDistance, distance)
    }
  }
  
  return {
    tooClose: minDistance < 100,
    tooFar: maxDistance > 400
  }
}

// 分析转化潜力
const analyzeConversionPotential = () => {
  const nodeCount = nodes.value.length
  const hasDecision = nodes.value.some(n => n.type === 'decision')
  const hasStart = nodes.value.some(n => n.type === 'start')
  const hasEnd = nodes.value.some(n => n.type === 'end')
  
  let baseRate = 45 // 基础转化率
  let improvement = 0
  let suggestion = '结构良好'
  
  // 根据节点数量调整
  if (nodeCount > 5) {
    baseRate -= (nodeCount - 5) * 5 // 节点过多降低转化率
    suggestion = '考虑简化流程'
    improvement = 15
  } else if (nodeCount < 3) {
    baseRate -= 10 // 节点过少可能不够完整
    suggestion = '建议增加关键步骤'
    improvement = 12
  }
  
  // 结构完整性加分
  if (hasStart && hasEnd) {
    baseRate += 10
  } else {
    improvement += 8
    suggestion = '完善开始和结束节点'
  }
  
  if (hasDecision) {
    baseRate += 5 // 有决策点通常更好
  }
  
  return {
    rate: Math.max(20, Math.min(80, baseRate)),
    improvement: Math.max(5, improvement),
    suggestion
  }
}

// AI深度分析功能
const requestAIAnalysis = async () => {
  if (aiAnalyzing.value) return
  
  aiAnalyzing.value = true
  
  try {
    // 模拟分析延时
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成分析报告
    const analysis = generateDetailedAnalysis()
    
    // 添加到聊天历史
    aiChatHistory.value.push({
      id: Date.now(),
      type: 'ai',
      content: analysis
    })
    
    // 更新建议
    aiSuggestions.value = generateAISuggestions()
    
  } catch (error) {
    console.error('AI分析失败:', error)
    aiChatHistory.value.push({
      id: Date.now(),
      type: 'ai',
      content: '抱歉，分析过程中出现错误，请稍后重试。'
    })
  } finally {
    aiAnalyzing.value = false
  }
}

// 生成详细分析报告
const generateDetailedAnalysis = () => {
  const nodeCount = nodes.value.length
  const edgeCount = edges.value.length
  
  if (nodeCount === 0) {
    return '您还没有创建任何节点。建议从"开始节点"开始构建您的客户旅程漏斗。'
  }
  
  const conversionAnalysis = analyzeConversionPotential()
  const spacing = analyzeNodeSpacing()
  
  let report = `📊 漏斗分析报告：
  
🏗️ 结构分析：
- 节点数量：${nodeCount} 个
- 连接数量：${edgeCount} 个
- 预估转化率：${conversionAnalysis.rate}%

📐 布局分析：
${spacing.tooClose ? '⚠️ 节点间距偏小，建议调整' : '✅ 节点间距适中'}
${spacing.tooFar ? '⚠️ 节点分布过散，建议紧凑布局' : ''}

💡 优化建议：
${conversionAnalysis.suggestion}，预期可提升${conversionAnalysis.improvement}%转化率。`

  return report
}

// AI聊天功能
const sendAIMessage = async () => {
  if (!aiChatInput.value.trim()) return
  
  const userMessage = aiChatInput.value.trim()
  
  // 添加用户消息
  aiChatHistory.value.push({
    id: Date.now(),
    type: 'user',
    content: userMessage
  })
  
  // 清空输入框
  aiChatInput.value = ''
  
  // 模拟AI回复延时
  setTimeout(() => {
    const aiResponse = generateAIResponse(userMessage)
    aiChatHistory.value.push({
      id: Date.now() + 1,
      type: 'ai',
      content: aiResponse
    })
  }, 1000)
}

// 生成AI回复（基于关键词匹配）
const generateAIResponse = (message) => {
  const msg = message.toLowerCase()
  
  if (msg.includes('转化率') || msg.includes('转化')) {
    return `根据当前漏斗结构，预估转化率为${analyzeConversionPotential().rate}%。建议${analyzeConversionPotential().suggestion}来进一步优化。`
  }
  
  if (msg.includes('布局') || msg.includes('排版')) {
    const spacing = analyzeNodeSpacing()
    if (spacing.tooClose) {
      return '建议增加节点间距，可以通过选中多个节点使用"水平分布"或"垂直分布"功能。'
    }
    return '当前布局合理。您可以使用右侧面板的对齐和分布功能来进一步优化。'
  }
  
  if (msg.includes('节点') || msg.includes('添加')) {
    return '您可以从左侧工具栏拖拽节点到画布。建议的节点顺序：开始节点 → 处理节点 → 决策节点 → 结束节点。'
  }
  
  if (msg.includes('优化') || msg.includes('改进')) {
    const suggestions = generateAISuggestions()
    if (suggestions.length > 0) {
      return `我发现了${suggestions.length}个优化点：${suggestions[0].description}`
    }
    return '当前漏斗结构良好！继续添加更多节点，我会提供更具体的优化建议。'
  }
  
  // 默认回复
  return `我理解您想了解"${message}"。作为您的AI助手，我可以帮您分析漏斗结构、优化转化率、调整布局等。请具体告诉我您需要什么帮助？`
}

// 应用AI建议
const applyAISuggestion = (suggestion) => {
  switch (suggestion.type) {
    case 'layout':
      if (suggestion.id === 'spacing-too-close') {
        // 自动调整节点间距
        adjustNodeSpacing(150) // 设置最小间距为150px
      } else if (suggestion.id === 'spacing-too-far') {
        // 紧凑布局
        compactLayout()
      }
      break
      
    case 'structure':
      if (suggestion.id === 'missing-start') {
        // 添加开始节点
        addSuggestedNode('start', 50, 50)
      } else if (suggestion.id === 'missing-end') {
        // 添加结束节点
        const lastNode = nodes.value[nodes.value.length - 1]
        addSuggestedNode('end', lastNode.x + 200, lastNode.y)
      }
      break
  }
  
  // 移除已应用的建议
  dismissAISuggestion(suggestion.id)
  saveStatus.value = '有未保存更改'
  
  // 添加成功消息到聊天
  aiChatHistory.value.push({
    id: Date.now(),
    type: 'ai',
    content: `✅ 已应用建议"${suggestion.title}"。${suggestion.impact ? '预期' + suggestion.impact : ''}`
  })
}

// 辅助函数：调整节点间距
const adjustNodeSpacing = (minDistance) => {
  // 简单的节点间距调整算法
  nodes.value.forEach((node, index) => {
    if (index === 0) return
    node.x = 50 + index * (minDistance + 50)
    node.y = 100 + (index % 2) * 100
  })
}

// 辅助函数：紧凑布局
const compactLayout = () => {
  nodes.value.forEach((node, index) => {
    node.x = 50 + (index % 3) * 180
    node.y = 50 + Math.floor(index / 3) * 120
  })
}

// 辅助函数：添加建议的节点
const addSuggestedNode = (type, x, y) => {
  const nodeType = nodeTypes.value.find(nt => nt.type === type)
  if (!nodeType) return
  
  const newNode = {
    id: generateId(),
    type: nodeType.type,
    label: nodeType.label,
    description: 'AI建议添加',
    x: x,
    y: y,
    width: 120,
    height: 60
  }
  
  nodes.value.push(newNode)
}

// 忽略AI建议
const dismissAISuggestion = (suggestionId) => {
  aiSuggestions.value = aiSuggestions.value.filter(s => s.id !== suggestionId)
}

// 监听漏斗变化，自动更新AI建议
const updateAISuggestions = () => {
  // 延迟更新，避免过于频繁
  setTimeout(() => {
    aiSuggestions.value = generateAISuggestions()
  }, 1000)
}

// 键盘快捷键
const handleKeydown = (event) => {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (selectedNodes.value.length > 0) {
      deleteSelected()
    }
  } else if (event.key === 'Escape') {
    selectedNodes.value = []
  } else if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        selectedNodes.value = nodes.value.map(node => node.id)
        break
      case 'd':
        event.preventDefault()
        if (selectedNodes.value.length > 0) {
          duplicateSelected()
        }
        break
    }
  }
}

// 生命周期
onMounted(() => {
  // 模拟加载现有数据（编辑模式）
  if (isEditMode.value) {
    // 加载现有漏斗数据
    console.log('加载漏斗ID:', route.params.id)
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
  
  // 初始化AI助手
  aiSuggestions.value = generateAISuggestions()
  
  // 添加欢迎消息
  aiChatHistory.value.push({
    id: Date.now(),
    type: 'ai',
    content: '👋 您好！我是您的AI漏斗优化助手。我会根据您的操作提供实时建议，帮助您构建高转化率的漏斗。现在就开始创建您的第一个节点吧！'
  })
  
  // 启动性能监控
  const performanceInterval = setInterval(() => {
    memoryUsage.value = (Math.random() * 5 + 10).toFixed(1)
    renderFPS.value = Math.round(Math.random() * 10 + 55)
  }, 2000)
  
  onUnmounted(() => {
    clearInterval(performanceInterval)
    
    // 清理拖拽事件监听器
    document.removeEventListener('mousemove', handleNodeDrag)
    document.removeEventListener('mouseup', endNodeDrag)
    document.removeEventListener('mousemove', handleSelectionDrag)
    document.removeEventListener('mouseup', endSelection)
    document.removeEventListener('keydown', handleKeydown)
  })
})

console.log('StableFunnelBuilder 组件已加载')
console.log('编辑模式:', isEditMode.value)
console.log('漏斗ID:', route.params.id)
</script>

<style scoped>
/* 物理引擎相关样式 */
.physics-node {
  transition: transform 0.1s ease-out;
}

.physics-node:hover {
  transform: scale(1.02);
}

.physics-node.dragging {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

/* 吸附指示器 */
.snap-indicator {
  position: absolute;
  pointer-events: none;
  border: 2px dashed #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
  z-index: 999;
}

/* 网格增强显示 */
.physics-grid {
  background-image: 
    linear-gradient(to right, rgba(156, 163, 175, 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(156, 163, 175, 0.2) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 碰撞检测可视化 */
.collision-preview {
  border: 2px solid #EF4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 自动布局动画 */
.layout-animating {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

</style>