import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { PhysicsEngineCore } from './physics-engine-core'
import { Vector2D, PRECISION } from './math-precision'
import { 
  physicsTestData,
  performanceTestData 
} from '../../tests/fixtures/test-data'
import { PerformanceTestUtils as PerfUtils } from '../../tests/helpers/test-utils'

describe('Physics Engine Core', () => {
  let physicsEngine: PhysicsEngineCore
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    physicsEngine = new PhysicsEngineCore({
      gravity: new Vector2D(0, 9.81),
      friction: 0.98,
      restitution: 0.8,
      enableCollisionDetection: true,
      enablePhysicsOptimization: true,
      maxIterations: 10,
      timeStep: 1/60
    })
  })

  afterEach(() => {
    physicsEngine.stop()
    physicsEngine.destroy()
    vi.clearAllTimers()
  })

  describe('Engine Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultEngine = new PhysicsEngineCore()
      const config = defaultEngine.getConfiguration()
      
      expect(config.gravity).toBeInstanceOf(Vector2D)
      expect(config.friction).toBeGreaterThan(0)
      expect(config.friction).toBeLessThanOrEqual(1)
      expect(config.restitution).toBeGreaterThan(0)
      expect(config.restitution).toBeLessThanOrEqual(1)
      expect(config.enableCollisionDetection).toBe(true)
    })

    test('should accept custom configuration', () => {
      const customConfig = {
        gravity: new Vector2D(0, -9.81), // Upward gravity
        friction: 0.95,
        restitution: 0.6,
        enableCollisionDetection: false,
        timeStep: 1/30
      }
      
      const engine = new PhysicsEngineCore(customConfig)
      const config = engine.getConfiguration()
      
      expect(config.gravity.y).toBe(-9.81)
      expect(config.friction).toBe(0.95)
      expect(config.restitution).toBe(0.6)
      expect(config.enableCollisionDetection).toBe(false)
      expect(config.timeStep).toBe(1/30)
    })

    test('should validate configuration parameters', () => {
      const invalidConfig = {
        friction: 1.5, // Invalid - should be <= 1
        restitution: -0.1, // Invalid - should be >= 0
        timeStep: 0, // Invalid - should be > 0
        maxIterations: -5 // Invalid - should be > 0
      }
      
      const engine = new PhysicsEngineCore(invalidConfig)
      const config = engine.getConfiguration()
      
      expect(config.friction).toBeLessThanOrEqual(1)
      expect(config.restitution).toBeGreaterThanOrEqual(0)
      expect(config.timeStep).toBeGreaterThan(0)
      expect(config.maxIterations).toBeGreaterThan(0)
    })
  })

  describe('Physics Body Management', () => {
    test('should create physics bodies', () => {
      const bodyId = 'test-body'
      const bodyConfig = {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(10, 0),
        mass: 1,
        shape: {
          type: 'rectangle' as const,
          width: 50,
          height: 30
        }
      }
      
      physicsEngine.createBody(bodyId, bodyConfig)
      
      const body = physicsEngine.getBody(bodyId)
      expect(body).toBeDefined()
      expect(body.position.x).toBe(100)
      expect(body.position.y).toBe(100)
      expect(body.mass).toBe(1)
    })

    test('should update body properties', () => {
      const bodyId = 'update-body'
      physicsEngine.createBody(bodyId, {
        position: new Vector2D(0, 0),
        mass: 1
      })
      
      physicsEngine.updateBody(bodyId, {
        position: new Vector2D(50, 50),
        velocity: new Vector2D(5, -5),
        mass: 2
      })
      
      const body = physicsEngine.getBody(bodyId)
      expect(body.position.x).toBe(50)
      expect(body.position.y).toBe(50)
      expect(body.velocity.x).toBe(5)
      expect(body.velocity.y).toBe(-5)
      expect(body.mass).toBe(2)
    })

    test('should remove physics bodies', () => {
      const bodyId = 'removable-body'
      physicsEngine.createBody(bodyId, {
        position: new Vector2D(100, 100)
      })
      
      expect(physicsEngine.getBody(bodyId)).toBeDefined()
      
      physicsEngine.removeBody(bodyId)
      
      expect(physicsEngine.getBody(bodyId)).toBeUndefined()
    })

    test('should handle different body shapes', () => {
      const rectangleBody = {
        position: new Vector2D(100, 100),
        shape: {
          type: 'rectangle' as const,
          width: 80,
          height: 60
        }
      }
      
      const circleBody = {
        position: new Vector2D(200, 100),
        shape: {
          type: 'circle' as const,
          radius: 25
        }
      }
      
      physicsEngine.createBody('rectangle', rectangleBody)
      physicsEngine.createBody('circle', circleBody)
      
      const rectBody = physicsEngine.getBody('rectangle')
      const circBody = physicsEngine.getBody('circle')
      
      expect(rectBody.shape.type).toBe('rectangle')
      expect(circBody.shape.type).toBe('circle')
      expect(rectBody.shape.width).toBe(80)
      expect(circBody.shape.radius).toBe(25)
    })
  })

  describe('Physics Simulation', () => {
    beforeEach(() => {
      // Create test bodies
      physicsEngine.createBody('body1', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(50, 0),
        mass: 1,
        shape: { type: 'circle', radius: 20 }
      })
      
      physicsEngine.createBody('body2', {
        position: new Vector2D(300, 100),
        velocity: new Vector2D(-30, 0),
        mass: 1,
        shape: { type: 'circle', radius: 20 }
      })
    })

    test('should start and stop simulation', () => {
      expect(physicsEngine.isRunning()).toBe(false)
      
      physicsEngine.start()
      expect(physicsEngine.isRunning()).toBe(true)
      
      physicsEngine.stop()
      expect(physicsEngine.isRunning()).toBe(false)
    })

    test('should update body positions over time', () => {
      const body = physicsEngine.getBody('body1')
      const initialPosition = body.position.clone()
      
      physicsEngine.start()
      
      // Simulate several frames
      for (let i = 0; i < 10; i++) {
        physicsEngine.step()
      }
      
      const finalPosition = body.position
      expect(finalPosition.x).toBeGreaterThan(initialPosition.x) // Should have moved right
    })

    test('should apply gravity to bodies', () => {
      physicsEngine.updateConfiguration({
        gravity: new Vector2D(0, 100) // Strong downward gravity
      })
      
      const body = physicsEngine.getBody('body1')
      const initialY = body.position.y
      
      // Step simulation
      for (let i = 0; i < 5; i++) {
        physicsEngine.step()
      }
      
      expect(body.position.y).toBeGreaterThan(initialY) // Should have fallen down
      expect(body.velocity.y).toBeGreaterThan(0) // Should have downward velocity
    })

    test('should apply friction', () => {
      physicsEngine.updateConfiguration({
        friction: 0.9, // High friction
        gravity: new Vector2D(0, 0) // No gravity
      })
      
      const body = physicsEngine.getBody('body1')
      const initialSpeed = body.velocity.length()
      
      // Step simulation many times
      for (let i = 0; i < 50; i++) {
        physicsEngine.step()
      }
      
      const finalSpeed = body.velocity.length()
      expect(finalSpeed).toBeLessThan(initialSpeed) // Friction should slow it down
    })

    test('should handle time step variations', () => {
      // Test different time steps
      const timeSteps = [1/120, 1/60, 1/30]
      
      timeSteps.forEach(timeStep => {
        const engine = new PhysicsEngineCore({ timeStep })
        
        engine.createBody('test', {
          position: new Vector2D(0, 0),
          velocity: new Vector2D(100, 0)
        })
        
        const initialPos = engine.getBody('test').position.clone()
        
        engine.step()
        
        const finalPos = engine.getBody('test').position
        const distance = finalPos.subtract(initialPos).length()
        
        expect(distance).toBeCloseTo(100 * timeStep, 3)
        
        engine.destroy()
      })
    })
  })

  describe('Collision Detection', () => {
    beforeEach(() => {
      physicsEngine.updateConfiguration({
        enableCollisionDetection: true,
        gravity: new Vector2D(0, 0) // Disable gravity for cleaner collision tests
      })
    })

    test('should detect circle-circle collisions', () => {
      // Create two circles that will collide
      physicsEngine.createBody('circle1', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(50, 0),
        shape: { type: 'circle', radius: 25 }
      })
      
      physicsEngine.createBody('circle2', {
        position: new Vector2D(200, 100),
        velocity: new Vector2D(-50, 0),
        shape: { type: 'circle', radius: 25 }
      })
      
      const collisionSpy = vi.fn()
      physicsEngine.onCollision(collisionSpy)
      
      // Step simulation until collision occurs
      for (let i = 0; i < 20 && !collisionSpy.mock.calls.length; i++) {
        physicsEngine.step()
      }
      
      expect(collisionSpy).toHaveBeenCalledWith({
        bodyA: 'circle1',
        bodyB: 'circle2',
        point: expect.any(Vector2D),
        normal: expect.any(Vector2D),
        penetration: expect.any(Number)
      })
    })

    test('should detect rectangle-rectangle collisions', () => {
      physicsEngine.createBody('rect1', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(30, 0),
        shape: { type: 'rectangle', width: 50, height: 30 }
      })
      
      physicsEngine.createBody('rect2', {
        position: new Vector2D(180, 100),
        velocity: new Vector2D(-30, 0),
        shape: { type: 'rectangle', width: 50, height: 30 }
      })
      
      const collisionSpy = vi.fn()
      physicsEngine.onCollision(collisionSpy)
      
      // Step simulation until collision
      for (let i = 0; i < 15 && !collisionSpy.mock.calls.length; i++) {
        physicsEngine.step()
      }
      
      expect(collisionSpy).toHaveBeenCalled()
    })

    test('should resolve collisions with proper restitution', () => {
      physicsEngine.updateConfiguration({
        restitution: 0.8 // 80% bounciness
      })
      
      physicsEngine.createBody('bouncer', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(100, 0),
        shape: { type: 'circle', radius: 20 }
      })
      
      physicsEngine.createBody('wall', {
        position: new Vector2D(300, 100),
        velocity: new Vector2D(0, 0),
        mass: Infinity, // Immovable wall
        shape: { type: 'rectangle', width: 10, height: 100 }
      })
      
      const body = physicsEngine.getBody('bouncer')
      
      // Simulate until collision and bounce
      for (let i = 0; i < 30; i++) {
        physicsEngine.step()
      }
      
      // After bouncing off the wall, should have negative x velocity
      expect(body.velocity.x).toBeLessThan(0)
      
      // Velocity magnitude should be reduced by restitution factor
      const finalSpeed = body.velocity.length()
      expect(finalSpeed).toBeLessThan(100) // Some energy lost
      expect(finalSpeed).toBeGreaterThan(60) // But not too much for 0.8 restitution
    })

    test('should use collision test data', () => {
      physicsTestData.collisionData.forEach((testCase, index) => {
        const { objects, expectedCollision } = testCase
        
        objects.forEach((obj, objIndex) => {
          physicsEngine.createBody(`test-${index}-${objIndex}`, {
            position: new Vector2D(obj.x, obj.y),
            velocity: new Vector2D(obj.vx, obj.vy),
            shape: { 
              type: 'rectangle',
              width: obj.width,
              height: obj.height
            }
          })
        })
        
        const collisionSpy = vi.fn()
        physicsEngine.onCollision(collisionSpy)
        
        // Run simulation
        for (let step = 0; step < 20; step++) {
          physicsEngine.step()
        }
        
        if (expectedCollision) {
          expect(collisionSpy).toHaveBeenCalled()
        }
        
        // Clean up for next test
        objects.forEach((_, objIndex) => {
          physicsEngine.removeBody(`test-${index}-${objIndex}`)
        })
      })
    })

    test('should handle collision callbacks errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Collision callback error')
      })
      
      physicsEngine.onCollision(errorCallback)
      
      physicsEngine.createBody('error1', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(50, 0),
        shape: { type: 'circle', radius: 20 }
      })
      
      physicsEngine.createBody('error2', {
        position: new Vector2D(150, 100),
        velocity: new Vector2D(-50, 0),
        shape: { type: 'circle', radius: 20 }
      })
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          physicsEngine.step()
        }
      }).not.toThrow() // Should handle error gracefully
    })
  })

  describe('Spring Animation System', () => {
    test('should create spring connections between bodies', () => {
      physicsEngine.createBody('anchor', {
        position: new Vector2D(100, 100),
        mass: Infinity, // Immovable
        shape: { type: 'circle', radius: 5 }
      })
      
      physicsEngine.createBody('attached', {
        position: new Vector2D(200, 100),
        velocity: new Vector2D(0, 0),
        mass: 1,
        shape: { type: 'circle', radius: 10 }
      })
      
      physicsEngine.createSpring('spring1', {
        bodyA: 'anchor',
        bodyB: 'attached',
        restLength: 50,
        stiffness: 100,
        damping: 10
      })
      
      const spring = physicsEngine.getSpring('spring1')
      expect(spring).toBeDefined()
      expect(spring.restLength).toBe(50)
      expect(spring.stiffness).toBe(100)
    })

    test('should apply spring forces', () => {
      physicsEngine.createBody('anchor', {
        position: new Vector2D(100, 100),
        mass: Infinity,
        shape: { type: 'circle', radius: 5 }
      })
      
      physicsEngine.createBody('attached', {
        position: new Vector2D(300, 100), // Far from anchor
        velocity: new Vector2D(0, 0),
        mass: 1,
        shape: { type: 'circle', radius: 10 }
      })
      
      physicsEngine.createSpring('pull-spring', {
        bodyA: 'anchor',
        bodyB: 'attached',
        restLength: 50,
        stiffness: 200,
        damping: 20
      })
      
      const attached = physicsEngine.getBody('attached')
      const initialDistance = attached.position.distanceTo(new Vector2D(100, 100))
      
      // Run simulation - spring should pull the body toward anchor
      for (let i = 0; i < 30; i++) {
        physicsEngine.step()
      }
      
      const finalDistance = attached.position.distanceTo(new Vector2D(100, 100))
      expect(finalDistance).toBeLessThan(initialDistance)
    })

    test('should use spring animation test data', () => {
      physicsTestData.springAnimations.forEach((config, index) => {
        const springId = `test-spring-${index}`
        
        physicsEngine.createBody(`anchor-${index}`, {
          position: new Vector2D(100, 100),
          mass: Infinity,
          shape: { type: 'circle', radius: 5 }
        })
        
        physicsEngine.createBody(`mass-${index}`, {
          position: new Vector2D(200, 100),
          mass: config.mass,
          shape: { type: 'circle', radius: 10 }
        })
        
        physicsEngine.createSpring(springId, {
          bodyA: `anchor-${index}`,
          bodyB: `mass-${index}`,
          restLength: 50,
          stiffness: config.stiffness,
          damping: config.damping
        })
        
        // Test that spring was created with correct parameters
        const spring = physicsEngine.getSpring(springId)
        expect(spring.stiffness).toBe(config.stiffness)
        expect(spring.damping).toBe(config.damping)
        
        // Run a few steps to ensure stability
        for (let step = 0; step < 5; step++) {
          physicsEngine.step()
        }
        
        const mass = physicsEngine.getBody(`mass-${index}`)
        expect(mass.position.x).toBeCloseTo(200, 0) // Should be close to initial position after a few steps
      })
    })
  })

  describe('Performance Optimization', () => {
    test('should handle many physics bodies efficiently', async () => {
      const bodyCount = 100
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'create many physics bodies',
        () => {
          for (let i = 0; i < bodyCount; i++) {
            physicsEngine.createBody(`perf-body-${i}`, {
              position: new Vector2D(
                Math.random() * 800,
                Math.random() * 600
              ),
              velocity: new Vector2D(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
              ),
              shape: { 
                type: 'circle', 
                radius: 5 + Math.random() * 15
              }
            })
          }
        },
        1
      )
      
      expect(avgTime).toBeLessThan(100)
      
      // Test simulation performance
      const { avgTime: simTime } = await PerfUtils.runBenchmark(
        'physics simulation step',
        () => physicsEngine.step(),
        50
      )
      
      expect(simTime).toBeLessThan(performanceTestData.renderOperations.multipleNodes.expectedMaxTime)
    })

    test('should optimize collision detection for many bodies', async () => {
      // Create a grid of bodies for collision testing
      const gridSize = 10
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          physicsEngine.createBody(`grid-${x}-${y}`, {
            position: new Vector2D(x * 40 + 50, y * 40 + 50),
            velocity: new Vector2D(
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20
            ),
            shape: { type: 'circle', radius: 15 }
          })
        }
      }
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'collision detection with spatial partitioning',
        () => physicsEngine.step(),
        10
      )
      
      // Should be efficient even with many potential collisions
      expect(avgTime).toBeLessThan(20)
    })

    test('should implement spatial partitioning optimization', () => {
      const spatialPartitioning = physicsEngine.getSpatialPartitioning()
      expect(spatialPartitioning).toBeDefined()
      expect(spatialPartitioning.enabled).toBe(true)
      
      // Create bodies in different spatial regions
      physicsEngine.createBody('region1', {
        position: new Vector2D(100, 100),
        shape: { type: 'circle', radius: 20 }
      })
      
      physicsEngine.createBody('region2', {
        position: new Vector2D(500, 400),
        shape: { type: 'circle', radius: 20 }
      })
      
      // Bodies in distant regions should not be checked for collision
      const collisionPairs = spatialPartitioning.getPotentialCollisionPairs()
      const distantPair = collisionPairs.find(pair => 
        (pair[0] === 'region1' && pair[1] === 'region2') ||
        (pair[0] === 'region2' && pair[1] === 'region1')
      )
      
      expect(distantPair).toBeUndefined()
    })
  })

  describe('Physics Configuration Updates', () => {
    test('should update configuration at runtime', () => {
      const initialConfig = physicsEngine.getConfiguration()
      
      physicsEngine.updateConfiguration({
        gravity: new Vector2D(0, -5),
        friction: 0.9,
        restitution: 0.5
      })
      
      const updatedConfig = physicsEngine.getConfiguration()
      
      expect(updatedConfig.gravity.y).toBe(-5)
      expect(updatedConfig.friction).toBe(0.9)
      expect(updatedConfig.restitution).toBe(0.5)
      expect(updatedConfig.timeStep).toBe(initialConfig.timeStep) // Unchanged
    })

    test('should apply configuration changes to existing bodies', () => {
      physicsEngine.createBody('config-test', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(0, -50), // Moving upward
        mass: 1,
        shape: { type: 'circle', radius: 20 }
      })
      
      // Change gravity to pull upward
      physicsEngine.updateConfiguration({
        gravity: new Vector2D(0, -100)
      })
      
      const body = physicsEngine.getBody('config-test')
      
      // Step simulation
      for (let i = 0; i < 10; i++) {
        physicsEngine.step()
      }
      
      // Body should continue moving upward due to upward gravity
      expect(body.velocity.y).toBeLessThan(-50) // More upward velocity
    })

    test('should validate configuration updates', () => {
      const invalidUpdate = {
        friction: 2.0, // Invalid
        restitution: -1.0, // Invalid
        maxIterations: 0 // Invalid
      }
      
      physicsEngine.updateConfiguration(invalidUpdate)
      
      const config = physicsEngine.getConfiguration()
      expect(config.friction).toBeLessThanOrEqual(1)
      expect(config.restitution).toBeGreaterThanOrEqual(0)
      expect(config.maxIterations).toBeGreaterThan(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid body creation', () => {
      expect(() => {
        physicsEngine.createBody('invalid', {
          position: new Vector2D(NaN, NaN),
          mass: -1,
          shape: { type: 'circle', radius: -5 }
        })
      }).not.toThrow()
      
      const body = physicsEngine.getBody('invalid')
      expect(body).toBeUndefined() // Should not create invalid body
    })

    test('should handle operations on non-existent bodies', () => {
      expect(() => {
        physicsEngine.updateBody('non-existent', {
          position: new Vector2D(100, 100)
        })
      }).not.toThrow()
      
      expect(() => {
        physicsEngine.removeBody('non-existent')
      }).not.toThrow()
    })

    test('should handle infinite mass bodies correctly', () => {
      physicsEngine.createBody('immovable', {
        position: new Vector2D(100, 100),
        mass: Infinity,
        shape: { type: 'rectangle', width: 50, height: 50 }
      })
      
      const body = physicsEngine.getBody('immovable')
      const initialPosition = body.position.clone()
      
      // Apply forces and run simulation
      physicsEngine.step()
      
      // Infinite mass body should not move
      expect(body.position.x).toBe(initialPosition.x)
      expect(body.position.y).toBe(initialPosition.y)
    })

    test('should handle zero-sized shapes', () => {
      expect(() => {
        physicsEngine.createBody('zero-circle', {
          position: new Vector2D(100, 100),
          shape: { type: 'circle', radius: 0 }
        })
      }).not.toThrow()
      
      expect(() => {
        physicsEngine.createBody('zero-rect', {
          position: new Vector2D(200, 100),
          shape: { type: 'rectangle', width: 0, height: 0 }
        })
      }).not.toThrow()
    })

    test('should maintain numerical stability', () => {
      // Create a scenario that could lead to numerical instability
      physicsEngine.updateConfiguration({
        timeStep: 1/1000, // Very small time step
        maxIterations: 1000
      })
      
      physicsEngine.createBody('stability-test', {
        position: new Vector2D(100, 100),
        velocity: new Vector2D(1e6, 1e6), // Very high velocity
        mass: 1e-6, // Very small mass
        shape: { type: 'circle', radius: 1e-3 } // Very small size
      })
      
      const body = physicsEngine.getBody('stability-test')
      
      // Run many steps
      for (let i = 0; i < 100; i++) {
        physicsEngine.step()
      }
      
      // Values should remain finite
      expect(isFinite(body.position.x)).toBe(true)
      expect(isFinite(body.position.y)).toBe(true)
      expect(isFinite(body.velocity.x)).toBe(true)
      expect(isFinite(body.velocity.y)).toBe(true)
    })
  })

  describe('Memory Management', () => {
    test('should clean up resources on destroy', () => {
      // Create many bodies and springs
      for (let i = 0; i < 50; i++) {
        physicsEngine.createBody(`cleanup-${i}`, {
          position: new Vector2D(i * 10, 100),
          shape: { type: 'circle', radius: 5 }
        })
      }
      
      for (let i = 0; i < 25; i++) {
        physicsEngine.createSpring(`cleanup-spring-${i}`, {
          bodyA: `cleanup-${i * 2}`,
          bodyB: `cleanup-${i * 2 + 1}`,
          restLength: 20,
          stiffness: 100,
          damping: 10
        })
      }
      
      expect(physicsEngine.getBodyCount()).toBe(50)
      expect(physicsEngine.getSpringCount()).toBe(25)
      
      physicsEngine.destroy()
      
      expect(physicsEngine.getBodyCount()).toBe(0)
      expect(physicsEngine.getSpringCount()).toBe(0)
    })

    test('should stop simulation when destroyed', () => {
      physicsEngine.start()
      expect(physicsEngine.isRunning()).toBe(true)
      
      physicsEngine.destroy()
      expect(physicsEngine.isRunning()).toBe(false)
    })

    test('should clean up event listeners', () => {
      const collisionSpy = vi.fn()
      const simulationSpy = vi.fn()
      
      physicsEngine.onCollision(collisionSpy)
      physicsEngine.onSimulationStep(simulationSpy)
      
      physicsEngine.destroy()
      
      // Create a scenario that would trigger events
      physicsEngine.step() // Should not call listeners after destroy
      
      expect(collisionSpy).not.toHaveBeenCalled()
      expect(simulationSpy).not.toHaveBeenCalled()
    })
  })
})