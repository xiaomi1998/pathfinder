import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  memory: {
    totalJSHeapSize: 10000000,
    usedJSHeapSize: 5000000,
    jsHeapSizeLimit: 20000000
  }
}

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id))

// Mock D3 drag events
const createMockD3Event = (type: string, x = 0, y = 0) => ({
  type,
  x,
  y,
  dx: 0,
  dy: 0,
  subject: null,
  sourceEvent: new MouseEvent(type, { clientX: x, clientY: y }),
  on: vi.fn(),
  preventDefault: vi.fn(),
  stopPropagation: vi.fn()
})

// Mock canvas context
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1
  })),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  isPointInPath: vi.fn(() => false),
  canvas: {
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: vi.fn()
    }))
  }
}

HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === '2d') {
    return mockCanvasContext
  }
  return null
})

// Mock getBoundingClientRect for elements
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  left: 0,
  top: 0,
  right: 100,
  bottom: 100,
  width: 100,
  height: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn()
}))

// Mock touch events
global.TouchEvent = class extends Event {
  touches: Touch[]
  targetTouches: Touch[]
  changedTouches: Touch[]
  
  constructor(type: string, options: any = {}) {
    super(type, options)
    this.touches = options.touches || []
    this.targetTouches = options.targetTouches || []
    this.changedTouches = options.changedTouches || []
  }
}

// Mock console methods for cleaner test output
const originalConsole = { ...console }
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Restore console in specific tests if needed
export const restoreConsole = () => {
  global.console = originalConsole
}

// Test utilities
export const createMockElement = (tagName = 'div', attributes: Record<string, any> = {}) => {
  const element = document.createElement(tagName)
  Object.assign(element, attributes)
  return element
}

export const createMockTouch = (identifier = 0, clientX = 0, clientY = 0, target?: Element) => ({
  identifier,
  target: target || document.body,
  clientX,
  clientY,
  pageX: clientX,
  pageY: clientY,
  screenX: clientX,
  screenY: clientY,
  radiusX: 1,
  radiusY: 1,
  rotationAngle: 0,
  force: 1
})

export const createMockTouchEvent = (type: string, touches: Touch[] = []) => {
  return new TouchEvent(type, {
    touches,
    targetTouches: touches,
    changedTouches: touches,
    bubbles: true,
    cancelable: true
  })
}

export { mockPerformance, mockCanvasContext, createMockD3Event }