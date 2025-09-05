/**
 * 亚像素级精度边界检测系统
 * 支持复杂形状碰撞检测、多层边界约束、智能回弹机制
 */

import { Vector2D, BoundingBox, MathUtils, PRECISION } from './math-precision';

// 边界类型定义
export type BoundaryType = 'hard' | 'soft' | 'elastic' | 'magnetic';

// 边界形状定义
export interface BoundaryShape {
  type: 'rectangle' | 'circle' | 'polygon' | 'composite';
  bounds: BoundingBox;
  properties: Record<string, any>;
}

// 碰撞检测结果
export interface CollisionResult {
  hasCollision: boolean;
  penetrationDepth: number;
  normal: Vector2D;
  contactPoint: Vector2D;
  separationVector: Vector2D;
  boundaryId?: string;
}

// 边界约束配置
export interface BoundaryConfig {
  id: string;
  type: BoundaryType;
  shape: BoundaryShape;
  priority: number;
  elasticity: number;    // 弹性系数 [0, 1]
  friction: number;      // 摩擦系数 [0, 1] 
  magnetism: number;     // 磁性强度 [0, 1]
  threshold: number;     // 激活阈值
  enabled: boolean;
}

/**
 * 高精度边界检测器
 */
export class PreciseBoundaryDetector {
  private boundaries: Map<string, BoundaryConfig> = new Map();
  private spatialIndex: SpatialIndex;
  private collisionCache: Map<string, CollisionResult> = new Map();
  private lastUpdateTime: number = 0;

  constructor() {
    this.spatialIndex = new SpatialIndex();
  }

  /**
   * 添加边界约束
   */
  addBoundary(config: BoundaryConfig): void {
    this.boundaries.set(config.id, { ...config });
    this.spatialIndex.insert(config.id, config.shape.bounds);
    this.invalidateCache();
  }

  /**
   * 移除边界约束
   */
  removeBoundary(id: string): void {
    this.boundaries.delete(id);
    this.spatialIndex.remove(id);
    this.invalidateCache();
  }

  /**
   * 更新边界配置
   */
  updateBoundary(id: string, updates: Partial<BoundaryConfig>): void {
    const boundary = this.boundaries.get(id);
    if (!boundary) return;

    Object.assign(boundary, updates);
    
    if (updates.shape) {
      this.spatialIndex.update(id, updates.shape.bounds);
    }
    
    this.invalidateCache();
  }

  /**
   * 检测点与边界的碰撞
   */
  checkPointCollision(point: Vector2D, objectSize = Vector2D.zero()): CollisionResult {
    const cacheKey = `point_${point.x}_${point.y}_${objectSize.x}_${objectSize.y}`;
    
    // 检查缓存
    if (this.collisionCache.has(cacheKey)) {
      const cached = this.collisionCache.get(cacheKey)!;
      if (performance.now() - this.lastUpdateTime < 16) { // 60 FPS缓存
        return cached;
      }
    }

    // 创建对象边界框
    const objectBounds = BoundingBox.fromRect(point.x, point.y, objectSize.x, objectSize.y);
    
    // 使用空间索引快速筛选候选边界
    const candidates = this.spatialIndex.query(objectBounds);
    
    let result: CollisionResult = {
      hasCollision: false,
      penetrationDepth: 0,
      normal: Vector2D.zero(),
      contactPoint: point.clone(),
      separationVector: Vector2D.zero()
    };

    let maxPenetration = 0;
    
    for (const boundaryId of candidates) {
      const boundary = this.boundaries.get(boundaryId);
      if (!boundary || !boundary.enabled) continue;

      const collision = this.checkShapeCollision(objectBounds, boundary.shape);
      
      if (collision.hasCollision && collision.penetrationDepth > maxPenetration) {
        maxPenetration = collision.penetrationDepth;
        result = {
          ...collision,
          boundaryId
        };
      }
    }

    // 缓存结果
    this.collisionCache.set(cacheKey, result);
    return result;
  }

