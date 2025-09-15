<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3">
          <!-- Priority Indicator -->
          <div 
            class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
            :class="getPriorityColorClasses(recommendation.priority)"
          ></div>
          
          <!-- Title and Category -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 leading-tight">
              {{ recommendation.title }}
            </h3>
            <div class="flex items-center space-x-2 mt-1">
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="getCategoryClasses(recommendation.category)"
              >
                {{ getCategoryDisplayName(recommendation.category) }}
              </span>
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="getPriorityBadgeClasses(recommendation.priority)"
              >
                {{ getPriorityDisplayName(recommendation.priority) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- ROI Score -->
        <div class="flex flex-col items-end">
          <div class="text-right">
            <div class="text-sm text-gray-500">ROI评分</div>
            <div 
              class="text-lg font-bold"
              :class="getROIScoreClasses(recommendation.roiEstimate)"
            >
              {{ recommendation.roiEstimate.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Description -->
      <p class="text-sm text-gray-700 mb-4 leading-relaxed">
        {{ recommendation.description }}
      </p>

      <!-- Expected Impact -->
      <div class="mb-4">
        <div class="flex items-center space-x-2 mb-2">
          <svg class="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          <span class="text-sm font-medium text-gray-900">预期影响</span>
        </div>
        <p class="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          {{ recommendation.expectedImpact }}
        </p>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <div class="text-xs text-gray-500">实施时间</div>
          <div class="text-sm font-semibold text-gray-900">{{ recommendation.implementationTime }}</div>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <div class="text-xs text-gray-500">难度等级</div>
          <div 
            class="text-sm font-semibold"
            :class="getDifficultyClasses(recommendation.difficulty)"
          >
            {{ getDifficultyDisplayName(recommendation.difficulty) }}
          </div>
        </div>
        <div class="text-center p-2 bg-gray-50 rounded-lg">
          <div class="text-xs text-gray-500">适用阶段</div>
          <div class="text-sm font-semibold text-gray-900">
            {{ recommendation.applicableStages.length }}个
          </div>
        </div>
      </div>

      <!-- Expandable Content -->
      <div class="space-y-4">
        <!-- Action Items - Always Visible (First Few) -->
        <div v-if="recommendation.actionItems.length > 0">
          <div class="flex items-center space-x-2 mb-2">
            <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2H9m0 0V3a2 2 0 112 0v2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span class="text-sm font-medium text-gray-900">行动项目</span>
          </div>
          <ul class="space-y-2">
            <li 
              v-for="(item, index) in getVisibleActionItems" 
              :key="index"
              class="flex items-start space-x-2"
            >
              <div class="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <span class="text-sm text-gray-700">{{ item }}</span>
            </li>
          </ul>
          
          <!-- Show More/Less Button for Action Items -->
          <button
            v-if="recommendation.actionItems.length > 3"
            @click="showAllActionItems = !showAllActionItems"
            class="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {{ showAllActionItems ? '收起' : `查看更多 (${recommendation.actionItems.length - 3}项)` }}
          </button>
        </div>

        <!-- Expandable Detailed Content -->
        <div v-if="expanded" class="space-y-4 pt-4 border-t border-gray-100">
          <!-- Resources Required -->
          <div v-if="recommendation.resources.length > 0">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">所需资源</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="(resource, index) in recommendation.resources" 
                :key="index"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {{ resource }}
              </span>
            </div>
          </div>

          <!-- Success Metrics -->
          <div v-if="recommendation.successMetrics.length > 0">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">成功指标</span>
            </div>
            <ul class="space-y-1">
              <li 
                v-for="(metric, index) in recommendation.successMetrics" 
                :key="index"
                class="flex items-start space-x-2"
              >
                <div class="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                <span class="text-sm text-gray-700">{{ metric }}</span>
              </li>
            </ul>
          </div>

          <!-- Applicable Stages Details -->
          <div v-if="recommendation.applicableStages.length > 0">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">适用阶段</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="stage in recommendation.applicableStages" 
                :key="stage"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {{ getStageDisplayName(stage) }}
              </span>
            </div>
          </div>

          <!-- Customized Content -->
          <div v-if="recommendation.customizedContent" class="bg-blue-50 rounded-lg p-3">
            <div class="flex items-center space-x-2 mb-2">
              <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-blue-900">个性化建议</span>
            </div>
            <div class="text-sm text-blue-800">
              <div v-if="recommendation.customizedContent.currentPerformance" class="mb-2">
                <strong>当前表现：</strong>
                <span class="ml-1">整体转化率 {{ recommendation.customizedContent.currentPerformance.overall }}%</span>
              </div>
              <div v-if="recommendation.customizedContent.targetImprovement">
                <strong>改进目标：</strong>
                <span class="ml-1">预计提升 {{ recommendation.customizedContent.targetImprovement.overall || 2 }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Expand/Collapse Button -->
        <div class="pt-2 border-t border-gray-100">
          <button
            @click="expanded = !expanded"
            class="w-full flex items-center justify-center space-x-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <span>{{ expanded ? '收起详情' : '查看详情' }}</span>
            <svg 
              class="h-4 w-4 transform transition-transform duration-200"
              :class="{ 'rotate-180': expanded }"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3 pt-2">
          <button
            @click="$emit('implement', recommendation)"
            class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            开始实施
          </button>
          <button
            @click="$emit('bookmark', recommendation)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </button>
          <button
            @click="$emit('share', recommendation)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GeneratedRecommendation } from '@/types/funnel';

interface Props {
  recommendation: GeneratedRecommendation;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  implement: [recommendation: GeneratedRecommendation];
  bookmark: [recommendation: GeneratedRecommendation];
  share: [recommendation: GeneratedRecommendation];
}>();

// Local state
const expanded = ref(false);
const showAllActionItems = ref(false);

// Computed
const getVisibleActionItems = computed(() => {
  if (showAllActionItems.value) {
    return props.recommendation.actionItems;
  }
  return props.recommendation.actionItems.slice(0, 3);
});

// Helper methods
const getPriorityColorClasses = (priority: string): string => {
  const classes = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };
  return classes[priority as keyof typeof classes] || 'bg-gray-500';
};

const getPriorityBadgeClasses = (priority: string): string => {
  const classes = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800', 
    low: 'bg-green-100 text-green-800'
  };
  return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getPriorityDisplayName = (priority: string): string => {
  const names = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  };
  return names[priority as keyof typeof names] || priority;
};

const getCategoryClasses = (category: string): string => {
  const classes = {
    traffic_acquisition: 'bg-blue-100 text-blue-800',
    landing_page_optimization: 'bg-purple-100 text-purple-800',
    user_experience_improvement: 'bg-teal-100 text-teal-800',
    content_optimization: 'bg-orange-100 text-orange-800',
    technical_performance: 'bg-gray-100 text-gray-800',
    personalization: 'bg-pink-100 text-pink-800',
    conversion_path_optimization: 'bg-indigo-100 text-indigo-800',
    customer_service_improvement: 'bg-green-100 text-green-800',
    pricing_strategy_adjustment: 'bg-red-100 text-red-800'
  };
  return classes[category as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getCategoryDisplayName = (category: string): string => {
  const names = {
    traffic_acquisition: '流量获取',
    landing_page_optimization: '页面优化',
    user_experience_improvement: '体验改进',
    content_optimization: '内容优化',
    technical_performance: '技术性能',
    personalization: '个性化',
    conversion_path_optimization: '路径优化',
    customer_service_improvement: '客户服务',
    pricing_strategy_adjustment: '定价策略'
  };
  return names[category as keyof typeof names] || category;
};

const getDifficultyClasses = (difficulty: string): string => {
  const classes = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600'
  };
  return classes[difficulty as keyof typeof classes] || 'text-gray-600';
};

const getDifficultyDisplayName = (difficulty: string): string => {
  const names = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return names[difficulty as keyof typeof names] || difficulty;
};

const getROIScoreClasses = (score: number): string => {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-blue-600';
  if (score >= 4) return 'text-yellow-600';
  return 'text-red-600';
};

const getStageDisplayName = (stage: string): string => {
  const names = {
    stage_1: '线索生成',
    stage_2: '有效触达',
    stage_3: '商机转化',
    stage_4: '成交完成'
  };
  return names[stage as keyof typeof names] || stage;
};
</script>

<style scoped>
/* Custom animations for smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Hover effects for interactive elements */
.hover\:shadow-md:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Focus styles for accessibility */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Custom scrollbar for overflow content */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>