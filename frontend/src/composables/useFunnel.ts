import { computed, ref, watch } from 'vue'
import { useFunnelStore } from '@stores/funnel'
import { useAppStore } from '@stores/app'
import type { Funnel, FunnelNode, FunnelEdge, CreateFunnelRequest, UpdateFunnelRequest } from '@/types/funnel'

export function useFunnel() {
  const funnelStore = useFunnelStore()
  const appStore = useAppStore()
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const funnels = computed(() => funnelStore.filteredFunnels)
  const currentFunnel = computed(() => funnelStore.currentFunnel)
  const nodes = computed(() => funnelStore.nodes)
  const edges = computed(() => funnelStore.edges)
  const selectedNode = computed(() => funnelStore.selectedNode)
  const selectedEdge = computed(() => funnelStore.selectedEdge)
  const hasUnsavedChanges = computed(() => funnelStore.hasUnsavedChanges)
  const builderMode = computed(() => funnelStore.builderMode)

  // Actions
  const fetchFunnels = async () => {
    try {
      isLoading.value = true
      error.value = null
      await funnelStore.fetchFunnels()
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch funnels'
      appStore.showError('Error', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const fetchFunnelById = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      const funnel = await funnelStore.fetchFunnelById(id)
      return funnel
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createFunnel = async (funnelData: CreateFunnelRequest) => {
    try {
      isLoading.value = true
      error.value = null
      const funnel = await funnelStore.createFunnel(funnelData)
      appStore.showSuccess('Success', 'Funnel created successfully')
      return funnel
    } catch (err: any) {
      error.value = err.message || 'Failed to create funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateFunnel = async (id: string, funnelData: UpdateFunnelRequest) => {
    try {
      isLoading.value = true
      error.value = null
      const funnel = await funnelStore.updateFunnel(id, funnelData)
      appStore.showSuccess('Success', 'Funnel updated successfully')
      return funnel
    } catch (err: any) {
      error.value = err.message || 'Failed to update funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteFunnel = async (id: string) => {
    try {
      isLoading.value = true
      error.value = null
      await funnelStore.deleteFunnel(id)
      appStore.showSuccess('Success', 'Funnel deleted successfully')
    } catch (err: any) {
      error.value = err.message || 'Failed to delete funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const duplicateFunnel = async (id: string, newName: string) => {
    try {
      isLoading.value = true
      error.value = null
      const funnel = await funnelStore.duplicateFunnel(id, newName)
      appStore.showSuccess('Success', 'Funnel duplicated successfully')
      return funnel
    } catch (err: any) {
      error.value = err.message || 'Failed to duplicate funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const saveFunnelFromBuilder = async () => {
    try {
      isLoading.value = true
      error.value = null
      const funnel = await funnelStore.saveFunnelFromBuilder()
      appStore.showSuccess('Success', 'Funnel saved successfully')
      return funnel
    } catch (err: any) {
      error.value = err.message || 'Failed to save funnel'
      appStore.showError('Error', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Builder actions
  const addNode = (node: Omit<FunnelNode, 'id'>) => {
    const newNode = funnelStore.addNode(node)
    appStore.showSuccess('Node added', 'Node has been added to the funnel')
    return newNode
  }

  const updateNode = (id: string, updates: Partial<FunnelNode>) => {
    funnelStore.updateNode(id, updates)
  }

  const deleteNode = (id: string) => {
    funnelStore.deleteNode(id)
    appStore.showSuccess('Node deleted', 'Node has been removed from the funnel')
  }

  const addEdge = (edge: Omit<FunnelEdge, 'id'>) => {
    const newEdge = funnelStore.addEdge(edge)
    appStore.showSuccess('Connection added', 'Connection has been added to the funnel')
    return newEdge
  }

  const updateEdge = (id: string, updates: Partial<FunnelEdge>) => {
    funnelStore.updateEdge(id, updates)
  }

  const deleteEdge = (id: string) => {
    funnelStore.deleteEdge(id)
    appStore.showSuccess('Connection deleted', 'Connection has been removed from the funnel')
  }

  const selectNode = (id: string | null) => {
    funnelStore.selectNode(id)
  }

  const selectEdge = (id: string | null) => {
    funnelStore.selectEdge(id)
  }

  const clearSelection = () => {
    funnelStore.clearSelection()
  }

  const setBuilderMode = (mode: 'design' | 'preview') => {
    funnelStore.setBuilderMode(mode)
  }

  const loadFunnelIntoBuilder = (funnel: Funnel) => {
    funnelStore.loadFunnelIntoBuilder(funnel)
  }

  const clearBuilder = () => {
    funnelStore.clearBuilder()
  }

  // Search and filtering
  const setSearchQuery = (query: string) => {
    funnelStore.setSearchQuery(query)
  }

  const setSorting = (field: 'name' | 'created_at' | 'updated_at', order: 'asc' | 'desc') => {
    funnelStore.setSorting(field, order)
  }

  // Validation
  const validateFunnelStructure = () => {
    const errors: string[] = []
    
    // Check for at least one start node
    const startNodes = nodes.value.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      errors.push('Funnel must have at least one start node')
    }
    
    // Check for at least one end node
    const endNodes = nodes.value.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      errors.push('Funnel must have at least one end node')
    }
    
    // Check for orphaned nodes
    const connectedNodeIds = new Set([
      ...edges.value.map(edge => edge.source),
      ...edges.value.map(edge => edge.target)
    ])
    
    const orphanedNodes = nodes.value.filter(node => 
      !connectedNodeIds.has(node.id) && node.type !== 'start' && node.type !== 'end'
    )
    
    if (orphanedNodes.length > 0) {
      errors.push(`${orphanedNodes.length} disconnected node(s) found`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Auto-save functionality
  let autoSaveTimer: NodeJS.Timeout | null = null
  
  const startAutoSave = (interval: number = 30000) => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }
    
    autoSaveTimer = setInterval(async () => {
      if (hasUnsavedChanges.value && currentFunnel.value) {
        try {
          await saveFunnelFromBuilder()
        } catch (err) {
          console.error('Auto-save failed:', err)
        }
      }
    }, interval)
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // Cleanup
  const clearError = () => {
    error.value = null
  }

  // Watch for changes and enable auto-save
  watch(hasUnsavedChanges, (hasChanges) => {
    if (hasChanges && currentFunnel.value) {
      startAutoSave()
    } else {
      stopAutoSave()
    }
  })

  return {
    // State
    isLoading,
    error,
    
    // Computed
    funnels,
    currentFunnel,
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    hasUnsavedChanges,
    builderMode,
    
    // Actions
    fetchFunnels,
    fetchFunnelById,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    duplicateFunnel,
    saveFunnelFromBuilder,
    
    // Builder actions
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    selectNode,
    selectEdge,
    clearSelection,
    setBuilderMode,
    loadFunnelIntoBuilder,
    clearBuilder,
    
    // Utility functions
    setSearchQuery,
    setSorting,
    validateFunnelStructure,
    startAutoSave,
    stopAutoSave,
    clearError
  }
}