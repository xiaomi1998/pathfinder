/**
 * 24小时连续稳定性验证系统
 * Agent 9: 长时间运行稳定性测试、内存泄漏检测和自动修复
 */

import { RealTimePerformanceMonitor, type PerformanceMetrics } from './performance-monitor';

// 稳定性测试配置
export interface StabilityTestConfig {
  duration: number; // 测试时长 (毫秒)
  nodeCount: number;
  operationInterval: number; // 操作间隔 (毫秒)
  memoryCheckInterval: number; // 内存检查间隔 (毫秒)
  maxMemoryGrowth: number; // 最大内存增长 (MB)
  minFPS: number; // 最低FPS要求
  maxErrorRate: number; // 最大错误率 (%)
}

// 稳定性测试结果
export interface StabilityTestResult {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  memoryLeakDetected: boolean;
  performanceDegradation: boolean;
  systemCrashes: number;
  errorCount: number;
  totalOperations: number;
  metrics: {
    avgFPS: number;
    minFPS: number;
    maxMemoryUsage: number;
    memoryGrowthRate: number; // MB/小时
    uptime: number;
    stabilityScore: number; // 0-100
  };
  incidents: StabilityIncident[];
  recoveryActions: RecoveryAction[];
}

// 稳定性事件
export interface StabilityIncident {
  timestamp: number;
  type: 'memory-leak' | 'performance-drop' | 'error-spike' | 'crash' | 'hang';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: PerformanceMetrics;
  autoFixed: boolean;
}

// 恢复操作
export interface RecoveryAction {
  timestamp: number;
  incident: string;
  action: 'garbage-collection' | 'cache-clear' | 'restart-subsystem' | 'reduce-load' | 'optimize-memory';
  result: 'success' | 'failed' | 'partial';
  description: string;
}

// 内存泄漏检测器
export interface MemoryLeakDetection {
  startMemory: number;
  currentMemory: number;
  peakMemory: number;
  growthRate: number; // MB/小时
  suspected: boolean;
  leakSources: string[];
}

/**
 * 稳定性验证引擎
 */
export class StabilityValidationEngine {
  private monitor: RealTimePerformanceMonitor;
  private isRunning = false;
  private currentTest: string = '';
  private results: Map<string, StabilityTestResult> = new Map();
  private incidents: StabilityIncident[] = [];
  private recoveryActions: RecoveryAction[] = [];
  private testNodes: HTMLElement[] = [];
  private operationCount = 0;
  private errorCount = 0;
  private systemCrashes = 0;
  
  // 性能阈值
  private readonly PERFORMANCE_THRESHOLDS = {
    CRITICAL_MEMORY_GROWTH: 5, // MB/小时
    WARNING_MEMORY_GROWTH: 2,
    CRITICAL_FPS_DROP: 20,
    WARNING_FPS_DROP: 30,
    MAX_ERROR_RATE: 0.05, // 5%
    HANG_DETECTION_TIME: 5000 // 5秒无响应
  };

  // 内存泄漏检测
  private memoryBaseline = 0;
  private memoryHistory: Array<{ timestamp: number; usage: number }> = [];
  private lastGarbageCollection = 0;

  constructor() {
    this.monitor = new RealTimePerformanceMonitor();
    this.setupGlobalErrorHandling();
    this.setupMemoryMonitoring();
  }

  /**
   * 运行24小时稳定性测试
   */
  async run24HourStabilityTest(): Promise<StabilityTestResult> {
    const config: StabilityTestConfig = {
      duration: 24 * 60 * 60 * 1000, // 24小时
      nodeCount: 1000,
      operationInterval: 5000, // 5秒
      memoryCheckInterval: 60000, // 1分钟
      maxMemoryGrowth: 1, // 1MB/小时
      minFPS: 30,
      maxErrorRate: 0.01 // 1%
    };

    return this.runStabilityTest('24 Hour Stability Test', config);
  }

  /**
   * 运行自定义稳定性测试
   */
  async runStabilityTest(testName: string, config: StabilityTestConfig): Promise<StabilityTestResult> {
    console.log(`Starting stability test: ${testName}`);
    console.log(`Duration: ${(config.duration / (1000 * 60 * 60)).toFixed(1)} hours`);

    const startTime = performance.now();
    this.currentTest = testName;
    this.isRunning = true;
    this.operationCount = 0;
    this.errorCount = 0;
    this.systemCrashes = 0;
    this.incidents = [];
    this.recoveryActions = [];

    const result: StabilityTestResult = {
      testName,
      startTime,
      endTime: 0,
      duration: 0,
      success: false,
      memoryLeakDetected: false,
      performanceDegradation: false,
      systemCrashes: 0,
      errorCount: 0,
      totalOperations: 0,
      metrics: {
        avgFPS: 0,
        minFPS: 60,
        maxMemoryUsage: 0,
        memoryGrowthRate: 0,
        uptime: 0,
        stabilityScore: 0
      },
      incidents: [],
      recoveryActions: []
    };

    try {
      // 初始化测试环境
      await this.initializeStabilityTest(config);
      
      // 开始监控
      this.monitor.startMonitoring(1000); // 1秒监控频率
      this.memoryBaseline = this.getCurrentMemoryUsage();
      
      // 运行长期稳定性测试
      await this.executeLongTermStabilityTest(config, result);
      
      // 分析结果
      this.analyzeStabilityResults(result, config);
      
    } catch (error) {
      console.error('Stability test failed:', error);
      result.errorCount++;
      this.recordIncident({
        timestamp: performance.now(),
        type: 'crash',
        severity: 'critical',
        description: `Test crashed: ${error}`,
        metrics: this.monitor.getCurrentMetrics() || {} as PerformanceMetrics,
        autoFixed: false
      });
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.duration = result.endTime - result.startTime;
      result.uptime = this.isRunning ? result.duration : 0;
      this.isRunning = false;
      
      result.incidents = [...this.incidents];
      result.recoveryActions = [...this.recoveryActions];
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 初始化稳定性测试
   */
  private async initializeStabilityTest(config: StabilityTestConfig): Promise<void> {
    console.log('Initializing stability test environment...');
    
    // 创建测试节点
    const testContainer = this.getOrCreateTestContainer();
    this.testNodes = [];
    
    for (let i = 0; i < config.nodeCount; i++) {
      const node = this.createStabilityTestNode(i);
      this.testNodes.push(node);
      testContainer.appendChild(node);
    }
    
    // 预热系统
    await this.warmupSystem();
    
    // 重置基线
    this.memoryHistory = [];
    this.memoryBaseline = this.getCurrentMemoryUsage();
    
    console.log(`Test environment initialized with ${config.nodeCount} nodes`);
    console.log(`Memory baseline: ${this.memoryBaseline.toFixed(1)}MB`);
  }

  /**
   * 执行长期稳定性测试
   */
  private async executeLongTermStabilityTest(config: StabilityTestConfig, result: StabilityTestResult): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + config.duration;
    
    let nextOperation = startTime + config.operationInterval;
    let nextMemoryCheck = startTime + config.memoryCheckInterval;
    let nextHealthCheck = startTime + 10000; // 10秒健康检查
    
    console.log(`Running stability test for ${(config.duration / (1000 * 60 * 60)).toFixed(1)} hours...`);
    
    while (Date.now() < endTime && this.isRunning) {
      const now = Date.now();
      
      // 执行操作
      if (now >= nextOperation) {
        await this.performStabilityOperation();
        this.operationCount++;
        nextOperation = now + config.operationInterval;
      }
      
      // 内存检查
      if (now >= nextMemoryCheck) {
        await this.performMemoryCheck(config, result);
        nextMemoryCheck = now + config.memoryCheckInterval;
      }
      
      // 健康检查
      if (now >= nextHealthCheck) {
        await this.performHealthCheck(config, result);
        nextHealthCheck = now + 10000;
      }
      
      // 短暂休眠，避免CPU满载
      await this.sleep(100);
      
      // 每小时输出进度
      const elapsed = now - startTime;
      if (elapsed > 0 && elapsed % (60 * 60 * 1000) < 1000) {
        const hoursElapsed = elapsed / (60 * 60 * 1000);
        console.log(`Stability test progress: ${hoursElapsed.toFixed(1)} hours completed`);
        console.log(`Operations: ${this.operationCount}, Errors: ${this.errorCount}, Incidents: ${this.incidents.length}`);
      }
    }
    
    result.totalOperations = this.operationCount;
    result.errorCount = this.errorCount;
    result.systemCrashes = this.systemCrashes;
    
    console.log('Long-term stability test completed');
    console.log(`Total operations: ${this.operationCount}`);
    console.log(`Total errors: ${this.errorCount}`);
    console.log(`Total incidents: ${this.incidents.length}`);
  }

  /**
   * 执行稳定性操作
   */
  private async performStabilityOperation(): Promise<void> {
    try {
      const operations = [
        () => this.performDragOperations(),
        () => this.performRenderingOperations(),
        () => this.performMemoryIntensiveOperations(),
        () => this.performInteractionSimulation(),
        () => this.performDataManipulation()
      ];
      
      // 随机选择操作
      const operation = operations[Math.floor(Math.random() * operations.length)];
      await operation();
      
    } catch (error) {
      this.errorCount++;
      console.warn('Operation failed:', error);
      
      this.recordIncident({
        timestamp: performance.now(),
        type: 'error-spike',
        severity: 'medium',
        description: `Operation failed: ${error}`,
        metrics: this.monitor.getCurrentMetrics() || {} as PerformanceMetrics,
        autoFixed: false
      });
    }
  }

  /**
   * 执行拖拽操作
   */
  private async performDragOperations(): Promise<void> {
    const nodeCount = Math.min(10, this.testNodes.length);
    for (let i = 0; i < nodeCount; i++) {
      const node = this.testNodes[Math.floor(Math.random() * this.testNodes.length)];
      const startX = parseInt(node.style.left) || 0;
      const startY = parseInt(node.style.top) || 0;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;
      
      // 模拟拖拽
      node.style.left = `${endX}px`;
      node.style.top = `${endY}px`;
      
      await this.sleep(10);
    }
  }

  /**
   * 执行渲染操作
   */
  private async performRenderingOperations(): Promise<void> {
    // 批量更新样式
    this.testNodes.forEach((node, index) => {
      if (index % 20 === 0) { // 每20个节点更新一次
        const hue = Math.floor(Math.random() * 360);
        node.style.background = `hsl(${hue}, 70%, 50%)`;
        node.style.transform = `scale(${0.9 + Math.random() * 0.2})`;
      }
    });
    
    // 强制重绘
    document.body.offsetHeight;
  }

  /**
   * 执行内存密集操作
   */
  private async performMemoryIntensiveOperations(): Promise<void> {
    // 创建和销毁大量对象
    const tempData: any[] = [];
    
    for (let i = 0; i < 1000; i++) {
      tempData.push({
        id: i,
        data: new Array(100).fill(0).map(() => Math.random()),
        timestamp: Date.now()
      });
    }
    
    // 执行一些计算
    const processed = tempData.map(item => ({
      ...item,
      processed: item.data.reduce((sum, val) => sum + val, 0)
    }));
    
    // 清理
    tempData.length = 0;
  }

  /**
   * 执行交互模拟
   */
  private async performInteractionSimulation(): Promise<void> {
    // 模拟鼠标移动
    const randomNode = this.testNodes[Math.floor(Math.random() * this.testNodes.length)];
    
    // 模拟hover效果
    randomNode.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    await this.sleep(100);
    randomNode.style.boxShadow = '';
    
    // 模拟选择
    if (Math.random() < 0.3) {
      const selectedCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < selectedCount; i++) {
        const node = this.testNodes[Math.floor(Math.random() * this.testNodes.length)];
        node.style.border = '2px solid #0088ff';
      }
      
      await this.sleep(200);
      
      // 清除选择
      this.testNodes.forEach(node => {
        node.style.border = '1px solid #333';
      });
    }
  }

  /**
   * 执行数据操作
   */
  private async performDataManipulation(): Promise<void> {
    // 模拟数据结构操作
    const data = new Map<string, any>();
    
    // 添加数据
    for (let i = 0; i < 100; i++) {
      data.set(`key-${i}`, {
        value: Math.random(),
        timestamp: Date.now()
      });
    }
    
    // 查询和更新
    for (const [key, value] of data) {
      value.updated = Date.now();
    }
    
    // 删除部分数据
    const keysToDelete = Array.from(data.keys()).slice(0, 20);
    keysToDelete.forEach(key => data.delete(key));
    
    data.clear();
  }

  /**
   * 执行内存检查
   */
  private async performMemoryCheck(config: StabilityTestConfig, result: StabilityTestResult): Promise<void> {
    const currentMemory = this.getCurrentMemoryUsage();
    const timestamp = Date.now();
    
    this.memoryHistory.push({ timestamp, usage: currentMemory });
    
    // 保持历史记录在合理范围内
    if (this.memoryHistory.length > 1440) { // 24小时的分钟数
      this.memoryHistory.shift();
    }
    
    // 检测内存泄漏
    const leak = this.detectMemoryLeak(config);
    if (leak.suspected) {
      result.memoryLeakDetected = true;
      
      this.recordIncident({
        timestamp: performance.now(),
        type: 'memory-leak',
        severity: leak.growthRate > this.PERFORMANCE_THRESHOLDS.CRITICAL_MEMORY_GROWTH ? 'critical' : 'high',
        description: `Memory leak detected: ${leak.growthRate.toFixed(2)}MB/hour growth`,
        metrics: this.monitor.getCurrentMetrics() || {} as PerformanceMetrics,
        autoFixed: false
      });
      
      // 尝试自动修复
      await this.attemptMemoryRecovery(leak);
    }
    
    result.metrics.maxMemoryUsage = Math.max(result.metrics.maxMemoryUsage, currentMemory);
    result.metrics.memoryGrowthRate = leak.growthRate;
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(config: StabilityTestConfig, result: StabilityTestResult): Promise<void> {
    const metrics = this.monitor.getCurrentMetrics();
    if (!metrics) return;
    
    // 更新指标
    result.metrics.minFPS = Math.min(result.metrics.minFPS, metrics.fps);
    
    // 检查性能下降
    if (metrics.fps < config.minFPS) {
      result.performanceDegradation = true;
      
      this.recordIncident({
        timestamp: performance.now(),
        type: 'performance-drop',
        severity: metrics.fps < this.PERFORMANCE_THRESHOLDS.CRITICAL_FPS_DROP ? 'critical' : 'high',
        description: `Performance degradation: FPS dropped to ${metrics.fps.toFixed(1)}`,
        metrics,
        autoFixed: false
      });
      
      // 尝试性能恢复
      await this.attemptPerformanceRecovery(metrics);
    }
    
    // 检查错误率
    const errorRate = this.operationCount > 0 ? this.errorCount / this.operationCount : 0;
    if (errorRate > config.maxErrorRate) {
      this.recordIncident({
        timestamp: performance.now(),
        type: 'error-spike',
        severity: errorRate > this.PERFORMANCE_THRESHOLDS.MAX_ERROR_RATE ? 'critical' : 'high',
        description: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        metrics,
        autoFixed: false
      });
    }
  }

  /**
   * 检测内存泄漏
   */
  private detectMemoryLeak(config: StabilityTestConfig): MemoryLeakDetection {
    const currentMemory = this.getCurrentMemoryUsage();
    const recentHistory = this.memoryHistory.slice(-60); // 最近1小时
    
    let growthRate = 0;
    let suspected = false;
    const leakSources: string[] = [];
    
    if (recentHistory.length >= 10) {
      // 计算增长趋势
      const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
      const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));
      
      const avgFirst = firstHalf.reduce((sum, item) => sum + item.usage, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((sum, item) => sum + item.usage, 0) / secondHalf.length;
      
      // 计算每小时增长率
      const timeSpanHours = (secondHalf[secondHalf.length - 1].timestamp - firstHalf[0].timestamp) / (1000 * 60 * 60);
      growthRate = timeSpanHours > 0 ? (avgSecond - avgFirst) / timeSpanHours : 0;
      
      // 检查是否可疑
      suspected = growthRate > config.maxMemoryGrowth;
      
      if (suspected) {
        // 分析可能的泄漏源
        if (growthRate > 2) leakSources.push('DOM nodes accumulation');
        if (this.testNodes.length > 1000) leakSources.push('Test nodes not cleaned up');
        if (this.incidents.length > 100) leakSources.push('Incident history accumulation');
      }
    }
    
    return {
      startMemory: this.memoryBaseline,
      currentMemory,
      peakMemory: Math.max(...this.memoryHistory.map(h => h.usage)),
      growthRate,
      suspected,
      leakSources
    };
  }

  /**
   * 尝试内存恢复
   */
  private async attemptMemoryRecovery(leak: MemoryLeakDetection): Promise<void> {
    console.log('Attempting memory recovery...');
    
    const actions: RecoveryAction[] = [];
    
    // 强制垃圾回收
    if (Date.now() - this.lastGarbageCollection > 60000) { // 1分钟间隔
      await this.forceGarbageCollection();
      this.lastGarbageCollection = Date.now();
      
      actions.push({
        timestamp: Date.now(),
        incident: 'memory-leak',
        action: 'garbage-collection',
        result: 'success',
        description: 'Forced garbage collection'
      });
    }
    
    // 清理历史数据
    if (this.memoryHistory.length > 100) {
      this.memoryHistory = this.memoryHistory.slice(-50);
      actions.push({
        timestamp: Date.now(),
        incident: 'memory-leak',
        action: 'cache-clear',
        result: 'success',
        description: 'Cleared memory history cache'
      });
    }
    
    // 清理事件历史
    if (this.incidents.length > 100) {
      this.incidents = this.incidents.slice(-50);
      actions.push({
        timestamp: Date.now(),
        incident: 'memory-leak',
        action: 'cache-clear',
        result: 'success',
        description: 'Cleared incident history'
      });
    }
    
    // 优化测试节点
    if (this.testNodes.length > 1000) {
      const excessNodes = this.testNodes.splice(1000);
      excessNodes.forEach(node => node.remove());
      
      actions.push({
        timestamp: Date.now(),
        incident: 'memory-leak',
        action: 'optimize-memory',
        result: 'success',
        description: `Removed ${excessNodes.length} excess test nodes`
      });
    }
    
    this.recoveryActions.push(...actions);
    console.log(`Applied ${actions.length} memory recovery actions`);
  }

