/**
 * 渲染性能优化系统
 * 提供批量DOM操作、requestAnimationFrame调度、GPU加速等功能
 */

import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';

// 渲染任务类型
export type RenderTaskType = 'immediate' | 'animation' | 'idle' | 'background';

// 渲染任务优先级
export type RenderPriority = 'critical' | 'high' | 'normal' | 'low';

// 渲染任务接口
export interface RenderTask {
  id: string;
  type: RenderTaskType;
  priority: RenderPriority;
  execute: () => void | Promise<void>;
  timeout?: number;
  dependencies?: string[];
  createdAt: number;
}

// 批量DOM操作记录
export interface DOMBatchOperation {
  id: string;
  element: Element;
  operations: Array<{
    type: 'style' | 'attribute' | 'class' | 'text' | 'html';
    property: string;
    value: any;
  }>;
}

// 渲染统计
export interface RenderStats {
  frameCount: number;
  averageFPS: number;
  frameTime: number;
  renderTime: number;
  tasksExecuted: number;
  batchOperations: number;
  gpuAccelerated: number;
  timestamp: number;
}

/**
 * 高性能渲染调度器
 */
export class RenderScheduler {
  private taskQueues = new Map<RenderPriority, RenderTask[]>();
  private executingTasks = new Set<string>();
  private completedTasks = new Set<string>();
  
  // 调度器状态
  private isRunning = false;
  private animationFrameId: number | null = null;
  private idleCallbackId: number | null = null;
  
  // 性能监控
  private frameStartTime = 0;
  private lastFrameTime = 0;
  private frameCount = 0;
  private renderStats: RenderStats;
  
  // 时间预算 (毫秒)
  private readonly TIME_BUDGET = {
    critical: 16,  // 1帧内完成
    high: 8,       // 半帧内完成
    normal: 5,     // 5ms预算
    low: 2         // 2ms预算
  };

  constructor() {
    this.taskQueues.set('critical', []);
    this.taskQueues.set('high', []);
    this.taskQueues.set('normal', []);
    this.taskQueues.set('low', []);
    
    this.renderStats = {
      frameCount: 0,
      averageFPS: 60,
      frameTime: 0,
      renderTime: 0,
      tasksExecuted: 0,
      batchOperations: 0,
      gpuAccelerated: 0,
      timestamp: performance.now()
    };
  }
  
  /**
   * 添加渲染任务
   */
  addTask(task: Omit<RenderTask, 'createdAt'>): void {
    const fullTask: RenderTask = {
      ...task,
      createdAt: performance.now()
    };
    
    const queue = this.taskQueues.get(task.priority);
    if (queue) {
      // 按依赖关系排序
      this.insertTaskSorted(queue, fullTask);
    }
    
    // 确保调度器运行
    if (!this.isRunning) {
      this.start();
    }
  }
  
  /**
   * 按依赖关系插入任务
   */
  private insertTaskSorted(queue: RenderTask[], task: RenderTask): void {
    // 简单的依赖排序：有依赖的任务放在后面
    if (!task.dependencies || task.dependencies.length === 0) {
      queue.unshift(task); // 无依赖的任务优先执行
    } else {
      queue.push(task);
    }
  }
  
  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleFrame();
    this.scheduleIdleTasks();
    
