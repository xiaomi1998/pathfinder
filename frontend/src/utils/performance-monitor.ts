/**
 * 性能监控和基准测试工具
 * 为拖拽系统提供详细的性能分析和对比功能
 */

// 性能指标接口
export interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  frameTime: number;
  dragLatency: number;
  calculationTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// 基准测试结果
export interface BenchmarkResult {
  testName: string;
  duration: number;
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  opsPerSecond: number;
  memoryDelta: number;
}

// 拖拽性能分析
export interface DragPerformanceAnalysis {
  totalDragTime: number;
  avgFrameTime: number;
  droppedFrames: number;
  precision: number;
  smoothness: number;
  efficiency: number;
  score: number; // 综合评分 0-100
}

/**
 * 实时性能监控器
 */
export class RealTimePerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private intervalId: number | null = null;
  private frameStartTime = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  
  // 性能阈值配置
  private readonly PERFORMANCE_THRESHOLDS = {
    TARGET_FPS: 60,
    WARNING_FRAME_TIME: 16.67, // ms
    CRITICAL_FRAME_TIME: 33.33, // ms
    MAX_DRAG_LATENCY: 10, // ms
    MAX_CALCULATION_TIME: 5 // ms
  };

  constructor() {
    this.setupPerformanceObserver();
  }

  /**
   * 开始监控
   */
  startMonitoring(interval = 100): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.metrics = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    this.intervalId = window.setInterval(() => {
      this.collectMetrics();
    }, interval);

    console.log('Performance monitoring started');
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * 收集性能指标
   */
  private collectMetrics(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // 计算FPS
    this.frameCount++;
    const timeSinceStart = now - (this.metrics[0]?.timestamp || now);
    const fps = timeSinceStart > 0 ? (this.frameCount * 1000) / timeSinceStart : 60;

    // 内存使用情况 (如果浏览器支持)
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }

    const metrics: PerformanceMetrics = {
      timestamp: now,
      fps: Math.min(fps, 60),
      frameTime,
      dragLatency: 0, // 将在拖拽过程中更新
      calculationTime: 0, // 将在计算过程中更新
      memoryUsage,
      cpuUsage: 0 // 浏览器暂不支持直接获取CPU使用率
    };

    this.metrics.push(metrics);
    this.lastFrameTime = now;

    // 限制存储的指标数量
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * 记录拖拽延迟
   */
  recordDragLatency(latency: number): void {
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].dragLatency = latency;
    }
  }

  /**
   * 记录计算时间
   */
  recordCalculationTime(time: number): void {
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].calculationTime = time;
    }
  }

  /**
   * 获取当前性能指标
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    avgFps: number;
    avgFrameTime: number;
    maxFrameTime: number;
    droppedFrames: number;
    avgDragLatency: number;
    avgCalculationTime: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing';
  } {
    if (this.metrics.length === 0) {
      return {
        avgFps: 0,
        avgFrameTime: 0,
        maxFrameTime: 0,
        droppedFrames: 0,
        avgDragLatency: 0,
        avgCalculationTime: 0,
        memoryTrend: 'stable'
      };
    }

    const recentMetrics = this.metrics.slice(-100); // 最近100个采样

    const avgFps = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgFrameTime = recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) / recentMetrics.length;
    const maxFrameTime = Math.max(...recentMetrics.map(m => m.frameTime));
    const droppedFrames = recentMetrics.filter(m => m.frameTime > this.PERFORMANCE_THRESHOLDS.WARNING_FRAME_TIME).length;
    const avgDragLatency = recentMetrics.reduce((sum, m) => sum + m.dragLatency, 0) / recentMetrics.length;
    const avgCalculationTime = recentMetrics.reduce((sum, m) => sum + m.calculationTime, 0) / recentMetrics.length;

    // 分析内存趋势
    let memoryTrend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (recentMetrics.length > 10) {
      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));
      
      const avgMemoryFirst = firstHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / firstHalf.length;
      const avgMemorySecond = secondHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / secondHalf.length;
      
      const memoryChange = (avgMemorySecond - avgMemoryFirst) / avgMemoryFirst;
      
      if (memoryChange > 0.05) memoryTrend = 'increasing';
      else if (memoryChange < -0.05) memoryTrend = 'decreasing';
    }

    return {
      avgFps: Number(avgFps.toFixed(1)),
      avgFrameTime: Number(avgFrameTime.toFixed(2)),
      maxFrameTime: Number(maxFrameTime.toFixed(2)),
      droppedFrames,
      avgDragLatency: Number(avgDragLatency.toFixed(2)),
      avgCalculationTime: Number(avgCalculationTime.toFixed(2)),
      memoryTrend
    };
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              // 处理自定义性能测量
              this.recordCalculationTime(entry.duration);
            }
          }
        });

        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.warn('Performance Observer not supported or failed to initialize');
      }
    }
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const stats = this.getPerformanceStats();
    const current = this.getCurrentMetrics();
    
    return `
性能监控报告
==================
采样数量: ${this.metrics.length}
当前FPS: ${current?.fps.toFixed(1) || 'N/A'}
平均FPS: ${stats.avgFps}
平均帧时间: ${stats.avgFrameTime}ms
最大帧时间: ${stats.maxFrameTime}ms
丢帧数: ${stats.droppedFrames}
平均拖拽延迟: ${stats.avgDragLatency}ms
平均计算时间: ${stats.avgCalculationTime}ms
内存趋势: ${stats.memoryTrend}
内存使用: ${current?.memoryUsage.toFixed(1) || 'N/A'}MB

性能评级:
${this.getPerformanceGrade(stats)}
    `.trim();
  }

  /**
   * 获取性能评级
   */
  private getPerformanceGrade(stats: ReturnType<typeof this.getPerformanceStats>): string {
    let score = 100;
    
    // FPS评分 (40%)
    if (stats.avgFps < 30) score -= 40;
    else if (stats.avgFps < 45) score -= 20;
    else if (stats.avgFps < 55) score -= 10;
    
    // 帧时间评分 (30%)
    if (stats.avgFrameTime > 33) score -= 30;
    else if (stats.avgFrameTime > 20) score -= 15;
    else if (stats.avgFrameTime > 17) score -= 8;
    
    // 拖拽延迟评分 (20%)
    if (stats.avgDragLatency > 20) score -= 20;
    else if (stats.avgDragLatency > 10) score -= 10;
    else if (stats.avgDragLatency > 5) score -= 5;
    
    // 内存趋势评分 (10%)
    if (stats.memoryTrend === 'increasing') score -= 10;
    else if (stats.memoryTrend === 'decreasing') score += 5;
    
    score = Math.max(0, Math.min(100, score));
    
    if (score >= 90) return `优秀 (${score}/100)`;
    if (score >= 80) return `良好 (${score}/100)`;
    if (score >= 70) return `一般 (${score}/100)`;
    if (score >= 60) return `较差 (${score}/100)`;
    return `差 (${score}/100)`;
  }

  /**
   * 导出性能数据
   */
  exportData(): PerformanceMetrics[] {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  /**
   * 清空数据
   */
  clearData(): void {
    this.metrics = [];
    this.frameCount = 0;
  }
}

