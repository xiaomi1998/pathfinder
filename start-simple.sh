#!/bin/bash

# Pathfinder Simple Docker Compose Management Script
# 简化版Docker部署管理脚本

set -e

COMPOSE_FILE="docker-compose.simple.yml"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_requirements() {
    print_info "检查环境要求..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装或未在PATH中找到"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装或未在PATH中找到"
        exit 1
    fi
    
    print_info "环境检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建数据目录..."
    mkdir -p data/postgres data/redis logs
    print_info "目录创建完成"
}

# 启动服务
start_services() {
    print_info "启动 Pathfinder 服务..."
    docker-compose -f $COMPOSE_FILE up -d
    
    print_info "等待服务启动..."
    sleep 10
    
    print_info "检查服务状态..."
    docker-compose -f $COMPOSE_FILE ps
}

# 停止服务
stop_services() {
    print_info "停止 Pathfinder 服务..."
    docker-compose -f $COMPOSE_FILE down
}

# 重启服务
restart_services() {
    print_info "重启 Pathfinder 服务..."
    docker-compose -f $COMPOSE_FILE restart
}

# 查看日志
view_logs() {
    if [ -n "$2" ]; then
        docker-compose -f $COMPOSE_FILE logs -f "$2"
    else
        docker-compose -f $COMPOSE_FILE logs -f
    fi
}

# 查看服务状态
show_status() {
    print_info "服务状态："
    docker-compose -f $COMPOSE_FILE ps
    
    print_info "健康检查状态："
    docker-compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

# 清理服务和数据
cleanup() {
    print_warning "这将删除所有容器、网络和数据！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "清理服务和数据..."
        docker-compose -f $COMPOSE_FILE down -v --remove-orphans
        sudo rm -rf data/postgres/* data/redis/*
        print_info "清理完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "Pathfinder Simple Docker Compose 管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start     启动所有服务"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    查看服务状态"
    echo "  logs      查看所有服务日志"
    echo "  logs [service]  查看特定服务日志"
    echo "  cleanup   清理所有数据和容器"
    echo "  help      显示此帮助信息"
    echo ""
    echo "服务名称: postgres, redis, backend, frontend, nginx"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            check_requirements
            create_directories
            start_services
            print_info "Pathfinder 已启动！"
            print_info "访问地址："
            print_info "  - 前端应用: http://localhost"
            print_info "  - API接口: http://localhost/api"
            print_info "  - 直接前端: http://localhost:8080"
            print_info "  - 直接后端: http://localhost:3000"
            ;;
        stop)
            stop_services
            print_info "Pathfinder 已停止"
            ;;
        restart)
            restart_services
            print_info "Pathfinder 已重启"
            ;;
        status)
            show_status
            ;;
        logs)
            view_logs "$@"
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"