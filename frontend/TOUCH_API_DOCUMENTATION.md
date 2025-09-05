# 📱 触控适配 API 文档

## 快速开始

### 1. 初始化触控支持

```typescript
import { 
  initializeTouchSupport,
  initializeMobileOptimization,
  initializeResponsiveAdaptation,
  initializeCrossPlatformOptimization
} from '@/utils/touch-adaptation';

// 应用启动时初始化
export function initializeTouchAdaptation() {
  // 基础触控支持
  initializeTouchSupport({
    enableTouch: true,
    enableMultiTouch: true,
    enablePressure: true,
    touchPrecisionThreshold: 2.0
  });
  
  // 移动端性能优化
  initializeMobileOptimization({
    enableBatteryOptimization: true,
    adaptiveFrameRate: true
  });
  
  // 响应式适配
  initializeResponsiveAdaptation();
  
  // 跨平台兼容
  initializeCrossPlatformOptimization();
}
```

### 2. 在 Vue 组件中使用

```vue
<template>
  <div 
    class="draggable-element"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove" 
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
  >
    拖拽元素
  </div>
</template>

<script setup lang="ts">
import { touchEventHandler, TouchMouseMapper } from '@/utils/touch-event-handler';

// 触控事件处理
const handleTouchStart = (event: TouchEvent) => {
  // 触控事件会自动转换为兼容的鼠标事件
  const touch = event.touches[0];
  const mouseEvent = TouchMouseMapper.touchToMouseEvent(
    touchPointFromTouch(touch), 
    'mousedown'
  );
  handleMouseDown(mouseEvent);
};

// 统一的拖拽处理（兼容触控和鼠标）
const handleMouseDown = (event: MouseEvent) => {
  // 现有的拖拽逻辑无需修改
  startDrag(event);
};
</script>
```

## 核心 API

### TouchEventHandler

触控事件统一处理器

```typescript
import { touchEventHandler } from '@/utils/touch-event-handler';

// 设置拖拽处理器
touchEventHandler.setDragHandlers({
  onDragStart: (touchPoint, element) => {
    console.log('拖拽开始', touchPoint.position);
  },
  onDragMove: (touchPoint, element) => {
    console.log('拖拽移动', touchPoint.position);
  },
  onDragEnd: (touchPoint, element) => {
    console.log('拖拽结束');
  }
});

// 设置手势处理器
touchEventHandler.setGestureHandler((gesture) => {
  console.log('手势识别', gesture.type, gesture.confidence);
});

// 获取统计信息
const stats = touchEventHandler.getStats();
console.log('触控统计', stats);
```

### MobilePerformanceOptimizer

移动端性能优化器

```typescript
import { mobileOptimizer } from '@/utils/mobile-performance-optimizer';

// 获取设备信息
const resourceInfo = mobileOptimizer.getResourceInfo();
console.log('设备性能等级', resourceInfo.performanceLevel);
console.log('电池电量', resourceInfo.batteryLevel);

// 强制设置优化等级 (0-3, 3为最高优化)
mobileOptimizer.setOptimizationLevel(2);

// 获取性能报告
const report = mobileOptimizer.generatePerformanceReport();
console.log(report);
```

### ResponsiveAdapter

响应式适配器

```typescript
import { responsiveAdapter } from '@/utils/responsive-adapter';

// 获取设备类型
const deviceType = responsiveAdapter.getDeviceType();
console.log('设备类型', deviceType); // 'phone' | 'tablet' | 'desktop'

// 监听设备变化
responsiveAdapter.addAdaptationCallback((viewport, layout) => {
  console.log('视口变化', viewport.deviceType, viewport.orientation);
  console.log('布局信息', layout.scaleFactor, layout.touchTargetSize);
});

// 获取当前布局信息
const layoutInfo = responsiveAdapter.getLayoutInfo();
console.log('缩放比例', layoutInfo.scaleFactor);
console.log('触控目标大小', layoutInfo.touchTargetSize);
```

### CrossPlatformOptimizer

跨平台兼容优化器

```typescript
import { crossPlatformOptimizer, PlatformType } from '@/utils/cross-platform-optimizer';

// 获取平台类型
const platform = crossPlatformOptimizer.getPlatformType();
console.log('平台类型', platform); // 'ios-safari' | 'android-chrome' etc.

// 检查平台特性
const features = crossPlatformOptimizer.getPlatformFeatures();
console.log('支持触控', features.supportsTouch);
console.log('支持压力感应', features.supportsPressure);

// 获取触控配置
const touchConfig = crossPlatformOptimizer.getTouchConfig();
console.log('触控延迟', touchConfig.delay);
console.log('触控阈值', touchConfig.threshold);

// 运行兼容性测试
const testResults = crossPlatformOptimizer.runPlatformTests();
console.log('测试结果', testResults);
```

