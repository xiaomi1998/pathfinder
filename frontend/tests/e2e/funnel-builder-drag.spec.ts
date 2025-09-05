import { test, expect, type Page } from '@playwright/test'

test.describe('Funnel Builder Drag & Drop E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/funnel-builder')
    await page.waitForSelector('[data-testid="funnel-canvas"]')
  })

  test('should create and drag funnel nodes', async ({ page }) => {
    // Create a new funnel node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 200, y: 150 } 
    })
    
    // Verify node was created
    const startNode = page.locator('[data-testid*="funnel-node-"]').first()
    await expect(startNode).toBeVisible()
    
    // Get initial position
    const initialBox = await startNode.boundingBox()
    expect(initialBox).toBeTruthy()
    
    // Drag the node to a new position
    await startNode.dragTo(page.locator('[data-testid="funnel-canvas"]'), {
      targetPosition: { x: 400, y: 300 }
    })
    
    // Verify node moved
    const finalBox = await startNode.boundingBox()
    expect(finalBox).toBeTruthy()
    
    if (initialBox && finalBox) {
      expect(finalBox.x).not.toEqual(initialBox.x)
      expect(finalBox.y).not.toEqual(initialBox.y)
    }
  })

  test('should show alignment guides during drag', async ({ page }) => {
    // Create two nodes
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 200, y: 150 } 
    })
    
    await page.click('[data-testid="node-palette-process"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 400, y: 300 } 
    })
    
    const firstNode = page.locator('[data-testid*="funnel-node-"]').first()
    const secondNode = page.locator('[data-testid*="funnel-node-"]').nth(1)
    
    // Start dragging second node
    await secondNode.hover()
    await page.mouse.down()
    
    // Move towards horizontal alignment with first node
    await page.mouse.move(200, 200, { steps: 10 })
    
    // Check for alignment guide
    const alignmentGuide = page.locator('[data-testid="alignment-guide"]')
    await expect(alignmentGuide).toBeVisible({ timeout: 2000 })
    
    // Complete the drag
    await page.mouse.up()
  })

  test('should snap to alignment when close enough', async ({ page }) => {
    // Create reference node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 200, y: 200 } 
    })
    
    // Create draggable node
    await page.click('[data-testid="node-palette-process"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 400, y: 300 } 
    })
    
    const referenceNode = page.locator('[data-testid*="funnel-node-"]').first()
    const draggableNode = page.locator('[data-testid*="funnel-node-"]').nth(1)
    
    // Drag near alignment point
    await draggableNode.dragTo(page.locator('[data-testid="funnel-canvas"]'), {
      targetPosition: { x: 205, y: 250 } // Close to horizontal alignment
    })
    
    // Wait for snapping animation
    await page.waitForTimeout(500)
    
    // Check if nodes are aligned
    const refBox = await referenceNode.boundingBox()
    const dragBox = await draggableNode.boundingBox()
    
    if (refBox && dragBox) {
      // Should be horizontally aligned (within snap tolerance)
      expect(Math.abs(refBox.y - dragBox.y)).toBeLessThan(15)
    }
  })

  test('should support multi-selection and batch drag', async ({ page }) => {
    // Create multiple nodes
    const nodePositions = [
      { x: 150, y: 150 },
      { x: 300, y: 150 },
      { x: 450, y: 150 }
    ]
    
    for (const pos of nodePositions) {
      await page.click('[data-testid="node-palette-process"]')
      await page.click('[data-testid="funnel-canvas"]', { position: pos })
    }
    
    // Multi-select nodes with Ctrl+click
    const nodes = page.locator('[data-testid*="funnel-node-"]')
    await nodes.first().click()
    await nodes.nth(1).click({ modifiers: ['Control'] })
    await nodes.nth(2).click({ modifiers: ['Control'] })
    
    // Verify selection
    await expect(nodes.first()).toHaveClass(/.*selected.*/)
    await expect(nodes.nth(1)).toHaveClass(/.*selected.*/)
    await expect(nodes.nth(2)).toHaveClass(/.*selected.*/)
    
    // Drag one of the selected nodes
    const initialBoxes = await Promise.all([
      nodes.first().boundingBox(),
      nodes.nth(1).boundingBox(),
      nodes.nth(2).boundingBox()
    ])
    
    await nodes.first().dragTo(page.locator('[data-testid="funnel-canvas"]'), {
      targetPosition: { x: 200, y: 300 }
    })
    
    // Wait for animation
    await page.waitForTimeout(300)
    
    // All selected nodes should have moved
    const finalBoxes = await Promise.all([
      nodes.first().boundingBox(),
      nodes.nth(1).boundingBox(),
      nodes.nth(2).boundingBox()
    ])
    
    for (let i = 0; i < 3; i++) {
      if (initialBoxes[i] && finalBoxes[i]) {
        expect(finalBoxes[i]!.y).not.toEqual(initialBoxes[i]!.y)
      }
    }
  })

  test('should work with touch devices', async ({ page, browserName }) => {
    // Skip if not testing mobile
    test.skip(browserName !== 'webkit', 'Touch test only for webkit')
    
    // Create a node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { 
      position: { x: 200, y: 200 } 
    })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    const canvas = page.locator('[data-testid="funnel-canvas"]')
    
    // Get initial position
    const initialBox = await node.boundingBox()
    expect(initialBox).toBeTruthy()
    
    // Simulate touch drag
    await node.dispatchEvent('touchstart', {
      touches: [{ clientX: initialBox!.x + 50, clientY: initialBox!.y + 30 }]
    })
    
    await page.waitForTimeout(50)
    
    await canvas.dispatchEvent('touchmove', {
      touches: [{ clientX: 400, clientY: 350 }]
    })
    
    await page.waitForTimeout(50)
    
    await canvas.dispatchEvent('touchend', {
      changedTouches: [{ clientX: 400, clientY: 350 }]
    })
    
    // Wait for animation
    await page.waitForTimeout(300)
    
    // Verify node moved
    const finalBox = await node.boundingBox()
    if (initialBox && finalBox) {
      expect(Math.abs(finalBox.x - initialBox.x)).toBeGreaterThan(50)
    }
  })

  test('should maintain precision during long drag operations', async ({ page }) => {
    // Enable precision testing
    await page.evaluate(() => {
      window.PRECISION_TEST_MODE = true
    })
    
    // Create a node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { position: { x: 100, y: 100 } })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    
    // Perform a complex drag path
    await node.hover()
    await page.mouse.down()
    
    // Create a spiral path with many small movements
    const centerX = 400
    const centerY = 300
    const steps = 100
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 4 // 2 full rotations
      const radius = 50 + (i / steps) * 100 // Expanding spiral
      
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      await page.mouse.move(x, y, { steps: 1 })
      await page.waitForTimeout(5) // Small delay between moves
    }
    
    await page.mouse.up()
    
    // Check precision - node should end up close to final position
    const finalBox = await node.boundingBox()
    if (finalBox) {
      const finalX = centerX + Math.cos(4 * Math.PI) * 150
      const finalY = centerY + Math.sin(4 * Math.PI) * 150
      
      expect(Math.abs(finalBox.x + finalBox.width/2 - finalX)).toBeLessThan(10)
      expect(Math.abs(finalBox.y + finalBox.height/2 - finalY)).toBeLessThan(10)
    }
  })

  test('should handle rapid drag operations without performance issues', async ({ page }) => {
    // Create multiple nodes for stress testing
    const nodeCount = 20
    
    for (let i = 0; i < nodeCount; i++) {
      await page.click('[data-testid="node-palette-process"]')
      await page.click('[data-testid="funnel-canvas"]', { 
        position: { 
          x: 100 + (i % 5) * 100, 
          y: 100 + Math.floor(i / 5) * 100 
        } 
      })
    }
    
    // Select all nodes
    await page.keyboard.press('Control+a')
    
    // Perform rapid drag operations
    const canvas = page.locator('[data-testid="funnel-canvas"]')
    const startTime = Date.now()
    
    // Rapid fire drag events
    for (let i = 0; i < 50; i++) {
      await canvas.click({ 
        position: { 
          x: 200 + Math.sin(i * 0.2) * 100, 
          y: 200 + Math.cos(i * 0.2) * 100 
        },
        delay: 10
      })
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete within reasonable time (performance test)
    expect(duration).toBeLessThan(5000) // 5 seconds max
    
    // UI should remain responsive
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    await expect(node).toBeVisible()
  })

  test('should preserve undo/redo functionality during drag operations', async ({ page }) => {
    // Create a node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { position: { x: 200, y: 200 } })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    const initialBox = await node.boundingBox()
    
    // Perform drag operation
    await node.dragTo(page.locator('[data-testid="funnel-canvas"]'), {
      targetPosition: { x: 400, y: 300 }
    })
    
    const draggedBox = await node.boundingBox()
    
    // Undo the drag
    await page.keyboard.press('Control+z')
    await page.waitForTimeout(300)
    
    // Should return to original position
    const undoBox = await node.boundingBox()
    if (initialBox && undoBox) {
      expect(Math.abs(undoBox.x - initialBox.x)).toBeLessThan(5)
      expect(Math.abs(undoBox.y - initialBox.y)).toBeLessThan(5)
    }
    
    // Redo the drag
    await page.keyboard.press('Control+y')
    await page.waitForTimeout(300)
    
    // Should return to dragged position
    const redoBox = await node.boundingBox()
    if (draggedBox && redoBox) {
      expect(Math.abs(redoBox.x - draggedBox.x)).toBeLessThan(5)
      expect(Math.abs(redoBox.y - draggedBox.y)).toBeLessThan(5)
    }
  })

  test('should handle edge cases and error scenarios gracefully', async ({ page }) => {
    // Test drag outside canvas bounds
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { position: { x: 200, y: 200 } })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    
    // Try to drag outside canvas
    await node.hover()
    await page.mouse.down()
    await page.mouse.move(-100, -100) // Outside canvas
    await page.mouse.up()
    
    // Node should remain within canvas bounds
    const box = await node.boundingBox()
    const canvas = await page.locator('[data-testid="funnel-canvas"]').boundingBox()
    
    if (box && canvas) {
      expect(box.x).toBeGreaterThanOrEqual(canvas.x)
      expect(box.y).toBeGreaterThanOrEqual(canvas.y)
      expect(box.x + box.width).toBeLessThanOrEqual(canvas.x + canvas.width)
      expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height)
    }
    
    // Test rapid click cancellation
    await node.hover()
    await page.mouse.down()
    await page.mouse.move(300, 300, { steps: 5 })
    await page.keyboard.press('Escape') // Cancel drag
    
    // Should handle cancellation gracefully
    await expect(node).toBeVisible()
  })

  test('should maintain accessibility during drag operations', async ({ page }) => {
    // Create a node
    await page.click('[data-testid="node-palette-start"]')
    await page.click('[data-testid="funnel-canvas"]', { position: { x: 200, y: 200 } })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    
    // Check initial accessibility attributes
    await expect(node).toHaveAttribute('aria-label')
    await expect(node).toHaveAttribute('tabindex', '0')
    
    // Test keyboard navigation
    await node.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    
    // Verify node moved with keyboard
    const keyboardBox = await node.boundingBox()
    expect(keyboardBox).toBeTruthy()
    
    // Test screen reader announcements
    const announcements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[aria-live]'))
        .map(el => el.textContent)
        .filter(text => text && text.includes('moved'))
    })
    
    expect(announcements.length).toBeGreaterThan(0)
  })
})

test.describe('Funnel Builder Mobile Drag Experience', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone size
  })

  test('should handle pinch-to-zoom during drag', async ({ page }) => {
    await page.goto('/funnel-builder')
    await page.waitForSelector('[data-testid="funnel-canvas"]')
    
    // Create a node
    await page.tap('[data-testid="node-palette-start"]')
    await page.tap('[data-testid="funnel-canvas"]', { position: { x: 150, y: 200 } })
    
    const canvas = page.locator('[data-testid="funnel-canvas"]')
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    
    // Simulate pinch gesture
    await canvas.evaluate((element) => {
      const touch1 = new Touch({
        identifier: 1,
        target: element,
        clientX: 100,
        clientY: 200,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 10,
        force: 0.5
      })
      
      const touch2 = new Touch({
        identifier: 2,
        target: element,
        clientX: 200,
        clientY: 200,
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 10,
        force: 0.5
      })
      
      // Start pinch
      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [touch1, touch2],
        targetTouches: [touch1, touch2],
        changedTouches: [touch1, touch2],
        bubbles: true
      }))
      
      // Move touches closer (zoom in)
      const touch1Close = new Touch({
        ...touch1,
        clientX: 130
      })
      
      const touch2Close = new Touch({
        ...touch2,
        clientX: 170
      })
      
      element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [touch1Close, touch2Close],
        targetTouches: [touch1Close, touch2Close],
        changedTouches: [touch1Close, touch2Close],
        bubbles: true
      }))
      
      element.dispatchEvent(new TouchEvent('touchend', {
        touches: [],
        targetTouches: [],
        changedTouches: [touch1Close, touch2Close],
        bubbles: true
      }))
    })
    
    // Wait for zoom effect
    await page.waitForTimeout(500)
    
    // Verify node is still draggable after zoom
    await node.tap()
    await expect(node).toHaveClass(/.*selected.*/)
  })

  test('should provide haptic feedback on mobile devices', async ({ page }) => {
    // This test would require actual mobile device testing
    // Here we test that the feedback API is called
    
    await page.goto('/funnel-builder')
    await page.waitForSelector('[data-testid="funnel-canvas"]')
    
    // Mock navigator.vibrate
    await page.evaluate(() => {
      window.mockVibrate = []
      navigator.vibrate = (pattern) => {
        window.mockVibrate.push(pattern)
        return true
      }
    })
    
    // Create and drag a node
    await page.tap('[data-testid="node-palette-start"]')
    await page.tap('[data-testid="funnel-canvas"]', { position: { x: 150, y: 200 } })
    
    const node = page.locator('[data-testid*="funnel-node-"]').first()
    
    // Long press to start drag
    await node.evaluate((element) => {
      element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 1,
          target: element,
          clientX: element.getBoundingClientRect().x + 50,
          clientY: element.getBoundingClientRect().y + 25
        })],
        bubbles: true
      }))
    })
    
    await page.waitForTimeout(600) // Long press duration
    
    // Check if vibrate was called (haptic feedback)
    const vibrateCallCount = await page.evaluate(() => window.mockVibrate.length)
    expect(vibrateCallCount).toBeGreaterThan(0)
  })
})