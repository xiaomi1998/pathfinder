<template>
  <div class="data-entry-form">
    <!-- Form Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <h2 class="text-2xl font-bold text-gray-900">漏斗数据录入</h2>
      <p class="mt-1 text-sm text-gray-600">
        请按照漏斗各阶段的实际数据进行录入，系统将自动计算转化率并提供分析建议
      </p>
    </div>

    <!-- Form Content -->
    <div class="px-6 py-6">
      <!-- Stage Data Input Table -->
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-4">
            漏斗阶段数据
          </label>
          
          <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table class="min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    漏斗阶段
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    访问者数量
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    转化数量
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    转化率
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <!-- Stage 1: 线索生成 -->
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <span class="text-xs font-medium text-white">1</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">线索生成</div>
                        <div class="text-sm text-gray-500">潜在客户识别</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_1.visitors"
                      @input="updateStage('stage_1')"
                      type="number"
                      min="0"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入访问者数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_1.converted"
                      @input="updateStage('stage_1')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_1.visitors"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入转化数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-sm font-medium" :class="getConversionRateColor('stage_1')">
                        {{ getConversionRate('stage_1') }}%
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Stage 2: 有效触达 -->
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                          <span class="text-xs font-medium text-white">2</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">有效触达</div>
                        <div class="text-sm text-gray-500">成功联系客户</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_2.visitors"
                      @input="updateStage('stage_2')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_1.converted"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入访问者数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_2.converted"
                      @input="updateStage('stage_2')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_2.visitors"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入转化数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-sm font-medium" :class="getConversionRateColor('stage_2')">
                        {{ getConversionRate('stage_2') }}%
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Stage 3: 商机转化 -->
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                          <span class="text-xs font-medium text-white">3</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">商机转化</div>
                        <div class="text-sm text-gray-500">形成商业机会</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_3.visitors"
                      @input="updateStage('stage_3')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_2.converted"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入访问者数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_3.converted"
                      @input="updateStage('stage_3')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_3.visitors"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入转化数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-sm font-medium" :class="getConversionRateColor('stage_3')">
                        {{ getConversionRate('stage_3') }}%
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Stage 4: 成交完成 -->
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                          <span class="text-xs font-medium text-white">4</span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">成交完成</div>
                        <div class="text-sm text-gray-500">最终成功交易</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_4.visitors"
                      @input="updateStage('stage_4')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_3.converted"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入访问者数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      v-model.number="localFormData.stageData.stage_4.converted"
                      @input="updateStage('stage_4')"
                      type="number"
                      min="0"
                      :max="localFormData.stageData.stage_4.visitors"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="输入转化数量"
                    >
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-sm font-medium" :class="getConversionRateColor('stage_4')">
                        {{ getConversionRate('stage_4') }}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Overall Statistics -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">整体统计</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-sm font-medium text-gray-500">总体转化率</div>
              <div class="text-2xl font-bold text-indigo-600">
                {{ overallConversionRate }}%
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-sm font-medium text-gray-500">流失总数</div>
              <div class="text-2xl font-bold text-red-600">
                {{ totalLoss }}
              </div>
            </div>
            <div class="bg-white rounded-lg p-4 shadow-sm">
              <div class="text-sm font-medium text-gray-500">最终转化数</div>
              <div class="text-2xl font-bold text-green-600">
                {{ finalConversion }}
              </div>
            </div>
          </div>
        </div>

        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                数据验证失败
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <ul role="list" class="pl-5 space-y-1 list-disc">
                  <li v-for="error in validationErrors" :key="error">{{ error }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Mini Funnel Visualization -->
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">漏斗预览</h3>
          <div class="flex items-center justify-center space-x-4 py-4">
            <div 
              v-for="(stage, index) in stageData" 
              :key="`stage_${index + 1}`"
              class="flex flex-col items-center"
            >
              <!-- Stage block -->
              <div 
                class="transition-all duration-200"
                :style="{ 
                  width: `${Math.max(20, stage.visitors / maxVisitors * 120)}px`, 
                  height: '60px',
                  backgroundColor: stageColors[index] 
                }"
                :class="'rounded-lg flex items-center justify-center text-white font-medium text-sm'"
              >
                {{ stage.converted }}
              </div>
              <!-- Stage label -->
              <div class="mt-2 text-xs text-center text-gray-600">
                {{ stageNames[index] }}
              </div>
              <!-- Arrow -->
              <div v-if="index < 3" class="mt-2">
                <svg class="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { metricDatasetAPI, type FunnelMetricData, type CreateFunnelMetricDatasetRequest } from '@/api/metricDataset';

// Props
interface Props {
  modelValue: CreateFunnelMetricDatasetRequest;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: CreateFunnelMetricDatasetRequest];
  'validate': [isValid: boolean];
}>();

// Local form data
const localFormData = ref<CreateFunnelMetricDatasetRequest>({ ...props.modelValue });

// Stage configuration
const stageNames = ['线索生成', '有效触达', '商机转化', '成交完成'];
const stageColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

// Computed properties
const stageData = computed(() => [
  localFormData.value.stageData.stage_1,
  localFormData.value.stageData.stage_2,
  localFormData.value.stageData.stage_3,
  localFormData.value.stageData.stage_4
]);

const maxVisitors = computed(() => {
  const max = Math.max(...stageData.value.map(stage => stage.visitors));
  return max > 0 ? max : 1000;
});

const overallConversionRate = computed(() => {
  return metricDatasetAPI.calculateOverallConversionRate(localFormData.value.stageData);
});

const totalLoss = computed(() => {
  const initial = localFormData.value.stageData.stage_1.visitors || 0;
  const final = localFormData.value.stageData.stage_4.converted || 0;
  return initial - final;
});

const finalConversion = computed(() => {
  return localFormData.value.stageData.stage_4.converted || 0;
});

const validationErrors = computed(() => {
  const validation = metricDatasetAPI.validateFunnelData(localFormData.value.stageData);
  return validation.errors;
});

const isValid = computed(() => {
  return validationErrors.value.length === 0;
});

// Methods
const getConversionRate = (stage: string) => {
  const stageData = localFormData.value.stageData[stage as keyof FunnelMetricData];
  return metricDatasetAPI.calculateConversionRate(stageData.visitors || 0, stageData.converted || 0);
};

const getConversionRateColor = (stage: string) => {
  const rate = getConversionRate(stage);
  if (rate >= 50) return 'text-green-600';
  if (rate >= 30) return 'text-yellow-600';
  if (rate >= 10) return 'text-orange-600';
  return 'text-red-600';
};

const updateStage = (stageKey: string) => {
  // Emit the updated data
  emit('update:modelValue', localFormData.value);
  emit('validate', isValid.value);
};

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  localFormData.value = { ...newValue };
}, { deep: true });

// Watch for validation changes
watch(isValid, (newIsValid) => {
  emit('validate', newIsValid);
}, { immediate: true });
</script>

<style scoped>
/* Custom styles for the data entry form */
.data-entry-form {
  @apply bg-white shadow-lg rounded-lg overflow-hidden;
}

/* Input focus styles */
input:focus {
  @apply ring-2 ring-indigo-500 ring-offset-2;
}

/* Validation error input styles */
input:invalid {
  @apply border-red-300 ring-red-500;
}

/* Stage visualization styles */
.stage-block {
  transition: all 0.3s ease;
}

.stage-block:hover {
  transform: scale(1.05);
}
</style>