import Joi from 'joi';

// 漏斗阶段数据验证模式
const funnelStageSchema = Joi.object({
  visitors: Joi.number().integer().min(0).required().messages({
    'number.base': '访问者数必须是数字',
    'number.integer': '访问者数必须是整数',
    'number.min': '访问者数不能为负数',
    'any.required': '访问者数是必填项'
  }),
  converted: Joi.number().integer().min(0).required().messages({
    'number.base': '转化数必须是数字',
    'number.integer': '转化数必须是整数',
    'number.min': '转化数不能为负数',
    'any.required': '转化数是必填项'
  })
}).custom((value, helpers) => {
  // 验证转化数不能超过访问者数
  if (value.converted > value.visitors) {
    return helpers.error('custom.invalidConversion');
  }
  return value;
}).messages({
  'custom.invalidConversion': '转化数不能超过访问者数'
});

// 4阶段漏斗数据验证模式
const funnelMetricDataSchema = Joi.object({
  stage_1: funnelStageSchema.required(),
  stage_2: funnelStageSchema.required(),
  stage_3: funnelStageSchema.required(),
  stage_4: funnelStageSchema.required()
}).custom((value, helpers) => {
  // 验证漏斗数据一致性：下一阶段的访问者数不能超过上一阶段的转化数
  const stages = [value.stage_1, value.stage_2, value.stage_3, value.stage_4];
  
  for (let i = 1; i < stages.length; i++) {
    if (stages[i].visitors > stages[i - 1].converted) {
      return helpers.error('custom.invalidFunnelFlow', { 
        stage: i + 1, 
        previousStage: i 
      });
    }
  }
  
  return value;
}).messages({
  'custom.invalidFunnelFlow': '第{{#stage}}阶段的访问者数不能超过第{{#previousStage}}阶段的转化数'
});

// 创建漏斗指标数据集验证模式
export const createFunnelMetricDatasetSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': '数据集名称不能为空',
    'string.min': '数据集名称至少1个字符',
    'string.max': '数据集名称不能超过100个字符',
    'any.required': '数据集名称是必填项'
  }),
  description: Joi.string().trim().max(500).optional().messages({
    'string.max': '描述不能超过500个字符'
  }),
  stageData: funnelMetricDataSchema.required(),
  industry: Joi.string().trim().max(100).optional().messages({
    'string.max': '行业信息不能超过100个字符'
  }),
  dataSource: Joi.string().valid('manual', 'api', 'import').default('manual').messages({
    'any.only': '数据源必须是 manual、api 或 import 中的一个'
  })
});

// 分析查询参数验证模式
export const analysisQuerySchema = Joi.object({
  includeBenchmarks: Joi.boolean().default(true),
  includeSuggestions: Joi.boolean().default(true)
});

// 更新漏斗指标数据集验证模式
export const updateFunnelMetricDatasetSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': '数据集名称不能为空',
    'string.min': '数据集名称至少1个字符',
    'string.max': '数据集名称不能超过100个字符'
  }),
  description: Joi.string().trim().max(500).optional().allow('').messages({
    'string.max': '描述不能超过500个字符'
  }),
  stageData: funnelMetricDataSchema.optional(),
  industry: Joi.string().trim().max(100).optional().allow('').messages({
    'string.max': '行业信息不能超过100个字符'
  })
});

// UUID 参数验证模式
export const uuidParamSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).required().messages({
    'string.pattern.base': '无效的ID格式'
  })
});

// 数据集查询参数验证模式
export const datasetQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  datasetType: Joi.string().optional(),
  dataSource: Joi.string().valid('manual', 'api', 'import').optional(),
  sort: Joi.string().valid('createdAt', 'updatedAt', 'name').default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc')
});