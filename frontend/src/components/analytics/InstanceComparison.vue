<template>
  <div class="instance-comparison">
    <!-- Header -->
    <div class="comparison-header">
      <h2 class="comparison-title">Instance Comparison</h2>
      <div class="header-actions">
        <button @click="addInstance" class="btn btn-secondary">
          <i class="icon-plus"></i>
          Add Instance
        </button>
        <button @click="exportComparison" class="btn btn-primary" :disabled="!comparison">
          <i class="icon-download"></i>
          Export
        </button>
      </div>
    </div>

    <!-- Instance Selection -->
    <div class="instance-selection">
      <h3>Selected Instances</h3>
      <div class="selected-instances">
        <div 
          v-for="(instanceId, index) in selectedInstances" 
          :key="instanceId"
          class="instance-chip"
        >
          <span class="instance-name">{{ getInstanceName(instanceId) }}</span>
          <button 
            @click="removeInstance(index)"
            class="remove-btn"
            :disabled="selectedInstances.length <= 2"
          >
            <i class="icon-x"></i>
          </button>
        </div>
        
        <div class="instance-selector" v-if="selectedInstances.length < 10">
          <select v-model="newInstanceId" @change="handleInstanceSelect">
            <option value="">Select an instance...</option>
            <option 
              v-for="instance in availableInstances" 
              :key="instance.id" 
              :value="instance.id"
            >
              {{ instance.name }}
            </option>
          </select>
        </div>
      </div>
      
      <button 
        @click="compareInstances" 
        class="btn btn-primary compare-btn"
        :disabled="selectedInstances.length < 2 || loading"
      >
        <i class="icon-bar-chart" :class="{ 'rotating': loading }"></i>
        {{ loading ? 'Comparing...' : 'Compare Instances' }}
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-error"></i>
        <h3>Comparison Failed</h3>
        <p>{{ error }}</p>
        <button @click="compareInstances" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-if="comparison && !loading" class="comparison-results">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card best-performer">
          <div class="card-header">
            <h4>Best Performer</h4>
            <i class="icon-trophy"></i>
          </div>
          <div class="card-content">
            <div class="performer-name">{{ getBestPerformerName() }}</div>
            <div class="performer-metric">
              {{ comparison.comparison.best.metric }}: {{ formatMetricValue(comparison.comparison.best.value, comparison.comparison.best.metric) }}
            </div>
          </div>
        </div>

        <div class="summary-card worst-performer">
          <div class="card-header">
            <h4>Needs Improvement</h4>
            <i class="icon-alert"></i>
          </div>
          <div class="card-content">
            <div class="performer-name">{{ getWorstPerformerName() }}</div>
            <div class="performer-metric">
              {{ comparison.comparison.worst.metric }}: {{ formatMetricValue(comparison.comparison.worst.value, comparison.comparison.worst.metric) }}
            </div>
          </div>
        </div>

        <div class="summary-card average-performance">
          <div class="card-header">
            <h4>Average Performance</h4>
            <i class="icon-bar-chart-2"></i>
          </div>
          <div class="card-content">
            <div class="average-metrics">
              <div class="average-item">
                <span class="label">Completion Rate:</span>
                <span class="value">{{ formatPercentage(comparison.comparison.average.completionRate) }}%</span>
              </div>
              <div class="average-item">
                <span class="label">Conversion Rate:</span>
                <span class="value">{{ formatPercentage(comparison.comparison.average.overallConversionRate) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Comparison Table -->
      <div class="comparison-table-section">
        <h3 class="section-title">Detailed Comparison</h3>
        <div class="table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Instance</th>
                <th>Completion Rate</th>
                <th>Conversion Rate</th>
                <th>Avg. Time</th>
                <th>Total Revenue</th>
                <th>Last Updated</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="instance in comparison.instances" 
                :key="instance.id"
                class="instance-row"
                :class="{ 
                  'best-row': instance.id === comparison.comparison.best.instanceId,
                  'worst-row': instance.id === comparison.comparison.worst.instanceId 
                }"
              >
                <td class="instance-name">
                  <div class="name-container">
                    <span class="name">{{ instance.name }}</span>
                    <span v-if="instance.id === comparison.comparison.best.instanceId" class="badge best">Best</span>
                    <span v-if="instance.id === comparison.comparison.worst.instanceId" class="badge worst">Needs Work</span>
                  </div>
                </td>
                <td class="completion-rate">
                  <div class="metric-with-bar">
                    <span class="metric-value">{{ formatPercentage(instance.completionRate) }}%</span>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${Math.min(instance.completionRate, 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="conversion-rate">
                  <div class="metric-with-bar">
                    <span class="metric-value">{{ formatPercentage(instance.overallConversionRate) }}%</span>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${Math.min(instance.overallConversionRate, 100)}%` }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="avg-time">{{ formatTimeInMinutes(instance.avgTimeToComplete) }}</td>
                <td class="revenue">
                  <span v-if="instance.totalRevenue !== undefined">
                    ${{ formatNumber(instance.totalRevenue) }}
                  </span>
                  <span v-else class="no-data">--</span>
                </td>
                <td class="last-updated">{{ formatDate(instance.lastUpdated) }}</td>
                <td class="trend">
                  <div class="trend-indicator" :class="getTrendClass(instance.id)">
                    <i :class="getTrendIcon(instance.id)"></i>
                    <span class="trend-text">{{ getTrendText(instance.id) }}</span>
                    <span class="trend-percent">{{ getTrendPercent(instance.id) }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Visual Comparison Chart -->
      <div class="chart-section">
        <h3 class="section-title">Visual Comparison</h3>
        <div class="chart-tabs">
          <button 
            v-for="chart in chartOptions" 
            :key="chart.key"
            @click="activeChart = chart.key"
            class="chart-tab"
            :class="{ active: activeChart === chart.key }"
          >
            {{ chart.label }}
          </button>
        </div>
        <div class="chart-container">
          <canvas ref="comparisonChart" class="comparison-chart"></canvas>
        </div>
      </div>

      <!-- Insights and Recommendations -->
      <div class="insights-section">
        <h3 class="section-title">Insights & Recommendations</h3>
        <div class="insights-grid">
          <div class="insight-card">
            <h4>Performance Gap</h4>
            <p>{{ getPerformanceGapInsight() }}</p>
          </div>
          <div class="insight-card">
            <h4>Optimization Opportunity</h4>
            <p>{{ getOptimizationInsight() }}</p>
          </div>
          <div class="insight-card">
            <h4>Trend Analysis</h4>
            <p>{{ getTrendInsight() }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { analyticsAPI, type InstanceComparison } from '@/api/analytics'
import { funnelAPI } from '@/api/funnel'
import Chart from 'chart.js/auto'

interface InstanceOption {
  id: string
  name: string
}

const props = defineProps<{
  initialInstanceIds?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
}>()

const selectedInstances = ref<string[]>(props.initialInstanceIds || [])
const newInstanceId = ref('')
const availableInstances = ref<InstanceOption[]>([])
const comparison = ref<InstanceComparison | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const comparisonChart = ref<HTMLCanvasElement>()
const chartInstance = ref<Chart | null>(null)
const activeChart = ref('conversionRate')

const chartOptions = [
  { key: 'conversionRate', label: 'Conversion Rates' },
  { key: 'completionRate', label: 'Completion Rates' },
  { key: 'avgTime', label: 'Average Time' },
  { key: 'revenue', label: 'Revenue' }
]

const loadAvailableInstances = async () => {
  try {
    // In a real app, you'd have an endpoint to get all user's funnel instances
    const funnels = await funnelAPI.getUserFunnels({ page: 1, limit: 100 })
    availableInstances.value = funnels.data.map(funnel => ({
      id: funnel.id,
      name: funnel.name
    })).filter(instance => !selectedInstances.value.includes(instance.id))
  } catch (err) {
    console.error('Failed to load available instances:', err)
  }
}

const handleInstanceSelect = () => {
  if (newInstanceId.value && !selectedInstances.value.includes(newInstanceId.value)) {
    selectedInstances.value.push(newInstanceId.value)
    newInstanceId.value = ''
    loadAvailableInstances() // Refresh available instances
  }
}

const removeInstance = (index: number) => {
  selectedInstances.value.splice(index, 1)
  loadAvailableInstances() // Refresh available instances
}

const addInstance = () => {
  // Could open a modal or expand selection interface
  console.log('Add instance functionality could be expanded')
}

const compareInstances = async () => {
  if (selectedInstances.value.length < 2) return
  
  try {
    loading.value = true
    error.value = null
    
    const query = {
      ...(props.dateRange && { dateRange: props.dateRange })
    }
    
    comparison.value = await analyticsAPI.compareInstances(selectedInstances.value, query)
    
    // Render chart after comparison loads
    await nextTick()
    renderComparisonChart()
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Failed to compare instances'
    console.error('Failed to compare instances:', err)
  } finally {
    loading.value = false
  }
}

const exportComparison = async () => {
  try {
    if (!comparison.value) return
    
    const exportData = await analyticsAPI.exportData('comparison', comparison.value, 'xlsx')
    
    const link = document.createElement('a')
    link.href = exportData.downloadUrl
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err: any) {
    console.error('Failed to export comparison:', err)
  }
}

const renderComparisonChart = () => {
  if (!comparisonChart.value || !comparison.value) return
  
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  const ctx = comparisonChart.value.getContext('2d')
  if (!ctx) return

  const instances = comparison.value.instances
  const labels = instances.map(i => i.name)
  
  let data: number[]
  let label: string
  let backgroundColor: string
  let borderColor: string

  switch (activeChart.value) {
    case 'conversionRate':
      data = instances.map(i => i.overallConversionRate)
      label = 'Conversion Rate (%)'
      backgroundColor = 'rgba(59, 130, 246, 0.6)'
      borderColor = '#3b82f6'
      break
    case 'completionRate':
      data = instances.map(i => i.completionRate)
      label = 'Completion Rate (%)'
      backgroundColor = 'rgba(16, 185, 129, 0.6)'
      borderColor = '#10b981'
      break
    case 'avgTime':
      data = instances.map(i => i.avgTimeToComplete)
      label = 'Average Time (minutes)'
      backgroundColor = 'rgba(245, 158, 11, 0.6)'
      borderColor = '#f59e0b'
      break
    case 'revenue':
      data = instances.map(i => i.totalRevenue || 0)
      label = 'Total Revenue ($)'
      backgroundColor = 'rgba(139, 92, 246, 0.6)'
      borderColor = '#8b5cf6'
      break
    default:
      data = instances.map(i => i.overallConversionRate)
      label = 'Conversion Rate (%)'
      backgroundColor = 'rgba(59, 130, 246, 0.6)'
      borderColor = '#3b82f6'
  }

  chartInstance.value = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor,
        borderColor,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: label
          }
        }
      }
    }
  })
}

// Helper functions
const getInstanceName = (instanceId: string): string => {
  const instance = availableInstances.value.find(i => i.id === instanceId)
  return instance?.name || instanceId.substring(0, 8)
}

const getBestPerformerName = (): string => {
  if (!comparison.value) return ''
  const instance = comparison.value.instances.find(i => i.id === comparison.value!.comparison.best.instanceId)
  return instance?.name || 'Unknown'
}

const getWorstPerformerName = (): string => {
  if (!comparison.value) return ''
  const instance = comparison.value.instances.find(i => i.id === comparison.value!.comparison.worst.instanceId)
  return instance?.name || 'Unknown'
}

const getTrendClass = (instanceId: string): string => {
  if (!comparison.value) return ''
  const trend = comparison.value.trends.find(t => t.instanceId === instanceId)
  return trend ? `trend-${trend.trend}` : ''
}

const getTrendIcon = (instanceId: string): string => {
  if (!comparison.value) return 'icon-minus'
  const trend = comparison.value.trends.find(t => t.instanceId === instanceId)
  if (!trend) return 'icon-minus'
  
  switch (trend.trend) {
    case 'improving': return 'icon-trending-up'
    case 'declining': return 'icon-trending-down'
    default: return 'icon-minus'
  }
}

const getTrendText = (instanceId: string): string => {
  if (!comparison.value) return 'Stable'
  const trend = comparison.value.trends.find(t => t.instanceId === instanceId)
  return trend ? trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1) : 'Stable'
}

const getTrendPercent = (instanceId: string): string => {
  if (!comparison.value) return ''
  const trend = comparison.value.trends.find(t => t.instanceId === instanceId)
  if (!trend || trend.changePercent === 0) return ''
  
  const sign = trend.changePercent > 0 ? '+' : ''
  return `${sign}${formatPercentage(trend.changePercent)}%`
}

const formatMetricValue = (value: number, metric: string): string => {
  switch (metric) {
    case 'conversionRate':
    case 'completionRate':
      return `${formatPercentage(value)}%`
    case 'avgTimeToComplete':
      return formatTimeInMinutes(value)
    case 'revenue':
      return `$${formatNumber(value)}`
    default:
      return formatNumber(value)
  }
}

const getPerformanceGapInsight = (): string => {
  if (!comparison.value) return ''
  
  const best = comparison.value.comparison.best.value
  const worst = comparison.value.comparison.worst.value
  const gap = best - worst
  
  return `The performance gap between your best and worst performing instances is ${formatPercentage(gap)}%. This indicates significant optimization opportunities.`
}

const getOptimizationInsight = (): string => {
  if (!comparison.value) return ''
  
  const worstInstance = comparison.value.instances.find(i => i.id === comparison.value!.comparison.worst.instanceId)
  const bestInstance = comparison.value.instances.find(i => i.id === comparison.value!.comparison.best.instanceId)
  
  if (!worstInstance || !bestInstance) return ''
  
  return `${worstInstance.name} could potentially improve by ${formatPercentage(bestInstance.overallConversionRate - worstInstance.overallConversionRate)}% by adopting strategies from ${bestInstance.name}.`
}

const getTrendInsight = (): string => {
  if (!comparison.value) return ''
  
  const improvingCount = comparison.value.trends.filter(t => t.trend === 'improving').length
  const decliningCount = comparison.value.trends.filter(t => t.trend === 'declining').length
  
  if (improvingCount > decliningCount) {
    return `${improvingCount} out of ${comparison.value.instances.length} instances are showing improvement trends. Keep up the good work!`
  } else if (decliningCount > improvingCount) {
    return `${decliningCount} out of ${comparison.value.instances.length} instances are declining. Consider reviewing strategies and implementing improvements.`
  } else {
    return `Your instances show mixed performance trends. Focus on replicating successful strategies across all instances.`
  }
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
    day: 'numeric'
  })
}

// Watch for chart type changes
watch(() => activeChart.value, () => {
  renderComparisonChart()
})

// Watch for selected instances changes
watch(() => selectedInstances.value, () => {
  if (selectedInstances.value.length >= 2) {
    compareInstances()
  }
}, { deep: true })

onMounted(() => {
  loadAvailableInstances()
  if (selectedInstances.value.length >= 2) {
    compareInstances()
  }
})

// Cleanup on unmount
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})
</script>

<style scoped>
.instance-comparison {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
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

.instance-selection {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 30px;
}

.instance-selection h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.selected-instances {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.instance-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f0f9ff;
  color: #0369a1;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.remove-btn {
  background: none;
  border: none;
  color: #0369a1;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 12px;
}

.remove-btn:hover {
  background-color: rgba(3, 105, 161, 0.1);
}

.remove-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.instance-selector select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.compare-btn {
  margin-top: 12px;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-message h3 {
  color: #dc2626;
  margin: 12px 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.summary-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.card-header i {
  font-size: 24px;
  opacity: 0.6;
}

.best-performer {
  border-left: 4px solid #10b981;
}

.best-performer .card-header i {
  color: #10b981;
}

.worst-performer {
  border-left: 4px solid #f59e0b;
}

.worst-performer .card-header i {
  color: #f59e0b;
}

.average-performance {
  border-left: 4px solid #6b7280;
}

.average-performance .card-header i {
  color: #6b7280;
}

.performer-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.performer-metric {
  font-size: 14px;
  color: #6b7280;
}

.average-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.average-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.average-item .label {
  font-size: 14px;
  color: #6b7280;
}

.average-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 40px;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th {
  background-color: #f8fafc;
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.instance-row:last-child td {
  border-bottom: none;
}

.instance-row:hover {
  background-color: #f8fafc;
}

.best-row {
  background-color: #f0fdf4;
}

.worst-row {
  background-color: #fefce8;
}

.name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-weight: 500;
  color: #111827;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge.best {
  background-color: #10b981;
  color: white;
}

.badge.worst {
  background-color: #f59e0b;
  color: white;
}

.metric-with-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 80px;
}

.metric-value {
  font-weight: 500;
  color: #111827;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background-color: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-improving {
  color: #059669;
}

.trend-declining {
  color: #dc2626;
}

.trend-stable {
  color: #6b7280;
}

.chart-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 40px;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.chart-tab {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.chart-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.chart-tab:hover {
  color: #3b82f6;
}

.chart-container {
  height: 400px;
}

.comparison-chart {
  max-height: 400px;
}

.insights-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.insight-card {
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.insight-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.insight-card p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

@media (max-width: 768px) {
  .instance-comparison {
    padding: 16px;
  }
  
  .comparison-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .selected-instances {
    flex-direction: column;
    align-items: stretch;
  }
  
  .instance-chip {
    justify-content: space-between;
  }
  
  .comparison-table {
    font-size: 12px;
  }
  
  .comparison-table th,
  .comparison-table td {
    padding: 8px;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
}
</style>