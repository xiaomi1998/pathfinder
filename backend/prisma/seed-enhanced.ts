import { PrismaClient, NodeType, FunnelStatus, SessionContext } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 真实的漏斗模板数据
const FUNNEL_TEMPLATES = [
  {
    name: '电商销售漏斗',
    description: '典型的电子商务销售转化漏斗，从流量获取到最终购买',
    tags: ['电商', '销售', '转化'],
    nodes: [
      { type: 'awareness', label: '品牌曝光', position: { x: 100, y: 100 } },
      { type: 'acquisition', label: '网站访问', position: { x: 300, y: 100 } },
      { type: 'activation', label: '产品浏览', position: { x: 500, y: 100 } },
      { type: 'activation', label: '加入购物车', position: { x: 700, y: 100 } },
      { type: 'revenue', label: '完成支付', position: { x: 900, y: 100 } },
      { type: 'retention', label: '复购', position: { x: 1100, y: 100 } },
    ]
  },
  {
    name: 'SaaS 用户增长漏斗',
    description: 'SaaS 产品的用户获取和激活流程',
    tags: ['SaaS', '用户增长', 'B2B'],
    nodes: [
      { type: 'awareness', label: '内容营销', position: { x: 150, y: 50 } },
      { type: 'acquisition', label: '免费试用注册', position: { x: 350, y: 50 } },
      { type: 'activation', label: '首次产品使用', position: { x: 550, y: 50 } },
      { type: 'activation', label: '核心功能体验', position: { x: 750, y: 50 } },
      { type: 'revenue', label: '付费订阅', position: { x: 950, y: 50 } },
      { type: 'retention', label: '续约', position: { x: 1150, y: 50 } },
    ]
  },
  {
    name: '教育培训漏斗',
    description: '在线教育平台的学员转化路径',
    tags: ['教育', '培训', '在线学习'],
    nodes: [
      { type: 'awareness', label: '课程展示', position: { x: 120, y: 150 } },
      { type: 'acquisition', label: '免费课程试听', position: { x: 320, y: 150 } },
      { type: 'activation', label: '完整课程学习', position: { x: 520, y: 150 } },
      { type: 'revenue', label: '付费课程购买', position: { x: 720, y: 150 } },
      { type: 'retention', label: '课程完成', position: { x: 920, y: 150 } },
      { type: 'retention', label: '进阶课程', position: { x: 1120, y: 150 } },
    ]
  },
  {
    name: '移动应用获客漏斗',
    description: '移动应用从下载到留存的完整用户旅程',
    tags: ['移动应用', '用户获取', 'App'],
    nodes: [
      { type: 'awareness', label: 'ASO优化', position: { x: 80, y: 200 } },
      { type: 'acquisition', label: 'App下载', position: { x: 280, y: 200 } },
      { type: 'activation', label: '应用启动', position: { x: 480, y: 200 } },
      { type: 'activation', label: '完成注册', position: { x: 680, y: 200 } },
      { type: 'activation', label: '核心功能使用', position: { x: 880, y: 200 } },
      { type: 'revenue', label: '应用内购买', position: { x: 1080, y: 200 } },
      { type: 'retention', label: '7日留存', position: { x: 1280, y: 200 } },
    ]
  },
  {
    name: 'B2B 销售漏斗',
    description: 'B2B 企业级销售流程，从线索到成交',
    tags: ['B2B', '企业销售', '线索管理'],
    nodes: [
      { type: 'awareness', label: '市场推广', position: { x: 100, y: 250 } },
      { type: 'acquisition', label: '销售线索', position: { x: 300, y: 250 } },
      { type: 'activation', label: '销售沟通', position: { x: 500, y: 250 } },
      { type: 'activation', label: '产品演示', position: { x: 700, y: 250 } },
      { type: 'activation', label: '商务谈判', position: { x: 900, y: 250 } },
      { type: 'revenue', label: '合同签署', position: { x: 1100, y: 250 } },
      { type: 'retention', label: '客户成功', position: { x: 1300, y: 250 } },
    ]
  }
];

// 模拟真实的数据变化趋势
const generateRealisticData = (nodeIndex: number, totalNodes: number, weekOffset: number = 0) => {
  const baseEntry = 1000 - (nodeIndex * 150); // 递减的入口流量
  const seasonalFactor = 0.8 + 0.4 * Math.sin((weekOffset / 52) * 2 * Math.PI); // 季节性波动
  const randomFactor = 0.8 + Math.random() * 0.4; // 随机波动
  const weeklyTrend = Math.max(0.5, 1 - (weekOffset / 100)); // 长期趋势
  
  const entryCount = Math.max(50, Math.floor(baseEntry * seasonalFactor * randomFactor * weeklyTrend));
  const conversionRate = Math.max(0.1, Math.min(0.95, 0.7 - (nodeIndex * 0.1) + (Math.random() - 0.5) * 0.2));
  const convertedCount = Math.floor(entryCount * conversionRate);
  const bounceCount = Math.floor(entryCount * (0.1 + Math.random() * 0.3));
  const avgTimeSpent = Math.floor(300 + Math.random() * 1800); // 5-35分钟
  const revenue = nodeIndex >= 3 ? convertedCount * (50 + Math.random() * 200) : null;
  const cost = entryCount * (0.5 + Math.random() * 2);

  return {
    entryCount,
    convertedCount,
    conversionRate,
    bounceCount,
    avgTimeSpent,
    revenue,
    cost
  };
};

