#!/bin/bash

# =================================================================
# Pathfinder 功能演示脚本
# 用于面试官演示项目特性和候选人熟悉项目
# =================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# API基础URL
API_BASE="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"

echo -e "${WHITE}================================================${NC}"
echo -e "${WHITE}  🎯 Pathfinder 功能演示${NC}"
echo -e "${WHITE}================================================${NC}"
echo ""

# 检查服务状态
check_services() {
    echo -e "${BLUE}🏥 检查服务状态...${NC}"
    
    # 检查后端服务
    if curl -f -s "$API_BASE/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 后端服务正常${NC}"
    else
        echo -e "${RED}❌ 后端服务未运行，请先启动项目${NC}"
        echo "使用命令: ./quick-start.sh"
        exit 1
    fi
    
    # 检查前端服务
    if curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${RED}❌ 前端服务未运行${NC}"
        exit 1
    fi
    
    echo ""
}

# API演示
demo_api() {
    echo -e "${PURPLE}📡 API 功能演示${NC}"
    echo "================================"
    
    # 健康检查
    echo -e "${YELLOW}1. 健康检查 API${NC}"
    echo "GET $API_BASE/health"
    curl -s "$API_BASE/health" | jq '.' || echo "响应: 服务正常"
    echo ""
    
    # 用户注册（演示）
    echo -e "${YELLOW}2. 用户注册 API 演示${NC}"
    echo "POST $API_BASE/auth/register"
    echo '{
  "name": "测试用户",
  "email": "test@example.com", 
  "password": "password123",
  "confirmPassword": "password123"
}'
    echo -e "${CYAN}注意: 实际注册需要提供有效数据${NC}"
    echo ""
    
    # 登录演示
    echo -e "${YELLOW}3. 用户登录 API 演示${NC}"
    echo "POST $API_BASE/auth/login"
    echo '{
  "email": "demo@pathfinder.com",
  "password": "demo123" 
}'
    
    # 执行登录获取token
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"demo@pathfinder.com","password":"demo123"}' || echo "{}")
    
    if echo "$LOGIN_RESPONSE" | jq -e '.success' >/dev/null 2>&1; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
        echo -e "${GREEN}✅ 登录成功，获得访问令牌${NC}"
    else
        echo -e "${RED}❌ 登录失败，使用默认演示${NC}"
        TOKEN="demo-token"
    fi
    echo ""
    
    # 漏斗列表
    if [ "$TOKEN" != "demo-token" ]; then
        echo -e "${YELLOW}4. 获取漏斗列表${NC}"
        echo "GET $API_BASE/funnels"
        curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/funnels" | jq '.' || echo "获取漏斗列表"
        echo ""
    fi
    
    echo -e "${GREEN}✅ API 演示完成${NC}"
    echo ""
}

# 前端功能演示
demo_frontend() {
    echo -e "${PURPLE}🎨 前端功能演示${NC}"
    echo "================================"
    
    echo -e "${YELLOW}主要页面和功能:${NC}"
    echo ""
    
    echo -e "${BLUE}1. 登录页面${NC}"
    echo "   地址: $FRONTEND_URL/login"
    echo "   功能: 用户身份验证，表单验证"
    echo ""
    
    echo -e "${BLUE}2. 仪表板${NC}"
    echo "   地址: $FRONTEND_URL/dashboard"
    echo "   功能: 数据概览，快速导航"
    echo ""
    
    echo -e "${BLUE}3. 漏斗列表${NC}"
    echo "   地址: $FRONTEND_URL/funnels"
    echo "   功能: 漏斗管理，搜索过滤"
    echo ""
    
    echo -e "${BLUE}4. 漏斗编辑器${NC}"
    echo "   地址: $FRONTEND_URL/funnels/new"
    echo "   功能: 可视化漏斗建模，拖拽操作"
    echo ""
    
    echo -e "${BLUE}5. 数据分析${NC}"
    echo "   地址: $FRONTEND_URL/analytics"
    echo "   功能: 图表展示，瓶颈分析"
    echo ""
    
    # 在浏览器中打开（仅 macOS）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}💻 是否要在浏览器中打开演示? (y/N): ${NC}"
        read -n 1 open_browser
        echo
        
        if [[ $open_browser == [yY] ]]; then
            echo -e "${CYAN}正在打开浏览器...${NC}"
            open "$FRONTEND_URL" &>/dev/null || true
            sleep 2
            echo -e "${GREEN}✅ 浏览器演示已打开${NC}"
        fi
    fi
    echo ""
}

