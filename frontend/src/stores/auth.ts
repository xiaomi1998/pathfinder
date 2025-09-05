import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@api/auth'
import type { User, LoginCredentials, RegisterCredentials } from '@/types/user'
import { parseAPIError, type ErrorInfo } from '@/utils/errorHandler'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isLoading = ref(false)
  const lastActivity = ref<Date | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role)
  const userPermissions = computed(() => user.value?.permissions || [])
  const isAdmin = computed(() => userRole.value === 'admin')
  const userName = computed(() => user.value?.name || user.value?.email || '')

  // Actions
  const setUser = (userData: User) => {
    user.value = userData
  }

  const setTokens = (accessToken: string, refresh?: string) => {
    token.value = accessToken
    if (refresh) {
      refreshToken.value = refresh
    }
    
    // Store in localStorage
    localStorage.setItem('accessToken', accessToken)
    if (refresh) {
      localStorage.setItem('refreshToken', refresh)
    }
    
    updateLastActivity()
  }

  const clearTokens = () => {
    token.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  const updateLastActivity = () => {
    lastActivity.value = new Date()
    localStorage.setItem('lastActivity', lastActivity.value.toISOString())
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      isLoading.value = true
      
      const response = await authAPI.login(credentials)
      
      if (response.data.success) {
        const { user: userData, access_token: accessToken, refresh_token: refresh } = response.data.data
        
        setUser(userData)
        setTokens(accessToken, refresh)
        
        return { success: true, user: userData }
      } else {
        throw new Error(response.data.message || '登录失败')
      }
    } catch (error: any) {
      const errorInfo = parseAPIError(error)
      return {
        success: false,
        message: errorInfo.message,
        errorInfo: errorInfo
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      isLoading.value = true
      
      const response = await authAPI.register(credentials)
      
      if (response.data.success) {
        const { user: userData, access_token: accessToken, refresh_token: refresh } = response.data.data
        
        setUser(userData)
        setTokens(accessToken, refresh)
        
        return { success: true, user: userData }
      } else {
        throw new Error(response.data.message || '注册失败')
      }
    } catch (error: any) {
      const errorInfo = parseAPIError(error)
      return {
        success: false,
        message: errorInfo.message,
        errorInfo: errorInfo
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      clearTokens()
      lastActivity.value = null
      localStorage.removeItem('lastActivity')
    }
  }

  const refreshAccessToken = async () => {
    try {
      if (!refreshToken.value) {
        throw new Error('No refresh token available')
      }

      const response = await authAPI.refreshToken(refreshToken.value)
      
      if (response.data.success) {
        const { access_token: accessToken, refresh_token: newRefreshToken } = response.data.data
        setTokens(accessToken, newRefreshToken)
        return true
      } else {
        throw new Error(response.data.message || 'Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      await logout()
      return false
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      isLoading.value = true
      
      const response = await authAPI.updateProfile(profileData)
      
      if (response.data.success && user.value) {
        const updatedUser = { ...user.value, ...response.data.data }
        setUser(updatedUser)
        return { success: true, user: updatedUser }
      } else {
        throw new Error(response.data.message || '资料更新失败')
      }
    } catch (error: any) {
      console.error('Profile update error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || '资料更新失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      isLoading.value = true
      
      const response = await authAPI.changePassword(currentPassword, newPassword)
      
      if (response.data.success) {
        return { success: true }
      } else {
        throw new Error(response.data.message || '密码修改失败')
      }
    } catch (error: any) {
      console.error('Password change error:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || '密码修改失败'
      }
    } finally {
      isLoading.value = false
    }
  }

  const hasPermission = (permission: string) => {
    return userPermissions.value.includes(permission)
  }

  const hasPermissions = (permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission))
  }

  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission))
  }

  const initializeAuth = () => {
    // Load stored tokens
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedActivity = localStorage.getItem('lastActivity')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken
    }
    
    if (storedActivity) {
      lastActivity.value = new Date(storedActivity)
    }

    // Verify token and get user data if authenticated
    if (token.value) {
      getCurrentUser()
    }
  }

  const getCurrentUser = async () => {
    try {
      if (!token.value) return null
      
      const response = await authAPI.getCurrentUser()
      
      if (response.data.success) {
        setUser(response.data.data)
        updateLastActivity()
        return response.data.data
      } else {
        throw new Error('Failed to get user data')
      }
    } catch (error) {
      console.error('Get current user error:', error)
      await logout()
      return null
    }
  }

  return {
    // State
    user,
    token,
    refreshToken,
    isLoading,
    lastActivity,
    
    // Getters
    isAuthenticated,
    userRole,
    userPermissions,
    isAdmin,
    userName,
    
    // Actions
    setUser,
    setTokens,
    clearTokens,
    updateLastActivity,
    login,
    register,
    logout,
    refreshAccessToken,
    updateProfile,
    changePassword,
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    initializeAuth,
    getCurrentUser
  }
})