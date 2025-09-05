#!/bin/bash

# ==========================================
# Pathfinder 缩小版自动化初始化脚本
# ==========================================
# 此脚本用于快速设置 Pathfinder 缩小版开发或生产环境
# 使用方法: ./scripts/init-pathfinder-mini.sh [dev|prod|test]

set -euo pipefail  # 严格错误处理

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-dev}"

# 颜色输出
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

# 检查依赖工具
check_dependencies() {
    log_info "检查系统依赖..."
    
    local deps=("docker" "docker-compose" "node" "npm")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少以下依赖: ${missing_deps[*]}"
        log_error "请先安装这些工具后再运行此脚本"
        exit 1
    fi
    
    # 检查 Docker 是否正在运行
    if ! docker info &> /dev/null; then
        log_error "Docker 未运行，请启动 Docker 后重试"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 验证环境参数
validate_environment() {
    case "$ENVIRONMENT" in
        dev|development)
            ENVIRONMENT="dev"
            COMPOSE_FILE="docker-compose.dev.yml"
            ENV_FILE=".env.development"
            PROFILE="dev"
            ;;
        prod|production)
            ENVIRONMENT="prod"
            COMPOSE_FILE="docker-compose.mini.yml"
            ENV_FILE=".env.mini.example"
            PROFILE="production"
            ;;
        test|testing)
            ENVIRONMENT="test"
            COMPOSE_FILE="docker-compose.mini.yml"
            ENV_FILE=".env.testing"
            PROFILE="test"
            ;;
        *)
            log_error "无效的环境参数: $ENVIRONMENT"
            log_error "支持的环境: dev, prod, test"
            exit 1
            ;;
    esac
    
    log_info "初始化环境: $ENVIRONMENT"
}

# 创建必要的目录结构
create_directories() {
    log_info "创建目录结构..."
    
    local dirs=(
        "data/postgres"
        "data/redis"
        "data/prometheus"
        "data/loki"
        "data/pgadmin"
        "logs/backend"
        "logs/frontend"
        "logs/nginx"
        "logs/scheduler"
        "backups/postgres"
        "backups/redis"
        "uploads"
        "tmp"
        "cache/nginx"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
        log_info "创建目录: $dir"
    done
    
    # 设置适当的权限
    chmod 755 "$PROJECT_ROOT/data"
    chmod 755 "$PROJECT_ROOT/logs"
    chmod 755 "$PROJECT_ROOT/uploads"
    chmod 755 "$PROJECT_ROOT/tmp"
    
    log_success "目录结构创建完成"
}

# 设置环境配置文件
setup_environment_file() {
    log_info "设置环境配置文件..."
    
    local target_env_file="$PROJECT_ROOT/.env"
    
    if [ -f "$target_env_file" ]; then
        log_warning "环境文件已存在: $target_env_file"
        read -p "是否要覆盖现有的环境文件? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "跳过环境文件设置"
            return
        fi
    fi
    
    # 复制对应环境的配置文件
    if [ -f "$PROJECT_ROOT/$ENV_FILE" ]; then
        cp "$PROJECT_ROOT/$ENV_FILE" "$target_env_file"
        log_success "环境文件已创建: $target_env_file"
        
        # 生成随机密钥
        if command -v openssl &> /dev/null; then
            log_info "生成随机密钥..."
            
            # 生成 JWT Secret
            JWT_SECRET=$(openssl rand -base64 32)
            sed -i.bak "s/your-super-secret-jwt-key-minimum-32-characters-long/$JWT_SECRET/g" "$target_env_file"
            
            # 生成数据库密码
            POSTGRES_PASSWORD=$(openssl rand -base64 16)
            sed -i.bak "s/your-super-secure-postgres-password-here/$POSTGRES_PASSWORD/g" "$target_env_file"
            
            # 生成 Redis 密码
            REDIS_PASSWORD=$(openssl rand -base64 16)
            sed -i.bak "s/your-super-secure-redis-password-here/$REDIS_PASSWORD/g" "$target_env_file"
            
            # 生成会话密钥
            SESSION_SECRET=$(openssl rand -base64 32)
            sed -i.bak "s/your-session-secret-key-here/$SESSION_SECRET/g" "$target_env_file"
            
            # 清理备份文件
            rm -f "$target_env_file.bak"
            
            log_success "随机密钥已生成并应用"
        else
            log_warning "未找到 openssl，请手动更新配置文件中的密钥"
        fi
    else
        log_error "环境配置文件不存在: $ENV_FILE"
        exit 1
    fi
}

# 安装 Node.js 依赖
install_node_dependencies() {
    log_info "安装 Node.js 依赖..."
    
    # 后端依赖
    if [ -d "$PROJECT_ROOT/backend" ]; then
        log_info "安装后端依赖..."
        cd "$PROJECT_ROOT/backend"
        npm ci --only=production
        log_success "后端依赖安装完成"
    fi
    
    # 前端依赖
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        log_info "安装前端依赖..."
        cd "$PROJECT_ROOT/frontend"
        npm ci
        log_success "前端依赖安装完成"
    fi
    
    cd "$PROJECT_ROOT"
}

# 构建 Docker 镜像
build_docker_images() {
    log_info "构建 Docker 镜像..."
    
    # 根据环境选择不同的构建方式
    if [ "$ENVIRONMENT" = "dev" ]; then
        docker-compose -f "$COMPOSE_FILE" build --parallel
    else
        docker-compose -f "$COMPOSE_FILE" --profile "$PROFILE" build --parallel
    fi
    
    log_success "Docker 镜像构建完成"
}

# 启动数据库服务
start_database_services() {
    log_info "启动数据库服务..."
    
    # 只启动数据库相关服务
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis
    
    # 等待数据库服务就绪
    log_info "等待数据库服务启动..."
    sleep 10
    
    # 检查数据库连接
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-pathfinder_app}" &> /dev/null; then
            log_success "PostgreSQL 已就绪"
            break
        fi
        
        retries=$((retries - 1))
        log_info "等待 PostgreSQL 启动... (剩余重试次数: $retries)"
        sleep 2
    done
    
    if [ $retries -eq 0 ]; then
        log_error "PostgreSQL 启动超时"
        exit 1
    fi
    
    log_success "数据库服务已启动"
}

