import { api } from './client'

interface OrganizationInfo {
  name: string
  industry?: string
  size?: string
  location?: string
  salesModel?: string
  description?: string
}

interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  planType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface OrganizationResponse {
  success: boolean
  data: Organization
  message?: string
}

export interface Industry {
  id: string
  code: string
  name: string
  nameEn?: string
  description?: string
  isActive: boolean
  sortOrder: number
}

interface IndustriesResponse {
  success: boolean
  data: Industry[]
  message?: string
}

export const organizationAPI = {
  // Update organization information
  updateInfo: (data: OrganizationInfo) => {
    return api.post<OrganizationResponse>('/org/info', data)
  },

  // Get organization info (for settings page)
  getInfo: () => {
    // 添加时间戳参数防止缓存
    const timestamp = Date.now()
    return api.get<{ success: boolean, data: OrganizationInfo }>(`/org/info?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'If-None-Match': '*'
      }
    })
  },

  // Get current organization
  getCurrent: () => {
    return api.get<OrganizationResponse>('/org/current')
  },

  // Get industry options from database
  getIndustries: () => {
    return api.get<IndustriesResponse>('/org/industries')
  }
}