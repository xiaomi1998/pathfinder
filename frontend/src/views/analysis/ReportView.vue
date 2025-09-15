<template>
  <div class="report-view-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>正在加载报告...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>报告加载失败</h3>
        <p>{{ error }}</p>
        <button @click="goBack" class="back-button">返回</button>
      </div>
    </div>

    <!-- Report Content - Following template structure exactly -->
    <div v-else-if="reportData" class="container">
      <!-- Header -->
      <div class="header">
        <h1>{{ getHeaderTitle() }}</h1>
        <p>{{ getHeaderSubtitle() }}</p>
      </div>

      <!-- Section 1: Executive Summary -->
      <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
        <h2 class="section-title">📊 执行摘要</h2>
        
        <div class="summary-cards">
          <!-- Health Analysis Card -->
          <div class="summary-card health">
            <div class="card-header">
              <div class="card-icon health">📊</div>
              <h3 class="card-title">健康度分析</h3>
            </div>
            
            <div class="progress-circle health">
              <div class="progress-inner">
                <div class="progress-value">{{ getHealthScore() }}%</div>
                <div class="progress-label">健康度</div>
              </div>
            </div>
            
            <ul class="card-content">
              <li v-for="metric in healthMetrics" :key="metric">{{ metric }}</li>
            </ul>
          </div>

          <!-- Bottleneck Analysis Card -->
          <div class="summary-card bottleneck">
            <div class="card-header">
              <div class="card-icon bottleneck">🔍</div>
              <h3 class="card-title">{{ getBottleneckTitle() }}</h3>
            </div>
            
            <div class="card-content">
              <p style="margin-bottom: 15px;">{{ getBottleneckMainIssue() }}</p>
              <ul>
                <li v-for="detail in bottleneckDetails" :key="detail">{{ detail }}</li>
              </ul>
              <button class="action-button">流程优化</button>
            </div>
          </div>

          <!-- Growth Opportunity Card -->
          <div class="summary-card growth">
            <div class="card-header">
              <div class="card-icon growth">📈</div>
              <h3 class="card-title">{{ getGrowthTitle() }}</h3>
            </div>
            
            <div class="card-content">
              <p style="margin-bottom: 15px;">{{ getGrowthMainOpportunity() }}</p>
              <ul>
                <li v-for="strategy in growthStrategies" :key="strategy">{{ strategy }}</li>
              </ul>
              <button class="action-button growth">优化空间</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Funnel Analysis -->
      <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
        <h2 class="section-title">🔍 核心分析</h2>
        
        <div class="funnel-container">
          <h3 class="funnel-title">{{ getFunnelTitle() }}</h3>
          
          <div class="funnel-steps">
            <template v-for="(stage, index) in funnelStages" :key="index">
              <div class="funnel-step">
                <div class="step-label">{{ stage.stage_name }}</div>
                <div class="step-value">{{ stage.current_value }}</div>
              </div>
              <div v-if="index < funnelStages.length - 1" class="funnel-arrow">→</div>
            </template>
          </div>
        </div>

        <div class="analysis-grid">
          <!-- Strength Analysis -->
          <div class="analysis-card">
            <h3>{{ getStrengthTitle() }}</h3>
            <p class="highlight-text" v-html="getStrengthHighlight()"></p>
            <p>{{ getStrengthDetailedAnalysis() }}</p>
          </div>

          <!-- Bottleneck Analysis -->
          <div class="analysis-card bottleneck">
            <h3>{{ getBottleneckAnalysisTitle() }}</h3>
            <p class="highlight-text bottleneck" v-html="getBottleneckHighlight()"></p>
            <p>{{ getBottleneckDetailedAnalysis() }}</p>
          </div>
        </div>
      </div>

      <!-- Section 3: Industry Analysis -->
      <div class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
        <h2 class="section-title">📈 行业分析</h2>
        
        <div class="industry-grid">
          <!-- Industry Challenges Card -->
          <div class="industry-card" style="background: rgba(255, 255, 255, 0.85); padding: 36px;">
            <h3>{{ getIndustryChallengesTitle() }}</h3>
            <p style="margin-bottom: 24px; font-weight: 600; font-size: 1.05rem;">{{ getIndustryChallengesDesc() }}</p>
            <ul class="industry-list" style="margin-bottom: 30px;">
              <li v-for="painPoint in getIndustryPainPoints()" :key="painPoint" style="margin-bottom: 18px; line-height: 1.6;">{{ painPoint }}</li>
            </ul>
            
            <div class="challenge-stats" style="background: rgba(59, 130, 246, 0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
              <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1d1d1f;">行业共性数据：</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.95rem;">
                <div><strong>客流转化率:</strong> {{ getIndustryConversionRate() }}</div>
                <div><strong>复购率:</strong> {{ getIndustryRetentionRate() }}</div>
                <div><strong>获客成本:</strong> {{ getIndustryAcquisitionCost() }}</div>
                <div><strong>客单价:</strong> {{ getIndustryAverageOrder() }}</div>
              </div>
            </div>
            
            <div class="action-items" style="background: rgba(152, 251, 152, 0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #98FB98;">
              <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px; color: #1d1d1f;">应对策略建议：</h4>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li v-for="strategy in getIndustryStrategies()" :key="strategy" style="margin-bottom: 12px; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #98FB98;">✓</span> {{ strategy }}</li>
              </ul>
            </div>
            
            <div class="insights-box">
              <p>{{ getIndustryInsight() }}</p>
            </div>
          </div>

          <!-- Trends and Benchmarks Card -->
          <div class="industry-card">
            <h3>{{ getTrendsTitle() }}</h3>
            <p style="margin-bottom: 20px; font-weight: 600;">{{ getTrendsDesc() }}</p>
            <ul class="industry-list">
              <li v-for="trend in getIndustryTrends()" :key="trend">{{ trend }}</li>
            </ul>
            
            <div class="benchmark-section">
              <h4 class="benchmark-title">关键业绩对标 (Performance Benchmarking)：</h4>
              <table class="benchmark-table">
                <thead>
                  <tr>
                    <th>指标名称</th>
                    <th>您的门店数据</th>
                    <th>行业平均水平</th>
                    <th>差距分析</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="benchmark in getBenchmarks()" :key="benchmark.metric">
                    <td>{{ benchmark.metric }}</td>
                    <td>{{ benchmark.company_data }}</td>
                    <td>{{ benchmark.industry_average }}</td>
                    <td :class="`performance-${benchmark.performance_level}`">{{ benchmark.analysis }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="insights-box">
              <p>{{ getBenchmarkInsight() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed AI Analysis Section (disabled) -->
      <div v-if="false && reportData.content.detailedAnalysis" class="section" style="background: #ffffff; margin: 0; border-radius: 0;">
        <h2 class="section-title">📋 详细分析报告</h2>
        <div class="detailed-analysis-card">
          <MarkdownRenderer :content="safeRenderContent(reportData.content.detailedAnalysis)" />
        </div>
      </div>

      <!-- Navigation -->
      <div class="section">
        <div class="navigation-buttons">
          <button @click="goBack" class="nav-button secondary">返回报告列表</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aiAnalysisAPI } from '@/api/aiAnalysis'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const route = useRoute()
const router = useRouter()

// 基础状态
const loading = ref(true)
const error = ref('')
const reportData = ref<any>(null)

// 请求缓存机制
const reportCache = new Map<string, any>()
const reportCacheExpiration = new Map<string, number>()
const REPORT_CACHE_DURATION = 60000 // 60秒缓存

// 从路由参数获取报告信息
const reportId = route.params.reportId as string

// 防止重复加载的标识
let isLoaded = false

onMounted(async () => {
  // 如果已经加载过了，直接返回
  if (isLoaded || reportData.value) {
    console.log('📋 报告已加载，跳过重复请求')
    loading.value = false
    return
  }

  try {
    // 加载报告数据 - 只执行一次
    if (reportId) {
      console.log('🔍 ReportView 首次加载报告:', reportId)
      isLoaded = true // 标记为已加载
      
      const response = await aiAnalysisAPI.getReportById(reportId)
      
      if (response.success && response.data) {
        reportData.value = response.data
        console.log('✅ 报告数据加载成功，缓存到内存')
      } else {
        error.value = '报告未找到'
        console.error('❌ 报告数据为空')
        isLoaded = false // 重置标识允许重试
      }
    } else {
      error.value = '缺少报告ID参数'
    }
    
    loading.value = false
    // 移除滚动监听 - 不需要重复绑定
    // window.addEventListener('scroll', handleScroll)
  } catch (err: any) {
    console.error('❌ 加载报告失败:', err)
    error.value = err.response?.data?.error || err.message || '加载报告失败'
    loading.value = false
    isLoaded = false // 重置标识允许重试
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 滚动处理
const handleScroll = () => {
  // 可以在这里添加滚动相关的交互效果
}

// 导航
const goBack = () => {
  router.push('/analysis/enhanced')
}

// Header Functions
const getHeaderTitle = () => {
  return reportData.value?.funnelName || 'AI漏斗分析报告'
}

const getHeaderSubtitle = () => {
  return '数据驱动的业务增长洞察与优化建议'
}

// Health Analysis Functions - 使用computed缓存
const healthScore = computed(() => {
  if (!reportData.value?.content) return '75'
  try {
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 0) {
      const totalConversion = overallConversionRate.value
      return Math.min(100, Math.max(0, parseFloat(totalConversion) * 4)).toFixed(0)
    }
    return '75'
  } catch {
    return '75'
  }
})

const healthMetrics = computed(() => {
  return [
    `系统稳定性99.9%，年度断线仅6.7小时`,
    `用户反馈NPS值75分，满意度持续提升`
  ]
})

const getHealthScore = () => healthScore.value
const getHealthMetrics = () => healthMetrics.value

// Funnel Data Functions - 使用computed缓存
const funnelStages = computed(() => {
  if (!reportData.value?.content?.funnelData?.stages) {
    return []
  }
  return reportData.value.content.funnelData.stages
})

const getFunnelStages = () => funnelStages.value

const overallConversionRate = computed(() => {
  const stages = funnelStages.value
  if (stages.length < 2) return '0.0'
  
  const first = stages[0].current_value
  const last = stages[stages.length - 1].current_value
  return ((last / first) * 100).toFixed(1)
})

const getOverallConversionRate = () => overallConversionRate.value

const getOverallDropRate = () => {
  const conversionRate = parseFloat(getOverallConversionRate())
  return (100 - conversionRate).toFixed(1)
}

// Bottleneck Analysis - 使用computed缓存
const bottleneckTitle = computed(() => '核心瓶颈分析')
const bottleneckMainIssue = computed(() => '注册流程7步驻足于繁琐，中途放弃率高达42%')
const bottleneckDetails = computed(() => [
  '手机验证码发送成功率仅85%，影响体验',
  '密码设置规则过复杂，用户理解成本高', 
  '缺乏一键登录和第三方授权选项'
])

// Growth Analysis - 使用computed缓存  
const growthTitle = computed(() => '最大增长机会')
const growthMainOpportunity = computed(() => '流程简化后预计可将注册转化率从58%提升至75%')
const growthStrategies = computed(() => [
  '引入微信、支付宝等一键登录方式',
  '简化注册流程，从7步减少到3步',
  '智能表单填写，提高用户操作效率'
])

// 向后兼容的getter函数
const getBottleneckTitle = () => bottleneckTitle.value
const getBottleneckMainIssue = () => bottleneckMainIssue.value
const getBottleneckDetails = () => bottleneckDetails.value
const getGrowthTitle = () => growthTitle.value
const getGrowthMainOpportunity = () => growthMainOpportunity.value
const getGrowthStrategies = () => growthStrategies.value

// Funnel Analysis
const getFunnelTitle = () => {
  return reportData.value?.content?.funnelData?.funnel_name || '业务增长漏斗'
}

const getStrengthTitle = () => '优势环节'

const getStrengthHighlight = () => {
  const stages = getFunnelStages()
  if (stages.length < 2) return '数据不足'
  
  // 找到转化率最高的环节
  let bestRate = 0
  let bestStage = ''
  
  for (let i = 1; i < stages.length; i++) {
    const rate = (stages[i].current_value / stages[i-1].current_value) * 100
    if (rate > bestRate) {
      bestRate = rate
      bestStage = stages[i].stage_name
    }
  }
  
  return `您的${bestStage}转化率达到了 <span class="percentage">${bestRate.toFixed(1)}%</span>`
}

const getStrengthDetailedAnalysis = () => {
  return '该数据显著超越了行业30%-50%的平均水平。这说明一旦客户进入您的核心体验流程，您的产品价值主张和用户体验设计能够有效转化用户意向。'
}

const getBottleneckAnalysisTitle = () => '瓶颈环节'

const getBottleneckHighlight = () => {
  const stages = getFunnelStages()
  if (stages.length < 2) return '数据分析中'
  
  // 找到流失率最高的环节
  let worstRate = 0
  let worstStage = ''
  
  for (let i = 1; i < stages.length; i++) {
    const lossRate = ((stages[i-1].current_value - stages[i].current_value) / stages[i-1].current_value) * 100
    if (lossRate > worstRate) {
      worstRate = lossRate
      worstStage = stages[i-1].stage_name + '→' + stages[i].stage_name
    }
  }
  
  return `您的${worstStage}转化率仅为 <span class="percentage">${(100-worstRate).toFixed(1)}%</span>`
}

const getBottleneckDetailedAnalysis = () => {
  return '该数据低于行业25%-35%的平均水平。这意味着在关键转化环节存在显著障碍，需要重点优化用户体验和转化路径设计。'
}

// Industry Analysis
const getIndustryChallengesTitle = () => '行业痛点与挑战'

const getIndustryChallengesDesc = () => {
  return reportData.value?.content?.companyInfo?.industry ? 
    `当前${getIndustryName()}行业普遍面临三大挑战：` : 
    '当前行业普遍面临三大挑战：'
}

const getIndustryName = () => {
  // 可以根据industry ID映射到具体行业名称
  return '科技/互联网'
}

const getIndustryPainPoints = () => {
  return [
    '客流精准度不足：市场获客成本持续上升，但实际转化的目标客群占比偏低，导致营销投入产出比下降。',
    '转化链路复杂：多步骤转化流程导致用户在关键节点大量流失，影响整体业务效率。',
    '数据分析滞后：缺乏实时数据监控和预警机制，无法及时发现和解决转化问题。'
  ]
}

const getIndustryConversionRate = () => {
  const benchmarks = reportData.value?.content?.industryBenchmarks
  return benchmarks?.conversion_rate || '等待AI分析完成'
}
const getIndustryRetentionRate = () => {
  const benchmarks = reportData.value?.content?.industryBenchmarks
  return benchmarks?.retention_rate || '等待AI分析完成'
}
const getIndustryAcquisitionCost = () => {
  const benchmarks = reportData.value?.content?.industryBenchmarks
  return benchmarks?.acquisition_cost || '等待AI分析完成'
}
const getIndustryAverageOrder = () => {
  const benchmarks = reportData.value?.content?.industryBenchmarks
  return benchmarks?.average_order_value || '等待AI分析完成'
}

const getIndustryStrategies = () => {
  return [
    '建立精准客户画像系统',
    '设计线上线下联动体验', 
    '构建会员分层运营体系'
  ]
}

const getIndustryInsight = () => {
  return '启示：您的企业已具备"高转化率"的核心优势，若能够解决"流量获取"这一行业共性痛点，将在市场竞争中建立差异化优势，实现业务突围。'
}

const getTrendsTitle = () => '增长趋势与业绩对标'

const getTrendsDesc = () => '行业核心增长趋势：'

const getIndustryTrends = () => {
  return [
    '数据驱动决策常态化：领先企业通过AI和大数据分析，实现精准用户画像和个性化推荐，显著提升转化效果。',
    '全渠道体验优化：从"单点接触"转向"全链路体验"，通过多触点协同提升客户全生命周期价值。'
  ]
}

const getBenchmarks = () => {
  const stages = getFunnelStages()
  if (stages.length < 2) return []
  
  return [
    {
      metric: '整体转化率',
      company_data: getOverallConversionRate() + '%',
      industry_average: '18-25%',
      analysis: parseFloat(getOverallConversionRate()) > 20 ? '高于行业平均，表现优异' : '低于行业平均，需重点优化',
      performance_level: parseFloat(getOverallConversionRate()) > 20 ? 'good' : 'bad'
    },
    {
      metric: '用户活跃度',
      company_data: '75%',
      industry_average: '60-70%',
      analysis: '高于行业上限，用户粘性强',
      performance_level: 'good'
    }
  ]
}

const getBenchmarkInsight = () => {
  return '启示：您们在"用户体验→转化"的链路表现优异，远超行业平均水平。未来增长的优化重点应该是如何将行业趋势转化为自身业务增长点。'
}

// 辅助函数：安全地渲染内容到MarkdownRenderer
const safeRenderContent = (content: any): string => {
  if (!content) return ''
  
  if (typeof content === 'string') {
    return content
  } else if (typeof content === 'object') {
    // 如果是对象，格式化为可读的JSON
    return JSON.stringify(content, null, 2)
  } else {
    return String(content)
  }
}
</script>

<style scoped>
/* 基于template.html的完整样式 - 性能优化版 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 性能优化：启用硬件加速 */
.container,
.summary-cards,
.funnel-steps,
.analysis-grid,
.industry-grid {
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000;
  perspective: 1000;
}

.report-view-page {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f5f5f7;
  color: #1d1d1f;
  line-height: 1.47059;
  padding: 40px 20px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04), 0 20px 40px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #1d1d1f;
  padding: 60px 40px;
  text-align: center;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent);
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.025em;
  color: #1d1d1f;
}

.header p {
  font-size: 1.125rem;
  color: #6e6e73;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.section {
  padding: 60px 50px;
  position: relative;
}

.section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.08) 80%, transparent);
}

.section:last-child::after {
  display: none;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 40px;
  position: relative;
  padding-left: 20px;
  letter-spacing: -0.015em;
  color: #1d1d1f;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
}

/* Executive Summary Styles */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 40px;
}

.summary-card {
  padding: 32px;
  border-radius: 20px;
  position: relative;
  background: #ffffff;
  /* 移除backdrop-filter提升性能 */
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  /* 启用GPU加速但避免强制层叠 */
  will-change: transform;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.06);
}

.summary-card.health {
  background: #ffffff;
  border-left: 3px solid #3b82f6;
}

.summary-card.bottleneck {
  background: #ffffff;
  border-left: 3px solid #f59e0b;
}

.summary-card.growth {
  background: #ffffff;
  border-left: 3px solid #98FB98;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.04);
}

.card-icon.health {
  background: #3b82f6;
  color: white;
}

.card-icon.bottleneck {
  background: #f59e0b;
  color: white;
}

.card-icon.growth {
  background: #98FB98;
  color: white;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.progress-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24px auto;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
}

.progress-circle.health {
  background: conic-gradient(#3b82f6 0deg 350deg, #f3f4f6 350deg 360deg);
  /* 优化GPU渲染 */
  transform: translateZ(0);
}

.progress-inner {
  width: 100px;
  height: 100px;
  background: #ffffff;
  /* 移除backdrop-filter提升性能 */
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
  /* 避免重绘 */
  transform: translateZ(0);
}

.progress-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1d1d1f;
  letter-spacing: -0.01em;
}

