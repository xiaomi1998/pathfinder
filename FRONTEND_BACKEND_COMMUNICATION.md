# Pathfinder 前后端数据通信架构详解

## 一、通信架构概览

```
┌─────────────────┐         HTTP/HTTPS          ┌─────────────────┐
│                 │ ──────────────────────────> │                 │
│   Vue 前端      │         RESTful API         │  Express 后端   │
│   (Port 8080)   │ <────────────────────────── │   (Port 3001)   │
└─────────────────┘         JSON Response       └─────────────────┘
        ↓                                                ↓
    Axios 客户端                                    Prisma ORM
        ↓                                                ↓
    Pinia Store                                   PostgreSQL DB
```

## 二、核心通信机制

### 1. 🔐 认证机制

#### JWT Token 认证流程
```javascript
// 1. 用户登录
POST /api/auth/login
Body: { email: "user@example.com", password: "******" }

// 2. 后端返回 JWT Token
Response: {
  success: true,
  data: {
    user: { id, email, username },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// 3. 前端存储 Token
localStorage.setItem('token', token)

// 4. 后续请求携带 Token
Headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### 2. 📡 Axios 客户端配置

**文件位置**: `frontend/src/api/client.ts`

```typescript
// Axios 实例配置
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 Token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }
)

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token 过期，跳转登录
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

## 三、数据传输流程详解

### 1. 🔄 完整的数据请求生命周期

```
用户操作 → Vue组件 → API层 → Axios → 后端路由 → 服务层 → 数据库
    ↑                                                      ↓
    └──────────── 响应数据 ← Pinia更新 ← JSON响应 ←────────┘
```

### 2. 📊 具体示例：漏斗数据录入

#### 前端发起请求
```typescript
// frontend/src/views/metrics/FunnelDataEntry.vue
const submitData = async () => {
  const data = {
    funnelId: selectedFunnel.value.id,
    periodType: 'weekly',
    periodStartDate: '2025-09-12',
    totalEntries: 9999,
    totalConversions: 1111,
    overallConversionRate: 0.1111,
    customMetrics: {
      stageData: {
        'node_1': 9999,
        'node_2': 7777,
        'node_3': 3333,
        'node_4': 1111
      }
    }
  }
  
  // 调用 API
  await funnelMetricsAPI.createFunnelMetrics(funnelId, data)
}
```

#### API 封装层
```typescript
// frontend/src/api/funnelMetrics.ts
export const funnelMetricsAPI = {
  createFunnelMetrics: (funnelId: string, data: any) => {
    return apiClient.post(`/funnel-metrics/${funnelId}`, data)
  }
}
```

#### 后端接收处理
```typescript
// backend/src/routes/funnel-metrics.ts
router.post('/:funnelId', authMiddleware, async (req, res) => {
  const { funnelId } = req.params
  const userId = req.user.id
  const data = req.body
  
  // 调用服务层
  const result = await funnelMetricsService.create(funnelId, userId, data)
  
  res.json({
    success: true,
    data: result
  })
})
```

#### 服务层处理
```typescript
// backend/src/services/FunnelMetricsService.ts
async create(funnelId: string, userId: string, data: any) {
  // 数据验证
  const validated = funnelMetricsSchema.parse(data)
  
  // 写入数据库
  const metrics = await prisma.funnelMetrics.create({
    data: {
      funnelId,
      ...validated
    }
  })
  
  return metrics
}
```

## 四、数据格式规范

### 1. 📤 请求数据格式

```typescript
// 标准请求格式
interface RequestData {
  // 路径参数
  params?: Record<string, string>
  
  // 查询参数
  query?: Record<string, any>
  
  // 请求体
  body?: {
    [key: string]: any
  }
  
  // 请求头
  headers?: {
    'Authorization': string
    'Content-Type': string
  }
}
```

### 2. 📥 响应数据格式

```typescript
// 成功响应
interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// 错误响应
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}
```

## 五、关键通信场景

### 1. 🔐 用户认证流程

```
登录 → 获取Token → 存储Token → 携带Token请求 → 验证Token → 返回数据
```

**涉及文件**:
- 前端: `src/views/auth/Login.vue`, `src/stores/auth.ts`
- 后端: `src/routes/auth.ts`, `src/services/AuthService.ts`

### 2. 📊 仪表盘数据加载

```
页面加载 → 并发请求多个API → 聚合数据 → 更新Store → 渲染UI
```

**关键API调用**:
```javascript
// 并发请求
Promise.all([
  dashboardAPI.getFunnelMetrics(funnelId),
  dashboardAPI.getTrendData(funnelId),
  dashboardAPI.getRecentActivities()
])
```

### 3. 🔄 实时数据更新

```
数据录入 → 提交到后端 → 更新数据库 → 刷新前端数据 → 更新UI
```

**数据同步机制**:
```javascript
// 提交后刷新
await submitData()
await loadFunnels() // 重新加载数据
```

## 六、错误处理机制

### 1. 前端错误处理
```typescript
try {
  const response = await apiClient.post('/api/endpoint', data)
  // 处理成功
} catch (error) {
  if (error.response) {
    // 服务器返回错误
    console.error('Server Error:', error.response.data)
  } else if (error.request) {
    // 请求发送失败
    console.error('Network Error')
  } else {
    // 其他错误
    console.error('Error:', error.message)
  }
}
```

### 2. 后端错误处理
```typescript
// 全局错误中间件
app.use((err, req, res, next) => {
  logger.error(err)
  res.status(err.status || 500).json({
    success: false,
    error: err.message,
    code: err.code
  })
})
```

## 七、性能优化策略

### 1. 🚀 请求优化
- **防抖节流**: 搜索输入使用防抖
- **缓存策略**: 静态数据使用本地缓存
- **批量请求**: 合并多个请求为一个
- **懒加载**: 按需加载数据

### 2. 📦 数据压缩
- **Gzip压缩**: 服务器启用压缩
- **分页加载**: 大数据集分页
- **字段筛选**: 只请求需要的字段

### 3. ⚡ 并发控制
```javascript
// 限制并发数
const concurrentLimit = 5
const queue = new PQueue({ concurrency: concurrentLimit })
```

## 八、安全措施

### 1. 🔒 安全机制
- **JWT Token**: 有效期24小时
- **CORS配置**: 限制跨域访问
- **请求限流**: 防止API滥用
- **数据验证**: Zod schema验证
- **SQL注入防护**: Prisma ORM参数化查询

### 2. 🛡️ CORS 配置
```javascript
// backend/src/app.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}))
```

## 九、WebSocket 实时通信（规划中）

### 未来增强功能
```javascript
// Socket.io 实时更新
socket.on('funnel-updated', (data) => {
  // 实时更新漏斗数据
  store.updateFunnel(data)
})
```

## 十、调试技巧

### 1. 🔍 前端调试
```javascript
// 开启 Axios 调试日志
apiClient.interceptors.request.use(request => {
  console.log('Starting Request:', request)
  return request
})

apiClient.interceptors.response.use(response => {
  console.log('Response:', response)
  return response
})
```

### 2. 🔍 后端调试
```javascript
// Winston 日志
logger.info('Request received', { 
  method: req.method, 
  url: req.url,
  body: req.body 
})
```

### 3. 🔍 网络调试
- Chrome DevTools Network面板
- Postman API测试
- Prisma Studio数据查看

## 十一、常见问题

### Q1: Token过期怎么处理？
**A**: 响应拦截器自动跳转登录页，用户重新登录获取新Token

### Q2: 如何处理大文件上传？
**A**: 使用FormData和multipart/form-data，配置较大的timeout

### Q3: 如何优化首屏加载？
**A**: 路由懒加载、组件异步加载、CDN静态资源

### Q4: 如何处理并发请求？
**A**: 使用Promise.all并发，使用AbortController取消请求

## 十二、最佳实践

1. **统一错误处理**: 使用拦截器统一处理
2. **Loading状态管理**: 全局Loading组件
3. **请求去重**: 防止重复提交
4. **接口版本管理**: URL包含版本号
5. **敏感信息保护**: 不在日志中记录密码等信息
6. **超时重试机制**: 网络异常自动重试
7. **接口文档维护**: 使用Swagger/OpenAPI