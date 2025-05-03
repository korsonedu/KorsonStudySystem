/**
 * 日期工具函数
 * 提供日期格式化和处理的通用函数
 */
/**
 * 将日期转换为中国时区（UTC+8）
 * @param dateString ISO格式的日期字符串
 * @returns 调整为中国时区的Date对象
 */
export const toChineseTimezone = (dateString) => {
    if (!dateString)
        return new Date();
    // 创建一个新的Date对象
    const date = new Date(dateString);
    // 获取UTC时间
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    // 调整为中国时区（UTC+8）
    return new Date(utcDate.getTime() + 8 * 60 * 60000);
};
/**
 * 格式化日期为简单的月/日 时:分格式
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串，如 "5/1 14:30"
 */
export const formatDate = (dateString) => {
    if (!dateString)
        return '';
    const date = toChineseTimezone(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};
/**
 * 格式化日期为详细的月/日 时:分格式，确保小时和分钟都是两位数
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期字符串，如 "5/1 14:30"
 */
export const formatTime = (dateString) => {
    if (!dateString)
        return '';
    const date = toChineseTimezone(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
/**
 * 获取今天的开始时间（00:00:00），使用中国时区
 * @returns 今天开始时间的Date对象
 */
export const getTodayStart = () => {
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
export const getTodayEnd = () => {
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
 * @param dateString ISO格式的日期字符串
 * @returns 是否是今天
 */
export const isToday = (dateString) => {
    if (!dateString)
        return false;
    // 转换为中国时区
    const date = toChineseTimezone(dateString);
    date.setHours(0, 0, 0, 0);
    const today = getTodayStart();
    return date.getTime() === today.getTime();
};
/**
 * 将ISO格式的日期字符串转换为本地日期对象，使用中国时区
 * 处理带有Z后缀的ISO格式字符串
 * @param isoString ISO格式的日期字符串
 * @returns Date对象
 */
export const parseISODate = (isoString) => {
    if (!isoString)
        return new Date();
    return toChineseTimezone(isoString);
};
//# sourceMappingURL=dateUtils.js.map