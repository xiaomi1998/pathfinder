<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="$emit('close')"
  >
    <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- 标题 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">批量导入基准数据</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 导入步骤 -->
        <div class="mb-8">
          <div class="flex items-center">
            <div class="flex items-center text-blue-600">
              <div class="flex-shrink-0 w-8 h-8 border-2 border-blue-600 rounded-full flex items-center justify-center">
                <span class="text-sm font-semibold">1</span>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">上传文件</h4>
                <p class="text-sm text-gray-500">选择CSV或Excel文件</p>
              </div>
            </div>
            <div class="flex-1 h-px bg-gray-300 mx-4"></div>
            
            <div class="flex items-center" :class="step >= 2 ? 'text-blue-600' : 'text-gray-400'">
              <div class="flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center"
                   :class="step >= 2 ? 'border-blue-600' : 'border-gray-300'">
                <span class="text-sm font-semibold">2</span>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">预览数据</h4>
                <p class="text-sm text-gray-500">确认数据格式</p>
              </div>
            </div>
            <div class="flex-1 h-px bg-gray-300 mx-4"></div>
            
            <div class="flex items-center" :class="step >= 3 ? 'text-blue-600' : 'text-gray-400'">
              <div class="flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center"
                   :class="step >= 3 ? 'border-blue-600' : 'border-gray-300'">
                <span class="text-sm font-semibold">3</span>
              </div>
              <div class="ml-4">
                <h4 class="text-sm font-medium">导入完成</h4>
                <p class="text-sm text-gray-500">查看导入结果</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤1: 文件上传 -->
        <div v-if="step === 1" class="space-y-6">
          <!-- 文件格式说明 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-900 mb-2">文件格式要求</h4>
            <div class="text-sm text-blue-800 space-y-1">
              <p>• 支持CSV和Excel文件格式</p>
              <p>• 必须包含以下列：industry, metricType, metricName, value, percentile, sampleSize, periodStart, periodEnd</p>
              <p>• 可选列：region, companySize</p>
              <p>• 日期格式：YYYY-MM-DD</p>
              <p>• 数值范围：value (0-100), percentile (10,25,50,75,90), sampleSize (1-100000)</p>
            </div>
          </div>

          <!-- 模板下载 -->
          <div class="flex justify-center">
            <button
              @click="downloadTemplate"
              class="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>下载模板文件</span>
            </button>
          </div>

          <!-- 文件上传区域 -->
          <div 
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            :class="{ 'border-blue-500 bg-blue-50': isDragging }"
          >
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="mt-4">
              <label class="cursor-pointer">
                <span class="mt-2 block text-sm font-medium text-gray-900">
                  拖拽文件到此处或
                  <span class="text-blue-600">点击选择文件</span>
                </span>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  @change="handleFileSelect"
                  class="sr-only"
                >
              </label>
              <p class="mt-1 text-xs text-gray-500">支持CSV、Excel文件，最大1000条记录</p>
            </div>
          </div>

          <!-- 已选文件 -->
          <div v-if="selectedFile" class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                  <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                </div>
              </div>
              <button
                @click="removeFile"
                class="text-red-600 hover:text-red-800"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 继续按钮 -->
          <div class="flex justify-end">
            <button
              @click="parseFile"
              :disabled="!selectedFile || parsing"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="parsing" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                解析中...
              </span>
              <span v-else>下一步</span>
            </button>
          </div>
        </div>

        <!-- 步骤2: 数据预览 -->
        <div v-if="step === 2" class="space-y-6">
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium text-yellow-800">
                请仔细检查数据格式和内容，确认无误后再进行导入
              </span>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">总记录数</p>
              <p class="text-lg font-semibold text-blue-600">{{ previewData.length }}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">有效记录</p>
              <p class="text-lg font-semibold text-green-600">{{ validRecords }}</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">错误记录</p>
              <p class="text-lg font-semibold text-red-600">{{ errorRecords }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600">唯一行业</p>
              <p class="text-lg font-semibold text-gray-600">{{ uniqueIndustries }}</p>
            </div>
          </div>

          <!-- 错误列表 -->
          <div v-if="validationErrors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-red-900 mb-3">数据验证错误 ({{ validationErrors.length }}条)</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div 
                v-for="error in validationErrors.slice(0, 10)" 
                :key="`${error.row}-${error.field}`"
                class="text-sm text-red-800 bg-red-100 px-2 py-1 rounded"
              >
                第{{ error.row }}行{{ error.field ? ` [${error.field}]` : '' }}: {{ error.message }}
              </div>
              <div v-if="validationErrors.length > 10" class="text-sm text-red-600">
                ... 还有{{ validationErrors.length - 10 }}个错误
              </div>
            </div>
          </div>

          <!-- 数据表格预览 -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="bg-gray-50 px-4 py-2">
              <h4 class="text-sm font-medium text-gray-900">数据预览 (前10条记录)</h4>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">行号</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">行业</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">指标名称</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">数值</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">百分位</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">样本量</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="(record, index) in previewData.slice(0, 10)"
                    :key="index"
                    :class="record._hasError ? 'bg-red-50' : 'bg-white'"
                  >
                    <td class="px-3 py-2 text-sm text-gray-900">{{ record._row }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ record.industry }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ record.metricName }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ record.value }}%</td>
                    <td class="px-3 py-2 text-sm text-gray-900">P{{ record.percentile }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ record.sampleSize }}</td>
                    <td class="px-3 py-2 text-sm">
                      <span 
                        v-if="record._hasError" 
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                      >
                        错误
                      </span>
                      <span 
                        v-else 
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        有效
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-between">
            <button
              @click="step = 1"
              class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              上一步
            </button>
            <button
              @click="importData"
              :disabled="validRecords === 0 || importing"
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="importing" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                导入中...
              </span>
              <span v-else>开始导入 ({{ validRecords }}条记录)</span>
            </button>
          </div>
        </div>

        <!-- 步骤3: 导入结果 -->
        <div v-if="step === 3" class="space-y-6">
          <!-- 结果统计 -->
          <div class="text-center">
            <div 
              v-if="importResult?.failureCount === 0"
              class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div 
              v-else
              class="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4"
            >
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            
            <h3 class="text-lg font-semibold text-gray-900 mb-2">导入完成</h3>
            <p class="text-gray-600">
              {{ importResult ? `总共${importResult.totalRecords}条记录，成功${importResult.successCount}条，失败${importResult.failureCount}条` : '导入结果统计' }}
            </p>
          </div>

          <!-- 结果详情 -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-blue-600">{{ importResult?.totalRecords || 0 }}</p>
              <p class="text-sm text-gray-600">总记录数</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-green-600">{{ importResult?.successCount || 0 }}</p>
              <p class="text-sm text-gray-600">成功导入</p>
            </div>
            <div class="bg-red-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-red-600">{{ importResult?.failureCount || 0 }}</p>
              <p class="text-sm text-gray-600">导入失败</p>
            </div>
          </div>

          <!-- 错误详情 -->
          <div v-if="importResult?.errors && importResult.errors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-red-900 mb-3">导入错误详情</h4>
            <div class="max-h-40 overflow-y-auto space-y-1">
              <div 
                v-for="error in importResult.errors"
                :key="`import-error-${error.row}`"
                class="text-sm text-red-800 bg-red-100 px-2 py-1 rounded"
              >
                第{{ error.row }}行: {{ error.error }}
              </div>
            </div>
          </div>

          <!-- 完成按钮 -->
          <div class="flex justify-center">
            <button
              @click="handleComplete"
              class="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useAdminStore, type BenchmarkDataInput, type BenchmarkBatchImportResult } from '@/stores/admin';
import * as XLSX from 'xlsx';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  imported: [];
}>();

const adminStore = useAdminStore();

// 状态管理
const step = ref(1);
const selectedFile = ref<File | null>(null);
const parsing = ref(false);
const importing = ref(false);
const isDragging = ref(false);

// 数据
const previewData = ref<any[]>([]);
const validationErrors = ref<{row: number; field?: string; message: string}[]>([]);
const importResult = ref<BenchmarkBatchImportResult | null>(null);

// 文件输入引用
const fileInput = ref<HTMLInputElement>();

// 计算属性
const validRecords = computed(() => {
  return previewData.value.filter(record => !record._hasError).length;
});

const errorRecords = computed(() => {
  return previewData.value.filter(record => record._hasError).length;
});

const uniqueIndustries = computed(() => {
  const industries = new Set(previewData.value.map(record => record.industry));
  return industries.size;
});

// 文件处理方法
const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging.value = false;
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileSelection(files[0]);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleFileSelection(target.files[0]);
  }
};

const handleFileSelection = (file: File) => {
  // 验证文件类型
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const isValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
  
  if (!isValidType) {
    alert('请选择CSV或Excel文件');
    return;
  }

  // 验证文件大小 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('文件大小不能超过10MB');
    return;
  }

  selectedFile.value = file;
};

