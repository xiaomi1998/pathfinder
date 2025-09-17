// Navigation Debug Utility
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

export function debugNavigation() {
  const authStore = useAuthStore()
  const routerInstance = router

  const debug = {
    // Check authentication status
    checkAuth: () => {
      console.group('🔐 Authentication Debug')
      console.log('isAuthenticated:', authStore.isAuthenticated)
      console.log('token:', authStore.token ? 'Present' : 'Not present')
      console.log('user:', authStore.user)
      console.log('localStorage token:', localStorage.getItem('accessToken'))
      console.groupEnd()
    },

    // Check router status
    checkRouter: () => {
      console.group('🧭 Router Debug')
      try {
        if (routerInstance && routerInstance.currentRoute) {
          console.log('current route:', routerInstance.currentRoute.value)
          console.log('router ready:', routerInstance.isReady())
        } else {
          console.warn('Router instance not available or not initialized')
          console.log('Available router methods:', Object.keys(routerInstance || {}))
        }
      } catch (error) {
        console.error('Router access error:', error)
      }
      console.groupEnd()
    },

    // Test navigation to data entry
    testNavigation: async () => {
      console.group('🔍 Navigation Test')
      
      try {
        if (!routerInstance) {
          throw new Error('Router instance not available')
        }
        
        console.log('Attempting navigation to /metrics/entry...')
        await routerInstance.push('/metrics/entry')
        console.log('Navigation successful')
        
        if (routerInstance.currentRoute) {
          console.log('New route:', routerInstance.currentRoute.value.path)
        }
      } catch (error) {
        console.error('Navigation failed:', error)
      }
      
      console.groupEnd()
    },

    // Initialize auth manually
    initAuth: () => {
      console.group('🚀 Manual Auth Init')
      try {
        authStore.initializeAuth()
        console.log('Auth initialization triggered')
        setTimeout(() => {
          console.log('Auth status after init:', authStore.isAuthenticated)
        }, 1000)
      } catch (error) {
        console.error('Auth init failed:', error)
      }
      console.groupEnd()
    },

    // Full debug report
    fullReport: () => {
      debug.checkAuth()
      debug.checkRouter()
    },

    // Get router info
    getRouterInfo: () => {
      console.group('📍 Router Information')
      console.log('Router instance:', routerInstance)
      console.log('Router type:', typeof routerInstance)
      console.log('Is router ready:', routerInstance?.isReady ? 'Available' : 'Not available')
      console.log('Current route available:', routerInstance?.currentRoute ? 'Yes' : 'No')
      console.groupEnd()
    }
  }

  // Make it available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).navDebug = debug
  }

  return debug
}