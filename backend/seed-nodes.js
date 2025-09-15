const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNodes() {
  try {
    console.log('🌱 开始为漏斗创建示例节点...');

    // 获取所有现有漏斗
    const funnels = await prisma.funnel.findMany();
    console.log(`找到 ${funnels.length} 个漏斗`);

    for (const funnel of funnels) {
      console.log(`为漏斗 "${funnel.name}" 创建节点...`);

      // 删除现有节点（如果有）
      await prisma.node.deleteMany({
        where: { funnelId: funnel.id }
      });

      // 根据漏斗名称创建不同的节点结构
      let nodeData = [];

      if (funnel.name.includes('SaaS') || funnel.name.includes('用户转化')) {
        // SaaS 用户转化漏斗
        nodeData = [
          { label: '用户认知', nodeType: 'awareness', positionX: 100, positionY: 100 },
          { label: '获取用户', nodeType: 'acquisition', positionX: 300, positionY: 100 },
          { label: '激活账号', nodeType: 'activation', positionX: 500, positionY: 100 },
          { label: '付费转化', nodeType: 'revenue', positionX: 700, positionY: 100 },
          { label: '用户留存', nodeType: 'retention', positionX: 900, positionY: 100 }
        ];
      } else if (funnel.name.includes('电商') || funnel.name.includes('购买')) {
        // 电商购买漏斗
        nodeData = [
          { label: '品牌认知', nodeType: 'awareness', positionX: 100, positionY: 100 },
          { label: '获取流量', nodeType: 'acquisition', positionX: 300, positionY: 100 },
          { label: '用户激活', nodeType: 'activation', positionX: 500, positionY: 100 },
          { label: '完成购买', nodeType: 'revenue', positionX: 700, positionY: 100 },
          { label: '复购留存', nodeType: 'retention', positionX: 900, positionY: 100 }
        ];
      } else {
        // 通用漏斗 - 使用完整的5个阶段
        nodeData = [
          { label: '品牌认知', nodeType: 'awareness', positionX: 100, positionY: 100 },
          { label: '获取用户', nodeType: 'acquisition', positionX: 300, positionY: 100 },
          { label: '用户激活', nodeType: 'activation', positionX: 500, positionY: 100 },
          { label: '产生收入', nodeType: 'revenue', positionX: 700, positionY: 100 },
          { label: '用户留存', nodeType: 'retention', positionX: 900, positionY: 100 }
        ];
      }

      // 创建节点
      for (let i = 0; i < nodeData.length; i++) {
        const node = nodeData[i];
        await prisma.node.create({
          data: {
            funnelId: funnel.id,
            label: node.label,
            nodeType: node.nodeType,
            positionX: node.positionX,
            positionY: node.positionY
          }
        });
      }

      // 创建连接边
      const nodes = await prisma.node.findMany({
        where: { funnelId: funnel.id },
        orderBy: { positionX: 'asc' }
      });

      for (let i = 0; i < nodes.length - 1; i++) {
        await prisma.edge.create({
          data: {
            funnelId: funnel.id,
            sourceNodeId: nodes[i].id,
            targetNodeId: nodes[i + 1].id
          }
        });
      }

      console.log(`✅ 为漏斗 "${funnel.name}" 创建了 ${nodeData.length} 个节点和 ${nodeData.length - 1} 条边`);
    }

    console.log('🎉 节点数据创建完成！');
  } catch (error) {
    console.error('❌ 创建节点数据时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNodes();