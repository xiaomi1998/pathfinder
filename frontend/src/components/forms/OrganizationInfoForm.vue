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

    <!-- Company Size -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        公司规模
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
import { reactive, computed, watch } from 'vue'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  modelValue?: {
    name: string
    industry: string
    size: string
    description: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    name: '',
    industry: '',
    size: '',
    description: ''
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
  description: props.modelValue.description || ''
})

// Validation errors
const errors = reactive({
  name: '',
  industry: '',
  size: '',
  description: ''
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

// Company size options
const companySizes = [
  {
    value: '1-10',
    label: '1-10 人',
    description: '初创团队或小微企业'
  },
  {
    value: '11-50',
    label: '11-50 人',
    description: '小型企业'
  },
  {
    value: '51-200',
    label: '51-200 人',
    description: '中小型企业'
  },
  {
    value: '201-1000',
    label: '201-1000 人',
    description: '中大型企业'
  },
  {
    value: '1000+',
    label: '1000+ 人',
    description: '大型企业或集团'
  }
]

// Validation
const validateForm = () => {
  // Reset errors
  errors.name = ''
  errors.industry = ''
  errors.size = ''
  errors.description = ''

  let isValid = true

  // Validate company name
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

  // Validate description length
  if (form.description.length > 500) {
    errors.description = '公司简介不能超过 500 个字符'
    isValid = false
  }

  emit('validation-change', isValid)
  return isValid
}

// Computed
const isFormValid = computed(() => {
  return form.name.trim().length >= 2 && form.description.length <= 500
})

// Watch for changes
watch(form, () => {
  emit('update:modelValue', { ...form })
  validateForm()
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  Object.assign(form, newValue)
}, { deep: true })

// Expose validation method
defineExpose({
  validateForm,
  isValid: isFormValid
})
</script>