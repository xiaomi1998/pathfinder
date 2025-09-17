import { Router, Request, Response } from 'express';
import { authMiddleware as auth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validateRequest';
import { 
  FunnelAnalysisRequest, 
  FunnelAnalysisResponse,
  ApiResponse,
  GeneratedRecommendation,
  DiagnosticResult,
  PeerComparisonResult,
  ImprovementPotential 
} from '@/types';
import { BenchmarkService } from '@/services/BenchmarkService';
import { DiagnosticService } from '@/services/DiagnosticService';
import { RecommendationEngine } from '@/services/RecommendationEngine';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

const router = Router();

// 初始化服务
const benchmarkService = new BenchmarkService();
const diagnosticService = new DiagnosticService();
const recommendationEngine = new RecommendationEngine();

/**
 * @route POST /api/analysis/comprehensive
 * @desc 执行综合分析（包含诊断、建议、对比和潜力分析）
 * @access Private
 */
router.post('/comprehensive', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Performing comprehensive analysis for organization: ${req.user?.organizationId}`);

    const {
      companyData,
      industry,
      companySize,
      region,
      includeRecommendations = true,
      includeDiagnostics = true,
      includePeerComparison = true,
      includeImprovementPotential = true,
      maxRecommendations = 12
    }: FunnelAnalysisRequest = req.body;

    const result: Partial<FunnelAnalysisResponse> = {
      timestamp: new Date()
    };

    // 1. 获取基准数据
    const benchmarkData = await benchmarkService.calculatePercentileBenchmarks(
      industry,
      companySize,
      region
    );

    // 2. 执行诊断分析
    if (includeDiagnostics) {
      result.diagnostics = await diagnosticService.performComprehensiveDiagnosis(
        companyData,
        benchmarkData,
        {
          includeWeakPoints: true,
          includeImprovementPotential: true,
          includeHealthScore: true
        }
      );
    }

    // 3. 执行同行对比
    if (includePeerComparison) {
      result.peerComparison = await benchmarkService.performPeerComparison(
        companyData,
        industry,
        companySize,
        region
      );
    }

    // 4. 计算改进潜力
    if (includeImprovementPotential) {
      result.improvementPotential = benchmarkService.calculateImprovementPotential(
        companyData,
        benchmarkData
      );
    }

    // 5. 生成智能建议
    if (includeRecommendations) {
      result.recommendations = await recommendationEngine.generateRecommendations(
        companyData,
        benchmarkData,
        result.diagnostics,
        {
          maxRecommendations,
          includeCustomRules: true,
          organizationId: req.user?.organizationId,
          industry,
          companySize
        }
      );
    }

    const response: ApiResponse<FunnelAnalysisResponse> = {
      success: true,
      data: result as FunnelAnalysisResponse,
      message: '综合分析完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error in comprehensive analysis:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '分析执行失败',
        code: 'ANALYSIS_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/diagnostics
 * @desc 执行性能诊断
 * @access Private
 */
router.post('/diagnostics', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Performing diagnostics for organization: ${req.user?.organizationId}`);

    const { companyData, industry, companySize, region } = req.body;

    // 获取基准数据
    const benchmarkData = await benchmarkService.calculatePercentileBenchmarks(
      industry,
      companySize,
      region
    );

    // 执行诊断
    const diagnostics = await diagnosticService.performComprehensiveDiagnosis(
      companyData,
      benchmarkData,
      {
        includeWeakPoints: true,
        includeImprovementPotential: true,
        includeHealthScore: true
      }
    );

    const response: ApiResponse<DiagnosticResult> = {
      success: true,
      data: diagnostics,
      message: '诊断分析完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error in diagnostics:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '诊断执行失败',
        code: 'DIAGNOSTICS_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/recommendations
 * @desc 生成智能建议
 * @access Private
 */
router.post('/recommendations', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Generating recommendations for organization: ${req.user?.organizationId}`);

    const { 
      companyData, 
      industry, 
      companySize, 
      region,
      maxRecommendations = 12,
      includeCustomRules = true
    } = req.body;

    // 获取基准数据
    const benchmarkData = await benchmarkService.calculatePercentileBenchmarks(
      industry,
      companySize,
      region
    );

    // 执行简化诊断以获得薄弱环节信息
    const diagnosticResult = await diagnosticService.performComprehensiveDiagnosis(
      companyData,
      benchmarkData,
      { includeWeakPoints: true, includeImprovementPotential: false, includeHealthScore: false }
    );

    // 生成建议
    const recommendations = await recommendationEngine.generateRecommendations(
      companyData,
      benchmarkData,
      diagnosticResult,
      {
        maxRecommendations,
        includeCustomRules,
        organizationId: req.user?.organizationId,
        industry,
        companySize
      }
    );

    const response: ApiResponse<GeneratedRecommendation[]> = {
      success: true,
      data: recommendations,
      message: '建议生成完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error generating recommendations:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '建议生成失败',
        code: 'RECOMMENDATIONS_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/peer-comparison
 * @desc 执行同行对比
 * @access Private
 */
router.post('/peer-comparison', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Performing peer comparison for organization: ${req.user?.organizationId}`);

    const { companyData, industry, companySize, region } = req.body;

    // 执行同行对比
    const peerComparison = await benchmarkService.performPeerComparison(
      companyData,
      industry,
      companySize,
      region
    );

    const response: ApiResponse<PeerComparisonResult> = {
      success: true,
      data: peerComparison,
      message: '同行对比完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error in peer comparison:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '同行对比失败',
        code: 'PEER_COMPARISON_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/improvement-potential
 * @desc 计算改进潜力
 * @access Private
 */
router.post('/improvement-potential', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Calculating improvement potential for organization: ${req.user?.organizationId}`);

    const { companyData, industry, companySize, region } = req.body;

    // 获取基准数据
    const benchmarkData = await benchmarkService.calculatePercentileBenchmarks(
      industry,
      companySize,
      region
    );

    // 计算改进潜力
    const improvementPotential = benchmarkService.calculateImprovementPotential(
      companyData,
      benchmarkData
    );

    const response: ApiResponse<ImprovementPotential> = {
      success: true,
      data: improvementPotential,
      message: '改进潜力计算完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error calculating improvement potential:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '改进潜力计算失败',
        code: 'IMPROVEMENT_POTENTIAL_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route GET /api/analysis/benchmark-validation/:industry
 * @desc 验证行业基准数据的有效性
 * @access Private
 */
router.get('/benchmark-validation/:industry', auth, async (req: Request, res: Response) => {
  try {
    const { industry } = req.params;
    
    const validation = await benchmarkService.validateBenchmarkData(industry);

    const response: ApiResponse = {
      success: true,
      data: validation,
      message: '基准数据验证完成'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error validating benchmark data:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '基准数据验证失败',
        code: 'VALIDATION_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/benchmark-data
 * @desc 创建或更新基准数据
 * @access Private
 */
router.post('/benchmark-data', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Creating benchmark data for organization: ${req.user?.organizationId}`);

    const benchmarkData = await benchmarkService.createBenchmarkData(
      req.user!.organizationId!,
      req.body
    );

    const response: ApiResponse = {
      success: true,
      data: benchmarkData,
      message: '基准数据创建成功'
    };

    res.json(response);

  } catch (error) {
    logger.error('Error creating benchmark data:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '基准数据创建失败',
        code: 'BENCHMARK_CREATE_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

/**
 * @route POST /api/analysis/benchmark-data/bulk
 * @desc 批量导入基准数据
 * @access Private
 */
router.post('/benchmark-data/bulk', auth, async (req: Request, res: Response) => {
  try {
    logger.info(`Bulk importing benchmark data for organization: ${req.user?.organizationId}`);

    const { benchmarkRecords } = req.body;

    if (!Array.isArray(benchmarkRecords) || benchmarkRecords.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '请提供有效的基准数据数组',
        code: 'INVALID_DATA'
      };
      return res.status(400).json(response);
    }

    const result = await benchmarkService.bulkImportBenchmarkData(
      req.user!.organizationId!,
      benchmarkRecords
    );

    const response: ApiResponse = {
      success: true,
      data: result,
      message: `批量导入完成，成功创建 ${result.created} 条记录`
    };

    res.json(response);

  } catch (error) {
    logger.error('Error bulk importing benchmark data:', error);
    
    if (error instanceof ApiError) {
      const response: ApiResponse = {
        success: false,
        error: error.message,
        code: error.code
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: ApiResponse = {
        success: false,
        error: '批量导入失败',
        code: 'BULK_IMPORT_ERROR'
      };
      res.status(500).json(response);
    }
  }
});

export default router;