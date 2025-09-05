import Joi from 'joi';

// 节点类型枚举
const nodeTypes = ['awareness', 'acquisition', 'activation', 'revenue', 'retention'];

// 创建节点验证 schema
export const createNodeSchema = Joi.object({
  funnelId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '漏斗ID格式无效',
      'any.required': '漏斗ID是必填项'
    }),

  nodeType: Joi.string()
    .valid(...nodeTypes)
    .required()
    .messages({
      'any.only': `节点类型必须是 ${nodeTypes.join(', ')} 之一`,
      'any.required': '节点类型是必填项'
    }),

  label: Joi.string()
    .min(1)
    .max(30)
    .default('新节点')
    .messages({
      'string.min': '节点标签不能为空',
      'string.max': '节点标签长度不能超过30个字符'
    }),

  positionX: Joi.number()
    .min(-9999.99)
    .max(9999.99)
    .precision(2)
    .required()
    .messages({
      'number.base': 'X坐标必须是数字',
      'number.min': 'X坐标不能小于-9999.99',
      'number.max': 'X坐标不能大于9999.99',
      'any.required': 'X坐标是必填项'
    }),

  positionY: Joi.number()
    .min(-9999.99)
    .max(9999.99)
    .precision(2)
    .required()
    .messages({
      'number.base': 'Y坐标必须是数字',
      'number.min': 'Y坐标不能小于-9999.99',
      'number.max': 'Y坐标不能大于9999.99',
      'any.required': 'Y坐标是必填项'
    })
});

// 更新节点验证 schema
export const updateNodeSchema = Joi.object({
  nodeType: Joi.string()
    .valid(...nodeTypes)
    .optional()
    .messages({
      'any.only': `节点类型必须是 ${nodeTypes.join(', ')} 之一`
    }),

  label: Joi.string()
    .min(1)
    .max(30)
    .optional()
    .messages({
      'string.min': '节点标签不能为空',
      'string.max': '节点标签长度不能超过30个字符'
    }),

  positionX: Joi.number()
    .min(-9999.99)
    .max(9999.99)
    .precision(2)
    .optional()
    .messages({
      'number.base': 'X坐标必须是数字',
      'number.min': 'X坐标不能小于-9999.99',
      'number.max': 'X坐标不能大于9999.99'
    }),

  positionY: Joi.number()
    .min(-9999.99)
    .max(9999.99)
    .precision(2)
    .optional()
    .messages({
      'number.base': 'Y坐标必须是数字',
      'number.min': 'Y坐标不能小于-9999.99',
      'number.max': 'Y坐标不能大于9999.99'
    })
});

// 创建节点数据验证 schema
export const createNodeDataSchema = Joi.object({
  nodeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '节点ID格式无效',
      'any.required': '节点ID是必填项'
    }),

  weekStartDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': '周开始日期格式无效',
      'any.required': '周开始日期是必填项'
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

  convertedCount: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base': '转化数量必须是数字',
      'number.integer': '转化数量必须是整数',
      'number.min': '转化数量不能小于0'
    })
}).custom((value, helpers) => {
  // 自定义验证：转化数量不能大于进入数量
  if (value.convertedCount > value.entryCount) {
    return helpers.error('custom.convertedCountTooHigh');
  }
  return value;
}).messages({
  'custom.convertedCountTooHigh': '转化数量不能大于进入数量'
});

// 更新节点数据验证 schema
export const updateNodeDataSchema = Joi.object({
  entryCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '进入数量必须是数字',
      'number.integer': '进入数量必须是整数',
      'number.min': '进入数量不能小于0'
    }),

  convertedCount: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': '转化数量必须是数字',
      'number.integer': '转化数量必须是整数',
      'number.min': '转化数量不能小于0'
    })
}).custom((value, helpers) => {
  // 自定义验证：如果提供了两个值，转化数量不能大于进入数量
  if (value.entryCount !== undefined && value.convertedCount !== undefined) {
    if (value.convertedCount > value.entryCount) {
      return helpers.error('custom.convertedCountTooHigh');
    }
  }
  return value;
}).messages({
  'custom.convertedCountTooHigh': '转化数量不能大于进入数量'
});

// 批量创建节点数据验证 schema
export const batchCreateNodeDataSchema = Joi.object({
  data: Joi.array()
    .items(createNodeDataSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': '至少需要提供一条节点数据',
      'array.max': '一次最多只能创建100条节点数据',
      'any.required': '节点数据是必填项'
    })
});

// 节点数据查询参数验证 schema
export const getNodeDataQuerySchema = Joi.object({
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

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.base': '限制数量必须是数字',
      'number.integer': '限制数量必须是整数',
      'number.min': '限制数量必须大于0',
      'number.max': '限制数量不能超过100'
    }),

  sort: Joi.string()
    .valid('weekStartDate', 'entryCount', 'convertedCount', 'conversionRate')
    .default('weekStartDate')
    .messages({
      'any.only': '排序字段只能是 weekStartDate, entryCount, convertedCount, conversionRate 之一'
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序方向只能是 asc 或 desc'
    })
});