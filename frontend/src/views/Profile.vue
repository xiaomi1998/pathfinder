<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900">资料</h1>
      </div>
    </div>
    
    <div class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex items-center space-x-6 mb-6">
              <div class="shrink-0">
                <div class="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-gray-900">{{ profile.name || '用户名称' }}</h2>
                <p class="text-gray-500">{{ profile.email || 'user@example.com' }}</p>
                <p class="text-sm text-gray-400 mt-1">成为会员于 {{ profile.joinDate || '2024年1月' }}</p>
              </div>
            </div>

            <form @submit.prevent="updateProfile" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label for="firstName" class="block text-sm font-medium text-gray-700">名</label>
                  <input
                    type="text"
                    id="firstName"
                    v-model="form.firstName"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label for="lastName" class="block text-sm font-medium text-gray-700">姓</label>
                  <input
                    type="text"
                    id="lastName"
                    v-model="form.lastName"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">邮箱地址</label>
                <input
                  type="email"
                  id="email"
                  v-model="form.email"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label for="company" class="block text-sm font-medium text-gray-700">公司</label>
                <input
                  type="text"
                  id="company"
                  v-model="form.company"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label for="timezone" class="block text-sm font-medium text-gray-700">时区</label>
                <select
                  id="timezone"
                  v-model="form.timezone"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">东部时间</option>
                  <option value="America/Chicago">中部时间</option>
                  <option value="America/Denver">山区时间</option>
                  <option value="America/Los_Angeles">太平洋时间</option>
                </select>
              </div>

              <div class="flex justify-end space-x-3">
                <button
                  type="button"
                  @click="resetForm"
                  class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {{ loading ? '更新中...' : '更新资料' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Organization Information Section -->
        <div class="bg-white shadow rounded-lg mt-6">
          <div class="px-4 py-5 sm:p-6">
            <div class="mb-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">组织信息</h3>
              <p class="mt-1 text-sm text-gray-500">
                更新您的组织和公司信息
              </p>
            </div>

            <!-- Loading State -->
            <div v-if="dataLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span class="ml-3 text-gray-600">加载组织信息中...</span>
            </div>

            <!-- Form Content -->
            <div v-else>
              <!-- 调试信息 (仅开发环境) -->
              <div v-if="isDev" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 class="text-sm font-medium text-yellow-800 mb-2">🔧 调试信息</h4>
                <div class="text-xs text-yellow-700 space-y-1">
                  <div>表单状态: {{ Object.keys(organizationForm).filter(k => organizationForm[k as keyof typeof organizationForm]).length }}/6 字段有值</div>
                  <div>验证状态: {{ isOrganizationValid ? '✅ 有效' : '❌ 无效' }}</div>
                  <div>当前表单数据: {{ JSON.stringify(organizationForm) }}</div>
                </div>
              </div>
              
              <OrganizationInfoForm
                v-model="organizationForm"
                @validation-change="onOrganizationValidationChange"
              />
            </div>

            <div class="flex justify-between items-center mt-6">
              <!-- 重新加载按钮 -->
              <button
                type="button"
                @click="loadOrganizationInfo"
                :disabled="dataLoading"
                class="bg-gray-100 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ dataLoading ? '加载中...' : '🔄 重新加载' }}
              </button>
              
              <!-- 操作按钮组 -->
              <div class="flex space-x-3">
                <button
                  type="button"
                  @click="resetOrganizationForm"
                  class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  重置
                </button>
                <button
                  type="button"
                  @click="updateOrganizationInfo"
                  :disabled="organizationLoading || !isOrganizationValid"
                  class="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ organizationLoading ? '保存中...' : '保存组织信息' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="successMessage" class="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                {{ successMessage }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import OrganizationInfoForm from '@/components/forms/OrganizationInfoForm.vue'
import { organizationAPI } from '@/api/organization'

const loading = ref(false)
const dataLoading = ref(false)
const organizationLoading = ref(false)
const isOrganizationValid = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// 开发环境检测
const isDev = ref(import.meta.env.DEV)

const profile = ref({
  name: '',
  email: '',
  joinDate: ''
})

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  timezone: 'UTC'
})

// Organization form data
const organizationForm = reactive({
  name: '',
  industry: '',
  size: '',
  description: '',
  location: '',
  salesModel: ''
})

const updateProfile = async () => {
  loading.value = true
  try {
    // TODO: Implement profile update logic
    console.log('Profile update:', form)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  } catch (error) {
    console.error('Profile update failed:', error)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  // Reset form to original values
  Object.assign(form, {
    firstName: '',
    lastName: '',
    email: profile.value.email,
    company: '',
    timezone: 'UTC'
  })
}

// Organization-related methods
const onOrganizationValidationChange = (isValid: boolean) => {
  isOrganizationValid.value = isValid
  console.log('Organization validation changed:', isValid)
}

const updateOrganizationInfo = async () => {
  if (!isOrganizationValid.value) {
    errorMessage.value = '请完成所有必填信息'
    successMessage.value = ''
    return
  }

  organizationLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await organizationAPI.updateInfo(organizationForm)
    
    if (response.data.success) {
      successMessage.value = '组织信息更新成功！'
      console.log('Organization info updated successfully')
    } else {
      throw new Error(response.data.message || '更新失败')
    }
  } catch (error: any) {
    console.error('Organization update failed:', error)
    errorMessage.value = error.response?.data?.message || error.message || '更新组织信息失败，请重试'
  } finally {
    organizationLoading.value = false
    
    // Clear messages after 5 seconds
    setTimeout(() => {
      successMessage.value = ''
      errorMessage.value = ''
    }, 5000)
  }
}

const resetOrganizationForm = () => {
  Object.assign(organizationForm, {
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  })
  errorMessage.value = ''
  successMessage.value = ''
}

const loadOrganizationInfo = async () => {
  dataLoading.value = true
  errorMessage.value = ''
  
  try {
    console.log('🔄 Loading organization info...')
    const response = await organizationAPI.getInfo()
    
    console.log('📡 API Response:', response.data)
    
    if (response.data.success && response.data.data) {
      console.log('📋 Organization data received:', response.data.data)
      console.log('📋 Current form state before update:', { ...organizationForm })
      
      // 使用 nextTick 确保DOM 更新后再更新表单数据
      await nextTick()
      
      // 先清空表单，然后重新赋值，确保响应性更新
      Object.keys(organizationForm).forEach(key => {
        organizationForm[key as keyof typeof organizationForm] = ''
      })
      
      await nextTick()
      
      // 重新赋值
      Object.assign(organizationForm, {
        name: response.data.data.name || '',
        industry: response.data.data.industry || '',
        size: response.data.data.size || '',
        description: response.data.data.description || '',
        location: response.data.data.location || '',
        salesModel: response.data.data.salesModel || ''
      })
      
      console.log('📋 Form state after update:', { ...organizationForm })
      console.log('✅ Organization info loaded successfully')
      
      // 显示加载成功的提示
      successMessage.value = '组织信息加载成功'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
      
    } else {
      console.log('⚠️ No organization data found or API returned error:', response.data)
      // 如果没有数据，不显示错误，可能是第一次使用
    }
  } catch (error: any) {
    console.error('❌ Failed to load organization info:', error)
    console.error('❌ Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    // 只在真正的错误时显示错误信息（非404）
    if (error.response?.status !== 404) {
      errorMessage.value = '加载组织信息失败，请刷新页面重试'
    }
  } finally {
    dataLoading.value = false
  }
}

onMounted(async () => {
  console.log('🎯 Profile component mounted')
  
  // Load organization info with proper error handling
  console.log('📋 Initial form state:', { ...organizationForm })
  
  try {
    await loadOrganizationInfo()
    console.log('📋 Final form state after loading:', { ...organizationForm })
  } catch (error) {
    console.error('❌ Error in onMounted:', error)
  }
})
</script>