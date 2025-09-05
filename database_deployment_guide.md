# Pathfinder 数据库部署和管理指南

## 概述

本指南详细说明了 Pathfinder 项目数据库的部署、配置、维护和监控流程。

## 1. 环境准备

### 1.1 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 11+
- **PostgreSQL**: 14.x 或更高版本
- **内存**: 最少 4GB RAM（推荐 8GB+）
- **存储**: SSD 硬盘，至少 50GB 可用空间
- **网络**: 稳定的互联网连接

### 1.2 安装 PostgreSQL

#### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 PostgreSQL
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### CentOS/RHEL
```bash
# 安装 PostgreSQL 仓库
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# 安装 PostgreSQL
sudo dnf install -y postgresql14-server postgresql14

# 初始化数据库
sudo /usr/pgsql-14/bin/postgresql-14-setup initdb

# 启动服务
sudo systemctl enable postgresql-14
sudo systemctl start postgresql-14
```

#### macOS
```bash
# 使用 Homebrew 安装
brew install postgresql

# 启动服务
brew services start postgresql
```

### 1.3 配置 PostgreSQL

#### 编辑配置文件
```bash
# 编辑主配置文件
sudo nano /etc/postgresql/14/main/postgresql.conf

# 关键配置项：
# listen_addresses = '*'
# port = 5432
# max_connections = 100
# shared_buffers = 256MB
# effective_cache_size = 1GB
# work_mem = 4MB
# maintenance_work_mem = 64MB
```

#### 配置认证
```bash
# 编辑认证配置
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 添加以下配置：
# local   all             all                                     peer
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5
```

#### 重启服务
```bash
sudo systemctl restart postgresql
```

## 2. 数据库初始化

### 2.1 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

-- 创建数据库
CREATE DATABASE pathfinder_db WITH 
    ENCODING 'UTF8' 
    LC_COLLATE='en_US.UTF-8' 
    LC_CTYPE='en_US.UTF-8';

-- 创建应用用户
CREATE USER pathfinder_app WITH PASSWORD 'secure_app_password_2025';

-- 创建只读用户
CREATE USER pathfinder_readonly WITH PASSWORD 'secure_readonly_password_2025';

-- 退出 psql
\q
```

### 2.2 执行初始化脚本

```bash
# 执行数据库初始化
psql -U postgres -d pathfinder_db -f init_database.sql

# 执行维护脚本
psql -U postgres -d pathfinder_db -f database_maintenance.sql
```

### 2.3 验证安装

```bash
# 连接数据库验证
psql -U pathfinder_app -d pathfinder_db -c "SELECT COUNT(*) FROM users;"

# 检查表结构
psql -U pathfinder_app -d pathfinder_db -c "\dt"

# 运行健康检查
psql -U pathfinder_app -d pathfinder_db -c "SELECT * FROM database_health_check();"
```

## 3. 应用程序集成

### 3.1 使用 Prisma

#### 安装依赖
```bash
npm install prisma @prisma/client
npm install -D prisma
```

#### 配置 Prisma
```bash
# 复制 schema 文件
cp prisma_schema.prisma prisma/schema.prisma

# 生成 Prisma 客户端
npx prisma generate

# 推送数据库结构（开发环境）
npx prisma db push

# 或使用迁移（生产环境）
npx prisma migrate deploy
```

#### 基本使用示例
```javascript
// prisma-client.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;

// 使用示例
const prisma = require('./prisma-client');

async function createUser(userData) {
  try {
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        passwordHash: userData.passwordHash,
      },
    });
    return user;
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```

### 3.2 环境变量配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env

# 确保数据库连接字符串正确
DATABASE_URL="postgresql://pathfinder_app:secure_app_password_2025@localhost:5432/pathfinder_db?schema=public"
```

## 4. 备份策略

### 4.1 自动备份脚本

