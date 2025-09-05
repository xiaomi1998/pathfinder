#!/bin/bash

# =============================================================================
# Pathfinder 项目智能打包脚本
# =============================================================================
# 功能：
# - 自动排除不需要的文件
# - 多种打包模式 (minimal/full/docker)
# - 文件完整性验证
# - 配置检查
# - 压缩打包与大小对比
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_NAME="pathfinder"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="${SCRIPT_DIR}/dist"
TEMP_DIR="${OUTPUT_DIR}/temp_${TIMESTAMP}"
PACKAGE_MODE="full"
CLEAN_TEMP=true
VERIFY_INTEGRITY=true
CHECK_CONFIG=true
SHOW_SIZE_COMPARISON=true

# 帮助信息
show_help() {
    cat << EOF
${CYAN}Pathfinder 项目智能打包脚本${NC}

${YELLOW}用法:${NC}
    $0 [选项]

${YELLOW}选项:${NC}
    -m, --mode MODE      打包模式 [minimal|full|docker] (默认: full)
    -o, --output DIR     输出目录 (默认: ./dist)
    -n, --name NAME      项目名称 (默认: pathfinder)
    --no-clean           不清理临时文件
    --no-verify          跳过完整性验证
    --no-config-check    跳过配置检查
    --no-size-compare    不显示大小对比
    -h, --help           显示此帮助信息

${YELLOW}打包模式说明:${NC}
    ${GREEN}minimal${NC}  - 仅核心文件 (源码、配置、必需脚本)
    ${GREEN}full${NC}     - 完整项目 (包含文档、测试、所有脚本)
    ${GREEN}docker${NC}   - Docker构建用文件 (Dockerfile、配置、源码)

${YELLOW}示例:${NC}
    $0                              # 使用默认设置
    $0 -m minimal -o ./packages     # 最小化打包到指定目录
    $0 --mode docker --no-verify    # Docker模式，跳过验证

${YELLOW}输出:${NC}
    打包文件将保存为: {输出目录}/{项目名}_{模式}_{时间戳}.tar.gz

EOF
}

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

# 错误处理
handle_error() {
    log_error "脚本执行失败，行号: $1"
    if [[ "$CLEAN_TEMP" == "true" && -d "$TEMP_DIR" ]]; then
        log_info "清理临时文件..."
        rm -rf "$TEMP_DIR"
    fi
    exit 1
}

trap 'handle_error $LINENO' ERR

# 参数解析
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                PACKAGE_MODE="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_DIR="$(realpath "$2")"
                TEMP_DIR="${OUTPUT_DIR}/temp_${TIMESTAMP}"
                shift 2
                ;;
            -n|--name)
                PROJECT_NAME="$2"
                shift 2
                ;;
            --no-clean)
                CLEAN_TEMP=false
                shift
                ;;
            --no-verify)
                VERIFY_INTEGRITY=false
                shift
                ;;
            --no-config-check)
                CHECK_CONFIG=false
                shift
                ;;
            --no-size-compare)
                SHOW_SIZE_COMPARISON=false
                shift
                ;;
            -h|--help)
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

    # 验证打包模式
    if [[ ! "$PACKAGE_MODE" =~ ^(minimal|full|docker)$ ]]; then
        log_error "无效的打包模式: $PACKAGE_MODE"
        log_info "支持的模式: minimal, full, docker"
        exit 1
    fi
}

# 检查系统要求
check_prerequisites() {
    log_step "检查系统要求..."
    
    local missing_tools=()
    
    # 检查必需工具
    for tool in tar gzip du wc find; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "缺少必需工具: ${missing_tools[*]}"
        exit 1
    fi
    
    # 检查项目结构
    if [[ ! -f "$SCRIPT_DIR/package.json" && ! -f "$SCRIPT_DIR/frontend/package.json" && ! -f "$SCRIPT_DIR/backend/package.json" ]]; then
        log_warning "未找到 package.json 文件，可能不是 Node.js 项目"
    fi
    
    log_success "系统要求检查完成"
}

