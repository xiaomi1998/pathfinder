<template>
  <div class="funnel-visualization">
    <div v-if="stageData.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无漏斗数据</div>
      <div class="empty-subtitle">请先录入数据后查看分析</div>
    </div>
    
    <div v-else class="funnel-container">
      <div 
        v-for="(stage, index) in stageData" 
        :key="stage.nodeId"
        class="funnel-stage-wrapper"
      >
        <div 
          class="funnel-stage"
          :class="`stage-${index + 1}`"
          :style="getStageStyle(stage, index)"
          @click="$emit('stage-click', stage)"
        >
          <div class="stage-content">
            <div class="stage-text">
              <div class="stage-name" :title="stage.nodeName">{{ getTruncatedName(stage.nodeName) }}</div>
              <div class="stage-subtitle">第{{ index + 1 }}步 • {{ formatPercent(stage.conversionRate) }}%</div>
            </div>
            <div class="stage-number">
              {{ formatNumber(stage.entries) }}
            </div>
          </div>
          
        </div>
        
        <div v-if="index < stageData.length - 1" class="funnel-arrow">
          <ChevronDownIcon class="w-6 h-6 text-gray-400" />
          <div class="conversion-flow">
            <span class="flow-rate">{{ getFlowRate(index) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { formatNumber, formatPercent } from '@/utils/dateUtils'

interface StageData {
  nodeId: string
  nodeName: string
  entries: number
  conversions: number
  conversionRate: number
}

interface Props {
  funnel: any
  metrics: {
    stageMetrics: StageData[]
  }
}

defineEmits<{
  'stage-click': [stage: StageData]
}>()

const props = defineProps<Props>()

// 计算阶段数据
const stageData = computed(() => {
  if (!props.metrics?.stageMetrics) return []
  
  return props.metrics.stageMetrics.map((stage, index) => ({
    ...stage,
    order: index
  }))
})

// 获取阶段样式
const getStageStyle = (stage: StageData, index: number) => {
  const maxEntries = Math.max(...stageData.value.map(s => s.entries))
  const relativeSize = maxEntries > 0 ? (stage.entries / maxEntries) : 1
  
  const colors = [
    { bg: 'linear-gradient(135deg, #0052d9 0%, #366ef4 100%)', baseWidth: 220 },
    { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', baseWidth: 200 },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', baseWidth: 180 },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', baseWidth: 160 },
    { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', baseWidth: 140 }
  ]
  
  const colorIndex = Math.min(index, colors.length - 1)
  const color = colors[colorIndex]
  
  // 根据数据量动态调整宽度，但保持漏斗形状
  const minWidth = 160 // 增加最小宽度确保数字能完整显示
  const calculatedWidth = Math.max(minWidth, color.baseWidth * (0.7 + 0.3 * relativeSize))
  
  return {
    background: color.bg,
    width: `${calculatedWidth}px`,
    height: '45px'
  }
}


// 计算转化流量率
const getFlowRate = (index: number) => {
  if (index >= stageData.value.length - 1) return 0
  const currentStage = stageData.value[index]
  const nextStage = stageData.value[index + 1]
  if (currentStage.entries === 0) return 0
  return formatPercent((nextStage.entries / currentStage.entries) * 100)
}

// 截断长文本
const getTruncatedName = (name: string) => {
  if (name.length <= 8) return name
  return name.substring(0, 8) + '...'
}
</script>

<style scoped>
.funnel-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  min-height: 200px;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.empty-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.funnel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  max-width: 350px;
}

.funnel-stage-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.funnel-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  padding: 0 20px;
  overflow: visible; /* 改为visible确保文字不被剪切 */
  backdrop-filter: blur(10px);
}

.funnel-stage:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
}

.funnel-stage:active {
  transform: translateY(0) scale(0.98);
}

.stage-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-align: center;
  z-index: 2;
  gap: 2px;
  padding: 4px;
}

.stage-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
}

.stage-name {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  color: white !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-bottom: 2px;
  white-space: nowrap;
}

.stage-subtitle {
  font-size: 11px;
  opacity: 0.85;
  font-weight: 500;
  color: white !important;
  white-space: nowrap;
}

.stage-number {
  font-size: 20px;
  font-weight: 800;
  color: white !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1;
}


.funnel-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #94a3b8;
  margin: 4px 0;
  position: relative;
}

.conversion-flow {
  margin-top: 4px;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  padding: 2px 8px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.flow-rate {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .funnel-visualization {
    padding: 24px 16px;
  }
  
  .funnel-container {
    max-width: 100%;
  }
  
  .funnel-stage {
    font-size: 12px;
    height: 60px !important;
    min-width: 220px; /* 增加移动端最小宽度 */
    padding: 0 16px;
  }
  
  .stage-name {
    font-size: 12px;
  }
  
  .stage-subtitle {
    font-size: 10px;
  }
  
  .stage-number {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .funnel-stage {
    height: 55px !important;
    min-width: 200px; /* 增加小屏最小宽度 */
    padding: 0 12px;
  }
  
  .stage-name {
    font-size: 11px;
  }
  
  .stage-subtitle {
    font-size: 9px;
  }
  
  .stage-number {
    font-size: 14px;
  }
}
</style>