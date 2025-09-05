/**
 * 选择状态可视化反馈系统
 * 高性能的选择框、批量选择高亮、交互反馈动画系统
 * 基于硬件加速和渲染优化，支持1000+节点的实时视觉反馈
 */

import { Vector2D, BoundingBox } from './math-precision';
import { renderOptimizer, enableGPUAcceleration } from './render-optimizer';
import { memoryManager } from './memory-manager';
import { cacheOptimizer } from './cache-optimizer';
import { touchEventHandler, isTouchDevice } from './touch-event-handler';
import type { SelectionState, SelectionItem, SelectionArea } from './multi-selection-manager';

// 视觉反馈类型
export enum VisualFeedbackType {
  SELECTION_HIGHLIGHT = 'selection-highlight',
  SELECTION_BOX = 'selection-box',
  HOVER_EFFECT = 'hover-effect',
  BATCH_OPERATION = 'batch-operation',
  ALIGNMENT_GUIDE = 'alignment-guide',
  DRAG_PREVIEW = 'drag-preview'
}

// 动画配置
export interface AnimationConfig {
  duration: number;
  easing: string;
  stagger: number;        // 交错延迟
  scale: number;          // 缩放系数
  opacity: number;        // 透明度
  blur: number;          // 模糊效果
  glow: boolean;         // 发光效果
  pulse: boolean;        // 脉冲效果
}

// 视觉样式配置
export interface VisualStyleConfig {
  selectionColor: string;
  selectionOpacity: number;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  cornerRadius: number;
  shadowBlur: number;
  shadowColor: string;
  gradientStops: string[];
  animationConfig: AnimationConfig;
}

// 视觉反馈元素
export interface VisualFeedbackElement {
  id: string;
  type: VisualFeedbackType;
  element: HTMLElement | SVGElement;
  bounds: BoundingBox;
  zIndex: number;
  visible: boolean;
  animating: boolean;
  metadata: Record<string, any>;
}

// 批量操作视觉效果
export interface BatchOperationEffect {
  id: string;
  type: 'move' | 'copy' | 'delete' | 'edit';
  items: SelectionItem[];
  startTime: number;
  duration: number;
  progress: number;
  completed: boolean;
}

/**
 * 高性能选择可视化管理器
 */
export class SelectionVisualManager {
  private container: Element | null = null;
  private overlayContainer: HTMLElement | null = null;
  private svgOverlay: SVGElement | null = null;
  
  // 视觉元素缓存
  private visualElements: Map<string, VisualFeedbackElement> = new Map();
  private elementPool: Map<VisualFeedbackType, HTMLElement[]> = new Map();
  
  // 动画管理
  private activeAnimations: Map<string, Animation> = new Map();
  private animationCallbacks: Map<string, (() => void)[]> = new Map();
  
  // 批量操作效果
  private batchEffects: Map<string, BatchOperationEffect> = new Map();
  
  // 样式配置
  private defaultStyles: Map<VisualFeedbackType, VisualStyleConfig> = new Map();
  
  // 性能监控
  private renderCount = 0;
  private lastRenderTime = 0;
  private frameDrops = 0;
  
  // 触控设备优化
  private isTouchDevice = isTouchDevice();
  private touchFeedbackEnabled = true;

  constructor(container: Element) {
    this.container = container;
    this.initializeOverlaySystem();
    this.initializeElementPools();
    this.initializeDefaultStyles();
    this.setupPerformanceMonitoring();
    
    console.log('SelectionVisualManager: Initialized with hardware acceleration');
  }

  /**
   * 初始化覆盖层系统
   */
  private initializeOverlaySystem(): void {
    if (!this.container) return;

    // 创建HTML覆盖层容器
    this.overlayContainer = document.createElement('div');
    this.overlayContainer.className = 'selection-overlay-container';
    this.overlayContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      overflow: hidden;
    `;

    // 创建SVG覆盖层
    this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgOverlay.setAttribute('class', 'selection-svg-overlay');
    this.svgOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1001;
    `;

    // 添加渐变定义
    this.createSVGDefinitions();

    this.overlayContainer.appendChild(this.svgOverlay);
    this.container.appendChild(this.overlayContainer);

    // 启用硬件加速
    enableGPUAcceleration(this.overlayContainer);
    enableGPUAcceleration(this.svgOverlay);
  }

