#!/bin/bash

# =============================================================================
# Pathfinder 打包脚本测试工具
# =============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
TEST_OUTPUT_DIR="${SCRIPT_DIR}/test-packages"
PACKAGE_SCRIPT="${SCRIPT_DIR}/package-for-deployment.sh"

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# 清理测试环境
cleanup_test_env() {
    log_info "清理测试环境..."
    if [[ -d "$TEST_OUTPUT_DIR" ]]; then
        rm -rf "$TEST_OUTPUT_DIR"
    fi
    mkdir -p "$TEST_OUTPUT_DIR"
}

# 测试基本打包功能
test_basic_packaging() {
    log_info "测试基本打包功能..."
    
    if [[ ! -x "$PACKAGE_SCRIPT" ]]; then
        log_error "打包脚本不存在或无执行权限"
        return 1
    fi
    
    # 测试帮助选项
    if "$PACKAGE_SCRIPT" --help > /dev/null 2>&1; then
        log_success "帮助选项测试通过"
    else
        log_error "帮助选项测试失败"
        return 1
    fi
    
    log_success "基本功能测试通过"
}

# 测试所有打包模式
test_all_modes() {
    local modes=("minimal" "full" "docker")
    
    for mode in "${modes[@]}"; do
        log_info "测试 $mode 模式..."
        
        if "$PACKAGE_SCRIPT" \
            --mode "$mode" \
            --output "$TEST_OUTPUT_DIR" \
            --no-size-compare \
            --name "test-pathfinder" > "$TEST_OUTPUT_DIR/test_${mode}.log" 2>&1; then
            
            # 检查输出文件是否存在
            local expected_pattern="test-pathfinder_${mode}_*.tar.gz"
            if ls "$TEST_OUTPUT_DIR"/$expected_pattern 1> /dev/null 2>&1; then
                log_success "$mode 模式打包成功"
                
                # 检查文件大小
                local package_file=$(ls "$TEST_OUTPUT_DIR"/$expected_pattern | head -1)
                local file_size=$(stat -f%z "$package_file" 2>/dev/null || stat -c%s "$package_file" 2>/dev/null)
                
                if [[ $file_size -gt 1024 ]]; then
                    log_success "$mode 模式文件大小正常: $(($file_size / 1024))KB"
                else
                    log_warning "$mode 模式文件大小异常: ${file_size}B"
                fi
            else
                log_error "$mode 模式未生成预期文件"
                return 1
            fi
        else
            log_error "$mode 模式打包失败"
            log_info "查看日志: $TEST_OUTPUT_DIR/test_${mode}.log"
            return 1
        fi
    done
}

# 测试错误处理
test_error_handling() {
    log_info "测试错误处理..."
    
    # 测试无效模式
    if "$PACKAGE_SCRIPT" --mode invalid > /dev/null 2>&1; then
        log_error "无效模式应该失败但未失败"
        return 1
    else
        log_success "无效模式正确被拒绝"
    fi
    
    # 测试无效输出目录
    if "$PACKAGE_SCRIPT" --output "/invalid/path/that/should/not/exist" > /dev/null 2>&1; then
        log_warning "无效路径测试未按预期失败"
    else
        log_success "无效路径正确被拒绝"
    fi
}

# 测试文件内容
test_package_contents() {
    log_info "测试打包内容..."
    
    local test_package=$(ls "$TEST_OUTPUT_DIR"/test-pathfinder_full_*.tar.gz | head -1)
    
    if [[ -f "$test_package" ]]; then
        # 创建临时解压目录
        local temp_extract_dir="${TEST_OUTPUT_DIR}/extract_test"
        mkdir -p "$temp_extract_dir"
        
        # 解压文件
        if tar -xzf "$test_package" -C "$temp_extract_dir" > /dev/null 2>&1; then
            log_success "打包文件可正常解压"
            
            # 检查关键文件
            local key_files=(
                "test-pathfinder/frontend/package.json"
                "test-pathfinder/backend/package.json"
                "test-pathfinder/docker-compose.yml"
                "test-pathfinder/PACKAGE_INFO.txt"
            )
            
            for file in "${key_files[@]}"; do
                if [[ -f "$temp_extract_dir/$file" ]]; then
                    log_success "关键文件存在: $file"
                else
                    log_warning "关键文件缺失: $file"
                fi
            done
            
            # 检查排除文件
            if [[ -d "$temp_extract_dir/test-pathfinder/node_modules" ]]; then
                log_error "node_modules 应该被排除但存在"
                return 1
            else
                log_success "node_modules 正确被排除"
            fi
            
            if [[ -d "$temp_extract_dir/test-pathfinder/.git" ]]; then
                log_error ".git 目录应该被排除但存在"
                return 1
            else
                log_success ".git 目录正确被排除"
            fi
            
            # 清理临时目录
            rm -rf "$temp_extract_dir"
        else
            log_error "打包文件无法解压"
            return 1
        fi
    else
        log_error "找不到测试打包文件"
        return 1
    fi
}

# 性能测试
test_performance() {
    log_info "执行性能测试..."
    
    local start_time=$(date +%s)
    
    "$PACKAGE_SCRIPT" \
        --mode minimal \
        --output "$TEST_OUTPUT_DIR" \
        --name "perf-test" \
        --no-verify > "$TEST_OUTPUT_DIR/perf_test.log" 2>&1
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $duration -lt 60 ]]; then
        log_success "性能测试通过: ${duration}秒"
    else
        log_warning "打包时间较长: ${duration}秒"
    fi
}

# 显示测试结果摘要
show_test_summary() {
    echo
    log_info "=========================================="
    log_info "           测试结果摘要"
    log_info "=========================================="
    
    log_info "测试输出目录: $TEST_OUTPUT_DIR"
    
    if [[ -d "$TEST_OUTPUT_DIR" ]]; then
        local package_count=$(ls "$TEST_OUTPUT_DIR"/*.tar.gz 2>/dev/null | wc -l || echo 0)
        log_info "生成的打包文件数量: $package_count"
        
        if [[ $package_count -gt 0 ]]; then
            log_info "打包文件列表:"
            ls -lh "$TEST_OUTPUT_DIR"/*.tar.gz | while read -r line; do
                log_info "  $line"
            done
        fi
    fi
    
    echo
    log_success "所有测试完成！"
    log_info "可以手动检查 $TEST_OUTPUT_DIR 中的文件"
    echo
}

# 主测试函数
main() {
    echo
    log_info "=========================================="
    log_info "      Pathfinder 打包脚本测试开始"
    log_info "=========================================="
    echo
    
    # 执行所有测试
    cleanup_test_env
    test_basic_packaging
    test_error_handling
    test_all_modes
    test_package_contents
    test_performance
    show_test_summary
    
    log_success "测试套件执行完成！"
}

# 检查是否直接运行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi