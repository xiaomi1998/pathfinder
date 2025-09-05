-- Pathfinder 数据库初始化脚本
-- 版本: 1.0
-- 创建日期: 2025-08-22

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建数据库（如果不存在）
-- CREATE DATABASE pathfinder_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';

-- 切换到目标数据库
-- \c pathfinder_db;

-- ==============================================
-- 1. 创建用户表
-- ==============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- 数据约束
    CONSTRAINT users_username_length CHECK (length(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 创建用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);

-- ==============================================
-- 2. 创建漏斗表
-- ==============================================
CREATE TABLE funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    canvas_data JSONB, -- 存储画布配置信息（缩放、位置等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT funnels_name_length CHECK (length(trim(name)) >= 1)
);

-- 创建漏斗表索引
CREATE INDEX idx_funnels_user_id ON funnels(user_id);
CREATE INDEX idx_funnels_created_at ON funnels(created_at);
CREATE INDEX idx_funnels_name ON funnels USING gin(to_tsvector('english', name));
CREATE INDEX idx_funnels_canvas_data ON funnels USING gin(canvas_data);

-- ==============================================
-- 3. 创建节点表
-- ==============================================
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    node_type VARCHAR(20) NOT NULL, -- 'awareness', 'acquisition', 'activation', 'revenue', 'retention'
    label VARCHAR(30) NOT NULL DEFAULT '新节点',
    position_x DECIMAL(10,2) NOT NULL,
    position_y DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT nodes_type_valid CHECK (node_type IN ('awareness', 'acquisition', 'activation', 'revenue', 'retention')),
    CONSTRAINT nodes_label_length CHECK (length(trim(label)) >= 1 AND length(label) <= 30)
);

-- 创建节点表索引
CREATE INDEX idx_nodes_funnel_id ON nodes(funnel_id);
CREATE INDEX idx_nodes_type ON nodes(node_type);
CREATE INDEX idx_nodes_position ON nodes(position_x, position_y);

-- ==============================================
-- 4. 创建边（连接）表
-- ==============================================
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：防止自连接和重复连接
    CONSTRAINT edges_no_self_connect CHECK (source_node_id != target_node_id),
    CONSTRAINT edges_unique_connection UNIQUE (source_node_id, target_node_id)
);

-- 创建边表索引
CREATE INDEX idx_edges_funnel_id ON edges(funnel_id);
CREATE INDEX idx_edges_source_node ON edges(source_node_id);
CREATE INDEX idx_edges_target_node ON edges(target_node_id);
CREATE INDEX idx_edges_nodes_composite ON edges(source_node_id, target_node_id);

-- ==============================================
-- 5. 创建节点数据表
-- ==============================================
CREATE TABLE node_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    entry_count INTEGER NOT NULL DEFAULT 0,
    converted_count INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE 
            WHEN entry_count > 0 THEN ROUND(converted_count::DECIMAL / entry_count, 4)
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT node_data_counts_valid CHECK (entry_count >= 0 AND converted_count >= 0),
    CONSTRAINT node_data_conversion_logic CHECK (converted_count <= entry_count),
    CONSTRAINT node_data_unique_week UNIQUE (node_id, week_start_date)
);

-- 创建节点数据表索引
CREATE INDEX idx_node_data_node_id ON node_data(node_id);
CREATE INDEX idx_node_data_week ON node_data(week_start_date);
CREATE INDEX idx_node_data_created_at ON node_data(created_at);
CREATE INDEX idx_node_data_conversion_rate ON node_data(conversion_rate);

-- ==============================================
-- 6. 创建 AI 会话表
-- ==============================================
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
    session_context VARCHAR(50), -- 'invitation', 'objection_handling', 'general'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 约束
    CONSTRAINT ai_sessions_context_valid CHECK (
        session_context IS NULL OR 
        session_context IN ('invitation', 'objection_handling', 'general')
    )
);

-- 创建 AI 会话表索引
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_created_at ON ai_sessions(created_at);
CREATE INDEX idx_ai_sessions_funnel_id ON ai_sessions(funnel_id);
CREATE INDEX idx_ai_sessions_context ON ai_sessions(session_context);

-- ==============================================
-- 7. 创建 AI 消息表
-- ==============================================
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT ai_messages_role_valid CHECK (role IN ('user', 'assistant')),
    CONSTRAINT ai_messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- 创建 AI 消息表索引
CREATE INDEX idx_ai_messages_session_id ON ai_messages(session_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);
CREATE INDEX idx_ai_messages_role ON ai_messages(role);

-- ==============================================
-- 8. 创建审计日志表
-- ==============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT audit_log_operation_valid CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- 创建审计日志索引
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);

-- ==============================================
-- 9. 创建触发器和函数
-- ==============================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加 updated_at 触发器
CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER funnels_updated_at_trigger
    BEFORE UPDATE ON funnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER nodes_updated_at_trigger
    BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER node_data_updated_at_trigger
    BEFORE UPDATE ON node_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- 尝试获取当前用户 ID（从会话变量）
    BEGIN
        current_user_id := current_setting('app.current_user_id')::uuid;
    EXCEPTION
        WHEN OTHERS THEN
            current_user_id := NULL;
    END;
    
    INSERT INTO audit_log (table_name, operation, old_values, new_values, user_id)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        current_user_id
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- 为关键表添加审计触发器
CREATE TRIGGER funnels_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON funnels
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER nodes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON nodes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER node_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON node_data
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ==============================================
-- 10. 创建有用的视图
-- ==============================================