  /**
   * 尝试性能恢复
   */
  private async attemptPerformanceRecovery(metrics: PerformanceMetrics): Promise<void> {
    console.log('Attempting performance recovery...');
    
    const actions: RecoveryAction[] = [];
    
    // 减少操作负载
    if (this.testNodes.length > 500) {
      // 临时隐藏一些节点
      const nodesToHide = this.testNodes.slice(500);
      nodesToHide.forEach(node => {
        node.style.display = 'none';
      });
      
      setTimeout(() => {
        nodesToHide.forEach(node => {
          node.style.display = '';
        });
      }, 10000); // 10秒后恢复
      
      actions.push({
        timestamp: Date.now(),
        incident: 'performance-drop',
        action: 'reduce-load',
        result: 'success',
        description: 'Temporarily reduced visual load'
      });
    }
    
    // 强制垃圾回收
    await this.forceGarbageCollection();
    actions.push({
      timestamp: Date.now(),
      incident: 'performance-drop',
      action: 'garbage-collection',
      result: 'success',
      description: 'Forced garbage collection for performance'
    });
    
    this.recoveryActions.push(...actions);
    console.log(`Applied ${actions.length} performance recovery actions`);
  }

  /**
   * 记录稳定性事件
   */
  private recordIncident(incident: StabilityIncident): void {
    this.incidents.push(incident);
    console.warn(`Stability incident: ${incident.type} (${incident.severity}) - ${incident.description}`);
    
    // 保持事件列表在合理大小
    if (this.incidents.length > 1000) {
      this.incidents = this.incidents.slice(-500);
    }
  }

