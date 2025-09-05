import { api } from './client'
import type { 
  Funnel, 
  FunnelListItem,
  CreateFunnelRequest, 
  UpdateFunnelRequest,
  DuplicateFunnelRequest,
  FunnelFilters,
  FunnelSort
} from '@/types/funnel'
import type { PaginatedResponse } from '@/types'

export const funnelAPI = {
  // Get all funnels with pagination and filters
  getFunnels: (params?: {
    page?: number
    per_page?: number
    filters?: FunnelFilters
    sort?: FunnelSort
  }) => {
    const searchParams = new URLSearchParams()
    
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString())
    if (params?.filters?.status) {
      params.filters.status.forEach(status => searchParams.append('status[]', status))
    }
    if (params?.filters?.search) searchParams.append('search', params.filters.search)
    if (params?.filters?.created_after) {
      searchParams.append('created_after', params.filters.created_after.toISOString())
    }
    if (params?.filters?.created_before) {
      searchParams.append('created_before', params.filters.created_before.toISOString())
    }
    if (params?.filters?.has_analytics !== undefined) {
      searchParams.append('has_analytics', params.filters.has_analytics.toString())
    }
    if (params?.sort?.field) searchParams.append('sort_by', params.sort.field)
    if (params?.sort?.order) searchParams.append('sort_order', params.sort.order)
    
    const queryString = searchParams.toString()
    return api.get<PaginatedResponse<FunnelListItem>>(`/funnels${queryString ? `?${queryString}` : ''}`)
  },

  // Get single funnel by ID
  getFunnelById: (id: string) => {
    return api.get<Funnel>(`/funnels/${id}`)
  },

  // Create new funnel
  createFunnel: (data: CreateFunnelRequest) => {
    return api.post<Funnel>('/funnels', data)
  },

  // Update existing funnel
  updateFunnel: (id: string, data: UpdateFunnelRequest) => {
    return api.put<Funnel>(`/funnels/${id}`, data)
  },

  // Delete funnel
  deleteFunnel: (id: string) => {
    return api.delete(`/funnels/${id}`)
  },

  // Duplicate funnel
  duplicateFunnel: (id: string, name: string) => {
    const data: DuplicateFunnelRequest = { name }
    return api.post<Funnel>(`/funnels/${id}/duplicate`, data)
  },

  // Publish funnel
  publishFunnel: (id: string) => {
    return api.post<Funnel>(`/funnels/${id}/publish`)
  },

  // Archive funnel
  archiveFunnel: (id: string) => {
    return api.post<Funnel>(`/funnels/${id}/archive`)
  },

  // Restore archived funnel
  restoreFunnel: (id: string) => {
    return api.post<Funnel>(`/funnels/${id}/restore`)
  },

  // Get funnel analytics
  getFunnelAnalytics: (id: string, params?: {
    date_range?: {
      start_date: string
      end_date: string
    }
    granularity?: 'hour' | 'day' | 'week' | 'month'
  }) => {
    const searchParams = new URLSearchParams()
    
    if (params?.date_range?.start_date) {
      searchParams.append('start_date', params.date_range.start_date)
    }
    if (params?.date_range?.end_date) {
      searchParams.append('end_date', params.date_range.end_date)
    }
    if (params?.granularity) {
      searchParams.append('granularity', params.granularity)
    }
    
    const queryString = searchParams.toString()
    return api.get(`/funnels/${id}/analytics${queryString ? `?${queryString}` : ''}`)
  },

  // Export funnel data
  exportFunnel: (id: string, format: 'json' | 'csv' | 'xlsx') => {
    return api.download(`/funnels/${id}/export?format=${format}`, `funnel-${id}.${format}`)
  },

  // Import funnel from file
  importFunnel: (file: File, onUploadProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.upload<Funnel>('/funnels/import', formData, (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress(progress)
      }
    })
  },

  // Get funnel templates
  getTemplates: () => {
    return api.get<FunnelListItem[]>('/funnels/templates')
  },

  // Create funnel from template
  createFromTemplate: (templateId: string, name: string) => {
    return api.post<Funnel>(`/funnels/templates/${templateId}/create`, { name })
  },

  // Save funnel as template
  saveAsTemplate: (id: string, templateData: {
    name: string
    description?: string
    category?: string
    tags?: string[]
  }) => {
    return api.post(`/funnels/${id}/save-as-template`, templateData)
  },

  // Get funnel sharing settings
  getSharingSettings: (id: string) => {
    return api.get(`/funnels/${id}/sharing`)
  },

  // Update funnel sharing settings
  updateSharingSettings: (id: string, settings: {
    is_public: boolean
    share_token?: string
    allowed_domains?: string[]
    expiry_date?: string
  }) => {
    return api.put(`/funnels/${id}/sharing`, settings)
  },

  // Get public funnel (no auth required)
  getPublicFunnel: (shareToken: string) => {
    return api.get<Funnel>(`/public/funnels/${shareToken}`)
  },

  // Validate funnel structure
  validateFunnel: (data: { nodes: any[], edges: any[] }) => {
    return api.post('/funnels/validate', data)
  },

  // Get funnel performance insights
  getInsights: (id: string) => {
    return api.get(`/funnels/${id}/insights`)
  },

  // Get funnel version history
  getVersionHistory: (id: string) => {
    return api.get(`/funnels/${id}/versions`)
  },

  // Restore funnel version
  restoreVersion: (id: string, versionId: string) => {
    return api.post(`/funnels/${id}/versions/${versionId}/restore`)
  }
}