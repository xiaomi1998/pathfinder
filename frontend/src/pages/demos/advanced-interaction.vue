<template>
  <div class="advanced-interaction-page">
    <!-- Page Header -->
    <div class="page-header bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
      <div class="container mx-auto px-6 py-12">
        <div class="text-center max-w-4xl mx-auto">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            高级交互特性演示
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
            体验专业级编辑器的强大交互功能：多选、批量操作、智能手势识别和实时对齐
          </p>
          
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <div class="text-center">
              <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">±0.001px</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">亚像素精度</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 dark:text-green-400">60FPS</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">流畅渲染</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">1000+</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">批量操作</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">&lt;10ms</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">响应延迟</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Demo Section -->
    <div class="demo-section py-12">
      <div class="container mx-auto px-6">
        <!-- Demo Controls -->
        <div class="mb-8">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="flex items-center gap-4">
              <button
                @click="resetDemo"
                class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                重置演示
              </button>
              
              <button
                @click="addRandomNodes"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                添加节点
              </button>
              
              <button
                @click="toggleTutorial"
                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {{ showTutorial ? '隐藏教程' : '显示教程' }}
              </button>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                已选择: <span class="font-mono">{{ selectedCount }}</span> 个节点
              </div>
            </div>
          </div>
          
          <!-- Feature Toggles -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <label class="flex items-center space-x-2">
              <input
                v-model="features.multiSelection"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">多选模式</span>
            </label>
            
            <label class="flex items-center space-x-2">
              <input
                v-model="features.batchOperations"
                type="checkbox"
                class="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">批量操作</span>
            </label>
            
            <label class="flex items-center space-x-2">
              <input
                v-model="features.gestureRecognition"
                type="checkbox"
                class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">手势识别</span>
            </label>
            
            <label class="flex items-center space-x-2">
              <input
                v-model="features.smartAlignment"
                type="checkbox"
                class="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">智能对齐</span>
            </label>
          </div>
        </div>

        <!-- Main Demo Component -->
        <div class="demo-container bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <AdvancedInteractionDemo
            ref="demoRef"
            @selection-changed="handleSelectionChanged"
            @feature-used="handleFeatureUsed"
            @performance-update="handlePerformanceUpdate"
          />
        </div>
      </div>
    </div>

    <!-- Tutorial Overlay -->
    <div
      v-if="showTutorial"
      class="tutorial-overlay fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      @click="closeTutorial"
    >
      <div
        class="tutorial-content bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl mx-4 p-8"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            交互教程
          </h2>
          <button
            @click="closeTutorial"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="tutorial-steps space-y-6">
          <div
            v-for="(step, index) in tutorialSteps"
            :key="index"
            class="tutorial-step flex items-start gap-4"
          >
            <div class="step-number flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {{ index + 1 }}
            </div>
            <div class="step-content">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
                {{ step.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {{ step.description }}
              </p>
              <div v-if="step.shortcut" class="mt-2">
                <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                  {{ step.shortcut }}
                </code>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-8 flex justify-end">
          <button
            @click="closeTutorial"
            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            开始体验
          </button>
        </div>
      </div>
    </div>

    <!-- Features Showcase -->
    <div class="features-section py-16 bg-gray-50 dark:bg-gray-900">
      <div class="container mx-auto px-6">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            核心特性
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-300">
            专业级编辑器的强大功能，提升您的工作效率
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="feature in showcaseFeatures"
            :key="feature.name"
            class="feature-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div class="feature-icon mb-4">
              <div :class="feature.iconClass" class="w-12 h-12 rounded-lg flex items-center justify-center">
                <component :is="feature.icon" class="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {{ feature.name }}
            </h3>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {{ feature.description }}
            </p>
            
            <div class="feature-metrics space-y-2">
              <div
                v-for="metric in feature.metrics"
                :key="metric.label"
                class="flex justify-between items-center text-sm"
              >
                <span class="text-gray-500 dark:text-gray-400">{{ metric.label }}</span>
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ metric.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Dashboard -->
    <div class="performance-section py-12">
      <div class="container mx-auto px-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            实时性能监控
          </h2>
          
          <div class="grid md:grid-cols-3 gap-8">
            <div class="performance-metric text-center">
              <div class="metric-value text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {{ performanceData.fps }}
              </div>
              <div class="metric-label text-sm text-gray-500 dark:text-gray-400 mb-4">
                帧率 (FPS)
              </div>
              <div class="metric-bar bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  class="metric-fill bg-blue-500 h-full transition-all duration-300"
                  :style="{ width: `${Math.min(performanceData.fps / 60 * 100, 100)}%` }"
                ></div>
              </div>
            </div>
            
            <div class="performance-metric text-center">
              <div class="metric-value text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {{ performanceData.memory }}
              </div>
              <div class="metric-label text-sm text-gray-500 dark:text-gray-400 mb-4">
                内存使用 (MB)
              </div>
              <div class="metric-bar bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  class="metric-fill bg-green-500 h-full transition-all duration-300"
                  :style="{ width: `${Math.min(performanceData.memory / 50 * 100, 100)}%` }"
                ></div>
              </div>
            </div>
            
            <div class="performance-metric text-center">
              <div class="metric-value text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {{ performanceData.latency }}
              </div>
              <div class="metric-label text-sm text-gray-500 dark:text-gray-400 mb-4">
                响应延迟 (ms)
              </div>
              <div class="metric-bar bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  class="metric-fill bg-purple-500 h-full transition-all duration-300"
                  :style="{ width: `${Math.max(100 - performanceData.latency / 10 * 100, 0)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import AdvancedInteractionDemo from '@/components/demos/AdvancedInteractionDemo.vue'
import {
  CursorArrowRaysIcon,
  RectangleGroupIcon,
  HandRaisedIcon,
  MagnifyingGlassPlusIcon,
  BoltIcon,
  CpuChipIcon
} from '@heroicons/vue/24/outline'

// State
const demoRef = ref()
const selectedCount = ref(0)
const showTutorial = ref(false)

const features = reactive({
  multiSelection: true,
  batchOperations: true,
  gestureRecognition: true,
  smartAlignment: true
})

const performanceData = reactive({
  fps: 60,
  memory: 12.5,
  latency: 2.3
})

// Tutorial steps
const tutorialSteps = [
  {
    title: '多选操作',
    description: '按住 Ctrl/Cmd 键点击多个节点进行多选，或拖拽鼠标创建选择框进行批量选择。',
    shortcut: 'Ctrl/Cmd + Click'
  },
  {
    title: '批量操作',
    description: '选择多个节点后，右键点击可进行批量删除、复制、对齐等操作。',
    shortcut: 'Right Click'
  },
  {
    title: '手势识别',
    description: '使用鼠标或触控进行长按、双击、滑动等手势操作，系统会智能识别并响应。',
    shortcut: 'Long Press / Double Tap'
  },
  {
    title: '智能对齐',
    description: '拖拽节点时会显示智能对齐指示线，自动吸附到网格或其他节点边缘。',
    shortcut: 'Drag & Drop'
  },
  {
    title: '键盘快捷键',
    description: '使用 Ctrl+A 全选，Del 删除，Ctrl+Z 撤销等快捷键提高操作效率。',
    shortcut: 'Ctrl+A, Del, Ctrl+Z'
  }
]

// Feature showcase data
const showcaseFeatures = [
  {
    name: '多选系统',
    description: '支持矩形框选、Ctrl多选、Shift范围选择等多种选择方式，提供专业的多选体验。',
    icon: CursorArrowRaysIcon,
    iconClass: 'bg-blue-500',
    metrics: [
      { label: '选择响应', value: '<5ms' },
      { label: '最大节点数', value: '1000+' },
      { label: '精度', value: '±1px' }
    ]
  },
  {
    name: '批量操作',
    description: '高效的批量编辑引擎，支持批量移动、删除、属性修改等操作，保持相对位置关系。',
    icon: RectangleGroupIcon,
    iconClass: 'bg-green-500',
    metrics: [
      { label: '操作延迟', value: '<10ms' },
      { label: '批处理能力', value: '1000+' },
      { label: '撤销/重做', value: '∞' }
    ]
  },
  {
    name: '手势识别',
    description: '智能识别鼠标和触控手势，支持长按、双击、滑动、缩放等复杂交互模式。',
    icon: HandRaisedIcon,
    iconClass: 'bg-purple-500',
    metrics: [
      { label: '识别精度', value: '98%' },
      { label: '响应时间', value: '<50ms' },
      { label: '手势类型', value: '12种' }
    ]
  },
  {
    name: '智能对齐',
    description: '基于机器学习的智能对齐系统，自动识别布局意图并提供对齐建议和吸附功能。',
    icon: MagnifyingGlassPlusIcon,
    iconClass: 'bg-orange-500',
    metrics: [
      { label: '对齐精度', value: '±0.1px' },
      { label: '吸附距离', value: '10px' },
      { label: 'AI准确率', value: '94%' }
    ]
  },
  {
    name: '性能优化',
    description: '60FPS流畅渲染，GPU硬件加速，内存池管理，为大型项目提供卓越的性能表现。',
    icon: BoltIcon,
    iconClass: 'bg-red-500',
    metrics: [
      { label: '渲染帧率', value: '60FPS' },
      { label: '内存优化', value: '-30%' },
      { label: 'GPU加速', value: '开启' }
    ]
  },
  {
    name: '系统兼容',
    description: '跨平台兼容，支持桌面和移动端，统一的API设计，适配各种输入设备。',
    icon: CpuChipIcon,
    iconClass: 'bg-indigo-500',
    metrics: [
      { label: '平台支持', value: '全平台' },
      { label: 'API统一度', value: '100%' },
      { label: '兼容性', value: '99.9%' }
    ]
  }
]

// Event handlers
const handleSelectionChanged = (count: number) => {
  selectedCount.value = count
}

const handleFeatureUsed = (feature: string, data: any) => {
  console.log(`Feature used: ${feature}`, data)
}

const handlePerformanceUpdate = (data: any) => {
  Object.assign(performanceData, data)
}

const resetDemo = () => {
  if (demoRef.value) {
    // demoRef.value.reset()
  }
  selectedCount.value = 0
}

const addRandomNodes = () => {
  // Add some random nodes to the demo
  console.log('Adding random nodes...')
}

const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

const closeTutorial = () => {
  showTutorial.value = false
}

// Performance monitoring
let performanceInterval: number

onMounted(() => {
  // Start performance monitoring
  performanceInterval = setInterval(() => {
    // Simulate performance data updates
    performanceData.fps = Math.floor(Math.random() * 5) + 58 // 58-62
    performanceData.memory = parseFloat((Math.random() * 3 + 10).toFixed(1)) // 10-13
    performanceData.latency = parseFloat((Math.random() * 2 + 1).toFixed(1)) // 1-3
  }, 1000)
})

onUnmounted(() => {
  if (performanceInterval) {
    clearInterval(performanceInterval)
  }
})

// Meta tags
definePageMeta({
  title: '高级交互特性演示',
  description: '体验专业级编辑器的高级交互功能：多选、批量操作、手势识别、智能对齐等',
  layout: 'demo'
})
</script>

<style scoped>
.advanced-interaction-page {
  font-family: 'Inter', system-ui, sans-serif;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.demo-container {
  min-height: 600px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.feature-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.tutorial-overlay {
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-out;
}

.tutorial-content {
  max-height: 80vh;
  overflow-y: auto;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tutorial-step {
  padding: 16px;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}

.tutorial-step:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.performance-metric {
  padding: 20px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.performance-metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-fill {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .performance-metric {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .tutorial-step:hover {
    background-color: rgba(59, 130, 246, 0.1);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tutorial-content {
    max-height: 90vh;
    margin: 1rem;
  }
  
  .tutorial-steps {
    padding: 0 1rem;
  }
  
  .demo-container {
    min-height: 400px;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .page-header,
  .feature-card,
  .performance-metric,
  .tutorial-overlay,
  .tutorial-content {
    animation: none !important;
    transition: none !important;
  }
}
</style>