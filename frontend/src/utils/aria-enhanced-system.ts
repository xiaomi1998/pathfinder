/**
 * Agent 7: 无障碍访问支持专家 - ARIA增强系统
 * 完整的ARIA标签和语义化标记增强模块
 */

export interface AriaLiveRegion {
  id: string
  element: HTMLElement
  priority: 'polite' | 'assertive'
  content: string[]
  maxHistory: number
  debounceTime: number
}

export interface AriaTreeNode {
  id: string
  label: string
  level: number
  expanded?: boolean
  selected?: boolean
  children: AriaTreeNode[]
  parent?: AriaTreeNode
  role: string
  properties: Record<string, any>
}

export interface SemanticStructure {
  landmarks: HTMLElement[]
  headings: HTMLElement[]
  regions: HTMLElement[]
  navigation: HTMLElement[]
  lists: HTMLElement[]
  tables: HTMLElement[]
  forms: HTMLElement[]
}

export interface ContextualDescription {
  element: HTMLElement
  description: string
  context: string
  relationships: string[]
  instructions: string[]
}

/**
 * ARIA增强系统管理器
 */
export class AriaEnhancedSystem {
  private liveRegions: Map<string, AriaLiveRegion> = new Map()
  private semanticStructure: SemanticStructure | null = null
  private contextualDescriptions: Map<HTMLElement, ContextualDescription> = new Map()
  private ariaTree: Map<string, AriaTreeNode> = new Map()
  private updateQueue: Array<() => void> = []
  private processingQueue: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    console.log('AriaEnhancedSystem: Initializing enhanced ARIA system')
    
    // 创建默认的实时区域
    this.createDefaultLiveRegions()
    
    // 分析现有的语义结构
    this.analyzeSemanticStructure()
    
    // 设置动态更新监听
    this.setupDynamicUpdates()
    
