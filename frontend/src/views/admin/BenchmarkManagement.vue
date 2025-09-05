<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题和统计 -->
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">基准数据管理</h1>
            <p class="text-gray-600 mt-2">管理和维护行业基准数据，为用户分析提供准确对比</p>
          </div>
          <div class="flex space-x-4">
            <button
              @click="showImportModal = true"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <span>批量导入</span>
            </button>
            <button
              @click="showCreateModal = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <span>新增数据</span>
            </button>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-500">总记录数</h3>
                <p class="text-2xl font-bold text-gray-900">{{ stats?.totalRecords || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-500">行业数量</h3>
                <p class="text-2xl font-bold text-gray-900">{{ stats?.industriesCount || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center">
              <div class="p-2 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-500">指标数量</h3>
                <p class="text-2xl font-bold text-gray-900">{{ stats?.metricsCount || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center">
              <div class="p-2 bg-yellow-100 rounded-lg">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <h3 class="text-sm font-medium text-gray-500">最后更新</h3>
                <p class="text-sm font-bold text-gray-900">
                  {{ stats?.lastUpdated ? formatDate(stats.lastUpdated) : '无' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">行业</label>
            <input
              v-model="filters.industry"
              type="text"
              placeholder="搜索行业"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @input="debouncedSearch"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">指标类型</label>
            <select
              v-model="filters.metricType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="searchBenchmarks"
            >
              <option value="">全部类型</option>
              <option value="conversion_rate">转化率</option>
              <option value="engagement">参与度</option>
              <option value="retention">留存率</option>
              <option value="revenue">收入</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">百分位数</label>
            <select
              v-model="filters.percentile"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="searchBenchmarks"
            >
              <option value="">全部百分位</option>
              <option :value="10">P10</option>
              <option :value="25">P25</option>
              <option :value="50">P50</option>
              <option :value="75">P75</option>
              <option :value="90">P90</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="resetFilters"
              class="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  行业
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  指标信息
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数值/百分位
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  样本量
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间期间
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading" class="animate-pulse">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
              <tr v-else-if="benchmarkData.length === 0">
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
              <tr v-else v-for="benchmark in benchmarkData" :key="benchmark.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ benchmark.industry }}</div>
                  <div v-if="benchmark.companySize" class="text-sm text-gray-500">{{ benchmark.companySize }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ benchmark.metricName }}</div>
                  <div class="text-sm text-gray-500">{{ benchmark.metricType }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-bold text-blue-600">{{ benchmark.value.toFixed(2) }}%</div>
                  <div class="text-xs text-gray-500">P{{ benchmark.percentile }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ benchmark.sampleSize.toLocaleString() }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDate(benchmark.periodStart) }}</div>
                  <div class="text-sm text-gray-500">至 {{ formatDate(benchmark.periodEnd) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="editBenchmark(benchmark)"
                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    编辑
                  </button>
                  <button
                    @click="deleteBenchmarkData(benchmark)"
                    class="text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= totalPages"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                显示第
                <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                到
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                条，共
                <span class="font-medium">{{ pagination.total }}</span>
                条记录
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="changePage(pagination.page - 1)"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">上一页</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                
                <!-- 页码按钮 -->
                <template v-for="pageNum in visiblePages" :key="pageNum">
                  <button
                    v-if="pageNum !== '...'"
                    @click="changePage(pageNum as number)"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                      pageNum === pagination.page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    ]"
                  >
                    {{ pageNum }}
                  </button>
                  <span
                    v-else
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                </template>

                <button
                  @click="changePage(pagination.page + 1)"
                  :disabled="pagination.page >= totalPages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">下一页</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建/编辑弹窗 -->
    <BenchmarkForm
      v-if="showCreateModal || showEditModal"
      :visible="showCreateModal || showEditModal"
      :benchmark-data="editingBenchmark"
      :is-editing="showEditModal"
      @close="closeModal"
      @saved="handleBenchmarkSaved"
    />

    <!-- 批量导入弹窗 -->
    <BenchmarkImport
      v-if="showImportModal"
      :visible="showImportModal"
      @close="showImportModal = false"
      @imported="handleImportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { useAdminStore, type BenchmarkData, type GetBenchmarksParams } from '@/stores/admin';
import BenchmarkForm from '@/components/admin/BenchmarkForm.vue';
import BenchmarkImport from '@/components/admin/BenchmarkImport.vue';

const adminStore = useAdminStore();

// 状态管理
const loading = ref(false);
const benchmarkData = ref<BenchmarkData[]>([]);
const stats = ref<any>(null);

// 弹窗状态
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showImportModal = ref(false);
const editingBenchmark = ref<BenchmarkData | null>(null);

// 筛选和搜索
const filters = reactive({
  industry: '',
  metricType: '',
  percentile: null as number | null,
});

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 计算属性
const totalPages = computed(() => Math.ceil(pagination.total / pagination.limit));

const visiblePages = computed(() => {
  const current = pagination.page;
  const total = totalPages.value;
  const pages: (number | string)[] = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (current > 3) {
      pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) {
      pages.push('...');
    }
    
    if (total > 1) {
      pages.push(total);
    }
  }
  
  return pages;
});

// 搜索防抖
let searchTimeout: ReturnType<typeof setTimeout>;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchBenchmarks();
  }, 500);
};

// 方法
const loadBenchmarkStats = async () => {
  try {
    stats.value = await adminStore.getBenchmarkStats();
  } catch (error) {
    console.error('Failed to load benchmark stats:', error);
  }
};

const searchBenchmarks = async () => {
  try {
    loading.value = true;
    
    const params: GetBenchmarksParams = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.industry) params.industry = filters.industry;
    if (filters.metricType) params.metricType = filters.metricType;
    if (filters.percentile) params.percentile = filters.percentile;

    const response = await adminStore.getBenchmarks(params);
    
    benchmarkData.value = response.data;
    pagination.total = response.total;
    pagination.page = response.page;
    pagination.limit = response.limit;
  } catch (error) {
    console.error('Failed to search benchmarks:', error);
    benchmarkData.value = [];
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.industry = '';
  filters.metricType = '';
  filters.percentile = null;
  pagination.page = 1;
  searchBenchmarks();
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  pagination.page = page;
  searchBenchmarks();
};

const editBenchmark = (benchmark: BenchmarkData) => {
  editingBenchmark.value = benchmark;
  showEditModal.value = true;
};

const deleteBenchmarkData = async (benchmark: BenchmarkData) => {
  if (!confirm(`确定要删除行业"${benchmark.industry}"的基准数据"${benchmark.metricName}"吗？`)) {
    return;
  }

  try {
    await adminStore.deleteBenchmark(benchmark.id);
    await searchBenchmarks();
    await loadBenchmarkStats();
  } catch (error) {
    console.error('Failed to delete benchmark:', error);
    alert('删除失败，请重试');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingBenchmark.value = null;
};

const handleBenchmarkSaved = () => {
  closeModal();
  searchBenchmarks();
  loadBenchmarkStats();
};

const handleImportComplete = () => {
  showImportModal.value = false;
  searchBenchmarks();
  loadBenchmarkStats();
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadBenchmarkStats();
  searchBenchmarks();
});
</script>