/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期
 * @param date 日期对象
 * @param format 格式字符串，支持 YYYY、MM、DD、HH、mm、ss
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  if (!date || !(date instanceof Date)) {
    return '';
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return format
    .replace(/YYYY/g, year.toString())
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hours)
    .replace(/mm/g, minutes)
    .replace(/ss/g, seconds);
}

/**
 * 格式化百分比
 * @param value 数值
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  
  return Number(value).toFixed(decimals);
}

/**
 * 格式化数字
 * @param value 数值
 * @param decimals 小数位数，默认0位
 * @returns 格式化后的数字字符串
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * 格式化大数字（自动添加k、M单位）
 * @param value 数值
 * @param decimals 小数位数，默认1位
 * @returns 格式化后的数字字符串
 */
export function formatLargeNumber(value: number | null | undefined, decimals: number = 1): string {
  if (value == null || isNaN(value)) {
    return '0';
  }
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(decimals) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(decimals) + 'K';
  }
  
  return value.toString();
}

/**
 * 格式化货币
 * @param value 数值
 * @param currency 货币符号，默认¥
 * @param decimals 小数位数，默认0位
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(value: number | null | undefined, currency: string = '¥', decimals: number = 0): string {
  if (value == null || isNaN(value)) {
    return currency + '0';
  }
  
  let formattedValue: string;
  
  if (value >= 1000000) {
    formattedValue = (value / 1000000).toFixed(decimals) + 'M';
  } else if (value >= 1000) {
    formattedValue = (value / 1000).toFixed(decimals) + 'K';
  } else {
    formattedValue = value.toFixed(decimals);
  }
  
  return currency + formattedValue;
}

/**
 * 计算时间差的可读格式
 * @param date 目标日期
 * @returns 可读的时间差字符串
 */
export function formatTimeAgo(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '刚刚';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}天前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}年前`;
}

/**
 * 解析日期字符串为Date对象
 * @param dateString 日期字符串
 * @returns Date对象或null
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 获取日期范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期范围数组
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * 检查是否为今天
 * @param date 日期
 * @returns 是否为今天
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * 检查是否为本周
 * @param date 日期
 * @returns 是否为本周
 */
export function isThisWeek(date: Date): boolean {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
}

/**
 * 检查是否为本月
 * @param date 日期
 * @returns 是否为本月
 */
export function isThisMonth(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

/**
 * 格式化相对时间（多长时间前）
 * @param date 日期
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return '刚刚'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分钟前`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}小时前`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}天前`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}个月前`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}