#!/bin/bash

# =================================================================
# Pathfinder 项目一键启动脚本
# 完整的环境检查、依赖安装、数据库初始化、服务启动和健康检查
# =================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 字体样式
BOLD='\033[1m'
DIM='\033[2m'

# 日志函数
log_header() {
    echo -e "${WHITE}${BOLD}================================================${NC}"
    echo -e "${WHITE}${BOLD}  $1${NC}"
    echo -e "${WHITE}${BOLD}================================================${NC}"
}

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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_debug() {
    if [[ "$DEBUG" == "true" ]]; then
        echo -e "${DIM}[DEBUG]${NC} $1"
    fi
}

# 进度条函数
show_progress() {
    local duration=$1
    local message="$2"
    local progress=0
    local width=50
    
    while [ $progress -le $duration ]; do
        local filled=$((progress * width / duration))
        local empty=$((width - filled))
        
        printf "\r${CYAN}[INFO]${NC} $message ["
        printf "%${filled}s" | tr ' ' '='
        printf "%${empty}s" | tr ' ' ' '
        printf "] %d%%" $((progress * 100 / duration))
        
        sleep 1
        ((progress++))
    done
    echo ""
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # 端口被占用
    else
        return 1  # 端口未被占用
    fi
}

# 获取操作系统类型
get_os_type() {
    case "$OSTYPE" in
        darwin*)  echo "macOS" ;;
        linux*)   echo "Linux" ;;
        msys*)    echo "Windows" ;;
        cygwin*)  echo "Windows" ;;
        *)        echo "Unknown" ;;
    esac
}

# 检查系统资源
check_system_resources() {
    log_info "检查系统资源..."
    
    # 检查内存
    if command_exists free; then
        local mem_total=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
        if [ $mem_total -lt 4 ]; then
            log_warning "可用内存较少 (${mem_total}GB)，建议至少4GB"
        else
            log_success "内存充足: ${mem_total}GB"
        fi
    fi
    
    # 检查磁盘空间
    local disk_free=$(df -h . | awk 'NR==2{print $4}')
    log_info "可用磁盘空间: $disk_free"
}

# 验证Node.js版本
validate_node_version() {
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -lt 18 ]; then
        log_error "Node.js 版本过低: v$node_version (需要 18.0.0+)"
        return 1
    fi
    
    log_success "Node.js 版本符合要求: v$node_version"
    return 0
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录结构..."
    
    local dirs=(
        "logs"
        "backups"
        "uploads"
        "tmp"
        "scripts/logs"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_debug "创建目录: $dir"
        fi
    done
    
    log_success "目录结构创建完成"
}

# 清理环境
cleanup_environment() {
    log_info "清理现有环境..."
    
    # 停止现有容器
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml down --remove-orphans >/dev/null 2>&1 || true
    fi
    
    # 清理无用的Docker资源
    docker system prune -f >/dev/null 2>&1 || true
    
    log_success "环境清理完成"
}

# 健康检查函数
health_check() {
    local service_name=$1
    local url=$2
    local max_attempts=${3:-30}
    local wait_time=${4:-2}
    
    log_info "检查 $service_name 服务健康状态..."
    
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log_success "$service_name 服务正常运行"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "$service_name 服务启动失败"
            return 1
        fi
        
        log_debug "等待 $service_name 启动... (尝试 $attempt/$max_attempts)"
        sleep $wait_time
        ((attempt++))
    done
}

# 数据库连接检查
check_database_connection() {
    log_info "检查数据库连接..."
    
    cd backend
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if npm run db:generate >/dev/null 2>&1; then
            log_success "数据库连接成功"
            cd ..
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "数据库连接失败，请检查 Docker 服务"
            cd ..
            return 1
        fi
        
        log_debug "等待数据库连接... (尝试 $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
}

# 创建环境配置文件
create_env_files() {
    log_info "创建环境配置文件..."
    
    # 后端环境文件
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << 'EOL'
# 数据库配置
DATABASE_URL="postgresql://pathfinder:dev123@localhost:5432/pathfinder_dev"

# JWT 配置
JWT_SECRET="pathfinder-super-secret-jwt-key-change-in-production-2024"
JWT_EXPIRES_IN="7d"

# Redis 配置  
REDIS_URL="redis://localhost:6379"

# 应用配置
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# AI 服务配置 (可选)
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-3.5-turbo"
GEMINI_API_KEY=""

# 日志配置
LOG_LEVEL="debug"
LOG_FILE="logs/app.log"

# 安全配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_PATH="uploads"
EOL
        log_success "已创建 backend/.env 文件"
    else
        log_info "backend/.env 文件已存在，跳过"
    fi
    
    # 前端环境文件
    if [ ! -f "frontend/.env" ]; then
        cat > frontend/.env << 'EOL'
# API 基础地址
VITE_API_BASE_URL=http://localhost:3001/api

# 应用配置
VITE_APP_TITLE="Pathfinder - 转化路径分析平台"
VITE_APP_VERSION="1.0.0"
VITE_APP_DESCRIPTION="智能销售漏斗分析与优化平台"

# 开发配置
VITE_DEV_PORT=3000
VITE_OPEN_BROWSER=true
VITE_DEV_HOST="localhost"

# 功能开关
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORT=true

# 第三方集成
VITE_GOOGLE_ANALYTICS_ID=""
VITE_SENTRY_DSN=""
EOL
        log_success "已创建 frontend/.env 文件"
    else
        log_info "frontend/.env 文件已存在，跳过"
    fi
    
    # 根目录环境文件（Docker使用）
    if [ ! -f ".env" ]; then
        cat > .env << 'EOL'
# Docker 配置
COMPOSE_PROJECT_NAME=pathfinder
COMPOSE_FILE=docker-compose.dev.yml

# 数据库配置
POSTGRES_PASSWORD=dev123
POSTGRES_DB=pathfinder_dev
POSTGRES_USER=pathfinder

# Redis 配置
REDIS_PASSWORD=""

# 应用配置
NODE_ENV=development
JWT_SECRET=pathfinder-super-secret-jwt-key-change-in-production-2024
CORS_ORIGIN=http://localhost:3000
API_BASE_URL=http://localhost:3001

# AI 服务配置
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
EOL
        log_success "已创建根目录 .env 文件"
    else
        log_info "根目录 .env 文件已存在，跳过"
    fi
}

# 显示启动信息
show_startup_info() {
    log_header "🎉 Pathfinder 环境启动完成！"
    echo ""
    echo -e "${WHITE}${BOLD}📱 服务地址:${NC}"
    echo -e "   前端应用:  ${CYAN}http://localhost:3000${NC}"
    echo -e "   后端API:   ${CYAN}http://localhost:3001${NC}"
    echo -e "   数据库:    ${CYAN}localhost:5432${NC}"
    echo -e "   Redis:     ${CYAN}localhost:6379${NC}"
    echo -e "   PgAdmin:   ${CYAN}http://localhost:5050${NC} (如果启用)"
    echo ""
    echo -e "${WHITE}${BOLD}🔐 测试账户:${NC}"
    echo -e "   面试官:    ${GREEN}interviewer@pathfinder.com${NC} / ${GREEN}interviewer123${NC}"
    echo -e "   候选人:    ${GREEN}candidate@pathfinder.com${NC} / ${GREEN}candidate123${NC}"
    echo -e "   演示用户:  ${GREEN}demo@pathfinder.com${NC} / ${GREEN}demo123${NC}"
    echo ""
    echo -e "${WHITE}${BOLD}💡 常用命令:${NC}"
    echo -e "   启动开发:  ${YELLOW}./dev.sh${NC}"
    echo -e "   运行测试:  ${YELLOW}./test.sh${NC}"
    echo -e "   构建生产:  ${YELLOW}./build.sh${NC}"
    echo -e "   清理环境:  ${YELLOW}./clean.sh${NC}"
    echo -e "   查看日志:  ${YELLOW}docker-compose -f docker-compose.dev.yml logs -f${NC}"
    echo -e "   停止服务:  ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
    echo ""
    echo -e "${WHITE}${BOLD}📚 开发工具:${NC}"
    echo -e "   数据库管理: ${YELLOW}cd backend && npm run db:studio${NC}"
    echo -e "   API测试:    ${YELLOW}node backend/scripts/test-api-endpoints.js${NC}"
    echo -e "   重置数据:   ${YELLOW}./reset-interview-data.sh${NC}"
    echo ""
    echo -e "${YELLOW}💡 提示: 请确保在开发前查看 INTERVIEW_GUIDE.md 文件${NC}"
    echo ""
}

