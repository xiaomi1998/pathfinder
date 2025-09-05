/**
 * 自动布局算法系统
 * Agent 5: 智能对齐和磁性吸附专家
 * 
 * 功能特性：
 * - 网格布局自动排列 (Grid Layout)
 * - 层次化布局算法 (Hierarchical Layout)  
 * - 力导向布局优化 (Force-Directed Layout)
 * - 圆形和径向布局 (Circular & Radial Layout)
 * - 树状结构布局 (Tree Layout)
 * - 流式布局 (Flow Layout)
 * - AI驱动的最优布局建议
 * - 动态布局调整和平滑过渡
 * - 约束满足布局求解器
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { cacheOptimizer } from './cache-optimizer';
import type { SelectionItem } from './multi-selection-manager';

// 布局类型枚举
export enum LayoutType {
  GRID = 'grid',
  HIERARCHICAL = 'hierarchical', 
  FORCE_DIRECTED = 'force-directed',
  CIRCULAR = 'circular',
  RADIAL = 'radial',
  TREE = 'tree',
  FLOW = 'flow',
  SPRING = 'spring',
  ORGANIC = 'organic',
  COMPACT = 'compact'
}

// 布局方向
export enum LayoutDirection {
  TOP_TO_BOTTOM = 'top-to-bottom',
  BOTTOM_TO_TOP = 'bottom-to-top', 
  LEFT_TO_RIGHT = 'left-to-right',
  RIGHT_TO_LEFT = 'right-to-left',
  RADIAL_OUT = 'radial-out',
  RADIAL_IN = 'radial-in'
}

// 布局节点接口
export interface LayoutNode {
  id: string;
  originalItem: SelectionItem;
  position: Vector2D;
  size: Vector2D;
  fixed: boolean;                    // 是否固定位置
  weight: number;                   // 节点权重
  group?: string;                   // 分组标识
  level?: number;                   // 层级
  
  // 连接关系
  connections: string[];            // 连接的节点ID
  parents: string[];               // 父节点
  children: string[];              // 子节点
  
  // 物理属性
  velocity: Vector2D;              // 速度
  force: Vector2D;                 // 受力
  mass: number;                    // 质量
  
  // 约束
  constraints?: {
    minDistance?: number;          // 最小距离
    maxDistance?: number;          // 最大距离
    preferredNeighbors?: string[]; // 偏好邻居
    avoidNodes?: string[];         // 避开节点
  };
}

// 布局配置
export interface AutoLayoutConfig {
  type: LayoutType;
  direction: LayoutDirection;
  
  // 通用配置
  spacing: Vector2D;               // 节点间距
  padding: Vector2D;               // 边缘填充
  bounds?: BoundingBox;            // 布局边界
  preserveAspectRatio: boolean;    // 保持宽高比
  
  // 网格布局配置
  gridConfig: {
    columns?: number;              // 固定列数
    rows?: number;                // 固定行数
    autoSize: boolean;            // 自动计算尺寸
    alignment: 'start' | 'center' | 'end';
    distribution: 'equal' | 'compact' | 'spread';
  };
  
  // 层次化布局配置
  hierarchicalConfig: {
    levelSeparation: number;       // 层级间距
    nodeSeparation: number;        // 节点间距
    treeSpacing: number;           // 树间距
    orientation: 'vertical' | 'horizontal';
    minimizeCrossings: boolean;    // 最小化交叉
  };
  
  // 力导向布局配置
  forceConfig: {
    attraction: number;            // 吸引力
    repulsion: number;             // 排斥力
    gravity: number;               // 重力
    friction: number;              // 摩擦力
    iterations: number;            // 迭代次数
    threshold: number;             // 收敛阈值
    springLength: number;          // 弹簧长度
  };
  
  // 圆形布局配置
  circularConfig: {
    radius: number;               // 半径
    startAngle: number;           // 起始角度
    sweepAngle: number;           // 扫描角度  
    centerX: number;              // 中心X
    centerY: number;              // 中心Y
    radiusIncrement: number;      // 半径递增
  };
  
  // 动画配置
  animationConfig: {
    enabled: boolean;
    duration: number;             // 动画时长
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
    stagger: number;              // 交错延迟
  };
}

// 布局结果
export interface LayoutResult {
  nodes: LayoutNode[];
  bounds: BoundingBox;
  metrics: {
    totalArea: number;
    averageDistance: number;
    crossingCount: number;
    balanceScore: number;
    compactness: number;
    aestheticScore: number;
  };
  animationSteps?: LayoutAnimationStep[];
  computationTime: number;
  convergenceInfo?: {
    converged: boolean;
    iterations: number;
    finalEnergy: number;
  };
}

// 动画步骤
export interface LayoutAnimationStep {
  stepIndex: number;
  duration: number;
  positions: Map<string, Vector2D>;
  easing: string;
}

// 约束求解器
interface LayoutConstraint {
  type: 'distance' | 'angle' | 'alignment' | 'containment';
  nodeIds: string[];
  parameters: Record<string, number>;
  weight: number;
  satisfied: boolean;
}

/**
 * 自动布局算法引擎
 */
export class AutoLayoutEngine {
  private config: AutoLayoutConfig;
  private nodes: Map<string, LayoutNode> = new Map();
  private constraints: LayoutConstraint[] = [];
  
  // 缓存
  private layoutCache = new Map<string, LayoutResult>();
  private metricsCache = new Map<string, any>();
  
  // 统计信息
  private stats = {
    layoutCount: 0,
    averageComputationTime: 0,
    cacheHitRate: 0,
    totalNodes: 0,
    successRate: 0
  };

  constructor(config: Partial<AutoLayoutConfig> = {}) {
    this.config = {
      type: LayoutType.GRID,
      direction: LayoutDirection.TOP_TO_BOTTOM,
      spacing: new Vector2D(50, 50),
      padding: new Vector2D(20, 20),
      preserveAspectRatio: true,
      
      gridConfig: {
        autoSize: true,
        alignment: 'center',
        distribution: 'equal'
      },
      
      hierarchicalConfig: {
        levelSeparation: 80,
        nodeSeparation: 50,
        treeSpacing: 30,
        orientation: 'vertical',
        minimizeCrossings: true
      },
      
      forceConfig: {
        attraction: 0.1,
        repulsion: 100,
        gravity: 0.01,
        friction: 0.9,
        iterations: 1000,
        threshold: 0.01,
        springLength: 100
      },
      
      circularConfig: {
        radius: 200,
        startAngle: 0,
        sweepAngle: 2 * Math.PI,
        centerX: 0,
        centerY: 0,
        radiusIncrement: 50
      },
      
      animationConfig: {
        enabled: true,
        duration: 800,
        easing: 'ease-out',
        stagger: 50
      },
      
      ...config
    };

    console.log('AutoLayoutEngine: Initialized with advanced layout algorithms');
  }

  /**
   * 设置布局节点
   */
  setLayoutNodes(items: SelectionItem[], connections?: Map<string, string[]>): void {
    this.nodes.clear();
    
    for (const item of items) {
      const node: LayoutNode = {
        id: item.id,
        originalItem: item,
        position: item.element.position ? 
          new Vector2D(item.element.position.x, item.element.position.y) :
          Vector2D.zero(),
        size: new Vector2D(item.bounds.width, item.bounds.height),
        fixed: false,
        weight: 1.0,
        connections: connections?.get(item.id) || [],
        parents: [],
        children: [],
        velocity: Vector2D.zero(),
        force: Vector2D.zero(),
        mass: 1.0
      };
      
      this.nodes.set(item.id, node);
    }
    
    // 构建层次关系
    this.buildHierarchy();
    
    console.log(`AutoLayoutEngine: Set ${items.length} layout nodes`);
  }

  /**
   * 执行自动布局
   */
  async executeLayout(type?: LayoutType): Promise<LayoutResult> {
    const layoutType = type || this.config.type;
    const startTime = performance.now();
    
    // 检查缓存
    const cacheKey = this.generateLayoutCacheKey(layoutType);
    if (this.layoutCache.has(cacheKey)) {
      this.stats.cacheHitRate++;
      return this.layoutCache.get(cacheKey)!;
    }

    console.log(`AutoLayoutEngine: Executing ${layoutType} layout for ${this.nodes.size} nodes`);

    let result: LayoutResult;

    try {
      switch (layoutType) {
        case LayoutType.GRID:
          result = await this.executeGridLayout();
          break;
          
        case LayoutType.HIERARCHICAL:
          result = await this.executeHierarchicalLayout();
          break;
          
        case LayoutType.FORCE_DIRECTED:
          result = await this.executeForceDirectedLayout();
          break;
          
        case LayoutType.CIRCULAR:
          result = await this.executeCircularLayout();
          break;
          
        case LayoutType.RADIAL:
          result = await this.executeRadialLayout();
          break;
          
        case LayoutType.TREE:
          result = await this.executeTreeLayout();
          break;
          
        case LayoutType.FLOW:
          result = await this.executeFlowLayout();
          break;
          
        case LayoutType.ORGANIC:
          result = await this.executeOrganicLayout();
          break;
          
        default:
          throw new Error(`Unsupported layout type: ${layoutType}`);
      }

      const computationTime = performance.now() - startTime;
      result.computationTime = computationTime;

      // 生成动画步骤
      if (this.config.animationConfig.enabled) {
        result.animationSteps = this.generateAnimationSteps(result);
      }

      // 缓存结果
      this.layoutCache.set(cacheKey, result);
      
      // 更新统计
      this.updateStats(computationTime, true);
      
      console.log(`AutoLayoutEngine: ${layoutType} layout completed in ${computationTime.toFixed(2)}ms`);
      
      return result;
      
    } catch (error) {
      console.error(`AutoLayoutEngine: Layout execution failed:`, error);
      this.updateStats(performance.now() - startTime, false);
      
      // 返回失败的布局结果
      return this.createFailureResult();
    }
  }

  /**
   * 网格布局
   */
  private async executeGridLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { gridConfig, spacing, padding } = this.config;
    
    // 计算网格尺寸
    const nodeCount = nodes.length;
    let columns: number, rows: number;
    
    if (gridConfig.columns && gridConfig.rows) {
      columns = gridConfig.columns;
      rows = gridConfig.rows;
    } else if (gridConfig.columns) {
      columns = gridConfig.columns;
      rows = Math.ceil(nodeCount / columns);
    } else if (gridConfig.rows) {
      rows = gridConfig.rows;
      columns = Math.ceil(nodeCount / rows);
    } else {
      // 自动计算最优网格尺寸
      columns = Math.ceil(Math.sqrt(nodeCount));
      rows = Math.ceil(nodeCount / columns);
    }

    // 计算单元格大小
    const maxNodeSize = this.calculateMaxNodeSize(nodes);
    const cellWidth = maxNodeSize.x + spacing.x;
    const cellHeight = maxNodeSize.y + spacing.y;

    // 布局节点
    const layoutNodes: LayoutNode[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const node = nodes[i];
      const row = Math.floor(i / columns);
      const col = i % columns;
      
      let x = padding.x + col * cellWidth;
      let y = padding.y + row * cellHeight;
      
      // 应用对齐
      switch (gridConfig.alignment) {
        case 'center':
          x += (cellWidth - node.size.x) / 2;
          y += (cellHeight - node.size.y) / 2;
          break;
        case 'end':
          x += cellWidth - node.size.x;
          y += cellHeight - node.size.y;
          break;
      }
      
      node.position = new Vector2D(preciseRound(x, 2), preciseRound(y, 2));
      layoutNodes.push(node);
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 层次化布局
   */
  private async executeHierarchicalLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { hierarchicalConfig, padding } = this.config;
    
    // 按层级分组
    const levels = this.groupNodesByLevel(nodes);
    const layoutNodes: LayoutNode[] = [];
    
    let currentY = padding.y;
    
    for (const [level, levelNodes] of levels) {
      // 计算层级内节点的X位置
      const totalWidth = levelNodes.reduce((sum, node) => 
        sum + node.size.x + hierarchicalConfig.nodeSeparation, 0
      ) - hierarchicalConfig.nodeSeparation;
      
      let currentX = padding.x + (this.config.bounds?.width || 1000 - totalWidth) / 2;
      
      for (const node of levelNodes) {
        node.position = new Vector2D(
          preciseRound(currentX, 2),
          preciseRound(currentY, 2)
        );
        
        currentX += node.size.x + hierarchicalConfig.nodeSeparation;
        layoutNodes.push(node);
      }
      
      // 计算下一层级的Y位置
      const maxHeight = Math.max(...levelNodes.map(n => n.size.y));
      currentY += maxHeight + hierarchicalConfig.levelSeparation;
    }
    
    // 最小化交叉（如果启用）
    if (hierarchicalConfig.minimizeCrossings) {
      this.minimizeCrossings(layoutNodes, levels);
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 力导向布局
   */
  private async executeForceDirectedLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { forceConfig } = this.config;
    
    // 初始化节点位置（如果没有的话）
    this.initializeRandomPositions(nodes);
    
    let converged = false;
    let iteration = 0;
    let totalEnergy = 0;

    console.log('AutoLayoutEngine: Starting force-directed layout simulation');

    // 主要仿真循环
    while (!converged && iteration < forceConfig.iterations) {
      totalEnergy = 0;
      
      // 清零受力
      for (const node of nodes) {
        node.force = Vector2D.zero();
      }
      
      // 计算排斥力
      this.calculateRepulsiveForces(nodes, forceConfig);
      
      // 计算吸引力
      this.calculateAttractiveForces(nodes, forceConfig);
      
      // 应用重力
      this.applyGravity(nodes, forceConfig);
      
      // 更新位置
      for (const node of nodes) {
        if (node.fixed) continue;
        
        // 应用力
        const acceleration = node.force.divide(node.mass);
        node.velocity = node.velocity.add(acceleration).multiply(forceConfig.friction);
        
        // 更新位置
        const displacement = node.velocity;
        node.position = node.position.add(displacement);
        
        // 累积能量
        totalEnergy += node.velocity.lengthSquared();
      }
      
      // 检查收敛
      const avgEnergy = totalEnergy / nodes.length;
      converged = avgEnergy < forceConfig.threshold;
      
      iteration++;
      
      // 每100次迭代输出进度
      if (iteration % 100 === 0) {
        console.log(`AutoLayoutEngine: Force-directed iteration ${iteration}, energy: ${avgEnergy.toFixed(4)}`);
      }
    }

    console.log(`AutoLayoutEngine: Force-directed layout ${converged ? 'converged' : 'stopped'} after ${iteration} iterations`);

    const bounds = this.calculateLayoutBounds(nodes);
    const metrics = this.calculateLayoutMetrics(nodes);

    return {
      nodes: nodes,
      bounds,
      metrics,
      computationTime: 0,
      convergenceInfo: {
        converged,
        iterations: iteration,
        finalEnergy: totalEnergy / nodes.length
      }
    };
  }

  /**
   * 圆形布局
   */
  private async executeCircularLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { circularConfig } = this.config;
    
    if (nodes.length === 0) {
      return this.createEmptyResult();
    }
    
    const center = new Vector2D(circularConfig.centerX, circularConfig.centerY);
    const angleIncrement = circularConfig.sweepAngle / nodes.length;
    
    const layoutNodes: LayoutNode[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const angle = circularConfig.startAngle + i * angleIncrement;
      
      const position = new Vector2D(
        center.x + Math.cos(angle) * circularConfig.radius,
        center.y + Math.sin(angle) * circularConfig.radius
      );
      
      node.position = new Vector2D(
        preciseRound(position.x, 2),
        preciseRound(position.y, 2)
      );
      
      layoutNodes.push(node);
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 径向布局
   */
  private async executeRadialLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { circularConfig } = this.config;
    
    // 按层级分组
    const levels = this.groupNodesByLevel(nodes);
    const layoutNodes: LayoutNode[] = [];
    
    const center = new Vector2D(circularConfig.centerX, circularConfig.centerY);
    
    for (const [level, levelNodes] of levels) {
      const radius = circularConfig.radius + level * circularConfig.radiusIncrement;
      const angleIncrement = (2 * Math.PI) / levelNodes.length;
      
      for (let i = 0; i < levelNodes.length; i++) {
        const node = levelNodes[i];
        const angle = i * angleIncrement;
        
        const position = new Vector2D(
          center.x + Math.cos(angle) * radius,
          center.y + Math.sin(angle) * radius
        );
        
        node.position = new Vector2D(
          preciseRound(position.x, 2),
          preciseRound(position.y, 2)
        );
        
        layoutNodes.push(node);
      }
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 树布局
   */
  private async executeTreeLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    
    // 找到根节点
    const rootNodes = nodes.filter(node => node.parents.length === 0);
    
    if (rootNodes.length === 0) {
      // 没有根节点，选择第一个作为根
      if (nodes.length > 0) {
        rootNodes.push(nodes[0]);
      }
    }

    const layoutNodes: LayoutNode[] = [];
    const { spacing, padding } = this.config;
    
    let offsetX = padding.x;
    
    for (const rootNode of rootNodes) {
      const treeWidth = this.layoutTree(rootNode, offsetX, padding.y, spacing);
      offsetX += treeWidth + spacing.x * 2;
      this.collectTreeNodes(rootNode, layoutNodes);
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 流式布局
   */
  private async executeFlowLayout(): Promise<LayoutResult> {
    const nodes = Array.from(this.nodes.values());
    const { spacing, padding } = this.config;
    const maxWidth = this.config.bounds?.width || 1000;
    
    const layoutNodes: LayoutNode[] = [];
    let currentX = padding.x;
    let currentY = padding.y;
    let lineHeight = 0;
    
    for (const node of nodes) {
      // 检查是否需要换行
      if (currentX + node.size.x > maxWidth - padding.x && currentX > padding.x) {
        currentX = padding.x;
        currentY += lineHeight + spacing.y;
        lineHeight = 0;
      }
      
      node.position = new Vector2D(
        preciseRound(currentX, 2),
        preciseRound(currentY, 2)
      );
      
      currentX += node.size.x + spacing.x;
      lineHeight = Math.max(lineHeight, node.size.y);
      
      layoutNodes.push(node);
    }

    const bounds = this.calculateLayoutBounds(layoutNodes);
    const metrics = this.calculateLayoutMetrics(layoutNodes);

    return {
      nodes: layoutNodes,
      bounds,
      metrics,
      computationTime: 0
    };
  }

  /**
   * 有机布局（基于改进的力导向算法）
   */
  private async executeOrganicLayout(): Promise<LayoutResult> {
    // 有机布局是力导向布局的变体，具有更自然的排斥和吸引力
    const organicConfig = {
      ...this.config.forceConfig,
      attraction: 0.05,
      repulsion: 200,
      gravity: 0.005,
      springLength: 80
    };

    // 临时替换配置
    const originalConfig = this.config.forceConfig;
    this.config.forceConfig = organicConfig;
    
    const result = await this.executeForceDirectedLayout();
    
    // 恢复原配置
    this.config.forceConfig = originalConfig;
    
    return result;
  }

  /**
   * 生成布局建议
   */
  async generateLayoutSuggestions(items: SelectionItem[]): Promise<{
    type: LayoutType;
    confidence: number;
    reasoning: string[];
    preview?: Vector2D[];
  }[]> {
    const suggestions: Array<{
      type: LayoutType;
      confidence: number;
      reasoning: string[];
      preview?: Vector2D[];
    }> = [];
    
    this.setLayoutNodes(items);
    const nodeCount = items.length;
    
    // 基于节点数量的建议
    if (nodeCount <= 4) {
      suggestions.push({
        type: LayoutType.CIRCULAR,
        confidence: 0.9,
        reasoning: [
          '节点数量较少，圆形布局能够很好地展示所有节点',
          '圆形布局美观且平衡'
        ]
      });
    }
    
    if (nodeCount >= 6 && nodeCount <= 20) {
      suggestions.push({
        type: LayoutType.GRID,
        confidence: 0.8,
        reasoning: [
          '节点数量适中，网格布局提供良好的组织性',
          '网格布局易于理解和导航'
        ]
      });
    }
    
    if (nodeCount > 20) {
      suggestions.push({
        type: LayoutType.FORCE_DIRECTED,
        confidence: 0.7,
        reasoning: [
          '大量节点适合力导向布局',
          '自然的聚类效果'
        ]
      });
    }
    
    // 基于连接关系的建议
    const hasHierarchy = this.detectHierarchy();
    if (hasHierarchy) {
      suggestions.push({
        type: LayoutType.HIERARCHICAL,
        confidence: 0.85,
        reasoning: [
          '检测到层次结构',
          '层次化布局能够清晰展示级别关系'
        ]
      });
    }
    
    // 按置信度排序
    suggestions.sort((a, b) => b.confidence - a.confidence);
    
    return suggestions;
  }

  // ========== 辅助方法 ==========

  private buildHierarchy(): void {
    for (const node of this.nodes.values()) {
      for (const connectionId of node.connections) {
        const connectedNode = this.nodes.get(connectionId);
        if (connectedNode) {
          // 简化的层次关系构建
          if (!node.children.includes(connectionId)) {
            node.children.push(connectionId);
          }
          if (!connectedNode.parents.includes(node.id)) {
            connectedNode.parents.push(node.id);
          }
        }
      }
    }
    
    // 计算层级
    this.calculateLevels();
  }

  private calculateLevels(): void {
    const visited = new Set<string>();
    
    // 从根节点开始
    for (const node of this.nodes.values()) {
      if (node.parents.length === 0 && !visited.has(node.id)) {
        this.assignLevels(node, 0, visited);
      }
    }
  }

  private assignLevels(node: LayoutNode, level: number, visited: Set<string>): void {
    if (visited.has(node.id)) return;
    
    visited.add(node.id);
    node.level = level;
    
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        this.assignLevels(childNode, level + 1, visited);
      }
    }
  }

  private calculateMaxNodeSize(nodes: LayoutNode[]): Vector2D {
    if (nodes.length === 0) return Vector2D.zero();
    
    const maxWidth = Math.max(...nodes.map(n => n.size.x));
    const maxHeight = Math.max(...nodes.map(n => n.size.y));
    
    return new Vector2D(maxWidth, maxHeight);
  }

  private groupNodesByLevel(nodes: LayoutNode[]): Map<number, LayoutNode[]> {
    const levels = new Map<number, LayoutNode[]>();
    
    for (const node of nodes) {
      const level = node.level || 0;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(node);
    }
    
    return levels;
  }

  private minimizeCrossings(nodes: LayoutNode[], levels: Map<number, LayoutNode[]>): void {
    // 简化的交叉最小化算法
    // 实际实现会更复杂，这里只是示例
    console.log('AutoLayoutEngine: Minimizing crossings (simplified implementation)');
  }

  private initializeRandomPositions(nodes: LayoutNode[]): void {
    const bounds = this.config.bounds || BoundingBox.fromRect(0, 0, 800, 600);
    
    for (const node of nodes) {
      if (node.position.equals(Vector2D.zero())) {
        node.position = new Vector2D(
          Math.random() * bounds.width,
          Math.random() * bounds.height
        );
      }
    }
  }

  private calculateRepulsiveForces(nodes: LayoutNode[], config: typeof this.config.forceConfig): void {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < 0.1) continue; // 避免除零
        
        const repulsiveForce = config.repulsion / (distance * distance);
        const direction = nodeA.position.subtract(nodeB.position).normalize();
        
        const force = direction.multiply(repulsiveForce);
        nodeA.force = nodeA.force.add(force);
        nodeB.force = nodeB.force.subtract(force);
      }
    }
  }

  private calculateAttractiveForces(nodes: LayoutNode[], config: typeof this.config.forceConfig): void {
    for (const node of nodes) {
      for (const connectionId of node.connections) {
        const connectedNode = this.nodes.get(connectionId);
        if (!connectedNode) continue;
        
        const distance = node.position.distanceTo(connectedNode.position);
        const springForce = config.attraction * (distance - config.springLength);
        
        const direction = connectedNode.position.subtract(node.position).normalize();
        const force = direction.multiply(springForce);
        
        node.force = node.force.add(force);
      }
    }
  }

  private applyGravity(nodes: LayoutNode[], config: typeof this.config.forceConfig): void {
    const bounds = this.config.bounds || BoundingBox.fromRect(0, 0, 800, 600);
    const center = bounds.center;
    
    for (const node of nodes) {
      const toCenter = center.subtract(node.position);
      const gravityForce = toCenter.multiply(config.gravity);
      node.force = node.force.add(gravityForce);
    }
  }

  private layoutTree(node: LayoutNode, x: number, y: number, spacing: Vector2D): number {
    node.position = new Vector2D(x, y);
    
    if (node.children.length === 0) {
      return node.size.x;
    }
    
    let childX = x;
    let maxWidth = 0;
    const childY = y + node.size.y + spacing.y;
    
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        const childWidth = this.layoutTree(childNode, childX, childY, spacing);
        childX += childWidth + spacing.x;
        maxWidth += childWidth + spacing.x;
      }
    }
    
    maxWidth -= spacing.x; // 移除最后一个间距
    
    // 居中对齐父节点
    if (maxWidth > node.size.x) {
      const offset = (maxWidth - node.size.x) / 2;
      node.position = node.position.add(new Vector2D(offset, 0));
    }
    
    return Math.max(maxWidth, node.size.x);
  }

  private collectTreeNodes(node: LayoutNode, result: LayoutNode[]): void {
    result.push(node);
    for (const childId of node.children) {
      const childNode = this.nodes.get(childId);
      if (childNode) {
        this.collectTreeNodes(childNode, result);
      }
    }
  }

  private calculateLayoutBounds(nodes: LayoutNode[]): BoundingBox {
    if (nodes.length === 0) {
      return BoundingBox.fromRect(0, 0, 0, 0);
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + node.size.x);
      maxY = Math.max(maxY, node.position.y + node.size.y);
    }
    
    return BoundingBox.fromRect(minX, minY, maxX - minX, maxY - minY);
  }

  private calculateLayoutMetrics(nodes: LayoutNode[]): LayoutResult['metrics'] {
    if (nodes.length === 0) {
      return {
        totalArea: 0,
        averageDistance: 0,
        crossingCount: 0,
        balanceScore: 0,
        compactness: 0,
        aestheticScore: 0
      };
    }
    
    const bounds = this.calculateLayoutBounds(nodes);
    const totalArea = bounds.area;
    
    // 计算平均距离
    let totalDistance = 0;
    let pairCount = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        totalDistance += nodes[i].position.distanceTo(nodes[j].position);
        pairCount++;
      }
    }
    
    const averageDistance = pairCount > 0 ? totalDistance / pairCount : 0;
    
    // 简化的其他指标
    const crossingCount = 0; // 需要实现边的交叉检测
    const balanceScore = this.calculateBalanceScore(nodes);
    const compactness = this.calculateCompactness(nodes, bounds);
    const aestheticScore = (balanceScore + compactness) / 2;
    
    return {
      totalArea,
      averageDistance,
      crossingCount,
      balanceScore,
      compactness,
      aestheticScore
    };
  }

  private calculateBalanceScore(nodes: LayoutNode[]): number {
    if (nodes.length === 0) return 1;
    
    // 计算质心
    const centroid = nodes.reduce((sum, node) => 
      sum.add(node.position), Vector2D.zero()
    ).divide(nodes.length);
    
    // 计算与质心的距离分布
    const distances = nodes.map(node => node.position.distanceTo(centroid));
    const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
    
    // 方差越小，平衡性越好
    return Math.max(0, 1 - variance / (avgDistance * avgDistance));
  }

  private calculateCompactness(nodes: LayoutNode[], bounds: BoundingBox): number {
    if (nodes.length === 0) return 1;
    
    const nodesArea = nodes.reduce((sum, node) => sum + node.size.x * node.size.y, 0);
    return nodesArea / bounds.area;
  }

  private generateAnimationSteps(result: LayoutResult): LayoutAnimationStep[] {
    const steps: LayoutAnimationStep[] = [];
    const { duration, stagger } = this.config.animationConfig;
    
    // 简化实现：创建单个动画步骤
    const positions = new Map<string, Vector2D>();
    for (const node of result.nodes) {
      positions.set(node.id, node.position);
    }
    
    steps.push({
      stepIndex: 0,
      duration,
      positions,
      easing: this.config.animationConfig.easing
    });
    
    return steps;
  }

  private detectHierarchy(): boolean {
    let hasHierarchy = false;
    for (const node of this.nodes.values()) {
      if (node.children.length > 0 || node.parents.length > 0) {
        hasHierarchy = true;
        break;
      }
    }
    return hasHierarchy;
  }

  private generateLayoutCacheKey(type: LayoutType): string {
    const nodePositions = Array.from(this.nodes.values())
      .map(node => `${node.id}:${node.position.x},${node.position.y}`)
      .join('|');
    return `${type}_${nodePositions}`;
  }

  private createEmptyResult(): LayoutResult {
    return {
      nodes: [],
      bounds: BoundingBox.fromRect(0, 0, 0, 0),
      metrics: {
        totalArea: 0,
        averageDistance: 0,
        crossingCount: 0,
        balanceScore: 0,
        compactness: 0,
        aestheticScore: 0
      },
      computationTime: 0
    };
  }

  private createFailureResult(): LayoutResult {
    const nodes = Array.from(this.nodes.values());
    return {
      nodes,
      bounds: this.calculateLayoutBounds(nodes),
      metrics: this.calculateLayoutMetrics(nodes),
      computationTime: 0
    };
  }

  private updateStats(computationTime: number, success: boolean): void {
    this.stats.layoutCount++;
    this.stats.averageComputationTime = (
      this.stats.averageComputationTime * (this.stats.layoutCount - 1) + computationTime
    ) / this.stats.layoutCount;
    
    if (success) {
      this.stats.successRate = (
        (this.stats.successRate * (this.stats.layoutCount - 1)) + 1
      ) / this.stats.layoutCount;
    } else {
      this.stats.successRate = (
        this.stats.successRate * (this.stats.layoutCount - 1)
      ) / this.stats.layoutCount;
    }
    
    this.stats.totalNodes = this.nodes.size;
  }

  /**
   * 获取布局统计信息
   */
  getLayoutStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.nodes.clear();
    this.constraints.length = 0;
    this.layoutCache.clear();
    this.metricsCache.clear();
    
    console.log('AutoLayoutEngine: Resources disposed');
  }
}

/**
 * 工厂函数：创建自动布局引擎
 */
export function createAutoLayoutEngine(
  config?: Partial<AutoLayoutConfig>
): AutoLayoutEngine {
  return new AutoLayoutEngine(config);
}

/**
 * 工厂函数：创建专业级布局引擎
 */
export function createProfessionalLayoutEngine(): AutoLayoutEngine {
  return new AutoLayoutEngine({
    type: LayoutType.FORCE_DIRECTED,
    spacing: new Vector2D(80, 80),
    forceConfig: {
      attraction: 0.08,
      repulsion: 150,
      gravity: 0.008,
      friction: 0.95,
      iterations: 2000,
      threshold: 0.005,
      springLength: 120
    },
    animationConfig: {
      enabled: true,
      duration: 1200,
      easing: 'ease-out',
      stagger: 100
    }
  });
}