import Joi from 'joi';

// 更新用户资料验证 schema
export const updateUserProfileSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .optional()
    .messages({
      'string.base': '用户名必须是字符串',
      'string.alphanum': '用户名只能包含字母和数字',
      'string.min': '用户名长度不能少于3个字符',
      'string.max': '用户名长度不能超过50个字符'
    }),

  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': '请输入有效的邮箱地址'
    })
});

// 更新用户设置验证 schema
export const updateUserSettingsSchema = Joi.object({
  language: Joi.string()
    .valid('zh-CN', 'en-US')
    .optional()
    .messages({
      'any.only': '语言只能是 zh-CN 或 en-US'
    }),

  timezone: Joi.string()
    .optional()
    .messages({
      'string.base': '时区必须是字符串'
    }),

  notifications: Joi.object({
    email: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': '邮件通知设置必须是布尔值'
      }),

    push: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': '推送通知设置必须是布尔值'
      }),

    weekly_report: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': '周报通知设置必须是布尔值'
      })
  })
    .optional()
    .messages({
      'object.base': '通知设置必须是对象格式'
    }),

  theme: Joi.string()
    .valid('light', 'dark', 'auto')
    .optional()
    .messages({
      'any.only': '主题只能是 light, dark, auto 之一'
    })
});

// 用户查询参数验证 schema
export const getUsersQuerySchema = Joi.object({
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

  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': '激活状态必须是布尔值'
    }),

  sort: Joi.string()
    .valid('username', 'email', 'createdAt', 'lastLoginAt')
    .default('createdAt')
    .messages({
      'any.only': '排序字段只能是 username, email, createdAt, lastLoginAt 之一'
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序方向只能是 asc 或 desc'
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

// 管理员操作验证 schema
export const adminUserActionSchema = Joi.object({
  action: Joi.string()
    .valid('activate', 'deactivate', 'delete')
    .required()
    .messages({
      'any.only': '操作只能是 activate, deactivate, delete 之一',
      'any.required': '操作类型是必填项'
    }),

  reason: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': '操作原因长度不能超过500个字符'
    })
});

// UUID 参数验证 schema
export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '无效的用户ID格式',
      'any.required': '用户ID是必填项'
    })
});