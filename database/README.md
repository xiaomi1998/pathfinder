# Pathfinder 数据库管理

## 概述

这个目录包含了 Pathfinder 项目的完整数据库初始化和管理脚本。

## 文件结构

```
database/
├── init.sql                    # 主要的数据库初始化脚本
├── README.md                  # 本文档
├── sample_queries.sql         # 示例查询脚本
└── maintenance_scripts.sql    # 维护脚本
```

## 快速开始

### 1. 初始化数据库

```bash
# 使用 psql 连接并执行初始化脚本
psql -h localhost -U postgres -d pathfinder_db -f database/init.sql
```

### 2. 验证安装

```sql
-- 检查数据完整性
SELECT * FROM check_data_integrity();

-- 查看表大小统计
SELECT * FROM get_table_sizes();

-- 查看数据库统计
SELECT * FROM get_database_stats();
```

## 数据库架构

### 核心表

| 表名 | 描述 | 主要用途 |
|------|------|----------|
| `users` | 用户账户 | 存储用户登录信息和基本资料 |
| `funnels` | 漏斗模型 | 存储用户创建的漏斗配置 |
| `nodes` | 节点数据 | 存储漏斗中的各个节点信息 |
| `edges` | 连接关系 | 存储节点之间的连接关系 |
| `node_data` | 节点数据记录 | 存储节点的转化数据和统计信息 |
| `ai_sessions` | AI会话 | 存储用户与AI的对话会话 |
| `ai_messages` | AI消息 | 存储具体的对话消息内容 |
| `funnel_templates` | 漏斗模板 | 存储可复用的漏斗模板 |
| `user_preferences` | 用户偏好 | 存储用户的个性化设置 |
| `audit_log` | 审计日志 | 记录重要的数据变更操作 |

### 重要视图

| 视图名 | 描述 |
|--------|------|
| `funnel_stats` | 漏斗统计信息汇总 |
| `node_performance_analysis` | 节点性能分析 |
| `ai_usage_stats` | AI使用统计 |
| `user_activity_summary` | 用户活跃度统计 |

### 关键函数

| 函数名 | 用途 |
|--------|------|
| `get_table_sizes()` | 获取所有表的大小统计 |
| `get_database_stats()` | 获取数据库性能统计 |
| `cleanup_old_data(days)` | 清理指定天数之前的旧数据 |
| `check_data_integrity()` | 检查数据完整性 |

## 用户权限

### 数据库用户

- **pathfinder_app**: 应用程序用户，具有完整的读写权限
- **pathfinder_readonly**: 只读用户，用于报表和监控
- **pathfinder_analyst**: 数据分析师用户，可访问统计视图

### 连接示例

```bash
# 应用程序连接
psql -h localhost -U pathfinder_app -d pathfinder_db

# 只读连接
psql -h localhost -U pathfinder_readonly -d pathfinder_db

# 分析师连接
psql -h localhost -U pathfinder_analyst -d pathfinder_db
```

## 示例数据

初始化脚本包含了丰富的示例数据：

### 测试用户
- `demo_user` / `demo@pathfinder.com` (密码: demo123)
- `test_admin` / `admin@pathfinder.com` (密码: demo123)
- `alice_marketer` / `alice@example.com` (密码: demo123)
- `bob_analyst` / `bob@example.com` (密码: demo123)

### 示例漏斗
1. **电商转化漏斗**: 包含从首页访问到重复购买的完整转化路径
2. **SaaS 用户激活**: 新用户从注册到激活的流程

### 示例数据包含
- 多周期的转化数据
- 收入和成本信息
- AI对话会话记录
- 用户偏好设置

## 常用查询

### 查看用户的漏斗列表
```sql
SELECT f.name, f.category, f.status, fs.node_count, fs.avg_conversion_rate
FROM funnels f
JOIN funnel_stats fs ON f.id = fs.funnel_id
WHERE f.user_id = 'your-user-id';
```

### 查看节点性能趋势
```sql
SELECT 
    npa.node_name,
    npa.date_period,
    npa.conversion_rate,
    npa.performance_grade
FROM node_performance_analysis npa
WHERE npa.funnel_id = 'your-funnel-id'
ORDER BY npa.date_period DESC;
```

### 查看AI使用统计
```sql
SELECT * FROM ai_usage_stats
WHERE total_sessions > 0
ORDER BY total_cost DESC;
```

## 维护操作

### 定期清理
```sql
-- 清理90天前的旧数据
SELECT cleanup_old_data(90);
```

### 数据完整性检查
```sql
-- 运行数据完整性检查
SELECT * FROM check_data_integrity();
```

### 性能分析
```sql
-- 查看表大小
SELECT * FROM get_table_sizes();

-- 查看数据库统计
SELECT * FROM get_database_stats();
```

### 更新统计信息
```sql
-- 更新表统计信息以优化查询性能
ANALYZE;
```

## 备份和恢复

### 备份
```bash
# 完整备份
pg_dump -h localhost -U postgres pathfinder_db > backup.sql

# 压缩备份
pg_dump -h localhost -U postgres pathfinder_db | gzip > backup.sql.gz

# 自定义格式备份（推荐）
pg_dump -h localhost -U postgres -Fc pathfinder_db > backup.dump
```

### 恢复
```bash
# 从SQL文件恢复
psql -h localhost -U postgres pathfinder_db < backup.sql

# 从自定义格式恢复
pg_restore -h localhost -U postgres -d pathfinder_db backup.dump
```

## 监控和告警

### 重要监控指标
1. 连接数量
2. 查询响应时间
3. 缓存命中率
4. 表大小增长
5. 死锁数量

### 性能优化建议
1. 定期运行 `VACUUM ANALYZE`
2. 监控慢查询并优化索引
3. 根据业务增长调整连接池大小
4. 考虑分区策略处理大表

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 检查 PostgreSQL 服务是否运行
   - 验证 `pg_hba.conf` 配置
   - 确认用户权限

2. **查询性能慢**
   - 运行 `EXPLAIN ANALYZE` 分析查询计划
   - 检查是否缺少必要的索引
   - 更新表统计信息

3. **磁盘空间不足**
   - 运行 `cleanup_old_data()` 清理旧数据
   - 执行 `VACUUM FULL` 回收空间
   - 考虑归档历史数据

### 日志分析
```bash
# 查看 PostgreSQL 日志
tail -f /var/log/postgresql/postgresql-*.log

# 查看慢查询
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

## 扩展建议

### 高可用性
1. 配置主从复制
2. 设置自动故障转移
3. 实施定期备份策略

### 性能扩展
1. 读写分离
2. 连接池优化
3. 查询缓存
4. 表分区策略

### 安全加固
1. 启用SSL连接
2. 实施行级安全策略
3. 定期审查用户权限
4. 敏感数据加密

## 联系支持

如果遇到数据库相关问题，请：
1. 检查本文档的故障排除部分
2. 查看应用程序日志
3. 运行数据完整性检查
4. 收集相关的错误信息和系统状态