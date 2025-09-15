<template>
  <div class="conversion-trend-chart">
    <div v-if="loading" class="loading-state flex items-center justify-center h-80 text-gray-500">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>加载趋势数据中...</p>
      </div>
    </div>
    
    <div v-else-if="!chartData || chartData.length === 0" class="empty-state flex items-center justify-center h-80 text-gray-500">
      <div class="text-center">
        <ChartBarIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无趋势数据</p>
        <p class="text-sm mt-2">请先录入漏斗数据</p>
      </div>
    </div>
    
    <div v-else class="chart-container">
      <canvas ref="chartRef" class="w-full h-80"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// 注册Chart.js组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TrendDataPoint {
  date: string
  conversionRate: number
  entries: number
  conversions: number
  revenue?: number
}

interface Props {
  data: TrendDataPoint[]
  loading?: boolean
  period?: string
}

const props = defineProps<Props>()

const chartRef = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null

// 格式化图表数据
const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null
  
  return props.data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

// 创建图表
const createChart = async () => {
  if (!chartRef.value || !chartData.value) return
  
  await nextTick()
  
  // 销毁现有图表
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  const ctx = chartRef.value.getContext('2d')
  if (!ctx) return
  
  const labels = chartData.value.map(item => {
    const date = new Date(item.date)
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    })
  })
  
  const conversionRates = chartData.value.map(item => item.conversionRate)
  const entries = chartData.value.map(item => item.entries)
  const maxEntries = Math.max(...entries)
  
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '转化率 (%)',
          data: conversionRates,
          borderColor: '#0052d9',
          backgroundColor: 'rgba(0, 82, 217, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0052d9',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          yAxisID: 'y'
        },
        {
          label: '访问量',
          data: entries,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#ddd',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: function(context) {
              const index = context[0].dataIndex
              const date = new Date(chartData.value![index].date)
              return date.toLocaleDateString('zh-CN', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric' 
              })
            },
            afterBody: function(context) {
              const index = context[0].dataIndex
              const item = chartData.value![index]
              return [
                `转化数: ${item.conversions}`,
                item.revenue ? `收入: ¥${item.revenue.toLocaleString()}` : ''
              ].filter(Boolean)
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          max: Math.max(...conversionRates) * 1.2,
          title: {
            display: true,
            text: '转化率 (%)',
            color: '#0052d9',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            callback: function(value) {
              return value + '%'
            },
            font: {
              size: 11
            },
            color: '#0052d9'
          },
          grid: {
            color: 'rgba(0, 82, 217, 0.1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          max: maxEntries * 1.2,
          title: {
            display: true,
            text: '访问量',
            color: '#10b981',
            font: {
              size: 12,
              weight: 'bold'
            }
          },
          ticks: {
            font: {
              size: 11
            },
            color: '#10b981'
          },
          grid: {
            drawOnChartArea: false,
            color: 'rgba(16, 185, 129, 0.1)'
          }
        }
      }
    }
  })
}

// 监听数据变化
watch(
  () => [props.data, props.loading],
  async ([newData, newLoading]) => {
    if (!newLoading && newData) {
      await createChart()
    }
  },
  { immediate: true }
)

// 生命周期
onMounted(() => {
  if (!props.loading && props.data) {
    createChart()
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>

<style scoped>
.conversion-trend-chart {
  height: 320px;
}

.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.loading-state, .empty-state {
  background: #f9fafb;
  border-radius: 8px;
  border: 1px dashed #d1d5db;
}
</style>