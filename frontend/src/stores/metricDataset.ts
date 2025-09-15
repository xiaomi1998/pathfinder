import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import {
  metricDatasetAPI,
  type MetricDataset,
  type FunnelMetricData,
  type AnalysisResult,
  type CreateFunnelMetricDatasetRequest,
  type DatasetQueryParams
} from '@/api/metricDataset';

export const useMetricDatasetStore = defineStore('metricDataset', () => {
  // State
  const datasets = ref<MetricDataset[]>([]);
  const currentDataset = ref<MetricDataset | null>(null);
  const currentAnalysis = ref<AnalysisResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Form state for data entry
  const formData = ref<CreateFunnelMetricDatasetRequest>({
    name: '',
    description: '',
    stageData: metricDatasetAPI.getDefaultFunnelData(),
    industry: 'general',
    dataSource: 'manual'
  });

  const formStep = ref(1);
  const formErrors = ref<Record<string, string[]>>({});

  // Getters
  const isLoading = computed(() => loading.value);
  const hasError = computed(() => !!error.value);
  const hasDatasets = computed(() => datasets.value.length > 0);
  const currentFormData = computed(() => formData.value);
  
  // Form validation
  const isFormValid = computed(() => {
    const validation = metricDatasetAPI.validateFunnelData(formData.value.stageData);
    return validation.isValid && formData.value.name.trim().length > 0;
  });

  const formValidationErrors = computed(() => {
    const validation = metricDatasetAPI.validateFunnelData(formData.value.stageData);
    const errors: Record<string, string[]> = {};
    
    if (!formData.value.name.trim()) {
      errors.name = ['数据集名称不能为空'];
    }
    
    if (!validation.isValid) {
      errors.stageData = validation.errors;
    }
    
    return errors;
  });

  // Actions
  const clearError = () => {
    error.value = null;
  };

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  /**
   * 获取数据集列表
   */
  const fetchDatasets = async (params?: DatasetQueryParams) => {
    try {
      setLoading(true);
      clearError();
      
      const data = await metricDatasetAPI.getDatasets(params);
      datasets.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据集列表失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取单个数据集
   */
  const fetchDataset = async (id: string) => {
    try {
      setLoading(true);
      clearError();
      
      const dataset = await metricDatasetAPI.getDatasetById(id);
      currentDataset.value = dataset;
      return dataset;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取数据集详情失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 获取分析结果
   */
  const fetchAnalysis = async (datasetId: string, includeBenchmarks = true, includeSuggestions = true) => {
    try {
      setLoading(true);
      clearError();
      
      const analysis = await metricDatasetAPI.getAnalysis(datasetId, {
        includeBenchmarks,
        includeSuggestions
      });
      currentAnalysis.value = analysis;
      return analysis;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取分析数据失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 创建数据集
   */
  const createDataset = async (data: CreateFunnelMetricDatasetRequest) => {
    try {
      setLoading(true);
      clearError();
      
      const dataset = await metricDatasetAPI.createFunnelDataset(data);
      datasets.value.unshift(dataset);
      currentDataset.value = dataset;
      
      // 重置表单
      resetForm();
      
      return dataset;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建数据集失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新数据集
   */
  const updateDataset = async (id: string, data: Partial<CreateFunnelMetricDatasetRequest>) => {
    try {
      setLoading(true);
      clearError();
      
      const updatedDataset = await metricDatasetAPI.updateDataset(id, data);
      
      // 更新列表中的数据集
      const index = datasets.value.findIndex(d => d.id === id);
      if (index !== -1) {
        datasets.value[index] = updatedDataset;
      }
      
      // 更新当前数据集
      if (currentDataset.value?.id === id) {
        currentDataset.value = updatedDataset;
      }
      
      return updatedDataset;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新数据集失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 删除数据集
   */
  const deleteDataset = async (id: string) => {
    try {
      setLoading(true);
      clearError();
      
      await metricDatasetAPI.deleteDataset(id);
      
      // 从列表中移除
      datasets.value = datasets.value.filter(d => d.id !== id);
      
      // 清空当前数据集（如果是被删除的）
      if (currentDataset.value?.id === id) {
        currentDataset.value = null;
        currentAnalysis.value = null;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除数据集失败';
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Form management
  const updateFormData = (data: Partial<CreateFunnelMetricDatasetRequest>) => {
    formData.value = { ...formData.value, ...data };
  };

  const updateStageData = (stageData: FunnelMetricData) => {
    formData.value.stageData = stageData;
  };

  const setFormStep = (step: number) => {
    formStep.value = step;
  };

  const nextFormStep = () => {
    if (formStep.value < 4) {
      formStep.value++;
    }
  };

  const prevFormStep = () => {
    if (formStep.value > 1) {
      formStep.value--;
    }
  };

  const resetForm = () => {
    formData.value = {
      name: '',
      description: '',
      stageData: metricDatasetAPI.getDefaultFunnelData(),
      industry: 'general',
      dataSource: 'manual'
    };
    formStep.value = 1;
    formErrors.value = {};
  };

  const validateForm = () => {
    const errors = formValidationErrors.value;
    formErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  // Utility functions
  const calculateConversionRate = (visitors: number, converted: number): number => {
    return metricDatasetAPI.calculateConversionRate(visitors, converted);
  };

  const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D' | 'F'): string => {
    return metricDatasetAPI.getGradeColor(grade);
  };

  const getIndustryBenchmarks = (industry: string) => {
    return metricDatasetAPI.getIndustryBenchmarks(industry);
  };

  // Clear functions
  const clearCurrentDataset = () => {
    currentDataset.value = null;
  };

  const clearCurrentAnalysis = () => {
    currentAnalysis.value = null;
  };

  const clearAll = () => {
    datasets.value = [];
    currentDataset.value = null;
    currentAnalysis.value = null;
    resetForm();
    clearError();
  };

  return {
    // State
    datasets: readonly(datasets),
    currentDataset: readonly(currentDataset),
    currentAnalysis: readonly(currentAnalysis),
    loading: readonly(loading),
    error: readonly(error),
    formData: readonly(formData),
    formStep: readonly(formStep),
    formErrors: readonly(formErrors),

    // Getters
    isLoading,
    hasError,
    hasDatasets,
    currentFormData,
    isFormValid,
    formValidationErrors,

    // Actions
    clearError,
    fetchDatasets,
    fetchDataset,
    fetchAnalysis,
    createDataset,
    updateDataset,
    deleteDataset,

    // Form management
    updateFormData,
    updateStageData,
    setFormStep,
    nextFormStep,
    prevFormStep,
    resetForm,
    validateForm,

    // Utilities
    calculateConversionRate,
    getGradeColor,
    getIndustryBenchmarks,

    // Clear functions
    clearCurrentDataset,
    clearCurrentAnalysis,
    clearAll
  };
});