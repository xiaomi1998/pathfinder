import Joi from 'joi';

// 周期类型枚举
const periodTypes = ['weekly', 'monthly'];

// ==============================================================
// Funnel Metrics Validation Schemas
// ==============================================================

// 创建漏斗指标验证 schema
export const createFunnelMetricsSchema = Joi.object({
  funnelId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '漏斗ID格式无效'
    }),

  periodType: Joi.string()
    .valid(...periodTypes)
    .required()
    .messages({
      'any.only': `周期类型必须是 ${periodTypes.join(', ')} 之一`,
      'any.required': '周期类型是必填项'
    }),

  periodStartDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': '开始日期格式无效',
      'any.required': '开始日期是必填项'
    }),

  periodEndDate: Joi.date()
    .iso()
    .min(Joi.ref('periodStartDate'))
    .required()
    .messages({
      'date.format': '结束日期格式无效',
      'date.min': '结束日期不能早于开始日期',
      'any.required': '结束日期是必填项'
    }),

  totalEntries: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '总进入数必须是数字',
      'number.integer': '总进入数必须是整数',
      'number.min': '总进入数不能小于0'
    }),

  totalConversions: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '总转化数必须是数字',
      'number.integer': '总转化数必须是整数',
      'number.min': '总转化数不能小于0'
    }),

  totalRevenue: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '总收入必须是数字',
      'number.min': '总收入不能小于0'
    }),

  totalCost: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '总成本必须是数字',
      'number.min': '总成本不能小于0'
    }),

  avgTimeSpent: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '平均停留时间必须是数字',
      'number.integer': '平均停留时间必须是整数（秒）',
      'number.min': '平均停留时间不能小于0'
    }),

  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注长度不能超过1000个字符'
    }),

  customMetrics: Joi.object()
    .optional()
    .messages({
      'object.base': '自定义指标必须是对象格式'
    }),

  overallConversionRate: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .messages({
      'number.base': '总体转化率必须是数字',
      'number.min': '总体转化率不能小于0',
      'number.max': '总体转化率不能大于1'
    })
}).custom((value, helpers) => {
  // 自定义验证：总转化数不能大于总进入数
  if (value.totalConversions > value.totalEntries) {
    return helpers.error('custom.conversionsExceedEntries');
  }
  return value;
}).messages({
  'custom.conversionsExceedEntries': '总转化数不能大于总进入数'
});

// 更新漏斗指标验证 schema
export const updateFunnelMetricsSchema = Joi.object({
  totalEntries: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '总进入数必须是数字',
      'number.integer': '总进入数必须是整数',
      'number.min': '总进入数不能小于0'
    }),

  totalConversions: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '总转化数必须是数字',
      'number.integer': '总转化数必须是整数',
      'number.min': '总转化数不能小于0'
    }),

  totalRevenue: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '总收入必须是数字',
      'number.min': '总收入不能小于0'
    }),

  totalCost: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '总成本必须是数字',
      'number.min': '总成本不能小于0'
    }),

  avgTimeSpent: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '平均停留时间必须是数字',
      'number.integer': '平均停留时间必须是整数（秒）',
      'number.min': '平均停留时间不能小于0'
    }),

  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注长度不能超过1000个字符'
    }),

  customMetrics: Joi.object()
    .optional()
    .messages({
      'object.base': '自定义指标必须是对象格式'
    }),

  overallConversionRate: Joi.number()
    .min(0)
    .max(1)
    .optional()
    .messages({
      'number.base': '总体转化率必须是数字',
      'number.min': '总体转化率不能小于0',
      'number.max': '总体转化率不能大于1'
    })
}).custom((value, helpers) => {
  // 自定义验证：如果提供了两个值，总转化数不能大于总进入数
  if (value.totalEntries !== undefined && value.totalConversions !== undefined) {
    if (value.totalConversions > value.totalEntries) {
      return helpers.error('custom.conversionsExceedEntries');
    }
  }
  return value;
}).messages({
  'custom.conversionsExceedEntries': '总转化数不能大于总进入数'
});

