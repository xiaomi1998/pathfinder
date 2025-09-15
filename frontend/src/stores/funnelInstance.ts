import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { funnelInstanceAPI } from '@/api/funnelInstance'
import type {
  FunnelInstance,
  FunnelInstanceListItem,
  CreateFunnelInstanceRequest,
  UpdateFunnelInstanceRequest,
  FunnelInstanceFilters,
  FunnelInstanceSort,
  FunnelInstanceContext,
  FunnelWithInstances,
  InstanceSelectionOption
} from '@/types/funnelInstance'

export const useFunnelInstanceStore = defineStore('funnelInstance', () => {
  // State
  const instances = ref<FunnelInstanceListItem[]>([])
  const currentInstance = ref<FunnelInstance | null>(null)
  const currentInstanceId = ref<string | null>(null)
  
  // UI State
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  
  // Filter and sort state
  const filters = ref<FunnelInstanceFilters>({})
  const sort = ref<FunnelInstanceSort>({
    field: 'updatedAt',
    order: 'desc'
  })
  
  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalInstances = ref(0)
  const hasMoreInstances = ref(false)

  // Getters
  const filteredInstances = computed(() => {
    return instances.value.filter(instance => {
      // Apply local filters if needed
      if (filters.value.search) {
        const query = filters.value.search.toLowerCase()
        return instance.name.toLowerCase().includes(query) ||
               instance.description?.toLowerCase().includes(query) ||
               instance.funnel.name.toLowerCase().includes(query)
      }
      return true
    })
  })

  const activeInstances = computed(() => 
    instances.value.filter(instance => instance.status === 'active')
  )

  const draftInstances = computed(() => 
    instances.value.filter(instance => instance.status === 'draft')
  )

  const completedInstances = computed(() => 
    instances.value.filter(instance => instance.status === 'completed')
  )

  const instancesByFunnel = computed(() => {
    const grouped: Record<string, FunnelInstanceListItem[]> = {}
    instances.value.forEach(instance => {
      const funnelId = instance.funnelId
      if (!grouped[funnelId]) {
        grouped[funnelId] = []
      }
      grouped[funnelId].push(instance)
    })
    return grouped
  })

  const canCreateInstance = computed(() => {
    // Add business logic for instance creation permissions
    return true
  })

  // Actions - Data Fetching
  const fetchInstances = async (options: {
    funnelId?: string
    forceRefresh?: boolean
    appendToList?: boolean
  } = {}) => {
    if (isLoading.value && !options.forceRefresh) return

    try {
      isLoading.value = true
      error.value = null

      const params = {
        ...filters.value,
        funnelId: options.funnelId,
        limit: pageSize.value,
        offset: options.appendToList ? instances.value.length : 0,
        sortBy: sort.value.field,
        sortOrder: sort.value.order
      }

      const response = await funnelInstanceAPI.getInstances(params)

      if (response.success) {
        const data = response.data
        
        // Transform instances to include funnel object
        const transformedInstances = data.map(instance => ({
          ...instance,
          funnel: {
            name: instance.funnelTemplate?.name || 'Unknown Funnel',
            nodeCount: 0
          }
        }))
        
        if (options.appendToList) {
          instances.value = [...instances.value, ...transformedInstances]
        } else {
          instances.value = transformedInstances
        }
        
        totalInstances.value = transformedInstances.length
        hasMoreInstances.value = false
        currentPage.value = options.appendToList ? currentPage.value + 1 : 1
      }
    } catch (err: any) {
      console.error('Error fetching instances:', err)
      error.value = err.response?.data?.message || 'Failed to fetch instances'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchInstanceById = async (instanceId: string) => {
    try {
      isLoading.value = true
      error.value = null

      const response = await funnelInstanceAPI.getInstanceById(instanceId)

      if (response.data.success) {
        currentInstance.value = response.data.data
        currentInstanceId.value = instanceId
        
        // Update in list if exists
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          // Convert full instance to list item format
          const listItem: FunnelInstanceListItem = {
            id: currentInstance.value!.id,
            funnelId: currentInstance.value!.funnelId,
            name: currentInstance.value!.name,
            description: currentInstance.value!.description,
            status: currentInstance.value!.status,
            periodType: currentInstance.value!.periodType,
            startDate: currentInstance.value!.startDate,
            endDate: currentInstance.value!.endDate,
            createdAt: currentInstance.value!.createdAt,
            updatedAt: currentInstance.value!.updatedAt,
            funnel: currentInstance.value!.funnel || { name: '', nodeCount: 0 },
            metricsCount: currentInstance.value!.metricsCount || 0,
            totalEntries: currentInstance.value!.totalEntries,
            overallConversionRate: currentInstance.value!.overallConversionRate,
            lastDataUpdate: currentInstance.value!.lastDataUpdate,
            hasUnsavedChanges: false
          }
          instances.value[index] = listItem
        }

        return currentInstance.value
      }
    } catch (err: any) {
      console.error('Error fetching instance:', err)
      error.value = err.response?.data?.message || 'Failed to fetch instance'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchFunnelWithInstances = async (funnelId: string): Promise<FunnelWithInstances | null> => {
    try {
      isLoading.value = true
      error.value = null

      const result = await funnelInstanceAPI.getFunnelWithInstances(funnelId)
      return result
    } catch (err: any) {
      console.error('Error fetching funnel with instances:', err)
      error.value = err.response?.data?.message || 'Failed to fetch funnel data'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Actions - CRUD Operations
  const createInstance = async (data: CreateFunnelInstanceRequest) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await funnelInstanceAPI.createInstance(data)

      if (response.data.success) {
        const newInstance = response.data.data
        
        // Convert to list item and add to beginning of list
        const listItem: FunnelInstanceListItem = {
          id: newInstance.id,
          funnelId: newInstance.funnelId,
          name: newInstance.name,
          description: newInstance.description,
          status: newInstance.status,
          periodType: newInstance.periodType,
          startDate: newInstance.startDate,
          endDate: newInstance.endDate,
          createdAt: newInstance.createdAt,
          updatedAt: newInstance.updatedAt,
          funnel: newInstance.funnel || { name: '', nodeCount: 0 },
          metricsCount: newInstance.metricsCount || 0,
          totalEntries: newInstance.totalEntries,
          overallConversionRate: newInstance.overallConversionRate,
          lastDataUpdate: newInstance.lastDataUpdate,
          hasUnsavedChanges: false
        }
        
        instances.value.unshift(listItem)
        currentInstance.value = newInstance
        currentInstanceId.value = newInstance.id
        totalInstances.value += 1

        return newInstance
      }
    } catch (err: any) {
      console.error('Error creating instance:', err)
      error.value = err.response?.data?.message || 'Failed to create instance'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const updateInstance = async (instanceId: string, data: UpdateFunnelInstanceRequest) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await funnelInstanceAPI.updateInstance(instanceId, data)

      if (response.data.success) {
        const updatedInstance = response.data.data

        // Update current instance if it's the one being edited
        if (currentInstanceId.value === instanceId) {
          currentInstance.value = updatedInstance
        }

        // Update in list
        const index = instances.value.findIndex(i => i.id === instanceId)
        if (index !== -1) {
          const listItem: FunnelInstanceListItem = {
            id: updatedInstance.id,
            funnelId: updatedInstance.funnelId,
            name: updatedInstance.name,
            description: updatedInstance.description,
            status: updatedInstance.status,
            periodType: updatedInstance.periodType,
            startDate: updatedInstance.startDate,
            endDate: updatedInstance.endDate,
            createdAt: updatedInstance.createdAt,
            updatedAt: updatedInstance.updatedAt,
            funnel: updatedInstance.funnel || { name: '', nodeCount: 0 },
            metricsCount: updatedInstance.metricsCount || 0,
            totalEntries: updatedInstance.totalEntries,
            overallConversionRate: updatedInstance.overallConversionRate,
            lastDataUpdate: updatedInstance.lastDataUpdate,
            hasUnsavedChanges: false
          }
          instances.value[index] = listItem
        }

        return updatedInstance
      }
    } catch (err: any) {
      console.error('Error updating instance:', err)
      error.value = err.response?.data?.message || 'Failed to update instance'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const deleteInstance = async (instanceId: string) => {
    try {
      const response = await funnelInstanceAPI.deleteInstance(instanceId)

      if (response.data.success) {
        // Remove from list
        instances.value = instances.value.filter(i => i.id !== instanceId)
        totalInstances.value = Math.max(0, totalInstances.value - 1)

        // Clear current instance if it was deleted
        if (currentInstanceId.value === instanceId) {
          currentInstance.value = null
          currentInstanceId.value = null
        }

        return true
      }
      return false
    } catch (err: any) {
      console.error('Error deleting instance:', err)
      error.value = err.response?.data?.message || 'Failed to delete instance'
      throw err
    }
  }

  const duplicateInstance = async (instanceId: string, newName: string) => {
    try {
      isSaving.value = true
      error.value = null

      const response = await funnelInstanceAPI.duplicateInstance(instanceId, newName)

      if (response.data.success) {
        const duplicatedInstance = response.data.data

        // Add to beginning of list
        const listItem: FunnelInstanceListItem = {
          id: duplicatedInstance.id,
          funnelId: duplicatedInstance.funnelId,
          name: duplicatedInstance.name,
          description: duplicatedInstance.description,
          status: duplicatedInstance.status,
          periodType: duplicatedInstance.periodType,
          startDate: duplicatedInstance.startDate,
          endDate: duplicatedInstance.endDate,
          createdAt: duplicatedInstance.createdAt,
          updatedAt: duplicatedInstance.updatedAt,
          funnel: duplicatedInstance.funnel || { name: '', nodeCount: 0 },
          metricsCount: 0,
          hasUnsavedChanges: false
        }
        
        instances.value.unshift(listItem)
        totalInstances.value += 1

        return duplicatedInstance
      }
    } catch (err: any) {
      console.error('Error duplicating instance:', err)
      error.value = err.response?.data?.message || 'Failed to duplicate instance'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  // Actions - Instance Management
  const setCurrentInstance = (instanceId: string | null) => {
    currentInstanceId.value = instanceId
    if (instanceId) {
      const instance = instances.value.find(i => i.id === instanceId)
      if (instance) {
        // Convert list item to full instance if needed
        currentInstance.value = instance as unknown as FunnelInstance
      }
    } else {
      currentInstance.value = null
    }
  }

  const createQuickInstance = async (funnelId: string, instanceName: string, periodType: 'weekly' | 'monthly') => {
    try {
      const response = await funnelInstanceAPI.createQuickInstance(funnelId, instanceName, periodType)
      if (response.data.success) {
        const newInstance = response.data.data
        
        // Add to list and set as current
        const listItem: FunnelInstanceListItem = {
          id: newInstance.id,
          funnelId: newInstance.funnelId,
          name: newInstance.name,
          description: newInstance.description,
          status: newInstance.status,
          periodType: newInstance.periodType,
          startDate: newInstance.startDate,
          endDate: newInstance.endDate,
          createdAt: newInstance.createdAt,
          updatedAt: newInstance.updatedAt,
          funnel: newInstance.funnel || { name: '', nodeCount: 0 },
          metricsCount: 0,
          hasUnsavedChanges: false
        }
        
        instances.value.unshift(listItem)
        totalInstances.value += 1
        
        currentInstance.value = newInstance
        currentInstanceId.value = newInstance.id

        return newInstance
      }
    } catch (err: any) {
      console.error('Error creating quick instance:', err)
      error.value = err.response?.data?.message || 'Failed to create quick instance'
      throw err
    }
  }

  const getInstanceSelectionOptions = (funnelId?: string): InstanceSelectionOption[] => {
    const options: InstanceSelectionOption[] = []
    
    // Filter instances by funnel if specified
    const relevantInstances = funnelId 
      ? instances.value.filter(i => i.funnelId === funnelId)
      : instances.value

    // Group by status
    const activeInstances = relevantInstances.filter(i => i.status === 'active')
    const draftInstances = relevantInstances.filter(i => i.status === 'draft')

    // Add "Create New" option first
    options.push({
      type: 'new',
      label: '创建新实例',
      description: '创建一个新的数据录入实例',
      recommended: relevantInstances.length === 0
    })

    // Add active instances
    activeInstances.forEach(instance => {
      options.push({
        type: 'existing',
        instance,
        label: instance.name,
        description: `${instance.funnel.name} - ${getStatusLabel(instance.status)}`,
        disabled: false
      })
    })

    // Add draft instances
    draftInstances.forEach(instance => {
      options.push({
        type: 'existing',
        instance,
        label: instance.name,
        description: `${instance.funnel.name} - ${getStatusLabel(instance.status)}`,
        disabled: false
      })
    })

    return options
  }

  // Actions - Filtering and Sorting
  const setFilters = (newFilters: Partial<FunnelInstanceFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setSort = (newSort: Partial<FunnelInstanceSort>) => {
    sort.value = { ...sort.value, ...newSort }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  // Actions - Pagination
  const loadMore = async () => {
    if (!hasMoreInstances.value || isLoading.value) return
    await fetchInstances({ appendToList: true })
  }

  // Actions - Utilities
  const clearError = () => {
    error.value = null
  }

  const clearStore = () => {
    instances.value = []
    currentInstance.value = null
    currentInstanceId.value = null
    error.value = null
    filters.value = {}
    currentPage.value = 1
    totalInstances.value = 0
    hasMoreInstances.value = false
  }

  // Helper functions
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'draft': '草稿',
      'active': '活动中',
      'in_progress': '进行中',
      'completed': '已完成',
      'paused': '已暂停',
      'archived': '已归档'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'draft': 'text-gray-600 bg-gray-100',
      'active': 'text-green-600 bg-green-100',
      'in_progress': 'text-blue-600 bg-blue-100',
      'completed': 'text-purple-600 bg-purple-100',
      'paused': 'text-yellow-600 bg-yellow-100',
      'archived': 'text-gray-600 bg-gray-100'
    }
    return colors[status] || 'text-gray-600 bg-gray-100'
  }

  return {
    // State
    instances,
    currentInstance,
    currentInstanceId,
    isLoading,
    isSaving,
    error,
    filters,
    sort,
    currentPage,
    pageSize,
    totalInstances,
    hasMoreInstances,

    // Getters
    filteredInstances,
    activeInstances,
    draftInstances,
    completedInstances,
    instancesByFunnel,
    canCreateInstance,

    // Actions - Fetching
    fetchInstances,
    fetchInstanceById,
    fetchFunnelWithInstances,

    // Actions - CRUD
    createInstance,
    updateInstance,
    deleteInstance,
    duplicateInstance,

    // Actions - Management
    setCurrentInstance,
    createQuickInstance,
    getInstanceSelectionOptions,

    // Actions - Filtering
    setFilters,
    setSort,
    clearFilters,

    // Actions - Pagination
    loadMore,

    // Actions - Utilities
    clearError,
    clearStore,
    getStatusLabel,
    getStatusColor
  }
})