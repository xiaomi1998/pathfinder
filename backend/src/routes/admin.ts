import express from 'express';
import { 
  adminAuthMiddleware, 
  adminRoleOnly, 
  superAdminOnly,
  getClientIP,
  getUserAgent 
} from '@/middleware/adminAuth';
import { AdminService } from '@/services/AdminService';
import { validateBody } from '@/middleware/joiValidation';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import Joi from 'joi';

const router = express.Router();
const adminService = new AdminService();

// Validation schemas
const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '请输入有效的邮箱地址',
    'any.required': '邮箱不能为空'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少6个字符',
    'any.required': '密码不能为空'
  })
});

const updateUserLimitsSchema = Joi.object({
  dailyLimit: Joi.number().integer().min(0).max(10000).optional().messages({
    'number.min': '每日限制不能小于0',
    'number.max': '每日限制不能超过10000',
    'number.integer': '每日限制必须为整数'
  }),
  monthlyLimit: Joi.number().integer().min(0).max(100000).optional().messages({
    'number.min': '每月限制不能小于0',
    'number.max': '每月限制不能超过100000',
    'number.integer': '每月限制必须为整数'
  })
});

// 基准数据验证模式
const createBenchmarkSchema = Joi.object({
  industry: Joi.string().min(1).max(100).required().messages({
    'string.min': '行业名称不能为空',
    'string.max': '行业名称不能超过100个字符',
    'any.required': '行业名称是必填项'
  }),
  region: Joi.string().max(100).optional().messages({
    'string.max': '地区名称不能超过100个字符'
  }),
  companySize: Joi.string().max(50).optional().messages({
    'string.max': '公司规模不能超过50个字符'
  }),
  metricType: Joi.string().min(1).max(100).required().messages({
    'string.min': '指标类型不能为空',
    'string.max': '指标类型不能超过100个字符',
    'any.required': '指标类型是必填项'
  }),
  metricName: Joi.string().min(1).max(100).required().messages({
    'string.min': '指标名称不能为空',
    'string.max': '指标名称不能超过100个字符',
    'any.required': '指标名称是必填项'
  }),
  value: Joi.number().min(0).max(100).precision(4).required().messages({
    'number.min': '转化率不能小于0',
    'number.max': '转化率不能超过100',
    'any.required': '转化率是必填项'
  }),
  percentile: Joi.number().valid(10, 25, 50, 75, 90).required().messages({
    'any.only': '百分位数必须是10, 25, 50, 75, 90之一',
    'any.required': '百分位数是必填项'
  }),
  sampleSize: Joi.number().integer().min(1).max(100000).required().messages({
    'number.min': '样本量必须大于0',
    'number.max': '样本量不能超过100000',
    'number.integer': '样本量必须为整数',
    'any.required': '样本量是必填项'
  }),
  periodStart: Joi.date().required().messages({
    'any.required': '开始日期是必填项'
  }),
  periodEnd: Joi.date().min(Joi.ref('periodStart')).required().messages({
    'date.min': '结束日期必须晚于开始日期',
    'any.required': '结束日期是必填项'
  })
});

const updateBenchmarkSchema = Joi.object({
  industry: Joi.string().min(1).max(100).optional().messages({
    'string.min': '行业名称不能为空',
    'string.max': '行业名称不能超过100个字符'
  }),
  region: Joi.string().max(100).optional().messages({
    'string.max': '地区名称不能超过100个字符'
  }),
  companySize: Joi.string().max(50).optional().messages({
    'string.max': '公司规模不能超过50个字符'
  }),
  metricType: Joi.string().min(1).max(100).optional().messages({
    'string.min': '指标类型不能为空',
    'string.max': '指标类型不能超过100个字符'
  }),
  metricName: Joi.string().min(1).max(100).optional().messages({
    'string.min': '指标名称不能为空',
    'string.max': '指标名称不能超过100个字符'
  }),
  value: Joi.number().min(0).max(100).precision(4).optional().messages({
    'number.min': '转化率不能小于0',
    'number.max': '转化率不能超过100'
  }),
  percentile: Joi.number().valid(10, 25, 50, 75, 90).optional().messages({
    'any.only': '百分位数必须是10, 25, 50, 75, 90之一'
  }),
  sampleSize: Joi.number().integer().min(1).max(100000).optional().messages({
    'number.min': '样本量必须大于0',
    'number.max': '样本量不能超过100000',
    'number.integer': '样本量必须为整数'
  }),
  periodStart: Joi.date().optional(),
  periodEnd: Joi.date().when('periodStart', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('periodStart')).required().messages({
      'date.min': '结束日期必须晚于开始日期'
    }),
    otherwise: Joi.date().optional()
  })
});

const batchImportBenchmarkSchema = Joi.object({
  records: Joi.array().items(createBenchmarkSchema).min(1).max(1000).required().messages({
    'array.min': '至少需要1条记录',
    'array.max': '一次最多导入1000条记录',
    'any.required': '记录数组是必填项'
  })
});

/**
 * @route POST /admin/login
 * @desc Admin login
 * @access Public
 */
router.post('/login', validateBody(adminLoginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await adminService.login({ email, password });
    
    // Set HTTP-only cookie for additional security
    res.cookie('admin_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expires_in * 1000
    });
    
    logger.info(`管理员登录成功: ${result.admin.username}`);
    
    res.json({
      success: true,
      message: '登录成功',
      data: result
    });
  } catch (error) {
    logger.error('管理员登录失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'LOGIN_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route POST /admin/logout
 * @desc Admin logout
 * @access Private (Admin)
 */
router.post('/logout', adminAuthMiddleware, async (req, res) => {
  try {
    // Clear the admin token cookie
    res.clearCookie('admin_token');
    
    logger.info(`管理员登出: ${req.admin?.username}`);
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    logger.error('管理员登出失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route GET /admin/profile
 * @desc Get admin profile
 * @access Private (Admin)
 */
router.get('/profile', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '获取管理员信息成功',
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    logger.error('获取管理员信息失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route GET /admin/users
 * @desc Get users with AI usage information
 * @access Private (Admin)
 */
router.get('/users', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as 'username' | 'email' | 'createdAt' | 'lastLoginAt' | 'aiUsage') || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await adminService.getUsersWithAiUsage(
      page,
      limit,
      search,
      sortBy,
      sortOrder
    );

    logger.info(`管理员 ${req.admin?.username} 获取用户列表: page=${page}, limit=${limit}`);

    res.json({
      success: true,
      message: '获取用户列表成功',
      data: result
    });
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'GET_USERS_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route PUT /admin/users/:id/limits
 * @desc Update user AI usage limits
 * @access Private (Admin)
 */
router.put('/users/:id/limits', 
  adminAuthMiddleware, 
  adminRoleOnly, 
  validateBody(updateUserLimitsSchema), 
  async (req, res) => {
    try {
      const userId = req.params.id;
      const limits = req.body;
      const adminId = req.admin!.id;
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          error: '用户ID无效',
          code: 'INVALID_USER_ID'
        });
        return;
      }

      await adminService.updateUserLimits(
        userId,
        limits,
        adminId,
        ipAddress,
        userAgent
      );

      logger.info(`管理员 ${req.admin?.username} 更新了用户 ${userId} 的AI使用限制`);

      res.json({
        success: true,
        message: '更新用户限制成功'
      });
    } catch (error) {
      logger.error('更新用户限制失败:', error);
      
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: 'UPDATE_LIMITS_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
);

/**
 * @route GET /admin/usage-stats
 * @desc Get AI usage statistics
 * @access Private (Admin)
 */
router.get('/usage-stats', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    const stats = await adminService.getUsageStats();

    logger.info(`管理员 ${req.admin?.username} 获取了AI使用统计`);

    res.json({
      success: true,
      message: '获取统计数据成功',
      data: stats
    });
  } catch (error) {
    logger.error('获取统计数据失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'GET_STATS_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route GET /admin/health
 * @desc Admin system health check
 * @access Private (Admin)
 */
router.get('/health', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin系统运行正常',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        admin: {
          id: req.admin!.id,
          username: req.admin!.username,
          role: req.admin!.role
        }
      }
    });
  } catch (error) {
    logger.error('Admin健康检查失败:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ===================== 基准数据管理路由 =====================

/**
 * @route GET /admin/benchmarks
 * @desc Get benchmark data list
 * @access Private (Admin)
 */
router.get('/benchmarks', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    
    // 构建过滤条件
    const filters: any = {};
    if (req.query.industry) filters.industry = req.query.industry as string;
    if (req.query.region) filters.region = req.query.region as string;
    if (req.query.companySize) filters.companySize = req.query.companySize as string;
    if (req.query.metricType) filters.metricType = req.query.metricType as string;
    if (req.query.metricName) filters.metricName = req.query.metricName as string;
    if (req.query.percentile) filters.percentile = parseInt(req.query.percentile as string);
    if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

    const result = await adminService.getBenchmarkData(page, limit, filters);

    logger.info(`管理员 ${req.admin?.username} 获取基准数据列表: page=${page}, limit=${limit}`);

    res.json({
      success: true,
      message: '获取基准数据列表成功',
      data: result
    });
  } catch (error) {
    logger.error('获取基准数据列表失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'GET_BENCHMARKS_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route POST /admin/benchmarks
 * @desc Create new benchmark data
 * @access Private (Admin)
 */
router.post('/benchmarks', 
  adminAuthMiddleware, 
  adminRoleOnly, 
  validateBody(createBenchmarkSchema), 
  async (req, res) => {
    try {
      const benchmarkData = req.body;
      const adminId = req.admin!.id;
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);

      const result = await adminService.createBenchmarkData(
        benchmarkData,
        adminId,
        ipAddress,
        userAgent
      );

      logger.info(`管理员 ${req.admin?.username} 创建了基准数据: ${benchmarkData.industry}-${benchmarkData.metricName}`);

      res.status(201).json({
        success: true,
        message: '创建基准数据成功',
        data: result
      });
    } catch (error) {
      logger.error('创建基准数据失败:', error);
      
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: 'CREATE_BENCHMARK_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
);

/**
 * @route PUT /admin/benchmarks/:id
 * @desc Update benchmark data
 * @access Private (Admin)
 */
router.put('/benchmarks/:id', 
  adminAuthMiddleware, 
  adminRoleOnly, 
  validateBody(updateBenchmarkSchema), 
  async (req, res) => {
    try {
      const benchmarkId = req.params.id;
      const updateData = req.body;
      const adminId = req.admin!.id;
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);

      if (!benchmarkId || typeof benchmarkId !== 'string') {
        res.status(400).json({
          success: false,
          error: '基准数据ID无效',
          code: 'INVALID_BENCHMARK_ID'
        });
        return;
      }

      const result = await adminService.updateBenchmarkData(
        benchmarkId,
        updateData,
        adminId,
        ipAddress,
        userAgent
      );

      logger.info(`管理员 ${req.admin?.username} 更新了基准数据: ${benchmarkId}`);

      res.json({
        success: true,
        message: '更新基准数据成功',
        data: result
      });
    } catch (error) {
      logger.error('更新基准数据失败:', error);
      
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: 'UPDATE_BENCHMARK_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
);

/**
 * @route DELETE /admin/benchmarks/:id
 * @desc Delete benchmark data
 * @access Private (Admin)
 */
router.delete('/benchmarks/:id', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    const benchmarkId = req.params.id;
    const adminId = req.admin!.id;
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);

    if (!benchmarkId || typeof benchmarkId !== 'string') {
      res.status(400).json({
        success: false,
        error: '基准数据ID无效',
        code: 'INVALID_BENCHMARK_ID'
      });
      return;
    }

    await adminService.deleteBenchmarkData(
      benchmarkId,
      adminId,
      ipAddress,
      userAgent
    );

    logger.info(`管理员 ${req.admin?.username} 删除了基准数据: ${benchmarkId}`);

    res.json({
      success: true,
      message: '删除基准数据成功'
    });
  } catch (error) {
    logger.error('删除基准数据失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'DELETE_BENCHMARK_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

/**
 * @route POST /admin/benchmarks/batch-import
 * @desc Batch import benchmark data
 * @access Private (Admin)
 */
router.post('/benchmarks/batch-import', 
  adminAuthMiddleware, 
  adminRoleOnly, 
  validateBody(batchImportBenchmarkSchema), 
  async (req, res) => {
    try {
      const { records } = req.body;
      const adminId = req.admin!.id;
      const ipAddress = getClientIP(req);
      const userAgent = getUserAgent(req);

      const result = await adminService.batchImportBenchmarkData(
        records,
        adminId,
        ipAddress,
        userAgent
      );

      logger.info(`管理员 ${req.admin?.username} 批量导入了 ${records.length} 条基准数据`);

      res.json({
        success: true,
        message: `批量导入完成，成功 ${result.successCount} 条，失败 ${result.failureCount} 条`,
        data: result
      });
    } catch (error) {
      logger.error('批量导入基准数据失败:', error);
      
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: 'BATCH_IMPORT_FAILED'
        });
      } else {
        res.status(500).json({
          success: false,
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    }
  }
);

/**
 * @route GET /admin/benchmarks/stats
 * @desc Get benchmark data statistics
 * @access Private (Admin)
 */
router.get('/benchmarks/stats', adminAuthMiddleware, adminRoleOnly, async (req, res) => {
  try {
    const stats = await adminService.getBenchmarkStats();

    logger.info(`管理员 ${req.admin?.username} 获取了基准数据统计`);

    res.json({
      success: true,
      message: '获取基准数据统计成功',
      data: stats
    });
  } catch (error) {
    logger.error('获取基准数据统计失败:', error);
    
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: 'GET_BENCHMARK_STATS_FAILED'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

export default router;