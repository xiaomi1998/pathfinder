/**
 * Agent 7: 无障碍访问支持专家 - 核心无障碍模块
 * WCAG 2.1 AA 合规性框架和核心功能
 */

export interface AccessibilityOptions {
  screenReaderSupport: boolean
  highContrast: boolean
  keyboardNavigation: boolean
  voiceControl: boolean
  reducedMotion: boolean
  focusIndicators: boolean
  ariaLiveUpdates: boolean
  colorBlindFriendly: boolean
  textScaling: number
  touchTargetOptimization: boolean
  customSettings?: Record<string, any>
}

export interface WCAGComplianceReport {
  level: 'A' | 'AA' | 'AAA'
  score: number
  passedCriteria: string[]
  failedCriteria: string[]
  warnings: string[]
  recommendations: string[]
  timestamp: string
}

export interface AriaProperties {
  label?: string
  labelledby?: string
  describedby?: string
  role?: string
  expanded?: boolean
  checked?: boolean
  disabled?: boolean
  hidden?: boolean
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  relevant?: string
  busy?: boolean
  level?: number
  setsize?: number
  posinset?: number
  controls?: string
  owns?: string
  flowto?: string
  current?: string
  keyshortcuts?: string
}

export interface FocusableElement {
  element: HTMLElement
  tabIndex: number
  role?: string
  label?: string
  description?: string
  parent?: FocusableElement
  children: FocusableElement[]
  onFocus?: () => void
  onBlur?: () => void
  onActivate?: () => void
}

/**
 * 核心无障碍管理器
 */
export class AccessibilityManager {
  private options: AccessibilityOptions
  private announcer: AriaLiveAnnouncer
  private focusManager: FocusManager
  private keyboardHandler: KeyboardNavigationHandler
  private colorManager: AccessibleColorManager
  private complianceChecker: WCAGComplianceChecker
  private listeners: Map<string, Set<Function>> = new Map()

  constructor(options: Partial<AccessibilityOptions> = {}) {
    this.options = {
      screenReaderSupport: true,
      highContrast: false,
      keyboardNavigation: true,
      voiceControl: false,
      reducedMotion: false,
      focusIndicators: true,
      ariaLiveUpdates: true,
      colorBlindFriendly: false,
      textScaling: 1,
      touchTargetOptimization: true,
      ...options
    }

    this.announcer = new AriaLiveAnnouncer()
    this.focusManager = new FocusManager()
    this.keyboardHandler = new KeyboardNavigationHandler()
    this.colorManager = new AccessibleColorManager()
    this.complianceChecker = new WCAGComplianceChecker()

    this.initialize()
  }

  private initialize(): void {
    console.log('AccessibilityManager: Initializing with options:', this.options)
    
    // 初始化ARIA区域
    this.announcer.initialize()
    
    // 设置焦点管理
    this.focusManager.initialize(this.options.focusIndicators)
    
    // 启用键盘导航
    if (this.options.keyboardNavigation) {
      this.keyboardHandler.initialize()
    }
    
    // 应用高对比度模式
    if (this.options.highContrast) {
      this.enableHighContrastMode()
    }
    
    // 应用颜色盲友好模式
    if (this.options.colorBlindFriendly) {
      this.colorManager.enableColorBlindFriendlyMode()
    }
    
    // 应用减少动画设置
    if (this.options.reducedMotion) {
      this.enableReducedMotionMode()
    }
    
    // 设置文本缩放
    if (this.options.textScaling !== 1) {
      this.applyTextScaling(this.options.textScaling)
    }
    
    // 优化触控目标
    if (this.options.touchTargetOptimization) {
      this.optimizeTouchTargets()
    }

    this.emit('initialized', { options: this.options })
  }

