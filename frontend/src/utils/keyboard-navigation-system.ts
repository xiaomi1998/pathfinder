/**
 * Agent 7: 无障碍访问支持专家 - 键盘导航系统
 * 完整的键盘导航和焦点管理系统
 */

export interface KeyboardShortcut {
  id: string
  keys: string[]
  description: string
  handler: (event: KeyboardEvent) => void
  context?: string
  global?: boolean
  preventDefault?: boolean
  enabled?: boolean
  priority?: number
}

export interface FocusContext {
  id: string
  element: HTMLElement
  trap?: boolean
  restoreElement?: HTMLElement
  onEnter?: () => void
  onExit?: () => void
  shortcuts?: KeyboardShortcut[]
}

export interface NavigationGroup {
  id: string
  elements: HTMLElement[]
  orientation: 'horizontal' | 'vertical' | 'both'
  wrap: boolean
  skip?: (element: HTMLElement) => boolean
  onFocus?: (element: HTMLElement, index: number) => void
}

export interface KeyboardNavigationConfig {
  enableTabTrapping: boolean
  enableArrowNavigation: boolean
  enableShortcuts: boolean
  enableFocusIndicators: boolean
  enableAnnouncements: boolean
  skipLinks: string[]
  customShortcuts: KeyboardShortcut[]
}

/**
 * 键盘导航系统管理器
 */
export class KeyboardNavigationSystem {
  private config: KeyboardNavigationConfig
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private focusContexts: Map<string, FocusContext> = new Map()
  private navigationGroups: Map<string, NavigationGroup> = new Map()
  private currentContext: FocusContext | null = null
  private focusHistory: HTMLElement[] = []
  private skipLinkContainer: HTMLElement | null = null
  private enabled: boolean = true

