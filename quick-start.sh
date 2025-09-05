#!/bin/bash

# =================================================================
# Pathfinder 快速启动脚本 - 面试专用
# 专为面试场景优化的快速启动方案
# =================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 项目配置
PROJECT_NAME="Pathfinder"
FRONTEND_PORT=3000
BACKEND_PORT=3001
DB_PORT=5432
REDIS_PORT=6379

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  🎯 $PROJECT_NAME 快速启动 (面试版)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查必要工具
check_requirements() {
    echo -e "${YELLOW}📋 检查环境要求...${NC}"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装${NC}"
        exit 1
    fi
    
    # 检查 Docker 运行状态
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 未运行，请启动 Docker Desktop${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 清理现有环境
cleanup_existing() {
    echo -e "${YELLOW}🧹 清理现有环境...${NC}"
    
    # 停止现有容器
    docker-compose -f docker-compose.dev.yml down --remove-orphans &>/dev/null || true
    
    # 清理悬空镜像
    docker image prune -f &>/dev/null || true
    
    echo -e "${GREEN}✅ 环境清理完成${NC}"
}

# 检查端口占用
check_ports() {
    echo -e "${YELLOW}🔍 检查端口占用...${NC}"
    
    local ports=($FRONTEND_PORT $BACKEND_PORT $DB_PORT $REDIS_PORT)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t &>/dev/null; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠️  以下端口已被占用: ${occupied_ports[*]}${NC}"
        echo "是否继续? (y/N): "
        read -n 1 confirmation
        echo
        if [[ $confirmation != [yY] ]]; then
            echo -e "${RED}❌ 启动已取消${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ 端口检查完成${NC}"
}

# 创建必要的环境变量
setup_env() {
    echo -e "${YELLOW}⚙️  配置环境变量...${NC}"
    
    # 创建根目录 .env
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# Pathfinder 面试环境配置
COMPOSE_PROJECT_NAME=pathfinder-interview
NODE_ENV=development

# API Keys (可选)
OPENAI_API_KEY=
GEMINI_API_KEY=
EOF
        echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
    fi
}

# 启动服务
start_services() {
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    
    # 启动数据库服务
    echo "  📊 启动数据库服务..."
    docker-compose -f docker-compose.dev.yml up -d db redis
    
    # 等待数据库启动
    echo "  ⏳ 等待数据库启动 (30秒)..."
    sleep 30
    
    # 启动应用服务
    echo "  🔧 启动后端服务..."
    docker-compose -f docker-compose.dev.yml up -d backend
    
    echo "  ⏳ 等待后端启动 (20秒)..."
    sleep 20
    
    echo "  🎨 启动前端服务..."
    docker-compose -f docker-compose.dev.yml up -d frontend
    
    echo "  ⏳ 等待前端启动 (15秒)..."
    sleep 15
}

# 健康检查
health_check() {
    echo -e "${YELLOW}🏥 服务健康检查...${NC}"
    
    local max_attempts=10
    local attempt=1
    
    # 检查后端
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$BACKEND_PORT/api/health" &>/dev/null; then
            echo -e "${GREEN}✅ 后端服务运行正常${NC}"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ 后端服务启动失败${NC}"
            return 1
        fi
        
        echo "  等待后端服务... (尝试 $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    done
    
    # 检查前端
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:$FRONTEND_PORT" &>/dev/null; then
            echo -e "${GREEN}✅ 前端服务运行正常${NC}"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}❌ 前端服务启动失败${NC}"
            return 1
        fi
        
        echo "  等待前端服务... (尝试 $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    done
    
    return 0
}

# 显示启动信息
show_info() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  🎉 $PROJECT_NAME 启动成功！${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "${BLUE}📱 应用访问地址:${NC}"
    echo -e "   前端应用:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   后端API:   ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo ""
    echo -e "${BLUE}🔐 测试账户:${NC}"
    echo -e "   邮箱: ${GREEN}demo@pathfinder.com${NC}"
    echo -e "   密码: ${GREEN}demo123${NC}"
    echo ""
    echo -e "${BLUE}🛠️  开发工具:${NC}"
    echo -e "   数据库管理: ${YELLOW}docker-compose -f docker-compose.dev.yml --profile tools up -d pgadmin${NC}"
    echo -e "   监控工具:   ${YELLOW}docker-compose -f docker-compose.dev.yml --profile monitoring up -d${NC}"
    echo "   访问地址:   http://localhost:5050 (pgadmin)"
    echo ""
    echo -e "${BLUE}💡 常用命令:${NC}"
    echo -e "   查看日志:   ${YELLOW}docker-compose -f docker-compose.dev.yml logs -f${NC}"
    echo -e "   停止服务:   ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
    echo -e "   重启服务:   ${YELLOW}docker-compose -f docker-compose.dev.yml restart${NC}"
    echo ""
    echo -e "${BLUE}📚 面试相关:${NC}"
    echo -e "   面试指南:   ${YELLOW}cat INTERVIEW_GUIDE.md${NC}"
    echo -e "   任务说明:   ${YELLOW}cat INTERVIEW_TASKS.md${NC}"
    echo -e "   API文档:    ${YELLOW}cat API_DOCS.md${NC}"
    echo ""
    
    # 在浏览器中打开应用（仅 macOS）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}💻 正在打开应用...${NC}"
        sleep 2
        open "http://localhost:$FRONTEND_PORT" &>/dev/null || true
    fi
}

# 错误处理
handle_error() {
    echo ""
    echo -e "${RED}================================================${NC}"
    echo -e "${RED}  ❌ 启动失败${NC}"
    echo -e "${RED}================================================${NC}"
    echo ""
    echo -e "${YELLOW}🔍 故障排除建议:${NC}"
    echo ""
    echo "1. 检查 Docker 是否正常运行:"
    echo "   docker info"
    echo ""
    echo "2. 查看容器状态:"
    echo "   docker-compose -f docker-compose.dev.yml ps"
    echo ""
    echo "3. 查看服务日志:"
    echo "   docker-compose -f docker-compose.dev.yml logs backend"
    echo "   docker-compose -f docker-compose.dev.yml logs frontend"
    echo "   docker-compose -f docker-compose.dev.yml logs db"
    echo ""
    echo "4. 重置环境:"
    echo "   docker-compose -f docker-compose.dev.yml down -v"
    echo "   docker system prune -f"
    echo ""
    echo "5. 重新运行启动脚本:"
    echo "   ./quick-start.sh"
    echo ""
    echo -e "${BLUE}📞 需要帮助?${NC}"
    echo "   查看完整文档: README.md"
    echo "   联系技术支持: tech-support@pathfinder.com"
}

# 主函数
main() {
    # 设置错误处理
    trap 'handle_error' ERR
    
    # 执行启动流程
    check_requirements
    cleanup_existing
    check_ports
    setup_env
    start_services
    
    # 健康检查
    if health_check; then
        show_info
    else
        handle_error
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}🎯 准备就绪，开始你的面试任务！${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "Pathfinder 快速启动脚本 - 面试版"
    echo ""
    echo "用法:"
    echo "  $0              启动完整环境"
    echo "  $0 --help       显示帮助信息"
    echo "  $0 --version    显示版本信息"
    echo ""
    echo "特性:"
    echo "  • 全自动环境设置"
    echo "  • 智能端口检查" 
    echo "  • 服务健康检查"
    echo "  • 详细的故障排除指南"
    echo ""
    echo "系统要求:"
    echo "  • Docker Desktop"
    echo "  • 8GB+ 内存"
    echo "  • 5GB+ 可用磁盘空间"
}

# 参数处理
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --version|-v)
        echo "Pathfinder Quick Start v1.0.0"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "未知参数: $1"
        echo "使用 --help 查看帮助信息"
        exit 1
        ;;
esac