/**
 * 日期工具函数
 * 统一使用中国时区（UTC+8）
 */
import { APP_CONFIG } from '../../config';

// 获取时区配置
const TIMEZONE = APP_CONFIG.TIMEZONE;

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:MM 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的时间字符串
 */
export function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:MM 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 获取今天的开始时间
 * @returns 今天的开始时间
 */
export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 获取今天的结束时间
 * @returns 今天的结束时间
 */
export function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 获取本周的开始时间（周一）
 * @returns 本周的开始时间
 */
export function getWeekStart(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * 获取本周的结束时间（周日）
 * @returns 本周的结束时间
 */
export function getWeekEnd(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? 0 : 7); // 调整为周日
  const sunday = new Date(today.setDate(diff));
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

/**
 * 获取本月的开始时间
 * @returns 本月的开始时间
 */
export function getMonthStart(): Date {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

/**
 * 获取本月的结束时间
 * @returns 本月的结束时间
 */
export function getMonthEnd(): Date {
  const today = new Date();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

/**
 * 计算两个日期之间的天数差
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数差
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
  // 清除时间部分，只保留日期
  const date1Ms = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  const date2Ms = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime();
  // 计算差值
  const diffDays = Math.round(Math.abs((date1Ms - date2Ms) / oneDay));
  return diffDays;
}

/**
 * 将日期字符串转换为中国时区的日期对象
 * @param dateStr 日期字符串
 * @returns 中国时区的日期对象
 */
export function toChinaTimezone(dateStr: string): Date {
  const date = new Date(dateStr);
  // 中国时区偏移量（+8小时）
  const chinaTimezoneOffset = TIMEZONE.OFFSET * 60 * 60 * 1000;
  // 获取当前时区偏移量
  const localTimezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  // 调整为中国时区
  return new Date(date.getTime() + localTimezoneOffset + chinaTimezoneOffset);
}

/**
 * 获取当前中国时区的日期对象
 * @returns 中国时区的当前日期对象
 */
export function getNowInChinaTimezone(): Date {
  return toChinaTimezone(new Date().toISOString());
}

/**
 * 将日期对象转换为中国时区的日期字符串（YYYY-MM-DD）
 * @param date 日期对象
 * @returns 中国时区的日期字符串
 */
export function formatDateInChinaTimezone(date: Date | string): string {
  const chinaDate = date instanceof Date ? toChinaTimezone(date.toISOString()) : toChinaTimezone(date);
  return formatDate(chinaDate);
}

/**
 * 将日期对象转换为中国时区的时间字符串（HH:MM）
 * @param date 日期对象
 * @returns 中国时区的时间字符串
 */
export function formatTimeInChinaTimezone(date: Date | string): string {
  const chinaDate = date instanceof Date ? toChinaTimezone(date.toISOString()) : toChinaTimezone(date);
  return formatTime(chinaDate);
}

/**
 * 将日期对象转换为中国时区的日期时间字符串（YYYY-MM-DD HH:MM）
 * @param date 日期对象
 * @returns 中国时区的日期时间字符串
 */
export function formatDateTimeInChinaTimezone(date: Date | string): string {
  const chinaDate = date instanceof Date ? toChinaTimezone(date.toISOString()) : toChinaTimezone(date);
  return formatDateTime(chinaDate);
}

export default {
  formatDate,
  formatTime,
  formatDateTime,
  getTodayStart,
  getTodayEnd,
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  daysBetween,
  toChinaTimezone,
  getNowInChinaTimezone,
  formatDateInChinaTimezone,
  formatTimeInChinaTimezone,
  formatDateTimeInChinaTimezone
};
