import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'
import type { LoginCredentials, RegisterCredentials } from '@/types/user'

export function useAuth() {
  const router = useRouter()
  const authStore = useAuthStore()
  const appStore = useAppStore()
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const userRole = computed(() => authStore.userRole)
  const isAdmin = computed(() => authStore.isAdmin)

  // Actions
  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authStore.login(credentials)
      
      if (result.success) {
        appStore.showSuccess('Welcome back!', 'You have successfully signed in.')
        return { success: true, user: result.user }
      } else {
        error.value = result.message || 'Login failed'
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authStore.register(credentials)
      
      if (result.success) {
        appStore.showSuccess('Account created!', 'Welcome to Pathfinder!')
        return { success: true, user: result.user }
      } else {
        error.value = result.message || 'Registration failed'
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      await authStore.logout()
      router.push('/')
      appStore.showSuccess('Signed out successfully')
    } catch (err: any) {
      console.error('Logout error:', err)
      appStore.showError('Failed to sign out', err.message)
    }
  }

  const updateProfile = async (profileData: any) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authStore.updateProfile(profileData)
      
      if (result.success) {
        appStore.showSuccess('Profile updated', 'Your profile has been updated successfully.')
        return { success: true, user: result.user }
      } else {
        error.value = result.message || 'Profile update failed'
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true
      error.value = null
      
      const result = await authStore.changePassword(currentPassword, newPassword)
      
      if (result.success) {
        appStore.showSuccess('Password changed', 'Your password has been updated successfully.')
        return { success: true }
      } else {
        error.value = result.message || 'Password change failed'
        return { success: false, message: result.message }
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred'
      return { success: false, message: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const hasPermission = (permission: string) => {
    return authStore.hasPermission(permission)
  }

  const hasPermissions = (permissions: string[]) => {
    return authStore.hasPermissions(permissions)
  }

  const hasAnyPermission = (permissions: string[]) => {
    return authStore.hasAnyPermission(permissions)
  }

  const requireAuth = () => {
    if (!isAuthenticated.value) {
      router.push('/login')
      return false
    }
    return true
  }

  const requirePermission = (permission: string) => {
    if (!requireAuth()) return false
    
    if (!hasPermission(permission)) {
      appStore.showError('Access denied', 'You do not have permission to perform this action.')
      router.push('/dashboard')
      return false
    }
    return true
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    user,
    userRole,
    isAdmin,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    requireAuth,
    requirePermission,
    clearError
  }
}