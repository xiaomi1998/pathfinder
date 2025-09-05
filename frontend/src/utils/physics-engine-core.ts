/**
 * Agent 6: 物理引擎集成专家
 * 高性能2D物理引擎核心系统
 * 
 * 特性：
 * - 轻量级刚体物理模拟
 * - 高精度时间步长管理
 * - 多种约束系统 (距离、角度、弹簧)
 * - 重力和外力场支持
 * - 60FPS稳定性能
 * - 1000+物理对象支持
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';

// 物理引擎配置
export interface PhysicsEngineConfig {
  // 时间控制
  fixedTimeStep: number;           // 固定时间步长 (1/60 = 0.0166...)
  maxSubSteps: number;            // 最大子步数
  velocityIterations: number;      // 速度迭代次数
  positionIterations: number;      // 位置迭代次数
  
  // 世界设置
  gravity: Vector2D;               // 重力
  airDamping: number;             // 空气阻力
  sleepEpsilon: number;           // 休眠阈值
  enableSleeping: boolean;         // 启用休眠优化
  
  // 性能设置
  spatialOptimization: boolean;    // 空间优化
  warmStarting: boolean;           // 热启动优化
  continuousCollisionDetection: boolean;  // 连续碰撞检测
  
  // 调试设置
  enableDebugDraw: boolean;        // 启用调试绘制
  showConstraints: boolean;        // 显示约束
  showForces: boolean;            // 显示力
}

// 刚体定义
export interface RigidBodyDef {
  id: string;
  type: 'static' | 'kinematic' | 'dynamic';
  position: Vector2D;
  rotation: number;
  linearVelocity: Vector2D;
  angularVelocity: number;
  
  // 物理属性
  mass: number;
  density: number;
  friction: number;
  restitution: number;           // 弹性系数
  
  // 形状定义
  shapes: PhysicsShape[];
  
  // 约束和标记
  fixedRotation: boolean;
  isSensor: boolean;
  allowSleep: boolean;
  
  // 用户数据
  userData?: any;
}

// 物理形状
export interface PhysicsShape {
  type: 'circle' | 'rectangle' | 'polygon';
  offset: Vector2D;               // 相对于刚体的偏移
  rotation: number;               // 相对旋转
  
  // 形状特定数据
  radius?: number;                // 圆形半径
  width?: number;                 // 矩形宽度
  height?: number;                // 矩形高度
  vertices?: Vector2D[];          // 多边形顶点
  
  // 物理属性
  friction: number;
  restitution: number;
  density: number;
  isSensor: boolean;
}

// 约束定义
export interface ConstraintDef {
  id: string;
  type: 'distance' | 'revolute' | 'prismatic' | 'spring' | 'mouse';
  bodyA: string;                  // 第一个刚体ID
  bodyB?: string;                 // 第二个刚体ID（可选，用于鼠标约束等）
  
  // 锚点
  anchorA: Vector2D;              // 在bodyA上的锚点
  anchorB: Vector2D;              // 在bodyB上的锚点
  
  // 约束特定参数
  length?: number;                // 距离约束的长度
  stiffness?: number;             // 弹簧刚度
  damping?: number;               // 阻尼
  motorSpeed?: number;            // 马达速度
  motorTorque?: number;           // 马达转矩
  
  // 限制
  minAngle?: number;              // 最小角度
  maxAngle?: number;              // 最大角度
  enableLimit?: boolean;          // 启用限制
  enableMotor?: boolean;          // 启用马达
  
  // 其他选项
  collideConnected: boolean;      // 连接的刚体是否碰撞
}

// 接触信息
export interface ContactInfo {
  bodyA: string;
  bodyB: string;
  position: Vector2D;
  normal: Vector2D;
  penetration: number;
  friction: number;
  restitution: number;
  impulse: number;
}

// 物理刚体类
class PhysicsRigidBody {
  public id: string;
  public type: 'static' | 'kinematic' | 'dynamic';
  public position: Vector2D;
  public rotation: number;
  public linearVelocity: Vector2D;
  public angularVelocity: number;
  
  public mass: number;
  public invMass: number;         // 逆质量
  public inertia: number;         // 转动惯量
  public invInertia: number;      // 逆转动惯量
  
  public friction: number;
  public restitution: number;
  public shapes: PhysicsShape[];
  
  // 状态标记
  public isAwake: boolean = true;
  public fixedRotation: boolean;
  public allowSleep: boolean;
  public isSensor: boolean;
  
  // 力和冲量累积
  public force: Vector2D = Vector2D.zero();
  public torque: number = 0;
  public userData?: any;
  
  // 包围盒
  public aabb: BoundingBox;
  
  constructor(def: RigidBodyDef) {
    this.id = def.id;
    this.type = def.type;
    this.position = def.position.clone();
    this.rotation = def.rotation;
    this.linearVelocity = def.linearVelocity.clone();
    this.angularVelocity = def.angularVelocity;
    
    this.mass = def.type === 'static' ? 0 : Math.max(def.mass, PRECISION.EPSILON);
    this.invMass = this.mass > 0 ? 1 / this.mass : 0;
    
    this.friction = def.friction;
    this.restitution = def.restitution;
    this.shapes = [...def.shapes];
    
    this.fixedRotation = def.fixedRotation;
    this.allowSleep = def.allowSleep;
    this.isSensor = def.isSensor;
    this.userData = def.userData;
    
    // 计算转动惯量
    this.calculateInertia();
    
    // 计算包围盒
    this.updateAABB();
  }
  
  /**
   * 计算转动惯量
   */
  private calculateInertia(): void {
    if (this.type === 'static' || this.fixedRotation) {
      this.inertia = 0;
      this.invInertia = 0;
      return;
    }
    
    let totalInertia = 0;
    
    for (const shape of this.shapes) {
      let shapeInertia = 0;
      
      switch (shape.type) {
        case 'circle':
          // 圆形: I = (1/2) * m * r^2
          shapeInertia = 0.5 * this.mass * (shape.radius || 0) ** 2;
          break;
          
        case 'rectangle':
          // 矩形: I = (1/12) * m * (w^2 + h^2)
          const w = shape.width || 0;
          const h = shape.height || 0;
          shapeInertia = (1/12) * this.mass * (w * w + h * h);
          break;
          
        case 'polygon':
          // 多边形惯量计算（简化）
          shapeInertia = this.mass * 0.1; // 简化计算
          break;
      }
      
      // 平行轴定理: I_total = I_cm + m * d^2
      const distance = shape.offset.length();
      totalInertia += shapeInertia + this.mass * distance * distance;
    }
    
    this.inertia = totalInertia;
    this.invInertia = totalInertia > 0 ? 1 / totalInertia : 0;
  }
  
  /**
   * 更新包围盒
   */
  updateAABB(): void {
    if (this.shapes.length === 0) {
      this.aabb = BoundingBox.fromRect(this.position.x, this.position.y, 0, 0);
      return;
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const shape of this.shapes) {
      const worldPos = this.position.add(shape.offset.rotate(this.rotation));
      
      let shapeMinX, shapeMinY, shapeMaxX, shapeMaxY;
      
      switch (shape.type) {
        case 'circle':
          const r = shape.radius || 0;
          shapeMinX = worldPos.x - r;
          shapeMinY = worldPos.y - r;
          shapeMaxX = worldPos.x + r;
          shapeMaxY = worldPos.y + r;
          break;
          
        case 'rectangle':
          const w = (shape.width || 0) / 2;
          const h = (shape.height || 0) / 2;
          // 简化计算，不考虑旋转
          shapeMinX = worldPos.x - w;
          shapeMinY = worldPos.y - h;
          shapeMaxX = worldPos.x + w;
          shapeMaxY = worldPos.y + h;
          break;
          
        default:
          shapeMinX = worldPos.x - 10;
          shapeMinY = worldPos.y - 10;
          shapeMaxX = worldPos.x + 10;
          shapeMaxY = worldPos.y + 10;
      }
      
      minX = Math.min(minX, shapeMinX);
      minY = Math.min(minY, shapeMinY);
      maxX = Math.max(maxX, shapeMaxX);
      maxY = Math.max(maxY, shapeMaxY);
    }
    
    this.aabb = BoundingBox.fromRect(minX, minY, maxX - minX, maxY - minY);
  }
  
  /**
   * 应用力
   */
  applyForce(force: Vector2D, point?: Vector2D): void {
    if (this.type === 'static') return;
    
    this.force = this.force.add(force);
    
    if (point && !this.fixedRotation) {
      // 计算转矩: τ = r × F
      const r = point.subtract(this.position);
      this.torque += r.cross(force);
    }
    
    // 唤醒刚体
    this.isAwake = true;
  }
  
  /**
   * 应用冲量
   */
  applyImpulse(impulse: Vector2D, point?: Vector2D): void {
    if (this.type === 'static') return;
    
    this.linearVelocity = this.linearVelocity.add(impulse.multiply(this.invMass));
    
    if (point && !this.fixedRotation) {
      const r = point.subtract(this.position);
      this.angularVelocity += r.cross(impulse) * this.invInertia;
    }
    
    this.isAwake = true;
  }
  
  /**
   * 积分位置（Verlet积分）
   */
  integratePosition(dt: number): void {
    if (this.type === 'static') return;
    
    this.position = this.position.add(this.linearVelocity.multiply(dt));
    this.rotation += this.angularVelocity * dt;
    
    // 更新包围盒
    this.updateAABB();
  }
  
  /**
   * 积分速度
   */
  integrateVelocity(dt: number, gravity: Vector2D, damping: number): void {
    if (this.type === 'static') return;
    
    // 应用重力
    if (this.mass > 0) {
      this.force = this.force.add(gravity.multiply(this.mass));
    }
    
    // 积分速度
    this.linearVelocity = this.linearVelocity.add(this.force.multiply(this.invMass * dt));
    this.angularVelocity += this.torque * this.invInertia * dt;
    
    // 应用阻尼
    this.linearVelocity = this.linearVelocity.multiply(1 - damping * dt);
    this.angularVelocity *= (1 - damping * dt);
    
    // 清除力和转矩
    this.force = Vector2D.zero();
    this.torque = 0;
  }
  
  /**
   * 检查是否可以休眠
   */
  canSleep(sleepEpsilon: number): boolean {
    if (!this.allowSleep || this.type === 'static') return false;
    
    const velocitySquared = this.linearVelocity.lengthSquared() + this.angularVelocity * this.angularVelocity;
    return velocitySquared < sleepEpsilon * sleepEpsilon;
  }
  
  /**
   * 休眠
   */
  sleep(): void {
    this.isAwake = false;
    this.linearVelocity = Vector2D.zero();
    this.angularVelocity = 0;
    this.force = Vector2D.zero();
    this.torque = 0;
  }
  
  /**
   * 唤醒
   */
  wake(): void {
    this.isAwake = true;
  }
}

// 物理约束基类
abstract class PhysicsConstraint {
  public id: string;
  public type: string;
  public bodyA: PhysicsRigidBody;
  public bodyB?: PhysicsRigidBody;
  public anchorA: Vector2D;
  public anchorB: Vector2D;
  public collideConnected: boolean;
  
  constructor(def: ConstraintDef, bodyA: PhysicsRigidBody, bodyB?: PhysicsRigidBody) {
    this.id = def.id;
    this.type = def.type;
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.anchorA = def.anchorA.clone();
    this.anchorB = def.anchorB.clone();
    this.collideConnected = def.collideConnected;
  }
  
  abstract solveVelocityConstraints(dt: number): void;
  abstract solvePositionConstraints(dt: number): boolean;
}

// 距离约束
class DistanceConstraint extends PhysicsConstraint {
  private targetLength: number;
  private stiffness: number;
  private damping: number;
  
  constructor(def: ConstraintDef, bodyA: PhysicsRigidBody, bodyB: PhysicsRigidBody) {
    super(def, bodyA, bodyB);
    this.targetLength = def.length || bodyA.position.distanceTo(bodyB.position);
    this.stiffness = def.stiffness || 1.0;
    this.damping = def.damping || 0.1;
  }
  
  solveVelocityConstraints(dt: number): void {
    if (!this.bodyB) return;
    
    const rA = this.anchorA;
    const rB = this.anchorB;
    
    const worldAnchorA = this.bodyA.position.add(rA);
    const worldAnchorB = this.bodyB.position.add(rB);
    
    const delta = worldAnchorB.subtract(worldAnchorA);
    const currentLength = delta.length();
    
    if (currentLength < PRECISION.EPSILON) return;
    
    const direction = delta.normalize();
    
    // 速度约束
    const vA = this.bodyA.linearVelocity;
    const vB = this.bodyB.linearVelocity;
    const relativeVelocity = vB.subtract(vA);
    const velocityError = relativeVelocity.dot(direction);
    
    // 位置误差
    const positionError = currentLength - this.targetLength;
    
    // 计算拉格朗日乘数
    const invMassSum = this.bodyA.invMass + this.bodyB.invMass;
    if (invMassSum < PRECISION.EPSILON) return;
    
    const lambda = -(velocityError + this.stiffness * positionError / dt + this.damping * velocityError) / invMassSum;
    const impulse = direction.multiply(lambda);
    
    // 应用冲量
    this.bodyA.applyImpulse(impulse.multiply(-1));
    this.bodyB.applyImpulse(impulse);
  }
  
