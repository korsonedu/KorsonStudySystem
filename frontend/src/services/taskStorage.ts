/**
 * 任务存储服务
 * 实现任务的混合存储策略（本地存储 + 后端API）
 */

import { storage } from '../utils/storage';
import { tasksAPI } from './api';

// 任务类型定义
export interface Task {
  id?: number;
  name: string;
  duration: number;
  start: string;
  end: string;
  completed: boolean;
}

// 本地存储键
const TASKS_STORAGE_KEY = 'tasks';
const SYNC_STATUS_KEY = 'tasks_sync_status';

/**
 * 任务存储服务
 */
export class TaskStorageService {
  /**
   * 获取所有任务（合并本地和远程）
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      // 尝试从API获取任务
      let apiTasks: Task[] = [];
      let apiSuccess = false;
      
      try {
        const response = await tasksAPI.getTasks();
        if (response && response.data) {
          apiTasks = Array.isArray(response.data) ? response.data : [response.data];
          apiSuccess = true;
          console.log('Successfully fetched tasks from API:', apiTasks.length);
        }
      } catch (error) {
        console.error('Failed to fetch tasks from API:', error);
      }
      
      // 获取本地任务
      const localTasks: Task[] = storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
      console.log('Local tasks:', localTasks.length);
      
      // 如果API成功，尝试同步本地未同步的任务
      if (apiSuccess) {
        await this.syncLocalTasksToAPI(localTasks, apiTasks);
      }
      
      // 合并任务（避免重复）
      const mergedTasks = [...apiTasks];
      
      // 添加本地任务（只添加那些在API中不存在的）
      for (const localTask of localTasks) {
        // 检查是否已存在于API任务中
        const exists = apiTasks.some((apiTask: Task) =>
          this.areTasksEqual(apiTask, localTask)
        );
        
        if (!exists) {
          mergedTasks.push(localTask);
        }
      }
      
      // 按开始时间排序（最新的在前面）
      return mergedTasks.sort((a, b) => 
        new Date(b.start).getTime() - new Date(a.start).getTime()
      );
    } catch (error) {
      console.error('Error getting all tasks:', error);
      
      // 如果出错，返回本地任务
      return storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
    }
  }
  
  /**
   * 添加新任务
   */
  async addTask(task: Task): Promise<Task> {
    try {
      // 尝试保存到API
      let apiSuccess = false;
      let apiTask: Task | null = null;
      
      try {
        const response = await tasksAPI.createTask(task);
        if (response && response.data) {
          apiTask = response.data;
          apiSuccess = true;
          console.log('Task saved to API successfully:', apiTask);
        }
      } catch (error) {
        console.error('Failed to save task to API:', error);
      }
      
      if (apiSuccess && apiTask) {
        // 如果API保存成功，返回API任务
        return apiTask;
      } else {
        // 如果API保存失败，保存到本地
        const localTask: Task = {
          ...task,
          id: Date.now() // 使用时间戳作为临时ID
        };
        
        // 获取现有任务并添加新任务
        const tasks = storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
        tasks.push(localTask);
        
        // 保存回本地存储
        storage.setItem(TASKS_STORAGE_KEY, tasks);
        console.log('Task saved to local storage:', localTask);
        
        return localTask;
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }
  
  /**
   * 删除任务
   */
  async deleteTask(taskId: number): Promise<void> {
    try {
      // 尝试从API删除
      let apiSuccess = false;
      
      try {
        await tasksAPI.deleteTask(taskId);
        apiSuccess = true;
        console.log('Task deleted from API successfully');
      } catch (error) {
        console.error('Failed to delete task from API:', error);
      }
      
      // 无论API是否成功，都从本地存储中删除
      const tasks = storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      storage.setItem(TASKS_STORAGE_KEY, updatedTasks);
      
      console.log('Task removed from local storage');
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
  
  /**
   * 同步本地任务到API
   */
  private async syncLocalTasksToAPI(localTasks: Task[], apiTasks: Task[]): Promise<void> {
    // 获取需要同步的任务（本地有但API没有的）
    const tasksToSync = localTasks.filter(localTask => 
      !apiTasks.some(apiTask => this.areTasksEqual(apiTask, localTask))
    );
    
    if (tasksToSync.length === 0) {
      console.log('No tasks need to be synced to API');
      return;
    }
    
    console.log(`Syncing ${tasksToSync.length} tasks to API`);
    
    // 同步每个任务
    const syncResults = await Promise.allSettled(
      tasksToSync.map(task => tasksAPI.createTask(task))
    );
    
    // 统计结果
    const succeeded = syncResults.filter(result => result.status === 'fulfilled').length;
    const failed = syncResults.filter(result => result.status === 'rejected').length;
    
    console.log(`Sync results: ${succeeded} succeeded, ${failed} failed`);
    
    // 更新本地存储（移除已成功同步的任务）
    if (succeeded > 0) {
      const remainingTasks = localTasks.filter(localTask => {
        // 检查任务是否已在API中存在
        return !apiTasks.some(apiTask => this.areTasksEqual(apiTask, localTask));
      });
      
      storage.setItem(TASKS_STORAGE_KEY, remainingTasks);
      console.log(`Updated local storage, ${remainingTasks.length} tasks remaining`);
    }
  }
  
  /**
   * 检查两个任务是否相同
   */
  private areTasksEqual(task1: Task, task2: Task): boolean {
    return (
      task1.name === task2.name &&
      task1.duration === task2.duration &&
      task1.start === task2.start &&
      task1.end === task2.end
    );
  }
  
  /**
   * 获取今日任务统计
   */
  getDailyStats(): { count: number, duration: number } {
    const tasks = storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
    
    // 获取今天的日期范围
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    
    // 过滤今天的任务
    const todayTasks = tasks.filter(task => {
      if (!task.start) return false;
      const taskDate = new Date(task.start).getTime();
      return taskDate >= todayStart && taskDate <= todayEnd;
    });
    
    // 计算总时长
    const totalDuration = todayTasks.reduce((total, task) => total + (task.duration || 0), 0);
    
    return {
      count: todayTasks.length,
      duration: totalDuration
    };
  }
  
  /**
   * 获取总计统计
   */
  getTotalStats(): { count: number, duration: number, hours: number } {
    const tasks = storage.getItem<Task[]>(TASKS_STORAGE_KEY, []);
    
    // 计算总时长（分钟）
    const totalMinutes = tasks.reduce((total, task) => total + (task.duration || 0), 0);
    
    return {
      count: tasks.length,
      duration: totalMinutes,
      hours: parseFloat((totalMinutes / 60).toFixed(2))
    };
  }
}

// 创建默认实例
export const taskStorage = new TaskStorageService();

export default taskStorage;
