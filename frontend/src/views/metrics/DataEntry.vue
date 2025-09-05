<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex items-center justify-between h-16">
          <!-- Breadcrumb -->
          <div class="flex items-center">
            <router-link to="/dashboard" class="text-gray-500 hover:text-gray-700">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L9 5.414V17a1 1 0 102 0V5.414l5.293 5.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </router-link>
            <span class="mx-2 text-gray-500">/</span>
            <span class="text-sm font-medium text-gray-900">数据录入</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-4">
            <button
              @click="$router.go(-1)"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              返回
            </button>
          </div>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- Progress Steps -->
      <div class="mb-8">
        <nav aria-label="Progress">
          <ol role="list" class="flex items-center">
            <li v-for="(step, stepIdx) in steps" :key="step.name" :class="stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''" class="relative">
              <template v-if="step.status === 'complete'">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                  <div class="h-0.5 w-full bg-indigo-600"></div>
                </div>
                <a href="#" @click.prevent="setStep(stepIdx + 1)" class="relative w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full hover:bg-indigo-900">
                  <svg class="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </a>
              </template>
              <template v-else-if="step.status === 'current'">
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                  <div class="h-0.5 w-full bg-gray-200"></div>
                </div>
                <a href="#" class="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-indigo-600 rounded-full">
                  <span class="h-2.5 w-2.5 bg-indigo-600 rounded-full"></span>
                </a>
              </template>
              <template v-else>
                <div class="absolute inset-0 flex items-center" aria-hidden="true">
                  <div class="h-0.5 w-full bg-gray-200"></div>
                </div>
                <a href="#" class="group relative w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:border-gray-400">
                  <span class="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300"></span>
                </a>
              </template>
              <span class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-500">
                {{ step.name }}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <!-- Step Content -->
      <div class="bg-white shadow rounded-lg">
        <!-- Step 1: 基本信息 -->
        <div v-if="currentStep === 1" class="p-6">
          <div class="space-y-6">
            <div>
              <h2 class="text-lg font-medium text-gray-900">基本信息</h2>
              <p class="mt-1 text-sm text-gray-600">请填写数据集的基本信息</p>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <!-- 数据集名称 -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  数据集名称 <span class="text-red-500">*</span>
                </label>
                <div class="mt-1">
                  <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    required
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="请输入数据集名称"
                  />
                </div>
                <p v-if="errors.name" class="mt-2 text-sm text-red-600">{{ errors.name }}</p>
              </div>

              <!-- 描述 -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">
                  描述
                </label>
                <div class="mt-1">
                  <textarea
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="请简要描述这个数据集的用途或来源"
                  />
                </div>
              </div>

              <!-- 行业类型 -->
              <div>
                <label for="industry" class="block text-sm font-medium text-gray-700">
                  行业类型
                </label>
                <div class="mt-1">
                  <select
                    id="industry"
                    v-model="formData.industry"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="general">通用行业</option>
                    <option value="technology">科技行业</option>
                    <option value="finance">金融行业</option>
                    <option value="education">教育行业</option>
                    <option value="healthcare">医疗行业</option>
                    <option value="ecommerce">电商行业</option>
                    <option value="manufacturing">制造业</option>
                    <option value="services">服务业</option>
                  </select>
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  选择合适的行业类型将帮助系统提供更准确的基准对比数据
                </p>
              </div>

              <!-- 数据来源 -->
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  数据来源
                </label>
                <div class="mt-2 space-y-2">
                  <div class="flex items-center">
                    <input
                      id="manual"
                      v-model="formData.dataSource"
                      value="manual"
                      type="radio"
                      class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label for="manual" class="ml-3 block text-sm font-medium text-gray-700">
                      手工录入
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      id="import"
                      v-model="formData.dataSource"
                      value="import"
                      type="radio"
                      class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label for="import" class="ml-3 block text-sm font-medium text-gray-700">
                      文件导入
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      id="api"
                      v-model="formData.dataSource"
                      value="api"
                      type="radio"
                      class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                    />
                    <label for="api" class="ml-3 block text-sm font-medium text-gray-700">
                      API接口
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: 阶段配置 -->
        <div v-if="currentStep === 2" class="p-6">
          <div class="space-y-6">
            <div>
              <h2 class="text-lg font-medium text-gray-900">漏斗阶段配置</h2>
              <p class="mt-1 text-sm text-gray-600">确认或自定义漏斗各阶段的名称</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="(stageName, index) in stageNames" :key="index" class="space-y-2">
                <label :for="`stage-${index}`" class="block text-sm font-medium text-gray-700">
                  阶段 {{ index + 1 }}
                </label>
                <input
                  :id="`stage-${index}`"
                  v-model="stageNames[index]"
                  type="text"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-blue-800">
                    漏斗阶段说明
                  </h3>
                  <div class="mt-2 text-sm text-blue-700">
                    <p>请按照业务流程的顺序配置各个阶段名称。系统将根据这些阶段名称来展示分析结果。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: 数据录入 -->
        <div v-if="currentStep === 3">
          <DataEntryForm
            v-model="formData"
            @validate="handleFormValidation"
          />
        </div>

        <!-- Step 4: 预览确认 -->
        <div v-if="currentStep === 4" class="p-6">
          <div class="space-y-6">
            <div>
              <h2 class="text-lg font-medium text-gray-900">预览确认</h2>
              <p class="mt-1 text-sm text-gray-600">请检查录入的数据是否正确</p>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Info Card -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-3">基本信息</h3>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">数据集名称</dt>
                    <dd class="text-sm text-gray-900">{{ formData.name }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">行业类型</dt>
                    <dd class="text-sm text-gray-900">{{ getIndustryName(formData.industry) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">数据来源</dt>
                    <dd class="text-sm text-gray-900">{{ getDataSourceName(formData.dataSource) }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Statistics Card -->
              <div class="bg-white border border-gray-200 rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-3">核心指标</h3>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">总体转化率</dt>
                    <dd class="text-sm font-medium text-indigo-600">{{ overallConversionRate }}%</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">初始访问量</dt>
                    <dd class="text-sm text-gray-900">{{ formData.stageData.stage_1.visitors }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm font-medium text-gray-500">最终转化数</dt>
                    <dd class="text-sm font-medium text-green-600">{{ formData.stageData.stage_4.converted }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Detailed Stage Data -->
            <div class="bg-white border border-gray-200 rounded-lg">
              <div class="px-4 py-3 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">阶段详情</h3>
              </div>
              <div class="p-4">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          阶段
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          访问者数
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          转化数
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          转化率
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="(stage, index) in stageDataArray" :key="index">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ stageNames[index] }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ stage.visitors }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ stage.converted }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ getConversionRate(stage.visitors, stage.converted) }}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step Navigation -->
        <div class="bg-gray-50 px-6 py-3 flex justify-between">
          <div>
            <button
              v-if="currentStep > 1"
              @click="prevStep"
              type="button"
              class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              上一步
            </button>
          </div>
          <div>
            <button
              v-if="currentStep < 4"
              @click="nextStep"
              :disabled="!canProceedToNextStep"
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              下一步
              <svg class="ml-2 -mr-1 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              v-else
              @click="submitForm"
              :disabled="isSubmitting || !isFormValid"
              type="button"
              class="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? '提交中...' : '创建数据集' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-lg leading-6 font-medium text-gray-900 mt-4">数据集创建成功!</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              您的漏斗数据集已成功创建，现在可以查看详细的分析结果。
            </p>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="goToAnalysis"
              class="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              查看分析结果
            </button>
            <button
              @click="closeSuccessModal"
              class="mt-3 px-4 py-2 bg-gray-100 text-gray-900 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              返回数据集列表
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMetricDatasetStore } from '@/stores/metricDataset';
import DataEntryForm from '@/components/metrics/DataEntryForm.vue';
import { metricDatasetAPI } from '@/api/metricDataset';

// Router and store
const router = useRouter();
const metricDatasetStore = useMetricDatasetStore();

// Reactive data
const currentStep = ref(1);
const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const isFormValid = ref(false);
const createdDatasetId = ref<string | null>(null);

// Form data
const formData = ref(metricDatasetStore.currentFormData);
const stageNames = ref(['线索生成', '有效触达', '商机转化', '成交完成']);
const errors = ref<Record<string, string>>({});

// Steps configuration
const steps = computed(() => [
  { name: '基本信息', status: currentStep.value > 1 ? 'complete' : currentStep.value === 1 ? 'current' : 'upcoming' },
  { name: '阶段配置', status: currentStep.value > 2 ? 'complete' : currentStep.value === 2 ? 'current' : 'upcoming' },
  { name: '数据录入', status: currentStep.value > 3 ? 'complete' : currentStep.value === 3 ? 'current' : 'upcoming' },
  { name: '预览确认', status: currentStep.value === 4 ? 'current' : 'upcoming' }
]);

// Computed properties
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.name.trim().length > 0;
    case 2:
      return stageNames.value.every(name => name.trim().length > 0);
    case 3:
      return isFormValid.value;
    default:
      return true;
  }
});

const overallConversionRate = computed(() => {
  return metricDatasetAPI.calculateOverallConversionRate(formData.value.stageData);
});

