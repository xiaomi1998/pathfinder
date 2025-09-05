# Pathfinder 生产环境部署指南

本文档详细介绍了 Pathfinder 项目的生产环境部署流程和管理方法。

## 🏗️ 架构概览

生产环境采用容器化部署，包含以下组件：

- **Nginx**: 反向代理、负载均衡、SSL 终端
- **前端**: Vue.js SPA 应用（多阶段构建）
- **后端**: Node.js API 服务（PM2 集群模式）
- **PostgreSQL**: 主数据库（支持集群扩展）
- **Redis**: 缓存和会话存储
- **监控系统**: Prometheus + Grafana
- **日志收集**: Filebeat + ELK Stack (可选)
- **SSL 证书**: Let's Encrypt 自动续期

## 📋 部署前准备

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 最低 4 核，推荐 8 核+
- **内存**: 最低 8GB，推荐 16GB+
- **存储**: 最低 100GB SSD，推荐 500GB+
- **网络**: 公网 IP，开放 80/443 端口

### 软件依赖

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 域名和 DNS 配置

1. 将域名 A 记录指向服务器公网 IP
2. 建议配置 www 子域名 CNAME 到主域名
3. 可选：配置 api 子域名用于 API 专用访问

### 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🚀 快速部署

### 1. 克隆项目代码

```bash
git clone https://github.com/pathfinder/pathfinder.git
cd pathfinder
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.prod.example .env.prod

# 编辑配置文件（重要！）
nano .env.prod
```

**必须配置的关键参数：**

```bash
# 域名配置
DOMAIN_NAME=your-domain.com
API_BASE_URL=https://your-domain.com/api

# 数据库密码（至少32字符）
POSTGRES_PASSWORD=your_very_strong_postgres_password_here

# Redis 密码（至少32字符）
REDIS_PASSWORD=your_very_strong_redis_password_here

# JWT 密钥（使用 openssl rand -hex 64 生成）
JWT_SECRET=your_jwt_secret_key_64_characters

# SSL 证书邮箱
SSL_EMAIL=admin@your-domain.com

# AI 服务配置
OPENAI_API_KEY=sk-your-openai-key
```

### 3. 执行自动部署

```bash
# 赋予执行权限
chmod +x scripts/deploy-production.sh

# 执行部署
./scripts/deploy-production.sh v1.0.0
```

部署脚本会自动完成：
- 环境检查
- 数据备份
- 镜像构建
- 服务启动
- SSL 证书申请
- 健康检查

## 🔧 生产环境管理

### 日常管理命令

```bash
# 查看服务状态
./scripts/manage-production.sh status

# 查看日志
./scripts/manage-production.sh logs
./scripts/manage-production.sh logs backend
./scripts/manage-production.sh logs nginx

# 重启服务
./scripts/manage-production.sh restart
./scripts/manage-production.sh restart backend

# 健康检查
./scripts/manage-production.sh health

# 创建备份
./scripts/manage-production.sh backup

# 更新服务
./scripts/manage-production.sh update
```

### 扩容操作

```bash
# 扩展后端服务到 3 个实例
./scripts/manage-production.sh scale backend 3

# 扩展前端服务到 2 个实例
./scripts/manage-production.sh scale frontend 2
```

### SSL 证书管理

```bash
# 手动续期证书
./scripts/manage-production.sh ssl-renew

# 查看证书状态
openssl x509 -in /var/lib/docker/volumes/pathfinder-certbot-certs/_data/live/your-domain.com/fullchain.pem -text -noout
```

## 📊 监控和日志

### 访问监控面板

- **Grafana**: http://your-server-ip:3001
  - 用户名: admin
  - 密码: 在 `.env.prod` 中配置的 `GRAFANA_PASSWORD`

- **Prometheus**: http://your-server-ip:9090

### 日志文件位置

```
logs/
├── nginx/          # Nginx 访问和错误日志
├── backend/        # 后端应用日志
├── frontend/       # 前端 Nginx 日志
├── postgres/       # 数据库日志
├── redis/          # Redis 日志
└── certbot/        # SSL 证书日志
```

### 监控指标

- **系统资源**: CPU、内存、磁盘使用率
- **应用性能**: 响应时间、请求量、错误率
- **数据库性能**: 连接数、查询性能、缓存命中率
- **服务健康**: 容器状态、端口监听、依赖服务

## 🔒 安全配置

### 网络安全

1. **防火墙配置**: 仅开放必要端口 (80, 443)
2. **SSH 安全**: 禁用密码登录，使用密钥认证
3. **内网访问**: 数据库和 Redis 仅内网可访问
4. **速率限制**: API 和登录端点限制请求频率

### 应用安全

1. **HTTPS 强制**: 所有 HTTP 请求重定向到 HTTPS
2. **安全头**: CSP、HSTS、XSS Protection 等
3. **JWT 安全**: 使用强密钥，合理设置过期时间
4. **密码策略**: 数据库密码使用强随机字符串

### 数据安全

1. **定期备份**: 自动化数据库和文件备份
2. **备份加密**: 敏感数据备份加密存储
3. **访问控制**: 管理端点 IP 白名单限制
4. **审计日志**: 记录关键操作和访问

## 🔄 备份和恢复

### 自动备份

备份脚本会自动运行：
- **数据库备份**: 每日凌晨 2:00
- **文件备份**: 每日凌晨 3:00  
- **备份清理**: 保留最近 30 天

### 手动备份

```bash
# 创建完整备份
./scripts/manage-production.sh backup

# 仅备份数据库
docker exec pathfinder-postgres-primary pg_dump \
  -U pathfinder_app -d pathfinder_db > backup_$(date +%Y%m%d).sql
```

### 恢复数据

```bash
# 从备份文件恢复
./scripts/manage-production.sh restore backup_file.sql

# 手动恢复数据库
cat backup_file.sql | docker exec -i pathfinder-postgres-primary \
  psql -U pathfinder_app -d pathfinder_db
```

## 🚨 故障排除

### 常见问题

1. **服务启动失败**
   ```bash
   # 查看详细错误日志
   docker-compose -f docker-compose.prod.yml logs [service_name]
   
   # 检查配置文件
   docker-compose -f docker-compose.prod.yml config
   ```

2. **SSL 证书申请失败**
   ```bash
   # 检查域名 DNS 解析
   nslookup your-domain.com
   
   # 手动申请证书
   docker-compose -f docker-compose.prod.yml run --rm certbot \
     certonly --webroot --webroot-path=/var/www/certbot \
     --email your-email@domain.com --agree-tos \
     -d your-domain.com
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker ps | grep postgres
   
   # 测试数据库连接
   docker exec pathfinder-postgres-primary \
     pg_isready -U pathfinder_app -d pathfinder_db
   ```

4. **内存不足**
   ```bash
   # 查看内存使用
   docker stats
   
   # 重启内存使用过多的服务
   ./scripts/manage-production.sh restart backend
   ```

### 性能优化

1. **数据库优化**
   - 定期执行 `VACUUM ANALYZE`
   - 优化查询索引
   - 调整连接池大小

2. **缓存优化**
   - 增加 Redis 内存限制
   - 配置 Nginx 静态文件缓存
   - 使用 CDN 加速静态资源

3. **应用优化**
   - 调整 PM2 集群实例数
   - 优化 Node.js 内存设置
   - 启用 Gzip 压缩

## 📈 扩展和升级

### 水平扩展

```bash
# 添加更多后端实例
./scripts/manage-production.sh scale backend 5

# 添加数据库读副本（需要配置主从复制）
# 参考 PostgreSQL 官方文档配置流复制
```

### 版本升级

```bash
# 1. 创建备份
./scripts/manage-production.sh backup

# 2. 拉取最新代码
git pull origin main

# 3. 重新部署
./scripts/deploy-production.sh v1.1.0

# 4. 验证服务
./scripts/manage-production.sh health
```

### 迁移到新服务器

1. 在新服务器上安装 Docker 和依赖
2. 复制项目代码和配置文件
3. 创建数据备份并传输到新服务器
4. 执行部署脚本
5. 恢复数据备份
6. 更新 DNS 记录指向新服务器

## 📞 支持和维护

### 联系方式

- **技术支持**: support@pathfinder.com
- **文档中心**: https://docs.pathfinder.com
- **问题反馈**: https://github.com/pathfinder/pathfinder/issues

### 维护计划

- **定期更新**: 每月第一个周日进行系统更新
- **安全补丁**: 发现安全问题后 24 小时内修复
- **性能调优**: 每季度进行一次性能评估和优化
- **备份验证**: 每月验证一次备份数据完整性

---

**注意**: 本指南适用于 Pathfinder v1.0+ 版本。如遇到问题或需要帮助，请联系技术支持团队。