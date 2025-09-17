import { PrismaClient } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export interface IndustryResponse {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateIndustryRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateIndustryRequest {
  code?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export class IndustryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 获取所有活跃行业
   */
  async getActiveIndustries(): Promise<IndustryResponse[]> {
    try {
      const industries = await this.prisma.industry.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      });

      return industries.map(industry => ({
        id: industry.id,
        code: industry.code,
        name: industry.name,
        nameEn: industry.nameEn || undefined,
        description: industry.description || undefined,
        isActive: industry.isActive,
        sortOrder: industry.sortOrder
      }));
    } catch (error) {
      logger.error('Error getting active industries:', error);
      throw new ApiError('获取行业列表失败', 500);
    }
  }

  /**
   * 获取所有行业（包括不活跃的）
   */
  async getAllIndustries(): Promise<IndustryResponse[]> {
    try {
      const industries = await this.prisma.industry.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' }
        ]
      });

      return industries.map(industry => ({
        id: industry.id,
        code: industry.code,
        name: industry.name,
        nameEn: industry.nameEn || undefined,
        description: industry.description || undefined,
        isActive: industry.isActive,
        sortOrder: industry.sortOrder
      }));
    } catch (error) {
      logger.error('Error getting all industries:', error);
      throw new ApiError('获取行业列表失败', 500);
    }
  }

  /**
   * 根据ID获取行业
   */
  async getIndustryById(id: string): Promise<IndustryResponse | null> {
    try {
      const industry = await this.prisma.industry.findUnique({
        where: { id }
      });

      if (!industry) return null;

      return {
        id: industry.id,
        code: industry.code,
        name: industry.name,
        nameEn: industry.nameEn || undefined,
        description: industry.description || undefined,
        isActive: industry.isActive,
        sortOrder: industry.sortOrder
      };
    } catch (error) {
      logger.error('Error getting industry by id:', error);
      throw new ApiError('获取行业信息失败', 500);
    }
  }

  /**
   * 根据code获取行业
   */
  async getIndustryByCode(code: string): Promise<IndustryResponse | null> {
    try {
      const industry = await this.prisma.industry.findUnique({
        where: { code }
      });

      if (!industry) return null;

      return {
        id: industry.id,
        code: industry.code,
        name: industry.name,
        nameEn: industry.nameEn || undefined,
        description: industry.description || undefined,
        isActive: industry.isActive,
        sortOrder: industry.sortOrder
      };
    } catch (error) {
      logger.error('Error getting industry by code:', error);
      throw new ApiError('获取行业信息失败', 500);
    }
  }

  /**
   * 创建新行业
   */
  async createIndustry(data: CreateIndustryRequest): Promise<IndustryResponse> {
    try {
      // 检查code唯一性
      const existingIndustry = await this.prisma.industry.findUnique({
        where: { code: data.code }
      });

      if (existingIndustry) {
        throw new ApiError('行业代码已存在', 409);
      }

      const industry = await this.prisma.industry.create({
        data: {
          code: data.code,
          name: data.name,
          nameEn: data.nameEn,
          description: data.description,
          sortOrder: data.sortOrder || 0
        }
      });

      logger.info(`Industry created: ${industry.name} (${industry.code})`);
      
      return {
        id: industry.id,
        code: industry.code,
        name: industry.name,
        nameEn: industry.nameEn || undefined,
        description: industry.description || undefined,
        isActive: industry.isActive,
        sortOrder: industry.sortOrder
      };
    } catch (error) {
      logger.error('Error creating industry:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('创建行业失败', 500);
    }
  }

  /**
   * 更新行业
   */
  async updateIndustry(id: string, data: UpdateIndustryRequest): Promise<IndustryResponse> {
    try {
      // 检查行业是否存在
      const existingIndustry = await this.prisma.industry.findUnique({
        where: { id }
      });

      if (!existingIndustry) {
        throw new ApiError('行业不存在', 404);
      }

      // 如果更新code，检查唯一性
      if (data.code && data.code !== existingIndustry.code) {
        const codeExists = await this.prisma.industry.findUnique({
          where: { code: data.code }
        });
        if (codeExists) {
          throw new ApiError('行业代码已存在', 409);
        }
      }

      const updatedIndustry = await this.prisma.industry.update({
        where: { id },
        data: {
          ...(data.code && { code: data.code }),
          ...(data.name && { name: data.name }),
          ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder })
        }
      });

      logger.info(`Industry updated: ${updatedIndustry.name} (${updatedIndustry.code})`);
      
      return {
        id: updatedIndustry.id,
        code: updatedIndustry.code,
        name: updatedIndustry.name,
        nameEn: updatedIndustry.nameEn || undefined,
        description: updatedIndustry.description || undefined,
        isActive: updatedIndustry.isActive,
        sortOrder: updatedIndustry.sortOrder
      };
    } catch (error) {
      logger.error('Error updating industry:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新行业失败', 500);
    }
  }

  /**
   * 删除行业（软删除 - 设为不活跃）
   */
  async deleteIndustry(id: string): Promise<void> {
    try {
      const existingIndustry = await this.prisma.industry.findUnique({
        where: { id }
      });

      if (!existingIndustry) {
        throw new ApiError('行业不存在', 404);
      }

      // 检查是否有组织使用此行业
      const organizationsUsingIndustry = await this.prisma.organization.count({
        where: { industryId: id }
      });

      if (organizationsUsingIndustry > 0) {
        // 软删除 - 设为不活跃
        await this.prisma.industry.update({
          where: { id },
          data: { isActive: false }
        });
        logger.info(`Industry deactivated (has ${organizationsUsingIndustry} organizations): ${existingIndustry.name}`);
      } else {
        // 硬删除 - 没有组织使用
        await this.prisma.industry.delete({
          where: { id }
        });
        logger.info(`Industry deleted: ${existingIndustry.name}`);
      }
    } catch (error) {
      logger.error('Error deleting industry:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('删除行业失败', 500);
    }
  }

  /**
   * 批量更新行业排序
   */
  async updateIndustrySortOrders(updates: { id: string; sortOrder: number }[]): Promise<void> {
    try {
      await this.prisma.$transaction(
        updates.map(update =>
          this.prisma.industry.update({
            where: { id: update.id },
            data: { sortOrder: update.sortOrder }
          })
        )
      );

      logger.info(`Updated sort orders for ${updates.length} industries`);
    } catch (error) {
      logger.error('Error updating industry sort orders:', error);
      throw new ApiError('更新行业排序失败', 500);
    }
  }
}