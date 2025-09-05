/**
 * 高精度坐标系统变换工具
 * 支持屏幕坐标 -> SVG坐标 -> 画布坐标 -> 节点坐标的多层级变换
 */

import { Vector2D, Matrix2D, PRECISION, preciseRound, MathUtils } from './math-precision';

// 重新导出常用类型
export { Vector2D, Matrix2D } from './math-precision';

// 坐标变换配置
export interface TransformConfig {
  zoom: number;              // 缩放级别
  panX: number;             // 平移X
  panY: number;             // 平移Y
  rotation: number;         // 旋转角度 (弧度)
  devicePixelRatio: number; // 设备像素比
  viewportWidth: number;    // 视口宽度
  viewportHeight: number;   // 视口高度
  canvasWidth: number;      // 画布宽度
  canvasHeight: number;     // 画布高度
}

// 坐标变换上下文
export interface TransformContext {
  config: TransformConfig;
  screenToSVG: Matrix2D;    // 屏幕到SVG变换矩阵
  svgToCanvas: Matrix2D;    // SVG到画布变换矩阵
  canvasToNode: Matrix2D;   // 画布到节点变换矩阵
  inverseMatrices: {
    svgToScreen: Matrix2D;
    canvasToSVG: Matrix2D;
    nodeToCanvas: Matrix2D;
  };
}

/**
 * 高精度坐标变换器
 */
export class PreciseCoordinateTransform {
  private context: TransformContext;
  private lastUpdateTime: number = 0;
  private isDirty: boolean = true;

  constructor(config: TransformConfig) {
    this.context = {
      config: { ...config },
      screenToSVG: Matrix2D.identity(),
      svgToCanvas: Matrix2D.identity(),
      canvasToNode: Matrix2D.identity(),
      inverseMatrices: {
        svgToScreen: Matrix2D.identity(),
        canvasToSVG: Matrix2D.identity(),
        nodeToCanvas: Matrix2D.identity()
      }
    };
    
    this.updateTransformMatrices();
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<TransformConfig>): void {
    const oldConfig = { ...this.context.config };
    Object.assign(this.context.config, updates);
    
    // 检查是否需要更新矩阵
    if (this.hasSignificantChange(oldConfig, this.context.config)) {
      this.isDirty = true;
      this.updateTransformMatrices();
    }
  }

  /**
   * 检查是否有显著变化
   */
  private hasSignificantChange(oldConfig: TransformConfig, newConfig: TransformConfig): boolean {
    const keys: (keyof TransformConfig)[] = ['zoom', 'panX', 'panY', 'rotation', 'devicePixelRatio'];
    return keys.some(key => 
      Math.abs(oldConfig[key] - newConfig[key]) > PRECISION.SUB_PIXEL
    );
  }

  /**
   * 更新所有变换矩阵
   */
  private updateTransformMatrices(): void {
    if (!this.isDirty) return;

    const config = this.context.config;
    const now = performance.now();
    
    // 1. 屏幕到SVG变换 (考虑设备像素比和视口)
    this.context.screenToSVG = Matrix2D.identity()
      .scale(1 / config.devicePixelRatio)
      .translate(-config.viewportWidth / 2, -config.viewportHeight / 2)
      .scale(1, -1); // SVG坐标系Y轴向上

    // 2. SVG到画布变换 (包含缩放、平移、旋转)
    this.context.svgToCanvas = Matrix2D.identity()
      .translate(-config.panX, -config.panY)
      .scale(1 / config.zoom)
      .rotate(-config.rotation);

    // 3. 画布到节点变换 (节点本地变换)
    this.context.canvasToNode = Matrix2D.identity(); // 默认为单位矩阵，可根据节点需要调整

    // 4. 计算逆矩阵用于反向变换
    try {
      this.context.inverseMatrices.svgToScreen = this.context.screenToSVG.invert();
      this.context.inverseMatrices.canvasToSVG = this.context.svgToCanvas.invert();
      this.context.inverseMatrices.nodeToCanvas = this.context.canvasToNode.invert();
    } catch (error) {
      console.error('Failed to calculate inverse matrices:', error);
      // 回退到单位矩阵
      this.context.inverseMatrices.svgToScreen = Matrix2D.identity();
      this.context.inverseMatrices.canvasToSVG = Matrix2D.identity();
      this.context.inverseMatrices.nodeToCanvas = Matrix2D.identity();
    }

    this.isDirty = false;
    this.lastUpdateTime = now;
  }

