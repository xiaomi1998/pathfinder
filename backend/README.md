# Pathfinder Backend API

Pathfinder 项目的 Node.js + Express + TypeScript 后端 API。

## 技术栈

- **Node.js** - JavaScript 运行环境
- **Express.js** - Web 应用框架  
- **TypeScript** - 类型安全的 JavaScript
- **Prisma** - 现代数据库 ORM
- **PostgreSQL** - 关系型数据库
- **JWT** - 用户认证
- **Docker** - 容器化部署

## 功能特性

- 🔐 **用户认证系统** - 注册、登录、JWT 认证
- 📊 **漏斗管理** - 创建、编辑、删除漏斗
- 🔗 **节点和连接管理** - 漏斗节点的增删改查
- 📈 **数据分析** - 转化率统计和性能分析
- 🤖 **AI 功能** - 智能对话和分析建议
- 🛡️ **安全特性** - 请求验证、错误处理、日志记录
- 🚀 **高性能** - 缓存、压缩、速率限制

## 项目结构

```
backend/
├── src/
│   ├── types/          # TypeScript 类型定义
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑服务
│   ├── middleware/     # 中间件
│   ├── utils/          # 工具函数
│   └── app.ts          # 应用入口文件
├── prisma/
│   └── schema.prisma   # 数据库模型定义
├── Dockerfile.dev      # 开发环境容器配置
├── package.json        # 项目依赖配置
├── tsconfig.json       # TypeScript 配置
└── .env.example        # 环境变量示例
```

## 快速开始

### 1. 环境要求

- Node.js 18.0.0+
- PostgreSQL 13+
- npm 9.0.0+

### 2. 安装依赖

```bash
cd backend
npm install
```

### 3. 环境配置

复制环境变量文件并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键参数：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/pathfinder"
JWT_SECRET="your-super-secure-jwt-secret-key"
```

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库 schema (开发环境)
npm run db:push

# 或者使用迁移 (生产环境推荐)
npm run db:migrate
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3001` 启动。

### 6. 健康检查

访问 `http://localhost:3001/health` 验证服务器状态。

## API 文档

### 认证端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| GET  | `/api/auth/verify` | 验证令牌 |

### 用户管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/api/users/me` | 获取当前用户信息 |
| PUT  | `/api/users/me` | 更新用户信息 |
| PUT  | `/api/users/me/password` | 更改密码 |
| GET  | `/api/users/me/stats` | 获取用户统计 |

### 漏斗管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/api/funnels` | 获取用户漏斗列表 |
| POST | `/api/funnels` | 创建新漏斗 |
| GET  | `/api/funnels/:id` | 获取漏斗详情 |
| PUT  | `/api/funnels/:id` | 更新漏斗 |
| DELETE | `/api/funnels/:id` | 删除漏斗 |

### 节点管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/nodes` | 创建节点 |
| GET  | `/api/nodes/:id` | 获取节点详情 |
| PUT  | `/api/nodes/:id` | 更新节点 |
| DELETE | `/api/nodes/:id` | 删除节点 |

### AI 功能

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/ai/chat` | AI 对话 |
| POST | `/api/ai/analyze` | 漏斗分析 |
| GET  | `/api/ai/sessions` | 获取对话历史 |

## 开发指南

### 数据库操作

```bash
# 查看数据库状态
npm run db:studio

# 重置数据库
npm run db:reset

# 生成种子数据
npm run db:seed
```

### 代码规范

```bash
# 类型检查
npm run type-check

# 代码检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run format
```

### 测试

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch
```

## Docker 部署

### 开发环境

```bash
# 构建开发镜像
docker build -f Dockerfile.dev -t pathfinder-backend:dev .

# 运行容器
docker run -p 3001:3001 --env-file .env pathfinder-backend:dev
```

### 生产环境

使用项目根目录的 `docker-compose.yml`：

```bash
cd ..
docker-compose up -d backend
```

## 环境变量说明

### 必需变量

- `DATABASE_URL` - PostgreSQL 数据库连接字符串
- `JWT_SECRET` - JWT 签名密钥 (至少32个字符)

### 可选变量

- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务器端口 (默认: 3001)
- `FRONTEND_URL` - 前端应用 URL (CORS 配置)
- `JWT_EXPIRES_IN` - JWT 过期时间 (默认: 7d)
- `LOG_LEVEL` - 日志级别 (error/warn/info/debug)

## 监控与日志

### 日志系统

- 开发环境：控制台输出彩色日志
- 生产环境：文件日志 + 结构化格式
- 支持日志级别：error, warn, info, debug

### 健康检查

访问 `/health` 端点获取服务状态：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

## 安全特性

- **JWT 认证** - 基于令牌的用户认证
- **密码哈希** - bcrypt 加密存储
- **输入验证** - express-validator 参数验证  
- **CORS 配置** - 跨域请求控制
- **速率限制** - 防止 API 滥用
- **安全头** - Helmet 中间件
- **错误处理** - 统一错误响应格式

## 性能优化

- **数据库索引** - 优化查询性能
- **响应压缩** - gzip 压缩
- **请求缓存** - Redis 缓存支持
- **连接池** - Prisma 连接管理
- **分页查询** - 大数据集分页处理

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认 PostgreSQL 服务运行
   - 验证数据库用户权限

2. **JWT 认证错误**
   - 检查 `JWT_SECRET` 设置
   - 确认令牌格式正确
   - 验证令牌未过期

3. **端口占用**
   - 修改 `PORT` 环境变量
   - 检查端口是否被占用

### 调试模式

启用详细日志：

```bash
LOG_LEVEL=debug npm run dev
```

## 贡献指南

1. Fork 项目仓库
2. 创建功能分支
3. 提交代码更改  
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License - 查看 [LICENSE](../LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请创建 Issue 或联系开发团队。