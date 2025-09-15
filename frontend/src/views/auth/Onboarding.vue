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
        @validation-change="handleValidationChange"
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

          <!-- Template Selection Step -->
          <div v-else-if="step.id === 'template'">
            <FunnelTemplateSelection
              ref="templateSelectionRef"
              v-model="formData.selectedTemplate"
              :organization="formData.organization"
            />
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
import { ref, reactive, onMounted, nextTick } from 'vue'
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
import FunnelTemplateSelection from '@components/funnel/FunnelTemplateSelection.vue'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'
import { organizationAPI } from '@/api/organization'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Refs
const multiStepForm = ref()
const orgForm = ref()
const templateSelectionRef = ref()

// State
const isSubmitting = ref(false)
const isOrgFormValid = ref(false)

const formData = reactive({
  organization: {
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  },
  selectedTemplate: ''
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
    id: 'template',
    title: '选择模板',
    description: '选择业务漏斗模板',
    canSkip: false,
    requiresValidation: false
  }
]

// Methods
const handleStepChange = (stepIndex: number, stepData: any) => {
  console.log('Step changed:', stepIndex, stepData)
  
  const currentStep = onboardingSteps[stepIndex]
  console.log('🔄 Onboarding step change:', {
    stepIndex,
    currentStepId: currentStep?.id,
    organizationData: formData.organization
  })
  
  // Save organization data when leaving organization step
  const previousStep = onboardingSteps[stepIndex - 1]
  if (previousStep && previousStep.id === 'organization' && formData.organization.name) {
    sessionStorage.setItem('onboardingOrgData', JSON.stringify(formData.organization))
    console.log('💾 Saved organization data to sessionStorage:', formData.organization)
  }
  
  // Log organization data when entering template step
  if (currentStep?.id === 'template') {
    console.log('🏭 Entering template step with organization data:', formData.organization)
  }
}

const handleStepValidation = async (stepIndex: number) => {
  const step = onboardingSteps[stepIndex]
  const isDev = import.meta.env.DEV
  
  if (isDev) {
    console.log('🔍 Onboarding handleStepValidation called:', {
      stepIndex,
      stepId: step.id,
      orgFormExists: !!orgForm.value,
      isOrgFormValidState: isOrgFormValid.value
    })
  }
  
  if (step.id === 'organization') {
    // Validate organization form and ensure the validation state is updated
    if (orgForm.value) {
      const isValid = orgForm.value.validateForm()
      const computedValid = orgForm.value.isValid
      
      if (isDev) {
        console.log('📝 Organization form validation details:', {
          validateFormResult: isValid,
          computedIsValid: computedValid,
          formData: { ...formData.organization }
        })
      }
      
      // Save organization data when validation passes
      if (computedValid && formData.organization.name) {
        sessionStorage.setItem('onboardingOrgData', JSON.stringify(formData.organization))
        console.log('💾 Saved organization data during validation')
      }
      
      // Update the MultiStepForm validation state directly since emit return values don't work
      if (multiStepForm.value) {
        multiStepForm.value.updateStepValidation(computedValid)
      }
      
      return computedValid
    }
    
    if (isDev) {
      console.log('📝 Organization form validation fallback:', isOrgFormValid.value)
    }
    
    // Update validation state for fallback case too
    if (multiStepForm.value) {
      multiStepForm.value.updateStepValidation(isOrgFormValid.value)
    }
    
    return isOrgFormValid.value
  }
  
  return true
}

const handleStepSkip = (stepIndex: number, stepData: any) => {
  console.log('Step skipped:', stepIndex, stepData)
}

const handleOrgValidationChange = (isValid: boolean) => {
  const isDev = import.meta.env.DEV
  if (isDev) {
    console.log('🔄 Onboarding handleOrgValidationChange:', {
      isValid,
      previousState: isOrgFormValid.value,
      multiStepFormExists: !!multiStepForm.value,
      formData: formData.organization
    })
  }
  
  isOrgFormValid.value = isValid
  
  // Update the MultiStepForm validation state with multiple retries to ensure it sticks
  if (multiStepForm.value) {
    // Immediate update
    multiStepForm.value.updateStepValidation(isValid)
    
    // Multiple retries with different delays to ensure validation sticks
    const retryDelays = [10, 50, 100, 200, 500]
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        if (multiStepForm.value) {
          multiStepForm.value.updateStepValidation(isValid)
          if (isDev) {
            console.log(`🔄 Onboarding validation retry ${index + 1}:`, isValid)
          }
        }
      }, delay)
    })
  }
}

const handleValidationChange = (stepIndex: number, isValid: boolean) => {
  console.log('MultiStepForm validation change:', stepIndex, isValid)
}

