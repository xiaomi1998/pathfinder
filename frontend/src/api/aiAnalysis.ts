import apiClient from './client'

// AI分析相关接口
export const aiAnalysisAPI = {
  // 第一步：获取关键洞察（免费）
  async getKeyInsights(funnelId: string) {
    const response = await apiClient.post(`/ai-analysis/step1/${funnelId}`, {})
    return response.data
  },

  // 第二步：获取策略选项（付费）
  async getStrategyOptions(analysisId: string, funnelId: string) {
    const response = await apiClient.post(`/ai-analysis/step2/${analysisId}`, {
      funnelId
    })
    return response.data
  },

  // 第三步：获取完整报告（付费）
  async getCompleteReport(analysisId: string, funnelId: string, selectedStrategy: 'stable' | 'aggressive') {
    const response = await apiClient.post(`/ai-analysis/step3/${analysisId}`, {
      funnelId,
      selectedStrategy
    }, {
      timeout: 90000 // 90秒超时，因为完整报告生成需要更长时间
    })
    return response.data
  },

  // 获取漏斗的分析状态
  async getAnalysisStatus(funnelId: string) {
    const response = await apiClient.get(`/ai-analysis/status/${funnelId}`)
    return response.data
  },

  // 获取用户剩余分析次数
  async getQuota() {
    const response = await apiClient.get('/ai-analysis/quota')
    return response.data
  },

  // 获取所有分析报告
  async getReports() {
    const response = await apiClient.get('/ai-analysis/reports')
    return response.data
  },

  // 获取单个报告详情
  async getReportById(reportId: string) {
    const response = await apiClient.get(`/ai-analysis/reports/${reportId}`)
    return response.data
  },

  // 清除所有AI分析记录（测试用）
  async clearAllAnalysis() {
    const response = await apiClient.delete('/ai-analysis/clear-all')
    return response.data
  }
}