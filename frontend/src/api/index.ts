// Export all API modules
export { default as apiClient, api } from './client'
export { authAPI } from './auth'
export { funnelAPI } from './funnel'
export { aiApi, aiHelpers } from './ai'

// Re-export common types
export type { AxiosResponse, AxiosError } from 'axios'