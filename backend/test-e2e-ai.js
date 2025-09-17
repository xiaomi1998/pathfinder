/**
 * 端到端AI功能测试
 * 测试从前端到后端的完整AI功能流程
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// 测试用户凭据
const testCredentials = {
  phone: '18812345678',
  password: 'Abcd1234!',
  name: 'AI测试用户',
  email: `aitest${Date.now()}@example.com`,
  verification_code: '123456',
  password_confirmation: 'Abcd1234!',
  terms_accepted: true
};

let authToken = null;
let userId = null;
let sessionId = null;
let funnelId = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, type = 'info') {
  const typeColors = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    header: colors.cyan
  };
  console.log(`${typeColors[type] || ''}${message}${colors.reset}`);
}

// 1. 注册或登录
async function authenticate() {
  log('\n📝 步骤1: 用户认证', 'header');
  
  try {
    // 先尝试登录
    const loginResp = await axios.post(`${API_BASE}/auth/login`, {
      email: testCredentials.phone,  // 登录接口使用email字段，但可以传入手机号
      password: testCredentials.password
    });
    
    authToken = loginResp.data.data?.access_token || 
                loginResp.data.data?.token || 
                loginResp.data.access_token || 
                loginResp.data.token;
    userId = loginResp.data.data?.user?.id || loginResp.data.data?.userId;
    
    log('✓ 登录成功', 'success');
    return true;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      log('用户不存在，尝试注册...', 'warning');
      
      try {
        const registerResp = await axios.post(`${API_BASE}/auth/register`, testCredentials);
        
        authToken = registerResp.data.data?.access_token || 
                   registerResp.data.data?.token || 
                   registerResp.data.access_token || 
                   registerResp.data.token;
        userId = registerResp.data.data?.user?.id || registerResp.data.data?.userId;
        
        log('✓ 注册成功', 'success');
        return true;
      } catch (regError) {
        log(`✗ 注册失败: ${regError.response?.data?.error || regError.message}`, 'error');
        return false;
      }
    }
    
    log(`✗ 登录失败: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

// 2. 创建测试漏斗
async function createTestFunnel() {
  log('\n🔧 步骤2: 创建测试漏斗', 'header');
  
  try {
    const funnelData = {
      name: `AI测试漏斗_${Date.now()}`,
      description: '用于测试AI功能的漏斗',
      dataPeriod: 'WEEKLY',
      nodes: [
        { id: 'node1', name: '访问', type: 'entry', value: 1000 },
        { id: 'node2', name: '注册', type: 'action', value: 800 },
        { id: 'node3', name: '激活', type: 'action', value: 600 },
        { id: 'node4', name: '付费', type: 'conversion', value: 300 }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' },
        { source: 'node3', target: 'node4' }
      ]
    };
    
    const response = await axios.post(
      `${API_BASE}/funnels`,
      funnelData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    funnelId = response.data.data.id;
    log(`✓ 漏斗创建成功 (ID: ${funnelId})`, 'success');
    return true;
  } catch (error) {
    log(`✗ 创建漏斗失败: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

// 3. 测试AI聊天
async function testAIChat() {
  log('\n💬 步骤3: 测试AI聊天功能', 'header');
  
  try {
    // 发送第一条消息
    log('发送消息: "分析一下我的转化漏斗"', 'info');
    
    const chatResp = await axios.post(
      `${API_BASE}/ai/chat`,
      {
        message: '请分析一下我的转化漏斗，给出优化建议',
        context: 'general',
        funnelId: funnelId
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (chatResp.data.success && chatResp.data.data) {
      sessionId = chatResp.data.data.sessionId;
      const aiMessage = chatResp.data.data.message;
      
      log('✓ AI响应成功', 'success');
      log(`会话ID: ${sessionId}`, 'info');
      log(`AI回复: ${aiMessage.substring(0, 150)}...`, 'info');
      
      // 发送后续消息
      log('\n发送跟进消息: "如何提升注册到激活的转化率？"', 'info');
      
      const followUpResp = await axios.post(
        `${API_BASE}/ai/chat`,
        {
          message: '如何提升注册到激活的转化率？',
          sessionId: sessionId
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      if (followUpResp.data.success) {
        log('✓ 后续对话成功', 'success');
        log(`AI建议: ${followUpResp.data.data.message.substring(0, 150)}...`, 'info');
      }
      
      return true;
    }
    
    log('✗ AI响应格式错误', 'error');
    return false;
  } catch (error) {
    log(`✗ AI聊天失败: ${error.response?.data?.error || error.message}`, 'error');
    if (error.response?.data) {
      console.log('错误详情:', error.response.data);
    }
    return false;
  }
}

// 4. 测试AI分析
async function testAIAnalysis() {
  log('\n📊 步骤4: 测试AI数据分析', 'header');
  
  try {
    const analysisResp = await axios.post(
      `${API_BASE}/ai/analyze`,
      {
        funnelId: funnelId,
        analysisType: 'comprehensive',
        timeRange: '30d'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (analysisResp.data.success && analysisResp.data.data) {
      const { insights, recommendations, summary } = analysisResp.data.data;
      
      log('✓ AI分析完成', 'success');
      log(`洞察数量: ${insights?.length || 0}`, 'info');
      log(`建议数量: ${recommendations?.length || 0}`, 'info');
      if (summary) {
        log(`分析摘要: ${summary.substring(0, 100)}...`, 'info');
      }
      
      return true;
    }
    
    log('✗ AI分析响应格式错误', 'error');
    return false;
  } catch (error) {
    log(`✗ AI分析失败: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

// 5. 测试会话管理
async function testSessionManagement() {
  log('\n📋 步骤5: 测试会话管理', 'header');
  
  try {
    // 获取会话列表
    const sessionsResp = await axios.get(
      `${API_BASE}/ai/sessions?page=1&limit=10`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (sessionsResp.data.success) {
      const sessions = sessionsResp.data.data.sessions;
      log(`✓ 获取会话列表成功 (共${sessions.length}个会话)`, 'success');
      
      // 如果有会话，获取详情
      if (sessionId) {
        const detailResp = await axios.get(
          `${API_BASE}/ai/sessions/${sessionId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (detailResp.data.success) {
          const messages = detailResp.data.data.messages;
          log(`✓ 获取会话详情成功 (${messages.length}条消息)`, 'success');
        }
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    log(`✗ 会话管理测试失败: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

// 主测试流程
async function runE2ETest() {
  log('\n' + '='.repeat(60), 'header');
  log('        🚀 Pathfinder AI功能端到端测试', 'header');
  log('='.repeat(60), 'header');
  
  const results = {
    auth: false,
    funnel: false,
    chat: false,
    analysis: false,
    sessions: false
  };
  
  // 执行测试步骤
  results.auth = await authenticate();
  if (!results.auth) {
    log('\n❌ 认证失败，无法继续测试', 'error');
    return;
  }
  
  results.funnel = await createTestFunnel();
  if (!results.funnel) {
    log('\n⚠️ 创建漏斗失败，部分功能可能无法测试', 'warning');
  }
  
  results.chat = await testAIChat();
  results.analysis = await testAIAnalysis();
  results.sessions = await testSessionManagement();
  
  // 输出测试结果
  log('\n' + '='.repeat(60), 'header');
  log('                 📊 测试结果汇总', 'header');
  log('='.repeat(60), 'header');
  
  const testItems = [
    { name: '用户认证', key: 'auth' },
    { name: '创建漏斗', key: 'funnel' },
    { name: 'AI聊天', key: 'chat' },
    { name: 'AI分析', key: 'analysis' },
    { name: '会话管理', key: 'sessions' }
  ];
  
  testItems.forEach(item => {
    const status = results[item.key] ? '✅ 通过' : '❌ 失败';
    const color = results[item.key] ? 'success' : 'error';
    log(`${item.name}: ${status}`, color);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  const allPassed = passedCount === totalCount;
  
  log('\n' + '-'.repeat(60), 'info');
  log(`总计: ${passedCount}/${totalCount} 通过`, allPassed ? 'success' : 'warning');
  
  if (allPassed) {
    log('\n🎉 恭喜！所有AI功能测试通过！', 'success');
    log('✅ Kimi K2 AI集成完全可用', 'success');
  } else {
    log('\n⚠️ 部分测试未通过，请检查相关功能', 'warning');
  }
}

// 运行测试
runE2ETest().catch(error => {
  log(`\n❌ 测试执行出错: ${error.message}`, 'error');
  console.error(error);
});