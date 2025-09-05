import { api } from './client'

interface OrganizationInfo {
  name: string
  industry?: string
  size?: string
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

export const organizationAPI = {
  // Update organization information
  updateInfo: (data: OrganizationInfo) => {
    return api.post<OrganizationResponse>('/org/info', data)
  },

  // Get current organization
  getCurrent: () => {
    return api.get<OrganizationResponse>('/org/current')
  }
}