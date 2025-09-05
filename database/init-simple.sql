-- Pathfinder 数据库初始化脚本（简化版）
-- 适用于开发环境快速启动

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 用户账户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 漏斗表
CREATE TABLE funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    canvas_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 节点表
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    node_type VARCHAR(50) DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 连接表
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(funnel_id, source_node_id, target_node_id)
);

-- 节点数据表
CREATE TABLE node_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID REFERENCES funnels(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    data_week DATE NOT NULL,
    entry_count INTEGER DEFAULT 0 CHECK (entry_count >= 0),
    conversion_count INTEGER DEFAULT 0 CHECK (conversion_count >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_conversion CHECK (conversion_count <= entry_count)
);

-- AI 会话表
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    funnel_id UUID REFERENCES funnels(id) ON DELETE SET NULL,
    session_context VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- AI 消息表
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 基础索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_funnels_user ON funnels(user_id);
CREATE INDEX idx_nodes_funnel ON nodes(funnel_id);
CREATE INDEX idx_nodes_funnel_node ON nodes(funnel_id, node_id);
CREATE INDEX idx_edges_funnel ON edges(funnel_id);
CREATE INDEX idx_node_data_funnel ON node_data(funnel_id);
CREATE INDEX idx_node_data_week ON node_data(data_week);
CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id);
CREATE INDEX idx_ai_messages_session ON ai_messages(session_id);

-- 自动更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_node_data_updated_at BEFORE UPDATE ON node_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入测试数据
INSERT INTO users (email, password_hash, full_name) VALUES 
('demo@pathfinder.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthMEj0nrZSg.4S', 'Demo User');

-- 获取测试用户ID
DO $$
DECLARE
    demo_user_id UUID;
    demo_funnel_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@pathfinder.com';
    
    -- 插入示例漏斗
    INSERT INTO funnels (user_id, name, description) VALUES 
    (demo_user_id, '产品销售漏斗', '展示从潜在客户到成交的完整流程')
    RETURNING id INTO demo_funnel_id;
    
    -- 插入示例节点
    INSERT INTO nodes (funnel_id, node_id, label, position_x, position_y, node_type) VALUES 
    (demo_funnel_id, 'start', '潜在客户', 100, 100, 'start'),
    (demo_funnel_id, 'contact', '初次联系', 300, 100, 'process'),
    (demo_funnel_id, 'demo', '产品演示', 500, 100, 'process'),
    (demo_funnel_id, 'proposal', '方案提案', 700, 100, 'process'),
    (demo_funnel_id, 'close', '成功签约', 900, 100, 'end');
    
    -- 插入连接关系
    INSERT INTO edges (funnel_id, source_node_id, target_node_id) VALUES 
    (demo_funnel_id, 'start', 'contact'),
    (demo_funnel_id, 'contact', 'demo'),
    (demo_funnel_id, 'demo', 'proposal'),
    (demo_funnel_id, 'proposal', 'close');
    
    -- 插入示例数据
    INSERT INTO node_data (funnel_id, node_id, data_week, entry_count, conversion_count) VALUES 
    (demo_funnel_id, 'start', CURRENT_DATE - INTERVAL '7 days', 100, 60),
    (demo_funnel_id, 'contact', CURRENT_DATE - INTERVAL '7 days', 60, 35),
    (demo_funnel_id, 'demo', CURRENT_DATE - INTERVAL '7 days', 35, 20),
    (demo_funnel_id, 'proposal', CURRENT_DATE - INTERVAL '7 days', 20, 8),
    (demo_funnel_id, 'close', CURRENT_DATE - INTERVAL '7 days', 8, 8);
END $$;