<template>
  <div class="funnel-instance-selection">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        选择数据录入实例
      </h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ selectedFunnel ? `${selectedFunnel.name} - 选择已有实例或创建新实例进行数据录入` : '请先选择漏斗' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <LoadingSpinner size="large" />
      <span class="ml-3 text-gray-600 dark:text-gray-400">加载实例列表...</span>
    </div>

    <!-- Error State -->
    <ErrorAlert 
      v-if="error && !isLoading"
      :message="error"
      :show="!!error"
      @close="clearError"
      class="mb-6"
    />

    <!-- Instance Selection Options -->
    <div v-if="!isLoading" class="space-y-4">
      <!-- Create New Instance -->
      <div class="relative">
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-primary-500 dark:hover:border-primary-400 transition-colors cursor-pointer"
          :class="{
            'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20': selectedOption?.type === 'new'
          }"
          @click="selectNewInstance"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <PlusCircleIcon class="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div class="ml-4 flex-1">
              <div class="flex items-center">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  创建新实例
                </h3>
                <span v-if="!funnelWithInstances?.instances?.length" 
                      class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  推荐
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                为当前漏斗创建一个新的数据录入实例
              </p>
            </div>
            <div class="flex-shrink-0">
              <input
                type="radio"
                :checked="selectedOption?.type === 'new'"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                @change="selectNewInstance"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Instances -->
      <div v-if="funnelWithInstances?.instances?.length" class="space-y-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          已有实例 ({{ funnelWithInstances.instances.length }})
        </h3>
        
        <div 
          v-for="instance in sortedInstances" 
          :key="instance.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
          :class="{
            'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20': selectedOption?.instance?.id === instance.id,
            'opacity-75': instance.status === 'completed' || instance.status === 'archived'
          }"
          @click="selectInstance(instance)"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-3">
                <h4 class="text-base font-medium text-gray-900 dark:text-white truncate">
                  {{ instance.name }}
                </h4>
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusColor(instance.status)"
                >
                  {{ getStatusLabel(instance.status) }}
                </span>
                <span v-if="instance.id === funnelWithInstances?.recentInstance?.id"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  最近使用
                </span>
              </div>
              
              <p v-if="instance.description" class="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                {{ instance.description }}
              </p>
              
              <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span v-if="instance.startDate && instance.endDate">
                  {{ formatDateRange(instance.startDate, instance.endDate) }}
                </span>
                <span v-if="instance.totalEntries !== undefined">
                  {{ instance.totalEntries }} 访客
                </span>
                <span v-if="instance.overallConversionRate !== undefined">
                  {{ formatPercentage(instance.overallConversionRate) }} 转化率
                </span>
                <span>
                  {{ formatRelativeDate(instance.updatedAt) }}
                </span>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <button
                v-if="instance.status === 'draft'"
                @click.stop="editInstance(instance)"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="编辑实例"
              >
                <PencilIcon class="w-4 h-4" />
              </button>
              
              <input
                type="radio"
                :checked="selectedOption?.instance?.id === instance.id"
                :disabled="instance.status === 'archived'"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 disabled:opacity-50"
                @change="selectInstance(instance)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!funnelWithInstances?.instances?.length && !isLoading" 
           class="text-center py-8 text-gray-500 dark:text-gray-400">
        <FolderOpenIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium">暂无实例</h3>
        <p class="mt-1 text-sm">创建第一个数据录入实例开始使用</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
      <button
        @click="$emit('back')"
        class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
      >
        <ArrowLeftIcon class="w-4 h-4 mr-2" />
        返回选择漏斗
      </button>
      
      <button
        @click="proceed"
        :disabled="!selectedOption"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ selectedOption?.type === 'new' ? '创建实例' : '继续录入数据' }}
        <ArrowRightIcon class="w-4 h-4 ml-2" />
      </button>
    </div>

    <!-- Create Instance Modal -->
    <CreateInstanceModal
      v-if="showCreateModal"
      :funnel="selectedFunnel"
      @close="showCreateModal = false"
      @created="onInstanceCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  PlusCircleIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'

import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import CreateInstanceModal from './CreateInstanceModal.vue'

