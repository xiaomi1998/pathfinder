<template>
  <div class="dynamic-metrics-table">
    <!-- Table Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          漏斗节点数据表
        </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ entries.length }} 个节点
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Add Node Button -->
        <button
          v-if="config.allowAdd && availableNodes.length > 0"
          @click="showAddNodeModal = true"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          添加节点
        </button>
        
        <!-- Actions Menu -->
        <div class="relative" ref="actionsMenuRef">
          <button
            @click="showActionsMenu = !showActionsMenu"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <EllipsisVerticalIcon class="w-4 h-4" />
          </button>
          
          <!-- Actions Dropdown -->
          <div v-if="showActionsMenu" 
               class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 dark:bg-gray-700 dark:ring-gray-600">
            <div class="py-1">
              <button
                @click="exportData"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                导出数据
              </button>
              <button
                @click="importData"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                导入数据
              </button>
              <button
                @click="resetTable"
                class="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                重置表格
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Messages -->
    <div v-if="validationResult.errors.length > 0" 
         class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            数据验证错误 ({{ validationResult.errors.length }})
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in validationResult.errors" :key="`${error.nodeId}-${error.field}`">
                {{ getNodeName(error.nodeId) }}: {{ error.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="validationResult.warnings.length > 0"
         class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
      <div class="flex">
        <div class="flex-shrink-0">
          <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            数据警告 ({{ validationResult.warnings.length }})
          </h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="warning in validationResult.warnings" :key="`${warning.nodeId}-${warning.field}`">
                {{ getNodeName(warning.nodeId) }}: {{ warning.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <!-- Table Header -->
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              :style="{ width: column.width }"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400',
                column.required ? 'relative' : ''
              ]"
            >
              <div class="flex items-center space-x-2">
                <span>{{ column.label }}</span>
                <span v-if="column.required" class="text-red-500">*</span>
                <div v-if="column.group" class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded dark:bg-gray-700">
                  {{ column.group }}
                </div>
              </div>
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
              操作
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          <tr
            v-for="(entry, index) in entries"
            :key="entry.id"
            :class="[
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              hasValidationErrors(entry.nodeId) ? 'bg-red-50 dark:bg-red-900/10' : ''
            ]"
          >
            <!-- Data Cells -->
            <td
              v-for="column in visibleColumns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
            >
              <!-- Node Name (Read-only) -->
              <div v-if="column.key === 'nodeName'" class="text-sm font-medium text-gray-900 dark:text-white">
                {{ entry.nodeName }}
              </div>

              <!-- Editable Metric Fields -->
              <div v-else-if="column.editable !== false && column.key in entry.metrics">
                <input
                  :value="getMetricValue(entry, column.key as keyof FunnelNodeMetrics)"
                  @input="updateMetric(entry.id, column.key as keyof FunnelNodeMetrics, $event)"
                  @blur="validateField(entry, column.key as keyof FunnelNodeMetrics)"
                  :type="getInputType(column.type)"
                  :placeholder="getPlaceholder(column)"
                  :class="[
                    'block w-full text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    hasFieldError(entry.nodeId, column.key as keyof FunnelNodeMetrics) 
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600' 
                      : ''
                  ]"
                />
              </div>

              <!-- Read-only Display -->
              <div v-else class="text-sm text-gray-900 dark:text-white">
                {{ formatValue(getMetricValue(entry, column.key as keyof FunnelNodeMetrics), column) }}
              </div>
            </td>

            <!-- Actions Cell -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center justify-end space-x-2">
                <!-- Auto-calculate Button -->
                <button
                  @click="autoCalculateMetrics(entry.id)"
                  title="自动计算相关指标"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <CalculatorIcon class="w-4 h-4" />
                </button>

                <!-- Duplicate Button -->
                <button
                  @click="duplicateEntry(entry.id)"
                  title="复制节点数据"
                  class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <DocumentDuplicateIcon class="w-4 h-4" />
                </button>

                <!-- Remove Button -->
                <button
                  v-if="config.allowRemove"
                  @click="removeEntry(entry.id)"
                  title="删除节点"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="entries.length === 0">
            <td :colspan="visibleColumns.length + 1" class="px-6 py-12 text-center">
              <div class="text-gray-500 dark:text-gray-400">
                <ChartBarIcon class="mx-auto h-12 w-12 mb-4" />
                <h3 class="text-lg font-medium mb-2">暂无节点数据</h3>
                <p class="text-sm">点击"添加节点"开始录入漏斗数据</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Auto-save Indicator -->
    <div v-if="config.autoSave && hasUnsavedChanges" 
         class="mt-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
      <div class="flex items-center text-sm text-blue-800 dark:text-blue-200">
        <ClockIcon class="w-4 h-4 mr-2" />
        <span v-if="isSaving">正在保存...</span>
        <span v-else>有未保存的更改</span>
      </div>
      <button
        @click="saveChanges"
        :disabled="isSaving"
        class="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
      >
        立即保存
      </button>
    </div>

    <!-- Add Node Modal -->
    <div v-if="showAddNodeModal" 
         class="fixed inset-0 z-50 overflow-y-auto" 
         @click.self="showAddNodeModal = false">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity">
          <div class="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900"></div>
        </div>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-800">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-primary-900">
                <PlusIcon class="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  添加漏斗节点
                </h3>
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    选择节点
                  </label>
                  <select
                    v-model="selectedNodeToAdd"
                    class="block w-full border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">请选择节点</option>
                    <option
                      v-for="node in availableNodes"
                      :key="node.id"
                      :value="node.id"
                    >
                      {{ node.name }} ({{ node.type }})
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-gray-700">
            <button
              @click="addSelectedNode"
              :disabled="!selectedNodeToAdd"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              添加
            </button>
            <button
              @click="showAddNodeModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { 
  PlusIcon, 
  TrashIcon, 
  CalculatorIcon, 
  DocumentDuplicateIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline'
import type { 
  MetricDataEntry,
  FunnelNodeMetrics,
  DynamicMetricsTableConfig,
  MetricsTableColumn,
  MetricsValidationResult,
  MetricsValidationError,
  MetricsValidationWarning
} from '@/types/metrics'

interface Props {
  entries: MetricDataEntry[]
  config: DynamicMetricsTableConfig
  availableNodes: Array<{ id: string; name: string; type: string }>
  hasUnsavedChanges?: boolean
  isSaving?: boolean
}

interface Emits {
  (e: 'update:entries', entries: MetricDataEntry[]): void
  (e: 'add-entry', nodeId: string, nodeName: string): void
  (e: 'remove-entry', entryId: string): void
  (e: 'update-entry', entryId: string, updates: Partial<MetricDataEntry>): void
  (e: 'update-metric', entryId: string, field: keyof FunnelNodeMetrics, value: any): void
  (e: 'save-changes'): void
  (e: 'export-data'): void
  (e: 'import-data'): void
  (e: 'reset-table'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const showAddNodeModal = ref(false)
const showActionsMenu = ref(false)
const selectedNodeToAdd = ref('')
const actionsMenuRef = ref<HTMLElement>()

// Computed
const visibleColumns = computed(() => 
  props.config.columns.filter(col => col.key !== 'actions')
)

const validationResult = computed((): MetricsValidationResult => {
  const errors: MetricsValidationError[] = []
  const warnings: MetricsValidationWarning[] = []

  props.entries.forEach(entry => {
    props.config.columns.forEach(column => {
      if (column.required && column.key in entry.metrics) {
        const value = entry.metrics[column.key as keyof FunnelNodeMetrics]
        if (value === undefined || value === null || value === '') {
          errors.push({
            nodeId: entry.nodeId,
            field: column.key as keyof FunnelNodeMetrics,
            value,
            rule: 'required',
            message: `${column.label}为必填项`
          })
        }
      }

      // Type-specific validations
      if (column.validation) {
        const value = entry.metrics[column.key as keyof FunnelNodeMetrics]
        column.validation.forEach(rule => {
          if (value !== undefined && value !== null && value !== '') {
            switch (rule.type) {
              case 'min':
                if (typeof value === 'number' && typeof rule.value === 'number' && value < rule.value) {
                  errors.push({
                    nodeId: entry.nodeId,
                    field: column.key as keyof FunnelNodeMetrics,
                    value,
                    rule: rule.type,
                    message: rule.message
                  })
                }
                break
              case 'max':
                if (typeof value === 'number' && typeof rule.value === 'number' && value > rule.value) {
                  errors.push({
                    nodeId: entry.nodeId,
                    field: column.key as keyof FunnelNodeMetrics,
                    value,
                    rule: rule.type,
                    message: rule.message
                  })
                }
                break
              case 'percentage':
                if (typeof value === 'number' && (value < 0 || value > 100)) {
                  warnings.push({
                    nodeId: entry.nodeId,
                    field: column.key as keyof FunnelNodeMetrics,
                    value,
                    message: rule.message,
                    suggestion: '百分比应在0-100之间'
                  })
                }
                break
              case 'positive':
                if (typeof value === 'number' && value < 0) {
                  errors.push({
                    nodeId: entry.nodeId,
                    field: column.key as keyof FunnelNodeMetrics,
                    value,
                    rule: rule.type,
                    message: rule.message
                  })
                }
                break
            }
          }
        })
      }
    })

    // Cross-field validations
    const metrics = entry.metrics
    if (metrics.conversions && metrics.totalVisitors && metrics.conversions > metrics.totalVisitors) {
      errors.push({
        nodeId: entry.nodeId,
        field: 'conversions',
        value: metrics.conversions,
        rule: 'logical',
        message: '转化数不能超过总访问量'
      })
    }
  })

  return { isValid: errors.length === 0, errors, warnings }
})

// Methods
const getMetricValue = (entry: MetricDataEntry, field: keyof FunnelNodeMetrics): any => {
  return entry.metrics[field] || ''
}

const updateMetric = (entryId: string, field: keyof FunnelNodeMetrics, event: Event) => {
  const input = event.target as HTMLInputElement
  let value: any = input.value

  // Convert to appropriate type
  const column = props.config.columns.find(col => col.key === field)
  if (column && column.type === 'number') {
    value = value === '' ? null : parseFloat(value) || 0
  }

  emit('update-metric', entryId, field, value)
}

const validateField = (entry: MetricDataEntry, field: keyof FunnelNodeMetrics) => {
  // Trigger validation on blur
  // The validation is computed reactively, so this just ensures immediate feedback
  nextTick(() => {
    const hasError = hasFieldError(entry.nodeId, field)
    if (hasError) {
      console.log(`Validation error for ${entry.nodeName}.${field}`)
    }
  })
}

const autoCalculateMetrics = (entryId: string) => {
  const entry = props.entries.find(e => e.id === entryId)
  if (!entry) return

  const metrics = { ...entry.metrics }
  const updates: Partial<FunnelNodeMetrics> = {}

  // Auto-calculate conversion rate
  if (metrics.conversions && metrics.totalVisitors) {
    updates.conversionRate = (metrics.conversions / metrics.totalVisitors) * 100
  }

  // Auto-calculate cost per conversion
  if (metrics.acquisitionCost && metrics.conversions) {
    updates.costPerConversion = metrics.acquisitionCost / metrics.conversions
  }

  // Auto-calculate average order value
  if (metrics.revenue && metrics.conversions) {
    updates.averageOrderValue = metrics.revenue / metrics.conversions
  }

  if (Object.keys(updates).length > 0) {
    emit('update-entry', entryId, { metrics: { ...metrics, ...updates } })
  }
}

const duplicateEntry = (entryId: string) => {
  const entry = props.entries.find(e => e.id === entryId)
  if (!entry) return

  const duplicateName = `${entry.nodeName} (副本)`
  emit('add-entry', `${entry.nodeId}_copy`, duplicateName)

  // Add metrics after the entry is created
  nextTick(() => {
    const newEntry = props.entries.find(e => e.nodeName === duplicateName)
    if (newEntry) {
      emit('update-entry', newEntry.id, { metrics: { ...entry.metrics } })
    }
  })
}

const removeEntry = (entryId: string) => {
  if (confirm('确定要删除这个节点的数据吗？')) {
    emit('remove-entry', entryId)
  }
}

const addSelectedNode = () => {
  const node = props.availableNodes.find(n => n.id === selectedNodeToAdd.value)
  if (node) {
    emit('add-entry', node.id, node.name)
    selectedNodeToAdd.value = ''
    showAddNodeModal.value = false
  }
}

const saveChanges = () => {
  emit('save-changes')
}

const exportData = () => {
  showActionsMenu.value = false
  emit('export-data')
}

const importData = () => {
  showActionsMenu.value = false
  emit('import-data')
}

const resetTable = () => {
  if (confirm('确定要重置表格吗？这将清除所有数据。')) {
    showActionsMenu.value = false
    emit('reset-table')
  }
}

// Helper methods
const getInputType = (columnType: string): string => {
  switch (columnType) {
    case 'number':
    case 'percentage':
    case 'currency':
      return 'number'
    case 'time':
      return 'number'
    default:
      return 'text'
  }
}

const getPlaceholder = (column: MetricsTableColumn): string => {
  switch (column.type) {
    case 'percentage':
      return '输入百分比 (0-100)'
    case 'currency':
      return '输入金额'
    case 'time':
      return '输入秒数'
    case 'number':
      return '输入数字'
    default:
      return `输入${column.label}`
  }
}

const formatValue = (value: any, column: MetricsTableColumn): string => {
  if (value === null || value === undefined || value === '') return '-'

  if (column.format) {
    switch (column.format.type) {
      case 'percentage':
        return `${Number(value).toFixed(column.format.decimals || 2)}%`
      case 'currency':
        return new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: column.format.currency || 'CNY'
        }).format(Number(value))
      case 'time':
        const seconds = Number(value)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      default:
        return String(value)
    }
  }

  return String(value)
}

const hasValidationErrors = (nodeId: string): boolean => {
  return validationResult.value.errors.some(error => error.nodeId === nodeId)
}

const hasFieldError = (nodeId: string, field: keyof FunnelNodeMetrics): boolean => {
  return validationResult.value.errors.some(error => 
    error.nodeId === nodeId && error.field === field
  )
}

const getNodeName = (nodeId?: string): string => {
  if (!nodeId) return '未知节点'
  const entry = props.entries.find(e => e.nodeId === nodeId)
  return entry?.nodeName || '未知节点'
}

// Close actions menu when clicking outside
const handleClickOutside = (event: Event) => {
  if (actionsMenuRef.value && !actionsMenuRef.value.contains(event.target as Node)) {
    showActionsMenu.value = false
  }
}

// Auto-save functionality
let autoSaveTimer: NodeJS.Timeout | null = null

const startAutoSave = () => {
  if (props.config.autoSave && props.config.saveInterval) {
    autoSaveTimer = setInterval(() => {
      if (props.hasUnsavedChanges && !props.isSaving) {
        emit('save-changes')
      }
    }, props.config.saveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  startAutoSave()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  stopAutoSave()
})

// Watchers
watch(() => props.config.autoSave, (newValue) => {
  if (newValue) {
    startAutoSave()
  } else {
    stopAutoSave()
  }
})
</script>

<style scoped>
.dynamic-metrics-table {
  /* Component specific styles if needed */
}

/* Custom input focus styles for validation states */
input:focus.border-red-300 {
  box-shadow: 0 0 0 1px #f87171;
}
</style>