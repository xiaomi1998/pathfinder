#!/bin/bash

# Pathfinder 数据库维护脚本
# 包含性能优化、健康检查、统计更新等功能

set -euo pipefail

# ==========================================
# 配置变量
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/../config/maintenance.conf"

# 默认配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-pathfinder_db}"
DB_USER="${DB_USER:-pathfinder_app}"
MAINTENANCE_LOG="${MAINTENANCE_LOG:-/var/log/pathfinder/maintenance.log}"
VACUUM_THRESHOLD="${VACUUM_THRESHOLD:-20}"  # 死元组百分比阈值
REINDEX_THRESHOLD="${REINDEX_THRESHOLD:-30}" # 索引膨胀百分比阈值

# 加载配置文件
[[ -f "$CONFIG_FILE" ]] && source "$CONFIG_FILE"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ==========================================
# 工具函数
# ==========================================

# 日志记录
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$MAINTENANCE_LOG"
}

# 错误处理
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# 执行 SQL 查询
execute_sql() {
    local query="$1"
    local output_format="${2:-tuples-only}"
    
    PGPASSWORD="$PGPASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -t \
        -c "$query" 2>>"$MAINTENANCE_LOG"
}

# 检查数据库连接
check_connection() {
    if ! PGPASSWORD="$PGPASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        error_exit "无法连接到数据库 $DB_HOST:$DB_PORT"
    fi
    log "INFO" "数据库连接正常"
}

# ==========================================
# 数据库健康检查
# ==========================================

