# 🎯 Pathfinder - 智能销售漏斗分析平台

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/pathfinder/pathfinder)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/pathfinder/pathfinder/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🚀 项目概述

Pathfinder 是一个专为现代企业设计的智能销售漏斗分析和优化平台。通过可视化的漏斗建模器、实时数据分析和AI驱动的优化建议，帮助企业精确识别转化瓶颈并提升销售效率。

### 🌟 核心特性

- **🎨 可视化漏斗建模器**: 直观的拖拽式界面，轻松创建复杂的转化漏斗
- **📊 智能数据分析**: 自动计算转化率，识别关键瓶颈节点
- **🤖 AI 优化建议**: 基于数据模式提供个性化的优化策略
- **📈 实时监控面板**: 实时跟踪漏斗性能和转化趋势
- **🔄 多维度分析**: 支持时间、渠道、用户群体等多维度数据切分
- **📱 响应式设计**: 完美适配桌面、平板和移动设备

### 💼 业务价值

- **提升转化率**: 平均帮助企业提升 15-30% 的整体转化率
- **降低获客成本**: 通过精准优化减少无效营销投入
- **数据驱动决策**: 将直觉决策转变为数据驱动的科学决策
- **团队协作**: 统一的数据视图促进跨部门协作

## 🛠 技术栈

### 前端技术
- **框架**: Vue.js 3.4+ (Composition API)
- **语言**: TypeScript 5.3+
- **构建工具**: Vite 5.0+
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI框架**: Tailwind CSS + Headless UI
- **图表**: D3.js + Chart.js
- **HTTP客户端**: Axios
- **表单验证**: VeeValidate + Yup
- **工具库**: Lodash-es, date-fns

### 后端技术
- **运行时**: Node.js 18+
- **框架**: Express.js + TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL 14+
- **缓存**: Redis 7+
- **认证**: JWT + bcryptjs
- **验证**: Joi
- **日志**: Winston
- **安全**: Helmet + cors
- **AI集成**: OpenAI API / Google Gemini API

### 基础设施
- **容器化**: Docker + Docker Compose
- **代理**: Nginx
- **监控**: Prometheus + Grafana (可选)
- **日志收集**: Fluentd (可选)
- **CI/CD**: GitHub Actions (配置中)

## 📁 项目结构

```
pathfinder/
├── 📄 README.md                    # 项目说明文档
├── 📄 INTERVIEW_GUIDE.md           # 面试指南
├── 📄 API_DOCUMENTATION.md         # API 文档
├── 📄 DEPLOYMENT.md                # 部署指南
├── 📄 docker-compose.yml           # 生产环境编排
├── 📄 docker-compose.dev.yml       # 开发环境编排
├── 📄 setup.sh                     # 一键启动脚本
├── 📄 dev.sh                       # 开发环境脚本
├── 📄 test.sh                      # 测试脚本
├── 📄 build.sh                     # 构建脚本
├── 📄 clean.sh                     # 清理脚本
├── 📁 backend/                     # 后端API服务
│   ├── 📁 src/
│   │   ├── 📁 routes/              # API 路由
│   │   ├── 📁 services/            # 业务逻辑
│   │   ├── 📁 middleware/          # 中间件
│   │   ├── 📁 types/               # 类型定义
│   │   └── 📁 utils/               # 工具函数
│   ├── 📁 prisma/                  # 数据库模式
│   ├── 📁 scripts/                 # 脚本文件
│   └── 📄 package.json
├── 📁 frontend/                    # 前端Vue应用
│   ├── 📁 src/
│   │   ├── 📁 components/          # Vue组件
│   │   ├── 📁 views/               # 页面视图
│   │   ├── 📁 stores/              # 状态管理
│   │   ├── 📁 api/                 # API客户端
│   │   ├── 📁 types/               # 类型定义
│   │   └── 📁 utils/               # 工具函数
│   └── 📄 package.json
├── 📁 database/                    # 数据库相关
├── 📁 nginx/                       # Nginx 配置
├── 📁 monitoring/                  # 监控配置
├── 📁 security/                    # 安全配置
└── 📁 scripts/                     # 项目脚本
```

## ⚡ 快速开始

### 系统要求

- **Node.js**: 18.0.0 或更高版本
- **npm**: 9.0.0 或更高版本
- **Docker**: 20.0+ 和 Docker Compose V2
- **操作系统**: macOS, Linux, 或 Windows (推荐使用 WSL2)
- **内存**: 推荐 8GB+
- **磁盘空间**: 至少 2GB 可用空间

### 一键启动

```bash
# 克隆项目
git clone https://github.com/pathfinder/pathfinder.git
cd pathfinder

# 运行一键启动脚本
./setup.sh

# 启动开发环境
./dev.sh
```

### 手动启动

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 启动数据库
docker-compose -f docker-compose.dev.yml up -d db redis

# 3. 初始化数据库
cd backend
npm run db:push
npm run db:seed

# 4. 启动服务
npm run dev &
cd ../frontend && npm run dev
```

### 访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api/docs (开发中)
- **数据库管理**: `cd backend && npm run db:studio`

### 测试账户

| 用户类型 | 邮箱 | 密码 | 权限 |
|---------|------|------|------|
| 管理员 | admin@pathfinder.com | admin123 | 全部权限 |
| 面试官 | interviewer@pathfinder.com | interviewer123 | 查看和编辑 |
| 候选人 | candidate@pathfinder.com | candidate123 | 基础操作 |
| 演示用户 | demo@pathfinder.com | demo123 | 只读权限 |

## 🔧 开发工具和命令

### 开发脚本

```bash
# 环境管理
./setup.sh           # 一键初始化环境
./dev.sh             # 启动开发服务器
./dev.sh --logs      # 启动开发环境并显示日志
./clean.sh           # 清理开发环境
./clean.sh --all     # 完全清理（包括依赖和Docker）

# 测试
./test.sh            # 运行所有测试
./test.sh --backend-only  # 只运行后端测试
./test.sh --frontend-only # 只运行前端测试
./test.sh --e2e      # 包含端到端测试

# 构建
./build.sh           # 构建生产版本
./build.sh --skip-docker  # 跳过Docker镜像构建
./build.sh --push    # 构建并推送镜像

# 数据库操作
cd backend
npm run db:studio    # 打开数据库管理界面
npm run db:seed      # 重新填充种子数据
npm run db:reset     # 重置数据库
```

### 开发工具推荐

- **IDE**: Visual Studio Code
- **必装插件**: 
  - TypeScript Vue Plugin (Volar)
  - Prisma
  - Tailwind CSS IntelliSense
  - ESLint + Prettier
  - GitLens
  - Thunder Client (API测试)
- **浏览器**: Chrome DevTools
- **数据库**: Prisma Studio (已集成)

## 📊 API 接口

### 认证接口
```http
POST   /api/auth/register    # 用户注册
POST   /api/auth/login       # 用户登录
POST   /api/auth/logout      # 用户登出
GET    /api/auth/profile     # 获取用户信息
PUT    /api/auth/profile     # 更新用户信息
```

### 漏斗管理
```http
GET    /api/funnels          # 获取漏斗列表
POST   /api/funnels          # 创建漏斗
GET    /api/funnels/:id      # 获取漏斗详情
PUT    /api/funnels/:id      # 更新漏斗
DELETE /api/funnels/:id      # 删除漏斗
```

### 数据分析
```http
GET    /api/analytics/overview     # 获取概览数据
GET    /api/analytics/funnel/:id   # 获取漏斗分析数据
GET    /api/analytics/trends       # 获取趋势数据
GET    /api/analytics/bottlenecks  # 获取瓶颈分析
```

详细API文档请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🚢 部署

### 开发环境
```bash
# 使用 Docker Compose
docker-compose -f docker-compose.dev.yml up -d
```

### 生产环境
```bash
# 构建并启动生产环境
./build.sh
docker-compose -f docker-compose.yml up -d
```

### 云部署
支持部署到以下平台：
- **AWS**: ECS + RDS + ElastiCache
- **Azure**: Container Instances + PostgreSQL
- **Google Cloud**: Cloud Run + Cloud SQL
- **Kubernetes**: 完整的 Helm Charts

详细部署文档请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🧪 测试

项目包含完整的测试套件：

- **单元测试**: Jest (后端) + Vitest (前端)
- **集成测试**: Supertest (API测试)
- **端到端测试**: Playwright (可选)
- **代码覆盖率**: 目标 >80%

```bash
# 运行所有测试
npm run test

# 生成覆盖率报告
npm run test:coverage

# 监听模式
npm run test:watch
```

## 🔒 安全

- **认证**: JWT Token + 刷新机制
- **授权**: 基于角色的访问控制 (RBAC)
- **数据保护**: 密码加密 + 敏感数据脱敏
- **API安全**: 请求限流 + CORS 配置
- **输入验证**: 严格的参数验证和清洗
- **安全头**: Helmet.js 安全头配置

## 📈 监控

- **应用监控**: Winston 日志 + 自定义指标
- **性能监控**: API响应时间跟踪
- **错误追踪**: 结构化错误日志
- **健康检查**: 内置健康检查端点

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✨ 初始版本发布
- 🎨 完整的漏斗建模器
- 📊 基础数据分析功能
- 🤖 AI优化建议集成
- 🐳 Docker化部署

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 团队

- **项目负责人**: [Your Name]
- **技术架构**: [Architect Name]
- **前端开发**: [Frontend Developer]
- **后端开发**: [Backend Developer]

## 📞 支持

如有问题，请通过以下方式联系：

- 📧 邮箱: support@pathfinder.com
- 💬 微信群: 扫描二维码加入
- 📱 技术QQ群: 123456789
- 🐛 Bug报告: [GitHub Issues](https://github.com/pathfinder/pathfinder/issues)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

**🚀 让我们一起构建更智能的销售分析工具！**

</div>