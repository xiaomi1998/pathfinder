<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div 
      class="animate-spin rounded-full border-b-2 border-primary-600"
      :class="spinnerClass"
    >
    </div>
    <span v-if="text" class="ml-3 text-gray-600 dark:text-gray-400">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  overlay: false
})

const containerClass = computed(() => ({
  'fixed inset-0 bg-black bg-opacity-50 z-50': props.overlay,
  'inline-flex': !props.overlay
}))

const spinnerClass = computed(() => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }
  
  return sizeClasses[props.size]
})
</script>