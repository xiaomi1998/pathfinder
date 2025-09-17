const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pathfinder Backend API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
=================================================
🚀 Pathfinder Backend Started Successfully
=================================================
🌐 Server URL: http://localhost:${PORT}
📋 Health Check: http://localhost:${PORT}/api/health
⏰ Started at: ${new Date().toLocaleString()}
=================================================
  `);
});