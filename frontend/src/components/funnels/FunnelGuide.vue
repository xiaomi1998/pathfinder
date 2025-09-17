<template>
  <div v-if="!isDismissed" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">🚀 开始您的漏斗分析之旅！</h2>
            <p class="text-gray-600 mt-1">三步轻松完成漏斗搭建与数据分析，开始优化您的业务转化</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
          <!-- Step 1 -->
          <div class="relative">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="font-semibold text-gray-900 flex items-center">
                  <span class="mr-2">🎯</span>创建漏斗结构
                </h3>
                <p class="text-sm text-gray-600 mt-1 mb-2">
                  使用行业模板快速开始，或自定义设计您的转化路径
                </p>
                <div class="space-y-1">
                  <button 
                    @click="showTemplateModal"
                    class="block w-full text-left text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    📋 使用行业模板 (推荐)
                  </button>
                  <button 
                    @click="$router.push('/funnels/create')"
                    class="block w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    🛠️ 自定义创建
                  </button>
                </div>
              </div>
            </div>
            <!-- 改进的连接线 - 只在步骤1和2之间显示 -->
            <div class="hidden md:block absolute top-4 -right-4 w-8 h-0.5 bg-gray-300 z-0"></div>
          </div>

          <!-- Step 2 -->
          <div class="relative">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="font-semibold text-gray-900 flex items-center">
                  <span class="mr-2">📊</span>录入数据
                </h3>
                <p class="text-sm text-gray-600 mt-1 mb-2">
                  定期录入各阶段的真实数据，追踪转化表现
                </p>
                <button 
                  @click="$router.push('/data-entry')"
                  class="text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center"
                >
                  立即录入数据
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
            <!-- 改进的连接线 - 只在步骤2和3之间显示 -->
            <div class="hidden md:block absolute top-4 -right-4 w-8 h-0.5 bg-gray-300 z-0"></div>
          </div>

          <!-- Step 3 -->
          <div class="relative">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="font-semibold text-gray-900 flex items-center">
                  <span class="mr-2">📈</span>分析优化
                </h3>
                <p class="text-sm text-gray-600 mt-1 mb-2">
                  查看可视化分析报告，发现转化瓶颈，优化业务流程
                </p>
                <button 
                  @click="$router.push('/dashboard')"
                  class="text-sm text-orange-600 hover:text-orange-700 font-medium inline-flex items-center"
                >
                  查看仪表盘
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Features Section -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tips Section -->
          <div class="p-4 bg-white bg-opacity-70 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span class="mr-2">💡</span>使用提示
            </h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li class="flex items-start">
                <span class="text-blue-500 mr-2 mt-0.5">•</span>
                <span>选择与您行业匹配的模板，5分钟快速搭建专业漏斗</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-500 mr-2 mt-0.5">•</span>
                <span>日历显示绿色表示已录入数据，红色提醒您补充数据</span>
              </li>
              <li class="flex items-start">
                <span class="text-orange-500 mr-2 mt-0.5">•</span>
                <span>漏斗可视化自动计算转化率，展示瓶颈环节</span>
              </li>
            </ul>
          </div>

          <!-- Quick Actions Section -->
          <div class="p-4 bg-white bg-opacity-70 rounded-lg">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <span class="mr-2">⚡</span>快速操作
            </h3>
            <div class="space-y-2">
              <button 
                @click="showTemplateModal"
                class="w-full text-left p-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors flex items-center"
              >
                <span class="mr-2">🏭</span>
                查看7个行业模板
              </button>
              <button 
                @click="$router.push('/data-entry')"
                class="w-full text-left p-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors flex items-center"
              >
                <span class="mr-2">📝</span>
                立即录入今日数据
              </button>
              <button 
                @click="$router.push('/dashboard')"
                class="w-full text-left p-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors flex items-center"
              >
                <span class="mr-2">📊</span>
                查看数据分析
              </button>
            </div>
          </div>
        </div>

        <!-- Status Indicator -->
        <div class="mt-6 flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center space-x-4">
            <span class="flex items-center">
              <div class="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
              支持7个行业模板
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
              实时数据可视化
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-purple-400 rounded-full mr-1"></div>
              趋势分析报告
            </span>
          </div>
          <span class="text-gray-400">轻点"使用帮助"可重新显示此指南</span>
        </div>
      </div>

      <!-- Close button -->
      <button
        @click="dismissGuide"
        class="ml-4 text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="隐藏指南"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDismissed = ref(false)

// 添加事件发射器
const emit = defineEmits<{
  'show-template-modal': []
}>()

// Check if guide has been dismissed before
onMounted(() => {
  const dismissed = localStorage.getItem('funnelGuideDismissed')
  if (dismissed === 'true') {
    isDismissed.value = true
  }
})

const dismissGuide = () => {
  isDismissed.value = true
  localStorage.setItem('funnelGuideDismissed', 'true')
}

// Provide a way to show the guide again
const showGuide = () => {
  isDismissed.value = false
  localStorage.removeItem('funnelGuideDismissed')
}

// 显示模板弹窗的方法
const showTemplateModal = () => {
  emit('show-template-modal')
}

defineExpose({
  showGuide
})
</script>