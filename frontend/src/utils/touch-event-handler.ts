/**
 * 触控事件处理核心模块
 * 专门负责将触控设备和移动端平台的拖拽系统适配
 * 提供与现有鼠标拖拽系统完全兼容的API
 */

import { Vector2D, PRECISION, preciseRound } from './math-precision';
import { eventOptimizer, type EventConfig } from './event-optimizer';
import { memoryManager } from './memory-manager';
import { renderOptimizer } from './render-optimizer';

// 触控设备类型检测
export interface TouchDeviceInfo {
  isTouchDevice: boolean;
  isPrimaryTouch: boolean;
  supportsPointer: boolean;
  supportsPressure: boolean;
  supportsHover: boolean;
  maxTouchPoints: number;
  devicePixelRatio: number;
  screenSize: { width: number; height: number };
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

// 触控点信息
export interface TouchPointInfo {
  id: number;
  position: Vector2D;
  pressure: number;
  radius: Vector2D;
  angle: number;
  timestamp: number;
  velocity: Vector2D;
  acceleration: Vector2D;
}

// 手势识别结果
export interface GestureInfo {
  type: 'tap' | 'double-tap' | 'long-press' | 'pan' | 'pinch' | 'rotate';
  center: Vector2D;
  scale: number;
  rotation: number;
  velocity: Vector2D;
  duration: number;
  confidence: number;
}

// 触控适配配置
export interface TouchAdaptationConfig {
  // 基础配置
  enableTouch: boolean;
  enableMultiTouch: boolean;
  enablePressure: boolean;
  enableGestures: boolean;
  
  // 精度配置
  touchPrecisionThreshold: number;  // ±2px以内
  tapTimeout: number;               // 点击超时
  longPressTimeout: number;         // 长按超时
  doubleTapTimeout: number;         // 双击超时
  
  // 性能配置
  touchThrottleMs: number;          // 触控事件节流
  maxConcurrentTouches: number;     // 最大并发触点
  memoryPoolSize: number;           // 内存池大小
  
  // 移动端优化
  preventBounce: boolean;           // 防止回弹
  preventZoom: boolean;             // 防止缩放
  optimizeBattery: boolean;         // 电池优化
}

// 默认配置
const DEFAULT_TOUCH_CONFIG: TouchAdaptationConfig = {
  enableTouch: true,
  enableMultiTouch: true,
  enablePressure: true,
  enableGestures: true,
  touchPrecisionThreshold: 2.0,
  tapTimeout: 300,
  longPressTimeout: 500,
  doubleTapTimeout: 300,
  touchThrottleMs: 16, // 60 FPS
  maxConcurrentTouches: 10,
  memoryPoolSize: 50,
  preventBounce: true,
  preventZoom: true,
  optimizeBattery: true
};

/**
 * 设备检测工具
 */
export class TouchDeviceDetector {
  private static instance: TouchDeviceDetector;
  private deviceInfo: TouchDeviceInfo;

  private constructor() {
    this.deviceInfo = this.detectDevice();
  }

  static getInstance(): TouchDeviceDetector {
    if (!TouchDeviceDetector.instance) {
      TouchDeviceDetector.instance = new TouchDeviceDetector();
    }
    return TouchDeviceDetector.instance;
  }

  private detectDevice(): TouchDeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|tablet|android|ios|ipad|iphone/.test(userAgent);
    
    // 检测平台
    let platform: TouchDeviceInfo['platform'] = 'unknown';
    if (/iphone|ipad|ios/.test(userAgent)) {
      platform = 'ios';
    } else if (/android/.test(userAgent)) {
      platform = 'android';
    } else if (!isMobile) {
      platform = 'desktop';
    }

    return {
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isPrimaryTouch: isMobile,
      supportsPointer: 'PointerEvent' in window,
      supportsPressure: 'force' in TouchEvent.prototype || 'webkitForce' in TouchEvent.prototype,
      supportsHover: !isMobile,
      maxTouchPoints: navigator.maxTouchPoints || 1,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      platform
    };
  }

