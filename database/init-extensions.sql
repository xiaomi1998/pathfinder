-- ==========================================
-- Pathfinder 数据库扩展初始化脚本
-- ==========================================
-- 此脚本在数据库创建时自动执行，安装必要的 PostgreSQL 扩展

-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 启用全文搜索扩展 (三字符组合)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 启用 PostgreSQL 统计扩展 (用于监控)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 启用 btree_gin 扩展 (支持复合索引优化)
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 启用 btree_gist 扩展 (支持范围查询优化)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 启用 fuzzystrmatch 扩展 (模糊字符串匹配)
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- 记录扩展安装情况
DO $$
BEGIN
    RAISE NOTICE '数据库扩展安装完成:';
    RAISE NOTICE '- uuid-ossp: UUID 生成';
    RAISE NOTICE '- pg_trgm: 全文搜索';
    RAISE NOTICE '- pg_stat_statements: 查询统计';
    RAISE NOTICE '- btree_gin: 复合索引优化';
    RAISE NOTICE '- btree_gist: 范围查询优化';
    RAISE NOTICE '- fuzzystrmatch: 模糊匹配';
END $$;