<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <!-- 顶部工具栏 -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link to="/funnels" class="text-gray-500 hover:text-gray-700">
            ← 返回漏斗列表
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900">漏斗构建器</h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <button @click="saveFunnel" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            保存漏斗
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
          <button v-for="nodeType in nodeTypes" :key="nodeType.type"
                  @click="addNode(nodeType)"
                  class="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div class="font-medium text-gray-900">{{ nodeType.label }}</div>
            <div class="text-sm text-gray-600">{{ nodeType.description }}</div>
          </button>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="flex-1 p-6">
        <!-- 画布工具栏 -->
        <div class="bg-white rounded-t-lg shadow border-b px-4 py-2 flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button @click="toggleConnectionMode" 
                    :class="[
                      'px-3 py-1 text-sm rounded',
                      isConnecting ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]">
              {{ isConnecting ? '✓ 连接模式' : '🔗 连接模式' }}
            </button>
            
            <div class="text-sm text-gray-500">|
            </div>
            
            <button @click="zoomIn" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded">
              🔍+ 放大
            </button>
            <button @click="zoomOut" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded">
              🔍- 缩小
            </button>
            <button @click="resetZoom" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded">
              ↻ 重置
            </button>
          </div>
          
          <div class="text-sm text-gray-500">
            缩放: {{ Math.round(zoom * 100) }}% | 节点: {{ nodes.length }} | 连接: {{ connections.length }}
          </div>
        </div>
        
        <div class="bg-white rounded-b-lg shadow h-full overflow-hidden relative" 
             @wheel="handleZoom"
             @mousedown="startPan"
             ref="canvasContainer">
          <div class="absolute inset-0 bg-gray-50" 
               :style="canvasStyle"
               @click="handleCanvasClick">
          
            <!-- 节点渲染 -->
          <div v-for="node in nodes" :key="node.id" 
               :style="nodeStyle(node)"
               @mousedown="startNodeDrag($event, node)"
               @click="handleNodeClick($event, node)"
               class="absolute p-3 bg-blue-50 border border-blue-200 rounded cursor-grab select-none hover:shadow-md transition-shadow"
               :class="{ 'ring-2 ring-blue-500': selectedNode?.id === node.id }">
            <div class="font-medium">{{ node.label }}</div>
            <div class="text-sm text-gray-600">{{ node.type }}</div>
            
            <!-- 连接锚点 -->
            <div v-if="isConnecting" class="absolute -inset-2">
              <div v-for="anchor in getNodeAnchors(node)" :key="anchor.position"
                   :style="anchor.style"
                   @click.stop="handleAnchorClick($event, node.id, anchor.position)"
                   class="absolute w-3 h-3 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transform -translate-x-1/2 -translate-y-1/2">
              </div>
            </div>
            
            <button @click.stop="removeNode(node.id)" 
                    class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center">
              ×
            </button>
          </div>
          
          <!-- 连接线 -->
          <svg class="absolute inset-0 pointer-events-none" style="z-index: 1">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
              </marker>
            </defs>
            <path v-for="connection in connections" :key="connection.id"
                  :d="getConnectionPath(connection)"
                  stroke="#4B5563" stroke-width="2" fill="none"
                  marker-end="url(#arrowhead)" />
          </svg>
          
          <!-- 临时连接线 -->
          <svg v-if="tempConnection" class="absolute inset-0 pointer-events-none" style="z-index: 2">
            <path :d="tempConnection.path"
                  stroke="#3B82F6" stroke-width="2" fill="none"
                  stroke-dasharray="5,5" />
          </svg>
          
            <div v-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center text-gray-500">
            <div class="text-center">
              <div class="text-lg mb-2">📝 拖拽节点到画布开始构建</div>
              <div class="text-sm">或点击左侧节点类型来添加</div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-80 bg-white border-l border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">属性面板</h3>
        
        <!-- 选中节点属性 -->
        <div v-if="selectedNode" class="mb-6 p-3 bg-blue-50 rounded-lg">
          <h4 class="font-medium text-blue-900 mb-3">节点属性</h4>
          <div class="space-y-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input v-model="selectedNode.label" type="text"
                     class="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select v-model="selectedNode.type"
                      class="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500">
                <option v-for="type in nodeTypes" :key="type.type" :value="type.type">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>X: {{ Math.round(selectedNode.x) }}</div>
              <div>Y: {{ Math.round(selectedNode.y) }}</div>
            </div>
          </div>
        </div>
        
        <!-- 连接模式提示 -->
        <div v-if="isConnecting" class="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center space-x-2 text-green-700">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="font-medium">连接模式激活</span>
          </div>
          <div class="text-sm text-green-600 mt-1">
            点击节点边缘的蓝色锚点创建连接
          </div>
          <div v-if="connectingFrom" class="text-xs text-green-600 mt-1">
            从 {{ nodes.find(n => n.id === connectingFrom.nodeId)?.label }} 开始连接...
          </div>
        </div>
        
        <!-- 画布统计 -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 mb-2">画布统计</h4>
          <div class="space-y-1 text-sm text-gray-600">
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
          </div>
        </div>
        
        <!-- 连接列表 -->
        <div v-if="connections.length > 0" class="mb-6">
          <h4 class="font-medium text-gray-900 mb-2">连接列表</h4>
          <div class="max-h-32 overflow-y-auto space-y-1">
            <div v-for="connection in connections" :key="connection.id"
                 class="text-xs p-2 bg-gray-50 rounded flex items-center justify-between">
              <div class="flex-1">
                <div>{{ nodes.find(n => n.id === connection.from)?.label || 'Unknown' }}</div>
                <div class="text-gray-500">↓ {{ nodes.find(n => n.id === connection.to)?.label || 'Unknown' }}</div>
              </div>
              <button @click="removeConnection(connection.id)" 
                      class="text-red-500 hover:text-red-700 ml-2">
                ×
              </button>
            </div>
          </div>
        </div>
        
        <!-- 快捷操作 -->
        <div>
          <h4 class="font-medium text-gray-900 mb-2">快捷操作</h4>
          <div class="space-y-2 text-sm">
            <button @click="clearAll" 
                    class="w-full px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded">
              🗑️ 清空画布
            </button>
            <div class="text-xs text-gray-500 space-y-1">
              <div>• 拖拽节点移动位置</div>
              <div>• 滚轮缩放画布</div>
              <div>• 拖拽空白区域平移</div>
              <div>• 连接模式下点击蓝色锚点</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 节点类型
