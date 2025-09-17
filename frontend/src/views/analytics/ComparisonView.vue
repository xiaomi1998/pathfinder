<template>
  <div class="comparison-view">
    <!-- Navigation Breadcrumbs -->
    <nav class="breadcrumb-nav">
      <router-link to="/funnels" class="breadcrumb-link">Funnels</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Instance Comparison</span>
    </nav>

    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Instance Comparison</h1>
      <p class="page-description">
        Compare performance metrics across multiple funnel instances to identify patterns and optimization opportunities.
      </p>
    </div>

    <!-- Main Comparison Component -->
    <InstanceComparison 
      :initialInstanceIds="initialInstanceIds"
      :dateRange="dateRange"
    />

    <!-- Additional Resources -->
    <div class="resources-section">
      <h3 class="resources-title">Related Actions</h3>
      <div class="resources-grid">
        <div class="resource-card">
          <h4>Trend Analysis</h4>
          <p>Analyze performance trends over time for deeper insights.</p>
          <router-link 
            :to="getTrendsUrl()"
            class="resource-link"
          >
            View Trends Analysis →
          </router-link>
        </div>
        
        <div class="resource-card">
          <h4>Best Practices</h4>
          <p>Learn optimization strategies from high-performing instances.</p>
          <button class="resource-link" @click="openBestPractices">
            View Best Practices →
          </button>
        </div>
        
        <div class="resource-card">
          <h4>Export Data</h4>
          <p>Export comparison data for external analysis and reporting.</p>
          <button class="resource-link" @click="exportAllData">
            Export Report →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InstanceComparison from '@/components/analytics/InstanceComparison.vue'
import { analyticsAPI } from '@/api/analytics'

const route = useRoute()
const router = useRouter()

// Parse instance IDs from query parameters
const initialInstanceIds = computed(() => {
  const ids = route.query.instanceIds as string | string[]
  if (Array.isArray(ids)) {
    return ids
  } else if (ids) {
    return ids.split(',').filter(Boolean)
  }
  return []
})

// Date range from query parameters
const dateRange = computed(() => {
  const start = route.query.startDate as string
  const end = route.query.endDate as string
  
  if (start && end) {
    return {
      start: new Date(start),
      end: new Date(end)
    }
  }
  
  return undefined
})

const getTrendsUrl = () => {
  const params = new URLSearchParams()
  if (initialInstanceIds.value.length > 0) {
    params.set('instanceIds', initialInstanceIds.value.join(','))
  }
  if (dateRange.value) {
    params.set('startDate', dateRange.value.start.toISOString())
    params.set('endDate', dateRange.value.end.toISOString())
  }
  
  return `/analytics/trends${params.toString() ? '?' + params.toString() : ''}`
}

const openBestPractices = () => {
  // In a real app, this might open a modal or navigate to a help section
  alert('Best practices feature would be implemented here. This could show tips based on high-performing instances in the comparison.')
}

const exportAllData = async () => {
  try {
    if (initialInstanceIds.value.length < 2) {
      alert('Please select at least 2 instances for comparison export.')
      return
    }
    
    // This would trigger an export of the comparison data
    const comparison = await analyticsAPI.compareInstances(
      initialInstanceIds.value,
      dateRange.value ? { dateRange: dateRange.value } : {}
    )
    
    const exportData = await analyticsAPI.exportData('comparison', comparison, 'xlsx')
    
    // Create download link
    const link = document.createElement('a')
    link.href = exportData.downloadUrl
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to export comparison data:', error)
    alert('Failed to export data. Please try again.')
  }
}
</script>

<style scoped>
.comparison-view {
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

.resources-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
}

.resources-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.resource-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.resource-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.resource-card p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.resource-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.resource-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .comparison-view {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .page-description {
    font-size: 14px;
  }
  
  .resources-grid {
    grid-template-columns: 1fr;
  }
}
</style>