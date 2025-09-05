import { PrismaClient } from '@prisma/client';
import { 
  FunnelTemplate,
  FunnelTemplateListItem,
  CreateFunnelTemplateRequest,
  UpdateFunnelTemplateRequest,
  FunnelTemplateData
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class FunnelTemplateService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 创建漏斗模板
   */
  async createTemplate(
    organizationId: string, 
    createdBy: string, 
    data: CreateFunnelTemplateRequest
  ): Promise<FunnelTemplate> {
    try {
      logger.info(`Creating funnel template: ${data.name} for organization: ${organizationId}`);
      
      // 验证模板数据格式
      if (!this.validateTemplateData(data.templateData)) {
        throw new ApiError('模板数据格式无效', 400);
      }

      // 检查是否已存在模板 (每个组织只能有一个模板)
      const existingTemplate = await this.prisma.funnelTemplate.findFirst({
        where: { organizationId }
      });

      if (existingTemplate) {
        throw new ApiError('每个组织只能创建一个漏斗模板。请编辑现有模板或先删除现有模板。', 409);
      }

      // 创建模板
      const template = await this.prisma.funnelTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          templateData: data.templateData as any,
          isDefault: data.isDefault || false,
          organizationId,
          createdBy
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // 更新组织使用限制计数器
      await this.prisma.orgUsageLimit.upsert({
        where: { organizationId },
        update: { currentTemplates: { increment: 1 } },
        create: {
          organizationId,
          currentTemplates: 1,
          maxTemplates: 1 // 每个组织只能有一个模板
        }
      });

      logger.info(`Successfully created funnel template: ${template.id}`);
      return this.mapToFunnelTemplate(template);
    } catch (error) {
      logger.error('Error creating funnel template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('创建漏斗模板失败', 500);
    }
  }

  /**
   * 获取模板详情
   */
  async getTemplateById(id: string, organizationId: string): Promise<FunnelTemplate | null> {
    try {
      logger.info(`Getting funnel template: ${id}`);
      
      const template = await this.prisma.funnelTemplate.findFirst({
        where: {
          id,
          organizationId
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!template) {
        return null;
      }

      return this.mapToFunnelTemplate(template);
    } catch (error) {
      logger.error('Error getting funnel template:', error);
      throw new ApiError('获取漏斗模板失败', 500);
    }
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    id: string, 
    organizationId: string, 
    userId: string, 
    data: UpdateFunnelTemplateRequest
  ): Promise<FunnelTemplate> {
    try {
      logger.info(`Updating funnel template: ${id}`);
      
      // 验证模板是否存在且属于该组织
      const existingTemplate = await this.prisma.funnelTemplate.findFirst({
        where: {
          id,
          organizationId
        }
      });

      if (!existingTemplate) {
        throw new ApiError('模板不存在或无权访问', 404);
      }

      // 验证用户权限（创建者或管理员）
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (existingTemplate.createdBy !== userId && user?.role !== 'admin' && user?.role !== 'owner') {
        throw new ApiError('无权修改此模板', 403);
      }

      // 验证模板数据格式（如果提供）
      if (data.templateData && !this.validateTemplateData(data.templateData)) {
        throw new ApiError('模板数据格式无效', 400);
      }

      // 构建更新数据
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.templateData !== undefined) updateData.templateData = data.templateData;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

      // 更新模板
      const updatedTemplate = await this.prisma.funnelTemplate.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      logger.info(`Successfully updated funnel template: ${id}`);
      return this.mapToFunnelTemplate(updatedTemplate);
    } catch (error) {
      logger.error('Error updating funnel template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新漏斗模板失败', 500);
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string, organizationId: string, userId: string): Promise<void> {
    try {
      logger.info(`Deleting funnel template: ${id}`);
      
      // 验证模板是否存在且属于该组织
      const existingTemplate = await this.prisma.funnelTemplate.findFirst({
        where: {
          id,
          organizationId
        }
      });

      if (!existingTemplate) {
        throw new ApiError('模板不存在或无权访问', 404);
      }

      // 验证用户权限（创建者或管理员）
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (existingTemplate.createdBy !== userId && user?.role !== 'admin' && user?.role !== 'owner') {
        throw new ApiError('无权删除此模板', 403);
      }

      // 删除模板
      await this.prisma.funnelTemplate.delete({
        where: { id }
      });

      // 更新组织使用限制计数器
      await this.prisma.orgUsageLimit.update({
        where: { organizationId },
        data: { currentTemplates: { decrement: 1 } }
      });

      logger.info(`Successfully deleted funnel template: ${id}`);
    } catch (error) {
      logger.error('Error deleting funnel template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('删除漏斗模板失败', 500);
    }
  }

  /**
   * 获取组织的模板 (应该只有一个)
   */
  async getOrganizationTemplate(organizationId: string): Promise<FunnelTemplate | null> {
    try {
      logger.info(`Getting funnel template for organization: ${organizationId}`);
      
      const template = await this.prisma.funnelTemplate.findFirst({
        where: { organizationId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!template) {
        return null;
      }

      return this.mapToFunnelTemplate(template);
    } catch (error) {
      logger.error('Error getting organization funnel template:', error);
      throw new ApiError('获取漏斗模板失败', 500);
    }
  }

  /**
   * 获取或创建默认模板
   */
  async getOrCreateDefaultTemplate(organizationId: string, userId: string): Promise<FunnelTemplate> {
    try {
      logger.info(`Getting or creating default funnel template for organization: ${organizationId}`);
      
      // 先尝试获取现有模板
      const existingTemplate = await this.getOrganizationTemplate(organizationId);
      if (existingTemplate) {
        return existingTemplate;
      }

      // 如果没有模板，创建默认四段式漏斗模板
      const defaultTemplateData = this.createDefaultFunnelTemplate();
      
      return await this.createTemplate(organizationId, userId, {
        name: '默认漏斗模板',
        description: '系统自动生成的默认四段式漏斗模板',
        templateData: defaultTemplateData,
        isDefault: true
      });
    } catch (error) {
      logger.error('Error getting or creating default funnel template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('获取或创建默认漏斗模板失败', 500);
    }
  }

  /**
   * 设置模板为默认模板（在单模板系统中，组织的唯一模板就是默认模板）
   */
  async setDefaultTemplate(id: string, organizationId: string, userId: string): Promise<FunnelTemplate> {
    try {
      logger.info(`Setting default funnel template: ${id} for organization: ${organizationId}`);
      
      return await this.updateTemplate(id, organizationId, userId, {
        isDefault: true
      });
    } catch (error) {
      logger.error('Error setting default funnel template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('设置默认漏斗模板失败', 500);
    }
  }

  /**
   * 复制模板数据到漏斗 (不克隆模板，因为每个组织只能有一个模板)
   */
  async createFunnelFromTemplate(
    templateId: string,
    targetOrganizationId: string,
    createdBy: string,
    funnelName: string
  ): Promise<{ templateData: FunnelTemplateData }> {
    try {
      logger.info(`Creating funnel from template: ${templateId}`);
      
      // 获取模板数据
      const template = await this.getTemplateById(templateId, targetOrganizationId);
      if (!template) {
        throw new ApiError('模板不存在或无权访问', 404);
      }

      return {
        templateData: template.templateData
      };
    } catch (error) {
      logger.error('Error creating funnel from template:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('从模板创建漏斗失败', 500);
    }
  }

  /**
   * 创建默认四段式漏斗模板
   */
  private createDefaultFunnelTemplate(): FunnelTemplateData {
    return {
      nodes: [
        {
          id: 'awareness-node',
          type: 'funnelNode',
          position: { x: 100, y: 100 },
          data: {
            label: '认知阶段',
            nodeType: 'awareness'
          }
        },
        {
          id: 'acquisition-node',
          type: 'funnelNode',
          position: { x: 100, y: 200 },
          data: {
            label: '获取阶段',
            nodeType: 'acquisition'
          }
        },
        {
          id: 'activation-node',
          type: 'funnelNode',
          position: { x: 100, y: 300 },
          data: {
            label: '激活阶段',
            nodeType: 'activation'
          }
        },
        {
          id: 'revenue-node',
          type: 'funnelNode',
          position: { x: 100, y: 400 },
          data: {
            label: '收入阶段',
            nodeType: 'revenue'
          }
        }
      ],
      edges: [
        {
          id: 'awareness-to-acquisition',
          source: 'awareness-node',
          target: 'acquisition-node',
          type: 'default'
        },
        {
          id: 'acquisition-to-activation',
          source: 'acquisition-node',
          target: 'activation-node',
          type: 'default'
        },
        {
          id: 'activation-to-revenue',
          source: 'activation-node',
          target: 'revenue-node',
          type: 'default'
        }
      ],
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      },
      version: '1.0',
      metadata: {
        description: '默认的四段式漏斗模板',
        tags: ['default', 'four-stage'],
        createdWith: 'system'
      }
    };
  }

  /**
   * 验证模板数据格式
   */
  private validateTemplateData(templateData: FunnelTemplateData): boolean {
    try {
      // 检查基本结构
      if (!templateData || typeof templateData !== 'object') {
        return false;
      }

      // 检查必要字段
      if (!Array.isArray(templateData.nodes) || !Array.isArray(templateData.edges)) {
        return false;
      }

      if (!templateData.viewport || typeof templateData.viewport !== 'object') {
        return false;
      }

      if (!templateData.version || typeof templateData.version !== 'string') {
        return false;
      }

      // 检查节点结构
      for (const node of templateData.nodes) {
        if (!node.id || !node.type || !node.position || !node.data) {
          return false;
        }
        if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          return false;
        }
        if (!node.data.label || !node.data.nodeType) {
          return false;
        }
      }

      // 检查连接结构
      for (const edge of templateData.edges) {
        if (!edge.id || !edge.source || !edge.target) {
          return false;
        }
      }

      // 检查视窗结构
      const { viewport } = templateData;
      if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number' || typeof viewport.zoom !== 'number') {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating template data:', error);
      return false;
    }
  }

  /**
   * 映射数据库结果到响应类型
   */
  private mapToFunnelTemplate(template: any): FunnelTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      templateData: template.templateData as FunnelTemplateData,
      isDefault: template.isDefault,
      organizationId: template.organizationId,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      creator: template.creator ? {
        id: template.creator.id,
        username: template.creator.username,
        email: template.creator.email
      } : undefined
    };
  }
}