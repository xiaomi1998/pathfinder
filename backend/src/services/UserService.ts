import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { UpdateUserInput, UserResponse, UserStats, UserDetails } from '@/types';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getCurrentUser(userId: string): Promise<UserDetails> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    const stats = await this.getUserStats(userId);

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      organizationId: user.organizationId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      analysisQuota: user.analysisQuota
    };

    return {
      ...userResponse,
      stats
    };
  }

  async updateUser(userId: string, data: UpdateUserInput): Promise<UserResponse> {
    // 检查用户名是否已被其他用户使用
    if (data.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new ApiError('用户名已被使用', 409);
      }
    }

    // 检查邮箱是否已被其他用户使用
    if (data.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        throw new ApiError('邮箱已被使用', 409);
      }
    }

    try {
      const updateData: any = { ...data };
      
      // 如果包含密码，进行哈希处理
      if (data.password) {
        const saltRounds = 12;
        updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
        delete updateData.password;
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      logger.info(`用户信息已更新: ${user.username}`);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        organizationId: user.organizationId,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        analysisQuota: user.analysisQuota
      };
    } catch (error) {
      logger.error('更新用户失败:', error);
      throw new ApiError('更新用户失败', 500);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new ApiError('当前密码错误', 400);
    }

    // 新密码哈希
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      logger.info(`用户密码已更改: ${user.username}`);
    } catch (error) {
      logger.error('更改密码失败:', error);
      throw new ApiError('更改密码失败', 500);
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        funnels: true,
        aiSessions: true,
        _count: {
          select: {
            funnels: true,
            aiSessions: true
          }
        }
      }
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    // 计算节点总数
    const totalNodes = await this.prisma.node.count({
      where: {
        funnel: {
          userId: userId
        }
      }
    });

    // 计算账户年龄
    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalFunnels: user._count.funnels,
      totalNodes: totalNodes,
      totalAiSessions: user._count.aiSessions,
      lastLoginAt: user.lastLoginAt,
      accountAge
    };
  }

  async getUserActivity(userId: string, options: {
    page: number;
    limit: number;
    type: string;
  }): Promise<any> {
    // 这里应该实现活动历史查询
    // 由于需要复杂的查询，暂时返回空数组
    return {
      activities: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('用户不存在', 404);
    }

    try {
      // 由于设置了级联删除，删除用户会自动删除相关数据
      await this.prisma.user.delete({
        where: { id: userId }
      });

      logger.info(`用户已删除: ${user.username}`);
    } catch (error) {
      logger.error('删除用户失败:', error);
      throw new ApiError('删除用户失败', 500);
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false }
      });

      logger.info(`用户已停用: ${userId}`);
    } catch (error) {
      logger.error('停用用户失败:', error);
      throw new ApiError('停用用户失败', 500);
    }
  }

  // 管理员功能
  async getUsers(options: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<any> {
    const { page, limit, search, isActive } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          isActive: true
        }
      }),
      this.prisma.user.count({ where })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };
  }

  async getUserById(userId: string): Promise<UserDetails> {
    return this.getCurrentUser(userId);
  }
}