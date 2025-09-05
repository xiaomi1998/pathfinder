-- ==========================================
-- Pathfinder 数据库约束初始化脚本
-- ==========================================
-- 此脚本在 Prisma 迁移后执行，添加额外的数据库约束

-- 等待 Prisma 表创建完成
-- 注意: 这些约束是 Prisma schema 中 @@check 的补充

-- ==========================================
-- 用户表约束
-- ==========================================

-- 用户名长度和格式约束
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_username_length 
CHECK (length(username) >= 3 AND length(username) <= 50);

ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_username_format 
CHECK (username ~* '^[a-zA-Z0-9_.-]+$');

-- 邮箱格式约束
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 密码哈希约束 (确保不为空)
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_password_hash 
CHECK (length(password_hash) >= 10);

-- 创建时间约束
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_created_at 
CHECK (created_at <= CURRENT_TIMESTAMP);

-- 最后登录时间约束
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_last_login 
CHECK (last_login_at IS NULL OR last_login_at >= created_at);

-- ==========================================
-- 漏斗表约束
-- ==========================================

-- 漏斗名称约束
ALTER TABLE funnels 
ADD CONSTRAINT IF NOT EXISTS chk_funnels_name_length 
CHECK (length(name) >= 1 AND length(name) <= 100);

-- 标签数组约束
ALTER TABLE funnels 
ADD CONSTRAINT IF NOT EXISTS chk_funnels_tags_count 
CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 20);

-- 创建时间约束
ALTER TABLE funnels 
ADD CONSTRAINT IF NOT EXISTS chk_funnels_timestamps 
CHECK (created_at <= updated_at);

-- ==========================================
-- 节点表约束
-- ==========================================

-- 节点标签约束
ALTER TABLE nodes 
ADD CONSTRAINT IF NOT EXISTS chk_nodes_label_length 
CHECK (length(label) >= 1 AND length(label) <= 30);

-- 位置坐标约束 (合理的画布范围)
ALTER TABLE nodes 
ADD CONSTRAINT IF NOT EXISTS chk_nodes_position_x 
CHECK (position_x >= 0 AND position_x <= 10000);

ALTER TABLE nodes 
ADD CONSTRAINT IF NOT EXISTS chk_nodes_position_y 
CHECK (position_y >= 0 AND position_y <= 10000);

-- ==========================================
-- 节点数据表约束
-- ==========================================

-- 数据完整性约束 (已在 Prisma schema 中定义，这里添加额外检查)

-- 收入和成本约束
ALTER TABLE node_data 
ADD CONSTRAINT IF NOT EXISTS chk_node_data_revenue 
CHECK (revenue IS NULL OR revenue >= 0);

ALTER TABLE node_data 
ADD CONSTRAINT IF NOT EXISTS chk_node_data_cost 
CHECK (cost IS NULL OR cost >= 0);

-- 时间相关约束
ALTER TABLE node_data 
ADD CONSTRAINT IF NOT EXISTS chk_node_data_time_spent 
CHECK (avg_time_spent IS NULL OR avg_time_spent >= 0);

-- 跳出数量约束
ALTER TABLE node_data 
ADD CONSTRAINT IF NOT EXISTS chk_node_data_bounce 
CHECK (bounce_count IS NULL OR (bounce_count >= 0 AND bounce_count <= entry_count));

-- 周开始日期约束 (必须是周一)
ALTER TABLE node_data 
ADD CONSTRAINT IF NOT EXISTS chk_node_data_week_start 
CHECK (EXTRACT(DOW FROM week_start_date) = 1); -- 1 = 周一

-- ==========================================
-- AI 会话表约束
-- ==========================================

-- 会话时间约束
ALTER TABLE ai_sessions 
ADD CONSTRAINT IF NOT EXISTS chk_ai_sessions_time 
CHECK (ended_at IS NULL OR ended_at >= created_at);

-- ==========================================
-- AI 消息表约束
-- ==========================================

-- 消息内容约束
ALTER TABLE ai_messages 
ADD CONSTRAINT IF NOT EXISTS chk_ai_messages_content 
CHECK (length(content) >= 1 AND length(content) <= 10000);

-- ==========================================
-- 审计日志表约束
-- ==========================================

-- 表名约束
ALTER TABLE audit_log 
ADD CONSTRAINT IF NOT EXISTS chk_audit_log_table_name 
CHECK (table_name IN ('users', 'funnels', 'nodes', 'edges', 'node_data', 'ai_sessions', 'ai_messages'));

-- 时间戳约束
ALTER TABLE audit_log 
ADD CONSTRAINT IF NOT EXISTS chk_audit_log_timestamp 
CHECK (timestamp <= CURRENT_TIMESTAMP);

-- ==========================================
-- 触发器函数
-- ==========================================

-- 自动更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为有 updated_at 字段的表创建触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_funnels_updated_at ON funnels;
CREATE TRIGGER update_funnels_updated_at 
    BEFORE UPDATE ON funnels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nodes_updated_at ON nodes;
CREATE TRIGGER update_nodes_updated_at 
    BEFORE UPDATE ON nodes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_node_data_updated_at ON node_data;
CREATE TRIGGER update_node_data_updated_at 
    BEFORE UPDATE ON node_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 自动计算转化率的触发器
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_conversion_rate()
RETURNS TRIGGER AS $$
BEGIN
    -- 自动计算转化率
    IF NEW.entry_count > 0 THEN
        NEW.conversion_rate = NEW.converted_count::numeric / NEW.entry_count::numeric;
    ELSE
        NEW.conversion_rate = 0;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS calculate_node_data_conversion_rate ON node_data;
CREATE TRIGGER calculate_node_data_conversion_rate 
    BEFORE INSERT OR UPDATE ON node_data 
    FOR EACH ROW EXECUTE FUNCTION calculate_conversion_rate();

-- ==========================================
-- 记录约束创建结果
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '数据库约束创建完成:';
    RAISE NOTICE '- 用户数据完整性约束';
    RAISE NOTICE '- 漏斗业务逻辑约束';
    RAISE NOTICE '- 节点位置和数据约束';
    RAISE NOTICE '- 节点数据业务规则约束';
    RAISE NOTICE '- AI 会话时间约束';
    RAISE NOTICE '- 审计日志完整性约束';
    RAISE NOTICE '- 自动更新时间戳触发器';
    RAISE NOTICE '- 自动计算转化率触发器';
END $$;