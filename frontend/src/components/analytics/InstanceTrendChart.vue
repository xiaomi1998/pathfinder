<template>
  <div class="instance-trend-chart">
    <!-- Header -->
    <div class="trend-header">
      <div class="header-info">
        <h3 class="trend-title">Performance Trends</h3>
        <p class="trend-subtitle">{{ instanceIds.length }} instance{{ instanceIds.length !== 1 ? 's' : '' }} selected</p>
      </div>
      
      <div class="header-controls">
        <div class="chart-type-selector">
          <button 
            v-for="type in chartTypes" 
            :key="type.key"
            @click="activeChartType = type.key"
            class="type-btn"
            :class="{ active: activeChartType === type.key }"
          >
            <i :class="type.icon"></i>
            {{ type.label }}
          </button>
        </div>
        
        <div class="time-range-selector">
          <select v-model="selectedTimeRange" @change="loadTrendData">
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="6months">Last 6 months</option>
            <option value="1year">Last year</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading trend data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-error"></i>
        <h4>Failed to Load Trends</h4>
        <p>{{ error }}</p>
        <button @click="loadTrendData" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Trend Analysis Content -->
    <div v-else-if="trendData.length > 0" class="trend-content">
      <!-- Trend Indicators -->
      <div class="trend-indicators">
        <div 
          v-for="trend in trendData" 
          :key="trend.instanceId" 
          class="trend-indicator"
        >
          <div class="indicator-header">
            <span class="instance-name">{{ getInstanceName(trend.instanceId) }}</span>
            <div class="trend-badges">
              <span 
                v-for="(trendInfo, metric) in trend.trends" 
                :key="metric"
                class="trend-badge"
                :class="getTrendBadgeClass(trendInfo)"
              >
                <i :class="getTrendIcon(trendInfo.direction)"></i>
                {{ metric }}
              </span>
            </div>
          </div>
          
          <div class="indicator-metrics">
            <div class="metric-item">
              <span class="metric-label">Conversion Rate</span>
              <div class="metric-trend" :class="getTrendClass(trend.trends.conversionRate)">
                <i :class="getTrendIcon(trend.trends.conversionRate.direction)"></i>
                <span class="trend-value">{{ formatTrendValue(trend.trends.conversionRate.changePercent) }}%</span>
                <span class="significance">{{ trend.trends.conversionRate.significance }}</span>
              </div>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">Volume</span>
              <div class="metric-trend" :class="getTrendClass(trend.trends.volume)">
                <i :class="getTrendIcon(trend.trends.volume.direction)"></i>
                <span class="trend-value">{{ formatTrendValue(trend.trends.volume.changePercent) }}%</span>
                <span class="significance">{{ trend.trends.volume.significance }}</span>
              </div>
            </div>
            
            <div class="metric-item">
              <span class="metric-label">Data Quality</span>
              <div class="metric-trend" :class="getTrendClass(trend.trends.quality)">
                <i :class="getTrendIcon(trend.trends.quality.direction)"></i>
                <span class="trend-value">{{ formatTrendValue(trend.trends.quality.changePercent) }}%</span>
                <span class="significance">{{ trend.trends.quality.significance }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chart -->
      <div class="chart-section">
        <div class="chart-header">
          <h4 class="chart-title">{{ getChartTitle() }}</h4>
          <div class="chart-legend">
            <div 
              v-for="(trend, index) in trendData" 
              :key="trend.instanceId"
              class="legend-item"
            >
              <div class="legend-color" :style="{ backgroundColor: getInstanceColor(index) }"></div>
              <span class="legend-label">{{ getInstanceName(trend.instanceId) }}</span>
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <canvas ref="trendChart" class="trend-chart"></canvas>
        </div>
      </div>

      <!-- Pattern Analysis -->
      <div class="pattern-analysis">
        <h4 class="section-title">Pattern Analysis</h4>
        <div class="patterns-grid">
          <div 
            v-for="trend in trendData" 
            :key="`pattern-${trend.instanceId}`"
            class="pattern-card"
          >
            <div class="pattern-header">
              <h5>{{ getInstanceName(trend.instanceId) }}</h5>
            </div>
            
            <div class="pattern-content">
              <div class="pattern-item">
                <span class="pattern-label">Seasonality:</span>
                <span class="pattern-value" :class="getSeasonalityClass(trend.patterns.seasonality)">
                  {{ formatSeasonality(trend.patterns.seasonality) }}
                </span>
              </div>
              
              <div class="pattern-item">
                <span class="pattern-label">Cyclical:</span>
                <span class="pattern-value" :class="{ 'cyclical-yes': trend.patterns.cyclical }">
                  {{ trend.patterns.cyclical ? 'Yes' : 'No' }}
                </span>
              </div>
              
              <div class="pattern-item">
                <span class="pattern-label">Outliers:</span>
                <span class="pattern-value">
                  {{ trend.patterns.outliers.length }} detected
                </span>
              </div>
              
              <div v-if="trend.patterns.outliers.length > 0" class="outliers-list">
                <div 
                  v-for="outlier in trend.patterns.outliers.slice(0, 3)" 
                  :key="outlier.date.toString()"
                  class="outlier-item"
                  :class="getOutlierClass(outlier)"
                >
                  <div class="outlier-date">{{ formatDate(outlier.date) }}</div>
                  <div class="outlier-info">
                    <span class="outlier-type">{{ outlier.type }}</span>
                    <span class="outlier-severity">{{ outlier.severity }}</span>
                  </div>
                  <div v-if="outlier.possibleCause" class="outlier-cause">
                    {{ outlier.possibleCause }}
                  </div>
                </div>
                <div v-if="trend.patterns.outliers.length > 3" class="more-outliers">
                  +{{ trend.patterns.outliers.length - 3 }} more outliers
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Insights and Recommendations -->
      <div class="insights-section">
        <h4 class="section-title">Insights & Recommendations</h4>
        <div class="insights-grid">
          <div class="insight-card trend-summary">
            <h5>Overall Trend Summary</h5>
            <p>{{ getTrendSummary() }}</p>
          </div>
          
          <div class="insight-card performance-insights">
            <h5>Performance Insights</h5>
            <ul class="insight-list">
              <li v-for="insight in getPerformanceInsights()" :key="insight">{{ insight }}</li>
            </ul>
          </div>
          
          <div class="insight-card recommendations">
            <h5>Action Recommendations</h5>
            <ul class="recommendation-list">
              <li v-for="recommendation in getRecommendations()" :key="recommendation">{{ recommendation }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else class="no-data-container">
      <div class="no-data-message">
        <i class="icon-bar-chart"></i>
        <h4>No Trend Data Available</h4>
        <p>No trend data found for the selected instances and time period.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { analyticsAPI, type InstanceTrendData } from '@/api/analytics'
import Chart from 'chart.js/auto'

interface Props {
  instanceIds: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 300000 // 5 minutes
})

const trendData = ref<InstanceTrendData[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const trendChart = ref<HTMLCanvasElement>()
const chartInstance = ref<Chart | null>(null)
const selectedTimeRange = ref('30days')
const activeChartType = ref('conversionRate')

const chartTypes = [
  { key: 'conversionRate', label: 'Conversion', icon: 'icon-trending-up' },
  { key: 'volume', label: 'Volume', icon: 'icon-bar-chart-2' },
  { key: 'revenue', label: 'Revenue', icon: 'icon-dollar-sign' },
  { key: 'dataQuality', label: 'Quality', icon: 'icon-shield' }
]

// Auto-refresh functionality
let refreshTimer: number | null = null

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      loadTrendData(false)
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const loadTrendData = async (showLoading = true) => {
  try {
    if (showLoading) {
      loading.value = true
    }
    error.value = null

    if (props.instanceIds.length === 0) {
      trendData.value = []
      return
    }

    const dateRange = getDateRangeFromSelection()
    const query = {
      dateRange,
      includePatternAnalysis: true,
      granularity: getGranularityFromTimeRange(),
      trendPeriod: getTrendPeriodFromTimeRange()
    }

    trendData.value = await analyticsAPI.getInstanceTrends(props.instanceIds, query)
    
    // Render chart after data loads
    await nextTick()
    renderTrendChart()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load trend data'
    console.error('Failed to load trend data:', err)
  } finally {
    loading.value = false
  }
}

const renderTrendChart = () => {
  if (!trendChart.value || trendData.value.length === 0) return
  
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = trendChart.value.getContext('2d')
  if (!ctx) return

  const datasets = trendData.value.map((trend, index) => {
    const color = getInstanceColor(index)
    
    let data: number[]
    let label: string
    
    switch (activeChartType.value) {
      case 'conversionRate':
        data = trend.timeSeriesData.map(d => d.conversionRate)
        label = `${getInstanceName(trend.instanceId)} - Conversion Rate (%)`
        break
      case 'volume':
        data = trend.timeSeriesData.map(d => d.entries)
        label = `${getInstanceName(trend.instanceId)} - Volume`
        break
      case 'revenue':
        data = trend.timeSeriesData.map(d => d.revenue || 0)
        label = `${getInstanceName(trend.instanceId)} - Revenue ($)`
        break
      case 'dataQuality':
        data = trend.timeSeriesData.map(d => d.dataQuality)
        label = `${getInstanceName(trend.instanceId)} - Data Quality (%)`
        break
      default:
        data = trend.timeSeriesData.map(d => d.conversionRate)
        label = `${getInstanceName(trend.instanceId)} - Conversion Rate (%)`
    }

    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color + '20',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2
    }
  })

  const labels = trendData.value[0]?.timeSeriesData.map(d => formatDate(d.date)) || []

  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: getYAxisLabel()
          }
        }
      },
      plugins: {
        legend: {
          display: false // We have our own legend
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              return `Date: ${context[0].label}`
            },
            label: (context) => {
              const suffix = getTooltipSuffix()
              return `${context.dataset.label}: ${context.parsed.y}${suffix}`
            }
          }
        }
      }
    }
  })
}

