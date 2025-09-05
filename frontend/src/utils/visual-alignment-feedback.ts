/**
 * 可视化对齐辅助系统
 * Agent 5: 智能对齐和磁性吸附专家
 * 
 * 功能特性：
 * - 实时对齐指示线渲染
 * - 吸附区域可视化
 * - 距离和角度测量工具
 * - 布局网格显示系统
 * - 对齐状态反馈界面
 * - 动态视觉引导
 * - 高性能SVG渲染
 * - 可配置视觉样式
 */

import { Vector2D, BoundingBox, preciseRound, MathUtils } from './math-precision';
import { memoryManager } from './memory-manager';
import { renderOptimizer } from './render-optimizer';
import { cacheOptimizer } from './cache-optimizer';
import type { SelectionItem } from './multi-selection-manager';
import type { AlignmentGuide } from './smart-snapping-alignment';
import type { MagneticTarget } from './enhanced-magnetic-snapping';

// 视觉元素类型
export enum VisualElementType {
  ALIGNMENT_GUIDE = 'alignment-guide',
  SNAP_RADIUS = 'snap-radius',
  MAGNETIC_FIELD = 'magnetic-field',
  DISTANCE_RULER = 'distance-ruler',
  ANGLE_INDICATOR = 'angle-indicator',
  GRID_OVERLAY = 'grid-overlay',
  BOUNDING_BOX = 'bounding-box',
  CONNECTION_LINE = 'connection-line',
  GHOST_PREVIEW = 'ghost-preview'
}

// 视觉样式配置
export interface VisualStyle {
  color: string;
  opacity: number;
  strokeWidth: number;
  strokeDashArray?: number[];
  fillColor?: string;
  fillOpacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  animation?: {
    enabled: boolean;
    duration: number;
    easing: string;
    repeat?: boolean;
  };
}

// 对齐指示线配置
export interface AlignmentGuideConfig {
  enabled: boolean;
  showDistance: boolean;
  showAngle: boolean;
  autoHide: boolean;
  hideDelay: number;
  extensionLength: number;
  styles: {
    primary: VisualStyle;
    secondary: VisualStyle;
    active: VisualStyle;
    temporary: VisualStyle;
  };
}

// 吸附区域配置
export interface SnapZoneConfig {
  enabled: boolean;
  showRadius: boolean;
  showField: boolean;
  showPreview: boolean;
  styles: {
    radius: VisualStyle;
    field: VisualStyle;
    preview: VisualStyle;
    hotzone: VisualStyle;
  };
}

// 测量工具配置
export interface MeasurementConfig {
  enabled: boolean;
  showDistance: boolean;
  showAngle: boolean;
  showCoordinates: boolean;
  units: 'px' | 'mm' | 'in' | 'pt';
  precision: number;
  styles: {
    ruler: VisualStyle;
    text: VisualStyle;
    handles: VisualStyle;
  };
}

// 网格系统配置
export interface GridOverlayConfig {
  enabled: boolean;
  gridSize: Vector2D;
  subdivisions: number;
  snapToGrid: boolean;
  adaptive: boolean;
  styles: {
    major: VisualStyle;
    minor: VisualStyle;
    snap: VisualStyle;
  };
}

// 视觉反馈配置
export interface VisualFeedbackConfig {
  alignmentGuides: AlignmentGuideConfig;
  snapZones: SnapZoneConfig;
  measurements: MeasurementConfig;
  gridOverlay: GridOverlayConfig;
  
  // 全局设置
  renderingMode: 'performance' | 'quality' | 'balanced';
  maxVisualElements: number;
  updateFrequency: number;
  enableAnimations: boolean;
  responsiveUI: boolean;
}

// 视觉元素
export interface VisualElement {
  id: string;
  type: VisualElementType;
  visible: boolean;
  zIndex: number;
  bounds?: BoundingBox;
  
  // 几何信息
  geometry: {
    points: Vector2D[];
    curves?: Array<{
      type: 'quadratic' | 'cubic' | 'arc';
      controlPoints: Vector2D[];
      radius?: number;
      startAngle?: number;
      endAngle?: number;
    }>;
  };
  
  // 样式
  style: VisualStyle;
  
  // 动画状态
  animation?: {
    startTime: number;
    duration: number;
    progress: number;
    easing: string;
    keyframes: Array<{
      time: number;
      properties: Record<string, any>;
    }>;
  };
  
  // 交互状态
  interactive: boolean;
  hoverable: boolean;
  selectable: boolean;
  
  // 元数据
  metadata?: Record<string, any>;
  timestamp: number;
}

// 测量结果
export interface MeasurementResult {
  id: string;
  type: 'distance' | 'angle' | 'area' | 'position';
  value: number;
  unit: string;
  formattedValue: string;
  start: Vector2D;
  end: Vector2D;
  
