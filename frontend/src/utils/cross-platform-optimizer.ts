/**
 * 跨平台兼容性优化器
 * 专门处理iOS Safari、Android Chrome等不同平台的兼容性问题
 */

// 平台类型
export enum PlatformType {
  IOS_SAFARI = 'ios-safari',
  ANDROID_CHROME = 'android-chrome',
  ANDROID_FIREFOX = 'android-firefox',
  ANDROID_SAMSUNG = 'android-samsung',
  DESKTOP_CHROME = 'desktop-chrome',
  DESKTOP_FIREFOX = 'desktop-firefox',
  DESKTOP_SAFARI = 'desktop-safari',
  DESKTOP_EDGE = 'desktop-edge',
  UNKNOWN = 'unknown'
}

// 平台特性
export interface PlatformFeatures {
  supportsTouch: boolean;
  supportsPointerEvents: boolean;
  supportsPressure: boolean;
  supportsHover: boolean;
  supportsPassiveEvents: boolean;
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
  hasViewportBug: boolean;
  hasScrollBug: boolean;
  hasTouchDelayBug: boolean;
  maxTouchPoints: number;
  scrollBehavior: 'smooth' | 'auto' | 'instant';
  pixelRatio: number;
}

// 平台特定配置
export interface PlatformConfig {
  // 触控配置
  touchDelay: number;             // 触控延迟补偿
  tapThreshold: number;           // 点击阈值
  touchStartThreshold: number;    // 触控开始阈值
  scrollPreventionMode: 'none' | 'partial' | 'full';
  
  // 性能配置
  enableGPUAcceleration: boolean;
  enableWillChange: boolean;
  enableTransform3D: boolean;
  maxAnimationFPS: number;
  
  // 事件配置
  usePassiveListeners: boolean;
  preventDefaultTouch: boolean;
  preventDefaultScroll: boolean;
  
  // 样式配置
  touchCalloutDisabled: boolean;
  userSelectDisabled: boolean;
  textSizeAdjustDisabled: boolean;
  
  // 特殊修复
  applyViewportFix: boolean;
  applyScrollFix: boolean;
  applyTouchDelayFix: boolean;
  applyKeyboardFix: boolean;
  applyOrientationFix: boolean;
}

// 默认平台配置
const DEFAULT_PLATFORM_CONFIGS: { [key in PlatformType]: PlatformConfig } = {
  [PlatformType.IOS_SAFARI]: {
    touchDelay: 300,
    tapThreshold: 10,
    touchStartThreshold: 5,
    scrollPreventionMode: 'partial',
    enableGPUAcceleration: true,
    enableWillChange: true,
    enableTransform3D: true,
    maxAnimationFPS: 60,
    usePassiveListeners: true,
    preventDefaultTouch: true,
    preventDefaultScroll: false,
    touchCalloutDisabled: true,
    userSelectDisabled: true,
    textSizeAdjustDisabled: true,
    applyViewportFix: true,
    applyScrollFix: true,
    applyTouchDelayFix: true,
    applyKeyboardFix: true,
    applyOrientationFix: true
  },
  
  [PlatformType.ANDROID_CHROME]: {
    touchDelay: 0,
    tapThreshold: 8,
    touchStartThreshold: 3,
    scrollPreventionMode: 'none',
    enableGPUAcceleration: true,
    enableWillChange: false, // Android Chrome 有时候会有问题
    enableTransform3D: true,
    maxAnimationFPS: 60,
    usePassiveListeners: true,
    preventDefaultTouch: false,
    preventDefaultScroll: false,
    touchCalloutDisabled: true,
    userSelectDisabled: true,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: false,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: true
  },
  
  [PlatformType.ANDROID_FIREFOX]: {
    touchDelay: 50,
    tapThreshold: 12,
    touchStartThreshold: 6,
    scrollPreventionMode: 'partial',
    enableGPUAcceleration: false, // Firefox Android GPU 加速有问题
    enableWillChange: false,
    enableTransform3D: false,
    maxAnimationFPS: 30,
    usePassiveListeners: false,
    preventDefaultTouch: true,
    preventDefaultScroll: true,
    touchCalloutDisabled: true,
    userSelectDisabled: true,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: true,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: true
  },
  
  [PlatformType.ANDROID_SAMSUNG]: {
    touchDelay: 100,
    tapThreshold: 15,
    touchStartThreshold: 8,
    scrollPreventionMode: 'full',
    enableGPUAcceleration: true,
    enableWillChange: true,
    enableTransform3D: true,
    maxAnimationFPS: 60,
    usePassiveListeners: true,
    preventDefaultTouch: true,
    preventDefaultScroll: true,
    touchCalloutDisabled: true,
    userSelectDisabled: true,
    textSizeAdjustDisabled: true,
    applyViewportFix: true,
    applyScrollFix: true,
    applyTouchDelayFix: true,
    applyKeyboardFix: true,
    applyOrientationFix: true
  },
  
  [PlatformType.DESKTOP_CHROME]: {
    touchDelay: 0,
    tapThreshold: 5,
    touchStartThreshold: 2,
    scrollPreventionMode: 'none',
    enableGPUAcceleration: true,
    enableWillChange: true,
    enableTransform3D: true,
    maxAnimationFPS: 120,
    usePassiveListeners: true,
    preventDefaultTouch: false,
    preventDefaultScroll: false,
    touchCalloutDisabled: false,
    userSelectDisabled: false,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: false,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: false
  },
  
  [PlatformType.DESKTOP_FIREFOX]: {
    touchDelay: 0,
    tapThreshold: 5,
    touchStartThreshold: 2,
    scrollPreventionMode: 'none',
    enableGPUAcceleration: true,
    enableWillChange: false, // Firefox will-change 支持有限
    enableTransform3D: true,
    maxAnimationFPS: 60,
    usePassiveListeners: false,
    preventDefaultTouch: false,
    preventDefaultScroll: false,
    touchCalloutDisabled: false,
    userSelectDisabled: false,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: false,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: false
  },
  
  [PlatformType.DESKTOP_SAFARI]: {
    touchDelay: 0,
    tapThreshold: 5,
    touchStartThreshold: 2,
    scrollPreventionMode: 'none',
    enableGPUAcceleration: true,
    enableWillChange: true,
    enableTransform3D: true,
    maxAnimationFPS: 60,
    usePassiveListeners: true,
    preventDefaultTouch: false,
    preventDefaultScroll: false,
    touchCalloutDisabled: false,
    userSelectDisabled: false,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: false,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: false
  },
  
  [PlatformType.DESKTOP_EDGE]: {
    touchDelay: 0,
    tapThreshold: 5,
    touchStartThreshold: 2,
    scrollPreventionMode: 'none',
    enableGPUAcceleration: true,
    enableWillChange: true,
    enableTransform3D: true,
    maxAnimationFPS: 120,
    usePassiveListeners: true,
    preventDefaultTouch: false,
    preventDefaultScroll: false,
    touchCalloutDisabled: false,
    userSelectDisabled: false,
    textSizeAdjustDisabled: false,
    applyViewportFix: false,
    applyScrollFix: false,
    applyTouchDelayFix: false,
    applyKeyboardFix: false,
    applyOrientationFix: false
  },
  
  [PlatformType.UNKNOWN]: {
    touchDelay: 100,
    tapThreshold: 10,
    touchStartThreshold: 5,
    scrollPreventionMode: 'partial',
    enableGPUAcceleration: false,
    enableWillChange: false,
    enableTransform3D: false,
    maxAnimationFPS: 30,
    usePassiveListeners: false,
    preventDefaultTouch: true,
    preventDefaultScroll: true,
    touchCalloutDisabled: true,
    userSelectDisabled: true,
    textSizeAdjustDisabled: true,
    applyViewportFix: true,
    applyScrollFix: true,
    applyTouchDelayFix: true,
    applyKeyboardFix: true,
    applyOrientationFix: true
  }
};

/**
 * 平台检测器
 */
export class PlatformDetector {
  private static instance: PlatformDetector;
  private platformType: PlatformType;
  private features: PlatformFeatures;

  private constructor() {
    this.platformType = this.detectPlatform();
    this.features = this.detectFeatures();
  }

  static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  private detectPlatform(): PlatformType {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform?.toLowerCase() || '';

    // iOS Safari
    if (/iphone|ipad|ipod/.test(userAgent) && /safari/.test(userAgent) && !/chrome|firefox/.test(userAgent)) {
      return PlatformType.IOS_SAFARI;
    }

    // Android 浏览器检测
    if (/android/.test(userAgent)) {
      if (/chrome/.test(userAgent) && !/edge|firefox|samsung/.test(userAgent)) {
        return PlatformType.ANDROID_CHROME;
      }
      if (/firefox/.test(userAgent)) {
        return PlatformType.ANDROID_FIREFOX;
      }
      if (/samsung/.test(userAgent)) {
        return PlatformType.ANDROID_SAMSUNG;
      }
    }

    // 桌面浏览器检测
    if (!/mobile|tablet|android|ios/.test(userAgent)) {
      if (/chrome/.test(userAgent) && !/edge|firefox/.test(userAgent)) {
        return PlatformType.DESKTOP_CHROME;
      }
      if (/firefox/.test(userAgent)) {
        return PlatformType.DESKTOP_FIREFOX;
      }
      if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
        return PlatformType.DESKTOP_SAFARI;
      }
      if (/edge/.test(userAgent)) {
        return PlatformType.DESKTOP_EDGE;
      }
    }

    return PlatformType.UNKNOWN;
  }

  private detectFeatures(): PlatformFeatures {
    return {
      supportsTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      supportsPointerEvents: 'PointerEvent' in window,
      supportsPressure: 'force' in Touch.prototype || 'webkitForce' in Touch.prototype,
      supportsHover: !this.isMobile(),
      supportsPassiveEvents: this.testPassiveSupport(),
      supportsWebGL: this.testWebGLSupport(),
      supportsServiceWorker: 'serviceWorker' in navigator,
      hasViewportBug: this.hasViewportBug(),
      hasScrollBug: this.hasScrollBug(),
      hasTouchDelayBug: this.hasTouchDelayBug(),
      maxTouchPoints: navigator.maxTouchPoints || 1,
      scrollBehavior: this.getScrollBehavior(),
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  private isMobile(): boolean {
    return /mobile|tablet|android|ios/i.test(navigator.userAgent);
  }

  private testPassiveSupport(): boolean {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
          return false;
        }
      });
      window.addEventListener('test', () => {}, opts);
      window.removeEventListener('test', () => {}, opts);
    } catch (e) {}
    return supportsPassive;
  }

  private testWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private hasViewportBug(): boolean {
    // iOS Safari 有 viewport 相关的 bug
    return this.platformType === PlatformType.IOS_SAFARI;
  }

  private hasScrollBug(): boolean {
    // iOS Safari 和 一些 Android 浏览器有滚动相关 bug
    return [PlatformType.IOS_SAFARI, PlatformType.ANDROID_FIREFOX, PlatformType.ANDROID_SAMSUNG]
      .includes(this.platformType);
  }

  private hasTouchDelayBug(): boolean {
    // iOS Safari 有300ms 触控延迟
    return [PlatformType.IOS_SAFARI, PlatformType.ANDROID_SAMSUNG]
      .includes(this.platformType);
  }

  private getScrollBehavior(): 'smooth' | 'auto' | 'instant' {
    if (this.platformType === PlatformType.ANDROID_FIREFOX) {
      return 'auto'; // Firefox Android smooth scrolling 有问题
    }
    return 'smooth';
  }

  getPlatformType(): PlatformType {
    return this.platformType;
  }

  getFeatures(): PlatformFeatures {
    return { ...this.features };
  }

  isMobilePlatform(): boolean {
    return [
      PlatformType.IOS_SAFARI,
      PlatformType.ANDROID_CHROME,
      PlatformType.ANDROID_FIREFOX,
      PlatformType.ANDROID_SAMSUNG
    ].includes(this.platformType);
  }

  isIOSPlatform(): boolean {
    return this.platformType === PlatformType.IOS_SAFARI;
  }

  isAndroidPlatform(): boolean {
    return [
      PlatformType.ANDROID_CHROME,
      PlatformType.ANDROID_FIREFOX,
      PlatformType.ANDROID_SAMSUNG
    ].includes(this.platformType);
  }
}

/**
 * iOS Safari 特定修复
 */
class IOSSafariOptimizer {
  static applyFixes(config: PlatformConfig): void {
    console.log('Applying iOS Safari specific fixes...');

    // 1. 修复 viewport meta 标签
    if (config.applyViewportFix) {
      this.fixViewport();
    }

    // 2. 修复触控延迟
    if (config.applyTouchDelayFix) {
      this.fixTouchDelay();
    }

    // 3. 修复滚动问题
    if (config.applyScrollFix) {
      this.fixScrolling();
    }

    // 4. 修复虚拟键盘问题
    if (config.applyKeyboardFix) {
      this.fixVirtualKeyboard();
    }

    // 5. 修复屏幕方向问题
    if (config.applyOrientationFix) {
      this.fixOrientationChange();
    }

    // 6. 应用 CSS 修复
    this.applyCSSFixes(config);
  }

