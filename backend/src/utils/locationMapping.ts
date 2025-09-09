/**
 * 省份地区映射工具
 * 提供英文代码和中文名称之间的双向映射
 * 保持与前端映射的一致性
 */

// 省份地区映射表
export const LOCATION_MAPPING = {
  // 4个直辖市
  beijing: '北京市',
  shanghai: '上海市',
  tianjin: '天津市',
  chongqing: '重庆市',
  
  // 23个省
  hebei: '河北省',
  shanxi: '山西省',
  liaoning: '辽宁省',
  jilin: '吉林省',
  heilongjiang: '黑龙江省',
  jiangsu: '江苏省',
  zhejiang: '浙江省',
  anhui: '安徽省',
  fujian: '福建省',
  jiangxi: '江西省',
  shandong: '山东省',
  henan: '河南省',
  hubei: '湖北省',
  hunan: '湖南省',
  guangdong: '广东省',
  hainan: '海南省',
  sichuan: '四川省',
  guizhou: '贵州省',
  yunnan: '云南省',
  shaanxi: '陕西省',
  gansu: '甘肃省',
  qinghai: '青海省',
  taiwan: '台湾省',
  
  // 5个自治区
  neimenggu: '内蒙古自治区',
  guangxi: '广西壮族自治区',
  tibet: '西藏自治区',
  ningxia: '宁夏回族自治区',
  xinjiang: '新疆维吾尔自治区',
  
  // 2个特别行政区
  hongkong: '香港特别行政区',
  macau: '澳门特别行政区',
  
  // 海外地区
  overseas: '海外地区'
} as const

// 类型定义
export type LocationCode = keyof typeof LOCATION_MAPPING
export type LocationName = typeof LOCATION_MAPPING[LocationCode]

// 反向映射表（中文名称到英文代码）
export const LOCATION_NAME_TO_CODE = Object.fromEntries(
  Object.entries(LOCATION_MAPPING).map(([code, name]) => [name, code])
) as Record<LocationName, LocationCode>

// 根据英文代码获取中文名称
export const getLocationName = (code: string): string => {
  return LOCATION_MAPPING[code as LocationCode] || code
}

// 根据中文名称获取英文代码
export const getLocationCode = (name: string): string => {
  return LOCATION_NAME_TO_CODE[name as LocationName] || name
}

// 验证地区代码是否有效
export const isValidLocationCode = (code: string): code is LocationCode => {
  return code in LOCATION_MAPPING
}

// 获取所有有效的地区代码（用于Joi验证）
export const getAllLocationCodes = (): LocationCode[] => {
  return Object.keys(LOCATION_MAPPING) as LocationCode[]
}

// 获取所有中文地区名称
export const getAllLocationNames = (): LocationName[] => {
  return Object.values(LOCATION_MAPPING)
}