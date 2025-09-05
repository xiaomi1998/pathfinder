<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="$emit('close')"
  >
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- 标题 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isEditing ? '编辑基准数据' : '新增基准数据' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 表单 -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 基本信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="industry" class="block text-sm font-medium text-gray-700 mb-1">
                行业 <span class="text-red-500">*</span>
              </label>
              <input
                id="industry"
                v-model="form.industry"
                type="text"
                required
                maxlength="100"
                placeholder="例如：科技、金融、零售"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.industry }"
              >
              <p v-if="errors.industry" class="mt-1 text-sm text-red-600">{{ errors.industry }}</p>
            </div>

            <div>
              <label for="companySize" class="block text-sm font-medium text-gray-700 mb-1">
                公司规模
              </label>
              <select
                id="companySize"
                v-model="form.companySize"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="1-10人">1-10人</option>
                <option value="11-50人">11-50人</option>
                <option value="51-100人">51-100人</option>
                <option value="101-500人">101-500人</option>
                <option value="500人以上">500人以上</option>
              </select>
            </div>
          </div>

          <!-- 指标信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="metricType" class="block text-sm font-medium text-gray-700 mb-1">
                指标类型 <span class="text-red-500">*</span>
              </label>
              <select
                id="metricType"
                v-model="form.metricType"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.metricType }"
              >
                <option value="">请选择</option>
                <option value="conversion_rate">转化率</option>
                <option value="engagement">参与度</option>
                <option value="retention">留存率</option>
                <option value="revenue">收入指标</option>
                <option value="cost">成本指标</option>
                <option value="performance">性能指标</option>
              </select>
              <p v-if="errors.metricType" class="mt-1 text-sm text-red-600">{{ errors.metricType }}</p>
            </div>

            <div>
              <label for="metricName" class="block text-sm font-medium text-gray-700 mb-1">
                指标名称 <span class="text-red-500">*</span>
              </label>
              <input
                id="metricName"
                v-model="form.metricName"
                type="text"
                required
                maxlength="100"
                placeholder="例如：stage_1_conversion_rate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.metricName }"
              >
              <p v-if="errors.metricName" class="mt-1 text-sm text-red-600">{{ errors.metricName }}</p>
            </div>
          </div>

          <!-- 数值信息 -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label for="value" class="block text-sm font-medium text-gray-700 mb-1">
                数值 (%) <span class="text-red-500">*</span>
              </label>
              <input
                id="value"
                v-model.number="form.value"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="0.00"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.value }"
              >
              <p v-if="errors.value" class="mt-1 text-sm text-red-600">{{ errors.value }}</p>
            </div>

            <div>
              <label for="percentile" class="block text-sm font-medium text-gray-700 mb-1">
                百分位数 <span class="text-red-500">*</span>
              </label>
              <select
                id="percentile"
                v-model.number="form.percentile"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.percentile }"
              >
                <option value="">请选择</option>
                <option :value="10">P10</option>
                <option :value="25">P25</option>
                <option :value="50">P50 (中位数)</option>
                <option :value="75">P75</option>
                <option :value="90">P90</option>
              </select>
              <p v-if="errors.percentile" class="mt-1 text-sm text-red-600">{{ errors.percentile }}</p>
            </div>

            <div>
              <label for="sampleSize" class="block text-sm font-medium text-gray-700 mb-1">
                样本量 <span class="text-red-500">*</span>
              </label>
              <input
                id="sampleSize"
                v-model.number="form.sampleSize"
                type="number"
                min="1"
                max="100000"
                required
                placeholder="例如：1000"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.sampleSize }"
              >
              <p v-if="errors.sampleSize" class="mt-1 text-sm text-red-600">{{ errors.sampleSize }}</p>
            </div>
          </div>

          <!-- 时间期间 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="periodStart" class="block text-sm font-medium text-gray-700 mb-1">
                开始日期 <span class="text-red-500">*</span>
              </label>
              <input
                id="periodStart"
                v-model="form.periodStart"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.periodStart }"
              >
              <p v-if="errors.periodStart" class="mt-1 text-sm text-red-600">{{ errors.periodStart }}</p>
            </div>

            <div>
              <label for="periodEnd" class="block text-sm font-medium text-gray-700 mb-1">
                结束日期 <span class="text-red-500">*</span>
              </label>
              <input
                id="periodEnd"
                v-model="form.periodEnd"
                type="date"
                required
                :min="form.periodStart"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="{ 'border-red-500': errors.periodEnd }"
              >
              <p v-if="errors.periodEnd" class="mt-1 text-sm text-red-600">{{ errors.periodEnd }}</p>
            </div>
          </div>

          <!-- 区域信息 (可选) -->
          <div>
            <label for="region" class="block text-sm font-medium text-gray-700 mb-1">
              地区 (可选)
            </label>
            <select
              id="region"
              v-model="form.region"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择</option>
              <option value="北美">北美</option>
              <option value="欧洲">欧洲</option>
              <option value="亚太">亚太</option>
              <option value="中国">中国</option>
              <option value="全球">全球</option>
            </select>
          </div>

          <!-- 提交按钮 -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </span>
              <span v-else>
                {{ isEditing ? '更新' : '创建' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useAdminStore, type BenchmarkData, type BenchmarkDataInput } from '@/stores/admin';

const props = defineProps<{
  visible: boolean;
  benchmarkData?: BenchmarkData | null;
  isEditing?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const adminStore = useAdminStore();

// 状态管理
const loading = ref(false);

// 表单数据
const form = reactive<BenchmarkDataInput>({
  industry: '',
  region: '',
  companySize: '',
  metricType: '',
  metricName: '',
  value: 0,
  percentile: 50,
  sampleSize: 100,
  periodStart: '',
  periodEnd: ''
});

// 错误信息
const errors = reactive<Record<string, string>>({});

// 计算属性
const isFormValid = computed(() => {
  return (
    form.industry &&
    form.metricType &&
    form.metricName &&
    form.value >= 0 &&
    form.value <= 100 &&
    form.percentile &&
    form.sampleSize > 0 &&
    form.periodStart &&
    form.periodEnd &&
    form.periodStart <= form.periodEnd &&
    Object.keys(errors).length === 0
  );
});

// 验证方法
const validateForm = () => {
  // 清空之前的错误
  Object.keys(errors).forEach(key => delete errors[key]);

  // 验证必填字段
  if (!form.industry.trim()) {
    errors.industry = '行业不能为空';
  } else if (form.industry.length > 100) {
    errors.industry = '行业名称不能超过100个字符';
  }

  if (!form.metricType) {
    errors.metricType = '指标类型不能为空';
  }

  if (!form.metricName.trim()) {
    errors.metricName = '指标名称不能为空';
  } else if (form.metricName.length > 100) {
    errors.metricName = '指标名称不能超过100个字符';
  }

  // 验证数值范围
  if (form.value < 0 || form.value > 100) {
    errors.value = '数值必须在0-100之间';
  }

  if (![10, 25, 50, 75, 90].includes(form.percentile)) {
    errors.percentile = '百分位数必须是10, 25, 50, 75, 90之一';
  }

  if (form.sampleSize < 1 || form.sampleSize > 100000) {
    errors.sampleSize = '样本量必须在1-100000之间';
  }

  // 验证日期
  if (!form.periodStart) {
    errors.periodStart = '开始日期不能为空';
  }

  if (!form.periodEnd) {
    errors.periodEnd = '结束日期不能为空';
  } else if (form.periodStart && form.periodEnd <= form.periodStart) {
    errors.periodEnd = '结束日期必须晚于开始日期';
  }
};

// 提交表单
const handleSubmit = async () => {
  validateForm();
  
  if (!isFormValid.value) {
    return;
  }

  try {
    loading.value = true;

    if (props.isEditing && props.benchmarkData) {
      // 编辑模式
      await adminStore.updateBenchmark(props.benchmarkData.id, form);
    } else {
      // 创建模式
      await adminStore.createBenchmark(form);
    }

    emit('saved');
  } catch (error: any) {
    console.error('Form submission error:', error);
    // 处理服务器端验证错误
    if (error.response?.data?.error) {
      alert(`操作失败: ${error.response.data.error}`);
    } else {
      alert(`${props.isEditing ? '更新' : '创建'}失败，请检查输入并重试`);
    }
  } finally {
    loading.value = false;
  }
};

// 初始化表单数据
const initializeForm = () => {
  if (props.isEditing && props.benchmarkData) {
    // 编辑模式：使用现有数据
    form.industry = props.benchmarkData.industry;
    form.region = props.benchmarkData.region || '';
    form.companySize = props.benchmarkData.companySize || '';
    form.metricType = props.benchmarkData.metricType;
    form.metricName = props.benchmarkData.metricName;
    form.value = props.benchmarkData.value;
    form.percentile = props.benchmarkData.percentile;
    form.sampleSize = props.benchmarkData.sampleSize;
    form.periodStart = props.benchmarkData.periodStart.split('T')[0];
    form.periodEnd = props.benchmarkData.periodEnd.split('T')[0];
  } else {
    // 创建模式：重置表单
    Object.assign(form, {
      industry: '',
      region: '',
      companySize: '',
      metricType: '',
      metricName: '',
      value: 0,
      percentile: 50,
      sampleSize: 100,
      periodStart: '',
      periodEnd: ''
    });
  }
  
  // 清空错误信息
  Object.keys(errors).forEach(key => delete errors[key]);
};

// 设置默认日期
const setDefaultDates = () => {
  if (!form.periodStart && !form.periodEnd) {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    form.periodStart = oneMonthAgo.toISOString().split('T')[0];
    form.periodEnd = today.toISOString().split('T')[0];
  }
};

// 监听表单变化进行实时验证
watch(
  () => ({ ...form }),
  () => {
    if (Object.keys(errors).length > 0) {
      validateForm();
    }
  },
  { deep: true }
);

// 监听可见性变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      initializeForm();
      if (!props.isEditing) {
        setDefaultDates();
      }
    }
  },
  { immediate: true }
);

// 生命周期
onMounted(() => {
  if (props.visible) {
    initializeForm();
    if (!props.isEditing) {
      setDefaultDates();
    }
  }
});
</script>