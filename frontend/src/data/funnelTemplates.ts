// Funnel Templates Data - Extracted from funnel-templates.html
export interface FunnelTemplate {
  id: string;
  title: string;
  desc: string;
  icon: string;
  iconBg: string;
  industry: string;
  function: string;
  difficulty: string;
  stages: string[];
  stats: {
    usage: string;
    conversion: string;
    cycle: string;
  };
  recommended: boolean;
  details?: {
    description: string;
    stages_detail: Array<{
      name: string;
      desc: string;
      benchmark: string;
    }>;
    kpis: string[];
    best_practices: string[];
  };
}

// Industry classification system
export const INDUSTRIES = {
  saas: 'SaaS软件',
  ecommerce: '电商零售',
  education: '在线教育',
  finance: '金融服务',
  healthcare: '医疗健康',
  realestate: '房地产',
  consulting: '咨询服务'
} as const;

// Function classification system
export const FUNCTIONS = {
  sales: '销售转化',
  marketing: '营销获客',
  retention: '用户留存',
  activation: '用户激活',
  referral: '推荐传播',
  support: '客户服务'
} as const;

// Helper function to get industry name
export const getIndustryName = (industry: string): string => {
  return INDUSTRIES[industry as keyof typeof INDUSTRIES] || industry;
};

// Helper function to get function name
export const getFunctionName = (func: string): string => {
  return FUNCTIONS[func as keyof typeof FUNCTIONS] || func;
};

// Helper function to get stage colors
export const getStageColor = (index: number, dark = false): string => {
  const colors = [
    dark ? '#003db7' : '#0052d9',
    dark ? '#059669' : '#10b981',
    dark ? '#d97706' : '#f59e0b',
    dark ? '#7c3aed' : '#8b5cf6',
    dark ? '#dc2626' : '#ef4444',
    dark ? '#0369a1' : '#0284c7',
    dark ? '#9333ea' : '#a855f7'
  ];
  return colors[index % colors.length];
};

