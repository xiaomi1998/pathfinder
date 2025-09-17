<template>
  <div class="dashboard-layout bg-gradient-pathfinder min-h-screen p-2">
    <!-- 主内容区域 -->
    <div class="main-content" id="mainContent">
      <!-- 头部区域 -->
      <div class="card-pathfinder header-with-reminder animate-slide-in">
        <div class="header-top">
          <div class="header-left">
            <h1>仪表盘总览</h1>
            <p>欢迎回来，今天是 {{ formatDate(new Date(), 'YYYY年MM月DD日') }}</p>
          </div>
          <div class="header-stats">
            <div class="stat-item">
              <div class="stat-value missing number-display-medium">{{ missingDaysCount }}</div>
              <div class="stat-label label-display-small">天缺失</div>
            </div>
            <div class="stat-item">
              <div class="stat-value updated number-display-medium">{{ updatedDaysCount }}</div>
              <div class="stat-label label-display-small">天已更新</div>
            </div>
            <div class="stat-item">
              <div class="stat-value rate number-display-medium">{{ completionRate }}%</div>
              <div class="stat-label label-display-small">完成率</div>
            </div>
            <button class="btn-reminder" @click="goToDataEntry()">
              <i class="fas fa-plus"></i>
              立即录入
            </button>
          </div>
        </div>
        <div id="horizontalCalendarContainer" class="horizontal-calendar">
          <div class="calendar-strip">
            <div
              v-for="day in calendarDays"
              :key="day.dateStr"
              :class="['day-cell', day.status]"
              @click="handleDateClick(day.dateStr, day.status, day.data)"
            >
              <div class="day-cell-content">
                <div>
                  <div class="day-cell-date">{{ day.display }}</div>
                  <div class="day-cell-day">{{ day.dayOfWeek }}</div>
                </div>
                <div class="day-cell-status"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 核心漏斗可视化 -->
      <div class="card-pathfinder funnel-visualization animate-slide-in">
        <h2 class="section-title">
          <i class="fas fa-filter section-icon"></i>
          核心漏斗可视化
        </h2>
        
        <div class="funnel-selector">
          <div class="funnel-tabs">
            <div 
              v-for="funnel in availableFunnels" 
              :key="funnel.id"
              :class="['funnel-tab', { active: selectedFunnel?.id === funnel.id }]" 
              @click="switchFunnel(funnel)"
            >
              {{ funnel.name }}
            </div>
          </div>
        </div>

        <div class="funnel-analysis-layout">
          <div class="funnel-main">
            <div v-if="selectedFunnel && funnelMetrics" class="funnel-container" id="salesFunnel">
              <template v-for="(stage, index) in funnelStages" :key="stage.id">
                <div 
                  :class="`funnel-stage stage-${index + 1}`"
                  @click="onStageClick(stage)"
                >
                  <div class="stage-content">
                    <div class="stage-info">
                      <div class="stage-name">{{ stage.name }}</div>
                    </div>
                    <div>
                      <div class="stage-count number-display-large">{{ formatLargeNumber(stage.count) }}</div>
                      <div class="stage-rate label-display-medium">{{ formatPercent(stage.conversionRate) }}%</div>
                    </div>
                  </div>
                </div>
                
                <div v-if="index < funnelStages.length - 1" :key="`arrow-${index}`" class="funnel-arrow">
                  <i class="fas fa-chevron-down"></i>
                </div>
              </template>
            </div>
          </div>

          <!-- AI 智能分析面板 -->
          <div class="ai-analysis-panel">
            <div class="analysis-header">
              <div class="analysis-title">
                <i class="fas fa-brain analysis-icon"></i>
                智能分析报告
              </div>
              <div class="credits-info">
                <i class="fas fa-star"></i>
                剩余 <span class="credits-badge" id="remainingCredits">{{ remainingCredits }}</span> 次
              </div>
            </div>

            <div class="brief-analysis">
              <h4><i class="fas fa-chart-line mr-2"></i>关键洞察</h4>
              <p>{{ briefAnalysisText }}</p>
            </div>

            <div class="detailed-analysis">
              <div class="detailed-content">
                <div :class="['preview-insights', { 'show-full': showFullAnalysis }]">
                  <div class="analysis-insight">
                    <div class="insight-title">
                      <i class="fas fa-exclamation-triangle insight-icon" style="color: #f59e0b;"></i>
                      转化瓶颈分析
                    </div>
                    <div class="insight-content">
                      {{ bottleneckAnalysis }}
                    </div>
                  </div>

                  <div class="analysis-insight">
                    <div class="insight-title">
                      <i class="fas fa-lightbulb insight-icon" style="color: #10b981;"></i>
                      优化建议 - 双策略可选
                    </div>
                    <div class="insight-content">
                      <div v-if="!showFullAnalysis" class="placeholder-text">
                        基于您的漏斗数据，AI将生成个性化的优化策略建议...
                      </div>
                      <div v-else-if="strategies.length > 0" class="dynamic-strategies">
                        <div v-for="strategy in strategies" :key="strategy.id" class="strategy-preview">
                          • {{ strategy.title }}：{{ extractStrategyPreview(strategy.content) }}
                        </div>
                      </div>
                      <div v-else class="placeholder-text">
                        点击"开始AI分析"后将生成策略选项
                      </div>
                    </div>
                  </div>

                  <div class="analysis-insight">
                    <div class="insight-title">
                      <i class="fas fa-chart-bar insight-icon" style="color: #8b5cf6;"></i>
                      预期效果与ROI
                    </div>
                    <div class="insight-content">
                      <div v-if="!showFullAnalysis" class="placeholder-text">
                        AI将为您预测不同策略的ROI和收益期望...
                      </div>
                      <div v-else-if="aiAnalysisData?.roi_predictions" class="roi-content">
                        {{ formatROIPrediction(aiAnalysisData.roi_predictions) }}
                      </div>
                      <div v-else class="no-data-text">
                        暂无ROI预测数据，请完成策略选择后生成完整报告
                      </div>
                    </div>
                  </div>

                  <div class="analysis-insight">
                    <div class="insight-title">
                      <i class="fas fa-calendar-alt insight-icon" style="color: #0052d9;"></i>
                      时间趋势洞察
                    </div>
                    <div class="insight-content">
                      <div v-if="!showFullAnalysis" class="placeholder-text">
                        AI将分析您的时间趋势数据并提供洞察...
                      </div>
                      <div v-else-if="aiAnalysisData?.time_insights" class="time-insights-content">
                        {{ aiAnalysisData.time_insights }}
                      </div>
                      <div v-else class="no-data-text">
                        {{ timeTrendInsights }}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="!showFullAnalysis" class="premium-overlay">
                  <div class="premium-content">
                    <i class="fas fa-crown premium-icon"></i>
                    <div class="premium-title">解锁完整AI分析</div>
                    <div class="premium-desc">
                      基于您的漏斗数据生成个性化分析报告，<br>
                      包含策略建议和ROI预测
                    </div>
                    <button class="btn-analyze" @click="showAnalysisResult" :disabled="analysisLoading || isAnalysisLocked">
                      <i :class="['fas', analysisLoading ? 'fa-spinner fa-spin' : (analysisStep === 1 ? 'fa-brain' : 'fa-check-circle')]"></i>
                      {{ analysisButtonText }}
                    </button>
                  </div>
                </div>

                <!-- 策略选择界面 - 只在策略未锁定时显示 -->
                <div v-if="showFullAnalysis && !selectedStrategy && !isStrategyLocked" class="suggestion-options" id="analysisOptions">
                  <div 
                    v-for="strategy in strategies" 
                    :key="strategy.id"
                    :class="['suggestion-option', { selected: selectedStrategyId === strategy.id }]"
                    @click="selectAnalysisSuggestion(strategy.id)"
                  >
                    <div class="option-radio"></div>
                    <div class="option-header">
                      <div class="option-title">{{ strategy.title }}</div>
                      <div :class="`option-badge ${strategy.badgeClass}`">{{ strategy.badge }}</div>
                    </div>
                    <div class="option-content" v-html="strategy.content"></div>
                  </div>
                  
                  <!-- 策略选择提示信息 -->
                  <div v-if="strategySelectionCount >= 1 && !isStrategyLocked" class="strategy-info" style="background: #e8f4fd; border: 1px solid #b3d7ff; border-radius: 6px; padding: 12px; margin-top: 16px; font-size: 12px; color: #0066cc;">
                    <i class="fas fa-info-circle" style="margin-right: 6px;"></i>
                    <strong>提示：</strong>选择策略并生成报告后，该漏斗数据的策略将被锁定。如需重新选择，请录入新的漏斗数据。
                  </div>
                </div>

                <!-- 确认选择界面 -->
                <div v-if="selectedStrategy" class="choice-confirmation show">
                  <div class="choice-text">
                    <i class="fas fa-check-circle mr-1"></i>
                    {{ isStrategyLocked ? '当前漏斗数据的策略已确定，无法更改' : '已选择策略，查看完整报告获取详细执行方案' }}
                    <div v-if="isStrategyLocked" style="font-size: 11px; color: #f59e0b; margin-top: 4px;">
                      <i class="fas fa-lock"></i> 当前漏斗数据的策略选择已锁定
                    </div>
                  </div>
                  <div class="choice-actions">
                    <button 
                      class="btn-confirm" 
                      @click="goToFullReport()" 
                      :disabled="reportGenerationLoading"
                    >
                      <i v-if="reportGenerationLoading" class="fas fa-spinner fa-spin" style="margin-right: 6px;"></i>
                      {{ reportGenerationLoading ? '生成报告中...' : '查看完整报告' }}
                    </button>
                    <button 
                      v-if="!isStrategyLocked && !reportGenerationLoading" 
                      class="btn-reselect" 
                      @click="reselectAnalysisStrategy()"
                    >
                      重新选择
                    </button>
                  </div>
                  
                  <!-- 报告生成进度条 -->
                  <div v-if="reportGenerationLoading" class="progress-container" style="margin-top: 16px;">
                    <div class="progress-bar-container" style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                      <div 
                        class="progress-bar" 
                        :style="{ 
                          width: reportGenerationProgress + '%', 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #0052d9, #4080ff)', 
                          transition: 'width 0.3s ease'
                        }"
                      ></div>
                    </div>
                    <div class="progress-text" style="margin-top: 8px; font-size: 12px; color: #6b7280; text-align: center;">
                      正在生成个性化AI分析报告... {{ reportGenerationProgress }}%
                    </div>
                    <div class="progress-steps" style="margin-top: 4px; font-size: 11px; color: #9ca3af; text-align: center;">
                      {{ getProgressStepText() }}
                    </div>
                  </div>
                </div>

                <!-- 完整分析内容（类似HTML版本的详细展示） -->
                <div v-if="showFullAnalysis && selectedStrategy" style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #0052d9;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 4px;">
                        基于「{{ selectedStrategy.title }}」的详细执行方案
                      </div>
                      <div style="font-size: 12px; color: #6b7280;">
                        获取完整的步骤规划、时间安排和预期ROI分析
                      </div>
                    </div>
                    <button @click="goToFullReport()" style="padding: 8px 16px; background: #0052d9; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                      <i class="fas fa-external-link-alt"></i>
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 转化趋势分析 -->
      <div class="card-pathfinder chart-card" style="margin-bottom: 24px;">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">
            <i class="fas fa-chart-line mr-2 text-blue-600"></i>转化趋势分析
          </h3>
          <div class="text-sm text-gray-500">
            {{ trendData.labels ? `显示最近 ${trendData.labels.length} 个数据点` : '暂无数据' }}
          </div>
        </div>
        <div v-if="trendLoading" class="flex items-center justify-center" style="height: 320px;">
          <div class="text-center">
            <i class="fas fa-spinner fa-spin text-blue-600 text-2xl mb-2"></i>
            <p class="text-sm text-gray-500">加载趋势数据中...</p>
          </div>
        </div>
        <div v-else-if="!trendData.labels || trendData.labels.length === 0" class="flex items-center justify-center" style="height: 320px;">
          <div class="text-center">
            <i class="fas fa-chart-area text-gray-300 text-4xl mb-3"></i>
            <p class="text-gray-500">暂无趋势数据</p>
            <p class="text-sm text-gray-400 mt-1">请先录入数据</p>
          </div>
        </div>
        <div v-else style="height: 320px;">
          <canvas ref="trendChart" id="trendChart"></canvas>
        </div>
      </div>
      
      <!-- 最近活动 -->
      <div class="card-pathfinder recent-activity" style="margin-bottom: 24px;">
        <h3 class="text-sm font-semibold text-gray-800 mb-2">
          <i class="fas fa-history mr-1 text-blue-600" style="font-size: 10px;"></i>最近活动
        </h3>
        <div v-if="activitiesLoading" class="text-center py-4">
          <i class="fas fa-spinner fa-spin text-blue-600"></i>
          <p class="text-sm text-gray-500 mt-2">加载中...</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-1">
          <div 
            v-for="activity in recentActivities" 
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">
              <i :class="`fas ${activity.icon} text-sm ${activity.color || 'text-gray-500'}`"></i>
            </div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.text }}</div>
              <div class="activity-time">{{ formatRelativeTime(activity.time) }}</div>
            </div>
          </div>
          <!-- 如果没有活动，显示占位符 -->
          <div v-if="recentActivities.length === 0" class="col-span-3 text-center py-4 text-gray-400">
            <i class="fas fa-inbox text-2xl mb-2"></i>
            <p class="text-sm">暂无最近活动</p>
          </div>
        </div>
      </div>

      <!-- 所有漏斗对比 -->
      <div class="card-pathfinder chart-card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">
            <i class="fas fa-layer-group mr-2 text-blue-600"></i>所有漏斗对比
          </h3>
          <div class="text-sm text-gray-500">
            点击漏斗卡片查看详细数据
          </div>
        </div>
        
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-blue-600 text-2xl mb-2"></i>
          <p class="text-sm text-gray-500">加载漏斗数据中...</p>
        </div>
        <div v-else-if="availableFunnels.length === 0" class="text-center py-8">
          <i class="fas fa-funnel-dollar text-gray-300 text-3xl mb-2"></i>
          <p class="text-gray-500">暂无漏斗数据</p>
          <router-link to="/funnels/create" class="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
            创建第一个漏斗 →
          </router-link>
        </div>
        <div v-else class="funnel-comparison">
          <div 
            v-for="funnel in availableFunnels" 
            :key="funnel.id"
            class="mini-funnel" 
            @click="switchFunnel(funnel)"
          >
            <div class="mini-funnel-name">
              {{ funnel.name }}
              <span v-if="funnel.lastUpdated" class="text-xs text-gray-400 ml-2">
                {{ formatDate(funnel.lastUpdated) }}
              </span>
            </div>
            <div class="mini-funnel-viz">
              <div 
                v-for="(stage, index) in getMiniStages(funnel)" 
                :key="stage.id"
                :class="`mini-stage stage-${index + 1}`"
                :style="{ width: `${stage.width}px`, background: stage.color }"
              >
                {{ formatLargeNumber(stage.count) }}
              </div>
            </div>
            <div class="mini-funnel-stats">
              <div>
                <div class="mini-stat-value number-display-small">{{ formatPercent(funnel.overallConversionRate || 0) }}%</div>
                <div class="mini-stat-label label-display-small">转化率</div>
              </div>
              <div>
                <div class="mini-stat-value number-display-small">{{ formatLargeNumber(funnel.totalEntries || 0) }}</div>
                <div class="mini-stat-label label-display-small">总流入</div>
              </div>
              <div>
                <div class="mini-stat-value number-display-small">{{ formatLargeNumber(funnel.totalConversions || 0) }}</div>
                <div class="mini-stat-label label-display-small">总转化</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFunnelStore } from '@/stores/funnel'
