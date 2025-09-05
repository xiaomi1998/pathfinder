# Docker 镜像迁移指南

本指南提供了 Pathfinder 项目 Docker 镜像的完整迁移方案，涵盖多种传输方式和最佳实践。

## 项目概述

Pathfinder 项目包含以下 Docker 服务：
- **Frontend**: Vue.js + Nginx (基于 nginx:1.24-alpine)
- **Backend**: Node.js API (基于 node:18-alpine)
- **PostgreSQL**: 数据库 (postgres:14-alpine)
- **Redis**: 缓存服务 (redis:7-alpine)
- **Nginx**: 反向代理
- **监控服务**: Prometheus + Grafana

---

## 1. 本地构建方案

### 1.1 直接在目标服务器构建

**优点**: 简单直接，无需传输镜像
**缺点**: 需要在目标服务器安装构建依赖，构建时间长

```bash
# 1. 传输项目代码到目标服务器
scp -r /Users/kechen/Desktop/Pathfinder user@target-server:/opt/

# 2. 在目标服务器构建镜像
ssh user@target-server
cd /opt/Pathfinder

# 构建所有服务
docker-compose build

# 或单独构建服务
docker build -f Dockerfile.backend -t pathfinder-backend:latest .
docker build -f Dockerfile.frontend -t pathfinder-frontend:latest .
```

### 1.2 构建脚本优化

```bash
#!/bin/bash
# build-optimized.sh - 优化构建脚本

set -e

# 设置构建参数
BUILD_ARGS="--no-cache --pull"
TAG_PREFIX="pathfinder"
VERSION="${1:-latest}"

echo "🚀 开始构建 Pathfinder 镜像 (版本: $VERSION)"

# 并行构建后端和前端
{
    echo "📦 构建后端镜像..."
    docker build $BUILD_ARGS \
        -f Dockerfile.backend \
        -t ${TAG_PREFIX}-backend:${VERSION} \
        --target production .
} &

{
    echo "🎨 构建前端镜像..."
    docker build $BUILD_ARGS \
        -f Dockerfile.frontend \
        -t ${TAG_PREFIX}-frontend:${VERSION} .
} &

# 等待构建完成
wait

echo "✅ 所有镜像构建完成"

# 列出构建的镜像
docker images | grep pathfinder
```

---

## 2. 镜像导出导入方案

### 2.1 单镜像导出导入

```bash
# === 在源服务器上导出 ===

# 导出后端镜像
docker save pathfinder-backend:latest | gzip > pathfinder-backend.tar.gz

# 导出前端镜像
docker save pathfinder-frontend:latest | gzip > pathfinder-frontend.tar.gz

# 导出基础镜像（可选）
docker save postgres:14-alpine redis:7-alpine nginx:1.24-alpine | gzip > base-images.tar.gz

# === 传输到目标服务器 ===
scp pathfinder-*.tar.gz user@target-server:/tmp/

# === 在目标服务器上导入 ===
ssh user@target-server

# 导入镜像
gunzip -c /tmp/pathfinder-backend.tar.gz | docker load
gunzip -c /tmp/pathfinder-frontend.tar.gz | docker load
gunzip -c /tmp/base-images.tar.gz | docker load

# 验证导入
docker images | grep pathfinder
```

### 2.2 批量导出导入脚本

```bash
#!/bin/bash
# export-images.sh - 批量导出脚本

IMAGES=(
    "pathfinder-backend:latest"
    "pathfinder-frontend:latest"
    "postgres:14-alpine"
    "redis:7-alpine"
    "nginx:1.24-alpine"
)

OUTPUT_DIR="./docker-images"
mkdir -p $OUTPUT_DIR

echo "📦 开始导出镜像..."

for image in "${IMAGES[@]}"; do
    filename=$(echo $image | tr '/:' '-')
    echo "导出 $image -> ${filename}.tar.gz"
    docker save $image | gzip > "${OUTPUT_DIR}/${filename}.tar.gz"
done

echo "✅ 导出完成，文件列表:"
ls -lh $OUTPUT_DIR/
```

```bash
#!/bin/bash
# import-images.sh - 批量导入脚本

IMAGE_DIR="${1:-./docker-images}"

if [ ! -d "$IMAGE_DIR" ]; then
    echo "❌ 镜像目录 $IMAGE_DIR 不存在"
    exit 1
fi

echo "📥 开始导入镜像..."

for file in $IMAGE_DIR/*.tar.gz; do
    if [ -f "$file" ]; then
        echo "导入 $(basename $file)"
        gunzip -c "$file" | docker load
    fi
done

echo "✅ 导入完成"
docker images | grep -E "(pathfinder|postgres|redis|nginx)"
```

