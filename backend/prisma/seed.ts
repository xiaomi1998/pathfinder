import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子数据植入...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@pathfinder.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@pathfinder.com',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });

  console.log('✅ 创建测试用户:', testUser.username);

  // 创建测试漏斗
  const testFunnel = await prisma.funnel.create({
    data: {
      userId: testUser.id,
      name: '示例销售漏斗',
      description: '这是一个示例销售漏斗，用于演示 Pathfinder 的功能',
      canvasData: {
        nodes: [
          {
            id: 'awareness-1',
            type: 'awareness',
            position: { x: 100, y: 100 },
            data: { label: '品牌认知' }
          },
          {
            id: 'acquisition-1',
            type: 'acquisition',
            position: { x: 300, y: 100 },
            data: { label: '获客渠道' }
          },
          {
            id: 'activation-1',
            type: 'activation',
            position: { x: 500, y: 100 },
            data: { label: '用户激活' }
          },
          {
            id: 'revenue-1',
            type: 'revenue',
            position: { x: 700, y: 100 },
            data: { label: '产生收入' }
          },
          {
            id: 'retention-1',
            type: 'retention',
            position: { x: 900, y: 100 },
            data: { label: '用户留存' }
          }
        ],
        edges: [
          { id: 'e1', source: 'awareness-1', target: 'acquisition-1' },
          { id: 'e2', source: 'acquisition-1', target: 'activation-1' },
          { id: 'e3', source: 'activation-1', target: 'revenue-1' },
          { id: 'e4', source: 'revenue-1', target: 'retention-1' }
        ]
      }
    },
  });

  console.log('✅ 创建测试漏斗:', testFunnel.name);

  // 创建漏斗节点
  const nodes = [
    { type: 'awareness', label: '品牌认知', positionX: 100, positionY: 100 },
    { type: 'acquisition', label: '获客渠道', positionX: 300, positionY: 100 },
    { type: 'activation', label: '用户激活', positionX: 500, positionY: 100 },
    { type: 'revenue', label: '产生收入', positionX: 700, positionY: 100 },
    { type: 'retention', label: '用户留存', positionX: 900, positionY: 100 }
  ];

  const createdNodes = [];
  for (const nodeData of nodes) {
    const node = await prisma.node.create({
      data: {
        funnelId: testFunnel.id,
        nodeType: nodeData.type as any,
        label: nodeData.label,
        positionX: nodeData.positionX,
        positionY: nodeData.positionY,
      },
    });
    createdNodes.push(node);
  }

  console.log('✅ 创建节点数量:', createdNodes.length);

  // 创建节点连接（边）
  const edges = [];
  for (let i = 0; i < createdNodes.length - 1; i++) {
    const sourceNode = createdNodes[i];
    const targetNode = createdNodes[i + 1];
    if (sourceNode && targetNode) {
      const edge = await prisma.edge.create({
        data: {
          funnelId: testFunnel.id,
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
        },
      });
      edges.push(edge);
    }
  }

  console.log('✅ 创建边数量:', edges.length);

  // 创建一些示例数据
  const currentWeek = new Date();
  currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay()); // 获取本周第一天
  currentWeek.setHours(0, 0, 0, 0);

  for (const node of createdNodes) {
    await prisma.nodeData.create({
      data: {
        nodeId: node.id,
        weekStartDate: currentWeek,
        entryCount: Math.floor(Math.random() * 1000) + 100,
        convertedCount: Math.floor(Math.random() * 800) + 50,
        conversionRate: 0.7 + Math.random() * 0.25, // 70-95% 转化率
      },
    });
  }

  console.log('✅ 创建示例数据完成');

  console.log('🎉 数据库种子数据植入完成！');
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