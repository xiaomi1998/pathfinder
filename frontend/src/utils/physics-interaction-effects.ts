/**
 * Agent 6: 物理引擎集成专家
 * 交互物理效果系统 - 拖拽惯性、抛掷效果和高级物理交互
 * 
 * 特性：
 * - 拖拽时的物理惯性和动量保持
 * - 抛掷和滑动效果模拟
 * - 边界反弹和缓冲效果
 * - 磁场力和引力模拟
 * - 流体动力学效果
 * - 物理约束链
 */

import { Vector2D, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { PhysicsEngine2D, RigidBodyDef, ConstraintDef } from './physics-engine-core';
import { PhysicsSpringAnimation, SpringAnimationConfig } from './spring-animation-system';
import { EnhancedCollisionSystem } from './enhanced-collision-system';

// 拖拽物理配置
export interface DragPhysicsConfig {
  // 惯性设置
  inertiaEnabled: boolean;          // 启用惯性
  momentumPreservation: number;     // 动量保持系数 [0, 1]
  dampingFactor: number;           // 阻尼系数
  
  // 拖拽响应
  dragSensitivity: number;         // 拖拽灵敏度
  maxDragSpeed: number;            // 最大拖拽速度
  smoothingFactor: number;         // 平滑系数
  
  // 释放效果
  throwEnabled: boolean;           // 启用抛掷效果
  throwMultiplier: number;         // 抛掷速度倍增器
  throwDecay: number;              // 抛掷衰减率
  
  // 边界行为
  boundaryBehavior: 'bounce' | 'absorb' | 'wrap' | 'elastic';
  bounceRestitution: number;       // 反弹恢复系数
  boundaryPadding: number;         // 边界填充
}

// 抛掷状态
export interface ThrowState {
  velocity: Vector2D;
  acceleration: Vector2D;
  startTime: number;
  duration: number;
  isActive: boolean;
}

// 磁场配置
export interface MagneticFieldConfig {
  enabled: boolean;
  strength: number;                // 磁场强度
  range: number;                   // 影响范围
  falloffType: 'linear' | 'quadratic' | 'exponential';
  polarity: 'attractive' | 'repulsive';
  
  // 可视化
  showFieldLines: boolean;
  fieldLineCount: number;
  fieldColor: string;
  fieldOpacity: number;
}

// 流体效果配置
export interface FluidEffectConfig {
  enabled: boolean;
  viscosity: number;               // 粘度
  density: number;                 // 密度
  buoyancy: number;               // 浮力
  turbulence: number;             // 湍流强度
  
  // 表面张力
  surfaceTension: number;
  waveAmplitude: number;
  waveFrequency: number;
}

// 物理交互对象
export interface PhysicsInteractionObject {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  mass: number;
  
  // 拖拽状态
  isDragging: boolean;
  dragStartPosition: Vector2D;
  dragStartTime: number;
  lastDragPosition: Vector2D;
  dragVelocityHistory: Vector2D[];
  
  // 抛掷状态
  throwState: ThrowState;
  
  // 物理属性
  friction: number;
  restitution: number;
  magneticSusceptibility: number; // 磁化率
  
  // 约束
  constraints: PhysicsConstraint[];
  
  // 回调
  onUpdate?: (object: PhysicsInteractionObject) => void;
  onCollision?: (other: PhysicsInteractionObject) => void;
  onBoundaryHit?: (side: string, position: Vector2D) => void;
}

// 物理约束
export interface PhysicsConstraint {
  type: 'distance' | 'angle' | 'rope' | 'chain' | 'spring';
  targetId?: string;               // 约束目标ID
  anchorPoint?: Vector2D;          // 锚点
  parameters: Record<string, number>;
}

// 磁场源
export interface MagneticFieldSource {
  id: string;
  position: Vector2D;
  config: MagneticFieldConfig;
  isActive: boolean;
}

// 边界定义
export interface PhysicsBoundary {
  id: string;
  type: 'rectangle' | 'circle' | 'polygon';
  bounds: any;                     // 根据type确定具体结构
  behavior: 'bounce' | 'absorb' | 'wrap';
  restitution: number;
}

/**
 * 拖拽物理控制器
 */
export class DragPhysicsController {
  private object: PhysicsInteractionObject;
  private config: DragPhysicsConfig;
  private velocityFilter: Vector2D[] = [];
  private lastUpdateTime = 0;
  
  constructor(object: PhysicsInteractionObject, config: DragPhysicsConfig) {
    this.object = object;
    this.config = config;
  }
  
  /**
   * 开始拖拽
   */
  startDrag(position: Vector2D): void {
    this.object.isDragging = true;
    this.object.dragStartPosition = position.clone();
    this.object.dragStartTime = performance.now();
    this.object.lastDragPosition = position.clone();
    this.object.dragVelocityHistory = [];
    this.velocityFilter = [];
    
    // 停止任何现有的抛掷效果
    this.object.throwState.isActive = false;
  }
  
  /**
   * 更新拖拽
   */
  updateDrag(currentPosition: Vector2D, deltaTime: number): void {
    if (!this.object.isDragging) return;
    
    const now = performance.now();
    
    // 计算拖拽速度
    const displacement = currentPosition.subtract(this.object.lastDragPosition);
    const instantVelocity = displacement.divide(deltaTime);
    
    // 应用拖拽灵敏度
    const adjustedDisplacement = displacement.multiply(this.config.dragSensitivity);
    
    // 限制最大拖拽速度
    const clampedVelocity = this.clampVelocity(instantVelocity, this.config.maxDragSpeed);
    
    // 平滑处理
    const smoothedVelocity = this.smoothVelocity(clampedVelocity);
    
    // 更新对象状态
    this.object.position = this.object.position.add(adjustedDisplacement);
    this.object.velocity = smoothedVelocity;
    
    // 记录速度历史用于抛掷计算
    this.object.dragVelocityHistory.push(clampedVelocity);
    if (this.object.dragVelocityHistory.length > 10) {
      this.object.dragVelocityHistory.shift();
    }
    
    this.object.lastDragPosition = currentPosition.clone();
    this.lastUpdateTime = now;
    
    // 触发更新回调
    if (this.object.onUpdate) {
      this.object.onUpdate(this.object);
    }
  }
  
  /**
   * 结束拖拽
   */
  endDrag(): void {
    if (!this.object.isDragging) return;
    
    this.object.isDragging = false;
    
    // 如果启用抛掷效果，计算初始抛掷速度
    if (this.config.throwEnabled) {
      const throwVelocity = this.calculateThrowVelocity();
      this.startThrow(throwVelocity);
    } else if (this.config.inertiaEnabled) {
      // 保持惯性
      this.object.velocity = this.object.velocity.multiply(this.config.momentumPreservation);
    } else {
      // 立即停止
      this.object.velocity = Vector2D.zero();
    }
  }
  
  /**
   * 计算抛掷速度
   */
  private calculateThrowVelocity(): Vector2D {
    if (this.object.dragVelocityHistory.length === 0) {
      return Vector2D.zero();
    }
    
    // 使用最近几个速度样本的加权平均
    let weightedVelocity = Vector2D.zero();
    let totalWeight = 0;
    
    const historyLength = this.object.dragVelocityHistory.length;
    for (let i = 0; i < historyLength; i++) {
      const weight = (i + 1) / historyLength; // 最新的样本权重更大
      weightedVelocity = weightedVelocity.add(
        this.object.dragVelocityHistory[i].multiply(weight)
      );
      totalWeight += weight;
    }
    
    const averageVelocity = weightedVelocity.divide(totalWeight);
    return averageVelocity.multiply(this.config.throwMultiplier);
  }
  
  /**
   * 开始抛掷效果
   */
  private startThrow(velocity: Vector2D): void {
    this.object.throwState = {
      velocity: velocity.clone(),
      acceleration: Vector2D.zero(),
      startTime: performance.now(),
      duration: velocity.length() / this.config.throwDecay, // 基于速度计算持续时间
      isActive: true
    };
    
    this.object.velocity = velocity;
  }
  
  /**
   * 更新抛掷效果
   */
  updateThrow(deltaTime: number): void {
    if (!this.object.throwState.isActive) return;
    
    const elapsed = performance.now() - this.object.throwState.startTime;
    
    if (elapsed >= this.object.throwState.duration) {
      this.object.throwState.isActive = false;
      return;
    }
    
    // 计算衰减因子
    const progress = elapsed / this.object.throwState.duration;
    const decayFactor = Math.pow(1 - progress, 2); // 二次衰减
    
    // 应用阻尼
    this.object.velocity = this.object.velocity.multiply(1 - this.config.throwDecay * deltaTime);
    
    // 更新位置
    this.object.position = this.object.position.add(
      this.object.velocity.multiply(deltaTime * decayFactor)
    );
    
    // 检查是否速度过小，提前结束
    if (this.object.velocity.length() < 1) {
      this.object.throwState.isActive = false;
      this.object.velocity = Vector2D.zero();
    }
    
    if (this.object.onUpdate) {
      this.object.onUpdate(this.object);
    }
  }
  
  /**
   * 速度限制
   */
  private clampVelocity(velocity: Vector2D, maxSpeed: number): Vector2D {
    const speed = velocity.length();
    if (speed > maxSpeed) {
      return velocity.normalize().multiply(maxSpeed);
    }
    return velocity;
  }
  
  /**
   * 速度平滑
   */
  private smoothVelocity(velocity: Vector2D): Vector2D {
    this.velocityFilter.push(velocity);
    if (this.velocityFilter.length > 5) {
      this.velocityFilter.shift();
    }
    
    // 加权平均平滑
    let smoothed = Vector2D.zero();
    let totalWeight = 0;
    
    for (let i = 0; i < this.velocityFilter.length; i++) {
      const weight = (i + 1) / this.velocityFilter.length;
      smoothed = smoothed.add(this.velocityFilter[i].multiply(weight));
      totalWeight += weight;
    }
    
    return smoothed.divide(totalWeight);
  }
}

/**
 * 磁场力系统
 */
export class MagneticFieldSystem {
  private sources: Map<string, MagneticFieldSource> = new Map();
  
  /**
   * 添加磁场源
   */
  addSource(id: string, position: Vector2D, config: MagneticFieldConfig): void {
    this.sources.set(id, {
      id,
      position: position.clone(),
      config: { ...config },
      isActive: true
    });
  }
  
  /**
   * 移除磁场源
   */
  removeSource(id: string): void {
    this.sources.delete(id);
  }
  
  /**
   * 更新磁场源位置
   */
  updateSourcePosition(id: string, position: Vector2D): void {
    const source = this.sources.get(id);
    if (source) {
      source.position = position.clone();
    }
  }
  
  /**
   * 计算磁场力
   */
  calculateMagneticForce(object: PhysicsInteractionObject): Vector2D {
    let totalForce = Vector2D.zero();
    
    for (const source of this.sources.values()) {
      if (!source.isActive || !source.config.enabled) continue;
      
      const distance = object.position.distanceTo(source.position);
      
      // 检查是否在影响范围内
      if (distance > source.config.range || distance < PRECISION.EPSILON) continue;
      
      // 计算方向
      const direction = source.config.polarity === 'attractive'
        ? source.position.subtract(object.position).normalize()
        : object.position.subtract(source.position).normalize();
      
      // 计算力的大小
      let forceMagnitude: number;
      const normalizedDistance = distance / source.config.range;
      
      switch (source.config.falloffType) {
        case 'linear':
          forceMagnitude = source.config.strength * (1 - normalizedDistance);
          break;
          
        case 'quadratic':
          forceMagnitude = source.config.strength / (distance * distance + 1);
          break;
          
        case 'exponential':
          forceMagnitude = source.config.strength * Math.exp(-distance / source.config.range);
          break;
          
        default:
          forceMagnitude = source.config.strength / (distance + 1);
      }
      
      // 考虑物体的磁化率
      forceMagnitude *= object.magneticSusceptibility;
      
      const force = direction.multiply(forceMagnitude);
      totalForce = totalForce.add(force);
    }
    
    return totalForce;
  }
  
  /**
   * 生成磁场线用于可视化
   */
  generateFieldLines(source: MagneticFieldSource): Vector2D[][] {
    if (!source.config.showFieldLines) return [];
    
    const fieldLines: Vector2D[][] = [];
    const lineCount = source.config.fieldLineCount;
    const range = source.config.range;
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (2 * Math.PI * i) / lineCount;
      const startRadius = range * 0.1;
      const startPoint = source.position.add(
        new Vector2D(Math.cos(angle), Math.sin(angle)).multiply(startRadius)
      );
      
      const line = this.traceFieldLine(source, startPoint, 50);
      if (line.length > 1) {
        fieldLines.push(line);
      }
    }
    
    return fieldLines;
  }
  
  /**
   * 追踪磁场线
   */
  private traceFieldLine(source: MagneticFieldSource, startPoint: Vector2D, steps: number): Vector2D[] {
    const line: Vector2D[] = [startPoint];
    let currentPoint = startPoint.clone();
    
    for (let step = 0; step < steps; step++) {
      const distance = currentPoint.distanceTo(source.position);
      
      if (distance > source.config.range || distance < 5) break;
      
      const direction = source.config.polarity === 'attractive'
        ? source.position.subtract(currentPoint).normalize()
        : currentPoint.subtract(source.position).normalize();
      
      const stepSize = Math.min(5, source.config.range / 20);
      currentPoint = currentPoint.add(direction.multiply(stepSize));
      line.push(currentPoint.clone());
    }
    
    return line;
  }
}

/**
 * 边界反弹系统
 */
export class BoundaryBouncingSystem {
  private boundaries: Map<string, PhysicsBoundary> = new Map();
  
  /**
   * 添加边界
   */
  addBoundary(boundary: PhysicsBoundary): void {
    this.boundaries.set(boundary.id, boundary);
  }
  
  /**
   * 移除边界
   */
  removeBoundary(id: string): void {
    this.boundaries.delete(id);
  }
  
  /**
   * 检查边界碰撞并应用效果
   */
  checkBoundaryCollision(object: PhysicsInteractionObject): void {
    for (const boundary of this.boundaries.values()) {
      const collision = this.detectBoundaryCollision(object, boundary);
      
      if (collision) {
        this.handleBoundaryCollision(object, boundary, collision);
      }
    }
  }
  
  /**
   * 检测边界碰撞
   */
  private detectBoundaryCollision(
    object: PhysicsInteractionObject,
    boundary: PhysicsBoundary
  ): { normal: Vector2D; penetration: number; contactPoint: Vector2D } | null {
    
    switch (boundary.type) {
      case 'rectangle':
        return this.detectRectangleBoundaryCollision(object, boundary);
        
      case 'circle':
        return this.detectCircleBoundaryCollision(object, boundary);
        
      default:
        return null;
    }
  }
  
  /**
   * 矩形边界碰撞检测
   */
  private detectRectangleBoundaryCollision(
    object: PhysicsInteractionObject,
    boundary: PhysicsBoundary
  ): { normal: Vector2D; penetration: number; contactPoint: Vector2D } | null {
    
    const bounds = boundary.bounds as { min: Vector2D; max: Vector2D };
    const pos = object.position;
    
    let normal = Vector2D.zero();
    let penetration = 0;
    let contactPoint = pos.clone();
    
    // 检查X轴边界
    if (pos.x < bounds.min.x) {
      normal = new Vector2D(1, 0);
      penetration = bounds.min.x - pos.x;
      contactPoint = new Vector2D(bounds.min.x, pos.y);
    } else if (pos.x > bounds.max.x) {
      normal = new Vector2D(-1, 0);
      penetration = pos.x - bounds.max.x;
      contactPoint = new Vector2D(bounds.max.x, pos.y);
    }
    
    // 检查Y轴边界
    if (pos.y < bounds.min.y) {
      const yPenetration = bounds.min.y - pos.y;
      if (yPenetration > penetration) {
        normal = new Vector2D(0, 1);
        penetration = yPenetration;
        contactPoint = new Vector2D(pos.x, bounds.min.y);
      }
    } else if (pos.y > bounds.max.y) {
      const yPenetration = pos.y - bounds.max.y;
      if (yPenetration > penetration) {
        normal = new Vector2D(0, -1);
        penetration = yPenetration;
        contactPoint = new Vector2D(pos.x, bounds.max.y);
      }
    }
    
    return penetration > 0 ? { normal, penetration, contactPoint } : null;
  }
  
  /**
   * 圆形边界碰撞检测
   */
  private detectCircleBoundaryCollision(
    object: PhysicsInteractionObject,
    boundary: PhysicsBoundary
  ): { normal: Vector2D; penetration: number; contactPoint: Vector2D } | null {
    
    const bounds = boundary.bounds as { center: Vector2D; radius: number };
    const delta = object.position.subtract(bounds.center);
    const distance = delta.length();
    
    if (distance >= bounds.radius) {
      return null;
    }
    
    const normal = distance > 0 ? delta.normalize() : new Vector2D(1, 0);
    const penetration = bounds.radius - distance;
    const contactPoint = bounds.center.add(normal.multiply(bounds.radius));
    
    return { normal, penetration, contactPoint };
  }
  
  /**
   * 处理边界碰撞
   */
  private handleBoundaryCollision(
    object: PhysicsInteractionObject,
    boundary: PhysicsBoundary,
    collision: { normal: Vector2D; penetration: number; contactPoint: Vector2D }
  ): void {
    
    switch (boundary.behavior) {
      case 'bounce':
        this.applyBounce(object, collision, boundary.restitution);
        break;
        
      case 'absorb':
        this.applyAbsorption(object, collision);
        break;
        
      case 'wrap':
        this.applyWrapping(object, boundary);
        break;
    }
    
    // 触发边界碰撞回调
    if (object.onBoundaryHit) {
      const side = this.getBoundarySide(collision.normal);
      object.onBoundaryHit(side, collision.contactPoint);
    }
  }
  
  /**
   * 应用反弹效果
   */
  private applyBounce(
    object: PhysicsInteractionObject,
    collision: { normal: Vector2D; penetration: number; contactPoint: Vector2D },
    restitution: number
  ): void {
    // 位置修正
    object.position = object.position.add(collision.normal.multiply(collision.penetration));
    
    // 速度反射
    const normalVelocity = object.velocity.dot(collision.normal);
    if (normalVelocity < 0) { // 只有朝向边界的速度才反射
      const reflectedNormal = collision.normal.multiply(normalVelocity * (1 + restitution));
      object.velocity = object.velocity.subtract(reflectedNormal);
    }
  }
  
  /**
   * 应用吸收效果
   */
  private applyAbsorption(
    object: PhysicsInteractionObject,
    collision: { normal: Vector2D; penetration: number; contactPoint: Vector2D }
  ): void {
    // 位置修正
    object.position = object.position.add(collision.normal.multiply(collision.penetration));
    
    // 速度衰减
    const normalVelocity = object.velocity.dot(collision.normal);
    if (normalVelocity < 0) {
      object.velocity = object.velocity.subtract(collision.normal.multiply(normalVelocity));
    }
    
    // 整体速度衰减
    object.velocity = object.velocity.multiply(0.8);
  }
  
  /**
   * 应用包装效果（传送门效果）
   */
  private applyWrapping(object: PhysicsInteractionObject, boundary: PhysicsBoundary): void {
    if (boundary.type !== 'rectangle') return;
    
    const bounds = boundary.bounds as { min: Vector2D; max: Vector2D };
    const pos = object.position;
    
    if (pos.x < bounds.min.x) {
      object.position.x = bounds.max.x;
    } else if (pos.x > bounds.max.x) {
      object.position.x = bounds.min.x;
    }
    
    if (pos.y < bounds.min.y) {
      object.position.y = bounds.max.y;
    } else if (pos.y > bounds.max.y) {
      object.position.y = bounds.min.y;
    }
  }
  
  /**
   * 获取边界侧面
   */
  private getBoundarySide(normal: Vector2D): string {
    const threshold = 0.707; // 45度
    
    if (Math.abs(normal.x) > threshold) {
      return normal.x > 0 ? 'left' : 'right';
    } else {
      return normal.y > 0 ? 'bottom' : 'top';
    }
  }
}

/**
 * 物理交互效果管理器
 */
export class PhysicsInteractionEffectsManager {
  private objects: Map<string, PhysicsInteractionObject> = new Map();
  private dragControllers: Map<string, DragPhysicsController> = new Map();
  private magneticField: MagneticFieldSystem;
  private boundarySystem: BoundaryBouncingSystem;
  
  // 配置
  private globalConfig = {
    gravity: new Vector2D(0, 0),
    airDamping: 0.02,
    updateFrequency: 60
  };
  
  // 性能统计
  private stats = {
    objectCount: 0,
    activeThrows: 0,
    activeDrags: 0,
    averageUpdateTime: 0
  };
  
  constructor() {
    this.magneticField = new MagneticFieldSystem();
    this.boundarySystem = new BoundaryBouncingSystem();
    
    console.log('PhysicsInteractionEffectsManager: Initialized with advanced physics effects');
  }
  
  /**
   * 添加物理交互对象
   */
  addObject(
    id: string,
    position: Vector2D,
    config: Partial<PhysicsInteractionObject> = {}
  ): PhysicsInteractionObject {
    const object: PhysicsInteractionObject = {
      id,
      position: position.clone(),
      velocity: Vector2D.zero(),
      acceleration: Vector2D.zero(),
      mass: 1,
      
      isDragging: false,
      dragStartPosition: Vector2D.zero(),
      dragStartTime: 0,
      lastDragPosition: Vector2D.zero(),
      dragVelocityHistory: [],
      
      throwState: {
        velocity: Vector2D.zero(),
        acceleration: Vector2D.zero(),
        startTime: 0,
        duration: 0,
        isActive: false
      },
      
      friction: 0.1,
      restitution: 0.5,
      magneticSusceptibility: 1.0,
      constraints: [],
      
      ...config
    };
    
    this.objects.set(id, object);
    
    console.log(`PhysicsInteractionEffectsManager: Added object ${id}`);
    return object;
  }
  
  /**
   * 移除物理交互对象
   */
  removeObject(id: string): void {
    this.objects.delete(id);
    this.dragControllers.delete(id);
  }
  
  /**
   * 获取物理交互对象
   */
  getObject(id: string): PhysicsInteractionObject | undefined {
    return this.objects.get(id);
  }
  
  /**
   * 开始拖拽
   */
  startDrag(
    objectId: string,
    position: Vector2D,
    config: DragPhysicsConfig = this.getDefaultDragConfig()
  ): void {
    const object = this.objects.get(objectId);
    if (!object) return;
    
    let controller = this.dragControllers.get(objectId);
    if (!controller) {
      controller = new DragPhysicsController(object, config);
      this.dragControllers.set(objectId, controller);
    }
    
    controller.startDrag(position);
  }
  
  /**
   * 更新拖拽
   */
  updateDrag(objectId: string, position: Vector2D, deltaTime: number): void {
    const controller = this.dragControllers.get(objectId);
    if (controller) {
      controller.updateDrag(position, deltaTime);
    }
  }
  
  /**
   * 结束拖拽
   */
  endDrag(objectId: string): void {
    const controller = this.dragControllers.get(objectId);
    if (controller) {
      controller.endDrag();
    }
  }
  
  /**
   * 添加磁场源
   */
  addMagneticSource(
    id: string,
    position: Vector2D,
    config: MagneticFieldConfig = this.getDefaultMagneticConfig()
  ): void {
    this.magneticField.addSource(id, position, config);
  }
  
  /**
   * 添加边界
   */
  addBoundary(boundary: PhysicsBoundary): void {
    this.boundarySystem.addBoundary(boundary);
  }
  
  /**
   * 物理步进更新
   */
  step(deltaTime: number): void {
    const startTime = performance.now();
    
    let activeThrows = 0;
    let activeDrags = 0;
    
    for (const object of this.objects.values()) {
      // 更新拖拽状态
      if (object.isDragging) {
        activeDrags++;
        continue; // 拖拽中的对象由拖拽控制器处理
      }
      
      // 更新抛掷状态
      const controller = this.dragControllers.get(object.id);
      if (controller && object.throwState.isActive) {
        controller.updateThrow(deltaTime);
        activeThrows++;
      }
      
      // 应用物理力
      this.applyPhysicsForces(object, deltaTime);
      
      // 边界检查
      this.boundarySystem.checkBoundaryCollision(object);
      
      // 更新位置和速度
      this.updateObjectPhysics(object, deltaTime);
    }
    
    // 更新统计
    this.stats.objectCount = this.objects.size;
    this.stats.activeThrows = activeThrows;
    this.stats.activeDrags = activeDrags;
    this.stats.averageUpdateTime = performance.now() - startTime;
  }
  
  /**
   * 应用物理力
   */
  private applyPhysicsForces(object: PhysicsInteractionObject, deltaTime: number): void {
    // 重力
    const gravity = this.globalConfig.gravity.multiply(object.mass);
    
    // 磁场力
    const magneticForce = this.magneticField.calculateMagneticForce(object);
    
    // 空气阻力
    const airResistance = object.velocity.multiply(-this.globalConfig.airDamping * object.velocity.length());
    
    // 摩擦力
    const friction = object.velocity.multiply(-object.friction * object.velocity.length());
    
    // 合力
    const totalForce = gravity.add(magneticForce).add(airResistance).add(friction);
    
    // 加速度 = F / m
    object.acceleration = totalForce.divide(object.mass);
  }
  
  /**
   * 更新对象物理状态
   */
  private updateObjectPhysics(object: PhysicsInteractionObject, deltaTime: number): void {
    // 积分速度
    object.velocity = object.velocity.add(object.acceleration.multiply(deltaTime));
    
    // 积分位置
    object.position = object.position.add(object.velocity.multiply(deltaTime));
    
    // 速度衰减
    const decay = 1 - (object.friction * deltaTime);
    object.velocity = object.velocity.multiply(decay);
    
    // 静止检测
    if (object.velocity.lengthSquared() < 0.01) {
      object.velocity = Vector2D.zero();
      object.acceleration = Vector2D.zero();
    }
    
    // 触发更新回调
    if (object.onUpdate) {
      object.onUpdate(object);
    }
  }
  
  /**
   * 获取默认拖拽配置
   */
  private getDefaultDragConfig(): DragPhysicsConfig {
    return {
      inertiaEnabled: true,
      momentumPreservation: 0.8,
      dampingFactor: 0.02,
      dragSensitivity: 1.0,
      maxDragSpeed: 1000,
      smoothingFactor: 0.8,
      throwEnabled: true,
      throwMultiplier: 1.5,
      throwDecay: 2.0,
      boundaryBehavior: 'bounce',
      bounceRestitution: 0.7,
      boundaryPadding: 10
    };
  }
  
  /**
   * 获取默认磁场配置
   */
  private getDefaultMagneticConfig(): MagneticFieldConfig {
    return {
      enabled: true,
      strength: 100,
      range: 200,
      falloffType: 'quadratic',
      polarity: 'attractive',
      showFieldLines: false,
      fieldLineCount: 8,
      fieldColor: '#3b82f6',
      fieldOpacity: 0.3
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 更新全局配置
   */
  updateConfig(config: Partial<typeof this.globalConfig>): void {
    Object.assign(this.globalConfig, config);
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.objects.clear();
    this.dragControllers.clear();
    
    console.log('PhysicsInteractionEffectsManager: Resources disposed');
  }
}

/**
 * 工厂函数：创建标准物理交互配置
 */
export function createStandardPhysicsConfig(): DragPhysicsConfig {
  return {
    inertiaEnabled: true,
    momentumPreservation: 0.7,
    dampingFactor: 0.05,
    dragSensitivity: 1.0,
    maxDragSpeed: 800,
    smoothingFactor: 0.6,
    throwEnabled: true,
    throwMultiplier: 1.2,
    throwDecay: 1.5,
    boundaryBehavior: 'elastic',
    bounceRestitution: 0.6,
    boundaryPadding: 5
  };
}

/**
 * 工厂函数：创建高响应物理配置
 */
export function createHighResponsePhysicsConfig(): DragPhysicsConfig {
  return {
    inertiaEnabled: true,
    momentumPreservation: 0.9,
    dampingFactor: 0.01,
    dragSensitivity: 1.2,
    maxDragSpeed: 1200,
    smoothingFactor: 0.9,
    throwEnabled: true,
    throwMultiplier: 2.0,
    throwDecay: 1.0,
    boundaryBehavior: 'bounce',
    bounceRestitution: 0.8,
    boundaryPadding: 0
  };
}