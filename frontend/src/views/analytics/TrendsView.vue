<template>
  <div class="trends-view">
    <!-- Navigation Breadcrumbs -->
    <nav class="breadcrumb-nav">
      <router-link to="/funnels" class="breadcrumb-link">Funnels</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Trends Analysis</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Performance Trends Analysis</h1>
      <p class="page-description">
        Analyze performance trends across multiple instances to identify patterns, seasonal variations, and optimization opportunities.
      </p>
    </div>

    <!-- Trends Configuration -->
    <div class="trends-config">
      <h3 class="config-title">Analysis Configuration</h3>
      <div class="config-content">
        <div class="config-section">
          <label class="config-label">Selected Instances</label>
          <div class="instance-tags">
            <div 
              v-for="(instanceId, index) in selectedInstanceIds" 
              :key="instanceId"
              class="instance-tag"
            >
              <span class="tag-name">{{ getInstanceName(instanceId) }}</span>
              <button @click="removeInstance(index)" class="tag-remove">
                <i class="icon-x"></i>
              </button>
            </div>
            <button @click="showInstanceSelector = true" class="add-instance-btn">
              <i class="icon-plus"></i>
              Add Instance
            </button>
          </div>
        </div>

        <div class="config-section">
          <label class="config-label">Date Range</label>
          <div class="date-range-inputs">
            <input 
              v-model="startDate"
              type="date"
              class="date-input"
              @change="updateDateRange"
            />
            <span class="date-separator">to</span>
            <input 
              v-model="endDate"
              type="date"
              class="date-input"
              @change="updateDateRange"
            />
          </div>
        </div>

        <div class="config-section">
          <label class="config-label">Analysis Options</label>
          <div class="analysis-options">
            <label class="option-checkbox">
              <input 
                v-model="includePatternAnalysis"
                type="checkbox"
                @change="refreshAnalysis"
              />
              Include Pattern Analysis
            </label>
            <label class="option-checkbox">
              <input 
                v-model="enableAutoRefresh"
                type="checkbox"
                @change="toggleAutoRefresh"
              />
              Auto-refresh (5 min)
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Trends Chart -->
    <div v-if="selectedInstanceIds.length > 0" class="trends-chart-section">
      <InstanceTrendChart 
        :instanceIds="selectedInstanceIds"
        :dateRange="dateRange"
        :autoRefresh="enableAutoRefresh"
        :refreshInterval="300000"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state-content">
        <i class="icon-bar-chart empty-icon"></i>
        <h3>No Instances Selected</h3>
        <p>Select one or more instances to begin trends analysis.</p>
        <button @click="showInstanceSelector = true" class="btn btn-primary">
          Select Instances
        </button>
      </div>
    </div>

    <!-- Analysis Summary -->
    <div v-if="selectedInstanceIds.length > 0" class="analysis-summary">
      <h3 class="summary-title">Analysis Summary</h3>
      <div class="summary-grid">
        <div class="summary-card trends-overview">
          <h4>Trends Overview</h4>
          <p>{{ getTrendsOverview() }}</p>
        </div>
        
        <div class="summary-card key-insights">
          <h4>Key Insights</h4>
          <ul class="insights-list">
            <li v-for="insight in getKeyInsights()" :key="insight">{{ insight }}</li>
          </ul>
        </div>
        
        <div class="summary-card recommendations">
          <h4>Recommendations</h4>
          <ul class="recommendations-list">
            <li v-for="rec in getRecommendations()" :key="rec">{{ rec }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Instance Selector Modal -->
    <div v-if="showInstanceSelector" class="modal-overlay" @click="closeInstanceSelector">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Select Instances for Analysis</h3>
          <button @click="closeInstanceSelector" class="modal-close">
            <i class="icon-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="instance-list">
            <div 
              v-for="instance in availableInstances" 
              :key="instance.id"
              class="instance-item"
              :class="{ selected: selectedInstanceIds.includes(instance.id) }"
              @click="toggleInstanceSelection(instance.id)"
            >
              <div class="instance-info">
                <h5>{{ instance.name }}</h5>
                <p>{{ instance.description }}</p>
              </div>
              <div class="instance-metrics">
                <div class="metric">
                  <span class="metric-value">{{ formatPercentage(instance.conversionRate) }}%</span>
                  <span class="metric-label">Conv. Rate</span>
                </div>
                <div class="metric">
                  <span class="metric-value">{{ formatDate(instance.lastUpdated) }}</span>
                  <span class="metric-label">Last Updated</span>
                </div>
              </div>
              <div class="selection-indicator">
                <i class="icon-check"></i>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button @click="closeInstanceSelector" class="btn btn-secondary">
              Cancel
            </button>
            <button @click="applyInstanceSelection" class="btn btn-primary">
              Apply Selection ({{ selectedInstanceIds.length }})
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstanceTrendChart from '@/components/analytics/InstanceTrendChart.vue'
import { funnelAPI } from '@/api/funnel'

const route = useRoute()
const router = useRouter()

const selectedInstanceIds = ref<string[]>([])
const availableInstances = ref<any[]>([])
const showInstanceSelector = ref(false)
const includePatternAnalysis = ref(true)
const enableAutoRefresh = ref(false)

// Date range controls
const startDate = ref('')
const endDate = ref('')

// Initialize date range (default to last 30 days)
const initializeDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  
  endDate.value = end.toISOString().split('T')[0]
  startDate.value = start.toISOString().split('T')[0]
}

// Parse initial instance IDs from query parameters
const parseInitialInstanceIds = () => {
  const ids = route.query.instanceIds as string | string[]
  if (Array.isArray(ids)) {
    selectedInstanceIds.value = ids
  } else if (ids) {
    selectedInstanceIds.value = ids.split(',').filter(Boolean)
  }
}

// Parse initial date range from query parameters
const parseInitialDateRange = () => {
  const start = route.query.startDate as string
  const end = route.query.endDate as string
  
  if (start && end) {
    startDate.value = start.split('T')[0]
    endDate.value = end.split('T')[0]
  }
}

// Computed date range for components
const dateRange = computed(() => {
  if (startDate.value && endDate.value) {
    return {
      start: new Date(startDate.value),
      end: new Date(endDate.value)
    }
  }
  return undefined
})

// Load available instances
const loadAvailableInstances = async () => {
  try {
    const funnels = await funnelAPI.getUserFunnels({ page: 1, limit: 100 })
    availableInstances.value = funnels.data.map(funnel => ({
      id: funnel.id,
      name: funnel.name,
      description: funnel.description || 'No description available',
      conversionRate: Math.random() * 25, // Mock data
      lastUpdated: funnel.updatedAt
    }))
  } catch (error) {
    console.error('Failed to load available instances:', error)
  }
}

// Instance management
const toggleInstanceSelection = (instanceId: string) => {
  const index = selectedInstanceIds.value.indexOf(instanceId)
  if (index > -1) {
    selectedInstanceIds.value.splice(index, 1)
  } else {
    selectedInstanceIds.value.push(instanceId)
  }
}

const removeInstance = (index: number) => {
  selectedInstanceIds.value.splice(index, 1)
  updateURL()
}

const closeInstanceSelector = () => {
  showInstanceSelector.value = false
}

const applyInstanceSelection = () => {
  showInstanceSelector.value = false
  updateURL()
}

const updateDateRange = () => {
  updateURL()
  refreshAnalysis()
}

const refreshAnalysis = () => {
  // This would trigger a refresh of the trend analysis
  console.log('Refreshing analysis with new parameters')
}

const toggleAutoRefresh = () => {
  // Auto-refresh logic is handled by the InstanceTrendChart component
  console.log('Auto-refresh toggled:', enableAutoRefresh.value)
}