# 检查数据库大小
check_database_size() {
    log "INFO" "检查数据库大小"
    
    local db_size=$(execute_sql "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
    local table_sizes=$(execute_sql "
        SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
        LIMIT 10;
    ")
    
    log "INFO" "数据库总大小: $db_size"
    log "INFO" "前10个最大表:\n$table_sizes"
}

# 检查连接状态
check_connections() {
    log "INFO" "检查数据库连接状态"
    
    local active_connections=$(execute_sql "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
    local idle_connections=$(execute_sql "SELECT count(*) FROM pg_stat_activity WHERE state = 'idle';")
    local total_connections=$(execute_sql "SELECT count(*) FROM pg_stat_activity;")
    local max_connections=$(execute_sql "SHOW max_connections;" | tr -d ' ')
    
    log "INFO" "活跃连接数: $active_connections"
    log "INFO" "空闲连接数: $idle_connections"
    log "INFO" "总连接数: $total_connections / $max_connections"
    
    # 检查长时间运行的查询
    local long_queries=$(execute_sql "
        SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
        FROM pg_stat_activity 
        WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes' 
        AND state = 'active';
    ")
    
    if [[ -n "$long_queries" ]]; then
        log "WARN" "发现长时间运行的查询:\n$long_queries"
    fi
}

# 检查锁等待
check_locks() {
    log "INFO" "检查数据库锁状态"
    
    local blocking_queries=$(execute_sql "
        SELECT blocked_locks.pid AS blocked_pid,
               blocked_activity.usename AS blocked_user,
               blocking_locks.pid AS blocking_pid,
               blocking_activity.usename AS blocking_user,
               blocked_activity.query AS blocked_statement,
               blocking_activity.query AS current_statement_in_blocking_process
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
            ON blocking_locks.locktype = blocked_locks.locktype
            AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
            AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
            AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
            AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
            AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
            AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
            AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
            AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
            AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
            AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted;
    ")
    
    if [[ -n "$blocking_queries" ]]; then
        log "WARN" "发现锁等待情况:\n$blocking_queries"
    else
        log "INFO" "没有发现锁等待"
    fi
}

# 检查死元组
check_dead_tuples() {
    log "INFO" "检查表的死元组情况"
    
    local dead_tuples=$(execute_sql "
        SELECT schemaname, tablename, 
               n_live_tup, n_dead_tup,
               CASE WHEN n_live_tup > 0 
                    THEN round(n_dead_tup::float / n_live_tup * 100, 2) 
                    ELSE 0 
               END as dead_ratio
        FROM pg_stat_user_tables 
        WHERE n_dead_tup > 1000
        ORDER BY dead_ratio DESC;
    ")
    
    log "INFO" "死元组统计:\n$dead_tuples"
    
    # 检查需要 VACUUM 的表
    local tables_need_vacuum=$(execute_sql "
        SELECT schemaname||'.'||tablename as table_name
        FROM pg_stat_user_tables 
        WHERE n_live_tup > 0 
        AND (n_dead_tup::float / n_live_tup * 100) > $VACUUM_THRESHOLD;
    ")
    
    if [[ -n "$tables_need_vacuum" ]]; then
        log "WARN" "以下表需要执行 VACUUM (死元组比例 > ${VACUUM_THRESHOLD}%):\n$tables_need_vacuum"
    fi
}

# 检查索引使用情况
check_index_usage() {
    log "INFO" "检查索引使用情况"
    
    # 未使用的索引
    local unused_indexes=$(execute_sql "
        SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
        AND indexname NOT LIKE '%_pkey';
    ")
    
    if [[ -n "$unused_indexes" ]]; then
        log "WARN" "发现未使用的索引:\n$unused_indexes"
    fi
    
    # 低效索引
    local low_efficiency_indexes=$(execute_sql "
        SELECT schemaname, tablename, indexname, 
               idx_tup_read, idx_tup_fetch,
               CASE WHEN idx_tup_read > 0 
                    THEN round(idx_tup_fetch::float / idx_tup_read * 100, 2) 
                    ELSE 0 
               END as efficiency
        FROM pg_stat_user_indexes 
        WHERE idx_tup_read > 1000
        AND (idx_tup_fetch::float / idx_tup_read * 100) < 50
        ORDER BY efficiency;
    ")
    
    if [[ -n "$low_efficiency_indexes" ]]; then
        log "WARN" "发现低效索引 (效率 < 50%):\n$low_efficiency_indexes"
    fi
}

# ==========================================
# 性能优化操作
# ==========================================

# 更新表统计信息
update_statistics() {
    log "INFO" "开始更新表统计信息"
    
    execute_sql "ANALYZE;" >/dev/null
    
    log "INFO" "表统计信息更新完成"
}

# 智能 VACUUM
intelligent_vacuum() {
    log "INFO" "开始智能 VACUUM 操作"
    
    # 获取需要 VACUUM 的表
    local tables_to_vacuum=$(execute_sql "
        SELECT schemaname||'.'||tablename
        FROM pg_stat_user_tables 
        WHERE n_live_tup > 0 
        AND (n_dead_tup::float / n_live_tup * 100) > $VACUUM_THRESHOLD;
    " | tr '\n' ' ')
    
    if [[ -z "$tables_to_vacuum" ]]; then
        log "INFO" "没有表需要执行 VACUUM"
        return
    fi
    
    # 对每个表执行 VACUUM
    for table in $tables_to_vacuum; do
        log "INFO" "对表 $table 执行 VACUUM"
        execute_sql "VACUUM VERBOSE $table;" >/dev/null 2>&1
    done
    
    log "INFO" "智能 VACUUM 完成"
}

# 智能 REINDEX
intelligent_reindex() {
    log "INFO" "开始智能 REINDEX 操作"
    
    # 检查索引膨胀
    local bloated_indexes=$(execute_sql "
        SELECT schemaname||'.'||indexname as index_name
        FROM pg_stat_user_indexes pgsui
        JOIN pg_statio_user_indexes pgsiui ON pgsui.indexrelid = pgsiui.indexrelid
        WHERE pgsui.idx_tup_read > 1000
        AND pgsiui.idx_blks_hit / GREATEST(pgsiui.idx_blks_read + pgsiui.idx_blks_hit, 1) < 0.7;
    " | tr '\n' ' ')
    
    if [[ -z "$bloated_indexes" ]]; then
        log "INFO" "没有索引需要重建"
        return
    fi
    
    # 重建膨胀的索引
    for index in $bloated_indexes; do
        log "INFO" "重建索引 $index"
        execute_sql "REINDEX INDEX CONCURRENTLY $index;" >/dev/null 2>&1
    done
    
    log "INFO" "智能 REINDEX 完成"
}

# 清理临时文件和缓存
cleanup_temp_files() {
    log "INFO" "清理临时文件"
    
    # 清理 PostgreSQL 临时文件
    execute_sql "SELECT pg_temp_cleanup();" >/dev/null 2>&1 || true
    
    # 重置查询计划缓存
    execute_sql "SELECT pg_stat_reset_shared('bgwriter');" >/dev/null 2>&1 || true
    
    log "INFO" "临时文件清理完成"
}

# ==========================================
# 数据完整性检查
# ==========================================

# 检查外键约束
check_foreign_keys() {
    log "INFO" "检查外键约束"
    
    local fk_violations=$(execute_sql "
        SELECT conrelid::regclass as table_name, conname as constraint_name
        FROM pg_constraint 
        WHERE contype = 'f' 
        AND NOT EXISTS (
            SELECT 1 FROM pg_constraint c2 
            WHERE c2.confrelid = pg_constraint.conrelid 
            AND c2.contype = 'f'
        );
    ")
    
    if [[ -n "$fk_violations" ]]; then
        log "WARN" "发现外键约束问题:\n$fk_violations"
    else
        log "INFO" "外键约束检查通过"
    fi
}

# 检查数据一致性
check_data_consistency() {
    log "INFO" "检查数据一致性"
    
    # 检查用户关联的漏斗数据
    local orphaned_funnels=$(execute_sql "
        SELECT COUNT(*) FROM funnels f 
        LEFT JOIN users u ON f.user_id = u.id 
        WHERE u.id IS NULL;
    ")
    
    if [[ "$orphaned_funnels" -gt 0 ]]; then
        log "WARN" "发现 $orphaned_funnels 个孤立的漏斗记录"
    fi
    
    # 检查节点关联的漏斗数据
    local orphaned_nodes=$(execute_sql "
        SELECT COUNT(*) FROM nodes n 
        LEFT JOIN funnels f ON n.funnel_id = f.id 
        WHERE f.id IS NULL;
    ")
    
    if [[ "$orphaned_nodes" -gt 0 ]]; then
        log "WARN" "发现 $orphaned_nodes 个孤立的节点记录"
    fi
    
    # 检查数据约束
    local constraint_violations=$(execute_sql "
        SELECT COUNT(*) FROM node_data 
        WHERE converted_count > entry_count;
    ")
    
    if [[ "$constraint_violations" -gt 0 ]]; then
        log "ERROR" "发现 $constraint_violations 个数据约束违反记录 (converted_count > entry_count)"
    fi
}

# ==========================================
# 监控指标收集
# ==========================================

# 收集性能指标
collect_performance_metrics() {
    log "INFO" "收集性能指标"
    
    # 数据库性能指标
    local metrics=$(execute_sql "
        SELECT 
            'database_size_bytes' as metric,
            pg_database_size('$DB_NAME') as value
        UNION ALL
        SELECT 
            'active_connections' as metric,
            count(*) as value
        FROM pg_stat_activity WHERE state = 'active'
        UNION ALL
        SELECT 
            'idle_connections' as metric,
            count(*) as value
        FROM pg_stat_activity WHERE state = 'idle'
        UNION ALL
        SELECT 
            'total_queries' as metric,
            sum(calls) as value
        FROM pg_stat_statements
        UNION ALL
        SELECT 
            'cache_hit_ratio' as metric,
            round(sum(blks_hit) * 100.0 / sum(blks_hit + blks_read), 2) as value
        FROM pg_stat_database WHERE datname = '$DB_NAME';
    ")
    
    log "INFO" "性能指标:\n$metrics"
    
    # 将指标写入文件供 Prometheus 收集
    local metrics_file="/tmp/pathfinder_db_metrics.prom"
    echo "$metrics" | while read metric value; do
        echo "pathfinder_db_${metric} ${value}" >> "$metrics_file"
    done
}

# ==========================================
# 自动化维护任务
# ==========================================

# 每日维护任务
daily_maintenance() {
    log "INFO" "开始每日维护任务"
    
    check_connection
    check_database_size
    check_connections
    check_locks
    update_statistics
    collect_performance_metrics
    
    log "INFO" "每日维护任务完成"
}

# 每周维护任务
weekly_maintenance() {
    log "INFO" "开始每周维护任务"
    
    check_connection
    check_dead_tuples
    check_index_usage
    intelligent_vacuum
    check_foreign_keys
    check_data_consistency
    
    log "INFO" "每周维护任务完成"
}

# 每月维护任务
monthly_maintenance() {
    log "INFO" "开始每月维护任务"
    
    check_connection
    intelligent_reindex
    cleanup_temp_files
    
    # 生成月度报告
    generate_monthly_report
    
    log "INFO" "每月维护任务完成"
}

# 生成月度报告
generate_monthly_report() {
    log "INFO" "生成月度维护报告"
    
    local report_file="/tmp/pathfinder_monthly_report_$(date +%Y%m).txt"
    
    cat > "$report_file" <<EOF
Pathfinder 数据库月度维护报告
生成时间: $(date)

==== 数据库概况 ====
$(execute_sql "
SELECT 
    'Database Size: ' || pg_size_pretty(pg_database_size('$DB_NAME')) as info
UNION ALL
SELECT 
    'Total Tables: ' || count(*)::text
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes: ' || count(*)::text
FROM pg_indexes WHERE schemaname = 'public';
")

==== 表统计 ====
$(execute_sql "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 10;
")

==== 索引效率 ====
$(execute_sql "
SELECT 
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE WHEN idx_tup_read > 0 
         THEN round(idx_tup_fetch::float / idx_tup_read * 100, 2) 
         ELSE 0 
    END as efficiency
FROM pg_stat_user_indexes 
WHERE idx_tup_read > 100
ORDER BY efficiency DESC
LIMIT 10;
")

EOF
    
    log "INFO" "月度报告生成完成: $report_file"
}

# ==========================================
# 主要入口函数
# ==========================================

show_help() {
    cat <<EOF
Pathfinder 数据库维护脚本

用法: $0 [选项] <命令>

命令:
  daily             执行每日维护任务
  weekly            执行每周维护任务
  monthly           执行每月维护任务
  health            执行健康检查
  vacuum            执行智能 VACUUM
  reindex           执行智能 REINDEX
  analyze           更新统计信息
  metrics           收集性能指标
  
选项:
  -h, --help        显示此帮助信息
  -c, --config FILE 指定配置文件路径
  
环境变量:
  DB_HOST           数据库主机地址
  DB_PORT           数据库端口  
  DB_NAME           数据库名称
  DB_USER           数据库用户名
  PGPASSWORD        数据库密码
  
示例:
  $0 daily          # 执行每日维护
  $0 health         # 执行健康检查
  $0 vacuum         # 执行 VACUUM 操作
  
EOF
}

main() {
    local command=""
    
    # 确保日志目录存在
    mkdir -p "$(dirname "$MAINTENANCE_LOG")"
    
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
            daily|weekly|monthly|health|vacuum|reindex|analyze|metrics)
                command="$1"
                shift
                ;;
            *)
                echo "未知选项: $1" >&2
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$command" ]]; then
        echo "错误: 必须指定命令" >&2
        show_help
        exit 1
    fi
    
    log "INFO" "开始执行维护命令: $command"
    
    case $command in
        daily)
            daily_maintenance
            ;;
        weekly)
            weekly_maintenance
            ;;
        monthly)
            monthly_maintenance
            ;;
        health)
            check_connection
            check_database_size
            check_connections
            check_locks
            check_dead_tuples
            check_index_usage
            check_foreign_keys
            check_data_consistency
            ;;
        vacuum)
            check_connection
            intelligent_vacuum
            ;;
        reindex)
            check_connection
            intelligent_reindex
            ;;
        analyze)
            check_connection
            update_statistics
            ;;
        metrics)
            check_connection
            collect_performance_metrics
            ;;
    esac
    
    log "INFO" "维护任务完成"
}

main "$@"