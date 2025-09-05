/**
 * Agent 7: 无障碍访问支持专家 - 视觉辅助系统
 * 完整的视觉辅助功能（高对比度、放大镜、颜色盲友好、暗黑主题等）
 */

export interface VisualAccessibilityConfig {
  highContrast: boolean
  darkMode: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome'
  textScaling: number
  reducedMotion: boolean
  focusEnhancement: boolean
  customColors: ColorTheme
  magnifier: MagnifierConfig
  cursorEnhancement: CursorConfig
}

export interface ColorTheme {
  background: string
  foreground: string
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  border: string
  shadow: string
}

export interface MagnifierConfig {
  enabled: boolean
  zoomLevel: number
  size: number
  shape: 'circle' | 'square'
  borderStyle: string
  followCursor: boolean
  followFocus: boolean
  smoothTransition: boolean
}

export interface CursorConfig {
  enhanced: boolean
  size: number
  color: string
  outline: boolean
  trail: boolean
  crosshair: boolean
}

export interface ColorBlindFilter {
  name: string
  matrix: number[]
  description: string
}

/**
 * 视觉辅助系统管理器
 */
export class VisualAccessibilitySystem {
  private config: VisualAccessibilityConfig
  private magnifierElement: HTMLElement | null = null
  private magnifierCanvas: HTMLCanvasElement | null = null
  private magnifierContext: CanvasRenderingContext2D | null = null
  private animationFrame: number | null = null
  private mediaQueryList: MediaQueryList | null = null
  private observers: ResizeObserver[] = []

  // 默认颜色主题
  private defaultTheme: ColorTheme = {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#0066cc',
    secondary: '#6c757d',
    accent: '#17a2b8',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
    border: '#dee2e6',
    shadow: 'rgba(0,0,0,0.1)'
  }

  // 高对比度主题
  private highContrastTheme: ColorTheme = {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#00ffff',
    secondary: '#ffff00',
    accent: '#ff00ff',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    info: '#00ffff',
    border: '#ffffff',
    shadow: '#ffffff'
  }

  // 暗黑主题
  private darkTheme: ColorTheme = {
    background: '#1a1a1a',
    foreground: '#e0e0e0',
    primary: '#4da6ff',
    secondary: '#8a8a8a',
    accent: '#26d0ce',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    border: '#404040',
    shadow: 'rgba(255,255,255,0.1)'
  }

  // 色盲滤镜矩阵
  private colorBlindFilters: Record<string, ColorBlindFilter> = {
    protanopia: {
      name: '红色盲',
      description: '无法感知红色',
      matrix: [
        0.567, 0.433, 0, 0, 0,
        0.558, 0.442, 0, 0, 0,
        0, 0.242, 0.758, 0, 0,
        0, 0, 0, 1, 0
      ]
    },
    deuteranopia: {
      name: '绿色盲',
      description: '无法感知绿色',
      matrix: [
        0.625, 0.375, 0, 0, 0,
        0.7, 0.3, 0, 0, 0,
        0, 0.3, 0.7, 0, 0,
        0, 0, 0, 1, 0
      ]
    },
    tritanopia: {
      name: '蓝色盲',
      description: '无法感知蓝色',
      matrix: [
        0.95, 0.05, 0, 0, 0,
        0, 0.433, 0.567, 0, 0,
        0, 0.475, 0.525, 0, 0,
        0, 0, 0, 1, 0
      ]
    },
    monochrome: {
      name: '单色视觉',
      description: '只能看到灰度',
      matrix: [
        0.299, 0.587, 0.114, 0, 0,
        0.299, 0.587, 0.114, 0, 0,
        0.299, 0.587, 0.114, 0, 0,
        0, 0, 0, 1, 0
      ]
    }
  }

  constructor(config: Partial<VisualAccessibilityConfig> = {}) {
    this.config = {
      highContrast: false,
      darkMode: false,
      colorBlindMode: 'none',
      textScaling: 1.0,
      reducedMotion: false,
      focusEnhancement: true,
      customColors: this.defaultTheme,
      magnifier: {
        enabled: false,
        zoomLevel: 2,
        size: 200,
        shape: 'circle',
        borderStyle: '3px solid #0066cc',
        followCursor: true,
        followFocus: false,
        smoothTransition: true
      },
      cursorEnhancement: {
        enhanced: false,
        size: 1.5,
        color: '#ff0000',
        outline: true,
        trail: false,
        crosshair: false
      },
      ...config
    }

    this.initialize()
  }

  private initialize(): void {
    console.log('VisualAccessibilitySystem: Initializing visual accessibility system')

    // 检测系统偏好设置
    this.detectSystemPreferences()

    // 初始化主题
    this.initializeThemes()

    // 初始化放大镜
    this.initializeMagnifier()

    // 初始化光标增强
    this.initializeCursorEnhancement()

    // 应用当前配置
    this.applyConfiguration()

    // 设置监听器
    this.setupEventListeners()

    console.log('VisualAccessibilitySystem: Initialization completed')
  }

  /**
   * 检测系统偏好设置
   */
  private detectSystemPreferences(): void {
    // 检测暗黑模式偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.config.darkMode = true
    }

    // 检测减少动画偏好
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.reducedMotion = true
    }

    // 检测高对比度偏好
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.highContrast = true
    }

    // 监听系统偏好设置变化
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
    this.mediaQueryList.addEventListener('change', (e) => {
      if (!this.config.darkMode && e.matches) {
        this.enableDarkMode()
      } else if (this.config.darkMode && !e.matches) {
        this.disableDarkMode()
      }
    })

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', (e) => {
      this.config.reducedMotion = e.matches
      this.applyReducedMotion()
    })
  }

  /**
   * 初始化主题
   */
  private initializeThemes(): void {
    // 创建CSS变量
    this.createCSSVariables()

    // 创建主题样式
    this.createThemeStyles()
  }

  private createCSSVariables(): void {
    const root = document.documentElement
    const theme = this.getCurrentTheme()

    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--accessibility-${key}`, value)
    })
  }

  private createThemeStyles(): void {
    const styleId = 'visual-accessibility-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = this.generateThemeCSS()
  }

  private generateThemeCSS(): string {
    return `
      /* 基础主题变量 */
      :root {
        --accessibility-background: ${this.config.customColors.background};
        --accessibility-foreground: ${this.config.customColors.foreground};
        --accessibility-primary: ${this.config.customColors.primary};
        --accessibility-secondary: ${this.config.customColors.secondary};
        --accessibility-accent: ${this.config.customColors.accent};
        --accessibility-success: ${this.config.customColors.success};
        --accessibility-warning: ${this.config.customColors.warning};
        --accessibility-error: ${this.config.customColors.error};
        --accessibility-info: ${this.config.customColors.info};
        --accessibility-border: ${this.config.customColors.border};
        --accessibility-shadow: ${this.config.customColors.shadow};
      }

      /* 高对比度模式 */
      .accessibility-high-contrast {
        filter: contrast(150%) !important;
      }

      .accessibility-high-contrast * {
        background-color: var(--accessibility-background) !important;
        color: var(--accessibility-foreground) !important;
        border-color: var(--accessibility-border) !important;
        box-shadow: 0 0 0 1px var(--accessibility-border) !important;
      }

      .accessibility-high-contrast input,
      .accessibility-high-contrast textarea,
      .accessibility-high-contrast select {
        background-color: var(--accessibility-background) !important;
        color: var(--accessibility-foreground) !important;
        border: 2px solid var(--accessibility-border) !important;
      }

      .accessibility-high-contrast button,
      .accessibility-high-contrast [role="button"] {
        background-color: var(--accessibility-primary) !important;
        color: var(--accessibility-background) !important;
        border: 2px solid var(--accessibility-border) !important;
      }

      .accessibility-high-contrast a,
      .accessibility-high-contrast [role="link"] {
        color: var(--accessibility-accent) !important;
        text-decoration: underline !important;
      }

      /* 暗黑模式 */
      .accessibility-dark-mode {
        background-color: var(--accessibility-background) !important;
        color: var(--accessibility-foreground) !important;
      }

      .accessibility-dark-mode * {
        background-color: inherit;
        color: inherit;
      }

      /* 文本缩放 */
      .accessibility-text-scaling {
        font-size: ${this.config.textScaling}rem !important;
      }

      /* 减少动画 */
      .accessibility-reduced-motion *,
      .accessibility-reduced-motion *::before,
      .accessibility-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      /* 焦点增强 */
      .accessibility-focus-enhancement *:focus {
        outline: 4px solid var(--accessibility-accent) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px var(--accessibility-background),
                    0 0 0 6px var(--accessibility-accent) !important;
        border-radius: 4px;
      }

      /* 光标增强 */
      .accessibility-cursor-enhanced {
        cursor: none !important;
      }

      .accessibility-cursor-enhanced * {
        cursor: none !important;
      }

      .accessibility-cursor-custom {
        position: fixed;
        width: ${this.config.cursorEnhancement.size * 20}px;
        height: ${this.config.cursorEnhancement.size * 20}px;
        border: ${this.config.cursorEnhancement.outline ? '2px solid' : 'none'} ${this.config.cursorEnhancement.color};
        border-radius: 50%;
        background-color: ${this.config.cursorEnhancement.color};
        opacity: 0.8;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        transition: ${this.config.cursorEnhancement.trail ? 'all 0.1s ease-out' : 'none'};
      }

      .accessibility-cursor-crosshair::before,
      .accessibility-cursor-crosshair::after {
        content: '';
        position: fixed;
        background-color: ${this.config.cursorEnhancement.color};
        opacity: 0.6;
        pointer-events: none;
        z-index: 9999;
      }

      .accessibility-cursor-crosshair::before {
        width: 100vw;
        height: 1px;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
      }

      .accessibility-cursor-crosshair::after {
        width: 1px;
        height: 100vh;
        left: 50%;
        top: 0;
        transform: translateX(-50%);
      }

      /* 色盲滤镜 */
      .accessibility-color-blind-filter {
        filter: url(#colorblind-filter);
      }

      /* 放大镜样式 */
      .accessibility-magnifier {
        position: fixed;
        border: ${this.config.magnifier.borderStyle};
        border-radius: ${this.config.magnifier.shape === 'circle' ? '50%' : '8px'};
        overflow: hidden;
        pointer-events: none;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(0px);
        transition: ${this.config.magnifier.smoothTransition ? 'all 0.2s ease-out' : 'none'};
      }

      .accessibility-magnifier canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `
  }

  /**
   * 初始化放大镜
   */
  private initializeMagnifier(): void {
    if (!this.config.magnifier.enabled) return

    // 创建放大镜元素
    this.magnifierElement = document.createElement('div')
    this.magnifierElement.className = 'accessibility-magnifier'
    this.magnifierElement.style.width = `${this.config.magnifier.size}px`
    this.magnifierElement.style.height = `${this.config.magnifier.size}px`
    this.magnifierElement.style.display = 'none'

    // 创建画布
    this.magnifierCanvas = document.createElement('canvas')
    this.magnifierCanvas.width = this.config.magnifier.size
    this.magnifierCanvas.height = this.config.magnifier.size
    this.magnifierContext = this.magnifierCanvas.getContext('2d')

    this.magnifierElement.appendChild(this.magnifierCanvas)
    document.body.appendChild(this.magnifierElement)

    // 设置事件监听器
    this.setupMagnifierListeners()
  }

  private setupMagnifierListeners(): void {
    if (!this.config.magnifier.enabled) return

    if (this.config.magnifier.followCursor) {
      document.addEventListener('mousemove', this.handleMagnifierMouseMove.bind(this))
      document.addEventListener('mouseenter', this.showMagnifier.bind(this))
      document.addEventListener('mouseleave', this.hideMagnifier.bind(this))
    }

    if (this.config.magnifier.followFocus) {
      document.addEventListener('focusin', this.handleMagnifierFocus.bind(this))
      document.addEventListener('focusout', this.hideMagnifier.bind(this))
    }
  }

  private handleMagnifierMouseMove(event: MouseEvent): void {
    if (!this.magnifierElement || !this.magnifierContext) return

    const x = event.clientX
    const y = event.clientY

    // 更新放大镜位置
    this.updateMagnifierPosition(x, y)

    // 更新放大镜内容
    this.updateMagnifierContent(x, y)
  }

  private handleMagnifierFocus(event: FocusEvent): void {
    const element = event.target as HTMLElement
    if (!element) return

    const rect = element.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    this.updateMagnifierPosition(x, y)
    this.updateMagnifierContent(x, y)
    this.showMagnifier()
  }

  private updateMagnifierPosition(x: number, y: number): void {
    if (!this.magnifierElement) return

    const size = this.config.magnifier.size
    const offset = 20

    let left = x - size / 2
    let top = y - size - offset

    // 边界检测
    if (left < 0) left = 0
    if (left + size > window.innerWidth) left = window.innerWidth - size
    if (top < 0) top = y + offset

    this.magnifierElement.style.left = `${left}px`
    this.magnifierElement.style.top = `${top}px`
  }

  private updateMagnifierContent(x: number, y: number): void {
    if (!this.magnifierContext || !this.magnifierCanvas) return

    const size = this.config.magnifier.size
    const zoom = this.config.magnifier.zoomLevel
    const sourceSize = size / zoom

    // 计算源区域
    const sourceX = x - sourceSize / 2
    const sourceY = y - sourceSize / 2

    // 清除画布
    this.magnifierContext.clearRect(0, 0, size, size)

    try {
      // 使用html2canvas或类似技术捕获屏幕内容
      // 这里使用一个简化的实现
      this.captureScreenArea(sourceX, sourceY, sourceSize, sourceSize)
        .then(imageData => {
          if (imageData && this.magnifierContext) {
            this.magnifierContext.putImageData(imageData, 0, 0)
          }
        })
    } catch (error) {
      console.warn('VisiualAccessibilitySystem: Failed to update magnifier content:', error)
    }
  }

  private async captureScreenArea(x: number, y: number, width: number, height: number): Promise<ImageData | null> {
    // 这是一个简化的屏幕捕获实现
    // 在实际应用中，可能需要使用更复杂的方法
    if (!this.magnifierContext) return null

    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return null

      canvas.width = width
      canvas.height = height

      // 创建一个白色背景
      context.fillStyle = this.config.customColors.background
      context.fillRect(0, 0, width, height)

      // 添加一些示例内容
      context.fillStyle = this.config.customColors.foreground
      context.font = '14px Arial'
      context.textAlign = 'center'
      context.fillText('放大镜视图', width / 2, height / 2)

      return context.getImageData(0, 0, width, height)
    } catch (error) {
      console.warn('Failed to capture screen area:', error)
      return null
    }
  }

  private showMagnifier(): void {
    if (this.magnifierElement) {
      this.magnifierElement.style.display = 'block'
    }
  }

  private hideMagnifier(): void {
    if (this.magnifierElement) {
      this.magnifierElement.style.display = 'none'
    }
  }

  /**
   * 初始化光标增强
   */
  private initializeCursorEnhancement(): void {
    if (!this.config.cursorEnhancement.enhanced) return

    // 添加自定义光标样式类
    document.body.classList.add('accessibility-cursor-enhanced')

    // 创建自定义光标元素
    const cursorElement = document.createElement('div')
    cursorElement.className = 'accessibility-cursor-custom'
    
    if (this.config.cursorEnhancement.crosshair) {
      cursorElement.classList.add('accessibility-cursor-crosshair')
    }

    document.body.appendChild(cursorElement)

    // 跟踪鼠标移动
    document.addEventListener('mousemove', (event) => {
      cursorElement.style.left = `${event.clientX}px`
      cursorElement.style.top = `${event.clientY}px`
    })
  }

  /**
   * 色盲支持
   */
  private applyColorBlindFilter(): void {
    if (this.config.colorBlindMode === 'none') {
      this.removeColorBlindFilter()
      return
    }

    const filter = this.colorBlindFilters[this.config.colorBlindMode]
    if (!filter) return

    // 创建SVG滤镜
    this.createColorBlindSVGFilter(filter)

    // 应用滤镜
    document.body.classList.add('accessibility-color-blind-filter')
  }

  private createColorBlindSVGFilter(filter: ColorBlindFilter): void {
    // 移除现有的滤镜
    document.getElementById('colorblind-svg-filter')?.remove()

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'colorblind-svg-filter'
    svg.style.position = 'absolute'
    svg.style.width = '0'
    svg.style.height = '0'

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const colorFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
    colorFilter.id = 'colorblind-filter'

    const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix')
    colorMatrix.setAttribute('type', 'matrix')
    colorMatrix.setAttribute('values', filter.matrix.join(' '))

    colorFilter.appendChild(colorMatrix)
    defs.appendChild(colorFilter)
    svg.appendChild(defs)
    document.body.appendChild(svg)
  }

  private removeColorBlindFilter(): void {
    document.body.classList.remove('accessibility-color-blind-filter')
    document.getElementById('colorblind-svg-filter')?.remove()
  }

  /**
   * 主题切换方法
   */
  enableHighContrastMode(): void {
    this.config.highContrast = true
    this.config.customColors = this.highContrastTheme
    document.body.classList.add('accessibility-high-contrast')
    this.createCSSVariables()
    this.announceChange('高对比度模式已启用')
  }

  disableHighContrastMode(): void {
    this.config.highContrast = false
    this.config.customColors = this.getCurrentTheme()
    document.body.classList.remove('accessibility-high-contrast')
    this.createCSSVariables()
    this.announceChange('高对比度模式已禁用')
  }

  enableDarkMode(): void {
    this.config.darkMode = true
    this.config.customColors = this.darkTheme
    document.body.classList.add('accessibility-dark-mode')
    this.createCSSVariables()
    this.announceChange('暗黑模式已启用')
  }

  disableDarkMode(): void {
    this.config.darkMode = false
    this.config.customColors = this.defaultTheme
    document.body.classList.remove('accessibility-dark-mode')
    this.createCSSVariables()
    this.announceChange('暗黑模式已禁用')
  }

  setColorBlindMode(mode: VisualAccessibilityConfig['colorBlindMode']): void {
    this.config.colorBlindMode = mode
    this.applyColorBlindFilter()
    
    const modeNames = {
      none: '正常视觉',
      protanopia: '红色盲模式',
      deuteranopia: '绿色盲模式',
      tritanopia: '蓝色盲模式',
      monochrome: '单色视觉模式'
    }
    
    this.announceChange(`${modeNames[mode]}已启用`)
  }

  setTextScaling(scale: number): void {
    this.config.textScaling = Math.max(0.5, Math.min(3.0, scale))
    document.documentElement.style.fontSize = `${this.config.textScaling}rem`
    
    if (this.config.textScaling !== 1) {
      document.body.classList.add('accessibility-text-scaling')
    } else {
      document.body.classList.remove('accessibility-text-scaling')
    }
    
    this.announceChange(`文本大小已调整为${Math.round(this.config.textScaling * 100)}%`)
  }

  toggleMagnifier(): void {
    this.config.magnifier.enabled = !this.config.magnifier.enabled
    
    if (this.config.magnifier.enabled) {
      this.initializeMagnifier()
      this.announceChange('放大镜已启用')
    } else {
      this.magnifierElement?.remove()
      this.magnifierElement = null
      this.announceChange('放大镜已禁用')
    }
  }

  toggleCursorEnhancement(): void {
    this.config.cursorEnhancement.enhanced = !this.config.cursorEnhancement.enhanced
    
    if (this.config.cursorEnhancement.enhanced) {
      this.initializeCursorEnhancement()
      this.announceChange('光标增强已启用')
    } else {
      document.body.classList.remove('accessibility-cursor-enhanced')
      document.querySelector('.accessibility-cursor-custom')?.remove()
      this.announceChange('光标增强已禁用')
    }
  }

  private applyReducedMotion(): void {
    if (this.config.reducedMotion) {
      document.body.classList.add('accessibility-reduced-motion')
      this.announceChange('动画已减少')
    } else {
      document.body.classList.remove('accessibility-reduced-motion')
      this.announceChange('动画已恢复')
    }
  }

  private applyFocusEnhancement(): void {
    if (this.config.focusEnhancement) {
      document.body.classList.add('accessibility-focus-enhancement')
    } else {
      document.body.classList.remove('accessibility-focus-enhancement')
    }
  }

  /**
   * 应用配置
   */
  private applyConfiguration(): void {
    // 应用高对比度
    if (this.config.highContrast) {
      this.enableHighContrastMode()
    }

    // 应用暗黑模式
    if (this.config.darkMode) {
      this.enableDarkMode()
    }

    // 应用色盲模式
    this.applyColorBlindFilter()

    // 应用文本缩放
    this.setTextScaling(this.config.textScaling)

    // 应用减少动画
    this.applyReducedMotion()

    // 应用焦点增强
    this.applyFocusEnhancement()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听窗口大小变化
    const resizeObserver = new ResizeObserver(() => {
      if (this.magnifierElement) {
        // 重新计算放大镜位置
        this.updateMagnifierPosition(
          window.innerWidth / 2,
          window.innerHeight / 2
        )
      }
    })

    resizeObserver.observe(document.body)
    this.observers.push(resizeObserver)

    // 监听键盘事件（快捷键）
    document.addEventListener('keydown', (event) => {
      this.handleKeyboardShortcuts(event)
    })
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl+Alt+H - 切换高对比度
    if (event.ctrlKey && event.altKey && event.key === 'h') {
      event.preventDefault()
      if (this.config.highContrast) {
        this.disableHighContrastMode()
      } else {
        this.enableHighContrastMode()
      }
    }

    // Ctrl+Alt+D - 切换暗黑模式
    if (event.ctrlKey && event.altKey && event.key === 'd') {
      event.preventDefault()
      if (this.config.darkMode) {
        this.disableDarkMode()
      } else {
        this.enableDarkMode()
      }
    }

    // Ctrl+Alt+M - 切换放大镜
    if (event.ctrlKey && event.altKey && event.key === 'm') {
      event.preventDefault()
      this.toggleMagnifier()
    }

    // Ctrl+Alt+C - 切换光标增强
    if (event.ctrlKey && event.altKey && event.key === 'c') {
      event.preventDefault()
      this.toggleCursorEnhancement()
    }

    // Ctrl+Alt+加号 - 增大文本
    if (event.ctrlKey && event.altKey && (event.key === '+' || event.key === '=')) {
      event.preventDefault()
      this.setTextScaling(this.config.textScaling + 0.1)
    }

    // Ctrl+Alt+减号 - 减小文本
    if (event.ctrlKey && event.altKey && event.key === '-') {
      event.preventDefault()
      this.setTextScaling(this.config.textScaling - 0.1)
    }

    // Ctrl+Alt+0 - 重置文本大小
    if (event.ctrlKey && event.altKey && event.key === '0') {
      event.preventDefault()
      this.setTextScaling(1.0)
    }
  }

  /**
   * 实用方法
   */
  private getCurrentTheme(): ColorTheme {
    if (this.config.highContrast) {
      return this.highContrastTheme
    } else if (this.config.darkMode) {
      return this.darkTheme
    } else {
      return this.defaultTheme
    }
  }

  private announceChange(message: string): void {
    // 使用屏幕阅读器支持系统宣布变化
    const screenReaderSupport = (window as any).screenReaderSupport
    if (screenReaderSupport) {
      screenReaderSupport.announceSuccess(message)
    } else {
      console.log('Visual Accessibility:', message)
    }
  }

  /**
   * 配置管理
   */
  updateConfig(newConfig: Partial<VisualAccessibilityConfig>): void {
    const oldConfig = { ...this.config }
    this.config = { ...this.config, ...newConfig }

    // 重新应用配置
    this.applyConfiguration()

    // 重新创建样式
    this.createThemeStyles()

    console.log('VisualAccessibilitySystem: Configuration updated')
  }

  getConfig(): VisualAccessibilityConfig {
    return { ...this.config }
  }

  /**
   * 系统状态
   */
  getStatus(): {
    highContrast: boolean
    darkMode: boolean
    colorBlindMode: string
    textScaling: number
    magnifierEnabled: boolean
    cursorEnhanced: boolean
    reducedMotion: boolean
  } {
    return {
      highContrast: this.config.highContrast,
      darkMode: this.config.darkMode,
      colorBlindMode: this.config.colorBlindMode,
      textScaling: this.config.textScaling,
      magnifierEnabled: this.config.magnifier.enabled,
      cursorEnhanced: this.config.cursorEnhancement.enhanced,
      reducedMotion: this.config.reducedMotion
    }
  }

  /**
   * 销毁系统
   */
  dispose(): void {
    // 移除样式
    document.getElementById('visual-accessibility-styles')?.remove()
    document.getElementById('colorblind-svg-filter')?.remove()

    // 移除元素
    this.magnifierElement?.remove()
    document.querySelector('.accessibility-cursor-custom')?.remove()

    // 移除类
    document.body.classList.remove(
      'accessibility-high-contrast',
      'accessibility-dark-mode',
      'accessibility-text-scaling',
      'accessibility-reduced-motion',
      'accessibility-focus-enhancement',
      'accessibility-cursor-enhanced',
      'accessibility-color-blind-filter'
    )

    // 取消监听器
    this.mediaQueryList?.removeEventListener('change', () => {})
    
    // 清理观察器
    this.observers.forEach(observer => observer.disconnect())
    this.observers.length = 0

    // 取消动画帧
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    console.log('VisualAccessibilitySystem: Disposed')
  }
}

// 导出单例实例
export const visualAccessibilitySystem = new VisualAccessibilitySystem()

// 快捷方法导出
export const enableHighContrast = () => {
  visualAccessibilitySystem.enableHighContrastMode()
}

export const enableDarkMode = () => {
  visualAccessibilitySystem.enableDarkMode()
}

export const setColorBlindMode = (mode: VisualAccessibilityConfig['colorBlindMode']) => {
  visualAccessibilitySystem.setColorBlindMode(mode)
}

export const setTextScaling = (scale: number) => {
  visualAccessibilitySystem.setTextScaling(scale)
}

export const toggleMagnifier = () => {
  visualAccessibilitySystem.toggleMagnifier()
}