import Joi from 'joi';

// 创建漏斗验证 schema
export const createFunnelSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': '漏斗名称不能为空',
      'string.max': '漏斗名称长度不能超过100个字符',
      'any.required': '漏斗名称是必填项'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '描述长度不能超过500个字符'
    }),

  canvasData: Joi.object()
    .optional()
    .messages({
      'object.base': '画布数据必须是对象格式'
    })
});

// 更新漏斗验证 schema
export const updateFunnelSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': '漏斗名称不能为空',
      'string.max': '漏斗名称长度不能超过100个字符'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': '描述长度不能超过500个字符'
    }),

  canvasData: Joi.object()
    .optional()
    .messages({
      'object.base': '画布数据必须是对象格式'
    })
});

// 漏斗查询参数验证 schema
export const getFunnelsQuerySchema = Joi.object({
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

  search: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': '搜索关键词长度不能超过100个字符'
    }),

  sort: Joi.string()
    .valid('name', 'createdAt', 'updatedAt')
    .default('createdAt')
    .messages({
      'any.only': '排序字段只能是 name, createdAt, updatedAt 之一'
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序方向只能是 asc 或 desc'
    })
});

// UUID 参数验证 schema
export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '无效的ID格式',
      'any.required': 'ID是必填项'
    })
});

// 漏斗导出参数验证 schema
export const exportFunnelSchema = Joi.object({
  format: Joi.string()
    .valid('json', 'csv', 'xlsx')
    .default('json')
    .messages({
      'any.only': '导出格式只能是 json, csv, xlsx 之一'
    }),

  includeData: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': '包含数据参数必须是布尔值'
    }),

  dateRange: Joi.object({
    startDate: Joi.date()
      .iso()
      .required()
      .messages({
        'date.format': '开始日期格式无效',
        'any.required': '开始日期是必填项'
      }),

    endDate: Joi.date()
      .iso()
      .min(Joi.ref('startDate'))
      .required()
      .messages({
        'date.format': '结束日期格式无效',
        'date.min': '结束日期不能早于开始日期',
        'any.required': '结束日期是必填项'
      })
  })
    .optional()
    .messages({
      'object.base': '日期范围必须是对象格式'
    })
});