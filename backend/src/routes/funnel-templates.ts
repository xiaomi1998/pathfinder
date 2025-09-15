import { Router } from 'express';
import { body, param } from 'express-validator';
import { FunnelTemplateService } from '@/services/FunnelTemplateService';
import { validateRequest } from '@/middleware/validateRequest';
import { CreateFunnelTemplateRequest, UpdateFunnelTemplateRequest } from '@/types';

const router = Router();
const funnelTemplateService = new FunnelTemplateService();

// 获取组织的漏斗模板（应该只有一个）
router.get(
  '/',
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能获取模板'
        });
      }

      const template = await funnelTemplateService.getOrganizationTemplate(req.user.organizationId);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '未找到漏斗模板',
          data: null
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }
);

// 创建新的漏斗模板
router.post(
  '/',
  [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('模板名称长度必须在1-100个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('模板描述长度不能超过1000个字符'),
    
    body('templateData')
      .isObject()
      .withMessage('模板数据必须是有效的JSON对象'),
    
    body('templateData.nodes')
      .isArray()
      .withMessage('模板数据必须包含节点数组'),
    
    body('templateData.edges')
      .isArray()
      .withMessage('模板数据必须包含连接数组'),
    
    body('templateData.viewport')
      .isObject()
      .withMessage('模板数据必须包含视窗对象'),
    
    body('templateData.version')
      .isString()
      .withMessage('模板数据必须包含版本信息'),

    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('默认模板标志必须是布尔值')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能创建模板'
        });
      }

      const templateData: CreateFunnelTemplateRequest = req.body;
      const template = await funnelTemplateService.createTemplate(
        req.user.organizationId,
        req.user.id,
        templateData
      );
      
      res.status(201).json({
        success: true,
        data: template,
        message: '漏斗模板创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取特定漏斗模板详情
router.get(
  '/:templateId',
  [
    param('templateId')
      .isString()
      .withMessage('模板ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能获取模板'
        });
      }

      const template = await funnelTemplateService.getTemplateById(
        req.params.templateId,
        req.user.organizationId
      );
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '模板不存在或无权访问'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }
);

// 更新漏斗模板
router.put(
  '/:templateId',
  [
    param('templateId')
      .isString()
      .withMessage('模板ID格式无效'),
    
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('模板名称长度必须在1-100个字符之间'),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('模板描述长度不能超过1000个字符'),
    
    body('templateData')
      .optional()
      .isObject()
      .withMessage('模板数据必须是有效的JSON对象'),
    
    body('templateData.nodes')
      .optional()
      .isArray()
      .withMessage('节点数据必须是数组'),
    
    body('templateData.edges')
      .optional()
      .isArray()
      .withMessage('连接数据必须是数组'),
    
    body('templateData.viewport')
      .optional()
      .isObject()
      .withMessage('视窗数据必须是对象'),
    
    body('templateData.version')
      .optional()
      .isString()
      .withMessage('版本信息必须是字符串'),

    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('默认模板标志必须是布尔值')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能更新模板'
        });
      }

      const updateData: UpdateFunnelTemplateRequest = req.body;
      const template = await funnelTemplateService.updateTemplate(
        req.params.templateId,
        req.user.organizationId,
        req.user.id,
        updateData
      );
      
      res.json({
        success: true,
        data: template,
        message: '漏斗模板更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 删除漏斗模板
router.delete(
  '/:templateId',
  [
    param('templateId')
      .isString()
      .withMessage('模板ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能删除模板'
        });
      }

      await funnelTemplateService.deleteTemplate(
        req.params.templateId,
        req.user.organizationId,
        req.user.id
      );
      
      res.json({
        success: true,
        message: '漏斗模板删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取行业默认模板列表
router.get(
  '/industry-templates',
  async (req, res, next) => {
    try {
      const templates = await funnelTemplateService.getIndustryTemplates();
      
      res.json({
        success: true,
        data: templates
      });
    } catch (error) {
      next(error);
    }
  }
);

// 根据行业获取特定默认模板
router.get(
  '/industry/:industry',
  [
    param('industry')
      .isString()
      .withMessage('行业代码格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const template = await funnelTemplateService.getIndustryTemplate(req.params.industry);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '未找到该行业的默认模板'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取或创建默认模板
router.post(
  '/default',
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能创建默认模板'
        });
      }

      const template = await funnelTemplateService.getOrCreateDefaultTemplate(
        req.user.organizationId,
        req.user.id
      );
      
      res.json({
        success: true,
        data: template,
        message: '默认模板获取或创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 从模板创建漏斗数据
router.post(
  '/:templateId/create-funnel',
  [
    param('templateId')
      .isString()
      .withMessage('模板ID格式无效'),
    
    body('funnelName')
      .isLength({ min: 1, max: 100 })
      .withMessage('漏斗名称长度必须在1-100个字符之间')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          message: '用户必须属于一个组织才能从模板创建漏斗'
        });
      }

      const result = await funnelTemplateService.createFunnelFromTemplate(
        req.params.templateId,
        req.user.organizationId,
        req.user.id,
        req.body.funnelName
      );
      
      res.json({
        success: true,
        data: result,
        message: '从模板创建漏斗数据成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;