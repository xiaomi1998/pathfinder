import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdminUser() {
  try {
    console.log('开始创建管理员用户...');

    // 检查是否已经存在管理员用户
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: 'admin@pathfinder.com' }
    });

    if (existingAdmin) {
      console.log('管理员用户已存在，跳过创建');
      return;
    }

    // 创建默认管理员用户
    const passwordHash = await bcrypt.hash('admin123456', 12);
    
    const admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        email: 'admin@pathfinder.com',
        passwordHash,
        firstName: '系统',
        lastName: '管理员',
        role: 'super_admin',
        isActive: true
      }
    });

    console.log('✅ 管理员用户创建成功:');
    console.log(`   用户名: ${admin.username}`);
    console.log(`   邮箱: ${admin.email}`);
    console.log(`   密码: admin123456`);
    console.log(`   角色: ${admin.role}`);
    console.log('');
    console.log('⚠️  请在生产环境中修改默认密码！');

    // 创建一些示例AI使用记录和限制（可选）
    const users = await prisma.user.findMany({ take: 5 });
    
    if (users.length > 0) {
      console.log('\n开始创建示例AI使用数据...');
      
      for (const user of users) {
        // 创建AI使用限制
        await prisma.userAiLimit.create({
          data: {
            userId: user.id,
            dailyLimit: 100,
            monthlyLimit: 3000,
            currentDaily: Math.floor(Math.random() * 50),
            currentMonthly: Math.floor(Math.random() * 500)
          }
        });

        // 创建一些AI使用记录
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const usageTypes = ['chat', 'analysis', 'recommendation', 'general'] as const;
        
        for (let i = 0; i < 10; i++) {
          const randomDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
          const dateOnly = new Date(randomDate.getFullYear(), randomDate.getMonth(), randomDate.getDate());
          
          await prisma.userAiUsage.create({
            data: {
              userId: user.id,
              usageType: usageTypes[Math.floor(Math.random() * usageTypes.length)],
              requestCount: Math.floor(Math.random() * 5) + 1,
              tokenCount: Math.floor(Math.random() * 1000) + 100,
              cost: Math.random() * 0.1,
              usageDate: dateOnly
            }
          });
        }
      }
      
      console.log('✅ 示例AI使用数据创建成功');
    }

  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行种子函数
seedAdminUser()
  .then(() => {
    console.log('\n🎉 管理员数据种子完成！');
  })
  .catch((error) => {
    console.error('💥 管理员数据种子失败:', error);
    process.exit(1);
  });