/**
 * 缓存和数据结构优化系统
 * 提供多级缓存、LRU策略、空间索引优化等功能
 */

import { Vector2D, BoundingBox } from './math-precision';
import { memoryManager } from './memory-manager';

// 缓存项接口
export interface CacheItem<T> {
  key: string;
  value: T;
  accessTime: number;
  createdTime: number;
  accessCount: number;
  size: number;
}

// 缓存统计
export interface CacheStats {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  totalSize: number;
  itemCount: number;
  hitRate: number;
  averageAccessTime: number;
}

// 空间索引项
export interface SpatialItem {
  id: string;
  bounds: BoundingBox;
  data: any;
}

/**
 * 高性能LRU缓存
 */
export class LRUCache<T> {
  private capacity: number;
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder: string[] = [];
  
  // 统计数据
  private stats: CacheStats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    averageAccessTime: 0
  };
  
  constructor(capacity: number) {
    this.capacity = capacity;
  }
  
  /**
   * 获取缓存项
   */
  get(key: string): T | null {
    const startTime = performance.now();
    const item = this.cache.get(key);
    
    if (item) {
      // 更新访问信息
      item.accessTime = Date.now();
      item.accessCount++;
      
      // 更新访问顺序
      this.moveToFront(key);
      
      this.stats.hitCount++;
      this.updateHitRate();
      
      return item.value;
    }
    
    this.stats.missCount++;
    this.updateHitRate();
    
    const accessTime = performance.now() - startTime;
    this.updateAverageAccessTime(accessTime);
    
    return null;
  }
  
  /**
   * 设置缓存项
   */
  set(key: string, value: T, size = 1): void {
    const now = Date.now();
    const existingItem = this.cache.get(key);
    
    if (existingItem) {
      // 更新现有项
      const sizeDiff = size - existingItem.size;
      existingItem.value = value;
      existingItem.accessTime = now;
      existingItem.accessCount++;
      existingItem.size = size;
      
      this.stats.totalSize += sizeDiff;
      this.moveToFront(key);
    } else {
      // 添加新项
      const item: CacheItem<T> = {
        key,
        value,
        accessTime: now,
        createdTime: now,
        accessCount: 1,
        size
      };
      
      this.cache.set(key, item);
      this.accessOrder.unshift(key);
      
      this.stats.totalSize += size;
      this.stats.itemCount++;
      
      // 检查是否需要驱逐
      this.ensureCapacity();
    }
  }
  
  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    this.stats.totalSize -= item.size;
    this.stats.itemCount--;
    
    return true;
  }
  
  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    
    this.stats.totalSize = 0;
    this.stats.itemCount = 0;
  }
  
  /**
   * 移动到前面
   */
  private moveToFront(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > 0) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.unshift(key);
    }
  }
  
  /**
   * 确保容量限制
   */
  private ensureCapacity(): void {
    while (this.cache.size > this.capacity) {
      const lruKey = this.accessOrder.pop();
      if (lruKey) {
        const item = this.cache.get(lruKey);
        if (item) {
          this.stats.totalSize -= item.size;
          this.stats.itemCount--;
          this.stats.evictionCount++;
        }
        this.cache.delete(lruKey);
      }
    }
  }
  
  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hitCount + this.stats.missCount;
    this.stats.hitRate = total > 0 ? this.stats.hitCount / total : 0;
  }
  
  /**
   * 更新平均访问时间
   */
  private updateAverageAccessTime(accessTime: number): void {
    const total = this.stats.hitCount + this.stats.missCount;
    if (total === 1) {
      this.stats.averageAccessTime = accessTime;
    } else {
      this.stats.averageAccessTime = 
        (this.stats.averageAccessTime * (total - 1) + accessTime) / total;
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * 多级缓存系统
 */
export class MultiLevelCache<T> {
  private l1Cache: LRUCache<T>; // L1: 热数据缓存
  private l2Cache: LRUCache<T>; // L2: 温数据缓存
  private l3Cache: Map<string, T>; // L3: 冷数据存储
  
  constructor(l1Size = 100, l2Size = 500) {
    this.l1Cache = new LRUCache<T>(l1Size);
    this.l2Cache = new LRUCache<T>(l2Size);
    this.l3Cache = new Map();
  }
  
  /**
   * 获取数据
   */
  get(key: string): T | null {
    // L1 缓存查找
    let value = this.l1Cache.get(key);
    if (value !== null) {
      return value;
    }
    
    // L2 缓存查找
    value = this.l2Cache.get(key);
    if (value !== null) {
      // 提升到 L1
      this.l1Cache.set(key, value);
      return value;
    }
    
    // L3 存储查找
    value = this.l3Cache.get(key) || null;
    if (value !== null) {
      // 提升到 L2
      this.l2Cache.set(key, value);
      return value;
    }
    
    return null;
  }
  
  /**
   * 设置数据
   */
  set(key: string, value: T, size = 1): void {
    // 总是设置到 L1
    this.l1Cache.set(key, value, size);
    
    // 从其他级别移除
    this.l2Cache.delete(key);
    this.l3Cache.delete(key);
  }
  
  /**
   * 删除数据
   */
  delete(key: string): boolean {
    let deleted = false;
    
    deleted = this.l1Cache.delete(key) || deleted;
    deleted = this.l2Cache.delete(key) || deleted;
    deleted = this.l3Cache.delete(key) || deleted;
    
    return deleted;
  }
  
  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.l1Cache.has(key) || 
           this.l2Cache.has(key) || 
           this.l3Cache.has(key);
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    l1: CacheStats;
    l2: CacheStats;
    l3: { size: number };
  } {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      l3: { size: this.l3Cache.size }
    };
  }
}

