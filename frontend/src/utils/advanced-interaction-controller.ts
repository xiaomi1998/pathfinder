/**
 * 高级交互控制器
 * 统一管理多选、批量操作、手势识别、智能吸附等高级交互特性
 * 提供一站式API，简化组件集成
 */

import { Vector2D, BoundingBox } from './math-precision';
import { 
  MultiSelectionManager, 
  SelectionItem, 
  SelectionState,
  SelectionEventType,
  createMultiSelectionManager 
} from './multi-selection-manager';
import { 
  SelectionStateManager,
  createSelectionStateManager 
} from './selection-state-manager';
import { 
  SelectionVisualManager,
  createSelectionVisualManager 
} from './selection-visual-feedback';
import { 
  BatchOperationsEngine,
  BatchOperationType,
  createBatchOperationsEngine 
} from './batch-operations-engine';
import { 
  AdvancedGestureRecognizer,
  GestureType,
  createAdvancedGestureRecognizer 
} from './advanced-gesture-recognition';
import { 
  SmartSnappingAlignmentManager,
  AlignmentType,
  SnapType,
  createSmartSnappingAlignmentManager 
} from './smart-snapping-alignment';
import type { FunnelNode } from '@/types/funnel';

// 交互控制器配置
export interface AdvancedInteractionConfig {
  // 多选配置
  multiSelection: {
    enabled: boolean;
    maxItems: number;
    rectangularSelect: boolean;
    touchSelect: boolean;
  };
  
  // 批量操作配置
  batchOperations: {
    enabled: boolean;
    confirmThreshold: number;
    enableUndo: boolean;
  };
  
  // 手势识别配置
  gestureRecognition: {
    enabled: boolean;
    enabledGestures: GestureType[];
    touchOnly: boolean;
  };
  
  // 智能吸附配置
  smartSnapping: {
    enabled: boolean;
    gridSize: Vector2D;
    snapThreshold: number;
    showGuides: boolean;
  };
  
  // 性能配置
  performance: {
    enableDebugMode: boolean;
    logPerformanceStats: boolean;
    statReportInterval: number;
  };
}

// 交互事件类型
export enum InteractionEventType {
  SELECTION_CHANGED = 'selection-changed',
  BATCH_OPERATION_STARTED = 'batch-operation-started',
  BATCH_OPERATION_COMPLETED = 'batch-operation-completed',
  GESTURE_DETECTED = 'gesture-detected',
  SNAP_APPLIED = 'snap-applied',
  ALIGNMENT_SUGGESTED = 'alignment-suggested'
}

// 交互事件数据
export interface InteractionEventData {
  type: InteractionEventType;
  data: any;
  timestamp: number;
  source: string;
}

/**
 * 高级交互控制器
 */
export class AdvancedInteractionController {
  private config: AdvancedInteractionConfig;
  private container: Element;
  
  // 核心管理器
  private selectionManager: MultiSelectionManager;
  private stateManager: SelectionStateManager;
  private visualManager: SelectionVisualManager;
  private batchOperations: BatchOperationsEngine;
  private gestureRecognizer: AdvancedGestureRecognizer;
  private snappingManager: SmartSnappingAlignmentManager;
  
  // 事件监听器
  private eventListeners: Map<InteractionEventType, Function[]> = new Map();
  
  // 状态跟踪
  private isInitialized = false;
  private items: Map<string, FunnelNode> = new Map();
  private performanceStats = {
    totalInteractions: 0,
    averageResponseTime: 0,
    lastInteractionTime: 0
  };

  constructor(container: Element, config: Partial<AdvancedInteractionConfig> = {}) {
    this.container = container;
    this.config = this.mergeWithDefaults(config);
    
    // 初始化管理器
    this.initializeManagers();
    this.setupEventBindings();
    this.setupPerformanceMonitoring();
    
    console.log('AdvancedInteractionController: Initialized with config', this.config);
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(config: Partial<AdvancedInteractionConfig>): AdvancedInteractionConfig {
    return {
      multiSelection: {
        enabled: true,
        maxItems: 1000,
        rectangularSelect: true,
        touchSelect: true,
        ...config.multiSelection
      },
      batchOperations: {
        enabled: true,
        confirmThreshold: 10,
        enableUndo: true,
        ...config.batchOperations
      },
      gestureRecognition: {
        enabled: true,
        enabledGestures: [
          GestureType.TAP,
          GestureType.DOUBLE_TAP,
          GestureType.LONG_PRESS,
          GestureType.DRAG,
          GestureType.SWIPE
        ],
        touchOnly: false,
        ...config.gestureRecognition
      },
      smartSnapping: {
        enabled: true,
        gridSize: new Vector2D(20, 20),
        snapThreshold: 10,
        showGuides: true,
        ...config.smartSnapping
      },
      performance: {
        enableDebugMode: false,
        logPerformanceStats: true,
        statReportInterval: 30000,
        ...config.performance
      }
    };
  }

  /**
   * 初始化管理器
   */
  private initializeManagers(): void {
    // 初始化选择管理器
    this.selectionManager = createMultiSelectionManager({
      multiSelectEnabled: this.config.multiSelection.enabled,
      rectangularSelectEnabled: this.config.multiSelection.rectangularSelect,
      touchSelectEnabled: this.config.multiSelection.touchSelect,
      maxSelectedItems: this.config.multiSelection.maxItems
    });

    // 初始化状态管理器
    this.stateManager = createSelectionStateManager();

    // 初始化视觉管理器
    this.visualManager = createSelectionVisualManager(this.container);

    // 初始化批量操作引擎
    if (this.config.batchOperations.enabled) {
      this.batchOperations = createBatchOperationsEngine({
        confirmThreshold: this.config.batchOperations.confirmThreshold,
        enableUndo: this.config.batchOperations.enableUndo
      });
    }

    // 初始化手势识别器
    if (this.config.gestureRecognition.enabled) {
      this.gestureRecognizer = createAdvancedGestureRecognizer();
      
      // 配置启用的手势
      Object.values(GestureType).forEach(gestureType => {
        if (this.config.gestureRecognition.enabledGestures.includes(gestureType)) {
          this.gestureRecognizer.enableGesture(gestureType);
        } else {
          this.gestureRecognizer.disableGesture(gestureType);
        }
      });
    }

    // 初始化智能吸附管理器
    if (this.config.smartSnapping.enabled) {
      this.snappingManager = createSmartSnappingAlignmentManager({
        gridSize: this.config.smartSnapping.gridSize,
        snapThreshold: this.config.smartSnapping.snapThreshold,
        showGuides: this.config.smartSnapping.showGuides
      });
    }

    this.isInitialized = true;
  }

  /**
   * 设置事件绑定
   */
  private setupEventBindings(): void {
    // 选择管理器事件
    this.selectionManager.addEventListener(SelectionEventType.SELECTION_CHANGED, (event) => {
      this.handleSelectionChanged(event);
    });

    this.selectionManager.addEventListener(SelectionEventType.SELECTION_STARTED, (event) => {
      this.visualManager.showSelectionBox(event.selectionArea!);
    });

    this.selectionManager.addEventListener(SelectionEventType.SELECTION_ENDED, (event) => {
      this.visualManager.hideSelectionBox();
    });

    // 手势识别器事件
    if (this.gestureRecognizer) {
      // 双击编辑
      this.gestureRecognizer.addEventListener(GestureType.DOUBLE_TAP, (event) => {
        this.handleDoubleClick(event);
      });

      // 长按右键菜单
      this.gestureRecognizer.addEventListener(GestureType.LONG_PRESS, (event) => {
        this.handleLongPress(event);
      });

      // 拖拽手势
      this.gestureRecognizer.addEventListener(GestureType.DRAG, (event) => {
        this.handleDragGesture(event);
      });
    }

    // 自定义右键菜单事件
    document.addEventListener('gesture-context-menu', (event: CustomEvent) => {
      this.showContextMenu(event.detail.position);
    });

    console.log('AdvancedInteractionController: Event bindings setup completed');
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    if (this.config.performance.logPerformanceStats) {
      setInterval(() => {
        this.logPerformanceStats();
      }, this.config.performance.statReportInterval);
    }
  }

  /**
   * 注册项目
   */
  registerItems(items: FunnelNode[]): void {
    if (!this.isInitialized) {
      console.warn('AdvancedInteractionController: Not initialized, skipping item registration');
      return;
    }

    const startTime = performance.now();

    // 转换为SelectionItem
    const selectionItems: SelectionItem[] = items.map(item => ({
      id: item.id,
      element: item,
      bounds: this.calculateItemBounds(item),
      state: SelectionState.UNSELECTED,
      selectionOrder: -1
    }));

    // 注册到各个管理器
    this.selectionManager.registerItems(selectionItems);
    
    if (this.snappingManager) {
      this.snappingManager.registerItems(selectionItems);
    }

    // 更新内部映射
    this.items.clear();
    items.forEach(item => {
      this.items.set(item.id, item);
    });

    const registrationTime = performance.now() - startTime;
    console.log(`AdvancedInteractionController: Registered ${items.length} items in ${registrationTime.toFixed(2)}ms`);
  }

  /**
   * 计算项目边界
   */
  private calculateItemBounds(item: FunnelNode): BoundingBox {
    // 基础尺寸计算
    const baseWidth = 120;
    const labelWidth = item.data.label.length * 8;
    const width = Math.max(baseWidth, Math.min(labelWidth + 40, 200));
    
    let height = 40;
    if (item.data.description) height += 16;
    
    return BoundingBox.fromRect(
      item.position.x,
      item.position.y,
      width,
      height
    );
  }

  /**
   * 处理选择改变
   */
  private handleSelectionChanged(event: any): void {
    const selectedItems = event.selectedItems;
    
    // 更新状态管理器
    const stateUpdates = selectedItems.map((item: SelectionItem) => ({
      itemId: item.id,
      state: SelectionState.SELECTED
    }));
    this.stateManager.setBatchStates(stateUpdates);

    // 显示视觉反馈
    this.visualManager.showSelectionHighlight(selectedItems);

    // 分析空间关系并生成对齐建议
    if (this.snappingManager && selectedItems.length >= 2) {
      const spatialAnalysis = this.snappingManager.analyzeSpaceRelations(selectedItems);
      
      if (spatialAnalysis.alignments.length > 0) {
        this.dispatchEvent({
          type: InteractionEventType.ALIGNMENT_SUGGESTED,
          data: spatialAnalysis.alignments,
          timestamp: performance.now(),
          source: 'selection-manager'
        });
      }
    }

    // 分发事件
    this.dispatchEvent({
      type: InteractionEventType.SELECTION_CHANGED,
      data: { selectedItems },
      timestamp: performance.now(),
      source: 'selection-manager'
    });
  }

  /**
   * 处理双击事件
   */
  private handleDoubleClick(event: any): void {
    console.log('AdvancedInteractionController: Double click detected', event);
    
    // 查找点击位置的项目
    const position = event.result.path.points[0].position;
    const targetItem = this.findItemAtPosition(position);
    
    if (targetItem) {
      // 触发编辑事件
      this.dispatchEvent({
        type: InteractionEventType.GESTURE_DETECTED,
        data: { 
          gesture: GestureType.DOUBLE_TAP, 
          targetItem: targetItem.id,
          action: 'edit'
        },
        timestamp: performance.now(),
        source: 'gesture-recognizer'
      });
    }
  }

  /**
   * 处理长按事件
   */
  private handleLongPress(event: any): void {
    console.log('AdvancedInteractionController: Long press detected', event);
    
    const position = event.result.path.points[0].position;
    this.showContextMenu(position);
  }

  /**
   * 处理拖拽手势
   */
  private handleDragGesture(event: any): void {
    if (!this.batchOperations) return;

    const selectedItems = this.selectionManager.getSelectedItems();
    if (selectedItems.length > 1) {
      // 启动批量拖拽
      const startPoint = event.result.path.points[0].position;
      const dragId = this.batchOperations.startBatchDrag(selectedItems, startPoint);
      
      console.log(`AdvancedInteractionController: Started batch drag ${dragId} for ${selectedItems.length} items`);
    }
  }

  /**
   * 显示右键菜单
   */
  private showContextMenu(position: Vector2D): void {
    // 创建自定义右键菜单
    const contextMenu = document.createElement('div');
    contextMenu.className = 'advanced-context-menu';
    contextMenu.style.cssText = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      min-width: 150px;
      font-size: 14px;
    `;

    const selectedCount = this.selectionManager.getSelectedCount();
    const menuItems = [];

    if (selectedCount > 0) {
      menuItems.push(
        { label: '复制', action: 'copy' },
        { label: '删除', action: 'delete' },
        { label: '属性', action: 'properties' }
      );

      if (selectedCount > 1) {
        menuItems.push(
          { label: '对齐', action: 'align' },
          { label: '分布', action: 'distribute' }
        );
      }
    } else {
      menuItems.push(
        { label: '粘贴', action: 'paste' },
        { label: '全选', action: 'select-all' }
      );
    }

    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.textContent = item.label;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        hover:background-color: #f5f5f5;
      `;
      
      menuItem.addEventListener('click', () => {
        this.handleContextMenuAction(item.action);
        document.body.removeChild(contextMenu);
      });
      
      contextMenu.appendChild(menuItem);
    });

    // 点击外部关闭菜单
    const closeMenu = (e: Event) => {
      if (!contextMenu.contains(e.target as Node)) {
        document.body.removeChild(contextMenu);
        document.removeEventListener('click', closeMenu);
      }
    };

    document.addEventListener('click', closeMenu);
    document.body.appendChild(contextMenu);
  }

  /**
   * 处理右键菜单操作
   */
  private async handleContextMenuAction(action: string): Promise<void> {
    const selectedItems = this.selectionManager.getSelectedItems();

    switch (action) {
      case 'copy':
        if (this.batchOperations && selectedItems.length > 0) {
          await this.batchOperations.batchCopy(selectedItems);
        }
        break;

      case 'delete':
        if (this.batchOperations && selectedItems.length > 0) {
          const result = await this.batchOperations.batchDelete(selectedItems);
          if (result.status === 'completed') {
            this.selectionManager.clearSelection();
          }
        }
        break;

      case 'select-all':
        this.selectionManager.selectAll();
        break;

      case 'align':
        if (this.snappingManager && selectedItems.length >= 2) {
          const analysis = this.snappingManager.analyzeSpaceRelations(selectedItems);
          if (analysis.alignments.length > 0) {
            // 应用第一个对齐建议
            const positions = this.snappingManager.applyAlignment(analysis.alignments[0]);
            console.log('Applied alignment:', analysis.alignments[0].type);
          }
        }
        break;

      case 'distribute':
        if (this.snappingManager && selectedItems.length >= 3) {
          const positions = this.snappingManager.applyDistribution(
            selectedItems,
            { spacing: 'equal', margin: 20, alignment: 'center', respectBounds: true },
            'horizontal'
          );
          console.log('Applied distribution');
        }
        break;
    }
  }

  /**
   * 查找位置处的项目
   */
  private findItemAtPosition(position: Vector2D): FunnelNode | null {
    for (const item of this.items.values()) {
      const bounds = this.calculateItemBounds(item);
      if (bounds.contains(position)) {
        return item;
      }
    }
    return null;
  }

  /**
   * 计算智能吸附
   */
  calculateSmartSnapping(position: Vector2D, itemId?: string): Vector2D {
    if (!this.snappingManager) {
      return position;
    }

    const selectedIds = this.selectionManager.getSelectedItemIds();
    const result = this.snappingManager.calculateSnapPosition(
      position,
      itemId,
      selectedIds
    );

    if (result.activeTargets.length > 0) {
      // 显示对齐指示线
      this.snappingManager.showAlignmentGuides(result.guides);

      // 分发吸附事件
      this.dispatchEvent({
        type: InteractionEventType.SNAP_APPLIED,
        data: {
          originalPosition: position,
          snappedPosition: result.snappedPosition,
          targets: result.activeTargets
        },
        timestamp: performance.now(),
        source: 'snapping-manager'
      });
    }

    return result.snappedPosition;
  }

  /**
   * 批量操作
   */
  async performBatchOperation(
    type: BatchOperationType,
    items?: SelectionItem[],
    parameters?: Record<string, any>
  ): Promise<any> {
    if (!this.batchOperations) {
      throw new Error('Batch operations not enabled');
    }

    const targetItems = items || this.selectionManager.getSelectedItems();
    if (targetItems.length === 0) {
      throw new Error('No items selected for batch operation');
    }

    this.dispatchEvent({
      type: InteractionEventType.BATCH_OPERATION_STARTED,
      data: { type, itemCount: targetItems.length },
      timestamp: performance.now(),
      source: 'batch-operations'
    });

    let result;
    switch (type) {
      case BatchOperationType.DELETE:
        result = await this.batchOperations.batchDelete(targetItems);
        break;
      case BatchOperationType.COPY:
        result = await this.batchOperations.batchCopy(targetItems);
        break;
      case BatchOperationType.ALIGN:
        if (parameters?.alignType) {
          result = await this.batchOperations.batchAlign(targetItems, parameters.alignType);
        }
        break;
      case BatchOperationType.DISTRIBUTE:
        if (parameters?.distributeType) {
          result = await this.batchOperations.batchDistribute(targetItems, parameters.distributeType);
        }
        break;
      default:
        throw new Error(`Unsupported batch operation: ${type}`);
    }

    this.dispatchEvent({
      type: InteractionEventType.BATCH_OPERATION_COMPLETED,
      data: { type, result },
      timestamp: performance.now(),
      source: 'batch-operations'
    });

    return result;
  }

  /**
   * 记录性能统计
   */
  private logPerformanceStats(): void {
    const stats = {
      controller: this.performanceStats,
      selection: this.selectionManager.getPerformanceStats(),
      state: this.stateManager.getPerformanceStats(),
      visual: this.visualManager.getPerformanceStats(),
      batch: this.batchOperations?.getPerformanceStats(),
      gesture: this.gestureRecognizer?.getPerformanceStats(),
      snapping: this.snappingManager?.getPerformanceStats()
    };

    console.group('🎯 Advanced Interaction Performance Stats');
    console.table(stats);
    console.groupEnd();

    if (this.config.performance.enableDebugMode) {
      console.log('Detailed performance data:', stats);
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(
    eventType: InteractionEventType,
    listener: (event: InteractionEventData) => void
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(
    eventType: InteractionEventType,
    listener: (event: InteractionEventData) => void
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 分发事件
   */
  private dispatchEvent(eventData: InteractionEventData): void {
    const listeners = this.eventListeners.get(eventData.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error('AdvancedInteractionController: Error in event listener', error);
        }
      });
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AdvancedInteractionConfig>): void {
    Object.assign(this.config, config);
    
    // 更新各个管理器的配置
    if (config.smartSnapping && this.snappingManager) {
      this.snappingManager.updateConfig({
        gridSize: config.smartSnapping.gridSize,
        snapThreshold: config.smartSnapping.snapThreshold,
        showGuides: config.smartSnapping.showGuides
      });
    }

    console.log('AdvancedInteractionController: Configuration updated', config);
  }

  /**
   * 获取当前选择
   */
  getSelection(): SelectionItem[] {
    return this.selectionManager.getSelectedItems();
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this.selectionManager.clearSelection();
    this.visualManager.hideAllGuides();
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.selectionManager.dispose();
    this.stateManager.dispose();
    this.visualManager.dispose();
    
    if (this.batchOperations) {
      this.batchOperations.dispose();
    }
    
    if (this.gestureRecognizer) {
      this.gestureRecognizer.dispose();
    }
    
    if (this.snappingManager) {
      this.snappingManager.dispose();
    }

    this.eventListeners.clear();
    this.items.clear();

    console.log('AdvancedInteractionController: Resources disposed');
  }
}

/**
 * 工厂函数：创建高级交互控制器
 */
export function createAdvancedInteractionController(
  container: Element,
  config?: Partial<AdvancedInteractionConfig>
): AdvancedInteractionController {
  return new AdvancedInteractionController(container, config);
}

/**
 * 工厂函数：创建轻量级交互控制器（仅基础功能）
 */
export function createLightweightInteractionController(
  container: Element
): AdvancedInteractionController {
  return new AdvancedInteractionController(container, {
    multiSelection: { enabled: true, maxItems: 100, rectangularSelect: true, touchSelect: false },
    batchOperations: { enabled: false, confirmThreshold: 5, enableUndo: false },
    gestureRecognition: { 
      enabled: true, 
      enabledGestures: [GestureType.TAP, GestureType.DOUBLE_TAP],
      touchOnly: true 
    },
    smartSnapping: { enabled: false, gridSize: new Vector2D(10, 10), snapThreshold: 5, showGuides: false },
    performance: { enableDebugMode: false, logPerformanceStats: false, statReportInterval: 60000 }
  });
}