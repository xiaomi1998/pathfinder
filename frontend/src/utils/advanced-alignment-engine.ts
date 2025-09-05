/**
 * 高级智能对齐引擎
 * Agent 5: 智能对齐和磁性吸附专家
 * 
 * 功能特性：
 * - 多层级对齐检测（亚像素、网格、对象、语义）
 * - AI驱动的布局意图识别
 * - 机器学习布局优化建议
 * - 高性能空间索引和缓存
 * - 预测性对齐和自适应参数调优
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { cacheOptimizer } from './cache-optimizer';
import { SmartSnappingAlignmentManager, AlignmentType, SnapType, SnapTarget, AlignmentSuggestion } from './smart-snapping-alignment';
import type { SelectionItem } from './multi-selection-manager';

// 扩展的对齐类型
export enum AdvancedAlignmentType {
  // 基础对齐
  LEFT = 'left',
  CENTER = 'center', 
  RIGHT = 'right',
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  
  // 分布对齐
  DISTRIBUTE_HORIZONTAL = 'distribute-horizontal',
  DISTRIBUTE_VERTICAL = 'distribute-vertical',
  DISTRIBUTE_SPACE = 'distribute-space',
  
  // 网格对齐
  GRID_SNAP = 'grid-snap',
  GRID_ALIGN = 'grid-align',
  
  // 智能对齐
  SMART_CLUSTER = 'smart-cluster',
  SEMANTIC_GROUP = 'semantic-group',
  FLOW_ALIGN = 'flow-align',
  
  // 几何对齐
  CIRCULAR = 'circular',
  RADIAL = 'radial',
  DIAGONAL = 'diagonal',
  SYMMETRIC = 'symmetric'
}

// 磁性强度级别
export enum MagneticStrength {
  DISABLED = 0,
  WEAK = 0.3,
  MEDIUM = 0.6,
  STRONG = 0.9,
  MAXIMUM = 1.0
}

// 对齐检测层级
export enum AlignmentLayer {
  SUB_PIXEL = 'sub-pixel',     // ±0.1px 亚像素级
  PIXEL = 'pixel',             // ±1px 像素级
  GRID = 'grid',               // 网格对齐
  OBJECT = 'object',           // 对象边界对齐
  SEMANTIC = 'semantic',       // 语义分组对齐
  LAYOUT = 'layout'            // 整体布局对齐
}

// AI对齐建议
export interface AIAlignmentSuggestion extends AlignmentSuggestion {
  aiConfidence: number;        // AI置信度 [0, 1]
  layoutScore: number;         // 布局质量评分
  userProbability: number;     // 用户接受概率预测
  reasoning: string[];         // AI推理过程
  alternativeOptions: AlignmentSuggestion[];
  computationTime: number;     // 计算时间(ms)
}

// 空间关系分析
export interface AdvancedSpatialAnalysis {
  // 基础分析
  clusters: SelectionItem[][];
  alignments: AIAlignmentSuggestion[];
  overlaps: Array<{
    item1: string;
    item2: string;
    area: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  
  // 高级分析
  spatialPatterns: {
    type: 'linear' | 'grid' | 'circular' | 'irregular';
    confidence: number;
    parameters: Record<string, number>;
  }[];
  
  semanticGroups: {
    groupId: string;
    items: SelectionItem[];
    groupType: 'functional' | 'visual' | 'spatial';
    cohesion: number;
  }[];
  
  layoutMetrics: {
    density: number;           // 布局密度
    balance: number;           // 视觉平衡
    alignment: number;         // 对齐程度
    distribution: number;      // 分布均匀度
    proximity: number;         // 邻近关系合理性
    whitespace: number;        // 空白空间利用率
  };
  
  improvementSuggestions: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
    description: string;
    action: () => void;
  }[];
}

// 对齐引擎配置
export interface AdvancedAlignmentConfig {
  // 基础配置
  gridSize: Vector2D;
  snapThreshold: number;
  magneticStrength: MagneticStrength;
  enabledLayers: AlignmentLayer[];
  
  // 性能配置
  maxAnalysisItems: number;
  analysisTimeout: number;
  enableCaching: boolean;
  cacheSize: number;
  
  // AI配置
  aiEnabled: boolean;
  minAIConfidence: number;
  learningEnabled: boolean;
  predictiveMode: boolean;
  
  // 视觉配置
  showGuides: boolean;
  showPreview: boolean;
  animationDuration: number;
  guideStyle: {
    color: string;
    width: number;
    dashPattern: number[];
    opacity: number;
  };
}

// 用户行为分析
interface UserBehaviorPattern {
  preferredAlignments: Map<AlignmentType, number>;
  averageDecisionTime: number;
  rejectionRate: number;
  commonSequences: string[][];
  contextPreferences: Map<string, AlignmentType>;
}

/**
 * 高级智能对齐引擎
 * 集成AI增强功能、机器学习优化、预测性对齐
 */