  /**
   * 屏幕坐标转换为SVG坐标
   */
  screenToSVG(screenPoint: Vector2D): Vector2D {
    this.updateTransformMatrices();
    return this.context.screenToSVG.transform(screenPoint);
  }

  /**
   * SVG坐标转换为屏幕坐标
   */
  svgToScreen(svgPoint: Vector2D): Vector2D {
    this.updateTransformMatrices();
    return this.context.inverseMatrices.svgToScreen.transform(svgPoint);
  }

  /**
   * SVG坐标转换为画布坐标
   */
  svgToCanvas(svgPoint: Vector2D): Vector2D {
    this.updateTransformMatrices();
    return this.context.svgToCanvas.transform(svgPoint);
  }

  /**
   * 画布坐标转换为SVG坐标
   */
  canvasToSVG(canvasPoint: Vector2D): Vector2D {
    this.updateTransformMatrices();
    return this.context.inverseMatrices.canvasToSVG.transform(canvasPoint);
  }

  /**
   * 屏幕坐标直接转换为画布坐标 (最常用)
   */
  screenToCanvas(screenPoint: Vector2D): Vector2D {
    const svgPoint = this.screenToSVG(screenPoint);
    return this.svgToCanvas(svgPoint);
  }

  /**
   * 画布坐标直接转换为屏幕坐标
   */
  canvasToScreen(canvasPoint: Vector2D): Vector2D {
    const svgPoint = this.canvasToSVG(canvasPoint);
    return this.svgToScreen(svgPoint);
  }

  /**
   * 获取当前变换信息
   */
  getTransformInfo(): TransformContext {
    this.updateTransformMatrices();
    return JSON.parse(JSON.stringify(this.context)); // 深拷贝
  }

  /**
   * 获取有效缩放范围内的缩放值
   */
  static clampZoom(zoom: number, min = 0.1, max = 10): number {
    return MathUtils.clamp(zoom, min, max);
  }

  /**
   * 获取有效旋转角度 (标准化到 [-π, π])
   */
  static normalizeRotation(rotation: number): number {
    while (rotation > Math.PI) rotation -= 2 * Math.PI;
    while (rotation < -Math.PI) rotation += 2 * Math.PI;
    return rotation;
  }
}

/**
 * 拖拽坐标计算器
 * 专门处理拖拽过程中的高精度坐标计算
 */
export class DragCoordinateCalculator {
  private transform: PreciseCoordinateTransform;
  private dragStart: {
    screenPosition: Vector2D;
    nodePosition: Vector2D;
    offset: Vector2D;
    timestamp: number;
  } | null = null;

  constructor(transform: PreciseCoordinateTransform) {
    this.transform = transform;
  }

  /**
   * 开始拖拽计算
   */
  startDrag(screenPosition: Vector2D, nodePosition: Vector2D): void {
    // 计算屏幕位置到画布坐标
    const canvasPosition = this.transform.screenToCanvas(screenPosition);
    
    // 计算鼠标相对于节点的偏移
    const offset = canvasPosition.subtract(nodePosition);

    this.dragStart = {
      screenPosition: screenPosition.clone(),
      nodePosition: nodePosition.clone(),
      offset,
      timestamp: performance.now()
    };
  }

