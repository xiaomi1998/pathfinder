/**
 * 极限压力测试框架
 * Agent 9: 专门负责系统极限压力测试、稳定性验证和基准测试
 */

import { RealTimePerformanceMonitor, BenchmarkTester, DragPerformanceAnalyzer } from './performance-monitor';
import type { PerformanceMetrics } from './performance-monitor';

// 压力测试配置
export interface StressTestConfig {
  maxNodes: number;
  testDuration: number; // 毫秒
  concurrentOperations: number;
  memoryLimitMB: number;
  targetFPS: number;
  dragFrequency: number; // 拖拽操作/秒
}

// 压力测试结果
export interface StressTestResult {
  testName: string;
  config: StressTestConfig;
  startTime: number;
  endTime: number;
  totalDuration: number;
  success: boolean;
  maxNodesAchieved: number;
  avgFPS: number;
  minFPS: number;
  memoryLeakRate: number; // MB/小时
  systemStability: number; // 0-100分
  errors: string[];
  detailedMetrics: PerformanceMetrics[];
}

// 极限场景测试类型
export enum ExtremeScenarioType {
  HIGH_NODE_COUNT = 'high-node-count',
  MEMORY_PRESSURE = 'memory-pressure',
  CPU_INTENSIVE = 'cpu-intensive',
  NETWORK_LATENCY = 'network-latency',
  LOW_END_DEVICE = 'low-end-device',
  CONCURRENT_USERS = 'concurrent-users',
  LONG_DURATION = 'long-duration'
}

// 基准比较数据
export interface BenchmarkComparison {
  testName: string;
  currentVersion: number;
  industry_standard: number;
  previousVersion?: number;
  improvement?: number; // 百分比
  status: 'better' | 'worse' | 'same';
}

/**
 * 极限压力测试引擎
 */
export class ExtremeStressTestEngine {
  private monitor: RealTimePerformanceMonitor;
  private benchmarkTester: BenchmarkTester;
  private dragAnalyzer: DragPerformanceAnalyzer;
  private isRunning = false;
  private currentTest: string = '';
  private results: Map<string, StressTestResult> = new Map();
  private testContainer: HTMLElement | null = null;

  constructor() {
    this.monitor = new RealTimePerformanceMonitor();
    this.benchmarkTester = new BenchmarkTester();
    this.dragAnalyzer = new DragPerformanceAnalyzer();
    this.setupTestEnvironment();
  }

  /**
   * 设置测试环境
   */
  private setupTestEnvironment(): void {
    // 创建测试容器
    this.testContainer = document.createElement('div');
    this.testContainer.id = 'stress-test-container';
    this.testContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 10000px;
      height: 10000px;
      overflow: hidden;
      pointer-events: none;
      z-index: -1;
    `;
    document.body.appendChild(this.testContainer);
  }

  /**
   * 10,000+ 节点大规模压力测试
   */
  async runMassiveNodeStressTest(maxNodes = 10000): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes,
      testDuration: 5 * 60 * 1000, // 5分钟
      concurrentOperations: 100,
      memoryLimitMB: 512,
      targetFPS: 30,
      dragFrequency: 10
    };

    const testName = `Massive Node Stress Test (${maxNodes} nodes)`;
    console.log(`Starting ${testName}...`);

    const startTime = performance.now();
    this.currentTest = testName;
    this.isRunning = true;

    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 0,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(50); // 20Hz监控频率
      
      // 逐步增加节点数量
      const batchSize = 500;
      let currentNodeCount = 0;
      const nodes: HTMLElement[] = [];

      for (let batch = 0; batch < Math.ceil(maxNodes / batchSize) && this.isRunning; batch++) {
        const nodesToCreate = Math.min(batchSize, maxNodes - currentNodeCount);
        
        // 创建节点批次
        const batchStartTime = performance.now();
        for (let i = 0; i < nodesToCreate; i++) {
          const node = this.createTestNode(currentNodeCount + i);
          nodes.push(node);
          this.testContainer!.appendChild(node);
        }
        currentNodeCount += nodesToCreate;
        
        // 检查性能指标
        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
          
          // 如果性能下降过多，停止测试
          if (metrics.fps < config.targetFPS) {
            console.warn(`Performance degraded at ${currentNodeCount} nodes, FPS: ${metrics.fps}`);
            break;
          }
        }

        result.maxNodesAchieved = currentNodeCount;
        
        // 批次间暂停，避免浏览器冻结
        await this.sleep(100);
        
        console.log(`Created ${currentNodeCount}/${maxNodes} nodes, Current FPS: ${metrics?.fps || 'N/A'}`);
      }

      // 运行拖拽压力测试
      await this.runDragStressTest(nodes, config.dragFrequency, 30000); // 30秒

      // 计算最终指标
      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.memoryLeakRate = this.calculateMemoryLeakRate(result.detailedMetrics);
      result.success = result.maxNodesAchieved >= maxNodes * 0.8; // 80%成功率

    } catch (error) {
      result.errors.push(`Test failed: ${error}`);
      console.error('Massive node stress test failed:', error);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.isRunning = false;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 24小时连续稳定性测试
   */
  async run24HourStabilityTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 1000,
      testDuration: 24 * 60 * 60 * 1000, // 24小时
      concurrentOperations: 10,
      memoryLimitMB: 256,
      targetFPS: 60,
      dragFrequency: 1
    };

    const testName = '24 Hour Stability Test';
    console.log(`Starting ${testName}...`);

    const startTime = performance.now();
    this.currentTest = testName;
    this.isRunning = true;

    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 1000,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(1000); // 1秒监控频率
      
      // 创建固定数量的节点
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);
      }

      // 设置定期操作
      const operationInterval = setInterval(async () => {
        if (!this.isRunning) return;

        // 执行随机拖拽操作
        await this.performRandomDragOperations(nodes, 10);
        
        // 记录性能指标
        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
        }

        // 检查内存泄漏
        const memoryLeakRate = this.calculateMemoryLeakRate(result.detailedMetrics);
        if (memoryLeakRate > 1) { // 超过1MB/小时
          result.errors.push(`High memory leak rate detected: ${memoryLeakRate}MB/h`);
        }

        console.log(`Stability test running... Elapsed: ${((performance.now() - startTime) / 1000 / 60).toFixed(1)}min`);
      }, 60000); // 每分钟检查一次

      // 等待测试完成或手动停止
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isRunning || (performance.now() - startTime) >= config.testDuration) {
            clearInterval(checkInterval);
            clearInterval(operationInterval);
            resolve(void 0);
          }
        }, 1000);
      });

      // 计算稳定性指标
      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.memoryLeakRate = this.calculateMemoryLeakRate(result.detailedMetrics);
      result.success = result.memoryLeakRate < 1 && result.avgFPS > 30;

    } catch (error) {
      result.errors.push(`Stability test failed: ${error}`);
      console.error('24-hour stability test failed:', error);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.isRunning = false;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 高频拖拽操作压力测试 (1000次/秒)
   */
  async runHighFrequencyDragTest(frequency = 1000): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 100,
      testDuration: 60000, // 1分钟
      concurrentOperations: frequency,
      memoryLimitMB: 128,
      targetFPS: 30,
      dragFrequency: frequency
    };

    const testName = `High Frequency Drag Test (${frequency} ops/sec)`;
    console.log(`Starting ${testName}...`);

    const startTime = performance.now();
    this.currentTest = testName;
    this.isRunning = true;

    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 100,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(16); // 60FPS监控频率
      this.dragAnalyzer.startDragSession();
      
      // 创建测试节点
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);
      }

      // 高频拖拽操作
      const dragInterval = 1000 / frequency; // 毫秒
      let operationCount = 0;
      const maxOperations = frequency * (config.testDuration / 1000);

      const performDrag = () => {
        if (!this.isRunning || operationCount >= maxOperations) {
          return;
        }

        const node = nodes[Math.floor(Math.random() * nodes.length)];
        const startX = Math.random() * 800;
        const startY = Math.random() * 600;
        const endX = Math.random() * 800;
        const endY = Math.random() * 600;

        this.simulateDragOperation(node, startX, startY, endX, endY);
        operationCount++;

        // 记录性能指标
        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
        }

        setTimeout(performDrag, dragInterval);
      };

      performDrag();

      // 等待测试完成
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isRunning || operationCount >= maxOperations) {
            clearInterval(checkInterval);
            resolve(void 0);
          }
        }, 100);
      });

      const dragAnalysis = this.dragAnalyzer.endDragSession();
      const finalMetrics = this.monitor.getPerformanceStats();
      
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = dragAnalysis?.score || 0;
      result.success = result.avgFPS > config.targetFPS && operationCount >= maxOperations;

      console.log(`Completed ${operationCount} drag operations`);

    } catch (error) {
      result.errors.push(`High frequency drag test failed: ${error}`);
      console.error('High frequency drag test failed:', error);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.isRunning = false;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 极限场景测试
   */
  async runExtremeScenarioTest(scenario: ExtremeScenarioType): Promise<StressTestResult> {
    switch (scenario) {
      case ExtremeScenarioType.HIGH_NODE_COUNT:
        return this.runMassiveNodeStressTest(15000);
      
      case ExtremeScenarioType.MEMORY_PRESSURE:
        return this.runMemoryPressureTest();
      
      case ExtremeScenarioType.CPU_INTENSIVE:
        return this.runCPUIntensiveTest();
      
      case ExtremeScenarioType.NETWORK_LATENCY:
        return this.runNetworkLatencyTest();
      
      case ExtremeScenarioType.LOW_END_DEVICE:
        return this.runLowEndDeviceTest();
      
      case ExtremeScenarioType.CONCURRENT_USERS:
        return this.runConcurrentUsersTest();
      
      case ExtremeScenarioType.LONG_DURATION:
        return this.run24HourStabilityTest();
      
      default:
        throw new Error(`Unsupported extreme scenario: ${scenario}`);
    }
  }

  /**
   * 内存压力测试
   */
  private async runMemoryPressureTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 5000,
      testDuration: 10 * 60 * 1000, // 10分钟
      concurrentOperations: 50,
      memoryLimitMB: 1024,
      targetFPS: 30,
      dragFrequency: 5
    };

    const testName = 'Memory Pressure Test';
    const startTime = performance.now();
    
    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 0,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(100);
      
      // 创建大量DOM元素和数据结构来施加内存压力
      const memoryBallast: any[] = [];
      const nodes: HTMLElement[] = [];

      for (let i = 0; i < config.maxNodes; i++) {
        // 创建DOM节点
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);

        // 创建内存压力（大量数据）
        const largeObject = {
          id: i,
          data: new Array(1000).fill(0).map(() => Math.random()),
          history: [],
          metadata: {
            created: Date.now(),
            operations: []
          }
        };
        memoryBallast.push(largeObject);

        // 每100个节点检查一次内存使用
        if (i % 100 === 0) {
          const metrics = this.monitor.getCurrentMetrics();
          if (metrics) {
            result.detailedMetrics.push(metrics);
            
            // 检查是否超出内存限制
            if (metrics.memoryUsage > config.memoryLimitMB) {
              console.warn(`Memory limit exceeded at ${i} nodes: ${metrics.memoryUsage}MB`);
              result.errors.push(`Memory limit exceeded: ${metrics.memoryUsage}MB`);
              break;
            }
          }
          
          result.maxNodesAchieved = i;
          await this.sleep(10);
        }
      }

      // 执行内存密集型操作
      for (let i = 0; i < 1000 && this.isRunning; i++) {
        // 修改大量数据
        memoryBallast.forEach((obj, index) => {
          obj.history.push({
            timestamp: Date.now(),
            operation: `test-${i}`,
            value: Math.random()
          });
          
          // 限制历史记录大小，防止无限增长
          if (obj.history.length > 100) {
            obj.history = obj.history.slice(-50);
          }
        });

        await this.sleep(50);
      }

      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.memoryLeakRate = this.calculateMemoryLeakRate(result.detailedMetrics);
      result.systemStability = finalMetrics.memoryTrend === 'stable' ? 80 : 60;
      result.success = result.memoryLeakRate < 5; // 允许更高的内存使用

    } catch (error) {
      result.errors.push(`Memory pressure test failed: ${error}`);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * CPU密集型测试
   */
  private async runCPUIntensiveTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 1000,
      testDuration: 5 * 60 * 1000, // 5分钟
      concurrentOperations: 100,
      memoryLimitMB: 256,
      targetFPS: 30,
      dragFrequency: 10
    };

    const testName = 'CPU Intensive Test';
    const startTime = performance.now();
    
    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 1000,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(50);
      
      // 创建节点
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);
      }

      // CPU密集型计算任务
      const cpuIntensiveTasks = [
        () => this.performComplexMathCalculations(),
        () => this.performMatrixOperations(),
        () => this.performSortingOperations(),
        () => this.performStringProcessing()
      ];

      const endTime = startTime + config.testDuration;
      while (performance.now() < endTime && this.isRunning) {
        // 执行CPU密集型任务
        const task = cpuIntensiveTasks[Math.floor(Math.random() * cpuIntensiveTasks.length)];
        await task();

        // 同时执行拖拽操作
        await this.performRandomDragOperations(nodes, 10);

        // 记录性能指标
        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
        }

        await this.sleep(100);
      }

      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.success = result.avgFPS > config.targetFPS;

    } catch (error) {
      result.errors.push(`CPU intensive test failed: ${error}`);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 网络延迟模拟测试
   */
  private async runNetworkLatencyTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 500,
      testDuration: 5 * 60 * 1000,
      concurrentOperations: 20,
      memoryLimitMB: 256,
      targetFPS: 30,
      dragFrequency: 5
    };

    const testName = 'Network Latency Simulation Test';
    const startTime = performance.now();
    
    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 500,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(100);
      
      // 创建节点
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);
      }

      // 模拟网络延迟和数据同步
      const endTime = startTime + config.testDuration;
      while (performance.now() < endTime && this.isRunning) {
        // 模拟API调用延迟
        await this.simulateNetworkOperation(200 + Math.random() * 500); // 200-700ms延迟
        
        // 模拟数据同步延迟
        await this.simulateDataSynchronization(nodes.slice(0, 10));
        
        // 执行拖拽操作
        await this.performRandomDragOperations(nodes, 5);

        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
        }

        await this.sleep(1000);
      }

      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.success = result.avgFPS > config.targetFPS;

    } catch (error) {
      result.errors.push(`Network latency test failed: ${error}`);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 低端设备模拟测试
   */
  private async runLowEndDeviceTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 200, // 更少节点模拟低端设备
      testDuration: 5 * 60 * 1000,
      concurrentOperations: 5, // 更少并发操作
      memoryLimitMB: 64, // 更严格的内存限制
      targetFPS: 24, // 更低的FPS要求
      dragFrequency: 2
    };

    const testName = 'Low End Device Simulation Test';
    const startTime = performance.now();
    
    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 0,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(200); // 更低的监控频率
      
      // 人工降低性能来模拟低端设备
      const artificialDelay = () => {
        const start = performance.now();
        while (performance.now() - start < 5) {
          // 人工CPU负载
          Math.sin(Math.random());
        }
      };

      // 逐步创建节点，监控性能
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);

        // 添加人工延迟
        artificialDelay();

        // 每10个节点检查性能
        if (i % 10 === 0) {
          const metrics = this.monitor.getCurrentMetrics();
          if (metrics) {
            result.detailedMetrics.push(metrics);
            result.minFPS = Math.min(result.minFPS, metrics.fps);
            
            // 如果性能过差，停止添加节点
            if (metrics.fps < 15) {
              console.warn(`Performance too low at ${i} nodes, stopping`);
              break;
            }
          }
          
          result.maxNodesAchieved = i;
          await this.sleep(100);
        }
      }

      // 在限制的性能下执行操作
      const endTime = startTime + config.testDuration;
      while (performance.now() < endTime && this.isRunning) {
        artificialDelay();
        await this.performRandomDragOperations(nodes, 2);

        const metrics = this.monitor.getCurrentMetrics();
        if (metrics) {
          result.detailedMetrics.push(metrics);
          result.minFPS = Math.min(result.minFPS, metrics.fps);
        }

        await this.sleep(500);
      }

      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.success = result.avgFPS > config.targetFPS;

    } catch (error) {
      result.errors.push(`Low end device test failed: ${error}`);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 并发用户测试
   */
  private async runConcurrentUsersTest(): Promise<StressTestResult> {
    const config: StressTestConfig = {
      maxNodes: 1000,
      testDuration: 5 * 60 * 1000,
      concurrentOperations: 20, // 模拟20个并发用户
      memoryLimitMB: 512,
      targetFPS: 30,
      dragFrequency: 50 // 高频操作
    };

    const testName = 'Concurrent Users Test';
    const startTime = performance.now();
    
    const result: StressTestResult = {
      testName,
      config,
      startTime,
      endTime: 0,
      totalDuration: 0,
      success: false,
      maxNodesAchieved: 1000,
      avgFPS: 0,
      minFPS: 60,
      memoryLeakRate: 0,
      systemStability: 0,
      errors: [],
      detailedMetrics: []
    };

    try {
      this.monitor.startMonitoring(50);
      
      // 创建节点
      const nodes: HTMLElement[] = [];
      for (let i = 0; i < config.maxNodes; i++) {
        const node = this.createTestNode(i);
        nodes.push(node);
        this.testContainer!.appendChild(node);
      }

      // 创建多个并发操作流
      const concurrentOperations: Promise<void>[] = [];
      for (let user = 0; user < config.concurrentOperations; user++) {
        const userOperation = this.simulateUserSession(nodes, user, config.testDuration);
        concurrentOperations.push(userOperation);
      }

      // 等待所有并发操作完成
      await Promise.all(concurrentOperations);

      const finalMetrics = this.monitor.getPerformanceStats();
      result.avgFPS = finalMetrics.avgFps;
      result.systemStability = this.calculateSystemStability(result.detailedMetrics);
      result.success = result.avgFPS > config.targetFPS && result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Concurrent users test failed: ${error}`);
    } finally {
      this.cleanup();
      this.monitor.stopMonitoring();
      result.endTime = performance.now();
      result.totalDuration = result.endTime - result.startTime;
      this.results.set(testName, result);
    }

    return result;
  }

  /**
   * 模拟用户会话
   */
  private async simulateUserSession(nodes: HTMLElement[], userId: number, duration: number): Promise<void> {
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    while (performance.now() < endTime && this.isRunning) {
      try {
        // 随机选择操作
        const operation = Math.random();
        
        if (operation < 0.6) {
          // 60%概率：拖拽操作
          const node = nodes[Math.floor(Math.random() * nodes.length)];
          await this.simulateUserDragOperation(node, userId);
        } else if (operation < 0.8) {
          // 20%概率：多选操作
          await this.simulateMultiSelection(nodes, userId);
        } else {
          // 20%概率：其他交互
          await this.simulateOtherInteractions(nodes, userId);
        }
        
        // 随机延迟，模拟真实用户行为
        await this.sleep(100 + Math.random() * 500);
        
      } catch (error) {
        console.warn(`User ${userId} session error:`, error);
      }
    }
  }

  /**
   * 创建测试节点
   */
  private createTestNode(id: number): HTMLElement {
    const node = document.createElement('div');
    node.id = `test-node-${id}`;
    node.className = 'stress-test-node';
    node.style.cssText = `
      position: absolute;
      width: 60px;
      height: 40px;
      background: linear-gradient(45deg, #${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)});
      border: 1px solid #333;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
      left: ${Math.random() * 800}px;
      top: ${Math.random() * 600}px;
      transition: transform 0.1s ease;
    `;
    
    node.innerHTML = `<div style="text-align:center;line-height:40px;font-size:10px;color:white;">${id}</div>`;
    
    // 添加基本交互事件
    this.attachNodeEvents(node);
    
    return node;
  }

  /**
   * 附加节点事件
   */
  private attachNodeEvents(node: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const onStart = (clientX: number, clientY: number) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      initialX = parseInt(node.style.left) || 0;
      initialY = parseInt(node.style.top) || 0;
      node.style.transform = 'scale(1.05)';
      node.style.zIndex = '1000';
    };

    const onMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      node.style.left = `${newX}px`;
      node.style.top = `${newY}px`;
      
      // 记录到拖拽分析器
      this.dragAnalyzer.recordPosition(newX, newY);
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      node.style.transform = 'scale(1)';
      node.style.zIndex = '1';
    };

    // 鼠标事件
    node.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
      
      const mouseMoveHandler = (e: MouseEvent) => onMove(e.clientX, e.clientY);
      const mouseUpHandler = () => {
        onEnd();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
      
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });

    // 触摸事件
    node.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      onStart(touch.clientX, touch.clientY);
    });

    node.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    });

    node.addEventListener('touchend', (e) => {
      e.preventDefault();
      onEnd();
    });
  }

  /**
   * 执行拖拽压力测试
   */
  private async runDragStressTest(nodes: HTMLElement[], frequency: number, duration: number): Promise<void> {
    const startTime = performance.now();
    const interval = 1000 / frequency;
    let operations = 0;
    
    while (performance.now() - startTime < duration && this.isRunning) {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      const startX = Math.random() * 800;
      const startY = Math.random() * 600;
      const endX = Math.random() * 800;
      const endY = Math.random() * 600;
      
      this.simulateDragOperation(node, startX, startY, endX, endY);
      operations++;
      
      await this.sleep(interval);
    }
    
    console.log(`Completed ${operations} drag operations in ${duration}ms`);
  }

  /**
   * 模拟拖拽操作
   */
  private simulateDragOperation(node: HTMLElement, startX: number, startY: number, endX: number, endY: number): void {
    const startTime = performance.now();
    
    // 模拟拖拽开始
    node.style.transform = 'scale(1.05)';
    node.style.left = `${startX}px`;
    node.style.top = `${startY}px`;
    
    // 模拟拖拽过程
    const steps = 10;
    const deltaX = (endX - startX) / steps;
    const deltaY = (endY - startY) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = startX + deltaX * i;
      const y = startY + deltaY * i;
      
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      
      this.dragAnalyzer.recordPosition(x, y);
    }
    
    // 模拟拖拽结束
    node.style.transform = 'scale(1)';
    
    const dragLatency = performance.now() - startTime;
    this.monitor.recordDragLatency(dragLatency);
  }

  /**
   * 执行随机拖拽操作
   */
  private async performRandomDragOperations(nodes: HTMLElement[], count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      const startX = Math.random() * 800;
      const startY = Math.random() * 600;
      const endX = Math.random() * 800;
      const endY = Math.random() * 600;
      
      this.simulateDragOperation(node, startX, startY, endX, endY);
      await this.sleep(10);
    }
  }

  /**
   * 模拟用户拖拽操作
   */
  private async simulateUserDragOperation(node: HTMLElement, userId: number): Promise<void> {
    const startX = parseInt(node.style.left) || 0;
    const startY = parseInt(node.style.top) || 0;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = startY + (Math.random() - 0.5) * 200;
    
    this.simulateDragOperation(node, startX, startY, endX, endY);
    await this.sleep(50);
  }

  /**
   * 模拟多选操作
   */
  private async simulateMultiSelection(nodes: HTMLElement[], userId: number): Promise<void> {
    const selectedCount = Math.floor(Math.random() * 5) + 2; // 2-6个节点
    const selectedNodes = [];
    
    for (let i = 0; i < selectedCount; i++) {
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      if (!selectedNodes.includes(node)) {
        selectedNodes.push(node);
        node.style.boxShadow = '0 0 10px #0088ff';
      }
    }
    
    await this.sleep(100);
    
    // 清除选择
    selectedNodes.forEach(node => {
      node.style.boxShadow = '';
    });
  }

  /**
   * 模拟其他交互
   */
  private async simulateOtherInteractions(nodes: HTMLElement[], userId: number): Promise<void> {
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    
    // 模拟悬停效果
    node.style.filter = 'brightness(1.2)';
    await this.sleep(100);
    node.style.filter = '';
    
    // 模拟点击效果
    node.style.transform = 'scale(0.95)';
    await this.sleep(50);
    node.style.transform = 'scale(1)';
  }

  /**
   * 复杂数学计算
   */
  private performComplexMathCalculations(): void {
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.sin(i) * Math.cos(i) * Math.tan(i / 100);
      result += Math.sqrt(i) * Math.pow(i, 0.5);
      result += Math.log(i + 1) * Math.exp(i / 10000);
    }
  }

  /**
   * 矩阵运算
   */
  private performMatrixOperations(): void {
    const size = 100;
    const matrixA = Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
    const matrixB = Array(size).fill(0).map(() => Array(size).fill(0).map(() => Math.random()));
    const result = Array(size).fill(0).map(() => Array(size).fill(0));
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          result[i][j] += matrixA[i][k] * matrixB[k][j];
        }
      }
    }
  }

  /**
   * 排序操作
   */
  private performSortingOperations(): void {
    const arrays = Array(10).fill(0).map(() => 
      Array(1000).fill(0).map(() => Math.floor(Math.random() * 10000))
    );
    
    arrays.forEach(arr => {
      arr.sort((a, b) => a - b);
      arr.reverse();
      arr.sort((a, b) => b - a);
    });
  }

  /**
   * 字符串处理
   */
  private performStringProcessing(): void {
    const baseString = 'The quick brown fox jumps over the lazy dog';
    let result = '';
    
    for (let i = 0; i < 1000; i++) {
      result += baseString.repeat(10);
      result = result.split('').reverse().join('');
      result = result.toUpperCase().toLowerCase();
      result = result.replace(/[aeiou]/g, '*');
    }
  }

  /**
   * 模拟网络操作
   */
  private async simulateNetworkOperation(delay: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        // 模拟数据处理
        const data = Array(1000).fill(0).map(() => Math.random());
        const processed = data.map(x => x * 2).filter(x => x > 1);
        resolve();
      }, delay);
    });
  }

  /**
   * 模拟数据同步
   */
  private async simulateDataSynchronization(nodes: HTMLElement[]): Promise<void> {
    // 模拟数据同步延迟
    await this.sleep(100 + Math.random() * 300);
    
    // 更新节点状态
    nodes.forEach((node, index) => {
      if (Math.random() < 0.1) { // 10%概率更新
        const currentLeft = parseInt(node.style.left) || 0;
        const currentTop = parseInt(node.style.top) || 0;
        node.style.left = `${currentLeft + (Math.random() - 0.5) * 5}px`;
        node.style.top = `${currentTop + (Math.random() - 0.5) * 5}px`;
      }
    });
  }

  /**
   * 计算系统稳定性
   */
  private calculateSystemStability(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const fpsVariance = this.calculateVariance(metrics.map(m => m.fps));
    const memoryTrend = this.calculateMemoryTrend(metrics);
    const errorRate = metrics.filter(m => m.fps < 20).length / metrics.length;
    
    let stability = 100;
    stability -= fpsVariance * 2; // FPS变化影响
    stability -= memoryTrend * 10; // 内存趋势影响
    stability -= errorRate * 50; // 错误率影响
    
    return Math.max(0, Math.min(100, stability));
  }

  /**
   * 计算内存泄漏率 (MB/小时)
   */
  private calculateMemoryLeakRate(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 2) return 0;
    
    const firstMetric = metrics[0];
    const lastMetric = metrics[metrics.length - 1];
    const timeSpanHours = (lastMetric.timestamp - firstMetric.timestamp) / (1000 * 60 * 60);
    const memoryIncrease = lastMetric.memoryUsage - firstMetric.memoryUsage;
    
    return timeSpanHours > 0 ? memoryIncrease / timeSpanHours : 0;
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  /**
   * 计算内存趋势
   */
  private calculateMemoryTrend(metrics: PerformanceMetrics[]): number {
    if (metrics.length < 10) return 0;
    
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    
    const avgFirst = firstHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / secondHalf.length;
    
    return (avgSecond - avgFirst) / avgFirst;
  }

  /**
   * 清理测试环境
   */
  private cleanup(): void {
    if (this.testContainer) {
      this.testContainer.innerHTML = '';
    }
  }

  /**
   * 停止当前测试
   */
  stopCurrentTest(): void {
    this.isRunning = false;
    console.log(`Stopping current test: ${this.currentTest}`);
  }

  /**
   * 获取测试结果
   */
  getResults(): Map<string, StressTestResult> {
    return new Map(this.results);
  }

  /**
   * 生成压力测试报告
   */
  generateStressTestReport(): string {
    if (this.results.size === 0) {
      return '无压力测试结果';
    }

    let report = '极限压力测试报告\n==================\n\n';

    for (const [testName, result] of this.results) {
      report += `测试: ${testName}\n`;
      report += `配置: 最大节点=${result.config.maxNodes}, 测试时长=${(result.config.testDuration/1000).toFixed(0)}s\n`;
      report += `结果: ${result.success ? '✅ 成功' : '❌ 失败'}\n`;
      report += `实际节点数: ${result.maxNodesAchieved}\n`;
      report += `平均FPS: ${result.avgFPS.toFixed(1)}\n`;
      report += `最低FPS: ${result.minFPS.toFixed(1)}\n`;
      report += `内存泄漏率: ${result.memoryLeakRate.toFixed(2)}MB/小时\n`;
      report += `系统稳定性: ${result.systemStability.toFixed(1)}/100\n`;
      
      if (result.errors.length > 0) {
        report += `错误: ${result.errors.join(', ')}\n`;
      }
      
      report += '\n';
    }

    return report;
  }

  /**
   * 导出测试数据
   */
  exportTestData(): any {
    return {
      results: Array.from(this.results.entries()),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };
  }

  /**
   * 清空所有结果
   */
  clearAllResults(): void {
    this.results.clear();
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出工厂函数
export function createStressTestEngine(): ExtremeStressTestEngine {
  return new ExtremeStressTestEngine();
}