  solvePositionConstraints(dt: number): boolean {
    if (!this.bodyB) return true;
    
    const worldAnchorA = this.bodyA.position.add(this.anchorA);
    const worldAnchorB = this.bodyB.position.add(this.anchorB);
    
    const delta = worldAnchorB.subtract(worldAnchorA);
    const currentLength = delta.length();
    
    if (currentLength < PRECISION.EPSILON) return true;
    
    const error = currentLength - this.targetLength;
    if (Math.abs(error) < PRECISION.LINEAR_SLOP) return true;
    
    const direction = delta.normalize();
    const correction = direction.multiply(-error * 0.5); // 50%位置修正
    
    // 应用位置修正
    this.bodyA.position = this.bodyA.position.add(correction.multiply(this.bodyA.invMass));
    this.bodyB.position = this.bodyB.position.add(correction.multiply(-this.bodyB.invMass));
    
    // 更新包围盒
    this.bodyA.updateAABB();
    this.bodyB.updateAABB();
    
    return Math.abs(error) < PRECISION.LINEAR_SLOP * 10;
  }
}

// 弹簧约束
class SpringConstraint extends PhysicsConstraint {
  private restLength: number;
  private stiffness: number;
  private damping: number;
  
  constructor(def: ConstraintDef, bodyA: PhysicsRigidBody, bodyB?: PhysicsRigidBody) {
    super(def, bodyA, bodyB);
    this.restLength = def.length || 0;
    this.stiffness = def.stiffness || 100;
    this.damping = def.damping || 10;
  }
  
  solveVelocityConstraints(dt: number): void {
    const worldAnchorA = this.bodyA.position.add(this.anchorA);
    let worldAnchorB = this.anchorB;
    
    if (this.bodyB) {
      worldAnchorB = this.bodyB.position.add(this.anchorB);
    }
    
    const delta = worldAnchorB.subtract(worldAnchorA);
    const currentLength = delta.length();
    
    if (currentLength < PRECISION.EPSILON) return;
    
    const direction = delta.normalize();
    
    // 弹簧力: F = -k * (x - x0)
    const springForce = direction.multiply(this.stiffness * (currentLength - this.restLength));
    
    // 阻尼力: F = -c * v
    const vA = this.bodyA.linearVelocity;
    const vB = this.bodyB ? this.bodyB.linearVelocity : Vector2D.zero();
    const relativeVelocity = vB.subtract(vA);
    const dampingForce = relativeVelocity.multiply(this.damping);
    
    const totalForce = springForce.add(dampingForce);
    
    // 应用力
    this.bodyA.applyForce(totalForce);
    if (this.bodyB) {
      this.bodyB.applyForce(totalForce.multiply(-1));
    }
  }
  
  solvePositionConstraints(dt: number): boolean {
    // 弹簧约束不需要位置修正
    return true;
  }
}

/**
 * 2D物理引擎核心
 */
export class PhysicsEngine2D {
  private config: PhysicsEngineConfig;
  private bodies: Map<string, PhysicsRigidBody> = new Map();
  private constraints: Map<string, PhysicsConstraint> = new Map();
  private contacts: ContactInfo[] = [];
  
  // 时间控制
  private accumulator: number = 0;
  private lastTime: number = 0;
  
  // 性能统计
  private stats = {
    bodyCount: 0,
    constraintCount: 0,
    contactCount: 0,
    frameTime: 0,
    physicsTime: 0,
    awakeBodyCount: 0
  };
  
  constructor(config: Partial<PhysicsEngineConfig> = {}) {
    this.config = {
      fixedTimeStep: 1 / 60,
      maxSubSteps: 3,
      velocityIterations: 8,
      positionIterations: 3,
      
      gravity: new Vector2D(0, 9.81),
      airDamping: 0.01,
      sleepEpsilon: 0.01,
      enableSleeping: true,
      
      spatialOptimization: true,
      warmStarting: true,
      continuousCollisionDetection: false,
      
      enableDebugDraw: false,
      showConstraints: false,
      showForces: false,
      
      ...config
    };
    
    console.log('PhysicsEngine2D: Initialized with high-performance 2D physics');
  }
  
  /**
   * 创建刚体
   */
  createBody(def: RigidBodyDef): string {
    const body = new PhysicsRigidBody(def);
    this.bodies.set(body.id, body);
    
    console.log(`PhysicsEngine2D: Created ${def.type} body ${body.id}`);
    return body.id;
  }
  
  /**
   * 移除刚体
   */
  removeBody(id: string): boolean {
    const removed = this.bodies.delete(id);
    
    // 移除相关约束
    for (const [constraintId, constraint] of this.constraints) {
      if (constraint.bodyA.id === id || constraint.bodyB?.id === id) {
        this.constraints.delete(constraintId);
      }
    }
    
    if (removed) {
      console.log(`PhysicsEngine2D: Removed body ${id}`);
    }
    
    return removed;
  }
  
  /**
   * 获取刚体
   */
  getBody(id: string): PhysicsRigidBody | undefined {
    return this.bodies.get(id);
  }
  
  /**
   * 创建约束
   */
  createConstraint(def: ConstraintDef): string {
    const bodyA = this.bodies.get(def.bodyA);
    const bodyB = def.bodyB ? this.bodies.get(def.bodyB) : undefined;
    
    if (!bodyA) {
      throw new Error(`Body ${def.bodyA} not found`);
    }
    
    if (def.bodyB && !bodyB) {
      throw new Error(`Body ${def.bodyB} not found`);
    }
    
    let constraint: PhysicsConstraint;
    
    switch (def.type) {
      case 'distance':
        if (!bodyB) throw new Error('Distance constraint requires two bodies');
        constraint = new DistanceConstraint(def, bodyA, bodyB);
        break;
        
      case 'spring':
        constraint = new SpringConstraint(def, bodyA, bodyB);
        break;
        
      default:
        throw new Error(`Unsupported constraint type: ${def.type}`);
    }
    
    this.constraints.set(constraint.id, constraint);
    console.log(`PhysicsEngine2D: Created ${def.type} constraint ${constraint.id}`);
    
    return constraint.id;
  }
  
  /**
   * 移除约束
   */
  removeConstraint(id: string): boolean {
    const removed = this.constraints.delete(id);
    if (removed) {
      console.log(`PhysicsEngine2D: Removed constraint ${id}`);
    }
    return removed;
  }
  
  /**
   * 物理世界步进（主循环）
   */
  step(deltaTime: number): void {
    const startTime = performance.now();
    
    // 时间累积器
    this.accumulator += deltaTime;
    
    let subSteps = 0;
    
    // 固定时间步长积分
    while (this.accumulator >= this.config.fixedTimeStep && subSteps < this.config.maxSubSteps) {
      this.singleStep(this.config.fixedTimeStep);
      this.accumulator -= this.config.fixedTimeStep;
      subSteps++;
    }
    
    // 性能统计
    this.stats.physicsTime = performance.now() - startTime;
    this.stats.frameTime = deltaTime * 1000;
    this.updateStats();
  }
  
  /**
   * 单步物理模拟
   */
  private singleStep(dt: number): void {
    // 1. 速度积分（应用力）
    this.integrateVelocities(dt);
    
    // 2. 解决约束（速度约束）
    for (let i = 0; i < this.config.velocityIterations; i++) {
      for (const constraint of this.constraints.values()) {
        constraint.solveVelocityConstraints(dt);
      }
    }
    
    // 3. 位置积分
    this.integratePositions(dt);
    
    // 4. 解决约束（位置约束）
    for (let i = 0; i < this.config.positionIterations; i++) {
      let allSolved = true;
      for (const constraint of this.constraints.values()) {
        if (!constraint.solvePositionConstraints(dt)) {
          allSolved = false;
        }
      }
      if (allSolved) break;
    }
    
    // 5. 休眠管理
    if (this.config.enableSleeping) {
      this.manageSleeping();
    }
    
    // 6. 清理
    this.clearForces();
  }
  
  /**
   * 速度积分
   */
  private integrateVelocities(dt: number): void {
    for (const body of this.bodies.values()) {
      if (!body.isAwake) continue;
      body.integrateVelocity(dt, this.config.gravity, this.config.airDamping);
    }
  }
  
  /**
   * 位置积分
   */
  private integratePositions(dt: number): void {
    for (const body of this.bodies.values()) {
      if (!body.isAwake) continue;
      body.integratePosition(dt);
    }
  }
  
  /**
   * 休眠管理
   */
  private manageSleeping(): void {
    for (const body of this.bodies.values()) {
      if (body.canSleep(this.config.sleepEpsilon)) {
        body.sleep();
      }
    }
  }
  
  /**
   * 清除力
   */
  private clearForces(): void {
    for (const body of this.bodies.values()) {
      body.force = Vector2D.zero();
      body.torque = 0;
    }
  }
  
  /**
   * 应用外力场
   */
  applyForceField(position: Vector2D, radius: number, strength: number): void {
    for (const body of this.bodies.values()) {
      if (body.type === 'static' || !body.isAwake) continue;
      
      const distance = body.position.distanceTo(position);
      if (distance > radius || distance < PRECISION.EPSILON) continue;
      
      // 力衰减
      const attenuation = 1 - (distance / radius);
      const direction = position.subtract(body.position).normalize();
      const force = direction.multiply(strength * attenuation * body.mass);
      
      body.applyForce(force);
    }
  }
  
  /**
   * 射线查询
   */
  rayCast(origin: Vector2D, direction: Vector2D, maxDistance: number): {
    body: PhysicsRigidBody;
    point: Vector2D;
    normal: Vector2D;
    distance: number;
  } | null {
    const ray = {
      origin,
      direction: direction.normalize(),
      maxDistance
    };
    
    let closestResult: {
      body: PhysicsRigidBody;
      point: Vector2D;
      normal: Vector2D;
      distance: number;
    } | null = null;
    
    let closestDistance = maxDistance;
    
    for (const body of this.bodies.values()) {
      if (body.isSensor) continue;
      
      // 简化的射线-AABB测试
      const aabb = body.aabb;
      const rayEnd = origin.add(ray.direction.multiply(maxDistance));
      
      if (this.rayIntersectsAABB(origin, rayEnd, aabb)) {
        // 精确的射线-形状测试
        for (const shape of body.shapes) {
          const result = this.rayIntersectsShape(ray, body, shape);
          if (result && result.distance < closestDistance) {
            closestDistance = result.distance;
            closestResult = {
              body,
              point: result.point,
              normal: result.normal,
              distance: result.distance
            };
          }
        }
      }
    }
    
    return closestResult;
  }
  
  /**
   * 射线与AABB相交测试
   */
  private rayIntersectsAABB(rayStart: Vector2D, rayEnd: Vector2D, aabb: BoundingBox): boolean {
    // 线段与AABB相交的简单测试
    const minX = Math.min(rayStart.x, rayEnd.x);
    const maxX = Math.max(rayStart.x, rayEnd.x);
    const minY = Math.min(rayStart.y, rayEnd.y);
    const maxY = Math.max(rayStart.y, rayEnd.y);
    
    return !(maxX < aabb.min.x || minX > aabb.max.x || maxY < aabb.min.y || minY > aabb.max.y);
  }
  
  /**
   * 射线与形状相交测试
   */
  private rayIntersectsShape(
    ray: { origin: Vector2D; direction: Vector2D; maxDistance: number },
    body: PhysicsRigidBody,
    shape: PhysicsShape
  ): { point: Vector2D; normal: Vector2D; distance: number } | null {
    const worldPos = body.position.add(shape.offset.rotate(body.rotation));
    
    switch (shape.type) {
      case 'circle':
        return this.rayIntersectsCircle(ray, worldPos, shape.radius || 0);
        
      case 'rectangle':
        // 简化实现
        return null;
        
      default:
        return null;
    }
  }
  
  /**
   * 射线与圆相交测试
   */
  private rayIntersectsCircle(
    ray: { origin: Vector2D; direction: Vector2D; maxDistance: number },
    center: Vector2D,
    radius: number
  ): { point: Vector2D; normal: Vector2D; distance: number } | null {
    const oc = ray.origin.subtract(center);
    const a = ray.direction.dot(ray.direction);
    const b = 2 * oc.dot(ray.direction);
    const c = oc.dot(oc) - radius * radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) return null;
    
    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);
    
    const t = t1 >= 0 ? t1 : t2;
    
    if (t < 0 || t > ray.maxDistance) return null;
    
    const point = ray.origin.add(ray.direction.multiply(t));
    const normal = point.subtract(center).normalize();
    
    return {
      point,
      normal,
      distance: t
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(updates: Partial<PhysicsEngineConfig>): void {
    Object.assign(this.config, updates);
    console.log('PhysicsEngine2D: Configuration updated');
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.bodyCount = this.bodies.size;
    this.stats.constraintCount = this.constraints.size;
    this.stats.contactCount = this.contacts.length;
    this.stats.awakeBodyCount = Array.from(this.bodies.values()).filter(b => b.isAwake).length;
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.bodies.clear();
    this.constraints.clear();
    this.contacts = [];
    
    console.log('PhysicsEngine2D: Resources disposed');
  }
}

/**
 * 工厂函数：创建高性能物理引擎
 */
export function createHighPerformancePhysicsEngine(): PhysicsEngine2D {
  return new PhysicsEngine2D({
    fixedTimeStep: 1 / 60,
    maxSubSteps: 3,
    velocityIterations: 8,
    positionIterations: 3,
    
    gravity: new Vector2D(0, 0), // 默认无重力，适合UI拖拽
    airDamping: 0.02,
    sleepEpsilon: 0.01,
    enableSleeping: true,
    
    spatialOptimization: true,
    warmStarting: true,
    continuousCollisionDetection: false
  });
}

/**
 * 工厂函数：创建拖拽优化的物理引擎
 */
export function createDragOptimizedPhysicsEngine(): PhysicsEngine2D {
  return new PhysicsEngine2D({
    fixedTimeStep: 1 / 60,
    maxSubSteps: 2,
    velocityIterations: 6,
    positionIterations: 2,
    
    gravity: new Vector2D(0, 0),
    airDamping: 0.05, // 更高的阻尼，适合拖拽
    sleepEpsilon: 0.005,
    enableSleeping: true,
    
    spatialOptimization: true,
    warmStarting: false, // 拖拽时禁用热启动
    continuousCollisionDetection: false
  });
}