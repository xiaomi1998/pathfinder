<template>
  <div class="hidden lg:flex lg:flex-col lg:justify-center lg:px-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
    <div class="max-w-lg mx-auto">
      <!-- Logo and Brand -->
      <div class="flex items-center space-x-4 mb-12">
        <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <span class="text-white font-bold text-2xl">P</span>
        </div>
        <div>
          <h1 class="text-3xl font-bold">Pathfinder</h1>
          <p class="text-primary-100 text-lg">业务漏斗分析专家</p>
        </div>
      </div>

      <!-- Main Title -->
      <div class="mb-8">
        <h2 class="text-4xl font-bold mb-6 leading-tight">
          发现业务增长的<br>
          <span class="text-primary-200">关键路径</span>
        </h2>
        <p class="text-primary-100 text-lg leading-relaxed">
          通过可视化漏斗分析，快速定位业务流失节点，获得数据驱动的优化建议，与同行业数据对比，提升转化率。
        </p>
      </div>

      <!-- Features -->
      <div class="space-y-6">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="text-lg font-medium">5分钟快速设置漏斗模型</span>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="text-lg font-medium">智能分析报告，精准定位问题</span>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <span class="text-lg font-medium">同行业数据对比分析</span>
        </div>
      </div>

      <!-- Background decoration -->
      <div class="absolute bottom-0 right-0 opacity-10">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="100" cy="100" r="60" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="100" cy="100" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 纯展示组件，无需逻辑
</script>