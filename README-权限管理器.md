# Claude Code 飞书权限管理器

## 概述

这是一个为 Claude Code 设计的智能权限管理系统，当 Claude 遇到需要权限的操作时，会自动发送飞书消息请求批准，你可以在飞书中点击按钮来允许或拒绝操作。

## 主要功能

✅ **智能权限分级**
- `allow`: 安全命令直接执行 (如 `ls`, `cat`, `read` 等)
- `ask`: 敏感操作发送飞书请求权限 (如 `rm`, `wget`, `sudo` 等)  
- `deny`: 危险操作直接禁止 (如 `rm -rf /` 等)

✅ **飞书集成**
- 自动发送格式化的权限请求消息
- 交互式按钮快速批准/拒绝
- 支持自定义消息模板

✅ **灵活配置**
- 可自定义权限规则
- 支持正则表达式匹配
- 可配置超时时间

## 文件结构

```
├── claude-permission-manager.js      # 主要权限管理器
├── feishu-webhook-handler.js         # 飞书Webhook处理器
├── claude-permission-hook.sh         # Claude Code Hook脚本
├── claude-permission-config.json     # 权限规则配置
├── claude-code-settings.json         # Claude Code配置
├── install-claude-permission-manager.sh  # 安装脚本
├── start-permission-manager.sh       # 启动脚本
├── 飞书应用配置指南.md                 # 飞书配置教程
└── README-权限管理器.md               # 本文档
```

## 快速开始

### 1. 安装配置
```bash
# 运行安装脚本
./install-claude-permission-manager.sh
```

### 2. 配置飞书
1. 参考 `飞书应用配置指南.md` 创建飞书机器人
2. 编辑 `~/.claude-permission-config.json` 配置飞书信息

### 3. 启动服务
```bash
# 启动权限管理器
./start-permission-manager.sh start

# 检查状态
./start-permission-manager.sh status

# 测试功能
./start-permission-manager.sh test
```

## 工作流程

1. **Claude 执行命令** → 触发 PreToolUse Hook
2. **权限检查** → 根据配置规则判断权限等级
3. **发送飞书消息** → 如需审批，发送交互式卡片
4. **等待回复** → 监听用户在飞书中的按钮操作
5. **执行决策** → 根据用户选择允许或阻止命令执行

## 示例场景

### 场景1: 安全命令直接执行
```bash
# Claude 执行: ls -la
✅ 命令已预授权: Bash ls -la
# 直接执行，无需等待
```

### 场景2: 敏感命令请求权限
```bash
# Claude 执行: rm important_file.txt  
🔒 需要权限审批: Bash rm important_file.txt
📱 飞书消息: [🤖 Claude Code 权限请求] [✅允许] [❌拒绝]
✅ 权限已获得，继续执行命令
```

### 场景3: 危险命令直接阻止
```bash
# Claude 执行: rm -rf /
❌ 命令被禁止: Bash rm -rf /
# 直接阻止，不请求权限
```

## 高级配置

### 自定义权限规则
编辑 `claude-permission-config.json`:

```json
{
  "permissionRules": {
    "直接允许的安全命令": [
      "Read(.*)",
      "Bash(ls.*)",
      "Bash(pwd)"
    ],
    "需要审批的网络命令": [
      "Bash(wget.*)",
      "Bash(curl.*)",
      "WebFetch(.*)"
    ],
    "需要审批的文件操作": [
      "Bash(rm.*)",
      "Write(.*\\.sh)",
      "Edit(/etc/.*)"
    ]
  }
}
```

### 修改消息样式
可以自定义发送到飞书的消息格式，支持 Markdown 和交互式按钮。

## 故障排查

### 常见问题

1. **消息发送失败**
   ```bash
   # 检查配置
   cat ~/.claude-permission-config.json
   # 测试连接
   ./start-permission-manager.sh test
   ```

2. **Webhook 不响应**
   ```bash
   # 查看日志
   tail -f /tmp/webhook-handler.log
   # 重启服务
   ./start-permission-manager.sh restart
   ```

3. **权限规则不生效**
   ```bash
   # 检查Claude Code配置
   cat ~/.config/claude-code/settings.json
   ```

### 调试模式
```bash
# 启用详细日志
DEBUG=true node feishu-webhook-handler.js 3000
```

## 安全考虑

1. **网络安全**: 生产环境建议使用 HTTPS
2. **权限最小化**: 合理配置权限规则，避免过度授权
3. **访问控制**: 配置防火墙限制webhook端点访问
4. **日志审计**: 定期检查操作日志

## 扩展功能

- 支持更多即时通讯平台 (微信、钉钉等)
- 添加操作审计和日志记录
- 实现基于时间的权限策略
- 支持多人审批流程

## 技术原理

该系统利用 Claude Code 的 Hooks 机制在工具执行前进行拦截，通过飞书API实现异步的权限审批流程，既保证了安全性又提供了良好的用户体验。

---

🎉 现在你可以放心让Claude Code工作，有敏感操作时会自动通过飞书征求你的同意！