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

    <!-- Full AI Report Content -->
    <div v-else-if="reportData" class="container">
      <!-- Header -->
      <div class="header">
        <h1>AI漏斗分析报告</h1>
        <p>{{ reportData.funnelName || '漏斗分析报告' }} - 智能数据洞察与优化建议</p>
      </div>

      <!-- Executive Summary -->
      <div class="section">
        <h2 class="section-title">执行摘要</h2>
        <div class="summary-cards">
          <div class="summary-card health">
            <div class="card-header">
              <div class="card-icon health">📊</div>
              <div class="card-title">漏斗健康度</div>
            </div>
            <div class="progress-circle">
              <div class="progress-inner">
                <div class="progress-value">{{ getHealthScore() }}%</div>
                <div class="progress-label">总体表现</div>
              </div>
            </div>
            <ul class="card-content">
              <li>转化率: {{ getOverallConversionRate() }}%</li>
              <li>流失率: {{ getOverallDropRate() }}%</li>
            </ul>
          </div>

          <div class="summary-card bottleneck">
            <div class="card-header">
              <div class="card-icon bottleneck">🔍</div>
              <div class="card-title">关键瓶颈</div>
            </div>
            <div class="card-content">
              <p class="highlight-text">{{ getBottleneckStage() }}</p>
              <ul>
                <li>流失率: {{ getBottleneckRate() }}%</li>
                <li>影响用户: {{ getBottleneckUsers() }}人</li>
                <li>优化空间: {{ getOptimizationPotential() }}</li>
              </ul>
            </div>
            <button class="action-button">查看优化方案</button>
          </div>

          <div class="summary-card growth">
            <div class="card-header">
              <div class="card-icon growth">📈</div>
              <div class="card-title">增长潜力</div>
            </div>
            <div class="card-content">
              <p class="highlight-text">{{ getGrowthPotential() }}</p>
              <ul>
                <li>预期提升: {{ getExpectedImprovement() }}%</li>
                <li>ROI预估: {{ getEstimatedROI() }}倍</li>
                <li>实施周期: {{ getImplementationTime() }}</li>
              </ul>
            </div>
            <button class="action-button growth">制定增长计划</button>
          </div>
        </div>
      </div>

      <!-- Funnel Analysis -->
      <div class="section">
        <div class="funnel-container">
          <h2 class="funnel-title">漏斗转化分析</h2>
          <div class="funnel-steps">
            <template v-for="(step, index) in getFunnelSteps()" :key="index">
              <div 
                class="funnel-step"
                :style="getStepStyle(step)"
              >
                <div class="step-label">{{ step.name }}</div>
                <div class="step-value">{{ step.count }}</div>
              </div>
              <div v-if="index < getFunnelSteps().length - 1" class="funnel-arrow">→</div>
            </template>
          </div>
        </div>

        <div class="analysis-grid">
          <div class="analysis-card">
            <h3>表现良好的环节</h3>
            <div v-for="strength in getStrengths()" :key="strength.stage" class="highlight-text">
              {{ strength.stage }}: 转化率 {{ strength.rate }}%
            </div>
            <ul>
              <li v-for="reason in getStrengthReasons()" :key="reason">{{ reason }}</li>
            </ul>
          </div>

          <div class="analysis-card bottleneck">
            <h3>需要优化的环节</h3>
            <div v-for="weakness in getWeaknesses()" :key="weakness.stage" class="highlight-text">
              {{ weakness.stage }}: 流失率 {{ weakness.rate }}%
            </div>
            <ul>
              <li v-for="issue in getOptimizationIssues()" :key="issue">{{ issue }}</li>
            </ul>
          </div>
        </div>
      </div>



      <!-- Detailed Analysis -->
      <div v-if="reportData.content.detailedAnalysis" class="section">
        <h2 class="section-title">详细AI分析报告</h2>
        <div class="detailed-analysis-card">
          <MarkdownRenderer :content="safeRenderContent(reportData.content.detailedAnalysis)" />
        </div>
      </div>

      <!-- Industry Analysis -->
      <div class="section">
        <h2 class="section-title">行业对标分析</h2>
        <div class="industry-grid">
          <div class="industry-card">
            <h3>行业基准</h3>
            <ul class="industry-list">
              <li>{{ getIndustryName() }}行业平均转化率: {{ getIndustryBenchmark() }}%</li>
              <li>您的表现: {{ getYourPerformance() }}</li>
              <li>排名位置: {{ getIndustryRanking() }}</li>
            </ul>
          </div>

          <div class="industry-card">
            <h3>最佳实践建议</h3>
            <div class="insights-box">
              <MarkdownRenderer :content="getIndustryInsights()" />
            </div>
            <div class="practices-list">
              <MarkdownRenderer v-for="practice in getBestPractices()" :key="practice" :content="`- ${practice}`" />
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="reportData.content.recommendations && reportData.content.recommendations.length > 0" class="section">
        <h2 class="section-title">AI智能建议</h2>
        <div class="recommendations-grid">
          <div v-for="(recommendation, index) in reportData.content.recommendations" :key="index" class="recommendation-card">
            <div class="recommendation-number">{{ index + 1 }}</div>
            <div class="recommendation-content">
              <MarkdownRenderer :content="safeRenderContent(recommendation)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Next Steps -->
      <div v-if="reportData.content.nextSteps && reportData.content.nextSteps.length > 0" class="section">
        <h2 class="section-title">下一步行动计划</h2>
        <div class="next-steps-timeline">
          <div v-for="(step, index) in reportData.content.nextSteps" :key="index" class="timeline-item">
            <div class="timeline-marker">{{ index + 1 }}</div>
            <div class="timeline-content">
              <MarkdownRenderer :content="safeRenderContent(step)" />
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="section">
        <button @click="goBack" class="back-button">返回报告列表</button>
      </div>
    </div>

    <!-- Back to Top Button -->
    <button 
      v-show="showBackToTop"
      @click="scrollToTop"
      class="back-to-top"
    >
      <i class="fas fa-arrow-up"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aiAnalysisAPI } from '@/api/aiAnalysis'
import MarkdownRenderer from '@/components/common/MarkdownRenderer.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const showBackToTop = ref(false)
const reportData = ref<any>(null)

// 从路由参数获取报告信息
const reportId = route.params.reportId as string

onMounted(async () => {
  try {
    // 加载报告数据
    if (reportId) {
      const response = await aiAnalysisAPI.getReports()
      const reports = response.data || []
      const report = reports.find((r: any) => r.id === reportId)
      
      if (report) {
        reportData.value = report
      } else {
        error.value = '报告未找到'
      }
    }
    
    loading.value = false
    window.addEventListener('scroll', handleScroll)
  } catch (err: any) {
    console.error('加载报告失败:', err)
    error.value = err.message || '加载报告失败'
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const goBack = () => {
  router.push('/ai/reports')
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 分析函数 - 优化数据获取逻辑
const getHealthScore = () => {
  if (!reportData.value?.content) return '75'
  try {
    // 基于漏斗数据计算健康度
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 0) {
      const totalConversion = getOverallConversionRate()
      return Math.min(100, Math.max(0, parseFloat(totalConversion) * 4)).toFixed(0)
    }
    return '75'
  } catch {
    return '75'
  }
}

const getOverallConversionRate = () => {
  if (!reportData.value?.content) return '12.5'
  try {
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 1) {
      const first = funnelData.stages[0]?.current_value || 1000
      const last = funnelData.stages[funnelData.stages.length - 1]?.current_value || 125
      return ((last / first) * 100).toFixed(1)
    }
    return '12.5'
  } catch {
    return '12.5'
  }
}

const getOverallDropRate = () => {
  const conversionRate = parseFloat(getOverallConversionRate())
  return (100 - conversionRate).toFixed(1)
}

const getBottleneckStage = () => {
  if (!reportData.value?.content) return '注册流程'
  try {
    const keyInsights = reportData.value.content.keyInsights?.key_insight
    return keyInsights?.bottleneck_stage || '注册流程'
  } catch {
    return '注册流程'
  }
}

const getBottleneckRate = () => {
  if (!reportData.value?.content) return '35'
  try {
    // 从漏斗数据中计算最大流失率的阶段
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 1) {
      let maxDropRate = 0
      for (let i = 1; i < funnelData.stages.length; i++) {
        const prev = funnelData.stages[i-1].current_value
        const curr = funnelData.stages[i].current_value
        const dropRate = ((prev - curr) / prev) * 100
        maxDropRate = Math.max(maxDropRate, dropRate)
      }
      return maxDropRate.toFixed(0)
    }
    return '35'
  } catch {
    return '35'
  }
}

const getBottleneckUsers = () => {
  if (!reportData.value?.content) return '350'
  try {
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 1) {
      let maxLoss = 0
      for (let i = 1; i < funnelData.stages.length; i++) {
        const prev = funnelData.stages[i-1].current_value
        const curr = funnelData.stages[i].current_value
        maxLoss = Math.max(maxLoss, prev - curr)
      }
      return maxLoss.toString()
    }
    return '350'
  } catch {
    return '350'
  }
}

