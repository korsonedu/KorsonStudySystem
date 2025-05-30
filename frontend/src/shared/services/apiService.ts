/**
 * API服务
 * 提供统一的API调用方法，处理错误和认证
 */
import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_CONFIG } from '../../config';
import { env } from '../../config/env';

// 根据环境选择基础URL
const getBaseUrl = () => {
  // 如果配置了API_CONFIG.BASE_URL，则使用它
  if (API_CONFIG.BASE_URL) {
    return API_CONFIG.BASE_URL;
  }

  // 否则使用相对路径
  return '';
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: API_CONFIG.REQUEST.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: API_CONFIG.REQUEST.WITH_CREDENTIALS
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    // 确保headers对象存在
    config.headers = config.headers || {} as AxiosRequestHeaders;

    // 添加认证token
    let token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    const tokenExpiry = localStorage.getItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);

    // 检查token是否存在
    if (token) {
      let isExpired = false;

      // 首先尝试从token本身解析过期时间
      try {
        // 解析JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // JWT的exp是秒级时间戳，需要转换为毫秒
        const jwtExpiry = payload.exp * 1000;

        // 检查是否过期
        isExpired = jwtExpiry <= Date.now();

        // 更新localStorage中的过期时间
        if (!isExpired && (!tokenExpiry || parseInt(tokenExpiry) !== jwtExpiry)) {
          localStorage.setItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY, jwtExpiry.toString());
          console.log('API请求拦截器: 更新token过期时间:', new Date(jwtExpiry).toISOString());
        }
      } catch (e) {
        console.error('API请求拦截器: 解析JWT失败，使用localStorage中的过期时间:', e);

        // 如果解析失败，使用localStorage中的过期时间
        if (tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry);
          isExpired = expiryTime <= Date.now();
        }
      }

      // 如果token已过期，清除认证信息
      if (isExpired) {
        console.log('API请求拦截器: token已过期，清除认证信息');
        localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
        localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
        localStorage.removeItem(STORAGE_CONFIG.USER_DATA_KEY);
        localStorage.removeItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);
        token = null;
      } else {
        // 确保令牌格式正确 - 不修改本地存储中的令牌格式
        let authToken = token;
        if (!authToken.startsWith('Bearer ')) {
          authToken = `Bearer ${authToken}`;
        }

        // 添加认证头
        config.headers.Authorization = authToken;
      }
    }

    // 确保URL没有尾部斜杠
    if (config.url && config.url.endsWith('/') && !config.url.endsWith('//')) {
      config.url = config.url.slice(0, -1);
    }

    // 添加请求ID，便于跟踪和调试
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    config.headers['X-Request-ID'] = requestId;

    // 记录请求信息（仅在开发环境）
    if (env.IS_DEV) {
      console.log(`[${requestId}] 发送请求:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: {
          Authorization: token ? 'Bearer ***' : 'None',
          'Content-Type': config.headers['Content-Type']
        },
        data: config.data
      });
    }

    return config;
  },
  (error) => {
    console.error('API请求准备失败:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理身份验证错误
apiClient.interceptors.response.use(
  (response) => {
    // 获取请求ID
    const requestId = response.config.headers?.['X-Request-ID'] || 'unknown';

    // 成功响应处理（仅在开发环境记录详细信息）
    if (env.IS_DEV) {
      console.log(`[${requestId}] API响应成功:`, {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }

    return response;
  },
  (error) => {
    // 获取请求ID
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';

    // 统一错误处理
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';

      // 处理401未授权错误
      if (status === 401) {
        // 检查是否是登录相关的请求
        const isAuthRequest = url.includes('/api/auth/login') ||
                             url.includes('/api/auth/register');

        // 如果不是登录相关请求，清除认证信息
        if (!isAuthRequest) {
          console.log(`[${requestId}] 401未授权，清除认证信息`);

          // 清除本地存储的认证信息
          localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
          localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
          localStorage.removeItem(STORAGE_CONFIG.USER_DATA_KEY);
          localStorage.removeItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);

          // 不要自动重定向，让路由守卫处理重定向
          console.log(`[${requestId}] 认证信息已清除，将由路由守卫处理重定向`);

          // 如果有Pinia store，可以通过事件总线通知应用更新状态
          try {
            // 尝试导入事件总线（如果存在）
            const event = new CustomEvent('auth:unauthorized', { detail: { url } });
            window.dispatchEvent(event);
          } catch (e) {
            console.error(`[${requestId}] 无法触发认证事件:`, e);
          }
        }
      }

      // 处理502错误（Bad Gateway）
      if (status === 502) {
        console.error(`[${requestId}] 502 Bad Gateway错误，服务器可能不可用`);

        // 只有在登录请求时才显示特殊错误，不清除认证信息
        if (url.includes('/api/auth/login')) {
          console.log(`[${requestId}] 登录服务不可用`);

          // 不清除认证信息，只记录错误
          console.error(`[${requestId}] 登录服务暂时不可用，请稍后再试`);
        }
      }

      // 记录错误详情
      console.error(`[${requestId}] API响应错误:`, {
        status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error(`[${requestId}] API请求未收到响应:`, {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message
      });

      // 对于CORS错误，尝试提供更有用的信息
      if (error.message === 'Network Error') {
        console.error(`[${requestId}] 可能是CORS问题，请检查后端CORS配置`);
      }
    } else {
      // 请求配置有误
      console.error(`[${requestId}] API请求配置错误:`, error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * API服务类
 * 提供统一的API调用方法
 */
export const apiService = {
  /**
   * 发送GET请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await apiClient.get<T>(url, config);
    } catch (error) {
      console.error(`GET ${url} 失败:`, error);
      throw error;
    }
  },

  /**
   * 发送POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await apiClient.post<T>(url, data, config);
    } catch (error) {
      console.error(`POST ${url} 失败:`, error);
      throw error;
    }
  },

  /**
   * 发送PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await apiClient.put<T>(url, data, config);
    } catch (error) {
      console.error(`PUT ${url} 失败:`, error);
      throw error;
    }
  },

  /**
   * 发送DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    try {
      return await apiClient.delete<T>(url, config);
    } catch (error) {
      console.error(`DELETE ${url} 失败:`, error);
      throw error;
    }
  },

  /**
   * 发送表单数据的POST请求
   * @param url 请求URL
   * @param data 表单数据
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async postForm<T = any>(url: string, data: Record<string, any>, config?: any): Promise<AxiosResponse<T>> {
    try {
      // 创建表单数据
      const formData = new FormData();

      // 将对象转换为FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // 合并配置
      const formConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config
      };

      // 修正URL格式
      const cleanUrl = url.replace(/\/\//g, '/').replace(/\/$/, '');
      return await apiClient.post<T>(cleanUrl, formData, formConfig);
    } catch (error) {
      console.error(`POST FORM ${url} 失败:`, error);
      throw error;
    }
  }
};

// 默认导出API服务
export default apiService;
