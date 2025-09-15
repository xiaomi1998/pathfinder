// 测试脚本：验证 onboarding 修复
// 在浏览器控制台运行这个脚本来模拟问题场景

console.log('=== 测试 Onboarding 修复 ===');

// 场景1：检查新用户（应该从第1步开始）
function testNewUser() {
  console.log('\n--- 测试场景1：新用户注册 ---');
  
  // 清空所有 sessionStorage
  sessionStorage.clear();
  console.log('✅ 清空了所有 sessionStorage');
  
  // 检查是否有遗留的步骤覆盖
  const stepOverride = sessionStorage.getItem('onboardingStepOverride');
  console.log('步骤覆盖值:', stepOverride || '无（正确）');
  
  console.log('请刷新页面并进入 /onboarding 路径');
  console.log('期望结果：应该从第1步（欢迎）开始');
}

// 场景2：检查有残留数据的情况（应该被清理）
function testWithStaleData() {
  console.log('\n--- 测试场景2：有残留数据 ---');
  
  // 设置一些残留数据
  sessionStorage.setItem('onboardingStepOverride', '2');
  sessionStorage.setItem('onboardingReturnComplete', 'true');
  // 但不设置 onboardingTemplate（模拟不完整的返回状态）
  
  console.log('✅ 设置了残留数据（不完整的返回状态）');
  console.log('请刷新页面并进入 /onboarding 路径');
  console.log('期望结果：应该从第1步开始（残留数据应被清理）');
}

// 场景3：正确的返回流程（应该跳到第3步）
function testValidReturn() {
  console.log('\n--- 测试场景3：从漏斗创建返回 ---');
  
  // 设置完整的返回数据
  sessionStorage.setItem('onboardingReturnComplete', 'true');
  sessionStorage.setItem('onboardingTemplate', 'saas');
  sessionStorage.setItem('onboardingOrgData', JSON.stringify({
    name: '测试公司',
    industry: 'technology',
    size: 'small'
  }));
  
  console.log('✅ 设置了完整的返回数据');
  console.log('请刷新页面并进入 /onboarding 路径');
  console.log('期望结果：应该跳到第3步（模板选择）');
}

// 显示当前 sessionStorage 状态
function showCurrentState() {
  console.log('\n--- 当前 SessionStorage 状态 ---');
  const keys = [
    'onboardingReturnComplete',
    'onboardingTemplate',
    'onboardingOrgData',
    'onboardingReturn',
    'funnelTemplate',
    'onboardingComplete',
    'onboardingStepOverride'
  ];
  
  keys.forEach(key => {
    const value = sessionStorage.getItem(key);
    if (value) {
      console.log(`${key}:`, value);
    }
  });
  
  const emptyKeys = keys.filter(key => !sessionStorage.getItem(key));
  if (emptyKeys.length === keys.length) {
    console.log('所有 onboarding 相关数据都为空（干净状态）');
  }
}

// 输出使用说明
console.log('\n可用的测试函数：');
console.log('- testNewUser()       // 测试新用户场景');
console.log('- testWithStaleData() // 测试有残留数据场景');
console.log('- testValidReturn()   // 测试正确返回场景');
console.log('- showCurrentState()  // 显示当前状态');

// 自动显示当前状态
showCurrentState();
