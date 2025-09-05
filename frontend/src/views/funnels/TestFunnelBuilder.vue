<template>
  <div class="h-screen flex flex-col bg-gray-50">
    <div class="bg-white border-b border-gray-200 px-6 py-3">
      <h1 class="text-xl font-bold text-gray-900">测试漏斗构建器</h1>
      <p class="text-sm text-gray-600">节点数量: {{ nodes.length }}</p>
    </div>

    <div class="flex-1 flex">
      <!-- 左侧节点库 -->
      <div class="w-64 bg-white border-r border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">节点库</h3>
        <div class="space-y-2">
          <button @click="addTestNode" 
                  class="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div class="font-medium text-gray-900">添加测试节点</div>
            <div class="text-sm text-gray-600">点击测试</div>
          </button>
          
          <button @click="clearNodes" 
                  class="w-full p-3 border border-red-200 rounded-lg hover:bg-red-50 text-left">
            <div class="font-medium text-red-900">清空节点</div>
            <div class="text-sm text-red-600">删除所有</div>
          </button>
        </div>
      </div>

      <!-- 中央画布区域 -->
      <div class="flex-1 relative overflow-hidden bg-gray-100 p-4">
        <div class="space-y-2">
          <div v-for="node in nodes" :key="node.id"
               class="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
            <div class="font-medium text-gray-900">{{ node.label }}</div>
            <div class="text-sm text-gray-600">ID: {{ node.id }}</div>
          </div>
          
          <div v-if="nodes.length === 0" class="text-gray-500 text-center py-8">
            暂无节点，点击左侧按钮添加
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="w-80 bg-white border-l border-gray-200 p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">状态信息</h3>
        <div class="space-y-2 text-sm">
          <div>节点总数: {{ nodes.length }}</div>
          <div>最后操作: {{ lastAction }}</div>
          <div>当前时间: {{ currentTime }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const nodes = ref([])
const lastAction = ref('无')
const currentTime = ref('')

const generateId = () => Math.random().toString(36).substring(2, 15)

const addTestNode = () => {
  console.log('添加测试节点 - 按钮被点击')
  const newNode = {
    id: generateId(),
    label: `测试节点 ${nodes.value.length + 1}`,
    type: 'test'
  }
  nodes.value.push(newNode)
  lastAction.value = '添加节点'
  console.log('节点已添加:', newNode)
}

const clearNodes = () => {
  console.log('清空节点 - 按钮被点击')
  nodes.value = []
  lastAction.value = '清空节点'
  console.log('所有节点已清空')
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  console.log('TestFunnelBuilder 组件已挂载')
})
</script>