const handleOnboardingComplete = async (data: any) => {
  try {
    isSubmitting.value = true

    // Submit organization information if provided
    if (data.organization && data.organization.name) {
      console.log('Onboarding handleOnboardingComplete sending data:', data.organization)
      const response = await organizationAPI.updateInfo(data.organization)
      console.log('Onboarding handleOnboardingComplete response:', response)
      appStore.showSuccess('组织信息已更新', '您的团队信息已成功保存')
    } else {
      console.log('Onboarding handleOnboardingComplete - no organization data to save:', data)
    }

    // Clear persisted onboarding data
    if (multiStepForm.value) {
      multiStepForm.value.clearPersistedData()
    }

    // Check if funnel was already created
    const funnelCreated = sessionStorage.getItem('onboardingReturnComplete') === 'true'
    
    if (funnelCreated || sessionStorage.getItem('onboardingComplete') === 'true') {
      // Funnel already created or user clicked skip, go to dashboard
      appStore.showSuccess('初始化完成！', '您已成功完成所有设置，开始使用 Pathfinder 吧！')
      
      // Clean up all session storage
      sessionStorage.removeItem('onboardingReturnComplete')
      sessionStorage.removeItem('onboardingTemplate')
      sessionStorage.removeItem('onboardingOrgData')
      sessionStorage.removeItem('onboardingReturn')
      sessionStorage.removeItem('funnelTemplate')
      sessionStorage.removeItem('onboardingComplete')
      sessionStorage.removeItem('onboardingStepOverride')
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/dashboard')
    } else if (templateSelectionRef.value && templateSelectionRef.value.selectedTemplate && !funnelCreated) {
      // Template selected but not created yet, navigate to builder
      // Only do this if we haven't already created a funnel
      await templateSelectionRef.value.handleNext()
    } else {
      // No template selected, go directly to dashboard
      appStore.showSuccess('欢迎使用 Pathfinder！', '您已成功完成账户设置，可以开始创建漏斗了')
      
      // Clean up session storage
      sessionStorage.removeItem('onboardingOrgData')
      sessionStorage.removeItem('onboardingTemplate')
      sessionStorage.removeItem('onboardingComplete')
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      router.push('/dashboard')
    }
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

const navigateToFunnels = () => {
  router.push('/funnels')
}

// Guard against non-authenticated users
// Clear any stale onboarding data BEFORE mounting - this runs synchronously before child components mount
const clearStaleOnboardingData = () => {
  const returnComplete = sessionStorage.getItem('onboardingReturnComplete')
  const savedTemplate = sessionStorage.getItem('onboardingTemplate')
  
  // If this is NOT a valid return (missing either flag or template), clear everything
  if (!(returnComplete === 'true' && savedTemplate)) {
    console.log('🧹 Clearing stale onboarding data before mount')
    sessionStorage.removeItem('onboardingOrgData')
    sessionStorage.removeItem('onboardingTemplate')
    sessionStorage.removeItem('onboardingReturnComplete')
    sessionStorage.removeItem('onboardingReturn')
    sessionStorage.removeItem('funnelTemplate')
    sessionStorage.removeItem('onboardingComplete')
    sessionStorage.removeItem('onboardingStepOverride') // Critical to clear this!
  }
}

// Call this immediately when component is created, before onMounted
clearStaleOnboardingData()

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  
  // Check if returning from funnel builder
  const returnComplete = sessionStorage.getItem('onboardingReturnComplete')
  const savedTemplate = sessionStorage.getItem('onboardingTemplate')
  const savedOrgData = sessionStorage.getItem('onboardingOrgData')
  
  console.log('📍 Onboarding.vue onMounted - checking return state:', {
    returnComplete,
    savedTemplate,
    hasOrgData: !!savedOrgData
  })
  
  // Only consider it a return if we have both the return flag AND saved template
  // This prevents new users from accidentally being treated as returning users
  if (returnComplete === 'true' && savedTemplate) {
    console.log('📍 Returning from funnel builder, restoring state...')
    
    // Restore organization data if saved
    if (savedOrgData) {
      try {
        const orgData = JSON.parse(savedOrgData)
        formData.organization = orgData
        console.log('✅ Restored organization data:', orgData)
      } catch (e) {
        console.error('Failed to parse saved org data:', e)
      }
    }
    
    // Restore template selection
    formData.selectedTemplate = savedTemplate
    console.log('✅ Restored template selection:', savedTemplate)
    
    // Wait for form to be ready
    await nextTick()
    
    console.log('📍 Setting step override to 2 (template selection)')
    // Set step override for MultiStepForm to pick up
    sessionStorage.setItem('onboardingStepOverride', '2')
    
    // Also try direct navigation
    if (multiStepForm.value) {
      setTimeout(() => {
        multiStepForm.value.goToStep(2)
        console.log('✅ Jumped to template selection step')
      }, 100)
    }
    
    console.log('📍 Onboarding return flow complete - staying on onboarding page')
    // Don't clear the data since we're returning
    return
  }
  
  // For fresh starts, ensure form is reset
  console.log('🧹 Resetting form for fresh start')
  await nextTick() // Wait for refs to be available
  
  if (multiStepForm.value) {
    multiStepForm.value.resetFormData()
  }
  
  // Reset the reactive form data explicitly
  formData.organization = {
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  }
  
  formData.selectedTemplate = ''
  
  // Also reset the org form validation state
  isOrgFormValid.value = false
  
  console.log('🧹 Onboarding form data reset complete:', JSON.stringify(formData.organization))
})
</script>