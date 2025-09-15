<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-10 justify-between items-center">
        <!-- Logo and Title -->
        <div class="flex items-center">
          <router-link
            to="/"
            class="flex items-center space-x-3 text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">P</span>
            </div>
            <span>Pathfinder</span>
          </router-link>
        </div>

        <!-- No navigation for non-authenticated users - they should only see login/register -->

        <!-- Right side actions -->
        <div class="flex items-center space-x-4">
          <!-- Theme Toggle -->
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
            @click="toggleDarkMode"
          >
            <span class="sr-only">Toggle theme</span>
            <SunIcon v-if="isDarkMode" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
          </button>

          <!-- Login/Register buttons for non-authenticated users -->
          <div class="flex items-center space-x-4">
            <router-link
              to="/login"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              登录
            </router-link>
            <router-link
              to="/register"
              class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              注册
            </router-link>
          </div>

        </div>
      </div>

    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChartBarIcon,
  HomeIcon,
  MoonIcon,
  PresentationChartLineIcon,
  SunIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isDarkMode = computed(() => appStore.isDarkMode)

// Actions
const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}
</script>