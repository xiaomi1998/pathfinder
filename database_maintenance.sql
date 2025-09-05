-- Pathfinder 数据库维护脚本
-- 版本: 1.0
-- 用途: 定期维护、优化和监控数据库性能

-- ==============================================
-- 1. 数据库健康检查函数
-- ==============================================

CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    check_name text,
    status text,
    details text,
    recommendation text
) AS $$
DECLARE
    total_connections integer;
    active_connections integer;
    db_size_mb numeric;
    largest_table_mb numeric;
BEGIN
    -- 检查连接数
    SELECT count(*) INTO total_connections FROM pg_stat_activity;
    SELECT count(*) INTO active_connections FROM pg_stat_activity WHERE state = 'active';
    
    -- 检查数据库大小
    SELECT round(pg_database_size(current_database()) / 1024.0 / 1024.0, 2) INTO db_size_mb;
    
    -- 获取最大表大小
    SELECT max(pg_total_relation_size(c.oid) / 1024.0 / 1024.0) INTO largest_table_mb
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public';
    
    -- 返回检查结果
    RETURN QUERY VALUES
        ('连接数检查', 
         CASE WHEN total_connections > 100 THEN 'WARNING' ELSE 'OK' END,
         format('总连接: %s, 活动连接: %s', total_connections, active_connections),
         CASE WHEN total_connections > 100 THEN '考虑增加连接池限制' ELSE '连接数正常' END),
        
        ('数据库大小', 
         CASE WHEN db_size_mb > 1000 THEN 'WARNING' ELSE 'OK' END,
         format('数据库大小: %s MB', db_size_mb),
         CASE WHEN db_size_mb > 1000 THEN '考虑数据归档或分区' ELSE '大小正常' END),
        
        ('表大小分布',
         CASE WHEN largest_table_mb > 500 THEN 'WARNING' ELSE 'OK' END,
         format('最大表大小: %s MB', round(largest_table_mb, 2)),
         CASE WHEN largest_table_mb > 500 THEN '考虑表分区或优化' ELSE '表大小正常' END);
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 2. 索引使用分析函数
-- ==============================================

CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    usage_ratio numeric,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.relname::text as tablename,
        s.indexrelname::text as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        CASE 
            WHEN s.idx_scan = 0 THEN 0
            ELSE round((s.idx_tup_read::numeric / s.idx_scan), 2)
        END as usage_ratio,
        CASE
            WHEN s.idx_scan = 0 THEN '未使用的索引，考虑删除'
            WHEN s.idx_scan < 100 THEN '使用率较低，评估是否需要'
            ELSE '使用正常'
        END::text as recommendation
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE i.indisunique = false  -- 排除唯一索引
    ORDER BY s.idx_scan ASC, s.schemaname, s.relname;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 3. 表统计信息更新函数
-- ==============================================

CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS text AS $$
DECLARE
    table_record record;
    result_text text := '';
BEGIN
    -- 更新所有用户表的统计信息
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
        result_text := result_text || format('已更新 %s.%s 的统计信息\n', 
                                           table_record.schemaname, 
                                           table_record.tablename);
    END LOOP;
    
    RETURN result_text || '统计信息更新完成';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. 死锁检测和分析函数
-- ==============================================

CREATE OR REPLACE FUNCTION check_locks_and_blocking()
RETURNS TABLE(
    blocked_pid integer,
    blocked_user text,
    blocked_query text,
    blocking_pid integer,
    blocking_user text,
    blocking_query text,
    lock_type text,
    wait_time interval
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.pid as blocked_pid,
        w.usename as blocked_user,
        w.query as blocked_query,
        l.pid as blocking_pid,
        l.usename as blocking_user,
        l.query as blocking_query,
        w.mode as lock_type,
        CURRENT_TIMESTAMP - w.query_start as wait_time
    FROM pg_stat_activity w
    JOIN pg_locks wl ON w.pid = wl.pid AND NOT wl.granted
    JOIN pg_locks l ON l.granted AND l.database = wl.database 
        AND l.relation = wl.relation AND l.mode != wl.mode
    JOIN pg_stat_activity l_act ON l.pid = l_act.pid
    WHERE w.pid != l.pid;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. 数据清理函数
-- ==============================================

-- 清理旧的审计日志（保留90天）
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM audit_log 
    WHERE timestamp < CURRENT_DATE - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE '已删除 % 条旧审计日志记录', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 清理已结束超过30天的AI会话
CREATE OR REPLACE FUNCTION cleanup_old_ai_sessions()
RETURNS integer AS $$
DECLARE
    deleted_sessions integer;
    deleted_messages integer;
BEGIN
    -- 首先删除关联的消息
    WITH old_sessions AS (
        SELECT id FROM ai_sessions 
        WHERE ended_at IS NOT NULL 
        AND ended_at < CURRENT_DATE - INTERVAL '30 days'
    )
    DELETE FROM ai_messages 
    WHERE session_id IN (SELECT id FROM old_sessions);
    
    GET DIAGNOSTICS deleted_messages = ROW_COUNT;
    
    -- 然后删除会话
    DELETE FROM ai_sessions 
    WHERE ended_at IS NOT NULL 
    AND ended_at < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    
    RAISE NOTICE '已删除 % 个旧AI会话和 % 条相关消息', deleted_sessions, deleted_messages;
    
    RETURN deleted_sessions;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 6. 数据归档函数
-- ==============================================

-- 归档超过1年的节点数据
CREATE OR REPLACE FUNCTION archive_old_node_data()
RETURNS integer AS $$
DECLARE
    archived_count integer;
BEGIN
    -- 创建归档表（如果不存在）
    CREATE TABLE IF NOT EXISTS node_data_archive (
        LIKE node_data INCLUDING ALL
    );
    
    -- 归档数据
    WITH archived_data AS (
        DELETE FROM node_data 
        WHERE week_start_date < CURRENT_DATE - INTERVAL '1 year'
        RETURNING *
    )
    INSERT INTO node_data_archive 
    SELECT * FROM archived_data;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RAISE NOTICE '已归档 % 条节点数据记录', archived_count;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 7. 性能优化函数
-- ==============================================

-- 重建碎片化严重的索引
CREATE OR REPLACE FUNCTION rebuild_fragmented_indexes()
RETURNS text AS $$
DECLARE
    index_record record;
    result_text text := '';
BEGIN
    -- 查找需要重建的索引（这里使用简化的逻辑）
    FOR index_record IN 
        SELECT schemaname, tablename, indexname
        FROM pg_stat_user_indexes
        WHERE idx_scan > 1000 -- 只处理使用频繁的索引
        AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('REINDEX INDEX %I.%I', index_record.schemaname, index_record.indexname);
            result_text := result_text || format('已重建索引: %s\n', index_record.indexname);
        EXCEPTION
            WHEN OTHERS THEN
                result_text := result_text || format('重建索引失败: %s - %s\n', 
                                                   index_record.indexname, SQLERRM);
        END;
    END LOOP;
    
    RETURN result_text || '索引重建任务完成';
END;
$$ LANGUAGE plpgsql;

-- 更新表统计信息和重组
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS text AS $$
DECLARE
    result_text text := '';
BEGIN
    -- 更新统计信息
    result_text := result_text || update_table_statistics() || E'\n\n';
    
    -- 清理数据
    PERFORM cleanup_old_audit_logs();
    PERFORM cleanup_old_ai_sessions();
    PERFORM archive_old_node_data();
    
    result_text := result_text || '数据清理和归档完成' || E'\n';
    
    -- 执行 VACUUM ANALYZE
    VACUUM ANALYZE;
    result_text := result_text || 'VACUUM ANALYZE 完成' || E'\n';
    
    RETURN result_text || '数据库优化完成';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. 监控报告函数
-- ==============================================

CREATE OR REPLACE FUNCTION generate_database_report()
RETURNS text AS $$
DECLARE
    report_text text := '';
    user_count integer;
    funnel_count integer;
    active_sessions integer;
    db_size_mb numeric;
BEGIN
    -- 获取基本统计信息
    SELECT count(*) INTO user_count FROM users WHERE is_active = true;
    SELECT count(*) INTO funnel_count FROM funnels;
    SELECT count(*) INTO active_sessions FROM ai_sessions WHERE ended_at IS NULL;
    SELECT round(pg_database_size(current_database()) / 1024.0 / 1024.0, 2) INTO db_size_mb;
    
    -- 生成报告
    report_text := format('
==============================================
Pathfinder 数据库状态报告
生成时间: %s
==============================================

基本统计:
- 活跃用户数: %s
- 漏斗总数: %s
- 活跃AI会话: %s
- 数据库大小: %s MB

表大小统计:
', CURRENT_TIMESTAMP, user_count, funnel_count, active_sessions, db_size_mb);
    
    -- 添加表大小信息
    report_text := report_text || (
        SELECT string_agg(
            format('- %s: %s MB (%s 行)', 
                   table_name, 
                   total_size_mb, 
                   row_count), E'\n'
        )
        FROM get_table_sizes()
        LIMIT 10
    );
    
    report_text := report_text || E'\n\n==============================================\n';
    
    RETURN report_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 9. 自动维护任务调度（示例）
-- ==============================================

-- 注意：PostgreSQL 本身不支持内置的任务调度
-- 以下是可以通过 cron 或外部调度工具执行的维护命令示例

/*
-- 每日凌晨2点执行清理任务
-- 0 2 * * * psql -d pathfinder_db -c "SELECT cleanup_old_audit_logs();"

-- 每周日凌晨3点执行完整优化
-- 0 3 * * 0 psql -d pathfinder_db -c "SELECT optimize_database();"

-- 每月第一天生成报告
-- 0 4 1 * * psql -d pathfinder_db -c "SELECT generate_database_report();" > /var/log/pathfinder_db_report.log
*/

-- ==============================================
-- 10. 备份和恢复辅助函数
-- ==============================================

-- 生成备份脚本
CREATE OR REPLACE FUNCTION generate_backup_script()
RETURNS text AS $$
BEGIN
    RETURN format('
#!/bin/bash
# Pathfinder 数据库备份脚本
# 生成时间: %s

BACKUP_DIR="/var/backups/pathfinder"
TIMESTAMP=$(date +"%%Y%%m%%d_%%H%%M%%S")
DB_NAME="%s"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 完整备份
pg_dump -h localhost -U pathfinder_app $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/pathfinder_full_$TIMESTAMP.dump"

# 仅数据备份（用于快速恢复测试数据）
pg_dump -h localhost -U pathfinder_app $DB_NAME \
  --format=custom \
  --data-only \
  --compress=9 \
  --file="$BACKUP_DIR/pathfinder_data_$TIMESTAMP.dump"

# 清理30天前的备份
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

echo "备份完成: $TIMESTAMP"
', CURRENT_TIMESTAMP, current_database());
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 11. 数据质量检查函数
-- ==============================================

CREATE OR REPLACE FUNCTION check_data_quality()
RETURNS TABLE(
    check_category text,
    issue_description text,
    affected_count bigint,
    severity text
) AS $$
BEGIN
    -- 检查孤立的节点数据
    RETURN QUERY
    SELECT 
        '数据一致性'::text,
        '存在孤立的节点数据（没有对应的节点）'::text,
        count(*)::bigint,
        'HIGH'::text
    FROM node_data nd
    LEFT JOIN nodes n ON nd.node_id = n.id
    WHERE n.id IS NULL
    HAVING count(*) > 0;
    
    -- 检查无效的转化率数据
    RETURN QUERY
    SELECT 
        '数据质量'::text,
        '存在转化人数大于进入人数的异常数据'::text,
        count(*)::bigint,
        'HIGH'::text
    FROM node_data
    WHERE converted_count > entry_count
    HAVING count(*) > 0;
    
    -- 检查长时间未更新的漏斗
    RETURN QUERY
    SELECT 
        '业务逻辑'::text,
        '存在超过30天未更新的漏斗'::text,
        count(*)::bigint,
        'MEDIUM'::text
    FROM funnels
    WHERE updated_at < CURRENT_DATE - INTERVAL '30 days'
    HAVING count(*) > 0;
    
    -- 检查没有节点的漏斗
    RETURN QUERY
    SELECT 
        '结构完整性'::text,
        '存在没有任何节点的空漏斗'::text,
        count(*)::bigint,
        'MEDIUM'::text
    FROM funnels f
    LEFT JOIN nodes n ON f.id = n.funnel_id
    WHERE n.id IS NULL
    HAVING count(*) > 0;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 完成消息
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pathfinder 数据库维护脚本加载完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '可用的维护函数:';
    RAISE NOTICE '- database_health_check() - 数据库健康检查';
    RAISE NOTICE '- analyze_index_usage() - 索引使用分析';
    RAISE NOTICE '- update_table_statistics() - 更新统计信息';
    RAISE NOTICE '- check_locks_and_blocking() - 检查锁和阻塞';
    RAISE NOTICE '- cleanup_old_audit_logs() - 清理旧审计日志';
    RAISE NOTICE '- cleanup_old_ai_sessions() - 清理旧AI会话';
    RAISE NOTICE '- archive_old_node_data() - 归档旧节点数据';
    RAISE NOTICE '- optimize_database() - 完整数据库优化';
    RAISE NOTICE '- generate_database_report() - 生成状态报告';
    RAISE NOTICE '- check_data_quality() - 数据质量检查';
    RAISE NOTICE '========================================';
    RAISE NOTICE '使用示例:';
    RAISE NOTICE '  SELECT * FROM database_health_check();';
    RAISE NOTICE '  SELECT optimize_database();';
    RAISE NOTICE '  SELECT * FROM check_data_quality();';
    RAISE NOTICE '========================================';
END
$$;