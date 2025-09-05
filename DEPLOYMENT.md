# 🚢 Pathfinder 部署指南

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=flat&logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

## 📋 概述

本文档详细说明了如何将 Pathfinder 应用部署到不同的环境，包括开发环境、测试环境、生产环境以及各种云平台。

## 🎯 部署架构

### 系统组件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │     Frontend    │    │     Backend     │
│    (Nginx)      │◄──►│   (Vue.js)      │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐              │
                       │     Redis       │◄─────────────┤
                       │    (Cache)      │              │
                       └─────────────────┘              │
                                                        │
                       ┌─────────────────┐              │
                       │   PostgreSQL    │◄─────────────┘
                       │   (Database)    │
                       └─────────────────┘
```

### 环境要求

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 2 vCPU | 4 vCPU |
| 内存 | 4GB RAM | 8GB RAM |
| 存储 | 20GB SSD | 50GB SSD |
| 网络 | 100Mbps | 1Gbps |

## 🏠 本地开发环境

### 使用 Docker Compose (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/pathfinder/pathfinder.git
cd pathfinder

# 2. 一键启动
./setup.sh

# 3. 启动开发环境
./dev.sh

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:3001
# 数据库管理: cd backend && npm run db:studio
```

### 手动启动

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置环境变量
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. 启动数据库
docker-compose -f docker-compose.dev.yml up -d db redis

# 4. 初始化数据库
cd backend
npm run db:push
npm run db:seed

# 5. 启动服务
npm run dev &
cd ../frontend && npm run dev &
```

## 🧪 测试环境部署

### 自动化部署脚本

创建测试环境部署脚本：

```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "🚀 部署到测试环境..."

# 1. 构建应用
./build.sh --skip-docker

# 2. 部署到测试服务器
rsync -avz --exclude node_modules dist/ staging@staging.pathfinder.com:/var/www/pathfinder/

# 3. 重启服务
ssh staging@staging.pathfinder.com << 'EOF'
cd /var/www/pathfinder
docker-compose -f docker-compose.staging.yml up -d --build
EOF

echo "✅ 测试环境部署完成"
echo "🌐 访问地址: https://staging.pathfinder.com"
```

### Docker Compose 配置

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      - NODE_ENV=staging
      - VITE_API_BASE_URL=https://api-staging.pathfinder.com
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://user:pass@db:5432/pathfinder_staging
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - db
      - redis

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=pathfinder_staging
      - POSTGRES_USER=pathfinder
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_staging_data:/data

volumes:
  postgres_staging_data:
  redis_staging_data:
```

## 🏭 生产环境部署

### 生产环境要求

- **高可用性**: 多实例部署，负载均衡
- **数据安全**: 数据库备份，SSL加密
- **监控告警**: 性能监控，错误追踪
- **日志管理**: 集中化日志收集

### 使用 Docker Compose

```bash
# 1. 准备生产配置
cp .env.example .env.production
# 编辑配置文件，设置生产环境变量

# 2. 构建生产镜像
./build.sh --tag=v1.0.0

# 3. 启动生产服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 验证部署
curl -f http://localhost/api/health
```

### 生产环境 Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:1.24-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - nginx_logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  frontend:
    image: pathfinder/pathfinder-frontend:v1.0.0
    environment:
      - NODE_ENV=production
    volumes:
      - frontend_logs:/var/log/app
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  backend:
    image: pathfinder/pathfinder-backend:v1.0.0
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - AI_API_KEY=${AI_API_KEY}
    volumes:
      - backend_logs:/var/log/app
      - uploads:/app/uploads
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 1GB

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/var/backups
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2GB

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  nginx_logs:
  frontend_logs:
  backend_logs:
  uploads:
```

### Nginx 配置

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    # 基本设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/javascript
        application/json
        text/css
        text/javascript
        text/xml
        text/plain
        application/xml+rss;

    # 限制上传大小
    client_max_body_size 10M;

    # 前端应用
    server {
        listen 80;
        server_name pathfinder.com www.pathfinder.com;

        # HTTPS 重定向
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name pathfinder.com www.pathfinder.com;

        # SSL 配置
        ssl_certificate /etc/nginx/ssl/pathfinder.crt;
        ssl_certificate_key /etc/nginx/ssl/pathfinder.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers on;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # 前端静态文件
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API 代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket 支持
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }

    # 后端负载均衡
    upstream backend {
        server backend:3001;
        # 多实例时添加更多服务器
        # server backend-2:3001;
        # server backend-3:3001;
    }

    upstream frontend {
        server frontend:80;
        # 多实例时添加更多服务器
        # server frontend-2:80;
    }
}
```

