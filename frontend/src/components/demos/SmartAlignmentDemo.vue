<template>
  <div class="smart-alignment-demo min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <!-- 头部控制栏 -->
    <div class="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-6">
            <h1 class="text-2xl font-bold text-gray-900">
              🧠 智能对齐与磁性吸附演示
            </h1>
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                Agent 5: 智能对齐专家
              </span>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- AI模式切换 -->
            <div class="flex items-center space-x-2">
              <label class="flex items-center cursor-pointer">
                <input
                  v-model="aiEnabled"
                  type="checkbox"
                  class="sr-only"
                />
                <div class="relative">
                  <div :class="[
                    'block w-14 h-8 rounded-full transition-colors',
                    aiEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  ]"></div>
                  <div :class="[
                    'absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform',
                    aiEnabled ? 'transform translate-x-6' : ''
                  ]"></div>
                </div>
                <span class="ml-2 text-sm font-medium text-gray-700">
                  AI增强模式
                </span>
              </label>
            </div>

            <!-- 性能统计显示 -->
            <div class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              {{ performanceStats.fps }}fps | {{ performanceStats.memory }}MB
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex h-screen">
      <!-- 左侧工具栏 -->
      <div class="w-80 bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
        <div class="p-6 space-y-6">
          <!-- 对齐工具 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17h18v2H3v-2zm0-6h18v2H3v-2zm0-6h18v2H3v-2z"/>
              </svg>
              智能对齐工具
            </h3>
            
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="alignType in alignmentTypes"
                :key="alignType.type"
                @click="performAlignment(alignType.type)"
                :class="[
                  'p-3 text-xs font-medium rounded-lg border-2 transition-all hover:scale-105',
                  activeAlignment === alignType.type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                ]"
                :title="alignType.description"
              >
                <div class="flex flex-col items-center space-y-1">
                  <div v-html="alignType.icon" class="w-4 h-4"></div>
                  <span>{{ alignType.name }}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- 磁性吸附设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
              磁性吸附控制
            </h3>

            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  磁性强度: {{ magneticStrength.toFixed(1) }}
                </label>
                <input
                  v-model.number="magneticStrength"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  吸附距离: {{ snapDistance }}px
                </label>
                <input
                  v-model.number="snapDistance"
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div class="flex items-center space-x-2">
                <input
                  v-model="showMagneticField"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label class="text-sm text-gray-700">显示磁场可视化</label>
              </div>

              <div class="flex items-center space-x-2">
                <input
                  v-model="adaptiveSnapping"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label class="text-sm text-gray-700">自适应吸附距离</label>
              </div>
            </div>
          </div>

          <!-- 布局算法选择 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/>
              </svg>
              自动布局算法
            </h3>

            <div class="space-y-2">
              <button
                v-for="layout in layoutTypes"
                :key="layout.type"
                @click="applyLayout(layout.type)"
                :class="[
                  'w-full p-3 text-left rounded-lg border transition-all hover:shadow-md',
                  currentLayout === layout.type
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ layout.name }}</div>
                    <div class="text-xs text-gray-500">{{ layout.description }}</div>
                  </div>
                  <div v-if="layout.aiRecommended" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    AI推荐
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- AI建议面板 -->
          <div v-if="aiEnabled && aiSuggestions.length > 0" class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              AI智能建议
            </h3>

            <div class="space-y-3">
              <div
                v-for="suggestion in aiSuggestions"
                :key="suggestion.id"
                class="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="font-medium text-purple-900">{{ suggestion.title }}</div>
                    <div class="text-sm text-purple-700 mt-1">{{ suggestion.description }}</div>
                    <div class="flex items-center mt-2 space-x-2">
                      <div class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        置信度: {{ (suggestion.confidence * 100).toFixed(0) }}%
                      </div>
                      <div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        质量分: {{ (suggestion.qualityScore * 100).toFixed(0) }}
                      </div>
                    </div>
                  </div>
                  <button
                    @click="applySuggestion(suggestion)"
                    class="ml-2 px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700"
                  >
                    应用
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 性能监控 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99l1.5 1.5z"/>
              </svg>
              性能监控
            </h3>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-600">对齐引擎</div>
                <div class="font-mono text-green-600">{{ engineStats.alignmentTime }}ms</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-600">磁性计算</div>
                <div class="font-mono text-blue-600">{{ engineStats.magneticTime }}ms</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-600">AI预测</div>
                <div class="font-mono text-purple-600">{{ engineStats.aiTime }}ms</div>
              </div>
              <div class="bg-gray-50 p-2 rounded">
                <div class="text-gray-600">视觉渲染</div>
                <div class="font-mono text-orange-600">{{ engineStats.renderTime }}ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主要画布区域 -->
      <div class="flex-1 relative bg-white overflow-hidden">
        <!-- 画布控制栏 -->
        <div class="absolute top-4 left-4 z-20 flex items-center space-x-2">
          <button
            @click="addRandomNodes"
            class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加节点
          </button>
          <button
            @click="clearCanvas"
            class="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            清除画布
          </button>
          <button
            @click="toggleGrid"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              showGrid 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
          >
            网格 {{ showGrid ? 'ON' : 'OFF' }}
          </button>
          <button
            @click="toggleGhostPreview"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              showGhostPreview 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
          >
            预览模式
          </button>
        </div>

        <!-- 画布信息显示 -->
        <div class="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div class="text-xs space-y-1 font-mono">
            <div>节点数: {{ demoNodes.length }}</div>
            <div>选中: {{ selectedNodes.length }}</div>
            <div>鼠标: {{ mousePosition.x }}, {{ mousePosition.y }}</div>
            <div>缩放: {{ canvasZoom.toFixed(1) }}x</div>
          </div>
        </div>

        <!-- SVG画布 -->
        <svg
          ref="demoCanvas"
          class="w-full h-full cursor-crosshair"
          @mousedown="handleCanvasMouseDown"
          @mousemove="handleCanvasMouseMove" 
          @mouseup="handleCanvasMouseUp"
          @click="handleCanvasClick"
          @wheel="handleCanvasWheel"
        >
          <!-- 网格背景 -->
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
            </pattern>
            
            <!-- 磁场渐变 -->
            <radialGradient id="magnetic-field" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
              <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.1"/>
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- 网格层 -->
          <rect
            v-if="showGrid"
            width="100%"
            height="100%"
            fill="url(#grid)"
            opacity="0.5"
          />

          <!-- 变换容器 -->
          <g :transform="`translate(${canvasPan.x}, ${canvasPan.y}) scale(${canvasZoom})`">
            
            <!-- 磁场可视化层 -->
            <g v-if="showMagneticField" class="magnetic-fields">
              <circle
                v-for="target in magneticTargets"
                :key="`field-${target.id}`"
                :cx="target.position.x"
                :cy="target.position.y"
                :r="target.radius * 1.5"
                fill="url(#magnetic-field)"
                opacity="0.3"
              />
            </g>

            <!-- 对齐指示线层 -->
            <g class="alignment-guides">
              <line
                v-for="guide in alignmentGuides"
                :key="guide.id"
                :x1="guide.start.x"
                :y1="guide.start.y"
                :x2="guide.end.x"
                :y2="guide.end.y"
                :stroke="guide.color"
                :stroke-width="guide.strokeWidth || 1.5"
                :stroke-dasharray="guide.dashArray"
                :opacity="guide.opacity || 0.8"
                class="pointer-events-none"
              >
                <animate
                  v-if="guide.animated"
                  attributeName="opacity"
                  values="0;1;0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </line>
            </g>

            <!-- 吸附区域层 -->
            <g class="snap-zones">
              <circle
                v-for="target in magneticTargets"
                :key="`snap-${target.id}`"
                :cx="target.position.x"
                :cy="target.position.y"
                :r="target.radius"
                fill="none"
                stroke="#10b981"
                stroke-width="1"
                stroke-dasharray="3,3"
                opacity="0.4"
              />
            </g>

            <!-- 节点层 -->
            <g class="demo-nodes">
              <g
                v-for="node in demoNodes"
                :key="node.id"
                :class="[
                  'demo-node cursor-move transition-all duration-200',
                  { 
                    'selected': selectedNodes.includes(node.id),
                    'hover': hoveredNode === node.id
                  }
                ]"
                :transform="`translate(${node.position.x}, ${node.position.y})`"
                @mousedown="handleNodeMouseDown($event, node)"
                @mouseenter="hoveredNode = node.id"
                @mouseleave="hoveredNode = null"
              >
                <!-- 节点阴影 -->
                <rect
                  x="2"
                  y="2"
                  :width="node.size.x"
                  :height="node.size.y"
                  :rx="4"
                  fill="rgba(0,0,0,0.1)"
                />
                
                <!-- 节点主体 -->
                <rect
                  x="0"
                  y="0"
                  :width="node.size.x"
                  :height="node.size.y"
                  :rx="4"
                  :fill="node.color"
                  :stroke="selectedNodes.includes(node.id) ? '#3b82f6' : 'transparent'"
                  :stroke-width="selectedNodes.includes(node.id) ? 2 : 0"
                  class="transition-all duration-200"
                />
                
                <!-- 节点标签 -->
                <text
                  :x="node.size.x / 2"
                  :y="node.size.y / 2"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  class="text-xs font-medium fill-white pointer-events-none"
                >
                  {{ node.label }}
                </text>

                <!-- 磁性点指示 -->
                <circle
                  v-if="showMagneticField && isMagneticTarget(node.id)"
                  :cx="node.size.x / 2"
                  :cy="node.size.y / 2"
                  r="3"
                  fill="#ef4444"
                  opacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="2;4;2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>

            <!-- 幽灵预览层 -->
            <g v-if="showGhostPreview && ghostPreviews.length > 0" class="ghost-previews">
              <rect
                v-for="ghost in ghostPreviews"
                :key="`ghost-${ghost.id}`"
                :x="ghost.position.x"
                :y="ghost.position.y"
                :width="ghost.size.x"
                :height="ghost.size.y"
                :rx="4"
                fill="#f59e0b"
                fill-opacity="0.2"
                stroke="#f59e0b"
                stroke-width="2"
                stroke-dasharray="4,4"
                opacity="0.6"
              />
            </g>

            <!-- 选择框 -->
            <rect
              v-if="selectionBox.visible"
              :x="selectionBox.start.x"
              :y="selectionBox.start.y"
              :width="selectionBox.end.x - selectionBox.start.x"
              :height="selectionBox.end.y - selectionBox.start.y"
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              stroke-width="1"
              stroke-dasharray="3,3"
            />

          </g>
        </svg>

        <!-- 浮动工具提示 -->
        <div
          v-if="tooltip.visible"
          :style="{
            position: 'absolute',
            left: tooltip.position.x + 'px',
            top: tooltip.position.y + 'px',
            transform: 'translate(-50%, -100%)'
          }"
          class="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-30 mb-2"
        >
          {{ tooltip.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Vector2D, BoundingBox } from '@/utils/math-precision'
import { AdvancedAlignmentEngine, createAdvancedAlignmentEngine, AlignmentLayer, MagneticStrength } from '@/utils/advanced-alignment-engine'
import { EnhancedMagneticSnapping, createEnhancedMagneticSnapping } from '@/utils/enhanced-magnetic-snapping'
import { AutoLayoutEngine, createAutoLayoutEngine, LayoutType } from '@/utils/auto-layout-algorithms'
import { AILayoutOptimizer, createAILayoutOptimizer } from '@/utils/ai-layout-optimizer'
import { VisualAlignmentFeedback, createVisualAlignmentFeedback } from '@/utils/visual-alignment-feedback'
import type { AlignmentType, SnapType } from '@/utils/smart-snapping-alignment'
import type { SelectionItem } from '@/utils/multi-selection-manager'

// 演示节点接口
interface DemoNode {
  id: string
  position: Vector2D
  size: Vector2D
  color: string
  label: string
  type: string
}

// 智能对齐引擎实例
const alignmentEngine = createAdvancedAlignmentEngine()
const magneticSnapping = createEnhancedMagneticSnapping()
const layoutEngine = createAutoLayoutEngine()
const aiOptimizer = createAILayoutOptimizer()
const visualFeedback = createVisualAlignmentFeedback()

// 响应式状态
const demoCanvas = ref<SVGSVGElement>()
const demoNodes = ref<DemoNode[]>([])
const selectedNodes = ref<string[]>([])
const hoveredNode = ref<string | null>(null)

// AI和控制状态
const aiEnabled = ref(true)
const magneticStrength = ref(0.6)
const snapDistance = ref(20)
const showMagneticField = ref(false)
const adaptiveSnapping = ref(true)
const showGrid = ref(false)
const showGhostPreview = ref(true)

// 画布状态
const canvasZoom = ref(1.0)
const canvasPan = ref(new Vector2D(0, 0))
const mousePosition = ref(new Vector2D(0, 0))
const isDragging = ref(false)
const dragStart = ref<Vector2D>(new Vector2D(0, 0))
const activeAlignment = ref<AlignmentType | null>(null)
const currentLayout = ref<LayoutType | null>(null)

// 选择框状态
const selectionBox = ref({
  visible: false,
  start: new Vector2D(0, 0),
  end: new Vector2D(0, 0)
})

// 工具提示
const tooltip = ref({
  visible: false,
  text: '',
  position: new Vector2D(0, 0)
})

// 视觉反馈状态
const alignmentGuides = ref<Array<{
  id: string
  start: Vector2D
  end: Vector2D
  color: string
  strokeWidth?: number
  dashArray?: string
  opacity?: number
  animated?: boolean
}>>([])

const magneticTargets = ref<Array<{
  id: string
  position: Vector2D
  radius: number
  strength: number
}>>([])

const ghostPreviews = ref<Array<{
  id: string
  position: Vector2D
  size: Vector2D
}>>([])

// AI建议
const aiSuggestions = ref<Array<{
  id: string
  title: string
  description: string
  confidence: number
  qualityScore: number
  action: () => void
}>>([])

// 性能统计
const performanceStats = ref({
  fps: 60,
  memory: 0,
})

const engineStats = ref({
  alignmentTime: 0,
  magneticTime: 0,
  aiTime: 0,
  renderTime: 0
})

// 对齐类型配置
const alignmentTypes = [
  {
    type: 'left' as AlignmentType,
    name: '左对齐',
    description: '将选中对象左边缘对齐',
    icon: '<div class="w-3 h-2 border-l-2 border-current"></div>'
  },
  {
    type: 'center' as AlignmentType,
    name: '居中',
    description: '将选中对象水平居中对齐',
    icon: '<div class="w-3 h-2 border-l border-r border-current"></div>'
  },
  {
    type: 'right' as AlignmentType,
    name: '右对齐',
    description: '将选中对象右边缘对齐',
    icon: '<div class="w-3 h-2 border-r-2 border-current"></div>'
  },
  {
    type: 'top' as AlignmentType,
    name: '顶对齐',
    description: '将选中对象顶部对齐',
    icon: '<div class="w-2 h-3 border-t-2 border-current"></div>'
  },
  {
    type: 'middle' as AlignmentType,
    name: '垂直居中',
    description: '将选中对象垂直居中对齐',
    icon: '<div class="w-2 h-3 border-t border-b border-current"></div>'
  },
  {
    type: 'bottom' as AlignmentType,
    name: '底对齐',
    description: '将选中对象底部对齐',
    icon: '<div class="w-2 h-3 border-b-2 border-current"></div>'
  },
  {
    type: 'distribute-horizontal' as AlignmentType,
    name: '水平分布',
    description: '将选中对象水平等距分布',
    icon: '<div class="flex space-x-1"><div class="w-1 h-2 bg-current"></div><div class="w-1 h-2 bg-current"></div><div class="w-1 h-2 bg-current"></div></div>'
  },
  {
    type: 'distribute-vertical' as AlignmentType,
    name: '垂直分布',
    description: '将选中对象垂直等距分布',
    icon: '<div class="flex flex-col space-y-1"><div class="w-2 h-1 bg-current"></div><div class="w-2 h-1 bg-current"></div><div class="w-2 h-1 bg-current"></div></div>'
  },
  {
    type: 'grid' as AlignmentType,
    name: '网格对齐',
    description: '将选中对象排列为网格',
    icon: '<div class="grid grid-cols-2 gap-0.5"><div class="w-1 h-1 bg-current"></div><div class="w-1 h-1 bg-current"></div><div class="w-1 h-1 bg-current"></div><div class="w-1 h-1 bg-current"></div></div>'
  }
]

// 布局类型配置
const layoutTypes = computed(() => [
  {
    type: LayoutType.GRID,
    name: '网格布局',
    description: '整齐的网格排列',
    aiRecommended: aiEnabled.value && demoNodes.value.length >= 4 && demoNodes.value.length <= 16
  },
  {
    type: LayoutType.CIRCULAR,
    name: '圆形布局',
    description: '圆形排列布局',
    aiRecommended: aiEnabled.value && demoNodes.value.length <= 8
  },
  {
    type: LayoutType.FORCE_DIRECTED,
    name: '力导向布局',
    description: '自然的节点分布',
    aiRecommended: aiEnabled.value && demoNodes.value.length > 10
  },
  {
    type: LayoutType.HIERARCHICAL,
    name: '层次化布局',
    description: '分层级的树状结构',
    aiRecommended: false
  },
  {
    type: LayoutType.RADIAL,
    name: '径向布局',
    description: '中心辐射式布局',
    aiRecommended: false
  },
  {
    type: LayoutType.FLOW,
    name: '流式布局',
    description: '自适应流式排列',
    aiRecommended: aiEnabled.value && demoNodes.value.length > 20
  }
])

// 生命周期
onMounted(async () => {
  console.log('SmartAlignmentDemo: Initializing...')
  
  await nextTick()
  
  if (demoCanvas.value) {
    visualFeedback.mountTo(demoCanvas.value.parentElement!)
  }
  
  // 初始化演示节点
  initializeDemoNodes()
  
  // 启动性能监控
  startPerformanceMonitoring()
  
  // 生成初始AI建议
  if (aiEnabled.value) {
    await generateAISuggestions()
  }
  
  console.log('SmartAlignmentDemo: Initialized successfully')
})

onUnmounted(() => {
  visualFeedback.dispose()
  alignmentEngine.dispose()
  magneticSnapping.dispose()
  aiOptimizer.dispose()
})

// 初始化演示节点
const initializeDemoNodes = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
  const types = ['process', 'decision', 'data', 'terminal', 'connector']
  
  demoNodes.value = Array.from({ length: 8 }, (_, i) => ({
    id: `node-${i + 1}`,
    position: new Vector2D(
      100 + (i % 4) * 150 + Math.random() * 50,
      100 + Math.floor(i / 4) * 120 + Math.random() * 40
    ),
    size: new Vector2D(80 + Math.random() * 40, 40 + Math.random() * 20),
    color: colors[i % colors.length],
    label: `节点 ${i + 1}`,
    type: types[i % types.length]
  }))
  
  // 设置磁性目标
  updateMagneticTargets()
}

