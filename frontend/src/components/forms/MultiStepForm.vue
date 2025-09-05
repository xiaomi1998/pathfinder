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
              :disabled="isLoading || (currentStepData.requiresValidation && !isCurrentStepValid)"
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

// Methods
const goNext = async () => {
  // Validate current step if required
  if (currentStepData.value.requiresValidation) {
    isLoading.value = true
    try {
      const isValid = await emit('validate-step', currentStep.value)
      if (!isValid) {
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
    emit('complete', data.value)
  } else {
    // Go to next step
    currentStep.value++
    emit('step-change', currentStep.value, currentStepData.value)
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
        data: data.value
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
        if (parsed.data) {
          data.value = { ...data.value, ...parsed.data }
        }
        if (typeof parsed.currentStep === 'number') {
          currentStep.value = Math.max(0, Math.min(parsed.currentStep, props.steps.length - 1))
        }
      }
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error)
    }
  }
}

const clearPersistedData = () => {
  if (props.persistDataKey && typeof localStorage !== 'undefined') {
    localStorage.removeItem(props.persistDataKey)
  }
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
  currentStep: computed(() => currentStep.value),
  currentStepData,
  data: computed(() => data.value)
})
</script>

<style scoped>
/* Additional styling can be added here if needed */
</style>