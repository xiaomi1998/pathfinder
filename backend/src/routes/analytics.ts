import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { AnalyticsService } from '@/services/AnalyticsService';
import { validateRequest } from '@/middleware/validateRequest';
import { 
  AnalyticsQuery,
  InstanceAnalyticsRequest,
  InstanceComparisonRequest,
  TemplateAnalyticsRequest,
  TrendAnalysisRequest
} from '@/types/analytics';

const router = Router();
const analyticsService = new AnalyticsService();

// Get analytics for a specific funnel instance
router.get(
  '/instances/:instanceId',
  [
    param('instanceId')
      .isUUID()
      .withMessage('Instance ID must be a valid UUID'),
    
    query('dateRange')
      .optional()
      .isJSON()
      .withMessage('Date range must be valid JSON'),
    
    query('includeHistorical')
      .optional()
      .isBoolean()
      .withMessage('Include historical must be boolean'),
    
    query('granularity')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Granularity must be daily, weekly, or monthly'),
    
    query('metrics')
      .optional()
      .isArray()
      .withMessage('Metrics must be an array')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { instanceId } = req.params;
      
      // Parse query parameters
      const query: AnalyticsQuery = {};
      
      if (req.query.dateRange) {
        try {
          const dateRange = JSON.parse(req.query.dateRange as string);
          query.dateRange = {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end)
          };
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date range format'
          });
        }
      }
      
      if (req.query.includeHistorical) {
        query.includeHistorical = req.query.includeHistorical === 'true';
      }
      
      if (req.query.granularity) {
        query.granularity = req.query.granularity as 'daily' | 'weekly' | 'monthly';
      }
      
      if (req.query.metrics) {
        query.metrics = Array.isArray(req.query.metrics) 
          ? req.query.metrics as string[]
          : [req.query.metrics as string];
      }

      const analytics = await analyticsService.getInstanceAnalytics(
        instanceId, 
        req.user!.id, 
        query
      );

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Compare multiple funnel instances
router.post(
  '/instances/compare',
  [
    body('instanceIds')
      .isArray({ min: 2, max: 10 })
      .withMessage('Must provide 2-10 instance IDs for comparison'),
    
    body('instanceIds.*')
      .isUUID()
      .withMessage('Each instance ID must be a valid UUID'),
    
    body('comparisonMetrics')
      .optional()
      .isArray()
      .withMessage('Comparison metrics must be an array'),
    
    body('dateRange')
      .optional()
      .isObject()
      .withMessage('Date range must be an object'),
    
    body('dateRange.start')
      .optional()
      .isISO8601()
      .withMessage('Start date must be valid ISO8601'),
    
    body('dateRange.end')
      .optional()
      .isISO8601()
      .withMessage('End date must be valid ISO8601')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { instanceIds, comparisonMetrics, dateRange, granularity } = req.body;
      
      const query: AnalyticsQuery = {};
      
      if (dateRange) {
        query.dateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        };
      }
      
      if (granularity) {
        query.granularity = granularity;
      }

      const comparison = await analyticsService.compareInstances(
        instanceIds, 
        req.user!.id, 
        query
      );

      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get template-level analytics for a funnel
router.get(
  '/templates/:funnelId',
  [
    param('funnelId')
      .isUUID()
      .withMessage('Funnel ID must be a valid UUID'),
    
    query('includeStageBreakdown')
      .optional()
      .isBoolean()
      .withMessage('Include stage breakdown must be boolean'),
    
    query('includeTrendAnalysis')
      .optional()
      .isBoolean()
      .withMessage('Include trend analysis must be boolean'),
    
    query('dateRange')
      .optional()
      .isJSON()
      .withMessage('Date range must be valid JSON')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { funnelId } = req.params;
      
      const query: AnalyticsQuery = {};
      
      if (req.query.dateRange) {
        try {
          const dateRange = JSON.parse(req.query.dateRange as string);
          query.dateRange = {
            start: new Date(dateRange.start),
            end: new Date(dateRange.end)
          };
        } catch (e) {
          return res.status(400).json({
            success: false,
            error: 'Invalid date range format'
          });
        }
      }

      const templateAnalytics = await analyticsService.getTemplateAnalytics(
        funnelId, 
        req.user!.id, 
        query
      );

      res.json({
        success: true,
        data: templateAnalytics
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get trend analysis for multiple instances
router.post(
  '/trends',
  [
    body('instanceIds')
      .isArray({ min: 1, max: 20 })
      .withMessage('Must provide 1-20 instance IDs for trend analysis'),
    
    body('instanceIds.*')
      .isUUID()
      .withMessage('Each instance ID must be a valid UUID'),
    
    body('trendPeriod')
      .optional()
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Trend period must be week, month, quarter, or year'),
    
    body('includePatternAnalysis')
      .optional()
      .isBoolean()
      .withMessage('Include pattern analysis must be boolean'),
    
    body('dateRange')
      .optional()
      .isObject()
      .withMessage('Date range must be an object')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { instanceIds, trendPeriod, includePatternAnalysis, dateRange, granularity } = req.body;
      
      const query: AnalyticsQuery = {};
      
      if (dateRange) {
        query.dateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        };
      }
      
      if (granularity) {
        query.granularity = granularity;
      }

      const trends = await analyticsService.getInstanceTrends(
        instanceIds, 
        req.user!.id, 
        query
      );

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get usage statistics for the organization
router.get(
  '/usage/organization',
  async (req, res, next) => {
    try {
      const organizationId = req.user!.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'User must be part of an organization'
        });
      }

      // Get basic usage statistics
      const [totalFunnels, activeFunnels, totalUsers] = await Promise.all([
        analyticsService['prisma'].funnel.count({
          where: { organizationId }
        }),
        analyticsService['prisma'].funnel.count({
          where: { 
            organizationId,
            status: 'active'
          }
        }),
        analyticsService['prisma'].user.count({
          where: { organizationId }
        })
      ]);

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await analyticsService['prisma'].funnel.count({
        where: {
          organizationId,
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalFunnels,
          activeFunnels,
          totalUsers,
          recentActivity,
          period: {
            start: thirtyDaysAgo,
            end: new Date()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get performance benchmarks
router.get(
  '/benchmarks',
  [
    query('industry')
      .optional()
      .isString()
      .withMessage('Industry must be a string'),
    
    query('metric')
      .optional()
      .isString()
      .withMessage('Metric must be a string'),
    
    query('percentile')
      .optional()
      .isInt({ min: 1, max: 99 })
      .withMessage('Percentile must be between 1 and 99')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { industry, metric, percentile } = req.query;
      
      const benchmarks = await analyticsService['prisma'].benchmarkData.findMany({
        where: {
          ...(industry && { industry: industry as string }),
          ...(metric && { metricName: metric as string }),
          ...(percentile && { percentile: parseInt(percentile as string) }),
          organizationId: req.user!.organizationId || ''
        },
        orderBy: [
          { industry: 'asc' },
          { metricName: 'asc' },
          { percentile: 'asc' }
        ]
      });

      res.json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;