import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { aiApi, aiHelpers } from '@/api/ai'
import type {
  AiSession,
  AiSessionDetails,
  AiMessage,
  ChatResponse,
  CreateSessionRequest,
  SessionsQuery,
  PaginatedSessions,
  AiStats,
  AiStatus,
  ChatState,
  AiRecommendation,
  AiFeedback
} from '@/types/ai'

export const useAiStore = defineStore('ai', () => {
  // State
  const currentSession = ref<AiSession | null>(null)
  const sessions = ref<AiSession[]>([])
  const messages = ref<AiMessage[]>([])
  const isLoading = ref(false)
  const isTyping = ref(false)
  const error = ref<string | null>(null)
  const selectedContext = ref<'invitation' | 'objection_handling' | 'general'>('general')
  const aiStats = ref<AiStats | null>(null)
  const aiStatus = ref<AiStatus | null>(null)
  const sessionsPagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Computed
  const chatState = computed<ChatState>(() => ({
    currentSession: currentSession.value || undefined,
    sessions: sessions.value,
    messages: messages.value,
    isLoading: isLoading.value,
    isTyping: isTyping.value,
    error: error.value,
    selectedContext: selectedContext.value
  }))

  const hasActiveSession = computed(() => {
    return currentSession.value?.status === 'active'
  })

  const canSendMessage = computed(() => {
    return hasActiveSession.value && !isLoading.value && !isTyping.value
  })

  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1] || null
  })

  const sessionDuration = computed(() => {
    if (!currentSession.value) return ''
    return aiHelpers.formatSessionDuration(
      currentSession.value.createdAt,
      currentSession.value.endedAt
    )
  })

  // Actions
  const clearError = () => {
    error.value = null
  }

  const setError = (message: string) => {
    error.value = message
    console.error('AI Store Error:', message)
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  // Session Management
  const createSession = async (data: CreateSessionRequest): Promise<AiSession | null> => {
    try {
      clearError()
      setLoading(true)

      const session = await aiApi.sessions.create(data)
      currentSession.value = session
      sessions.value.unshift(session)
      messages.value = session.messages || []
      
      return session
    } catch (err: any) {
      setError(err.response?.data?.message || '创建会话失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (query: SessionsQuery = {}): Promise<void> => {
    try {
      clearError()
      setLoading(true)

      const result = await aiApi.sessions.list({
        page: sessionsPagination.value.page,
        limit: sessionsPagination.value.limit,
        ...query
      })

      if (query.page === 1 || !query.page) {
        sessions.value = result.sessions
      } else {
        sessions.value.push(...result.sessions)
      }

      sessionsPagination.value = result.pagination
    } catch (err: any) {
      setError(err.response?.data?.message || '加载会话列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSession = async (sessionId: string): Promise<void> => {
    try {
      clearError()
      setLoading(true)

      const session = await aiApi.sessions.getById(sessionId)
      currentSession.value = session
      messages.value = session.messages || []

      // Update session in list if it exists
      const index = sessions.value.findIndex(s => s.id === sessionId)
      if (index >= 0) {
        sessions.value[index] = session
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '加载会话失败')
    } finally {
      setLoading(false)
    }
  }

  const switchToSession = async (sessionId: string): Promise<void> => {
    const existingSession = sessions.value.find(s => s.id === sessionId)
    
    if (existingSession) {
      await loadSession(sessionId)
    } else {
      setError('会话不存在')
    }
  }

  const endCurrentSession = async (): Promise<void> => {
    if (!currentSession.value) return

    try {
      clearError()
      setLoading(true)

      const endedSession = await aiApi.sessions.end(currentSession.value.id)
      currentSession.value = endedSession

      // Update session in list
      const index = sessions.value.findIndex(s => s.id === endedSession.id)
      if (index >= 0) {
        sessions.value[index] = endedSession
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '结束会话失败')
    } finally {
      setLoading(false)
    }
  }

  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      clearError()
      setLoading(true)

      await aiApi.sessions.delete(sessionId)
      
      // Remove from list
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      
      // Clear current session if it's the deleted one
      if (currentSession.value?.id === sessionId) {
        currentSession.value = null
        messages.value = []
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '删除会话失败')
    } finally {
      setLoading(false)
    }
  }

  // Message Management
  const sendMessage = async (content: string): Promise<ChatResponse | null> => {
    if (!currentSession.value) {
      setError('没有活跃的会话')
      return null
    }

    const validation = aiHelpers.validateMessage(content)
    if (!validation.isValid) {
      setError(validation.error || '消息格式不正确')
      return null
    }

    try {
      clearError()
      setLoading(true)

      // Add user message to UI immediately
      const userMessage: AiMessage = {
        id: `temp-${Date.now()}`,
        sessionId: currentSession.value.id,
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString()
      }
      messages.value.push(userMessage)

      // Show typing indicator
      setTyping(true)

      // Send message to backend
      const response = await aiApi.sessions.sendMessage(currentSession.value.id, {
        message: content.trim()
      })

      // Remove temporary user message and add both user and assistant messages from response
      messages.value = messages.value.filter(m => !m.id.startsWith('temp-'))
      
      // The backend should return the conversation with both messages
      // For now, we'll add the assistant message
      const assistantMessage: AiMessage = {
        id: `assistant-${Date.now()}`,
        sessionId: currentSession.value.id,
        role: 'assistant',
        content: response.message,
        createdAt: new Date().toISOString()
      }

      // Re-add user message with proper ID
      const properUserMessage: AiMessage = {
        ...userMessage,
        id: `user-${Date.now()}`
      }

      messages.value.push(properUserMessage, assistantMessage)

      // Update current session
      if (currentSession.value) {
        currentSession.value.updatedAt = new Date().toISOString()
      }

      return response
    } catch (err: any) {
      // Remove temporary message on error
      messages.value = messages.value.filter(m => !m.id.startsWith('temp-'))
      setError(err.response?.data?.message || '发送消息失败')
      return null
    } finally {
      setLoading(false)
      setTyping(false)
    }
  }

  const startNewSession = async (context?: 'invitation' | 'objection_handling' | 'general', funnelId?: string): Promise<void> => {
    const sessionData: CreateSessionRequest = {
      sessionContext: context || selectedContext.value,
      funnelId
    }

    const session = await createSession(sessionData)
    if (session) {
      selectedContext.value = session.sessionContext
    }
  }

  // Statistics
  const loadAiStats = async (): Promise<void> => {
    try {
      const stats = await aiApi.stats.getUserStats()
      aiStats.value = stats
    } catch (err: any) {
      console.warn('Failed to load AI stats:', err)
    }
  }

  const loadAiStatus = async (): Promise<void> => {
    try {
      const status = await aiApi.stats.getStatus()
      aiStatus.value = status
    } catch (err: any) {
      console.warn('Failed to load AI status:', err)
    }
  }

  // Context Management
  const setContext = (context: 'invitation' | 'objection_handling' | 'general') => {
    selectedContext.value = context
  }

  // Reset state
  const reset = () => {
    currentSession.value = null
    sessions.value = []
    messages.value = []
    isLoading.value = false
    isTyping.value = false
    error.value = null
    selectedContext.value = 'general'
    aiStats.value = null
    aiStatus.value = null
    sessionsPagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  }

  // Load more sessions
  const loadMoreSessions = async (): Promise<void> => {
    if (!sessionsPagination.value.hasNext || isLoading.value) return

    await loadSessions({
      page: sessionsPagination.value.page + 1
    })
  }

  // Feedback
  const submitFeedback = async (feedback: AiFeedback): Promise<void> => {
    try {
      await aiApi.feedback.submit(feedback)
    } catch (err: any) {
      console.warn('Failed to submit feedback:', err)
      // Don't show error to user as feedback is optional
    }
  }

  // Helper methods
  const getContextOptions = () => [
    {
      value: 'general' as const,
      label: '通用对话',
      description: '日常AI助手对话，获得各种帮助和建议',
      icon: 'ChatBubbleLeftRightIcon'
    },
    {
      value: 'invitation' as const,
      label: '邀约练习',
      description: '练习客户邀约技巧，提升邀约成功率',
      icon: 'UserGroupIcon'
    },
    {
      value: 'objection_handling' as const,
      label: '异议处理',
      description: '学习处理客户异议，提高转化效果',
      icon: 'ExclamationTriangleIcon'
    }
  ]

  // Auto-load initial data
  const initialize = async () => {
    await Promise.all([
      loadSessions(),
      loadAiStats(),
      loadAiStatus()
    ])
  }

  return {
    // State
    currentSession,
    sessions,
    messages,
    isLoading,
    isTyping,
    error,
    selectedContext,
    aiStats,
    aiStatus,
    sessionsPagination,

    // Computed
    chatState,
    hasActiveSession,
    canSendMessage,
    lastMessage,
    sessionDuration,

    // Actions
    clearError,
    setError,
    setLoading,
    setTyping,
    createSession,
    loadSessions,
    loadSession,
    switchToSession,
    endCurrentSession,
    deleteSession,
    sendMessage,
    startNewSession,
    loadAiStats,
    loadAiStatus,
    setContext,
    reset,
    loadMoreSessions,
    submitFeedback,
    getContextOptions,
    initialize
  }
})

export default useAiStore