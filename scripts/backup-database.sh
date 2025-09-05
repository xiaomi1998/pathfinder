#!/bin/bash

# ==========================================
# Pathfinder 数据库备份脚本
# ==========================================
# 自动备份 PostgreSQL 和 Redis 数据

set -euo pipefail

# 脚本配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# 读取环境变量
load_environment() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    else
        log_error "环境文件不存在: $PROJECT_ROOT/.env"
        exit 1
    fi
}

# 创建备份目录
create_backup_dirs() {
    mkdir -p "$BACKUP_DIR/postgres"
    mkdir -p "$BACKUP_DIR/redis"
    mkdir -p "$BACKUP_DIR/logs"
}

# 备份 PostgreSQL
backup_postgres() {
    log_info "开始备份 PostgreSQL 数据库..."
    
    local pg_dump_file="$BACKUP_DIR/postgres/pathfinder_${TIMESTAMP}.sql"
    local pg_custom_file="$BACKUP_DIR/postgres/pathfinder_${TIMESTAMP}.dump"
    
    # 使用 docker-compose exec 执行备份
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-pathfinder_app}" \
        -d "${POSTGRES_DB:-pathfinder_db}" \
        --clean --create --if-exists > "$pg_dump_file"; then
        log_error "PostgreSQL SQL 备份失败"
        return 1
    fi
    
    # 创建自定义格式备份（更小，支持并行恢复）
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-pathfinder_app}" \
        -d "${POSTGRES_DB:-pathfinder_db}" \
        --format=custom --compress=9 > "$pg_custom_file"; then
        log_error "PostgreSQL 自定义格式备份失败"
        return 1
    fi
    
    # 压缩 SQL 备份
    gzip "$pg_dump_file"
    
    local sql_size=$(du -h "${pg_dump_file}.gz" | cut -f1)
    local custom_size=$(du -h "$pg_custom_file" | cut -f1)
    
    log_success "PostgreSQL 备份完成:"
    log_success "  SQL 格式: ${pg_dump_file}.gz ($sql_size)"
    log_success "  自定义格式: $pg_custom_file ($custom_size)"
    
    return 0
}

# 备份 Redis
backup_redis() {
    log_info "开始备份 Redis 数据..."
    
    local redis_backup_file="$BACKUP_DIR/redis/redis_${TIMESTAMP}.rdb"
    
    # 触发 Redis 保存
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T redis \
        redis-cli --raw BGSAVE; then
        log_error "Redis BGSAVE 命令失败"
        return 1
    fi
    
    # 等待备份完成
    log_info "等待 Redis 备份完成..."
    local retries=60
    while [ $retries -gt 0 ]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T redis \
            redis-cli --raw LASTSAVE | read -r timestamp; then
            if [ "$timestamp" != "${last_save:-0}" ]; then
                break
            fi
        fi
        retries=$((retries - 1))
        sleep 1
    done
    
    # 复制 RDB 文件
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T redis \
        cp /data/dump.rdb /tmp/backup_${TIMESTAMP}.rdb; then
        log_error "Redis 备份文件复制失败"
        return 1
    fi
    
    # 从容器复制到主机
    docker cp "$(docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" ps -q redis):/tmp/backup_${TIMESTAMP}.rdb" "$redis_backup_file"
    
    # 压缩备份文件
    gzip "$redis_backup_file"
    
    local size=$(du -h "${redis_backup_file}.gz" | cut -f1)
    log_success "Redis 备份完成: ${redis_backup_file}.gz ($size)"
    
    return 0
}

# 备份应用配置
backup_config() {
    log_info "备份应用配置..."
    
    local config_backup_file="$BACKUP_DIR/config_${TIMESTAMP}.tar.gz"
    
    # 备份配置文件
    tar -czf "$config_backup_file" \
        -C "$PROJECT_ROOT" \
        .env \
        docker-compose.mini.yml \
        backend/prisma/schema.prisma \
        database/ \
        nginx/ \
        monitoring/ 2>/dev/null || true
    
    local size=$(du -h "$config_backup_file" | cut -f1)
    log_success "配置备份完成: $config_backup_file ($size)"
}

# 备份日志文件
backup_logs() {
    log_info "备份日志文件..."
    
    local logs_backup_file="$BACKUP_DIR/logs/logs_${TIMESTAMP}.tar.gz"
    
    if [ -d "$PROJECT_ROOT/logs" ]; then
        tar -czf "$logs_backup_file" -C "$PROJECT_ROOT" logs/ 2>/dev/null || true
        
        local size=$(du -h "$logs_backup_file" | cut -f1)
        log_success "日志备份完成: $logs_backup_file ($size)"
    else
        log_warning "日志目录不存在，跳过日志备份"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理旧备份文件..."
    
    local retention_days="${BACKUP_RETENTION_DAYS:-7}"
    
    # 清理 PostgreSQL 备份
    find "$BACKUP_DIR/postgres" -name "pathfinder_*.sql.gz" -mtime +$retention_days -delete 2>/dev/null || true
    find "$BACKUP_DIR/postgres" -name "pathfinder_*.dump" -mtime +$retention_days -delete 2>/dev/null || true
    
    # 清理 Redis 备份
    find "$BACKUP_DIR/redis" -name "redis_*.rdb.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    # 清理配置备份
    find "$BACKUP_DIR" -name "config_*.tar.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    # 清理日志备份
    find "$BACKUP_DIR/logs" -name "logs_*.tar.gz" -mtime +$retention_days -delete 2>/dev/null || true
    
    log_success "清理完成，保留 $retention_days 天内的备份"
}

# 生成备份报告
generate_backup_report() {
    local report_file="$BACKUP_DIR/backup_report_${TIMESTAMP}.txt"
    
    {
        echo "Pathfinder 数据库备份报告"
        echo "=========================="
        echo "备份时间: $(date)"
        echo "备份类型: $1"
        echo ""
        
        echo "备份文件:"
        find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -exec ls -lh {} \; | while read -r line; do
            echo "  $line"
        done
        echo ""
        
        echo "磁盘使用情况:"
        du -sh "$BACKUP_DIR"/* 2>/dev/null | sort -hr || true
        echo ""
        
        echo "数据库状态:"
        docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" ps postgres redis
        echo ""
        
    } > "$report_file"
    
    log_success "备份报告生成: $report_file"
}

# 验证备份文件
verify_backups() {
    log_info "验证备份文件完整性..."
    
    local pg_backup_files=$(find "$BACKUP_DIR/postgres" -name "*${TIMESTAMP}*" -type f)
    local redis_backup_files=$(find "$BACKUP_DIR/redis" -name "*${TIMESTAMP}*" -type f)
    
    local verification_failed=false
    
    # 验证 PostgreSQL 备份
    for file in $pg_backup_files; do
        if [[ "$file" == *.gz ]]; then
            if ! gunzip -t "$file"; then
                log_error "PostgreSQL 备份文件损坏: $file"
                verification_failed=true
            fi
        elif [[ "$file" == *.dump ]]; then
            # 使用 pg_restore 验证自定义格式备份
            if ! docker-compose -f "$PROJECT_ROOT/docker-compose.mini.yml" exec -T postgres \
                pg_restore --list "$file" > /dev/null 2>&1; then
                log_error "PostgreSQL 自定义备份文件损坏: $file"
                verification_failed=true
            fi
        fi
    done
    
    # 验证 Redis 备份
    for file in $redis_backup_files; do
        if [[ "$file" == *.gz ]]; then
            if ! gunzip -t "$file"; then
                log_error "Redis 备份文件损坏: $file"
                verification_failed=true
            fi
        fi
    done
    
    if [ "$verification_failed" = true ]; then
        log_error "备份验证失败"
        return 1
    else
        log_success "所有备份文件验证通过"
        return 0
    fi
}

# 显示备份统计
show_backup_stats() {
    log_info "备份统计信息:"
    
    echo "磁盘使用情况:"
    du -sh "$BACKUP_DIR"/* 2>/dev/null | sort -hr || true
    echo ""
    
    echo "备份文件数量:"
    echo "  PostgreSQL: $(find "$BACKUP_DIR/postgres" -type f | wc -l) 个文件"
    echo "  Redis: $(find "$BACKUP_DIR/redis" -type f | wc -l) 个文件"
    echo "  配置: $(find "$BACKUP_DIR" -name "config_*.tar.gz" | wc -l) 个文件"
    echo "  日志: $(find "$BACKUP_DIR/logs" -name "logs_*.tar.gz" 2>/dev/null | wc -l) 个文件"
    echo ""
    
    echo "最新备份:"
    find "$BACKUP_DIR" -type f -name "*${TIMESTAMP}*" -exec ls -lh {} \;
}

# 错误处理
handle_error() {
    log_error "备份过程中发生错误"
    
    # 清理可能的不完整备份文件
    find "$BACKUP_DIR" -name "*${TIMESTAMP}*" -type f -size -1k -delete 2>/dev/null || true
    
    exit 1
}

trap handle_error ERR

# 主备份函数
backup_full() {
    log_info "开始完整备份..."
    
    local start_time=$(date +%s)
    
    create_backup_dirs
    
    if backup_postgres && backup_redis; then
        backup_config
        backup_logs
        verify_backups
        generate_backup_report "完整备份"
        cleanup_old_backups
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "完整备份完成，耗时 ${duration} 秒"
        show_backup_stats
    else
        log_error "备份失败"
        return 1
    fi
}

# 仅备份数据库
backup_database_only() {
    log_info "开始数据库备份..."
    
    create_backup_dirs
    
    if backup_postgres && backup_redis; then
        verify_backups
        generate_backup_report "数据库备份"
        
        log_success "数据库备份完成"
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "Pathfinder 数据库备份脚本"
    echo
    echo "使用方法:"
    echo "  $0 [选项]"
    echo
    echo "选项:"
    echo "  full     完整备份 (数据库 + 配置 + 日志)"
    echo "  db       仅备份数据库"
    echo "  stats    显示备份统计信息"
    echo "  cleanup  清理旧备份文件"
    echo "  --help   显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0 full      # 执行完整备份"
    echo "  $0 db        # 仅备份数据库"
    echo "  $0 stats     # 显示统计信息"
}

# 主函数
main() {
    local backup_type="${1:-full}"
    
    case "$backup_type" in
        full)
            load_environment
            backup_full
            ;;
        db|database)
            load_environment
            backup_database_only
            ;;
        stats)
            create_backup_dirs
            show_backup_stats
            ;;
        cleanup)
            load_environment
            create_backup_dirs
            cleanup_old_backups
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "无效的备份类型: $backup_type"
            show_help
            exit 1
            ;;
    esac
}

# 检查 Docker Compose 文件是否存在
if [ ! -f "$PROJECT_ROOT/docker-compose.mini.yml" ]; then
    log_error "Docker Compose 文件不存在: $PROJECT_ROOT/docker-compose.mini.yml"
    exit 1
fi

# 运行主函数
main "$@"