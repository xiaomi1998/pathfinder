<template>
  <div class="instance-selector">
    <!-- Selector Header -->
    <div class="selector-header">
      <div class="header-left">
        <h3 class="selector-title">{{ title }}</h3>
        <div class="selection-info" v-if="maxSelections > 1">
          已选择 {{ selectedInstances.length }}/{{ maxSelections }} 个实例
        </div>
      </div>
      <div class="header-right">
        <button
          v-if="selectedInstances.length > 0"
          class="clear-btn"
          @click="clearSelection"
        >
          清空选择
        </button>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="selector-controls">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          type="text"
          placeholder="搜索实例..."
          v-model="searchQuery"
          @input="onSearchChange"
        />
      </div>

      <div class="filter-controls">
        <select v-model="templateFilter" @change="onFilterChange" class="filter-select">
          <option value="">所有模板</option>
          <option 
            v-for="template in availableTemplates" 
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>

        <select v-model="statusFilter" @change="onFilterChange" class="filter-select">
          <option value="">所有状态</option>
          <option value="active">活跃</option>
          <option value="completed">已完成</option>
          <option value="in_progress">进行中</option>
          <option value="paused">已暂停</option>
        </select>
      </div>
    </div>

    <!-- Instance List -->
    <div class="instances-container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载实例中...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredInstances.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 9h-2v2h2V9zm0 4h-2v6h2v-6zm1-9H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8l-6-4zM4 8V6h10l4 4v8H4V8z"/>
          </svg>
        </div>
        <p>{{ searchQuery ? '未找到匹配的实例' : '暂无可选择的实例' }}</p>
      </div>

      <!-- Instance Items -->
      <div v-else class="instances-list">
        <div
          v-for="instance in paginatedInstances"
          :key="instance.id"
          class="instance-item"
          :class="{ 
            'selected': isSelected(instance.id),
            'disabled': isDisabled(instance.id)
          }"
          @click="toggleSelection(instance)"
        >
          <!-- Selection Checkbox -->
          <div class="selection-checkbox">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                :checked="isSelected(instance.id)"
                :disabled="isDisabled(instance.id)"
                @click.stop="toggleSelection(instance)"
              />
              <div class="checkbox-custom"></div>
            </div>
          </div>

          <!-- Instance Info -->
          <div class="instance-info">
            <div class="instance-primary">
              <h4 class="instance-name">{{ instance.name }}</h4>
              <span class="status-badge" :class="getStatusColor(instance.status)">
                {{ getStatusText(instance.status) }}
              </span>
            </div>
            
            <div class="instance-secondary">
              <span class="template-name">{{ instance.funnelTemplate?.name || '未知模板' }}</span>
              <span class="separator">•</span>
              <span class="created-date">{{ formatDate(instance.createdAt) }}</span>
            </div>

            <div v-if="instance.description" class="instance-description">
              {{ instance.description }}
            </div>

            <!-- Metrics Preview -->
            <div v-if="showMetrics && hasMetrics(instance)" class="metrics-preview">
              <div class="metric" v-if="instance.latestMetrics?.overallConversionRate">
                <span class="metric-label">转化率</span>
                <span class="metric-value">
                  {{ formatConversionRate(instance.latestMetrics.overallConversionRate) }}
                </span>
              </div>
              <div class="metric" v-if="instance.latestMetrics?.totalRevenue">
                <span class="metric-label">总收入</span>
                <span class="metric-value">
                  {{ formatRevenue(instance.latestMetrics.totalRevenue) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">数据记录</span>
                <span class="metric-value">{{ instance.metricsCount }}</span>
              </div>
            </div>

            <!-- Period Info -->
            <div v-if="showPeriod && hasPeriod(instance)" class="period-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              <span>{{ formatDateRange(instance.periodStartDate, instance.periodEndDate) }}</span>
            </div>

            <!-- Tags -->
            <div v-if="instance.tags && instance.tags.length > 0" class="instance-tags">
              <span
                v-for="tag in instance.tags.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
              <span v-if="instance.tags.length > 3" class="tag-more">
                +{{ instance.tags.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Action Button -->
          <div class="instance-action">
            <button
              v-if="!isSelected(instance.id)"
              class="select-btn"
              @click.stop="toggleSelection(instance)"
              :disabled="isDisabled(instance.id)"
            >
              选择
            </button>
            <button
              v-else
              class="selected-btn"
              @click.stop="toggleSelection(instance)"
            >
              已选择
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="page-btn"
          @click="previousPage"
          :disabled="currentPage <= 1 || loading"
        >
          上一页
        </button>
        
        <div class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </div>
        
        <button
          class="page-btn"
          @click="nextPage"
          :disabled="currentPage >= totalPages || loading"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- Selected Instances Summary -->
    <div v-if="selectedInstances.length > 0" class="selected-summary">
      <h4>已选择的实例 ({{ selectedInstances.length }})</h4>
      <div class="selected-list">
        <div
          v-for="instance in selectedInstances"
          :key="instance.id"
          class="selected-item"
        >
          <span class="selected-name">{{ instance.name }}</span>
          <button class="remove-btn" @click="removeFromSelection(instance.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { FunnelInstanceListItem } from '@/types/funnel'
import { getFunnelInstances } from '@/api/funnelInstance'
import { instanceUtils } from '@/api/funnelInstance'

interface Props {
  title?: string
  maxSelections?: number
  preselectedIds?: string[]
  excludeIds?: string[]
  allowedStatuses?: string[]
  templateId?: string
  showMetrics?: boolean
  showPeriod?: boolean
}

interface Emits {
  (e: 'selection-changed', instances: FunnelInstanceListItem[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择实例',
  maxSelections: 5,
  preselectedIds: () => [],
  excludeIds: () => [],
  allowedStatuses: () => ['active', 'completed', 'in_progress'],
  showMetrics: true,
  showPeriod: true
})

const emit = defineEmits<Emits>()

// Reactive state
const loading = ref(false)
const instances = ref<FunnelInstanceListItem[]>([])
const selectedInstances = ref<FunnelInstanceListItem[]>([])
const searchQuery = ref('')
const templateFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Computed
const availableTemplates = computed(() => {
  const templates = new Map()
  instances.value.forEach(instance => {
    if (instance.funnelTemplate) {
      templates.set(instance.funnelTemplate.name, {
        id: instance.funnelTemplateId,
        name: instance.funnelTemplate.name
      })
    }
  })
  return Array.from(templates.values())
})

const filteredInstances = computed(() => {
  return instances.value.filter(instance => {
    // Exclude specified instances
    if (props.excludeIds.includes(instance.id)) return false
    
    // Filter by allowed statuses
    if (props.allowedStatuses.length > 0 && !props.allowedStatuses.includes(instance.status)) {
      return false
    }

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      if (!instance.name.toLowerCase().includes(query) &&
          !instance.description?.toLowerCase().includes(query)) {
        return false
      }
    }

    // Template filter
    if (templateFilter.value && instance.funnelTemplateId !== templateFilter.value) {
      return false
    }

    // Status filter
    if (statusFilter.value && instance.status !== statusFilter.value) {
      return false
    }

    return true
  })
})

const totalPages = computed(() => {
  return Math.ceil(filteredInstances.value.length / itemsPerPage)
})

const paginatedInstances = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredInstances.value.slice(start, end)
})

// Methods
const loadInstances = async () => {
  loading.value = true
  try {
    const params = {
      limit: 1000, // Load all instances for client-side filtering
      status: props.allowedStatuses.join(',') || undefined,
      templateId: props.templateId || undefined
    }
    
    const response = await getFunnelInstances(params)
    instances.value = response.data
    
    // Preselect instances
    if (props.preselectedIds.length > 0) {
      selectedInstances.value = instances.value.filter(
        instance => props.preselectedIds.includes(instance.id)
      )
    }
  } catch (error) {
    console.error('Failed to load instances:', error)
  } finally {
    loading.value = false
  }
}

const isSelected = (instanceId: string): boolean => {
  return selectedInstances.value.some(instance => instance.id === instanceId)
}

const isDisabled = (instanceId: string): boolean => {
  if (isSelected(instanceId)) return false
  return selectedInstances.value.length >= props.maxSelections
}

const toggleSelection = (instance: FunnelInstanceListItem) => {
  if (isDisabled(instance.id) && !isSelected(instance.id)) return

  if (isSelected(instance.id)) {
    selectedInstances.value = selectedInstances.value.filter(
      selected => selected.id !== instance.id
    )
  } else {
    if (selectedInstances.value.length < props.maxSelections) {
      selectedInstances.value.push(instance)
    }
  }

  emit('selection-changed', selectedInstances.value)
}

const removeFromSelection = (instanceId: string) => {
  selectedInstances.value = selectedInstances.value.filter(
    instance => instance.id !== instanceId
  )
  emit('selection-changed', selectedInstances.value)
}

const clearSelection = () => {
  selectedInstances.value = []
  emit('selection-changed', [])
}

const onSearchChange = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Utility methods
const getStatusText = (status: string): string => {
  return instanceUtils.getStatusText(status)
}

const getStatusColor = (status: string): string => {
  return instanceUtils.getStatusColor(status)
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatConversionRate = (rate?: number): string => {
  return instanceUtils.formatConversionRate(rate)
}

const formatRevenue = (revenue?: number): string => {
  return instanceUtils.formatRevenue(revenue)
}

const formatDateRange = (startDate?: Date, endDate?: Date): string => {
  return instanceUtils.formatDateRange(startDate, endDate)
}

const hasMetrics = (instance: FunnelInstanceListItem): boolean => {
  return instance.metricsCount > 0 || !!instance.latestMetrics
}

const hasPeriod = (instance: FunnelInstanceListItem): boolean => {
  return !!instance.periodStartDate || !!instance.periodEndDate
}

// Lifecycle
onMounted(() => {
  loadInstances()
})

// Watch for filter changes
watch([searchQuery, templateFilter, statusFilter], () => {
  currentPage.value = 1
})

// Expose methods
defineExpose({
  loadInstances,
  clearSelection,
  getSelectedInstances: () => selectedInstances.value
})
</script>

<style scoped>
.instance-selector {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.selector-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.selection-info {
  font-size: 13px;
  color: #6b7280;
}

.clear-btn {
  padding: 6px 12px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.selector-controls {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box svg {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-box input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-box input:focus {
  outline: none;
  border-color: #4f46e5;
}

.filter-controls {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.instances-container {
  max-height: 500px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 12px;
}

.instances-list {
  padding: 8px 0;
}

.instance-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.instance-item:hover {
  background-color: #f9fafb;
}

.instance-item.selected {
  background-color: #eff6ff;
  border-left: 3px solid #4f46e5;
}

.instance-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-checkbox {
  padding-top: 2px;
}

.checkbox-wrapper {
  position: relative;
}

.checkbox-wrapper input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkbox-custom {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-wrapper input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: -1px;
  left: 2px;
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.instance-info {
  flex: 1;
}

.instance-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.instance-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.green {
  background-color: #dcfce7;
  color: #15803d;
}

.status-badge.blue {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.status-badge.purple {
  background-color: #e9d5ff;
  color: #7c3aed;
}

.status-badge.orange {
  background-color: #fed7aa;
  color: #c2410c;
}

.instance-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.separator {
  opacity: 0.5;
}

.instance-description {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.metrics-preview {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.period-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.instance-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tag {
  padding: 1px 6px;
  background-color: #f3f4f6;
  color: #6b7280;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.tag-more {
  font-size: 11px;
  color: #9ca3af;
}

.instance-action {
  padding-top: 2px;
}

.select-btn,
.selected-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
}

.select-btn {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.select-btn:hover:not(:disabled) {
  background-color: #4338ca;
}

.selected-btn {
  background: #dcfce7;
  color: #15803d;
  border-color: #bbf7d0;
}

.select-btn:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  border-color: #d1d5db;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #f3f4f6;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #6b7280;
}

.selected-summary {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background-color: #f8fafc;
}

.selected-summary h4 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background-color: #e0f2fe;
  border: 1px solid #b3e5fc;
  border-radius: 16px;
  font-size: 12px;
}

.selected-name {
  color: #0277bd;
  font-weight: 500;
}

.remove-btn {
  padding: 0;
  background: none;
  border: none;
  color: #0277bd;
  cursor: pointer;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: #b3e5fc;
}

@media (max-width: 768px) {
  .selector-controls {
    flex-direction: column;
    gap: 8px;
  }

  .search-box {
    max-width: none;
  }

  .filter-controls {
    justify-content: space-between;
  }

  .instance-item {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .instance-primary {
    flex-wrap: wrap;
  }

  .metrics-preview {
    flex-wrap: wrap;
    gap: 8px;
  }

  .selected-list {
    flex-direction: column;
    gap: 4px;
  }
}
</style>