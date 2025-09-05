<template>
  <div class="physics-effects-demo">
    <!-- Header -->
    <div class="demo-header">
      <h1 class="demo-title">
        <BoltIcon class="w-8 h-8 text-blue-500" />
        物理引擎效果演示
      </h1>
      <p class="demo-description">
        Agent 6: 物理引擎集成专家 - 展示高级物理交互效果
      </p>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="control-section">
        <h3 class="section-title">物理配置</h3>
        <div class="control-grid">
          <div class="control-item">
            <label class="control-label">启用物理引擎</label>
            <input
              type="checkbox"
              v-model="physicsConfig.enablePhysics"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">弹性系数</label>
            <input
              type="range"
              v-model.number="physicsConfig.elasticity"
              min="0"
              max="1"
              step="0.1"
              class="control-slider"
            />
            <span class="control-value">{{ physicsConfig.elasticity }}</span>
          </div>
          <div class="control-item">
            <label class="control-label">摩擦系数</label>
            <input
              type="range"
              v-model.number="physicsConfig.friction"
              min="0"
              max="1"
              step="0.1"
              class="control-slider"
            />
            <span class="control-value">{{ physicsConfig.friction }}</span>
          </div>
          <div class="control-item">
            <label class="control-label">质量</label>
            <input
              type="range"
              v-model.number="physicsConfig.mass"
              min="0.1"
              max="5"
              step="0.1"
              class="control-slider"
            />
            <span class="control-value">{{ physicsConfig.mass }}</span>
          </div>
        </div>
      </div>

      <div class="control-section">
        <h3 class="section-title">效果开关</h3>
        <div class="control-grid">
          <div class="control-item">
            <label class="control-label">惯性效果</label>
            <input
              type="checkbox"
              v-model="physicsConfig.enableInertia"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">弹簧动画</label>
            <input
              type="checkbox"
              v-model="physicsConfig.enableSprings"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">碰撞检测</label>
            <input
              type="checkbox"
              v-model="physicsConfig.enableCollisions"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">磁性吸附</label>
            <input
              type="checkbox"
              v-model="physicsConfig.enableMagnetics"
              class="control-checkbox"
            />
          </div>
        </div>
      </div>

      <div class="control-section">
        <h3 class="section-title">调试选项</h3>
        <div class="control-grid">
          <div class="control-item">
            <label class="control-label">显示物理调试</label>
            <input
              type="checkbox"
              v-model="debugConfig.showPhysicsDebug"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">显示力向量</label>
            <input
              type="checkbox"
              v-model="debugConfig.showForceVectors"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">显示磁场线</label>
            <input
              type="checkbox"
              v-model="debugConfig.showMagneticField"
              class="control-checkbox"
            />
          </div>
          <div class="control-item">
            <label class="control-label">性能监控</label>
            <input
              type="checkbox"
              v-model="debugConfig.showPerformanceMetrics"
              class="control-checkbox"
            />
          </div>
        </div>
      </div>

      <div class="control-section">
        <h3 class="section-title">预设场景</h3>
        <div class="preset-buttons">
          <button
            v-for="preset in presetScenarios"
            :key="preset.id"
            @click="loadPreset(preset)"
            class="preset-button"
            :class="{ active: currentPreset === preset.id }"
          >
            <component :is="preset.icon" class="w-5 h-5" />
            {{ preset.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Physics Playground -->
    <div class="physics-playground">
      <div class="playground-header">
        <h3>物理交互演示区域</h3>
        <div class="playground-controls">
          <button @click="addRandomNode" class="action-button">
            <PlusIcon class="w-4 h-4" />
            添加节点
          </button>
          <button @click="clearAllNodes" class="action-button danger">
            <TrashIcon class="w-4 h-4" />
            清除所有
          </button>
          <button @click="resetPhysics" class="action-button">
            <ArrowPathIcon class="w-4 h-4" />
            重置物理
          </button>
        </div>
      </div>

      <!-- SVG Canvas -->
      <svg
        ref="physicsCanvas"
        class="physics-canvas"
        :width="canvasSize.width"
        :height="canvasSize.height"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
      >
        <!-- Background Grid -->
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e5e7eb"
              stroke-width="0.5"
              opacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- Boundary -->
        <rect
          x="10"
          y="10"
          :width="canvasSize.width - 20"
          :height="canvasSize.height - 20"
          fill="none"
          stroke="#3b82f6"
          stroke-width="2"
          stroke-dasharray="5,5"
          opacity="0.5"
        />

        <!-- Magnetic Sources (if enabled) -->
        <g v-if="physicsConfig.enableMagnetics">
          <g
            v-for="source in magneticSources"
            :key="source.id"
            class="magnetic-source"
          >
            <!-- Magnetic Field Visualization -->
            <circle
              v-if="debugConfig.showMagneticField"
              :cx="source.position.x"
              :cy="source.position.y"
              :r="source.range"
              fill="none"
              stroke="#8b5cf6"
              stroke-width="1"
              stroke-opacity="0.3"
              stroke-dasharray="2,2"
            />
            
            <!-- Source Indicator -->
            <circle
              :cx="source.position.x"
              :cy="source.position.y"
              r="8"
              :fill="source.polarity === 'attractive' ? '#3b82f6' : '#ef4444'"
              stroke="white"
              stroke-width="2"
              class="cursor-pointer"
              @mousedown.stop="startDragMagneticSource(source, $event)"
            />
            
            <!-- Field Lines -->
            <g v-if="debugConfig.showMagneticField && source.fieldLines">
              <path
                v-for="(line, index) in source.fieldLines"
                :key="`line-${index}`"
                :d="generateFieldLinePath(line)"
                class="magnetic-field-lines"
              />
            </g>
          </g>
        </g>

        <!-- Physics Nodes -->
        <g class="physics-nodes">
          <g
            v-for="node in physicsNodes"
            :key="node.id"
            class="physics-node"
            :class="{
              'dragging': node.isDragging,
              'throwing': node.animationState === 'throwing',
              'bouncing': node.animationState === 'bouncing',
              'debug': debugConfig.showPhysicsDebug
            }"
            :transform="`translate(${node.visualPosition.x}, ${node.visualPosition.y})`"
            @mousedown.stop="startDragNode(node, $event)"
          >
            <!-- Node Shadow -->
            <circle
              cx="2"
              cy="2"
              r="20"
              fill="rgba(0,0,0,0.1)"
              class="node-shadow"
            />
            
            <!-- Node Body -->
            <circle
              cx="0"
              cy="0"
              r="20"
              :fill="getNodeColor(node)"
              stroke="#ffffff"
              stroke-width="2"
              class="node-body"
            />
            
            <!-- Velocity Vector -->
            <g v-if="debugConfig.showForceVectors && node.velocity && node.velocity.length() > 0">
              <line
                x1="0"
                y1="0"
                :x2="node.velocity.x * 0.2"
                :y2="node.velocity.y * 0.2"
                stroke="#ef4444"
                stroke-width="2"
                marker-end="url(#arrowhead)"
                class="velocity-vector"
              />
            </g>
            
            <!-- Node Label -->
            <text
              x="0"
              y="5"
              text-anchor="middle"
              fill="white"
              font-size="12"
              font-weight="bold"
              class="node-label"
            >
              {{ node.id }}
            </text>
            
            <!-- Debug Info -->
            <g v-if="debugConfig.showPhysicsDebug">
              <text
                x="25"
                y="-15"
                fill="#374151"
                font-size="10"
                font-family="monospace"
                class="debug-text"
              >
                State: {{ node.animationState }}
              </text>
              <text
                x="25"
                y="-5"
                fill="#374151"
                font-size="10"
                font-family="monospace"
                class="debug-text"
              >
                V: {{ node.velocity ? node.velocity.length().toFixed(1) : '0.0' }}
              </text>
              <text
                x="25"
                y="5"
                fill="#374151"
                font-size="10"
                font-family="monospace"
                class="debug-text"
              >
                M: {{ node.config.mass }}
              </text>
            </g>
          </g>
        </g>

        <!-- Arrow marker for vectors -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#ef4444"
            />
          </marker>
        </defs>
      </svg>
    </div>

    <!-- Performance Metrics -->
    <div v-if="debugConfig.showPerformanceMetrics" class="performance-metrics">
      <h3>性能指标</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">FPS</span>
          <span class="metric-value">{{ performanceMetrics.fps.toFixed(1) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">物理时间</span>
          <span class="metric-value">{{ performanceMetrics.physicsTime.toFixed(2) }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">动画时间</span>
          <span class="metric-value">{{ performanceMetrics.animationTime.toFixed(2) }}ms</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">活跃节点</span>
          <span class="metric-value">{{ performanceMetrics.activeNodes }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">内存使用</span>
          <span class="metric-value">{{ (performanceMetrics.memoryUsage / 1024 / 1024).toFixed(1) }}MB</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">质量级别</span>
          <span class="metric-value">{{ performanceMetrics.qualityLevel }}</span>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <h3>操作说明</h3>
      <ul class="instruction-list">
        <li>拖拽节点体验物理惯性和弹性效果</li>
        <li>快速抛掷节点观察抛掷和边界反弹</li>
        <li>拖拽磁场源改变磁性吸附效果</li>
        <li>调整物理参数观察实时效果变化</li>
        <li>启用调试模式查看详细物理信息</li>
        <li>尝试不同预设场景体验多样化效果</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  BoltIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  RocketLaunchIcon,
  MagnifyingGlassIcon,
  BeakerIcon,
  CubeIcon
} from '@heroicons/vue/24/outline'

// Agent 6: Physics Integration
import {
  PhysicsAnimationIntegrationManager,
  PhysicsEnhancedNode,
  createStandardPhysicsEnhancement,
  createHighPerformancePhysicsEnhancement
} from '@/utils/physics-animation-integration'
import { Vector2D } from '@/utils/math-precision'
import { createElasticConfig } from '@/utils/spring-animation-system'

// Reactive state
const physicsManager = ref<PhysicsAnimationIntegrationManager>()
const physicsNodes = ref<PhysicsEnhancedNode[]>([])
const magneticSources = ref<any[]>([])
const currentPreset = ref('default')

// Configuration
const physicsConfig = reactive({
  enablePhysics: true,
  enableInertia: true,
  enableSprings: true,
  enableCollisions: true,
  enableMagnetics: true,
  elasticity: 0.6,
  friction: 0.1,
  mass: 1.0,
  magneticStrength: 1.0
})

const debugConfig = reactive({
  showPhysicsDebug: false,
  showForceVectors: false,
  showMagneticField: false,
  showPerformanceMetrics: true
})

const canvasSize = reactive({
  width: 800,
  height: 600
})

// Performance metrics
const performanceMetrics = reactive({
  fps: 60,
  physicsTime: 0,
  animationTime: 0,
  activeNodes: 0,
  memoryUsage: 0,
  qualityLevel: 'medium'
})

// Preset scenarios
const presetScenarios = [
  {
    id: 'default',
    name: '默认',
    icon: CubeIcon,
    description: '基础物理效果演示',
    config: { elasticity: 0.6, friction: 0.1, mass: 1.0 }
  },
  {
    id: 'bouncy',
    name: '弹性球',
    icon: RocketLaunchIcon,
    description: '高弹性低摩擦',
    config: { elasticity: 0.9, friction: 0.05, mass: 0.8 }
  },
  {
    id: 'heavy',
    name: '重物',
    icon: BeakerIcon,
    description: '高质量高摩擦',
    config: { elasticity: 0.3, friction: 0.3, mass: 3.0 }
  },
  {
    id: 'magnetic',
    name: '磁性',
    icon: MagnifyingGlassIcon,
    description: '强磁性吸附效果',
    config: { elasticity: 0.4, friction: 0.2, mass: 1.5, magneticStrength: 2.0 }
  }
]

// Canvas interaction
const physicsCanvas = ref<SVGElement>()
const isDraggingNode = ref<PhysicsEnhancedNode | null>(null)
const isDraggingMagnetic = ref<any>(null)
const dragOffset = ref<Vector2D>(Vector2D.zero())

// Animation loop
let animationFrameId: number = 0
let lastFrameTime = 0

/**
 * Initialize physics system
 */
const initializePhysics = () => {
  const config = createStandardPhysicsEnhancement()
  config.enableDebugMode = debugConfig.showPhysicsDebug
  config.qualityLevel = 'high'
  
  physicsManager.value = new PhysicsAnimationIntegrationManager(config)
  
  // Add some initial nodes
  addRandomNode()
  addRandomNode()
  addRandomNode()
  
  // Add magnetic sources
  if (physicsConfig.enableMagnetics) {
    addMagneticSource(new Vector2D(200, 150), 'attractive')
    addMagneticSource(new Vector2D(600, 450), 'repulsive')
  }
  
  // Start animation loop
  startAnimationLoop()
  
  console.log('PhysicsEffectsDemo: Physics system initialized')
}

/**
 * Add random physics node
 */
const addRandomNode = () => {
  if (!physicsManager.value) return
  
  const nodeId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  const position = new Vector2D(
    Math.random() * (canvasSize.width - 100) + 50,
    Math.random() * (canvasSize.height - 100) + 50
  )
  
  const node = physicsManager.value.createPhysicsNode(nodeId, position, {
    mass: physicsConfig.mass,
    friction: physicsConfig.friction,
    restitution: physicsConfig.elasticity,
    magneticStrength: physicsConfig.magneticStrength
  })
  
  physicsNodes.value.push(node)
  
  console.log(`PhysicsEffectsDemo: Added physics node ${nodeId}`)
}

/**
 * Add magnetic source
 */
const addMagneticSource = (position: Vector2D, polarity: 'attractive' | 'repulsive') => {
  const sourceId = `magnetic_${Date.now()}`
  const source = {
    id: sourceId,
    position: position.clone(),
    polarity,
    strength: 100,
    range: 80,
    fieldLines: [] as Vector2D[][]
  }
  
  magneticSources.value.push(source)
  
  if (physicsManager.value) {
    physicsManager.value.addMagneticSource(sourceId, position, {
      enabled: true,
      strength: source.strength,
      range: source.range,
      polarity,
      falloffType: 'quadratic',
      showFieldLines: debugConfig.showMagneticField,
      fieldLineCount: 8,
      fieldColor: polarity === 'attractive' ? '#3b82f6' : '#ef4444',
      fieldOpacity: 0.3
    })
  }
}

/**
 * Clear all nodes
 */
const clearAllNodes = () => {
  physicsNodes.value = []
  if (physicsManager.value) {
    for (const node of physicsManager.value.getAllNodes()) {
      physicsManager.value.removeObject(node.id)
    }
  }
}

/**
 * Reset physics
 */
const resetPhysics = () => {
  clearAllNodes()
  magneticSources.value = []
  
  setTimeout(() => {
    addRandomNode()
    addRandomNode()
    if (physicsConfig.enableMagnetics) {
      addMagneticSource(new Vector2D(200, 150), 'attractive')
    }
  }, 100)
}

/**
 * Load preset scenario
 */
const loadPreset = (preset: any) => {
  currentPreset.value = preset.id
  
  // Apply preset configuration
  Object.assign(physicsConfig, preset.config)
  
  // Reset scene
  resetPhysics()
  
  console.log(`PhysicsEffectsDemo: Loaded preset ${preset.name}`)
}

/**
 * Canvas mouse handlers
 */
const handleCanvasMouseDown = (event: MouseEvent) => {
  if (event.target === physicsCanvas.value) {
    // Click on empty canvas - add new node
    const rect = physicsCanvas.value!.getBoundingClientRect()
    const position = new Vector2D(
      event.clientX - rect.left,
      event.clientY - rect.top
    )
    
    const nodeId = `click_node_${Date.now()}`
    if (physicsManager.value) {
      const node = physicsManager.value.createPhysicsNode(nodeId, position, {
        mass: physicsConfig.mass,
        friction: physicsConfig.friction,
        restitution: physicsConfig.elasticity,
        magneticStrength: physicsConfig.magneticStrength
      })
      
      physicsNodes.value.push(node)
    }
  }
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!physicsCanvas.value) return
  
  const rect = physicsCanvas.value.getBoundingClientRect()
  const mousePos = new Vector2D(
    event.clientX - rect.left,
    event.clientY - rect.top
  )
  
  // Update dragging objects
  if (isDraggingNode.value && physicsManager.value) {
    const dragPos = mousePos.subtract(dragOffset.value)
    try {
      physicsManager.value.updateNodeDrag(isDraggingNode.value.id, dragPos, 0.016)
    } catch (error) {
      console.error('Failed to update node drag:', error)
    }
  }
  
  if (isDraggingMagnetic.value) {
    isDraggingMagnetic.value.position = mousePos.subtract(dragOffset.value)
    if (physicsManager.value) {
      try {
        physicsManager.value.updateMagneticSource(isDraggingMagnetic.value.id, isDraggingMagnetic.value.position)
      } catch (error) {
        console.error('Failed to update magnetic source:', error)
      }
    }
  }
}

const handleCanvasMouseUp = () => {
  if (isDraggingNode.value && physicsManager.value) {
    try {
      physicsManager.value.endNodeDrag(isDraggingNode.value.id)
    } catch (error) {
      console.error('Failed to end node drag:', error)
    }
  }
  
  isDraggingNode.value = null
  isDraggingMagnetic.value = null
  dragOffset.value = Vector2D.zero()
}

/**
 * Node drag handlers
 */
const startDragNode = (node: PhysicsEnhancedNode, event: MouseEvent) => {
  isDraggingNode.value = node
  
  const rect = physicsCanvas.value!.getBoundingClientRect()
  const mousePos = new Vector2D(
    event.clientX - rect.left,
    event.clientY - rect.top
  )
  
  dragOffset.value = mousePos.subtract(node.visualPosition)
  
  if (physicsManager.value) {
    try {
      physicsManager.value.startNodeDrag(node.id, mousePos)
    } catch (error) {
      console.error('Failed to start node drag:', error)
    }
  }
}

/**
 * Magnetic source drag handlers
 */
const startDragMagneticSource = (source: any, event: MouseEvent) => {
  isDraggingMagnetic.value = source
  
  const rect = physicsCanvas.value!.getBoundingClientRect()
  const mousePos = new Vector2D(
    event.clientX - rect.left,
    event.clientY - rect.top
  )
  
  dragOffset.value = mousePos.subtract(source.position)
}

/**
 * Animation loop
 */
const startAnimationLoop = () => {
  const animate = (currentTime: number) => {
    const deltaTime = currentTime - lastFrameTime
    lastFrameTime = currentTime
    
    // Update physics
    if (physicsManager.value) {
      physicsManager.value.step(deltaTime / 1000)
      
      // Sync nodes
      const allNodes = physicsManager.value.getAllNodes()
      physicsNodes.value = allNodes
      
      // Update performance metrics
      const metrics = physicsManager.value.getPerformanceMetrics()
      Object.assign(performanceMetrics, metrics)
    }
    
    animationFrameId = requestAnimationFrame(animate)
  }
  
  animationFrameId = requestAnimationFrame(animate)
}

/**
 * Utility functions
 */
const getNodeColor = (node: PhysicsEnhancedNode) => {
  const colors = {
    idle: '#6b7280',
    dragging: '#3b82f6',
    throwing: '#ef4444',
    bouncing: '#10b981',
    settling: '#f59e0b',
    constrained: '#8b5cf6'
  }
  
  return colors[node.animationState] || colors.idle
}

const generateFieldLinePath = (line: Vector2D[]) => {
  if (line.length === 0) return ''
  
  let path = `M ${line[0].x} ${line[0].y}`
  for (let i = 1; i < line.length; i++) {
    path += ` L ${line[i].x} ${line[i].y}`
  }
  return path
}

// Watch for config changes
watch(() => physicsConfig, (newConfig) => {
  if (physicsManager.value) {
    physicsManager.value.updateConfig({
      enablePhysics: newConfig.enablePhysics,
      enableSprings: newConfig.enableSprings,
      enableCollisions: newConfig.enableCollisions,
      enableInertia: newConfig.enableInertia,
      enableMagnetics: newConfig.enableMagnetics
    })
  }
}, { deep: true })

watch(() => debugConfig, (newConfig) => {
  if (physicsManager.value) {
    physicsManager.value.updateConfig({
      showPhysicsDebug: newConfig.showPhysicsDebug,
      showForceVectors: newConfig.showForceVectors,
      enableDebugMode: newConfig.showPhysicsDebug
    })
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  initializePhysics()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  if (physicsManager.value) {
    physicsManager.value.dispose()
  }
})
</script>

<style scoped>
.physics-effects-demo {
  @apply p-6 max-w-7xl mx-auto;
}

.demo-header {
  @apply text-center mb-8;
}

.demo-title {
  @apply text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2;
}

.demo-description {
  @apply text-lg text-gray-600;
}

.control-panel {
  @apply bg-white rounded-lg shadow-lg p-6 mb-6;
}

.control-section {
  @apply mb-6 last:mb-0;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.control-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.control-item {
  @apply flex flex-col gap-2;
}

.control-label {
  @apply text-sm font-medium text-gray-700;
}

.control-checkbox {
  @apply w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500;
}

.control-slider {
  @apply w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;
}

.control-value {
  @apply text-sm text-gray-600 font-mono;
}

.preset-buttons {
  @apply grid grid-cols-2 md:grid-cols-4 gap-3;
}

.preset-button {
  @apply flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-gray-700;
}

.preset-button.active {
  @apply bg-blue-100 text-blue-700 border-2 border-blue-300;
}

.physics-playground {
  @apply bg-white rounded-lg shadow-lg p-6 mb-6;
}

.playground-header {
  @apply flex justify-between items-center mb-4;
}

.playground-controls {
  @apply flex gap-2;
}

.action-button {
  @apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
}

.action-button.danger {
  @apply bg-red-600 hover:bg-red-700;
}

.physics-canvas {
  @apply border border-gray-300 rounded-lg bg-gray-50 cursor-crosshair;
}

.physics-node {
  cursor: grab;
  transition: all 0.1s ease;
}

.physics-node.dragging {
  cursor: grabbing;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
}

.physics-node.throwing {
  animation: throwEffect 0.3s ease-out;
}

.physics-node.bouncing {
  animation: bounceEffect 0.5s ease-out;
}

@keyframes throwEffect {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.6)); }
  100% { transform: scale(1); }
}

@keyframes bounceEffect {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  60% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.magnetic-field-lines {
  stroke: rgba(59, 130, 246, 0.3);
  stroke-width: 1;
  fill: none;
  animation: fieldPulse 2s ease-in-out infinite;
}

@keyframes fieldPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.velocity-vector {
  stroke: #ef4444;
  stroke-width: 2;
  marker-end: url(#arrowhead);
}

.performance-metrics {
  @apply bg-white rounded-lg shadow-lg p-6 mb-6;
}

.metrics-grid {
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4;
}

.metric-item {
  @apply text-center;
}

.metric-label {
  @apply block text-sm text-gray-600 mb-1;
}

.metric-value {
  @apply block text-2xl font-bold text-gray-900;
}

.instructions {
  @apply bg-gray-50 rounded-lg p-6;
}

.instruction-list {
  @apply list-disc list-inside space-y-2 text-gray-700;
}

.debug-text {
  @apply fill-gray-600 text-xs font-mono;
}

.node-shadow {
  @apply opacity-20;
}

.node-body {
  @apply transition-all duration-200;
}

.magnetic-source {
  cursor: grab;
}

.magnetic-source:active {
  cursor: grabbing;
}
</style>