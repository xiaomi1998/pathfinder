<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="md:flex md:items-center md:justify-between">
          <div class="flex-1 min-w-0">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              欢迎回来，{{ userName }}
            </h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              以下是您今天漏斗的情况。
            </p>
          </div>
          <div class="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <router-link
              to="/funnels/create"
              class="btn btn-primary"
            >
              <PlusIcon class="w-4 h-4 mr-2" />
              创建漏斗
            </router-link>
            <router-link
              to="/analytics"
              class="btn btn-outline"
            >
              <ChartBarIcon class="w-4 h-4 mr-2" />
              查看分析
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <FunnelIcon class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">漏斗总数</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalFunnels }}</div>
                  <div class="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpIcon class="w-3 h-3 mr-1" />
                    较上月增长 +{{ stats.funnelGrowth }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <UsersIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">活跃用户</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(stats.activeUsers) }}</div>
                  <div class="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpIcon class="w-3 h-3 mr-1" />
                    较上月增长 +{{ stats.userGrowth }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <ChartBarIcon class="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">转化率</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.conversionRate }}%</div>
                  <div class="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                    <ArrowDownIcon class="w-3 h-3 mr-1" />
                    较上月下降 -{{ stats.conversionChange }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <CurrencyDollarIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div class="ml-4 flex-1">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">收入</div>
                  <div class="text-2xl font-bold text-gray-900 dark:text-white">${{ formatNumber(stats.revenue) }}</div>
                  <div class="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <ArrowUpIcon class="w-3 h-3 mr-1" />
                    较上月增长 +{{ stats.revenueGrowth }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Funnel Performance Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">漏斗性能</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">迗 30 天</p>
            </div>
            <div class="card-body">
              <div class="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-center">
                  <ChartBarIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">图表将使用 Chart.js 实现</p>
                </div>
              </div>
            </div>
          </div>

          <!-- User Activity Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">用户活动</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">周概览</p>
            </div>
            <div class="card-body">
              <div class="h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div class="text-center">
                  <ChartPieIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p class="text-sm text-gray-500 dark:text-gray-400">图表将使用 Chart.js 实现</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity & Top Funnels -->
        <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">近期活动</h3>
            </div>
            <div class="card-body">
              <div class="flow-root">
                <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                  <li v-for="activity in recentActivities" :key="activity.id" class="py-4">
                    <div class="flex items-center space-x-4">
                      <div class="flex-shrink-0">
                        <div :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          activity.type === 'created' ? 'bg-green-100 dark:bg-green-900' : '',
                          activity.type === 'updated' ? 'bg-blue-100 dark:bg-blue-900' : '',
                          activity.type === 'deleted' ? 'bg-red-100 dark:bg-red-900' : ''
                        ]">
                          <component 
                            :is="getActivityIcon(activity.type)" 
                            :class="[
                              'w-4 h-4',
                              activity.type === 'created' ? 'text-green-600 dark:text-green-400' : '',
                              activity.type === 'updated' ? 'text-blue-600 dark:text-blue-400' : '',
                              activity.type === 'deleted' ? 'text-red-600 dark:text-red-400' : ''
                            ]" 
                          />
                        </div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-900 dark:text-white">
                          {{ activity.description }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ formatRelativeTime(activity.timestamp) }}
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="mt-6">
                <router-link 
                  to="/analytics" 
                  class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  查看所有活动 →
                </router-link>
              </div>
            </div>
          </div>

          <!-- Top Performing Funnels -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">表现最佳的漏斗</h3>
            </div>
            <div class="card-body">
              <div class="space-y-4">
                <div v-for="funnel in topFunnels" :key="funnel.id" class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <div class="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <FunnelIcon class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ funnel.name }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ funnel.visits }} 访问</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ funnel.conversionRate }}%</div>
                    <div :class="[
                      'text-xs flex items-center',
                      funnel.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    ]">
                      <ArrowUpIcon v-if="funnel.trend > 0" class="w-3 h-3 mr-1" />
                      <ArrowDownIcon v-else class="w-3 h-3 mr-1" />
                      {{ Math.abs(funnel.trend) }}%
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-6">
                <router-link 
                  to="/funnels" 
                  class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  查看所有漏斗 →
                </router-link>
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
import { formatDistanceToNow } from 'date-fns'
import {
  PlusIcon,
  ChartBarIcon,
  ChartPieIcon,
  FunnelIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth'

const authStore = useAuthStore()

const stats = ref({
  totalFunnels: 12,
  funnelGrowth: 8.2,
  activeUsers: 1284,
  userGrowth: 12.5,
  conversionRate: 23.5,
  conversionChange: 2.1,
  revenue: 45680,
  revenueGrowth: 18.7
})

const recentActivities = ref([
  {
    id: 1,
    type: 'created',
    description: '新漏斗“电商结算流程”已创建',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    type: 'updated',
    description: '漏斗“用户入门”性能提升了 15%',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
  },
  {
    id: 3,
    type: 'created',
    description: '为手机用户创建了新的用户细分',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
  },
  {
    id: 4,
    type: 'updated',
    description: '仪表板分析数据已刷新',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
  },
  {
    id: 5,
    type: 'created',
    description: '新的 A/B 测试活动已启动',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  }
])

const topFunnels = ref([
  {
    id: 1,
    name: '电商结算',
    visits: 2547,
    conversionRate: 32.8,
    trend: 5.2
  },
  {
    id: 2,
    name: '用户注册',
    visits: 1893,
    conversionRate: 28.4,
    trend: 2.1
  },
  {
    id: 3,
    name: '邮箱注册',
    visits: 1654,
    conversionRate: 45.7,
    trend: -1.3
  },
  {
    id: 4,
    name: '产品演示申请',
    visits: 1234,
    conversionRate: 19.2,
    trend: 8.9
  },
  {
    id: 5,
    name: '新闻通讯订阅',
    visits: 987,
    conversionRate: 52.1,
    trend: 3.4
  }
])

// Computed properties
const userName = computed(() => {
  const user = authStore.user
  if (!user) return 'User'
  return user.name ? user.name.split(' ')[0] : user.email.split('@')[0]
})

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true })
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'created':
      return PlusCircleIcon
    case 'updated':
      return PencilIcon
    case 'deleted':
      return TrashIcon
    default:
      return PencilIcon
  }
}

const loadDashboardData = async () => {
  try {
    // TODO: Implement actual API calls
    // const [statsData, activitiesData, funnelsData] = await Promise.all([
    //   dashboardAPI.getStats(),
    //   dashboardAPI.getRecentActivities(),
    //   dashboardAPI.getTopFunnels()
    // ])
    
    console.log('Loading dashboard data...')
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>