  getDeviceInfo(): TouchDeviceInfo {
    return { ...this.deviceInfo };
  }

  isMobileDevice(): boolean {
    return this.deviceInfo.isPrimaryTouch;
  }

  supportsTouch(): boolean {
    return this.deviceInfo.isTouchDevice;
  }

  getOptimalTouchTarget(): number {
    // iOS Human Interface Guidelines: 44pt minimum
    // Android Material Design: 48dp minimum
    // Web: 44px minimum (recommended)
    return this.deviceInfo.platform === 'ios' ? 44 : 48;
  }
}

/**
 * 触控点管理器
 */
class TouchPointManager {
  private activeTouches = new Map<number, TouchPointInfo>();
  private touchHistory = new Map<number, TouchPointInfo[]>();
  private memoryPool: TouchPointInfo[] = [];
  private config: TouchAdaptationConfig;

  constructor(config: TouchAdaptationConfig) {
    this.config = config;
    this.initializeMemoryPool();
  }

  private initializeMemoryPool(): void {
    for (let i = 0; i < this.config.memoryPoolSize; i++) {
      this.memoryPool.push(this.createEmptyTouchPoint());
    }
  }

  private createEmptyTouchPoint(): TouchPointInfo {
    return {
      id: 0,
      position: Vector2D.zero(),
      pressure: 0,
      radius: Vector2D.zero(),
      angle: 0,
      timestamp: 0,
      velocity: Vector2D.zero(),
      acceleration: Vector2D.zero()
    };
  }

  private acquireTouchPoint(): TouchPointInfo {
    return this.memoryPool.pop() || this.createEmptyTouchPoint();
  }

  private releaseTouchPoint(touchPoint: TouchPointInfo): void {
    if (this.memoryPool.length < this.config.memoryPoolSize) {
      // 重置对象
      touchPoint.id = 0;
      touchPoint.position.set(0, 0);
      touchPoint.pressure = 0;
      touchPoint.radius.set(0, 0);
      touchPoint.angle = 0;
      touchPoint.timestamp = 0;
      touchPoint.velocity.set(0, 0);
      touchPoint.acceleration.set(0, 0);
      
      this.memoryPool.push(touchPoint);
    }
  }

  updateTouch(touch: Touch): TouchPointInfo {
    const touchPoint = this.acquireTouchPoint();
    const now = performance.now();
    
    // 基础信息
    touchPoint.id = touch.identifier;
    touchPoint.position.set(
      preciseRound(touch.clientX, 3),
      preciseRound(touch.clientY, 3)
    );
    touchPoint.pressure = (touch as any).force || (touch as any).webkitForce || 0.5;
    touchPoint.radius.set(
      touch.radiusX || 10,
      touch.radiusY || 10
    );
    touchPoint.angle = (touch as any).rotationAngle || 0;
    touchPoint.timestamp = now;

    // 计算速度和加速度
    const history = this.touchHistory.get(touch.identifier) || [];
    if (history.length > 0) {
      const lastTouch = history[history.length - 1];
      const deltaTime = now - lastTouch.timestamp;
      
      if (deltaTime > 0) {
        const deltaPosition = touchPoint.position.subtract(lastTouch.position);
        touchPoint.velocity = deltaPosition.divide(deltaTime * 0.001); // px/s
        
        if (history.length > 1) {
          const deltaVelocity = touchPoint.velocity.subtract(lastTouch.velocity);
          touchPoint.acceleration = deltaVelocity.divide(deltaTime * 0.001); // px/s²
        }
      }
    }

    // 更新历史记录
    history.push(touchPoint.clone ? touchPoint.clone() : { ...touchPoint });
    if (history.length > 5) { // 只保留最近5个点
      const old = history.shift()!;
      this.releaseTouchPoint(old);
    }
    this.touchHistory.set(touch.identifier, history);
    
    // 更新活跃触点
    this.activeTouches.set(touch.identifier, touchPoint);
    
    return touchPoint;
  }