/**
 * 基准测试器
 */
export class BenchmarkTester {
  private results: BenchmarkResult[] = [];

  /**
   * 运行基准测试
   */
  async runBenchmark(
    testName: string, 
    testFunction: () => void, 
    iterations = 1000,
    warmupIterations = 100
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${testName}`);

    // 预热
    console.log('Warming up...');
    for (let i = 0; i < warmupIterations; i++) {
      testFunction();
    }

    // 垃圾回收 (如果可用)
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    const memoryBefore = this.getMemoryUsage();
    const times: number[] = [];

    console.log(`Running ${iterations} iterations...`);
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      testFunction();
      const iterationEnd = performance.now();
      times.push(iterationEnd - iterationStart);
    }

    const endTime = performance.now();
    const memoryAfter = this.getMemoryUsage();

    // 计算统计数据
    const duration = endTime - startTime;
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // 计算标准差
    const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    const opsPerSecond = 1000 / avgTime;
    const memoryDelta = memoryAfter - memoryBefore;

    const result: BenchmarkResult = {
      testName,
      duration,
      iterations,
      avgTime: Number(avgTime.toFixed(4)),
      minTime: Number(minTime.toFixed(4)),
      maxTime: Number(maxTime.toFixed(4)),
      stdDev: Number(stdDev.toFixed(4)),
      opsPerSecond: Number(opsPerSecond.toFixed(0)),
      memoryDelta: Number(memoryDelta.toFixed(2))
    };

    this.results.push(result);
    console.log('Benchmark completed:', result);
    
    return result;
  }

  /**
   * 运行拖拽性能测试套件
   */
  async runDragBenchmarkSuite(): Promise<{
    vector2DOperations: BenchmarkResult;
    coordinateTransform: BenchmarkResult;
    boundaryDetection: BenchmarkResult;
    precisionCalculation: BenchmarkResult;
  }> {
    console.log('Running drag performance benchmark suite...');

    // Vector2D 操作性能测试
    const vector2DOperations = await this.runBenchmark('Vector2D Operations', () => {
      const v1 = { x: Math.random() * 1000, y: Math.random() * 1000 };
      const v2 = { x: Math.random() * 1000, y: Math.random() * 1000 };
      
      // 模拟 Vector2D 操作
      const sum = { x: v1.x + v2.x, y: v1.y + v2.y };
      const diff = { x: v1.x - v2.x, y: v1.y - v2.y };
      const length = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
      const normalized = length > 0 ? { x: sum.x / length, y: sum.y / length } : { x: 0, y: 0 };
    });

    // 坐标变换性能测试
    const coordinateTransform = await this.runBenchmark('Coordinate Transform', () => {
      const screenX = Math.random() * 1920;
      const screenY = Math.random() * 1080;
      const zoom = 0.5 + Math.random() * 2; // 0.5x - 2.5x
      const panX = (Math.random() - 0.5) * 1000;
      const panY = (Math.random() - 0.5) * 1000;
      
      // 模拟坐标变换
      const canvasX = (screenX - panX) / zoom;
      const canvasY = (screenY - panY) / zoom;
    });

    // 边界检测性能测试
    const boundaryDetection = await this.runBenchmark('Boundary Detection', () => {
      const x = Math.random() * 1200;
      const y = Math.random() * 800;
      const width = 120;
      const height = 60;
      const margin = 10;
      
      // 模拟边界检测
      const violatesLeft = x < margin;
      const violatesRight = x + width > 1200 - margin;
      const violatesTop = y < margin;
      const violatesBottom = y + height > 800 - margin;
      
      if (violatesLeft || violatesRight || violatesTop || violatesBottom) {
        // 应用边界约束
        const constrainedX = Math.max(margin, Math.min(x, 1200 - width - margin));
        const constrainedY = Math.max(margin, Math.min(y, 800 - height - margin));
      }
    });

    // 精度计算性能测试
    const precisionCalculation = await this.runBenchmark('Precision Calculation', () => {
      const value = Math.random() * 1000;
      const precision = 1000;
      
      // 模拟亚像素精度计算
      const preciseValue = Math.round(value * precision) / precision;
      const subPixelPart = (value * precision) % 1;
      const roundedValue = Math.round(preciseValue * 1000) / 1000;
    });

    return {
      vector2DOperations,
      coordinateTransform,
      boundaryDetection,
      precisionCalculation
    };
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return memInfo.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  /**
   * 生成基准测试报告
   */
  generateBenchmarkReport(): string {
    if (this.results.length === 0) {
      return '无基准测试结果';
    }

    let report = '基准测试报告\n==================\n\n';

    for (const result of this.results) {
      report += `测试: ${result.testName}\n`;
      report += `迭代次数: ${result.iterations}\n`;
      report += `总时长: ${result.duration.toFixed(2)}ms\n`;
      report += `平均时间: ${result.avgTime}ms\n`;
      report += `最快: ${result.minTime}ms\n`;
      report += `最慢: ${result.maxTime}ms\n`;
      report += `标准差: ${result.stdDev}ms\n`;
      report += `操作/秒: ${result.opsPerSecond}\n`;
      report += `内存变化: ${result.memoryDelta >= 0 ? '+' : ''}${result.memoryDelta}MB\n`;
      report += '\n';
    }

    return report;
  }

  /**
   * 清空结果
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * 导出结果
   */
  exportResults(): BenchmarkResult[] {
    return JSON.parse(JSON.stringify(this.results));
  }
}

/**
 * 拖拽性能分析器
 */
export class DragPerformanceAnalyzer {
  private dragSessions: Array<{
    startTime: number;
    endTime: number;
    framesTimes: number[];
    positions: Array<{ x: number; y: number; timestamp: number }>;
    errors: number[];
  }> = [];

  /**
   * 开始拖拽会话分析
   */
  startDragSession(): void {
    this.dragSessions.push({
      startTime: performance.now(),
      endTime: 0,
      framesTimes: [],
      positions: [],
      errors: []
    });
  }

  /**
   * 记录帧时间
   */
  recordFrameTime(frameTime: number): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.framesTimes.push(frameTime);
    }
  }

  /**
   * 记录位置
   */
  recordPosition(x: number, y: number): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.positions.push({
        x, y,
        timestamp: performance.now()
      });
    }
  }

  /**
   * 记录精度误差
   */
  recordError(error: number): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.errors.push(error);
    }
  }

  /**
   * 结束拖拽会话分析
   */
  endDragSession(): DragPerformanceAnalysis | null {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;

    currentSession.endTime = performance.now();
    return this.analyzeDragSession(currentSession);
  }

  /**
   * 分析拖拽会话
   */
  private analyzeDragSession(session: typeof this.dragSessions[0]): DragPerformanceAnalysis {
    const totalTime = session.endTime - session.startTime;
    const avgFrameTime = session.framesTimes.length > 0 ? 
      session.framesTimes.reduce((sum, time) => sum + time, 0) / session.framesTimes.length : 0;
    
    const droppedFrames = session.framesTimes.filter(time => time > 16.67).length;
    const precision = session.errors.length > 0 ?
      1 / (1 + session.errors.reduce((sum, error) => sum + error, 0) / session.errors.length) : 1;

    // 计算平滑度 (基于位置变化的连续性)
    let smoothness = 1;
    if (session.positions.length > 1) {
      let totalJerk = 0;
      for (let i = 2; i < session.positions.length; i++) {
        const p1 = session.positions[i - 2];
        const p2 = session.positions[i - 1];
        const p3 = session.positions[i];
        
        const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
        const jerk = Math.abs(v2.x - v1.x) + Math.abs(v2.y - v1.y);
        totalJerk += jerk;
      }
      
      smoothness = Math.max(0, 1 - totalJerk / (session.positions.length * 100));
    }

    // 计算效率 (基于帧率和计算时间)
    const efficiency = Math.min(1, 60 / Math.max(1, avgFrameTime));

    // 综合评分
    const score = Math.round((precision * 30 + smoothness * 30 + efficiency * 40) * 100);

    return {
      totalDragTime: totalTime,
      avgFrameTime,
      droppedFrames,
      precision,
      smoothness,
      efficiency,
      score
    };
  }

  /**
   * 获取当前会话
   */
  private getCurrentSession() {
    return this.dragSessions.length > 0 ? this.dragSessions[this.dragSessions.length - 1] : null;
  }

  /**
   * 获取分析统计
   */
  getAnalysisStats(): {
    totalSessions: number;
    avgScore: number;
    avgDragTime: number;
    avgPrecision: number;
    avgSmoothness: number;
    avgEfficiency: number;
  } {
    if (this.dragSessions.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        avgDragTime: 0,
        avgPrecision: 0,
        avgSmoothness: 0,
        avgEfficiency: 0
      };
    }

    const analyses = this.dragSessions
      .filter(session => session.endTime > 0)
      .map(session => this.analyzeDragSession(session));

    const avgScore = analyses.reduce((sum, analysis) => sum + analysis.score, 0) / analyses.length;
    const avgDragTime = analyses.reduce((sum, analysis) => sum + analysis.totalDragTime, 0) / analyses.length;
    const avgPrecision = analyses.reduce((sum, analysis) => sum + analysis.precision, 0) / analyses.length;
    const avgSmoothness = analyses.reduce((sum, analysis) => sum + analysis.smoothness, 0) / analyses.length;
    const avgEfficiency = analyses.reduce((sum, analysis) => sum + analysis.efficiency, 0) / analyses.length;

    return {
      totalSessions: analyses.length,
      avgScore: Number(avgScore.toFixed(1)),
      avgDragTime: Number(avgDragTime.toFixed(2)),
      avgPrecision: Number(avgPrecision.toFixed(3)),
      avgSmoothness: Number(avgSmoothness.toFixed(3)),
      avgEfficiency: Number(avgEfficiency.toFixed(3))
    };
  }

  /**
   * 清空数据
   */
  clearData(): void {
    this.dragSessions = [];
  }
}

// 导出工厂函数
export function createPerformanceMonitor(): RealTimePerformanceMonitor {
  return new RealTimePerformanceMonitor();
}

export function createBenchmarkTester(): BenchmarkTester {
  return new BenchmarkTester();
}

export function createDragAnalyzer(): DragPerformanceAnalyzer {
  return new DragPerformanceAnalyzer();
}