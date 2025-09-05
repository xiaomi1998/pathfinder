import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationService } from '@/services/OrganizationService';
import { authMiddleware } from '@/middleware/auth';
import { validateBody } from '@/middleware/joiValidation';
import { organizationInfoSchema } from '@/schemas/organization';

const router = Router();
const organizationService = new OrganizationService();

// 更新组织信息路由
router.post(
  '/info',
  authMiddleware,
  validateBody(organizationInfoSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          error: '用户未关联组织',
          code: 'NO_ORGANIZATION'
        });
      }

      if (!req.user.role || !['owner', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: '没有权限更新组织信息',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      const organizationData = req.body;
      
      // 特殊处理：将industry和size存储到description中
      // 这样可以不修改现有的数据模型
      const enhancedDescription = organizationData.description 
        ? `${organizationData.description}\n行业: ${organizationData.industry || '未设置'}\n规模: ${organizationData.size || '未设置'}`
        : `行业: ${organizationData.industry || '未设置'}\n规模: ${organizationData.size || '未设置'}`;

      const updatedOrganization = await organizationService.updateOrganization(
        req.user.organizationId,
        {
          name: organizationData.name,
          description: enhancedDescription
        }
      );

      res.json({
        success: true,
        data: updatedOrganization,
        message: '组织信息更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// 获取当前组织信息
router.get(
  '/current',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(400).json({
          success: false,
          error: '用户未关联组织',
          code: 'NO_ORGANIZATION'
        });
      }

      const organization = await organizationService.getOrganizationById(req.user.organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: '组织不存在',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: organization,
        message: '获取组织信息成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;