#!/usr/bin/env node

/**
 * Claude Code 权限管理器 - 飞书集成
 * 当Claude遇到权限问题时，自动发送飞书消息请求授权
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class ClaudePermissionManager {
    constructor() {
        this.config = this.loadConfig();
        this.pendingRequests = new Map();
    }

    loadConfig() {
        const localConfigPath = path.join(__dirname, 'claude-permission-config.json');
        const homeConfigPath = path.join(process.env.HOME, '.claude-permission-config.json');
        
        let configPath = fs.existsSync(localConfigPath) ? localConfigPath : homeConfigPath;
        
        try {
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.error('请先配置权限管理配置文件');
            console.log('创建配置文件:', homeConfigPath);
            console.log('或使用本地配置:', localConfigPath);
            process.exit(1);
        }
    }

    checkPermissionRule(command) {
        const rules = this.config.permissionRules || {};
        
        // 检查是否匹配直接允许的规则
        if (rules['直接允许的安全命令']) {
            for (const pattern of rules['直接允许的安全命令']) {
                if (new RegExp(pattern).test(command)) {
                    return 'allow';
                }
            }
        }
        
        // 检查是否匹配需要审批的规则
        for (const [category, patterns] of Object.entries(rules)) {
            if (category === '直接允许的安全命令') continue;
            
            for (const pattern of patterns) {
                if (new RegExp(pattern).test(command)) {
                    return 'ask';
                }
            }
        }
        
        // 使用默认操作
        return this.config.defaultAction || 'ask';
    }

    async sendFeishuMessage(command, reason) {
        const requestId = Math.random().toString(36).substring(7);
        
        const message = {
            msg_type: "interactive",
            card: {
                elements: [
                    {
                        tag: "div",
                        text: {
                            content: `🤖 Claude Code 权限请求\n\n命令: ${command}\n原因: ${reason}\n\n请选择是否允许执行此命令？`,
                            tag: "lark_md"
                        }
                    },
                    {
                        actions: [
                            {
                                tag: "button",
                                text: { content: "✅ 允许", tag: "lark_md" },
                                type: "primary",
                                value: JSON.stringify({action: "approve", requestId})
                            },
                            {
                                tag: "button", 
                                text: { content: "❌ 拒绝", tag: "lark_md" },
                                type: "danger",
                                value: JSON.stringify({action: "deny", requestId})
                            }
                        ],
                        tag: "action"
                    }
                ]
            }
        };

        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(message);
            const url = new URL(this.config.feishuWebhook);
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        this.pendingRequests.set(requestId, {command, timestamp: Date.now()});
                        console.log(`权限请求已发送到飞书，请求ID: ${requestId}`);
                        resolve(requestId);
                    } else {
                        reject(new Error(`飞书消息发送失败: ${res.statusCode}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async waitForResponse(requestId, timeout = 300000) { // 5分钟超时
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const responsePath = `/tmp/claude-permission-response-${requestId}`;
            
            if (fs.existsSync(responsePath)) {
                const response = fs.readFileSync(responsePath, 'utf8').trim();
                fs.unlinkSync(responsePath); // 清理临时文件
                this.pendingRequests.delete(requestId);
                
                if (response === 'approve') {
                    console.log('✅ 权限请求已批准');
                    return true;
                } else {
                    console.log('❌ 权限请求被拒绝'); 
                    return false;
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
        }
        
        console.log('⏰ 权限请求超时');
        this.pendingRequests.delete(requestId);
        return false;
    }

    async requestPermission(command, reason = '执行系统命令') {
        try {
            const action = this.checkPermissionRule(command);
            
            switch (action) {
                case 'allow':
                    console.log(`✅ 命令已预授权: ${command}`);
                    return true;
                    
                case 'deny':
                    console.log(`❌ 命令被禁止: ${command}`);
                    return false;
                    
                case 'ask':
                default:
                    console.log(`🔒 需要权限审批: ${command}`);
                    const requestId = await this.sendFeishuMessage(command, reason);
                    const approved = await this.waitForResponse(requestId, this.config.timeout);
                    return approved;
            }
        } catch (error) {
            console.error('权限请求失败:', error.message);
            return false;
        }
    }
}

// CLI 使用方式
if (require.main === module) {
    const manager = new ClaudePermissionManager();
    const [command, reason] = process.argv.slice(2);
    
    if (!command) {
        console.log('用法: node claude-permission-manager.js "命令" "原因"');
        process.exit(1);
    }

    manager.requestPermission(command, reason || '执行系统命令')
        .then(approved => process.exit(approved ? 0 : 1))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = ClaudePermissionManager;