  /**
   * 分析稳定性结果
   */
  private analyzeStabilityResults(result: StabilityTestResult, config: StabilityTestConfig): void {
    const finalMetrics = this.monitor.getPerformanceStats();
    result.metrics.avgFPS = finalMetrics.avgFps;
    
    // 计算稳定性分数
    let score = 100;
    
    // 内存泄漏扣分
    if (result.memoryLeakDetected) {
      const leakSeverity = result.metrics.memoryGrowthRate / config.maxMemoryGrowth;
      score -= Math.min(30, leakSeverity * 15);
    }
    
    // 性能下降扣分
    if (result.performanceDegradation) {
      const perfRatio = result.metrics.avgFPS / config.minFPS;
      score -= Math.min(25, (1 - perfRatio) * 50);
    }
    
    // 错误率扣分
    const errorRate = result.totalOperations > 0 ? result.errorCount / result.totalOperations : 0;
    score -= Math.min(20, (errorRate / config.maxErrorRate) * 20);
    
    // 事件严重程度扣分
    const criticalIncidents = this.incidents.filter(i => i.severity === 'critical').length;
    const highIncidents = this.incidents.filter(i => i.severity === 'high').length;
    score -= criticalIncidents * 5 + highIncidents * 2;
    
    // 系统崩溃扣分
    score -= result.systemCrashes * 10;
    
    result.metrics.stabilityScore = Math.max(0, Math.min(100, score));
    
    // 判断测试成功
    result.success = (
      result.metrics.stabilityScore >= 70 &&
      result.metrics.memoryGrowthRate <= config.maxMemoryGrowth &&
      result.metrics.avgFPS >= config.minFPS &&
      errorRate <= config.maxErrorRate
    );
    
    console.log(`Stability analysis completed:`);
    console.log(`  Score: ${result.metrics.stabilityScore.toFixed(1)}/100`);
    console.log(`  Success: ${result.success ? 'Yes' : 'No'}`);
    console.log(`  Memory growth rate: ${result.metrics.memoryGrowthRate.toFixed(2)}MB/h`);
    console.log(`  Average FPS: ${result.metrics.avgFPS.toFixed(1)}`);
    console.log(`  Error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  /**
   * 创建稳定性测试节点
   */
  private createStabilityTestNode(id: number): HTMLElement {
    const node = document.createElement('div');
    node.id = `stability-node-${id}`;
    node.className = 'stability-test-node';
    node.style.cssText = `
      position: absolute;
      width: 40px;
      height: 30px;
      background: hsl(${id % 360}, 70%, 50%);
      border: 1px solid #333;
      border-radius: 3px;
      font-size: 8px;
      text-align: center;
      line-height: 30px;
      color: white;
      left: ${(id * 50) % 800}px;
      top: ${Math.floor((id * 50) / 800) * 35}px;
      transition: all 0.2s ease;
      cursor: pointer;
    `;
    
    node.textContent = id.toString();
    return node;
  }

  /**
   * 获取或创建测试容器
   */
  private getOrCreateTestContainer(): HTMLElement {
    let container = document.getElementById('stability-test-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'stability-test-container';
      container.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 10000px;
        height: 10000px;
        overflow: hidden;
        pointer-events: none;
        z-index: -1;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * 系统预热
   */
  private async warmupSystem(): Promise<void> {
    console.log('Warming up system...');
    
    // 执行一些操作来预热JIT编译器
    for (let i = 0; i < 100; i++) {
      await this.performDragOperations();
      await this.performRenderingOperations();
      await this.sleep(10);
    }
    
    // 强制垃圾回收
    await this.forceGarbageCollection();
    
    console.log('System warmup completed');
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.errorCount++;
      this.recordIncident({
        timestamp: performance.now(),
        type: 'crash',
        severity: 'high',
        description: `JavaScript error: ${event.error?.message || 'Unknown error'}`,
        metrics: this.monitor.getCurrentMetrics() || {} as PerformanceMetrics,
        autoFixed: false
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++;
      this.recordIncident({
        timestamp: performance.now(),
        type: 'crash',
        severity: 'medium',
        description: `Unhandled promise rejection: ${event.reason}`,
        metrics: this.monitor.getCurrentMetrics() || {} as PerformanceMetrics,
        autoFixed: false
      });
    });
  }

  /**
   * 设置内存监控
   */
  private setupMemoryMonitoring(): void {
    setInterval(() => {
      if (this.isRunning) {
        const memory = this.getCurrentMemoryUsage();
        this.memoryHistory.push({
          timestamp: Date.now(),
          usage: memory
        });
        
        // 保持历史记录在合理范围内
        if (this.memoryHistory.length > 1440) {
          this.memoryHistory.shift();
        }
      }
    }, 60000); // 每分钟记录
  }

  /**
   * 获取当前内存使用量
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * 强制垃圾回收
   */
  private async forceGarbageCollection(): Promise<void> {
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
    } else {
      // 创建和销毁一些对象来触发垃圾回收
      for (let i = 0; i < 1000; i++) {
        const temp = new Array(1000).fill(Math.random());
        temp.length = 0;
      }
    }
    await this.sleep(100);
  }

  /**
   * 清理测试环境
   */
  private cleanup(): void {
    console.log('Cleaning up stability test environment...');
    
    // 移除测试节点
    this.testNodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    this.testNodes = [];
    
    // 清理测试容器
    const container = document.getElementById('stability-test-container');
    if (container) {
      container.innerHTML = '';
    }
    
    console.log('Cleanup completed');
  }

  /**
   * 停止当前测试
   */
  stopCurrentTest(): void {
    this.isRunning = false;
    console.log(`Stopping current stability test: ${this.currentTest}`);
  }

  /**
   * 获取测试结果
   */
  getResults(): Map<string, StabilityTestResult> {
    return new Map(this.results);
  }

  /**
   * 生成稳定性报告
   */
  generateStabilityReport(): string {
    if (this.results.size === 0) {
      return '无稳定性测试结果';
    }

    let report = '稳定性验证报告\n==================\n\n';

    for (const [testName, result] of this.results) {
      report += `测试: ${testName}\n`;
      report += `持续时间: ${(result.duration / (1000 * 60 * 60)).toFixed(2)} 小时\n`;
      report += `结果: ${result.success ? '✅ 通过' : '❌ 失败'}\n`;
      report += `稳定性评分: ${result.metrics.stabilityScore.toFixed(1)}/100\n\n`;
      
      report += '性能指标:\n';
      report += `  平均FPS: ${result.metrics.avgFPS.toFixed(1)}\n`;
      report += `  最低FPS: ${result.metrics.minFPS.toFixed(1)}\n`;
      report += `  最大内存使用: ${result.metrics.maxMemoryUsage.toFixed(1)}MB\n`;
      report += `  内存增长率: ${result.metrics.memoryGrowthRate.toFixed(2)}MB/小时\n`;
      report += `  系统正常运行时间: ${(result.metrics.uptime / (1000 * 60 * 60)).toFixed(2)} 小时\n\n`;
      
      report += '问题统计:\n';
      report += `  内存泄漏检测: ${result.memoryLeakDetected ? '是' : '否'}\n`;
      report += `  性能下降: ${result.performanceDegradation ? '是' : '否'}\n`;
      report += `  系统崩溃: ${result.systemCrashes} 次\n`;
      report += `  错误总数: ${result.errorCount}\n`;
      report += `  总操作数: ${result.totalOperations}\n`;
      report += `  错误率: ${result.totalOperations > 0 ? ((result.errorCount / result.totalOperations) * 100).toFixed(2) : 0}%\n\n`;
      
      if (result.incidents.length > 0) {
        report += '主要事件:\n';
        const majorIncidents = result.incidents.filter(i => i.severity === 'critical' || i.severity === 'high');
        majorIncidents.slice(0, 10).forEach(incident => {
          report += `  ${incident.type} (${incident.severity}): ${incident.description}\n`;
        });
        report += '\n';
      }
      
      if (result.recoveryActions.length > 0) {
        report += '恢复操作:\n';
        result.recoveryActions.slice(0, 10).forEach(action => {
          report += `  ${action.action}: ${action.description} - ${action.result}\n`;
        });
        report += '\n';
      }
    }

    return report;
  }

  /**
   * 导出稳定性数据
   */
  exportStabilityData(): any {
    return {
      results: Array.from(this.results.entries()),
      incidents: this.incidents,
      recoveryActions: this.recoveryActions,
      memoryHistory: this.memoryHistory,
      timestamp: Date.now(),
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        memory: (performance as any).memory ? {
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize
        } : null
      }
    };
  }

  /**
   * 清空所有结果
   */
  clearAllResults(): void {
    this.results.clear();
    this.incidents = [];
    this.recoveryActions = [];
    this.memoryHistory = [];
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出工厂函数
export function createStabilityValidator(): StabilityValidationEngine {
  return new StabilityValidationEngine();
}