// Helper functions
const getDateRangeFromSelection = () => {
  const end = new Date()
  const start = new Date()
  
  switch (selectedTimeRange.value) {
    case '7days':
      start.setDate(end.getDate() - 7)
      break
    case '30days':
      start.setDate(end.getDate() - 30)
      break
    case '90days':
      start.setDate(end.getDate() - 90)
      break
    case '6months':
      start.setMonth(end.getMonth() - 6)
      break
    case '1year':
      start.setFullYear(end.getFullYear() - 1)
      break
    default:
      start.setDate(end.getDate() - 30)
  }
  
  return { start, end }
}

const getGranularityFromTimeRange = () => {
  switch (selectedTimeRange.value) {
    case '7days':
    case '30days':
      return 'daily'
    case '90days':
    case '6months':
      return 'weekly'
    case '1year':
      return 'monthly'
    default:
      return 'daily'
  }
}

const getTrendPeriodFromTimeRange = () => {
  switch (selectedTimeRange.value) {
    case '7days':
    case '30days':
      return 'week'
    case '90days':
    case '6months':
      return 'month'
    case '1year':
      return 'quarter'
    default:
      return 'month'
  }
}

const getInstanceName = (instanceId: string): string => {
  // In a real app, you'd have a way to resolve instance names
  return `Instance ${instanceId.substring(0, 8)}`
}

