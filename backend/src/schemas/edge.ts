import Joi from 'joi';

// 创建边验证 schema
export const createEdgeSchema = Joi.object({
  funnelId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '漏斗ID格式无效',
      'any.required': '漏斗ID是必填项'
    }),

  sourceNodeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '源节点ID格式无效',
      'any.required': '源节点ID是必填项'
    }),

  targetNodeId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '目标节点ID格式无效',
      'any.required': '目标节点ID是必填项'
    })
}).custom((value, helpers) => {
  // 自定义验证：源节点和目标节点不能相同
  if (value.sourceNodeId === value.targetNodeId) {
    return helpers.error('custom.sameSourceAndTarget');
  }
  return value;
}).messages({
  'custom.sameSourceAndTarget': '源节点和目标节点不能相同'
});

// 批量创建边验证 schema
export const batchCreateEdgeSchema = Joi.object({
  funnelId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': '漏斗ID格式无效',
      'any.required': '漏斗ID是必填项'
    }),

  edges: Joi.array()
    .items(
      Joi.object({
        sourceNodeId: Joi.string()
          .uuid()
          .required()
          .messages({
            'string.uuid': '源节点ID格式无效',
            'any.required': '源节点ID是必填项'
          }),

        targetNodeId: Joi.string()
          .uuid()
          .required()
          .messages({
            'string.uuid': '目标节点ID格式无效',
            'any.required': '目标节点ID是必填项'
          })
      }).custom((edgeValue, edgeHelpers) => {
        // 验证每条边的源节点和目标节点不能相同
        if (edgeValue.sourceNodeId === edgeValue.targetNodeId) {
          return edgeHelpers.error('custom.sameSourceAndTarget');
        }
        return edgeValue;
      })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少需要提供一条边',
      'array.max': '一次最多只能创建50条边',
      'any.required': '边数据是必填项'
    })
}).custom((value, helpers) => {
  // 验证批量创建的边中不能有重复的源节点-目标节点组合
  const edgeSet = new Set();
  for (const edge of value.edges) {
    const edgeKey = `${edge.sourceNodeId}-${edge.targetNodeId}`;
    if (edgeSet.has(edgeKey)) {
      return helpers.error('custom.duplicateEdge');
    }
    edgeSet.add(edgeKey);
  }
  return value;
}).messages({
  'custom.sameSourceAndTarget': '源节点和目标节点不能相同',
  'custom.duplicateEdge': '不能创建重复的边'
});

// 更新边验证 schema
export const updateEdgeSchema = Joi.object({
  sourceNodeId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '源节点ID格式无效'
    }),

  targetNodeId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '目标节点ID格式无效'
    })
}).custom((value, helpers) => {
  // 自定义验证：如果同时提供了源节点和目标节点，它们不能相同
  if (value.sourceNodeId && value.targetNodeId && value.sourceNodeId === value.targetNodeId) {
    return helpers.error('custom.sameSourceAndTarget');
  }
  return value;
}).messages({
  'custom.sameSourceAndTarget': '源节点和目标节点不能相同'
});

// 边查询参数验证 schema
export const getEdgesQuerySchema = Joi.object({
  sourceNodeId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '源节点ID格式无效'
    }),

  targetNodeId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': '目标节点ID格式无效'
    }),

  includeNodes: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': '包含节点信息参数必须是布尔值'
    }),

  sort: Joi.string()
    .valid('createdAt')
    .default('createdAt')
    .messages({
      'any.only': '排序字段只能是 createdAt'
    }),

  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': '排序方向只能是 asc 或 desc'
    })
});

// 批量删除边验证 schema
export const batchDeleteEdgeSchema = Joi.object({
  edgeIds: Joi.array()
    .items(
      Joi.string()
        .uuid()
        .messages({
          'string.uuid': '边ID格式无效'
        })
    )
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': '至少需要提供一个边ID',
      'array.max': '一次最多只能删除50条边',
      'any.required': '边ID列表是必填项'
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