  /**
   * 宣布消息给屏幕阅读器
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.options.screenReaderSupport) {
      this.announcer.announce(message, priority)
      this.emit('announce', { message, priority })
    }
  }

  /**
   * 设置ARIA属性
   */
  setAriaProperties(element: HTMLElement, properties: AriaProperties): void {
    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`
        if (typeof value === 'boolean') {
          element.setAttribute(ariaKey, value.toString())
        } else {
          element.setAttribute(ariaKey, value.toString())
        }
      }
    })
    
    this.emit('aria-updated', { element, properties })
  }

  /**
   * 创建可访问的按钮
   */
  createAccessibleButton(
    config: {
      text: string
      action: () => void
      description?: string
      shortcut?: string
      disabled?: boolean
      pressed?: boolean
    }
  ): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = config.text
    button.addEventListener('click', config.action)
    
    const ariaProps: AriaProperties = {
      label: config.text,
      describedby: config.description ? `desc-${Date.now()}` : undefined,
      keyshortcuts: config.shortcut,
      disabled: config.disabled,
      checked: config.pressed
    }
    
    this.setAriaProperties(button, ariaProps)
    
    // 添加描述元素
    if (config.description) {
      const desc = document.createElement('div')
      desc.id = ariaProps.describedby!
      desc.className = 'sr-only'
      desc.textContent = config.description
      button.parentNode?.appendChild(desc)
    }
    
    // 注册到焦点管理器
    this.focusManager.registerElement(button)
    
    return button
  }

  /**
   * 检查WCAG合规性
   */
  async checkCompliance(container: HTMLElement = document.body): Promise<WCAGComplianceReport> {
    return await this.complianceChecker.checkCompliance(container)
  }

  /**
   * 启用高对比度模式
   */
  enableHighContrastMode(): void {
    document.body.classList.add('accessibility-high-contrast')
    this.colorManager.applyHighContrastColors()
    this.announce('高对比度模式已启用', 'polite')
    this.emit('high-contrast-enabled')
  }

  /**
   * 禁用高对比度模式
   */
  disableHighContrastMode(): void {
    document.body.classList.remove('accessibility-high-contrast')
    this.colorManager.restoreOriginalColors()
    this.announce('高对比度模式已禁用', 'polite')
    this.emit('high-contrast-disabled')
  }

  /**
   * 启用减少动画模式
   */
  enableReducedMotionMode(): void {
    document.body.classList.add('accessibility-reduced-motion')
    const style = document.createElement('style')
    style.textContent = `
      .accessibility-reduced-motion *,
      .accessibility-reduced-motion *::before,
      .accessibility-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `
    document.head.appendChild(style)
    this.announce('动画已减少以改善可访问性', 'polite')
    this.emit('reduced-motion-enabled')
  }

  /**
   * 应用文本缩放
   */
  applyTextScaling(scale: number): void {
    document.documentElement.style.fontSize = `${scale * 100}%`
    this.announce(`文本大小已调整为 ${Math.round(scale * 100)}%`, 'polite')
    this.emit('text-scaling-applied', { scale })
  }

  /**
   * 优化触控目标
   */
  optimizeTouchTargets(): void {
    const style = document.createElement('style')
    style.id = 'accessibility-touch-targets'
    style.textContent = `
      .accessibility-touch-target {
        min-width: 44px !important;
        min-height: 44px !important;
        padding: 8px !important;
        position: relative;
      }
      
      .accessibility-touch-target::after {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        min-width: 44px;
        min-height: 44px;
      }
      
      @media (pointer: coarse) {
        .accessibility-touch-target {
          min-width: 48px !important;
          min-height: 48px !important;
        }
      }
    `
    document.head.appendChild(style)
    
    // 自动应用到交互元素
    const interactiveElements = document.querySelectorAll(
      'button, [role="button"], input[type="button"], input[type="submit"], a[href]'
    )
    
    interactiveElements.forEach(element => {
      element.classList.add('accessibility-touch-target')
    })
    
    this.emit('touch-targets-optimized', { count: interactiveElements.length })
  }

  /**
   * 更新选项
   */
  updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    const oldOptions = { ...this.options }
    this.options = { ...this.options, ...newOptions }
    
    // 重新初始化受影响的功能
    if (oldOptions.highContrast !== this.options.highContrast) {
      if (this.options.highContrast) {
        this.enableHighContrastMode()
      } else {
        this.disableHighContrastMode()
      }
    }
    
    if (oldOptions.reducedMotion !== this.options.reducedMotion) {
      if (this.options.reducedMotion) {
        this.enableReducedMotionMode()
      }
    }
    
    if (oldOptions.textScaling !== this.options.textScaling) {
      this.applyTextScaling(this.options.textScaling)
    }
    
    this.emit('options-updated', { oldOptions, newOptions: this.options })
  }

  /**
   * 获取当前选项
   */
  getOptions(): AccessibilityOptions {
    return { ...this.options }
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`AccessibilityManager: Error in event ${event}:`, error)
      }
    })
  }

  /**
   * 销毁管理器
   */
  dispose(): void {
    this.announcer.dispose()
    this.focusManager.dispose()
    this.keyboardHandler.dispose()
    this.colorManager.dispose()
    this.complianceChecker.dispose()
    this.listeners.clear()
    
    // 移除样式
    document.getElementById('accessibility-touch-targets')?.remove()
    
    this.emit('disposed')
  }
}

/**
 * ARIA Live 区域管理器
 */
export class AriaLiveAnnouncer {
  private politeRegion: HTMLElement | null = null
  private assertiveRegion: HTMLElement | null = null

  initialize(): void {
    // 创建礼貌区域
    this.politeRegion = this.createLiveRegion('polite')
    
    // 创建紧急区域
    this.assertiveRegion = this.createLiveRegion('assertive')
    
    console.log('AriaLiveAnnouncer: Initialized with live regions')
  }

  private createLiveRegion(priority: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div')
    region.setAttribute('aria-live', priority)
    region.setAttribute('aria-atomic', 'true')
    region.setAttribute('aria-relevant', 'additions text')
    region.className = 'sr-only accessibility-live-region'
    region.id = `accessibility-live-region-${priority}`
    
    // 添加CSS以确保屏幕阅读器可见但视觉隐藏
    const style = document.createElement('style')
    if (!document.getElementById('accessibility-sr-only-styles')) {
      style.id = 'accessibility-sr-only-styles'
      style.textContent = `
        .sr-only, .accessibility-live-region {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
      `
      document.head.appendChild(style)
    }
    
    document.body.appendChild(region)
    return region
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion
    
    if (region) {
      // 清空区域然后添加新消息
      region.textContent = ''
      
      // 使用setTimeout确保屏幕阅读器检测到变化
      setTimeout(() => {
        region.textContent = message
        console.log(`AriaLiveAnnouncer: Announced (${priority}):`, message)
      }, 100)
    }
  }

  dispose(): void {
    this.politeRegion?.remove()
    this.assertiveRegion?.remove()
    document.getElementById('accessibility-sr-only-styles')?.remove()
  }
}

/**
 * 焦点管理器
 */
export class FocusManager {
  private focusableElements: FocusableElement[] = []
  private currentFocusIndex: number = -1
  private focusIndicatorsEnabled: boolean = true
  private trapStack: HTMLElement[] = []

  initialize(enableIndicators: boolean = true): void {
    this.focusIndicatorsEnabled = enableIndicators
    
    if (enableIndicators) {
      this.addFocusIndicatorStyles()
    }
    
    // 监听焦点变化
    document.addEventListener('focusin', this.handleFocusIn.bind(this))
    document.addEventListener('focusout', this.handleFocusOut.bind(this))
    
    // 扫描现有可聚焦元素
    this.scanFocusableElements()
    
    console.log('FocusManager: Initialized with', this.focusableElements.length, 'focusable elements')
  }

  private addFocusIndicatorStyles(): void {
    const style = document.createElement('style')
    style.id = 'accessibility-focus-indicators'
    style.textContent = `
      .accessibility-focus-indicator {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
        border-radius: 3px;
      }
      
      .accessibility-focus-indicator:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3) !important;
      }
      
      /* 高对比度模式下的焦点指示器 */
      .accessibility-high-contrast .accessibility-focus-indicator:focus {
        outline: 4px solid #FFFF00 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px #000000, 0 0 0 6px #FFFF00 !important;
      }
    `
    document.head.appendChild(style)
  }

  private scanFocusableElements(): void {
    const selector = [
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      '[role="button"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="tab"]'
    ].join(', ')

    const elements = document.querySelectorAll(selector)
    
    this.focusableElements = Array.from(elements).map((element, index) => ({
      element: element as HTMLElement,
      tabIndex: (element as HTMLElement).tabIndex || 0,
      role: element.getAttribute('role') || undefined,
      label: this.getAccessibleName(element as HTMLElement),
      description: this.getAccessibleDescription(element as HTMLElement),
      children: []
    }))
  }

  private getAccessibleName(element: HTMLElement): string {
    // 按照ARIA规范的优先级获取可访问名称
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      if (labelElement) return labelElement.textContent || ''
    }

    if (element.tagName === 'INPUT') {
      const input = element as HTMLInputElement
      const associatedLabel = document.querySelector(`label[for="${input.id}"]`)
      if (associatedLabel) return associatedLabel.textContent || ''
    }

    return element.textContent || element.getAttribute('title') || ''
  }

  private getAccessibleDescription(element: HTMLElement): string {
    const ariaDescribedBy = element.getAttribute('aria-describedby')
    if (ariaDescribedBy) {
      const descElement = document.getElementById(ariaDescribedBy)
      if (descElement) return descElement.textContent || ''
    }

    return element.getAttribute('title') || ''
  }

  registerElement(element: HTMLElement): void {
    if (this.focusIndicatorsEnabled) {
      element.classList.add('accessibility-focus-indicator')
    }
    
    const focusableElement: FocusableElement = {
      element,
      tabIndex: element.tabIndex || 0,
      role: element.getAttribute('role') || undefined,
      label: this.getAccessibleName(element),
      description: this.getAccessibleDescription(element),
      children: []
    }
    
    this.focusableElements.push(focusableElement)
  }

  private handleFocusIn(event: FocusEvent): void {
    const element = event.target as HTMLElement
    const index = this.focusableElements.findIndex(fe => fe.element === element)
    
    if (index !== -1) {
      this.currentFocusIndex = index
      const focusable = this.focusableElements[index]
      
      if (focusable.onFocus) {
        focusable.onFocus()
      }
      
      console.log('FocusManager: Focus on:', focusable.label || element.tagName)
    }
  }

  private handleFocusOut(event: FocusEvent): void {
    const element = event.target as HTMLElement
    const focusable = this.focusableElements.find(fe => fe.element === element)
    
    if (focusable?.onBlur) {
      focusable.onBlur()
    }
  }

  /**
   * 移动到下一个可聚焦元素
   */
  focusNext(): boolean {
    if (this.focusableElements.length === 0) return false
    
    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableElements.length
    const nextElement = this.focusableElements[this.currentFocusIndex]
    
    nextElement.element.focus()
    return true
  }

  /**
   * 移动到上一个可聚焦元素
   */
  focusPrevious(): boolean {
    if (this.focusableElements.length === 0) return false
    
    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? this.focusableElements.length - 1 
      : this.currentFocusIndex - 1
      
    const prevElement = this.focusableElements[this.currentFocusIndex]
    
    prevElement.element.focus()
    return true
  }

  /**
   * 焦点陷阱
   */
  trapFocus(container: HTMLElement): void {
    this.trapStack.push(container)
    
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const focusableInContainer = container.querySelectorAll([
          'button',
          'input:not([type="hidden"])',
          'select',
          'textarea',
          'a[href]',
          '[tabindex]:not([tabindex="-1"])'
        ].join(', '))
        
        const firstFocusable = focusableInContainer[0] as HTMLElement
        const lastFocusable = focusableInContainer[focusableInContainer.length - 1] as HTMLElement
        
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault()
            lastFocusable.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault()
            firstFocusable.focus()
          }
        }
      }
    })
  }

  /**
   * 释放焦点陷阱
   */
  releaseFocusTrap(): void {
    this.trapStack.pop()
  }

  dispose(): void {
    document.removeEventListener('focusin', this.handleFocusIn)
    document.removeEventListener('focusout', this.handleFocusOut)
    document.getElementById('accessibility-focus-indicators')?.remove()
  }
}

/**
 * 键盘导航处理器
 */
export class KeyboardNavigationHandler {
  private shortcuts: Map<string, Function> = new Map()

  initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    console.log('KeyboardNavigationHandler: Initialized')
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.getShortcutKey(event)
    const handler = this.shortcuts.get(key)
    
    if (handler) {
      event.preventDefault()
      handler(event)
    }
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const modifiers = []
    if (event.ctrlKey) modifiers.push('Ctrl')
    if (event.altKey) modifiers.push('Alt')
    if (event.shiftKey) modifiers.push('Shift')
    if (event.metaKey) modifiers.push('Meta')
    
    modifiers.push(event.key)
    return modifiers.join('+')
  }

  /**
   * 注册键盘快捷键
   */
  registerShortcut(key: string, handler: Function): void {
    this.shortcuts.set(key, handler)
    console.log('KeyboardNavigationHandler: Registered shortcut:', key)
  }

  /**
   * 注销键盘快捷键
   */
  unregisterShortcut(key: string): void {
    this.shortcuts.delete(key)
  }

  dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    this.shortcuts.clear()
  }
}

/**
 * 可访问颜色管理器
 */
export class AccessibleColorManager {
  private originalColors: Map<HTMLElement, Map<string, string>> = new Map()
  private highContrastPalette = {
    background: '#000000',
    text: '#FFFFFF',
    link: '#00FFFF',
    visited: '#FF00FF',
    button: '#0066CC',
    buttonText: '#FFFFFF',
    border: '#FFFFFF',
    focus: '#FFFF00'
  }

  /**
   * 检查颜色对比度
   */
  checkColorContrast(foreground: string, background: string): number {
    const fgLuminance = this.getLuminance(foreground)
    const bgLuminance = this.getLuminance(background)
    
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) /
                     (Math.min(fgLuminance, bgLuminance) + 0.05)
    
    return Math.round(contrast * 100) / 100
  }

  private getLuminance(color: string): number {
    // 简化的亮度计算
    const rgb = this.hexToRgb(color)
    if (!rgb) return 0
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * 应用高对比度颜色
   */
  applyHighContrastColors(): void {
    const style = document.createElement('style')
    style.id = 'accessibility-high-contrast-colors'
    style.textContent = `
      .accessibility-high-contrast {
        background-color: ${this.highContrastPalette.background} !important;
        color: ${this.highContrastPalette.text} !important;
      }
      
