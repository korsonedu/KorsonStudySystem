/**
 * 任务服务
 * 直接使用后端API存储任务数据
 */
import { apiService } from '../shared/services/apiService';
import { API_CONFIG } from '../config';
/**
 * 任务服务类
 */
export class TaskService {
    /**
     * 获取所有任务
     */
    async getAllTasks() {
        try {
            console.log('Calling getTasks API...');
            const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
            if (response && response.data) {
                const tasks = Array.isArray(response.data) ? response.data : [response.data];
                console.log('Successfully fetched tasks from API:', tasks.length);
                // 按开始时间排序（最新的在前面）
                return tasks.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
            }
            return [];
        }
        catch (error) {
            console.error('Error getting all tasks:', error);
            throw error;
        }
    }
    /**
     * 添加新任务
     */
    async addTask(task) {
        try {
            console.log('Creating task with API:', task);
            const response = await apiService.post(API_CONFIG.ENDPOINTS.TASKS.BASE, task);
            if (response && response.data) {
                console.log('Task saved to API successfully:', response.data);
                return response.data;
            }
            throw new Error('Failed to create task: No data returned from API');
        }
        catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    }
    /**
     * 删除任务
     */
    async deleteTask(taskId) {
        try {
            await apiService.delete(API_CONFIG.ENDPOINTS.TASKS.DETAIL(taskId));
            console.log('Task deleted from API successfully');
        }
        catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }
    /**
     * 获取今日任务统计
     */
    async getDailyStats() {
        try {
            // 获取所有任务
            const tasks = await this.getAllTasks();
            // 获取今天的日期范围（中国时区）
            const now = new Date();
            const chinaTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
            // 设置为当天的开始和结束时间
            const todayStart = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate()).getTime();
            const todayEnd = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate(), 23, 59, 59, 999).getTime();
            // 过滤今天的任务
            const todayTasks = tasks.filter(task => {
                if (!task.start)
                    return false;
                // 将任务开始时间转换为中国时区
                const taskDate = new Date(task.start);
                const taskDateChina = new Date(taskDate.getTime() + (taskDate.getTimezoneOffset() + 480) * 60000).getTime();
                return taskDateChina >= todayStart && taskDateChina <= todayEnd;
            });
            // 计算总时长
            const totalDuration = todayTasks.reduce((total, task) => total + (task.duration || 0), 0);
            return {
                count: todayTasks.length,
                duration: totalDuration
            };
        }
        catch (error) {
            console.error('Error getting daily stats:', error);
            return { count: 0, duration: 0 };
        }
    }
    /**
     * 获取每日统计
     */
    async getDailyStats() {
        try {
            // 使用统计API获取每日统计数据
            const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY);
            if (response && response.data) {
                return {
                    count: response.data.count || 0,
                    duration: response.data.duration || 0
                };
            }
            // 如果API调用失败，回退到本地计算
            const todayTasks = await this.getTodayTasks();
            const totalDuration = todayTasks.reduce((total, task) => total + (task.duration || 0), 0);
            return {
                count: todayTasks.length,
                duration: totalDuration
            };
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('获取每日统计失败');
            }
            try {
                // 尝试从本地计算
                const todayTasks = await this.getTodayTasks();
                const totalDuration = todayTasks.reduce((total, task) => total + (task.duration || 0), 0);
                return {
                    count: todayTasks.length,
                    duration: totalDuration
                };
            }
            catch (fallbackError) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('本地计算失败');
                }
                // 返回默认值
                return { count: 0, duration: 0 };
            }
        }
    }
    /**
     * 获取今日任务
     */
    async getTodayTasks() {
        try {
            const response = await apiService.get(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/today`);
            if (response && response.data) {
                const tasks = Array.isArray(response.data) ? response.data : [response.data];
                return tasks.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
            }
            return [];
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('获取今日任务失败');
            }
            // 如果API调用失败，回退到过滤所有任务
            try {
                const allTasks = await this.getAllTasks();
                // 获取今天的日期范围（中国时区）
                const now = new Date();
                const chinaTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
                // 设置为当天的开始和结束时间
                const todayStart = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate()).getTime();
                const todayEnd = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate(), 23, 59, 59, 999).getTime();
                // 过滤今天的任务
                const todayTasks = allTasks.filter(task => {
                    if (!task.start)
                        return false;
                    // 将任务开始时间转换为中国时区
                    const taskDate = new Date(task.start);
                    const taskDateChina = new Date(taskDate.getTime() + (taskDate.getTimezoneOffset() + 480) * 60000).getTime();
                    return taskDateChina >= todayStart && taskDateChina <= todayEnd;
                });
                return todayTasks;
            }
            catch (fallbackError) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('本地过滤任务失败');
                }
                return [];
            }
        }
    }
    /**
     * 获取总计统计
     */
    async getTotalStats() {
        try {
            // 使用统计API获取总计数据
            const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL);
            if (response && response.data) {
                return {
                    count: response.data.total_tasks || 0,
                    duration: response.data.total_minutes || 0,
                    hours: response.data.total_hours || 0
                };
            }
            // 如果API调用失败，回退到本地计算
            const tasks = await this.getAllTasks();
            const totalMinutes = tasks.reduce((total, task) => total + (task.duration || 0), 0);
            return {
                count: tasks.length,
                duration: totalMinutes,
                hours: parseFloat((totalMinutes / 60).toFixed(2))
            };
        }
        catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('获取总计统计失败');
            }
            try {
                // 尝试从本地计算
                const tasks = await this.getAllTasks();
                const totalMinutes = tasks.reduce((total, task) => total + (task.duration || 0), 0);
                return {
                    count: tasks.length,
                    duration: totalMinutes,
                    hours: parseFloat((totalMinutes / 60).toFixed(2))
                };
            }
            catch (fallbackError) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('本地计算失败');
                }
                // 返回默认值
                return { count: 0, duration: 0, hours: 0 };
            }
        }
    }
}
// 创建默认实例
export const taskService = new TaskService();
export default taskService;
//# sourceMappingURL=taskService.js.map