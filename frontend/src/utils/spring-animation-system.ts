/**
 * Agent 6: 物理引擎集成专家
 * 弹性动画系统 - 高级缓动函数和基于物理的弹簧动画
 * 
 * 特性：
 * - 20+ 高级缓动函数库
 * - 基于物理的弹簧动画系统
 * - 阻尼振荡和衰减效果
 * - 链式动画和动画队列管理
 * - GPU加速和性能优化
 * - 自适应质量控制
 */

import { Vector2D, preciseRound, MathUtils, PRECISION } from './math-precision';
import { memoryManager, acquireVector2D, releaseVector2D } from './memory-manager';
import { renderOptimizer } from './render-optimizer';

// 缓动函数类型
export type EasingFunction = (t: number) => number;

// 动画状态
export type AnimationState = 'pending' | 'running' | 'paused' | 'completed' | 'cancelled';

// 动画配置
export interface SpringAnimationConfig {
  // 弹簧物理参数
  stiffness: number;              // 弹簧刚度 (0-1000)
  damping: number;                // 阻尼系数 (0-100)
  mass: number;                   // 质量 (0.1-10)
  velocity?: number;              // 初始速度
  
  // 动画参数
  duration?: number;              // 最大持续时间 (ms)
  precision: number;              // 精度阈值
  restDisplacement: number;       // 静止位移阈值
  restVelocity: number;           // 静止速度阈值
  
  // 性能设置
  useRAF: boolean;               // 使用 requestAnimationFrame
  gpuAccelerated: boolean;       // GPU 加速
  adaptiveQuality: boolean;       // 自适应质量
  
  // 回调函数
  onUpdate?: (value: any, progress: number) => void;
  onComplete?: (finalValue: any) => void;
  onCancel?: () => void;
}

// 动画值类型
export type AnimationValue = number | Vector2D | { [key: string]: number };

// 弹簧动画实例
export interface SpringAnimation {
  id: string;
  state: AnimationState;
  config: SpringAnimationConfig;
  startValue: AnimationValue;
  targetValue: AnimationValue;
  currentValue: AnimationValue;
  velocity: AnimationValue;
  
  // 时间控制
  startTime: number;
  elapsedTime: number;
  pausedTime: number;
  
  // 物理状态
  displacement: number;
  energy: number;
  
  // 性能监控
  frameCount: number;
  averageFrameTime: number;
}

// 动画队列项
export interface AnimationQueueItem {
  animation: SpringAnimation;
  priority: number;
  delay: number;
  dependencies: string[];       // 依赖的动画ID
}

/**
 * 高级缓动函数库
 * 包含各种经典和现代缓动函数
 */
export class AdvancedEasingFunctions {
  // === 基础缓动函数 ===
  static linear: EasingFunction = (t) => t;
  
  // Quadratic
  static easeInQuad: EasingFunction = (t) => t * t;
  static easeOutQuad: EasingFunction = (t) => t * (2 - t);
  static easeInOutQuad: EasingFunction = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  
  // Cubic
  static easeInCubic: EasingFunction = (t) => t * t * t;
  static easeOutCubic: EasingFunction = (t) => (--t) * t * t + 1;
  static easeInOutCubic: EasingFunction = (t) => 
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  
  // Quartic
  static easeInQuart: EasingFunction = (t) => t * t * t * t;
  static easeOutQuart: EasingFunction = (t) => 1 - (--t) * t * t * t;
  static easeInOutQuart: EasingFunction = (t) => 
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
  
  // Quintic
  static easeInQuint: EasingFunction = (t) => t * t * t * t * t;
  static easeOutQuint: EasingFunction = (t) => 1 + (--t) * t * t * t * t;
  static easeInOutQuint: EasingFunction = (t) => 
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
  
  // Sine
  static easeInSine: EasingFunction = (t) => 1 - Math.cos(t * Math.PI / 2);
  static easeOutSine: EasingFunction = (t) => Math.sin(t * Math.PI / 2);
  static easeInOutSine: EasingFunction = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  
  // Exponential
  static easeInExpo: EasingFunction = (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
  static easeOutExpo: EasingFunction = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  static easeInOutExpo: EasingFunction = (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 10 * (2 * t - 1)) / 2;
    return (2 - Math.pow(2, -10 * (2 * t - 1))) / 2;
  };
  
  // Circular
  static easeInCirc: EasingFunction = (t) => 1 - Math.sqrt(1 - t * t);
  static easeOutCirc: EasingFunction = (t) => Math.sqrt(1 - (--t) * t);
  static easeInOutCirc: EasingFunction = (t) => 
    t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
  
  // === 弹性缓动函数 ===
  static easeInElastic: EasingFunction = (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  };
  
  static easeOutElastic: EasingFunction = (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  };
  
  static easeInOutElastic: EasingFunction = (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) {
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    }
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  };
  
  // === 回弹缓动函数 ===
  static easeOutBounce: EasingFunction = (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };
  
  static easeInBounce: EasingFunction = (t) => 1 - AdvancedEasingFunctions.easeOutBounce(1 - t);
  
  static easeInOutBounce: EasingFunction = (t) => 
    t < 0.5 
      ? (1 - AdvancedEasingFunctions.easeOutBounce(1 - 2 * t)) / 2
      : (1 + AdvancedEasingFunctions.easeOutBounce(2 * t - 1)) / 2;
  
  // === 超越缓动函数 ===
  static easeInBack: EasingFunction = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  };
  
  static easeOutBack: EasingFunction = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  
  static easeInOutBack: EasingFunction = (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  };
  
  // === 自定义物理缓动函数 ===
  static createSpringEasing(stiffness: number, damping: number): EasingFunction {
    return (t: number) => {
      const w = Math.sqrt(stiffness);
      const d = damping / (2 * Math.sqrt(stiffness));
      
      if (d < 1) {
        // 欠阻尼
        const wd = w * Math.sqrt(1 - d * d);
        return 1 - Math.exp(-d * w * t) * Math.cos(wd * t);
      } else if (d === 1) {
        // 临界阻尼
        return 1 - Math.exp(-w * t) * (1 + w * t);
      } else {
        // 过阻尼
        const r1 = -w * (d + Math.sqrt(d * d - 1));
        const r2 = -w * (d - Math.sqrt(d * d - 1));
        return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
      }
    };
  }
  
  static createElasticEasing(amplitude: number, period: number): EasingFunction {
    return (t: number) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return amplitude * Math.pow(2, -10 * t) * Math.sin((t - period / 4) * (2 * Math.PI) / period) + 1;
    };
  }
  
  // === 高级组合缓动函数 ===
  static createChainedEasing(...easingFuncs: EasingFunction[]): EasingFunction {
    return (t: number) => {
      const segmentCount = easingFuncs.length;
      const segmentTime = 1 / segmentCount;
      const segmentIndex = Math.min(Math.floor(t / segmentTime), segmentCount - 1);
      const segmentT = (t - segmentIndex * segmentTime) / segmentTime;
      
      return easingFuncs[segmentIndex](segmentT);
    };
  }
  
  static createBlendedEasing(easing1: EasingFunction, easing2: EasingFunction, blendFactor: number): EasingFunction {
    return (t: number) => {
      const value1 = easing1(t);
      const value2 = easing2(t);
      return MathUtils.lerp(value1, value2, blendFactor);
    };
  }
}

/**
 * 基于物理的弹簧动画系统
 */
export class PhysicsSpringAnimation {
  private config: SpringAnimationConfig;
  private startValue: number;
  private targetValue: number;
  private currentValue: number;
  private velocity: number;
  
  // 物理参数
  private mass: number;
  private stiffness: number;
  private damping: number;
  
  // 状态
  private isRunning = false;
  private startTime = 0;
  private lastTime = 0;
  
  constructor(config: SpringAnimationConfig) {
    this.config = {
      stiffness: 100,
      damping: 10,
      mass: 1,
      velocity: 0,
      precision: 0.01,
      restDisplacement: 0.01,
      restVelocity: 0.01,
      useRAF: true,
      gpuAccelerated: false,
      adaptiveQuality: true,
      ...config
    };
    
    this.mass = this.config.mass;
    this.stiffness = this.config.stiffness;
    this.damping = this.config.damping;
    this.velocity = this.config.velocity || 0;
    
    this.currentValue = 0;
    this.startValue = 0;
    this.targetValue = 0;
  }
  
  /**
   * 开始动画
   */
  start(from: number, to: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.startValue = from;
      this.targetValue = to;
      this.currentValue = from;
      this.isRunning = true;
      this.startTime = performance.now();
      this.lastTime = this.startTime;
      
      const animate = (currentTime: number) => {
        if (!this.isRunning) {
          reject(new Error('Animation cancelled'));
          return;
        }
        
        const deltaTime = Math.min(currentTime - this.lastTime, 16.67); // 最大16.67ms (60fps)
        this.lastTime = currentTime;
        
        // 物理计算
        this.stepPhysics(deltaTime / 1000); // 转换为秒
        
        // 检查是否到达静止状态
        const displacement = Math.abs(this.currentValue - this.targetValue);
        const velocityMagnitude = Math.abs(this.velocity);
        
        const isAtRest = displacement <= this.config.restDisplacement && 
                        velocityMagnitude <= this.config.restVelocity;
        
        // 计算进度
        const progress = 1 - (displacement / Math.abs(this.targetValue - this.startValue));
        
        // 调用更新回调
        if (this.config.onUpdate) {
          this.config.onUpdate(this.currentValue, Math.min(progress, 1));
        }
        
        if (isAtRest || (this.config.duration && currentTime - this.startTime >= this.config.duration)) {
          // 动画完成
          this.isRunning = false;
          this.currentValue = this.targetValue;
          if (this.config.onComplete) {
            this.config.onComplete(this.currentValue);
          }
          resolve(this.currentValue);
        } else {
          // 继续动画
          if (this.config.useRAF) {
            requestAnimationFrame(animate);
          } else {
            setTimeout(() => animate(performance.now()), 16);
          }
        }
      };
      
      animate(performance.now());
    });
  }
  
  /**
   * 物理步进计算
   */
  private stepPhysics(deltaTime: number): void {
    // 弹簧力: F = -kx
    const springForce = -this.stiffness * (this.currentValue - this.targetValue);
    
    // 阻尼力: F = -cv
    const dampingForce = -this.damping * this.velocity;
    
    // 总力
    const totalForce = springForce + dampingForce;
    
    // 加速度: a = F/m
    const acceleration = totalForce / this.mass;
    
    // 数值积分 (Verlet积分)
    const newVelocity = this.velocity + acceleration * deltaTime;
    const newPosition = this.currentValue + (this.velocity + newVelocity) * 0.5 * deltaTime;
    
    this.velocity = newVelocity;
    this.currentValue = newPosition;
  }
  
  /**
   * 停止动画
   */
  stop(): void {
    this.isRunning = false;
    if (this.config.onCancel) {
      this.config.onCancel();
    }
  }
  
  /**
   * 获取当前状态
   */
  getState(): {
    value: number;
    velocity: number;
    isRunning: boolean;
    energy: number;
  } {
    const displacement = this.currentValue - this.targetValue;
    const kineticEnergy = 0.5 * this.mass * this.velocity * this.velocity;
    const potentialEnergy = 0.5 * this.stiffness * displacement * displacement;
    
    return {
      value: this.currentValue,
      velocity: this.velocity,
      isRunning: this.isRunning,
      energy: kineticEnergy + potentialEnergy
    };
  }
}

/**
 * 多维向量弹簧动画
 */
export class VectorSpringAnimation {
  private animations: Map<string, PhysicsSpringAnimation> = new Map();
  private onUpdate?: (value: any) => void;
  private onComplete?: (value: any) => void;
  
  constructor(config: SpringAnimationConfig) {
    this.onUpdate = config.onUpdate;
    this.onComplete = config.onComplete;
  }
  
  /**
   * Vector2D 动画
   */
  animateVector2D(from: Vector2D, to: Vector2D, config: SpringAnimationConfig): Promise<Vector2D> {
    const xConfig = { ...config, onUpdate: undefined, onComplete: undefined };
    const yConfig = { ...config, onUpdate: undefined, onComplete: undefined };
    
    const xAnimation = new PhysicsSpringAnimation(xConfig);
    const yAnimation = new PhysicsSpringAnimation(yConfig);
    
    this.animations.set('x', xAnimation);
    this.animations.set('y', yAnimation);
    
    let currentVector = from.clone();
    
    // 组合更新回调
    const combinedUpdate = () => {
      const xState = xAnimation.getState();
      const yState = yAnimation.getState();
      
      currentVector = new Vector2D(xState.value, yState.value);
      
      if (this.onUpdate) {
        this.onUpdate(currentVector);
      }
    };
    
    // 设置组合回调
    xConfig.onUpdate = combinedUpdate;
    yConfig.onUpdate = combinedUpdate;
    
    return Promise.all([
      xAnimation.start(from.x, to.x),
      yAnimation.start(from.y, to.y)
    ]).then(([x, y]) => {
      const finalVector = new Vector2D(x, y);
      if (this.onComplete) {
        this.onComplete(finalVector);
      }
      return finalVector;
    });
  }
  
  /**
   * 对象属性动画
   */
  animateObject(from: Record<string, number>, to: Record<string, number>, config: SpringAnimationConfig): Promise<Record<string, number>> {
    const animations: Promise<number>[] = [];
    const keys = Object.keys(to);
    let currentObject = { ...from };
    
    const combinedUpdate = () => {
      if (this.onUpdate) {
        this.onUpdate(currentObject);
      }
    };
    
    for (const key of keys) {
      const keyConfig = { ...config, onUpdate: undefined, onComplete: undefined };
      keyConfig.onUpdate = (value: number) => {
        currentObject[key] = value;
        combinedUpdate();
      };
      
      const animation = new PhysicsSpringAnimation(keyConfig);
      this.animations.set(key, animation);
      animations.push(animation.start(from[key] || 0, to[key]));
    }
    
    return Promise.all(animations).then((values) => {
      const result = keys.reduce((acc, key, index) => {
        acc[key] = values[index];
        return acc;
      }, {} as Record<string, number>);
      
      if (this.onComplete) {
        this.onComplete(result);
      }
      
      return result;
    });
  }
  
  /**
   * 停止所有动画
   */
  stop(): void {
    for (const animation of this.animations.values()) {
      animation.stop();
    }
    this.animations.clear();
  }
}

/**
 * 动画队列管理器
 */
export class SpringAnimationQueue {
  private queue: Map<string, AnimationQueueItem> = new Map();
  private running: Map<string, SpringAnimation> = new Map();
  private completed: Set<string> = new Set();
  
  /**
   * 添加动画到队列
   */
  add(
    id: string,
    from: AnimationValue,
    to: AnimationValue,
    config: SpringAnimationConfig,
    options: {
      priority?: number;
      delay?: number;
      dependencies?: string[];
    } = {}
  ): void {
    const animation: SpringAnimation = {
      id,
      state: 'pending',
      config,
      startValue: from,
      targetValue: to,
      currentValue: from,
      velocity: this.initializeVelocity(from),
      startTime: 0,
      elapsedTime: 0,
      pausedTime: 0,
      displacement: 0,
      energy: 0,
      frameCount: 0,
      averageFrameTime: 0
    };
    
    const queueItem: AnimationQueueItem = {
      animation,
      priority: options.priority || 0,
      delay: options.delay || 0,
      dependencies: options.dependencies || []
    };
    
    this.queue.set(id, queueItem);
    console.log(`SpringAnimationQueue: Added animation ${id} to queue`);
  }
  
  /**
   * 开始处理队列
   */
  start(): void {
    this.processQueue();
  }
  
  /**
   * 处理队列
   */
  private processQueue(): void {
    const readyAnimations = Array.from(this.queue.values())
      .filter(item => this.canStart(item))
      .sort((a, b) => b.priority - a.priority);
    
    for (const item of readyAnimations) {
      this.startAnimation(item);
      this.queue.delete(item.animation.id);
    }
    
    // 如果还有待处理的动画，继续处理
    if (this.queue.size > 0 || this.running.size > 0) {
      requestAnimationFrame(() => this.processQueue());
    }
  }
  
