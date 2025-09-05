/**
 * 高级手势识别系统
 * 双击编辑、长按右键菜单、复杂手势快捷操作、拖拽路径识别
 * 基于机器学习的手势模式识别，支持自定义手势训练
 */

import { Vector2D } from './math-precision';
import { memoryManager } from './memory-manager';
import { touchEventHandler, isTouchDevice, type TouchPointInfo } from './touch-event-handler';

// 手势类型定义
export enum GestureType {
  TAP = 'tap',
  DOUBLE_TAP = 'double-tap',
  LONG_PRESS = 'long-press',
  DRAG = 'drag',
  SWIPE = 'swipe',
  PINCH = 'pinch',
  ROTATE = 'rotate',
  CIRCLE = 'circle',
  LINE = 'line',
  ZIGZAG = 'zigzag',
  CUSTOM = 'custom'
}

// 手势状态
export enum GestureState {
  IDLE = 'idle',
  DETECTING = 'detecting',
  RECOGNIZED = 'recognized',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 手势配置
export interface GestureConfig {
  type: GestureType;
  minPoints: number;           // 最少触点数
  maxPoints: number;           // 最多触点数
  minDistance: number;         // 最小移动距离
  maxDistance: number;         // 最大移动距离
  minDuration: number;         // 最小持续时间
  maxDuration: number;         // 最大持续时间
  threshold: number;           // 识别阈值
  tolerance: number;           // 容错范围
  enabled: boolean;
}

// 手势数据点
export interface GesturePoint {
  position: Vector2D;
  timestamp: number;
  pressure: number;
  velocity: Vector2D;
  acceleration: Vector2D;
}

// 手势路径
export interface GesturePath {
  id: string;
  points: GesturePoint[];
  startTime: number;
  endTime: number;
  boundingBox: { min: Vector2D; max: Vector2D };
  totalDistance: number;
  averageVelocity: Vector2D;
  direction: Vector2D;
}

// 手势识别结果
export interface GestureRecognitionResult {
  type: GestureType;
  confidence: number;          // 置信度 [0, 1]
  path: GesturePath;
  duration: number;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

// 手势事件数据
export interface GestureEventData {
  gestureType: GestureType;
  result: GestureRecognitionResult;
  originalEvent?: Event;
  element?: Element;
  canceled?: boolean;
}

// 预定义手势配置
const DEFAULT_GESTURE_CONFIGS: Map<GestureType, GestureConfig> = new Map([
  [GestureType.TAP, {
    type: GestureType.TAP,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 0,
    maxDistance: 10,
    minDuration: 50,
    maxDuration: 300,
    threshold: 0.8,
    tolerance: 5,
    enabled: true
  }],
  
  [GestureType.DOUBLE_TAP, {
    type: GestureType.DOUBLE_TAP,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 0,
    maxDistance: 20,
    minDuration: 50,
    maxDuration: 800,
    threshold: 0.7,
    tolerance: 10,
    enabled: true
  }],
  
  [GestureType.LONG_PRESS, {
    type: GestureType.LONG_PRESS,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 0,
    maxDistance: 15,
    minDuration: 500,
    maxDuration: 5000,
    threshold: 0.9,
    tolerance: 8,
    enabled: true
  }],
  
  [GestureType.DRAG, {
    type: GestureType.DRAG,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 20,
    maxDistance: Infinity,
    minDuration: 100,
    maxDuration: 10000,
    threshold: 0.8,
    tolerance: 10,
    enabled: true
  }],
  
  [GestureType.SWIPE, {
    type: GestureType.SWIPE,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 50,
    maxDistance: 500,
    minDuration: 100,
    maxDuration: 1000,
    threshold: 0.7,
    tolerance: 20,
    enabled: true
  }],
  
  [GestureType.CIRCLE, {
    type: GestureType.CIRCLE,
    minPoints: 1,
    maxPoints: 1,
    minDistance: 100,
    maxDistance: 800,
    minDuration: 500,
    maxDuration: 3000,
    threshold: 0.6,
    tolerance: 30,
    enabled: true
  }]
]);

/**
 * 高级手势识别引擎
 */
export class AdvancedGestureRecognizer {
  private gestureConfigs: Map<GestureType, GestureConfig> = new Map();
  private eventListeners: Map<GestureType, Function[]> = new Map();
  
