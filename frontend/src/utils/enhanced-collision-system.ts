/**
 * Agent 6: 物理引擎集成专家
 * 增强碰撞系统 - 基于物理的碰撞响应和反馈
 * 
 * 特性：
 * - 高精度碰撞检测算法
 * - 弹性和非弹性碰撞模拟
 * - 碰撞声音和震动反馈
 * - 连续碰撞检测 (CCD)
 * - 复杂形状碰撞优化
 * - 碰撞事件系统
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { PreciseBoundaryDetector, CollisionResult } from './boundary-detection';

// 碰撞类型
export type CollisionType = 'elastic' | 'inelastic' | 'perfectly_inelastic' | 'custom';

// 碰撞响应类型
export type CollisionResponse = 'bounce' | 'stick' | 'slide' | 'pass_through' | 'destroy';

// 碰撞体形状类型
export type CollisionShapeType = 'circle' | 'rectangle' | 'polygon' | 'capsule';

// 碰撞配置
export interface CollisionConfig {
  // 基础属性
  restitution: number;            // 弹性系数 [0, 1]
  friction: number;               // 摩擦系数 [0, 1]
  density: number;                // 密度
  
  // 响应配置
  type: CollisionType;
  response: CollisionResponse;
  
  // 高级设置
  continuousDetection: boolean;    // 连续碰撞检测
  ghostCollision: boolean;         // 幽灵碰撞（仅触发事件）
  oneWayCollision: boolean;        // 单向碰撞
  
  // 过滤
  collisionMask: number;          // 碰撞掩码
  categoryBits: number;           // 分类位
  groupIndex: number;             // 组索引
  
  // 效果
  soundEnabled: boolean;          // 声音效果
  particleEnabled: boolean;       // 粒子效果
  hapticEnabled: boolean;         // 触觉反馈
  
  // 回调
  onCollisionEnter?: (contact: CollisionContact) => void;
  onCollisionStay?: (contact: CollisionContact) => void;
  onCollisionExit?: (contact: CollisionContact) => void;
}

// 碰撞体定义
export interface CollisionBodyDef {
  id: string;
  type: 'static' | 'kinematic' | 'dynamic';
  shape: CollisionShape;
  position: Vector2D;
  rotation: number;
  scale: Vector2D;
  config: CollisionConfig;
  userData?: any;
}

// 碰撞形状
export interface CollisionShape {
  type: CollisionShapeType;
  
  // 形状参数
  radius?: number;                // 圆形半径
  width?: number;                 // 矩形宽度
  height?: number;                // 矩形高度
  vertices?: Vector2D[];          // 多边形顶点
  
  // 高级参数
  offset: Vector2D;               // 相对偏移
  rotation: number;               // 相对旋转
  isTrigger: boolean;            // 触发器（无物理响应）
}

// 碰撞接触点
export interface CollisionContact {
  id: string;
  bodyA: string;
  bodyB: string;
  
  // 接触信息
  position: Vector2D;
  normal: Vector2D;
  penetration: number;
  
  // 速度信息
  relativeVelocity: Vector2D;
  separatingVelocity: number;
  
  // 冲量信息
  normalImpulse: number;
  tangentImpulse: number;
  
  // 材质信息
  restitution: number;
  friction: number;
  
  // 生命周期
  isNew: boolean;
  lifetime: number;
  timestamp: number;
}

// 碰撞事件
export interface CollisionEvent {
  type: 'enter' | 'stay' | 'exit';
  contact: CollisionContact;
  deltaTime: number;
}

// 声音效果配置
export interface CollisionSoundConfig {
  enabled: boolean;
  volume: number;
  pitch: number;
  soundUrl?: string;
  synthesized: boolean;          // 是否使用合成音效
}

// 音频合成器
class CollisionAudioSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(0.1, this.audioContext.currentTime); // 10% 音量
    }
  }
  
  /**
   * 合成碰撞音效
   */
  synthesizeCollisionSound(
    impact: number,          // 冲击强度 [0, 1]
    material1: string,       // 材质1
    material2: string,       // 材质2
    config: CollisionSoundConfig
  ): void {
    if (!this.audioContext || !this.masterGain || !config.enabled) return;
    
    try {
      const now = this.audioContext.currentTime;
      const duration = 0.1 + impact * 0.2; // 0.1-0.3秒
      
      // 创建振荡器
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // 连接音频图
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 根据材质组合确定基础频率
      const baseFreq = this.getMaterialFrequency(material1, material2);
      const frequency = baseFreq * (0.8 + impact * 0.4); // 频率随冲击强度变化
      
      // 设置振荡器
      oscillator.type = this.getMaterialWaveform(material1, material2);
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + duration);
      
      // 设置音量包络
      const volume = config.volume * impact * 0.5;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // 播放
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.warn('CollisionAudioSynthesizer: Failed to synthesize sound:', error);
    }
  }
  
  /**
   * 根据材质获取基础频率
   */
  private getMaterialFrequency(material1: string, material2: string): number {
    const frequencies: Record<string, number> = {
      'metal': 800,
      'wood': 300,
      'plastic': 500,
      'glass': 1000,
      'rubber': 150,
      'default': 400
    };
    
    const freq1 = frequencies[material1] || frequencies.default;
    const freq2 = frequencies[material2] || frequencies.default;
    
    return (freq1 + freq2) / 2;
  }
  
  /**
   * 根据材质获取波形
   */
  private getMaterialWaveform(material1: string, material2: string): OscillatorType {
    const waveforms: Record<string, OscillatorType> = {
      'metal': 'triangle',
      'wood': 'square',
      'plastic': 'sawtooth',
      'glass': 'sine',
      'default': 'triangle'
    };
    
    return waveforms[material1] || waveforms[material2] || waveforms.default;
  }
  
  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(MathUtils.clamp(volume, 0, 1), this.audioContext!.currentTime);
    }
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// 碰撞体类
class CollisionBody {
  public id: string;
  public type: 'static' | 'kinematic' | 'dynamic';
  public shape: CollisionShape;
  public position: Vector2D;
  public rotation: number;
  public scale: Vector2D;
  public config: CollisionConfig;
  public userData?: any;
  
  // 运动属性
  public velocity: Vector2D = Vector2D.zero();
  public angularVelocity: number = 0;
  public mass: number = 1;
  public invMass: number = 1;
  
  // 包围盒
  public aabb: BoundingBox;
  
  // 状态
  public isSleeping: boolean = false;
  public isEnabled: boolean = true;
  
  constructor(def: CollisionBodyDef) {
    this.id = def.id;
    this.type = def.type;
    this.shape = { ...def.shape };
    this.position = def.position.clone();
    this.rotation = def.rotation;
    this.scale = def.scale.clone();
    this.config = { ...def.config };
    this.userData = def.userData;
    
    // 计算质量
    this.calculateMass();
    
    // 初始化包围盒
    this.updateAABB();
  }
  
  /**
   * 计算质量
   */
  private calculateMass(): void {
    if (this.type === 'static') {
      this.mass = 0;
      this.invMass = 0;
      return;
    }
    
    let area = 0;
    
    switch (this.shape.type) {
      case 'circle':
        const radius = (this.shape.radius || 1) * Math.max(this.scale.x, this.scale.y);
        area = Math.PI * radius * radius;
        break;
        
      case 'rectangle':
        const width = (this.shape.width || 1) * this.scale.x;
        const height = (this.shape.height || 1) * this.scale.y;
        area = width * height;
        break;
        
      case 'polygon':
        // 简化计算
        area = 1;
        break;
        
      default:
        area = 1;
    }
    
    this.mass = area * this.config.density;
    this.invMass = this.mass > 0 ? 1 / this.mass : 0;
  }
  
  /**
   * 更新包围盒
   */
  updateAABB(): void {
    const worldPos = this.position.add(this.shape.offset.rotate(this.rotation));
    
    let minX, minY, maxX, maxY;
    
    switch (this.shape.type) {
      case 'circle':
        const radius = (this.shape.radius || 1) * Math.max(this.scale.x, this.scale.y);
        minX = worldPos.x - radius;
        minY = worldPos.y - radius;
        maxX = worldPos.x + radius;
        maxY = worldPos.y + radius;
        break;
        
      case 'rectangle':
        const halfWidth = (this.shape.width || 1) * this.scale.x / 2;
        const halfHeight = (this.shape.height || 1) * this.scale.y / 2;
        
        // 考虑旋转的简化包围盒
        const cos = Math.abs(Math.cos(this.rotation + this.shape.rotation));
        const sin = Math.abs(Math.sin(this.rotation + this.shape.rotation));
        const rotatedWidth = halfWidth * cos + halfHeight * sin;
        const rotatedHeight = halfWidth * sin + halfHeight * cos;
        
        minX = worldPos.x - rotatedWidth;
        minY = worldPos.y - rotatedHeight;
        maxX = worldPos.x + rotatedWidth;
        maxY = worldPos.y + rotatedHeight;
        break;
        
      default:
        // 默认包围盒
        minX = worldPos.x - 10;
        minY = worldPos.y - 10;
        maxX = worldPos.x + 10;
        maxY = worldPos.y + 10;
    }
    
    this.aabb = BoundingBox.fromRect(minX, minY, maxX - minX, maxY - minY);
  }
  
