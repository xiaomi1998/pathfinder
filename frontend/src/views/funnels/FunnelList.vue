<template>
  <div class="funnel-management-page bg-gradient-pathfinder min-h-screen p-2">
    <!-- 头部卡片 -->
    <div class="card-pathfinder header-card hero-section">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">漏斗管理</h1>
          <p class="text-gray-600">创建、编辑和管理您的转化漏斗</p>
        </div>
        <div class="flex gap-3">
          <router-link to="/funnels/templates" class="btn-pathfinder btn-secondary-pathfinder">
            <i class="fas fa-clone mr-2"></i>使用模板
          </router-link>
          <button class="btn-pathfinder btn-primary-pathfinder" @click="toggleCreateForm">
            <i class="fas fa-plus mr-2"></i>创建漏斗
          </button>
        </div>
      </div>
    </div>

    <!-- 创建漏斗表单 -->
    <div class="card-pathfinder create-funnel-form animate-slide-in" :class="{ 'form-visible': showCreateForm }">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-semibold text-gray-900">创建新漏斗</h3>
        <button @click="toggleCreateForm" class="text-gray-400 hover:text-gray-600 transition-colors">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="form-group-compact">
          <label class="form-label-compact">漏斗名称</label>
          <input type="text" class="form-input-pathfinder" placeholder="请输入漏斗名称" v-model="newFunnelForm.name">
        </div>
        <div class="form-group-compact">
          <label class="form-label-compact">业务类型</label>
          <select class="form-input-pathfinder" v-model="newFunnelForm.businessType">
            <option value="sales">销售转化</option>
            <option value="product">产品试用</option>
            <option value="marketing">内容营销</option>
            <option value="campaign">活动推广</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>
      
      <div class="update-frequency-section-compact">
        <div class="flex items-center mb-2">
          <i class="fas fa-clock text-blue-600 mr-2 text-sm"></i>
          <label class="form-label-compact mb-0">数据更新周期</label>
        </div>
        <p class="text-xs text-blue-700 mb-2">选择数据录入的频率，这将影响数据录入界面的展示方式</p>
        
        <div class="frequency-options-compact">
          <div class="frequency-option-compact" 
               :class="{ selected: newFunnelForm.frequency === 'daily' }" 
               @click="selectFrequency('daily')">
            <div class="frequency-title-compact">日更新</div>
            <div class="frequency-desc-compact">每日录入</div>
          </div>
          <div class="frequency-option-compact" 
               :class="{ selected: newFunnelForm.frequency === 'weekly' }" 
               @click="selectFrequency('weekly')">
            <div class="frequency-title-compact">周更新</div>
            <div class="frequency-desc-compact">每周录入</div>
          </div>
          <div class="frequency-option-compact" 
               :class="{ selected: newFunnelForm.frequency === 'monthly' }" 
               @click="selectFrequency('monthly')">
            <div class="frequency-title-compact">月更新</div>
            <div class="frequency-desc-compact">每月录入</div>
          </div>
        </div>
      </div>
      
      <div class="form-group-compact">
        <label class="form-label-compact">描述</label>
        <textarea class="form-textarea-pathfinder-compact" placeholder="请描述该漏斗的用途和目标" v-model="newFunnelForm.description"></textarea>
      </div>
      
      <div class="form-group-compact">
        <label class="form-label-compact">转化阶段配置</label>
        <div class="space-y-2">
          <div v-for="(stage, index) in newFunnelForm.stages" :key="index" class="flex gap-2">
            <input type="text" class="form-input-pathfinder" :placeholder="`阶段${index + 1}`" v-model="stage.name">
            <button class="btn-pathfinder btn-danger-pathfinder px-2 py-1" @click="removeStage(index)">
              <i class="fas fa-trash text-xs"></i>
            </button>
          </div>
          <button class="btn-pathfinder btn-secondary-pathfinder w-full py-2 text-sm" @click="addStage">
            <i class="fas fa-plus mr-2"></i>添加阶段
          </button>
        </div>
      </div>
      
      <div class="flex justify-end gap-2 pt-2 border-t border-gray-200">
        <button class="btn-pathfinder btn-secondary-pathfinder px-4 py-2 text-sm" @click="toggleCreateForm">取消</button>
        <button class="btn-pathfinder btn-primary-pathfinder px-4 py-2 text-sm" @click="createFunnel" :disabled="isCreating">
          {{ isCreating ? '创建中...' : '创建漏斗' }}
        </button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <input type="text" class="search-input" placeholder="搜索漏斗名称..." v-model="searchQuery">
      <select class="filter-select" v-model="statusFilter">
        <option value="">全部状态</option>
        <option value="active">活跃</option>
        <option value="draft">草稿</option>
        <option value="paused">已暂停</option>
      </select>
      <select class="filter-select" v-model="typeFilter">
        <option value="">全部类型</option>
        <option value="sales">销售转化</option>
        <option value="product">产品试用</option>
        <option value="marketing">内容营销</option>
        <option value="campaign">活动推广</option>
      </select>
      <select class="filter-select" v-model="sortBy">
        <option value="created">按创建时间排序</option>
        <option value="conversion">按转化率排序</option>
        <option value="activity">按活跃度排序</option>
      </select>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p class="text-gray-500">加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button @click="loadFunnels" class="btn-pathfinder btn-primary-pathfinder">重新加载</button>
    </div>

    <!-- 漏斗卡片列表 -->
    <div v-else-if="filteredFunnels.length > 0">
      <div v-for="funnel in filteredFunnels" :key="funnel.id" class="card-pathfinder funnel-card animate-slide-in">
        <!-- 漏斗头部 -->
        <div class="funnel-header">
          <div>
            <div class="funnel-title">{{ funnel.name }}</div>
            <div class="funnel-desc">{{ funnel.description || '暂无描述' }}</div>
            <div class="frequency-badge" :class="getFrequencyClass(funnel.dataPeriod)">
              {{ getFrequencyText(funnel.dataPeriod) }}
            </div>
          </div>
          <div class="funnel-status" :class="getStatusClass(funnel.status)">
            {{ getStatusText(funnel.status) }}
          </div>
        </div>
        
        <!-- 漏斗阶段 -->
        <div class="funnel-stages">
          <template v-for="(stage, index) in getFunnelStages(funnel)" :key="index">
            <div class="stage">
              <div class="stage-name">{{ stage.name }}</div>
              <div class="stage-count">{{ formatNumber(stage.count) }}</div>
              <div class="stage-rate">{{ stage.rate }}%</div>
            </div>
            <div v-if="index < getFunnelStages(funnel).length - 1" class="stage-arrow">
              <i class="fas fa-arrow-right"></i>
            </div>
          </template>
        </div>
        
        <!-- 漏斗指标 -->
        <div class="funnel-metrics">
          <div class="metric">
            <div class="metric-value">{{ getOverallConversionRate(funnel) }}%</div>
            <div class="metric-label">总转化率</div>
          </div>
          <div class="metric">
            <div class="metric-value">{{ getAverageCycle(funnel) }}天</div>
            <div class="metric-label">平均周期</div>
          </div>
          <div class="metric">
            <div class="metric-value">¥{{ formatCurrency(getAverageOrderValue(funnel)) }}</div>
            <div class="metric-label">客单价</div>
          </div>
          <div class="metric">
            <div class="metric-value">¥{{ formatCurrency(getMonthlyRevenue(funnel)) }}</div>
            <div class="metric-label">月营收</div>
          </div>
        </div>
        
        <!-- 最后更新时间 -->
        <div class="funnel-update-time" v-if="funnelMetrics[funnel.id]?.lastUpdated">
          <i class="fas fa-clock text-gray-400 text-xs mr-1"></i>
          <span class="text-xs text-gray-500">最后更新: {{ formatUpdateTime(funnelMetrics[funnel.id].lastUpdated) }}</span>
        </div>
        
        <!-- 漏斗操作 -->
        <div class="funnel-actions">
          <router-link :to="`/funnels/${funnel.id}/edit`" class="btn-pathfinder btn-primary-pathfinder">
            <i class="fas fa-edit mr-2"></i>编辑
          </router-link>
          <button class="btn-pathfinder btn-secondary-pathfinder" @click="duplicateFunnel(funnel)">
            <i class="fas fa-copy mr-2"></i>复制
          </button>
          <button class="btn-pathfinder btn-danger-pathfinder" @click="deleteFunnel(funnel.id, funnel.name)" :disabled="isDeleting">
            <i class="fas fa-trash mr-2"></i>删除
          </button>
        </div>
      </div>

    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">
        <i class="fas fa-filter"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">未找到漏斗</h3>
      <p class="text-gray-500 mb-4">通过创建您的第一个漏斗来开始</p>
      <button @click="toggleCreateForm" class="btn-pathfinder btn-primary-pathfinder">
        <i class="fas fa-plus mr-2"></i>创建新漏斗
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFunnel } from '@/composables/useFunnel'
import { useRouter } from 'vue-router'
import { FUNNEL_TEMPLATES } from '@/data/funnelTemplates'
import { dashboardAPI } from '@/api/dashboard'

// 基本状态
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const sortBy = ref('created')
// 使用 composable 中的状态
const isLoadingLocal = ref(false)
const errorLocal = ref('')

// 组合状态
const isLoading = computed(() => funnelLoading.value || isLoadingLocal.value)
const error = computed(() => funnelError.value || errorLocal.value || '')
const isDeleting = ref(false)
const isCreating = ref(false)

// 表单状态
const showCreateForm = ref(false)

// 创建漏斗表单
const newFunnelForm = ref({
  name: '',
  businessType: 'sales',
  frequency: 'daily',
  description: '',
  stages: [
    { name: '获取线索' },
    { name: '首次接触' },
    { name: '产品演示' }
  ]
})

const router = useRouter()

// 使用真实的漏斗数据
const { funnels: realFunnels, fetchFunnels, isLoading: funnelLoading, error: funnelError } = useFunnel()

// 存储漏斗的最新指标数据
const funnelMetrics = ref<Record<string, any>>({})

// 筛选后的漏斗数据
const filteredFunnels = computed(() => {
  let filtered = realFunnels.value.filter(funnel => {
    const matchesSearch = funnel.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         (funnel.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesStatus = !statusFilter.value || getStatusKey(funnel) === statusFilter.value
    const matchesType = !typeFilter.value || getBusinessType(funnel) === typeFilter.value
    
    return matchesSearch && matchesStatus && matchesType
  })

  // 排序
  if (sortBy.value === 'conversion') {
    filtered.sort((a, b) => parseFloat(getOverallConversionRate(b)) - parseFloat(getOverallConversionRate(a)))
  } else if (sortBy.value === 'activity') {
    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  return filtered
})

// 工具函数
const getFrequencyClass = (dataPeriod: string) => {
  switch (dataPeriod?.toUpperCase()) {
    case 'DAILY': return 'freq-daily'
    case 'WEEKLY': return 'freq-weekly'
    case 'MONTHLY': return 'freq-monthly'
    default: return 'freq-daily'
  }
}

const getFrequencyText = (dataPeriod: string) => {
  switch (dataPeriod?.toUpperCase()) {
    case 'DAILY': return '日更新'
    case 'WEEKLY': return '周更新'
    case 'MONTHLY': return '月更新'
    default: return '日更新'
  }
}

const getStatusClass = (status: string) => {
  if (status === 'ACTIVE') return 'status-active'
  return 'status-draft'
}

const getStatusText = (status: string) => {
  if (status === 'ACTIVE') return '活跃'
  return '草稿'
}

const getStatusKey = (funnel: any) => {
  if (funnel.status === 'ACTIVE') return 'active'
  return 'draft'
}

const getBusinessType = (funnel: any) => {
  // 根据漏斗名称或描述推测业务类型
  const name = (funnel.name || '').toLowerCase()
  const desc = (funnel.description || '').toLowerCase()
  
  if (name.includes('销售') || name.includes('sale') || desc.includes('销售')) return 'sales'
  if (name.includes('试用') || name.includes('产品') || desc.includes('试用')) return 'product'
  if (name.includes('营销') || name.includes('内容') || desc.includes('营销')) return 'marketing'
  if (name.includes('活动') || name.includes('推广') || desc.includes('活动')) return 'campaign'
  
  return 'sales' // 默认
}

const getFunnelStages = (funnel: any) => {
  const metrics = funnelMetrics.value[funnel.id]
  
  if (metrics?.stageMetrics && metrics.stageMetrics.length > 0) {
    return metrics.stageMetrics.map((stage: any) => ({
      name: stage.nodeName,
      count: stage.entries || 0,
      rate: stage.conversionRate?.toFixed(1) || '0.0'
    }))
  }
  
  const stageNames = getNodeNames(funnel)
  
  if (stageNames.length === 0) {
    return []
  }

  return stageNames.map((name, index) => ({
    name,
    count: 0,
    rate: '0.0'
  }))
}

const getNodeNames = (funnel: any): string[] => {
  if (funnel.canvasData && funnel.canvasData.nodes) {
    try {
      const canvasData = typeof funnel.canvasData === 'string' 
        ? JSON.parse(funnel.canvasData) 
        : funnel.canvasData
      
      if (canvasData.nodes && Array.isArray(canvasData.nodes)) {
        const sortedNodes = canvasData.nodes
          .filter(node => node && (node.data?.label || node.label || node.name))
          .sort((a, b) => (a.position?.x || a.x || 0) - (b.position?.x || b.x || 0))
          .map(node => node.data?.label || node.label || node.name || '节点')
          .filter(name => name && name.trim() !== '')
        
        if (sortedNodes.length > 0) {
          return sortedNodes
        }
      }
    } catch (error) {
      console.error('Failed to parse canvasData:', error)
    }
  }
  
  return []
}

const getOverallConversionRate = (funnel: any) => {
  const metrics = funnelMetrics.value[funnel.id]
  return metrics?.overallConversionRate?.toFixed(1) || '0.0'
}

const getAverageCycle = (funnel: any) => {
  const metrics = funnelMetrics.value[funnel.id]
  return metrics?.averageCycleDays || 0
}

const getAverageOrderValue = (funnel: any) => {
  const metrics = funnelMetrics.value[funnel.id]
  return metrics?.averageOrderValue || 0
}

const getMonthlyRevenue = (funnel: any) => {
  const metrics = funnelMetrics.value[funnel.id]
  return metrics?.totalRevenue || 0
}

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

const formatUpdateTime = (date: string) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return d.toLocaleDateString('zh-CN')
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000) {
    return Math.floor(amount / 1000) + 'k'
  }
  return amount.toString()
}

// 表单操作
const toggleCreateForm = () => {
  showCreateForm.value = !showCreateForm.value
}

const selectFrequency = (frequency: string) => {
  newFunnelForm.value.frequency = frequency
}

const addStage = () => {
  newFunnelForm.value.stages.push({ name: '' })
}

const removeStage = (index: number) => {
  if (newFunnelForm.value.stages.length > 1) {
    newFunnelForm.value.stages.splice(index, 1)
  }
}

const { createFunnel: createFunnelAPI } = useFunnel()

const createFunnel = async () => {
  if (!newFunnelForm.value.name.trim()) {
    alert('请输入漏斗名称')
    return
  }

  if (newFunnelForm.value.stages.some(stage => !stage.name.trim())) {
    alert('请填写所有阶段名称')
    return
  }

  isCreating.value = true
  
  try {
    // 构建漏斗数据
    const funnelData = {
      name: newFunnelForm.value.name,
      description: newFunnelForm.value.description,
      dataPeriod: newFunnelForm.value.frequency.toUpperCase(),
      canvasData: {
        nodes: newFunnelForm.value.stages.map((stage, index) => ({
          id: `node_${index + 1}`,
          name: stage.name,
          label: stage.name,
          type: index === 0 ? 'start' : (index === newFunnelForm.value.stages.length - 1 ? 'conversion' : 'stage'),
          x: 100 + index * 200,
          y: 200,
          width: 140,
          height: 100,
          color: index === 0 ? '#10B981' : (index === newFunnelForm.value.stages.length - 1 ? '#EF4444' : '#3B82F6')
        })),
        connections: newFunnelForm.value.stages.slice(0, -1).map((_, index) => ({
          id: `conn_${index + 1}`,
          from: `node_${index + 1}`,
          to: `node_${index + 2}`,
          fromAnchor: 'right',
          toAnchor: 'left'
        }))
      }
    }

    await createFunnelAPI(funnelData)
    
    // 重置表单
    newFunnelForm.value = {
      name: '',
      businessType: 'sales',
      frequency: 'daily',
      description: '',
      stages: [
        { name: '获取线索' },
        { name: '首次接触' },
        { name: '产品演示' }
      ]
    }
    
    showCreateForm.value = false
    await loadFunnels()
    
    alert('漏斗创建成功！')
  } catch (error: any) {
    console.error('创建漏斗失败:', error)
    alert(`创建失败: ${error.message || '未知错误'}`)
  } finally {
    isCreating.value = false
  }
}

