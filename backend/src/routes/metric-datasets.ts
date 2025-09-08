import express from 'express';
import { MetricDatasetService } from '@/services/MetricDatasetService';
import { authMiddleware as auth } from '@/middleware/auth';
import { validate } from '@/middleware/joiValidation';
import { 
  createFunnelMetricDatasetSchema, 
  analysisQuerySchema,
  uuidParamSchema,
  datasetQuerySchema
} from '@/schemas/metricDataset';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

const router = express.Router();
const metricDatasetService = new MetricDatasetService();

/**
 * POST /metric-datasets
 * 创建4阶段漏斗指标数据集
 */
router.post('/', 
  auth, 
  validate({
    body: createFunnelMetricDatasetSchema
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const dataset = await metricDatasetService.createFunnelDataset(
        user.organizationId,
        user.id,
        req.body
      );

      logger.info(`Funnel dataset created: ${dataset.id} by user: ${user.id}`);

      res.status(201).json({
        success: true,
        data: {
          id: dataset.id,
          name: dataset.name,
          datasetType: dataset.datasetType,
          funnelData: dataset.funnelData,
          createdAt: dataset.createdAt
        },
        message: '漏斗数据集创建成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /analysis/:dataset_id
 * 获取漏斗分析详情页数据
 */
router.get('/analysis/:id',
  auth,
  validate({
    params: uuidParamSchema,
    query: analysisQuerySchema
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const { id } = req.params;
      const { includeBenchmarks, includeSuggestions } = req.query;

      const analysis = await metricDatasetService.getAnalysisById(
        id,
        user.organizationId,
        {
          includeBenchmarks: includeBenchmarks === 'true' || includeBenchmarks === true,
          includeSuggestions: includeSuggestions === 'true' || includeSuggestions === true
        }
      );

      res.json({
        success: true,
        data: analysis,
        message: '分析数据获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /metric-datasets
 * 获取组织的数据集列表
 */
router.get('/',
  auth,
  validate({
    query: datasetQuerySchema
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const { page, limit, datasetType, dataSource, sort, order } = req.query;

      const datasets = await metricDatasetService.getDatasetsByOrganization(
        user.organizationId,
        {
          page: page ? parseInt(page.toString(), 10) : 1,
          limit: limit ? parseInt(limit.toString(), 10) : 10,
          datasetType: datasetType as string,
          dataSource: dataSource as string
        }
      );

      res.json({
        success: true,
        data: datasets,
        message: '数据集列表获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /metric-datasets/:id
 * 获取单个数据集详情
 */
router.get('/:id',
  auth,
  validate({
    params: uuidParamSchema
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const { id } = req.params;

      const dataset = await metricDatasetService.getDatasetById(
        id,
        user.organizationId
      );

      if (!dataset) {
        throw new ApiError('数据集不存在', 404);
      }

      res.json({
        success: true,
        data: dataset,
        message: '数据集详情获取成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /metric-datasets/:id
 * 更新数据集
 */
router.put('/:id',
  auth,
  validate({
    params: uuidParamSchema,
    // TODO: Add update validation schema when needed
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const { id } = req.params;

      const dataset = await metricDatasetService.updateDataset(
        id,
        user.organizationId,
        user.id,
        req.body
      );

      res.json({
        success: true,
        data: dataset,
        message: '数据集更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /metric-datasets/:id
 * 删除数据集
 */
router.delete('/:id',
  auth,
  validate({
    params: uuidParamSchema
  }),
  async (req, res, next) => {
    try {
      const { user } = req;
      if (!user?.organizationId) {
        throw new ApiError('需要组织权限', 403);
      }

      const { id } = req.params;

      await metricDatasetService.deleteDataset(
        id,
        user.organizationId,
        user.id
      );

      res.json({
        success: true,
        message: '数据集删除成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;