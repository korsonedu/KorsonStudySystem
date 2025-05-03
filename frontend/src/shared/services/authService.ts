/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关功能
 * 提供响应式的用户状态管理
 */
import { ref, computed } from 'vue';
import { apiService } from './apiService';
import { STORAGE_CONFIG, API_CONFIG } from '../../config';

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
 * 认证服务
 */
export const authService = {
  // 响应式状态
  currentUser,
  isLoading,
  error,
  
  // 计算属性
  isLoggedIn: computed(() => !!currentUser.value),
  
  /**
   * 用户注册
   * @param userData 用户数据
   * @returns 是否注册成功
   */
  async register(userData: RegisterRequest): Promise<boolean> {
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
   * 用户登录
   * @param credentials 登录凭证
   * @returns 是否登录成功
   */
  async login(credentials: LoginRequest): Promise<boolean> {
    isLoading.value = true;
    error.value = '';
    
    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);
      
      const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response && response.data) {
        // 保存令牌和用户信息
        localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, response.data.access_token);
        localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, credentials.username);
        
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
   * 用户登出
   */
  async logout(): Promise<void> {
    isLoading.value = true;
    
    try {
      // 尝试调用登出API
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (err) {
      console.error('登出请求失败:', err);
    } finally {
      // 无论API请求是否成功，都清除本地存储和状态
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
      localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
      currentUser.value = null;
      isLoading.value = false;
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
    } catch (err) {
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

  /**
   * 获取用户个人资料
   */
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

  /**
   * 获取用户任务列表
   */
  async getTasks(): Promise<any[]> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
      return response.data || [];
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取任务列表失败';
      return [];
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 获取用户统计数据
   */
  async getDailyStats(): Promise<any> {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY);
      return response.data || {};
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取统计数据失败';
      return {};
    } finally {
      isLoading.value = false;
    }
  }
};

// 默认导出认证服务
export default authService;
