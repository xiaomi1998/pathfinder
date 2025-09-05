import type { FunnelNode, FunnelEdge } from '@/types/funnel'

// Test fixture data for funnel components
export const testFunnelNodes: FunnelNode[] = [
  {
    id: 'node-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: {
      label: 'Landing Page',
      description: 'Users who visit the landing page',
      config: {
        event_name: 'page_view'
      }
    }
  },
  {
    id: 'node-2',
    type: 'event',
    position: { x: 300, y: 200 },
    data: {
      label: 'Sign Up',
      description: 'Users who create an account',
      config: {
        event_name: 'sign_up'
      }
    }
  },
  {
    id: 'node-3',
    type: 'action',
    position: { x: 500, y: 300 },
    data: {
      label: 'Purchase',
      description: 'Users who make a purchase',
      config: {
        action_type: 'purchase'
      }
    }
  },
  {
    id: 'node-4',
    type: 'end',
    position: { x: 700, y: 400 },
    data: {
      label: 'Conversion',
      description: 'Final conversion goal',
      config: {}
    }
  }
]

export const testFunnelEdges: FunnelEdge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'default',
    data: {
      config: {
        priority: 1,
        enabled: true
      }
    }
  },
  {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    type: 'default',
    data: {
      config: {
        priority: 2,
        enabled: true
      }
    }
  },
  {
    id: 'edge-3-4',
    source: 'node-3',
    target: 'node-4',
    type: 'default',
    data: {
      config: {
        priority: 3,
        enabled: true
      }
    }
  }
]

// Performance test data
export const performanceTestData = {
  dragOperations: {
    simple: { iterations: 100, expectedMaxTime: 16 },
    complex: { iterations: 50, expectedMaxTime: 32 },
    batch: { iterations: 20, expectedMaxTime: 100 }
  },
  renderOperations: {
    singleNode: { expectedMaxTime: 5 },
    multipleNodes: { nodeCount: 100, expectedMaxTime: 50 },
    largeDataset: { nodeCount: 1000, expectedMaxTime: 200 }
  },
  memoryThresholds: {
    nodeCreation: 5, // MB
    batchOperations: 10, // MB
    longSession: 20 // MB
  }
}

// Math precision test vectors
export const mathTestVectors = {
  vector2d: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: -1, y: -1 },
    { x: 0.001, y: 0.001 },
    { x: 1000000, y: 1000000 },
    { x: Number.EPSILON, y: Number.EPSILON }
  ],
  transformations: [
    { translate: { x: 10, y: 20 }, scale: { x: 1, y: 1 }, rotate: 0 },
    { translate: { x: -5, y: 15 }, scale: { x: 2, y: 2 }, rotate: Math.PI / 4 },
    { translate: { x: 0, y: 0 }, scale: { x: 0.5, y: 1.5 }, rotate: Math.PI },
    { translate: { x: 100.5, y: 200.3 }, scale: { x: 1.1, y: 0.9 }, rotate: -Math.PI / 6 }
  ],
  precisionTests: [
    { input: 0.1 + 0.2, expected: 0.3, tolerance: 1e-10 },
    { input: 1 / 3, expected: 0.3333333333333333, tolerance: 1e-15 },
    { input: Math.sqrt(2) * Math.sqrt(2), expected: 2, tolerance: 1e-15 }
  ]
}

// Touch and gesture test data
export const touchTestData = {
  singleTouch: [
    { x: 100, y: 100, pressure: 1, timestamp: 0 },
    { x: 150, y: 120, pressure: 1, timestamp: 16 },
    { x: 200, y: 140, pressure: 1, timestamp: 32 },
    { x: 250, y: 160, pressure: 1, timestamp: 48 }
  ],
  multiTouch: {
    touches: [
      { id: 0, x: 100, y: 100, pressure: 1 },
      { id: 1, x: 200, y: 200, pressure: 1 }
    ],
    gestures: {
      pinch: { scale: 0.5, rotation: 0 },
      zoom: { scale: 2.0, rotation: 0 },
      rotate: { scale: 1.0, rotation: Math.PI / 4 }
    }
  }
}

