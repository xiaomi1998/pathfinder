/**
 * 精确拖拽系统使用示例
 * 展示如何在Vue组件中集成高精度拖拽功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Vector2D, 
  createDragCalculator, 
  BoundaryConstraint, 
  GridSnapper 
} from '../utils/coordinate-transform';
import { 
  PreciseBoundaryDetector, 
  createCanvasBoundary 
} from '../utils/boundary-detection';
import { 
  createPerformanceMonitor, 
  createDragAnalyzer 
} from '../utils/performance-monitor';

/**
 * 精确拖拽组合式函数
 * 提供开箱即用的高精度拖拽功能
 */
export function usePreciseDrag(
  containerRef: Ref<HTMLElement | null>,
  options: {
    enableBoundaryConstraints?: boolean;
    enableGridSnapping?: boolean;
    enablePerformanceMonitoring?: boolean;
    gridSize?: number;
    boundaryMargin?: number;
  } = {}
) {
  // 默认配置
  const config = {
    enableBoundaryConstraints: true,
    enableGridSnapping: false,
    enablePerformanceMonitoring: true,
    gridSize: 20,
    boundaryMargin: 10,
    ...options
  };

  // 状态管理
  const isDragging = ref(false);
  const selectedElement = ref<HTMLElement | null>(null);
  const dragCalculator = ref<any>(null);
  const boundaryDetector = ref<PreciseBoundaryDetector | null>(null);
  const gridSnapper = ref<GridSnapper | null>(null);
  
  // 性能监控
  const performanceMonitor = createPerformanceMonitor();
  const dragAnalyzer = createDragAnalyzer();

  // 精度指标
  const precisionMetrics = ref({
    positionError: 0,
    calculationTime: 0,
    dragLatency: 0,
    boundaryViolations: 0
  });

  // 性能统计
  const performanceStats = computed(() => {
    return performanceMonitor.getPerformanceStats();
  });

  /**
   * 初始化精确拖拽系统
   */
  const initializePreciseDrag = () => {
    if (!containerRef.value) return;

    try {
      // 1. 创建拖拽计算器
      const rect = containerRef.value.getBoundingClientRect();
      dragCalculator.value = createDragCalculator(
        containerRef.value,
        1, // 初始缩放
        Vector2D.zero() // 初始平移
      );

      // 2. 设置边界检测器
      if (config.enableBoundaryConstraints) {
        boundaryDetector.value = new PreciseBoundaryDetector();
        const canvasBoundary = createCanvasBoundary(
          rect.width,
          rect.height,
          config.boundaryMargin,
          'elastic'
        );
        boundaryDetector.value.addBoundary(canvasBoundary);
      }

      // 3. 设置网格对齐器
      if (config.enableGridSnapping) {
        gridSnapper.value = new GridSnapper(
          new Vector2D(config.gridSize, config.gridSize),
          true,
          8 // 对齐阈值
        );
      }

      // 4. 启动性能监控
      if (config.enablePerformanceMonitoring) {
        performanceMonitor.startMonitoring(100);
      }

      console.log('Precise drag system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize precise drag system:', error);
    }
  };

  /**
   * 开始精确拖拽
   */
  const startPreciseDrag = (event: MouseEvent, element: HTMLElement) => {
    if (!dragCalculator.value) return;

    try {
      isDragging.value = true;
      selectedElement.value = element;

      const startTime = performance.now();

      // 获取元素当前位置
      const elementRect = element.getBoundingClientRect();
      const containerRect = containerRef.value!.getBoundingClientRect();
      
      const screenPosition = new Vector2D(event.clientX, event.clientY);
      const elementPosition = new Vector2D(
        elementRect.left - containerRect.left,
        elementRect.top - containerRect.top
      );

      // 开始拖拽计算
      dragCalculator.value.startDrag(screenPosition, elementPosition);

      // 开始拖拽性能分析
      if (config.enablePerformanceMonitoring) {
        dragAnalyzer.startDragSession();
      }

      // 记录拖拽延迟
      const dragLatency = performance.now() - startTime;
      precisionMetrics.value.dragLatency = dragLatency;
      performanceMonitor.recordDragLatency(dragLatency);

      // 设置样式和事件监听
      element.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      document.addEventListener('mousemove', onDragMove, { passive: false });
      document.addEventListener('mouseup', onDragEnd);

      console.log('Precise drag started for element:', element);
    } catch (error) {
      console.error('Failed to start precise drag:', error);
      isDragging.value = false;
    }
  };

  /**
   * 拖拽移动处理
   */
  const onDragMove = (event: MouseEvent) => {
    if (!isDragging.value || !selectedElement.value || !dragCalculator.value) return;

    event.preventDefault();
    
    try {
      const calcStartTime = performance.now();

      // 计算精确位置
      const screenPosition = new Vector2D(event.clientX, event.clientY);
      let newPosition = dragCalculator.value.calculateDragPosition(screenPosition);

      // 应用边界约束
      let boundaryViolationCount = 0;
      if (boundaryDetector.value && config.enableBoundaryConstraints) {
        const elementSize = new Vector2D(
          selectedElement.value.offsetWidth,
          selectedElement.value.offsetHeight
        );
        
        const collision = boundaryDetector.value.checkPointCollision(newPosition, elementSize);
        
        if (collision.hasCollision) {
          boundaryViolationCount++;
          const constraintResult = boundaryDetector.value.constrainPosition(
            newPosition,
            elementSize
          );
          newPosition = constraintResult.constrainedPosition;
        }
      }

      // 应用网格对齐
      if (gridSnapper.value && config.enableGridSnapping) {
        newPosition = gridSnapper.value.snapToGrid(newPosition);
      }

      // 更新元素位置
      selectedElement.value.style.transform = 
        `translate(${newPosition.x}px, ${newPosition.y}px)`;

      // 记录性能指标
      const calcTime = performance.now() - calcStartTime;
      precisionMetrics.value.calculationTime = calcTime;
      precisionMetrics.value.boundaryViolations = boundaryViolationCount;
      
      performanceMonitor.recordCalculationTime(calcTime);
      
      if (config.enablePerformanceMonitoring) {
        dragAnalyzer.recordFrameTime(calcTime);
        dragAnalyzer.recordPosition(newPosition.x, newPosition.y);
      }

    } catch (error) {
      console.error('Error during drag move:', error);
    }
  };

  /**
   * 结束拖拽
   */
  const onDragEnd = () => {
    if (!isDragging.value) return;

    try {
      isDragging.value = false;

      // 结束拖拽计算
      if (dragCalculator.value) {
        const finalPosition = dragCalculator.value.endDrag();
        if (finalPosition) {
          console.log('Final precise position:', finalPosition.toObject());
        }
      }

      // 结束性能分析
      if (config.enablePerformanceMonitoring) {
        const analysis = dragAnalyzer.endDragSession();
        if (analysis) {
          console.log('Drag performance analysis:', analysis);
        }
      }

      // 清理样式和事件
      if (selectedElement.value) {
        selectedElement.value.style.cursor = '';
      }
      document.body.style.userSelect = '';
      
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);

      selectedElement.value = null;
      
      console.log('Precise drag ended');
    } catch (error) {
      console.error('Error ending drag:', error);
    }
  };

  /**
   * 更新配置
   */
  const updateConfig = (newConfig: Partial<typeof config>) => {
    Object.assign(config, newConfig);
    
    // 重新初始化相关组件
    if (newConfig.enableGridSnapping !== undefined) {
      if (newConfig.enableGridSnapping && !gridSnapper.value) {
        gridSnapper.value = new GridSnapper(
          new Vector2D(config.gridSize, config.gridSize),
          true,
          8
        );
      } else if (!newConfig.enableGridSnapping && gridSnapper.value) {
        gridSnapper.value.setEnabled(false);
      }
    }

    if (newConfig.enablePerformanceMonitoring !== undefined) {
      if (newConfig.enablePerformanceMonitoring) {
        performanceMonitor.startMonitoring(100);
      } else {
        performanceMonitor.stopMonitoring();
      }
    }
  };

  /**
   * 获取性能报告
   */
  const getPerformanceReport = () => {
    return {
      currentMetrics: precisionMetrics.value,
      performanceStats: performanceStats.value,
      detailedReport: performanceMonitor.generateReport()
    };
  };

  // 生命周期管理
  onMounted(() => {
    initializePreciseDrag();
  });

  onUnmounted(() => {
    performanceMonitor.stopMonitoring();
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
  });

  return {
    // 状态
    isDragging: readonly(isDragging),
    precisionMetrics: readonly(precisionMetrics),
    performanceStats,
    
    // 方法
    startPreciseDrag,
    updateConfig,
    getPerformanceReport,
    
    // 实用工具
    initializePreciseDrag
  };
}

/**
 * 简化的拖拽组合式函数
 * 适用于快速集成的场景
 */
export function useSimplePreciseDrag(containerRef: Ref<HTMLElement | null>) {
  return usePreciseDrag(containerRef, {
    enableBoundaryConstraints: true,
    enableGridSnapping: false,
    enablePerformanceMonitoring: false
  });
}

/**
 * 完整功能的拖拽组合式函数
 * 适用于需要完整精度功能的场景
 */
export function useFullPreciseDrag(containerRef: Ref<HTMLElement | null>) {
  return usePreciseDrag(containerRef, {
    enableBoundaryConstraints: true,
    enableGridSnapping: true,
    enablePerformanceMonitoring: true,
    gridSize: 10,
    boundaryMargin: 5
  });
}

/**
 * 在Vue组件中使用示例
 */
export const PreciseDragExample = {
  setup() {
    const containerRef = ref<HTMLElement | null>(null);
    const nodeRef = ref<HTMLElement | null>(null);
    
    // 使用精确拖拽功能
    const {
      isDragging,
      precisionMetrics,
      performanceStats,
      startPreciseDrag,
      getPerformanceReport
    } = useFullPreciseDrag(containerRef);

    // 处理拖拽开始
    const handleDragStart = (event: MouseEvent) => {
      if (nodeRef.value) {
        startPreciseDrag(event, nodeRef.value);
      }
    };

    // 获取性能报告
    const showPerformanceReport = () => {
      const report = getPerformanceReport();
      console.log('Performance Report:', report);
    };

    return {
      containerRef,
      nodeRef,
      isDragging,
      precisionMetrics,
      performanceStats,
      handleDragStart,
      showPerformanceReport
    };
  },

  template: `
    <div ref="containerRef" class="drag-container">
      <div 
        ref="nodeRef"
        @mousedown="handleDragStart"
        :class="{ 'dragging': isDragging }"
        class="draggable-node"
      >
        拖拽我 - 精度: {{ precisionMetrics.positionError.toFixed(3) }}px
      </div>
      
      <div class="metrics-panel">
        <h3>实时指标</h3>
        <p>FPS: {{ performanceStats.avgFps }}</p>
        <p>计算时间: {{ precisionMetrics.calculationTime.toFixed(2) }}ms</p>
        <p>边界违规: {{ precisionMetrics.boundaryViolations }}</p>
        
        <button @click="showPerformanceReport">
          查看性能报告
        </button>
      </div>
    </div>
  `
};