-- 漏斗统计视图
CREATE VIEW funnel_stats AS
SELECT 
    f.id as funnel_id,
    f.name as funnel_name,
    f.user_id,
    COUNT(DISTINCT n.id) as node_count,
    COUNT(DISTINCT e.id) as edge_count,
    COUNT(DISTINCT nd.id) as data_entries,
    MAX(nd.created_at) as latest_data_entry,
    f.created_at as funnel_created_at,
    f.updated_at as funnel_updated_at
FROM funnels f
LEFT JOIN nodes n ON f.id = n.funnel_id
LEFT JOIN edges e ON f.id = e.funnel_id
LEFT JOIN node_data nd ON n.id = nd.node_id
GROUP BY f.id, f.name, f.user_id, f.created_at, f.updated_at;

-- 节点转化率分析视图
CREATE VIEW node_conversion_analysis AS
SELECT 
    n.id as node_id,
    n.label as node_name,
    n.node_type,
    f.id as funnel_id,
    f.name as funnel_name,
    f.user_id,
    nd.week_start_date,
    nd.entry_count,
    nd.converted_count,
    nd.conversion_rate,
    CASE 
        WHEN nd.conversion_rate < 0.2 THEN 'critical'
        WHEN nd.conversion_rate < 0.5 THEN 'low'
        WHEN nd.conversion_rate < 0.8 THEN 'medium'
        ELSE 'high'
    END as performance_category
FROM nodes n
JOIN funnels f ON n.funnel_id = f.id
LEFT JOIN node_data nd ON n.id = nd.node_id
WHERE nd.id IS NOT NULL;

-- AI 会话统计视图
CREATE VIEW ai_session_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.ended_at IS NULL THEN s.id END) as active_sessions,
    COUNT(DISTINCT m.id) as total_messages,
    AVG(
        CASE WHEN s.ended_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (s.ended_at - s.created_at)) / 60
        END
    ) as avg_session_duration_minutes,
    MAX(s.created_at) as last_session_at
FROM users u
LEFT JOIN ai_sessions s ON u.id = s.user_id
LEFT JOIN ai_messages m ON s.id = m.session_id
GROUP BY u.id, u.username;

-- ==============================================
-- 11. 创建性能监控函数
-- ==============================================

-- 获取表大小统计
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    total_size_mb numeric,
    index_size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.n_live_tup as row_count,
        ROUND(pg_total_relation_size(c.oid) / 1024.0 / 1024.0, 2) as total_size_mb,
        ROUND(pg_indexes_size(c.oid) / 1024.0 / 1024.0, 2) as index_size_mb
    FROM pg_stat_user_tables t
    JOIN pg_class c ON c.relname = t.relname
    ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql;

-- 获取慢查询统计（需要 pg_stat_statements 扩展）
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
    query text,
    calls bigint,
    total_time_ms numeric,
    mean_time_ms numeric
) AS $$
BEGIN
    -- 检查 pg_stat_statements 扩展是否存在
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RETURN QUERY
        SELECT 
            s.query::text,
            s.calls,
            ROUND(s.total_exec_time, 2) as total_time_ms,
            ROUND(s.mean_exec_time, 2) as mean_time_ms
        FROM pg_stat_statements s
        WHERE s.mean_exec_time > 100 -- 超过100ms的查询
        ORDER BY s.mean_exec_time DESC
        LIMIT 20;
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not installed';
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 12. 插入初始数据
-- ==============================================

-- 插入示例用户（仅用于开发环境）
INSERT INTO users (username, email, password_hash, is_active) VALUES
('demo_user', 'demo@pathfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', true), -- 密码: demo123
('test_admin', 'admin@pathfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', true); -- 密码: demo123

-- ==============================================
-- 13. 创建数据库用户和权限
-- ==============================================

-- 创建应用程序用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_app') THEN
        CREATE USER pathfinder_app WITH PASSWORD 'secure_app_password_2025';
    END IF;
END
$$;

-- 授予应用程序用户必要的权限
GRANT CONNECT ON DATABASE CURRENT_DATABASE() TO pathfinder_app;
GRANT USAGE ON SCHEMA public TO pathfinder_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pathfinder_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pathfinder_app;

-- 创建只读用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_readonly') THEN
        CREATE USER pathfinder_readonly WITH PASSWORD 'secure_readonly_password_2025';
    END IF;
END
$$;

-- 授予只读用户权限
GRANT CONNECT ON DATABASE CURRENT_DATABASE() TO pathfinder_readonly;
GRANT USAGE ON SCHEMA public TO pathfinder_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pathfinder_readonly;

-- ==============================================
-- 14. 启用行级安全（可选，用于多租户）
-- ==============================================

-- 为多租户数据启用 RLS
-- ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE node_data ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略（示例）
-- CREATE POLICY funnels_user_policy ON funnels
--     FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- ==============================================
-- 完成消息
-- ==============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Pathfinder 数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建的表:';
    RAISE NOTICE '- users (用户表)';
    RAISE NOTICE '- funnels (漏斗表)';
    RAISE NOTICE '- nodes (节点表)';
    RAISE NOTICE '- edges (边表)';
    RAISE NOTICE '- node_data (节点数据表)';
    RAISE NOTICE '- ai_sessions (AI会话表)';
    RAISE NOTICE '- ai_messages (AI消息表)';
    RAISE NOTICE '- audit_log (审计日志表)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已创建的视图:';
    RAISE NOTICE '- funnel_stats (漏斗统计)';
    RAISE NOTICE '- node_conversion_analysis (转化率分析)';
    RAISE NOTICE '- ai_session_stats (AI会话统计)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '数据库用户:';
    RAISE NOTICE '- pathfinder_app (应用程序用户)';
    RAISE NOTICE '- pathfinder_readonly (只读用户)';
    RAISE NOTICE '========================================';
END
$$;