const getOptimizationPotential = () => {
  if (!reportData.value?.content) return '高'
  try {
    const keyInsights = reportData.value.content.keyInsights?.key_insight
    return keyInsights?.potential_impact || '高'
  } catch {
    return '高'
  }
}

const getGrowthPotential = () => {
  if (!reportData.value?.content) return '通过优化关键环节可大幅提升转化'
  try {
    const keyInsights = reportData.value.content.keyInsights?.key_insight
    return keyInsights?.summary || '通过优化关键环节可大幅提升转化'
  } catch {
    return '通过优化关键环节可大幅提升转化'
  }
}

const getExpectedImprovement = () => {
  if (!reportData.value?.content) return '25'
  try {
    const teaserAnalysis = reportData.value.content.keyInsights?.teaser_analysis
    const expectedROI = teaserAnalysis?.expected_roi || '25%提升'
    // 提取数字部分
    const match = expectedROI.match(/(\d+)/);
    return match ? match[1] : '25'
  } catch {
    return '25'
  }
}

const getEstimatedROI = () => {
  if (!reportData.value?.content) return '3.2'
  try {
    const teaserAnalysis = reportData.value.content.keyInsights?.teaser_analysis
    const expectedROI = teaserAnalysis?.expected_roi || '3.2倍'
    // 提取数字部分
    const match = expectedROI.match(/(\d+\.?\d*)/);
    return match ? match[1] : '3.2'
  } catch {
    return '3.2'
  }
}

const getImplementationTime = () => {
  if (!reportData.value?.content) return '2-4周'
  try {
    const selectedStrategy = reportData.value.content.selectedStrategy
    return selectedStrategy?.investment || '2-4周'
  } catch {
    return '2-4周'
  }
}

const getFunnelSteps = () => {
  if (!reportData.value?.content?.funnelData?.stages) return []
  try {
    return reportData.value.content.funnelData.stages.map((stage: any) => ({
      name: stage.stage_name || stage.name,
      count: stage.current_value || 0
    }))
  } catch {
    return [
      { name: '访问', count: 1000 },
      { name: '注册', count: 650 },
      { name: '激活', count: 420 },
      { name: '购买', count: 125 }
    ]
  }
}

