<template>
  <div class="instance-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-left">
        <h2 class="list-title">
          {{ templateName ? `${templateName} 的实例` : '漏斗实例' }}
        </h2>
        <div class="list-stats" v-if="!loading">
          <span class="stat-item">
            共 {{ pagination.total }} 个实例
          </span>
          <span v-if="selectedInstances.size > 0" class="stat-item selected">
            已选择 {{ selectedInstances.size }} 个
          </span>
        </div>
      </div>
      <div class="header-right">
        <button
          v-if="!readOnly"
          class="create-btn"
          @click="$emit('create-instance')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          创建实例
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-input">
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
        <select v-model="statusFilter" @change="onFilterChange" class="filter-select">
          <option value="">所有状态</option>
          <option value="draft">草稿</option>
          <option value="active">活跃</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="paused">已暂停</option>
          <option value="archived">已归档</option>
        </select>

        <select v-model="sortBy" @change="onSortChange" class="filter-select">
          <option value="createdAt">创建时间</option>
          <option value="updatedAt">更新时间</option>
          <option value="name">名称</option>
          <option value="status">状态</option>
          <option value="periodStartDate">开始日期</option>
        </select>

        <button
          class="sort-order-btn"
          @click="toggleSortOrder"
          :title="sortOrder === 'desc' ? '降序' : '升序'"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            :class="{ 'rotated': sortOrder === 'asc' }"
          >
            <path d="M7 14l5-5 5 5z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedInstances.size > 0 && !readOnly" class="bulk-actions">
      <div class="bulk-info">
        已选择 {{ selectedInstances.size }} 个实例
      </div>
      <div class="bulk-buttons">
        <button
          class="bulk-btn"
          @click="bulkOperation('activate')"
          :disabled="bulkLoading"
        >
          激活
        </button>
        <button
          class="bulk-btn"
          @click="bulkOperation('pause')"
          :disabled="bulkLoading"
        >
          暂停
        </button>
        <button
          class="bulk-btn"
          @click="bulkOperation('archive')"
          :disabled="bulkLoading"
        >
          归档
        </button>
        <button
          class="bulk-btn danger"
          @click="confirmBulkDelete"
          :disabled="bulkLoading"
        >
          删除
        </button>
        <button
          class="bulk-btn secondary"
          @click="clearSelection"
        >
          取消选择
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载实例中...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="instances.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 9h-2v2h2V9zm0 4h-2v6h2v-6zm1-9H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8l-6-4zM4 8V6h10l4 4v8H4V8z"/>
        </svg>
      </div>
      <h3>{{ searchQuery ? '未找到匹配的实例' : '暂无实例' }}</h3>
      <p>
        {{ searchQuery 
          ? '尝试调整搜索条件或筛选器' 
          : templateName 
            ? '该模板还没有创建任何实例' 
            : '您还没有创建任何实例'
        }}
      </p>
      <button
        v-if="!readOnly && !searchQuery"
        class="create-btn"
        @click="$emit('create-instance')"
      >
        创建第一个实例
      </button>
    </div>

    <!-- Instance Cards -->
    <div v-else class="instances-grid">
      <FunnelInstanceCard
        v-for="instance in instances"
        :key="instance.id"
        :instance="instance"
        :is-selected="selectedInstances.has(instance.id)"
        :show-selection="!readOnly"
        :show-metrics="showMetrics"
        :show-period="showPeriod"
        :read-only="readOnly"
        @view="onViewInstance"
        @edit="onEditInstance"
        @duplicate="onDuplicateInstance"
        @delete="onDeleteInstance"
        @toggle-selection="toggleInstanceSelection"
      />
    </div>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="pagination">
      <button
        class="page-btn"
        @click="goToPage(pagination.page - 1)"
        :disabled="!pagination.hasPrev || loading"
      >
        上一页
      </button>
      
      <div class="page-numbers">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-btn"
          :class="{ active: page === pagination.page }"
          @click="goToPage(page)"
          :disabled="loading"
        >
          {{ page }}
        </button>
      </div>
      
      <button
        class="page-btn"
        @click="goToPage(pagination.page + 1)"
        :disabled="!pagination.hasNext || loading"
      >
        下一页
      </button>
    </div>

    <!-- Bulk Delete Confirmation -->
    <div v-if="showBulkDeleteConfirm" class="modal-overlay" @click="showBulkDeleteConfirm = false">
      <div class="modal" @click.stop>
        <h3>批量删除确认</h3>
        <p>确定要删除选中的 {{ selectedInstances.size }} 个实例吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showBulkDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="executeBulkDelete" :disabled="bulkLoading">
            {{ bulkLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import FunnelInstanceCard from './FunnelInstanceCard.vue'
import type { 
  FunnelInstanceListItem, 
  InstanceFilters,
  InstanceSort,
  BulkInstanceOperationRequest
} from '@/types/funnel'
import { 
  getFunnelInstances,
  getTemplateInstances,
  duplicateFunnelInstance,
  deleteFunnelInstance,
  bulkOperateInstances
} from '@/api/funnelInstance'

interface Props {
  templateId?: string
  templateName?: string
  showMetrics?: boolean
  showPeriod?: boolean
  readOnly?: boolean
  autoLoad?: boolean
}

interface Emits {
  (e: 'create-instance'): void
  (e: 'view-instance', instanceId: string): void
  (e: 'edit-instance', instanceId: string): void
  (e: 'instance-updated'): void
  (e: 'instance-deleted', instanceId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showMetrics: true,
  showPeriod: true,
  readOnly: false,
  autoLoad: true
})

const emit = defineEmits<Emits>()

// Reactive state
const instances = ref<FunnelInstanceListItem[]>([])
const loading = ref(false)
const bulkLoading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')
const sortBy = ref<string>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const selectedInstances = ref(new Set<string>())
const showBulkDeleteConfirm = ref(false)

const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  pages: 0,
  hasNext: false,
  hasPrev: false
})

