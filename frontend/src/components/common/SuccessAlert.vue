<template>
  <div v-if="show" class="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
    <div class="flex">
      <div class="flex-shrink-0">
        <CheckCircleIcon class="h-5 w-5 text-green-400" aria-hidden="true" />
      </div>
      <div class="ml-3">
        <h3 v-if="title" class="text-sm font-medium text-green-800 dark:text-green-300">
          {{ title }}
        </h3>
        <div v-if="message" class="mt-2 text-sm text-green-700 dark:text-green-400">
          <p>{{ message }}</p>
        </div>
      </div>
      <div v-if="dismissible" class="ml-auto pl-3">
        <div class="-mx-1.5 -my-1.5">
          <button
            type="button"
            class="inline-flex bg-green-50 dark:bg-green-900/20 rounded-md p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
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
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'

interface Props {
  show?: boolean
  title?: string
  message?: string
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