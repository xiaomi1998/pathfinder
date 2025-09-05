#!/bin/bash

# Pathfinder 数据库备份脚本
# 支持全量备份、增量备份、点恢复等功能

set -euo pipefail

# ==========================================
# 配置变量
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/backup.conf"

# 默认配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-pathfinder_db}"
DB_USER="${DB_USER:-pathfinder_app}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/pathfinder}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-9}"
AWS_S3_BUCKET="${AWS_S3_BUCKET:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-}"

# 加载配置文件
[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"

# 时间戳
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_ONLY=$(date +"%Y%m%d")
LOG_FILE="${BACKUP_DIR}/logs/backup_${TIMESTAMP}.log"

# ==========================================
# 工具函数
# ==========================================

# 日志记录
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# 错误处理
error_exit() {
    log "ERROR" "$1"
    send_notification "FAILED" "$1"
    exit 1
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # Slack 通知
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Pathfinder DB Backup $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # 邮件通知
    if [[ -n "$EMAIL_RECIPIENTS" ]]; then
        echo "$message" | mail -s "Pathfinder DB Backup $status" "$EMAIL_RECIPIENTS" 2>/dev/null || true
    fi
}

# 检查依赖
check_dependencies() {
    local deps=("pg_dump" "pg_basebackup" "gzip" "aws")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            error_exit "必需的命令 $dep 未找到"
        fi
    done
    
    log "INFO" "依赖检查完成"
}

# 创建目录结构
setup_directories() {
    local dirs=(
        "$BACKUP_DIR"
        "$BACKUP_DIR/full"
        "$BACKUP_DIR/incremental"
        "$BACKUP_DIR/wal"
        "$BACKUP_DIR/logs"
        "$BACKUP_DIR/temp"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    log "INFO" "目录结构创建完成"
}

# 检查数据库连接
check_database_connection() {
    if ! PGPASSWORD="$PGPASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        error_exit "无法连接到数据库 $DB_HOST:$DB_PORT"
    fi
    
    log "INFO" "数据库连接检查通过"
}

# ==========================================
# 备份功能
# ==========================================

# 全量备份
full_backup() {
    log "INFO" "开始全量备份"
    
    local backup_file="${BACKUP_DIR}/full/pathfinder_full_${TIMESTAMP}.dump"
    local compressed_file="${backup_file}.gz"
    
    # 使用 pg_dump 进行逻辑备份
    PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=custom \
        --compress=0 \
        --verbose \
        --no-password \
        --file="$backup_file" 2>>"$LOG_FILE"
    
    if [[ $? -ne 0 ]]; then
        error_exit "pg_dump 备份失败"
    fi
    
    # 压缩备份文件
    gzip -${COMPRESSION_LEVEL} "$backup_file"
    
    local backup_size=$(du -h "$compressed_file" | cut -f1)
    log "INFO" "全量备份完成，文件大小: $backup_size"
    
    # 上传到云存储
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        upload_to_s3 "$compressed_file" "full/"
    fi
    
    # 创建备份信息文件
    create_backup_info_file "$compressed_file" "full"
    
    echo "$compressed_file"
}

# 增量备份 (基于 WAL 的连续归档)
incremental_backup() {
    log "INFO" "开始增量备份（WAL 归档）"
    
    local wal_backup_dir="${BACKUP_DIR}/wal/${DATE_ONLY}"
    mkdir -p "$wal_backup_dir"
    
    # 强制进行 WAL 切换
    PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT pg_switch_wal();" >>"$LOG_FILE" 2>&1
    
    # 归档 WAL 文件
    local wal_count=0
    for wal_file in /var/lib/postgresql/*/main/pg_wal/[0-9A-F]*; do
        if [[ -f "$wal_file" ]]; then
            cp "$wal_file" "$wal_backup_dir/"
            ((wal_count++))
        fi
    done
    
    log "INFO" "增量备份完成，归档了 $wal_count 个 WAL 文件"
    
    # 上传到云存储
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        aws s3 sync "$wal_backup_dir" "s3://$AWS_S3_BUCKET/wal/${DATE_ONLY}/"
    fi
}

# 物理备份 (基础备份)
physical_backup() {
    log "INFO" "开始物理备份"
    
    local backup_dir="${BACKUP_DIR}/physical/pathfinder_base_${TIMESTAMP}"
    
    # 使用 pg_basebackup
    PGPASSWORD="$PGPASSWORD" pg_basebackup \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -D "$backup_dir" \
        -Ft \
        -z \
        -P \
        -v 2>>"$LOG_FILE"
    
    if [[ $? -ne 0 ]]; then
        error_exit "pg_basebackup 物理备份失败"
    fi
    
    # 压缩备份目录
    tar -czf "${backup_dir}.tar.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
    rm -rf "$backup_dir"
    
    local backup_size=$(du -h "${backup_dir}.tar.gz" | cut -f1)
    log "INFO" "物理备份完成，文件大小: $backup_size"
    
    # 上传到云存储
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        upload_to_s3 "${backup_dir}.tar.gz" "physical/"
    fi
    
    echo "${backup_dir}.tar.gz"
}

# 上传到 S3
upload_to_s3() {
    local file_path=$1
    local s3_prefix=$2
    
    log "INFO" "上传备份到 S3: $file_path"
    
    aws s3 cp "$file_path" "s3://$AWS_S3_BUCKET/${s3_prefix}$(basename "$file_path")" \
        --storage-class STANDARD_IA \
        --metadata "backup-date=$DATE_ONLY,backup-type=$s3_prefix" 2>>"$LOG_FILE"
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "S3 上传成功"
    else
        log "WARN" "S3 上传失败"
    fi
}

# 创建备份信息文件
create_backup_info_file() {
    local backup_file=$1
    local backup_type=$2
    local info_file="${backup_file}.info"
    
    # 获取数据库信息
    local db_size=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    local db_version=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT version();")
    
    cat > "$info_file" <<EOF
{
  "backup_type": "$backup_type",
  "timestamp": "$TIMESTAMP",
  "database_name": "$DB_NAME",
  "database_size": "$db_size",
  "database_version": "$db_version",
  "backup_file": "$(basename "$backup_file")",
  "backup_size": "$(du -h "$backup_file" | cut -f1)",
  "compression": "$COMPRESSION_LEVEL",
  "host": "$DB_HOST",
  "port": "$DB_PORT"
}
EOF
    
    log "INFO" "备份信息文件创建: $info_file"
}

# ==========================================
# 清理和维护
# ==========================================

# 清理过期备份
cleanup_old_backups() {
    log "INFO" "清理 $RETENTION_DAYS 天前的备份"
    
    # 本地清理
    find "$BACKUP_DIR" -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete 2>>"$LOG_FILE"
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>>"$LOG_FILE"
    find "$BACKUP_DIR" -name "*.info" -mtime +$RETENTION_DAYS -delete 2>>"$LOG_FILE"
    
    # 清理空目录
    find "$BACKUP_DIR" -type d -empty -delete 2>>"$LOG_FILE"
    
    # S3 清理 (如果配置了)
    if [[ -n "$AWS_S3_BUCKET" ]]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3api list-objects-v2 --bucket "$AWS_S3_BUCKET" --query "Contents[?LastModified<'$cutoff_date'].Key" --output text | \
        xargs -I {} aws s3 rm "s3://$AWS_S3_BUCKET/{}" 2>>"$LOG_FILE"
    fi
    
    log "INFO" "清理完成"
}

# 验证备份完整性
verify_backup() {
    local backup_file=$1
    
    log "INFO" "验证备份完整性: $backup_file"
    
    if [[ "$backup_file" == *.gz ]]; then
        # 检查压缩文件完整性
        gzip -t "$backup_file"
        if [[ $? -ne 0 ]]; then
            error_exit "备份文件压缩损坏: $backup_file"
        fi
        
        # 解压并验证 pg_dump 文件
        local temp_file="${BACKUP_DIR}/temp/verify_${TIMESTAMP}.dump"
        gunzip -c "$backup_file" > "$temp_file"
        
        # 尝试列出备份内容
        pg_restore --list "$temp_file" >/dev/null 2>&1
        if [[ $? -ne 0 ]]; then
            rm -f "$temp_file"
            error_exit "备份文件格式错误: $backup_file"
        fi
        
        rm -f "$temp_file"
    fi
    
    log "INFO" "备份验证通过: $backup_file"
}

# ==========================================
# 恢复功能
# ==========================================

# 恢复数据库
restore_database() {
    local backup_file=$1
    local target_db="${2:-${DB_NAME}_restore_$(date +%s)}"
    
    log "INFO" "开始恢复数据库到: $target_db"
    
    # 创建目标数据库
    PGPASSWORD="$PGPASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$target_db" 2>>"$LOG_FILE"
    
    # 恢复数据
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$PGPASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -v 2>>"$LOG_FILE"
    else
        PGPASSWORD="$PGPASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -v "$backup_file" 2>>"$LOG_FILE"
    fi
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "数据库恢复成功: $target_db"
    else
        error_exit "数据库恢复失败"
    fi
}

# ==========================================
# 主要入口函数
# ==========================================

# 显示帮助信息
show_help() {
    cat <<EOF
Pathfinder 数据库备份脚本

用法: $0 [选项] <命令>

命令:
  full              执行全量备份
  incremental       执行增量备份
  physical          执行物理备份
  cleanup           清理过期备份
  verify <file>     验证备份文件
  restore <file>    恢复数据库
  
选项:
  -h, --help        显示此帮助信息
  -c, --config FILE 指定配置文件路径
  -v, --verbose     详细输出模式
  
环境变量:
  DB_HOST           数据库主机地址
  DB_PORT           数据库端口
  DB_NAME           数据库名称
  DB_USER           数据库用户名
  PGPASSWORD        数据库密码
  BACKUP_DIR        备份目录
  AWS_S3_BUCKET     S3 存储桶名称
  
示例:
  $0 full                                # 执行全量备份
  $0 verify /path/to/backup.dump.gz     # 验证备份文件
  $0 restore /path/to/backup.dump.gz    # 恢复数据库
  
EOF
}

# 主函数
main() {
    local command=""
    local verbose=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            full|incremental|physical|cleanup)
                command="$1"
                shift
                ;;
            verify|restore)
                command="$1"
                target_file="$2"
                shift 2
                ;;
            *)
                echo "未知选项: $1" >&2
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查命令
    if [[ -z "$command" ]]; then
        echo "错误: 必须指定命令" >&2
        show_help
        exit 1
    fi
    
    # 初始化
    setup_directories
    check_dependencies
    check_database_connection
    
    log "INFO" "开始执行命令: $command"
    
    # 执行相应命令
    case $command in
        full)
            backup_file=$(full_backup)
            verify_backup "$backup_file"
            send_notification "SUCCESS" "全量备份完成: $backup_file"
            ;;
        incremental)
            incremental_backup
            send_notification "SUCCESS" "增量备份完成"
            ;;
        physical)
            backup_file=$(physical_backup)
            send_notification "SUCCESS" "物理备份完成: $backup_file"
            ;;
        cleanup)
            cleanup_old_backups
            send_notification "SUCCESS" "备份清理完成"
            ;;
        verify)
            if [[ -z "$target_file" ]]; then
                error_exit "请指定要验证的备份文件"
            fi
            verify_backup "$target_file"
            log "INFO" "验证完成"
            ;;
        restore)
            if [[ -z "$target_file" ]]; then
                error_exit "请指定要恢复的备份文件"
            fi
            restore_database "$target_file"
            log "INFO" "恢复完成"
            ;;
    esac
    
    log "INFO" "脚本执行完成"
}

# 执行主函数
main "$@"