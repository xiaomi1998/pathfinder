<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Page header -->
    <div class="bg-white shadow-sm">
      <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              AI陪练助手
            </h1>
            <p class="mt-1 text-sm text-gray-500">
              通过AI对话提升您的销售技能和沟通能力
            </p>
          </div>
          
          <!-- AI Status indicator -->
          <div v-if="aiStore.aiStatus" class="flex items-center gap-3">
            <div :class="[
              'inline-flex items-center gap-x-1.5 rounded-md px-3 py-2 text-sm font-medium',
              aiStore.aiStatus.modelAvailable
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            ]">
              <div :class="[
                'h-1.5 w-1.5 rounded-full',
                aiStore.aiStatus.modelAvailable ? 'bg-green-500' : 'bg-red-500'
              ]" />
              {{ aiStore.aiStatus.modelAvailable ? 'AI服务正常' : 'AI服务异常' }}
            </div>
            
            <button
              type="button"
              class="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              @click="showStats = true"
            >
              <ChartBarIcon class="-ml-0.5 h-4 w-4" aria-hidden="true" />
              使用统计
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <!-- Quick stats -->
      <div v-if="aiStore.aiStats" class="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChatBubbleLeftRightIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">总对话数</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ aiStore.aiStats.totalSessions }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <PaperAirplaneIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">总消息数</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ aiStore.aiStats.totalMessages }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ClockIcon class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">平均时长</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ Math.round(aiStore.aiStats.averageSessionDuration) }}分钟
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <component :is="getMostUsedContextIcon()" class="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">常用场景</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    {{ getMostUsedContextLabel() }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature cards -->
      <div v-if="!showChatInterface" class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center mb-4">
            <UserGroupIcon class="h-8 w-8 text-indigo-600" />
            <h3 class="ml-3 text-lg font-medium text-gray-900">邀约练习</h3>
          </div>
          <p class="text-gray-600 mb-4">
            通过AI模拟客户对话，练习邀约技巧，提升邀约成功率。学习如何建立信任和引起客户兴趣。
          </p>
          <button
            type="button"
            class="w-full inline-flex justify-center items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            @click="startSession('invitation')"
          >
            <UserGroupIcon class="h-4 w-4" />
            开始邀约练习
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center mb-4">
            <ExclamationTriangleIcon class="h-8 w-8 text-yellow-600" />
            <h3 class="ml-3 text-lg font-medium text-gray-900">异议处理</h3>
          </div>
          <p class="text-gray-600 mb-4">
            学习处理各种客户异议和反对意见，掌握转化技巧，提高成单率。模拟真实场景对话。
          </p>
          <button
            type="button"
            class="w-full inline-flex justify-center items-center gap-x-2 rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
            @click="startSession('objection_handling')"
          >
            <ExclamationTriangleIcon class="h-4 w-4" />
            开始异议处理
          </button>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex items-center mb-4">
            <ChatBubbleLeftRightIcon class="h-8 w-8 text-green-600" />
            <h3 class="ml-3 text-lg font-medium text-gray-900">通用对话</h3>
          </div>
          <p class="text-gray-600 mb-4">
            与AI助手进行开放式对话，获得各种销售建议、策略制定和问题解答。全方位的智能支持。
          </p>
          <button
            type="button"
            class="w-full inline-flex justify-center items-center gap-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            @click="startSession('general')"
          >
            <ChatBubbleLeftRightIcon class="h-4 w-4" />
            开始通用对话
          </button>
        </div>
      </div>

      <!-- Quick actions -->
      <div v-if="!showChatInterface" class="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">快速操作</h3>
        </div>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            @click="showChatInterface = true"
          >
            <ChatBubbleLeftRightIcon class="h-4 w-4" />
            打开聊天界面
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            @click="loadRecentSessions"
          >
            <ClockIcon class="h-4 w-4" />
            查看历史对话
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            @click="showStats = true"
          >
            <ChartBarIcon class="h-4 w-4" />
            使用统计
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            @click="refreshAiStatus"
          >
            <ArrowPathIcon class="h-4 w-4" />
            刷新状态
          </button>
        </div>
      </div>

      <!-- Chat interface -->
      <div v-if="showChatInterface" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">AI对话界面</h3>
          <button
            type="button"
            class="inline-flex items-center gap-x-1.5 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
            @click="showChatInterface = false"
          >
            <XMarkIcon class="h-4 w-4" />
            关闭
          </button>
        </div>
        
        <div class="h-96 lg:h-[600px] flex items-center justify-center">
          <div class="text-gray-500">AI聊天界面暂时不可用</div>
        </div>
      </div>

      <!-- Recent sessions -->
      <div v-if="!showChatInterface && recentSessions.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">最近的对话</h3>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div
            v-for="session in recentSessions"
            :key="session.id"
            class="px-6 py-4 hover:bg-gray-50 cursor-pointer"
            @click="openSession(session)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <component
                  :is="getContextIcon(session.sessionContext)"
                  class="h-5 w-5 text-gray-400"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ getContextLabel(session.sessionContext) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatSessionTime(session.updatedAt) }} · {{ session.messageCount || 0 }} 条消息
                  </div>
                </div>
              </div>
              
              <div :class="[
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                session.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]">
                {{ session.status === 'active' ? '进行中' : '已结束' }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            @click="showChatInterface = true"
          >
            查看所有对话 →
          </button>
        </div>
      </div>
    </div>

    <!-- Stats modal -->
    <div v-if="showStats" class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">使用统计</h3>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-500"
                @click="showStats = false"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>
            
            <div v-if="aiStore.aiStats" class="space-y-6">
              <!-- Overview stats -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-indigo-600">{{ aiStore.aiStats.totalSessions }}</div>
                  <div class="text-sm text-gray-600">总对话数</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="text-2xl font-bold text-indigo-600">{{ aiStore.aiStats.totalMessages }}</div>
                  <div class="text-sm text-gray-600">总消息数</div>
                </div>
              </div>

              <!-- Recent activity -->
              <div v-if="aiStore.aiStats.recentActivity && aiStore.aiStats.recentActivity.length > 0">
                <h4 class="text-sm font-medium text-gray-900 mb-3">最近活动</h4>
                <div class="space-y-2">
                  <div
                    v-for="activity in aiStore.aiStats.recentActivity"
                    :key="activity.date"
                    class="flex items-center justify-between text-sm"
                  >
                    <span class="text-gray-600">{{ activity.date }}</span>
                    <span class="text-gray-900">
                      {{ activity.sessionCount }} 场对话, {{ activity.messageCount }} 条消息
                    </span>
                  </div>
                </div>
              </div>

              <!-- AI Status -->
              <div v-if="aiStore.aiStatus">
                <h4 class="text-sm font-medium text-gray-900 mb-3">AI服务状态</h4>
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">模型状态</span>
                    <span :class="[
                      'text-sm font-medium',
                      aiStore.aiStatus.modelAvailable ? 'text-green-600' : 'text-red-600'
                    ]">
                      {{ aiStore.aiStatus.modelAvailable ? '正常' : '异常' }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-gray-600">模型名称</span>
                    <span class="text-sm font-medium text-gray-900">{{ aiStore.aiStatus.modelName }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">消息长度限制</span>
                    <span class="text-sm font-medium text-gray-900">{{ aiStore.aiStatus.limits.maxMessageLength }} 字符</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                type="button"
                class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                @click="showStats = false"
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
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'
// import { useAiStore } from '@/stores/ai'
// import { aiHelpers } from '@/api/ai'
// import AIChat from '@/components/ai/AIChat.vue'
import type { AiSession } from '@/types/ai'

// Store
// const aiStore = useAiStore()
const aiStore = ref({
  aiStatus: null,
  aiStats: null,
  sessions: [],
  currentSession: null,
  isLoading: false,
  sessionsPagination: { hasNext: false }
})

// State
const showChatInterface = ref(false)
const showStats = ref(false)
const recentSessions = ref<AiSession[]>([])

// Computed
const getMostUsedContextIcon = () => {
  if (!aiStore.aiStats?.mostUsedContext) return ChatBubbleLeftRightIcon
  
  const iconMap = {
    general: ChatBubbleLeftRightIcon,
    invitation: UserGroupIcon,
    objection_handling: ExclamationTriangleIcon
  }
  
  return iconMap[aiStore.aiStats.mostUsedContext as keyof typeof iconMap] || ChatBubbleLeftRightIcon
}

const getMostUsedContextLabel = () => {
  return '通用对话'
}

// Methods
const startSession = async (context: 'invitation' | 'objection_handling' | 'general') => {
  // await aiStore.startNewSession(context)
  showChatInterface.value = true
}

const loadRecentSessions = async () => {
  // await aiStore.loadSessions({ limit: 5 })
  // recentSessions.value = aiStore.sessions.slice(0, 5)
}

const openSession = async (session: AiSession) => {
  // await aiStore.switchToSession(session.id)
  showChatInterface.value = true
}

const refreshAiStatus = async () => {
  // await aiStore.loadAiStatus()
}

const getContextIcon = (context: string) => {
  const iconMap = {
    general: ChatBubbleLeftRightIcon,
    invitation: UserGroupIcon,
    objection_handling: ExclamationTriangleIcon
  }
  return iconMap[context as keyof typeof iconMap] || ChatBubbleLeftRightIcon
}

const getContextLabel = (context: string) => {
  const labelMap = {
    general: '通用对话',
    invitation: '邀约练习',
    objection_handling: '异议处理'
  }
  return labelMap[context as keyof typeof labelMap] || context
}

const formatSessionTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return '刚刚'
  } else if (diffInHours < 24) {
    return format(date, 'HH:mm', { locale: zhCN })
  } else if (diffInHours < 48) {
    return '昨天 ' + format(date, 'HH:mm', { locale: zhCN })
  } else {
    return format(date, 'MM-dd HH:mm', { locale: zhCN })
  }
}

// Lifecycle
onMounted(async () => {
  // await aiStore.initialize()
  await loadRecentSessions()
})
</script>