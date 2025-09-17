<template>
  <div class="create-instance-modal" v-if="showModal" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>创建漏斗实例</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="instance-form">
        <!-- Template Selection -->
        <div class="form-section">
          <h3>选择模板</h3>
          <div class="template-selector" v-if="!preselectedTemplate">
            <div 
              v-for="template in templates" 
              :key="template.id"
              class="template-option"
              :class="{ selected: selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <div class="template-info">
                <h4>{{ template.name }}</h4>
                <p v-if="template.description">{{ template.description }}</p>
                <div class="template-meta">
                  <span class="template-usage">
                    已使用 {{ template.usageCount || 0 }} 次
                  </span>
                  <span v-if="template.isDefault" class="default-badge">默认</span>
                </div>
              </div>
              <div class="template-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8l6-6V4c0-1.1-.9-2-2-2zm4 18l-4-4h4v4z"/>
                </svg>
              </div>
            </div>
          </div>
          <div v-else class="selected-template">
            <div class="template-info">
              <h4>{{ preselectedTemplate.name }}</h4>
              <p v-if="preselectedTemplate.description">{{ preselectedTemplate.description }}</p>
            </div>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="instance-name">实例名称 *</label>
              <input
                id="instance-name"
                type="text"
                v-model="formData.name"
                :class="{ error: errors.name }"
                placeholder="为这个实例起个名称"
                required
              />
              <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
            </div>

            <div class="form-group full-width">
              <label for="instance-description">描述</label>
              <textarea
                id="instance-description"
                v-model="formData.description"
                placeholder="描述这个实例的用途和目标（可选）"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Period Settings -->
        <div class="form-section">
          <h3>时间设置</h3>
          <div class="period-toggle">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="hasPeriod"
                @change="onPeriodToggle"
              />
              <span class="checkbox-custom"></span>
              设置时间范围
            </label>
          </div>

          <div v-if="hasPeriod" class="form-grid period-grid">
            <div class="form-group">
              <label for="start-date">开始日期</label>
              <input
                id="start-date"
                type="date"
                v-model="formData.periodStartDate"
                :class="{ error: errors.periodStartDate }"
              />
              <span v-if="errors.periodStartDate" class="error-message">{{ errors.periodStartDate }}</span>
            </div>

            <div class="form-group">
              <label for="end-date">结束日期</label>
              <input
                id="end-date"
                type="date"
                v-model="formData.periodEndDate"
                :class="{ error: errors.periodEndDate }"
                :min="formData.periodStartDate"
              />
              <span v-if="errors.periodEndDate" class="error-message">{{ errors.periodEndDate }}</span>
            </div>
          </div>

          <div v-if="hasPeriod && formData.periodStartDate && formData.periodEndDate" class="period-info">
            <span class="info-icon">ℹ️</span>
            <span>
              实例将运行 {{ calculateDurationDays(formData.periodStartDate, formData.periodEndDate) }} 天
              （{{ formatDateRange(formData.periodStartDate, formData.periodEndDate) }}）
            </span>
          </div>
        </div>

        <!-- Tags and Notes -->
        <div class="form-section">
          <h3>标签和备注</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="tags">标签</label>
              <div class="tags-input">
                <div class="tags-display">
                  <span
                    v-for="tag in formData.tags"
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                    <button type="button" @click="removeTag(tag)" class="tag-remove">×</button>
                  </span>
                </div>
                <input
                  type="text"
                  v-model="tagInput"
                  @keydown.enter.prevent="addTag"
                  @keydown.comma.prevent="addTag"
                  placeholder="输入标签后按回车或逗号"
                  class="tag-input"
                />
              </div>
              <div class="help-text">用标签来分类和查找实例，支持按回车或逗号添加</div>
            </div>

            <div class="form-group">
              <label for="notes">备注</label>
              <textarea
                id="notes"
                v-model="formData.notes"
                placeholder="记录一些重要信息或说明（可选）"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="closeModal" :disabled="loading">
            取消
          </button>
          <button type="submit" class="btn-submit" :disabled="!isFormValid || loading">
            <span v-if="loading" class="loading-spinner"></span>
            {{ loading ? '创建中...' : '创建实例' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { CreateFunnelInstanceRequest } from '@/types/funnel'
import { createFunnelInstance } from '@/api/funnelInstance'

interface Template {
  id: string
  name: string
  description?: string
  usageCount?: number
  isDefault?: boolean
}

interface Props {
  showModal: boolean
  templates?: Template[]
  preselectedTemplate?: Template
}

interface Emits {
  (e: 'close'): void
  (e: 'created', instance: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reactive state
const loading = ref(false)
const selectedTemplate = ref<Template | null>(null)
const hasPeriod = ref(false)
const tagInput = ref('')

const formData = ref({
  name: '',
  description: '',
  periodStartDate: '',
  periodEndDate: '',
  tags: [] as string[],
  notes: ''
})

const errors = ref({
  name: '',
  periodStartDate: '',
  periodEndDate: ''
})

// Template data
const templates = ref<Template[]>([
  {
    id: '1',
    name: '营销漏斗模板',
    description: '适用于数字营销活动的标准漏斗',
    usageCount: 15,
    isDefault: true
  },
  {
    id: '2',
    name: '销售转化漏斗',
    description: '从线索到成交的销售流程',
    usageCount: 8,
    isDefault: false
  },
  {
    id: '3',
    name: '用户注册流程',
    description: '新用户注册和激活流程',
    usageCount: 23,
    isDefault: false
  }
])

// Computed
const isFormValid = computed(() => {
  return (
    formData.value.name.trim() &&
    (selectedTemplate.value || props.preselectedTemplate) &&
    !errors.value.name &&
    !errors.value.periodStartDate &&
    !errors.value.periodEndDate
  )
})

// Methods
const selectTemplate = (template: Template) => {
  selectedTemplate.value = template
}

const onPeriodToggle = () => {
  if (!hasPeriod.value) {
    formData.value.periodStartDate = ''
    formData.value.periodEndDate = ''
  }
}

const addTag = () => {
  const tag = tagInput.value.trim().replace(',', '')
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (tag: string) => {
  const index = formData.value.tags.indexOf(tag)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  }
}

const validateForm = () => {
  errors.value = { name: '', periodStartDate: '', periodEndDate: '' }

  if (!formData.value.name.trim()) {
    errors.value.name = '请输入实例名称'
  }

  if (hasPeriod.value) {
    if (formData.value.periodStartDate && formData.value.periodEndDate) {
      const startDate = new Date(formData.value.periodStartDate)
      const endDate = new Date(formData.value.periodEndDate)
      
      if (startDate >= endDate) {
        errors.value.periodEndDate = '结束日期必须晚于开始日期'
      }
    }
  }
}

const calculateDurationDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

const formatDateRange = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate).toLocaleDateString('zh-CN')
  const end = new Date(endDate).toLocaleDateString('zh-CN')
  return `${start} - ${end}`
}

const handleSubmit = async () => {
  validateForm()
  
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  
  try {
    const templateId = selectedTemplate.value?.id || props.preselectedTemplate?.id
    
    const requestData: CreateFunnelInstanceRequest = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined,
      funnelTemplateId: templateId!,
      periodStartDate: formData.value.periodStartDate ? new Date(formData.value.periodStartDate) : undefined,
      periodEndDate: formData.value.periodEndDate ? new Date(formData.value.periodEndDate) : undefined,
      tags: formData.value.tags.length > 0 ? formData.value.tags : undefined,
      notes: formData.value.notes.trim() || undefined
    }

    const instance = await createFunnelInstance(requestData)
    
    emit('created', instance)
    closeModal()
  } catch (error) {
    console.error('Failed to create instance:', error)
    // Could show error notification here
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('close')
  // Reset form after a short delay to avoid visual glitches
  setTimeout(resetForm, 200)
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    periodStartDate: '',
    periodEndDate: '',
    tags: [],
    notes: ''
  }
  selectedTemplate.value = null
  hasPeriod.value = false
  tagInput.value = ''
  errors.value = { name: '', periodStartDate: '', periodEndDate: '' }
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

// Watch for prop changes
watch(() => props.showModal, (newValue) => {
  if (newValue) {
    // Auto-select preselected template
    if (props.preselectedTemplate) {
      selectedTemplate.value = props.preselectedTemplate
    }
  }
})

watch(() => formData.value.name, () => {
  if (errors.value.name) {
    validateForm()
  }
})

watch(() => [formData.value.periodStartDate, formData.value.periodEndDate], () => {
  if (errors.value.periodStartDate || errors.value.periodEndDate) {
    validateForm()
  }
})
</script>

<style scoped>
.create-instance-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  padding: 4px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.instance-form {
  padding: 0 24px 24px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.template-selector {
  display: grid;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.template-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-option:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.template-option.selected {
  border-color: #4f46e5;
  background-color: #f0f9ff;
}

.template-info {
  flex: 1;
}

.template-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.template-info p {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-usage {
  font-size: 12px;
  color: #9ca3af;
}

.default-badge {
  padding: 2px 6px;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.template-icon {
  color: #9ca3af;
  margin-left: 12px;
}

.selected-template {
  padding: 16px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-grid.period-grid {
  grid-template-columns: 1fr 1fr;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-group input.error,
.form-group textarea.error,
.form-group select.error {
  border-color: #dc2626;
}

.error-message {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

.period-toggle {
  margin-bottom: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: -1px;
  left: 2px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.period-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 13px;
  color: #1e40af;
  margin-top: 12px;
}

.tags-input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  min-height: 44px;
}

.tags-input:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: #e5e7eb;
  color: #374151;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: #374151;
}

.tag-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  padding: 4px 0;
  min-width: 120px;
}

.help-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 32px;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-submit {
  background: #4f46e5;
  color: white;
  border: 1px solid #4f46e5;
}

.btn-submit:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn-submit:disabled {
  background-color: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 95%;
    margin: 10px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid.period-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .template-selector {
    max-height: 200px;
  }
}
</style>