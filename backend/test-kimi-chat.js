// 简单的Kimi AI聊天测试
const axios = require('axios');

async function testKimiChat() {
  console.log('🚀 测试Kimi AI聊天功能\n');
  
  try {
    // 1. 先注册或登录获取token
    console.log('1. 获取认证token...');
    let token;
    
    // 尝试使用已知的测试账号登录
    try {
      const loginResp = await axios.post('http://localhost:3001/api/auth/login', {
        phone: '13800138000',
        password: 'Test123!@#'
      });
      token = loginResp.data.data?.access_token || loginResp.data.data?.token;
      console.log('✅ 登录成功');
    } catch (error) {
      console.log('登录失败，尝试其他认证方式...');
      // 如果登录失败，可以尝试其他方式
      return;
    }
    
    if (!token) {
      console.log('❌ 无法获取认证token');
      return;
    }
    
    // 2. 测试AI聊天
    console.log('\n2. 发送聊天消息到Kimi AI...');
    const chatResp = await axios.post(
      'http://localhost:3001/api/ai/chat',
      {
        message: '你好，请用简短的语言介绍一下什么是转化漏斗？',
        context: 'general'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ AI响应成功！');
    console.log('\n📝 AI回复:');
    console.log('-'.repeat(50));
    console.log(chatResp.data.data.message);
    console.log('-'.repeat(50));
    
    if (chatResp.data.data.sessionId) {
      console.log('\n会话ID:', chatResp.data.data.sessionId);
    }
    
    if (chatResp.data.data.suggestions?.length > 0) {
      console.log('\n💡 建议:');
      chatResp.data.data.suggestions.forEach((s, i) => {
        console.log(`${i + 1}. ${s}`);
      });
    }
    
    console.log('\n✅ Kimi K2 AI集成测试成功！');
    console.log('🎉 火山引擎API正常工作');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

// 直接测试API连接
async function testDirectAPI() {
  console.log('\n📡 直接测试Kimi API连接...\n');
  
  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        model: 'kimi-k2-250905',
        messages: [
          {
            role: 'user',
            content: '说"测试成功"'
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': 'Bearer fee42a7d-13d8-4d3e-98c5-81a56a2ac1df',
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.choices?.[0]?.message?.content) {
      console.log('✅ Kimi API直接连接成功');
      console.log('响应:', response.data.choices[0].message.content);
    }
  } catch (error) {
    console.error('❌ Kimi API连接失败:', error.message);
  }
}

// 运行测试
async function main() {
  console.log('='.repeat(60));
  console.log('          Kimi K2 AI 集成测试');
  console.log('='.repeat(60));
  
  // 先测试直接API连接
  await testDirectAPI();
  
  // 然后测试完整集成
  await testKimiChat();
}

main();