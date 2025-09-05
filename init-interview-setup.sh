#!/bin/bash

# Pathfinder 面试项目初始化脚本
# 自动设置开发环境，安装依赖，初始化数据库

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # 端口被占用
    else
        return 1  # 端口未被占用
    fi
}

echo "================================================"
echo "    🎯 Pathfinder 面试项目初始化脚本"
echo "================================================"

# 1. 环境检查
log_info "正在检查开发环境..."

# 检查 Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    log_success "Node.js 已安装: $NODE_VERSION"
    
    # 检查版本是否满足要求
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 18.0.0 或更高版本"
        exit 1
    fi
else
    log_error "未检测到 Node.js，请先安装 Node.js 18+ 版本"
    exit 1
fi

# 检查 npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    log_success "npm 已安装: $NPM_VERSION"
else
    log_error "未检测到 npm"
    exit 1
fi

# 检查 Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    log_success "Docker 已安装: $DOCKER_VERSION"
    
    # 检查 Docker 是否运行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 守护进程未运行，请启动 Docker"
        exit 1
    fi
else
    log_error "未检测到 Docker，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    log_success "Docker Compose 已安装"
else
    log_error "未检测到 Docker Compose"
    exit 1
fi

# 检查端口占用
log_info "检查端口占用情况..."
PORTS_TO_CHECK=(3000 5432 6379 8080)
for port in "${PORTS_TO_CHECK[@]}"; do
    if check_port $port; then
        log_warning "端口 $port 已被占用，可能需要手动处理"
    fi
done

# 2. 创建必要的环境配置文件
log_info "创建环境配置文件..."

# 后端环境文件
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env 2>/dev/null || cat > backend/.env << EOL
# 数据库配置
DATABASE_URL="postgresql://pathfinder_user:pathfinder_password@localhost:5432/pathfinder_db"

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Redis 配置
REDIS_URL="redis://localhost:6379"

# 应用配置
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# AI 服务配置
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-3.5-turbo"

# 日志配置
LOG_LEVEL="debug"
EOL
    log_success "已创建 backend/.env 文件"
else
    log_info "backend/.env 文件已存在，跳过"
fi

# 前端环境文件
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOL
# API 基础地址
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_TITLE="Pathfinder - 转化路径扫描仪"
VITE_APP_VERSION="1.0.0"

# 开发配置
VITE_DEV_PORT=3000
VITE_OPEN_BROWSER=true
EOL
    log_success "已创建 frontend/.env 文件"
else
    log_info "frontend/.env 文件已存在，跳过"
fi

# 3. 安装依赖
log_info "安装项目依赖..."

# 安装后端依赖
log_info "安装后端依赖..."
cd backend
npm install
log_success "后端依赖安装完成"

cd ..

# 安装前端依赖
log_info "安装前端依赖..."
cd frontend
npm install
log_success "前端依赖安装完成"

cd ..

# 4. 启动数据库服务
log_info "启动数据库服务..."

# 停止可能正在运行的容器
docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1 || true

# 启动数据库和 Redis
docker-compose -f docker-compose.dev.yml up -d db redis

# 等待数据库启动
log_info "等待数据库启动..."
sleep 10

# 检查数据库连接
log_info "检查数据库连接..."
cd backend
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if npm run db:generate >/dev/null 2>&1; then
        log_success "数据库连接成功"
        break
    else
        if [ $attempt -eq $max_attempts ]; then
            log_error "数据库连接失败，请检查 Docker 服务"
            exit 1
        fi
        log_info "等待数据库连接... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    fi
done

# 5. 初始化数据库
log_info "初始化数据库结构..."
npm run db:push
log_success "数据库结构创建完成"

log_info "生成 Prisma 客户端..."
npm run db:generate
log_success "Prisma 客户端生成完成"

log_info "填充种子数据..."
npm run db:seed
log_success "种子数据填充完成"

cd ..

# 6. 构建项目
log_info "构建项目..."

# 构建后端
cd backend
npm run build
log_success "后端构建完成"

cd ../frontend
npm run build
log_success "前端构建完成"

cd ..

# 7. 创建开发脚本
log_info "创建开发脚本..."

cat > start-interview-dev.sh << 'EOL'
#!/bin/bash

# Pathfinder 面试开发环境启动脚本

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 启动 Pathfinder 开发环境...${NC}"

# 启动数据库服务
echo "启动数据库服务..."
docker-compose -f docker-compose.dev.yml up -d db redis

# 等待服务启动
sleep 5

# 在后台启动后端服务
echo "启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!

cd ..

# 等待后端启动
sleep 8

# 启动前端服务
echo "启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!

cd ..

echo -e "${GREEN}✅ 开发环境启动完成！${NC}"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:3001"
echo "📊 数据库管理: npx prisma studio (在 backend 目录下)"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose -f docker-compose.dev.yml stop; exit' INT

wait
EOL

chmod +x start-interview-dev.sh
log_success "已创建 start-interview-dev.sh 开发启动脚本"

# 创建重置脚本
cat > reset-interview-data.sh << 'EOL'
#!/bin/bash

# Pathfinder 面试数据重置脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  警告：此操作将重置所有数据库数据${NC}"
echo "确定要继续吗? (y/N)"
read -n 1 confirmation
echo

if [[ $confirmation != [yY] ]]; then
    echo "操作已取消"
    exit 0
fi

echo -e "${RED}重置数据库数据...${NC}"

cd backend

# 重置数据库
npm run db:reset

# 重新生成客户端
npm run db:generate

# 填充种子数据
npm run db:seed

echo -e "${GREEN}✅ 数据重置完成${NC}"
EOL

chmod +x reset-interview-data.sh
log_success "已创建 reset-interview-data.sh 数据重置脚本"

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Pathfinder 面试环境初始化完成！${NC}"
echo "================================================"
echo ""
echo "📋 下一步操作："
echo "1. 启动开发环境: ./start-interview-dev.sh"
echo "2. 访问应用: http://localhost:3000"
echo "3. 查看API文档: http://localhost:3001/api/docs (开发中)"
echo "4. 重置数据: ./reset-interview-data.sh"
echo ""
echo "🔧 开发工具："
echo "- 数据库管理: cd backend && npx prisma studio"
echo "- 查看日志: docker-compose -f docker-compose.dev.yml logs -f"
echo "- 停止服务: docker-compose -f docker-compose.dev.yml down"
echo ""
echo -e "${YELLOW}💡 提示: 请确保在开发前查看 INTERVIEW_GUIDE.md 文件${NC}"