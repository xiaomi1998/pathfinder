/**
 * 事件处理优化系统
 * 提供事件防抖、节流、委托、智能监听器管理等功能
 */

import { memoryManager } from './memory-manager';
import { renderOptimizer } from './render-optimizer';

// 事件处理配置
export interface EventConfig {
  type: string;
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
  debounceMs?: number;
  throttleMs?: number;
  priority?: 'high' | 'normal' | 'low';
}

// 事件统计
export interface EventStats {
  totalEvents: number;
  processedEvents: number;
  droppedEvents: number;
  averageProcessingTime: number;
  eventTypes: Map<string, number>;
  timestamp: number;
}

// 事件处理器包装
interface EventHandlerWrapper {
  originalHandler: EventListener;
  processedHandler: EventListener;
  config: EventConfig;
  stats: {
    callCount: number;
    totalTime: number;
    lastCalled: number;
  };
}

/**
 * 高性能事件防抖器
 */
export class SmartDebouncer {
  private timers = new Map<string, number>();
  private lastResults = new Map<string, any>();
  
  /**
   * 防抖执行
   */
  debounce<T extends any[]>(
    key: string, 
    fn: (...args: T) => void, 
    delay: number,
    immediate = false
  ): (...args: T) => void {
    return (...args: T) => {
      const existingTimer = this.timers.get(key);
      
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      if (immediate && !existingTimer) {
        fn(...args);
      }
      
      const timer = window.setTimeout(() => {
        this.timers.delete(key);
        if (!immediate) {
          fn(...args);
        }
      }, delay);
      
      this.timers.set(key, timer);
    };
  }
  
  /**
   * 取消防抖
   */
  cancel(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
  
  /**
   * 清理所有定时器
   */
  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}

/**
 * 高性能事件节流器
 */
export class SmartThrottler {
  private lastExecution = new Map<string, number>();
  private pendingTimers = new Map<string, number>();
  
  /**
   * 节流执行
   */
  throttle<T extends any[]>(
    key: string,
    fn: (...args: T) => void,
    delay: number,
    trailing = true
  ): (...args: T) => void {
    return (...args: T) => {
      const now = performance.now();
      const lastTime = this.lastExecution.get(key) || 0;
      
      if (now - lastTime >= delay) {
        // 立即执行
        this.lastExecution.set(key, now);
        fn(...args);
      } else if (trailing) {
        // 尾随执行
        const existingTimer = this.pendingTimers.get(key);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        const remainingTime = delay - (now - lastTime);
        const timer = window.setTimeout(() => {
          this.lastExecution.set(key, performance.now());
          this.pendingTimers.delete(key);
          fn(...args);
        }, remainingTime);
        
        this.pendingTimers.set(key, timer);
      }
    };
  }
  
  /**
   * 取消节流
   */
  cancel(key: string): void {
    const timer = this.pendingTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.pendingTimers.delete(key);
    }
    this.lastExecution.delete(key);
  }
  
  /**
   * 清理所有定时器
   */
  cancelAll(): void {
    for (const timer of this.pendingTimers.values()) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();
    this.lastExecution.clear();
  }
}

/**
 * 事件委托管理器
 */
export class EventDelegationManager {
  private delegatedEvents = new Map<Element, Map<string, Set<EventListener>>>();
  private delegationHandlers = new Map<Element, Map<string, EventListener>>();
  
  /**
   * 添加委托事件
   */
  delegate(
    container: Element,
    eventType: string,
    selector: string,
    handler: EventListener,
    config?: EventConfig
  ): void {
    if (!this.delegatedEvents.has(container)) {
      this.delegatedEvents.set(container, new Map());
      this.delegationHandlers.set(container, new Map());
    }
    
    const containerEvents = this.delegatedEvents.get(container)!;
    const containerHandlers = this.delegationHandlers.get(container)!;
    
    if (!containerEvents.has(eventType)) {
      containerEvents.set(eventType, new Set());
      
      // 创建委托处理器
      const delegationHandler = (event: Event) => {
        this.handleDelegatedEvent(event, container, eventType, selector);
      };
      
      containerHandlers.set(eventType, delegationHandler);
      
      // 添加到容器
      const eventOptions = {
        passive: config?.passive,
        capture: config?.capture
      };
      
      container.addEventListener(eventType, delegationHandler, eventOptions);
    }
    
    containerEvents.get(eventType)!.add(handler);
  }
  
  /**
   * 处理委托事件
   */
  private handleDelegatedEvent(
    event: Event,
    container: Element,
    eventType: string,
    selector: string
  ): void {
    const target = event.target as Element;
    const matchingElement = target.closest(selector);
    
    if (matchingElement && container.contains(matchingElement)) {
      const handlers = this.delegatedEvents.get(container)?.get(eventType);
      if (handlers) {
        // 创建修改过的事件对象
        Object.defineProperty(event, 'currentTarget', {
          value: matchingElement,
          configurable: true
        });
        
        for (const handler of handlers) {
          try {
            handler.call(matchingElement, event);
          } catch (error) {
            console.error('Delegated event handler error:', error);
          }
        }
      }
    }
  }
  
  /**
   * 移除委托事件
   */
  undelegate(container: Element, eventType?: string, handler?: EventListener): void {
    const containerEvents = this.delegatedEvents.get(container);
    const containerHandlers = this.delegationHandlers.get(container);
    
    if (!containerEvents || !containerHandlers) return;
    
    if (eventType && handler) {
      // 移除特定处理器
      const handlers = containerEvents.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        
        if (handlers.size === 0) {
          containerEvents.delete(eventType);
          const delegationHandler = containerHandlers.get(eventType);
          if (delegationHandler) {
            container.removeEventListener(eventType, delegationHandler);
            containerHandlers.delete(eventType);
          }
        }
      }
    } else if (eventType) {
      // 移除特定事件类型的所有处理器
      const delegationHandler = containerHandlers.get(eventType);
      if (delegationHandler) {
        container.removeEventListener(eventType, delegationHandler);
      }
      containerEvents.delete(eventType);
      containerHandlers.delete(eventType);
    } else {
      // 移除所有委托事件
      for (const [type, handler] of containerHandlers) {
        container.removeEventListener(type, handler);
      }
      containerEvents.clear();
      containerHandlers.clear();
    }
    
    // 清理空的容器记录
    if (containerEvents.size === 0) {
      this.delegatedEvents.delete(container);
      this.delegationHandlers.delete(container);
    }
  }
  
  /**
   * 获取委托统计
   */
  getStats(): { containers: number; eventTypes: number; handlers: number } {
    let eventTypes = 0;
    let handlers = 0;
    
    for (const containerEvents of this.delegatedEvents.values()) {
      eventTypes += containerEvents.size;
      for (const handlerSet of containerEvents.values()) {
        handlers += handlerSet.size;
      }
    }
    
    return {
      containers: this.delegatedEvents.size,
      eventTypes,
      handlers
    };
  }
}

/**
 * 智能事件监听器管理器
 */
export class SmartEventManager {
  private handlers = new Map<Element, Map<string, EventHandlerWrapper>>();
  private debouncer = new SmartDebouncer();
  private throttler = new SmartThrottler();
  private delegationManager = new EventDelegationManager();
  
  // 统计数据
  private stats: EventStats = {
    totalEvents: 0,
    processedEvents: 0,
    droppedEvents: 0,
    averageProcessingTime: 0,
    eventTypes: new Map(),
    timestamp: performance.now()
  };
  
  // 性能配置
  private readonly PERFORMANCE_THRESHOLDS = {
    MAX_PROCESSING_TIME: 16, // 16ms 一帧的时间
    HIGH_FREQUENCY_EVENTS: new Set(['mousemove', 'scroll', 'resize', 'wheel']),
    PASSIVE_EVENTS: new Set(['scroll', 'wheel', 'touchstart', 'touchmove'])
  };
  
  /**
   * 添加优化的事件监听器
   */
  addListener(
    element: Element,
    eventType: string,
    handler: EventListener,
    config: EventConfig = {}
  ): void {
    const key = `${eventType}_${Date.now()}_${Math.random()}`;
    
    // 应用默认优化配置
    const optimizedConfig = this.applyDefaultOptimizations(eventType, config);
    
    // 创建优化的处理器
    const processedHandler = this.createOptimizedHandler(
      key,
      handler,
      optimizedConfig
    );
    
    // 存储包装器
    if (!this.handlers.has(element)) {
      this.handlers.set(element, new Map());
    }
    
    const wrapper: EventHandlerWrapper = {
      originalHandler: handler,
      processedHandler,
      config: optimizedConfig,
      stats: {
        callCount: 0,
        totalTime: 0,
        lastCalled: 0
      }
    };
    
    this.handlers.get(element)!.set(eventType, wrapper);
    
    // 添加事件监听器
    const eventOptions = {
      passive: optimizedConfig.passive,
      capture: optimizedConfig.capture,
      once: optimizedConfig.once
    };
    
    element.addEventListener(eventType, processedHandler, eventOptions);
    
    console.log(`Added optimized event listener: ${eventType}`);
  }
  