// 更新磁性目标
const updateMagneticTargets = () => {
  magneticTargets.value = demoNodes.value.map(node => ({
    id: node.id,
    position: node.position.add(node.size.divide(2)),
    radius: snapDistance.value,
    strength: magneticStrength.value
  }))
  
  // 更新磁性吸附系统
  magneticSnapping.updateConfig({
    globalStrength: magneticStrength.value,
    baseSnapDistance: snapDistance.value,
    adaptiveMode: adaptiveSnapping.value,
    showMagneticField: showMagneticField.value
  })
}

// 性能监控
const startPerformanceMonitoring = () => {
  let frameCount = 0
  let lastTime = performance.now()
  
  const updateStats = () => {
    frameCount++
    const now = performance.now()
    
    if (now - lastTime >= 1000) {
      performanceStats.value.fps = Math.round(frameCount * 1000 / (now - lastTime))
      performanceStats.value.memory = Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0)
      
      frameCount = 0
      lastTime = now
    }
    
    requestAnimationFrame(updateStats)
  }
  
  updateStats()
}

// 生成AI建议
const generateAISuggestions = async () => {
  if (!aiEnabled.value || demoNodes.value.length === 0) {
    aiSuggestions.value = []
    return
  }
  
  const startTime = performance.now()
  
  try {
    const items: SelectionItem[] = demoNodes.value.map(node => ({
      id: node.id,
      element: { position: node.position },
      bounds: BoundingBox.fromRect(node.position.x, node.position.y, node.size.x, node.size.y)
    }))
    
    const suggestions = await aiOptimizer.generateAILayoutSuggestions(items)
    
    aiSuggestions.value = suggestions.slice(0, 3).map((suggestion, index) => ({
      id: `suggestion-${index}`,
      title: `${suggestion.layoutType}布局优化`,
      description: `AI建议使用${suggestion.layoutType}布局来改善当前排列，预期质量提升${(suggestion.expectedQualityImprovement * 100).toFixed(0)}%`,
      confidence: suggestion.confidence,
      qualityScore: suggestion.qualityScore,
      action: () => applyLayout(suggestion.layoutType)
    }))
    
    engineStats.value.aiTime = performance.now() - startTime
  } catch (error) {
    console.error('Failed to generate AI suggestions:', error)
    aiSuggestions.value = []
  }
}

