import { Router } from 'express';
import { param, query } from 'express-validator';
import { FunnelMetricsService } from '@/services/FunnelMetricsService';
import { validateRequest } from '@/middleware/validateRequest';
import { validateBody, validateQuery, validateParams } from '@/middleware/joiValidation';
import threeStepAIAnalysisService from '@/services/ThreeStepAIAnalysisService';
import {
  createFunnelMetricsSchema,
  updateFunnelMetricsSchema,
  createNodeMetricsSchema,
  updateNodeMetricsSchema,
  batchCreateNodeMetricsSchema,
  batchUpdateNodeMetricsSchema,
  metricsQuerySchema,
  nodeMetricsQuerySchema,
  generateTemplateSchema,
  uuidParamSchema
} from '@/schemas/funnelMetrics';
import { MetricPeriodType } from '@prisma/client';

const router = Router();
const funnelMetricsService = new FunnelMetricsService();

// Simple test endpoint first
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Funnel metrics API is working',
    timestamp: new Date().toISOString()
  });
});

// Generate data entry template
router.get(
  '/funnels/:funnelId/template',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    query('periodType')
      .isIn(['weekly', 'monthly'])
      .withMessage('周期类型必须是weekly或monthly'),
    
    query('periodStartDate')
      .isISO8601()
      .withMessage('开始日期格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const funnelId = req.params.funnelId;
      const periodType = req.query.periodType as MetricPeriodType;
      const periodStartDate = new Date(req.query.periodStartDate as string);

      const template = await funnelMetricsService.generateDataEntryTemplate(
        req.user!.id,
        funnelId,
        periodType,
        periodStartDate
      );
      
      res.json({
        success: true,
        data: template,
        message: '数据录入模板生成成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create funnel metrics
router.post(
  '/funnels/:funnelId/metrics',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    
    validateBody(createFunnelMetricsSchema)
  ],
  async (req, res, next) => {
    try {
      const funnelId = req.params.funnelId;
      const metricsData = {
        ...req.body,
        funnelId,
        periodStartDate: new Date(req.body.periodStartDate),
        periodEndDate: new Date(req.body.periodEndDate)
      };

      const metrics = await funnelMetricsService.createFunnelMetrics(req.user!.id, metricsData);
      
      // 数据录入成功后，清除该数据期间的AI分析并重新生成
      try {
        // 只清除当前数据期间的分析
        await threeStepAIAnalysisService.clearAnalysisForFunnelPeriod(
          req.user!.id, 
          funnelId, 
          metricsData.periodStartDate
        );
        
        // 立即生成新的AI分析，传入数据期间（不阻塞响应）
        console.log(`📊 数据录入完成，立即触发AI分析生成 - 漏斗: ${funnelId.slice(0, 8)}, 期间: ${metricsData.periodStartDate.toISOString().split('T')[0]}`);
        threeStepAIAnalysisService.generateKeyInsightsForPeriod(
          req.user!.id, 
          funnelId, 
          metricsData.periodStartDate
        ).then(result => {
          console.log(`✅ 数据录入后AI分析生成完成 - 分析ID: ${result.analysisId?.slice(0, 8)}`);
        }).catch(error => {
          console.error('❌ 数据录入后AI分析生成失败:', error);
        });
      } catch (error) {
        console.error('清除AI分析失败:', error);
      }
      
      res.status(201).json({
        success: true,
        data: metrics,
        message: '漏斗指标创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create node metrics
router.post(
  '/nodes/:nodeId/metrics',
  [
    param('nodeId')
      .isUUID()
      .withMessage('节点ID格式无效'),
    
    validateBody(createNodeMetricsSchema)
  ],
  async (req, res, next) => {
    try {
      const nodeId = req.params.nodeId;
      const metricsData = {
        ...req.body,
        nodeId,
        periodStartDate: new Date(req.body.periodStartDate),
        periodEndDate: new Date(req.body.periodEndDate)
      };

      const metrics = await funnelMetricsService.createNodeMetrics(req.user!.id, metricsData);
      
      res.status(201).json({
        success: true,
        data: metrics,
        message: '节点指标创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Batch create node metrics
router.post(
  '/nodes/metrics/batch',
  validateBody(batchCreateNodeMetricsSchema),
  async (req, res, next) => {
    try {
      // Process date fields
      const processedData = {
        nodeMetrics: req.body.nodeMetrics.map((metric: any) => ({
          ...metric,
          periodStartDate: new Date(metric.periodStartDate),
          periodEndDate: new Date(metric.periodEndDate)
        }))
      };

      const metrics = await funnelMetricsService.batchCreateNodeMetrics(req.user!.id, processedData);
      
      res.status(201).json({
        success: true,
        data: metrics,
        message: `成功批量创建${metrics.length}条节点指标`
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get funnel analytics
router.get(
  '/funnels/:funnelId/analytics',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const funnelId = req.params.funnelId;
      const options = {
        periodType: req.query.periodType as MetricPeriodType,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        includeComparison: req.query.includeComparison === 'true'
      };

      const analytics = await funnelMetricsService.getFunnelAnalytics(req.user!.id, funnelId, options);
      
      res.json({
        success: true,
        data: analytics,
        message: '漏斗分析数据获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get funnel metrics by ID
router.get(
  '/funnels/:funnelId/metrics/:metricsId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    param('metricsId')
      .isUUID()
      .withMessage('指标ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, metricsId } = req.params;

      const metrics = await funnelMetricsService.getFunnelMetricsById(req.user!.id, metricsId);
      
      res.json({
        success: true,
        data: metrics,
        message: '漏斗指标获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update funnel metrics
router.put(
  '/funnels/:funnelId/metrics/:metricsId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    param('metricsId')
      .isUUID()
      .withMessage('指标ID格式无效'),
    
    validateBody(updateFunnelMetricsSchema)
  ],
  async (req, res, next) => {
    try {
      const { funnelId, metricsId } = req.params;
      const updateData = req.body;

      // Process date fields if they exist
      if (updateData.periodStartDate) {
        updateData.periodStartDate = new Date(updateData.periodStartDate);
      }
      if (updateData.periodEndDate) {
        updateData.periodEndDate = new Date(updateData.periodEndDate);
      }

      const metrics = await funnelMetricsService.updateFunnelMetrics(req.user!.id, metricsId, updateData);
      
      // 数据更新成功后，清除该数据期间的AI分析并重新生成
      try {
        // 确定要清除的数据期间
        const periodToUse = updateData.periodStartDate || metrics.periodStartDate;
        
        if (periodToUse) {
          // 只清除当前数据期间的分析
          await threeStepAIAnalysisService.clearAnalysisForFunnelPeriod(
            req.user!.id, 
            funnelId, 
            periodToUse
          );
          console.log(`✨ 数据更新后清除特定期间AI分析成功: ${funnelId.slice(0, 8)}`);
          
          // 立即生成新的AI分析，传入数据期间（不阻塞响应）
          console.log(`📊 数据更新完成，立即触发AI分析生成 - 漏斗: ${funnelId.slice(0, 8)}, 期间: ${periodToUse.toISOString().split('T')[0]}`);
          threeStepAIAnalysisService.generateKeyInsightsForPeriod(
            req.user!.id, 
            funnelId, 
            periodToUse
          ).then((result) => {
            console.log(`✅ 数据更新后AI分析重新生成完成 - 分析ID: ${result.analysisId?.slice(0, 8)}`);
          })
           .catch(error => console.error('AI分析生成失败:', error));
        }
      } catch (error) {
        console.error('清除AI分析失败:', error);
      }
      
      res.json({
        success: true,
        data: metrics,
        message: '漏斗指标更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete funnel metrics
router.delete(
  '/funnels/:funnelId/metrics/:metricsId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效'),
    param('metricsId')
      .isUUID()
      .withMessage('指标ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId, metricsId } = req.params;

      await funnelMetricsService.deleteFunnelMetrics(req.user!.id, metricsId);
      
      res.json({
        success: true,
        message: '漏斗指标删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get funnel metrics list (for recent entries)
router.get(
  '/funnels/:funnelId/metrics',
  [
    param('funnelId')
      .isUUID()
      .withMessage('漏斗ID格式无效')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const funnelId = req.params.funnelId;
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort: 'periodStartDate',
        order: 'desc' as const,
        periodType: req.query.periodType as MetricPeriodType,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const result = await funnelMetricsService.getFunnelMetrics(req.user!.id, funnelId, params);
      
      res.json({
        success: true,
        data: result.metrics,
        total: result.total,
        message: '漏斗指标列表获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;