  /**
   * 应用默认优化配置
   */
  private applyDefaultOptimizations(eventType: string, config: EventConfig): EventConfig {
    const optimized = { ...config };
    
    // 自动设置 passive
    if (optimized.passive === undefined) {
      optimized.passive = this.PERFORMANCE_THRESHOLDS.PASSIVE_EVENTS.has(eventType);
    }
    
    // 高频事件自动节流
    if (this.PERFORMANCE_THRESHOLDS.HIGH_FREQUENCY_EVENTS.has(eventType)) {
      if (!optimized.throttleMs && !optimized.debounceMs) {
        optimized.throttleMs = eventType === 'mousemove' ? 16 : 100;
      }
      optimized.priority = 'high';
    }
    
    return optimized;
  }
  
  /**
   * 创建优化的事件处理器
   */
  private createOptimizedHandler(
    key: string,
    originalHandler: EventListener,
    config: EventConfig
  ): EventListener {
    let handler = originalHandler;
    
    // 添加性能监控包装
    handler = this.wrapWithPerformanceMonitoring(handler, config.type);
    
    // 应用防抖
    if (config.debounceMs) {
      handler = this.debouncer.debounce(key, handler, config.debounceMs);
    }
    
    // 应用节流
    if (config.throttleMs) {
      handler = this.throttler.throttle(key, handler, config.throttleMs);
    }
    
    // 添加优先级调度
    if (config.priority) {
      handler = this.wrapWithPriorityScheduling(handler, config.priority);
    }
    
    return handler;
  }
  
  /**
   * 包装性能监控
   */
  private wrapWithPerformanceMonitoring(
    handler: EventListener,
    eventType: string
  ): EventListener {
    return (event: Event) => {
      const startTime = performance.now();
      
      try {
        this.stats.totalEvents++;
        
        // 更新事件类型统计
        const typeCount = this.stats.eventTypes.get(eventType) || 0;
        this.stats.eventTypes.set(eventType, typeCount + 1);
        
        handler(event);
        
        this.stats.processedEvents++;
      } catch (error) {
        console.error(`Event handler error (${eventType}):`, error);
        this.stats.droppedEvents++;
      } finally {
        const processingTime = performance.now() - startTime;
        this.updateProcessingTimeStats(processingTime);
        
        // 警告长时间处理
        if (processingTime > this.PERFORMANCE_THRESHOLDS.MAX_PROCESSING_TIME) {
          console.warn(
            `Long event processing detected: ${eventType} took ${processingTime.toFixed(2)}ms`
          );
        }
      }
    };
  }
  
  /**
   * 包装优先级调度
   */
  private wrapWithPriorityScheduling(
    handler: EventListener,
    priority: 'high' | 'normal' | 'low'
  ): EventListener {
    return (event: Event) => {
      const taskPriority = priority === 'high' ? 'critical' : priority;
      
      renderOptimizer.getScheduler().addTask({
        id: `event_${Date.now()}`,
        type: 'immediate',
        priority: taskPriority as any,
        execute: () => handler(event)
      });
    };
  }
  
  /**
   * 更新处理时间统计
   */
  private updateProcessingTimeStats(processingTime: number): void {
    if (this.stats.processedEvents > 1) {
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (this.stats.processedEvents - 1) + processingTime) / 
        this.stats.processedEvents;
    } else {
      this.stats.averageProcessingTime = processingTime;
    }
  }
  
  /**
   * 移除事件监听器
   */
  removeListener(element: Element, eventType: string, handler?: EventListener): void {
    const elementHandlers = this.handlers.get(element);
    if (!elementHandlers) return;
    
    const wrapper = elementHandlers.get(eventType);
    if (!wrapper) return;
    
    // 检查是否是同一个处理器（如果提供了的话）
    if (handler && wrapper.originalHandler !== handler) return;
    
    // 移除事件监听器
    element.removeEventListener(eventType, wrapper.processedHandler);
    
    // 清理防抖和节流
    const key = `${eventType}_${wrapper.originalHandler}`;
    this.debouncer.cancel(key);
    this.throttler.cancel(key);
    
    // 移除包装器
    elementHandlers.delete(eventType);
    
    if (elementHandlers.size === 0) {
      this.handlers.delete(element);
    }
    
    console.log(`Removed event listener: ${eventType}`);
  }
  
  /**
   * 添加委托事件
   */
  addDelegatedListener(
    container: Element,
    eventType: string,
    selector: string,
    handler: EventListener,
    config: EventConfig = {}
  ): void {
    const optimizedConfig = this.applyDefaultOptimizations(eventType, config);
    const optimizedHandler = this.wrapWithPerformanceMonitoring(handler, eventType);
    
    this.delegationManager.delegate(
      container,
      eventType,
      selector,
      optimizedHandler,
      optimizedConfig
    );
  }
  
  /**
   * 移除委托事件
   */
  removeDelegatedListener(
    container: Element,
    eventType?: string,
    handler?: EventListener
  ): void {
    this.delegationManager.undelegate(container, eventType, handler);
  }
  
  /**
   * 优化拖拽事件
   */
  optimizeDragEvents(element: Element): {
    onDragStart: (handler: EventListener) => void;
    onDragMove: (handler: EventListener) => void;
    onDragEnd: (handler: EventListener) => void;
  } {
    return {
      onDragStart: (handler) => {
        this.addListener(element, 'mousedown', handler, {
          type: 'mousedown',
          priority: 'high',
          passive: false
        });
        
        this.addListener(element, 'touchstart', handler, {
          type: 'touchstart',
          priority: 'high',
          passive: false
        });
      },
      
      onDragMove: (handler) => {
        this.addListener(document, 'mousemove', handler, {
          type: 'mousemove',
          priority: 'high',
          throttleMs: 16, // 60 FPS
          passive: true
        });
        
        this.addListener(document, 'touchmove', handler, {
          type: 'touchmove',
          priority: 'high',
          throttleMs: 16,
          passive: false // 需要 preventDefault
        });
      },
      
      onDragEnd: (handler) => {
        this.addListener(document, 'mouseup', handler, {
          type: 'mouseup',
          priority: 'high',
          once: true
        });
        
        this.addListener(document, 'touchend', handler, {
          type: 'touchend',
          priority: 'high',
          once: true
        });
      }
    };
  }
  
  /**
   * 获取事件统计
   */
  getStats(): EventStats & { delegation: ReturnType<EventDelegationManager['getStats']> } {
    return {
      ...this.stats,
      timestamp: performance.now(),
      delegation: this.delegationManager.getStats()
    };
  }
  
  /**
   * 生成性能报告
   */
  generatePerformanceReport(): string {
    const stats = this.getStats();
    
    let report = '事件处理性能报告\n==================\n\n';
    
    report += `总事件数: ${stats.totalEvents}\n`;
    report += `已处理事件: ${stats.processedEvents}\n`;
    report += `丢弃事件: ${stats.droppedEvents}\n`;
    report += `平均处理时间: ${stats.averageProcessingTime.toFixed(2)}ms\n\n`;
    
    report += '事件类型统计:\n';
    for (const [type, count] of stats.eventTypes) {
      const percentage = (count / stats.totalEvents * 100).toFixed(1);
      report += `  ${type}: ${count} (${percentage}%)\n`;
    }
    
    report += '\n委托事件统计:\n';
    report += `容器数: ${stats.delegation.containers}\n`;
    report += `事件类型数: ${stats.delegation.eventTypes}\n`;
    report += `处理器数: ${stats.delegation.handlers}\n`;
    
    return report;
  }
  
  /**
   * 清理所有事件监听器
   */
  cleanup(): void {
    console.log('Cleaning up event manager...');
    
    // 移除所有直接监听器
    for (const [element, elementHandlers] of this.handlers) {
      for (const [eventType, wrapper] of elementHandlers) {
        element.removeEventListener(eventType, wrapper.processedHandler);
      }
    }
    
    this.handlers.clear();
    
    // 清理防抖和节流
    this.debouncer.cancelAll();
    this.throttler.cancelAll();
    
    // 清理委托事件
    // 委托管理器会在页面卸载时自动清理
    
    console.log('Event manager cleanup completed');
  }
}

// 导出单例
export const eventOptimizer = new SmartEventManager();

// 便捷函数
export function addOptimizedListener(
  element: Element,
  eventType: string,
  handler: EventListener,
  config?: EventConfig
): void {
  eventOptimizer.addListener(element, eventType, handler, config);
}

export function removeOptimizedListener(
  element: Element,
  eventType: string,
  handler?: EventListener
): void {
  eventOptimizer.removeListener(element, eventType, handler);
}

export function addDelegatedListener(
  container: Element,
  eventType: string,
  selector: string,
  handler: EventListener,
  config?: EventConfig
): void {
  eventOptimizer.addDelegatedListener(container, eventType, selector, handler, config);
}

export function optimizeDragEvents(element: Element) {
  return eventOptimizer.optimizeDragEvents(element);
}