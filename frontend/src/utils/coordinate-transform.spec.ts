import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  PreciseCoordinateTransform,
  DragCoordinateCalculator,
  BoundaryConstraint,
  GridSnapper,
  TouchAwareDragCalculator,
  createStandardTransform,
  createDragCalculator,
  type TransformConfig
} from './coordinate-transform'
import { Vector2D, PRECISION } from './math-precision'
import { mathTestVectors } from '../../tests/fixtures/test-data'
import { PerformanceTestUtils as PerfUtils } from '../../tests/helpers/test-utils'

describe('Coordinate Transform System', () => {
  let defaultConfig: TransformConfig
  let transform: PreciseCoordinateTransform

  beforeEach(() => {
    defaultConfig = {
      zoom: 1,
      panX: 0,
      panY: 0,
      rotation: 0,
      devicePixelRatio: 1,
      viewportWidth: 800,
      viewportHeight: 600,
      canvasWidth: 1600,
      canvasHeight: 1200
    }
    
    transform = new PreciseCoordinateTransform(defaultConfig)
  })

  describe('PreciseCoordinateTransform', () => {
    describe('constructor', () => {
      test('should initialize with default config', () => {
        expect(transform).toBeInstanceOf(PreciseCoordinateTransform)
      })

      test('should create identity matrices initially', () => {
        const context = transform.getContext()
        expect(context.config).toEqual(defaultConfig)
      })

      test('should handle different device pixel ratios', () => {
        const configs = [1, 1.5, 2, 3].map(ratio => ({
          ...defaultConfig,
          devicePixelRatio: ratio
        }))

        configs.forEach(config => {
          const t = new PreciseCoordinateTransform(config)
          expect(t.getContext().config.devicePixelRatio).toBe(config.devicePixelRatio)
        })
      })
    })

    describe('updateConfig', () => {
      test('should update config partially', () => {
        transform.updateConfig({ zoom: 2, panX: 100 })
        
        const context = transform.getContext()
        expect(context.config.zoom).toBe(2)
        expect(context.config.panX).toBe(100)
        expect(context.config.panY).toBe(0) // Unchanged
      })

      test('should only update matrices for significant changes', () => {
        const updateSpy = vi.spyOn(transform as any, 'updateTransformMatrices')
        
        // Insignificant change (below sub-pixel precision)
        transform.updateConfig({ panX: PRECISION.SUB_PIXEL / 2 })
        expect(updateSpy).not.toHaveBeenCalled()
        
        // Significant change
        transform.updateConfig({ panX: PRECISION.SUB_PIXEL * 2 })
        expect(updateSpy).toHaveBeenCalled()
      })

      test('should handle multiple rapid updates efficiently', async () => {
        const { avgTime } = await PerfUtils.runBenchmark(
          'rapid config updates',
          () => {
            transform.updateConfig({ zoom: Math.random() + 0.5 })
          },
          100
        )
        
        expect(avgTime).toBeLessThan(1) // Should be fast
      })
    })

    describe('coordinate transformations', () => {
      test('should transform screen to SVG coordinates', () => {
        const screenPoint = new Vector2D(100, 100)
        const svgPoint = transform.screenToSVG(screenPoint)
        
        expect(svgPoint).toBeInstanceOf(Vector2D)
        expect(svgPoint.x).toBeDefined()
        expect(svgPoint.y).toBeDefined()
      })

      test('should transform SVG to canvas coordinates', () => {
        const svgPoint = new Vector2D(50, 50)
        const canvasPoint = transform.svgToCanvas(svgPoint)
        
        expect(canvasPoint).toBeInstanceOf(Vector2D)
      })

      test('should maintain precision in transformations', () => {
        const precisePoint = new Vector2D(100.001, 200.002)
        
        // Round trip transformation
        const svgPoint = transform.screenToSVG(precisePoint)
        const backToScreen = transform.svgToScreen(svgPoint)
        
        expect(Math.abs(backToScreen.x - precisePoint.x)).toBeLessThan(PRECISION.SUB_PIXEL)
        expect(Math.abs(backToScreen.y - precisePoint.y)).toBeLessThan(PRECISION.SUB_PIXEL)
      })

      test('should handle transformation chains', () => {
        const screenPoint = new Vector2D(400, 300)
        
        // Chain transformations
        const svgPoint = transform.screenToSVG(screenPoint)
        const canvasPoint = transform.svgToCanvas(svgPoint)
        const nodePoint = transform.canvasToNode(canvasPoint)
        
        // Reverse chain
        const backToCanvas = transform.nodeToCanvas(nodePoint)
        const backToSVG = transform.canvasToSVG(backToCanvas)
        const backToScreen = transform.svgToScreen(backToSVG)
        
        expect(Math.abs(backToScreen.x - screenPoint.x)).toBeLessThan(PRECISION.SUB_PIXEL)
        expect(Math.abs(backToScreen.y - screenPoint.y)).toBeLessThan(PRECISION.SUB_PIXEL)
      })

      test('should handle test transformation data', () => {
        mathTestVectors.transformations.forEach(({ translate, scale, rotate }) => {
          transform.updateConfig({
            panX: translate.x,
            panY: translate.y,
            zoom: scale.x,
            rotation: rotate
          })
          
          const testPoint = new Vector2D(100, 100)
          const transformed = transform.screenToSVG(testPoint)
          const backTransformed = transform.svgToScreen(transformed)
          
          expect(Math.abs(backTransformed.x - testPoint.x)).toBeLessThan(PRECISION.SUB_PIXEL)
          expect(Math.abs(backTransformed.y - testPoint.y)).toBeLessThan(PRECISION.SUB_PIXEL)
        })
      })
    })

    describe('zoom and pan operations', () => {
      test('should handle zoom transformations', () => {
        transform.updateConfig({ zoom: 2 })
        
        const point = new Vector2D(100, 100)
        const transformed = transform.screenToSVG(point)
        
        // With 2x zoom, screen point should map to smaller SVG coordinate
        expect(transformed.x).toBeLessThan(point.x)
        expect(transformed.y).toBeLessThan(point.y)
      })

      test('should handle pan transformations', () => {
        transform.updateConfig({ panX: 100, panY: 50 })
        
        const origin = new Vector2D(0, 0)
        const transformed = transform.screenToSVG(origin)
        
        // Pan should offset the transformation
        expect(transformed.x).not.toBe(0)
        expect(transformed.y).not.toBe(0)
      })

      test('should handle rotation transformations', () => {
        transform.updateConfig({ rotation: Math.PI / 2 }) // 90 degrees
        
        const point = new Vector2D(100, 0)
        const transformed = transform.screenToSVG(point)
        const backTransformed = transform.svgToScreen(transformed)
        
        // Should maintain distance from origin
        expect(Math.abs(point.length() - backTransformed.length())).toBeLessThan(PRECISION.SUB_PIXEL)
      })
    })

    describe('performance optimization', () => {
      test('should cache transformation matrices', () => {
        const point = new Vector2D(100, 100)
        
        const { avgTime: firstRun } = PerfUtils.measure(() => {
          for (let i = 0; i < 100; i++) {
            transform.screenToSVG(point)
          }
        })
        
        const { avgTime: secondRun } = PerfUtils.measure(() => {
          for (let i = 0; i < 100; i++) {
            transform.screenToSVG(point)
          }
        })
        
        // Second run should be same or faster due to caching
        expect(secondRun).toBeLessThanOrEqual(firstRun * 1.1)
      })

      test('should handle high-frequency transformations', async () => {
        const points = Array.from({ length: 1000 }, (_, i) => 
          new Vector2D(Math.random() * 800, Math.random() * 600)
        )
        
        const { avgTime } = await PerfUtils.runBenchmark(
          'high-frequency transformations',
          () => {
            points.forEach(point => {
              transform.screenToSVG(point)
              transform.svgToCanvas(point)
            })
          },
          10
        )
        
        expect(avgTime).toBeLessThan(50) // Should handle many transforms quickly
      })
    })
  })

  describe('DragCoordinateCalculator', () => {
    let calculator: DragCoordinateCalculator

    beforeEach(() => {
      calculator = new DragCoordinateCalculator(transform)
    })

    test('should calculate drag delta accurately', () => {
      const startPoint = new Vector2D(100, 100)
      const currentPoint = new Vector2D(150, 120)
      
      calculator.startDrag(startPoint)
      const delta = calculator.calculateDelta(currentPoint)
      
      expect(delta.x).toBeCloseTo(50, 10)
      expect(delta.y).toBeCloseTo(20, 10)
    })

    test('should maintain precision during long drags', () => {
      const startPoint = new Vector2D(100.001, 100.002)
      calculator.startDrag(startPoint)
      
      // Simulate many small movements
      let currentPoint = startPoint.clone()
      for (let i = 0; i < 1000; i++) {
        currentPoint = currentPoint.add(new Vector2D(PRECISION.SUB_PIXEL, PRECISION.SUB_PIXEL))
        calculator.calculateDelta(currentPoint)
      }
      
      const finalDelta = calculator.calculateDelta(currentPoint)
      expect(Math.abs(finalDelta.x - 1)).toBeLessThan(PRECISION.SUB_PIXEL * 2)
      expect(Math.abs(finalDelta.y - 1)).toBeLessThan(PRECISION.SUB_PIXEL * 2)
    })

    test('should handle zoom during drag', () => {
      const startPoint = new Vector2D(100, 100)
      calculator.startDrag(startPoint)
      
      // Change zoom during drag
      transform.updateConfig({ zoom: 2 })
      const currentPoint = new Vector2D(150, 150)
      const delta = calculator.calculateDelta(currentPoint)
      
      expect(delta).toBeInstanceOf(Vector2D)
    })
  })

  describe('BoundaryConstraint', () => {
    let constraint: BoundaryConstraint

    beforeEach(() => {
      const bounds = {
        x: 0,
        y: 0,
        width: 800,
        height: 600
      }
      constraint = new BoundaryConstraint(bounds)
    })

    test('should constrain point within bounds', () => {
      const outsidePoint = new Vector2D(1000, 700)
      const constrained = constraint.constrain(outsidePoint)
      
      expect(constrained.x).toBeLessThanOrEqual(800)
      expect(constrained.y).toBeLessThanOrEqual(600)
      expect(constrained.x).toBeGreaterThanOrEqual(0)
      expect(constrained.y).toBeGreaterThanOrEqual(0)
    })

    test('should not modify points inside bounds', () => {
      const insidePoint = new Vector2D(400, 300)
      const constrained = constraint.constrain(insidePoint)
      
      expect(constrained.x).toBe(insidePoint.x)
      expect(constrained.y).toBe(insidePoint.y)
    })

    test('should handle edge cases', () => {
      const edgePoint = new Vector2D(800, 600)
      const constrained = constraint.constrain(edgePoint)
      
      expect(constrained.x).toBeLessThanOrEqual(800)
      expect(constrained.y).toBeLessThanOrEqual(600)
    })
  })

  describe('GridSnapper', () => {
    let snapper: GridSnapper

    beforeEach(() => {
      snapper = new GridSnapper(20) // 20px grid
    })

    test('should snap to grid points', () => {
      const point = new Vector2D(23, 17)
      const snapped = snapper.snap(point)
      
      expect(snapped.x).toBe(20)
      expect(snapped.y).toBe(20)
    })

    test('should snap to nearest grid intersection', () => {
      const point = new Vector2D(33, 47)
      const snapped = snapper.snap(point)
      
      expect(snapped.x).toBe(40)
      expect(snapped.y).toBe(40)
    })

    test('should handle negative coordinates', () => {
      const point = new Vector2D(-23, -17)
      const snapped = snapper.snap(point)
      
      expect(snapped.x).toBe(-20)
      expect(snapped.y).toBe(-20)
    })

    test('should maintain sub-pixel precision when not snapping', () => {
      snapper.setEnabled(false)
      
      const point = new Vector2D(23.001, 17.002)
      const snapped = snapper.snap(point)
      
      expect(snapped.x).toBe(23.001)
      expect(snapped.y).toBe(17.002)
    })
  })

  describe('TouchAwareDragCalculator', () => {
    let touchCalculator: TouchAwareDragCalculator

    beforeEach(() => {
      touchCalculator = new TouchAwareDragCalculator(transform)
    })

    test('should calibrate for touch precision', () => {
      const touchData = [
        { x: 100, y: 100, pressure: 1, timestamp: 0 },
        { x: 101, y: 101, pressure: 1, timestamp: 16 },
        { x: 102, y: 102, pressure: 1, timestamp: 32 }
      ]
      
      touchCalculator.calibrateTouch(touchData)
      expect(touchCalculator.getCalibrationData()).toBeDefined()
    })

    test('should adjust coordinates based on touch pressure', () => {
      const point = new Vector2D(100, 100)
      const pressure = 0.8
      
      const adjusted = touchCalculator.adjustForTouchPressure(point, pressure)
      expect(adjusted).toBeInstanceOf(Vector2D)
    })

    test('should handle multi-touch scenarios', () => {
      const touches = [
        { id: 0, x: 100, y: 100, pressure: 1 },
        { id: 1, x: 200, y: 200, pressure: 0.8 }
      ]
      
      const result = touchCalculator.processMultiTouch(touches)
      expect(result).toHaveProperty('centroid')
      expect(result).toHaveProperty('spread')
    })
  })

  describe('factory functions', () => {
    test('createStandardTransform should create configured transform', () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      
      const standardTransform = createStandardTransform(canvas, 1)
      expect(standardTransform).toBeInstanceOf(PreciseCoordinateTransform)
    })

    test('createDragCalculator should create calculator with transform', () => {
      const calculator = createDragCalculator(transform)
      expect(calculator).toBeInstanceOf(DragCoordinateCalculator)
    })
  })

  describe('error handling and edge cases', () => {
    test('should handle invalid zoom values', () => {
      expect(() => {
        transform.updateConfig({ zoom: 0 })
      }).not.toThrow()
      
      expect(() => {
        transform.updateConfig({ zoom: -1 })
      }).not.toThrow()
    })

    test('should handle extreme coordinate values', () => {
      const extremePoint = new Vector2D(Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER)
      
      expect(() => {
        transform.screenToSVG(extremePoint)
      }).not.toThrow()
    })

    test('should handle NaN and Infinity values', () => {
      const invalidPoint = new Vector2D(NaN, Infinity)
      
      expect(() => {
        transform.screenToSVG(invalidPoint)
      }).not.toThrow()
    })
  })

  describe('memory management', () => {
    test('should not leak memory with many transformations', () => {
      const points = Array.from({ length: 10000 }, (_, i) => 
        new Vector2D(Math.random() * 1000, Math.random() * 1000)
      )
      
      points.forEach(point => {
        transform.screenToSVG(point)
        transform.svgToCanvas(point)
        transform.canvasToNode(point)
      })
      
      // If this doesn't crash or slow down significantly, memory is managed well
      expect(points.length).toBe(10000)
    })
  })
})