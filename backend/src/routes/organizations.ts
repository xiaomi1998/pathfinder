import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationService } from '@/services/OrganizationService';
import { IndustryService } from '@/services/IndustryService';
import { authMiddleware } from '@/middleware/auth';
import { validateBody } from '@/middleware/joiValidation';
import { organizationInfoSchema } from '@/schemas/organization';
import { getLocationName, getLocationCode } from '@/utils/locationMapping';

const router = Router();
const organizationService = new OrganizationService();
const industryService = new IndustryService();

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
      
      // 获取行业ID（如果提供了行业代码）
      let industryId: string | null = null;
      if (organizationData.industry) {
        const industry = await industryService.getIndustryByCode(organizationData.industry);
        if (industry) {
          industryId = industry.id;
        }
      }
      
      // 映射公司规模
      let companySize: string | null = null;
      if (organizationData.size) {
        switch (organizationData.size) {
          case '1-10':
            companySize = 'SIZE_1_10';
            break;
          case '11-30':
            companySize = 'SIZE_11_30';
            break;
          case '31-100':
            companySize = 'SIZE_31_100';
            break;
        }
      }
      
      // 映射销售模型
      let salesModel: string | null = null;
      if (organizationData.salesModel) {
        switch (organizationData.salesModel) {
          case 'toB':
            salesModel = 'TO_B';
            break;
          case 'toC':
            salesModel = 'TO_C';
            break;
        }
      }

      // 处理位置信息
      const location = organizationData.location ? getLocationName(organizationData.location) : null;

      const updatedOrganization = await organizationService.updateOrganizationWithStructuredData(
        req.user.organizationId,
        {
          name: organizationData.name,
          description: organizationData.description,
          industryId,
          companySize,
          location,
          salesModel
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

// 获取组织详细信息 (for settings page)
router.get(
  '/info',
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

      const organization = await organizationService.getOrganizationWithStructuredData(req.user.organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: '组织不存在',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      // 转换为前端期望的格式
      const parsedInfo = {
        name: organization.name,
        industry: organization.industry?.code || '',
        size: organization.companySize ? 
          organization.companySize.replace('SIZE_', '').replace('_', '-') : '',
        location: organization.location ? getLocationCode(organization.location) : '',
        salesModel: organization.salesModel ? 
          organization.salesModel.replace('TO_', 'to') : '',
        description: organization.description || ''
      };

      // 设置缓存控制头，确保始终返回最新数据
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });

      res.json({
        success: true,
        data: parsedInfo,
        message: '获取组织信息成功'
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

// 获取行业选项
router.get(
  '/industries',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const industries = await industryService.getActiveIndustries();
      
      res.json({
        success: true,
        data: industries,
        message: '获取行业列表成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;