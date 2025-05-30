/**
 * 任务服务
 * 提供任务相关的API调用和状态管理
 */
import { ref } from 'vue';
import { apiService } from './apiService';
import { API_CONFIG } from '../../config';
import eventBus, { EVENT_NAMES } from '../../utils/eventBus';

// 任务状态
const tasks = ref<any[]>([]);
const isLoading = ref(false);
const error = ref('');

/**
 * 任务服务
 */
export const taskService = {
  // 响应式状态
  tasks,
  isLoading,
  error,

  /**
   * 获取所有任务
   */
  async getTasks() {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
      tasks.value = response.data;
      return response.data;
    } catch (err: any) {
      console.error('获取任务失败:', err);
      error.value = err.response?.data?.detail || '获取任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 获取所有任务（别名，与 getTasks 相同）
   */
  async getAllTasks() {
    return this.getTasks();
  },

  /**
   * 获取今日任务
   */
  async getTodayTasks() {
    isLoading.value = true;
    error.value = '';

    try {
      // 使用基础端点并添加查询参数
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/today`);
      return response.data;
    } catch (err: any) {
      console.error('获取今日任务失败:', err);
      error.value = err.response?.data?.detail || '获取今日任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 获取单个任务
   * @param id 任务ID
   */
  async getTask(id: number) {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}`);
      return response.data;
    } catch (err: any) {
      console.error(`获取任务 ${id} 失败:`, err);
      error.value = err.response?.data?.detail || '获取任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 创建任务
   * @param task 任务数据
   */
  async createTask(task: any) {
    isLoading.value = true;
    error.value = '';

    try {
      // 确保任务是已完成的
      if (!task.completed) {
        throw new Error('只能创建已完成的任务');
      }

      const response = await apiService.post(API_CONFIG.ENDPOINTS.TASKS.BASE, task);
      // 更新本地任务列表
      tasks.value = [...tasks.value, response.data];
      return response.data;
    } catch (err: any) {
      console.error('创建任务失败:', err);
      error.value = err.response?.data?.detail || '创建任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 添加任务（别名，与 createTask 相同）
   * @param task 任务数据
   */
  async addTask(task: any) {
    return this.createTask(task);
  },

  /**
   * 更新任务
   * @param id 任务ID
   * @param task 任务数据
   */
  async updateTask(id: number, task: any) {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.put(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}`, task);
      // 更新本地任务列表
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
        tasks.value = [...tasks.value];
      }
      return response.data;
    } catch (err: any) {
      console.error(`更新任务 ${id} 失败:`, err);
      error.value = err.response?.data?.detail || '更新任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 删除任务
   * @param id 任务ID
   */
  async deleteTask(id: number) {
    isLoading.value = true;
    error.value = '';

    try {
      await apiService.delete(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}`);
      // 更新本地任务列表
      tasks.value = tasks.value.filter(t => t.id !== id);
      return true;
    } catch (err: any) {
      console.error(`删除任务 ${id} 失败:`, err);
      error.value = err.response?.data?.detail || '删除任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 开始任务
   * @param id 任务ID
   */
  async startTask(id: number) {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.post(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}/start`);
      // 更新本地任务列表
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
        tasks.value = [...tasks.value];
      }

      // 广播任务开始事件
      console.log('任务开始，广播事件:', EVENT_NAMES.TASK_STARTED, '任务数据:', response.data);

      // 确保任务数据包含用户信息
      if (!response.data.user || !response.data.user.id) {
        console.warn('任务数据缺少用户信息，尝试添加');
        // 尝试从localStorage获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser && currentUser.id) {
          response.data.user = {
            id: currentUser.id,
            username: currentUser.username || '未知用户'
          };
          console.log('已添加用户信息到任务数据:', response.data);
        } else {
          console.error('无法获取当前用户信息，任务开始事件可能无法正确处理');
        }
      }

      eventBus.emit(EVENT_NAMES.TASK_STARTED, response.data);

      return response.data;
    } catch (err: any) {
      console.error(`开始任务 ${id} 失败:`, err);
      error.value = err.response?.data?.detail || '开始任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 完成任务
   * @param id 任务ID
   * @param taskData 可选的任务数据，包含结束时间和持续时间
   */
  async completeTask(id: number, taskData?: any) {
    isLoading.value = true;
    error.value = '';

    try {
      // 如果提供了任务数据，使用PUT请求更新任务
      let response;
      if (taskData) {
        // 确保任务被标记为已完成
        taskData.completed = true;

        // 使用PUT请求更新任务
        response = await apiService.put(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}`, taskData);
      } else {
        // 否则使用原来的完成任务端点
        response = await apiService.post(`${API_CONFIG.ENDPOINTS.TASKS.BASE}/${id}/complete`);
      }

      // 更新本地任务列表
      const index = tasks.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks.value[index] = response.data;
        tasks.value = [...tasks.value];
      }

      // 广播任务完成事件
      eventBus.emit(EVENT_NAMES.TASK_COMPLETED, response.data);

      return response.data;
    } catch (err: any) {
      console.error(`完成任务 ${id} 失败:`, err);
      error.value = err.response?.data?.detail || '完成任务失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 获取每日统计数据
   */
  async getDailyStats() {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.STATISTICS.DAILY}`);
      console.log('Daily stats raw response:', response.data);

      // 处理不同格式的响应
      if (response.data) {
        // 如果响应是对象，尝试获取duration字段
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // 尝试不同的字段名
          const duration = response.data.duration ||
                          response.data.daily_duration ||
                          response.data.dailyDuration ||
                          0;
          return { duration };
        }
        // 如果响应是数组，返回第一个元素的duration
        else if (Array.isArray(response.data) && response.data.length > 0) {
          const firstItem = response.data[0];
          const duration = firstItem.duration || 0;
          return { duration };
        }
      }

      // 默认返回
      return { duration: 0 };
    } catch (err: any) {
      console.error('获取每日统计数据失败:', err);
      error.value = err.response?.data?.detail || '获取每日统计数据失败';
      // 返回默认值，避免前端出错
      return { duration: 0 };
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 获取总体统计数据
   */
  async getTotalStats() {
    isLoading.value = true;
    error.value = '';

    try {
      // 使用正确的统计端点
      const response = await apiService.get(`${API_CONFIG.ENDPOINTS.STATISTICS.TOTAL}`);

      // 处理不同格式的响应
      if (response.data) {
        // 如果响应是对象，尝试获取hours字段
        if (typeof response.data === 'object') {
          // 尝试不同的字段名
          const hours = response.data.hours ||
                       response.data.totalHours ||
                       response.data.total_hours ||
                       response.data.total_time_hours ||
                       0;

          // 如果有分钟数据，转换为小时
          if (response.data.total_minutes || response.data.totalMinutes) {
            const minutes = response.data.total_minutes || response.data.totalMinutes || 0;
            const hoursFromMinutes = Math.round((minutes / 60) * 100) / 100; // 保留两位小数

            // 如果已经有小时数据，加上分钟转换的小时数
            if (hours > 0) {
              return { hours: hours + hoursFromMinutes };
            } else {
              return { hours: hoursFromMinutes };
            }
          }

          return { hours };
        }
      }

      // 默认返回
      return { hours: 0 };
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('获取总体统计数据失败');
      }
      error.value = err.response?.data?.detail || '获取总体统计数据失败';
      // 返回默认值，避免前端出错
      return { hours: 0 };
    } finally {
      isLoading.value = false;
    }
  }
};

export default taskService;
