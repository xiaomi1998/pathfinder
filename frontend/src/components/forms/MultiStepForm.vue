<template>
  <div class="max-w-4xl mx-auto">
    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          步骤 {{ currentStep + 1 }} / {{ steps.length }}
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div 
          class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
        ></div>
      </div>
      
      <!-- Step Indicators -->
      <div class="flex justify-between">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="flex flex-col items-center"
        >
          <div
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
              index <= currentStep
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            ]"
          >
            <CheckIcon v-if="index < currentStep" class="w-5 h-5" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div
            :class="[
              'mt-2 text-xs text-center max-w-24 transition-colors duration-200',
              index <= currentStep
                ? 'text-primary-600 dark:text-primary-400 font-medium'
                : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ step.title }}
          </div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="p-6 sm:p-8">
        <!-- Step Description -->
        <div v-if="currentStepData.description" class="mb-6">
          <p class="text-gray-600 dark:text-gray-300">{{ currentStepData.description }}</p>
        </div>

        <!-- Step Content Slot -->
        <div class="mb-8">
          <slot :step="currentStepData" :step-index="currentStep" :data="data" />
        </div>

        <!-- Button Status Information -->
        <div class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 步骤状态
          </h4>
          <div class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div>当前步骤: {{ currentStepData.title }} ({{ currentStep + 1 }}/{{ steps.length }})</div>
            <div class="flex items-center">
              <span>继续按钮: </span>
              <span :class="canProceed ? 'text-green-600 dark:text-green-400 font-bold ml-1' : 'text-red-600 dark:text-red-400 font-bold ml-1'">
                {{ canProceed ? '✅ 可用' : '❌ 已禁用' }}
              </span>
              <span v-if="!canProceed && currentStepData.requiresValidation" class="text-gray-600 dark:text-gray-400 ml-2">
                - {{ isCurrentStepValid ? '加载中...' : '需要完成表单验证' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between items-center">
          <button
            v-if="currentStep > 0 && !hideBackButton"
            type="button"
            @click="goBack"
            :disabled="isLoading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon class="mr-2 -ml-1 h-4 w-4" />
            上一步
          </button>
          <div v-else></div>

          <div class="flex space-x-3">
            <!-- Skip Button (if allowed) -->
            <button
              v-if="currentStepData.canSkip && currentStep < steps.length - 1"
              type="button"
              @click="skip"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              跳过
            </button>

            <!-- Next/Finish Button -->
            <button
              type="button"
              @click="goNext"
              :disabled="!canProceed"
              :key="`btn-${currentStep}-${forceUpdate}`"
              class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <LoadingSpinner v-if="isLoading" size="small" class="mr-2" />
              {{ currentStep === steps.length - 1 ? finishButtonText : nextButtonText }}
              <ChevronRightIcon v-if="!isLoading && currentStep < steps.length - 1" class="ml-2 -mr-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Persistent Data Storage Indicator (Development only) -->
    <div v-if="isDevelopment && showDataIndicator" class="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
      数据自动保存到本地存储
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/vue/24/outline'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'

// Props
interface Step {
  id: string
  title: string
  description?: string
  canSkip?: boolean
  requiresValidation?: boolean
  component?: string
}

interface Props {
  steps: Step[]
  title?: string
  nextButtonText?: string
  finishButtonText?: string
  hideBackButton?: boolean
  showDataIndicator?: boolean
  persistDataKey?: string
  modelValue?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  title: '设置向导',
  nextButtonText: '下一步',
  finishButtonText: '完成',
  hideBackButton: false,
  showDataIndicator: true,
  persistDataKey: 'multi-step-form-data'
})

// Emits
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'step-change', stepIndex: number, stepData: Step): void
  (e: 'skip', stepIndex: number, stepData: Step): void
  (e: 'complete', data: Record<string, any>): void
  (e: 'validate-step', stepIndex: number): Promise<boolean> | boolean
  (e: 'validation-change', stepIndex: number, isValid: boolean): void
}

const emit = defineEmits<Emits>()

// State
const currentStep = ref(0)
const data = ref<Record<string, any>>(props.modelValue || {})
const isLoading = ref(false)
const isCurrentStepValid = ref(true)

