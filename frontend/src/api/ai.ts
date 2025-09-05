import { api } from './client'
import type {
  AiSession,
  AiSessionDetails,
  ChatRequest,
  ChatResponse,
  CreateSessionRequest,
  SessionMessage,
  AnalysisRequest,
  AnalysisResponse,
  InvitationGenerationRequest,
  ObjectionHandlingRequest,
  AiStats,
  SessionsQuery,
  PaginatedSessions,
  SmartAnalysisRequest,
  SmartAnalysisResponse,
  AiFeedback,
  AiStatus,
  AiRecommendation
} from '@/types/ai'

// Session Management
export const sessionApi = {
  // Create new AI session
  create: async (data: CreateSessionRequest): Promise<AiSession> => {
    const response = await api.post<AiSession>('/ai/sessions', data)
    return response.data.data!
  },

  // Get user sessions with pagination
  list: async (query: SessionsQuery = {}): Promise<PaginatedSessions> => {
    const response = await api.get<PaginatedSessions>('/ai/sessions', {
      params: query
    })
    return response.data.data!
  },

  // Get session details
  getById: async (sessionId: string): Promise<AiSessionDetails> => {
    const response = await api.get<AiSessionDetails>(`/ai/sessions/${sessionId}`)
    return response.data.data!
  },

  // Send message to session
  sendMessage: async (sessionId: string, data: SessionMessage): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>(`/ai/sessions/${sessionId}/messages`, data)
    return response.data.data!
  },

  // End session
  end: async (sessionId: string): Promise<AiSession> => {
    const response = await api.put<AiSession>(`/ai/sessions/${sessionId}/end`)
    return response.data.data!
  },

  // Delete session
  delete: async (sessionId: string): Promise<void> => {
    await api.delete(`/ai/sessions/${sessionId}`)
  }
}

// Chat API (Legacy endpoints for compatibility)
export const chatApi = {
  // Start new chat session
  start: async (data: CreateSessionRequest): Promise<AiSession> => {
    const response = await api.post<AiSession>('/ai/chat/start', data)
    return response.data.data!
  },

  // Send chat message
  send: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/ai/chat', data)
    return response.data.data!
  }
}

// Analysis API
export const analysisApi = {
  // Request funnel analysis
  analyze: async (data: AnalysisRequest): Promise<AnalysisResponse> => {
    const response = await api.post<AnalysisResponse>('/ai/analyze', data)
    return response.data.data!
  },

  // Get funnel recommendations
  getRecommendations: async (
    funnelId: string, 
    options: { limit?: number; priority?: 'high' | 'medium' | 'low' } = {}
  ): Promise<AiRecommendation[]> => {
    const response = await api.get<AiRecommendation[]>(
      `/ai/recommendations/${funnelId}`,
      { params: options }
    )
    return response.data.data!
  },

  // Smart analysis
  smartAnalysis: async (data: SmartAnalysisRequest): Promise<SmartAnalysisResponse> => {
    const response = await api.post<SmartAnalysisResponse>('/ai/analysis/smart', data)
    return response.data.data!
  },

  // Batch analysis
  batchAnalysis: async (data: {
    funnelIds: string[]
    analysisType: 'performance' | 'bottlenecks' | 'recommendations' | 'trends'
    timeRange?: { startDate: Date; endDate: Date }
  }): Promise<{ analyses: AnalysisResponse[]; summary: string }> => {
    const response = await api.post('/ai/analysis/batch', data)
    return response.data.data!
  }
}

// Generation API
export const generationApi = {
  // Generate invitation text
  generateInvitation: async (data: InvitationGenerationRequest): Promise<{ content: string; variations: string[] }> => {
    const response = await api.post('/ai/generate/invitation', data)
    return response.data.data!
  },

  // Generate objection handling response
  generateObjectionHandling: async (data: ObjectionHandlingRequest): Promise<{
    response: string
    alternatives: string[]
    tips: string[]
  }> => {
    const response = await api.post('/ai/generate/objection-handling', data)
    return response.data.data!
  }
}

// Stats API
export const statsApi = {
  // Get user AI stats
  getUserStats: async (): Promise<AiStats> => {
    const response = await api.get<AiStats>('/ai/stats')
    return response.data.data!
  },

  // Get AI status
  getStatus: async (): Promise<AiStatus> => {
    const response = await api.get<AiStatus>('/ai/status')
    return response.data.data!
  }
}

// Feedback API
export const feedbackApi = {
  // Submit feedback
  submit: async (data: AiFeedback): Promise<void> => {
    await api.post('/ai/feedback', data)
  }
}

// Combined AI API
export const aiApi = {
  sessions: sessionApi,
  chat: chatApi,
  analysis: analysisApi,
  generation: generationApi,
  stats: statsApi,
  feedback: feedbackApi
}

// Helper functions
export const aiHelpers = {
  // Format message for display
  formatMessage: (content: string): string => {
    return content.trim().replace(/\n\n+/g, '\n\n')
  },

  // Get context display name
  getContextDisplayName: (context: 'invitation' | 'objection_handling' | 'general'): string => {
    const contextMap = {
      invitation: '邀约练习',
      objection_handling: '异议处理',
      general: '通用对话'
    }
    return contextMap[context] || context
  },

  // Get context icon
  getContextIcon: (context: 'invitation' | 'objection_handling' | 'general'): string => {
    const iconMap = {
      invitation: 'UserGroupIcon',
      objection_handling: 'ExclamationTriangleIcon',
      general: 'ChatBubbleLeftRightIcon'
    }
    return iconMap[context] || 'ChatBubbleLeftRightIcon'
  },

  // Validate message content
  validateMessage: (message: string): { isValid: boolean; error?: string } => {
    if (!message.trim()) {
      return { isValid: false, error: '消息不能为空' }
    }
    if (message.length > 2000) {
      return { isValid: false, error: '消息长度不能超过2000个字符' }
    }
    return { isValid: true }
  },

  // Format session duration
  formatSessionDuration: (createdAt: string, endedAt?: string): string => {
    const start = new Date(createdAt)
    const end = endedAt ? new Date(endedAt) : new Date()
    const duration = end.getTime() - start.getTime()
    
    const minutes = Math.floor(duration / 60000)
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  },

  // Get priority color class
  getPriorityColorClass: (priority: 'high' | 'medium' | 'low'): string => {
    const colorMap = {
      high: 'text-red-600 bg-red-50 border-red-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      low: 'text-green-600 bg-green-50 border-green-200'
    }
    return colorMap[priority] || colorMap.medium
  },

  // Get severity color class
  getSeverityColorClass: (severity: 'high' | 'medium' | 'low'): string => {
    const colorMap = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-orange-600 bg-orange-50',
      low: 'text-blue-600 bg-blue-50'
    }
    return colorMap[severity] || colorMap.medium
  }
}

export default aiApi