```bash
#!/bin/bash
# /etc/cron.d/pathfinder-backup

# 每日凌晨 2 点备份
0 2 * * * postgres /usr/local/bin/pathfinder_backup.sh

# 备份脚本内容
cat > /usr/local/bin/pathfinder_backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/var/backups/pathfinder"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="pathfinder_db"
DB_USER="pathfinder_app"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 完整备份
pg_dump -h localhost -U $DB_USER $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/pathfinder_full_$TIMESTAMP.dump"

# 仅数据备份
pg_dump -h localhost -U $DB_USER $DB_NAME \
  --format=custom \
  --data-only \
  --compress=9 \
  --file="$BACKUP_DIR/pathfinder_data_$TIMESTAMP.dump"

# 清理 30 天前的备份
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete

# 备份到云存储（可选）
# aws s3 cp $BACKUP_DIR/pathfinder_full_$TIMESTAMP.dump s3://your-backup-bucket/

echo "备份完成: $TIMESTAMP"
EOF

# 设置权限
chmod +x /usr/local/bin/pathfinder_backup.sh
chown postgres:postgres /usr/local/bin/pathfinder_backup.sh
```

### 4.2 恢复数据

```bash
# 从完整备份恢复
pg_restore -h localhost -U pathfinder_app -d pathfinder_db \
  --clean --if-exists --verbose \
  /var/backups/pathfinder/pathfinder_full_20250822_020000.dump

# 仅恢复数据
pg_restore -h localhost -U pathfinder_app -d pathfinder_db \
  --data-only --verbose \
  /var/backups/pathfinder/pathfinder_data_20250822_020000.dump
```

## 5. 性能优化

### 5.1 索引优化

```sql
-- 分析索引使用情况
SELECT * FROM analyze_index_usage();

-- 查找缺失的索引（示例查询）
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC;
```

### 5.2 查询优化

```sql
-- 启用查询统计扩展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查看慢查询
SELECT * FROM get_slow_queries();

-- 分析具体查询
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM node_conversion_analysis 
WHERE funnel_id = 'uuid-here';
```

### 5.3 配置调优

```ini
# postgresql.conf 优化配置
shared_buffers = 256MB          # 25% of RAM
effective_cache_size = 1GB      # 75% of RAM
work_mem = 4MB                  # Per query operation
maintenance_work_mem = 64MB     # For maintenance operations
random_page_cost = 1.1          # SSD optimization
effective_io_concurrency = 200  # SSD optimization
max_connections = 100           # Adjust based on load
```

## 6. 监控和告警

### 6.1 基础监控脚本

```bash
#!/bin/bash
# /usr/local/bin/pathfinder_monitor.sh

# 检查数据库连接
if ! pg_isready -h localhost -p 5432 -U pathfinder_app; then
  echo "CRITICAL: 数据库连接失败" | mail -s "Pathfinder DB Alert" admin@company.com
  exit 1
fi

# 检查磁盘空间
DISK_USAGE=$(df -h /var/lib/postgresql | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "WARNING: 数据库磁盘使用率超过 80%: ${DISK_USAGE}%" | mail -s "Pathfinder Disk Alert" admin@company.com
fi

# 检查活动连接数
ACTIVE_CONNECTIONS=$(psql -U pathfinder_readonly -d pathfinder_db -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
if [ $ACTIVE_CONNECTIONS -gt 50 ]; then
  echo "WARNING: 活动连接数过多: $ACTIVE_CONNECTIONS" | mail -s "Pathfinder Connection Alert" admin@company.com
fi

# 运行数据库健康检查
psql -U pathfinder_readonly -d pathfinder_db -c "SELECT * FROM database_health_check();" > /tmp/db_health.log
```

### 6.2 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 添加监控任务
# 每 5 分钟检查一次
*/5 * * * * /usr/local/bin/pathfinder_monitor.sh

# 每日生成报告
0 6 * * * psql -U pathfinder_readonly -d pathfinder_db -c "SELECT generate_database_report();" > /var/log/pathfinder_daily_report.log

# 每周优化数据库
0 3 * * 0 psql -U pathfinder_app -d pathfinder_db -c "SELECT optimize_database();"
```

## 7. 安全最佳实践

### 7.1 访问控制

```sql
-- 限制网络访问
-- 在 pg_hba.conf 中只允许特定 IP
host    pathfinder_db   pathfinder_app    10.0.1.0/24     md5

