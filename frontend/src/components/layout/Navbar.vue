<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 justify-between items-center">
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

        <!-- Desktop Navigation -->
        <nav v-if="isAuthenticated" class="hidden md:flex items-center space-x-8">
          <router-link
            to="/dashboard"
            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-primary-600 dark:text-primary-400': $route.name === 'dashboard' }"
          >
            仪表板
          </router-link>
          <router-link
            to="/funnels"
            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="{ 'text-primary-600 dark:text-primary-400': $route.path.startsWith('/funnels') }"
          >
            漏斗
          </router-link>
          <router-link
            to="/ai"
            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            :class="{ 'text-primary-600 dark:text-primary-400': $route.name === 'ai-coach' }"
          >
            <CpuChipIcon class="h-4 w-4" />
            AI陪练
          </router-link>
        </nav>

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

          <!-- Notifications -->
          <button
            v-if="isAuthenticated"
            type="button"
            class="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
          >
            <span class="sr-only">View notifications</span>
            <BellIcon class="h-5 w-5" />
            <span
              v-if="unreadNotificationCount > 0"
              class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            >
              {{ unreadNotificationCount > 9 ? '9+' : unreadNotificationCount }}
            </span>
          </button>

          <!-- User Menu -->
          <Menu v-if="isAuthenticated" as="div" class="relative ml-3">
            <div>
              <MenuButton class="flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                <span class="sr-only">Open user menu</span>
                <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ userInitials }}
                  </span>
                </div>
              </MenuButton>
            </div>
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <MenuItem v-slot="{ active }">
                  <router-link
                    to="/profile"
                    :class="[
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    您的资料
                  </router-link>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    to="/settings"
                    :class="[
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    设置
                  </router-link>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    :class="[
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                    ]"
                    @click="handleLogout"
                  >
                    退出登录
                  </button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>

          <!-- Login/Register buttons -->
          <div v-else class="flex items-center space-x-4">
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
              开始使用
            </router-link>
          </div>

          <!-- Mobile menu button -->
          <button
            v-if="isAuthenticated"
            type="button"
            class="md:hidden p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-md transition-colors"
            @click="toggleMobileMenu"
          >
            <span class="sr-only">Open main menu</span>
            <Bars3Icon v-if="!mobileMenuOpen" class="h-6 w-6" />
            <XMarkIcon v-else class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="isAuthenticated && mobileMenuOpen" class="md:hidden">
        <div class="space-y-1 px-2 pb-3 pt-2 sm:px-3">
          <router-link
            to="/dashboard"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            :class="{ 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20': $route.name === 'dashboard' }"
            @click="mobileMenuOpen = false"
          >
            仪表板
          </router-link>
          <router-link
            to="/funnels"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            :class="{ 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20': $route.path.startsWith('/funnels') }"
            @click="mobileMenuOpen = false"
          >
            漏斗
          </router-link>
          <router-link
            to="/ai"
            class="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            :class="{ 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20': $route.name === 'ai-coach' }"
            @click="mobileMenuOpen = false"
          >
            <CpuChipIcon class="h-5 w-5" />
            AI陪练
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  Bars3Icon,
  BellIcon,
  CpuChipIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const mobileMenuOpen = ref(false)

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isDarkMode = computed(() => appStore.isDarkMode)
const unreadNotificationCount = computed(() => appStore.unreadNotificationCount)
const userInitials = computed(() => {
  if (!authStore.user) return '?'
  const name = authStore.user.name || authStore.user.email
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
})

// Actions
const toggleDarkMode = () => {
  appStore.toggleDarkMode()
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/')
    appStore.showSuccess('成功退出登录')
  } catch (error) {
    console.error('Logout error:', error)
    appStore.showError('退出登录失败')
  }
}
</script>