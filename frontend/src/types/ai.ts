// AI Session types
export interface AiSession {
  id: string
  userId: string
  funnelId?: string
  sessionContext: 'invitation' | 'objection_handling' | 'general'
  status: 'active' | 'ended'
  createdAt: string
  updatedAt: string
  endedAt?: string
  messages?: AiMessage[]
  messageCount?: number
  lastMessage?: AiMessage
}

// AI Message types
export interface AiMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  metadata?: Record<string, any>
}

// AI Session with details
export interface AiSessionDetails extends AiSession {
  messages: AiMessage[]
  funnel?: {
    id: string
    name: string
  }
  user: {
    id: string
    username: string
  }
}

// Chat request and response
export interface ChatRequest {
  message: string
  sessionId?: string
  funnelId?: string
  context?: 'invitation' | 'objection_handling' | 'general'
}

export interface ChatResponse {
  message: string
  sessionId: string
  suggestions?: string[]
  actions?: AiAction[]
}

// AI Actions
export interface AiAction {
  type: 'create_node' | 'update_funnel' | 'analyze_data' | 'generate_report'
  description: string
  payload: any
}

// Session creation
export interface CreateSessionRequest {
  funnelId?: string
  sessionContext?: 'invitation' | 'objection_handling' | 'general'
}

export interface SessionMessage {
  message: string
}

// Analysis types
export interface AnalysisRequest {
  funnelId: string
  analysisType: 'performance' | 'bottlenecks' | 'recommendations' | 'trends'
  timeRange?: {
    startDate: Date
    endDate: Date
  }
}

export interface AnalysisResponse {
  analysisType: string
  summary: string
  insights: AiInsight[]
  recommendations: AiRecommendation[]
  data?: any
}

export interface AiInsight {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  category: 'performance' | 'user_experience' | 'conversion' | 'data_quality'
  affectedNodes?: string[]
  metrics?: {
    name: string
    value: number
    unit?: string
    change?: number
  }[]
}

export interface AiRecommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'optimization' | 'content' | 'design' | 'targeting'
  expectedImpact: string
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: string
    steps: string[]
  }
  affectedNodes?: string[]
}

// Generation types
export interface InvitationGenerationRequest {
  funnelId: string
  nodeId?: string
  context?: string
  tone?: 'professional' | 'friendly' | 'casual' | 'urgent'
  length?: 'short' | 'medium' | 'long'
}

export interface ObjectionHandlingRequest {
  funnelId: string
  objection: string
  customerType?: string
}

// AI Stats
export interface AiStats {
  totalSessions: number
  totalMessages: number
  averageSessionDuration: number
  mostUsedContext: string
  recentActivity: {
    date: string
    sessionCount: number
    messageCount: number
  }[]
}

// Pagination
export interface SessionsQuery {
  page?: number
  limit?: number
  funnelId?: string
  context?: 'invitation' | 'objection_handling' | 'general'
}

export interface PaginatedSessions {
  sessions: AiSession[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Smart Analysis
export interface SmartAnalysisRequest {
  query: string
  funnelId?: string
  context?: 'data_analysis' | 'optimization' | 'troubleshooting' | 'planning'
}

export interface SmartAnalysisResponse {
  analysis: string
  suggestions: string[]
  actions: AiAction[]
  sessionId: string
}

// Feedback
export interface AiFeedback {
  sessionId: string
  messageId?: string
  rating: number // 1-5
  feedback?: string
}

// AI Status
export interface AiStatus {
  modelAvailable: boolean
  modelName: string
  features: {
    chat: boolean
    analysis: boolean
    invitationGeneration: boolean
    objectionHandling: boolean
    dataInsights: boolean
  }
  limits: {
    maxMessageLength: number
    maxSessionMessages: number
    maxConcurrentSessions: number
  }
}

// UI State types
export interface ChatState {
  currentSession?: AiSession
  sessions: AiSession[]
  messages: AiMessage[]
  isLoading: boolean
  isTyping: boolean
  error?: string | null
  selectedContext: 'invitation' | 'objection_handling' | 'general'
}

export interface MessageInput {
  content: string
  isValid: boolean
}

export interface SessionContextOption {
  value: 'invitation' | 'objection_handling' | 'general'
  label: string
  description: string
  icon: string
}