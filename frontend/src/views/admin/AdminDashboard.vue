<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-gray-900">管理员后台</h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-600">
              欢迎回来，{{ adminStore.admin?.username }}
            </div>
            <button
              @click="handleLogout"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8">
          <router-link
            to="/admin/dashboard"
            class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            active-class="border-indigo-500 text-indigo-600"
          >
            仪表板
          </router-link>
          <router-link
            to="/admin/users"
            class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            active-class="border-indigo-500 text-indigo-600"
          >
            用户管理
          </router-link>
          <router-link
            to="/admin/usage-stats"
            class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            active-class="border-indigo-500 text-indigo-600"
          >
            用量统计
          </router-link>
          <router-link
            to="/admin/benchmarks"
            class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            active-class="border-indigo-500 text-indigo-600"
          >
            基准数据
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="px-4 py-6 sm:px-0">
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">总用户数</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats?.totalUsers || 0 }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">活跃用户</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats?.activeUsers || 0 }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">今日AI请求</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ stats?.todayAiRequests || 0 }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">总AI请求</dt>
                    <dd class="text-lg font-medium text-gray-900">{{ formatNumber(stats?.totalAiRequests || 0) }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Usage Trend Chart -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">AI使用趋势</h3>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">今日</span>
                  <span class="font-medium">{{ stats?.todayAiRequests || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">本周</span>
                  <span class="font-medium">{{ stats?.weekAiRequests || 0 }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-500">本月</span>
                  <span class="font-medium">{{ stats?.monthAiRequests || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Usage by Type -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">使用类型分布</h3>
              <div class="space-y-3">
                <div v-for="usage in stats?.usageByType" :key="usage.type" class="flex justify-between items-center text-sm">
                  <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: getTypeColor(usage.type) }"></div>
                    <span class="text-gray-500 capitalize">{{ getTypeLabel(usage.type) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-medium">{{ usage.count }}</span>
                    <span class="text-gray-400 ml-2">({{ usage.percentage }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Users Table -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900">用量排行榜</h3>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">AI使用量最高的用户</p>
          </div>
          <div class="border-t border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总使用量</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">本月使用量</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in stats?.topUsers" :key="user.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ user.username }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(user.totalUsage) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(user.monthUsage) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();

const loading = ref(true);
const stats = ref<any>(null);

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num);
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    chat: '#3B82F6',
    analysis: '#10B981',
    recommendation: '#F59E0B',
    general: '#6B7280'
  };
  return colors[type] || '#6B7280';
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    chat: '聊天对话',
    analysis: '数据分析',
    recommendation: '推荐建议',
    general: '通用功能'
  };
  return labels[type] || type;
};

const loadStats = async () => {
  try {
    loading.value = true;
    stats.value = await adminStore.getUsageStats();
  } catch (error) {
    console.error('Failed to load stats:', error);
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await adminStore.logout();
    router.push('/admin/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>