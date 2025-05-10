import axios from 'axios';
import { userService } from './userService';
import router from '../../router';

// 添加请求拦截器
axios.interceptors.request.use(
  (config) => {
    // 从本地存储获取令牌
    const token = localStorage.getItem('token');

    // 如果有令牌，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求ID，用于日志和调试
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;

    // 记录请求信息
    console.log(`[${requestId}] 全局发送请求: ${config.method?.toUpperCase()} ${config.url}`);

    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    // 记录响应信息
    const requestId = response.config.headers['X-Request-ID'];
    console.log(`[${requestId}] 全局收到响应: ${response.status} ${response.config.url}`);

    return response;
  },
  (error) => {
    const requestId = error.config?.headers?.['X-Request-ID'];

    // 处理网络错误
    if (!error.response) {
      console.error(`[${requestId}] 全局API请求未收到响应:`, {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
    }
    // 处理401未授权错误
    else if (error.response.status === 401) {
      console.error(`[${requestId}] 全局认证失败:`, error.response.data);

      // 清除无效的令牌
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('username');

      // 登出用户
      userService.logout();

      // 重定向到登录页面
      router.push('/login');
    }
    // 处理其他错误
    else {
      console.error(`[${requestId}] 全局API错误:`, {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }

    return Promise.reject(error);
  }
);

export default axios;
