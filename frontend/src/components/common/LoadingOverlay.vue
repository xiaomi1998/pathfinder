<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
        <div class="flex items-center space-x-4">
          <LoadingSpinner size="large" />
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p v-if="message" class="text-sm text-gray-500 dark:text-gray-400">
              {{ message }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'

interface Props {
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  title: '加载中...'
})
</script>