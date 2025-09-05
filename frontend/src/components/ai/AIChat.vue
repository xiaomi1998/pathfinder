<template>
  <div class="flex h-full bg-gray-50">
    <!-- Sidebar for sessions -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div class="flex-1 overflow-y-auto p-4">
        <SessionList
          :sessions="aiStore.sessions"
          :current-session-id="aiStore.currentSession?.id"
          :is-loading="aiStore.isLoading"
          :has-more="aiStore.sessionsPagination.hasNext"
          @session-selected="handleSessionSelected"
          @session-deleted="handleSessionDeleted"
          @session-ended="handleSessionEnded"
          @new-session="handleNewSession"
          @load-more="aiStore.loadMoreSessions"
          @filters-changed="handleFiltersChanged"
        />
      </div>
    </div>

    <!-- Main chat area -->
    <div class="flex-1 flex flex-col">
      <!-- Chat header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <component
              :is="currentContextIcon"
              class="h-6 w-6 text-indigo-600"
            />
            <div>
              <h2 class="text-lg font-semibold text-gray-900">
                {{ currentContextLabel }}
              </h2>
              <div class="text-sm text-gray-500">
                <span v-if="aiStore.currentSession">
                  会话时长: {{ aiStore.sessionDuration }}
                </span>
                <span v-else>
                  选择或创建一个会话开始对话
                </span>
              </div>
            </div>
          </div>

          <!-- Header actions -->
          <div class="flex items-center gap-2">
            <!-- Session status -->
            <div v-if="aiStore.currentSession" :class="[
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              aiStore.currentSession.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            ]">
              {{ aiStore.currentSession.status === 'active' ? '进行中' : '已结束' }}
            </div>

            <!-- End session button -->
            <button
              v-if="aiStore.hasActiveSession"
              type="button"
              class="inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              @click="handleEndSession"
            >
              <StopIcon class="-ml-0.5 h-4 w-4" aria-hidden="true" />
              结束对话
            </button>
          </div>
        </div>
      </div>

      <!-- Messages area -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="!aiStore.currentSession" class="h-full flex items-center justify-center">
          <div class="text-center">
            <!-- Welcome message -->
            <div class="max-w-md mx-auto">
              <CpuChipIcon class="mx-auto h-12 w-12 text-indigo-500 mb-4" />
              <h3 class="text-lg font-semibold text-gray-900 mb-2">欢迎使用AI陪练助手</h3>
              <p class="text-gray-600 mb-6">
                选择对话场景，开始您的AI陪练之旅。我们的AI助手将帮助您提升销售技能和沟通能力。
              </p>

              <!-- Context selector -->
              <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ContextSelector
                  :selected-context="aiStore.selectedContext"
                  @context-selected="handleContextSelected"
                />
                
                <div class="mt-6">
                  <button
                    type="button"
                    :disabled="aiStore.isLoading"
                    class="w-full inline-flex justify-center items-center gap-x-2 rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="startNewSession"
                  >
                    <ArrowPathIcon v-if="aiStore.isLoading" class="h-4 w-4 animate-spin" />
                    <PlusIcon v-else class="h-4 w-4" />
                    {{ aiStore.isLoading ? '创建中...' : '开始新对话' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages list -->
        <div v-else class="p-6 space-y-4">
          <div v-if="aiStore.messages.length === 0 && !aiStore.isTyping" class="text-center py-12">
            <ChatBubbleLeftRightIcon class="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <p class="text-sm text-gray-500">发送第一条消息开始对话吧！</p>
          </div>

          <MessageItem
            v-for="message in aiStore.messages"
            :key="message.id"
            :message="message"
            :suggestions="getMessageSuggestions(message)"
            @suggestion-selected="handleSuggestionSelected"
            @feedback-submitted="handleFeedbackSubmitted"
          />

          <!-- Typing indicator -->
          <div v-if="aiStore.isTyping" class="flex gap-3 p-4 rounded-lg bg-gray-50 border-l-4 border-gray-300 mr-8">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
              <CpuChipIcon class="w-4 h-4 text-white" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-900 mb-2">AI助手</div>
              <div class="flex items-center gap-2">
                <div class="flex gap-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                </div>
                <span class="text-sm text-gray-500">正在思考中...</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div v-if="aiStore.currentSession" class="bg-white border-t border-gray-200 p-4">
        <form @submit.prevent="handleSendMessage">
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <textarea
                v-model="messageInput"
                ref="messageTextarea"
                class="block w-full resize-none rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
                :class="{ 'ring-red-500': inputError }"
                rows="1"
                placeholder="输入您的消息..."
                :disabled="!aiStore.canSendMessage"
                @keydown="handleKeydown"
                @input="adjustTextareaHeight"
              />
              <div v-if="inputError" class="absolute -bottom-5 left-0 text-xs text-red-500">
                {{ inputError }}
              </div>
            </div>
            
            <button
              type="submit"
              :disabled="!canSubmit"
              class="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon v-if="aiStore.isLoading" class="h-5 w-5 animate-spin" />
              <PaperAirplaneIcon v-else class="h-5 w-5" />
            </button>
          </div>

          <!-- Input hints -->
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>支持 Shift+Enter 换行，Enter 发送</span>
            <span>{{ messageInput.length }}/2000</span>
          </div>
        </form>
      </div>
    </div>

    <!-- Error toast -->
    <div v-if="aiStore.error" class="fixed bottom-4 right-4 z-50">
      <div class="bg-red-50 border border-red-200 rounded-md p-4 shadow-lg max-w-sm">
        <div class="flex">
          <ExclamationTriangleIcon class="h-5 w-5 text-red-400 flex-shrink-0" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              操作失败
            </h3>
            <div class="mt-1 text-sm text-red-700">
              {{ aiStore.error }}
            </div>
            <div class="mt-3">
              <button
                type="button"
                class="text-sm font-medium text-red-800 hover:text-red-600"
                @click="aiStore.clearError"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import {
  PlusIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  StopIcon
} from '@heroicons/vue/24/outline'
import { useAiStore } from '@/stores/ai'
import { aiHelpers } from '@/api/ai'
import ContextSelector from './ContextSelector.vue'
import SessionList from './SessionList.vue'
import MessageItem from './MessageItem.vue'
import type { AiSession, AiMessage } from '@/types/ai'

// Store
const aiStore = useAiStore()

// Refs
const messageInput = ref('')
const messageTextarea = ref<HTMLTextAreaElement | null>(null)
const inputError = ref('')

// Computed
const currentContextIcon = computed(() => {
  if (!aiStore.currentSession) return CpuChipIcon
  const iconName = aiHelpers.getContextIcon(aiStore.currentSession.sessionContext)
  switch (iconName) {
    case 'ChatBubbleLeftRightIcon':
      return ChatBubbleLeftRightIcon
    case 'UserGroupIcon':
      return UserGroupIcon
    case 'ExclamationTriangleIcon':
      return ExclamationTriangleIcon
    default:
      return CpuChipIcon
  }
})

const currentContextLabel = computed(() => {
  if (!aiStore.currentSession) return 'AI陪练助手'
  return aiHelpers.getContextDisplayName(aiStore.currentSession.sessionContext)
})

const canSubmit = computed(() => {
  const validation = aiHelpers.validateMessage(messageInput.value)
  return validation.isValid && aiStore.canSendMessage && !inputError.value
})

// Methods
const handleContextSelected = (context: 'invitation' | 'objection_handling' | 'general') => {
  aiStore.setContext(context)
}

const startNewSession = async () => {
  await aiStore.startNewSession()
}

const handleNewSession = () => {
  // Navigate to session creation
  aiStore.currentSession = null
  aiStore.messages = []
}

const handleSessionSelected = async (session: AiSession) => {
  await aiStore.switchToSession(session.id)
}

const handleSessionDeleted = async (sessionId: string) => {
  await aiStore.deleteSession(sessionId)
}

const handleSessionEnded = async () => {
  await aiStore.endCurrentSession()
}

const handleEndSession = async () => {
  await aiStore.endCurrentSession()
}

const handleFiltersChanged = async (filters: { context?: 'invitation' | 'objection_handling' | 'general'; status?: 'active' | 'ended'; search?: string }) => {
  await aiStore.loadSessions(filters as any)
}

const handleSendMessage = async () => {
  const message = messageInput.value.trim()
  if (!message) return

  const validation = aiHelpers.validateMessage(message)
  if (!validation.isValid) {
    inputError.value = validation.error || '消息格式不正确'
    return
  }

  inputError.value = ''
  const originalMessage = messageInput.value
  messageInput.value = ''
  
  const response = await aiStore.sendMessage(message)
  if (!response) {
    // Restore message on failure
    messageInput.value = originalMessage
  }

  // Reset textarea height
  await nextTick()
  adjustTextareaHeight()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}

const adjustTextareaHeight = () => {
  if (!messageTextarea.value) return
  
  messageTextarea.value.style.height = 'auto'
  const scrollHeight = messageTextarea.value.scrollHeight
  const maxHeight = 120 // Max height in pixels (about 5 lines)
  
  messageTextarea.value.style.height = `${Math.min(scrollHeight, maxHeight)}px`
}

const handleSuggestionSelected = (suggestion: string) => {
  messageInput.value = suggestion
  nextTick(() => {
    adjustTextareaHeight()
    messageTextarea.value?.focus()
  })
}

const handleFeedbackSubmitted = async (feedback: { rating: number; comment?: string; messageId: string }) => {
  try {
    await aiStore.submitFeedback({
      sessionId: aiStore.currentSession!.id,
      messageId: feedback.messageId,
      rating: feedback.rating,
      feedback: feedback.comment
    })
  } catch (error) {
    console.error('Failed to submit feedback:', error)
  }
}

const getMessageSuggestions = (message: AiMessage): string[] => {
  // This could be enhanced to return contextual suggestions based on the message
  if (message.role === 'assistant') {
    return [] // For now, no suggestions for assistant messages
  }
  return []
}

// Watchers
watch(() => messageInput.value, (newValue) => {
  const validation = aiHelpers.validateMessage(newValue)
  if (!validation.isValid && newValue.trim()) {
    inputError.value = validation.error || '消息格式不正确'
  } else {
    inputError.value = ''
  }
})

// Lifecycle
onMounted(async () => {
  await aiStore.initialize()
})
</script>

<style scoped>
/* Custom scrollbar styles */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Animation for typing indicator */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>