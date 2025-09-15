# Pathfinder 项目结构说明文档

## 项目概述
Pathfinder 是一个基于 Vue 3 + TypeScript 的前端和 Node.js + Express + Prisma 的后端构建的漏斗分析和数据可视化平台。

## 目录结构

```
Pathfinder/
├── backend/                 # 后端服务目录
├── frontend/                # 前端应用目录
├── database/               # 数据库相关文件
├── scripts/                # 部署和配置脚本
└── 根目录文件              # 项目配置文件
```

## 详细目录说明

### 🔷 后端目录 (backend/)

#### 核心目录结构
```
backend/
├── src/                    # 源代码目录
│   ├── app.ts             # 应用程序入口文件
│   ├── routes/            # API路由定义
│   ├── services/          # 业务逻辑服务层
│   ├── middleware/        # Express中间件
│   ├── schemas/           # 数据验证模式
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── prisma/                # Prisma ORM配置
│   ├── schema.prisma      # 数据库模型定义
│   └── seed.ts           # 数据库种子数据
├── migrations/            # 数据库迁移文件
└── 配置文件
```

#### 路由文件 (src/routes/)
- **auth.ts** - 认证相关路由（登录、注册、登出）
- **organizations.ts** - 组织管理路由
- **funnels.ts** - 漏斗管理CRUD操作
- **funnel-instances.ts** - 漏斗实例管理
- **funnel-metrics.ts** - 漏斗指标数据录入和查询
- **dashboard.ts** - 仪表盘数据聚合API
- **analytics.ts** - 数据分析和报表
- **analysis.ts** - AI分析接口
- **metric-datasets.ts** - 指标数据集管理

#### 服务层 (src/services/)
- **AuthService.ts** - 用户认证和授权逻辑
- **UserService.ts** - 用户管理业务逻辑
- **OrganizationService.ts** - 组织信息管理
- **FunnelService.ts** - 漏斗创建、编辑、删除逻辑
- **FunnelInstanceService.ts** - 漏斗实例化管理
- **FunnelMetricsService.ts** - 指标数据处理和计算
- **DashboardService.ts** - 仪表盘数据聚合服务
- **AnalyticsService.ts** - 数据分析算法实现
- **AiService.ts** - AI集成服务（对接Gemini）
- **BenchmarkService.ts** - 行业基准对比服务
- **IndustryService.ts** - 行业数据管理
- **MetricDatasetService.ts** - 数据集操作服务
- **DiagnosticService.ts** - 系统诊断服务
- **AdminService.ts** - 管理员功能服务

#### 中间件 (src/middleware/)
- **auth.ts** - JWT认证中间件
- **adminAuth.ts** - 管理员权限验证
- **error.ts** - 全局错误处理
- **logger.ts** - 请求日志记录
- **rateLimit.ts** - API限流保护

#### 数据模式 (src/schemas/)
- **auth.ts** - 认证数据验证（Zod）
- **funnel.ts** - 漏斗数据验证
- **funnelMetrics.ts** - 指标数据验证

#### 类型定义 (src/types/)
- **index.ts** - 通用类型定义
- **user.ts** - 用户相关类型
- **funnel.ts** - 漏斗相关类型
- **funnelInstance.ts** - 漏斗实例类型
- **funnelMetrics.ts** - 指标类型
- **analytics.ts** - 分析结果类型

### 🔶 前端目录 (frontend/)

#### 核心目录结构
```
frontend/
├── src/                    # 源代码目录
│   ├── App.vue            # 根组件
│   ├── main.ts            # 应用入口
│   ├── views/             # 页面组件
│   ├── components/        # 可复用组件
│   ├── api/               # API调用封装
│   ├── stores/            # Pinia状态管理
│   ├── router/            # Vue Router配置
│   ├── utils/             # 工具函数
│   ├── types/             # TypeScript类型
│   ├── assets/            # 静态资源
│   └── composables/       # Vue组合式函数
└── 配置文件
```

#### 页面视图 (src/views/)

**认证相关**
- **auth/Login.vue** - 登录页面
- **auth/Register.vue** - 注册页面
- **auth/Onboarding.vue** - 新用户引导

**核心功能页面**
- **Dashboard.vue** - 仪表盘主页
- **Profile.vue** - 用户个人资料
- **Settings.vue** - 系统设置（仅组织信息）

**漏斗管理**
- **funnels/FunnelList.vue** - 漏斗列表页
- **funnels/FunnelDetail.vue** - 漏斗详情页
- **funnels/WorkingFunnelBuilder.vue** - 漏斗构建器
- **funnels/StructureFunnelBuilder.vue** - 结构化漏斗构建
- **funnels/FunnelAnalytics.vue** - 漏斗分析页

**数据录入**
- **metrics/DataEntry.vue** - 通用数据录入
- **metrics/FunnelDataEntry.vue** - 漏斗数据录入

