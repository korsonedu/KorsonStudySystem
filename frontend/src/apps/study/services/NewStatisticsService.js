/**
 * 新的统计数据服务
 * 使用UserTasksService获取用户任务数据，并计算统计信息
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../../../config';
import * as UserTasksService from './UserTasksService';
// 获取令牌键名
const TOKEN_KEY = STORAGE_CONFIG.TOKEN_KEY;
// 定义统计 API 端点
const STATISTICS_API = API_CONFIG.ENDPOINTS.STATISTICS;
// 确保URL以斜杠结尾
const ensureTrailingSlash = (url) => {
    if (!url.endsWith('/')) {
        return `${url}/`;
    }
    return url;
};
/**
 * 获取基本统计数据
 */
export const fetchBasicStats = async () => {
    try {
        console.log('获取基本统计数据...');
        // 获取今日、本周和本月任务
        const todayTasks = await UserTasksService.fetchTodayTasks();
        const weekTasks = await UserTasksService.fetchWeekTasks();
        const monthTasks = await UserTasksService.fetchMonthTasks();
        const allTasks = await UserTasksService.fetchUserTasks();
        // 计算时长
        const dailyDuration = UserTasksService.calculateTotalDuration(todayTasks);
        const weeklyDuration = UserTasksService.calculateTotalDuration(weekTasks);
        const monthlyDuration = UserTasksService.calculateTotalDuration(monthTasks);
        // 计算总学习时长（小时）
        const totalMinutes = UserTasksService.calculateTotalDuration(allTasks);
        const totalHours = totalMinutes / 60;
        console.log('基本统计数据计算完成:', {
            dailyDuration,
            weeklyDuration,
            monthlyDuration,
            totalHours
        });
        return {
            dailyDuration,
            weeklyDuration,
            monthlyDuration,
            totalHours
        };
    }
    catch (error) {
        console.error('获取基本统计数据失败:', error);
        // 检查是否是认证错误
        if (error.response && error.response.status === 401) {
            console.warn('认证错误，尝试重新获取认证令牌');
            // 尝试从localStorage获取令牌
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                console.log('找到令牌，但API请求仍然失败，可能是令牌无效或过期');
                // 检查令牌是否过期
                try {
                    // 只处理JWT格式的令牌
                    if (token.includes('.')) {
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            const base64Url = parts[1];
                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                            const payload = JSON.parse(atob(base64));
                            if (payload.exp) {
                                const expTime = new Date(payload.exp * 1000);
                                const now = new Date();
                                console.log('令牌过期时间:', expTime.toLocaleString());
                                console.log('当前时间:', now.toLocaleString());
                                if (expTime < now) {
                                    console.error('令牌已过期!');
                                    // 清除过期的令牌
                                    localStorage.removeItem(TOKEN_KEY);
                                    // 重定向到登录页面
                                    window.location.href = '/login';
                                    // 返回默认值
                                    return {
                                        dailyDuration: 0,
                                        weeklyDuration: 0,
                                        monthlyDuration: 0,
                                        totalHours: 0
                                    };
                                }
                            }
                        }
                    }
                }
                catch (e) {
                    console.warn('无法解析令牌以检查过期时间:', e);
                }
            }
            else {
                console.warn('未找到有效令牌，用户可能需要重新登录');
                // 重定向到登录页面
                window.location.href = '/login';
                // 返回默认值
                return {
                    dailyDuration: 0,
                    weeklyDuration: 0,
                    monthlyDuration: 0,
                    totalHours: 0
                };
            }
        }
        // 返回默认值
        return {
            dailyDuration: 0,
            weeklyDuration: 0,
            monthlyDuration: 0,
            totalHours: 0
        };
    }
};
/**
 * 获取每日统计数据
 */
export const fetchDailyStats = async () => {
    try {
        console.log('获取每日统计数据...');
        // 获取今日任务
        const todayTasks = await UserTasksService.fetchTodayTasks();
        // 计算每小时分布
        const hourlyDistribution = UserTasksService.calculateHourlyDistribution(todayTasks);
        // 转换为所需格式
        return hourlyDistribution.map(item => ({
            hour: item.hour,
            time: `${item.hour}:00`,
            duration: item.duration
        }));
    }
    catch (error) {
        console.error('获取每日统计数据失败:', error);
        // 返回24小时的空数据
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            time: `${i}:00`,
            duration: 0
        }));
    }
};
/**
 * 获取每周统计数据
 */
export const fetchWeeklyStats = async () => {
    try {
        console.log('获取每周统计数据...');
        // 获取本周任务
        const weekTasks = await UserTasksService.fetchWeekTasks();
        // 计算每天分布
        return UserTasksService.calculateDailyDistribution(weekTasks);
    }
    catch (error) {
        console.error('获取每周统计数据失败:', error);
        // 返回一周的空数据 - 中国习惯，周一到周日
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        return weekDays.map(day => ({
            day,
            duration: 0
        }));
    }
};
/**
 * 获取每月统计数据
 */
export const fetchMonthlyStats = async () => {
    try {
        console.log('获取每月统计数据...');
        // 获取本月任务
        const monthTasks = await UserTasksService.fetchMonthTasks();
        // 计算每天分布
        return UserTasksService.calculateMonthlyDistribution(monthTasks);
    }
    catch (error) {
        console.error('获取每月统计数据失败:', error);
        // 返回31天的空数据
        return Array.from({ length: 31 }, (_, i) => ({
            day: `${i + 1}日`,
            duration: 0
        }));
    }
};
/**
 * 获取热力图数据
 */
export const fetchHeatmapData = async () => {
    try {
        console.log('获取热力图数据...');
        // 获取所有任务
        const allTasks = await UserTasksService.fetchUserTasks();
        // 计算热力图数据
        const heatmapData = UserTasksService.calculateHeatmapData(allTasks);
        console.log(`计算得到 ${heatmapData.length} 条热力图数据`);
        // 打印前5条热力图数据，用于调试
        if (heatmapData.length > 0) {
            console.log('热力图数据示例:', heatmapData.slice(0, 5));
        }
        return heatmapData;
    }
    catch (error) {
        console.error('获取热力图数据失败:', error);
        // 尝试从API获取热力图数据作为备选方案
        try {
            console.log('尝试从API获取热力图数据...');
            const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.HEATMAP));
            // 检查响应格式
            if (Array.isArray(response.data)) {
                const apiData = response.data.map((item) => ({
                    date: item.date || '',
                    duration: item.duration || item.count || item.value || 0
                }));
                console.log(`从API获取到 ${apiData.length} 条热力图数据`);
                return apiData;
            }
        }
        catch (apiError) {
            console.error('从API获取热力图数据失败:', apiError);
        }
        return [];
    }
};
/**
 * 获取时间分布数据
 */
export const fetchTimeDistribution = async () => {
    try {
        console.log('获取时间分布数据...');
        // 获取所有任务
        const allTasks = await UserTasksService.fetchUserTasks();
        // 计算每小时分布
        return UserTasksService.calculateHourlyDistribution(allTasks);
    }
    catch (error) {
        console.error('获取时间分布数据失败:', error);
        // 返回24小时的空数据
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            duration: 0
        }));
    }
};
/**
 * 获取用户信息
 */
export const fetchUserInfo = async () => {
    try {
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.USER_INFO));
        // 提取注册日期
        const registrationDate = response.data?.created_at ||
            response.data?.createdAt ||
            response.data?.register_date ||
            response.data?.registerDate || '';
        return {
            registrationDate
        };
    }
    catch (error) {
        console.error('获取用户信息失败:', error);
        return {
            registrationDate: ''
        };
    }
};
/**
 * 获取内容统计数据
 */
export const fetchContentStats = async () => {
    try {
        console.log('获取内容统计数据...');
        // 获取今日、本周和本月任务
        const todayTasks = await UserTasksService.fetchTodayTasks();
        const weekTasks = await UserTasksService.fetchWeekTasks();
        const monthTasks = await UserTasksService.fetchMonthTasks();
        // 计算内容统计
        const dailyContentStats = UserTasksService.calculateContentStats(todayTasks);
        const weeklyContentStats = UserTasksService.calculateContentStats(weekTasks);
        const monthlyContentStats = UserTasksService.calculateContentStats(monthTasks);
        console.log('内容统计数据计算完成:');
        console.log('- 今日内容统计:', dailyContentStats);
        console.log('- 本周内容统计:', weeklyContentStats);
        console.log('- 本月内容统计:', monthlyContentStats);
        return {
            dailyContentStats,
            weeklyContentStats,
            monthlyContentStats
        };
    }
    catch (error) {
        console.error('获取内容统计数据失败:', error);
        // 创建默认的内容统计数据
        const defaultStats = [
            { name: '未分类', duration: 1 }
        ];
        return {
            dailyContentStats: defaultStats,
            weeklyContentStats: defaultStats,
            monthlyContentStats: defaultStats
        };
    }
};
/**
 * 获取所有统计数据
 */
