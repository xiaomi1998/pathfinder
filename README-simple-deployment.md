# Pathfinder 简化部署指南

这是一个适合中小规模Linux服务器部署的简化Docker Compose配置，去除了复杂的监控、日志收集和SSL证书自动化等功能，保持简单实用。

## 服务组件

- **PostgreSQL**: 数据库服务 (端口: 5432)
- **Redis**: 缓存服务 (端口: 6379)  
- **Backend**: Node.js后端服务 (端口: 3000)
- **Frontend**: Vue.js前端服务 (端口: 8080)
- **Nginx**: 反向代理服务 (端口: 80, 443)

## 快速开始

### 1. 环境准备

确保服务器已安装：
- Docker (版本 20.10+)
- Docker Compose (版本 1.29+)

```bash
# 安装 Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 启动服务

```bash
# 使用管理脚本启动（推荐）
./start-simple.sh start

# 或者直接使用 docker-compose
docker-compose -f docker-compose.simple.yml up -d
```

### 3. 访问应用

- **前端应用**: http://your-server-ip
- **API接口**: http://your-server-ip/api
- **直接前端**: http://your-server-ip:8080
- **直接后端**: http://your-server-ip:3000

### 4. 管理服务

```bash
# 查看服务状态
./start-simple.sh status

# 查看日志
./start-simple.sh logs

# 查看特定服务日志
./start-simple.sh logs backend

# 重启服务
./start-simple.sh restart

# 停止服务
./start-simple.sh stop

# 清理所有数据（谨慎操作）
./start-simple.sh cleanup
```

## 配置说明

### 环境变量

复制并编辑环境变量文件：
```bash
cp .env.simple .env
nano .env
```

**重要**: 生产环境中务必修改以下配置：
- `POSTGRES_PASSWORD`: 数据库密码
- `REDIS_PASSWORD`: Redis密码  
- `JWT_SECRET`: JWT密钥
- `CORS_ORIGIN`: 允许的跨域源

### 数据持久化

数据存储在以下目录：
- PostgreSQL数据: `./data/postgres`
- Redis数据: `./data/redis`

### 健康检查

所有服务都配置了健康检查：
- 数据库服务启动后自动等待就绪
- 后端服务依赖数据库健康状态
- 前端服务依赖后端服务
- Nginx配置验证

## 网络架构

```
Internet -> Nginx (80/443) -> Frontend (8080) / Backend (3000)
                             Backend -> PostgreSQL (5432)
                             Backend -> Redis (6379)
```

## 故障排除

### 1. 服务启动失败

```bash
# 查看详细日志
docker-compose -f docker-compose.simple.yml logs [service-name]

# 检查服务状态
docker-compose -f docker-compose.simple.yml ps
```

### 2. 数据库连接问题

```bash
# 检查数据库状态
docker-compose -f docker-compose.simple.yml exec postgres pg_isready -U pathfinder_user

# 连接到数据库
docker-compose -f docker-compose.simple.yml exec postgres psql -U pathfinder_user -d pathfinder
```

### 3. 端口冲突

如果端口被占用，修改 `docker-compose.simple.yml` 中的端口映射：
```yaml
ports:
  - "8080:80"  # 将80改为8080
```

### 4. 权限问题

```bash
# 修复数据目录权限
sudo chown -R 999:999 data/postgres
sudo chown -R 999:999 data/redis
```

## 备份与恢复

### 数据库备份

```bash
# 创建备份
docker-compose -f docker-compose.simple.yml exec postgres pg_dump -U pathfinder_user pathfinder > backup.sql

# 恢复备份
docker-compose -f docker-compose.simple.yml exec -T postgres psql -U pathfinder_user pathfinder < backup.sql
```

### 数据目录备份

```bash
# 停止服务
./start-simple.sh stop

# 备份数据目录
tar -czf pathfinder-data-backup-$(date +%Y%m%d).tar.gz data/

# 恢复数据目录
tar -xzf pathfinder-data-backup-YYYYMMDD.tar.gz
```

## 安全建议

1. **修改默认密码**: 更改所有默认密码和密钥
2. **防火墙配置**: 只开放必要的端口（80, 443）
3. **SSL证书**: 生产环境建议配置HTTPS
4. **定期更新**: 定期更新Docker镜像和依赖
5. **备份策略**: 建立定期数据备份机制

## 生产环境优化

1. **资源限制**: 为容器设置内存和CPU限制
2. **日志管理**: 配置日志轮转防止磁盘占满
3. **监控告警**: 添加基础的健康检查和告警
4. **负载均衡**: 如需高可用可配置多个后端实例

## 支持

如遇问题请检查：
1. Docker和Docker Compose版本
2. 服务器资源使用情况
3. 网络连接状态
4. 日志文件内容

## 版本说明

- 适用于: 中小规模部署（单服务器）
- 并发用户: < 1000
- 数据量: < 10GB
- 维护复杂度: 低