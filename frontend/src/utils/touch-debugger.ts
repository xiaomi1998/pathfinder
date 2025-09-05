/**
 * 触控调试工具
 * 提供触控事件的可视化调试、性能分析、问题诊断功能
 */

import { touchEventHandler } from './touch-event-handler';
import { mobileOptimizer } from './mobile-performance-optimizer';
import { responsiveAdapter } from './responsive-adapter';

// 调试配置
export interface TouchDebuggerConfig {
  enabled: boolean;
  visualDebug: boolean;          // 可视化调试
  performanceDebug: boolean;     // 性能调试
  eventLogging: boolean;         // 事件日志
  gestureAnalysis: boolean;      // 手势分析
  precisionAnalysis: boolean;    // 精度分析
  
  // 可视化配置
  showTouchPoints: boolean;      // 显示触控点
  showTrails: boolean;           // 显示轨迹
  showGestures: boolean;         // 显示手势
  showPressure: boolean;         // 显示压力
  
  // 日志配置
  maxLogEntries: number;         // 最大日志条数
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// 触控事件日志
export interface TouchEventLog {
  timestamp: number;
  type: string;
  touchId: number;
  position: { x: number; y: number };
  pressure?: number;
  velocity?: { x: number; y: number };
  target?: string;
  duration?: number;
  precision?: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
}

// 手势分析结果
export interface GestureAnalysis {
  type: string;
  confidence: number;
  duration: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  distance: number;
  scale?: number;
  rotation?: number;
}

// 性能分析结果
export interface PerformanceAnalysis {
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  eventRate: number;
  droppedEvents: number;
  memoryUsage: number;
  cpuUsage: number;
}

// 精度分析结果
export interface PrecisionAnalysis {
  averageError: number;
  maxError: number;
  minError: number;
  accuracy: number;
  consistencyScore: number;
  errorDistribution: { [key: string]: number };
}

// 默认配置
const DEFAULT_DEBUG_CONFIG: TouchDebuggerConfig = {
  enabled: true,
  visualDebug: true,
  performanceDebug: true,
  eventLogging: true,
  gestureAnalysis: true,
  precisionAnalysis: true,
  showTouchPoints: true,
  showTrails: true,
  showGestures: true,
  showPressure: true,
  maxLogEntries: 1000,
  logLevel: 'debug'
};

/**
 * 可视化调试器
 */
class TouchVisualDebugger {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private touchPoints = new Map<number, any>();
  private trails = new Map<number, { x: number; y: number; timestamp: number }[]>();
  private gestures: any[] = [];
  private config: TouchDebuggerConfig;

  constructor(config: TouchDebuggerConfig) {
    this.config = config;
    this.createDebugCanvas();
  }

  private createDebugCanvas(): void {
    // 创建调试画布
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'touch-debug-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    this.canvas.style.background = 'transparent';
    
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    document.body.appendChild(this.canvas);
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  /**
   * 显示触控点
   */
  showTouchPoint(touchId: number, x: number, y: number, pressure = 0.5): void {
    if (!this.config.showTouchPoints) return;

    this.touchPoints.set(touchId, { x, y, pressure, timestamp: Date.now() });
    this.render();
  }

  /**
   * 添加轨迹点
   */
  addTrailPoint(touchId: number, x: number, y: number): void {
    if (!this.config.showTrails) return;

    if (!this.trails.has(touchId)) {
      this.trails.set(touchId, []);
    }

    const trail = this.trails.get(touchId)!;
    trail.push({ x, y, timestamp: Date.now() });

    // 限制轨迹长度
    if (trail.length > 50) {
      trail.shift();
    }

    this.render();
  }

  /**
   * 显示手势
   */
  showGesture(gesture: any): void {
    if (!this.config.showGestures) return;

    gesture.timestamp = Date.now();
    this.gestures.push(gesture);

    // 清理旧手势
    this.gestures = this.gestures.filter(g => Date.now() - g.timestamp < 2000);
    
    this.render();
  }

  /**
   * 移除触控点
   */
  removeTouchPoint(touchId: number): void {
    this.touchPoints.delete(touchId);
    
    // 清理轨迹（延迟清理以显示完整轨迹）
    setTimeout(() => {
      this.trails.delete(touchId);
      this.render();
    }, 1000);
    
    this.render();
  }

  /**
   * 渲染调试信息
   */
  private render(): void {
    if (!this.config.visualDebug) return;

    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制轨迹
    this.renderTrails();
    
    // 绘制触控点
    this.renderTouchPoints();
    
    // 绘制手势
    this.renderGestures();
  }

  private renderTrails(): void {
    if (!this.config.showTrails) return;

    for (const [touchId, trail] of this.trails) {
      if (trail.length < 2) continue;

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.getTouchColor(touchId);
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';

      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        const age = Date.now() - point.timestamp;
        const alpha = Math.max(0, 1 - age / 2000); // 2秒内淡出

        if (alpha <= 0) continue;

        if (i === 0) {
          this.ctx.moveTo(point.x, point.y);
        } else {
          this.ctx.lineTo(point.x, point.y);
        }
      }

      this.ctx.globalAlpha = 0.7;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
    }
  }

