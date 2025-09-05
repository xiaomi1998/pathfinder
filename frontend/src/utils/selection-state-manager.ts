/**
 * 选择状态管理器
 * 高性能的状态存储和同步系统，支持复杂选择状态、内存优化、状态压缩
 */

import { Vector2D } from './math-precision';
import { memoryManager } from './memory-manager';
import { cacheOptimizer } from './cache-optimizer';
import type { SelectionState, SelectionItem } from './multi-selection-manager';

// 状态压缩配置
export interface StateCompressionConfig {
  enabled: boolean;
  threshold: number;        // 压缩阈值（状态数量）
  compressionRatio: number; // 目标压缩比
  retentionTime: number;    // 状态保留时间（毫秒）
}

// 状态快照
export interface StateSnapshot {
  id: string;
  timestamp: number;
  selectedIds: Set<string>;
  stateMap: Map<string, SelectionState>;
  metadata: {
    totalItems: number;
    selectedCount: number;
    version: number;
    compressed: boolean;
  };
}

// 状态变更事件
export interface StateChangeEvent {
  type: 'added' | 'removed' | 'modified' | 'cleared' | 'batch';
  itemIds: string[];
  previousStates: SelectionState[];
  currentStates: SelectionState[];
  timestamp: number;
  batchId?: string;
}

// 状态同步配置
export interface StateSyncConfig {
  autoSync: boolean;
  syncInterval: number;     // 同步间隔（毫秒）
  batchSize: number;        // 批量同步大小
  conflictResolution: 'latest' | 'merge' | 'manual';
  enableDeltaSync: boolean; // 增量同步
}

/**
 * 高性能选择状态管理器
 */
export class SelectionStateManager {
  private stateMap: Map<string, SelectionState> = new Map();
  private stateHistory: StateSnapshot[] = [];
  private currentVersion = 0;
  private lastSyncTime = 0;
  
  // 状态压缩
  private compressionConfig: StateCompressionConfig;
  private compressedStates: Map<string, Uint8Array> = new Map();
  
  // 性能监控
  private stateChangeCount = 0;
  private lastStateChangeTime = 0;
  private memoryUsage = 0;
  
  // 批量操作
  private batchOperations: Map<string, StateChangeEvent[]> = new Map();
  private currentBatchId: string | null = null;
  
  // 事件监听器
  private changeListeners: Set<(event: StateChangeEvent) => void> = new Set();

  constructor(
    compressionConfig: Partial<StateCompressionConfig> = {},
    syncConfig: Partial<StateSyncConfig> = {}
  ) {
    this.compressionConfig = {
      enabled: true,
      threshold: 1000,
      compressionRatio: 0.3,
      retentionTime: 300000, // 5分钟
      ...compressionConfig
    };

    this.initializeMemoryOptimization();
    
    console.log('SelectionStateManager: Initialized with compression enabled:', this.compressionConfig.enabled);
  }

  /**
   * 初始化内存优化
   */
  private initializeMemoryOptimization(): void {
    // 定期清理过期状态
    setInterval(() => {
      this.cleanupExpiredStates();
    }, 60000); // 每分钟清理一次

    // 监控内存使用
    setInterval(() => {
      this.updateMemoryUsage();
    }, 30000); // 每30秒更新内存使用情况
  }

  /**
   * 设置单个项目状态
   */
  setState(itemId: string, state: SelectionState): void {
    const previousState = this.stateMap.get(itemId) || SelectionState.UNSELECTED;
    
    if (previousState === state) {
      return; // 状态未改变
    }

    this.stateMap.set(itemId, state);
    this.currentVersion++;
    this.stateChangeCount++;
    this.lastStateChangeTime = performance.now();

    // 触发状态变更事件
    const changeEvent: StateChangeEvent = {
      type: 'modified',
      itemIds: [itemId],
      previousStates: [previousState],
      currentStates: [state],
      timestamp: this.lastStateChangeTime,
      batchId: this.currentBatchId
    };

    if (this.currentBatchId) {
      this.addToBatch(this.currentBatchId, changeEvent);
    } else {
      this.notifyStateChange(changeEvent);
    }

    // 检查是否需要压缩状态
    if (this.shouldCompressStates()) {
      this.compressStates();
    }
  }

  /**
   * 批量设置状态
   */
  setBatchStates(stateUpdates: Array<{ itemId: string; state: SelectionState }>): void {
    if (stateUpdates.length === 0) return;

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startBatch(batchId);

    const itemIds: string[] = [];
    const previousStates: SelectionState[] = [];
    const currentStates: SelectionState[] = [];

    stateUpdates.forEach(({ itemId, state }) => {
      const previousState = this.stateMap.get(itemId) || SelectionState.UNSELECTED;
      
      if (previousState !== state) {
        this.stateMap.set(itemId, state);
        itemIds.push(itemId);
        previousStates.push(previousState);
        currentStates.push(state);
      }
    });

    this.currentVersion++;
    this.stateChangeCount += itemIds.length;
    this.lastStateChangeTime = performance.now();

    if (itemIds.length > 0) {
      const batchEvent: StateChangeEvent = {
        type: 'batch',
        itemIds,
        previousStates,
        currentStates,
        timestamp: this.lastStateChangeTime,
        batchId
      };

      this.addToBatch(batchId, batchEvent);
    }

    this.endBatch(batchId);

    console.log(`SelectionStateManager: Batch updated ${itemIds.length} states`);
  }

  /**
   * 获取项目状态
   */
  getState(itemId: string): SelectionState {
    return this.stateMap.get(itemId) || SelectionState.UNSELECTED;
  }

  /**
   * 获取所有指定状态的项目ID
   */
  getItemsByState(state: SelectionState): string[] {
    const items: string[] = [];
    
    for (const [itemId, itemState] of this.stateMap) {
      if (itemState === state) {
        items.push(itemId);
      }
    }
    
    return items;
  }

  /**
   * 获取选中的项目ID
   */
  getSelectedItems(): string[] {
    return this.getItemsByState(SelectionState.SELECTED);
  }

  /**
   * 获取状态统计
   */
  getStateStats(): Record<SelectionState, number> {
    const stats: Record<SelectionState, number> = {
      [SelectionState.UNSELECTED]: 0,
      [SelectionState.SELECTED]: 0,
      [SelectionState.SEMI_SELECTED]: 0,
      [SelectionState.DISABLED]: 0
    };

    for (const state of this.stateMap.values()) {
      stats[state]++;
    }

    return stats;
  }

  /**
   * 清除所有状态
   */
  clearStates(): void {
    if (this.stateMap.size === 0) return;

    const clearedIds = Array.from(this.stateMap.keys());
    const previousStates = clearedIds.map(id => this.stateMap.get(id)!);
    
    this.stateMap.clear();
    this.currentVersion++;
    this.lastStateChangeTime = performance.now();

    const clearEvent: StateChangeEvent = {
      type: 'cleared',
      itemIds: clearedIds,
      previousStates,
      currentStates: clearedIds.map(() => SelectionState.UNSELECTED),
      timestamp: this.lastStateChangeTime
    };

    this.notifyStateChange(clearEvent);

    console.log(`SelectionStateManager: Cleared ${clearedIds.length} states`);
  }

  /**
   * 开始批量操作
   */
  startBatch(batchId: string): void {
    this.currentBatchId = batchId;
    this.batchOperations.set(batchId, []);
  }

  /**
   * 结束批量操作
   */
  endBatch(batchId: string): void {
    const batchEvents = this.batchOperations.get(batchId);
    if (batchEvents && batchEvents.length > 0) {
      // 合并批量事件并触发
      this.processBatchEvents(batchId, batchEvents);
    }
    
    this.batchOperations.delete(batchId);
    
    if (this.currentBatchId === batchId) {
      this.currentBatchId = null;
    }
  }

  /**
   * 添加到批量操作
   */
  private addToBatch(batchId: string, event: StateChangeEvent): void {
    const batchEvents = this.batchOperations.get(batchId);
    if (batchEvents) {
      batchEvents.push(event);
    }
  }

  /**
   * 处理批量事件
   */
  private processBatchEvents(batchId: string, events: StateChangeEvent[]): void {
    // 合并同一批次的所有事件
    const allItemIds = new Set<string>();
    const itemStateChanges = new Map<string, { previous: SelectionState; current: SelectionState }>();

    events.forEach(event => {
      event.itemIds.forEach((itemId, index) => {
        allItemIds.add(itemId);
        itemStateChanges.set(itemId, {
          previous: event.previousStates[index],
          current: event.currentStates[index]
        });
      });
    });

    const mergedEvent: StateChangeEvent = {
      type: 'batch',
      itemIds: Array.from(allItemIds),
      previousStates: Array.from(allItemIds, id => itemStateChanges.get(id)!.previous),
      currentStates: Array.from(allItemIds, id => itemStateChanges.get(id)!.current),
      timestamp: events[events.length - 1].timestamp,
      batchId
    };

    this.notifyStateChange(mergedEvent);
  }

