-- =============================================
-- Pathfinder 项目数据库初始化脚本
-- 版本: 2.0 Enhanced Edition
-- 创建日期: 2025-08-25
-- 说明: 基于 database-admin agent 创建的完整初始化脚本
-- =============================================

-- 启用必要的 PostgreSQL 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 设置时区
SET timezone = 'UTC';

-- =============================================
-- 1. 创建用户表 (Users)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    
    -- 数据约束
    CONSTRAINT users_username_length CHECK (length(username) >= 3),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 创建用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- =============================================
-- 2. 创建漏斗表 (Funnels)
-- =============================================
CREATE TABLE funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general', -- 漏斗分类
    status VARCHAR(20) DEFAULT 'active', -- active, archived, deleted
    canvas_data JSONB DEFAULT '{}', -- 存储画布配置信息（缩放、位置等）
    settings JSONB DEFAULT '{}', -- 漏斗设置（颜色主题、显示选项等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT funnels_name_length CHECK (length(trim(name)) >= 1),
    CONSTRAINT funnels_status_valid CHECK (status IN ('active', 'archived', 'deleted')),
    CONSTRAINT funnels_category_valid CHECK (category IN ('general', 'marketing', 'sales', 'product', 'support'))
);

-- 创建漏斗表索引
CREATE INDEX idx_funnels_user_id ON funnels(user_id);
CREATE INDEX idx_funnels_created_at ON funnels(created_at);
CREATE INDEX idx_funnels_name ON funnels USING gin(to_tsvector('english', name));
CREATE INDEX idx_funnels_canvas_data ON funnels USING gin(canvas_data);
CREATE INDEX idx_funnels_status ON funnels(status) WHERE status = 'active';
CREATE INDEX idx_funnels_category ON funnels(category);

-- =============================================
-- 3. 创建节点表 (Nodes)
-- =============================================
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    node_type VARCHAR(20) NOT NULL, -- 'awareness', 'acquisition', 'activation', 'revenue', 'retention'
    label VARCHAR(30) NOT NULL DEFAULT '新节点',
    description TEXT,
    position_x DECIMAL(10,2) NOT NULL,
    position_y DECIMAL(10,2) NOT NULL,
    width DECIMAL(10,2) DEFAULT 120.00,
    height DECIMAL(10,2) DEFAULT 60.00,
    color VARCHAR(7) DEFAULT '#3B82F6', -- 节点颜色 (hex)
    icon VARCHAR(50), -- 节点图标标识
    metadata JSONB DEFAULT '{}', -- 节点元数据
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT nodes_type_valid CHECK (node_type IN ('awareness', 'acquisition', 'activation', 'revenue', 'retention')),
    CONSTRAINT nodes_label_length CHECK (length(trim(label)) >= 1 AND length(label) <= 30),
    CONSTRAINT nodes_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- 创建节点表索引
CREATE INDEX idx_nodes_funnel_id ON nodes(funnel_id);
CREATE INDEX idx_nodes_type ON nodes(node_type);
CREATE INDEX idx_nodes_position ON nodes(position_x, position_y);
CREATE INDEX idx_nodes_label ON nodes USING gin(to_tsvector('english', label));

-- =============================================
-- 4. 创建边（连接）表 (Edges)
-- =============================================
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    label VARCHAR(50), -- 连接标签
    style VARCHAR(20) DEFAULT 'solid', -- solid, dashed, dotted
    color VARCHAR(7) DEFAULT '#6B7280',
    animated BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束：防止自连接和重复连接
    CONSTRAINT edges_no_self_connect CHECK (source_node_id != target_node_id),
    CONSTRAINT edges_unique_connection UNIQUE (source_node_id, target_node_id),
    CONSTRAINT edges_style_valid CHECK (style IN ('solid', 'dashed', 'dotted')),
    CONSTRAINT edges_color_format CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- 创建边表索引
CREATE INDEX idx_edges_funnel_id ON edges(funnel_id);
CREATE INDEX idx_edges_source_node ON edges(source_node_id);
CREATE INDEX idx_edges_target_node ON edges(target_node_id);
CREATE INDEX idx_edges_nodes_composite ON edges(source_node_id, target_node_id);

