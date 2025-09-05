# 📚 Pathfinder API 文档

## 📋 目录

1. [概述](#概述)
2. [认证](#认证)
3. [错误处理](#错误处理)
4. [API 端点](#api-端点)
5. [数据模型](#数据模型)
6. [请求示例](#请求示例)
7. [状态码](#状态码)

## 🔍 概述

Pathfinder API 是一个RESTful API，用于管理销售转化漏斗、用户数据和AI陪练功能。

### 基础信息
- **基础URL**: `http://localhost:3001/api`
- **版本**: v1.0
- **内容类型**: `application/json`
- **字符编码**: UTF-8

### API 设计原则
- 遵循RESTful设计规范
- 使用标准HTTP状态码
- 统一的错误响应格式
- 支持分页和过滤
- 幂等性操作

## 🔐 认证

API 使用JWT (JSON Web Token) 进行身份验证。

### 获取Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 使用Token
在后续请求中添加Authorization头：
```http
Authorization: Bearer <your_jwt_token>
```

### Token 刷新
```http
POST /api/auth/refresh
Authorization: Bearer <your_refresh_token>
```

## ❌ 错误处理

### 统一错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ],
    "timestamp": "2024-01-20T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### 常见错误代码
- `AUTHENTICATION_FAILED`: 认证失败
- `AUTHORIZATION_FAILED`: 权限不足
- `VALIDATION_ERROR`: 请求参数验证失败
- `RESOURCE_NOT_FOUND`: 资源不存在
- `DUPLICATE_RESOURCE`: 资源已存在
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `INTERNAL_SERVER_ERROR`: 服务器内部错误

## 📡 API 端点

### 🔑 认证相关

#### POST /auth/login
用户登录

**请求体:**
```json
{
  "email": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": "7d"
  }
}
```

#### POST /auth/register
用户注册

**请求体:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

#### GET /auth/me
获取当前用户信息

**需要认证:** ✅

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /auth/logout
用户登出

**需要认证:** ✅

### 🔄 漏斗管理

#### GET /funnels
获取用户的漏斗列表

**需要认证:** ✅

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 100)
- `search`: 搜索关键词
- `sortBy`: 排序字段 (createdAt, updatedAt, name)
- `sortOrder`: 排序方向 (asc, desc)

**响应:**
```json
{
  "success": true,
  "data": {
    "funnels": [
      {
        "id": 1,
        "name": "SaaS产品销售漏斗",
        "description": "典型的SaaS产品销售转化流程",
        "nodeCount": 6,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### POST /funnels
创建新漏斗

**需要认证:** ✅

**请求体:**
```json
{
  "name": "string",
  "description": "string",
  "canvasData": {
    "nodes": [
      {
        "id": "node-1",
        "type": "awareness",
        "position": { "x": 100, "y": 200 },
        "data": { "label": "广告展示" }
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
}
```

#### GET /funnels/{id}
获取指定漏斗详情

**需要认证:** ✅

**响应:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "SaaS产品销售漏斗",
    "description": "典型的SaaS产品销售转化流程",
    "canvasData": {
      "nodes": [...],
      "edges": [...]
    },
    "nodes": [
      {
        "id": 1,
        "nodeType": "awareness",
        "label": "广告展示",
        "positionX": 100,
        "positionY": 200
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT /funnels/{id}
更新漏斗信息

**需要认证:** ✅

**请求体:**
```json
{
  "name": "string",
  "description": "string",
  "canvasData": {
    "nodes": [...],
    "edges": [...]
  }
}
```

#### DELETE /funnels/{id}
删除漏斗

**需要认证:** ✅

### 📊 节点数据管理

#### GET /nodes/{nodeId}/data
获取节点的历史数据

**需要认证:** ✅

**查询参数:**
- `startDate`: 开始日期 (ISO 8601格式)
- `endDate`: 结束日期 (ISO 8601格式)
- `groupBy`: 分组方式 (week, month)

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "weekStartDate": "2024-01-15T00:00:00Z",
      "entryCount": 1000,
      "convertedCount": 400,
      "conversionRate": 0.40
    }
  ]
}
```

#### POST /nodes/{nodeId}/data
为节点添加数据

**需要认证:** ✅

**请求体:**
```json
{
  "weekStartDate": "2024-01-15T00:00:00Z",
  "entryCount": 1000,
  "convertedCount": 400
}
```

#### PUT /nodes/{nodeId}/data/{dataId}
更新节点数据

**需要认证:** ✅

### 📈 分析服务

#### GET /analytics/funnel/{funnelId}
获取漏斗分析数据

**需要认证:** ✅

**查询参数:**
- `period`: 分析周期 (7d, 30d, 90d)
- `compareWith`: 对比周期 (previous, same_period_last_year)

**响应:**
```json
{
  "success": true,
  "data": {
    "funnelPerformance": {
      "totalEntries": 10000,
      "totalConversions": 200,
      "overallConversionRate": 0.02,
      "period": "30d"
    },
    "bottleneckAnalysis": {
      "biggestBottleneck": {
        "nodeId": 4,
        "nodeName": "产品演示",
        "lossRate": 0.70,
        "lostUsers": 700,
        "impact": "high"
      },
      "allBottlenecks": [
        {
          "nodeId": 4,
          "nodeName": "产品演示", 
          "lossRate": 0.70,
          "severity": "critical"
        }
      ]
    },
    "trends": {
      "weeklyData": [
        {
          "week": "2024-01-15",
          "conversions": 50,
          "entries": 2500,
          "conversionRate": 0.02
        }
      ],
      "trendDirection": "declining",
      "changeRate": -0.15
    },
    "nodePerformance": [
      {
        "nodeId": 1,
        "nodeName": "广告展示",
        "avgConversionRate": 0.04,
        "trend": "stable",
        "benchmark": "above_average"
      }
    ]
  }
}
```

#### GET /analytics/dashboard
获取仪表板数据

**需要认证:** ✅

**响应:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFunnels": 5,
      "activeFunnels": 3,
      "totalConversions": 1250,
      "averageConversionRate": 0.038
    },
    "recentActivity": [
      {
        "type": "data_updated",
        "funnelId": 1,
        "funnelName": "SaaS销售漏斗",
        "timestamp": "2024-01-20T10:00:00Z"
      }
    ],
    "topPerformingFunnels": [
      {
        "id": 1,
        "name": "SaaS销售漏斗",
        "conversionRate": 0.045,
        "trend": "improving"
      }
    ]
  }
}
```

### 🤖 AI 陪练服务

#### GET /ai/scenarios
获取AI陪练场景列表

**需要认证:** ✅

**查询参数:**
- `difficulty`: 难度级别 (easy, medium, hard)
- `category`: 场景分类 (invitation, objection_handling, closing)

**响应:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "scenario": "invitation_demo",
      "title": "产品演示邀约",
      "description": "模拟邀请潜在客户参加产品演示的对话场景",
      "difficulty": "medium",
      "category": "invitation",
      "estimatedDuration": "10-15分钟"
    }
  ]
}
```

#### POST /ai/sessions
创建AI陪练会话

**需要认证:** ✅

**请求体:**
```json
{
  "scenarioId": 1,
  "nodeId": 4,
  "userContext": {
    "role": "销售代表",
    "productType": "SaaS工具",
    "customerType": "企业客户"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_123456",
    "scenario": {
      "title": "产品演示邀约",
      "customerPersona": {
        "name": "王总",
        "role": "技术总监"
      }
    },
    "initialMessage": "您好，我是AI客户王总。听说你们有个新的产品解决方案？"
  }
}
```

#### POST /ai/sessions/{sessionId}/messages
发送消息到AI陪练会话

**需要认证:** ✅

**请求体:**
```json
{
  "message": "王总您好，是的，我们的产品可以帮助您提升开发效率30%以上。"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "aiResponse": "听起来不错，但我们现在很忙，没时间了解新工具。",
    "feedback": {
      "score": 7,
      "suggestions": [
        "可以强调演示只需要15分钟",
        "提及具体的ROI数据更有说服力"
      ]
    },
    "sessionStatus": "active"
  }
}
```

### 🔧 系统服务

#### GET /health
健康检查

**响应:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "redis": "healthy",
      "ai_service": "healthy"
    }
  }
}
```

#### GET /version
获取API版本信息

**响应:**
```json
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "buildDate": "2024-01-20",
    "environment": "development",
    "features": [
      "funnel_modeling",
      "data_analytics", 
      "ai_coaching"
    ]
  }
}
```

## 🗃 数据模型

### User (用户)
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Funnel (漏斗)
```typescript
interface Funnel {
  id: number;
  userId: number;
  name: string;
  description?: string;
  canvasData: {
    nodes: FunnelNode[];
    edges: FunnelEdge[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface FunnelNode {
  id: string;
  type: 'awareness' | 'acquisition' | 'activation' | 'revenue' | 'retention';
  position: { x: number; y: number };
  data: { label: string };
}

interface FunnelEdge {
  id: string;
  source: string;
  target: string;
}
```

### Node (节点)
```typescript
interface Node {
  id: number;
  funnelId: number;
  nodeType: 'awareness' | 'acquisition' | 'activation' | 'revenue' | 'retention';
  label: string;
  positionX: number;
  positionY: number;
  createdAt: Date;
}
```

### NodeData (节点数据)
```typescript
interface NodeData {
  id: number;
  nodeId: number;
  weekStartDate: Date;
  entryCount: number;
  convertedCount: number;
  conversionRate: number;
  createdAt: Date;
}
```

### Edge (边)
```typescript
interface Edge {
  id: number;
  funnelId: number;
  sourceNodeId: number;
  targetNodeId: number;
}
```

## 🔍 请求示例

### 创建漏斗的完整示例

```bash
# 1. 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@pathfinder.com",
    "password": "candidate123"
  }'

# 响应会包含token
# "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. 创建漏斗
curl -X POST http://localhost:3001/api/funnels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "我的销售漏斗",
    "description": "用于测试的销售漏斗",
    "canvasData": {
      "nodes": [
        {
          "id": "node-1",
          "type": "awareness",
          "position": { "x": 100, "y": 200 },
          "data": { "label": "品牌认知" }
        },
        {
          "id": "node-2", 
          "type": "acquisition",
          "position": { "x": 300, "y": 200 },
          "data": { "label": "获客转化" }
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
  }'

# 3. 为节点添加数据
curl -X POST http://localhost:3001/api/nodes/1/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "weekStartDate": "2024-01-15T00:00:00Z",
    "entryCount": 1000,
    "convertedCount": 400
  }'
```

### 获取分析数据示例

```bash
# 获取漏斗分析数据
curl -X GET "http://localhost:3001/api/analytics/funnel/1?period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 获取仪表板数据
curl -X GET http://localhost:3001/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### AI陪练使用示例

```bash
# 1. 获取可用场景
curl -X GET http://localhost:3001/api/ai/scenarios \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 2. 创建陪练会话
curl -X POST http://localhost:3001/api/ai/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "scenarioId": 1,
    "nodeId": 4,
    "userContext": {
      "role": "销售代表",
      "productType": "SaaS工具"
    }
  }'

# 3. 发送消息
curl -X POST http://localhost:3001/api/ai/sessions/session_123456/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "message": "您好王总，我想为您演示一下我们的新产品。"
  }'
```

## 📋 状态码

### 成功响应
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `204 No Content`: 请求成功但无返回内容

### 客户端错误
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `422 Unprocessable Entity`: 请求格式正确但语义错误
- `429 Too Many Requests`: 请求频率超限

### 服务器错误
- `500 Internal Server Error`: 服务器内部错误
- `502 Bad Gateway`: 网关错误
- `503 Service Unavailable`: 服务不可用

---

## 📝 更新日志

### v1.0.0 (2024-01-20)
- 初始版本发布
- 基础的漏斗管理功能
- 用户认证和授权
- 数据分析服务
- AI陪练基础功能

---

## 📞 支持

如果你在使用API时遇到问题，请：

1. 检查本文档中的示例
2. 使用提供的测试脚本验证环境
3. 查看服务器日志获取详细错误信息
4. 联系技术支持: tech-support@pathfinder.com

---

*本文档会随着API的更新而持续更新。建议开发者关注版本变更和新功能发布。*