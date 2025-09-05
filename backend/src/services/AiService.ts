import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient, SessionContext, MessageRole, NodeType } from '@prisma/client';
import { ChatRequest, AnalysisRequest, CreateAiSessionInput, ChatResponse, AiInsight, AiRecommendation, AnalysisResponse, SessionContextConfig } from '@/types';
import { ApiError } from '@/utils/ApiError';

export class AiService {
  private prisma: PrismaClient;
  private gemini?: GoogleGenerativeAI;
  private model?: any;

  constructor() {
    this.prisma = new PrismaClient();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not found or not configured. AI features will use fallback responses.');
      return;
    }
    this.gemini = new GoogleGenerativeAI(apiKey);
    this.model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
  }

  async startChatSession(userId: string, data: CreateAiSessionInput): Promise<any> {
    // 如果指定了漏斗，验证所有权
    if (data.funnelId) {
      const funnel = await this.prisma.funnel.findFirst({
        where: { id: data.funnelId, userId }
      });

      if (!funnel) {
        throw new ApiError('漏斗不存在', 404);
      }
    }

    return this.prisma.aiSession.create({
      data: {
        userId,
        funnelId: data.funnelId,
        sessionContext: data.sessionContext || 'general'
      }
    });
  }

  async sendChatMessage(userId: string, request: ChatRequest): Promise<ChatResponse> {
    let sessionId = request.sessionId;

    // 如果没有会话ID，创建新会话
    if (!sessionId) {
      const session = await this.startChatSession(userId, {
        funnelId: request.funnelId,
        sessionContext: request.context
      });
      sessionId = session.id;
    }

    // 验证会话所有权并获取完整信息
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        funnel: {
          include: {
            nodes: {
              include: {
                nodeData: {
                  orderBy: { weekStartDate: 'desc' },
                  take: 4 // 最近4周数据
                }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20 // 最近20条消息用于上下文
        }
      }
    });

    if (!session) {
      throw new ApiError('AI会话不存在', 404);
    }

    // 保存用户消息
    await this.prisma.aiMessage.create({
      data: {
        session: {
          connect: { id: sessionId }
        },
        role: 'user',
        content: request.message
      }
    });

    // 构建对话上下文
    const contextMessages = session.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 添加当前用户消息
    contextMessages.push({
      role: 'user',
      parts: [{ text: request.message }]
    });

    // 生成AI回复
    const aiResponse = await this.generateAiResponse(
      request.message, 
      session.sessionContext, 
      session.funnel,
      contextMessages
    );

    // 保存AI回复
    await this.prisma.aiMessage.create({
      data: {
        session: {
          connect: { id: sessionId }
        },
        role: 'assistant',
        content: aiResponse.message
      }
    });

    return {
      message: aiResponse.message,
      sessionId: sessionId!,
      suggestions: aiResponse.suggestions,
      actions: aiResponse.actions
    };
  }

  async getUserSessions(userId: string, options: any): Promise<any> {
    const { page, limit, funnelId, context } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    
    if (funnelId) {
      where.funnelId = funnelId;
    }
    
    if (context) {
      where.sessionContext = context;
    }

    const [sessions, total] = await Promise.all([
      this.prisma.aiSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { messages: true }
          }
        }
      }),
      this.prisma.aiSession.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      sessions: sessions.map(session => ({
        ...session,
        messageCount: session._count.messages
      })),
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  async getSessionById(sessionId: string, userId: string): Promise<any> {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        funnel: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, username: true }
        }
      }
    });

    if (!session) {
      throw new ApiError('AI会话不存在', 404);
    }

    return session;
  }

  async endSession(sessionId: string, userId: string): Promise<any> {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new ApiError('AI会话不存在', 404);
    }

    return this.prisma.aiSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() }
    });
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new ApiError('AI会话不存在', 404);
    }

    await this.prisma.aiSession.delete({
      where: { id: sessionId }
    });
  }

  async analyzeFunction(userId: string, request: AnalysisRequest): Promise<AnalysisResponse> {
    // 验证漏斗所有权并获取详细数据
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: request.funnelId, userId },
      include: {
        nodes: {
          include: {
            nodeData: {
              where: request.timeRange ? {
                weekStartDate: {
                  gte: request.timeRange.startDate,
                  lte: request.timeRange.endDate
                }
              } : undefined,
              orderBy: { weekStartDate: 'desc' },
              take: 12 // 最多12周数据
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 根据分析类型执行不同的分析
    switch (request.analysisType) {
      case 'performance':
        return this.analyzePerformance(funnel);
      case 'bottlenecks':
        return this.analyzeBottlenecks(funnel);
      case 'recommendations':
        return this.generateRecommendations(funnel);
      case 'trends':
        return this.analyzeTrends(funnel);
      default:
        throw new ApiError('不支持的分析类型', 400);
    }
  }

  private analyzePerformance(funnel: any): AnalysisResponse {
    const insights: AiInsight[] = [];
    const recommendations: AiRecommendation[] = [];
    
    // 计算整体转化率
    let totalEntries = 0;
    let totalConversions = 0;
    let totalRevenue = 0;
    
    funnel.nodes.forEach((node: any) => {
      if (node.nodeData.length > 0) {
        const latestData = node.nodeData[0];
        totalEntries += latestData.entryCount || 0;
        totalConversions += latestData.convertedCount || 0;
        totalRevenue += parseFloat(latestData.revenue?.toString() || '0');
      }
    });
    
    const overallConversionRate = totalEntries > 0 ? (totalConversions / totalEntries) : 0;
    
    insights.push({
      title: '整体性能表现',
      description: `漏斗整体转化率为 ${(overallConversionRate * 100).toFixed(2)}%，总收入为 ${totalRevenue.toFixed(2)} 元`,
      severity: overallConversionRate > 0.1 ? 'low' : overallConversionRate > 0.05 ? 'medium' : 'high',
      category: 'performance',
      metrics: [
        { name: '总进入量', value: totalEntries, unit: '人' },
        { name: '总转化量', value: totalConversions, unit: '人' },
        { name: '转化率', value: overallConversionRate * 100, unit: '%' },
        { name: '总收入', value: totalRevenue, unit: '元' }
      ]
    });
    
    if (overallConversionRate < 0.05) {
      recommendations.push({
        title: '提升整体转化率',
        description: '当前整体转化率较低，建议优化各个节点的转化效果',
        priority: 'high',
        category: 'optimization',
        expectedImpact: '预期可提升转化率 20-40%',
        implementation: {
          difficulty: 'medium',
          estimatedTime: '2-4周',
          steps: ['分析用户行为数据', '优化页面内容和设计', 'A/B测试不同版本', '持续监控和优化']
        }
      });
    }
    
    return {
      analysisType: 'performance',
      summary: `${funnel.name} 整体性能表现分析完成。转化率为 ${(overallConversionRate * 100).toFixed(2)}%，共识别出 ${insights.length} 个关键洞察和 ${recommendations.length} 个优化建议。`,
      insights,
      recommendations
    };
  }
  
  private analyzeBottlenecks(funnel: any): AnalysisResponse {
    const insights: AiInsight[] = [];
    const recommendations: AiRecommendation[] = [];
    const bottleneckNodes: string[] = [];
    
    // 分析各个节点的转化率
    funnel.nodes.forEach((node: any, index: number) => {
      if (node.nodeData.length > 0) {
        const latestData = node.nodeData[0];
        const conversionRate = latestData.conversionRate || 0;
        
        if (conversionRate < 0.3) { // 转化率低于30%认为是瓶颈
          bottleneckNodes.push(node.id);
          
          insights.push({
            title: `${node.label} 节点存在瓶颈`,
            description: `该节点转化率仅为 ${(conversionRate * 100).toFixed(2)}%，明显低于正常水平`,
            severity: conversionRate < 0.1 ? 'high' : 'medium',
            category: 'conversion',
            affectedNodes: [node.id],
            metrics: [
              { name: '转化率', value: conversionRate * 100, unit: '%' },
              { name: '进入量', value: latestData.entryCount || 0, unit: '人' },
              { name: '转化量', value: latestData.convertedCount || 0, unit: '人' }
            ]
          });
          
          recommendations.push({
            title: `优化 ${node.label} 节点`,
            description: '重点优化该瓶颈节点的用户体验和转化效果',
            priority: conversionRate < 0.1 ? 'high' : 'medium',
            category: 'optimization',
            expectedImpact: `预期可提升该节点转化率 30-60%`,
            implementation: {
              difficulty: 'medium',
              estimatedTime: '1-3周',
              steps: ['分析用户在该节点的行为', '检查页面加载速度和可用性', '优化内容和调用行动', '测试优化效果']
            },
            affectedNodes: [node.id]
          });
        }
      }
    });
    
    return {
      analysisType: 'bottlenecks',
      summary: `瓶颈分析完成。发现 ${bottleneckNodes.length} 个瓶颈节点，需要重点关注和优化。`,
      insights,
      recommendations
    };
  }
  
  private generateRecommendations(funnel: any): AnalysisResponse {
    const insights: AiInsight[] = [];
    const recommendations: AiRecommendation[] = [];
    
    // 通用优化建议
    recommendations.push(
      {
        title: '实施 A/B 测试',
        description: '对关键节点进行 A/B 测试，测试不同的文案、设计和转化流程',
        priority: 'high',
        category: 'optimization',
        expectedImpact: '预期可提升整体转化率 15-25%',
        implementation: {
          difficulty: 'easy',
          estimatedTime: '1-2周',
          steps: ['确定测试变量', '创建测试版本', '设置测试指标', '运行测试并分析结果']
        }
      },
      {
        title: '优化移动端体验',
        description: '针对移动设备优化漏斗的响应式设计和加载速度',
        priority: 'medium',
        category: 'design',
        expectedImpact: '预期可提升移动端转化率 20-35%',
        implementation: {
          difficulty: 'medium',
          estimatedTime: '2-3周',
          steps: ['分析移动端用户行为', '优化页面加载速度', '改进触控交互', '测试不同设备兼容性']
        }
      },
      {
        title: '增强社会证明',
        description: '添加用户评价、成功案例和信任标志来增强客户信任',
        priority: 'medium',
        category: 'content',
        expectedImpact: '预期可提升用户信任度和转化率 10-20%',
        implementation: {
          difficulty: 'easy',
          estimatedTime: '1周',
          steps: ['收集客户评价和反馈', '创作成功案例', '设计信任标志', '在适当位置展示']
        }
      }
    );
    
    return {
      analysisType: 'recommendations',
      summary: `基于 ${funnel.name} 的数据分析，生成了 ${recommendations.length} 个优化建议，涵盖了测试优化、用户体验和内容优化等方面。`,
      insights,
      recommendations
    };
  }
  
  private analyzeTrends(funnel: any): AnalysisResponse {
    const insights: AiInsight[] = [];
    const recommendations: AiRecommendation[] = [];
    
    // 分析趋势数据
    funnel.nodes.forEach((node: any) => {
      if (node.nodeData.length > 1) {
        const sortedData = node.nodeData.sort((a: any, b: any) => 
          new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
        );
        
        const firstWeek = sortedData[0];
        const lastWeek = sortedData[sortedData.length - 1];
        
        if (firstWeek && lastWeek) {
          const conversionChange = (lastWeek.conversionRate || 0) - (firstWeek.conversionRate || 0);
          const entryChange = (lastWeek.entryCount || 0) - (firstWeek.entryCount || 0);
          
          let trendType = '稳定';
          let severity: 'high' | 'medium' | 'low' = 'low';
          
          if (Math.abs(conversionChange) > 0.1) {
            trendType = conversionChange > 0 ? '上升' : '下降';
            severity = Math.abs(conversionChange) > 0.2 ? 'high' : 'medium';
          }
          
          insights.push({
            title: `${node.label} 节点趋势分析`,
            description: `该节点转化率呈现${trendType}趋势，变化率为 ${(conversionChange * 100).toFixed(2)}%`,
            severity,
            category: 'performance',
            affectedNodes: [node.id],
            metrics: [
              { name: '转化率变化', value: conversionChange * 100, unit: '%' },
              { name: '进入量变化', value: entryChange, unit: '人', change: entryChange }
            ]
          });
        }
      }
    });
    
    return {
      analysisType: 'trends',
      summary: `趋势分析完成。识别出 ${insights.length} 个趋势指标，帮助了解漏斗的历史表现变化。`,
      insights,
      recommendations
    };
  }

  async getFunnelRecommendations(funnelId: string, userId: string, options: any): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 简化的推荐实现
    return [];
  }

  async generateInvitation(userId: string, options: any): Promise<any> {
    // 验证漏斗所有权并获取数据
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: options.funnelId, userId },
      include: {
        nodes: {
          include: {
            nodeData: {
              orderBy: { weekStartDate: 'desc' },
              take: 4
            }
          }
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    try {
      if (this.model) {
        // 构建邀请文案生成提示词
        const prompt = this.buildInvitationPrompt(funnel, options);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const generatedContent = response.text();

        // 解析生成的内容
        return this.parseInvitationResponse(generatedContent, options);
      } else {
        // 后备方案
        return this.generateFallbackInvitation(funnel, options);
      }
    } catch (error) {
      console.error('生成邀请文案失败:', error);
      return this.generateFallbackInvitation(funnel, options);
    }
  }

  private buildInvitationPrompt(funnel: any, options: any): string {
    let prompt = `作为一个专业的市场营销专家，请为以下漏斗创作一个吸引人的邀请文案：\n\n`;
    
    prompt += `漏斗信息：\n`;
    prompt += `- 名称：${funnel.name}\n`;
    prompt += `- 描述：${funnel.description || '无描述'}\n\n`;
    
    if (funnel.nodes && funnel.nodes.length > 0) {
      prompt += `漏斗数据：\n`;
      funnel.nodes.forEach((node: any) => {
        if (node.nodeData && node.nodeData.length > 0) {
          const data = node.nodeData[0];
          prompt += `- ${this.getNodeTypeLabel(node.nodeType)}: 进入${data.entryCount}，转化${data.convertedCount}\n`;
        }
      });
    }
    
    prompt += `\n要求：\n`;
    prompt += `- 语调：${this.getToneDescription(options.tone)}\n`;
    prompt += `- 长度：${this.getLengthDescription(options.length)}\n`;
    
    if (options.context) {
      prompt += `- 上下文：${options.context}\n`;
    }
    
    prompt += `\n请生成一个包含以下元素的邀请文案：\n`;
    prompt += `1. 吸引人的标题\n`;
    prompt += `2. 主体内容\n`;
    prompt += `3. 明确的行动号召\n\n`;
    prompt += `格式输出为 JSON，包含 title、content和 cta 字段。`;
    
    return prompt;
  }
  
  private getToneDescription(tone: string): string {
    const tones = {
      professional: '专业正式',
      friendly: '亲切友好',
      casual: '轻松随意',
      urgent: '紧迫性强'
    };
    return tones[tone as keyof typeof tones] || '专业正式';
  }
  
  private getLengthDescription(length: string): string {
    const lengths = {
      short: '简洁（50-100字）',
      medium: '中等（100-200字）',
      long: '详细（200-500字）'
    };
    return lengths[length as keyof typeof lengths] || '中等';
  }
  
  private parseInvitationResponse(response: string, options: any): any {
    try {
      // 尝试解析 JSON 响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || '邀请标题',
          content: parsed.content || response,
          cta: parsed.cta || '立即行动',
          tone: options.tone,
          length: options.length
        };
      }
    } catch (error) {
      // JSON 解析失败，返回原始内容
    }
    
    return {
      title: '精心制作的邀请',
      content: response,
      cta: '了解更多',
      tone: options.tone,
      length: options.length
    };
  }
  
  private generateFallbackInvitation(funnel: any, options: any): any {
    const templates = {
      professional: {
        title: `诚邀您了解 ${funnel.name}`,
        content: `我们很高兴地邀请您了解我们的${funnel.name}项目。该项目经过精心设计，旨在为您提供优质的体验和价值。`,
        cta: '立即了解'
      },
      friendly: {
        title: `不要错过 ${funnel.name} 😊`,
        content: `你好！我们想和你分享一个特别的项目 - ${funnel.name}。这可能正是你一直在找的解决方案！`,
        cta: '赶快看看'
      },
      casual: {
        title: `${funnel.name} - 值得一试`,
        content: `嗨，这里有个不错的东西想跟你分享。${funnel.name}可能会让你眼前一亮，不如来看看？`,
        cta: '去看看'
      },
      urgent: {
        title: `限时机会：${funnel.name}`,
        content: `注意！这是一个有限的机会来体验 ${funnel.name}。名额有限，不要错过这个特殊机会。`,
        cta: '马上行动'
      }
    };
    
    const template = templates[options.tone as keyof typeof templates] || templates.professional;
    
    return {
      title: template.title,
      content: template.content,
      cta: template.cta,
      tone: options.tone,
      length: options.length
    };
  }

  async generateObjectionHandling(userId: string, options: any): Promise<any> {
    // 验证漏斗所有权
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: options.funnelId, userId }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    try {
      if (this.model) {
        const prompt = this.buildObjectionPrompt(options, funnel);
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const generatedContent = response.text();
        
        return this.parseObjectionResponse(generatedContent, options);
      } else {
        return this.generateFallbackObjectionHandling(options);
      }
    } catch (error) {
      console.error('生成异议处理失败:', error);
      return this.generateFallbackObjectionHandling(options);
    }
  }
  
  private buildObjectionPrompt(options: any, funnel: any): string {
    let prompt = `作为一个专业的销售培训师，请为以下客户异议提供处理方案：\n\n`;
    
    prompt += `客户异议："${options.objection}"\n\n`;
    
    if (options.customerType) {
      prompt += `客户类型：${options.customerType}\n\n`;
    }
    
    prompt += `背景信息：\n`;
    prompt += `- 产品/服务：${funnel.name}\n`;
    if (funnel.description) {
      prompt += `- 描述：${funnel.description}\n`;
    }
    
    prompt += `\n请提供：\n`;
    prompt += `1. 3-5个有效的回应语术（要兼顾共情和专业性）\n`;
    prompt += `2. 3个实用的处理策略\n`;
    prompt += `3. 预防该异议的建议\n\n`;
    prompt += `请以JSON格式输出，包含responses、strategies和prevention字段。`;
    
    return prompt;
  }
  
  private parseObjectionResponse(response: string, options: any): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          objection: options.objection,
          responses: parsed.responses || [],
          strategies: parsed.strategies || [],
          prevention: parsed.prevention || []
        };
      }
    } catch (error) {
      // JSON 解析失败
    }
    
    // 从文本中提取信息
    return {
      objection: options.objection,
      responses: [response],
      strategies: ['主动倾听客户担忧', '提供具体解决方案', '建立信任关系'],
      prevention: ['提前说明可能的担忧', '提供透明的信息']
    };
  }
  
  private generateFallbackObjectionHandling(options: any): any {
    const objectionType = this.categorizeObjection(options.objection);
    
    const fallbackResponses = {
      price: [
        '我理解价格是重要考量因素。让我们讨论一下您将获得的价值...',
        '与其说这是成本，不如说这是投资。让我给您分析一下投资回报...',
        '我们有不同的付款方式和套餐选择，可以找到适合您预算的方案。'
      ],
      time: [
        '我理解时间对您很宝贵。这正是为什么我们设计了高效的解决方案...',
        '许多成功的客户也有过同样的担心。但他们发现投入的时间很快就有了回报。',
        '我们提供灵活的安排，可以根据您的时间调整进度。'
      ],
      trust: [
        '您的谨慎态度值得赞赏。让我分享一些我们客户的成功案例...',
        '我们提供完善的保障和售后服务，您可以放心。',
        '我们已经帮助了数百个客户取得成功，有详细的案例和证明。'
      ],
      general: [
        '我完全理解您的担心。让我们一起来解决这个问题...',
        '这确实是一个需要考虑的因素。让我提供一些具体的解决方案...',
        '许多客户初期都有类似的情况，但最终都找到了满意的解决方案。'
      ]
    };
    
    const strategies = [
      '采用“感受-理解-发现”公式来处理异议',
      '提供具体的数据和案例来支撑观点',
      '将关注点从问题转移到解决方案上',
      '使用问句来引导客户思考',
      '提供多个选择方案，增加灵活性'
    ];
    
    return {
      objection: options.objection,
      responses: fallbackResponses[objectionType] || fallbackResponses.general,
      strategies: strategies.slice(0, 3)
    };
  }
  
  private categorizeObjection(objection: string): 'price' | 'time' | 'trust' | 'general' {
    const lowerObj = objection.toLowerCase();
    
    if (lowerObj.includes('价格') || lowerObj.includes('贵') || lowerObj.includes('钱') || lowerObj.includes('成本')) {
      return 'price';
    }
    
    if (lowerObj.includes('时间') || lowerObj.includes('忙') || lowerObj.includes('没空')) {
      return 'time';
    }
    
    if (lowerObj.includes('信任') || lowerObj.includes('可靠') || lowerObj.includes('不放心') || lowerObj.includes('保障')) {
      return 'trust';
    }
    
    return 'general';
  }

  async getUserAiStats(userId: string): Promise<any> {
    const [totalSessions, totalMessages] = await Promise.all([
      this.prisma.aiSession.count({ where: { userId } }),
      this.prisma.aiMessage.count({
        where: { session: { userId } }
      })
    ]);

    return {
      totalSessions,
      totalMessages,
      averageMessagesPerSession: totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0
    };
  }

  private async generateAiResponse(
    message: string, 
    context?: SessionContext | null,
    funnel?: any,
    conversationHistory: any[] = []
  ): Promise<{ message: string; suggestions: string[]; actions: any[] }> {
    try {
      // 如果没有Gemini API配置，使用预设回复
      if (!this.model) {
        return this.getFallbackResponse(message, context, funnel);
      }

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(context, funnel);
      
      // 构建对话上下文
      let conversationText = systemPrompt + '\n\n';
      
      // 添加历史对话
      if (conversationHistory.length > 0) {
        conversationText += '对话历史:\n';
        conversationHistory.forEach(msg => {
          const role = msg.role === 'user' ? '用户' : 'AI助手';
          conversationText += `${role}: ${msg.parts[0].text}\n`;
        });
        conversationText += '\n';
      }
      
      conversationText += `当前用户问题: ${message}\n\n`;
      conversationText += '请根据以上信息提供专业的回复。';

      // 调用Gemini API
      const result = await this.model.generateContent(conversationText);
      const response = await result.response;
      const aiMessage = response.text();

      // 生成建议和操作
      const suggestions = this.generateSuggestions(message, context, funnel);
      const actions = this.generateActions(message, context, funnel);

      return {
        message: aiMessage,
        suggestions,
        actions
      };
    } catch (error) {
      console.error('Gemini API 调用失败:', error);
      // API失败时使用后备回复
      return this.getFallbackResponse(message, context, funnel);
    }
  }

  private buildSystemPrompt(context?: SessionContext | null, funnel?: any): string {
    const contextConfig = this.getContextConfig(context);
    
    let prompt = contextConfig.systemPrompt;
    
    // 添加漏斗信息
    if (funnel) {
      prompt += `\n\n当前漏斗信息:\n`;
      prompt += `漏斗名称: ${funnel.name}\n`;
      prompt += `漏斗描述: ${funnel.description || '无描述'}\n`;
      
      if (funnel.nodes && funnel.nodes.length > 0) {
        prompt += `\n漏斗节点和数据:\n`;
        funnel.nodes.forEach((node: any) => {
          prompt += `- ${this.getNodeTypeLabel(node.nodeType)}: ${node.label}\n`;
          
          if (node.nodeData && node.nodeData.length > 0) {
            const latestData = node.nodeData[0];
            prompt += `  最新数据: 进入${latestData.entryCount}，转化${latestData.convertedCount}，转化率${((latestData.conversionRate || 0) * 100).toFixed(2)}%\n`;
          }
        });
      }
    }
    
    return prompt;
  }

  private getContextConfig(context?: SessionContext | null): SessionContextConfig {
    switch (context) {
      case 'invitation':
        return {
          context: 'invitation',
          systemPrompt: '你是一个专业的销售和市场营销专家，擅长创作吸引人的邀请文案和推广内容。你需要帮助用户创作高转化的邀请文案，并根据漏斗数据提供优化建议。',
          maxMessages: 50,
          allowedActions: ['generate_invitation', 'analyze_data', 'optimize_content'],
          requiresFunnel: true
        };
      case 'objection_handling':
        return {
          context: 'objection_handling',
          systemPrompt: '你是一个专业的销售培训师和客户服务专家，擅长处理各种客户异议和拒绝。你需要帮助用户制定有效的异议处理策略，提供实用的回应技巧，并根据漏斗数据分析客户行为。',
          maxMessages: 30,
          allowedActions: ['generate_objection_response', 'analyze_customer_behavior', 'suggest_strategy'],
          requiresFunnel: false
        };
      default:
        return {
          context: 'general',
          systemPrompt: '你是一个专业的数据分析和漏斗优化顾问，擅长帮助用户分析业务数据、优化转化漏斗、提升销售业绩。你可以提供数据分析、漏斗优化建议、市场营销策略和业务增长方案。',
          maxMessages: 100,
          allowedActions: ['analyze_data', 'generate_report', 'create_recommendation', 'optimize_funnel'],
          requiresFunnel: false
        };
    }
  }

  private getNodeTypeLabel(nodeType: NodeType): string {
    const labels = {
      awareness: '认知阶段',
      acquisition: '获取阶段',
      activation: '激活阶段',
      revenue: '收入阶段',
      retention: '留存阶段'
    };
    return labels[nodeType] || nodeType;
  }

  private generateSuggestions(message: string, context?: SessionContext | null, funnel?: any): string[] {
    const suggestions: string[] = [];
    
    if (context === 'invitation') {
      suggestions.push('帮我优化邀请文案的标题');
      suggestions.push('如何提高邀请的点击率');
      suggestions.push('分析目标受众的特征');
    } else if (context === 'objection_handling') {
      suggestions.push('常见异议类型和处理方法');
      suggestions.push('如何提高客户信任度');
      suggestions.push('价格异议的最佳应对策略');
    } else {
      if (funnel) {
        suggestions.push('分析漏斗的瓶颈环节');
        suggestions.push('提供转化率优化建议');
        suggestions.push('预测下周的业绩表现');
      } else {
        suggestions.push('如何创建高效漏斗');
        suggestions.push('数据分析的最佳实践');
        suggestions.push('市场营销策略建议');
      }
    }
    
    return suggestions;
  }

  private generateActions(message: string, context?: SessionContext | null, funnel?: any): any[] {
    const actions: any[] = [];
    
    if (context === 'invitation' && funnel) {
      actions.push({
        type: 'generate_invitation',
        description: '为当前漏斗生成邀请文案',
        payload: { funnelId: funnel.id }
      });
    }
    
    if (funnel) {
      actions.push({
        type: 'analyze_data',
        description: '分析漏斗数据表现',
        payload: { funnelId: funnel.id, analysisType: 'performance' }
      });
    }
    
    return actions;
  }

  private getFallbackResponse(message: string, context?: SessionContext | null, funnel?: any): { message: string; suggestions: string[]; actions: any[] } {
    const fallbackMessages = {
      invitation: [
        '我理解您需要制作吸引人的邀请文案。让我根据您的漏斗数据为您提供一些建议。',
        '针对邀请文案，我建议重点关注标题的吸引力和内容的个性化。',
        '基于您的问题，我可以帮助您优化邀请策略和提高响应率。'
      ],
      objection_handling: [
        '关于异议处理，我建议首先理解客户的真实担忧，然后提供针对性的解决方案。',
        '处理客户异议的关键在于积极倾听和共情理解，让我为您分析具体的应对策略。',
        '针对您提到的情况，我可以帮助您制定有效的异议处理方案。'
      ],
      general: [
        '我理解您的问题。让我基于数据分析为您提供专业建议。',
        '根据您提供的信息，我建议您考虑以下几个方面的优化。',
        '这是一个很好的问题。基于漏斗分析的最佳实践，我来为您解答。'
      ]
    };
    
    const contextMessages = fallbackMessages[context || 'general'];
    const randomMessage = contextMessages[Math.floor(Math.random() * contextMessages.length)];
    
    return {
      message: randomMessage,
      suggestions: this.generateSuggestions(message, context, funnel),
      actions: this.generateActions(message, context, funnel)
    };
  }
}