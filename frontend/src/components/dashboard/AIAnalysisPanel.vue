<template>
  <div class="ai-analysis-panel bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div class="analysis-header flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
      <div class="analysis-title text-lg font-semibold text-gray-900 flex items-center">
        <CpuChipIcon class="w-5 h-5 mr-2 text-blue-600" />
        智能分析报告
      </div>
      <div class="credits-info text-xs text-gray-500 flex items-center gap-2">
        <StarIcon class="w-4 h-4" />
        剩余 <span class="bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">{{ credits }}</span> 次
      </div>
    </div>

    <!-- 基础洞察 -->
    <div v-if="basicInsights" class="brief-analysis mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
      <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
        <ChartBarIcon class="w-4 h-4 mr-2" />
        关键洞察
      </h4>
      <p class="text-xs text-gray-600 leading-relaxed">{{ basicInsights }}</p>
    </div>

    <!-- 详细分析 -->
    <div class="detailed-analysis relative mb-4">
      <div class="detailed-content bg-gray-50 rounded-lg p-4 border border-gray-200 relative overflow-hidden">
        <!-- 预览内容 -->
        <div class="preview-insights" :class="{ 'blur-sm opacity-60': !analysisUnlocked }">
          <div class="analysis-insight mb-3">
            <div class="insight-title text-xs font-semibold text-gray-900 mb-1 flex items-center">
              <ExclamationTriangleIcon class="w-4 h-4 mr-2 text-orange-500" />
              转化瓶颈分析
            </div>
            <div class="insight-content text-xs text-gray-600 leading-relaxed">
              {{ bottleneckAnalysis }}
            </div>
          </div>

          <div class="analysis-insight mb-3">
            <div class="insight-title text-xs font-semibold text-gray-900 mb-1 flex items-center">
              <LightBulbIcon class="w-4 h-4 mr-2 text-green-500" />
              优化建议
            </div>
            <div class="insight-content text-xs text-gray-600 leading-relaxed">
              {{ optimizationSuggestions }}
            </div>
          </div>

          <div class="analysis-insight">
            <div class="insight-title text-xs font-semibold text-gray-900 mb-1 flex items-center">
              <ChartBarIcon class="w-4 h-4 mr-2 text-purple-500" />
              预期效果与ROI
            </div>
            <div class="insight-content text-xs text-gray-600 leading-relaxed">
              {{ roiAnalysis }}
            </div>
          </div>
        </div>
        
        <!-- 付费覆盖层 -->
        <div v-if="!analysisUnlocked" class="premium-overlay absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white">
          <div class="premium-content text-center bg-white p-4 rounded-lg shadow-lg border-2 border-blue-600 max-w-xs">
            <CrownIcon class="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div class="premium-title text-sm font-bold text-gray-900 mb-2">解锁完整AI分析</div>
            <div class="premium-desc text-xs text-gray-600 mb-4 leading-relaxed">
              获取详细的转化瓶颈分析、优化建议<br>
              和ROI预测，助力业务增长
            </div>
            <button 
              @click="$emit('analyze')"
              :disabled="loading || credits <= 0"
              :class="[
                'w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
                credits > 0 && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              <template v-if="loading">
                <div class="flex items-center justify-center">
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  AI分析中...
                </div>
              </template>
              <template v-else-if="credits > 0">
                <CpuChipIcon class="w-4 h-4 inline mr-2" />
                开始AI分析 (消耗1次)
              </template>
              <template v-else>
                分析次数已用完
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析完成后的操作按钮 -->
    <div v-if="analysisUnlocked" class="analysis-actions mt-4 p-3 bg-blue-50 rounded-lg">
      <div class="flex justify-between items-center">
        <div>
          <div class="text-sm font-semibold text-gray-900 mb-1">查看完整分析报告</div>
          <div class="text-xs text-gray-600">获取详细的执行方案、时间安排和ROI分析</div>
        </div>
        <button 
          @click="goToFullReport"
          class="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
          查看详情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  CpuChipIcon, 
  StarIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  LightBulbIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline'
import { StarIcon as CrownIcon } from '@heroicons/vue/24/solid'

interface Props {
  funnel?: any
  metrics?: any
  loading?: boolean
}

defineEmits<{
  analyze: []
}>()

const props = defineProps<Props>()
const router = useRouter()

// Mock data - 这里可以根据实际需求调用AI服务
const credits = 7
const analysisUnlocked = false

// 基于数据生成基础洞察
const basicInsights = computed(() => {
  if (!props.metrics) return '选择漏斗后将显示基础分析洞察'
  
  const conversionRate = props.metrics.overallConversionRate || 0
  const totalEntries = props.metrics.totalEntries || 0
  
  if (conversionRate > 10) {
    return `本漏斗转化表现优异，总转化率达${conversionRate.toFixed(1)}%，建议保持当前策略并优化细节。`
  } else if (conversionRate > 5) {
    return `本漏斗转化率为${conversionRate.toFixed(1)}%，表现良好，但仍有优化空间，特别是转化率较低的环节。`
  } else {
    return `本漏斗转化率为${conversionRate.toFixed(1)}%，低于行业平均水平，建议重点关注转化瓶颈并制定优化方案。`
  }
})

const bottleneckAnalysis = computed(() => {
  if (!props.metrics?.stageMetrics || props.metrics.stageMetrics.length === 0) {
    return '暂无数据进行瓶颈分析...'
  }
  
  const stages = props.metrics.stageMetrics
  let bottleneck = '数据分析中...'
  
  // 找到转化率最低的环节
  const lowestStage = stages.reduce((min: any, stage: any) => 
    stage.conversionRate < min.conversionRate ? stage : min, 
    stages[0] // 提供初始值
  )
  
  if (lowestStage) {
    bottleneck = `「${lowestStage.nodeName}」环节转化率最低(${lowestStage.conversionRate.toFixed(1)}%)，是主要转化瓶颈...`
  }
  
  return bottleneck
})

const optimizationSuggestions = computed(() => {
  if (!props.metrics) return '获取数据后将提供个性化优化建议...'
  
  return `• 稳健优化策略：渐进式改进，2-3个月见效...\n• 激进增长策略：全面升级，1个月快速见效...\n点击AI分析后可选择偏好策略`
})

const roiAnalysis = computed(() => {
  if (!props.metrics) return '分析投资回报率预期...'
  
  const revenue = props.metrics.totalRevenue || 0
  return `保守预期：月营收增长15-20%，投资回报率300%...\n乐观预期：月营收增长38%，预期收益¥${(revenue * 1.2).toLocaleString()}...`
})

const goToFullReport = () => {
  router.push('/analysis-report')
}
</script>

<style scoped>
.analysis-insight {
  border-left: 2px solid transparent;
  padding-left: 8px;
}

.blur-sm {
  filter: blur(1px);
}

.premium-overlay {
  backdrop-filter: blur(1px);
}

.analysis-actions {
  border: 1px solid #e5e7eb;
}
</style>