  /**
   * 检查动画是否可以开始
   */
  private canStart(item: AnimationQueueItem): boolean {
    // 检查依赖
    for (const depId of item.dependencies) {
      if (!this.completed.has(depId)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 启动单个动画
   */
  private startAnimation(item: AnimationQueueItem): void {
    const animation = item.animation;
    animation.state = 'running';
    animation.startTime = performance.now() + item.delay;
    
    this.running.set(animation.id, animation);
    
    // 根据数据类型选择适当的动画器
    if (typeof animation.startValue === 'number') {
      this.animateNumber(animation);
    } else if (animation.startValue instanceof Vector2D) {
      this.animateVector2D(animation);
    } else {
      this.animateObject(animation);
    }
  }
  
  /**
   * 数值动画
   */
  private animateNumber(animation: SpringAnimation): void {
    const springAnim = new PhysicsSpringAnimation({
      ...animation.config,
      onUpdate: (value, progress) => {
        animation.currentValue = value;
        if (animation.config.onUpdate) {
          animation.config.onUpdate(value, progress);
        }
      },
      onComplete: (finalValue) => {
        animation.currentValue = finalValue;
        animation.state = 'completed';
        this.completed.add(animation.id);
        this.running.delete(animation.id);
        
        if (animation.config.onComplete) {
          animation.config.onComplete(finalValue);
        }
      }
    });
    
    springAnim.start(
      animation.startValue as number,
      animation.targetValue as number
    );
  }
  
  /**
   * Vector2D动画
   */
  private animateVector2D(animation: SpringAnimation): void {
    const vectorAnim = new VectorSpringAnimation({
      ...animation.config,
      onUpdate: (value) => {
        animation.currentValue = value;
        if (animation.config.onUpdate) {
          const from = animation.startValue as Vector2D;
          const to = animation.targetValue as Vector2D;
          const progress = (value as Vector2D).distanceTo(from) / to.distanceTo(from);
          animation.config.onUpdate(value, progress);
        }
      },
      onComplete: (finalValue) => {
        animation.currentValue = finalValue;
        animation.state = 'completed';
        this.completed.add(animation.id);
        this.running.delete(animation.id);
        
        if (animation.config.onComplete) {
          animation.config.onComplete(finalValue);
        }
      }
    });
    
    vectorAnim.animateVector2D(
      animation.startValue as Vector2D,
      animation.targetValue as Vector2D,
      animation.config
    );
  }
  
  /**
   * 对象动画
   */
  private animateObject(animation: SpringAnimation): void {
    const objectAnim = new VectorSpringAnimation({
      ...animation.config,
      onUpdate: (value) => {
        animation.currentValue = value;
        if (animation.config.onUpdate) {
          animation.config.onUpdate(value, 1); // 简化的进度计算
        }
      },
      onComplete: (finalValue) => {
        animation.currentValue = finalValue;
        animation.state = 'completed';
        this.completed.add(animation.id);
        this.running.delete(animation.id);
        
        if (animation.config.onComplete) {
          animation.config.onComplete(finalValue);
        }
      }
    });
    
    objectAnim.animateObject(
      animation.startValue as Record<string, number>,
      animation.targetValue as Record<string, number>,
      animation.config
    );
  }
  
  /**
   * 初始化速度
   */
  private initializeVelocity(value: AnimationValue): AnimationValue {
    if (typeof value === 'number') {
      return 0;
    } else if (value instanceof Vector2D) {
      return Vector2D.zero();
    } else {
      const result: Record<string, number> = {};
      for (const key in value) {
        result[key] = 0;
      }
      return result;
    }
  }
  
  /**
   * 暂停动画
   */
  pause(id: string): void {
    const animation = this.running.get(id);
    if (animation && animation.state === 'running') {
      animation.state = 'paused';
      animation.pausedTime = performance.now();
    }
  }
  
  /**
   * 恢复动画
   */
  resume(id: string): void {
    const animation = this.running.get(id);
    if (animation && animation.state === 'paused') {
      animation.state = 'running';
      animation.startTime += performance.now() - animation.pausedTime;
    }
  }
  
  /**
   * 取消动画
   */
  cancel(id: string): void {
    const queueItem = this.queue.get(id);
    const runningItem = this.running.get(id);
    
    if (queueItem) {
      this.queue.delete(id);
    }
    
    if (runningItem) {
      runningItem.state = 'cancelled';
      this.running.delete(id);
      if (runningItem.config.onCancel) {
        runningItem.config.onCancel();
      }
    }
  }
  
  /**
   * 清除所有动画
   */
  clear(): void {
    this.queue.clear();
    this.running.clear();
    this.completed.clear();
  }
  
  /**
   * 获取队列状态
   */
  getStatus(): {
    pending: number;
    running: number;
    completed: number;
  } {
    return {
      pending: this.queue.size,
      running: this.running.size,
      completed: this.completed.size
    };
  }
}

/**
 * 工厂函数：创建弹性动画配置
 */
export function createElasticConfig(strength: 'light' | 'medium' | 'strong' = 'medium'): SpringAnimationConfig {
  const configs = {
    light: { stiffness: 50, damping: 8, mass: 1 },
    medium: { stiffness: 100, damping: 10, mass: 1 },
    strong: { stiffness: 200, damping: 15, mass: 1 }
  };
  
  return {
    ...configs[strength],
    precision: 0.01,
    restDisplacement: 0.01,
    restVelocity: 0.01,
    useRAF: true,
    gpuAccelerated: true,
    adaptiveQuality: true
  };
}

/**
 * 工厂函数：创建回弹动画配置
 */
export function createBounceConfig(intensity: 'subtle' | 'normal' | 'dramatic' = 'normal'): SpringAnimationConfig {
  const configs = {
    subtle: { stiffness: 120, damping: 8, mass: 0.8 },
    normal: { stiffness: 180, damping: 6, mass: 1 },
    dramatic: { stiffness: 250, damping: 4, mass: 1.2 }
  };
  
  return {
    ...configs[intensity],
    precision: 0.005,
    restDisplacement: 0.005,
    restVelocity: 0.005,
    useRAF: true,
    gpuAccelerated: true,
    adaptiveQuality: true
  };
}