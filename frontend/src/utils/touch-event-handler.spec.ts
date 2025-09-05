import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TouchEventHandler } from './touch-event-handler'
import { Vector2D } from './math-precision'
import { 
  touchTestData,
  platformTestData 
} from '../../tests/fixtures/test-data'
import { 
  DragTestUtils,
  TestDataGenerator,
  PerformanceTestUtils as PerfUtils 
} from '../../tests/helpers/test-utils'

describe('Touch Event Handler', () => {
  let touchHandler: TouchEventHandler
  let mockElement: HTMLElement
  let mockCanvas: HTMLCanvasElement

  beforeEach(() => {
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    mockElement = document.createElement('div')
    mockElement.style.width = '800px'
    mockElement.style.height = '600px'
    mockElement.appendChild(mockCanvas)
    
    document.body.appendChild(mockElement)
    
    touchHandler = new TouchEventHandler(mockElement, {
      enableMultiTouch: true,
      enableGestures: true,
      enablePressure: true,
      touchSensitivity: 1.0,
      maxTouches: 10,
      preventDefault: true
    })
  })

  afterEach(() => {
    touchHandler.destroy()
    document.body.removeChild(mockElement)
    vi.clearAllTimers()
  })

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultHandler = new TouchEventHandler(mockElement)
      const config = defaultHandler.getConfiguration()
      
      expect(config.enableMultiTouch).toBe(true)
      expect(config.enableGestures).toBe(true)
      expect(config.enablePressure).toBe(true)
      expect(config.touchSensitivity).toBe(1.0)
      expect(config.maxTouches).toBe(10)
    })

    test('should register touch event listeners', () => {
      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener')
      
      new TouchEventHandler(mockElement)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object))
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object))
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object))
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function), expect.any(Object))
    })

    test('should support passive event listeners', () => {
      const addEventListenerSpy = vi.spyOn(mockElement, 'addEventListener')
      
      new TouchEventHandler(mockElement, {
        passiveEvents: true
      })
      
      const calls = addEventListenerSpy.mock.calls
      calls.forEach(call => {
        expect(call[2]).toEqual(expect.objectContaining({ passive: true }))
      })
    })
  })

  describe('Single Touch Handling', () => {
    test('should handle touch start event', () => {
      const touchStartSpy = vi.fn()
      touchHandler.onTouchStart(touchStartSpy)
      
      const touch = TestDataGenerator.generateTouchData(1)[0]
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      expect(touchStartSpy).toHaveBeenCalledWith({
        touchId: touch.identifier,
        position: new Vector2D(touch.clientX, touch.clientY),
        pressure: touch.force,
        timestamp: expect.any(Number)
      })
    })

    test('should handle touch move event', () => {
      const touchMoveSpy = vi.fn()
      touchHandler.onTouchMove(touchMoveSpy)
      
      const startTouch = TestDataGenerator.generateTouchData(1, 100, 100)[0]
      const moveTouch = { ...startTouch, clientX: 150, clientY: 120 }
      
      // Start touch
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [startTouch],
        changedTouches: [startTouch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchStartEvent)
      
      // Move touch
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [moveTouch],
        changedTouches: [moveTouch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchMoveEvent)
      
      expect(touchMoveSpy).toHaveBeenCalledWith({
        touchId: startTouch.identifier,
        position: new Vector2D(150, 120),
        delta: new Vector2D(50, 20),
        velocity: expect.any(Vector2D),
        pressure: moveTouch.force,
        timestamp: expect.any(Number)
      })
    })

    test('should handle touch end event', () => {
      const touchEndSpy = vi.fn()
      touchHandler.onTouchEnd(touchEndSpy)
      
      const touch = TestDataGenerator.generateTouchData(1)[0]
      
      // Start and end touch
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchStartEvent)
      
      const touchEndEvent = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [touch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchEndEvent)
      
      expect(touchEndSpy).toHaveBeenCalledWith({
        touchId: touch.identifier,
        position: new Vector2D(touch.clientX, touch.clientY),
        duration: expect.any(Number),
        timestamp: expect.any(Number)
      })
    })

    test('should calculate touch velocity accurately', () => {
      const touchMoveSpy = vi.fn()
      touchHandler.onTouchMove(touchMoveSpy)
      
      const touchData = touchTestData.singleTouch
      
      touchData.forEach((touchPoint, index) => {
        const touch = {
          identifier: 0,
          clientX: touchPoint.x,
          clientY: touchPoint.y,
          force: touchPoint.pressure,
          ...TestDataGenerator.generateTouchData(1)[0]
        }
        
        const eventType = index === 0 ? 'touchstart' : 'touchmove'
        const touchEvent = new TouchEvent(eventType, {
          touches: [touch],
          changedTouches: [touch],
          bubbles: true
        })
        
        mockElement.dispatchEvent(touchEvent)
        
        if (index > 0) {
          vi.advanceTimersByTime(16) // Simulate 60fps
        }
      })
      
      // Last touch move should have calculated velocity
      const lastCall = touchMoveSpy.mock.calls[touchMoveSpy.mock.calls.length - 1]
      const velocity = lastCall[0].velocity
      
      expect(velocity.length()).toBeGreaterThan(0)
    })

    test('should handle pressure sensitivity', () => {
      const touchStartSpy = vi.fn()
      touchHandler.onTouchStart(touchStartSpy)
      
      const lightTouch = TestDataGenerator.generateTouchData(1)[0]
      lightTouch.force = 0.3 // Light pressure
      
      const heavyTouch = TestDataGenerator.generateTouchData(1, 200, 100)[0]
      heavyTouch.force = 0.9 // Heavy pressure
      heavyTouch.identifier = 1
      
      // Light touch
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches: [lightTouch],
        changedTouches: [lightTouch],
        bubbles: true
      }))
      
      // Heavy touch
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches: [heavyTouch],
        changedTouches: [heavyTouch],
        bubbles: true
      }))
      
      expect(touchStartSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        pressure: 0.3
      }))
      
      expect(touchStartSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
        pressure: 0.9
      }))
    })
  })

  describe('Multi-Touch Handling', () => {
    test('should handle multiple simultaneous touches', () => {
      const multiTouchSpy = vi.fn()
      touchHandler.onMultiTouchStart(multiTouchSpy)
      
      const touches = TestDataGenerator.generateTouchData(3, 100, 100)
      
      const touchEvent = new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      expect(multiTouchSpy).toHaveBeenCalledWith({
        touches: touches.map(touch => ({
          touchId: touch.identifier,
          position: new Vector2D(touch.clientX, touch.clientY),
          pressure: touch.force
        })),
        centroid: expect.any(Vector2D),
        timestamp: expect.any(Number)
      })
    })

    test('should calculate touch centroid correctly', () => {
      const multiTouchSpy = vi.fn()
      touchHandler.onMultiTouchStart(multiTouchSpy)
      
      const touches = [
        TestDataGenerator.generateTouchData(1, 100, 100)[0], // Touch at (100, 100)
        TestDataGenerator.generateTouchData(1, 200, 200)[0]  // Touch at (200, 200)
      ]
      touches[1].identifier = 1
      
      const touchEvent = new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      const centroid = multiTouchSpy.mock.calls[0][0].centroid
      expect(centroid.x).toBeCloseTo(150) // (100 + 200) / 2
      expect(centroid.y).toBeCloseTo(150) // (100 + 200) / 2
    })

    test('should track touch spread for pinch gestures', () => {
      const touches = touchTestData.multiTouch.touches.map((touch, index) => ({
        identifier: index,
        clientX: touch.x,
        clientY: touch.y,
        force: touch.pressure,
        ...TestDataGenerator.generateTouchData(1)[0]
      }))
      
      const touchEvent = new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      const touchState = touchHandler.getCurrentTouchState()
      expect(touchState.spread).toBeGreaterThan(0)
      expect(touchState.touchCount).toBe(2)
    })

    test('should respect maximum touch limit', () => {
      const maxTouches = 5
      touchHandler.updateConfiguration({ maxTouches })
      
      const excessiveTouches = TestDataGenerator.generateTouchData(10)
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: excessiveTouches,
        changedTouches: excessiveTouches,
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      const touchState = touchHandler.getCurrentTouchState()
      expect(touchState.touchCount).toBeLessThanOrEqual(maxTouches)
    })

    test('should disable multi-touch when configured', () => {
      const singleTouchHandler = new TouchEventHandler(mockElement, {
        enableMultiTouch: false
      })
      
      const multiTouchSpy = vi.fn()
      singleTouchHandler.onMultiTouchStart(multiTouchSpy)
      
      const touches = TestDataGenerator.generateTouchData(3)
      const touchEvent = new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      expect(multiTouchSpy).not.toHaveBeenCalled()
      
      singleTouchHandler.destroy()
    })
  })

  describe('Gesture Recognition', () => {
    test('should recognize tap gesture', () => {
      const tapSpy = vi.fn()
      touchHandler.onGesture('tap', tapSpy)
      
      const touch = TestDataGenerator.generateTouchData(1, 150, 150)[0]
      
      // Quick tap
      const touchStart = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchStart)
      
      vi.advanceTimersByTime(100) // Short duration
      
      const touchEnd = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [touch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchEnd)
      
      expect(tapSpy).toHaveBeenCalledWith({
        type: 'tap',
        position: new Vector2D(150, 150),
        duration: expect.any(Number),
        timestamp: expect.any(Number)
      })
    })

    test('should recognize long press gesture', () => {
      const longPressSpy = vi.fn()
      touchHandler.onGesture('longpress', longPressSpy)
      
      const touch = TestDataGenerator.generateTouchData(1, 150, 150)[0]
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      mockElement.dispatchEvent(touchStart)
      
      vi.advanceTimersByTime(800) // Long press duration
      
      expect(longPressSpy).toHaveBeenCalledWith({
        type: 'longpress',
        position: new Vector2D(150, 150),
        duration: expect.any(Number),
        timestamp: expect.any(Number)
      })
    })

    test('should recognize swipe gestures', () => {
      const swipeSpy = vi.fn()
      touchHandler.onGesture('swipe', swipeSpy)
      
      DragTestUtils.simulateTouchDrag(
        mockElement,
        { x: 100, y: 150 },
        { x: 300, y: 150 }, // Horizontal swipe
        8
      )
      
      vi.advanceTimersByTime(100)
      
      expect(swipeSpy).toHaveBeenCalledWith({
        type: 'swipe',
        direction: 'right',
        distance: expect.any(Number),
        velocity: expect.any(Number),
        startPosition: expect.any(Vector2D),
        endPosition: expect.any(Vector2D),
        timestamp: expect.any(Number)
      })
    })

    test('should recognize pinch gesture', () => {
      const pinchSpy = vi.fn()
      touchHandler.onGesture('pinch', pinchSpy)
      
      const touch1Start = TestDataGenerator.generateTouchData(1, 100, 150)[0]
      const touch2Start = TestDataGenerator.generateTouchData(1, 200, 150)[0]
      touch2Start.identifier = 1
      
      // Start with two touches
      const touchStart = new TouchEvent('touchstart', {
        touches: [touch1Start, touch2Start],
        changedTouches: [touch1Start, touch2Start],
        bubbles: true
      })
      mockElement.dispatchEvent(touchStart)
      
      // Move touches closer together (pinch in)
      const touch1End = { ...touch1Start, clientX: 130 }
      const touch2End = { ...touch2Start, clientX: 170 }
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [touch1End, touch2End],
        changedTouches: [touch1End, touch2End],
        bubbles: true
      })
      mockElement.dispatchEvent(touchMove)
      
      vi.advanceTimersByTime(50)
      
      expect(pinchSpy).toHaveBeenCalledWith({
        type: 'pinch',
        scale: expect.any(Number),
        center: expect.any(Vector2D),
        startSpread: expect.any(Number),
        currentSpread: expect.any(Number),
        timestamp: expect.any(Number)
      })
    })

    test('should use gesture test data', () => {
      const gestureData = touchTestData.multiTouch.gestures
      
      Object.entries(gestureData).forEach(([gestureType, gestureConfig]) => {
        const gestureSpy = vi.fn()
        touchHandler.onGesture(gestureType as any, gestureSpy)
        
        if (gestureType === 'pinch' || gestureType === 'zoom') {
          // Simulate multi-touch gesture
          const touches = TestDataGenerator.generateTouchData(2, 100, 150)
          
          // Start gesture
          mockElement.dispatchEvent(new TouchEvent('touchstart', {
            touches,
            changedTouches: touches,
            bubbles: true
          }))
          
          // Apply scale transformation
          const scaledTouches = touches.map(touch => ({
            ...touch,
            clientX: touch.clientX * gestureConfig.scale,
            clientY: touch.clientY * gestureConfig.scale
          }))
          
          mockElement.dispatchEvent(new TouchEvent('touchmove', {
            touches: scaledTouches,
            changedTouches: scaledTouches,
            bubbles: true
          }))
          
          vi.advanceTimersByTime(100)
        }
      })
    })

    test('should disable gestures when configured', () => {
      const noGestureHandler = new TouchEventHandler(mockElement, {
        enableGestures: false
      })
      
      const tapSpy = vi.fn()
      noGestureHandler.onGesture('tap', tapSpy)
      
      // Simulate tap
      DragTestUtils.simulateTouchDrag(
        mockElement,
        { x: 150, y: 150 },
        { x: 150, y: 150 },
        1
      )
      
      vi.advanceTimersByTime(300)
      
      expect(tapSpy).not.toHaveBeenCalled()
      
      noGestureHandler.destroy()
    })
  })

  describe('Cross-Platform Compatibility', () => {
    test('should handle different touch implementations', () => {
      const platforms = ['ios', 'android'] as const
      
      platforms.forEach(platform => {
        const userAgent = platformTestData.mobile[platform].userAgent
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          writable: true
        })
        
        const platformHandler = new TouchEventHandler(mockElement)
        
        // Test basic touch functionality
        const touchSpy = vi.fn()
        platformHandler.onTouchStart(touchSpy)
        
        const touch = TestDataGenerator.generateTouchData(1)[0]
        const touchEvent = new TouchEvent('touchstart', {
          touches: [touch],
          changedTouches: [touch],
          bubbles: true
        })
        
        mockElement.dispatchEvent(touchEvent)
        
        expect(touchSpy).toHaveBeenCalled()
        
        platformHandler.destroy()
      })
    })

    test('should adapt to different screen densities', () => {
      // Simulate high DPI screen
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 3,
        writable: true
      })
      
      const highDPIHandler = new TouchEventHandler(mockElement)
      
      const touchSpy = vi.fn()
      highDPIHandler.onTouchStart(touchSpy)
      
      const touch = TestDataGenerator.generateTouchData(1, 100, 100)[0]
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      // Position should be adjusted for high DPI
      const touchData = touchSpy.mock.calls[0][0]
      expect(touchData.position).toBeInstanceOf(Vector2D)
      
      highDPIHandler.destroy()
    })

    test('should handle touch events without pressure support', () => {
      const touchWithoutPressure = TestDataGenerator.generateTouchData(1)[0]
      delete (touchWithoutPressure as any).force
      
      const touchSpy = vi.fn()
      touchHandler.onTouchStart(touchSpy)
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touchWithoutPressure],
        changedTouches: [touchWithoutPressure],
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      const touchData = touchSpy.mock.calls[0][0]
      expect(touchData.pressure).toBe(1) // Default pressure value
    })
  })

  describe('Performance Optimization', () => {
    test('should throttle touch move events', async () => {
      const touchMoveSpy = vi.fn()
      touchHandler.onTouchMove(touchMoveSpy)
      
      const touch = TestDataGenerator.generateTouchData(1, 100, 100)[0]
      
      // Start touch
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      }))
      
      // Fire many rapid touch moves
      for (let i = 0; i < 50; i++) {
        const moveTouch = { ...touch, clientX: 100 + i, clientY: 100 + i }
        mockElement.dispatchEvent(new TouchEvent('touchmove', {
          touches: [moveTouch],
          changedTouches: [moveTouch],
          bubbles: true
        }))
      }
      
      // Should have throttled the events
      expect(touchMoveSpy.mock.calls.length).toBeLessThan(50)
    })

    test('should handle high-frequency touch events efficiently', async () => {
      const touches = Array.from({ length: 100 }, (_, i) => ({
        ...TestDataGenerator.generateTouchData(1, i * 5, 100)[0],
        identifier: i
      }))
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'high-frequency touch events',
        () => {
          touches.forEach(touch => {
            mockElement.dispatchEvent(new TouchEvent('touchstart', {
              touches: [touch],
              changedTouches: [touch],
              bubbles: true
            }))
          })
        },
        1
      )
      
      expect(avgTime).toBeLessThan(100) // Should handle efficiently
    })

    test('should optimize memory usage with many touches', () => {
      // Create many simultaneous touches
      const manyTouches = TestDataGenerator.generateTouchData(touchHandler.getConfiguration().maxTouches)
      
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches: manyTouches,
        changedTouches: manyTouches,
        bubbles: true
      }))
      
      // Simulate touch movements
      for (let frame = 0; frame < 60; frame++) {
        const movedTouches = manyTouches.map((touch, index) => ({
          ...touch,
          clientX: touch.clientX + frame,
          clientY: touch.clientY + Math.sin(frame * 0.1) * 10
        }))
        
        mockElement.dispatchEvent(new TouchEvent('touchmove', {
          touches: movedTouches,
          changedTouches: movedTouches,
          bubbles: true
        }))
      }
      
      // End all touches
      mockElement.dispatchEvent(new TouchEvent('touchend', {
        touches: [],
        changedTouches: manyTouches,
        bubbles: true
      }))
      
      // Memory should be cleaned up
      const touchState = touchHandler.getCurrentTouchState()
      expect(touchState.touchCount).toBe(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle malformed touch events', () => {
      const errorSpy = vi.fn()
      touchHandler.onError(errorSpy)
      
      // Create malformed touch event
      const malformedEvent = new TouchEvent('touchstart', {
        bubbles: true
        // Missing touches array
      })
      
      expect(() => {
        mockElement.dispatchEvent(malformedEvent)
      }).not.toThrow()
    })

    test('should handle touch event listener errors', () => {
      const errorThrowingSpy = vi.fn(() => {
        throw new Error('Touch handler error')
      })
      
      const errorSpy = vi.fn()
      touchHandler.onError(errorSpy)
      touchHandler.onTouchStart(errorThrowingSpy)
      
      const touch = TestDataGenerator.generateTouchData(1)[0]
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Touch handler error'
      }))
    })

    test('should handle touch cancellation gracefully', () => {
      const touchCancelSpy = vi.fn()
      touchHandler.onTouchCancel(touchCancelSpy)
      
      const touch = TestDataGenerator.generateTouchData(1)[0]
      
      // Start touch
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      }))
      
      // Cancel touch (e.g., system gesture interrupt)
      mockElement.dispatchEvent(new TouchEvent('touchcancel', {
        touches: [],
        changedTouches: [touch],
        bubbles: true
      }))
      
      expect(touchCancelSpy).toHaveBeenCalledWith({
        touchId: touch.identifier,
        position: new Vector2D(touch.clientX, touch.clientY),
        timestamp: expect.any(Number)
      })
      
      // Touch state should be cleaned up
      const touchState = touchHandler.getCurrentTouchState()
      expect(touchState.touchCount).toBe(0)
    })
  })

  describe('Configuration Management', () => {
    test('should update configuration at runtime', () => {
      const newConfig = {
        enableMultiTouch: false,
        touchSensitivity: 1.5,
        maxTouches: 2
      }
      
      touchHandler.updateConfiguration(newConfig)
      
      const config = touchHandler.getConfiguration()
      expect(config.enableMultiTouch).toBe(false)
      expect(config.touchSensitivity).toBe(1.5)
      expect(config.maxTouches).toBe(2)
    })

    test('should validate configuration values', () => {
      touchHandler.updateConfiguration({
        touchSensitivity: -1, // Invalid
        maxTouches: 0 // Invalid
      })
      
      const config = touchHandler.getConfiguration()
      expect(config.touchSensitivity).toBeGreaterThan(0)
      expect(config.maxTouches).toBeGreaterThan(0)
    })

    test('should emit configuration change events', () => {
      const configChangeSpy = vi.fn()
      touchHandler.onConfigurationChange(configChangeSpy)
      
      touchHandler.updateConfiguration({
        touchSensitivity: 2.0
      })
      
      expect(configChangeSpy).toHaveBeenCalledWith({
        touchSensitivity: 2.0
      })
    })
  })

  describe('Memory Management', () => {
    test('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(mockElement, 'removeEventListener')
      
      touchHandler.destroy()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchcancel', expect.any(Function))
    })

    test('should clear all touch state on destroy', () => {
      const touches = TestDataGenerator.generateTouchData(5)
      
      mockElement.dispatchEvent(new TouchEvent('touchstart', {
        touches,
        changedTouches: touches,
        bubbles: true
      }))
      
      expect(touchHandler.getCurrentTouchState().touchCount).toBe(5)
      
      touchHandler.destroy()
      
      expect(touchHandler.getCurrentTouchState().touchCount).toBe(0)
    })

    test('should remove all event callbacks on destroy', () => {
      const touchStartSpy = vi.fn()
      const gestureSpy = vi.fn()
      
      touchHandler.onTouchStart(touchStartSpy)
      touchHandler.onGesture('tap', gestureSpy)
      
      touchHandler.destroy()
      
      // Create touch event after destroy
      const touch = TestDataGenerator.generateTouchData(1)[0]
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        changedTouches: [touch],
        bubbles: true
      })
      
      mockElement.dispatchEvent(touchEvent)
      
      expect(touchStartSpy).not.toHaveBeenCalled()
      expect(gestureSpy).not.toHaveBeenCalled()
    })
  })
})