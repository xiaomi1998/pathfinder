<template>
  <div class="instance-analytics-view">
    <!-- Navigation Breadcrumbs -->
    <nav class="breadcrumb-nav">
      <router-link to="/funnels" class="breadcrumb-link">Funnels</router-link>
      <span class="breadcrumb-separator">/</span>
      <router-link :to="`/funnels/${instanceId}`" class="breadcrumb-link">{{ funnelName || 'Instance' }}</router-link>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Analytics</span>
    </nav>

    <!-- Main Analytics Component -->
    <InstanceAnalytics 
      :instanceId="instanceId"
      :dateRange="dateRange"
      :autoRefresh="autoRefresh"
      :refreshInterval="300000"
    />

    <!-- Quick Actions -->
    <div class="quick-actions">
      <router-link 
        :to="`/analytics/comparison?instanceIds=${instanceId}`"
        class="action-btn comparison-btn"
      >
        <i class="icon-bar-chart"></i>
        Compare with Others
      </router-link>
      
      <router-link 
        :to="`/analytics/trends?instanceIds=${instanceId}`"
        class="action-btn trends-btn"
      >
        <i class="icon-trending-up"></i>
        View Trends
      </router-link>
      
      <router-link 
        :to="`/analytics/template/${instanceId}`"
        class="action-btn template-btn"
      >
        <i class="icon-layers"></i>
        Template Overview
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import InstanceAnalytics from '@/components/analytics/InstanceAnalytics.vue'
import { funnelAPI } from '@/api/funnel'

const route = useRoute()

const instanceId = computed(() => route.params.id as string)
const funnelName = ref<string>('')
const autoRefresh = ref(false)

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

// Load funnel name
const loadFunnelInfo = async () => {
  try {
    const funnel = await funnelAPI.getFunnelById(instanceId.value)
    funnelName.value = funnel.name
  } catch (error) {
    console.error('Failed to load funnel info:', error)
  }
}

onMounted(() => {
  loadFunnelInfo()
})
</script>

<style scoped>
.instance-analytics-view {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 32px;
}

.breadcrumb-nav {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
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

.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid;
}

.comparison-btn {
  background-color: #f0f9ff;
  color: #0369a1;
  border-color: #0ea5e9;
}

.comparison-btn:hover {
  background-color: #e0f2fe;
  transform: translateY(-1px);
}

.trends-btn {
  background-color: #f0fdf4;
  color: #166534;
  border-color: #22c55e;
}

.trends-btn:hover {
  background-color: #dcfce7;
  transform: translateY(-1px);
}

.template-btn {
  background-color: #fef7ff;
  color: #7c3aed;
  border-color: #a855f7;
}

.template-btn:hover {
  background-color: #faf5ff;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .instance-analytics-view {
    padding: 16px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>