<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Bar -->
    <Navbar />
    
    <!-- Main Content -->
    <main class="flex-1">
      <router-view v-slot="{ Component, route }">
        <Suspense>
          <template #default>
            <Transition 
              :name="(route.meta?.transition as string) || 'fade'"
              mode="out-in"
            >
              <component :is="Component" :key="route.path" />
            </Transition>
          </template>
          <template #fallback>
            <div class="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="large" />
            </div>
          </template>
        </Suspense>
      </router-view>
    </main>
    
    <!-- Global Notifications -->
    <NotificationContainer />
    
    <!-- Loading Overlay -->
    <LoadingOverlay v-if="isGlobalLoading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@stores/app'
import Navbar from '@components/layout/Navbar.vue'
import NotificationContainer from '@components/common/NotificationContainer.vue'
import LoadingOverlay from '@components/common/LoadingOverlay.vue'

const appStore = useAppStore()

// Computed properties
const isGlobalLoading = computed(() => appStore.isLoading)

// Initialize app
appStore.initializeApp()
</script>

<style scoped>
/* Route transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>