# 配置文件验证
validate_config_files() {
    if [[ "$CHECK_CONFIG" == "false" ]]; then
        return 0
    fi
    
    log_step "验证配置文件..."
    
    local config_files=(
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "frontend/package.json"
        "backend/package.json"
        "backend/prisma/schema.prisma"
    )
    
    local invalid_files=()
    
    for file in "${config_files[@]}"; do
        local file_path="$SCRIPT_DIR/$file"
        if [[ -f "$file_path" ]]; then
            case "$file" in
                *.json)
                    if ! python3 -m json.tool "$file_path" > /dev/null 2>&1; then
                        if ! node -e "JSON.parse(require('fs').readFileSync('$file_path', 'utf8'))" 2>/dev/null; then
                            invalid_files+=("$file")
                        fi
                    fi
                    ;;
                *.yml|*.yaml)
                    if command -v yq &> /dev/null; then
                        if ! yq eval . "$file_path" > /dev/null 2>&1; then
                            invalid_files+=("$file")
                        fi
                    else
                        log_warning "yq 未安装，跳过 YAML 文件验证"
                    fi
                    ;;
            esac
        fi
    done
    
    if [[ ${#invalid_files[@]} -gt 0 ]]; then
        log_error "发现无效的配置文件:"
        for file in "${invalid_files[@]}"; do
            log_error "  - $file"
        done
        exit 1
    fi
    
    log_success "配置文件验证通过"
}

# 定义文件排除规则
get_exclude_patterns() {
    local mode="$1"
    
    # 基础排除规则（所有模式都排除）
    local base_excludes=(
        "node_modules"
        ".git"
        ".gitignore"
        "*.log"
        "*.tmp"
        ".DS_Store"
        "Thumbs.db"
        ".env.local"
        ".env.*.local"
        "coverage"
        ".nyc_output"
        "dist/temp_*"
        "tmp"
        "logs"
        "data/postgres"
        "data/redis"
        "backups"
        ".cache"
        ".parcel-cache"
        ".vscode"
        ".idea"
        "*.swp"
        "*.swo"
        "*~"
    )
    
    case "$mode" in
        "minimal")
            # 最小化模式：只保留核心文件
            local minimal_excludes=(
                "${base_excludes[@]}"
                "*.md"
                "docs"
                "documentation"
                "test*"
                "spec"
                "__tests__"
                "e2e"
                ".github"
                "demo*"
                "example*"
                "showcase*"
                "*.test.*"
                "*.spec.*"
                "playwright*"
                "jest*"
                "vitest*"
                "*.config.js"
                "*.config.ts"
                "!vite.config.*"
                "!tsconfig.json"
                "!tailwind.config.js"
                "!postcss.config.js"
            )
            printf '%s\n' "${minimal_excludes[@]}"
            ;;
        "docker")
            # Docker模式：保留构建必需文件
            local docker_excludes=(
                "${base_excludes[@]}"
                "*.md"
                "!README.md"
                "!DEPLOYMENT.md"
                "test*"
                "__tests__"
                "e2e"
                "demo*"
                "example*"
                "showcase*"
                "*.test.*"
                "*.spec.*"
                "scripts/test*"
                "scripts/demo*"
            )
            printf '%s\n' "${docker_excludes[@]}"
            ;;
        "full")
            # 完整模式：保留所有重要文件
            printf '%s\n' "${base_excludes[@]}"
            ;;
        *)
            log_error "未知的打包模式: $mode"
            exit 1
            ;;
    esac
}

# 创建排除文件列表
create_exclude_file() {
    local exclude_file="$TEMP_DIR/exclude_patterns.txt"
    get_exclude_patterns "$PACKAGE_MODE" > "$exclude_file"
    echo "$exclude_file"
}

# 计算目录大小
calculate_size() {
    local path="$1"
    if [[ -d "$path" ]]; then
        du -sh "$path" 2>/dev/null | cut -f1 || echo "未知"
    elif [[ -f "$path" ]]; then
        du -sh "$path" 2>/dev/null | cut -f1 || echo "未知"
    else
        echo "0B"
    fi
}

# 文件完整性检查
verify_package_integrity() {
    if [[ "$VERIFY_INTEGRITY" == "false" ]]; then
        return 0
    fi
    
    log_step "验证打包完整性..."
    
    local temp_project_dir="$TEMP_DIR/$PROJECT_NAME"
    
    # 检查必需文件
    local required_files=()
    
    case "$PACKAGE_MODE" in
        "minimal"|"full"|"docker")
            required_files+=(
                "frontend/src"
                "backend/src"
                "docker-compose.yml"
            )
            ;;
    esac
    
    # 检查前端必需文件
    if [[ -d "$temp_project_dir/frontend" ]]; then
        required_files+=(
            "frontend/package.json"
            "frontend/src/main.ts"
            "frontend/src/App.vue"
        )
    fi
    
    # 检查后端必需文件
    if [[ -d "$temp_project_dir/backend" ]]; then
        required_files+=(
            "backend/package.json"
            "backend/src/app.ts"
            "backend/prisma/schema.prisma"
        )
    fi
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [[ ! -e "$temp_project_dir/$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "打包验证失败，缺少必需文件:"
        for file in "${missing_files[@]}"; do
            log_error "  - $file"
        done
        exit 1
    fi
    
    # 统计文件数量
    local total_files=$(find "$temp_project_dir" -type f | wc -l)
    local total_dirs=$(find "$temp_project_dir" -type d | wc -l)
    
    log_success "完整性验证通过"
    log_info "包含文件: $total_files 个"
    log_info "包含目录: $total_dirs 个"
}

# 清理开发缓存和临时文件
clean_dev_cache() {
    log_step "清理开发缓存和临时文件..."
    
    local temp_project_dir="$TEMP_DIR/$PROJECT_NAME"
    
    # 清理前端缓存
    if [[ -d "$temp_project_dir/frontend" ]]; then
        find "$temp_project_dir/frontend" -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
        find "$temp_project_dir/frontend" -name ".parcel-cache" -type d -exec rm -rf {} + 2>/dev/null || true
        find "$temp_project_dir/frontend" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # 清理后端缓存
    if [[ -d "$temp_project_dir/backend" ]]; then
        find "$temp_project_dir/backend" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
        find "$temp_project_dir/backend" -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # 清理日志文件
    find "$temp_project_dir" -name "*.log" -type f -delete 2>/dev/null || true
    
    # 清理临时文件
    find "$temp_project_dir" -name "*.tmp" -type f -delete 2>/dev/null || true
    find "$temp_project_dir" -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    log_success "缓存清理完成"
}

# 主要打包函数
create_package() {
    log_step "开始创建项目包..."
    
    # 创建输出目录
    mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"
    
    # 计算源目录大小
    local source_size
    if [[ "$SHOW_SIZE_COMPARISON" == "true" ]]; then
        source_size=$(calculate_size "$SCRIPT_DIR")
        log_info "源项目大小: $source_size"
    fi
    
    # 创建排除文件
    local exclude_file
    exclude_file=$(create_exclude_file)
    
    log_info "使用打包模式: ${YELLOW}$PACKAGE_MODE${NC}"
    log_info "临时目录: $TEMP_DIR"
    
    # 复制项目文件（使用rsync排除不需要的文件）
    log_step "复制项目文件..."
    
    if command -v rsync &> /dev/null; then
        # 使用rsync进行智能复制
        rsync -av \
            --exclude-from="$exclude_file" \
            --exclude="dist/temp_*" \
            "$SCRIPT_DIR/" \
            "$TEMP_DIR/$PROJECT_NAME/" \
            --delete-excluded
    else
        # 使用cp作为备选方案
        log_warning "rsync 未安装，使用 cp 命令"
        cp -r "$SCRIPT_DIR" "$TEMP_DIR/$PROJECT_NAME"
        
        # 手动删除排除的文件
        while IFS= read -r pattern; do
            if [[ -n "$pattern" && ! "$pattern" =~ ^# ]]; then
                find "$TEMP_DIR/$PROJECT_NAME" -name "$pattern" -exec rm -rf {} + 2>/dev/null || true
            fi
        done < "$exclude_file"
    fi
    
    # 清理缓存
    clean_dev_cache
    
    # 验证完整性
    verify_package_integrity
    
    # 生成包信息文件
    create_package_info
    
    # 创建压缩包
    create_archive
    
    log_success "项目打包完成"
}

# 生成包信息文件
create_package_info() {
    log_step "生成包信息文件..."
    
    local info_file="$TEMP_DIR/$PROJECT_NAME/PACKAGE_INFO.txt"
    local temp_project_dir="$TEMP_DIR/$PROJECT_NAME"
    
    cat > "$info_file" << EOF
=============================================================================
Pathfinder 项目包信息
=============================================================================

包信息:
  项目名称: $PROJECT_NAME
  打包模式: $PACKAGE_MODE
  打包时间: $(date '+%Y-%m-%d %H:%M:%S')
  打包脚本: $(basename "$0")

系统信息:
  操作系统: $(uname -s)
  架构: $(uname -m)
  主机名: $(hostname)

项目结构:
EOF
    
    # 添加目录树结构（限制深度）
    if command -v tree &> /dev/null; then
        echo "  目录树:" >> "$info_file"
        tree -L 3 -I "node_modules|.git|dist|logs|tmp" "$temp_project_dir" >> "$info_file" 2>/dev/null || true
    else
        echo "  主要目录:" >> "$info_file"
        find "$temp_project_dir" -maxdepth 2 -type d | head -20 | sed 's/^/    /' >> "$info_file"
    fi
    
    # 添加文件统计
    cat >> "$info_file" << EOF

文件统计:
  总文件数: $(find "$temp_project_dir" -type f | wc -l)
  总目录数: $(find "$temp_project_dir" -type d | wc -l)
  JavaScript/TypeScript 文件: $(find "$temp_project_dir" -name "*.js" -o -name "*.ts" -o -name "*.vue" | wc -l)
  配置文件: $(find "$temp_project_dir" -name "*.json" -o -name "*.yml" -o -name "*.yaml" | wc -l)

打包模式说明:
EOF
    
    case "$PACKAGE_MODE" in
        "minimal")
            echo "  最小化打包 - 仅包含核心源码和必需配置文件" >> "$info_file"
            ;;
        "full")
            echo "  完整打包 - 包含源码、文档、脚本和配置文件" >> "$info_file"
            ;;
        "docker")
            echo "  Docker打包 - 包含Docker构建所需的所有文件" >> "$info_file"
            ;;
    esac
    
    cat >> "$info_file" << EOF

使用说明:
  1. 解压缩文件到目标目录
  2. 根据项目需求安装依赖
  3. 配置环境变量和数据库
  4. 运行项目启动脚本

=============================================================================
EOF
    
    log_success "包信息文件创建完成"
}

