<template>
  <div class="test-container">
    <h2>Markdown渲染测试</h2>
    
    <div class="test-section">
      <h3>测试内容:</h3>
      <pre>{{ testContent }}</pre>
    </div>
    
    <div class="test-section">
      <h3>渲染结果:</h3>
      <MarkdownRenderer :content="testContent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const testContent = `**决策建议**：即刻批准「30-Day Warp Drive」预算，成立 War-Room，CEO 直接挂帅，产品、增长、财务、法务四线并行。

- 引入「Starter / Growth / Scale」+ Usage-overage，月结后 15 天自动推荐升档

## 主要优化方向

1. **注册流程优化**
2. **用户体验提升**
3. **转化率监控**

这是一个测试段落，包含*斜体*和**粗体**文本。`
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.test-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.test-section h3 {
  margin-bottom: 10px;
  color: #374151;
}

pre {
  background: #f3f4f6;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 14px;
}
</style>