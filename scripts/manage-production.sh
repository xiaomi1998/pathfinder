#!/bin/bash

# Pathfinder 生产环境管理脚本
# 使用方法: ./manage-production.sh [command] [options]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 获取 Docker Compose 命令
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose -f $COMPOSE_FILE"
    else
        echo "docker compose -f $COMPOSE_FILE"
    fi
}

# 显示帮助信息
show_help() {
    echo -e "${GREEN}Pathfinder 生产环境管理脚本${NC}"
    echo ""
    echo "使用方法: $0 [命令] [选项]"
    echo ""
    echo "命令："
    echo "  status          显示服务状态"
    echo "  logs [service]  查看日志"
    echo "  restart         重启所有服务"
    echo "  stop            停止所有服务"
    echo "  start           启动所有服务"
    echo "  scale [service] [count]  扩展服务"
    echo "  backup          创建数据备份"
    echo "  restore [file]  恢复数据备份"
    echo "  update          更新服务"
    echo "  health          健康检查"
    echo "  ssl-renew       续期 SSL 证书"
    echo "  cleanup         清理资源"
    echo "  monitor         显示监控信息"
    echo "  exec [service]  进入服务容器"
    echo ""
    echo "示例："
    echo "  $0 status"
    echo "  $0 logs backend"
    echo "  $0 scale backend 3"
    echo "  $0 backup"
}

