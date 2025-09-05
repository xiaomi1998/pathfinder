<template>
  <div v-if="show" class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
    <div class="flex">
      <div class="flex-shrink-0">
        <ExclamationCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 v-if="title" class="text-sm font-medium text-red-800 dark:text-red-300">
          {{ title }}
        </h3>
        <div v-if="message" class="mt-2 text-sm text-red-700 dark:text-red-400">
          <p>{{ message }}</p>
        </div>
        <div v-if="details" class="mt-2">
          <details class="text-sm">
            <summary class="text-red-700 dark:text-red-400 cursor-pointer">
              显示详情
            </summary>
            <pre class="mt-2 text-xs text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-auto">{{ details }}</pre>
          </details>
        </div>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex bg-red-50 dark:bg-red-900/20 rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
            @click="$emit('dismiss')"
          >
            <span class="sr-only">关闭</span>
            <XMarkIcon class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'

interface Props {
  show?: boolean
  title?: string
  message?: string
  details?: string
  dismissible?: boolean
}

withDefaults(defineProps<Props>(), {
  show: true,
  dismissible: true
})

defineEmits<{
  dismiss: []
}>()
</script>