import { formatDate, formatPercent, formatNumber, formatLargeNumber, formatCurrency, formatRelativeTime } from '@/utils/dateUtils'
import { dashboardAPI } from '@/api/dashboard'
import { aiAnalysisAPI } from '@/api/aiAnalysis'

// Chart.js import (需要安装 chart.js)
let Chart: any = null

const router = useRouter()
const funnelStore = useFunnelStore()
const route = useRoute()

// 状态管理  
const loading = ref(false)
const analysisLoading = ref(false)
const reportGenerationLoading = ref(false)
const reportGenerationProgress = ref(0)
const trendLoading = ref(false)
const activitiesLoading = ref(false)
const showFullAnalysis = ref(false)
const selectedStrategyId = ref<string | null>(null)
const selectedStrategy = ref<any>(null)
const strategySelectionCount = ref(0) // 跟踪策略选择次数
const isStrategyLocked = ref(false) // 策略是否已锁定
const isAnalysisLocked = ref(false) // 分析是否已锁定
const analysisStep = ref(1) // 当前分析步骤：1=初始，2=策略选择，3=完整报告
const lastDataUpdateTime = ref<string | null>(null) // 最新数据更新时间

// 数据状态
const availableFunnels = ref<any[]>([])
const selectedFunnel = ref<any>(null)
const funnelMetrics = ref<any>(null)
const trendData = ref<any>({ labels: [], conversionRates: [], leadCounts: [] })
const recentActivities = ref<any[]>([])
const calendarDays = ref<any[]>([])

// 统计数据
const missingDaysCount = ref(0)
const updatedDaysCount = ref(0)
const completionRate = ref(0)
const remainingCredits = ref(10)

// 图表相关
const trendChart = ref<HTMLCanvasElement>()

// AI分析相关
const aiAnalysisData = ref<any>(null)
const analysisId = ref<string | null>(null)
const keyInsight = ref<string>('')
const strategies = ref<any[]>([])

// 计算属性
const funnelStages = computed(() => {
  if (!selectedFunnel.value || !funnelMetrics.value) return []
  
  // 基于真实数据构建漏斗阶段
  if (selectedFunnel.value.nodes && selectedFunnel.value.nodes.length > 0) {
    return selectedFunnel.value.nodes.map((node: any, index: number) => {
      const stageMetric = funnelMetrics.value?.stageMetrics?.find((m: any) => m.nodeId === node.id)
      return {
        id: node.id,
        name: node.data?.label || node.data?.name || `Stage ${index + 1}`,
        count: stageMetric?.entries || 0,
        conversionRate: stageMetric?.conversionRate || 0
      }
    })
  }
  
  // 如果没有nodes，返回空数组
  return []
})

const averageCycleDays = computed(() => {
  return funnelMetrics.value?.averageCycleDays || 0
})

const averageOrderValue = computed(() => {
  return funnelMetrics.value?.averageOrderValue || 0
})

const monthlyRevenue = computed(() => {
  return Math.round((funnelMetrics.value?.totalRevenue || 0) / 1000)
})

const briefAnalysisText = computed(() => {
  // 优先显示AI生成的关键洞察
  if (keyInsight.value) {
    return keyInsight.value
  }
  
  if (!funnelMetrics.value) return '选择漏斗后将自动生成AI分析洞察'
  
  const conversionRate = funnelMetrics.value.overallConversionRate || 0
  
  if (conversionRate === 0) return '正在生成AI分析...'
  
  return '正在分析数据，请稍候...'
})

const bottleneckAnalysis = computed(() => {
  if (!funnelStages.value.length) return '暂无数据分析'
  
  // 找出转化率最低的环节
  let minConversion = 100
  let bottleneckStage = ''
  
  for (let i = 1; i < funnelStages.value.length; i++) {
    const rate = funnelStages.value[i].conversionRate
    if (rate < minConversion) {
      minConversion = rate
      bottleneckStage = funnelStages.value[i].name
    }
  }
  
  return `「${bottleneckStage}」环节转化率为${minConversion.toFixed(1)}%，建议重点关注此环节的优化。`
})

const timeTrendInsights = computed(() => {
  if (aiAnalysisData.value?.time_analysis) {
    return aiAnalysisData.value.time_analysis
  }
  return '暂无足够的时间趋势数据，请持续使用系统收集数据。'
})

// 方法

// 提取策略预览文本
const extractStrategyPreview = (content: string) => {
  if (!content) return ''
  
  // 提取方案特点部分作为预览
  const match = content.match(/方案特点：([^<]*)/)
  if (match && match[1]) {
    return match[1].trim()
  }
  
  // 如果没有找到方案特点，移除HTML标签并提取前50个字符
  const textContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')
  return textContent.length > 50 ? textContent.substring(0, 50) + '...' : textContent
}

// 格式化ROI预测
const formatROIPrediction = (roiData: any) => {
  if (!roiData) return '暂无ROI预测数据，请完成策略选择后生成完整报告'
  
  // 根据AI返回的数据结构格式化显示
  if (typeof roiData === 'string') {
    return roiData
  } else if (roiData.conservative && roiData.aggressive) {
    return `策略A预期：${roiData.conservative}，策略B预期：${roiData.aggressive}`
  }
  
  return '正在生成ROI预测...'
}

const loadFunnels = async () => {
  try {
    loading.value = true
    await funnelStore.fetchFunnels()
    
    // 为每个漏斗加载最新的指标数据
    const funnelsWithMetrics = await Promise.all(
      funnelStore.funnels.map(async (funnel) => {
        try {
          const response = await dashboardAPI.getFunnelMetrics(funnel.id)
          if (response.data.success && response.data.data) {
            const metrics = response.data.data
            return {
              ...funnel,
              overallConversionRate: metrics.overallConversionRate,
              totalEntries: metrics.totalEntries,
              totalConversions: metrics.totalConversions,
              totalRevenue: metrics.totalRevenue,
              stageMetrics: metrics.stageMetrics,
              lastUpdated: metrics.lastUpdated
            }
          }
        } catch (error) {
          console.error(`Error loading metrics for funnel ${funnel.id}:`, error)
        }
        return funnel
      })
    )
    
    availableFunnels.value = funnelsWithMetrics
    
    // 默认选择第一个漏斗
    if (availableFunnels.value.length > 0) {
      await switchFunnel(availableFunnels.value[0])
    }
  } catch (error) {
    console.error('Error loading funnels:', error)
  } finally {
    loading.value = false
  }
}

const switchFunnel = async (funnel: any) => {
  if (selectedFunnel.value?.id === funnel.id) return
  
  try {
    selectedFunnel.value = funnel
    
    // 加载漏斗详情和最新数据
    await Promise.all([
      loadFunnelMetrics(funnel.id),
      loadTrendData(funnel.id)
    ])
    
    // 数据加载完成后，重新初始化策略锁定状态
    // 这样可以基于新的数据内容来判断锁定状态
    setTimeout(() => {
      initializeStrategyLockState()
    }, 100)
  } catch (error) {
    console.error('Error switching funnel:', error)
  }
}

const loadFunnelMetrics = async (funnelId: string) => {
  try {
    const response = await dashboardAPI.getFunnelMetrics(funnelId)
    if (response.data.success) {
      funnelMetrics.value = response.data.data
      
      // 加载指标后自动触发AI分析第一步（免费）
      await loadAIAnalysis(funnelId)
    }
  } catch (error) {
    console.error('Error loading funnel metrics:', error)
    // 使用空数据
    funnelMetrics.value = {
      funnelId: funnelId,
      overallConversionRate: 0,
      totalEntries: 0,
      totalConversions: 0,
      averageCycleDays: 0,
      averageOrderValue: 0,
      totalRevenue: 0,
      stageMetrics: [],
      lastUpdated: new Date().toISOString()
    }
  }
}

// 新增：加载AI分析第一步（关键洞察）
// 请求去重缓存
const requestCache = new Map<string, Promise<any>>()
const cacheExpiration = new Map<string, number>()
const CACHE_DURATION = 30000 // 30秒缓存

const loadAIAnalysis = async (funnelId: string) => {
  if (!funnelId) return
  
  const cacheKey = `ai-analysis-${funnelId}`
  const now = Date.now()
  
  // 检查缓存是否有效
  if (cacheExpiration.has(cacheKey) && cacheExpiration.get(cacheKey)! > now) {
    console.log('🚀 使用缓存的AI分析数据')
    return
  }
  
  // 检查是否已有进行中的请求
  if (requestCache.has(cacheKey)) {
    console.log('⏳ AI分析请求进行中，等待完成')
    return requestCache.get(cacheKey)
  }
  
  const request = async () => {
    try {
      // 先检查分析状态
      const statusResponse = await aiAnalysisAPI.getAnalysisStatus(funnelId)
      if (statusResponse.success && statusResponse.data) {
        // 如果有第二步数据，加载策略选项
        if (statusResponse.data.hasStep2 && statusResponse.data.step2Data) {
          const step2Data = statusResponse.data.step2Data
          if (step2Data.stable_strategy && step2Data.aggressive_strategy) {
            // 更新策略数组
            strategies.value = [
              {
                id: 'conservative',
                title: step2Data.stable_strategy.title,
                badge: step2Data.stable_strategy.tag,
                badgeClass: 'badge-conservative',
                content: `<strong>方案特点：</strong>${step2Data.stable_strategy.features}<br>
                         <strong>核心行动：</strong>${step2Data.stable_strategy.core_actions}<br>
                         <strong>投入成本：</strong>${step2Data.stable_strategy.investment}`
              },
              {
                id: 'aggressive',
                title: step2Data.aggressive_strategy.title,
                badge: step2Data.aggressive_strategy.tag,
                badgeClass: 'badge-aggressive',
                content: `<strong>方案特点：</strong>${step2Data.aggressive_strategy.features}<br>
                         <strong>核心行动：</strong>${step2Data.aggressive_strategy.core_actions}<br>
                         <strong>投入成本：</strong>${step2Data.aggressive_strategy.investment}`
              }
            ]
            showFullAnalysis.value = true
          }
        }
        
        // 如果有第三步数据，加载完整报告的ROI和时间分析
        if (statusResponse.data.hasStep3 && statusResponse.data.step3Data) {
          const step3Data = statusResponse.data.step3Data
          if (step3Data.roi_predictions) {
            aiAnalysisData.value = {
              ...aiAnalysisData.value,
              roi_predictions: step3Data.roi_predictions,
              time_analysis: step3Data.time_analysis
            }
          }
        }
      }
      
      // 获取关键洞察
      const response = await aiAnalysisAPI.getKeyInsights(funnelId)
      
      if (response.success && response.data) {
        aiAnalysisData.value = response.data
        analysisId.value = response.data.analysisId
        
        // 提取30-40字的关键洞察
        if (response.data.key_insight?.summary) {
          keyInsight.value = response.data.key_insight.summary
        } else {
          keyInsight.value = '分析完成，但未能提取关键洞察'
        }
        
        // 设置缓存
        cacheExpiration.set(cacheKey, now + CACHE_DURATION)
        console.log('✅ AI分析数据已缓存')
      } else {
        keyInsight.value = '分析失败，请重试'
      }
    } catch (error) {
      console.error('Error loading AI analysis:', error)
      // 如果AI分析失败，使用默认文本
      keyInsight.value = ''
    } finally {
      requestCache.delete(cacheKey)
    }
  }
  
  requestCache.set(cacheKey, request())
  return requestCache.get(cacheKey)
}

// 更新剩余分析次数
const loadAnalysisQuota = async () => {
  try {
    const response = await aiAnalysisAPI.getQuota()
    if (response.success && response.data) {
      remainingCredits.value = response.data.remainingQuota
    }
  } catch (error) {
    console.error('Error loading analysis quota:', error)
  }
}

const loadTrendData = async (funnelId: string) => {
  try {
    trendLoading.value = true
    // 不传递period参数，获取所有可用数据
    const response = await dashboardAPI.getTrendData(funnelId)
    if (response.data.success && response.data.data) {
      trendData.value = response.data.data
      await nextTick()
      initTrendChart()
    } else {
      // 没有数据时显示空状态
      trendData.value = { labels: [], conversionRates: [], leadCounts: [] }
      await nextTick()
      initTrendChart()
    }
  } catch (error) {
    console.error('Error loading trend data:', error)
    // 使用空数据
    trendData.value = { labels: [], conversionRates: [], leadCounts: [] }
    await nextTick()
    initTrendChart()
  } finally {
    trendLoading.value = false
  }
}

// 加载漏斗数据的封装函数
const loadFunnelData = async (funnelId: string) => {
  await Promise.all([
    loadFunnelMetrics(funnelId),
    loadTrendData(funnelId)
  ])
  
  // 数据加载完成后检测更新状态
  setTimeout(() => {
    checkDataUpdateAndReset()
  }, 100)
}


const loadRecentActivities = async () => {
  try {
    activitiesLoading.value = true
    const response = await dashboardAPI.getRecentActivities(9) // 获取9条最近活动
    console.log('Recent activities response:', response.data)
    if (response.data.success && response.data.data) {
      // 将后端数据映射到前端需要的格式
      recentActivities.value = response.data.data.map(activity => {
        // 根据活动类型设置图标
        let icon = 'fa-circle'
        let color = 'text-gray-500'
        
        switch (activity.type) {
          case 'data_entry':
            icon = 'fa-database'
            color = 'text-blue-600'
            break
          case 'funnel_created':
            icon = 'fa-funnel-dollar'
            color = 'text-green-600'
            break
          case 'report_generated':
            icon = 'fa-chart-line'
            color = 'text-purple-600'
            break
          case 'data_missing':
            icon = 'fa-exclamation-triangle'
            color = 'text-yellow-600'
            break
        }
        
        return {
          id: activity.id,
          icon: icon,
          text: activity.description || activity.title,
          time: activity.timestamp,
          type: activity.type,
          color: color
        }
      })
    } else {
      recentActivities.value = []
    }
  } catch (error) {
    console.error('Error loading recent activities:', error)
    // 使用空数据
    recentActivities.value = []
  } finally {
    activitiesLoading.value = false
  }
}

const calculateDataEntryStats = async () => {
  try {
    // 尝试从API获取真实的数据录入状态
    const response = await dashboardAPI.getDataEntryStatus()
    if (response.data.success && response.data.data) {
      const dataStatus = response.data.data
      
      // 转换数据格式
      const days = []
      let completed = 0
      let missing = 0
      
      // 获取最近14天的日期
      const today = new Date()
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
        const display = `${date.getMonth() + 1}/${date.getDate()}`
        
        const dayData = dataStatus[dateStr]
        const status = dayData?.hasData ? 'completed' : (i === 0 ? 'today' : 'missing')
        
        if (dayData?.hasData) {
          completed++
        } else if (i > 0) { // 不计算今天为缺失
          missing++
        }
        
        days.push({
          dateStr,
          dayOfWeek,
          display,
          status,
          data: dayData
        })
      }
      
      calendarDays.value = days
      missingDaysCount.value = missing
      updatedDaysCount.value = completed
      completionRate.value = completed > 0 ? Math.round((completed / 14) * 100) : 0
    } else {
      // API失败时显示空状态
      calendarDays.value = []
      missingDaysCount.value = 0
      updatedDaysCount.value = 0
      completionRate.value = 0
    }
  } catch (error) {
    console.error('Error loading data entry stats:', error)
    // 发生错误时显示空状态
    calendarDays.value = []
    missingDaysCount.value = 0
    updatedDaysCount.value = 0
    completionRate.value = 0
  }
}

const initTrendChart = async () => {
  if (!trendChart.value || !trendData.value) return
  
  try {
    // 动态导入 Chart.js
    if (!Chart) {
      const ChartModule = await import('chart.js/auto')
      Chart = ChartModule.default
    }
    
    const ctx = trendChart.value.getContext('2d')
    
    // 销毁现有图表
    if (ctx && (ctx as any).chart) {
      (ctx as any).chart.destroy()
    }
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.value.labels || [],
        datasets: [
          {
            label: '总转化率',
            data: trendData.value.conversionRates || [],
            borderColor: '#0052d9',
            backgroundColor: 'rgba(0, 82, 217, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: '线索数量',
            data: trendData.value.leadCounts || [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            suggestedMax: 25,
            ticks: {
              callback: function(value) {
                return value + '%'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#ddd',
            borderWidth: 1
          }
        }
      }
    })
    
    // 保存图表实例以便后续销毁
    ;(ctx as any).chart = chart
  } catch (error) {
    console.error('Error initializing trend chart:', error)
  }
}


const showAnalysisResult = async () => {
  if (remainingCredits.value <= 0) {
    alert('分析次数已用完，请升级到专业版获取更多AI分析次数！')
    return
  }
  
  if (!selectedFunnel.value?.id || !analysisId.value) {
    alert('请先选择一个漏斗')
    return
  }
  
  try {
    analysisLoading.value = true
    analysisStep.value = 2 // 进入第二步：策略选择
    
    // 调用AI分析第二步（策略选项）
    const response = await aiAnalysisAPI.getStrategyOptions(analysisId.value, selectedFunnel.value.id)
    
    if (response.success && response.data) {
      // 更新策略选项为AI生成的内容
      strategies.value = [
        {
          id: 'conservative',
          title: response.data.stable_strategy.title,
          badge: response.data.stable_strategy.tag,
          badgeClass: 'badge-conservative',
          content: `<strong>方案特点：</strong>${response.data.stable_strategy.features}<br>
                   <strong>核心行动：</strong>${response.data.stable_strategy.core_actions}<br>
                   <strong>投入成本：</strong>${response.data.stable_strategy.investment}`
        },
        {
          id: 'aggressive',
          title: response.data.aggressive_strategy.title,
          badge: response.data.aggressive_strategy.tag,
          badgeClass: 'badge-aggressive',
          content: `<strong>方案特点：</strong>${response.data.aggressive_strategy.features}<br>
                   <strong>核心行动：</strong>${response.data.aggressive_strategy.core_actions}<br>
                   <strong>投入成本：</strong>${response.data.aggressive_strategy.investment}`
        }
      ]
      
      showFullAnalysis.value = true
      isAnalysisLocked.value = true // 锁定分析状态
      
      // 更新剩余次数
      await loadAnalysisQuota()
      
      // 显示成功消息
      showSuccessMessage('AI分析完成！已为您生成策略选项')
    }
  } catch (error: any) {
    console.error('Error performing AI analysis:', error)
    
    // 特殊处理配额不足的情况
    if (error.response?.status === 403 || error.response?.data?.error?.includes('次数已用完')) {
      alert('您的AI分析次数已用完！每位用户有10次免费分析机会，您可以：\n\n1. 联系管理员获取更多次数\n2. 查看现有的分析报告\n3. 等待配额重置（如适用）')
    } else {
      alert(error.response?.data?.error || 'AI分析失败，请稍后重试')
    }
  } finally {
    analysisLoading.value = false
  }
}

const selectAnalysisSuggestion = async (strategyId: string) => {
  const dataKey = getFunnelDataKey()
  if (!dataKey) {
    alert('漏斗数据未加载完成，请稍后再试')
    return
  }
  
  selectedStrategyId.value = strategyId
  selectedStrategy.value = strategies.value.find(s => s.id === strategyId)
  
  // 增加当前漏斗数据的策略选择次数
  strategySelectionCount.value++
  
  // 第一次选择策略时立即锁定，不允许再更改
  isStrategyLocked.value = true
  localStorage.setItem(`aiStrategyLocked_${dataKey}`, 'true')
  localStorage.setItem(`aiStrategySelectionCount_${dataKey}`, strategySelectionCount.value.toString())
  localStorage.setItem(`aiSelectedStrategy_${dataKey}`, strategyId)
  
  console.log('策略选择已锁定，自动执行第三步分析')
  
  // 选择策略后自动执行第三步分析
  analysisStep.value = 3 // 进入第三步：完整报告
  
  try {
    reportGenerationLoading.value = true
    reportGenerationProgress.value = 0
    
    // 模拟进度更新
    await simulateProgress(30, 1000)
    
    // 调用第三步API生成完整报告
    const strategyType = selectedStrategy.value.id === 'conservative' ? 'stable' : 'aggressive'
    
    await simulateProgress(70, 1500)
    
    const response = await aiAnalysisAPI.getCompleteReport(
      analysisId.value,
      selectedFunnel.value.id,
      strategyType
    )
    
    await simulateProgress(100, 500)
    
    if (response.success && response.data) {
      // 更新AI分析数据，包含ROI预测和时间分析
      aiAnalysisData.value = {
        ...aiAnalysisData.value,
        roi_predictions: response.data.roi_predictions,
        time_analysis: response.data.time_analysis
      }
      
      console.log('第三步分析完成，完整报告已生成')
      showSuccessMessage('策略选择完成，完整报告已生成！')
    }
  } catch (error: any) {
    console.error('Error executing step 3 analysis:', error)
    showSuccessMessage('策略选择完成，点击查看完整报告获取详细分析')
  } finally {
    setTimeout(() => {
      reportGenerationLoading.value = false
      reportGenerationProgress.value = 0
    }, 500)
  }
  
  // 延迟一下让用户看到选择效果，然后显示确认界面
  setTimeout(() => {
    console.log('Selected analysis strategy:', strategyId, 'Selection count:', strategySelectionCount.value, 'Data key:', dataKey)
  }, 300)
}

const reselectAnalysisStrategy = () => {
  selectedStrategy.value = null
  selectedStrategyId.value = null
}

// 生成漏斗数据的唯一标识符
const getFunnelDataKey = () => {
  if (!selectedFunnel.value?.id || !funnelMetrics.value) return null
  
  // 基于漏斗ID + 数据内容生成唯一标识
  const funnelId = selectedFunnel.value.id
  const dataContent = JSON.stringify({
    stages: funnelStages.value.map(stage => ({
      id: stage.id,
      name: stage.name,
      count: stage.count
    })),
    totalEntries: funnelMetrics.value.totalEntries,
    totalConversions: funnelMetrics.value.totalConversions,
    lastUpdated: selectedFunnel.value.lastUpdated
  })
  
  // 生成数据内容的简单哈希
  let hash = 0
  for (let i = 0; i < dataContent.length; i++) {
    const char = dataContent.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  return `${funnelId}_${Math.abs(hash)}`
}

// 初始化当前漏斗数据的策略锁定状态
const initializeStrategyLockState = () => {
  const dataKey = getFunnelDataKey()
  if (!dataKey) return
  
  const savedLockState = localStorage.getItem(`aiStrategyLocked_${dataKey}`)
  const savedSelectionCount = localStorage.getItem(`aiStrategySelectionCount_${dataKey}`)
  const savedSelectedStrategy = localStorage.getItem(`aiSelectedStrategy_${dataKey}`)
  
  if (savedLockState === 'true') {
    isStrategyLocked.value = true
    isAnalysisLocked.value = true
    analysisStep.value = savedSelectedStrategy ? 3 : 2 // 如果有策略选择则为第3步，否则为第2步
    showFullAnalysis.value = true
  } else {
    isStrategyLocked.value = false
    isAnalysisLocked.value = false
    analysisStep.value = 1
  }
  
  if (savedSelectionCount) {
    strategySelectionCount.value = parseInt(savedSelectionCount, 10)
  } else {
    strategySelectionCount.value = 0
  }
  
  // 如果有保存的策略选择，恢复它
  if (savedSelectedStrategy) {
    selectedStrategyId.value = savedSelectedStrategy
    selectedStrategy.value = strategies.value.find(s => s.id === savedSelectedStrategy) || null
    // 如果已有策略选择且锁定状态为true，则显示为锁定状态
    if (isStrategyLocked.value) {
      console.log('恢复锁定状态的策略选择:', savedSelectedStrategy)
    }
  } else {
    selectedStrategy.value = null
    selectedStrategyId.value = null
  }
  
  console.log(`漏斗数据 ${dataKey} 的策略状态:`, {
    locked: isStrategyLocked.value,
    analysisLocked: isAnalysisLocked.value,
    analysisStep: analysisStep.value,
    selectionCount: strategySelectionCount.value,
    selectedStrategy: savedSelectedStrategy,
    funnelName: selectedFunnel.value?.name
  })
}

// 重置策略锁定状态（开发/管理员使用）
const resetStrategyLock = () => {
  const dataKey = getFunnelDataKey()
  if (!dataKey) {
    console.log('漏斗数据未加载完成')
    return
  }
  
  isStrategyLocked.value = false
  strategySelectionCount.value = 0
  selectedStrategy.value = null
  selectedStrategyId.value = null
  localStorage.removeItem(`aiStrategyLocked_${dataKey}`)
  localStorage.removeItem(`aiStrategySelectionCount_${dataKey}`)
  localStorage.removeItem(`aiSelectedStrategy_${dataKey}`)
  console.log(`漏斗数据 ${dataKey} 的策略锁定状态已重置`)
}

// 重置分析状态 - 先定义这个函数，因为它被checkDataUpdateAndReset调用
const resetAnalysisState = () => {
  isAnalysisLocked.value = false
  analysisStep.value = 1
  showFullAnalysis.value = false
  selectedStrategy.value = null
  selectedStrategyId.value = null
  strategies.value = []
  
  // 清除本地存储
  const dataKey = getFunnelDataKey()
  if (dataKey) {
    localStorage.removeItem(`aiStrategyLocked_${dataKey}`)
    localStorage.removeItem(`aiStrategySelectionCount_${dataKey}`)
    localStorage.removeItem(`aiSelectedStrategy_${dataKey}`)
  }
}

// 检测数据更新并重置状态
const checkDataUpdateAndReset = () => {
  if (!funnelMetrics.value?.lastUpdated) return
  
  const currentUpdateTime = funnelMetrics.value.lastUpdated
  
  // 如果数据有更新，重置分析状态
  if (lastDataUpdateTime.value && lastDataUpdateTime.value !== currentUpdateTime) {
    resetAnalysisState()
    console.log('检测到数据更新，已重置分析状态')
  }
  
  lastDataUpdateTime.value = currentUpdateTime
}

// 注意：将函数暴露到window对象应该在onMounted中进行

// 获取进度步骤文本
const getProgressStepText = () => {
  const progress = reportGenerationProgress.value
  if (progress < 20) return '正在分析数据结构...'
  if (progress < 40) return '正在生成策略建议...'
  if (progress < 60) return '正在计算ROI预测...'
  if (progress < 80) return '正在优化执行方案...'
  if (progress < 95) return '正在整理分析报告...'
  return '即将完成...'
}

// 模拟进度更新
const simulateProgress = (targetProgress: number, duration: number) => {
  return new Promise<void>((resolve) => {
    const startProgress = reportGenerationProgress.value
    const progressDiff = targetProgress - startProgress
    const startTime = Date.now()
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      
      // 使用缓动函数让进度条更自然
      const easedProgress = 1 - Math.pow(1 - progressRatio, 3)
      reportGenerationProgress.value = Math.round(startProgress + progressDiff * easedProgress)
      
      if (progressRatio < 1) {
        requestAnimationFrame(updateProgress)
      } else {
        resolve()
      }
    }
    
    updateProgress()
  })
}

const goToFullReport = async () => {
  if (!selectedStrategy.value || !analysisId.value || !selectedFunnel.value?.id) {
    alert('请先选择策略')
    return
  }
  
  console.log('🚀 goToFullReport 开始执行:', {
    selectedStrategy: selectedStrategy.value,
    analysisId: analysisId.value,
    funnelId: selectedFunnel.value?.id,
    funnelName: selectedFunnel.value?.name,
    isStrategyLocked: isStrategyLocked.value,
    strategySelectionCount: strategySelectionCount.value
  })
  
  try {
    // 如果策略已锁定，先查找已存在的报告
    if (isStrategyLocked.value) {
      console.log('✅ 策略已锁定，查找已存在的报告')
      try {
        const reportsResponse = await aiAnalysisAPI.getReports()
        if (reportsResponse.success && reportsResponse.data) {
          const strategyType = selectedStrategy.value.id === 'conservative' ? 'stable' : 'aggressive'
          const targetStrategy = strategyType === 'stable' ? '稳健策略' : '激进策略'
          
          console.log('🔍 查找已存在的报告: 新版本调试')
          console.log('📋 当前漏斗名称:', selectedFunnel.value?.name)
          console.log('🎯 目标策略:', targetStrategy)
          console.log('📊 所有报告:', reportsResponse.data)
          console.log('🔍 开始逐个检查报告匹配情况:')
          
          reportsResponse.data.forEach((report: any, index: number) => {
            console.log(`报告 ${index + 1}:`, {
              id: report.id,
              funnelName: report.funnelName,
              strategy: report.strategy,
              匹配漏斗名称: report.funnelName === selectedFunnel.value?.name,
              匹配策略原始值: report.strategy === strategyType,
              匹配策略中文值: report.strategy === targetStrategy,
              期望策略类型: strategyType
            })
          })
          
          const existingReport = reportsResponse.data.find((report: any) => 
            report.funnelName === selectedFunnel.value?.name && 
            report.strategy === strategyType  // 直接使用 'stable' 或 'aggressive'
          )
          
          if (existingReport) {
            console.log('✅ 找到已存在的报告，直接跳转:', existingReport.id)
            // 直接跳转到已存在的报告
            router.push(`/analysis/report/${existingReport.id}`)
            return
          } else {
            console.log('❌ 未找到匹配的报告，继续生成新报告')
          }
        }
      } catch (error) {
        console.log('🚨 查找现有报告失败，继续生成新报告:', error)
      }
    }
    
    // 开始显示进度条
    reportGenerationLoading.value = true
    reportGenerationProgress.value = 0
    
    // 步骤1: 数据分析 (0-20%)
    await simulateProgress(15, 1000)
    
    // 先调用第二步生成策略选项（如果还没有生成过）
    const statusResponse = await aiAnalysisAPI.getAnalysisStatus(selectedFunnel.value.id)
    await simulateProgress(25, 500)
    
    if (statusResponse.success && statusResponse.data && !statusResponse.data.hasStep2) {
      // 需要先生成第二步
      await simulateProgress(35, 800)
      const step2Response = await aiAnalysisAPI.getStrategyOptions(
        analysisId.value,
        selectedFunnel.value.id
      )
      
      if (!step2Response.success) {
        throw new Error('生成策略选项失败')
      }
    }
    
    // 步骤2: 策略生成 (25-50%)
    await simulateProgress(50, 1200)
    
    // 调用第三步API生成个性化完整报告
    const strategyType = selectedStrategy.value.id === 'conservative' ? 'stable' : 'aggressive'
    
    // 步骤3: ROI计算 (50-70%)
    await simulateProgress(70, 1500)
    
    const response = await aiAnalysisAPI.getCompleteReport(
      analysisId.value,
      selectedFunnel.value.id,
      strategyType
    )
    
    // 步骤4: 报告整理 (70-95%)
    await simulateProgress(95, 1000)
    
    if (response.success && response.data) {
      // 保存报告信息到localStorage，供报告中心使用
      localStorage.setItem('latestReportId', response.data.reportId)
      localStorage.setItem('selectedStrategy', selectedStrategy.value.id)
      localStorage.setItem('analysisTimestamp', new Date().toISOString())
      
      // 策略在选择时就已经锁定了，这里无需重复设置
      
      // 完成 (95-100%)
      await simulateProgress(100, 500)
      
      // 显示成功消息
      showSuccessMessage('个性化完整分析报告已生成！')
      
      // 短暂延迟后跳转到报告中心
      setTimeout(() => {
        router.push('/analysis/enhanced')
      }, 800)
    }
  } catch (error: any) {
    console.error('Error generating complete report:', error)
    alert(error.response?.data?.error || '生成报告失败，请稍后重试')
  } finally {
    // 重置进度条状态
    setTimeout(() => {
      reportGenerationLoading.value = false
      reportGenerationProgress.value = 0
    }, 500)
  }
}

