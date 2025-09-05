<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">路由功能测试</h1>
      
      <!-- 认证状态 -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">认证状态</h2>
        <div class="space-y-2">
          <p><strong>登录状态:</strong> {{ isAuthenticated ? '✅ 已登录' : '❌ 未登录' }}</p>
          <p><strong>用户名:</strong> {{ user?.name || '无' }}</p>
          <p><strong>Token:</strong> {{ token ? token.substring(0, 20) + '...' : '无' }}</p>
        </div>
      </div>
      
      <!-- 路由测试按钮 -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">路由测试</h2>
        <div class="grid grid-cols-2 gap-4">
          <button @click="testNavigation('/funnels')" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            测试漏斗列表
          </button>
          <button @click="testNavigation('/funnels/create')" 
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            测试创建漏斗
          </button>
          <router-link to="/funnels" 
                       class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-center">
            router-link 漏斗列表
          </router-link>
          <router-link to="/funnels/create" 
                       class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-center">
            router-link 创建漏斗
          </router-link>
        </div>
      </div>
      
      <!-- 测试结果 -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">测试结果</h2>
        <div class="space-y-2 text-sm">
          <div v-for="(log, index) in testLogs" :key="index" 
               :class="log.type === 'error' ? 'text-red-600' : 'text-gray-700'">
            {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated, user, token } = storeToRefs(authStore)

const testLogs = ref<Array<{message: string, type: string, timestamp: Date}>>([])

const addLog = (message: string, type: 'info' | 'error' = 'info') => {
  testLogs.value.push({
    message: `[${new Date().toLocaleTimeString()}] ${message}`,
    type,
    timestamp: new Date()
  })
}

const testNavigation = async (path: string) => {
  try {
    addLog(`尝试导航到: ${path}`)
    await router.push(path)
    addLog(`✅ 成功导航到: ${path}`)
  } catch (error) {
    addLog(`❌ 导航失败: ${error}`, 'error')
  }
}

// 初始化日志
addLog('路由测试页面已加载')
addLog(`当前路由: ${router.currentRoute.value.fullPath}`)
</script>