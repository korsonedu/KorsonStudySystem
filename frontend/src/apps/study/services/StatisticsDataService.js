/**
 * 统计数据服务
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG } from '../../../config';
import { generateHeatmapFromTasks, filterDataByDate } from '../utils/StatisticsUtils';
/**
 * 获取统计数据
 */
export const fetchStatisticsData = async () => {
    // 初始化结果对象
    const result = {
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: [],
        totalStats: {
            dailyMinutes: 0,
            weeklyMinutes: 0,
            monthlyMinutes: 0,
            totalHours: 0
        },
        heatmapData: [],
        timeDistributionData: [],
        dailyContentStats: [],
        weeklyContentStats: [],
        monthlyContentStats: [],
        userRegistrationDate: '',
        error: ''
    };
    try {
        console.log('Fetching statistics data...');
        // 单独调用每个API，以便确定哪个失败了
        let dailyRes, weeklyRes, monthlyRes, totalRes, heatmapRes, timeDistRes, userRes, tasksRes;
        try {
            dailyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY);
            console.log('Daily API call successful');
        }
        catch (error) {
            console.error('Error calling daily API:', error);
            dailyRes = { data: [] };
        }
        try {
            weeklyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY);
            console.log('Weekly API call successful');
        }
        catch (error) {
            console.error('Error calling weekly API:', error);
            weeklyRes = { data: [] };
        }
        try {
            monthlyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY);
            console.log('Monthly API call successful');
        }
        catch (error) {
            console.error('Error calling monthly API:', error);
            monthlyRes = { data: [] };
        }
        try {
            totalRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL);
            console.log('Total API call successful');
        }
        catch (error) {
            console.error('Error calling total API:', error);
            totalRes = { data: {} };
        }
        try {
            heatmapRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP);
            console.log('Heatmap API call successful');
        }
        catch (error) {
            console.error('Error calling heatmap API:', error);
            heatmapRes = { data: [] };
        }
        try {
            timeDistRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION);
            console.log('Time distribution API call successful');
        }
        catch (error) {
            console.error('Error calling time distribution API:', error);
            timeDistRes = { data: [] };
        }
        try {
            userRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO);
            console.log('User info API call successful');
        }
        catch (error) {
            console.error('Error calling user info API:', error);
            userRes = { data: {} };
        }
        try {
            // 尝试使用study命名空间的任务API端点
            tasksRes = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
            console.log('Tasks API call successful:', tasksRes.data?.length || 0, 'tasks found');
            // 如果没有获取到任务数据，尝试使用根路径的任务API
            if (!tasksRes.data || !Array.isArray(tasksRes.data) || tasksRes.data.length === 0) {
                console.log('No tasks found, trying alternative endpoint');
                try {
                    const altTasksRes = await apiService.get('/api/tasks');
                    console.log('Alternative tasks API call successful:', altTasksRes.data?.length || 0, 'tasks found');
                    if (altTasksRes.data && Array.isArray(altTasksRes.data) && altTasksRes.data.length > 0) {
                        tasksRes = altTasksRes;
                    }
                }
                catch (altError) {
                    console.error('Error calling alternative tasks API:', altError);
                }
            }
        }
        catch (error) {
            console.error('Error calling tasks API:', error);
            tasksRes = { data: [] };
        }
        // 处理每日数据
        if (dailyRes && dailyRes.data) {
            // 获取当前日期，用于过滤数据
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
            if (dailyRes.data.hourly && Array.isArray(dailyRes.data.hourly)) {
                // 过滤出今天的数据
                const todayData = filterDataByDate(dailyRes.data.hourly, todayStr);
                result.dailyStats = todayData.length > 0 ? todayData : dailyRes.data.hourly;
            }
            else if (Array.isArray(dailyRes.data)) {
                // 过滤出今天的数据
                const todayData = filterDataByDate(dailyRes.data, todayStr);
                result.dailyStats = todayData.length > 0 ? todayData : dailyRes.data;
            }
            else {
                // 如果数据不是数组，创建一个包含当前小时的数组
                const now = new Date();
                const hour = now.getHours();
                // 获取实际值
                const actualDuration = dailyRes.data.duration ||
                    dailyRes.data.daily_duration ||
                    dailyRes.data.dailyDuration ||
                    0;
                result.dailyStats = [
                    {
                        time: `${hour}:00`,
                        duration: actualDuration,
                        date: todayStr
                    }
                ];
            }
            // 处理每日内容统计
            if (dailyRes.data.content && Array.isArray(dailyRes.data.content)) {
                // 过滤出今天的数据
                const todayContent = filterDataByDate(dailyRes.data.content, todayStr);
                result.dailyContentStats = todayContent.length > 0 ? todayContent : dailyRes.data.content;
            }
            else if (dailyRes.data.contentStats && Array.isArray(dailyRes.data.contentStats)) {
                // 过滤出今天的数据
                const todayContent = filterDataByDate(dailyRes.data.contentStats, todayStr);
                result.dailyContentStats = todayContent.length > 0 ? todayContent : dailyRes.data.contentStats;
            }
            // 如果没有每日内容统计数据，尝试从任务数据生成
            if ((!result.dailyContentStats || result.dailyContentStats.length === 0) &&
                tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
                console.log('Generating daily content stats from tasks');
                // 处理今日任务数据
                const todayTasks = tasksRes.data.filter((task) => {
                    if (task.start) {
                        try {
                            const taskDate = new Date(task.start);
                            const taskDateStr = taskDate.toISOString().split('T')[0];
                            return taskDateStr === todayStr;
                        }
                        catch (e) {
                            console.error('Error parsing task date:', task.start, e);
                            return false;
                        }
                    }
                    return false;
                });
                console.log('Found', todayTasks.length, 'tasks for today');
                // 创建内容映射
                const contentMap = new Map();
                // 处理今日任务数据
                todayTasks.forEach((task) => {
                    const name = task.name || task.content || task.category || '未分类';
                    const duration = task.duration || 0;
                    if (duration > 0) {
                        if (contentMap.has(name)) {
                            contentMap.set(name, contentMap.get(name) + duration);
                        }
                        else {
                            contentMap.set(name, duration);
                        }
                    }
                });
                // 转换为内容统计数据
                result.dailyContentStats = Array.from(contentMap.entries()).map(([name, duration]) => ({
                    name,
                    duration
                }));
                console.log('Generated daily content stats:', result.dailyContentStats.length, 'items');
            }
        }
        // 处理每周数据
        if (weeklyRes && weeklyRes.data) {
            if (Array.isArray(weeklyRes.data)) {
                result.weeklyStats = weeklyRes.data;
            }
            else if (weeklyRes.data.weekly && Array.isArray(weeklyRes.data.weekly)) {
                result.weeklyStats = weeklyRes.data.weekly;
            }
            // 处理每周内容统计
            if (weeklyRes.data.content && Array.isArray(weeklyRes.data.content)) {
                result.weeklyContentStats = weeklyRes.data.content;
            }
            else if (weeklyRes.data.contentStats && Array.isArray(weeklyRes.data.contentStats)) {
                result.weeklyContentStats = weeklyRes.data.contentStats;
            }
        }
        // 如果没有每周数据，尝试从任务数据生成
        if ((!result.weeklyStats || result.weeklyStats.length === 0) &&
            tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
            console.log('Generating weekly stats from tasks');
            // 获取本周的开始日期（周日）
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // 设置为本周日
            weekStart.setHours(0, 0, 0, 0);
            // 创建周数据结构
            const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const weekData = new Array(7).fill(0).map((_, i) => ({
                day: weekDays[i],
                duration: 0
            }));
            // 处理任务数据
            tasksRes.data.forEach((task) => {
                if (task.start && task.duration) {
                    try {
                        const taskDate = new Date(task.start);
                        // 只处理本周的数据
                        if (taskDate >= weekStart && taskDate <= today) {
                            const dayOfWeek = taskDate.getDay(); // 0-6，0表示周日
                            weekData[dayOfWeek].duration += task.duration;
                        }
                    }
                    catch (e) {
                        console.error('Error parsing task date:', task.start, e);
                    }
                }
            });
            result.weeklyStats = weekData;
            console.log('Generated weekly stats:', weekData);
            // 生成每周内容统计
            if (!result.weeklyContentStats || result.weeklyContentStats.length === 0) {
                console.log('Generating weekly content stats from tasks');
                // 创建内容映射
                const contentMap = new Map();
                // 处理任务数据
                tasksRes.data.forEach((task) => {
                    if (task.start && task.duration) {
                        try {
                            const taskDate = new Date(task.start);
                            // 只处理本周的数据
                            if (taskDate >= weekStart && taskDate <= today) {
                                const name = task.name || task.content || task.category || '未分类';
                                if (contentMap.has(name)) {
                                    contentMap.set(name, contentMap.get(name) + task.duration);
                                }
                                else {
                                    contentMap.set(name, task.duration);
                                }
                            }
                        }
                        catch (e) {
                            console.error('Error parsing task date:', task.start, e);
                        }
                    }
                });
                // 转换为内容统计数据
                result.weeklyContentStats = Array.from(contentMap.entries()).map(([name, duration]) => ({
                    name,
                    duration
                }));
                console.log('Generated weekly content stats:', result.weeklyContentStats.length, 'items');
            }
        }
        // 处理每月数据
        if (monthlyRes && monthlyRes.data) {
            if (Array.isArray(monthlyRes.data)) {
                result.monthlyStats = monthlyRes.data;
            }
            else if (monthlyRes.data.monthly && Array.isArray(monthlyRes.data.monthly)) {
                result.monthlyStats = monthlyRes.data.monthly;
            }
            // 处理每月内容统计
            if (monthlyRes.data.content && Array.isArray(monthlyRes.data.content)) {
                result.monthlyContentStats = monthlyRes.data.content;
            }
            else if (monthlyRes.data.contentStats && Array.isArray(monthlyRes.data.contentStats)) {
                result.monthlyContentStats = monthlyRes.data.contentStats;
            }
        }
        // 如果没有每月数据，尝试从任务数据生成
        if ((!result.monthlyStats || result.monthlyStats.length === 0) &&
            tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
            console.log('Generating monthly stats from tasks');
            // 获取当前月份的天数
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            // 获取本月的开始日期
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            // 创建月数据结构
            const monthData = new Array(daysInMonth).fill(0).map((_, i) => ({
                day: `${i + 1}日`,
                duration: 0
            }));
            // 处理任务数据
            tasksRes.data.forEach((task) => {
                if (task.start && task.duration) {
                    try {
                        const taskDate = new Date(task.start);
                        // 只处理本月的数据
                        if (taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
                            const dayOfMonth = taskDate.getDate() - 1; // 0-30
                            if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
                                monthData[dayOfMonth].duration += task.duration;
                            }
                        }
                    }
                    catch (e) {
                        console.error('Error parsing task date:', task.start, e);
                    }
                }
            });
            result.monthlyStats = monthData;
            console.log('Generated monthly stats:', monthData);
            // 生成每月内容统计
            if (!result.monthlyContentStats || result.monthlyContentStats.length === 0) {
                console.log('Generating monthly content stats from tasks');
                // 创建内容映射
                const contentMap = new Map();
                // 处理任务数据
                tasksRes.data.forEach((task) => {
                    if (task.start && task.duration) {
                        try {
                            const taskDate = new Date(task.start);
                            // 只处理本月的数据
                            if (taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear()) {
                                const name = task.name || task.content || task.category || '未分类';
                                if (contentMap.has(name)) {
                                    contentMap.set(name, contentMap.get(name) + task.duration);
                                }
                                else {
                                    contentMap.set(name, task.duration);
                                }
                            }
                        }
                        catch (e) {
                            console.error('Error parsing task date:', task.start, e);
                        }
                    }
                });
                // 转换为内容统计数据
                result.monthlyContentStats = Array.from(contentMap.entries()).map(([name, duration]) => ({
                    name,
                    duration
                }));
                console.log('Generated monthly content stats:', result.monthlyContentStats.length, 'items');
            }
        }
        // 处理热力图数据
        if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data)) {
            // 始终使用任务数据生成热力图，确保数据真实
            console.log('Generating heatmap data from', tasksRes.data.length, 'tasks');
            result.heatmapData = generateHeatmapFromTasks(tasksRes.data);
            // 检查今日数据
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            // 查找今日的任务
            const todayTasks = tasksRes.data.filter((task) => {
                if (!task.start)
                    return false;
                let startDate = '';
                if (typeof task.start === 'string') {
                    startDate = task.start;
                }
                else if (task.date) {
                    startDate = typeof task.date === 'string' ? task.date : '';
                }
                if (startDate && startDate.includes('T')) {
                    startDate = startDate.split('T')[0];
                }
                return startDate === todayStr;
            });
            console.log('Found', todayTasks.length, 'tasks for today');
            // 计算今日总时长
            const todayDuration = todayTasks.reduce((total, task) => {
                return total + (task.duration || 0);
            }, 0);
            console.log('Today\'s total duration:', todayDuration, 'minutes');
            // 确保热力图数据中包含今日数据
            if (result.heatmapData && Array.isArray(result.heatmapData)) {
                // 查找今日数据
                const todayData = result.heatmapData.find((item) => item.date === todayStr);
                if (todayData) {
                    // 更新今日数据
                    todayData.count = todayDuration;
                    console.log('Updated today\'s heatmap data:', todayData);
                }
                else {
                    // 添加今日数据
                    result.heatmapData.push({
                        date: todayStr,
                        count: todayDuration
                    });
                    console.log('Added today\'s heatmap data:', todayDuration, 'minutes');
                }
                // 打印热力图数据，帮助调试
                console.log('Final heatmap data:', result.heatmapData);
            }
        }
        else if (heatmapRes && heatmapRes.data && Array.isArray(heatmapRes.data)) {
            result.heatmapData = heatmapRes.data;
        }
        // 处理时间分布数据
        // 获取当前日期，用于过滤数据
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
        // 首先尝试从任务数据生成时间分布
        if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
            console.log('Generating time distribution data from tasks');
            // 创建24小时的空数据
            const hourlyData = new Array(24).fill(0).map((_, hour) => ({
                hour,
                time: `${hour}:00`,
                duration: 0,
                count: 0,
                date: todayStr
            }));
            // 处理今日任务数据
            const todayTasks = tasksRes.data.filter((task) => {
                if (task.start) {
                    try {
                        const taskDate = new Date(task.start);
                        const taskDateStr = taskDate.toISOString().split('T')[0];
                        return taskDateStr === todayStr;
                    }
                    catch (e) {
                        console.error('Error parsing task date:', task.start, e);
                        return false;
                    }
                }
                return false;
            });
            console.log('Found', todayTasks.length, 'tasks for today');
            // 按小时统计任务时长
            todayTasks.forEach((task) => {
                if (task.start && task.duration) {
                    try {
                        const startTime = new Date(task.start);
                        const hour = startTime.getHours();
                        if (hour >= 0 && hour < 24) {
                            hourlyData[hour].duration += task.duration;
                            hourlyData[hour].count += 1;
                        }
                    }
                    catch (e) {
                        console.error('Error parsing task start time:', task.start, e);
                    }
                }
            });
            // 打印生成的小时数据，帮助调试
            console.log('Generated hourly data:', hourlyData.filter(item => item.duration > 0).length, 'hours with data');
            result.timeDistributionData = hourlyData;
        }
        // 如果没有任务数据，尝试使用API返回的时间分布数据
        else if (timeDistRes && timeDistRes.data) {
            if (Array.isArray(timeDistRes.data)) {
                const todayData = filterDataByDate(timeDistRes.data, todayStr);
                result.timeDistributionData = todayData.length > 0 ? todayData : timeDistRes.data;
            }
            else if (typeof timeDistRes.data === 'object') {
                // 如果是对象，转换为数组格式
                const hourlyData = [];
                Object.entries(timeDistRes.data).forEach(([key, value]) => {
                    const hour = parseInt(key);
                    if (!isNaN(hour) && hour >= 0 && hour < 24) {
                        hourlyData.push({
                            hour,
                            time: `${hour}:00`,
                            duration: typeof value === 'object' ? (value.duration || value.value || 0) : value,
                            count: typeof value === 'object' ? (value.count || 1) : 1,
                            date: typeof value === 'object' && value.date ? value.date : todayStr
                        });
                    }
                });
                result.timeDistributionData = hourlyData;
            }
        }
        // 处理总体统计数据
        // 首先从任务数据计算统计信息，确保数据真实
        if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
            const tasks = tasksRes.data;
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            // 计算今日学习时长
            const dailyMinutes = tasks
                .filter(task => task.start && task.start.startsWith(todayStr))
                .reduce((total, task) => total + (task.duration || 0), 0);
            // 计算本周学习时长
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // 设置为本周日
            weekStart.setHours(0, 0, 0, 0);
            const weeklyMinutes = tasks
                .filter(task => {
                if (!task.start)
                    return false;
                const taskDate = new Date(task.start);
                return taskDate >= weekStart && taskDate <= today;
            })
                .reduce((total, task) => total + (task.duration || 0), 0);
            // 计算本月学习时长
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthlyMinutes = tasks
                .filter(task => {
                if (!task.start)
                    return false;
                const taskDate = new Date(task.start);
                return taskDate >= monthStart && taskDate <= today;
            })
                .reduce((total, task) => total + (task.duration || 0), 0);
            // 计算总学习时长（小时）
            const totalMinutes = tasks.reduce((total, task) => total + (task.duration || 0), 0);
            const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
            result.totalStats = {
                dailyMinutes,
                weeklyMinutes,
                monthlyMinutes,
                totalHours
            };
        }
        // 如果没有任务数据，尝试使用API返回的统计数据
        else if (totalRes && totalRes.data) {
            // 尝试获取不同字段名的数据
            const dailyMinutes = totalRes.data.dailyMinutes ||
                totalRes.data.daily_minutes ||
                totalRes.data.daily_duration ||
                totalRes.data.dailyDuration ||
                0;
            // 尝试从不同字段获取每周数据
            let weeklyMinutes = totalRes.data.weeklyMinutes ||
                totalRes.data.weekly_minutes ||
                totalRes.data.weekly_duration ||
                totalRes.data.weeklyDuration ||
                0;
            // 如果没有直接的每周数据，尝试从每周数据数组计算
            if (weeklyMinutes === 0 && Array.isArray(result.weeklyStats) && result.weeklyStats.length > 0) {
                weeklyMinutes = result.weeklyStats.reduce((total, item) => total + (item.duration || 0), 0);
            }
            // 尝试从不同字段获取每月数据
            let monthlyMinutes = totalRes.data.monthlyMinutes ||
                totalRes.data.monthly_minutes ||
                totalRes.data.monthly_duration ||
                totalRes.data.monthlyDuration ||
                0;
            // 如果没有直接的每月数据，尝试从每月数据数组计算
            if (monthlyMinutes === 0 && Array.isArray(result.monthlyStats) && result.monthlyStats.length > 0) {
                monthlyMinutes = result.monthlyStats.reduce((total, item) => total + (item.duration || 0), 0);
            }
            // 尝试获取总学习时长（小时）
            let totalHours = totalRes.data.totalHours ||
                totalRes.data.total_hours ||
                totalRes.data.hours ||
                0;
            // 如果有总分钟数，转换为小时
            if (totalRes.data.totalMinutes || totalRes.data.total_minutes) {
                const totalMinutes = totalRes.data.totalMinutes || totalRes.data.total_minutes || 0;
                // 将分钟转换为小时，保留两位小数
                const hoursFromMinutes = Math.round((totalMinutes / 60) * 100) / 100;
                // 如果已经有小时数据，加上分钟转换的小时数
                if (totalHours > 0) {
                    totalHours += hoursFromMinutes;
                }
                else {
                    totalHours = hoursFromMinutes;
                }
            }
            // 如果总时长仍然为0，尝试从每日、每周、每月数据计算
            if (totalHours === 0) {
                // 从每日、每周、每月分钟数计算总小时数
                const totalMinutesFromStats = dailyMinutes + weeklyMinutes + monthlyMinutes;
                if (totalMinutesFromStats > 0) {
                    // 将分钟转换为小时，保留两位小数
                    totalHours = Math.round((totalMinutesFromStats / 60) * 100) / 100;
                }
            }
            result.totalStats = {
                dailyMinutes,
                weeklyMinutes,
                monthlyMinutes,
                totalHours
            };
        }
        // 处理用户信息，获取注册日期
        if (userRes && userRes.data) {
            // 用户信息中可能包含不同字段表示注册日期
            const registrationDate = userRes.data.created_at ||
                userRes.data.createdAt ||
                userRes.data.register_date ||
                userRes.data.registerDate;
            if (registrationDate) {
                result.userRegistrationDate = registrationDate;
            }
        }
        return result;
    }
    catch (err) {
        console.error('Error fetching statistics:', err);
        result.error = err.response?.data?.detail || '获取统计数据失败，请稍后再试';
        return result;
    }
};
//# sourceMappingURL=StatisticsDataService.js.map