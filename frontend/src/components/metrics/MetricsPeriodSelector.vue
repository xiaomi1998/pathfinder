<template>
  <div class="metrics-period-selector">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        时间周期选择
      </h3>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ selectedPeriod ? `${selectedPeriod.label}` : '请选择时间周期' }}
      </div>
    </div>

    <!-- Period Type Tabs -->
    <div class="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        v-for="type in availablePeriodTypes"
        :key="type.value"
        @click="setPeriodType(type.value)"
        :class="[
          'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
          periodType === type.value
            ? 'bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-400'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
        ]"
      >
        {{ type.label }}
      </button>
    </div>

    <!-- Period Options -->
    <div v-if="periodType !== 'custom'" class="space-y-2 mb-6">
      <div
        v-for="option in periodOptions"
        :key="option.value"
        :class="[
          'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
          selectedPeriod?.startDate?.getTime() === option.startDate.getTime()
            ? 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
            : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
          option.disabled ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        @click="!option.disabled && selectPeriod(option)"
      >
        <div class="flex-1">
          <div class="font-medium text-gray-900 dark:text-white">
            {{ option.label }}
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateRange(option.startDate, option.endDate) }}
          </div>
        </div>
        <div v-if="selectedPeriod?.startDate?.getTime() === option.startDate.getTime()" 
             class="text-primary-600 dark:text-primary-400">
          <CheckIcon class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Custom Date Range -->
    <div v-if="periodType === 'custom'" class="space-y-4 mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            开始日期
          </label>
          <input
            v-model="customStartDate"
            type="date"
            :max="maxDate"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            @change="updateCustomRange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            结束日期
          </label>
          <input
            v-model="customEndDate"
            type="date"
            :min="customStartDate"
            :max="maxDate"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            @change="updateCustomRange"
          />
        </div>
      </div>
      
      <!-- Custom Range Preview -->
      <div v-if="isCustomRangeValid" 
           class="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
        <div class="text-sm text-blue-800 dark:text-blue-200">
          <div class="font-medium">自定义时间段</div>
          <div>{{ formatDateRange(new Date(customStartDate), new Date(customEndDate)) }}</div>
          <div class="mt-1 text-xs">
            共 {{ getDateDifference(new Date(customStartDate), new Date(customEndDate)) }} 天
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex flex-wrap gap-2 mb-6">
      <button
        v-for="quickAction in quickActions"
        :key="quickAction.key"
        @click="applyQuickAction(quickAction)"
        class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        {{ quickAction.label }}
      </button>
    </div>

    <!-- Navigation Controls -->
    <div v-if="selectedPeriod && periodType !== 'custom'" 
         class="flex items-center justify-between mb-6">
      <button
        @click="navigatePeriod('previous')"
        :disabled="!canNavigatePrevious"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        <ChevronLeftIcon class="w-4 h-4 mr-2" />
        上一{{ periodType === 'weekly' ? '周' : '月' }}
      </button>
      
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ selectedPeriod.label }}
      </span>
      
      <button
        @click="navigatePeriod('next')"
        :disabled="!canNavigateNext"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        下一{{ periodType === 'weekly' ? '周' : '月' }}
        <ChevronRightIcon class="w-4 h-4 ml-2" />
      </button>
    </div>

    <!-- Historical Data Toggle -->
    <div v-if="config.maxHistoricalPeriods && config.maxHistoricalPeriods > 0" 
         class="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
      <div class="flex items-center">
        <input
          id="show-historical"
          v-model="showHistoricalData"
          type="checkbox"
          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
          @change="toggleHistoricalData"
        />
        <label for="show-historical" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
          显示历史数据对比
        </label>
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">
        最多显示 {{ config.maxHistoricalPeriods }} 个历史周期
      </div>
    </div>

    <!-- Apply Button -->
    <div class="flex justify-end mt-6">
      <button
        @click="applySelection"
        :disabled="!selectedPeriod && !isCustomRangeValid"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CalendarIcon class="w-4 h-4 mr-2" />
        应用选择
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/vue/24/outline'
import type { 
  MetricsPeriod, 
  PeriodOption, 
  PeriodSelectorConfig 
} from '@/types/metrics'

interface Props {
  modelValue?: MetricsPeriod | null
  config?: Partial<PeriodSelectorConfig>
}

interface Emits {
  (e: 'update:modelValue', value: MetricsPeriod | null): void
  (e: 'period-change', period: MetricsPeriod): void
  (e: 'historical-toggle', enabled: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  config: () => ({})
})

const emit = defineEmits<Emits>()

// Default configuration
const defaultConfig: PeriodSelectorConfig = {
  allowCustomRange: true,
  defaultPeriod: 'current_month',
  availablePeriods: ['weekly', 'monthly', 'custom'],
  maxHistoricalPeriods: 3
}

const config = computed(() => ({ ...defaultConfig, ...props.config }))

// State
const periodType = ref<'weekly' | 'monthly' | 'custom'>('monthly')
const selectedPeriod = ref<PeriodOption | null>(null)
const showHistoricalData = ref(false)
const customStartDate = ref('')
const customEndDate = ref('')

// Computed
const availablePeriodTypes = computed(() => {
  const types = [
    { value: 'weekly' as const, label: '按周' },
    { value: 'monthly' as const, label: '按月' },
    { value: 'custom' as const, label: '自定义' }
  ]
  return types.filter(type => config.value.availablePeriods?.includes(type.value))
})

const periodOptions = computed(() => {
  const options: PeriodOption[] = []
  const now = new Date()
  const count = 12
  
  if (periodType.value === 'weekly') {
    for (let i = 0; i < count; i++) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekNumber = getWeekNumber(weekStart)
      const label = i === 0 ? '本周' : 
                   i === 1 ? '上周' : 
                   `第${weekNumber}周 (${weekStart.getFullYear()})`
      
      options.push({
        value: `week_${i}`,
        label,
        type: 'weekly',
        startDate: weekStart,
        endDate: weekEnd,
        disabled: weekStart > now
      })
    }
  } else if (periodType.value === 'monthly') {
    for (let i = 0; i < count; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      const label = i === 0 ? '本月' :
                   i === 1 ? '上月' :
                   monthStart.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
      
      options.push({
        value: `month_${i}`,
        label,
        type: 'monthly',
        startDate: monthStart,
        endDate: monthEnd,
        disabled: monthStart > now
      })
    }
  }
  
  return options
})

const quickActions = computed(() => [
  { key: 'current_week', label: '本周', type: 'weekly' as const },
  { key: 'last_week', label: '上周', type: 'weekly' as const },
  { key: 'current_month', label: '本月', type: 'monthly' as const },
  { key: 'last_month', label: '上月', type: 'monthly' as const },
  { key: 'last_7_days', label: '最近7天', type: 'custom' as const },
  { key: 'last_30_days', label: '最近30天', type: 'custom' as const }
])

const maxDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isCustomRangeValid = computed(() => {
  return customStartDate.value && customEndDate.value && 
         new Date(customStartDate.value) <= new Date(customEndDate.value)
})

const canNavigatePrevious = computed(() => {
  if (!selectedPeriod.value) return false
  // Can always go to previous periods for historical data
  return true
})

const canNavigateNext = computed(() => {
  if (!selectedPeriod.value) return false
  // Cannot go beyond current period
  const now = new Date()
  return selectedPeriod.value.endDate < now
})

// Methods
const setPeriodType = (type: 'weekly' | 'monthly' | 'custom') => {
  periodType.value = type
  selectedPeriod.value = null
  
  // Set default custom dates if switching to custom
  if (type === 'custom') {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - 30) // Default to last 30 days
    
    customStartDate.value = start.toISOString().split('T')[0]
    customEndDate.value = end.toISOString().split('T')[0]
  }
}

const selectPeriod = (option: PeriodOption) => {
  selectedPeriod.value = option
}

const updateCustomRange = () => {
  if (isCustomRangeValid.value) {
    selectedPeriod.value = {
      value: 'custom_range',
      label: '自定义时间段',
      type: 'custom',
      startDate: new Date(customStartDate.value),
      endDate: new Date(customEndDate.value)
    }
  }
}

