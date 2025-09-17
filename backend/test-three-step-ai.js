/**
 * 三步AI分析功能完整测试
 * 测试从第一步到第三步的完整流程
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试配置
const testUser = {
  email: '18888888888',  // 使用手机号作为email字段
  password: 'Test123456!',
  name: 'AI测试用户',
  phone: '18888888888',
  verification_code: '123456',
  password_confirmation: 'Test123456!',
  terms_accepted: true
};

let authToken = null;
let userId = null;
let funnelId = null;
let analysisId = null;

// 彩色输出
const log = {
  success: (msg) => console.log('\x1b[32m✓\x1b[0m', msg),
  error: (msg) => console.log('\x1b[31m✗\x1b[0m', msg),
  info: (msg) => console.log('\x1b[34mℹ\x1b[0m', msg),
  warning: (msg) => console.log('\x1b[33m⚠\x1b[0m', msg),
  title: (msg) => console.log('\n\x1b[36m' + msg + '\x1b[0m'),
  json: (obj) => console.log(JSON.stringify(obj, null, 2))
};

// 等待服务器启动
async function waitForServer(maxRetries = 30) {
  log.info('等待服务器启动...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      if (response.data.success) {
        log.success('服务器已启动');
        return true;
      }
    } catch (error) {
      process.stdout.write('.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  log.error('服务器启动超时');
  return false;
}

// 1. 认证
async function authenticate() {
  log.title('步骤1: 用户认证');
  
  try {
    // 尝试登录
    const loginResp = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResp.data.data?.access_token || loginResp.data.data?.token;
    userId = loginResp.data.data?.user?.id;
    
    log.success('登录成功');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    // 如果登录失败，尝试注册
    if (error.response?.status === 401 || error.response?.status === 400) {
      log.warning('用户不存在，尝试注册...');
      
      try {
        const registerResp = await axios.post(`${API_BASE}/auth/register`, testUser);
        authToken = registerResp.data.data?.access_token || registerResp.data.data?.token;
        userId = registerResp.data.data?.user?.id;
        
        log.success('注册成功');
        return true;
      } catch (regError) {
        log.error(`注册失败: ${regError.response?.data?.error || regError.message}`);
        return false;
      }
    }
    
    log.error(`登录失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// 2. 创建测试漏斗
async function createTestFunnel() {
  log.title('步骤2: 创建测试漏斗');
  
  const funnelData = {
    name: `AI分析测试漏斗_${Date.now()}`,
    description: '用于测试三步AI分析功能',
    dataPeriod: 'WEEKLY',
    nodes: [
      { 
        id: 'node1', 
        name: '访问落地页', 
        type: 'entry',
        label: '访问落地页',
        position: { x: 100, y: 100 },
        data: { value: 10000 }
      },
      { 
        id: 'node2', 
        name: '注册账号', 
        type: 'action',
        label: '注册账号',
        position: { x: 250, y: 100 },
        data: { value: 3000 }
      },
      { 
        id: 'node3', 
        name: '完成设置', 
        type: 'action',
        label: '完成设置',
        position: { x: 400, y: 100 },
        data: { value: 1500 }
      },
      { 
        id: 'node4', 
        name: '付费转化', 
        type: 'conversion',
        label: '付费转化',
        position: { x: 550, y: 100 },
        data: { value: 300 }
      }
    ],
    edges: [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
      { id: 'edge3', source: 'node3', target: 'node4' }
    ]
  };
  
  try {
    const response = await axios.post(
      `${API_BASE}/funnels`,
      funnelData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    funnelId = response.data.data.id;
    log.success(`漏斗创建成功 (ID: ${funnelId})`);
    return true;
  } catch (error) {
    log.error(`创建漏斗失败: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      log.json(error.response.data);
    }
    return false;
  }
}

// 3. 测试第一步：关键洞察
async function testStep1() {
  log.title('步骤3: 测试第一步AI分析 - 关键洞察（免费）');
  
  try {
    const response = await axios.post(
      `${API_BASE}/ai-analysis/step1/${funnelId}`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      analysisId = response.data.data.analysisId;
      
      if (!analysisId) {
        log.error('第一步分析未返回analysisId');
        return false;
      }
      
      log.success('第一步分析成功！');
      log.info('分析ID: ' + analysisId);
      log.info('关键洞察:');
      log.json(response.data.data.key_insight);
      log.info('预览分析:');
      log.json(response.data.data.teaser_analysis);
      
      return true;
    }
    
    log.error('第一步分析响应格式错误');
    return false;
  } catch (error) {
    log.error(`第一步分析失败: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      log.json(error.response.data);
    }
    return false;
  }
}

// 4. 测试第二步：策略选择
async function testStep2() {
  log.title('步骤4: 测试第二步AI分析 - 策略选择（付费）');
  
  // 先检查分析次数
  try {
    const quotaResp = await axios.get(
      `${API_BASE}/ai-analysis/quota`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    log.info(`剩余分析次数: ${quotaResp.data.data.remainingQuota}`);
    
    if (quotaResp.data.data.remainingQuota <= 0) {
      log.warning('分析次数不足，跳过付费分析');
      return false;
    }
  } catch (error) {
    log.warning('无法获取分析次数');
  }
  
  try {
    const response = await axios.post(
      `${API_BASE}/ai-analysis/step2/${analysisId}`,
      { funnelId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      log.success('第二步分析成功！');
      log.info('稳健策略:');
      log.json(response.data.data.stable_strategy);
      log.info('激进策略:');
      log.json(response.data.data.aggressive_strategy);
      
      return true;
    }
    
    log.error('第二步分析响应格式错误');
    return false;
  } catch (error) {
    log.error(`第二步分析失败: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      log.json(error.response.data);
    }
    return false;
  }
}

// 5. 测试第三步：完整报告
async function testStep3(strategy = 'stable') {
  log.title(`步骤5: 测试第三步AI分析 - 完整报告（${strategy}策略）`);
  
  try {
    const response = await axios.post(
      `${API_BASE}/ai-analysis/step3/${analysisId}`,
      { 
        funnelId,
        selectedStrategy: strategy
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      log.success('第三步分析成功！');
      log.info('报告ID: ' + response.data.data.reportId);
      log.info('生成时间: ' + response.data.data.generatedAt);
      log.info('选择策略: ' + response.data.data.strategy);
      
      // 显示部分报告内容
      if (response.data.data.recommendations) {
        log.info('主要建议:');
        response.data.data.recommendations.forEach((rec, idx) => {
          log.info(`  ${idx + 1}. ${rec}`);
        });
      }
      
      if (response.data.data.nextSteps) {
        log.info('下一步行动:');
        response.data.data.nextSteps.forEach((step, idx) => {
          log.info(`  ${idx + 1}. ${step}`);
        });
      }
      
      return true;
    }
    
    log.error('第三步分析响应格式错误');
    return false;
  } catch (error) {
    log.error(`第三步分析失败: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      log.json(error.response.data);
    }
    return false;
  }
}

// 6. 获取分析报告列表
async function getReports() {
  log.title('步骤6: 获取所有分析报告');
  
  try {
    const response = await axios.get(
      `${API_BASE}/ai-analysis/reports`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data.success) {
      const reports = response.data.data;
      log.success(`获取到 ${reports.length} 份报告`);
      
      reports.forEach(report => {
        log.info(`- ${report.funnelName} (${report.strategy || '未知'}策略) - ${new Date(report.createdAt).toLocaleString()}`);
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`获取报告失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// 主测试流程
async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('         🚀 三步AI分析功能完整测试');
  console.log('='.repeat(60));
  
  // 等待服务器启动
  const serverReady = await waitForServer();
  if (!serverReady) {
    log.error('测试终止：服务器未启动');
    return;
  }
  
  // 执行测试步骤
  const results = {
    auth: await authenticate(),
    funnel: false,
    step1: false,
    step2: false,
    step3: false,
    reports: false
  };
  
  if (!results.auth) {
    log.error('认证失败，测试终止');
    return;
  }
  
  results.funnel = await createTestFunnel();
  if (!results.funnel) {
    log.error('创建漏斗失败，测试终止');
    return;
  }
  
  // 测试三步分析
  results.step1 = await testStep1();
  
  if (results.step1) {
    results.step2 = await testStep2();
    
    if (results.step2) {
      results.step3 = await testStep3('stable');
    }
  }
  
  // 获取报告列表
  results.reports = await getReports();
  
  // 输出测试结果
  console.log('\n' + '='.repeat(60));
  console.log('                📊 测试结果汇总');
  console.log('='.repeat(60));
  
  const testItems = [
    { name: '用户认证', key: 'auth' },
    { name: '创建漏斗', key: 'funnel' },
    { name: '第一步：关键洞察', key: 'step1' },
    { name: '第二步：策略选择', key: 'step2' },
    { name: '第三步：完整报告', key: 'step3' },
    { name: '报告列表', key: 'reports' }
  ];
  
  testItems.forEach(item => {
    const status = results[item.key] ? '✅ 通过' : '❌ 失败';
    console.log(`${item.name}: ${status}`);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log('\n' + '-'.repeat(60));
  console.log(`总计: ${passedCount}/${totalCount} 通过`);
  
  if (passedCount === totalCount) {
    log.success('\n🎉 恭喜！三步AI分析功能测试全部通过！');
  } else {
    log.warning('\n⚠️ 部分测试未通过，请检查相关功能');
  }
}

// 运行测试
runTest().catch(error => {
  log.error(`测试执行出错: ${error.message}`);
  console.error(error);
});