---

## 3. 私有仓库方案

### 3.1 Docker Hub 方案

```bash
# === 推送到 Docker Hub ===

# 1. 登录 Docker Hub
docker login

# 2. 标记镜像
docker tag pathfinder-backend:latest username/pathfinder-backend:latest
docker tag pathfinder-frontend:latest username/pathfinder-frontend:latest

# 3. 推送镜像
docker push username/pathfinder-backend:latest
docker push username/pathfinder-frontend:latest

# === 在目标服务器拉取 ===
docker pull username/pathfinder-backend:latest
docker pull username/pathfinder-frontend:latest

# 重新标记为本地标签
docker tag username/pathfinder-backend:latest pathfinder-backend:latest
docker tag username/pathfinder-frontend:latest pathfinder-frontend:latest
```

### 3.2 私有 Registry 方案

```bash
# === 搭建私有 Registry ===

# 1. 启动私有仓库
docker run -d \
    --name registry \
    --restart=always \
    -p 5000:5000 \
    -v registry-data:/var/lib/registry \
    registry:2

# === 推送镜像 ===

# 1. 标记镜像
docker tag pathfinder-backend:latest localhost:5000/pathfinder-backend:latest
docker tag pathfinder-frontend:latest localhost:5000/pathfinder-frontend:latest

# 2. 推送镜像
docker push localhost:5000/pathfinder-backend:latest
docker push localhost:5000/pathfinder-frontend:latest

# === 目标服务器配置 ===

# 1. 配置不安全仓库（如果使用 HTTP）
echo '{"insecure-registries":["registry-server:5000"]}' > /etc/docker/daemon.json
systemctl restart docker

# 2. 拉取镜像
docker pull registry-server:5000/pathfinder-backend:latest
docker pull registry-server:5000/pathfinder-frontend:latest
```

### 3.3 自动化推送脚本

```bash
#!/bin/bash
# push-to-registry.sh - 自动推送脚本

REGISTRY="${1:-localhost:5000}"
PROJECT="pathfinder"
VERSION="${2:-latest}"

IMAGES=(
    "pathfinder-backend"
    "pathfinder-frontend"
)

echo "🚀 推送镜像到仓库: $REGISTRY"

for image in "${IMAGES[@]}"; do
    local_tag="${image}:${VERSION}"
    remote_tag="${REGISTRY}/${PROJECT}/${image}:${VERSION}"
    
    echo "📤 推送 $local_tag -> $remote_tag"
    
    docker tag $local_tag $remote_tag
    docker push $remote_tag
    
    echo "✅ $image 推送完成"
done

echo "🎉 所有镜像推送完成"
```

---

## 4. 分层传输优化

### 4.1 利用镜像分层特性

```bash
# 分析镜像层
docker history pathfinder-backend:latest --no-trunc

# 查看镜像详细信息
docker inspect pathfinder-backend:latest

# 只传输变更层（增量传输）
docker save pathfinder-backend:latest | docker-squash | gzip > optimized-backend.tar.gz
```

### 4.2 使用 docker-slim 优化

```bash
# 安装 docker-slim
curl -sL https://raw.githubusercontent.com/docker-slim/docker-slim/master/scripts/install-dockerslim.sh | sudo -E bash -

# 优化镜像
docker-slim build pathfinder-backend:latest

# 对比优化效果
docker images | grep pathfinder-backend
```

### 4.3 多阶段构建优化

```dockerfile
# Dockerfile.backend 优化版本
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
RUN apk add --no-cache curl dumb-init
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

USER 1001
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## 5. 构建脚本集合

### 5.1 完整构建脚本

```bash
#!/bin/bash
# build-all.sh - 完整构建脚本

set -e

# 配置变量
PROJECT_NAME="pathfinder"
VERSION="${1:-$(date +%Y%m%d-%H%M%S)}"
REGISTRY="${2:-}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

# 检查 Docker 环境
log "检查 Docker 环境..."
docker --version || error "Docker 未安装"

# 清理旧镜像（可选）
read -p "是否清理旧镜像? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "清理旧镜像..."
    docker image prune -f
    docker system prune -f
fi

# 构建镜像
log "开始构建镜像 (版本: $VERSION)..."

# 后端
log "构建后端镜像..."
docker build \
    --no-cache \
    --pull \
    -f Dockerfile.backend \
    -t ${PROJECT_NAME}-backend:${VERSION} \
    -t ${PROJECT_NAME}-backend:latest .

# 前端
log "构建前端镜像..."
docker build \
    --no-cache \
    --pull \
    -f Dockerfile.frontend \
    -t ${PROJECT_NAME}-frontend:${VERSION} \
    -t ${PROJECT_NAME}-frontend:latest .

# 验证镜像
log "验证镜像..."
docker images | grep pathfinder

# 推送到仓库（如果指定）
if [ -n "$REGISTRY" ]; then
    log "推送镜像到 $REGISTRY..."
    
    docker tag ${PROJECT_NAME}-backend:${VERSION} ${REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker tag ${PROJECT_NAME}-frontend:${VERSION} ${REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    docker push ${REGISTRY}/${PROJECT_NAME}-backend:${VERSION}
    docker push ${REGISTRY}/${PROJECT_NAME}-frontend:${VERSION}
    
    log "镜像推送完成"
fi

log "✅ 构建完成！"
log "后端镜像: ${PROJECT_NAME}-backend:${VERSION}"
log "前端镜像: ${PROJECT_NAME}-frontend:${VERSION}"
```

### 5.2 标记和清理脚本

```bash
#!/bin/bash
# tag-and-clean.sh - 标记和清理脚本

VERSION="${1:-latest}"
KEEP_VERSIONS="${2:-5}"

log() {
    echo "[$(date +'%H:%M:%S')] $1"
}

# 创建版本标记
log "创建版本标记..."
docker tag pathfinder-backend:latest pathfinder-backend:$VERSION
docker tag pathfinder-frontend:latest pathfinder-frontend:$VERSION

# 清理旧版本（保留最新的几个）
log "清理旧版本镜像（保留最新 $KEEP_VERSIONS 个）..."

# 获取所有版本标记
BACKEND_TAGS=$(docker images pathfinder-backend --format "table {{.Tag}}" | grep -v latest | grep -v TAG | sort -V | tail -n +$((KEEP_VERSIONS+1)))
FRONTEND_TAGS=$(docker images pathfinder-frontend --format "table {{.Tag}}" | grep -v latest | grep -v TAG | sort -V | tail -n +$((KEEP_VERSIONS+1)))

# 删除旧版本
for tag in $BACKEND_TAGS; do
    log "删除旧版本: pathfinder-backend:$tag"
    docker rmi pathfinder-backend:$tag
done

for tag in $FRONTEND_TAGS; do
    log "删除旧版本: pathfinder-frontend:$tag"
    docker rmi pathfinder-frontend:$tag
done

# 清理未使用的镜像
log "清理未使用的镜像..."
docker image prune -f

log "✅ 清理完成"
```

---

## 6. 多架构支持

### 6.1 使用 docker buildx

```bash
# 创建多架构构建器
docker buildx create --name multiarch-builder --use

# 构建多架构镜像
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -f Dockerfile.backend \
    -t pathfinder-backend:latest \
    --push .

# 验证多架构支持
docker buildx imagetools inspect pathfinder-backend:latest
```

### 6.2 多架构构建脚本

```bash
#!/bin/bash
# build-multiarch.sh - 多架构构建脚本

PLATFORMS="linux/amd64,linux/arm64"
REGISTRY="${1:-localhost:5000}"
PROJECT="pathfinder"
VERSION="${2:-latest}"

# 设置构建器
docker buildx create --name multiarch --use 2>/dev/null || true

log() {
    echo "🚀 [$(date +'%H:%M:%S')] $1"
}

# 构建并推送多架构镜像
log "构建多架构后端镜像..."
docker buildx build \
    --platform $PLATFORMS \
    -f Dockerfile.backend \
    -t ${REGISTRY}/${PROJECT}-backend:${VERSION} \
    --push .

log "构建多架构前端镜像..."
docker buildx build \
    --platform $PLATFORMS \
    -f Dockerfile.frontend \
    -t ${REGISTRY}/${PROJECT}-frontend:${VERSION} \
    --push .

# 验证构建结果
log "验证多架构镜像..."
docker buildx imagetools inspect ${REGISTRY}/${PROJECT}-backend:${VERSION}
docker buildx imagetools inspect ${REGISTRY}/${PROJECT}-frontend:${VERSION}

log "✅ 多架构构建完成"
```

---

## 7. 镜像优化技巧

### 7.1 减小镜像体积

```dockerfile
# 优化技巧示例
FROM node:18-alpine AS base
# 使用 alpine 基础镜像

# 合并 RUN 命令
RUN apk add --no-cache curl \
    && npm install --production \
    && npm cache clean --force \
    && rm -rf /tmp/*

# 使用 .dockerignore
echo "
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
coverage
.nyc_output
" > .dockerignore
```

### 7.2 缓存优化

```dockerfile
# 优化缓存层级
FROM node:18-alpine

WORKDIR /app

# 首先复制依赖文件（缓存层）
COPY package*.json ./
RUN npm ci --only=production

# 然后复制源代码
COPY . .

# 最后构建
RUN npm run build
```

### 7.3 安全加固

```dockerfile
FROM node:18-alpine

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S pathfinder -u 1001

# 设置目录权限
WORKDIR /app
RUN chown -R pathfinder:nodejs /app

# 切换到非特权用户
USER pathfinder

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

---

## 8. 传输方法对比分析

| 方案 | 适用场景 | 优点 | 缺点 | 传输时间 | 复杂度 |
|------|----------|------|------|----------|--------|
| **本地构建** | 开发/测试环境 | 简单直接 | 需要构建环境，时间长 | N/A | 低 |
| **镜像导出** | 内网部署 | 离线传输，完整镜像 | 文件大，传输慢 | 高 | 中 |
| **Docker Hub** | 公网部署 | 方便快捷，支持多架构 | 需要网络，公开仓库 | 中 | 低 |
| **私有仓库** | 企业部署 | 安全可控，支持版本管理 | 需要维护仓库 | 中 | 中 |
| **分层传输** | 频繁更新 | 增量传输，节省带宽 | 实现复杂 | 低 | 高 |

### 8.1 推荐方案选择

**开发环境**:
```bash
# 推荐：本地构建
docker-compose up --build
```

**测试环境**:
```bash
# 推荐：私有仓库
./build-and-push.sh test-registry:5000 v1.0.0-rc
```

**生产环境**:
```bash
# 推荐：Docker Hub + 版本标签
docker pull pathfinder/backend:v1.0.0
docker pull pathfinder/frontend:v1.0.0
```

**内网部署**:
```bash
# 推荐：镜像导出
./export-images.sh
scp docker-images/* user@target:/tmp/
ssh user@target ./import-images.sh /tmp
```

---

## 9. 最佳实践建议

### 9.1 版本管理

```bash
# 使用语义化版本
docker build -t pathfinder-backend:v1.2.3 .
docker build -t pathfinder-backend:latest .

# 使用 Git 提交哈希
GIT_HASH=$(git rev-parse --short HEAD)
docker build -t pathfinder-backend:$GIT_HASH .
```

### 9.2 自动化部署

```yaml
# .github/workflows/docker.yml
name: Build and Push Docker Images

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        file: ./Dockerfile.backend
        platforms: linux/amd64,linux/arm64
        push: true
        tags: pathfinder/backend:latest
```

### 9.3 安全检查

```bash
#!/bin/bash
# security-scan.sh - 安全扫描脚本

IMAGES=(
    "pathfinder-backend:latest"
    "pathfinder-frontend:latest"
)

# 使用 Trivy 扫描镜像漏洞
for image in "${IMAGES[@]}"; do
    echo "🔍 扫描 $image..."
    trivy image $image
done

# 检查镜像配置
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
    aquasec/docker-bench-security
```

### 9.4 监控和日志

```bash
# 监控镜像大小变化
docker images pathfinder* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 查看镜像历史
docker history pathfinder-backend:latest

# 导出镜像清单
docker save pathfinder-backend:latest | tar tv > image-manifest.txt
```

---

## 10. 故障排除

### 10.1 常见问题

**问题 1**: 镜像构建失败
```bash
# 解决方案
docker system prune -a  # 清理构建缓存
docker build --no-cache  # 不使用缓存构建
```

**问题 2**: 推送镜像失败
```bash
# 检查登录状态
docker login
# 检查镜像标签
docker images | grep pathfinder
```

**问题 3**: 导入镜像失败
```bash
# 检查文件完整性
file pathfinder-backend.tar.gz
# 验证压缩文件
gunzip -t pathfinder-backend.tar.gz
```

### 10.2 性能调优

```bash
# 并行构建
docker build --parallel .

# 使用构建缓存
export DOCKER_BUILDKIT=1
docker build .

# 调整 Docker 守护进程配置
cat > /etc/docker/daemon.json << EOF
{
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10,
  "storage-driver": "overlay2"
}
EOF
```

---

## 总结

本指南提供了完整的 Docker 镜像迁移解决方案，涵盖了从开发到生产的各种场景。根据具体需求选择合适的迁移方案：

1. **快速开发**: 使用本地构建方案
2. **团队协作**: 使用私有仓库方案  
3. **生产部署**: 使用 Docker Hub 或企业级镜像仓库
4. **内网环境**: 使用镜像导出导入方案
5. **持续集成**: 结合多架构构建和自动化流水线

选择合适的方案并结合本指南的最佳实践，可以确保 Docker 镜像的高效、安全迁移。