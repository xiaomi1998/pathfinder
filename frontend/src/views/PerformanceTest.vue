<template>
  <div class="performance-test-container">
    <div class="header">
      <h1>拖拽系统性能测试与对比</h1>
      <p class="subtitle">对比优化前后的性能表现，验证Agent 2的优化效果</p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="controls">
        <button 
          @click="runBasicTest" 
          :disabled="isTestRunning"
          class="btn btn-primary"
        >
          基础性能测试
        </button>
        
        <button 
          @click="runOptimizedTest" 
          :disabled="isTestRunning"
          class="btn btn-success"
        >
          优化性能测试
        </button>
        
        <button 
          @click="runBenchmarkSuite" 
          :disabled="isTestRunning"
          class="btn btn-info"
        >
          完整基准测试
        </button>
        
        <button 
          @click="clearResults" 
          :disabled="isTestRunning"
          class="btn btn-secondary"
        >
          清空结果
        </button>
      </div>
      
      <div class="test-config">
        <div class="config-group">
          <label>测试节点数量:</label>
          <select v-model="testConfig.nodeCount" :disabled="isTestRunning">
            <option value="10">10</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
        
        <div class="config-group">
          <label>拖拽操作数:</label>
          <select v-model="testConfig.dragOperations" :disabled="isTestRunning">
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </div>
        
        <div class="config-group">
          <label>测试持续时间(秒):</label>
          <select v-model="testConfig.duration" :disabled="isTestRunning">
            <option value="10">10</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 实时性能监控 -->
    <div class="monitoring-panel">
      <h2>实时性能监控</h2>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>FPS</h3>
          <div class="metric-value" :class="getFPSClass(currentStats?.realtime?.avgFps)">
            {{ currentStats?.realtime?.avgFps?.toFixed(1) || '0.0' }}
          </div>
          <div class="metric-target">目标: 58-60 FPS</div>
        </div>
        
        <div class="metric-card">
          <h3>内存使用</h3>
          <div class="metric-value" :class="getMemoryClass(memoryUsageRate)">
            {{ memoryUsageRate.toFixed(1) }}%
          </div>
          <div class="metric-target">目标: <80%</div>
        </div>
        
        <div class="metric-card">
          <h3>帧时间</h3>
          <div class="metric-value" :class="getFrameTimeClass(currentStats?.realtime?.avgFrameTime)">
            {{ currentStats?.realtime?.avgFrameTime?.toFixed(2) || '0.00' }}ms
          </div>
          <div class="metric-target">目标: <16.67ms</div>
        </div>
        
        <div class="metric-card">
          <h3>事件延迟</h3>
          <div class="metric-value" :class="getLatencyClass(currentStats?.events?.averageProcessingTime)">
            {{ currentStats?.events?.averageProcessingTime?.toFixed(2) || '0.00' }}ms
          </div>
          <div class="metric-target">目标: <10ms</div>
        </div>
      </div>
      
      <!-- 性能警告 -->
      <div v-if="recentWarnings.length > 0" class="warnings-section">
        <h3>性能警告</h3>
        <div class="warnings-list">
          <div 
            v-for="warning in recentWarnings" 
            :key="warning.timestamp"
            :class="['warning-item', `warning-${warning.level}`]"
          >
            <div class="warning-header">
              <span class="warning-category">{{ warning.category.toUpperCase() }}</span>
              <span class="warning-level">{{ warning.level.toUpperCase() }}</span>
            </div>
            <div class="warning-message">{{ warning.message }}</div>
            <div class="warning-suggestion">建议: {{ warning.suggestion }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试结果对比 -->
    <div v-if="testResults.length > 0" class="results-panel">
      <h2>测试结果对比</h2>
      
      <div class="results-tabs">
        <button 
          v-for="tab in resultTabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>
      
      <div class="results-content">
        <!-- 性能对比表格 -->
        <div v-if="activeTab === 'comparison'" class="comparison-table">
          <table>
            <thead>
              <tr>
                <th>测试类型</th>
                <th>FPS</th>
                <th>内存使用(MB)</th>
                <th>平均帧时间(ms)</th>
                <th>事件延迟(ms)</th>
                <th>拖拽精度</th>
                <th>综合评分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in testResults" :key="result.id">
                <td>{{ result.type }}</td>
                <td :class="getFPSClass(result.metrics.avgFPS)">
                  {{ result.metrics.avgFPS.toFixed(1) }}
                </td>
                <td>{{ result.metrics.memoryUsage.toFixed(1) }}</td>
                <td :class="getFrameTimeClass(result.metrics.avgFrameTime)">
                  {{ result.metrics.avgFrameTime.toFixed(2) }}
                </td>
                <td :class="getLatencyClass(result.metrics.eventLatency)">
                  {{ result.metrics.eventLatency.toFixed(2) }}
                </td>
                <td>{{ result.metrics.precision.toFixed(3) }}</td>
                <td :class="getScoreClass(result.metrics.score)">
                  {{ result.metrics.score }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 性能图表 -->
        <div v-if="activeTab === 'charts'" class="performance-charts">
          <div class="chart-container">
            <canvas ref="fpsChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas ref="memoryChart"></canvas>
          </div>
        </div>
        
        <!-- 详细报告 -->
        <div v-if="activeTab === 'report'" class="detailed-report">
          <pre>{{ performanceReport }}</pre>
        </div>
        
        <!-- 基准测试结果 -->
        <div v-if="activeTab === 'benchmarks'" class="benchmark-results">
          <div v-if="benchmarkResults" class="benchmark-section">
            <h3>拖拽性能基准测试</h3>
            
            <div class="benchmark-grid">
              <div class="benchmark-item">
                <h4>Vector2D 操作</h4>
                <div class="benchmark-metrics">
                  <div>平均时间: {{ benchmarkResults.dragSuite.vector2DOperations.avgTime }}ms</div>
                  <div>操作/秒: {{ benchmarkResults.dragSuite.vector2DOperations.opsPerSecond }}</div>
                  <div>标准差: {{ benchmarkResults.dragSuite.vector2DOperations.stdDev }}ms</div>
                </div>
              </div>
              
              <div class="benchmark-item">
                <h4>坐标变换</h4>
                <div class="benchmark-metrics">
                  <div>平均时间: {{ benchmarkResults.dragSuite.coordinateTransform.avgTime }}ms</div>
                  <div>操作/秒: {{ benchmarkResults.dragSuite.coordinateTransform.opsPerSecond }}</div>
                  <div>标准差: {{ benchmarkResults.dragSuite.coordinateTransform.stdDev }}ms</div>
                </div>
              </div>
              
              <div class="benchmark-item">
                <h4>边界检测</h4>
                <div class="benchmark-metrics">
                  <div>平均时间: {{ benchmarkResults.dragSuite.boundaryDetection.avgTime }}ms</div>
                  <div>操作/秒: {{ benchmarkResults.dragSuite.boundaryDetection.opsPerSecond }}</div>
                  <div>标准差: {{ benchmarkResults.dragSuite.boundaryDetection.stdDev }}ms</div>
                </div>
              </div>
              
              <div class="benchmark-item">
                <h4>精度计算</h4>
                <div class="benchmark-metrics">
                  <div>平均时间: {{ benchmarkResults.dragSuite.precisionCalculation.avgTime }}ms</div>
                  <div>操作/秒: {{ benchmarkResults.dragSuite.precisionCalculation.opsPerSecond }}</div>
                  <div>标准差: {{ benchmarkResults.dragSuite.precisionCalculation.stdDev }}ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试进度 -->
    <div v-if="isTestRunning" class="progress-panel">
      <h3>测试进行中...</h3>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: testProgress + '%' }"></div>
      </div>
      <div class="progress-text">{{ testStatus }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  performanceOptimizer, 
  type ComprehensivePerformanceStats,
  type PerformanceWarning,
  runPerformanceBenchmarks
} from '@/utils/performance-optimizer'

// 响应式状态
const isTestRunning = ref(false)
const testProgress = ref(0)
const testStatus = ref('')
const currentStats = ref<ComprehensivePerformanceStats | null>(null)
const recentWarnings = ref<PerformanceWarning[]>([])
const performanceReport = ref('')
const benchmarkResults = ref<any>(null)

// 测试配置
const testConfig = ref({
  nodeCount: 50,
  dragOperations: 500,
  duration: 30
})

// 测试结果
interface TestResult {
  id: string
  type: string
  timestamp: number
  metrics: {
    avgFPS: number
    memoryUsage: number
    avgFrameTime: number
    eventLatency: number
    precision: number
    score: number
  }
}

const testResults = ref<TestResult[]>([])

// UI状态
const activeTab = ref('comparison')
const resultTabs = [
  { id: 'comparison', label: '性能对比' },
  { id: 'charts', label: '性能图表' },
  { id: 'report', label: '详细报告' },
  { id: 'benchmarks', label: '基准测试' }
]

// 计算属性
const memoryUsageRate = computed(() => {
  if (!currentStats.value?.memory) return 0
  const { usedHeapSize, heapSizeLimit } = currentStats.value.memory
  return heapSizeLimit > 0 ? (usedHeapSize / heapSizeLimit) * 100 : 0
})

// 性能等级判断函数
const getFPSClass = (fps?: number) => {
  if (!fps) return 'metric-unknown'
  if (fps >= 58) return 'metric-excellent'
  if (fps >= 45) return 'metric-good'
  if (fps >= 30) return 'metric-warning'
  return 'metric-critical'
}

const getMemoryClass = (usage: number) => {
  if (usage < 60) return 'metric-excellent'
  if (usage < 80) return 'metric-good'
  if (usage < 90) return 'metric-warning'
  return 'metric-critical'
}

const getFrameTimeClass = (frameTime?: number) => {
  if (!frameTime) return 'metric-unknown'
  if (frameTime <= 16.67) return 'metric-excellent'
  if (frameTime <= 20) return 'metric-good'
  if (frameTime <= 33.33) return 'metric-warning'
  return 'metric-critical'
}

const getLatencyClass = (latency?: number) => {
  if (!latency) return 'metric-unknown'
  if (latency <= 5) return 'metric-excellent'
  if (latency <= 10) return 'metric-good'
  if (latency <= 20) return 'metric-warning'
  return 'metric-critical'
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'metric-excellent'
  if (score >= 80) return 'metric-good'
  if (score >= 70) return 'metric-warning'
  return 'metric-critical'
}

// 监控更新
let monitoringInterval: number | null = null

const updateMonitoring = () => {
  currentStats.value = performanceOptimizer.getCurrentPerformanceState()
  recentWarnings.value = performanceOptimizer.getRecentWarnings(5)
  performanceReport.value = performanceOptimizer.generatePerformanceReport()
}

// 测试方法
const runBasicTest = async () => {
  isTestRunning.value = true
  testProgress.value = 0
  testStatus.value = '初始化基础测试...'
  
  try {
    // 禁用所有优化功能
    performanceOptimizer.updateConfig({
      enableMemoryOptimization: false,
      enableRenderOptimization: false,
      enableEventOptimization: false,
      enableCacheOptimization: false
    })
    
    await simulatePerformanceTest('基础版本', false)
    
  } catch (error) {
    console.error('基础测试失败:', error)
  } finally {
    isTestRunning.value = false
    testProgress.value = 100
    testStatus.value = '基础测试完成'
  }
}

const runOptimizedTest = async () => {
  isTestRunning.value = true
  testProgress.value = 0
  testStatus.value = '初始化优化测试...'
  
  try {
    // 启用所有优化功能
    performanceOptimizer.updateConfig({
      enableMemoryOptimization: true,
      enableRenderOptimization: true,
      enableEventOptimization: true,
      enableCacheOptimization: true
    })
    
    await simulatePerformanceTest('优化版本', true)
    
  } catch (error) {
    console.error('优化测试失败:', error)
  } finally {
    isTestRunning.value = false
    testProgress.value = 100
    testStatus.value = '优化测试完成'
  }
}

const runBenchmarkSuite = async () => {
  isTestRunning.value = true
  testProgress.value = 0
  testStatus.value = '运行基准测试套件...'
  
  try {
    benchmarkResults.value = await runPerformanceBenchmarks()
    activeTab.value = 'benchmarks'
  } catch (error) {
    console.error('基准测试失败:', error)
  } finally {
    isTestRunning.value = false
    testProgress.value = 100
    testStatus.value = '基准测试完成'
  }
}

const simulatePerformanceTest = async (testType: string, optimized: boolean) => {
  const operations = testConfig.value.dragOperations
  
  // 模拟拖拽操作
  let fpsSum = 0
  let frameTimeSum = 0
  let memorySum = 0
  let latencySum = 0
  let samples = 0
  
  performanceOptimizer.startDragAnalysis()
  
  for (let i = 0; i < operations; i++) {
    testProgress.value = (i / operations) * 100
    testStatus.value = `执行操作 ${i + 1}/${operations}`
    
    // 模拟拖拽操作
    const operationStart = performance.now()
    
    // 记录拖拽位置
    performanceOptimizer.recordDragPosition(
      Math.random() * 1000,
      Math.random() * 800
    )
    
    // 模拟计算延迟
    await new Promise(resolve => {
      const delay = optimized ? Math.random() * 2 : Math.random() * 8
      setTimeout(resolve, delay)
    })
    
    const operationEnd = performance.now()
    const frameTime = operationEnd - operationStart
    
    performanceOptimizer.recordDragFrameTime(frameTime)
    
    // 收集性能指标
    const stats = performanceOptimizer.getCurrentPerformanceState()
    if (stats.realtime) {
      fpsSum += stats.realtime.avgFps
      frameTimeSum += stats.realtime.avgFrameTime
      memorySum += stats.memory.usedHeapSize
      latencySum += stats.events.averageProcessingTime
      samples++
    }
    
    // 每50次操作暂停一下，避免阻塞UI
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
  }
  
  const dragAnalysis = performanceOptimizer.endDragAnalysis()
  
  // 计算平均指标
  const avgFPS = samples > 0 ? fpsSum / samples : 0
  const avgFrameTime = samples > 0 ? frameTimeSum / samples : 0
  const avgMemory = samples > 0 ? memorySum / samples : 0
  const avgLatency = samples > 0 ? latencySum / samples : 0
  
  // 计算综合评分
  let score = 0
  if (avgFPS >= 58) score += 30
  else if (avgFPS >= 45) score += 25
  else if (avgFPS >= 30) score += 15
  
  if (avgFrameTime <= 16.67) score += 25
  else if (avgFrameTime <= 20) score += 20
  else if (avgFrameTime <= 33.33) score += 10
  
  if (avgLatency <= 5) score += 25
  else if (avgLatency <= 10) score += 20
  else if (avgLatency <= 20) score += 10
  
  if (dragAnalysis) {
    score += dragAnalysis.score * 0.2
  }
  
  // 保存测试结果
  const result: TestResult = {
    id: `test_${Date.now()}`,
    type: testType,
    timestamp: Date.now(),
    metrics: {
      avgFPS: avgFPS,
      memoryUsage: avgMemory,
      avgFrameTime: avgFrameTime,
      eventLatency: avgLatency,
      precision: dragAnalysis?.precision || 0,
      score: Math.round(score)
    }
  }
  
  testResults.value.push(result)
}

const clearResults = () => {
  testResults.value = []
  benchmarkResults.value = null
  recentWarnings.value = []
  performanceOptimizer.clearWarnings()
}

// 监听性能警告
const handleWarning = (warning: PerformanceWarning) => {
  recentWarnings.value.unshift(warning)
  if (recentWarnings.value.length > 10) {
    recentWarnings.value.pop()
  }
}

// 生命周期
onMounted(() => {
  // 启动性能监控
  performanceOptimizer.startMonitoring()
  
  // 设置监控更新
  monitoringInterval = window.setInterval(updateMonitoring, 1000)
  
  // 监听性能警告
  performanceOptimizer.onWarning(handleWarning)
  
  // 初始更新
  updateMonitoring()
})

onUnmounted(() => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }
  
  performanceOptimizer.offWarning(handleWarning)
  performanceOptimizer.stopMonitoring()
})
</script>