-- =============================================
-- 5. 创建节点数据表 (Node Data)
-- =============================================
CREATE TABLE node_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    date_period DATE NOT NULL, -- 数据周期开始日期
    period_type VARCHAR(10) DEFAULT 'weekly', -- daily, weekly, monthly
    entry_count INTEGER NOT NULL DEFAULT 0,
    converted_count INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE 
            WHEN entry_count > 0 THEN ROUND(converted_count::DECIMAL / entry_count, 4)
            ELSE 0
        END
    ) STORED,
    revenue DECIMAL(12,2) DEFAULT 0.00, -- 收入数据
    cost DECIMAL(12,2) DEFAULT 0.00, -- 成本数据
    roi DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE 
            WHEN cost > 0 THEN ROUND((revenue - cost) / cost, 4)
            ELSE 0
        END
    ) STORED, -- 投资回报率
    source VARCHAR(50), -- 数据来源
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT node_data_counts_valid CHECK (entry_count >= 0 AND converted_count >= 0),
    CONSTRAINT node_data_conversion_logic CHECK (converted_count <= entry_count),
    CONSTRAINT node_data_period_valid CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    CONSTRAINT node_data_financial_valid CHECK (revenue >= 0 AND cost >= 0),
    CONSTRAINT node_data_unique_period UNIQUE (node_id, date_period, period_type)
);

-- 创建节点数据表索引
CREATE INDEX idx_node_data_node_id ON node_data(node_id);
CREATE INDEX idx_node_data_period ON node_data(date_period);
CREATE INDEX idx_node_data_period_type ON node_data(period_type);
CREATE INDEX idx_node_data_created_at ON node_data(created_at);
CREATE INDEX idx_node_data_conversion_rate ON node_data(conversion_rate);
CREATE INDEX idx_node_data_roi ON node_data(roi);

-- =============================================
-- 6. 创建 AI 会话表 (AI Sessions)
-- =============================================
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
    session_title VARCHAR(100),
    session_context VARCHAR(50), -- 'invitation', 'objection_handling', 'general', 'analysis'
    model_used VARCHAR(50) DEFAULT 'gpt-4', -- AI 模型标识
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(8,4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- 约束
    CONSTRAINT ai_sessions_context_valid CHECK (
        session_context IS NULL OR 
        session_context IN ('invitation', 'objection_handling', 'general', 'analysis', 'optimization')
    ),
    CONSTRAINT ai_sessions_tokens_valid CHECK (total_tokens >= 0),
    CONSTRAINT ai_sessions_cost_valid CHECK (total_cost >= 0)
);

-- 创建 AI 会话表索引
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_created_at ON ai_sessions(created_at);
CREATE INDEX idx_ai_sessions_funnel_id ON ai_sessions(funnel_id);
CREATE INDEX idx_ai_sessions_context ON ai_sessions(session_context);
CREATE INDEX idx_ai_sessions_ended ON ai_sessions(ended_at) WHERE ended_at IS NULL;

-- =============================================
-- 7. 创建 AI 消息表 (AI Messages)
-- =============================================
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- 消息元数据（如工具调用信息等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT ai_messages_role_valid CHECK (role IN ('user', 'assistant', 'system')),
    CONSTRAINT ai_messages_content_not_empty CHECK (length(trim(content)) > 0),
    CONSTRAINT ai_messages_tokens_valid CHECK (tokens_used >= 0)
);

-- 创建 AI 消息表索引
CREATE INDEX idx_ai_messages_session_id ON ai_messages(session_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at);
CREATE INDEX idx_ai_messages_role ON ai_messages(role);

-- =============================================
-- 8. 创建模板表 (Templates)
-- =============================================
CREATE TABLE funnel_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT false,
    template_data JSONB NOT NULL, -- 模板的节点、边和配置数据
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT templates_rating_valid CHECK (rating >= 0.00 AND rating <= 5.00),
    CONSTRAINT templates_usage_valid CHECK (usage_count >= 0)
);

-- 创建模板表索引
CREATE INDEX idx_templates_category ON funnel_templates(category);
CREATE INDEX idx_templates_public ON funnel_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_rating ON funnel_templates(rating);
CREATE INDEX idx_templates_usage ON funnel_templates(usage_count);

-- =============================================
-- 9. 创建用户偏好表 (User Preferences)
-- =============================================
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    dashboard_layout JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    ai_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT prefs_theme_valid CHECK (theme IN ('light', 'dark', 'auto')),
    
    -- 每个用户只能有一个偏好记录
    CONSTRAINT prefs_unique_user UNIQUE (user_id)
);

-- 创建用户偏好表索引
CREATE INDEX idx_prefs_user_id ON user_preferences(user_id);

-- =============================================
-- 10. 创建审计日志表 (Audit Log)
-- =============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    operation VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    user_ip INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT audit_log_operation_valid CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- 创建审计日志索引
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);

-- =============================================
-- 11. 创建触发器和函数
-- =============================================

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

CREATE TRIGGER templates_updated_at_trigger
    BEFORE UPDATE ON funnel_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER prefs_updated_at_trigger
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    record_id_value UUID;
BEGIN
    -- 尝试获取当前用户 ID（从会话变量）
    BEGIN
        current_user_id := current_setting('app.current_user_id')::uuid;
    EXCEPTION
        WHEN OTHERS THEN
            current_user_id := NULL;
    END;
    
    -- 尝试获取记录 ID
    BEGIN
        record_id_value := (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)::uuid;
    EXCEPTION
        WHEN OTHERS THEN
            record_id_value := NULL;
    END;
    
    INSERT INTO audit_log (
        table_name, 
        record_id, 
        operation, 
        old_values, 
        new_values, 
        user_id,
        user_ip,
        user_agent
    )
    VALUES (
        TG_TABLE_NAME,
        record_id_value,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
        current_user_id,
        inet_client_addr(),
        current_setting('app.user_agent', true)
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- 为关键表添加审计触发器
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER funnels_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON funnels
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER nodes_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON nodes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER node_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON node_data
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- 12. 创建有用的视图
-- =============================================

-- 漏斗统计视图
CREATE VIEW funnel_stats AS
SELECT 
    f.id as funnel_id,
    f.name as funnel_name,
    f.user_id,
    f.category,
    f.status,
    u.username as owner_username,
    COUNT(DISTINCT n.id) as node_count,
    COUNT(DISTINCT e.id) as edge_count,
    COUNT(DISTINCT nd.id) as data_entries,
    MAX(nd.created_at) as latest_data_entry,
    AVG(nd.conversion_rate) as avg_conversion_rate,
    SUM(nd.revenue) as total_revenue,
    SUM(nd.cost) as total_cost,
    CASE 
        WHEN SUM(nd.cost) > 0 THEN ROUND((SUM(nd.revenue) - SUM(nd.cost)) / SUM(nd.cost), 4)
        ELSE 0
    END as overall_roi,
    f.created_at as funnel_created_at,
    f.updated_at as funnel_updated_at
FROM funnels f
JOIN users u ON f.user_id = u.id
LEFT JOIN nodes n ON f.id = n.funnel_id
LEFT JOIN edges e ON f.id = e.funnel_id
LEFT JOIN node_data nd ON n.id = nd.node_id
WHERE f.status = 'active'
GROUP BY f.id, f.name, f.user_id, f.category, f.status, u.username, f.created_at, f.updated_at;

-- 节点性能分析视图
CREATE VIEW node_performance_analysis AS
SELECT 
    n.id as node_id,
    n.label as node_name,
    n.node_type,
    f.id as funnel_id,
    f.name as funnel_name,
    f.user_id,
    nd.date_period,
    nd.period_type,
    nd.entry_count,
    nd.converted_count,
    nd.conversion_rate,
    nd.revenue,
    nd.cost,
    nd.roi,
    CASE 
        WHEN nd.conversion_rate < 0.1 THEN 'critical'
        WHEN nd.conversion_rate < 0.3 THEN 'low'
        WHEN nd.conversion_rate < 0.6 THEN 'medium'
        WHEN nd.conversion_rate < 0.8 THEN 'good'
        ELSE 'excellent'
    END as performance_grade,
    LAG(nd.conversion_rate) OVER (
        PARTITION BY n.id 
        ORDER BY nd.date_period
    ) as prev_conversion_rate,
    nd.conversion_rate - LAG(nd.conversion_rate) OVER (
        PARTITION BY n.id 
        ORDER BY nd.date_period
    ) as conversion_rate_change
FROM nodes n
JOIN funnels f ON n.funnel_id = f.id
LEFT JOIN node_data nd ON n.id = nd.node_id
WHERE nd.id IS NOT NULL AND f.status = 'active';

-- AI 使用统计视图
CREATE VIEW ai_usage_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN s.ended_at IS NULL THEN s.id END) as active_sessions,
    COUNT(DISTINCT m.id) as total_messages,
    SUM(s.total_tokens) as total_tokens_used,
    SUM(s.total_cost) as total_cost,
    AVG(
        CASE WHEN s.ended_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (s.ended_at - s.created_at)) / 60
        END
    ) as avg_session_duration_minutes,
    MAX(s.created_at) as last_session_at,
    COUNT(DISTINCT s.session_context) as unique_contexts_used
FROM users u
LEFT JOIN ai_sessions s ON u.id = s.user_id
LEFT JOIN ai_messages m ON s.id = m.session_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email;

