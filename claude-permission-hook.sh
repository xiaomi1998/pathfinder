#!/bin/bash

# Claude Code 权限检查Hook脚本
# 这个脚本会在Claude Code执行工具前被调用

TOOL_NAME="$1"
TOOL_ARGS="$2"
COMMAND_DESCRIPTION="$3"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PERMISSION_MANAGER="$SCRIPT_DIR/claude-permission-manager.js"

# 定义需要特殊权限的命令模式
RESTRICTED_PATTERNS=(
    "rm -rf"
    "sudo"
    "chmod 777"
    "wget"
    "curl.*github\.com"
    "git clone"
    "npm install.*-g"
    "pip install.*--system"
    "/etc/"
    "/usr/local/"
    "/System/"
)

# 检查命令是否需要权限审批
needs_permission() {
    local command="$1"
    
    for pattern in "${RESTRICTED_PATTERNS[@]}"; do
        if echo "$command" | grep -qE "$pattern"; then
            return 0  # 需要权限
        fi
    done
    
    return 1  # 不需要权限
}

# 主逻辑
main() {
    # 构建完整的命令字符串
    local full_command="$TOOL_NAME $TOOL_ARGS"
    
    # 检查是否需要权限
    if needs_permission "$full_command"; then
        echo "🔒 检测到需要权限的命令: $full_command" >&2
        
        # 调用权限管理器
        if node "$PERMISSION_MANAGER" "$full_command" "$COMMAND_DESCRIPTION"; then
            echo "✅ 权限已获得，继续执行命令" >&2
            exit 0  # 允许执行
        else
            echo "❌ 权限被拒绝，停止执行命令" >&2
            exit 1  # 阻止执行
        fi
    else
        # 不需要权限的命令直接通过
        exit 0
    fi
}

# 如果权限管理器不存在，给出提示
if [[ ! -f "$PERMISSION_MANAGER" ]]; then
    echo "⚠️  权限管理器脚本未找到: $PERMISSION_MANAGER" >&2
    echo "请确保 claude-permission-manager.js 在同一目录下" >&2
    exit 0  # 不阻止执行，只是警告
fi

# 检查Node.js是否可用
if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  Node.js 未安装，权限检查功能不可用" >&2
    exit 0  # 不阻止执行
fi

main "$@"