  private renderTouchPoints(): void {
    if (!this.config.showTouchPoints) return;

    for (const [touchId, point] of this.touchPoints) {
      const color = this.getTouchColor(touchId);
      const radius = 15 + (this.config.showPressure ? point.pressure * 20 : 10);

      // 绘制外圈
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // 绘制内圈
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius * 0.5, 0, 2 * Math.PI);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.3;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;

      // 绘制触控ID
      this.ctx.font = '12px monospace';
      this.ctx.fillStyle = color;
      this.ctx.textAlign = 'center';
      this.ctx.fillText(touchId.toString(), point.x, point.y + 4);

      // 绘制压力值
      if (this.config.showPressure && point.pressure !== undefined) {
        this.ctx.font = '10px monospace';
        this.ctx.fillText(point.pressure.toFixed(2), point.x, point.y + 25);
      }
    }
  }

  private renderGestures(): void {
    if (!this.config.showGestures) return;

    for (const gesture of this.gestures) {
      const age = Date.now() - gesture.timestamp;
      const alpha = Math.max(0, 1 - age / 2000);
      
      if (alpha <= 0) continue;

      this.ctx.globalAlpha = alpha;
      
      // 根据手势类型绘制不同的可视化
      switch (gesture.type) {
        case 'pan':
          this.renderPanGesture(gesture);
          break;
        case 'pinch':
          this.renderPinchGesture(gesture);
          break;
        case 'rotate':
          this.renderRotateGesture(gesture);
          break;
        case 'tap':
          this.renderTapGesture(gesture);
          break;
      }
      
      this.ctx.globalAlpha = 1;
    }
  }

  private renderPanGesture(gesture: any): void {
    this.ctx.beginPath();
    this.ctx.moveTo(gesture.start.x, gesture.start.y);
    this.ctx.lineTo(gesture.end.x, gesture.end.y);
    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // 箭头
    const angle = Math.atan2(gesture.end.y - gesture.start.y, gesture.end.x - gesture.start.x);
    const arrowLength = 15;
    
    this.ctx.beginPath();
    this.ctx.moveTo(gesture.end.x, gesture.end.y);
    this.ctx.lineTo(
      gesture.end.x - arrowLength * Math.cos(angle - Math.PI / 6),
      gesture.end.y - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      gesture.end.x - arrowLength * Math.cos(angle + Math.PI / 6),
      gesture.end.y - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = '#10b981';
    this.ctx.fill();
  }

  private renderPinchGesture(gesture: any): void {
    const centerX = (gesture.touch1.x + gesture.touch2.x) / 2;
    const centerY = (gesture.touch1.y + gesture.touch2.y) / 2;
    const distance = Math.sqrt(
      Math.pow(gesture.touch2.x - gesture.touch1.x, 2) +
      Math.pow(gesture.touch2.y - gesture.touch1.y, 2)
    );

    // 绘制连接线
    this.ctx.beginPath();
    this.ctx.moveTo(gesture.touch1.x, gesture.touch1.y);
    this.ctx.lineTo(gesture.touch2.x, gesture.touch2.y);
    this.ctx.strokeStyle = '#f59e0b';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // 绘制中心圆
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fill();

    // 显示缩放比例
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${gesture.scale.toFixed(2)}x`, centerX, centerY - 20);
  }

  private renderRotateGesture(gesture: any): void {
    const centerX = (gesture.touch1.x + gesture.touch2.x) / 2;
    const centerY = (gesture.touch1.y + gesture.touch2.y) / 2;
    const radius = 30;

    // 绘制旋转弧线
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, gesture.rotation);
    this.ctx.strokeStyle = '#8b5cf6';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // 显示角度
    this.ctx.font = '12px monospace';
    this.ctx.fillStyle = '#8b5cf6';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${(gesture.rotation * 180 / Math.PI).toFixed(0)}°`, centerX, centerY + 50);
  }

