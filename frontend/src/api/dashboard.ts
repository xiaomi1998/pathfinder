import { client } from './client'
import type { ApiResponse } from '@/types/user'

export interface DashboardMetrics {
  funnelId: string
  overallConversionRate: number
  totalEntries: number
  totalConversions: number
  totalRevenue: number
  stageMetrics: Array<{
    nodeId: string
    nodeName: string
    entries: number
    conversions: number
    conversionRate: number
  }>
  lastUpdated: string
}

export interface TrendDataPoint {
  date: string
  conversionRate: number
  entries: number
  conversions: number
  revenue?: number
}

export interface TrendData {
  labels: string[]
  conversionRates: number[]
  leadCounts: number[]
}

export interface RecentActivity {
  id: string
  type: 'data_entry' | 'funnel_created' | 'report_generated' | 'data_missing'
  title: string
  description: string
  timestamp: string
  icon: string
  color?: string
}

export const dashboardAPI = {
  // 获取漏斗概览数据
  async getFunnelMetrics(funnelId: string): Promise<ApiResponse<DashboardMetrics>> {
    return client.get(`/dashboard/funnel/${funnelId}/metrics`)
  },

  // 获取转化趋势数据
  async getTrendData(funnelId: string, period?: string): Promise<ApiResponse<TrendData>> {
    const params = period ? { period } : {}
    return client.get(`/dashboard/funnel/${funnelId}/trends`, {
      params
    })
  },

  // 获取最近活动
  async getRecentActivities(limit = 10): Promise<ApiResponse<RecentActivity[]>> {
    return client.get('/dashboard/recent-activities', {
      params: { limit }
    })
  },

  // 获取数据录入状态
  async getDataEntryStatus(): Promise<ApiResponse<any>> {
    return client.get('/dashboard/data-entry-status')
  },

  // 获取仪表盘概览统计
  async getOverviewStats(): Promise<ApiResponse<any>> {
    return client.get('/dashboard/overview')
  }
}