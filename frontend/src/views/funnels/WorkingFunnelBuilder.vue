<template>
  <div class="min-h-screen bg-gradient-pathfinder">
    <!-- 顶部工具栏 -->
    <div class="card-pathfinder px-6 py-3 m-2 mb-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link to="/funnels" class="text-gray-500 hover:text-primary-600 transition-colors">
            ← 返回漏斗列表
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900 hero-title">漏斗构建器 v2</h1>
        </div>
        
        <div class="flex items-center space-x-3">
          <button @click="saveFunnel" 
                  class="btn-pathfinder btn-primary-pathfinder">
            保存漏斗
          </button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="flex h-screen">
      <!-- 左侧节点面板 -->
      <div class="w-64 card-pathfinder m-2 mr-0 p-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">节点库</h3>
        
        <div class="space-y-2">
          <button v-for="nodeType in nodeTypes" :key="nodeType.type"
                  @click="addNode(nodeType)"
                  class="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-all hover:shadow-card-hover hover:transform hover:-translate-y-1">
            <div class="font-medium text-gray-900">{{ nodeType.label }}</div>
            <div class="text-sm text-gray-600">{{ nodeType.description }}</div>
          </button>
        </div>
      </div>

      <!-- 中间画布区域 -->
      <div class="flex-1 p-6">
        <!-- 工具栏 -->
        <div class="card-pathfinder mb-4 px-4 py-2 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button @click="toggleConnectionMode" 
                    :class="[
                      'btn-pathfinder px-3 py-2 text-sm font-medium',
                      isConnecting ? 'btn-primary-pathfinder' : 'btn-secondary-pathfinder'
                    ]">
              🔗 {{ isConnecting ? '退出连接模式' : '连接模式' }}
            </button>
            
            <div class="border-l border-gray-300 h-6"></div>
            
            <button @click="zoomIn" class="btn-pathfinder btn-secondary-pathfinder px-3 py-2 text-sm">
              🔍+ 放大
            </button>
            <button @click="zoomOut" class="btn-pathfinder btn-secondary-pathfinder px-3 py-2 text-sm">
              🔍- 缩小  
            </button>
            <button @click="resetZoom" class="btn-pathfinder btn-secondary-pathfinder px-3 py-2 text-sm">
              ↻ 重置
            </button>
          </div>
          
          <div class="text-sm text-gray-600">
            <span v-if="isConnecting && connectingFrom" class="text-green-600 font-medium">
              🔗 连接模式：从 {{ nodes.find(n => n.id === connectingFrom.nodeId)?.label }} 开始，点击目标节点锚点
            </span>
            <span v-else-if="isConnecting" class="text-blue-600 font-medium">
              🔗 连接模式：点击起始节点的蓝色锚点
            </span>
            <span v-else>
              缩放: {{ Math.round(zoom * 100) }}% | 节点: {{ nodes.length }} | 连接: {{ connections.length }}
            </span>
          </div>
        </div>
        
        <!-- 画布 -->
        <div class="card-pathfinder h-96 relative overflow-hidden"
             @wheel="handleZoom"
             @mousedown="startPan"
             ref="canvasContainer">
          
          <!-- 网格背景 -->
          <div class="absolute inset-0" 
               :style="gridBackground"></div>
          
          <div class="absolute inset-0 bg-transparent"
               :style="canvasTransform"
               @click="clearSelection">
            
            <!-- 节点 -->
            <div v-for="node in nodes" :key="node.id"
                 :style="nodeStyle(node)"
                 @mousedown="startNodeDrag($event, node)"
                 @click.stop="selectNode(node)"
                 class="absolute bg-white border-2 rounded-lg p-3 cursor-move shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1"
                 :class="{ 'border-primary-500': selectedNodeId === node.id, 'border-gray-300': selectedNodeId !== node.id }">
              
              <div class="font-medium text-gray-900">{{ node.label }}</div>
              <div class="text-sm text-gray-600">{{ node.type }}</div>
              
              <!-- 连接锚点 -->
              <div v-if="isConnecting" class="absolute -inset-1 pointer-events-none">
                <div v-for="anchor in ['top', 'right', 'bottom', 'left']" :key="anchor"
                     @click.stop="handleAnchorClick(node.id, anchor)"
                     :style="anchorStyle(anchor)"
                     :class="[
                       'absolute w-4 h-4 rounded-full cursor-pointer pointer-events-auto z-10 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg',
                       connectingFrom?.nodeId === node.id && connectingFrom?.anchor === anchor 
                         ? 'bg-green-500 animate-pulse' 
                         : 'bg-blue-500 hover:bg-blue-600'
                     ]">
                </div>
              </div>
              
              <button @click.stop="removeNode(node.id)"
                      class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full hover:bg-red-600 flex items-center justify-center">
                ×
              </button>
            </div>
            
            <!-- 连接线 -->
            <svg class="absolute inset-0 pointer-events-none">
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
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-80 card-pathfinder m-2 ml-0 p-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">属性面板</h3>
        
        <div v-if="selectedNode" class="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 class="font-medium text-blue-900 mb-2">节点属性</h4>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input v-model="selectedNode.label" type="text"
                   class="form-input-pathfinder w-full px-2 py-1 text-sm">
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
        </div>
        
        <div class="mt-6">
          <button @click="clearAll" 
                  class="btn-pathfinder btn-danger-pathfinder w-full px-3 py-2 text-sm">
            🗑️ 清空画布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 数据
