const express = require('express');
const cors = require('cors');
const app = express();

// 基础中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pathfinder API Server', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 基础认证路由（模拟）
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: '注册功能开发中',
    user: {
      id: '1',
      email: req.body.email,
      username: req.body.username
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: '登录功能开发中',
    token: 'mock-jwt-token',
    user: {
      id: '1',
      email: req.body.email
    }
  });
});

// 基础组织路由（模拟）
app.get('/api/organizations', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: '示例公司',
        industry: '科技',
        companySize: '1-10人'
      }
    ]
  });
});

// 基础漏斗路由（模拟）
app.get('/api/funnels', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: '销售漏斗',
        stages: ['线索', '有效触达', '商机', '成交']
      }
    ]
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Pathfinder 简化API服务器运行中`);
  console.log(`🔧 后端API: http://localhost:${PORT}`);
  console.log(`🌟 前端界面: http://localhost:3000`);
  console.log(`📚 API状态: http://localhost:${PORT}/api/health`);
  console.log(`\n💡 说明: 这是简化版API服务器，提供基础模拟接口`);
  console.log(`   完整功能正在修复TypeScript类型问题中...`);
});
