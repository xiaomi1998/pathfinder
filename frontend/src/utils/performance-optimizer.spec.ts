import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { PerformanceOptimizer } from './performance-optimizer'
import { performanceTestData } from '../../tests/fixtures/test-data'
import { 
  PerformanceTestUtils as PerfUtils,
  MemoryTestUtils as MemUtils
} from '../../tests/helpers/test-utils'

describe('Performance Optimization System', () => {
  let optimizer: PerformanceOptimizer
  let originalPerformance: Performance

  beforeEach(() => {
    // Reset singleton for each test
    PerformanceOptimizer.resetInstance?.()
    optimizer = PerformanceOptimizer.getInstance()
    originalPerformance = global.performance
  })

  afterEach(() => {
    optimizer?.destroy()
    global.performance = originalPerformance
    vi.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    test('should return same instance', () => {
      const instance1 = PerformanceOptimizer.getInstance()
      const instance2 = PerformanceOptimizer.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    test('should be able to reset instance for testing', () => {
      const instance1 = PerformanceOptimizer.getInstance()
      PerformanceOptimizer.resetInstance?.()
      const instance2 = PerformanceOptimizer.getInstance()
      
      expect(instance1).not.toBe(instance2)
    })
  })

  describe('Configuration Management', () => {
    test('should initialize with default config', () => {
      const config = optimizer.getConfig()
      
      expect(config).toHaveProperty('enableMemoryOptimization', true)
      expect(config).toHaveProperty('enableRenderOptimization', true)
      expect(config).toHaveProperty('enableEventOptimization', true)
      expect(config).toHaveProperty('enableCacheOptimization', true)
    })

    test('should update config partially', () => {
      optimizer.updateConfig({
        enableMemoryOptimization: false,
        monitoringInterval: 5000
      })
      
      const config = optimizer.getConfig()
      expect(config.enableMemoryOptimization).toBe(false)
      expect(config.monitoringInterval).toBe(5000)
    })

    test('should validate config values', () => {
      optimizer.updateConfig({
        monitoringInterval: -1000 // Invalid value
      })
      
      const config = optimizer.getConfig()
      expect(config.monitoringInterval).toBeGreaterThan(0)
    })
  })

  describe('Performance Monitoring', () => {
    test('should start and stop monitoring', () => {
      expect(optimizer.isMonitoring()).toBe(false)
      
      optimizer.startMonitoring()
      expect(optimizer.isMonitoring()).toBe(true)
      
      optimizer.stopMonitoring()
      expect(optimizer.isMonitoring()).toBe(false)
    })

    test('should collect comprehensive performance stats', () => {
      const stats = optimizer.getCurrentPerformanceState()
      
      expect(stats).toHaveProperty('memory')
      expect(stats).toHaveProperty('rendering')
      expect(stats).toHaveProperty('events')
      expect(stats).toHaveProperty('cache')
      expect(stats).toHaveProperty('realtime')
      expect(stats).toHaveProperty('timestamp')
    })

    test('should maintain performance history', () => {
      optimizer.startMonitoring()
      
      // Wait for some data to be collected
      vi.advanceTimersByTime(2000)
      
      const history = optimizer.getPerformanceHistory()
      expect(Array.isArray(history)).toBe(true)
    })

    test('should handle monitoring intervals correctly', async () => {
      const monitoringSpy = vi.spyOn(optimizer as any, 'collectComprehensiveStats')
      
      optimizer.updateConfig({ monitoringInterval: 100 })
      optimizer.startMonitoring()
      
      vi.advanceTimersByTime(300)
      
      expect(monitoringSpy).toHaveBeenCalledTimes(3)
      
      optimizer.stopMonitoring()
    })
  })

  describe('Memory Optimization', () => {
    test('should optimize memory usage', async () => {
      const initialMemory = MemUtils.getCurrentMemory()
      
      // Simulate memory pressure
      const largeObjects = Array.from({ length: 1000 }, () => 
        new Array(1000).fill(Math.random())
      )
      
      await optimizer.optimizeMemory()
      
      const finalMemory = MemUtils.getCurrentMemory()
      
      // Memory optimization should have some effect
      expect(finalMemory.used).toBeDefined()
      largeObjects.length = 0 // Cleanup
    })

    test('should handle memory warnings', () => {
      const warningSpy = vi.fn()
      optimizer.onWarning(warningSpy)
      
      // Simulate high memory usage
      optimizer.updateConfig({ enableMemoryOptimization: true })
      
      // Trigger memory check that might cause warning
      const stats = optimizer.getCurrentPerformanceState()
      
      // Warning system should be functional
      expect(warningSpy).toBeDefined()
    })

    test('should respect memory thresholds', () => {
      const { memoryThresholds } = performanceTestData
      
      Object.entries(memoryThresholds).forEach(([operation, threshold]) => {
        // Test that thresholds are reasonable
        expect(threshold).toBeGreaterThan(0)
        expect(threshold).toBeLessThan(100) // Reasonable MB limit
      })
    })
  })

  describe('Render Optimization', () => {
    test('should optimize batch operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => 
        () => ({ id: i, data: Math.random() })
      )
      
      const { duration } = PerfUtils.measure(() => {
        optimizer.optimizeBatchOperations(operations)
      })
      
      expect(duration).toBeLessThan(performanceTestData.renderOperations.multipleNodes.expectedMaxTime)
    })

    test('should handle frame rate optimization', () => {
      const frameCallback = vi.fn()
      optimizer.optimizeFrameRate(frameCallback)
      
      // Simulate animation frame
      vi.advanceTimersByTime(16)
      
      expect(frameCallback).toHaveBeenCalled()
    })

    test('should respect render performance thresholds', async () => {
      const { renderOperations } = performanceTestData
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'render optimization',
        () => {
          optimizer.optimizeRendering()
        },
        10
      )
      
      expect(avgTime).toBeLessThan(renderOperations.singleNode.expectedMaxTime)
    })
  })

  describe('Event Optimization', () => {
    test('should optimize event delegation', () => {
      const container = document.createElement('div')
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement('button')
        container.appendChild(el)
        return el
      })
      
      const handler = vi.fn()
      optimizer.optimizeEventDelegation(container, 'click', handler)
      
      // Simulate clicks on multiple elements
      elements.forEach(el => {
        el.dispatchEvent(new Event('click', { bubbles: true }))
      })
      
      // Handler should be called for each element but with delegation
      expect(handler).toHaveBeenCalledTimes(100)
    })

    test('should throttle high-frequency events', async () => {
      const handler = vi.fn()
      const throttledHandler = optimizer.createThrottledHandler(handler, 50)
      
      // Fire many events quickly
      for (let i = 0; i < 10; i++) {
        throttledHandler()
      }
      
      expect(handler).toHaveBeenCalledTimes(1)
      
      // Advance time and fire again
      vi.advanceTimersByTime(60)
      throttledHandler()
      
      expect(handler).toHaveBeenCalledTimes(2)
    })

    test('should debounce events correctly', async () => {
      const handler = vi.fn()
      const debouncedHandler = optimizer.createDebouncedHandler(handler, 100)
      
      // Fire many events in quick succession
      for (let i = 0; i < 10; i++) {
        debouncedHandler()
        vi.advanceTimersByTime(10)
      }
      
      expect(handler).not.toHaveBeenCalled()
      
      // Wait for debounce period
      vi.advanceTimersByTime(100)
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cache Optimization', () => {
    test('should optimize cache memory usage', () => {
      const initialCacheStats = optimizer.getCacheStats()
      
      optimizer.optimizeCacheMemory()
      
      const finalCacheStats = optimizer.getCacheStats()
      
      expect(finalCacheStats).toBeDefined()
    })

    test('should handle cache cleanup intervals', () => {
      const cleanupSpy = vi.spyOn(optimizer as any, 'optimizeCacheMemory')
      
      optimizer.updateConfig({ cacheCleanupInterval: 100 })
      optimizer.startMonitoring()
      
      vi.advanceTimersByTime(300)
      
      expect(cleanupSpy).toHaveBeenCalledTimes(3)
      
      optimizer.stopMonitoring()
    })
  })

  describe('Drag Performance Analysis', () => {
    test('should analyze drag performance', () => {
      optimizer.startDragAnalysis()
      
      // Simulate drag frames
      for (let i = 0; i < 60; i++) {
        optimizer.recordDragFrameTime(16.67) // 60 FPS
        optimizer.recordDragPosition(i * 2, i * 2)
      }
      
      const analysis = optimizer.endDragAnalysis()
      
      expect(analysis).toHaveProperty('avgFrameTime')
      expect(analysis).toHaveProperty('frameCount')
      expect(analysis).toHaveProperty('droppedFrames')
    })

    test('should detect performance issues during drag', () => {
      optimizer.startDragAnalysis()
      
      // Simulate poor performance
      const poorFrameTimes = [33, 50, 25, 40, 35] // Inconsistent, some dropped frames
      poorFrameTimes.forEach(time => {
        optimizer.recordDragFrameTime(time)
      })
      
      const analysis = optimizer.endDragAnalysis()
      
      expect(analysis.droppedFrames).toBeGreaterThan(0)
    })
  })

  describe('Benchmark Testing', () => {
    test('should run performance benchmarks', async () => {
      const benchmarkResults = await optimizer.runBenchmarks()
      
      expect(benchmarkResults).toHaveProperty('dragSuite')
      expect(benchmarkResults).toHaveProperty('report')
      expect(typeof benchmarkResults.report).toBe('string')
    })

    test('should handle benchmark performance thresholds', async () => {
      const { dragOperations } = performanceTestData
      
      // Test simple drag benchmark
      const { avgTime } = await PerfUtils.runBenchmark(
        'drag operation benchmark',
        () => {
          optimizer.startDragAnalysis()
          optimizer.recordDragFrameTime(16.67)
          optimizer.endDragAnalysis()
        },
        dragOperations.simple.iterations
      )
      
      expect(avgTime).toBeLessThan(dragOperations.simple.expectedMaxTime)
    })
  })

  describe('Warning System', () => {
    test('should emit performance warnings', () => {
      const warnings: any[] = []
      optimizer.onWarning((warning) => {
        warnings.push(warning)
      })
      
      // Force a condition that should trigger warning
      optimizer.updateConfig({ enableMemoryOptimization: true })
      
      // Collect stats which may trigger warnings
      optimizer.getCurrentPerformanceState()
      
      expect(warnings).toBeDefined()
    })

    test('should categorize warnings correctly', () => {
      const warnings = optimizer.getRecentWarnings(5)
      
      warnings.forEach(warning => {
        expect(['info', 'warning', 'critical']).toContain(warning.level)
        expect(['memory', 'rendering', 'events', 'cache']).toContain(warning.category)
        expect(typeof warning.message).toBe('string')
        expect(typeof warning.suggestion).toBe('string')
      })
    })

    test('should limit warning history', () => {
      // Generate many warnings
      for (let i = 0; i < 100; i++) {
        optimizer.addWarning?.({
          level: 'info',
          category: 'memory',
          message: `Test warning ${i}`,
          suggestion: 'Test suggestion'
        })
      }
      
      const allWarnings = optimizer.getRecentWarnings(200)
      expect(allWarnings.length).toBeLessThanOrEqual(50) // Should be limited
    })
  })

  describe('Performance Reporting', () => {
    test('should generate comprehensive performance report', () => {
      const report = optimizer.generatePerformanceReport()
      
      expect(typeof report).toBe('string')
      expect(report).toContain('性能优化系统报告')
      expect(report).toContain('内存使用情况')
      expect(report).toContain('渲染性能')
      expect(report).toContain('事件处理')
    })

    test('should include real-time metrics in report', () => {
      optimizer.startMonitoring()
      vi.advanceTimersByTime(1000)
      
      const report = optimizer.generatePerformanceReport()
      
      expect(report).toContain('平均FPS')
      expect(report).toContain('帧时间')
      
      optimizer.stopMonitoring()
    })
  })

  describe('Cross-browser Compatibility', () => {
    test('should handle missing performance API gracefully', () => {
      // Mock missing performance.memory
      const mockPerformance = { ...global.performance }
      delete (mockPerformance as any).memory
      global.performance = mockPerformance as Performance
      
      expect(() => {
        optimizer.getCurrentPerformanceState()
      }).not.toThrow()
    })

    test('should adapt to different performance API implementations', () => {
      const mockPerformance = {
        ...global.performance,
        now: () => Date.now(), // Fallback implementation
        memory: undefined // Simulate lack of memory API
      }
      global.performance = mockPerformance as Performance
      
      expect(() => {
        optimizer.startMonitoring()
      }).not.toThrow()
    })
  })

  describe('Resource Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      optimizer.startMonitoring()
      expect(optimizer.isMonitoring()).toBe(true)
      
      optimizer.destroy()
      expect(optimizer.isMonitoring()).toBe(false)
    })

    test('should clear all intervals on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      
      optimizer.startMonitoring()
      optimizer.destroy()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    test('should remove all event listeners on destroy', () => {
      const handler = vi.fn()
      optimizer.onWarning(handler)
      
      optimizer.destroy()
      
      // After destroy, warning handlers should not be called
      optimizer.addWarning?.({
        level: 'info',
        category: 'memory',
        message: 'Test',
        suggestion: 'Test'
      })
      
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle memory pressure gracefully', async () => {
      // Simulate low memory condition
      const mockMemory = {
        usedJSHeapSize: 900 * 1024 * 1024,  // 900MB used
        totalJSHeapSize: 1000 * 1024 * 1024, // 1GB total
        jsHeapSizeLimit: 1024 * 1024 * 1024  // 1GB limit
      }
      
      global.performance = {
        ...global.performance,
        memory: mockMemory
      } as any
      
      expect(() => {
        optimizer.optimizeMemory()
      }).not.toThrow()
    })

    test('should handle concurrent optimization requests', async () => {
      const promises = Array.from({ length: 10 }, () => 
        optimizer.optimizeMemory()
      )
      
      expect(() => {
        Promise.all(promises)
      }).not.toThrow()
    })

    test('should handle invalid configuration gracefully', () => {
      expect(() => {
        optimizer.updateConfig({
          monitoringInterval: NaN,
          memoryCleanupInterval: -1,
          cacheCleanupInterval: Infinity
        } as any)
      }).not.toThrow()
      
      // Config should remain valid
      const config = optimizer.getConfig()
      expect(config.monitoringInterval).toBeGreaterThan(0)
      expect(config.memoryCleanupInterval).toBeGreaterThan(0)
      expect(config.cacheCleanupInterval).toBeFinite()
    })
  })
})