-- 定期轮换密码
ALTER USER pathfinder_app PASSWORD 'new_secure_password_2025';

-- 启用行级安全
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_data_policy ON funnels 
  FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 7.2 数据加密

```sql
-- 加密敏感字段
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 加密函数示例
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt_iv(data::bytea, 
                           decode(current_setting('app.encryption_key'), 'base64'), 
                           gen_random_bytes(16), 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.3 审计日志

```sql
-- 查看审计日志
SELECT 
  table_name,
  operation,
  timestamp,
  user_id
FROM audit_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- 异常操作检测
SELECT 
  user_id,
  COUNT(*) as operation_count,
  array_agg(DISTINCT operation) as operations
FROM audit_log
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;  -- 1小时内操作超过100次
```

## 8. 故障排查

### 8.1 常见问题

#### 连接问题
```bash
# 检查服务状态
sudo systemctl status postgresql

# 检查端口监听
netstat -tlnp | grep 5432

# 检查配置
sudo -u postgres psql -c "SHOW listen_addresses;"
```

#### 性能问题
```sql
-- 检查锁等待
SELECT * FROM check_locks_and_blocking();

-- 检查慢查询
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- 检查表膨胀
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup::float / n_live_tup * 100, 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY dead_ratio DESC;
```

#### 存储空间问题
```sql
-- 查看表大小
SELECT * FROM get_table_sizes();

-- 查找大对象
SELECT oid, pg_size_pretty(size) 
FROM (
  SELECT oid, pg_column_size(lo) as size 
  FROM pg_largeobject_metadata
) t
ORDER BY size DESC;
```

### 8.2 紧急恢复流程

```bash
# 1. 停止应用服务
sudo systemctl stop pathfinder-app

# 2. 创建紧急备份
pg_dump -U postgres pathfinder_db > /tmp/emergency_backup.sql

# 3. 恢复到指定时间点（如果启用了 WAL 归档）
pg_basebackup -D /var/lib/postgresql/backup -Ft -z -P

# 4. 重启服务
sudo systemctl start postgresql
sudo systemctl start pathfinder-app
```

## 9. 扩展和升级

### 9.1 数据库升级

```bash
# PostgreSQL 版本升级
sudo pg_upgrade \
  --old-bindir /usr/lib/postgresql/13/bin \
  --new-bindir /usr/lib/postgresql/14/bin \
  --old-datadir /var/lib/postgresql/13/main \
  --new-datadir /var/lib/postgresql/14/main
```

### 9.2 水平扩展准备

```sql
-- 为分片做准备的表设计
CREATE TABLE users_shard_1 (
  LIKE users INCLUDING ALL,
  CONSTRAINT users_shard_1_check CHECK (
    ('x' || substr(id::text, 1, 8))::bit(32)::int % 4 = 1
  )
) INHERITS (users);

-- 读写分离配置
-- 主库写入，从库读取
```

## 10. 文档和维护

### 10.1 维护检查清单

#### 每日检查
- [ ] 数据库服务状态
- [ ] 磁盘空间使用率
- [ ] 活动连接数
- [ ] 备份任务执行状态
- [ ] 错误日志检查

#### 每周检查
- [ ] 执行 `optimize_database()` 函数
- [ ] 检查索引使用情况
- [ ] 清理临时文件
- [ ] 更新统计信息
- [ ] 检查数据质量

#### 每月检查
- [ ] 审查安全设置
- [ ] 更新密码
- [ ] 检查备份完整性
- [ ] 性能趋势分析
- [ ] 容量规划评估

### 10.2 联系信息

**数据库管理员**: admin@pathfinder.com
**紧急联系**: +86-xxx-xxxx-xxxx
**技术支持**: support@pathfinder.com

---

本指南应该根据实际部署环境和需求进行调整。建议定期更新此文档以反映最新的配置和最佳实践。