# 运行数据库迁移和种子数据
setup_database() {
    log_info "设置数据库..."
    
    # 进入后端目录
    cd "$PROJECT_ROOT/backend"
    
    # 生成 Prisma 客户端
    log_info "生成 Prisma 客户端..."
    npx prisma generate
    
    # 运行数据库迁移
    log_info "运行数据库迁移..."
    npx prisma db push
    
    # 根据环境选择种子数据
    case "$ENVIRONMENT" in
        dev)
            log_info "植入增强版种子数据..."
            npm run db:seed:enhanced
            ;;
        test)
            log_info "植入最小化种子数据..."
            npm run db:seed:minimal
            ;;
        prod)
            log_info "植入基础种子数据..."
            npm run db:seed:minimal
            ;;
    esac
    
    cd "$PROJECT_ROOT"
    log_success "数据库设置完成"
}

# 启动所有服务
start_services() {
    log_info "启动所有服务..."
    
    local compose_cmd="docker-compose -f $COMPOSE_FILE"
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        $compose_cmd --profile dev up -d
    elif [ "$ENVIRONMENT" = "prod" ]; then
        $compose_cmd --profile production up -d
    else
        $compose_cmd up -d
    fi
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local services=("postgres" "redis")
    if [ "$ENVIRONMENT" != "test" ]; then
        services+=("backend")
    fi
    
    local all_healthy=true
    
    for service in "${services[@]}"; do
        log_info "检查服务: $service"
        
        local retries=30
        local healthy=false
        
        while [ $retries -gt 0 ]; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service 服务健康"
                healthy=true
                break
            fi
            
            retries=$((retries - 1))
            sleep 2
        done
        
        if [ "$healthy" = false ]; then
            log_error "$service 服务不健康"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = false ]; then
        log_error "某些服务健康检查失败"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示访问信息
show_access_info() {
    log_success "Pathfinder 缩小版初始化完成！"
    echo
    echo "==================================="
    echo "访问信息："
    echo "==================================="
    
    case "$ENVIRONMENT" in
        dev)
            echo "前端应用: http://localhost:3000"
            echo "后端 API: http://localhost:8080"
            echo "PgAdmin: http://localhost:5050"
            echo "Redis Commander: http://localhost:8081"
            echo
            echo "测试账户："
            echo "- 管理员: admin@pathfinder.local / admin123456"
            echo "- 测试用户: test@pathfinder.local / admin123456"
            ;;
        prod)
            echo "应用地址: http://localhost"
            echo "API 地址: http://localhost:3000"
            echo
            echo "管理工具（需要启用 dev profile）："
            echo "docker-compose -f $COMPOSE_FILE --profile dev up -d pgladmin redis-commander"
            ;;
        test)
            echo "测试环境已启动"
            echo "运行测试: npm test"
            ;;
    esac
    
    echo
    echo "==================================="
    echo "常用命令："
    echo "==================================="
    echo "查看日志: docker-compose -f $COMPOSE_FILE logs -f [service]"
    echo "停止服务: docker-compose -f $COMPOSE_FILE down"
    echo "重启服务: docker-compose -f $COMPOSE_FILE restart [service]"
    echo "查看状态: docker-compose -f $COMPOSE_FILE ps"
    echo
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "开发工具："
        echo "数据库迁移: cd backend && npm run db:migrate"
        echo "重置数据库: cd backend && npm run db:reset"
        echo "查看数据库: cd backend && npm run db:studio"
        echo
    fi
}

# 错误处理
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "初始化过程中出现错误"
        log_info "清理资源..."
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    fi
}

trap cleanup EXIT

# 主执行流程
main() {
    log_info "开始初始化 Pathfinder 缩小版 ($ENVIRONMENT 环境)"
    
    check_dependencies
    validate_environment
    create_directories
    setup_environment_file
    
    if [ "$ENVIRONMENT" != "prod" ]; then
        install_node_dependencies
    fi
    
    build_docker_images
    start_database_services
    setup_database
    start_services
    
    # 等待服务启动
    sleep 5
    
    health_check
    show_access_info
    
    log_success "初始化完成！"
}

# 显示使用帮助
show_help() {
    echo "Pathfinder 缩小版初始化脚本"
    echo
    echo "使用方法:"
    echo "  $0 [环境]"
    echo
    echo "支持的环境:"
    echo "  dev|development  开发环境 (默认)"
    echo "  prod|production  生产环境"
    echo "  test|testing     测试环境"
    echo
    echo "示例:"
    echo "  $0 dev           # 初始化开发环境"
    echo "  $0 prod          # 初始化生产环境"
    echo "  $0 --help        # 显示此帮助信息"
}

# 检查帮助参数
if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    show_help
    exit 0
fi

# 运行主函数
main