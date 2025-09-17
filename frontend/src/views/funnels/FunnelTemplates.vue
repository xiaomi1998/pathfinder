<template>
  <div class="funnel-templates-page">
    <!-- 头部卡片 -->
    <div class="header-card">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">漏斗模板库</h1>
          <p class="text-gray-600">选择适合您业务的漏斗模板，快速开始数据分析</p>
        </div>
        <button @click="goBack" class="btn btn-secondary">
          <i class="fas fa-arrow-left mr-2"></i>返回漏斗管理
        </button>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <div class="nav-tabs">
        <div 
          v-for="tab in categoryTabs" 
          :key="tab.key"
          @click="switchCategory(tab.key)"
          :class="[
            'nav-tab',
            currentCategory === tab.key ? 'active' : ''
          ]"
        >
          <i :class="tab.icon" class="mr-2"></i>{{ tab.name }}
        </div>
      </div>
      
      <!-- 筛选标签 -->
      <div class="filter-chips">
        <!-- 行业筛选 -->
        <div v-if="currentCategory === 'industry'" class="flex gap-2 flex-wrap">
          <div 
            v-for="filter in industryFilters" 
            :key="filter.key"
            @click="filterTemplates(filter.key)"
            :class="[
              'filter-chip',
              currentFilter === filter.key ? 'active' : ''
            ]"
          >
            {{ filter.name }}
          </div>
        </div>
        
        <!-- 功能筛选 -->
        <div v-if="currentCategory === 'function'" class="flex gap-2 flex-wrap">
          <div 
            v-for="filter in functionFilters" 
            :key="filter.key"
            @click="filterTemplates(filter.key)"
            :class="[
              'filter-chip',
              currentFilter === filter.key ? 'active' : ''
            ]"
          >
            {{ filter.name }}
          </div>
        </div>
        
        <!-- 热门筛选 -->
        <div v-if="currentCategory === 'popular'" class="flex gap-2 flex-wrap">
          <div 
            v-for="filter in popularFilters" 
            :key="filter.key"
            @click="filterTemplates(filter.key)"
            :class="[
              'filter-chip',
              currentFilter === filter.key ? 'active' : ''
            ]"
          >
            {{ filter.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 模板网格 -->
    <div class="templates-grid">
      <div v-if="filteredTemplatesForDisplay.length === 0" class="empty-state col-span-full">
        <i class="fas fa-search text-gray-300 text-5xl mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">暂无模板</h3>
        <p class="text-gray-500">当前筛选条件下没有找到合适的模板</p>
      </div>
      
      <div 
        v-for="template in filteredTemplatesForDisplay" 
        :key="template.id"
        class="template-card"
        @click="openPreview(template)"
      >
        <!-- 推荐徽章 -->
        <div v-if="template.recommended" class="recommended-badge">
          推荐
        </div>
        
        <!-- 模板头部 -->
        <div class="template-header">
          <div>
            <!-- 模板图标 -->
            <div 
              class="template-icon"
              :style="{ background: template.iconBg }"
            >
              {{ template.icon }}
            </div>
            
            <!-- 模板标题和描述 -->
            <div class="template-title">{{ template.title }}</div>
            <div class="template-desc">{{ template.desc }}</div>
          </div>
        </div>
        
        <!-- 模板标签 -->
        <div class="template-tags">
          <div class="template-tag tag-industry">
            {{ getIndustryName(template.industry) }}
          </div>
          <div class="template-tag tag-function">
            {{ getFunctionName(template.function) }}
          </div>
          <div class="template-tag tag-difficulty">
            {{ template.difficulty }}
          </div>
        </div>
        
        <!-- 模板阶段预览 -->
        <div class="template-stages">
          <div class="stages-preview">
            <template v-for="(stage, index) in template.stages" :key="index">
              <div class="stage-mini">
                {{ stage }}
              </div>
              <i v-if="index < template.stages.length - 1" class="fas fa-chevron-right stage-arrow"></i>
            </template>
          </div>
        </div>
        
        <!-- 模板统计 -->
        <div class="template-stats">
          <div class="stat-item">
            <span class="stat-value">{{ template.stats.usage }}</span>
            <span class="stat-label">使用次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ template.stats.conversion }}</span>
            <span class="stat-label">平均转化率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ template.stats.cycle }}</span>
            <span class="stat-label">转化周期</span>
          </div>
        </div>
        
        <!-- 模板操作 -->
        <div class="template-actions">
          <button 
            @click.stop="openPreview(template)"
            class="btn btn-secondary"
          >
            <i class="fas fa-eye mr-1"></i>预览
          </button>
          <button 
            @click.stop="createFunnelFromTemplate(template.id)"
            class="btn btn-primary"
          >
            <i class="fas fa-plus mr-1"></i>使用模板
          </button>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="previewModalVisible" class="preview-modal">
      <div class="preview-content">
        <div class="preview-header">
          <h3 class="text-xl font-semibold">{{ previewTemplate?.title }}</h3>
          <button @click="closePreview" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="preview-body" v-if="previewTemplate">
          <!-- 预览内容 -->
          <div class="template-overview mb-6">
            <div class="flex items-center mb-4">
              <div 
                class="template-icon w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white mr-4"
                :style="{ background: previewTemplate.iconBg }"
              >
                {{ previewTemplate.icon }}
              </div>
              <div>
                <h3 class="text-xl font-bold mb-2">{{ previewTemplate.title }}</h3>
                <p class="text-gray-600">{{ previewTemplate.details?.description || previewTemplate.desc }}</p>
              </div>
            </div>
          </div>
          
          <div class="usage-stats">
            <div class="usage-item">
              <div class="usage-value">{{ previewTemplate.stats.usage }}</div>
              <div class="usage-label">使用次数</div>
            </div>
            <div class="usage-item">
              <div class="usage-value">{{ previewTemplate.stats.conversion }}</div>
              <div class="usage-label">平均转化率</div>
            </div>
            <div class="usage-item">
              <div class="usage-value">{{ previewTemplate.stats.cycle }}</div>
              <div class="usage-label">转化周期</div>
            </div>
            <div class="usage-item">
              <div class="usage-value">{{ getIndustryName(previewTemplate.industry) }}</div>
              <div class="usage-label">适用行业</div>
            </div>
          </div>
          
          <div class="funnel-visualization">
            <h4 class="font-semibold mb-3">漏斗阶段可视化</h4>
            <div 
              v-for="(stage, index) in previewTemplate.stages" 
              :key="index"
              class="funnel-stage"
              :style="{ 
                background: `linear-gradient(135deg, ${getStageColor(index)} 0%, ${getStageColor(index, true)} 100%)`,
                width: `${100 - index * 15}%`
              }"
            >
              <div class="font-medium">{{ stage }}</div>
            </div>
          </div>
          
          <div v-if="previewTemplate.details?.kpis" class="mb-6">
            <h4 class="font-semibold mb-3">关键指标 (KPIs)</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="kpi in previewTemplate.details.kpis" 
                :key="kpi"
                class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                {{ kpi }}
              </span>
            </div>
          </div>
          
          <div v-if="previewTemplate.details?.best_practices" class="mb-6">
            <h4 class="font-semibold mb-3">最佳实践建议</h4>
            <ul class="space-y-2">
              <li 
                v-for="practice in previewTemplate.details.best_practices" 
                :key="practice"
                class="flex items-start"
              >
                <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                <span>{{ practice }}</span>
              </li>
            </ul>
          </div>
          
          <div class="flex gap-3 pt-4 border-t">
            <button @click="closePreview" class="btn btn-secondary flex-1">
              关闭预览
            </button>
            <button 
              @click="createFunnelFromTemplate(previewTemplate.id)"
              class="btn btn-primary flex-1"
            >
              <i class="fas fa-plus mr-2"></i>使用此模板
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFunnel } from '@/composables/useFunnel'
import { FUNNEL_TEMPLATES, getIndustryName, getFunctionName, getStageColor, useTemplateFilters } from '@/data/funnelTemplates'

const router = useRouter()

// 状态管理
const currentCategory = ref('industry')
const currentFilter = ref('all')
const previewModalVisible = ref(false)
const previewTemplate = ref(null)
const isCreating = ref(false)

// 分类标签定义
const categoryTabs = [
  { key: 'industry', name: '按行业分类', icon: 'fas fa-industry' },
  { key: 'function', name: '按功能分类', icon: 'fas fa-cogs' },
  { key: 'popular', name: '热门推荐', icon: 'fas fa-fire' }
]

const industryFilters = [
  { key: 'all', name: '全部' },
  { key: 'saas', name: 'SaaS软件' },
  { key: 'ecommerce', name: '电商零售' },
  { key: 'education', name: '在线教育' },
  { key: 'finance', name: '金融服务' },
  { key: 'healthcare', name: '医疗健康' },
  { key: 'realestate', name: '房地产' },
  { key: 'consulting', name: '咨询服务' }
]

const functionFilters = [
  { key: 'all', name: '全部' },
  { key: 'sales', name: '销售转化' },
  { key: 'marketing', name: '营销获客' },
  { key: 'retention', name: '用户留存' },
  { key: 'activation', name: '用户激活' },
  { key: 'referral', name: '推荐传播' },
  { key: 'support', name: '客户服务' }
]

const popularFilters = [
  { key: 'all', name: '全部' },
  { key: 'trending', name: '本周热门' },
  { key: 'new', name: '最新上架' },
  { key: 'recommended', name: '官方推荐' }
]

// 使用模板数据和筛选器
const templateData = FUNNEL_TEMPLATES
const { filterByIndustry, filterByFunction, getRecommendedTemplates, getTrendingTemplates } = useTemplateFilters()

// 筛选后的模板数据
const filteredTemplatesForDisplay = computed(() => {
  let filtered = Object.values(templateData)
  
  // 根据当前分类和筛选器过滤模板
  if (currentCategory.value === 'industry' && currentFilter.value !== 'all') {
    filtered = filterByIndustry(templateData, currentFilter.value)
  } else if (currentCategory.value === 'function' && currentFilter.value !== 'all') {
    filtered = filterByFunction(templateData, currentFilter.value)
  } else if (currentCategory.value === 'popular') {
    if (currentFilter.value === 'trending') {
      filtered = getTrendingTemplates(templateData)
    } else if (currentFilter.value === 'recommended') {
      filtered = getRecommendedTemplates(templateData)
    }
  }
  
  return filtered
})

// 导航和筛选操作
const goBack = () => {
  router.push('/funnels')
}

const switchCategory = (category: string) => {
  currentCategory.value = category
  currentFilter.value = 'all'
}

const filterTemplates = (filter: string) => {
  currentFilter.value = filter
}

const openPreview = (template: any) => {
  previewTemplate.value = template
  previewModalVisible.value = true
}

const closePreview = () => {
  previewModalVisible.value = false
  previewTemplate.value = null
}

// 漏斗创建功能
const { createFunnel: createFunnelAPI } = useFunnel()

const createFunnelFromTemplate = async (templateId: string) => {
  const template = templateData[templateId]
  if (!template) {
    alert('模板不存在')
    return
  }

  try {
    isCreating.value = true
    
    // 构建基于模板的漏斗数据
    const dataPeriod = getTemplatePeriod(template)
    const nodes = generateNodesFromTemplate(template)
    const connections = generateConnectionsFromTemplate(template, nodes)
    
    const funnelData = {
      name: template.title,
      description: template.desc,
      dataPeriod: dataPeriod,
      canvasData: {
        nodes: nodes,
        connections: connections
      }
    }

    await createFunnelAPI(funnelData)
    
    alert(`漏斗 "${template.title}" 创建成功！`)
    closePreview()
    router.push('/funnels')
  } catch (error: any) {
    console.error('从模板创建漏斗失败:', error)
    alert(`创建失败: ${error.message || '未知错误'}`)
  } finally {
    isCreating.value = false
  }
}

// 从模板生成节点数据
const generateNodesFromTemplate = (template: any) => {
  return template.stages.map((stageName: string, index: number) => ({
    id: `node_${index + 1}`,
    name: stageName,
    label: stageName,
    type: index === 0 ? 'start' : (index === template.stages.length - 1 ? 'conversion' : 'stage'),
    x: 100 + index * 200,
    y: 200,
    width: 140,
    height: 100,
    color: getStageColorForNode(index, template.stages.length)
  }))
}

// 从模板生成连接数据
const generateConnectionsFromTemplate = (template: any, nodes: any[]) => {
  return nodes.slice(0, -1).map((_, index) => ({
    id: `conn_${index + 1}`,
    from: `node_${index + 1}`,
    to: `node_${index + 2}`,
    fromAnchor: 'right',
    toAnchor: 'left'
  }))
}

// 获取模板的数据周期
const getTemplatePeriod = (template: any) => {
  // 根据模板特性推断数据周期
  if (template.industry === 'finance' || template.industry === 'realestate') {
    return 'MONTHLY'
  } else if (template.industry === 'education' || template.function === 'retention') {
    return 'WEEKLY'
  }
  return 'DAILY'
}

// 为节点生成颜色
const getStageColorForNode = (index: number, totalStages: number) => {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16']
  if (index === 0) return '#10B981' // 起始阶段总是绿色
  if (index === totalStages - 1) return '#EF4444' // 转化阶段总是红色
  return colors[index % colors.length]
}
</script>

<style scoped>
/* 基于参考HTML的样式 */
.funnel-templates-page {
  font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafe;
  min-height: 100vh;
  padding: 16px;
  font-size: 14px;
  color: #1a1a1a;
}

.header-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-nav {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.nav-tab {
  padding: 12px 20px;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  color: #6b7280;
  position: relative;
}

.nav-tab:hover {
  color: #0052d9;
}

.nav-tab.active {
  color: #0052d9;
  border-bottom-color: #0052d9;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.filter-chip:hover,
.filter-chip.active {
  background: #0052d9;
  color: white;
  border-color: #0052d9;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.template-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #dcdcdc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.recommended-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff6b35;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.template-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  margin-bottom: 12px;
}

.template-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 6px;
}

.template-desc {
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.template-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.template-tag {
  padding: 3px 8px;
  background: #f3f4f6;
  border-radius: 10px;
  font-size: 11px;
  color: #6b7280;
}

.tag-industry {
  background: #e6f7ff;
  color: #0052d9;
}

.tag-function {
  background: #f0fdf4;
  color: #16a34a;
}

.tag-difficulty {
  background: #fef3c7;
  color: #d97706;
}

.template-stages {
  margin-bottom: 16px;
}

.stages-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  overflow-x: auto;
  padding: 2px;
}

.stage-mini {
  min-width: 60px;
  height: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #64748b;
  text-align: center;
}

.stage-arrow {
  color: #94a3b8;
  font-size: 10px;
}

.template-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 12px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-weight: 600;
  color: #0052d9;
  display: block;
}

.stat-label {
  color: #6b7280;
}

.template-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-primary {
  background: #0052d9;
  color: white;
}

.btn-primary:hover {
  background: #003db7;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.preview-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.preview-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.preview-body {
  padding: 24px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  grid-column: 1 / -1;
}

.usage-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  background: #e6f7ff;
  border: 1px solid #91caff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.usage-item {
  text-align: center;
}

.usage-value {
  font-size: 18px;
  font-weight: 700;
  color: #0052d9;
}

.usage-label {
  font-size: 12px;
  color: #1890ff;
}

.funnel-visualization {
  background: #f8fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.funnel-stage {
  color: white;
  padding: 12px 24px;
  margin: 8px auto;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  position: relative;
}
</style>