// 执行对齐
const performAlignment = async (alignmentType: AlignmentType) => {
  if (selectedNodes.value.length < 2) {
    showTooltip('请至少选择两个节点', mousePosition.value)
    return
  }
  
  const startTime = performance.now()
  activeAlignment.value = alignmentType
  
  try {
    const selectedItems: SelectionItem[] = demoNodes.value
      .filter(node => selectedNodes.value.includes(node.id))
      .map(node => ({
        id: node.id,
        element: { position: node.position },
        bounds: BoundingBox.fromRect(node.position.x, node.position.y, node.size.x, node.size.y)
      }))
    
    const analysis = await alignmentEngine.analyzeAdvancedSpatialRelations(selectedItems)
    const alignmentSuggestion = analysis.alignments.find(a => a.type === alignmentType)
    
    if (alignmentSuggestion) {
      // 显示幽灵预览
      if (showGhostPreview.value) {
        showAlignmentPreview(alignmentSuggestion.preview)
      }
      
      // 显示对齐指示线
      showAlignmentGuidesForType(alignmentType, selectedItems)
      
      // 应用对齐
      setTimeout(() => {
        alignmentSuggestion.preview.forEach((newPos, index) => {
          const nodeId = selectedItems[index].id
          const node = demoNodes.value.find(n => n.id === nodeId)
          if (node) {
            node.position = newPos
          }
        })
        
        updateMagneticTargets()
        hideGhostPreview()
        
        // 记录用户行为用于AI学习
        if (aiEnabled.value) {
          aiOptimizer.learnFromUserBehavior(selectedItems, 'grid', 'accept', 0.8)
        }
      }, 800)
    }
    
    engineStats.value.alignmentTime = performance.now() - startTime
  } catch (error) {
    console.error('Alignment failed:', error)
    showTooltip('对齐失败', mousePosition.value)
  }
  
  setTimeout(() => {
    activeAlignment.value = null
  }, 1000)
}

