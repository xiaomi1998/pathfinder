<template>
  <div class="data-entry-reminder">
    <!-- 统计信息标题栏 -->
    <div class="header-stats flex items-center justify-between mb-4">
      <div class="stats-row flex items-center gap-8">
        <div class="stat-item text-center">
          <div class="stat-value missing text-lg font-bold text-red-600">{{ missingDaysCount }}</div>
          <div class="stat-label text-xs text-gray-600">天缺失</div>
        </div>
        <div class="stat-item text-center">
          <div class="stat-value updated text-lg font-bold text-green-600">{{ completedDaysCount }}</div>
          <div class="stat-label text-xs text-gray-600">天已更新</div>
        </div>
        <div class="stat-item text-center">
          <div class="stat-value rate text-lg font-bold text-blue-600">{{ completionRate }}%</div>
          <div class="stat-label text-xs text-gray-600">完成率</div>
        </div>
      </div>
      <button 
        @click="$emit('quick-entry')"
        class="btn-reminder inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 gap-2"
      >
        <PlusIcon class="w-4 h-4" />
        立即录入
      </button>
    </div>

    <!-- 水平日历条 -->
    <div class="horizontal-calendar">
      <div class="calendar-strip flex gap-1">
        <div 
          v-for="day in horizontalCalendarDays" 
          :key="day.fullDate.toISOString()"
          @click="handleDateClick(day)"
          :class="[
            'day-cell flex-1 text-center px-2 py-3 rounded-lg cursor-pointer transition-all duration-200 min-w-0 relative',
            day.isToday ? 'bg-blue-100 border border-blue-600 text-blue-800' : '',
            day.hasData ? 'bg-green-100 border border-green-300 text-green-800' : '',
            day.isMissing ? 'bg-orange-100 border border-orange-300 text-orange-800' : '',
            day.isFuture ? 'bg-gray-50 border border-gray-200 text-gray-400 opacity-50 cursor-not-allowed' : '',
            !day.isToday && !day.hasData && !day.isMissing && !day.isFuture ? 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100' : ''
          ]"
        >
          <div class="day-cell-content flex items-center justify-center gap-2">
            <div class="day-info">
              <div class="day-cell-date text-sm font-semibold">{{ day.monthDay }}</div>
              <div class="day-cell-day text-xs opacity-70">{{ day.weekDay }}</div>
            </div>
            <div 
              :class="[
                'day-cell-status w-1.5 h-1.5 rounded-full',
                day.hasData ? 'bg-green-500' : '',
                day.isMissing ? 'bg-orange-500' : '',
                day.isToday ? 'bg-blue-600' : '',
                day.isFuture ? 'bg-gray-400' : ''
              ]"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据缺失警告 -->
    <div v-if="missingDaysCount > 0" class="missing-alert mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
      <div class="flex items-start">
        <ExclamationTriangleIcon class="w-5 h-5 text-orange-500 mt-0.5 mr-3 flex-shrink-0" />
        <div class="flex-1">
          <div class="text-sm font-medium text-orange-800">
            发现数据缺失
          </div>
          <div class="text-xs text-orange-700 mt-1">
            最近{{ displayDays }}天有 <strong>{{ missingDaysCount }}</strong> 天的数据未录入
          </div>
          <button 
            @click="scrollToMissingDays"
            class="text-xs text-orange-600 hover:text-orange-800 underline mt-2"
          >
            查看详情并补录
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  PlusIcon, 
  ExclamationTriangleIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/vue/24/outline'
import { dashboardAPI } from '@/api/dashboard'

interface Props {
  funnels: any[]
}

const emit = defineEmits<{
  'date-click': [date: Date]
  'quick-entry': []
}>()

const props = defineProps<Props>()

// State
const currentDate = ref(new Date())
const dataStatus = ref<Record<string, { hasData: boolean; funnelId: string }>>({})
const loading = ref(false)

// 常量
const displayDays = 14 // 显示最近14天
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 水平日历天数 - 显示最近14天
const horizontalCalendarDays = computed(() => {
  const today = new Date()
  const days = []
  
  // 从最早的日期开始（今天往前推13天）
  for (let i = displayDays - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isToday = i === 0
    const isFuture = date > today
    const hasData = dataStatus.value[dateStr]?.hasData || false
    const isMissing = date <= today && !hasData && !isToday
    
    days.push({
      fullDate: new Date(date),
      date: date.getDate(),
      monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
      weekDay: weekDays[date.getDay()],
      isToday,
      isFuture,
      hasData,
      isMissing
    })
  }
  
  return days
})

// 已完成天数 - 基于最近displayDays天
const completedDaysCount = computed(() => {
  return horizontalCalendarDays.value.filter(day => day.hasData).length
})

// 缺失天数 - 基于最近displayDays天，排除今天和未来日期
const missingDaysCount = computed(() => {
  return horizontalCalendarDays.value.filter(day => 
    day.isMissing && !day.isToday && !day.isFuture
  ).length
})

// 完成率
const completionRate = computed(() => {
  const total = horizontalCalendarDays.value.filter(day => !day.isFuture).length
  if (total === 0) return 0
  return Math.round((completedDaysCount.value / total) * 100)
})

// Methods
const handleDateClick = (day: any) => {
  if (day.isFuture) return
  
  if (day.isMissing) {
    if (confirm(`检测到 ${day.monthDay} 数据缺失，是否立即补录？`)) {
      emit('date-click', day.fullDate)
    }
  } else if (day.hasData) {
    // 显示数据概览（可扩展）
    emit('date-click', day.fullDate)
  } else if (day.isToday) {
    if (confirm('今天的数据还未录入，是否现在录入？')) {
      emit('date-click', day.fullDate)
    }
  } else {
    emit('date-click', day.fullDate)
  }
}

const scrollToMissingDays = () => {
  // 找到第一个缺失的日期并触发点击事件
  const firstMissingDay = horizontalCalendarDays.value.find(day => day.isMissing)
  if (firstMissingDay) {
    emit('date-click', firstMissingDay.fullDate)
  }
}

const getDataPeriodLabel = () => {
  // 根据漏斗的数据周期返回标签
  if (props.funnels.length === 0) return '数据录入'
  
  const funnel = props.funnels[0]
  switch (funnel.dataPeriod) {
    case 'DAILY': return '日数据'
    case 'WEEKLY': return '周数据'
    case 'MONTHLY': return '月数据'
    default: return '数据录入'
  }
}

const loadDataStatus = async () => {
  try {
    loading.value = true
    const response = await dashboardAPI.getDataEntryStatus()
    if (response.data.success) {
      dataStatus.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading data status:', error)
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadDataStatus()
})
</script>

<style scoped>
.data-entry-reminder {
  max-width: 100%;
}

.calendar-grid {
  min-height: 240px;
}

.calendar-grid > div {
  min-height: 32px;
}

.stat-item {
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
}
</style>