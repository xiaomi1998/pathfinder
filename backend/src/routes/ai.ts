import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { AiService } from '@/services/AiService';
import { validateRequest } from '@/middleware/validateRequest';
import { ChatRequest, AnalysisRequest } from '@/types/ai';

const router = Router();
const aiService = new AiService();

// 创建AI会话 - 新的标准端点
router.post(
  '/sessions',
  [
    body('funnelId')
      .optional()
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('sessionContext')
      .optional()
      .isIn(['invitation', 'objection_handling', 'general'])
      .withMessage('会话上下文无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, sessionContext } = req.body;
      const session = await aiService.startChatSession(req.user!.id, { 
        funnelId, 
        sessionContext: sessionContext || 'general'
      });
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'AI对话会话已创建'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 向指定会话发送消息
router.post(
  '/sessions/:sessionId/messages',
  [
    param('sessionId')
      .isUUID()
      .withMessage('会话ID格式无效'),
      
    body('message')
      .isLength({ min: 1, max: 2000 })
      .withMessage('消息内容长度必须在1-2000个字符之间')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      
      const response = await aiService.sendChatMessage(req.user!.id, {
        message,
        sessionId
      });
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }
);

// 开始新的AI对话会话 - 兼容性端点
router.post(
  '/chat/start',
  [
    body('funnelId')
      .optional()
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('context')
      .optional()
      .isIn(['invitation', 'objection_handling', 'general'])
      .withMessage('会话上下文无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, context } = req.body;
      const session = await aiService.startChatSession(req.user!.id, { funnelId, sessionContext: context });
      
      res.status(201).json({
        success: true,
        data: session,
        message: 'AI对话会话已开始'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 发送聊天消息
router.post(
  '/chat',
  [
    body('message')
      .isLength({ min: 1, max: 2000 })
      .withMessage('消息内容长度必须在1-2000个字符之间'),
    
    body('sessionId')
      .optional()
      .isUUID()
      .withMessage('会话ID格式无效'),
    
    body('funnelId')
      .optional()
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('context')
      .optional()
      .isIn(['invitation', 'objection_handling', 'general'])
      .withMessage('会话上下文无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const chatRequest: ChatRequest = req.body;
      const response = await aiService.sendChatMessage(req.user!.id, chatRequest);
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取AI会话历史
router.get(
  '/sessions',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('每页条数必须在1-50之间'),
    
    query('funnelId')
      .optional()
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    query('context')
      .optional()
      .isIn(['invitation', 'objection_handling', 'general'])
      .withMessage('会话上下文无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const funnelId = req.query.funnelId as string;
      const context = req.query.context as string;
      
      const sessions = await aiService.getUserSessions(req.user!.id, {
        page,
        limit,
        funnelId,
        context
      });
      
      res.json({
        success: true,
        data: sessions
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取特定AI会话详情
router.get(
  '/sessions/:sessionId',
  [
    param('sessionId')
      .isUUID()
      .withMessage('会话ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const session = await aiService.getSessionById(req.params.sessionId, req.user!.id);
      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  }
);

// 结束AI会话
router.put(
  '/sessions/:sessionId/end',
  [
    param('sessionId')
      .isUUID()
      .withMessage('会话ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const session = await aiService.endSession(req.params.sessionId, req.user!.id);
      res.json({
        success: true,
        data: session,
        message: 'AI会话已结束'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除AI会话
router.delete(
  '/sessions/:sessionId',
  [
    param('sessionId')
      .isUUID()
      .withMessage('会话ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await aiService.deleteSession(req.params.sessionId, req.user!.id);
      res.json({
        success: true,
        message: 'AI会话已删除'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 请求漏斗分析
router.post(
  '/analyze',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('analysisType')
      .isIn(['performance', 'bottlenecks', 'recommendations', 'trends'])
      .withMessage('分析类型无效'),
    
    body('timeRange')
      .optional()
      .isObject()
      .withMessage('时间范围必须是对象'),
    
    body('timeRange.startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    body('timeRange.endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const analysisRequest: AnalysisRequest = req.body;
      
      if (analysisRequest.timeRange) {
        analysisRequest.timeRange.startDate = new Date(analysisRequest.timeRange.startDate);
        analysisRequest.timeRange.endDate = new Date(analysisRequest.timeRange.endDate);
      }
      
      const analysis = await aiService.analyzeFunction(req.user!.id, analysisRequest);
      
      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取AI推荐建议
router.get(
  '/recommendations/:funnelId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('推荐数量必须在1-20之间'),
    
    query('priority')
      .optional()
      .isIn(['high', 'medium', 'low'])
      .withMessage('优先级无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const priority = req.query.priority as string;
      
      const recommendations = await aiService.getFunnelRecommendations(
        req.params.funnelId,
        req.user!.id,
        { limit, priority }
      );
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }
);

// 生成邀请文案
router.post(
  '/generate/invitation',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('nodeId')
      .optional()
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    body('context')
      .optional()
      .isLength({ max: 500 })
      .withMessage('上下文长度不能超过500个字符'),
    
    body('tone')
      .optional()
      .isIn(['professional', 'friendly', 'casual', 'urgent'])
      .withMessage('语调类型无效'),
    
    body('length')
      .optional()
      .isIn(['short', 'medium', 'long'])
      .withMessage('文案长度类型无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, nodeId, context, tone, length } = req.body;
      const invitation = await aiService.generateInvitation(req.user!.id, {
        funnelId,
        nodeId,
        context,
        tone: tone || 'professional',
        length: length || 'medium'
      });
      
      res.json({
        success: true,
        data: invitation
      });
    } catch (error) {
      next(error);
    }
  }
);

// 生成异议处理方案
router.post(
  '/generate/objection-handling',
  [
    body('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('objection')
      .isLength({ min: 5, max: 500 })
      .withMessage('异议内容长度必须在5-500个字符之间'),
    
    body('customerType')
      .optional()
      .isLength({ max: 100 })
      .withMessage('客户类型长度不能超过100个字符')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, objection, customerType } = req.body;
      const handling = await aiService.generateObjectionHandling(req.user!.id, {
        funnelId,
        objection,
        customerType
      });
      
      res.json({
        success: true,
        data: handling
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取AI使用统计
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await aiService.getUserAiStats(req.user!.id);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// AI智能分析端点
router.post(
  '/analysis/smart',
  [
    body('query')
      .isLength({ min: 5, max: 500 })
      .withMessage('查询内容长度必须在5-500个字符之间'),
      
    body('funnelId')
      .optional()
      .isUUID()
      .withMessage('漏斗ID格式无效'),
      
    body('context')
      .optional()
      .isIn(['data_analysis', 'optimization', 'troubleshooting', 'planning'])
      .withMessage('分析上下文无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { query, funnelId, context } = req.body;
      
      // 创建临时会话进行智能分析
      const analysisSession = await aiService.startChatSession(req.user!.id, {
        funnelId,
        sessionContext: 'general'
      });
      
      const analysisQuery = `[智能分析请求] ${context ? `上下文: ${context}. ` : ''}${query}`;
      
      const response = await aiService.sendChatMessage(req.user!.id, {
        message: analysisQuery,
        sessionId: analysisSession.id,
        funnelId
      });
      
      res.json({
        success: true,
        data: {
          analysis: response.message,
          suggestions: response.suggestions,
          actions: response.actions,
          sessionId: analysisSession.id
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// 批量分析端点
router.post(
  '/analysis/batch',
  [
    body('funnelIds')
      .isArray({ min: 1, max: 5 })
      .withMessage('漏斗ID数组必须包含1-5个元素'),
      
    body('funnelIds.*')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
      
    body('analysisType')
      .isIn(['performance', 'bottlenecks', 'recommendations', 'trends'])
      .withMessage('分析类型无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelIds, analysisType, timeRange } = req.body;
      
      const analyses = await Promise.all(
        funnelIds.map(async (funnelId: string) => {
          try {
            return await aiService.analyzeFunction(req.user!.id, {
              funnelId,
              analysisType,
              timeRange
            });
          } catch (error) {
            return {
              funnelId,
              error: error instanceof Error ? error.message : '分析失败',
              analysisType
            };
          }
        })
      );
      
      res.json({
        success: true,
        data: {
          analyses,
          summary: `完成了 ${analyses.length} 个漏斗的 ${analysisType} 分析`
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// AI训练数据反馈端点
router.post(
  '/feedback',
  [
    body('sessionId')
      .isUUID()
      .withMessage('会话ID格式无效'),
      
    body('messageId')
      .optional()
      .isUUID()
      .withMessage('消息ID格式无效'),
      
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('评分必须是1-5之间的整数'),
      
    body('feedback')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('反馈内容不能超过1000个字符')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { sessionId, messageId, rating, feedback } = req.body;
      
      // 验证会话所有权
      const session = await aiService.getSessionById(sessionId, req.user!.id);
      
      // 这里可以保存反馈到数据库，用于改进AI模型
      // 暂时只返回成功响应
      
      res.json({
        success: true,
        data: {
          sessionId,
          messageId,
          rating,
          feedback
        },
        message: '感谢您的反馈，这将帮助我们改进AI助手的表现'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取AI模型状态和配置信息
router.get('/status', async (req, res, next) => {
  try {
    const status = {
      modelAvailable: !!process.env.GEMINI_API_KEY,
      modelName: 'gemini-pro',
      features: {
        chat: true,
        analysis: true,
        invitationGeneration: true,
        objectionHandling: true,
        dataInsights: true
      },
      limits: {
        maxMessageLength: 2000,
        maxSessionMessages: 100,
        maxConcurrentSessions: 10
      }
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

export default router;