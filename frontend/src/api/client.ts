import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@stores/auth'
import { useAppStore } from '@stores/app'
import type { ApiResponse } from '@/types/user'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
      console.log('🔐 Request with auth token:', {
        url: config.url,
        method: config.method,
        token: authStore.token.slice(0, 10) + '...',
        data: config.method?.toUpperCase() === 'PUT' ? JSON.stringify(config.data, null, 2) : config.data
      })
    } else {
      console.log('⚠️ Request without auth token:', {
        url: config.url,
        method: config.method,
        data: config.method?.toUpperCase() === 'PUT' ? JSON.stringify(config.data, null, 2) : config.data
      })
    }

    // 禁用缓存，确保获取最新数据
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    config.headers['Pragma'] = 'no-cache'
    config.headers['Expires'] = '0'
    
    // 为GET请求添加时间戳
    if (config.method?.toLowerCase() === 'get') {
      config.params = config.params || {}
      config.params._t = Date.now()
    }

    // Update last activity for authenticated requests
    if (authStore.isAuthenticated) {
      authStore.updateLastActivity()
    }

    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ Response success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    })
    return response
  },
  async (error: AxiosError) => {
    const authStore = useAuthStore()
    const appStore = useAppStore()
    
    // Handle network errors
    if (!error.response) {
      console.error('❌ Network error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      })
      // Let page-level error handling deal with network errors
      return Promise.reject(error)
    }
    
    console.error('❌ Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    })

    const { status, data } = error.response
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshed = await authStore.refreshAccessToken()
        
        if (refreshed && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${authStore.token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        await authStore.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Let page-level error handling deal with HTTP errors
    // This allows for more specific and localized error messages
    // instead of generic global notifications

    return Promise.reject(error)
  }
)

// API helper functions
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.get(url, config)
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, data, config)
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.put(url, data, config)
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.patch(url, data, config)
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.delete(url, config)
  },

  // Upload file with progress
  upload: async <T = any>(
    url: string, 
    formData: FormData, 
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<AxiosResponse<ApiResponse<T>>> => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
  },

  // Download file
  download: async (url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> => {
    const response = await apiClient.get(url, {
      ...config,
      responseType: 'blob',
    })

    // Create blob URL and download
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  },

  // Get request config with auth headers
  getConfig: (): AxiosRequestConfig => {
    const authStore = useAuthStore()
    return {
      headers: {
        Authorization: authStore.token ? `Bearer ${authStore.token}` : undefined,
      },
    }
  },
}

// Export client alias for backward compatibility
export const client = apiClient

export default apiClient