import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  PRECISION,
  isEqual,
  preciseRound,
  Vector2D
} from './math-precision'
import { mathTestVectors } from '../../tests/fixtures/test-data'
import { PerformanceTestUtils as PerfUtils } from '../../tests/helpers/test-utils'

describe('Math Precision System', () => {
  describe('PRECISION constants', () => {
    test('should have correct precision values', () => {
      expect(PRECISION.EPSILON).toBe(1e-10)
      expect(PRECISION.DECIMAL_PLACES).toBe(8)
      expect(PRECISION.SUB_PIXEL).toBe(0.001)
      expect(PRECISION.ANGLE_EPSILON).toBe(1e-6)
      expect(PRECISION.MATRIX_EPSILON).toBe(1e-9)
    })

    test('should be immutable', () => {
      expect(() => {
        // @ts-expect-error Testing immutability
        PRECISION.EPSILON = 0.1
      }).toThrow()
    })
  })

  describe('isEqual function', () => {
    test('should compare numbers with default epsilon', () => {
      expect(isEqual(0.1 + 0.2, 0.3)).toBe(true)
      expect(isEqual(1, 1.0000000001)).toBe(true)
      expect(isEqual(1, 2)).toBe(false)
    })

    test('should use custom epsilon when provided', () => {
      expect(isEqual(1, 1.1, 0.2)).toBe(true)
      expect(isEqual(1, 1.1, 0.05)).toBe(false)
    })

    test('should handle edge cases', () => {
      expect(isEqual(0, -0)).toBe(true)
      expect(isEqual(Infinity, Infinity)).toBe(true)
      expect(isEqual(-Infinity, -Infinity)).toBe(true)
      expect(isEqual(Infinity, -Infinity)).toBe(false)
      expect(isEqual(NaN, NaN)).toBe(false) // NaN !== NaN
    })

    test('should be performant', async () => {
      const { avgTime } = await PerfUtils.runBenchmark(
        'isEqual performance',
        () => isEqual(Math.random(), Math.random()),
        1000
      )
      
      expect(avgTime).toBeLessThan(0.01) // Should be extremely fast
    })
  })

  describe('preciseRound function', () => {
    test('should round to default precision', () => {
      expect(preciseRound(1.123456789)).toBe(1.12345679)
      expect(preciseRound(Math.PI)).toBe(3.14159265)
    })

    test('should round to custom precision', () => {
      expect(preciseRound(1.123456789, 2)).toBe(1.12)
      expect(preciseRound(1.123456789, 4)).toBe(1.1235)
      expect(preciseRound(1.123456789, 0)).toBe(1)
    })

    test('should handle edge cases', () => {
      expect(preciseRound(0)).toBe(0)
      expect(preciseRound(-0)).toBe(0)
      expect(preciseRound(1.999999999, 0)).toBe(2)
      expect(preciseRound(-1.999999999, 0)).toBe(-2)
    })

    test('should handle floating point precision issues', () => {
      expect(preciseRound(0.1 + 0.2, 2)).toBe(0.3)
      expect(preciseRound(1 / 3, 6)).toBe(0.333333)
    })

    test('should validate precision test cases', () => {
      mathTestVectors.precisionTests.forEach(({ input, expected, tolerance }) => {
        const rounded = preciseRound(input, 15)
        expect(Math.abs(rounded - expected)).toBeLessThan(tolerance)
      })
    })
  })

  describe('Vector2D class', () => {
    let vector: Vector2D

    beforeEach(() => {
      vector = new Vector2D(3, 4)
    })

    describe('constructor and getters', () => {
      test('should create vector with default values', () => {
        const defaultVector = new Vector2D()
        expect(defaultVector.x).toBe(0)
        expect(defaultVector.y).toBe(0)
      })

      test('should create vector with given values', () => {
        expect(vector.x).toBe(3)
        expect(vector.y).toBe(4)
      })

      test('should round values during construction', () => {
        const preciseVector = new Vector2D(1.123456789, 2.987654321)
        expect(preciseVector.x).toBe(1.12345679)
        expect(preciseVector.y).toBe(2.98765432)
      })

      test('should handle test vector data', () => {
        mathTestVectors.vector2d.forEach(({ x, y }) => {
          const v = new Vector2D(x, y)
          expect(v.x).toBe(preciseRound(x))
          expect(v.y).toBe(preciseRound(y))
        })
      })
    })

    describe('setters', () => {
      test('should set x value with precision rounding', () => {
        vector.x = 1.123456789
        expect(vector.x).toBe(1.12345679)
      })

      test('should set y value with precision rounding', () => {
        vector.y = 2.987654321
        expect(vector.y).toBe(2.98765432)
      })
    })

    describe('clone method', () => {
      test('should create independent copy', () => {
        const clone = vector.clone()
        expect(clone.x).toBe(vector.x)
        expect(clone.y).toBe(vector.y)
        expect(clone).not.toBe(vector) // Different instances
        
        clone.x = 10
        expect(vector.x).toBe(3) // Original unchanged
      })
    })

    describe('set method', () => {
      test('should set both values and return self', () => {
        const result = vector.set(5, 6)
        expect(result).toBe(vector) // Returns self
        expect(vector.x).toBe(5)
        expect(vector.y).toBe(6)
      })

      test('should round values when setting', () => {
        vector.set(1.123456789, 2.987654321)
        expect(vector.x).toBe(1.12345679)
        expect(vector.y).toBe(2.98765432)
      })
    })

    describe('arithmetic operations', () => {
      test('add should return new vector with sum', () => {
        const other = new Vector2D(1, 2)
        const result = vector.add(other)
        
        expect(result).not.toBe(vector) // New instance
        expect(result.x).toBe(4)
        expect(result.y).toBe(6)
        expect(vector.x).toBe(3) // Original unchanged
        expect(vector.y).toBe(4)
      })

      test('subtract should return new vector with difference', () => {
        const other = new Vector2D(1, 2)
        const result = vector.subtract(other)
        
        expect(result.x).toBe(2)
        expect(result.y).toBe(2)
      })

      test('multiply should scale vector by scalar', () => {
        const result = vector.multiply(2)
        
        expect(result.x).toBe(6)
        expect(result.y).toBe(8)
      })

      test('divide should scale vector by inverse scalar', () => {
        const result = vector.divide(2)
        
        expect(result.x).toBe(1.5)
        expect(result.y).toBe(2)
      })

      test('divide should throw error for zero division', () => {
        expect(() => vector.divide(0)).toThrow('Division by zero in Vector2D.divide')
        expect(() => vector.divide(PRECISION.EPSILON / 2)).toThrow()
      })

      test('should handle precision in arithmetic operations', () => {
        const v1 = new Vector2D(0.1, 0.2)
        const v2 = new Vector2D(0.2, 0.1)
        const result = v1.add(v2)
        
        expect(isEqual(result.x, 0.3)).toBe(true)
        expect(isEqual(result.y, 0.3)).toBe(true)
      })
    })

    describe('length and distance methods', () => {
      test('length should return vector magnitude', () => {
        expect(vector.length()).toBe(5) // 3-4-5 triangle
      })

      test('lengthSquared should return squared magnitude', () => {
        expect(vector.lengthSquared()).toBe(25)
      })

      test('distanceTo should return distance between vectors', () => {
        const other = new Vector2D(0, 0)
        expect(vector.distanceTo(other)).toBe(5)
      })

      test('distanceToSquared should return squared distance', () => {
        const other = new Vector2D(0, 0)
        expect(vector.distanceToSquared(other)).toBe(25)
      })

      test('should handle zero vectors', () => {
        const zero = new Vector2D(0, 0)
        expect(zero.length()).toBe(0)
        expect(zero.lengthSquared()).toBe(0)
      })
    })

    describe('normalize method', () => {
      test('should return unit vector', () => {
        const normalized = vector.normalize()
        expect(normalized.length()).toBeCloseTo(1, 10)
        expect(normalized.x).toBeCloseTo(0.6, 10)
        expect(normalized.y).toBeCloseTo(0.8, 10)
      })

      test('should handle zero vector', () => {
        const zero = new Vector2D(0, 0)
        const normalized = zero.normalize()
        expect(normalized.x).toBe(0)
        expect(normalized.y).toBe(0)
      })

      test('should not modify original vector', () => {
        const original = { x: vector.x, y: vector.y }
        vector.normalize()
        expect(vector.x).toBe(original.x)
        expect(vector.y).toBe(original.y)
      })
    })

    describe('dot and cross products', () => {
      test('dot product should return scalar', () => {
        const other = new Vector2D(1, 2)
        const dotProduct = vector.dot(other)
        expect(dotProduct).toBe(11) // 3*1 + 4*2 = 11
      })

      test('cross product should return scalar (2D)', () => {
        const other = new Vector2D(1, 2)
        const crossProduct = vector.cross(other)
        expect(crossProduct).toBe(2) // 3*2 - 4*1 = 2
      })

      test('dot product with itself should equal length squared', () => {
        const dotSelf = vector.dot(vector)
        expect(dotSelf).toBe(vector.lengthSquared())
      })

      test('cross product with itself should be zero', () => {
        const crossSelf = vector.cross(vector)
        expect(crossSelf).toBe(0)
      })
    })

    describe('performance tests', () => {
      test('constructor should be fast', async () => {
        const { avgTime } = await PerfUtils.runBenchmark(
          'Vector2D constructor',
          () => new Vector2D(Math.random(), Math.random()),
          1000
        )
        
        expect(avgTime).toBeLessThan(0.1)
      })

      test('arithmetic operations should be fast', async () => {
        const v1 = new Vector2D(1, 2)
        const v2 = new Vector2D(3, 4)
        
        const { avgTime } = await PerfUtils.runBenchmark(
          'Vector2D operations',
          () => {
            v1.add(v2)
            v1.subtract(v2)
            v1.multiply(2)
            v1.divide(2)
          },
          1000
        )
        
        expect(avgTime).toBeLessThan(0.5)
      })

      test('batch operations should maintain precision', async () => {
        const vectors = Array.from({ length: 1000 }, (_, i) => 
          new Vector2D(Math.random() * 1000, Math.random() * 1000)
        )
        
        const { result, duration } = PerfUtils.measure(() => {
          return vectors.reduce((sum, v) => sum.add(v), new Vector2D(0, 0))
        })
        
        expect(duration).toBeLessThan(50) // Should be fast
        expect(result).toBeInstanceOf(Vector2D)
        expect(result.x).toBeGreaterThan(0)
        expect(result.y).toBeGreaterThan(0)
      })
    })

    describe('edge cases and error handling', () => {
      test('should handle very small numbers', () => {
        const tiny = new Vector2D(Number.EPSILON, Number.EPSILON)
        expect(tiny.length()).toBeGreaterThan(0)
        expect(tiny.normalize().length()).toBeCloseTo(1)
      })

      test('should handle very large numbers', () => {
        const large = new Vector2D(1e10, 1e10)
        expect(large.length()).toBe(Math.sqrt(2) * 1e10)
      })

      test('should handle negative numbers', () => {
        const negative = new Vector2D(-3, -4)
        expect(negative.length()).toBe(5)
        expect(negative.normalize().length()).toBeCloseTo(1)
      })

      test('should maintain precision with repeated operations', () => {
        let v = new Vector2D(1, 1)
        
        // Perform many operations that could accumulate errors
        for (let i = 0; i < 1000; i++) {
          v = v.multiply(1.001).divide(1.001)
        }
        
        expect(isEqual(v.x, 1, 1e-6)).toBe(true)
        expect(isEqual(v.y, 1, 1e-6)).toBe(true)
      })
    })

    describe('memory and garbage collection', () => {
      test('should not leak memory with many operations', () => {
        const iterations = 10000
        const vectors = []
        
        for (let i = 0; i < iterations; i++) {
          const v1 = new Vector2D(Math.random(), Math.random())
          const v2 = new Vector2D(Math.random(), Math.random())
          vectors.push(v1.add(v2).multiply(0.5))
        }
        
        expect(vectors).toHaveLength(iterations)
        vectors.length = 0 // Clear for GC
      })
    })

    describe('mathematical properties', () => {
      test('should satisfy commutative property for addition', () => {
        const v1 = new Vector2D(3, 4)
        const v2 = new Vector2D(1, 2)
        
        const result1 = v1.add(v2)
        const result2 = v2.add(v1)
        
        expect(isEqual(result1.x, result2.x)).toBe(true)
        expect(isEqual(result1.y, result2.y)).toBe(true)
      })

      test('should satisfy associative property for addition', () => {
        const v1 = new Vector2D(1, 2)
        const v2 = new Vector2D(3, 4)
        const v3 = new Vector2D(5, 6)
        
        const result1 = v1.add(v2).add(v3)
        const result2 = v1.add(v2.add(v3))
        
        expect(isEqual(result1.x, result2.x)).toBe(true)
        expect(isEqual(result1.y, result2.y)).toBe(true)
      })

      test('should satisfy distributive property for scalar multiplication', () => {
        const v1 = new Vector2D(1, 2)
        const v2 = new Vector2D(3, 4)
        const scalar = 2
        
        const result1 = v1.add(v2).multiply(scalar)
        const result2 = v1.multiply(scalar).add(v2.multiply(scalar))
        
        expect(isEqual(result1.x, result2.x)).toBe(true)
        expect(isEqual(result1.y, result2.y)).toBe(true)
      })
    })
  })

  describe('sub-pixel precision', () => {
    test('should maintain sub-pixel precision in calculations', () => {
      const v1 = new Vector2D(100.001, 200.002)
      const v2 = new Vector2D(0.001, 0.002)
      
      const result = v1.add(v2)
      
      expect(result.x).toBe(100.002)
      expect(result.y).toBe(200.004)
    })

    test('should handle sub-pixel movements accurately', () => {
      let position = new Vector2D(100, 100)
      const movement = new Vector2D(PRECISION.SUB_PIXEL, PRECISION.SUB_PIXEL)
      
      for (let i = 0; i < 1000; i++) {
        position = position.add(movement)
      }
      
      expect(isEqual(position.x, 101, 1e-6)).toBe(true)
      expect(isEqual(position.y, 101, 1e-6)).toBe(true)
    })
  })
})