  /**
   * 创建状态快照
   */
  createSnapshot(): StateSnapshot {
    const selectedIds = new Set(this.getSelectedItems());
    const stateMapCopy = new Map(this.stateMap);

    const snapshot: StateSnapshot = {
      id: `snapshot_${Date.now()}_${this.currentVersion}`,
      timestamp: performance.now(),
      selectedIds,
      stateMap: stateMapCopy,
      metadata: {
        totalItems: this.stateMap.size,
        selectedCount: selectedIds.size,
        version: this.currentVersion,
        compressed: false
      }
    };

    this.stateHistory.push(snapshot);

    // 限制历史记录数量
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    console.log(`SelectionStateManager: Created snapshot ${snapshot.id}`);
    return snapshot;
  }

  /**
   * 恢复状态快照
   */
  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.stateHistory.find(s => s.id === snapshotId);
    if (!snapshot) {
      console.error(`SelectionStateManager: Snapshot ${snapshotId} not found`);
      return false;
    }

    const startTime = performance.now();

    // 清除当前状态
    this.stateMap.clear();

    // 恢复快照状态
    if (snapshot.metadata.compressed) {
      this.decompressAndRestoreSnapshot(snapshot);
    } else {
      for (const [itemId, state] of snapshot.stateMap) {
        this.stateMap.set(itemId, state);
      }
    }

    this.currentVersion++;
    this.lastStateChangeTime = performance.now();

    const restoreTime = performance.now() - startTime;
    console.log(`SelectionStateManager: Restored snapshot ${snapshotId} in ${restoreTime.toFixed(2)}ms`);