// URL management
const updateURL = () => {
  const query: any = {}
  
  if (selectedInstanceIds.value.length > 0) {
    query.instanceIds = selectedInstanceIds.value.join(',')
  }
  
  if (startDate.value && endDate.value) {
    query.startDate = startDate.value
    query.endDate = endDate.value
  }
  
  router.replace({ query })
}

// Helper functions
const getInstanceName = (instanceId: string): string => {
  const instance = availableInstances.value.find(i => i.id === instanceId)
  return instance?.name || `Instance ${instanceId.substring(0, 8)}`
}

const formatPercentage = (value: number): string => {
  return Math.round(value * 100) / 100 + ''
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  })
}

const getTrendsOverview = (): string => {
  const instanceCount = selectedInstanceIds.value.length
  if (instanceCount === 1) {
    return 'Analyzing performance trends for a single instance over the selected time period.'
  } else if (instanceCount <= 3) {
    return `Comparing performance trends across ${instanceCount} instances to identify patterns and variations.`
  } else {
    return `Comprehensive analysis of ${instanceCount} instances showing performance variations and correlations.`
  }
}

const getKeyInsights = (): string[] => {
  // Mock insights - in a real app, these would be generated from actual trend analysis
  const insights = [
    'Overall conversion rates show an upward trend over the analysis period',
    'Peak performance typically occurs mid-week (Tuesday-Thursday)',
    'Mobile traffic shows different patterns compared to desktop users'
  ]
  
  if (selectedInstanceIds.value.length > 2) {
    insights.push('High variance detected between instances suggests optimization opportunities')
  }
  
  return insights
}

const getRecommendations = (): string[] => {
  // Mock recommendations - in a real app, these would be AI-generated based on trend analysis
  const recommendations = [
    'Focus optimization efforts on instances with declining trends',
    'Investigate the causes of high-performing periods for replication',
    'Consider seasonal adjustments to marketing and user experience'
  ]
  
  if (includePatternAnalysis.value) {
    recommendations.push('Review pattern analysis for recurring optimization opportunities')
  }
  
  return recommendations
}

// Watch for route changes
watch(() => route.query, () => {
  parseInitialInstanceIds()
  parseInitialDateRange()
}, { deep: true })

onMounted(() => {
  initializeDateRange()
  parseInitialInstanceIds()
  parseInitialDateRange()
  loadAvailableInstances()
})
</script>

<style scoped>
.trends-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 14px;
}

.breadcrumb-link {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #9ca3af;
}

.breadcrumb-current {
  color: #6b7280;
  font-weight: 500;
}

.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.5;
}

.trends-config {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 32px;
}

.config-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.config-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.instance-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.instance-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f0f9ff;
  color: #0369a1;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: #0369a1;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
}

.tag-remove:hover {
  background-color: rgba(3, 105, 161, 0.1);
}

.add-instance-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px dashed #d1d5db;
  color: #6b7280;
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-instance-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.date-range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.date-separator {
  color: #6b7280;
  font-size: 14px;
}

.analysis-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.trends-chart-section {
  margin-bottom: 32px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state-content h3 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.empty-state-content p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.analysis-summary {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.summary-card {
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.summary-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.summary-card p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.insights-list,
.recommendations-list {
  margin: 0;
  padding-left: 16px;
}

.insights-list li,
.recommendations-list li {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 6px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.instance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.instance-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.instance-item:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.instance-item.selected {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.instance-info {
  flex: 1;
}

.instance-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.instance-info p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.instance-metrics {
  display: flex;
  gap: 16px;
  margin-right: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-value {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.metric-label {
  font-size: 10px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selection-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.instance-item.selected .selection-indicator {
  opacity: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .trends-view {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .config-content {
    grid-template-columns: 1fr;
  }
  
  .date-range-inputs {
    flex-direction: column;
    align-items: stretch;
  }
  
  .instance-tags {
    flex-direction: column;
    align-items: stretch;
  }
  
  .instance-tag {
    justify-content: space-between;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .instance-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .instance-metrics {
    justify-content: center;
    margin-right: 0;
  }
}
</style>