const nodeTypes = ref([
  {
    type: 'start',
    label: '开始节点',
    description: '流程的起点',
    color: '#10B981'
  },
  {
    type: 'process',
    label: '处理节点', 
    description: '执行特定操作',
    color: '#3B82F6'
  },
  {
    type: 'decision',
    label: '决策节点',
    description: '条件判断分支',
    color: '#F59E0B'
  },
  {
    type: 'end',
    label: '结束节点',
    description: '流程的终点',
    color: '#EF4444'
  }
])

// 节点数据
const nodes = ref([])
const connections = ref([])
const selectedNode = ref(null)
const canvasContainer = ref(null)

// 缩放和移动状态
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)

// 连接状态
const isConnecting = ref(false)
const connectingFrom = ref(null)
const tempConnection = ref(null)

// 节点拖拽状态
const isDragging = ref(false)
const draggedNode = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

// 生成ID
const generateId = () => {
  return 'node_' + Math.random().toString(36).substr(2, 9)
}

// 添加节点
const addNode = (nodeType) => {
  const newNode = {
    id: generateId(),
    type: nodeType.type,
    label: nodeType.label,
    color: nodeType.color,
    x: 100 + nodes.value.length * 30, // 错开布置
    y: 100 + nodes.value.length * 20,
    width: 120,
    height: 60
  }
  nodes.value.push(newNode)
  console.log('添加节点:', newNode)
}

// 删除节点
const removeNode = (nodeId) => {
  nodes.value = nodes.value.filter(node => node.id !== nodeId)
  console.log('删除节点:', nodeId)
}

// 保存漏斗
const saveFunnel = () => {
  console.log('保存漏斗数据:', { nodes: nodes.value })
  alert('✅ 漏斗保存成功！')
}

// 节点样式计算
const nodeStyle = (node) => ({
  left: (node.x * zoom.value + panX.value) + 'px',
  top: (node.y * zoom.value + panY.value) + 'px',
  width: (node.width * zoom.value) + 'px',
  height: (node.height * zoom.value) + 'px',
  transform: `scale(1)` // 保持内容清晰
})

// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale(${zoom.value}) translate(${panX.value / zoom.value}px, ${panY.value / zoom.value}px)`,
  transformOrigin: '0 0',
  width: '100%',
  height: '100%',
  cursor: isPanning.value ? 'grabbing' : 'grab'
}))

// 连接模式切换
const toggleConnectionMode = () => {
  isConnecting.value = !isConnecting.value
  if (!isConnecting.value) {
    connectingFrom.value = null
    tempConnection.value = null
  }
  console.log('连接模式:', isConnecting.value)
}

// 缩放控制
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

// 鼠标滚轮缩放
const handleZoom = (event) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.min(Math.max(zoom.value * delta, 0.3), 3)
  
  const rect = canvasContainer.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // 以鼠标为中心缩放
  const zoomRatio = newZoom / zoom.value
  panX.value = mouseX - (mouseX - panX.value) * zoomRatio
  panY.value = mouseY - (mouseY - panY.value) * zoomRatio
  
  zoom.value = newZoom
}