  // 显示信息
  displayPosition: Vector2D;
  displayText: string;
  precision: number;
  
  // 关联对象
  relatedItems: string[];
}

/**
 * 可视化对齐反馈系统
 */
export class VisualAlignmentFeedback {
  private config: VisualFeedbackConfig;
  private visualElements: Map<string, VisualElement> = new Map();
  private measurements: Map<string, MeasurementResult> = new Map();
  
  // SVG容器和组
  private svgContainer: SVGSVGElement | null = null;
  private layerGroups: Map<VisualElementType, SVGGElement> = new Map();
  
  // 渲染缓存
  private renderCache: Map<string, SVGElement> = new Map();
  private dirtyElements: Set<string> = new Set();
  private lastRenderTime = 0;
  
  // 动画系统
  private animationFrameId: number | null = null;
  private activeAnimations: Set<string> = new Set();
  
  // 性能统计
  private stats = {
    totalElements: 0,
    visibleElements: 0,
    renderTime: 0,
    animationCount: 0,
    cacheHitRate: 0
  };

  constructor(config: Partial<VisualFeedbackConfig> = {}) {
    this.config = {
      alignmentGuides: {
        enabled: true,
        showDistance: true,
        showAngle: false,
        autoHide: true,
        hideDelay: 2000,
        extensionLength: 50,
        styles: {
          primary: {
            color: '#3b82f6',
            opacity: 0.8,
            strokeWidth: 1.5,
            strokeDashArray: [4, 4]
          },
          secondary: {
            color: '#6b7280',
            opacity: 0.6,
            strokeWidth: 1,
            strokeDashArray: [2, 2]
          },
          active: {
            color: '#1d4ed8',
            opacity: 1.0,
            strokeWidth: 2,
            animation: {
              enabled: true,
              duration: 300,
              easing: 'ease-out'
            }
          },
          temporary: {
            color: '#f59e0b',
            opacity: 0.7,
            strokeWidth: 1,
            strokeDashArray: [6, 3]
          }
        }
      },
      
      snapZones: {
        enabled: true,
        showRadius: false,
        showField: true,
        showPreview: true,
        styles: {
          radius: {
            color: '#10b981',
            opacity: 0.3,
            strokeWidth: 1,
            fillColor: '#10b981',
            fillOpacity: 0.1
          },
          field: {
            color: '#3b82f6',
            opacity: 0.2,
            strokeWidth: 0,
            fillColor: '#3b82f6',
            fillOpacity: 0.05
          },
          preview: {
            color: '#f59e0b',
            opacity: 0.8,
            strokeWidth: 2,
            strokeDashArray: [3, 3]
          },
          hotzone: {
            color: '#ef4444',
            opacity: 0.4,
            strokeWidth: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.1
          }
        }
      },
      
      measurements: {
        enabled: true,
        showDistance: true,
        showAngle: true,
        showCoordinates: false,
        units: 'px',
        precision: 1,
        styles: {
          ruler: {
            color: '#374151',
            opacity: 0.9,
            strokeWidth: 1.5
          },
          text: {
            color: '#1f2937',
            opacity: 1.0,
            strokeWidth: 0,
            fillColor: '#1f2937'
          },
          handles: {
            color: '#3b82f6',
            opacity: 0.8,
            strokeWidth: 2,
            fillColor: '#ffffff'
          }
        }
      },
      
      gridOverlay: {
        enabled: false,
        gridSize: new Vector2D(20, 20),
        subdivisions: 4,
        snapToGrid: false,
        adaptive: true,
        styles: {
          major: {
            color: '#d1d5db',
            opacity: 0.6,
            strokeWidth: 0.5
          },
          minor: {
            color: '#e5e7eb',
            opacity: 0.3,
            strokeWidth: 0.25
          },
          snap: {
            color: '#3b82f6',
            opacity: 0.8,
            strokeWidth: 1,
            fillColor: '#3b82f6',
            fillOpacity: 0.3
          }
        }
      },
      
      renderingMode: 'balanced',
      maxVisualElements: 200,
      updateFrequency: 60,
      enableAnimations: true,
      responsiveUI: true,
      
      ...config
    };

    this.initializeSVGContainer();
    this.startRenderLoop();

    console.log('VisualAlignmentFeedback: Initialized with advanced visual feedback system');
  }

