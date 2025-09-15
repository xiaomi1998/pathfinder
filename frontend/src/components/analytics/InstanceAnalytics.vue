<template>
  <div class="instance-analytics">
    <!-- Header Section -->
    <div class="analytics-header">
      <div class="header-info">
        <h2 class="analytics-title">{{ analytics?.funnelName || 'Instance Analytics' }}</h2>
        <div class="instance-status">
          <span :class="['status-badge', statusClass]">
            {{ analytics?.status.toUpperCase() }}
          </span>
        </div>
      </div>
      
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-secondary" :disabled="loading">
          <i class="icon-refresh" :class="{ 'rotating': loading }"></i>
          Refresh
        </button>
        
        <button @click="exportData" class="btn btn-primary">
          <i class="icon-download"></i>
          Export
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-error"></i>
        <h3>Failed to Load Analytics</h3>
        <p>{{ error }}</p>
        <button @click="loadAnalytics" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Main Analytics Content -->
    <div v-else-if="analytics" class="analytics-content">
      <!-- Performance Overview -->
      <div class="metrics-grid">
        <div class="metric-card completion-rate">
          <div class="metric-header">
            <h3>Completion Rate</h3>
            <i class="icon-check-circle"></i>
          </div>
          <div class="metric-value">
            {{ formatPercentage(analytics.performance.completionRate) }}%
          </div>
          <div class="metric-subtitle">
            Data completeness across stages
          </div>
        </div>

        <div class="metric-card conversion-rate">
          <div class="metric-header">
            <h3>Conversion Rate</h3>
            <i class="icon-trending-up"></i>
          </div>
          <div class="metric-value">
            {{ formatPercentage(analytics.performance.overallConversionRate) }}%
          </div>
          <div class="metric-subtitle">
            {{ formatNumber(analytics.performance.totalConversions) }} of {{ formatNumber(analytics.performance.totalEntries) }} converted
          </div>
        </div>

        <div class="metric-card time-to-complete">
          <div class="metric-header">
            <h3>Avg. Time to Complete</h3>
            <i class="icon-clock"></i>
          </div>
          <div class="metric-value">
            {{ formatTimeInMinutes(analytics.performance.avgTimeToComplete) }}
          </div>
          <div class="metric-subtitle">
            Time from start to finish
          </div>
        </div>

        <div class="metric-card data-quality">
          <div class="metric-header">
            <h3>Data Quality</h3>
            <i class="icon-shield"></i>
          </div>
          <div class="metric-value">
            {{ formatPercentage(analytics.quality.dataCompleteness) }}%
          </div>
          <div class="metric-subtitle">
            Last updated {{ formatDate(analytics.quality.lastUpdated) }}
          </div>
        </div>
      </div>

      <!-- Stage Analytics -->
      <div class="stage-analytics">
        <h3 class="section-title">Stage Performance</h3>
        <div class="stage-table-container">
          <table class="stage-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Entries</th>
                <th>Conversions</th>
                <th>Conversion Rate</th>
                <th>Avg. Time</th>
                <th>Bounce Count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stage in analytics.stageAnalytics" :key="stage.nodeId" class="stage-row">
                <td class="stage-name">
                  <div class="stage-info">
                    <span class="stage-label">{{ stage.nodeName }}</span>
                    <span class="stage-type">{{ formatNodeType(stage.nodeType) }}</span>
                  </div>
                </td>
                <td class="entries">{{ formatNumber(stage.entryCount) }}</td>
                <td class="conversions">{{ formatNumber(stage.convertedCount) }}</td>
                <td class="conversion-rate">
                  <div class="rate-container">
                    <span class="rate-value">{{ formatPercentage(stage.conversionRate) }}%</span>
                    <div class="rate-bar">
                      <div class="rate-fill" :style="{ width: `${Math.min(stage.conversionRate, 100)}%` }"></div>
                    </div>
                  </div>
                </td>
                <td class="avg-time">{{ formatTimeInMinutes(stage.avgTimeSpent) }}</td>
                <td class="bounce-count">{{ formatNumber(stage.bounceCount) }}</td>
                <td class="revenue">
                  <span v-if="stage.revenue !== undefined">${{ formatNumber(stage.revenue) }}</span>
                  <span v-else class="no-data">--</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Historical Trends -->
      <div v-if="analytics.historical.length > 0" class="historical-trends">
        <h3 class="section-title">Historical Performance</h3>
        <div class="chart-container">
          <canvas ref="trendsChart" class="trends-chart"></canvas>
        </div>
      </div>

      <!-- Data Quality Details -->
      <div class="quality-section">
        <h3 class="section-title">Data Quality</h3>
        <div class="quality-metrics">
          <div class="quality-item">
            <div class="quality-label">Data Completeness</div>
            <div class="quality-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill completeness" 
                  :style="{ width: `${analytics.quality.dataCompleteness}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ formatPercentage(analytics.quality.dataCompleteness) }}%</span>
            </div>
          </div>
          
          <div class="quality-item">
            <div class="quality-label">Data Accuracy</div>
            <div class="quality-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill accuracy" 
                  :style="{ width: `${analytics.quality.dataAccuracy}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ formatPercentage(analytics.quality.dataAccuracy) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { analyticsAPI, type InstanceAnalytics } from '@/api/analytics'
