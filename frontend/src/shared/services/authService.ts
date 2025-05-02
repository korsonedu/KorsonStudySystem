/**
 * 认证服务
 * 提供所有应用共享的用户认证功能
 */
import { ref, computed } from 'vue';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

// 用户类型定义
export interface User {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
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

// 创建认证服务实例
class AuthService {
  // 响应式状态
  public currentUser = ref<User | null>(null);
  public isLoggedIn = ref(false);
  public error = ref('');
  public token = ref('');

  // 计算属性：用户ID
  public userId = computed(() => this.currentUser.value?.id);

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  public checkAuth(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      this.token.value = token;
      this.isLoggedIn.value = true;
      return true;
    }
    return false;
  }

  /**
   * 获取当前登录用户信息
   * @returns 用户信息
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.isLoggedIn.value) {
        return null;
      }

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER}`,
        {
          headers: {
            Authorization: `Bearer ${this.token.value}`
          }
        }
      );

      this.currentUser.value = response.data;
      return response.data;
    } catch (error: any) {
      console.error('获取当前用户信息失败:', error);
      this.error.value = '获取用户信息失败';
      return null;
    }
  }

  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 是否登录成功
   */
  public async login(credentials: LoginRequest): Promise<boolean> {
    try {
      this.error.value = '';
      
      // 创建表单数据
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      // 发送登录请求
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // 保存令牌和用户信息
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('username', credentials.username);
      
      this.token.value = access_token;
      this.isLoggedIn.value = true;
      
      // 获取用户详细信息
      await this.getCurrentUser();
      
      return true;
    } catch (error: any) {
      console.error('登录失败:', error);
      
      if (error.response) {
        this.error.value = error.response.data.detail || '登录失败，请检查用户名和密码';
      } else {
        this.error.value = '登录失败，请检查网络连接';
      }
      
      return false;
    }
  }

  /**
   * 用户注册
   * @param userData 用户数据
   * @returns 是否注册成功
   */
  public async register(userData: RegisterRequest): Promise<boolean> {
    try {
      this.error.value = '';
      
      // 发送注册请求
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`,
        userData
      );

      return response.status === 200 || response.status === 201;
    } catch (error: any) {
      console.error('注册失败:', error);
      
      if (error.response) {
        this.error.value = error.response.data.detail || '注册失败，请稍后再试';
      } else {
        this.error.value = '注册失败，请检查网络连接';
      }
      
      return false;
    }
  }

  /**
   * 用户登出
   */
  public async logout(): Promise<void> {
    try {
      // 发送登出请求
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token.value}`
          }
        }
      );
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 清除本地存储和状态
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      
      this.token.value = '';
      this.currentUser.value = null;
      this.isLoggedIn.value = false;
    }
  }
}

// 创建单例实例并导出
export const authService = new AuthService();