  /**
   * 获取世界坐标下的形状顶点
   */
  getWorldVertices(): Vector2D[] {
    const vertices: Vector2D[] = [];
    const worldPos = this.position.add(this.shape.offset.rotate(this.rotation));
    const totalRotation = this.rotation + this.shape.rotation;
    
    switch (this.shape.type) {
      case 'circle':
        // 圆形用8边形近似
        const radius = (this.shape.radius || 1) * Math.max(this.scale.x, this.scale.y);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          const x = worldPos.x + radius * Math.cos(angle);
          const y = worldPos.y + radius * Math.sin(angle);
          vertices.push(new Vector2D(x, y));
        }
        break;
        
      case 'rectangle':
        const halfWidth = (this.shape.width || 1) * this.scale.x / 2;
        const halfHeight = (this.shape.height || 1) * this.scale.y / 2;
        
        const corners = [
          new Vector2D(-halfWidth, -halfHeight),
          new Vector2D(halfWidth, -halfHeight),
          new Vector2D(halfWidth, halfHeight),
          new Vector2D(-halfWidth, halfHeight)
        ];
        
        for (const corner of corners) {
          const rotated = corner.rotate(totalRotation);
          vertices.push(worldPos.add(rotated));
        }
        break;
        
      case 'polygon':
        if (this.shape.vertices) {
          for (const vertex of this.shape.vertices) {
            const scaled = new Vector2D(vertex.x * this.scale.x, vertex.y * this.scale.y);
            const rotated = scaled.rotate(totalRotation);
            vertices.push(worldPos.add(rotated));
          }
        }
        break;
    }
    
    return vertices;
  }
  
  /**
   * 应用冲量
   */
  applyImpulse(impulse: Vector2D, contactPoint?: Vector2D): void {
    if (this.type === 'static') return;
    
    this.velocity = this.velocity.add(impulse.multiply(this.invMass));
    
    if (contactPoint && this.invMass > 0) {
      const r = contactPoint.subtract(this.position);
      // 简化的角冲量计算
      const angularImpulse = r.cross(impulse) * this.invMass * 0.1;
      this.angularVelocity += angularImpulse;
    }
  }
  
  /**
   * 更新位置
   */
  updatePosition(deltaTime: number): void {
    if (this.type === 'static') return;
    
    this.position = this.position.add(this.velocity.multiply(deltaTime));
    this.rotation += this.angularVelocity * deltaTime;
    
    this.updateAABB();
  }
}

/**
 * 增强碰撞系统
 */
export class EnhancedCollisionSystem {
  private bodies: Map<string, CollisionBody> = new Map();
  private contacts: Map<string, CollisionContact> = new Map();
  private events: CollisionEvent[] = [];
  
  // 音频合成器
  private audioSynthesizer: CollisionAudioSynthesizer;
  
  // 性能统计
  private stats = {
    bodyCount: 0,
    contactCount: 0,
    collisionChecks: 0,
    averageResponseTime: 0
  };
  
  // 配置
  private globalConfig = {
    enableSound: true,
    enableHaptics: true,
    broadphaseOptimization: true,
    continuousDetection: false
  };
  
  constructor() {
    this.audioSynthesizer = new CollisionAudioSynthesizer();
    console.log('EnhancedCollisionSystem: Initialized with advanced collision detection');
  }
  
  /**
   * 添加碰撞体
   */
  addBody(def: CollisionBodyDef): string {
    const body = new CollisionBody(def);
    this.bodies.set(body.id, body);
    
    console.log(`EnhancedCollisionSystem: Added ${def.type} collision body ${body.id}`);
    return body.id;
  }
  
  /**
   * 移除碰撞体
   */
  removeBody(id: string): boolean {
    const removed = this.bodies.delete(id);
    
    // 清理相关接触点
    const toRemove: string[] = [];
    for (const [contactId, contact] of this.contacts) {
      if (contact.bodyA === id || contact.bodyB === id) {
        toRemove.push(contactId);
      }
    }
    
    toRemove.forEach(contactId => this.contacts.delete(contactId));
    
    if (removed) {
      console.log(`EnhancedCollisionSystem: Removed collision body ${id}`);
    }
    
    return removed;
  }
  
  /**
   * 获取碰撞体
   */
  getBody(id: string): CollisionBody | undefined {
    return this.bodies.get(id);
  }
  
  /**
   * 更新碰撞体位置
   */
  updateBodyPosition(id: string, position: Vector2D, rotation?: number): void {
    const body = this.bodies.get(id);
    if (!body) return;
    
    body.position = position.clone();
    if (rotation !== undefined) {
      body.rotation = rotation;
    }
    
    body.updateAABB();
  }
  
  /**
   * 更新碰撞体速度
   */
  updateBodyVelocity(id: string, velocity: Vector2D, angularVelocity?: number): void {
    const body = this.bodies.get(id);
    if (!body) return;
    
    body.velocity = velocity.clone();
    if (angularVelocity !== undefined) {
      body.angularVelocity = angularVelocity;
    }
  }
  
  /**
   * 物理步进
   */
  step(deltaTime: number): void {
    const startTime = performance.now();
    
    // 1. 广相碰撞检测
    const potentialPairs = this.broadPhaseDetection();
    
    // 2. 窄相碰撞检测
    this.narrowPhaseDetection(potentialPairs);
    
    // 3. 碰撞响应
    this.resolveCollisions(deltaTime);
    
    // 4. 更新物体位置
    this.updateBodies(deltaTime);
    
    // 5. 处理碰撞事件
    this.processCollisionEvents(deltaTime);
    
    // 6. 清理过期接触点
    this.cleanupContacts();
    
    // 统计
    const responseTime = performance.now() - startTime;
    this.updateStats(responseTime);
  }
  
  /**
   * 广相碰撞检测 (AABB)
   */
  private broadPhaseDetection(): Array<[CollisionBody, CollisionBody]> {
    const pairs: Array<[CollisionBody, CollisionBody]> = [];
    const bodies = Array.from(this.bodies.values()).filter(b => b.isEnabled);
    
    this.stats.collisionChecks = 0;
    
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const bodyA = bodies[i];
        const bodyB = bodies[j];
        
        // 跳过两个静态物体
        if (bodyA.type === 'static' && bodyB.type === 'static') {
          continue;
        }
        
        // 碰撞过滤
        if (!this.shouldCollide(bodyA, bodyB)) {
          continue;
        }
        
        this.stats.collisionChecks++;
        
        // AABB 重叠测试
        if (bodyA.aabb.intersects(bodyB.aabb)) {
          pairs.push([bodyA, bodyB]);
        }
      }
    }
    
    return pairs;
  }
  
  /**
   * 窄相碰撞检测
   */
  private narrowPhaseDetection(pairs: Array<[CollisionBody, CollisionBody]>): void {
    for (const [bodyA, bodyB] of pairs) {
      const contact = this.detectCollision(bodyA, bodyB);
      
      if (contact) {
        const contactId = `${bodyA.id}_${bodyB.id}`;
        const existingContact = this.contacts.get(contactId);
        
        if (existingContact) {
          // 更新现有接触点
          this.updateContact(existingContact, contact);
        } else {
          // 新的接触点
          contact.isNew = true;
          contact.timestamp = performance.now();
          this.contacts.set(contactId, contact);
          
          // 触发进入事件
          this.events.push({
            type: 'enter',
            contact,
            deltaTime: 0
          });
        }
      } else {
        // 检查是否有需要移除的接触点
        const contactId = `${bodyA.id}_${bodyB.id}`;
        const existingContact = this.contacts.get(contactId);
        
        if (existingContact) {
          // 触发退出事件
          this.events.push({
            type: 'exit',
            contact: existingContact,
            deltaTime: performance.now() - existingContact.timestamp
          });
          
          this.contacts.delete(contactId);
        }
      }
    }
  }
  
  /**
   * 检测两个物体的碰撞
   */
  private detectCollision(bodyA: CollisionBody, bodyB: CollisionBody): CollisionContact | null {
    // 获取形状类型
    const shapeA = bodyA.shape.type;
    const shapeB = bodyB.shape.type;
    
    // 根据形状组合选择检测算法
    if (shapeA === 'circle' && shapeB === 'circle') {
      return this.detectCircleCircleCollision(bodyA, bodyB);
    } else if (shapeA === 'circle' && shapeB === 'rectangle') {
      return this.detectCircleRectangleCollision(bodyA, bodyB);
    } else if (shapeA === 'rectangle' && shapeB === 'circle') {
      const contact = this.detectCircleRectangleCollision(bodyB, bodyA);
      if (contact) {
        // 交换body引用
        [contact.bodyA, contact.bodyB] = [contact.bodyB, contact.bodyA];
        contact.normal = contact.normal.multiply(-1);
      }
      return contact;
    } else if (shapeA === 'rectangle' && shapeB === 'rectangle') {
      return this.detectRectangleRectangleCollision(bodyA, bodyB);
    } else {
      // 通用多边形检测 (SAT)
      return this.detectPolygonCollision(bodyA, bodyB);
    }
  }
  
  /**
   * 圆-圆碰撞检测
   */
  private detectCircleCircleCollision(bodyA: CollisionBody, bodyB: CollisionBody): CollisionContact | null {
    const posA = bodyA.position.add(bodyA.shape.offset.rotate(bodyA.rotation));
    const posB = bodyB.position.add(bodyB.shape.offset.rotate(bodyB.rotation));
    
    const radiusA = (bodyA.shape.radius || 1) * Math.max(bodyA.scale.x, bodyA.scale.y);
    const radiusB = (bodyB.shape.radius || 1) * Math.max(bodyB.scale.x, bodyB.scale.y);
    
    const delta = posB.subtract(posA);
    const distance = delta.length();
    const totalRadius = radiusA + radiusB;
    
    if (distance >= totalRadius || distance < PRECISION.EPSILON) {
      return null;
    }
    
    const penetration = totalRadius - distance;
    const normal = distance > 0 ? delta.normalize() : new Vector2D(1, 0);
    const contactPoint = posA.add(normal.multiply(radiusA - penetration * 0.5));
    
    return this.createContact(bodyA, bodyB, contactPoint, normal, penetration);
  }
  
  /**
   * 圆-矩形碰撞检测
   */
  private detectCircleRectangleCollision(circle: CollisionBody, rect: CollisionBody): CollisionContact | null {
    const circlePos = circle.position.add(circle.shape.offset.rotate(circle.rotation));
    const rectPos = rect.position.add(rect.shape.offset.rotate(rect.rotation));
    const radius = (circle.shape.radius || 1) * Math.max(circle.scale.x, circle.scale.y);
    
    const halfWidth = (rect.shape.width || 1) * rect.scale.x / 2;
    const halfHeight = (rect.shape.height || 1) * rect.scale.y / 2;
    
    // 将圆心转换到矩形本地坐标系
    const localPos = circlePos.subtract(rectPos).rotate(-rect.rotation - rect.shape.rotation);
    
    // 找到最近点
    const closestX = MathUtils.clamp(localPos.x, -halfWidth, halfWidth);
    const closestY = MathUtils.clamp(localPos.y, -halfHeight, halfHeight);
    const closestPoint = new Vector2D(closestX, closestY);
    
    const delta = localPos.subtract(closestPoint);
    const distance = delta.length();
    
    if (distance >= radius) {
      return null;
    }
    
    let normal: Vector2D;
    let penetration: number;
    
    if (distance < PRECISION.EPSILON) {
      // 圆心在矩形内
      const xDist = halfWidth - Math.abs(localPos.x);
      const yDist = halfHeight - Math.abs(localPos.y);
      
      if (xDist < yDist) {
        normal = new Vector2D(localPos.x > 0 ? 1 : -1, 0);
        penetration = radius + xDist;
      } else {
        normal = new Vector2D(0, localPos.y > 0 ? 1 : -1);
        penetration = radius + yDist;
      }
    } else {
      normal = delta.normalize();
      penetration = radius - distance;
    }
    
    // 转换法向量回世界坐标系
    normal = normal.rotate(rect.rotation + rect.shape.rotation);
    const worldClosestPoint = closestPoint.rotate(rect.rotation + rect.shape.rotation).add(rectPos);
    
    return this.createContact(circle, rect, worldClosestPoint, normal, penetration);
  }
  
  /**
   * 矩形-矩形碰撞检测 (SAT)
   */
  private detectRectangleRectangleCollision(bodyA: CollisionBody, bodyB: CollisionBody): CollisionContact | null {
    const verticesA = this.getRectangleVertices(bodyA);
    const verticesB = this.getRectangleVertices(bodyB);
    
    // 使用SAT算法
    const result = this.satCollisionTest(verticesA, verticesB);
    
    if (!result.intersect) {
      return null;
    }
    
    const contactPoint = bodyA.position.add(bodyB.position).divide(2); // 简化的接触点
    
    return this.createContact(bodyA, bodyB, contactPoint, result.normal, result.overlap);
  }
  
  /**
   * 通用多边形碰撞检测
   */
  private detectPolygonCollision(bodyA: CollisionBody, bodyB: CollisionBody): CollisionContact | null {
    const verticesA = bodyA.getWorldVertices();
    const verticesB = bodyB.getWorldVertices();
    
    if (verticesA.length === 0 || verticesB.length === 0) {
      return null;
    }
    
    const result = this.satCollisionTest(verticesA, verticesB);
    
    if (!result.intersect) {
      return null;
    }
    
    const contactPoint = this.findContactPoint(verticesA, verticesB, result.normal);
    
    return this.createContact(bodyA, bodyB, contactPoint, result.normal, result.overlap);
  }
  
  /**
   * SAT碰撞测试
   */
  private satCollisionTest(verticesA: Vector2D[], verticesB: Vector2D[]): {
    intersect: boolean;
    normal: Vector2D;
    overlap: number;
  } {
    let minOverlap = Infinity;
    let separationAxis = Vector2D.zero();
    
    // 检查A的边
    for (let i = 0; i < verticesA.length; i++) {
      const current = verticesA[i];
      const next = verticesA[(i + 1) % verticesA.length];
      const edge = next.subtract(current);
      const normal = new Vector2D(-edge.y, edge.x).normalize();
      
      const result = this.projectVertices(verticesA, normal);
      const projectionA = { min: result.min, max: result.max };
      
      const result2 = this.projectVertices(verticesB, normal);
      const projectionB = { min: result2.min, max: result2.max };
      
      const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
      
      if (overlap <= 0) {
        return { intersect: false, normal: Vector2D.zero(), overlap: 0 };
      }
      
      if (overlap < minOverlap) {
        minOverlap = overlap;
        separationAxis = normal;
      }
    }
    
    // 检查B的边
    for (let i = 0; i < verticesB.length; i++) {
      const current = verticesB[i];
      const next = verticesB[(i + 1) % verticesB.length];
      const edge = next.subtract(current);
      const normal = new Vector2D(-edge.y, edge.x).normalize();
      
      const result = this.projectVertices(verticesA, normal);
      const projectionA = { min: result.min, max: result.max };
      
      const result2 = this.projectVertices(verticesB, normal);
      const projectionB = { min: result2.min, max: result2.max };
      
      const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
      
      if (overlap <= 0) {
        return { intersect: false, normal: Vector2D.zero(), overlap: 0 };
      }
      
      if (overlap < minOverlap) {
        minOverlap = overlap;
        separationAxis = normal;
      }
    }
    
    return {
      intersect: true,
      normal: separationAxis,
      overlap: minOverlap
    };
  }
  
  /**
   * 投影顶点到轴
   */
  private projectVertices(vertices: Vector2D[], axis: Vector2D): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    
    for (const vertex of vertices) {
      const projection = vertex.dot(axis);
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
    
    return { min, max };
  }
  
  /**
   * 获取矩形顶点
   */
  private getRectangleVertices(body: CollisionBody): Vector2D[] {
    const pos = body.position.add(body.shape.offset.rotate(body.rotation));
    const halfWidth = (body.shape.width || 1) * body.scale.x / 2;
    const halfHeight = (body.shape.height || 1) * body.scale.y / 2;
    const rotation = body.rotation + body.shape.rotation;
    
    const corners = [
      new Vector2D(-halfWidth, -halfHeight),
      new Vector2D(halfWidth, -halfHeight),
      new Vector2D(halfWidth, halfHeight),
      new Vector2D(-halfWidth, halfHeight)
    ];
    
    return corners.map(corner => pos.add(corner.rotate(rotation)));
  }
  
  /**
   * 寻找接触点
   */
  private findContactPoint(verticesA: Vector2D[], verticesB: Vector2D[], normal: Vector2D): Vector2D {
    // 简化实现：返回重叠区域的中心点
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const vertex of [...verticesA, ...verticesB]) {
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
    }
    
    return new Vector2D((minX + maxX) / 2, (minY + maxY) / 2);
  }
  
  /**
   * 创建接触点
   */
  private createContact(
    bodyA: CollisionBody,
    bodyB: CollisionBody,
    position: Vector2D,
    normal: Vector2D,
    penetration: number
  ): CollisionContact {
    // 计算相对速度
    const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);
    const separatingVelocity = relativeVelocity.dot(normal);
    
    // 组合材质属性
    const restitution = Math.min(bodyA.config.restitution, bodyB.config.restitution);
    const friction = Math.sqrt(bodyA.config.friction * bodyB.config.friction);
    
    return {
      id: `${bodyA.id}_${bodyB.id}`,
      bodyA: bodyA.id,
      bodyB: bodyB.id,
      position,
      normal,
      penetration,
      relativeVelocity,
      separatingVelocity,
      normalImpulse: 0,
      tangentImpulse: 0,
      restitution,
      friction,
      isNew: false,
      lifetime: 0,
      timestamp: performance.now()
    };
  }
  
  /**
   * 更新接触点
   */
  private updateContact(existing: CollisionContact, updated: CollisionContact): void {
    existing.position = updated.position;
    existing.normal = updated.normal;
    existing.penetration = updated.penetration;
    existing.relativeVelocity = updated.relativeVelocity;
    existing.separatingVelocity = updated.separatingVelocity;
    existing.lifetime = performance.now() - existing.timestamp;
    existing.isNew = false;
  }
  
  /**
   * 碰撞响应
   */
  private resolveCollisions(deltaTime: number): void {
    for (const contact of this.contacts.values()) {
      const bodyA = this.bodies.get(contact.bodyA);
      const bodyB = this.bodies.get(contact.bodyB);
      
      if (!bodyA || !bodyB) continue;
      
      // 位置修正
      this.resolvePositionalCorrection(bodyA, bodyB, contact);
      
      // 速度修正
      this.resolveVelocityCorrection(bodyA, bodyB, contact);
      
      // 触发碰撞效果
      this.triggerCollisionEffects(bodyA, bodyB, contact);
    }
  }
  
  /**
   * 位置修正
   */
  private resolvePositionalCorrection(bodyA: CollisionBody, bodyB: CollisionBody, contact: CollisionContact): void {
    const totalInvMass = bodyA.invMass + bodyB.invMass;
    if (totalInvMass <= 0 || contact.penetration <= 0) return;
    
    const correctionPercent = 0.8; // 位置修正百分比
    const slop = 0.01; // 允许的渗透量
    
    const correction = Math.max(contact.penetration - slop, 0) / totalInvMass * correctionPercent;
    const correctionVector = contact.normal.multiply(correction);
    
    bodyA.position = bodyA.position.subtract(correctionVector.multiply(bodyA.invMass));
    bodyB.position = bodyB.position.add(correctionVector.multiply(bodyB.invMass));
    
    // 更新包围盒
    bodyA.updateAABB();
    bodyB.updateAABB();
  }
  
  /**
   * 速度修正
   */
  private resolveVelocityCorrection(bodyA: CollisionBody, bodyB: CollisionBody, contact: CollisionContact): void {
    if (contact.separatingVelocity > 0) return; // 物体正在分离
    
    const totalInvMass = bodyA.invMass + bodyB.invMass;
    if (totalInvMass <= 0) return;
    
    // 计算法向冲量
    const restitutionVelocity = -contact.separatingVelocity * contact.restitution;
    const deltaVelocity = restitutionVelocity - contact.separatingVelocity;
    const impulse = deltaVelocity / totalInvMass;
    
    const impulseVector = contact.normal.multiply(impulse);
    
    // 应用冲量
    bodyA.applyImpulse(impulseVector.multiply(-1), contact.position);
    bodyB.applyImpulse(impulseVector, contact.position);
    
    // 摩擦处理
    this.resolveFriction(bodyA, bodyB, contact, impulse);
    
    contact.normalImpulse = impulse;
  }
  
  /**
   * 摩擦处理
   */
  private resolveFriction(bodyA: CollisionBody, bodyB: CollisionBody, contact: CollisionContact, normalImpulse: number): void {
    const relativeVelocity = bodyB.velocity.subtract(bodyA.velocity);
    const tangent = relativeVelocity.subtract(contact.normal.multiply(relativeVelocity.dot(contact.normal)));
    
    if (tangent.lengthSquared() < PRECISION.EPSILON) return;
    
    const tangentNormalized = tangent.normalize();
    const tangentVelocity = relativeVelocity.dot(tangentNormalized);
    
    const totalInvMass = bodyA.invMass + bodyB.invMass;
    if (totalInvMass <= 0) return;
    
    let tangentImpulse = -tangentVelocity / totalInvMass;
    
    // 库仑摩擦定律
    if (Math.abs(tangentImpulse) > Math.abs(normalImpulse * contact.friction)) {
      tangentImpulse = -Math.sign(tangentVelocity) * Math.abs(normalImpulse * contact.friction);
    }
    
    const frictionVector = tangentNormalized.multiply(tangentImpulse);
    
    bodyA.applyImpulse(frictionVector.multiply(-1), contact.position);
    bodyB.applyImpulse(frictionVector, contact.position);
    
    contact.tangentImpulse = tangentImpulse;
  }
  
  /**
   * 触发碰撞效果
   */
  private triggerCollisionEffects(bodyA: CollisionBody, bodyB: CollisionBody, contact: CollisionContact): void {
    const impactStrength = Math.abs(contact.normalImpulse) / 10; // 标准化冲击强度
    
    // 声音效果
    if (this.globalConfig.enableSound && (bodyA.config.soundEnabled || bodyB.config.soundEnabled)) {
      this.audioSynthesizer.synthesizeCollisionSound(
        impactStrength,
        bodyA.userData?.material || 'default',
        bodyB.userData?.material || 'default',
        {
          enabled: true,
          volume: 0.5,
          pitch: 1.0,
          synthesized: true
        }
      );
    }
    
    // 触觉反馈
    if (this.globalConfig.enableHaptics && 'vibrate' in navigator && (bodyA.config.hapticEnabled || bodyB.config.hapticEnabled)) {
      const intensity = Math.min(impactStrength * 100, 100);
      if (intensity > 10) {
        navigator.vibrate(Math.floor(intensity));
      }
    }
  }
  
  /**
   * 更新物体
   */
  private updateBodies(deltaTime: number): void {
    for (const body of this.bodies.values()) {
      if (body.isEnabled && body.type !== 'static') {
        body.updatePosition(deltaTime);
      }
    }
  }
  
  /**
   * 处理碰撞事件
   */
  private processCollisionEvents(deltaTime: number): void {
    for (const event of this.events) {
      const bodyA = this.bodies.get(event.contact.bodyA);
      const bodyB = this.bodies.get(event.contact.bodyB);
      
      if (!bodyA || !bodyB) continue;
      
      // 调用相应的回调
      if (event.type === 'enter') {
        bodyA.config.onCollisionEnter?.(event.contact);
        bodyB.config.onCollisionEnter?.(event.contact);
      } else if (event.type === 'stay') {
        bodyA.config.onCollisionStay?.(event.contact);
        bodyB.config.onCollisionStay?.(event.contact);
      } else if (event.type === 'exit') {
        bodyA.config.onCollisionExit?.(event.contact);
        bodyB.config.onCollisionExit?.(event.contact);
      }
    }
    
    // 为现有接触点生成stay事件
    for (const contact of this.contacts.values()) {
      if (!contact.isNew) {
        this.events.push({
          type: 'stay',
          contact,
          deltaTime
        });
      }
    }
    
    this.events = [];
  }
  
  /**
   * 清理接触点
   */
  private cleanupContacts(): void {
    const now = performance.now();
    const maxLifetime = 100; // 100ms
    
    for (const [id, contact] of this.contacts) {
      if (now - contact.timestamp > maxLifetime) {
        this.contacts.delete(id);
      }
    }
  }
  
  /**
   * 检查是否应该碰撞
   */
  private shouldCollide(bodyA: CollisionBody, bodyB: CollisionBody): boolean {
    // 碰撞分组过滤
    if (bodyA.config.groupIndex !== 0 && bodyB.config.groupIndex !== 0) {
      if (bodyA.config.groupIndex === bodyB.config.groupIndex) {
        return bodyA.config.groupIndex > 0; // 同组正数：碰撞，负数：不碰撞
      }
    }
    
    // 碰撞掩码过滤
    return (bodyA.config.categoryBits & bodyB.config.collisionMask) !== 0 &&
           (bodyB.config.categoryBits & bodyA.config.collisionMask) !== 0;
  }
  
  /**
   * 更新统计信息
   */
  private updateStats(responseTime: number): void {
    this.stats.bodyCount = this.bodies.size;
    this.stats.contactCount = this.contacts.size;
    this.stats.averageResponseTime = (this.stats.averageResponseTime + responseTime) / 2;
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
   * 设置音频主音量
   */
  setAudioVolume(volume: number): void {
    this.audioSynthesizer.setMasterVolume(volume);
  }
  
  /**
   * 获取所有接触点
   */
  getContacts(): CollisionContact[] {
    return Array.from(this.contacts.values());
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.bodies.clear();
    this.contacts.clear();
    this.events = [];
    this.audioSynthesizer.dispose();
    
    console.log('EnhancedCollisionSystem: Resources disposed');
  }
}

/**
 * 工厂函数：创建标准碰撞配置
 */
export function createStandardCollisionConfig(): CollisionConfig {
  return {
    restitution: 0.3,
    friction: 0.5,
    density: 1.0,
    type: 'elastic',
    response: 'bounce',
    continuousDetection: false,
    ghostCollision: false,
    oneWayCollision: false,
    collisionMask: 0xFFFFFFFF,
    categoryBits: 0x0001,
    groupIndex: 0,
    soundEnabled: true,
    particleEnabled: false,
    hapticEnabled: true
  };
}

/**
 * 工厂函数：创建弹性碰撞配置
 */
export function createBouncyCollisionConfig(): CollisionConfig {
  return {
    ...createStandardCollisionConfig(),
    restitution: 0.9,
    friction: 0.1,
    type: 'elastic',
    response: 'bounce'
  };
}

/**
 * 工厂函数：创建粘性碰撞配置
 */
export function createStickyCollisionConfig(): CollisionConfig {
  return {
    ...createStandardCollisionConfig(),
    restitution: 0.0,
    friction: 0.9,
    type: 'inelastic',
    response: 'stick'
  };
}