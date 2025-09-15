<template>
  <div class="template-overview">
    <!-- Header -->
    <div class="overview-header">
      <div class="header-info">
        <h2 class="overview-title">{{ templateData?.funnelName || 'Template Overview' }}</h2>
        <div class="template-meta">
          <span class="instance-count">{{ templateData?.usage.totalInstances || 0 }} instances</span>
          <span class="separator">•</span>
          <span class="active-count">{{ templateData?.usage.activeInstances || 0 }} active</span>
        </div>
      </div>
      
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          <i class="icon-refresh" :class="{ 'rotating': loading }"></i>
          Refresh
        </button>
        
        <button @click="exportData" class="btn btn-primary">
          <i class="icon-download"></i>
          Export Report
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading template analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-error"></i>
        <h3>Failed to Load Template Analytics</h3>
        <p>{{ error }}</p>
        <button @click="loadTemplateAnalytics" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Template Analytics Content -->
    <div v-else-if="templateData" class="template-content">
      <!-- Key Metrics Dashboard -->
      <div class="metrics-dashboard">
        <div class="dashboard-card usage-stats">
          <div class="card-header">
            <h3>Usage Statistics</h3>
            <i class="icon-users"></i>
          </div>
          <div class="card-content">
            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-value">{{ templateData.usage.totalInstances }}</div>
                <div class="stat-label">Total Instances</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ templateData.usage.activeInstances }}</div>
                <div class="stat-label">Active</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatPercentage(templateData.usage.usageGrowthRate) }}%</div>
                <div class="stat-label">Growth Rate</div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card performance-overview">
          <div class="card-header">
            <h3>Performance Overview</h3>
            <i class="icon-trending-up"></i>
          </div>
          <div class="card-content">
            <div class="performance-metrics">
              <div class="metric-row">
                <span class="metric-label">Average Completion Rate</span>
                <div class="metric-value-container">
                  <span class="metric-value">{{ formatPercentage(templateData.performance.avgCompletionRate) }}%</span>
                  <div class="metric-bar">
                    <div 
                      class="metric-fill completion" 
                      :style="{ width: `${Math.min(templateData.performance.avgCompletionRate, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="metric-row">
                <span class="metric-label">Average Conversion Rate</span>
                <div class="metric-value-container">
                  <span class="metric-value">{{ formatPercentage(templateData.performance.avgConversionRate) }}%</span>
                  <div class="metric-bar">
                    <div 
                      class="metric-fill conversion" 
                      :style="{ width: `${Math.min(templateData.performance.avgConversionRate, 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="metric-row">
                <span class="metric-label">Average Completion Time</span>
                <div class="metric-value-container">
                  <span class="metric-value">{{ formatTimeInMinutes(templateData.performance.avgTimeToComplete) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dashboard-card success-metrics">
          <div class="card-header">
            <h3>Success Metrics</h3>
            <i class="icon-target"></i>
          </div>
          <div class="card-content">
            <div class="success-grid">
              <div class="success-item">
                <div class="success-value">{{ formatPercentage(templateData.success.successRate) }}%</div>
                <div class="success-label">Success Rate</div>
                <div class="success-sublabel">Above benchmark</div>
              </div>
              <div class="success-item">
                <div class="success-value">{{ templateData.success.highPerformers }}</div>
                <div class="success-label">High Performers</div>
                <div class="success-sublabel">Top tier instances</div>
              </div>
              <div class="success-item">
                <div class="success-value">{{ templateData.success.underPerformers }}</div>
                <div class="success-label">Need Attention</div>
                <div class="success-sublabel">Below benchmark</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Best vs Worst Performers -->
      <div class="performance-comparison">
        <h3 class="section-title">Performance Extremes</h3>
        <div class="comparison-cards">
          <div class="performer-card best-performer">
            <div class="performer-header">
              <h4>Best Performer</h4>
              <i class="icon-trophy"></i>
            </div>
            <div class="performer-content">
              <div class="performer-name">{{ templateData.performance.bestPerformingInstance.name }}</div>
              <div class="performer-metric">
                Conversion Rate: {{ formatPercentage(templateData.performance.bestPerformingInstance.conversionRate) }}%
              </div>
              <button @click="viewInstance(templateData.performance.bestPerformingInstance.id)" class="btn btn-sm btn-outline">
                View Details
              </button>
            </div>
          </div>

          <div class="performer-card worst-performer">
            <div class="performer-header">
              <h4>Needs Improvement</h4>
              <i class="icon-alert-triangle"></i>
            </div>
            <div class="performer-content">
              <div class="performer-name">{{ templateData.performance.worstPerformingInstance.name }}</div>
              <div class="performer-metric">
                Conversion Rate: {{ formatPercentage(templateData.performance.worstPerformingInstance.conversionRate) }}%
              </div>
              <button @click="viewInstance(templateData.performance.worstPerformingInstance.id)" class="btn btn-sm btn-outline">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stage Effectiveness Analysis -->
      <div class="stage-effectiveness">
        <h3 class="section-title">Stage Effectiveness Analysis</h3>
        <div class="effectiveness-table-container">
          <table class="effectiveness-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Average Conversion Rate</th>
                <th>Consistency</th>
                <th>Performance Grade</th>
                <th>Recommendations</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stage in templateData.stageEffectiveness" :key="stage.nodeId" class="stage-row">
                <td class="stage-info">
                  <div class="stage-name">{{ stage.nodeName }}</div>
                  <div class="stage-type">{{ formatNodeType(stage.nodeType) }}</div>
                </td>
                
                <td class="conversion-rate">
                  <div class="rate-display">
                    <span class="rate-value">{{ formatPercentage(stage.avgConversionRate) }}%</span>
                    <div class="rate-bar">
                      <div 
                        class="rate-fill" 
                        :style="{ width: `${Math.min(stage.avgConversionRate, 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                
                <td class="consistency">
                  <div class="consistency-indicator" :class="getConsistencyClass(stage.varianceAcrossInstances)">
                    <span class="consistency-text">{{ getConsistencyLabel(stage.varianceAcrossInstances) }}</span>
                    <span class="variance-value">σ: {{ formatPercentage(stage.varianceAcrossInstances) }}%</span>
                  </div>
                </td>
                
                <td class="performance-grade">
                  <div class="grade-badge" :class="getGradeClass(stage.avgConversionRate)">
                    {{ getPerformanceGrade(stage.avgConversionRate) }}
                  </div>
                </td>
                
                <td class="recommendations">
                  <div class="recommendation-list">
                    <div v-if="stage.bestPractices.length === 0" class="no-recommendations">
                      No specific recommendations
                    </div>
                    <div v-else>
                      <div v-for="(practice, index) in stage.bestPractices.slice(0, 2)" :key="index" class="practice-item">
                        {{ practice }}
                      </div>
                      <div v-if="stage.bestPractices.length > 2" class="more-practices">
                        +{{ stage.bestPractices.length - 2 }} more
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Timeline Analysis -->
      <div class="timeline-analysis">
        <h3 class="section-title">Usage Timeline</h3>
        <div class="timeline-chart-container">
          <div class="chart-controls">
            <div class="time-period-selector">
              <button 
                v-for="period in timePeriods" 
                :key="period.key"
                @click="selectedPeriod = period.key"
                class="period-btn"
                :class="{ active: selectedPeriod === period.key }"
              >
                {{ period.label }}
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <canvas ref="timelineChart" class="timeline-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Insights and Recommendations -->
      <div class="insights-section">
        <h3 class="section-title">Key Insights & Recommendations</h3>
        <div class="insights-grid">
          <div class="insight-card adoption-insight">
            <div class="insight-header">
              <h4>Template Adoption</h4>
              <i class="icon-users"></i>
            </div>
            <div class="insight-content">
              <p>{{ getAdoptionInsight() }}</p>
              <div class="insight-action">
                <button class="btn btn-sm btn-primary">Boost Adoption</button>
              </div>
            </div>
          </div>

          <div class="insight-card performance-insight">
            <div class="insight-header">
              <h4>Performance Optimization</h4>
              <i class="icon-zap"></i>
            </div>
            <div class="insight-content">
              <p>{{ getPerformanceInsight() }}</p>
              <div class="insight-action">
                <button class="btn btn-sm btn-primary">View Details</button>
              </div>
            </div>
          </div>

          <div class="insight-card consistency-insight">
            <div class="insight-header">
              <h4>Consistency Analysis</h4>
              <i class="icon-activity"></i>
            </div>
            <div class="insight-content">
              <p>{{ getConsistencyInsight() }}</p>
              <div class="insight-action">
                <button class="btn btn-sm btn-primary">Standardize</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { analyticsAPI, type TemplateAnalytics } from '@/api/analytics'
import Chart from 'chart.js/auto'

interface Props {
  funnelId: string
  dateRange?: {
    start: Date
    end: Date
  }
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false
})

const templateData = ref<TemplateAnalytics | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const timelineChart = ref<HTMLCanvasElement>()
const chartInstance = ref<Chart | null>(null)
const selectedPeriod = ref('6months')

const timePeriods = [
  { key: '3months', label: '3M' },
  { key: '6months', label: '6M' },
  { key: '1year', label: '1Y' },
  { key: 'all', label: 'All' }
]

const loadTemplateAnalytics = async (showLoading = true) => {
  try {
    if (showLoading) {
      loading.value = true
    }
    error.value = null

    const query = {
      includeStageBreakdown: true,
      includeTrendAnalysis: true,
      ...(props.dateRange && { dateRange: props.dateRange })
    }

    templateData.value = await analyticsAPI.getTemplateAnalytics(props.funnelId, query)
    
    // Render timeline chart after data loads
    await nextTick()
    renderTimelineChart()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load template analytics'
    console.error('Failed to load template analytics:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadTemplateAnalytics(true)
}

const exportData = async () => {
  try {
    if (!templateData.value) return
    
    const exportData = await analyticsAPI.exportData('template', templateData.value, 'xlsx')
    
    const link = document.createElement('a')
    link.href = exportData.downloadUrl
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err: any) {
    console.error('Failed to export data:', err)
  }
}

const viewInstance = (instanceId: string) => {
  // Navigate to instance details
  // In a real app, you'd use router.push
  console.log('Navigate to instance:', instanceId)
}

const renderTimelineChart = () => {
  if (!timelineChart.value || !templateData.value?.timeline.length) return
  
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = timelineChart.value.getContext('2d')
  if (!ctx) return

  const data = templateData.value.timeline
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => formatDate(d.period)),
      datasets: [
        {
          label: 'New Instances',
          data: data.map(d => d.newInstances),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Completed Instances',
          data: data.map(d => d.completedInstances),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Average Performance (%)',
          data: data.map(d => d.avgPerformance),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Time Period'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Instance Count'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Performance (%)'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  })
}

// Helper functions
const formatPercentage = (value: number): string => {
  return Math.round(value * 100) / 100 + ''
}

const formatTimeInMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  return `${hours}h ${remainingMinutes}m`
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric'
  })
}

const formatNodeType = (nodeType: string): string => {
  return nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace('_', ' ')
}

const getConsistencyClass = (variance: number): string => {
  if (variance <= 5) return 'consistency-high'
  if (variance <= 15) return 'consistency-medium'
  return 'consistency-low'
}

const getConsistencyLabel = (variance: number): string => {
  if (variance <= 5) return 'High'
  if (variance <= 15) return 'Medium'
  return 'Low'
}

const getGradeClass = (conversionRate: number): string => {
  if (conversionRate >= 20) return 'grade-a'
  if (conversionRate >= 15) return 'grade-b'
  if (conversionRate >= 10) return 'grade-c'
  if (conversionRate >= 5) return 'grade-d'
  return 'grade-f'
}

const getPerformanceGrade = (conversionRate: number): string => {
  if (conversionRate >= 20) return 'A'
  if (conversionRate >= 15) return 'B'
  if (conversionRate >= 10) return 'C'
  if (conversionRate >= 5) return 'D'
  return 'F'
}

const getAdoptionInsight = (): string => {
  if (!templateData.value) return ''
  
  const growth = templateData.value.usage.usageGrowthRate
  if (growth > 10) {
    return `Excellent adoption rate with ${formatPercentage(growth)}% monthly growth. This template is gaining traction among users.`
  } else if (growth > 0) {
    return `Steady adoption with ${formatPercentage(growth)}% monthly growth. Consider promoting this template more actively.`
  } else {
    return `Adoption has stagnated. Consider updating the template or improving documentation to boost usage.`
  }
}

const getPerformanceInsight = (): string => {
  if (!templateData.value) return ''
  
  const avgConversion = templateData.value.performance.avgConversionRate
  const benchmark = templateData.value.success.benchmarkConversionRate
  
  if (avgConversion > benchmark) {
    return `Template performs ${formatPercentage(avgConversion - benchmark)}% above industry benchmark. Great work!`
  } else {
    return `Template underperforms by ${formatPercentage(benchmark - avgConversion)}%. Focus on optimizing lower-performing stages.`
  }
}

const getConsistencyInsight = (): string => {
  if (!templateData.value) return ''
  
  const highVarianceStages = templateData.value.stageEffectiveness.filter(stage => stage.varianceAcrossInstances > 15)
  
  if (highVarianceStages.length === 0) {
    return 'Excellent consistency across all instances. Users are implementing the template effectively.'
  } else {
    return `${highVarianceStages.length} stage(s) show high variance. Consider providing clearer guidelines or best practices.`
  }
}

onMounted(() => {
  loadTemplateAnalytics()
})

// Watch for prop changes
import { watch } from 'vue'
watch(() => props.funnelId, () => {
  loadTemplateAnalytics()
})

watch(() => props.dateRange, () => {
  loadTemplateAnalytics()
}, { deep: true })

// Cleanup on unmount
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
.template-overview {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.header-info {
  flex: 1;
}

.overview-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.separator {
  color: #d1d5db;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-secondary {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-outline {
  background-color: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.dashboard-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.card-header i {
  font-size: 24px;
  opacity: 0.6;
}

.usage-stats {
  border-left: 4px solid #3b82f6;
}

.performance-overview {
  border-left: 4px solid #10b981;
}

.success-metrics {
  border-left: 4px solid #f59e0b;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.metric-value-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  min-width: 50px;
  text-align: right;
}

.metric-bar {
  width: 80px;
  height: 6px;
  background-color: #f3f4f6;
  border-radius: 3px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.metric-fill.completion {
  background-color: #10b981;
}

.metric-fill.conversion {
  background-color: #3b82f6;
}

.success-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.success-item {
  text-align: center;
}

.success-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.success-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 2px;
}

.success-sublabel {
  font-size: 11px;
  color: #9ca3af;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.comparison-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.performer-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.best-performer {
  border-left: 4px solid #10b981;
}

.worst-performer {
  border-left: 4px solid #f59e0b;
}

.performer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.performer-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.performer-header i {
  font-size: 20px;
  opacity: 0.6;
}

.performer-name {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.performer-metric {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.effectiveness-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
  margin-bottom: 40px;
}

.effectiveness-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.effectiveness-table th {
  background-color: #f8fafc;
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.effectiveness-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
}

.stage-row:last-child td {
  border-bottom: none;
}

.stage-row:hover {
  background-color: #f8fafc;
}

.stage-info {
  min-width: 120px;
}

.stage-name {
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.stage-type {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rate-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-value {
  font-weight: 500;
  color: #111827;
  min-width: 50px;
}

.rate-bar {
  width: 60px;
  height: 4px;
  background-color: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.consistency-indicator {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.consistency-text {
  font-weight: 500;
  font-size: 12px;
}

.variance-value {
  font-size: 11px;
  opacity: 0.7;
}

.consistency-high .consistency-text {
  color: #059669;
}

.consistency-medium .consistency-text {
  color: #d97706;
}

.consistency-low .consistency-text {
  color: #dc2626;
}

.grade-badge {
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: white;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grade-a {
  background-color: #059669;
}

.grade-b {
  background-color: #10b981;
}

.grade-c {
  background-color: #f59e0b;
}

.grade-d {
  background-color: #f97316;
}

.grade-f {
  background-color: #dc2626;
}

.recommendation-list {
  font-size: 12px;
  line-height: 1.4;
}

.practice-item {
  color: #374151;
  margin-bottom: 4px;
}

.more-practices {
  color: #6b7280;
  font-style: italic;
}

.no-recommendations {
  color: #9ca3af;
  font-style: italic;
}

.timeline-chart-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 40px;
}

.chart-controls {
  margin-bottom: 20px;
}

.time-period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 6px 12px;
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.chart-container {
  height: 300px;
}

.timeline-chart {
  max-height: 300px;
}

.insights-section {
  margin-bottom: 40px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.insight-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.insight-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.insight-header i {
  font-size: 18px;
  opacity: 0.6;
}

.insight-content p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.insight-action {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .template-overview {
    padding: 16px;
  }
  
  .overview-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .metrics-dashboard {
    grid-template-columns: 1fr;
  }
  
  .stat-grid,
  .success-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .comparison-cards {
    grid-template-columns: 1fr;
  }
  
  .effectiveness-table-container {
    overflow-x: scroll;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .metric-value-container {
    justify-content: space-between;
  }
}
</style>