const applyQuickAction = (action: typeof quickActions.value[0]) => {
  const now = new Date()
  let startDate: Date
  let endDate: Date
  
  switch (action.key) {
    case 'current_week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay())
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      periodType.value = 'weekly'
      break
      
    case 'last_week':
      startDate = new Date(now)
      startDate.setDate(now.getDate() - now.getDay() - 7)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      periodType.value = 'weekly'
      break
      
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      periodType.value = 'monthly'
      break
      
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      periodType.value = 'monthly'
      break
      
    case 'last_7_days':
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6)
      startDate.setHours(0, 0, 0, 0)
      periodType.value = 'custom'
      customStartDate.value = startDate.toISOString().split('T')[0]
      customEndDate.value = endDate.toISOString().split('T')[0]
      break
      
    case 'last_30_days':
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 29)
      startDate.setHours(0, 0, 0, 0)
      periodType.value = 'custom'
      customStartDate.value = startDate.toISOString().split('T')[0]
      customEndDate.value = endDate.toISOString().split('T')[0]
      break
  }
  
  selectedPeriod.value = {
    value: action.key,
    label: action.label,
    type: action.type,
    startDate,
    endDate
  }
}

const navigatePeriod = (direction: 'previous' | 'next') => {
  if (!selectedPeriod.value) return
  
  const current = selectedPeriod.value
  const multiplier = direction === 'previous' ? 1 : -1
  
  let newStartDate: Date
  let newEndDate: Date
  
  if (periodType.value === 'weekly') {
    newStartDate = new Date(current.startDate)
    newStartDate.setDate(current.startDate.getDate() + (7 * multiplier))
    newEndDate = new Date(newStartDate)
    newEndDate.setDate(newStartDate.getDate() + 6)
    newEndDate.setHours(23, 59, 59, 999)
  } else {
    newStartDate = new Date(current.startDate.getFullYear(), current.startDate.getMonth() + multiplier, 1)
    newEndDate = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0, 23, 59, 59, 999)
  }
  
  // Don't navigate to future periods
  if (direction === 'next' && newStartDate > new Date()) return
  
  const label = periodType.value === 'weekly' 
    ? `第${getWeekNumber(newStartDate)}周 (${newStartDate.getFullYear()})`
    : newStartDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  
  selectedPeriod.value = {
    value: `${periodType.value}_nav`,
    label,
    type: periodType.value,
    startDate: newStartDate,
    endDate: newEndDate
  }
}

const toggleHistoricalData = () => {
  emit('historical-toggle', showHistoricalData.value)
}

const applySelection = () => {
  let period: MetricsPeriod | null = null
  
  if (selectedPeriod.value) {
    period = {
      type: selectedPeriod.value.type,
      startDate: selectedPeriod.value.startDate,
      endDate: selectedPeriod.value.endDate,
      label: selectedPeriod.value.label
    }
  } else if (periodType.value === 'custom' && isCustomRangeValid.value) {
    period = {
      type: 'custom',
      startDate: new Date(customStartDate.value),
      endDate: new Date(customEndDate.value),
      label: '自定义时间段'
    }
  }
  
  if (period) {
    emit('update:modelValue', period)
    emit('period-change', period)
  }
}

// Helper functions
const formatDateRange = (start: Date, end: Date): string => {
  const startStr = start.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  const endStr = end.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  })
  return `${startStr} - ${endStr}`
}

const getDateDifference = (start: Date, end: Date): number => {
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// Initialize with default period
const initializeDefaultPeriod = () => {
  const defaultPeriod = config.value.defaultPeriod || 'current_month'
  const action = quickActions.value.find(a => a.key === defaultPeriod)
  if (action) {
    applyQuickAction(action)
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && (!selectedPeriod.value || 
      selectedPeriod.value.startDate.getTime() !== newValue.startDate.getTime())) {
    selectedPeriod.value = {
      value: 'external',
      label: newValue.label,
      type: newValue.type,
      startDate: newValue.startDate,
      endDate: newValue.endDate
    }
    
    periodType.value = newValue.type
    
    if (newValue.type === 'custom') {
      customStartDate.value = newValue.startDate.toISOString().split('T')[0]
      customEndDate.value = newValue.endDate.toISOString().split('T')[0]
    }
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (!props.modelValue && config.value.defaultPeriod) {
    initializeDefaultPeriod()
  }
})
</script>

<style scoped>
.metrics-period-selector {
  /* Component specific styles if needed */
}
</style>