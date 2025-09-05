#!/bin/bash

# =================================================================
# Pathfinder 环境清理脚本
# 清理开发环境、构建产物、Docker资源等
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

# 确认操作函数
confirm_action() {
    local message="$1"
    local default="${2:-N}"
    
    echo -e "${YELLOW}$message${NC}"
    echo -n "确定要继续吗? (y/N): "
    read -n 1 confirmation
    echo
    
    case $confirmation in
        [yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# 停止所有服务
stop_all_services() {
    log_step "1/8 停止所有运行中的服务"
    
    # 停止 Docker Compose 服务
    log_info "停止 Docker Compose 服务..."
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml down --remove-orphans >/dev/null 2>&1 || true
        log_success "开发环境服务已停止"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose -f docker-compose.yml down --remove-orphans >/dev/null 2>&1 || true
        log_success "生产环境服务已停止"
    fi
    
    # 停止单独启动的开发服务器进程
    log_info "停止开发服务器进程..."
    
    # 查找并停止 Node.js 进程
    local node_pids=$(pgrep -f "node.*pathfinder" 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        echo "$node_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # 强制杀死仍在运行的进程
        echo "$node_pids" | xargs kill -KILL 2>/dev/null || true
        log_success "Node.js 进程已停止"
    fi
    
    # 清理 PID 文件
    if [ -d "tmp" ]; then
        rm -f tmp/*.pid
    fi
    
    log_success "所有服务已停止"
}

# 清理构建产物
clean_build_artifacts() {
    log_step "2/8 清理构建产物"
    
    local cleaned_something=false
    
    # 清理后端构建
    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        log_info "已清理后端构建目录"
        cleaned_something=true
    fi
    
    # 清理前端构建
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log_info "已清理前端构建目录"
        cleaned_something=true
    fi
    
    # 清理根目录构建
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已清理项目构建目录"
        cleaned_something=true
    fi
    
    # 清理 TypeScript 缓存
    find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
    
    # 清理 Vite 缓存
    if [ -d "frontend/.vite" ]; then
        rm -rf frontend/.vite
        log_info "已清理 Vite 缓存"
        cleaned_something=true
    fi
    
    if [ "$cleaned_something" = true ]; then
        log_success "构建产物清理完成"
    else
        log_info "没有找到构建产物"
    fi
}

# 清理依赖包
clean_dependencies() {
    log_step "3/8 清理依赖包"
    
    local clean_deps=${1:-false}
    
    if [ "$clean_deps" = false ]; then
        log_info "跳过依赖包清理（使用 --deps 清理依赖）"
        return 0
    fi
    
    local cleaned_something=false
    
    # 清理后端依赖
    if [ -d "backend/node_modules" ]; then
        rm -rf backend/node_modules
        log_info "已清理后端依赖包"
        cleaned_something=true
    fi
    
    # 清理前端依赖
    if [ -d "frontend/node_modules" ]; then
        rm -rf frontend/node_modules
        log_info "已清理前端依赖包"
        cleaned_something=true
    fi
    
    # 清理根目录依赖（如果存在）
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log_info "已清理根目录依赖包"
        cleaned_something=true
    fi
    
    # 清理 package-lock.json
    find . -name "package-lock.json" -not -path "./node_modules/*" | while read lockfile; do
        if [ "$lockfile" != "./backend/package-lock.json" ] && [ "$lockfile" != "./frontend/package-lock.json" ]; then
            rm -f "$lockfile"
            log_info "已清理 $lockfile"
            cleaned_something=true
        fi
    done
    
    if [ "$cleaned_something" = true ]; then
        log_success "依赖包清理完成"
    else
        log_info "没有找到依赖包"
    fi
}

# 清理 Docker 资源
clean_docker_resources() {
    log_step "4/8 清理 Docker 资源"
    
    local clean_docker=${1:-false}
    
    if [ "$clean_docker" = false ]; then
        log_info "跳过 Docker 资源清理（使用 --docker 清理Docker）"
        return 0
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker 未安装，跳过 Docker 清理"
        return 0
    fi
    
    log_info "清理 Pathfinder 相关的 Docker 资源..."
    
    # 停止并删除容器
    local containers=$(docker ps -a --filter "name=pathfinder" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "$containers" ]; then
        echo "$containers" | xargs docker rm -f 2>/dev/null || true
        log_info "已删除 Pathfinder 容器"
    fi
    
    # 删除镜像
    local images=$(docker images --filter "reference=*pathfinder*" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
    if [ -n "$images" ]; then
        echo "$images" | xargs docker rmi -f 2>/dev/null || true
        log_info "已删除 Pathfinder 镜像"
    fi
    
    # 清理 Docker 卷
    local volumes=$(docker volume ls --filter "name=pathfinder" --format "{{.Name}}" 2>/dev/null || true)
    if [ -n "$volumes" ]; then
        echo "$volumes" | xargs docker volume rm -f 2>/dev/null || true
        log_info "已删除 Pathfinder 数据卷"
    fi
    
    # 清理 Docker 网络
    local networks=$(docker network ls --filter "name=pathfinder" --format "{{.Name}}" 2>/dev/null || true)
    if [ -n "$networks" ]; then
        echo "$networks" | grep -v "bridge\|host\|none" | xargs docker network rm 2>/dev/null || true
        log_info "已删除 Pathfinder 网络"
    fi
    
    log_success "Docker 资源清理完成"
}

# 清理日志文件
clean_logs() {
    log_step "5/8 清理日志文件"
    
    local clean_logs=${1:-false}
    
    if [ "$clean_logs" = false ]; then
        log_info "跳过日志清理（使用 --logs 清理日志）"
        return 0
    fi
    
    local cleaned_something=false
    
    # 清理应用日志
    if [ -d "logs" ]; then
        # 备份最近的日志
        if [ -f "logs/app.log" ] && [ -s "logs/app.log" ]; then
            cp logs/app.log logs/app.log.bak
            log_info "已备份主应用日志"
        fi
        
        # 清理日志文件
        find logs -name "*.log" -type f -delete 2>/dev/null || true
        log_info "已清理日志目录"
        cleaned_something=true
    fi
    
    # 清理临时文件
    if [ -d "tmp" ]; then
        find tmp -type f -delete 2>/dev/null || true
        log_info "已清理临时文件"
        cleaned_something=true
    fi
    
    if [ "$cleaned_something" = true ]; then
        log_success "日志文件清理完成"
    else
        log_info "没有找到日志文件"
    fi
}

# 清理缓存文件
clean_caches() {
    log_step "6/8 清理缓存文件"
    
    local cleaned_something=false
    
    # 清理 npm 缓存
    if command -v npm >/dev/null 2>&1; then
        npm cache clean --force >/dev/null 2>&1 || true
        log_info "已清理 npm 缓存"
        cleaned_something=true
    fi
    
    # 清理 ESLint 缓存
    find . -name ".eslintcache" -delete 2>/dev/null || true
    
    # 清理测试缓存
    find . -name ".jest" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理 Vite 缓存
    find . -name ".vite" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理 Turbo 缓存
    if [ -d ".turbo" ]; then
        rm -rf .turbo
        log_info "已清理 Turbo 缓存"
        cleaned_something=true
    fi
    
    # 清理操作系统缓存文件
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    
    if [ "$cleaned_something" = true ]; then
        log_success "缓存清理完成"
    else
        log_info "没有找到缓存文件"
    fi
}

# 清理测试相关文件
clean_test_artifacts() {
    log_step "7/8 清理测试相关文件"
    
    local clean_tests=${1:-false}
    
    if [ "$clean_tests" = false ]; then
        log_info "跳过测试文件清理（使用 --tests 清理测试文件）"
        return 0
    fi
    
    local cleaned_something=false
    
    # 清理测试报告
    if [ -d "test-reports" ]; then
        rm -rf test-reports
        log_info "已清理测试报告"
        cleaned_something=true
    fi
    
    # 清理覆盖率报告
    if [ -d "coverage" ]; then
        rm -rf coverage
        log_info "已清理覆盖率报告"
        cleaned_something=true
    fi
    
    # 清理 Jest 缓存
    find . -name ".jest" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # 清理 Vitest 缓存
    find . -name ".vitest" -type d -exec rm -rf {} + 2>/dev/null || true
    
    if [ "$cleaned_something" = true ]; then
        log_success "测试相关文件清理完成"
    else
        log_info "没有找到测试相关文件"
    fi
}

# 重置数据库
reset_database() {
    log_step "8/8 重置数据库"
    
    local reset_db=${1:-false}
    
    if [ "$reset_db" = false ]; then
        log_info "跳过数据库重置（使用 --database 重置数据库）"
        return 0
    fi
    
    # 启动数据库服务（如果没有运行）
    if ! docker-compose -f docker-compose.dev.yml ps db | grep -q "Up"; then
        log_info "启动数据库服务..."
        docker-compose -f docker-compose.dev.yml up -d db
        sleep 5
    fi
    
    # 重置数据库
    log_info "重置数据库..."
    cd backend
    
    if [ -f "prisma/schema.prisma" ]; then
        # 使用 Prisma 重置
        npm run db:reset --force >/dev/null 2>&1 || true
        npm run db:generate >/dev/null 2>&1 || true
        npm run db:seed >/dev/null 2>&1 || true
        log_success "数据库重置完成"
    else
        log_warning "未找到 Prisma 配置，跳过数据库重置"
    fi
    
    cd ..
}

# 显示清理摘要
show_cleanup_summary() {
    echo ""
    echo -e "${WHITE}=============================================${NC}"
    echo -e "${WHITE}  🧹 清理完成！${NC}"
    echo -e "${WHITE}=============================================${NC}"
    echo ""
    
    # 显示磁盘空间
    local current_size=$(du -sh . 2>/dev/null | cut -f1)
    echo -e "${CYAN}📊 清理后项目大小: ${GREEN}$current_size${NC}"
    echo ""
    
    # 显示剩余文件
    echo -e "${CYAN}📁 保留的重要文件:${NC}"
    echo -e "   配置文件: ${YELLOW}保留${NC}"
    echo -e "   源代码:   ${YELLOW}保留${NC}"
    echo -e "   文档:     ${YELLOW}保留${NC}"
    echo ""
    
    echo -e "${CYAN}💡 下一步建议:${NC}"
    echo -e "   重新初始化: ${YELLOW}./setup.sh${NC}"
    echo -e "   启动开发:   ${YELLOW}./dev.sh${NC}"
    echo ""
}

# 主函数
main() {
    local clean_deps=false
    local clean_docker=false
    local clean_logs=false
    local clean_tests=false
    local reset_db=false
    local force_clean=false
    local interactive=true
    
    # 参数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --deps)
                clean_deps=true
                shift
                ;;
            --docker)
                clean_docker=true
                shift
                ;;
            --logs)
                clean_logs=true
                shift
                ;;
            --tests)
                clean_tests=true
                shift
                ;;
            --database)
                reset_db=true
                shift
                ;;
            --all)
                clean_deps=true
                clean_docker=true
                clean_logs=true
                clean_tests=true
                reset_db=true
                shift
                ;;
            --force)
                force_clean=true
                interactive=false
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
    echo -e "${WHITE}  🧹 Pathfinder 环境清理${NC}"
    echo -e "${WHITE}=============================================${NC}"
    echo ""
    
    # 显示将要执行的清理操作
    echo -e "${CYAN}将要执行的清理操作:${NC}"
    echo -e "   停止服务: ${GREEN}✓${NC}"
    echo -e "   构建产物: ${GREEN}✓${NC}"
    echo -e "   依赖包:   $([ "$clean_deps" = true ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}跳过${NC}")"
    echo -e "   Docker:   $([ "$clean_docker" = true ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}跳过${NC}")"
    echo -e "   日志文件: $([ "$clean_logs" = true ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}跳过${NC}")"
    echo -e "   测试文件: $([ "$clean_tests" = true ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}跳过${NC}")"
    echo -e "   数据库:   $([ "$reset_db" = true ] && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}跳过${NC}")"
    echo ""
    
    # 交互式确认
    if [ "$interactive" = true ] && [ "$force_clean" = false ]; then
        if ! confirm_action "⚠️  此操作将清理项目环境，可能删除重要数据！"; then
            log_info "清理操作已取消"
            exit 0
        fi
        echo ""
    fi
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 执行清理操作
    stop_all_services
    clean_build_artifacts
    clean_dependencies "$clean_deps"
    clean_docker_resources "$clean_docker"
    clean_logs "$clean_logs"
    clean_caches
    clean_test_artifacts "$clean_tests"
    reset_database "$reset_db"
    
    # 计算清理时间
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "环境清理完成，耗时 ${duration} 秒"
    
    # 显示清理摘要
    show_cleanup_summary
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --deps        清理 node_modules 依赖包"
    echo "  --docker      清理 Docker 镜像、容器和数据卷"
    echo "  --logs        清理日志文件"
    echo "  --tests       清理测试报告和覆盖率文件"
    echo "  --database    重置数据库数据"
    echo "  --all         执行所有清理操作"
    echo "  --force       强制执行，不显示确认提示"
    echo "  --help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 基础清理（停止服务、清理构建产物）"
    echo "  $0 --deps            # 包含依赖包清理"
    echo "  $0 --docker --logs   # 清理 Docker 资源和日志"
    echo "  $0 --all --force     # 完全清理，不提示确认"
    echo ""
    echo "注意:"
    echo "  - 基础清理是安全的，不会删除源代码和配置"
    echo "  - 使用 --all 选项会删除所有生成文件和数据"
    echo "  - 清理后可使用 ./setup.sh 重新初始化环境"
    echo ""
}

# 信号处理
trap 'log_error "清理操作被中断"; exit 1' INT TERM

# 执行主函数
main "$@"