const nodeTypes = ref([
  { type: 'start', label: '开始节点', description: '流程起点', color: '#10B981' },
  { type: 'process', label: '处理节点', description: '执行操作', color: '#3B82F6' },
  { type: 'decision', label: '决策节点', description: '条件判断', color: '#F59E0B' },
  { type: 'end', label: '结束节点', description: '流程终点', color: '#EF4444' }
])

const nodes = ref([])
const connections = ref([])
const selectedNodeId = ref(null)
const canvasContainer = ref(null)

// 状态
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const isConnecting = ref(false)
const connectingFrom = ref(null)

// 计算属性
const selectedNode = computed(() => 
  nodes.value.find(n => n.id === selectedNodeId.value)
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
    backgroundPosition: `${panX.value}px ${panY.value}px`
  }
})

// 方法
const generateId = () => 'node_' + Math.random().toString(36).substr(2, 9)

const addNode = (nodeType) => {
  const newNode = {
    id: generateId(),
    type: nodeType.type,
    label: nodeType.label,
    x: 50 + nodes.value.length * 30,
    y: 50 + nodes.value.length * 20,
    width: 120,
    height: 80
  }
  nodes.value.push(newNode)
}

const removeNode = (nodeId) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = null
  }
}

const selectNode = (node) => {
  selectedNodeId.value = selectedNodeId.value === node.id ? null : node.id
}

const clearSelection = () => {
  selectedNodeId.value = null
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
  }
}

const getConnectionPath = (connection) => {
  const fromNode = nodes.value.find(n => n.id === connection.from)
  const toNode = nodes.value.find(n => n.id === connection.to)
  
  if (!fromNode || !toNode) return ''
  
  const fromPoint = getAnchorPosition(fromNode, connection.fromAnchor)
  const toPoint = getAnchorPosition(toNode, connection.toAnchor)
  
  return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`
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
  const rect = canvasContainer.value.getBoundingClientRect()
  const startX = event.clientX
  const startY = event.clientY
  const startNodeX = node.x
  const startNodeY = node.y
  
  const handleMove = (e) => {
    const dx = (e.clientX - startX) / zoom.value
    const dy = (e.clientY - startY) / zoom.value
    node.x = Math.max(0, startNodeX + dx)
    node.y = Math.max(0, startNodeY + dy)
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

const router = useRouter()

const saveFunnel = () => {
  const data = {
    nodes: nodes.value,
    connections: connections.value
  }
  console.log('保存漏斗:', data)
  alert('漏斗保存成功！')
  
  // 检查是否从注册流程进入
  const fromOnboarding = sessionStorage.getItem('onboardingReturn')
  if (fromOnboarding) {
    // 从注册流程进入，设置标记并返回注册流程
    sessionStorage.setItem('onboardingReturnComplete', 'true')
    sessionStorage.removeItem('onboardingReturn')
    router.push('/onboarding')
  } else {
    // 直接跳转到仪表盘
    router.push('/dashboard')
  }
}

console.log('WorkingFunnelBuilder 组件已加载')
</script>