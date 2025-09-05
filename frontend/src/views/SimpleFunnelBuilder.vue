<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">简单漏斗构建器测试</h1>
    
    <div class="bg-white rounded-lg shadow p-6">
      <p class="text-lg text-gray-700 mb-4">
        如果你能看到这个页面，说明路由系统正常工作！
      </p>
      
      <div class="space-y-4">
        <div>
          <strong>当前路由:</strong> {{ $route.fullPath }}
        </div>
        <div>
          <strong>路由参数:</strong> {{ JSON.stringify($route.params) }}
        </div>
        <div>
          <strong>时间:</strong> {{ new Date().toLocaleString() }}
        </div>
      </div>
      
      <div class="mt-6">
        <router-link to="/funnels" 
                     class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4">
          返回漏斗列表
        </router-link>
        <button @click="testAlert" 
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          测试JavaScript功能
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const testAlert = () => {
  alert('JavaScript功能正常工作！')
  console.log('测试按钮被点击')
  console.log('当前路由:', route.fullPath)
}

console.log('SimpleFunnelBuilder 组件已加载')
console.log('路由参数:', route.params)
</script>