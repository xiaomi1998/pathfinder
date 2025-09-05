import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FunnelService } from '@/services/FunnelService';
import { validateRequest } from '@/middleware/validateRequest';
import { CreateFunnelInput, UpdateFunnelInput } from '@/types/funnel';

const router = Router();
const funnelService = new FunnelService();

// 获取用户的所有漏斗
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('每页条数必须在1-50之间'),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('搜索关键词长度不能超过255个字符'),
    
    query('sort')
      .optional()
      .isIn(['name', 'createdAt', 'updatedAt'])
      .withMessage('排序字段无效'),
    
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('排序方向无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const sort = req.query.sort as string || 'updatedAt';
      const order = req.query.order as 'asc' | 'desc' || 'desc';
      
      const funnels = await funnelService.getUserFunnels(req.user!.id, {
        page,
        limit,
        search,
        sort,
        order
      });
      
      res.json({
        success: true,
        data: funnels
      });
    } catch (error) {
      next(error);
    }
  }
);

// 创建新漏斗
router.post(
  '/',
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('漏斗名称长度必须在1-100个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('漏斗描述长度不能超过1000个字符'),
    
    body('canvasData')
      .optional()
      .isObject()
      .withMessage('画布数据必须是有效的JSON对象')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const funnelData: CreateFunnelInput = req.body;
      const funnel = await funnelService.createFunnel(req.user!.id, funnelData);
      
      res.status(201).json({
        success: true,
        data: funnel,
        message: '漏斗创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取特定漏斗详情
router.get(
  '/:funnelId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const funnel = await funnelService.getFunnelById(req.params.funnelId, req.user!.id);
      res.json({
        success: true,
        data: funnel
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新漏斗
router.put(
  '/:funnelId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('漏斗名称长度必须在1-100个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('漏斗描述长度不能超过1000个字符'),
    
    body('canvasData')
      .optional()
      .isObject()
      .withMessage('画布数据必须是有效的JSON对象')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const updateData: UpdateFunnelInput = req.body;
      const funnel = await funnelService.updateFunnel(req.params.funnelId, req.user!.id, updateData);
      
      res.json({
        success: true,
        data: funnel,
        message: '漏斗更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除漏斗
router.delete(
  '/:funnelId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      await funnelService.deleteFunnel(req.params.funnelId, req.user!.id);
      res.json({
        success: true,
        message: '漏斗删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 复制漏斗
router.post(
  '/:funnelId/duplicate',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('新漏斗名称长度必须在1-100个字符之间')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const newName = req.body.name;
      const funnel = await funnelService.duplicateFunnel(req.params.funnelId, req.user!.id, newName);
      
      res.status(201).json({
        success: true,
        data: funnel,
        message: '漏斗复制成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取漏斗统计信息
router.get(
  '/:funnelId/stats',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const stats = await funnelService.getFunnelStats(req.params.funnelId, req.user!.id);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取漏斗性能分析
router.get(
  '/:funnelId/performance',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const performance = await funnelService.getFunnelPerformance(
        req.params.funnelId, 
        req.user!.id,
        { startDate, endDate }
      );
      
      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      next(error);
    }
  }
);

// 导出漏斗数据
router.get(
  '/:funnelId/export',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    query('format')
      .optional()
      .isIn(['json', 'csv', 'excel'])
      .withMessage('导出格式无效'),
    
    query('includeData')
      .optional()
      .isBoolean()
      .withMessage('包含数据标志必须是布尔值')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const format = req.query.format as string || 'json';
      const includeData = req.query.includeData === 'true';
      
      const exportData = await funnelService.exportFunnel(
        req.params.funnelId, 
        req.user!.id,
        { format, includeData }
      );
      
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.setHeader('Content-Type', exportData.contentType);
      res.send(exportData.data);
    } catch (error) {
      next(error);
    }
  }
);

export default router;