// Funnel Instance Types for supporting multiple data entry sessions per funnel

export type FunnelInstanceStatus = 'active' | 'completed' | 'paused' | 'archived'

export interface FunnelInstance {
  id: string
  funnelId: string
  name: string
  description?: string
  status: FunnelInstanceStatus
  periodType: 'weekly' | 'monthly' | 'custom'
  startDate: Date
  endDate: Date
  
  // Metadata
  createdBy: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  
  // Analytics metadata
  totalEntries?: number
  totalConversions?: number
  overallConversionRate?: number
  lastDataUpdate?: Date
  
  // Relations (populated when needed)
  funnel?: {
    id: string
    name: string
    description?: string
    nodeCount: number
  }
  
  // Summary stats (for list view)
  metricsCount?: number
  hasUnsavedChanges?: boolean
}

export interface CreateFunnelInstanceRequest {
  funnelId: string
  name: string
  description?: string
  periodType: 'weekly' | 'monthly' | 'custom'
  startDate: Date
  endDate: Date
}

export interface UpdateFunnelInstanceRequest {
  name?: string
  description?: string
  status?: FunnelInstanceStatus
  startDate?: Date
  endDate?: Date
  periodType?: 'weekly' | 'monthly' | 'custom'
}

export interface FunnelInstanceFilters {
  funnelId?: string
  status?: FunnelInstanceStatus[]
  periodType?: ('weekly' | 'monthly' | 'custom')[]
  search?: string
  createdAfter?: Date
  createdBefore?: Date
  hasData?: boolean
}

export interface FunnelInstanceSort {
  field: 'name' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'status'
  order: 'asc' | 'desc'
}

export interface FunnelInstanceListItem {
  id: string
  funnelId: string
  name: string
  description?: string
  status: FunnelInstanceStatus
  periodType: 'weekly' | 'monthly' | 'custom'
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
  
  // Summary data
  funnel: {
    name: string
    nodeCount: number
  }
  metricsCount: number
  totalEntries?: number
  overallConversionRate?: number
  lastDataUpdate?: Date
  hasUnsavedChanges?: boolean
}

// Quick access types for period selection
export interface FunnelInstancePeriodOption {
  type: 'weekly' | 'monthly' | 'custom'
  startDate: Date
  endDate: Date
  label: string
  disabled?: boolean
}

// Instance management context
export interface FunnelInstanceContext {
  currentInstanceId: string | null
  currentInstance: FunnelInstance | null
  availableInstances: FunnelInstanceListItem[]
  canCreateInstance: boolean
  canEditInstance: boolean
  canDeleteInstance: boolean
}

// For the data entry flow
export interface InstanceSelectionOption {
  type: 'existing' | 'new'
  instance?: FunnelInstanceListItem
  label: string
  description: string
  disabled?: boolean
  recommended?: boolean
}

export interface FunnelWithInstances {
  id: string
  name: string
  description?: string
  nodeCount: number
  instances: FunnelInstanceListItem[]
  canCreateInstance: boolean
  recentInstance?: FunnelInstanceListItem
}