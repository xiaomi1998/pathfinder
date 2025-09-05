import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import { vi } from 'vitest'

// Test data generators
export class TestDataGenerator {
  static generateFunnelNode(overrides: Partial<any> = {}): any {
    return {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      type: 'standard',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        value: 100,
        color: '#3b82f6',
        ...overrides.data
      },
      width: 120,
      height: 60,
      ...overrides
    }
  }

  static generateFunnelEdge(sourceId: string, targetId: string, overrides: Partial<any> = {}): any {
    return {
      id: `edge-${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'default',
      animated: false,
      ...overrides
    }
  }

  static generateVector2D(x = 0, y = 0): { x: number; y: number } {
    return { x, y }
  }

  static generateMatrix2D(): number[] {
    return [1, 0, 0, 1, 0, 0] // Identity matrix
  }

  static generatePerformanceEntry(name = 'test-performance', duration = 16.67): PerformanceEntry {
    return {
      name,
      entryType: 'measure',
      startTime: performance.now(),
      duration,
      toJSON: vi.fn()
    }
  }

  static generateBoundaryShape(type: 'rectangle' | 'circle' = 'rectangle'): any {
    if (type === 'rectangle') {
      return {
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    }
    return {
      type: 'circle',
      x: 50,
      y: 50,
      radius: 25
    }
  }

  static generateTouchData(touches: number = 1, baseX = 100, baseY = 100): any[] {
    return Array.from({ length: touches }, (_, i) => ({
      identifier: i,
      clientX: baseX + i * 10,
      clientY: baseY + i * 10,
      pageX: baseX + i * 10,
      pageY: baseY + i * 10,
      screenX: baseX + i * 10,
      screenY: baseY + i * 10,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
      target: document.body
    }))
  }
}

// Performance test utilities
export class PerformanceTestUtils {
  static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    return { result, duration }
  }

  static measure<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    return { result, duration }
  }

  static async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations = 100
  ): Promise<{ name: string; avgTime: number; minTime: number; maxTime: number; iterations: number }> {
    const times: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await fn()
      const end = performance.now()
      times.push(end - start)
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    return {
      name,
      avgTime,
      minTime,
      maxTime,
      iterations
    }
  }

  static expectPerformance(duration: number, maxExpected: number, testName: string) {
    if (duration > maxExpected) {
      throw new Error(`${testName}: Performance test failed. Expected < ${maxExpected}ms, got ${duration.toFixed(2)}ms`)
    }
  }
}

// Memory test utilities
export class MemoryTestUtils {
  static getCurrentMemory(): { used: number; total: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize / 1024 / 1024, // MB
        total: memory.totalJSHeapSize / 1024 / 1024 // MB
      }
    }
    return { used: 0, total: 0 }
  }

  static async measureMemoryUsage<T>(fn: () => Promise<T> | T): Promise<{ result: T; memoryDelta: number }> {
    const startMemory = this.getCurrentMemory()
    const result = await fn()
    const endMemory = this.getCurrentMemory()
    
    return {
      result,
      memoryDelta: endMemory.used - startMemory.used
    }
  }

  static expectMemoryUsage(memoryDelta: number, maxExpectedMB: number, testName: string) {
    if (memoryDelta > maxExpectedMB) {
      throw new Error(`${testName}: Memory test failed. Expected < ${maxExpectedMB}MB, got ${memoryDelta.toFixed(2)}MB`)
    }
  }
}

// Mock factories
export class MockFactories {
  static createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const context = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height
      })),
      putImageData: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      canvas
    }
    
    vi.spyOn(canvas, 'getContext').mockReturnValue(context)
    return canvas
  }

  static createMockD3Selection() {
    return {
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      enter: vi.fn().mockReturnThis(),
      exit: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      html: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis(),
      transition: vi.fn().mockReturnThis(),
      duration: vi.fn().mockReturnThis(),
      ease: vi.fn().mockReturnThis(),
      node: vi.fn(() => document.createElement('div'))
    }
  }

  static createMockD3Event(type: string, x = 0, y = 0) {
    return {
      type,
      x,
      y,
      dx: 0,
      dy: 0,
      subject: null,
      sourceEvent: new MouseEvent(type, { clientX: x, clientY: y })
    }
  }
}

// Component test wrapper
export function createTestWrapper() {
  const pinia = createPinia()
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } }
    ]
  })

  return {
    global: {
      plugins: [pinia, router],
      stubs: {
        'router-link': true,
        'router-view': true
      }
    }
  }
}

// Enhanced render function
export function renderWithProviders(
  component: Component,
  options: RenderOptions = {}
) {
  return render(component, {
    ...createTestWrapper(),
    ...options
  })
}

// Animation test utilities
export class AnimationTestUtils {
  static mockAnimationFrame() {
    const callbacks: Array<() => void> = []
    let id = 0

    global.requestAnimationFrame = vi.fn((callback) => {
      const currentId = ++id
      callbacks.push(callback)
      return currentId
    })

    global.cancelAnimationFrame = vi.fn((id) => {
      // Simple implementation for testing
    })

    return {
      flush: () => {
        const toRun = [...callbacks]
        callbacks.length = 0
        toRun.forEach(callback => callback())
      },
      clear: () => {
        callbacks.length = 0
      }
    }
  }

  static async waitForAnimation(duration = 100) {
    return new Promise(resolve => setTimeout(resolve, duration))
  }
}

// Drag test utilities
export class DragTestUtils {
  static simulateMouseDrag(
    element: Element,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    steps = 10
  ) {
    const deltaX = (endPos.x - startPos.x) / steps
    const deltaY = (endPos.y - startPos.y) / steps

    // Mouse down
    element.dispatchEvent(new MouseEvent('mousedown', {
      clientX: startPos.x,
      clientY: startPos.y,
      bubbles: true
    }))

    // Mouse moves
    for (let i = 1; i <= steps; i++) {
      element.dispatchEvent(new MouseEvent('mousemove', {
        clientX: startPos.x + deltaX * i,
        clientY: startPos.y + deltaY * i,
        bubbles: true
      }))
    }

    // Mouse up
    element.dispatchEvent(new MouseEvent('mouseup', {
      clientX: endPos.x,
      clientY: endPos.y,
      bubbles: true
    }))
  }

  static simulateTouchDrag(
    element: Element,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    steps = 10
  ) {
    const deltaX = (endPos.x - startPos.x) / steps
    const deltaY = (endPos.y - startPos.y) / steps

    const createTouch = (x: number, y: number) => ({
      identifier: 0,
      target: element,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1
    })

    // Touch start
    const startTouch = createTouch(startPos.x, startPos.y)
    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [startTouch],
      targetTouches: [startTouch],
      changedTouches: [startTouch],
      bubbles: true
    }))

    // Touch moves
    for (let i = 1; i <= steps; i++) {
      const touch = createTouch(
        startPos.x + deltaX * i,
        startPos.y + deltaY * i
      )
      element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
        bubbles: true
      }))
    }

    // Touch end
    const endTouch = createTouch(endPos.x, endPos.y)
    element.dispatchEvent(new TouchEvent('touchend', {
      touches: [],
      targetTouches: [],
      changedTouches: [endTouch],
      bubbles: true
    }))
  }
}

export {
  TestDataGenerator as DataGenerator,
  PerformanceTestUtils as PerfUtils,
  MemoryTestUtils as MemUtils,
  MockFactories as Mocks,
  AnimationTestUtils as AnimUtils,
  DragTestUtils as DragUtils
}