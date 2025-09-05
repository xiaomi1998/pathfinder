#!/bin/bash

# Pathfinder 项目安全部署脚本
# 目标服务器: 116.196.80.108

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 服务器配置
SERVER_IP="116.196.80.108"
SERVER_USER="root"
REMOTE_PATH="/root/pathfinder"
LOCAL_PACKAGE=""

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 显示帮助信息
show_help() {
    echo "Pathfinder 服务器部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -p, --package  指定要上传的包文件"
    echo "  --prepare      只准备文件，不上传"
    echo "  --upload       只上传，不部署"
    echo "  --deploy       只部署，不上传"
    echo "  --full         完整流程：打包->上传->部署"
    echo ""
    echo "安全提醒:"
    echo "  - 脚本会提示你输入服务器密码"
    echo "  - 建议配置SSH密钥认证以提高安全性"
    echo "  - 首次部署建议先运行 --prepare 检查文件"
    echo ""
}

# 检查依赖
check_dependencies() {
    log_info "检查必需工具..."
    
    if ! command -v scp &> /dev/null; then
        log_error "scp 未安装，请安装 openssh-client"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "ssh 未安装，请安装 openssh-client"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 准备部署包
prepare_package() {
    log_info "准备部署包..."
    
    if [[ -n "$LOCAL_PACKAGE" && -f "$LOCAL_PACKAGE" ]]; then
        log_success "使用指定的包文件: $LOCAL_PACKAGE"
        return 0
    fi
    
    # 检查是否存在打包脚本
    if [[ ! -f "./package-for-deployment.sh" ]]; then
        log_error "未找到打包脚本，请先运行项目初始化"
        exit 1
    fi
    
    # 执行打包
    log_info "执行最小化打包..."
    ./package-for-deployment.sh --mode minimal
    
    # 查找最新的包文件
    LOCAL_PACKAGE=$(ls -t pathfinder-minimal-*.tar.gz 2>/dev/null | head -1)
    
    if [[ -z "$LOCAL_PACKAGE" || ! -f "$LOCAL_PACKAGE" ]]; then
        log_error "打包失败或未找到包文件"
        exit 1
    fi
    
    log_success "包文件准备完成: $LOCAL_PACKAGE"
}

# 测试服务器连接
test_connection() {
    log_info "测试服务器连接..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'Connection test successful'" 2>/dev/null; then
        log_success "SSH连接测试成功"
        return 0
    else
        log_warning "SSH密钥认证失败，将使用密码认证"
        log_info "请准备输入服务器密码: Xiaomi135@"
        return 1
    fi
}

# 上传文件到服务器
upload_files() {
    log_info "上传文件到服务器..."
    
    if [[ -z "$LOCAL_PACKAGE" || ! -f "$LOCAL_PACKAGE" ]]; then
        log_error "未找到要上传的包文件"
        exit 1
    fi
    
    local file_size=$(du -h "$LOCAL_PACKAGE" | cut -f1)
    log_info "准备上传文件: $LOCAL_PACKAGE (大小: $file_size)"
    
    # 创建远程目录
    log_info "创建远程目录..."
    ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_PATH"
    
    # 上传包文件
    log_info "上传包文件..."
    scp "$LOCAL_PACKAGE" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"
    
    # 上传部署相关脚本
    log_info "上传部署脚本..."
    
    local scripts_to_upload=(
        "docker-compose.simple.yml"
        "start-simple.sh" 
        "deployment-checker.sh"
        ".env.prod.example"
        "LINUX_DEPLOY_GUIDE.md"
    )
    
    for script in "${scripts_to_upload[@]}"; do
        if [[ -f "$script" ]]; then
            scp "$script" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"
            log_success "已上传: $script"
        else
            log_warning "文件不存在，跳过: $script"
        fi
    done
    
    log_success "文件上传完成"
}

# 在服务器上执行部署
deploy_on_server() {
    log_info "在服务器上执行部署..."
    
    local remote_package=$(basename "$LOCAL_PACKAGE")
    
    ssh "$SERVER_USER@$SERVER_IP" << 'EOF'
        set -e
        
        echo "=== Pathfinder 服务器端部署 ==="
        
        # 进入项目目录
        cd /root/pathfinder
        
        # 解压项目文件
        echo "解压项目文件..."
        tar -xzf pathfinder-minimal-*.tar.gz
        
        # 设置执行权限
        chmod +x *.sh 2>/dev/null || true
        
        # 检查 Docker 环境
        echo "检查 Docker 环境..."
        if ! command -v docker &> /dev/null; then
            echo "正在安装 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl start docker
            systemctl enable docker
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo "正在安装 Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # 创建环境配置文件
        if [[ ! -f .env.prod ]]; then
            echo "创建环境配置文件..."
            cp .env.prod.example .env.prod
            
            # 自动配置一些基本参数
            sed -i 's/yourdomain.com/116.196.80.108/g' .env.prod
            sed -i 's/your_very_strong_postgres_password_here/pathfinder_db_2024/g' .env.prod
            sed -i 's/your_very_strong_redis_password_here/pathfinder_redis_2024/g' .env.prod
            sed -i 's/your_very_strong_jwt_secret_key_here_32_chars_plus/pathfinder_jwt_secret_key_2024_very_strong/g' .env.prod
            
            echo "环境配置文件已创建，请根据需要修改 .env.prod"
        fi
        
        # 运行部署前检查
        if [[ -f deployment-checker.sh ]]; then
            echo "运行部署前检查..."
            ./deployment-checker.sh --pre-deploy || echo "检查完成，请查看报告"
        fi
        
        echo ""
        echo "=== 部署准备完成 ==="
        echo "下一步操作："
        echo "1. 编辑配置文件: vi .env.prod"
        echo "2. 启动服务: ./start-simple.sh start"
        echo "3. 检查状态: ./start-simple.sh status"
        echo "4. 查看日志: ./start-simple.sh logs"
        echo ""
        echo "项目文件位置: /root/pathfinder"
        echo "访问地址: http://116.196.80.108"
        echo ""
EOF
    
    log_success "服务器端部署完成"
}

# 显示部署后说明
show_post_deploy_info() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}Pathfinder 部署完成！${NC}"
    echo "========================================"
    echo ""
    echo "服务器信息:"
    echo "  IP地址: 116.196.80.108"
    echo "  用户: root"
    echo "  项目路径: /root/pathfinder"
    echo ""
    echo "下一步操作:"
    echo "  1. SSH登录服务器:"
    echo "     ssh root@116.196.80.108"
    echo ""
    echo "  2. 进入项目目录:"
    echo "     cd /root/pathfinder"
    echo ""
    echo "  3. 编辑配置文件 (根据需要):"
    echo "     vi .env.prod"
    echo ""
    echo "  4. 启动所有服务:"
    echo "     ./start-simple.sh start"
    echo ""
    echo "  5. 检查服务状态:"
    echo "     ./start-simple.sh status"
    echo ""
    echo "  6. 访问应用:"
    echo "     http://116.196.80.108"
    echo ""
    echo "管理命令:"
    echo "  启动服务: ./start-simple.sh start"
    echo "  停止服务: ./start-simple.sh stop"  
    echo "  重启服务: ./start-simple.sh restart"
    echo "  查看状态: ./start-simple.sh status"
    echo "  查看日志: ./start-simple.sh logs"
    echo ""
    echo -e "${YELLOW}注意事项:${NC}"
    echo "  - 首次启动需要拉取Docker镜像，可能需要几分钟"
    echo "  - 请确保服务器防火墙开放80端口"
    echo "  - 建议配置SSL证书以支持HTTPS访问"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}Pathfinder 服务器部署脚本${NC}"
    echo "目标服务器: $SERVER_IP"
    echo "========================================"
    
    local action="full"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -p|--package)
                LOCAL_PACKAGE="$2"
                shift 2
                ;;
            --prepare)
                action="prepare"
                shift
                ;;
            --upload)
                action="upload"
                shift
                ;;
            --deploy)
                action="deploy"
                shift
                ;;
            --full)
                action="full"
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查依赖
    check_dependencies
    
    # 测试连接
    test_connection
    
    # 执行对应操作
    case $action in
        prepare)
            prepare_package
            log_success "文件准备完成: $LOCAL_PACKAGE"
            ;;
        upload)
            if [[ -z "$LOCAL_PACKAGE" ]]; then
                prepare_package
            fi
            upload_files
            ;;
        deploy)
            deploy_on_server
            ;;
        full)
            prepare_package
            upload_files
            deploy_on_server
            show_post_deploy_info
            ;;
    esac
}

# 错误处理
trap 'log_error "部署过程中出现错误"; exit 1' ERR

# 运行主函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi