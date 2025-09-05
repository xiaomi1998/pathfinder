#!/bin/bash

# Claude Code 权限管理器启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$HOME/.claude-permission-config.json"
WEBHOOK_PORT=3000
PID_FILE="/tmp/claude-permission-webhook.pid"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查配置文件
check_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        print_error "配置文件不存在: $CONFIG_FILE"
        print_status "请先运行安装脚本: ./install-claude-permission-manager.sh"
        exit 1
    fi

    # 检查是否配置了飞书信息
    if grep -q "YOUR_WEBHOOK_ID\|YOUR_BOT_TOKEN" "$CONFIG_FILE"; then
        print_warning "请先配置飞书Webhook信息: $CONFIG_FILE"
        print_status "参考配置指南: 飞书应用配置指南.md"
    fi
}

# 检查依赖
check_dependencies() {
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js 未安装"
        exit 1
    fi
    print_success "Node.js 检查通过"
}

# 启动webhook处理器
start_webhook_handler() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        print_warning "Webhook处理器已在运行 (PID: $(cat $PID_FILE))"
        return 0
    fi

    print_status "启动Webhook处理器 (端口: $WEBHOOK_PORT)..."
    
    # 后台启动webhook处理器
    nohup node "$SCRIPT_DIR/feishu-webhook-handler.js" "$WEBHOOK_PORT" > "/tmp/webhook-handler.log" 2>&1 &
    local pid=$!
    
    # 保存PID
    echo $pid > "$PID_FILE"
    
    # 等待启动
    sleep 2
    
    if kill -0 "$pid" 2>/dev/null; then
        print_success "Webhook处理器启动成功 (PID: $pid)"
        print_status "日志文件: /tmp/webhook-handler.log"
    else
        print_error "Webhook处理器启动失败"
        return 1
    fi
}

# 停止webhook处理器
stop_webhook_handler() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            print_status "停止Webhook处理器 (PID: $pid)..."
            kill "$pid"
            rm -f "$PID_FILE"
            print_success "Webhook处理器已停止"
        else
            print_warning "Webhook处理器未运行"
            rm -f "$PID_FILE"
        fi
    else
        print_warning "未找到PID文件"
    fi
}

# 检查状态
check_status() {
    print_status "检查Claude Code权限管理器状态..."
    
    # 检查webhook处理器
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        print_success "Webhook处理器正在运行 (PID: $(cat $PID_FILE))"
        print_status "监听端口: $WEBHOOK_PORT"
    else
        print_warning "Webhook处理器未运行"
    fi
    
    # 检查配置文件
    if [ -f "$CONFIG_FILE" ]; then
        print_success "配置文件存在: $CONFIG_FILE"
    else
        print_error "配置文件缺失: $CONFIG_FILE"
    fi
    
    # 检查Claude Code配置
    local claude_config="$HOME/.config/claude-code/settings.json"
    if [ -f "$claude_config" ]; then
        print_success "Claude Code配置存在: $claude_config"
    else
        print_warning "Claude Code配置缺失: $claude_config"
    fi
}

# 测试权限请求
test_permission_request() {
    print_status "测试权限请求..."
    
    if node "$SCRIPT_DIR/claude-permission-manager.js" "echo 'Hello, World!'" "测试权限请求"; then
        print_success "权限请求测试完成"
    else
        print_error "权限请求测试失败"
    fi
}

# 显示帮助信息
show_help() {
    echo "Claude Code 权限管理器控制脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动权限管理器"
    echo "  stop     停止权限管理器" 
    echo "  restart  重启权限管理器"
    echo "  status   检查运行状态"
    echo "  test     测试权限请求功能"
    echo "  help     显示帮助信息"
    echo ""
    echo "配置文件: $CONFIG_FILE"
    echo "日志文件: /tmp/webhook-handler.log"
    echo ""
}

# 主要逻辑
case "${1:-start}" in
    start)
        print_status "启动Claude Code权限管理器..."
        check_dependencies
        check_config
        start_webhook_handler
        print_success "权限管理器启动完成!"
        print_status "现在Claude Code会在执行敏感操作前发送飞书消息"
        ;;
    stop)
        stop_webhook_handler
        ;;
    restart)
        stop_webhook_handler
        sleep 1
        start_webhook_handler
        ;;
    status)
        check_status
        ;;
    test)
        check_dependencies
        check_config
        test_permission_request
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