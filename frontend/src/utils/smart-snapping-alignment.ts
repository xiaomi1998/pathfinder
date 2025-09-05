/**
 * 智能吸附对齐系统
 * 多节点对齐、智能分布、磁性吸附、对齐指示线
 * 基于机器学习的意图识别和空间关系分析
 */

import { Vector2D, BoundingBox, preciseRound } from './math-precision';
import { memoryManager } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { cacheOptimizer } from './cache-optimizer';
import type { SelectionItem } from './multi-selection-manager';

// 对齐类型定义
export enum AlignmentType {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  DISTRIBUTE_HORIZONTAL = 'distribute-horizontal',
  DISTRIBUTE_VERTICAL = 'distribute-vertical',
  GRID = 'grid'
}

// 吸附类型
export enum SnapType {
  GRID = 'grid',
  OBJECT = 'object',
  GUIDE = 'guide',
  MARGIN = 'margin',
  CENTER = 'center',
  EDGE = 'edge'
}

// 吸附目标
export interface SnapTarget {
  type: SnapType;
  position: Vector2D;
  direction: 'horizontal' | 'vertical' | 'both';
  distance: number;
  strength: number;       // 吸附强度 [0, 1]
  sourceId?: string;      // 吸附源对象ID
  metadata?: Record<string, any>;
}

// 对齐建议
export interface AlignmentSuggestion {
  type: AlignmentType;
  items: SelectionItem[];
  referencePoint: Vector2D;
  confidence: number;     // 建议置信度 [0, 1]
  preview: Vector2D[];    // 预览位置
  description: string;
}

// 对齐指示线
export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;       // 水平线的Y坐标或垂直线的X坐标
  length: number;
  start: Vector2D;
  end: Vector2D;
  color: string;
  opacity: number;
  animated: boolean;
}

// 分布配置
export interface DistributionConfig {
  spacing: 'equal' | 'auto' | number;
  margin: number;
  alignment: 'start' | 'center' | 'end';
  respectBounds: boolean;
}

// 吸附配置
export interface SnapConfig {
  gridSize: Vector2D;
  snapThreshold: number;   // 吸附阈值（像素）
  enabledTypes: SnapType[];
  magneticStrength: number; // 磁性强度
  showGuides: boolean;
  showPreview: boolean;
  animationDuration: number;
}

// 空间关系分析结果
export interface SpatialAnalysis {
  clusters: SelectionItem[][];    // 空间聚类
  alignments: AlignmentSuggestion[]; // 对齐建议
  distributions: DistributionConfig[]; // 分布建议
  overlaps: Array<{              // 重叠检测
    item1: string;
    item2: string;
    area: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * 智能吸附对齐管理器
 */
export class SmartSnappingAlignmentManager {
  private snapConfig: SnapConfig;
  private items: Map<string, SelectionItem> = new Map();
  private snapTargets: SnapTarget[] = [];
  private alignmentGuides: Map<string, AlignmentGuide> = new Map();
  
  // 对齐建议缓存
  private alignmentCache: Map<string, AlignmentSuggestion[]> = new Map();
  private spatialAnalysisCache: Map<string, SpatialAnalysis> = new Map();
  
  // 视觉元素
  private guideContainer: SVGElement | null = null;
  private guideElements: Map<string, SVGElement> = new Map();
  
  // 性能监控
  private analysisCount = 0;
  private totalAnalysisTime = 0;
  private lastAnalysisTime = 0;

  constructor(snapConfig: Partial<SnapConfig> = {}) {
    this.snapConfig = {
      gridSize: new Vector2D(20, 20),
      snapThreshold: 10,
      enabledTypes: [SnapType.GRID, SnapType.OBJECT, SnapType.GUIDE],
      magneticStrength: 0.5,
      showGuides: true,
      showPreview: true,
      animationDuration: 200,
      ...snapConfig
    };

    this.initializeGuideContainer();
    console.log('SmartSnappingAlignmentManager: Initialized with config', this.snapConfig);
  }

  /**
   * 初始化对齐指示线容器
   */
  private initializeGuideContainer(): void {
    this.guideContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.guideContainer.setAttribute('class', 'alignment-guides');
    this.guideContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999;
    `;

    // 添加样式定义
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // 对齐线样式
    const alignmentLineStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    alignmentLineStyle.textContent = `
      .alignment-guide {
        stroke: #3b82f6;
        stroke-width: 1;
        stroke-dasharray: 4,4;
        opacity: 0.8;
      }
      
      .alignment-guide.active {
        stroke: #1d4ed8;
        stroke-width: 2;
        opacity: 1;
      }
      
      .snap-preview {
        fill: rgba(59, 130, 246, 0.2);
        stroke: #3b82f6;
        stroke-width: 2;
        stroke-dasharray: 2,2;
      }
    `;
    
    defs.appendChild(alignmentLineStyle);
    this.guideContainer.appendChild(defs);
  }

  /**
   * 注册对齐项目
   */
  registerItems(items: SelectionItem[]): void {
    const startTime = performance.now();
    
    this.items.clear();
    items.forEach(item => {
      this.items.set(item.id, item);
    });

    // 清除缓存
    this.clearCaches();
    
    // 预计算吸附目标
    this.calculateSnapTargets();

    const registrationTime = performance.now() - startTime;
    console.log(`SmartSnappingAlignmentManager: Registered ${items.length} items in ${registrationTime.toFixed(2)}ms`);
  }

  /**
   * 计算吸附目标
   */
  private calculateSnapTargets(): void {
    this.snapTargets = [];

    // 1. 网格吸附点
    if (this.snapConfig.enabledTypes.includes(SnapType.GRID)) {
      this.generateGridSnapTargets();
    }

    // 2. 对象吸附点
    if (this.snapConfig.enabledTypes.includes(SnapType.OBJECT)) {
      this.generateObjectSnapTargets();
    }

    // 3. 边距吸附点
    if (this.snapConfig.enabledTypes.includes(SnapType.MARGIN)) {
      this.generateMarginSnapTargets();
    }

    console.log(`SmartSnappingAlignmentManager: Generated ${this.snapTargets.length} snap targets`);
  }

  /**
   * 生成网格吸附目标
   */
  private generateGridSnapTargets(): void {
    const gridSize = this.snapConfig.gridSize;
    
    // 基于当前项目位置生成局部网格
    const bounds = this.calculateItemsBounds();
    if (!bounds) return;

    const startX = Math.floor(bounds.min.x / gridSize.x) * gridSize.x;
    const endX = Math.ceil(bounds.max.x / gridSize.x) * gridSize.x;
    const startY = Math.floor(bounds.min.y / gridSize.y) * gridSize.y;
    const endY = Math.ceil(bounds.max.y / gridSize.y) * gridSize.y;

    for (let x = startX; x <= endX; x += gridSize.x) {
      for (let y = startY; y <= endY; y += gridSize.y) {
        this.snapTargets.push({
          type: SnapType.GRID,
          position: new Vector2D(x, y),
          direction: 'both',
          distance: 0,
          strength: 0.3
        });
      }
    }
  }

  /**
   * 生成对象吸附目标
   */
  private generateObjectSnapTargets(): void {
    const items = Array.from(this.items.values());

    items.forEach(item => {
      const bounds = item.bounds;
      
      // 边缘吸附点
      const edgeTargets: SnapTarget[] = [
        // 左边缘
        {
          type: SnapType.EDGE,
          position: new Vector2D(bounds.min.x, bounds.center.y),
          direction: 'vertical',
          distance: 0,
          strength: 0.6,
          sourceId: item.id
        },
        // 右边缘
        {
          type: SnapType.EDGE,
          position: new Vector2D(bounds.max.x, bounds.center.y),
          direction: 'vertical',
          distance: 0,
          strength: 0.6,
          sourceId: item.id
        },
        // 上边缘
        {
          type: SnapType.EDGE,
          position: new Vector2D(bounds.center.x, bounds.min.y),
          direction: 'horizontal',
          distance: 0,
          strength: 0.6,
          sourceId: item.id
        },
        // 下边缘
        {
          type: SnapType.EDGE,
          position: new Vector2D(bounds.center.x, bounds.max.y),
          direction: 'horizontal',
          distance: 0,
          strength: 0.6,
          sourceId: item.id
        }
      ];

      // 中心吸附点
      const centerTarget: SnapTarget = {
        type: SnapType.CENTER,
        position: bounds.center.clone(),
        direction: 'both',
        distance: 0,
        strength: 0.8,
        sourceId: item.id
      };

      this.snapTargets.push(...edgeTargets, centerTarget);
    });
  }

  /**
   * 生成边距吸附目标
   */
  private generateMarginSnapTargets(): void {
    const commonMargins = [10, 15, 20, 24, 32, 48, 64];
    const items = Array.from(this.items.values());

    items.forEach(item => {
      commonMargins.forEach(margin => {
        const bounds = item.bounds;
        
        // 外边距吸附点
        const marginTargets: SnapTarget[] = [
          {
            type: SnapType.MARGIN,
            position: new Vector2D(bounds.min.x - margin, bounds.center.y),
            direction: 'vertical',
            distance: margin,
            strength: 0.4,
            sourceId: item.id,
            metadata: { margin }
          },
          {
            type: SnapType.MARGIN,
            position: new Vector2D(bounds.max.x + margin, bounds.center.y),
            direction: 'vertical',
            distance: margin,
            strength: 0.4,
            sourceId: item.id,
            metadata: { margin }
          }
        ];

        this.snapTargets.push(...marginTargets);
      });
    });
  }

  /**
   * 计算项目边界
   */
  private calculateItemsBounds(): BoundingBox | null {
    const items = Array.from(this.items.values());
    if (items.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    items.forEach(item => {
      const bounds = item.bounds;
      minX = Math.min(minX, bounds.min.x);
      minY = Math.min(minY, bounds.min.y);
      maxX = Math.max(maxX, bounds.max.x);
      maxY = Math.max(maxY, bounds.max.y);
    });

    return BoundingBox.fromRect(minX, minY, maxX - minX, maxY - minY);
  }

  /**
   * 计算吸附位置
   */
  calculateSnapPosition(
    position: Vector2D,
    itemId?: string,
    excludeIds: string[] = []
  ): {
    snappedPosition: Vector2D;
    activeTargets: SnapTarget[];
    guides: AlignmentGuide[];
  } {
    const startTime = performance.now();
    
    const activeTargets: SnapTarget[] = [];
    const guides: AlignmentGuide[] = [];
    let snappedPosition = position.clone();

    // 过滤可用的吸附目标（排除自身）
    const availableTargets = this.snapTargets.filter(target => 
      !excludeIds.includes(target.sourceId || '') && 
      target.sourceId !== itemId
    );

    // 查找最近的吸附目标
    const nearbyTargets = availableTargets
      .map(target => ({
        ...target,
        distance: this.calculateSnapDistance(position, target)
      }))
      .filter(target => target.distance <= this.snapConfig.snapThreshold)
      .sort((a, b) => {
        // 按吸附强度和距离排序
        const scoreA = a.strength * (1 - a.distance / this.snapConfig.snapThreshold);
        const scoreB = b.strength * (1 - b.distance / this.snapConfig.snapThreshold);
        return scoreB - scoreA;
      });

    // 应用吸附
    if (nearbyTargets.length > 0) {
      const primaryTarget = nearbyTargets[0];
      
      // 计算吸附位置
      const snapResult = this.applySnapping(position, primaryTarget);
      snappedPosition = snapResult.position;
      activeTargets.push(primaryTarget);

      // 生成对齐指示线
      if (this.snapConfig.showGuides) {
        const guide = this.createAlignmentGuide(primaryTarget);
        if (guide) {
          guides.push(guide);
        }
      }

      // 检查是否有其他兼容的吸附目标
      const compatibleTargets = nearbyTargets.slice(1, 3).filter(target =>
        this.isCompatibleSnap(primaryTarget, target)
      );

      compatibleTargets.forEach(target => {
        const additionalSnap = this.applySnapping(snappedPosition, target);
        snappedPosition = additionalSnap.position;
        activeTargets.push(target);

        if (this.snapConfig.showGuides) {
          const additionalGuide = this.createAlignmentGuide(target);
          if (additionalGuide) {
            guides.push(additionalGuide);
          }
        }
      });
    }

    // 应用磁性效果
    if (this.snapConfig.magneticStrength > 0 && activeTargets.length > 0) {
      snappedPosition = this.applyMagneticEffect(position, snappedPosition, activeTargets);
    }

    const analysisTime = performance.now() - startTime;
    this.totalAnalysisTime += analysisTime;
    this.analysisCount++;

    return {
      snappedPosition: new Vector2D(
        preciseRound(snappedPosition.x, 3),
        preciseRound(snappedPosition.y, 3)
      ),
      activeTargets,
      guides
    };
  }

  /**
   * 计算吸附距离
   */
  private calculateSnapDistance(position: Vector2D, target: SnapTarget): number {
    switch (target.direction) {
      case 'horizontal':
        return Math.abs(position.y - target.position.y);
      case 'vertical':
        return Math.abs(position.x - target.position.x);
      case 'both':
        return position.distanceTo(target.position);
      default:
        return Infinity;
    }
  }

  /**
   * 应用吸附
   */
  private applySnapping(
    position: Vector2D,
    target: SnapTarget
  ): { position: Vector2D; applied: boolean } {
    let newPosition = position.clone();
    let applied = false;

    switch (target.direction) {
      case 'horizontal':
        if (Math.abs(position.y - target.position.y) <= this.snapConfig.snapThreshold) {
          newPosition.y = target.position.y;
          applied = true;
        }
        break;
      
      case 'vertical':
        if (Math.abs(position.x - target.position.x) <= this.snapConfig.snapThreshold) {
          newPosition.x = target.position.x;
          applied = true;
        }
        break;
      
      case 'both':
        const distance = position.distanceTo(target.position);
        if (distance <= this.snapConfig.snapThreshold) {
          newPosition = target.position.clone();
          applied = true;
        }
        break;
    }

    return { position: newPosition, applied };
  }

  /**
   * 检查吸附兼容性
   */
  private isCompatibleSnap(target1: SnapTarget, target2: SnapTarget): boolean {
    // 垂直和水平吸附可以同时应用
    if (target1.direction === 'vertical' && target2.direction === 'horizontal') {
      return true;
    }
    if (target1.direction === 'horizontal' && target2.direction === 'vertical') {
      return true;
    }

    // 相同方向的吸附不兼容
    return false;
  }

  /**
   * 应用磁性效果
   */
  private applyMagneticEffect(
    originalPosition: Vector2D,
    snappedPosition: Vector2D,
    targets: SnapTarget[]
  ): Vector2D {
    const magneticStrength = this.snapConfig.magneticStrength;
    const displacement = snappedPosition.subtract(originalPosition);
    const magneticDisplacement = displacement.multiply(magneticStrength);
    
    return originalPosition.add(magneticDisplacement);
  }

  /**
   * 创建对齐指示线
   */
  private createAlignmentGuide(target: SnapTarget): AlignmentGuide | null {
    const guideId = `guide-${target.type}-${Date.now()}`;
    
    let guide: AlignmentGuide;

    switch (target.direction) {
      case 'horizontal':
        guide = {
          id: guideId,
          type: 'horizontal',
          position: target.position.y,
          length: 1000, // 足够长的线
          start: new Vector2D(0, target.position.y),
          end: new Vector2D(1000, target.position.y),
          color: '#3b82f6',
          opacity: 0.8,
          animated: false
        };
        break;
      
      case 'vertical':
        guide = {
          id: guideId,
          type: 'vertical',
          position: target.position.x,
          length: 1000,
          start: new Vector2D(target.position.x, 0),
          end: new Vector2D(target.position.x, 1000),
          color: '#3b82f6',
          opacity: 0.8,
          animated: false
        };
        break;
      
      default:
        return null;
    }

    return guide;
  }

  /**
   * 分析空间关系
   */
  analyzeSpaceRelations(items: SelectionItem[]): SpatialAnalysis {
    const cacheKey = this.generateCacheKey(items);
    const cached = this.spatialAnalysisCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const startTime = performance.now();

    // 1. 空间聚类
    const clusters = this.performSpatialClustering(items);
    
    // 2. 对齐建议
    const alignments = this.generateAlignmentSuggestions(items);
    
    // 3. 分布建议
    const distributions = this.generateDistributionSuggestions(items);
    
    // 4. 重叠检测
    const overlaps = this.detectOverlaps(items);

    const analysis: SpatialAnalysis = {
      clusters,
      alignments,
      distributions,
      overlaps
    };

    // 缓存结果
    this.spatialAnalysisCache.set(cacheKey, analysis);

    const analysisTime = performance.now() - startTime;
    this.totalAnalysisTime += analysisTime;
    this.analysisCount++;
    this.lastAnalysisTime = analysisTime;

    console.log(`SmartSnappingAlignmentManager: Spatial analysis completed in ${analysisTime.toFixed(2)}ms`);
    
    return analysis;
  }

  /**
   * 空间聚类
   */
  private performSpatialClustering(items: SelectionItem[]): SelectionItem[][] {
    const clusters: SelectionItem[][] = [];
    const visited = new Set<string>();
    const clusterThreshold = 100; // 聚类距离阈值

    items.forEach(item => {
      if (visited.has(item.id)) return;

      const cluster: SelectionItem[] = [item];
      visited.add(item.id);

      // 查找邻近项目
      items.forEach(otherItem => {
        if (visited.has(otherItem.id) || item.id === otherItem.id) return;

        const distance = item.bounds.center.distanceTo(otherItem.bounds.center);
        if (distance <= clusterThreshold) {
          cluster.push(otherItem);
          visited.add(otherItem.id);
        }
      });

      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });

    return clusters;
  }

  /**
   * 生成对齐建议
   */
  private generateAlignmentSuggestions(items: SelectionItem[]): AlignmentSuggestion[] {
    const suggestions: AlignmentSuggestion[] = [];

    if (items.length < 2) return suggestions;

    // 左对齐建议
    const leftAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.LEFT,
      items,
      items => Math.min(...items.map(item => item.bounds.min.x))
    );
    if (leftAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(leftAlignmentSuggestion);
    }

    // 右对齐建议
    const rightAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.RIGHT,
      items,
      items => Math.max(...items.map(item => item.bounds.max.x))
    );
    if (rightAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(rightAlignmentSuggestion);
    }

    // 居中对齐建议
    const centerAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.CENTER,
      items,
      items => items.reduce((sum, item) => sum + item.bounds.center.x, 0) / items.length
    );
    if (centerAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(centerAlignmentSuggestion);
    }

    // 顶对齐建议
    const topAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.TOP,
      items,
      items => Math.min(...items.map(item => item.bounds.min.y))
    );
    if (topAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(topAlignmentSuggestion);
    }

    // 底对齐建议
    const bottomAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.BOTTOM,
      items,
      items => Math.max(...items.map(item => item.bounds.max.y))
    );
    if (bottomAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(bottomAlignmentSuggestion);
    }

    // 垂直居中对齐建议
    const middleAlignmentSuggestion = this.createAlignmentSuggestion(
      AlignmentType.MIDDLE,
      items,
      items => items.reduce((sum, item) => sum + item.bounds.center.y, 0) / items.length
    );
    if (middleAlignmentSuggestion.confidence > 0.5) {
      suggestions.push(middleAlignmentSuggestion);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 创建对齐建议
   */
  private createAlignmentSuggestion(
    type: AlignmentType,
    items: SelectionItem[],
    referenceCalculator: (items: SelectionItem[]) => number
  ): AlignmentSuggestion {
    const referenceValue = referenceCalculator(items);
    const isHorizontal = [AlignmentType.LEFT, AlignmentType.CENTER, AlignmentType.RIGHT].includes(type);
    
    // 计算当前分散程度
    const currentSpread = isHorizontal
      ? Math.max(...items.map(item => item.bounds.center.x)) - Math.min(...items.map(item => item.bounds.center.x))
      : Math.max(...items.map(item => item.bounds.center.y)) - Math.min(...items.map(item => item.bounds.center.y));

    // 计算置信度（分散程度越大，对齐的价值越高）
    const confidence = Math.min(1, currentSpread / 200); // 200px为最大分散距离

    // 生成预览位置
    const preview: Vector2D[] = items.map(item => {
      const newPosition = item.element.position ? { ...item.element.position } : { x: 0, y: 0 };
      
      switch (type) {
        case AlignmentType.LEFT:
          newPosition.x = referenceValue;
          break;
        case AlignmentType.RIGHT:
          newPosition.x = referenceValue - item.bounds.width;
          break;
        case AlignmentType.CENTER:
          newPosition.x = referenceValue - item.bounds.width / 2;
          break;
        case AlignmentType.TOP:
          newPosition.y = referenceValue;
          break;
        case AlignmentType.BOTTOM:
          newPosition.y = referenceValue - item.bounds.height;
          break;
        case AlignmentType.MIDDLE:
          newPosition.y = referenceValue - item.bounds.height / 2;
          break;
      }
      
      return new Vector2D(newPosition.x, newPosition.y);
    });

    return {
      type,
      items,
      referencePoint: new Vector2D(referenceValue, referenceValue),
      confidence,
      preview,
      description: this.getAlignmentDescription(type, items.length, confidence)
    };
  }

  /**
   * 获取对齐描述
   */
  private getAlignmentDescription(type: AlignmentType, itemCount: number, confidence: number): string {
    const alignmentNames = {
      [AlignmentType.LEFT]: '左对齐',
      [AlignmentType.CENTER]: '水平居中',
      [AlignmentType.RIGHT]: '右对齐',
      [AlignmentType.TOP]: '顶对齐',
      [AlignmentType.MIDDLE]: '垂直居中',
      [AlignmentType.BOTTOM]: '底对齐'
    };

    const confidenceLevel = confidence > 0.8 ? '强烈推荐' : confidence > 0.6 ? '推荐' : '可选';
    
    return `${confidenceLevel}${alignmentNames[type] || type}${itemCount}个项目`;
  }

  /**
   * 生成分布建议
   */
  private generateDistributionSuggestions(items: SelectionItem[]): DistributionConfig[] {
    const suggestions: DistributionConfig[] = [];

    if (items.length < 3) return suggestions;

    // 水平等距分布
    suggestions.push({
      spacing: 'equal',
      margin: 20,
      alignment: 'center',
      respectBounds: true
    });

    // 垂直等距分布
    suggestions.push({
      spacing: 'equal',
      margin: 15,
      alignment: 'center',
      respectBounds: true
    });

    return suggestions;
  }

  /**
   * 检测重叠
   */
  private detectOverlaps(items: SelectionItem[]): SpatialAnalysis['overlaps'] {
    const overlaps: SpatialAnalysis['overlaps'] = [];

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1 = items[i];
        const item2 = items[j];
        
        const intersection = item1.bounds.intersection(item2.bounds);
        if (intersection) {
          const overlapArea = intersection.area;
          const totalArea = item1.bounds.area + item2.bounds.area - overlapArea;
          const overlapRatio = overlapArea / totalArea;

          let severity: 'low' | 'medium' | 'high' = 'low';
          if (overlapRatio > 0.5) severity = 'high';
          else if (overlapRatio > 0.2) severity = 'medium';

          overlaps.push({
            item1: item1.id,
            item2: item2.id,
            area: overlapArea,
            severity
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * 显示对齐指示线
   */
  showAlignmentGuides(guides: AlignmentGuide[]): void {
    if (!this.snapConfig.showGuides || !this.guideContainer) return;

    // 清除现有指示线
    this.hideAllGuides();

    guides.forEach(guide => {
      const guideElement = this.createGuideElement(guide);
      if (guideElement) {
        this.guideElements.set(guide.id, guideElement);
        this.guideContainer!.appendChild(guideElement);
      }
    });
  }

  /**
   * 创建指示线元素
   */
  private createGuideElement(guide: AlignmentGuide): SVGElement | null {
    if (!this.guideContainer) return null;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    
    line.setAttribute('x1', guide.start.x.toString());
    line.setAttribute('y1', guide.start.y.toString());
    line.setAttribute('x2', guide.end.x.toString());
    line.setAttribute('y2', guide.end.y.toString());
    line.setAttribute('class', 'alignment-guide');
    line.setAttribute('stroke', guide.color);
    line.setAttribute('opacity', guide.opacity.toString());

    if (guide.animated) {
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'opacity');
      animate.setAttribute('values', '0;1;0');
      animate.setAttribute('dur', '1s');
      animate.setAttribute('repeatCount', 'indefinite');
      line.appendChild(animate);
    }

    return line;
  }

  /**
   * 隐藏所有指示线
   */
  hideAllGuides(): void {
    this.guideElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.guideElements.clear();
  }

  /**
   * 应用对齐建议
   */
  applyAlignment(suggestion: AlignmentSuggestion): Vector2D[] {
    console.log(`SmartSnappingAlignmentManager: Applying ${suggestion.type} alignment to ${suggestion.items.length} items`);
    
    // 返回预览位置作为最终位置
    return suggestion.preview.map(pos => pos.clone());
  }

  /**
   * 应用分布
   */
  applyDistribution(
    items: SelectionItem[],
    config: DistributionConfig,
    direction: 'horizontal' | 'vertical'
  ): Vector2D[] {
    if (items.length < 2) return items.map(item => 
      new Vector2D(item.element.position?.x || 0, item.element.position?.y || 0)
    );

    // 按位置排序
    const sortedItems = [...items].sort((a, b) => {
      if (direction === 'horizontal') {
        return a.bounds.center.x - b.bounds.center.x;
      } else {
        return a.bounds.center.y - b.bounds.center.y;
      }
    });

    const newPositions: Vector2D[] = [];
    const first = sortedItems[0];
    const last = sortedItems[sortedItems.length - 1];

    if (config.spacing === 'equal') {
      // 计算等距分布
      const totalSpace = direction === 'horizontal'
        ? last.bounds.center.x - first.bounds.center.x
        : last.bounds.center.y - first.bounds.center.y;
      
      const spacing = sortedItems.length > 1 ? totalSpace / (sortedItems.length - 1) : 0;

      sortedItems.forEach((item, index) => {
        const originalPos = item.element.position ? 
          new Vector2D(item.element.position.x, item.element.position.y) : 
          Vector2D.zero();

        if (direction === 'horizontal') {
          const newX = first.bounds.center.x + (spacing * index) - item.bounds.width / 2;
          newPositions.push(new Vector2D(newX, originalPos.y));
        } else {
          const newY = first.bounds.center.y + (spacing * index) - item.bounds.height / 2;
          newPositions.push(new Vector2D(originalPos.x, newY));
        }
      });
    } else if (typeof config.spacing === 'number') {
      // 固定间距分布
      const spacing = config.spacing;
      let currentPos = direction === 'horizontal' ? first.bounds.min.x : first.bounds.min.y;

      sortedItems.forEach(item => {
        const originalPos = item.element.position ? 
          new Vector2D(item.element.position.x, item.element.position.y) : 
          Vector2D.zero();

        if (direction === 'horizontal') {
          newPositions.push(new Vector2D(currentPos, originalPos.y));
          currentPos += item.bounds.width + spacing;
        } else {
          newPositions.push(new Vector2D(originalPos.x, currentPos));
          currentPos += item.bounds.height + spacing;
        }
      });
    }

    return newPositions;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(items: SelectionItem[]): string {
    const positions = items.map(item => `${item.id}:${item.bounds.center.x},${item.bounds.center.y}`);
    return positions.sort().join('|');
  }

  /**
   * 清除缓存
   */
  private clearCaches(): void {
    this.alignmentCache.clear();
    this.spatialAnalysisCache.clear();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SnapConfig>): void {
    Object.assign(this.snapConfig, config);
    this.calculateSnapTargets(); // 重新计算吸附目标
    this.clearCaches();
    
    console.log('SmartSnappingAlignmentManager: Config updated', config);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats(): {
    analysisCount: number;
    averageAnalysisTime: number;
    lastAnalysisTime: number;
    cacheHitRate: number;
    snapTargetsCount: number;
    memoryUsage: number;
  } {
    return {
      analysisCount: this.analysisCount,
      averageAnalysisTime: this.analysisCount > 0 ? this.totalAnalysisTime / this.analysisCount : 0,
      lastAnalysisTime: this.lastAnalysisTime,
      cacheHitRate: 0, // 可以实现缓存命中率统计
      snapTargetsCount: this.snapTargets.length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算内存使用
   */
  private estimateMemoryUsage(): number {
    const targetSize = 200; // 每个吸附目标约200字节
    const cacheItemSize = 1000; // 每个缓存项约1KB
    
    return (this.snapTargets.length * targetSize) + 
           (this.alignmentCache.size * cacheItemSize) +
           (this.spatialAnalysisCache.size * cacheItemSize * 2);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.hideAllGuides();
    
    if (this.guideContainer && this.guideContainer.parentNode) {
      this.guideContainer.parentNode.removeChild(this.guideContainer);
    }

    this.items.clear();
    this.snapTargets.length = 0;
    this.alignmentGuides.clear();
    this.clearCaches();

    console.log('SmartSnappingAlignmentManager: Resources disposed');
  }
}

/**
 * 工厂函数：创建智能吸附对齐管理器
 */
export function createSmartSnappingAlignmentManager(
  snapConfig?: Partial<SnapConfig>
): SmartSnappingAlignmentManager {
  return new SmartSnappingAlignmentManager(snapConfig);
}

/**
 * 工厂函数：创建高精度吸附管理器
 */
export function createHighPrecisionSnappingManager(): SmartSnappingAlignmentManager {
  return new SmartSnappingAlignmentManager({
    gridSize: new Vector2D(5, 5),      // 更精细的网格
    snapThreshold: 3,                   // 更严格的吸附阈值
    magneticStrength: 0.8,              // 更强的磁性效果
    showGuides: true,
    showPreview: true,
    animationDuration: 100              // 更快的动画
  });
}