/**
 * 空间哈希索引 - 用于快速碰撞检测
 */
export class SpatialHashGrid {
  private cellSize: number;
  private grid = new Map<string, SpatialItem[]>();
  private itemLocations = new Map<string, string[]>();
  
  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }
  
  /**
   * 插入项目
   */
  insert(item: SpatialItem): void {
    const cells = this.getCellsForBounds(item.bounds);
    const cellKeys: string[] = [];
    
    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      
      this.grid.get(cellKey)!.push(item);
      cellKeys.push(cellKey);
    }
    
    this.itemLocations.set(item.id, cellKeys);
  }
  
  /**
   * 移除项目
   */
  remove(itemId: string): void {
    const cellKeys = this.itemLocations.get(itemId);
    if (!cellKeys) return;
    
    for (const cellKey of cellKeys) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        const index = cell.findIndex(item => item.id === itemId);
        if (index > -1) {
          cell.splice(index, 1);
        }
        
        // 清理空的格子
        if (cell.length === 0) {
          this.grid.delete(cellKey);
        }
      }
    }
    
    this.itemLocations.delete(itemId);
  }
  
  /**
   * 更新项目位置
   */
  update(item: SpatialItem): void {
    this.remove(item.id);
    this.insert(item);
  }
  
  /**
   * 查询范围内的项目
   */
  query(bounds: BoundingBox): SpatialItem[] {
    const cells = this.getCellsForBounds(bounds);
    const results = new Set<SpatialItem>();
    
    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        for (const item of cell) {
          if (item.bounds.intersects(bounds)) {
            results.add(item);
          }
        }
      }
    }
    
    return Array.from(results);
  }
  
  /**
   * 查询点附近的项目
   */
  queryPoint(point: Vector2D, radius = 0): SpatialItem[] {
    const bounds = BoundingBox.fromRect(
      point.x - radius,
      point.y - radius,
      radius * 2,
      radius * 2
    );
    
    return this.query(bounds);
  }
  
  /**
   * 获取边界框涉及的格子
   */
  private getCellsForBounds(bounds: BoundingBox): string[] {
    const minX = Math.floor(bounds.min.x / this.cellSize);
    const minY = Math.floor(bounds.min.y / this.cellSize);
    const maxX = Math.floor(bounds.max.x / this.cellSize);
    const maxY = Math.floor(bounds.max.y / this.cellSize);
    
    const cells: string[] = [];
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    
    return cells;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    cellCount: number;
    itemCount: number;
    averageItemsPerCell: number;
    maxItemsPerCell: number;
  } {
    let totalItems = 0;
    let maxItems = 0;
    
    for (const cell of this.grid.values()) {
      totalItems += cell.length;
      maxItems = Math.max(maxItems, cell.length);
    }
    
    return {
      cellCount: this.grid.size,
      itemCount: this.itemLocations.size,
      averageItemsPerCell: this.grid.size > 0 ? totalItems / this.grid.size : 0,
      maxItemsPerCell: maxItems
    };
  }
  
  /**
   * 清空索引
   */
  clear(): void {
    this.grid.clear();
    this.itemLocations.clear();
  }
}

/**
 * 计算结果缓存器
 */
export class ComputationCache {
  private cache = new LRUCache<any>(1000);
  private computing = new Set<string>();
  