  /**
   * 应用边界约束到位置
   */
  constrainPosition(
    position: Vector2D, 
    objectSize = Vector2D.zero(),
    velocity = Vector2D.zero()
  ): {
    constrainedPosition: Vector2D;
    constrainedVelocity: Vector2D;
    appliedForces: Vector2D[];
  } {
    let constrainedPosition = position.clone();
    let constrainedVelocity = velocity.clone();
    const appliedForces: Vector2D[] = [];

    // 按优先级排序边界
    const sortedBoundaries = Array.from(this.boundaries.values())
      .filter(b => b.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const boundary of sortedBoundaries) {
      const collision = this.checkPointCollision(constrainedPosition, objectSize);
      
      if (collision.hasCollision && collision.boundaryId === boundary.id) {
        const result = this.applyBoundaryConstraint(
          constrainedPosition,
          constrainedVelocity,
          collision,
          boundary
        );
        
        constrainedPosition = result.position;
        constrainedVelocity = result.velocity;
        
        if (result.appliedForce.length() > PRECISION.EPSILON) {
          appliedForces.push(result.appliedForce);
        }
      }
    }

    return {
      constrainedPosition,
      constrainedVelocity,
      appliedForces
    };
  }

  /**
   * 应用单个边界约束
   */
  private applyBoundaryConstraint(
    position: Vector2D,
    velocity: Vector2D,
    collision: CollisionResult,
    boundary: BoundaryConfig
  ): {
    position: Vector2D;
    velocity: Vector2D;
    appliedForce: Vector2D;
  } {
    let newPosition = position.clone();
    let newVelocity = velocity.clone();
    let appliedForce = Vector2D.zero();

    switch (boundary.type) {
      case 'hard':
        // 硬边界：完全阻止穿透
        newPosition = position.subtract(collision.separationVector);
        newVelocity = this.reflectVelocity(velocity, collision.normal, 0);
        break;

      case 'soft':
        // 软边界：渐进阻力
        const resistance = this.calculateSoftBoundaryResistance(
          collision.penetrationDepth,
          boundary.threshold
        );
        const resistanceForce = collision.normal.multiply(-resistance * velocity.length());
        appliedForce = resistanceForce;
        newVelocity = velocity.add(resistanceForce);
        break;

      case 'elastic':
        // 弹性边界：反弹
        newPosition = position.subtract(collision.separationVector.multiply(0.8));
        newVelocity = this.reflectVelocity(velocity, collision.normal, boundary.elasticity);
        appliedForce = collision.normal.multiply(collision.penetrationDepth * boundary.elasticity);
        break;

      case 'magnetic':
        // 磁性边界：吸引效果
        if (collision.penetrationDepth < boundary.threshold) {
          const magneticForce = this.calculateMagneticForce(
            position,
            collision.contactPoint,
            boundary.magnetism
          );
          appliedForce = magneticForce;
          newVelocity = velocity.add(magneticForce);
        }
        break;
    }

    // 应用摩擦
    if (boundary.friction > 0 && collision.hasCollision) {
      const frictionForce = this.calculateFriction(newVelocity, collision.normal, boundary.friction);
      newVelocity = newVelocity.subtract(frictionForce);
    }

    return {
      position: newPosition,
      velocity: newVelocity,
      appliedForce
    };
  }

  /**
   * 检测形状碰撞
   */
  private checkShapeCollision(objectBounds: BoundingBox, shape: BoundaryShape): CollisionResult {
    switch (shape.type) {
      case 'rectangle':
        return this.checkRectangleCollision(objectBounds, shape);
      case 'circle':
        return this.checkCircleCollision(objectBounds, shape);
      case 'polygon':
        return this.checkPolygonCollision(objectBounds, shape);
      case 'composite':
        return this.checkCompositeCollision(objectBounds, shape);
      default:
        return {
          hasCollision: false,
          penetrationDepth: 0,
          normal: Vector2D.zero(),
          contactPoint: Vector2D.zero(),
          separationVector: Vector2D.zero()
        };
    }
  }

  /**
   * 矩形碰撞检测
   */
  private checkRectangleCollision(objectBounds: BoundingBox, shape: BoundaryShape): CollisionResult {
    const intersection = objectBounds.intersection(shape.bounds);
    
    if (!intersection) {
      return {
        hasCollision: false,
        penetrationDepth: 0,
        normal: Vector2D.zero(),
        contactPoint: Vector2D.zero(),
        separationVector: Vector2D.zero()
      };
    }

    // 计算穿透深度和分离向量
    const objectCenter = objectBounds.center;
    const boundaryCenter = shape.bounds.center;
    const direction = objectCenter.subtract(boundaryCenter);

    // 选择最小穿透轴
    const xPenetration = Math.min(
      objectBounds.max.x - shape.bounds.min.x,
      shape.bounds.max.x - objectBounds.min.x
    );
    const yPenetration = Math.min(
      objectBounds.max.y - shape.bounds.min.y,
      shape.bounds.max.y - objectBounds.min.y
    );

    let normal: Vector2D;
    let penetrationDepth: number;

    if (xPenetration < yPenetration) {
      penetrationDepth = xPenetration;
      normal = new Vector2D(direction.x > 0 ? 1 : -1, 0);
    } else {
      penetrationDepth = yPenetration;
      normal = new Vector2D(0, direction.y > 0 ? 1 : -1);
    }

    const separationVector = normal.multiply(penetrationDepth);
    const contactPoint = objectCenter.subtract(separationVector.multiply(0.5));

    return {
      hasCollision: true,
      penetrationDepth,
      normal,
      contactPoint,
      separationVector
    };
  }

