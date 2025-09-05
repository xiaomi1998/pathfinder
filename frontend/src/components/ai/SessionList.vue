<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900">对话历史</h3>
      <button
        type="button"
        class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        @click="$emit('new-session')"
      >
        <PlusIcon class="-ml-0.5 h-4 w-4" aria-hidden="true" />
        新建对话
      </button>
    </div>

    <!-- Filter and search -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Context filter -->
        <select
          v-model="selectedContext"
          class="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 text-sm"
          @change="handleFilterChange"
        >
          <option value="">所有场景</option>
          <option value="general">通用对话</option>
          <option value="invitation">邀约练习</option>
          <option value="objection_handling">异议处理</option>
        </select>

        <!-- Status filter -->
        <select
          v-model="selectedStatus"
          class="block w-full sm:w-auto rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 text-sm"
          @change="handleFilterChange"
        >
          <option value="">所有状态</option>
          <option value="active">进行中</option>
          <option value="ended">已结束</option>
        </select>
      </div>

      <!-- Search -->
      <div class="relative">
        <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          class="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm"
          placeholder="搜索对话内容..."
          @input="handleSearch"
        >
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading && sessions.length === 0" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="sessions.length === 0" class="text-center py-12">
      <ChatBubbleLeftRightIcon class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-semibold text-gray-900">暂无对话记录</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ hasFilters ? '没有找到匹配的对话' : '开始您的第一次AI对话吧！' }}
      </p>
      <div class="mt-6">
        <button
          type="button"
          class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          @click="$emit('new-session')"
        >
          <PlusIcon class="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
          新建对话
        </button>
      </div>
    </div>

    <!-- Sessions list -->
    <div v-else class="space-y-2">
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="[
          'relative cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md',
          currentSessionId === session.id
            ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-20'
            : 'border-gray-200 bg-white hover:border-gray-300'
        ]"
        @click="handleSessionSelect(session)"
      >
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <!-- Session header -->
            <div class="flex items-center gap-2 mb-2">
              <component
                :is="getContextIcon(session.sessionContext)"
                :class="[
                  'h-4 w-4 flex-shrink-0',
                  currentSessionId === session.id ? 'text-indigo-600' : 'text-gray-500'
                ]"
              />
              
              <span :class="[
                'text-sm font-medium truncate',
                currentSessionId === session.id ? 'text-indigo-900' : 'text-gray-900'
              ]">
                {{ getContextLabel(session.sessionContext) }}
              </span>

              <div :class="[
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                session.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]">
                {{ session.status === 'active' ? '进行中' : '已结束' }}
              </div>
            </div>

            <!-- Last message preview -->
            <div v-if="session.lastMessage" :class="[
              'text-sm line-clamp-2',
              currentSessionId === session.id ? 'text-indigo-700' : 'text-gray-600'
            ]">
              {{ session.lastMessage.content }}
            </div>
            <div v-else :class="[
              'text-sm italic',
              currentSessionId === session.id ? 'text-indigo-500' : 'text-gray-500'
            ]">
              暂无消息
            </div>

            <!-- Session meta -->
            <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{{ formatSessionTime(session.updatedAt) }}</span>
              <span v-if="session.messageCount">{{ session.messageCount }} 条消息</span>
            </div>
          </div>

          <!-- Session actions -->
          <div class="flex items-center gap-1 ml-3">
            <button
              v-if="session.status === 'active'"
              type="button"
              class="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="结束对话"
              @click.stop="handleEndSession(session)"
            >
              <StopIcon class="h-4 w-4" />
            </button>
            
            <button
              type="button"
              class="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
              title="删除对话"
              @click.stop="handleDeleteSession(session)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Selection indicator -->
        <div 
          v-if="currentSessionId === session.id" 
          class="absolute -inset-px rounded-lg border-2 border-indigo-500 pointer-events-none" 
        />
      </div>
    </div>

    <!-- Load more -->
    <div v-if="hasMore && sessions.length > 0" class="text-center pt-4">
      <button
        type="button"
        :disabled="isLoading"
        class="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="$emit('load-more')"
      >
        <ArrowPathIcon v-if="isLoading" class="-ml-0.5 h-4 w-4 animate-spin" />
        <span>{{ isLoading ? '加载中...' : '加载更多' }}</span>
      </button>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="sessionToDelete" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon class="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 class="text-base font-semibold leading-6 text-gray-900">删除对话</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    确定要删除这个对话吗？此操作无法撤销，所有的消息记录都将被永久删除。
                  </p>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-4 sm:ml-10 sm:flex sm:pl-4">
              <button
                type="button"
                class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                @click="confirmDelete"
              >
                删除
              </button>
              <button
                type="button"
                class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:mt-0 sm:w-auto"
                @click="cancelDelete"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  StopIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import type { AiSession } from '@/types/ai'

interface Props {
  sessions: AiSession[]
  currentSessionId?: string
  isLoading?: boolean
  hasMore?: boolean
}

interface Emits {
  (event: 'session-selected', session: AiSession): void
  (event: 'session-deleted', sessionId: string): void
  (event: 'session-ended', sessionId: string): void
  (event: 'new-session'): void
  (event: 'load-more'): void
  (event: 'filters-changed', filters: { context?: string; status?: string; search?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  sessions: () => [],
  isLoading: false,
  hasMore: false
})

defineEmits<Emits>()

// Filter state
const selectedContext = ref('')
const selectedStatus = ref('')
const searchQuery = ref('')
const sessionToDelete = ref<AiSession | null>(null)

// Computed
const hasFilters = computed(() => {
  return selectedContext.value || selectedStatus.value || searchQuery.value.trim()
})

// Context mapping
const contextIconMap = {
  general: ChatBubbleLeftRightIcon,
  invitation: UserGroupIcon,
  objection_handling: ExclamationTriangleIcon
}

const contextLabelMap = {
  general: '通用对话',
  invitation: '邀约练习',
  objection_handling: '异议处理'
}

// Methods
const getContextIcon = (context: string) => {
  return contextIconMap[context as keyof typeof contextIconMap] || ChatBubbleLeftRightIcon
}

const getContextLabel = (context: string) => {
  return contextLabelMap[context as keyof typeof contextLabelMap] || context
}

const formatSessionTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return format(date, 'HH:mm')
  } else if (diffInHours < 48) {
    return '昨天 ' + format(date, 'HH:mm')
  } else {
    return format(date, 'MM-dd HH:mm')
  }
}

const handleSessionSelect = (session: AiSession) => {
  emit('session-selected', session)
}

const handleEndSession = (session: AiSession) => {
  emit('session-ended', session.id)
}

const handleDeleteSession = (session: AiSession) => {
  sessionToDelete.value = session
}

const confirmDelete = () => {
  if (sessionToDelete.value) {
    emit('session-deleted', sessionToDelete.value.id)
    sessionToDelete.value = null
  }
}

const cancelDelete = () => {
  sessionToDelete.value = null
}

const handleFilterChange = () => {
  emit('filters-changed', {
    context: selectedContext.value || undefined,
    status: selectedStatus.value || undefined,
    search: searchQuery.value.trim() || undefined
  })
}

const handleSearch = () => {
  // Debounce search
  clearTimeout((window as any).searchTimeout)
  ;(window as any).searchTimeout = setTimeout(() => {
    handleFilterChange()
  }, 300)
}
</script>

<style scoped>
/* Line clamp utility for message preview */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>