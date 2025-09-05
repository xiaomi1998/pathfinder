#!/bin/bash

# ==========================================
# Pathfinder Mini 健康检查脚本
# ==========================================
# 检查所有关键服务的健康状态

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="docker-compose.mini.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查 Docker 服务状态
check_docker_services() {
    log_info "检查 Docker 服务状态..."
    
    local services=("postgres" "redis" "backend")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_success "$service: 运行中"
        else
            log_error "$service: 未运行"
            all_healthy=false
        fi
    done
    
    return $([ "$all_healthy" = true ])
}

# 检查数据库连接
check_database_connection() {
    log_info "检查数据库连接..."
    
    # 检查 PostgreSQL
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T postgres \
        pg_isready -U "${POSTGRES_USER:-pathfinder_app}" &> /dev/null; then
        log_success "PostgreSQL: 连接正常"
    else
        log_error "PostgreSQL: 连接失败"
        return 1
    fi
    
    # 检查 Redis
    if docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" exec -T redis \
        redis-cli ping | grep -q "PONG"; then
        log_success "Redis: 连接正常"
    else
        log_error "Redis: 连接失败"
        return 1
    fi
}

# 检查 API 健康状态
check_api_health() {
    log_info "检查 API 健康状态..."
    
    local api_url="http://localhost:3000/api/health"
    local max_retries=5
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -sf "$api_url" > /dev/null 2>&1; then
            log_success "API: 健康检查通过"
            return 0
        fi
        
        retry=$((retry + 1))
        log_warning "API: 健康检查失败，重试 ($retry/$max_retries)"
        sleep 2
    done
    
    log_error "API: 健康检查失败"
    return 1
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."
    
    local usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $(NF-1)}' | sed 's/%//')
    
    if [ "$usage" -gt 90 ]; then
        log_error "磁盘空间不足: ${usage}%"
        return 1
    elif [ "$usage" -gt 80 ]; then
        log_warning "磁盘空间较少: ${usage}%"
    else
        log_success "磁盘空间充足: ${usage}%"
    fi
}

# 检查内存使用
check_memory_usage() {
    log_info "检查内存使用..."
    
    if command -v free &> /dev/null; then
        local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
        
        if [ "$mem_usage" -gt 90 ]; then
            log_error "内存使用过高: ${mem_usage}%"
            return 1
        elif [ "$mem_usage" -gt 80 ]; then
            log_warning "内存使用较高: ${mem_usage}%"
        else
            log_success "内存使用正常: ${mem_usage}%"
        fi
    else
        log_warning "无法检查内存使用 (free 命令不存在)"
    fi
}

# 检查日志文件大小
check_log_sizes() {
    log_info "检查日志文件大小..."
    
    local log_dir="$PROJECT_ROOT/logs"
    
    if [ -d "$log_dir" ]; then
        # 查找大于 100MB 的日志文件
        local large_logs=$(find "$log_dir" -type f -size +100M 2>/dev/null || true)
        
        if [ -n "$large_logs" ]; then
            log_warning "发现大型日志文件:"
            echo "$large_logs" | while read -r file; do
                local size=$(du -h "$file" | cut -f1)
                log_warning "  $file: $size"
            done
        else
            log_success "日志文件大小正常"
        fi
    else
        log_warning "日志目录不存在: $log_dir"
    fi
}

# 检查配置文件
check_config_files() {
    log_info "检查配置文件..."
    
    local config_files=(
        ".env"
        "$COMPOSE_FILE"
        "backend/prisma/schema.prisma"
    )
    
    local all_present=true
    
    for config in "${config_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$config" ]; then
            log_success "$config: 存在"
        else
            log_error "$config: 缺失"
            all_present=false
        fi
    done
    
    return $([ "$all_present" = true ])
}

# 检查网络连通性
check_network_connectivity() {
    log_info "检查网络连通性..."
    
    # 检查容器间网络
    local network_name="pathfinder-mini-network"
    
    if docker network ls | grep -q "$network_name"; then
        log_success "Docker 网络存在: $network_name"
    else
        log_error "Docker 网络不存在: $network_name"
        return 1
    fi
    
    # 检查端口占用
    local ports=("3000" "5432" "6379")
    
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            log_success "端口 $port: 已占用 (正常)"
        else
            log_warning "端口 $port: 未占用"
        fi
    done
}

# 检查备份文件
check_backup_files() {
    log_info "检查备份文件..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    
    if [ -d "$backup_dir" ]; then
        local recent_backups=$(find "$backup_dir" -type f -mtime -1 2>/dev/null | wc -l)
        
        if [ "$recent_backups" -gt 0 ]; then
            log_success "发现 $recent_backups 个最近备份文件"
        else
            log_warning "未发现最近的备份文件"
        fi
    else
        log_warning "备份目录不存在: $backup_dir"
    fi
}