## ☁️ 云平台部署

### AWS 部署

#### 使用 ECS (Elastic Container Service)

```yaml
# aws-ecs-task-definition.json
{
  "family": "pathfinder",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "pathfinder-backend",
      "image": "your-repo/pathfinder-backend:v1.0.0",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/pathfinder"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pathfinder",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### 部署脚本

```bash
#!/bin/bash
# deploy-aws.sh

# 构建并推送镜像
./build.sh --tag=v1.0.0 --push

# 注册任务定义
aws ecs register-task-definition \
  --cli-input-json file://aws-ecs-task-definition.json

# 更新服务
aws ecs update-service \
  --cluster pathfinder-cluster \
  --service pathfinder-service \
  --task-definition pathfinder:1

echo "✅ AWS ECS 部署完成"
```

### Google Cloud 部署

#### 使用 Cloud Run

```yaml
# cloudbuild.yaml
steps:
  # 构建后端镜像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/pathfinder-backend', '-f', 'Dockerfile.backend', '.']
  
  # 推送镜像
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/pathfinder-backend']
  
  # 部署到 Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'pathfinder-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/pathfinder-backend'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/pathfinder-backend'
```

### Azure 部署

#### 使用 Container Instances

```yaml
# azure-container-group.yaml
apiVersion: '2019-12-01'
location: eastus
name: pathfinder
properties:
  containers:
  - name: pathfinder-backend
    properties:
      image: pathfinder/pathfinder-backend:v1.0.0
      resources:
        requests:
          cpu: 1.0
          memoryInGB: 2.0
      ports:
      - port: 3001
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: DATABASE_URL
        secureValue: postgresql://user:pass@db:5432/pathfinder
  
  - name: pathfinder-frontend
    properties:
      image: pathfinder/pathfinder-frontend:v1.0.0
      resources:
        requests:
          cpu: 0.5
          memoryInGB: 1.0
      ports:
      - port: 80
        protocol: TCP
  
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 3001
tags: {}
type: Microsoft.ContainerInstance/containerGroups
```

## 🎛️ Kubernetes 部署

### Helm Chart

```yaml
# charts/pathfinder/values.yaml
replicaCount: 3

image:
  repository: pathfinder/pathfinder-backend
  tag: v1.0.0
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 3001

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.pathfinder.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: pathfinder-tls
      hosts:
        - api.pathfinder.com

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

postgresql:
  enabled: true
  auth:
    database: pathfinder
    username: pathfinder
    password: secure-password
  persistence:
    size: 20Gi

redis:
  enabled: true
  auth:
    password: redis-password
  persistence:
    size: 10Gi
```

### 部署命令

```bash
# 安装 Helm Chart
helm install pathfinder ./charts/pathfinder \
  --namespace pathfinder \
  --create-namespace \
  --values values.prod.yaml

# 升级部署
helm upgrade pathfinder ./charts/pathfinder \
  --namespace pathfinder \
  --values values.prod.yaml

# 查看状态
kubectl get pods -n pathfinder
```

## 📊 监控和告警

### Prometheus 配置

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'pathfinder-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 10s

  - job_name: 'pathfinder-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 告警规则

```yaml
# monitoring/alert_rules.yml
groups:
  - name: pathfinder.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"
          description: "Database has {{ $value }} active connections"
