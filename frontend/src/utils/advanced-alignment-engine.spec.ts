import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  AdvancedAlignmentEngine,
  AlignmentPoint,
  AlignmentSuggestion,
  AlignmentType
} from './advanced-alignment-engine'
import { Vector2D } from './math-precision'
import { alignmentTestData } from '../../tests/fixtures/test-data'
import { PerformanceTestUtils as PerfUtils } from '../../tests/helpers/test-utils'

describe('Advanced Alignment Engine', () => {
  let alignmentEngine: AdvancedAlignmentEngine
  let mockNodes: Array<{ id: string; x: number; y: number; width: number; height: number }>

  beforeEach(() => {
    alignmentEngine = new AdvancedAlignmentEngine({
      snapThreshold: 10,
      enableSmartGuides: true,
      enableAutoAlignment: true,
      confidenceThreshold: 0.8
    })

    mockNodes = [
      { id: 'node1', x: 100, y: 100, width: 80, height: 60 },
      { id: 'node2', x: 200, y: 100, width: 80, height: 60 },
      { id: 'node3', x: 150, y: 200, width: 80, height: 60 }
    ]
  })

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const engine = new AdvancedAlignmentEngine()
      const config = engine.getConfiguration()
      
      expect(config.snapThreshold).toBe(8)
      expect(config.enableSmartGuides).toBe(true)
      expect(config.enableAutoAlignment).toBe(true)
    })

    test('should initialize with custom configuration', () => {
      const customConfig = {
        snapThreshold: 15,
        enableSmartGuides: false,
        enableAutoAlignment: true,
        confidenceThreshold: 0.9
      }
      
      const engine = new AdvancedAlignmentEngine(customConfig)
      const config = engine.getConfiguration()
      
      expect(config.snapThreshold).toBe(15)
      expect(config.enableSmartGuides).toBe(false)
      expect(config.confidenceThreshold).toBe(0.9)
    })
  })

  describe('Node Registration', () => {
    test('should register nodes for alignment calculations', () => {
      alignmentEngine.registerNode('node1', {
        x: 100, y: 100, width: 80, height: 60
      })
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      expect(alignmentPoints.length).toBeGreaterThan(0)
    })

    test('should update existing node positions', () => {
      alignmentEngine.registerNode('node1', {
        x: 100, y: 100, width: 80, height: 60
      })
      
      alignmentEngine.updateNodePosition('node1', { x: 150, y: 120 })
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const nodePoints = alignmentPoints.filter(p => p.nodeId === 'node1')
      expect(nodePoints.some(p => p.x === 150)).toBe(true)
    })

    test('should unregister nodes', () => {
      alignmentEngine.registerNode('node1', {
        x: 100, y: 100, width: 80, height: 60
      })
      
      expect(alignmentEngine.getRegisteredNodes()).toContain('node1')
      
      alignmentEngine.unregisterNode('node1')
      expect(alignmentEngine.getRegisteredNodes()).not.toContain('node1')
    })

    test('should handle multiple node registrations', () => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
      
      const registeredNodes = alignmentEngine.getRegisteredNodes()
      expect(registeredNodes).toHaveLength(3)
      expect(registeredNodes).toEqual(['node1', 'node2', 'node3'])
    })
  })

  describe('Alignment Point Generation', () => {
    beforeEach(() => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
    })

    test('should generate alignment points for registered nodes', () => {
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      
      expect(alignmentPoints.length).toBeGreaterThan(0)
      
      // Should have points for each node
      const node1Points = alignmentPoints.filter(p => p.nodeId === 'node1')
      expect(node1Points.length).toBeGreaterThan(0)
    })

    test('should generate different types of alignment points', () => {
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      
      const edgePoints = alignmentPoints.filter(p => p.type === 'edge')
      const centerPoints = alignmentPoints.filter(p => p.type === 'center')
      const cornerPoints = alignmentPoints.filter(p => p.type === 'corner')
      
      expect(edgePoints.length).toBeGreaterThan(0)
      expect(centerPoints.length).toBeGreaterThan(0)
      expect(cornerPoints.length).toBeGreaterThan(0)
    })

    test('should calculate correct alignment point positions', () => {
      const node = { x: 100, y: 100, width: 80, height: 60 }
      alignmentEngine.registerNode('test-node', node)
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const testNodePoints = alignmentPoints.filter(p => p.nodeId === 'test-node')
      
      // Check for expected positions
      const leftEdge = testNodePoints.find(p => p.type === 'edge' && p.direction === 'left')
      const rightEdge = testNodePoints.find(p => p.type === 'edge' && p.direction === 'right')
      const centerPoint = testNodePoints.find(p => p.type === 'center')
      
      expect(leftEdge?.x).toBe(100)
      expect(rightEdge?.x).toBe(180)
      expect(centerPoint?.x).toBe(140)
      expect(centerPoint?.y).toBe(130)
    })
  })

  describe('Smart Alignment Detection', () => {
    beforeEach(() => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
    })

    test('should detect horizontal alignment opportunities', () => {
      const dragPosition = { x: 100, y: 105 } // Near horizontal alignment
      const suggestions = alignmentEngine.getAlignmentSuggestions(
        'node1', dragPosition, 'node2'
      )
      
      const horizontalSuggestion = suggestions.find(s => s.type === 'horizontal')
      expect(horizontalSuggestion).toBeDefined()
      expect(horizontalSuggestion?.confidence).toBeGreaterThan(0.8)
    })

    test('should detect vertical alignment opportunities', () => {
      const dragPosition = { x: 205, y: 100 } // Near vertical alignment
      const suggestions = alignmentEngine.getAlignmentSuggestions(
        'node3', dragPosition, 'node2'
      )
      
      const verticalSuggestion = suggestions.find(s => s.type === 'vertical')
      expect(verticalSuggestion).toBeDefined()
    })

    test('should detect center alignment', () => {
      const centerX = 150 // Center of node2 (200) and node3 (150)
      const dragPosition = { x: centerX - 2, y: 300 }
      
      const suggestions = alignmentEngine.getAlignmentSuggestions(
        'node1', dragPosition
      )
      
      const centerSuggestion = suggestions.find(s => s.type === 'center')
      expect(centerSuggestion).toBeDefined()
    })

    test('should calculate confidence scores correctly', () => {
      const dragPosition = { x: 100, y: 102 } // Very close to alignment
      const suggestions = alignmentEngine.getAlignmentSuggestions(
        'node1', dragPosition
      )
      
      suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThan(0)
        expect(suggestion.confidence).toBeLessThanOrEqual(1)
      })
      
      const closeSuggestions = suggestions.filter(s => s.confidence > 0.9)
      expect(closeSuggestions.length).toBeGreaterThan(0)
    })

    test('should use test data for alignment detection', () => {
      alignmentTestData.snapTargets.forEach(target => {
        alignmentEngine.registerNode(`test-${target.type}`, {
          x: target.x - 40, y: target.y - 30,
          width: 80, height: 60
        })
      })
      
      const suggestions = alignmentEngine.getAlignmentSuggestions(
        'node1', { x: alignmentTestData.snapTargets[0].x + 2, y: alignmentTestData.snapTargets[0].y }
      )
      
      expect(suggestions.length).toBeGreaterThan(0)
    })
  })

  describe('Snapping Behavior', () => {
    beforeEach(() => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
    })

    test('should snap to nearby alignment points', () => {
      const nearbyPosition = { x: 102, y: 98 } // Close to node1
      const snappedPosition = alignmentEngine.snapToAlignment('node2', nearbyPosition)
      
      expect(snappedPosition.x).toBeCloseTo(100, 0)
      expect(snappedPosition.y).toBeCloseTo(100, 0)
    })

    test('should not snap when distance exceeds threshold', () => {
      const farPosition = { x: 120, y: 120 } // Far from alignment
      const snappedPosition = alignmentEngine.snapToAlignment('node2', farPosition)
      
      expect(snappedPosition.x).toBe(farPosition.x)
      expect(snappedPosition.y).toBe(farPosition.y)
    })

    test('should respect snap threshold configuration', () => {
      alignmentEngine.updateConfiguration({ snapThreshold: 5 })
      
      const position = { x: 107, y: 100 } // Within old threshold but outside new
      const snappedPosition = alignmentEngine.snapToAlignment('node2', position)
      
      expect(snappedPosition.x).toBe(position.x) // Should not snap
    })

    test('should prefer stronger alignment suggestions', () => {
      const position = { x: 101, y: 101 } // Close to both horizontal and vertical alignment
      const snappedPosition = alignmentEngine.snapToAlignment('node2', position)
      
      // Should snap to the strongest alignment (likely both x and y)
      expect(snappedPosition.x).toBeCloseTo(100, 1)
      expect(snappedPosition.y).toBeCloseTo(100, 1)
    })
  })

  describe('Smart Guide Generation', () => {
    beforeEach(() => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
    })

    test('should generate alignment guides', () => {
      const dragPosition = { x: 105, y: 100 }
      const guides = alignmentEngine.getSmartGuides('node1', dragPosition)
      
      expect(guides.length).toBeGreaterThan(0)
      guides.forEach(guide => {
        expect(guide).toHaveProperty('type')
        expect(guide).toHaveProperty('position')
        expect(guide).toHaveProperty('confidence')
      })
    })

    test('should generate guides only when enabled', () => {
      alignmentEngine.updateConfiguration({ enableSmartGuides: false })
      
      const dragPosition = { x: 105, y: 100 }
      const guides = alignmentEngine.getSmartGuides('node1', dragPosition)
      
      expect(guides).toHaveLength(0)
    })

    test('should filter guides by confidence threshold', () => {
      alignmentEngine.updateConfiguration({ confidenceThreshold: 0.95 })
      
      const dragPosition = { x: 110, y: 105 } // Moderate alignment
      const guides = alignmentEngine.getSmartGuides('node1', dragPosition)
      
      guides.forEach(guide => {
        expect(guide.confidence).toBeGreaterThanOrEqual(0.95)
      })
    })
  })

  describe('Performance Optimization', () => {
    test('should handle large numbers of nodes efficiently', async () => {
      const nodeCount = 100
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `node-${i}`,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        width: 80,
        height: 60
      }))
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'register many nodes',
        () => {
          nodes.forEach(node => {
            alignmentEngine.registerNode(node.id, {
              x: node.x, y: node.y, width: node.width, height: node.height
            })
          })
        },
        1
      )
      
      expect(avgTime).toBeLessThan(100) // Should be fast
    })

    test('should cache alignment calculations', async () => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
      
      const position = { x: 105, y: 100 }
      
      // First calculation
      const { avgTime: firstTime } = await PerfUtils.runBenchmark(
        'first alignment calculation',
        () => alignmentEngine.getAlignmentSuggestions('node1', position),
        10
      )
      
      // Cached calculations should be faster or same
      const { avgTime: cachedTime } = await PerfUtils.runBenchmark(
        'cached alignment calculation',
        () => alignmentEngine.getAlignmentSuggestions('node1', position),
        10
      )
      
      expect(cachedTime).toBeLessThanOrEqual(firstTime * 1.2) // Allow some variance
    })

    test('should efficiently update node positions', async () => {
      const nodeIds = Array.from({ length: 50 }, (_, i) => `node-${i}`)
      
      nodeIds.forEach((id, i) => {
        alignmentEngine.registerNode(id, {
          x: i * 20, y: i * 20, width: 80, height: 60
        })
      })
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'update node positions',
        () => {
          nodeIds.forEach((id, i) => {
            alignmentEngine.updateNodePosition(id, {
              x: i * 20 + 10, y: i * 20 + 10
            })
          })
        },
        5
      )
      
      expect(avgTime).toBeLessThan(50)
    })
  })

  describe('Grid Alignment', () => {
    test('should snap to grid when enabled', () => {
      alignmentEngine.updateConfiguration({
        enableGridAlignment: true,
        gridSize: 20
      })
      
      const position = { x: 23, y: 17 }
      const snappedPosition = alignmentEngine.snapToAlignment('node1', position)
      
      expect(snappedPosition.x).toBe(20)
      expect(snappedPosition.y).toBe(20)
    })

    test('should respect custom grid sizes', () => {
      alignmentEngine.updateConfiguration({
        enableGridAlignment: true,
        gridSize: 25
      })
      
      const position = { x: 38, y: 37 }
      const snappedPosition = alignmentEngine.snapToAlignment('node1', position)
      
      expect(snappedPosition.x).toBe(50) // 38 closer to 50 than 25
      expect(snappedPosition.y).toBe(50)
    })

    test('should disable grid alignment when configured', () => {
      alignmentEngine.updateConfiguration({
        enableGridAlignment: false,
        gridSize: 20
      })
      
      const position = { x: 23, y: 17 }
      const snappedPosition = alignmentEngine.snapToAlignment('node1', position)
      
      expect(snappedPosition.x).toBe(23) // Should not snap to grid
      expect(snappedPosition.y).toBe(17)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty node set', () => {
      const suggestions = alignmentEngine.getAlignmentSuggestions('nonexistent', { x: 100, y: 100 })
      expect(suggestions).toHaveLength(0)
    })

    test('should handle invalid node positions', () => {
      expect(() => {
        alignmentEngine.registerNode('invalid', {
          x: NaN, y: NaN, width: 80, height: 60
        })
      }).not.toThrow()
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const invalidNodePoints = alignmentPoints.filter(p => p.nodeId === 'invalid')
      expect(invalidNodePoints).toHaveLength(0)
    })

    test('should handle negative positions', () => {
      alignmentEngine.registerNode('negative', {
        x: -100, y: -50, width: 80, height: 60
      })
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const negativeNodePoints = alignmentPoints.filter(p => p.nodeId === 'negative')
      expect(negativeNodePoints.length).toBeGreaterThan(0)
    })

    test('should handle very small node dimensions', () => {
      alignmentEngine.registerNode('tiny', {
        x: 100, y: 100, width: 1, height: 1
      })
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const tinyNodePoints = alignmentPoints.filter(p => p.nodeId === 'tiny')
      expect(tinyNodePoints.length).toBeGreaterThan(0)
    })

    test('should handle concurrent node updates', async () => {
      const nodeIds = Array.from({ length: 10 }, (_, i) => `concurrent-${i}`)
      
      // Register nodes
      nodeIds.forEach((id, i) => {
        alignmentEngine.registerNode(id, {
          x: i * 50, y: i * 50, width: 80, height: 60
        })
      })
      
      // Update all positions concurrently
      const updates = nodeIds.map((id, i) => 
        alignmentEngine.updateNodePosition(id, {
          x: i * 50 + 25, y: i * 50 + 25
        })
      )
      
      await Promise.all(updates)
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      expect(alignmentPoints.length).toBeGreaterThan(0)
    })
  })

  describe('Configuration Management', () => {
    test('should update configuration dynamically', () => {
      const initialConfig = alignmentEngine.getConfiguration()
      
      alignmentEngine.updateConfiguration({
        snapThreshold: 15,
        enableAutoAlignment: false
      })
      
      const updatedConfig = alignmentEngine.getConfiguration()
      
      expect(updatedConfig.snapThreshold).toBe(15)
      expect(updatedConfig.enableAutoAlignment).toBe(false)
      expect(updatedConfig.enableSmartGuides).toBe(initialConfig.enableSmartGuides) // Unchanged
    })

    test('should validate configuration values', () => {
      alignmentEngine.updateConfiguration({
        snapThreshold: -5, // Invalid
        confidenceThreshold: 1.5 // Invalid
      })
      
      const config = alignmentEngine.getConfiguration()
      expect(config.snapThreshold).toBeGreaterThan(0)
      expect(config.confidenceThreshold).toBeLessThanOrEqual(1)
    })

    test('should emit configuration change events', () => {
      const configChangeSpy = vi.fn()
      alignmentEngine.onConfigurationChange(configChangeSpy)
      
      alignmentEngine.updateConfiguration({ snapThreshold: 12 })
      
      expect(configChangeSpy).toHaveBeenCalledWith({
        snapThreshold: 12
      })
    })
  })

  describe('Memory Management', () => {
    test('should clean up resources when destroyed', () => {
      mockNodes.forEach(node => {
        alignmentEngine.registerNode(node.id, {
          x: node.x, y: node.y, width: node.width, height: node.height
        })
      })
      
      expect(alignmentEngine.getRegisteredNodes()).toHaveLength(3)
      
      alignmentEngine.destroy()
      
      expect(alignmentEngine.getRegisteredNodes()).toHaveLength(0)
      expect(alignmentEngine.getAlignmentPoints()).toHaveLength(0)
    })

    test('should not leak memory with frequent updates', () => {
      const nodeId = 'memory-test'
      alignmentEngine.registerNode(nodeId, {
        x: 100, y: 100, width: 80, height: 60
      })
      
      // Perform many updates
      for (let i = 0; i < 1000; i++) {
        alignmentEngine.updateNodePosition(nodeId, {
          x: 100 + i % 10, y: 100 + i % 10
        })
      }
      
      const alignmentPoints = alignmentEngine.getAlignmentPoints()
      const nodePoints = alignmentPoints.filter(p => p.nodeId === nodeId)
      
      // Should have reasonable number of points (not accumulated from all updates)
      expect(nodePoints.length).toBeLessThan(20)
    })
  })
})