<style scoped>
.performance-test-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
}

.control-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary { background: #007bff; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-info { background: #17a2b8; color: white; }
.btn-secondary { background: #6c757d; color: white; }

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.test-config {
  display: flex;
  gap: 20px;
}

.config-group {
  display: flex;
  flex-direction: column;
}

.config-group label {
  font-weight: 600;
  margin-bottom: 5px;
  color: #495057;
}

.config-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.monitoring-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.monitoring-panel h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.metric-card h3 {
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.metric-target {
  font-size: 12px;
  color: #6c757d;
}

.metric-excellent { color: #28a745; }
.metric-good { color: #ffc107; }
.metric-warning { color: #fd7e14; }
.metric-critical { color: #dc3545; }
.metric-unknown { color: #6c757d; }

.warnings-section {
  border-top: 1px solid #dee2e6;
  padding-top: 20px;
}

.warnings-section h3 {
  color: #dc3545;
  margin-bottom: 15px;
}

.warnings-list {
  max-height: 200px;
  overflow-y: auto;
}

.warning-item {
  background: #f8f9fa;
  border-left: 4px solid;
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 0 6px 6px 0;
}

.warning-info { border-left-color: #17a2b8; }
.warning-warning { border-left-color: #ffc107; }
.warning-critical { border-left-color: #dc3545; }

.warning-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 5px;
}

.warning-message {
  color: #495057;
  margin-bottom: 5px;
}

.warning-suggestion {
  color: #6c757d;
  font-size: 14px;
}

.results-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.results-tabs {
  display: flex;
  border-bottom: 2px solid #dee2e6;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  color: #6c757d;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.comparison-table {
  overflow-x: auto;
}

.comparison-table table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.comparison-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.detailed-report pre {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
}

.benchmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.benchmark-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.benchmark-item h4 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.benchmark-metrics {
  font-size: 14px;
}

.benchmark-metrics > div {
  margin-bottom: 5px;
  color: #495057;
}

.progress-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  z-index: 1000;
  min-width: 300px;
}

.progress-panel h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #2c3e50;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #28a745);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.performance-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-container {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .controls {
    flex-wrap: wrap;
  }
  
  .test-config {
    flex-direction: column;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .performance-charts {
    grid-template-columns: 1fr;
  }
}
</style>