    return true;
  }

  /**
   * 检查是否应该压缩状态
   */
  private shouldCompressStates(): boolean {
    return this.compressionConfig.enabled &&
           this.stateMap.size >= this.compressionConfig.threshold &&
           this.stateHistory.length >= 5;
  }

  /**
   * 压缩状态
   */
  private compressStates(): void {
    const startTime = performance.now();
    
    // 压缩旧的快照
    const compressibleSnapshots = this.stateHistory.filter(s => 
      !s.metadata.compressed && 
      (startTime - s.timestamp) > this.compressionConfig.retentionTime
    );

    compressibleSnapshots.forEach(snapshot => {
      const compressed = this.compressSnapshot(snapshot);
      if (compressed) {
        snapshot.metadata.compressed = true;
        this.compressedStates.set(snapshot.id, compressed);
        
        // 清除原始数据以节省内存
        snapshot.stateMap.clear();
        snapshot.selectedIds.clear();
      }
    });

    const compressionTime = performance.now() - startTime;
    if (compressibleSnapshots.length > 0) {
      console.log(`SelectionStateManager: Compressed ${compressibleSnapshots.length} snapshots in ${compressionTime.toFixed(2)}ms`);
    }
  }

  /**
   * 压缩快照
   */
  private compressSnapshot(snapshot: StateSnapshot): Uint8Array | null {
    try {
      // 简单的位压缩：每个状态用2位表示
      const itemIds = Array.from(snapshot.stateMap.keys());
      const stateValues = itemIds.map(id => snapshot.stateMap.get(id) || SelectionState.UNSELECTED);
      
      // 创建压缩数据
      const compressedData = new Uint8Array(Math.ceil(itemIds.length / 4) + 4); // 每字节存储4个状态 + 4字节头部
      
      // 写入头部信息（项目数量）
      const view = new DataView(compressedData.buffer);
      view.setUint32(0, itemIds.length, true);
      
      // 压缩状态数据
      for (let i = 0; i < stateValues.length; i += 4) {
        let byte = 0;
        for (let j = 0; j < 4 && (i + j) < stateValues.length; j++) {
          const stateValue = this.stateToNumber(stateValues[i + j]);
          byte |= (stateValue << (j * 2));
        }
        compressedData[4 + Math.floor(i / 4)] = byte;
      }
      
      return compressedData;
    } catch (error) {
      console.error('SelectionStateManager: Failed to compress snapshot', error);
      return null;
    }
  }

  /**
   * 解压缩并恢复快照
   */
  private decompressAndRestoreSnapshot(snapshot: StateSnapshot): void {
    const compressedData = this.compressedStates.get(snapshot.id);
    if (!compressedData) return;

    const view = new DataView(compressedData.buffer);
    const itemCount = view.getUint32(0, true);
    
    // 需要配合项目ID列表才能完全恢复
    // 这里简化处理，实际应用中需要存储ID映射
    console.warn('SelectionStateManager: Decompression requires item ID mapping');
  }

  /**
   * 状态到数字的转换
   */
  private stateToNumber(state: SelectionState): number {
    switch (state) {
      case SelectionState.UNSELECTED: return 0;
      case SelectionState.SELECTED: return 1;
      case SelectionState.SEMI_SELECTED: return 2;
      case SelectionState.DISABLED: return 3;
      default: return 0;
    }
  }

  /**
   * 数字到状态的转换
   */
  private numberToState(num: number): SelectionState {
    switch (num) {
      case 0: return SelectionState.UNSELECTED;
      case 1: return SelectionState.SELECTED;
      case 2: return SelectionState.SEMI_SELECTED;
      case 3: return SelectionState.DISABLED;
      default: return SelectionState.UNSELECTED;
    }
  }

  /**
   * 清理过期状态
   */
  private cleanupExpiredStates(): void {
    const currentTime = performance.now();
    const expiredSnapshots = this.stateHistory.filter(s =>
      (currentTime - s.timestamp) > this.compressionConfig.retentionTime * 2
    );

    expiredSnapshots.forEach(snapshot => {
      const index = this.stateHistory.indexOf(snapshot);
      if (index > -1) {
        this.stateHistory.splice(index, 1);
      }
      this.compressedStates.delete(snapshot.id);
    });

    if (expiredSnapshots.length > 0) {
      console.log(`SelectionStateManager: Cleaned up ${expiredSnapshots.length} expired snapshots`);
    }
  }

  /**
   * 更新内存使用情况
   */
  private updateMemoryUsage(): void {
    // 估算内存使用
    const stateMapSize = this.stateMap.size * 50; // 每个状态约50字节
    const historySize = this.stateHistory.length * 1000; // 每个快照约1KB
    const compressedSize = Array.from(this.compressedStates.values())
      .reduce((total, data) => total + data.length, 0);
    
    this.memoryUsage = stateMapSize + historySize + compressedSize;
  }

  /**
   * 添加状态变更监听器
   */
  addChangeListener(listener: (event: StateChangeEvent) => void): void {
    this.changeListeners.add(listener);
  }

  /**
   * 移除状态变更监听器
   */
  removeChangeListener(listener: (event: StateChangeEvent) => void): void {
    this.changeListeners.delete(listener);
  }

  /**
   * 通知状态变更
   */
  private notifyStateChange(event: StateChangeEvent): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('SelectionStateManager: Error in change listener', error);
      }
    });
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    stateCount: number;
    historyLength: number;
    memoryUsage: number;
    changeCount: number;
    lastChangeTime: number;
    compressionRatio: number;
  } {
    const totalSnapshots = this.stateHistory.length;
    const compressedSnapshots = this.stateHistory.filter(s => s.metadata.compressed).length;
    
    return {
      stateCount: this.stateMap.size,
      historyLength: this.stateHistory.length,
      memoryUsage: this.memoryUsage,
      changeCount: this.stateChangeCount,
      lastChangeTime: this.lastStateChangeTime,
      compressionRatio: totalSnapshots > 0 ? compressedSnapshots / totalSnapshots : 0
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stateMap.clear();
    this.stateHistory.length = 0;
    this.compressedStates.clear();
    this.batchOperations.clear();
    this.changeListeners.clear();
    
    console.log('SelectionStateManager: Resources disposed');
  }
}

/**
 * 工厂函数：创建选择状态管理器
 */
export function createSelectionStateManager(
  compressionConfig?: Partial<StateCompressionConfig>,
  syncConfig?: Partial<StateSyncConfig>
): SelectionStateManager {
  return new SelectionStateManager(compressionConfig, syncConfig);
}