export const fetchAllStatistics = async () => {
    try {
        console.log('开始获取所有统计数据...');
        // 创建默认值，以防某些请求失败
        let basicStats = { dailyDuration: 0, weeklyDuration: 0, monthlyDuration: 0, totalHours: 0 };
        let dailyStats = Array.from({ length: 24 }, (_, i) => ({ hour: i, time: `${i}:00`, duration: 0 }));
        let weeklyStats = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({ day, duration: 0 }));
        let monthlyStats = Array.from({ length: 31 }, (_, i) => ({ day: `${i + 1}日`, duration: 0 }));
        let heatmapData = [];
        let timeDistribution = Array.from({ length: 24 }, (_, i) => ({ hour: i, duration: 0 }));
        let userInfo = { registrationDate: '' };
        let contentStats = {
            dailyContentStats: [{ name: '未分类', duration: 1 }],
            weeklyContentStats: [{ name: '未分类', duration: 1 }],
            monthlyContentStats: [{ name: '未分类', duration: 1 }]
        };
        // 单独请求每个数据，而不是使用 Promise.all，这样一个请求失败不会影响其他请求
        try {
            console.log('获取基本统计数据...');
            basicStats = await fetchBasicStats();
        }
        catch (error) {
            console.error('获取基本统计数据失败:', error);
        }
        try {
            console.log('获取每日统计数据...');
            dailyStats = await fetchDailyStats();
        }
        catch (error) {
            console.error('获取每日统计数据失败:', error);
        }
        try {
            console.log('获取每周统计数据...');
            weeklyStats = await fetchWeeklyStats();
        }
        catch (error) {
            console.error('获取每周统计数据失败:', error);
        }
        try {
            console.log('获取每月统计数据...');
            monthlyStats = await fetchMonthlyStats();
        }
        catch (error) {
            console.error('获取每月统计数据失败:', error);
        }
        try {
            console.log('获取热力图数据...');
            heatmapData = await fetchHeatmapData();
        }
        catch (error) {
            console.error('获取热力图数据失败:', error);
        }
        try {
            console.log('获取时间分布数据...');
            timeDistribution = await fetchTimeDistribution();
        }
        catch (error) {
            console.error('获取时间分布数据失败:', error);
        }
        try {
            console.log('获取用户信息...');
            userInfo = await fetchUserInfo();
        }
        catch (error) {
            console.error('获取用户信息失败:', error);
        }
        try {
            console.log('获取内容统计数据...');
            contentStats = await fetchContentStats();
        }
        catch (error) {
            console.error('获取内容统计数据失败:', error);
        }
        return {
            dailyDuration: basicStats.dailyDuration,
            weeklyDuration: basicStats.weeklyDuration,
            monthlyDuration: basicStats.monthlyDuration,
            totalHours: basicStats.totalHours,
            hourlyStats: dailyStats,
            weeklyStats,
            monthlyStats,
            heatmapData,
            timeDistribution,
            userRegistrationDate: userInfo.registrationDate,
            // 添加内容统计数据
            dailyContentStats: contentStats.dailyContentStats,
            weeklyContentStats: contentStats.weeklyContentStats,
            monthlyContentStats: contentStats.monthlyContentStats
        };
    }
    catch (error) {
        console.error('获取所有统计数据失败:', error);
        // 创建默认的内容统计数据
        const defaultContentStats = [
            { name: '未分类', duration: 1 }
        ];
        // 创建默认的每周数据
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const defaultWeeklyStats = weekDays.map(day => ({
            day,
            duration: 0
        }));
        // 创建默认的每月数据
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const defaultMonthlyStats = Array.from({ length: daysInMonth }, (_, i) => ({
            day: `${i + 1}日`,
            duration: 0
        }));
        // 创建默认的每日数据
        const defaultHourlyStats = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            time: `${i}:00`,
            duration: 0
        }));
        // 返回默认值
        return {
            dailyDuration: 0,
            weeklyDuration: 0,
            monthlyDuration: 0,
            totalHours: 0,
            hourlyStats: defaultHourlyStats,
            weeklyStats: defaultWeeklyStats,
            monthlyStats: defaultMonthlyStats,
            heatmapData: [],
            timeDistribution: defaultHourlyStats,
            userRegistrationDate: '',
            dailyContentStats: defaultContentStats,
            weeklyContentStats: defaultContentStats,
            monthlyContentStats: defaultContentStats
        };
    }
};
//# sourceMappingURL=NewStatisticsService.js.map