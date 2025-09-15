<template>
  <div class="funnel-analytics min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Page Header -->
    <div class="bg-white shadow-sm dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button
                @click="$router.back()"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <ArrowLeftIcon class="w-4 h-4 mr-2" />
                返回
              </button>
              
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ funnel?.name || '漏斗分析' }}
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  数据分析和性能洞察
                </p>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center space-x-3">
              <router-link
                :to="`/metrics/funnel?funnelId=${$route.params.id}`"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PencilSquareIcon class="w-4 h-4 mr-2" />
                录入数据
              </router-link>
              
              <button
                @click="refreshData"
                :disabled="isLoading"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <ArrowPathIcon :class="isLoading ? 'animate-spin' : ''" class="w-4 h-4 mr-2" />
                刷新数据
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Loading State -->
      <div v-if="isLoading && !funnel" class="text-center py-12">
        <LoadingSpinner size="large" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          加载分析数据...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-red-500" />
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          加载失败
        </h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ error }}
        </p>
        <button
          @click="loadFunnel"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          重试
        </button>
      </div>

      <!-- Analytics Content -->
      <div v-else-if="funnel" class="space-y-8">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Visitors -->
          <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <UsersIcon class="h-8 w-8 text-gray-400" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                      总访客数
                    </dt>
                    <dd class="text-lg font-medium text-gray-900 dark:text-white">
                      {{ formatNumber(analyticsData.totalVisitors) }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
              <div class="text-sm">
                <span :class="getTrendColor(analyticsData.trends.visitorsChange)">
                  {{ formatPercentage(analyticsData.trends.visitorsChange) }}
                </span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">vs 上期</span>
              </div>
            </div>
          </div>

          <!-- Overall Conversion Rate -->
          <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <ArrowTrendingUpIcon class="h-8 w-8 text-gray-400" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                      整体转化率
                    </dt>
                    <dd class="text-lg font-medium text-gray-900 dark:text-white">
                      {{ formatPercentage(analyticsData.overallConversionRate) }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
              <div class="text-sm">
                <span :class="getTrendColor(analyticsData.trends.conversionChange)">
                  {{ formatPercentage(analyticsData.trends.conversionChange) }}
                </span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">vs 上期</span>
              </div>
            </div>
          </div>

          <!-- Total Revenue -->
          <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <CurrencyDollarIcon class="h-8 w-8 text-gray-400" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                      总收入
                    </dt>
                    <dd class="text-lg font-medium text-gray-900 dark:text-white">
                      {{ formatCurrency(analyticsData.totalRevenue) }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-5 py-3 dark:bg-gray-700">
              <div class="text-sm">
                <span :class="getTrendColor(analyticsData.trends.revenueChange)">
                  {{ formatPercentage(analyticsData.trends.revenueChange) }}
                </span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">vs 上期</span>
              </div>
            </div>
          </div>

          <!-- Average Time in Funnel -->
          <div class="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <ClockIcon class="h-8 w-8 text-gray-400" />
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                      平均流程时间
                    </dt>
                    <dd class="text-lg font-medium text-gray-900 dark:text-white">
                      {{ formatDuration(analyticsData.averageTimeInFunnel) }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Node Performance Table -->
        <div class="bg-white shadow rounded-lg dark:bg-gray-800">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              节点性能分析
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              各节点的转化表现和用户行为分析
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    节点
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    访客数
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    转化数
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    转化率
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    流失率
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    平均停留时间
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                <tr v-for="node in analyticsData.nodeMetrics" :key="node.id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ node.name }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatNumber(node.visitors) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatNumber(node.conversions) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="getConversionRateColor(node.conversionRate)">
                      {{ formatPercentage(node.conversionRate) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span :class="getDropOffRateColor(node.dropOffRate)">
                      {{ formatPercentage(node.dropOffRate) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDuration(node.averageTime) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Funnel Visualization -->
        <div class="bg-white shadow rounded-lg dark:bg-gray-800">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              漏斗可视化
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              用户在漏斗中的流转情况
            </p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div 
                v-for="(node, index) in analyticsData.nodeMetrics" 
                :key="node.id"
                class="relative"
              >
                <!-- Node Bar -->
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0 w-24 text-sm font-medium text-gray-900 dark:text-white">
                    {{ node.name }}
                  </div>
                  <div class="flex-1">
                    <div class="w-full bg-gray-200 rounded-full h-8 dark:bg-gray-700">
                      <div 
                        class="bg-blue-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        :style="`width: ${getNodeWidthPercentage(node, index)}%`"
                      >
                        {{ formatNumber(node.visitors) }}
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 w-16 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {{ formatPercentage(node.conversionRate) }}
                  </div>
                </div>
                
                <!-- Drop-off indicator -->
                <div v-if="index < analyticsData.nodeMetrics.length - 1" class="flex justify-end mt-2 mr-20">
                  <div class="text-xs text-red-500">
                    流失: {{ formatNumber(getDropOffCount(node, analyticsData.nodeMetrics[index + 1])) }}
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowLeftIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'

// Components
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// Stores
import { useFunnelStore } from '@/stores/funnel'

// Types
import type { Funnel } from '@/types'

const router = useRouter()
const route = useRoute()
const funnelStore = useFunnelStore()

// State
const funnel = ref<Funnel | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

// Mock analytics data - in real implementation, fetch from API
const analyticsData = ref({
  totalVisitors: 12450,
  overallConversionRate: 0.125,
  totalRevenue: 98750.50,
  averageTimeInFunnel: 1800, // seconds
  trends: {
    visitorsChange: 0.15,
    conversionChange: -0.03,
    revenueChange: 0.22
  },
  nodeMetrics: [
    { id: '1', name: '首页访问', visitors: 12450, conversions: 8920, conversionRate: 0.717, dropOffRate: 0.283, averageTime: 120 },
    { id: '2', name: '产品浏览', visitors: 8920, conversions: 4560, conversionRate: 0.511, dropOffRate: 0.489, averageTime: 300 },
    { id: '3', name: '添加到购物车', visitors: 4560, conversions: 2830, conversionRate: 0.621, dropOffRate: 0.379, averageTime: 180 },
    { id: '4', name: '结账页面', visitors: 2830, conversions: 1920, conversionRate: 0.679, dropOffRate: 0.321, averageTime: 240 },
    { id: '5', name: '支付成功', visitors: 1920, conversions: 1550, conversionRate: 0.807, dropOffRate: 0.193, averageTime: 60 }
  ]
})

// Methods
const loadFunnel = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const funnelId = route.params.id as string
    if (!funnelId) {
      error.value = '漏斗ID不能为空'
      return
    }

    // Load funnel details
    await funnelStore.fetchFunnelById(funnelId)
    funnel.value = funnelStore.currentFunnel

    if (!funnel.value) {
      error.value = '未找到指定的漏斗'
      return
    }

    // TODO: Load analytics data from API
    // const analytics = await analyticsAPI.getFunnelAnalytics(funnelId)
    // analyticsData.value = analytics
    
  } catch (err: any) {
    console.error('Error loading funnel analytics:', err)
    error.value = err.message || '加载漏斗分析数据失败'
  } finally {
    isLoading.value = false
  }
}

const refreshData = async () => {
  await loadFunnel()
}

// Helper functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

const formatPercentage = (num: number): string => {
  const sign = num > 0 ? '+' : ''
  return `${sign}${(num * 100).toFixed(2)}%`
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

const getTrendColor = (change: number): string => {
  if (change > 0) return 'text-green-600 dark:text-green-400'
  if (change < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const getConversionRateColor = (rate: number): string => {
  if (rate >= 0.7) return 'text-green-600 font-medium'
  if (rate >= 0.5) return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

const getDropOffRateColor = (rate: number): string => {
  if (rate <= 0.2) return 'text-green-600 font-medium'
  if (rate <= 0.4) return 'text-yellow-600 font-medium'
  return 'text-red-600 font-medium'
}

const getNodeWidthPercentage = (node: any, index: number): number => {
  const maxVisitors = analyticsData.value.nodeMetrics[0].visitors
  return (node.visitors / maxVisitors) * 100
}

const getDropOffCount = (currentNode: any, nextNode: any): number => {
  return currentNode.visitors - nextNode.visitors
}

// Lifecycle
onMounted(() => {
  loadFunnel()
})
</script>

<style scoped>
.funnel-analytics {
  /* Component specific styles if needed */
}
</style>