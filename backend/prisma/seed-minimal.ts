import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 最小化种子数据，用于快速开发测试
async function main() {
  console.log('🌱 开始最小化种子数据植入...');

  try {
    // 创建管理员用户
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@pathfinder.local' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@pathfinder.local',
        passwordHash: hashedPassword,
        firstName: '管理员',
        lastName: null,
        isActive: true,
        isEmailVerified: true,
      },
    });

    console.log('✅ 创建管理员用户:', adminUser.email);

    // 创建测试用户
    const testUser = await prisma.user.upsert({
      where: { email: 'test@pathfinder.local' },
      update: {},
      create: {
        username: 'testuser',
        email: 'test@pathfinder.local',
        passwordHash: hashedPassword,
        firstName: '测试用户',
        lastName: null,
        isActive: true,
        isEmailVerified: true,
      },
    });

    console.log('✅ 创建测试用户:', testUser.email);

    // 创建示例漏斗
    const demoFunnel = await prisma.funnel.create({
      data: {
        userId: testUser.id,
        name: '演示漏斗',
        description: '这是一个简单的演示漏斗',
        status: 'active',
        isTemplate: false,
        tags: ['演示', '测试'],
      },
    });

    console.log('✅ 创建演示漏斗:', demoFunnel.name);

    // 创建漏斗节点
    const nodes = await Promise.all([
      prisma.node.create({
        data: {
          funnelId: demoFunnel.id,
          nodeType: 'awareness',
          label: '认知阶段',
          positionX: 100,
          positionY: 100,
        },
      }),
      prisma.node.create({
        data: {
          funnelId: demoFunnel.id,
          nodeType: 'acquisition',
          label: '获取阶段',
          positionX: 300,
          positionY: 100,
        },
      }),
      prisma.node.create({
        data: {
          funnelId: demoFunnel.id,
          nodeType: 'activation',
          label: '激活阶段',
          positionX: 500,
          positionY: 100,
        },
      }),
      prisma.node.create({
        data: {
          funnelId: demoFunnel.id,
          nodeType: 'revenue',
          label: '收入阶段',
          positionX: 700,
          positionY: 100,
        },
      }),
    ]);

    console.log('✅ 创建节点数量:', nodes.length);

    // 创建节点连接
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const edge = await prisma.edge.create({
        data: {
          funnelId: demoFunnel.id,
          sourceNodeId: nodes[i].id,
          targetNodeId: nodes[i + 1].id,
        },
      });
      edges.push(edge);
    }

    console.log('✅ 创建连接数量:', edges.length);

    // 创建当前周的示例数据
    const currentWeek = new Date();
    currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    currentWeek.setHours(0, 0, 0, 0);

    const sampleData = [
      { entry: 1000, converted: 800, rate: 0.8 },
      { entry: 800, converted: 600, rate: 0.75 },
      { entry: 600, converted: 400, rate: 0.67 },
      { entry: 400, converted: 200, rate: 0.5 },
    ];

    for (let i = 0; i < nodes.length; i++) {
      await prisma.nodeData.create({
        data: {
          nodeId: nodes[i].id,
          weekStartDate: currentWeek,
          entryCount: sampleData[i].entry,
          convertedCount: sampleData[i].converted,
          conversionRate: sampleData[i].rate,
          revenue: i === 3 ? 50000.00 : null, // 只有收入节点有收入数据
          cost: sampleData[i].entry * 0.5, // 每个入口 0.5 元成本
        },
      });
    }

    console.log('✅ 创建示例数据完成');

    // 输出登录信息
    console.log('\n🎯 测试账户信息:');
    console.log('管理员: admin@pathfinder.local / admin123456');
    console.log('测试用户: test@pathfinder.local / admin123456');
    
    console.log('\n🎉 最小化种子数据植入完成！');
    
  } catch (error) {
    console.error('❌ 种子数据植入失败:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 执行失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });