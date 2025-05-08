/**
 * 用户任务数据服务
 * 负责获取当前登录用户的任务数据，并提供计算统计数据的方法
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG } from '../../../config';
// 定义任务API端点
const TASKS_API = API_CONFIG.ENDPOINTS.TASKS;
const STATISTICS_API = API_CONFIG.ENDPOINTS.STATISTICS;
// 确保URL以斜杠结尾
const ensureTrailingSlash = (url) => {
    if (!url.endsWith('/')) {
        return `${url}/`;
    }
    return url;
};
/**
 * 获取当前登录用户的所有任务
 * @returns 用户任务列表
 */
export const fetchUserTasks = async () => {
    try {
        // 尝试从用户统计API获取任务数据
        const response = await apiService.get(ensureTrailingSlash(STATISTICS_API.USER_STATS));
        // 解析任务数据
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
            // 遍历响应对象的所有属性
            for (const key in response.data) {
                if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
                    // 检查第一个元素是否有任务相关的属性
                    const firstItem = response.data[key][0];
                    if (firstItem && (firstItem.name || firstItem.content || firstItem.duration || firstItem.start)) {
                        tasks = response.data[key];
                        break;
                    }
                }
            }
        }
        // 如果仍然没有找到任务数据，尝试从任务API获取
        if (tasks.length === 0) {
            const tasksResponse = await apiService.get(ensureTrailingSlash(TASKS_API.BASE));
            if (Array.isArray(tasksResponse.data)) {
                tasks = tasksResponse.data;
            }
            else if (tasksResponse.data?.tasks && Array.isArray(tasksResponse.data.tasks)) {
                tasks = tasksResponse.data.tasks;
            }
            else if (tasksResponse.data?.records && Array.isArray(tasksResponse.data.records)) {
                tasks = tasksResponse.data.records;
            }
            else if (tasksResponse.data?.data && Array.isArray(tasksResponse.data.data)) {
                tasks = tasksResponse.data.data;
            }
            else if (tasksResponse.data?.results && Array.isArray(tasksResponse.data.results)) {
                tasks = tasksResponse.data.results;
            }
        }
        // 标准化任务数据
        return tasks.map(task => ({
            id: task.id || task._id || '',
            name: task.name || task.content || task.title || '未命名任务',
            content: task.content || task.description || '',
            duration: parseInt(task.duration || task.time || '0') || 0,
            start: task.start || task.start_time || task.startTime || task.date || '',
            end: task.end || task.end_time || task.endTime || '',
            user_id: task.user_id || task.userId || task.user || '',
            completed: task.completed || task.is_completed || task.isCompleted || false,
            ...task // 保留原始属性
        }));
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取用户任务数据失败');
        }
        return [];
    }
};
/**
 * 获取今日任务
 * @returns 今日任务列表
 */
export const fetchTodayTasks = async () => {
    try {
        // 获取所有任务
        const allTasks = await fetchUserTasks();
        // 当前日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 明天日期
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 过滤今日任务
        return allTasks.filter(task => {
            try {
                const taskDate = new Date(task.start);
                return taskDate >= today && taskDate < tomorrow;
            }
            catch (e) {
                return false;
            }
        });
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取今日任务失败');
        }
        return [];
    }
};
/**
 * 获取本周任务
 * @returns 本周任务列表
 */
export const fetchWeekTasks = async () => {
    try {
        // 获取所有任务
        const allTasks = await fetchUserTasks();
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
        // 明天日期
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 设置本周日期范围
        // 过滤本周任务
        return allTasks.filter(task => {
            try {
                const taskDate = new Date(task.start);
                return taskDate >= weekStart && taskDate < tomorrow;
            }
            catch (e) {
                return false;
            }
        });
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取本周任务失败');
        }
        return [];
    }
};
/**
 * 获取本月任务
 * @returns 本月任务列表
 */
export const fetchMonthTasks = async () => {
    try {
        // 获取所有任务
        const allTasks = await fetchUserTasks();
        // 当前日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 本月开始日期
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        // 明天日期
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // 设置本月日期范围
        // 过滤本月任务
        return allTasks.filter(task => {
            try {
                const taskDate = new Date(task.start);
                return taskDate >= monthStart && taskDate < tomorrow;
            }
            catch (e) {
                return false;
            }
        });
    }
    catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取本月任务失败');
        }
        return [];
    }
};
/**
 * 计算任务总时长
 * @param tasks 任务列表
 * @returns 总时长（分钟）
 */
export const calculateTotalDuration = (tasks) => {
    return tasks.reduce((total, task) => {
        // 确保时长至少为1分钟
        const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
        return total + duration;
    }, 0);
};
/**
 * 按内容分组计算任务时长
 * @param tasks 任务列表
 * @returns 内容统计数据
 */
