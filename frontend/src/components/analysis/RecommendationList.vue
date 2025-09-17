<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900">智能建议</h2>
        <p class="text-sm text-gray-600 mt-1">
          基于性能诊断生成的个性化改进建议
        </p>
      </div>
      
      <!-- Controls -->
      <div class="flex items-center space-x-3">
        <!-- Filter Dropdown -->
        <div class="relative">
          <select
            v-model="selectedFilter"
            class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">所有建议</option>
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <!-- Sort Dropdown -->
        <div class="relative">
          <select
            v-model="selectedSort"
            class="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="priority">按优先级排序</option>
            <option value="roi">按ROI排序</option>
            <option value="difficulty">按难度排序</option>
            <option value="impact">按影响力排序</option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        <!-- Refresh Button -->
        <button
          @click="$emit('refresh-recommendations')"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <svg 
            class="mr-2 h-4 w-4" 
            :class="{ 'animate-spin': loading }"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          刷新
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-2">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-lg text-gray-600">正在生成个性化建议...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">加载建议失败</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
          <div class="mt-4">
            <button
              @click="$emit('retry-load-recommendations')"
              class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredRecommendations.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.6.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.863 2.613 9.288 6.286"/>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">暂无建议</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ selectedFilter === 'all' ? '当前没有可用的改进建议' : '当前筛选条件下没有匹配的建议' }}
      </p>
    </div>

    <!-- Recommendations Grid -->
    <div v-else>
      <!-- Summary Stats -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-indigo-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-indigo-900">总建议数</p>
              <p class="text-lg font-semibold text-indigo-600">{{ recommendations.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-red-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-900">高优先级</p>
              <p class="text-lg font-semibold text-red-600">{{ highPriorityCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-900">平均ROI</p>
              <p class="text-lg font-semibold text-green-600">{{ averageROI.toFixed(1) }}</p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-blue-900">简单实施</p>
              <p class="text-lg font-semibold text-blue-600">{{ easyImplementationCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations Cards Grid -->
      <div class="grid gap-6">
        <RecommendationCard
          v-for="recommendation in paginatedRecommendations"
          :key="recommendation.id"
          :recommendation="recommendation"
          @implement="handleImplement"
          @bookmark="handleBookmark"
          @share="handleShare"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <!-- Mobile pagination -->
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        
        <!-- Desktop pagination -->
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              显示第
              <span class="font-medium">{{ startIndex + 1 }}</span>
              到
              <span class="font-medium">{{ Math.min(endIndex, filteredRecommendations.length) }}</span>
              条，共
              <span class="font-medium">{{ filteredRecommendations.length }}</span>
              条建议
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <!-- Previous button -->
              <button
                @click="currentPage--"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>

              <!-- Page numbers -->
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  page === currentPage
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                ]"
              >
                {{ page }}
              </button>

              <!-- Next button -->
              <button
                @click="currentPage++"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Next</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import RecommendationCard from './RecommendationCard.vue';
import type { GeneratedRecommendation } from '@/types/funnel';

interface Props {
  recommendations: GeneratedRecommendation[];
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
});

const emit = defineEmits<{
  'implement-recommendation': [recommendation: GeneratedRecommendation];
  'bookmark-recommendation': [recommendation: GeneratedRecommendation];
  'share-recommendation': [recommendation: GeneratedRecommendation];
  'refresh-recommendations': [];
  'retry-load-recommendations': [];
}>();

// Local state
const selectedFilter = ref<'all' | 'high' | 'medium' | 'low'>('all');
const selectedSort = ref<'priority' | 'roi' | 'difficulty' | 'impact'>('priority');
const currentPage = ref(1);
const itemsPerPage = 6;

// Computed properties
const filteredRecommendations = computed(() => {
  let filtered = [...props.recommendations];
  
  // Apply filter
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(rec => rec.priority === selectedFilter.value);
  }
  
  // Apply sort
  filtered.sort((a, b) => {
    switch (selectedSort.value) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      case 'roi':
        return b.roiEstimate - a.roiEstimate;
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
      case 'impact':
        // Estimate impact based on expected impact text (simplified)
        return b.expectedImpact.length - a.expectedImpact.length;
      default:
        return 0;
    }
  });
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRecommendations.value.length / itemsPerPage);
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage;
});

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage, filteredRecommendations.value.length);
});

const paginatedRecommendations = computed(() => {
  return filteredRecommendations.value.slice(startIndex.value, endIndex.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const highPriorityCount = computed(() => {
  return props.recommendations.filter(rec => rec.priority === 'high').length;
});

const averageROI = computed(() => {
  if (props.recommendations.length === 0) return 0;
  const total = props.recommendations.reduce((sum, rec) => sum + rec.roiEstimate, 0);
  return total / props.recommendations.length;
});

const easyImplementationCount = computed(() => {
  return props.recommendations.filter(rec => rec.difficulty === 'easy').length;
});

// Methods
const handleImplement = (recommendation: GeneratedRecommendation) => {
  emit('implement-recommendation', recommendation);
};

const handleBookmark = (recommendation: GeneratedRecommendation) => {
  emit('bookmark-recommendation', recommendation);
};

const handleShare = (recommendation: GeneratedRecommendation) => {
  emit('share-recommendation', recommendation);
};

// Watchers
watch([selectedFilter, selectedSort], () => {
  currentPage.value = 1; // Reset to first page when filter/sort changes
});
</script>

<style scoped>
/* Custom select styling */
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Animation for loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Smooth transitions */
.transition-colors {
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}

/* Grid responsive adjustments */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Focus styles for accessibility */
button:focus,
select:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Disabled state styles */
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

button:disabled:hover {
  background-color: inherit;
}
</style>