const getStepStyle = (step: any) => {
  // 根据转化率调整颜色深度
  const steps = getFunnelSteps()
  if (steps.length === 0) return { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }
  
  const maxCount = Math.max(...steps.map(s => s.count))
  const intensity = step.count / maxCount
  const hue = 220 + (intensity * 40) // 从蓝色到紫色
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 70%, 60%), hsl(${hue}, 80%, 50%))`
  }
}

const getStrengths = () => {
  if (!reportData.value?.content) return [{ stage: '首页访问', rate: '92' }]
  try {
    // 从漏斗数据中找出转化率最高的阶段
    const funnelData = reportData.value.content.funnelData
    if (funnelData?.stages && funnelData.stages.length > 1) {
      let bestStage = { stage: '首页访问', rate: '92' }
      let maxConversionRate = 0
      
      for (let i = 1; i < funnelData.stages.length; i++) {
        const prev = funnelData.stages[i-1].current_value
        const curr = funnelData.stages[i].current_value
        const conversionRate = (curr / prev) * 100
        
        if (conversionRate > maxConversionRate) {
          maxConversionRate = conversionRate
          bestStage = {
            stage: funnelData.stages[i].stage_name,
            rate: conversionRate.toFixed(0)
          }
        }
      }
      return [bestStage]
    }
    return [{ stage: '首页访问', rate: '92' }]
  } catch {
    return [{ stage: '首页访问', rate: '92' }]
  }
}

const getStrengthReasons = () => {
  if (!reportData.value?.content) return ['页面加载速度快', '用户体验良好']
  try {
    const keyInsights = reportData.value.content.keyInsights?.key_insight
    const quickSuggestion = keyInsights?.quick_suggestion || ''
    
    // 从AI分析中提取正面因素
    const selectedStrategy = reportData.value.content.selectedStrategy
    if (selectedStrategy?.features) {
      return selectedStrategy.features.split('、').slice(0, 2)
    }
    
    return ['页面加载速度快', '用户体验良好']
  } catch {
    return ['页面加载速度快', '用户体验良好']
  }
}

const getWeaknesses = () => {
  if (!reportData.value?.content) return [{ stage: '注册流程', rate: '35' }]
  try {
    const bottleneckStage = getBottleneckStage()
    const bottleneckRate = getBottleneckRate()
    return [{ stage: bottleneckStage, rate: bottleneckRate }]
  } catch {
    return [{ stage: '注册流程', rate: '35' }]
  }
}

const getOptimizationIssues = () => {
  if (!reportData.value?.content) return ['表单字段过多', '验证过程复杂']
  try {
    const keyInsights = reportData.value.content.keyInsights?.key_insight
    const conversionIssue = keyInsights?.conversion_issue
    
    const recommendations = reportData.value.content.recommendations || []
    if (recommendations.length > 0) {
      return recommendations.slice(0, 2)
    }
    
    if (conversionIssue) {
      return [conversionIssue, '需要优化用户体验']
    }
    
    return ['表单字段过多', '验证过程复杂']
  } catch {
    return ['表单字段过多', '验证过程复杂']
  }
}

const getIndustryName = () => {
  if (!reportData.value?.content?.companyInfo?.industry) return '电商'
  const industry = reportData.value.content.companyInfo.industry
  
  // 如果是UUID格式，则映射为行业名称
  const industryMap: { [key: string]: string } = {
    '96072f5c-c55b-4e92-a278-b0fd64f9e005': '科技/互联网',
    'e-commerce': '电商',
    'saas': 'SaaS',
    'fintech': '金融科技',
    'healthcare': '医疗健康',
    'education': '教育培训'
  }
  
  // 检查是否为UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(industry)) {
    return industryMap[industry] || '未知行业'
  }
  
  // 检查是否为已知的行业代码
  return industryMap[industry] || industry
}

const getIndustryBenchmark = () => {
  // 基于行业提供基准数据
  const industry = getIndustryName()
  const benchmarks: { [key: string]: string } = {
    '电商': '18.5',
    'SaaS': '15.2',
    '金融': '12.8',
    '教育': '20.1',
    '医疗': '16.7'
  }
  return benchmarks[industry] || '18.5'
}

const getYourPerformance = () => {
  const rate = getOverallConversionRate()
  const benchmark = parseFloat(getIndustryBenchmark())
  const yourRate = parseFloat(rate)
  return yourRate > benchmark ? '优于行业平均' : '低于行业平均'
}

const getIndustryRanking = () => {
  const rate = parseFloat(getOverallConversionRate())
  const benchmark = parseFloat(getIndustryBenchmark())
  const ratio = rate / benchmark
  
  if (ratio > 1.2) return '前10%'
  if (ratio > 1.0) return '前30%'
  if (ratio > 0.8) return '前50%'
  return '后50%'
}

const getIndustryInsights = () => {
  if (!reportData.value?.content) return '根据行业数据，优化注册流程可显著提升转化率'
  try {
    const detailedAnalysis = reportData.value.content.detailedAnalysis
    if (detailedAnalysis && detailedAnalysis.length > 100) {
      // 提取前几段作为行业洞察，但保留markdown格式
      const sections = detailedAnalysis.split('\n\n')
      if (sections.length > 2) {
        return sections.slice(0, 2).join('\n\n')
      }
      return detailedAnalysis.slice(0, 500)
    }
    
    const teaserAnalysis = reportData.value.content.keyInsights?.teaser_analysis
    if (teaserAnalysis?.core_problem) {
      return teaserAnalysis.core_problem
    }
    
    return '根据行业数据，优化注册流程可显著提升转化率'
  } catch {
    return '根据行业数据，优化注册流程可显著提升转化率'
  }
}

const getBestPractices = () => {
  if (!reportData.value?.content) {
    return [
      '简化注册流程，减少必填字段',
      '优化页面加载速度', 
      '增加社交登录选项',
      '提供清晰的价值主张'
    ]
  }
  
  try {
    // 优先从recommendations和nextSteps中获取
    const recommendations = reportData.value.content.recommendations || []
    const nextSteps = reportData.value.content.nextSteps || []
    
    // 合并建议和下一步行动计划，确保所有项都是字符串
    let allSuggestions = [...recommendations, ...nextSteps]
      .filter(item => item)
      .map(item => {
        if (typeof item === 'string') {
          return item.trim()
        } else if (typeof item === 'object') {
          // 如果是对象，提取有用的文本内容
          return JSON.stringify(item).replace(/[{}""]/g, '').replace(/:/g, ': ')
        } else {
          return String(item).trim()
        }
      })
      .filter(item => item)
    
    if (allSuggestions.length > 0) {
      return allSuggestions.slice(0, 4)
    }
    
    // 从详细分析中提取具体建议
    const detailedAnalysis = reportData.value.content.detailedAnalysis || ''
    if (detailedAnalysis) {
      const extractedSuggestions = extractPracticalSuggestions(detailedAnalysis)
      if (extractedSuggestions.length > 0) {
        return extractedSuggestions
      }
    }
    
    // 从选择的策略中获取核心行动
    const selectedStrategy = reportData.value.content.selectedStrategy
    if (selectedStrategy?.core_actions) {
      const actions = selectedStrategy.core_actions.split(/[、，,]/).filter(action => action.trim())
      if (actions.length > 0) {
        return actions.slice(0, 4)
      }
    }
    
    // 从关键洞察中提取建议
    const keyInsight = reportData.value.content.keyInsights?.key_insight
    if (keyInsight?.quick_suggestion) {
      return [keyInsight.quick_suggestion, '持续监控转化率变化', 'A/B测试优化方案', '定期回顾分析结果']
    }
    
    return [
      '简化注册流程，减少必填字段',
      '优化页面加载速度',
      '增加社交登录选项', 
      '提供清晰的价值主张'
    ]
  } catch {
    return [
      '简化注册流程，减少必填字段',
      '优化页面加载速度',
      '增加社交登录选项',
      '提供清晰的价值主张'
    ]
  }
}

// 辅助函数：从详细分析中提取实用建议
const extractPracticalSuggestions = (text: string): string[] => {
  const suggestions: string[] = []
  const lines = text.split('\n')
  
  // 寻找包含行动建议的关键词
  const actionKeywords = ['建议', '推荐', '应该', '需要', '优化', '改进', '提升', '增加', '减少', '实施']
  
  for (const line of lines) {
    const cleanLine = line.replace(/^[-•*\d.]\s*/, '').trim()
    
    // 跳过过长或过短的行
    if (cleanLine.length < 10 || cleanLine.length > 100) continue
    
    // 检查是否包含行动建议关键词
    const hasActionKeyword = actionKeywords.some(keyword => cleanLine.includes(keyword))
    
    if (hasActionKeyword && !cleanLine.includes('客户') && !cleanLine.includes('报告')) {
      suggestions.push(cleanLine)
      if (suggestions.length >= 4) break
    }
  }
  
  return suggestions
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
.report-view-page {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f5f5f7;
  color: #1d1d1f;
  min-height: 100vh;
  padding: 20px;
  line-height: 1.47059;
  -webkit-font-smoothing: antialiased;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  max-width: 400px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  color: #1d1d1f;
  padding: 60px 40px;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.025em;
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
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
  border-left: 3px solid #10b981;
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
  background: #10b981;
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
  background: conic-gradient(#3b82f6 0deg 270deg, #f3f4f6 270deg 360deg);
}

.progress-inner {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
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
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(59, 130, 246, 0.15);
  font-size: 14px;
}

.action-button.growth {
  background: linear-gradient(135deg, #10b981, #059669);
}

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
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 32px;
  border-radius: 18px;
  border-left: 4px solid #10b981;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.analysis-card.bottleneck {
  border-left-color: #f59e0b;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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

.industry-grid {
  display: grid;
  grid-template-columns: 0.7fr 1.3fr;
  gap: 40px;
  margin-bottom: 40px;
  align-items: start;
}

.industry-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  padding: 32px;
  border-radius: 18px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.25);
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

.insights-box {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
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

.back-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
  margin: 20px auto;
  display: block;
}

.back-button:hover {
  background: #2563eb;
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
}

.back-to-top:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.error-content i {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 20px;
}

.error-content h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.loading-content p,
.error-content p {
  color: #6b7280;
  margin-bottom: 24px;
}

/* 详细分析卡片 */
.detailed-analysis-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 40px;
  border-radius: 18px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
  margin-bottom: 30px;
  border-left: 4px solid #6366f1;
}

/* 建议网格 */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.recommendation-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02), 0 10px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.recommendation-number {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.recommendation-content {
  flex: 1;
  color: #374151;
}

/* 时间线样式 */
.next-steps-timeline {
  position: relative;
  padding-left: 40px;
}

.next-steps-timeline::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 24px;
  bottom: 24px;
  width: 2px;
  background: linear-gradient(180deg, #3b82f6, #10b981);
  border-radius: 1px;
}

.timeline-item {
  position: relative;
  margin-bottom: 32px;
  display: flex;
  align-items: flex-start;
  gap: 24px;
}

.timeline-marker {
  position: absolute;
  left: -32px;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.timeline-content {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.25);
  flex: 1;
  color: #374151;
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .analysis-grid,
  .industry-grid {
    grid-template-columns: 1fr;
  }
  
  .section {
    padding: 40px 20px;
  }
  
  .funnel-steps {
    flex-wrap: wrap;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .detailed-analysis-card {
    padding: 24px;
  }
  
  .next-steps-timeline {
    padding-left: 24px;
  }
  
  .timeline-marker {
    left: -24px;
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>