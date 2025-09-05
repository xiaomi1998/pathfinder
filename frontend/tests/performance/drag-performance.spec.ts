import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  PreciseCoordinateTransform,
  DragCoordinateCalculator 
} from '../../src/utils/coordinate-transform'
import { AdvancedAlignmentEngine } from '../../src/utils/advanced-alignment-engine'
import { PhysicsEngineCore } from '../../src/utils/physics-engine-core'
import { PerformanceOptimizer } from '../../src/utils/performance-optimizer'
import { Vector2D } from '../../src/utils/math-precision'
import { 
  performanceTestData,
  testConfigs 
} from '../fixtures/test-data'
import { 
  PerformanceTestUtils as PerfUtils,
  MemoryTestUtils as MemUtils 
} from '../helpers/test-utils'

describe('Drag System Performance Tests', () => {
  let performanceOptimizer: PerformanceOptimizer
  let coordinateTransform: PreciseCoordinateTransform
  let alignmentEngine: AdvancedAlignmentEngine
  let physicsEngine: PhysicsEngineCore

  beforeEach(() => {
    // Initialize performance monitoring
    performanceOptimizer = PerformanceOptimizer.getInstance()
    performanceOptimizer.startMonitoring()
    
    coordinateTransform = new PreciseCoordinateTransform({
      zoom: 1, panX: 0, panY: 0, rotation: 0,
      devicePixelRatio: 1,
      viewportWidth: 1920, viewportHeight: 1080,
      canvasWidth: 1920, canvasHeight: 1080
    })
    
    alignmentEngine = new AdvancedAlignmentEngine({
      snapThreshold: 8,
      enableSmartGuides: true,
      enableAutoAlignment: true
    })
    
    physicsEngine = new PhysicsEngineCore({
      enablePhysicsOptimization: true,
      enableCollisionDetection: true
    })
  })

  afterEach(() => {
    performanceOptimizer.stopMonitoring()
    alignmentEngine.destroy()
    physicsEngine.destroy()
    vi.clearAllTimers()
  })

  describe('Coordinate Transformation Performance', () => {
    test('should transform coordinates within performance budget', async () => {
      const testPoints = Array.from({ length: 1000 }, () => new Vector2D(
        Math.random() * 1920,
        Math.random() * 1080
      ))
      
      const { avgTime, maxTime } = await PerfUtils.runBenchmark(
        'coordinate transformation',
        () => {
          testPoints.forEach(point => {
            const svgPoint = coordinateTransform.screenToSVG(point)
            const canvasPoint = coordinateTransform.svgToCanvas(svgPoint)
            coordinateTransform.canvasToNode(canvasPoint)
          })
        },
        performanceTestData.renderOperations.multipleNodes.nodeCount / 10
      )
      
      // Performance budget: coordinate transformations should be very fast
      expect(avgTime).toBeLessThan(2) // 2ms average for 1000 transformations
      expect(maxTime).toBeLessThan(10) // 10ms maximum
      
      // Memory usage should be stable
      const memoryUsage = MemUtils.getCurrentMemory()
      expect(memoryUsage.used).toBeLessThan(performanceTestData.memoryThresholds.nodeCreation * 2)
    })

    test('should handle high-frequency transformation updates', async () => {
      performanceOptimizer.startDragAnalysis()
      
      // Simulate 60fps drag updates
      const frameCount = 300 // 5 seconds at 60fps
      const dragPath = Array.from({ length: frameCount }, (_, i) => new Vector2D(
        400 + Math.sin(i * 0.1) * 300,
        300 + Math.cos(i * 0.05) * 200
      ))
      
      let totalFrameTime = 0
      let droppedFrames = 0
      
      for (let i = 0; i < frameCount; i++) {
        const frameStart = performance.now()
        
        // Simulate frame operations
        const svgPoint = coordinateTransform.screenToSVG(dragPath[i])
        coordinateTransform.svgToCanvas(svgPoint)
        
        const frameTime = performance.now() - frameStart
        totalFrameTime += frameTime
        
        performanceOptimizer.recordDragFrameTime(frameTime)
        performanceOptimizer.recordDragPosition(dragPath[i].x, dragPath[i].y)
        
        if (frameTime > 16.67) { // 60fps budget
          droppedFrames++
        }
      }
      
      const analysis = performanceOptimizer.endDragAnalysis()
      const avgFrameTime = totalFrameTime / frameCount
      
      // Performance requirements
      expect(avgFrameTime).toBeLessThan(16.67) // Maintain 60fps
      expect(droppedFrames).toBeLessThan(frameCount * 0.05) // Less than 5% dropped frames
      expect(analysis.avgFrameTime).toBeLessThan(16.67)
    })

    test('should optimize transformations with caching', async () => {
      const staticPoint = new Vector2D(400, 300)
      
      // First run - cold cache
      const { avgTime: coldTime } = await PerfUtils.runBenchmark(
        'cold cache transformation',
        () => coordinateTransform.screenToSVG(staticPoint),
        100
      )
      
      // Second run - warm cache
      const { avgTime: warmTime } = await PerfUtils.runBenchmark(
        'warm cache transformation',
        () => coordinateTransform.screenToSVG(staticPoint),
        100
      )
      
      // Cached operations should be faster or same
      expect(warmTime).toBeLessThanOrEqual(coldTime * 1.1) // Allow 10% variance
    })
  })

  describe('Alignment Engine Performance', () => {
    test('should handle large numbers of alignment targets efficiently', async () => {
      const nodeCount = performanceTestData.renderOperations.largeDataset.nodeCount
      
      // Register many nodes
      const { setupTime } = await PerfUtils.measureAsync(async () => {
        for (let i = 0; i < nodeCount; i++) {
          alignmentEngine.registerNode(`perf-node-${i}`, {
            x: (i % 50) * 20,
            y: Math.floor(i / 50) * 20,
            width: 15,
            height: 15
          })
        }
      })
      
      expect(setupTime).toBeLessThan(performanceTestData.renderOperations.largeDataset.expectedMaxTime)
      
      // Test alignment calculation performance
      const testPosition = { x: 250, y: 250 }
      
      const { avgTime, maxTime } = await PerfUtils.runBenchmark(
        'alignment calculation with many nodes',
        () => {
          alignmentEngine.getAlignmentSuggestions('perf-node-0', testPosition)
        },
        50
      )
      
      // Should maintain sub-frame performance
      expect(avgTime).toBeLessThan(5) // 5ms average
      expect(maxTime).toBeLessThan(16.67) // Within frame budget
    })

    test('should optimize spatial partitioning for alignment', async () => {
      // Create spatially distributed nodes
      const regions = 4
      const nodesPerRegion = 100
      
      for (let region = 0; region < regions; region++) {
        const regionX = (region % 2) * 1000
        const regionY = Math.floor(region / 2) * 600
        
        for (let i = 0; i < nodesPerRegion; i++) {
          alignmentEngine.registerNode(`region-${region}-node-${i}`, {
            x: regionX + (i % 10) * 50,
            y: regionY + Math.floor(i / 10) * 40,
            width: 40,
            height: 30
          })
        }
      }
      
      // Test alignment in different regions
      const regionTests = [
        { x: 100, y: 100 },   // Region 0
        { x: 1100, y: 100 },  // Region 1
        { x: 100, y: 700 },   // Region 2
        { x: 1100, y: 700 }   // Region 3
      ]
      
      for (const testPos of regionTests) {
        const { avgTime } = await PerfUtils.runBenchmark(
          `spatial alignment test ${testPos.x},${testPos.y}`,
          () => {
            alignmentEngine.getAlignmentSuggestions('region-0-node-0', testPos)
          },
          20
        )
        
        // Should be fast due to spatial partitioning
        expect(avgTime).toBeLessThan(8)
      }
    })

    test('should maintain performance during rapid alignment queries', async () => {
      // Setup nodes
      const gridSize = 20
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          alignmentEngine.registerNode(`grid-${x}-${y}`, {
            x: x * 40,
            y: y * 40,
            width: 30,
            height: 30
          })
        }
      }
      
      // Simulate rapid drag with alignment queries
      const rapidQueries = 1000
      const positions = Array.from({ length: rapidQueries }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 800
      }))
      
      const { memoryDelta } = await MemUtils.measureMemoryUsage(async () => {
        const { avgTime, maxTime } = await PerfUtils.runBenchmark(
          'rapid alignment queries',
          () => {
            positions.forEach(pos => {
              alignmentEngine.getAlignmentSuggestions('grid-0-0', pos)
            })
          },
          1
        )
        
        expect(avgTime).toBeLessThan(50) // 50ms for 1000 queries
        expect(maxTime).toBeLessThan(100)
      })
      
      // Memory usage should remain stable
      expect(memoryDelta).toBeLessThan(performanceTestData.memoryThresholds.batchOperations)
    })
  })

  describe('Physics Engine Performance', () => {
    test('should maintain stable physics simulation at 60fps', async () => {
      const bodyCount = 100
      const simulationFrames = 600 // 10 seconds
      
      // Create physics bodies
      for (let i = 0; i < bodyCount; i++) {
        physicsEngine.createBody(`physics-body-${i}`, {
          position: new Vector2D(
            Math.random() * 1000,
            Math.random() * 600
          ),
          velocity: new Vector2D(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
          ),
          mass: 0.5 + Math.random() * 2,
          shape: { 
            type: 'circle', 
            radius: 10 + Math.random() * 15 
          }
        })
      }
      
      physicsEngine.start()
      
      const frameTimes: number[] = []
      let collisionCount = 0
      
      physicsEngine.onCollision(() => {
        collisionCount++
      })
      
      for (let frame = 0; frame < simulationFrames; frame++) {
        const frameStart = performance.now()
        
        physicsEngine.step()
        
        const frameTime = performance.now() - frameStart
        frameTimes.push(frameTime)
        
        // Simulate frame delay for realistic timing
        await new Promise(resolve => setTimeout(resolve, 1))
      }
      
      physicsEngine.stop()
      
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length
      const maxFrameTime = Math.max(...frameTimes)
      const droppedFrames = frameTimes.filter(time => time > 16.67).length
      
      // Performance requirements
      expect(avgFrameTime).toBeLessThan(10) // Average physics step under 10ms
      expect(maxFrameTime).toBeLessThan(20) // Maximum physics step under 20ms
      expect(droppedFrames).toBeLessThan(simulationFrames * 0.02) // Less than 2% dropped frames
      expect(collisionCount).toBeGreaterThan(0) // Physics should be active
    })

    test('should optimize collision detection with spatial hashing', async () => {
      const denseBodyCount = 200
      
      // Create densely packed bodies for collision testing
      for (let i = 0; i < denseBodyCount; i++) {
        physicsEngine.createBody(`dense-body-${i}`, {
          position: new Vector2D(
            400 + (Math.random() - 0.5) * 300, // Clustered around center
            300 + (Math.random() - 0.5) * 200
          ),
          velocity: new Vector2D(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
          ),
          mass: 1,
          shape: { type: 'circle', radius: 8 }
        })
      }
      
      const { avgTime, maxTime } = await PerfUtils.runBenchmark(
        'dense collision detection',
        () => {
          physicsEngine.step()
        },
        100
      )
      
      // With spatial hashing, should handle dense scenarios efficiently
      expect(avgTime).toBeLessThan(15)
      expect(maxTime).toBeLessThan(30)
      
      const spatialPartitioning = physicsEngine.getSpatialPartitioning()
      expect(spatialPartitioning.enabled).toBe(true)
    })

    test('should handle spring systems performance', async () => {
      const springSystemSize = 50
      
      // Create a complex spring network
      for (let i = 0; i < springSystemSize; i++) {
        physicsEngine.createBody(`spring-body-${i}`, {
          position: new Vector2D(
            100 + (i % 10) * 80,
            100 + Math.floor(i / 10) * 80
          ),
          mass: 1,
          shape: { type: 'circle', radius: 10 }
        })
      }
      
      // Connect bodies with springs in a grid pattern
      for (let i = 0; i < springSystemSize; i++) {
        const x = i % 10
        const y = Math.floor(i / 10)
        
        // Connect to right neighbor
        if (x < 9) {
          physicsEngine.createSpring(`spring-h-${i}`, {
            bodyA: `spring-body-${i}`,
            bodyB: `spring-body-${i + 1}`,
            restLength: 60,
            stiffness: 100,
            damping: 10
          })
        }
        
        // Connect to bottom neighbor
        if (y < 4) {
          physicsEngine.createSpring(`spring-v-${i}`, {
            bodyA: `spring-body-${i}`,
            bodyB: `spring-body-${i + 10}`,
            restLength: 60,
            stiffness: 100,
            damping: 10
          })
        }
      }
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'complex spring system',
        () => {
          physicsEngine.step()
        },
        200
      )
      
      expect(avgTime).toBeLessThan(12) // Spring calculations should be optimized
    })
  })

  describe('Memory Management Performance', () => {
    test('should not leak memory during extended drag sessions', async () => {
      const sessionDuration = 5000 // 5 seconds
      const frameCount = Math.floor(sessionDuration / 16.67) // 60fps
      
      // Create test objects
      for (let i = 0; i < 100; i++) {
        alignmentEngine.registerNode(`memory-test-${i}`, {
          x: Math.random() * 1000,
          y: Math.random() * 600,
          width: 50,
          height: 40
        })
      }
      
      const initialMemory = MemUtils.getCurrentMemory()
      
      // Simulate extended drag session
      for (let frame = 0; frame < frameCount; frame++) {
        const dragPosition = {
          x: 500 + Math.sin(frame * 0.1) * 200,
          y: 300 + Math.cos(frame * 0.05) * 150
        }
        
        // Operations that might cause memory leaks
        coordinateTransform.screenToSVG(new Vector2D(dragPosition.x, dragPosition.y))
        alignmentEngine.getAlignmentSuggestions('memory-test-0', dragPosition)
        
        // Periodic cleanup to simulate real usage
        if (frame % 60 === 0) {
          // Force garbage collection opportunity
          performanceOptimizer.optimizeMemory()
        }
      }
      
      const finalMemory = MemUtils.getCurrentMemory()
      const memoryGrowth = finalMemory.used - initialMemory.used
      
      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(performanceTestData.memoryThresholds.longSession)
    })

    test('should efficiently clean up resources', async () => {
      const resourceCount = 500
      
      // Create many resources
      for (let i = 0; i < resourceCount; i++) {
        alignmentEngine.registerNode(`cleanup-test-${i}`, {
          x: Math.random() * 2000,
          y: Math.random() * 1200,
          width: 30,
          height: 30
        })
        
        physicsEngine.createBody(`cleanup-body-${i}`, {
          position: new Vector2D(Math.random() * 2000, Math.random() * 1200),
          mass: 1,
          shape: { type: 'circle', radius: 5 }
        })
      }
      
      const beforeCleanup = MemUtils.getCurrentMemory()
      
      // Measure cleanup time
      const { duration: cleanupTime } = PerfUtils.measure(() => {
        alignmentEngine.destroy()
        physicsEngine.destroy()
      })
      
      expect(cleanupTime).toBeLessThan(100) // Cleanup should be fast
      
      // Memory should be released (though GC timing is not guaranteed)
      const afterCleanup = MemUtils.getCurrentMemory()
      const memoryReleased = beforeCleanup.used - afterCleanup.used
      
      // At minimum, should not continue growing
      expect(memoryReleased).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Regression Tests', () => {
    test('should maintain performance baselines', async () => {
      const baselines = {
        coordinateTransform: 2, // ms for 1000 transforms
        alignmentQuery: 5,      // ms for alignment with 100 nodes
        physicsStep: 10,        // ms for physics step with 50 bodies
        memoryUsage: 20         // MB maximum growth
      }
      
      // Coordinate transformation baseline
      const transformPoints = Array.from({ length: 1000 }, () => 
        new Vector2D(Math.random() * 1920, Math.random() * 1080)
      )
      
      const { avgTime: transformTime } = await PerfUtils.runBenchmark(
        'coordinate transform baseline',
        () => {
          transformPoints.forEach(point => {
            coordinateTransform.screenToSVG(point)
          })
        },
        10
      )
      
      expect(transformTime).toBeLessThan(baselines.coordinateTransform)
      
      // Alignment query baseline
      for (let i = 0; i < 100; i++) {
        alignmentEngine.registerNode(`baseline-${i}`, {
          x: Math.random() * 1000,
          y: Math.random() * 600,
          width: 40,
          height: 30
        })
      }
      
      const { avgTime: alignmentTime } = await PerfUtils.runBenchmark(
        'alignment query baseline',
        () => {
          alignmentEngine.getAlignmentSuggestions('baseline-0', {
            x: Math.random() * 1000,
            y: Math.random() * 600
          })
        },
        20
      )
      
      expect(alignmentTime).toBeLessThan(baselines.alignmentQuery)
      
      // Physics step baseline
      for (let i = 0; i < 50; i++) {
        physicsEngine.createBody(`physics-baseline-${i}`, {
          position: new Vector2D(Math.random() * 1000, Math.random() * 600),
          velocity: new Vector2D((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100),
          mass: 1,
          shape: { type: 'circle', radius: 10 }
        })
      }
      
      physicsEngine.start()
      
      const { avgTime: physicsTime } = await PerfUtils.runBenchmark(
        'physics step baseline',
        () => {
          physicsEngine.step()
        },
        50
      )
      
      physicsEngine.stop()
      
      expect(physicsTime).toBeLessThan(baselines.physicsStep)
      
      // Memory usage baseline
      const currentMemory = MemUtils.getCurrentMemory()
      expect(currentMemory.used).toBeLessThan(baselines.memoryUsage)
    })

    test('should detect performance regressions', async () => {
      // This test would compare against stored performance metrics
      // In a real implementation, you would store baseline metrics
      // and compare current performance against them
      
      const performanceReport = performanceOptimizer.generatePerformanceReport()
      
      expect(performanceReport).toContain('性能优化系统报告')
      expect(performanceReport).toContain('平均FPS')
      expect(performanceReport).toContain('内存使用情况')
      
      // Extract FPS from report (simplified parsing)
      const fpsMatch = performanceReport.match(/平均FPS:\s*(\d+)/)
      if (fpsMatch) {
        const avgFPS = parseInt(fpsMatch[1], 10)
        expect(avgFPS).toBeGreaterThanOrEqual(50) // Should maintain good FPS
      }
    })
  })

  describe('Load Testing', () => {
    test('should handle extreme load scenarios', async () => {
      const extremeNodeCount = testConfigs.stress.nodeCount
      const operationCount = testConfigs.stress.operationCount
      
      // Create extreme number of nodes
      const { setupTime } = await PerfUtils.measureAsync(async () => {
        for (let i = 0; i < extremeNodeCount; i++) {
          alignmentEngine.registerNode(`extreme-${i}`, {
            x: Math.random() * 5000,
            y: Math.random() * 3000,
            width: 20,
            height: 20
          })
        }
      })
      
      expect(setupTime).toBeLessThan(10000) // 10 seconds for extreme setup
      
      // Perform many operations
      const positions = Array.from({ length: operationCount }, () => ({
        x: Math.random() * 5000,
        y: Math.random() * 3000
      }))
      
      const { avgTime, maxTime } = await PerfUtils.runBenchmark(
        'extreme load test',
        () => {
          positions.slice(0, 100).forEach(pos => {
            alignmentEngine.getAlignmentSuggestions('extreme-0', pos)
          })
        },
        operationCount / 100
      )
      
      // Should maintain reasonable performance even under extreme load
      expect(avgTime).toBeLessThan(100)
      expect(maxTime).toBeLessThan(500)
    })
  })
})