// Accessibility test data
export const a11yTestData = {
  ariaLabels: {
    node: 'Draggable funnel node',
    canvas: 'Funnel canvas workspace',
    toolbar: 'Funnel editing toolbar'
  },
  keyboardNavigation: {
    keys: ['Tab', 'Enter', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape'],
    expectations: {
      'Tab': 'moves focus to next element',
      'Enter': 'activates focused element',
      'Space': 'selects/deselects element',
      'ArrowKeys': 'moves selection'
    }
  },
  screenReader: {
    announcements: [
      'Node selected',
      'Node moved',
      'Multiple nodes selected',
      'Drag operation started',
      'Drag operation completed'
    ]
  }
}

// Physics engine test data
export const physicsTestData = {
  springAnimations: [
    { stiffness: 100, damping: 10, mass: 1 },
    { stiffness: 200, damping: 20, mass: 0.5 },
    { stiffness: 50, damping: 5, mass: 2 }
  ],
  collisionData: [
    { 
      objects: [
        { x: 100, y: 100, width: 50, height: 50, vx: 10, vy: 0 },
        { x: 200, y: 100, width: 50, height: 50, vx: -10, vy: 0 }
      ],
      expectedCollision: true
    }
  ]
}

// Smart alignment test data
export const alignmentTestData = {
  snapTargets: [
    { x: 100, y: 100, type: 'node' },
    { x: 200, y: 100, type: 'guide' },
    { x: 100, y: 200, type: 'grid' }
  ],
  snapThresholds: {
    node: 10,
    guide: 5,
    grid: 8
  },
  alignmentSuggestions: [
    { type: 'horizontal', y: 100, confidence: 0.95 },
    { type: 'vertical', x: 150, confidence: 0.88 },
    { type: 'center', x: 200, y: 200, confidence: 0.92 }
  ]
}

// Cross-platform test configurations
export const platformTestData = {
  desktop: {
    chrome: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    firefox: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0' },
    safari: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  },
  mobile: {
    ios: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15' },
    android: { userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36' }
  }
}

// Error simulation data
export const errorTestData = {
  networkErrors: [
    { type: 'timeout', delay: 30000 },
    { type: 'connection', status: 0 },
    { type: 'server', status: 500 },
    { type: 'not_found', status: 404 }
  ],
  memoryPressure: {
    lowMemory: { threshold: 0.1 },
    criticalMemory: { threshold: 0.05 }
  },
  performanceDegradation: {
    slowDevice: { frameTime: 50 },
    highLoad: { cpuUsage: 0.95 }
  }
}

// Visual regression test data
export const visualTestData = {
  viewports: [
    { width: 320, height: 568, name: 'mobile-portrait' },
    { width: 768, height: 1024, name: 'tablet-portrait' },
    { width: 1024, height: 768, name: 'tablet-landscape' },
    { width: 1440, height: 900, name: 'desktop' },
    { width: 1920, height: 1080, name: 'desktop-hd' }
  ],
  themes: ['light', 'dark', 'high-contrast'],
  screenshots: {
    baseline: './tests/visual/baselines',
    actual: './tests/visual/actual',
    diff: './tests/visual/diff'
  }
}

// Test configurations for different scenarios
export const testConfigs = {
  unit: {
    timeout: 5000,
    retries: 2
  },
  integration: {
    timeout: 10000,
    retries: 1
  },
  e2e: {
    timeout: 30000,
    retries: 3,
    headless: true
  },
  performance: {
    timeout: 60000,
    iterations: 100,
    warmupRuns: 10
  },
  stress: {
    nodeCount: 1000,
    operationCount: 10000,
    duration: 300000 // 5 minutes
  }
}

export default {
  testFunnelNodes,
  testFunnelEdges,
  performanceTestData,
  mathTestVectors,
  touchTestData,
  a11yTestData,
  physicsTestData,
  alignmentTestData,
  platformTestData,
  errorTestData,
  visualTestData,
  testConfigs
}