  /**
   * 圆形碰撞检测
   */
  private checkCircleCollision(objectBounds: BoundingBox, shape: BoundaryShape): CollisionResult {
    const circleCenter = shape.bounds.center;
    const circleRadius = shape.properties.radius || shape.bounds.width / 2;
    
    const objectCenter = objectBounds.center;
    const objectRadius = Math.max(objectBounds.width, objectBounds.height) / 2;
    
    const distance = objectCenter.distanceTo(circleCenter);
    const totalRadius = circleRadius + objectRadius;
    
    if (distance >= totalRadius) {
      return {
        hasCollision: false,
        penetrationDepth: 0,
        normal: Vector2D.zero(),
        contactPoint: Vector2D.zero(),
        separationVector: Vector2D.zero()
      };
    }

    const penetrationDepth = totalRadius - distance;
    const normal = objectCenter.subtract(circleCenter).normalize();
    const separationVector = normal.multiply(penetrationDepth);
    const contactPoint = circleCenter.add(normal.multiply(circleRadius));

    return {
      hasCollision: true,
      penetrationDepth,
      normal,
      contactPoint,
      separationVector
    };
  }

  /**
   * 多边形碰撞检测 (SAT算法)
   */
  private checkPolygonCollision(objectBounds: BoundingBox, shape: BoundaryShape): CollisionResult {
    // 简化实现：将对象边界框转换为多边形进行SAT检测
    const objectVertices = [
      objectBounds.min,
      new Vector2D(objectBounds.max.x, objectBounds.min.y),
      objectBounds.max,
      new Vector2D(objectBounds.min.x, objectBounds.max.y)
    ];
    
    const polygonVertices = shape.properties.vertices as Vector2D[] || [];
    
    // 使用SAT算法检测碰撞
    return this.separatingAxisTest(objectVertices, polygonVertices);
  }

  /**
   * 复合形状碰撞检测
   */
  private checkCompositeCollision(objectBounds: BoundingBox, shape: BoundaryShape): CollisionResult {
    const subShapes = shape.properties.shapes as BoundaryShape[] || [];
    let maxPenetrationResult: CollisionResult = {
      hasCollision: false,
      penetrationDepth: 0,
      normal: Vector2D.zero(),
      contactPoint: Vector2D.zero(),
      separationVector: Vector2D.zero()
    };

    for (const subShape of subShapes) {
      const collision = this.checkShapeCollision(objectBounds, subShape);
      
      if (collision.hasCollision && collision.penetrationDepth > maxPenetrationResult.penetrationDepth) {
        maxPenetrationResult = collision;
      }
    }

    return maxPenetrationResult;
  }

  /**
   * 分离轴测试 (SAT)
   */
  private separatingAxisTest(verticesA: Vector2D[], verticesB: Vector2D[]): CollisionResult {
    // 简化的SAT实现
    let minOverlap = Infinity;
    let separationAxis = Vector2D.zero();

    const allVertices = [...verticesA, ...verticesB];
    const axes: Vector2D[] = [];

    // 获取所有边的法向量作为分离轴
    for (let i = 0; i < allVertices.length; i++) {
      const current = allVertices[i];
      const next = allVertices[(i + 1) % allVertices.length];
      const edge = next.subtract(current);
      const normal = new Vector2D(-edge.y, edge.x).normalize();
      axes.push(normal);
    }

    for (const axis of axes) {
      const projectionA = this.projectPolygon(verticesA, axis);
      const projectionB = this.projectPolygon(verticesB, axis);

      const overlap = Math.min(projectionA.max, projectionB.max) - Math.max(projectionA.min, projectionB.min);
      
      if (overlap <= 0) {
        // 找到分离轴，没有碰撞
        return {
          hasCollision: false,
          penetrationDepth: 0,
          normal: Vector2D.zero(),
          contactPoint: Vector2D.zero(),
          separationVector: Vector2D.zero()
        };
      }

      if (overlap < minOverlap) {
        minOverlap = overlap;
        separationAxis = axis;
      }
    }

    // 有碰撞，返回最小重叠信息
    const separationVector = separationAxis.multiply(minOverlap);
    const centerA = this.getPolygonCenter(verticesA);
    const centerB = this.getPolygonCenter(verticesB);
    const contactPoint = centerA.add(centerB).divide(2);

    return {
      hasCollision: true,
      penetrationDepth: minOverlap,
      normal: separationAxis,
      contactPoint,
      separationVector
    };
  }

