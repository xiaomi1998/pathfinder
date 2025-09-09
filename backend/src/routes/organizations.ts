import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationService } from '@/services/OrganizationService';
import { authMiddleware } from '@/middleware/auth';
import { validateBody } from '@/middleware/joiValidation';
import { organizationInfoSchema } from '@/schemas/organization';
import { getLocationName } from '@/utils/locationMapping';

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
      
      // 特殊处理：将所有新增字段存储到description中
      // 这样可以不修改现有的数据模型
      const metadataFields = [
        `行业: ${organizationData.industry || '未设置'}`,
        `规模: ${organizationData.size || '未设置'}`,
        `城市: ${organizationData.location ? getLocationName(organizationData.location) : '未设置'}`,
        `销售模型: ${organizationData.salesModel || '未设置'}`
      ];
      
      const enhancedDescription = organizationData.description 
        ? `${organizationData.description}\n\n--- 组织信息 ---\n${metadataFields.join('\n')}`
        : `--- 组织信息 ---\n${metadataFields.join('\n')}`;

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

      const organization = await organizationService.getOrganizationById(req.user.organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          error: '组织不存在',
          code: 'ORGANIZATION_NOT_FOUND'
        });
      }

      // 解析description中的元数据信息
      let parsedInfo = {
        name: organization.name,
        industry: '',
        size: '',
        location: '',
        salesModel: '',
        description: ''
      };

      if (organization.description) {
        // 尝试从description中解析结构化信息
        const lines = organization.description.split('\n');
        const metadataStart = lines.findIndex(line => line.includes('--- 组织信息 ---'));
        
        if (metadataStart > -1) {
          // 获取元数据之前的内容作为description
          parsedInfo.description = lines.slice(0, metadataStart).join('\n').trim();
          
          // 解析元数据
          const metadataLines = lines.slice(metadataStart + 1);
          for (const line of metadataLines) {
            if (line.includes('行业:')) {
              parsedInfo.industry = line.split('行业:')[1]?.trim().replace('未设置', '') || '';
            } else if (line.includes('规模:')) {
              parsedInfo.size = line.split('规模:')[1]?.trim().replace('未设置', '') || '';
            } else if (line.includes('城市:')) {
              parsedInfo.location = line.split('城市:')[1]?.trim().replace('未设置', '') || '';
            } else if (line.includes('销售模型:')) {
              parsedInfo.salesModel = line.split('销售模型:')[1]?.trim().replace('未设置', '') || '';
            }
          }
        } else {
          // 没有结构化数据，全部作为description
          parsedInfo.description = organization.description;
        }
      }

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

export default router;