# 性能检查
check_performance() {
    log_info "检查系统性能..."
    
    # 检查负载平均值
    if command -v uptime &> /dev/null; then
        local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        local load_num=$(echo "$load_avg" | sed 's/,//')
        
        if (( $(echo "$load_num > 4" | bc -l) )); then
            log_warning "系统负载较高: $load_avg"
        else
            log_success "系统负载正常: $load_avg"
        fi
    fi
    
    # 检查 Docker 资源使用
    if command -v docker &> /dev/null; then
        log_info "Docker 容器资源使用:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10
    fi
}

# 生成健康报告
generate_health_report() {
    local report_file="$PROJECT_ROOT/logs/health-check-$(date +%Y%m%d_%H%M%S).txt"
    local temp_report="/tmp/health-report.txt"
    
    {
        echo "Pathfinder Mini 健康检查报告"
        echo "==============================="
        echo "检查时间: $(date)"
        echo "检查者: $(whoami)@$(hostname)"
        echo ""
        
        echo "服务状态:"
        docker-compose -f "$PROJECT_ROOT/$COMPOSE_FILE" ps
        echo ""
        
        echo "磁盘使用:"
        df -h "$PROJECT_ROOT" | tail -1
        echo ""
        
        echo "内存使用:"
        free -h 2>/dev/null || echo "内存信息不可用"
        echo ""
        
        echo "Docker 容器资源:"
        docker stats --no-stream 2>/dev/null | head -5 || echo "Docker 统计不可用"
        echo ""
        
        echo "最近日志 (错误):"
        find "$PROJECT_ROOT/logs" -name "*.log" -type f -mtime -1 2>/dev/null | \
        xargs grep -i error 2>/dev/null | tail -10 || echo "无错误日志"
        
    } > "$temp_report"
    
    # 确保日志目录存在
    mkdir -p "$PROJECT_ROOT/logs"
    mv "$temp_report" "$report_file"
    
    log_success "健康报告已生成: $report_file"
}

# 主健康检查函数
main_health_check() {
    local start_time=$(date +%s)
    local failed_checks=0
    
    echo "==============================="
    echo "Pathfinder Mini 健康检查"
    echo "==============================="
    echo "开始时间: $(date)"
    echo ""
    
    # 执行各项检查
    local checks=(
        "check_config_files"
        "check_docker_services"
        "check_database_connection"
        "check_api_health"
        "check_disk_space"
        "check_memory_usage"
        "check_log_sizes"
        "check_network_connectivity"
        "check_backup_files"
    )
    
    for check in "${checks[@]}"; do
        if ! $check; then
            failed_checks=$((failed_checks + 1))
        fi
        echo ""
    done
    
    # 性能检查 (仅信息性)
    check_performance
    echo ""
    
    # 生成报告
    generate_health_report
    
    # 总结
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "==============================="
    echo "健康检查完成"
    echo "==============================="
    echo "检查时长: ${duration} 秒"
    echo "失败检查: $failed_checks 项"
    
    if [ $failed_checks -eq 0 ]; then
        log_success "所有检查通过，系统状态良好！"
        return 0
    else
        log_warning "有 $failed_checks 项检查失败，请查看详细信息"
        return $failed_checks
    fi
}

# 快速健康检查 (仅核心服务)
quick_health_check() {
    log_info "执行快速健康检查..."
    
    local checks=("check_docker_services" "check_database_connection" "check_api_health")
    local failed=0
    
    for check in "${checks[@]}"; do
        if ! $check; then
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "快速健康检查通过"
    else
        log_error "快速健康检查失败 ($failed 项)"
    fi
    
    return $failed
}

# 显示帮助信息
show_help() {
    echo "Pathfinder Mini 健康检查脚本"
    echo
    echo "使用方法:"
    echo "  $0 [选项]"
    echo
    echo "选项:"
    echo "  full     完整健康检查 (默认)"
    echo "  quick    快速健康检查"
    echo "  report   生成健康报告"
    echo "  --help   显示帮助信息"
    echo
    echo "示例:"
    echo "  $0           # 完整检查"
    echo "  $0 quick     # 快速检查"
    echo "  $0 report    # 仅生成报告"
}

# 主函数
main() {
    cd "$PROJECT_ROOT"
    
    case "${1:-full}" in
        full)
            main_health_check
            ;;
        quick)
            quick_health_check
            ;;
        report)
            generate_health_report
            ;;
        --help|-h)
            show_help
            ;;
        *)
            log_error "无效选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 检查必要文件
if [ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]; then
    log_error "Docker Compose 文件不存在: $COMPOSE_FILE"
    exit 1
fi

# 运行主函数
main "$@"