// 生成多样化的用户数据
const generateUsers = async (count: number = 10) => {
  const users = [];
  const domains = ['gmail.com', 'outlook.com', 'company.com', 'startup.io', 'business.net'];
  const firstNames = ['张三', '李四', '王五', '赵六', 'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank'];
  const lastNames = ['', '', '', '', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
  const hashedPassword = await bcrypt.hash('password123', 12);

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const domain = domains[i % domains.length];
    const username = `user_${i + 1}_${Date.now()}`;
    const email = `${username}@${domain}`;

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName: lastName || null,
        avatar: i % 3 === 0 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` : null,
        isActive: i % 10 !== 9, // 90% 活跃用户
        isEmailVerified: i % 4 !== 3, // 75% 邮箱验证用户
        lastLoginAt: i % 5 === 0 ? null : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
    
    users.push(user);
  }
  
  return users;
};

// 为用户创建多样化的漏斗
const createFunnelsForUsers = async (users: any[]) => {
  const allFunnels = [];
  
  for (const user of users) {
    // 每个用户创建 1-3 个漏斗
    const funnelCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < funnelCount; i++) {
      const template = FUNNEL_TEMPLATES[Math.floor(Math.random() * FUNNEL_TEMPLATES.length)];
      const isTemplate = i === 0 && Math.random() < 0.3; // 30% 概率设为模板
      
      const funnel = await prisma.funnel.create({
        data: {
          userId: user.id,
          name: `${template.name} - ${user.username}`,
          description: template.description,
          status: ['draft', 'active', 'archived'][Math.floor(Math.random() * 3)] as FunnelStatus,
          isTemplate,
          tags: template.tags,
          canvasData: {
            nodes: template.nodes,
            edges: template.nodes.slice(0, -1).map((_, idx) => ({
              id: `edge-${idx}`,
              source: `node-${idx}`,
              target: `node-${idx + 1}`
            }))
          }
        },
      });

      // 创建节点
      const nodes = [];
      for (let nodeIndex = 0; nodeIndex < template.nodes.length; nodeIndex++) {
        const nodeTemplate = template.nodes[nodeIndex];
        const node = await prisma.node.create({
          data: {
            funnelId: funnel.id,
            nodeType: nodeTemplate.type as NodeType,
            label: nodeTemplate.label,
            positionX: nodeTemplate.position.x,
            positionY: nodeTemplate.position.y,
          },
        });
        nodes.push(node);
      }

      // 创建边连接
      for (let edgeIndex = 0; edgeIndex < nodes.length - 1; edgeIndex++) {
        await prisma.edge.create({
          data: {
            funnelId: funnel.id,
            sourceNodeId: nodes[edgeIndex].id,
            targetNodeId: nodes[edgeIndex + 1].id,
          },
        });
      }

      // 为活跃漏斗生成历史数据
      if (funnel.status === 'active') {
        await generateHistoricalData(nodes);
      }

      allFunnels.push({ funnel, nodes });
    }
  }
  
  return allFunnels;
};

// 生成历史数据（过去12周）
const generateHistoricalData = async (nodes: any[]) => {
  const weeks = 12;
  
  for (let weekOffset = weeks - 1; weekOffset >= 0; weekOffset--) {
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - (weekOffset * 7) - weekStartDate.getDay());
    weekStartDate.setHours(0, 0, 0, 0);

    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
      const data = generateRealisticData(nodeIndex, nodes.length, weekOffset);
      
      await prisma.nodeData.create({
        data: {
          nodeId: nodes[nodeIndex].id,
          weekStartDate,
          ...data,
        },
      });
    }
  }
};

// 创建AI会话和消息
const createAISessions = async (users: any[], funnels: any[]) => {
  const sessionContexts = Object.values(SessionContext);
  const sampleMessages = {
    [SessionContext.invitation]: [
      { role: 'user', content: '我需要优化我的漏斗转化率' },
      { role: 'assistant', content: '我来帮您分析漏斗数据。从您的数据来看，第3个节点的转化率较低，建议重点优化。' },
      { role: 'user', content: '具体应该怎么优化？' },
      { role: 'assistant', content: '建议从以下几个方面：1. 优化页面加载速度 2. 简化操作流程 3. 增加引导提示' },
    ],
    [SessionContext.objection_handling]: [
      { role: 'user', content: '客户说产品太贵了，怎么处理？' },
      { role: 'assistant', content: '价格异议很常见。可以通过展示产品价值、ROI计算、分期付款等方式来处理。' },
      { role: 'user', content: '能给个具体的话术吗？' },
      { role: 'assistant', content: '"我理解您的考虑。让我们一起计算一下投资回报率..."' },
    ],
    [SessionContext.general]: [
      { role: 'user', content: '如何提高漏斗的整体效果？' },
      { role: 'assistant', content: '提高漏斗效果需要从数据分析开始，找出瓶颈环节，然后针对性优化。' },
    ]
  };

  for (const user of users.slice(0, 5)) { // 只为部分用户创建AI会话
    const userFunnels = funnels.filter(f => f.funnel.userId === user.id);
    
    // 创建1-3个AI会话
    const sessionCount = 1 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < sessionCount; i++) {
      const context = sessionContexts[Math.floor(Math.random() * sessionContexts.length)];
      const funnel = userFunnels[Math.floor(Math.random() * userFunnels.length)];
      
      const session = await prisma.aiSession.create({
        data: {
          userId: user.id,
          funnelId: funnel ? funnel.funnel.id : null,
          sessionContext: context,
          endedAt: Math.random() < 0.7 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        },
      });

      // 添加消息
      const messages = sampleMessages[context] || sampleMessages[SessionContext.general];
      for (const message of messages) {
        await prisma.aiMessage.create({
          data: {
            sessionId: session.id,
            role: message.role as any,
            content: message.content,
            createdAt: new Date(session.createdAt.getTime() + Math.random() * 60 * 60 * 1000),
          },
        });
      }
    }
  }
};

// 创建审计日志
const createAuditLogs = async (users: any[]) => {
  const operations = ['INSERT', 'UPDATE', 'DELETE'];
  const tables = ['funnels', 'nodes', 'node_data', 'users'];
  
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const tableName = tables[Math.floor(Math.random() * tables.length)];
    
    await prisma.auditLog.create({
      data: {
        tableName,
        operation: operation as any,
        oldValues: operation === 'UPDATE' ? { status: 'draft' } : null,
        newValues: operation !== 'DELETE' ? { status: 'active' } : null,
        userId: user.id,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }
};

// 主执行函数
async function main() {
  console.log('🌱 开始增强版数据库种子数据植入...');

  try {
    // 清理现有数据
    console.log('🧹 清理现有数据...');
    await prisma.auditLog.deleteMany();
    await prisma.aiMessage.deleteMany();
    await prisma.aiSession.deleteMany();
    await prisma.nodeData.deleteMany();
    await prisma.edge.deleteMany();
    await prisma.node.deleteMany();
    await prisma.funnel.deleteMany();
    await prisma.user.deleteMany();

    // 创建用户
    console.log('👥 创建用户...');
    const users = await generateUsers(10);
    console.log(`✅ 创建了 ${users.length} 个用户`);

    // 创建漏斗和节点
    console.log('📊 创建漏斗和节点...');
    const funnels = await createFunnelsForUsers(users);
    console.log(`✅ 创建了 ${funnels.length} 个漏斗`);

    // 创建AI会话
    console.log('🤖 创建AI会话...');
    await createAISessions(users, funnels);
    console.log('✅ 创建AI会话完成');

    // 创建审计日志
    console.log('📝 创建审计日志...');
    await createAuditLogs(users);
    console.log('✅ 创建审计日志完成');

    // 输出统计信息
    const stats = {
      users: await prisma.user.count(),
      funnels: await prisma.funnel.count(),
      nodes: await prisma.node.count(),
      edges: await prisma.edge.count(),
      nodeData: await prisma.nodeData.count(),
      aiSessions: await prisma.aiSession.count(),
      aiMessages: await prisma.aiMessage.count(),
      auditLogs: await prisma.auditLog.count(),
    };

    console.log('📊 数据统计:');
    console.log(`   用户: ${stats.users}`);
    console.log(`   漏斗: ${stats.funnels}`);
    console.log(`   节点: ${stats.nodes}`);
    console.log(`   连接: ${stats.edges}`);
    console.log(`   节点数据: ${stats.nodeData}`);
    console.log(`   AI会话: ${stats.aiSessions}`);
    console.log(`   AI消息: ${stats.aiMessages}`);
    console.log(`   审计日志: ${stats.auditLogs}`);

    console.log('🎉 增强版数据库种子数据植入完成！');
    
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