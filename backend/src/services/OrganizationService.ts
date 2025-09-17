import { PrismaClient } from '@prisma/client';
import { 
  Organization, 
  OrganizationWithRelations,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationStats,
  OrganizationQueryParams,
  PlanType
} from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class OrganizationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 创建组织
   */
  async createOrganization(data: CreateOrganizationRequest, createdBy: string): Promise<Organization> {
    try {
      // 验证slug唯一性
      if (data.slug) {
        const existingOrg = await this.prisma.organization.findUnique({
          where: { slug: data.slug }
        });
        if (existingOrg) {
          throw new ApiError('组织标识已被使用', 409);
        }
      }

      // 创建组织
      const organization = await this.prisma.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          planType: data.planType || 'free',
        }
      });

      // 创建默认使用限制
      await this.prisma.orgUsageLimit.create({
        data: {
          organizationId: organization.id,
          maxFunnels: organization.planType === 'free' ? 3 : 50,
          maxTemplates: organization.planType === 'free' ? 2 : 20,
          maxUsers: organization.planType === 'free' ? 3 : 25,
          planType: organization.planType,
        }
      });

      // 将创建者设置为owner角色
      await this.prisma.user.update({
        where: { id: createdBy },
        data: {
          organizationId: organization.id,
          role: 'owner'
        }
      });

      logger.info(`Organization created: ${organization.name} by user ${createdBy}`);
      return {
        ...organization,
        description: organization.description || undefined,
        planType: organization.planType as any
      };
    } catch (error) {
      logger.error('Error creating organization:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('创建组织失败', 500);
    }
  }

  /**
   * 获取组织详情
   */
  async getOrganizationById(id: string): Promise<OrganizationWithRelations | null> {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
            }
          },
          usageLimit: true,
          funnels: {
            where: { status: 'active' },
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          funnelTemplates: {
            select: {
              id: true,
              name: true,
              description: true,
              isDefault: true,
              createdAt: true,
            }
          }
        }
      });

      if (!organization) return null;
      
      return {
        ...organization,
        description: organization.description || undefined,
        planType: organization.planType as any,
        usageLimit: organization.usageLimit || undefined,
        funnels: organization.funnels?.map(f => ({
          ...f,
          description: f.description || undefined
        })),
        funnelTemplates: organization.funnelTemplates?.map(ft => ({
          ...ft,
          description: ft.description || undefined
        })),
        users: organization.users?.map(u => ({
          ...u
        }))
      } as any;
    } catch (error) {
      logger.error('Error getting organization:', error);
      throw new ApiError('获取组织失败', 500);
    }
  }

  /**
   * 更新组织
   */
  async updateOrganization(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    try {
      // 验证组织是否存在
      const existingOrg = await this.prisma.organization.findUnique({
        where: { id }
      });

      if (!existingOrg) {
        throw new ApiError('组织不存在', 404);
      }

      // 如果更新slug，验证唯一性
      if (data.slug && data.slug !== existingOrg.slug) {
        const slugExists = await this.prisma.organization.findUnique({
          where: { slug: data.slug }
        });
        if (slugExists) {
          throw new ApiError('组织标识已被使用', 409);
        }
      }

      // 更新组织信息
      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.planType && { planType: data.planType }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        }
      });

      logger.info(`Organization updated: ${updatedOrganization.name} (${id})`);
      return {
        ...updatedOrganization,
        description: updatedOrganization.description || undefined,
        planType: updatedOrganization.planType as any
      };
    } catch (error) {
      logger.error('Error updating organization:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新组织失败', 500);
    }
  }

  /**
   * 删除组织
   */
  async deleteOrganization(id: string): Promise<void> {
    try {
      // TODO: 实现组织删除逻辑
      // - 验证权限
      // - 软删除或硬删除
      // - 处理关联数据
      
      logger.info(`Deleting organization: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error deleting organization:', error);
      throw new ApiError('删除组织失败', 500);
    }
  }

  /**
   * 获取组织列表
   */
  async getOrganizations(params: OrganizationQueryParams = {}): Promise<Organization[]> {
    try {
      // TODO: 实现获取组织列表逻辑
      // - 支持分页、搜索、排序
      // - 支持计划类型过滤
      
      logger.info('Getting organizations list');
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error getting organizations:', error);
      throw new ApiError('获取组织列表失败', 500);
    }
  }

  /**
   * 获取组织统计
   */
  async getOrganizationStats(id: string): Promise<OrganizationStats> {
    try {
      // TODO: 实现组织统计逻辑
      // - 用户数量、漏斗数量、模板数量
      // - 使用率统计
      
      logger.info(`Getting organization stats: ${id}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error getting organization stats:', error);
      throw new ApiError('获取组织统计失败', 500);
    }
  }

  /**
   * 添加用户到组织
   */
  async addUserToOrganization(orgId: string, userId: string, role: string): Promise<void> {
    try {
      // TODO: 实现添加用户逻辑
      // - 验证权限
      // - 检查用户限制
      // - 更新用户角色
      
      logger.info(`Adding user ${userId} to organization ${orgId}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error adding user to organization:', error);
      throw new ApiError('添加用户失败', 500);
    }
  }

  /**
   * 从组织移除用户
   */
  async removeUserFromOrganization(orgId: string, userId: string): Promise<void> {
    try {
      // TODO: 实现移除用户逻辑
      // - 验证权限
      // - 处理用户数据迁移或删除
      
      logger.info(`Removing user ${userId} from organization ${orgId}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error removing user from organization:', error);
      throw new ApiError('移除用户失败', 500);
    }
  }

  /**
   * 升级组织计划
   */
  async upgradePlan(id: string, newPlan: PlanType): Promise<Organization> {
    try {
      // TODO: 实现计划升级逻辑
      // - 验证权限
      // - 更新计划类型
      // - 更新使用限制
      
      logger.info(`Upgrading organization ${id} to ${newPlan}`);
      throw new Error('Not implemented yet');
    } catch (error) {
      logger.error('Error upgrading organization plan:', error);
      throw new ApiError('升级计划失败', 500);
    }
  }

  /**
   * 创建简单组织（用于注册流程）
   */
  async createDefaultOrganization(name: string, createdBy: string): Promise<Organization> {
    const slug = await this.generateUniqueSlug(name);
    return this.createOrganization({ name, slug }, createdBy);
  }

  /**
   * 获取组织详情（包含结构化数据）
   */
  async getOrganizationWithStructuredData(id: string) {
    try {
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        include: {
          industry: true,
        }
      });

      if (!organization) return null;

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description || undefined,
        industry: organization.industry ? {
          id: organization.industry.id,
          code: organization.industry.code,
          name: organization.industry.name,
          nameEn: organization.industry.nameEn || undefined
        } : null,
        companySize: organization.companySize || undefined,
        location: organization.location || undefined,
        salesModel: organization.salesModel || undefined,
        planType: organization.planType,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt
      };
    } catch (error) {
      logger.error('Error getting organization with structured data:', error);
      throw new ApiError('获取组织信息失败', 500);
    }
  }

  /**
   * 更新组织（使用结构化数据）
   */
  async updateOrganizationWithStructuredData(id: string, data: {
    name?: string;
    description?: string;
    industryId?: string | null;
    companySize?: string | null;
    location?: string | null;
    salesModel?: string | null;
  }) {
    try {
      const existingOrg = await this.prisma.organization.findUnique({
        where: { id }
      });

      if (!existingOrg) {
        throw new ApiError('组织不存在', 404);
      }

      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.industryId !== undefined && { industryId: data.industryId }),
          ...(data.companySize !== undefined && { companySize: data.companySize as any }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.salesModel !== undefined && { salesModel: data.salesModel as any }),
        },
        include: {
          industry: true
        }
      });

      logger.info(`Organization updated with structured data: ${updatedOrganization.name} (${id})`);
      
      return {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        slug: updatedOrganization.slug,
        description: updatedOrganization.description || undefined,
        industry: updatedOrganization.industry ? {
          id: updatedOrganization.industry.id,
          code: updatedOrganization.industry.code,
          name: updatedOrganization.industry.name,
          nameEn: updatedOrganization.industry.nameEn || undefined
        } : null,
        companySize: updatedOrganization.companySize || undefined,
        location: updatedOrganization.location || undefined,
        salesModel: updatedOrganization.salesModel || undefined,
        planType: updatedOrganization.planType,
        isActive: updatedOrganization.isActive,
        createdAt: updatedOrganization.createdAt,
        updatedAt: updatedOrganization.updatedAt
      };
    } catch (error) {
      logger.error('Error updating organization with structured data:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新组织信息失败', 500);
    }
  }

  /**
   * 生成唯一的组织slug
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    // 从名称生成基础slug
    let baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-') // 保留中文字符
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // 如果是中文名，使用前缀
    if (/[\u4e00-\u9fff]/.test(baseSlug)) {
      baseSlug = `org-${Date.now()}`;
    }

    let slug = baseSlug;
    let counter = 1;

    // 检查slug是否已存在
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}