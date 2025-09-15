const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 检查数据库中的数据...\n');
    
    // 检查用户
    console.log('1. 用户数据:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });
    console.log(`   找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.id.slice(0, 8)}) - ${user.email}`);
    });
    
    console.log('\n2. 漏斗数据:');
    const funnels = await prisma.funnel.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        createdAt: true
      }
    });
    console.log(`   找到 ${funnels.length} 个漏斗:`);
    funnels.forEach(funnel => {
      console.log(`   - ${funnel.name} (${funnel.id.slice(0, 8)}) - 用户: ${funnel.userId.slice(0, 8)}`);
    });
    
    console.log('\n3. 漏斗指标数据:');
    const funnelMetrics = await prisma.funnelMetrics.findMany({
      select: {
        id: true,
        funnelId: true,
        totalEntries: true,
        totalConversions: true,
        customMetrics: true,
        periodStartDate: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`   找到 ${funnelMetrics.length} 条漏斗指标:`);
    funnelMetrics.forEach((metric, index) => {
      console.log(`   ${index + 1}. 指标 ${metric.id.slice(0, 8)}:`);
      console.log(`      - 漏斗: ${metric.funnelId.slice(0, 8)}`);
      console.log(`      - 总进入: ${metric.totalEntries}`);
      console.log(`      - 总转化: ${metric.totalConversions}`);
      console.log(`      - 期间: ${metric.periodStartDate?.toISOString().split('T')[0]}`);
      console.log(`      - 创建: ${metric.createdAt.toISOString()}`);
      console.log(`      - 自定义指标: ${JSON.stringify(metric.customMetrics, null, 8)}`);
      console.log('');
    });
    
    console.log('\n4. AI分析数据:');
    const aiAnalysis = await prisma.aiAnalysis.findMany({
      select: {
        id: true,
        userId: true,
        funnelId: true,
        step: true,
        output: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`   找到 ${aiAnalysis.length} 条AI分析:`);
    aiAnalysis.forEach((analysis, index) => {
      console.log(`   ${index + 1}. 分析 ${analysis.id.slice(0, 8)}:`);
      console.log(`      - 用户: ${analysis.userId.slice(0, 8)}`);
      console.log(`      - 漏斗: ${analysis.funnelId.slice(0, 8)}`);
      console.log(`      - 步骤: ${analysis.step}`);
      console.log(`      - 创建: ${analysis.createdAt.toISOString()}`);
      if (analysis.output) {
        try {
          const output = typeof analysis.output === 'string' 
            ? JSON.parse(analysis.output) 
            : analysis.output;
          console.log(`      - 关键洞察: ${output?.key_insight?.summary || '无'}`);
        } catch (e) {
          console.log(`      - 输出: ${JSON.stringify(analysis.output).slice(0, 100)}...`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 检查数据库失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();