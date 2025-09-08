import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaClient, AdminRole, AiUsageType } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

// Admin-specific types
export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: AdminUserResponse;
  access_token: string;
  expires_in: number;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AdminJwtPayload {
  adminId: string;
  username: string;
  email: string;
  role: AdminRole;
  type: 'admin';
}

export interface UserWithAiUsage {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  aiLimit?: {
    dailyLimit: number;
    monthlyLimit: number;
    currentDaily: number;
    currentMonthly: number;
  } | null;
  aiUsageStats: {
    todayUsage: number;
    weekUsage: number;
    monthUsage: number;
    totalUsage: number;
  };
}

export interface UpdateUserLimitsRequest {
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface UsageStatsResponse {
  totalUsers: number;
  activeUsers: number;
  totalAiRequests: number;
  todayAiRequests: number;
  weekAiRequests: number;
  monthAiRequests: number;
  topUsers: {
    id: string;
    username: string;
    email: string;
    totalUsage: number;
    monthUsage: number;
  }[];
  usageByType: {
    type: AiUsageType;
    count: number;
    percentage: number;
  }[];
}

// 基准数据管理接口
export interface BenchmarkDataInput {
  industry: string;
  region?: string;
  companySize?: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number;
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BenchmarkDataResponse {
  id: string;
  industry: string;
  region?: string;
  companySize?: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number;
  sampleSize: number;
  periodStart: Date;
  periodEnd: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkDataFilter {
  industry?: string;
  region?: string;
  companySize?: string;
  metricType?: string;
  metricName?: string;
  percentile?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface BenchmarkBatchImportResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: {
    row: number;
    error: string;
  }[];
}

export class AdminService {
  private prisma: PrismaClient;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.jwtExpiresIn = process.env.ADMIN_JWT_EXPIRES_IN || '24h';
  }

  /**
   * Admin login authentication
   */
  async login(data: AdminLoginInput): Promise<AdminLoginResponse> {
    const { email, password } = data;

    // Find admin user
    const admin = await this.prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin) {
      throw new ApiError('邮箱或密码错误', 401);
    }

    // Check if account is active
    if (!admin.isActive) {
      throw new ApiError('管理员账户已被停用', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError('邮箱或密码错误', 401);
    }

    try {
      // Update last login time
      const updatedAdmin = await this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() }
      });

      logger.info(`管理员登录: ${admin.username} (${email})`);

      // Generate JWT
      const token = this.generateToken({
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        type: 'admin'
      });

      const adminResponse: AdminUserResponse = {
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        email: updatedAdmin.email,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
        createdAt: updatedAdmin.createdAt,
        lastLoginAt: updatedAdmin.lastLoginAt
      };

