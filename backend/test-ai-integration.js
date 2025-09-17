const axios = require('axios');

// 测试配置
const API_BASE = 'http://localhost:3001/api';
let authToken = '';
let sessionId = '';

// 测试账号
const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#'
};

// 登录获取token
async function login() {
  try {
    console.log('1. 正在登录...');
    const response = await axios.post(`${API_BASE}/auth/login`, testUser);
    
    // 检查响应结构
    if (response.data.data?.access_token) {
      authToken = response.data.data.access_token;
    } else if (response.data.data?.token) {
      authToken = response.data.data.token;
    } else if (response.data.token) {
      authToken = response.data.token;
    } else if (response.data.access_token) {
      authToken = response.data.access_token;
    }
    
    console.log('✅ 登录成功，获取到token');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('用户不存在，尝试注册...');
      return await register();
    }
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 注册新用户
async function register() {
  try {
    console.log('正在注册新用户...');
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      password_confirmation: testUser.password,
      name: 'Test User',
      phone: '13800138000',
      verification_code: '123456',
      terms_accepted: true
    });
    
    // 检查响应结构
    if (response.data.data?.access_token) {
      authToken = response.data.data.access_token;
    } else if (response.data.data?.token) {
      authToken = response.data.data.token;
    } else if (response.data.token) {
      authToken = response.data.token;
    } else if (response.data.access_token) {
      authToken = response.data.access_token;
    }
    
    console.log('✅ 注册成功，获取到token');
    return true;
  } catch (error) {
    console.error('❌ 注册失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试AI聊天
async function testAIChat() {
  try {
    console.log('\n2. 测试AI聊天功能...');
    
    // 发送第一条消息（创建会话）
    const firstMessage = await axios.post(
      `${API_BASE}/ai/chat`,
      {
        message: '你好，请介绍一下什么是转化漏斗？',
        context: 'general'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ 第一条消息发送成功');
    console.log('AI回复:', firstMessage.data.data.message.substring(0, 100) + '...');
    sessionId = firstMessage.data.data.sessionId;
    console.log('会话ID:', sessionId);
    
    // 发送第二条消息（继续会话）
    const secondMessage = await axios.post(
      `${API_BASE}/ai/chat`,
      {
        message: '如何优化转化率？',
        sessionId: sessionId
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('\n✅ 第二条消息发送成功');
    console.log('AI回复:', secondMessage.data.data.message.substring(0, 100) + '...');
    
    if (secondMessage.data.data.suggestions?.length > 0) {
      console.log('建议:', secondMessage.data.data.suggestions);
    }
    
    return true;
  } catch (error) {
    console.error('❌ AI聊天测试失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取会话列表
async function testGetSessions() {
  try {
    console.log('\n3. 测试获取会话列表...');
    
    const response = await axios.get(
      `${API_BASE}/ai/sessions?page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ 获取会话列表成功');
    console.log('会话数量:', response.data.data.sessions.length);
    console.log('总数:', response.data.data.pagination.total);
    
    return true;
  } catch (error) {
    console.error('❌ 获取会话列表失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试获取会话详情
async function testGetSessionDetail() {
  try {
    console.log('\n4. 测试获取会话详情...');
    
    if (!sessionId) {
      console.log('⚠️ 没有会话ID，跳过此测试');
      return true;
    }
    
    const response = await axios.get(
      `${API_BASE}/ai/sessions/${sessionId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    console.log('✅ 获取会话详情成功');
    console.log('会话ID:', response.data.data.id);
    console.log('消息数量:', response.data.data.messages.length);
    console.log('会话上下文:', response.data.data.sessionContext);
    
    return true;
  } catch (error) {
    console.error('❌ 获取会话详情失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('='.repeat(50));
  console.log('🚀 开始测试Kimi AI集成');
  console.log('='.repeat(50));
  
  // 登录
  if (!await login()) {
    console.error('登录失败，终止测试');
    return;
  }
  
  // 运行测试
  const results = {
    chat: await testAIChat(),
    sessions: await testGetSessions(),
    sessionDetail: await testGetSessionDetail()
  };
  
  // 输出结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log('='.repeat(50));
  console.log('AI聊天功能:', results.chat ? '✅ 通过' : '❌ 失败');
  console.log('获取会话列表:', results.sessions ? '✅ 通过' : '❌ 失败');
  console.log('获取会话详情:', results.sessionDetail ? '✅ 通过' : '❌ 失败');
  
  const allPassed = Object.values(results).every(r => r);
  console.log('\n总体结果:', allPassed ? '✅ 所有测试通过！' : '❌ 部分测试失败');
  
  if (allPassed) {
    console.log('\n🎉 恭喜！Kimi K2 AI集成成功完成！');
    console.log('火山引擎Kimi API已正常工作。');
  }
}

// 运行测试
runTests().catch(console.error);