/**
 * Agent 6: 物理引擎集成专家
 * 物理动画系统集成 - 无缝集成物理引擎与现有拖拽系统
 * 
 * 特性：
 * - 与现有拖拽系统的无缝集成
 * - 物理状态和视觉状态同步
 * - 动画状态机和转换管理
 * - 性能监控和自适应质量
 * - 物理效果的优雅降级
 * - 实时调试和可视化工具
 */

import { Vector2D, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { PhysicsEngine2D, RigidBodyDef, createDragOptimizedPhysicsEngine } from './physics-engine-core';
import { SpringAnimationQueue, AdvancedEasingFunctions, PhysicsSpringAnimation, createElasticConfig } from './spring-animation-system';
import { EnhancedCollisionSystem, createStandardCollisionConfig } from './enhanced-collision-system';
import { PhysicsInteractionEffectsManager, createStandardPhysicsConfig } from './physics-interaction-effects';

// 物理动画状态
export type PhysicsAnimationState = 'idle' | 'dragging' | 'throwing' | 'bouncing' | 'settling' | 'constrained';

// 物理增强配置
export interface PhysicsEnhancementConfig {
  // 启用开关
  enablePhysics: boolean;          // 总开关
  enableSprings: boolean;          // 弹簧动画
  enableCollisions: boolean;       // 碰撞检测
  enableInertia: boolean;          // 惯性效果
  enableMagnetics: boolean;        // 磁性吸附
  
  // 质量级别
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  adaptiveQuality: boolean;        // 自适应质量
  
  // 性能设置
  maxPhysicsObjects: number;       // 最大物理对象数
  updateFrequency: number;         // 更新频率
  enableDebugMode: boolean;        // 调试模式
  
  // 视觉效果
  showPhysicsDebug: boolean;       // 显示物理调试信息
  showForceVectors: boolean;       // 显示力向量
  showConstraints: boolean;        // 显示约束
  showCollisionBounds: boolean;    // 显示碰撞边界
}

// 物理增强的节点状态
export interface PhysicsEnhancedNode {
  id: string;
  
  // 基础状态
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  
  // 物理属性
  physicsBodyId?: string;          // 物理刚体ID
  collisionBodyId?: string;        // 碰撞体ID
  interactionObjectId?: string;    // 交互对象ID
  
  // 动画状态
  animationState: PhysicsAnimationState;
  springAnimations: Map<string, PhysicsSpringAnimation>;
  
  // 约束和连接
  constraints: string[];           // 约束ID列表
  connectedNodes: string[];        // 连接的节点ID
  
  // 视觉状态
  visualPosition: Vector2D;        // 渲染位置（可能与物理位置不同）
  interpolationFactor: number;     // 插值因子
  
  // 配置
  config: {
    mass: number;
    friction: number;
    restitution: number;
    magneticStrength: number;
    springStiffness: number;
    springDamping: number;
  };
  
  // 回调
  onStateChange?: (oldState: PhysicsAnimationState, newState: PhysicsAnimationState) => void;
  onPhysicsUpdate?: (node: PhysicsEnhancedNode) => void;
}

// 状态转换规则
export interface StateTransition {
  from: PhysicsAnimationState;
  to: PhysicsAnimationState;
  condition: (node: PhysicsEnhancedNode) => boolean;
  onTransition?: (node: PhysicsEnhancedNode) => void;
}

// 性能指标
export interface PerformanceMetrics {
  fps: number;
  physicsTime: number;
  animationTime: number;
  renderTime: number;
  memoryUsage: number;
  activeNodes: number;
  activeAnimations: number;
  qualityLevel: string;
}

/**
 * 物理动画状态机
 */
export class PhysicsAnimationStateMachine {
  private transitions: StateTransition[] = [];
  
  constructor() {
    this.setupDefaultTransitions();
  }
  
  /**
   * 设置默认状态转换
   */
  private setupDefaultTransitions(): void {
    // idle -> dragging
    this.addTransition('idle', 'dragging', (node) => node.animationState === 'idle');
    
    // dragging -> throwing
    this.addTransition('dragging', 'throwing', (node) => 
      node.velocity.length() > 50 && node.animationState === 'dragging'
    );
    
    // throwing -> bouncing
    this.addTransition('throwing', 'bouncing', (node) => 
      node.animationState === 'throwing' && this.detectBoundaryCollision(node)
    );
    
    // bouncing -> settling
    this.addTransition('bouncing', 'settling', (node) => 
      node.velocity.length() < 20 && node.animationState === 'bouncing'
    );
    
    // settling -> idle
    this.addTransition('settling', 'idle', (node) => 
      node.velocity.length() < 1 && node.animationState === 'settling'
    );
    
    // any -> constrained (when constraints are active)
    for (const from of ['idle', 'dragging', 'throwing', 'bouncing', 'settling']) {
      this.addTransition(from as PhysicsAnimationState, 'constrained', (node) => 
        node.constraints.length > 0 && this.hasActiveConstraints(node)
      );
    }
  }
  
  /**
   * 添加状态转换
   */
  addTransition(
    from: PhysicsAnimationState, 
    to: PhysicsAnimationState, 
    condition: (node: PhysicsEnhancedNode) => boolean,
    onTransition?: (node: PhysicsEnhancedNode) => void
  ): void {
    this.transitions.push({ from, to, condition, onTransition });
  }
  
  /**
   * 更新节点状态
   */
  updateState(node: PhysicsEnhancedNode): PhysicsAnimationState {
    const currentState = node.animationState;
    
    for (const transition of this.transitions) {
      if (transition.from === currentState && transition.condition(node)) {
        const newState = transition.to;
        
        if (newState !== currentState) {
          // 执行状态转换
          const oldState = currentState;
          node.animationState = newState;
          
          // 调用转换回调
          if (transition.onTransition) {
            transition.onTransition(node);
          }
          
          // 调用节点状态变化回调
          if (node.onStateChange) {
            node.onStateChange(oldState, newState);
          }
          
          console.log(`PhysicsAnimationStateMachine: Node ${node.id} transitioned from ${oldState} to ${newState}`);
        }
        
        break;
      }
    }
    
    return node.animationState;
  }
  
  /**
   * 检测边界碰撞
   */
  private detectBoundaryCollision(node: PhysicsEnhancedNode): boolean {
    // 简化实现，实际应该与边界系统集成
    return false;
  }
  
  /**
   * 检查是否有活跃约束
   */
  private hasActiveConstraints(node: PhysicsEnhancedNode): boolean {
    return node.constraints.length > 0;
  }
}

/**
 * 自适应质量控制器
 */
export class AdaptiveQualityController {
  private targetFps = 60;
  private currentFps = 60;
  private frameHistory: number[] = [];
  private qualityLevel: PhysicsEnhancementConfig['qualityLevel'] = 'medium';
  
  /**
   * 更新FPS测量
   */
  updateFps(frameTime: number): void {
    const fps = 1000 / frameTime;
    this.frameHistory.push(fps);
    
    if (this.frameHistory.length > 10) {
      this.frameHistory.shift();
    }
    
    // 计算平均FPS
    this.currentFps = this.frameHistory.reduce((sum, fps) => sum + fps, 0) / this.frameHistory.length;
  }
  
  /**
   * 自动调整质量级别
   */
  adjustQuality(): PhysicsEnhancementConfig['qualityLevel'] {
    const fpsRatio = this.currentFps / this.targetFps;
    
    if (fpsRatio < 0.7) {
      // 性能不足，降低质量
      this.qualityLevel = this.lowerQuality(this.qualityLevel);
    } else if (fpsRatio > 1.2) {
      // 性能有余，提高质量
      this.qualityLevel = this.raiseQuality(this.qualityLevel);
    }
    
    return this.qualityLevel;
  }
  
  /**
   * 降低质量级别
   */
  private lowerQuality(current: PhysicsEnhancementConfig['qualityLevel']): PhysicsEnhancementConfig['qualityLevel'] {
    switch (current) {
      case 'ultra': return 'high';
      case 'high': return 'medium';
      case 'medium': return 'low';
      case 'low': return 'low';
      default: return 'medium';
    }
  }
  
  /**
   * 提高质量级别
   */
  private raiseQuality(current: PhysicsEnhancementConfig['qualityLevel']): PhysicsEnhancementConfig['qualityLevel'] {
    switch (current) {
      case 'low': return 'medium';
      case 'medium': return 'high';
      case 'high': return 'ultra';
      case 'ultra': return 'ultra';
      default: return 'medium';
    }
  }
  
  /**
   * 获取质量配置
   */
  getQualityConfig(level: PhysicsEnhancementConfig['qualityLevel']): {
    updateFrequency: number;
    maxObjects: number;
    enableAdvancedFeatures: boolean;
  } {
    const configs = {
      low: { updateFrequency: 30, maxObjects: 50, enableAdvancedFeatures: false },
      medium: { updateFrequency: 60, maxObjects: 100, enableAdvancedFeatures: true },
      high: { updateFrequency: 60, maxObjects: 200, enableAdvancedFeatures: true },
      ultra: { updateFrequency: 120, maxObjects: 500, enableAdvancedFeatures: true }
    };
    
    return configs[level];
  }
}

/**
 * 物理动画集成管理器
 */
export class PhysicsAnimationIntegrationManager {
  // 子系统
  private physicsEngine: PhysicsEngine2D;
  private collisionSystem: EnhancedCollisionSystem;
  private interactionManager: PhysicsInteractionEffectsManager;
  private animationQueue: SpringAnimationQueue;
  
  // 状态管理
  private stateMachine: PhysicsAnimationStateMachine;
  private qualityController: AdaptiveQualityController;
  
  // 节点管理
  private nodes: Map<string, PhysicsEnhancedNode> = new Map();
  
  // 配置
  private config: PhysicsEnhancementConfig;
  
  // 性能监控
  private performanceMetrics: PerformanceMetrics = {
    fps: 60,
    physicsTime: 0,
    animationTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    activeNodes: 0,
    activeAnimations: 0,
    qualityLevel: 'medium'
  };
  
  // 调试工具
  private debugCanvas?: HTMLCanvasElement;
  private debugContext?: CanvasRenderingContext2D;
  
  constructor(config: Partial<PhysicsEnhancementConfig> = {}) {
    this.config = {
      enablePhysics: true,
      enableSprings: true,
      enableCollisions: true,
      enableInertia: true,
      enableMagnetics: true,
      qualityLevel: 'medium',
      adaptiveQuality: true,
      maxPhysicsObjects: 100,
      updateFrequency: 60,
      enableDebugMode: false,
      showPhysicsDebug: false,
      showForceVectors: false,
      showConstraints: false,
      showCollisionBounds: false,
      ...config
    };
    
    // 初始化子系统
    this.physicsEngine = createDragOptimizedPhysicsEngine();
    this.collisionSystem = new EnhancedCollisionSystem();
    this.interactionManager = new PhysicsInteractionEffectsManager();
    this.animationQueue = new SpringAnimationQueue();
    
    // 初始化状态管理
    this.stateMachine = new PhysicsAnimationStateMachine();
    this.qualityController = new AdaptiveQualityController();
    
    // 初始化调试工具
    if (this.config.enableDebugMode) {
      this.initializeDebugTools();
    }
    
    console.log('PhysicsAnimationIntegrationManager: Initialized with full physics integration');
  }
  
  /**
   * 创建物理增强节点
   */
  createPhysicsNode(
    id: string,
    position: Vector2D,
    config: Partial<PhysicsEnhancedNode['config']> = {}
  ): PhysicsEnhancedNode {
    const node: PhysicsEnhancedNode = {
      id,
      position: position.clone(),
      velocity: Vector2D.zero(),
      acceleration: Vector2D.zero(),
      animationState: 'idle',
      springAnimations: new Map(),
      constraints: [],
      connectedNodes: [],
      visualPosition: position.clone(),
      interpolationFactor: 0,
      
      config: {
        mass: 1.0,
        friction: 0.1,
        restitution: 0.5,
        magneticStrength: 1.0,
        springStiffness: 100,
        springDamping: 10,
        ...config
      }
    };
    
    // 创建物理刚体
    if (this.config.enablePhysics) {
      const bodyDef: RigidBodyDef = {
        id: `${id}_physics`,
        type: 'dynamic',
        position: position.clone(),
        rotation: 0,
        linearVelocity: Vector2D.zero(),
        angularVelocity: 0,
        mass: node.config.mass,
        density: 1.0,
        friction: node.config.friction,
        restitution: node.config.restitution,
        shapes: [{
          type: 'circle',
          offset: Vector2D.zero(),
          rotation: 0,
          radius: 20,
          friction: node.config.friction,
          restitution: node.config.restitution,
          density: 1.0,
          isSensor: false
        }],
        fixedRotation: true,
        isSensor: false,
        allowSleep: true
      };
      
      node.physicsBodyId = this.physicsEngine.createBody(bodyDef);
    }
    
    // 创建碰撞体
    if (this.config.enableCollisions) {
      const collisionConfig = createStandardCollisionConfig();
      collisionConfig.restitution = node.config.restitution;
      collisionConfig.friction = node.config.friction;
      
      node.collisionBodyId = this.collisionSystem.addBody({
        id: `${id}_collision`,
        type: 'dynamic',
        shape: {
          type: 'circle',
          offset: Vector2D.zero(),
          rotation: 0,
          radius: 20,
          isTrigger: false
        },
        position: position.clone(),
        rotation: 0,
        scale: new Vector2D(1, 1),
        config: collisionConfig
      });
    }
    
    // 创建交互对象
    if (this.config.enableInertia) {
      const interactionObject = this.interactionManager.addObject(
        `${id}_interaction`,
        position.clone(),
        {
          mass: node.config.mass,
          friction: node.config.friction,
          restitution: node.config.restitution,
          magneticSusceptibility: node.config.magneticStrength,
          onUpdate: (obj) => {
            node.position = obj.position.clone();
            node.velocity = obj.velocity.clone();
          }
        }
      );
      
      node.interactionObjectId = interactionObject.id;
    }
    
    this.nodes.set(id, node);
    console.log(`PhysicsAnimationIntegrationManager: Created physics node ${id}`);
    
    return node;
  }
  
  /**
   * 开始拖拽节点
   */
  startNodeDrag(nodeId: string, dragPosition: Vector2D): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // 更新状态机
    node.animationState = 'dragging';
    this.stateMachine.updateState(node);
    
    // 启动物理交互
    if (node.interactionObjectId && this.config.enableInertia) {
      const dragConfig = createStandardPhysicsConfig();
      this.interactionManager.startDrag(node.interactionObjectId, dragPosition, dragConfig);
    }
    
    // 停止现有弹簧动画
    for (const animation of node.springAnimations.values()) {
      animation.stop();
    }
    node.springAnimations.clear();
    
    console.log(`PhysicsAnimationIntegrationManager: Started drag for node ${nodeId}`);
  }
  
  /**
   * 更新拖拽
   */
  updateNodeDrag(nodeId: string, dragPosition: Vector2D, deltaTime: number): void {
    const node = this.nodes.get(nodeId);
    if (!node || node.animationState !== 'dragging') return;
    
    // 更新物理交互
    if (node.interactionObjectId && this.config.enableInertia) {
      this.interactionManager.updateDrag(node.interactionObjectId, dragPosition, deltaTime);
    } else {
      // 直接更新位置
      node.position = dragPosition.clone();
      node.visualPosition = dragPosition.clone();
    }
    
    // 同步物理引擎
    if (node.physicsBodyId) {
      const body = this.physicsEngine.getBody(node.physicsBodyId);
      if (body) {
        // 将拖拽位置同步到物理引擎
        body.position = dragPosition.clone();
        body.velocity = Vector2D.zero(); // 拖拽时清除速度
      }
    }
    
    // 同步碰撞系统
    if (node.collisionBodyId) {
      this.collisionSystem.updateBodyPosition(node.collisionBodyId, dragPosition);
    }
  }
  
  /**
   * 结束拖拽
   */
  endNodeDrag(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // 结束物理交互
    if (node.interactionObjectId && this.config.enableInertia) {
      this.interactionManager.endDrag(node.interactionObjectId);
    }
    
    // 状态转换为抛掷或静止
    if (node.velocity.length() > 50) {
      node.animationState = 'throwing';
    } else {
      node.animationState = 'settling';
    }
    
    this.stateMachine.updateState(node);
    
    console.log(`PhysicsAnimationIntegrationManager: Ended drag for node ${nodeId}`);
  }
  
  /**
   * 添加弹簧动画
   */
  addSpringAnimation(
    nodeId: string,
    targetPosition: Vector2D,
    config = createElasticConfig()
  ): void {
    const node = this.nodes.get(nodeId);
    if (!node || !this.config.enableSprings) return;
    
    const animationId = `spring_${nodeId}_${Date.now()}`;
    
    // 创建弹簧动画
    const springAnimation = new PhysicsSpringAnimation({
      ...config,
      onUpdate: (value, progress) => {
        if (typeof value === 'number') return;
        
        const position = value as Vector2D;
        node.visualPosition = position;
        
        // 插值到物理位置
        node.position = node.position.lerp(position, node.interpolationFactor);
        
        if (node.onPhysicsUpdate) {
          node.onPhysicsUpdate(node);
        }
      },
      onComplete: (finalValue) => {
        node.springAnimations.delete(animationId);
        node.animationState = 'idle';
        this.stateMachine.updateState(node);
      }
    });
    
    node.springAnimations.set(animationId, springAnimation);
    
    // 启动动画
    springAnimation.start(
      node.position.distanceTo(targetPosition),
      0
    );
  }
  
  /**
   * 物理系统步进
   */
  step(deltaTime: number): void {
    const startTime = performance.now();
    
    // 自适应质量控制
    if (this.config.adaptiveQuality) {
      this.qualityController.updateFps(deltaTime * 1000);
      const newQuality = this.qualityController.adjustQuality();
      
      if (newQuality !== this.config.qualityLevel) {
        this.config.qualityLevel = newQuality;
        this.applyQualitySettings(newQuality);
      }
    }
    
    // 更新物理引擎
    const physicsStart = performance.now();
    if (this.config.enablePhysics) {
      this.physicsEngine.step(deltaTime);
    }
    this.performanceMetrics.physicsTime = performance.now() - physicsStart;
    
    // 更新碰撞系统
    if (this.config.enableCollisions) {
      this.collisionSystem.step(deltaTime);
    }
    
    // 更新交互效果
    if (this.config.enableInertia) {
      this.interactionManager.step(deltaTime);
    }
    
    // 更新动画队列
    const animStart = performance.now();
    // Animation queue update would go here
    this.performanceMetrics.animationTime = performance.now() - animStart;
    
    // 更新所有节点的状态机
    for (const node of this.nodes.values()) {
      this.stateMachine.updateState(node);
      this.interpolateNodePosition(node, deltaTime);
    }
    
    // 更新性能指标
    this.updatePerformanceMetrics(performance.now() - startTime);
    
    // 调试渲染
    if (this.config.showPhysicsDebug) {
      this.renderDebugInfo();
    }
  }
  
  /**
   * 插值节点位置
   */
  private interpolateNodePosition(node: PhysicsEnhancedNode, deltaTime: number): void {
    // 平滑插值物理位置和视觉位置
    const lerpFactor = Math.min(deltaTime * 10, 1); // 10x/s 插值速度
    node.visualPosition = node.visualPosition.lerp(node.position, lerpFactor);
    node.interpolationFactor = lerpFactor;
  }
  
  /**
   * 应用质量设置
   */
  private applyQualitySettings(level: PhysicsEnhancementConfig['qualityLevel']): void {
    const qualityConfig = this.qualityController.getQualityConfig(level);
    
    this.config.updateFrequency = qualityConfig.updateFrequency;
    this.config.maxPhysicsObjects = qualityConfig.maxObjects;
    
    // 根据质量级别调整物理引擎配置
    this.physicsEngine.updateConfig({
      fixedTimeStep: 1 / qualityConfig.updateFrequency,
      velocityIterations: level === 'low' ? 4 : level === 'ultra' ? 12 : 8,
      positionIterations: level === 'low' ? 2 : level === 'ultra' ? 4 : 3
    });
    
    console.log(`PhysicsAnimationIntegrationManager: Applied ${level} quality settings`);
  }
  
  /**
   * 初始化调试工具
   */
  private initializeDebugTools(): void {
    this.debugCanvas = document.createElement('canvas');
    this.debugCanvas.style.position = 'fixed';
    this.debugCanvas.style.top = '0';
    this.debugCanvas.style.left = '0';
    this.debugCanvas.style.pointerEvents = 'none';
    this.debugCanvas.style.zIndex = '9999';
    this.debugCanvas.width = window.innerWidth;
    this.debugCanvas.height = window.innerHeight;
    
    this.debugContext = this.debugCanvas.getContext('2d');
    document.body.appendChild(this.debugCanvas);
    
    console.log('PhysicsAnimationIntegrationManager: Debug tools initialized');
  }
  
  /**
   * 渲染调试信息
   */
  private renderDebugInfo(): void {
    if (!this.debugContext || !this.debugCanvas) return;
    
    const ctx = this.debugContext;
    ctx.clearRect(0, 0, this.debugCanvas.width, this.debugCanvas.height);
    
    // 渲染节点信息
    for (const node of this.nodes.values()) {
      this.renderNodeDebug(ctx, node);
    }
    
    // 渲染性能信息
    this.renderPerformanceInfo(ctx);
  }
  
  /**
   * 渲染节点调试信息
   */
  private renderNodeDebug(ctx: CanvasRenderingContext2D, node: PhysicsEnhancedNode): void {
    const pos = node.visualPosition;
    
    // 节点位置
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 速度向量
    if (this.config.showForceVectors && node.velocity.length() > 0) {
      const endPos = pos.add(node.velocity.multiply(0.1));
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 箭头
      const arrowAngle = Math.atan2(node.velocity.y, node.velocity.x);
      const arrowSize = 8;
      
      ctx.beginPath();
      ctx.moveTo(endPos.x, endPos.y);
      ctx.lineTo(
        endPos.x - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endPos.y - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
      );
      ctx.moveTo(endPos.x, endPos.y);
      ctx.lineTo(
        endPos.x - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endPos.y - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
      );
      ctx.stroke();
    }
    
    // 状态文本
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px monospace';
    ctx.fillText(`${node.id}: ${node.animationState}`, pos.x + 25, pos.y - 10);
    ctx.fillText(`v: ${node.velocity.length().toFixed(1)}`, pos.x + 25, pos.y + 5);
    ctx.fillText(`m: ${node.config.mass}`, pos.x + 25, pos.y + 20);
  }
  
  /**
   * 渲染性能信息
   */
  private renderPerformanceInfo(ctx: CanvasRenderingContext2D): void {
    const metrics = this.performanceMetrics;
    const lines = [
      `FPS: ${metrics.fps.toFixed(1)}`,
      `Physics: ${metrics.physicsTime.toFixed(2)}ms`,
      `Animation: ${metrics.animationTime.toFixed(2)}ms`,
      `Render: ${metrics.renderTime.toFixed(2)}ms`,
      `Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      `Active Nodes: ${metrics.activeNodes}`,
      `Quality: ${metrics.qualityLevel}`
    ];
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, lines.length * 20 + 20);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    
    lines.forEach((line, index) => {
      ctx.fillText(line, 20, 30 + index * 20);
    });
  }
  
  /**
   * 更新性能指标
   */
  private updatePerformanceMetrics(frameTime: number): void {
    this.performanceMetrics.fps = 1000 / (frameTime || 16.67);
    this.performanceMetrics.renderTime = frameTime;
    this.performanceMetrics.activeNodes = this.nodes.size;
    this.performanceMetrics.qualityLevel = this.config.qualityLevel;
    this.performanceMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
  }
  
  /**
   * 获取节点
   */
  getNode(id: string): PhysicsEnhancedNode | undefined {
    return this.nodes.get(id);
  }
  
  /**
   * 获取所有节点
   */
  getAllNodes(): PhysicsEnhancedNode[] {
    return Array.from(this.nodes.values());
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<PhysicsEnhancementConfig>): void {
    const oldConfig = { ...this.config };
    Object.assign(this.config, config);
    
    // 应用配置变更
    if (config.enableDebugMode !== undefined && config.enableDebugMode !== oldConfig.enableDebugMode) {
      if (config.enableDebugMode) {
        this.initializeDebugTools();
      } else if (this.debugCanvas) {
        this.debugCanvas.remove();
        this.debugCanvas = undefined;
        this.debugContext = undefined;
      }
    }
    
    console.log('PhysicsAnimationIntegrationManager: Configuration updated');
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    // 清理子系统
    this.physicsEngine.dispose();
    this.collisionSystem.dispose();
    this.interactionManager.dispose();
    this.animationQueue.clear();
    
    // 清理节点
    this.nodes.clear();
    
    // 清理调试工具
    if (this.debugCanvas) {
      this.debugCanvas.remove();
    }
    
    console.log('PhysicsAnimationIntegrationManager: Resources disposed');
  }
}

/**
 * 工厂函数：创建标准物理增强配置
 */
export function createStandardPhysicsEnhancement(): PhysicsEnhancementConfig {
  return {
    enablePhysics: true,
    enableSprings: true,
    enableCollisions: true,
    enableInertia: true,
    enableMagnetics: true,
    qualityLevel: 'medium',
    adaptiveQuality: true,
    maxPhysicsObjects: 100,
    updateFrequency: 60,
    enableDebugMode: false,
    showPhysicsDebug: false,
    showForceVectors: false,
    showConstraints: false,
    showCollisionBounds: false
  };
}

/**
 * 工厂函数：创建高性能物理增强配置
 */
export function createHighPerformancePhysicsEnhancement(): PhysicsEnhancementConfig {
  return {
    enablePhysics: true,
    enableSprings: true,
    enableCollisions: false, // 禁用碰撞以提升性能
    enableInertia: true,
    enableMagnetics: true,
    qualityLevel: 'high',
    adaptiveQuality: true,
    maxPhysicsObjects: 200,
    updateFrequency: 60,
    enableDebugMode: false,
    showPhysicsDebug: false,
    showForceVectors: false,
    showConstraints: false,
    showCollisionBounds: false
  };
}