import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { organizationAPI } from '@/api/organization'
import { useAppStore } from '@/stores/app'
import type { OrganizationInfo } from '@/types'

export const useOrganizationStore = defineStore('organization', () => {
  // State
  const organizationData = ref<OrganizationInfo>({
    name: '',
    industry: '',
    size: '',
    description: '',
    location: '',
    salesModel: ''
  })
  const loading = ref(false)
  const appStore = useAppStore()

  // Getters
  const isLoading = computed(() => loading.value)
  const organizationName = computed(() => organizationData.value.name)
  const hasOrganization = computed(() => !!organizationData.value.name)

  // Actions
  const loadOrganizationInfo = async () => {
    try {
      loading.value = true
      const response = await organizationAPI.getInfo()
      console.log('OrganizationStore loadOrganizationInfo response:', response)
      if (response?.data?.success && response.data.data) {
        organizationData.value = response.data.data
      }
    } catch (error) {
      console.error('Failed to load organization info:', error)
      // Don't show error to user as this might be first time setup
    } finally {
      loading.value = false
    }
  }

  const updateOrganizationInfo = async (data: OrganizationInfo) => {
    try {
      loading.value = true
      const response = await organizationAPI.updateInfo(data)
      console.log('OrganizationStore updateOrganizationInfo response:', response)
      if (response?.data?.success) {
        organizationData.value = data
        appStore.showSuccess('保存成功', '组织信息已更新')
      }
      return true
    } catch (error: any) {
      console.error('Organization info save failed:', error)
      appStore.showError('保存失败', error.message || '保存组织信息时出现错误')
      return false
    } finally {
      loading.value = false
    }
  }

  const resetOrganizationData = () => {
    organizationData.value = {
      name: '',
      industry: '',
      size: '',
      description: '',
      location: '',
      salesModel: ''
    }
  }

  return {
    // State
    organizationData,
    loading,

    // Getters
    isLoading,
    organizationName,
    hasOrganization,

    // Actions
    loadOrganizationInfo,
    updateOrganizationInfo,
    resetOrganizationData
  }
})