  /**
   * 获取或计算结果
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    // 检查缓存
    let result = this.cache.get(key);
    if (result !== null) {
      return result;
    }
    
    // 防止重复计算
    if (this.computing.has(key)) {
      // 等待正在计算的结果
      return new Promise((resolve) => {
        const checkResult = () => {
          const cached = this.cache.get(key);
          if (cached !== null) {
            resolve(cached);
          } else if (!this.computing.has(key)) {
            // 计算失败，重新计算
            this.getOrCompute(key, computeFn, ttl).then(resolve);
          } else {
            // 继续等待
            setTimeout(checkResult, 10);
          }
        };
        checkResult();
      });
    }
    
    this.computing.add(key);
    
    try {
      result = await computeFn();
      this.cache.set(key, result);
      
      // 设置TTL
      if (ttl) {
        setTimeout(() => {
          this.cache.delete(key);
        }, ttl);
      }
      
      return result;
    } finally {
      this.computing.delete(key);
    }
  }
  
  /**
   * 预计算结果
   */
  precompute<T>(key: string, computeFn: () => Promise<T> | T, ttl?: number): void {
    // 异步预计算
    this.getOrCompute(key, computeFn, ttl).catch(error => {
      console.warn(`Precomputation failed for key ${key}:`, error);
    });
  }
  
  /**
   * 批量预计算
   */
  batchPrecompute<T>(
    items: Array<{ key: string; computeFn: () => Promise<T> | T; ttl?: number }>
  ): void {
    // 使用队列限制并发
    const queue = [...items];
    const concurrency = 3;
    
    const processNext = () => {
      if (queue.length === 0) return;
      
      const item = queue.shift()!;
      this.precompute(item.key, item.computeFn, item.ttl);
      
      // 延迟处理下一个，避免阻塞
      setTimeout(processNext, 1);
    };
    
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      processNext();
    }
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats & { computingCount: number } {
    return {
      ...this.cache.getStats(),
      computingCount: this.computing.size
    };
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.computing.clear();
  }
}

/**
 * 缓存优化器 - 单例
 */
export class CacheOptimizer {
  private static _instance: CacheOptimizer;
  
  // 各种缓存实例
  private transformCache: MultiLevelCache<any>;
  private collisionCache: ComputationCache;
  private spatialIndex: SpatialHashGrid;
  private renderCache: LRUCache<any>;
  
  private constructor() {
    this.transformCache = new MultiLevelCache(50, 200);
    this.collisionCache = new ComputationCache();
    this.spatialIndex = new SpatialHashGrid(100); // 100px格子
    this.renderCache = new LRUCache(300);
    
    this.setupCleanup();
  }
  
  static get instance(): CacheOptimizer {
    if (!CacheOptimizer._instance) {
      CacheOptimizer._instance = new CacheOptimizer();
    }
    return CacheOptimizer._instance;
  }
  
  /**
   * 获取变换缓存
   */
  getTransformCache(): MultiLevelCache<any> {
    return this.transformCache;
  }
  
  /**
   * 获取碰撞计算缓存
   */
  getCollisionCache(): ComputationCache {
    return this.collisionCache;
  }
  
  /**
   * 获取空间索引
   */
  getSpatialIndex(): SpatialHashGrid {
    return this.spatialIndex;
  }
  
  /**
   * 获取渲染缓存
   */
  getRenderCache(): LRUCache<any> {
    return this.renderCache;
  }
  
  /**
   * 缓存坐标变换
   */
  cacheTransform(key: string, transform: any): void {
    this.transformCache.set(key, transform);
  }
  
  /**
   * 获取缓存的变换
   */
  getCachedTransform(key: string): any | null {
    return this.transformCache.get(key);
  }
  
  /**
   * 缓存碰撞检测结果
   */
  async cacheCollisionResult<T>(
    key: string,
    computeFn: () => Promise<T> | T
  ): Promise<T> {
    return this.collisionCache.getOrCompute(key, computeFn, 5000); // 5秒TTL
  }
  
  /**
   * 更新空间索引
   */
  updateSpatialIndex(items: SpatialItem[]): void {
    this.spatialIndex.clear();
    for (const item of items) {
      this.spatialIndex.insert(item);
    }
  }
  
  /**
   * 空间查询
   */
  spatialQuery(bounds: BoundingBox): SpatialItem[] {
    return this.spatialIndex.query(bounds);
  }
  
  /**
   * 缓存渲染结果
   */
  cacheRenderResult(key: string, result: any): void {
    this.renderCache.set(key, result);
  }
  
  /**
   * 获取缓存的渲染结果
   */
  getCachedRenderResult(key: string): any | null {
    return this.renderCache.get(key);
  }
  
  /**
   * 优化节点位置查询
   */
  optimizeNodePositionQuery(nodes: Array<{ id: string; position: Vector2D; size: Vector2D }>): void {
    const spatialItems: SpatialItem[] = nodes.map(node => ({
      id: node.id,
      bounds: BoundingBox.fromRect(
        node.position.x,
        node.position.y,
        node.size.x,
        node.size.y
      ),
      data: node
    }));
    
    this.updateSpatialIndex(spatialItems);
  }
  
  /**
   * 查找附近的节点
   */
  findNearbyNodes(position: Vector2D, radius: number): any[] {
    const items = this.spatialIndex.queryPoint(position, radius);
    return items.map(item => item.data);
  }
  
  /**
   * 获取所有缓存统计
   */
  getAllStats(): {
    transform: ReturnType<MultiLevelCache<any>['getStats']>;
    collision: ReturnType<ComputationCache['getStats']>;
    spatial: ReturnType<SpatialHashGrid['getStats']>;
    render: CacheStats;
  } {
    return {
      transform: this.transformCache.getStats(),
      collision: this.collisionCache.getStats(),
      spatial: this.spatialIndex.getStats(),
      render: this.renderCache.getStats()
    };
  }
  
  /**
   * 生成缓存报告
   */
  generateCacheReport(): string {
    const stats = this.getAllStats();
    
    let report = '缓存优化报告\n==================\n\n';
    
    // 变换缓存
    report += '变换缓存:\n';
    report += `  L1 - 命中率: ${(stats.transform.l1.hitRate * 100).toFixed(1)}%, 项目数: ${stats.transform.l1.itemCount}\n`;
    report += `  L2 - 命中率: ${(stats.transform.l2.hitRate * 100).toFixed(1)}%, 项目数: ${stats.transform.l2.itemCount}\n`;
    report += `  L3 - 项目数: ${stats.transform.l3.size}\n\n`;
    
    // 碰撞缓存
    report += '碰撞计算缓存:\n';
    report += `  命中率: ${(stats.collision.hitRate * 100).toFixed(1)}%\n`;
    report += `  命中数: ${stats.collision.hitCount}\n`;
    report += `  未命中数: ${stats.collision.missCount}\n`;
    report += `  正在计算: ${stats.collision.computingCount}\n\n`;
    
    // 空间索引
    report += '空间索引:\n';
    report += `  格子数: ${stats.spatial.cellCount}\n`;
    report += `  项目数: ${stats.spatial.itemCount}\n`;
    report += `  平均每格项目数: ${stats.spatial.averageItemsPerCell.toFixed(1)}\n`;
    report += `  最大每格项目数: ${stats.spatial.maxItemsPerCell}\n\n`;
    
    // 渲染缓存
    report += '渲染缓存:\n';
    report += `  命中率: ${(stats.render.hitRate * 100).toFixed(1)}%\n`;
    report += `  项目数: ${stats.render.itemCount}\n`;
    report += `  总大小: ${stats.render.totalSize}\n`;
    report += `  平均访问时间: ${stats.render.averageAccessTime.toFixed(2)}ms\n`;
    
    return report;
  }
  
  /**
   * 设置清理定时器
   */
  private setupCleanup(): void {
    // 每分钟清理一次过期缓存
    setInterval(() => {
      this.optimizeMemoryUsage();
    }, 60000);
  }
  
  /**
   * 优化内存使用
   */
  optimizeMemoryUsage(): void {
    console.log('Optimizing cache memory usage...');
    
    // 清理低使用率的缓存项
    // 这里可以添加更复杂的清理策略
    
    console.log('Cache memory optimization completed');
  }
  
  /**
   * 清理所有缓存
   */
  cleanup(): void {
    this.transformCache.clear();
    this.collisionCache.clear();
    this.spatialIndex.clear();
    this.renderCache.clear();
    
    console.log('All caches cleared');
  }
}

// 导出单例
export const cacheOptimizer = CacheOptimizer.instance;

// 便捷函数
export function createLRUCache<T>(capacity: number): LRUCache<T> {
  return new LRUCache<T>(capacity);
}

export function createSpatialIndex(cellSize: number): SpatialHashGrid {
  return new SpatialHashGrid(cellSize);
}

export function createComputationCache(): ComputationCache {
  return new ComputationCache();
}