import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { AdvancedInteractionController } from './advanced-interaction-controller'
import { 
  TestDataGenerator,
  DragTestUtils,
  PerformanceTestUtils as PerfUtils 
} from '../../tests/helpers/test-utils'

describe('Advanced Interaction Controller', () => {
  let controller: AdvancedInteractionController
  let mockCanvas: HTMLCanvasElement
  let mockContainer: HTMLElement

  beforeEach(() => {
    // Create mock canvas and container
    mockCanvas = document.createElement('canvas')
    mockCanvas.width = 800
    mockCanvas.height = 600
    
    mockContainer = document.createElement('div')
    mockContainer.appendChild(mockCanvas)
    document.body.appendChild(mockContainer)

    controller = new AdvancedInteractionController(mockContainer, {
      enableMultiSelect: true,
      enableBatchOperations: true,
      enableAdvancedGestures: true,
      enableKeyboardNavigation: true,
      enableVoiceControl: false
    })
  })

  afterEach(() => {
    controller.destroy()
    document.body.removeChild(mockContainer)
    vi.clearAllTimers()
  })

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultController = new AdvancedInteractionController(mockContainer)
      const config = defaultController.getConfiguration()
      
      expect(config.enableMultiSelect).toBe(true)
      expect(config.enableBatchOperations).toBe(true)
      expect(config.enableAdvancedGestures).toBe(true)
      expect(config.enableKeyboardNavigation).toBe(true)
    })

    test('should register event listeners on container', () => {
      const addEventListenerSpy = vi.spyOn(mockContainer, 'addEventListener')
      
      new AdvancedInteractionController(mockContainer)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    test('should setup gesture recognition', () => {
      expect(controller.isGestureRecognitionEnabled()).toBe(true)
      
      const disabledController = new AdvancedInteractionController(mockContainer, {
        enableAdvancedGestures: false
      })
      
      expect(disabledController.isGestureRecognitionEnabled()).toBe(false)
    })
  })

  describe('Multi-Selection Management', () => {
    test('should handle single selection', () => {
      const nodeId = 'node-1'
      const selectionSpy = vi.fn()
      controller.onSelectionChange(selectionSpy)
      
      controller.selectNode(nodeId)
      
      expect(controller.getSelectedNodes()).toEqual([nodeId])
      expect(selectionSpy).toHaveBeenCalledWith({
        selected: [nodeId],
        deselected: [],
        action: 'select'
      })
    })

    test('should handle multi-selection with Ctrl key', () => {
      const nodeIds = ['node-1', 'node-2', 'node-3']
      
      controller.selectNode(nodeIds[0])
      controller.selectNode(nodeIds[1], true) // Ctrl+click
      controller.selectNode(nodeIds[2], true) // Ctrl+click
      
      const selectedNodes = controller.getSelectedNodes()
      expect(selectedNodes).toHaveLength(3)
      expect(selectedNodes).toEqual(expect.arrayContaining(nodeIds))
    })

    test('should toggle selection with Ctrl+click', () => {
      const nodeId = 'toggle-node'
      
      // First ctrl+click - select
      controller.selectNode(nodeId, true)
      expect(controller.isNodeSelected(nodeId)).toBe(true)
      
      // Second ctrl+click - deselect
      controller.selectNode(nodeId, true)
      expect(controller.isNodeSelected(nodeId)).toBe(false)
    })

    test('should clear selection when clicking empty area', () => {
      controller.selectNode('node-1')
      controller.selectNode('node-2', true)
      
      expect(controller.getSelectedNodes()).toHaveLength(2)
      
      controller.clearSelection()
      
      expect(controller.getSelectedNodes()).toHaveLength(0)
    })

    test('should support selection box drag', () => {
      const mockNodes = [
        { id: 'node-1', x: 100, y: 100, width: 80, height: 60 },
        { id: 'node-2', x: 200, y: 100, width: 80, height: 60 },
        { id: 'node-3', x: 300, y: 100, width: 80, height: 60 }
      ]
      
      mockNodes.forEach(node => controller.registerSelectableNode(node.id, node))
      
      // Start selection box
      controller.startSelectionBox(50, 50)
      controller.updateSelectionBox(350, 200)
      const selectedInBox = controller.endSelectionBox()
      
      expect(selectedInBox).toHaveLength(3)
      expect(selectedInBox).toEqual(expect.arrayContaining(['node-1', 'node-2', 'node-3']))
    })
  })

  describe('Batch Operations', () => {
    beforeEach(() => {
      // Setup test nodes
      const mockNodes = Array.from({ length: 5 }, (_, i) => ({
        id: `node-${i}`,
        x: i * 100,
        y: 100,
        width: 80,
        height: 60
      }))
      
      mockNodes.forEach(node => {
        controller.registerSelectableNode(node.id, node)
        controller.selectNode(node.id, i > 0) // Multi-select all
      })
    })

    test('should execute batch move operation', async () => {
      const moveVector = { x: 50, y: 30 }
      const progressSpy = vi.fn()
      
      const result = await controller.executeBatchOperation(
        'move',
        { delta: moveVector },
        progressSpy
      )
      
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(5)
      expect(progressSpy).toHaveBeenCalled()
    })

    test('should execute batch delete operation', async () => {
      const deleteSpy = vi.fn()
      controller.onNodeDelete(deleteSpy)
      
      const result = await controller.executeBatchOperation('delete')
      
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(5)
      expect(deleteSpy).toHaveBeenCalledTimes(5)
    })

    test('should execute batch style update operation', async () => {
      const styleUpdate = { color: '#ff0000', borderWidth: 2 }
      
      const result = await controller.executeBatchOperation(
        'style',
        { styles: styleUpdate }
      )
      
      expect(result.success).toBe(true)
      expect(result.processedCount).toBe(5)
    })

    test('should handle batch operation errors gracefully', async () => {
      const errorSpy = vi.fn()
      controller.onError(errorSpy)
      
      // Simulate error by trying to operate on non-existent nodes
      controller.clearSelection()
      controller.selectNode('non-existent-1')
      controller.selectNode('non-existent-2', true)
      
      const result = await controller.executeBatchOperation('move', { delta: { x: 10, y: 10 } })
      
      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(2)
    })

    test('should provide progress updates for long operations', async () => {
      const progressUpdates: number[] = []
      const progressCallback = (progress: number) => {
        progressUpdates.push(progress)
      }
      
      await controller.executeBatchOperation('move', { delta: { x: 10, y: 10 } }, progressCallback)
      
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0]).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    })
  })

  describe('Gesture Recognition', () => {
    test('should recognize tap gesture', () => {
      const tapSpy = vi.fn()
      controller.onGesture('tap', tapSpy)
      
      // Simulate tap
      DragTestUtils.simulateTouchDrag(
        mockContainer,
        { x: 100, y: 100 },
        { x: 100, y: 100 }, // Same position = tap
        1
      )
      
      vi.advanceTimersByTime(300) // Wait for gesture recognition
      
      expect(tapSpy).toHaveBeenCalledWith({
        type: 'tap',
        position: { x: 100, y: 100 },
        timestamp: expect.any(Number)
      })
    })

    test('should recognize long press gesture', () => {
      const longPressSpy = vi.fn()
      controller.onGesture('longpress', longPressSpy)
      
      // Simulate long press
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
        bubbles: true
      })
      mockContainer.dispatchEvent(touchStart)
      
      vi.advanceTimersByTime(800) // Long press duration
      
      expect(longPressSpy).toHaveBeenCalled()
    })

    test('should recognize swipe gestures', () => {
      const swipeSpy = vi.fn()
      controller.onGesture('swipe', swipeSpy)
      
      // Simulate swipe
      DragTestUtils.simulateTouchDrag(
        mockContainer,
        { x: 100, y: 100 },
        { x: 300, y: 100 }, // Horizontal swipe
        5
      )
      
      vi.advanceTimersByTime(100)
      
      expect(swipeSpy).toHaveBeenCalledWith({
        type: 'swipe',
        direction: 'right',
        velocity: expect.any(Number),
        distance: expect.any(Number)
      })
    })

    test('should recognize pinch/zoom gestures', () => {
      const pinchSpy = vi.fn()
      controller.onGesture('pinch', pinchSpy)
      
      // Simulate pinch gesture with two touches
      const touch1Start = { clientX: 100, clientY: 100 }
      const touch2Start = { clientX: 200, clientY: 100 }
      
      const touchStart = new TouchEvent('touchstart', {
        touches: [touch1Start as Touch, touch2Start as Touch],
        bubbles: true
      })
      mockContainer.dispatchEvent(touchStart)
      
      // Move touches closer together (pinch in)
      const touch1End = { clientX: 120, clientY: 100 }
      const touch2End = { clientX: 180, clientY: 100 }
      
      const touchMove = new TouchEvent('touchmove', {
        touches: [touch1End as Touch, touch2End as Touch],
        bubbles: true
      })
      mockContainer.dispatchEvent(touchMove)
      
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true
      })
      mockContainer.dispatchEvent(touchEnd)
      
      vi.advanceTimersByTime(100)
      
      expect(pinchSpy).toHaveBeenCalledWith({
        type: 'pinch',
        scale: expect.any(Number),
        center: expect.any(Object)
      })
    })

    test('should disable gesture recognition when configured', () => {
      const disabledController = new AdvancedInteractionController(mockContainer, {
        enableAdvancedGestures: false
      })
      
      const gestureSpy = vi.fn()
      disabledController.onGesture('tap', gestureSpy)
      
      // Simulate tap
      DragTestUtils.simulateTouchDrag(
        mockContainer,
        { x: 100, y: 100 },
        { x: 100, y: 100 },
        1
      )
      
      vi.advanceTimersByTime(300)
      
      expect(gestureSpy).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      const mockNodes = [
        { id: 'node-1', x: 100, y: 100, width: 80, height: 60 },
        { id: 'node-2', x: 200, y: 100, width: 80, height: 60 },
        { id: 'node-3', x: 100, y: 200, width: 80, height: 60 }
      ]
      
      mockNodes.forEach(node => controller.registerSelectableNode(node.id, node))
      controller.selectNode('node-1') // Start with node-1 selected
    })

    test('should navigate with arrow keys', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      })
      mockContainer.dispatchEvent(keydownEvent)
      
      expect(controller.getSelectedNodes()).toEqual(['node-2'])
    })

    test('should move selected nodes with Shift+Arrow', () => {
      const moveEventSpy = vi.fn()
      controller.onNodeMove(moveEventSpy)
      
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        shiftKey: true,
        bubbles: true
      })
      mockContainer.dispatchEvent(keydownEvent)
      
      expect(moveEventSpy).toHaveBeenCalledWith({
        nodeId: 'node-1',
        delta: { x: 0, y: expect.any(Number) },
        source: 'keyboard'
      })
    })

    test('should select all with Ctrl+A', () => {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })
      mockContainer.dispatchEvent(keydownEvent)
      
      expect(controller.getSelectedNodes()).toHaveLength(3)
    })

    test('should delete selected nodes with Delete key', () => {
      const deleteSpy = vi.fn()
      controller.onNodeDelete(deleteSpy)
      
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true
      })
      mockContainer.dispatchEvent(keydownEvent)
      
      expect(deleteSpy).toHaveBeenCalledWith('node-1')
    })

    test('should copy and paste with Ctrl+C/Ctrl+V', () => {
      const copySpy = vi.fn()
      const pasteSpy = vi.fn()
      controller.onNodeCopy(copySpy)
      controller.onNodePaste(pasteSpy)
      
      // Copy
      const copyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true
      })
      mockContainer.dispatchEvent(copyEvent)
      
      expect(copySpy).toHaveBeenCalledWith(['node-1'])
      
      // Paste
      const pasteEvent = new KeyboardEvent('keydown', {
        key: 'v',
        ctrlKey: true,
        bubbles: true
      })
      mockContainer.dispatchEvent(pasteEvent)
      
      expect(pasteSpy).toHaveBeenCalled()
    })

    test('should disable keyboard navigation when configured', () => {
      const disabledController = new AdvancedInteractionController(mockContainer, {
        enableKeyboardNavigation: false
      })
      
      // Register nodes
      const mockNode = { id: 'test-node', x: 100, y: 100, width: 80, height: 60 }
      disabledController.registerSelectableNode(mockNode.id, mockNode)
      disabledController.selectNode(mockNode.id)
      
      const moveEventSpy = vi.fn()
      disabledController.onNodeMove(moveEventSpy)
      
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      })
      mockContainer.dispatchEvent(keydownEvent)
      
      expect(moveEventSpy).not.toHaveBeenCalled()
    })
  })

  describe('Performance Optimization', () => {
    test('should handle large numbers of selectable nodes', async () => {
      const nodeCount = 1000
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `perf-node-${i}`,
        x: (i % 50) * 20,
        y: Math.floor(i / 50) * 20,
        width: 15,
        height: 15
      }))
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'register many nodes',
        () => {
          nodes.forEach(node => {
            controller.registerSelectableNode(node.id, node)
          })
        },
        1
      )
      
      expect(avgTime).toBeLessThan(200) // Should be reasonably fast
      
      // Test selection performance
      const { avgTime: selectionTime } = await PerfUtils.runBenchmark(
        'selection box with many nodes',
        () => {
          controller.startSelectionBox(0, 0)
          controller.updateSelectionBox(1000, 400)
          controller.endSelectionBox()
        },
        5
      )
      
      expect(selectionTime).toBeLessThan(100)
    })

    test('should throttle gesture recognition for performance', () => {
      const gestureSpy = vi.fn()
      controller.onGesture('tap', gestureSpy)
      
      // Fire many rapid taps
      for (let i = 0; i < 10; i++) {
        DragTestUtils.simulateTouchDrag(
          mockContainer,
          { x: 100 + i, y: 100 + i },
          { x: 100 + i, y: 100 + i },
          1
        )
      }
      
      vi.advanceTimersByTime(300)
      
      // Should have throttled the events
      expect(gestureSpy.mock.calls.length).toBeLessThan(10)
    })

    test('should efficiently update selection box', async () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `box-node-${i}`,
        x: (i % 10) * 50,
        y: Math.floor(i / 10) * 50,
        width: 40,
        height: 40
      }))
      
      nodes.forEach(node => controller.registerSelectableNode(node.id, node))
      
      const { avgTime } = await PerfUtils.runBenchmark(
        'update selection box',
        () => {
          controller.startSelectionBox(0, 0)
          for (let i = 0; i < 50; i++) {
            controller.updateSelectionBox(i * 10, i * 10)
          }
          controller.endSelectionBox()
        },
        5
      )
      
      expect(avgTime).toBeLessThan(50)
    })
  })

  describe('Context Menu Integration', () => {
    test('should show context menu on right click', () => {
      const contextMenuSpy = vi.fn()
      controller.onContextMenu(contextMenuSpy)
      
      const rightClickEvent = new MouseEvent('contextmenu', {
        button: 2,
        clientX: 150,
        clientY: 120,
        bubbles: true
      })
      mockContainer.dispatchEvent(rightClickEvent)
      
      expect(contextMenuSpy).toHaveBeenCalledWith({
        position: { x: 150, y: 120 },
        selectedNodes: controller.getSelectedNodes(),
        targetNode: null
      })
    })

    test('should show node-specific context menu', () => {
      const mockNode = { id: 'context-node', x: 100, y: 100, width: 80, height: 60 }
      controller.registerSelectableNode(mockNode.id, mockNode)
      controller.selectNode(mockNode.id)
      
      const contextMenuSpy = vi.fn()
      controller.onContextMenu(contextMenuSpy)
      
      const rightClickEvent = new MouseEvent('contextmenu', {
        button: 2,
        clientX: 140, // Inside node bounds
        clientY: 130,
        bubbles: true
      })
      mockContainer.dispatchEvent(rightClickEvent)
      
      expect(contextMenuSpy).toHaveBeenCalledWith({
        position: { x: 140, y: 130 },
        selectedNodes: ['context-node'],
        targetNode: 'context-node'
      })
    })
  })

  describe('Event System', () => {
    test('should emit interaction events', () => {
      const interactionSpy = vi.fn()
      controller.onInteraction(interactionSpy)
      
      controller.selectNode('test-node')
      
      expect(interactionSpy).toHaveBeenCalledWith({
        type: 'selection',
        detail: {
          selected: ['test-node'],
          deselected: [],
          action: 'select'
        },
        timestamp: expect.any(Number)
      })
    })

    test('should support event listener removal', () => {
      const selectionSpy = vi.fn()
      
      controller.onSelectionChange(selectionSpy)
      controller.selectNode('test-1') // Should trigger
      
      controller.offSelectionChange(selectionSpy)
      controller.selectNode('test-2') // Should not trigger
      
      expect(selectionSpy).toHaveBeenCalledTimes(1)
    })

    test('should handle event errors gracefully', () => {
      const errorThrowingSpy = vi.fn(() => {
        throw new Error('Event handler error')
      })
      
      const errorSpy = vi.fn()
      controller.onError(errorSpy)
      controller.onSelectionChange(errorThrowingSpy)
      
      controller.selectNode('error-test')
      
      expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event handler error'
      }))
    })
  })

  describe('Memory Management', () => {
    test('should clean up event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(mockContainer, 'removeEventListener')
      
      controller.destroy()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    test('should clear all registered nodes on destroy', () => {
      const mockNodes = Array.from({ length: 10 }, (_, i) => ({
        id: `cleanup-node-${i}`,
        x: i * 50, y: 100, width: 40, height: 40
      }))
      
      mockNodes.forEach(node => controller.registerSelectableNode(node.id, node))
      
      expect(controller.getRegisteredNodeCount()).toBe(10)
      
      controller.destroy()
      
      expect(controller.getRegisteredNodeCount()).toBe(0)
    })

    test('should not leak memory with frequent selections', () => {
      const nodes = Array.from({ length: 100 }, (_, i) => ({
        id: `memory-node-${i}`,
        x: i * 10, y: 100, width: 8, height: 8
      }))
      
      nodes.forEach(node => controller.registerSelectableNode(node.id, node))
      
      // Perform many selections
      for (let i = 0; i < 1000; i++) {
        const nodeIndex = i % nodes.length
        controller.selectNode(nodes[nodeIndex].id, i % 3 === 0) // Mix single and multi-select
      }
      
      // Selection state should be consistent
      const selectedNodes = controller.getSelectedNodes()
      expect(selectedNodes.length).toBeLessThan(nodes.length)
    })
  })
})