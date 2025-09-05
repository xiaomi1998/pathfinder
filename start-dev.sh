#!/bin/bash

echo "🚀 启动 Pathfinder 开发环境..."
echo "================================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📋 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置 GEMINI_API_KEY"
fi

# 构建并启动服务
echo "🐳 启动 Docker 容器..."
docker-compose -f docker-compose.dev.yml up --build -d

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ 开发环境启动完成！"
echo "================================"
echo "📱 前端应用: http://localhost:3000"
echo "🔗 后端API:  http://localhost:8080"
echo "🗄️  数据库:   localhost:5432"
echo "🔴 Redis:    localhost:6379"
echo "⚙️  PgAdmin:  http://localhost:5050"
echo "================================"
echo ""
echo "💡 使用命令："
echo "   查看日志: docker-compose -f docker-compose.dev.yml logs -f"
echo "   停止服务: docker-compose -f docker-compose.dev.yml down"
echo "   重启服务: docker-compose -f docker-compose.dev.yml restart"
echo ""