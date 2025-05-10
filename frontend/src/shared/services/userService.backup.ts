/**
 * 用户状态管理服务
 * 提供响应式的用户状态管理，确保登录状态变化时自动更新界面
 */
import { ref, computed } from 'vue';
import { apiService } from './apiService';
import { STORAGE_CONFIG, API_CONFIG } from '../../config';

// 用户类型定义
interface User {
  id?: number;
  username: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  [key: string]: any;
}

// 用户状态
const currentUser = ref<User | null>(null);
const isLoading = ref(false);
const error = ref('');

// 初始化时从本地存储加载用户信息
const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);
if (token && username) {
  currentUser.value = { username };
}

/**
 * 用户服务
 */
export const userService = {
  // 响应式状态
  currentUser,
  isLoading,
  error,

  // 计算属性
  isLoggedIn: computed(() => !!currentUser.value),

  /**
   * 注册
   * @param userData 用户数据
   */
  async register(userData: any): Promise<boolean> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

      if (response && response.data) {
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('注册失败:', err);
      error.value = err.response?.data?.detail || '注册失败，请稍后再试';
      return false;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 登录
   * @param username 用户名
   * @param password 密码
   */
  async login(username: string, password: string): Promise<boolean> {
    isLoading.value = true;
    error.value = '';

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, formData);

      if (response && response.data) {
        // 保存令牌和用户信息
        localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, response.data.access_token);
        localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, username);

        // 更新用户状态
        currentUser.value = response.data.user;
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('登录失败:', err);
      error.value = err.response?.data?.detail || '登录失败，请检查用户名和密码';
      return false;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      // 调用登出API
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (err: any) {
      console.error('登出失败:', err);
    } finally {
      // 无论API调用成功与否，都清除本地存储和状态
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
      localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
      currentUser.value = null;
    }
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    if (!localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)) {
      return null;
    }

    isLoading.value = true;

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);

      if (response && response.data) {
        // 更新当前用户状态
        currentUser.value = response.data;
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('获取当前用户信息失败:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 检查是否已登录
   */
  checkAuth(): boolean {
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);

    if (token && username && !currentUser.value) {
      // 本地存储有令牌但状态中没有用户，更新状态
      currentUser.value = { username };
    } else if ((!token || !username) && currentUser.value) {
      // 本地存储没有令牌但状态中有用户，清除状态
      currentUser.value = null;
    }

    return !!currentUser.value;
  },

  async getProfile(): Promise<any> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取用户信息失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  async getTasks(): Promise<any> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取任务列表失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  },

  async getDailyStats(): Promise<any> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_STATS);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取统计数据失败';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }
};

export default userService;