# 创建压缩档案
create_archive() {
    log_step "创建压缩包..."
    
    local archive_name="${PROJECT_NAME}_${PACKAGE_MODE}_${TIMESTAMP}.tar.gz"
    local archive_path="$OUTPUT_DIR/$archive_name"
    
    # 进入临时目录进行打包
    cd "$TEMP_DIR"
    
    # 创建tar.gz压缩包
    tar -czf "$archive_path" \
        --exclude=".*" \
        "$PROJECT_NAME" \
        2>/dev/null
    
    # 验证压缩包
    if [[ ! -f "$archive_path" ]]; then
        log_error "压缩包创建失败"
        exit 1
    fi
    
    # 计算大小对比
    if [[ "$SHOW_SIZE_COMPARISON" == "true" ]]; then
        local archive_size=$(calculate_size "$archive_path")
        local temp_size=$(calculate_size "$TEMP_DIR/$PROJECT_NAME")
        
        log_success "压缩包创建成功: $archive_name"
        log_info "压缩前大小: $temp_size"
        log_info "压缩后大小: $archive_size"
        log_info "保存位置: $archive_path"
    else
        log_success "压缩包创建成功: $archive_name"
        log_info "保存位置: $archive_path"
    fi
    
    # 生成校验和
    if command -v sha256sum &> /dev/null; then
        local checksum=$(sha256sum "$archive_path" | cut -d' ' -f1)
        echo "$checksum" > "${archive_path}.sha256"
        log_info "SHA256 校验和: $checksum"
    fi
}

# 清理函数
cleanup() {
    if [[ "$CLEAN_TEMP" == "true" && -d "$TEMP_DIR" ]]; then
        log_step "清理临时文件..."
        rm -rf "$TEMP_DIR"
        log_success "临时文件清理完成"
    fi
}

# 显示最终报告
show_final_report() {
    echo
    log_success "=========================================="
    log_success "         打包完成报告"
    log_success "=========================================="
    echo
    log_info "项目名称: $PROJECT_NAME"
    log_info "打包模式: $PACKAGE_MODE"
    log_info "输出目录: $OUTPUT_DIR"
    
    if [[ -f "$OUTPUT_DIR/${PROJECT_NAME}_${PACKAGE_MODE}_${TIMESTAMP}.tar.gz" ]]; then
        local final_size=$(calculate_size "$OUTPUT_DIR/${PROJECT_NAME}_${PACKAGE_MODE}_${TIMESTAMP}.tar.gz")
        log_info "最终大小: $final_size"
    fi
    
    echo
    log_success "打包文件已准备就绪，可用于部署！"
    echo
}

# 主函数
main() {
    echo
    log_info "=========================================="
    log_info "    Pathfinder 项目智能打包脚本启动"
    log_info "=========================================="
    echo
    
    # 解析命令行参数
    parse_arguments "$@"
    
    # 执行打包流程
    check_prerequisites
    validate_config_files
    create_package
    cleanup
    show_final_report
}

# 执行主函数
main "$@"