// Main templates data
export const FUNNEL_TEMPLATES: Record<string, FunnelTemplate> = {
  // SaaS软件行业模板
  saas_trial: {
    id: 'saas_trial',
    title: 'SaaS免费试用转化',
    desc: '从注册试用到付费订阅的完整转化流程，适合订阅制SaaS产品',
    icon: '💻',
    iconBg: '#0052d9',
    industry: 'saas',
    function: 'sales',
    difficulty: '简单',
    stages: ['试用注册', '产品激活', '深度使用', '付费升级'],
    stats: {
      usage: '2.3k',
      conversion: '15.2%',
      cycle: '14天'
    },
    recommended: true,
    details: {
      description: '这是专为SaaS产品设计的试用转付费漏斗模板，帮助您跟踪用户从注册试用到成为付费客户的完整旅程。',
      stages_detail: [
        { name: '试用注册', desc: '用户填写信息完成免费试用注册', benchmark: '基准转化率: 85-95%' },
        { name: '产品激活', desc: '用户首次登录并完成关键操作', benchmark: '基准转化率: 60-80%' },
        { name: '深度使用', desc: '用户持续使用核心功能7天以上', benchmark: '基准转化率: 25-45%' },
        { name: '付费升级', desc: '用户从试用转为付费订阅', benchmark: '基准转化率: 15-25%' }
      ],
      kpis: ['试用转化率', '激活率', '7日留存率', '付费转化率', 'ARPU', 'LTV'],
      best_practices: [
        '优化注册流程，减少表单字段',
        '设计新手引导，快速展示核心价值',
        '建立用户行为数据追踪',
        '制定个性化的付费引导策略'
      ]
    }
  },

  saas_onboarding: {
    id: 'saas_onboarding',
    title: 'SaaS用户激活漏斗',
    desc: '新用户从注册到首次成功使用产品的激活流程',
    icon: '🚀',
    iconBg: '#10b981',
    industry: 'saas',
    function: 'activation',
    difficulty: '中等',
    stages: ['账号注册', '邮箱验证', '信息完善', '引导体验', '首次成功'],
    stats: {
      usage: '1.8k',
      conversion: '42.6%',
      cycle: '3天'
    },
    recommended: false
  },

  // 电商零售行业模板
  ecommerce_purchase: {
    id: 'ecommerce_purchase',
    title: '电商购买转化漏斗',
    desc: '从商品浏览到完成购买的电商标准转化流程',
    icon: '🛒',
    iconBg: '#f59e0b',
    industry: 'ecommerce',
    function: 'sales',
    difficulty: '简单',
    stages: ['商品浏览', '加入购物车', '结算页面', '支付完成'],
    stats: {
      usage: '3.1k',
      conversion: '3.2%',
      cycle: '1天'
    },
    recommended: true,
    details: {
      description: '电商平台标准购买漏斗，追踪用户从浏览商品到完成支付的完整购买路径。',
      stages_detail: [
        { name: '商品浏览', desc: '用户浏览商品详情页面', benchmark: '基准转化率: 20-30%' },
        { name: '加入购物车', desc: '用户将商品添加到购物车', benchmark: '基准转化率: 60-70%' },
        { name: '结算页面', desc: '用户进入结算流程', benchmark: '基准转化率: 70-80%' },
        { name: '支付完成', desc: '用户成功完成支付', benchmark: '基准转化率: 85-95%' }
      ],
      kpis: ['浏览转化率', '购物车转化率', '结算转化率', '支付成功率', 'AOV', '复购率'],
      best_practices: [
        '优化商品详情页设计和图片质量',
        '简化购物车和结算流程',
        '提供多种支付方式',
        '设置购物车放弃提醒机制'
      ]
    }
  },

  ecommerce_retention: {
    id: 'ecommerce_retention',
    title: '电商用户留存漏斗',
    desc: '追踪首次购买用户的复购行为和留存情况',
    icon: '🔄',
    iconBg: '#8b5cf6',
    industry: 'ecommerce',
    function: 'retention',
    difficulty: '中等',
    stages: ['首次购买', '7天活跃', '30天复购', '会员升级'],
    stats: {
      usage: '1.4k',
      conversion: '28.5%',
      cycle: '30天'
    },
    recommended: false
  },

  // 在线教育行业模板
  education_course: {
    id: 'education_course',
    title: '在线课程报名转化',
    desc: '从课程了解到付费报名的教育产品转化漏斗',
    icon: '📚',
    iconBg: '#ef4444',
    industry: 'education',
    function: 'sales',
    difficulty: '简单',
    stages: ['课程浏览', '试听体验', '咨询互动', '付费报名'],
    stats: {
      usage: '980',
      conversion: '12.8%',
      cycle: '7天'
    },
    recommended: false,
    details: {
      description: '专为在线教育设计的课程销售漏斗，帮助跟踪学员从了解课程到付费报名的转化过程。',
      stages_detail: [
        { name: '课程浏览', desc: '用户浏览课程介绍页面', benchmark: '基准转化率: 25-35%' },
        { name: '试听体验', desc: '用户观看免费试听课程', benchmark: '基准转化率: 40-60%' },
        { name: '咨询互动', desc: '用户主动咨询或参与互动', benchmark: '基准转化率: 30-50%' },
        { name: '付费报名', desc: '用户完成课程付费报名', benchmark: '基准转化率: 20-40%' }
      ],
      kpis: ['页面停留时长', '试听完成率', '咨询转化率', '报名转化率', '客单价', '课程完成率'],
      best_practices: [
        '制作高质量的课程介绍和试听内容',
        '设置多层次的价格策略',
        '建立及时的咨询响应机制',
        '提供分期付款等支付选项'
      ]
    }
  },

  education_retention: {
    id: 'education_retention',
    title: '学员学习留存漏斗',
    desc: '追踪学员的学习进度和课程完成情况',
    icon: '🎓',
    iconBg: '#06b6d4',
    industry: 'education',
    function: 'retention',
    difficulty: '复杂',
    stages: ['课程开始', '第一周学习', '中期进度', '课程完成', '续课推荐'],
    stats: {
      usage: '756',
      conversion: '65.3%',
      cycle: '60天'
    },
    recommended: false
  },

  // 金融服务行业模板
  finance_loan: {
    id: 'finance_loan',
    title: '贷款申请审批流程',
    desc: '从贷款咨询到放款完成的金融服务流程',
    icon: '💰',
    iconBg: '#059669',
    industry: 'finance',
    function: 'sales',
    difficulty: '复杂',
    stages: ['贷款咨询', '资料提交', '初步审核', '详细评估', '审批通过', '合同签署', '放款到账'],
    stats: {
      usage: '654',
      conversion: '23.7%',
      cycle: '15天'
    },
    recommended: false,
    details: {
      description: '金融机构贷款业务标准流程漏斗，跟踪客户从咨询到最终放款的完整流程。',
      stages_detail: [
        { name: '贷款咨询', desc: '客户了解贷款产品和政策', benchmark: '基准转化率: 60-80%' },
        { name: '资料提交', desc: '客户提交贷款申请材料', benchmark: '基准转化率: 70-85%' },
        { name: '初步审核', desc: '系统和人工初步审核', benchmark: '基准转化率: 75-90%' },
        { name: '详细评估', desc: '深入评估客户资质', benchmark: '基准转化率: 60-75%' },
        { name: '审批通过', desc: '贷款申请获得批准', benchmark: '基准转化率: 80-95%' },
        { name: '合同签署', desc: '客户签署贷款合同', benchmark: '基准转化率: 90-98%' },
        { name: '放款到账', desc: '资金成功放款到客户账户', benchmark: '基准转化率: 95-99%' }
      ],
      kpis: ['申请转化率', '审核通过率', '签约转化率', '放款成功率', '申请周期', '客户满意度'],
      best_practices: [
        '简化申请流程和资料要求',
        '建立智能风控系统',
        '及时沟通审批进度',
        '提供多样化贷款产品'
      ]
    }
  },

  // 医疗健康行业模板
  healthcare_appointment: {
    id: 'healthcare_appointment',
    title: '在线问诊预约流程',
    desc: '患者从症状咨询到完成在线问诊的医疗服务流程',
    icon: '🏥',
    iconBg: '#dc2626',
    industry: 'healthcare',
    function: 'sales',
    difficulty: '中等',
    stages: ['症状描述', '医生匹配', '预约确认', '在线问诊', '处方开具'],
    stats: {
      usage: '543',
      conversion: '78.4%',
      cycle: '2天'
    },
    recommended: false
  },

  // 房地产行业模板
  realestate_sales: {
    id: 'realestate_sales',
    title: '房产销售转化漏斗',
    desc: '从楼盘关注到签约成交的房地产销售流程',
    icon: '🏠',
    iconBg: '#7c3aed',
    industry: 'realestate',
    function: 'sales',
    difficulty: '复杂',
    stages: ['楼盘关注', '实地看房', '意向登记', '价格谈判', '签约成交'],
    stats: {
      usage: '432',
      conversion: '8.5%',
      cycle: '45天'
    },
    recommended: false
  },

  // 咨询服务行业模板
  consulting_lead: {
    id: 'consulting_lead',
    title: '咨询服务获客流程',
    desc: '从线索获取到签署咨询合同的服务转化流程',
    icon: '💼',
    iconBg: '#0369a1',
    industry: 'consulting',
    function: 'marketing',
    difficulty: '中等',
    stages: ['线索获取', '需求沟通', '方案提案', '商务谈判', '合同签署'],
    stats: {
      usage: '321',
      conversion: '18.7%',
      cycle: '30天'
    },
    recommended: false
  }
};

