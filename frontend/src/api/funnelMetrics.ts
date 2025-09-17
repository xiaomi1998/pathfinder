import { api } from './client'

export interface FunnelMetricsData {
  periodType: 'weekly' | 'monthly'
  periodStartDate: string
  periodEndDate?: string
  totalEntries?: number
  totalConversions?: number
  overallConversionRate?: number
  totalRevenue?: number
  totalCost?: number
  roi?: number
  avgTimeSpent?: number
  bounceRate?: number
  notes?: string
  customMetrics?: {
    stageData?: Record<string, number>
    [key: string]: any
  }
}

export interface NodeMetricsData {
  nodeId: string
  periodType: 'weekly' | 'monthly'
  periodStartDate: string
  periodEndDate?: string
  entries: number
  conversions: number
  conversionRate: number
  avgTimeSpent?: number
  bounceRate?: number
  revenue?: number
  cost?: number
  customMetrics?: Record<string, any>
  notes?: string
}

export interface BatchNodeMetricsData {
  nodeMetrics: NodeMetricsData[]
}

/**
 * Funnel Metrics API client
 */
export const funnelMetricsAPI = {
  /**
   * Health check
   */
  healthCheck: () => {
    return api.get('/funnel-metrics/health')
  },

  /**
   * Generate data entry template for a funnel
   */
  generateTemplate: (funnelId: string, periodType: 'weekly' | 'monthly', periodStartDate: Date) => {
    const params = new URLSearchParams()
    params.append('periodType', periodType)
    params.append('periodStartDate', periodStartDate.toISOString())
    
    return api.get(`/funnel-metrics/funnels/${funnelId}/template?${params.toString()}`)
  },

  /**
   * Create funnel metrics
   */
  createFunnelMetrics: (funnelId: string, data: FunnelMetricsData) => {
    return api.post(`/funnel-metrics/funnels/${funnelId}/metrics`, data)
  },

  /**
   * Create node metrics
   */
  createNodeMetrics: (nodeId: string, data: NodeMetricsData) => {
    return api.post(`/funnel-metrics/nodes/${nodeId}/metrics`, data)
  },

  /**
   * Batch create node metrics
   */
  batchCreateNodeMetrics: (data: BatchNodeMetricsData) => {
    return api.post('/funnel-metrics/nodes/metrics/batch', data)
  },

  /**
   * Get funnel analytics
   */
  getFunnelAnalytics: (funnelId: string, options?: {
    periodType?: 'weekly' | 'monthly'
    startDate?: Date
    endDate?: Date
    includeComparison?: boolean
  }) => {
    const params = new URLSearchParams()
    
    if (options?.periodType) {
      params.append('periodType', options.periodType)
    }
    
    if (options?.startDate) {
      params.append('startDate', options.startDate.toISOString())
    }
    
    if (options?.endDate) {
      params.append('endDate', options.endDate.toISOString())
    }
    
    if (options?.includeComparison) {
      params.append('includeComparison', 'true')
    }
    
    return api.get(`/funnel-metrics/funnels/${funnelId}/analytics?${params.toString()}`)
  },

  /**
   * Get funnel metrics list
   */
  getFunnelMetricsList: (funnelId: string, options?: {
    limit?: number
    offset?: number
    periodType?: 'weekly' | 'monthly'
    startDate?: Date
    endDate?: Date
  }) => {
    const params = new URLSearchParams()
    
    if (options?.limit) {
      params.append('limit', options.limit.toString())
    }
    
    if (options?.offset) {
      params.append('offset', options.offset.toString())
    }
    
    if (options?.periodType) {
      params.append('periodType', options.periodType)
    }
    
    if (options?.startDate) {
      params.append('startDate', options.startDate.toISOString())
    }
    
    if (options?.endDate) {
      params.append('endDate', options.endDate.toISOString())
    }
    
    return api.get(`/funnel-metrics/funnels/${funnelId}/metrics?${params.toString()}`)
  },

  /**
   * Get funnel metrics by ID
   */
  getFunnelMetricsById: (funnelId: string, metricsId: string) => {
    return api.get(`/funnel-metrics/funnels/${funnelId}/metrics/${metricsId}`)
  },

  /**
   * Update funnel metrics
   */
  updateFunnelMetrics: (funnelId: string, metricsId: string, data: Partial<FunnelMetricsData>) => {
    return api.put(`/funnel-metrics/funnels/${funnelId}/metrics/${metricsId}`, data)
  },

  /**
   * Delete funnel metrics
   */
  deleteFunnelMetrics: (funnelId: string, metricsId: string) => {
    return api.delete(`/funnel-metrics/funnels/${funnelId}/metrics/${metricsId}`)
  }
}

export default funnelMetricsAPI