  /**
   * 计算拖拽过程中的节点位置
   */
  calculateDragPosition(currentScreenPosition: Vector2D): Vector2D {
    if (!this.dragStart) {
      throw new Error('Drag not started. Call startDrag() first.');
    }

    // 将当前屏幕位置转换为画布坐标
    const currentCanvasPosition = this.transform.screenToCanvas(currentScreenPosition);
    
    // 减去初始偏移得到新的节点位置
    const newNodePosition = currentCanvasPosition.subtract(this.dragStart.offset);
    
    // 应用亚像素精度
    return new Vector2D(
      preciseRound(newNodePosition.x, 3),
      preciseRound(newNodePosition.y, 3)
    );
  }

  /**
   * 结束拖拽
   */
  endDrag(): Vector2D | null {
    if (!this.dragStart) {
      return null;
    }

    const duration = performance.now() - this.dragStart.timestamp;
    const finalPosition = this.dragStart.nodePosition.clone();
    
    this.dragStart = null;
    
    return finalPosition;
  }

  /**
   * 获取拖拽信息
   */
  getDragInfo(): {
    isDragging: boolean;
    duration: number;
    displacement: Vector2D;
    velocity: Vector2D;
  } {
    if (!this.dragStart) {
      return {
        isDragging: false,
        duration: 0,
        displacement: Vector2D.zero(),
        velocity: Vector2D.zero()
      };
    }

    const duration = performance.now() - this.dragStart.timestamp;
    const displacement = Vector2D.zero(); // 可以根据需要计算实际位移
    const velocity = duration > 0 ? displacement.divide(duration) : Vector2D.zero();

    return {
      isDragging: true,
      duration,
      displacement,
      velocity
    };
  }
}

/**
 * 边界检测和约束
 */
export class BoundaryConstraint {
  private bounds: { min: Vector2D; max: Vector2D };
  private margin: number;
  private elasticity: number; // 弹性系数 [0, 1]

  constructor(
    bounds: { min: Vector2D; max: Vector2D },
    margin = 0,
    elasticity = 0.2
  ) {
    this.bounds = {
      min: bounds.min.clone(),
      max: bounds.max.clone()
    };
    this.margin = margin;
    this.elasticity = MathUtils.clamp(elasticity, 0, 1);
  }

  /**
   * 应用边界约束
   */
  constrainPosition(position: Vector2D, nodeSize: Vector2D = Vector2D.zero()): Vector2D {
    let constrainedPosition = position.clone();
    
    const minBound = this.bounds.min.add(new Vector2D(this.margin, this.margin));
    const maxBound = this.bounds.max.subtract(nodeSize).subtract(new Vector2D(this.margin, this.margin));

    // 硬边界约束
    constrainedPosition.x = MathUtils.clamp(constrainedPosition.x, minBound.x, maxBound.x);
    constrainedPosition.y = MathUtils.clamp(constrainedPosition.y, minBound.y, maxBound.y);

    return constrainedPosition;
  }

  /**
   * 柔性边界约束 (允许轻微越界但有阻力)
   */
  constrainPositionElastic(position: Vector2D, nodeSize: Vector2D = Vector2D.zero()): Vector2D {
    const minBound = this.bounds.min.add(new Vector2D(this.margin, this.margin));
    const maxBound = this.bounds.max.subtract(nodeSize).subtract(new Vector2D(this.margin, this.margin));

    let constrainedPosition = position.clone();

    // X轴弹性约束
    if (position.x < minBound.x) {
      const overflow = minBound.x - position.x;
      const resistance = 1 - Math.exp(-overflow * this.elasticity);
      constrainedPosition.x = minBound.x - overflow * (1 - resistance);
    } else if (position.x > maxBound.x) {
      const overflow = position.x - maxBound.x;
      const resistance = 1 - Math.exp(-overflow * this.elasticity);
      constrainedPosition.x = maxBound.x + overflow * (1 - resistance);
    }

    // Y轴弹性约束
    if (position.y < minBound.y) {
      const overflow = minBound.y - position.y;
      const resistance = 1 - Math.exp(-overflow * this.elasticity);
      constrainedPosition.y = minBound.y - overflow * (1 - resistance);
    } else if (position.y > maxBound.y) {
      const overflow = position.y - maxBound.y;
      const resistance = 1 - Math.exp(-overflow * this.elasticity);
      constrainedPosition.y = maxBound.y + overflow * (1 - resistance);
    }

    return constrainedPosition;
  }

