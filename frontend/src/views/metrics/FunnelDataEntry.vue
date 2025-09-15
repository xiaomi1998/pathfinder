<template>
  <div class="funnel-data-entry">
    <!-- Main Content -->
    <div class="main-content" id="mainContent">
      <!-- Quick Entry Header -->
      <div class="quick-entry">
        <h2><i class="fas fa-edit mr-3"></i>数据录入中心</h2>
        <p>快速录入您的业务数据，让Pathfinder为您构建精准的增长画像</p>
      </div>
      
      <!-- Tips Card -->
      <div class="tips-card">
        <div class="flex items-start">
          <i class="fas fa-lightbulb tips-icon"></i>
          <div class="flex-1">
            <div class="tips-title">录入小贴士</div>
            <ul class="tips-list">
              <li>建议每日或每周定期录入数据，保持数据的连续性</li>
              <li>确保各阶段数据的逻辑合理性 (上一阶段数量 ≥ 下一阶段数量)</li>
              <li>可以批量导入历史数据，系统会自动计算转化率</li>
              <li class="text-blue-600 font-semibold">先选择要录入数据的漏斗，再查看该漏斗的数据录入情况</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Funnel Selection Card -->
      <div class="entry-card">
        <h3 class="text-lg font-semibold mb-4">选择漏斗</h3>
        <div class="funnel-selector">
          <div 
            v-for="funnel in availableFunnels" 
            :key="funnel.id"
            @click="selectFunnel(funnel)"
            :class="['funnel-option', { 'selected': selectedFunnel?.id === funnel.id }]"
            :data-frequency="funnel.frequency"
          >
            <div :class="['frequency-badge', getFrequencyClass(funnel.frequency)]">
              {{ getFrequencyLabel(funnel.frequency) }}
            </div>
            <div class="funnel-name">{{ funnel.name }}</div>
            <div class="funnel-desc">{{ funnel.description || '暂无描述' }}</div>
            <div class="funnel-stats">
              <div class="funnel-stat">
                <div class="funnel-stat-value">{{ funnel.stats?.conversionRate || '0' }}%</div>
                <div class="funnel-stat-label">总转化率</div>
              </div>
              <div class="funnel-stat">
                <div class="funnel-stat-value">{{ funnel.stats?.totalLeads || '0' }}</div>
                <div class="funnel-stat-label">本月线索</div>
              </div>
              <div class="funnel-stat">
                <div class="funnel-stat-value">{{ funnel.stats?.conversions || '0' }}</div>
                <div class="funnel-stat-label">成交数</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Data Entry Calendar (Hidden initially) -->
        <div v-if="selectedFunnel" id="dataEntryCalendarContainer" class="mt-5">
          <div class="calendar-header">
            <div>
              <div class="calendar-title">{{ selectedFunnel.name }} - 数据录入情况</div>
              <div class="calendar-subtitle">最近{{ displayDays }}天的数据录入状态，点击缺失日期可快速补录</div>
            </div>
            <div class="flex gap-4 items-center text-xs">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                <span>已录入</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <span>缺失</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                <span>今天</span>
              </div>
            </div>
          </div>
          
          <div class="horizontal-calendar">
            <div class="calendar-strip">
              <div 
                v-for="day in horizontalCalendarDays" 
                :key="day.dateStr"
                @click="handleEntryDateClick(day)"
                :class="[
                  'day-cell',
                  day.status
                ]"
              >
                <div class="day-cell-content">
                  <div>
                    <div class="day-cell-date">{{ day.monthDay }}</div>
                    <div class="day-cell-day">{{ day.weekDay }}</div>
                  </div>
                  <div class="day-cell-status"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Entry Form -->
      <div v-if="selectedFunnel" class="data-form">
        <div class="form-section">
          <div class="form-section-title">
            <i class="fas fa-calendar form-section-icon"></i>
            时间选择
          </div>
          
          <div class="frequency-warning" id="frequencyWarning">
            <div class="flex items-center text-amber-700">
              <i class="fas fa-info-circle mr-2"></i>
              <span>当前漏斗为 <strong id="currentFreq">{{ getFrequencyLabel(selectedFunnel?.frequency || 'daily') }}</strong> 模式，请按照对应频率录入数据</span>
            </div>
          </div>
          
          <!-- 日更新模式 -->
          <div v-if="selectedFunnel.frequency === 'daily'" class="date-picker-group show" id="dailyPicker">
            <div class="form-group">
              <label class="form-label">录入日期</label>
              <input 
                type="date" 
                class="form-input"
                :value="formatDate(selectedDate, 'YYYY-MM-DD')"
                @input="onDateInput"
                :max="formatDate(new Date(), 'YYYY-MM-DD')"
              >
            </div>
            <div class="quick-date-btns">
              <button 
                :class="['quick-date-btn', { 'active': quickDateSelection === 0 }]" 
                @click="setQuickDate(0)"
              >
                今天
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickDateSelection === -1 }]" 
                @click="setQuickDate(-1)"
              >
                昨天
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickDateSelection === -2 }]" 
                @click="setQuickDate(-2)"
              >
                前天
              </button>
            </div>
          </div>
          
          <!-- 周更新模式 -->
          <div v-else-if="selectedFunnel.frequency === 'weekly'" class="weekly-picker show" id="weeklyPicker">
            <div class="form-group">
              <label class="form-label">选择周期</label>
              <select class="form-input" v-model="selectedWeekOption" @change="onWeekSelectChange">
                <option v-for="week in weekOptions" :key="week.value" :value="week.value">
                  {{ week.label }}
                </option>
              </select>
            </div>
            <div class="quick-date-btns">
              <button 
                :class="['quick-date-btn', { 'active': quickWeekSelection === 0 }]"
                @click="setQuickWeek(0)"
              >
                本周
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickWeekSelection === -1 }]"
                @click="setQuickWeek(-1)"
              >
                上周
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickWeekSelection === -2 }]"
                @click="setQuickWeek(-2)"
              >
                上上周
              </button>
            </div>
          </div>
          
          <!-- 月更新模式 -->
          <div v-else-if="selectedFunnel.frequency === 'monthly'" class="monthly-picker show" id="monthlyPicker">
            <div class="form-group">
              <label class="form-label">选择月份</label>
              <select class="form-input" v-model="selectedMonthOption" @change="onMonthSelectChange">
                <option v-for="month in monthOptions" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="quick-date-btns">
              <button 
                :class="['quick-date-btn', { 'active': quickMonthSelection === 0 }]"
                @click="setQuickMonth(0)"
              >
                本月
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickMonthSelection === -1 }]"
                @click="setQuickMonth(-1)"
              >
                上月
              </button>
              <button 
                :class="['quick-date-btn', { 'active': quickMonthSelection === -2 }]"
                @click="setQuickMonth(-2)"
              >
                上上月
              </button>
            </div>
          </div>
        </div>

        <!-- Stage Data Entry -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fas fa-chart-bar form-section-icon"></i>
            各阶段数据录入
          </div>
          
          <!-- Stage Input Groups -->
          <div 
            v-for="(stage, index) in funnelStages" 
            :key="stage.id"
            class="stage-input-group"
          >
            <div class="form-group">
              <label class="form-label">{{ stage.name }}</label>
              <input 
                type="number" 
                class="form-input" 
                :placeholder="`输入${stage.name}数量`"
                v-model.number="stageData[stage.id]"
                @input="calculateConversion"
                min="0"
              >
            </div>
            <div class="form-group">
              <label class="form-label">{{ getStageSourceLabel(index) }}</label>
              <select class="form-input" v-model="stageSources[stage.id]">
                <option v-for="option in getStageSourceOptions(index)" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="conversion-indicator">
              <div class="conversion-rate">
                {{ index === 0 ? '-' : getStageConversionRate(index) + '%' }}
              </div>
              <div class="conversion-label">
                {{ index === 0 ? '基准阶段' : '转化率' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes Section -->
        <div class="form-section">
          <div class="form-section-title">
            <i class="fas fa-sticky-note form-section-icon"></i>
            备注信息
          </div>
          <div class="form-group">
            <label class="form-label">数据备注</label>
            <textarea 
              class="form-input" 
              rows="3" 
              placeholder="记录当天的特殊情况、营销活动或其他影响因素..."
              v-model="notes"
            ></textarea>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600">
            总转化率: <span class="font-semibold text-blue-600">{{ totalConversionRate }}%</span>
            (基于当前输入数据计算)
          </div>
          <div class="flex gap-3">
            <button class="btn btn-secondary" @click="saveDraft" :disabled="loading">
              <i class="fas fa-save"></i>
              保存草稿
            </button>
            <button class="btn btn-primary" @click="submitData" :disabled="!canSubmit || loading">
              <i class="fas fa-check"></i>
              {{ isEditMode ? '保存修改' : '提交数据' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Entries Table -->
      <div v-if="selectedFunnel" class="entry-card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">最近录入记录</h3>
          <button class="btn btn-secondary" @click="exportData">
            <i class="fas fa-download mr-2"></i>导出数据
          </button>
        </div>
        
        <table class="history-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>漏斗</th>
              <th v-for="stage in funnelStages" :key="stage.id">{{ stage.name }}</th>
              <th>总转化率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in recentEntries" :key="entry.id">
              <td>{{ formatDate(entry.date, 'MM-DD') }}</td>
              <td>{{ selectedFunnel.name }}</td>
              <td v-for="stage in funnelStages" :key="stage.id">
                {{ getStageValue(entry, stage.id) }}
              </td>
              <td class="font-semibold text-blue-600">{{ entry.conversionRate }}%</td>
              <td>
                <button 
                  @click="editEntry(entry)"
                  class="text-blue-600 hover:text-blue-800 mr-2"
                  :disabled="loading"
                >
                  编辑
                </button>
                <button 
                  @click="deleteEntry(entry)"
                  class="text-red-600 hover:text-red-800"
                  :disabled="loading"
                >
                  删除
                </button>
              </td>
            </tr>
            <tr v-if="recentEntries.length === 0">
              <td :colspan="funnelStages.length + 4" class="text-center py-8 text-gray-500">
                暂无数据录入记录
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="error" class="fixed top-5 right-5 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          {{ error }}
          <button @click="error = null" class="ml-3 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div v-if="successMessage" class="fixed top-5 right-5 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">
        <div class="flex items-center">
          <i class="fas fa-check-circle mr-2"></i>
          {{ successMessage }}
          <button @click="successMessage = null" class="ml-3 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// Stores
import { useFunnelStore } from '@/stores/funnel'

// API
import { funnelMetricsAPI } from '@/api/funnelMetrics'
import { dashboardAPI } from '@/api/dashboard'

const router = useRouter()
const route = useRoute()
const funnelStore = useFunnelStore()

// State
const selectedFunnel = ref<any>(null)
const selectedDate = ref<Date>(new Date())
const quickDateSelection = ref<number>(0)
const quickWeekSelection = ref<number>(0)
const quickMonthSelection = ref<number>(0)
const selectedWeekOption = ref<string>('')
const selectedMonthOption = ref<string>('')
const stageData = ref<Record<string, number>>({})
const stageSources = ref<Record<string, string>>({})
const notes = ref<string>('')
const isEditMode = ref<boolean>(false)
const editingEntryId = ref<string | null>(null)
const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const recentEntries = ref<any[]>([])
const dataStatus = ref<Record<string, { hasData: boolean; funnelId: string }>>({})

// Constants
const displayDays = 14
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 漏斗数据，从store获取真实数据
const availableFunnels = computed(() => {
  return funnelStore.funnels.map(funnel => {
    // 映射dataPeriod到frequency格式
    let frequency = 'daily'; // 默认值
    if (funnel.dataPeriod) {
      const dataPeriod = typeof funnel.dataPeriod === 'string' 
        ? funnel.dataPeriod.toUpperCase() 
        : funnel.dataPeriod;
      
      switch (dataPeriod) {
        case 'DAILY':
          frequency = 'daily';
          break;
        case 'WEEKLY': 
          frequency = 'weekly';
          break;
        case 'MONTHLY':
          frequency = 'monthly';
          break;
        default:
          frequency = 'daily';
      }
    }

    return {
      ...funnel,
      frequency, // 使用真实的频率数据
      stats: {
        conversionRate: '0.0',
        totalLeads: 0,
        conversions: 0
      }
    }
  })
})

// Computed
const funnelStages = computed(() => {
  if (!selectedFunnel.value?.nodes || !Array.isArray(selectedFunnel.value.nodes)) {
    return [
      { id: 'stage1', name: '获取线索' },
      { id: 'stage2', name: '首次接触' },
      { id: 'stage3', name: '产品演示' },
      { id: 'stage4', name: '方案确认' },
      { id: 'stage5', name: '最终成交' }
    ]
  }
  
  return selectedFunnel.value.nodes
    .filter((node: any) => !node.type || !['connector', 'divider', 'annotation'].includes(node.type))
    .sort((a: any, b: any) => (a.position?.x || 0) - (b.position?.x || 0))
    .map((node: any, index: number) => {
      console.log(`🔍 处理节点 #${index}:`, {
        originalId: node.id,
        nodeType: node.type,
        position: node.position,
        data: node.data
      });
      
      return {
        id: node.id, // 保持原始ID不变
        name: node.data?.label || node.data?.name || `阶段${index + 1}`,
        originalIndex: index
      }
    })
})

const horizontalCalendarDays = computed(() => {
  const today = new Date()
  const days = []
  
  for (let i = displayDays - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    
    const dateStr = date.toISOString().split('T')[0]
    const isToday = i === 0
    const isFuture = date > today
    const hasData = dataStatus.value[dateStr]?.hasData || false
    
    let status = 'completed'
    if (isToday) {
      status = 'today'
    } else if (isFuture) {
      status = 'future'
    } else if (!hasData) {
      status = 'missing'
    }
    
    days.push({
      fullDate: new Date(date),
      dateStr,
      monthDay: `${date.getMonth() + 1}/${date.getDate()}`,
      weekDay: weekDays[date.getDay()],
      status
    })
  }
  
  return days
})

const canSubmit = computed(() => {
  if (loading.value) return false
  if (funnelStages.value.length < 2) return false
  
  const firstStage = funnelStages.value[0]
  const lastStage = funnelStages.value[funnelStages.value.length - 1]
  
  return (
    stageData.value[firstStage?.id] > 0 && 
    stageData.value[lastStage?.id] >= 0 &&
    selectedDate.value
  )
})

const totalConversionRate = computed(() => {
  if (funnelStages.value.length < 2) return 0
  
  const firstStage = funnelStages.value[0]
  const lastStage = funnelStages.value[funnelStages.value.length - 1]
  
  const firstValue = stageData.value[firstStage?.id] || 0
  const lastValue = stageData.value[lastStage?.id] || 0
  
  if (firstValue === 0) return 0
  
  return Math.round((lastValue / firstValue) * 100 * 100) / 100
})

// Methods
const getFrequencyClass = (frequency: string): string => {
  switch (frequency) {
    case 'daily': return 'freq-daily'
    case 'weekly': return 'freq-weekly'
    case 'monthly': return 'freq-monthly'
    default: return 'freq-daily'
  }
}

const getFrequencyLabel = (frequency: string): string => {
  switch (frequency) {
    case 'daily': return '日更新'
    case 'weekly': return '周更新'
    case 'monthly': return '月更新'
    default: return '日更新'
  }
}

const getStageSourceLabel = (index: number): string => {
  const labels = ['渠道来源', '接触方式', '演示形式', '方案类型', '成交金额 (¥)']
  return labels[index] || '来源'
}

const getStageSourceOptions = (index: number): Array<{value: string, label: string}> => {
  const options = [
    [
      { value: 'online_ads', label: '线上广告' },
      { value: 'social_media', label: '社交媒体' },
      { value: 'search_engine', label: '搜索引擎' },
      { value: 'referral', label: '转介绍' },
      { value: 'other', label: '其他' }
    ],
    [
      { value: 'phone', label: '电话联系' },
      { value: 'email', label: '邮件回复' },
      { value: 'online_chat', label: '在线咨询' },
      { value: 'visit', label: '面访' }
    ],
    [
      { value: 'online_demo', label: '在线演示' },
      { value: 'onsite_demo', label: '现场演示' },
      { value: 'video', label: '录屏视频' },
      { value: 'trial', label: '试用账号' }
    ],
    [
      { value: 'standard', label: '标准方案' },
      { value: 'custom', label: '定制方案' },
      { value: 'trial_convert', label: '试用转正' }
    ],
    [
      { value: 'low', label: '小额订单' },
      { value: 'medium', label: '中等订单' },
      { value: 'high', label: '大额订单' }
    ]
  ]
  
  return options[index] || [{ value: '', label: '请选择' }]
}

const getStageConversionRate = (stageIndex: number): string => {
  if (stageIndex === 0 || funnelStages.value.length === 0) return '0.0'
  
  const currentStage = funnelStages.value[stageIndex]
  const previousStage = funnelStages.value[stageIndex - 1]
  
  const currentValue = stageData.value[currentStage?.id] || 0
  const previousValue = stageData.value[previousStage?.id] || 0
  
  if (previousValue === 0) return '0.0'
  
  return ((currentValue / previousValue) * 100).toFixed(1)
}

const formatDate = (date: Date | string, format: string = 'zh-CN'): string => {
  if (format === 'zh-CN') {
    return new Date(date).toLocaleDateString('zh-CN')
  }
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}

const selectFunnel = async (funnel: any) => {
  try {
    // 应用frequency映射
    let frequency = 'daily'; // 默认值
    if (funnel.dataPeriod) {
      const dataPeriod = typeof funnel.dataPeriod === 'string' 
        ? funnel.dataPeriod.toUpperCase() 
        : funnel.dataPeriod;
      
      switch (dataPeriod) {
        case 'DAILY':
          frequency = 'daily';
          break;
        case 'WEEKLY': 
          frequency = 'weekly';
          break;
        case 'MONTHLY':
          frequency = 'monthly';
          break;
        default:
          frequency = 'daily';
      }
    }

    // 设置包含frequency的漏斗数据
    selectedFunnel.value = {
      ...funnel,
      frequency
    }
    
    // Load full funnel details
    const fullFunnel = await funnelStore.fetchFunnelById(funnel.id)
    if (fullFunnel) {
      // 也为完整漏斗数据应用frequency映射
      let fullFrequency = 'daily';
      if (fullFunnel.dataPeriod) {
        const dataPeriod = typeof fullFunnel.dataPeriod === 'string' 
          ? fullFunnel.dataPeriod.toUpperCase() 
          : fullFunnel.dataPeriod;
        
        switch (dataPeriod) {
          case 'DAILY':
            fullFrequency = 'daily';
            break;
          case 'WEEKLY': 
            fullFrequency = 'weekly';
            break;
          case 'MONTHLY':
            fullFrequency = 'monthly';
            break;
          default:
            fullFrequency = 'daily';
        }
      }
      
      selectedFunnel.value = {
        ...fullFunnel,
        frequency: fullFrequency
      }
    }
    
    // Initialize stage data
    stageData.value = {}
    stageSources.value = {}
    
    // Load recent entries
    await refreshRecentEntries()
    
    // Load data entry status
    await loadDataEntryStatus()
    
    successMessage.value = `已选择漏斗：${funnel.name}`
    setTimeout(() => successMessage.value = null, 3000)
  } catch (err: any) {
    error.value = '加载漏斗详情失败'
    setTimeout(() => error.value = null, 5000)
    console.error('Error loading funnel:', err)
  }
}

const loadDataEntryStatus = async () => {
  try {
    const response = await dashboardAPI.getDataEntryStatus()
    if (response.data.success) {
      dataStatus.value = response.data.data
    }
  } catch (err) {
    console.error('Error loading data entry status:', err)
  }
}

const handleEntryDateClick = (day: any) => {
  if (day.status === 'future') return
  
  if (day.status === 'missing') {
    selectedDate.value = day.fullDate
    quickDateSelection.value = -1
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('.data-form')
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
    
    showNotification(`已为您选择 ${day.monthDay}，请在下方录入数据`, 'info')
  } else if (day.status === 'completed') {
    // Show data preview - mock data for now
    const mockData = {
      rate: (Math.random() * 5 + 4).toFixed(1),
      leads: Math.floor(Math.random() * 50 + 20),
      conversions: Math.floor(Math.random() * 8 + 2)
    }
    alert(`${day.monthDay} 数据详情:\n转化率: ${mockData.rate}%\n线索数: ${mockData.leads}\n成交数: ${mockData.conversions}`)
  } else if (day.status === 'today') {
    selectedDate.value = day.fullDate
    quickDateSelection.value = 0
  }
}

const setQuickDate = (daysOffset: number) => {
  quickDateSelection.value = daysOffset
  const today = new Date()
  today.setDate(today.getDate() + daysOffset)
  selectedDate.value = today
}

const onDateInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    selectedDate.value = new Date(target.value)
    quickDateSelection.value = -999 // Reset quick selection
  }
}

const onWeekInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    // Parse week input format YYYY-W##
    const [year, week] = target.value.split('-W')
    const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
    selectedDate.value = date
    quickDateSelection.value = -999
  }
}

const onMonthInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.value) {
    // Parse month input format YYYY-MM
    const [year, month] = target.value.split('-')
    selectedDate.value = new Date(parseInt(year), parseInt(month) - 1, 1)
    quickDateSelection.value = -999
  }
}

// 生成周选项
const weekOptions = computed(() => {
  const options = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    
    const year = weekStart.getFullYear()
    const weekNumber = getWeekNumber(weekStart)
    
    options.push({
      value: `${year}-W${weekNumber}`,
      label: `${year}年第${weekNumber}周 (${formatDate(weekStart, 'MM月DD日')} - ${formatDate(weekEnd, 'MM月DD日')})`
    })
  }
  
  return options
})

// 生成月选项
const monthOptions = computed(() => {
  const options = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = month.getFullYear()
    const monthNum = month.getMonth() + 1
    
    options.push({
      value: `${year}-${monthNum.toString().padStart(2, '0')}`,
      label: `${year}年${monthNum}月`
    })
  }
  
  return options
})

// 获取周数
const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 周选择快捷按钮
const setQuickWeek = (weekOffset: number) => {
  quickWeekSelection.value = weekOffset
  const now = new Date()
  const targetWeek = new Date(now)
  targetWeek.setDate(now.getDate() - (now.getDay() + 7 * Math.abs(weekOffset)))
  
  const year = targetWeek.getFullYear()
  const weekNumber = getWeekNumber(targetWeek)
  selectedWeekOption.value = `${year}-W${weekNumber}`
  selectedDate.value = targetWeek
}

// 月选择快捷按钮
const setQuickMonth = (monthOffset: number) => {
  quickMonthSelection.value = monthOffset
  const now = new Date()
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - Math.abs(monthOffset), 1)
  
  const year = targetMonth.getFullYear()
  const month = (targetMonth.getMonth() + 1).toString().padStart(2, '0')
  selectedMonthOption.value = `${year}-${month}`
  selectedDate.value = targetMonth
}

// 周选择改变处理
const onWeekSelectChange = () => {
  if (selectedWeekOption.value) {
    const [year, week] = selectedWeekOption.value.split('-W')
    const date = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
    selectedDate.value = date
    quickWeekSelection.value = -999
  }
}

// 月选择改变处理
const onMonthSelectChange = () => {
  if (selectedMonthOption.value) {
    const [year, month] = selectedMonthOption.value.split('-')
    selectedDate.value = new Date(parseInt(year), parseInt(month) - 1, 1)
    quickMonthSelection.value = -999
  }
}

const calculateConversion = () => {
  // This will automatically trigger computed property updates
}

const submitData = async () => {
  if (!canSubmit.value || !selectedFunnel.value) return
  
  loading.value = true
  try {
    const customMetrics = {
      stageData: { ...stageData.value },
      stageSources: { ...stageSources.value },
      notes: notes.value,
      submittedAt: new Date().toISOString()
    }
    
    console.log('📊 数据录入详情:', {
      selectedFunnelId: selectedFunnel.value.id,
      funnelStages: funnelStages.value,
      stageDataKeys: Object.keys(stageData.value),
      stageDataValues: Object.entries(stageData.value),
      customMetrics
    })
    
    const stages = Object.values(stageData.value).filter(v => v > 0)
    const totalEntries = stages[0] || 0
    const totalConversions = stages[stages.length - 1] || 0
    
    const data = {
      funnelId: selectedFunnel.value.id,
      periodType: 'weekly',
      periodStartDate: formatDate(selectedDate.value, 'YYYY-MM-DD'),
      periodEndDate: formatDate(selectedDate.value, 'YYYY-MM-DD'),
      totalEntries,
      totalConversions,
      overallConversionRate: totalConversionRate.value / 100,
      customMetrics,
      notes: notes.value
    }
    
    console.log('🚀 About to submit data:', {
      funnelId: selectedFunnel.value.id,
      funnelIdType: typeof selectedFunnel.value.id,
      isEditMode: isEditMode.value,
      editingEntryId: editingEntryId.value,
      data
    })
    
    if (isEditMode.value && editingEntryId.value) {
      console.log('📝 UPDATING FUNNEL METRICS - DETAILED INFO:', {
        funnelId: selectedFunnel.value.id,
        metricsId: editingEntryId.value,
        updateDataKeys: Object.keys(data),
        updateDataValues: JSON.stringify(data, null, 2),
        stageDataBeforeUpdate: JSON.stringify(stageData.value),
        customMetricsBeforeUpdate: JSON.stringify(data.customMetrics)
      })
      
      await funnelMetricsAPI.updateFunnelMetrics(selectedFunnel.value.id, editingEntryId.value, data)
      successMessage.value = '数据更新成功'
    } else {
      console.log('➕ Creating new funnel metrics...')
      await funnelMetricsAPI.createFunnelMetrics(selectedFunnel.value.id, data)
      successMessage.value = '数据提交成功'
    }
    
    resetForm()
    
    // 等待数据库更新完成
    console.log('🔄 WAITING FOR DATABASE UPDATE...')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await refreshRecentEntries()
    await loadDataEntryStatus()
    
    console.log('✅ POST-SUBMIT REFRESH COMPLETED')
    
    setTimeout(() => successMessage.value = null, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || '提交失败'
    setTimeout(() => error.value = null, 5000)
  } finally {
    loading.value = false
  }
}

const saveDraft = () => {
  const draft = {
    funnelId: selectedFunnel.value?.id,
    selectedDate: selectedDate.value,
    stageData: { ...stageData.value },
    stageSources: { ...stageSources.value },
    notes: notes.value
  }
  
  localStorage.setItem('funnelDataEntryDraft', JSON.stringify(draft))
  successMessage.value = '草稿保存成功'
  setTimeout(() => successMessage.value = null, 3000)
}

const resetForm = () => {
  stageData.value = {}
  stageSources.value = {}
  notes.value = ''
  isEditMode.value = false
  editingEntryId.value = null
  selectedDate.value = new Date()
  quickDateSelection.value = 0
}

const editEntry = (entry: any) => {
  console.log('✏️ STARTING EDIT MODE FOR ENTRY:', {
    id: entry.id.slice(0, 8),
    date: entry.periodStartDate?.split('T')[0],
    currentStageData: entry.customMetrics?.stageData || 'none',
    totalEntries: entry.totalEntries,
    totalConversions: entry.totalConversions,
    conversionRate: entry.conversionRate
  })
  
  isEditMode.value = true
  editingEntryId.value = entry.id
  selectedDate.value = new Date(entry.periodStartDate)
  notes.value = entry.notes || ''
  
  // 清空现有数据
  stageData.value = {}
  stageSources.value = {}
  
  if (entry.customMetrics?.stageData) {
    console.log('📈 RESTORING STAGE DATA FROM CUSTOM METRICS:', entry.customMetrics.stageData)
    stageData.value = { ...entry.customMetrics.stageData }
  } else {
    console.log('🔄 NO CUSTOM STAGE DATA, USING FALLBACK VALUES')
    // 使用默认值填充
    if (funnelStages.value.length > 0) {
      const firstStage = funnelStages.value[0]
      const lastStage = funnelStages.value[funnelStages.value.length - 1]
      if (firstStage) stageData.value[firstStage.id] = entry.totalEntries || 0
      if (lastStage && lastStage.id !== firstStage.id) {
        stageData.value[lastStage.id] = entry.totalConversions || 0
      }
    }
  }
  
  if (entry.customMetrics?.stageSources) {
    console.log('📈 RESTORING STAGE SOURCES:', entry.customMetrics.stageSources)
    stageSources.value = { ...entry.customMetrics.stageSources }
  }
  
  console.log('✓ EDIT DATA POPULATED:', {
    stageDataKeys: Object.keys(stageData.value),
    stageDataValues: Object.values(stageData.value),
    stageSourcesKeys: Object.keys(stageSources.value),
    notes: notes.value.slice(0, 50) + (notes.value.length > 50 ? '...' : ''),
    editingEntryId: editingEntryId.value
  })
  
  setTimeout(() => {
    const formElement = document.querySelector('.data-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const deleteEntry = async (entry: any) => {
  if (!confirm('确定要删除这条记录吗？')) return
  
  loading.value = true
  try {
    await funnelMetricsAPI.deleteFunnelMetrics(selectedFunnel.value!.id, entry.id)
    successMessage.value = '数据删除成功'
    
    // 等待数据库更新完成
    console.log('🔄 WAITING FOR DELETE OPERATION...')
    await new Promise(resolve => setTimeout(resolve, 300))
    
    await refreshRecentEntries()
    await loadDataEntryStatus()
    
    console.log('✅ POST-DELETE REFRESH COMPLETED')
    setTimeout(() => successMessage.value = null, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || '删除失败'
    setTimeout(() => error.value = null, 5000)
  } finally {
    loading.value = false
  }
}

const refreshRecentEntries = async () => {
  if (!selectedFunnel.value) return
  
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const isValidUUID = uuidRegex.test(selectedFunnel.value.id)
    
    console.log('🔄 REFRESHING RECENT ENTRIES:', {
      funnelId: selectedFunnel.value.id,
      funnelName: selectedFunnel.value.name,
      funnelIdType: typeof selectedFunnel.value.id,
      funnelIdLength: selectedFunnel.value.id?.length,
      isValidUUID,
      currentEntriesCount: recentEntries.value.length
    })
    
    const response = await funnelMetricsAPI.getFunnelMetricsList(selectedFunnel.value.id, {
      limit: 10,
      sortBy: 'periodStartDate',
      sortOrder: 'desc'
    })
    
    console.log('✅ API RESPONSE RECEIVED:', {
      success: response.data.success,
      dataCount: response.data.data?.length || 0,
      firstEntry: response.data.data?.[0] ? {
        id: response.data.data[0].id.slice(0, 8),
        date: response.data.data[0].periodStartDate?.split('T')[0],
        totalEntries: response.data.data[0].totalEntries,
        totalConversions: response.data.data[0].totalConversions,
        customMetrics: !!response.data.data[0].customMetrics?.stageData
      } : null
    })
    
    // 清空旧数据并等待DOM更新
    const oldCount = recentEntries.value.length
    recentEntries.value = []
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // 重新构建数据
    const newEntries = response.data.data.map((entry: any, index: number) => {
      const processedEntry = {
        ...entry,
        date: new Date(entry.periodStartDate),
        conversionRate: entry.overallConversionRate != null 
          ? Math.round(entry.overallConversionRate * 100 * 100) / 100 
          : 0
      }
      
      console.log(`📊 PROCESSING ENTRY #${index + 1}:`, {
        id: entry.id.slice(0, 8),
        date: entry.periodStartDate?.split('T')[0],
        conversionRate: processedEntry.conversionRate,
        stageData: entry.customMetrics?.stageData ? Object.entries(entry.customMetrics.stageData).map(([k, v]) => `${k}=${v}`).join(', ') : 'none'
      })
      
      return processedEntry
    })
    
    // 批量更新
    recentEntries.value = newEntries
    
    console.log('✅ ENTRIES REFRESHED SUCCESSFULLY:', {
      oldCount,
      newCount: recentEntries.value.length,
      entriesChanged: oldCount !== recentEntries.value.length
    })
    
  } catch (err: any) {
    console.error('❌ ERROR LOADING RECENT ENTRIES:', err.message)
    error.value = '加载数据失败：' + (err.response?.data?.message || err.message)
  }
}

const getStageValue = (entry: any, stageId: string): number => {
  if (entry.customMetrics?.stageData) {
    return entry.customMetrics.stageData[stageId] || 0
  }
  
  const firstStage = funnelStages.value[0]
  const lastStage = funnelStages.value[funnelStages.value.length - 1]
  
  if (stageId === firstStage?.id) return entry.totalEntries || 0
  if (stageId === lastStage?.id) return entry.totalConversions || 0
  
  return 0
}

const exportData = () => {
  // Mock export functionality
  const csvData = recentEntries.value.map(entry => {
    const row = [
      formatDate(entry.date, 'YYYY-MM-DD'),
      selectedFunnel.value?.name || '',
      ...funnelStages.value.map(stage => getStageValue(entry, stage.id)),
      entry.conversionRate + '%'
    ]
    return row.join(',')
  }).join('\n')
  
  const header = [
    '日期',
    '漏斗',
    ...funnelStages.value.map(stage => stage.name),
    '总转化率'
  ].join(',')
  
  const fullCsv = header + '\n' + csvData
  
  const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${selectedFunnel.value?.name || 'funnel'}-data.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  successMessage.value = '数据导出成功'
  setTimeout(() => successMessage.value = null, 3000)
}

const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  if (type === 'success') {
    successMessage.value = message
    setTimeout(() => successMessage.value = null, 3000)
  } else if (type === 'error') {
    error.value = message
    setTimeout(() => error.value = null, 5000)
  } else {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0052d9;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 14px;
    `
    notification.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${message}`
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }
}

// Load draft on mount
const loadDraft = () => {
  const draft = localStorage.getItem('funnelDataEntryDraft')
  if (draft) {
    try {
      const parsedDraft = JSON.parse(draft)
      if (parsedDraft.funnelId && selectedFunnel.value?.id === parsedDraft.funnelId) {
        stageData.value = parsedDraft.stageData || {}
        stageSources.value = parsedDraft.stageSources || {}
        notes.value = parsedDraft.notes || ''
        if (parsedDraft.selectedDate) {
          selectedDate.value = new Date(parsedDraft.selectedDate)
        }
      }
    } catch (err) {
      console.error('Error loading draft:', err)
    }
  }
}

// 初始化周和月选项
const initializeDateOptions = () => {
  // 初始化当前周选项
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentWeek = getWeekNumber(now)
  selectedWeekOption.value = `${currentYear}-W${currentWeek}`
  
  // 初始化当前月选项
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0')
  selectedMonthOption.value = `${currentYear}-${currentMonth}`
}

// Lifecycle
onMounted(async () => {
  // 初始化日期选项
  initializeDateOptions()
  
  try {
    if ((funnelStore.funnels?.length || 0) === 0) {
      await funnelStore.fetchFunnels()
    }
    
    // 从URL参数自动选择漏斗
    const funnelId = route.query.funnelId as string
    if (funnelId && funnelStore.funnels.length > 0) {
      const funnel = funnelStore.funnels.find(f => f.id === funnelId)
      if (funnel) {
        await selectFunnel(funnel)
      }
    } else if (funnelStore.funnels.length > 0 && !selectedFunnel.value) {
      // 默认选择第一个漏斗
      const firstFunnel = funnelStore.funnels[0]
      await selectFunnel(firstFunnel)
    }
  } catch (err: any) {
    error.value = '加载漏斗列表失败'
    setTimeout(() => error.value = null, 5000)
    console.error('Error loading funnels:', err)
  }
})
</script>

<style scoped>
/* Based on the HTML reference file styles */
body {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafe;
  margin: 0;
  font-size: 14px;
  color: #1a1a1a;
  overflow-x: hidden;
}

.main-content {
  padding: 24px 32px;
  min-height: 100vh;
  background: #f8fafe;
}

.quick-entry {
  background: linear-gradient(135deg, #0052d9 0%, #366ef4 100%);
  color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 82, 217, 0.2);
}

.quick-entry h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
}

.quick-entry p {
  margin: 0;
  opacity: 0.9;
  font-size: 15px;
}

.tips-card {
  background: #fffbf0;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.tips-icon {
  color: #f59e0b;
  margin-right: 8px;
}

.tips-title {
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #92400e;
}

.tips-list li {
  margin-bottom: 4px;
  padding-left: 16px;
  position: relative;
}

.tips-list li:before {
  content: '•';
  position: absolute;
  left: 0;
}

.entry-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.funnel-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.funnel-option {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.funnel-option:hover {
  border-color: #0052d9;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.1);
}

.funnel-option.selected {
  border-color: #0052d9;
  background: white;
}

.frequency-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
  display: inline-block;
}

.freq-daily {
  background: #dcfce7;
  color: #166534;
}

.freq-weekly {
  background: #fef3c7;
  color: #92400e;
}

.freq-monthly {
  background: #e0e7ff;
  color: #3730a3;
}

.funnel-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.funnel-desc {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
}

.funnel-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.funnel-stat {
  text-align: center;
}

.funnel-stat-value {
  font-weight: 600;
  color: #0052d9;
}

.funnel-stat-label {
  color: #9ca3af;
}

#dataEntryCalendarContainer {
  margin-top: 16px !important;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.calendar-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.horizontal-calendar {
  margin-top: 16px;
}

.calendar-strip {
  display: flex;
  gap: 3px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.day-cell {
  flex: 1;
  text-align: center;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  position: relative;
}

.day-cell-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.day-cell-date {
  font-size: 13px;
  font-weight: 600;
}

.day-cell-day {
  font-size: 11px;
  opacity: 0.7;
}

.day-cell-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.day-cell.completed {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.day-cell.completed .day-cell-date {
  color: #166534;
}

.day-cell.completed .day-cell-status {
  background: #10b981;
}

.day-cell.missing {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.day-cell.missing .day-cell-date {
  color: #dc2626;
}

.day-cell.missing .day-cell-status {
  background: #ef4444;
}

.day-cell.today {
  background: #e0f2fe;
  border: 1px solid #0369a1;
}

.day-cell.today .day-cell-date {
  color: #0369a1;
  font-weight: 700;
}

.day-cell.today .day-cell-status {
  background: #0284c7;
}

.day-cell.future {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  opacity: 0.5;
  cursor: not-allowed;
}

.day-cell.future .day-cell-date {
  color: #9ca3af;
}

.day-cell.future .day-cell-status {
  background: #d1d5db;
}

.day-cell:hover:not(.future) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.data-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.form-section-icon {
  margin-right: 8px;
  color: #0052d9;
}

.frequency-warning {
  background: #fffbf0;
  border: 1px solid #fcd34d;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.date-picker-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.weekly-picker {
  display: block;
  margin-bottom: 24px;
}

.monthly-picker {
  display: block;
  margin-bottom: 24px;
}

.quick-date-btns {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.quick-date-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.quick-date-btn:hover,
.quick-date-btn.active {
  border-color: #0052d9;
  background: #f0f8ff;
  color: #0052d9;
}

/* 不同频率时间选择器的区别样式 */
#dailyPicker {
  border-left: 3px solid #10b981;
  background: #f0fdf4;
  padding: 16px;
  border-radius: 8px;
}

#weeklyPicker {
  border-left: 3px solid #f59e0b;
  background: #fffbeb;
  padding: 16px;
  border-radius: 8px;
}

#monthlyPicker {
  border-left: 3px solid #8b5cf6;
  background: #faf5ff;
  padding: 16px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #0052d9;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
}

.stage-input-group {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  align-items: end;
  margin-bottom: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.conversion-indicator {
  text-align: center;
  padding: 8px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #bae6fd;
}

.conversion-rate {
  font-size: 18px;
  font-weight: 700;
  color: #0052d9;
}

.conversion-label {
  font-size: 12px;
  color: #6b7280;
}

.btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #0052d9;
  color: white;
}

.btn-primary:hover {
  background: #003db7;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.history-table th,
.history-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.history-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.history-table tbody tr:hover {
  background: #f9fafb;
}
</style>