    console.log('Render scheduler started');
  }
  
  /**
   * 停止调度器
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.idleCallbackId && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
    
    console.log('Render scheduler stopped');
  }
  
  /**
   * 调度动画帧任务
   */
  private scheduleFrame(): void {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame((timestamp) => {
      this.frameStartTime = timestamp;
      this.executeFrameTasks(timestamp);
      this.updateStats(timestamp);
      this.scheduleFrame(); // 继续下一帧
    });
  }
  
  /**
   * 调度空闲任务
   */
  private scheduleIdleTasks(): void {
    if (!this.isRunning) return;
    
    if ('requestIdleCallback' in window) {
      this.idleCallbackId = (window as any).requestIdleCallback(
        (deadline: IdleDeadline) => {
          this.executeIdleTasks(deadline);
          this.scheduleIdleTasks(); // 继续下一个空闲周期
        },
        { timeout: 100 } // 100ms 超时
      );
    } else {
      // 降级到 setTimeout
      setTimeout(() => {
        const deadline = { timeRemaining: () => 5 }; // 模拟5ms预算
        this.executeIdleTasks(deadline as IdleDeadline);
        this.scheduleIdleTasks();
      }, 16);
    }
  }
  
  /**
   * 执行帧任务
   */
  private executeFrameTasks(timestamp: number): void {
    const startTime = performance.now();
    let remainingTime = 16; // 16ms预算
    
    // 按优先级执行任务
    const priorities: RenderPriority[] = ['critical', 'high', 'normal'];
    
    for (const priority of priorities) {
      if (remainingTime <= 0) break;
      
      const queue = this.taskQueues.get(priority)!;
      const budget = Math.min(remainingTime, this.TIME_BUDGET[priority]);
      
      remainingTime -= this.executeTasks(queue, budget);
    }
    
    this.renderStats.renderTime = performance.now() - startTime;
  }
  
  /**
   * 执行空闲任务
   */
  private executeIdleTasks(deadline: IdleDeadline): void {
    const queue = this.taskQueues.get('low')!;
    
    while (queue.length > 0 && deadline.timeRemaining() > 0) {
      this.executeTasks(queue, deadline.timeRemaining());
    }
  }
  
  /**
   * 执行任务队列
   */
  private executeTasks(queue: RenderTask[], timeBudget: number): number {
    const startTime = performance.now();
    let usedTime = 0;
    
    while (queue.length > 0 && usedTime < timeBudget) {
      const task = queue[0];
      
      // 检查依赖
      if (!this.areDependenciesMet(task)) {
        // 依赖未满足，跳过这个任务，但不移除
        break;
      }
      
      // 移除并执行任务
      queue.shift();
      
      try {
        this.executingTasks.add(task.id);
        task.execute();
        this.completedTasks.add(task.id);
        this.renderStats.tasksExecuted++;
      } catch (error) {
        console.error(`Render task ${task.id} failed:`, error);
      } finally {
        this.executingTasks.delete(task.id);
      }
      
      usedTime = performance.now() - startTime;
      
      // 如果任务有超时限制
      if (task.timeout && usedTime > task.timeout) {
        break;
      }
    }
    
    return usedTime;
  }
  
  /**
   * 检查任务依赖是否满足
   */
  private areDependenciesMet(task: RenderTask): boolean {
    if (!task.dependencies) return true;
    
    return task.dependencies.every(dep => this.completedTasks.has(dep));
  }
  
  /**
   * 更新性能统计
   */
  private updateStats(timestamp: number): void {
    this.frameCount++;
    
    if (this.lastFrameTime > 0) {
      const frameTime = timestamp - this.lastFrameTime;
      this.renderStats.frameTime = frameTime;
      
      // 计算滚动平均FPS
      const currentFPS = 1000 / frameTime;
      this.renderStats.averageFPS = this.renderStats.averageFPS * 0.9 + currentFPS * 0.1;
    }
    
    this.lastFrameTime = timestamp;
    this.renderStats.frameCount = this.frameCount;
    this.renderStats.timestamp = timestamp;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): RenderStats {
    return { ...this.renderStats };
  }
  
  /**
   * 清理完成的任务
   */
  cleanup(): void {
    // 定期清理已完成的任务记录，避免内存泄漏
    if (this.completedTasks.size > 1000) {
      const tasks = Array.from(this.completedTasks);
      const toKeep = tasks.slice(-500); // 保留最近500个
      this.completedTasks.clear();
      toKeep.forEach(id => this.completedTasks.add(id));
    }
  }
}

/**
 * 批量DOM操作管理器
 */
export class DOMBatchManager {
  private batchOperations = new Map<Element, DOMBatchOperation>();
  private pendingElements = new Set<Element>();
  private flushPromise: Promise<void> | null = null;
  private isFlashing = false;
  
  /**
   * 添加样式操作
   */
  setStyle(element: Element, property: string, value: string): void {
    this.addOperation(element, 'style', property, value);
  }
  
  /**
   * 添加属性操作
   */
  setAttribute(element: Element, name: string, value: string): void {
    this.addOperation(element, 'attribute', name, value);
  }
  
  /**
   * 添加类操作
   */
  addClass(element: Element, className: string): void {
    this.addOperation(element, 'class', 'add', className);
  }
  
  /**
   * 移除类操作
   */
  removeClass(element: Element, className: string): void {
    this.addOperation(element, 'class', 'remove', className);
  }
  
  /**
   * 设置文本内容
   */
  setTextContent(element: Element, text: string): void {
    this.addOperation(element, 'text', 'textContent', text);
  }
  
  /**
   * 设置HTML内容
   */
  setInnerHTML(element: Element, html: string): void {
    this.addOperation(element, 'html', 'innerHTML', html);
  }
  
  /**
   * 添加操作到批次
   */
  private addOperation(element: Element, type: string, property: string, value: any): void {
    let batch = this.batchOperations.get(element);
    
    if (!batch) {
      batch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        element,
        operations: []
      };
      this.batchOperations.set(element, batch);
    }
    
    // 检查是否已有相同属性的操作，如有则替换
    const existingIndex = batch.operations.findIndex(op => 
      op.type === type && op.property === property
    );
    
    if (existingIndex >= 0) {
      batch.operations[existingIndex].value = value;
    } else {
      batch.operations.push({ type: type as any, property, value });
    }
    
    this.pendingElements.add(element);
    
    // 调度刷新
    this.scheduleFlush();
  }
  
  /**
   * 调度批量刷新
   */
  private scheduleFlush(): void {
    if (this.flushPromise) return;
    
    this.flushPromise = new Promise((resolve) => {
      RenderOptimizer.instance.getScheduler().addTask({
        id: `dom_batch_${Date.now()}`,
        type: 'immediate',
        priority: 'high',
        execute: () => {
          this.flush();
          resolve();
        }
      });
    });
  }
  
  /**
   * 执行批量操作
   */
  private flush(): void {
    if (this.isFlashing) return;
    
    this.isFlashing = true;
    const startTime = performance.now();
    
    try {
      // 批量读取和写入分离，减少重排重绘
      const readOperations: Array<() => void> = [];
      const writeOperations: Array<() => void> = [];
      
      for (const element of this.pendingElements) {
        const batch = this.batchOperations.get(element);
        if (!batch) continue;
        
        // 收集写操作
        for (const op of batch.operations) {
          writeOperations.push(() => this.executeOperation(element, op));
        }
      }
      
      // 执行所有读操作
      readOperations.forEach(op => op());
      
      // 执行所有写操作
      writeOperations.forEach(op => op());
      
    } catch (error) {
      console.error('DOM batch flush failed:', error);
    } finally {
      // 清理
      this.batchOperations.clear();
      this.pendingElements.clear();
      this.flushPromise = null;
      this.isFlashing = false;
      
      RenderOptimizer.instance.updateBatchStats(performance.now() - startTime);
    }
  }
  
  /**
   * 执行单个DOM操作
   */
  private executeOperation(element: Element, operation: DOMBatchOperation['operations'][0]): void {
    try {
      switch (operation.type) {
        case 'style':
          (element as HTMLElement).style[operation.property as any] = operation.value;
          break;
          
        case 'attribute':
          element.setAttribute(operation.property, operation.value);
          break;
          
        case 'class':
          if (operation.property === 'add') {
            element.classList.add(operation.value);
          } else if (operation.property === 'remove') {
            element.classList.remove(operation.value);
          }
          break;
          
        case 'text':
          element.textContent = operation.value;
          break;
          
        case 'html':
          element.innerHTML = operation.value;
          break;
      }
    } catch (error) {
      console.error(`DOM operation failed:`, error);
    }
  }
  
  /**
   * 强制立即刷新
   */
  flushNow(): void {
    if (this.pendingElements.size > 0) {
      this.flush();
    }
  }
  
  /**
   * 获取待处理操作数量
   */
  getPendingCount(): number {
    return this.pendingElements.size;
  }
}

/**
 * GPU加速管理器
 */
export class GPUAccelerationManager {
  private acceleratedElements = new WeakSet<Element>();
  private accelerationCount = 0;
  
  /**
   * 启用GPU加速
   */
  enableAcceleration(element: Element, force = false): void {
    if (this.acceleratedElements.has(element) && !force) return;
    
    const htmlElement = element as HTMLElement;
    
    // 启用硬件加速
    htmlElement.style.willChange = 'transform';
    htmlElement.style.transform = htmlElement.style.transform || 'translateZ(0)';
    
    // 使用 contain 优化
    if (!htmlElement.style.contain) {
      htmlElement.style.contain = 'layout style paint';
    }
    
    this.acceleratedElements.add(element);
    this.accelerationCount++;
  }
  
  /**
   * 禁用GPU加速
   */
  disableAcceleration(element: Element): void {
    if (!this.acceleratedElements.has(element)) return;
    
    const htmlElement = element as HTMLElement;
    
    // 移除硬件加速相关样式
    htmlElement.style.willChange = 'auto';
    
    // 如果transform只是为了开启加速，则移除
    if (htmlElement.style.transform === 'translateZ(0)') {
      htmlElement.style.transform = '';
    }
    
    this.acceleratedElements.delete(element);
    this.accelerationCount--;
  }
  
  /**
   * 优化变换性能
   */
  optimizeTransform(element: Element, transform: string): void {
    this.enableAcceleration(element);
    
    const htmlElement = element as HTMLElement;
    
    // 使用 transform3d 强制GPU加速
    if (!transform.includes('translateZ') && !transform.includes('translate3d')) {
      if (transform.includes('translate(')) {
        // 将 translate(x, y) 转换为 translate3d(x, y, 0)
        transform = transform.replace(
          /translate\(([^,)]+),\s*([^)]+)\)/g, 
          'translate3d($1, $2, 0)'
        );
      } else {
        transform += ' translateZ(0)';
      }
    }
    
    htmlElement.style.transform = transform;
  }
  
  /**
   * 批量优化多个元素的变换
   */
  batchOptimizeTransforms(transforms: Array<{ element: Element; transform: string }>): void {
    // 使用渲染调度器批量处理
    RenderOptimizer.instance.getScheduler().addTask({
      id: `gpu_batch_${Date.now()}`,
      type: 'animation',
      priority: 'high',
      execute: () => {
        for (const { element, transform } of transforms) {
          this.optimizeTransform(element, transform);
        }
      }
    });
  }
  
  /**
   * 获取GPU加速统计
   */
  getStats(): { acceleratedElements: number } {
    return { acceleratedElements: this.accelerationCount };
  }
}

/**
 * 渲染优化器主类 - 单例
 */
export class RenderOptimizer {
  private static _instance: RenderOptimizer;
  
  private scheduler: RenderScheduler;
  private batchManager: DOMBatchManager;
  private gpuManager: GPUAccelerationManager;
  
  // 性能监控
  private batchOperationCount = 0;
  private batchOperationTime = 0;
  
  private constructor() {
    this.scheduler = new RenderScheduler();
    this.batchManager = new DOMBatchManager();
    this.gpuManager = new GPUAccelerationManager();
    
    // 启动调度器
    this.scheduler.start();
    
    // 定期清理
    this.setupCleanup();
  }
  
  static get instance(): RenderOptimizer {
    if (!RenderOptimizer._instance) {
      RenderOptimizer._instance = new RenderOptimizer();
    }
    return RenderOptimizer._instance;
  }
  
  /**
   * 获取调度器
   */
  getScheduler(): RenderScheduler {
    return this.scheduler;
  }
  
  /**
   * 获取批量管理器
   */
  getBatchManager(): DOMBatchManager {
    return this.batchManager;
  }
  
  /**
   * 获取GPU管理器
   */
  getGPUManager(): GPUAccelerationManager {
    return this.gpuManager;
  }
  
  /**
   * 优化元素拖拽渲染
   */
  optimizeDragRendering(element: Element, position: { x: number; y: number }): void {
    // 启用GPU加速
    this.gpuManager.enableAcceleration(element);
    
    // 批量设置变换
    this.batchManager.setStyle(
      element, 
      'transform', 
      `translate3d(${position.x}px, ${position.y}px, 0)`
    );
  }
  
  /**
   * 批量优化多个节点位置
   */
  batchOptimizePositions(positions: Array<{ element: Element; x: number; y: number }>): void {
    const transforms = positions.map(({ element, x, y }) => ({
      element,
      transform: `translate3d(${x}px, ${y}px, 0)`
    }));
    
    this.gpuManager.batchOptimizeTransforms(transforms);
  }
  
  /**
   * 优化连接线渲染
   */
  optimizeConnectionRendering(
    svgElement: SVGElement, 
    pathData: string,
    animate = false
  ): void {
    if (animate) {
      // 动画任务
      this.scheduler.addTask({
        id: `connection_${Date.now()}`,
        type: 'animation',
        priority: 'normal',
        execute: () => {
          this.batchManager.setAttribute(svgElement, 'd', pathData);
        }
      });
    } else {
      // 立即更新
      this.batchManager.setAttribute(svgElement, 'd', pathData);
    }
  }
  
  /**
   * 更新批次统计
   */
  updateBatchStats(operationTime: number): void {
    this.batchOperationCount++;
    this.batchOperationTime += operationTime;
  }
  
  /**
   * 获取综合性能统计
   */
  getPerformanceStats(): RenderStats & {
    batchOperations: number;
    batchOperationTime: number;
    gpuAccelerated: number;
  } {
    const renderStats = this.scheduler.getStats();
    const gpuStats = this.gpuManager.getStats();
    
    return {
      ...renderStats,
      batchOperations: this.batchOperationCount,
      batchOperationTime: this.batchOperationTime,
      gpuAccelerated: gpuStats.acceleratedElements
    };
  }
  
  /**
   * 设置清理定时器
   */
  private setupCleanup(): void {
    setInterval(() => {
      this.scheduler.cleanup();
    }, 30000); // 每30秒清理一次
  }
  
  /**
   * 销毁优化器
   */
  destroy(): void {
    this.scheduler.stop();
    this.batchManager.flushNow();
  }
}

// 导出单例
export const renderOptimizer = RenderOptimizer.instance;

// 便捷函数
export function scheduleRenderTask(task: Omit<RenderTask, 'createdAt'>): void {
  renderOptimizer.getScheduler().addTask(task);
}

export function batchSetStyle(element: Element, property: string, value: string): void {
  renderOptimizer.getBatchManager().setStyle(element, property, value);
}

export function enableGPUAcceleration(element: Element): void {
  renderOptimizer.getGPUManager().enableAcceleration(element);
}

export function optimizeDragTransform(element: Element, x: number, y: number): void {
  renderOptimizer.optimizeDragRendering(element, { x, y });
}