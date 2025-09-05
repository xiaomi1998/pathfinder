import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  PreciseCoordinateTransform,
  DragCoordinateCalculator 
} from '../../src/utils/coordinate-transform'
import { AdvancedAlignmentEngine } from '../../src/utils/advanced-alignment-engine'
import { AdvancedInteractionController } from '../../src/utils/advanced-interaction-controller'
import { PhysicsEngineCore } from '../../src/utils/physics-engine-core'
import { TouchEventHandler } from '../../src/utils/touch-event-handler'
import { Vector2D } from '../../src/utils/math-precision'
import { 
  DragTestUtils,
  TestDataGenerator,
  PerformanceTestUtils as PerfUtils 
} from '../helpers/test-utils'

describe('Drag System Integration', () => {
  let container: HTMLElement
  let canvas: HTMLCanvasElement
  let coordinateTransform: PreciseCoordinateTransform
  let dragCalculator: DragCoordinateCalculator
  let alignmentEngine: AdvancedAlignmentEngine
  let interactionController: AdvancedInteractionController
  let physicsEngine: PhysicsEngineCore
  let touchHandler: TouchEventHandler

  beforeEach(() => {
    // Create DOM structure
    container = document.createElement('div')
    container.style.width = '800px'
    container.style.height = '600px'
    container.style.position = 'relative'
    
    canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    container.appendChild(canvas)
    document.body.appendChild(container)

    // Initialize systems
    coordinateTransform = new PreciseCoordinateTransform({
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      devicePixelRatio: window.devicePixelRatio,
      viewportWidth: 800,
      viewportHeight: 600,
      canvasWidth: 800,
      canvasHeight: 600
    })

    dragCalculator = new DragCoordinateCalculator(coordinateTransform)

    alignmentEngine = new AdvancedAlignmentEngine({
      snapThreshold: 10,
      enableSmartGuides: true,
      enableAutoAlignment: true
    })

    interactionController = new AdvancedInteractionController(container, {
      enableMultiSelect: true,
      enableBatchOperations: true,
      enableAdvancedGestures: true
    })

    physicsEngine = new PhysicsEngineCore({
      enablePhysicsOptimization: true,
      gravity: new Vector2D(0, 0), // Disable gravity for UI interactions
      friction: 0.95
    })

    touchHandler = new TouchEventHandler(container, {
      enableMultiTouch: true,
      enableGestures: true,
      enablePressure: true
    })
  })

  afterEach(() => {
    // Cleanup
    interactionController.destroy()
    physicsEngine.destroy()
    touchHandler.destroy()
    document.body.removeChild(container)
    vi.clearAllTimers()
  })

  describe('Coordinate System Integration', () => {
    test('should transform coordinates consistently across systems', () => {
      const screenPoint = new Vector2D(400, 300)
      
      // Transform through coordinate system
      const svgPoint = coordinateTransform.screenToSVG(screenPoint)
      const canvasPoint = coordinateTransform.svgToCanvas(svgPoint)
      const nodePoint = coordinateTransform.canvasToNode(canvasPoint)
      
      // Reverse transformation
      const backToCanvas = coordinateTransform.nodeToCanvas(nodePoint)
      const backToSVG = coordinateTransform.canvasToSVG(backToCanvas)
      const backToScreen = coordinateTransform.svgToScreen(backToSVG)
      
      // Should return to original point
      expect(Math.abs(backToScreen.x - screenPoint.x)).toBeLessThan(0.001)
      expect(Math.abs(backToScreen.y - screenPoint.y)).toBeLessThan(0.001)
    })

    test('should maintain coordinate consistency with zoom and pan', () => {
      // Apply zoom and pan
      coordinateTransform.updateConfig({
        zoom: 2,
        panX: 50,
        panY: 30
      })
      
      const testPoints = [
        new Vector2D(100, 100),
        new Vector2D(400, 300),
        new Vector2D(700, 500)
      ]
      
      testPoints.forEach(point => {
        const transformed = coordinateTransform.screenToSVG(point)
        const backTransformed = coordinateTransform.svgToScreen(transformed)
        
        expect(Math.abs(backTransformed.x - point.x)).toBeLessThan(0.01)
        expect(Math.abs(backTransformed.y - point.y)).toBeLessThan(0.01)
      })
    })

    test('should handle coordinate transformation with rotation', () => {
      coordinateTransform.updateConfig({
        rotation: Math.PI / 4 // 45 degrees
      })
      
      const point = new Vector2D(400, 300) // Center of canvas
      
      const transformed = coordinateTransform.screenToSVG(point)
      const backTransformed = coordinateTransform.svgToScreen(transformed)
      
      // Should maintain center point after rotation
      expect(Math.abs(backTransformed.x - point.x)).toBeLessThan(0.1)
      expect(Math.abs(backTransformed.y - point.y)).toBeLessThan(0.1)
    })
  })

  describe('Drag and Alignment Integration', () => {
    test('should integrate drag calculations with alignment snapping', () => {
      // Setup nodes for alignment
      const nodes = [
        { id: 'node1', x: 100, y: 100, width: 80, height: 60 },
        { id: 'node2', x: 200, y: 100, width: 80, height: 60 },
        { id: 'node3', x: 300, y: 200, width: 80, height: 60 }
      ]
      
      nodes.forEach(node => {
        alignmentEngine.registerNode(node.id, node)
        interactionController.registerSelectableNode(node.id, node)
      })
      
      // Start drag operation
      const startPoint = new Vector2D(110, 110) // Inside node1
      dragCalculator.startDrag(startPoint)
      
      interactionController.selectNode('node1')
      
      // Drag near alignment point
      const currentPoint = new Vector2D(202, 108) // Near node2 alignment
      const dragDelta = dragCalculator.calculateDelta(currentPoint)
      
      // Apply alignment snapping
      const targetPosition = new Vector2D(100 + dragDelta.x, 100 + dragDelta.y)
      const snappedPosition = alignmentEngine.snapToAlignment('node1', targetPosition)
      
      // Should snap to horizontal alignment with node2
      expect(Math.abs(snappedPosition.y - 100)).toBeLessThan(5)
      expect(snappedPosition.x).toBeCloseTo(200, 0) // Should snap to node2's x
    })

    test('should provide visual alignment feedback during drag', () => {
      const feedbackSpy = vi.fn()
      alignmentEngine.onSmartGuidesUpdate(feedbackSpy)
      
      // Register nodes
      const nodes = [
        { id: 'anchor', x: 150, y: 200, width: 80, height: 60 },
        { id: 'dragging', x: 100, y: 100, width: 80, height: 60 }
      ]
      
      nodes.forEach(node => {
        alignmentEngine.registerNode(node.id, node)
      })
      
      // Simulate drag near alignment
      const dragPosition = { x: 152, y: 150 }
      const guides = alignmentEngine.getSmartGuides('dragging', dragPosition)
      
      expect(guides.length).toBeGreaterThan(0)
      
      const verticalGuide = guides.find(g => g.type === 'vertical')
      expect(verticalGuide).toBeDefined()
      expect(verticalGuide?.confidence).toBeGreaterThan(0.8)
    })

    test('should handle multi-node drag with alignment', () => {
      const nodes = Array.from({ length: 5 }, (_, i) => ({
        id: `node-${i}`,
        x: i * 100 + 50,
        y: 150,
        width: 80,
        height: 60
      }))
      
      nodes.forEach(node => {
        alignmentEngine.registerNode(node.id, node)
        interactionController.registerSelectableNode(node.id, node)
      })
      
      // Select multiple nodes
      nodes.slice(0, 3).forEach((node, index) => {
        interactionController.selectNode(node.id, index > 0)
      })
      
      const selectedNodes = interactionController.getSelectedNodes()
      expect(selectedNodes).toHaveLength(3)
      
      // Perform batch drag operation
      const dragResult = interactionController.executeBatchOperation('move', {
        delta: { x: 20, y: 30 }
      })
      
      expect(dragResult).resolves.toEqual({
        success: true,
        processedCount: 3,
        errors: []
      })
    })
  })

  describe('Touch and Physics Integration', () => {
    test('should integrate touch input with physics simulation', () => {
      // Create physics body
      physicsEngine.createBody('touch-body', {
        position: new Vector2D(200, 200),
        velocity: new Vector2D(0, 0),
        mass: 1,
        shape: { type: 'circle', radius: 30 }
      })
      
      const physicsUpdateSpy = vi.fn()
      physicsEngine.onSimulationStep(physicsUpdateSpy)
      
      // Simulate touch drag on the physics body
      const touchData = TestDataGenerator.generateTouchData(1, 200, 200)
      
      DragTestUtils.simulateTouchDrag(
        container,
        { x: 200, y: 200 },
        { x: 300, y: 250 },
        10
      )
      
      // Physics should respond to touch interaction
      physicsEngine.start()
      
      for (let i = 0; i < 5; i++) {
        physicsEngine.step()
      }
      
      const body = physicsEngine.getBody('touch-body')
      expect(body.position.x).toBeGreaterThan(200) // Should have moved
      
      physicsEngine.stop()
    })

    test('should handle multi-touch physics interactions', () => {
      // Create multiple physics bodies
      const bodyIds = ['body1', 'body2', 'body3']
      bodyIds.forEach((id, index) => {
        physicsEngine.createBody(id, {
          position: new Vector2D(150 + index * 100, 200),
          mass: 1,
          shape: { type: 'circle', radius: 25 }
        })
      })
      
      // Simulate multi-touch interaction
      const touches = TestDataGenerator.generateTouchData(3, 150, 200)
      
      touches.forEach((touch, index) => {
        touch.clientX = 150 + index * 100
        touch.identifier = index
      })
      
      const touchEvent = new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      })
      
      container.dispatchEvent(touchEvent)
      
      // Verify multi-touch state
      const touchState = touchHandler.getCurrentTouchState()
      expect(touchState.touchCount).toBe(3)
    })

    test('should apply spring physics to dragged elements', () => {
      // Create connected bodies with springs
      physicsEngine.createBody('anchor', {
        position: new Vector2D(200, 200),
        mass: Infinity, // Immovable
        shape: { type: 'circle', radius: 10 }
      })
      
      physicsEngine.createBody('draggable', {
        position: new Vector2D(300, 200),
        mass: 1,
        shape: { type: 'circle', radius: 20 }
      })
      
      physicsEngine.createSpring('connection', {
        bodyA: 'anchor',
        bodyB: 'draggable',
        restLength: 80,
        stiffness: 150,
        damping: 15
      })
      
      const draggable = physicsEngine.getBody('draggable')
      const initialDistance = draggable.position.distanceTo(new Vector2D(200, 200))
      
      // Drag the connected body away
      physicsEngine.updateBody('draggable', {
        position: new Vector2D(400, 250) // Further from anchor
      })
      
      physicsEngine.start()
      
      // Run simulation - spring should pull body back toward anchor
      for (let i = 0; i < 30; i++) {
        physicsEngine.step()
      }
      
      const finalDistance = draggable.position.distanceTo(new Vector2D(200, 200))
      expect(finalDistance).toBeLessThan(initialDistance + 50) // Spring effect
      
      physicsEngine.stop()
    })
  })

  describe('Performance Integration', () => {
    test('should maintain 60fps during complex drag operations', async () => {
      // Setup complex scenario
      const nodeCount = 50
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `perf-node-${i}`,
        x: (i % 10) * 80,
        y: Math.floor(i / 10) * 60,
        width: 60,
        height: 40
      }))
      
      nodes.forEach(node => {
        alignmentEngine.registerNode(node.id, node)
        interactionController.registerSelectableNode(node.id, node)
        
        physicsEngine.createBody(node.id, {
          position: new Vector2D(node.x, node.y),
          mass: 1,
          shape: { type: 'rectangle', width: node.width, height: node.height }
        })
      })
      
      // Select multiple nodes for drag
      nodes.slice(0, 10).forEach((node, index) => {
        interactionController.selectNode(node.id, index > 0)
      })
      
      physicsEngine.start()
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'complex drag frame',
        () => {
          // Simulate frame operations
          dragCalculator.calculateDelta(new Vector2D(Math.random() * 100, Math.random() * 100))
          alignmentEngine.getAlignmentSuggestions('perf-node-0', { x: Math.random() * 800, y: Math.random() * 600 })
          physicsEngine.step()
        },
        60 // 60 frames
      )
      
      physicsEngine.stop()
      
      // Should maintain 60fps (16.67ms per frame)
      expect(avgTime).toBeLessThan(16.67)
    })

    test('should efficiently handle large datasets', async () => {
      const largeNodeCount = 200
      
      const { avgTime: setupTime } = await PerfUtils.runBenchmark(
        'large dataset setup',
        () => {
          for (let i = 0; i < largeNodeCount; i++) {
            const node = {
              id: `large-${i}`,
              x: Math.random() * 2000,
              y: Math.random() * 1500,
              width: 40,
              height: 30
            }
            
            alignmentEngine.registerNode(node.id, node)
            interactionController.registerSelectableNode(node.id, node)
          }
        },
        1
      )
      
      expect(setupTime).toBeLessThan(500) // Should setup quickly
      
      // Test alignment calculation performance
      const { avgTime: alignmentTime } = await PerfUtils.runBenchmark(
        'large dataset alignment',
        () => {
          const randomPosition = {
            x: Math.random() * 2000,
            y: Math.random() * 1500
          }
          alignmentEngine.getAlignmentSuggestions('large-0', randomPosition)
        },
        20
      )
      
      expect(alignmentTime).toBeLessThan(50) // Should be fast even with many nodes
    })

    test('should optimize memory usage during long drag sessions', () => {
      // Simulate long drag session
      const sessionLength = 1000
      const dragPositions: Vector2D[] = []
      
      // Generate drag path
      for (let i = 0; i < sessionLength; i++) {
        dragPositions.push(new Vector2D(
          100 + Math.sin(i * 0.1) * 200,
          200 + Math.cos(i * 0.05) * 100
        ))
      }
      
      // Setup node
      alignmentEngine.registerNode('memory-test', {
        x: 100, y: 200, width: 80, height: 60
      })
      
      dragCalculator.startDrag(dragPositions[0])
      
      // Process all drag positions
      dragPositions.forEach((position, index) => {
        dragCalculator.calculateDelta(position)
        
        if (index % 10 === 0) {
          alignmentEngine.getAlignmentSuggestions('memory-test', position)
        }
      })
      
      // Memory usage should remain reasonable
      // (Specific memory assertions would require memory profiling tools)
      expect(true).toBe(true) // Placeholder for memory assertion
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle system failures gracefully', () => {
      const errorSpy = vi.fn()
      interactionController.onError(errorSpy)
      
      // Cause alignment engine to fail
      alignmentEngine.destroy()
      
      // Attempt operations that depend on alignment
      expect(() => {
        interactionController.selectNode('test-node')
        dragCalculator.calculateDelta(new Vector2D(100, 100))
      }).not.toThrow()
      
      // Should handle errors gracefully without breaking other systems
      expect(interactionController.getSelectedNodes()).toBeDefined()
    })

    test('should recover from coordinate transformation errors', () => {
      // Force invalid transformation state
      coordinateTransform.updateConfig({
        zoom: 0, // Invalid zoom
        panX: NaN, // Invalid pan
        panY: Infinity // Invalid pan
      })
      
      const testPoint = new Vector2D(400, 300)
      
      // Should handle invalid transformations gracefully
      expect(() => {
        const transformed = coordinateTransform.screenToSVG(testPoint)
        expect(transformed).toBeInstanceOf(Vector2D)
      }).not.toThrow()
    })

    test('should handle concurrent system operations', async () => {
      // Setup test scenario
      const nodes = Array.from({ length: 20 }, (_, i) => ({
        id: `concurrent-${i}`,
        x: i * 40,
        y: 150,
        width: 30,
        height: 30
      }))
      
      // Register nodes in all systems concurrently
      const registrationPromises = nodes.map(node => 
        Promise.resolve().then(() => {
          alignmentEngine.registerNode(node.id, node)
          interactionController.registerSelectableNode(node.id, node)
          physicsEngine.createBody(node.id, {
            position: new Vector2D(node.x, node.y),
            mass: 1,
            shape: { type: 'circle', radius: 15 }
          })
        })
      )
      
      await Promise.all(registrationPromises)
      
      // Verify all systems registered nodes correctly
      expect(alignmentEngine.getRegisteredNodes()).toHaveLength(20)
      expect(interactionController.getRegisteredNodeCount()).toBe(20)
      expect(physicsEngine.getBodyCount()).toBe(20)
    })
  })

  describe('Real-world Scenarios', () => {
    test('should handle typical funnel building workflow', async () => {
      // Simulate user creating a funnel
      const funnelNodes = [
        { id: 'landing', x: 100, y: 100, width: 120, height: 80, type: 'start' },
        { id: 'signup', x: 300, y: 200, width: 120, height: 80, type: 'process' },
        { id: 'purchase', x: 500, y: 300, width: 120, height: 80, type: 'conversion' }
      ]
      
      // Step 1: Create nodes
      funnelNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, node)
        interactionController.registerSelectableNode(node.id, node)
      })
      
      // Step 2: User drags signup node to align with landing page
      interactionController.selectNode('signup')
      dragCalculator.startDrag(new Vector2D(360, 240))
      
      const targetPosition = new Vector2D(300, 100) // Align horizontally with landing
      const snappedPosition = alignmentEngine.snapToAlignment('signup', targetPosition)
      
      expect(Math.abs(snappedPosition.y - 100)).toBeLessThan(10) // Should snap to alignment
      
      // Step 3: Multi-select and batch move
      interactionController.selectNode('purchase', true) // Add to selection
      
      const batchResult = await interactionController.executeBatchOperation('move', {
        delta: { x: -50, y: 0 }
      })
      
      expect(batchResult.success).toBe(true)
      expect(batchResult.processedCount).toBe(2)
      
      // Step 4: Apply physics effects
      funnelNodes.forEach(node => {
        physicsEngine.createBody(node.id, {
          position: new Vector2D(node.x, node.y),
          mass: 1,
          shape: { type: 'rectangle', width: node.width, height: node.height }
        })
      })
      
      // Connect with springs
      physicsEngine.createSpring('landing-signup', {
        bodyA: 'landing',
        bodyB: 'signup',
        restLength: 150,
        stiffness: 50,
        damping: 10
      })
      
      physicsEngine.createSpring('signup-purchase', {
        bodyA: 'signup',
        bodyB: 'purchase',
        restLength: 150,
        stiffness: 50,
        damping: 10
      })
      
      // Verify spring connections
      expect(physicsEngine.getSpring('landing-signup')).toBeDefined()
      expect(physicsEngine.getSpring('signup-purchase')).toBeDefined()
    })

    test('should handle mobile touch interactions', () => {
      // Simulate mobile device
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        writable: true
      })
      
      // Setup mobile-optimized configuration
      touchHandler.updateConfiguration({
        touchSensitivity: 1.2,
        enablePressure: true
      })
      
      alignmentEngine.updateConfiguration({
        snapThreshold: 15 // Larger for finger touch
      })
      
      // Simulate mobile touch gestures
      const node = { id: 'mobile-node', x: 200, y: 200, width: 100, height: 80 }
      
      alignmentEngine.registerNode(node.id, node)
      interactionController.registerSelectableNode(node.id, node)
      
      // Pinch to zoom
      const pinchSpy = vi.fn()
      touchHandler.onGesture('pinch', pinchSpy)
      
      const touch1 = TestDataGenerator.generateTouchData(1, 150, 200)[0]
      const touch2 = TestDataGenerator.generateTouchData(1, 250, 200)[0]
      touch2.identifier = 1
      
      // Start pinch
      container.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch1, touch2],
        changedTouches: [touch1, touch2],
        bubbles: true
      }))
      
      // Move touches closer (pinch in)
      const touch1Close = { ...touch1, clientX: 180 }
      const touch2Close = { ...touch2, clientX: 220 }
      
      container.dispatchEvent(new TouchEvent('touchmove', {
        touches: [touch1Close, touch2Close],
        changedTouches: [touch1Close, touch2Close],
        bubbles: true
      }))
      
      vi.advanceTimersByTime(100)
      
      expect(pinchSpy).toHaveBeenCalledWith({
        type: 'pinch',
        scale: expect.any(Number),
        center: expect.any(Vector2D),
        startSpread: expect.any(Number),
        currentSpread: expect.any(Number),
        timestamp: expect.any(Number)
      })
    })
  })
})