// Computed
const currentStepData = computed(() => props.steps[currentStep.value] || {})
const isDevelopment = computed(() => import.meta.env.DEV)

// Simple computed for button state with force update trigger
const forceUpdate = ref(0)

const canProceed = computed(() => {
  // Force reactivity by accessing this reactive ref
  forceUpdate.value
  
  // If loading, disable button
  if (isLoading.value) return false
  
  // If current step requires validation, check if it's valid
  if (currentStepData.value.requiresValidation) {
    const result = isCurrentStepValid.value
    console.log('🔘 MultiStepForm canProceed check:', {
      requiresValidation: true,
      isCurrentStepValid: result,
      canProceed: result,
      forceUpdateValue: forceUpdate.value
    })
    return result
  }
  
  // No validation required, can proceed
  console.log('🔘 MultiStepForm canProceed check: no validation required')
  return true
})

// Methods
const goNext = async () => {
  console.log('goNext called, current step:', currentStep.value, 'requiresValidation:', currentStepData.value.requiresValidation)
  
  // Validate current step if required
  if (currentStepData.value.requiresValidation) {
    isLoading.value = true
    try {
      // Use the current validation state instead of relying on emit return value
      // Vue 3 emit doesn't return event handler results
      const isValid = isCurrentStepValid.value
      console.log('Step validation in goNext:', isValid, 'from isCurrentStepValid')
      
      // Also emit the validate-step event for any additional validation logic
      emit('validate-step', currentStep.value)
      
      if (!isValid) {
        console.log('Validation failed, not proceeding')
        isLoading.value = false
        return
      }
    } catch (error) {
      console.error('Step validation error:', error)
      isLoading.value = false
      return
    }
  }

  if (currentStep.value === props.steps.length - 1) {
    // Final step - complete the form
    console.log('Completing form with data:', data.value)
    emit('complete', data.value)
  } else {
    // Go to next step
    currentStep.value++
    emit('step-change', currentStep.value, currentStepData.value)
    console.log('Moved to step:', currentStep.value)
  }
  
  isLoading.value = false
}

const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('step-change', currentStep.value, currentStepData.value)
  }
}

const skip = () => {
  if (currentStepData.value.canSkip && currentStep.value < props.steps.length - 1) {
    emit('skip', currentStep.value, currentStepData.value)
    currentStep.value++
    emit('step-change', currentStep.value, currentStepData.value)
  }
}

const goToStep = (stepIndex: number) => {
  if (stepIndex >= 0 && stepIndex < props.steps.length) {
    currentStep.value = stepIndex
    emit('step-change', currentStep.value, currentStepData.value)
  }
}

// Data persistence
const saveData = () => {
  if (props.persistDataKey && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(props.persistDataKey, JSON.stringify({
        currentStep: currentStep.value,
        data: data.value,
        timestamp: Date.now() // Add timestamp for cache expiry
      }))
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error)
    }
  }
}

const loadData = () => {
  if (props.persistDataKey && typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem(props.persistDataKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        
        // Check if data is from the same session (within 1 hour)
        const isStale = parsed.timestamp && (Date.now() - parsed.timestamp > 60 * 60 * 1000)
        
        if (isStale) {
          console.log('Form data is stale, clearing localStorage')
          clearPersistedData()
          return
        }
        
        if (parsed.data) {
          data.value = { ...data.value, ...parsed.data }
        }
        if (typeof parsed.currentStep === 'number') {
          currentStep.value = Math.max(0, Math.min(parsed.currentStep, props.steps.length - 1))
        }
      }
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error)
      // Clear corrupted data
      clearPersistedData()
    }
  }
  
  // Check for step override from sessionStorage (e.g., returning from funnel builder)
  const stepOverride = sessionStorage.getItem('onboardingStepOverride')
  if (stepOverride) {
    const stepIndex = parseInt(stepOverride, 10)
    if (!isNaN(stepIndex) && stepIndex >= 0 && stepIndex < props.steps.length) {
      currentStep.value = stepIndex
      console.log('Step overridden from sessionStorage:', stepIndex)
      sessionStorage.removeItem('onboardingStepOverride')
    }
  }
}

