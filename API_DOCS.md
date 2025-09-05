# 📚 Pathfinder API 接口文档

[![API Version](https://img.shields.io/badge/API-v1.0-blue)](https://github.com/pathfinder/pathfinder)
[![Last Updated](https://img.shields.io/badge/updated-2024--01--15-green)]()

## 📖 概述

Pathfinder API 是一个 RESTful API，提供完整的销售漏斗分析和管理功能。本文档详细描述了所有可用的接口端点、请求参数、响应格式和示例。

### 基础信息

- **API 基础URL**: `http://localhost:3001/api`
- **API 版本**: v1.0
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时区**: UTC

### 通用响应格式

所有API响应都遵循统一的格式：

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // 实际返回的数据
  },
  "pagination": {  // 分页数据（如适用）
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User friendly error message",
    "details": "Technical error details",
    "field": "fieldName" // 字段验证错误时提供
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或令牌无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## 🔐 认证接口

### 用户注册

创建新用户账户。

**接口**: `POST /api/auth/register`

**请求参数**:
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "user"  // 可选: user, admin
}
```

**参数说明**:
- `name`: 用户姓名 (必需, 2-50字符)
- `email`: 邮箱地址 (必需, 有效邮箱格式)
- `password`: 密码 (必需, 8-100字符，至少包含数字和字母)
- `confirmPassword`: 确认密码 (必需, 必须与password一致)
- `role`: 用户角色 (可选, 默认为user)

**响应示例**:
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "user": {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 用户登录

用户身份验证和令牌获取。

**接口**: `POST /api/auth/login`

**请求参数**:
```json
{
  "email": "zhangsan@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "user",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### 刷新令牌

使用刷新令牌获取新的访问令牌。

**接口**: `POST /api/auth/refresh`

**请求头**:
```
Authorization: Bearer {refresh_token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "令牌刷新成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 用户登出

注销当前用户会话。

**接口**: `POST /api/auth/logout`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户已成功登出"
}
```

### 获取用户信息

获取当前登录用户的详细信息。

**接口**: `GET /api/auth/profile`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "张三",
      "email": "zhangsan@example.com",
      "role": "user",
      "avatar": "https://example.com/avatar.jpg",
      "settings": {
        "language": "zh-CN",
        "timezone": "Asia/Shanghai",
        "notifications": true
      },
      "createdAt": "2024-01-10T08:00:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 更新用户信息

更新当前用户的个人信息。

**接口**: `PUT /api/auth/profile`

**请求头**:
```
Authorization: Bearer {access_token}
```

**请求参数**:
```json
{
  "name": "张三丰",
  "avatar": "https://example.com/new-avatar.jpg",
  "settings": {
    "language": "en-US",
    "timezone": "America/New_York",
    "notifications": false
  }
}
```

## 🔄 漏斗管理接口

### 获取漏斗列表

获取用户的漏斗列表，支持分页和筛选。

**接口**: `GET /api/funnels`

**请求头**:
```
Authorization: Bearer {access_token}
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词 (可选)
- `status`: 状态筛选 (active, inactive, archived)
- `sortBy`: 排序字段 (name, createdAt, updatedAt)
- `sortOrder`: 排序方向 (asc, desc)

**请求示例**:
```
GET /api/funnels?page=1&limit=10&search=销售&status=active&sortBy=updatedAt&sortOrder=desc
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "funnels": [
      {
        "id": "funnel-123",
        "name": "电商销售漏斗",
        "description": "从浏览到购买的完整转化路径",
        "status": "active",
        "nodeCount": 5,
        "totalConversions": 1250,
        "conversionRate": 8.5,
        "owner": {
          "id": "user-123",
          "name": "张三"
        },
        "createdAt": "2024-01-10T08:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 创建漏斗

创建新的转化漏斗。

**接口**: `POST /api/funnels`

**请求头**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**请求参数**:
```json
{
  "name": "新产品销售漏斗",
  "description": "2024年新产品推广转化漏斗",
  "category": "sales",
  "nodes": [
    {
      "id": "node-1",
      "name": "首次访问",
      "type": "entry",
      "description": "用户首次访问产品页面",
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "node-2", 
      "name": "注册账户",
      "type": "conversion",
      "description": "用户完成账户注册",
      "position": { "x": 100, "y": 200 }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "漏斗创建成功",
  "data": {
    "funnel": {
      "id": "funnel-124",
      "name": "新产品销售漏斗", 
      "description": "2024年新产品推广转化漏斗",
      "category": "sales",
      "status": "draft",
      "nodeCount": 2,
      "owner": {
        "id": "user-123",
        "name": "张三"
      },
      "createdAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### 获取漏斗详情

获取特定漏斗的详细信息，包括完整的节点和连接数据。

**接口**: `GET /api/funnels/{id}`

**请求头**:
```
Authorization: Bearer {access_token}
```

**路径参数**:
- `id`: 漏斗ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "funnel": {
      "id": "funnel-123",
      "name": "电商销售漏斗",
      "description": "从浏览到购买的完整转化路径",
      "category": "ecommerce",
      "status": "active",
      "settings": {
        "autoRefresh": true,
        "refreshInterval": 300
      },
      "nodes": [
        {
          "id": "node-1",
          "name": "产品浏览",
          "type": "entry",
          "description": "用户浏览产品页面",
          "position": { "x": 200, "y": 100 },
          "metrics": {
            "totalUsers": 10000,
            "uniqueUsers": 8500,
            "conversionRate": 15.2
          }
        },
        {
          "id": "node-2",
          "name": "加入购物车",
          "type": "conversion",
          "description": "用户将产品加入购物车",
          "position": { "x": 200, "y": 250 },
          "metrics": {
            "totalUsers": 1520,
            "uniqueUsers": 1450,
            "conversionRate": 45.3
          }
        }
      ],
      "edges": [
        {
          "id": "edge-1",
          "source": "node-1",
          "target": "node-2",
          "metrics": {
            "conversions": 1520,
            "conversionRate": 15.2
          }
        }
      ],
      "analytics": {
        "totalConversions": 657,
        "overallConversionRate": 6.57,
        "avgTimeToConvert": 1800,
        "bottleneck": {
          "nodeId": "node-3",
          "nodeName": "付款完成",
          "conversionRate": 43.2
        }
      },
      "owner": {
        "id": "user-123",
        "name": "张三",
        "email": "zhangsan@example.com"
      },
      "permissions": {
        "canEdit": true,
        "canDelete": true,
        "canShare": true
      },
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 更新漏斗

更新现有漏斗的信息。

**接口**: `PUT /api/funnels/{id}`

**请求头**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**请求参数** (部分更新):
```json
{
  "name": "优化后的销售漏斗",
  "description": "经过数据分析优化的销售转化流程",
  "status": "active",
  "nodes": [
    {
      "id": "node-1",
      "name": "产品浏览",
      "type": "entry",
      "description": "更新后的描述",
      "position": { "x": 250, "y": 100 }
    }
  ]
}
```

### 删除漏斗

删除指定的漏斗。

**接口**: `DELETE /api/funnels/{id}`

**请求头**:
```
Authorization: Bearer {access_token}
```

**响应示例**:
```json
{
  "success": true,
  "message": "漏斗已成功删除"
}
```

### 复制漏斗

创建现有漏斗的副本。

**接口**: `POST /api/funnels/{id}/duplicate`

**请求参数**:
```json
{
  "name": "销售漏斗副本",
  "copyData": true  // 是否复制历史数据
}
```

## 🎯 节点管理接口

### 创建节点

在漏斗中创建新节点。

**接口**: `POST /api/funnels/{funnelId}/nodes`

**请求参数**:
```json
{
  "name": "邮件订阅",
  "type": "conversion",
  "description": "用户订阅邮件列表",
  "position": { "x": 300, "y": 150 },
  "settings": {
    "trackingEnabled": true,
    "alertThreshold": 5.0
  }
}
```

### 更新节点

更新节点信息。

**接口**: `PUT /api/nodes/{nodeId}`

### 删除节点

删除指定节点。

**接口**: `DELETE /api/nodes/{nodeId}`

### 批量更新节点数据

批量更新多个节点的转化数据。

**接口**: `POST /api/funnels/{funnelId}/nodes/batch-update`

**请求参数**:
```json
{
  "updates": [
    {
      "nodeId": "node-1",
      "data": {
        "totalUsers": 12000,
        "conversions": 1800,
        "timestamp": "2024-01-15T10:00:00.000Z"
      }
    },
    {
      "nodeId": "node-2", 
      "data": {
        "totalUsers": 1800,
        "conversions": 720,
        "timestamp": "2024-01-15T10:00:00.000Z"
      }
    }
  ]
}
```

## 🔗 连接管理接口

### 创建连接

在节点间创建连接。

**接口**: `POST /api/funnels/{funnelId}/edges`

**请求参数**:
```json
{
  "source": "node-1",
  "target": "node-2",
  "type": "default",
  "settings": {
    "weightingFactor": 1.0
  }
}
```

### 删除连接

删除节点间的连接。

**接口**: `DELETE /api/edges/{edgeId}`

## 📊 数据分析接口

### 获取概览数据

获取用户的整体分析数据概览。

**接口**: `GET /api/analytics/overview`

**查询参数**:
- `timeRange`: 时间范围 (7d, 30d, 90d, 1y)
- `timezone`: 时区 (默认: UTC)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFunnels": 15,
      "activeFunnels": 12,
      "totalConversions": 12500,
      "avgConversionRate": 8.7,
      "improvement": {
        "conversions": 12.5,
        "conversionRate": -2.1
      }
    },
    "topPerformingFunnels": [
      {
        "id": "funnel-123",
        "name": "电商销售漏斗",
        "conversionRate": 15.2,
        "totalConversions": 3200
      }
    ],
    "conversionTrends": [
      {
        "date": "2024-01-08",
        "conversions": 250,
        "conversionRate": 8.5
      },
      {
        "date": "2024-01-09", 
        "conversions": 280,
        "conversionRate": 9.1
      }
    ]
  }
}
```

### 获取漏斗分析数据

获取特定漏斗的详细分析数据。

**接口**: `GET /api/analytics/funnel/{id}`

**查询参数**:
- `timeRange`: 时间范围
- `granularity`: 数据粒度 (hour, day, week, month)
- `metrics`: 指标类型 (conversions, rates, times)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "funnelId": "funnel-123",
    "timeRange": "30d",
    "metrics": {
      "totalEntries": 50000,
      "totalConversions": 3200,
      "overallConversionRate": 6.4,
      "avgTimeToConvert": 2400,
      "bounceRate": 23.5
    },
    "nodeAnalytics": [
      {
        "nodeId": "node-1",
        "nodeName": "产品浏览",
        "entries": 50000,
        "conversions": 7600,
        "conversionRate": 15.2,
        "avgTimeSpent": 120,
        "dropoffRate": 84.8
      }
    ],
    "conversionPaths": [
      {
        "path": ["node-1", "node-2", "node-5"],
        "count": 1200,
        "conversionRate": 2.4
      }
    ],
    "bottlenecks": [
      {
        "nodeId": "node-4",
        "nodeName": "支付页面",
        "conversionRate": 42.1,
        "severity": "high",
        "suggestedActions": ["优化支付流程", "减少表单字段"]
      }
    ],
    "timeSeries": [
      {
        "timestamp": "2024-01-15T00:00:00.000Z",
        "entries": 2100,
        "conversions": 134,
        "conversionRate": 6.38
      }
    ]
  }
}
```

### 获取趋势分析

获取转化趋势和预测数据。

**接口**: `GET /api/analytics/trends`

**查询参数**:
- `funnelIds`: 漏斗ID列表 (可选)
- `timeRange`: 时间范围
- `includePrediction`: 是否包含预测 (默认: false)

### 获取瓶颈分析

识别和分析转化瓶颈。

**接口**: `GET /api/analytics/bottlenecks`

**查询参数**:
- `funnelId`: 漏斗ID (可选)
- `threshold`: 瓶颈阈值 (默认: 50.0)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "bottlenecks": [
      {
        "funnelId": "funnel-123",
        "funnelName": "电商销售漏斗",
        "nodeId": "node-4",
        "nodeName": "支付确认",
        "conversionRate": 38.2,
        "severity": "critical",
        "impact": {
          "lostConversions": 890,
          "potentialRevenue": 45000
        },
        "recommendations": [
          {
            "type": "ux_improvement",
            "title": "简化支付流程",
            "description": "减少支付步骤和表单字段",
            "estimatedImprovement": 12.5
          },
          {
            "type": "trust_signals",
            "title": "增加信任标识",
            "description": "添加安全证书和支付保障标识",
            "estimatedImprovement": 8.3
          }
        ],
        "relatedMetrics": {
          "avgTimeOnPage": 45.2,
          "exitRate": 61.8,
          "mobileConversionRate": 25.1
        }
      }
    ]
  }
}
```

## 🤖 AI 优化接口

### 获取AI建议

基于漏斗数据获取AI优化建议。

**接口**: `GET /api/ai/suggestions`

**查询参数**:
- `funnelId`: 漏斗ID
- `type`: 建议类型 (optimization, content, design)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "suggestion-1",
        "type": "optimization",
        "priority": "high",
        "title": "优化结账流程",
        "description": "基于数据分析，建议简化结账步骤以提升转化率",
        "impact": {
          "estimatedImprovement": 15.2,
          "confidence": 0.85
        },
        "actionItems": [
          "移除非必要的表单字段",
          "实现一键支付选项",
          "优化移动端支付体验"
        ],
        "basedOn": [
          "低支付转化率 (38.2%)",
          "高支付页面跳出率 (61.8%)",
          "移动端转化率显著低于桌面端"
        ]
      }
    ]
  }
}
```

### AI聊天对话

与AI助手进行对话，获取个性化建议。

**接口**: `POST /api/ai/chat`

**请求参数**:
```json
{
  "message": "我的电商漏斗支付环节转化率很低，该如何优化？",
  "context": {
    "funnelId": "funnel-123",
    "nodeId": "node-4"
  },
  "conversationId": "conv-456" // 可选，用于保持对话上下文
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "response": "根据您的漏斗数据分析，支付环节的转化率确实偏低。我建议从以下几个方面进行优化：\n\n1. **简化支付流程**：减少支付步骤，考虑实现一键支付\n2. **增强信任感**：添加安全证书、退款保证等信任标识\n3. **优化移动端体验**：您的移动端转化率明显低于桌面端\n\n需要我详细说明其中某个方面吗？",
    "conversationId": "conv-456",
    "suggestedQuestions": [
      "如何实现一键支付功能？",
      "有哪些信任标识比较有效？",
      "移动端优化的具体建议？"
    ]
  }
}
```

## 👥 用户管理接口 (管理员)

### 获取用户列表

获取所有用户列表 (仅管理员)。

**接口**: `GET /api/admin/users`

**权限要求**: admin

### 更新用户角色

更新用户的角色权限。

**接口**: `PUT /api/admin/users/{id}/role`

## 📈 导出接口

### 导出漏斗数据

导出漏斗数据为各种格式。

**接口**: `GET /api/export/funnel/{id}`

**查询参数**:
- `format`: 导出格式 (csv, xlsx, pdf)
- `includeAnalytics`: 是否包含分析数据

**响应**: 文件下载

### 导出分析报告

生成和下载分析报告。

**接口**: `POST /api/export/report`

**请求参数**:
```json
{
  "funnelIds": ["funnel-123", "funnel-456"],
  "timeRange": "30d",
  "format": "pdf",
  "sections": ["summary", "trends", "bottlenecks", "recommendations"]
}
```

## ⚙️ 系统接口

### 健康检查

检查API服务状态。

**接口**: `GET /api/health`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "ai": "healthy"
    },
    "uptime": 86400
  }
}
```

### 获取系统配置

获取客户端需要的系统配置。

**接口**: `GET /api/config`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "features": {
      "aiEnabled": true,
      "exportEnabled": true,
      "collaborationEnabled": true
    },
    "limits": {
      "maxFunnelsPerUser": 50,
      "maxNodesPerFunnel": 100,
      "dataRetentionDays": 365
    },
    "ui": {
      "defaultTheme": "light",
      "supportedLanguages": ["zh-CN", "en-US"]
    }
  }
}
```

## 🔧 Webhooks

### 漏斗数据更新

当漏斗数据更新时触发。

**URL**: 用户配置的webhook URL

**方法**: POST

**载荷示例**:
```json
{
  "event": "funnel.data.updated",
  "funnelId": "funnel-123",
  "userId": "user-456",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "nodeId": "node-1",
    "previousValue": 1000,
    "newValue": 1200,
    "change": 20.0
  }
}
```

## 📝 错误代码

### 认证相关错误

| 错误代码 | HTTP状态 | 说明 |
|---------|----------|------|
| `AUTH_INVALID_CREDENTIALS` | 401 | 邮箱或密码错误 |
| `AUTH_TOKEN_EXPIRED` | 401 | 访问令牌已过期 |
| `AUTH_TOKEN_INVALID` | 401 | 无效的令牌格式 |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | 权限不足 |
| `AUTH_USER_DISABLED` | 403 | 用户账户被禁用 |

### 业务逻辑错误

| 错误代码 | HTTP状态 | 说明 |
|---------|----------|------|
| `FUNNEL_NOT_FOUND` | 404 | 漏斗不存在 |
| `FUNNEL_ACCESS_DENIED` | 403 | 无权访问漏斗 |
| `NODE_INVALID_TYPE` | 422 | 无效的节点类型 |
| `EDGE_CIRCULAR_DEPENDENCY` | 422 | 检测到循环依赖 |
| `DATA_VALIDATION_FAILED` | 422 | 数据验证失败 |

### 系统错误

| 错误代码 | HTTP状态 | 说明 |
|---------|----------|------|
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂不可用 |
| `DATABASE_ERROR` | 500 | 数据库操作失败 |
| `AI_SERVICE_ERROR` | 500 | AI服务调用失败 |

## 🚀 使用示例

### JavaScript 示例

```javascript
// 初始化API客户端
class PathfinderAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API请求失败');
    }
    
    return data;
  }

  // 获取漏斗列表
  async getFunnels(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/funnels?${query}`);
  }

  // 创建漏斗
  async createFunnel(funnelData) {
    return this.request('/api/funnels', {
      method: 'POST',
      body: JSON.stringify(funnelData)
    });
  }

  // 获取分析数据
  async getAnalytics(funnelId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/analytics/funnel/${funnelId}?${query}`);
  }
}

