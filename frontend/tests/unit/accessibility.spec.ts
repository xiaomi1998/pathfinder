import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { AccessibilityCore } from '../../src/utils/accessibility-core'
import { KeyboardNavigationSystem } from '../../src/utils/keyboard-navigation-system'
import { ScreenReaderSupport } from '../../src/utils/screen-reader-support'
import { VoiceControlSystem } from '../../src/utils/voice-control-system'
import { VisualAccessibilitySystem } from '../../src/utils/visual-accessibility-system'
import { AriaEnhancedSystem } from '../../src/utils/aria-enhanced-system'
import { a11yTestData } from '../fixtures/test-data'
import { TestDataGenerator } from '../helpers/test-utils'

describe('Accessibility Systems', () => {
  let container: HTMLElement
  let accessibilityCore: AccessibilityCore
  let keyboardNav: KeyboardNavigationSystem
  let screenReader: ScreenReaderSupport
  let voiceControl: VoiceControlSystem
  let visualA11y: VisualAccessibilitySystem
  let ariaSystem: AriaEnhancedSystem

  beforeEach(() => {
    container = document.createElement('div')
    container.setAttribute('role', 'application')
    container.setAttribute('aria-label', 'Funnel Builder Canvas')
    document.body.appendChild(container)

    accessibilityCore = new AccessibilityCore({
      enableKeyboardNavigation: true,
      enableScreenReader: true,
      enableVoiceControl: true,
      enableHighContrast: true,
      enableFocusManagement: true,
      wcagLevel: 'AA'
    })

    keyboardNav = new KeyboardNavigationSystem(container)
    screenReader = new ScreenReaderSupport()
    voiceControl = new VoiceControlSystem(container)
    visualA11y = new VisualAccessibilitySystem(container)
    ariaSystem = new AriaEnhancedSystem(container)
  })

  afterEach(() => {
    accessibilityCore.destroy()
    keyboardNav.destroy()
    screenReader.destroy()
    voiceControl.destroy()
    visualA11y.destroy()
    ariaSystem.destroy()
    document.body.removeChild(container)
    vi.clearAllTimers()
  })

  describe('Accessibility Core', () => {
    test('should initialize with WCAG AA compliance', () => {
      const config = accessibilityCore.getConfiguration()
      
      expect(config.wcagLevel).toBe('AA')
      expect(config.enableKeyboardNavigation).toBe(true)
      expect(config.enableScreenReader).toBe(true)
      expect(config.enableFocusManagement).toBe(true)
    })

    test('should validate WCAG compliance', async () => {
      const complianceReport = await accessibilityCore.validateWCAGCompliance(container)
      
      expect(complianceReport).toHaveProperty('level')
      expect(complianceReport).toHaveProperty('violations')
      expect(complianceReport).toHaveProperty('passed')
      expect(complianceReport).toHaveProperty('score')
      
      expect(complianceReport.level).toBe('AA')
      expect(complianceReport.score).toBeGreaterThan(0.8)
    })

    test('should detect and report accessibility issues', () => {
      // Create element with accessibility issues
      const problematicElement = document.createElement('button')
      // Missing accessible name
      problematicElement.style.backgroundColor = '#888' // Low contrast
      container.appendChild(problematicElement)
      
      const issues = accessibilityCore.auditAccessibility(container)
      
      expect(issues.length).toBeGreaterThan(0)
      
      const missingNameIssue = issues.find(issue => 
        issue.rule === 'button-name' || issue.rule === 'accessible-name'
      )
      expect(missingNameIssue).toBeDefined()
      
      const contrastIssue = issues.find(issue => 
        issue.rule === 'color-contrast'
      )
      expect(contrastIssue).toBeDefined()
    })

    test('should provide accessibility recommendations', () => {
      const element = document.createElement('div')
      element.setAttribute('role', 'button')
      // Missing required attributes for button role
      
      const recommendations = accessibilityCore.getRecommendations(element)
      
      expect(recommendations.length).toBeGreaterThan(0)
      
      const nameRecommendation = recommendations.find(rec => 
        rec.property === 'aria-label' || rec.property === 'aria-labelledby'
      )
      expect(nameRecommendation).toBeDefined()
      
      const keyboardRecommendation = recommendations.find(rec => 
        rec.property === 'tabindex'
      )
      expect(keyboardRecommendation).toBeDefined()
    })
  })

  describe('Keyboard Navigation System', () => {
    beforeEach(() => {
      // Create test nodes for navigation
      const testNodes = [
        { id: 'node-1', x: 100, y: 100, label: 'Start Node' },
        { id: 'node-2', x: 300, y: 100, label: 'Process Node' },
        { id: 'node-3', x: 500, y: 100, label: 'End Node' }
      ]
      
      testNodes.forEach(node => {
        const element = document.createElement('div')
        element.id = node.id
        element.setAttribute('role', 'button')
        element.setAttribute('aria-label', node.label)
        element.setAttribute('tabindex', '0')
        element.style.position = 'absolute'
        element.style.left = `${node.x}px`
        element.style.top = `${node.y}px`
        element.style.width = '80px'
        element.style.height = '60px'
        container.appendChild(element)
        
        keyboardNav.registerFocusableElement(element, {
          priority: 1,
          group: 'nodes'
        })
      })
    })

    test('should handle keyboard navigation with arrow keys', () => {
      const firstNode = container.querySelector('#node-1') as HTMLElement
      const secondNode = container.querySelector('#node-2') as HTMLElement
      
      firstNode.focus()
      expect(document.activeElement).toBe(firstNode)
      
      // Press right arrow
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      })
      container.dispatchEvent(rightArrowEvent)
      
      expect(document.activeElement).toBe(secondNode)
    })

    test('should support spatial navigation', () => {
      const topNode = container.querySelector('#node-1') as HTMLElement
      const middleNode = container.querySelector('#node-2') as HTMLElement
      
      // Create node below middle node
      const bottomNode = document.createElement('div')
      bottomNode.id = 'node-4'
      bottomNode.setAttribute('role', 'button')
      bottomNode.setAttribute('aria-label', 'Bottom Node')
      bottomNode.setAttribute('tabindex', '0')
      bottomNode.style.position = 'absolute'
      bottomNode.style.left = '300px'
      bottomNode.style.top = '200px'
      bottomNode.style.width = '80px'
      bottomNode.style.height = '60px'
      container.appendChild(bottomNode)
      
      keyboardNav.registerFocusableElement(bottomNode, {
        priority: 1,
        group: 'nodes'
      })
      
      middleNode.focus()
      
      // Press down arrow
      const downArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      })
      container.dispatchEvent(downArrowEvent)
      
      expect(document.activeElement).toBe(bottomNode)
    })

    test('should handle keyboard shortcuts', () => {
      const shortcutSpy = vi.fn()
      keyboardNav.registerShortcut('Control+a', shortcutSpy, 'Select all')
      
      const ctrlAEvent = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true
      })
      container.dispatchEvent(ctrlAEvent)
      
      expect(shortcutSpy).toHaveBeenCalled()
    })

    test('should support focus trapping', () => {
      const modal = document.createElement('div')
      modal.setAttribute('role', 'dialog')
      modal.setAttribute('aria-modal', 'true')
      
      const closeButton = document.createElement('button')
      closeButton.textContent = 'Close'
      closeButton.setAttribute('tabindex', '0')
      modal.appendChild(closeButton)
      
      const submitButton = document.createElement('button')
      submitButton.textContent = 'Submit'
      submitButton.setAttribute('tabindex', '0')
      modal.appendChild(submitButton)
      
      container.appendChild(modal)
      
      keyboardNav.createFocusTrap(modal)
      
      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)
      
      // Tab should cycle within modal
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true
      })
      closeButton.dispatchEvent(tabEvent)
      
      expect(document.activeElement).toBe(submitButton)
    })

    test('should provide keyboard navigation announcements', () => {
      const announcementSpy = vi.fn()
      keyboardNav.onAnnouncement(announcementSpy)
      
      const node = container.querySelector('#node-1') as HTMLElement
      node.focus()
      
      const rightArrowEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true
      })
      container.dispatchEvent(rightArrowEvent)
      
      expect(announcementSpy).toHaveBeenCalledWith(
        expect.stringContaining('navigated to')
      )
    })

    test('should use test data for keyboard navigation', () => {
      const { keys, expectations } = a11yTestData.keyboardNavigation
      
      keys.forEach(key => {
        const expectation = expectations[key]
        const keyEvent = new KeyboardEvent('keydown', {
          key,
          bubbles: true
        })
        
        const handlerSpy = vi.fn()
        keyboardNav.onKeyAction(key, handlerSpy)
        
        container.dispatchEvent(keyEvent)
        
        expect(handlerSpy).toHaveBeenCalled()
      })
    })
  })

  describe('Screen Reader Support', () => {
    test('should create live regions for announcements', () => {
      screenReader.announce('Test announcement')
      
      const liveRegion = document.querySelector('[aria-live="polite"]')
      expect(liveRegion).toBeTruthy()
      expect(liveRegion?.textContent).toContain('Test announcement')
    })

    test('should handle different announcement priorities', () => {
      screenReader.announce('Low priority', 'polite')
      screenReader.announce('High priority', 'assertive')
      
      const politeRegion = document.querySelector('[aria-live="polite"]')
      const assertiveRegion = document.querySelector('[aria-live="assertive"]')
      
      expect(politeRegion?.textContent).toContain('Low priority')
      expect(assertiveRegion?.textContent).toContain('High priority')
    })

    test('should provide drag and drop announcements', () => {
      const dragStartSpy = vi.fn()
      const dragEndSpy = vi.fn()
      
      screenReader.onDragStart(dragStartSpy)
      screenReader.onDragEnd(dragEndSpy)
      
      const element = document.createElement('div')
      element.setAttribute('aria-label', 'Test Node')
      
      screenReader.announceDragStart(element)
      screenReader.announceDragEnd(element, { x: 100, y: 50 })
      
      expect(dragStartSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Node')
      )
      expect(dragEndSpy).toHaveBeenCalledWith(
        expect.stringContaining('moved')
      )
    })

    test('should describe spatial relationships', () => {
      const node1 = { id: 'node1', x: 100, y: 100, label: 'Start' }
      const node2 = { id: 'node2', x: 300, y: 100, label: 'End' }
      
      const relationship = screenReader.describeSpatialRelationship(node1, node2)
      
      expect(relationship).toContain('to the right of')
      expect(relationship).toContain('Start')
      expect(relationship).toContain('End')
    })

    test('should provide context-aware descriptions', () => {
      const funnelNode = document.createElement('div')
      funnelNode.setAttribute('role', 'button')
      funnelNode.setAttribute('aria-label', 'Landing Page')
      funnelNode.setAttribute('data-node-type', 'start')
      funnelNode.setAttribute('data-conversion-rate', '75%')
      
      const description = screenReader.generateContextDescription(funnelNode)
      
      expect(description).toContain('Landing Page')
      expect(description).toContain('start')
      expect(description).toContain('75%')
    })

    test('should use screen reader test data', () => {
      const { announcements } = a11yTestData.screenReader
      
      announcements.forEach(announcement => {
        screenReader.announce(announcement)
        
        const liveRegion = document.querySelector('[aria-live]')
        expect(liveRegion?.textContent).toContain(announcement)
      })
    })
  })

  describe('Voice Control System', () => {
    test('should initialize voice recognition', () => {
      const isSupported = voiceControl.isVoiceRecognitionSupported()
      
      if (isSupported) {
        expect(voiceControl.isListening()).toBe(false)
        
        voiceControl.startListening()
        expect(voiceControl.isListening()).toBe(true)
        
        voiceControl.stopListening()
        expect(voiceControl.isListening()).toBe(false)
      } else {
        expect(voiceControl.isListening()).toBe(false)
      }
    })

    test('should register voice commands', () => {
      const commandSpy = vi.fn()
      
      voiceControl.registerCommand('select all nodes', commandSpy, {
        description: 'Selects all funnel nodes',
        category: 'selection'
      })
      
      const commands = voiceControl.getAvailableCommands()
      const selectAllCommand = commands.find(cmd => 
        cmd.phrase === 'select all nodes'
      )
      
      expect(selectAllCommand).toBeDefined()
      expect(selectAllCommand?.description).toContain('Selects all funnel nodes')
      expect(selectAllCommand?.category).toBe('selection')
    })

    test('should process voice commands', () => {
      const moveCommandSpy = vi.fn()
      const deleteCommandSpy = vi.fn()
      
      voiceControl.registerCommand('move selected right', moveCommandSpy)
      voiceControl.registerCommand('delete selected', deleteCommandSpy)
      
      // Simulate voice recognition results
      voiceControl.processVoiceInput('move selected right')
      voiceControl.processVoiceInput('delete selected')
      
      expect(moveCommandSpy).toHaveBeenCalled()
      expect(deleteCommandSpy).toHaveBeenCalled()
    })

    test('should handle voice command variations', () => {
      const commandSpy = vi.fn()
      
      voiceControl.registerCommand(['create node', 'add node', 'new node'], commandSpy)
      
      // Test different variations
      voiceControl.processVoiceInput('create node')
      voiceControl.processVoiceInput('add node')
      voiceControl.processVoiceInput('new node')
      
      expect(commandSpy).toHaveBeenCalledTimes(3)
    })

    test('should provide voice feedback', () => {
      const feedbackSpy = vi.fn()
      voiceControl.onVoiceFeedback(feedbackSpy)
      
      voiceControl.provideFeedback('Command executed successfully')
      
      expect(feedbackSpy).toHaveBeenCalledWith('Command executed successfully')
    })

    test('should handle unsupported environments gracefully', () => {
      // Mock unsupported environment
      const originalSpeechRecognition = (window as any).SpeechRecognition
      delete (window as any).SpeechRecognition
      delete (window as any).webkitSpeechRecognition
      
      const fallbackVoiceControl = new VoiceControlSystem(container)
      
      expect(fallbackVoiceControl.isVoiceRecognitionSupported()).toBe(false)
      expect(() => fallbackVoiceControl.startListening()).not.toThrow()
      
      // Restore
      if (originalSpeechRecognition) {
        (window as any).SpeechRecognition = originalSpeechRecognition
      }
      
      fallbackVoiceControl.destroy()
    })
  })

  describe('Visual Accessibility System', () => {
    test('should validate color contrast ratios', () => {
      const testElement = document.createElement('div')
      testElement.style.color = '#666'
      testElement.style.backgroundColor = '#fff'
      testElement.textContent = 'Test text'
      container.appendChild(testElement)
      
      const contrastRatio = visualA11y.calculateContrastRatio(testElement)
      
      expect(contrastRatio).toBeGreaterThan(0)
      
      const meetsWCAG = visualA11y.meetsContrastRequirement(contrastRatio, 'AA', 'normal')
      expect(typeof meetsWCAG).toBe('boolean')
    })

    test('should apply high contrast theme', () => {
      visualA11y.enableHighContrastMode()
      
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
      
      const testButton = document.createElement('button')
      testButton.textContent = 'Test Button'
      container.appendChild(testButton)
      
      const computedStyle = window.getComputedStyle(testButton)
      // High contrast mode should affect styling
      expect(computedStyle).toBeDefined()
      
      visualA11y.disableHighContrastMode()
      expect(document.documentElement.classList.contains('high-contrast')).toBe(false)
    })

    test('should detect and fix color-only information', () => {
      const colorOnlyElement = document.createElement('div')
      colorOnlyElement.style.color = 'red'
      colorOnlyElement.textContent = 'Error'
      colorOnlyElement.className = 'error-text'
      container.appendChild(colorOnlyElement)
      
      const fixes = visualA11y.analyzeColorUsage(container)
      const errorFix = fixes.find(fix => 
        fix.element === colorOnlyElement
      )
      
      expect(errorFix).toBeDefined()
      expect(errorFix?.recommendations).toContain('icon')
    })

    test('should support custom focus indicators', () => {
      const focusableElement = document.createElement('button')
      focusableElement.textContent = 'Test Button'
      container.appendChild(focusableElement)
      
      visualA11y.enhanceFocusIndicators(container)
      
      focusableElement.focus()
      
      const computedStyle = window.getComputedStyle(focusableElement)
      // Enhanced focus indicators should be applied
      expect(computedStyle.outline).not.toBe('none')
    })

    test('should validate font size and readability', () => {
      const smallText = document.createElement('p')
      smallText.style.fontSize = '10px'
      smallText.textContent = 'This text might be too small'
      container.appendChild(smallText)
      
      const readabilityIssues = visualA11y.auditReadability(container)
      const smallTextIssue = readabilityIssues.find(issue => 
        issue.element === smallText
      )
      
      expect(smallTextIssue).toBeDefined()
      expect(smallTextIssue?.type).toBe('font-size')
    })
  })

  describe('ARIA Enhanced System', () => {
    test('should create accessible drag and drop interface', () => {
      const draggableNode = document.createElement('div')
      draggableNode.textContent = 'Draggable Node'
      container.appendChild(draggableNode)
      
      const dropZone = document.createElement('div')
      dropZone.textContent = 'Drop Zone'
      container.appendChild(dropZone)
      
      ariaSystem.makeDraggable(draggableNode, {
        label: 'Funnel node',
        description: 'Landing page with 1000 visitors'
      })
      
      ariaSystem.makeDropZone(dropZone, {
        label: 'Canvas area',
        description: 'Drop nodes here to build funnel'
      })
      
      expect(draggableNode.getAttribute('draggable')).toBe('true')
      expect(draggableNode.getAttribute('aria-label')).toContain('Funnel node')
      expect(draggableNode.getAttribute('aria-describedby')).toBeTruthy()
      
      expect(dropZone.getAttribute('aria-dropeffect')).toBe('move')
      expect(dropZone.getAttribute('aria-label')).toContain('Canvas area')
    })

    test('should provide live region updates for drag operations', () => {
      const draggableElement = document.createElement('div')
      draggableElement.setAttribute('aria-label', 'Test Node')
      container.appendChild(draggableElement)
      
      ariaSystem.makeDraggable(draggableElement)
      
      // Simulate drag start
      ariaSystem.announceDragStart(draggableElement)
      
      const liveRegion = document.querySelector('[aria-live="assertive"]')
      expect(liveRegion?.textContent).toContain('started dragging')
      expect(liveRegion?.textContent).toContain('Test Node')
      
      // Simulate drag end
      ariaSystem.announceDragEnd(draggableElement, 'moved successfully')
      
      expect(liveRegion?.textContent).toContain('moved successfully')
    })

    test('should manage ARIA attributes dynamically', () => {
      const element = document.createElement('div')
      container.appendChild(element)
      
      ariaSystem.setAriaAttribute(element, 'aria-expanded', 'false')
      ariaSystem.setAriaAttribute(element, 'aria-controls', 'submenu')
      
      expect(element.getAttribute('aria-expanded')).toBe('false')
      expect(element.getAttribute('aria-controls')).toBe('submenu')
      
      ariaSystem.updateAriaAttribute(element, 'aria-expanded', 'true')
      expect(element.getAttribute('aria-expanded')).toBe('true')
      
      ariaSystem.removeAriaAttribute(element, 'aria-controls')
      expect(element.getAttribute('aria-controls')).toBeNull()
    })

    test('should create accessible relationships', () => {
      const labelElement = document.createElement('div')
      labelElement.id = 'node-label'
      labelElement.textContent = 'Landing Page'
      container.appendChild(labelElement)
      
      const nodeElement = document.createElement('div')
      nodeElement.id = 'funnel-node'
      container.appendChild(nodeElement)
      
      ariaSystem.createRelationship(nodeElement, labelElement, 'labelledby')
      
      expect(nodeElement.getAttribute('aria-labelledby')).toBe('node-label')
    })

    test('should handle complex ARIA patterns', () => {
      // Create an accessible combobox pattern
      const combobox = document.createElement('input')
      combobox.type = 'text'
      combobox.id = 'node-search'
      
      const listbox = document.createElement('ul')
      listbox.id = 'search-results'
      listbox.setAttribute('role', 'listbox')
      
      const option1 = document.createElement('li')
      option1.setAttribute('role', 'option')
      option1.textContent = 'Landing Page'
      option1.id = 'option-1'
      
      const option2 = document.createElement('li')
      option2.setAttribute('role', 'option')
      option2.textContent = 'Sign Up Page'
      option2.id = 'option-2'
      
      listbox.appendChild(option1)
      listbox.appendChild(option2)
      container.appendChild(combobox)
      container.appendChild(listbox)
      
      ariaSystem.createCombobox(combobox, listbox, {
        autocomplete: 'list',
        expanded: false
      })
      
      expect(combobox.getAttribute('role')).toBe('combobox')
      expect(combobox.getAttribute('aria-autocomplete')).toBe('list')
      expect(combobox.getAttribute('aria-expanded')).toBe('false')
      expect(combobox.getAttribute('aria-controls')).toBe('search-results')
    })

    test('should use ARIA test data for validation', () => {
      const { ariaLabels } = a11yTestData
      
      Object.entries(ariaLabels).forEach(([elementType, expectedLabel]) => {
        const element = document.createElement('div')
        element.setAttribute('data-element-type', elementType)
        container.appendChild(element)
        
        ariaSystem.applyStandardLabel(element, elementType as keyof typeof ariaLabels)
        
        expect(element.getAttribute('aria-label')).toBe(expectedLabel)
      })
    })
  })

  describe('Integration Tests', () => {
    test('should work together for complete accessibility', () => {
      // Create a complete accessible funnel builder interface
      const palette = document.createElement('div')
      palette.setAttribute('role', 'toolbar')
      palette.setAttribute('aria-label', 'Node palette')
      
      const canvas = document.createElement('div')
      canvas.setAttribute('role', 'application')
      canvas.setAttribute('aria-label', a11yTestData.ariaLabels.canvas)
      
      const node = document.createElement('div')
      node.setAttribute('role', 'button')
      node.setAttribute('aria-label', a11yTestData.ariaLabels.node)
      node.setAttribute('tabindex', '0')
      
      container.appendChild(palette)
      container.appendChild(canvas)
      canvas.appendChild(node)
      
      // Initialize all accessibility systems
      keyboardNav.registerFocusableElement(node)
      ariaSystem.makeDraggable(node)
      visualA11y.enhanceFocusIndicators(container)
      
      // Test keyboard navigation
      node.focus()
      expect(document.activeElement).toBe(node)
      
      // Test screen reader announcement
      screenReader.announce('Funnel builder ready')
      const liveRegion = document.querySelector('[aria-live]')
      expect(liveRegion?.textContent).toContain('Funnel builder ready')
      
      // Test ARIA attributes
      expect(node.getAttribute('aria-label')).toBe(a11yTestData.ariaLabels.node)
      expect(node.getAttribute('draggable')).toBe('true')
      
      // Test voice commands if supported
      if (voiceControl.isVoiceRecognitionSupported()) {
        const selectCommandSpy = vi.fn()
        voiceControl.registerCommand('select node', selectCommandSpy)
        
        voiceControl.processVoiceInput('select node')
        expect(selectCommandSpy).toHaveBeenCalled()
      }
    })

    test('should maintain accessibility during dynamic updates', () => {
      const dynamicContainer = document.createElement('div')
      container.appendChild(dynamicContainer)
      
      // Add nodes dynamically
      for (let i = 0; i < 5; i++) {
        const node = document.createElement('div')
        node.id = `dynamic-node-${i}`
        node.setAttribute('role', 'button')
        node.setAttribute('aria-label', `Dynamic Node ${i + 1}`)
        node.setAttribute('tabindex', '0')
        
        dynamicContainer.appendChild(node)
        
        // Register with accessibility systems
        keyboardNav.registerFocusableElement(node)
        ariaSystem.makeDraggable(node)
      }
      
      // Test that all nodes are accessible
      const nodes = dynamicContainer.querySelectorAll('[role="button"]')
      expect(nodes).toHaveLength(5)
      
      nodes.forEach((node, index) => {
        expect(node.getAttribute('aria-label')).toBe(`Dynamic Node ${index + 1}`)
        expect(node.getAttribute('tabindex')).toBe('0')
        expect(node.getAttribute('draggable')).toBe('true')
      })
      
      // Remove nodes and verify cleanup
      dynamicContainer.innerHTML = ''
      
      // Systems should handle removed elements gracefully
      expect(() => {
        keyboardNav.updateFocus()
        ariaSystem.updateLiveRegions()
      }).not.toThrow()
    })

    test('should perform accessibility audit on complete interface', async () => {
      // Build complete interface
      const toolbar = document.createElement('div')
      toolbar.setAttribute('role', 'toolbar')
      toolbar.setAttribute('aria-label', 'Funnel builder tools')
      
      const button1 = document.createElement('button')
      button1.textContent = 'Add Node'
      button1.setAttribute('aria-describedby', 'help-1')
      
      const help1 = document.createElement('div')
      help1.id = 'help-1'
      help1.textContent = 'Click to add a new funnel node'
      help1.setAttribute('role', 'tooltip')
      
      toolbar.appendChild(button1)
      toolbar.appendChild(help1)
      
      const main = document.createElement('main')
      main.setAttribute('role', 'application')
      main.setAttribute('aria-label', 'Funnel canvas')
      
      container.appendChild(toolbar)
      container.appendChild(main)
      
      // Run comprehensive audit
      const auditResult = await accessibilityCore.validateWCAGCompliance(container)
      
      expect(auditResult.level).toBe('AA')
      expect(auditResult.violations.length).toBe(0)
      expect(auditResult.score).toBeGreaterThan(0.9)
      
      // Check specific WCAG criteria
      expect(auditResult.passed).toContain('keyboard-navigation')
      expect(auditResult.passed).toContain('focus-management')
      expect(auditResult.passed).toContain('semantic-markup')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle missing ARIA attributes gracefully', () => {
      const incompleteElement = document.createElement('div')
      // Missing required attributes
      container.appendChild(incompleteElement)
      
      expect(() => {
        ariaSystem.validateAriaCompliance(incompleteElement)
        keyboardNav.registerFocusableElement(incompleteElement)
        screenReader.generateContextDescription(incompleteElement)
      }).not.toThrow()
    })

    test('should fallback when accessibility features are unavailable', () => {
      // Mock environment without accessibility support
      const originalSpeechSynthesis = window.speechSynthesis
      delete (window as any).speechSynthesis
      
      expect(() => {
        const fallbackScreenReader = new ScreenReaderSupport()
        fallbackScreenReader.announce('Test fallback')
        fallbackScreenReader.destroy()
      }).not.toThrow()
      
      // Restore
      if (originalSpeechSynthesis) {
        (window as any).speechSynthesis = originalSpeechSynthesis
      }
    })

    test('should handle rapid accessibility updates', async () => {
      const rapidUpdates = 1000
      
      for (let i = 0; i < rapidUpdates; i++) {
        const element = document.createElement('div')
        element.id = `rapid-${i}`
        element.setAttribute('role', 'button')
        element.setAttribute('aria-label', `Rapid ${i}`)
        
        container.appendChild(element)
        keyboardNav.registerFocusableElement(element)
        
        if (i % 100 === 0) {
          screenReader.announce(`Created ${i + 1} elements`)
        }
      }
      
      // System should remain stable
      expect(container.children.length).toBe(rapidUpdates)
      
      const auditResult = await accessibilityCore.validateWCAGCompliance(container)
      expect(auditResult.score).toBeGreaterThan(0.7) // Should maintain reasonable score
    })
  })
})