// Vue.js computed properties helper functions
export const useTemplateFilters = () => {
  // Filter templates by industry
  const filterByIndustry = (templates: Record<string, FunnelTemplate>, industry: string) => {
    if (industry === 'all') return Object.values(templates);
    return Object.values(templates).filter(template => template.industry === industry);
  };

  // Filter templates by function
  const filterByFunction = (templates: Record<string, FunnelTemplate>, func: string) => {
    if (func === 'all') return Object.values(templates);
    return Object.values(templates).filter(template => template.function === func);
  };

  // Get recommended templates
  const getRecommendedTemplates = (templates: Record<string, FunnelTemplate>) => {
    return Object.values(templates).filter(template => template.recommended);
  };

  // Sort templates by usage (trending)
  const getTrendingTemplates = (templates: Record<string, FunnelTemplate>) => {
    return Object.values(templates).sort((a, b) => {
      const aUsage = parseInt(a.stats.usage.replace('k', '000'));
      const bUsage = parseInt(b.stats.usage.replace('k', '000'));
      return bUsage - aUsage;
    });
  };

  return {
    filterByIndustry,
    filterByFunction,
    getRecommendedTemplates,
    getTrendingTemplates
  };
};

// Export default templates object for backward compatibility
export default FUNNEL_TEMPLATES;