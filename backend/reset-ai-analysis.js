const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetAIAnalysis() {
  try {
    console.log('🔥 开始清除所有AI分析记录...');
    
    // 获取所有AI分析记录
    const allAnalysis = await prisma.aiAnalysis.findMany({
      select: {
        id: true,
        userId: true,
        funnelId: true,
        step: true,
        createdAt: true
      }
    });
    
    console.log(`📊 找到 ${allAnalysis.length} 条AI分析记录:`);
    allAnalysis.forEach(analysis => {
      console.log(`  - ID: ${analysis.id.slice(0, 8)} | 漏斗: ${analysis.funnelId?.slice(0, 8)} | 步骤: ${analysis.step} | 创建时间: ${analysis.createdAt.toISOString()}`);
    });
    
    // 删除所有AI分析记录
    const deleteResult = await prisma.aiAnalysis.deleteMany({});
    console.log(`✅ 成功删除 ${deleteResult.count} 条AI分析记录`);
    
    console.log('🎯 清理完成！现在访问Dashboard会自动重新生成AI分析。');
    
  } catch (error) {
    console.error('❌ 重置AI分析失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAIAnalysis();