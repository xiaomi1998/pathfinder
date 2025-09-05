/**
 * 增强磁性吸附系统
 * Agent 5: 智能对齐和磁性吸附专家
 * 
 * 功能特性：
 * - 多强度磁性吸附 (弱/中/强/最大/自适应)
 * - 智能吸附距离自适应算法
 * - 对象间磁性约束关系
 * - 吸附点优先级管理
 * - 吸附反馈动画优化
 * - 物理仿真磁性效果
 * - 性能优化的空间分区
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { cacheOptimizer } from './cache-optimizer';
import { SnapTarget, SnapType } from './smart-snapping-alignment';
import { MagneticStrength, AlignmentLayer } from './advanced-alignment-engine';

// 磁性吸附配置
export interface MagneticSnapConfig {
  // 基础磁性配置
  globalStrength: MagneticStrength;        // 全局磁性强度
  adaptiveMode: boolean;                   // 自适应模式
  multiLevelSnapping: boolean;             // 多级吸附
  
  // 距离和阈值
  baseSnapDistance: number;                // 基础吸附距离
  maxSnapDistance: number;                 // 最大吸附距离
  minSnapDistance: number;                 // 最小吸附距离
  adaptiveDistanceRange: [number, number]; // 自适应距离范围
  
  // 强度分级
  strengthLevels: {
    weak: number;      // 弱磁性
    medium: number;    // 中等磁性
    strong: number;    // 强磁性
    maximum: number;   // 最大磁性
  };
  
  // 物理仿真
  enablePhysics: boolean;                  // 启用物理仿真
  friction: number;                        // 摩擦系数
  elasticity: number;                      // 弹性系数
  dampening: number;                       // 阻尼系数
  
  // 性能优化
  enableSpatialPartition: boolean;         // 空间分区优化
  maxSimultaneousSnaps: number;           // 最大同时吸附数
  updateFrequency: number;                 // 更新频率 (Hz)
  
  // 视觉反馈
  showMagneticField: boolean;              // 显示磁场
  showSnapRadius: boolean;                 // 显示吸附半径
  animateSnapTransition: boolean;          // 吸附过渡动画
  magneticFieldOpacity: number;            // 磁场透明度
}

// 磁性目标
export interface MagneticTarget {
  id: string;
  position: Vector2D;
  type: SnapType;
  strength: MagneticStrength;
  radius: number;                          // 影响半径
  priority: number;                        // 优先级
  isActive: boolean;
  
  // 物理属性
  mass: number;                           // 质量（影响磁性强度）
  charge: number;                         // 磁荷（正负吸引/排斥）
  
  // 约束
  constraints?: {
    maxSnapCount: number;                 // 最大吸附对象数
    allowedTypes: string[];               // 允许的对象类型
    exclusions: string[];                 // 排除的对象ID
  };
  
  // 元数据
  metadata?: Record<string, any>;
}

// 磁性吸附结果
export interface MagneticSnapResult {
  snappedPosition: Vector2D;
  originalPosition: Vector2D;
  activeTargets: MagneticTarget[];
  snapStrength: number;                    // 最终吸附强度
  snapDistance: number;                    // 吸附距离
  snapForce: Vector2D;                     // 吸附力向量
  transitionTime: number;                  // 过渡时间
  
  // 物理信息
  velocity: Vector2D;                      // 吸附后速度
  acceleration: Vector2D;                  // 吸附加速度
  
  // 视觉反馈
  showGuides: boolean;
  magneticFieldVisualization?: {
    fieldLines: Vector2D[][];
    strength: number;
    color: string;
  };
}

// 磁性约束关系
export interface MagneticConstraint {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'attractive' | 'repulsive' | 'neutral';
  strength: number;
  distance: number;
  enabled: boolean;
}

// 空间分区节点
interface SpatialPartitionNode {
  bounds: BoundingBox;
  targets: MagneticTarget[];
  children?: SpatialPartitionNode[];
  depth: number;
}

/**
 * 增强磁性吸附管理器
 */
export class EnhancedMagneticSnapping {
  private config: MagneticSnapConfig;
  private targets: Map<string, MagneticTarget> = new Map();
  private constraints: Map<string, MagneticConstraint> = new Map();
  private spatialPartition: SpatialPartitionNode | null = null;
  
  // 性能缓存
  private snapCache = new Map<string, MagneticSnapResult>();
  private fieldCache = new Map<string, any>();
  private lastUpdateTime = 0;
  private updateInterval = 0;
  
  // 物理仿真状态
  private physicsBodies = new Map<string, {
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    mass: number;
  }>();
  
  // 统计信息
  private stats = {
    totalSnaps: 0,
    averageSnapTime: 0,
    cacheHitRate: 0,
    activeTargets: 0,
    physicUpdates: 0
  };

  constructor(config: Partial<MagneticSnapConfig> = {}) {
    this.config = {
      globalStrength: MagneticStrength.MEDIUM,
      adaptiveMode: true,
      multiLevelSnapping: true,
      
      baseSnapDistance: 20,
      maxSnapDistance: 100,
      minSnapDistance: 5,
      adaptiveDistanceRange: [10, 80],
      
      strengthLevels: {
        weak: 0.3,
        medium: 0.6,
        strong: 0.9,
        maximum: 1.0
      },
      
      enablePhysics: true,
      friction: 0.1,
      elasticity: 0.3,
      dampening: 0.05,
      
      enableSpatialPartition: true,
      maxSimultaneousSnaps: 8,
      updateFrequency: 60,
      
      showMagneticField: false,
      showSnapRadius: false,
      animateSnapTransition: true,
      magneticFieldOpacity: 0.3,
      
      ...config
    };

    this.updateInterval = 1000 / this.config.updateFrequency;
    this.initializeSpatialPartition();

    console.log('EnhancedMagneticSnapping: Initialized with advanced magnetic effects');
  }

  /**
   * 添加磁性目标
   */
  addMagneticTarget(target: Partial<MagneticTarget>): void {
    const fullTarget: MagneticTarget = {
      id: target.id || `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      position: target.position || Vector2D.zero(),
      type: target.type || SnapType.OBJECT,
      strength: target.strength || this.config.globalStrength,
      radius: target.radius || this.config.baseSnapDistance,
      priority: target.priority || 0,
      isActive: target.isActive !== false,
      mass: target.mass || 1.0,
      charge: target.charge || 1.0,
      constraints: target.constraints,
      metadata: target.metadata,
      ...target
    };

    this.targets.set(fullTarget.id, fullTarget);
    
    // 更新空间分区
    if (this.config.enableSpatialPartition) {
      this.updateSpatialPartition();
    }

    // 初始化物理体
    if (this.config.enablePhysics) {
      this.physicsBodies.set(fullTarget.id, {
        position: fullTarget.position.clone(),
        velocity: Vector2D.zero(),
        acceleration: Vector2D.zero(),
        mass: fullTarget.mass
      });
    }

    this.invalidateCache();
    console.log(`EnhancedMagneticSnapping: Added magnetic target ${fullTarget.id}`);
  }

  /**
   * 移除磁性目标
   */
  removeMagneticTarget(id: string): void {
    if (this.targets.delete(id)) {
      this.physicsBodies.delete(id);
      this.removeConstraintsByTarget(id);
      
      if (this.config.enableSpatialPartition) {
        this.updateSpatialPartition();
      }
      
      this.invalidateCache();
      console.log(`EnhancedMagneticSnapping: Removed magnetic target ${id}`);
    }
  }

  /**
   * 更新磁性目标位置
   */
  updateTargetPosition(id: string, position: Vector2D): void {
    const target = this.targets.get(id);
    if (!target) return;

    target.position = position.clone();
    
    // 更新物理体位置
    const physicsBody = this.physicsBodies.get(id);
    if (physicsBody) {
      physicsBody.position = position.clone();
    }

    if (this.config.enableSpatialPartition) {
      this.updateSpatialPartition();
    }

    this.invalidateCache();
  }

  /**
   * 计算高级磁性吸附
   */
  calculateAdvancedSnap(
    position: Vector2D,
    velocity: Vector2D = Vector2D.zero(),
    objectId?: string,
    objectType?: string
  ): MagneticSnapResult {
    const startTime = performance.now();
    
    // 检查缓存
    const cacheKey = this.generateSnapCacheKey(position, velocity, objectId);
    if (this.snapCache.has(cacheKey) && this.shouldUseCache()) {
      this.stats.cacheHitRate++;
      return this.snapCache.get(cacheKey)!;
    }

    // 获取候选目标
    const candidates = this.getCandidateTargets(position, objectId);
    
    if (candidates.length === 0) {
      return this.createEmptySnapResult(position);
    }

    // 自适应距离计算
    const adaptiveDistance = this.calculateAdaptiveSnapDistance(
      position,
      velocity,
      candidates
    );

    // 过滤在范围内的目标
    const inRangeTargets = candidates.filter(target => 
      position.distanceTo(target.position) <= adaptiveDistance
    );

    if (inRangeTargets.length === 0) {
      return this.createEmptySnapResult(position);
    }

    // 多级磁性计算
    const snapResult = this.calculateMultiLevelMagneticSnap(
      position,
      velocity,
      inRangeTargets,
      adaptiveDistance,
      objectId,
      objectType
    );

    // 物理仿真增强
    if (this.config.enablePhysics) {
      this.enhanceWithPhysics(snapResult, velocity);
    }

    // 视觉反馈生成
    if (this.config.showMagneticField || this.config.showSnapRadius) {
      this.generateVisualFeedback(snapResult);
    }

    // 缓存结果
    this.snapCache.set(cacheKey, snapResult);
    
    const calculationTime = performance.now() - startTime;
    this.updateStats(calculationTime);

    return snapResult;
  }

  /**
   * 多级磁性计算
   */
  private calculateMultiLevelMagneticSnap(
    position: Vector2D,
    velocity: Vector2D,
    targets: MagneticTarget[],
    maxDistance: number,
    objectId?: string,
    objectType?: string
  ): MagneticSnapResult {
    const originalPosition = position.clone();
    let snappedPosition = position.clone();
    let totalSnapForce = Vector2D.zero();
    const activeTargets: MagneticTarget[] = [];

    // 按优先级和距离排序目标
    const sortedTargets = targets
      .map(target => ({
        target,
        distance: position.distanceTo(target.position),
        priority: target.priority
      }))
      .sort((a, b) => {
        // 首先按优先级排序
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // 然后按距离排序
        return a.distance - b.distance;
      })
      .slice(0, this.config.maxSimultaneousSnaps);

    let maxSnapStrength = 0;
    let dominantTarget: MagneticTarget | null = null;

    // 计算每个目标的磁性效果
    for (const { target, distance } of sortedTargets) {
      // 检查约束
      if (!this.checkConstraints(target, objectId, objectType)) {
        continue;
      }

      // 计算磁性强度
      const magneticStrength = this.calculateMagneticStrength(
        target,
        distance,
        velocity,
        maxDistance
      );

      if (magneticStrength <= 0.01) continue;

      // 计算磁性力
      const magneticForce = this.calculateMagneticForce(
        position,
        target,
        distance,
        magneticStrength
      );

      totalSnapForce = totalSnapForce.add(magneticForce);
      activeTargets.push(target);

      // 记录主导目标
      if (magneticStrength > maxSnapStrength) {
        maxSnapStrength = magneticStrength;
        dominantTarget = target;
      }
    }

    // 应用磁性力
    if (totalSnapForce.length() > PRECISION.EPSILON) {
      const snapAmount = this.calculateSnapAmount(totalSnapForce, velocity);
      snappedPosition = position.add(totalSnapForce.multiply(snapAmount));
      
      // 确保不会超过主导目标的位置
      if (dominantTarget) {
        const maxSnapDistance = position.distanceTo(dominantTarget.position);
        const currentSnapDistance = position.distanceTo(snappedPosition);
        
        if (currentSnapDistance > maxSnapDistance) {
          const direction = snappedPosition.subtract(position).normalize();
          snappedPosition = position.add(direction.multiply(maxSnapDistance * 0.8));
        }
      }
    }

    // 应用精度修正
    snappedPosition = new Vector2D(
      preciseRound(snappedPosition.x, 3),
      preciseRound(snappedPosition.y, 3)
    );

    return {
      snappedPosition,
      originalPosition,
      activeTargets,
      snapStrength: maxSnapStrength,
      snapDistance: originalPosition.distanceTo(snappedPosition),
      snapForce: totalSnapForce,
      transitionTime: this.calculateTransitionTime(maxSnapStrength, velocity),
      velocity: this.calculateResultVelocity(velocity, totalSnapForce),
      acceleration: totalSnapForce.divide(1.0), // 假设单位质量
      showGuides: activeTargets.length > 0
    };
  }

  /**
   * 自适应吸附距离计算
   */
  private calculateAdaptiveSnapDistance(
    position: Vector2D,
    velocity: Vector2D,
    candidates: MagneticTarget[]
  ): number {
    if (!this.config.adaptiveMode) {
      return this.config.baseSnapDistance;
    }

    let adaptiveDistance = this.config.baseSnapDistance;

    // 1. 基于速度调整
    const speed = velocity.length();
    const speedFactor = MathUtils.clamp(speed / 100, 0.5, 2.0); // 速度影响因子
    adaptiveDistance *= speedFactor;

    // 2. 基于目标密度调整
    const nearbyTargets = candidates.filter(target =>
      position.distanceTo(target.position) <= this.config.maxSnapDistance
    );
    
    const densityFactor = MathUtils.clamp(nearbyTargets.length / 5, 0.5, 1.5);
    adaptiveDistance *= densityFactor;

    // 3. 基于目标强度调整
    if (nearbyTargets.length > 0) {
      const avgStrength = nearbyTargets.reduce((sum, t) => sum + t.strength, 0) / nearbyTargets.length;
      const strengthFactor = MathUtils.clamp(avgStrength * 1.5, 0.7, 1.3);
      adaptiveDistance *= strengthFactor;
    }

    // 4. 应用全局限制
    return MathUtils.clamp(
      adaptiveDistance,
      this.config.minSnapDistance,
      this.config.maxSnapDistance
    );
  }

  /**
   * 磁性强度计算
   */
  private calculateMagneticStrength(
    target: MagneticTarget,
    distance: number,
    velocity: Vector2D,
    maxDistance: number
  ): number {
    // 基础强度
    let strength = target.strength;

    // 距离衰减 - 使用平滑的反比例函数
    const normalizedDistance = distance / maxDistance;
    const distanceAttenuation = MathUtils.smootherStep(1, 0, normalizedDistance);
    strength *= distanceAttenuation;

    // 速度影响
    const speed = velocity.length();
    const velocityFactor = MathUtils.clamp(1 - speed / 500, 0.3, 1.0);
    strength *= velocityFactor;

    // 质量影响
    strength *= Math.sqrt(target.mass);

    // 磁荷影响
    strength *= Math.abs(target.charge);

    // 全局强度调节
    strength *= this.config.globalStrength;

    return MathUtils.clamp(strength, 0, 1);
  }

  /**
   * 磁性力计算
   */
  private calculateMagneticForce(
    position: Vector2D,
    target: MagneticTarget,
    distance: number,
    strength: number
  ): Vector2D {
    if (distance < PRECISION.EPSILON) {
      return Vector2D.zero();
    }

    // 方向向量
    const direction = target.position.subtract(position).normalize();
    
    // 力的大小 - 使用物理上的磁力公式变种
    const forceMagnitude = strength * target.mass * target.charge / (distance * distance + 1);
    
    // 考虑磁荷的正负性
    const forceDirection = target.charge > 0 ? direction : direction.multiply(-1);
    
    return forceDirection.multiply(forceMagnitude);
  }

  /**
   * 获取候选目标
   */
  private getCandidateTargets(position: Vector2D, excludeId?: string): MagneticTarget[] {
    let candidates: MagneticTarget[] = [];

    if (this.config.enableSpatialPartition && this.spatialPartition) {
      // 使用空间分区快速查找
      candidates = this.querySpationalPartition(position, this.config.maxSnapDistance);
    } else {
      // 暴力查找所有目标
      candidates = Array.from(this.targets.values());
    }

    // 过滤非活跃目标和自身
    return candidates.filter(target => 
      target.isActive && 
      target.id !== excludeId
    );
  }

  /**
   * 空间分区查询
   */
  private querySpationalPartition(
    center: Vector2D,
    radius: number,
    node: SpatialPartitionNode = this.spatialPartition!
  ): MagneticTarget[] {
    if (!node) return [];

    const queryBounds = BoundingBox.fromRect(
      center.x - radius,
      center.y - radius,
      radius * 2,
      radius * 2
    );

    if (!node.bounds.intersects(queryBounds)) {
      return [];
    }

    let results: MagneticTarget[] = [...node.targets];

    if (node.children) {
      for (const child of node.children) {
        results.push(...this.querySpationalPartition(center, radius, child));
      }
    }

    return results;
  }

  /**
   * 物理仿真增强
   */
  private enhanceWithPhysics(result: MagneticSnapResult, initialVelocity: Vector2D): void {
    // 计算物理增强的速度和位置
    const deltaTime = this.updateInterval / 1000; // 转换为秒
    
    // 考虑摩擦力
    const frictionForce = initialVelocity.multiply(-this.config.friction);
    const totalAcceleration = result.acceleration.add(frictionForce);
    
    // 更新速度（考虑阻尼）
    result.velocity = initialVelocity
      .add(totalAcceleration.multiply(deltaTime))
      .multiply(1 - this.config.dampening);
    
    // 物理约束的位置修正
    const physicsDisplacement = result.velocity.multiply(deltaTime);
    const correctedPosition = result.snappedPosition.add(physicsDisplacement.multiply(0.1));
    
    result.snappedPosition = correctedPosition;
    
    this.stats.physicUpdates++;
  }

  /**
   * 生成视觉反馈
   */
  private generateVisualFeedback(result: MagneticSnapResult): void {
    if (result.activeTargets.length === 0) return;

    if (this.config.showMagneticField) {
      result.magneticFieldVisualization = {
        fieldLines: this.generateMagneticFieldLines(result.originalPosition, result.activeTargets),
        strength: result.snapStrength,
        color: this.getMagneticFieldColor(result.snapStrength)
      };
    }
  }

  /**
   * 生成磁场线
   */
  private generateMagneticFieldLines(
    position: Vector2D,
    targets: MagneticTarget[]
  ): Vector2D[][] {
    const fieldLines: Vector2D[][] = [];
    const lineCount = Math.min(targets.length * 2, 8);

    for (let i = 0; i < lineCount; i++) {
      const angle = (2 * Math.PI * i) / lineCount;
      const startPoint = position.add(new Vector2D(Math.cos(angle), Math.sin(angle)).multiply(10));
      
      const line = this.traceMagneticFieldLine(startPoint, targets, 20);
      if (line.length > 1) {
        fieldLines.push(line);
      }
    }

    return fieldLines;
  }

  /**
   * 追踪磁场线
   */
  private traceMagneticFieldLine(
    start: Vector2D,
    targets: MagneticTarget[],
    steps: number
  ): Vector2D[] {
    const line: Vector2D[] = [start];
    let currentPoint = start.clone();
    
    for (let step = 0; step < steps; step++) {
      let totalField = Vector2D.zero();
      
      for (const target of targets) {
        const distance = currentPoint.distanceTo(target.position);
        if (distance < 5) break; // 到达目标
        
        const fieldStrength = target.strength / (distance * distance + 1);
        const direction = target.position.subtract(currentPoint).normalize();
        totalField = totalField.add(direction.multiply(fieldStrength));
      }
      
      if (totalField.length() < 0.01) break;
      
      const stepSize = 2;
      currentPoint = currentPoint.add(totalField.normalize().multiply(stepSize));
      line.push(currentPoint.clone());
    }
    
    return line;
  }

  /**
   * 获取磁场颜色
   */
  private getMagneticFieldColor(strength: number): string {
    const intensity = Math.floor(strength * 255);
    return `rgba(59, 130, 246, ${strength * this.config.magneticFieldOpacity})`;
  }

  /**
   * 添加磁性约束
   */
  addMagneticConstraint(constraint: Omit<MagneticConstraint, 'id'>): string {
    const id = `constraint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullConstraint: MagneticConstraint = {
      id,
      ...constraint
    };
    
    this.constraints.set(id, fullConstraint);
    this.invalidateCache();
    
    return id;
  }

  /**
   * 移除磁性约束
   */
  removeMagneticConstraint(id: string): boolean {
    const removed = this.constraints.delete(id);
    if (removed) {
      this.invalidateCache();
    }
    return removed;
  }

  /**
   * 检查约束条件
   */
  private checkConstraints(
    target: MagneticTarget,
    objectId?: string,
    objectType?: string
  ): boolean {
    // 检查目标自身约束
    if (target.constraints) {
      const { maxSnapCount, allowedTypes, exclusions } = target.constraints;
      
      if (exclusions && objectId && exclusions.includes(objectId)) {
        return false;
      }
      
      if (allowedTypes && objectType && !allowedTypes.includes(objectType)) {
        return false;
      }
    }

    // 检查全局磁性约束
    for (const constraint of this.constraints.values()) {
      if (!constraint.enabled) continue;
      
      const isSourceMatch = constraint.sourceId === objectId || constraint.sourceId === target.id;
      const isTargetMatch = constraint.targetId === objectId || constraint.targetId === target.id;
      
      if (isSourceMatch || isTargetMatch) {
        if (constraint.type === 'repulsive') {
          return false; // 排斥约束
        }
      }
    }

    return true;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MagneticSnapConfig>): void {
    Object.assign(this.config, newConfig);
    
    if (newConfig.updateFrequency) {
      this.updateInterval = 1000 / newConfig.updateFrequency;
    }
    
    if (newConfig.enableSpatialPartition !== undefined) {
      if (newConfig.enableSpatialPartition) {
        this.updateSpatialPartition();
      } else {
        this.spatialPartition = null;
      }
    }
    
    this.invalidateCache();
    console.log('EnhancedMagneticSnapping: Configuration updated');
  }

  /**
   * 获取磁性统计信息
   */
  getMagneticStats(): {
    totalTargets: number;
    activeTargets: number;
    totalConstraints: number;
    totalSnaps: number;
    averageSnapTime: number;
    cacheHitRate: number;
    physicUpdates: number;
    memoryUsage: number;
  } {
    return {
      totalTargets: this.targets.size,
      activeTargets: Array.from(this.targets.values()).filter(t => t.isActive).length,
      totalConstraints: this.constraints.size,
      totalSnaps: this.stats.totalSnaps,
      averageSnapTime: this.stats.averageSnapTime,
      cacheHitRate: this.stats.cacheHitRate,
      physicUpdates: this.stats.physicUpdates,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // ========== 辅助方法 ==========

  private initializeSpatialPartition(): void {
    if (!this.config.enableSpatialPartition) return;
    
    // 初始化四叉树根节点
    this.spatialPartition = {
      bounds: BoundingBox.fromRect(-1000, -1000, 2000, 2000),
      targets: [],
      depth: 0
    };
  }

  private updateSpatialPartition(): void {
    if (!this.config.enableSpatialPartition) return;
    
    // 重新构建空间分区
    this.spatialPartition = this.buildSpatialPartition(
      Array.from(this.targets.values()),
      BoundingBox.fromRect(-1000, -1000, 2000, 2000),
      0
    );
  }

  private buildSpatialPartition(
    targets: MagneticTarget[],
    bounds: BoundingBox,
    depth: number
  ): SpatialPartitionNode {
    const maxDepth = 6;
    const maxTargetsPerNode = 10;
    
    const node: SpatialPartitionNode = {
      bounds,
      targets: [],
      depth
    };

    if (targets.length <= maxTargetsPerNode || depth >= maxDepth) {
      node.targets = targets;
      return node;
    }

    // 分割成四个象限
    const centerX = bounds.center.x;
    const centerY = bounds.center.y;
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;

    const quadrants = [
      BoundingBox.fromRect(bounds.min.x, bounds.min.y, halfWidth, halfHeight),
      BoundingBox.fromRect(centerX, bounds.min.y, halfWidth, halfHeight),
      BoundingBox.fromRect(bounds.min.x, centerY, halfWidth, halfHeight),
      BoundingBox.fromRect(centerX, centerY, halfWidth, halfHeight)
    ];

    node.children = [];
    
    for (const quadrant of quadrants) {
      const quadrantTargets = targets.filter(target =>
        quadrant.containsPoint(target.position)
      );
      
      const childNode = this.buildSpatialPartition(quadrantTargets, quadrant, depth + 1);
      node.children.push(childNode);
    }

    return node;
  }

  private removeConstraintsByTarget(targetId: string): void {
    const toRemove: string[] = [];
    
    for (const [id, constraint] of this.constraints) {
      if (constraint.sourceId === targetId || constraint.targetId === targetId) {
        toRemove.push(id);
      }
    }
    
    toRemove.forEach(id => this.constraints.delete(id));
  }

  private generateSnapCacheKey(
    position: Vector2D,
    velocity: Vector2D,
    objectId?: string
  ): string {
    const posKey = `${preciseRound(position.x, 1)},${preciseRound(position.y, 1)}`;
    const velKey = `${preciseRound(velocity.x, 1)},${preciseRound(velocity.y, 1)}`;
    return `${posKey}_${velKey}_${objectId || 'null'}`;
  }

  private shouldUseCache(): boolean {
    const now = performance.now();
    return (now - this.lastUpdateTime) < (this.updateInterval * 0.5);
  }

  private createEmptySnapResult(position: Vector2D): MagneticSnapResult {
    return {
      snappedPosition: position.clone(),
      originalPosition: position.clone(),
      activeTargets: [],
      snapStrength: 0,
      snapDistance: 0,
      snapForce: Vector2D.zero(),
      transitionTime: 0,
      velocity: Vector2D.zero(),
      acceleration: Vector2D.zero(),
      showGuides: false
    };
  }

  private calculateSnapAmount(force: Vector2D, velocity: Vector2D): number {
    // 基于力的大小和速度调节吸附量
    const forceStrength = force.length();
    const velocityFactor = MathUtils.clamp(1 - velocity.length() / 200, 0.2, 1.0);
    return forceStrength * velocityFactor;
  }

  private calculateTransitionTime(strength: number, velocity: Vector2D): number {
    const baseTime = 0.2; // 200ms基础时间
    const strengthFactor = MathUtils.clamp(strength, 0.1, 1.0);
    const velocityFactor = MathUtils.clamp(1 - velocity.length() / 300, 0.1, 1.0);
    return baseTime * strengthFactor * velocityFactor;
  }

  private calculateResultVelocity(initialVelocity: Vector2D, snapForce: Vector2D): Vector2D {
    // 基于磁性力调整最终速度
    const dampened = initialVelocity.multiply(1 - this.config.dampening);
    const forceInfluence = snapForce.multiply(0.1);
    return dampened.add(forceInfluence);
  }

  private updateStats(calculationTime: number): void {
    this.stats.totalSnaps++;
    this.stats.averageSnapTime = (
      this.stats.averageSnapTime * (this.stats.totalSnaps - 1) + calculationTime
    ) / this.stats.totalSnaps;
    
    this.stats.activeTargets = Array.from(this.targets.values())
      .filter(t => t.isActive).length;
  }

  private invalidateCache(): void {
    this.snapCache.clear();
    this.fieldCache.clear();
    this.lastUpdateTime = performance.now();
  }

  private estimateMemoryUsage(): number {
    return (
      this.targets.size * 500 +        // 每个目标约500字节
      this.constraints.size * 200 +    // 每个约束约200字节
      this.snapCache.size * 1000 +     // 每个缓存项约1KB
      this.physicsBodies.size * 300    // 每个物理体约300字节
    );
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.targets.clear();
    this.constraints.clear();
    this.snapCache.clear();
    this.fieldCache.clear();
    this.physicsBodies.clear();
    this.spatialPartition = null;
    
    console.log('EnhancedMagneticSnapping: Resources disposed');
  }
}

/**
 * 工厂函数：创建增强磁性吸附管理器
 */
export function createEnhancedMagneticSnapping(
  config?: Partial<MagneticSnapConfig>
): EnhancedMagneticSnapping {
  return new EnhancedMagneticSnapping(config);
}

/**
 * 工厂函数：创建高性能磁性吸附管理器
 */
export function createHighPerformanceMagneticSnapping(): EnhancedMagneticSnapping {
  return new EnhancedMagneticSnapping({
    globalStrength: MagneticStrength.STRONG,
    adaptiveMode: true,
    multiLevelSnapping: true,
    enablePhysics: true,
    enableSpatialPartition: true,
    maxSimultaneousSnaps: 12,
    updateFrequency: 120, // 120Hz for smooth interaction
    showMagneticField: true,
    animateSnapTransition: true
  });
}