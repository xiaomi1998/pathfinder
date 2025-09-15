<template>
  <div class="fixed inset-0 z-50 overflow-y-auto" @click.self="$emit('close')">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity">
        <div class="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
      </div>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-primary-900">
              <PlusIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                创建数据录入实例
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                为 "{{ funnel?.name }}" 创建一个新的数据录入实例
              </p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="px-4 pb-4 sm:px-6 sm:pb-6">
          <!-- Instance Name -->
          <div class="mb-4">
            <label for="instanceName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              实例名称 <span class="text-red-500">*</span>
            </label>
            <input
              id="instanceName"
              v-model="form.name"
              type="text"
              required
              placeholder="例如：2024年1月数据"
              class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              :class="{ 'border-red-300': errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ errors.name }}
            </p>
          </div>

          <!-- Instance Description -->
          <div class="mb-4">
            <label for="instanceDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述（可选）
            </label>
            <textarea
              id="instanceDescription"
              v-model="form.description"
              rows="2"
              placeholder="简单描述这个实例的用途..."
              class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <!-- Period Type -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数据周期 <span class="text-red-500">*</span>
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="form.periodType"
                  type="radio"
                  value="weekly"
                  class="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <span class="ml-2 text-sm text-gray-900 dark:text-white">周数据</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="form.periodType"
                  type="radio"
                  value="monthly"
                  class="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <span class="ml-2 text-sm text-gray-900 dark:text-white">月数据</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="form.periodType"
                  type="radio"
                  value="custom"
                  class="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                />
                <span class="ml-2 text-sm text-gray-900 dark:text-white">自定义时间范围</span>
              </label>
            </div>
          </div>

          <!-- Period Selection -->
          <div v-if="form.periodType && form.periodType !== 'custom'" class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择{{ form.periodType === 'weekly' ? '周' : '月' }}份
            </label>
            <select
              v-model="selectedPeriodOption"
              class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              @change="onPeriodOptionChange"
            >
              <option value="">请选择...</option>
              <option
                v-for="option in periodOptions"
                :key="option.label"
                :value="option"
              >
                {{ option.label }}
                <span v-if="option.isCurrent">(当前)</span>
              </option>
            </select>
          </div>

          <!-- Custom Date Range -->
          <div v-if="form.periodType === 'custom'" class="mb-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  开始日期 <span class="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  v-model="form.startDate"
                  type="date"
                  required
                  class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  :class="{ 'border-red-300': errors.startDate }"
                />
                <p v-if="errors.startDate" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.startDate }}
                </p>
              </div>
              <div>
                <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  结束日期 <span class="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  v-model="form.endDate"
                  type="date"
                  required
                  class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  :class="{ 'border-red-300': errors.endDate }"
                />
                <p v-if="errors.endDate" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ errors.endDate }}
                </p>
              </div>
            </div>
          </div>

          <!-- Date Preview -->
          <div v-if="form.startDate && form.endDate" class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">数据周期：</span>
              {{ formatDateRange(new Date(form.startDate), new Date(form.endDate)) }}
              <span class="text-gray-500">({{ getDaysCount(new Date(form.startDate), new Date(form.endDate)) }}天)</span>
            </p>
          </div>

          <!-- Error Message -->
          <ErrorAlert
            v-if="submitError"
            :message="submitError"
            :show="!!submitError"
            @close="submitError = null"
            class="mb-4"
          />

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="$emit('close')"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LoadingSpinner v-if="isSubmitting" size="small" class="mr-2" />
              {{ isSubmitting ? '创建中...' : '创建实例' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'

import { useFunnelInstanceStore } from '@/stores/funnelInstance'
import { funnelInstanceAPI } from '@/api/funnelInstance'
import type { CreateFunnelInstanceRequest, FunnelInstanceListItem } from '@/types/funnelInstance'

interface Props {
  funnel?: {
    id: string
    name: string
    description?: string
    nodeCount: number
  } | null
}

interface Emits {
  (e: 'close'): void
  (e: 'created', instance: FunnelInstanceListItem): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const instanceStore = useFunnelInstanceStore()

// Form state
const form = ref({
  name: '',
  description: '',
  periodType: 'monthly' as 'weekly' | 'monthly' | 'custom',
  startDate: '',
  endDate: ''
})

const selectedPeriodOption = ref<any>(null)
const errors = ref<Record<string, string>>({})
const submitError = ref<string | null>(null)
const isSubmitting = ref(false)

// Computed
const periodOptions = computed(() => {
  if (!form.value.periodType || form.value.periodType === 'custom') return []
  return funnelInstanceAPI.getPeriodSuggestions(form.value.periodType)
})

const isFormValid = computed(() => {
  const hasName = form.value.name.trim().length > 0
  const hasPeriodType = !!form.value.periodType
  const hasDates = form.value.startDate && form.value.endDate
  
  return hasName && hasPeriodType && hasDates && Object.keys(errors.value).length === 0
})

// Methods
const generateDefaultName = (periodType: string) => {
  const now = new Date()
  
  if (periodType === 'weekly') {
    const weekNum = getWeekNumber(now)
    return `第${weekNum}周数据 (${now.getFullYear()}年)`
  } else if (periodType === 'monthly') {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return `${now.getFullYear()}年${monthNames[now.getMonth()]}数据`
  } else {
    return `自定义数据录入 (${now.toLocaleDateString('zh-CN')})`
  }
}

const onPeriodOptionChange = () => {
  if (selectedPeriodOption.value) {
    form.value.startDate = selectedPeriodOption.value.startDate.toISOString().split('T')[0]
    form.value.endDate = selectedPeriodOption.value.endDate.toISOString().split('T')[0]
    
    // Auto-generate name if not already set
    if (!form.value.name) {
      form.value.name = generateDefaultName(form.value.periodType)
    }
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = '请输入实例名称'
  } else if (form.value.name.trim().length > 150) {
    errors.value.name = '实例名称不能超过150个字符'
  }
  
  if (form.value.periodType === 'custom') {
    if (!form.value.startDate) {
      errors.value.startDate = '请选择开始日期'
    }
    
    if (!form.value.endDate) {
      errors.value.endDate = '请选择结束日期'
    }
    
    if (form.value.startDate && form.value.endDate) {
      const startDate = new Date(form.value.startDate)
      const endDate = new Date(form.value.endDate)
      
      if (startDate >= endDate) {
        errors.value.endDate = '结束日期必须晚于开始日期'
      }
      
      // Check if date range is reasonable (not too far in the future)
      const now = new Date()
      const maxFutureDate = new Date()
      maxFutureDate.setMonth(maxFutureDate.getMonth() + 3)
      
      if (startDate > maxFutureDate) {
        errors.value.startDate = '开始日期不能超过3个月后'
      }
    }
  }
}

const handleSubmit = async () => {
  validateForm()
  
  if (!isFormValid.value || !props.funnel) return
  
  try {
    isSubmitting.value = true
    submitError.value = null
    
    const requestData: CreateFunnelInstanceRequest = {
      name: form.value.name.trim(),
      description: form.value.description.trim() || undefined,
      funnelId: props.funnel.id,
      periodType: form.value.periodType,
      startDate: new Date(form.value.startDate),
      endDate: new Date(form.value.endDate)
    }
    
    const instance = await instanceStore.createInstance(requestData)
    
    if (instance) {
      // Convert to list item format
      const listItem: FunnelInstanceListItem = {
        id: instance.id,
        funnelId: instance.funnelId,
        name: instance.name,
        description: instance.description,
        status: instance.status,
        periodType: instance.periodType,
        startDate: instance.startDate,
        endDate: instance.endDate,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        funnel: {
          name: props.funnel.name,
          nodeCount: props.funnel.nodeCount
        },
        metricsCount: 0,
        hasUnsavedChanges: false
      }
      
      emit('created', listItem)
    }
  } catch (err: any) {
    console.error('Error creating instance:', err)
    submitError.value = err.message || '创建实例失败'
  } finally {
    isSubmitting.value = false
  }
}

// Helper functions
const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = startDate.toLocaleDateString('zh-CN')
  const end = endDate.toLocaleDateString('zh-CN')
  return `${start} - ${end}`
}

const getDaysCount = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// Auto-generate name when period type changes
const handlePeriodTypeChange = () => {
  if (!form.value.name) {
    form.value.name = generateDefaultName(form.value.periodType)
  }
  
  // Clear dates when changing period type
  form.value.startDate = ''
  form.value.endDate = ''
  selectedPeriodOption.value = null
}

// Watchers
watch(() => form.value.periodType, (newPeriodType) => {
  handlePeriodTypeChange()
  
  // Auto-select current period for new period type
  if (newPeriodType !== 'custom' && periodOptions.value.length > 0) {
    const currentOption = periodOptions.value.find(option => option.isCurrent)
    if (currentOption) {
      selectedPeriodOption.value = currentOption
      onPeriodOptionChange()
    }
  }
})

// Lifecycle
onMounted(() => {
  // Auto-generate initial name
  form.value.name = generateDefaultName(form.value.periodType)
  
  // Set current month as default for monthly period
  if (form.value.periodType === 'monthly' && periodOptions.value.length > 0) {
    const currentOption = periodOptions.value.find(option => option.isCurrent)
    if (currentOption) {
      selectedPeriodOption.value = currentOption
      onPeriodOptionChange()
    }
  }
})
</script>