// 使用示例
const api = new PathfinderAPI('http://localhost:3001', 'your-token-here');

// 创建新漏斗
const newFunnel = await api.createFunnel({
  name: '产品销售漏斗',
  description: '从访问到购买的完整流程',
  nodes: [
    { id: 'visit', name: '访问', type: 'entry' },
    { id: 'register', name: '注册', type: 'conversion' },
    { id: 'purchase', name: '购买', type: 'goal' }
  ],
  edges: [
    { source: 'visit', target: 'register' },
    { source: 'register', target: 'purchase' }
  ]
});

console.log('漏斗创建成功:', newFunnel);
```

### Python 示例

```python
import requests
import json

class PathfinderAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
    
    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.request(
            method, url, 
            headers=self.headers, 
            json=data
        )
        
        if not response.ok:
            raise Exception(f"API Error: {response.status_code}")
        
        return response.json()
    
    def get_funnels(self, **params):
        return self.request('/api/funnels', params=params)
    
    def create_funnel(self, funnel_data):
        return self.request('/api/funnels', 'POST', funnel_data)

# 使用示例
api = PathfinderAPI('http://localhost:3001', 'your-token-here')

# 获取漏斗列表
funnels = api.get_funnels(limit=10, status='active')
print(f"找到 {len(funnels['data']['funnels'])} 个活跃漏斗")
```

## 🔗 相关链接

- [项目主页](https://github.com/pathfinder/pathfinder)
- [在线演示](https://demo.pathfinder.com)
- [问题反馈](https://github.com/pathfinder/pathfinder/issues)
- [技术支持](mailto:support@pathfinder.com)

---

**最后更新**: 2024年1月15日  
**文档版本**: v1.0  
**API版本**: v1.0