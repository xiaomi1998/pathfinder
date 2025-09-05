-- ==========================================
-- Pathfinder 数据库索引优化脚本
-- ==========================================
-- 此脚本创建高性能索引以优化查询性能
-- 使用 CONCURRENTLY 以避免锁表

-- ==========================================
-- 复合索引 (多列查询优化)
-- ==========================================

-- 漏斗查询优化索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_user_status_created 
ON funnels(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_user_template 
ON funnels(user_id, is_template, status);

-- 节点数据分析索引 (包含常用列)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_analytics 
ON node_data(node_id, week_start_date DESC) 
INCLUDE (entry_count, converted_count, conversion_rate, revenue);

-- 节点数据时间序列索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_time_series 
ON node_data(week_start_date DESC, node_id) 
WHERE entry_count > 0;

-- AI 会话分析索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sessions_user_context 
ON ai_sessions(user_id, session_context, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sessions_funnel_active 
ON ai_sessions(funnel_id, created_at DESC) 
WHERE ended_at IS NULL;

-- 边连接查询索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_edges_funnel_nodes 
ON edges(funnel_id, source_node_id, target_node_id);

-- ==========================================
-- 部分索引 (条件查询优化)
-- ==========================================

-- 活跃用户索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_email 
ON users(email) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_username 
ON users(username) 
WHERE is_active = true;

-- 活跃漏斗索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_active 
ON funnels(user_id, name) 
WHERE status = 'active';

-- 模板漏斗索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_templates 
ON funnels(name, created_at DESC) 
WHERE is_template = true;

-- 未验证邮箱用户索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_unverified 
ON users(created_at DESC) 
WHERE is_email_verified = false AND is_active = true;

-- 进行中的 AI 会话索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sessions_ongoing 
ON ai_sessions(user_id, created_at DESC) 
WHERE ended_at IS NULL;

-- 高转化率节点数据索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_high_conversion 
ON node_data(node_id, conversion_rate DESC) 
WHERE conversion_rate > 0.5;

-- 有收入的节点数据索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_revenue 
ON node_data(week_start_date DESC, revenue DESC) 
WHERE revenue IS NOT NULL AND revenue > 0;

-- ==========================================
-- GIN 索引 (数组和全文搜索)
-- ==========================================

-- 漏斗标签搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_tags 
ON funnels USING gin(tags);

-- 用户全文搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fulltext 
ON users USING gin((username || ' ' || coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops);

-- 漏斗名称和描述全文搜索
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_fulltext 
ON funnels USING gin((name || ' ' || coalesce(description, '')) gin_trgm_ops);

-- AI 消息内容搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_content 
ON ai_messages USING gin(content gin_trgm_ops);

-- JSON 数据搜索索引 (漏斗画布数据)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_canvas_data 
ON funnels USING gin(canvas_data);

-- ==========================================
-- 覆盖索引 (避免回表查询)
-- ==========================================

-- 用户基本信息覆盖索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_profile 
ON users(id) 
INCLUDE (username, email, first_name, last_name, avatar, created_at, last_login_at);

-- 漏斗列表覆盖索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_list 
ON funnels(user_id, created_at DESC) 
INCLUDE (name, description, status, is_template, tags);

-- 节点基本信息覆盖索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nodes_info 
ON nodes(funnel_id) 
INCLUDE (node_type, label, position_x, position_y, created_at);

-- ==========================================
-- 时间分区相关索引
-- ==========================================

-- 按月分区的节点数据索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_monthly 
ON node_data(date_trunc('month', week_start_date), node_id);

-- 按周分区的节点数据索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_weekly 
ON node_data(week_start_date, node_id) 
WHERE week_start_date >= CURRENT_DATE - INTERVAL '12 weeks';

-- AI 消息按日期索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_daily 
ON ai_messages(date_trunc('day', created_at), session_id);

-- ==========================================
-- 审计和监控索引
-- ==========================================

-- 审计日志查询索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user_time 
ON audit_log(user_id, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_table_operation 
ON audit_log(table_name, operation, timestamp DESC);

-- 性能监控索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_login_stats 
ON users(last_login_at DESC) 
WHERE last_login_at IS NOT NULL;

-- ==========================================
-- 外键索引优化
-- ==========================================

-- 确保所有外键都有对应的索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_user_id 
ON funnels(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nodes_funnel_id 
ON nodes(funnel_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_node_data_node_id 
ON node_data(node_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_edges_source_node_id 
ON edges(source_node_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_edges_target_node_id 
ON edges(target_node_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sessions_user_id 
ON ai_sessions(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_sessions_funnel_id 
ON ai_sessions(funnel_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_session_id 
ON ai_messages(session_id);

-- ==========================================
-- 统计信息更新
-- ==========================================

-- 更新表统计信息以优化查询计划
ANALYZE users;
ANALYZE funnels;
ANALYZE nodes;
ANALYZE edges;
ANALYZE node_data;
ANALYZE ai_sessions;
ANALYZE ai_messages;
ANALYZE audit_log;

-- ==========================================
-- 创建视图用于常用查询
-- ==========================================

-- 漏斗统计视图
CREATE OR REPLACE VIEW funnel_stats AS
SELECT 
    f.id as funnel_id,
    f.name as funnel_name,
    f.user_id,
    f.status,
    COUNT(n.id) as node_count,
    COUNT(e.id) as edge_count,
    COALESCE(AVG(nd.conversion_rate), 0) as avg_conversion_rate,
    COALESCE(SUM(nd.entry_count), 0) as total_entries,
    COALESCE(SUM(nd.converted_count), 0) as total_conversions,
    COALESCE(SUM(nd.revenue), 0) as total_revenue,
    COALESCE(SUM(nd.cost), 0) as total_cost,
    MAX(nd.week_start_date) as latest_data_date,
    f.created_at,
    f.updated_at
FROM funnels f
LEFT JOIN nodes n ON f.id = n.funnel_id
LEFT JOIN edges e ON f.id = e.funnel_id
LEFT JOIN node_data nd ON n.id = nd.node_id
GROUP BY f.id, f.name, f.user_id, f.status, f.created_at, f.updated_at;

-- 用户活动统计视图
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT f.id) as funnel_count,
    COUNT(DISTINCT CASE WHEN f.status = 'active' THEN f.id END) as active_funnel_count,
    COUNT(DISTINCT n.id) as node_count,
    COUNT(DISTINCT ai.id) as ai_session_count,
    MAX(u.last_login_at) as last_login,
    MAX(f.updated_at) as last_funnel_activity,
    u.created_at as user_created_at
FROM users u
LEFT JOIN funnels f ON u.id = f.user_id
LEFT JOIN nodes n ON f.id = n.funnel_id
LEFT JOIN ai_sessions ai ON u.id = ai.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email, u.created_at;

-- 节点性能视图
CREATE OR REPLACE VIEW node_performance AS
SELECT 
    n.id as node_id,
    n.funnel_id,
    n.node_type,
    n.label,
    COUNT(nd.id) as data_points,
    AVG(nd.conversion_rate) as avg_conversion_rate,
    AVG(nd.entry_count) as avg_entry_count,
    AVG(nd.avg_time_spent) as avg_time_spent,
    SUM(nd.revenue) as total_revenue,
    SUM(nd.cost) as total_cost,
    MIN(nd.week_start_date) as first_data_date,
    MAX(nd.week_start_date) as latest_data_date
FROM nodes n
LEFT JOIN node_data nd ON n.id = nd.node_id
GROUP BY n.id, n.funnel_id, n.node_type, n.label;

-- ==========================================
-- 记录索引创建结果
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '数据库索引优化完成:';
    RAISE NOTICE '- 复合索引: 优化多条件查询';
    RAISE NOTICE '- 部分索引: 优化条件查询';
    RAISE NOTICE '- GIN 索引: 支持全文搜索和数组查询';
    RAISE NOTICE '- 覆盖索引: 减少回表查询';
    RAISE NOTICE '- 时间分区索引: 优化时间序列查询';
    RAISE NOTICE '- 外键索引: 确保连接查询性能';
    RAISE NOTICE '- 统计视图: 提供预聚合数据';
    RAISE NOTICE '';
    RAISE NOTICE '建议定期执行 VACUUM ANALYZE 以维护统计信息';
    RAISE NOTICE '监控慢查询日志以识别需要进一步优化的查询';
END $$;