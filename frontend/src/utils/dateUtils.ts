/**
 * 日期工具函数
 * 提供日期格式化和处理的通用函数
 */

/**
 * 将日期转换为中国时区（UTC+8）
 * @param date ISO格式的日期字符串或Date对象
 * @returns 调整为中国时区的Date对象
 */
export const toChineseTimezone = (date: string | Date): Date => {
  if (!date) return new Date();

  // 创建一个新的Date对象
  const inputDate = typeof date === 'string' ? new Date(date) : date;

  // 获取UTC时间
  const utcDate = new Date(inputDate.getTime() + inputDate.getTimezoneOffset() * 60000);

  // 调整为中国时区（UTC+8）
  return new Date(utcDate.getTime() + 8 * 60 * 60000);
};

/**
 * 格式化日期为简单的月/日 时:分格式
 * @param date ISO格式的日期字符串或Date对象
 * @returns 格式化后的日期字符串，如 "5/1 14:30"
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  const chinaDate = toChineseTimezone(date);
  return `${chinaDate.getMonth() + 1}/${chinaDate.getDate()} ${chinaDate.getHours()}:${chinaDate.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 格式化日期为详细的月/日 时:分格式，确保小时和分钟都是两位数
 * @param date ISO格式的日期字符串或Date对象
 * @returns 格式化后的日期字符串，如 "5/1 14:30"
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '';
  const chinaDate = toChineseTimezone(date);
  return `${chinaDate.getMonth() + 1}/${chinaDate.getDate()} ${chinaDate.getHours().toString().padStart(2, '0')}:${chinaDate.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 格式化日期为中文格式
 * @param date ISO格式的日期字符串或Date对象
 * @param includeTime 是否包含时间
 * @returns 格式化后的日期字符串，如 "2023年5月1日 14:30"
 */
export const formatChineseDate = (date: string | Date, includeTime = true): string => {
  if (!date) return '';
  const chinaDate = toChineseTimezone(date);

  const year = chinaDate.getFullYear();
  const month = chinaDate.getMonth() + 1;
  const day = chinaDate.getDate();

  let result = `${year}年${month}月${day}日`;

  if (includeTime) {
    const hours = chinaDate.getHours().toString().padStart(2, '0');
    const minutes = chinaDate.getMinutes().toString().padStart(2, '0');
    result += ` ${hours}:${minutes}`;
  }

  return result;
};

/**
 * 格式化时间为 HH:MM 格式
 * @param date ISO格式的日期字符串或Date对象
 * @returns 格式化后的时间字符串，如 "14:30"
 */
export const formatTimeOnly = (date: string | Date): string => {
  if (!date) return '';
  const chinaDate = toChineseTimezone(date);
  return `${chinaDate.getHours().toString().padStart(2, '0')}:${chinaDate.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * 获取今天的开始时间（00:00:00），使用中国时区
 * @returns 今天开始时间的Date对象
 */
export const getTodayStart = (): Date => {
  // 获取当前时间
  const now = new Date();

  // 转换为中国时区
  const chinaDate = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);

  // 设置为当天的开始时间
  chinaDate.setHours(0, 0, 0, 0);

  return chinaDate;
};

/**
 * 获取今天的结束时间（23:59:59），使用中国时区
 * @returns 今天结束时间的Date对象
 */
export const getTodayEnd = (): Date => {
  // 获取当前时间
  const now = new Date();

  // 转换为中国时区
  const chinaDate = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);

  // 设置为当天的结束时间
  chinaDate.setHours(23, 59, 59, 999);

  return chinaDate;
};

/**
 * 检查日期是否是今天，使用中国时区
 * @param date ISO格式的日期字符串或Date对象
 * @returns 是否是今天
 */
export const isToday = (date: string | Date): boolean => {
  if (!date) return false;

  // 转换为中国时区
  const chinaDate = toChineseTimezone(date);
  chinaDate.setHours(0, 0, 0, 0);

  const today = getTodayStart();
  return chinaDate.getTime() === today.getTime();
};

/**
 * 将ISO格式的日期字符串转换为本地日期对象，使用中国时区
 * 处理带有Z后缀的ISO格式字符串
 * @param isoString ISO格式的日期字符串
 * @returns Date对象
 */
export const parseISODate = (isoString: string): Date => {
  if (!isoString) return new Date();
  return toChineseTimezone(isoString);
};

/**
 * 格式化持续时间（分钟）为可读格式
 * @param minutes 持续时间（分钟）
 * @returns 格式化后的字符串，如：2小时30分钟
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return '0分钟';

  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${remainingMinutes}分钟`;
};

/**
 * 获取星期几的中文名称
 * @param date 日期
 * @returns 星期几的中文名称
 */
export const getChineseWeekday = (date: string | Date): string => {
  const chinaDate = toChineseTimezone(date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[chinaDate.getDay()];
};
