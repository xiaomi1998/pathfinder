import express from 'express';
import { DashboardService } from '@/services/DashboardService';
import { authMiddleware } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/ApiError';

const router = express.Router();
const dashboardService = new DashboardService();

// 获取漏斗概览数据
router.get('/funnel/:funnelId/metrics', authMiddleware, async (req, res, next) => {
  try {
    const { funnelId } = req.params;
    const userId = req.user!.id;

    const metrics = await dashboardService.getFunnelMetrics(funnelId, userId);
    
    logger.info(`路由返回的漏斗指标数据:`, metrics);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('获取漏斗概览数据失败:', error);
    next(error);
  }
});

// 获取转化趋势数据
router.get('/funnel/:funnelId/trends', authMiddleware, async (req, res, next) => {
  try {
    const { funnelId } = req.params;
    const { period } = req.query;
    const userId = req.user!.id;

    if (period && typeof period !== 'string') {
      throw new ApiError('Invalid period parameter', 400);
    }

    const trendData = await dashboardService.getTrendData(funnelId, userId, period as string | undefined);

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    logger.error('获取转化趋势数据失败:', error);
    next(error);
  }
});

// 获取最近活动
router.get('/recent-activities', authMiddleware, async (req, res, next) => {
  try {
    const { limit = '10' } = req.query;
    const userId = req.user!.id;

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
      throw new ApiError('Invalid limit parameter', 400);
    }

    const activities = await dashboardService.getRecentActivities(userId, limitNum);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('获取最近活动失败:', error);
    next(error);
  }
});

// 获取数据录入状态
router.get('/data-entry-status', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const dataStatus = await dashboardService.getDataEntryStatus(userId);

    res.json({
      success: true,
      data: dataStatus
    });
  } catch (error) {
    logger.error('获取数据录入状态失败:', error);
    next(error);
  }
});

// 获取仪表盘概览统计
router.get('/overview', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const stats = await dashboardService.getOverviewStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取仪表盘概览统计失败:', error);
    next(error);
  }
});

export default router;