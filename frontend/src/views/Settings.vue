<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">设置</h1>
      </div>
    </div>
    
    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">

        <!-- Organization Info Form - matching onboarding style -->
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-6">组织信息</h3>
            
            <div class="space-y-6">
              <!-- Company Name -->
              <div>
                <label for="companyName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  公司名称 <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="companyName"
                    v-model="organizationData.name"
                    type="text"
                    required
                    class="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="请输入您的公司名称"
                  />
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
                    v-model="organizationData.industry"
                    :disabled="industriesLoading"
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:opacity-50"
                  >
                    <option value="">{{ industriesLoading ? '加载行业选项中...' : '请选择行业' }}</option>
                    <option v-for="industry in industries" :key="industry.value" :value="industry.value">
                      {{ industry.label }}
                    </option>
                  </select>
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
                    v-model="organizationData.location"
                    required
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">请选择所在城市</option>
                    <option v-for="location in locationOptions" :key="location.value" :value="location.value">
                      {{ location.label }}
                    </option>
                  </select>
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
                      'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20': organizationData.size === size.value,
                      'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': organizationData.size !== size.value
                    }"
                  >
                    <input
                      v-model="organizationData.size"
                      type="radio"
                      :value="size.value"
                      class="sr-only"
                    />
                    <div class="flex flex-1">
                      <div class="flex flex-col">
                        <span
                          class="block text-sm font-medium"
                          :class="{
                            'text-primary-900 dark:text-primary-100': organizationData.size === size.value,
                            'text-gray-900 dark:text-white': organizationData.size !== size.value
                          }"
                        >
                          {{ size.label }}
                        </span>
                        <span
                          class="mt-1 flex items-center text-sm"
                          :class="{
                            'text-primary-700 dark:text-primary-300': organizationData.size === size.value,
                            'text-gray-500 dark:text-gray-400': organizationData.size !== size.value
                          }"
                        >
                          {{ size.description }}
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon
                      v-if="organizationData.size === size.value"
                      class="h-5 w-5 text-primary-600 dark:text-primary-400"
                    />
                  </label>
                </div>
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
                      'border-primary-500 ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20': organizationData.salesModel === model.value,
                      'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500': organizationData.salesModel !== model.value
                    }"
                  >
                    <input
                      v-model="organizationData.salesModel"
                      type="radio"
                      :value="model.value"
                      class="sr-only"
                    />
                    <div class="flex flex-1">
                      <div class="flex flex-col">
                        <span
                          class="block text-sm font-medium"
                          :class="{
                            'text-primary-900 dark:text-primary-100': organizationData.salesModel === model.value,
                            'text-gray-900 dark:text-white': organizationData.salesModel !== model.value
                          }"
                        >
                          {{ model.label }}
                        </span>
                        <span
                          class="mt-1 flex items-center text-sm"
                          :class="{
                            'text-primary-700 dark:text-primary-300': organizationData.salesModel === model.value,
                            'text-gray-500 dark:text-gray-400': organizationData.salesModel !== model.value
                          }"
                        >
                          {{ model.description }}
                        </span>
                      </div>
                    </div>
                    <CheckCircleIcon
                      v-if="organizationData.salesModel === model.value"
                      class="h-5 w-5 text-primary-600 dark:text-primary-400"
                    />
                  </label>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  公司简介
                </label>
                <div class="mt-1">
                  <textarea
                    id="description"
                    v-model="organizationData.description"
                    rows="4"
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                    placeholder="简单介绍一下您的公司和主要业务..."
                  />
                  <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {{ organizationData.description.length }}/500 字符
                  </p>
                </div>
              </div>
            </div>
            
            <div class="mt-6 flex justify-end">
              <button
                @click="saveOrganizationInfo"
                :disabled="loading"
                class="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ loading ? '保存中...' : '保存组织信息' }}
              </button>
            </div>
          </div>
        </div>

        <!-- System Settings -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">系统设置</h3>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">通知设置</span>
                <button
                  type="button"
                  class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  role="switch"
                  aria-checked="false"
                >
                  <span class="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">自动保存</span>
                <button
                  type="button"
                  class="bg-blue-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  role="switch"
                  aria-checked="true"
                >
                  <span class="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { organizationAPI, type Industry } from '@/api/organization'
import { getLocationOptions } from '@/utils/locationMapping'

interface OrganizationData {
  name: string
  industry: string
  location: string
  description: string
  size: string
  salesModel: string
}

const loading = ref(false)
const organizationData = reactive<OrganizationData>({
  name: '',
  industry: '',
  location: '',
  description: '',
  size: '',
  salesModel: ''
})

// Industry options - loaded from database
const industries = ref<{ value: string; label: string }[]>([])
const industriesLoading = ref(false)

// Load industries from database
const loadIndustries = async () => {
  try {
    industriesLoading.value = true
    const response = await organizationAPI.getIndustries()
    if (response.data.success) {
      industries.value = response.data.data.map((industry: Industry) => ({
        value: industry.code,
        label: industry.name
      }))
    }
  } catch (error) {
    console.error('Failed to load industries:', error)
    // Fallback to hardcoded options if API fails
    industries.value = [
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
  } finally {
    industriesLoading.value = false
  }
}

// Company size options (matching onboarding)
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

// Sales model options (matching onboarding)
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

// Location options
const locationOptions = getLocationOptions()

// Save organization info
const saveOrganizationInfo = async () => {
  loading.value = true
  
  try {
    const response = await organizationAPI.updateInfo({
      name: organizationData.name,
      industry: organizationData.industry,
      location: organizationData.location,
      description: organizationData.description,
      size: organizationData.size,
      salesModel: organizationData.salesModel
    })
    
    if (response.data.success) {
      alert('组织信息已保存！')
    } else {
      throw new Error(response.data.message || '保存失败')
    }
  } catch (error: any) {
    console.error('Save organization info failed:', error)
    alert(error.response?.data?.message || error.message || '保存失败，请重试')
  } finally {
    loading.value = false
  }
}

// Load organization data
const loadOrganizationData = async () => {
  try {
    loading.value = true
    const response = await organizationAPI.getInfo()
    if (response.data.success && response.data.data) {
      const orgData = response.data.data
      organizationData.name = orgData.name || ''
      organizationData.industry = orgData.industry || ''
      organizationData.location = orgData.location || ''
      organizationData.description = orgData.description || ''
      organizationData.size = orgData.size || ''
      organizationData.salesModel = orgData.salesModel || ''
    }
    console.log('Organization data loaded:', organizationData)
  } catch (error) {
    console.error('Load organization data failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('Settings page mounted')
  await loadIndustries()
  await loadOrganizationData()
})
</script>