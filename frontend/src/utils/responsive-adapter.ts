/**
 * 响应式适配器
 * 处理不同屏幕尺寸、方向、DPI的自适应布局和交互
 */

import { Vector2D } from './math-precision';
import { touchEventHandler } from './touch-event-handler';

// 设备类型
export enum DeviceType {
  PHONE = 'phone',
  TABLET = 'tablet',
  DESKTOP = 'desktop'
}

// 屏幕方向
export enum ScreenOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

// 断点配置
export interface Breakpoints {
  phone: number;      // < 768px
  tablet: number;     // 768px - 1024px
  desktop: number;    // > 1024px
}

// 视口信息
export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: ScreenOrientation;
  pixelRatio: number;
  safeArea: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  isFullscreen: boolean;
}

// 适配配置
export interface ResponsiveConfig {
  // 基础配置
  enableResponsive: boolean;
  enableOrientationAdaptation: boolean;
  enableDPIAdaptation: boolean;
  enableSafeAreaHandling: boolean;
  
  // 断点配置
  breakpoints: Breakpoints;
  
  // 布局适配
  scaleFactors: {
    phone: number;
    tablet: number;
    desktop: number;
  };
  
  // 交互适配
  touchTargetSizes: {
    phone: number;
    tablet: number;
    desktop: number;
  };
  
  // 性能适配
  maxNodesVisible: {
    phone: number;
    tablet: number;
    desktop: number;
  };
}

// 默认配置
const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  enableResponsive: true,
  enableOrientationAdaptation: true,
  enableDPIAdaptation: true,
  enableSafeAreaHandling: true,
  
  breakpoints: {
    phone: 768,
    tablet: 1024,
    desktop: 1200
  },
  
  scaleFactors: {
    phone: 0.8,
    tablet: 0.9,
    desktop: 1.0
  },
  
  touchTargetSizes: {
    phone: 48,
    tablet: 44,
    desktop: 32
  },
  
  maxNodesVisible: {
    phone: 50,
    tablet: 100,
    desktop: 200
  }
};

/**
 * 视口检测器
 */
class ViewportDetector {
  private currentViewport: ViewportInfo;
  private callbacks = new Set<(viewport: ViewportInfo) => void>();

  constructor() {
    this.currentViewport = this.detectViewport();
    this.setupListeners();
  }

  private detectViewport(): ViewportInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // 检测设备类型
    let deviceType: DeviceType;
    if (width < 768) {
      deviceType = DeviceType.PHONE;
    } else if (width < 1024) {
      deviceType = DeviceType.TABLET;
    } else {
      deviceType = DeviceType.DESKTOP;
    }

    // 检测屏幕方向
    const orientation = width > height 
      ? ScreenOrientation.LANDSCAPE 
      : ScreenOrientation.PORTRAIT;

    // 检测安全区域
    const safeArea = this.detectSafeArea();

    // 检测全屏状态
    const isFullscreen = this.detectFullscreen();

    return {
      width,
      height,
      deviceType,
      orientation,
      pixelRatio,
      safeArea,
      isFullscreen
    };
  }

  private detectSafeArea(): { top: number; right: number; bottom: number; left: number } {
    // 使用CSS环境变量检测安全区域
    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: this.parseCSSValue(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: this.parseCSSValue(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: this.parseCSSValue(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: this.parseCSSValue(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
  }

  private parseCSSValue(value: string): number {
    if (!value) return 0;
    const match = value.match(/(\d+(?:\.\d+)?)px/);
    return match ? parseFloat(match[1]) : 0;
  }

  private detectFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private setupListeners(): void {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 监听屏幕方向变化
    if (screen.orientation) {
      screen.orientation.addEventListener('change', this.handleOrientationChange.bind(this));
    } else if ('onorientationchange' in window) {
      window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }

    // 监听全屏变化
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
  }

  private handleResize(): void {
    const newViewport = this.detectViewport();
    const changed = this.hasViewportChanged(this.currentViewport, newViewport);
    
    if (changed) {
      this.currentViewport = newViewport;
      this.notifyCallbacks();
    }
  }

  private handleOrientationChange(): void {
    // 延迟检测，等待浏览器更新尺寸
    setTimeout(() => {
      const newViewport = this.detectViewport();
      this.currentViewport = newViewport;
      this.notifyCallbacks();
    }, 100);
  }

  private handleFullscreenChange(): void {
    const newViewport = this.detectViewport();
    this.currentViewport = newViewport;
    this.notifyCallbacks();
  }

  private hasViewportChanged(old: ViewportInfo, current: ViewportInfo): boolean {
    return (
      old.width !== current.width ||
      old.height !== current.height ||
      old.deviceType !== current.deviceType ||
      old.orientation !== current.orientation ||
      old.isFullscreen !== current.isFullscreen
    );
  }

  private notifyCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback(this.currentViewport);
      } catch (error) {
        console.error('ViewportDetector: Callback error:', error);
      }
    }
  }

  /**
   * 添加视口变化回调
   */
  addCallback(callback: (viewport: ViewportInfo) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * 移除视口变化回调
   */
  removeCallback(callback: (viewport: ViewportInfo) => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * 获取当前视口信息
   */
  getViewport(): ViewportInfo {
    return { ...this.currentViewport };
  }
}

/**
 * 响应式布局计算器
 */
class ResponsiveLayoutCalculator {
  private config: ResponsiveConfig;
  private viewport: ViewportInfo;

  constructor(config: ResponsiveConfig, viewport: ViewportInfo) {
    this.config = config;
    this.viewport = viewport;
  }

  /**
   * 计算缩放比例
   */
  calculateScaleFactor(): number {
    const baseScale = this.config.scaleFactors[this.viewport.deviceType];
    
    // DPI适配
    if (this.config.enableDPIAdaptation && this.viewport.pixelRatio > 1) {
      // 高DPI设备可以适当减小界面元素
      return baseScale / Math.min(this.viewport.pixelRatio, 2);
    }
    
    return baseScale;
  }

  /**
   * 计算触控目标大小
   */
  calculateTouchTargetSize(): number {
    const baseSize = this.config.touchTargetSizes[this.viewport.deviceType];
    const pixelRatio = this.viewport.pixelRatio;
    
    // 确保触控目标在物理尺寸上足够大
    return Math.max(baseSize, 44 * pixelRatio);
  }

  /**
   * 计算画布可视区域
   */
  calculateCanvasViewport(): { width: number; height: number; offset: Vector2D } {
    let { width, height } = this.viewport;
    const offset = new Vector2D(0, 0);

    // 处理安全区域
    if (this.config.enableSafeAreaHandling) {
      width -= this.viewport.safeArea.left + this.viewport.safeArea.right;
      height -= this.viewport.safeArea.top + this.viewport.safeArea.bottom;
      offset.set(this.viewport.safeArea.left, this.viewport.safeArea.top);
    }

    // 预留UI控件空间
    switch (this.viewport.deviceType) {
      case DeviceType.PHONE:
        if (this.viewport.orientation === ScreenOrientation.PORTRAIT) {
          height -= 120; // 底部工具栏
          offset.y += 60; // 顶部导航栏
        } else {
          width -= 100; // 侧边栏
          height -= 80;
        }
        break;
      
      case DeviceType.TABLET:
        height -= 100;
        offset.y += 50;
        break;
      
      case DeviceType.DESKTOP:
        // 桌面端通常有足够空间
        break;
    }

    return { width: Math.max(width, 320), height: Math.max(height, 200), offset };
  }

  /**
   * 计算网格大小
   */
  calculateGridSize(): Vector2D {
    const scaleFactor = this.calculateScaleFactor();
    const baseGridSize = 20;
    
    const gridSize = baseGridSize * scaleFactor;
    return new Vector2D(gridSize, gridSize);
  }

  /**
   * 计算最大可见节点数
   */
  calculateMaxVisibleNodes(): number {
    return this.config.maxNodesVisible[this.viewport.deviceType];
  }

  /**
   * 计算节点最小间距
   */
  calculateMinNodeSpacing(): number {
    const touchTargetSize = this.calculateTouchTargetSize();
    return touchTargetSize * 0.3; // 30%的间距
  }

  /**
   * 更新配置
   */
  updateConfig(config: ResponsiveConfig): void {
    this.config = config;
  }

  /**
   * 更新视口信息
   */
  updateViewport(viewport: ViewportInfo): void {
    this.viewport = viewport;
  }
}

/**
 * 响应式适配器主类
 */
export class ResponsiveAdapter {
  private config: ResponsiveConfig;
  private detector: ViewportDetector;
  private calculator: ResponsiveLayoutCalculator;
  private adaptationCallbacks = new Set<(viewport: ViewportInfo, layout: any) => void>();

  constructor(config: Partial<ResponsiveConfig> = {}) {
    this.config = { ...DEFAULT_RESPONSIVE_CONFIG, ...config };
    this.detector = new ViewportDetector();
    this.calculator = new ResponsiveLayoutCalculator(this.config, this.detector.getViewport());
    
    this.setupAdaptation();
  }

  private setupAdaptation(): void {
    if (!this.config.enableResponsive) return;

    // 监听视口变化
    this.detector.addCallback(this.handleViewportChange.bind(this));
    
    // 初始适配
    this.applyAdaptation();
    
    console.log('ResponsiveAdapter: Initialized for', this.detector.getViewport().deviceType);
  }

  private handleViewportChange(viewport: ViewportInfo): void {
    console.log('ResponsiveAdapter: Viewport changed to', viewport.deviceType, viewport.orientation);
    
    this.calculator.updateViewport(viewport);
    this.applyAdaptation();
  }

  private applyAdaptation(): void {
    const viewport = this.detector.getViewport();
    const layout = this.calculateLayout();
    
    // 应用CSS适配
    this.applyCSSAdaptations(viewport, layout);
    
    // 更新触控配置
    this.updateTouchConfiguration(viewport, layout);
    
    // 通知回调
    this.notifyCallbacks(viewport, layout);
  }

  private calculateLayout(): any {
    return {
      scaleFactor: this.calculator.calculateScaleFactor(),
      touchTargetSize: this.calculator.calculateTouchTargetSize(),
      canvasViewport: this.calculator.calculateCanvasViewport(),
      gridSize: this.calculator.calculateGridSize(),
      maxVisibleNodes: this.calculator.calculateMaxVisibleNodes(),
      minNodeSpacing: this.calculator.calculateMinNodeSpacing()
    };
  }

  private applyCSSAdaptations(viewport: ViewportInfo, layout: any): void {
    const root = document.documentElement;
    
    // 设置CSS变量
    root.style.setProperty('--device-type', viewport.deviceType);
    root.style.setProperty('--orientation', viewport.orientation);
    root.style.setProperty('--scale-factor', layout.scaleFactor.toString());
    root.style.setProperty('--touch-target-size', `${layout.touchTargetSize}px`);
    root.style.setProperty('--safe-area-top', `${viewport.safeArea.top}px`);
    root.style.setProperty('--safe-area-bottom', `${viewport.safeArea.bottom}px`);
    root.style.setProperty('--safe-area-left', `${viewport.safeArea.left}px`);
    root.style.setProperty('--safe-area-right', `${viewport.safeArea.right}px`);
    
    // 设置设备类型类名
    document.body.className = document.body.className
      .replace(/device-(phone|tablet|desktop)/g, '')
      .replace(/orientation-(portrait|landscape)/g, '') +
      ` device-${viewport.deviceType} orientation-${viewport.orientation}`;
  }

  private updateTouchConfiguration(viewport: ViewportInfo, layout: any): void {
    // 更新触控事件处理器配置
    touchEventHandler.updateConfig({
      touchPrecisionThreshold: viewport.deviceType === DeviceType.PHONE ? 3 : 2,
      touchThrottleMs: viewport.deviceType === DeviceType.PHONE ? 20 : 16,
      maxConcurrentTouches: viewport.deviceType === DeviceType.PHONE ? 2 : 10,
      gestureTimeout: viewport.deviceType === DeviceType.PHONE ? 400 : 300
    });
  }

  private notifyCallbacks(viewport: ViewportInfo, layout: any): void {
    for (const callback of this.adaptationCallbacks) {
      try {
        callback(viewport, layout);
      } catch (error) {
        console.error('ResponsiveAdapter: Callback error:', error);
      }
    }
  }

  /**
   * 添加适配回调
   */
  addAdaptationCallback(callback: (viewport: ViewportInfo, layout: any) => void): void {
    this.adaptationCallbacks.add(callback);
  }

  /**
   * 移除适配回调
   */
  removeAdaptationCallback(callback: (viewport: ViewportInfo, layout: any) => void): void {
    this.adaptationCallbacks.delete(callback);
  }

  /**
   * 获取当前视口信息
   */
  getViewportInfo(): ViewportInfo {
    return this.detector.getViewport();
  }

  /**
   * 获取当前布局计算结果
   */
  getLayoutInfo(): any {
    return this.calculateLayout();
  }

  /**
   * 检查是否为移动设备
   */
  isMobile(): boolean {
    const viewport = this.detector.getViewport();
    return viewport.deviceType === DeviceType.PHONE || viewport.deviceType === DeviceType.TABLET;
  }

  /**
   * 检查是否为竖屏
   */
  isPortrait(): boolean {
    return this.detector.getViewport().orientation === ScreenOrientation.PORTRAIT;
  }

  /**
   * 检查是否为横屏
   */
  isLandscape(): boolean {
    return this.detector.getViewport().orientation === ScreenOrientation.LANDSCAPE;
  }

  /**
   * 获取设备类型
   */
  getDeviceType(): DeviceType {
    return this.detector.getViewport().deviceType;
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<ResponsiveConfig>): void {
    this.config = { ...this.config, ...updates };
    this.calculator.updateConfig(this.config);
    this.applyAdaptation();
  }

  /**
   * 强制重新计算适配
   */
  recalculate(): void {
    this.applyAdaptation();
  }

  /**
   * 生成响应式报告
   */
  generateResponsiveReport(): string {
    const viewport = this.detector.getViewport();
    const layout = this.calculateLayout();

    let report = '响应式适配报告\n==================\n\n';
    
    report += '设备信息:\n';
    report += `  类型: ${viewport.deviceType.toUpperCase()}\n`;
    report += `  尺寸: ${viewport.width} × ${viewport.height}\n`;
    report += `  方向: ${viewport.orientation.toUpperCase()}\n`;
    report += `  像素比: ${viewport.pixelRatio}x\n`;
    report += `  全屏状态: ${viewport.isFullscreen ? '是' : '否'}\n\n`;
    
    report += '安全区域:\n';
    report += `  顶部: ${viewport.safeArea.top}px\n`;
    report += `  右侧: ${viewport.safeArea.right}px\n`;
    report += `  底部: ${viewport.safeArea.bottom}px\n`;
    report += `  左侧: ${viewport.safeArea.left}px\n\n`;
    
    report += '布局适配:\n';
    report += `  缩放比例: ${(layout.scaleFactor * 100).toFixed(1)}%\n`;
    report += `  触控目标: ${layout.touchTargetSize}px\n`;
    report += `  画布大小: ${layout.canvasViewport.width} × ${layout.canvasViewport.height}\n`;
    report += `  网格大小: ${layout.gridSize.x} × ${layout.gridSize.y}px\n`;
    report += `  最大节点数: ${layout.maxVisibleNodes}\n`;
    report += `  最小间距: ${layout.minNodeSpacing.toFixed(1)}px\n`;
    
    return report;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.adaptationCallbacks.clear();
    console.log('ResponsiveAdapter: Cleaned up');
  }
}

// 导出单例
export const responsiveAdapter = new ResponsiveAdapter();

// 便捷函数
export function initializeResponsiveAdaptation(config?: Partial<ResponsiveConfig>): ResponsiveAdapter {
  if (config) {
    return new ResponsiveAdapter(config);
  }
  return responsiveAdapter;
}

export function getCurrentDeviceType(): DeviceType {
  return responsiveAdapter.getDeviceType();
}

export function isMobileDevice(): boolean {
  return responsiveAdapter.isMobile();
}

export function isPortraitOrientation(): boolean {
  return responsiveAdapter.isPortrait();
}