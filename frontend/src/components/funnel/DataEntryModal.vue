<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="handleBackdropClick">
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <ChartBarIcon class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              数据录入：{{ node.data.label }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              输入测试和模拟数据
            </p>
          </div>
        </div>
        <button 
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <XMarkIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex h-[calc(90vh-140px)]">
        <!-- Sidebar - Data Templates -->
        <div class="w-80 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            样本数据模板
          </h3>
          
          <div class="space-y-3">
            <div 
              v-for="template in dataTemplates"
              :key="template.id"
              class="p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="applyTemplate(template)"
            >
              <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-900 dark:text-gray-100">
                  {{ template.name }}
                </h4>
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                  {{ template.count }} 条记录
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ template.description }}
              </p>
            </div>
          </div>

          <!-- Custom Data Generation -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">
              生成自定义数据
            </h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  记录数量
                </label>
                <input
                  v-model.number="customGeneration.count"
                  type="number"
                  min="1"
                  max="10000"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  日期范围
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <input
                    v-model="customGeneration.dateRange.start"
                    type="date"
                    class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <input
                    v-model="customGeneration.dateRange.end"
                    type="date"
                    class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <button
                @click="generateCustomData"
                :disabled="isGenerating"
                class="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span v-if="isGenerating">生成中...</span>
                <span v-else>生成数据</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Content - Data Table -->
        <div class="flex-1 flex flex-col">
          <!-- Data Controls -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">总记录数：</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ sampleData.length }}</span>
                </div>
                <div v-if="selectedRows.length > 0" class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">已选择：</span>
                  <span class="font-medium text-blue-600 dark:text-blue-400">{{ selectedRows.length }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  @click="addNewRow"
                  class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <PlusIcon class="w-4 h-4 inline mr-1" />
                  添加行
                </button>
                <button
                  v-if="selectedRows.length > 0"
                  @click="deleteSelectedRows"
                  class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  <TrashIcon class="w-4 h-4 inline mr-1" />
                  删除已选
                </button>
                <button
                  @click="clearAllData"
                  class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  清空全部
                </button>
              </div>
            </div>

            <!-- Search and Filter -->
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索数据..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <select
                v-model="dateFilter"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">所有日期</option>
                <option value="today">今天</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
              </select>
            </div>
          </div>

          <!-- Data Table -->
          <div class="flex-1 overflow-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th class="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      :checked="allRowsSelected"
                      @change="toggleAllRows"
                      class="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th
                    v-for="column in tableColumns"
                    :key="column.key"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    @click="sortBy(column.key)"
                  >
                    <div class="flex items-center gap-1">
                      {{ column.label }}
                      <ChevronUpDownIcon class="w-4 h-4" v-if="sortColumn !== column.key" />
                      <ChevronUpIcon class="w-4 h-4" v-else-if="sortDirection === 'asc'" />
                      <ChevronDownIcon class="w-4 h-4" v-else />
                    </div>
                  </th>
                  <th class="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(row, index) in filteredAndSortedData"
                  :key="row.id || index"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    { 'bg-blue-50 dark:bg-blue-900/20': selectedRows.includes(index) }
                  ]"
                >
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      :checked="selectedRows.includes(index)"
                      @change="toggleRow(index)"
                      class="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td
                    v-for="column in tableColumns"
                    :key="column.key"
                    class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <input
                      v-if="editingCell.row === index && editingCell.column === column.key"
                      v-model="row[column.key]"
                      @blur="finishEditing"
                      @keyup.enter="finishEditing"
                      @keyup.escape="cancelEditing"
                      type="text"
                      class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      ref="editInput"
                    />
                    <span
                      v-else
                      @dblclick="startEditing(index, column.key)"
                      class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-1 py-0.5 rounded"
                    >
                      {{ formatCellValue(row[column.key], column.type) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      @click="deleteRow(index)"
                      class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Empty State -->
            <div v-if="sampleData.length === 0" class="flex flex-col items-center justify-center py-12">
              <ChartBarIcon class="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">无可用数据</h3>
              <p class="text-gray-500 dark:text-gray-400 text-center mb-4">
                通过选择模板或添加自定义数据开始
              </p>
              <button
                @click="applyTemplate(dataTemplates[0])"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                加载样本数据
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <InformationCircleIcon class="w-4 h-4" />
          <span>双击单元格编辑数值</span>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            @click="handleSave"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            保存数据 ({{ sampleData.length }} 条记录)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { FunnelNode } from '@/types/funnel'
import { 
  XMarkIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

// Props & Emits
interface Props {
  node: FunnelNode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [nodeId: string, data: any[]]
}>()

// Data Templates
const dataTemplates = [
  {
    id: 'ecommerce',
    name: '电商事件',
    description: '产品查看、购物车添加和购买',
    count: 1000,
    generator: () => generateEcommerceData(1000)
  },
  {
    id: 'saas',
    name: 'SaaS 用户旅程',
    description: '注册、试用和转化',
    count: 500,
    generator: () => generateSaasData(500)
  },
  {
    id: 'marketing',
    name: '营销活动',
    description: '邮件打开、点击和转化',
    count: 2000,
    generator: () => generateMarketingData(2000)
  },
  {
    id: 'mobile',
    name: '移动应用分析',
    description: '应用打开、屏幕查看和操作',
    count: 1500,
    generator: () => generateMobileData(1500)
  }
]

// State
const sampleData = ref<any[]>([])
const selectedRows = ref<number[]>([])
const searchQuery = ref('')
const dateFilter = ref('')
const sortColumn = ref('')
const sortDirection = ref<'asc' | 'desc'>('desc')
const editingCell = ref<{row: number, column: string} | null>(null)
const isGenerating = ref(false)

// Custom data generation settings
const customGeneration = ref({
  count: 100,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  }
})

// Computed
const tableColumns = computed(() => {
  if (sampleData.value.length === 0) return []
  
  const firstRow = sampleData.value[0]
  return Object.keys(firstRow).map(key => ({
    key,
    label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    type: getColumnType(firstRow[key])
  }))
})

const allRowsSelected = computed(() => {
  return sampleData.value.length > 0 && selectedRows.value.length === sampleData.value.length
})

const filteredAndSortedData = computed(() => {
  let filtered = [...sampleData.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(query)
      )
    )
  }
  
  // Apply date filter
  if (dateFilter.value) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    filtered = filtered.filter(row => {
      const rowDate = new Date(row.timestamp || row.created_at || row.date)
      
      switch (dateFilter.value) {
        case 'today':
          return rowDate >= today
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          return rowDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
          return rowDate >= monthAgo
        default:
          return true
      }
    })
  }
  
  // Apply sorting
  if (sortColumn.value) {
    filtered.sort((a, b) => {
      const aVal = a[sortColumn.value]
      const bVal = b[sortColumn.value]
      
      let comparison = 0
      if (aVal < bVal) comparison = -1
      if (aVal > bVal) comparison = 1
      
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }
  
  return filtered
})

// Methods
const getColumnType = (value: any): string => {
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    return 'date'
  }
  if (typeof value === 'number') {
    return 'number'
  }
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  return 'string'
}

