import Joi from 'joi';

// 画布节点验证模式
const canvasNodeSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().required(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).required(),
  data: Joi.object({
    label: Joi.string().required(),
    nodeType: Joi.string().valid('awareness', 'acquisition', 'activation', 'revenue', 'retention').required()
  }).unknown(true).required()
}).unknown(true);

// 画布连接验证模式
const canvasEdgeSchema = Joi.object({
  id: Joi.string().required(),
  source: Joi.string().required(),
  target: Joi.string().required(),
  type: Joi.string().optional()
}).unknown(true);

// 视窗验证模式
const viewportSchema = Joi.object({
  x: Joi.number().required(),
  y: Joi.number().required(),
  zoom: Joi.number().min(0.1).max(10).required()
});

// 模板数据验证模式
const templateDataSchema = Joi.object({
  nodes: Joi.array().items(canvasNodeSchema).min(1).required(),
  edges: Joi.array().items(canvasEdgeSchema).required(),
  viewport: viewportSchema.required(),
  version: Joi.string().required(),
  metadata: Joi.object({
    description: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    createdWith: Joi.string().optional()
  }).unknown(true).optional()
});

// 创建漏斗模板验证模式
export const createFunnelTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
  templateData: templateDataSchema.required(),
  isDefault: Joi.boolean().optional().default(false)
});

// 更新漏斗模板验证模式
export const updateFunnelTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  templateData: templateDataSchema.optional(),
  isDefault: Joi.boolean().optional()
});

// 从模板创建漏斗验证模式
export const createFunnelFromTemplateSchema = Joi.object({
  funnelName: Joi.string().min(1).max(100).required()
});

// ID参数验证模式
export const templateIdSchema = Joi.object({
  templateId: Joi.string().required()
});

export default {
  createFunnelTemplateSchema,
  updateFunnelTemplateSchema,
  createFunnelFromTemplateSchema,
  templateIdSchema
};