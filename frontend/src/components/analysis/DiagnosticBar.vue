<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">性能诊断</h3>
        <div class="flex items-center space-x-2">
          <!-- Health Score -->
          <div class="text-right">
            <div class="text-xs text-gray-500">健康度评分</div>
            <div 
              class="text-lg font-bold"
              :class="getHealthScoreClasses(diagnostics.healthScore)"
            >
              {{ diagnostics.healthScore.toFixed(1) }}
            </div>
          </div>
          
          <!-- Overall Grade -->
          <div 
            class="text-2xl font-bold px-3 py-1 rounded-full text-white"
            :style="{ backgroundColor: getGradeColor(diagnostics.overallGrade) }"
          >
            {{ diagnostics.overallGrade }}
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="p-4">
      <!-- Stage Performance Overview -->
      <div class="mb-6">
        <h4 class="text-sm font-medium text-gray-900 mb-3">各阶段表现概览</h4>
        <div class="grid grid-cols-4 gap-3">
          <div 
            v-for="(stage, stageKey) in diagnostics.stageGrades" 
            :key="stageKey"
            class="text-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-150"
            :class="getStageBackgroundClasses(stage.grade)"
          >
            <div class="text-xs text-gray-600 mb-1">{{ getStageDisplayName(stageKey) }}</div>
            <div 
              class="text-lg font-bold mb-1"
              :style="{ color: getGradeColor(stage.grade) }"
            >
              {{ stage.grade }}
            </div>
            <div class="text-xs text-gray-500">{{ stage.status }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ stage.percentile }}%</div>
          </div>
        </div>
      </div>

      <!-- Weak Points Alert -->
      <div v-if="criticalWeakPoints.length > 0" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1">
              <h5 class="text-sm font-medium text-red-800 mb-1">关键问题警告</h5>
              <ul class="text-sm text-red-700 space-y-1">
                <li v-for="weakPoint in criticalWeakPoints" :key="weakPoint.stage">
                  <strong>{{ getStageDisplayName(weakPoint.stage) }}:</strong> {{ weakPoint.description }}
                  <span class="text-red-600 font-medium ml-1">
                    (需改进 {{ weakPoint.improvementNeeded.toFixed(1) }}%)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Diagnostics - Expandable -->
      <div class="space-y-4">
        <!-- Weak Points Summary -->
        <div v-if="diagnostics.weakPoints.length > 0">
          <button
            @click="showWeakPoints = !showWeakPoints"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
          >
            <div class="flex items-center space-x-2">
              <svg class="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">
                薄弱环节分析 ({{ diagnostics.weakPoints.length }}项)
              </span>
            </div>
            <svg 
              class="h-4 w-4 text-gray-500 transform transition-transform duration-200"
              :class="{ 'rotate-180': showWeakPoints }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-if="showWeakPoints" class="mt-3 space-y-3">
            <div 
              v-for="weakPoint in diagnostics.weakPoints" 
              :key="weakPoint.stage"
              class="border border-gray-200 rounded-lg p-3"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-gray-900">
                      {{ getStageDisplayName(weakPoint.stage) }}
                    </span>
                    <span 
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="getSeverityClasses(weakPoint.severity)"
                    >
                      {{ getSeverityDisplayName(weakPoint.severity) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ weakPoint.description }}</p>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-4 mt-3 text-xs">
                <div>
                  <div class="text-gray-500">当前转化率</div>
                  <div class="font-semibold text-gray-900">{{ weakPoint.currentRate.toFixed(1) }}%</div>
                </div>
                <div>
                  <div class="text-gray-500">行业基准</div>
                  <div class="font-semibold text-green-600">{{ weakPoint.benchmarkRate.toFixed(1) }}%</div>
                </div>
                <div>
                  <div class="text-gray-500">改进空间</div>
                  <div class="font-semibold text-orange-600">+{{ weakPoint.improvementNeeded.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Improvement Priorities -->
        <div v-if="diagnostics.improvementPriorities.length > 0">
          <button
            @click="showImprovementPriorities = !showImprovementPriorities"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
          >
            <div class="flex items-center space-x-2">
              <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">
                改进优先级排序 ({{ diagnostics.improvementPriorities.length }}项)
              </span>
            </div>
            <svg 
              class="h-4 w-4 text-gray-500 transform transition-transform duration-200"
              :class="{ 'rotate-180': showImprovementPriorities }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-if="showImprovementPriorities" class="mt-3 space-y-3">
            <div 
              v-for="(priority, index) in diagnostics.improvementPriorities" 
              :key="priority.stage"
              class="border border-gray-200 rounded-lg p-3"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                  <div 
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    :style="{ backgroundColor: getPriorityColor(priority.priority) }"
                  >
                    {{ index + 1 }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ getStageDisplayName(priority.stage) }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ getPriorityDisplayName(priority.priority) }}优先级
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-blue-600">
                    ROI: {{ priority.roiEstimate.toFixed(1) }}
                  </div>
                  <div class="text-xs text-gray-500">投资回报率</div>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div class="text-gray-500">影响力评分</div>
                  <div class="font-semibold text-green-600">{{ priority.impactScore.toFixed(1) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">实施难度</div>
                  <div class="font-semibold text-orange-600">{{ priority.difficultyScore.toFixed(1) }}</div>
                </div>
                <div>
                  <div class="text-gray-500">ROI评分</div>
                  <div class="font-semibold text-blue-600">{{ priority.roiEstimate.toFixed(1) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cross-Stage Analysis -->
        <div>
          <button
            @click="showCrossStageAnalysis = !showCrossStageAnalysis"
            class="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150"
          >
            <div class="flex items-center space-x-2">
              <svg class="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm font-medium text-gray-900">跨阶段流失分析</span>
            </div>
            <svg 
              class="h-4 w-4 text-gray-500 transform transition-transform duration-200"
              :class="{ 'rotate-180': showCrossStageAnalysis }"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          
          <div v-if="showCrossStageAnalysis" class="mt-3">
            <div class="space-y-3">
              <!-- Flow Consistency -->
              <div class="bg-blue-50 rounded-lg p-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-blue-900">流程一致性</span>
                  <span class="text-lg font-bold text-blue-700">
                    {{ diagnostics.crossStageAnalysis.flowConsistency.toFixed(1) }}%
                  </span>
                </div>
                <div class="mt-2">
                  <div class="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${Math.min(diagnostics.crossStageAnalysis.flowConsistency, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Drop-off Points -->
              <div v-if="diagnostics.crossStageAnalysis.dropOffPoints.length > 0">
                <h5 class="text-sm font-medium text-gray-900 mb-2">流失点分析</h5>
                <div class="space-y-2">
                  <div 
                    v-for="dropOff in diagnostics.crossStageAnalysis.dropOffPoints" 
                    :key="`${dropOff.from}-${dropOff.to}`"
                    class="flex items-center justify-between p-2 border border-gray-200 rounded"
                  >
                    <div class="text-sm">
                      <span class="text-gray-700">{{ dropOff.from }}</span>
                      <span class="text-gray-400 mx-2">→</span>
                      <span class="text-gray-700">{{ dropOff.to }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <span 
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        :class="getDropOffSeverityClasses(dropOff.severity)"
                      >
                        {{ dropOff.severity }}
                      </span>
                      <span class="text-sm font-semibold text-red-600">
                        {{ dropOff.dropOffRate.toFixed(1) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottleneck Stage -->
              <div v-if="diagnostics.crossStageAnalysis.bottleneckStage" class="bg-orange-50 rounded-lg p-3">
                <div class="flex items-center space-x-2">
                  <svg class="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                  <span class="text-sm font-medium text-orange-900">主要瓶颈阶段</span>
                </div>
                <div class="mt-2 text-sm text-orange-800">
                  <strong>{{ getStageDisplayName(diagnostics.crossStageAnalysis.bottleneckStage) }}</strong>
                  是当前流程的主要瓶颈，建议优先改进。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex space-x-3">
        <button
          @click="$emit('generate-recommendations')"
          class="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          生成改进建议
        </button>
        <button
          @click="$emit('export-diagnostics')"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          导出诊断报告
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DiagnosticResult } from '@/types/funnel';

interface Props {
  diagnostics: DiagnosticResult;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'generate-recommendations': [];
  'export-diagnostics': [];
}>();

// Local state
const showWeakPoints = ref(false);
const showImprovementPriorities = ref(false);
const showCrossStageAnalysis = ref(false);

// Computed properties
const criticalWeakPoints = computed(() => {
  return props.diagnostics.weakPoints.filter(wp => wp.severity === 'critical');
});

// Helper methods
const getGradeColor = (grade: string): string => {
  const colors = {
    A: '#10B981', // green-500
    B: '#3B82F6', // blue-500
    C: '#F59E0B', // yellow-500
    D: '#F97316', // orange-500
    F: '#EF4444'  // red-500
  };
  return colors[grade as keyof typeof colors] || '#6B7280';
};

const getHealthScoreClasses = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

const getStageBackgroundClasses = (grade: string): string => {
  const classes = {
    A: 'bg-green-50 border-green-200',
    B: 'bg-blue-50 border-blue-200',
    C: 'bg-yellow-50 border-yellow-200',
    D: 'bg-orange-50 border-orange-200',
    F: 'bg-red-50 border-red-200'
  };
  return classes[grade as keyof typeof classes] || 'bg-gray-50 border-gray-200';
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

const getSeverityClasses = (severity: string): string => {
  const classes = {
    critical: 'bg-red-100 text-red-800',
    major: 'bg-orange-100 text-orange-800',
    minor: 'bg-yellow-100 text-yellow-800'
  };
  return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const getSeverityDisplayName = (severity: string): string => {
  const names = {
    critical: '严重',
    major: '重要',
    minor: '轻微'
  };
  return names[severity as keyof typeof names] || severity;
};

const getPriorityColor = (priority: string): string => {
  const colors = {
    high: '#EF4444',   // red-500
    medium: '#F59E0B', // yellow-500
    low: '#10B981'     // green-500
  };
  return colors[priority as keyof typeof colors] || '#6B7280';
};

const getPriorityDisplayName = (priority: string): string => {
  const names = {
    high: '高',
    medium: '中',
    low: '低'
  };
  return names[priority as keyof typeof names] || priority;
};

const getDropOffSeverityClasses = (severity: string): string => {
  const classes = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };
  return classes[severity as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};
</script>

<style scoped>
/* Custom animations */
.transition-all {
  transition: all 0.2s ease-in-out;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Progress bar animations */
.transition-all {
  transition: all 0.3s ease-in-out;
}

/* Hover effects */
.hover\:border-gray-300:hover {
  border-color: #d1d5db;
}

.hover\:bg-gray-100:hover {
  background-color: #f3f4f6;
}

/* Focus styles */
button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Custom scrollbar if needed */
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