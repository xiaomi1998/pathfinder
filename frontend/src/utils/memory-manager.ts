/**
 * 内存管理和优化系统
 * 提供对象池、内存监控、垃圾回收优化等功能
 */

import { Vector2D, Matrix2D } from './math-precision';

// 内存使用统计
export interface MemoryStats {
  totalHeapSize: number;
  usedHeapSize: number;
  heapSizeLimit: number;
  objectPoolStats: Map<string, PoolStats>;
  listenerCount: number;
  cacheSize: number;
  timestamp: number;
}

// 对象池统计
export interface PoolStats {
  name: string;
  totalObjects: number;
  activeObjects: number;
  pooledObjects: number;
  hitRate: number;
  allocations: number;
  deallocations: number;
}

// 可池化对象接口
export interface Poolable {
  reset(): void;
  destroy?(): void;
}

/**
 * 通用对象池
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private active = new Set<T>();
  private factory: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  // 统计数据
  private stats: PoolStats;
  
  constructor(
    name: string,
    factory: () => T, 
    resetFn: (obj: T) => void = (obj) => obj.reset(),
    maxSize = 100
  ) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    
    this.stats = {
      name,
      totalObjects: 0,
      activeObjects: 0,
      pooledObjects: 0,
      hitRate: 0,
      allocations: 0,
      deallocations: 0
    };
  }
  
  /**
   * 获取对象
   */
  acquire(): T {
    let obj: T;
    
    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.stats.allocations++;
    } else {
      obj = this.factory();
      this.stats.totalObjects++;
      this.stats.allocations++;
    }
    
    this.active.add(obj);
    this.updateStats();
    return obj;
  }
  
  /**
   * 释放对象
   */
  release(obj: T): void {
    if (!this.active.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }
    
    this.active.delete(obj);
    
    // 重置对象状态
    this.resetFn(obj);
    
    // 如果池未满，放回池中
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    } else {
      // 否则销毁对象
      if (obj.destroy) {
        obj.destroy();
      }
      this.stats.totalObjects--;
    }
    
    this.stats.deallocations++;
    this.updateStats();
  }
  
  /**
   * 批量释放对象
   */
  releaseAll(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj);
    }
  }
  
  /**
   * 预分配对象
   */
  preallocate(count: number): void {
    const toCreate = Math.min(count, this.maxSize - this.pool.length);
    
    for (let i = 0; i < toCreate; i++) {
      const obj = this.factory();
      this.resetFn(obj);
      this.pool.push(obj);
      this.stats.totalObjects++;
    }
    
    this.updateStats();
  }
  
  /**
   * 清空池
   */
  clear(): void {
    // 销毁所有对象
    for (const obj of [...this.pool, ...this.active]) {
      if (obj.destroy) {
        obj.destroy();
      }
    }
    
    this.pool.length = 0;
    this.active.clear();
    
    this.stats.totalObjects = 0;
    this.stats.allocations = 0;
    this.stats.deallocations = 0;
    this.updateStats();
  }
  
  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.activeObjects = this.active.size;
    this.stats.pooledObjects = this.pool.length;
    this.stats.hitRate = this.stats.allocations > 0 ? 
      (this.stats.allocations - this.stats.totalObjects) / this.stats.allocations : 0;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }
}

/**
 * Vector2D 池对象
 */
class PoolableVector2D extends Vector2D implements Poolable {
  reset(): void {
    this.x = 0;
    this.y = 0;
  }
}

/**
 * Matrix2D 池对象  
 */
class PoolableMatrix2D extends Matrix2D implements Poolable {
  reset(): void {
    this.a = 1; this.c = 0; this.e = 0;
    this.b = 0; this.d = 1; this.f = 0;
  }
}

/**
 * 拖拽计算缓存对象
 */
class PoolableDragCache implements Poolable {
  public startPosition!: Vector2D;
  public currentPosition!: Vector2D;
  public offset!: Vector2D;
  public timestamp!: number;
  public transforms!: Matrix2D[];
  
  reset(): void {
    if (this.startPosition) MemoryManager.instance.releaseVector2D(this.startPosition);
    if (this.currentPosition) MemoryManager.instance.releaseVector2D(this.currentPosition);
    if (this.offset) MemoryManager.instance.releaseVector2D(this.offset);
    
    if (this.transforms) {
      for (const transform of this.transforms) {
        MemoryManager.instance.releaseMatrix2D(transform);
      }
    }
    
    this.timestamp = 0;
    this.transforms = [];
  }
}

/**
 * 事件监听器管理器
 */
export class EventListenerManager {
  private listeners = new Map<Element, Map<string, Set<EventListenerOrEventListenerObject>>>();
  private abortControllers = new Map<string, AbortController>();
  
  /**
   * 添加事件监听器
   */
  addListener(
    element: Element, 
    type: string, 
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
    id?: string
  ): void {
    // 使用 AbortController 管理监听器
    const abortController = new AbortController();
    const listenerOptions = { 
      ...options, 
      signal: abortController.signal 
    };
    
    element.addEventListener(type, listener, listenerOptions);
    
    // 记录监听器
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }
    
    const elementListeners = this.listeners.get(element)!;
    if (!elementListeners.has(type)) {
      elementListeners.set(type, new Set());
    }
    
    elementListeners.get(type)!.add(listener);
    
    if (id) {
      this.abortControllers.set(id, abortController);
    }
  }
  
  /**
   * 移除特定监听器
   */
  removeListener(
    element: Element, 
    type: string, 
    listener: EventListenerOrEventListenerObject
  ): void {
    const elementListeners = this.listeners.get(element);
    if (!elementListeners) return;
    
    const typeListeners = elementListeners.get(type);
    if (!typeListeners) return;
    
    typeListeners.delete(listener);
    
    if (typeListeners.size === 0) {
      elementListeners.delete(type);
    }
    
    if (elementListeners.size === 0) {
      this.listeners.delete(element);
    }
  }
  
  /**
   * 通过ID移除监听器
   */
  removeListenerById(id: string): void {
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(id);
    }
  }
  
  /**
   * 移除元素上的所有监听器
   */
  removeAllListeners(element: Element): void {
    const elementListeners = this.listeners.get(element);
    if (!elementListeners) return;
    
    // AbortController 会自动清理所有相关监听器
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
    }
    
    this.listeners.delete(element);
  }
  
  /**
   * 清理所有监听器
   */
  cleanup(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    
    this.listeners.clear();
    this.abortControllers.clear();
  }
  
  /**
   * 获取监听器数量
   */
  getListenerCount(): number {
    let count = 0;
    for (const elementMap of this.listeners.values()) {
      for (const listenerSet of elementMap.values()) {
        count += listenerSet.size;
      }
    }
    return count;
  }
}

/**
 * WeakMap 缓存管理器
 */
export class WeakMapCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  private accessCount = new Map<K, number>();
  private maxSize: number;
  
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }
  
  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    
    // 限制访问计数的大小
    if (this.accessCount.size > this.maxSize) {
      const oldestKey = this.accessCount.keys().next().value;
      this.accessCount.delete(oldestKey);
    }
  }
  
  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    }
    return value;
  }
  
  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  /**
   * 删除缓存
   */
  delete(key: K): void {
    this.cache.delete(key);
    this.accessCount.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    // WeakMap 不支持 clear，但引用会被自动清理
    this.accessCount.clear();
  }
  
  /**
   * 获取缓存大小估算
   */
  getSize(): number {
    return this.accessCount.size;
  }
}

/**
 * 内存管理器 - 单例模式
 */
export class MemoryManager {
  private static _instance: MemoryManager;
  
  // 对象池
  private vector2DPool: ObjectPool<PoolableVector2D>;
  private matrix2DPool: ObjectPool<PoolableMatrix2D>;
  private dragCachePool: ObjectPool<PoolableDragCache>;
  
  // 事件管理器
  private eventManager: EventListenerManager;
  
  // 缓存管理器
  private weakCaches = new Set<WeakMapCache<any, any>>();
  
  // 内存监控
  private memoryStats: MemoryStats | null = null;
  private monitoringInterval: number | null = null;
  private isMonitoring = false;
  
  private constructor() {
    // 初始化对象池
    this.vector2DPool = new ObjectPool(
      'Vector2D',
      () => new PoolableVector2D(0, 0),
      (obj) => obj.reset(),
      200 // 预分配200个Vector2D对象
    );
    
    this.matrix2DPool = new ObjectPool(
      'Matrix2D', 
      () => new PoolableMatrix2D(),
      (obj) => obj.reset(),
      50 // 预分配50个Matrix2D对象
    );
    
    this.dragCachePool = new ObjectPool(
      'DragCache',
      () => new PoolableDragCache(),
      (obj) => obj.reset(),
      20 // 预分配20个拖拽缓存对象
    );
    
    // 初始化事件管理器
    this.eventManager = new EventListenerManager();
    
    // 预分配常用对象
    this.preallocateObjects();
    
    // 监听页面卸载事件进行清理
    this.setupCleanupListeners();
  }
  
  static get instance(): MemoryManager {
    if (!MemoryManager._instance) {
      MemoryManager._instance = new MemoryManager();
    }
    return MemoryManager._instance;
  }
  
  /**
   * 预分配对象
   */
  private preallocateObjects(): void {
    this.vector2DPool.preallocate(100);
    this.matrix2DPool.preallocate(20);
    this.dragCachePool.preallocate(10);
  }
  
  /**
   * 设置清理监听器
   */
  private setupCleanupListeners(): void {
    const cleanup = () => this.cleanup();
    
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);
    
    // 页面可见性变化时进行内存优化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.optimizeMemory();
      }
    });
  }
  
  /**
   * 获取Vector2D对象
   */
  acquireVector2D(x = 0, y = 0): PoolableVector2D {
    const vector = this.vector2DPool.acquire();
    vector.x = x;
    vector.y = y;
    return vector;
  }
  
  /**
   * 释放Vector2D对象
   */
  releaseVector2D(vector: PoolableVector2D): void {
    this.vector2DPool.release(vector);
  }
  
  /**
   * 获取Matrix2D对象
   */
  acquireMatrix2D(): PoolableMatrix2D {
    return this.matrix2DPool.acquire();
  }
  
  /**
   * 释放Matrix2D对象
   */
  releaseMatrix2D(matrix: PoolableMatrix2D): void {
    this.matrix2DPool.release(matrix);
  }
  
  /**
   * 获取拖拽缓存对象
   */
  acquireDragCache(): PoolableDragCache {
    return this.dragCachePool.acquire();
  }
  
  /**
   * 释放拖拽缓存对象
   */
  releaseDragCache(cache: PoolableDragCache): void {
    this.dragCachePool.release(cache);
  }
  
  /**
   * 获取事件管理器
   */
  getEventManager(): EventListenerManager {
    return this.eventManager;
  }
  
  /**
   * 创建WeakMap缓存
   */
  createWeakMapCache<K extends object, V>(maxSize = 1000): WeakMapCache<K, V> {
    const cache = new WeakMapCache<K, V>(maxSize);
    this.weakCaches.add(cache);
    return cache;
  }
  
  /**
   * 开始内存监控
   */
  startMemoryMonitoring(interval = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.updateMemoryStats();
    }, interval);
    
    console.log('Memory monitoring started');
  }
  
  /**
   * 停止内存监控
   */
  stopMemoryMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Memory monitoring stopped');
  }
  
  /**
   * 更新内存统计
   */
  private updateMemoryStats(): void {
    const objectPoolStats = new Map([
      ['Vector2D', this.vector2DPool.getStats()],
      ['Matrix2D', this.matrix2DPool.getStats()],
      ['DragCache', this.dragCachePool.getStats()]
    ]);
    
    let cacheSize = 0;
    for (const cache of this.weakCaches) {
      cacheSize += cache.getSize();
    }
    
    // 获取内存信息（如果可用）
    let totalHeapSize = 0;
    let usedHeapSize = 0;
    let heapSizeLimit = 0;
    
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      totalHeapSize = memory.totalJSHeapSize || 0;
      usedHeapSize = memory.usedJSHeapSize || 0;  
      heapSizeLimit = memory.jsHeapSizeLimit || 0;
    }
    
    this.memoryStats = {
      totalHeapSize: totalHeapSize / (1024 * 1024), // MB
      usedHeapSize: usedHeapSize / (1024 * 1024),   // MB
      heapSizeLimit: heapSizeLimit / (1024 * 1024), // MB
      objectPoolStats,
      listenerCount: this.eventManager.getListenerCount(),
      cacheSize,
      timestamp: performance.now()
    };
  }
  
  /**
   * 获取内存统计
   */
  getMemoryStats(): MemoryStats | null {
    if (!this.isMonitoring) {
      this.updateMemoryStats();
    }
    return this.memoryStats;
  }
  
  /**
   * 内存优化
   */
  optimizeMemory(): void {
    console.log('Optimizing memory...');
    
    // 清理缓存
    for (const cache of this.weakCaches) {
      // WeakMap 会自动清理，但我们可以清理访问计数
      cache.clear();
    }
    
    // 建议垃圾回收（如果可用）
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    console.log('Memory optimization completed');
  }
  
  /**
   * 强制垃圾回收
   */
  forceGarbageCollection(): void {
    if (typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('Forced garbage collection');
    } else {
      console.warn('Garbage collection not available');
    }
  }
  
  /**
   * 生成内存报告
   */
  generateMemoryReport(): string {
    const stats = this.getMemoryStats();
    if (!stats) {
      return 'Memory monitoring not active';
    }
    
    let report = '内存使用报告\n==================\n\n';
    
    // 堆内存信息
    if (stats.totalHeapSize > 0) {
      report += `总堆大小: ${stats.totalHeapSize.toFixed(1)} MB\n`;
      report += `已使用堆大小: ${stats.usedHeapSize.toFixed(1)} MB\n`;
      report += `堆大小限制: ${stats.heapSizeLimit.toFixed(1)} MB\n`;
      report += `内存使用率: ${(stats.usedHeapSize / stats.heapSizeLimit * 100).toFixed(1)}%\n\n`;
    }
    
    // 对象池统计
    report += '对象池统计:\n';
    for (const [name, poolStats] of stats.objectPoolStats) {
      report += `  ${name}:\n`;
      report += `    总对象数: ${poolStats.totalObjects}\n`;
      report += `    活跃对象: ${poolStats.activeObjects}\n`;
      report += `    池中对象: ${poolStats.pooledObjects}\n`;
      report += `    命中率: ${(poolStats.hitRate * 100).toFixed(1)}%\n`;
      report += `    分配次数: ${poolStats.allocations}\n`;
      report += `    释放次数: ${poolStats.deallocations}\n\n`;
    }
    
    // 其他统计
    report += `事件监听器数量: ${stats.listenerCount}\n`;
    report += `缓存大小: ${stats.cacheSize}\n`;
    
    return report;
  }
  
  /**
   * 清理所有资源
   */
  cleanup(): void {
    console.log('Cleaning up memory manager...');
    
    // 停止监控
    this.stopMemoryMonitoring();
    
    // 清理对象池
    this.vector2DPool.clear();
    this.matrix2DPool.clear();
    this.dragCachePool.clear();
    
    // 清理事件监听器
    this.eventManager.cleanup();
    
    // 清理缓存
    for (const cache of this.weakCaches) {
      cache.clear();
    }
    this.weakCaches.clear();
    
    console.log('Memory manager cleanup completed');
  }
  
  /**
   * 检查内存泄漏
   */
  checkMemoryLeaks(): {
    hasLeaks: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const stats = this.getMemoryStats();
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (!stats) {
      return { hasLeaks: false, issues: ['无法获取内存统计'], suggestions: [] };
    }
    
    // 检查内存使用率
    if (stats.heapSizeLimit > 0 && stats.usedHeapSize / stats.heapSizeLimit > 0.8) {
      issues.push('内存使用率过高 (>80%)');
      suggestions.push('考虑优化对象创建和销毁逻辑');
    }
    
    // 检查对象池效率
    for (const [name, poolStats] of stats.objectPoolStats) {
      if (poolStats.hitRate < 0.5 && poolStats.allocations > 100) {
        issues.push(`${name}对象池命中率低 (${(poolStats.hitRate * 100).toFixed(1)}%)`);
        suggestions.push(`增加${name}对象池大小或优化对象重用逻辑`);
      }
      
      if (poolStats.activeObjects > poolStats.totalObjects * 0.9) {
        issues.push(`${name}活跃对象占比过高，可能存在对象未释放`);
        suggestions.push(`检查${name}对象的释放逻辑`);
      }
    }
    
    // 检查事件监听器
    if (stats.listenerCount > 1000) {
      issues.push('事件监听器数量过多');
      suggestions.push('检查事件监听器的清理逻辑');
    }
    
    // 检查缓存大小
    if (stats.cacheSize > 10000) {
      issues.push('缓存大小过大');
      suggestions.push('实现缓存清理策略');
    }
    
    return {
      hasLeaks: issues.length > 0,
      issues,
      suggestions
    };
  }
}

// 导出单例实例
export const memoryManager = MemoryManager.instance;

// 导出便捷函数
export function acquireVector2D(x = 0, y = 0): PoolableVector2D {
  return memoryManager.acquireVector2D(x, y);
}

export function releaseVector2D(vector: PoolableVector2D): void {
  memoryManager.releaseVector2D(vector);
}

export function acquireMatrix2D(): PoolableMatrix2D {
  return memoryManager.acquireMatrix2D();
}

export function releaseMatrix2D(matrix: PoolableMatrix2D): void {
  memoryManager.releaseMatrix2D(matrix);
}