import { useFunnelInstanceStore } from '@/stores/funnelInstance'
import type { 
  FunnelWithInstances, 
  FunnelInstanceListItem, 
  InstanceSelectionOption 
} from '@/types/funnelInstance'

interface Props {
  selectedFunnel?: {
    id: string
    name: string
    description?: string
    nodeCount: number
  } | null
}

interface Emits {
  (e: 'back'): void
  (e: 'instanceSelected', instance: FunnelInstanceListItem): void
  (e: 'createNew', funnelId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const instanceStore = useFunnelInstanceStore()

// State
const funnelWithInstances = ref<FunnelWithInstances | null>(null)
const selectedOption = ref<InstanceSelectionOption | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const showCreateModal = ref(false)

// Computed
const sortedInstances = computed(() => {
  if (!funnelWithInstances.value?.instances) return []
  
  return [...funnelWithInstances.value.instances].sort((a, b) => {
    // Recent instance first
    if (a.id === funnelWithInstances.value?.recentInstance?.id) return -1
    if (b.id === funnelWithInstances.value?.recentInstance?.id) return 1
    
    // Active instances before others
    if (a.status === 'active' && b.status !== 'active') return -1
    if (b.status === 'active' && a.status !== 'active') return 1
    
    // Then by updated date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

// Methods
const loadInstancesForFunnel = async (funnelId: string) => {
  try {
    isLoading.value = true
    error.value = null
    
    funnelWithInstances.value = await instanceStore.fetchFunnelWithInstances(funnelId)
    
    if (!funnelWithInstances.value) {
      error.value = '加载漏斗实例失败'
      return
    }
    
    // Auto-select the most recent active instance if available
    const recentInstance = funnelWithInstances.value.recentInstance
    if (recentInstance && (recentInstance.status === 'active' || recentInstance.status === 'draft')) {
      selectInstance(recentInstance)
    }
    
  } catch (err: any) {
    console.error('Error loading instances:', err)
    error.value = err.message || '加载实例失败'
  } finally {
    isLoading.value = false
  }
}

const selectNewInstance = () => {
  selectedOption.value = {
    type: 'new',
    label: '创建新实例',
    description: '为当前漏斗创建新的数据录入实例'
  }
}

const selectInstance = (instance: FunnelInstanceListItem) => {
  if (instance.status === 'archived') return
  
  selectedOption.value = {
    type: 'existing',
    instance,
    label: instance.name,
    description: `${instance.funnel?.name || props.selectedFunnel?.name || '未知漏斗'} - ${getStatusLabel(instance.status)}`
  }
}

const editInstance = (instance: FunnelInstanceListItem) => {
  // TODO: Implement instance editing
  console.log('Edit instance:', instance)
}

const proceed = () => {
  if (!selectedOption.value || !props.selectedFunnel) return
  
  if (selectedOption.value.type === 'new') {
    showCreateModal.value = true
  } else if (selectedOption.value.instance) {
    emit('instanceSelected', selectedOption.value.instance)
  }
}

const onInstanceCreated = (instance: FunnelInstanceListItem) => {
  showCreateModal.value = false
  // Refresh the list
  if (props.selectedFunnel) {
    loadInstancesForFunnel(props.selectedFunnel.id)
  }
  // Auto-select the new instance
  emit('instanceSelected', instance)
}

const clearError = () => {
  error.value = null
}

// Helper functions
const getStatusLabel = (status: string): string => {
  return instanceStore.getStatusLabel(status)
}

const getStatusColor = (status: string): string => {
  return instanceStore.getStatusColor(status)
}

const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getMonth() + 1}月${start.getDate()}-${end.getDate()}日`
  }
  
  return `${start.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

const formatRelativeDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
  return new Date(date).toLocaleDateString('zh-CN')
}

// Lifecycle
onMounted(() => {
  if (props.selectedFunnel) {
    loadInstancesForFunnel(props.selectedFunnel.id)
  }
})

// Watchers
watch(() => props.selectedFunnel, (newFunnel) => {
  if (newFunnel) {
    selectedOption.value = null
    loadInstancesForFunnel(newFunnel.id)
  }
})
</script>

<style scoped>
.funnel-instance-selection {
  /* Add any component-specific styles here */
}
</style>