/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关功能
 */

import { apiService } from './apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../config';

// 用户类型定义
export interface User {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  is_superuser: boolean;
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求参数
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * 认证服务类
 */
export const authService = {
  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 登录结果
   */
  async login(credentials: LoginRequest): Promise<User> {
    try {
      const response = await apiService.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      // 保存token和用户信息
      localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, response.data.access_token);
      localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, credentials.username);

      return response.data.user;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 用户注册
   * @param userData 用户数据
   * @returns 注册结果
   */
  async register(userData: RegisterRequest): Promise<User> {
    try {
      const response = await apiService.post<User>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        userData
      );
      return response.data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 无论API请求是否成功，都清除本地存储
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
      localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
    }
  },

  /**
   * 获取当前登录用户信息
   * @returns 用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.get<User>(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
      return response.data;
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      return null;
    }
  },

  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
  },

  /**
   * 获取当前用户名
   * @returns 用户名
   */
  getUsername(): string | null {
    return localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);
  }
};

export default authService;