```

### Grafana 仪表板

```json
{
  "dashboard": {
    "title": "Pathfinder Metrics",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

## 🔐 安全配置

### SSL/TLS 证书

```bash
# 使用 Let's Encrypt 获取免费证书
certbot certonly --webroot \
  -w /var/www/certbot \
  -d pathfinder.com \
  -d www.pathfinder.com \
  --email admin@pathfinder.com \
  --agree-tos \
  --no-eff-email

# 自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### 安全加固脚本

```bash
#!/bin/bash
# security/security-hardening.sh

echo "🔒 执行安全加固..."

# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装安全工具
apt install -y fail2ban ufw

# 3. 配置防火墙
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# 4. 配置 fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# 5. 设置文件权限
chmod 600 /etc/ssl/private/*
chmod 644 /etc/ssl/certs/*

echo "✅ 安全加固完成"
```

## 📋 部署检查清单

### 部署前检查

- [ ] 环境变量配置完整
- [ ] SSL 证书已配置
- [ ] 数据库备份已设置
- [ ] 监控和告警已配置
- [ ] 日志收集已设置
- [ ] 安全策略已实施

### 部署后验证

```bash
#!/bin/bash
# scripts/deployment-check.sh

echo "🔍 执行部署后检查..."

# 1. 健康检查
echo "检查应用健康状态..."
curl -f http://localhost/api/health || exit 1

# 2. 数据库连接
echo "检查数据库连接..."
docker exec pathfinder-db pg_isready -U pathfinder || exit 1

# 3. Redis 连接
echo "检查 Redis 连接..."
docker exec pathfinder-redis redis-cli ping || exit 1

# 4. SSL 证书
echo "检查 SSL 证书..."
curl -f https://pathfinder.com/api/health || exit 1

# 5. 日志检查
echo "检查错误日志..."
if grep -q "ERROR" logs/*.log; then
    echo "⚠️  发现错误日志，请检查"
    grep "ERROR" logs/*.log | tail -5
fi

echo "✅ 部署验证完成"
```

## 🔄 回滚策略

### 自动回滚脚本

```bash
#!/bin/bash
# scripts/rollback.sh

VERSION_TO_ROLLBACK=${1:-previous}

echo "🔄 执行回滚到版本: $VERSION_TO_ROLLBACK"

# 1. 停止当前服务
docker-compose down

# 2. 切换到指定版本
git checkout $VERSION_TO_ROLLBACK

# 3. 重新部署
./build.sh --tag=$VERSION_TO_ROLLBACK
docker-compose up -d

# 4. 验证回滚
sleep 30
curl -f http://localhost/api/health

echo "✅ 回滚完成"
```

### 数据库回滚

```bash
#!/bin/bash
# scripts/rollback-database.sh

BACKUP_FILE=${1:-latest}

echo "🗄️ 执行数据库回滚..."

# 1. 停止应用
docker-compose stop backend

# 2. 恢复数据库
docker exec pathfinder-db psql -U pathfinder -c "DROP DATABASE IF EXISTS pathfinder;"
docker exec pathfinder-db psql -U pathfinder -c "CREATE DATABASE pathfinder;"
docker exec -i pathfinder-db psql -U pathfinder pathfinder < backups/$BACKUP_FILE.sql

# 3. 重启应用
docker-compose start backend

echo "✅ 数据库回滚完成"
```

## 🚨 故障排除

### 常见问题

#### 1. 应用启动失败

```bash
# 检查日志
docker logs pathfinder-backend
docker logs pathfinder-frontend

# 检查配置
docker exec pathfinder-backend env | grep -E "(DATABASE|REDIS|JWT)"

# 检查网络连接
docker exec pathfinder-backend curl -f http://localhost:3001/api/health
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker exec pathfinder-db pg_isready -U pathfinder

# 检查连接字符串
echo $DATABASE_URL

# 测试连接
docker exec pathfinder-db psql -U pathfinder -d pathfinder -c "SELECT version();"
```

#### 3. 性能问题

```bash
# 检查资源使用
docker stats

# 检查慢查询
docker exec pathfinder-db psql -U pathfinder -d pathfinder -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;"

# 检查 Redis 内存
docker exec pathfinder-redis redis-cli info memory
```

### 日志分析

```bash
# 实时查看日志
docker-compose logs -f

# 搜索错误日志
docker-compose logs | grep ERROR

# 分析访问日志
grep "POST /api/" logs/nginx-access.log | awk '{print $7}' | sort | uniq -c | sort -nr
```

## 📚 相关资源

### 文档链接

- [Docker 官方文档](https://docs.docker.com/)
- [Kubernetes 官方文档](https://kubernetes.io/docs/)
- [AWS ECS 文档](https://docs.aws.amazon.com/ecs/)
- [Nginx 配置指南](https://nginx.org/en/docs/)

### 工具推荐

- **部署工具**: Docker, Kubernetes, Helm
- **监控工具**: Prometheus, Grafana, ELK Stack
- **安全工具**: Let's Encrypt, fail2ban, OWASP ZAP
- **性能工具**: Artillery, k6, Apache Bench

### 支持联系

如果在部署过程中遇到问题：

- 📧 邮箱: devops@pathfinder.com
- 💬 Slack: #pathfinder-deployment
- 📱 紧急联系: +1-xxx-xxx-xxxx
- 🐛 问题报告: [GitHub Issues](https://github.com/pathfinder/pathfinder/issues)

---

**最后更新**: 2024年1月15日  
**文档版本**: v1.0  
**维护团队**: DevOps Team