const getInstanceColor = (index: number): string => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ]
  return colors[index % colors.length]
}

const getChartTitle = (): string => {
  const type = chartTypes.find(t => t.key === activeChartType.value)
  return `${type?.label || 'Performance'} Trends Over Time`
}

const getYAxisLabel = (): string => {
  switch (activeChartType.value) {
    case 'conversionRate':
      return 'Conversion Rate (%)'
    case 'volume':
      return 'Volume (Count)'
    case 'revenue':
      return 'Revenue ($)'
    case 'dataQuality':
      return 'Data Quality (%)'
    default:
      return 'Value'
  }
}

const getTooltipSuffix = (): string => {
  switch (activeChartType.value) {
    case 'conversionRate':
    case 'dataQuality':
      return '%'
    case 'revenue':
      return '$'
    default:
      return ''
  }
}

const getTrendClass = (trendInfo: any): string => {
  return `trend-${trendInfo.direction}`
}

const getTrendIcon = (direction: string): string => {
  switch (direction) {
    case 'up':
      return 'icon-trending-up'
    case 'down':
      return 'icon-trending-down'
    default:
      return 'icon-minus'
  }
}

const getTrendBadgeClass = (trendInfo: any): string => {
  const baseClass = `badge-${trendInfo.direction}`
  const significanceClass = `badge-${trendInfo.significance}`
  return `${baseClass} ${significanceClass}`
}

