import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 面试专用种子数据脚本
 * 创建更丰富的测试数据，包含多个漏斗、历史数据等
 */

async function main() {
  console.log('🎯 开始面试专用数据库种子数据植入...');

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    await prisma.nodeData.deleteMany();
    await prisma.edge.deleteMany();
    await prisma.node.deleteMany();
    await prisma.funnel.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 清理现有数据完成');
  }

  // 创建面试官和候选人测试账户
  const accounts = [
    {
      username: 'interviewer',
      email: 'interviewer@pathfinder.com',
      password: 'interviewer123',
      role: 'admin'
    },
    {
      username: 'candidate',
      email: 'candidate@pathfinder.com', 
      password: 'candidate123',
      role: 'user'
    },
    {
      username: 'demo_user',
      email: 'demo@pathfinder.com',
      password: 'demo123',
      role: 'user'
    }
  ];

  const users = [];
  for (const account of accounts) {
    const hashedPassword = await bcrypt.hash(account.password, 12);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        username: account.username,
        email: account.email,
        passwordHash: hashedPassword,
        isActive: true,
      },
    });
    users.push(user);
    console.log(`✅ 创建用户: ${user.username} (${account.role})`);
  }

  // 创建多个示例漏斗
  const funnelTemplates = [
    {
      name: 'SaaS产品销售漏斗',
      description: '典型的SaaS产品销售转化流程，从潜在客户到付费用户',
      nodes: [
        { type: 'awareness', label: '广告展示', position: { x: 100, y: 200 } },
        { type: 'acquisition', label: '网站访问', position: { x: 300, y: 200 } },
        { type: 'activation', label: '注册试用', position: { x: 500, y: 200 } },
        { type: 'activation', label: '产品演示', position: { x: 700, y: 200 } },
        { type: 'revenue', label: '付费转化', position: { x: 900, y: 200 } },
        { type: 'retention', label: '续费留存', position: { x: 1100, y: 200 } }
      ],
      mockData: [
        { entryRange: [10000, 12000], convertedRange: [300, 500] },
        { entryRange: [300, 500], convertedRange: [150, 250] },
        { entryRange: [150, 250], convertedRange: [80, 120] },
        { entryRange: [80, 120], convertedRange: [40, 60] },
        { entryRange: [40, 60], convertedRange: [20, 35] },
        { entryRange: [20, 35], convertedRange: [16, 28] }
      ]
    },
    {
      name: '电商购买转化漏斗',
      description: '电商平台用户从浏览到购买的完整转化路径',
      nodes: [
        { type: 'awareness', label: '商品浏览', position: { x: 100, y: 300 } },
        { type: 'acquisition', label: '加入购物车', position: { x: 350, y: 300 } },
        { type: 'activation', label: '填写信息', position: { x: 600, y: 300 } },
        { type: 'revenue', label: '完成付款', position: { x: 850, y: 300 } }
      ],
      mockData: [
        { entryRange: [5000, 8000], convertedRange: [800, 1200] },
        { entryRange: [800, 1200], convertedRange: [200, 400] },
        { entryRange: [200, 400], convertedRange: [150, 300] },
        { entryRange: [150, 300], convertedRange: [120, 240] }
      ]
    },
    {
      name: '企业服务销售漏斗',
      description: '面向企业客户的服务销售流程，包含多轮沟通',
      nodes: [
        { type: 'awareness', label: '线索获取', position: { x: 100, y: 100 } },
        { type: 'acquisition', label: '电话初筛', position: { x: 280, y: 100 } },
        { type: 'acquisition', label: '添加微信', position: { x: 460, y: 100 } },
        { type: 'activation', label: '需求调研', position: { x: 640, y: 100 } },
        { type: 'activation', label: '方案演示', position: { x: 820, y: 100 } },
        { type: 'revenue', label: '商务谈判', position: { x: 1000, y: 100 } },
        { type: 'revenue', label: '签约成交', position: { x: 1180, y: 100 } }
      ],
      mockData: [
        { entryRange: [500, 800], convertedRange: [200, 350] },
        { entryRange: [200, 350], convertedRange: [120, 200] },
        { entryRange: [120, 200], convertedRange: [80, 140] },
        { entryRange: [80, 140], convertedRange: [50, 90] },
        { entryRange: [50, 90], convertedRange: [30, 60] },
        { entryRange: [30, 60], convertedRange: [15, 35] },
        { entryRange: [15, 35], convertedRange: [8, 20] }
      ]
    }
  ];

  // 为每个用户创建漏斗
  for (let userIndex = 0; userIndex < users.length; userIndex++) {
    const user = users[userIndex];
    const template = funnelTemplates[userIndex % funnelTemplates.length];
    
    // 创建漏斗
    const funnel = await prisma.funnel.create({
      data: {
        userId: user.id,
        name: template.name,
        description: template.description,
        canvasData: {
          nodes: template.nodes.map((node, index) => ({
            id: `node-${index + 1}`,
            type: node.type,
            position: node.position,
            data: { label: node.label }
          })),
          edges: template.nodes.slice(0, -1).map((_, index) => ({
            id: `edge-${index + 1}`,
            source: `node-${index + 1}`,
            target: `node-${index + 2}`
          }))
        }
      },
    });

    console.log(`✅ 创建漏斗: ${funnel.name} (用户: ${user.username})`);

    // 创建节点
    const createdNodes = [];
    for (let i = 0; i < template.nodes.length; i++) {
      const nodeTemplate = template.nodes[i];
      const node = await prisma.node.create({
        data: {
          funnelId: funnel.id,
          nodeType: nodeTemplate.type as any,
          label: nodeTemplate.label,
          positionX: nodeTemplate.position.x,
          positionY: nodeTemplate.position.y,
        },
      });
      createdNodes.push(node);
    }

    // 创建边
    for (let i = 0; i < createdNodes.length - 1; i++) {
      await prisma.edge.create({
        data: {
          funnelId: funnel.id,
          sourceNodeId: createdNodes[i].id,
          targetNodeId: createdNodes[i + 1].id,
        },
      });
    }

    // 创建历史数据（最近12周）
    const currentDate = new Date();
    for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);

      for (let nodeIndex = 0; nodeIndex < createdNodes.length; nodeIndex++) {
        const node = createdNodes[nodeIndex];
        const mockData = template.mockData[nodeIndex];
        
        // 添加一些随机性和趋势
        const trendFactor = 1 + (Math.sin(weekOffset / 12 * Math.PI) * 0.2); // 季节性波动
        const randomFactor = 0.8 + Math.random() * 0.4; // ±20% 随机波动
        
        const entryCount = Math.floor(
          (mockData.entryRange[0] + Math.random() * 
          (mockData.entryRange[1] - mockData.entryRange[0])) * 
          trendFactor * randomFactor
        );
        
        const convertedCount = Math.floor(
          Math.min(entryCount, 
            (mockData.convertedRange[0] + Math.random() * 
            (mockData.convertedRange[1] - mockData.convertedRange[0])) * 
            trendFactor * randomFactor
          )
        );

        const conversionRate = entryCount > 0 ? convertedCount / entryCount : 0;

        await prisma.nodeData.create({
          data: {
            nodeId: node.id,
            weekStartDate: weekStart,
            entryCount: entryCount,
            convertedCount: convertedCount,
            conversionRate: conversionRate,
          },
        });
      }
    }

    console.log(`✅ 为漏斗 "${template.name}" 创建了 ${createdNodes.length} 个节点和 12 周历史数据`);
  }

  console.log('🎉 面试专用数据库种子数据植入完成！');
  console.log('\n📋 测试账户信息:');
  accounts.forEach(account => {
    console.log(`- ${account.username}: ${account.email} / ${account.password}`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 种子数据植入失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });