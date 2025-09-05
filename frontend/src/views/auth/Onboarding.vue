<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex items-center space-x-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">P</span>
          </div>
          <span class="text-2xl font-bold text-gray-900 dark:text-white">Pathfinder</span>
        </router-link>
        
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          欢迎来到 Pathfinder！
        </h1>
        <p class="text-lg text-gray-600 dark:text-gray-300">
          让我们完成一些基础设置，帮助您更好地使用我们的平台
        </p>
      </div>

      <!-- Multi-step Form -->
      <MultiStepForm
        ref="multiStepForm"
        :steps="onboardingSteps"
        :title="'账户设置'"
        :next-button-text="'继续'"
        :finish-button-text="'完成设置'"
        persist-data-key="pathfinder-onboarding"
        v-model="formData"
        @step-change="handleStepChange"
        @validate-step="handleStepValidation"
        @skip="handleStepSkip"
        @complete="handleOnboardingComplete"
      >
        <template #default="{ step, stepIndex, data }">
          <!-- Welcome Step -->
          <div v-if="step.id === 'welcome'" class="text-center py-8">
            <div class="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon class="w-12 h-12 text-white" />
            </div>
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              开始您的客户旅程分析之路
            </h3>
            <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Pathfinder 是一个专业的客户旅程分析平台，帮助您优化转化漏斗，提升业务效果。
              让我们先了解一下您和您的团队。
            </p>
            
            <!-- Feature highlights -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div class="text-center">
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ChartBarIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">可视化漏斗</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">直观的拖拽式漏斗构建</p>
              </div>
              
              <div class="text-center">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BoltIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">AI 分析助手</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">智能的数据洞察和建议</p>
              </div>
              
              <div class="text-center">
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <UsersIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">团队协作</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">多人协作分析和优化</p>
              </div>
            </div>
          </div>

          <!-- Organization Info Step -->
          <div v-else-if="step.id === 'organization'">
            <OrganizationInfoForm
              ref="orgForm"
              v-model="formData.organization"
              @validation-change="handleOrgValidationChange"
            />
          </div>

          <!-- Complete Step -->
          <div v-else-if="step.id === 'complete'" class="text-center py-8">
            <div class="w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon class="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              设置完成！
            </h3>
            <p class="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              太好了！现在您可以开始创建您的第一个转化漏斗，探索客户旅程的奥秘。
            </p>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                type="button"
                class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                @click="navigateToFunnelBuilder"
              >
                <PlusIcon class="mr-2 -ml-1 h-4 w-4" />
                创建漏斗
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                @click="navigateToDashboard"
              >
                <HomeIcon class="mr-2 -ml-1 h-4 w-4" />
                查看仪表板
              </button>
            </div>
          </div>
        </template>
      </MultiStepForm>

      <!-- Loading overlay -->
      <div v-if="isSubmitting" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
          <div class="flex items-center">
            <LoadingSpinner class="mr-3" />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">正在保存设置...</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">请稍候</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  SparklesIcon, 
  ChartBarIcon, 
  BoltIcon, 
  UsersIcon, 
  CheckIcon, 
  PlusIcon, 
  HomeIcon 
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'
import MultiStepForm from '@components/forms/MultiStepForm.vue'
import OrganizationInfoForm from '@components/forms/OrganizationInfoForm.vue'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'
import { organizationAPI } from '@/api/organization'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Refs
const multiStepForm = ref()
const orgForm = ref()

// State
const isSubmitting = ref(false)
const isOrgFormValid = ref(false)

const formData = reactive({
  organization: {
    name: '',
    industry: '',
    size: '',
    description: ''
  }
})

// Onboarding steps configuration
const onboardingSteps = [
  {
    id: 'welcome',
    title: '欢迎',
    description: '了解 Pathfinder 平台',
    canSkip: false,
    requiresValidation: false
  },
  {
    id: 'organization',
    title: '组织信息',
    description: '设置您的团队信息',
    canSkip: true,
    requiresValidation: true
  },
  {
    id: 'complete',
    title: '完成',
    description: '开始使用 Pathfinder',
    canSkip: false,
    requiresValidation: false
  }
]

// Methods
const handleStepChange = (stepIndex: number, stepData: any) => {
  console.log('Step changed:', stepIndex, stepData)
}

const handleStepValidation = async (stepIndex: number): Promise<boolean> => {
  const step = onboardingSteps[stepIndex]
  
  if (step.id === 'organization') {
    // Validate organization form
    if (orgForm.value) {
      return orgForm.value.validateForm()
    }
    return isOrgFormValid.value
  }
  
  return true
}

const handleStepSkip = (stepIndex: number, stepData: any) => {
  console.log('Step skipped:', stepIndex, stepData)
}

const handleOrgValidationChange = (isValid: boolean) => {
  isOrgFormValid.value = isValid
}

const handleOnboardingComplete = async (data: any) => {
  try {
    isSubmitting.value = true

    // Submit organization information if provided
    if (data.organization && data.organization.name) {
      await organizationAPI.updateInfo(data.organization)
      appStore.showSuccess('组织信息已更新', '您的团队信息已成功保存')
    }

    // Clear persisted onboarding data
    if (multiStepForm.value) {
      multiStepForm.value.clearPersistedData()
    }

    // Navigate to dashboard
    appStore.showSuccess('欢迎使用 Pathfinder！', '您已成功完成账户设置，可以开始创建漏斗了')
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push('/dashboard')
  } catch (error: any) {
    console.error('Onboarding completion failed:', error)
    appStore.showError('保存失败', error.message || '保存设置时出现错误，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const navigateToFunnelBuilder = () => {
  router.push('/funnels/create')
}

const navigateToDashboard = () => {
  router.push('/dashboard')
}

// Guard against non-authenticated users
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>