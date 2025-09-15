<template>
  <!-- App Loading Screen -->
  <div v-if="!isAppInitialized" class="app-loading-screen">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-logo">
        <i class="fas fa-compass"></i>
        <span>Pathfinder</span>
      </div>
      <p class="loading-text">正在初始化应用...</p>
    </div>
  </div>

  <!-- Main App -->
  <div v-else id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar Navigation (only show for authenticated users) -->
    <Sidebar v-if="isAuthenticated" ref="sidebarRef" />
    
    <!-- Top Navbar (only show for non-authenticated users) -->
    <Navbar v-if="!isAuthenticated" />
    
    <!-- Main Content -->
    <main 
      :class="[
        'flex-1 transition-all duration-300',
        isAuthenticated ? 'main-content' : 'pt-1',
        isAuthenticated && sidebarCollapsed ? 'sidebar-collapsed' : ''
      ]"
    >
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
    
    <!-- Global Notifications -->
    <NotificationContainer />
    
    <!-- Loading Overlay -->
    <LoadingOverlay v-if="isGlobalLoading" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppStore } from '@stores/app'
import { useAuthStore } from '@stores/auth'
import Navbar from '@components/layout/Navbar.vue'
import Sidebar from '@components/layout/Sidebar.vue'
import NotificationContainer from '@components/common/NotificationContainer.vue'
import LoadingOverlay from '@components/common/LoadingOverlay.vue'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'

const appStore = useAppStore()
const authStore = useAuthStore()

// Refs
const sidebarRef = ref(null)
const sidebarCollapsed = ref(false)
const isAppInitialized = ref(false)

// Computed properties
const isGlobalLoading = computed(() => appStore.isLoading)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Initialize app
onMounted(async () => {
  try {
    // 并行初始化，避免状态不一致
    await Promise.all([
      appStore.initializeApp(),
      authStore.initializeAuth()
    ])
    
    // 等待下一个tick确保状态稳定
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 监听侧边栏状态变化
    window.addEventListener('sidebar-toggle', (event: any) => {
      sidebarCollapsed.value = event.detail.isCollapsed
    })
    
    // 初始化侧边栏状态
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState === 'true') {
      sidebarCollapsed.value = true
    }
    
    // Add debug utilities in development
    if (import.meta.env.DEV) {
      try {
        const { debugNavigation } = await import('@/utils/navigationDebug')
        const navDebug = debugNavigation()
        
        // Initial debug report
        setTimeout(() => {
          console.log('🎯 Pathfinder Debug Tools Available:')
          console.log('- navDebug.checkAuth() - Check authentication status')
          console.log('- navDebug.checkRouter() - Check router status')
          console.log('- navDebug.testNavigation() - Test navigation to data entry')
          console.log('- navDebug.fullReport() - Full debug report')
          navDebug.fullReport()
        }, 1000)
      } catch (debugError) {
        console.warn('Debug tools not available:', debugError)
      }
    }
    
    console.log('✅ App initialized successfully')
  } catch (error) {
    console.error('❌ App initialization failed:', error)
    // Show a user-friendly error message
    appStore.showError('初始化失败', '应用程序初始化时出现问题，请刷新页面重试')
  } finally {
    // 标记应用已初始化，显示主界面
    isAppInitialized.value = true
  }
})
</script>

<style scoped>
/* App Loading Screen */
.app-loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
  gap: 12px;
}

.loading-logo i {
  font-size: 36px;
}

.loading-text {
  font-size: 16px;
  opacity: 0.9;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.9; }
  50% { opacity: 0.6; }
}

/* Main content layout */
.main-content {
  margin-left: 200px;
  transition: all 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 50px;
}

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