# 显示服务状态
show_status() {
    log_info "服务状态："
    $(get_compose_cmd) ps
    
    echo ""
    log_info "资源使用情况："
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 查看日志
show_logs() {
    local service=${1:-}
    local lines=${2:-100}
    
    if [[ -z "$service" ]]; then
        log_info "显示所有服务日志 (最近 $lines 行)："
        $(get_compose_cmd) logs --tail=$lines -f
    else
        log_info "显示 $service 服务日志 (最近 $lines 行)："
        $(get_compose_cmd) logs --tail=$lines -f $service
    fi
}

# 重启服务
restart_services() {
    local service=${1:-}
    
    if [[ -z "$service" ]]; then
        log_info "重启所有服务..."
        $(get_compose_cmd) restart
    else
        log_info "重启 $service 服务..."
        $(get_compose_cmd) restart $service
    fi
    
    log_success "服务重启完成"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    $(get_compose_cmd) down
    log_success "服务已停止"
}

# 启动服务
start_services() {
    log_info "启动所有服务..."
    $(get_compose_cmd) up -d --remove-orphans
    log_success "服务已启动"
}

# 扩展服务
scale_service() {
    local service=$1
    local count=$2
    
    if [[ -z "$service" || -z "$count" ]]; then
        log_error "请指定服务名和实例数量"
        echo "使用方法: $0 scale <service> <count>"
        exit 1
    fi
    
    log_info "将 $service 服务扩展到 $count 个实例..."
    $(get_compose_cmd) up -d --scale $service=$count $service
    log_success "服务扩展完成"
}

# 创建备份
create_backup() {
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    log_info "创建数据备份到: $backup_dir"
    
    # 备份数据库
    if docker ps | grep -q pathfinder-postgres-primary; then
        log_info "备份 PostgreSQL 数据库..."
        docker exec pathfinder-postgres-primary pg_dump \
            -U "${POSTGRES_USER:-pathfinder_app}" \
            -d "${POSTGRES_DB:-pathfinder_db}" \
            > "$backup_dir/postgres_backup.sql"
        gzip "$backup_dir/postgres_backup.sql"
    fi
    
    # 备份 Redis 数据
    if docker ps | grep -q pathfinder-redis-master; then
        log_info "备份 Redis 数据..."
        docker exec pathfinder-redis-master redis-cli BGSAVE
        sleep 5
        docker cp pathfinder-redis-master:/data/dump.rdb "$backup_dir/redis_dump.rdb"
    fi
    
    # 备份上传文件
    if [[ -d "./uploads" ]]; then
        log_info "备份上传文件..."
        tar -czf "$backup_dir/uploads.tar.gz" ./uploads/
    fi
    
    # 备份配置文件
    cp $ENV_FILE "$backup_dir/" 2>/dev/null || true
    cp -r nginx/ "$backup_dir/" 2>/dev/null || true
    
    log_success "备份完成: $backup_dir"
}

# 恢复备份
restore_backup() {
    local backup_file=$1
    
    if [[ -z "$backup_file" || ! -f "$backup_file" ]]; then
        log_error "请指定有效的备份文件"
        exit 1
    fi
    
    log_warning "此操作将覆盖当前数据，确认继续吗？(y/N)"
    read -r confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
    
    log_info "恢复备份: $backup_file"
    
    # 恢复数据库
    if [[ "$backup_file" == *.sql* ]]; then
        if [[ "$backup_file" == *.gz ]]; then
            zcat "$backup_file" | docker exec -i pathfinder-postgres-primary \
                psql -U "${POSTGRES_USER:-pathfinder_app}" -d "${POSTGRES_DB:-pathfinder_db}"
        else
            cat "$backup_file" | docker exec -i pathfinder-postgres-primary \
                psql -U "${POSTGRES_USER:-pathfinder_app}" -d "${POSTGRES_DB:-pathfinder_db}"
        fi
    fi
    
    log_success "备份恢复完成"
}

# 更新服务
update_services() {
    log_info "更新服务..."
    
    # 拉取最新镜像
    $(get_compose_cmd) pull
    
    # 重新创建容器
    $(get_compose_cmd) up -d --force-recreate --remove-orphans
    
    # 清理旧镜像
    docker image prune -f
    
    log_success "服务更新完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local services=("nginx" "backend" "frontend" "postgres-primary" "redis-master")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "pathfinder-$service"; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "pathfinder-$service" 2>/dev/null || echo "no-healthcheck")
            
            if [[ "$health" == "healthy" || "$health" == "no-healthcheck" ]]; then
                echo -e "  $service: ${GREEN}✓ 健康${NC}"
            else
                echo -e "  $service: ${RED}✗ 不健康 ($health)${NC}"
                all_healthy=false
            fi
        else
            echo -e "  $service: ${YELLOW}? 未运行${NC}"
            all_healthy=false
        fi
    done
    
    # 检查端点可用性
    local endpoints=("http://localhost/health" "http://localhost/api/health")
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "$endpoint" > /dev/null 2>&1; then
            echo -e "  $endpoint: ${GREEN}✓ 可访问${NC}"
        else
            echo -e "  $endpoint: ${RED}✗ 不可访问${NC}"
            all_healthy=false
        fi
    done
    
    if [[ "$all_healthy" == true ]]; then
        log_success "所有服务健康"
    else
        log_warning "部分服务存在问题"
    fi
}

# 续期 SSL 证书
renew_ssl() {
    log_info "续期 SSL 证书..."
    
    $(get_compose_cmd) run --rm certbot renew --quiet
    
    # 重新加载 Nginx 配置
    docker kill --signal=HUP pathfinder-nginx-proxy
    
    log_success "SSL 证书续期完成"
}

# 清理资源
cleanup_resources() {
    log_info "清理未使用的资源..."
    
    # 停止并删除未使用的容器
    docker container prune -f
    
    # 删除未使用的镜像
    docker image prune -f
    
    # 删除未使用的网络
    docker network prune -f
    
    # 删除未使用的卷（谨慎使用）
    log_warning "是否删除未使用的数据卷？这可能会删除重要数据！(y/N)"
    read -r confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    log_success "资源清理完成"
}

# 显示监控信息
show_monitor() {
    log_info "系统监控信息："
    
    echo "========================================="
    echo "系统资源使用："
    echo "CPU 使用率:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'
    
    echo "内存使用："
    free -h | grep "Mem:"
    
    echo "磁盘使用："
    df -h | grep -E '(Filesystem|/dev/)'
    
    echo "========================================="
    echo "Docker 资源使用："
    docker system df
    
    echo "========================================="
    echo "容器资源使用："
    docker stats --no-stream
    
    if command -v netstat &> /dev/null; then
        echo "========================================="
        echo "网络连接："
        netstat -tunlp | grep -E ':(80|443|3000|5432|6379)'
    fi
}

# 进入容器
exec_container() {
    local service=$1
    local cmd=${2:-/bin/bash}
    
    if [[ -z "$service" ]]; then
        log_error "请指定服务名"
        echo "使用方法: $0 exec <service> [command]"
        exit 1
    fi
    
    local container_name="pathfinder-$service"
    
    if ! docker ps | grep -q "$container_name"; then
        log_error "容器 $container_name 未运行"
        exit 1
    fi
    
    log_info "进入容器 $container_name..."
    docker exec -it "$container_name" $cmd
}

# 主函数
main() {
    local command=${1:-help}
    
    case $command in
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2" "$3"
            ;;
        "restart")
            restart_services "$2"
            ;;
        "stop")
            stop_services
            ;;
        "start")
            start_services
            ;;
        "scale")
            scale_service "$2" "$3"
            ;;
        "backup")
            create_backup
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "update")
            update_services
            ;;
        "health")
            health_check
            ;;
        "ssl-renew")
            renew_ssl
            ;;
        "cleanup")
            cleanup_resources
            ;;
        "monitor")
            show_monitor
            ;;
        "exec")
            exec_container "$2" "$3"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 检查环境
if [[ ! -f $ENV_FILE ]]; then
    log_warning "环境配置文件 $ENV_FILE 不存在"
    log_info "某些功能可能无法正常工作"
fi

# 执行主函数
main "$@"