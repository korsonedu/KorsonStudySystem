import { defineStore } from 'pinia';
import { apiService } from '../shared/services/apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../config';

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

// 定义用户状态存储
export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    currentUser: null as User | null,
    isLoading: false,
    error: '',
  }),

  // 计算属性
  getters: {
    isLoggedIn: (state) => !!state.currentUser,
    username: (state) => state.currentUser?.username || '',
    userId: (state) => state.currentUser?.id || null,
  },

  // 操作
  actions: {
    /**
     * 初始化用户状态
     * 从本地存储加载用户信息
     */
    init() {
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);

      if (token && username) {
        this.currentUser = { username };
        // 尝试获取完整的用户信息
        this.getCurrentUser().catch(err => {
          console.error('初始化用户状态时获取用户信息失败:', err);
        });
      }
    },

    /**
     * 用户注册
     * @param userData 用户数据
     * @returns 是否注册成功
     */
    async register(userData: RegisterRequest): Promise<boolean> {
      this.isLoading = true;
      this.error = '';

      try {
        const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

        if (response && response.data) {
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('注册失败:', err);
        this.error = err.response?.data?.detail || '注册失败，请稍后再试';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 用户登录
     * @param credentials 登录凭证
     * @returns 是否登录成功
     */
    async login(credentials: LoginRequest): Promise<boolean> {
      this.isLoading = true;
      this.error = '';

      try {
        // 尝试使用表单数据格式
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (response && response.data) {
          // 保存令牌和用户信息
          localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, response.data.access_token);
          localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, credentials.username);

          // 更新用户状态
          this.currentUser = response.data.user;
          return true;
        }

        return false;
      } catch (err: any) {
        console.error('登录失败:', err);
        this.error = err.response?.data?.detail || '登录失败，请检查用户名和密码';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 用户登出
     */
    async logout(): Promise<void> {
      this.isLoading = true;
      console.log('userStore.logout - 开始登出流程');

      try {
        // 尝试调用登出API
        await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        console.log('userStore.logout - API请求成功');
      } catch (err: any) {
        console.error('userStore.logout - 登出请求失败:', err);
      } finally {
        console.log('userStore.logout - 清除所有本地存储和状态');

        // 清除所有可能的令牌和用户信息
        localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
        localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('username');

        // 清除所有会话存储
        sessionStorage.clear();

        // 清除所有相关cookie
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          }
        });

        // 重置状态
        this.currentUser = null;
        this.error = '';
        this.isLoading = false;

        console.log('userStore.logout - 登出完成，状态已重置');
      }
    },

    /**
     * 获取当前用户信息
     */
    async getCurrentUser(): Promise<User | null> {
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      if (!token) {
        console.log('getCurrentUser: 没有找到令牌，跳过API请求');
        return null;
      }

      this.isLoading = true;

      try {
        // 确保URL没有尾部斜杠
        const url = API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER.replace(/\/$/, '');
        console.log('getCurrentUser: 请求URL:', url);

        const response = await apiService.get(url);

        if (response && response.data) {
          console.log('getCurrentUser: 成功获取用户数据:', response.data);
          // 更新当前用户状态
          this.currentUser = response.data;
          // 确保用户名存储在本地
          localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, response.data.username);
          return response.data;
        } else {
          console.warn('getCurrentUser: API返回成功但没有数据');
        }

        return null;
      } catch (err: any) {
        console.error('获取当前用户信息失败:', err);

        // 如果是401错误，但令牌存在，可能是令牌过期
        if (err.response?.status === 401 && token) {
          console.warn('getCurrentUser: 令牌可能已过期，但不会清除本地存储');
          // 不清除令牌，让用户继续使用当前会话
        }

        return null;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 检查是否已登录
     */
    checkAuth(): boolean {
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);

      console.log('checkAuth: 检查登录状态', {
        hasToken: !!token,
        hasUsername: !!username,
        hasCurrentUser: !!this.currentUser
      });

      if (token && username && !this.currentUser) {
        // 本地存储有令牌但状态中没有用户，更新状态
        console.log('checkAuth: 本地存储有令牌但状态中没有用户，更新状态');
        this.currentUser = { username };
      } else if ((!token || !username) && this.currentUser) {
        // 本地存储没有令牌但状态中有用户，清除状态
        console.log('checkAuth: 本地存储没有令牌但状态中有用户，清除状态');
        this.currentUser = null;
      }

      return !!this.currentUser;
    },

    /**
     * 获取用户个人资料
     */
    async getProfile(): Promise<any> {
      this.isLoading = true;
      this.error = '';

      try {
        const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO);
        return response.data;
      } catch (err: any) {
        this.error = err.response?.data?.detail || '获取用户信息失败';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