      return {
        admin: adminResponse,
        access_token: token,
        expires_in: this.getTokenExpiresIn()
      };
    } catch (error) {
      logger.error('管理员登录失败:', error);
      throw new ApiError('登录失败，请稍后重试', 500);
    }
  }

  /**
   * Verify admin token
   */
  async verifyToken(token: string): Promise<AdminUserResponse> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as AdminJwtPayload;
      
      if (payload.type !== 'admin') {
        throw new ApiError('无效的管理员令牌', 401);
      }
      
      // Get latest admin info from database
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: payload.adminId }
      });

      if (!admin) {
        throw new ApiError('管理员不存在', 401);
      }

      if (!admin.isActive) {
        throw new ApiError('管理员账户已被停用', 403);
      }

      const adminResponse: AdminUserResponse = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt
      };

      return adminResponse;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('令牌无效', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('令牌已过期', 401);
      }
      throw error;
    }
  }

  /**
   * Get users with AI usage information
   */
  async getUsersWithAiUsage(
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortBy: 'username' | 'email' | 'createdAt' | 'lastLoginAt' | 'aiUsage' = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ users: UserWithAiUsage[]; total: number; page: number; limit: number }> {
    try {
      // Build where clause for search
      const whereClause = search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } }
            ]
          }
        : {};

      // Get total count
      const total = await this.prisma.user.count({ where: whereClause });

      // Get users with AI usage data
      const users = await this.prisma.user.findMany({
        where: whereClause,
        include: {
          aiLimit: true,
          aiUsage: {
            select: {
              usageDate: true,
              requestCount: true,
              usageType: true
            }
          }
        },
        orderBy: this.buildOrderBy(sortBy),
        skip: (page - 1) * limit,
        take: limit
      });

      // Calculate usage statistics for each user
      const usersWithUsage: UserWithAiUsage[] = await Promise.all(
        users.map(async (user) => {
          const stats = await this.calculateUserUsageStats(user.id);
          
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            aiLimit: user.aiLimit ? {
              dailyLimit: user.aiLimit.dailyLimit,
              monthlyLimit: user.aiLimit.monthlyLimit,
              currentDaily: user.aiLimit.currentDaily,
              currentMonthly: user.aiLimit.currentMonthly
            } : null,
            aiUsageStats: stats
          };
        })
      );

      // Sort by AI usage if requested
      if (sortBy === 'aiUsage') {
        usersWithUsage.sort((a, b) => {
          const aUsage = a.aiUsageStats.totalUsage;
          const bUsage = b.aiUsageStats.totalUsage;
          return sortOrder === 'desc' ? bUsage - aUsage : aUsage - bUsage;
        });
      }

      return {
        users: usersWithUsage,
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('获取用户AI使用情况失败:', error);
      throw new ApiError('获取用户列表失败', 500);
    }
  }

  /**
   * Update user AI usage limits
   */
  async updateUserLimits(
    userId: string,
    limits: UpdateUserLimitsRequest,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { aiLimit: true }
      });

      if (!user) {
        throw new ApiError('用户不存在', 404);
      }

      const oldLimits = user.aiLimit;

      // Update or create AI limits
      const newLimits = await this.prisma.userAiLimit.upsert({
        where: { userId },
        update: {
          dailyLimit: limits.dailyLimit ?? undefined,
          monthlyLimit: limits.monthlyLimit ?? undefined,
          updatedAt: new Date()
        },
        create: {
          userId,
          dailyLimit: limits.dailyLimit ?? 100,
          monthlyLimit: limits.monthlyLimit ?? 3000
        }
      });

      // Log admin operation
      await this.logAdminOperation({
        adminId,
        targetType: 'user_limits',
        targetId: userId,
        operation: 'update_ai_limits',
        oldValues: oldLimits,
        newValues: newLimits,
        result: 'success',
        ipAddress,
        userAgent
      });

      logger.info(`管理员 ${adminId} 更新了用户 ${userId} 的AI使用限制`);
    } catch (error) {
      // Log failed operation
      await this.logAdminOperation({
        adminId,
        targetType: 'user_limits',
        targetId: userId,
        operation: 'update_ai_limits',
        oldValues: null,
        newValues: limits,
        result: 'failed',
        ipAddress,
        userAgent
      });

      logger.error('更新用户AI使用限制失败:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新用户限制失败', 500);
    }
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(): Promise<UsageStatsResponse> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get basic user statistics
      const totalUsers = await this.prisma.user.count();
      const activeUsers = await this.prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      // Get AI usage statistics
      const totalAiRequests = await this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true }
      });

      const todayAiRequests = await this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { usageDate: { gte: todayStart } }
      });

      const weekAiRequests = await this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { usageDate: { gte: weekStart } }
      });

      const monthAiRequests = await this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { usageDate: { gte: monthStart } }
      });

      // Get top users by usage
      const topUsersRaw = await this.prisma.userAiUsage.groupBy({
        by: ['userId'],
        _sum: { requestCount: true },
        orderBy: { _sum: { requestCount: 'desc' } },
        take: 10
      });

      const topUsers = await Promise.all(
        topUsersRaw.map(async (item) => {
          const user = await this.prisma.user.findUnique({
            where: { id: item.userId },
            select: { username: true, email: true }
          });
          
          const monthUsage = await this.prisma.userAiUsage.aggregate({
            _sum: { requestCount: true },
            where: {
              userId: item.userId,
              usageDate: { gte: monthStart }
            }
          });

          return {
            id: item.userId,
            username: user?.username || 'Unknown',
            email: user?.email || 'Unknown',
            totalUsage: item._sum.requestCount || 0,
            monthUsage: monthUsage._sum.requestCount || 0
          };
        })
      );

      // Get usage by type
      const usageByTypeRaw = await this.prisma.userAiUsage.groupBy({
        by: ['usageType'],
        _sum: { requestCount: true }
      });

      const totalRequests = totalAiRequests._sum.requestCount || 1; // Avoid division by zero
      const usageByType = usageByTypeRaw.map((item) => ({
        type: item.usageType,
        count: item._sum.requestCount || 0,
        percentage: Math.round(((item._sum.requestCount || 0) / totalRequests) * 100)
      }));

      return {
        totalUsers,
        activeUsers,
        totalAiRequests: totalAiRequests._sum.requestCount || 0,
        todayAiRequests: todayAiRequests._sum.requestCount || 0,
        weekAiRequests: weekAiRequests._sum.requestCount || 0,
        monthAiRequests: monthAiRequests._sum.requestCount || 0,
        topUsers,
        usageByType
      };
    } catch (error) {
      logger.error('获取AI使用统计失败:', error);
      throw new ApiError('获取统计数据失败', 500);
    }
  }

  /**
   * Calculate user usage statistics
   */
  private async calculateUserUsageStats(userId: string): Promise<{
    todayUsage: number;
    weekUsage: number;
    monthUsage: number;
    totalUsage: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayUsage, weekUsage, monthUsage, totalUsage] = await Promise.all([
      this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { userId, usageDate: { gte: todayStart } }
      }),
      this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { userId, usageDate: { gte: weekStart } }
      }),
      this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { userId, usageDate: { gte: monthStart } }
      }),
      this.prisma.userAiUsage.aggregate({
        _sum: { requestCount: true },
        where: { userId }
      })
    ]);

    return {
      todayUsage: todayUsage._sum.requestCount || 0,
      weekUsage: weekUsage._sum.requestCount || 0,
      monthUsage: monthUsage._sum.requestCount || 0,
      totalUsage: totalUsage._sum.requestCount || 0
    };
  }

  /**
   * Build order by clause for user queries
   */
  private buildOrderBy(sortBy: string) {
    switch (sortBy) {
      case 'username':
        return { username: 'asc' as const };
      case 'email':
        return { email: 'asc' as const };
      case 'lastLoginAt':
        return { lastLoginAt: 'desc' as const };
      case 'createdAt':
      default:
        return { createdAt: 'desc' as const };
    }
  }

  /**
   * Log admin operation
   */
  private async logAdminOperation({
    adminId,
    targetType,
    targetId,
    operation,
    oldValues,
    newValues,
    result,
    ipAddress,
    userAgent
  }: {
    adminId: string;
    targetType: string;
    targetId?: string;
    operation: string;
    oldValues: any;
    newValues: any;
    result: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.prisma.adminOperationLog.create({
        data: {
          adminId,
          targetType,
          targetId,
          operation,
          oldValues,
          newValues,
          result,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      logger.error('记录管理员操作日志失败:', error);
      // Don't throw error for logging failure
    }
  }

  /**
   * Generate JWT token for admin
   */
  private generateToken(payload: AdminJwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Get token expiration time in seconds
   */
  private getTokenExpiresIn(): number {
    const timeUnit = this.jwtExpiresIn.slice(-1);
    const timeValue = parseInt(this.jwtExpiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 3600;
      case 'd': return timeValue * 86400;
      default: return 24 * 3600; // Default 24 hours
    }
  }

  // ===================== 基准数据管理方法 =====================

  /**
   * 获取基准数据列表
   */
  async getBenchmarkData(
    page: number = 1,
    limit: number = 20,
    filters?: BenchmarkDataFilter
  ): Promise<{ data: BenchmarkDataResponse[]; total: number; page: number; limit: number }> {
    try {
      // 构建查询条件
      const whereClause: any = {};
      
      if (filters?.industry) {
        whereClause.industry = { contains: filters.industry, mode: 'insensitive' };
      }
      if (filters?.region) {
        whereClause.region = { contains: filters.region, mode: 'insensitive' };
      }
      if (filters?.companySize) {
        whereClause.companySize = { contains: filters.companySize, mode: 'insensitive' };
      }
      if (filters?.metricType) {
        whereClause.metricType = { contains: filters.metricType, mode: 'insensitive' };
      }
      if (filters?.metricName) {
        whereClause.metricName = { contains: filters.metricName, mode: 'insensitive' };
      }
      if (filters?.percentile) {
        whereClause.percentile = filters.percentile;
      }
      if (filters?.dateFrom || filters?.dateTo) {
        whereClause.periodStart = {};
        if (filters.dateFrom) whereClause.periodStart.gte = filters.dateFrom;
        if (filters.dateTo) whereClause.periodStart.lte = filters.dateTo;
      }

      // 获取总数
      const total = await this.prisma.benchmarkData.count({ where: whereClause });

      // 获取数据
      const benchmarkRecords = await this.prisma.benchmarkData.findMany({
        where: whereClause,
        orderBy: [
          { industry: 'asc' },
          { metricType: 'asc' },
          { metricName: 'asc' },
          { percentile: 'asc' },
          { periodStart: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit
      });

      const data: BenchmarkDataResponse[] = benchmarkRecords.map(record => ({
        id: record.id,
        industry: record.industry,
        region: record.companySize, // 注意：schema中没有region字段，这里使用companySize
        companySize: record.companySize,
        metricType: record.metricType,
        metricName: record.metricName,
        value: Number(record.value),
        percentile: record.percentile,
        sampleSize: record.sampleSize,
        periodStart: record.periodStart,
        periodEnd: record.periodEnd,
        organizationId: record.organizationId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }));

      return { data, total, page, limit };

    } catch (error) {
      logger.error('获取基准数据失败:', error);
      throw new ApiError('获取基准数据失败', 500);
    }
  }

  /**
   * 创建基准数据
   */
  async createBenchmarkData(
    data: BenchmarkDataInput,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BenchmarkDataResponse> {
    try {
      // 验证数据范围
      this.validateBenchmarkDataInput(data);

      // 检查是否已存在相同的基准数据
      const existingRecord = await this.prisma.benchmarkData.findFirst({
        where: {
          industry: data.industry,
          metricType: data.metricType,
          metricName: data.metricName,
          percentile: data.percentile,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd
        }
      });

      if (existingRecord) {
        throw new ApiError('该基准数据记录已存在', 409);
      }

      // 创建记录（注意：使用第一个组织ID作为默认组织）
      const firstOrg = await this.prisma.organization.findFirst();
      if (!firstOrg) {
        throw new ApiError('系统中没有可用的组织', 500);
      }

      const benchmarkRecord = await this.prisma.benchmarkData.create({
        data: {
          industry: data.industry,
          metricType: data.metricType,
          metricName: data.metricName,
          value: data.value,
          percentile: data.percentile,
          sampleSize: data.sampleSize,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          organizationId: firstOrg.id
        }
      });

      // 记录操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        targetId: benchmarkRecord.id,
        operation: 'create_benchmark',
        oldValues: null,
        newValues: data,
        result: 'success',
        ipAddress,
        userAgent
      });

      logger.info(`管理员 ${adminId} 创建了基准数据: ${data.industry}-${data.metricName}`);

      return {
        id: benchmarkRecord.id,
        industry: benchmarkRecord.industry,
        region: benchmarkRecord.companySize,
        companySize: benchmarkRecord.companySize,
        metricType: benchmarkRecord.metricType,
        metricName: benchmarkRecord.metricName,
        value: Number(benchmarkRecord.value),
        percentile: benchmarkRecord.percentile,
        sampleSize: benchmarkRecord.sampleSize,
        periodStart: benchmarkRecord.periodStart,
        periodEnd: benchmarkRecord.periodEnd,
        organizationId: benchmarkRecord.organizationId,
        createdAt: benchmarkRecord.createdAt,
        updatedAt: benchmarkRecord.updatedAt
      };

    } catch (error) {
      // 记录失败的操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        operation: 'create_benchmark',
        oldValues: null,
        newValues: data,
        result: 'failed',
        ipAddress,
        userAgent
      });

      logger.error('创建基准数据失败:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('创建基准数据失败', 500);
    }
  }

  /**
   * 更新基准数据
   */
  async updateBenchmarkData(
    id: string,
    data: Partial<BenchmarkDataInput>,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BenchmarkDataResponse> {
    try {
      // 检查记录是否存在
      const existingRecord = await this.prisma.benchmarkData.findUnique({
        where: { id }
      });

      if (!existingRecord) {
        throw new ApiError('基准数据记录不存在', 404);
      }

      // 验证更新数据
      if (data.value !== undefined || data.percentile !== undefined || data.sampleSize !== undefined) {
        const validateData = {
          ...existingRecord,
          ...data,
          value: data.value ?? Number(existingRecord.value),
          percentile: data.percentile ?? existingRecord.percentile,
          sampleSize: data.sampleSize ?? existingRecord.sampleSize,
          periodStart: data.periodStart ?? existingRecord.periodStart,
          periodEnd: data.periodEnd ?? existingRecord.periodEnd
        };
        this.validateBenchmarkDataInput(validateData as BenchmarkDataInput);
      }

      const updatedRecord = await this.prisma.benchmarkData.update({
        where: { id },
        data: {
          ...(data.industry && { industry: data.industry }),
          ...(data.metricType && { metricType: data.metricType }),
          ...(data.metricName && { metricName: data.metricName }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.percentile !== undefined && { percentile: data.percentile }),
          ...(data.sampleSize !== undefined && { sampleSize: data.sampleSize }),
          ...(data.periodStart && { periodStart: data.periodStart }),
          ...(data.periodEnd && { periodEnd: data.periodEnd }),
          updatedAt: new Date()
        }
      });

      // 记录操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        targetId: id,
        operation: 'update_benchmark',
        oldValues: existingRecord,
        newValues: data,
        result: 'success',
        ipAddress,
        userAgent
      });

      logger.info(`管理员 ${adminId} 更新了基准数据: ${id}`);

      return {
        id: updatedRecord.id,
        industry: updatedRecord.industry,
        region: updatedRecord.companySize,
        companySize: updatedRecord.companySize,
        metricType: updatedRecord.metricType,
        metricName: updatedRecord.metricName,
        value: Number(updatedRecord.value),
        percentile: updatedRecord.percentile,
        sampleSize: updatedRecord.sampleSize,
        periodStart: updatedRecord.periodStart,
        periodEnd: updatedRecord.periodEnd,
        organizationId: updatedRecord.organizationId,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt
      };

    } catch (error) {
      // 记录失败的操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        targetId: id,
        operation: 'update_benchmark',
        oldValues: null,
        newValues: data,
        result: 'failed',
        ipAddress,
        userAgent
      });

      logger.error('更新基准数据失败:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('更新基准数据失败', 500);
    }
  }

  /**
   * 删除基准数据
   */
  async deleteBenchmarkData(
    id: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // 检查记录是否存在
      const existingRecord = await this.prisma.benchmarkData.findUnique({
        where: { id }
      });

      if (!existingRecord) {
        throw new ApiError('基准数据记录不存在', 404);
      }

      await this.prisma.benchmarkData.delete({
        where: { id }
      });

      // 记录操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        targetId: id,
        operation: 'delete_benchmark',
        oldValues: existingRecord,
        newValues: null,
        result: 'success',
        ipAddress,
        userAgent
      });

      logger.info(`管理员 ${adminId} 删除了基准数据: ${id}`);

    } catch (error) {
      // 记录失败的操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data',
        targetId: id,
        operation: 'delete_benchmark',
        oldValues: null,
        newValues: null,
        result: 'failed',
        ipAddress,
        userAgent
      });

      logger.error('删除基准数据失败:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('删除基准数据失败', 500);
    }
  }

  /**
   * 批量导入基准数据
   */
  async batchImportBenchmarkData(
    records: BenchmarkDataInput[],
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<BenchmarkBatchImportResult> {
    try {
      const totalRecords = records.length;
      let successCount = 0;
      let failureCount = 0;
      const errors: { row: number; error: string }[] = [];

      logger.info(`开始批量导入 ${totalRecords} 条基准数据`);

      // 获取默认组织
      const firstOrg = await this.prisma.organization.findFirst();
      if (!firstOrg) {
        throw new ApiError('系统中没有可用的组织', 500);
      }

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const rowNumber = i + 1;

        try {
          // 验证数据
          this.validateBenchmarkDataInput(record);

          // 检查是否已存在
          const existingRecord = await this.prisma.benchmarkData.findFirst({
            where: {
              industry: record.industry,
              metricType: record.metricType,
              metricName: record.metricName,
              percentile: record.percentile,
              periodStart: record.periodStart,
              periodEnd: record.periodEnd
            }
          });

          if (existingRecord) {
            // 更新现有记录
            await this.prisma.benchmarkData.update({
              where: { id: existingRecord.id },
              data: {
                value: record.value,
                sampleSize: record.sampleSize,
                updatedAt: new Date()
              }
            });
          } else {
            // 创建新记录
            await this.prisma.benchmarkData.create({
              data: {
                ...record,
                organizationId: firstOrg.id
              }
            });
          }

          successCount++;
        } catch (error: any) {
          failureCount++;
          errors.push({
            row: rowNumber,
            error: error.message || '未知错误'
          });
          logger.warn(`第 ${rowNumber} 行数据导入失败:`, error.message);
        }
      }

      // 记录批量操作日志
      await this.logAdminOperation({
        adminId,
        targetType: 'benchmark_data_batch',
        operation: 'batch_import_benchmark',
        oldValues: null,
        newValues: {
          totalRecords,
          successCount,
          failureCount
        },
        result: failureCount === 0 ? 'success' : 'partial_success',
        ipAddress,
        userAgent
      });

      logger.info(
        `批量导入完成: 总数=${totalRecords}, 成功=${successCount}, 失败=${failureCount}`
      );

      return {
        totalRecords,
        successCount,
        failureCount,
        errors
      };

    } catch (error) {
      logger.error('批量导入基准数据失败:', error);
      throw new ApiError('批量导入失败', 500);
    }
  }

  /**
   * 验证基准数据输入
   */
  private validateBenchmarkDataInput(data: BenchmarkDataInput): void {
    // 验证转化率范围 (0-100%)
    if (data.value < 0 || data.value > 100) {
      throw new ApiError('转化率必须在0-100%之间', 400);
    }

    // 验证百分位数
    if (![10, 25, 50, 75, 90].includes(data.percentile)) {
      throw new ApiError('百分位数必须是10, 25, 50, 75, 90之一', 400);
    }

    // 验证样本量
    if (data.sampleSize < 1) {
      throw new ApiError('样本量必须大于0', 400);
    }

    // 验证时间期间
    if (data.periodStart >= data.periodEnd) {
      throw new ApiError('开始时间必须早于结束时间', 400);
    }

    // 验证必填字段
    if (!data.industry || !data.metricType || !data.metricName) {
      throw new ApiError('行业、指标类型和指标名称不能为空', 400);
    }
  }

  /**
   * 获取基准数据统计信息
   */
  async getBenchmarkStats(): Promise<{
    totalRecords: number;
    industriesCount: number;
    metricsCount: number;
    lastUpdated: Date | null;
    dataQuality: {
      completeness: number;
      recentness: number;
      sampleSizeAverage: number;
    };
  }> {
    try {
      const totalRecords = await this.prisma.benchmarkData.count();
      
      const industriesCount = await this.prisma.benchmarkData.groupBy({
        by: ['industry'],
        _count: true
      }).then(groups => groups.length);

      const metricsCount = await this.prisma.benchmarkData.groupBy({
        by: ['metricName'],
        _count: true
      }).then(groups => groups.length);

      const latestRecord = await this.prisma.benchmarkData.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });

      const avgSampleSize = await this.prisma.benchmarkData.aggregate({
        _avg: { sampleSize: true }
      });

      // 计算数据质量指标
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const recentRecords = await this.prisma.benchmarkData.count({
        where: {
          updatedAt: { gte: oneMonthAgo }
        }
      });

      const completeness = totalRecords > 0 ? Math.round((industriesCount * metricsCount * 5) / totalRecords * 100) : 0; // 假设完整数据应该是行业数*指标数*5个百分位数
      const recentness = totalRecords > 0 ? Math.round(recentRecords / totalRecords * 100) : 0;
      const sampleSizeAverage = avgSampleSize._avg.sampleSize || 0;

      return {
        totalRecords,
        industriesCount,
        metricsCount,
        lastUpdated: latestRecord?.updatedAt || null,
        dataQuality: {
          completeness: Math.min(completeness, 100),
          recentness,
          sampleSizeAverage: Math.round(sampleSizeAverage)
        }
      };

    } catch (error) {
      logger.error('获取基准数据统计失败:', error);
      throw new ApiError('获取统计信息失败', 500);
    }
  }
}