    console.log('AriaEnhancedSystem: Initialization completed')
  }

  /**
   * 创建默认的ARIA实时区域
   */
  private createDefaultLiveRegions(): void {
    // 状态更新区域
    this.createLiveRegion('status-updates', 'polite', {
      maxHistory: 5,
      debounceTime: 300
    })
    
    // 错误和警告区域
    this.createLiveRegion('alerts', 'assertive', {
      maxHistory: 10,
      debounceTime: 100
    })
    
    // 操作反馈区域
    this.createLiveRegion('action-feedback', 'polite', {
      maxHistory: 3,
      debounceTime: 500
    })
    
    // 导航提示区域
    this.createLiveRegion('navigation-hints', 'polite', {
      maxHistory: 3,
      debounceTime: 200
    })
  }

  /**
   * 创建ARIA实时区域
   */
  createLiveRegion(id: string, priority: 'polite' | 'assertive', options: {
    maxHistory?: number
    debounceTime?: number
  } = {}): AriaLiveRegion {
    const element = document.createElement('div')
    element.id = `aria-live-${id}`
    element.setAttribute('aria-live', priority)
    element.setAttribute('aria-atomic', 'true')
    element.setAttribute('aria-relevant', 'additions text')
    element.className = 'sr-only aria-live-region'
    
    // 确保屏幕阅读器样式存在
    this.ensureScreenReaderStyles()
    
    document.body.appendChild(element)
    
    const liveRegion: AriaLiveRegion = {
      id,
      element,
      priority,
      content: [],
      maxHistory: options.maxHistory || 5,
      debounceTime: options.debounceTime || 300
    }
    
    this.liveRegions.set(id, liveRegion)
    
    console.log(`AriaEnhancedSystem: Created live region '${id}' with priority '${priority}'`)
    
    return liveRegion
  }

  private ensureScreenReaderStyles(): void {
    if (!document.getElementById('aria-sr-only-styles')) {
      const style = document.createElement('style')
      style.id = 'aria-sr-only-styles'
      style.textContent = `
        .sr-only, .aria-live-region {
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
        
        /* 确保在聚焦时可见（用于调试） */
        .sr-only:focus,
        .aria-live-region:focus {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: 0.5rem !important;
          margin: 0 !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
          border: 2px solid #0066cc !important;
          background: #ffffff !important;
          color: #000000 !important;
          z-index: 10000 !important;
        }
      `
      document.head.appendChild(style)
    }
  }

  /**
   * 向实时区域宣布消息
   */
  announceToRegion(regionId: string, message: string, context?: string): void {
    const region = this.liveRegions.get(regionId)
    if (!region) {
      console.warn(`AriaEnhancedSystem: Live region '${regionId}' not found`)
      return
    }

    // 添加上下文信息
    const fullMessage = context ? `${context}: ${message}` : message
    
    // 添加到内容历史
    region.content.push(fullMessage)
    if (region.content.length > region.maxHistory) {
      region.content.shift()
    }

    // 防抖更新
    this.queueUpdate(() => {
      region.element.textContent = fullMessage
      console.log(`AriaEnhancedSystem: Announced to ${regionId}:`, fullMessage)
    }, region.debounceTime)
  }

  /**
   * 增强元素的ARIA属性
   */
  enhanceElementAria(element: HTMLElement, config: {
    role?: string
    label?: string
    description?: string
    level?: number
    expanded?: boolean
    checked?: boolean
    disabled?: boolean
    required?: boolean
    invalid?: boolean
    controls?: string
    describedBy?: string[]
    labelledBy?: string[]
    flowTo?: string
    owns?: string
    current?: string
    keyShortcuts?: string
    autoComplete?: string
    hasPopup?: boolean | string
    setSize?: number
    posInSet?: number
  }): void {
    const ariaUpdates: Record<string, string> = {}

    if (config.role) {
      ariaUpdates['role'] = config.role
    }

    if (config.label) {
      ariaUpdates['aria-label'] = config.label
    }

    if (config.description) {
      // 创建描述元素
      const descId = this.createDescriptionElement(config.description, element)
      ariaUpdates['aria-describedby'] = descId
    }

    if (config.level !== undefined) {
      ariaUpdates['aria-level'] = config.level.toString()
    }

    if (config.expanded !== undefined) {
      ariaUpdates['aria-expanded'] = config.expanded.toString()
    }

    if (config.checked !== undefined) {
      ariaUpdates['aria-checked'] = config.checked.toString()
    }

    if (config.disabled !== undefined) {
      ariaUpdates['aria-disabled'] = config.disabled.toString()
    }

    if (config.required !== undefined) {
      ariaUpdates['aria-required'] = config.required.toString()
    }

    if (config.invalid !== undefined) {
      ariaUpdates['aria-invalid'] = config.invalid.toString()
    }

    if (config.controls) {
      ariaUpdates['aria-controls'] = config.controls
    }

    if (config.describedBy && config.describedBy.length > 0) {
      ariaUpdates['aria-describedby'] = config.describedBy.join(' ')
    }

    if (config.labelledBy && config.labelledBy.length > 0) {
      ariaUpdates['aria-labelledby'] = config.labelledBy.join(' ')
    }

    if (config.flowTo) {
      ariaUpdates['aria-flowto'] = config.flowTo
    }

    if (config.owns) {
      ariaUpdates['aria-owns'] = config.owns
    }

    if (config.current) {
      ariaUpdates['aria-current'] = config.current
    }

    if (config.keyShortcuts) {
      ariaUpdates['aria-keyshortcuts'] = config.keyShortcuts
    }

    if (config.autoComplete) {
      ariaUpdates['aria-autocomplete'] = config.autoComplete
    }

    if (config.hasPopup !== undefined) {
      ariaUpdates['aria-haspopup'] = config.hasPopup.toString()
    }

    if (config.setSize !== undefined) {
      ariaUpdates['aria-setsize'] = config.setSize.toString()
    }

    if (config.posInSet !== undefined) {
      ariaUpdates['aria-posinset'] = config.posInSet.toString()
    }

    // 批量应用ARIA属性
    Object.entries(ariaUpdates).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })

    console.log(`AriaEnhancedSystem: Enhanced element with ARIA properties:`, ariaUpdates)
  }

  /**
   * 创建描述元素
   */
  private createDescriptionElement(description: string, targetElement: HTMLElement): string {
    const descId = `aria-desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const descElement = document.createElement('div')
    descElement.id = descId
    descElement.className = 'sr-only aria-description'
    descElement.textContent = description
    
    // 将描述元素插入到目标元素附近
    if (targetElement.parentNode) {
      targetElement.parentNode.insertBefore(descElement, targetElement.nextSibling)
    } else {
      document.body.appendChild(descElement)
    }
    
    return descId
  }

  /**
   * 创建可访问的复杂控件
   */
  createAccessibleControl(type: 'tree' | 'menu' | 'tablist' | 'listbox', config: {
    container: HTMLElement
    items: Array<{
      id: string
      label: string
      value?: any
      level?: number
      expanded?: boolean
      selected?: boolean
      disabled?: boolean
      children?: any[]
    }>
    multiSelect?: boolean
    orientation?: 'horizontal' | 'vertical'
    onSelectionChange?: (selectedItems: any[]) => void
    onExpand?: (itemId: string, expanded: boolean) => void
  }): void {
    const { container, items, multiSelect = false, orientation = 'vertical' } = config

    // 设置容器属性
    this.enhanceElementAria(container, {
      role: type,
      orientation: orientation
    })

    if (multiSelect && (type === 'listbox' || type === 'tree')) {
      container.setAttribute('aria-multiselectable', 'true')
    }

    // 处理项目
    items.forEach((item, index) => {
      const element = container.children[index] as HTMLElement
      if (!element) return

      let itemRole: string
      switch (type) {
        case 'tree':
          itemRole = 'treeitem'
          break
        case 'menu':
          itemRole = 'menuitem'
          break
        case 'tablist':
          itemRole = 'tab'
          break
        case 'listbox':
          itemRole = 'option'
          break
        default:
          itemRole = 'option'
      }

      this.enhanceElementAria(element, {
        role: itemRole,
        label: item.label,
        level: item.level,
        expanded: item.expanded,
        checked: item.selected,
        disabled: item.disabled,
        setSize: items.length,
        posInSet: index + 1
      })

      // 添加键盘导航
      this.addKeyboardNavigation(element, type, index, items.length, config)
    })
  }

  /**
   * 为控件添加键盘导航
   */
  private addKeyboardNavigation(
    element: HTMLElement, 
    controlType: string, 
    index: number, 
    totalItems: number, 
    config: any
  ): void {
    element.addEventListener('keydown', (event) => {
      let handled = false
      const container = element.parentElement!

      switch (event.key) {
        case 'ArrowDown':
          if (controlType !== 'tablist' || config.orientation === 'vertical') {
            this.focusItem(container, Math.min(index + 1, totalItems - 1))
            handled = true
          }
          break

        case 'ArrowUp':
          if (controlType !== 'tablist' || config.orientation === 'vertical') {
            this.focusItem(container, Math.max(index - 1, 0))
            handled = true
          }
          break

        case 'ArrowRight':
          if (controlType === 'tablist' && config.orientation === 'horizontal') {
            this.focusItem(container, Math.min(index + 1, totalItems - 1))
            handled = true
          } else if (controlType === 'tree') {
            // 展开树节点
            if (element.getAttribute('aria-expanded') === 'false') {
              this.expandTreeItem(element, true, config.onExpand)
              handled = true
            }
          }
          break

        case 'ArrowLeft':
          if (controlType === 'tablist' && config.orientation === 'horizontal') {
            this.focusItem(container, Math.max(index - 1, 0))
            handled = true
          } else if (controlType === 'tree') {
            // 收起树节点
            if (element.getAttribute('aria-expanded') === 'true') {
              this.expandTreeItem(element, false, config.onExpand)
              handled = true
            }
          }
          break

        case 'Home':
          this.focusItem(container, 0)
          handled = true
          break

        case 'End':
          this.focusItem(container, totalItems - 1)
          handled = true
          break

        case ' ':
        case 'Enter':
          if (controlType === 'listbox' || controlType === 'tree') {
            this.selectItem(element, config.onSelectionChange)
            handled = true
          }
          break

        case 'Escape':
          if (controlType === 'menu') {
            // 关闭菜单
            container.style.display = 'none'
            handled = true
          }
          break
      }

      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
    })
  }

  private focusItem(container: HTMLElement, index: number): void {
    const items = Array.from(container.children) as HTMLElement[]
    if (items[index]) {
      items[index].focus()
      this.announceToRegion('navigation-hints', `项目 ${index + 1} / ${items.length}: ${items[index].textContent}`)
    }
  }

  private selectItem(element: HTMLElement, onSelectionChange?: (selectedItems: any[]) => void): void {
    const isSelected = element.getAttribute('aria-selected') === 'true'
    const newSelection = !isSelected
    
    element.setAttribute('aria-selected', newSelection.toString())
    
    if (onSelectionChange) {
      const container = element.parentElement!
      const selectedItems = Array.from(container.querySelectorAll('[aria-selected="true"]'))
      onSelectionChange(selectedItems)
    }

    this.announceToRegion('action-feedback', 
      newSelection ? `${element.textContent} 已选中` : `${element.textContent} 已取消选中`
    )
  }

  private expandTreeItem(element: HTMLElement, expanded: boolean, onExpand?: (itemId: string, expanded: boolean) => void): void {
    element.setAttribute('aria-expanded', expanded.toString())
    
    if (onExpand) {
      onExpand(element.id, expanded)
    }

    this.announceToRegion('action-feedback', 
      expanded ? `${element.textContent} 已展开` : `${element.textContent} 已收起`
    )
  }

  /**
   * 分析语义结构
   */
  analyzeSemanticStructure(): SemanticStructure {
    const structure: SemanticStructure = {
      landmarks: [],
      headings: [],
      regions: [],
      navigation: [],
      lists: [],
      tables: [],
      forms: []
    }

    // 查找地标
    structure.landmarks = Array.from(document.querySelectorAll([
      '[role="banner"]',
      '[role="main"]',
      '[role="contentinfo"]',
      '[role="navigation"]',
      '[role="complementary"]',
      '[role="search"]',
      'header',
      'main',
      'footer',
      'nav',
      'aside',
      'section'
    ].join(', '))) as HTMLElement[]

    // 查找标题
    structure.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLElement[]

    // 查找区域
    structure.regions = Array.from(document.querySelectorAll('[role="region"]')) as HTMLElement[]

    // 查找导航
    structure.navigation = Array.from(document.querySelectorAll('nav, [role="navigation"]')) as HTMLElement[]

    // 查找列表
    structure.lists = Array.from(document.querySelectorAll('ul, ol, dl, [role="list"]')) as HTMLElement[]

    // 查找表格
    structure.tables = Array.from(document.querySelectorAll('table, [role="table"]')) as HTMLElement[]

    // 查找表单
    structure.forms = Array.from(document.querySelectorAll('form')) as HTMLElement[]

    this.semanticStructure = structure

    console.log('AriaEnhancedSystem: Analyzed semantic structure:', structure)

    return structure
  }

  /**
   * 增强表单的可访问性
   */
  enhanceForm(form: HTMLElement): void {
    // 设置表单role和属性
    if (!form.hasAttribute('role')) {
      form.setAttribute('role', 'form')
    }

    const inputs = form.querySelectorAll('input, textarea, select')
    
    inputs.forEach((input) => {
      const inputElement = input as HTMLInputElement
      
      // 确保每个输入都有标签
      this.ensureInputHasLabel(inputElement)
      
      // 添加必需字段标识
      if (inputElement.required) {
        this.enhanceElementAria(inputElement, {
          required: true,
          description: '必需字段'
        })
      }
      
      // 添加错误处理
      this.setupInputValidation(inputElement)
    })

    // 查找和增强提交按钮
    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]')
    submitButtons.forEach((button) => {
      this.enhanceElementAria(button as HTMLElement, {
        description: '提交表单'
      })
    })

    console.log(`AriaEnhancedSystem: Enhanced form with ${inputs.length} inputs`)
  }

  private ensureInputHasLabel(input: HTMLInputElement): void {
    const id = input.id || `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    if (!input.id) {
      input.id = id
    }

    // 查找现有标签
    let label = document.querySelector(`label[for="${id}"]`) as HTMLLabelElement
    
    if (!label) {
      // 查找包装的标签
      label = input.closest('label') as HTMLLabelElement
    }

    if (!label && !input.hasAttribute('aria-label') && !input.hasAttribute('aria-labelledby')) {
      // 创建标签
      const placeholder = input.placeholder
      const type = input.type
      const name = input.name

      let labelText = placeholder || name || `${type} 字段`
      
      // 创建可见标签
      label = document.createElement('label')
      label.htmlFor = id
      label.textContent = labelText
      label.className = 'accessibility-generated-label'
      
      // 插入到输入前面
      if (input.parentNode) {
        input.parentNode.insertBefore(label, input)
      }
      
      console.log(`AriaEnhancedSystem: Created label for input:`, labelText)
    }
  }

  private setupInputValidation(input: HTMLInputElement): void {
    input.addEventListener('invalid', () => {
      input.setAttribute('aria-invalid', 'true')
      
      const validationMessage = input.validationMessage
      if (validationMessage) {
        const errorId = this.createDescriptionElement(validationMessage, input)
        input.setAttribute('aria-describedby', errorId)
        
        this.announceToRegion('alerts', `错误: ${validationMessage}`, '表单验证')
      }
    })

    input.addEventListener('input', () => {
      if (input.checkValidity()) {
        input.setAttribute('aria-invalid', 'false')
        
        // 移除错误描述
        const describedBy = input.getAttribute('aria-describedby')
        if (describedBy) {
          const errorElement = document.getElementById(describedBy)
          if (errorElement && errorElement.textContent === input.validationMessage) {
            errorElement.remove()
            input.removeAttribute('aria-describedby')
          }
        }
      }
    })
  }

  /**
   * 设置动态更新监听
   */
  private setupDynamicUpdates(): void {
    // 监听DOM变化
    const observer = new MutationObserver((mutations) => {
      let shouldReanalyze = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              
              // 自动增强新添加的表单
              if (element.tagName === 'FORM') {
                this.enhanceForm(element)
              }
              
              // 自动增强新添加的输入
              if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
                this.ensureInputHasLabel(element as HTMLInputElement)
              }
              
              shouldReanalyze = true
            }
          })
        }
      })
      
      if (shouldReanalyze) {
        // 延迟重新分析以避免频繁更新
        this.queueUpdate(() => {
          this.analyzeSemanticStructure()
        }, 1000)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  /**
   * 队列更新（防抖）
   */
  private queueUpdate(updateFn: () => void, delay: number = 300): void {
    this.updateQueue.push(updateFn)
    
    if (!this.processingQueue) {
      this.processingQueue = true
      
      setTimeout(() => {
        const updates = [...this.updateQueue]
        this.updateQueue.length = 0
        
        updates.forEach(update => {
          try {
            update()
          } catch (error) {
            console.error('AriaEnhancedSystem: Error processing update:', error)
          }
        })
        
        this.processingQueue = false
      }, delay)
    }
  }

  /**
   * 获取语义结构
   */
  getSemanticStructure(): SemanticStructure | null {
    return this.semanticStructure
  }

  /**
   * 获取实时区域
   */
  getLiveRegion(id: string): AriaLiveRegion | undefined {
    return this.liveRegions.get(id)
  }

  /**
   * 创建上下文描述
   */
  createContextualDescription(element: HTMLElement, config: {
    description: string
    context: string
    relationships?: string[]
    instructions?: string[]
  }): void {
    const contextualDesc: ContextualDescription = {
      element,
      description: config.description,
      context: config.context,
      relationships: config.relationships || [],
      instructions: config.instructions || []
    }

    this.contextualDescriptions.set(element, contextualDesc)

    // 创建完整的描述文本
    let fullDescription = config.description
    
    if (config.context) {
      fullDescription += `. 上下文: ${config.context}`
    }
    
    if (config.relationships && config.relationships.length > 0) {
      fullDescription += `. 相关元素: ${config.relationships.join('、')}`
    }
    
    if (config.instructions && config.instructions.length > 0) {
      fullDescription += `. 操作说明: ${config.instructions.join('；')}`
    }

    this.enhanceElementAria(element, {
      description: fullDescription
    })
  }

  /**
   * 销毁增强系统
   */
  dispose(): void {
    // 移除所有实时区域
    this.liveRegions.forEach((region) => {
      region.element.remove()
    })
    this.liveRegions.clear()

    // 清理上下文描述
    this.contextualDescriptions.clear()

    // 移除样式
    document.getElementById('aria-sr-only-styles')?.remove()

    // 清理更新队列
    this.updateQueue.length = 0
    this.processingQueue = false

    console.log('AriaEnhancedSystem: Disposed')
  }
}

// 导出单例实例
export const ariaEnhancedSystem = new AriaEnhancedSystem()

// 快捷方法导出
export const announceToRegion = (regionId: string, message: string, context?: string) => {
  ariaEnhancedSystem.announceToRegion(regionId, message, context)
}

export const enhanceElementAria = (element: HTMLElement, config: Parameters<AriaEnhancedSystem['enhanceElementAria']>[1]) => {
  ariaEnhancedSystem.enhanceElementAria(element, config)
}

export const createAccessibleControl = (type: Parameters<AriaEnhancedSystem['createAccessibleControl']>[0], config: Parameters<AriaEnhancedSystem['createAccessibleControl']>[1]) => {
  ariaEnhancedSystem.createAccessibleControl(type, config)
}

export const enhanceForm = (form: HTMLElement) => {
  ariaEnhancedSystem.enhanceForm(form)
}

export const createContextualDescription = (element: HTMLElement, config: Parameters<AriaEnhancedSystem['createContextualDescription']>[1]) => {
  ariaEnhancedSystem.createContextualDescription(element, config)
}