  /**
   * 创建SVG定义（渐变、滤镜等）
   */
  private createSVGDefinitions(): void {
    if (!this.svgOverlay) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // 选择高亮渐变
    const selectionGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    selectionGradient.setAttribute('id', 'selection-gradient');
    selectionGradient.setAttribute('x1', '0%');
    selectionGradient.setAttribute('y1', '0%');
    selectionGradient.setAttribute('x2', '100%');
    selectionGradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');
    stop1.setAttribute('stop-opacity', '0.3');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#1d4ed8');
    stop2.setAttribute('stop-opacity', '0.1');
    
    selectionGradient.appendChild(stop1);
    selectionGradient.appendChild(stop2);
    
    // 发光滤镜
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'glow-filter');
    glowFilter.setAttribute('x', '-50%');
    glowFilter.setAttribute('y', '-50%');
    glowFilter.setAttribute('width', '200%');
    glowFilter.setAttribute('height', '200%');
    
    const gaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    gaussianBlur.setAttribute('stdDeviation', '3');
    gaussianBlur.setAttribute('result', 'coloredBlur');
    
    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode1.setAttribute('in', 'coloredBlur');
    const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode2.setAttribute('in', 'SourceGraphic');
    
    merge.appendChild(mergeNode1);
    merge.appendChild(mergeNode2);
    glowFilter.appendChild(gaussianBlur);
    glowFilter.appendChild(merge);
    
    defs.appendChild(selectionGradient);
    defs.appendChild(glowFilter);
    this.svgOverlay.appendChild(defs);
  }

  /**
   * 初始化元素池
   */
  private initializeElementPools(): void {
    const poolSizes = {
      [VisualFeedbackType.SELECTION_HIGHLIGHT]: 50,
      [VisualFeedbackType.SELECTION_BOX]: 10,
      [VisualFeedbackType.HOVER_EFFECT]: 20,
      [VisualFeedbackType.BATCH_OPERATION]: 10,
      [VisualFeedbackType.ALIGNMENT_GUIDE]: 5,
      [VisualFeedbackType.DRAG_PREVIEW]: 5
    };

    Object.entries(poolSizes).forEach(([type, size]) => {
      const feedbackType = type as VisualFeedbackType;
      const pool: HTMLElement[] = [];
      
      for (let i = 0; i < size; i++) {
        const element = this.createElement(feedbackType);
        if (element) {
          element.style.display = 'none';
          pool.push(element);
        }
      }
      
      this.elementPool.set(feedbackType, pool);
    });

    console.log('SelectionVisualManager: Element pools initialized');
  }

  /**
   * 初始化默认样式
   */
  private initializeDefaultStyles(): void {
    const defaultAnimation: AnimationConfig = {
      duration: 200,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      stagger: 50,
      scale: 1.02,
      opacity: 1,
      blur: 0,
      glow: false,
      pulse: false
    };

    this.defaultStyles.set(VisualFeedbackType.SELECTION_HIGHLIGHT, {
      selectionColor: '#3b82f6',
      selectionOpacity: 0.2,
      borderWidth: 2,
      borderStyle: 'solid',
      cornerRadius: 4,
      shadowBlur: 8,
      shadowColor: 'rgba(59, 130, 246, 0.4)',
      gradientStops: ['#3b82f6', '#1d4ed8'],
      animationConfig: defaultAnimation
    });

    this.defaultStyles.set(VisualFeedbackType.SELECTION_BOX, {
      selectionColor: '#3b82f6',
      selectionOpacity: 0.1,
      borderWidth: 2,
      borderStyle: 'dashed',
      cornerRadius: 2,
      shadowBlur: 0,
      shadowColor: 'transparent',
      gradientStops: ['#3b82f6'],
      animationConfig: { ...defaultAnimation, duration: 100 }
    });

    this.defaultStyles.set(VisualFeedbackType.HOVER_EFFECT, {
      selectionColor: '#6b7280',
      selectionOpacity: 0.1,
      borderWidth: 1,
      borderStyle: 'solid',
      cornerRadius: 4,
      shadowBlur: 4,
      shadowColor: 'rgba(107, 114, 128, 0.2)',
      gradientStops: ['#6b7280'],
      animationConfig: { ...defaultAnimation, duration: 150 }
    });

    console.log('SelectionVisualManager: Default styles initialized');
  }

  /**
   * 创建视觉反馈元素
   */
  private createElement(type: VisualFeedbackType): HTMLElement | null {
    let element: HTMLElement;

    switch (type) {
      case VisualFeedbackType.SELECTION_HIGHLIGHT:
        element = document.createElement('div');
        element.className = 'selection-highlight';
        break;
      
      case VisualFeedbackType.SELECTION_BOX:
        element = document.createElement('div');
        element.className = 'selection-box';
        break;
      
      case VisualFeedbackType.HOVER_EFFECT:
        element = document.createElement('div');
        element.className = 'hover-effect';
        break;
      
      case VisualFeedbackType.BATCH_OPERATION:
        element = document.createElement('div');
        element.className = 'batch-operation-effect';
        break;
      
      case VisualFeedbackType.ALIGNMENT_GUIDE:
        element = document.createElement('div');
        element.className = 'alignment-guide';
        break;
      
      case VisualFeedbackType.DRAG_PREVIEW:
        element = document.createElement('div');
        element.className = 'drag-preview';
        break;
      
      default:
        return null;
    }

    // 应用基础样式
    element.style.cssText = `
      position: absolute;
      pointer-events: none;
      transition: all 0.2s ease;
      will-change: transform, opacity;
    `;

    // 启用硬件加速
    enableGPUAcceleration(element);

    if (this.overlayContainer) {
      this.overlayContainer.appendChild(element);
    }

    return element;
  }

  /**
   * 显示选择高亮
   */
  showSelectionHighlight(items: SelectionItem[]): void {
    const startTime = performance.now();
    
    items.forEach((item, index) => {
      const elementId = `highlight-${item.id}`;
      let visualElement = this.visualElements.get(elementId);
      
      if (!visualElement) {
        const element = this.acquireElement(VisualFeedbackType.SELECTION_HIGHLIGHT);
        if (!element) return;
        
        visualElement = {
          id: elementId,
          type: VisualFeedbackType.SELECTION_HIGHLIGHT,
          element,
          bounds: item.bounds,
          zIndex: 1002,
          visible: false,
          animating: false,
          metadata: { itemId: item.id, state: item.state }
        };
        
        this.visualElements.set(elementId, visualElement);
      }

      // 更新位置和样式
      this.updateElementPosition(visualElement, item.bounds);
      this.applyElementStyle(visualElement, VisualFeedbackType.SELECTION_HIGHLIGHT, item.state);
      
      // 显示动画
      if (!visualElement.visible) {
        this.showElement(visualElement, index * 20); // 交错动画
      }
    });

    const highlightTime = performance.now() - startTime;
    console.log(`SelectionVisualManager: Highlighted ${items.length} items in ${highlightTime.toFixed(2)}ms`);
  }

  /**
   * 隐藏选择高亮
   */
  hideSelectionHighlight(itemIds: string[]): void {
    itemIds.forEach(itemId => {
      const elementId = `highlight-${itemId}`;
      const visualElement = this.visualElements.get(elementId);
      
      if (visualElement && visualElement.visible) {
        this.hideElement(visualElement);
      }
    });
  }

  /**
   * 显示选择框（矩形选择时）
   */
  showSelectionBox(selectionArea: SelectionArea): void {
    const elementId = 'selection-box';
    let visualElement = this.visualElements.get(elementId);
    
    if (!visualElement) {
      const element = this.acquireElement(VisualFeedbackType.SELECTION_BOX);
      if (!element) return;
      
      visualElement = {
        id: elementId,
        type: VisualFeedbackType.SELECTION_BOX,
        element,
        bounds: selectionArea.bounds,
        zIndex: 1001,
        visible: false,
        animating: false,
        metadata: { selectionArea }
      };
      
      this.visualElements.set(elementId, visualElement);
    }

    // 更新选择框位置
    this.updateElementPosition(visualElement, selectionArea.bounds);
    this.applyElementStyle(visualElement, VisualFeedbackType.SELECTION_BOX);
    
    if (!visualElement.visible) {
      this.showElement(visualElement);
    }
  }

  /**
   * 隐藏选择框
   */
  hideSelectionBox(): void {
    const visualElement = this.visualElements.get('selection-box');
    if (visualElement && visualElement.visible) {
      this.hideElement(visualElement);
    }
  }

  /**
   * 显示悬停效果
   */
  showHoverEffect(itemId: string, bounds: BoundingBox): void {
    const elementId = `hover-${itemId}`;
    let visualElement = this.visualElements.get(elementId);
    
    if (!visualElement) {
      const element = this.acquireElement(VisualFeedbackType.HOVER_EFFECT);
      if (!element) return;
      
      visualElement = {
        id: elementId,
        type: VisualFeedbackType.HOVER_EFFECT,
        element,
        bounds,
        zIndex: 999,
        visible: false,
        animating: false,
        metadata: { itemId }
      };
      
      this.visualElements.set(elementId, visualElement);
    }

    this.updateElementPosition(visualElement, bounds);
    this.applyElementStyle(visualElement, VisualFeedbackType.HOVER_EFFECT);
    
    if (!visualElement.visible) {
      this.showElement(visualElement);
    }
  }

  /**
   * 隐藏悬停效果
   */
  hideHoverEffect(itemId: string): void {
    const elementId = `hover-${itemId}`;
    const visualElement = this.visualElements.get(elementId);
    
    if (visualElement && visualElement.visible) {
      this.hideElement(visualElement);
    }
  }

  /**
   * 显示批量操作效果
   */
  showBatchOperationEffect(
    operationType: 'move' | 'copy' | 'delete' | 'edit',
    items: SelectionItem[],
    duration = 1000
  ): string {
    const effectId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const batchEffect: BatchOperationEffect = {
      id: effectId,
      type: operationType,
      items,
      startTime: performance.now(),
      duration,
      progress: 0,
      completed: false
    };

    this.batchEffects.set(effectId, batchEffect);
    
    // 创建批量操作的视觉效果
    items.forEach((item, index) => {
      const elementId = `batch-${effectId}-${item.id}`;
      const element = this.acquireElement(VisualFeedbackType.BATCH_OPERATION);
      
      if (element) {
        const visualElement: VisualFeedbackElement = {
          id: elementId,
          type: VisualFeedbackType.BATCH_OPERATION,
          element,
          bounds: item.bounds,
          zIndex: 1003,
          visible: false,
          animating: false,
          metadata: { batchId: effectId, operationType, itemIndex: index }
        };
        
        this.visualElements.set(elementId, visualElement);
        this.updateElementPosition(visualElement, item.bounds);
        this.applyBatchOperationStyle(visualElement, operationType);
        this.showElement(visualElement, index * 50); // 交错动画
      }
    });

    // 启动批量操作动画
    this.animateBatchOperation(batchEffect);
    
    return effectId;
  }

  /**
   * 动画批量操作
   */
  private animateBatchOperation(batchEffect: BatchOperationEffect): void {
    const animate = () => {
      const elapsed = performance.now() - batchEffect.startTime;
      batchEffect.progress = Math.min(elapsed / batchEffect.duration, 1);
      
      // 更新每个项目的动画状态
      batchEffect.items.forEach((item, index) => {
        const elementId = `batch-${batchEffect.id}-${item.id}`;
        const visualElement = this.visualElements.get(elementId);
        
        if (visualElement) {
          this.updateBatchOperationAnimation(visualElement, batchEffect);
        }
      });

      if (batchEffect.progress < 1) {
        requestAnimationFrame(animate);
      } else {
        batchEffect.completed = true;
        this.completeBatchOperation(batchEffect.id);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * 更新批量操作动画
   */
  private updateBatchOperationAnimation(
    visualElement: VisualFeedbackElement,
    batchEffect: BatchOperationEffect
  ): void {
    const element = visualElement.element;
    const progress = batchEffect.progress;
    
    switch (batchEffect.type) {
      case 'move':
        // 移动效果：淡入淡出 + 轻微缩放
        element.style.opacity = `${1 - progress * 0.5}`;
        element.style.transform = `scale(${1 + progress * 0.1})`;
        break;
      
      case 'copy':
        // 复制效果：闪烁 + 分离
        const blink = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
        element.style.opacity = `${blink}`;
        element.style.transform = `translateX(${progress * 10}px) scale(${1 - progress * 0.2})`;
        break;
      
      case 'delete':
        // 删除效果：收缩 + 透明
        element.style.opacity = `${1 - progress}`;
        element.style.transform = `scale(${1 - progress * 0.8})`;
        break;
      
      case 'edit':
        // 编辑效果：脉冲
        const pulse = Math.sin(progress * Math.PI * 2) * 0.2 + 1;
        element.style.transform = `scale(${pulse})`;
        break;
    }
  }

  /**
   * 完成批量操作
   */
  private completeBatchOperation(batchId: string): void {
    const batchEffect = this.batchEffects.get(batchId);
    if (!batchEffect) return;

    // 清理批量操作的视觉元素
    batchEffect.items.forEach(item => {
      const elementId = `batch-${batchId}-${item.id}`;
      const visualElement = this.visualElements.get(elementId);
      
      if (visualElement) {
        this.hideElement(visualElement);
        this.releaseElement(visualElement);
        this.visualElements.delete(elementId);
      }
    });

    this.batchEffects.delete(batchId);
    
    console.log(`SelectionVisualManager: Batch operation ${batchEffect.type} completed`);
  }

  /**
   * 从池中获取元素
   */
  private acquireElement(type: VisualFeedbackType): HTMLElement | null {
    const pool = this.elementPool.get(type);
    if (!pool || pool.length === 0) {
      // 池为空，创建新元素
      return this.createElement(type);
    }
    
    return pool.pop() || null;
  }

  /**
   * 释放元素回池
   */
  private releaseElement(visualElement: VisualFeedbackElement): void {
    const element = visualElement.element;
    element.style.display = 'none';
    element.style.opacity = '';
    element.style.transform = '';
    
    const pool = this.elementPool.get(visualElement.type);
    if (pool && pool.length < 100) { // 限制池大小
      pool.push(element);
    }
  }

  /**
   * 更新元素位置
   */
  private updateElementPosition(visualElement: VisualFeedbackElement, bounds: BoundingBox): void {
    const element = visualElement.element;
    
    element.style.left = `${bounds.min.x}px`;
    element.style.top = `${bounds.min.y}px`;
    element.style.width = `${bounds.width}px`;
    element.style.height = `${bounds.height}px`;
    
    visualElement.bounds = bounds;
  }

  /**
   * 应用元素样式
   */
  private applyElementStyle(
    visualElement: VisualFeedbackElement,
    type: VisualFeedbackType,
    state?: SelectionState
  ): void {
    const style = this.defaultStyles.get(type);
    if (!style) return;

    const element = visualElement.element;
    
    // 基础样式
    element.style.backgroundColor = `${style.selectionColor}${Math.floor(style.selectionOpacity * 255).toString(16).padStart(2, '0')}`;
    element.style.border = `${style.borderWidth}px ${style.borderStyle} ${style.selectionColor}`;
    element.style.borderRadius = `${style.cornerRadius}px`;
    element.style.zIndex = visualElement.zIndex.toString();
    
    // 阴影效果
    if (style.shadowBlur > 0) {
      element.style.boxShadow = `0 0 ${style.shadowBlur}px ${style.shadowColor}`;
    }
    
    // 根据状态调整样式
    if (state === SelectionState.SEMI_SELECTED) {
      element.style.opacity = '0.5';
      element.style.borderStyle = 'dashed';
    } else if (state === SelectionState.DISABLED) {
      element.style.opacity = '0.3';
      element.style.filter = 'grayscale(100%)';
    }
  }

  /**
   * 应用批量操作样式
   */
  private applyBatchOperationStyle(
    visualElement: VisualFeedbackElement,
    operationType: 'move' | 'copy' | 'delete' | 'edit'
  ): void {
    const element = visualElement.element;
    
    const typeColors = {
      move: '#3b82f6',    // 蓝色
      copy: '#10b981',    // 绿色
      delete: '#ef4444',  // 红色
      edit: '#f59e0b'     // 黄色
    };
    
    const color = typeColors[operationType];
    
    element.style.border = `2px solid ${color}`;
    element.style.backgroundColor = `${color}20`; // 20% 透明度
    element.style.borderRadius = '4px';
    element.style.zIndex = '1003';
  }

  /**
   * 显示元素动画
   */
  private showElement(visualElement: VisualFeedbackElement, delay = 0): void {
    const element = visualElement.element;
    const style = this.defaultStyles.get(visualElement.type);
    
    if (!style) return;

    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    
    // 使用Web Animations API实现高性能动画
    const animation = element.animate([
      { 
        opacity: 0, 
        transform: 'scale(0.8)',
        offset: 0 
      },
      { 
        opacity: 1, 
        transform: `scale(${style.animationConfig.scale})`,
        offset: 1 
      }
    ], {
      duration: style.animationConfig.duration,
      delay,
      easing: style.animationConfig.easing,
      fill: 'forwards'
    });

    const animationId = `show-${visualElement.id}`;
    this.activeAnimations.set(animationId, animation);
    
    animation.onfinish = () => {
      visualElement.visible = true;
      visualElement.animating = false;
      this.activeAnimations.delete(animationId);
    };

    visualElement.animating = true;
  }

  /**
   * 隐藏元素动画
   */
  private hideElement(visualElement: VisualFeedbackElement): void {
    const element = visualElement.element;
    const style = this.defaultStyles.get(visualElement.type);
    
    if (!style) return;

    const animation = element.animate([
      { 
        opacity: 1, 
        transform: `scale(${style.animationConfig.scale})`,
        offset: 0 
      },
      { 
        opacity: 0, 
        transform: 'scale(0.8)',
        offset: 1 
      }
    ], {
      duration: style.animationConfig.duration * 0.7, // 隐藏动画稍快
      easing: style.animationConfig.easing,
      fill: 'forwards'
    });

    const animationId = `hide-${visualElement.id}`;
    this.activeAnimations.set(animationId, animation);
    
    animation.onfinish = () => {
      element.style.display = 'none';
      visualElement.visible = false;
      visualElement.animating = false;
      this.releaseElement(visualElement);
      this.visualElements.delete(visualElement.id);
      this.activeAnimations.delete(animationId);
    };

    visualElement.animating = true;
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.monitorPerformance();
    }, 1000); // 每秒检查一次性能
  }

  /**
   * 监控性能
   */
  private monitorPerformance(): void {
    const now = performance.now();
    const frameTime = now - this.lastRenderTime;
    
    // 检测帧丢失（超过16.67ms为掉帧）
    if (frameTime > 16.67) {
      this.frameDrops++;
    }

    // 每10秒报告一次性能统计
    if (this.renderCount % 600 === 0) { // 假设60fps
      console.log('SelectionVisualManager Performance:', {
        visualElements: this.visualElements.size,
        activeAnimations: this.activeAnimations.size,
        frameDrops: this.frameDrops,
        averageFrameTime: frameTime
      });
    }

    this.lastRenderTime = now;
    this.renderCount++;
  }

  /**
   * 清理所有视觉效果
   */
  clearAll(): void {
    // 停止所有动画
    this.activeAnimations.forEach(animation => {
      animation.cancel();
    });
    this.activeAnimations.clear();

    // 清理视觉元素
    this.visualElements.forEach(visualElement => {
      visualElement.element.style.display = 'none';
      this.releaseElement(visualElement);
    });
    this.visualElements.clear();

    // 清理批量操作效果
    this.batchEffects.clear();

    console.log('SelectionVisualManager: All visual effects cleared');
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    visualElements: number;
    activeAnimations: number;
    renderCount: number;
    frameDrops: number;
    memoryUsage: number;
  } {
    return {
      visualElements: this.visualElements.size,
      activeAnimations: this.activeAnimations.size,
      renderCount: this.renderCount,
      frameDrops: this.frameDrops,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    const elementSize = 500; // 每个视觉元素约500字节
    const animationSize = 200; // 每个动画约200字节
    
    return (this.visualElements.size * elementSize) + 
           (this.activeAnimations.size * animationSize);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.clearAll();
    
    // 移除覆盖层
    if (this.overlayContainer && this.container) {
      this.container.removeChild(this.overlayContainer);
    }

    // 清理元素池
    this.elementPool.clear();
    this.defaultStyles.clear();

    console.log('SelectionVisualManager: Resources disposed');
  }
}

/**
 * 工厂函数：创建选择可视化管理器
 */
export function createSelectionVisualManager(container: Element): SelectionVisualManager {
  return new SelectionVisualManager(container);
}