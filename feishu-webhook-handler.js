#!/usr/bin/env node

/**
 * 飞书Webhook处理器
 * 接收飞书按钮回调，处理权限审批响应
 */

const http = require('http');
const fs = require('fs');

class FeishuWebhookHandler {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            if (req.method === 'POST') {
                this.handleWebhook(req, res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 飞书Webhook处理器启动在端口 ${this.port}`);
            console.log(`请将此地址配置到飞书机器人：http://你的域名:${this.port}/webhook`);
        });
    }

    handleWebhook(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // 飞书消息验证
                if (data.type === 'url_verification') {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({challenge: data.challenge}));
                    return;
                }

                // 处理交互式按钮回调
                if (data.type === 'card_action_trigger') {
                    this.handleButtonAction(data);
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({code: 0}));
                    return;
                }

                res.writeHead(200);
                res.end('OK');
                
            } catch (error) {
                console.error('处理webhook错误:', error);
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        });
    }

    handleButtonAction(data) {
        try {
            const actionValue = JSON.parse(data.action.value);
            const {action, requestId} = actionValue;
            const userId = data.user_id;

            console.log(`📝 收到用户 ${userId} 的权限决定: ${action} (请求ID: ${requestId})`);

            // 将决定写入临时文件，供权限管理器读取
            const responsePath = `/tmp/claude-permission-response-${requestId}`;
            fs.writeFileSync(responsePath, action);

            // 发送确认消息给飞书
            this.sendConfirmationMessage(data, action);

        } catch (error) {
            console.error('处理按钮操作错误:', error);
        }
    }

    sendConfirmationMessage(originalData, action) {
        // 这里可以发送确认消息回飞书，告知用户操作已处理
        const message = action === 'approve' ? '✅ 权限已批准' : '❌ 权限已拒绝';
        console.log(`发送确认: ${message}`);
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log('🛑 Webhook处理器已停止');
            });
        }
    }
}

// CLI 启动
if (require.main === module) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 3000;
    const handler = new FeishuWebhookHandler(port);
    
    handler.start();
    
    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n正在关闭服务器...');
        handler.stop();
        process.exit(0);
    });
}

module.exports = FeishuWebhookHandler;