const showSuccessMessage = (message: string) => {
  // 简单的成功提示实现
  const successDiv = document.createElement('div')
  successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; display: flex; align-items: center; gap: 8px;'
  successDiv.innerHTML = `<i class="fas fa-check-circle"></i>${message}`
  document.body.appendChild(successDiv)
  
  setTimeout(() => {
    document.body.removeChild(successDiv)
  }, 3000)
}

const handleDateClick = (dateStr: string, status: string, data: any) => {
  if (status === 'missing') {
    if (confirm(`检测到 ${dateStr} 数据缺失，是否立即补录？`)) {
      goToDataEntry()
    }
  } else if (status === 'completed') {
    alert(`${dateStr} 数据概览:\n转化率: ${data.rate}%\n线索数: ${data.leads}\n成交数: ${data.conversions}`)
  } else if (status === 'today') {
    if (confirm(`今天的数据还未录入，是否现在录入？`)) {
      goToDataEntry()
    }
  }
}


const onStageClick = (stage: any) => {
  console.log('Stage clicked:', stage)
}

const getMiniStages = (funnel: any) => {
  // 为小型漏斗可视化生成阶段数据
  const baseWidth = 80
  const colors = ['#0052d9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
  
  // 如果有 stageMetrics，使用实际数据
  if (funnel.stageMetrics && funnel.stageMetrics.length > 0) {
    return funnel.stageMetrics.map((metric: any, index: number) => ({
      id: metric.nodeId,
      name: metric.nodeName,
      width: Math.max(baseWidth - index * 16, 24),
      color: colors[index % colors.length],
      count: metric.entries || 0
    }))
  }
  
  // 否则使用 nodes 数据（但没有实际数字）
  const stages = funnel.nodes || []
  
  return stages.map((node: any, index: number) => ({
    id: node.id,
    name: node.data?.label || node.data?.name || `Stage ${index + 1}`,
    width: Math.max(baseWidth - index * 16, 24),
    color: colors[index % colors.length],
    count: 0
  }))
}

const goToPage = (page: string) => {
  router.push(`/${page}`)
}

const goToDataEntry = () => {
  router.push('/data-entry')
}

// 监听器
watch(selectedFunnel, async (newFunnel) => {
  if (newFunnel) {
    // 切换漏斗时重置分析状态
    resetAnalysisState()
    
    await loadTrendData(newFunnel.id)
    
    // 检测新漏斗的数据更新状态
    setTimeout(() => {
      checkDataUpdateAndReset()
    }, 500)
  }
})

// 监听路由变化，检查是否从数据录入页面返回
// 路由变化监听 - 优化防抖
let routeChangeTimeout: NodeJS.Timeout | null = null
watch(() => route.path, (newPath, oldPath) => {
  // 清除之前的定时器
  if (routeChangeTimeout) {
    clearTimeout(routeChangeTimeout)
  }
  
  // 如果当前是dashboard页面，且之前可能是从data-entry页面导航过来的
  if (newPath === '/dashboard' && selectedFunnel.value && oldPath !== newPath) {
    console.log(`🔄 路由变化: ${oldPath} -> ${newPath}`)
    // 防抖延迟执行
    routeChangeTimeout = setTimeout(() => {
      loadAIAnalysis(selectedFunnel.value!.id)
      loadFunnelData(selectedFunnel.value!.id)
    }, 800) // 增加延迟时间，确保其他数据先加载完
  }
})

// 页面可见性监听函数
let handleVisibilityChange: (() => void) | null = null

// 获取分析按钮文本 - 使用计算属性
const analysisButtonText = computed(() => {
  if (analysisLoading.value) return 'AI分析中...'
  
  switch (analysisStep.value) {
    case 1:
      if (isAnalysisLocked.value) {
        return '分析已完成'
      }
      return '开始AI分析 (消耗1次)'
    case 2:
      return '分析完成，请选择策略'
    case 3:
      return '分析已完成'
    default:
      return '开始AI分析 (消耗1次)'
  }
})

// 生命周期
onMounted(async () => {
  // 将调试函数暴露到window对象（仅开发环境）
  if (import.meta.env.DEV) {
    // 使用nextTick确保组件完全初始化
    nextTick(() => {
      if (typeof window !== 'undefined') {
        const win = window as any
        if (!win.dashboardDebug) {
          win.dashboardDebug = {}
        }
        win.dashboardDebug.resetStrategyLock = resetStrategyLock
        win.dashboardDebug.resetAnalysisState = resetAnalysisState
        console.log('Dashboard调试函数已暴露到 window.dashboardDebug')
      }
    })
  }
  
  // 并行加载所有数据，提高页面加载性能
  await Promise.all([
    loadFunnels(),
    loadRecentActivities(),
    calculateDataEntryStats(),
    loadAnalysisQuota()
  ])
  
  // 初始化当前漏斗的策略锁定状态（在loadFunnels完成后）
  initializeStrategyLockState()
  
  // 检测数据更新状态
  checkDataUpdateAndReset()
  
  // 添加页面可见性监听，当从其他页面返回时刷新分析
  let lastVisibilityTime = 0
  handleVisibilityChange = () => {
    const now = Date.now()
    // 防抖：至少间隔5秒才执行
    if (!document.hidden && selectedFunnel.value && (now - lastVisibilityTime) > 5000) {
      lastVisibilityTime = now
      console.log('📱 页面变为可见，刷新数据')
      // 页面变为可见时，重新加载AI分析状态
      loadAIAnalysis(selectedFunnel.value.id)
      loadFunnelData(selectedFunnel.value.id)
      // 检测数据更新
      checkDataUpdateAndReset()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 初始化成功后显示成功消息（可选）
  console.log('Dashboard initialized successfully')
})

// 组件卸载时清理监听器和定时器
onUnmounted(() => {
  if (handleVisibilityChange) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
  
  // 清理路由监听的定时器
  if (routeChangeTimeout) {
    clearTimeout(routeChangeTimeout)
  }
  
  // 清理请求缓存
  requestCache.clear()
  cacheExpiration.clear()
  
  console.log('🧹 Dashboard组件已清理所有监听器和缓存')
})
</script>

<style scoped>
/* 基于模板的现代化Dashboard样式 */
.dashboard-layout {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  font-size: 14px;
  color: #1a1a1a;
  overflow-x: hidden;
}

.main-content {
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.header-with-reminder {
  padding: 8px 16px;
  margin-bottom: 4px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.header-left h1 {
  font-size: 20px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.header-left p {
  color: #6b7280;
  font-size: 12px;
}

.header-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1px;
  line-height: 1.1;
}

.stat-value.missing {
  color: #ef4444;
}

.stat-value.updated {
  color: #10b981;
}

.stat-value.rate {
  color: #0052d9;
}

.stat-label {
  font-size: 0.65rem;
  color: #6b7280;
  font-weight: 500;
}

.btn-reminder {
  padding: 6px 12px;
  background: #0052d9;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.btn-reminder:hover {
  background: #003db7;
  transform: translateY(-1px);
}


.horizontal-calendar {
  font-size: 11px;
}

.calendar-strip {
  display: flex;
  gap: 3px;
  padding: 0;
  background: transparent;
}

.day-cell {
  flex: 1;
  text-align: center;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  position: relative;
}

.day-cell-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-cell-date {
  font-size: 14px;
  font-weight: 600;
}

.day-cell-day {
  font-size: 12px;
  opacity: 0.7;
}

.day-cell-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.day-cell.completed {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.day-cell.completed .day-cell-date {
  color: #166534;
}

.day-cell.completed .day-cell-status {
  background: #10b981;
}

.day-cell.missing {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.day-cell.missing .day-cell-date {
  color: #dc2626;
}

.day-cell.missing .day-cell-status {
  background: #ef4444;
}

.day-cell.today {
  background: #e0f2fe;
  border: 1px solid #0369a1;
}

.day-cell.today .day-cell-date {
  color: #0369a1;
  font-weight: 700;
}

.day-cell.today .day-cell-status {
  background: #0284c7;
}

.day-cell.future {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  opacity: 0.5;
  cursor: not-allowed;
}

.day-cell.future .day-cell-date {
  color: #9ca3af;
}

.day-cell.future .day-cell-status {
  background: #d1d5db;
}

.day-cell:hover:not(.future) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.funnel-visualization {
  padding: 10px 14px;
  margin-bottom: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.section-icon {
  margin-right: 8px;
  color: #0052d9;
}

.funnel-selector {
  margin-bottom: 12px;
}

.funnel-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.funnel-tab {
  padding: 6px 12px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
  font-size: 13px;
}

.funnel-tab:hover {
  color: #0052d9;
}

.funnel-tab.active {
  color: #0052d9;
  border-bottom-color: #0052d9;
}

.funnel-analysis-layout {
  display: grid;
  grid-template-columns: 1fr 580px;
  gap: 20px;
  align-items: start;
}

.funnel-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  margin: 4px 0;
}

.funnel-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 13px;
  height: 60px;
  border-radius: 6px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  cursor: pointer;
}

.funnel-stage:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.stage-1 {
  width: 240px;
  background: linear-gradient(135deg, #0052d9 0%, #366ef4 100%);
}

.stage-2 {
  width: 210px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stage-3 {
  width: 180px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stage-4 {
  width: 150px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stage-5 {
  width: 120px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stage-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 8px 12px;
  text-align: center;
}

.stage-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 4px;
}

.stage-name {
  font-size: 12px;
  margin-bottom: 2px;
  color: white !important;
  line-height: 1.2;
  word-break: break-all;
  text-align: center;
}

.stage-count {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.1;
  color: white !important;
}

.stage-rate {
  font-size: 0.65rem;
  opacity: 0.9;
  font-weight: 500;
  color: white !important;
}

.funnel-arrow {
  color: #94a3b8;
  font-size: 12px;
  margin: 0;
}

.funnel-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0052d9;
  margin-bottom: 4px;
  line-height: 1.2;
}

.summary-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.ai-analysis-panel {
  background: white;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  min-width: 560px;
  width: 100%;
}

.ai-analysis-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.analysis-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  align-items: center;
}

.analysis-icon {
  margin-right: 8px;
  color: #0052d9;
}

.credits-info {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
}

.credits-badge {
  background: #f0f8ff;
  color: #0052d9;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.brief-analysis {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: linear-gradient(to right, #f0f9ff, #f8fafc);
  border-radius: 10px;
  border-left: 4px solid #0052d9;
}

.brief-analysis h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}

.brief-analysis p {
  font-size: 14px;
  color: #1f2937;
  margin: 0;
  line-height: 1.7;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.detailed-analysis {
  position: relative;
  margin-bottom: 16px;
}

.detailed-content {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.preview-insights {
  filter: blur(1px);
  opacity: 0.6;
}

.preview-insights.show-full {
  filter: none;
  opacity: 1;
}

.premium-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  backdrop-filter: blur(2px);
}

.premium-content {
  text-align: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid #0052d9;
  position: relative;
  z-index: 10;
}

.premium-icon {
  font-size: 32px;
  color: #0052d9;
  margin-bottom: 12px;
}

.premium-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.premium-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.btn-analyze {
  background: linear-gradient(135deg, #0052d9 0%, #0041b8 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
}

.btn-analyze:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 82, 217, 0.4);
}

.btn-analyze:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.analysis-insight {
  margin-bottom: 12px;
}

.insight-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.insight-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  font-size: 12px;
}

.insight-content {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.placeholder-text {
  font-style: italic;
  color: #9ca3af;
}

.dynamic-strategies .strategy-preview {
  margin-bottom: 4px;
  color: #374151;
}

.roi-content {
  color: #059669;
  font-weight: 500;
}

.time-insights-content {
  color: #374151;
}

.no-data-text {
  font-style: italic;
  color: #9ca3af;
}

.suggestion-options {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.suggestion-option {
  flex: 1;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
}

.suggestion-option:hover {
  border-color: #0052d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.15);
}

.suggestion-option.selected {
  border-color: #0052d9;
  background: #f0f8ff;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.option-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.badge-conservative {
  background: #e6f7ff;
  color: #0052d9;
}

.badge-aggressive {
  background: #fff2e6;
  color: #f5970c;
}

.option-content {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}

.option-radio {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: white;
}

.suggestion-option.selected .option-radio {
  border-color: #0052d9;
  background: #0052d9;
}

.suggestion-option.selected .option-radio::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
}

.choice-confirmation {
  display: none;
  text-align: center;
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  margin-bottom: 16px;
}

.choice-confirmation.show {
  display: block;
}

.choice-text {
  font-size: 13px;
  color: #166534;
  margin-bottom: 8px;
}

.choice-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-confirm {
  padding: 6px 12px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-reselect {
  padding: 6px 12px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.chart-card {
  padding: 16px;
}

.recent-activity {
  padding: 6px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 6px;
  background: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  min-height: 24px;
}

.activity-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.activity-icon {
  width: 12px;
  height: 12px;
  background: #f0f9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0052d9;
  margin-right: 4px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  color: #374151;
  margin-bottom: 1px;
  font-size: 8px;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.activity-time {
  color: #9ca3af;
  font-size: 6px;
}

.funnel-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.mini-funnel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mini-funnel:hover {
  border-color: #0052d9;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.1);
  transform: translateY(-2px);
}

.mini-funnel-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.mini-funnel-viz {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.mini-stage {
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 600;
}

.mini-funnel-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.mini-stat-value {
  font-weight: 700;
  color: #0052d9;
  font-size: 1.125rem;
  line-height: 1.2;
}

.mini-stat-label {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .funnel-analysis-layout {
    grid-template-columns: 1fr 520px;
  }
}

@media (max-width: 1280px) {
  .funnel-analysis-layout {
    grid-template-columns: 1fr 480px;
  }
}

@media (max-width: 1024px) {
  .funnel-analysis-layout {
    grid-template-columns: 1fr;
  }
  
  .ai-analysis-panel {
    order: -1;
    min-width: 100%;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .header-top {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-stats {
    gap: 16px;
  }
  
  .calendar-strip {
    overflow-x: auto;
  }
  
  .funnel-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tailwind utilities */
.text-lg { font-size: 1.125rem; }
.text-sm { font-size: 0.875rem; }
.font-semibold { font-weight: 600; }
.text-gray-800 { color: #1f2937; }
.text-gray-600 { color: #4b5563; }
.text-blue-600 { color: #2563eb; }
.bg-blue-600 { background-color: #2563eb; }
.text-white { color: white; }
.hover\:bg-gray-100:hover { background-color: #f3f4f6; }
.rounded { border-radius: 0.25rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.flex { display: flex; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mb-4 { margin-bottom: 1rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-1 { margin-right: 0.25rem; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
</style>