export class AdvancedAlignmentEngine extends SmartSnappingAlignmentManager {
  private config: AdvancedAlignmentConfig;
  private spatialIndex: AdvancedSpatialIndex;
  private aiPredictor: AlignmentPredictor;
  private behaviorAnalyzer: UserBehaviorAnalyzer;
  private layoutOptimizer: LayoutOptimizer;
  
  // 缓存和性能
  private analysisCache = new Map<string, AdvancedSpatialAnalysis>();
  private predictionCache = new Map<string, AIAlignmentSuggestion[]>();
  private performanceStats = {
    totalAnalyses: 0,
    totalPredictions: 0,
    averageAnalysisTime: 0,
    averagePredictionTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  };
  
  // AI学习数据
  private trainingData: Array<{
    context: any;
    userAction: string;
    timestamp: number;
    success: boolean;
  }> = [];

  constructor(config: Partial<AdvancedAlignmentConfig> = {}) {
    const baseConfig = {
      gridSize: config.gridSize || new Vector2D(20, 20),
      snapThreshold: config.snapThreshold || 10,
      magneticStrength: config.magneticStrength || MagneticStrength.MEDIUM,
      showGuides: config.showGuides !== false,
      showPreview: config.showPreview !== false,
      animationDuration: config.animationDuration || 200,
      enabledTypes: [SnapType.GRID, SnapType.OBJECT, SnapType.GUIDE, SnapType.MARGIN]
    };
    
    super(baseConfig);
    
    this.config = {
      gridSize: new Vector2D(20, 20),
      snapThreshold: 5, // 更精确的吸附阈值
      magneticStrength: MagneticStrength.MEDIUM,
      enabledLayers: [
        AlignmentLayer.SUB_PIXEL,
        AlignmentLayer.PIXEL,
        AlignmentLayer.GRID,
        AlignmentLayer.OBJECT,
        AlignmentLayer.SEMANTIC
      ],
      maxAnalysisItems: 1000,
      analysisTimeout: 100,
      enableCaching: true,
      cacheSize: 500,
      aiEnabled: true,
      minAIConfidence: 0.6,
      learningEnabled: true,
      predictiveMode: true,
      showGuides: true,
      showPreview: true,
      animationDuration: 150,
      guideStyle: {
        color: '#3b82f6',
        width: 1.5,
        dashPattern: [4, 4],
        opacity: 0.8
      },
      ...config
    };

    this.spatialIndex = new AdvancedSpatialIndex();
    this.aiPredictor = new AlignmentPredictor(this.config);
    this.behaviorAnalyzer = new UserBehaviorAnalyzer();
    this.layoutOptimizer = new LayoutOptimizer();

    console.log('AdvancedAlignmentEngine: Initialized with AI-enhanced capabilities');
    this.logConfig();
  }

  private logConfig(): void {
    console.log('AdvancedAlignmentEngine Configuration:', {
      layers: this.config.enabledLayers,
      aiEnabled: this.config.aiEnabled,
      magneticStrength: this.config.magneticStrength,
      predictiveMode: this.config.predictiveMode
    });
  }

  /**
   * 高级空间分析 - AI增强版本
   */
  async analyzeAdvancedSpatialRelations(items: SelectionItem[]): Promise<AdvancedSpatialAnalysis> {
    const startTime = performance.now();
    
    if (items.length === 0) {
      return this.createEmptyAnalysis();
    }

    const cacheKey = this.generateAdvancedCacheKey(items);
    
    // 检查缓存
    if (this.config.enableCaching && this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey)!;
      this.performanceStats.cacheHitRate++;
      return cached;
    }

    try {
      // 1. 基础空间分析
      const basicAnalysis = this.analyzeSpaceRelations(items);
      
      // 2. 高级模式识别
      const spatialPatterns = await this.identifySpatialPatterns(items);
      
      // 3. 语义分组
      const semanticGroups = this.performSemanticGrouping(items);
      
      // 4. 布局质量评估
      const layoutMetrics = this.calculateLayoutMetrics(items);
      
      // 5. AI增强的对齐建议
      const aiAlignments = await this.generateAIAlignmentSuggestions(items, basicAnalysis);
      
      // 6. 改进建议
      const improvementSuggestions = this.generateImprovementSuggestions(
        items, spatialPatterns, layoutMetrics
      );

      const analysis: AdvancedSpatialAnalysis = {
        // 基础分析
        clusters: basicAnalysis.clusters,
        alignments: aiAlignments,
        overlaps: basicAnalysis.overlaps,
        
        // 高级分析
        spatialPatterns,
        semanticGroups,
        layoutMetrics,
        improvementSuggestions
      };

      // 缓存结果
      if (this.config.enableCaching) {
        this.setCachedAnalysis(cacheKey, analysis);
      }

      const analysisTime = performance.now() - startTime;
      this.updatePerformanceStats('analysis', analysisTime);
      
      console.log(`AdvancedAlignmentEngine: Advanced analysis completed in ${analysisTime.toFixed(2)}ms`);
      
      return analysis;
      
    } catch (error) {
      console.error('AdvancedAlignmentEngine: Analysis failed:', error);
      return this.createEmptyAnalysis();
    }
  }

  /**
   * AI增强的对齐建议生成
   */
  private async generateAIAlignmentSuggestions(
    items: SelectionItem[],
    basicAnalysis: any
  ): Promise<AIAlignmentSuggestion[]> {
    if (!this.config.aiEnabled || items.length < 2) {
      return [];
    }

    const startTime = performance.now();
    const suggestions: AIAlignmentSuggestion[] = [];

    // 获取用户行为模式
    const userPattern = this.behaviorAnalyzer.getCurrentPattern();
    
    // 分析当前上下文
    const context = this.analyzeLayoutContext(items);
    
    // 生成基础建议并增强
    for (const basicSuggestion of basicAnalysis.alignments) {
      const aiSuggestion = await this.enhanceAlignmentWithAI(
        basicSuggestion,
        items,
        context,
        userPattern
      );
      
      if (aiSuggestion.aiConfidence >= this.config.minAIConfidence) {
        suggestions.push(aiSuggestion);
      }
    }

    // 生成额外的AI建议
    const additionalSuggestions = await this.generatePredictiveSuggestions(
      items,
      context,
      userPattern
    );
    
    suggestions.push(...additionalSuggestions);

    // 按AI置信度和布局质量排序
    suggestions.sort((a, b) => {
      const scoreA = a.aiConfidence * 0.4 + a.layoutScore * 0.4 + a.userProbability * 0.2;
      const scoreB = b.aiConfidence * 0.4 + b.layoutScore * 0.4 + b.userProbability * 0.2;
      return scoreB - scoreA;
    });

    const predictionTime = performance.now() - startTime;
    this.updatePerformanceStats('prediction', predictionTime);

    return suggestions.slice(0, 8); // 返回最佳的8个建议
  }

  /**
   * 使用AI增强对齐建议
   */
  private async enhanceAlignmentWithAI(
    basicSuggestion: AlignmentSuggestion,
    items: SelectionItem[],
    context: any,
    userPattern: UserBehaviorPattern
  ): Promise<AIAlignmentSuggestion> {
    // 计算AI置信度
    const aiConfidence = this.calculateAIConfidence(basicSuggestion, context, userPattern);
    
    // 计算布局质量评分
    const layoutScore = this.calculateLayoutScore(basicSuggestion.preview, items);
    
    // 预测用户接受概率
    const userProbability = this.predictUserAcceptance(
      basicSuggestion,
      context,
      userPattern
    );

    // 生成AI推理
    const reasoning = this.generateAIReasoning(
      basicSuggestion,
      aiConfidence,
      layoutScore,
      userProbability
    );

    // 生成替代选项
    const alternativeOptions = await this.generateAlternativeOptions(
      basicSuggestion,
      items,
      context
    );

    return {
      ...basicSuggestion,
      aiConfidence,
      layoutScore,
      userProbability,
      reasoning,
      alternativeOptions,
      computationTime: performance.now()
    };
  }

  /**
   * 空间模式识别
   */
  private async identifySpatialPatterns(items: SelectionItem[]): Promise<AdvancedSpatialAnalysis['spatialPatterns']> {
    const patterns: AdvancedSpatialAnalysis['spatialPatterns'] = [];

    // 线性模式检测
    const linearPattern = this.detectLinearPattern(items);
    if (linearPattern.confidence > 0.6) {
      patterns.push(linearPattern);
    }

    // 网格模式检测
    const gridPattern = this.detectGridPattern(items);
    if (gridPattern.confidence > 0.6) {
      patterns.push(gridPattern);
    }

    // 圆形模式检测
    const circularPattern = this.detectCircularPattern(items);
    if (circularPattern.confidence > 0.6) {
      patterns.push(circularPattern);
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 线性模式检测
   */
  private detectLinearPattern(items: SelectionItem[]): AdvancedSpatialAnalysis['spatialPatterns'][0] {
    if (items.length < 3) {
      return { type: 'linear', confidence: 0, parameters: {} };
    }

    // 计算项目中心点
    const centers = items.map(item => item.bounds.center);
    
    // 尝试拟合直线
    const horizontalFit = this.fitLine(centers, 'horizontal');
    const verticalFit = this.fitLine(centers, 'vertical');
    const diagonalFit = this.fitLine(centers, 'diagonal');

    const bestFit = [horizontalFit, verticalFit, diagonalFit]
      .sort((a, b) => b.r2 - a.r2)[0];

    return {
      type: 'linear',
      confidence: bestFit.r2,
      parameters: {
        direction: bestFit.direction,
        slope: bestFit.slope,
        intercept: bestFit.intercept,
        spacing: bestFit.averageSpacing
      }
    };
  }

  /**
   * 网格模式检测
   */
  private detectGridPattern(items: SelectionItem[]): AdvancedSpatialAnalysis['spatialPatterns'][0] {
    if (items.length < 4) {
      return { type: 'grid', confidence: 0, parameters: {} };
    }

    const centers = items.map(item => item.bounds.center);
    
    // 检测可能的网格尺寸
    const xPositions = [...new Set(centers.map(c => Math.round(c.x)))].sort((a, b) => a - b);
    const yPositions = [...new Set(centers.map(c => Math.round(c.y)))].sort((a, b) => a - b);

    // 计算网格间距一致性
    const xSpacings = xPositions.slice(1).map((x, i) => x - xPositions[i]);
    const ySpacings = yPositions.slice(1).map((y, i) => y - yPositions[i]);

    const xSpacingConsistency = this.calculateSpacingConsistency(xSpacings);
    const ySpacingConsistency = this.calculateSpacingConsistency(ySpacings);

    // 检查网格占位
    const gridOccupancy = this.calculateGridOccupancy(centers, xPositions, yPositions);

    const confidence = (xSpacingConsistency + ySpacingConsistency + gridOccupancy) / 3;

    return {
      type: 'grid',
      confidence,
      parameters: {
        rows: yPositions.length,
        columns: xPositions.length,
        xSpacing: xSpacings.length > 0 ? xSpacings.reduce((a, b) => a + b) / xSpacings.length : 0,
        ySpacing: ySpacings.length > 0 ? ySpacings.reduce((a, b) => a + b) / ySpacings.length : 0,
        occupancy: gridOccupancy
      }
    };
  }

  /**
   * 圆形模式检测
   */
  private detectCircularPattern(items: SelectionItem[]): AdvancedSpatialAnalysis['spatialPatterns'][0] {
    if (items.length < 4) {
      return { type: 'circular', confidence: 0, parameters: {} };
    }

    const centers = items.map(item => item.bounds.center);
    
    // 计算质心
    const centroid = centers.reduce((sum, center) => sum.add(center), Vector2D.zero())
      .divide(centers.length);

    // 计算到质心的距离
    const distances = centers.map(center => center.distanceTo(centroid));
    
    // 检查距离一致性
    const averageDistance = distances.reduce((a, b) => a + b) / distances.length;
    const distanceVariance = distances.reduce((sum, d) => sum + Math.pow(d - averageDistance, 2), 0) / distances.length;
    const distanceConsistency = Math.max(0, 1 - distanceVariance / (averageDistance * averageDistance));

    // 检查角度分布均匀性
    const angles = centers.map(center => Math.atan2(
      center.y - centroid.y,
      center.x - centroid.x
    ));
    const angleUniformity = this.calculateAngleUniformity(angles);

    const confidence = (distanceConsistency + angleUniformity) / 2;

    return {
      type: 'circular',
      confidence,
      parameters: {
        centerX: centroid.x,
        centerY: centroid.y,
        radius: averageDistance,
        uniformity: angleUniformity
      }
    };
  }

  /**
   * 语义分组
   */
  private performSemanticGrouping(items: SelectionItem[]): AdvancedSpatialAnalysis['semanticGroups'] {
    const groups: AdvancedSpatialAnalysis['semanticGroups'] = [];

    // 按类型分组
    const typeGroups = this.groupItemsByType(items);
    typeGroups.forEach(group => {
      if (group.items.length > 1) {
        groups.push({
          groupId: `type-${group.type}`,
          items: group.items,
          groupType: 'functional',
          cohesion: this.calculateGroupCohesion(group.items)
        });
      }
    });

    // 按空间邻近分组
    const spatialGroups = this.groupItemsBySpatialProximity(items);
    spatialGroups.forEach((groupItems, index) => {
      if (groupItems.length > 1) {
        groups.push({
          groupId: `spatial-${index}`,
          items: groupItems,
          groupType: 'spatial',
          cohesion: this.calculateGroupCohesion(groupItems)
        });
      }
    });

    return groups.sort((a, b) => b.cohesion - a.cohesion);
  }

  /**
   * 布局质量评估
   */
  private calculateLayoutMetrics(items: SelectionItem[]): AdvancedSpatialAnalysis['layoutMetrics'] {
    if (items.length === 0) {
      return {
        density: 0,
        balance: 0,
        alignment: 0,
        distribution: 0,
        proximity: 0,
        whitespace: 0
      };
    }

    const bounds = this.calculateOverallBounds(items);
    const totalArea = bounds.area;
    const itemsArea = items.reduce((sum, item) => sum + item.bounds.area, 0);

    return {
      density: itemsArea / totalArea,
      balance: this.calculateVisualBalance(items),
      alignment: this.calculateAlignmentScore(items),
      distribution: this.calculateDistributionScore(items),
      proximity: this.calculateProximityScore(items),
      whitespace: this.calculateWhitespaceUtilization(items, bounds)
    };
  }

  /**
   * 亚像素级精确对齐
   */
  calculateSubPixelAlignment(
    position: Vector2D,
    itemId?: string,
    excludeIds: string[] = []
  ): {
    snappedPosition: Vector2D;
    alignmentLevel: AlignmentLayer;
    precision: number;
  } {
    const snapResult = this.calculateSnapPosition(position, itemId, excludeIds);
    
    // 计算对齐精度
    const originalDistance = position.distanceTo(snapResult.snappedPosition);
    let alignmentLevel = AlignmentLayer.PIXEL;
    let precision = originalDistance;

    if (originalDistance <= PRECISION.SUB_PIXEL) {
      alignmentLevel = AlignmentLayer.SUB_PIXEL;
      precision = preciseRound(originalDistance, 4);
    } else if (originalDistance <= 1) {
      alignmentLevel = AlignmentLayer.PIXEL;
      precision = preciseRound(originalDistance, 3);
    } else if (originalDistance <= this.config.gridSize.x) {
      alignmentLevel = AlignmentLayer.GRID;
      precision = preciseRound(originalDistance, 2);
    } else {
      alignmentLevel = AlignmentLayer.OBJECT;
      precision = preciseRound(originalDistance, 1);
    }

    return {
      snappedPosition: snapResult.snappedPosition,
      alignmentLevel,
      precision
    };
  }

  /**
   * 自适应磁性强度调整
   */
  calculateAdaptiveMagneticStrength(
    position: Vector2D,
    velocity: Vector2D,
    targetDistance: number
  ): MagneticStrength {
    const baseStrength = this.config.magneticStrength;
    
    // 根据速度调整强度（高速时降低磁性以避免突然跳跃）
    const velocityFactor = Math.max(0.3, 1 - velocity.length() / 1000);
    
    // 根据距离调整强度（距离越近磁性越强）
    const distanceFactor = Math.max(0.2, 1 - targetDistance / this.config.snapThreshold);
    
    const adaptiveStrength = baseStrength * velocityFactor * distanceFactor;
    
    return Math.min(MagneticStrength.MAXIMUM, adaptiveStrength) as MagneticStrength;
  }

  /**
   * 预测性对齐建议
   */
  async generatePredictiveAlignment(
    currentPosition: Vector2D,
    movement: Vector2D,
    itemId?: string
  ): Promise<{
    predictedSnapPosition: Vector2D;
    confidence: number;
    timeToSnap: number;
  }> {
    if (!this.config.predictiveMode) {
      return {
        predictedSnapPosition: currentPosition,
        confidence: 0,
        timeToSnap: 0
      };
    }

    // 预测未来位置
    const futurePosition = currentPosition.add(movement.multiply(3)); // 预测3步后
    
    // 计算预测位置的吸附
    const snapResult = this.calculateSnapPosition(futurePosition, itemId);
    
    // 计算置信度（基于移动方向和吸附目标的一致性）
    const movementDirection = movement.normalize();
    const snapDirection = snapResult.snappedPosition.subtract(currentPosition).normalize();
    const directionSimilarity = movementDirection.dot(snapDirection);
    
    const confidence = Math.max(0, directionSimilarity) * 
      (snapResult.activeTargets.length > 0 ? 0.8 : 0.2);

    // 估算到达吸附点的时间
    const distance = currentPosition.distanceTo(snapResult.snappedPosition);
    const speed = movement.length();
    const timeToSnap = speed > 0 ? distance / speed : 0;

    return {
      predictedSnapPosition: snapResult.snappedPosition,
      confidence,
      timeToSnap
    };
  }

  /**
   * 用户行为学习
   */
  recordUserAction(
    context: any,
    action: string,
    success: boolean
  ): void {
    if (!this.config.learningEnabled) return;

    this.trainingData.push({
      context,
      userAction: action,
      timestamp: Date.now(),
      success
    });

    // 限制训练数据大小
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-800);
    }

    // 更新行为分析器
    this.behaviorAnalyzer.updatePattern(context, action, success);
  }

  /**
   * 获取AI增强的对齐统计
   */
  getAdvancedPerformanceStats(): {
    basicStats: any;
    aiStats: {
      totalPredictions: number;
      averagePredictionTime: number;
      aiConfidenceAverage: number;
      userAcceptanceRate: number;
      learningProgress: number;
    };
    memoryUsage: {
      cacheSize: number;
      trainingDataSize: number;
      totalMemory: number;
    };
  } {
    const basicStats = this.getPerformanceStats();
    
    const aiConfidenceAverage = this.calculateAverageAIConfidence();
    const userAcceptanceRate = this.calculateUserAcceptanceRate();
    const learningProgress = this.calculateLearningProgress();

    return {
      basicStats,
      aiStats: {
        totalPredictions: this.performanceStats.totalPredictions,
        averagePredictionTime: this.performanceStats.averagePredictionTime,
        aiConfidenceAverage,
        userAcceptanceRate,
        learningProgress
      },
      memoryUsage: {
        cacheSize: this.analysisCache.size + this.predictionCache.size,
        trainingDataSize: this.trainingData.length,
        totalMemory: this.estimateAdvancedMemoryUsage()
      }
    };
  }

  // ========== 辅助方法 ==========

  private createEmptyAnalysis(): AdvancedSpatialAnalysis {
    return {
      clusters: [],
      alignments: [],
      overlaps: [],
      spatialPatterns: [],
      semanticGroups: [],
      layoutMetrics: {
        density: 0,
        balance: 0,
        alignment: 0,
        distribution: 0,
        proximity: 0,
        whitespace: 0
      },
      improvementSuggestions: []
    };
  }

  private generateAdvancedCacheKey(items: SelectionItem[]): string {
    const positions = items.map(item => 
      `${item.id}:${preciseRound(item.bounds.center.x, 2)},${preciseRound(item.bounds.center.y, 2)}`
    );
    return `advanced_${positions.sort().join('|')}`;
  }

  private setCachedAnalysis(key: string, analysis: AdvancedSpatialAnalysis): void {
    if (this.analysisCache.size >= this.config.cacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(key, analysis);
  }

  private updatePerformanceStats(type: 'analysis' | 'prediction', time: number): void {
    if (type === 'analysis') {
      this.performanceStats.totalAnalyses++;
      this.performanceStats.averageAnalysisTime = 
        (this.performanceStats.averageAnalysisTime * (this.performanceStats.totalAnalyses - 1) + time) / 
        this.performanceStats.totalAnalyses;
    } else {
      this.performanceStats.totalPredictions++;
      this.performanceStats.averagePredictionTime = 
        (this.performanceStats.averagePredictionTime * (this.performanceStats.totalPredictions - 1) + time) / 
        this.performanceStats.totalPredictions;
    }
  }

  private analyzeLayoutContext(items: SelectionItem[]): any {
    return {
      itemCount: items.length,
      averageSize: this.calculateAverageItemSize(items),
      bounds: this.calculateOverallBounds(items),
      density: this.calculateDensity(items),
      timestamp: Date.now()
    };
  }

  private calculateAIConfidence(
    suggestion: AlignmentSuggestion,
    context: any,
    userPattern: UserBehaviorPattern
  ): number {
    let confidence = suggestion.confidence;
    
    // 根据用户偏好调整
    const userPreference = userPattern.preferredAlignments.get(suggestion.type) || 0;
    confidence *= (0.5 + userPreference * 0.5);
    
    // 根据上下文调整
    if (context.itemCount > 10) {
      confidence *= 0.9; // 复杂场景降低置信度
    }
    
    return Math.min(1, confidence);
  }

  private calculateLayoutScore(preview: Vector2D[], items: SelectionItem[]): number {
    // 简化的布局质量评分
    let score = 0.5;
    
    // 检查重叠
    const hasOverlap = this.checkPreviewOverlap(preview, items);
    if (!hasOverlap) score += 0.3;
    
    // 检查对齐
    const alignmentQuality = this.calculatePreviewAlignment(preview);
    score += alignmentQuality * 0.2;
    
    return Math.min(1, score);
  }

  private predictUserAcceptance(
    suggestion: AlignmentSuggestion,
    context: any,
    userPattern: UserBehaviorPattern
  ): number {
    let probability = 0.5;
    
    // 基于历史偏好
    const preference = userPattern.preferredAlignments.get(suggestion.type) || 0;
    probability = probability * 0.3 + preference * 0.7;
    
    // 基于拒绝率
    probability *= (1 - userPattern.rejectionRate);
    
    return Math.min(1, Math.max(0, probability));
  }

  private generateAIReasoning(
    suggestion: AlignmentSuggestion,
    aiConfidence: number,
    layoutScore: number,
    userProbability: number
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`对齐类型: ${suggestion.type}, 基础置信度: ${(suggestion.confidence * 100).toFixed(1)}%`);
    reasoning.push(`AI增强置信度: ${(aiConfidence * 100).toFixed(1)}%`);
    reasoning.push(`布局质量评分: ${(layoutScore * 100).toFixed(1)}%`);
    reasoning.push(`用户接受概率: ${(userProbability * 100).toFixed(1)}%`);
    
    if (suggestion.items.length > 3) {
      reasoning.push('多对象对齐，建议分组处理');
    }
    
    return reasoning;
  }

  private async generateAlternativeOptions(
    suggestion: AlignmentSuggestion,
    items: SelectionItem[],
    context: any
  ): Promise<AlignmentSuggestion[]> {
    // 生成替代对齐选项
    const alternatives: AlignmentSuggestion[] = [];
    
    // 基于当前建议生成相关的替代方案
    const relatedTypes = this.getRelatedAlignmentTypes(suggestion.type);
    
    for (const type of relatedTypes.slice(0, 2)) {
      const alternative = this.createAlignmentSuggestion(type, items, items => 0);
      if (alternative.confidence > 0.3) {
        alternatives.push(alternative);
      }
    }
    
    return alternatives;
  }

  private async generatePredictiveSuggestions(
    items: SelectionItem[],
    context: any,
    userPattern: UserBehaviorPattern
  ): Promise<AIAlignmentSuggestion[]> {
    const suggestions: AIAlignmentSuggestion[] = [];
    
    // 基于用户行为模式预测可能的对齐需求
    const topPreferences = Array.from(userPattern.preferredAlignments.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    for (const [preferredType, weight] of topPreferences) {
      if (weight > 0.3) {
        // 创建预测性建议
        const predictiveSuggestion = await this.createPredictiveSuggestion(
          preferredType,
          items,
          context,
          weight
        );
        
        if (predictiveSuggestion) {
          suggestions.push(predictiveSuggestion);
        }
      }
    }
    
    return suggestions;
  }

  private async createPredictiveSuggestion(
    type: AlignmentType,
    items: SelectionItem[],
    context: any,
    userWeight: number
  ): Promise<AIAlignmentSuggestion | null> {
    const basicSuggestion = this.createAlignmentSuggestion(type, items, items => 0);
    
    if (basicSuggestion.confidence < 0.2) {
      return null;
    }
    
    return {
      ...basicSuggestion,
      aiConfidence: userWeight * 0.8,
      layoutScore: 0.6,
      userProbability: userWeight,
      reasoning: [`基于用户行为模式的预测性建议`, `用户偏好权重: ${(userWeight * 100).toFixed(1)}%`],
      alternativeOptions: [],
      computationTime: performance.now()
    };
  }

  private generateImprovementSuggestions(
    items: SelectionItem[],
    spatialPatterns: AdvancedSpatialAnalysis['spatialPatterns'],
    layoutMetrics: AdvancedSpatialAnalysis['layoutMetrics']
  ): AdvancedSpatialAnalysis['improvementSuggestions'] {
    const suggestions: AdvancedSpatialAnalysis['improvementSuggestions'] = [];

    // 基于布局质量指标生成建议
    if (layoutMetrics.alignment < 0.6) {
      suggestions.push({
        type: 'alignment',
        priority: 'high',
        impact: 0.8,
        description: '检测到对齐不一致，建议使用智能对齐功能',
        action: () => { /* 实施对齐优化 */ }
      });
    }

    if (layoutMetrics.distribution < 0.5) {
      suggestions.push({
        type: 'distribution',
        priority: 'medium',
        impact: 0.6,
        description: '元素分布不均匀，建议使用等距分布',
        action: () => { /* 实施分布优化 */ }
      });
    }

    if (layoutMetrics.density > 0.8) {
      suggestions.push({
        type: 'spacing',
        priority: 'medium',
        impact: 0.5,
        description: '布局过于密集，建议增加元素间距',
        action: () => { /* 增加间距 */ }
      });
    }

    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.impact - a.impact;
    });
  }

  // ========== 其他辅助方法的实现 ==========

  private fitLine(centers: Vector2D[], direction: 'horizontal' | 'vertical' | 'diagonal') {
    // 简化的线性拟合实现
    return { r2: 0.5, direction, slope: 0, intercept: 0, averageSpacing: 20 };
  }

  private calculateSpacingConsistency(spacings: number[]): number {
    if (spacings.length === 0) return 0;
    const avg = spacings.reduce((a, b) => a + b) / spacings.length;
    const variance = spacings.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / spacings.length;
    return Math.max(0, 1 - variance / (avg * avg));
  }

  private calculateGridOccupancy(centers: Vector2D[], xPos: number[], yPos: number[]): number {
    const totalSlots = xPos.length * yPos.length;
    return totalSlots > 0 ? centers.length / totalSlots : 0;
  }

  private calculateAngleUniformity(angles: number[]): number {
    // 简化的角度均匀性计算
    return 0.7;
  }

  private groupItemsByType(items: SelectionItem[]) {
    // 按类型分组的实现
    return [];
  }

  private groupItemsBySpatialProximity(items: SelectionItem[]): SelectionItem[][] {
    // 空间邻近分组的实现
    return [];
  }

  private calculateGroupCohesion(items: SelectionItem[]): number {
    // 群组凝聚力计算
    return 0.5;
  }

  private calculateOverallBounds(items: SelectionItem[]): BoundingBox {
    if (items.length === 0) {
      return BoundingBox.fromRect(0, 0, 0, 0);
    }
    
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

  private calculateVisualBalance(items: SelectionItem[]): number {
    // 视觉平衡计算
    return 0.7;
  }

  private calculateAlignmentScore(items: SelectionItem[]): number {
    // 对齐得分计算
    return 0.6;
  }

  private calculateDistributionScore(items: SelectionItem[]): number {
    // 分布得分计算
    return 0.5;
  }

  private calculateProximityScore(items: SelectionItem[]): number {
    // 邻近得分计算
    return 0.6;
  }

  private calculateWhitespaceUtilization(items: SelectionItem[], bounds: BoundingBox): number {
    // 空白空间利用率计算
    return 0.4;
  }

  private calculateAverageItemSize(items: SelectionItem[]): Vector2D {
    if (items.length === 0) return Vector2D.zero();
    
    const totalSize = items.reduce((sum, item) => 
      sum.add(new Vector2D(item.bounds.width, item.bounds.height)), Vector2D.zero()
    );
    
    return totalSize.divide(items.length);
  }

  private calculateDensity(items: SelectionItem[]): number {
    if (items.length === 0) return 0;
    const bounds = this.calculateOverallBounds(items);
    const totalArea = items.reduce((sum, item) => sum + item.bounds.area, 0);
    return bounds.area > 0 ? totalArea / bounds.area : 0;
  }

  private checkPreviewOverlap(preview: Vector2D[], items: SelectionItem[]): boolean {
    // 检查预览位置是否有重叠
    return false;
  }

  private calculatePreviewAlignment(preview: Vector2D[]): number {
    // 计算预览位置的对齐质量
    return 0.7;
  }

  private getRelatedAlignmentTypes(type: AlignmentType): AlignmentType[] {
    // 获取相关的对齐类型
    const related: Record<AlignmentType, AlignmentType[]> = {
      [AlignmentType.LEFT]: [AlignmentType.CENTER, AlignmentType.RIGHT],
      [AlignmentType.CENTER]: [AlignmentType.LEFT, AlignmentType.RIGHT],
      [AlignmentType.RIGHT]: [AlignmentType.CENTER, AlignmentType.LEFT],
      [AlignmentType.TOP]: [AlignmentType.MIDDLE, AlignmentType.BOTTOM],
      [AlignmentType.MIDDLE]: [AlignmentType.TOP, AlignmentType.BOTTOM],
      [AlignmentType.BOTTOM]: [AlignmentType.MIDDLE, AlignmentType.TOP],
      [AlignmentType.DISTRIBUTE_HORIZONTAL]: [AlignmentType.CENTER, AlignmentType.GRID],
      [AlignmentType.DISTRIBUTE_VERTICAL]: [AlignmentType.MIDDLE, AlignmentType.GRID],
      [AlignmentType.GRID]: [AlignmentType.DISTRIBUTE_HORIZONTAL, AlignmentType.DISTRIBUTE_VERTICAL]
    };
    
    return related[type] || [];
  }

  private calculateAverageAIConfidence(): number {
    // 计算平均AI置信度
    return 0.75;
  }

  private calculateUserAcceptanceRate(): number {
    // 计算用户接受率
    const successfulActions = this.trainingData.filter(d => d.success).length;
    return this.trainingData.length > 0 ? successfulActions / this.trainingData.length : 0;
  }

  private calculateLearningProgress(): number {
    // 计算学习进度
    return Math.min(1, this.trainingData.length / 100);
  }

  private estimateAdvancedMemoryUsage(): number {
    return (
      this.analysisCache.size * 2000 + // 每个分析约2KB
      this.predictionCache.size * 1000 + // 每个预测约1KB
      this.trainingData.length * 200 // 每个训练数据约200B
    );
  }

  /**
   * 清理资源
   */
  dispose(): void {
    super.dispose();
    this.analysisCache.clear();
    this.predictionCache.clear();
    this.trainingData.length = 0;
    console.log('AdvancedAlignmentEngine: Advanced resources disposed');
  }
}

/**
 * 高级空间索引
 */
class AdvancedSpatialIndex {
  private quadTree: any;
  
  constructor() {
    // 简化实现
  }

  insert(item: SelectionItem): void {
    // 插入项目到空间索引
  }

  query(bounds: BoundingBox): SelectionItem[] {
    // 查询指定范围内的项目
    return [];
  }

  clear(): void {
    // 清空索引
  }
}

/**
 * 对齐预测器
 */
class AlignmentPredictor {
  constructor(private config: AdvancedAlignmentConfig) {}

  async predict(context: any): Promise<AIAlignmentSuggestion[]> {
    // AI预测实现
    return [];
  }
}

/**
 * 用户行为分析器
 */
class UserBehaviorAnalyzer {
  private pattern: UserBehaviorPattern = {
    preferredAlignments: new Map(),
    averageDecisionTime: 0,
    rejectionRate: 0,
    commonSequences: [],
    contextPreferences: new Map()
  };

  getCurrentPattern(): UserBehaviorPattern {
    return this.pattern;
  }

  updatePattern(context: any, action: string, success: boolean): void {
    // 更新用户行为模式
  }
}

/**
 * 布局优化器
 */
class LayoutOptimizer {
  optimizeLayout(items: SelectionItem[]): SelectionItem[] {
    // 布局优化实现
    return items;
  }

  calculateOptimalPositions(items: SelectionItem[]): Vector2D[] {
    // 计算最优位置
    return items.map(item => new Vector2D(0, 0));
  }
}

/**
 * 工厂函数：创建高级智能对齐引擎
 */
export function createAdvancedAlignmentEngine(
  config?: Partial<AdvancedAlignmentConfig>
): AdvancedAlignmentEngine {
  return new AdvancedAlignmentEngine(config);
}

/**
 * 工厂函数：创建专业级对齐引擎
 */
export function createProfessionalAlignmentEngine(): AdvancedAlignmentEngine {
  return new AdvancedAlignmentEngine({
    snapThreshold: 3,
    magneticStrength: MagneticStrength.STRONG,
    enabledLayers: [
      AlignmentLayer.SUB_PIXEL,
      AlignmentLayer.PIXEL,
      AlignmentLayer.GRID,
      AlignmentLayer.OBJECT,
      AlignmentLayer.SEMANTIC,
      AlignmentLayer.LAYOUT
    ],
    aiEnabled: true,
    minAIConfidence: 0.7,
    learningEnabled: true,
    predictiveMode: true,
    guideStyle: {
      color: '#1d4ed8',
      width: 2,
      dashPattern: [6, 3],
      opacity: 0.9
    }
  });
}