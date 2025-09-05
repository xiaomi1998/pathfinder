# 🐧 Pathfinder Linux 部署指南

[![Linux](https://img.shields.io/badge/Linux-Ubuntu%2020.04+-orange?logo=linux&logoColor=white)](https://ubuntu.com/)
[![Docker](https://img.shields.io/badge/Docker-20.10+-blue?logo=docker&logoColor=white)](https://docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql&logoColor=white)](https://postgresql.org/)

## 📋 概述

本指南专为在 Linux 服务器上部署 Pathfinder 智能销售漏斗分析平台而编写，适合新手和运维人员快速完成生产环境的部署。

## 🖥 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用磁盘空间（SSD 推荐）
- **网络**: 100Mbps 带宽

### 推荐配置
- **CPU**: 4核心或更多
- **内存**: 8GB RAM 或更多
- **存储**: 50GB SSD 存储
- **网络**: 1Gbps 带宽

### 操作系统支持
- **Ubuntu**: 20.04 LTS, 22.04 LTS（推荐）
- **CentOS**: 7.9, 8.x
- **RHEL**: 8.x, 9.x
- **Debian**: 10, 11, 12

## 🛠 环境准备

### 1. 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
# 或 (CentOS 8+/RHEL 8+)
sudo dnf update -y
```

### 2. 安装必需软件

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git vim unzip htop

# CentOS/RHEL
sudo yum install -y curl wget git vim unzip htop
# 或
sudo dnf install -y curl wget git vim unzip htop
```

### 3. 安装 Docker 和 Docker Compose

#### Ubuntu/Debian 安装 Docker

```bash
# 移除旧版本
sudo apt remove docker docker-engine docker.io containerd runc

# 安装依赖
sudo apt update
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组（可选）
sudo usermod -aG docker $USER
```

#### CentOS/RHEL 安装 Docker

```bash
# 移除旧版本
sudo yum remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到 docker 组（可选）
sudo usermod -aG docker $USER
```

### 4. 验证安装

```bash
# 验证 Docker 安装
docker --version
docker compose version

# 测试 Docker 运行
sudo docker run hello-world
```

### 5. 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /opt/pathfinder
sudo chown $USER:$USER /opt/pathfinder
cd /opt/pathfinder

# 创建数据目录
sudo mkdir -p /var/lib/pathfinder/{postgres,redis,prometheus,grafana}
sudo mkdir -p /var/log/pathfinder
sudo chown -R $USER:$USER /var/lib/pathfinder /var/log/pathfinder
```

## 📁 获取项目代码

### 1. 克隆项目

```bash
cd /opt/pathfinder
git clone https://github.com/pathfinder/pathfinder.git .

# 或从其他源克隆
# git clone <your-repository-url> .
```

### 2. 设置文件权限

```bash
# 设置脚本执行权限
chmod +x *.sh
chmod +x scripts/*.sh

# 设置日志目录权限
mkdir -p logs/{nginx,backend,frontend,postgres,redis,certbot}
chmod 755 logs
```

## ⚙ 配置文件设置

### 1. 创建生产环境配置文件

```bash
# 复制示例配置文件
cp .env.prod.example .env.prod

# 使用编辑器编辑配置文件
vim .env.prod
```

### 2. .env.prod 配置说明

```bash
# ===========================================
# 基础配置
# ===========================================
NODE_ENV=production
VERSION=1.0.0
INSTANCE_ID=1

# 应用配置
APP_NAME=Pathfinder
API_BASE_URL=https://your-domain.com/api
CORS_ORIGIN=https://your-domain.com

# 域名配置（SSL 证书使用）
DOMAIN_NAME=your-domain.com
SSL_EMAIL=admin@your-domain.com

# ===========================================
# 数据库配置
# ===========================================
POSTGRES_DB=pathfinder_db
POSTGRES_USER=pathfinder_app
POSTGRES_PASSWORD=your_super_secure_password_here

# 数据库连接字符串
DATABASE_URL=postgresql://pathfinder_app:your_super_secure_password_here@postgres-primary:5432/pathfinder_db?schema=public&sslmode=require

# ===========================================
# Redis 缓存配置
# ===========================================
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@redis-master:6379

# ===========================================
# JWT 认证配置
# ===========================================
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# ===========================================
# AI 服务配置
# ===========================================
AI_API_KEY=your_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# ===========================================
# 监控配置
# ===========================================
GRAFANA_PASSWORD=your_grafana_admin_password
GRAFANA_SECRET_KEY=your_grafana_secret_key_32_chars

# ===========================================
# 数据存储路径
# ===========================================
DATA_PATH=/var/lib/pathfinder

# ===========================================
# 备份配置
# ===========================================
BACKUP_RETENTION_DAYS=30

# ===========================================
# 日志级别
# ===========================================
LOG_LEVEL=info

# ===========================================
# 邮件配置（可选）
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# ===========================================
# 第三方集成（可选）
# ===========================================
ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

### 3. 生成安全密钥

```bash
# 生成 JWT 密钥（32字符以上）
openssl rand -hex 32

# 生成 PostgreSQL 密码
openssl rand -base64 32

# 生成 Redis 密码
openssl rand -base64 24

# 生成 Grafana 密钥
openssl rand -hex 32
```

### 4. 配置域名和SSL（可选）

如果您有域名，请配置域名解析：

```bash
# 检查域名解析
nslookup your-domain.com
dig your-domain.com

# 如果使用 Cloudflare 或其他 CDN
# 确保 A 记录指向您的服务器 IP
```

## 🚀 部署步骤

### 1. 使用自动化部署脚本（推荐）

```bash
# 赋予执行权限
chmod +x scripts/deploy-production.sh

# 执行部署
./scripts/deploy-production.sh

# 或指定版本
./scripts/deploy-production.sh v1.0.0
```

### 2. 手动部署步骤

如果自动化脚本失败，可以使用手动步骤：

#### 步骤 1：构建镜像

```bash
# 构建后端镜像
docker build -f backend/Dockerfile.prod \
    --build-arg NODE_ENV=production \
    -t pathfinder-backend:latest \
    ./backend/

# 构建前端镜像
docker build -f frontend/Dockerfile.prod \
    --build-arg VITE_API_BASE_URL="https://your-domain.com/api" \
    -t pathfinder-frontend:latest \
    ./frontend/
```

#### 步骤 2：启动服务

```bash
# 启动生产环境
docker compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker compose -f docker-compose.prod.yml ps
```

#### 步骤 3：初始化数据库

```bash
# 等待数据库启动
sleep 30

# 进入后端容器初始化数据库
docker exec -it pathfinder-backend-1 npm run db:push
docker exec -it pathfinder-backend-1 npm run db:seed
```

#### 步骤 4：配置 SSL 证书（如有域名）

```bash
# 请求 Let's Encrypt 证书
docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    --email admin@your-domain.com --agree-tos --no-eff-email \
    -d your-domain.com -d www.your-domain.com

# 重启 Nginx 使用新证书
docker compose -f docker-compose.prod.yml restart nginx
```

## 📋 启动和停止

### 启动服务

```bash
# 启动所有服务
docker compose -f docker-compose.prod.yml up -d

# 启动特定服务
docker compose -f docker-compose.prod.yml up -d backend frontend

# 查看启动日志
docker compose -f docker-compose.prod.yml logs -f
```

### 停止服务

```bash
# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 停止并删除数据卷（危险操作）
docker compose -f docker-compose.prod.yml down -v

# 停止特定服务
docker compose -f docker-compose.prod.yml stop backend
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启特定服务
docker compose -f docker-compose.prod.yml restart backend
```

### 查看服务状态

```bash
# 查看所有服务状态
docker compose -f docker-compose.prod.yml ps

# 查看服务资源使用
docker stats

# 查看特定服务日志
docker compose -f docker-compose.prod.yml logs -f backend
```

## 🔍 健康检查

### 1. 自动健康检查脚本

```bash
# 运行健康检查脚本
./scripts/health-check.sh
```

### 2. 手动健康检查

```bash
# 检查前端服务
curl -f http://localhost/health
curl -f https://your-domain.com/health

# 检查后端 API
curl -f http://localhost/api/health
curl -f https://your-domain.com/api/health

# 检查数据库连接
docker exec pathfinder-postgres-primary pg_isready -U pathfinder_app

# 检查 Redis 连接
docker exec pathfinder-redis-master redis-cli ping

# 检查 SSL 证书（如果启用）
curl -f https://your-domain.com/api/health
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 3. 服务端点验证

```bash
# 验证主要功能端点
curl -X POST https://your-domain.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# 验证登录端点
curl -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@pathfinder.com","password":"demo123"}'
```

## 🚨 故障排查

### 常见问题及解决方案

#### 1. 服务启动失败

```bash
# 查看详细错误信息
docker compose -f docker-compose.prod.yml logs backend

# 检查配置文件
cat .env.prod | grep -v '^#'

# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker exec pathfinder-postgres-primary pg_isready -U pathfinder_app

# 检查数据库日志
docker logs pathfinder-postgres-primary

# 测试数据库连接
docker exec pathfinder-postgres-primary psql -U pathfinder_app -d pathfinder_db -c "SELECT version();"

# 重置数据库密码（如果忘记）
docker exec -it pathfinder-postgres-primary psql -U postgres -c "ALTER USER pathfinder_app PASSWORD 'new_password';"
```

#### 3. Redis 连接问题

```bash
# 检查 Redis 状态
docker exec pathfinder-redis-master redis-cli -a your_redis_password ping

# 检查 Redis 内存使用
docker exec pathfinder-redis-master redis-cli -a your_redis_password info memory

# 清空 Redis 缓存（如果需要）
docker exec pathfinder-redis-master redis-cli -a your_redis_password flushall
```

#### 4. SSL 证书问题

```bash
# 检查证书文件
ls -la /var/lib/docker/volumes/pathfinder_certbot_certs/_data/live/your-domain.com/

# 手动更新证书
docker compose -f docker-compose.prod.yml run --rm certbot renew

# 测试证书配置
curl -vI https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### 5. 性能问题诊断

```bash
# 检查系统资源
top
htop
free -h
df -h

# 检查 Docker 资源使用
docker stats

# 检查网络连接
netstat -tulpn
ss -tulpn

# 检查数据库性能
docker exec pathfinder-postgres-primary psql -U pathfinder_app -d pathfinder_db -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

### 日志分析

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 查看特定时间段的日志
docker compose -f docker-compose.prod.yml logs --since=2h backend

# 搜索错误日志
docker compose -f docker-compose.prod.yml logs | grep -i error

# 分析访问日志
tail -f logs/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -nr

# 监控错误率
watch -n 5 'docker compose -f docker-compose.prod.yml logs --since=5m | grep -i error | wc -l'
```

## 🔧 维护管理

### 1. 数据库备份

#### 自动备份设置

```bash
# 创建备份脚本
cat > /opt/pathfinder/backup-cron.sh << 'EOF'
#!/bin/bash
cd /opt/pathfinder
./scripts/backup-database.sh
find ./backups -name "*.sql" -mtime +30 -delete
EOF

chmod +x /opt/pathfinder/backup-cron.sh

# 添加到 cron 任务（每天凌晨 2 点备份）
echo "0 2 * * * /opt/pathfinder/backup-cron.sh" | crontab -
```

#### 手动备份

```bash
# 运行备份脚本
./scripts/backup-database.sh

# 手动备份数据库
docker exec pathfinder-postgres-primary pg_dump \
    -U pathfinder_app -d pathfinder_db \
    > backups/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# 备份整个数据目录
tar -czf backups/data_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    /var/lib/pathfinder/
```

#### 数据库恢复

```bash
# 从备份恢复数据库
docker exec -i pathfinder-postgres-primary psql \
    -U pathfinder_app -d pathfinder_db \
    < backups/backup_file.sql

# 恢复整个数据目录（需要停止服务）
docker compose -f docker-compose.prod.yml down
tar -xzf backups/data_backup_file.tar.gz -C /
docker compose -f docker-compose.prod.yml up -d
```

### 2. 系统更新

#### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
./scripts/deploy-production.sh v1.1.0

# 或手动更新
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

#### 系统包更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 重启服务
sudo systemctl restart docker
docker compose -f docker-compose.prod.yml restart
```

### 3. 日志管理

#### 日志轮转配置

```bash
# 创建 logrotate 配置
sudo tee /etc/logrotate.d/pathfinder << 'EOF'
/var/log/pathfinder/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 root root
    postrotate
        /bin/kill -USR1 $(cat /var/run/rsyslogd.pid 2>/dev/null) 2>/dev/null || true
    endscript
}

/opt/pathfinder/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 $(whoami) $(whoami)
}
EOF

# 测试 logrotate 配置
sudo logrotate -d /etc/logrotate.d/pathfinder
```

#### 清理旧日志

```bash
# 清理超过 30 天的日志
find logs/ -name "*.log" -mtime +30 -delete

# 清理 Docker 日志
docker system prune -f
docker image prune -f
```

### 4. 性能优化

#### 数据库优化

```bash
# 进入数据库容器
docker exec -it pathfinder-postgres-primary psql -U pathfinder_app -d pathfinder_db

-- 查看数据库大小
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;

-- 分析慢查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC LIMIT 10;

-- 重建索引
REINDEX DATABASE pathfinder_db;

-- 清理无用数据
VACUUM ANALYZE;
```

#### 系统资源监控

```bash
# 安装监控工具
sudo apt install -y iotop nethogs ncdu

# 创建监控脚本
cat > /opt/pathfinder/monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Resources ==="
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{printf "%s", $5}')"
echo ""

echo "=== Docker Stats ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

echo "=== Service Status ==="
docker compose -f docker-compose.prod.yml ps
EOF

chmod +x /opt/pathfinder/monitor.sh

# 运行监控脚本
./monitor.sh
```

### 5. 安全维护

#### 安全扫描

```bash
# 扫描容器安全漏洞（需要安装 trivy）
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 扫描镜像
trivy image pathfinder-backend:latest
trivy image pathfinder-frontend:latest

# 扫描文件系统
trivy fs /opt/pathfinder
```

#### 更新安全配置

```bash
# 更新防火墙规则
sudo ufw reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 检查开放端口
sudo netstat -tulpn | grep LISTEN
sudo ss -tulpn | grep LISTEN

# 检查 fail2ban 状态（如果安装）
sudo fail2ban-client status
```

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. **检查日志**：首先查看相关服务的日志信息
2. **查阅文档**：参考项目其他文档如 `DEPLOYMENT.md` 和 `README.md`
3. **社区支持**：在项目的 GitHub Issues 中提交问题
4. **联系支持**：发送邮件至 support@pathfinder.com

### 常用诊断命令汇总

```bash
# 系统信息
uname -a
lsb_release -a
docker --version
docker compose version

# 服务状态
systemctl status docker
docker compose -f docker-compose.prod.yml ps
docker stats

# 网络诊断
netstat -tulpn
curl -I http://localhost
curl -I https://your-domain.com

# 资源检查
free -h
df -h
top
htop
```

---

**最后更新**: 2025年1月  
**文档版本**: v1.0  
**适用版本**: Pathfinder v1.0.0+  
**维护团队**: DevOps Team

🚀 **祝您部署成功！如有问题，欢迎随时联系我们的技术支持团队。**