#!/usr/bin/env node

/**
 * API 接口测试脚本
 * 用于面试期间快速验证API功能
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_DATA = {
  interviewer: {
    email: 'interviewer@pathfinder.com',
    password: 'interviewer123'
  },
  candidate: {
    email: 'candidate@pathfinder.com', 
    password: 'candidate123'
  }
};

let authToken = null;

// HTTP 客户端配置
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：自动添加认证头
client.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 响应拦截器：处理错误
client.interceptors.response.use(
  response => response,
  error => {
    console.error(`❌ API Error: ${error.message}`.red);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`.red);
      console.error(`   Data:`, error.response.data);
    }
    return Promise.reject(error);
  }
);

// 测试用例
const tests = [
  {
    name: '健康检查',
    method: 'GET',
    endpoint: '/health',
    description: '检查API服务状态'
  },
  {
    name: '用户登录',
    method: 'POST', 
    endpoint: '/auth/login',
    data: TEST_DATA.candidate,
    description: '测试用户登录功能',
    handler: (response) => {
      authToken = response.data.token;
      console.log(`✅ 登录成功，获得Token: ${authToken.substring(0, 20)}...`.green);
    }
  },
  {
    name: '获取用户信息',
    method: 'GET',
    endpoint: '/auth/me',
    description: '获取当前登录用户信息',
    requiresAuth: true
  },
  {
    name: '获取用户漏斗列表',
    method: 'GET',
    endpoint: '/funnels',
    description: '获取当前用户的所有漏斗',
    requiresAuth: true
  },
  {
    name: '创建新漏斗',
    method: 'POST',
    endpoint: '/funnels',
    data: {
      name: '测试漏斗 - ' + new Date().toISOString(),
      description: '这是一个API测试创建的漏斗',
      canvasData: {
        nodes: [
          {
            id: 'test-node-1',
            type: 'awareness',
            position: { x: 100, y: 100 },
            data: { label: '测试节点1' }
          },
          {
            id: 'test-node-2', 
            type: 'acquisition',
            position: { x: 300, y: 100 },
            data: { label: '测试节点2' }
          }
        ],
        edges: [
          { id: 'test-edge-1', source: 'test-node-1', target: 'test-node-2' }
        ]
      }
    },
    description: '创建一个测试漏斗',
    requiresAuth: true,
    handler: (response) => {
      console.log(`✅ 漏斗创建成功，ID: ${response.data.id}`.green);
      global.testFunnelId = response.data.id;
    }
  },
  {
    name: '获取指定漏斗详情',
    method: 'GET',
    endpoint: () => `/funnels/${global.testFunnelId || 1}`,
    description: '获取指定漏斗的详细信息',
    requiresAuth: true,
    skipIfMissingId: true
  },
  {
    name: '更新漏斗数据',
    method: 'PUT',
    endpoint: () => `/funnels/${global.testFunnelId || 1}`,
    data: {
      name: '更新后的测试漏斗',
      description: '描述已更新'
    },
    description: '更新漏斗基本信息',
    requiresAuth: true,
    skipIfMissingId: true
  },
  {
    name: '获取漏斗分析数据',
    method: 'GET',
    endpoint: () => `/analytics/funnel/${global.testFunnelId || 1}`,
    description: '获取漏斗的分析数据和洞察',
    requiresAuth: true,
    skipIfMissingId: true
  },
  {
    name: 'AI陪练场景列表',
    method: 'GET',
    endpoint: '/ai/scenarios',
    description: '获取可用的AI陪练场景',
    requiresAuth: true
  }
];

// 执行单个测试
async function runTest(test) {
  try {
    console.log(`\n🧪 测试: ${test.name.cyan}`);
    console.log(`   描述: ${test.description.gray}`);
    
    if (test.requiresAuth && !authToken) {
      console.log('   ⏭️  跳过（需要认证）'.yellow);
      return;
    }
    
    if (test.skipIfMissingId && !global.testFunnelId) {
      console.log('   ⏭️  跳过（缺少测试数据ID）'.yellow);
      return;
    }

    const endpoint = typeof test.endpoint === 'function' 
      ? test.endpoint() 
      : test.endpoint;
    
    console.log(`   请求: ${test.method.toUpperCase()} ${endpoint}`);
    
    let response;
    switch (test.method.toUpperCase()) {
      case 'GET':
        response = await client.get(endpoint);
        break;
      case 'POST':
        response = await client.post(endpoint, test.data);
        break;
      case 'PUT':
        response = await client.put(endpoint, test.data);
        break;
      case 'DELETE':
        response = await client.delete(endpoint);
        break;
      default:
        throw new Error(`不支持的HTTP方法: ${test.method}`);
    }

    console.log(`   ✅ 成功 (${response.status})`.green);
    
    // 显示响应数据摘要
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log(`   📊 返回 ${response.data.length} 条记录`.blue);
      } else if (typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        console.log(`   📊 返回对象，包含字段: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`.blue);
      }
    }

    // 执行自定义处理器
    if (test.handler) {
      test.handler(response);
    }

    return response;

  } catch (error) {
    console.log(`   ❌ 失败`.red);
    return null;
  }
}

// 主函数
async function main() {
  console.log('🚀 Pathfinder API 接口测试'.bold.blue);
  console.log(`   基础URL: ${API_BASE_URL}`);
  console.log(`   测试时间: ${new Date().toLocaleString()}`);
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await runTest(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // 测试总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果总结'.bold);
  console.log(`   ✅ 成功: ${passed}`.green);
  console.log(`   ❌ 失败: ${failed}`.red);
  console.log(`   📈 成功率: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n💡 故障排查建议:'.yellow);
    console.log('   1. 确保后端服务已启动 (npm run dev)');
    console.log('   2. 检查数据库连接状态');
    console.log('   3. 确认种子数据已正确加载');
    console.log('   4. 查看服务器日志获取详细错误信息');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// 异常处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

// 启动测试
main();