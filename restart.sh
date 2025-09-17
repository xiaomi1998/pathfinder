#!/bin/bash

echo "🔄 重启 Pathfinder 服务..."

# 强制清理所有相关进程
echo "🧹 清理所有进程..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -9 -f ":3001" 2>/dev/null || true
pkill -9 -f ":8080" 2>/dev/null || true

# 等待进程完全关闭
sleep 5

echo "🚀 重新启动服务..."
./start-dev.sh