# 数据库演示
demo_database() {
    echo -e "${PURPLE}🗄️ 数据库演示${NC}"
    echo "================================"
    
    echo -e "${YELLOW}数据库结构:${NC}"
    echo ""
    
    # 使用Docker执行数据库查询
    echo -e "${BLUE}1. 用户表 (users)${NC}"
    docker exec pathfinder-db-dev psql -U pathfinder -d pathfinder_dev -c "
        SELECT id, email, full_name, created_at 
        FROM users 
        LIMIT 5;" 2>/dev/null || echo "用户表: 存储用户基本信息"
    echo ""
    
    echo -e "${BLUE}2. 漏斗表 (funnels)${NC}"
    docker exec pathfinder-db-dev psql -U pathfinder -d pathfinder_dev -c "
        SELECT id, name, description, created_at 
        FROM funnels 
        LIMIT 3;" 2>/dev/null || echo "漏斗表: 存储漏斗配置信息"
    echo ""
    
    echo -e "${BLUE}3. 节点表 (nodes)${NC}"
    docker exec pathfinder-db-dev psql -U pathfinder -d pathfinder_dev -c "
        SELECT node_id, label, node_type, position_x, position_y 
        FROM nodes 
        LIMIT 5;" 2>/dev/null || echo "节点表: 存储漏斗节点信息"
    echo ""
    
    echo -e "${BLUE}4. 节点数据表 (node_data)${NC}"
    docker exec pathfinder-db-dev psql -U pathfinder -d pathfinder_dev -c "
        SELECT node_id, data_week, entry_count, conversion_count,
               ROUND((conversion_count::float / entry_count * 100), 2) as conversion_rate
        FROM node_data 
        WHERE entry_count > 0
        LIMIT 5;" 2>/dev/null || echo "节点数据表: 存储转化数据"
    echo ""
    
    echo -e "${GREEN}✅ 数据库演示完成${NC}"
    echo ""
}

# 技术栈演示
demo_tech_stack() {
    echo -e "${PURPLE}🛠️ 技术栈演示${NC}"
    echo "================================"
    
    echo -e "${YELLOW}技术组件:${NC}"
    echo ""
    
    echo -e "${BLUE}前端技术:${NC}"
    echo "  • Vue.js 3 + Composition API"
    echo "  • TypeScript 类型安全"
    echo "  • Vite 构建工具"
    echo "  • Tailwind CSS 样式框架"
    echo "  • Pinia 状态管理"
    echo "  • D3.js 数据可视化"
    echo ""
    
    echo -e "${BLUE}后端技术:${NC}"
    echo "  • Node.js + Express.js"
    echo "  • TypeScript 强类型"
    echo "  • Prisma ORM 数据层"
    echo "  • JWT 身份认证"
    echo "  • Winston 日志系统"
    echo "  • Redis 缓存层"
    echo ""
    
    echo -e "${BLUE}数据库:${NC}"
    echo "  • PostgreSQL 关系数据库"
    echo "  • Redis 内存缓存"
    echo "  • Prisma 数据建模"
    echo ""
    
    echo -e "${BLUE}基础设施:${NC}"
    echo "  • Docker 容器化"
    echo "  • Docker Compose 编排"
    echo "  • Nginx 反向代理"
    echo "  • 健康检查和监控"
    echo ""
    
    echo -e "${GREEN}✅ 技术栈介绍完成${NC}"
    echo ""
}

# 面试任务预览
demo_interview_tasks() {
    echo -e "${PURPLE}🎯 面试任务预览${NC}"
    echo "================================"
    
    echo -e "${YELLOW}可选任务级别:${NC}"
    echo ""
    
    echo -e "${BLUE}初级任务 (60分钟):${NC}"
    echo "  • 数据录入功能开发"
    echo "  • 前端表单组件 + 后端API"
    echo "  • 基础数据验证和错误处理"
    echo "  • 适合: 1-3年经验开发者"
    echo ""
    
    echo -e "${BLUE}中级任务 (90分钟):${NC}"
    echo "  • 瓶颈分析和可视化"
    echo "  • 数据分析算法 + 图表组件"
    echo "  • 系统架构和模块化设计"
    echo "  • 适合: 3-5年经验开发者"
    echo ""
    
    echo -e "${BLUE}高级任务 (120分钟):${NC}"
    echo "  • 实时数据处理系统"
    echo "  • WebSocket + 性能优化"
    echo "  • 架构设计和技术选型"
    echo "  • 适合: 5年以上经验开发者"
    echo ""
    
    echo -e "${YELLOW}评估维度:${NC}"
    echo "  • 技术能力 (40%): 代码质量、技术深度"
    echo "  • 业务理解 (25%): 需求分析、用户体验"
    echo "  • 沟通协作 (20%): 技术交流、问题反馈"
    echo "  • 创新思维 (15%): 方案创新、优化建议"
    echo ""
    
    echo -e "${CYAN}详细任务说明请查看: INTERVIEW_TASKS.md${NC}"
    echo ""
}

# 开发工具演示
demo_dev_tools() {
    echo -e "${PURPLE}🔧 开发工具演示${NC}"
    echo "================================"
    
    echo -e "${YELLOW}可用的开发工具:${NC}"
    echo ""
    
    echo -e "${BLUE}1. 数据库管理 (pgAdmin)${NC}"
    echo "   启动: docker-compose -f docker-compose.dev.yml --profile tools up -d pgadmin"
    echo "   访问: http://localhost:5050"
    echo "   账户: admin@pathfinder.com / admin123"
    echo ""
    
    echo -e "${BLUE}2. 数据库客户端 (Prisma Studio)${NC}"
    echo "   启动: cd backend && npm run db:studio"
    echo "   功能: 可视化数据库管理"
    echo ""
    
    echo -e "${BLUE}3. API测试${NC}"
    echo "   脚本: node backend/scripts/test-api-endpoints.js"
    echo "   工具: Thunder Client (VS Code 插件)"
    echo ""
    
    echo -e "${BLUE}4. 日志查看${NC}"
    echo "   命令: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   应用日志: logs/ 目录"
    echo ""
    
    echo -e "${BLUE}5. 监控工具 (可选)${NC}"
    echo "   启动: docker-compose -f docker-compose.dev.yml --profile monitoring up -d"
    echo "   Prometheus: http://localhost:9090"
    echo "   Grafana: http://localhost:3010 (admin/admin123)"
    echo ""
    
    echo -e "${GREEN}✅ 开发工具介绍完成${NC}"
    echo ""
}

# 故障排除演示
demo_troubleshooting() {
    echo -e "${PURPLE}🔍 故障排除演示${NC}"
    echo "================================"
    
    echo -e "${YELLOW}常见问题和解决方案:${NC}"
    echo ""
    
    echo -e "${BLUE}1. 服务启动失败${NC}"
    echo "   检查: docker-compose -f docker-compose.dev.yml ps"
    echo "   日志: docker-compose -f docker-compose.dev.yml logs service_name"
    echo "   重启: docker-compose -f docker-compose.dev.yml restart service_name"
    echo ""
    
    echo -e "${BLUE}2. 端口占用问题${NC}"
    echo "   查看: lsof -i :3000"
    echo "   终止: kill -9 PID"
    echo "   修改: 编辑 docker-compose.dev.yml 中的端口映射"
    echo ""
    
    echo -e "${BLUE}3. 数据库连接失败${NC}"
    echo "   检查: docker exec pathfinder-db-dev pg_isready -U pathfinder"
    echo "   重置: docker-compose -f docker-compose.dev.yml down -v"
    echo "   重启: docker-compose -f docker-compose.dev.yml up -d db"
    echo ""
    
    echo -e "${BLUE}4. 前端编译错误${NC}"
    echo "   清理: docker-compose -f docker-compose.dev.yml down frontend"
    echo "   重建: docker-compose -f docker-compose.dev.yml up --build frontend"
    echo ""
    
    echo -e "${BLUE}5. API调用失败${NC}"
    echo "   测试: curl http://localhost:3001/api/health"
    echo "   认证: 检查 JWT token 是否有效"
    echo "   CORS: 确认前端URL在CORS配置中"
    echo ""
    
    echo -e "${GREEN}✅ 故障排除指南完成${NC}"
    echo ""
}

# 主菜单
show_menu() {
    echo -e "${WHITE}请选择演示内容:${NC}"
    echo ""
    echo "1. 🏥 服务状态检查"
    echo "2. 📡 API 功能演示" 
    echo "3. 🎨 前端功能演示"
    echo "4. 🗄️ 数据库演示"
    echo "5. 🛠️ 技术栈介绍"
    echo "6. 🎯 面试任务预览"
    echo "7. 🔧 开发工具演示"
    echo "8. 🔍 故障排除指南"
    echo "9. 🌟 完整演示 (全部)"
    echo "0. 🚪 退出"
    echo ""
    echo -n "请输入选项 (0-9): "
}

# 主函数
main() {
    while true; do
        show_menu
        read -n 1 choice
        echo
        echo ""
        
        case $choice in
            1) check_services ;;
            2) demo_api ;;
            3) demo_frontend ;;
            4) demo_database ;;
            5) demo_tech_stack ;;
            6) demo_interview_tasks ;;
            7) demo_dev_tools ;;
            8) demo_troubleshooting ;;
            9) 
                check_services
                demo_api
                demo_frontend
                demo_database
                demo_tech_stack
                demo_interview_tasks
                demo_dev_tools
                demo_troubleshooting
                ;;
            0) 
                echo -e "${GREEN}感谢使用 Pathfinder 演示系统！${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}无效选项，请重新选择${NC}"
                echo ""
                ;;
        esac
        
        echo ""
        echo -e "${CYAN}按任意键继续...${NC}"
        read -n 1
        echo ""
        echo ""
    done
}

# 检查 jq 工具
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  建议安装 jq 工具以获得更好的演示效果${NC}"
    echo "   macOS: brew install jq"
    echo "   Ubuntu: sudo apt-get install jq"
    echo ""
fi

# 运行主程序
main