-- 用户活跃度视图
CREATE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.created_at as user_since,
    u.last_login_at,
    COUNT(DISTINCT f.id) as funnel_count,
    COUNT(DISTINCT CASE WHEN f.status = 'active' THEN f.id END) as active_funnels,
    COUNT(DISTINCT n.id) as total_nodes,
    COUNT(DISTINCT nd.id) as data_entries,
    MAX(nd.created_at) as last_data_entry,
    COUNT(DISTINCT s.id) as ai_sessions,
    CASE 
        WHEN u.last_login_at IS NULL THEN 'never_logged_in'
        WHEN u.last_login_at > CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'very_active'
        WHEN u.last_login_at > CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'active'
        WHEN u.last_login_at > CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'moderate'
        ELSE 'inactive'
    END as activity_level
FROM users u
LEFT JOIN funnels f ON u.id = f.user_id
LEFT JOIN nodes n ON f.id = n.funnel_id
LEFT JOIN node_data nd ON n.id = nd.node_id
LEFT JOIN ai_sessions s ON u.id = s.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email, u.created_at, u.last_login_at;

-- =============================================
-- 13. 创建性能监控函数
-- =============================================

-- 获取表大小统计
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    total_size_mb numeric,
    index_size_mb numeric,
    table_size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.n_live_tup as row_count,
        ROUND(pg_total_relation_size(c.oid) / 1024.0 / 1024.0, 2) as total_size_mb,
        ROUND(pg_indexes_size(c.oid) / 1024.0 / 1024.0, 2) as index_size_mb,
        ROUND(pg_relation_size(c.oid) / 1024.0 / 1024.0, 2) as table_size_mb
    FROM pg_stat_user_tables t
    JOIN pg_class c ON c.relname = t.relname
    ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql;

-- 获取数据库性能统计
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    active_connections integer,
    total_size_mb numeric,
    cache_hit_ratio numeric,
    transactions_per_second numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::integer,
        ROUND(pg_database_size(current_database()) / 1024.0 / 1024.0, 2),
        ROUND(
            (sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100)::numeric, 2
        ) FROM pg_stat_database WHERE datname = current_database(),
        ROUND(
            (sum(xact_commit) + sum(xact_rollback))::numeric / 
            GREATEST(EXTRACT(EPOCH FROM (now() - stats_reset)), 1), 2
        ) FROM pg_stat_database WHERE datname = current_database();
END;
$$ LANGUAGE plpgsql;

-- 清理旧数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS TEXT AS $$
DECLARE
    deleted_count INTEGER;
    result_text TEXT := '';
BEGIN
    -- 清理旧的审计日志
    DELETE FROM audit_log WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' audit log entries. ';
    
    -- 清理已结束的 AI 会话（保留更长时间）
    DELETE FROM ai_sessions 
    WHERE ended_at IS NOT NULL 
    AND ended_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * (days_to_keep * 2);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Deleted ' || deleted_count || ' old AI sessions. ';
    
    -- 清理已删除的漏斗（软删除后的物理删除）
    DELETE FROM funnels 
    WHERE status = 'deleted' 
    AND updated_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * 30;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Permanently deleted ' || deleted_count || ' funnels.';
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 14. 插入示例数据 (开发环境使用)
-- =============================================

-- 插入示例用户
INSERT INTO users (username, email, password_hash, full_name, is_active, email_verified) VALUES
('demo_user', 'demo@pathfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', 'Demo User', true, true), -- 密码: demo123
('test_admin', 'admin@pathfinder.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', 'Test Admin', true, true), -- 密码: demo123
('alice_marketer', 'alice@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', 'Alice Johnson', true, true),
('bob_analyst', 'bob@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj9SJnNODLWu', 'Bob Smith', true, true);

-- 插入用户偏好
INSERT INTO user_preferences (user_id, theme, language, timezone, notification_settings, ai_settings) 
SELECT 
    id, 
    'light', 
    'en', 
    'UTC',
    '{"email": true, "browser": true, "ai_suggestions": true}',
    '{"model_preference": "gpt-4", "auto_suggestions": true}'
FROM users;

-- 插入示例漏斗模板
INSERT INTO funnel_templates (name, description, category, template_data, is_public, rating) VALUES
('电商购买漏斗', '标准的电商用户购买转化漏斗模板', 'marketing', 
'{"nodes": [
  {"type": "awareness", "label": "首页访问", "position": {"x": 100, "y": 100}},
  {"type": "acquisition", "label": "产品浏览", "position": {"x": 300, "y": 100}},
  {"type": "activation", "label": "加入购物车", "position": {"x": 500, "y": 100}},
  {"type": "revenue", "label": "完成购买", "position": {"x": 700, "y": 100}}
], "edges": [
  {"source": 0, "target": 1},
  {"source": 1, "target": 2},
  {"source": 2, "target": 3}
]}', true, 4.5),

('SaaS 注册漏斗', 'SaaS 产品用户注册和激活流程', 'product',
'{"nodes": [
  {"type": "awareness", "label": "落地页访问", "position": {"x": 100, "y": 100}},
  {"type": "acquisition", "label": "注册账号", "position": {"x": 300, "y": 100}},
  {"type": "activation", "label": "完成设置", "position": {"x": 500, "y": 100}},
  {"type": "retention", "label": "持续使用", "position": {"x": 700, "y": 100}}
], "edges": [
  {"source": 0, "target": 1},
  {"source": 1, "target": 2},
  {"source": 2, "target": 3}
]}', true, 4.2);

-- 插入示例漏斗数据
DO $$
DECLARE
    demo_user_id UUID;
    alice_user_id UUID;
    funnel_1_id UUID;
    funnel_2_id UUID;
    node_ids UUID[];
BEGIN
    -- 获取用户 ID
    SELECT id INTO demo_user_id FROM users WHERE username = 'demo_user';
    SELECT id INTO alice_user_id FROM users WHERE username = 'alice_marketer';
    
    -- 创建示例漏斗 1
    INSERT INTO funnels (user_id, name, description, category, canvas_data, settings) 
    VALUES (demo_user_id, '电商转化漏斗', '我的在线商店用户购买流程分析', 'marketing',
    '{"viewport": {"x": 0, "y": 0, "zoom": 1}, "theme": "light"}',
    '{"auto_refresh": true, "show_labels": true, "color_scheme": "default"}') 
    RETURNING id INTO funnel_1_id;
    
    -- 创建漏斗 1 的节点
    INSERT INTO nodes (funnel_id, node_type, label, description, position_x, position_y, color, icon) VALUES
    (funnel_1_id, 'awareness', '首页访问', '用户首次访问网站首页', 100.00, 200.00, '#8B5CF6', 'home'),
    (funnel_1_id, 'acquisition', '产品浏览', '用户浏览产品详情页', 300.00, 200.00, '#3B82F6', 'eye'),
    (funnel_1_id, 'activation', '加入购物车', '用户将产品加入购物车', 500.00, 200.00, '#F59E0B', 'cart'),
    (funnel_1_id, 'revenue', '完成支付', '用户完成购买流程', 700.00, 200.00, '#10B981', 'credit-card'),
    (funnel_1_id, 'retention', '重复购买', '用户再次购买产品', 900.00, 200.00, '#EF4444', 'repeat');
    
    -- 获取节点 ID 数组
    SELECT array_agg(id ORDER BY position_x) INTO node_ids 
    FROM nodes WHERE funnel_id = funnel_1_id;
    
    -- 创建节点连接
    INSERT INTO edges (funnel_id, source_node_id, target_node_id, label, style) VALUES
    (funnel_1_id, node_ids[1], node_ids[2], '浏览转化', 'solid'),
    (funnel_1_id, node_ids[2], node_ids[3], '购买意向', 'solid'),
    (funnel_1_id, node_ids[3], node_ids[4], '支付转化', 'solid'),
    (funnel_1_id, node_ids[4], node_ids[5], '客户留存', 'dashed');
    
    -- 插入节点数据（最近4周的数据）
    INSERT INTO node_data (node_id, date_period, period_type, entry_count, converted_count, revenue, cost, source) VALUES
    -- 首页访问数据
    (node_ids[1], CURRENT_DATE - INTERVAL '21 days', 'weekly', 5000, 3500, 0, 1200, 'google_analytics'),
    (node_ids[1], CURRENT_DATE - INTERVAL '14 days', 'weekly', 5200, 3640, 0, 1250, 'google_analytics'),
    (node_ids[1], CURRENT_DATE - INTERVAL '7 days', 'weekly', 4800, 3360, 0, 1150, 'google_analytics'),
    (node_ids[1], CURRENT_DATE, 'weekly', 5100, 3570, 0, 1220, 'google_analytics'),
    
    -- 产品浏览数据
    (node_ids[2], CURRENT_DATE - INTERVAL '21 days', 'weekly', 3500, 1750, 0, 800, 'google_analytics'),
    (node_ids[2], CURRENT_DATE - INTERVAL '14 days', 'weekly', 3640, 1820, 0, 820, 'google_analytics'),
    (node_ids[2], CURRENT_DATE - INTERVAL '7 days', 'weekly', 3360, 1680, 0, 750, 'google_analytics'),
    (node_ids[2], CURRENT_DATE, 'weekly', 3570, 1785, 0, 800, 'google_analytics'),
    
    -- 购物车数据
    (node_ids[3], CURRENT_DATE - INTERVAL '21 days', 'weekly', 1750, 525, 0, 400, 'shopify'),
    (node_ids[3], CURRENT_DATE - INTERVAL '14 days', 'weekly', 1820, 546, 0, 420, 'shopify'),
    (node_ids[3], CURRENT_DATE - INTERVAL '7 days', 'weekly', 1680, 504, 0, 380, 'shopify'),
    (node_ids[3], CURRENT_DATE, 'weekly', 1785, 536, 0, 400, 'shopify'),
    
    -- 支付完成数据
    (node_ids[4], CURRENT_DATE - INTERVAL '21 days', 'weekly', 525, 420, 25200, 400, 'stripe'),
    (node_ids[4], CURRENT_DATE - INTERVAL '14 days', 'weekly', 546, 437, 26220, 420, 'stripe'),
    (node_ids[4], CURRENT_DATE - INTERVAL '7 days', 'weekly', 504, 403, 24180, 380, 'stripe'),
    (node_ids[4], CURRENT_DATE, 'weekly', 536, 429, 25740, 400, 'stripe'),
    
    -- 重复购买数据
    (node_ids[5], CURRENT_DATE - INTERVAL '21 days', 'weekly', 420, 84, 8400, 200, 'crm'),
    (node_ids[5], CURRENT_DATE - INTERVAL '14 days', 'weekly', 437, 87, 8700, 210, 'crm'),
    (node_ids[5], CURRENT_DATE - INTERVAL '7 days', 'weekly', 403, 81, 8100, 190, 'crm'),
    (node_ids[5], CURRENT_DATE, 'weekly', 429, 86, 8600, 200, 'crm');
    
    -- 创建第二个示例漏斗
    INSERT INTO funnels (user_id, name, description, category, canvas_data) 
    VALUES (alice_user_id, 'SaaS 用户激活', '新用户注册到激活的完整流程', 'product',
    '{"viewport": {"x": 0, "y": 0, "zoom": 1.2}, "theme": "light"}') 
    RETURNING id INTO funnel_2_id;
    
    -- 清空节点 ID 数组
    node_ids := '{}';
    
    -- 创建漏斗 2 的节点
    INSERT INTO nodes (funnel_id, node_type, label, description, position_x, position_y, color) VALUES
    (funnel_2_id, 'awareness', '落地页访问', '用户访问产品落地页', 150.00, 150.00, '#8B5CF6'),
    (funnel_2_id, 'acquisition', '注册账号', '用户完成账号注册', 350.00, 150.00, '#3B82F6'),
    (funnel_2_id, 'activation', '完成引导', '用户完成产品使用引导', 550.00, 150.00, '#F59E0B'),
    (funnel_2_id, 'retention', '持续使用', '用户在7天内持续使用产品', 750.00, 150.00, '#10B981');
    
    -- 获取漏斗 2 的节点 ID
    SELECT array_agg(id ORDER BY position_x) INTO node_ids 
    FROM nodes WHERE funnel_id = funnel_2_id;
    
    -- 创建连接
    INSERT INTO edges (funnel_id, source_node_id, target_node_id, style) VALUES
    (funnel_2_id, node_ids[1], node_ids[2], 'solid'),
    (funnel_2_id, node_ids[2], node_ids[3], 'solid'),
    (funnel_2_id, node_ids[3], node_ids[4], 'solid');
    
    -- 插入漏斗 2 的数据
    INSERT INTO node_data (node_id, date_period, period_type, entry_count, converted_count, source) VALUES
    -- 落地页访问
    (node_ids[1], CURRENT_DATE - INTERVAL '7 days', 'weekly', 2000, 1400, 'mixpanel'),
    (node_ids[1], CURRENT_DATE, 'weekly', 2200, 1540, 'mixpanel'),
    
    -- 注册账号
    (node_ids[2], CURRENT_DATE - INTERVAL '7 days', 'weekly', 1400, 980, 'auth0'),
    (node_ids[2], CURRENT_DATE, 'weekly', 1540, 1078, 'auth0'),
    
    -- 完成引导
    (node_ids[3], CURRENT_DATE - INTERVAL '7 days', 'weekly', 980, 686, 'amplitude'),
    (node_ids[3], CURRENT_DATE, 'weekly', 1078, 755, 'amplitude'),
    
    -- 持续使用
    (node_ids[4], CURRENT_DATE - INTERVAL '7 days', 'weekly', 686, 480, 'amplitude'),
    (node_ids[4], CURRENT_DATE, 'weekly', 755, 529, 'amplitude');
    
END $$;

-- 插入示例 AI 会话
DO $$
DECLARE
    demo_user_id UUID;
    funnel_id UUID;
    session_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE username = 'demo_user';
    SELECT id INTO funnel_id FROM funnels WHERE user_id = demo_user_id LIMIT 1;
    
    -- 创建 AI 会话
    INSERT INTO ai_sessions (user_id, funnel_id, session_title, session_context, model_used, total_tokens, total_cost)
    VALUES (demo_user_id, funnel_id, '漏斗优化咨询', 'optimization', 'gpt-4', 1250, 0.0375)
    RETURNING id INTO session_id;
    
    -- 插入会话消息
    INSERT INTO ai_messages (session_id, role, content, tokens_used) VALUES
    (session_id, 'user', '我的电商漏斗购物车到支付的转化率只有30%，有什么优化建议吗？', 32),
    (session_id, 'assistant', '根据您的数据分析，购物车到支付的30%转化率确实有提升空间。我建议从以下几个方面优化：

1. **简化结账流程**：减少结账步骤，提供一键支付选项
2. **解决弃购问题**：通过邮件提醒、限时折扣来挽回流失用户
3. **增加支付选项**：提供多种支付方式，如支付宝、微信支付等
4. **显示安全证书**：在支付页面显示SSL证书和安全标识增加信任
5. **优化移动端体验**：确保移动端支付流程流畅

建议先从简化结账流程开始，这通常能带来5-10%的转化率提升。', 186),
    (session_id, 'user', '好的，那具体应该如何简化结账流程？', 18),
    (session_id, 'assistant', '具体的结账流程简化建议：

**技术层面：**
- 将多步骤结账合并为单页面
- 实现地址自动填充和记忆功能
- 支持游客结账，减少强制注册

**用户体验层面：**
- 提供进度指示器让用户知道还需几步
- 优化表单设计，使用智能验证
- 在每个步骤明确显示费用明细

**支付优化：**
- 集成一键支付（如Apple Pay、Google Pay）
- 提供保存支付方式选项
- 在支付按钮附近显示安全保障信息

建议通过A/B测试逐步实施这些改进，监控每个改动对转化率的影响。', 198);
    
    -- 结束会话
    UPDATE ai_sessions SET ended_at = CURRENT_TIMESTAMP, total_tokens = 434, total_cost = 0.0434 
    WHERE id = session_id;
END $$;

-- =============================================
-- 15. 创建数据库用户和权限
-- =============================================

-- 创建应用程序用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_app') THEN
        CREATE USER pathfinder_app WITH PASSWORD 'secure_app_password_2025!@#';
    END IF;
END
$$;

-- 授予应用程序用户必要的权限
GRANT CONNECT ON DATABASE postgres TO pathfinder_app;
GRANT USAGE ON SCHEMA public TO pathfinder_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pathfinder_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pathfinder_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO pathfinder_app;

-- 创建只读用户（用于报表和分析）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_readonly') THEN
        CREATE USER pathfinder_readonly WITH PASSWORD 'secure_readonly_password_2025!@#';
    END IF;
END
$$;

-- 授予只读用户权限
GRANT CONNECT ON DATABASE postgres TO pathfinder_readonly;
GRANT USAGE ON SCHEMA public TO pathfinder_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pathfinder_readonly;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pathfinder_readonly;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO pathfinder_readonly;
GRANT EXECUTE ON FUNCTION get_database_stats() TO pathfinder_readonly;

-- 创建数据分析师用户
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'pathfinder_analyst') THEN
        CREATE USER pathfinder_analyst WITH PASSWORD 'analyst_password_2025!@#';
    END IF;
END
$$;

-- 授予分析师用户权限（只读 + 视图访问）
GRANT CONNECT ON DATABASE postgres TO pathfinder_analyst;
GRANT USAGE ON SCHEMA public TO pathfinder_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pathfinder_analyst;
GRANT SELECT ON funnel_stats, node_performance_analysis, ai_usage_stats, user_activity_summary TO pathfinder_analyst;

-- =============================================
-- 16. 创建定期维护任务
-- =============================================

-- 创建维护任务调度函数（需要pg_cron扩展）
CREATE OR REPLACE FUNCTION schedule_maintenance_tasks()
RETURNS TEXT AS $$
BEGIN
    -- 注意：这需要安装和配置 pg_cron 扩展
    -- 每天凌晨2点清理旧数据
    -- SELECT cron.schedule('pathfinder-cleanup', '0 2 * * *', 'SELECT cleanup_old_data(90);');
    
    -- 每周日凌晨3点更新统计信息
    -- SELECT cron.schedule('pathfinder-analyze', '0 3 * * 0', 'ANALYZE;');
    
    -- 每月1号凌晨4点执行VACUUM
    -- SELECT cron.schedule('pathfinder-vacuum', '0 4 1 * *', 'VACUUM ANALYZE;');
    
    RETURN 'Maintenance tasks would be scheduled here (requires pg_cron extension)';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 17. 创建数据完整性检查函数
-- =============================================

CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(
    check_name text,
    status text,
    details text
) AS $$
BEGIN
    -- 检查用户数据完整性
    RETURN QUERY
    SELECT 
        'User Data Integrity'::text,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*) || ' users with invalid email formats'::text
    FROM users 
    WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    -- 检查漏斗数据完整性
    RETURN QUERY
    SELECT 
        'Funnel Data Integrity'::text,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*) || ' funnels without any nodes'::text
    FROM funnels f
    LEFT JOIN nodes n ON f.id = n.funnel_id
    WHERE n.id IS NULL AND f.status = 'active';
    
    -- 检查节点数据完整性
    RETURN QUERY
    SELECT 
        'Node Data Integrity'::text,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*) || ' node data entries with invalid conversion logic'::text
    FROM node_data
    WHERE converted_count > entry_count;
    
    -- 检查边数据完整性
    RETURN QUERY
    SELECT 
        'Edge Data Integrity'::text,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*) || ' edges with mismatched funnel references'::text
    FROM edges e
    JOIN nodes sn ON e.source_node_id = sn.id
    JOIN nodes tn ON e.target_node_id = tn.id
    WHERE sn.funnel_id != e.funnel_id OR tn.funnel_id != e.funnel_id;
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 18. 完成初始化
-- =============================================

-- 更新表统计信息
ANALYZE;

-- 显示完成信息
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  Pathfinder 数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的表:';
    RAISE NOTICE '✓ users - 用户账户表';
    RAISE NOTICE '✓ funnels - 漏斗模型表';
    RAISE NOTICE '✓ nodes - 节点数据表';
    RAISE NOTICE '✓ edges - 连接关系表';
    RAISE NOTICE '✓ node_data - 节点数据记录表';
    RAISE NOTICE '✓ ai_sessions - AI会话表';
    RAISE NOTICE '✓ ai_messages - AI消息表';
    RAISE NOTICE '✓ funnel_templates - 漏斗模板表';
    RAISE NOTICE '✓ user_preferences - 用户偏好表';
    RAISE NOTICE '✓ audit_log - 审计日志表';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的视图:';
    RAISE NOTICE '✓ funnel_stats - 漏斗统计视图';
    RAISE NOTICE '✓ node_performance_analysis - 节点性能分析视图';
    RAISE NOTICE '✓ ai_usage_stats - AI使用统计视图';
    RAISE NOTICE '✓ user_activity_summary - 用户活跃度视图';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的函数:';
    RAISE NOTICE '✓ get_table_sizes() - 获取表大小统计';
    RAISE NOTICE '✓ get_database_stats() - 获取数据库统计';
    RAISE NOTICE '✓ cleanup_old_data() - 清理旧数据';
    RAISE NOTICE '✓ check_data_integrity() - 数据完整性检查';
    RAISE NOTICE '';
    RAISE NOTICE '数据库用户:';
    RAISE NOTICE '✓ pathfinder_app - 应用程序用户 (读写权限)';
    RAISE NOTICE '✓ pathfinder_readonly - 只读用户';
    RAISE NOTICE '✓ pathfinder_analyst - 数据分析师用户';
    RAISE NOTICE '';
    RAISE NOTICE '示例数据:';
    RAISE NOTICE '✓ 4个测试用户账户';
    RAISE NOTICE '✓ 2个示例漏斗模板';
    RAISE NOTICE '✓ 2个完整的漏斗数据（含节点和转化数据）';
    RAISE NOTICE '✓ 1个AI对话会话示例';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  数据库已准备就绪，可以开始开发！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- 显示一些基础统计
    RAISE NOTICE '当前数据统计:';
    RAISE NOTICE '- 用户数量: %', (SELECT count(*) FROM users);
    RAISE NOTICE '- 漏斗数量: %', (SELECT count(*) FROM funnels);
    RAISE NOTICE '- 节点数量: %', (SELECT count(*) FROM nodes);
    RAISE NOTICE '- 数据记录: %', (SELECT count(*) FROM node_data);
    RAISE NOTICE '';
END
$$;