const removeFile = () => {
  selectedFile.value = null;
  previewData.value = [];
  validationErrors.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 文件解析
const parseFile = async () => {
  if (!selectedFile.value) return;
  
  try {
    parsing.value = true;
    
    const fileContent = await readFile(selectedFile.value);
    const workbook = XLSX.read(fileContent, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 2) {
      throw new Error('文件必须包含表头和至少一行数据');
    }
    
    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1) as any[][];
    
    // 验证必要的列
    const requiredColumns = ['industry', 'metricType', 'metricName', 'value', 'percentile', 'sampleSize', 'periodStart', 'periodEnd'];
    const missingColumns = requiredColumns.filter(col => !headers.some(h => h.toLowerCase() === col.toLowerCase()));
    
    if (missingColumns.length > 0) {
      throw new Error(`缺少必要的列: ${missingColumns.join(', ')}`);
    }
    
    // 解析数据
    const parsedData = dataRows.map((row, index) => {
      const record: any = { _row: index + 2 }; // Excel行号从2开始
      
      headers.forEach((header, colIndex) => {
        const normalizedHeader = header.toLowerCase();
        record[normalizedHeader] = row[colIndex];
      });
      
      return record;
    });
    
    // 验证数据
    previewData.value = parsedData.map(record => validateRecord(record));
    
    if (previewData.value.length > 1000) {
      throw new Error('一次最多导入1000条记录');
    }
    
    step.value = 2;
    
  } catch (error: any) {
    console.error('File parsing error:', error);
    alert(`文件解析失败: ${error.message}`);
  } finally {
    parsing.value = false;
  }
};

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsBinaryString(file);
  });
};

// 数据验证
const validateRecord = (record: any) => {
  const errors: string[] = [];
  record._hasError = false;
  
  // 验证必填字段
  if (!record.industry?.trim()) errors.push('行业不能为空');
  if (!record.metrictype?.trim()) errors.push('指标类型不能为空');
  if (!record.metricname?.trim()) errors.push('指标名称不能为空');
  
  // 验证数值范围
  const value = parseFloat(record.value);
  if (isNaN(value) || value < 0 || value > 100) {
    errors.push('数值必须在0-100之间');
  } else {
    record.value = value;
  }
  
  const percentile = parseInt(record.percentile);
  if (![10, 25, 50, 75, 90].includes(percentile)) {
    errors.push('百分位数必须是10, 25, 50, 75, 90之一');
  } else {
    record.percentile = percentile;
  }
  
  const sampleSize = parseInt(record.samplesize);
  if (isNaN(sampleSize) || sampleSize < 1 || sampleSize > 100000) {
    errors.push('样本量必须在1-100000之间');
  } else {
    record.sampleSize = sampleSize;
  }
  
  // 验证日期格式
  if (!isValidDate(record.periodstart)) {
    errors.push('开始日期格式无效，应为YYYY-MM-DD');
  } else {
    record.periodStart = record.periodstart;
  }
  
  if (!isValidDate(record.periodend)) {
    errors.push('结束日期格式无效，应为YYYY-MM-DD');
  } else {
    record.periodEnd = record.periodend;
  }
  
  if (record.periodStart && record.periodEnd && record.periodStart >= record.periodEnd) {
    errors.push('结束日期必须晚于开始日期');
  }
  
  // 记录错误
  if (errors.length > 0) {
    record._hasError = true;
    errors.forEach(error => {
      validationErrors.value.push({
        row: record._row,
        message: error
      });
    });
  }
  
  // 标准化字段名
  record.industry = record.industry;
  record.metricType = record.metrictype;
  record.metricName = record.metricname;
  record.region = record.region || '';
  record.companySize = record.companysize || '';
  
  return record;
};

const isValidDate = (dateStr: any) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
};

// 导入数据
const importData = async () => {
  try {
    importing.value = true;
    
    const validData = previewData.value
      .filter(record => !record._hasError)
      .map(record => ({
        industry: record.industry,
        region: record.region,
        companySize: record.companySize,
        metricType: record.metricType,
        metricName: record.metricName,
        value: record.value,
        percentile: record.percentile,
        sampleSize: record.sampleSize,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd
      } as BenchmarkDataInput));
    
    importResult.value = await adminStore.batchImportBenchmarks(validData);
    step.value = 3;
    
  } catch (error: any) {
    console.error('Import error:', error);
    alert(`导入失败: ${error.message || '未知错误'}`);
  } finally {
    importing.value = false;
  }
};

// 完成导入
const handleComplete = () => {
  emit('imported');
  resetState();
};

// 重置状态
const resetState = () => {
  step.value = 1;
  selectedFile.value = null;
  previewData.value = [];
  validationErrors.value = [];
  importResult.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 工具方法
const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    ['industry', 'metricType', 'metricName', 'value', 'percentile', 'sampleSize', 'periodStart', 'periodEnd', 'region', 'companySize'],
    ['科技', 'conversion_rate', 'stage_1_conversion_rate', '25.5', '50', '1000', '2024-01-01', '2024-12-31', '中国', '11-50人'],
    ['金融', 'conversion_rate', 'stage_2_conversion_rate', '15.2', '75', '500', '2024-01-01', '2024-12-31', '全球', '101-500人']
  ];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, 'benchmark_template.xlsx');
};

// 监听关闭事件，重置状态
const handleClose = () => {
  resetState();
  emit('close');
};

// 拦截关闭事件
const $emit = (event: string) => {
  if (event === 'close') {
    handleClose();
  } else {
    emit(event as any);
  }
};
</script>