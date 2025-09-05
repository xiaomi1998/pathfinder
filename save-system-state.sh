#!/bin/bash

# Pathfinder 系统状态保存脚本
# 创建时间: $(date '+%Y-%m-%d %H:%M:%S')

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="./system-snapshots"
SNAPSHOT_NAME="pathfinder_snapshot_${TIMESTAMP}"
SNAPSHOT_PATH="${BACKUP_DIR}/${SNAPSHOT_NAME}"

echo -e "${BLUE}🔄 Pathfinder 系统状态保存开始...${NC}"

# 1. 创建保存目录
echo -e "${YELLOW}📁 创建快照目录...${NC}"
mkdir -p "${SNAPSHOT_PATH}"
mkdir -p "${SNAPSHOT_PATH}/database"
mkdir -p "${SNAPSHOT_PATH}/configs"
mkdir -p "${SNAPSHOT_PATH}/docs"
mkdir -p "${SNAPSHOT_PATH}/logs"

# 2. 保存代码快照 
echo -e "${YELLOW}💾 保存代码快照...${NC}"
# 复制源代码（排除 node_modules 和其他不必要文件）
rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='*.log' \
  --exclude='.env.local' \
  ./frontend/ "${SNAPSHOT_PATH}/frontend/"

rsync -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='*.log' \
  --exclude='.env.local' \
  ./backend/ "${SNAPSHOT_PATH}/backend/"

# 3. 保存数据库状态
echo -e "${YELLOW}🗃️ 保存数据库状态...${NC}"
# 导出数据库结构和数据
if command -v pg_dump &> /dev/null; then
    # 尝试备份数据库
    if pg_dump -h localhost -p 5432 -U pathfinder -d pathfinder > "${SNAPSHOT_PATH}/database/database_dump.sql" 2>/dev/null; then
        echo "✅ 数据库备份成功"
    else
        echo "⚠️ 数据库备份失败，请检查连接"
    fi
else
    echo "⚠️ pg_dump 未找到，跳过数据库备份"
fi

# 保存 Prisma schema
cp ./backend/prisma/schema.prisma "${SNAPSHOT_PATH}/database/" 2>/dev/null || echo "⚠️ Prisma schema 未找到"

# 4. 保存配置文件
echo -e "${YELLOW}⚙️ 保存配置文件...${NC}"
# Docker 配置
cp docker-compose*.yml "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true
cp Dockerfile* "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true

# 环境配置模板（不包含敏感信息）
cp .env.example "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true

# 包管理文件
cp ./frontend/package*.json "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true
cp ./backend/package*.json "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true

# Nginx 配置
cp -r ./nginx/ "${SNAPSHOT_PATH}/configs/" 2>/dev/null || true

# 5. 保存项目文档
echo -e "${YELLOW}📚 保存项目文档...${NC}"
cp *.md "${SNAPSHOT_PATH}/docs/" 2>/dev/null || true

# 6. 记录系统环境信息
echo -e "${YELLOW}🖥️ 记录系统环境信息...${NC}"
cat > "${SNAPSHOT_PATH}/system-info.txt" << EOF
Pathfinder 系统快照信息
========================
创建时间: $(date)
操作系统: $(uname -a)
Node.js版本: $(node --version 2>/dev/null || echo "未安装")
NPM版本: $(npm --version 2>/dev/null || echo "未安装")
Docker版本: $(docker --version 2>/dev/null || echo "未安装")
PostgreSQL版本: $(psql --version 2>/dev/null || echo "未找到")

Git信息:
$(git log --oneline -5 2>/dev/null || echo "非Git仓库")

当前Git状态:
$(git status --porcelain 2>/dev/null || echo "非Git仓库")

前端依赖:
$(cd frontend && npm list --depth=0 2>/dev/null || echo "无法获取依赖信息")

后端依赖:
$(cd backend && npm list --depth=0 2>/dev/null || echo "无法获取依赖信息")
EOF

# 7. 保存运行状态
echo -e "${YELLOW}🚀 记录运行状态...${NC}"
cat > "${SNAPSHOT_PATH}/runtime-status.txt" << EOF
运行时状态信息
==============
检查时间: $(date)

Docker服务状态:
$(docker-compose ps 2>/dev/null || echo "Docker Compose 未运行")

端口占用情况:
前端 (3000): $(lsof -i :3000 2>/dev/null || echo "端口未占用")
后端 (8080): $(lsof -i :8080 2>/dev/null || echo "端口未占用")  
数据库 (5432): $(lsof -i :5432 2>/dev/null || echo "端口未占用")

磁盘使用:
$(df -h . 2>/dev/null || echo "无法获取磁盘信息")
EOF

# 8. 创建状态文档
echo -e "${YELLOW}📋 创建状态文档...${NC}"
cat > "${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md" << 'EOF'
# 🎯 Pathfinder 系统状态快照

## 📅 快照信息
- **创建时间**: {{TIMESTAMP}}
- **快照名称**: {{SNAPSHOT_NAME}}
- **Git提交**: {{GIT_COMMIT}}

## 🚀 当前功能状态

### ✅ 已完成功能
1. **漏斗建模器** - 完整的拖拽式可视化建模工具
   - 支持节点创建、编辑、删除
   - 支持连接线管理
   - 支持画布缩放、平移
   - 支持多选和批量操作
   - 支持键盘快捷键

2. **数据管理** - 完整的数据输入和分析功能
   - 节点数据输入功能
   - 转化率和流失率计算
   - 实时数据同步和自动保存
   - 数据库持久化存储

3. **用户界面** - 完整的用户体验
   - 漏斗列表页面
   - 漏斗详情页面（包含可视化流程图）
   - 漏斗创建和编辑页面
   - AI分析功能框架

4. **后端API** - 完整的数据接口
   - 用户认证系统
   - 漏斗CRUD操作
   - 数据验证和错误处理
   - RESTful API设计

5. **AI分析框架** - 智能分析基础
   - UI界面完整
   - 基于真实数据的智能分析逻辑
   - 评分系统、洞察生成、优化建议
   - 风险识别和时间格式化

## 🛠 技术栈状态

### 前端 (Vue 3)
- Vue 3.4+ (Composition API)
- TypeScript 5.3+
- Tailwind CSS
- Vite 构建工具
- 状态管理 (Pinia)

### 后端 (Node.js)
- Node.js 18+ 
- Express.js + TypeScript
- Prisma ORM
- PostgreSQL 数据库
- JWT 认证

### 部署环境
- Docker 容器化
- 开发环境已配置
- 前端: http://localhost:3000
- 后端: http://localhost:8080

## 📊 数据模型状态

### 核心模型
1. **User** - 用户管理
2. **Funnel** - 漏斗主体
3. **Node** - 漏斗节点  
4. **Edge** - 节点连接
5. **NodeData** - 节点数据

### 数据库状态
- Prisma schema 已优化
- 支持复杂漏斗结构
- 数据验证完整
- 索引优化完成

## 🎨 UI/UX 状态

### 页面完成度
- [x] 漏斗列表页 (100%)
- [x] 漏斗详情页 (100%)
- [x] 漏斗创建页 (100%)
- [x] 漏斗编辑页 (100%)

### 交互功能
- [x] 拖拽建模 (100%)
- [x] 数据输入 (100%)
- [x] 可视化图表 (100%)
- [x] AI分析框架 (100%)

## 🔧 待改进项目
1. AI分析接入真实AI API
2. 用户认证页面优化
3. 移动端响应式设计
4. 性能监控和优化
5. 单元测试覆盖

## 📁 项目结构
```
pathfinder/
├── frontend/           # Vue 3 前端应用
├── backend/            # Node.js 后端API
├── database/           # 数据库配置
├── system-snapshots/   # 系统快照存储
└── docs/              # 项目文档
```

## 🚀 部署建议
1. 生产环境 Docker 配置
2. SSL 证书配置
3. 负载均衡设置
4. 监控和日志系统
5. 备份和恢复策略

---
**状态**: 开发阶段完成，准备生产部署  
**版本**: v1.0-dev  
**维护者**: 开发团队  
EOF

# 替换模板变量
sed -i.bak "s/{{TIMESTAMP}}/$(date)/g" "${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md"
sed -i.bak "s/{{SNAPSHOT_NAME}}/${SNAPSHOT_NAME}/g" "${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md"
sed -i.bak "s/{{GIT_COMMIT}}/$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')/g" "${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md"
rm "${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md.bak" 2>/dev/null || true

# 9. 创建恢复脚本
echo -e "${YELLOW}🔄 创建恢复脚本...${NC}"
cat > "${SNAPSHOT_PATH}/restore.sh" << 'EOF'
#!/bin/bash
# Pathfinder 系统恢复脚本

echo "🔄 开始恢复 Pathfinder 系统状态..."

# 检查当前目录
if [[ ! -f "frontend/package.json" ]]; then
    echo "❌ 请在 Pathfinder 项目根目录运行此脚本"
    exit 1
fi

# 恢复前端代码
echo "📱 恢复前端代码..."
rsync -av --progress ./frontend/ ../../frontend/

# 恢复后端代码  
echo "🖥️ 恢复后端代码..."
rsync -av --progress ./backend/ ../../backend/

# 恢复配置文件
echo "⚙️ 恢复配置文件..."
cp -f ./configs/*.yml ../../ 2>/dev/null || true
cp -f ./configs/Dockerfile* ../../ 2>/dev/null || true

# 恢复数据库
echo "🗃️ 恢复数据库..."
if [[ -f "./database/database_dump.sql" ]]; then
    echo "发现数据库备份文件，请手动执行："
    echo "psql -h localhost -p 5432 -U pathfinder -d pathfinder < ./database/database_dump.sql"
fi

# 重新安装依赖
echo "📦 重新安装依赖..."
cd ../../frontend && npm install
cd ../backend && npm install

echo "✅ 系统恢复完成！"
echo "请运行 docker-compose up -d 启动服务"
EOF

chmod +x "${SNAPSHOT_PATH}/restore.sh"

# 10. 压缩快照 (可选)
echo -e "${YELLOW}📦 压缩快照...${NC}"
if command -v tar &> /dev/null; then
    cd "${BACKUP_DIR}"
    tar -czf "${SNAPSHOT_NAME}.tar.gz" "${SNAPSHOT_NAME}/"
    echo "✅ 快照已压缩: ${BACKUP_DIR}/${SNAPSHOT_NAME}.tar.gz"
fi

# 11. 创建快照索引
echo -e "${YELLOW}📋 更新快照索引...${NC}"
cat > "${BACKUP_DIR}/snapshot-index.txt" << EOF
Pathfinder 系统快照索引
====================
最新快照: ${SNAPSHOT_NAME}
创建时间: $(date)

快照列表:
$(ls -la "${BACKUP_DIR}/" | grep "pathfinder_snapshot_" || echo "无历史快照")
EOF

echo -e "${GREEN}✅ 系统状态保存完成！${NC}"
echo -e "${BLUE}📁 快照位置: ${SNAPSHOT_PATH}${NC}"
echo -e "${BLUE}📋 状态文档: ${SNAPSHOT_PATH}/SYSTEM_STATE_${TIMESTAMP}.md${NC}"
echo -e "${BLUE}🔄 恢复脚本: ${SNAPSHOT_PATH}/restore.sh${NC}"

# 显示快照信息
echo -e "${YELLOW}📊 快照统计:${NC}"
echo "文件数量: $(find "${SNAPSHOT_PATH}" -type f | wc -l)"
echo "总大小: $(du -sh "${SNAPSHOT_PATH}" | cut -f1)"
echo ""
echo -e "${GREEN}🎉 Pathfinder 系统状态保存成功！${NC}"