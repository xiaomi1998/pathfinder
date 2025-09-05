/**
 * 移动端性能优化器
 * 专门针对移动设备的CPU、内存、电池续航优化
 */

import { memoryManager } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { eventOptimizer } from './event-optimizer';

// 移动设备性能等级
export enum DevicePerformanceLevel {
  LOW = 'low',       // 低端设备 (< 2GB RAM, < 4 cores)
  MEDIUM = 'medium', // 中端设备 (2-4GB RAM, 4-6 cores)
  HIGH = 'high'      // 高端设备 (> 4GB RAM, > 6 cores)
}

// 移动端优化配置
export interface MobileOptimizationConfig {
  // 性能优化
  enableBatteryOptimization: boolean;
  enableMemoryOptimization: boolean;
  enableCPUThrottling: boolean;
  enableGPUAcceleration: boolean;
  
  // 渲染优化
  maxFrameRate: number;           // 最大帧率限制
  adaptiveFrameRate: boolean;     // 自适应帧率
  reducedAnimations: boolean;     // 减少动画
  lowQualityMode: boolean;        // 低质量模式
  
  // 触控优化
  touchThrottleMs: number;        // 触控事件节流
  gestureTimeout: number;         // 手势超时
  pressureThreshold: number;      // 压力阈值
  
  // 网络优化
  enableOfflineMode: boolean;     // 离线模式
  dataSavingMode: boolean;        // 数据节省模式
  imageQuality: number;           // 图片质量 (0-1)
}

// 设备资源信息
export interface DeviceResourceInfo {
  // 硬件信息
  memory: number;                 // 内存大小 (GB)
  cores: number;                  // CPU核心数
  gpu: string;                    // GPU信息
  
  // 当前状态
  batteryLevel: number;           // 电池电量 (0-1)
  isCharging: boolean;            // 是否充电中
  connectionType: string;         // 网络类型
  dataUsage: number;              // 数据使用量 (MB)
  
  // 性能指标
  memoryUsage: number;            // 内存使用率 (0-1)
  cpuUsage: number;               // CPU使用率 (0-1)
  temperature: number;            // 设备温度
  performanceLevel: DevicePerformanceLevel;
}

/**
 * 设备资源监控器
 */
export class DeviceResourceMonitor {
  private resourceInfo: DeviceResourceInfo;
  private monitoring = false;
  private monitoringInterval: number = 0;
  private callbacks = new Set<(info: DeviceResourceInfo) => void>();

  constructor() {
    this.resourceInfo = this.initializeResourceInfo();
  }

  private initializeResourceInfo(): DeviceResourceInfo {
    return {
      // 硬件信息检测
      memory: this.detectMemorySize(),
      cores: navigator.hardwareConcurrency || 4,
      gpu: this.detectGPU(),
      
      // 初始状态
      batteryLevel: 1,
      isCharging: true,
      connectionType: this.detectConnectionType(),
      dataUsage: 0,
      
      // 初始性能指标
      memoryUsage: 0,
      cpuUsage: 0,
      temperature: 25,
      performanceLevel: DevicePerformanceLevel.MEDIUM
    };
  }

  private detectMemorySize(): number {
    // 尝试获取设备内存信息
    if ('memory' in performance) {
      return (performance as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024);
    }
    
    // 基于其他指标估算
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad/.test(userAgent)) {
      // iOS设备内存估算
      if (userAgent.includes('iphone')) {
        const match = userAgent.match(/iphone os (\d+)/);
        const iosVersion = match ? parseInt(match[1]) : 12;
        return iosVersion >= 14 ? 4 : 3; // iPhone 12+ 通常有更多内存
      }
      return 3; // iPad 默认估算
    } else if (/android/.test(userAgent)) {
      // Android设备内存估算（基于屏幕分辨率）
      const screenPixels = window.screen.width * window.screen.height;
      if (screenPixels > 2000000) return 4; // 高分辨率设备
      if (screenPixels > 1000000) return 3; // 中等分辨率
      return 2; // 低分辨率设备
    }
    
    return 4; // 桌面设备默认
  }

  private detectGPU(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown GPU';
      }
    }
    
    return 'Software Rendering';
  }

  private detectConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * 开始监控设备资源
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.updateResourceInfo();

    this.monitoringInterval = window.setInterval(() => {
      this.updateResourceInfo();
    }, intervalMs);

    console.log('DeviceResourceMonitor: Started monitoring');
  }

  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (!this.monitoring) return;

    this.monitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = 0;
    }

    console.log('DeviceResourceMonitor: Stopped monitoring');
  }

  /**
   * 更新资源信息
   */
  private async updateResourceInfo(): Promise<void> {
    // 更新电池信息
    await this.updateBatteryInfo();
    
    // 更新内存使用情况
    this.updateMemoryUsage();
    
    // 更新网络信息
    this.updateNetworkInfo();
    
    // 更新性能等级
    this.updatePerformanceLevel();
    
    // 通知回调
    this.notifyCallbacks();
  }

  private async updateBatteryInfo(): Promise<void> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        this.resourceInfo.batteryLevel = battery.level;
        this.resourceInfo.isCharging = battery.charging;
      }
    } catch (error) {
      // Battery API可能不可用
    }
  }

  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.resourceInfo.memoryUsage = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
    }
  }

  private updateNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.resourceInfo.connectionType = connection.effectiveType || 'unknown';
    }
  }

  private updatePerformanceLevel(): void {
    const { memory, cores, memoryUsage, batteryLevel } = this.resourceInfo;
    
    // 基于硬件和当前状态评估性能等级
    let score = 0;
    
    // 内存评分
    if (memory >= 4) score += 3;
    else if (memory >= 2) score += 2;
    else score += 1;
    
    // CPU评分
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 1;
    
    // 当前状态评分
    if (memoryUsage < 0.7) score += 1;
    if (batteryLevel > 0.2) score += 1;
    
    // 确定性能等级
    if (score >= 7) {
      this.resourceInfo.performanceLevel = DevicePerformanceLevel.HIGH;
    } else if (score >= 5) {
      this.resourceInfo.performanceLevel = DevicePerformanceLevel.MEDIUM;
    } else {
      this.resourceInfo.performanceLevel = DevicePerformanceLevel.LOW;
    }
  }

  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.resourceInfo);
      } catch (error) {
        console.error('DeviceResourceMonitor: Callback error:', error);
      }
    }
  }

  /**
   * 添加监控回调
   */
  addCallback(callback: (info: DeviceResourceInfo) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * 移除监控回调
   */
  removeCallback(callback: (info: DeviceResourceInfo) => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * 获取当前资源信息
   */
  getResourceInfo(): DeviceResourceInfo {
    return { ...this.resourceInfo };
  }

  /**
   * 检查是否为低端设备
   */
  isLowEndDevice(): boolean {
    return this.resourceInfo.performanceLevel === DevicePerformanceLevel.LOW;
  }

  /**
   * 检查是否需要省电模式
   */
  shouldEnablePowerSaving(): boolean {
    return this.resourceInfo.batteryLevel < 0.2 && !this.resourceInfo.isCharging;
  }

  /**
   * 检查是否为慢速网络
   */
  isSlowNetwork(): boolean {
    const slowNetworks = ['slow-2g', '2g', 'slow-3g'];
    return slowNetworks.includes(this.resourceInfo.connectionType);
  }
}

/**
 * 移动端性能优化器
 */
export class MobilePerformanceOptimizer {
  private config: MobileOptimizationConfig;
  private monitor: DeviceResourceMonitor;
  private optimizationLevel = 0; // 0: 无优化, 1: 轻度优化, 2: 中度优化, 3: 重度优化
  private optimizationHistory: number[] = [];

  // 默认配置
  private static readonly DEFAULT_CONFIG: MobileOptimizationConfig = {
    enableBatteryOptimization: true,
    enableMemoryOptimization: true,
    enableCPUThrottling: true,
    enableGPUAcceleration: true,
    maxFrameRate: 60,
    adaptiveFrameRate: true,
    reducedAnimations: false,
    lowQualityMode: false,
    touchThrottleMs: 16,
    gestureTimeout: 300,
    pressureThreshold: 0.3,
    enableOfflineMode: false,
    dataSavingMode: false,
    imageQuality: 0.8
  };

  constructor(config: Partial<MobileOptimizationConfig> = {}) {
    this.config = { ...MobilePerformanceOptimizer.DEFAULT_CONFIG, ...config };
    this.monitor = new DeviceResourceMonitor();
    
    this.setupOptimization();
  }

  private setupOptimization(): void {
    // 监听资源变化
    this.monitor.addCallback(this.handleResourceChange.bind(this));
    
    // 开始监控
    this.monitor.startMonitoring(3000);
    
    // 初始优化
    this.applyInitialOptimizations();
    
    console.log('MobilePerformanceOptimizer: Initialized');
  }

  private applyInitialOptimizations(): void {
    const resourceInfo = this.monitor.getResourceInfo();
    
    // 基于设备性能等级应用初始优化
    switch (resourceInfo.performanceLevel) {
      case DevicePerformanceLevel.LOW:
        this.optimizationLevel = 3;
        this.applyLowEndOptimizations();
        break;
      
      case DevicePerformanceLevel.MEDIUM:
        this.optimizationLevel = 1;
        this.applyMediumEndOptimizations();
        break;
      
      case DevicePerformanceLevel.HIGH:
        this.optimizationLevel = 0;
        this.applyHighEndOptimizations();
        break;
    }
    
    console.log('MobilePerformanceOptimizer: Applied initial optimizations, level:', this.optimizationLevel);
  }

  private handleResourceChange(resourceInfo: DeviceResourceInfo): void {
    const previousLevel = this.optimizationLevel;
    
    // 动态调整优化等级
    if (this.shouldIncreaseOptimization(resourceInfo)) {
      this.optimizationLevel = Math.min(this.optimizationLevel + 1, 3);
    } else if (this.shouldDecreaseOptimization(resourceInfo)) {
      this.optimizationLevel = Math.max(this.optimizationLevel - 1, 0);
    }
    
    // 记录优化历史
    this.optimizationHistory.push(this.optimizationLevel);
    if (this.optimizationHistory.length > 10) {
      this.optimizationHistory.shift();
    }
    
    // 应用优化变更
    if (previousLevel !== this.optimizationLevel) {
      this.applyOptimizationLevel(this.optimizationLevel);
      console.log('MobilePerformanceOptimizer: Optimization level changed from', previousLevel, 'to', this.optimizationLevel);
    }
  }

  private shouldIncreaseOptimization(resourceInfo: DeviceResourceInfo): boolean {
    return (
      resourceInfo.memoryUsage > 0.8 ||
      resourceInfo.batteryLevel < 0.2 ||
      resourceInfo.performanceLevel === DevicePerformanceLevel.LOW ||
      this.monitor.isSlowNetwork()
    );
  }

  private shouldDecreaseOptimization(resourceInfo: DeviceResourceInfo): boolean {
    return (
      resourceInfo.memoryUsage < 0.5 &&
      resourceInfo.batteryLevel > 0.5 &&
      resourceInfo.performanceLevel === DevicePerformanceLevel.HIGH &&
      !this.monitor.isSlowNetwork()
    );
  }

  private applyOptimizationLevel(level: number): void {
    switch (level) {
      case 0:
        this.applyHighEndOptimizations();
        break;
      case 1:
        this.applyMediumEndOptimizations();
        break;
      case 2:
        this.applyModerateOptimizations();
        break;
      case 3:
        this.applyLowEndOptimizations();
        break;
    }
  }

  private applyHighEndOptimizations(): void {
    // 高端设备 - 最佳体验
    this.updateConfig({
      maxFrameRate: 60,
      adaptiveFrameRate: false,
      reducedAnimations: false,
      lowQualityMode: false,
      touchThrottleMs: 8,
      imageQuality: 0.95
    });
    
    // 启用GPU加速
    if (this.config.enableGPUAcceleration) {
      this.enableGPUAcceleration();
    }
  }

  private applyMediumEndOptimizations(): void {
    // 中端设备 - 平衡性能和体验
    this.updateConfig({
      maxFrameRate: 60,
      adaptiveFrameRate: true,
      reducedAnimations: false,
      lowQualityMode: false,
      touchThrottleMs: 16,
      imageQuality: 0.8
    });
  }

  private applyModerateOptimizations(): void {
    // 适度优化 - 开始牺牲体验换取性能
    this.updateConfig({
      maxFrameRate: 30,
      adaptiveFrameRate: true,
      reducedAnimations: true,
      lowQualityMode: false,
      touchThrottleMs: 20,
      imageQuality: 0.7
    });
    
    // 减少内存使用
    memoryManager.cleanup();
  }

  private applyLowEndOptimizations(): void {
    // 低端设备 - 最大化性能
    this.updateConfig({
      maxFrameRate: 30,
      adaptiveFrameRate: true,
      reducedAnimations: true,
      lowQualityMode: true,
      touchThrottleMs: 32,
      imageQuality: 0.6
    });
    
    // 启用所有优化
    this.enableCPUThrottling();
    this.enableMemoryOptimization();
    memoryManager.enableAggressiveCleanup();
  }

  private enableGPUAcceleration(): void {
    // 为关键元素启用GPU加速
    const elements = document.querySelectorAll('.funnel-node, .connection-line');
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.transform = 'translateZ(0)';
      htmlElement.style.willChange = 'transform';
    });
  }

  private enableCPUThrottling(): void {
    // 限制CPU密集型操作
    renderOptimizer.setMaxTasksPerFrame(3);
    eventOptimizer.updateConfig?.({
      maxProcessingTime: 8 // 限制在8ms内
    } as any);
  }

  private enableMemoryOptimization(): void {
    // 启用内存优化
    memoryManager.setPoolSize('vectors', 20); // 减少向量池大小
    memoryManager.setPoolSize('dragCache', 10); // 减少拖拽缓存
  }

  private updateConfig(updates: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // 应用帧率限制
    if (updates.maxFrameRate !== undefined) {
      renderOptimizer.setTargetFrameRate(updates.maxFrameRate);
    }
  }

  /**
   * 获取当前优化配置
   */
  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }

  /**
   * 获取设备资源信息
   */
  getResourceInfo(): DeviceResourceInfo {
    return this.monitor.getResourceInfo();
  }

  /**
   * 获取优化等级
   */
  getOptimizationLevel(): number {
    return this.optimizationLevel;
  }

  /**
   * 获取优化历史
   */
  getOptimizationHistory(): number[] {
    return [...this.optimizationHistory];
  }

  /**
   * 强制设置优化等级
   */
  setOptimizationLevel(level: number): void {
    if (level >= 0 && level <= 3) {
      this.optimizationLevel = level;
      this.applyOptimizationLevel(level);
      console.log('MobilePerformanceOptimizer: Manually set optimization level to', level);
    }
  }

  /**
   * 获取性能报告
   */
  generatePerformanceReport(): string {
    const resourceInfo = this.monitor.getResourceInfo();
    const avgOptimization = this.optimizationHistory.length > 0
      ? this.optimizationHistory.reduce((sum, level) => sum + level, 0) / this.optimizationHistory.length
      : this.optimizationLevel;

    let report = '移动端性能优化报告\n==================\n\n';
    
    report += '设备信息:\n';
    report += `  性能等级: ${resourceInfo.performanceLevel.toUpperCase()}\n`;
    report += `  内存: ${resourceInfo.memory.toFixed(1)}GB\n`;
    report += `  CPU核心: ${resourceInfo.cores}\n`;
    report += `  GPU: ${resourceInfo.gpu}\n\n`;
    
    report += '当前状态:\n';
    report += `  电池电量: ${(resourceInfo.batteryLevel * 100).toFixed(1)}%\n`;
    report += `  充电状态: ${resourceInfo.isCharging ? '是' : '否'}\n`;
    report += `  内存使用率: ${(resourceInfo.memoryUsage * 100).toFixed(1)}%\n`;
    report += `  网络类型: ${resourceInfo.connectionType}\n\n`;
    
    report += '优化状态:\n';
    report += `  当前优化等级: ${this.optimizationLevel}/3\n`;
    report += `  平均优化等级: ${avgOptimization.toFixed(1)}\n`;
    report += `  最大帧率: ${this.config.maxFrameRate}fps\n`;
    report += `  触控节流: ${this.config.touchThrottleMs}ms\n`;
    report += `  图片质量: ${(this.config.imageQuality * 100).toFixed(1)}%\n`;
    
    return report;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.monitor.stopMonitoring();
    console.log('MobilePerformanceOptimizer: Cleaned up');
  }
}

// 导出单例
export const mobileOptimizer = new MobilePerformanceOptimizer();

// 便捷函数
export function initializeMobileOptimization(config?: Partial<MobileOptimizationConfig>): MobilePerformanceOptimizer {
  if (config) {
    // 创建新的优化器实例
    return new MobilePerformanceOptimizer(config);
  }
  return mobileOptimizer;
}

export function isMobileDevice(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function isLowEndDevice(): boolean {
  const monitor = new DeviceResourceMonitor();
  return monitor.isLowEndDevice();
}