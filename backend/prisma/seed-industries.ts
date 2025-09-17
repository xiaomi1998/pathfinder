import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const industries = [
  {
    code: 'technology',
    name: '科技/IT',
    nameEn: 'Technology/IT',
    description: 'Internet, Software, Hardware, AI/ML',
    sortOrder: 1
  },
  {
    code: 'finance',
    name: '金融',
    nameEn: 'Finance',
    description: 'Banking, Insurance, Investment, FinTech',
    sortOrder: 2
  },
  {
    code: 'ecommerce',
    name: '电商/零售',
    nameEn: 'E-commerce/Retail',
    description: 'Online/Offline Retail, Marketplace',
    sortOrder: 3
  },
  {
    code: 'education',
    name: '教育培训',
    nameEn: 'Education/Training',
    description: 'Online Education, Training, EdTech',
    sortOrder: 4
  },
  {
    code: 'healthcare',
    name: '医疗健康',
    nameEn: 'Healthcare/Medical',
    description: 'Healthcare, Medical Devices, Biotechnology',
    sortOrder: 5
  },
  {
    code: 'manufacturing',
    name: '制造业',
    nameEn: 'Manufacturing',
    description: 'Traditional Manufacturing, Industrial',
    sortOrder: 6
  },
  {
    code: 'real_estate',
    name: '房地产',
    nameEn: 'Real Estate',
    description: 'Property Development, Real Estate Services',
    sortOrder: 7
  },
  {
    code: 'media',
    name: '媒体/广告',
    nameEn: 'Media/Advertising',
    description: 'Digital Media, Advertising, Marketing',
    sortOrder: 8
  },
  {
    code: 'travel',
    name: '旅游/酒店',
    nameEn: 'Travel/Hospitality',
    description: 'Tourism, Hotels, Travel Services',
    sortOrder: 9
  },
  {
    code: 'automotive',
    name: '汽车',
    nameEn: 'Automotive',
    description: 'Automotive Manufacturing, Auto Services',
    sortOrder: 10
  },
  {
    code: 'food',
    name: '餐饮/食品',
    nameEn: 'Food/Beverage',
    description: 'Restaurants, Food Production, F&B',
    sortOrder: 11
  },
  {
    code: 'logistics',
    name: '物流/运输',
    nameEn: 'Logistics/Transportation',
    description: 'Shipping, Logistics, Transportation',
    sortOrder: 12
  },
  {
    code: 'energy',
    name: '能源',
    nameEn: 'Energy',
    description: 'Oil, Gas, Renewable Energy, Utilities',
    sortOrder: 13
  },
  {
    code: 'government',
    name: '政府/公共',
    nameEn: 'Government/Public',
    description: 'Government, Public Services, Non-profit',
    sortOrder: 14
  },
  {
    code: 'consulting',
    name: '咨询服务',
    nameEn: 'Consulting/Services',
    description: 'Business Consulting, Professional Services',
    sortOrder: 15
  },
  {
    code: 'other',
    name: '其他',
    nameEn: 'Other',
    description: 'Other industries not listed above',
    sortOrder: 99
  }
];

async function main() {
  console.log('开始插入行业数据...');

  for (const industry of industries) {
    try {
      await prisma.industry.create({
        data: industry
      });
      console.log(`✓ 插入行业: ${industry.name} (${industry.code})`);
    } catch (error) {
      console.log(`⚠ 行业 ${industry.name} 可能已存在，跳过`);
    }
  }

  console.log('行业数据插入完成！');
}

main()
  .catch((e) => {
    console.error('插入行业数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });