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
            <span class="text-sm font-medium text-gray-900">分析详情</span>
          </nav>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <button
              @click="refreshAnalysis"
              :disabled="loading"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              刷新
            </button>
            <button
              @click="exportReport"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              导出报告
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg text-gray-600">加载分析数据中...</span>
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
            <h3 class="text-sm font-medium text-red-800">加载失败</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>{{ error }}</p>
            </div>
            <div class="mt-4">
              <button
                @click="fetchAnalysisData"
                class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content - 3 Column Layout -->
    <div v-else-if="analysisData" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Page Title -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ analysisData.companyData.stageNames?.[0] || '漏斗' }}分析报告</h1>
        <p class="mt-1 text-sm text-gray-600">
          数据集: {{ currentDataset?.name }} | 
          更新时间: {{ formatDate(analysisData.updatedAt) }}
        </p>
      </div>

      <!-- 3-Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: 公司漏斗数据 -->
        <div class="lg:col-span-1">
          <div class="bg-white shadow rounded-lg">
            <!-- Header -->
            <div class="bg-blue-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-medium text-blue-900">公司数据</h2>
                <div class="flex items-center space-x-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    实际表现
                  </span>
                  <button
                    @click="editData"
                    class="p-1 text-blue-600 hover:text-blue-800"
                    title="编辑数据"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Company Funnel Visualization -->
            <div class="p-4">
              <!-- Overall Metrics -->
              <div class="mb-6 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">总体转化率</span>
                  <span class="text-lg font-bold text-indigo-600">
                    {{ analysisData.companyData.overallConversionRate }}%
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500">性能评级</span>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
                    :class="getGradeClasses(analysisData.comparison.performanceGrade)"
                  >
                    {{ analysisData.comparison.performanceGrade }}
                  </span>
                </div>
              </div>

              <!-- Stage Details -->
              <div class="space-y-4">
                <h3 class="text-sm font-medium text-gray-900">各阶段详情</h3>
                <div v-for="(stageName, index) in analysisData.companyData.stageNames" :key="index" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <div 
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: stageColors[index] }"
                      ></div>
                      <span class="text-sm font-medium text-gray-700">{{ stageName }}</span>
                    </div>
                    <span class="text-sm text-gray-500">
                      {{ getStageConversionRate(index) }}%
                    </span>
                  </div>
                  <div class="ml-5">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>访问: {{ getStageData(index).visitors }}</span>
                      <span>转化: {{ getStageData(index).converted }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        class="h-2 rounded-full transition-all duration-300"
                        :style="{ 
                          width: `${Math.min(getStageConversionRate(index), 100)}%`,
                          backgroundColor: stageColors[index]
                        }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Funnel Visualization -->
              <div class="mt-6">
                <h3 class="text-sm font-medium text-gray-900 mb-4">漏斗图</h3>
                <div class="flex flex-col items-center space-y-2">
                  <div 
                    v-for="(stageName, index) in analysisData.companyData.stageNames" 
                    :key="index"
                    class="relative"
                  >
                    <div 
                      class="mx-auto transition-all duration-200 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                      :style="{
                        width: `${Math.max(40, getStageData(index).converted / maxVisitors * 200)}px`,
                        height: '40px',
                        backgroundColor: stageColors[index]
                      }"
                    >
                      {{ getStageData(index).converted }}
                    </div>
                    <div class="text-xs text-center text-gray-600 mt-1">
                      {{ stageName }}
                    </div>
                    <!-- Arrow -->
                    <div v-if="index < 3" class="flex justify-center mt-1">
                      <svg class="h-3 w-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle Column: 基准数据 -->
        <div class="lg:col-span-1">
          <div class="bg-white shadow rounded-lg">
            <!-- Header -->
            <div class="bg-green-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-medium text-green-900">行业基准</h2>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ analysisData.benchmarkData.industry === 'general' ? '通用行业' : analysisData.benchmarkData.industry }}
                </span>
              </div>
            </div>

            <!-- Benchmark Content -->
            <div class="p-4">
              <!-- Average Performance -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-gray-900 mb-4">行业平均水平</h3>
                <div class="space-y-3">
                  <div 
                    v-for="(stageName, index) in analysisData.companyData.stageNames" 
                    :key="index"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm text-gray-700">{{ stageName }}</span>
                    <span class="text-sm font-medium text-green-600">
                      {{ getBenchmarkStageRate(index) }}%
                    </span>
                  </div>
                </div>
              </div>

              <!-- Percentiles -->
              <div class="mb-6">
                <h3 class="text-sm font-medium text-gray-900 mb-4">百分位排名</h3>
                <div class="space-y-4">
                  <!-- P90 -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500">顶尖表现 (P90)</span>
                      <span class="text-xs text-gray-400">前10%</span>
                    </div>
                    <div class="space-y-1">
                      <div v-for="(stageName, index) in analysisData.companyData.stageNames" :key="`p90-${index}`" class="flex justify-between text-xs">
                        <span class="text-gray-600">{{ stageName }}</span>
                        <span class="font-medium text-green-700">{{ getPercentileRate('p90', index) }}%</span>
                      </div>
                    </div>
                  </div>

                  <!-- P75 -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500">优秀表现 (P75)</span>
                      <span class="text-xs text-gray-400">前25%</span>
                    </div>
                    <div class="space-y-1">
                      <div v-for="(stageName, index) in analysisData.companyData.stageNames" :key="`p75-${index}`" class="flex justify-between text-xs">
                        <span class="text-gray-600">{{ stageName }}</span>
                        <span class="font-medium text-blue-600">{{ getPercentileRate('p75', index) }}%</span>
                      </div>
                    </div>
                  </div>

                  <!-- P50 -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500">中位数表现 (P50)</span>
                      <span class="text-xs text-gray-400">平均水平</span>
                    </div>
                    <div class="space-y-1">
                      <div v-for="(stageName, index) in analysisData.companyData.stageNames" :key="`p50-${index}`" class="flex justify-between text-xs">
                        <span class="text-gray-600">{{ stageName }}</span>
                        <span class="font-medium text-gray-600">{{ getPercentileRate('p50', index) }}%</span>
                      </div>
                    </div>
                  </div>

                  <!-- P25 -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium text-gray-500">待改进表现 (P25)</span>
                      <span class="text-xs text-gray-400">后75%</span>
                    </div>
                    <div class="space-y-1">
                      <div v-for="(stageName, index) in analysisData.companyData.stageNames" :key="`p25-${index}`" class="flex justify-between text-xs">
                        <span class="text-gray-600">{{ stageName }}</span>
                        <span class="font-medium text-orange-600">{{ getPercentileRate('p25', index) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Benchmark Sources -->
              <div class="bg-gray-50 rounded-lg p-3">
                <h4 class="text-xs font-medium text-gray-700 mb-2">数据来源说明</h4>
                <p class="text-xs text-gray-600">
                  基准数据来自同行业公开数据和匿名化样本，样本量: 1,000+ 企业。
                  数据更新频率：季度更新。
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: 对比分析 -->
        <div class="lg:col-span-1">
          <div class="bg-white shadow rounded-lg">
            <!-- Header -->
            <div class="bg-purple-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <h2 class="text-lg font-medium text-purple-900">对比分析</h2>
            </div>

            <!-- Comparison Content -->
            <div class="p-4 space-y-6">
              <!-- Performance Summary -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-4">整体表现评估</h3>
                <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-600">综合评级</span>
                    <div 
                      class="text-2xl font-bold px-3 py-1 rounded-full"
                      :style="{ 
                        backgroundColor: metricDatasetStore.getGradeColor(analysisData.comparison.performanceGrade),
                        color: 'white'
                      }"
                    >
                      {{ analysisData.comparison.performanceGrade }}
                    </div>
                  </div>
                  <p class="text-sm text-gray-700">
                    {{ getGradeDescription(analysisData.comparison.performanceGrade) }}
                  </p>
                </div>
              </div>

              <!-- Stage-by-Stage Comparison -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-4">各阶段对比</h3>
                <div class="space-y-3">
                  <div 
                    v-for="(stageName, index) in analysisData.companyData.stageNames" 
                    :key="index"
                    class="border border-gray-200 rounded-lg p-3"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-700">{{ stageName }}</span>
                      <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-500">vs 行业平均</span>
                        <span 
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          :class="getComparisonClasses(index)"
                        >
                          {{ getComparisonText(index) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Progress Bars Comparison -->
                    <div class="space-y-2">
                      <!-- Company -->
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-gray-500">公司表现</span>
                          <span class="font-medium">{{ getStageConversionRate(index) }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${Math.min(getStageConversionRate(index), 100)}%` }"
                          ></div>
                        </div>
                      </div>
                      
                      <!-- Benchmark -->
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span class="text-gray-500">行业平均</span>
                          <span class="font-medium">{{ getBenchmarkStageRate(index) }}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-green-500 h-2 rounded-full transition-all duration-300"
                            :style="{ width: `${Math.min(getBenchmarkStageRate(index), 100)}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>

                    <!-- Improvement Potential -->
                    <div v-if="analysisData.comparison.improvementPotential[`stage_${index + 1}` as keyof typeof analysisData.comparison.improvementPotential] > 0" class="mt-2 text-xs text-orange-600">
                      改进潜力: +{{ analysisData.comparison.improvementPotential[`stage_${index + 1}` as keyof typeof analysisData.comparison.improvementPotential].toFixed(1) }}%
                    </div>
                  </div>
                </div>
              </div>

              <!-- Key Metrics Summary -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-4">关键指标摘要</h3>
                <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">整体转化率差异</span>
                    <span 
                      class="text-sm font-medium"
                      :class="overallComparisonDelta >= 0 ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ overallComparisonDelta >= 0 ? '+' : '' }}{{ overallComparisonDelta.toFixed(1) }}%
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">最大改进机会</span>
                    <span class="text-sm font-medium text-orange-600">
                      {{ getBiggestImprovementOpportunity() }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-600">相对排名预估</span>
                    <span class="text-sm font-medium text-blue-600">
                      {{ getEstimatedRanking() }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Recommendations -->
              <div v-if="analysisData.comparison.recommendations.length > 0">
                <h3 class="text-sm font-medium text-gray-900 mb-4">改进建议</h3>
                <div class="space-y-2">
                  <div 
                    v-for="(recommendation, index) in analysisData.comparison.recommendations" 
                    :key="index"
                    class="flex items-start space-x-2 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                  >
                    <div class="flex-shrink-0 mt-0.5">
                      <svg class="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <span>{{ recommendation }}</span>
                  </div>
                </div>
              </div>

              <!-- Export Actions -->
              <div class="pt-4 border-t border-gray-200">
                <button
                  @click="exportDetailedReport"
                  class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  导出详细分析报告
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMetricDatasetStore } from '@/stores/metricDataset';
import type { AnalysisResult, MetricDataset } from '@/api/metricDataset';

// Router and store
const route = useRoute();
const router = useRouter();
const metricDatasetStore = useMetricDatasetStore();

// Reactive data
const loading = ref(true);
const error = ref<string | null>(null);
const refreshInterval = ref<NodeJS.Timeout | null>(null);

// Configuration
const stageColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Computed properties
const analysisData = computed(() => metricDatasetStore.currentAnalysis);
const currentDataset = computed(() => metricDatasetStore.currentDataset);

const maxVisitors = computed(() => {
  if (!analysisData.value) return 1000;
  const stages = [
    analysisData.value.companyData.stage_1,
    analysisData.value.companyData.stage_2,
    analysisData.value.companyData.stage_3,
    analysisData.value.companyData.stage_4
  ];
  const max = Math.max(...stages.map(stage => stage.visitors || 0));
  return max > 0 ? max : 1000;
});

const overallComparisonDelta = computed(() => {
  if (!analysisData.value) return 0;
  const companyRate = analysisData.value.companyData.overallConversionRate;
  const benchmarkRate = getBenchmarkOverallRate();
  return companyRate - benchmarkRate;
});

// Methods
const fetchAnalysisData = async () => {
  const datasetId = route.params.id as string;
  if (!datasetId) {
    error.value = '无效的数据集ID';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    
    // Fetch both dataset and analysis data
    await Promise.all([
      metricDatasetStore.fetchDataset(datasetId),
      metricDatasetStore.fetchAnalysis(datasetId, true, true)
    ]);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取分析数据失败';
  } finally {
    loading.value = false;
  }
};

const refreshAnalysis = async () => {
  await fetchAnalysisData();
};

const getStageData = (index: number) => {
  if (!analysisData.value) return { visitors: 0, converted: 0, conversionRate: 0 };
  const stages = [
    analysisData.value.companyData.stage_1,
    analysisData.value.companyData.stage_2,
    analysisData.value.companyData.stage_3,
    analysisData.value.companyData.stage_4
  ];
  return stages[index] || { visitors: 0, converted: 0, conversionRate: 0 };
};

const getStageConversionRate = (index: number): number => {
  const stage = getStageData(index);
  return stage.conversionRate || 0;
};

const getBenchmarkStageRate = (index: number): number => {
  if (!analysisData.value) return 0;
  const stages = [
    analysisData.value.benchmarkData.averageRates.stage_1,
    analysisData.value.benchmarkData.averageRates.stage_2,
    analysisData.value.benchmarkData.averageRates.stage_3,
    analysisData.value.benchmarkData.averageRates.stage_4
  ];
  return stages[index]?.conversionRate || 0;
};

const getPercentileRate = (percentile: 'p25' | 'p50' | 'p75' | 'p90', index: number): number => {
  if (!analysisData.value) return 0;
  const stages = [
    analysisData.value.benchmarkData.percentiles[percentile].stage_1,
    analysisData.value.benchmarkData.percentiles[percentile].stage_2,
    analysisData.value.benchmarkData.percentiles[percentile].stage_3,
    analysisData.value.benchmarkData.percentiles[percentile].stage_4
  ];
  return stages[index]?.conversionRate || 0;
};

const getBenchmarkOverallRate = (): number => {
  if (!analysisData.value) return 0;
  const benchmark = analysisData.value.benchmarkData.averageRates;
  const initialVisitors = benchmark.stage_1.visitors || 1000;
  const finalConverted = benchmark.stage_4.converted || 0;
  return initialVisitors > 0 ? (finalConverted / initialVisitors * 100) : 0;
};

const getComparisonText = (index: number): string => {
  const companyRate = getStageConversionRate(index);
  const benchmarkRate = getBenchmarkStageRate(index);
  const diff = companyRate - benchmarkRate;
  
  if (Math.abs(diff) < 1) return '持平';
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
};

const getComparisonClasses = (index: number): string => {
  const companyRate = getStageConversionRate(index);
  const benchmarkRate = getBenchmarkStageRate(index);
  const diff = companyRate - benchmarkRate;
  
  if (Math.abs(diff) < 1) return 'bg-gray-100 text-gray-800';
  return diff > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

const getGradeClasses = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
  const classes = {
    A: 'bg-green-100 text-green-800',
    B: 'bg-blue-100 text-blue-800',
    C: 'bg-yellow-100 text-yellow-800',
    D: 'bg-orange-100 text-orange-800',
    F: 'bg-red-100 text-red-800'
  };
  return classes[grade];
};

const getGradeDescription = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
  const descriptions = {
    A: '优秀表现，处于行业领先水平',
    B: '良好表现，高于行业平均水平',
    C: '平均表现，接近行业基准线',
    D: '待改进表现，低于行业平均',
    F: '需要重点改进，远低于行业水平'
  };
  return descriptions[grade];
};

const getBiggestImprovementOpportunity = (): string => {
  if (!analysisData.value) return '暂无数据';
  
  const potentials = analysisData.value.comparison.improvementPotential;
  const stageNames = analysisData.value.companyData.stageNames;
  
  let maxPotential = 0;
  let maxStageIndex = 0;
  
  Object.entries(potentials).forEach(([key, value], index) => {
    if (value > maxPotential) {
      maxPotential = value;
      maxStageIndex = index;
    }
  });
  
  return maxPotential > 0 
    ? `${stageNames[maxStageIndex]} (+${maxPotential.toFixed(1)}%)`
    : '暂无明显改进机会';
};

const getEstimatedRanking = (): string => {
  if (!analysisData.value) return '暂无数据';
  
  const grade = analysisData.value.comparison.performanceGrade;
  const rankings = {
    A: '前10%',
    B: '前25%', 
    C: '中等50%',
    D: '后25%',
    F: '后10%'
  };
  
  return rankings[grade];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

const editData = () => {
  if (currentDataset.value) {
    router.push(`/metrics/edit/${currentDataset.value.id}`);
  }
};

const exportReport = () => {
  // TODO: Implement export functionality
  console.log('Exporting basic report...');
};

const exportDetailedReport = () => {
  // TODO: Implement detailed export functionality
  console.log('Exporting detailed report...');
};

// Lifecycle
onMounted(async () => {
  await fetchAnalysisData();
  
  // Set up auto-refresh every 5 minutes
  refreshInterval.value = setInterval(fetchAnalysisData, 5 * 60 * 1000);
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped>
/* Responsive grid adjustments */
@media (max-width: 1024px) {
  .lg\:col-span-1 {
    @apply col-span-1 mb-6;
  }
}

/* Custom scrollbar for long content */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Gradient animations */
@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}
</style>