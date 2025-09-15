import { api } from './client'
import type { 
  MetricsQueryParams,
  MetricsResponse,
  CreateMetricsRequest,
  UpdateMetricsRequest,
  MetricsExportOptions,
  MetricsImportData
} from '@/types/metrics'

/**
 * Metrics API client for funnel-based analytics data
 */
export const metricsAPI = {
  /**
   * Fetch metrics data for a specific funnel and period
   */
  getMetrics: async (params: MetricsQueryParams) => {
    const queryParams = new URLSearchParams()
    
    queryParams.append('funnelId', params.funnelId)
    
    if (params.periodType) {
      queryParams.append('periodType', params.periodType)
    }
    
    if (params.startDate) {
      queryParams.append('startDate', params.startDate.toISOString())
    }
    
    if (params.endDate) {
      queryParams.append('endDate', params.endDate.toISOString())
    }
    
    if (params.nodeIds && params.nodeIds.length > 0) {
      queryParams.append('nodeIds', params.nodeIds.join(','))
    }
    
    if (params.includeMetadata !== undefined) {
      queryParams.append('includeMetadata', String(params.includeMetadata))
    }
    
    return api.get<MetricsResponse>(`/metrics?${queryParams.toString()}`)
  },

  /**
   * Get metrics for a specific entry by ID
   */
  getMetricsById: async (id: string) => {
    return api.get(`/metrics/${id}`)
  },

  /**
   * Create new metrics entries
   */
  createMetrics: async (data: CreateMetricsRequest) => {
    return api.post<MetricsResponse>('/metrics', data)
  },

  /**
   * Update existing metrics entry
   */
  updateMetrics: async (id: string, data: UpdateMetricsRequest) => {
    return api.put<MetricsResponse>(`/metrics/${id}`, data)
  },

  /**
   * Bulk update multiple metrics entries
   */
  bulkUpdateMetrics: async (updates: Array<{ id: string; data: UpdateMetricsRequest }>) => {
    return api.post<MetricsResponse>('/metrics/bulk-update', { updates })
  },

  /**
   * Delete a metrics entry
   */
  deleteMetrics: async (id: string) => {
    return api.delete(`/metrics/${id}`)
  },

  /**
   * Bulk delete multiple metrics entries
   */
  bulkDeleteMetrics: async (ids: string[]) => {
    return api.post('/metrics/bulk-delete', { ids })
  },

  /**
   * Get metrics summary for a funnel
   */
  getMetricsSummary: async (funnelId: string, startDate?: Date, endDate?: Date) => {
    const params = new URLSearchParams()
    params.append('funnelId', funnelId)
    
    if (startDate) {
      params.append('startDate', startDate.toISOString())
    }
    
    if (endDate) {
      params.append('endDate', endDate.toISOString())
    }
    
    return api.get(`/metrics/summary?${params.toString()}`)
  },

  /**
   * Get historical metrics comparison
   */
  getHistoricalComparison: async (
    funnelId: string, 
    currentPeriod: { start: Date; end: Date }, 
    comparisonPeriod: { start: Date; end: Date }
  ) => {
    return api.post('/metrics/compare', {
      funnelId,
      currentPeriod: {
        start: currentPeriod.start.toISOString(),
        end: currentPeriod.end.toISOString()
      },
      comparisonPeriod: {
        start: comparisonPeriod.start.toISOString(),
        end: comparisonPeriod.end.toISOString()
      }
    })
  },

  /**
   * Export metrics data
   */
  exportMetrics: async (funnelId: string, options: MetricsExportOptions) => {
    const params = {
      funnelId,
      ...options,
      dateRange: options.dateRange ? {
        start: options.dateRange.start.toISOString(),
        end: options.dateRange.end.toISOString()
      } : undefined
    }
    
    return api.post('/metrics/export', params, {
      responseType: 'blob'
    })
  },

  /**
   * Import metrics data
   */
  importMetrics: async (funnelId: string, file: File, mapping?: Record<string, string>) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('funnelId', funnelId)
    
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping))
    }
    
    return api.upload<MetricsImportData>('/metrics/import', formData)
  },

  /**
   * Validate metrics data before import
   */
  validateImportData: async (file: File, mapping?: Record<string, string>) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (mapping) {
      formData.append('mapping', JSON.stringify(mapping))
    }
    
    return api.upload('/metrics/validate-import', formData)
  },

  /**
   * Get available metrics templates
   */
  getTemplates: async () => {
    return api.get('/metrics/templates')
  },

  /**
   * Save a custom metrics template
   */
  saveTemplate: async (template: {
    name: string
    description?: string
    columns: any[]
    category: string
  }) => {
    return api.post('/metrics/templates', template)
  },

  /**
   * Delete a custom template
   */
  deleteTemplate: async (templateId: string) => {
    return api.delete(`/metrics/templates/${templateId}`)
  },

  /**
   * Auto-calculate derived metrics
   */
  autoCalculateMetrics: async (entryId: string, metrics: Record<string, number>) => {
    return api.post(`/metrics/${entryId}/auto-calculate`, { metrics })
  },

  /**
   * Get metrics validation rules
   */
  getValidationRules: async () => {
    return api.get('/metrics/validation-rules')
  },

  /**
   * Validate metrics entry
   */
  validateMetricsEntry: async (entry: {
    nodeId: string
    metrics: Record<string, any>
    funnelId: string
  }) => {
    return api.post('/metrics/validate', entry)
  },

  /**
   * Get funnel metrics configuration
   */
  getFunnelMetricsConfig: async (funnelId: string) => {
    return api.get(`/metrics/config/${funnelId}`)
  },

  /**
   * Update funnel metrics configuration
   */
  updateFunnelMetricsConfig: async (funnelId: string, config: {
    columns?: any[]
    validationRules?: any[]
    autoCalculations?: any[]
  }) => {
    return api.put(`/metrics/config/${funnelId}`, config)
  },

  /**
   * Get metrics analytics and insights
   */
  getMetricsInsights: async (funnelId: string, timeframe?: string) => {
    const params = new URLSearchParams()
    if (timeframe) {
      params.append('timeframe', timeframe)
    }
    
    return api.get(`/metrics/${funnelId}/insights?${params.toString()}`)
  },

  /**
   * Generate metrics report
   */
  generateReport: async (funnelId: string, reportType: 'summary' | 'detailed' | 'comparison', options?: {
    startDate?: Date
    endDate?: Date
    includeCharts?: boolean
    format?: 'pdf' | 'html'
  }) => {
    const data = {
      funnelId,
      reportType,
      ...options,
      startDate: options?.startDate?.toISOString(),
      endDate: options?.endDate?.toISOString()
    }
    
    return api.post('/metrics/reports', data, {
      responseType: options?.format === 'pdf' ? 'blob' : 'json'
    })
  },

  /**
   * Get metrics change log/audit trail
   */
  getChangeLog: async (entryId: string, limit?: number) => {
    const params = new URLSearchParams()
    if (limit) {
      params.append('limit', String(limit))
    }
    
    return api.get(`/metrics/${entryId}/changelog?${params.toString()}`)
  },

  /**
   * Add comment to metrics entry
   */
  addComment: async (entryId: string, comment: {
    message: string
    field?: string
  }) => {
    return api.post(`/metrics/${entryId}/comments`, comment)
  },

  /**
   * Get comments for metrics entry
   */
  getComments: async (entryId: string) => {
    return api.get(`/metrics/${entryId}/comments`)
  },

  /**
   * Submit metrics for approval
   */
  submitForApproval: async (entryId: string, message?: string) => {
    return api.post(`/metrics/${entryId}/submit`, { message })
  },

  /**
   * Approve/reject metrics entry
   */
  approveMetrics: async (entryId: string, approved: boolean, comments?: string) => {
    return api.post(`/metrics/${entryId}/approve`, {
      approved,
      comments
    })
  },

  /**
   * Get metrics that need approval
   */
  getPendingApprovals: async (funnelId?: string) => {
    const params = new URLSearchParams()
    if (funnelId) {
      params.append('funnelId', funnelId)
    }
    
    return api.get(`/metrics/pending-approvals?${params.toString()}`)
  }
}

export default metricsAPI