      .accessibility-high-contrast * {
        background-color: ${this.highContrastPalette.background} !important;
        color: ${this.highContrastPalette.text} !important;
        border-color: ${this.highContrastPalette.border} !important;
      }
      
      .accessibility-high-contrast button,
      .accessibility-high-contrast [role="button"] {
        background-color: ${this.highContrastPalette.button} !important;
        color: ${this.highContrastPalette.buttonText} !important;
        border: 2px solid ${this.highContrastPalette.border} !important;
      }
      
      .accessibility-high-contrast a,
      .accessibility-high-contrast [role="link"] {
        color: ${this.highContrastPalette.link} !important;
      }
      
      .accessibility-high-contrast a:visited {
        color: ${this.highContrastPalette.visited} !important;
      }
      
      .accessibility-high-contrast :focus {
        outline: 3px solid ${this.highContrastPalette.focus} !important;
        outline-offset: 2px !important;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 恢复原始颜色
   */
  restoreOriginalColors(): void {
    document.getElementById('accessibility-high-contrast-colors')?.remove()
  }

  /**
   * 启用颜色盲友好模式
   */
  enableColorBlindFriendlyMode(): void {
    const style = document.createElement('style')
    style.id = 'accessibility-color-blind-friendly'
    style.textContent = `
      /* 使用图案和纹理而不是仅依赖颜色 */
      .color-success { 
        background-image: repeating-linear-gradient(45deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px);
      }
      .color-warning { 
        background-image: repeating-linear-gradient(-45deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px);
      }
      .color-error { 
        background-image: repeating-linear-gradient(0deg, currentColor 0, currentColor 2px, transparent 2px, transparent 8px);
      }
    `
    document.head.appendChild(style)
  }

  dispose(): void {
    document.getElementById('accessibility-high-contrast-colors')?.remove()
    document.getElementById('accessibility-color-blind-friendly')?.remove()
    this.originalColors.clear()
  }
}

/**
 * WCAG 合规性检查器
 */
export class WCAGComplianceChecker {
  async checkCompliance(container: HTMLElement): Promise<WCAGComplianceReport> {
    const report: WCAGComplianceReport = {
      level: 'AA',
      score: 0,
      passedCriteria: [],
      failedCriteria: [],
      warnings: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    }

    let totalChecks = 0
    let passedChecks = 0

    // 1.1.1 非文本内容
    const { passed: altTextPassed, details: altTextDetails } = this.checkAltText(container)
    totalChecks++
    if (altTextPassed) {
      passedChecks++
      report.passedCriteria.push('1.1.1 非文本内容')
    } else {
      report.failedCriteria.push('1.1.1 非文本内容')
      report.recommendations.push(...altTextDetails)
    }

    // 1.3.1 信息和关系
    const { passed: structurePassed, details: structureDetails } = this.checkSemanticStructure(container)
    totalChecks++
    if (structurePassed) {
      passedChecks++
      report.passedCriteria.push('1.3.1 信息和关系')
    } else {
      report.failedCriteria.push('1.3.1 信息和关系')
      report.recommendations.push(...structureDetails)
    }

    // 1.4.3 对比度(最小)
    const { passed: contrastPassed, details: contrastDetails } = await this.checkColorContrast(container)
    totalChecks++
    if (contrastPassed) {
      passedChecks++
      report.passedCriteria.push('1.4.3 对比度(最小)')
    } else {
      report.failedCriteria.push('1.4.3 对比度(最小)')
      report.recommendations.push(...contrastDetails)
    }

    // 2.1.1 键盘
    const { passed: keyboardPassed, details: keyboardDetails } = this.checkKeyboardAccessibility(container)
    totalChecks++
    if (keyboardPassed) {
      passedChecks++
      report.passedCriteria.push('2.1.1 键盘')
    } else {
      report.failedCriteria.push('2.1.1 键盘')
      report.recommendations.push(...keyboardDetails)
    }

    // 2.4.3 焦点顺序
    const { passed: focusOrderPassed, details: focusOrderDetails } = this.checkFocusOrder(container)
    totalChecks++
    if (focusOrderPassed) {
      passedChecks++
      report.passedCriteria.push('2.4.3 焦点顺序')
    } else {
      report.failedCriteria.push('2.4.3 焦点顺序')
      report.recommendations.push(...focusOrderDetails)
    }

    // 4.1.2 名称、角色、值
    const { passed: ariaPassed, details: ariaDetails } = this.checkAriaProperties(container)
    totalChecks++
    if (ariaPassed) {
      passedChecks++
      report.passedCriteria.push('4.1.2 名称、角色、值')
    } else {
      report.failedCriteria.push('4.1.2 名称、角色、值')
      report.recommendations.push(...ariaDetails)
    }

    report.score = Math.round((passedChecks / totalChecks) * 100)

    // 确定合规级别
    if (report.score >= 95) {
      report.level = 'AAA'
    } else if (report.score >= 85) {
      report.level = 'AA'
    } else {
      report.level = 'A'
    }

    return report
  }

  private checkAltText(container: HTMLElement): { passed: boolean, details: string[] } {
    const images = container.querySelectorAll('img')
    const details: string[] = []
    let passed = true

    images.forEach((img, index) => {
      if (!img.alt && img.alt !== '') {
        passed = false
        details.push(`图片 ${index + 1} 缺少 alt 属性`)
      }
    })

    return { passed, details }
  }

  private checkSemanticStructure(container: HTMLElement): { passed: boolean, details: string[] } {
    const details: string[] = []
    let passed = true

    // 检查标题层次
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
    let previousLevel = 0
    
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1))
      if (index === 0 && currentLevel !== 1) {
        passed = false
        details.push('页面应该以 h1 标题开始')
      }
      
      if (currentLevel > previousLevel + 1) {
        passed = false
        details.push(`标题层次跳跃：从 h${previousLevel} 跳到 h${currentLevel}`)
      }
      
      previousLevel = currentLevel
    })

    // 检查表单标签
    const inputs = container.querySelectorAll('input, textarea, select')
    inputs.forEach((input, index) => {
      const id = input.id
      const hasLabel = id && container.querySelector(`label[for="${id}"]`)
      const hasAriaLabel = input.hasAttribute('aria-label')
      const hasAriaLabelledBy = input.hasAttribute('aria-labelledby')
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        passed = false
        details.push(`表单控件 ${index + 1} 缺少标签`)
      }
    })

    return { passed, details }
  }

  private async checkColorContrast(container: HTMLElement): Promise<{ passed: boolean, details: string[] }> {
    const details: string[] = []
    let passed = true

    const textElements = container.querySelectorAll('*')
    
    for (const element of textElements) {
      const computedStyle = window.getComputedStyle(element)
      const color = computedStyle.color
      const backgroundColor = computedStyle.backgroundColor
      
      if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const colorManager = new AccessibleColorManager()
        const contrast = colorManager.checkColorContrast(color, backgroundColor)
        
        if (contrast < 4.5) {
          passed = false
          details.push(`元素颜色对比度不足：${contrast.toFixed(2)} (需要 ≥4.5)`)
        }
      }
    }

    return { passed, details }
  }

  private checkKeyboardAccessibility(container: HTMLElement): { passed: boolean, details: string[] } {
    const details: string[] = []
    let passed = true

    const interactiveElements = container.querySelectorAll([
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[role="button"]',
      '[role="link"]',
      '[tabindex]'
    ].join(', '))

    interactiveElements.forEach((element, index) => {
      const tabIndex = (element as HTMLElement).tabIndex
      if (tabIndex < 0 && !element.hasAttribute('aria-hidden')) {
        passed = false
        details.push(`交互元素 ${index + 1} 不可通过键盘访问`)
      }
    })

    return { passed, details }
  }

  private checkFocusOrder(container: HTMLElement): { passed: boolean, details: string[] } {
    const details: string[] = []
    let passed = true

    const focusableElements = container.querySelectorAll([
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', '))

    const tabIndices: number[] = []
    focusableElements.forEach(element => {
      const tabIndex = (element as HTMLElement).tabIndex || 0
      tabIndices.push(tabIndex)
    })

    // 检查是否有跳跃的 tabindex
    const positiveIndices = tabIndices.filter(index => index > 0).sort((a, b) => a - b)
    for (let i = 1; i < positiveIndices.length; i++) {
      if (positiveIndices[i] - positiveIndices[i - 1] > 1) {
        passed = false
        details.push(`焦点顺序存在跳跃：从 ${positiveIndices[i - 1]} 跳到 ${positiveIndices[i]}`)
        break
      }
    }

    return { passed, details }
  }

  private checkAriaProperties(container: HTMLElement): { passed: boolean, details: string[] } {
    const details: string[] = []
    let passed = true

    const elementsWithRoles = container.querySelectorAll('[role]')
    
    elementsWithRoles.forEach((element, index) => {
      const role = element.getAttribute('role')
      
      // 检查必需的 ARIA 属性
      if (role === 'button' && !element.hasAttribute('aria-label') && !element.textContent?.trim()) {
        passed = false
        details.push(`角色为 button 的元素 ${index + 1} 缺少可访问名称`)
      }
      
      if (role === 'checkbox' && !element.hasAttribute('aria-checked')) {
        passed = false
        details.push(`复选框元素 ${index + 1} 缺少 aria-checked 属性`)
      }
      
      if (role === 'tab' && !element.hasAttribute('aria-selected')) {
        passed = false
        details.push(`标签页元素 ${index + 1} 缺少 aria-selected 属性`)
      }
    })

    return { passed, details }
  }

  dispose(): void {
    // 清理资源
  }
}

// 导出单例实例
export const accessibilityManager = new AccessibilityManager()

// 导出快捷方法
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  accessibilityManager.announce(message, priority)
}

export const setAriaProperties = (element: HTMLElement, properties: AriaProperties) => {
  accessibilityManager.setAriaProperties(element, properties)
}

export const createAccessibleButton = (config: {
  text: string
  action: () => void
  description?: string
  shortcut?: string
  disabled?: boolean
  pressed?: boolean
}) => {
  return accessibilityManager.createAccessibleButton(config)
}