const clearPersistedData = () => {
  if (props.persistDataKey && typeof localStorage !== 'undefined') {
    localStorage.removeItem(props.persistDataKey)
  }
}

const resetFormData = () => {
  console.log('🔄 MultiStepForm resetFormData called')
  
  // Reset current step to first step
  currentStep.value = 0
  
  // Reset data to completely empty object (not props.modelValue which might have cached data)
  data.value = {}
  
  // Clear persisted data
  clearPersistedData()
  
  // Reset validation state
  isCurrentStepValid.value = !currentStepData.value.requiresValidation
  
  // Force DOM update
  forceUpdate.value++
  
  console.log('🔄 MultiStepForm after resetFormData:', {
    currentStep: currentStep.value,
    dataReset: JSON.stringify(data.value),
    isCurrentStepValid: isCurrentStepValid.value,
    canProceed: canProceed.value
  })
  
  // Emit reset event
  emit('update:modelValue', data.value)
  emit('step-change', currentStep.value, currentStepData.value)
}

// Method to update validation status for current step
const updateStepValidation = (isValid: boolean) => {
  console.log('🔄 MultiStepForm updateStepValidation called:', {
    isValid,
    currentStep: currentStep.value,
    stepId: currentStepData.value.id,
    requiresValidation: currentStepData.value.requiresValidation,
    previousValidState: isCurrentStepValid.value
  })
  
  // Update validation state
  isCurrentStepValid.value = isValid
  
  // Force DOM update by triggering computed re-evaluation multiple times
  forceUpdate.value++
  
  // Additional aggressive DOM update methods
  nextTick(() => {
    forceUpdate.value++
    
    // Try to directly update the button state if validation is true
    if (isValid && currentStepData.value.requiresValidation) {
      const button = document.querySelector('button[type="button"]:last-child')
      if (button && button.hasAttribute('disabled')) {
        button.removeAttribute('disabled')
        button.classList.remove('opacity-50', 'cursor-not-allowed')
        console.log('🔧 MultiStepForm: Direct DOM manipulation - enabled button')
      }
    }
    
    // Force another update after a slight delay
    setTimeout(() => {
      forceUpdate.value++
      console.log('🔄 MultiStepForm: Secondary force update triggered')
    }, 10)
  })
  
  emit('validation-change', currentStep.value, isValid)
  
  console.log('🔄 MultiStepForm after updateStepValidation:', {
    isCurrentStepValid: isCurrentStepValid.value,
    canProceed: canProceed.value,
    forceUpdateTriggered: forceUpdate.value
  })
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        if (currentStep.value > 0) goBack()
        break
      case 'ArrowRight':
        event.preventDefault()
        goNext()
        break
    }
  }
}

// Watchers
watch(data, (newData) => {
  emit('update:modelValue', newData)
  saveData()
}, { deep: true })

watch(currentStep, () => {
  saveData()
  // Reset validation state for the new step
  if (currentStepData.value.requiresValidation) {
    isCurrentStepValid.value = false
    console.log('📋 MultiStepForm step changed to:', currentStep.value, 'requires validation, setting isValid to false')
    
    // Add a small delay to allow child components to initialize and emit their validation state
    setTimeout(() => {
      // If validation state hasn't been updated by child component, keep it false
      console.log('📋 MultiStepForm validation state after step change delay:', isCurrentStepValid.value)
    }, 100)
  } else {
    isCurrentStepValid.value = true
    console.log('📋 MultiStepForm step changed to:', currentStep.value, 'no validation required, setting isValid to true')
  }
  
  // Force DOM update
  forceUpdate.value++
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    data.value = { ...data.value, ...newValue }
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadData()
  document.addEventListener('keydown', handleKeydown)
  emit('step-change', currentStep.value, currentStepData.value)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods for parent components
defineExpose({
  goToStep,
  goNext,
  goBack,
  skip,
  clearPersistedData,
  resetFormData,
  updateStepValidation,
  currentStep: computed(() => currentStep.value),
  currentStepData,
  data: computed(() => data.value)
})
</script>

<style scoped>
/* Additional styling can be added here if needed */
</style>