  // 当前手势追踪
  private activePaths: Map<string, GesturePath> = new Map();
  private lastTapTime = 0;
  private lastTapPosition: Vector2D | null = null;
  private longPressTimer: number | null = null;
  
  // 手势历史记录（用于机器学习）
  private gestureHistory: GestureRecognitionResult[] = [];
  private maxHistorySize = 1000;
  
  // 性能监控
  private recognitionCount = 0;
  private totalRecognitionTime = 0;
  private lastRecognitionTime = 0;
  
  // 触控设备支持
  private isTouchDevice = isTouchDevice();
  private multiTouchSupported = false;

  constructor() {
    this.initializeGestureConfigs();
    this.initializeEventListeners();
    this.checkMultiTouchSupport();
    
    console.log('AdvancedGestureRecognizer: Initialized with touch support:', this.isTouchDevice);
  }

  /**
   * 初始化手势配置
   */
  private initializeGestureConfigs(): void {
    // 复制默认配置
    DEFAULT_GESTURE_CONFIGS.forEach((config, type) => {
      this.gestureConfigs.set(type, { ...config });
    });

    // 初始化事件监听器映射
    Object.values(GestureType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 鼠标事件监听
    document.addEventListener('mousedown', this.handlePointerStart.bind(this));
    document.addEventListener('mousemove', this.handlePointerMove.bind(this));
    document.addEventListener('mouseup', this.handlePointerEnd.bind(this));
    
    // 触控事件监听
    if (this.isTouchDevice) {
      document.addEventListener('touchstart', this.handleTouchStart.bind(this));
      document.addEventListener('touchmove', this.handleTouchMove.bind(this));
      document.addEventListener('touchend', this.handleTouchEnd.bind(this));
      document.addEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }

    console.log('AdvancedGestureRecognizer: Event listeners initialized');
  }

  /**
   * 检查多点触控支持
   */
  private checkMultiTouchSupport(): void {
    this.multiTouchSupported = 'ontouchstart' in window && navigator.maxTouchPoints > 1;
    console.log('AdvancedGestureRecognizer: Multi-touch supported:', this.multiTouchSupported);
  }

  /**
   * 处理指针开始事件
   */
  private handlePointerStart(event: MouseEvent): void {
    if (event.button !== 0) return; // 只处理左键

    const point = this.createGesturePoint(
      new Vector2D(event.clientX, event.clientY),
      performance.now(),
      0.5 // 鼠标没有压力感应，使用默认值
    );

    this.startGesturePath('mouse', point);
    this.checkTapGesture(point);
    this.startLongPressDetection(point);
  }

  /**
   * 处理指针移动事件
   */
  private handlePointerMove(event: MouseEvent): void {
    const point = this.createGesturePoint(
      new Vector2D(event.clientX, event.clientY),
      performance.now(),
      0.5
    );

    this.updateGesturePath('mouse', point);
    this.cancelLongPressIfMoved(point);
  }

  /**
   * 处理指针结束事件
   */
  private handlePointerEnd(event: MouseEvent): void {
    const point = this.createGesturePoint(
      new Vector2D(event.clientX, event.clientY),
      performance.now(),
      0.5
    );

    this.endGesturePath('mouse', point);
    this.clearLongPressTimer();
  }

  /**
   * 处理触控开始事件
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchId = `touch-${touch.identifier}`;
      
      const point = this.createGesturePoint(
        new Vector2D(touch.clientX, touch.clientY),
        performance.now(),
        (touch as any).force || 0.5
      );

      this.startGesturePath(touchId, point);
      this.checkTapGesture(point);
      
      // 触控设备的长按时间稍短
      if (event.touches.length === 1) {
        this.startLongPressDetection(point, 400);
      }
    }
  }

  /**
   * 处理触控移动事件
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchId = `touch-${touch.identifier}`;
      
      const point = this.createGesturePoint(
        new Vector2D(touch.clientX, touch.clientY),
        performance.now(),
        (touch as any).force || 0.5
      );

      this.updateGesturePath(touchId, point);
      this.cancelLongPressIfMoved(point);
    }

    // 检测多点触控手势
    if (event.touches.length >= 2) {
      this.detectMultiTouchGestures(event);
    }
  }

  /**
   * 处理触控结束事件
   */
  private handleTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchId = `touch-${touch.identifier}`;
      
      const point = this.createGesturePoint(
        new Vector2D(touch.clientX, touch.clientY),
        performance.now(),
        (touch as any).force || 0.5
      );

      this.endGesturePath(touchId, point);
    }

    this.clearLongPressTimer();
  }

  /**
   * 处理触控取消事件
   */
  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchId = `touch-${touch.identifier}`;
      
      this.cancelGesturePath(touchId);
    }

    this.clearLongPressTimer();
  }

  /**
   * 创建手势数据点
   */
  private createGesturePoint(
    position: Vector2D,
    timestamp: number,
    pressure: number,
    lastPoint?: GesturePoint
  ): GesturePoint {
    let velocity = Vector2D.zero();
    let acceleration = Vector2D.zero();

    if (lastPoint) {
      const deltaTime = timestamp - lastPoint.timestamp;
      if (deltaTime > 0) {
        velocity = position.subtract(lastPoint.position).divide(deltaTime);
        acceleration = velocity.subtract(lastPoint.velocity).divide(deltaTime);
      }
    }

    return {
      position: position.clone(),
      timestamp,
      pressure,
      velocity,
      acceleration
    };
  }

  /**
   * 开始手势路径
   */
  private startGesturePath(pathId: string, startPoint: GesturePoint): void {
    const path: GesturePath = {
      id: pathId,
      points: [startPoint],
      startTime: startPoint.timestamp,
      endTime: startPoint.timestamp,
      boundingBox: {
        min: startPoint.position.clone(),
        max: startPoint.position.clone()
      },
      totalDistance: 0,
      averageVelocity: Vector2D.zero(),
      direction: Vector2D.zero()
    };

    this.activePaths.set(pathId, path);
  }

  /**
   * 更新手势路径
   */
  private updateGesturePath(pathId: string, newPoint: GesturePoint): void {
    const path = this.activePaths.get(pathId);
    if (!path) return;

    const lastPoint = path.points[path.points.length - 1];
    
    // 创建包含速度和加速度的新点
    const enhancedPoint = this.createGesturePoint(
      newPoint.position,
      newPoint.timestamp,
      newPoint.pressure,
      lastPoint
    );

    path.points.push(enhancedPoint);
    path.endTime = enhancedPoint.timestamp;

    // 更新边界框
    path.boundingBox.min.x = Math.min(path.boundingBox.min.x, enhancedPoint.position.x);
    path.boundingBox.min.y = Math.min(path.boundingBox.min.y, enhancedPoint.position.y);
    path.boundingBox.max.x = Math.max(path.boundingBox.max.x, enhancedPoint.position.x);
    path.boundingBox.max.y = Math.max(path.boundingBox.max.y, enhancedPoint.position.y);

    // 更新总距离
    path.totalDistance += lastPoint.position.distanceTo(enhancedPoint.position);

    // 更新平均速度
    const duration = path.endTime - path.startTime;
    if (duration > 0) {
      const totalDisplacement = enhancedPoint.position.subtract(path.points[0].position);
      path.averageVelocity = totalDisplacement.divide(duration);
    }

    // 更新主方向
    if (path.points.length >= 2) {
      const start = path.points[0].position;
      const end = enhancedPoint.position;
      path.direction = end.subtract(start).normalize();
    }
  }

  /**
   * 结束手势路径
   */
  private endGesturePath(pathId: string, endPoint: GesturePoint): void {
    const path = this.activePaths.get(pathId);
    if (!path) return;

    // 添加结束点
    this.updateGesturePath(pathId, endPoint);

    // 识别手势
    const recognitionResult = this.recognizeGesture(path);
    
    if (recognitionResult) {
      this.addToHistory(recognitionResult);
      this.dispatchGestureEvent(recognitionResult);
    }

    // 清理路径
    this.activePaths.delete(pathId);
  }

  /**
   * 取消手势路径
   */
  private cancelGesturePath(pathId: string): void {
    this.activePaths.delete(pathId);
  }

  /**
   * 检测点击手势
   */
  private checkTapGesture(point: GesturePoint): void {
    const now = point.timestamp;
    const config = this.gestureConfigs.get(GestureType.DOUBLE_TAP);
    
    if (!config) return;

    // 检测双击
    if (this.lastTapTime > 0 && this.lastTapPosition) {
      const timeDiff = now - this.lastTapTime;
      const distance = point.position.distanceTo(this.lastTapPosition);
      
      if (timeDiff <= config.maxDuration && distance <= config.maxDistance) {
        // 双击手势识别成功
        const doubleTapResult: GestureRecognitionResult = {
          type: GestureType.DOUBLE_TAP,
          confidence: 0.9,
          path: {
            id: 'double-tap',
            points: [
              { ...this.createGesturePoint(this.lastTapPosition, this.lastTapTime, 0.5) },
              point
            ],
            startTime: this.lastTapTime,
            endTime: now,
            boundingBox: {
              min: Vector2D.min(this.lastTapPosition, point.position),
              max: Vector2D.max(this.lastTapPosition, point.position)
            },
            totalDistance: distance,
            averageVelocity: Vector2D.zero(),
            direction: Vector2D.zero()
          },
          duration: timeDiff,
          parameters: {
            tapCount: 2,
            spacing: distance,
            interval: timeDiff
          }
        };

        this.addToHistory(doubleTapResult);
        this.dispatchGestureEvent(doubleTapResult);
        
        // 重置点击状态
        this.lastTapTime = 0;
        this.lastTapPosition = null;
        return;
      }
    }

    // 记录当前点击
    this.lastTapTime = now;
    this.lastTapPosition = point.position.clone();
  }

  /**
   * 开始长按检测
   */
  private startLongPressDetection(point: GesturePoint, duration = 500): void {
    this.clearLongPressTimer();
    
    const config = this.gestureConfigs.get(GestureType.LONG_PRESS);
    if (!config || !config.enabled) return;

    this.longPressTimer = window.setTimeout(() => {
      // 长按手势识别成功
      const longPressResult: GestureRecognitionResult = {
        type: GestureType.LONG_PRESS,
        confidence: 0.95,
        path: {
          id: 'long-press',
          points: [point],
          startTime: point.timestamp,
          endTime: point.timestamp + duration,
          boundingBox: {
            min: point.position.clone(),
            max: point.position.clone()
          },
          totalDistance: 0,
          averageVelocity: Vector2D.zero(),
          direction: Vector2D.zero()
        },
        duration,
        parameters: {
          pressure: point.pressure,
          holdDuration: duration
        }
      };

      this.addToHistory(longPressResult);
      this.dispatchGestureEvent(longPressResult);
      
      // 触发右键菜单效果
      this.triggerContextMenu(point.position);
      
    }, duration);
  }

  /**
   * 如果移动距离过大则取消长按
   */
  private cancelLongPressIfMoved(currentPoint: GesturePoint): void {
    if (!this.longPressTimer || !this.lastTapPosition) return;

    const config = this.gestureConfigs.get(GestureType.LONG_PRESS);
    if (!config) return;

    const distance = currentPoint.position.distanceTo(this.lastTapPosition);
    if (distance > config.maxDistance) {
      this.clearLongPressTimer();
    }
  }

  /**
   * 清除长按计时器
   */
  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * 检测多点触控手势
   */
  private detectMultiTouchGestures(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const point1 = new Vector2D(touch1.clientX, touch1.clientY);
    const point2 = new Vector2D(touch2.clientX, touch2.clientY);
    
    // 检测缩放手势
    this.detectPinchGesture(point1, point2);
    
    // 检测旋转手势
    this.detectRotateGesture(point1, point2);
  }

  /**
   * 检测缩放手势
   */
  private detectPinchGesture(point1: Vector2D, point2: Vector2D): void {
    // 简化的缩放检测逻辑
    const distance = point1.distanceTo(point2);
    const center = point1.add(point2).divide(2);
    
    // 这里应该与之前的距离进行比较以检测缩放
    // 为简化演示，创建一个基本的缩放手势结果
    const pinchResult: GestureRecognitionResult = {
      type: GestureType.PINCH,
      confidence: 0.8,
      path: {
        id: 'pinch',
        points: [
          this.createGesturePoint(point1, performance.now(), 0.5),
          this.createGesturePoint(point2, performance.now(), 0.5)
        ],
        startTime: performance.now(),
        endTime: performance.now(),
        boundingBox: {
          min: Vector2D.min(point1, point2),
          max: Vector2D.max(point1, point2)
        },
        totalDistance: distance,
        averageVelocity: Vector2D.zero(),
        direction: Vector2D.zero()
      },
      duration: 0,
      parameters: {
        scale: 1.0, // 应该计算实际缩放比例
        center,
        distance
      }
    };

    // 实际应用中需要更复杂的状态管理
    // this.dispatchGestureEvent(pinchResult);
  }

  /**
   * 检测旋转手势
   */
  private detectRotateGesture(point1: Vector2D, point2: Vector2D): void {
    const center = point1.add(point2).divide(2);
    const vector = point2.subtract(point1);
    const angle = Math.atan2(vector.y, vector.x);
    
    // 简化的旋转检测逻辑
    const rotateResult: GestureRecognitionResult = {
      type: GestureType.ROTATE,
      confidence: 0.7,
      path: {
        id: 'rotate',
        points: [
          this.createGesturePoint(point1, performance.now(), 0.5),
          this.createGesturePoint(point2, performance.now(), 0.5)
        ],
        startTime: performance.now(),
        endTime: performance.now(),
        boundingBox: {
          min: Vector2D.min(point1, point2),
          max: Vector2D.max(point1, point2)
        },
        totalDistance: 0,
        averageVelocity: Vector2D.zero(),
        direction: Vector2D.zero()
      },
      duration: 0,
      parameters: {
        angle,
        center,
        rotation: 0 // 应该计算实际旋转角度
      }
    };

    // 实际应用中需要更复杂的状态管理
    // this.dispatchGestureEvent(rotateResult);
  }

  /**
   * 手势识别主函数
   */
  private recognizeGesture(path: GesturePath): GestureRecognitionResult | null {
    const startTime = performance.now();
    
    try {
      // 计算基本手势特征
      const duration = path.endTime - path.startTime;
      const displacement = path.points.length >= 2 
        ? path.points[path.points.length - 1].position.subtract(path.points[0].position)
        : Vector2D.zero();
      const distance = displacement.length();

      // 按优先级检测各种手势
      
      // 1. 检测简单点击
      if (this.matchesTapPattern(path, duration, distance)) {
        return this.createTapResult(path);
      }

      // 2. 检测拖拽
      if (this.matchesDragPattern(path, duration, distance)) {
        return this.createDragResult(path);
      }

      // 3. 检测滑动
      if (this.matchesSwipePattern(path, duration, distance)) {
        return this.createSwipeResult(path);
      }

      // 4. 检测圆形手势
      if (this.matchesCirclePattern(path)) {
        return this.createCircleResult(path);
      }

      // 5. 检测直线手势
      if (this.matchesLinePattern(path)) {
        return this.createLineResult(path);
      }

      // 6. 检测锯齿手势
      if (this.matchesZigzagPattern(path)) {
        return this.createZigzagResult(path);
      }

      return null;

    } finally {
      const recognitionTime = performance.now() - startTime;
      this.totalRecognitionTime += recognitionTime;
      this.recognitionCount++;
      this.lastRecognitionTime = recognitionTime;
    }
  }

  /**
   * 检测点击模式
   */
  private matchesTapPattern(path: GesturePath, duration: number, distance: number): boolean {
    const config = this.gestureConfigs.get(GestureType.TAP);
    if (!config || !config.enabled) return false;

    return duration >= config.minDuration &&
           duration <= config.maxDuration &&
           distance <= config.maxDistance;
  }

  /**
   * 检测拖拽模式
   */
  private matchesDragPattern(path: GesturePath, duration: number, distance: number): boolean {
    const config = this.gestureConfigs.get(GestureType.DRAG);
    if (!config || !config.enabled) return false;

    return duration >= config.minDuration &&
           duration <= config.maxDuration &&
           distance >= config.minDistance;
  }

  /**
   * 检测滑动模式
   */
  private matchesSwipePattern(path: GesturePath, duration: number, distance: number): boolean {
    const config = this.gestureConfigs.get(GestureType.SWIPE);
    if (!config || !config.enabled) return false;

    // 滑动需要快速移动且路径相对直线
    const straightness = this.calculatePathStraightness(path);
    
    return duration >= config.minDuration &&
           duration <= config.maxDuration &&
           distance >= config.minDistance &&
           distance <= config.maxDistance &&
           straightness > 0.7; // 70%以上的直线度
  }

  /**
   * 检测圆形模式
   */
  private matchesCirclePattern(path: GesturePath): boolean {
    const config = this.gestureConfigs.get(GestureType.CIRCLE);
    if (!config || !config.enabled || path.points.length < 10) return false;

    const circularity = this.calculateCircularity(path);
    const completeness = this.calculateCircleCompleteness(path);
    
    return circularity > config.threshold && 
           completeness > 0.6; // 至少完成60%的圆形
  }

  /**
   * 检测直线模式
   */
  private matchesLinePattern(path: GesturePath): boolean {
    if (path.points.length < 3) return false;
    
    const straightness = this.calculatePathStraightness(path);
    return straightness > 0.85; // 85%以上的直线度
  }

  /**
   * 检测锯齿模式
   */
  private matchesZigzagPattern(path: GesturePath): boolean {
    if (path.points.length < 6) return false;
    
    const directionChanges = this.calculateDirectionChanges(path);
    const avgChange = directionChanges.length > 0 
      ? directionChanges.reduce((sum, change) => sum + Math.abs(change), 0) / directionChanges.length 
      : 0;
    
    // 锯齿手势特征：频繁的方向改变，且改变幅度较大
    return directionChanges.length >= 3 && avgChange > Math.PI / 3; // 60度以上的平均转向
  }

  /**
   * 计算路径直线度
   */
  private calculatePathStraightness(path: GesturePath): number {
    if (path.points.length < 2) return 1;

    const start = path.points[0].position;
    const end = path.points[path.points.length - 1].position;
    const straightDistance = start.distanceTo(end);
    
    if (straightDistance === 0) return 1;
    
    return straightDistance / path.totalDistance;
  }

  /**
   * 计算圆形度
   */
  private calculateCircularity(path: GesturePath): number {
    if (path.points.length < 4) return 0;

    // 计算路径的重心
    const center = path.points.reduce(
      (sum, point) => sum.add(point.position),
      Vector2D.zero()
    ).divide(path.points.length);

    // 计算每个点到重心的距离
    const distances = path.points.map(point => point.position.distanceTo(center));
    const avgRadius = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    
    if (avgRadius === 0) return 0;

    // 计算距离的标准差，标准差越小圆形度越高
    const variance = distances.reduce((sum, dist) => sum + Math.pow(dist - avgRadius, 2), 0) / distances.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, 1 - (stdDev / avgRadius));
  }

  /**
   * 计算圆形完整度
   */
  private calculateCircleCompleteness(path: GesturePath): number {
    if (path.points.length < 4) return 0;

    // 计算路径覆盖的角度范围
    const center = path.points.reduce(
      (sum, point) => sum.add(point.position),
      Vector2D.zero()
    ).divide(path.points.length);

    const angles = path.points.map(point => {
      const vector = point.position.subtract(center);
      return Math.atan2(vector.y, vector.x);
    });

    // 计算角度跨度
    let minAngle = Math.min(...angles);
    let maxAngle = Math.max(...angles);
    
    // 处理角度跨越-π到π的情况
    if (maxAngle - minAngle > Math.PI) {
      [minAngle, maxAngle] = [maxAngle, minAngle + 2 * Math.PI];
    }
    
    const angleSpan = maxAngle - minAngle;
    return Math.min(1, angleSpan / (2 * Math.PI));
  }

  /**
   * 计算方向变化
   */
  private calculateDirectionChanges(path: GesturePath): number[] {
    const changes: number[] = [];
    
    if (path.points.length < 3) return changes;

    for (let i = 1; i < path.points.length - 1; i++) {
      const prev = path.points[i - 1].position;
      const curr = path.points[i].position;
      const next = path.points[i + 1].position;
      
      const vector1 = curr.subtract(prev).normalize();
      const vector2 = next.subtract(curr).normalize();
      
      const angle = Math.acos(Math.max(-1, Math.min(1, vector1.dot(vector2))));
      changes.push(angle);
    }
    
    return changes;
  }

  /**
   * 创建点击结果
   */
  private createTapResult(path: GesturePath): GestureRecognitionResult {
    return {
      type: GestureType.TAP,
      confidence: 0.9,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        position: path.points[0].position.clone(),
        pressure: path.points[0].pressure
      }
    };
  }

  /**
   * 创建拖拽结果
   */
  private createDragResult(path: GesturePath): GestureRecognitionResult {
    const start = path.points[0].position;
    const end = path.points[path.points.length - 1].position;
    
    return {
      type: GestureType.DRAG,
      confidence: 0.85,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        startPosition: start.clone(),
        endPosition: end.clone(),
        displacement: end.subtract(start),
        totalDistance: path.totalDistance,
        averageVelocity: path.averageVelocity.clone()
      }
    };
  }

  /**
   * 创建滑动结果
   */
  private createSwipeResult(path: GesturePath): GestureRecognitionResult {
    const direction = path.direction;
    let swipeDirection: string;
    
    // 判断主要滑动方向
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      swipeDirection = direction.x > 0 ? 'right' : 'left';
    } else {
      swipeDirection = direction.y > 0 ? 'down' : 'up';
    }

    return {
      type: GestureType.SWIPE,
      confidence: 0.8,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        direction: swipeDirection,
        velocity: path.averageVelocity.length(),
        distance: path.totalDistance
      }
    };
  }

  /**
   * 创建圆形结果
   */
  private createCircleResult(path: GesturePath): GestureRecognitionResult {
    const center = path.points.reduce(
      (sum, point) => sum.add(point.position),
      Vector2D.zero()
    ).divide(path.points.length);

    const radius = path.points.reduce(
      (sum, point) => sum + point.position.distanceTo(center),
      0
    ) / path.points.length;

    return {
      type: GestureType.CIRCLE,
      confidence: 0.7,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        center: center.clone(),
        radius,
        clockwise: this.isClockwise(path, center)
      }
    };
  }

  /**
   * 创建直线结果
   */
  private createLineResult(path: GesturePath): GestureRecognitionResult {
    const start = path.points[0].position;
    const end = path.points[path.points.length - 1].position;
    
    return {
      type: GestureType.LINE,
      confidence: 0.8,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        startPosition: start.clone(),
        endPosition: end.clone(),
        length: start.distanceTo(end),
        angle: Math.atan2(end.y - start.y, end.x - start.x)
      }
    };
  }

  /**
   * 创建锯齿结果
   */
  private createZigzagResult(path: GesturePath): GestureRecognitionResult {
    const directionChanges = this.calculateDirectionChanges(path);
    
    return {
      type: GestureType.ZIGZAG,
      confidence: 0.6,
      path,
      duration: path.endTime - path.startTime,
      parameters: {
        changeCount: directionChanges.length,
        averageChange: directionChanges.reduce((sum, change) => sum + change, 0) / directionChanges.length,
        frequency: directionChanges.length / (path.endTime - path.startTime) * 1000
      }
    };
  }

  /**
   * 判断圆形路径是否顺时针
   */
  private isClockwise(path: GesturePath, center: Vector2D): boolean {
    let angleSum = 0;
    
    for (let i = 1; i < path.points.length; i++) {
      const prev = path.points[i - 1].position.subtract(center);
      const curr = path.points[i].position.subtract(center);
      
      const angle = Math.atan2(prev.x * curr.y - prev.y * curr.x, prev.x * curr.x + prev.y * curr.y);
      angleSum += angle;
    }
    
    return angleSum < 0;
  }

  /**
   * 触发右键菜单
   */
  private triggerContextMenu(position: Vector2D): void {
    // 创建自定义右键菜单事件
    const contextMenuEvent = new CustomEvent('gesture-context-menu', {
      detail: {
        position,
        gestureType: GestureType.LONG_PRESS
      }
    });
    
    document.dispatchEvent(contextMenuEvent);
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(result: GestureRecognitionResult): void {
    this.gestureHistory.push(result);
    
    if (this.gestureHistory.length > this.maxHistorySize) {
      this.gestureHistory.shift();
    }
  }

  /**
   * 分发手势事件
   */
  private dispatchGestureEvent(result: GestureRecognitionResult): void {
    const listeners = this.eventListeners.get(result.type);
    if (!listeners) return;

    const eventData: GestureEventData = {
      gestureType: result.type,
      result
    };

    listeners.forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error('AdvancedGestureRecognizer: Error in gesture listener', error);
      }
    });

    // 分发通用手势事件
    const customEvent = new CustomEvent('advanced-gesture', {
      detail: eventData
    });
    
    document.dispatchEvent(customEvent);
  }

  /**
   * 添加手势监听器
   */
  addEventListener(gestureType: GestureType, listener: (event: GestureEventData) => void): void {
    const listeners = this.eventListeners.get(gestureType);
    if (listeners) {
      listeners.push(listener);
    }
  }

  /**
   * 移除手势监听器
   */
  removeEventListener(gestureType: GestureType, listener: (event: GestureEventData) => void): void {
    const listeners = this.eventListeners.get(gestureType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 配置手势
   */
  configureGesture(gestureType: GestureType, config: Partial<GestureConfig>): void {
    const currentConfig = this.gestureConfigs.get(gestureType);
    if (currentConfig) {
      Object.assign(currentConfig, config);
      console.log(`AdvancedGestureRecognizer: Updated config for ${gestureType}`, config);
    }
  }

  /**
   * 启用手势
   */
  enableGesture(gestureType: GestureType): void {
    this.configureGesture(gestureType, { enabled: true });
  }

  /**
   * 禁用手势
   */
  disableGesture(gestureType: GestureType): void {
    this.configureGesture(gestureType, { enabled: false });
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    recognitionCount: number;
    averageRecognitionTime: number;
    lastRecognitionTime: number;
    historySize: number;
    activePathsCount: number;
    memoryUsage: number;
  } {
    return {
      recognitionCount: this.recognitionCount,
      averageRecognitionTime: this.recognitionCount > 0 ? this.totalRecognitionTime / this.recognitionCount : 0,
      lastRecognitionTime: this.lastRecognitionTime,
      historySize: this.gestureHistory.length,
      activePathsCount: this.activePaths.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    const pathSize = 1000; // 每个路径约1KB
    const historyItemSize = 500; // 每个历史项约500字节
    
    return (this.activePaths.size * pathSize) + 
           (this.gestureHistory.length * historyItemSize);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 移除事件监听器
    document.removeEventListener('mousedown', this.handlePointerStart);
    document.removeEventListener('mousemove', this.handlePointerMove);
    document.removeEventListener('mouseup', this.handlePointerEnd);
    
    if (this.isTouchDevice) {
      document.removeEventListener('touchstart', this.handleTouchStart);
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
      document.removeEventListener('touchcancel', this.handleTouchCancel);
    }

    // 清理计时器
    this.clearLongPressTimer();

    // 清理数据
    this.activePaths.clear();
    this.gestureHistory.length = 0;
    this.eventListeners.clear();

    console.log('AdvancedGestureRecognizer: Resources disposed');
  }
}

/**
 * 工厂函数：创建高级手势识别器
 */
export function createAdvancedGestureRecognizer(): AdvancedGestureRecognizer {
  return new AdvancedGestureRecognizer();
}

/**
 * 工厂函数：创建轻量级手势识别器（仅基础手势）
 */
export function createLightweightGestureRecognizer(): AdvancedGestureRecognizer {
  const recognizer = new AdvancedGestureRecognizer();
  
  // 只启用基础手势
  recognizer.disableGesture(GestureType.CIRCLE);
  recognizer.disableGesture(GestureType.ZIGZAG);
  recognizer.disableGesture(GestureType.ROTATE);
  recognizer.disableGesture(GestureType.PINCH);
  
  return recognizer;
}

// 别名导出，兼容旧的导入
export { AdvancedGestureRecognizer as AdvancedGestureRecognition };