// Computed
const visiblePages = computed(() => {
  const current = pagination.value.page
  const total = pagination.value.pages
  const delta = 2
  const range = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < total - 1) {
    range.push('...')
  }
  
  range.unshift(1)
  if (total > 1) {
    range.push(total)
  }
  
  return range.filter((item, index, arr) => arr.indexOf(item) === index)
})

// Methods
const loadInstances = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: searchQuery.value || undefined,
      sort: sortBy.value,
      order: sortOrder.value,
      status: statusFilter.value || undefined
    }

    const response = props.templateId
      ? await getTemplateInstances(props.templateId, params)
      : await getFunnelInstances(params)

    instances.value = response.data
    pagination.value = response.pagination
  } catch (error) {
    console.error('Failed to load instances:', error)
    // Could emit error event or show notification
  } finally {
    loading.value = false
  }
}

const onSearchChange = () => {
  pagination.value.page = 1
  loadInstances()
}

const onFilterChange = () => {
  pagination.value.page = 1
  loadInstances()
}

const onSortChange = () => {
  pagination.value.page = 1
  loadInstances()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadInstances()
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= pagination.value.pages) {
    pagination.value.page = page
    loadInstances()
  }
}

const toggleInstanceSelection = (instanceId: string) => {
  if (selectedInstances.value.has(instanceId)) {
    selectedInstances.value.delete(instanceId)
  } else {
    selectedInstances.value.add(instanceId)
  }
}

const clearSelection = () => {
  selectedInstances.value.clear()
}

const onViewInstance = (instanceId: string) => {
  emit('view-instance', instanceId)
}

const onEditInstance = (instanceId: string) => {
  emit('edit-instance', instanceId)
}

const onDuplicateInstance = async (instanceId: string) => {
  try {
    await duplicateFunnelInstance(instanceId)
    emit('instance-updated')
    await loadInstances()
  } catch (error) {
    console.error('Failed to duplicate instance:', error)
  }
}

const onDeleteInstance = async (instanceId: string) => {
  try {
    await deleteFunnelInstance(instanceId)
    emit('instance-deleted', instanceId)
    await loadInstances()
  } catch (error) {
    console.error('Failed to delete instance:', error)
  }
}

const bulkOperation = async (operation: 'activate' | 'pause' | 'archive') => {
  bulkLoading.value = true
  try {
    await bulkOperateInstances({
      instanceIds: Array.from(selectedInstances.value),
      operation
    })
    clearSelection()
    emit('instance-updated')
    await loadInstances()
  } catch (error) {
    console.error('Bulk operation failed:', error)
  } finally {
    bulkLoading.value = false
  }
}

const confirmBulkDelete = () => {
  showBulkDeleteConfirm.value = true
}

const executeBulkDelete = async () => {
  bulkLoading.value = true
  try {
    await bulkOperateInstances({
      instanceIds: Array.from(selectedInstances.value),
      operation: 'delete'
    })
    clearSelection()
    showBulkDeleteConfirm.value = false
    emit('instance-updated')
    await loadInstances()
  } catch (error) {
    console.error('Bulk delete failed:', error)
  } finally {
    bulkLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (props.autoLoad) {
    loadInstances()
  }
})

// Expose methods for parent component
defineExpose({
  loadInstances,
  refresh: loadInstances
})
</script>

<style scoped>
.instance-list {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h2.list-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.list-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #718096;
}

.stat-item.selected {
  color: #4f46e5;
  font-weight: 500;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.create-btn:hover {
  background-color: #4338ca;
}

.filters-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.search-input {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-input svg {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.search-input input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.filter-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #4f46e5;
}

.sort-order-btn {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-btn:hover {
  background-color: #f9fafb;
}

.sort-order-btn svg.rotated {
  transform: rotate(180deg);
}

.bulk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 24px;
}

.bulk-info {
  font-size: 14px;
  color: #0369a1;
  font-weight: 500;
}

.bulk-buttons {
  display: flex;
  gap: 8px;
}

.bulk-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-btn:hover {
  background-color: #f9fafb;
}

.bulk-btn.danger {
  border-color: #fecaca;
  color: #dc2626;
}

.bulk-btn.danger:hover {
  background-color: #fef2f2;
}

.bulk-btn.secondary {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.bulk-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
  max-width: 400px;
  line-height: 1.5;
}

.instances-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 32px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn.active {
  background-color: #4f46e5;
  border-color: #4f46e5;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 12px 0;
  color: #1a202c;
  font-size: 18px;
  font-weight: 600;
}

.modal p {
  margin: 0 0 20px 0;
  color: #4a5568;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-delete {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.btn-cancel:hover {
  background-color: #edf2f7;
  border-color: #cbd5e0;
}

.btn-delete {
  background: #e53e3e;
  color: white;
  border: 1px solid #e53e3e;
}

.btn-delete:hover {
  background-color: #c53030;
  border-color: #c53030;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filters-section {
    flex-direction: column;
    gap: 12px;
  }

  .search-input {
    max-width: none;
  }

  .bulk-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .bulk-buttons {
    justify-content: center;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>