  constructor(config: Partial<KeyboardNavigationConfig> = {}) {
    this.config = {
      enableTabTrapping: true,
      enableArrowNavigation: true,
      enableShortcuts: true,
      enableFocusIndicators: true,
      enableAnnouncements: true,
      skipLinks: ['#main-content', '#navigation', '#footer'],
      customShortcuts: [],
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    console.log('KeyboardNavigationSystem: Initializing keyboard navigation')

    // 创建焦点指示器样式
    if (this.config.enableFocusIndicators) {
      this.createFocusIndicatorStyles()
    }

    // 创建跳转链接
    this.createSkipLinks()

    // 注册默认快捷键
    this.registerDefaultShortcuts()

    // 注册自定义快捷键
    this.config.customShortcuts.forEach(shortcut => {
      this.registerShortcut(shortcut)
    })

    // 设置全局键盘事件监听
    this.setupGlobalKeyboardListeners()

    // 设置焦点监听
    this.setupFocusListeners()

    console.log('KeyboardNavigationSystem: Initialization completed')
  }

  private createFocusIndicatorStyles(): void {
    const style = document.createElement('style')
    style.id = 'keyboard-navigation-focus-styles'
    style.textContent = `
      /* 基础焦点指示器 */
      .keyboard-focus-indicator:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
        border-radius: 3px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8), 
                    0 0 0 4px rgba(0, 102, 204, 0.3) !important;
      }

      /* 高对比度焦点指示器 */
      .accessibility-high-contrast .keyboard-focus-indicator:focus {
        outline: 4px solid #FFFF00 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px #000000, 
                    0 0 0 6px #FFFF00 !important;
      }

      /* 跳转链接样式 */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000000;
        color: #ffffff;
        padding: 8px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
        z-index: 10000;
        transition: top 0.2s ease-in-out;
      }

      .skip-link:focus {
        top: 6px;
        outline: 3px solid #FFFF00;
        outline-offset: 2px;
      }

      /* 导航组指示器 */
      .navigation-group-active {
        background-color: rgba(0, 102, 204, 0.1) !important;
        border: 1px dashed #0066cc !important;
      }

      /* 焦点陷阱指示器 */
      .focus-trap-container {
        position: relative;
      }

      .focus-trap-container::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #0066cc;
        border-radius: 4px;
        pointer-events: none;
        opacity: 0.3;
      }

      /* 键盘导航提示 */
      .keyboard-hint {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      .keyboard-hint.visible {
        opacity: 1;
      }

      /* 减少动画模式下的优化 */
      @media (prefers-reduced-motion: reduce) {
        .skip-link,
        .keyboard-hint {
          transition: none;
        }
      }
    `
    document.head.appendChild(style)
  }

  private createSkipLinks(): void {
    this.skipLinkContainer = document.createElement('div')
    this.skipLinkContainer.id = 'skip-links'
    this.skipLinkContainer.setAttribute('aria-label', '跳转链接')

    this.config.skipLinks.forEach((target, index) => {
      const link = document.createElement('a')
      link.href = target
      link.className = 'skip-link'
      link.textContent = this.getSkipLinkText(target)
      
      link.addEventListener('click', (event) => {
        event.preventDefault()
        const targetElement = document.querySelector(target)
        if (targetElement) {
          this.focusElement(targetElement as HTMLElement)
          this.announceNavigation(`跳转到${link.textContent}`)
        }
      })

      this.skipLinkContainer.appendChild(link)
    })

    document.body.insertBefore(this.skipLinkContainer, document.body.firstChild)
  }

  private getSkipLinkText(target: string): string {
    const targetMap: Record<string, string> = {
      '#main-content': '跳转到主内容',
      '#navigation': '跳转到导航',
      '#footer': '跳转到页脚',
      '#search': '跳转到搜索'
    }
    return targetMap[target] || `跳转到 ${target}`
  }

  private registerDefaultShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        id: 'toggle-navigation',
        keys: ['Alt', 'n'],
        description: '切换导航菜单',
        handler: () => this.toggleNavigation(),
        global: true
      },
      {
        id: 'focus-main-content',
        keys: ['Alt', 'm'],
        description: '聚焦主内容',
        handler: () => this.focusMainContent(),
        global: true
      },
      {
        id: 'focus-search',
        keys: ['Alt', 's'],
        description: '聚焦搜索框',
        handler: () => this.focusSearch(),
        global: true
      },
      {
        id: 'show-shortcuts',
        keys: ['Alt', 'h'],
        description: '显示键盘快捷键帮助',
        handler: () => this.showShortcutsHelp(),
        global: true
      },
      {
        id: 'previous-element',
        keys: ['Shift', 'Tab'],
        description: '上一个可聚焦元素',
        handler: (event) => this.handleTabNavigation(event, -1),
        global: true,
        preventDefault: false // Tab导航由浏览器处理
      },
      {
        id: 'next-element',
        keys: ['Tab'],
        description: '下一个可聚焦元素',
        handler: (event) => this.handleTabNavigation(event, 1),
        global: true,
        preventDefault: false
      },
      {
        id: 'escape-context',
        keys: ['Escape'],
        description: '退出当前上下文',
        handler: () => this.handleEscape(),
        global: true
      }
    ]

    defaultShortcuts.forEach(shortcut => this.registerShortcut(shortcut))
  }

  /**
   * 注册键盘快捷键
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = shortcut.keys.join('+')
    this.shortcuts.set(key, {
      ...shortcut,
      enabled: shortcut.enabled !== false,
      priority: shortcut.priority || 0,
      preventDefault: shortcut.preventDefault !== false
    })
    
    console.log(`KeyboardNavigationSystem: Registered shortcut ${key}:`, shortcut.description)
  }

  /**
   * 注销快捷键
   */
  unregisterShortcut(shortcutId: string): void {
    const shortcut = Array.from(this.shortcuts.values()).find(s => s.id === shortcutId)
    if (shortcut) {
      const key = shortcut.keys.join('+')
      this.shortcuts.delete(key)
      console.log(`KeyboardNavigationSystem: Unregistered shortcut ${shortcutId}`)
    }
  }

  /**
   * 创建焦点上下文
   */
  createFocusContext(context: FocusContext): void {
    this.focusContexts.set(context.id, context)
    
    if (context.trap) {
      this.setupFocusTrap(context)
    }
    
    // 为上下文设置快捷键
    if (context.shortcuts) {
      context.shortcuts.forEach(shortcut => {
        shortcut.context = context.id
        this.registerShortcut(shortcut)
      })
    }
    
    console.log(`KeyboardNavigationSystem: Created focus context: ${context.id}`)
  }

  /**
   * 激活焦点上下文
   */
  activateFocusContext(contextId: string): void {
    const context = this.focusContexts.get(contextId)
    if (!context) {
      console.warn(`KeyboardNavigationSystem: Context ${contextId} not found`)
      return
    }

    // 保存当前焦点元素
    const currentFocus = document.activeElement as HTMLElement
    if (currentFocus && currentFocus !== document.body) {
      this.focusHistory.push(currentFocus)
    }

    // 退出当前上下文
    if (this.currentContext && this.currentContext.onExit) {
      this.currentContext.onExit()
    }

    this.currentContext = context

    // 进入新上下文
    if (context.onEnter) {
      context.onEnter()
    }

    // 聚焦到上下文元素
    this.focusElement(context.element)
    
    if (context.trap) {
      context.element.classList.add('focus-trap-container')
    }

    this.announceNavigation(`进入 ${contextId} 上下文`)
    
    console.log(`KeyboardNavigationSystem: Activated focus context: ${contextId}`)
  }

  /**
   * 退出焦点上下文
   */
  exitFocusContext(): void {
    if (!this.currentContext) return

    const context = this.currentContext

    // 移除焦点陷阱样式
    if (context.trap) {
      context.element.classList.remove('focus-trap-container')
    }

    // 调用退出回调
    if (context.onExit) {
      context.onExit()
    }

    // 恢复焦点
    if (context.restoreElement) {
      this.focusElement(context.restoreElement)
    } else if (this.focusHistory.length > 0) {
      const previousFocus = this.focusHistory.pop()!
      this.focusElement(previousFocus)
    }

    this.announceNavigation(`退出 ${context.id} 上下文`)

    this.currentContext = null
    
    console.log(`KeyboardNavigationSystem: Exited focus context: ${context.id}`)
  }

  /**
   * 创建导航组
   */
  createNavigationGroup(group: NavigationGroup): void {
    this.navigationGroups.set(group.id, group)
    
    // 为导航组中的每个元素添加导航事件
    group.elements.forEach((element, index) => {
      this.makeElementNavigable(element, group, index)
    })
    
    console.log(`KeyboardNavigationSystem: Created navigation group: ${group.id}`)
  }

  private makeElementNavigable(element: HTMLElement, group: NavigationGroup, index: number): void {
    // 确保元素可聚焦
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', index === 0 ? '0' : '-1')
    }

    // 添加焦点指示器类
    element.classList.add('keyboard-focus-indicator')

    // 添加箭头键导航
    element.addEventListener('keydown', (event) => {
      if (!this.config.enableArrowNavigation) return

      let handled = false
      let newIndex = index

      switch (event.key) {
        case 'ArrowRight':
          if (group.orientation === 'horizontal' || group.orientation === 'both') {
            newIndex = this.getNextIndex(index, group.elements.length, 1, group.wrap)
            handled = true
          }
          break
        
        case 'ArrowLeft':
          if (group.orientation === 'horizontal' || group.orientation === 'both') {
            newIndex = this.getNextIndex(index, group.elements.length, -1, group.wrap)
            handled = true
          }
          break

        case 'ArrowDown':
          if (group.orientation === 'vertical' || group.orientation === 'both') {
            newIndex = this.getNextIndex(index, group.elements.length, 1, group.wrap)
            handled = true
          }
          break

        case 'ArrowUp':
          if (group.orientation === 'vertical' || group.orientation === 'both') {
            newIndex = this.getNextIndex(index, group.elements.length, -1, group.wrap)
            handled = true
          }
          break

        case 'Home':
          newIndex = 0
          handled = true
          break

        case 'End':
          newIndex = group.elements.length - 1
          handled = true
          break
      }

      if (handled && newIndex !== index) {
        event.preventDefault()
        this.focusGroupElement(group, newIndex)
      }
    })

    // 添加焦点事件
    element.addEventListener('focus', () => {
      // 更新tabindex
      group.elements.forEach((el, i) => {
        el.setAttribute('tabindex', i === index ? '0' : '-1')
      })

      // 添加活动指示器
      group.elements.forEach(el => el.classList.remove('navigation-group-active'))
      element.classList.add('navigation-group-active')

      // 调用焦点回调
      if (group.onFocus) {
        group.onFocus(element, index)
      }

      this.announceNavigation(`${group.id} 组中的第 ${index + 1} 个项目`, element.textContent || element.getAttribute('aria-label') || '')
    })

    element.addEventListener('blur', () => {
      element.classList.remove('navigation-group-active')
    })
  }

  private getNextIndex(currentIndex: number, length: number, direction: number, wrap: boolean): number {
    let newIndex = currentIndex + direction
    
    if (newIndex >= length) {
      return wrap ? 0 : length - 1
    } else if (newIndex < 0) {
      return wrap ? length - 1 : 0
    }
    
    return newIndex
  }

  private focusGroupElement(group: NavigationGroup, index: number): void {
    const element = group.elements[index]
    
    // 检查是否应该跳过
    if (group.skip && group.skip(element)) {
      // 寻找下一个不跳过的元素
      for (let i = index + 1; i < group.elements.length; i++) {
        if (!group.skip(group.elements[i])) {
          this.focusElement(group.elements[i])
          return
        }
      }
      // 如果没找到，尝试反向寻找
      for (let i = index - 1; i >= 0; i--) {
        if (!group.skip(group.elements[i])) {
          this.focusElement(group.elements[i])
          return
        }
      }
      return
    }

    this.focusElement(element)
  }

  /**
   * 设置焦点陷阱
   */
  private setupFocusTrap(context: FocusContext): void {
    const element = context.element

    element.addEventListener('keydown', (event) => {
      if (!this.config.enableTabTrapping || !context.trap) return

      if (event.key === 'Tab') {
        const focusableElements = this.getFocusableElements(element)
        
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const activeElement = document.activeElement

        if (event.shiftKey) {
          // Shift+Tab - 向后
          if (activeElement === firstElement) {
            event.preventDefault()
            this.focusElement(lastElement)
          }
        } else {
          // Tab - 向前
          if (activeElement === lastElement) {
            event.preventDefault()
            this.focusElement(firstElement)
          }
        }
      }
    })
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
      .filter(el => this.isElementVisible(el as HTMLElement)) as HTMLElement[]
  }

  private isElementVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetWidth > 0 && 
           element.offsetHeight > 0
  }

  /**
   * 全局键盘事件监听
   */
  private setupGlobalKeyboardListeners(): void {
    document.addEventListener('keydown', (event) => {
      if (!this.enabled || !this.config.enableShortcuts) return

      const pressedKeys = this.getPressedKeys(event)
      const shortcutKey = pressedKeys.join('+')
      const shortcut = this.shortcuts.get(shortcutKey)

      if (shortcut && shortcut.enabled) {
        // 检查上下文
        const isGlobal = shortcut.global
        const isContextual = shortcut.context && this.currentContext?.id === shortcut.context
        const noContext = !shortcut.context && !this.currentContext

        if (isGlobal || isContextual || noContext) {
          if (shortcut.preventDefault) {
            event.preventDefault()
            event.stopPropagation()
          }
          
          try {
            shortcut.handler(event)
            this.showKeyboardHint(shortcut.description)
          } catch (error) {
            console.error('KeyboardNavigationSystem: Error executing shortcut:', error)
          }
        }
      }
    })

    // 显示快捷键提示
    document.addEventListener('keyup', (event) => {
      if (event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey) {
        this.showAvailableShortcuts()
      }
    })
  }

  private getPressedKeys(event: KeyboardEvent): string[] {
    const keys: string[] = []
    
    if (event.ctrlKey) keys.push('Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')
    if (event.metaKey) keys.push('Meta')
    
    // 添加主键
    if (event.key !== 'Control' && event.key !== 'Alt' && 
        event.key !== 'Shift' && event.key !== 'Meta') {
      keys.push(event.key)
    }
    
    return keys
  }

  /**
   * 焦点监听设置
   */
  private setupFocusListeners(): void {
    document.addEventListener('focusin', (event) => {
      const element = event.target as HTMLElement
      
      // 添加焦点历史
      this.focusHistory = this.focusHistory.slice(-5) // 保持历史长度
      
      // 宣布焦点变化
      if (this.config.enableAnnouncements) {
        this.announceFocusChange(element)
      }
    })

    document.addEventListener('focusout', (event) => {
      const element = event.target as HTMLElement
      element.classList.remove('navigation-group-active')
    })
  }

  private announceFocusChange(element: HTMLElement): void {
    const label = this.getAccessibleName(element)
    const role = element.getAttribute('role') || element.tagName.toLowerCase()
    const description = element.getAttribute('aria-describedby')
      ? document.getElementById(element.getAttribute('aria-describedby')!)?.textContent
      : null

    let announcement = `${label}`
    
    if (role !== 'generic') {
      announcement += `, ${this.getRoleDescription(role)}`
    }
    
    if (description) {
      announcement += `, ${description}`
    }

    // 宣布可用的操作
    const shortcuts = this.getElementShortcuts(element)
    if (shortcuts.length > 0) {
      announcement += `. 可用快捷键: ${shortcuts.map(s => s.keys.join('+') + ' ' + s.description).join(', ')}`
    }

    this.announceNavigation(announcement)
  }

  private getAccessibleName(element: HTMLElement): string {
    return element.getAttribute('aria-label') ||
           element.textContent?.trim() ||
           element.getAttribute('title') ||
           element.getAttribute('placeholder') ||
           '未命名元素'
  }

  private getRoleDescription(role: string): string {
    const roleDescriptions: Record<string, string> = {
      button: '按钮',
      link: '链接',
      textbox: '文本框',
      combobox: '组合框',
      listbox: '列表框',
      tree: '树形控件',
      tab: '标签页',
      menu: '菜单',
      menuitem: '菜单项',
      checkbox: '复选框',
      radio: '单选按钮',
      slider: '滑块',
      spinbutton: '数字输入框'
    }
    return roleDescriptions[role] || role
  }

  private getElementShortcuts(element: HTMLElement): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(shortcut => {
      return shortcut.context === element.id || 
             (shortcut.global && shortcut.keys.some(key => 
               element.getAttribute('aria-keyshortcuts')?.includes(key)
             ))
    })
  }

  /**
   * 快捷键处理方法
   */
  private toggleNavigation(): void {
    const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement
    if (nav) {
      this.focusElement(nav)
    }
  }

  private focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement
    if (main) {
      this.focusElement(main)
    }
  }

  private focusSearch(): void {
    const search = document.querySelector('input[type="search"], #search, [role="search"] input') as HTMLElement
    if (search) {
      this.focusElement(search)
    }
  }

  private showShortcutsHelp(): void {
    const helpText = Array.from(this.shortcuts.values())
      .filter(s => s.enabled && (s.global || s.context === this.currentContext?.id))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .map(s => `${s.keys.join(' + ')}: ${s.description}`)
      .join('\n')

    this.showKeyboardHint('可用快捷键:\n' + helpText, 5000)
  }

  private showAvailableShortcuts(): void {
    const contextShortcuts = Array.from(this.shortcuts.values())
      .filter(s => s.enabled && s.keys.includes('Alt'))
      .map(s => s.keys.join(' + '))
      .join(', ')

    if (contextShortcuts) {
      this.showKeyboardHint(`Alt键快捷键: ${contextShortcuts}`, 3000)
    }
  }

  private handleTabNavigation(event: KeyboardEvent, direction: number): void {
    // Tab导航主要由浏览器处理，这里可以添加额外的逻辑
    if (this.currentContext && this.currentContext.trap) {
      // 焦点陷阱已经在setupFocusTrap中处理
      return
    }
  }

  private handleEscape(): void {
    if (this.currentContext) {
      this.exitFocusContext()
    } else {
      // 关闭任何打开的弹出窗口或模态对话框
      const modals = document.querySelectorAll('[role="dialog"]:not([aria-hidden="true"])')
      modals.forEach(modal => {
        const closeButton = modal.querySelector('[aria-label*="关闭"], [aria-label*="取消"], .close-button')
        if (closeButton) {
          (closeButton as HTMLElement).click()
        }
      })
    }
  }

  /**
   * 实用方法
   */
  focusElement(element: HTMLElement): void {
    if (element && typeof element.focus === 'function') {
      element.focus()
      
      // 确保元素可见
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }

  private announceNavigation(message: string, context?: string): void {
    if (!this.config.enableAnnouncements) return

    // 使用ARIA实时区域宣布导航变化
    const ariaSystem = (window as any).ariaEnhancedSystem
    if (ariaSystem) {
      ariaSystem.announceToRegion('navigation-hints', message, context)
    } else {
      console.log('Navigation:', message, context || '')
    }
  }

  private showKeyboardHint(text: string, duration: number = 2000): void {
    let hintElement = document.getElementById('keyboard-hint')
    
    if (!hintElement) {
      hintElement = document.createElement('div')
      hintElement.id = 'keyboard-hint'
      hintElement.className = 'keyboard-hint'
      document.body.appendChild(hintElement)
    }

    hintElement.textContent = text
    hintElement.classList.add('visible')

    clearTimeout((hintElement as any).hideTimeout)
    ;(hintElement as any).hideTimeout = setTimeout(() => {
      hintElement!.classList.remove('visible')
    }, duration)
  }

  /**
   * 启用/禁用系统
   */
  enable(): void {
    this.enabled = true
    console.log('KeyboardNavigationSystem: Enabled')
  }

  disable(): void {
    this.enabled = false
    console.log('KeyboardNavigationSystem: Disabled')
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    enabled: boolean
    shortcuts: number
    contexts: number
    navigationGroups: number
    currentContext: string | null
  } {
    return {
      enabled: this.enabled,
      shortcuts: this.shortcuts.size,
      contexts: this.focusContexts.size,
      navigationGroups: this.navigationGroups.size,
      currentContext: this.currentContext?.id || null
    }
  }

  /**
   * 销毁系统
   */
  dispose(): void {
    // 移除样式
    document.getElementById('keyboard-navigation-focus-styles')?.remove()
    
    // 移除跳转链接
    this.skipLinkContainer?.remove()
    
    // 移除提示元素
    document.getElementById('keyboard-hint')?.remove()
    
    // 清理数据
    this.shortcuts.clear()
    this.focusContexts.clear()
    this.navigationGroups.clear()
    this.focusHistory.length = 0
    this.currentContext = null
    
    console.log('KeyboardNavigationSystem: Disposed')
  }
}

// 导出单例实例
export const keyboardNavigationSystem = new KeyboardNavigationSystem()

// 快捷方法导出
export const registerShortcut = (shortcut: KeyboardShortcut) => {
  keyboardNavigationSystem.registerShortcut(shortcut)
}

export const createFocusContext = (context: FocusContext) => {
  keyboardNavigationSystem.createFocusContext(context)
}

export const createNavigationGroup = (group: NavigationGroup) => {
  keyboardNavigationSystem.createNavigationGroup(group)
}

export const focusElement = (element: HTMLElement) => {
  keyboardNavigationSystem.focusElement(element)
}