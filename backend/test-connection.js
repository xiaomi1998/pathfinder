// 临时脚本：测试数据库和 Redis 连接
const { Client } = require('pg');
const { createClient } = require('redis');

async function testConnections() {
  console.log('🔍 测试数据库连接...');
  
  // 测试 PostgreSQL 连接
  const pgClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pathfinder_dev',
    user: 'pathfinder',
    password: 'dev123',
  });

  try {
    await pgClient.connect();
    const result = await pgClient.query('SELECT version()');
    console.log('✅ PostgreSQL 连接成功:', result.rows[0].version.substring(0, 50) + '...');
    await pgClient.end();
  } catch (error) {
    console.error('❌ PostgreSQL 连接失败:', error.message);
  }

  // 测试 Redis 连接
  const redisClient = createClient({
    url: 'redis://localhost:6379'
  });

  try {
    await redisClient.connect();
    await redisClient.set('test', 'hello');
    const value = await redisClient.get('test');
    console.log('✅ Redis 连接成功, 测试值:', value);
    await redisClient.disconnect();
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message);
  }
}

testConnections().catch(console.error);