const formatTrendValue = (value: number): string => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${Math.round(value * 100) / 100}`
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
}

const formatSeasonality = (seasonality: string): string => {
  return seasonality.charAt(0).toUpperCase() + seasonality.slice(1)
}

const getSeasonalityClass = (seasonality: string): string => {
  return seasonality !== 'none' ? 'has-seasonality' : 'no-seasonality'
}

const getOutlierClass = (outlier: any): string => {
  return `outlier-${outlier.type} outlier-${outlier.severity}`
}

const getTrendSummary = (): string => {
  const improvingCount = trendData.value.filter(t => 
    t.trends.conversionRate.direction === 'up'
  ).length
  
  const decliningCount = trendData.value.filter(t => 
    t.trends.conversionRate.direction === 'down'
  ).length
  
  const total = trendData.value.length
  
  if (improvingCount > decliningCount) {
    return `${improvingCount} of ${total} instances are showing positive conversion rate trends. Overall performance is improving.`
  } else if (decliningCount > improvingCount) {
    return `${decliningCount} of ${total} instances are showing declining conversion rates. Attention needed to reverse negative trends.`
  } else {
    return `Mixed performance across ${total} instances. Some are improving while others need attention.`
  }
}

const getPerformanceInsights = (): string[] => {
  const insights: string[] = []
  
  // High variance instances
  const highVarianceInstances = trendData.value.filter(t => 
    t.patterns.outliers.length > 2
  )
  
  if (highVarianceInstances.length > 0) {
    insights.push(`${highVarianceInstances.length} instance(s) show high variability with multiple outliers`)
  }
  
  // Seasonal patterns
  const seasonalInstances = trendData.value.filter(t => 
    t.patterns.seasonality !== 'none'
  )
  
  if (seasonalInstances.length > 0) {
    insights.push(`${seasonalInstances.length} instance(s) exhibit seasonal patterns`)
  }
  
  // Data quality trends
  const qualityIssues = trendData.value.filter(t => 
    t.trends.quality.direction === 'down'
  )
  
  if (qualityIssues.length > 0) {
    insights.push(`${qualityIssues.length} instance(s) have declining data quality`)
  }
  
  return insights.length > 0 ? insights : ['All instances are performing within normal parameters']
}

const getRecommendations = (): string[] => {
  const recommendations: string[] = []
  
  // Based on declining trends
  const decliningInstances = trendData.value.filter(t => 
    t.trends.conversionRate.direction === 'down' && 
    t.trends.conversionRate.significance !== 'low'
  )
  
  if (decliningInstances.length > 0) {
    recommendations.push('Focus on instances with declining conversion rates')
    recommendations.push('Review recent changes that might impact performance')
  }
  
  // Based on outliers
  const instancesWithOutliers = trendData.value.filter(t => 
    t.patterns.outliers.some(o => o.severity === 'high')
  )
  
  if (instancesWithOutliers.length > 0) {
    recommendations.push('Investigate high-severity outliers for root causes')
  }
  
  // Based on data quality
  const qualityIssues = trendData.value.filter(t => 
    t.trends.quality.direction === 'down'
  )
  
  if (qualityIssues.length > 0) {
    recommendations.push('Improve data collection processes for better quality')
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue monitoring current performance levels']
}

// Watch for changes
watch(() => props.instanceIds, () => {
  loadTrendData()
}, { deep: true })

watch(() => activeChartType.value, () => {
  renderTrendChart()
})

onMounted(() => {
  loadTrendData()
  startAutoRefresh()
})

// Cleanup on unmount
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  stopAutoRefresh()
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
.instance-trend-chart {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #f3f4f6;
  background-color: #f8fafc;
}

.header-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.trend-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.chart-type-selector {
  display: flex;
  gap: 4px;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 2px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.type-btn.active {
  background-color: #3b82f6;
  color: white;
}

.type-btn:hover:not(.active) {
  background-color: #f3f4f6;
}

.time-range-selector select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  background-color: white;
}

.loading-container,
.error-container,
.no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.trend-content {
  padding: 24px;
}

.trend-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.trend-indicator {
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.instance-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.trend-badges {
  display: flex;
  gap: 4px;
}

.trend-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-up {
  background-color: #dcfce7;
  color: #166534;
}

.badge-down {
  background-color: #fef2f2;
  color: #dc2626;
}

.badge-stable {
  background-color: #f3f4f6;
  color: #6b7280;
}

.indicator-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #059669;
}

.trend-down {
  color: #dc2626;
}

.trend-stable {
  color: #6b7280;
}

.trend-value {
  font-size: 12px;
  font-weight: 600;
}

.significance {
  font-size: 10px;
  opacity: 0.7;
  text-transform: capitalize;
}

.chart-section {
  margin-bottom: 32px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: 12px;
  color: #6b7280;
}

.chart-container {
  height: 300px;
  position: relative;
}

.trend-chart {
  width: 100%;
  height: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.pattern-card {
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.pattern-header h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.pattern-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pattern-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pattern-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.pattern-value {
  font-size: 12px;
  color: #111827;
  font-weight: 600;
}

.has-seasonality {
  color: #f59e0b !important;
}

.no-seasonality {
  color: #6b7280 !important;
}

.cyclical-yes {
  color: #3b82f6 !important;
}

.outliers-list {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.outlier-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  font-size: 11px;
}

.outlier-date {
  font-weight: 600;
  color: #111827;
}

.outlier-info {
  display: flex;
  gap: 8px;
}

.outlier-type {
  text-transform: capitalize;
  color: #6b7280;
}

.outlier-severity {
  font-weight: 500;
}

.outlier-spike.outlier-high .outlier-severity {
  color: #dc2626;
}

.outlier-drop.outlier-high .outlier-severity {
  color: #dc2626;
}

.outlier-cause {
  font-style: italic;
  color: #6b7280;
}

.more-outliers {
  font-size: 10px;
  color: #9ca3af;
  font-style: italic;
  margin-top: 4px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.insight-card {
  background-color: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.insight-card h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.insight-card p {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.insight-list,
.recommendation-list {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
  padding-left: 16px;
}

.insight-list li,
.recommendation-list li {
  margin-bottom: 4px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

@media (max-width: 768px) {
  .trend-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .chart-type-selector {
    justify-content: center;
  }
  
  .trend-indicators {
    grid-template-columns: 1fr;
  }
  
  .indicator-metrics {
    grid-template-columns: 1fr;
  }
  
  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .chart-legend {
    justify-content: center;
  }
  
  .patterns-grid,
  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>