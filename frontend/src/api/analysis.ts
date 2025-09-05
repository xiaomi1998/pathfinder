import { api } from './client'
import type { 
  AnalysisRequest, 
  AnalysisResponse, 
  DiagnosticResult,
  GeneratedRecommendation,
  PeerComparisonResult,
  ImprovementPotential,
  FunnelMetricData
} from '@/types/funnel'

/**
 * Analysis API client
 * Provides methods for intelligent analysis, diagnostics, and recommendations
 */
export const analysisApi = {
  /**
   * Perform comprehensive analysis (diagnostics + recommendations + comparison + potential)
   */
  async performComprehensiveAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await api.post<AnalysisResponse>('/analysis/comprehensive', request)
    return response.data.data!
  },

  /**
   * Perform performance diagnostics only
   */
  async performDiagnostics(data: {
    companyData: FunnelMetricData
    industry: string
    companySize?: string
    region?: string
  }): Promise<DiagnosticResult> {
    const response = await api.post<DiagnosticResult>('/analysis/diagnostics', data)
    return response.data.data!
  },

  /**
   * Generate intelligent recommendations
   */
  async generateRecommendations(data: {
    companyData: FunnelMetricData
    industry: string
    companySize?: string
    region?: string
    maxRecommendations?: number
    includeCustomRules?: boolean
  }): Promise<GeneratedRecommendation[]> {
    const response = await api.post<GeneratedRecommendation[]>('/analysis/recommendations', data)
    return response.data.data!
  },

  /**
   * Perform peer comparison
   */
  async performPeerComparison(data: {
    companyData: FunnelMetricData
    industry: string
    companySize?: string
    region?: string
  }): Promise<PeerComparisonResult> {
    const response = await api.post<PeerComparisonResult>('/analysis/peer-comparison', data)
    return response.data.data!
  },

  /**
   * Calculate improvement potential
   */
  async calculateImprovementPotential(data: {
    companyData: FunnelMetricData
    industry: string
    companySize?: string
    region?: string
  }): Promise<ImprovementPotential> {
    const response = await api.post<ImprovementPotential>('/analysis/improvement-potential', data)
    return response.data.data!
  },

  /**
   * Validate benchmark data for an industry
   */
  async validateBenchmarkData(industry: string): Promise<{
    isValid: boolean
    sampleSize: number
    lastUpdated: Date | null
    missingMetrics: string[]
  }> {
    const response = await api.get(`/analysis/benchmark-validation/${industry}`)
    return response.data.data!
  },

  /**
   * Create benchmark data
   */
  async createBenchmarkData(data: {
    industry: string
    companySize?: string
    region?: string
    metricType: 'conversion_rate' | 'volume' | 'time' | 'quality'
    metricName: string
    percentile: number
    value: number
    sampleSize: number
    periodStart: Date
    periodEnd: Date
  }) {
    const response = await api.post('/analysis/benchmark-data', data)
    return response.data.data!
  },

  /**
   * Bulk import benchmark data
   */
  async bulkImportBenchmarkData(benchmarkRecords: Array<{
    industry: string
    companySize?: string
    region?: string
    metricType: 'conversion_rate' | 'volume' | 'time' | 'quality'
    metricName: string
    percentile: number
    value: number
    sampleSize: number
    periodStart: Date
    periodEnd: Date
  }>): Promise<{
    created: number
    errors: string[]
  }> {
    const response = await api.post('/analysis/benchmark-data/bulk', { benchmarkRecords })
    return response.data.data!
  }
}

export default analysisApi