  /**
   * 投影多边形到轴
   */
  private projectPolygon(vertices: Vector2D[], axis: Vector2D): { min: number; max: number } {
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
   * 获取多边形中心
   */
  private getPolygonCenter(vertices: Vector2D[]): Vector2D {
    const sum = vertices.reduce((acc, vertex) => acc.add(vertex), Vector2D.zero());
    return sum.divide(vertices.length);
  }

  /**
   * 计算软边界阻力
   */
  private calculateSoftBoundaryResistance(penetrationDepth: number, threshold: number): number {
    if (penetrationDepth <= 0) return 0;
    
    const normalizedPenetration = Math.min(penetrationDepth / threshold, 1);
    return MathUtils.smootherStep(0, 1, normalizedPenetration);
  }

  /**
   * 计算磁性力
   */
  private calculateMagneticForce(position: Vector2D, target: Vector2D, magnetism: number): Vector2D {
    const direction = target.subtract(position);
    const distance = direction.length();
    
    if (distance < PRECISION.EPSILON) return Vector2D.zero();
    
    const normalizedDirection = direction.normalize();
    const force = magnetism / (distance * distance); // 反平方律
    
    return normalizedDirection.multiply(force);
  }

  /**
   * 反射速度
   */
  private reflectVelocity(velocity: Vector2D, normal: Vector2D, restitution: number): Vector2D {
    const normalVelocity = normal.multiply(velocity.dot(normal));
    const tangentialVelocity = velocity.subtract(normalVelocity);
    
    return tangentialVelocity.subtract(normalVelocity.multiply(restitution));
  }

  /**
   * 计算摩擦力
   */
  private calculateFriction(velocity: Vector2D, normal: Vector2D, frictionCoefficient: number): Vector2D {
    const normalVelocity = normal.multiply(velocity.dot(normal));
    const tangentialVelocity = velocity.subtract(normalVelocity);
    
    const frictionMagnitude = Math.min(tangentialVelocity.length() * frictionCoefficient, tangentialVelocity.length());
    
    if (tangentialVelocity.length() < PRECISION.EPSILON) {
      return Vector2D.zero();
    }
    
    return tangentialVelocity.normalize().multiply(frictionMagnitude);
  }

  /**
   * 清空缓存
   */
  private invalidateCache(): void {
    this.collisionCache.clear();
    this.lastUpdateTime = performance.now();
  }

  /**
   * 获取边界统计信息
   */
  getStats(): {
    boundaryCount: number;
    cacheSize: number;
    lastUpdateTime: number;
  } {
    return {
      boundaryCount: this.boundaries.size,
      cacheSize: this.collisionCache.size,
      lastUpdateTime: this.lastUpdateTime
    };
  }
}

/**
 * 空间索引 - 用于快速碰撞检测
 */
class SpatialIndex {
  private items: Map<string, BoundingBox> = new Map();

  insert(id: string, bounds: BoundingBox): void {
    this.items.set(id, bounds);
  }

  remove(id: string): void {
    this.items.delete(id);
  }

  update(id: string, bounds: BoundingBox): void {
    this.items.set(id, bounds);
  }

  query(queryBounds: BoundingBox): string[] {
    const results: string[] = [];
    
    for (const [id, bounds] of this.items) {
      if (bounds.intersects(queryBounds)) {
        results.push(id);
      }
    }
    
    return results;
  }

  clear(): void {
    this.items.clear();
  }
}

/**
 * 工厂函数：创建标准边界检测器
 */
export function createStandardBoundaryDetector(): PreciseBoundaryDetector {
  return new PreciseBoundaryDetector();
}

/**
 * 工厂函数：创建画布边界约束
 */
export function createCanvasBoundary(
  width: number, 
  height: number, 
  margin = 0,
  type: BoundaryType = 'elastic'
): BoundaryConfig {
  return {
    id: 'canvas-boundary',
    type,
    shape: {
      type: 'rectangle',
      bounds: BoundingBox.fromRect(margin, margin, width - 2 * margin, height - 2 * margin),
      properties: {}
    },
    priority: 1000,
    elasticity: 0.8,
    friction: 0.1,
    magnetism: 0,
    threshold: 20,
    enabled: true
  };
}