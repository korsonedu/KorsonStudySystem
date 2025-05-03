/**
 * 任务服务
 * 直接使用后端API存储任务数据
 */
import apiService from './apiService';
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
     * 获取总计统计
     */
    async getTotalStats() {
        try {
            // 获取所有任务
            const tasks = await this.getAllTasks();
            // 计算总时长（分钟）
            const totalMinutes = tasks.reduce((total, task) => total + (task.duration || 0), 0);
            return {
                count: tasks.length,
                duration: totalMinutes,
                hours: parseFloat((totalMinutes / 60).toFixed(2))
            };
        }
        catch (error) {
            console.error('Error getting total stats:', error);
            return { count: 0, duration: 0, hours: 0 };
        }
    }
}
// 创建默认实例
export const taskService = new TaskService();
export default taskService;
//# sourceMappingURL=taskService.js.map