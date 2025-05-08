/**
 * 任务服务
 * 处理任务的创建、获取、更新、删除等操作
 */
import { apiService } from '../../../shared/services/apiService';
import { TaskStorage, Task } from './taskStorage';
import { API_CONFIG } from '../../../config';

// 任务存储
const taskStorage = new TaskStorage();

/**
 * 任务服务类
 */
export class TaskService {
  /**
   * 获取所有任务
   */
  async getTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
      return response.data || [];
    } catch (error) {
      console.error('获取任务失败:', error);
      return taskStorage.getTasks(); // 从本地获取备份
    }
  }

  /**
   * 获取今日任务
   */
  async getTodayTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/today`);
      return response.data || [];
    } catch (error) {
      console.error('获取今日任务失败:', error);
      return [];
    }
  }

  /**
   * 创建任务
   * @param task 任务数据
   */
  async createTask(task: Task): Promise<Task | null> {
    try {
      const response = await apiService.post(API_CONFIG.ENDPOINTS.TASKS.BASE, task);
      return response.data;
    } catch (error) {
      console.error('创建任务失败:', error);
      // 本地备份
      return taskStorage.saveTask(task);
    }
  }

  /**
   * 更新任务
   * @param taskId 任务ID
   * @param task 任务数据
   */
  async updateTask(taskId: number, task: Partial<Task>): Promise<Task | null> {
    try {
      const response = await apiService.put(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`, task);
      return response.data;
    } catch (error) {
      console.error('更新任务失败:', error);
      // 本地备份
      const fullTask = { ...task, id: taskId } as Task;
      return taskStorage.saveTask(fullTask);
    }
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   */
  async deleteTask(taskId: number): Promise<boolean> {
    try {
      await apiService.delete(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`);
      // 同时删除本地备份
      taskStorage.deleteTask(taskId);
      return true;
    } catch (error) {
      console.error('删除任务失败:', error);
      return false;
    }
  }

  /**
   * 完成任务
   * @param taskId 任务ID
   * @param duration 持续时间（分钟）
   */
  async completeTask(taskId: number, duration: number): Promise<Task | null> {
    try {
      // 获取任务当前状态
      const task = await this.getTask(taskId);
      if (!task) return null;
      
      // 更新任务状态
      const updatedTask = {
        ...task,
        completed: true,
        duration: duration
      };
      
      return await this.updateTask(taskId, updatedTask);
    } catch (error) {
      console.error('完成任务失败:', error);
      return null;
    }
  }

  /**
   * 获取单个任务
   * @param taskId 任务ID
   */
  async getTask(taskId: number): Promise<Task | null> {
    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('获取任务详情失败:', error);
      // 尝试从本地获取
      const tasks = taskStorage.getTasks();
      return tasks.find(t => t.id === taskId) || null;
    }
  }
}

// 导出任务服务实例
export const taskService = new TaskService();
