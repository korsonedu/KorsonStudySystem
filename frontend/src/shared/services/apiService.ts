/**
 * API服务
 * 提供所有应用共享的API请求功能
 */
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG } from '../../config/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
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
    console.log(`[${requestId}] 发送请求: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 记录响应信息
    const requestId = response.config.headers['X-Request-ID'];
    console.log(`[${requestId}] 收到响应: ${response.status} ${response.config.url}`);
    
    return response;
  },
  (error: AxiosError) => {
    const requestId = error.config?.headers?.['X-Request-ID'];
    
    // 处理网络错误
    if (!error.response) {
      console.error(`[${requestId}] API请求未收到响应:`, {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      });
      
      // 检查是否是CORS问题
      if (error.message === 'Network Error') {
        console.error(`[${requestId}] 可能是CORS问题，请检查后端CORS配置`);
      }
    } 
    // 处理401未授权错误
    else if (error.response.status === 401) {
      console.error(`[${requestId}] 认证失败:`, error.response.data);
      
      // 清除无效的令牌
      localStorage.removeItem('token');
      
      // 可以在这里添加重定向到登录页面的逻辑
    } 
    // 处理其他错误
    else {
      console.error(`[${requestId}] API错误:`, {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    return Promise.reject(error);
  }
);

/**
 * API服务类
 * 提供通用的API请求方法
 */
class ApiService {
  /**
   * 发送GET请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`GET ${url} 失败:`, error);
      throw error;
    }
  }

  /**
   * 发送POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`POST ${url} 失败:`, error);
      throw error;
    }
  }

  /**
   * 发送PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      console.error(`PUT ${url} 失败:`, error);
      throw error;
    }
  }

  /**
   * 发送DELETE请求
   * @param url 请求URL
   * @param config 请求配置
   * @returns 响应数据
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error: any) {
      console.error(`DELETE ${url} 失败:`, error);
      throw error;
    }
  }
}

// 创建单例实例并导出
export const apiService = new ApiService();