### TouchDebugger

触控调试工具

```typescript
import { touchDebugger, enableTouchDebugging } from '@/utils/touch-debugger';

// 启用调试模式
enableTouchDebugging({
  visualDebug: true,        // 可视化调试
  eventLogging: true,       // 事件日志
  performanceDebug: true,   // 性能调试
  showTouchPoints: true,    // 显示触控点
  showTrails: true,         // 显示轨迹
  showGestures: true        // 显示手势
});

// 获取性能分析
const performance = touchDebugger.getPerformanceAnalysis();
console.log('平均延迟', performance.averageLatency);

// 获取精度分析  
const precision = touchDebugger.getPrecisionAnalysis();
console.log('平均误差', precision.averageError);
console.log('准确度', precision.accuracy);

// 生成调试报告
const report = touchDebugger.generateDebugReport();
console.log(report);
```

## 工具函数

### 设备检测

```typescript
import { 
  isTouchDevice,
  isMobileDevice,
  getCurrentDeviceType,
  isPortraitOrientation
} from '@/utils/touch-adaptation';

if (isTouchDevice()) {
  console.log('触控设备');
}

if (isMobileDevice()) {
  console.log('移动设备');
}

const deviceType = getCurrentDeviceType();
console.log('当前设备', deviceType);

if (isPortraitOrientation()) {
  console.log('竖屏模式');
}
```

### 平台检测

```typescript
import { 
  getPlatformType,
  isMobilePlatform,
  isIOSPlatform,
  isAndroidPlatform
} from '@/utils/cross-platform-optimizer';

const platform = getPlatformType();
console.log('平台', platform);

if (isIOSPlatform()) {
  console.log('iOS 设备');
}

if (isAndroidPlatform()) {
  console.log('Android 设备');
}
```

## 配置选项

### TouchAdaptationConfig

```typescript
interface TouchAdaptationConfig {
  enableTouch: boolean;                // 启用触控支持
  enableMultiTouch: boolean;           // 多点触控
  enablePressure: boolean;             // 压力感应
  enableGestures: boolean;             // 手势识别
  touchPrecisionThreshold: number;     // 精度阈值 (px)
  tapTimeout: number;                  // 点击超时 (ms)
  longPressTimeout: number;            // 长按超时 (ms)
  doubleTapTimeout: number;            // 双击超时 (ms)
  touchThrottleMs: number;             // 触控节流 (ms)
  maxConcurrentTouches: number;        // 最大并发触点
  preventBounce: boolean;              // 防止回弹
  preventZoom: boolean;                // 防止缩放
  optimizeBattery: boolean;            // 电池优化
}
```

### MobileOptimizationConfig

```typescript
interface MobileOptimizationConfig {
  enableBatteryOptimization: boolean;  // 电池优化
  enableMemoryOptimization: boolean;   // 内存优化
  enableCPUThrottling: boolean;        // CPU 节流
  maxFrameRate: number;                // 最大帧率
  adaptiveFrameRate: boolean;          // 自适应帧率
  reducedAnimations: boolean;          // 减少动画
  lowQualityMode: boolean;             // 低质量模式
}
```

### ResponsiveConfig

```typescript
interface ResponsiveConfig {
  enableResponsive: boolean;           // 启用响应式
  enableOrientationAdaptation: boolean; // 方向适配
  enableDPIAdaptation: boolean;        // DPI 适配
  enableSafeAreaHandling: boolean;     // 安全区域处理
  breakpoints: {                       // 断点配置
    phone: number;
    tablet: number;
    desktop: number;
  };
  scaleFactors: {                      // 缩放比例
    phone: number;
    tablet: number;
    desktop: number;
  };
  touchTargetSizes: {                  // 触控目标大小
    phone: number;
    tablet: number;
    desktop: number;
  };
}
```

## 事件类型

### TouchPointInfo

```typescript
interface TouchPointInfo {
  id: number;                          // 触控点 ID
  position: Vector2D;                  // 位置
  pressure: number;                    // 压力 (0-1)
  radius: Vector2D;                    // 触控半径
  angle: number;                       // 角度
  timestamp: number;                   // 时间戳
  velocity: Vector2D;                  // 速度
  acceleration: Vector2D;              // 加速度
}
```