  private renderTapGesture(gesture: any): void {
    const pulseRadius = 20 + Math.sin((Date.now() - gesture.timestamp) / 100) * 10;
    
    this.ctx.beginPath();
    this.ctx.arc(gesture.center.x, gesture.center.y, pulseRadius, 0, 2 * Math.PI);
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  private getTouchColor(touchId: number): string {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[touchId % colors.length];
  }

  /**
   * 清理调试画布
   */
  cleanup(): void {
    this.touchPoints.clear();
    this.trails.clear();
    this.gestures = [];
    this.render();
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

/**
 * 触控调试器主类
 */
export class TouchDebugger {
  private config: TouchDebuggerConfig;
  private visualDebugger: TouchVisualDebugger | null = null;
  private eventLogs: TouchEventLog[] = [];
  private gestureAnalyses: GestureAnalysis[] = [];
  private performanceData: any = {
    latencies: [],
    eventCounts: {},
    startTime: Date.now()
  };
  private precisionData: number[] = [];

  constructor(config: Partial<TouchDebuggerConfig> = {}) {
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };
    this.initialize();
  }

  private initialize(): void {
    if (!this.config.enabled) return;

    // 初始化可视化调试器
    if (this.config.visualDebug) {
      this.visualDebugger = new TouchVisualDebugger(this.config);
    }

    // 监听触控事件
    this.setupEventListeners();

    console.log('TouchDebugger: Initialized with config:', this.config);
  }

  private setupEventListeners(): void {
    // 监听原生触控事件
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // 监听鼠标事件（用于桌面调试）
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    const startTime = performance.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // 记录事件日志
      this.logEvent('info', 'touchstart', touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      }, {
        pressure: (touch as any).force || 0.5,
        target: this.getTargetDescription(event.target as Element)
      });

      // 可视化调试
      if (this.visualDebugger) {
        this.visualDebugger.showTouchPoint(
          touch.identifier,
          touch.clientX,
          touch.clientY,
          (touch as any).force || 0.5
        );
      }
    }

    // 性能分析
    this.recordLatency(performance.now() - startTime);
  }

  private handleTouchMove(event: TouchEvent): void {
    const startTime = performance.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // 记录轨迹
      if (this.visualDebugger) {
        this.visualDebugger.addTrailPoint(touch.identifier, touch.clientX, touch.clientY);
      }

      // 计算精度（如果有之前的位置数据）
      const precision = this.calculatePrecision(touch);
      if (precision !== null) {
        this.precisionData.push(precision);
        if (this.precisionData.length > 100) {
          this.precisionData.shift();
        }
      }
    }

