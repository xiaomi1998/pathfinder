import { api } from './client'
import type { 
  FunnelInstance,
  FunnelInstanceListItem,
  CreateFunnelInstanceRequest,
  UpdateFunnelInstanceRequest,
  InstanceUsageStats,
  InstanceComparison,
  BulkInstanceOperationRequest,
  TemplateUsageTracking,
  InstanceFilters,
  InstanceSort
} from '@/types/funnel'
import type { ApiResponse } from '@/types/user'

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface InstanceQueryParams {
  page?: number
  limit?: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  templateId?: string
  status?: string
}

/**
 * 创建漏斗实例
 */
export const createFunnelInstance = async (data: CreateFunnelInstanceRequest): Promise<FunnelInstance> => {
  const response = await api.post<FunnelInstance>('/funnel-instances', data)
  return response.data.data!
}

/**
 * 获取用户的漏斗实例列表（分页）
 */
export const getFunnelInstances = async (params?: InstanceQueryParams): Promise<PaginatedResponse<FunnelInstanceListItem>> => {
  const response = await api.get<any>('/funnel-instances', { params })
  
  // Adapt backend response to frontend format
  if (response.data.success && Array.isArray(response.data.data)) {
    return {
      success: true,
      data: response.data.data,
      pagination: {
        page: 1,
        limit: response.data.data.length,
        total: response.data.data.length,
        pages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }
  
  throw new Error('Invalid response format')
}

/**
 * 获取特定模板的所有实例
 */
export const getTemplateInstances = async (
  templateId: string, 
  params?: InstanceQueryParams
): Promise<PaginatedResponse<FunnelInstanceListItem>> => {
  const response = await api.get<any>(`/funnel-instances/template/${templateId}`, { params })
  
  // Adapt backend response to frontend format
  if (response.data.success && Array.isArray(response.data.data)) {
    return {
      success: true,
      data: response.data.data,
      pagination: {
        page: 1,
        limit: response.data.data.length,
        total: response.data.data.length,
        pages: 1,
        hasNext: false,
        hasPrev: false
      }
    }
  }
  
  throw new Error('Invalid response format')
}

/**
 * 获取实例详情
 */
export const getFunnelInstance = async (instanceId: string): Promise<FunnelInstance> => {
  const response = await api.get<FunnelInstance>(`/funnel-instances/${instanceId}`)
  return response.data.data!
}

/**
 * 更新漏斗实例
 */
export const updateFunnelInstance = async (
  instanceId: string, 
  data: UpdateFunnelInstanceRequest
): Promise<FunnelInstance> => {
  const response = await api.put<FunnelInstance>(`/funnel-instances/${instanceId}`, data)
  return response.data.data!
}

/**
 * 删除漏斗实例
 */
export const deleteFunnelInstance = async (instanceId: string): Promise<void> => {
  await api.delete(`/funnel-instances/${instanceId}`)
}

/**
 * 复制漏斗实例
 */
export const duplicateFunnelInstance = async (instanceId: string, name?: string): Promise<FunnelInstance> => {
  const response = await api.post<FunnelInstance>(`/funnel-instances/${instanceId}/duplicate`, { name })
  return response.data.data!
}

/**
 * 批量操作实例
 */
export const bulkOperateInstances = async (data: BulkInstanceOperationRequest): Promise<{
  updated: number
  errors: string[]
}> => {
  const response = await api.post<{ updated: number; errors: string[] }>('/funnel-instances/bulk', data)
  return response.data.data!
}

/**
 * 获取模板使用统计
 */
export const getTemplateUsageStats = async (templateId: string): Promise<InstanceUsageStats> => {
  const response = await api.get<InstanceUsageStats>(`/funnel-instances/template/${templateId}/stats`)
  return response.data.data!
}

/**
 * 获取组织的模板使用追踪
 */
export const getTemplateUsageTracking = async (): Promise<TemplateUsageTracking[]> => {
  const response = await api.get<TemplateUsageTracking[]>('/funnel-instances/usage-tracking')
  return response.data.data!
}

/**
 * 获取实例比较数据
 */
export const compareInstances = async (instanceIds: string[]): Promise<InstanceComparison[]> => {
  const promises = instanceIds.map(async (id) => {
    const instance = await getFunnelInstance(id)
    return {
      instanceId: instance.id,
      instanceName: instance.name,
      metrics: instance.instanceMetrics || []
    }
  })
  
  return Promise.all(promises)
}

// Instance management utilities
export const instanceUtils = {
  /**
   * 格式化实例状态显示文本
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      active: '活跃',
      in_progress: '进行中',
      completed: '已完成',
      paused: '已暂停',
      archived: '已归档'
    }
    return statusMap[status] || status
  },

  /**
   * 获取状态颜色类
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      draft: 'gray',
      active: 'green',
      in_progress: 'blue',
      completed: 'purple',
      paused: 'orange',
      archived: 'red'
    }
    return colorMap[status] || 'gray'
  },

  /**
   * 格式化转化率
   */
  formatConversionRate(rate?: number): string {
    return rate ? `${(rate * 100).toFixed(2)}%` : 'N/A'
  },

  /**
   * 格式化收入
   */
  formatRevenue(revenue?: number): string {
    if (!revenue) return 'N/A'
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`
    }
    if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(1)}K`
    }
    return `$${revenue.toFixed(2)}`
  },

  /**
   * 格式化日期范围
   */
  formatDateRange(startDate?: Date, endDate?: Date): string {
    if (!startDate && !endDate) return '无限制'
    if (!startDate) return `截止至 ${new Date(endDate!).toLocaleDateString()}`
    if (!endDate) return `自 ${new Date(startDate).toLocaleDateString()} 起`
    return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
  },

  /**
   * 计算实例持续时间（天）
   */
  calculateDuration(startDate?: Date, endDate?: Date): number | null {
    if (!startDate || !endDate) return null
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  },

  /**
   * 检查实例是否过期
   */
  isExpired(endDate?: Date): boolean {
    if (!endDate) return false
    return new Date(endDate) < new Date()
  },

  /**
   * 获取实例进度百分比（基于日期）
   */
  getProgressPercentage(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    
    if (now < start) return 0
    if (now > end) return 100
    
    return Math.round(((now - start) / (end - start)) * 100)
  }
}

// Helper function for week number calculation
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// API object for import compatibility
export const funnelInstanceAPI = {
  // Core CRUD operations
  createInstance: createFunnelInstance,
  getInstances: getFunnelInstances,
  getInstanceById: getFunnelInstance,
  updateInstance: updateFunnelInstance,
  deleteInstance: deleteFunnelInstance,
  duplicateInstance: duplicateFunnelInstance,
  
  // Template-specific operations
  getTemplateInstances,
  getTemplateUsageStats,
  getTemplateUsageTracking,
  
  // Batch operations
  bulkOperateInstances,
  
  // Comparison and analytics
  compareInstances,
  
  // Period suggestions utility
  getPeriodSuggestions: (periodType: 'weekly' | 'monthly') => {
    const now = new Date()
    const suggestions = []
    
    if (periodType === 'weekly') {
      // Generate 8 weeks: 4 past, current, 3 future
      for (let i = -4; i <= 3; i++) {
        const startDate = new Date(now)
        const endDate = new Date(now)
        
        startDate.setDate(now.getDate() - now.getDay() + (i * 7)) // Monday of the week
        endDate.setDate(startDate.getDate() + 6) // Sunday of the week
        
        const weekNum = getWeekNumber(startDate)
        const isCurrent = i === 0
        
        suggestions.push({
          label: `第${weekNum}周 (${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()})`,
          startDate,
          endDate,
          isCurrent,
          value: `${startDate.getFullYear()}-W${weekNum}`
        })
      }
    } else if (periodType === 'monthly') {
      // Generate 7 months: 3 past, current, 3 future
      for (let i = -3; i <= 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        const isCurrent = i === 0
        
        suggestions.push({
          label: `${date.getFullYear()}年${monthNames[date.getMonth()]}`,
          startDate,
          endDate,
          isCurrent,
          value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        })
      }
    }
    
    return suggestions
  },
  
  // Quick instance creation for compatibility
  createQuickInstance: async (funnelId: string, name: string, periodType: 'weekly' | 'monthly') => {
    const now = new Date()
    const endDate = new Date(now)
    
    if (periodType === 'weekly') {
      endDate.setDate(now.getDate() + 7)
    } else {
      endDate.setMonth(now.getMonth() + 1)
    }
    
    const data: CreateFunnelInstanceRequest = {
      funnelId,
      name,
      periodType,
      startDate: now,
      endDate,
      description: `快速创建的${periodType === 'weekly' ? '周' : '月'}度实例`
    }
    
    return createFunnelInstance(data)
  },
  
  // Enhanced methods for better compatibility with store
  getFunnelWithInstances: async (funnelId: string) => {
    try {
      // Get template instances
      const instancesResponse = await getTemplateInstances(funnelId)
      const rawInstances = instancesResponse.data
      
      // Transform instances to match expected format
      const instances = rawInstances.map(instance => ({
        ...instance,
        funnel: {
          name: instance.funnelTemplate?.name || 'Unknown Funnel',
          nodeCount: 0
        }
      }))
      
      // Find the most recent instance
      const recentInstance = instances.length > 0 ? instances[0] : null
      
      // Return the expected format
      return {
        funnel: {
          id: funnelId,
          name: instances[0]?.funnelTemplate?.name || 'Funnel Template',
          nodeCount: 0
        },
        instances,
        recentInstance,
        stats: {
          totalInstances: instances.length,
          activeInstances: instances.filter(i => i.status === 'active').length,
          completedInstances: instances.filter(i => i.status === 'completed').length
        }
      }
    } catch (error) {
      console.error('Error fetching funnel with instances:', error)
      return null
    }
  }
}

export default {
  createFunnelInstance,
  getFunnelInstances,
  getTemplateInstances,
  getFunnelInstance,
  updateFunnelInstance,
  deleteFunnelInstance,
  duplicateFunnelInstance,
  bulkOperateInstances,
  getTemplateUsageStats,
  getTemplateUsageTracking,
  compareInstances,
  utils: instanceUtils
}