import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false)
  const isDarkMode = ref(false)
  const sidebarCollapsed = ref(false)
  const notifications = ref<Notification[]>([])
  const currentTheme = ref<'light' | 'dark' | 'auto'>('auto')

  // Getters
  const hasNotifications = computed(() => notifications.value.length > 0)
  const unreadNotificationCount = computed(() => 
    notifications.value.filter(n => !n.persistent).length
  )

  // Actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    updateTheme()
  }

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    currentTheme.value = theme
    updateTheme()
  }

  const updateTheme = () => {
    const root = document.documentElement
    
    if (currentTheme.value === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
    }
    
    if (isDarkMode.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Save to localStorage
    localStorage.setItem('theme', currentTheme.value)
    localStorage.setItem('darkMode', isDarkMode.value.toString())
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value.toString())
  }

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('sidebarCollapsed', collapsed.toString())
  }

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    }
    
    notifications.value.push(newNotification)
    
    // Auto remove notification after duration
    if (!newNotification.persistent && newNotification.duration! > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const showSuccess = (title: string, message?: string) => {
    return addNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    return addNotification({ 
      type: 'error', 
      title, 
      message, 
      duration: 8000 
    })
  }

  const showWarning = (title: string, message?: string) => {
    return addNotification({ 
      type: 'warning', 
      title, 
      message, 
      duration: 6000 
    })
  }

  const showInfo = (title: string, message?: string) => {
    return addNotification({ type: 'info', title, message })
  }

  const initializeApp = () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' || 'auto'
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    const savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true'
    
    currentTheme.value = savedTheme
    isDarkMode.value = savedDarkMode
    sidebarCollapsed.value = savedSidebarState
    
    updateTheme()
    
    // Listen for system theme changes
    if (currentTheme.value === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)
    }
  }

  return {
    // State
    isLoading,
    isDarkMode,
    sidebarCollapsed,
    notifications,
    currentTheme,
    
    // Getters
    hasNotifications,
    unreadNotificationCount,
    
    // Actions
    setLoading,
    toggleDarkMode,
    setTheme,
    updateTheme,
    toggleSidebar,
    setSidebarCollapsed,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    initializeApp
  }
})