// ==============================================================
// Node Metrics Validation Schemas
// ==============================================================

// 创建节点指标验证 schema
export const createNodeMetricsSchema = Joi.object({
  nodeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '节点ID格式无效',
      'any.required': '节点ID是必填项'
    }),

  periodType: Joi.string()
    .valid(...periodTypes)
    .required()
    .messages({
      'any.only': `周期类型必须是 ${periodTypes.join(', ')} 之一`,
      'any.required': '周期类型是必填项'
    }),

  periodStartDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': '开始日期格式无效',
      'any.required': '开始日期是必填项'
    }),

  periodEndDate: Joi.date()
    .iso()
    .min(Joi.ref('periodStartDate'))
    .required()
    .messages({
      'date.format': '结束日期格式无效',
      'date.min': '结束日期不能早于开始日期',
      'any.required': '结束日期是必填项'
    }),

  entryCount: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '进入数量必须是数字',
      'number.integer': '进入数量必须是整数',
      'number.min': '进入数量不能小于0'
    }),

  exitCount: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '退出数量必须是数字',
      'number.integer': '退出数量必须是整数',
      'number.min': '退出数量不能小于0'
    }),

  convertedCount: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '转化数量必须是数字',
      'number.integer': '转化数量必须是整数',
      'number.min': '转化数量不能小于0'
    }),

  bounceCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '跳出数量必须是数字',
      'number.integer': '跳出数量必须是整数',
      'number.min': '跳出数量不能小于0'
    }),

  avgTimeSpent: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '平均停留时间必须是数字',
      'number.integer': '平均停留时间必须是整数（秒）',
      'number.min': '平均停留时间不能小于0'
    }),

  revenue: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '收入必须是数字',
      'number.min': '收入不能小于0'
    }),

  cost: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '成本必须是数字',
      'number.min': '成本不能小于0'
    }),

  impressions: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '展示次数必须是数字',
      'number.integer': '展示次数必须是整数',
      'number.min': '展示次数不能小于0'
    }),

  clicks: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '点击次数必须是数字',
      'number.integer': '点击次数必须是整数',
      'number.min': '点击次数不能小于0'
    }),

  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注长度不能超过1000个字符'
    }),

  customMetrics: Joi.object()
    .optional()
    .messages({
      'object.base': '自定义指标必须是对象格式'
    })
}).custom((value, helpers) => {
  // 自定义验证逻辑
  const errors: string[] = [];

  // 转化数量不能大于进入数量
  if (value.convertedCount > value.entryCount) {
    errors.push('convertedCountExceedsEntry');
  }

  // 退出数量不能大于进入数量
  if (value.exitCount > value.entryCount) {
    errors.push('exitCountExceedsEntry');
  }

  // 跳出数量不能大于进入数量
  if (value.bounceCount && value.bounceCount > value.entryCount) {
    errors.push('bounceCountExceedsEntry');
  }

  // 点击次数不能大于展示次数
  if (value.clicks && value.impressions && value.clicks > value.impressions) {
    errors.push('clicksExceedImpressions');
  }

  if (errors.length > 0) {
    return helpers.error('custom.validationFailed', { errors });
  }

  return value;
}).messages({
  'custom.validationFailed': '数据验证失败',
  'custom.convertedCountExceedsEntry': '转化数量不能大于进入数量',
  'custom.exitCountExceedsEntry': '退出数量不能大于进入数量',
  'custom.bounceCountExceedsEntry': '跳出数量不能大于进入数量',
  'custom.clicksExceedImpressions': '点击次数不能大于展示次数'
});

