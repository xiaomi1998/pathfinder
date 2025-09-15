import { PrismaClient, SessionContext, MessageRole } from '@prisma/client';
import { ChatRequest, AiAnalysisRequest, CreateAiSessionInput, ChatResponse, AiInsight, AiRecommendation, AiAnalysisResponse } from '@/types';
import { ApiError } from '@/utils/ApiError';
import axios from 'axios';
import { logger } from '@/utils/logger';

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class KimiAiService {
  private prisma: PrismaClient;
  private apiKey: string;
  private apiEndpoint: string;
  private modelName: string;
  private isConfigured: boolean;

  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.KIMI_API_KEY || 'fee42a7d-13d8-4d3e-98c5-81a56a2ac1df';
    this.apiEndpoint = process.env.KIMI_API_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    this.modelName = process.env.KIMI_MODEL_NAME || 'kimi-k2-250905'; // 使用火山引擎Kimi-K2模型
    
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      logger.warn('KIMI_API_KEY not configured. AI features will use fallback responses.');
    } else {
      logger.info('Kimi AI Service initialized with model:', this.modelName);
    }
  }

  /**
   * 发送请求到Kimi API
   */
  async callKimiAPI(messages: KimiMessage[], temperature: number = 0.7): Promise<string> {
    if (!this.isConfigured) {
      return this.getFallbackResponse(messages[messages.length - 1].content);
    }

    try {
      const response = await axios.post<KimiResponse>(
        this.apiEndpoint,
        {
          model: this.modelName,
          messages: messages,
          temperature: temperature,
          max_tokens: 2000,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
          n: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        
        // 记录token使用情况
        if (response.data.usage) {
          logger.info('Kimi API usage:', {
            prompt_tokens: response.data.usage.prompt_tokens,
            completion_tokens: response.data.usage.completion_tokens,
            total_tokens: response.data.usage.total_tokens
          });
        }
        
        return content;
      } else {
        throw new Error('No response from Kimi API');
      }
    } catch (error: any) {
      logger.error('Kimi API call failed:', error.response?.data || error.message);
      
      // 如果是认证错误，返回更具体的错误信息
      if (error.response?.status === 401) {
        throw new ApiError('Kimi API认证失败，请检查API Key', 401);
      }
      
      // 其他错误返回降级响应
      return this.getFallbackResponse(messages[messages.length - 1].content);
    }
  }

  /**
   * 获取降级响应
   */
  private getFallbackResponse(message: string): string {
    const responses = [
      '根据数据分析，建议您关注转化率较低的环节，优化用户体验。',
      '从漏斗数据来看，您可以考虑增加引导步骤，提升用户转化。',
      '建议您定期监控关键指标变化，及时调整运营策略。',
      '数据显示有优化空间，可以尝试A/B测试不同的方案。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * 开始新的AI会话
   */
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

  /**
   * 发送聊天消息
   */
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
            funnelMetrics: {
              orderBy: { createdAt: 'desc' },
              take: 10
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

    // 构建Kimi API消息格式
    const messages: KimiMessage[] = [];

    // 添加系统提示
    messages.push({
      role: 'system',
      content: this.getSystemPrompt(session.sessionContext || 'general', session.funnel)
    });

    // 添加历史消息
    session.messages.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // 添加当前消息
    messages.push({
      role: 'user',
      content: request.message
    });

    // 调用Kimi API
    const aiResponse = await this.callKimiAPI(messages);

    // 保存AI响应
    await this.prisma.aiMessage.create({
      data: {
        session: {
          connect: { id: sessionId }
        },
        role: 'assistant',
        content: aiResponse
      }
    });

    return {
      message: aiResponse,
      sessionId: sessionId!,
      suggestions: this.extractSuggestions(aiResponse)
    };
  }

  /**
   * 获取系统提示词
   */
  private getSystemPrompt(context: SessionContext, funnel?: any): string {
    let basePrompt = `你是一个专业的数据分析助手，专注于帮助用户优化转化漏斗和提升业务指标。
请基于数据提供具体、可操作的建议。回答要简洁明了，重点突出。`;

    if (funnel) {
      basePrompt += `\n\n当前分析的漏斗信息：
- 名称：${funnel.name}
- 描述：${funnel.description || '无'}
- 数据更新周期：${funnel.dataPeriod}`;

      if (funnel.funnelMetrics && funnel.funnelMetrics.length > 0) {
        const latestMetrics = funnel.funnelMetrics[0];
        basePrompt += `\n- 最新转化率：${(latestMetrics.overallConversionRate * 100).toFixed(2)}%
- 总流入：${latestMetrics.totalEntries}
- 总转化：${latestMetrics.totalConversions}`;
      }
    }

    switch (context) {
      case 'invitation':
        basePrompt += '\n\n请重点关注邀请和引流环节的优化。';
        break;
      case 'objection_handling':
        basePrompt += '\n\n请重点分析异议处理和说服技巧。';
        break;
      case 'general':
        basePrompt += '\n\n请提供全面的分析和建议。';
        break;
    }

    return basePrompt;
  }

  /**
   * 从AI响应中提取建议
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // 简单的建议提取逻辑
    const lines = response.split('\n');
    lines.forEach(line => {
      if (line.includes('建议') || line.includes('可以') || line.includes('应该')) {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          suggestions.push(cleaned);
        }
      }
    });

    return suggestions.slice(0, 3); // 最多返回3个建议
  }

  /**
   * 分析漏斗数据
   */
  async analyzeFunnelData(userId: string, request: AiAnalysisRequest): Promise<AiAnalysisResponse> {
    // 获取漏斗数据
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: request.funnelId, userId },
      include: {
        funnelMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 30
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    // 构建分析请求
    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的数据分析师，请分析以下漏斗数据并提供优化建议。'
      },
      {
        role: 'user',
        content: this.buildAnalysisPrompt(funnel, request)
      }
    ];

    // 调用Kimi API
    const aiResponse = await this.callKimiAPI(messages, 0.5); // 使用较低的temperature以获得更稳定的分析

    // 解析AI响应
    const insights = this.parseInsights(aiResponse);
    const recommendations = this.parseRecommendations(aiResponse);

    return {
      analysisType: request.analysisType || 'comprehensive',
      insights,
      recommendations,
      summary: aiResponse.substring(0, 200) + '...'
    };
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(funnel: any, request: AiAnalysisRequest): string {
    let prompt = `请分析以下漏斗数据：\n\n`;
    prompt += `漏斗名称：${funnel.name}\n`;
    prompt += `分析类型：${request.analysisType || 'comprehensive'}\n`;
    prompt += `时间范围：${request.timeRange || '最近30天'}\n\n`;

    if (funnel.funnelMetrics && funnel.funnelMetrics.length > 0) {
      prompt += '历史数据：\n';
      funnel.funnelMetrics.slice(0, 10).forEach((metric: any) => {
        prompt += `- ${metric.periodStartDate}: 转化率 ${(metric.overallConversionRate * 100).toFixed(2)}%, 流入 ${metric.totalEntries}, 转化 ${metric.totalConversions}\n`;
      });
    }

    prompt += '\n请提供：\n1. 关键洞察（3-5个）\n2. 优化建议（3-5个）\n3. 风险提示';
    
    return prompt;
  }

  /**
   * 解析洞察
   */
  private parseInsights(response: string): AiInsight[] {
    const insights: AiInsight[] = [];
    
    // 简单的解析逻辑，实际使用时可能需要更复杂的NLP处理
    const sections = response.split(/\n\n/);
    sections.forEach(section => {
      if (section.includes('洞察') || section.includes('发现')) {
        insights.push({
          title: '数据洞察',
          description: section.substring(0, 100),
          severity: 'medium',
          category: 'performance',
          metrics: []
        });
      }
    });

    return insights;
  }

  /**
   * 解析建议
   */
  private parseRecommendations(response: string): AiRecommendation[] {
    const recommendations: AiRecommendation[] = [];
    
    const lines = response.split('\n');
    lines.forEach(line => {
      if (line.includes('建议') || line.includes('优化')) {
        recommendations.push({
          title: '优化建议',
          description: line,
          priority: 'medium',
          category: 'optimization',
          expectedImpact: '10-20%',
          implementation: {
            difficulty: 'medium',
            estimatedTime: '1-2 weeks',
            steps: []
          }
        });
      }
    });

    return recommendations.slice(0, 5);
  }

  /**
   * 生成报告
   */
  async generateReport(userId: string, funnelId: string, reportType: string): Promise<string> {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
        funnelMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 30
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的商业分析师，请生成详细的分析报告。'
      },
      {
        role: 'user',
        content: `请为"${funnel.name}"生成一份${reportType}报告，包含数据分析、趋势判断和改进建议。`
      }
    ];

    const report = await this.callKimiAPI(messages, 0.3); // 使用更低的temperature以获得更结构化的报告
    
    return report;
  }

  /**
   * 获取用户的AI会话列表
   */
  async getUserSessions(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.aiSession.findMany({
        where: { userId },
        include: {
          funnel: {
            select: { name: true }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.aiSession.count({ where: { userId } })
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 获取会话详情
   */
  async getSessionById(sessionId: string, userId: string) {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        funnel: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!session) {
      throw new ApiError('会话不存在', 404);
    }

    return session;
  }

  /**
   * 结束会话
   */
  async endSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new ApiError('会话不存在', 404);
    }

    return this.prisma.aiSession.update({
      where: { id: sessionId },
      data: { 
        endedAt: new Date()
      }
    });
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string, userId: string) {
    const session = await this.prisma.aiSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new ApiError('会话不存在', 404);
    }

    // 先删除消息，再删除会话
    await this.prisma.aiMessage.deleteMany({
      where: { sessionId }
    });

    await this.prisma.aiSession.delete({
      where: { id: sessionId }
    });
  }

  /**
   * 分析函数（用于特定功能分析）
   */
  async analyzeFunction(userId: string, request: any) {
    const { funnelId, functionType, parameters } = request;

    // 根据不同的功能类型调用不同的分析
    switch (functionType) {
      case 'conversion_optimization':
        return this.analyzeFunnelData(userId, { 
          funnelId, 
          analysisType: 'conversion',
          ...parameters 
        });
      
      case 'trend_analysis':
        return this.analyzeFunnelData(userId, { 
          funnelId, 
          analysisType: 'trend',
          ...parameters 
        });
      
      default:
        return this.analyzeFunnelData(userId, request);
    }
  }

  /**
   * 获取漏斗推荐
   */
  async getFunnelRecommendations(funnelId: string, userId: string, options?: any) {
    const funnel = await this.prisma.funnel.findFirst({
      where: { id: funnelId, userId },
      include: {
        funnelMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!funnel) {
      throw new ApiError('漏斗不存在', 404);
    }

    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: '你是一个转化率优化专家，请基于数据提供具体的优化建议。'
      },
      {
        role: 'user',
        content: `请为漏斗"${funnel.name}"提供5个具体的优化建议，包括实施步骤和预期效果。`
      }
    ];

    const response = await this.callKimiAPI(messages);
    
    // 解析响应为结构化的推荐列表
    return {
      recommendations: this.parseRecommendations(response)
    };
  }

  /**
   * 生成邀请文案
   */
  async generateInvitation(userId: string, params: any) {
    const { funnelId, nodeId, context, tone, length } = params;

    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的文案撰写专家，擅长创作吸引人的营销文案。'
      },
      {
        role: 'user',
        content: `请生成一段${tone || '专业'}风格的邀请文案，
        场景：${context || '产品推广'}
        长度：${length || '中等'}
        要求：吸引人、有说服力、包含行动号召`
      }
    ];

    const invitation = await this.callKimiAPI(messages, 0.8);
    
    return {
      content: invitation,
      tone,
      context
    };
  }

  /**
   * 生成异议处理话术
   */
  async generateObjectionHandling(userId: string, params: any) {
    const { funnelId, objection, customerType } = params;

    const messages: KimiMessage[] = [
      {
        role: 'system',
        content: '你是一个销售专家，擅长处理客户异议和疑虑。'
      },
      {
        role: 'user',
        content: `客户类型：${customerType || '普通客户'}
        异议内容：${objection}
        请提供3-5个专业的异议处理话术，包含共情、解释和引导。`
      }
    ];

    const response = await this.callKimiAPI(messages, 0.6);
    
    return {
      objection,
      handlingStrategies: response.split('\n').filter(line => line.trim()),
      customerType
    };
  }

  /**
   * 获取用户AI使用统计
   */
  async getUserAiStats(userId: string) {
    const [sessionCount, messageCount, recentSessions] = await Promise.all([
      this.prisma.aiSession.count({ where: { userId } }),
      this.prisma.aiMessage.count({ 
        where: { 
          session: { userId } 
        } 
      }),
      this.prisma.aiSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          funnel: {
            select: { name: true }
          }
        }
      })
    ]);

    return {
      totalSessions: sessionCount,
      totalMessages: messageCount,
      averageMessagesPerSession: sessionCount > 0 ? Math.round(messageCount / sessionCount) : 0,
      recentSessions: recentSessions.map(s => ({
        id: s.id,
        funnelName: s.funnel?.name,
        createdAt: s.createdAt,
        context: s.sessionContext
      }))
    };
  }
}

// 导出单例
export default new KimiAiService();