import Chart from 'chart.js/auto'

interface Props {
  instanceId: string
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

const analytics = ref<InstanceAnalytics | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const trendsChart = ref<HTMLCanvasElement>()
const chartInstance = ref<Chart | null>(null)

const statusClass = computed(() => {
  if (!analytics.value) return ''
  
  switch (analytics.value.status) {
    case 'active': return 'status-active'
    case 'archived': return 'status-archived'
    case 'template': return 'status-template'
    default: return ''
  }
})

// Auto-refresh functionality
let refreshTimer: number | null = null

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      loadAnalytics(false)
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const loadAnalytics = async (showLoading = true) => {
  try {
    if (showLoading) {
      loading.value = true
    }
    error.value = null

    const query = {
      includeHistorical: true,
      granularity: 'daily' as const,
      ...(props.dateRange && { dateRange: props.dateRange })
    }

    analytics.value = await analyticsAPI.getInstanceAnalytics(props.instanceId, query)
    
    // Render trends chart after data loads
    await nextTick()
    renderTrendsChart()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to load analytics'
    console.error('Failed to load instance analytics:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadAnalytics(true)
}

const exportData = async () => {
  try {
    if (!analytics.value) return
    
    const exportData = await analyticsAPI.exportData('instance', analytics.value, 'xlsx')
    
    // Create download link
    const link = document.createElement('a')
    link.href = exportData.downloadUrl
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err: any) {
    console.error('Failed to export data:', err)
    // Could show a toast notification here
  }
}

const renderTrendsChart = () => {
  if (!trendsChart.value || !analytics.value?.historical.length) return
  
  // Destroy existing chart
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = trendsChart.value.getContext('2d')
  if (!ctx) return

  const data = analytics.value.historical
  
  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => formatDate(d.date)),
      datasets: [
        {
          label: 'Conversion Rate (%)',
          data: data.map(d => d.conversionRate),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Entries',
          data: data.map(d => d.entries),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
            text: 'Date'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Conversion Rate (%)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Entries'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      }
    }
  })
}

// Utility functions
const formatPercentage = (value: number): string => {
  return Math.round(value * 100) / 100 + ''
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat().format(value)
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
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

const formatNodeType = (nodeType: string): string => {
  return nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace('_', ' ')
}

onMounted(() => {
  loadAnalytics()
  startAutoRefresh()
})

// Cleanup on unmount
const cleanup = () => {
  stopAutoRefresh()
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
}

// Watch for prop changes
import { watch } from 'vue'
watch(() => props.instanceId, () => {
  loadAnalytics()
})

watch(() => props.dateRange, () => {
  loadAnalytics()
}, { deep: true })

// Cleanup on component unmount
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(cleanup)
</script>

<style scoped>
.instance-analytics {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.analytics-header {
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

.analytics-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.instance-status {
  margin-top: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-archived {
  background-color: #f3f4f6;
  color: #6b7280;
}

.status-template {
  background-color: #dbeafe;
  color: #1e40af;
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

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background-color: #f1f5f9;
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

.error-message {
  max-width: 400px;
}

.error-message h3 {
  color: #dc2626;
  margin: 12px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-header i {
  font-size: 20px;
  opacity: 0.6;
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 14px;
  color: #6b7280;
}

.completion-rate {
  border-left: 4px solid #10b981;
}

.conversion-rate {
  border-left: 4px solid #3b82f6;
}

.time-to-complete {
  border-left: 4px solid #f59e0b;
}

.data-quality {
  border-left: 4px solid #8b5cf6;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.stage-table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 40px;
}

.stage-table {
  width: 100%;
  border-collapse: collapse;
}

.stage-table th {
  background-color: #f8fafc;
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.stage-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.stage-row:last-child td {
  border-bottom: none;
}

.stage-row:hover {
  background-color: #f8fafc;
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stage-label {
  font-weight: 500;
  color: #111827;
}

.stage-type {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rate-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rate-value {
  font-weight: 500;
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

.no-data {
  color: #9ca3af;
  font-style: italic;
}

.chart-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 40px;
}

.trends-chart {
  max-height: 400px;
}

.quality-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.quality-metrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.quality-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.quality-label {
  font-weight: 500;
  color: #374151;
  min-width: 140px;
}

.quality-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-fill.completeness {
  background-color: #10b981;
}

.progress-fill.accuracy {
  background-color: #8b5cf6;
}

.progress-text {
  font-weight: 500;
  color: #374151;
  min-width: 50px;
}

@media (max-width: 768px) {
  .instance-analytics {
    padding: 16px;
  }
  
  .analytics-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .quality-item {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .quality-label {
    min-width: auto;
  }
}
</style>