# 主函数
main() {
    # 检查是否有DEBUG参数
    if [[ "$1" == "--debug" ]]; then
        DEBUG=true
        shift
    fi
    
    log_header "🚀 Pathfinder 项目一键启动脚本"
    
    local os_type=$(get_os_type)
    log_info "操作系统: $os_type"
    
    # 1. 系统环境检查
    log_step "1/8 检查系统环境"
    
    check_system_resources
    
    # 检查 Node.js
    if command_exists node; then
        validate_node_version || exit 1
    else
        log_error "未检测到 Node.js，请先安装 Node.js 18+ 版本"
        exit 1
    fi
    
    # 检查 npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        log_success "npm 版本: $npm_version"
    else
        log_error "未检测到 npm"
        exit 1
    fi
    
    # 检查 Docker
    if command_exists docker; then
        log_success "Docker 已安装"
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
    local ports_to_check=(3000 3001 5432 6379)
    for port in "${ports_to_check[@]}"; do
        if check_port $port; then
            log_warning "端口 $port 已被占用"
            echo -n "是否要继续? (y/N): "
            read -n 1 confirmation
            echo
            if [[ $confirmation != [yY] ]]; then
                log_info "请先释放端口 $port 后重试"
                exit 1
            fi
        fi
    done
    
    # 2. 环境准备
    log_step "2/8 准备环境"
    create_directories
    cleanup_environment
    create_env_files
    
    # 3. 安装依赖
    log_step "3/8 安装项目依赖"
    
    log_info "安装后端依赖..."
    cd backend
    npm install --silent
    log_success "后端依赖安装完成"
    cd ..
    
    log_info "安装前端依赖..."
    cd frontend  
    npm install --silent
    log_success "前端依赖安装完成"
    cd ..
    
    # 4. 启动基础服务
    log_step "4/8 启动数据库和缓存服务"
    
    docker-compose -f docker-compose.dev.yml up -d db redis
    
    show_progress 10 "等待数据库服务启动"
    
    # 5. 初始化数据库
    log_step "5/8 初始化数据库"
    
    check_database_connection || exit 1
    
    cd backend
    
    log_info "生成 Prisma 客户端..."
    npm run db:generate
    log_success "Prisma 客户端生成完成"
    
    log_info "推送数据库模式..."
    npm run db:push
    log_success "数据库模式创建完成"
    
    log_info "填充种子数据..."
    npm run db:seed
    log_success "种子数据填充完成"
    
    cd ..
    
    # 6. 构建项目
    log_step "6/8 构建项目"
    
    log_info "构建后端项目..."
    cd backend
    npm run build
    log_success "后端构建完成"
    cd ..
    
    log_info "构建前端项目..."
    cd frontend
    npm run build
    log_success "前端构建完成"
    cd ..
    
    # 7. 启动应用服务
    log_step "7/8 启动应用服务"
    
    # 启动前端和后端服务
    docker-compose -f docker-compose.dev.yml up -d
    
    show_progress 15 "等待应用服务启动"
    
    # 8. 健康检查
    log_step "8/8 服务健康检查"
    
    # 检查后端服务
    health_check "后端API" "http://localhost:3001/api/health" 30 2
    
    # 检查前端服务
    health_check "前端应用" "http://localhost:3000" 30 2
    
    # 检查数据库连接
    log_info "验证数据库连接..."
    if docker-compose -f docker-compose.dev.yml exec -T db psql -U pathfinder -d pathfinder_dev -c "SELECT version();" >/dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_warning "数据库连接检查失败"
    fi
    
    # 显示启动信息
    show_startup_info
    
    # 保存启动日志
    echo "$(date): Pathfinder 环境启动成功" >> logs/startup.log
}

# 信号处理
trap 'log_error "脚本被中断"; exit 1' INT TERM

# 执行主函数
main "$@"