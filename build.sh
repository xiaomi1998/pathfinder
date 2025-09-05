#!/bin/bash

# =================================================================
# Pathfinder 项目构建脚本
# 构建生产版本，包含优化、打包、Docker镜像构建等
# =================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 显示构建进度
show_progress() {
    local duration=$1
    local message="$2"
    local progress=0
    local width=40
    
    while [ $progress -le $duration ]; do
        local filled=$((progress * width / duration))
        local empty=$((width - filled))
        
        printf "\r${CYAN}[BUILD]${NC} $message ["
        printf "%${filled}s" | tr ' ' '='
        printf "%${empty}s" | tr ' ' ' '
        printf "] %d%%" $((progress * 100 / duration))
        
        sleep 1
        ((progress++))
    done
    echo ""
}

# 检查构建环境
check_build_environment() {
    log_step "1/7 检查构建环境"
    
    # 检查 Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    local node_version=$(node --version)
    log_success "Node.js 版本: $node_version"
    
    # 检查 npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm 未安装"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    log_success "npm 版本: $npm_version"
    
    # 检查 Docker（如果需要构建镜像）
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version)
        log_success "Docker 版本: $docker_version"
    else
        log_warning "Docker 未安装，将跳过镜像构建"
    fi
    
    # 检查磁盘空间
    local available_space=$(df -h . | awk 'NR==2{print $4}')
    log_info "可用磁盘空间: $available_space"
}

# 清理之前的构建
clean_build() {
    log_step "2/7 清理构建环境"
    
    log_info "清理之前的构建产物..."
    
    # 清理后端构建
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log_info "已清理后端构建目录"
    fi
    
    # 清理前端构建
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log_info "已清理前端构建目录"
    fi
    
    # 创建构建日志目录
    mkdir -p logs/build
    mkdir -p dist/{backend,frontend,docker}
    
    log_success "构建环境清理完成"
}

# 安装依赖
install_dependencies() {
    log_step "3/7 安装生产依赖"
    
    # 后端依赖
    log_info "安装后端生产依赖..."
    cd backend
    npm ci --only=production --silent
    log_success "后端依赖安装完成"
    cd ..
    
    # 前端依赖
    log_info "安装前端依赖..."
    cd frontend
    npm ci --silent
    log_success "前端依赖安装完成"
    cd ..
}

# 运行类型检查和代码检查
run_code_quality_checks() {
    log_step "4/7 代码质量检查"
    
    local quality_failed=false
    
    # 后端代码检查
    log_info "运行后端类型检查..."
    cd backend
    if ! npm run type-check 2>../logs/build/backend-typecheck.log; then
        log_error "后端类型检查失败"
        quality_failed=true
    else
        log_success "后端类型检查通过"
    fi
    
    # 后端 Lint 检查
    log_info "运行后端 Lint 检查..."
    if ! npm run lint 2>../logs/build/backend-lint.log; then
        log_warning "后端 Lint 检查有警告"
    else
        log_success "后端 Lint 检查通过"
    fi
    cd ..
    
    # 前端代码检查
    log_info "运行前端类型检查..."
    cd frontend
    if ! npm run type-check 2>../logs/build/frontend-typecheck.log; then
        log_error "前端类型检查失败"
        quality_failed=true
    else
        log_success "前端类型检查通过"
    fi
    
    # 前端 Lint 检查
    log_info "运行前端 Lint 检查..."
    if ! npm run lint 2>../logs/build/frontend-lint.log; then
        log_warning "前端 Lint 检查有警告"
    else
        log_success "前端 Lint 检查通过"
    fi
    cd ..
    
    if [ "$quality_failed" = true ]; then
        log_error "代码质量检查失败，请修复错误后重新构建"
        exit 1
    fi
}

# 构建后端
build_backend() {
    log_step "5/7 构建后端应用"
    
    cd backend
    
    # 生成 Prisma 客户端
    log_info "生成 Prisma 客户端..."
    npm run db:generate
    
    # TypeScript 编译
    log_info "编译 TypeScript 代码..."
    npm run build 2>&1 | tee ../logs/build/backend-build.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "后端构建失败"
        cd ..
        exit 1
    fi
    
    # 复制必要文件
    log_info "复制必要的生产文件..."
    cp package.json dist/
    cp package-lock.json dist/ 2>/dev/null || true
    cp -r prisma dist/ 2>/dev/null || true
    
    # 生成构建信息
    cat > dist/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "version": "$(npm pkg get version | tr -d '"')",
  "nodeVersion": "$(node --version)",
  "platform": "$(uname -s)"
}
EOF
    
    # 复制到总构建目录
    cp -r dist/* ../dist/backend/
    
    log_success "后端构建完成"
    cd ..
}

# 构建前端
build_frontend() {
    log_step "6/7 构建前端应用"
    
    cd frontend
    
    # 设置生产环境变量
    export NODE_ENV=production
    export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
    export VITE_GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    
    # 构建前端
    log_info "构建 Vue.js 应用..."
    npm run build 2>&1 | tee ../logs/build/frontend-build.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "前端构建失败"
        cd ..
        exit 1
    fi
    
    # 分析构建产物
    if [ -d "dist" ]; then
        local build_size=$(du -sh dist | cut -f1)
        log_info "前端构建产物大小: $build_size"
        
        # 列出主要文件
        log_info "主要构建文件:"
        find dist -name "*.js" -o -name "*.css" | head -10 | while read file; do
            local file_size=$(du -sh "$file" | cut -f1)
            log_info "  $(basename "$file"): $file_size"
        done
    fi
    
    # 复制到总构建目录
    cp -r dist/* ../dist/frontend/
    
    log_success "前端构建完成"
    cd ..
}

# 构建 Docker 镜像
build_docker_images() {
    log_step "7/7 构建 Docker 镜像"
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker 未安装，跳过镜像构建"
        return 0
    fi
    
    local build_docker=${BUILD_DOCKER:-true}
    local push_images=${PUSH_IMAGES:-false}
    local image_tag=${IMAGE_TAG:-latest}
    local registry=${REGISTRY:-pathfinder}
    
    if [ "$build_docker" != true ]; then
        log_info "跳过 Docker 镜像构建 (BUILD_DOCKER=false)"
        return 0
    fi
    
    # 构建后端镜像
    log_info "构建后端 Docker 镜像..."
    docker build \
        -t "${registry}/pathfinder-backend:${image_tag}" \
        -f Dockerfile.backend \
        . 2>&1 | tee logs/build/docker-backend.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "后端 Docker 镜像构建失败"
        return 1
    fi
    
    # 构建前端镜像
    log_info "构建前端 Docker 镜像..."
    docker build \
        -t "${registry}/pathfinder-frontend:${image_tag}" \
        -f Dockerfile.frontend \
        . 2>&1 | tee logs/build/docker-frontend.log
    
    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "前端 Docker 镜像构建失败"
        return 1
    fi
    
    # 镜像信息
    log_info "Docker 镜像构建完成:"
    docker images | grep pathfinder | head -5
    
    # 推送镜像（如果需要）
    if [ "$push_images" = true ]; then
        log_info "推送 Docker 镜像到仓库..."
        docker push "${registry}/pathfinder-backend:${image_tag}"
        docker push "${registry}/pathfinder-frontend:${image_tag}"
        log_success "镜像推送完成"
    fi
    
    log_success "Docker 镜像构建完成"
}

# 生成构建报告
generate_build_report() {
    log_info "生成构建报告..."
    
    local report_file="dist/build-report.html"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Pathfinder 构建报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .section { background: white; margin: 20px 0; padding: 20px; 
                   border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { border-left: 4px solid #28a745; }
        .info { border-left: 4px solid #007bff; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .stat-box { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #28a745; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .file-list { max-height: 300px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏗️ Pathfinder 构建报告</h1>
            <p>构建时间: $timestamp</p>
        </div>
        
        <div class="section success">
            <h2>✅ 构建摘要</h2>
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-value">$(date)</div>
                    <div>构建时间</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">$(du -sh dist/backend | cut -f1)</div>
                    <div>后端大小</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">$(du -sh dist/frontend | cut -f1)</div>
                    <div>前端大小</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">$(git rev-parse --short HEAD 2>/dev/null || echo "N/A")</div>
                    <div>Git Commit</div>
                </div>
            </div>
        </div>
EOF
    
    # 后端构建信息
    if [ -f "logs/build/backend-build.log" ]; then
        echo '<div class="section info">' >> "$report_file"
        echo '<h2>🔧 后端构建日志</h2>' >> "$report_file"
        echo '<pre>' >> "$report_file"
        tail -30 logs/build/backend-build.log >> "$report_file"
        echo '</pre>' >> "$report_file"
        echo '</div>' >> "$report_file"
    fi
    
    # 前端构建信息
    if [ -f "logs/build/frontend-build.log" ]; then
        echo '<div class="section info">' >> "$report_file"
        echo '<h2>🎨 前端构建日志</h2>' >> "$report_file"
        echo '<pre>' >> "$report_file"
        tail -30 logs/build/frontend-build.log >> "$report_file"
        echo '</pre>' >> "$report_file"
        echo '</div>' >> "$report_file"
    fi
    
    # 构建产物列表
    echo '<div class="section">' >> "$report_file"
    echo '<h2>📦 构建产物</h2>' >> "$report_file"
    echo '<div class="file-list">' >> "$report_file"
    echo '<h3>后端文件:</h3>' >> "$report_file"
    echo '<pre>' >> "$report_file"
    find dist/backend -type f | head -20 >> "$report_file"
    echo '</pre>' >> "$report_file"
    echo '<h3>前端文件:</h3>' >> "$report_file"
    echo '<pre>' >> "$report_file"
    find dist/frontend -type f | head -20 >> "$report_file"
    echo '</pre>' >> "$report_file"
    echo '</div>' >> "$report_file"
    echo '</div>' >> "$report_file"
    
    echo '</div></body></html>' >> "$report_file"
    
    log_success "构建报告已生成: $report_file"
}

# 显示构建结果
show_build_summary() {
    echo ""
    echo -e "${WHITE}=============================================${NC}"
    echo -e "${WHITE}  🎉 构建完成！${NC}"
    echo -e "${WHITE}=============================================${NC}"
    echo ""
    echo -e "${CYAN}📦 构建产物位置:${NC}"
    echo -e "   后端: ${YELLOW}dist/backend/${NC}"
    echo -e "   前端: ${YELLOW}dist/frontend/${NC}"
    echo -e "   报告: ${YELLOW}dist/build-report.html${NC}"
    echo ""
    echo -e "${CYAN}🐳 Docker 镜像:${NC}"
    if command -v docker >/dev/null 2>&1; then
        docker images | grep pathfinder | head -3
    else
        echo "   未构建 Docker 镜像"
    fi
    echo ""
    echo -e "${CYAN}📊 构建统计:${NC}"
    echo -e "   后端大小: ${GREEN}$(du -sh dist/backend 2>/dev/null | cut -f1 || echo "N/A")${NC}"
    echo -e "   前端大小: ${GREEN}$(du -sh dist/frontend 2>/dev/null | cut -f1 || echo "N/A")${NC}"
    echo -e "   总大小:   ${GREEN}$(du -sh dist 2>/dev/null | cut -f1 || echo "N/A")${NC}"
    echo ""
    echo -e "${CYAN}📋 下一步:${NC}"
    echo -e "   部署测试: ${YELLOW}docker-compose -f docker-compose.yml up${NC}"
    echo -e "   性能测试: ${YELLOW}./test.sh --e2e${NC}"
    echo ""
}

# 主函数
main() {
    local skip_tests=false
    local skip_docker=false
    local clean_only=false
    
    # 参数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-docker)
                BUILD_DOCKER=false
                shift
                ;;
            --push)
                PUSH_IMAGES=true
                shift
                ;;
            --clean-only)
                clean_only=true
                shift
                ;;
            --tag=*)
                IMAGE_TAG="${1#*=}"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo -e "${WHITE}=============================================${NC}"
    echo -e "${WHITE}  🏗️ Pathfinder 项目构建${NC}"
    echo -e "${WHITE}=============================================${NC}"
    echo ""
    
    # 记录构建开始时间
    local build_start_time=$(date +%s)
    
    # 执行构建步骤
    check_build_environment
    clean_build
    
    if [ "$clean_only" = true ]; then
        log_success "清理完成"
        exit 0
    fi
    
    install_dependencies
    
    if [ "$skip_tests" = false ]; then
        run_code_quality_checks
    fi
    
    build_backend
    build_frontend
    build_docker_images
    
    # 生成构建报告
    generate_build_report
    
    # 计算构建时间
    local build_end_time=$(date +%s)
    local build_duration=$((build_end_time - build_start_time))
    
    log_success "构建完成，耗时 ${build_duration} 秒"
    
    # 显示构建摘要
    show_build_summary
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --skip-tests      跳过代码质量检查"
    echo "  --skip-docker     跳过 Docker 镜像构建"
    echo "  --push           构建后推送 Docker 镜像"
    echo "  --clean-only     仅清理构建产物"
    echo "  --tag=<tag>      指定 Docker 镜像标签"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  BUILD_DOCKER     是否构建 Docker 镜像 (默认: true)"
    echo "  PUSH_IMAGES      是否推送镜像 (默认: false)"
    echo "  IMAGE_TAG        Docker 镜像标签 (默认: latest)"
    echo "  REGISTRY         Docker 仓库名 (默认: pathfinder)"
    echo ""
    echo "示例:"
    echo "  $0                      # 标准构建"
    echo "  $0 --skip-tests         # 跳过测试的快速构建"
    echo "  $0 --tag=v1.0.0 --push # 构建并推送带标签的镜像"
    echo ""
}

# 执行主函数
main "$@"