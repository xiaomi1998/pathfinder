#!/bin/bash

# Pathfinder 生产环境部署脚本
# 使用方法: ./deploy-production.sh [version]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
VERSION=${1:-latest}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
BACKUP_DIR="./backups/pre-deploy"
DATE=$(date +"%Y%m%d_%H%M%S")

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

# 检查必需文件
check_prerequisites() {
    log_info "检查部署前提条件..."
    
    # 检查 Docker 和 Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    # 检查配置文件
    if [[ ! -f $ENV_FILE ]]; then
        log_error "环境配置文件 $ENV_FILE 不存在"
        log_info "请复制 .env.prod.example 为 $ENV_FILE 并配置相关参数"
        exit 1
    fi
    
    if [[ ! -f $COMPOSE_FILE ]]; then
        log_error "Docker Compose 文件 $COMPOSE_FILE 不存在"
        exit 1
    fi
    
    # 检查必需目录
    mkdir -p logs/{nginx,backend,frontend,postgres,redis,certbot}
    mkdir -p nginx/{ssl,logs}
    mkdir -p backups
    mkdir -p uploads
    
    log_success "前提条件检查完成"
}

# 创建备份
create_backup() {
    log_info "创建部署前备份..."
    
    mkdir -p "$BACKUP_DIR/$DATE"
    
    # 备份数据库
    if docker ps | grep -q pathfinder-postgres; then
        log_info "备份数据库..."
        docker exec pathfinder-postgres-primary pg_dump \
            -U "${POSTGRES_USER:-pathfinder_app}" \
            -d "${POSTGRES_DB:-pathfinder_db}" \
            > "$BACKUP_DIR/$DATE/database_backup.sql"
        log_success "数据库备份完成"
    fi
    
    # 备份配置文件
    cp $ENV_FILE "$BACKUP_DIR/$DATE/"
    cp -r nginx/ "$BACKUP_DIR/$DATE/" 2>/dev/null || true
    
    log_success "备份创建完成: $BACKUP_DIR/$DATE"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 设置构建参数
    export VERSION=$VERSION
    export BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
    export GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker build -f backend/Dockerfile.prod \
        --build-arg VERSION=$VERSION \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        -t pathfinder-backend:$VERSION \
        ./backend/
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -f frontend/Dockerfile.prod \
        --build-arg VITE_API_BASE_URL="${API_BASE_URL:-https://pathfinder.com/api}" \
        --build-arg VITE_APP_VERSION=$VERSION \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        -t pathfinder-frontend:$VERSION \
        ./frontend/
    
    log_success "镜像构建完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s http://localhost/health > /dev/null 2>&1; then
            log_success "前端服务健康检查通过"
            break
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log_error "前端服务健康检查失败"
        return 1
    fi
    
    # 检查 API 健康状态
    if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
        log_success "后端 API 健康检查通过"
    else
        log_warning "后端 API 健康检查失败，请检查服务状态"
    fi
}

# 部署服务
deploy_services() {
    log_info "部署生产环境服务..."
    
    # 加载环境变量
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
    
    # 拉取最新镜像（如果使用远程镜像仓库）
    # docker-compose -f $COMPOSE_FILE pull
    
    # 启动服务
    log_info "启动服务..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE up -d --remove-orphans
    else
        docker compose -f $COMPOSE_FILE up -d --remove-orphans
    fi
    
    log_success "服务启动完成"
}

# 初始化 SSL 证书
setup_ssl() {
    log_info "设置 SSL 证书..."
    
    # 检查域名配置
    if [[ -z "${DOMAIN_NAME}" ]]; then
        log_warning "DOMAIN_NAME 未配置，跳过 SSL 设置"
        return 0
    fi
    
    # 创建临时自签名证书（首次运行）
    if [[ ! -f "nginx/ssl/temp.crt" ]]; then
        log_info "创建临时 SSL 证书..."
        mkdir -p nginx/ssl
        openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
            -keyout nginx/ssl/temp.key \
            -out nginx/ssl/temp.crt \
            -subj "/CN=${DOMAIN_NAME}"
    fi
    
    # 请求 Let's Encrypt 证书
    log_info "请求 Let's Encrypt 证书..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE run --rm certbot \
            certonly --webroot --webroot-path=/var/www/certbot \
            --email ${SSL_EMAIL} --agree-tos --no-eff-email \
            -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}
    else
        docker compose -f $COMPOSE_FILE run --rm certbot \
            certonly --webroot --webroot-path=/var/www/certbot \
            --email ${SSL_EMAIL} --agree-tos --no-eff-email \
            -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}
    fi
    
    log_success "SSL 证书设置完成"
}

# 显示部署状态
show_status() {
    log_info "部署状态："
    
    echo "----------------------------------------"
    if command -v docker-compose &> /dev/null; then
        docker-compose -f $COMPOSE_FILE ps
    else
        docker compose -f $COMPOSE_FILE ps
    fi
    echo "----------------------------------------"
    
    echo -e "\n${GREEN}部署完成！${NC}"
    echo -e "访问地址："
    echo -e "  - 主站: ${BLUE}https://${DOMAIN_NAME:-localhost}${NC}"
    echo -e "  - API: ${BLUE}https://${DOMAIN_NAME:-localhost}/api${NC}"
    echo -e "  - 健康检查: ${BLUE}https://${DOMAIN_NAME:-localhost}/health${NC}"
    
    if [[ "${DOMAIN_NAME}" ]]; then
        echo -e "\n管理地址 (仅内网访问)："
        echo -e "  - Grafana: ${BLUE}http://localhost:3001${NC}"
        echo -e "  - Prometheus: ${BLUE}http://localhost:9090${NC}"
    fi
    
    echo -e "\n${YELLOW}重要提醒：${NC}"
    echo -e "  - 请确保防火墙已正确配置"
    echo -e "  - 建议设置定期备份任务"
    echo -e "  - 监控服务状态和资源使用"
    echo -e "  - 定期更新 SSL 证书"
}

# 清理旧资源
cleanup() {
    log_info "清理旧资源..."
    
    # 清理旧镜像
    docker image prune -f
    
    # 清理旧容器
    docker container prune -f
    
    # 清理旧网络
    docker network prune -f
    
    log_success "资源清理完成"
}

# 主函数
main() {
    echo -e "${GREEN}Pathfinder 生产环境部署脚本${NC}"
    echo -e "版本: $VERSION"
    echo -e "时间: $(date)"
    echo "========================================"
    
    # 执行部署步骤
    check_prerequisites
    create_backup
    build_images
    deploy_services
    setup_ssl
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 健康检查
    health_check
    
    # 清理资源
    cleanup
    
    # 显示状态
    show_status
    
    log_success "部署完成！"
}

# 错误处理
trap 'log_error "部署失败，请检查错误信息"; exit 1' ERR

# 如果直接运行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi