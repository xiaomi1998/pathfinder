import { Router } from 'express';
import threeStepAIAnalysisService from '@/services/ThreeStepAIAnalysisService';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * 第一步：录入数据后自动生成关键洞察（免费）
 * POST /api/ai-analysis/step1/:funnelId
 */
router.post('/step1/:funnelId', async (req, res, next) => {
  try {
    const { funnelId } = req.params;
    const { datasetPeriodStart } = req.body;
    const userId = req.user!.id;

    logger.info(`Starting Step 1 AI analysis for funnel ${funnelId}`);

    let result;
    if (datasetPeriodStart) {
      // 如果指定了数据期间，使用期间分析
      const periodStart = new Date(datasetPeriodStart);
      logger.info(`使用指定数据期间: ${periodStart.toISOString().split('T')[0]}`);
      result = await threeStepAIAnalysisService.generateKeyInsightsForPeriod(userId, funnelId, periodStart);
    } else {
      // 如果没有指定期间，使用最新数据期间
      logger.info(`使用最新数据期间分析`);
      result = await threeStepAIAnalysisService.generateKeyInsightsForLatestPeriod(userId, funnelId);
    }

    res.json({
      success: true,
      data: result,
      message: '关键洞察生成成功'
    });
  } catch (error: any) {
    logger.error('Step 1 AI analysis failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'AI分析失败'
    });
  }
});

/**
 * 第二步：生成策略选项（付费）
 * POST /api/ai-analysis/step2/:analysisId
 */
router.post('/step2/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { funnelId } = req.body;
    const userId = req.user!.id;

    logger.info(`Starting Step 2 AI analysis for analysis ${analysisId}`);

    const result = await threeStepAIAnalysisService.generateStrategyOptions(
      userId,
      funnelId,
      analysisId
    );

    res.json({
      success: true,
      data: result,
      message: '策略选项生成成功'
    });
  } catch (error: any) {
    logger.error('Step 2 AI analysis failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'AI分析失败'
    });
  }
});

/**
 * 第三步：生成完整个性化报告（付费）
 * POST /api/ai-analysis/step3/:analysisId
 */
router.post('/step3/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const { funnelId, selectedStrategy } = req.body;
    const userId = req.user!.id;

    if (!selectedStrategy || !['stable', 'aggressive'].includes(selectedStrategy)) {
      return res.status(400).json({
        success: false,
        error: '请选择有效的策略类型'
      });
    }

    logger.info(`Starting Step 3 AI analysis for analysis ${analysisId} with strategy ${selectedStrategy}`);

    const result = await threeStepAIAnalysisService.generateCompleteReport(
      userId,
      funnelId,
      analysisId,
      selectedStrategy
    );

    res.json({
      success: true,
      data: result,
      message: '完整报告生成成功'
    });
  } catch (error: any) {
    logger.error('Step 3 AI analysis failed:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'AI分析失败'
    });
  }
});

/**
 * 获取漏斗的分析状态
 * GET /api/ai-analysis/status/:funnelId
 */
router.get('/status/:funnelId', async (req, res, next) => {
  try {
    const { funnelId } = req.params;
    const userId = req.user!.id;
    
    const status = await threeStepAIAnalysisService.getFunnelAnalysisStatus(userId, funnelId);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('Get analysis status failed:', error);
    res.status(500).json({
      success: false,
      error: '获取分析状态失败'
    });
  }
});

/**
 * 获取特定数据集周期的分析状态
 * GET /api/ai-analysis/dataset-status/:funnelId?periodStart=2025-09-12
 */
router.get('/dataset-status/:funnelId', async (req, res, next) => {
  try {
    const { funnelId } = req.params;
    const { periodStart } = req.query;
    const userId = req.user!.id;
    
    if (!periodStart) {
      return res.status(400).json({
        success: false,
        error: '请提供数据集周期开始时间'
      });
    }

    const datasetPeriodStart = new Date(periodStart as string);
    const status = await threeStepAIAnalysisService.getFunnelDatasetAnalysisStatus(userId, funnelId, datasetPeriodStart);

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    logger.error('Get dataset analysis status failed:', error);
    res.status(500).json({
      success: false,
      error: '获取数据集分析状态失败'
    });
  }
});

/**
 * 获取用户剩余分析次数
 * GET /api/ai-analysis/quota
 */
router.get('/quota', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const quota = await threeStepAIAnalysisService.getUserAnalysisQuota(userId);

    res.json({
      success: true,
      data: {
        remainingQuota: quota,
        totalQuota: 10 // 注册时的默认配额
      }
    });
  } catch (error: any) {
    logger.error('Get quota failed:', error);
    res.status(500).json({
      success: false,
      error: '获取分析次数失败'
    });
  }
});

/**
 * 获取用户的所有分析报告
 * GET /api/ai-analysis/reports
 */
router.get('/reports', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const reports = await threeStepAIAnalysisService.getUserReports(userId);

    logger.info(`📤 API响应报告数量: ${reports.length}`);
    reports.forEach((report, index) => {
      logger.info(`📋 报告 ${index + 1}: ID=${report.id}, datasetPeriodStart=${report.datasetPeriodStart}, strategy=${report.strategy}`);
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error: any) {
    logger.error('Get reports failed:', error);
    res.status(500).json({
      success: false,
      error: '获取报告列表失败'
    });
  }
});

/**
 * 获取特定报告详情
 * GET /api/ai-analysis/reports/:reportId
 */
router.get('/reports/:reportId', async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const userId = req.user!.id;

    const report = await threeStepAIAnalysisService.getReportById(userId, reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: '报告不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Get report detail failed:', error);
    res.status(500).json({
      success: false,
      error: '获取报告详情失败'
    });
  }
});

/**
 * 清除所有AI分析记录（测试用）
 * DELETE /api/ai-analysis/clear-all
 */
router.delete('/clear-all', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    logger.info(`Clearing all AI analysis data for user ${userId}`);
    
    await threeStepAIAnalysisService.clearAllAnalysisForUser(userId);

    res.json({
      success: true,
      message: '所有AI分析记录已清除'
    });
  } catch (error: any) {
    logger.error('Clear all analysis failed:', error);
    res.status(500).json({
      success: false,
      error: '清除分析记录失败'
    });
  }
});

export default router;