  private static fixViewport(): void {
    let viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    // iOS Safari viewport 最佳设置
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  }

  private static fixTouchDelay(): void {
    // 通过设置 touch-action 和快速点击库来消除 300ms 延迟
    document.body.style.touchAction = 'manipulation';
    
    // 添加快速点击处理
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  }

  private static fixScrolling(): void {
    // iOS Safari 滚动修复
    document.body.style.webkitOverflowScrolling = 'touch';
    document.body.style.overscrollBehavior = 'none';
    
    // 防止橡皮筋效果
    document.addEventListener('touchmove', (e) => {
      if (e.scale !== 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  private static fixVirtualKeyboard(): void {
    // 监听虚拟键盘
    let initialViewportHeight = window.innerHeight;
    
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        // 虚拟键盘显示
        document.body.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${heightDifference}px`);
      } else {
        // 虚拟键盘隐藏
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      }
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        handleResize();
      }, 500);
    });
  }

  private static fixOrientationChange(): void {
    let orientationChangeTimeout: number;
    
    const handleOrientationChange = () => {
      clearTimeout(orientationChangeTimeout);
      orientationChangeTimeout = window.setTimeout(() => {
        // 强制重新计算视口
        const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (meta) {
          const content = meta.content;
          meta.content = content.replace('initial-scale=1.0', 'initial-scale=1.01');
          setTimeout(() => {
            meta.content = content;
          }, 100);
        }
        
        // 触发重新布局
        window.dispatchEvent(new Event('resize'));
      }, 500);
    };
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
    }
  }

  private static applyCSSFixes(config: PlatformConfig): void {
    const style = document.createElement('style');
    style.textContent = `
      /* iOS Safari 特定修复 */
      body {
        ${config.touchCalloutDisabled ? '-webkit-touch-callout: none;' : ''}
        ${config.userSelectDisabled ? '-webkit-user-select: none; user-select: none;' : ''}
        ${config.textSizeAdjustDisabled ? '-webkit-text-size-adjust: 100%;' : ''}
      }
      
      /* 修复 iOS Safari 的安全区域 */
      .safe-area-top { padding-top: env(safe-area-inset-top); }
      .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
      .safe-area-left { padding-left: env(safe-area-inset-left); }
      .safe-area-right { padding-right: env(safe-area-inset-right); }
      
      /* 修复虚拟键盘问题 */
      body.keyboard-open {
        height: calc(100vh - var(--keyboard-height, 0px));
      }
      
      /* 修复触控精度 */
      .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Android Chrome 特定修复
 */
class AndroidChromeOptimizer {
  static applyFixes(config: PlatformConfig): void {
    console.log('Applying Android Chrome specific fixes...');

    // 1. 修复屏幕方向问题
    if (config.applyOrientationFix) {
      this.fixOrientationChange();
    }

    // 2. 应用 CSS 修复
    this.applyCSSFixes(config);

    // 3. 优化性能
    this.optimizePerformance(config);
  }

  private static fixOrientationChange(): void {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        // Android Chrome 方向变化后的修复
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }, 200);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 初始设置
  }

  private static optimizePerformance(config: PlatformConfig): void {
    // Android Chrome 性能优化
    if (config.enableGPUAcceleration) {
      const style = document.createElement('style');
      style.textContent = `
        .gpu-accelerate {
          transform: translateZ(0);
          will-change: transform;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private static applyCSSFixes(config: PlatformConfig): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Android Chrome 特定修复 */
      body {
        ${config.touchCalloutDisabled ? '-webkit-touch-callout: none;' : ''}
        ${config.userSelectDisabled ? '-webkit-user-select: none; user-select: none;' : ''}
      }
      
      /* 修复视口高度问题 */
      .full-height {
        height: 100vh;
        height: calc(var(--vh, 1vh) * 100);
      }
      
      /* 优化滚动 */
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * 跨平台优化器主类
 */
export class CrossPlatformOptimizer {
  private detector: PlatformDetector;
  private platformType: PlatformType;
  private config: PlatformConfig;
  private features: PlatformFeatures;

  constructor() {
    this.detector = PlatformDetector.getInstance();
    this.platformType = this.detector.getPlatformType();
    this.features = this.detector.getFeatures();
    this.config = { ...DEFAULT_PLATFORM_CONFIGS[this.platformType] };
    
    this.initialize();
  }

  private initialize(): void {
    console.log(`CrossPlatformOptimizer: Detected platform: ${this.platformType}`);
    console.log('Platform features:', this.features);
    
    this.applyPlatformOptimizations();
  }

  private applyPlatformOptimizations(): void {
    switch (this.platformType) {
      case PlatformType.IOS_SAFARI:
        IOSSafariOptimizer.applyFixes(this.config);
        break;
        
      case PlatformType.ANDROID_CHROME:
      case PlatformType.ANDROID_SAMSUNG:
        AndroidChromeOptimizer.applyFixes(this.config);
        break;
        
      case PlatformType.ANDROID_FIREFOX:
        this.applyFirefoxAndroidFixes();
        break;
        
      default:
        this.applyGenericFixes();
        break;
    }
    
    // 应用通用优化
    this.applyGenericOptimizations();
  }

  private applyFirefoxAndroidFixes(): void {
    console.log('Applying Firefox Android specific fixes...');
    
    // Firefox Android 的特殊处理
    const style = document.createElement('style');
    style.textContent = `
      /* Firefox Android 修复 */
      * {
        /* 禁用硬件加速可能导致的问题 */
        transform: none !important;
        will-change: auto !important;
      }
      
      .firefox-android-safe * {
        transition: none !important;
        animation: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  private applyGenericFixes(): void {
    console.log('Applying generic cross-platform fixes...');
    
    const style = document.createElement('style');
    style.textContent = `
      /* 通用跨平台修复 */
      * {
        box-sizing: border-box;
      }
      
      body {
        ${this.config.touchCalloutDisabled ? '-webkit-touch-callout: none;' : ''}
        ${this.config.userSelectDisabled ? '-webkit-user-select: none; user-select: none;' : ''}
        ${this.config.textSizeAdjustDisabled ? '-webkit-text-size-adjust: 100%; text-size-adjust: 100%;' : ''}
      }
    `;
    document.head.appendChild(style);
  }

  private applyGenericOptimizations(): void {
    // 根据平台特性应用优化
    if (this.features.supportsPassiveEvents && this.config.usePassiveListeners) {
      this.enablePassiveListeners();
    }
    
    if (this.config.enableGPUAcceleration && this.features.supportsWebGL) {
      this.enableGPUAcceleration();
    }
    
    // 设置全局 CSS 变量
    this.setCSSVariables();
  }

  private enablePassiveListeners(): void {
    // 重写 addEventListener 以默认启用 passive
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];
      if (passiveEvents.includes(type) && typeof options === 'undefined') {
        options = { passive: true };
      } else if (passiveEvents.includes(type) && typeof options === 'boolean') {
        options = { passive: true, capture: options };
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  private enableGPUAcceleration(): void {
    const style = document.createElement('style');
    style.textContent = `
      .gpu-layer {
        transform: translateZ(0);
        ${this.config.enableWillChange ? 'will-change: transform;' : ''}
      }
    `;
    document.head.appendChild(style);
  }

  private setCSSVariables(): void {
    const root = document.documentElement;
    
    // 设置平台相关的 CSS 变量
    root.style.setProperty('--platform-type', this.platformType);
    root.style.setProperty('--touch-delay', `${this.config.touchDelay}ms`);
    root.style.setProperty('--tap-threshold', `${this.config.tapThreshold}px`);
    root.style.setProperty('--max-fps', this.config.maxAnimationFPS.toString());
    root.style.setProperty('--pixel-ratio', this.features.pixelRatio.toString());
    root.style.setProperty('--max-touch-points', this.features.maxTouchPoints.toString());
    
    // 添加平台类名
    document.body.classList.add(`platform-${this.platformType}`);
    
    if (this.features.supportsTouch) {
      document.body.classList.add('touch-device');
    }
    
    if (this.features.supportsPressure) {
      document.body.classList.add('pressure-sensitive');
    }
  }

  /**
   * 获取平台类型
   */
  getPlatformType(): PlatformType {
    return this.platformType;
  }

  /**
   * 获取平台特性
   */
  getPlatformFeatures(): PlatformFeatures {
    return this.features;
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig(): PlatformConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('CrossPlatformOptimizer: Config updated', updates);
  }

  /**
   * 检查是否为移动平台
   */
  isMobile(): boolean {
    return this.detector.isMobilePlatform();
  }

  /**
   * 检查是否为 iOS
   */
  isIOS(): boolean {
    return this.detector.isIOSPlatform();
  }

  /**
   * 检查是否为 Android
   */
  isAndroid(): boolean {
    return this.detector.isAndroidPlatform();
  }

  /**
   * 获取触控配置
   */
  getTouchConfig(): {
    delay: number;
    threshold: number;
    startThreshold: number;
    preventScroll: boolean;
  } {
    return {
      delay: this.config.touchDelay,
      threshold: this.config.tapThreshold,
      startThreshold: this.config.touchStartThreshold,
      preventScroll: this.config.scrollPreventionMode !== 'none'
    };
  }

  /**
   * 执行平台特定的测试
   */
  runPlatformTests(): { [key: string]: boolean } {
    const results: { [key: string]: boolean } = {};
    
    // 测试触控支持
    results.touchSupport = this.features.supportsTouch;
    results.pointerEvents = this.features.supportsPointerEvents;
    results.pressureSupport = this.features.supportsPressure;
    
    // 测试性能特性
    results.webglSupport = this.features.supportsWebGL;
    results.passiveEvents = this.features.supportsPassiveEvents;
    results.serviceWorker = this.features.supportsServiceWorker;
    
    // 测试已知问题
    results.hasViewportBug = this.features.hasViewportBug;
    results.hasScrollBug = this.features.hasScrollBug;
    results.hasTouchDelayBug = this.features.hasTouchDelayBug;
    
    return results;
  }

  /**
   * 生成兼容性报告
   */
  generateCompatibilityReport(): string {
    const testResults = this.runPlatformTests();
    
    let report = '跨平台兼容性报告\n==================\n\n';
    
    report += `平台信息:\n`;
    report += `  类型: ${this.platformType}\n`;
    report += `  用户代理: ${navigator.userAgent}\n`;
    report += `  平台: ${navigator.platform || 'unknown'}\n\n`;
    
    report += `特性支持:\n`;
    report += `  触控支持: ${this.features.supportsTouch ? '✓' : '✗'}\n`;
    report += `  指针事件: ${this.features.supportsPointerEvents ? '✓' : '✗'}\n`;
    report += `  压力感应: ${this.features.supportsPressure ? '✓' : '✗'}\n`;
    report += `  悬停支持: ${this.features.supportsHover ? '✓' : '✗'}\n`;
    report += `  被动事件: ${this.features.supportsPassiveEvents ? '✓' : '✗'}\n`;
    report += `  WebGL支持: ${this.features.supportsWebGL ? '✓' : '✗'}\n`;
    report += `  Service Worker: ${this.features.supportsServiceWorker ? '✓' : '✗'}\n\n`;
    
    report += `已知问题:\n`;
    report += `  视口bug: ${this.features.hasViewportBug ? '⚠️' : '✓'}\n`;
    report += `  滚动bug: ${this.features.hasScrollBug ? '⚠️' : '✓'}\n`;
    report += `  触控延迟bug: ${this.features.hasTouchDelayBug ? '⚠️' : '✓'}\n\n`;
    
    report += `配置信息:\n`;
    report += `  触控延迟: ${this.config.touchDelay}ms\n`;
    report += `  点击阈值: ${this.config.tapThreshold}px\n`;
    report += `  最大帧率: ${this.config.maxAnimationFPS}fps\n`;
    report += `  GPU加速: ${this.config.enableGPUAcceleration ? '启用' : '禁用'}\n`;
    report += `  被动监听: ${this.config.usePassiveListeners ? '启用' : '禁用'}\n`;
    
    return report;
  }
}

// 导出单例
export const crossPlatformOptimizer = new CrossPlatformOptimizer();

// 便捷函数
export function initializeCrossPlatformOptimization(): CrossPlatformOptimizer {
  return crossPlatformOptimizer;
}

export function getPlatformType(): PlatformType {
  return crossPlatformOptimizer.getPlatformType();
}

export function isMobilePlatform(): boolean {
  return crossPlatformOptimizer.isMobile();
}

export function isIOSPlatform(): boolean {
  return crossPlatformOptimizer.isIOS();
}

export function isAndroidPlatform(): boolean {
  return crossPlatformOptimizer.isAndroid();
}