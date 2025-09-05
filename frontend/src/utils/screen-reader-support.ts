/**
 * Agent 7: 无障碍访问支持专家 - 屏幕阅读器支持系统
 * 完整的屏幕阅读器支持和实时更新系统
 */

export interface ScreenReaderConfig {
  enabled: boolean
  announcePageChanges: boolean
  announceDragOperations: boolean
  announceStateChanges: boolean
  announceErrors: boolean
  announceSuccess: boolean
  detailedDescriptions: boolean
  spatialDescriptions: boolean
  contextualInformation: boolean
  updateDelay: number
  maxAnnouncementLength: number
  language: string
}

export interface DragOperationContext {
  nodeId: string
  nodeType: string
  nodeLabel: string
  startPosition: { x: number, y: number }
  currentPosition: { x: number, y: number }
  targetElement?: HTMLElement
  operation: 'drag' | 'drop' | 'connect' | 'move'
  status: 'started' | 'moving' | 'completed' | 'cancelled'
}

export interface CanvasContext {
  totalNodes: number
  totalConnections: number
  currentZoom: number
  visibleArea: { x: number, y: number, width: number, height: number }
  selectedNodes: string[]
  focusedNode?: string
}

export interface SpatialRelationship {
  element: HTMLElement
  relatedElements: {
    above?: HTMLElement[]
    below?: HTMLElement[]
    left?: HTMLElement[]
    right?: HTMLElement[]
    inside?: HTMLElement
    contains?: HTMLElement[]
  }
  distance?: number
  direction?: string
}

/**
 * 屏幕阅读器支持系统
 */
export class ScreenReaderSupport {
  private config: ScreenReaderConfig
  private dragContext: DragOperationContext | null = null
  private canvasContext: CanvasContext | null = null
  private spatialMap: Map<HTMLElement, SpatialRelationship> = new Map()
  private announceQueue: Array<{ message: string, priority: 'low' | 'medium' | 'high', delay?: number }> = []
  private processing: boolean = false
  private lastAnnouncement: string = ''
  private lastAnnouncementTime: number = 0

  constructor(config: Partial<ScreenReaderConfig> = {}) {
    this.config = {
      enabled: true,
      announcePageChanges: true,
      announceDragOperations: true,
      announceStateChanges: true,
      announceErrors: true,
      announceSuccess: true,
      detailedDescriptions: true,
      spatialDescriptions: true,
      contextualInformation: true,
      updateDelay: 300,
      maxAnnouncementLength: 200,
      language: 'zh-CN',
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    console.log('ScreenReaderSupport: Initializing screen reader support system')

    // 检测屏幕阅读器
    this.detectScreenReader()

    // 设置页面结构描述
    this.setupPageStructureDescriptions()

    // 启动公告队列处理
    this.startAnnouncementProcessor()

    // 监听页面变化
    this.setupPageChangeListeners()

    console.log('ScreenReaderSupport: Initialization completed')
  }

  /**
   * 检测屏幕阅读器
   */
  private detectScreenReader(): void {
    // 检测常见的屏幕阅读器
    const userAgent = navigator.userAgent.toLowerCase()
    const isScreenReaderActive = 
      window.speechSynthesis !== undefined ||
      userAgent.includes('jaws') ||
      userAgent.includes('nvda') ||
      userAgent.includes('voiceover') ||
      userAgent.includes('dragon') ||
      // 检测辅助技术API
      (window as any).navigator?.userAgentData?.brands?.some((brand: any) => 
        brand.brand?.toLowerCase().includes('assistive')
      ) ||
      // 检测Windows高对比度模式
      window.matchMedia('(prefers-contrast: high)').matches ||
      // 检测减少动画首选项（通常与屏幕阅读器一起使用）
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isScreenReaderActive) {
      document.body.classList.add('screen-reader-active')
      this.announceImmediate('屏幕阅读器支持已激活')
    }

    console.log('ScreenReaderSupport: Screen reader detection result:', isScreenReaderActive)
  }

