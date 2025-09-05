import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

// Joi 验证中间件类型定义
interface ValidationSource {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

// 创建 Joi 验证中间件
export const validate = (schemas: ValidationSource) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: any[] = [];

    // 验证请求体
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const bodyErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          location: 'body'
        }));
        validationErrors.push(...bodyErrors);
      } else {
        req.body = value; // 使用验证后的值（已清理的数据）
      }
    }

    // 验证查询参数
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const queryErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          location: 'query'
        }));
        validationErrors.push(...queryErrors);
      } else {
        req.query = value; // 使用验证后的值
      }
    }

    // 验证路径参数
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const paramErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          location: 'params'
        }));
        validationErrors.push(...paramErrors);
      } else {
        req.params = value; // 使用验证后的值
      }
    }

    // 验证请求头
    if (schemas.headers) {
      const { error, value } = schemas.headers.validate(req.headers, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true // 允许其他标准请求头
      });

      if (error) {
        const headerErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
          location: 'headers'
        }));
        validationErrors.push(...headerErrors);
      }
    }

    // 如果有验证错误，记录并返回错误响应
    if (validationErrors.length > 0) {
      logger.warn('Joi 验证失败:', {
        url: req.url,
        method: req.method,
        errors: validationErrors,
        userId: req.user?.id,
        requestId: req.requestId
      });

      const errorMessage = '请求参数验证失败';
      const apiError = new ApiError(errorMessage, 400, 'VALIDATION_ERROR', validationErrors);
      return next(apiError);
    }

    next();
  };
};

// 快捷方式：仅验证请求体
export const validateBody = (schema: Joi.ObjectSchema) => {
  return validate({ body: schema });
};

// 快捷方式：仅验证查询参数
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return validate({ query: schema });
};

// 快捷方式：仅验证路径参数
export const validateParams = (schema: Joi.ObjectSchema) => {
  return validate({ params: schema });
};

// 快捷方式：验证请求体和查询参数
export const validateBodyAndQuery = (bodySchema: Joi.ObjectSchema, querySchema: Joi.ObjectSchema) => {
  return validate({ body: bodySchema, query: querySchema });
};

// 通用 UUID 参数验证中间件
export const validateUuidParam = (paramName: string = 'id') => {
  const schema = Joi.object({
    [paramName]: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': `无效的${paramName === 'id' ? 'ID' : paramName}格式`,
        'any.required': `${paramName === 'id' ? 'ID' : paramName}是必填项`
      })
  });

  return validateParams(schema);
};

// 分页查询参数验证中间件
export const validatePaginationQuery = validate({
  query: Joi.object({
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

    sort: Joi.string()
      .optional()
      .messages({
        'string.base': '排序字段必须是字符串'
      }),

    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': '排序方向只能是 asc 或 desc'
      })
  })
});

// 日期范围查询参数验证中间件
export const validateDateRangeQuery = validate({
  query: Joi.object({
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
});

// 搜索查询参数验证中间件
export const validateSearchQuery = validate({
  query: Joi.object({
    search: Joi.string()
      .max(100)
      .allow('')
      .optional()
      .messages({
        'string.max': '搜索关键词长度不能超过100个字符'
      })
  })
});

// 批量操作验证中间件工厂
export const validateBatchOperation = (itemSchema: Joi.Schema, maxItems: number = 100) => {
  return validateBody(
    Joi.object({
      items: Joi.array()
        .items(itemSchema)
        .min(1)
        .max(maxItems)
        .required()
        .messages({
          'array.min': '至少需要提供一个项目',
          'array.max': `一次最多只能操作${maxItems}个项目`,
          'any.required': '项目列表是必填项'
        })
    })
  );
};

// 文件上传验证中间件
export const validateFileUpload = validate({
  body: Joi.object({
    fileType: Joi.string()
      .valid('image', 'document', 'csv', 'excel')
      .optional()
      .messages({
        'any.only': '文件类型只能是 image, document, csv, excel 之一'
      }),

    maxSize: Joi.number()
      .integer()
      .min(1)
      .max(10 * 1024 * 1024) // 10MB
      .optional()
      .messages({
        'number.base': '最大文件大小必须是数字',
        'number.integer': '最大文件大小必须是整数',
        'number.min': '最大文件大小必须大于0',
        'number.max': '最大文件大小不能超过10MB'
      })
  })
});