<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Navigation -->
          <nav class="flex items-center space-x-4">
            <router-link to="/dashboard" class="text-gray-500 hover:text-gray-700">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </router-link>
            <span class="text-gray-500">/</span>
            <router-link to="/metrics" class="text-gray-500 hover:text-gray-700">
              数据集
            </router-link>
            <span class="text-gray-500">/</span>
            <span class="text-sm font-medium text-gray-900">智能分析</span>
          </nav>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <button
              @click="refreshAnalysis"
              :disabled="loading"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ loading ? '分析中...' : '刷新分析' }}
            </button>
            <button
              @click="exportReport"
              :disabled="!analysisData || loading"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              导出完整报告
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !analysisData" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div class="text-center">
          <span class="text-lg text-gray-600">正在执行智能分析...</span>
          <div class="text-sm text-gray-500 mt-1">{{ loadingStatus }}</div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">分析失败</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
            <div class="mt-4 flex space-x-3">
              <button
                @click="performAnalysis"
                class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                重试分析
              </button>
              <button
                @click="loadSampleData"
                class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                使用示例数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="analysisData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">智能分析报告</h1>
        <p class="mt-2 text-lg text-gray-600">
          基于漏斗数据的全面分析、诊断与优化建议
        </p>
        <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
          <span>分析时间: {{ formatDateTime(analysisData.timestamp) }}</span>
          <span>•</span>
          <span>行业: {{ industry || '通用' }}</span>
          <span>•</span>
          <span>公司规模: {{ companySize || '未指定' }}</span>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2'
            ]"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            <span>{{ tab.name }}</span>
            <span v-if="tab.badge" 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="tab.badgeClass">
              {{ tab.badge }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="space-y-8">
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'">
          <!-- Key Metrics Dashboard -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <!-- Overall Performance -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">综合评级</p>
                  <p class="text-3xl font-bold mt-2" :style="{ color: getGradeColor(analysisData.diagnostics?.overallGrade) }">
                    {{ analysisData.diagnostics?.overallGrade || 'N/A' }}
                  </p>
                </div>
                <div class="p-3 bg-indigo-100 rounded-full">
                  <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ getGradeDescription(analysisData.diagnostics?.overallGrade) }}</p>
            </div>

            <!-- Health Score -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">健康度评分</p>
                  <p class="text-3xl font-bold mt-2" :class="getHealthScoreClasses(analysisData.diagnostics?.healthScore || 0)">
                    {{ analysisData.diagnostics?.healthScore?.toFixed(1) || 'N/A' }}
                  </p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">满分100分</p>
            </div>

            <!-- Critical Issues -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">关键问题</p>
                  <p class="text-3xl font-bold mt-2 text-red-600">
                    {{ criticalIssuesCount }}
                  </p>
                </div>
                <div class="p-3 bg-red-100 rounded-full">
                  <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">需要立即关注</p>
            </div>

            <!-- Recommendations -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-600">智能建议</p>
                  <p class="text-3xl font-bold mt-2 text-blue-600">
                    {{ analysisData.recommendations?.length || 0 }}
                  </p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-2">个性化改进建议</p>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                @click="activeTab = 'diagnostics'"
                class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                查看详细诊断
              </button>
              <button
                @click="activeTab = 'recommendations'"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                获取改进建议
              </button>
              <button
                @click="activeTab = 'comparison'"
                class="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                对比分析
              </button>
            </div>
          </div>
        </div>

        <!-- Diagnostics Tab -->
        <div v-show="activeTab === 'diagnostics'">
          <DiagnosticBar
            v-if="analysisData.diagnostics"
            :diagnostics="analysisData.diagnostics"
            @generate-recommendations="generateRecommendations"
            @export-diagnostics="exportDiagnostics"
          />
          <div v-else class="text-center py-8 text-gray-500">
            诊断数据不可用
          </div>
        </div>

        <!-- Recommendations Tab -->
        <div v-show="activeTab === 'recommendations'">
          <RecommendationList
            :recommendations="analysisData.recommendations || []"
            :loading="recommendationsLoading"
            :error="recommendationsError"
            @implement-recommendation="implementRecommendation"
            @bookmark-recommendation="bookmarkRecommendation"
            @share-recommendation="shareRecommendation"
            @refresh-recommendations="generateRecommendations"
            @retry-load-recommendations="generateRecommendations"
          />
        </div>

        <!-- Comparison Tab -->
        <div v-show="activeTab === 'comparison'">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Peer Comparison Results -->
            <div v-if="analysisData.peerComparison" class="bg-white rounded-lg shadow">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">同行对比结果</h3>
                
                <!-- Performance Grade -->
                <div class="mb-6 text-center">
                  <div 
                    class="inline-flex items-center justify-center w-16 h-16 rounded-full text-white text-2xl font-bold mb-2"
                    :style="{ backgroundColor: getGradeColor(analysisData.peerComparison.performanceGrade) }"
                  >
                    {{ analysisData.peerComparison.performanceGrade }}
                  </div>
                  <p class="text-sm text-gray-600">综合表现评级</p>
                </div>

                <!-- Stage Rankings -->
                <div class="space-y-4">
                  <div v-for="(ranking, stage) in analysisData.peerComparison.rankings" :key="stage" class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">{{ getStageDisplayName(stage) }}</span>
                    <div class="flex items-center space-x-2">
                      <span class="text-sm text-gray-500">{{ ranking.percentile }}%</span>
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getRankingClasses(ranking.rank)"
                      >
                        {{ ranking.rank }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Improvement Potential -->
            <div v-if="analysisData.improvementPotential" class="bg-white rounded-lg shadow">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">改进潜力分析</h3>
                
                <!-- Overall Potential -->
                <div class="mb-6">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">整体改进潜力</span>
                    <span class="text-2xl font-bold text-green-600">
                      +{{ analysisData.improvementPotential.overallPotential.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      class="bg-green-500 h-3 rounded-full transition-all duration-500"
                      :style="{ width: `${Math.min(analysisData.improvementPotential.overallPotential * 10, 100)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Stage Improvements -->
                <div class="space-y-4">
                  <div v-for="(potential, stage) in getStageImprovements(analysisData.improvementPotential)" :key="stage" class="border border-gray-200 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700">{{ getStageDisplayName(stage) }}</span>
                      <span class="text-sm font-bold text-orange-600">
                        +{{ potential.potential.toFixed(1) }}%
                      </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div>
                        <div>当前: {{ potential.current.toFixed(1) }}%</div>
                      </div>
                      <div>
                        <div>目标: {{ potential.benchmark.toFixed(1) }}%</div>
                      </div>
                      <div>
                        <div>影响: +{{ potential.impact.toFixed(1) }}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import DiagnosticBar from '@/components/analysis/DiagnosticBar.vue'
import RecommendationList from '@/components/analysis/RecommendationList.vue'
import { analysisApi } from '@/api/analysis'
import type { 
  AnalysisResponse, 
  FunnelMetricData, 
  GeneratedRecommendation,
  DiagnosticResult,
  ImprovementPotential
} from '@/types/funnel'

// Component setup
const route = useRoute()

// Reactive state
const loading = ref(false)
const loadingStatus = ref('')
const error = ref<string | null>(null)
const analysisData = ref<AnalysisResponse | null>(null)
const activeTab = ref('overview')
const recommendationsLoading = ref(false)
const recommendationsError = ref<string | null>(null)

// Configuration
const industry = ref('software') // Could be dynamic based on user input
const companySize = ref('medium')
const region = ref('china')

// Sample data for demonstration
const sampleCompanyData: FunnelMetricData = {
  stage_1: { visitors: 1000, converted: 150, conversionRate: 15.0 },
  stage_2: { visitors: 150, converted: 45, conversionRate: 30.0 },
  stage_3: { visitors: 45, converted: 18, conversionRate: 40.0 },
  stage_4: { visitors: 18, converted: 9, conversionRate: 50.0 }
}

// Tab configuration
const tabs = computed(() => [
  {
    id: 'overview',
    name: '概览',
    icon: defineComponent({
      render: () => {
        return (
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        )
      }
    })
  },
  {
    id: 'diagnostics',
    name: '诊断分析',
    icon: defineComponent({
      render: () => {
        return (
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        )
      }
    }),
    badge: analysisData.value?.diagnostics ? (analysisData.value.diagnostics.weakPoints.length > 0 ? analysisData.value.diagnostics.weakPoints.length : undefined) : undefined,
    badgeClass: 'bg-red-100 text-red-800'
  },
  {
    id: 'recommendations',
    name: '智能建议',
    icon: defineComponent({
      render: () => {
        return (
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        )
      }
    }),
    badge: analysisData.value?.recommendations?.length || undefined,
    badgeClass: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'comparison',
    name: '对比分析',
    icon: defineComponent({
      render: () => {
        return (
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
          </svg>
        )
      }
    })
  }
])

// Computed properties
const criticalIssuesCount = computed(() => {
  if (!analysisData.value?.diagnostics?.weakPoints) return 0
  return analysisData.value.diagnostics.weakPoints.filter(wp => wp.severity === 'critical').length
})

// Methods
const performAnalysis = async () => {
  try {
    loading.value = true
    error.value = null
    
    loadingStatus.value = '准备分析数据...'
    
    const request = {
      companyData: sampleCompanyData,
      industry: industry.value,
      companySize: companySize.value,
      region: region.value,
      includeRecommendations: true,
      includeDiagnostics: true,
      includePeerComparison: true,
      includeImprovementPotential: true,
      maxRecommendations: 12
    }
    
    loadingStatus.value = '执行综合分析...'
    
    analysisData.value = await analysisApi.performComprehensiveAnalysis(request)
    
    loadingStatus.value = '分析完成'
    
  } catch (err) {
    console.error('Analysis failed:', err)
    error.value = err instanceof Error ? err.message : '分析失败，请稍后重试'
  } finally {
    loading.value = false
    loadingStatus.value = ''
  }
}

const refreshAnalysis = async () => {
  await performAnalysis()
}

const generateRecommendations = async () => {
  try {
    recommendationsLoading.value = true
    recommendationsError.value = null
    
    const recommendations = await analysisApi.generateRecommendations({
      companyData: sampleCompanyData,
      industry: industry.value,
      companySize: companySize.value,
      region: region.value,
      maxRecommendations: 12,
      includeCustomRules: true
    })
    
    if (analysisData.value) {
      analysisData.value.recommendations = recommendations
    }
    
  } catch (err) {
    console.error('Failed to generate recommendations:', err)
    recommendationsError.value = err instanceof Error ? err.message : '生成建议失败'
  } finally {
    recommendationsLoading.value = false
  }
}

const loadSampleData = async () => {
  // Load with sample data for demonstration
  try {
    loading.value = true
    error.value = null
    
    // Simulate API call with sample data
    const sampleAnalysis: AnalysisResponse = {
      diagnostics: {
        overallGrade: 'C',
        healthScore: 65.5,
        stageGrades: {
          stage_1: { grade: 'B', percentile: 70, status: '良好表现' },
          stage_2: { grade: 'C', percentile: 55, status: '平均表现' },
          stage_3: { grade: 'C', percentile: 60, status: '平均表现' },
          stage_4: { grade: 'A', percentile: 85, status: '优秀表现' }
        },
        weakPoints: [
          {
            stage: 'stage_2',
            severity: 'major',
            description: '有效触达阶段转化率低于行业平均水平',
            currentRate: 30.0,
            benchmarkRate: 35.0,
            improvementNeeded: 5.0
          }
        ],
        improvementPriorities: [
          {
            stage: 'stage_2',
            priority: 'high',
            impactScore: 8.5,
            difficultyScore: 6.0,
            roiEstimate: 1.42
          }
        ],
        crossStageAnalysis: {
          dropOffPoints: [
            {
              from: '线索生成',
              to: '有效触达',
              dropOffRate: 85.0,
              severity: 'high'
            }
          ],
          flowConsistency: 72.0,
          bottleneckStage: 'stage_2'
        }
      },
      recommendations: [
        {
          id: 'rec_1',
          category: 'user_experience_improvement',
          priority: 'high',
          title: '优化客户体验流程',
          description: '通过改善客户接触和沟通体验减少中间流失',
          actionItems: [
            '优化客户接触时机，建立最佳联系时间表',
            '改进初次沟通话术，提升客户响应率',
            '建立多渠道触达机制（电话、邮件、微信等）'
          ],
          expectedImpact: '预计减少中间阶段流失15-25%',
          implementationTime: '2-3周',
          difficulty: 'medium',
          roiEstimate: 7.8,
          resources: ['销售团队', 'CRM系统', '客户服务工具'],
          successMetrics: ['客户响应率', '阶段转化率', '客户满意度'],
          applicableStages: ['stage_2', 'stage_3']
        }
      ],
      peerComparison: {
        rankings: {
          stage_1: { percentile: 70, rank: 'Good' },
          stage_2: { percentile: 55, rank: 'Average' },
          stage_3: { percentile: 60, rank: 'Average' },
          stage_4: { percentile: 85, rank: 'Excellent' },
          overall: { percentile: 65, rank: 'Good' }
        },
        performanceGrade: 'C',
        benchmarkData: {}
      },
      improvementPotential: {
        stage_1: { current: 15.0, benchmark: 18.0, potential: 3.0, impact: 1.2 },
        stage_2: { current: 30.0, benchmark: 35.0, potential: 5.0, impact: 2.1 },
        stage_3: { current: 40.0, benchmark: 42.0, potential: 2.0, impact: 0.8 },
        stage_4: { current: 50.0, benchmark: 48.0, potential: 0.0, impact: 0.0 },
        overallPotential: 4.1
      },
      timestamp: new Date()
    }
    
    analysisData.value = sampleAnalysis
    
  } catch (err) {
    console.error('Failed to load sample data:', err)
    error.value = '加载示例数据失败'
  } finally {
    loading.value = false
  }
}

const implementRecommendation = (recommendation: GeneratedRecommendation) => {
  console.log('Implementing recommendation:', recommendation.title)
  // TODO: Implement recommendation tracking/execution
}

const bookmarkRecommendation = (recommendation: GeneratedRecommendation) => {
  console.log('Bookmarking recommendation:', recommendation.title)
  // TODO: Implement recommendation bookmarking
}

const shareRecommendation = (recommendation: GeneratedRecommendation) => {
  console.log('Sharing recommendation:', recommendation.title)
  // TODO: Implement recommendation sharing
}

const exportReport = () => {
  console.log('Exporting comprehensive report...')
  // TODO: Implement comprehensive report export
}

const exportDiagnostics = () => {
  console.log('Exporting diagnostics report...')
  // TODO: Implement diagnostics export
}

// Helper methods
const getGradeColor = (grade?: string): string => {
  const colors = {
    A: '#10B981', // green-500
    B: '#3B82F6', // blue-500
    C: '#F59E0B', // yellow-500
    D: '#F97316', // orange-500
    F: '#EF4444'  // red-500
  }
  return colors[grade as keyof typeof colors] || '#6B7280'
}

const getGradeDescription = (grade?: string): string => {
  const descriptions = {
    A: '优秀表现，处于行业领先水平',
    B: '良好表现，高于行业平均水平',
    C: '平均表现，接近行业基准线',
    D: '待改进表现，低于行业平均',
    F: '需要重点改进，远低于行业水平'
  }
  return descriptions[grade as keyof typeof descriptions] || '暂无评级'
}

const getHealthScoreClasses = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

const getStageDisplayName = (stage: string): string => {
  const names = {
    stage_1: '线索生成',
    stage_2: '有效触达',
    stage_3: '商机转化',
    stage_4: '成交完成'
  }
  return names[stage as keyof typeof names] || stage
}

const getRankingClasses = (rank: string): string => {
  const classes = {
    'Excellent': 'bg-green-100 text-green-800',
    'Good': 'bg-blue-100 text-blue-800',
    'Average': 'bg-yellow-100 text-yellow-800',
    'Below Average': 'bg-orange-100 text-orange-800',
    'Poor': 'bg-red-100 text-red-800'
  }
  return classes[rank as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getStageImprovements = (potential: ImprovementPotential) => {
  return {
    stage_1: potential.stage_1,
    stage_2: potential.stage_2,
    stage_3: potential.stage_3,
    stage_4: potential.stage_4
  }
}

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

// Lifecycle
onMounted(async () => {
  // Check if we have route parameters for specific dataset
  const datasetId = route.params.id as string
  
  if (datasetId) {
    // TODO: Load specific dataset analysis
    await performAnalysis()
  } else {
    // Load sample data for demonstration
    await loadSampleData()
  }
})
</script>

<style scoped>
/* Smooth animations */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Responsive grid improvements */
@media (max-width: 1024px) {
  .grid.lg\\:grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .grid.lg\\:grid-cols-2 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .grid.lg\\:grid-cols-4,
  .grid.md\\:grid-cols-3 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

/* Focus styles for accessibility */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Tab hover effects */
nav button:hover {
  transition: all 0.2s ease-in-out;
}

/* Card hover effects */
.shadow:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>