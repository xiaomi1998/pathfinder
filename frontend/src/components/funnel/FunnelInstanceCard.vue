<template>
  <div class="instance-card" :class="{ 'selected': isSelected, 'expired': isExpired }">
    <!-- Header -->
    <div class="card-header">
      <div class="header-left">
        <div v-if="showSelection" class="selection-checkbox">
          <input
            type="checkbox"
            :checked="isSelected"
            @change="$emit('toggle-selection', instance.id)"
          />
        </div>
        <div class="instance-info">
          <h3 class="instance-name">{{ instance.name }}</h3>
          <p v-if="instance.description" class="instance-description">
            {{ instance.description }}
          </p>
          <div class="instance-meta">
            <span class="template-name">
              {{ instance.funnelTemplate?.name || '未知模板' }}
            </span>
            <span class="separator">•</span>
            <span class="created-date">
              {{ formatDate(instance.createdAt) }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="status-badge" :class="statusColor">
          {{ statusText }}
        </div>
        <div class="card-actions" v-if="!readOnly">
          <button
            class="action-btn"
            @click="$emit('edit', instance.id)"
            title="编辑实例"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </button>
          <button
            class="action-btn"
            @click="$emit('duplicate', instance.id)"
            title="复制实例"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
          <button
            class="action-btn danger"
            @click="showDeleteConfirm = true"
            title="删除实例"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Metrics Summary -->
    <div class="metrics-summary" v-if="showMetrics && hasMetrics">
      <div class="metric-item">
        <div class="metric-label">转化率</div>
        <div class="metric-value">
          {{ formatConversionRate(instance.latestMetrics?.overallConversionRate) }}
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-label">总收入</div>
        <div class="metric-value">
          {{ formatRevenue(instance.latestMetrics?.totalRevenue) }}
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-label">数据记录</div>
        <div class="metric-value">{{ instance.metricsCount }}</div>
      </div>
    </div>

    <!-- Period Info -->
    <div class="period-info" v-if="showPeriod && hasPeriod">
      <div class="period-dates">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
        <span>{{ dateRangeText }}</span>
      </div>
      <div v-if="progressPercentage !== null" class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
    </div>

    <!-- Tags -->
    <div class="tags" v-if="instance.tags && instance.tags.length > 0">
      <span
        v-for="tag in instance.tags"
        :key="tag"
        class="tag"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <div class="footer-left">
        <span v-if="instance.completedAt" class="completed-date">
          完成于 {{ formatDate(instance.completedAt) }}
        </span>
        <span v-else class="updated-date">
          更新于 {{ formatDate(instance.updatedAt) }}
        </span>
      </div>
      <div class="footer-right">
        <button
          class="view-btn"
          @click="$emit('view', instance.id)"
        >
          查看详情
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="delete-modal-overlay" @click="showDeleteConfirm = false">
      <div class="delete-modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除实例 "{{ instance.name }}" 吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-delete" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FunnelInstanceListItem } from '@/types/funnel'
import { instanceUtils } from '@/api/funnelInstance'

interface Props {
  instance: FunnelInstanceListItem
  isSelected?: boolean
  showSelection?: boolean
  showMetrics?: boolean
  showPeriod?: boolean
  readOnly?: boolean
}

interface Emits {
  (e: 'view', instanceId: string): void
  (e: 'edit', instanceId: string): void
  (e: 'duplicate', instanceId: string): void
  (e: 'delete', instanceId: string): void
  (e: 'toggle-selection', instanceId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  showSelection: false,
  showMetrics: true,
  showPeriod: true,
  readOnly: false
})

const emit = defineEmits<Emits>()

const showDeleteConfirm = ref(false)

// Computed properties
const statusText = computed(() => instanceUtils.getStatusText(props.instance.status))
const statusColor = computed(() => instanceUtils.getStatusColor(props.instance.status))

const hasMetrics = computed(() => {
  return props.instance.metricsCount > 0 || props.instance.latestMetrics
})

const hasPeriod = computed(() => {
  return props.instance.periodStartDate || props.instance.periodEndDate
})

const dateRangeText = computed(() => {
  return instanceUtils.formatDateRange(props.instance.periodStartDate, props.instance.periodEndDate)
})

const progressPercentage = computed(() => {
  if (!props.instance.periodStartDate || !props.instance.periodEndDate) return null
  return instanceUtils.getProgressPercentage(props.instance.periodStartDate, props.instance.periodEndDate)
})

const isExpired = computed(() => {
  return instanceUtils.isExpired(props.instance.periodEndDate)
})

// Methods
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatConversionRate = (rate?: number) => {
  return instanceUtils.formatConversionRate(rate)
}

const formatRevenue = (revenue?: number) => {
  return instanceUtils.formatRevenue(revenue)
}

const confirmDelete = () => {
  emit('delete', props.instance.id)
  showDeleteConfirm.value = false
}
</script>

<style scoped>
.instance-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.instance-card:hover {
  border-color: #cbd5e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.instance-card.selected {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.instance-card.expired {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.selection-checkbox input {
  margin: 0;
  transform: scale(1.2);
}

.instance-info {
  flex: 1;
}

.instance-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.instance-description {
  font-size: 14px;
  color: #4a5568;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.instance-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #718096;
}

.template-name {
  font-weight: 500;
}

.separator {
  opacity: 0.5;
}

.header-right {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.gray {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.status-badge.green {
  background-color: #f0fff4;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.status-badge.blue {
  background-color: #ebf8ff;
  color: #2a4365;
  border: 1px solid #90cdf4;
}

.status-badge.purple {
  background-color: #faf5ff;
  color: #44337a;
  border: 1px solid #c4b5fd;
}

.status-badge.orange {
  background-color: #fffaf0;
  color: #c05621;
  border: 1px solid #fbd38d;
}

.status-badge.red {
  background-color: #fff5f5;
  color: #742a2a;
  border: 1px solid #feb2b2;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.action-btn.danger:hover {
  background-color: #fed7d7;
  border-color: #feb2b2;
  color: #c53030;
}

.metrics-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
  margin-bottom: 16px;
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #718096;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.period-info {
  margin-bottom: 16px;
}

.period-dates {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4f46e5;
  transition: width 0.3s ease;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.tag {
  padding: 2px 8px;
  background-color: #edf2f7;
  color: #4a5568;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.footer-left {
  font-size: 12px;
  color: #718096;
}

.completed-date {
  color: #22543d;
  font-weight: 500;
}

.view-btn {
  padding: 6px 12px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.view-btn:hover {
  background-color: #4338ca;
}

/* Delete Modal */
.delete-modal-overlay {
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

.delete-modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.delete-modal h3 {
  margin: 0 0 12px 0;
  color: #1a202c;
  font-size: 18px;
  font-weight: 600;
}

.delete-modal p {
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
</style>