<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          <div>
            <router-link to="/funnels" class="text-indigo-600 hover:text-indigo-500 mb-2 inline-block">
              ← 返回漏斗列表
            </router-link>
            <h1 class="text-3xl font-bold text-gray-900">{{ funnel.name }}</h1>
            <p class="text-gray-600 mt-2">{{ funnel.description }}</p>
          </div>
          <div class="flex space-x-3">
            <router-link
              :to="`/funnels/${$route.params.id}/edit`"
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              编辑漏斗
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p class="text-gray-500">加载漏斗详情中...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-12">
          <div class="text-red-600 mb-4">
            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p class="text-lg font-medium">加载失败</p>
            <p class="text-sm text-gray-600 mt-1">{{ error }}</p>
          </div>
          <router-link to="/funnels" class="text-indigo-600 hover:text-indigo-500">
            ← 返回漏斗列表
          </router-link>
        </div>

        <!-- Content -->
        <div v-else>
          <!-- Overview Stats -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</div>
            <div class="text-sm text-gray-500">总用户数</div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-2xl font-bold text-green-600">{{ stats.conversionRate }}%</div>
            <div class="text-sm text-gray-500">转化率</div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-2xl font-bold text-blue-600">{{ stats.averageTime }}</div>
            <div class="text-sm text-gray-500">平均时间</div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-2xl font-bold text-red-600">{{ stats.dropOffRate }}%</div>
            <div class="text-sm text-gray-500">流失率</div>
          </div>
        </div>

        <!-- Funnel Visualization -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">漏斗流程</h3>
          </div>
          <div class="p-4">
            <div class="space-y-2">
              <div
                v-for="(step, index) in funnel.steps"
                :key="index"
                class="relative"
              >
                <!-- Step Container -->
                <div class="flex items-start space-x-3">
                  <!-- Step Number -->
                  <div class="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {{ index + 1 }}
                  </div>
                  
                  <!-- Step Content -->
                  <div class="flex-1 min-w-0">
                    <!-- Step Bar Container -->
                    <div class="relative">
                      <div class="bg-gray-200 rounded-md h-10 relative overflow-hidden">
                        <!-- Progress Bar -->
                        <div
                          :style="{ width: `${Math.max(step.percentage, 5)}%` }"
                          :class="{
                            'bg-gradient-to-r from-green-500 to-green-600': step.percentage >= 80,
                            'bg-gradient-to-r from-yellow-500 to-yellow-600': step.percentage >= 50 && step.percentage < 80,
                            'bg-gradient-to-r from-orange-500 to-orange-600': step.percentage >= 20 && step.percentage < 50,
                            'bg-gradient-to-r from-red-500 to-red-600': step.percentage < 20
                          }"
                          class="h-full transition-all duration-500 ease-in-out"
                        ></div>
                        
                        <!-- Step Info Overlay -->
                        <div class="absolute inset-0 flex items-center px-2">
                          <div class="flex-1 flex items-center justify-between">
                            <span class="text-white font-medium text-xs drop-shadow-md truncate pr-2">
                              {{ step.name }}
                            </span>
                            <div class="flex items-center space-x-2 flex-shrink-0">
                              <span class="text-white/90 text-xs drop-shadow-md bg-black/20 px-1.5 py-0.5 rounded">
                                {{ step.percentage.toFixed(1) }}%
                              </span>
                              <div class="flex items-center space-x-1">
                                <span class="text-white font-bold text-xs drop-shadow-md">
                                  {{ step.users.toLocaleString() }}
                                </span>
                                <span class="text-white/90 text-xs drop-shadow-md">
                                  用户
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Drop-off indicator - Fixed width container -->
                  <div class="flex-shrink-0 w-24 text-right">
                    <template v-if="index < funnel.steps.length - 1">
                      <template v-if="funnel.steps[index].users >= funnel.steps[index + 1].users && funnel.steps[index].users > 0">
                        <div class="text-red-600 text-xs">
                          <div class="font-semibold">
                            -{{ (funnel.steps[index].users - funnel.steps[index + 1].users).toLocaleString() }}
                          </div>
                          <div class="text-xs text-red-500">
                            流失 {{ ((funnel.steps[index].users - funnel.steps[index + 1].users) / funnel.steps[index].users * 100).toFixed(1) }}%
                          </div>
                        </div>
                      </template>
                      <template v-else-if="funnel.steps[index + 1].users > funnel.steps[index].users">
                        <div class="text-green-600 text-xs">
                          <div class="font-semibold">
                            +{{ (funnel.steps[index + 1].users - funnel.steps[index].users).toLocaleString() }}
                          </div>
                          <div class="text-xs text-green-500">
                            增长 {{ ((funnel.steps[index + 1].users - funnel.steps[index].users) / funnel.steps[index].users * 100).toFixed(1) }}%
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="text-gray-400 text-xs">
                          <div class="font-semibold">-</div>
                          <div class="text-xs">无变化</div>
                        </div>
                      </template>
                    </template>
                  </div>
                </div>
                
                <!-- Connection Arrow -->
                <div v-if="index < funnel.steps.length - 1" class="flex justify-center mt-0.5 mb-0.5">
                  <div class="w-5 h-3 flex items-center justify-center">
                    <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Analysis -->
        <div class="bg-white rounded-lg shadow mb-8">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 class="text-lg font-semibold text-gray-900">AI 智能分析</h3>
                <span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">Beta</span>
              </div>
              <button
                @click="generateAIAnalysis"
                :disabled="isGeneratingAnalysis"
                class="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg v-if="isGeneratingAnalysis" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{{ isGeneratingAnalysis ? '分析中...' : '生成分析' }}</span>
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <!-- Analysis Loading State -->
            <div v-if="isGeneratingAnalysis" class="text-center py-12">
              <div class="animate-pulse">
                <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p class="text-gray-600">AI 正在分析您的漏斗数据...</p>
                <p class="text-sm text-gray-500 mt-1">这可能需要几秒钟时间</p>
              </div>
            </div>

            <!-- Analysis Results -->
            <div v-else-if="analysisResult" class="space-y-6">
              <!-- Overall Assessment -->
              <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <h4 class="text-lg font-medium text-gray-900 mb-2">整体评估</h4>
                    <p class="text-gray-700">{{ analysisResult.overallAssessment }}</p>
                    <div class="mt-2">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="getScoreColor(analysisResult.score)">
                        评分: {{ analysisResult.score }}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Key Insights -->
              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
                  </svg>
                  关键洞察
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="(insight, index) in analysisResult.keyInsights" :key="index" 
                       class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div class="flex items-start space-x-2">
                      <div class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {{ index + 1 }}
                      </div>
                      <div>
                        <h5 class="font-medium text-gray-900 mb-1">{{ insight.title }}</h5>
                        <p class="text-sm text-gray-700">{{ insight.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Optimization Suggestions -->
              <div>
                <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  优化建议
                </h4>
                <div class="space-y-3">
                  <div v-for="(suggestion, index) in analysisResult.optimizationSuggestions" :key="index"
                       class="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                          <h5 class="font-medium text-gray-900">{{ suggestion.title }}</h5>
                          <span class="text-xs font-medium px-2 py-1 rounded-full"
                                :class="getPriorityColor(suggestion.priority)">
                            {{ getPriorityText(suggestion.priority) }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700 mb-2">{{ suggestion.description }}</p>
                        <div class="flex items-center text-xs text-gray-600">
                          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          预期提升: {{ suggestion.expectedImprovement }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Risk Analysis -->
              <div v-if="analysisResult.risks && analysisResult.risks.length > 0">
                <h4 class="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  风险分析
                </h4>
                <div class="space-y-3">
                  <div v-for="(risk, index) in analysisResult.risks" :key="index"
                       class="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                          <h5 class="font-medium text-gray-900">{{ risk.title }}</h5>
                          <span class="text-xs font-medium px-2 py-1 rounded-full"
                                :class="getRiskLevelColor(risk.level)">
                            {{ getRiskLevelText(risk.level) }}
                          </span>
                        </div>
                        <p class="text-sm text-gray-700">{{ risk.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Analysis Metadata -->
              <div class="border-t pt-4 text-xs text-gray-500">
                <p>分析时间: {{ formatAnalysisTime(analysisResult.generatedAt) }}</p>
                <p>基于数据: {{ funnel.steps.length }} 个步骤，总计 {{ stats.totalUsers.toLocaleString() }} 用户</p>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="text-center py-12">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">AI 分析就绪</h3>
              <p class="text-gray-500 mb-4">点击"生成分析"按钮，AI 将为您的漏斗提供深度洞察和优化建议</p>
              <div class="flex items-center justify-center space-x-4 text-sm text-gray-400">
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  性能分析
                </div>
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  优化建议
                </div>
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  风险识别
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step Details -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">步骤详情</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">步骤</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户数</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">转化率</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">流失</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均时间</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(step, index) in funnel.steps" :key="index">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="text-sm font-medium text-gray-900">{{ step.name }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ step.users }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ step.percentage }}%</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <template v-if="index < funnel.steps.length - 1 && funnel.steps[index].users > 0">
                      <span v-if="funnel.steps[index].users >= funnel.steps[index + 1].users" class="text-red-600">
                        -{{ funnel.steps[index].users - funnel.steps[index + 1].users }}
                      </span>
                      <span v-else class="text-green-600">
                        +{{ funnel.steps[index + 1].users - funnel.steps[index].users }}
                      </span>
                    </template>
                    <template v-else>
                      <span class="text-gray-400">-</span>
                    </template>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ `${Math.floor(Math.random() * 3) + 2}m ${Math.floor(Math.random() * 60)}s` }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFunnel } from '@composables/useFunnel'

const route = useRoute()
const router = useRouter()

const { fetchFunnelById, isLoading, error } = useFunnel()
const funnelData = ref(null)

// AI Analysis state
const isGeneratingAnalysis = ref(false)
const analysisResult = ref(null)

const funnel = computed(() => {
  if (!funnelData.value) {
    return {
      name: '加载中...',
      description: '',
      status: 'active',
      steps: []
    }
  }
  
  const rawFunnel = funnelData.value
  const nodes = rawFunnel.canvasData?.nodes || []
  
  // 将节点转换为步骤格式，用于漏斗可视化
  const steps = nodes.map((node, index) => {
    // 直接使用节点的data字段作为用户数量
    const userCount = typeof node.data === 'number' ? node.data : 0
    // 计算相对于第一个节点的转化率
    const firstNodeUsers = nodes.length > 0 && typeof nodes[0].data === 'number' ? nodes[0].data : 1
    const percentage = firstNodeUsers > 0 ? ((userCount / firstNodeUsers) * 100).toFixed(1) : 0
    
    return {
      name: node.label || `步骤 ${index + 1}`,
      users: userCount,
      percentage: parseFloat(percentage),
      nodeData: node // 保留原始节点数据以便调试
    }
  })
  
  return {
    name: rawFunnel.name || '未命名漏斗',
    description: rawFunnel.description || '暂无描述',
    status: rawFunnel.status || 'active',
    steps: steps,
    nodeCount: nodes.length,
    edgeCount: rawFunnel.canvasData?.connections?.length || 0,
    createdAt: rawFunnel.createdAt,
    updatedAt: rawFunnel.updatedAt
  }
})

const stats = computed(() => {
  const steps = funnel.value.steps
  if (steps.length === 0) {
    return {
      totalUsers: 0,
      conversionRate: 0,
      averageTime: '0m 0s',
      dropOffRate: 0
    }
  }
  
  // 漏斗分析：总用户数 = 第一个节点（入口）的用户数
  const totalUsers = steps[0]?.users || 0
  
  // 转化用户数 = 最后一个节点的用户数
  const convertedUsers = steps[steps.length - 1]?.users || 0
  
  // 整体转化率 = 最后一个节点用户数 / 第一个节点用户数
  const overallConversionRate = totalUsers > 0 ? ((convertedUsers / totalUsers) * 100).toFixed(1) : 0
  
  // 流失率 = (第一个节点用户数 - 最后一个节点用户数) / 第一个节点用户数
  const dropOffRate = totalUsers > 0 ? (((totalUsers - convertedUsers) / totalUsers) * 100).toFixed(1) : 0
  
  // 模拟平均时间数据（可以后续从节点中添加时间字段）
  const averageTimeStr = steps.length > 0 ? `${Math.floor(Math.random() * 5) + 3}m ${Math.floor(Math.random() * 60)}s` : '0m 0s'
  
  return {
    totalUsers: totalUsers,
    conversionRate: parseFloat(overallConversionRate),
    averageTime: averageTimeStr,
    dropOffRate: parseFloat(dropOffRate)
  }
})

// AI Analysis functions
const generateAIAnalysis = async () => {
  if (isGeneratingAnalysis.value) return
  
  try {
    isGeneratingAnalysis.value = true
    
    // Simulate AI analysis API call with delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate mock analysis result based on funnel data
    const steps = funnel.value.steps
    const totalUsers = stats.value.totalUsers
    const conversionRate = stats.value.conversionRate
    const dropOffRate = stats.value.dropOffRate
    
    // Generate analysis based on performance
    let overallAssessment = ""
    let score = 0
    
    if (conversionRate >= 80) {
      overallAssessment = "您的漏斗表现优秀！转化率高达" + conversionRate + "%，远超行业平均水平。继续保持这种优势，并关注用户体验的细节优化。"
      score = 85 + Math.floor(Math.random() * 10)
    } else if (conversionRate >= 60) {
      overallAssessment = "漏斗整体表现良好，转化率为" + conversionRate + "%，有一定的优化空间。建议重点关注转化率较低的步骤。"
      score = 70 + Math.floor(Math.random() * 10)
    } else if (conversionRate >= 40) {
      overallAssessment = "漏斗存在明显的优化机会，当前转化率" + conversionRate + "%需要改善。建议深入分析用户流失的关键节点。"
      score = 55 + Math.floor(Math.random() * 10)
    } else {
      overallAssessment = "漏斗转化率" + conversionRate + "%偏低，需要立即采取行动优化。建议重新审视用户体验设计和流程简化。"
      score = 30 + Math.floor(Math.random() * 15)
    }
    
    analysisResult.value = {
      overallAssessment,
      score,
      keyInsights: [
        {
          title: "流失集中度分析",
          description: `最大流失发生在${steps.length > 1 ? steps[1].name : '第二步'}，流失用户占总数的${dropOffRate.toFixed(1)}%`
        },
        {
          title: "用户参与度",
          description: `共有${totalUsers.toLocaleString()}用户进入漏斗，整体参与度${conversionRate > 50 ? '较高' : '有待提升'}`
        },
        {
          title: "转化效率评估",
          description: `平均每个步骤的转化效率为${(conversionRate / steps.length).toFixed(1)}%，${conversionRate > 70 ? '效率良好' : '存在优化空间'}`
        },
        {
          title: "步骤复杂度",
          description: `当前漏斗包含${steps.length}个步骤，${steps.length > 5 ? '步骤较多，建议简化' : '步骤设置合理'}`
        }
      ],
      optimizationSuggestions: generateOptimizationSuggestions(conversionRate, dropOffRate, steps.length),
      risks: generateRiskAnalysis(conversionRate, dropOffRate, totalUsers),
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    // Keep loading state if there's an error
  } finally {
    isGeneratingAnalysis.value = false
  }
}

const generateOptimizationSuggestions = (conversionRate, dropOffRate, stepCount) => {
  const suggestions = []
  
  if (conversionRate < 50) {
    suggestions.push({
      title: "简化用户流程",
      description: "减少不必要的步骤，优化页面加载速度，提升用户体验流畅度",
      priority: "high",
      expectedImprovement: "转化率提升15-25%"
    })
  }
  
  if (dropOffRate > 60) {
    suggestions.push({
      title: "优化关键节点",
      description: "重点分析流失率最高的步骤，改善页面设计和交互流程",
      priority: "high", 
      expectedImprovement: "流失率降低20-30%"
    })
  }
  
  if (stepCount > 5) {
    suggestions.push({
      title: "合并相似步骤",
      description: "将功能相近的步骤合并，减少用户操作次数",
      priority: "medium",
      expectedImprovement: "操作效率提升30%"
    })
  }
  
  suggestions.push({
    title: "A/B测试优化",
    description: "对关键页面进行A/B测试，找出最优的设计方案",
    priority: "medium",
    expectedImprovement: "整体转化率提升10-15%"
  })
  
  return suggestions
}

const generateRiskAnalysis = (conversionRate, dropOffRate, totalUsers) => {
  const risks = []
  
  if (conversionRate < 30) {
    risks.push({
      title: "转化率过低风险",
      description: "当前转化率严重偏低，可能影响业务目标达成",
      level: "high"
    })
  }
  
  if (totalUsers < 1000) {
    risks.push({
      title: "样本量不足",
      description: "用户样本量较小，分析结果可能存在偏差",
      level: "medium"
    })
  }
  
  if (dropOffRate > 80) {
    risks.push({
      title: "用户体验问题",
      description: "流失率过高，可能存在严重的用户体验问题",
      level: "high"
    })
  }
  
  return risks
}

// Utility functions for styling
const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800'
  if (score >= 60) return 'bg-yellow-100 text-yellow-800'
  if (score >= 40) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPriorityText = (priority) => {
  switch (priority) {
    case 'high': return '高优先级'
    case 'medium': return '中优先级'
    case 'low': return '低优先级'
    default: return '普通'
  }
}

const getRiskLevelColor = (level) => {
  switch (level) {
    case 'high': return 'bg-red-100 text-red-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getRiskLevelText = (level) => {
  switch (level) {
    case 'high': return '高风险'
    case 'medium': return '中风险'
    case 'low': return '低风险'
    default: return '未知'
  }
}

const formatAnalysisTime = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  const funnelId = route.params.id as string
  console.log('Loading funnel detail for ID:', funnelId)
  
  try {
    const result = await fetchFunnelById(funnelId)
    if (result) {
      funnelData.value = result
      console.log('Funnel detail loaded:', result)
      console.log('Canvas data:', result.canvasData)
      console.log('Nodes:', result.canvasData?.nodes)
      console.log('Node data samples:', result.canvasData?.nodes?.map(node => ({
        label: node.label,
        data: node.data
      })))
    } else {
      console.error('No funnel found with ID:', funnelId)
      // 可以选择跳转回漏斗列表页面
      // router.push('/funnels')
    }
  } catch (err) {
    console.error('Failed to load funnel detail:', err)
  }
})
</script>