// 应用布局
const applyLayout = async (layoutType: LayoutType) => {
  const startTime = performance.now()
  currentLayout.value = layoutType
  
  try {
    const items: SelectionItem[] = demoNodes.value.map(node => ({
      id: node.id,
      element: { position: node.position },
      bounds: BoundingBox.fromRect(node.position.x, node.position.y, node.size.x, node.size.y)
    }))
    
    layoutEngine.setLayoutNodes(items)
    const result = await layoutEngine.executeLayout(layoutType)
    
    // 显示幽灵预览
    if (showGhostPreview.value) {
      ghostPreviews.value = result.nodes.map(node => ({
        id: node.id,
        position: node.position,
        size: node.size
      }))
    }
    
    // 应用布局结果
    setTimeout(() => {
      result.nodes.forEach(layoutNode => {
        const node = demoNodes.value.find(n => n.id === layoutNode.id)
        if (node) {
          node.position = layoutNode.position
        }
      })
      
      updateMagneticTargets()
      hideGhostPreview()
      
      // AI学习
      if (aiEnabled.value) {
        const qualityScore = result.metrics.aestheticScore
        aiOptimizer.learnFromUserBehavior(items, layoutType, 'accept', qualityScore)
      }
    }, 1000)
    
    engineStats.value.renderTime = performance.now() - startTime
  } catch (error) {
    console.error('Layout failed:', error)
    showTooltip('布局应用失败', mousePosition.value)
  }
  
  setTimeout(() => {
    currentLayout.value = null
  }, 1200)
}

// 应用AI建议
const applySuggestion = (suggestion: any) => {
  suggestion.action()
  showTooltip(`已应用AI建议: ${suggestion.title}`, mousePosition.value)
}

// 显示对齐指示线
const showAlignmentGuidesForType = (type: AlignmentType, items: SelectionItem[]) => {
  alignmentGuides.value = []
  
  const bounds = items.map(item => item.bounds)
  const guides: typeof alignmentGuides.value = []
  
  switch (type) {
    case 'left':
      const leftX = Math.min(...bounds.map(b => b.min.x))
      guides.push({
        id: 'left-guide',
        start: new Vector2D(leftX, Math.min(...bounds.map(b => b.min.y)) - 20),
        end: new Vector2D(leftX, Math.max(...bounds.map(b => b.max.y)) + 20),
        color: '#3b82f6',
        strokeWidth: 2,
        animated: true
      })
      break
      
    case 'center':
      const centerX = bounds.reduce((sum, b) => sum + b.center.x, 0) / bounds.length
      guides.push({
        id: 'center-guide',
        start: new Vector2D(centerX, Math.min(...bounds.map(b => b.min.y)) - 20),
        end: new Vector2D(centerX, Math.max(...bounds.map(b => b.max.y)) + 20),
        color: '#10b981',
        strokeWidth: 2,
        dashArray: '5,5',
        animated: true
      })
      break
      
    // 可以添加更多对齐类型的指示线
  }
  
  alignmentGuides.value = guides
  
  // 自动隐藏
  setTimeout(() => {
    alignmentGuides.value = []
  }, 2000)
}

// 显示对齐预览
const showAlignmentPreview = (previewPositions: Vector2D[]) => {
  ghostPreviews.value = previewPositions.map((pos, index) => {
    const originalNode = demoNodes.value[index]
    return {
      id: `preview-${originalNode.id}`,
      position: pos,
      size: originalNode.size
    }
  })
}

// 隐藏幽灵预览
const hideGhostPreview = () => {
  ghostPreviews.value = []
}

// 检查是否为磁性目标
const isMagneticTarget = (nodeId: string): boolean => {
  return magneticTargets.value.some(target => target.id === nodeId)
}

// 画布事件处理
const handleCanvasMouseDown = (event: MouseEvent) => {
  const rect = demoCanvas.value!.getBoundingClientRect()
  const point = screenToCanvas(new Vector2D(event.clientX - rect.left, event.clientY - rect.top))
  
  dragStart.value = point
  
  // 开始选择框
  if (!event.ctrlKey && !event.metaKey) {
    selectionBox.value = {
      visible: true,
      start: point,
      end: point
    }
  }
}

const handleCanvasMouseMove = (event: MouseEvent) => {
  const rect = demoCanvas.value!.getBoundingClientRect()
  const point = screenToCanvas(new Vector2D(event.clientX - rect.left, event.clientY - rect.top))
  
  mousePosition.value = point
  
  // 更新选择框
  if (selectionBox.value.visible) {
    selectionBox.value.end = point
    
    // 更新选中的节点
    const boxBounds = BoundingBox.fromRect(
      Math.min(selectionBox.value.start.x, selectionBox.value.end.x),
      Math.min(selectionBox.value.start.y, selectionBox.value.end.y),
      Math.abs(selectionBox.value.end.x - selectionBox.value.start.x),
      Math.abs(selectionBox.value.end.y - selectionBox.value.start.y)
    )
    
    selectedNodes.value = demoNodes.value
      .filter(node => {
        const nodeBounds = BoundingBox.fromRect(node.position.x, node.position.y, node.size.x, node.size.y)
        return boxBounds.intersects(nodeBounds)
      })
      .map(node => node.id)
  }
}