const stageDataArray = computed(() => [
  formData.value.stageData.stage_1,
  formData.value.stageData.stage_2,
  formData.value.stageData.stage_3,
  formData.value.stageData.stage_4
]);

// Methods
const setStep = (step: number) => {
  if (step <= currentStep.value || canProceedToNextStep.value) {
    currentStep.value = step;
  }
};

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 4) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleFormValidation = (valid: boolean) => {
  isFormValid.value = valid;
};

const getIndustryName = (industry: string) => {
  const industryNames: Record<string, string> = {
    general: '通用行业',
    technology: '科技行业',
    finance: '金融行业',
    education: '教育行业',
    healthcare: '医疗行业',
    ecommerce: '电商行业',
    manufacturing: '制造业',
    services: '服务业'
  };
  return industryNames[industry] || industry;
};

const getDataSourceName = (dataSource: string) => {
  const dataSourceNames: Record<string, string> = {
    manual: '手工录入',
    import: '文件导入',
    api: 'API接口'
  };
  return dataSourceNames[dataSource] || dataSource;
};

const getConversionRate = (visitors: number, converted: number): number => {
  return metricDatasetAPI.calculateConversionRate(visitors, converted);
};

const validateStep1 = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.value.name.trim()) {
    newErrors.name = '数据集名称不能为空';
  }
  
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const submitForm = async () => {
  if (!isFormValid.value) {
    return;
  }

  isSubmitting.value = true;
  
  try {
    const dataset = await metricDatasetStore.createDataset(formData.value);
    createdDatasetId.value = dataset.id;
    showSuccessModal.value = true;
  } catch (error) {
    console.error('Failed to create dataset:', error);
    // TODO: Show error notification
  } finally {
    isSubmitting.value = false;
  }
};

const goToAnalysis = () => {
  if (createdDatasetId.value) {
    router.push(`/analysis/${createdDatasetId.value}`);
  }
};

const closeSuccessModal = () => {
  showSuccessModal.value = false;
  router.push('/metrics');
};

// Lifecycle
onMounted(() => {
  // Reset form when component mounts
  metricDatasetStore.resetForm();
});
</script>

<style scoped>
/* Custom styles for the wizard */
.step-complete {
  @apply bg-indigo-600 text-white;
}

.step-current {
  @apply bg-white border-indigo-600 text-indigo-600;
}

.step-upcoming {
  @apply bg-white border-gray-300 text-gray-400;
}

/* Progress bar styles */
.progress-line {
  @apply absolute inset-0 flex items-center;
}

.progress-line-completed {
  @apply h-0.5 w-full bg-indigo-600;
}

.progress-line-incomplete {
  @apply h-0.5 w-full bg-gray-200;
}
</style>