  /**
   * 初始化SVG容器
   */
  private initializeSVGContainer(): void {
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    this.svgContainer.setAttribute('class', 'visual-alignment-feedback');
    this.svgContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      overflow: visible;
    `;

    // 创建图层组
    const layerOrder = [
      VisualElementType.GRID_OVERLAY,
      VisualElementType.MAGNETIC_FIELD,
      VisualElementType.SNAP_RADIUS,
      VisualElementType.ALIGNMENT_GUIDE,
      VisualElementType.CONNECTION_LINE,
      VisualElementType.DISTANCE_RULER,
      VisualElementType.ANGLE_INDICATOR,
      VisualElementType.BOUNDING_BOX,
      VisualElementType.GHOST_PREVIEW
    ];

    layerOrder.forEach((type, index) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', `layer-${type}`);
      group.style.zIndex = (index + 1).toString();
      
      this.layerGroups.set(type, group);
      this.svgContainer!.appendChild(group);
    });

    // 添加样式定义
    this.addStyleDefinitions();

    console.log('VisualAlignmentFeedback: SVG container initialized');
  }

  /**
   * 添加SVG样式定义
   */
  private addStyleDefinitions(): void {
    if (!this.svgContainer) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // 添加滤镜效果
    const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    shadowFilter.setAttribute('id', 'drop-shadow');
    shadowFilter.innerHTML = `
      <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
    `;
    
    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'glow');
    glowFilter.innerHTML = `
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `;

    // 添加渐变定义
    const magneticGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    magneticGradient.setAttribute('id', 'magnetic-gradient');
    magneticGradient.innerHTML = `
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
    `;

    defs.appendChild(shadowFilter);
    defs.appendChild(glowFilter);
    defs.appendChild(magneticGradient);
    
    this.svgContainer.appendChild(defs);
  }

  /**
   * 挂载到目标容器
   */
  mountTo(container: Element): void {
    if (this.svgContainer && container) {
      container.appendChild(this.svgContainer);
      console.log('VisualAlignmentFeedback: Mounted to container');
    }
  }

  /**
   * 显示对齐指示线
   */
  showAlignmentGuides(guides: AlignmentGuide[]): void {
    if (!this.config.alignmentGuides.enabled) return;

    console.log(`VisualAlignmentFeedback: Showing ${guides.length} alignment guides`);

    // 清除现有的指示线
    this.clearElementsByType(VisualElementType.ALIGNMENT_GUIDE);

    for (const guide of guides) {
      const guideElement = this.createAlignmentGuideElement(guide);
      this.addVisualElement(guideElement);
    }

    // 自动隐藏
    if (this.config.alignmentGuides.autoHide) {
      setTimeout(() => {
        this.clearElementsByType(VisualElementType.ALIGNMENT_GUIDE);
      }, this.config.alignmentGuides.hideDelay);
    }
  }

  /**
   * 显示吸附区域
   */
  showSnapZones(targets: MagneticTarget[]): void {
    if (!this.config.snapZones.enabled) return;

    console.log(`VisualAlignmentFeedback: Showing ${targets.length} snap zones`);

    this.clearElementsByType(VisualElementType.SNAP_RADIUS);
    this.clearElementsByType(VisualElementType.MAGNETIC_FIELD);

    for (const target of targets) {
      if (this.config.snapZones.showRadius) {
        const radiusElement = this.createSnapRadiusElement(target);
        this.addVisualElement(radiusElement);
      }

      if (this.config.snapZones.showField) {
        const fieldElement = this.createMagneticFieldElement(target);
        this.addVisualElement(fieldElement);
      }
    }
  }

  /**
   * 显示距离测量
   */
  showDistanceMeasurement(
    start: Vector2D,
    end: Vector2D,
    options: {
      id?: string;
      showValue?: boolean;
      showAngle?: boolean;
      temporary?: boolean;
    } = {}
  ): string {
    if (!this.config.measurements.enabled) return '';

    const id = options.id || `distance-${Date.now()}`;
    const distance = start.distanceTo(end);
    
    // 创建测量结果
    const measurement: MeasurementResult = {
      id,
      type: 'distance',
      value: distance,
      unit: this.config.measurements.units,
      formattedValue: this.formatMeasurement(distance, 'distance'),
      start,
      end,
      displayPosition: start.add(end).divide(2),
      displayText: this.formatMeasurement(distance, 'distance'),
      precision: this.config.measurements.precision,
      relatedItems: []
    };

    this.measurements.set(id, measurement);

    // 创建视觉元素
    const rulerElement = this.createDistanceRulerElement(measurement, options);
    this.addVisualElement(rulerElement);

    // 如果显示角度
    if (options.showAngle && this.config.measurements.showAngle) {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const angleElement = this.createAngleIndicatorElement(start, angle);
      this.addVisualElement(angleElement);
    }

    console.log(`VisualAlignmentFeedback: Added distance measurement: ${measurement.formattedValue}`);

    return id;
  }

  /**
   * 显示网格覆盖
   */
  showGridOverlay(bounds: BoundingBox, options: { 
    adaptive?: boolean; 
    highlightIntersections?: Vector2D[] 
  } = {}): void {
    if (!this.config.gridOverlay.enabled) return;

    this.clearElementsByType(VisualElementType.GRID_OVERLAY);

    const gridSize = this.config.gridOverlay.adaptive && options.adaptive 
      ? this.calculateAdaptiveGridSize(bounds)
      : this.config.gridOverlay.gridSize;

    const gridElement = this.createGridOverlayElement(bounds, gridSize, options);
    this.addVisualElement(gridElement);

    console.log('VisualAlignmentFeedback: Grid overlay displayed');
  }

  /**
   * 显示对象边界框
   */
  showBoundingBoxes(items: SelectionItem[], highlight: boolean = false): void {
    this.clearElementsByType(VisualElementType.BOUNDING_BOX);

    for (const item of items) {
      const boundingBoxElement = this.createBoundingBoxElement(item, highlight);
      this.addVisualElement(boundingBoxElement);
    }

    console.log(`VisualAlignmentFeedback: Showing ${items.length} bounding boxes`);
  }

  /**
   * 显示幽灵预览
   */
  showGhostPreview(
    originalPositions: Vector2D[],
    previewPositions: Vector2D[],
    itemSizes: Vector2D[]
  ): void {
    this.clearElementsByType(VisualElementType.GHOST_PREVIEW);

    for (let i = 0; i < previewPositions.length; i++) {
      const ghostElement = this.createGhostPreviewElement(
        originalPositions[i],
        previewPositions[i],
        itemSizes[i]
      );
      this.addVisualElement(ghostElement);
    }

    console.log(`VisualAlignmentFeedback: Showing ${previewPositions.length} ghost previews`);
  }

  /**
   * 创建对齐指示线元素
   */
  private createAlignmentGuideElement(guide: AlignmentGuide): VisualElement {
    const style = guide.animated 
      ? this.config.alignmentGuides.styles.active
      : this.config.alignmentGuides.styles.primary;

    return {
      id: `guide-${guide.id}`,
      type: VisualElementType.ALIGNMENT_GUIDE,
      visible: true,
      zIndex: 10,
      geometry: {
        points: [guide.start, guide.end]
      },
      style: { ...style },
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      animation: guide.animated && this.config.enableAnimations ? {
        startTime: performance.now(),
        duration: style.animation?.duration || 300,
        progress: 0,
        easing: style.animation?.easing || 'ease-out',
        keyframes: [
          { time: 0, properties: { opacity: 0, strokeWidth: 0 } },
          { time: 1, properties: { opacity: style.opacity, strokeWidth: style.strokeWidth } }
        ]
      } : undefined
    };
  }

  /**
   * 创建吸附半径元素
   */
  private createSnapRadiusElement(target: MagneticTarget): VisualElement {
    const style = this.config.snapZones.styles.radius;

    return {
      id: `snap-radius-${target.id}`,
      type: VisualElementType.SNAP_RADIUS,
      visible: true,
      zIndex: 5,
      bounds: BoundingBox.fromRect(
        target.position.x - target.radius,
        target.position.y - target.radius,
        target.radius * 2,
        target.radius * 2
      ),
      geometry: {
        points: [target.position],
        curves: [{
          type: 'arc',
          controlPoints: [],
          radius: target.radius,
          startAngle: 0,
          endAngle: Math.PI * 2
        }]
      },
      style: { ...style },
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      metadata: { targetId: target.id, targetType: target.type }
    };
  }

  /**
   * 创建磁场元素
   */
  private createMagneticFieldElement(target: MagneticTarget): VisualElement {
    const style = this.config.snapZones.styles.field;
    const fieldRadius = target.radius * 1.5;

    return {
      id: `magnetic-field-${target.id}`,
      type: VisualElementType.MAGNETIC_FIELD,
      visible: true,
      zIndex: 1,
      bounds: BoundingBox.fromRect(
        target.position.x - fieldRadius,
        target.position.y - fieldRadius,
        fieldRadius * 2,
        fieldRadius * 2
      ),
      geometry: {
        points: [target.position],
        curves: [{
          type: 'arc',
          controlPoints: [],
          radius: fieldRadius,
          startAngle: 0,
          endAngle: Math.PI * 2
        }]
      },
      style: {
        ...style,
        fillColor: 'url(#magnetic-gradient)',
        opacity: style.opacity * target.strength
      },
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      metadata: { targetId: target.id, strength: target.strength }
    };
  }

  /**
   * 创建距离标尺元素
   */
  private createDistanceRulerElement(
    measurement: MeasurementResult,
    options: any
  ): VisualElement {
    const style = this.config.measurements.styles.ruler;

    return {
      id: `ruler-${measurement.id}`,
      type: VisualElementType.DISTANCE_RULER,
      visible: true,
      zIndex: 15,
      geometry: {
        points: [measurement.start, measurement.end, measurement.displayPosition]
      },
      style: { ...style },
      interactive: true,
      hoverable: true,
      selectable: false,
      timestamp: Date.now(),
      metadata: { 
        measurement: measurement.formattedValue,
        temporary: options.temporary 
      }
    };
  }

  /**
   * 创建角度指示器元素
   */
  private createAngleIndicatorElement(center: Vector2D, angle: number): VisualElement {
    const radius = 30;
    const endPoint = center.add(new Vector2D(Math.cos(angle), Math.sin(angle)).multiply(radius));

    return {
      id: `angle-${Date.now()}`,
      type: VisualElementType.ANGLE_INDICATOR,
      visible: true,
      zIndex: 12,
      geometry: {
        points: [center, endPoint],
        curves: [{
          type: 'arc',
          controlPoints: [],
          radius: radius * 0.8,
          startAngle: 0,
          endAngle: angle
        }]
      },
      style: {
        color: '#f59e0b',
        opacity: 0.8,
        strokeWidth: 1.5
      },
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      metadata: { angle: (angle * 180 / Math.PI).toFixed(1) + '°' }
    };
  }

  /**
   * 创建网格覆盖元素
   */
  private createGridOverlayElement(
    bounds: BoundingBox,
    gridSize: Vector2D,
    options: any
  ): VisualElement {
    const points: Vector2D[] = [];
    
    // 生成网格点
    const startX = Math.floor(bounds.min.x / gridSize.x) * gridSize.x;
    const startY = Math.floor(bounds.min.y / gridSize.y) * gridSize.y;
    
    for (let x = startX; x <= bounds.max.x; x += gridSize.x) {
      points.push(new Vector2D(x, bounds.min.y));
      points.push(new Vector2D(x, bounds.max.y));
    }
    
    for (let y = startY; y <= bounds.max.y; y += gridSize.y) {
      points.push(new Vector2D(bounds.min.x, y));
      points.push(new Vector2D(bounds.max.x, y));
    }

    return {
      id: `grid-${Date.now()}`,
      type: VisualElementType.GRID_OVERLAY,
      visible: true,
      zIndex: 1,
      bounds,
      geometry: { points },
      style: this.config.gridOverlay.styles.major,
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      metadata: { gridSize: gridSize.toObject() }
    };
  }

  /**
   * 创建边界框元素
   */
  private createBoundingBoxElement(item: SelectionItem, highlight: boolean): VisualElement {
    return {
      id: `bbox-${item.id}`,
      type: VisualElementType.BOUNDING_BOX,
      visible: true,
      zIndex: 8,
      bounds: item.bounds,
      geometry: {
        points: [
          item.bounds.min,
          new Vector2D(item.bounds.max.x, item.bounds.min.y),
          item.bounds.max,
          new Vector2D(item.bounds.min.x, item.bounds.max.y)
        ]
      },
      style: {
        color: highlight ? '#ef4444' : '#6b7280',
        opacity: highlight ? 0.8 : 0.4,
        strokeWidth: highlight ? 2 : 1,
        strokeDashArray: [3, 3],
        fillColor: highlight ? '#ef4444' : 'transparent',
        fillOpacity: highlight ? 0.1 : 0
      },
      interactive: false,
      hoverable: true,
      selectable: false,
      timestamp: Date.now(),
      metadata: { itemId: item.id, highlight }
    };
  }

  /**
   * 创建幽灵预览元素
   */
  private createGhostPreviewElement(
    original: Vector2D,
    preview: Vector2D,
    size: Vector2D
  ): VisualElement {
    return {
      id: `ghost-${Date.now()}`,
      type: VisualElementType.GHOST_PREVIEW,
      visible: true,
      zIndex: 20,
      bounds: BoundingBox.fromRect(preview.x, preview.y, size.x, size.y),
      geometry: {
        points: [
          preview,
          preview.add(new Vector2D(size.x, 0)),
          preview.add(size),
          preview.add(new Vector2D(0, size.y))
        ]
      },
      style: {
        color: '#f59e0b',
        opacity: 0.6,
        strokeWidth: 2,
        strokeDashArray: [4, 4],
        fillColor: '#f59e0b',
        fillOpacity: 0.1
      },
      interactive: false,
      hoverable: false,
      selectable: false,
      timestamp: Date.now(),
      animation: this.config.enableAnimations ? {
        startTime: performance.now(),
        duration: 400,
        progress: 0,
        easing: 'ease-out',
        keyframes: [
          { time: 0, properties: { opacity: 0, transform: `translate(${original.x - preview.x}px, ${original.y - preview.y}px)` } },
          { time: 1, properties: { opacity: 0.6, transform: 'translate(0px, 0px)' } }
        ]
      } : undefined
    };
  }

  /**
   * 添加视觉元素
   */
  private addVisualElement(element: VisualElement): void {
    this.visualElements.set(element.id, element);
    this.dirtyElements.add(element.id);
    
    if (element.animation) {
      this.activeAnimations.add(element.id);
    }

    this.stats.totalElements = this.visualElements.size;
  }

  /**
   * 移除视觉元素
   */
  removeVisualElement(id: string): void {
    if (this.visualElements.delete(id)) {
      this.dirtyElements.add(id); // Mark for cleanup
      this.activeAnimations.delete(id);
      
      // Remove from DOM
      const cached = this.renderCache.get(id);
      if (cached && cached.parentNode) {
        cached.parentNode.removeChild(cached);
      }
      this.renderCache.delete(id);

      this.stats.totalElements = this.visualElements.size;
    }
  }

  /**
   * 按类型清除元素
   */
  private clearElementsByType(type: VisualElementType): void {
    const elementsToRemove: string[] = [];
    
    for (const [id, element] of this.visualElements) {
      if (element.type === type) {
        elementsToRemove.push(id);
      }
    }
    
    elementsToRemove.forEach(id => this.removeVisualElement(id));
  }

  /**
   * 隐藏所有视觉反馈
   */
  hideAll(): void {
    this.visualElements.clear();
    this.measurements.clear();
    this.renderCache.clear();
    this.activeAnimations.clear();
    this.dirtyElements.clear();

    // 清空SVG容器
    if (this.svgContainer) {
      this.layerGroups.forEach(group => {
        while (group.firstChild) {
          group.removeChild(group.firstChild);
        }
      });
    }

    this.stats.totalElements = 0;
    this.stats.visibleElements = 0;

    console.log('VisualAlignmentFeedback: All visual elements hidden');
  }

  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    const render = () => {
      const startTime = performance.now();
      
      this.updateAnimations();
      this.renderVisualElements();
      
      this.stats.renderTime = performance.now() - startTime;
      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * 更新动画
   */
  private updateAnimations(): void {
    const currentTime = performance.now();
    
    for (const elementId of this.activeAnimations) {
      const element = this.visualElements.get(elementId);
      if (!element || !element.animation) {
        this.activeAnimations.delete(elementId);
        continue;
      }

      const elapsed = currentTime - element.animation.startTime;
      element.animation.progress = Math.min(1, elapsed / element.animation.duration);

      // 应用缓动函数
      const easedProgress = this.applyEasing(element.animation.progress, element.animation.easing);

      // 插值关键帧属性
      this.interpolateKeyframes(element, easedProgress);

      // 标记需要重新渲染
      this.dirtyElements.add(elementId);

      // 动画结束
      if (element.animation.progress >= 1) {
        this.activeAnimations.delete(elementId);
        element.animation = undefined;
      }
    }

    this.stats.animationCount = this.activeAnimations.size;
  }

  /**
   * 应用缓动函数
   */
  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'ease-in': return progress * progress;
      case 'ease-out': return 1 - (1 - progress) * (1 - progress);
      case 'ease-in-out': return progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'linear':
      default: return progress;
    }
  }

  /**
   * 插值关键帧属性
   */
  private interpolateKeyframes(element: VisualElement, progress: number): void {
    if (!element.animation) return;

    const keyframes = element.animation.keyframes;
    if (keyframes.length < 2) return;

    // 找到当前进度对应的关键帧区间
    let startFrame = keyframes[0];
    let endFrame = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
        startFrame = keyframes[i];
        endFrame = keyframes[i + 1];
        break;
      }
    }

    // 计算区间内的相对进度
    const frameProgress = endFrame.time === startFrame.time ? 0 : 
      (progress - startFrame.time) / (endFrame.time - startFrame.time);

    // 插值属性
    for (const [prop, startValue] of Object.entries(startFrame.properties)) {
      const endValue = endFrame.properties[prop];
      
      if (typeof startValue === 'number' && typeof endValue === 'number') {
        const interpolatedValue = startValue + (endValue - startValue) * frameProgress;
        this.applyAnimatedProperty(element, prop, interpolatedValue);
      }
    }
  }

  /**
   * 应用动画属性
   */
  private applyAnimatedProperty(element: VisualElement, property: string, value: any): void {
    switch (property) {
      case 'opacity':
        element.style.opacity = value;
        break;
      case 'strokeWidth':
        element.style.strokeWidth = value;
        break;
      // 可以添加更多属性
    }
  }

  /**
   * 渲染视觉元素
   */
  private renderVisualElements(): void {
    if (!this.svgContainer || this.dirtyElements.size === 0) return;

    for (const elementId of this.dirtyElements) {
      if (elementId.startsWith('remove-')) {
        // 处理删除标记
        continue;
      }

      const element = this.visualElements.get(elementId);
      if (!element) continue;

      let svgElement = this.renderCache.get(elementId);
      
      if (!svgElement) {
        svgElement = this.createSVGElement(element);
        this.renderCache.set(elementId, svgElement);
        
        // 添加到对应图层
        const layerGroup = this.layerGroups.get(element.type);
        if (layerGroup) {
          layerGroup.appendChild(svgElement);
        }
      } else {
        // 更新现有元素
        this.updateSVGElement(svgElement, element);
      }
    }

    this.dirtyElements.clear();
    this.stats.visibleElements = Array.from(this.visualElements.values())
      .filter(e => e.visible).length;
  }

  /**
   * 创建SVG元素
   */
  private createSVGElement(element: VisualElement): SVGElement {
    let svgElement: SVGElement;

    switch (element.type) {
      case VisualElementType.ALIGNMENT_GUIDE:
        svgElement = this.createLineElement(element);
        break;
        
      case VisualElementType.SNAP_RADIUS:
      case VisualElementType.MAGNETIC_FIELD:
        svgElement = this.createCircleElement(element);
        break;
        
      case VisualElementType.DISTANCE_RULER:
        svgElement = this.createRulerElement(element);
        break;
        
      case VisualElementType.GRID_OVERLAY:
        svgElement = this.createGridElement(element);
        break;
        
      case VisualElementType.BOUNDING_BOX:
      case VisualElementType.GHOST_PREVIEW:
        svgElement = this.createRectElement(element);
        break;
        
      default:
        svgElement = this.createGenericElement(element);
        break;
    }

    // 应用通用属性
    this.applySVGStyle(svgElement, element.style);
    svgElement.setAttribute('data-element-id', element.id);
    svgElement.setAttribute('class', `visual-element ${element.type}`);

    return svgElement;
  }

  /**
   * 创建线条元素
   */
  private createLineElement(element: VisualElement): SVGElement {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const points = element.geometry.points;
    
    if (points.length >= 2) {
      line.setAttribute('x1', points[0].x.toString());
      line.setAttribute('y1', points[0].y.toString());
      line.setAttribute('x2', points[1].x.toString());
      line.setAttribute('y2', points[1].y.toString());
    }
    
    return line;
  }

  /**
   * 创建圆形元素
   */
  private createCircleElement(element: VisualElement): SVGElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const center = element.geometry.points[0];
    const curve = element.geometry.curves?.[0];
    
    if (center && curve) {
      circle.setAttribute('cx', center.x.toString());
      circle.setAttribute('cy', center.y.toString());
      circle.setAttribute('r', (curve.radius || 10).toString());
    }
    
    return circle;
  }

  /**
   * 创建标尺元素
   */
  private createRulerElement(element: VisualElement): SVGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const points = element.geometry.points;
    
    if (points.length >= 2) {
      // 主线
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', points[0].x.toString());
      line.setAttribute('y1', points[0].y.toString());
      line.setAttribute('x2', points[1].x.toString());
      line.setAttribute('y2', points[1].y.toString());
      group.appendChild(line);
      
      // 文本标签
      if (points.length >= 3 && element.metadata?.measurement) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', points[2].x.toString());
        text.setAttribute('y', points[2].y.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-family', 'monospace');
        text.textContent = element.metadata.measurement;
        
        // 背景
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const textBounds = text.getBBox();
        rect.setAttribute('x', (points[2].x - textBounds.width / 2 - 4).toString());
        rect.setAttribute('y', (points[2].y - textBounds.height / 2 - 2).toString());
        rect.setAttribute('width', (textBounds.width + 8).toString());
        rect.setAttribute('height', (textBounds.height + 4).toString());
        rect.setAttribute('fill', 'rgba(255,255,255,0.9)');
        rect.setAttribute('stroke', 'rgba(0,0,0,0.2)');
        rect.setAttribute('rx', '2');
        
        group.appendChild(rect);
        group.appendChild(text);
      }
    }
    
    return group;
  }

  /**
   * 创建网格元素
   */
  private createGridElement(element: VisualElement): SVGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const points = element.geometry.points;
    
    // 创建网格线
    for (let i = 0; i < points.length; i += 2) {
      if (i + 1 < points.length) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', points[i].x.toString());
        line.setAttribute('y1', points[i].y.toString());
        line.setAttribute('x2', points[i + 1].x.toString());
        line.setAttribute('y2', points[i + 1].y.toString());
        group.appendChild(line);
      }
    }
    
    return group;
  }

  /**
   * 创建矩形元素
   */
  private createRectElement(element: VisualElement): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    
    if (element.bounds) {
      rect.setAttribute('x', element.bounds.min.x.toString());
      rect.setAttribute('y', element.bounds.min.y.toString());
      rect.setAttribute('width', element.bounds.width.toString());
      rect.setAttribute('height', element.bounds.height.toString());
    }
    
    return rect;
  }

  /**
   * 创建通用元素
   */
  private createGenericElement(element: VisualElement): SVGElement {
    return document.createElementNS('http://www.w3.org/2000/svg', 'g');
  }

  /**
   * 应用SVG样式
   */
  private applySVGStyle(svgElement: SVGElement, style: VisualStyle): void {
    svgElement.setAttribute('stroke', style.color);
    svgElement.setAttribute('stroke-width', style.strokeWidth.toString());
    svgElement.setAttribute('opacity', style.opacity.toString());
    
    if (style.strokeDashArray) {
      svgElement.setAttribute('stroke-dasharray', style.strokeDashArray.join(','));
    }
    
    if (style.fillColor) {
      svgElement.setAttribute('fill', style.fillColor);
      svgElement.setAttribute('fill-opacity', (style.fillOpacity || 1).toString());
    } else {
      svgElement.setAttribute('fill', 'none');
    }
    
    if (style.shadowColor) {
      svgElement.setAttribute('filter', 'url(#drop-shadow)');
    }
  }

  /**
   * 更新SVG元素
   */
  private updateSVGElement(svgElement: SVGElement, element: VisualElement): void {
    // 更新样式
    this.applySVGStyle(svgElement, element.style);
    
    // 更新几何信息（根据元素类型）
    this.updateSVGGeometry(svgElement, element);
  }

  /**
   * 更新SVG几何信息
   */
  private updateSVGGeometry(svgElement: SVGElement, element: VisualElement): void {
    switch (element.type) {
      case VisualElementType.ALIGNMENT_GUIDE:
        if (svgElement instanceof SVGLineElement && element.geometry.points.length >= 2) {
          const points = element.geometry.points;
          svgElement.setAttribute('x1', points[0].x.toString());
          svgElement.setAttribute('y1', points[0].y.toString());
          svgElement.setAttribute('x2', points[1].x.toString());
          svgElement.setAttribute('y2', points[1].y.toString());
        }
        break;
        
      case VisualElementType.SNAP_RADIUS:
      case VisualElementType.MAGNETIC_FIELD:
        if (svgElement instanceof SVGCircleElement && element.geometry.curves) {
          const center = element.geometry.points[0];
          const radius = element.geometry.curves[0].radius || 10;
          svgElement.setAttribute('cx', center.x.toString());
          svgElement.setAttribute('cy', center.y.toString());
          svgElement.setAttribute('r', radius.toString());
        }
        break;
    }
  }

  // ========== 辅助方法 ==========

  private formatMeasurement(value: number, type: 'distance' | 'angle'): string {
    const precision = this.config.measurements.precision;
    const unit = this.config.measurements.units;
    
    const formattedValue = preciseRound(value, precision);
    
    switch (type) {
      case 'distance':
        return `${formattedValue}${unit}`;
      case 'angle':
        return `${formattedValue}°`;
      default:
        return formattedValue.toString();
    }
  }

  private calculateAdaptiveGridSize(bounds: BoundingBox): Vector2D {
    // 根据视口大小自适应网格尺寸
    const viewportDimension = Math.min(bounds.width, bounds.height);
    const optimalGridSize = Math.max(10, viewportDimension / 20);
    
    return new Vector2D(optimalGridSize, optimalGridSize);
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<VisualFeedbackConfig>): void {
    Object.assign(this.config, newConfig);
    console.log('VisualAlignmentFeedback: Configuration updated');
  }

  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 停止渲染循环
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // 清理DOM
    if (this.svgContainer && this.svgContainer.parentNode) {
      this.svgContainer.parentNode.removeChild(this.svgContainer);
    }

    // 清理数据
    this.visualElements.clear();
    this.measurements.clear();
    this.renderCache.clear();
    this.layerGroups.clear();
    this.activeAnimations.clear();
    this.dirtyElements.clear();

    console.log('VisualAlignmentFeedback: Resources disposed');
  }
}

/**
 * 工厂函数：创建可视化对齐反馈系统
 */
export function createVisualAlignmentFeedback(
  config?: Partial<VisualFeedbackConfig>
): VisualAlignmentFeedback {
  return new VisualAlignmentFeedback(config);
}

/**
 * 工厂函数：创建高性能视觉反馈系统
 */
export function createHighPerformanceVisualFeedback(): VisualAlignmentFeedback {
  return new VisualAlignmentFeedback({
    renderingMode: 'performance',
    maxVisualElements: 500,
    updateFrequency: 120,
    enableAnimations: true,
    alignmentGuides: {
      enabled: true,
      showDistance: true,
      showAngle: true,
      autoHide: true,
      hideDelay: 1500,
      extensionLength: 100,
      styles: {
        primary: {
          color: '#3b82f6',
          opacity: 0.9,
          strokeWidth: 2
        },
        secondary: {
          color: '#6b7280',
          opacity: 0.7,
          strokeWidth: 1.5
        },
        active: {
          color: '#1d4ed8',
          opacity: 1.0,
          strokeWidth: 2.5,
          animation: {
            enabled: true,
            duration: 250,
            easing: 'ease-out'
          }
        },
        temporary: {
          color: '#f59e0b',
          opacity: 0.8,
          strokeWidth: 1.5
        }
      }
    }
  });
}