const handleCanvasMouseUp = () => {
  selectionBox.value.visible = false
  isDragging.value = false
}

const handleCanvasClick = (event: MouseEvent) => {
  if (event.target === demoCanvas.value) {
    if (!event.ctrlKey && !event.metaKey) {
      selectedNodes.value = []
    }
  }
}

const handleCanvasWheel = (event: WheelEvent) => {
  event.preventDefault()
  
  const delta = event.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(0.1, Math.min(5, canvasZoom.value * delta))
  
  canvasZoom.value = newZoom
}

// 节点事件处理
const handleNodeMouseDown = (event: MouseEvent, node: DemoNode) => {
  event.stopPropagation()
  
  if (!selectedNodes.value.includes(node.id)) {
    if (event.ctrlKey || event.metaKey) {
      selectedNodes.value.push(node.id)
    } else {
      selectedNodes.value = [node.id]
    }
  }
  
  isDragging.value = true
  
  // 开始拖拽
  const rect = demoCanvas.value!.getBoundingClientRect()
  const startPoint = screenToCanvas(new Vector2D(event.clientX - rect.left, event.clientY - rect.top))
  
  const handleMouseMove = (moveEvent: MouseEvent) => {
    const currentPoint = screenToCanvas(new Vector2D(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top))
    const delta = currentPoint.subtract(startPoint)
    
    // 移动选中的节点
    selectedNodes.value.forEach(nodeId => {
      const targetNode = demoNodes.value.find(n => n.id === nodeId)
      if (targetNode) {
        const newPosition = targetNode.position.add(delta)
        
        // 磁性吸附计算
        if (magneticStrength.value > 0) {
          const snapResult = magneticSnapping.calculateAdvancedSnap(
            newPosition,
            Vector2D.zero(),
            nodeId
          )
          targetNode.position = snapResult.snappedPosition
        } else {
          targetNode.position = newPosition
        }
      }
    })
    
    startPoint.x = currentPoint.x
    startPoint.y = currentPoint.y
    
    updateMagneticTargets()
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    isDragging.value = false
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 工具功能
const addRandomNodes = () => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  const newNodeCount = 3
  
  for (let i = 0; i < newNodeCount; i++) {
    const newNode: DemoNode = {
      id: `node-${Date.now()}-${i}`,
      position: new Vector2D(
        100 + Math.random() * 600,
        100 + Math.random() * 400
      ),
      size: new Vector2D(60 + Math.random() * 60, 40 + Math.random() * 20),
      color: colors[Math.floor(Math.random() * colors.length)],
      label: `节点 ${demoNodes.value.length + i + 1}`,
      type: 'process'
    }
    demoNodes.value.push(newNode)
  }
  
  updateMagneticTargets()
  
  if (aiEnabled.value) {
    generateAISuggestions()
  }
}

const clearCanvas = () => {
  demoNodes.value = []
  selectedNodes.value = []
  alignmentGuides.value = []
  magneticTargets.value = []
  ghostPreviews.value = []
  aiSuggestions.value = []
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const toggleGhostPreview = () => {
  showGhostPreview.value = !showGhostPreview.value
}

// 坐标转换
const screenToCanvas = (screenPoint: Vector2D): Vector2D => {
  return screenPoint.subtract(canvasPan.value).divide(canvasZoom.value)
}

// 工具提示
const showTooltip = (text: string, position: Vector2D) => {
  tooltip.value = {
    visible: true,
    text,
    position: position.add(new Vector2D(0, -10))
  }
  
  setTimeout(() => {
    tooltip.value.visible = false
  }, 2000)
}

// 监听配置变化
const updateMagneticConfig = () => {
  updateMagneticTargets()
  
  if (aiEnabled.value) {
    generateAISuggestions()
  }
}

// 响应式更新
const unwatchMagnetic = [
  () => magneticStrength.value,
  () => snapDistance.value,
  () => showMagneticField.value,
  () => adaptiveSnapping.value
].map(getter => {
  let oldValue = getter()
  return () => {
    const newValue = getter()
    if (newValue !== oldValue) {
      oldValue = newValue
      updateMagneticConfig()
    }
  }
})

const unwatchAI = () => {
  let oldValue = aiEnabled.value
  return () => {
    if (aiEnabled.value !== oldValue) {
      oldValue = aiEnabled.value
      if (aiEnabled.value) {
        generateAISuggestions()
      } else {
        aiSuggestions.value = []
      }
    }
  }
}

// 定期更新
setInterval(() => {
  unwatchMagnetic.forEach(fn => fn())
  unwatchAI()()
}, 100)
</script>

<style scoped>
.demo-node {
  transition: all 0.2s ease;
}

.demo-node.selected {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
}

.demo-node.hover {
  transform: scale(1.05);
}

.demo-node:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

/* 自定义滑块样式 */
input[type="range"] {
  background: linear-gradient(to right, #3b82f6 0%, #3b82f6 var(--value), #e5e7eb var(--value), #e5e7eb 100%);
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.magnetic-fields circle {
  animation: pulse 2s infinite;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .w-80 {
    width: 16rem;
  }
}

@media (max-width: 768px) {
  .w-80 {
    width: 100%;
    height: 200px;
  }
  
  .flex {
    flex-direction: column;
  }
}
</style>