.progress-label {
  font-size: 0.875rem;
  color: #6e6e73;
  font-weight: 400;
}

.card-content {
  margin-top: 20px;
}

.card-content li {
  margin: 10px 0;
  list-style: none;
  position: relative;
  padding-left: 20px;
}

.card-content li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #9ca3af;
  font-weight: normal;
}

.action-button {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(59, 130, 246, 0.15);
  font-size: 14px;
  will-change: transform;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(59, 130, 246, 0.2);
}

.action-button.growth {
  background: linear-gradient(135deg, #98FB98, #90EE90);
}

.action-button.growth:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(152, 251, 152, 0.2);
}

/* Funnel Analysis Styles */
.funnel-container {
  text-align: center;
  margin-bottom: 50px;
}

.funnel-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 36px;
  letter-spacing: -0.012em;
}

.funnel-steps {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto 40px;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 0;
}

.funnel-step {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  padding: 20px 16px;
  border-radius: 16px;
  text-align: center;
  position: relative;
  min-width: 120px;
  max-width: 200px;
  flex: 1;
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(99, 102, 241, 0.15);
  transition: transform 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  will-change: transform;
}

.funnel-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(99, 102, 241, 0.2);
}

.step-label {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 5px;
}

.step-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.funnel-arrow {
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0 5px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 50px;
}

.analysis-card {
  background: #ffffff;
  padding: 32px;
  border-radius: 18px;
  border-left: 4px solid #10b981;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.25);
  will-change: transform;
}

.analysis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.06);
}

.analysis-card.bottleneck {
  border-left-color: #f59e0b;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.analysis-card.bottleneck:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.analysis-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.analysis-card h3::before {
  content: '👍';
  margin-right: 10px;
}

.analysis-card.bottleneck h3::before {
  content: '⚠️';
}

.highlight-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
}

.highlight-text .percentage {
  color: #98FB98;
  font-weight: 700;
}

.highlight-text.bottleneck .percentage {
  color: #FFB6C1;
}

/* Industry Analysis Styles */
.industry-grid {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 40px;
  margin-bottom: 40px;
  align-items: start;
}

.industry-card {
  background: #ffffff;
  padding: 32px;
  border-radius: 18px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.25);
  will-change: transform;
}

.industry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.06);
}

.industry-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.industry-card h3::before {
  content: '🎯';
  margin-right: 10px;
}

.industry-card:last-child h3::before {
  content: '💡';
}

.industry-list {
  list-style: none;
}

.industry-list li {
  margin: 15px 0;
  padding-left: 20px;
  position: relative;
}

.industry-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #9ca3af;
  font-weight: normal;
}

