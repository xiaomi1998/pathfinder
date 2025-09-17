<template>
  <div class="recent-activity">
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-8">
        <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="ml-2 text-gray-500">加载活动记录中...</span>
      </div>
    </div>
    
    <div v-else-if="!activities || activities.length === 0" class="empty-state">
      <div class="text-center py-8 text-gray-500">
        <ClockIcon class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无最近活动</p>
        <p class="text-sm mt-2">开始使用系统后这里会显示操作记录</p>
      </div>
    </div>
    
    <div v-else class="activity-list">
      <div class="grid grid-cols-3 gap-3">
        <div 
          v-for="activity in displayedActivities" 
          :key="activity.id"
          class="activity-item flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
          <div class="activity-icon flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 bg-blue-100 dark:bg-blue-900">
            <component :is="getActivityIcon(activity.type)" class="w-3 h-3 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div class="activity-content flex-1 min-w-0">
            <div class="activity-title text-xs font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
              {{ activity.title }}
            </div>
            <div class="activity-time text-xs text-gray-500 dark:text-gray-400">
              {{ formatTimeAgo(activity.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ClockIcon,
  PlusIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  DocumentTextIcon,
  CogIcon,
  UserIcon
} from '@heroicons/vue/24/outline'
import { formatTimeAgo } from '@/utils/dateUtils'

interface Activity {
  id: string
  type: 'data_entry' | 'funnel_created' | 'report_generated' | 'data_missing' | 'funnel_updated' | 'user_action'
  title: string
  description: string
  timestamp: string
}

interface Props {
  activities: Activity[]
  loading?: boolean
}

const props = defineProps<Props>()

// 限制显示6个最近活动
const displayedActivities = computed(() => {
  return props.activities?.slice(0, 6) || []
})

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap = {
    data_entry: PencilSquareIcon,
    funnel_created: PlusIcon,
    funnel_updated: FunnelIcon,
    report_generated: ChartBarIcon,
    data_missing: ExclamationTriangleIcon,
    user_action: UserIcon,
    system: CogIcon
  }
  
  return iconMap[type as keyof typeof iconMap] || DocumentTextIcon
}

// 获取活动图标背景色
const getActivityIconBg = (type: string) => {
  const colorMap = {
    data_entry: 'bg-blue-500',
    funnel_created: 'bg-green-500',
    funnel_updated: 'bg-purple-500',
    report_generated: 'bg-indigo-500',
    data_missing: 'bg-orange-500',
    user_action: 'bg-gray-500',
    system: 'bg-slate-500'
  }
  
  return colorMap[type as keyof typeof colorMap] || 'bg-gray-500'
}
</script>

<style scoped>
.activity-item {
  transition: all 0.2s ease;
}

.activity-content {
  overflow: hidden;
}

.activity-title {
  line-height: 1.4;
}

.loading-state, .empty-state {
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>