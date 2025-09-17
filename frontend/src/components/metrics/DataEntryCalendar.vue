<template>
  <div class="data-entry-calendar bg-white rounded-lg shadow-lg dark:bg-gray-800">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <CalendarIcon class="w-5 h-5 mr-2 text-blue-500" />
          {{ funnel?.name }} - 数据录入情况
        </h2>
        <div class="flex items-center space-x-3">
          <!-- 月份导航 -->
          <div class="flex items-center space-x-2">
            <button
              @click="goToPreviousMonth"
              class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon class="w-5 h-5 text-gray-500" />
            </button>
            
            <span class="text-lg font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
              {{ currentMonthLabel }}
              <span class="text-xs text-gray-500 ml-1">({{ getDataPeriodLabel() }})</span>
            </span>
            
            <button
              @click="goToNextMonth"
              :disabled="isCurrentMonth"
              class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon class="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon class="w-5 h-5 text-gray-500" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>
      </div>
      
      <!-- 缺失数据提醒 -->
      <div v-if="missingDaysCount > 0" class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md dark:bg-orange-900/20 dark:border-orange-800">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="w-5 h-5 text-orange-500 mr-2" />
          <span class="text-sm text-orange-700 dark:text-orange-400">
            本月有 <span class="font-semibold">{{ missingDaysCount }}{{ getDataPeriodUnit() }}</span> 数据缺失，
            <button @click="scrollToMissingDays" class="underline hover:no-underline">立即补录</button>
          </span>
        </div>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="p-6">
      <!-- 星期头部 -->
      <div class="grid grid-cols-7 gap-2 mb-2">
        <div 
          v-for="day in weekDays" 
          :key="day"
          class="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
        >
          {{ day }}
        </div>
      </div>
      
      <!-- 日历主体 -->
      <div class="grid grid-cols-7 gap-2">
        <div
          v-for="day in calendarDays"
          :key="day.key"
          @click="selectDay(day)"
          class="relative aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-200 border-2"
          :class="getDayClass(day)"
        >
          <!-- 日期数字 -->
          <div class="text-sm font-medium" :class="getDayTextClass(day)">
            {{ day.date }}
          </div>
          
          <!-- 数据状态 -->
          <div v-if="day.isCurrentMonth" class="mt-1">
            <!-- 转化率显示 -->
            <div v-if="day.hasData" class="text-xs text-center">
              <div class="font-medium" :class="getConversionRateClass(day.conversionRate)">
                转化率: {{ day.conversionRate }}%
              </div>
              <div class="text-gray-500 dark:text-gray-400">
                线索数: {{ day.leadCount }}
              </div>
              <div class="text-gray-500 dark:text-gray-400">
                成交数: {{ day.closedCount }}
              </div>
            </div>
            
            <!-- 缺失数据标记 -->
            <div v-else-if="day.shouldHaveData" class="text-xs text-gray-400">
              ?
            </div>
          </div>
          
          <!-- 悬停tooltip -->
          <div 
            v-if="day.isCurrentMonth && selectedDay?.key === day.key && day.hasData"
            class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 bg-gray-900 text-white text-xs rounded-md px-3 py-2 shadow-lg whitespace-nowrap"
          >
            <div class="text-center">
              <div class="font-medium">{{ formatDate(day.fullDate, 'YYYY-MM-DD') }}</div>
              <div>转化率: {{ day.conversionRate }}%</div>
              <div>线索数: {{ day.leadCount }}</div>
              <div>成交数: {{ day.closedCount }}</div>
            </div>
            <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例和统计 -->
    <div class="px-6 pb-6">
      <div class="flex items-center justify-between">
        <!-- 图例 -->
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-green-500 rounded"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">高转化 (6%+)</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-orange-500 rounded"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">中转化 (3-6%)</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-red-500 rounded"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">低转化 (0-3%)</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-gray-300 rounded dark:bg-gray-600"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ getDataPeriodLabel() === '按日' ? '数据缺失' : '无需数据' }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 bg-blue-200 rounded dark:bg-blue-800"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">节假日</span>
          </div>
        </div>
        
        <!-- 快速操作 -->
        <div class="flex items-center space-x-2">
          <button
            v-if="selectedDay && selectedDay.isCurrentMonth"
            @click="goToDataEntry"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            {{ selectedDay.hasData ? '编辑数据' : '录入数据' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowPathIcon,
  PlusIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { funnelMetricsAPI } from '@/api/funnelMetrics'
import type { Funnel } from '@/types'

interface CalendarDay {
  key: string
  date: number
  fullDate: Date
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isHoliday: boolean
  hasData: boolean
  shouldHaveData: boolean
  conversionRate: number
  leadCount: number
  closedCount: number
  entryCount: number
}

interface Props {
  funnel?: Funnel | null
  selectedDate?: Date | null
}

interface Emits {
  (e: 'day-selected', day: CalendarDay): void
  (e: 'data-entry-requested', day: CalendarDay): void
}

const props = withDefaults(defineProps<Props>(), {
  funnel: null,
  selectedDate: null
})

const emit = defineEmits<Emits>()

// State
const currentDate = ref(new Date())
const selectedDay = ref<CalendarDay | null>(null)
const isLoading = ref(false)
const dataEntries = ref<Record<string, any>>({}) // key -> entry data

// Constants
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 中国节假日列表 (简化版本，实际应该从API获取)
const holidays = new Set([
  '2025-01-01', // 元旦
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', // 春节
  '2025-02-01', '2025-02-02', '2025-02-03',
  '2025-04-05', // 清明节
  '2025-05-01', '2025-05-02', '2025-05-03', // 劳动节
  '2025-06-09', // 端午节
  '2025-09-15', '2025-09-16', '2025-09-17', // 中秋节
  '2025-10-01', '2025-10-02', '2025-10-03', // 国庆节
  '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07'
])

// Computed
const currentMonthLabel = computed(() => {
  return `${currentDate.value.getFullYear()}年${currentDate.value.getMonth() + 1}月`
})

const isCurrentMonth = computed(() => {
  const today = new Date()
  return currentDate.value.getFullYear() === today.getFullYear() && 
         currentDate.value.getMonth() === today.getMonth()
})

const calendarDays = computed((): CalendarDay[] => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const today = new Date()
  
  // 当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // 日历开始日期 (当月第一天所在周的周一)
  const startDate = getWeekStart(firstDay)
  
  // 日历结束日期 (当月最后一天所在周的周日)
  const endDate = getWeekEnd(lastDay)
  
  const days: CalendarDay[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dateKey = formatDate(current, 'yyyy-MM-dd')
    const isCurrentMonth = current.getMonth() === month
    const isToday = isSameDay(current, today)
    const isWeekend = current.getDay() === 0 || current.getDay() === 6
    const isHoliday = holidays.has(dateKey)
    
    const entryData = dataEntries.value[dateKey]
    const hasData = !!entryData
    // 根据漏斗的数据周期决定是否应该有数据
    const shouldHaveData = isCurrentMonth && current <= today && shouldCollectDataForDate(current, props.funnel?.dataPeriod || 'DAILY')
    
    days.push({
      key: dateKey,
      date: current.getDate(),
      fullDate: new Date(current),
      isCurrentMonth,
      isToday,
      isWeekend,
      isHoliday,
      hasData,
      shouldHaveData,
      conversionRate: hasData ? calculateConversionRate(entryData) : 0,
      leadCount: hasData ? getLeadCount(entryData) : 0,
      closedCount: hasData ? getClosedCount(entryData) : 0,
      entryCount: hasData ? 1 : 0
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return days
})

const missingDaysCount = computed(() => {
  return calendarDays.value.filter(day => 
    day.isCurrentMonth && day.shouldHaveData && !day.hasData
  ).length
})

// Methods
const goToPreviousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadDataEntries()
}

const goToNextMonth = () => {
  if (!isCurrentMonth.value) {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
    loadDataEntries()
  }
}

const selectDay = (day: CalendarDay) => {
  if (day.isCurrentMonth) {
    selectedDay.value = day
    emit('day-selected', day)
  }
}

const goToDataEntry = () => {
  if (selectedDay.value) {
    emit('data-entry-requested', selectedDay.value)
  }
}

const scrollToMissingDays = () => {
  // 可以实现滚动到第一个缺失数据的日期
  const firstMissingDay = calendarDays.value.find(day => 
    day.isCurrentMonth && day.shouldHaveData && !day.hasData
  )
  if (firstMissingDay) {
    selectDay(firstMissingDay)
  }
}

const refreshData = () => {
  loadDataEntries()
}

// 根据数据周期判断某个日期是否需要收集数据
const shouldCollectDataForDate = (date: Date, dataPeriod: string): boolean => {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const dateKey = formatDate(date, 'yyyy-MM-dd')
  const isHoliday = holidays.has(dateKey)
  
  switch (dataPeriod) {
    case 'DAILY':
      // 每日数据：工作日需要数据
      return !isWeekend && !isHoliday
    case 'WEEKLY':
      // 每周数据：只有周一需要数据（代表整周）
      return date.getDay() === 1 && !isHoliday
    case 'MONTHLY':
      // 每月数据：只有每月1号需要数据（代表整月）
      return date.getDate() === 1
    default:
      return !isWeekend && !isHoliday
  }
}

// 获取数据周期标签
const getDataPeriodLabel = (): string => {
  switch (props.funnel?.dataPeriod) {
    case 'DAILY':
      return '按日'
    case 'WEEKLY':
      return '按周'
    case 'MONTHLY':
      return '按月'
    default:
      return '按日'
  }
}

// 获取数据周期单位
const getDataPeriodUnit = (): string => {
  switch (props.funnel?.dataPeriod) {
    case 'DAILY':
      return '天'
    case 'WEEKLY':
      return '周'
    case 'MONTHLY':
      return '月'
    default:
      return '天'
  }
}

const loadDataEntries = async () => {
  if (!props.funnel) return
  
  isLoading.value = true
  try {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    
    // 根据漏斗的数据周期设置正确的periodType
    const periodType = props.funnel.dataPeriod === 'DAILY' ? undefined : 
                       props.funnel.dataPeriod === 'WEEKLY' ? 'weekly' : 'monthly'
    
    const response = await funnelMetricsAPI.getFunnelMetricsList(props.funnel.id, {
      startDate,
      endDate,
      limit: 100,
      periodType
    })
    
    // 重置数据
    dataEntries.value = {}
    
    // 处理返回的数据
    response.data.data.forEach((entry: any) => {
      const entryDate = new Date(entry.periodStartDate)
      const dateKey = formatDate(entryDate, 'yyyy-MM-dd')
      
      // 只处理当前月份的数据
      if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
        dataEntries.value[dateKey] = entry
      }
    })
    
  } catch (error) {
    console.error('Failed to load data entries:', error)
  } finally {
    isLoading.value = false
  }
}

const getDayClass = (day: CalendarDay): string => {
  const classes = []
  
  if (!day.isCurrentMonth) {
    classes.push('text-gray-300 dark:text-gray-600')
    classes.push('border-transparent')
  } else if (day.isToday) {
    classes.push('border-blue-500 bg-blue-100 dark:bg-blue-900/20')
  } else if (day.hasData) {
    // 根据转化率设置颜色
    if (day.conversionRate >= 6) {
      classes.push('border-green-300 bg-green-500 text-white') // 高转化
    } else if (day.conversionRate >= 3) {
      classes.push('border-orange-300 bg-orange-500 text-white') // 中转化
    } else {
      classes.push('border-red-300 bg-red-500 text-white') // 低转化
    }
  } else if (day.shouldHaveData) {
    classes.push('border-gray-200 bg-gray-300 dark:bg-gray-600') // 数据缺失
  } else if (day.isHoliday) {
    classes.push('border-blue-200 bg-blue-100 dark:bg-blue-800') // 节假日
  } else {
    classes.push('border-gray-200 bg-white dark:bg-gray-800 hover:border-gray-300') // 正常日期
  }
  
  if (selectedDay.value?.key === day.key) {
    classes.push('ring-2 ring-blue-500')
  }
  
  return classes.join(' ')
}

const getDayTextClass = (day: CalendarDay): string => {
  if (!day.isCurrentMonth) {
    return 'text-gray-300 dark:text-gray-600'
  } else if (day.hasData) {
    return 'text-white font-semibold'
  } else if (day.isToday) {
    return 'text-blue-700 dark:text-blue-300 font-semibold'
  } else {
    return 'text-gray-700 dark:text-gray-300'
  }
}

const getConversionRateClass = (rate: number): string => {
  if (rate >= 6) return 'text-green-600 dark:text-green-400'
  if (rate >= 3) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

// Utility functions
const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return format
    .replace('yyyy', String(year))
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('DD', day)
}

const getWeekStart = (date: Date): Date => {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  return new Date(date.getFullYear(), date.getMonth(), diff)
}

const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return weekEnd
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString()
}

const calculateConversionRate = (entryData: any): number => {
  if (!entryData || !entryData.customMetrics?.stageData) return 0
  
  const stageData = entryData.customMetrics.stageData
  const stages = Object.values(stageData) as number[]
  
  if (stages.length < 2) return 0
  
  const firstStage = stages[0] || 0
  const lastStage = stages[stages.length - 1] || 0
  
  return firstStage > 0 ? Math.round((lastStage / firstStage) * 100 * 100) / 100 : 0
}

const getLeadCount = (entryData: any): number => {
  if (!entryData || !entryData.customMetrics?.stageData) return entryData?.totalEntries || 0
  
  const stageData = entryData.customMetrics.stageData
  const stages = Object.values(stageData) as number[]
  
  return stages[0] || entryData?.totalEntries || 0
}

const getClosedCount = (entryData: any): number => {
  if (!entryData || !entryData.customMetrics?.stageData) return entryData?.totalConversions || 0
  
  const stageData = entryData.customMetrics.stageData
  const stages = Object.values(stageData) as number[]
  
  return stages[stages.length - 1] || entryData?.totalConversions || 0
}

// Watchers
watch(() => props.funnel, (newFunnel) => {
  if (newFunnel) {
    loadDataEntries()
  }
}, { immediate: true })

watch(() => props.selectedDate, (newDate) => {
  if (newDate) {
    currentDate.value = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
    
    // 找到对应的日期并选中
    const day = calendarDays.value.find(d => 
      d.isCurrentMonth && isSameDay(d.fullDate, newDate)
    )
    if (day) {
      selectedDay.value = day
    }
  }
})

// Lifecycle
onMounted(() => {
  if (props.funnel) {
    loadDataEntries()
  }
})
</script>

<style scoped>
.data-entry-calendar {
  max-width: 800px;
}
</style>