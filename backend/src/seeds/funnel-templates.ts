import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const industryTemplates = [
  {
    industry: 'technology',
    name: '科技/互联网漏斗',
    description: '适用于科技公司和互联网产品的用户转化漏斗',
    nodes: [
      { id: 'node_1', name: '访问产品页', type: 'start', label: '访问产品页', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '注册试用', type: 'stage', label: '注册试用', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '产品体验', type: 'stage', label: '产品体验', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '付费转化', type: 'end', label: '付费转化', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'finance',
    name: '金融/保险漏斗',
    description: '适用于金融和保险行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '了解产品', type: 'start', label: '了解产品', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '咨询服务', type: 'stage', label: '咨询服务', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '风险评估', type: 'stage', label: '风险评估', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约购买', type: 'end', label: '签约购买', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'healthcare',
    name: '医疗健康漏斗',
    description: '适用于医疗健康行业的患者服务漏斗',
    nodes: [
      { id: 'node_1', name: '症状咨询', type: 'start', label: '症状咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '预约挂号', type: 'stage', label: '预约挂号', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '诊断治疗', type: 'stage', label: '诊断治疗', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '康复随访', type: 'end', label: '康复随访', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'education',
    name: '教育培训漏斗',
    description: '适用于教育培训行业的学员转化漏斗',
    nodes: [
      { id: 'node_1', name: '了解课程', type: 'start', label: '了解课程', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '试听体验', type: 'stage', label: '试听体验', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '报名缴费', type: 'stage', label: '报名缴费', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成学习', type: 'end', label: '完成学习', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'retail',
    name: '零售/电商漏斗',
    description: '适用于零售电商行业的销售转化漏斗',
    nodes: [
      { id: 'node_1', name: '浏览商品', type: 'start', label: '浏览商品', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '加入购物车', type: 'stage', label: '加入购物车', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '结算付款', type: 'stage', label: '结算付款', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '完成购买', type: 'end', label: '完成购买', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'manufacturing',
    name: '制造业漏斗',
    description: '适用于制造业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '产品询价', type: 'start', label: '产品询价', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '技术沟通', type: 'stage', label: '技术沟通', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '报价谈判', type: 'stage', label: '报价谈判', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约合作', type: 'end', label: '签约合作', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'consulting',
    name: '咨询服务漏斗',
    description: '适用于咨询服务行业的客户获取漏斗',
    nodes: [
      { id: 'node_1', name: '需求咨询', type: 'start', label: '需求咨询', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '方案讨论', type: 'stage', label: '方案讨论', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '提案报价', type: 'stage', label: '提案报价', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约服务', type: 'end', label: '签约服务', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'media',
    name: '媒体/广告漏斗',
    description: '适用于媒体广告行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '内容曝光', type: 'start', label: '内容曝光', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '互动参与', type: 'stage', label: '互动参与', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '广告投放', type: 'stage', label: '广告投放', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '品牌转化', type: 'end', label: '品牌转化', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'real_estate',
    name: '房地产漏斗',
    description: '适用于房地产行业的客户转化漏斗',
    nodes: [
      { id: 'node_1', name: '房源浏览', type: 'start', label: '房源浏览', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '实地看房', type: 'stage', label: '实地看房', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '意向洽谈', type: 'stage', label: '意向洽谈', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '签约成交', type: 'end', label: '签约成交', color: '#EF4444', x: 700, y: 200 }
    ]
  },
  {
    industry: 'travel',
    name: '旅游/酒店漏斗',
    description: '适用于旅游酒店行业的客户预订漏斗',
    nodes: [
      { id: 'node_1', name: '浏览产品', type: 'start', label: '浏览产品', color: '#10B981', x: 100, y: 200 },
      { id: 'node_2', name: '比较选择', type: 'stage', label: '比较选择', color: '#3B82F6', x: 300, y: 200 },
      { id: 'node_3', name: '下单预订', type: 'stage', label: '下单预订', color: '#F59E0B', x: 500, y: 200 },
      { id: 'node_4', name: '确认入住', type: 'end', label: '确认入住', color: '#EF4444', x: 700, y: 200 }
    ]
  }
]

async function seedFunnelTemplates() {
  console.log('🌱 开始导入漏斗模板...')

  try {
    // 获取默认系统组织（用于存储系统模板）
    let systemOrg = await prisma.organization.findFirst({
      where: { name: 'System Templates' }
    })

    // 如果不存在系统组织，创建一个
    if (!systemOrg) {
      systemOrg = await prisma.organization.create({
        data: {
          name: 'System Templates',
          slug: 'system-templates',
          description: '系统默认模板组织',
          location: 'system'
        }
      })
    }

    // 获取第一个用户作为创建者（实际项目中应该是系统用户）
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      throw new Error('没有找到用户，请先创建用户账户')
    }

    // 为每个行业创建模板
    for (const template of industryTemplates) {
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

    console.log('🎉 漏斗模板导入完成！')
  } catch (error) {
    console.error('❌ 导入模板时出错:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 如果直接运行此文件
if (require.main === module) {
  seedFunnelTemplates()
    .then(() => {
      console.log('模板导入脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('模板导入失败:', error)
      process.exit(1)
    })
}

export { seedFunnelTemplates }