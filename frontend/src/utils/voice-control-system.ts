/**
 * Agent 7: 无障碍访问支持专家 - 语音控制系统
 * 完整的语音控制和自然语音指令识别系统
 */

export interface VoiceCommand {
  id: string
  patterns: string[]
  description: string
  handler: (context: VoiceCommandContext) => Promise<void> | void
  context?: string
  confidence?: number
  examples: string[]
  parameters?: VoiceParameter[]
  enabled?: boolean
}

export interface VoiceParameter {
  name: string
  type: 'string' | 'number' | 'position' | 'node' | 'color' | 'direction'
  required: boolean
  description: string
  validation?: (value: any) => boolean
}

export interface VoiceCommandContext {
  command: string
  parameters: Record<string, any>
  confidence: number
  timestamp: number
  sourceElement?: HTMLElement
}

export interface VoiceControlConfig {
  enabled: boolean
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  confidenceThreshold: number
  noiseSuppressionLevel: number
  enableFeedback: boolean
  enableConfirmation: boolean
  wakeWord?: string
  hotwordTimeout: number
  commands: VoiceCommand[]
}

export interface SpeechSynthesisConfig {
  enabled: boolean
  language: string
  voice?: string
  rate: number
  pitch: number
  volume: number
}

/**
 * 语音控制系统
 */
export class VoiceControlSystem {
  private config: VoiceControlConfig
  private speechConfig: SpeechSynthesisConfig
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private isListening: boolean = false
  private isProcessing: boolean = false
  private commands: Map<string, VoiceCommand> = new Map()
  private lastCommand: VoiceCommandContext | null = null
  private sessionActive: boolean = false
  private wakeWordDetected: boolean = false
  private confidenceHistory: number[] = []

  constructor(
    voiceConfig: Partial<VoiceControlConfig> = {},
    speechConfig: Partial<SpeechSynthesisConfig> = {}
  ) {
    this.config = {
      enabled: false, // 默认禁用，需要用户明确启用
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      noiseSuppressionLevel: 1,
      enableFeedback: true,
      enableConfirmation: true,
      wakeWord: '小助手',
      hotwordTimeout: 3000,
      commands: [],
      ...voiceConfig
    }

    this.speechConfig = {
      enabled: true,
      language: 'zh-CN',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      ...speechConfig
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    console.log('VoiceControlSystem: Initializing voice control system')

    // 检查浏览器支持
    if (!this.checkBrowserSupport()) {
      console.warn('VoiceControlSystem: Browser does not support speech recognition or synthesis')
      return
    }

    // 初始化语音识别
    await this.setupSpeechRecognition()

    // 初始化语音合成
    this.setupSpeechSynthesis()

    // 注册默认命令
    this.registerDefaultCommands()

    // 注册自定义命令
    this.config.commands.forEach(command => this.registerCommand(command))

    console.log('VoiceControlSystem: Initialization completed')
  }

  private checkBrowserSupport(): boolean {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const hasSynthesis = 'speechSynthesis' in window
    
    return hasRecognition && hasSynthesis
  }

  private async setupSpeechRecognition(): Promise<void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.warn('VoiceControlSystem: Speech recognition not supported')
      return
    }

    this.recognition = new SpeechRecognition()
    
    // 配置识别器
    this.recognition.lang = this.config.language
    this.recognition.continuous = this.config.continuous
    this.recognition.interimResults = this.config.interimResults
    this.recognition.maxAlternatives = this.config.maxAlternatives

    // 事件处理
    this.recognition.onstart = () => {
      this.isListening = true
      console.log('VoiceControlSystem: Speech recognition started')
      this.speak('语音识别已启动，请说话')
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('VoiceControlSystem: Speech recognition ended')
      
      // 如果会话仍然活跃且启用了连续识别，重新启动
      if (this.sessionActive && this.config.continuous && this.config.enabled) {
        setTimeout(() => {
          this.startListening()
        }, 1000)
      }
    }

    this.recognition.onerror = (event) => {
      console.error('VoiceControlSystem: Speech recognition error:', event.error)
      this.handleRecognitionError(event.error)
    }

    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event)
    }
  }

  private setupSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      
      // 等待语音列表加载
      if (this.synthesis.getVoices().length === 0) {
        this.synthesis.onvoiceschanged = () => {
          this.selectOptimalVoice()
        }
      } else {
        this.selectOptimalVoice()
      }
    }
  }

  private selectOptimalVoice(): void {
    if (!this.synthesis) return

    const voices = this.synthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(this.config.language) && voice.localService
    ) || voices.find(voice => 
      voice.lang.startsWith(this.config.language)
    ) || voices[0]

    if (preferredVoice) {
      this.speechConfig.voice = preferredVoice.name
      console.log('VoiceControlSystem: Selected voice:', preferredVoice.name)
    }
  }

  /**
   * 注册默认语音命令
   */
  private registerDefaultCommands(): void {
    const defaultCommands: VoiceCommand[] = [
      // 基础导航命令
      {
        id: 'navigate-to-main',
        patterns: ['跳转到主内容', '打开主内容', '主要内容'],
        description: '跳转到主要内容区域',
        handler: () => this.navigateToElement('main, [role="main"]'),
        examples: ['跳转到主内容']
      },
      {
        id: 'navigate-to-navigation',
        patterns: ['打开导航', '跳转到导航', '导航菜单'],
        description: '打开导航菜单',
        handler: () => this.navigateToElement('nav, [role="navigation"]'),
        examples: ['打开导航']
      },

      // 节点创建命令
      {
        id: 'create-node',
        patterns: [
          '创建{nodeType}节点', 
          '添加{nodeType}节点', 
          '新建{nodeType}节点',
          '在{position}创建{nodeType}节点'
        ],
        description: '创建指定类型的节点',
        parameters: [
          {
            name: 'nodeType',
            type: 'string',
            required: true,
            description: '节点类型（开始、结束、行动、判断、转化）'
          },
          {
            name: 'position',
            type: 'position',
            required: false,
            description: '节点位置（左上、右上、左下、右下、中间）'
          }
        ],
        handler: (context) => this.createNodeByVoice(context),
        examples: ['创建开始节点', '在中间添加行动节点', '新建判断节点']
      },

      // 节点操作命令
      {
        id: 'select-node',
        patterns: ['选择{nodeName}', '选中{nodeName}节点', '点击{nodeName}'],
        description: '选择指定的节点',
        parameters: [
          {
            name: 'nodeName',
            type: 'node',
            required: true,
            description: '节点名称'
          }
        ],
        handler: (context) => this.selectNodeByVoice(context),
        examples: ['选择开始节点', '选中登录页面', '点击购物车']
      },

      {
        id: 'delete-node',
        patterns: ['删除{nodeName}', '移除{nodeName}节点', '删除选中的节点'],
        description: '删除指定或选中的节点',
        parameters: [
          {
            name: 'nodeName',
            type: 'node',
            required: false,
            description: '要删除的节点名称'
          }
        ],
        handler: (context) => this.deleteNodeByVoice(context),
        examples: ['删除登录页面', '删除选中的节点', '移除购物车节点']
      },

      // 连接操作命令
      {
        id: 'connect-nodes',
        patterns: [
          '连接{sourceNode}到{targetNode}',
          '从{sourceNode}连接到{targetNode}',
          '{sourceNode}连接{targetNode}'
        ],
        description: '在两个节点之间创建连接',
        parameters: [
          {
            name: 'sourceNode',
            type: 'node',
            required: true,
            description: '源节点名称'
          },
          {
            name: 'targetNode',
            type: 'node',
            required: true,
            description: '目标节点名称'
          }
        ],
        handler: (context) => this.connectNodesByVoice(context),
        examples: ['连接开始节点到登录页面', '从登录页面连接到首页']
      },

      // 移动命令
      {
        id: 'move-node',
        patterns: [
          '移动{nodeName}到{position}',
          '把{nodeName}移动到{position}',
          '将选中的节点移动到{position}'
        ],
        description: '移动节点到指定位置',
        parameters: [
          {
            name: 'nodeName',
            type: 'node',
            required: false,
            description: '要移动的节点名称'
          },
          {
            name: 'position',
            type: 'position',
            required: true,
            description: '目标位置'
          }
        ],
        handler: (context) => this.moveNodeByVoice(context),
        examples: ['移动登录页面到左上', '把选中的节点移动到中间']
      },

      // 视图操作命令
      {
        id: 'zoom-in',
        patterns: ['放大', '放大视图', '缩放放大'],
        description: '放大画布视图',
        handler: () => this.executeViewAction('zoomIn'),
        examples: ['放大', '放大视图']
      },

      {
        id: 'zoom-out',
        patterns: ['缩小', '缩小视图', '缩放缩小'],
        description: '缩小画布视图',
        handler: () => this.executeViewAction('zoomOut'),
        examples: ['缩小', '缩小视图']
      },

      {
        id: 'reset-view',
        patterns: ['重置视图', '恢复视图', '重置缩放'],
        description: '重置画布视图',
        handler: () => this.executeViewAction('resetView'),
        examples: ['重置视图', '恢复视图']
      },

      {
        id: 'fit-to-view',
        patterns: ['适应画布', '适应视图', '显示全部'],
        description: '调整视图以显示所有节点',
        handler: () => this.executeViewAction('fitToView'),
        examples: ['适应画布', '显示全部']
      },

      // 系统控制命令
      {
        id: 'help',
        patterns: ['帮助', '显示帮助', '可以说什么', '语音命令'],
        description: '显示语音命令帮助',
        handler: () => this.showVoiceHelp(),
        examples: ['帮助', '可以说什么']
      },

      {
        id: 'stop-listening',
        patterns: ['停止听取', '关闭语音', '停止识别'],
        description: '停止语音识别',
        handler: () => this.stopListening(),
        examples: ['停止听取', '关闭语音']
      }
    ]

    defaultCommands.forEach(command => this.registerCommand(command))
  }

  /**
   * 注册语音命令
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, {
      ...command,
      enabled: command.enabled !== false
    })
    
    console.log('VoiceControlSystem: Registered command:', command.id)
  }

  /**
   * 启动语音识别
   */
  async startListening(): Promise<void> {
    if (!this.config.enabled || !this.recognition) {
      throw new Error('Voice control is not enabled or not supported')
    }

    if (this.isListening) {
      console.log('VoiceControlSystem: Already listening')
      return
    }

    try {
      this.sessionActive = true
      this.recognition.start()
      console.log('VoiceControlSystem: Started listening')
    } catch (error) {
      console.error('VoiceControlSystem: Failed to start listening:', error)
      throw error
    }
  }

  /**
   * 停止语音识别
   */
  stopListening(): void {
    if (!this.isListening || !this.recognition) return

    this.sessionActive = false
    this.recognition.stop()
    this.speak('语音识别已停止')
    console.log('VoiceControlSystem: Stopped listening')
  }

  /**
   * 处理语音识别结果
   */
  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const results = Array.from(event.results)
    const lastResult = results[results.length - 1]
    
    if (!lastResult.isFinal && !this.config.interimResults) {
      return
    }

    const alternatives = Array.from(lastResult)
    const bestResult = alternatives[0]
    
    const transcript = bestResult.transcript.trim()
    const confidence = bestResult.confidence

    console.log('VoiceControlSystem: Recognized speech:', transcript, 'Confidence:', confidence)

    // 检查唤醒词
    if (this.config.wakeWord && !this.wakeWordDetected) {
      if (transcript.includes(this.config.wakeWord)) {
        this.wakeWordDetected = true
        this.speak('我在听，请说命令')
        
        setTimeout(() => {
          this.wakeWordDetected = false
        }, this.config.hotwordTimeout)
        
        return
      }
      return // 没有检测到唤醒词，忽略命令
    }

    // 置信度检查
    if (confidence < this.config.confidenceThreshold) {
      this.handleLowConfidence(transcript, confidence)
      return
    }

    // 处理命令
    this.processVoiceCommand(transcript, confidence)
  }

  private async processVoiceCommand(transcript: string, confidence: number): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      const matchedCommand = this.findMatchingCommand(transcript)
      
      if (!matchedCommand) {
        this.handleUnknownCommand(transcript)
        return
      }

      const context: VoiceCommandContext = {
        command: transcript,
        parameters: matchedCommand.parameters,
        confidence,
        timestamp: Date.now()
      }

      // 执行确认（如果启用）
      if (this.config.enableConfirmation && confidence < 0.9) {
        const confirmed = await this.confirmCommand(matchedCommand.command, context)
        if (!confirmed) return
      }

      // 执行命令
      await matchedCommand.command.handler(context)
      
      // 反馈
      if (this.config.enableFeedback) {
        this.speak(`已执行：${matchedCommand.command.description}`)
      }

      this.lastCommand = context

    } catch (error) {
      console.error('VoiceControlSystem: Error processing command:', error)
      this.speak('抱歉，执行命令时出现错误')
    } finally {
      this.isProcessing = false
    }
  }

  private findMatchingCommand(transcript: string): { command: VoiceCommand, parameters: Record<string, any> } | null {
    const normalizedTranscript = transcript.toLowerCase().trim()

    for (const command of this.commands.values()) {
      if (!command.enabled) continue

      for (const pattern of command.patterns) {
        const match = this.matchPattern(normalizedTranscript, pattern)
        if (match) {
          return {
            command,
            parameters: match.parameters
          }
        }
      }
    }

    return null
  }

  private matchPattern(transcript: string, pattern: string): { parameters: Record<string, any> } | null {
    // 将模式转换为正则表达式
    let regexPattern = pattern
      .replace(/\{(\w+)\}/g, '([^，。！？\\s]+)')
      .replace(/\s+/g, '\\s*')

    const regex = new RegExp(`^${regexPattern}$`, 'i')
    const match = transcript.match(regex)

    if (!match) return null

    // 提取参数
    const parameters: Record<string, any> = {}
    const paramNames = [...pattern.matchAll(/\{(\w+)\}/g)].map(m => m[1])

    for (let i = 0; i < paramNames.length && i + 1 < match.length; i++) {
      const paramName = paramNames[i]
      const paramValue = match[i + 1]
      parameters[paramName] = this.parseParameter(paramValue, paramName)
    }

    return { parameters }
  }

  private parseParameter(value: string, paramName: string): any {
    // 节点类型映射
    const nodeTypeMap: Record<string, string> = {
      '开始': 'start',
      '结束': 'end',
      '行动': 'action',
      '判断': 'decision',
      '转化': 'conversion',
      '条件': 'condition',
      '延迟': 'delay'
    }

    // 位置映射
    const positionMap: Record<string, { x: number, y: number }> = {
      '左上': { x: 100, y: 100 },
      '右上': { x: 500, y: 100 },
      '左下': { x: 100, y: 400 },
      '右下': { x: 500, y: 400 },
      '中间': { x: 300, y: 250 },
      '中央': { x: 300, y: 250 },
      '上方': { x: 300, y: 100 },
      '下方': { x: 300, y: 400 },
      '左侧': { x: 100, y: 250 },
      '右侧': { x: 500, y: 250 }
    }

    // 根据参数名称进行不同的解析
    switch (paramName) {
      case 'nodeType':
        return nodeTypeMap[value] || value
      case 'position':
        return positionMap[value] || value
      case 'nodeName':
      case 'sourceNode':
      case 'targetNode':
        return this.findNodeByName(value)
      default:
        return value
    }
  }

  private findNodeByName(name: string): string | null {
    // 在实际应用中，这里应该从画布中查找节点
    // 现在返回模拟的节点ID
    const canvas = document.querySelector('.funnel-canvas')
    if (!canvas) return null

    const nodes = canvas.querySelectorAll('[data-node-id]')
    for (const node of nodes) {
      const nodeElement = node as HTMLElement
      const nodeLabel = nodeElement.getAttribute('aria-label') || 
                       nodeElement.textContent?.trim() || ''
      
      if (nodeLabel.toLowerCase().includes(name.toLowerCase())) {
        return nodeElement.getAttribute('data-node-id')
      }
    }

    return null
  }

  /**
   * 命令处理方法
   */
  private async navigateToElement(selector: string): Promise<void> {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      this.speak(`已跳转到${element.getAttribute('aria-label') || '目标元素'}`)
    } else {
      this.speak('未找到目标元素')
    }
  }

  private async createNodeByVoice(context: VoiceCommandContext): Promise<void> {
    const { nodeType, position } = context.parameters
    
    if (!nodeType) {
      this.speak('请指定要创建的节点类型')
      return
    }

    // 触发节点创建事件
    const event = new CustomEvent('voice-create-node', {
      detail: { nodeType, position }
    })
    document.dispatchEvent(event)

    this.speak(`已创建${nodeType}节点`)
  }

  private async selectNodeByVoice(context: VoiceCommandContext): Promise<void> {
    const { nodeName } = context.parameters
    
    if (!nodeName) {
      this.speak('未找到指定的节点')
      return
    }

    const event = new CustomEvent('voice-select-node', {
      detail: { nodeId: nodeName }
    })
    document.dispatchEvent(event)

    this.speak(`已选择节点`)
  }

  private async deleteNodeByVoice(context: VoiceCommandContext): Promise<void> {
    const { nodeName } = context.parameters

    const event = new CustomEvent('voice-delete-node', {
      detail: { nodeId: nodeName }
    })
    document.dispatchEvent(event)

    this.speak(`已删除节点`)
  }

  private async connectNodesByVoice(context: VoiceCommandContext): Promise<void> {
    const { sourceNode, targetNode } = context.parameters

    if (!sourceNode || !targetNode) {
      this.speak('请指定源节点和目标节点')
      return
    }

    const event = new CustomEvent('voice-connect-nodes', {
      detail: { sourceNodeId: sourceNode, targetNodeId: targetNode }
    })
    document.dispatchEvent(event)

    this.speak('已创建节点连接')
  }

  private async moveNodeByVoice(context: VoiceCommandContext): Promise<void> {
    const { nodeName, position } = context.parameters

    if (!position) {
      this.speak('请指定移动位置')
      return
    }

    const event = new CustomEvent('voice-move-node', {
      detail: { nodeId: nodeName, position }
    })
    document.dispatchEvent(event)

    this.speak(`已移动节点到${typeof position === 'object' ? '指定位置' : position}`)
  }

  private async executeViewAction(action: string): Promise<void> {
    const event = new CustomEvent('voice-view-action', {
      detail: { action }
    })
    document.dispatchEvent(event)

    const actionMap: Record<string, string> = {
      zoomIn: '放大',
      zoomOut: '缩小',
      resetView: '重置视图',
      fitToView: '适应画布'
    }

    this.speak(`已${actionMap[action] || action}`)
  }

  private async showVoiceHelp(): Promise<void> {
    const enabledCommands = Array.from(this.commands.values())
      .filter(cmd => cmd.enabled)
      .slice(0, 5) // 只显示前5个命令

    let helpMessage = '您可以说：'
    enabledCommands.forEach(cmd => {
      if (cmd.examples && cmd.examples.length > 0) {
        helpMessage += `${cmd.examples[0]}；`
      }
    })

    this.speak(helpMessage)
  }

  /**
   * 错误处理
   */
  private handleRecognitionError(error: string): void {
    const errorMessages: Record<string, string> = {
      'no-speech': '未检测到语音，请重新说话',
      'audio-capture': '无法访问麦克风，请检查权限设置',
      'not-allowed': '语音识别权限被拒绝',
      'network': '网络连接错误',
      'aborted': '语音识别被中断'
    }

    const message = errorMessages[error] || '语音识别出现错误'
    this.speak(message)
  }

  private handleLowConfidence(transcript: string, confidence: number): void {
    this.speak(`我听到了"${transcript}"，但不太确定，置信度为${Math.round(confidence * 100)}%。请重新说话。`)
  }

  private handleUnknownCommand(transcript: string): void {
    this.speak(`抱歉，我不理解"${transcript}"。请说"帮助"查看可用命令。`)
  }

  private async confirmCommand(command: VoiceCommand, context: VoiceCommandContext): Promise<boolean> {
    return new Promise((resolve) => {
      this.speak(`您是要${command.description}吗？请说"是"或"否"`)

      const confirmationHandler = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        if (!result.isFinal) return

        const transcript = result[0].transcript.toLowerCase().trim()
        
        if (transcript.includes('是') || transcript.includes('确定') || transcript.includes('对')) {
          resolve(true)
        } else {
          resolve(false)
          this.speak('已取消命令')
        }

        this.recognition!.removeEventListener('result', confirmationHandler)
      }

      this.recognition!.addEventListener('result', confirmationHandler)

      // 超时处理
      setTimeout(() => {
        this.recognition!.removeEventListener('result', confirmationHandler)
        resolve(false)
        this.speak('确认超时，已取消命令')
      }, 5000)
    })
  }

  /**
   * 语音合成
   */
  speak(text: string, options: Partial<SpeechSynthesisConfig> = {}): void {
    if (!this.speechConfig.enabled || !this.synthesis) return

    // 停止当前播放
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.language || this.speechConfig.language
    utterance.rate = options.rate || this.speechConfig.rate
    utterance.pitch = options.pitch || this.speechConfig.pitch
    utterance.volume = options.volume || this.speechConfig.volume

    // 设置语音
    if (this.speechConfig.voice) {
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find(voice => voice.name === this.speechConfig.voice)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    utterance.onend = () => {
      console.log('VoiceControlSystem: Speech synthesis completed')
    }

    utterance.onerror = (event) => {
      console.error('VoiceControlSystem: Speech synthesis error:', event.error)
    }

    this.synthesis.speak(utterance)
    console.log('VoiceControlSystem: Speaking:', text)
  }

  /**
   * 配置管理
   */
  updateConfig(newConfig: Partial<VoiceControlConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('VoiceControlSystem: Configuration updated')
  }

  updateSpeechConfig(newConfig: Partial<SpeechSynthesisConfig>): void {
    this.speechConfig = { ...this.speechConfig, ...newConfig }
    console.log('VoiceControlSystem: Speech configuration updated')
  }

  /**
   * 系统状态
   */
  getStatus(): {
    enabled: boolean
    listening: boolean
    processing: boolean
    sessionActive: boolean
    wakeWordDetected: boolean
    registeredCommands: number
    averageConfidence: number
  } {
    const avgConfidence = this.confidenceHistory.length > 0
      ? this.confidenceHistory.reduce((sum, conf) => sum + conf, 0) / this.confidenceHistory.length
      : 0

    return {
      enabled: this.config.enabled,
      listening: this.isListening,
      processing: this.isProcessing,
      sessionActive: this.sessionActive,
      wakeWordDetected: this.wakeWordDetected,
      registeredCommands: this.commands.size,
      averageConfidence: Math.round(avgConfidence * 100) / 100
    }
  }

  /**
   * 权限请求
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // 立即停止流
      return true
    } catch (error) {
      console.error('VoiceControlSystem: Microphone permission denied:', error)
      return false
    }
  }

  /**
   * 启用/禁用系统
   */
  async enable(): Promise<void> {
    const hasPermission = await this.requestPermissions()
    if (!hasPermission) {
      throw new Error('Microphone permission required')
    }

    this.config.enabled = true
    this.speak('语音控制已启用')
    console.log('VoiceControlSystem: Enabled')
  }

  disable(): void {
    this.config.enabled = false
    this.stopListening()
    this.speak('语音控制已禁用')
    console.log('VoiceControlSystem: Disabled')
  }

  /**
   * 销毁系统
   */
  dispose(): void {
    this.stopListening()
    this.synthesis?.cancel()
    this.commands.clear()
    this.confidenceHistory.length = 0
    console.log('VoiceControlSystem: Disposed')
  }
}

// 导出单例实例
export const voiceControlSystem = new VoiceControlSystem()

// 快捷方法导出
export const enableVoiceControl = async () => {
  await voiceControlSystem.enable()
}

export const startVoiceListening = async () => {
  await voiceControlSystem.startListening()
}

export const speak = (text: string, options?: Partial<SpeechSynthesisConfig>) => {
  voiceControlSystem.speak(text, options)
}

export const registerVoiceCommand = (command: VoiceCommand) => {
  voiceControlSystem.registerCommand(command)
}