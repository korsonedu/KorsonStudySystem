/**
 * 统一用户服务
 * 整合了认证和用户数据功能
 * 使用Pinia状态管理
 */
import { useUserStore } from '@/stores/userStore';
import { apiService } from './apiService';
import { API_CONFIG } from '../../config';

// 用户类型定义
export interface User {
  id?: number;
  username: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  [key: string]: any;
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求参数
export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  invitation_code?: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * 统一用户服务
 * 整合了认证和用户数据功能
 */
export const userService = {
  /**
   * 获取用户存储
   * @returns 用户存储
   */
  getStore() {
    return useUserStore();
  },

  /**
   * 用户注册
   * @param userData 用户数据
   * @returns 是否注册成功
   */
  async register(userData: RegisterRequest): Promise<boolean> {
    const userStore = useUserStore();
    return await userStore.register(userData);
  },

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 是否登录成功
   */
  async login(credentials: LoginRequest): Promise<boolean> {
    const userStore = useUserStore();
    return await userStore.login(credentials);
  },

  /**
   * 用户登录（兼容旧API）
   * @param username 用户名
   * @param password 密码
   * @returns 是否登录成功
   */
  async loginWithCredentials(username: string, password: string): Promise<boolean> {
    const userStore = useUserStore();
    return await userStore.login({ username, password });
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    const userStore = useUserStore();
    await userStore.logout();
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    const userStore = useUserStore();
    return await userStore.getCurrentUser();
  },

  /**
   * 检查是否已登录
   */
  checkAuth(): boolean {
    const userStore = useUserStore();
    return userStore.checkAuth();
  },

  /**
   * 获取用户个人资料
   */
  async getProfile(): Promise<any> {
    const userStore = useUserStore();
    return await userStore.getProfile();
  },

  /**
   * 获取用户任务列表
   */
  async getTasks(): Promise<any[]> {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
      return response.data || [];
    } catch (err: any) {
      console.error('获取任务列表失败:', err);
      return [];
    }
  },

  /**
   * 获取用户统计数据
   */
  async getDailyStats(): Promise<any> {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY);
      return response.data || {};
    } catch (err: any) {
      console.error('获取统计数据失败:', err);
      return {};
    }
  },

  /**
   * 获取用户学习统计数据
   */
  async getUserStats(): Promise<any> {
    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_STATS);
      return response.data || {};
    } catch (err: any) {
      console.error('获取用户统计数据失败:', err);
      return {};
    }
  },

  // 为了兼容旧代码，提供一些计算属性
  get currentUser() {
    return useUserStore().currentUser;
  },

  get isLoading() {
    return useUserStore().isLoading;
  },

  get error() {
    return useUserStore().error;
  },

  get isLoggedIn() {
    return useUserStore().isLoggedIn;
  },

  get username() {
    return useUserStore().username;
  }
};

// 为了兼容旧代码，提供authService别名
export const authService = userService;

// 默认导出统一用户服务
export default userService;