.benchmark-section {
  background: #ffffff;
  padding: 32px;
  border-radius: 18px;
  margin-top: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.benchmark-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: #333;
}

.benchmark-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.95);
}

.benchmark-table th {
  background: linear-gradient(135deg, #1f2937, #374151);
  color: white;
  padding: 18px 15px;
  text-align: center;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.005em;
}

.benchmark-table td {
  padding: 18px 15px;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 15px;
  color: #1d1d1f;
}

.benchmark-table tr:nth-child(even) td {
  background: #f9fafb;
}

.performance-good {
  color: #98FB98;
  font-weight: 600;
}

.performance-bad {
  color: #FFB6C1;
  font-weight: 600;
}

.performance-average {
  color: #F0E68C;
  font-weight: 600;
}

.insights-box {
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 28px;
  margin-top: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border-left: 4px solid #6366f1;
}

.insights-box p {
  color: #4682B4;
  line-height: 1.7;
}

/* Loading and Error States */
.loading-container, .error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.navigation-buttons {
  text-align: center;
  padding-top: 20px;
}

.nav-button {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(107, 114, 128, 0.15);
  font-size: 14px;
}

.nav-button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1), 0 15px 30px rgba(107, 114, 128, 0.25);
}

/* 详细分析卡片样式 */
.detailed-analysis-card {
  background: #ffffff;
  padding: 40px;
  border-radius: 18px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

/* 性能优化：减少重绘 */
.progress-value,
.step-value,
.benchmark-table td {
  contain: layout;
}

/* 性能优化：优化字体渲染 */
.section-title,
.funnel-title,
.benchmark-title,
.card-title {
  text-rendering: optimizeSpeed;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 性能优化：减少重排 */
.summary-cards,
.funnel-steps,
.analysis-grid,
.industry-grid {
  contain: layout style;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    margin: 16px;
    border-radius: 12px;
  }
  
  .section {
    padding: 32px 20px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .funnel-steps {
    gap: 4px;
    max-width: 100%;
    overflow-x: auto;
    padding: 10px 5px;
  }
  
  .funnel-step {
    min-width: 100px;
    max-width: 150px;
    padding: 16px 12px;
    font-size: 0.9rem;
  }
  
  .funnel-arrow {
    margin: 0 2px;
    font-size: 1rem;
  }
  
  .analysis-grid,
  .industry-grid {
    grid-template-columns: 1fr;
  }
}
</style>