const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceResetAI() {
  try {
    console.log('🔥 强制清除所有AI分析记录...');
    
    // 获取特定的分析记录
    const targetAnalysis = await prisma.aiAnalysis.findUnique({
      where: {
        id: '511a50c3-43e7-43dc-adbe-18d258da0540'
      }
    });
    
    if (targetAnalysis) {
      console.log(`🎯 找到目标记录: ${targetAnalysis.id}`);
      console.log(`   - 用户ID: ${targetAnalysis.userId}`);
      console.log(`   - 漏斗ID: ${targetAnalysis.funnelId}`);
      console.log(`   - 步骤: ${targetAnalysis.step}`);
      console.log(`   - 创建时间: ${targetAnalysis.createdAt}`);
    } else {
      console.log('⚠️ 没有找到目标记录');
    }
    
    // 强制删除所有记录
    console.log('💥 强制删除所有AI分析记录...');
    const result = await prisma.aiAnalysis.deleteMany({});
    console.log(`✅ 删除了 ${result.count} 条记录`);
    
    // 验证清空
    const remaining = await prisma.aiAnalysis.findMany();
    console.log(`🔍 剩余记录数量: ${remaining.length}`);
    
    if (remaining.length > 0) {
      console.log('❌ 还有剩余记录，逐个删除:');
      for (const record of remaining) {
        await prisma.aiAnalysis.delete({
          where: { id: record.id }
        });
        console.log(`   - 删除: ${record.id}`);
      }
    }
    
    console.log('✅ AI分析表已完全清空！');
    
  } catch (error) {
    console.error('❌ 操作失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceResetAI();