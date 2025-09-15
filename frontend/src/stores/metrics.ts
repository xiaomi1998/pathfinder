import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { metricsAPI } from '@/api/metrics'
import { funnelInstanceAPI } from '@/api/funnelInstance'
import { useFunnelStore } from './funnel'
import { useFunnelInstanceStore } from './funnelInstance'
import type { 
  MetricDataEntry, 
  MetricsPeriod, 
  FunnelNodeMetrics,
  MetricsStoreState,
  CreateMetricsRequest,
  UpdateMetricsRequest,
  MetricsQueryParams,
  MetricsResponse,
  MetricsSummary,
  DynamicMetricsTableConfig,
  MetricsTableColumn,
  MetricsValidationResult,
  PeriodOption,
  MetricsTemplate
} from '@/types/metrics'
import type { FunnelInstance } from '@/types/funnelInstance'

export const useMetricsStore = defineStore('metrics', () => {
  // State
  const entries = ref<MetricDataEntry[]>([])
  const currentFunnelId = ref<string | null>(null)
  const currentInstanceId = ref<string | null>(null)
  const currentPeriod = ref<MetricsPeriod | null>(null)
  const summary = ref<MetricsSummary | null>(null)
  
  // UI State
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasUnsavedChanges = ref(false)
  const error = ref<string | null>(null)
  
  // Table State
  const selectedNodeIds = ref<string[]>([])
  const tableConfig = ref<DynamicMetricsTableConfig>({
    columns: getDefaultColumns(),
    allowAdd: true,
    allowRemove: true,
    allowReorder: true,
    validation: true,
    autoSave: true,
    saveInterval: 30000 // 30 seconds
  })
  
  // Filters
  const filters = ref({
    search: '',
    nodeTypes: [] as string[],
    dateRange: null as { start: Date; end: Date } | null
  })
  
  // Cache
  const cachedSummaries = ref<Record<string, MetricsSummary>>({})
  const lastFetchTime = ref<Date | null>(null)

  // Getters
  const filteredEntries = computed(() => {
    let filtered = [...entries.value]
    
    if (filters.value.search) {
      const query = filters.value.search.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.nodeName.toLowerCase().includes(query)
      )
    }
    
    if (filters.value.dateRange) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.period.startDate)
        return entryDate >= filters.value.dateRange!.start && 
               entryDate <= filters.value.dateRange!.end
      })
    }
    
    return filtered
  })

  const selectedEntries = computed(() => 
    filteredEntries.value.filter(entry => 
      selectedNodeIds.value.includes(entry.nodeId)
    )
  )

  const currentFunnel = computed(() => {
    const funnelStore = useFunnelStore()
    return funnelStore.currentFunnel
  })

  const currentInstance = computed(() => {
    const instanceStore = useFunnelInstanceStore()
    return instanceStore.currentInstance
  })

  const isInstanceMode = computed(() => {
    return !!currentInstanceId.value
  })

  const availableNodes = computed(() => {
    if (!currentFunnel.value) return []
    return currentFunnel.value.nodes.map(node => ({
      id: node.id,
      name: node.data.label,
      type: node.type
    }))
  })

  const isDataValid = computed(() => {
    return entries.value.every(entry => validateEntry(entry).isValid)
  })

  // Actions - Fetching Data
  const fetchMetrics = async (params: MetricsQueryParams) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await metricsAPI.getMetrics(params)

      if (response.data.success) {
        const data = response.data.data
        entries.value = data.entries
        summary.value = data.summary
        currentPeriod.value = data.period
        currentFunnelId.value = params.funnelId
        
        // Cache summary
        const cacheKey = `${params.funnelId}_${data.period.startDate}_${data.period.endDate}`
        cachedSummaries.value[cacheKey] = data.summary
        
        lastFetchTime.value = new Date()
      }
    } catch (err: any) {
      console.error('Error fetching metrics:', err)
      error.value = err.response?.data?.message || 'Failed to fetch metrics'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refreshMetrics = async () => {
    if (currentFunnelId.value && currentPeriod.value) {
      // Use instance-based fetching if in instance mode
      if (currentInstanceId.value) {
        await fetchInstanceMetrics(currentInstanceId.value)
      } else {
        await fetchMetrics({
          funnelId: currentFunnelId.value,
          startDate: currentPeriod.value.startDate,
          endDate: currentPeriod.value.endDate,
          periodType: currentPeriod.value.type
        })
      }
    }
  }

  // Actions - Instance-based operations
  const fetchInstanceMetrics = async (instanceId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await funnelInstanceAPI.getInstanceWithMetrics(instanceId)

      if (response.data.success) {
        const instance = response.data.data
        currentInstanceId.value = instanceId
        currentFunnelId.value = instance.funnelId
        
        // Convert instance metrics to the expected format
        if (instance.instanceMetrics && instance.instanceMetrics.length > 0) {
          const latestMetrics = instance.instanceMetrics[instance.instanceMetrics.length - 1]
          
          // Convert to MetricDataEntry format
          entries.value = [{
            id: `instance_${instanceId}`,
            funnelId: instance.funnelId,
            nodeId: 'instance_summary',
            nodeName: 'Instance Summary',
            period: {
              type: 'custom',
              startDate: instance.startDate,
              endDate: instance.endDate
            },
            metrics: {
              totalVisitors: latestMetrics.totalEntries || 0,
              conversions: latestMetrics.totalConversions || 0,
              conversionRate: latestMetrics.overallConversionRate || 0,
              revenue: latestMetrics.totalRevenue || 0,
              acquisitionCost: latestMetrics.totalCost || 0,
              averageTimeSpent: latestMetrics.avgTimeSpent || 0
            },
            createdAt: latestMetrics.createdAt,
            updatedAt: latestMetrics.updatedAt
          }]

          // Create summary
          summary.value = {
            totalVisitors: latestMetrics.totalEntries || 0,
            totalConversions: latestMetrics.totalConversions || 0,
            overallConversionRate: latestMetrics.overallConversionRate || 0,
            totalRevenue: latestMetrics.totalRevenue || 0,
            averageTimeInFunnel: latestMetrics.avgTimeSpent || 0,
            trends: {
              visitorsChange: 0,
              conversionChange: 0,
              revenueChange: 0
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching instance metrics:', err)
      error.value = err.response?.data?.message || 'Failed to fetch instance metrics'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createInstanceMetrics = async (instanceId: string, metricsData: any) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await funnelInstanceAPI.createInstanceMetrics(instanceId, metricsData)

      if (response.data.success) {
        hasUnsavedChanges.value = false
        // Refresh the instance metrics
        await fetchInstanceMetrics(instanceId)
        return response.data.data
      }
    } catch (err: any) {
      console.error('Error creating instance metrics:', err)
      error.value = err.response?.data?.message || 'Failed to create instance metrics'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const setCurrentInstance = (instanceId: string | null, funnelId?: string) => {
    currentInstanceId.value = instanceId
    if (funnelId) {
      currentFunnelId.value = funnelId
    }
    
    // Clear existing data when switching instances
    if (instanceId) {
      entries.value = []
      summary.value = null
      hasUnsavedChanges.value = false
    }
  }

  // Actions - Creating and Updating
  const createMetrics = async (request: CreateMetricsRequest) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await metricsAPI.createMetrics(request)

      if (response.data.success) {
        const data = response.data.data
        entries.value = data.entries
        summary.value = data.summary
        hasUnsavedChanges.value = false
        
        // Update cache
        const cacheKey = `${request.funnelId}_${request.period.startDate}_${request.period.endDate}`
        cachedSummaries.value[cacheKey] = data.summary
        
        return data
      }
    } catch (err: any) {
      console.error('Error creating metrics:', err)
      error.value = err.response?.data?.message || 'Failed to create metrics'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const updateMetrics = async (entryId: string, request: UpdateMetricsRequest) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await metricsAPI.updateMetrics(entryId, request)

      if (response.data.success) {
        const data = response.data.data
        entries.value = data.entries
        summary.value = data.summary
        hasUnsavedChanges.value = false
        
        return data
      }
    } catch (err: any) {
      console.error('Error updating metrics:', err)
      error.value = err.response?.data?.message || 'Failed to update metrics'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const deleteMetrics = async (entryId: string) => {
    try {
      const response = await metricsAPI.deleteMetrics(entryId)
      
      if (response.data.success) {
        entries.value = entries.value.filter(entry => entry.id !== entryId)
        hasUnsavedChanges.value = false
      }
    } catch (err: any) {
      console.error('Error deleting metrics:', err)
      error.value = err.response?.data?.message || 'Failed to delete metrics'
      throw err
    }
  }

  // Actions - Local State Management
  const addEntry = (nodeId: string, nodeName: string) => {
    if (!currentPeriod.value) return
    
    const newEntry: MetricDataEntry = {
      id: `temp_${Date.now()}`,
      funnelId: currentFunnelId.value!,
      nodeId,
      nodeName,
      period: currentPeriod.value,
      metrics: getDefaultMetrics(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    entries.value.push(newEntry)
    hasUnsavedChanges.value = true
  }

  const removeEntry = (entryId: string) => {
    entries.value = entries.value.filter(entry => entry.id !== entryId)
    hasUnsavedChanges.value = true
  }

  const updateEntry = (entryId: string, updates: Partial<MetricDataEntry>) => {
    const index = entries.value.findIndex(entry => entry.id === entryId)
    if (index !== -1) {
      entries.value[index] = { 
        ...entries.value[index], 
        ...updates, 
        updatedAt: new Date() 
      }
      hasUnsavedChanges.value = true
    }
  }

  const updateEntryMetrics = (entryId: string, metrics: Partial<FunnelNodeMetrics>) => {
    const index = entries.value.findIndex(entry => entry.id === entryId)
    if (index !== -1) {
      entries.value[index].metrics = {
        ...entries.value[index].metrics,
        ...metrics
      }
      entries.value[index].updatedAt = new Date()
      hasUnsavedChanges.value = true
    }
  }

  const bulkUpdateMetrics = (updates: Array<{ entryId: string; metrics: Partial<FunnelNodeMetrics> }>) => {
    updates.forEach(({ entryId, metrics }) => {
      updateEntryMetrics(entryId, metrics)
    })
  }

  // Actions - Period Management
  const setPeriod = (period: MetricsPeriod) => {
    currentPeriod.value = period
    
    // Clear existing entries when period changes
    entries.value = []
    hasUnsavedChanges.value = false
  }

  const generatePeriodOptions = (type: 'weekly' | 'monthly', count: number = 12): PeriodOption[] => {
    const options: PeriodOption[] = []
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      let startDate: Date
      let endDate: Date
      let label: string
      
      if (type === 'weekly') {
        // Calculate week boundaries
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
        weekStart.setHours(0, 0, 0, 0)
        
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        weekEnd.setHours(23, 59, 59, 999)
        
        startDate = weekStart
        endDate = weekEnd
        label = `Week ${getWeekNumber(startDate)}, ${startDate.getFullYear()}`
      } else {
        // Calculate month boundaries
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        
        startDate = monthStart
        endDate = monthEnd
        label = startDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
      }
      
      options.push({
        value: `${type}_${i}`,
        label,
        type,
        startDate,
        endDate,
        disabled: startDate > now
      })
    }
    
    return options
  }

  // Actions - Selection Management
  const selectNode = (nodeId: string) => {
    if (!selectedNodeIds.value.includes(nodeId)) {
      selectedNodeIds.value.push(nodeId)
    }
  }

  const deselectNode = (nodeId: string) => {
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  const toggleNodeSelection = (nodeId: string) => {
    if (selectedNodeIds.value.includes(nodeId)) {
      deselectNode(nodeId)
    } else {
      selectNode(nodeId)
    }
  }

  const selectAllNodes = () => {
    selectedNodeIds.value = availableNodes.value.map(node => node.id)
  }

  const clearSelection = () => {
    selectedNodeIds.value = []
  }

  // Actions - Validation
  const validateEntry = (entry: MetricDataEntry): MetricsValidationResult => {
    const errors: any[] = []
    const warnings: any[] = []
    const metrics = entry.metrics
    
    // Validate required fields based on table config
    tableConfig.value.columns.forEach(column => {
      if (column.required && column.key in metrics) {
        const value = metrics[column.key as keyof FunnelNodeMetrics]
        if (value === undefined || value === null || value === '') {
          errors.push({
            nodeId: entry.nodeId,
            field: column.key,
            value,
            rule: 'required',
            message: `${column.label} is required`
          })
        }
      }
    })
    
    // Validate logical constraints
    if (metrics.conversions && metrics.totalVisitors && metrics.conversions > metrics.totalVisitors) {
      errors.push({
        nodeId: entry.nodeId,
        field: 'conversions',
        value: metrics.conversions,
        rule: 'logical',
        message: 'Conversions cannot exceed total visitors'
      })
    }
    
    if (metrics.conversionRate && (metrics.conversionRate < 0 || metrics.conversionRate > 100)) {
      warnings.push({
        nodeId: entry.nodeId,
        field: 'conversionRate',
        value: metrics.conversionRate,
        message: 'Conversion rate should be between 0% and 100%',
        suggestion: 'Check if this value is correct'
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  const validateAllEntries = (): MetricsValidationResult => {
    const allErrors: any[] = []
    const allWarnings: any[] = []
    
    entries.value.forEach(entry => {
      const result = validateEntry(entry)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    })
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  // Actions - Table Configuration
  const updateTableConfig = (config: Partial<DynamicMetricsTableConfig>) => {
    tableConfig.value = { ...tableConfig.value, ...config }
  }

  const addColumn = (column: MetricsTableColumn) => {
    tableConfig.value.columns.push(column)
  }

  const removeColumn = (columnKey: string) => {
    tableConfig.value.columns = tableConfig.value.columns.filter(col => col.key !== columnKey)
  }

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    const columns = [...tableConfig.value.columns]
    const [moved] = columns.splice(fromIndex, 1)
    columns.splice(toIndex, 0, moved)
    tableConfig.value.columns = columns
  }

  // Actions - Filters and Search
  const setSearch = (query: string) => {
    filters.value.search = query
  }

  const setDateRange = (range: { start: Date; end: Date } | null) => {
    filters.value.dateRange = range
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      nodeTypes: [],
      dateRange: null
    }
  }

  // Actions - Utilities
  const clearStore = () => {
    entries.value = []
    currentFunnelId.value = null
    currentInstanceId.value = null
    currentPeriod.value = null
    summary.value = null
    selectedNodeIds.value = []
    hasUnsavedChanges.value = false
    error.value = null
    clearFilters()
  }

  const exportData = (format: 'csv' | 'json' = 'csv') => {
    // Implementation would depend on the export utility
    console.log('Exporting data in', format, 'format')
    return filteredEntries.value
  }

  // Helper functions
  function getDefaultColumns(): MetricsTableColumn[] {
    return [
      { key: 'nodeName', label: '漏斗节点', type: 'text', editable: false, width: '150px' },
      { key: 'totalVisitors', label: '总访问量', type: 'number', required: true, width: '120px' },
      { key: 'uniqueVisitors', label: '独立访客', type: 'number', width: '120px' },
      { key: 'conversions', label: '转化数', type: 'number', required: true, width: '100px' },
      { key: 'conversionRate', label: '转化率', type: 'percentage', width: '100px' },
      { key: 'averageTimeSpent', label: '平均停留时间', type: 'time', width: '130px' },
      { key: 'acquisitionCost', label: '获客成本', type: 'currency', width: '120px' },
      { key: 'revenue', label: '收入', type: 'currency', width: '120px' }
    ]
  }

  function getDefaultMetrics(): FunnelNodeMetrics {
    return {
      totalVisitors: 0,
      uniqueVisitors: 0,
      conversions: 0,
      conversionRate: 0,
      averageTimeSpent: 0,
      acquisitionCost: 0,
      revenue: 0
    }
  }

  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  return {
    // State
    entries,
    currentFunnelId,
    currentInstanceId,
    currentPeriod,
    summary,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    error,
    selectedNodeIds,
    tableConfig,
    filters,
    
    // Getters
    filteredEntries,
    selectedEntries,
    currentFunnel,
    currentInstance,
    isInstanceMode,
    availableNodes,
    isDataValid,
    
    // Actions - Data
    fetchMetrics,
    refreshMetrics,
    createMetrics,
    updateMetrics,
    deleteMetrics,
    
    // Actions - Instance Data
    fetchInstanceMetrics,
    createInstanceMetrics,
    setCurrentInstance,
    
    // Actions - Local State
    addEntry,
    removeEntry,
    updateEntry,
    updateEntryMetrics,
    bulkUpdateMetrics,
    
    // Actions - Period
    setPeriod,
    generatePeriodOptions,
    
    // Actions - Selection
    selectNode,
    deselectNode,
    toggleNodeSelection,
    selectAllNodes,
    clearSelection,
    
    // Actions - Validation
    validateEntry,
    validateAllEntries,
    
    // Actions - Table
    updateTableConfig,
    addColumn,
    removeColumn,
    reorderColumns,
    
    // Actions - Filters
    setSearch,
    setDateRange,
    clearFilters,
    
    // Actions - Utilities
    clearStore,
    exportData
  }
})