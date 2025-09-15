#!/bin/bash

# 启动开发环境脚本
echo "🚀 启动 Pathfinder 开发环境..."

# 检查并清理端口
echo "📋 检查端口占用..."
backend_pid=$(lsof -ti:3001)
frontend_pid=$(lsof -ti:8080)

if [ ! -z "$backend_pid" ]; then
    echo "⚠️  端口 3001 被占用，清理进程 $backend_pid"
    kill -9 $backend_pid 2>/dev/null
    sleep 2
fi

if [ ! -z "$frontend_pid" ]; then
    echo "⚠️  端口 8080 被占用，清理进程 $frontend_pid"
    kill -9 $frontend_pid 2>/dev/null
    sleep 2
fi

# 清理僵尸进程
echo "🧹 清理僵尸进程..."
pkill -f "nodemon.*pathfinder" 2>/dev/null || true
pkill -f "ts-node.*pathfinder" 2>/dev/null || true
pkill -f "vite.*pathfinder" 2>/dev/null || true

sleep 3

# 启动后端
echo "🔧 启动后端服务..."
cd backend
npm run dev &
backend_job=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 8

# 检查后端是否成功启动
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $backend_job 2>/dev/null
    exit 1
fi

# 启动前端
echo "🎨 启动前端服务..."
cd ../frontend
npm run dev &
frontend_job=$!

# 等待前端启动
sleep 5

echo "🎉 开发环境启动完成！"
echo "📱 前端: http://localhost:8080"
echo "🔗 后端: http://localhost:3001"
echo "❤️  健康检查: http://localhost:3001/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
wait