// 更新节点指标验证 schema
export const updateNodeMetricsSchema = Joi.object({
  entryCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '进入数量必须是数字',
      'number.integer': '进入数量必须是整数',
      'number.min': '进入数量不能小于0'
    }),

  exitCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '退出数量必须是数字',
      'number.integer': '退出数量必须是整数',
      'number.min': '退出数量不能小于0'
    }),

  convertedCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '转化数量必须是数字',
      'number.integer': '转化数量必须是整数',
      'number.min': '转化数量不能小于0'
    }),

  bounceCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '跳出数量必须是数字',
      'number.integer': '跳出数量必须是整数',
      'number.min': '跳出数量不能小于0'
    }),

  avgTimeSpent: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '平均停留时间必须是数字',
      'number.integer': '平均停留时间必须是整数（秒）',
      'number.min': '平均停留时间不能小于0'
    }),

  revenue: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '收入必须是数字',
      'number.min': '收入不能小于0'
    }),

  cost: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .messages({
      'number.base': '成本必须是数字',
      'number.min': '成本不能小于0'
    }),

  impressions: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '展示次数必须是数字',
      'number.integer': '展示次数必须是整数',
      'number.min': '展示次数不能小于0'
    }),

  clicks: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '点击次数必须是数字',
      'number.integer': '点击次数必须是整数',
      'number.min': '点击次数不能小于0'
    }),

  notes: Joi.string()
    .max(1000)
    .allow('')
    .optional()
    .messages({
      'string.max': '备注长度不能超过1000个字符'
    }),

  customMetrics: Joi.object()
    .optional()
    .messages({
      'object.base': '自定义指标必须是对象格式'
    })
});

// 批量创建节点指标验证 schema
export const batchCreateNodeMetricsSchema = Joi.object({
  nodeMetrics: Joi.array()
    .items(createNodeMetricsSchema)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少需要提供一条节点指标数据',
      'array.max': '一次最多只能创建50条节点指标数据',
      'any.required': '节点指标数据是必填项'
    })
});

// 批量更新节点指标验证 schema
export const batchUpdateNodeMetricsSchema = Joi.object({
  updates: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .uuid()
          .required()
          .messages({
            'string.uuid': '指标ID格式无效',
            'any.required': '指标ID是必填项'
          }),
        data: updateNodeMetricsSchema.required()
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少需要提供一条更新数据',
      'array.max': '一次最多只能更新50条记录',
      'any.required': '更新数据是必填项'
    })
});

// ==============================================================
// Query Parameter Validation Schemas
// ==============================================================

// 指标查询参数验证 schema
export const metricsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码必须大于0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100'
    }),

  periodType: Joi.string()
    .valid(...periodTypes)
    .optional()
    .messages({
      'any.only': `周期类型必须是 ${periodTypes.join(', ')} 之一`
    }),

  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': '开始日期格式无效'
    }),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.format': '结束日期格式无效',
      'date.min': '结束日期不能早于开始日期'
    }),

  sort: Joi.string()
    .valid('periodStartDate', 'totalEntries', 'totalConversions', 'overallConversionRate', 'totalRevenue', 'createdAt', 'updatedAt')
    .default('periodStartDate')
    .messages({
      'any.only': '排序字段无效'
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序方向只能是 asc 或 desc'
    })
});

// 节点指标查询参数验证 schema
export const nodeMetricsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  periodType: Joi.string()
    .valid(...periodTypes)
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional(),

  sort: Joi.string()
    .valid('periodStartDate', 'entryCount', 'convertedCount', 'conversionRate', 'revenue', 'createdAt', 'updatedAt')
    .default('periodStartDate'),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

// ==============================================================
// Template Generation Validation Schema
// ==============================================================

// 数据录入模板生成验证 schema
export const generateTemplateSchema = Joi.object({
  funnelId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '漏斗ID格式无效',
      'any.required': '漏斗ID是必填项'
    }),

  periodType: Joi.string()
    .valid(...periodTypes)
    .required()
    .messages({
      'any.only': `周期类型必须是 ${periodTypes.join(', ')} 之一`,
      'any.required': '周期类型是必填项'
    }),

  periodStartDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': '开始日期格式无效',
      'any.required': '开始日期是必填项'
    })
});

// ==============================================================
// UUID Parameter Validation Schema
// ==============================================================

// UUID 参数验证 schema
export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '无效的ID格式',
      'any.required': 'ID是必填项'
    }),
  
  funnelId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '无效的漏斗ID格式'
    }),

  nodeId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '无效的节点ID格式'
    }),

  metricsId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '无效的指标ID格式'
    })
});