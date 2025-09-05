<template>
  <div :class="[
    'flex gap-3 p-4 rounded-lg transition-all duration-200',
    message.role === 'user' 
      ? 'bg-indigo-50 border-l-4 border-indigo-500 ml-8' 
      : 'bg-gray-50 border-l-4 border-gray-300 mr-8'
  ]">
    <!-- Avatar -->
    <div :class="[
      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
      message.role === 'user'
        ? 'bg-indigo-500 text-white'
        : 'bg-gray-500 text-white'
    ]">
      <UserIcon v-if="message.role === 'user'" class="w-4 h-4" />
      <CpuChipIcon v-else class="w-4 h-4" />
    </div>

    <div class="flex-1 min-w-0">
      <!-- Message header -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span :class="[
            'text-sm font-medium',
            message.role === 'user' ? 'text-indigo-900' : 'text-gray-900'
          ]">
            {{ message.role === 'user' ? '我' : 'AI助手' }}
          </span>
          
          <span class="text-xs text-gray-500">
            {{ formatTime(message.createdAt) }}
          </span>
        </div>

        <!-- Message actions -->
        <div class="flex items-center gap-1">
          <button
            v-if="message.role === 'assistant'"
            type="button"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="复制消息"
            @click="copyMessage"
          >
            <DocumentDuplicateIcon class="w-4 h-4" />
          </button>
          
          <button
            v-if="message.role === 'assistant' && showFeedback"
            type="button"
            class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="反馈"
            @click="toggleFeedback"
          >
            <HandThumbUpIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Message content -->
      <div :class="[
        'text-sm leading-relaxed whitespace-pre-wrap',
        message.role === 'user' ? 'text-indigo-900' : 'text-gray-800'
      ]">
        <div v-if="isTyping && message.role === 'assistant'" class="flex items-center gap-2">
          <div class="flex gap-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
          </div>
          <span class="text-gray-500">AI正在思考中...</span>
        </div>
        <div v-else v-html="formattedContent"></div>
      </div>

      <!-- Message suggestions -->
      <div v-if="suggestions && suggestions.length > 0" class="mt-3 space-y-2">
        <div class="text-xs font-medium text-gray-600">建议回复:</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(suggestion, index) in suggestions"
            :key="index"
            type="button"
            class="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            @click="$emit('suggestionSelected', suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <!-- Feedback section -->
      <div v-if="showFeedbackForm" class="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
        <div class="text-sm font-medium text-gray-700 mb-2">对这条回复的评价</div>
        
        <div class="flex items-center gap-2 mb-3">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            :class="[
              'p-1 transition-colors',
              feedbackRating >= star ? 'text-yellow-400' : 'text-gray-300'
            ]"
            @click="setFeedbackRating(star)"
          >
            <StarIcon class="w-4 h-4 fill-current" />
          </button>
        </div>

        <textarea
          v-model="feedbackComment"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows="2"
          placeholder="可选：添加具体的反馈意见..."
        ></textarea>

        <div class="flex justify-end gap-2 mt-2">
          <button
            type="button"
            class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            @click="cancelFeedback"
          >
            取消
          </button>
          <button
            type="button"
            :disabled="feedbackRating === 0"
            class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            @click="submitFeedback"
          >
            提交反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  UserIcon,
  CpuChipIcon,
  DocumentDuplicateIcon,
  HandThumbUpIcon,
  StarIcon
} from '@heroicons/vue/24/outline'
import type { AiMessage } from '@/types/ai'

interface Props {
  message: AiMessage
  isTyping?: boolean
  suggestions?: string[]
  showFeedback?: boolean
}

interface Emits {
  (event: 'suggestionSelected', suggestion: string): void
  (event: 'feedbackSubmitted', feedback: { rating: number; comment?: string; messageId: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  isTyping: false,
  suggestions: () => [],
  showFeedback: true
})

const emit = defineEmits<Emits>()

// Feedback state
const showFeedbackForm = ref(false)
const feedbackRating = ref(0)
const feedbackComment = ref('')

const formattedContent = computed(() => {
  if (!props.message.content) return ''
  
  // Convert markdown-style formatting to HTML
  return props.message.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    .replace(/\n/g, '<br>')
})

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return format(date, 'HH:mm', { locale: zhCN })
  } else {
    return format(date, 'MM-dd HH:mm', { locale: zhCN })
  }
}

const copyMessage = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    // You could show a toast notification here
    console.log('Message copied to clipboard')
  } catch (err) {
    console.error('Failed to copy message:', err)
  }
}

const toggleFeedback = (): void => {
  showFeedbackForm.value = !showFeedbackForm.value
  if (!showFeedbackForm.value) {
    resetFeedback()
  }
}

const setFeedbackRating = (rating: number): void => {
  feedbackRating.value = rating
}

const submitFeedback = (): void => {
  if (feedbackRating.value === 0) return

  emit('feedbackSubmitted', {
    rating: feedbackRating.value,
    comment: feedbackComment.value.trim() || undefined,
    messageId: props.message.id
  })

  showFeedbackForm.value = false
  resetFeedback()
}

const cancelFeedback = (): void => {
  showFeedbackForm.value = false
  resetFeedback()
}

const resetFeedback = (): void => {
  feedbackRating.value = 0
  feedbackComment.value = ''
}
</script>

<style scoped>
/* Custom scrollbar for message content */
.message-content::-webkit-scrollbar {
  width: 4px;
}

.message-content::-webkit-scrollbar-track {
  background: transparent;
}

.message-content::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.message-content::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* Animation for typing indicator */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>