// 画布移动
const startPan = (event) => {
  if (event.target === event.currentTarget || event.target.classList.contains('bg-gray-50')) {
    isPanning.value = true
    const startX = event.clientX - panX.value
    const startY = event.clientY - panY.value
    
    const handlePanMove = (e) => {
      if (isPanning.value) {
        panX.value = e.clientX - startX
        panY.value = e.clientY - startY
      }
    }
    
    const handlePanEnd = () => {
      isPanning.value = false
      document.removeEventListener('mousemove', handlePanMove)
      document.removeEventListener('mouseup', handlePanEnd)
    }
    
    document.addEventListener('mousemove', handlePanMove)
    document.addEventListener('mouseup', handlePanEnd)
  }
}

// 节点点击和选中
const handleNodeClick = (event, node) => {
  event.stopPropagation()
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
  console.log('选中节点:', node.label)
}

// 节点拖拽
const startNodeDrag = (event, node) => {
  event.preventDefault()
  event.stopPropagation()
  
  isDragging.value = true
  draggedNode.value = node
  selectedNode.value = node
  
  const rect = canvasContainer.value.getBoundingClientRect()
  const mouseX = (event.clientX - rect.left - panX.value) / zoom.value
  const mouseY = (event.clientY - rect.top - panY.value) / zoom.value
  
  dragOffset.value = {
    x: mouseX - node.x,
    y: mouseY - node.y
  }
  
  const handleDragMove = (e) => {
    if (isDragging.value && draggedNode.value) {
      const rect = canvasContainer.value.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - panX.value) / zoom.value
      const mouseY = (e.clientY - rect.top - panY.value) / zoom.value
      
      draggedNode.value.x = mouseX - dragOffset.value.x
      draggedNode.value.y = mouseY - dragOffset.value.y
    }
  }
  
  const handleDragEnd = () => {
    isDragging.value = false
    draggedNode.value = null
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
  }
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

// 画布点击取消选中
const handleCanvasClick = (event) => {
  if (event.target === event.currentTarget || event.target.classList.contains('bg-gray-50')) {
    selectedNode.value = null
    if (isConnecting.value) {
      connectingFrom.value = null
      tempConnection.value = null
    }
  }
}

// 节点连接锚点
const getNodeAnchors = (node) => {
  const anchors = [
    { position: 'top', style: { left: '50%', top: '0' } },
    { position: 'right', style: { left: '100%', top: '50%' } },
    { position: 'bottom', style: { left: '50%', top: '100%' } },
    { position: 'left', style: { left: '0', top: '50%' } }
  ]
  return anchors
}

// 处理锚点点击
const handleAnchorClick = (event, nodeId, position) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (!connectingFrom.value) {
    // 开始连接
    connectingFrom.value = { nodeId, position }
    console.log('开始连接从:', nodeId, position)
  } else if (connectingFrom.value.nodeId !== nodeId) {
    // 完成连接
    const newConnection = {
      id: generateId(),
      from: connectingFrom.value.nodeId,
      fromAnchor: connectingFrom.value.position,
      to: nodeId,
      toAnchor: position
    }
    connections.value.push(newConnection)
    console.log('创建连接:', newConnection)
    
    connectingFrom.value = null
    tempConnection.value = null
  }
}

// 计算连接路径
const getConnectionPath = (connection) => {
  const fromNode = nodes.value.find(n => n.id === connection.from)
  const toNode = nodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode) return ''
  
  const fromPoint = getAnchorPosition(fromNode, connection.fromAnchor)
  const toPoint = getAnchorPosition(toNode, connection.toAnchor)
  
  // 简单直线连接
  return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`
}

// 获取锚点位置
const getAnchorPosition = (node, anchor) => {
  const x = (node.x + (anchor === 'left' ? 0 : anchor === 'right' ? node.width : node.width / 2)) * zoom.value + panX.value
  const y = (node.y + (anchor === 'top' ? 0 : anchor === 'bottom' ? node.height : node.height / 2)) * zoom.value + panY.value
  return { x, y }
}

// 删除连接
const removeConnection = (connectionId) => {
  connections.value = connections.value.filter(c => c.id !== connectionId)
  console.log('删除连接:', connectionId)
}

// 清空画布
const clearAll = () => {
  if (confirm('确定要清空整个画布吗？这将删除所有节点和连接。')) {
    nodes.value = []
    connections.value = []
    selectedNode.value = null
    connectingFrom.value = null
    tempConnection.value = null
    console.log('清空画布完成')
  }
}

console.log('SimpleFunnelBuilder 组件已加载 - 支持连接和缩放')
</script>