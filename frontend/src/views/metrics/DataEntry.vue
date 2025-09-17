<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-xl p-6 mb-6 shadow-lg">
      <h2 class="text-2xl font-bold mb-2 flex items-center">
        <i class="fas fa-edit mr-3"></i>数据录入中心
      </h2>
      <p class="opacity-90">快速录入您的业务数据，让Pathfinder为您构建精准的增长画像</p>
    </div>
    
    <!-- Tips Card -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
      <div class="flex items-start">
        <i class="fas fa-lightbulb text-yellow-600 dark:text-yellow-400 mr-3 mt-1"></i>
        <div class="flex-1">
          <div class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">录入小贴士</div>
          <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
            <li>建议每日或每周定期录入数据，保持数据的连续性</li>
            <li>确保各阶段数据的逻辑合理性 (上一阶段数量 ≥ 下一阶段数量)</li>
            <li>可以批量导入历史数据，系统会自动计算转化率</li>
            <li class="font-semibold text-blue-600 dark:text-blue-400">先选择要录入数据的漏斗，再查看该漏斗的数据录入情况</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Funnel Selection -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">选择漏斗</h3>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400">加载漏斗数据中...</span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 mr-3"></i>
          <div class="flex-1">
            <div class="font-semibold text-red-800 dark:text-red-200 mb-1">加载失败</div>
            <div class="text-sm text-red-700 dark:text-red-300">{{ error }}</div>
          </div>
          <button 
            @click="fetchFunnels"
            class="px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="funnels.length === 0" class="text-center py-8">
        <i class="fas fa-inbox text-gray-400 text-3xl mb-3"></i>
        <p class="text-gray-600 dark:text-gray-400 mb-4">暂无漏斗数据</p>
        <router-link 
          to="/funnels/create"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <i class="fas fa-plus mr-2"></i>
          创建第一个漏斗
        </router-link>
      </div>
      
      <!-- Funnels Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="funnel in funnels" 
          :key="funnel.id"
          @click="selectFunnel(funnel)"
          :class="[
            'p-5 border-2 rounded-lg cursor-pointer transition-all duration-200',
            selectedFunnel?.id === funnel.id 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
          ]"
        >
          <div class="mb-3">
            <span :class="[
              'inline-block px-2 py-1 rounded-full text-xs font-medium mb-2',
              getFrequencyBadgeClass(funnel.dataPeriod)
            ]">
              {{ getFrequencyText(funnel.dataPeriod) }}
            </span>
            <div class="font-semibold text-gray-900 dark:text-white mb-1">{{ funnel.name }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ funnel.description || '漏斗转化流程分析' }}</div>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center justify-between">
              <span>阶段数: {{ funnel.nodeCount || funnel.nodes?.length || 0 }}</span>
              <span>ID: {{ funnel.id.slice(0, 8) }}...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Entry Form -->
    <div v-if="selectedFunnel" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <!-- Time Selection -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <i class="fas fa-calendar text-blue-600 dark:text-blue-400 mr-2"></i>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ isEditMode ? '编辑数据' : '时间选择' }}
            </h3>
          </div>
          <div v-if="isEditMode" class="flex items-center gap-3">
            <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full">
              编辑模式
            </span>
            <button 
              @click="cancelEdit"
              class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <i class="fas fa-times mr-1"></i>
              取消编辑
            </button>
          </div>
        </div>
        
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div class="flex items-center text-yellow-800 dark:text-yellow-200 text-sm">
            <i class="fas fa-info-circle mr-2"></i>
            <span>当前漏斗为 <strong>{{ getFrequencyText(selectedFunnel.dataPeriod) }}</strong> 模式，请按照对应频率录入数据</span>
          </div>
        </div>
        
        <!-- Date Picker based on frequency -->
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">录入日期</label>
            <input
              v-model="selectedDate"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex gap-2">
            <button
              v-for="(btn, index) in getQuickDateButtons()" 
              :key="index"
              @click="setQuickDate(btn.offset)"
              :class="[
                'px-3 py-2 text-xs border rounded-lg transition-colors',
                selectedDateOffset === btn.offset 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
              ]"
            >
              {{ btn.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stage Data Entry -->
      <div class="mb-8">
        <div class="flex items-center mb-6">
          <i class="fas fa-chart-bar text-blue-600 dark:text-blue-400 mr-2"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">各阶段数据录入</h3>
        </div>

        <div class="space-y-4">
          <div 
            v-for="(stage, index) in funnelStages" 
            :key="stage.id"
            class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <!-- Stage Data Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ stage.name }}
              </label>
              <input
                v-model.number="stageData[stage.id]"
                @input="calculateConversion"
                type="number"
                min="0"
                :placeholder="`输入${stage.name}数量`"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <!-- Additional Info (Channel/Source) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ getStageInfoLabel(index) }}
              </label>
              <select 
                v-model="stageInfo[stage.id]"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                <option v-for="option in getStageInfoOptions(index)" :key="option" :value="option">
                  {{ option }}
                </option>
              </select>
            </div>
            
            <!-- Conversion Rate -->
            <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                {{ getConversionRate(index) }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                {{ index === 0 ? '基准阶段' : '转化率' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="mb-8">
        <div class="flex items-center mb-4">
          <i class="fas fa-sticky-note text-blue-600 dark:text-blue-400 mr-2"></i>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">备注信息</h3>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">数据备注</label>
          <textarea
            v-model="notes"
            rows="3"
            placeholder="记录当天的特殊情况、营销活动或其他影响因素..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between items-center">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          总转化率: <span class="font-semibold text-blue-600 dark:text-blue-400">{{ totalConversionRate }}</span>
          (基于当前输入数据计算)
        </div>
        <div class="flex gap-3">
          <button 
            @click="saveDraft"
            :disabled="!canSave"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i class="fas fa-save"></i>
            保存草稿
          </button>
          <button 
            @click="submitData"
            :disabled="!canSubmit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i :class="isEditMode ? 'fas fa-save' : 'fas fa-check'"></i>
            {{ isEditMode ? '保存修改' : '提交数据' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Entries -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">最近录入记录</h3>
        <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2">
          <i class="fas fa-download"></i>
          导出数据
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">日期</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">漏斗</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">获取线索</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">首次接触</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">产品演示</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">方案确认</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">最终成交</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">总转化率</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in recentEntries" :key="entry.id" class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ formatDate(entry.date) }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.funnelName }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.leads }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.contact }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.demo }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.proposal }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white">{{ entry.closed }}</td>
              <td class="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">{{ entry.conversionRate }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button 
                    @click="editEntry(entry)"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    :disabled="loading"
                    title="编辑数据"
                  >
                    <i class="fas fa-edit"></i>
                    <span class="hidden sm:inline">编辑</span>
                  </button>
                  <button 
                    @click="deleteEntry(entry)"
                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    :disabled="loading"
                    title="删除数据"
                  >
                    <i class="fas fa-trash"></i>
                    <span class="hidden sm:inline">删除</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="isLoadingEntries" class="text-center py-8 text-blue-600 dark:text-blue-400">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>正在加载最新数据...</p>
        </div>
        <div v-else-if="recentEntries.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="fas fa-inbox text-2xl mb-2"></i>
          <p>暂无数据录入记录</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { funnelAPI } from '@/api/funnel'
import { funnelMetricsAPI } from '@/api/funnelMetrics'
import type { FunnelListItem } from '@/types/funnel'

// Types
interface Funnel {
  id: string
  name: string
  description?: string
  dataPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  nodeCount?: number
  nodes?: Array<{
    id: string
    label: string
    order: number
  }>
}

interface FunnelStage {
  id: string
  name: string
  order: number
}

interface DataEntry {
  id: string
  metricsId: string
  date: string
  funnelName: string
  leads: number
  contact: number
  demo: number
  proposal: number
  closed: number
  conversionRate: string
  rawData?: any
}

// Reactive data
const funnels = ref<Funnel[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const selectedFunnel = ref<Funnel | null>(null)
const selectedDate = ref('')
const selectedDateOffset = ref(0)
const stageData = ref<Record<string, number>>({})
const stageInfo = ref<Record<string, string>>({})
const notes = ref('')

const funnelStages = ref<FunnelStage[]>([
  { id: 'leads', name: '获取线索', order: 1 },
  { id: 'contact', name: '首次接触', order: 2 },
  { id: 'demo', name: '产品演示', order: 3 },
  { id: 'proposal', name: '方案确认', order: 4 },
  { id: 'closed', name: '最终成交', order: 5 }
])

const recentEntries = ref<DataEntry[]>([])
const isLoadingEntries = ref(false)

// 编辑相关状态
const editingEntry = ref<DataEntry | null>(null)
const isEditMode = ref(false)

// Computed
const canSave = computed(() => {
  return selectedFunnel.value && selectedDate.value && Object.keys(stageData.value).length > 0
})

const canSubmit = computed(() => {
  return canSave.value && Object.values(stageData.value).some(val => val > 0)
})

const totalConversionRate = computed(() => {
  const stages = funnelStages.value
  if (stages.length < 2) return '0.0%'
  
  const firstStage = stageData.value[stages[0].id] || 0
  const lastStage = stageData.value[stages[stages.length - 1].id] || 0
  
  if (firstStage === 0) return '0.0%'
  
  const rate = (lastStage / firstStage) * 100
  return `${rate.toFixed(1)}%`
})

// Methods
const getFrequencyText = (period: string) => {
  const map = {
    DAILY: '日更新',
    WEEKLY: '周更新', 
    MONTHLY: '月更新'
  }
  return map[period as keyof typeof map] || '未知'
}

const getFrequencyBadgeClass = (period: string) => {
  const map = {
    DAILY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    WEEKLY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    MONTHLY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }
  return map[period as keyof typeof map] || 'bg-gray-100 text-gray-800'
}

const getQuickDateButtons = () => {
  if (!selectedFunnel.value) return []
  
  switch (selectedFunnel.value.dataPeriod) {
    case 'DAILY':
      return [
        { label: '今天', offset: 0 },
        { label: '昨天', offset: -1 },
        { label: '前天', offset: -2 }
      ]
    case 'WEEKLY':
      return [
        { label: '本周', offset: 0 },
        { label: '上周', offset: -1 },
        { label: '上上周', offset: -2 }
      ]
    case 'MONTHLY':
      return [
        { label: '本月', offset: 0 },
        { label: '上月', offset: -1 },
        { label: '上上月', offset: -2 }
      ]
    default:
      return []
  }
}

const getStageInfoLabel = (index: number) => {
  const labels = ['渠道来源', '接触方式', '演示形式', '方案类型', '成交金额 (¥)']
  return labels[index] || '备注'
}

const getStageInfoOptions = (index: number) => {
  const options = [
    ['线上广告', '社交媒体', '搜索引擎', '转介绍', '其他'],
    ['电话联系', '邮件回复', '在线咨询', '面访'],
    ['在线演示', '现场演示', '录屏视频', '试用账号'],
    ['标准方案', '定制方案', '试用转正'],
    ['输入总金额']
  ]
  return options[index] || ['其他']
}

const getConversionRate = (index: number) => {
  if (index === 0) return '-'
  
  const stages = funnelStages.value
  const prevStageValue = stageData.value[stages[index - 1].id] || 0
  const currentStageValue = stageData.value[stages[index].id] || 0
  
  if (prevStageValue === 0) return '0.0%'
  
  const rate = (currentStageValue / prevStageValue) * 100
  return `${rate.toFixed(1)}%`
}

const selectFunnel = async (funnel: Funnel) => {
  selectedFunnel.value = funnel
  // Reset form data
  stageData.value = {}
  stageInfo.value = {}
  notes.value = ''
  
  try {
    // 获取漏斗的详细信息，包括节点数据
    const detailResponse = await funnelAPI.getFunnelById(funnel.id)
    
    if (detailResponse.data.nodes && detailResponse.data.nodes.length > 0) {
      // 使用漏斗的实际节点作为阶段
      funnelStages.value = detailResponse.data.nodes
        .sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))
        .map((node, index) => ({
          id: node.id,
          name: node.data?.label || node.type,
          order: index + 1
        }))
      console.log('Loaded funnel nodes:', funnelStages.value)
    } else {
      // 如果没有节点信息，使用默认阶段
      funnelStages.value = [
        { id: 'stage1', name: '第一阶段', order: 1 },
        { id: 'stage2', name: '第二阶段', order: 2 },
        { id: 'stage3', name: '第三阶段', order: 3 },
        { id: 'stage4', name: '第四阶段', order: 4 },
        { id: 'stage5', name: '最终转化', order: 5 }
      ]
      console.log('Using default stages (no nodes found)')
    }
  } catch (err) {
    console.error('Failed to load funnel details:', err)
    // 使用默认阶段作为后备
    funnelStages.value = [
      { id: 'stage1', name: '第一阶段', order: 1 },
      { id: 'stage2', name: '第二阶段', order: 2 },
      { id: 'stage3', name: '第三阶段', order: 3 },
      { id: 'stage4', name: '第四阶段', order: 4 },
      { id: 'stage5', name: '最终转化', order: 5 }
    ]
  }
  
  setQuickDate(0)
  
  // 获取该漏斗的最近录入记录
  await fetchRecentEntries()
}

const setQuickDate = (offset: number) => {
  selectedDateOffset.value = offset
  const today = new Date()
  
  if (selectedFunnel.value?.dataPeriod === 'DAILY') {
    today.setDate(today.getDate() + offset)
  } else if (selectedFunnel.value?.dataPeriod === 'WEEKLY') {
    today.setDate(today.getDate() + (offset * 7))
  } else if (selectedFunnel.value?.dataPeriod === 'MONTHLY') {
    today.setMonth(today.getMonth() + offset)
  }
  
  selectedDate.value = today.toISOString().split('T')[0]
}

const calculateConversion = () => {
  // Conversion rates are computed automatically via getConversionRate
}

const saveDraft = () => {
  console.log('Saving draft...', {
    funnel: selectedFunnel.value?.id,
    date: selectedDate.value,
    data: stageData.value,
    info: stageInfo.value,
    notes: notes.value
  })
}

const submitData = async () => {
  if (!canSubmit.value || !selectedFunnel.value) return
  
  try {
    loading.value = true
    error.value = null
    
    console.log('⚙️', isEditMode.value ? 'UPDATING DATA...' : 'SUBMITTING DATA...', {
      funnel: selectedFunnel.value.id,
      date: selectedDate.value,
      stageData: stageData.value,
      stageInfo: stageInfo.value,
      notes: notes.value,
      editMode: isEditMode.value,
      editingId: editingEntry.value?.metricsId,
      originalValues: editingEntry.value ? {
        leads: editingEntry.value.leads,
        contact: editingEntry.value.contact,
        demo: editingEntry.value.demo,
        proposal: editingEntry.value.proposal,
        closed: editingEntry.value.closed
      } : 'N/A'
    })
    
    // 检查是否有真实的UUID格式的节点ID
    const validStages = funnelStages.value.filter(stage => 
      stage.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    )
    
    let response: any
    
    if (validStages.length > 0) {
      // 有真实节点数据，提交节点指标
      const nodeMetricsArray = validStages.map(stage => ({
        nodeId: stage.id,
        periodType: selectedFunnel.value!.dataPeriod === 'WEEKLY' ? 'weekly' as const : 'monthly' as const,
        periodStartDate: selectedDate.value,
        periodEndDate: selectedDate.value,
        entries: stageData.value[stage.id] || 0,
        conversions: stageData.value[stage.id] || 0,
        conversionRate: parseFloat(getConversionRate(funnelStages.value.indexOf(stage)).replace('%', '')) || 0,
        notes: stageInfo.value[stage.id] || undefined
      }))
      
      console.log('Submitting node metrics:', nodeMetricsArray)
      response = await funnelMetricsAPI.batchCreateNodeMetrics({
        nodeMetrics: nodeMetricsArray
      })
    } else {
      // 没有真实节点数据，提交漏斗级指标
      console.log('No valid nodes found, submitting funnel-level metrics')
      
      // 计算总体指标
      const totalEntries = stageData.value[funnelStages.value[0]?.id] || 0
      const totalConversions = stageData.value[funnelStages.value[funnelStages.value.length - 1]?.id] || 0
      const conversionRate = totalEntries > 0 ? (totalConversions / totalEntries) : 0
      
      const funnelMetricsData = {
        periodType: selectedFunnel.value!.dataPeriod === 'WEEKLY' ? 'weekly' as const : 'monthly' as const,
        periodStartDate: selectedDate.value,
        periodEndDate: selectedDate.value,
        totalEntries,
        totalConversions,
        overallConversionRate: conversionRate,
        notes: notes.value || undefined,
        customMetrics: {
          stageData: stageData.value,
          stageInfo: stageInfo.value
        }
      }
      
      console.log('📈', isEditMode.value ? 'UPDATING FUNNEL METRICS:' : 'SUBMITTING FUNNEL METRICS:', {
        isEdit: isEditMode.value,
        editingId: editingEntry.value?.metricsId,
        funnelId: selectedFunnel.value.id,
        totalEntries,
        totalConversions,
        conversionRate,
        stageDataValues: Object.entries(stageData.value).map(([k, v]) => `${k}=${v}`).join(', ')
      })
      
      if (isEditMode.value && editingEntry.value) {
        // 更新现有数据
        console.log('🔄 CALLING UPDATE API:', {
          funnelId: selectedFunnel.value.id,
          metricsId: editingEntry.value.metricsId,
          updateData: funnelMetricsData
        })
        response = await funnelMetricsAPI.updateFunnelMetrics(selectedFunnel.value.id, editingEntry.value.metricsId, funnelMetricsData)
        console.log('🔄 UPDATE API RESPONSE:', response.data)
      } else {
        // 创建新数据
        console.log('➕ CALLING CREATE API:', funnelMetricsData)
        response = await funnelMetricsAPI.createFunnelMetrics(selectedFunnel.value.id, funnelMetricsData)
        console.log('➕ CREATE API RESPONSE:', response.data)
      }
    }
    
    if (response.data.success) {
      console.log('✅', isEditMode.value ? 'DATA UPDATE SUCCESS!' : 'DATA SUBMIT SUCCESS!', {
        responseSuccess: response.data.success,
        responseMessage: response.data.message,
        dataId: response.data.data?.id
      })
      
      if (isEditMode.value) {
        // 编辑模式：提示更新成功并退出编辑模式
        alert('数据更新成功！')
        cancelEdit() // 退出编辑模式并重置表单
      } else {
        // 创建模式：提示创建成功并切换到下一个时间周期
        alert('数据提交成功！')
        
        // 重置表单
        stageData.value = {}
        stageInfo.value = {}
        notes.value = ''
        
        // 自动切换到下一个时间周期
        if (selectedFunnel.value?.dataPeriod === 'DAILY') {
          const nextDate = new Date(selectedDate.value)
          nextDate.setDate(nextDate.getDate() + 1)
          selectedDate.value = nextDate.toISOString().split('T')[0]
        } else if (selectedFunnel.value?.dataPeriod === 'WEEKLY') {
          const nextDate = new Date(selectedDate.value)
          nextDate.setDate(nextDate.getDate() + 7)
          selectedDate.value = nextDate.toISOString().split('T')[0]
        } else if (selectedFunnel.value?.dataPeriod === 'MONTHLY') {
          const nextDate = new Date(selectedDate.value)
          nextDate.setMonth(nextDate.getMonth() + 1)
          selectedDate.value = nextDate.toISOString().split('T')[0]
        }
      }
      
      // 重新加载最近记录 - 使用递增延时重试机制
      console.log('🔄 数据提交成功，开始重新获取最近记录...')
      await refreshEntriesWithRetry()
      console.log('✅ 最近记录已刷新完成')
    }
  } catch (err: any) {
    console.error('提交数据失败:', err)
    
    // 处理重复提交错误
    if (err.response?.status === 400 && err.response?.data?.error?.includes('已存在')) {
      error.value = `该日期(${selectedDate.value})的数据已存在。请选择其他日期或修改现有数据。`
    } else {
      error.value = err.response?.data?.error || err.response?.data?.message || err.message || '提交数据失败'
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 编辑功能
const editEntry = async (entry: DataEntry) => {
  try {
    editingEntry.value = entry
    isEditMode.value = true
    
    console.log('✏️ EDITING DATA ENTRY:', {
      id: entry.id.slice(0, 8),
      date: entry.date.split('T')[0],
      currentValues: {
        leads: entry.leads,
        contact: entry.contact, 
        demo: entry.demo,
        proposal: entry.proposal,
        closed: entry.closed
      },
      hasRawData: !!entry.rawData
    })
    console.log('🎯 CURRENT FUNNEL STAGES:', funnelStages.value.map(s => ({ id: s.id, name: s.name })))
    
    // 填充表单数据
    selectedDate.value = entry.date.split('T')[0] // 格式化日期
    
    // 从原始数据中恢复阶段数据
    if (entry.rawData && entry.rawData.customMetrics?.stageData) {
      console.log('使用原始stageData:', entry.rawData.customMetrics.stageData)
      stageData.value = { ...entry.rawData.customMetrics.stageData }
    } else {
      console.log('🔄 USING DISPLAY DATA MAPPING TO STAGES')
      // 重新构建阶段数据映射，确保数据正确对应
      const newStageData: Record<string, number> = {}
      
      // 按顺序映射数据到当前的阶段结构
      const displayValues = [entry.leads, entry.contact, entry.demo, entry.proposal, entry.closed]
      console.log('📈 DISPLAY VALUES TO MAP:', displayValues)
      
      funnelStages.value.forEach((stage, index) => {
        if (index < displayValues.length) {
          newStageData[stage.id] = displayValues[index] || 0
          console.log(`   STAGE ${index + 1} (${stage.id}): ${newStageData[stage.id]}`)
        }
      })
      
      console.log('🎯 MAPPED STAGE DATA:', newStageData)
      stageData.value = newStageData
    }
    
    // 恢复其他信息
    if (entry.rawData?.customMetrics?.stageInfo) {
      console.log('恢复阶段信息:', entry.rawData.customMetrics.stageInfo)
      stageInfo.value = { ...entry.rawData.customMetrics.stageInfo }
    } else {
      // 清空阶段信息
      stageInfo.value = {}
    }
    
    notes.value = entry.rawData?.notes || ''
    
    console.log('✓ FORM DATA POPULATED SUCCESSFULLY:', {
      selectedDate: selectedDate.value,
      stageData: stageData.value,
      stageInfo: stageInfo.value,
      notes: notes.value,
      totalStages: Object.keys(stageData.value).length
    })
    
    // 滚动到表单顶部
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
  } catch (err) {
    console.error('编辑数据失败:', err)
    error.value = '加载编辑数据失败'
  }
}

// 删除功能
const deleteEntry = async (entry: DataEntry) => {
  if (!selectedFunnel.value) return
  
  const confirmDelete = confirm(`确定要删除 ${formatDate(entry.date)} 的数据吗？此操作无法撤销。`)
  if (!confirmDelete) return
  
  try {
    loading.value = true
    error.value = null
    
    await funnelMetricsAPI.deleteFunnelMetrics(selectedFunnel.value.id, entry.metricsId)
    
    // 删除成功，重新获取最新数据
    await refreshEntriesWithRetry()
    
    alert('数据删除成功！')
    
  } catch (err: any) {
    console.error('删除数据失败:', err)
    error.value = err.response?.data?.error || err.response?.data?.message || err.message || '删除数据失败'
  } finally {
    loading.value = false
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditMode.value = false
  editingEntry.value = null
  
  // 重置表单
  stageData.value = {}
  stageInfo.value = {}
  notes.value = ''
  
  // 重置日期为今天
  selectedDate.value = new Date().toISOString().split('T')[0]
}

// 带重试机制的数据刷新函数
const refreshEntriesWithRetry = async (maxRetries: number = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 尝试获取最新数据 (第${attempt}/${maxRetries}次)...`)
      
      // 递增延时：300ms, 600ms, 1000ms
      const delay = attempt * 300
      await new Promise(resolve => setTimeout(resolve, delay))
      
      await fetchRecentEntries(true) // 传入forceRefresh参数
      
      // 检查数据是否已更新（验证：记录数量变化或最新数据的时间戳）
      if (recentEntries.value.length > 0) {
        const latestEntry = recentEntries.value[0]
        const latestDate = new Date(latestEntry.date).getTime()
        const currentTime = new Date().getTime()
        const timeDiff = currentTime - latestDate
        
        console.log(`✅ 第${attempt}次重试成功，获取到${recentEntries.value.length}条记录`)
        console.log(`📊 最新记录: ${latestEntry.id.slice(0, 8)}... (${timeDiff < 86400000 ? '今日' : '非今日'})`)
        return
      }
    } catch (error) {
      console.error(`❌ 第${attempt}次重试失败:`, error)
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
}

// API Functions
const fetchRecentEntries = async (forceRefresh: boolean = false) => {
  if (!selectedFunnel.value) return
  
  try {
    isLoadingEntries.value = true
    console.log('🔄 开始获取漏斗记录:', selectedFunnel.value.id, forceRefresh ? '(强制刷新)' : '')
    
    const response = await funnelMetricsAPI.getFunnelMetricsList(selectedFunnel.value.id, {
      limit: 10,
      offset: 0
    })
    
    if (response.data.success && response.data.data) {
      console.log('✅ 获取到的原始指标数据:', response.data.data)
      
      // 清空旧数据，确保响应式更新
      const oldLength = recentEntries.value.length
      recentEntries.value = []
      
      // 等待DOM更新
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // 转换API数据为表格显示格式
      console.log('📊 开始转换API数据，共', response.data.data.length, '条记录')
      const newEntries = response.data.data.map((metrics: any, index: number) => {
        console.log(`🔄 处理第${index + 1}条记录:`, metrics.id)
        console.log('📊 处理指标数据:', {
          id: metrics.id,
          customMetrics: metrics.customMetrics,
          totalEntries: metrics.totalEntries,
          totalConversions: metrics.totalConversions
        })
        
        // 更灵活地从customMetrics中提取阶段数据
        let stageValues = [0, 0, 0, 0, 0] // 默认5个阶段的数据
        
        if (metrics.customMetrics?.stageData) {
          const stageData = metrics.customMetrics.stageData
          console.log('📈 从customMetrics提取阶段数据:', stageData)
          
          // 获取所有阶段的值，按顺序排列
          const stageKeys = Object.keys(stageData).sort()
          console.log('🔑 阶段键值:', stageKeys)
          
          stageKeys.forEach((key, index) => {
            if (index < stageValues.length) {
              stageValues[index] = Number(stageData[key]) || 0
              console.log(`   阶段${index + 1} (${key}): ${stageValues[index]}`)
            }
          })
        } else {
          // 使用总入口和转化数作为首尾阶段
          stageValues[0] = Number(metrics.totalEntries) || 0
          stageValues[4] = Number(metrics.totalConversions) || 0
          console.log('📊 使用总体数据:', { totalEntries: stageValues[0], totalConversions: stageValues[4] })
        }
        
        const entry = {
          id: metrics.id,
          metricsId: metrics.id, // 保存真实的指标ID用于编辑和删除
          date: metrics.periodStartDate,
          funnelName: selectedFunnel.value!.name,
          leads: stageValues[0],
          contact: stageValues[1], 
          demo: stageValues[2],
          proposal: stageValues[3],
          closed: stageValues[4],
          conversionRate: metrics.overallConversionRate 
            ? `${(metrics.overallConversionRate * 100).toFixed(1)}%` 
            : (stageValues[0] > 0 ? `${((stageValues[4] / stageValues[0]) * 100).toFixed(1)}%` : '0.0%'),
          rawData: metrics // 保存原始数据用于编辑
        }
        
        console.log('🎯 转换后的表格数据:', entry)
        return entry
      })
      
      // 批量更新数据，确保响应式更新
      recentEntries.value = newEntries
      
      console.log(`🔄 数据更新完成: 从${oldLength}条记录更新为${newEntries.length}条记录`)
    }
    
    console.log('✅ 最终的最近录入记录 (共' + recentEntries.value.length + '条):', recentEntries.value.map(e => ({ 
      id: e.id.slice(0, 8),
      date: e.date.split('T')[0], 
      leads: e.leads, 
      contact: e.contact, 
      demo: e.demo, 
      proposal: e.proposal, 
      closed: e.closed 
    })))
  } catch (err: any) {
    console.error('❌ 获取历史数据失败:', err)
    // 如果获取失败，显示空列表
    recentEntries.value = []
  } finally {
    isLoadingEntries.value = false
  }
}

const fetchFunnels = async () => {
  try {
    loading.value = true
    error.value = null
    
    const response = await funnelAPI.getFunnels({
      per_page: 100,
      filters: {
        status: ['active'] // 只获取活跃的漏斗
      }
    })
    
    console.log('API Response:', response.data)
    
    if (response.data.success) {
      const data = response.data.data
      console.log('Data structure:', data)
      console.log('Type of data:', typeof data)
      console.log('Is array:', Array.isArray(data))
      
      // 检查数据结构
      if (!data) {
        console.error('No data in response')
        error.value = 'API返回数据格式错误'
        return
      }
      
      // 根据实际API返回结构处理数据
      let funnelItems = []
      if (data.funnels && Array.isArray(data.funnels)) {
        funnelItems = data.funnels
      } else if (data.items && Array.isArray(data.items)) {
        funnelItems = data.items
      } else if (Array.isArray(data)) {
        funnelItems = data
      } else {
        console.error('Unexpected data format:', data)
        error.value = 'API返回数据格式不正确'
        return
      }
      
      // 转换API数据为本地格式
      funnels.value = funnelItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        dataPeriod: item.dataPeriod || 'DAILY', // 使用API返回的值或默认值
        nodeCount: item.nodeCount || item.node_count || 0
      }))
      
      console.log('Processed funnels:', funnels.value)
      
      // 如果有漏斗数据，自动选择第一个
      if (funnels.value.length > 0) {
        await selectFunnel(funnels.value[0])
      }
    } else {
      console.error('API response not successful:', response.data)
      error.value = response.data.message || '获取漏斗数据失败'
    }
  } catch (err: any) {
    console.error('Failed to fetch funnels:', err)
    error.value = err.response?.data?.message || err.message || '获取漏斗数据失败'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Set today's date by default
  selectedDate.value = new Date().toISOString().split('T')[0]
  
  // Fetch funnels from API
  await fetchFunnels()
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>