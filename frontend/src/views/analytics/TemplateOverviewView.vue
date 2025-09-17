<template>
  <div class="template-overview-view">
    <!-- Navigation Breadcrumbs -->
    <nav class="breadcrumb-nav">
      <router-link to="/funnels" class="breadcrumb-link">Funnels</router-link>
      <span class="breadcrumb-separator">/</span>
      <router-link :to="`/funnels/${funnelId}`" class="breadcrumb-link">{{ funnelName || 'Template' }}</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Template Overview</span>
    </nav>

    <!-- Main Template Overview Component -->
    <TemplateOverview 
      :funnelId="funnelId"
      :dateRange="dateRange"
      :autoRefresh="autoRefresh"
    />

    <!-- Template Management Actions -->
    <div class="template-actions">
      <h3 class="actions-title">Template Management</h3>
      <div class="actions-grid">
        <div class="action-card create-instance">
          <div class="action-header">
            <h4>Create New Instance</h4>
            <i class="icon-plus-circle"></i>
          </div>
          <p>Create a new instance based on this template structure.</p>
          <router-link 
            :to="`/funnels/create?templateId=${funnelId}`"
            class="action-btn primary"
          >
            Create Instance
          </router-link>
        </div>

        <div class="action-card optimize-template">
          <div class="action-header">
            <h4>Optimize Template</h4>
            <i class="icon-zap"></i>
          </div>
          <p>Get AI-powered suggestions to improve template performance.</p>
          <button @click="optimizeTemplate" class="action-btn secondary">
            Get Suggestions
          </button>
        </div>

        <div class="action-card export-template">
          <div class="action-header">
            <h4>Export Template</h4>
            <i class="icon-download"></i>
          </div>
          <p>Export template data and analytics for external analysis.</p>
          <button @click="exportTemplate" class="action-btn secondary">
            Export Data
          </button>
        </div>

        <div class="action-card duplicate-template">
          <div class="action-header">
            <h4>Duplicate Template</h4>
            <i class="icon-copy"></i>
          </div>
          <p>Create a copy of this template for experimentation.</p>
          <button @click="duplicateTemplate" class="action-btn secondary">
            Duplicate
          </button>
        </div>
      </div>
    </div>

    <!-- Related Templates -->
    <div v-if="relatedTemplates.length > 0" class="related-templates">
      <h3 class="related-title">Related Templates</h3>
      <div class="templates-grid">
        <div 
          v-for="template in relatedTemplates" 
          :key="template.id"
          class="template-card"
          @click="navigateToTemplate(template.id)"
        >
          <div class="template-info">
            <h4 class="template-name">{{ template.name }}</h4>
            <p class="template-description">{{ template.description }}</p>
          </div>
          <div class="template-metrics">
            <div class="metric">
              <span class="metric-value">{{ template.instanceCount }}</span>
              <span class="metric-label">Instances</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ formatPercentage(template.avgConversionRate) }}%</span>
              <span class="metric-label">Avg. Conv.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Insights Modal -->
    <div v-if="showInsightsModal" class="modal-overlay" @click="closeInsightsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Template Optimization Insights</h3>
          <button @click="closeInsightsModal" class="modal-close">
            <i class="icon-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="insights-list">
            <div v-for="insight in optimizationInsights" :key="insight.id" class="insight-item">
              <div class="insight-header">
                <h4>{{ insight.title }}</h4>
                <span class="insight-priority" :class="getPriorityClass(insight.priority)">
                  {{ insight.priority }}
                </span>
              </div>
              <p class="insight-description">{{ insight.description }}</p>
              <div v-if="insight.actionItems.length > 0" class="action-items">
                <h5>Action Items:</h5>
                <ul>
                  <li v-for="item in insight.actionItems" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div class="insight-impact">
                <span class="impact-label">Expected Impact:</span>
                <span class="impact-value">{{ insight.expectedImpact }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TemplateOverview from '@/components/analytics/TemplateOverview.vue'
import { funnelAPI } from '@/api/funnel'
import { analyticsAPI } from '@/api/analytics'

const route = useRoute()
const router = useRouter()

const funnelId = computed(() => route.params.id as string)
const funnelName = ref<string>('')
const autoRefresh = ref(false)
const showInsightsModal = ref(false)
const relatedTemplates = ref<any[]>([])
const optimizationInsights = ref<any[]>([])

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

// Load funnel and related data
const loadFunnelInfo = async () => {
  try {
    const funnel = await funnelAPI.getFunnelById(funnelId.value)
    funnelName.value = funnel.name
  } catch (error) {
    console.error('Failed to load funnel info:', error)
  }
}

const loadRelatedTemplates = async () => {
  try {
    // In a real app, this would fetch templates with similar characteristics
    // For now, we'll mock some data
    relatedTemplates.value = [
      {
        id: 'template-1',
        name: 'E-commerce Checkout Flow',
        description: 'Optimized for online retail conversions',
        instanceCount: 12,
        avgConversionRate: 15.4
      },
      {
        id: 'template-2', 
        name: 'SaaS Onboarding',
        description: 'Software-as-a-Service user onboarding',
        instanceCount: 8,
        avgConversionRate: 22.1
      },
      {
        id: 'template-3',
        name: 'Lead Generation',
        description: 'B2B lead capture and qualification',
        instanceCount: 15,
        avgConversionRate: 8.7
      }
    ]
  } catch (error) {
    console.error('Failed to load related templates:', error)
  }
}

const optimizeTemplate = async () => {
  try {
    // In a real app, this would call an AI service for optimization suggestions
    optimizationInsights.value = [
      {
        id: '1',
        title: 'Improve Stage 2 Conversion',
        priority: 'high',
        description: 'Stage 2 shows 15% lower conversion than industry benchmark. Consider simplifying the form or adding progress indicators.',
        actionItems: [
          'Reduce form fields from 8 to 5',
          'Add progress bar to show completion status',
          'Implement auto-save functionality'
        ],
        expectedImpact: '+12% conversion rate improvement'
      },
      {
        id: '2',
        title: 'Optimize Mobile Experience',
        priority: 'medium',
        description: 'Mobile users have 23% lower completion rates. The template needs mobile-specific optimizations.',
        actionItems: [
          'Implement responsive design patterns',
          'Optimize touch targets for mobile',
          'Reduce page load times'
        ],
        expectedImpact: '+8% mobile conversion improvement'
      },
      {
        id: '3',
        title: 'Add Exit Intent Capture',
        priority: 'low',
        description: 'High bounce rate at stage 3 indicates users need additional motivation to continue.',
        actionItems: [
          'Implement exit intent popup',
          'Add social proof elements',
          'Create urgency with limited-time offers'
        ],
        expectedImpact: '+5% reduction in bounce rate'
      }
    ]
    showInsightsModal.value = true
  } catch (error) {
    console.error('Failed to generate optimization insights:', error)
    alert('Failed to generate insights. Please try again.')
  }
}

const exportTemplate = async () => {
  try {
    const templateData = await analyticsAPI.getTemplateAnalytics(funnelId.value)
    const exportData = await analyticsAPI.exportData('template', templateData, 'xlsx')
    
    const link = document.createElement('a')
    link.href = exportData.downloadUrl
    link.download = exportData.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to export template:', error)
    alert('Failed to export template data. Please try again.')
  }
}

const duplicateTemplate = async () => {
  try {
    const funnel = await funnelAPI.getFunnelById(funnelId.value)
    // In a real app, this would create a copy of the template
    const duplicatedFunnel = await funnelAPI.createFunnel({
      name: `${funnel.name} (Copy)`,
      description: `Copy of ${funnel.description || funnel.name}`,
      canvasData: funnel.canvasData
    })
    
    router.push(`/analytics/template/${duplicatedFunnel.id}`)
  } catch (error) {
    console.error('Failed to duplicate template:', error)
    alert('Failed to duplicate template. Please try again.')
  }
}

const navigateToTemplate = (templateId: string) => {
  router.push(`/analytics/template/${templateId}`)
}

const closeInsightsModal = () => {
  showInsightsModal.value = false
}

const formatPercentage = (value: number): string => {
  return Math.round(value * 100) / 100 + ''
}

const getPriorityClass = (priority: string): string => {
  switch (priority) {
    case 'high':
      return 'priority-high'
    case 'medium':
      return 'priority-medium'
    case 'low':
      return 'priority-low'
    default:
      return 'priority-medium'
  }
}

onMounted(() => {
  loadFunnelInfo()
  loadRelatedTemplates()
})
</script>

<style scoped>
.template-overview-view {
  max-width: 1200px;
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

.template-actions {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
}

.actions-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.action-header i {
  font-size: 20px;
  opacity: 0.6;
}

.action-card p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}

.action-btn.primary {
  background-color: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background-color: #2563eb;
}

.action-btn.secondary {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.action-btn.secondary:hover {
  background-color: #f1f5f9;
}

.related-templates {
  margin-top: 48px;
}

.related-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.template-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px 0;
}

.template-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.template-metrics {
  display: flex;
  gap: 24px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.metric-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  max-width: 600px;
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
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.insight-item {
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 8px;
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

.insight-priority {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background-color: #fee2e2;
  color: #dc2626;
}

.priority-medium {
  background-color: #fef3c7;
  color: #d97706;
}

.priority-low {
  background-color: #f0f9ff;
  color: #0369a1;
}

.insight-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0 0 16px 0;
}

.action-items h5 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.action-items ul {
  margin: 0;
  padding-left: 20px;
}

.action-items li {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.insight-impact {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
}

.impact-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.impact-value {
  font-size: 13px;
  color: #059669;
  font-weight: 600;
}

@media (max-width: 768px) {
  .template-overview-view {
    padding: 16px;
  }
  
  .actions-grid,
  .templates-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .template-metrics {
    justify-content: center;
  }
}
</style>