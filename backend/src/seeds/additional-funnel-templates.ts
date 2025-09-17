import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const additionalIndustryTemplates = [
  {
    industry: 'automotive',
    name: '汽车行业漏斗',
    description: '适用于汽车行业的客户购买漏斗',
    nodes: [
      { id: 'node_1', name: '品牌关注', type: 'start', label: '品牌关注', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '试驾体验', type: 'stage', label: '试驾体验', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '配置选择', type: 'stage', label: '配置选择', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '购车成交', type: 'end', label: '购车成交', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'food',
    name: '餐饮/食品漏斗',
    description: '适用于餐饮食品行业的客户消费漏斗',
    nodes: [
      { id: 'node_1', name: '了解品牌', type: 'start', label: '了解品牌', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '菜品选择', type: 'stage', label: '菜品选择', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '下单支付', type: 'stage', label: '下单支付', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成消费', type: 'end', label: '完成消费', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'logistics',
    name: '物流/运输漏斗',
    description: '适用于物流运输行业的客户服务漏斗',
    nodes: [
      { id: 'node_1', name: '运输需求', type: 'start', label: '运输需求', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案报价', type: 'stage', label: '方案报价', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '签订合同', type: 'stage', label: '签订合同', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '服务交付', type: 'end', label: '服务交付', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'energy',
    name: '能源行业漏斗',
    description: '适用于能源行业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '需求评估', type: 'start', label: '需求评估', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案设计', type: 'stage', label: '方案设计', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '合同谈判', type: 'stage', label: '合同谈判', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '项目交付', type: 'end', label: '项目交付', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'government',
    name: '政府/公共漏斗',
    description: '适用于政府和公共服务的民众服务漏斗',
    nodes: [
      { id: 'node_1', name: '服务咨询', type: 'start', label: '服务咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '材料提交', type: 'stage', label: '材料提交', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '审核处理', type: 'stage', label: '审核处理', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '服务完成', type: 'end', label: '服务完成', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'ecommerce',
    name: '电商/零售漏斗',
    description: '适用于电商零售行业的购买转化漏斗',
    nodes: [
      { id: 'node_1', name: '商品浏览', type: 'start', label: '商品浏览', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '加入购物车', type: 'stage', label: '加入购物车', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '确认订单', type: 'stage', label: '确认订单', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '支付完成', type: 'end', label: '支付完成', color: '#EF4444', x: 700, y: 200 }
    ]
  }
]

async function seedAdditionalFunnelTemplates() {
  console.log('🌱 开始导入补充的漏斗模板...')

  try {
    // 获取默认系统组织
    const systemOrg = await prisma.organization.findFirst({
      where: { name: 'System Templates' }
    })

    if (!systemOrg) {
      throw new Error('未找到系统模板组织，请先运行基础模板种子脚本')
    }

    // 获取第一个用户作为创建者
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      throw new Error('没有找到用户，请先创建用户账户')
    }

    // 为每个行业创建模板
    for (const template of additionalIndustryTemplates) {
      // 检查是否已存在该行业的模板
      const existingTemplate = await prisma.funnelTemplate.findFirst({
        where: {
          name: template.name,
          organizationId: systemOrg.id,
          isDefault: true
        }
      })

      if (existingTemplate) {
        console.log(`⏭️  模板 "${template.name}" 已存在，跳过`)
        continue
      }

      // 生成连接配置
      const connections = template.nodes.slice(0, -1).map((node, index) => ({
        id: `conn_${index + 1}`,
        source: node.id,
        target: template.nodes[index + 1].id
      }))

      const templateData = {
        industry: template.industry,
        name: template.name,
        description: template.description,
        nodes: template.nodes,
        connections: connections
      }

      // 创建模板
      await prisma.funnelTemplate.create({
        data: {
          name: template.name,
          description: template.description,
          templateData: templateData,
          isDefault: true,
          organizationId: systemOrg.id,
          createdBy: firstUser.id
        }
      })

      console.log(`✅ 创建模板: ${template.name}`)
    }

    console.log('🎉 补充漏斗模板导入完成！')
  } catch (error) {
    console.error('❌ 导入补充模板时出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seedAdditionalFunnelTemplates()
    .then(() => {
      console.log('补充模板导入脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('补充模板导入失败:', error)
      process.exit(1)
    })
}

export { seedAdditionalFunnelTemplates }