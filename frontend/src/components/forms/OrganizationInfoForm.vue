<template>
  <div class="space-y-6">
    <!-- Company Name -->
    <div>
      <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        公司名称 <span class="text-red-500">*</span>
      </label>
      <div class="mt-1">
        <input
          id="companyName"
          v-model="form.name"
          name="companyName"
          type="text"
          required
          class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': errors.name
          }"
          placeholder="请输入您的公司名称"
        />
        <p v-if="errors.name" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ errors.name }}
        </p>
      </div>
    </div>

    <!-- Industry -->
    <div>
      <label for="industry" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        行业领域
      </label>
      <div class="mt-1">
        <select
          id="industry"
          v-model="form.industry"
          name="industry"
          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">请选择行业</option>
          <option v-for="industry in industries" :key="industry.value" :value="industry.value">
            {{ industry.label }}
          </option>
        </select>
        <p v-if="errors.industry" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ errors.industry }}
        </p>
      </div>
    </div>

    <!-- Location -->
    <div>
      <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        所在城市 <span class="text-red-500">*</span>
      </label>
      <div class="mt-1">
        <select
          id="location"
          v-model="form.location"
          name="location"
          required
          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': errors.location
          }"
        >
          <option value="">请选择所在城市</option>
          <option v-for="location in locationOptions" :key="location.value" :value="location.value">
            {{ location.label }}
          </option>
        </select>
        <p v-if="errors.location" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ errors.location }}
        </p>
      </div>
    </div>

    <!-- Company Size -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        团队规模 <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label
          v-for="size in companySizes"
          :key="size.value"
          class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors"
          :class="{
            'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20': form.size === size.value,
            'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': form.size !== size.value
          }"
        >
          <input
            v-model="form.size"
            type="radio"
            :value="size.value"
            class="sr-only"
          />
          <div class="flex flex-1">
            <div class="flex flex-col">
              <span
                class="block text-sm font-medium"
                :class="{
                  'text-primary-900 dark:text-primary-100': form.size === size.value,
                  'text-gray-900 dark:text-white': form.size !== size.value
                }"
              >
                {{ size.label }}
              </span>
              <span
                class="mt-1 flex items-center text-sm"
                :class="{
                  'text-primary-700 dark:text-primary-300': form.size === size.value,
                  'text-gray-500 dark:text-gray-400': form.size !== size.value
                }"
              >
                {{ size.description }}
              </span>
            </div>
          </div>
          <CheckCircleIcon
            v-if="form.size === size.value"
            class="h-5 w-5 text-primary-600 dark:text-primary-400"
          />
        </label>
      </div>
      <p v-if="errors.size" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ errors.size }}
      </p>
    </div>

    <!-- Sales Model -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        销售模型 <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label
          v-for="model in salesModels"
          :key="model.value"
          class="relative flex cursor-pointer rounded-lg border p-4 focus:outline-none transition-colors"
          :class="{
            'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20': form.salesModel === model.value,
            'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': form.salesModel !== model.value
          }"
        >
          <input
            v-model="form.salesModel"
            type="radio"
            :value="model.value"
            class="sr-only"
          />
          <div class="flex flex-1">
            <div class="flex flex-col">
              <span
                class="block text-sm font-medium"
                :class="{
                  'text-primary-900 dark:text-primary-100': form.salesModel === model.value,
                  'text-gray-900 dark:text-white': form.salesModel !== model.value
                }"
              >
                {{ model.label }}
              </span>
              <span
                class="mt-1 flex items-center text-sm"
                :class="{
                  'text-primary-700 dark:text-primary-300': form.salesModel === model.value,
                  'text-gray-500 dark:text-gray-400': form.salesModel !== model.value
                }"
              >
                {{ model.description }}
              </span>
            </div>
          </div>
          <CheckCircleIcon
            v-if="form.salesModel === model.value"
            class="h-5 w-5 text-primary-600 dark:text-primary-400"
          />
        </label>
      </div>
      <p v-if="errors.salesModel" class="mt-2 text-sm text-red-600 dark:text-red-400">
        {{ errors.salesModel }}
      </p>
    </div>

    <!-- Description -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        公司简介
      </label>
      <div class="mt-1">
        <textarea
          id="description"
          v-model="form.description"
          name="description"
          rows="4"
          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
          :class="{
            'border-red-300 focus:border-red-500 focus:ring-red-500': errors.description
          }"
          placeholder="简单介绍一下您的公司和主要业务..."
        />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ form.description.length }}/500 字符
        </p>
        <p v-if="errors.description" class="mt-1 text-sm text-red-600 dark:text-red-400">
          {{ errors.description }}
        </p>
      </div>
    </div>

    <!-- Real-time Validation Status (Always visible) -->
    <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 mb-6">
      <div class="flex">
        <InformationCircleIcon class="h-5 w-5 text-gray-400 dark:text-gray-300 flex-shrink-0 mt-0.5" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            📋 必填信息检查
          </h3>
          <div class="text-sm space-y-1">
            <div class="flex items-center">
              <span :class="form.name.trim().length >= 2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ form.name.trim().length >= 2 ? '✅' : '❌' }}
              </span>
              <span class="ml-2 text-gray-700 dark:text-gray-300">
                公司名称 {{ form.name.trim().length >= 2 ? '(已填写)' : '(必填 - 至少2个字符)' }}
              </span>
            </div>
            <div class="flex items-center">
              <span :class="form.location ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ form.location ? '✅' : '❌' }}
              </span>
              <span class="ml-2 text-gray-700 dark:text-gray-300">
                所在城市 {{ form.location ? '(已选择)' : '(必选)' }}
              </span>
            </div>
            <div class="flex items-center">
              <span :class="form.size ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ form.size ? '✅' : '❌' }}
              </span>
              <span class="ml-2 text-gray-700 dark:text-gray-300">
                团队规模 {{ form.size ? '(已选择)' : '(必选)' }}
              </span>
            </div>
            <div class="flex items-center">
              <span :class="form.salesModel ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ form.salesModel ? '✅' : '❌' }}
              </span>
              <span class="ml-2 text-gray-700 dark:text-gray-300">
                销售模型 {{ form.salesModel ? '(已选择)' : '(必选)' }}
              </span>
            </div>
            <div class="flex items-center pt-2">
              <span :class="isFormValid ? 'text-green-600 dark:text-green-400 font-bold' : 'text-red-600 dark:text-red-400 font-bold'">
                {{ isFormValid ? '✅ 可以继续' : '❌ 请完成必填信息' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
      <div class="flex">
        <InformationCircleIcon class="h-5 w-5 text-blue-400 dark:text-blue-300 flex-shrink-0 mt-0.5" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            为什么需要这些信息？
          </h3>
          <p class="mt-2 text-sm text-blue-700 dark:text-blue-300">
            这些信息将帮助我们为您提供更个性化的体验和相关的功能建议。您可以随时在设置中修改这些信息。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, onMounted, nextTick } from 'vue'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'
import { getLocationOptions } from '@/utils/locationMapping'

// Props
interface Props {
  modelValue?: {
    name: string
    industry: string
    size: string
    description: string
    location: string
    salesModel: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  })
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: typeof form): void
  (e: 'validation-change', isValid: boolean): void
}

const emit = defineEmits<Emits>()

// Form data
const form = reactive({
  name: props.modelValue.name || '',
  industry: props.modelValue.industry || '',
  size: props.modelValue.size || '',
  description: props.modelValue.description || '',
  location: props.modelValue.location || '',
  salesModel: props.modelValue.salesModel || ''
})

// Validation errors
const errors = reactive({
  name: '',
  industry: '',
  size: '',
  description: '',
  location: '',
  salesModel: ''
})

// Industry options
const industries = [
  { value: 'technology', label: '科技/互联网' },
  { value: 'finance', label: '金融/保险' },
  { value: 'healthcare', label: '医疗健康' },
  { value: 'education', label: '教育培训' },
  { value: 'retail', label: '零售/电商' },
  { value: 'manufacturing', label: '制造业' },
  { value: 'consulting', label: '咨询服务' },
  { value: 'media', label: '媒体/广告' },
  { value: 'real_estate', label: '房地产' },
  { value: 'travel', label: '旅游/酒店' },
  { value: 'other', label: '其他' }
]

// Company size options (adjusted to user requirements)
const companySizes = [
  {
    value: '1-10',
    label: '1-10 人',
    description: '初创团队或小微企业'
  },
  {
    value: '11-30',
    label: '11-30 人',
    description: '小型企业'
  },
  {
    value: '31-100',
    label: '31-100 人',
    description: '中型企业'
  }
]

// Sales model options
const salesModels = [
  {
    value: 'toB',
    label: 'ToB（企业客户）',
    description: '主要面向企业和机构客户'
  },
  {
    value: 'toC',
    label: 'ToC（个人用户）',
    description: '主要面向个人消费者'
  }
]

// Location options (从统一的映射工具获取)
const locationOptions = getLocationOptions()

// Simple validation method
const validateForm = () => {
  // Reset errors
  errors.name = ''
  errors.industry = ''
  errors.size = ''
  errors.description = ''
  errors.location = ''
  errors.salesModel = ''

  let isValid = true

  // Validate company name (required)
  if (!form.name.trim()) {
    errors.name = '公司名称为必填项'
    isValid = false
  } else if (form.name.length < 2) {
    errors.name = '公司名称至少需要 2 个字符'
    isValid = false
  } else if (form.name.length > 100) {
    errors.name = '公司名称不能超过 100 个字符'
    isValid = false
  }

  // Validate location (required)
  if (!form.location) {
    errors.location = '请选择所在城市'
    isValid = false
  }

  // Validate team size (required)
  if (!form.size) {
    errors.size = '请选择团队规模'
    isValid = false
  }

  // Validate sales model (required)
  if (!form.salesModel) {
    errors.salesModel = '请选择销售模型'
    isValid = false
  }

  // Validate description length
  if (form.description.length > 500) {
    errors.description = '公司简介不能超过 500 个字符'
    isValid = false
  }

  console.log('📝 OrganizationInfoForm validateForm result:', isValid)
  
  return isValid
}

// Simple computed validation (for display and real-time feedback)
const isFormValid = computed(() => {
  const result = form.name.trim().length >= 2 && 
         form.location && 
         form.size && 
         form.salesModel && 
         form.description.length <= 500
  
  console.log('🔄 OrganizationInfoForm computed validation:', result, {
    name: form.name.trim().length >= 2,
    location: !!form.location,
    size: !!form.size,
    salesModel: !!form.salesModel,
    description: form.description.length <= 500
  })
  
  return result
})

// Watch for changes - emit validation state immediately with debouncing
watch(form, () => {
  emit('update:modelValue', { ...form })
  const isValid = isFormValid.value
  
  // Use nextTick to ensure DOM updates before emitting validation
  nextTick(() => {
    emit('validation-change', isValid)
    console.log('🔄 OrganizationInfoForm validation changed:', isValid, 'form state:', {
      name: form.name.trim().length >= 2,
      location: !!form.location,
      size: !!form.size,
      salesModel: !!form.salesModel
    })
    
    // Also emit immediately without nextTick for faster response
    emit('validation-change', isValid)
  })
}, { deep: true, immediate: true })

watch(() => props.modelValue, (newValue) => {
  console.log('📋 OrganizationInfoForm received new modelValue:', newValue)
  if (newValue) {
    Object.assign(form, newValue)
  } else {
    // If modelValue is reset to empty/null, clear the form
    form.name = ''
    form.industry = ''
    form.size = ''
    form.description = ''
    form.location = ''
    form.salesModel = ''
  }
  
  // Force validation update after form reset
  const isValid = isFormValid.value
  emit('validation-change', isValid)
  console.log('📋 OrganizationInfoForm validation after modelValue change:', isValid)
}, { deep: true, immediate: true })

// Initialize validation on mount
onMounted(() => {
  const isValid = isFormValid.value
  emit('validation-change', isValid)
  console.log('🎆 OrganizationInfoForm mounted, initial validation:', isValid)
})

// Expose validation method
defineExpose({
  validateForm,
  isValid: isFormValid
})
</script>