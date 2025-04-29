/**
 * 用户状态管理服务
 * 提供响应式的用户状态管理，确保登录状态变化时自动更新界面
 */

import { ref, computed } from 'vue';
import apiService from './apiService';
import { STORAGE_CONFIG, API_CONFIG } from '../config';

// 用户状态
const currentUser = ref<any>(null);
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
  async register(userData: { username: string, password: string, email?: string }) {
    isLoading.value = true;
    error.value = '';

    try {
      // 使用apiService发送请求
      console.log('Registering with data:', userData);
      console.log('Using URL:', API_CONFIG.ENDPOINTS.AUTH.REGISTER);

      const response = await apiService.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response && response.data) {
        console.log('Registration successful:', response.data);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        console.error('Server response:', err.response.data);
        error.value = err.response.data.detail || '注册失败，请稍后再试';
      } else {
        error.value = err.message || '注册失败，请检查网络连接';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 登录
   * @param credentials 登录凭证
   */
  async login(credentials: { username: string, password: string }) {
    isLoading.value = true;
    error.value = '';

    try {
      // FastAPI的OAuth2PasswordRequestForm必须直接使用表单数据
      // 并且Content-Type必须是application/x-www-form-urlencoded
      const formData = {
        username: credentials.username,
        password: credentials.password
      };

      console.log('Logging in with username:', credentials.username);

      // 使用apiService发送表单请求
      const response = await apiService.postForm(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        formData
      );

      if (response && response.data) {
        // 保存令牌到本地存储
        const token = response.data.access_token || response.data.token;
        if (token) {
          localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, token);
          localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, credentials.username);

          // 更新当前用户状态
          currentUser.value = {
            username: credentials.username,
            ...response.data.user
          };

          console.log('Login successful, user state updated:', currentUser.value);
        } else {
          throw new Error('No token received from server');
        }
      } else {
        throw new Error('Invalid response from server');
      }

      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response && err.response.data) {
        error.value = err.response.data.detail || '登录失败，请检查用户名和密码';
      } else {
        error.value = err.message || '登录失败，请检查网络连接';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 注销
   */
  async logout() {
    isLoading.value = true;

    try {
      // 调用后端注销API
      await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (err) {
      console.error('Error during logout API call:', err);
      // 即使API调用失败，我们仍然要清除本地状态
    }

    // 清除本地存储
    localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
    localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);

    // 清除当前用户状态
    currentUser.value = null;

    console.log('Logout successful, user state cleared');
    isLoading.value = false;

    return true;
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser() {
    if (!localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)) {
      return null;
    }

    isLoading.value = true;

    try {
      console.log('Fetching current user info...');
      const response = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);

      if (response && response.data) {
        // 更新当前用户状态
        currentUser.value = response.data;
        console.log('Current user:', currentUser.value);
        return response.data;
      }

      return null;
    } catch (err) {
      console.error('Error fetching current user:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  },

  /**
   * 检查是否已登录
   */
  checkAuth() {
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
  }
};

export default userService;
