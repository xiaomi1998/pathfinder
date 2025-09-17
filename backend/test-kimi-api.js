const axios = require('axios');

async function testKimiAPI() {
  const apiKey = 'fee42a7d-13d8-4d3e-98c5-81a56a2ac1df';
  const apiEndpoint = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  const modelName = 'kimi-k2-250905';

  try {
    console.log('Testing Kimi K2 API connection...');
    
    const response = await axios.post(
      apiEndpoint,
      {
        model: modelName,
        messages: [
          {
            role: 'system',
            content: '你是一个数据分析助手。'
          },
          {
            role: 'user',
            content: '请简单介绍一下转化漏斗的概念。'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('API Response Status:', response.status);
    console.log('Model Used:', response.data.model);
    
    if (response.data.choices && response.data.choices.length > 0) {
      console.log('\nAI Response:');
      console.log(response.data.choices[0].message.content);
      
      if (response.data.usage) {
        console.log('\nToken Usage:');
        console.log('- Prompt tokens:', response.data.usage.prompt_tokens);
        console.log('- Completion tokens:', response.data.usage.completion_tokens);
        console.log('- Total tokens:', response.data.usage.total_tokens);
      }
      
      console.log('\n✅ Kimi K2 API is working correctly!');
    } else {
      console.log('❌ No response from API');
    }
  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testKimiAPI();