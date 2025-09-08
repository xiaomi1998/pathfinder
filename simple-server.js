const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Pathfinder Backend is running', status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✅ Pathfinder backend running on port ${PORT}`);
  console.log(`🌟 Frontend: http://localhost:3000`);
  console.log(`🔧 Backend API: http://localhost:${PORT}`);
});