**分析功能**
- **analysis/EnhancedAnalysisView.vue** - 增强分析视图
- **analytics/** - 分析相关页面
- **ai/AICoach.vue** - AI助手页面

#### 组件库 (src/components/)

**通用组件**
- **layout/Navbar.vue** - 导航栏
- **forms/MultiStepForm.vue** - 多步骤表单
- **forms/OrganizationInfoForm.vue** - 组织信息表单

**漏斗相关组件**
- **funnel/FunnelTemplateSelector.vue** - 模板选择器
- **funnel/CreateFunnelInstance.vue** - 创建实例
- **funnel/FunnelInstanceCard.vue** - 实例卡片
- **funnel/FunnelInstanceList.vue** - 实例列表
- **funnel/InstanceSelector.vue** - 实例选择器
- **funnel/StructureToDataMapper.vue** - 数据映射器

**数据指标组件**
- **metrics/DataEntryCalendar.vue** - 数据录入日历
- **metrics/DynamicMetricsTable.vue** - 动态指标表
- **metrics/MetricsPeriodSelector.vue** - 周期选择器

**分析组件**
- **analysis/RecommendationCard.vue** - 推荐卡片
- **analytics/** - 分析相关组件
- **dashboard/** - 仪表盘组件
- **auth/** - 认证相关组件

#### API封装 (src/api/)
- **client.ts** - Axios客户端配置
- **index.ts** - API统一导出
- **auth.ts** - 认证API
- **organization.ts** - 组织API
- **funnel.ts** - 漏斗API
- **funnelInstance.ts** - 实例API
- **funnelMetrics.ts** - 指标API
- **dashboard.ts** - 仪表盘API
- **analytics.ts** - 分析API
- **metrics.ts** - 通用指标API

#### 状态管理 (src/stores/)
- **app.ts** - 应用全局状态
- **auth.ts** - 用户认证状态
- **funnel.ts** - 漏斗数据状态
- **funnelInstance.ts** - 实例状态
- **metricDataset.ts** - 数据集状态
- **metrics.ts** - 指标状态
- **organization.ts** - 组织信息状态

#### 工具函数 (src/utils/)
- **errorHandler.ts** - 错误处理
- **dateUtils.ts** - 日期处理工具
- **navigationDebug.ts** - 导航调试工具

### 📁 数据库目录 (database/)
- **init-shared.psql** - 共享数据库初始化脚本

### 📁 脚本目录 (scripts/)
- **configure-pg-lan-access.sh** - PostgreSQL局域网访问配置

### 📄 根目录重要文件

#### 配置文件
- **.env.example** - 环境变量示例
- **package.json** - 项目依赖和脚本
- **tsconfig.json** - TypeScript配置
- **CLAUDE.md** - AI助手使用说明

#### 文档文件
- **PROJECT_STRUCTURE.md** - 本文档
- **数据库设计文档.md** - 数据库结构说明
- **数据库表字段与用户动作映射详解.md** - 数据模型详解

## 数据流说明

### 用户操作流程
1. **用户认证** → auth路由 → AuthService → 数据库
2. **创建漏斗** → funnels路由 → FunnelService → 保存到数据库
3. **数据录入** → funnel-metrics路由 → FunnelMetricsService → 计算并存储
4. **查看分析** → dashboard/analytics路由 → 聚合服务 → 返回可视化数据

### 核心业务流程
1. **漏斗定义** - 用户通过FunnelBuilder创建漏斗结构
2. **数据采集** - 通过FunnelDataEntry录入各阶段数据
3. **指标计算** - DashboardService计算转化率等关键指标
4. **可视化展示** - Dashboard展示漏斗对比和趋势分析
5. **AI分析** - AiService提供智能建议和预测

## 技术栈说明

### 后端技术
- **Node.js + Express** - Web服务框架
- **TypeScript** - 类型安全
- **Prisma ORM** - 数据库操作
- **PostgreSQL** - 关系型数据库
- **JWT** - 用户认证
- **Zod** - 数据验证
- **Winston** - 日志管理

### 前端技术
- **Vue 3** - 响应式框架
- **TypeScript** - 类型安全
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Axios** - HTTP客户端
- **TailwindCSS** - 样式框架
- **Chart.js** - 图表库
- **VueUse** - 组合式工具库

## 部署架构
- **前端** - 运行在端口 8080
- **后端** - 运行在端口 3001
- **数据库** - PostgreSQL默认端口 5432
- **开发工具** - Prisma Studio端口 5555

## 关键特性
1. **多租户支持** - 基于组织的数据隔离
2. **实时数据更新** - 动态刷新仪表盘
3. **智能ID匹配** - 解决节点ID不一致问题
4. **响应式设计** - 适配多种设备
5. **AI增强分析** - 集成Gemini API提供智能建议

## 维护建议
1. 定期备份数据库
2. 监控API性能指标
3. 定期更新依赖包
4. 保持日志轮转
5. 定期审查安全配置