export const calculateContentStats = (tasks) => {
    // 创建内容映射
    const contentMap = new Map();
    // 处理每个任务
    tasks.forEach(task => {
        const name = task.name || '未分类';
        // 确保时长至少为1分钟
        const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
        // 更新内容映射
        const currentDuration = contentMap.get(name) || 0;
        contentMap.set(name, currentDuration + duration);
    });
    // 转换为数组格式并排序
    return Array.from(contentMap.entries())
        .map(([name, duration]) => ({ name, duration }))
        .sort((a, b) => b.duration - a.duration);
};
/**
 * 计算每小时任务时长分布
 * @param tasks 任务列表
 * @returns 每小时时长分布
 */
export const calculateHourlyDistribution = (tasks) => {
    // 创建24小时的时长映射
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, 0);
    }
    // 处理每个任务
    tasks.forEach(task => {
        try {
            const taskDate = new Date(task.start);
            const hour = taskDate.getHours();
            // 确保时长至少为1分钟
            const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
            // 更新小时映射
            const currentDuration = hourlyMap.get(hour) || 0;
            hourlyMap.set(hour, currentDuration + duration);
        }
        catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('处理任务日期失败');
            }
        }
    });
    // 转换为数组格式
    return Array.from(hourlyMap.entries())
        .map(([hour, duration]) => ({ hour, duration }))
        .sort((a, b) => a.hour - b.hour);
};
/**
 * 计算每天任务时长分布
 * @param tasks 任务列表
 * @returns 每天时长分布
 */
export const calculateDailyDistribution = (tasks) => {
    // 创建一周的时长映射 - 中国习惯，周一到周日
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dailyMap = new Map();
    weekDays.forEach(day => dailyMap.set(day, 0));
    // 处理每个任务
    tasks.forEach(task => {
        try {
            const taskDate = new Date(task.start);
            const dayOfWeek = taskDate.getDay(); // 0是周日，1是周一，...
            // 转换为中国习惯的星期几
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const day = weekDays[dayIndex];
            // 确保时长至少为1分钟
            const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
            // 更新日期映射
            const currentDuration = dailyMap.get(day) || 0;
            dailyMap.set(day, currentDuration + duration);
        }
        catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('处理任务日期失败');
            }
        }
    });
    // 转换为数组格式
    return weekDays.map(day => ({
        day,
        duration: dailyMap.get(day) || 0
    }));
};
/**
 * 计算每月任务时长分布
 * @param tasks 任务列表
 * @returns 每月时长分布
 */
export const calculateMonthlyDistribution = (tasks) => {
    // 获取当月天数
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    // 创建当月的时长映射
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
    const monthlyMap = new Map();
    monthDays.forEach(day => monthlyMap.set(day, 0));
    // 处理每个任务
    tasks.forEach(task => {
        try {
            const taskDate = new Date(task.start);
            // 只处理当月的任务
            if (taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
                const day = `${taskDate.getDate()}日`;
                // 确保时长至少为1分钟
                const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
                // 更新日期映射
                const currentDuration = monthlyMap.get(day) || 0;
                monthlyMap.set(day, currentDuration + duration);
            }
        }
        catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('处理任务日期失败');
            }
        }
    });
    // 转换为数组格式
    return monthDays.map(day => ({
        day,
        duration: monthlyMap.get(day) || 0
    }));
};
/**
 * 计算热力图数据
 * @param tasks 任务列表
 * @returns 热力图数据
 */
export const calculateHeatmapData = (tasks) => {
    // 创建日期到时长的映射
    const dateMap = new Map();
    // 处理每个任务
    tasks.forEach(task => {
        try {
            // 跳过没有开始时间的任务
            if (!task.start)
                return;
            // 解析任务日期
            const taskDate = new Date(task.start);
            // 跳过无效日期
            if (isNaN(taskDate.getTime()))
                return;
            // 转换为中国时区
            const chinaTimezoneOffset = 8 * 60 * 60 * 1000;
            const localTimezoneOffset = taskDate.getTimezoneOffset() * 60 * 1000;
            const chinaDate = new Date(taskDate.getTime() + localTimezoneOffset + chinaTimezoneOffset);
            // 获取标准化的日期字符串 YYYY-MM-DD（中国时区）
            const year = chinaDate.getFullYear();
            const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
            const day = String(chinaDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            // 确保时长至少为1分钟
            const duration = Math.max(parseInt(String(task.duration)) || 0, 1);
            // 更新日期映射
            const currentDuration = dateMap.get(dateStr) || 0;
            dateMap.set(dateStr, currentDuration + duration);
            // 更新热力图数据
        }
        catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('处理任务日期失败');
            }
        }
    });
    // 转换为数组格式
    return Array.from(dateMap.entries()).map(([date, duration]) => ({
        date,
        duration
    }));
};
//# sourceMappingURL=UserTasksService.js.map