  removeTouch(touchId: number): void {
    const touchPoint = this.activeTouches.get(touchId);
    if (touchPoint) {
      this.releaseTouchPoint(touchPoint);
      this.activeTouches.delete(touchId);
    }
    
    // 清理历史记录
    const history = this.touchHistory.get(touchId);
    if (history) {
      history.forEach(point => this.releaseTouchPoint(point));
      this.touchHistory.delete(touchId);
    }
  }

  getActiveTouch(touchId: number): TouchPointInfo | undefined {
    return this.activeTouches.get(touchId);
  }

  getActiveTouches(): TouchPointInfo[] {
    return Array.from(this.activeTouches.values());
  }

  getPrimaryTouch(): TouchPointInfo | undefined {
    const touches = this.getActiveTouches();
    return touches.length > 0 ? touches[0] : undefined;
  }

  cleanup(): void {
    // 释放所有活跃触点
    for (const touchPoint of this.activeTouches.values()) {
      this.releaseTouchPoint(touchPoint);
    }
    this.activeTouches.clear();

    // 释放历史记录
    for (const history of this.touchHistory.values()) {
      history.forEach(point => this.releaseTouchPoint(point));
    }
    this.touchHistory.clear();
  }
}

/**
 * 手势识别器
 */
class GestureRecognizer {
  private config: TouchAdaptationConfig;
  private gestureStartTime = 0;
  private initialTouches: TouchPointInfo[] = [];
  private lastGesture: GestureInfo | null = null;

  constructor(config: TouchAdaptationConfig) {
    this.config = config;
  }

  recognizeGesture(touches: TouchPointInfo[]): GestureInfo | null {
    if (!this.config.enableGestures || touches.length === 0) {
      return null;
    }

    const now = performance.now();
    const duration = now - this.gestureStartTime;

    // 单点手势
    if (touches.length === 1) {
      return this.recognizeSingleTouchGesture(touches[0], duration);
    }

    // 多点手势
    if (touches.length === 2) {
      return this.recognizeMultiTouchGesture(touches, duration);
    }

    return null;
  }

  private recognizeSingleTouchGesture(touch: TouchPointInfo, duration: number): GestureInfo | null {
    const velocity = touch.velocity.length();
    
    // 检测点击
    if (velocity < 100 && duration < this.config.tapTimeout) {
      return {
        type: 'tap',
        center: touch.position,
        scale: 1,
        rotation: 0,
        velocity: touch.velocity,
        duration,
        confidence: 0.9
      };
    }

    // 检测长按
    if (velocity < 50 && duration > this.config.longPressTimeout) {
      return {
        type: 'long-press',
        center: touch.position,
        scale: 1,
        rotation: 0,
        velocity: touch.velocity,
        duration,
        confidence: 0.8
      };
    }

    // 检测平移
    if (velocity > 100) {
      return {
        type: 'pan',
        center: touch.position,
        scale: 1,
        rotation: 0,
        velocity: touch.velocity,
        duration,
        confidence: 0.7
      };
    }

    return null;
  }

  private recognizeMultiTouchGesture(touches: TouchPointInfo[], duration: number): GestureInfo | null {
    if (touches.length !== 2) return null;

    const [touch1, touch2] = touches;
    const center = touch1.position.add(touch2.position).divide(2);
    
    // 计算缩放
    const currentDistance = touch1.position.distanceTo(touch2.position);
    let scale = 1;
    
    if (this.initialTouches.length === 2) {
      const initialDistance = this.initialTouches[0].position.distanceTo(this.initialTouches[1].position);
      scale = currentDistance / initialDistance;
    }

    // 计算旋转
    const currentAngle = Math.atan2(
      touch2.position.y - touch1.position.y,
      touch2.position.x - touch1.position.x
    );
    
    let rotation = 0;
    if (this.initialTouches.length === 2) {
      const initialAngle = Math.atan2(
        this.initialTouches[1].position.y - this.initialTouches[0].position.y,
        this.initialTouches[1].position.x - this.initialTouches[0].position.x
      );
      rotation = currentAngle - initialAngle;
    }

    // 判断手势类型
    const avgVelocity = touch1.velocity.add(touch2.velocity).divide(2);
    
    if (Math.abs(scale - 1) > 0.1) {
      return {
        type: 'pinch',
        center,
        scale,
        rotation,
        velocity: avgVelocity,
        duration,
        confidence: 0.8
      };
    }

    if (Math.abs(rotation) > 0.1) {
      return {
        type: 'rotate',
        center,
        scale,
        rotation,
        velocity: avgVelocity,
        duration,
        confidence: 0.7
      };
    }

    return null;
  }

  startGesture(touches: TouchPointInfo[]): void {
    this.gestureStartTime = performance.now();
    this.initialTouches = touches.map(touch => ({ ...touch }));
  }

  endGesture(): void {
    this.gestureStartTime = 0;
    this.initialTouches = [];
    this.lastGesture = null;
  }
}

/**
 * 触控事件统一处理器
 */
export class TouchEventHandler {
  private config: TouchAdaptationConfig;
  private deviceDetector: TouchDeviceDetector;
  private touchManager: TouchPointManager;
  private gestureRecognizer: GestureRecognizer;
  
  // 状态管理
  private isDragging = false;
  private dragStartTouch: TouchPointInfo | null = null;
  private dragElement: Element | null = null;
  private dragStartTime = 0;
  
  // 事件回调
  private onDragStart?: (event: TouchPointInfo, element: Element) => void;
  private onDragMove?: (event: TouchPointInfo, element: Element) => void;
  private onDragEnd?: (event: TouchPointInfo, element: Element) => void;
  private onGesture?: (gesture: GestureInfo) => void;
  
  // 性能监控
  private stats = {
    touchEvents: 0,
    gestureEvents: 0,
    dragEvents: 0,
    averageLatency: 0,
    totalLatency: 0
  };

  constructor(config: Partial<TouchAdaptationConfig> = {}) {
    this.config = { ...DEFAULT_TOUCH_CONFIG, ...config };
    this.deviceDetector = TouchDeviceDetector.getInstance();
    this.touchManager = new TouchPointManager(this.config);
    this.gestureRecognizer = new GestureRecognizer(this.config);
    
    this.initializeEventListeners();
    this.setupMobileOptimizations();
  }

  private initializeEventListeners(): void {
    if (!this.deviceDetector.supportsTouch()) {
      console.log('TouchEventHandler: Touch not supported, using mouse events only');
      return;
    }

    // 使用Pointer Events API如果支持
    if (this.deviceDetector.getDeviceInfo().supportsPointer) {
      this.setupPointerEvents();
    } else {
      this.setupTouchEvents();
    }
  }

  private setupPointerEvents(): void {
    console.log('TouchEventHandler: Setting up Pointer Events');
    
    const eventConfig: EventConfig = {
      type: 'pointerdown',
      passive: false,
      priority: 'high'
    };

    eventOptimizer.addListener(document, 'pointerdown', this.handlePointerDown.bind(this), eventConfig);
    eventOptimizer.addListener(document, 'pointermove', this.handlePointerMove.bind(this), {
      ...eventConfig,
      type: 'pointermove',
      throttleMs: this.config.touchThrottleMs,
      passive: true
    });
    eventOptimizer.addListener(document, 'pointerup', this.handlePointerUp.bind(this), {
      ...eventConfig,
      type: 'pointerup'
    });
    eventOptimizer.addListener(document, 'pointercancel', this.handlePointerCancel.bind(this), {
      ...eventConfig,
      type: 'pointercancel'
    });
  }

  private setupTouchEvents(): void {
    console.log('TouchEventHandler: Setting up Touch Events');
    
    const eventConfig: EventConfig = {
      type: 'touchstart',
      passive: false,
      priority: 'high'
    };

    eventOptimizer.addListener(document, 'touchstart', this.handleTouchStart.bind(this), eventConfig);
    eventOptimizer.addListener(document, 'touchmove', this.handleTouchMove.bind(this), {
      ...eventConfig,
      type: 'touchmove',
      throttleMs: this.config.touchThrottleMs,
      passive: false // 需要preventDefault
    });
    eventOptimizer.addListener(document, 'touchend', this.handleTouchEnd.bind(this), {
      ...eventConfig,
      type: 'touchend'
    });
    eventOptimizer.addListener(document, 'touchcancel', this.handleTouchCancel.bind(this), {
      ...eventConfig,
      type: 'touchcancel'
    });
  }

  private setupMobileOptimizations(): void {
    if (!this.deviceDetector.isMobileDevice()) return;

    // 防止回弹
    if (this.config.preventBounce) {
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
    }

    // 防止缩放
    if (this.config.preventZoom) {
      const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (viewport) {
        const content = viewport.content;
        if (!content.includes('user-scalable=no')) {
          viewport.content = content + ', user-scalable=no';
        }
      }
    }

    // 电池优化
    if (this.config.optimizeBattery) {
      // 降低更新频率
      this.config.touchThrottleMs = Math.max(this.config.touchThrottleMs, 20);
      
      // 监听电池状态
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2) {
              console.log('TouchEventHandler: Low battery, reducing performance');
              this.config.touchThrottleMs *= 2;
            }
          });
        });
      }
    }
  }

  // Pointer Events处理
  private handlePointerDown(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    
    const startTime = performance.now();
    this.stats.touchEvents++;
    
    const touch = this.convertPointerToTouch(event);
    const touchPoint = this.touchManager.updateTouch(touch);
    
    this.handleTouchStartLogic(touchPoint, event.target as Element, event);
    
    this.updateLatencyStats(performance.now() - startTime);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    
    const touch = this.convertPointerToTouch(event);
    const touchPoint = this.touchManager.updateTouch(touch);
    
    this.handleTouchMoveLogic(touchPoint, event);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    
    const touchPoint = this.touchManager.getActiveTouch(event.pointerId);
    if (touchPoint) {
      this.handleTouchEndLogic(touchPoint, event);
      this.touchManager.removeTouch(event.pointerId);
    }
  }

  private handlePointerCancel(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;
    
    this.handleTouchCancelLogic(event.pointerId);
    this.touchManager.removeTouch(event.pointerId);
  }

  // Touch Events处理
  private handleTouchStart(event: TouchEvent): void {
    const startTime = performance.now();
    this.stats.touchEvents++;
    
    // 防止默认行为（如滚动）
    if (this.isDragging || this.shouldPreventDefault(event)) {
      event.preventDefault();
    }
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchManager.updateTouch(touch);
      
      this.handleTouchStartLogic(touchPoint, event.target as Element, event);
    }
    
    // 手势识别
    if (this.config.enableGestures) {
      const activeTouches = this.touchManager.getActiveTouches();
      this.gestureRecognizer.startGesture(activeTouches);
    }
    
    this.updateLatencyStats(performance.now() - startTime);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.isDragging) {
      event.preventDefault();
    }
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchManager.updateTouch(touch);
      
      this.handleTouchMoveLogic(touchPoint, event);
    }
    
    // 手势识别
    if (this.config.enableGestures) {
      const activeTouches = this.touchManager.getActiveTouches();
      const gesture = this.gestureRecognizer.recognizeGesture(activeTouches);
      
      if (gesture && this.onGesture) {
        this.stats.gestureEvents++;
        this.onGesture(gesture);
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.touchManager.getActiveTouch(touch.identifier);
      
      if (touchPoint) {
        this.handleTouchEndLogic(touchPoint, event);
        this.touchManager.removeTouch(touch.identifier);
      }
    }
    
    // 结束手势识别
    const activeTouches = this.touchManager.getActiveTouches();
    if (activeTouches.length === 0) {
      this.gestureRecognizer.endGesture();
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.handleTouchCancelLogic(touch.identifier);
      this.touchManager.removeTouch(touch.identifier);
    }
  }

  // 核心逻辑处理
  private handleTouchStartLogic(touchPoint: TouchPointInfo, target: Element, originalEvent: Event): void {
    // 检查是否在可拖拽元素上
    const draggableElement = this.findDraggableElement(target);
    if (!draggableElement) return;
    
    console.log('TouchEventHandler: Starting touch drag for element:', draggableElement);
    
    this.isDragging = true;
    this.dragStartTouch = touchPoint;
    this.dragElement = draggableElement;
    this.dragStartTime = performance.now();
    
    if (this.onDragStart) {
      this.onDragStart(touchPoint, draggableElement);
      this.stats.dragEvents++;
    }
  }

  private handleTouchMoveLogic(touchPoint: TouchPointInfo, originalEvent: Event): void {
    if (!this.isDragging || !this.dragElement || !this.dragStartTouch) return;
    
    // 检查精度阈值
    const deltaFromStart = touchPoint.position.distanceTo(this.dragStartTouch.position);
    if (deltaFromStart < this.config.touchPrecisionThreshold) {
      return; // 移动距离太小，忽略
    }
    
    if (this.onDragMove) {
      this.onDragMove(touchPoint, this.dragElement);
    }
  }

  private handleTouchEndLogic(touchPoint: TouchPointInfo, originalEvent: Event): void {
    if (!this.isDragging || !this.dragElement) return;
    
    console.log('TouchEventHandler: Ending touch drag');
    
    const dragDuration = performance.now() - this.dragStartTime;
    
    if (this.onDragEnd) {
      this.onDragEnd(touchPoint, this.dragElement);
    }
    
    this.isDragging = false;
    this.dragStartTouch = null;
    this.dragElement = null;
    this.dragStartTime = 0;
    
    console.log('TouchEventHandler: Touch drag completed in', dragDuration.toFixed(2), 'ms');
  }

  private handleTouchCancelLogic(touchId: number): void {
    if (this.isDragging && this.dragStartTouch?.id === touchId) {
      console.log('TouchEventHandler: Touch drag cancelled');
      
      this.isDragging = false;
      this.dragStartTouch = null;
      this.dragElement = null;
      this.dragStartTime = 0;
    }
  }

  // 工具方法
  private convertPointerToTouch(pointer: PointerEvent): Touch {
    return {
      identifier: pointer.pointerId,
      clientX: pointer.clientX,
      clientY: pointer.clientY,
      pageX: pointer.pageX,
      pageY: pointer.pageY,
      screenX: pointer.screenX,
      screenY: pointer.screenY,
      radiusX: (pointer as any).width || 10,
      radiusY: (pointer as any).height || 10,
      rotationAngle: 0,
      force: (pointer as any).pressure || 0.5,
      target: pointer.target
    } as Touch;
  }

  private findDraggableElement(target: Element): Element | null {
    let element = target;
    
    while (element && element !== document.body) {
      // 检查各种可能的拖拽标识
      if (
        element.classList.contains('precise-node') ||
        element.classList.contains('funnel-node') ||
        element.classList.contains('draggable') ||
        element.hasAttribute('draggable') ||
        element.hasAttribute('data-draggable')
      ) {
        return element;
      }
      
      element = element.parentElement!;
    }
    
    return null;
  }

  private shouldPreventDefault(event: TouchEvent): boolean {
    // 在拖拽期间总是阻止默认行为
    if (this.isDragging) return true;
    
    // 检查是否在可拖拽元素上
    const target = event.target as Element;
    const draggableElement = this.findDraggableElement(target);
    
    return !!draggableElement;
  }

  private updateLatencyStats(latency: number): void {
    this.stats.totalLatency += latency;
    this.stats.averageLatency = this.stats.totalLatency / this.stats.touchEvents;
  }

  // 公共API
  setDragHandlers(handlers: {
    onDragStart?: (event: TouchPointInfo, element: Element) => void;
    onDragMove?: (event: TouchPointInfo, element: Element) => void;
    onDragEnd?: (event: TouchPointInfo, element: Element) => void;
  }): void {
    this.onDragStart = handlers.onDragStart;
    this.onDragMove = handlers.onDragMove;
    this.onDragEnd = handlers.onDragEnd;
  }

  setGestureHandler(handler: (gesture: GestureInfo) => void): void {
    this.onGesture = handler;
  }

  updateConfig(updates: Partial<TouchAdaptationConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('TouchEventHandler: Config updated', updates);
  }

  getStats(): typeof this.stats & { deviceInfo: TouchDeviceInfo } {
    return {
      ...this.stats,
      deviceInfo: this.deviceDetector.getDeviceInfo()
    };
  }

  isDraggingActive(): boolean {
    return this.isDragging;
  }

  getCurrentTouch(): TouchPointInfo | null {
    return this.dragStartTouch;
  }

  getActiveTouches(): TouchPointInfo[] {
    return this.touchManager.getActiveTouches();
  }

  cleanup(): void {
    console.log('TouchEventHandler: Cleaning up...');
    
    this.touchManager.cleanup();
    this.gestureRecognizer.endGesture();
    
    this.isDragging = false;
    this.dragStartTouch = null;
    this.dragElement = null;
    
    // 事件监听器会由eventOptimizer管理清理
    console.log('TouchEventHandler: Cleanup completed');
  }
}

/**
 * 触控事件与鼠标事件的精确映射器
 */
export class TouchMouseMapper {
  /**
   * 将触控事件转换为兼容的鼠标事件格式
   */
  static touchToMouseEvent(touchPoint: TouchPointInfo, type: 'mousedown' | 'mousemove' | 'mouseup'): MouseEvent {
    const mouseEventInit: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      clientX: touchPoint.position.x,
      clientY: touchPoint.position.y,
      button: 0, // 左键
      buttons: type === 'mouseup' ? 0 : 1,
      detail: 1
    };
    
    return new MouseEvent(type, mouseEventInit);
  }

  /**
   * 创建与现有拖拽系统兼容的事件对象
   */
  static createCompatibleEvent(touchPoint: TouchPointInfo, originalTarget?: Element): Event & {
    clientX: number;
    clientY: number;
    preventDefault(): void;
    stopPropagation(): void;
  } {
    const target = originalTarget || document.elementFromPoint(touchPoint.position.x, touchPoint.position.y);
    
    return {
      type: 'mousemove',
      target,
      currentTarget: target,
      clientX: touchPoint.position.x,
      clientY: touchPoint.position.y,
      preventDefault: () => {},
      stopPropagation: () => {},
      timeStamp: touchPoint.timestamp
    } as any;
  }
}

// 导出单例实例
export const touchEventHandler = new TouchEventHandler();

// 便捷函数
export function initializeTouchSupport(config?: Partial<TouchAdaptationConfig>): TouchEventHandler {
  if (config) {
    touchEventHandler.updateConfig(config);
  }
  
  console.log('Touch support initialized for device:', 
    TouchDeviceDetector.getInstance().getDeviceInfo()
  );
  
  return touchEventHandler;
}

export function isTouchDevice(): boolean {
  return TouchDeviceDetector.getInstance().supportsTouch();
}

export function getMobileOptimalTouchTarget(): number {
  return TouchDeviceDetector.getInstance().getOptimalTouchTarget();
}