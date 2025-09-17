#!/usr/bin/env node
/**
 * 测试建议引擎系统的完整功能
 * 包括基准服务、诊断服务和建议引擎
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
const TEST_DATA = {
  companyData: {
    stage_1: { visitors: 1000, converted: 150, conversionRate: 15.0 },
    stage_2: { visitors: 150, converted: 45, conversionRate: 30.0 },
    stage_3: { visitors: 45, converted: 18, conversionRate: 40.0 },
    stage_4: { visitors: 18, converted: 9, conversionRate: 50.0 }
  },
  industry: 'software',
  companySize: 'medium',
  region: 'china'
};

let authToken = null;

// API 客户端
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加认证拦截器
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// 日志工具
const log = {
  info: (msg) => console.log(colors.blue('ℹ '), msg),
  success: (msg) => console.log(colors.green('✓'), msg),
  error: (msg) => console.log(colors.red('✗'), msg),
  warn: (msg) => console.log(colors.yellow('⚠ '), msg),
  section: (msg) => console.log(colors.cyan.bold(`\n=== ${msg} ===\n`))
};

// 测试函数
async function testLogin() {
  log.section('用户认证测试');
  
  try {
    // 尝试使用测试账户登录
    const response = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.data.token;
    log.success('用户登录成功');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log.warn('测试账户不存在，尝试创建...');
      return await createTestUser();
    }
    
    log.error(`登录失败: ${error.message}`);
    return false;
  }
}

async function createTestUser() {
  try {
    // 创建测试账户
    await api.post('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      organizationName: 'Test Organization'
    });
    
    log.success('测试账户创建成功');
    
    // 登录
    const response = await api.post('/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.data.token;
    log.success('登录测试账户成功');
    return true;
  } catch (error) {
    log.error(`创建测试账户失败: ${error.message}`);
    return false;
  }
}

async function testBenchmarkValidation() {
  log.section('基准数据验证测试');
  
  try {
    const response = await api.get(`/analysis/benchmark-validation/${TEST_DATA.industry}`);
    const validation = response.data.data;
    
    log.info(`行业: ${TEST_DATA.industry}`);
    log.info(`数据有效性: ${validation.isValid ? '有效' : '无效'}`);
    log.info(`样本量: ${validation.sampleSize}`);
    log.info(`最后更新: ${validation.lastUpdated || '无记录'}`);
    log.info(`缺失指标: ${validation.missingMetrics.length} 个`);
    
    if (validation.missingMetrics.length > 0) {
      log.warn(`缺失指标: ${validation.missingMetrics.join(', ')}`);
    }
    
    log.success('基准数据验证完成');
    return validation.isValid;
  } catch (error) {
    log.error(`基准数据验证失败: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testDiagnostics() {
  log.section('诊断分析测试');
  
  try {
    const response = await api.post('/analysis/diagnostics', TEST_DATA);
    const diagnostics = response.data.data;
    
    log.info(`总体评级: ${diagnostics.overallGrade}`);
    log.info(`健康度评分: ${diagnostics.healthScore.toFixed(1)}`);
    log.info(`薄弱环节: ${diagnostics.weakPoints.length} 个`);
    log.info(`改进优先级: ${diagnostics.improvementPriorities.length} 个`);
    
    // 显示各阶段评级
    console.log('各阶段评级:');
    Object.entries(diagnostics.stageGrades).forEach(([stage, grade]) => {
      console.log(`  ${getStageDisplayName(stage)}: ${grade.grade} (${grade.percentile}% - ${grade.status})`);
    });
    
    // 显示关键问题
    if (diagnostics.weakPoints.length > 0) {
      console.log('\n关键问题:');
      diagnostics.weakPoints.forEach((wp, index) => {
        console.log(`  ${index + 1}. ${getStageDisplayName(wp.stage)}: ${wp.description}`);
        console.log(`     当前: ${wp.currentRate.toFixed(1)}% | 基准: ${wp.benchmarkRate.toFixed(1)}% | 需改进: ${wp.improvementNeeded.toFixed(1)}%`);
      });
    }
    
    log.success('诊断分析完成');
    return diagnostics;
  } catch (error) {
    log.error(`诊断分析失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testRecommendations() {
  log.section('智能建议生成测试');
  
  try {
    const response = await api.post('/analysis/recommendations', {
      ...TEST_DATA,
      maxRecommendations: 8,
      includeCustomRules: true
    });
    const recommendations = response.data.data;
    
    log.info(`生成建议数量: ${recommendations.length}`);
    
    // 按优先级统计
    const priorityStats = recommendations.reduce((stats, rec) => {
      stats[rec.priority] = (stats[rec.priority] || 0) + 1;
      return stats;
    }, {});
    
    log.info(`优先级分布: 高=${priorityStats.high || 0}, 中=${priorityStats.medium || 0}, 低=${priorityStats.low || 0}`);
    
    // 显示前3个建议
    console.log('\n前3个建议:');
    recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`\n  ${index + 1}. ${rec.title}`);
      console.log(`     类别: ${getCategoryDisplayName(rec.category)}`);
      console.log(`     优先级: ${rec.priority} | 难度: ${rec.difficulty} | ROI: ${rec.roiEstimate.toFixed(1)}`);
      console.log(`     预期影响: ${rec.expectedImpact}`);
      console.log(`     实施时间: ${rec.implementationTime}`);
      if (rec.actionItems.length > 0) {
        console.log(`     关键行动: ${rec.actionItems[0]}`);
      }
    });
    
    log.success('智能建议生成完成');
    return recommendations;
  } catch (error) {
    log.error(`智能建议生成失败: ${error.response?.data?.error || error.message}`);
    return [];
  }
}

async function testPeerComparison() {
  log.section('同行对比测试');
  
  try {
    const response = await api.post('/analysis/peer-comparison', TEST_DATA);
    const comparison = response.data.data;
    
    log.info(`综合评级: ${comparison.performanceGrade}`);
    
    // 显示各阶段排名
    console.log('各阶段排名:');
    Object.entries(comparison.rankings).forEach(([stage, ranking]) => {
      console.log(`  ${getStageDisplayName(stage)}: ${ranking.percentile}% (${ranking.rank})`);
    });
    
    log.success('同行对比完成');
    return comparison;
  } catch (error) {
    log.error(`同行对比失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testImprovementPotential() {
  log.section('改进潜力测试');
  
  try {
    const response = await api.post('/analysis/improvement-potential', TEST_DATA);
    const potential = response.data.data;
    
    log.info(`整体改进潜力: +${potential.overallPotential.toFixed(1)}%`);
    
    // 显示各阶段改进潜力
    console.log('各阶段改进潜力:');
    ['stage_1', 'stage_2', 'stage_3', 'stage_4'].forEach(stage => {
      const stagePotential = potential[stage];
      if (stagePotential.potential > 0) {
        console.log(`  ${getStageDisplayName(stage)}: +${stagePotential.potential.toFixed(1)}% (影响: +${stagePotential.impact.toFixed(1)}%)`);
        console.log(`    当前: ${stagePotential.current.toFixed(1)}% -> 目标: ${stagePotential.benchmark.toFixed(1)}%`);
      }
    });
    
    log.success('改进潜力分析完成');
    return potential;
  } catch (error) {
    log.error(`改进潜力分析失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testComprehensiveAnalysis() {
  log.section('综合分析测试');
  
  try {
    const response = await api.post('/analysis/comprehensive', {
      ...TEST_DATA,
      includeRecommendations: true,
      includeDiagnostics: true,
      includePeerComparison: true,
      includeImprovementPotential: true,
      maxRecommendations: 10
    });
    const analysis = response.data.data;
    
    log.info('综合分析结果:');
    console.log(`  诊断数据: ${analysis.diagnostics ? '✓' : '✗'}`);
    console.log(`  建议数量: ${analysis.recommendations?.length || 0}`);
    console.log(`  同行对比: ${analysis.peerComparison ? '✓' : '✗'}`);
    console.log(`  改进潜力: ${analysis.improvementPotential ? '✓' : '✗'}`);
    console.log(`  分析时间: ${new Date(analysis.timestamp).toLocaleString('zh-CN')}`);
    
    log.success('综合分析完成');
    return analysis;
  } catch (error) {
    log.error(`综合分析失败: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

// 工具函数
function getStageDisplayName(stage) {
  const names = {
    stage_1: '线索生成',
    stage_2: '有效触达',
    stage_3: '商机转化',
    stage_4: '成交完成'
  };
  return names[stage] || stage;
}

function getCategoryDisplayName(category) {
  const names = {
    traffic_acquisition: '流量获取',
    landing_page_optimization: '页面优化',
    user_experience_improvement: '体验改进',
    content_optimization: '内容优化',
    technical_performance: '技术性能',
    personalization: '个性化',
    conversion_path_optimization: '路径优化',
    customer_service_improvement: '客户服务',
    pricing_strategy_adjustment: '定价策略'
  };
  return names[category] || category;
}

// 主测试流程
async function runTests() {
  console.log(colors.rainbow('🚀 智能建议引擎系统测试开始\n'));
  
  const startTime = Date.now();
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  // 测试用例
  const tests = [
    { name: '用户认证', fn: testLogin },
    { name: '基准数据验证', fn: testBenchmarkValidation },
    { name: '诊断分析', fn: testDiagnostics },
    { name: '智能建议生成', fn: testRecommendations },
    { name: '同行对比', fn: testPeerComparison },
    { name: '改进潜力分析', fn: testImprovementPotential },
    { name: '综合分析', fn: testComprehensiveAnalysis }
  ];
  
  for (const test of tests) {
    results.total++;
    
    try {
      const result = await test.fn();
      if (result !== false && result !== null && result !== undefined) {
        results.passed++;
        log.success(`${test.name} 测试通过`);
      } else {
        results.failed++;
        log.error(`${test.name} 测试失败`);
      }
    } catch (error) {
      results.failed++;
      log.error(`${test.name} 测试异常: ${error.message}`);
    }
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 显示测试结果
  log.section('测试结果');
  console.log(`总计: ${results.total}`);
  console.log(colors.green(`通过: ${results.passed}`));
  console.log(colors.red(`失败: ${results.failed}`));
  console.log(`耗时: ${duration}s`);
  
  if (results.failed === 0) {
    console.log(colors.green.bold('\n🎉 所有测试通过！建议引擎系统运行正常。\n'));
    process.exit(0);
  } else {
    console.log(colors.red.bold(`\n❌ 有 ${results.failed} 个测试失败，请检查系统配置。\n`));
    process.exit(1);
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log.error(`未捕获异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

// 启动测试
if (require.main === module) {
  runTests().catch((error) => {
    log.error(`测试执行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };