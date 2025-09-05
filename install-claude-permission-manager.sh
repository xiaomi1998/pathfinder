#!/bin/bash

# Claude Code 权限管理器安装脚本

echo "🚀 安装 Claude Code 飞书权限管理器..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_CONFIG_DIR="$HOME/.config/claude-code"
WEBHOOK_PORT=3000

# 创建Claude Code配置目录
mkdir -p "$CLAUDE_CONFIG_DIR"

# 复制配置文件到Claude Code配置目录
echo "📁 复制配置文件..."
cp "$SCRIPT_DIR/claude-code-settings.json" "$CLAUDE_CONFIG_DIR/settings.json"

# 更新配置文件中的脚本路径
echo "🔧 更新配置文件路径..."
sed -i "" "s|/Users/kechen/Desktop/Pathfinder|$SCRIPT_DIR|g" "$CLAUDE_CONFIG_DIR/settings.json"

# 使脚本可执行
echo "🔐 设置脚本权限..."
chmod +x "$SCRIPT_DIR/claude-permission-hook.sh"
chmod +x "$SCRIPT_DIR/claude-permission-manager.js"
chmod +x "$SCRIPT_DIR/feishu-webhook-handler.js"

# 复制权限配置到用户目录
if [ ! -f "$HOME/.claude-permission-config.json" ]; then
    echo "📋 创建权限配置文件..."
    cp "$SCRIPT_DIR/claude-permission-config.json" "$HOME/.claude-permission-config.json"
    echo "⚠️  请编辑 $HOME/.claude-permission-config.json 配置飞书信息"
fi

echo ""
echo "✅ 安装完成！"
echo ""
echo "📋 下一步设置："
echo "1. 编辑配置文件: $HOME/.claude-permission-config.json"
echo "   - 设置飞书Webhook URL"
echo "   - 设置飞书Bot Token"
echo ""
echo "2. 启动Webhook处理器:"
echo "   node $SCRIPT_DIR/feishu-webhook-handler.js $WEBHOOK_PORT"
echo ""
echo "3. 配置飞书机器人接收地址:"
echo "   http://你的服务器地址:$WEBHOOK_PORT/webhook"
echo ""
echo "4. 重新启动Claude Code以应用新配置"
echo ""

# 检查Node.js是否安装
if ! command -v node >/dev/null 2>&1; then
    echo "⚠️  警告: 未找到Node.js，请先安装Node.js"
fi

# 提示如何测试
echo "🧪 测试权限管理器:"
echo "node $SCRIPT_DIR/claude-permission-manager.js \"ls -la\" \"测试命令\""

echo ""
echo "🎉 安装完成！现在Claude Code会在执行敏感操作前发送飞书消息请求权限。"