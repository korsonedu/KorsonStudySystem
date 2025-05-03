/**
 * 学习模块API服务
 * 提供学习模块所有API调用接口
 */
import { apiService } from '../../../shared/services/apiService';
import { API_CONFIG } from '../../../config';

// 任务相关API
export const tasksApi = {
  // 获取任务列表
  getTasks: () => apiService.get(API_CONFIG.ENDPOINTS.TASKS.STUDY_BASE),

  // 创建任务
  createTask: (taskData) => apiService.post(API_CONFIG.ENDPOINTS.TASKS.STUDY_BASE, taskData),

  // 获取任务详情
  getTask: (id) => apiService.get(API_CONFIG.ENDPOINTS.TASKS.STUDY_DETAIL(id)),

  // 更新任务
  updateTask: (id, taskData) =>
    apiService.put(API_CONFIG.ENDPOINTS.TASKS.STUDY_DETAIL(id), taskData),

  // 删除任务
  deleteTask: (id) => apiService.delete(API_CONFIG.ENDPOINTS.TASKS.STUDY_DETAIL(id)),

  // 完成任务
  completeTask: (id, data) =>
    apiService.post(API_CONFIG.ENDPOINTS.TASKS.STUDY_COMPLETE(id), data)
};

// 计划相关API
export const plansApi = {
  // 获取计划列表
  getPlans: () => apiService.get(API_CONFIG.ENDPOINTS.PLANS.STUDY_BASE),

  // 创建计划
  createPlan: (planData) => apiService.post(API_CONFIG.ENDPOINTS.PLANS.STUDY_BASE, planData),

  // 获取计划详情
  getPlan: (id) => apiService.get(API_CONFIG.ENDPOINTS.PLANS.STUDY_DETAIL(id)),

  // 更新计划
  updatePlan: (id, planData) =>
    apiService.put(API_CONFIG.ENDPOINTS.PLANS.STUDY_DETAIL(id), planData),

  // 删除计划
  deletePlan: (id) => apiService.delete(API_CONFIG.ENDPOINTS.PLANS.STUDY_DETAIL(id))
};

// 成就相关API
export const achievementsApi = {
  // 获取成就列表
  getAchievements: () => apiService.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.STUDY_BASE),

  // 获取成就详情
  getAchievement: (id) => apiService.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.STUDY_DETAIL(id)),

  // 解锁成就
  unlockAchievement: (id) => apiService.post(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.STUDY_UNLOCK(id))
};

/**
 * 统计相关API
 */
export const statisticsApi = {
  // 获取基本统计
  getBasicStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_BASE);
      return response;
    } catch (error) {
      console.error('获取基本统计失败:', error);
      return { data: {} };
    }
  },

  // 获取每日统计
  getDailyStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_DAILY);
      return response;
    } catch (error) {
      console.error('获取每日统计失败:', error);
      return { data: {} };
    }
  },

  // 获取每周统计
  getWeeklyStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_WEEKLY);
      return response;
    } catch (error) {
      console.error('获取每周统计失败:', error);
      return { data: {} };
    }
  },

  // 获取每月统计
  getMonthlyStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_MONTHLY);
      return response;
    } catch (error) {
      console.error('获取每月统计失败:', error);
      return { data: {} };
    }
  },

  // 获取总计统计
  getTotalStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_TOTAL);
      return response;
    } catch (error) {
      console.error('获取总计统计失败:', error);
      return { data: {} };
    }
  },

  // 获取热力图数据
  getHeatmapData: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_HEATMAP);
      return response;
    } catch (error) {
      console.error('获取热力图数据失败:', error);
      return { data: [] };
    }
  },

  // 获取时间分布数据
  getTimeDistribution: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_TIME_DISTRIBUTION);
      return response;
    } catch (error) {
      console.error('获取时间分布数据失败:', error);
      return { data: { hourly: [] } };
    }
  },

  // 获取用户统计
  getUserStats: async () => {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.STUDY_USER_INFO);
      return response;
    } catch (error) {
      console.error('获取用户统计失败:', error);
      if (error.response) {
        console.error('服务器响应:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('未收到响应，请求详情:', error.request);
      } else {
        console.error('请求配置错误:', error.message);
      }
      // 返回默认值，避免前端崩溃
      return {
        data: {
          total_tasks: 0,
          total_duration: 0,
          total_hours: 0,
          completed_tasks: 0,
          completion_rate: 0,
          streak_days: 0
        }
      };
    }
  }
};

// 导出所有API
export default {
  tasks: tasksApi,
  plans: plansApi,
  achievements: achievementsApi,
  statistics: statisticsApi
};