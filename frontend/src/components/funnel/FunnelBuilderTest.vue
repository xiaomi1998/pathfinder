<template>
  <div class="funnel-builder-test w-full h-screen flex bg-gray-100 dark:bg-gray-900">
    <!-- Node Palette -->
    <NodePalette />
    
    <!-- Canvas Area -->
    <div class="flex-1 relative">
      <FunnelCanvas
        :width="800"
        :height="600"
        :show-grid="true"
        :snap-to-grid="true"
        @node-select="handleNodeSelect"
        @edge-select="handleEdgeSelect"
        @canvas-click="handleCanvasClick"
      />
      
      <!-- Instructions Overlay -->
      <div class="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md border border-gray-200 dark:border-gray-600">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">拖拽操作测试</h3>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>✓ 从左侧面板拖拽节点到画布创建新节点</p>
          <p>✓ 拖拽节点在画布上移动位置</p>
          <p>✓ 从输出连接点拖拽到输入连接点创建连接</p>
          <p>✓ 使用鼠标滚轮缩放画布</p>
          <p>✓ 按住空格键重置视图</p>
          <p>✓ 按F键适应画布大小</p>
          <p>✓ 按G键切换网格显示</p>
        </div>
        <div v-if="selectedInfo" class="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
          <strong>已选择:</strong> {{ selectedInfo }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NodePalette from './NodePalette.vue'
import FunnelCanvas from './FunnelCanvas.vue'

// State
const selectedInfo = ref<string>('')

// Event handlers
const handleNodeSelect = (nodeId: string | null) => {
  if (nodeId) {
    selectedInfo.value = `节点 ${nodeId}`
  } else {
    selectedInfo.value = ''
  }
}

const handleEdgeSelect = (edgeId: string | null) => {
  if (edgeId) {
    selectedInfo.value = `连接 ${edgeId}`
  } else {
    selectedInfo.value = ''
  }
}

const handleCanvasClick = (position: { x: number, y: number }) => {
  selectedInfo.value = `画布位置 (${Math.round(position.x)}, ${Math.round(position.y)})`
  setTimeout(() => {
    selectedInfo.value = ''
  }, 2000)
}
</script>

<style scoped>
.funnel-builder-test {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>