### GestureInfo

```typescript
interface GestureInfo {
  type: 'tap' | 'double-tap' | 'long-press' | 'pan' | 'pinch' | 'rotate';
  center: Vector2D;                    // 中心点
  scale: number;                       // 缩放比例
  rotation: number;                    // 旋转角度
  velocity: Vector2D;                  // 速度
  duration: number;                    // 持续时间
  confidence: number;                  // 置信度 (0-1)
}
```

## CSS 类和变量

### CSS 类

```css
/* 设备类型 */
.device-phone { /* 手机设备样式 */ }
.device-tablet { /* 平板设备样式 */ }
.device-desktop { /* 桌面设备样式 */ }

/* 方向 */
.orientation-portrait { /* 竖屏样式 */ }
.orientation-landscape { /* 横屏样式 */ }

/* 平台 */
.platform-ios-safari { /* iOS Safari 样式 */ }
.platform-android-chrome { /* Android Chrome 样式 */ }

/* 功能检测 */
.touch-device { /* 触控设备样式 */ }
.pressure-sensitive { /* 支持压力感应样式 */ }

/* 触控优化 */
.touch-enabled { /* 触控启用样式 */ }
.mobile-optimized { /* 移动端优化样式 */ }
```

### CSS 变量

```css
:root {
  --device-type: phone;              /* 设备类型 */
  --orientation: portrait;           /* 屏幕方向 */
  --scale-factor: 0.8;              /* 缩放比例 */
  --touch-target-size: 48px;        /* 触控目标大小 */
  --safe-area-top: 0px;             /* 安全区域 */
  --safe-area-bottom: 0px;
  --safe-area-left: 0px;
  --safe-area-right: 0px;
  --platform-type: ios-safari;      /* 平台类型 */
  --touch-delay: 300ms;             /* 触控延迟 */
  --tap-threshold: 10px;            /* 点击阈值 */
  --max-fps: 60;                    /* 最大帧率 */
  --pixel-ratio: 2;                 /* 像素比 */
}
```

## 最佳实践

### 1. 触控目标大小

```css
/* 确保触控目标足够大 */
.touch-target {
  min-width: var(--touch-target-size);
  min-height: var(--touch-target-size);
  padding: 8px;
}
```

### 2. 触控反馈

```css
.touch-feedback:active {
  transform: scale(1.05);
  transition: transform 0.1s ease;
}
```

### 3. 防止意外触发

```css
.prevent-touch-callout {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

### 4. 安全区域适配

```css
.safe-area-padding {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## 性能优化建议

### 1. 事件节流

```typescript
// 高频触控事件使用节流
touchEventHandler.updateConfig({
  touchThrottleMs: 16 // 60fps
});
```

### 2. 内存管理

```typescript
// 启用内存优化
mobileOptimizer.updateConfig({
  enableMemoryOptimization: true
});
```

### 3. GPU 加速

```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

### 4. 低端设备适配

```typescript
// 检测低端设备并降级
if (mobileOptimizer.getResourceInfo().performanceLevel === 'low') {
  // 启用低质量模式
  mobileOptimizer.setOptimizationLevel(3);
}
```

## 故障排除

### 1. 启用调试模式

```typescript
// 开发环境启用完整调试
if (process.env.NODE_ENV === 'development') {
  enableTouchDebugging({
    visualDebug: true,
    eventLogging: true,
    performanceDebug: true
  });
}
```

### 2. 查看调试报告

```typescript
// 生成调试报告
console.log(touchDebugger.generateDebugReport());
console.log(mobileOptimizer.generatePerformanceReport());
console.log(responsiveAdapter.generateResponsiveReport());
console.log(crossPlatformOptimizer.generateCompatibilityReport());
```

### 3. 检查兼容性

```typescript
// 运行兼容性测试
const testResults = crossPlatformOptimizer.runPlatformTests();
Object.entries(testResults).forEach(([test, result]) => {
  console.log(`${test}: ${result ? '✓' : '✗'}`);
});
```

---

## 📝 总结

这套 API 设计遵循以下原则：

- **易用性**: 简单的初始化，最小的配置
- **兼容性**: 与现有代码完全兼容
- **可扩展性**: 模块化设计，便于扩展
- **可调试性**: 完整的调试工具链
- **高性能**: 自动优化，适配各种设备

通过这些 API，开发者可以轻松为现有应用添加触控支持，并获得跨平台的一致体验。