// 漏斗操作
const { duplicateFunnel: duplicateFunnelAPI, deleteFunnel: deleteFunnelAPI } = useFunnel()

const duplicateFunnel = async (funnel: any) => {
  const confirmed = confirm(`确定要复制漏斗 "${funnel.name}" 吗？`)
  if (!confirmed) return
  
  try {
    await duplicateFunnelAPI(funnel.id, `${funnel.name} (副本)`)
    await loadFunnels()
    
    alert('漏斗复制成功！')
  } catch (error: any) {
    console.error('复制漏斗失败:', error)
    alert(`复制失败: ${error.message || '未知错误'}`)
  }
}

const deleteFunnel = async (funnelId: string, funnelName: string) => {
  const confirmed = confirm(`确定要删除漏斗 "${funnelName}" 吗？\n\n此操作将永久删除漏斗及其所有数据，无法恢复。`)
  
  if (!confirmed) return
  
  try {
    isDeleting.value = true
    
    await deleteFunnelAPI(funnelId)
    
    await loadFunnels()
  } catch (error: any) {
    console.error('删除漏斗失败:', error)
    alert(`删除失败: ${error.message || '未知错误'}`)
  } finally {
    isDeleting.value = false
  }
}

const loadFunnels = async () => {
  isLoadingLocal.value = true
  errorLocal.value = ''
  
  try {
    await fetchFunnels()
    
    // 为每个漏斗加载最新的指标数据
    for (const funnel of realFunnels.value) {
      try {
        const response = await dashboardAPI.getFunnelMetrics(funnel.id)
        if (response.data.success && response.data.data) {
          funnelMetrics.value[funnel.id] = response.data.data
        }
      } catch (error) {
        console.error(`Failed to load metrics for funnel ${funnel.id}:`, error)
      }
    }
  } catch (err: any) {
    errorLocal.value = err.message || '加载漏斗数据失败'
  } finally {
    isLoadingLocal.value = false
  }
}

onMounted(() => {
  loadFunnels()
})
</script>

<style scoped>
/* 基于模板的Pathfinder漏斗管理样式 */
.funnel-management-page {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  overflow-x: hidden;
}

.header-card {
  padding: 20px;
  margin-bottom: 20px;
}

.funnel-card {
  padding: 20px;
  margin-bottom: 16px;
}

.funnel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.funnel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.funnel-desc {
  color: #6b7280;
  font-size: 13px;
}

.funnel-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #e6f7ff;
  color: #1890ff;
}

.status-draft {
  background: #fff7e6;
  color: #fa8c16;
}

.funnel-stages {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.stage {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  min-width: 120px;
  text-align: center;
  position: relative;
}

.stage-name {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.stage-count {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.stage-rate {
  font-size: 11px;
  color: #10b981;
  margin-top: 2px;
}

.stage-arrow {
  color: #0052d9;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.stage-arrow i {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.funnel-option:hover .stage-arrow i {
  opacity: 1;
}

.funnel-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.metric {
  text-align: center;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #0052d9;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}
.funnel-update-time {
  padding: 8px 0;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  margin-top: 12px;
}

.funnel-actions {
  display: flex;
  gap: 8px;
}

/* 移除原有btn样式，使用全局pathfinder按钮样式 */

/* 保持兼容性的按钮样式 */
a.btn-pathfinder {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 13px;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

/* 优化后的创建漏斗表单样式 */
.create-funnel-form {
  padding: 20px;
  margin-bottom: 20px;
  display: none;
}

.create-funnel-form.form-visible {
  display: block;
}

/* 紧凑型表单样式 */
.form-group-compact {
  margin-bottom: 12px;
}

.form-label-compact {
  display: block;
  margin-bottom: 3px;
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.form-textarea-pathfinder-compact {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
  min-height: 60px;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.form-textarea-pathfinder-compact:focus {
  outline: none;
  border-color: #0052d9;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
}

/* 紧凑型频率选择区域 */
.update-frequency-section-compact {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.frequency-options-compact {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.frequency-option-compact {
  flex: 1;
  padding: 8px 6px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.frequency-option-compact:hover {
  border-color: #0052d9;
}

.frequency-option-compact.selected {
  border-color: #0052d9;
  background: #f0f8ff;
}

.frequency-title-compact {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
  font-size: 13px;
}

.frequency-desc-compact {
  font-size: 11px;
  color: #6b7280;
}

/* 保留原有样式用于兼容性 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #374151;
}

.update-frequency-section {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.frequency-options {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.frequency-option {
  flex: 1;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.frequency-option:hover {
  border-color: #0052d9;
}

.frequency-option.selected {
  border-color: #0052d9;
  background: #f0f8ff;
}

.frequency-title {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.frequency-desc {
  font-size: 12px;
  color: #6b7280;
}

.frequency-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 16px;
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
</style>