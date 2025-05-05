/**
 * API服务
 * 提供统一的API调用方法，处理错误和认证
 */
import axios from 'axios';
import { API_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG } from '../../config';

// 根据环境选择基础URL
const getBaseUrl = () => {
  // 开发环境下，使用完整的后端URL
  if (ENV_CONFIG.IS_DEV) {
    return SERVER_CONFIG.BACKEND.URL;
  }

  // 生产环境下，根据配置决定使用相对路径还是完整URL
  return API_CONFIG.BASE_URL || '';
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
    if (!config.headers) {
      config.headers = {};
    }

    // 添加认证token
    let token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    if (token) {
      // 确保令牌格式正确 - 检查是否已经包含 Bearer 前缀
      if (!token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }
      config.headers.Authorization = token;
    }

    // 添加请求ID，便于跟踪和调试
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    config.headers['X-Request-ID'] = requestId;

    // 开发环境下可以启用详细日志
    // 生产环境不输出日志

    return config;
  },
  (error) => {
    if (ENV_CONFIG.IS_DEV) {
      console.error('API请求准备失败');
    }
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理身份验证错误
apiClient.interceptors.response.use(
  (response) => {
    // 获取请求ID
    const requestId = response.config.headers?.['X-Request-ID'] || 'unknown';

    // 成功响应处理
    // 生产环境不输出日志

    return response;
  },
  (error) => {
    // 获取请求ID
    const requestId = error.config?.headers?.['X-Request-ID'] || 'unknown';

    // 统一错误处理
    if (error.response) {
      const status = error.response.status;

      // 处理401未授权错误
      if (status === 401) {
        // 清除本地存储的认证信息
        localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
        localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);

        // 如果不是登录页面，重定向到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 记录错误详情（仅在开发环境）
      if (ENV_CONFIG.IS_DEV) {
        console.error(`API响应错误: ${status}`);
      }
    } else if (error.request) {
      // 请求已发送但未收到响应
      if (ENV_CONFIG.IS_DEV) {
        console.error('API请求未收到响应');
      }
    } else {
      // 请求配置有误
      if (ENV_CONFIG.IS_DEV) {
        console.error('API请求配置错误');
      }
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
  async get(url, config) {
    try {
      // 检查URL是否为undefined
      if (url === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('API请求URL为undefined');
        }
        throw new Error('API请求URL为undefined');
      }

      return await apiClient.get(url, config);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`GET ${url} 失败`);
      }
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
  async post(url, data, config) {
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`POST ${url} 失败`);
      }
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
  async put(url, data, config) {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`PUT ${url} 失败`);
      }
      throw error;
    }
  },

  /**
   * 发送DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns Promise<AxiosResponse>
   */
  async delete(url, config) {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`DELETE ${url} 失败`);
      }
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
  async postForm(url, data, config) {
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
      return await apiClient.post(cleanUrl, formData, formConfig);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`POST FORM ${url} 失败`);
      }
      throw error;
    }
  }
};

// 默认导出API服务
export default apiService;