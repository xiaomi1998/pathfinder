// Export all API modules
export { default as apiClient, api } from './client'
export { authAPI } from './auth'
export { funnelAPI } from './funnel'
export { aiApi, aiHelpers } from './ai'
export { metricDatasetAPI } from './metricDataset'
export { metricsAPI } from './metrics'
export { analyticsAPI } from './analytics'
export { dashboardAPI } from './dashboard'

// Re-export common types
export type { AxiosResponse, AxiosError } from 'axios'