    this.recordLatency(performance.now() - startTime);
  }

  private handleTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // 记录事件日志
      this.logEvent('info', 'touchend', touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });

      // 移除可视化
      if (this.visualDebugger) {
        this.visualDebugger.removeTouchPoint(touch.identifier);
      }
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      this.logEvent('warn', 'touchcancel', touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });

      if (this.visualDebugger) {
        this.visualDebugger.removeTouchPoint(touch.identifier);
      }
    }
  }

  private handleMouseDown(event: MouseEvent): void {
    // 模拟触控事件进行调试
    this.logEvent('debug', 'mousedown', 0, {
      x: event.clientX,
      y: event.clientY
    });

    if (this.visualDebugger) {
      this.visualDebugger.showTouchPoint(0, event.clientX, event.clientY, 0.5);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (event.buttons > 0 && this.visualDebugger) {
      this.visualDebugger.addTrailPoint(0, event.clientX, event.clientY);
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.visualDebugger) {
      this.visualDebugger.removeTouchPoint(0);
    }
  }

  private calculatePrecision(touch: Touch): number | null {
    // 简化的精度计算 - 实际实现会更复杂
    // 这里返回一个模拟值
    return Math.random() * 5; // 0-5px 的随机误差
  }

  private getTargetDescription(element: Element): string {
    if (!element) return 'unknown';
    
    let description = element.tagName.toLowerCase();
    if (element.id) description += `#${element.id}`;
    if (element.className) {
      const classes = element.className.toString().split(' ').slice(0, 2).join('.');
      if (classes) description += `.${classes}`;
    }
    
    return description;
  }

  private logEvent(level: TouchEventLog['level'], type: string, touchId: number, position: { x: number; y: number }, extra: any = {}): void {
    if (!this.config.eventLogging) return;

    const log: TouchEventLog = {
      timestamp: Date.now(),
      type,
      touchId,
      position,
      level,
      message: `${type} at (${position.x}, ${position.y})`,
      ...extra
    };

    this.eventLogs.push(log);

    // 限制日志数量
    if (this.eventLogs.length > this.config.maxLogEntries) {
      this.eventLogs.shift();
    }

    // 控制台输出
    if (this.shouldLogToConsole(level)) {
      console[level](`[TouchDebugger] ${log.message}`, log);
    }
  }

  private shouldLogToConsole(level: TouchEventLog['level']): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];
    
    return messageLevel <= currentLevel;
  }

  private recordLatency(latency: number): void {
    if (!this.config.performanceDebug) return;

    this.performanceData.latencies.push(latency);
    if (this.performanceData.latencies.length > 100) {
      this.performanceData.latencies.shift();
    }
  }

  /**
   * 分析手势
   */
  analyzeGesture(gestureData: any): GestureAnalysis {
    const analysis: GestureAnalysis = {
      type: gestureData.type,
      confidence: gestureData.confidence || 0.5,
      duration: gestureData.duration || 0,
      startPosition: gestureData.startPosition || { x: 0, y: 0 },
      endPosition: gestureData.endPosition || { x: 0, y: 0 },
      velocity: gestureData.velocity || { x: 0, y: 0 },
      distance: gestureData.distance || 0,
      scale: gestureData.scale,
      rotation: gestureData.rotation
    };

    if (this.config.gestureAnalysis) {
      this.gestureAnalyses.push(analysis);
      if (this.gestureAnalyses.length > 50) {
        this.gestureAnalyses.shift();
      }
    }

    // 可视化手势
    if (this.visualDebugger) {
      this.visualDebugger.showGesture(gestureData);
    }

    return analysis;
  }

  /**
   * 获取性能分析
   */
  getPerformanceAnalysis(): PerformanceAnalysis {
    const latencies = this.performanceData.latencies;
    
    return {
      averageLatency: latencies.length > 0 ? 
        latencies.reduce((sum, l) => sum + l, 0) / latencies.length : 0,
      maxLatency: Math.max(...latencies, 0),
      minLatency: Math.min(...latencies, 0),
      eventRate: this.eventLogs.length / Math.max((Date.now() - this.performanceData.startTime) / 1000, 1),
      droppedEvents: 0, // 需要更复杂的逻辑来检测丢失的事件
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: 0 // 无法直接获取，需要估算
    };
  }

  /**
   * 获取精度分析
   */
  getPrecisionAnalysis(): PrecisionAnalysis {
    if (this.precisionData.length === 0) {
      return {
        averageError: 0,
        maxError: 0,
        minError: 0,
        accuracy: 0,
        consistencyScore: 0,
        errorDistribution: {}
      };
    }

    const average = this.precisionData.reduce((sum, error) => sum + error, 0) / this.precisionData.length;
    const max = Math.max(...this.precisionData);
    const min = Math.min(...this.precisionData);
    
    // 计算一致性分数（基于方差）
    const variance = this.precisionData.reduce((sum, error) => sum + Math.pow(error - average, 2), 0) / this.precisionData.length;
    const consistencyScore = Math.max(0, 1 - variance / 25); // 假设最大方差为25

    // 错误分布
    const errorDistribution: { [key: string]: number } = {};
    this.precisionData.forEach(error => {
      const bucket = Math.floor(error / 2) * 2; // 2px 为一组
      const key = `${bucket}-${bucket + 2}px`;
      errorDistribution[key] = (errorDistribution[key] || 0) + 1;
    });

    return {
      averageError: average,
      maxError: max,
      minError: min,
      accuracy: Math.max(0, 1 - average / 10), // 假设10px为完全不准确
      consistencyScore,
      errorDistribution
    };
  }

  private getMemoryUsage(): number {
    if (performance.memory) {
      return (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  /**
   * 获取事件日志
   */
  getEventLogs(level?: TouchEventLog['level']): TouchEventLog[] {
    if (level) {
      return this.eventLogs.filter(log => log.level === level);
    }
    return [...this.eventLogs];
  }

  /**
   * 获取手势分析结果
   */
  getGestureAnalyses(): GestureAnalysis[] {
    return [...this.gestureAnalyses];
  }

  /**
   * 生成调试报告
   */
  generateDebugReport(): string {
    const performance = this.getPerformanceAnalysis();
    const precision = this.getPrecisionAnalysis();
    
    let report = '触控调试报告\n==================\n\n';
    
    report += '性能分析:\n';
    report += `  平均延迟: ${performance.averageLatency.toFixed(2)}ms\n`;
    report += `  最大延迟: ${performance.maxLatency.toFixed(2)}ms\n`;
    report += `  最小延迟: ${performance.minLatency.toFixed(2)}ms\n`;
    report += `  事件频率: ${performance.eventRate.toFixed(1)}/秒\n`;
    report += `  内存使用: ${performance.memoryUsage.toFixed(1)}%\n\n`;
    
    report += '精度分析:\n';
    report += `  平均误差: ${precision.averageError.toFixed(2)}px\n`;
    report += `  最大误差: ${precision.maxError.toFixed(2)}px\n`;
    report += `  准确度: ${(precision.accuracy * 100).toFixed(1)}%\n`;
    report += `  一致性: ${(precision.consistencyScore * 100).toFixed(1)}%\n\n`;
    
    report += '事件统计:\n';
    const eventCounts = this.eventLogs.reduce((counts, log) => {
      counts[log.type] = (counts[log.type] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });
    
    Object.entries(eventCounts).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });
    
    report += '\n手势分析:\n';
    report += `  检测到的手势: ${this.gestureAnalyses.length}\n`;
    
    const gestureCounts = this.gestureAnalyses.reduce((counts, gesture) => {
      counts[gesture.type] = (counts[gesture.type] || 0) + 1;
      return counts;
    }, {} as { [key: string]: number });
    
    Object.entries(gestureCounts).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });
    
    return report;
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<TouchDebuggerConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (!this.config.enabled) {
      this.cleanup();
    } else if (this.config.visualDebug && !this.visualDebugger) {
      this.visualDebugger = new TouchVisualDebugger(this.config);
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.visualDebugger) {
      this.visualDebugger.cleanup();
      this.visualDebugger = null;
    }
    
    this.eventLogs = [];
    this.gestureAnalyses = [];
    this.precisionData = [];
    
    console.log('TouchDebugger: Cleaned up');
  }
}

// 导出单例
export const touchDebugger = new TouchDebugger();

// 便捷函数
export function enableTouchDebugging(config?: Partial<TouchDebuggerConfig>): TouchDebugger {
  if (config) {
    touchDebugger.updateConfig({ ...config, enabled: true });
  }
  return touchDebugger;
}

export function disableTouchDebugging(): void {
  touchDebugger.updateConfig({ enabled: false });
}

export function getTouchDebugReport(): string {
  return touchDebugger.generateDebugReport();
}