/**
 * 统计数据服务
 * 负责与后端API交互，获取统计数据
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../../../config';
// 获取令牌键名 - 使用配置中定义的键名
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
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.TOTAL));
        // 处理基本统计数据
        // 提取数据，确保有默认值
        const dailyDuration = response.data?.daily_duration ||
            response.data?.dailyDuration ||
            response.data?.daily_minutes ||
            response.data?.dailyMinutes || 0;
        // 如果后端没有提供周统计数据，我们需要手动计算
        let weeklyDuration = response.data?.weekly_duration ||
            response.data?.weeklyDuration ||
            response.data?.weekly_minutes ||
            response.data?.weeklyMinutes;
        // 如果后端没有提供月统计数据，我们需要手动计算
        let monthlyDuration = response.data?.monthly_duration ||
            response.data?.monthlyDuration ||
            response.data?.monthly_minutes ||
            response.data?.monthlyMinutes;
        // 如果没有周统计数据，尝试从任务列表计算
        if (weeklyDuration === undefined || weeklyDuration === null) {
            try {
                // 后端未提供周统计数据，尝试从任务列表计算
                // 获取所有任务
                const tasksResponse = await apiService.get(ensureTrailingSlash(STATISTICS_API.USER_STATS));
                let tasks = [];
                // 检查响应格式
                if (Array.isArray(tasksResponse.data)) {
                    tasks = tasksResponse.data;
                }
                else if (tasksResponse.data?.tasks && Array.isArray(tasksResponse.data.tasks)) {
                    tasks = tasksResponse.data.tasks;
                }
                else if (tasksResponse.data?.records && Array.isArray(tasksResponse.data.records)) {
                    tasks = tasksResponse.data.records;
                }
                // 处理获取到的任务数据
                // 计算本周任务总时长
                if (tasks.length > 0) {
                    // 当前日期
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    // 本周开始日期（周一）- 中国习惯
                    const weekStart = new Date(today);
                    const dayOfWeek = today.getDay(); // 0是周日，1是周一，...
                    // 如果今天是周日(0)，则设置为前一周的周一，否则设置为本周的周一
                    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    weekStart.setDate(today.getDate() - daysToSubtract);
                    weekStart.setHours(0, 0, 0, 0);
                    // 明天日期（用于日期范围比较）
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    // 设置周统计计算范围
                    // 计算本周任务总时长
                    weeklyDuration = tasks.reduce((total, task) => {
                        try {
                            const startTime = task.start || task.start_time || task.startTime || task.date || '';
                            if (!startTime)
                                return total;
                            // 确保时长至少为1分钟
                            let duration = parseInt(task.duration || task.time || '0');
                            if (isNaN(duration))
                                duration = 0;
                            duration = Math.max(duration, 1); // 确保至少为1分钟
                            const taskDate = new Date(startTime);
                            if (isNaN(taskDate.getTime()))
                                return total; // 无效日期
                            // 本周任务
                            if (taskDate >= weekStart && taskDate < tomorrow) {
                                // 累加本周任务时长
                                return total + duration;
                            }
                            return total;
                        }
                        catch (e) {
                            if (process.env.NODE_ENV !== 'production') {
                                console.error('处理任务日期失败');
                            }
                            return total;
                        }
                    }, 0);
                    console.log('计算得到的周统计数据:', weeklyDuration, '分钟');
                }
                else {
                    weeklyDuration = 0;
                    console.log('没有任务数据，周统计设为0');
                }
            }
            catch (e) {
                console.error('计算周统计数据失败:', e);
                weeklyDuration = 0;
            }
        }
        // 如果没有月统计数据，尝试从任务列表计算
        if (monthlyDuration === undefined || monthlyDuration === null) {
            try {
                console.log('后端未提供月统计数据，尝试从任务列表计算');
                // 获取所有任务
                const tasksResponse = await apiService.get(ensureTrailingSlash(STATISTICS_API.USER_STATS));
                let tasks = [];
                // 检查响应格式
                if (Array.isArray(tasksResponse.data)) {
                    tasks = tasksResponse.data;
                }
                else if (tasksResponse.data?.tasks && Array.isArray(tasksResponse.data.tasks)) {
                    tasks = tasksResponse.data.tasks;
                }
                else if (tasksResponse.data?.records && Array.isArray(tasksResponse.data.records)) {
                    tasks = tasksResponse.data.records;
                }
                console.log('获取到任务数据:', tasks.length, '条记录');
                // 计算本月任务总时长
                if (tasks.length > 0) {
                    // 当前日期
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    // 明天日期（用于日期范围比较）
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    // 本月开始日期
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    monthStart.setHours(0, 0, 0, 0);
                    console.log('本月开始日期:', monthStart.toISOString(), '当前日期:', today.toISOString(), '明天日期:', tomorrow.toISOString());
                    console.log('计算月统计范围:', monthStart.toISOString(), '至', tomorrow.toISOString());
                    // 计算本月任务总时长
                    monthlyDuration = tasks.reduce((total, task) => {
                        try {
                            const startTime = task.start || task.start_time || task.startTime || task.date || '';
                            if (!startTime)
                                return total;
                            // 确保时长至少为1分钟
                            let duration = parseInt(task.duration || task.time || '0');
                            if (isNaN(duration))
                                duration = 0;
                            duration = Math.max(duration, 1); // 确保至少为1分钟
                            const taskDate = new Date(startTime);
                            if (isNaN(taskDate.getTime()))
                                return total; // 无效日期
                            // 本月任务
                            if (taskDate >= monthStart && taskDate < tomorrow) {
                                console.log('找到本月任务:', task.name, '时长:', duration, '分钟', '日期:', taskDate.toISOString());
                                return total + duration;
                            }
                            return total;
                        }
                        catch (e) {
                            console.error('处理任务日期失败:', e);
                            return total;
                        }
                    }, 0);
                    console.log('计算得到的月统计数据:', monthlyDuration, '分钟');
                }
                else {
                    monthlyDuration = 0;
                    console.log('没有任务数据，月统计设为0');
                }
            }
            catch (e) {
                console.error('计算月统计数据失败:', e);
                monthlyDuration = 0;
            }
        }
        const totalHours = response.data?.total_hours ||
            response.data?.totalHours ||
            (response.data?.total_minutes || response.data?.totalMinutes || 0) / 60 || 0;
        // 确保所有值都是数字
        let processedStats = {
            dailyDuration: typeof dailyDuration === 'number' ? dailyDuration : 0,
            weeklyDuration: typeof weeklyDuration === 'number' ? weeklyDuration : 0,
            monthlyDuration: typeof monthlyDuration === 'number' ? monthlyDuration : 0,
            totalHours: typeof totalHours === 'number' ? totalHours : 0
        };
        // 如果今日有数据但本周或本月为0，则使用今日数据更新本周和本月数据
        if (processedStats.dailyDuration > 0) {
            // 如果本周数据为0，则至少应该包含今日数据
            if (processedStats.weeklyDuration === 0) {
                processedStats.weeklyDuration = processedStats.dailyDuration;
                console.log('本周数据为0但今日有数据，更新本周数据为:', processedStats.dailyDuration);
            }
            // 如果本月数据为0，则至少应该包含今日数据
            if (processedStats.monthlyDuration === 0) {
                processedStats.monthlyDuration = processedStats.dailyDuration;
                console.log('本月数据为0但今日有数据，更新本月数据为:', processedStats.dailyDuration);
            }
        }
        // 确保本周数据至少等于本日数据
        if (processedStats.weeklyDuration < processedStats.dailyDuration) {
            processedStats.weeklyDuration = processedStats.dailyDuration;
            console.log('本周数据小于今日数据，更新本周数据为:', processedStats.dailyDuration);
        }
        // 确保本月数据至少等于本周数据
        if (processedStats.monthlyDuration < processedStats.weeklyDuration) {
            processedStats.monthlyDuration = processedStats.weeklyDuration;
            console.log('本月数据小于本周数据，更新本月数据为:', processedStats.weeklyDuration);
        }
        console.log('Processed basic stats:', processedStats);
        return processedStats;
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
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.DAILY));
        // 检查响应格式
        if (response.data?.hourly && Array.isArray(response.data.hourly)) {
            return response.data.hourly.map((item) => ({
                hour: item.hour || parseInt(item.time) || 0,
                time: item.time || `${item.hour}:00`,
                duration: item.duration || 0
            }));
        }
        else if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
                hour: item.hour || parseInt(item.time) || 0,
                time: item.time || `${item.hour}:00`,
                duration: item.duration || 0
            }));
        }
        // 如果没有数据，返回24小时的空数据
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            time: `${i}:00`,
            duration: 0
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
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.WEEKLY));
        // 打印响应数据，用于调试
        console.log('Weekly stats API response:', response.data);
        // 定义一周的天数 - 中国习惯，周一到周日
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        // 创建一个映射，用于存储每天的学习时长
        const dayMap = new Map();
        weekDays.forEach(day => dayMap.set(day, 0));
        // 检查响应格式
        if (Array.isArray(response.data)) {
            // 处理响应数据
            response.data.forEach((item) => {
                const day = item.day || '';
                const duration = item.duration || 0;
                if (weekDays.includes(day)) {
                    dayMap.set(day, duration);
                }
            });
        }
        else if (response.data?.weekly && Array.isArray(response.data.weekly)) {
            // 处理响应数据
            response.data.weekly.forEach((item) => {
                const day = item.day || '';
                const duration = item.duration || 0;
                if (weekDays.includes(day)) {
                    dayMap.set(day, duration);
                }
            });
        }
        // 转换为数组格式
        const result = weekDays.map(day => ({
            day,
            duration: dayMap.get(day) || 0
        }));
        // 打印处理后的数据，用于调试
        console.log('Processed weekly stats:', result);
        return result;
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
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.MONTHLY));
        // 打印响应数据，用于调试
        console.log('Monthly stats API response:', response.data);
        // 获取当月天数
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        // 创建一个包含当月所有日期的数组
        const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
        // 创建一个映射，用于存储每天的学习时长
        const dayMap = new Map();
        monthDays.forEach(day => dayMap.set(day, 0));
        // 检查响应格式
        if (Array.isArray(response.data)) {
            // 处理响应数据
            response.data.forEach((item) => {
                let day = item.day || item.date || '';
                const duration = item.duration || 0;
                // 确保日期格式为 "X日"
                if (day && !day.includes('日')) {
                    // 尝试提取日期数字
                    const dayNumber = parseInt(day);
                    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
                        day = `${dayNumber}日`;
                    }
                }
                if (monthDays.includes(day)) {
                    dayMap.set(day, duration);
                }
            });
        }
        else if (response.data?.daily && Array.isArray(response.data.daily)) {
            // 处理响应数据
            response.data.daily.forEach((item) => {
                let day = item.day || item.date || '';
                const duration = item.duration || 0;
                // 确保日期格式为 "X日"
                if (day && !day.includes('日')) {
                    // 尝试提取日期数字
                    const dayNumber = parseInt(day);
                    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
                        day = `${dayNumber}日`;
                    }
                }
                if (monthDays.includes(day)) {
                    dayMap.set(day, duration);
                }
            });
        }
        // 转换为数组格式
        const result = monthDays.map(day => ({
            day,
            duration: dayMap.get(day) || 0
        }));
        // 打印处理后的数据，用于调试
        console.log('Processed monthly stats:', result);
        return result;
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
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.HEATMAP));
        // 检查响应格式
        if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
                date: item.date || '',
                duration: item.duration || item.count || item.value || 0
            }));
        }
        return [];
    }
    catch (error) {
        console.error('获取热力图数据失败:', error);
        return [];
    }
};
/**
 * 获取时间分布数据
 */
export const fetchTimeDistribution = async () => {
    try {
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.TIME_DISTRIBUTION));
        // 检查响应格式
        if (response.data?.hourly && Array.isArray(response.data.hourly)) {
            return response.data.hourly.map((item) => ({
                hour: item.hour || parseInt(item.time) || 0,
                duration: item.duration || 0
            }));
        }
        else if (Array.isArray(response.data)) {
            return response.data.map((item) => ({
                hour: item.hour || parseInt(item.time) || 0,
                duration: item.duration || 0
            }));
        }
        // 如果没有数据，返回24小时的空数据
        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            duration: 0
        }));
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
 * 从任务数据中提取内容统计信息
 */
export const fetchContentStats = async () => {
    try {
        // 获取所有任务
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.USER_STATS));
        // 打印响应数据，用于调试
        console.log('Content stats API response:', response.data);
        // 确保我们有任务数据
        let tasks = [];
        // 检查响应格式
        if (Array.isArray(response.data)) {
            tasks = response.data;
        }
        else if (response.data?.tasks && Array.isArray(response.data.tasks)) {
            tasks = response.data.tasks;
        }
        else if (response.data?.records && Array.isArray(response.data.records)) {
            tasks = response.data.records;
        }
        else if (response.data?.data && Array.isArray(response.data.data)) {
            tasks = response.data.data;
        }
        else if (response.data?.results && Array.isArray(response.data.results)) {
            tasks = response.data.results;
        }
        // 如果没有找到任务数组，尝试从响应对象中提取
        if (tasks.length === 0 && typeof response.data === 'object') {
            console.log('尝试从响应对象中提取任务数据');
            // 遍历响应对象的所有属性
            for (const key in response.data) {
                if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
                    // 检查第一个元素是否有任务相关的属性
                    const firstItem = response.data[key][0];
                    if (firstItem && (firstItem.name || firstItem.content || firstItem.duration || firstItem.start)) {
                        console.log(`找到可能的任务数组: ${key}，长度: ${response.data[key].length}`);
                        tasks = response.data[key];
                        break;
                    }
                }
            }
        }
        // 打印任务数据，用于调试
        console.log('获取到任务数据:', tasks.length, '条记录');
        // 如果没有任务数据，创建一些默认的内容统计数据
        if (tasks.length === 0) {
            console.log('No tasks found for content stats, creating default data');
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
        // 打印前5条任务数据，用于调试
        console.log('任务数据示例:', tasks.slice(0, 5));
        // 当前日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 本周开始日期（周一）- 中国习惯
        const weekStart = new Date(today);
        const dayOfWeek = today.getDay(); // 0是周日，1是周一，...
        // 如果今天是周日(0)，则设置为前一周的周一，否则设置为本周的周一
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(today.getDate() - daysToSubtract);
        weekStart.setHours(0, 0, 0, 0);
        console.log('内容统计 - 本周开始日期:', weekStart.toISOString());
        // 本月开始日期
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        console.log('内容统计 - 本月开始日期:', monthStart.toISOString(), '当前日期:', today.toISOString());
        // 明天日期（用于日期范围比较）
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 按内容分类统计任务时长
        const dailyContentMap = new Map();
        const weeklyContentMap = new Map();
        const monthlyContentMap = new Map();
        // 处理每个任务
        tasks.forEach((task) => {
            // 尝试获取任务的开始时间
            const startTime = task.start || task.start_time || task.startTime || task.date || '';
            if (!startTime)
                return;
            // 尝试获取任务的持续时间
            let duration = parseInt(task.duration || task.time || '0');
            if (isNaN(duration))
                duration = 0;
            // 确保时长至少为1分钟
            duration = Math.max(duration, 1);
            try {
                const taskDate = new Date(startTime);
                if (isNaN(taskDate.getTime()))
                    return; // 无效日期
                // 确保使用任务名称，如果没有则使用未分类
                const name = task.name || task.content || task.title || task.task || '未分类';
                // 打印任务信息，用于调试
                console.log(`Processing task: ${name}, date: ${taskDate.toISOString()}, duration: ${duration}`);
                // 今日任务
                if (taskDate >= today && taskDate < tomorrow) {
                    console.log(`- 今日任务: ${name}, 时长: ${duration}`);
                    const currentDuration = dailyContentMap.get(name) || 0;
                    dailyContentMap.set(name, currentDuration + duration);
                }
                // 本周任务
                if (taskDate >= weekStart && taskDate < tomorrow) {
                    console.log(`- 本周任务: ${name}, 时长: ${duration}`);
                    const currentDuration = weeklyContentMap.get(name) || 0;
                    weeklyContentMap.set(name, currentDuration + duration);
                }
                // 本月任务
                if (taskDate >= monthStart && taskDate < tomorrow) {
                    console.log(`- 本月任务: ${name}, 时长: ${duration}`);
                    const currentDuration = monthlyContentMap.get(name) || 0;
                    monthlyContentMap.set(name, currentDuration + duration);
                }
            }
            catch (e) {
                console.error('处理任务日期失败:', startTime, e);
            }
        });
        // 转换为数组格式
        let dailyContentStats = Array.from(dailyContentMap.entries())
            .map(([name, duration]) => ({ name, duration }))
            .sort((a, b) => b.duration - a.duration);
        let weeklyContentStats = Array.from(weeklyContentMap.entries())
            .map(([name, duration]) => ({ name, duration }))
            .sort((a, b) => b.duration - a.duration);
        let monthlyContentStats = Array.from(monthlyContentMap.entries())
            .map(([name, duration]) => ({ name, duration }))
            .sort((a, b) => b.duration - a.duration);
        // 如果没有数据，创建默认数据
        if (dailyContentStats.length === 0) {
            dailyContentStats = [{ name: '未分类', duration: 1 }];
        }
        if (weeklyContentStats.length === 0) {
            weeklyContentStats = [{ name: '未分类', duration: 1 }];
        }
        if (monthlyContentStats.length === 0) {
            monthlyContentStats = [{ name: '未分类', duration: 1 }];
        }
        // 打印处理后的内容统计数据，用于调试
        console.log('Daily content stats:', dailyContentStats);
        console.log('Weekly content stats:', weeklyContentStats);
        console.log('Monthly content stats:', monthlyContentStats);
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
//# sourceMappingURL=StatisticsService.js.map