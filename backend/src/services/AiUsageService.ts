import { PrismaClient, AiUsageType } from '@prisma/client';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

export class AiUsageService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Track AI usage for a user
   */
  async trackUsage(
    userId: string,
    sessionId: string | null,
    usageType: AiUsageType,
    requestCount: number = 1,
    tokenCount?: number,
    cost?: number
  ): Promise<void> {
    try {
      const usageDate = new Date();
      const dateOnly = new Date(usageDate.getFullYear(), usageDate.getMonth(), usageDate.getDate());

      // Check if user has usage limits
      await this.checkUsageLimit(userId);

      // Record usage
      await this.prisma.userAiUsage.create({
        data: {
          userId,
          sessionId,
          usageType,
          requestCount,
          tokenCount,
          cost,
          usageDate: dateOnly
        }
      });

      // Update user's current usage counters
      await this.updateUsageCounters(userId, requestCount, dateOnly);

      logger.info(`AI用量记录: 用户=${userId}, 类型=${usageType}, 请求数=${requestCount}`);
    } catch (error) {
      logger.error('记录AI用量失败:', error);
      // Don't throw error for usage tracking failure to avoid disrupting main functionality
    }
  }

  /**
   * Check if user has exceeded usage limits
   */
  async checkUsageLimit(userId: string): Promise<void> {
    try {
      // Get or create user AI limits
      const userLimit = await this.prisma.userAiLimit.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          dailyLimit: 100,
          monthlyLimit: 3000
        }
      });

      if (!userLimit.isActive) {
        throw new ApiError('AI功能已被停用', 403);
      }

      // Check daily limit
      if (userLimit.currentDaily >= userLimit.dailyLimit) {
        throw new ApiError('已达到每日AI使用限制', 429);
      }

      // Check monthly limit
      if (userLimit.currentMonthly >= userLimit.monthlyLimit) {
        throw new ApiError('已达到每月AI使用限制', 429);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('检查AI使用限制失败:', error);
      // Allow usage if limit check fails
    }
  }

  /**
   * Update user's usage counters
   */
  private async updateUsageCounters(userId: string, requestCount: number, usageDate: Date): Promise<void> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const userLimit = await this.prisma.userAiLimit.findUnique({
        where: { userId }
      });

      if (!userLimit) return;

      let resetDaily = false;
      let resetMonthly = false;

      // Check if daily counter needs reset
      if (userLimit.lastResetDaily < today) {
        resetDaily = true;
      }

      // Check if monthly counter needs reset
      if (userLimit.lastResetMonthly < monthStart) {
        resetMonthly = true;
      }

      // Update counters
      await this.prisma.userAiLimit.update({
        where: { userId },
        data: {
          currentDaily: resetDaily ? requestCount : userLimit.currentDaily + requestCount,
          currentMonthly: resetMonthly ? requestCount : userLimit.currentMonthly + requestCount,
          lastResetDaily: resetDaily ? today : userLimit.lastResetDaily,
          lastResetMonthly: resetMonthly ? monthStart : userLimit.lastResetMonthly
        }
      });
    } catch (error) {
      logger.error('更新使用计数器失败:', error);
    }
  }

  /**
   * Reset daily usage counters (run daily via cron job)
   */
  async resetDailyUsage(): Promise<void> {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      await this.prisma.userAiLimit.updateMany({
        where: {
          lastResetDaily: { lt: todayStart }
        },
        data: {
          currentDaily: 0,
          lastResetDaily: todayStart
        }
      });

      logger.info('每日AI用量计数器重置完成');
    } catch (error) {
      logger.error('重置每日用量计数器失败:', error);
    }
  }

  /**
   * Reset monthly usage counters (run monthly via cron job)
   */
  async resetMonthlyUsage(): Promise<void> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      await this.prisma.userAiLimit.updateMany({
        where: {
          lastResetMonthly: { lt: monthStart }
        },
        data: {
          currentMonthly: 0,
          lastResetMonthly: monthStart
        }
      });

      logger.info('每月AI用量计数器重置完成');
    } catch (error) {
      logger.error('重置每月用量计数器失败:', error);
    }
  }

  /**
   * Get user's current usage status
   */
  async getUserUsageStatus(userId: string): Promise<{
    dailyLimit: number;
    monthlyLimit: number;
    currentDaily: number;
    currentMonthly: number;
    remainingDaily: number;
    remainingMonthly: number;
    isActive: boolean;
  }> {
    try {
      const userLimit = await this.prisma.userAiLimit.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          dailyLimit: 100,
          monthlyLimit: 3000
        }
      });

      // Ensure counters are up to date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let currentDaily = userLimit.currentDaily;
      let currentMonthly = userLimit.currentMonthly;

      if (userLimit.lastResetDaily < today) {
        currentDaily = 0;
      }

      if (userLimit.lastResetMonthly < monthStart) {
        currentMonthly = 0;
      }

      return {
        dailyLimit: userLimit.dailyLimit,
        monthlyLimit: userLimit.monthlyLimit,
        currentDaily,
        currentMonthly,
        remainingDaily: Math.max(0, userLimit.dailyLimit - currentDaily),
        remainingMonthly: Math.max(0, userLimit.monthlyLimit - currentMonthly),
        isActive: userLimit.isActive
      };
    } catch (error) {
      logger.error('获取用户使用状态失败:', error);
      throw new ApiError('获取使用状态失败', 500);
    }
  }

  /**
   * Batch track usage for multiple requests
   */
  async batchTrackUsage(usageRecords: Array<{
    userId: string;
    sessionId: string | null;
    usageType: AiUsageType;
    requestCount: number;
    tokenCount?: number;
    cost?: number;
  }>): Promise<void> {
    try {
      const usageDate = new Date();
      const dateOnly = new Date(usageDate.getFullYear(), usageDate.getMonth(), usageDate.getDate());

      // Create usage records
      const createData = usageRecords.map(record => ({
        userId: record.userId,
        sessionId: record.sessionId,
        usageType: record.usageType,
        requestCount: record.requestCount,
        tokenCount: record.tokenCount,
        cost: record.cost,
        usageDate: dateOnly
      }));

      await this.prisma.userAiUsage.createMany({
        data: createData
      });

      // Update usage counters for each user
      const userUsageCounts = usageRecords.reduce((acc, record) => {
        acc[record.userId] = (acc[record.userId] || 0) + record.requestCount;
        return acc;
      }, {} as Record<string, number>);

      for (const [userId, count] of Object.entries(userUsageCounts)) {
        await this.updateUsageCounters(userId, count, dateOnly);
      }

      logger.info(`批量记录AI用量: ${usageRecords.length}条记录`);
    } catch (error) {
      logger.error('批量记录AI用量失败:', error);
    }
  }
}