const formatCellValue = (value: any, type: string): string => {
  if (value === null || value === undefined) return ''
  
  switch (type) {
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'number':
      return Number(value).toLocaleString()
    case 'boolean':
      return value ? 'Yes' : 'No'
    default:
      return String(value)
  }
}

const applyTemplate = async (template: any) => {
  isGenerating.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500)) // Simulate loading
    sampleData.value = template.generator()
  } finally {
    isGenerating.value = false
  }
}

const generateCustomData = async () => {
  isGenerating.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    sampleData.value = generateGenericData(
      customGeneration.value.count,
      new Date(customGeneration.value.dateRange.start),
      new Date(customGeneration.value.dateRange.end)
    )
  } finally {
    isGenerating.value = false
  }
}

// Data generators
const generateEcommerceData = (count: number) => {
  const products = ['Laptop', 'Phone', 'Headphones', 'Watch', 'Tablet']
  const categories = ['Electronics', 'Accessories', 'Computing']
  const events = ['product_view', 'add_to_cart', 'purchase', 'remove_from_cart']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user_${Math.floor(Math.random() * 1000)}`,
    event: events[Math.floor(Math.random() * events.length)],
    product_name: products[Math.floor(Math.random() * products.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    price: Math.round(Math.random() * 1000 + 50),
    quantity: Math.floor(Math.random() * 5 + 1),
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    device: Math.random() > 0.5 ? 'desktop' : 'mobile',
    location: ['US', 'CA', 'UK', 'DE', 'FR'][Math.floor(Math.random() * 5)]
  }))
}

const generateSaasData = (count: number) => {
  const events = ['signup', 'trial_start', 'feature_use', 'upgrade', 'churn']
  const plans = ['free', 'basic', 'pro', 'enterprise']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user_${Math.floor(Math.random() * 500)}`,
    event: events[Math.floor(Math.random() * events.length)],
    plan: plans[Math.floor(Math.random() * plans.length)],
    mrr: Math.round(Math.random() * 200 + 10),
    trial_days_remaining: Math.floor(Math.random() * 30),
    feature_usage_count: Math.floor(Math.random() * 100),
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    source: ['organic', 'paid', 'referral', 'direct'][Math.floor(Math.random() * 4)]
  }))
}