  /**
   * 检查位置是否在边界内
   */
  isWithinBounds(position: Vector2D, nodeSize: Vector2D = Vector2D.zero()): boolean {
    const minBound = this.bounds.min.add(new Vector2D(this.margin, this.margin));
    const maxBound = this.bounds.max.subtract(nodeSize).subtract(new Vector2D(this.margin, this.margin));

    return position.x >= minBound.x && position.x <= maxBound.x &&
           position.y >= minBound.y && position.y <= maxBound.y;
  }

  /**
   * 更新边界
   */
  updateBounds(bounds: { min: Vector2D; max: Vector2D }): void {
    this.bounds.min = bounds.min.clone();
    this.bounds.max = bounds.max.clone();
  }
}

/**
 * 网格对齐工具
 */
export class GridSnapper {
  private gridSize: Vector2D;
  private enabled: boolean;
  private threshold: number; // 对齐阈值

  constructor(gridSize: Vector2D, enabled = true, threshold = 10) {
    this.gridSize = gridSize.clone();
    this.enabled = enabled;
    this.threshold = threshold;
  }

  /**
   * 对齐到网格
   */
  snapToGrid(position: Vector2D): Vector2D {
    if (!this.enabled) {
      return position.clone();
    }

    const snappedX = Math.round(position.x / this.gridSize.x) * this.gridSize.x;
    const snappedY = Math.round(position.y / this.gridSize.y) * this.gridSize.y;

    const snappedPosition = new Vector2D(snappedX, snappedY);
    
    // 仅在距离足够近时才对齐
    if (position.distanceTo(snappedPosition) <= this.threshold) {
      return snappedPosition;
    }
    
    return position.clone();
  }

  /**
   * 获取最近的网格点
   */
  getNearestGridPoint(position: Vector2D): Vector2D {
    const gridX = Math.round(position.x / this.gridSize.x) * this.gridSize.x;
    const gridY = Math.round(position.y / this.gridSize.y) * this.gridSize.y;
    return new Vector2D(gridX, gridY);
  }

  /**
   * 获取网格线位置
   */
  getGridLines(bounds: { min: Vector2D; max: Vector2D }): { 
    vertical: number[]; 
    horizontal: number[]; 
  } {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    // 垂直线
    const startX = Math.floor(bounds.min.x / this.gridSize.x) * this.gridSize.x;
    for (let x = startX; x <= bounds.max.x; x += this.gridSize.x) {
      vertical.push(x);
    }

    // 水平线  
    const startY = Math.floor(bounds.min.y / this.gridSize.y) * this.gridSize.y;
    for (let y = startY; y <= bounds.max.y; y += this.gridSize.y) {
      horizontal.push(y);
    }

    return { vertical, horizontal };
  }

  /**
   * 设置网格大小
   */
  setGridSize(size: Vector2D): void {
    this.gridSize = size.clone();
  }

  /**
   * 启用/禁用网格对齐
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

/**
 * 工厂函数：创建标准的坐标变换器
 */
export function createStandardTransform(
  element: Element,
  zoom = 1,
  pan = Vector2D.zero(),
  rotation = 0
): PreciseCoordinateTransform {
  const rect = element.getBoundingClientRect();
  
  const config: TransformConfig = {
    zoom: PreciseCoordinateTransform.clampZoom(zoom),
    panX: pan.x,
    panY: pan.y,
    rotation: PreciseCoordinateTransform.normalizeRotation(rotation),
    devicePixelRatio: window.devicePixelRatio || 1,
    viewportWidth: rect.width,
    viewportHeight: rect.height,
    canvasWidth: rect.width,
    canvasHeight: rect.height
  };

  return new PreciseCoordinateTransform(config);
}

/**
 * 触控精度校准器
 * 专门处理触控设备的精度校准和优化
 */
export class TouchPrecisionCalibrator {
  private touchOffset = Vector2D.zero();
  private calibrationSamples: Vector2D[] = [];
  private devicePixelRatio: number;
  private touchRadius: number;
  
  constructor() {
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.touchRadius = this.detectTouchRadius();
  }
  
  /**
   * 检测触控半径
   */
  private detectTouchRadius(): number {
    // 基于设备类型估算平均触控半径
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad/.test(userAgent)) {
      return 12; // iOS设备通常有较小的触控半径
    } else if (/android/.test(userAgent)) {
      return 15; // Android设备触控半径稍大
    }
    return 10; // 默认值
  }
  
  /**
   * 校准触控位置
   * 调整触点位置以提高精度
   */
  calibrateTouchPosition(rawPosition: Vector2D, pressure = 0.5): Vector2D {
    let calibratedPosition = rawPosition.clone();
    
    // 1. 设备像素比校准
    if (this.devicePixelRatio !== 1) {
      calibratedPosition = calibratedPosition.multiply(this.devicePixelRatio);
    }
    
    // 2. 压力感应校准（如果支持）
    if (pressure > 0.1 && pressure < 1) {
      // 高压力时触点更精确，低压力时需要补偿
      const pressureOffset = (1 - pressure) * 2;
      calibratedPosition = calibratedPosition.add(
        this.touchOffset.multiply(pressureOffset)
      );
    }
    
    // 3. 触控半径补偿
    // 触控点通常在手指中心，而期望的是边缘位置
    const radiusCompensation = this.touchRadius * 0.3;
    calibratedPosition = calibratedPosition.subtract(
      new Vector2D(radiusCompensation, radiusCompensation)
    );
    
    // 4. 历史样本平滑
    this.addCalibrationSample(calibratedPosition);
    if (this.calibrationSamples.length > 3) {
      calibratedPosition = this.smoothTouchPosition();
    }
    
    return calibratedPosition;
  }
  
  /**
   * 添加校准样本
   */
  private addCalibrationSample(position: Vector2D): void {
    this.calibrationSamples.push(position);
    if (this.calibrationSamples.length > 5) {
      this.calibrationSamples.shift();
    }
  }
  
  /**
   * 平滑触控位置
   */
  private smoothTouchPosition(): Vector2D {
    if (this.calibrationSamples.length === 0) {
      return Vector2D.zero();
    }
    
    // 使用加权平均，最新的样本权重更大
    let weightedSum = Vector2D.zero();
    let totalWeight = 0;
    
    for (let i = 0; i < this.calibrationSamples.length; i++) {
      const weight = (i + 1) / this.calibrationSamples.length;
      weightedSum = weightedSum.add(this.calibrationSamples[i].multiply(weight));
      totalWeight += weight;
    }
    
    return weightedSum.divide(totalWeight);
  }
  
  /**
   * 设置全局触控偏移
   */
  setTouchOffset(offset: Vector2D): void {
    this.touchOffset = offset.clone();
  }
  
  /**
   * 重置校准数据
   */
  reset(): void {
    this.calibrationSamples = [];
    this.touchOffset = Vector2D.zero();
  }
  
  /**
   * 获取校准统计信息
   */
  getCalibrationStats(): {
    sampleCount: number;
    averagePosition: Vector2D;
    precision: number;
    touchRadius: number;
  } {
    const averagePosition = this.calibrationSamples.length > 0
      ? this.calibrationSamples.reduce((sum, pos) => sum.add(pos), Vector2D.zero())
          .divide(this.calibrationSamples.length)
      : Vector2D.zero();
    
    // 计算精度（方差的倒数）
    let variance = 0;
    if (this.calibrationSamples.length > 1) {
      for (const sample of this.calibrationSamples) {
        variance += sample.distanceToSquared(averagePosition);
      }
      variance /= this.calibrationSamples.length;
    }
    
    const precision = variance > 0 ? 1 / variance : Infinity;
    
    return {
      sampleCount: this.calibrationSamples.length,
      averagePosition,
      precision,
      touchRadius: this.touchRadius
    };
  }
}

/**
 * 触控感知的拖拽坐标计算器
 * 继承标准拖拽计算器并增加触控特定功能
 */
export class TouchAwareDragCalculator extends DragCoordinateCalculator {
  private touchCalibrator: TouchPrecisionCalibrator;
  private isTouchMode = false;
  private touchVelocityFilter: Vector2D[] = [];
  
  constructor(transform: PreciseCoordinateTransform) {
    super(transform);
    this.touchCalibrator = new TouchPrecisionCalibrator();
  }
  
  /**
   * 启用触控模式
   */
  enableTouchMode(): void {
    this.isTouchMode = true;
    console.log('TouchAwareDragCalculator: Touch mode enabled');
  }
  
  /**
   * 禁用触控模式
   */
  disableTouchMode(): void {
    this.isTouchMode = false;
    this.touchCalibrator.reset();
    this.touchVelocityFilter = [];
    console.log('TouchAwareDragCalculator: Touch mode disabled');
  }
  
  /**
   * 触控感知的拖拽开始
   */
  startTouchDrag(
    screenPosition: Vector2D, 
    nodePosition: Vector2D, 
    pressure = 0.5
  ): void {
    this.enableTouchMode();
    
    // 校准触控位置
    const calibratedPosition = this.touchCalibrator.calibrateTouchPosition(
      screenPosition, 
      pressure
    );
    
    // 使用校准后的位置启动拖拽
    this.startDrag(calibratedPosition, nodePosition);
  }
  
  /**
   * 触控感知的拖拽位置计算
   */
  calculateTouchDragPosition(
    currentScreenPosition: Vector2D, 
    pressure = 0.5,
    velocity = Vector2D.zero()
  ): Vector2D {
    if (!this.isTouchMode) {
      return this.calculateDragPosition(currentScreenPosition);
    }
    
    // 校准当前触控位置
    const calibratedPosition = this.touchCalibrator.calibrateTouchPosition(
      currentScreenPosition, 
      pressure
    );
    
    // 应用速度滤波
    const filteredPosition = this.applyVelocityFilter(calibratedPosition, velocity);
    
    // 使用校准后的位置计算拖拽
    return this.calculateDragPosition(filteredPosition);
  }
  
  /**
   * 应用速度滤波
   */
  private applyVelocityFilter(position: Vector2D, velocity: Vector2D): Vector2D {
    this.touchVelocityFilter.push(position);
    if (this.touchVelocityFilter.length > 3) {
      this.touchVelocityFilter.shift();
    }
    
    // 如果速度过高，使用平滑滤波
    const velocityMagnitude = velocity.length();
    if (velocityMagnitude > 1000) { // 1000 px/s
      // 高速移动时使用更多平滑
      return this.touchVelocityFilter
        .reduce((sum, pos) => sum.add(pos), Vector2D.zero())
        .divide(this.touchVelocityFilter.length);
    }
    
    return position;
  }
  
  /**
   * 获取触控校准统计
   */
  getTouchCalibrationStats() {
    return this.touchCalibrator.getCalibrationStats();
  }
  
  /**
   * 设置触控偏移校准
   */
  calibrateTouchOffset(offset: Vector2D): void {
    this.touchCalibrator.setTouchOffset(offset);
  }
}

/**
 * 工厂函数：从DOM元素创建拖拽计算器
 */
export function createDragCalculator(
  element: Element,
  zoom = 1,
  pan = Vector2D.zero()
): DragCoordinateCalculator {
  const transform = createStandardTransform(element, zoom, pan);
  return new DragCoordinateCalculator(transform);
}

/**
 * 工厂函数：创建触控感知的拖拽计算器
 */
export function createTouchAwareDragCalculator(
  element: Element,
  zoom = 1,
  pan = Vector2D.zero()
): TouchAwareDragCalculator {
  const transform = createStandardTransform(element, zoom, pan);
  return new TouchAwareDragCalculator(transform);
}