import Joi from 'joi';
import { getAllLocationCodes } from '../utils/locationMapping';

// 组织信息更新验证 schema
export const organizationInfoSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': '组织名称必须是字符串',
      'string.min': '组织名称长度不能少于2个字符',
      'string.max': '组织名称长度不能超过100个字符',
      'any.required': '组织名称是必填项'
    }),

  industry: Joi.string()
    .valid(
      'technology',
      'finance',
      'healthcare',
      'education',
      'retail',
      'manufacturing',
      'consulting',
      'media',
      'real_estate',
      'travel',
      'other'
    )
    .messages({
      'any.only': '请选择有效的行业类型'
    }),

  size: Joi.string()
    .valid('1-10', '11-30', '31-100')
    .required()
    .messages({
      'any.only': '请选择有效的团队规模',
      'any.required': '团队规模是必填项'
    }),

  location: Joi.string()
    .valid(...getAllLocationCodes())
    .required()
    .messages({
      'any.only': '请选择有效的省份或地区',
      'any.required': '所在省份是必填项'
    }),

  salesModel: Joi.string()
    .valid('toB', 'toC')
    .required()
    .messages({
      'any.only': '请选择有效的销售模型',
      'any.required': '销售模型是必填项'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': '描述长度不能超过500个字符'
    })
});

// 创建组织验证 schema
export const createOrganizationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': '组织名称必须是字符串',
      'string.min': '组织名称长度不能少于2个字符',
      'string.max': '组织名称长度不能超过100个字符',
      'any.required': '组织名称是必填项'
    }),

  slug: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': '组织标识只能包含小写字母、数字和连字符',
      'string.min': '组织标识长度不能少于2个字符',
      'string.max': '组织标识长度不能超过50个字符'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': '描述长度不能超过500个字符'
    }),

  planType: Joi.string()
    .valid('free', 'pro', 'enterprise')
    .messages({
      'any.only': '请选择有效的计划类型'
    })
});

// 更新组织验证 schema
export const updateOrganizationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.base': '组织名称必须是字符串',
      'string.min': '组织名称长度不能少于2个字符',
      'string.max': '组织名称长度不能超过100个字符'
    }),

  slug: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': '组织标识只能包含小写字母、数字和连字符',
      'string.min': '组织标识长度不能少于2个字符',
      'string.max': '组织标识长度不能超过50个字符'
    }),

  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': '描述长度不能超过500个字符'
    }),

  planType: Joi.string()
    .valid('free', 'pro', 'enterprise')
    .messages({
      'any.only': '请选择有效的计划类型'
    }),

  isActive: Joi.boolean()
    .messages({
      'boolean.base': '活跃状态必须是布尔值'
    })
});