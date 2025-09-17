import Joi from 'joi';

// 用户注册验证 schema
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.base': '姓名必须是字符串',
      'string.min': '姓名长度不能少于2个字符',
      'string.max': '姓名长度不能超过50个字符',
      'any.required': '姓名是必填项'
    }),

  phone: Joi.string()
    .pattern(/^1[3-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': '请输入有效的手机号码',
      'any.required': '手机号是必填项'
    }),

  verification_code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.pattern.base': '验证码必须为6位数字',
      'any.required': '验证码是必填项'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': '密码长度不能少于8个字符',
      'string.max': '密码长度不能超过128个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码是必填项'
    }),

  password_confirmation: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '确认密码必须与密码一致',
      'any.required': '确认密码是必填项'
    }),

  terms_accepted: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': '必须同意服务条款',
      'any.required': '必须同意服务条款'
    })
});

// 用户登录验证 schema
export const loginSchema = Joi.object({
  email: Joi.alternatives()
    .try(
      Joi.string().email(),
      Joi.string().pattern(/^1[3-9]\d{9}$/)
    )
    .required()
    .messages({
      'alternatives.match': '请输入有效的手机号码',
      'any.required': '手机号是必填项'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': '密码是必填项'
    })
});

// 重置密码请求验证 schema
export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
      'any.required': '邮箱是必填项'
    })
});

// 重置密码验证 schema
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': '重置令牌是必填项'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': '密码长度不能少于8个字符',
      'string.max': '密码长度不能超过128个字符',
      'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      'any.required': '密码是必填项'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': '确认密码必须与密码一致',
      'any.required': '确认密码是必填项'
    })
});

// 更改密码验证 schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': '当前密码是必填项'
    }),

  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': '新密码长度不能少于8个字符',
      'string.max': '新密码长度不能超过128个字符',
      'string.pattern.base': '新密码必须包含大小写字母、数字和特殊字符',
      'any.required': '新密码是必填项'
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': '确认密码必须与新密码一致',
      'any.required': '确认密码是必填项'
    })
});