<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900">选择对话场景</h3>
      <div v-if="selectedContext" class="text-sm text-gray-500">
        当前场景: {{ getContextLabel(selectedContext) }}
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div
        v-for="option in contextOptions"
        :key="option.value"
        :class="[
          'relative cursor-pointer rounded-lg border p-4 transition-all duration-200',
          selectedContext === option.value
            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-20'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        ]"
        @click="handleContextSelect(option.value)"
      >
        <div class="flex items-start space-x-3">
          <div :class="[
            'mt-0.5 h-6 w-6 flex-shrink-0 rounded-full p-1',
            selectedContext === option.value 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'bg-gray-100 text-gray-500'
          ]">
            <component 
              :is="getIconComponent(option.icon)"
              class="h-4 w-4" 
              aria-hidden="true" 
            />
          </div>
          
          <div class="min-w-0 flex-1">
            <div :class="[
              'text-sm font-medium',
              selectedContext === option.value ? 'text-indigo-900' : 'text-gray-900'
            ]">
              {{ option.label }}
            </div>
            <div :class="[
              'mt-1 text-xs',
              selectedContext === option.value ? 'text-indigo-700' : 'text-gray-500'
            ]">
              {{ option.description }}
            </div>
          </div>
        </div>

        <!-- Selection indicator -->
        <div v-if="selectedContext === option.value" class="absolute -inset-px rounded-lg border-2 border-indigo-500 pointer-events-none" />
      </div>
    </div>

    <!-- Quick action buttons -->
    <div class="flex flex-wrap gap-2 pt-2">
      <button
        v-for="option in contextOptions"
        :key="`quick-${option.value}`"
        type="button"
        :class="[
          'inline-flex items-center gap-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
          selectedContext === option.value
            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        ]"
        @click="handleContextSelect(option.value)"
      >
        <component 
          :is="getIconComponent(option.icon)"
          class="-ml-0.5 h-4 w-4" 
          aria-hidden="true" 
        />
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

interface ContextOption {
  value: 'invitation' | 'objection_handling' | 'general'
  label: string
  description: string
  icon: string
}

interface Props {
  selectedContext?: 'invitation' | 'objection_handling' | 'general'
  disabled?: boolean
}

interface Emits {
  (event: 'context-selected', value: 'invitation' | 'objection_handling' | 'general'): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedContext: 'general' as const,
  disabled: false
})

const emit = defineEmits<Emits>()

const contextOptions: ContextOption[] = [
  {
    value: 'general',
    label: '通用对话',
    description: '日常AI助手对话，获得各种帮助和建议',
    icon: 'ChatBubbleLeftRightIcon'
  },
  {
    value: 'invitation',
    label: '邀约练习',
    description: '练习客户邀约技巧，提升邀约成功率',
    icon: 'UserGroupIcon'
  },
  {
    value: 'objection_handling',
    label: '异议处理',
    description: '学习处理客户异议，提高转化效果',
    icon: 'ExclamationTriangleIcon'
  }
]

const iconComponents = {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
}

const getIconComponent = (iconName: string) => {
  return iconComponents[iconName as keyof typeof iconComponents] || ChatBubbleLeftRightIcon
}

const getContextLabel = (context: 'invitation' | 'objection_handling' | 'general'): string => {
  const option = contextOptions.find(opt => opt.value === context)
  return option?.label || context
}

const handleContextSelect = (context: 'invitation' | 'objection_handling' | 'general') => {
  if (!props.disabled) {
    emit('context-selected', context)
  }
}
</script>