  /**
   * 设置页面结构描述
   */
  private setupPageStructureDescriptions(): void {
    // 为主要页面区域添加描述
    this.addLandmarkDescriptions()
    
    // 为漏斗构建器添加专门描述
    this.addFunnelBuilderDescriptions()
    
    // 设置导航说明
    this.addNavigationInstructions()
  }

  private addLandmarkDescriptions(): void {
    const landmarks = [
      { selector: 'main, [role="main"]', description: '主要内容区域，包含漏斗构建器界面' },
      { selector: 'nav, [role="navigation"]', description: '主导航菜单，包含页面链接和功能入口' },
      { selector: 'header, [role="banner"]', description: '页面头部，包含网站标题和主要导航' },
      { selector: 'footer, [role="contentinfo"]', description: '页面页脚，包含版权信息和辅助链接' },
      { selector: 'aside, [role="complementary"]', description: '辅助内容区域，包含工具面板和设置选项' }
    ]

    landmarks.forEach(({ selector, description }) => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        element.setAttribute('aria-label', description)
        if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '-1') // 允许编程式聚焦
        }
      }
    })
  }

  private addFunnelBuilderDescriptions(): void {
    // 画布区域描述
    const canvas = document.querySelector('.funnel-canvas, [data-canvas]') as HTMLElement
    if (canvas) {
      canvas.setAttribute('role', 'application')
      canvas.setAttribute('aria-label', '漏斗构建器画布')
      canvas.setAttribute('aria-describedby', 'canvas-instructions')
      
      this.createInstructionElement('canvas-instructions', 
        '这是一个交互式漏斗构建器画布。您可以拖拽节点到画布上创建漏斗，使用箭头键移动选中的节点，使用Tab键在节点之间导航。按Alt+H查看完整的键盘快捷键列表。'
      )
    }

    // 节点调色板描述
    const palette = document.querySelector('.node-palette, [data-palette]') as HTMLElement
    if (palette) {
      palette.setAttribute('role', 'toolbar')
      palette.setAttribute('aria-label', '节点工具面板')
      palette.setAttribute('aria-describedby', 'palette-instructions')
      
      this.createInstructionElement('palette-instructions',
        '节点工具面板包含可拖拽到画布上的不同类型节点。使用Tab键在节点类型之间导航，按空格键或回车键选择节点类型，然后使用Ctrl+方向键将节点添加到画布。'
      )
    }
  }

  private addNavigationInstructions(): void {
    // 创建键盘导航说明
    const instructions = document.createElement('div')
    instructions.id = 'keyboard-navigation-instructions'
    instructions.className = 'sr-only'
    instructions.innerHTML = `
      <h2>键盘导航说明</h2>
      <ul>
        <li>Tab键：在可聚焦元素之间前进导航</li>
        <li>Shift+Tab键：在可聚焦元素之间后退导航</li>
        <li>方向键：在画布上移动选中的节点或在导航组中移动</li>
        <li>空格键或回车键：激活按钮或确认操作</li>
        <li>Escape键：取消当前操作或关闭对话框</li>
        <li>Alt+M：快速跳转到主要内容</li>
        <li>Alt+N：快速跳转到导航菜单</li>
        <li>Alt+H：显示键盘快捷键帮助</li>
      </ul>
    `
    
    document.body.appendChild(instructions)
  }

  private createInstructionElement(id: string, text: string): HTMLElement {
    let element = document.getElementById(id)
    if (!element) {
      element = document.createElement('div')
      element.id = id
      element.className = 'sr-only accessibility-instructions'
      document.body.appendChild(element)
    }
    element.textContent = text
    return element
  }

  /**
   * 拖拽操作描述
   */
  startDragOperation(context: Partial<DragOperationContext>): void {
    if (!this.config.enabled || !this.config.announceDragOperations) return

    this.dragContext = {
      nodeId: '',
      nodeType: '',
      nodeLabel: '',
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      operation: 'drag',
      status: 'started',
      ...context
    } as DragOperationContext

    const message = this.generateDragStartMessage(this.dragContext)
    this.announceImmediate(message, 'high')
  }

  updateDragOperation(updates: Partial<DragOperationContext>): void {
    if (!this.dragContext || !this.config.enabled) return

    Object.assign(this.dragContext, updates)

    if (updates.status === 'moving' && updates.currentPosition) {
      const message = this.generateDragMoveMessage(this.dragContext)
      this.announceDelayed(message, 'medium', 200)
    }
  }

  endDragOperation(result: 'completed' | 'cancelled', targetInfo?: string): void {
    if (!this.dragContext || !this.config.enabled) return

    this.dragContext.status = result === 'completed' ? 'completed' : 'cancelled'
    
    const message = this.generateDragEndMessage(this.dragContext, result, targetInfo)
    this.announceImmediate(message, 'high')

    this.dragContext = null
  }

  private generateDragStartMessage(context: DragOperationContext): string {
    let message = `开始拖拽 ${context.nodeLabel || context.nodeType} 节点`
    
    if (this.config.spatialDescriptions && context.startPosition) {
      message += `，起始位置：${this.formatPosition(context.startPosition)}`
    }

    if (this.config.contextualInformation && this.canvasContext) {
      message += `。画布上共有 ${this.canvasContext.totalNodes} 个节点`
    }

    return this.truncateMessage(message)
  }

  private generateDragMoveMessage(context: DragOperationContext): string {
    if (!this.config.spatialDescriptions) return ''

    const message = `移动到 ${this.formatPosition(context.currentPosition)}`
    
    // 检测潜在的放置目标
    if (context.targetElement) {
      const targetDescription = this.getElementDescription(context.targetElement)
      return `移动到 ${targetDescription} 附近`
    }

    return this.truncateMessage(message)
  }

  private generateDragEndMessage(
    context: DragOperationContext, 
    result: 'completed' | 'cancelled',
    targetInfo?: string
  ): string {
    let message = result === 'completed' ? '拖拽完成' : '拖拽已取消'
    
    if (result === 'completed') {
      if (targetInfo) {
        message += `，${context.nodeLabel} 已放置到 ${targetInfo}`
      } else if (this.config.spatialDescriptions) {
        message += `，节点位置：${this.formatPosition(context.currentPosition)}`
      }
    }

    if (this.config.contextualInformation && this.canvasContext) {
      message += `。画布上现在有 ${this.canvasContext.totalNodes} 个节点`
    }

    return this.truncateMessage(message)
  }

  /**
   * 连接操作描述
   */
  startConnectionOperation(sourceNodeId: string, sourceLabel: string): void {
    if (!this.config.enabled || !this.config.announceDragOperations) return

    const message = `开始从 ${sourceLabel} 创建连接。移动鼠标到目标节点并点击以完成连接，或按Escape键取消。`
    this.announceImmediate(message, 'high')
  }

  completeConnectionOperation(sourceLabel: string, targetLabel: string): void {
    if (!this.config.enabled) return

    const message = `连接已创建：从 ${sourceLabel} 到 ${targetLabel}`
    this.announceImmediate(message, 'high')
  }

  cancelConnectionOperation(): void {
    if (!this.config.enabled) return

    this.announceImmediate('连接操作已取消', 'medium')
  }

  /**
   * 节点和状态变化描述
   */
  announceNodeCreation(nodeId: string, nodeType: string, nodeLabel: string, position: { x: number, y: number }): void {
    if (!this.config.enabled || !this.config.announceStateChanges) return

    let message = `已创建 ${nodeType} 节点：${nodeLabel}`
    
    if (this.config.spatialDescriptions) {
      message += `，位置：${this.formatPosition(position)}`
    }

    if (this.config.contextualInformation && this.canvasContext) {
      message += `。画布上现在有 ${this.canvasContext.totalNodes} 个节点`
    }

    this.announceDelayed(message, 'medium')
  }

  announceNodeSelection(nodeId: string, nodeLabel: string, isMultiSelect: boolean = false): void {
    if (!this.config.enabled || !this.config.announceStateChanges) return

    const prefix = isMultiSelect ? '添加到选择' : '已选中'
    let message = `${prefix}：${nodeLabel}`

    if (this.config.contextualInformation && this.canvasContext?.selectedNodes) {
      const totalSelected = this.canvasContext.selectedNodes.length
      if (totalSelected > 1) {
        message += `。共选中 ${totalSelected} 个节点`
      }
    }

    // 添加可用操作提示
    message += '。可用操作：按Delete键删除，按Ctrl+C复制，按方向键移动。'

    this.announceDelayed(message, 'medium')
  }

  announceNodeDeletion(nodeLabel: string, remainingCount: number): void {
    if (!this.config.enabled || !this.config.announceStateChanges) return

    const message = `已删除节点：${nodeLabel}。画布上还有 ${remainingCount} 个节点。`
    this.announceImmediate(message, 'medium')
  }

  announceCanvasChange(context: Partial<CanvasContext>): void {
    if (!this.config.enabled || !this.config.announcePageChanges) return

    this.canvasContext = { ...this.canvasContext, ...context } as CanvasContext

    let changes: string[] = []

    if (context.currentZoom !== undefined) {
      changes.push(`缩放级别：${Math.round(context.currentZoom * 100)}%`)
    }

    if (context.totalNodes !== undefined) {
      changes.push(`节点数量：${context.totalNodes}`)
    }

    if (context.totalConnections !== undefined) {
      changes.push(`连接数量：${context.totalConnections}`)
    }

    if (changes.length > 0) {
      const message = `画布更新：${changes.join('，')}`
      this.announceDelayed(message, 'low', 500)
    }
  }

  /**
   * 错误和成功消息
   */
  announceError(error: string, context?: string): void {
    if (!this.config.enabled || !this.config.announceErrors) return

    let message = `错误：${error}`
    if (context) {
      message += `。上下文：${context}`
    }

    this.announceImmediate(message, 'high')
  }

  announceSuccess(success: string, details?: string): void {
    if (!this.config.enabled || !this.config.announceSuccess) return

    let message = `成功：${success}`
    if (details) {
      message += `。${details}`
    }

    this.announceDelayed(message, 'medium')
  }

  announceWarning(warning: string, suggestion?: string): void {
    if (!this.config.enabled) return

    let message = `警告：${warning}`
    if (suggestion) {
      message += `。建议：${suggestion}`
    }

    this.announceDelayed(message, 'medium')
  }

  /**
   * 空间关系描述
   */
  updateSpatialRelationships(elements: HTMLElement[]): void {
    if (!this.config.spatialDescriptions) return

    elements.forEach(element => {
      const relationships = this.calculateSpatialRelationships(element, elements)
      this.spatialMap.set(element, relationships)
    })
  }

  private calculateSpatialRelationships(element: HTMLElement, allElements: HTMLElement[]): SpatialRelationship {
    const elementRect = element.getBoundingClientRect()
    const relationships: SpatialRelationship = {
      element,
      relatedElements: {
        above: [],
        below: [],
        left: [],
        right: []
      }
    }

    allElements.forEach(otherElement => {
      if (otherElement === element) return

      const otherRect = otherElement.getBoundingClientRect()
      const distance = this.calculateDistance(elementRect, otherRect)

      // 判断相对位置
      if (otherRect.bottom < elementRect.top) {
        relationships.relatedElements.above!.push(otherElement)
      } else if (otherRect.top > elementRect.bottom) {
        relationships.relatedElements.below!.push(otherElement)
      } else if (otherRect.right < elementRect.left) {
        relationships.relatedElements.left!.push(otherElement)
      } else if (otherRect.left > elementRect.right) {
        relationships.relatedElements.right!.push(otherElement)
      }
    })

    // 按距离排序
    Object.values(relationships.relatedElements).forEach(relatedElements => {
      if (relatedElements) {
        relatedElements.sort((a, b) => {
          const distA = this.calculateDistance(elementRect, a.getBoundingClientRect())
          const distB = this.calculateDistance(elementRect, b.getBoundingClientRect())
          return distA - distB
        })
      }
    })

    return relationships
  }

  private calculateDistance(rect1: DOMRect, rect2: DOMRect): number {
    const centerX1 = rect1.left + rect1.width / 2
    const centerY1 = rect1.top + rect1.height / 2
    const centerX2 = rect2.left + rect2.width / 2
    const centerY2 = rect2.top + rect2.height / 2

    return Math.sqrt(Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2))
  }

  describeSpatialContext(element: HTMLElement): string {
    const relationships = this.spatialMap.get(element)
    if (!relationships) return ''

    const descriptions: string[] = []
    const { relatedElements } = relationships

    if (relatedElements.above && relatedElements.above.length > 0) {
      const nearest = relatedElements.above[0]
      descriptions.push(`上方有${this.getElementDescription(nearest)}`)
    }

    if (relatedElements.below && relatedElements.below.length > 0) {
      const nearest = relatedElements.below[0]
      descriptions.push(`下方有${this.getElementDescription(nearest)}`)
    }

    if (relatedElements.left && relatedElements.left.length > 0) {
      const nearest = relatedElements.left[0]
      descriptions.push(`左侧有${this.getElementDescription(nearest)}`)
    }

    if (relatedElements.right && relatedElements.right.length > 0) {
      const nearest = relatedElements.right[0]
      descriptions.push(`右侧有${this.getElementDescription(nearest)}`)
    }

    return descriptions.length > 0 ? descriptions.join('，') : '周围没有其他元素'
  }

  /**
   * 公告队列处理
   */
  private announceImmediate(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    if (!this.config.enabled) return

    // 清空队列中的低优先级消息
    if (priority === 'high') {
      this.announceQueue = this.announceQueue.filter(item => item.priority === 'high')
    }

    this.processAnnouncement(message, priority)
  }

  private announceDelayed(
    message: string, 
    priority: 'low' | 'medium' | 'high' = 'medium', 
    delay: number = this.config.updateDelay
  ): void {
    if (!this.config.enabled) return

    this.announceQueue.push({ message, priority, delay })
    
    if (!this.processing) {
      this.processAnnouncementQueue()
    }
  }

  private startAnnouncementProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.announceQueue.length > 0) {
        this.processAnnouncementQueue()
      }
    }, 100)
  }

  private async processAnnouncementQueue(): Promise<void> {
    if (this.processing || this.announceQueue.length === 0) return

    this.processing = true

    while (this.announceQueue.length > 0) {
      // 按优先级排序
      this.announceQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      const item = this.announceQueue.shift()!
      
      if (item.delay && item.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, item.delay))
      }

      this.processAnnouncement(item.message, item.priority)

      // 在公告之间添加小延迟
      if (this.announceQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    this.processing = false
  }

  private processAnnouncement(message: string, priority: 'low' | 'medium' | 'high'): void {
    const truncatedMessage = this.truncateMessage(message)
    
    // 避免重复公告
    const now = Date.now()
    if (truncatedMessage === this.lastAnnouncement && now - this.lastAnnouncementTime < 1000) {
      return
    }

    this.lastAnnouncement = truncatedMessage
    this.lastAnnouncementTime = now

    // 使用ARIA实时区域
    const ariaSystem = (window as any).ariaEnhancedSystem
    if (ariaSystem) {
      const regionMap = {
        high: 'alerts',
        medium: 'status-updates', 
        low: 'action-feedback'
      }
      const region = regionMap[priority]
      ariaSystem.announceToRegion(region, truncatedMessage)
    }

    // 备用：控制台日志（用于调试）
    console.log(`ScreenReader [${priority}]:`, truncatedMessage)
  }

  /**
   * 实用方法
   */
  private formatPosition(position: { x: number, y: number }): string {
    return `横坐标 ${Math.round(position.x)}，纵坐标 ${Math.round(position.y)}`
  }

  private getElementDescription(element: HTMLElement): string {
    const label = element.getAttribute('aria-label') ||
                  element.textContent?.trim() ||
                  element.getAttribute('title') ||
                  element.tagName.toLowerCase()
    
    const role = element.getAttribute('role')
    return role ? `${label}（${role}）` : label
  }

  private truncateMessage(message: string): string {
    if (message.length <= this.config.maxAnnouncementLength) {
      return message
    }
    return message.substring(0, this.config.maxAnnouncementLength - 3) + '...'
  }

  private setupPageChangeListeners(): void {
    // 监听页面标题变化
    const titleObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.target === document.querySelector('title')) {
          this.announceDelayed(`页面标题已更改为：${document.title}`, 'medium')
        }
      })
    })

    const titleElement = document.querySelector('title')
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true })
    }

    // 监听路由变化
    window.addEventListener('popstate', () => {
      this.announceDelayed('页面已导航', 'medium')
    })

    // 监听焦点变化到标志性元素
    document.addEventListener('focusin', (event) => {
      const element = event.target as HTMLElement
      const landmarks = ['main', 'navigation', 'contentinfo', 'banner', 'complementary']
      const role = element.getAttribute('role')
      const tagName = element.tagName.toLowerCase()

      if (landmarks.includes(role || '') || ['main', 'nav', 'header', 'footer', 'aside'].includes(tagName)) {
        const description = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-describedby') && 
                          document.getElementById(element.getAttribute('aria-describedby')!)?.textContent
        
        if (description) {
          this.announceDelayed(`进入${description}`, 'medium')
        }
      }
    })
  }

  /**
   * 配置管理
   */
  updateConfig(newConfig: Partial<ScreenReaderConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (!this.config.enabled) {
      this.announceQueue.length = 0
    }
    
    console.log('ScreenReaderSupport: Configuration updated', this.config)
  }

  getConfig(): ScreenReaderConfig {
    return { ...this.config }
  }

  /**
   * 系统状态
   */
  getStatus(): {
    enabled: boolean
    queueLength: number
    processing: boolean
    dragActive: boolean
    spatialElementsTracked: number
  } {
    return {
      enabled: this.config.enabled,
      queueLength: this.announceQueue.length,
      processing: this.processing,
      dragActive: this.dragContext !== null,
      spatialElementsTracked: this.spatialMap.size
    }
  }

  /**
   * 销毁系统
   */
  dispose(): void {
    this.announceQueue.length = 0
    this.spatialMap.clear()
    this.dragContext = null
    this.canvasContext = null
    this.processing = false

    // 移除说明元素
    document.getElementById('keyboard-navigation-instructions')?.remove()
    document.getElementById('canvas-instructions')?.remove()
    document.getElementById('palette-instructions')?.remove()

    console.log('ScreenReaderSupport: Disposed')
  }
}

// 导出单例实例
export const screenReaderSupport = new ScreenReaderSupport()

// 快捷方法导出
export const announceToScreenReader = (message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
  screenReaderSupport.announceDelayed(message, priority)
}

export const startDragOperation = (context: Partial<DragOperationContext>) => {
  screenReaderSupport.startDragOperation(context)
}

export const endDragOperation = (result: 'completed' | 'cancelled', targetInfo?: string) => {
  screenReaderSupport.endDragOperation(result, targetInfo)
}

export const announceNodeSelection = (nodeId: string, nodeLabel: string, isMultiSelect?: boolean) => {
  screenReaderSupport.announceNodeSelection(nodeId, nodeLabel, isMultiSelect)
}

export const announceCanvasChange = (context: Partial<CanvasContext>) => {
  screenReaderSupport.announceCanvasChange(context)
}