const generateMarketingData = (count: number) => {
  const campaigns = ['spring-sale', 'newsletter', 'product-launch', 'retargeting']
  const channels = ['email', 'facebook', 'google', 'twitter', 'linkedin']
  const events = ['sent', 'opened', 'clicked', 'converted', 'unsubscribed']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user_${Math.floor(Math.random() * 2000)}`,
    campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
    channel: channels[Math.floor(Math.random() * channels.length)],
    event: events[Math.floor(Math.random() * events.length)],
    revenue: Math.random() > 0.8 ? Math.round(Math.random() * 500 + 50) : 0,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    email_subject: `Subject ${i + 1}`,
    utm_source: channels[Math.floor(Math.random() * channels.length)],
    utm_medium: ['cpc', 'email', 'social', 'organic'][Math.floor(Math.random() * 4)]
  }))
}

const generateMobileData = (count: number) => {
  const screens = ['home', 'product', 'cart', 'checkout', 'profile']
  const actions = ['tap', 'swipe', 'scroll', 'pinch', 'long_press']
  const devices = ['iPhone 12', 'iPhone 13', 'Samsung Galaxy', 'Google Pixel']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user_${Math.floor(Math.random() * 1500)}`,
    screen: screens[Math.floor(Math.random() * screens.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    device_model: devices[Math.floor(Math.random() * devices.length)],
    os_version: `${Math.floor(Math.random() * 5 + 14)}.${Math.floor(Math.random() * 10)}`,
    app_version: `${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    session_duration: Math.floor(Math.random() * 1800 + 60),
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    network: ['wifi', '4g', '5g'][Math.floor(Math.random() * 3)]
  }))
}

const generateGenericData = (count: number, startDate: Date, endDate: Date) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user_${Math.floor(Math.random() * count / 2)}`,
    event: `event_${Math.floor(Math.random() * 10 + 1)}`,
    value: Math.round(Math.random() * 1000),
    timestamp: new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    ).toISOString(),
    properties: JSON.stringify({ custom: `value_${i}` })
  }))
}

const addNewRow = () => {
  if (sampleData.value.length > 0) {
    const template = { ...sampleData.value[0] }
    Object.keys(template).forEach(key => {
      if (key === 'id') {
        template[key] = Math.max(...sampleData.value.map(r => r.id || 0)) + 1
      } else if (key === 'timestamp' || key === 'created_at' || key === 'date') {
        template[key] = new Date().toISOString()
      } else {
        template[key] = ''
      }
    })
    sampleData.value.unshift(template)
  } else {
    sampleData.value.push({
      id: 1,
      user_id: 'user_1',
      event: 'sample_event',
      timestamp: new Date().toISOString()
    })
  }
}

const deleteRow = (index: number) => {
  sampleData.value.splice(index, 1)
  selectedRows.value = selectedRows.value.filter(i => i !== index).map(i => i > index ? i - 1 : i)
}

const deleteSelectedRows = () => {
  const sortedIndexes = [...selectedRows.value].sort((a, b) => b - a)
  sortedIndexes.forEach(index => {
    sampleData.value.splice(index, 1)
  })
  selectedRows.value = []
}

const clearAllData = () => {
  sampleData.value = []
  selectedRows.value = []
}

const toggleRow = (index: number) => {
  const selectedIndex = selectedRows.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedRows.value.splice(selectedIndex, 1)
  } else {
    selectedRows.value.push(index)
  }
}

const toggleAllRows = () => {
  if (allRowsSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = Array.from({ length: sampleData.value.length }, (_, i) => i)
  }
}

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

const startEditing = (rowIndex: number, columnKey: string) => {
  editingCell.value = { row: rowIndex, column: columnKey }
  nextTick(() => {
    const input = document.querySelector('[ref="editInput"]') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
}

const finishEditing = () => {
  editingCell.value = null
}

const cancelEditing = () => {
  editingCell.value = null
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

const handleSave = () => {
  emit('save', props.node.id, sampleData.value)
}

// Initialize with sample data if empty
if (sampleData.value.length === 0) {
  applyTemplate(dataTemplates[0])
}
</script>

<style scoped>
/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

/* Table styling */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th:first-child,
td:first-child {
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 10;
}

th {
  background: inherit;
  z-index: 20;
}

th:first-child {
  z-index: 30;
}
</style>