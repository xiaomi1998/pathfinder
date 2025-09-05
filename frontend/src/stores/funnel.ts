import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { funnelAPI } from '@api/funnel'
import type { Funnel, FunnelNode, FunnelEdge, CreateFunnelRequest, UpdateFunnelRequest } from '@/types/funnel'

export const useFunnelStore = defineStore('funnel', () => {
  // State
  const funnels = ref<Funnel[]>([])
  const currentFunnel = ref<Funnel | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const searchQuery = ref('')
  const sortBy = ref<'name' | 'created_at' | 'updated_at'>('updated_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // Builder state
  const nodes = ref<FunnelNode[]>([])
  const edges = ref<FunnelEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const selectedEdgeId = ref<string | null>(null)
  const builderMode = ref<'design' | 'preview'>('design')

  // Getters
  const filteredFunnels = computed(() => {
    let filtered = [...funnels.value]
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(funnel => 
        funnel.name.toLowerCase().includes(query) ||
        funnel.description?.toLowerCase().includes(query)
      )
    }
    
    // Sort funnels
    filtered.sort((a, b) => {
      const aVal = a[sortBy.value]
      const bVal = b[sortBy.value]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder.value === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder.value === 'asc' 
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime()
      }
      
      return 0
    })
    
    return filtered
  })

  const selectedNode = computed(() => 
    selectedNodeId.value ? nodes.value.find(n => n.id === selectedNodeId.value) : null
  )

  const selectedEdge = computed(() => 
    selectedEdgeId.value ? edges.value.find(e => e.id === selectedEdgeId.value) : null
  )

  const hasUnsavedChanges = computed(() => {
    // Compare current nodes/edges with saved funnel
    if (!currentFunnel.value) return nodes.value.length > 0 || edges.value.length > 0
    
    return JSON.stringify(nodes.value) !== JSON.stringify(currentFunnel.value.nodes) ||
           JSON.stringify(edges.value) !== JSON.stringify(currentFunnel.value.edges)
  })

  // Actions
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  const setSorting = (by: typeof sortBy.value, order: typeof sortOrder.value) => {
    sortBy.value = by
    sortOrder.value = order
  }

  const fetchFunnels = async () => {
    try {
      isLoading.value = true
      const response = await funnelAPI.getFunnels()
      
      if (response.data.success) {
        // 后端返回的数据结构是 {success: true, data: {funnels: [...], pagination: {...}}}
        funnels.value = response.data.data.funnels || []
        console.log('Fetched funnels:', funnels.value.length)
      }
    } catch (error) {
      console.error('Error fetching funnels:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchFunnelById = async (id: string) => {
    try {
      isLoading.value = true
      const response = await funnelAPI.getFunnelById(id)
      
      if (response.data.success) {
        const funnelData = response.data.data
        currentFunnel.value = funnelData
        // 从canvasData中提取nodes和edges，如果没有则使用空数组
        nodes.value = [...(funnelData.nodes || funnelData.canvasData?.nodes || [])]
        edges.value = [...(funnelData.edges || funnelData.canvasData?.edges || [])]
        console.log('Fetched funnel:', funnelData.name, 'with', nodes.value.length, 'nodes')
        return funnelData
      }
    } catch (error) {
      console.error('Error fetching funnel:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createFunnel = async (funnelData: CreateFunnelRequest) => {
    try {
      isSaving.value = true
      const response = await funnelAPI.createFunnel(funnelData)
      
      if (response.data.success) {
        const newFunnel = response.data.data
        funnels.value.unshift(newFunnel)
        currentFunnel.value = newFunnel
        return newFunnel
      }
    } catch (error) {
      console.error('Error creating funnel:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const updateFunnel = async (id: string, funnelData: UpdateFunnelRequest) => {
    try {
      isSaving.value = true
      const response = await funnelAPI.updateFunnel(id, funnelData)
      
      if (response.data.success) {
        const updatedFunnel = response.data.data
        
        // Update in list
        const index = funnels.value.findIndex(f => f.id === id)
        if (index !== -1) {
          funnels.value[index] = updatedFunnel
        }
        
        // Update current funnel
        if (currentFunnel.value?.id === id) {
          currentFunnel.value = updatedFunnel
        }
        
        return updatedFunnel
      }
    } catch (error) {
      console.error('Error updating funnel:', error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  const deleteFunnel = async (id: string) => {
    try {
      const response = await funnelAPI.deleteFunnel(id)
      
      if (response.data.success) {
        funnels.value = funnels.value.filter(f => f.id !== id)
        
        if (currentFunnel.value?.id === id) {
          currentFunnel.value = null
          clearBuilder()
        }
      }
    } catch (error) {
      console.error('Error deleting funnel:', error)
      throw error
    }
  }

  const duplicateFunnel = async (id: string, newName: string) => {
    try {
      const response = await funnelAPI.duplicateFunnel(id, newName)
      
      if (response.data.success) {
        const duplicatedFunnel = response.data.data
        funnels.value.unshift(duplicatedFunnel)
        return duplicatedFunnel
      }
    } catch (error) {
      console.error('Error duplicating funnel:', error)
      throw error
    }
  }

  // Builder actions
  const addNode = (node: Omit<FunnelNode, 'id'>) => {
    const newNode: FunnelNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...node
    }
    nodes.value.push(newNode)
    return newNode
  }

  const updateNode = (id: string, updates: Partial<FunnelNode>) => {
    const index = nodes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      nodes.value[index] = { ...nodes.value[index], ...updates }
    }
  }

  const deleteNode = (id: string) => {
    nodes.value = nodes.value.filter(n => n.id !== id)
    // Also remove connected edges
    edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    
    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
  }

  const addEdge = (edge: Omit<FunnelEdge, 'id'>) => {
    const newEdge: FunnelEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...edge
    }
    edges.value.push(newEdge)
    return newEdge
  }

  const updateEdge = (id: string, updates: Partial<FunnelEdge>) => {
    const index = edges.value.findIndex(e => e.id === id)
    if (index !== -1) {
      edges.value[index] = { ...edges.value[index], ...updates }
    }
  }

  const deleteEdge = (id: string) => {
    edges.value = edges.value.filter(e => e.id !== id)
    
    if (selectedEdgeId.value === id) {
      selectedEdgeId.value = null
    }
  }

  const selectNode = (id: string | null) => {
    selectedNodeId.value = id
    selectedEdgeId.value = null
  }

  const selectEdge = (id: string | null) => {
    selectedEdgeId.value = id
    selectedNodeId.value = null
  }

  const clearSelection = () => {
    selectedNodeId.value = null
    selectedEdgeId.value = null
  }

  const setBuilderMode = (mode: typeof builderMode.value) => {
    builderMode.value = mode
  }

  const clearBuilder = () => {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    selectedEdgeId.value = null
    builderMode.value = 'design'
  }

  const loadFunnelIntoBuilder = (funnel: Funnel) => {
    currentFunnel.value = funnel
    nodes.value = [...funnel.nodes]
    edges.value = [...funnel.edges]
    clearSelection()
  }

  const saveFunnelFromBuilder = async () => {
    if (!currentFunnel.value) return null
    
    const updateData: UpdateFunnelRequest = {
      name: currentFunnel.value.name,
      description: currentFunnel.value.description,
      nodes: nodes.value,
      edges: edges.value
    }
    
    return await updateFunnel(currentFunnel.value.id, updateData)
  }

  return {
    // State
    funnels,
    currentFunnel,
    isLoading,
    isSaving,
    searchQuery,
    sortBy,
    sortOrder,
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    builderMode,
    
    // Getters
    filteredFunnels,
    selectedNode,
    selectedEdge,
    hasUnsavedChanges,
    
    // Actions
    setSearchQuery,
    setSorting,
    fetchFunnels,
    fetchFunnelById,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    duplicateFunnel,
    
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
    clearBuilder,
    loadFunnelIntoBuilder,
    saveFunnelFromBuilder
  }
})