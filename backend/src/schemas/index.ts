// 导出所有验证 schemas
export * from './auth';
export * from './node';
export * from './metricDataset';

// 导出各模块特定的 schemas，重命名重复的 uuidParamSchema
export * from './funnel';
export { 
  createEdgeSchema, 
  batchCreateEdgeSchema, 
  updateEdgeSchema, 
  getEdgesQuerySchema, 
  batchDeleteEdgeSchema,
  uuidParamSchema as edgeUuidParamSchema 
} from './edge';
export { 
  updateUserProfileSchema, 
  updateUserSettingsSchema, 
  getUsersQuerySchema, 
  adminUserActionSchema,
  uuidParamSchema as userUuidParamSchema 
} from './user';

// 通用的 UUID 参数验证 schema
import Joi from 'joi';

export const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '无效的ID格式',
      'any.required': 'ID是必填项'
    })
});