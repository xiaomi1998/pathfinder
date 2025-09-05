#!/bin/bash

# =================================================================
# Pathfinder 开发环境启动脚本
# 快速启动开发服务器，支持热重载和实时调试
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

# PID文件路径
BACKEND_PID_FILE="./tmp/backend.pid"
FRONTEND_PID_FILE="./tmp/frontend.pid"

# 清理函数
cleanup() {
    log_info "正在停止开发服务器..."
    
    # 停止后端服务
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$backend_pid" 2>/dev/null; then
            kill "$backend_pid" 2>/dev/null || true
            log_info "后端服务已停止 (PID: $backend_pid)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # 停止前端服务
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 "$frontend_pid" 2>/dev/null; then
            kill "$frontend_pid" 2>/dev/null || true
            log_info "前端服务已停止 (PID: $frontend_pid)"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 停止Docker服务
    log_info "停止数据库服务..."
    docker-compose -f docker-compose.dev.yml stop db redis >/dev/null 2>&1 || true
    
    log_success "所有服务已停止"
    exit 0
}

# 检查服务是否运行
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=${3:-15}
    
    log_info "等待 $service_name 启动..."
    
    for i in $(seq 1 $max_attempts); do
        if curl -f -s "$url" >/dev/null 2>&1; then
            log_success "$service_name 已启动"
            return 0
        fi
        sleep 1
    done
    
    log_error "$service_name 启动失败"
    return 1
}

# 显示开发信息
show_dev_info() {
    echo ""
    echo -e "${WHITE}=====================================${NC}"
    echo -e "${WHITE}  🚀 Pathfinder 开发环境${NC}"
    echo -e "${WHITE}=====================================${NC}"
    echo ""
    echo -e "${CYAN}📱 应用地址:${NC}"
    echo -e "   前端: ${GREEN}http://localhost:3000${NC}"
    echo -e "   后端: ${GREEN}http://localhost:3001${NC}"
    echo ""
    echo -e "${CYAN}🛠 开发工具:${NC}"
    echo -e "   数据库管理: ${YELLOW}cd backend && npm run db:studio${NC}"
    echo -e "   API测试: ${YELLOW}node backend/scripts/test-api-endpoints.js${NC}"
    echo ""
    echo -e "${CYAN}📝 日志位置:${NC}"
    echo -e "   后端日志: ${YELLOW}logs/backend-dev.log${NC}"
    echo -e "   前端日志: ${YELLOW}logs/frontend-dev.log${NC}"
    echo ""
    echo -e "${WHITE}按 Ctrl+C 停止所有服务${NC}"
    echo ""
}

# 主函数
main() {
    # 设置信号处理
    trap cleanup INT TERM
    
    log_info "启动 Pathfinder 开发环境..."
    
    # 检查必要文件
    if [ ! -f "docker-compose.dev.yml" ]; then
        log_error "未找到 docker-compose.dev.yml 文件"
        exit 1
    fi
    
    # 创建必要目录
    mkdir -p tmp logs
    
    # 启动数据库服务
    log_info "启动数据库服务..."
    docker-compose -f docker-compose.dev.yml up -d db redis
    
    # 等待数据库启动
    sleep 5
    
    # 启动后端开发服务器
    log_info "启动后端开发服务器..."
    cd backend
    
    # 检查并生成 Prisma 客户端
    if [ ! -d "node_modules/@prisma/client" ] || [ "prisma/schema.prisma" -nt "node_modules/@prisma/client" ]; then
        log_info "生成 Prisma 客户端..."
        npm run db:generate >/dev/null 2>&1
    fi
    
    # 启动后端服务（后台运行）
    npm run dev > ../logs/backend-dev.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "../$BACKEND_PID_FILE"
    log_success "后端服务已启动 (PID: $BACKEND_PID)"
    
    cd ..
    
    # 等待后端服务启动
    check_service "后端API" "http://localhost:3001/api/health" 30
    
    # 启动前端开发服务器
    log_info "启动前端开发服务器..."
    cd frontend
    npm run dev > ../logs/frontend-dev.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "../$FRONTEND_PID_FILE"
    log_success "前端服务已启动 (PID: $FRONTEND_PID)"
    
    cd ..
    
    # 等待前端服务启动
    check_service "前端应用" "http://localhost:3000" 30
    
    # 显示开发信息
    show_dev_info
    
    # 实时显示日志（可选）
    if [[ "$1" == "--logs" ]]; then
        log_info "实时显示日志 (Ctrl+C 停止)..."
        tail -f logs/backend-dev.log logs/frontend-dev.log
    else
        # 等待用户中断
        log_info "开发环境已就绪，使用 --logs 参数可查看实时日志"
        while true; do
            sleep 1
            
            # 检查进程是否还在运行
            if ! kill -0 $BACKEND_PID 2>/dev/null; then
                log_error "后端服务异常退出"
                break
            fi
            
            if ! kill -0 $FRONTEND_PID 2>/dev/null; then
                log_error "前端服务异常退出"
                break
            fi
        done
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --logs    启动后显示实时日志"
    echo "  --help    显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 启动开发环境"
    echo "  $0 --logs       # 启动开发环境并显示实时日志"
    echo ""
}

# 参数处理
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac