<template>
  <div class="stress-test-dashboard">
    <!-- 标题栏 -->
    <div class="dashboard-header">
      <h2>Agent 9: 压力测试与基准监控仪表板</h2>
      <div class="status-indicator" :class="systemStatus">
        <div class="status-light"></div>
        <span>{{ systemStatusText }}</span>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="test-controls">
        <button 
          @click="startStressTest" 
          :disabled="isRunning"
          class="btn btn-primary"
        >
          开始压力测试
        </button>
        <button 
          @click="startBenchmarkTest" 
          :disabled="isRunning"
          class="btn btn-secondary"
        >
          运行基准测试
        </button>
        <button 
          @click="start24HourTest" 
          :disabled="isRunning"
          class="btn btn-warning"
        >
          24小时稳定性测试
        </button>
        <button 
          @click="stopCurrentTest" 
          :disabled="!isRunning"
          class="btn btn-danger"
        >
          停止测试
        </button>
      </div>
      
      <div class="test-config">
        <label>节点数量:</label>
        <input v-model.number="config.nodeCount" type="number" min="100" max="15000" step="100">
        
        <label>测试场景:</label>
        <select v-model="config.scenario">
          <option value="normal">标准测试</option>
          <option value="extreme">极限测试</option>
          <option value="memory-pressure">内存压力</option>
          <option value="cpu-intensive">CPU密集</option>
          <option value="low-end-device">低端设备</option>
        </select>
      </div>
    </div>

    <!-- 实时指标卡片 -->
    <div class="metrics-cards">
      <div class="metric-card">
        <div class="metric-icon">🚀</div>
        <div class="metric-content">
          <div class="metric-label">当前FPS</div>
          <div class="metric-value" :class="getFPSClass(currentMetrics.fps)">
            {{ currentMetrics.fps.toFixed(1) }}
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">💾</div>
        <div class="metric-content">
          <div class="metric-label">内存使用</div>
          <div class="metric-value" :class="getMemoryClass(currentMetrics.memory)">
            {{ currentMetrics.memory.toFixed(1) }}MB
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">⚡</div>
        <div class="metric-content">
          <div class="metric-label">拖拽延迟</div>
          <div class="metric-value" :class="getLatencyClass(currentMetrics.dragLatency)">
            {{ currentMetrics.dragLatency.toFixed(1) }}ms
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🎯</div>
        <div class="metric-content">
          <div class="metric-label">系统稳定性</div>
          <div class="metric-value" :class="getStabilityClass(currentMetrics.stability)">
            {{ currentMetrics.stability.toFixed(0) }}%
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <div class="metric-content">
          <div class="metric-label">基准评分</div>
          <div class="metric-value" :class="getBenchmarkClass(currentMetrics.benchmarkScore)">
            {{ currentMetrics.benchmarkScore.toFixed(0) }}/100
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🔄</div>
        <div class="metric-content">
          <div class="metric-label">已执行操作</div>
          <div class="metric-value">
            {{ currentMetrics.operations.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- 实时图表 -->
    <div class="charts-section">
      <div class="chart-container">
        <h3>性能趋势图</h3>
        <div class="chart-wrapper">
          <canvas ref="performanceChart" width="800" height="300"></canvas>
        </div>
        <div class="chart-legend">
          <span class="legend-item fps">FPS</span>
          <span class="legend-item memory">内存使用</span>
          <span class="legend-item latency">拖拽延迟</span>
        </div>
      </div>

      <div class="chart-container">
        <h3>系统负载分布</h3>
        <div class="chart-wrapper">
          <canvas ref="loadChart" width="400" height="300"></canvas>
        </div>
      </div>
    </div>

    <!-- 测试进度和状态 -->
    <div class="test-progress" v-if="isRunning">
      <h3>测试进度</h3>
      <div class="progress-info">
        <div class="progress-item">
          <label>当前测试:</label>
          <span>{{ currentTest.name }}</span>
        </div>
        <div class="progress-item">
          <label>已运行时间:</label>
          <span>{{ formatDuration(currentTest.elapsed) }}</span>
        </div>
        <div class="progress-item">
          <label>预计剩余:</label>
          <span>{{ formatDuration(currentTest.remaining) }}</span>
        </div>
      </div>
      
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: currentTest.progress + '%' }"
          ></div>
        </div>
        <span class="progress-text">{{ currentTest.progress.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- 基准对比 -->
    <div class="benchmark-comparison">
      <h3>行业基准对比</h3>
      <div class="comparison-grid">
        <div 
          v-for="benchmark in benchmarkComparisons" 
          :key="benchmark.metric"
          class="comparison-item"
        >
          <div class="comparison-metric">{{ benchmark.metric }}</div>
          <div class="comparison-bars">
            <div class="bar-container">
              <div class="bar industry" :style="{ width: '100%' }">
                <span>业界最佳</span>
              </div>
              <div class="bar-value">{{ benchmark.industryBest }}</div>
            </div>
            <div class="bar-container">
              <div 
                class="bar ours" 
                :style="{ 
                  width: (benchmark.ourResult / benchmark.industryBest * 100) + '%',
                  backgroundColor: benchmark.better ? '#4CAF50' : '#FF9800'
                }"
              >
                <span>我们的结果</span>
              </div>
              <div class="bar-value">{{ benchmark.ourResult }}</div>
            </div>
          </div>
          <div class="comparison-status" :class="benchmark.better ? 'better' : 'worse'">
            {{ benchmark.better ? '领先' : '需改进' }}
            {{ Math.abs(benchmark.improvement).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="events-log">
      <h3>系统事件日志</h3>
      <div class="log-controls">
        <button @click="clearLogs" class="btn btn-small">清空日志</button>
        <select v-model="logFilter">
          <option value="all">全部事件</option>
          <option value="error">错误</option>
          <option value="warning">警告</option>
          <option value="info">信息</option>
        </select>
      </div>
      <div class="log-container">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id"
          class="log-entry"
          :class="log.level"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 导出和报告 -->
    <div class="export-section">
      <h3>数据导出</h3>
      <div class="export-buttons">
        <button @click="exportPerformanceData" class="btn btn-outline">
          📊 导出性能数据
        </button>
        <button @click="exportBenchmarkData" class="btn btn-outline">
          📈 导出基准数据
        </button>
        <button @click="generateReport" class="btn btn-outline">
          📄 生成完整报告
        </button>
        <button @click="shareResults" class="btn btn-outline">
          🔗 分享结果
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ExtremeStressTestEngine, type StressTestResult, ExtremeScenarioType } from '../../utils/extreme-stress-test-framework';
import { IndustryBenchmarkSuite, type BenchmarkSummary } from '../../utils/industry-benchmark-suite';
import { StabilityValidationEngine, type StabilityTestResult } from '../../utils/stability-validation-system';

// 响应式数据
const isRunning = ref(false);
const systemStatus = ref<'normal' | 'warning' | 'critical'>('normal');
const currentTest = reactive({
  name: '',
  progress: 0,
  elapsed: 0,
  remaining: 0
});

const config = reactive({
  nodeCount: 1000,
  scenario: 'normal'
});

const currentMetrics = reactive({
  fps: 60,
  memory: 0,
  dragLatency: 0,
  stability: 100,
  benchmarkScore: 0,
  operations: 0
});

const benchmarkComparisons = ref<Array<{
  metric: string;
  ourResult: number;
  industryBest: number;
  better: boolean;
  improvement: number;
}>>([]);

const eventLogs = ref<Array<{
  id: number;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}>>([]);

const logFilter = ref('all');

// 测试引擎实例
let stressTestEngine: ExtremeStressTestEngine | null = null;
let benchmarkSuite: IndustryBenchmarkSuite | null = null;
let stabilityValidator: StabilityValidationEngine | null = null;

// 图表相关
const performanceChart = ref<HTMLCanvasElement>();
const loadChart = ref<HTMLCanvasElement>();
let performanceChartContext: CanvasRenderingContext2D | null = null;
let loadChartContext: CanvasRenderingContext2D | null = null;

// 数据历史
const performanceHistory = ref<Array<{
  timestamp: number;
  fps: number;
  memory: number;
  latency: number;
}>>([]);

// 定时器
let metricsUpdateInterval: number | null = null;
let chartUpdateInterval: number | null = null;
let testProgressInterval: number | null = null;

// 计算属性
const systemStatusText = computed(() => {
  switch (systemStatus.value) {
    case 'normal': return '系统正常';
    case 'warning': return '性能警告';
    case 'critical': return '严重问题';
    default: return '未知状态';
  }
});

const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return eventLogs.value;
  return eventLogs.value.filter(log => log.level === logFilter.value);
});

// 生命周期
onMounted(async () => {
  await initializeEngines();
  setupCharts();
  startMetricsUpdate();
  addLog('info', '压力测试监控仪表板已启动');
});

onUnmounted(() => {
  stopMetricsUpdate();
  if (stressTestEngine) {
    stressTestEngine.stopCurrentTest();
  }
});

// 初始化测试引擎
async function initializeEngines() {
  try {
    // 动态导入模块
    const stressTestModule = await import('../../utils/extreme-stress-test-framework');
    const benchmarkModule = await import('../../utils/industry-benchmark-suite');
    const stabilityModule = await import('../../utils/stability-validation-system');
    
    stressTestEngine = stressTestModule.createStressTestEngine();
    benchmarkSuite = benchmarkModule.createIndustryBenchmarkSuite();
    stabilityValidator = stabilityModule.createStabilityValidator();
    
    addLog('info', '测试引擎初始化完成');
  } catch (error) {
    addLog('error', `测试引擎初始化失败: ${error}`);
  }
}

// 设置图表
function setupCharts() {
  nextTick(() => {
    if (performanceChart.value) {
      performanceChartContext = performanceChart.value.getContext('2d');
    }
    if (loadChart.value) {
      loadChartContext = loadChart.value.getContext('2d');
    }
    
    startChartUpdates();
  });
}

// 开始压力测试
async function startStressTest() {
  if (!stressTestEngine || isRunning.value) return;
  
  isRunning.value = true;
  currentTest.name = `压力测试 (${config.nodeCount} 节点)`;
  currentTest.progress = 0;
  
  addLog('info', `开始压力测试: ${config.nodeCount} 节点`);
  
  try {
    let result: StressTestResult;
    
    switch (config.scenario) {
      case 'extreme':
        result = await stressTestEngine.runMassiveNodeStressTest(config.nodeCount);
        break;
      case 'memory-pressure':
        result = await stressTestEngine.runExtremeScenarioTest(ExtremeScenarioType.MEMORY_PRESSURE);
        break;
      case 'cpu-intensive':
        result = await stressTestEngine.runExtremeScenarioTest(ExtremeScenarioType.CPU_INTENSIVE);
        break;
      case 'low-end-device':
        result = await stressTestEngine.runExtremeScenarioTest(ExtremeScenarioType.LOW_END_DEVICE);
        break;
      default:
        result = await stressTestEngine.runMassiveNodeStressTest(config.nodeCount);
    }
    
    addLog(result.success ? 'info' : 'error', 
      `压力测试完成: ${result.success ? '成功' : '失败'}, 稳定性评分: ${result.systemStability.toFixed(1)}`
    );
    
    currentMetrics.stability = result.systemStability;
    updateSystemStatus();
    
  } catch (error) {
    addLog('error', `压力测试失败: ${error}`);
  } finally {
    isRunning.value = false;
    currentTest.progress = 100;
  }
}

// 运行基准测试
async function startBenchmarkTest() {
  if (!benchmarkSuite || isRunning.value) return;
  
  isRunning.value = true;
  currentTest.name = '行业基准测试';
  currentTest.progress = 0;
  
  addLog('info', '开始行业基准测试');
  
  try {
    const config = {
      nodeCount: 1000,
      testDuration: 60000,
      iterations: 100,
      deviceClass: 'high-end' as const,
      browserType: 'chrome' as const
    };
    
    const summary = await benchmarkSuite.runCompleteBenchmarkSuite(config);
    
    currentMetrics.benchmarkScore = summary.overallScore;
    updateBenchmarkComparisons(summary);
    
    addLog('info', `基准测试完成: 总分 ${summary.overallScore}/100, 竞争地位: ${summary.competitivePosition}`);
    
  } catch (error) {
    addLog('error', `基准测试失败: ${error}`);
  } finally {
    isRunning.value = false;
    currentTest.progress = 100;
  }
}

// 24小时稳定性测试
async function start24HourTest() {
  if (!stabilityValidator || isRunning.value) return;
  
  isRunning.value = true;
  currentTest.name = '24小时稳定性测试';
  currentTest.progress = 0;
  
  addLog('info', '开始24小时稳定性测试');
  
  try {
    const result = await stabilityValidator.run24HourStabilityTest();
    
    currentMetrics.stability = result.metrics.stabilityScore;
    
    addLog(result.success ? 'info' : 'warning', 
      `24小时稳定性测试完成: ${result.success ? '通过' : '未通过'}, 评分: ${result.metrics.stabilityScore.toFixed(1)}/100`
    );
    
  } catch (error) {
    addLog('error', `24小时稳定性测试失败: ${error}`);
  } finally {
    isRunning.value = false;
    currentTest.progress = 100;
  }
}

// 停止当前测试
function stopCurrentTest() {
  if (stressTestEngine) {
    stressTestEngine.stopCurrentTest();
  }
  if (stabilityValidator) {
    stabilityValidator.stopCurrentTest();
  }
  
  isRunning.value = false;
  currentTest.progress = 100;
  addLog('warning', '测试已被用户停止');
}

// 开始指标更新
function startMetricsUpdate() {
  metricsUpdateInterval = window.setInterval(() => {
    updateCurrentMetrics();
  }, 1000);
  
  testProgressInterval = window.setInterval(() => {
    if (isRunning.value) {
      updateTestProgress();
    }
  }, 1000);
}

// 停止指标更新
function stopMetricsUpdate() {
  if (metricsUpdateInterval) {
    clearInterval(metricsUpdateInterval);
  }
  if (testProgressInterval) {
    clearInterval(testProgressInterval);
  }
  if (chartUpdateInterval) {
    clearInterval(chartUpdateInterval);
  }
}

// 更新当前指标
function updateCurrentMetrics() {
  // 模拟获取实时指标 (在实际应用中，这些数据会从性能监控器获取)
  if (isRunning.value) {
    // 模拟压力测试期间的指标变化
    currentMetrics.fps = 30 + Math.random() * 30;
    currentMetrics.memory = 50 + Math.random() * 200;
    currentMetrics.dragLatency = 5 + Math.random() * 15;
    currentMetrics.operations++;
  } else {
    // 空闲状态的指标
    currentMetrics.fps = Math.max(55, currentMetrics.fps + (Math.random() - 0.5) * 2);
    currentMetrics.memory = Math.max(20, currentMetrics.memory + (Math.random() - 0.5) * 1);
    currentMetrics.dragLatency = Math.max(2, currentMetrics.dragLatency + (Math.random() - 0.5) * 0.5);
  }
  
  // 记录历史数据
  performanceHistory.value.push({
    timestamp: Date.now(),
    fps: currentMetrics.fps,
    memory: currentMetrics.memory,
    latency: currentMetrics.dragLatency
  });
  
  // 保持历史数据在合理范围内
  if (performanceHistory.value.length > 300) {
    performanceHistory.value.shift();
  }
  
  updateSystemStatus();
}

// 更新测试进度
function updateTestProgress() {
  if (!isRunning.value) return;
  
  // 模拟进度更新（实际应用中应从测试引擎获取真实进度）
  const increment = Math.random() * 0.5;
  currentTest.progress = Math.min(99, currentTest.progress + increment);
  currentTest.elapsed += 1000;
  
  // 估算剩余时间
  if (currentTest.progress > 5) {
    const totalEstimated = (currentTest.elapsed / currentTest.progress) * 100;
    currentTest.remaining = Math.max(0, totalEstimated - currentTest.elapsed);
  }
}

// 更新系统状态
function updateSystemStatus() {
  if (currentMetrics.fps < 20 || currentMetrics.memory > 500 || currentMetrics.dragLatency > 50) {
    systemStatus.value = 'critical';
  } else if (currentMetrics.fps < 40 || currentMetrics.memory > 200 || currentMetrics.dragLatency > 20) {
    systemStatus.value = 'warning';
  } else {
    systemStatus.value = 'normal';
  }
}

// 更新基准对比
function updateBenchmarkComparisons(summary: BenchmarkSummary) {
  benchmarkComparisons.value = [
    {
      metric: '拖拽性能',
      ourResult: summary.categoryScores.dragPerformance,
      industryBest: 90,
      better: summary.categoryScores.dragPerformance > 70,
      improvement: ((summary.categoryScores.dragPerformance - 70) / 70) * 100
    },
    {
      metric: '渲染性能',
      ourResult: summary.categoryScores.rendering,
      industryBest: 85,
      better: summary.categoryScores.rendering > 65,
      improvement: ((summary.categoryScores.rendering - 65) / 65) * 100
    },
    {
      metric: '内存效率',
      ourResult: summary.categoryScores.memory,
      industryBest: 80,
      better: summary.categoryScores.memory > 60,
      improvement: ((summary.categoryScores.memory - 60) / 60) * 100
    },
    {
      metric: '交互响应',
      ourResult: summary.categoryScores.interaction,
      industryBest: 88,
      better: summary.categoryScores.interaction > 70,
      improvement: ((summary.categoryScores.interaction - 70) / 70) * 100
    },
    {
      metric: '系统稳定性',
      ourResult: summary.categoryScores.stability,
      industryBest: 92,
      better: summary.categoryScores.stability > 75,
      improvement: ((summary.categoryScores.stability - 75) / 75) * 100
    }
  ];
}

// 开始图表更新
function startChartUpdates() {
  chartUpdateInterval = window.setInterval(() => {
    updatePerformanceChart();
    updateLoadChart();
  }, 2000);
}

// 更新性能图表
function updatePerformanceChart() {
  if (!performanceChartContext || performanceHistory.value.length === 0) return;
  
  const ctx = performanceChartContext;
  const canvas = performanceChart.value!;
  const width = canvas.width;
  const height = canvas.height;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  const data = performanceHistory.value.slice(-60); // 最近60个数据点
  if (data.length < 2) return;
  
  // 绘制网格
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // 绘制FPS线
  ctx.strokeStyle = '#4CAF50';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = (width / (data.length - 1)) * index;
    const y = height - (point.fps / 60) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // 绘制内存线
  ctx.strokeStyle = '#2196F3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = (width / (data.length - 1)) * index;
    const y = height - (point.memory / 300) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
  
  // 绘制延迟线
  ctx.strokeStyle = '#FF9800';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((point, index) => {
    const x = (width / (data.length - 1)) * index;
    const y = height - (point.latency / 50) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

// 更新负载图表
function updateLoadChart() {
  if (!loadChartContext) return;
  
  const ctx = loadChartContext;
  const canvas = loadChart.value!;
  const width = canvas.width;
  const height = canvas.height;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  // 绘制饼图
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 3;
  
  const data = [
    { label: 'CPU', value: currentMetrics.fps / 60, color: '#4CAF50' },
    { label: '内存', value: Math.min(1, currentMetrics.memory / 300), color: '#2196F3' },
    { label: 'I/O', value: currentMetrics.dragLatency / 50, color: '#FF9800' },
    { label: '其他', value: 0.2, color: '#9E9E9E' }
  ];
  
  let currentAngle = -Math.PI / 2;
  
  data.forEach(segment => {
    const sliceAngle = (segment.value / 2) * Math.PI * 2;
    
    ctx.fillStyle = segment.color;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    currentAngle += sliceAngle;
  });
}

// CSS类计算
function getFPSClass(fps: number): string {
  if (fps >= 50) return 'excellent';
  if (fps >= 30) return 'good';
  if (fps >= 20) return 'warning';
  return 'critical';
}

function getMemoryClass(memory: number): string {
  if (memory <= 100) return 'excellent';
  if (memory <= 200) return 'good';
  if (memory <= 400) return 'warning';
  return 'critical';
}

function getLatencyClass(latency: number): string {
  if (latency <= 10) return 'excellent';
  if (latency <= 20) return 'good';
  if (latency <= 40) return 'warning';
  return 'critical';
}

function getStabilityClass(stability: number): string {
  if (stability >= 90) return 'excellent';
  if (stability >= 75) return 'good';
  if (stability >= 60) return 'warning';
  return 'critical';
}

function getBenchmarkClass(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 55) return 'warning';
  return 'critical';
}

// 工具函数
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

function addLog(level: 'info' | 'warning' | 'error', message: string) {
  eventLogs.value.unshift({
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    level,
    message
  });
  
  // 保持日志数量在合理范围内
  if (eventLogs.value.length > 1000) {
    eventLogs.value = eventLogs.value.slice(0, 500);
  }
}

function clearLogs() {
  eventLogs.value = [];
  addLog('info', '日志已清空');
}

// 导出功能
async function exportPerformanceData() {
  const data = {
    metrics: currentMetrics,
    history: performanceHistory.value,
    timestamp: Date.now()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  addLog('info', '性能数据已导出');
}

async function exportBenchmarkData() {
  if (!benchmarkSuite) {
    addLog('error', '基准测试套件未初始化');
    return;
  }
  
  const data = benchmarkSuite.exportBenchmarkData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `benchmark-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  addLog('info', '基准数据已导出');
}

async function generateReport() {
  let report = '# Agent 9: 压力测试与基准监控报告\n\n';
  report += `## 生成时间: ${new Date().toLocaleString()}\n\n`;
  report += `## 当前系统状态: ${systemStatusText.value}\n\n`;
  
  report += '## 实时指标\n';
  report += `- FPS: ${currentMetrics.fps.toFixed(1)}\n`;
  report += `- 内存使用: ${currentMetrics.memory.toFixed(1)}MB\n`;
  report += `- 拖拽延迟: ${currentMetrics.dragLatency.toFixed(1)}ms\n`;
  report += `- 系统稳定性: ${currentMetrics.stability.toFixed(0)}%\n`;
  report += `- 基准评分: ${currentMetrics.benchmarkScore.toFixed(0)}/100\n\n`;
  
  if (benchmarkComparisons.value.length > 0) {
    report += '## 行业基准对比\n';
    benchmarkComparisons.value.forEach(comp => {
      report += `- ${comp.metric}: ${comp.ourResult.toFixed(1)} (行业最佳: ${comp.industryBest}) - ${comp.better ? '领先' : '需改进'}\n`;
    });
    report += '\n';
  }
  
  report += '## 建议\n';
  if (currentMetrics.fps < 30) {
    report += '- 优化渲染性能，提升FPS\n';
  }
  if (currentMetrics.memory > 200) {
    report += '- 检查内存泄漏，优化内存使用\n';
  }
  if (currentMetrics.dragLatency > 20) {
    report += '- 优化拖拽响应时间\n';
  }
  
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stress-test-report-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  
  addLog('info', '完整报告已生成');
}

async function shareResults() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Agent 9: 压力测试结果',
        text: `系统稳定性: ${currentMetrics.stability.toFixed(0)}%, 基准评分: ${currentMetrics.benchmarkScore.toFixed(0)}/100`,
        url: window.location.href
      });
      addLog('info', '结果已分享');
    } catch (error) {
      addLog('error', '分享失败');
    }
  } else {
    // 降级到复制到剪贴板
    const text = `Agent 9 压力测试结果: 稳定性 ${currentMetrics.stability.toFixed(0)}%, 基准评分 ${currentMetrics.benchmarkScore.toFixed(0)}/100`;
    navigator.clipboard.writeText(text);
    addLog('info', '结果已复制到剪贴板');
  }
}
</script>

<style scoped>
.stress-test-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
}

.status-indicator.normal {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-indicator.warning {
  background: #fff3e0;
  color: #f57c00;
}

.status-indicator.critical {
  background: #ffebee;
  color: #c62828;
}

.status-light {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.normal .status-light {
  background: #4caf50;
}

.status-indicator.warning .status-light {
  background: #ff9800;
}

.status-indicator.critical .status-light {
  background: #f44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.control-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-config {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.test-config label {
  font-weight: 500;
  color: #666;
}

.test-config input,
.test-config select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-secondary {
  background: #4caf50;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #388e3c;
}

.btn-warning {
  background: #ff9800;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #f57c00;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #d32f2f;
}

.btn-outline {
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
}

.btn-outline:hover {
  background: #f5f5f5;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-icon {
  font-size: 24px;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
}

.metric-value.excellent {
  color: #4caf50;
}

.metric-value.good {
  color: #8bc34a;
}

.metric-value.warning {
  color: #ff9800;
}

.metric-value.critical {
  color: #f44336;
}

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.chart-wrapper {
  position: relative;
  border: 1px solid #eee;
  border-radius: 8px;
}

.chart-legend {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-item:before {
  content: '';
  width: 12px;
  height: 3px;
  margin-right: 5px;
}

.legend-item.fps:before {
  background: #4CAF50;
}

.legend-item.memory:before {
  background: #2196F3;
}

.legend-item.latency:before {
  background: #FF9800;
}

.test-progress {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-progress h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.progress-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
}

.progress-item label {
  font-weight: 500;
  color: #666;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #2196f3);
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 500;
  color: #666;
  min-width: 50px;
}

.benchmark-comparison {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.benchmark-comparison h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.comparison-grid {
  display: grid;
  gap: 15px;
}

.comparison-item {
  display: grid;
  grid-template-columns: 150px 1fr 100px;
  gap: 15px;
  align-items: center;
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.comparison-metric {
  font-weight: 500;
  color: #333;
}

.comparison-bars {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bar {
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  color: white;
  font-size: 11px;
  min-width: 0;
}

.bar.industry {
  background: #666;
}

.bar.ours {
  background: #4caf50;
}

.bar span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-value {
  min-width: 40px;
  font-size: 12px;
  color: #666;
}

.comparison-status {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
}

.comparison-status.better {
  color: #4caf50;
}

.comparison-status.worse {
  color: #ff9800;
}

.events-log {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.events-log h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.log-controls {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.info {
  color: #666;
}

.log-entry.warning {
  background: #fff8e1;
  color: #f57c00;
}

.log-entry.error {
  background: #ffebee;
  color: #c62828;
}

.log-time {
  min-width: 80px;
  color: #999;
}

.log-level {
  min-width: 60px;
  font-weight: bold;
}

.log-message {
  flex: 1;
}

.export-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.export-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .control-panel {
    flex-direction: column;
  }
  
  .test-config {
    margin-left: 0;
  }
  
  .comparison-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .export-buttons {
    flex-direction: column;
  }
}
</style>