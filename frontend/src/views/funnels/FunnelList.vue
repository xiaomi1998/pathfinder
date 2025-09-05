<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-900">漏斗</h1>
          <router-link
            to="/funnels/create"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            创建新漏斗
          </router-link>
        </div>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Filters -->
        <div class="bg-white p-4 rounded-lg shadow mb-6">
          <div class="flex flex-wrap gap-4 items-center">
            <div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索漏斗..."
                class="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p class="text-gray-500">加载中...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <p class="text-red-500 mb-4">{{ error }}</p>
        </div>

        <!-- Funnels Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="funnel in filteredFunnels"
            :key="funnel.id"
            class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
          >
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ funnel.name }}</h3>
                  <!-- 标签显示 -->
                  <div v-if="funnel.tags && funnel.tags.length > 0" class="flex flex-wrap gap-1 mb-2">
                    <span v-for="tag in funnel.tags.slice(0, 3)" :key="tag" 
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {{ tag }}
                    </span>
                    <span v-if="funnel.tags.length > 3" 
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      +{{ funnel.tags.length - 3 }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col items-end space-y-1">
                  <span v-if="funnel.isTemplate" 
                        class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                    模板
                  </span>
                </div>
              </div>
              
              <p class="text-gray-600 text-sm mb-4">{{ funnel.description }}</p>
              
              <div class="space-y-2 text-sm text-gray-500 mb-4">
                <div class="flex justify-between">
                  <span>节点数：</span>
                  <span class="font-medium text-blue-600">{{ funnel.nodeCount || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>连接数：</span>
                  <span class="font-medium text-green-600">{{ funnel.edgeCount || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>创建时间：</span>
                  <span>{{ new Date(funnel.createdAt).toLocaleDateString('zh-CN') }}</span>
                </div>
                <div class="flex justify-between">
                  <span>最后更新：</span>
                  <span>{{ funnel.lastUpdated }}</span>
                </div>
              </div>
              
              <div class="flex space-x-2">
                <router-link
                  :to="`/funnels/${funnel.id}`"
                  class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium text-center"
                >
                  查看详情
                </router-link>
                <router-link
                  :to="`/funnels/${funnel.id}/edit`"
                  class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  编辑
                </router-link>
                <button
                  @click="deleteFunnel(funnel.id, funnel.name)"
                  :disabled="isDeleting"
                  class="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  :title="`删除漏斗: ${funnel.name}`"
                >
                  {{ isDeleting ? '删除中...' : '删除' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredFunnels.length === 0" class="text-center py-12">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">未找到漏斗</h3>
          <p class="text-gray-500 mb-4">通过创建您的第一个漏斗来开始</p>
          <router-link
            to="/funnels/create"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            创建新漏斗
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFunnel } from '@composables/useFunnel'

const searchQuery = ref('')
const isDeleting = ref(false)

// 使用真实的漏斗数据
const { funnels: realFunnels, fetchFunnels, isLoading, error } = useFunnel()

// 处理漏斗数据
const enrichedFunnels = computed(() => {
  return realFunnels.value.map(funnel => {
    // 使用API返回的实际数据，如果没有则从canvasData中提取
    const apiNodeCount = funnel.nodeCount ?? 0
    const apiEdgeCount = funnel.edgeCount ?? 0
    const canvasNodes = funnel.canvasData?.nodes || []
    const canvasEdges = funnel.canvasData?.connections || []
    
    // 优先使用API返回的统计数据，否则使用canvas数据计算
    const actualNodeCount = apiNodeCount || canvasNodes.length
    const actualEdgeCount = apiEdgeCount || canvasEdges.length
    
    return {
      ...funnel,
      nodeCount: actualNodeCount,
      edgeCount: actualEdgeCount,
      lastUpdated: formatRelativeTime(new Date(funnel.updated_at))
    }
  })
})

// 格式化相对时间
const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  
  if (diffInDays > 0) {
    return `${diffInDays} 天前`
  } else if (diffInHours > 0) {
    return `${diffInHours} 小时前`
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} 分钟前`
  } else {
    return '刚刚'
  }
}

const filteredFunnels = computed(() => {
  return enrichedFunnels.value.filter(funnel => {
    const matchesSearch = funnel.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (funnel.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesSearch
  })
})

// 删除漏斗功能
const deleteFunnel = async (funnelId: string, funnelName: string) => {
  const confirmed = confirm(`确定要删除漏斗 "${funnelName}" 吗？\n\n此操作将永久删除漏斗及其所有数据，无法恢复。`)
  
  if (!confirmed) return
  
  try {
    isDeleting.value = true
    
    // 调用API删除漏斗
    const { funnelAPI } = await import('@/api/funnel')
    await funnelAPI.deleteFunnel(funnelId)
    
    // 删除成功，刷新漏斗列表
    await fetchFunnels()
    
    // 删除成功，无需显示弹窗
  } catch (error) {
    console.error('删除漏斗失败:', error)
    alert(`删除失败: ${error.message || '未知错误'}`)
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  console.log('FunnelList mounted, loading funnels...')
  try {
    await fetchFunnels()
    console.log('Funnels loaded:', realFunnels.value.length)
  } catch (err) {
    console.error('Failed to load funnels:', err)
  }
})
</script>