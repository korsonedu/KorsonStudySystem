/**
 * API服务
 * 提供统一的API调用方法，处理错误和认证
 */
import axios from 'axios';
import { API_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG } from '../config';
// 根据环境选择基础URL
const getBaseUrl = () => {
    // 开发环境下，使用完整的后端URL
    if (ENV_CONFIG.IS_DEV) {
        console.log('Development mode: Using backend URL:', SERVER_CONFIG.BACKEND.URL);
        return SERVER_CONFIG.BACKEND.URL;
    }
    // 生产环境下，根据配置决定使用相对路径还是完整URL
    if (API_CONFIG.BASE_URL) {
        console.log('Production mode: Using configured API base URL:', API_CONFIG.BASE_URL);
        return API_CONFIG.BASE_URL;
    }
    // 如果没有配置BASE_URL，则使用相对路径
    console.log('Production mode: Using relative URL');
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
    withCredentials: API_CONFIG.REQUEST.WITH_CREDENTIALS // 使用配置中的值
});
// 输出当前使用的基础URL
console.log(`API using baseURL: ${getBaseUrl()}`);
// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use((config) => {
    // 确保headers对象存在
    if (!config.headers) {
        config.headers = {};
    }
    // 添加认证token
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // 添加请求ID，便于跟踪和调试
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    config.headers['X-Request-ID'] = requestId;
    // 记录请求信息（仅在开发环境）
    if (ENV_CONFIG.IS_DEV) {
        console.log(`[${requestId}] Request:`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data
        });
    }
    return config;
}, (error) => {
    console.error('API请求准备失败:', error);
    return Promise.reject(error);
});
// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use((response) => {
    // 获取请求ID
    const requestId = response.config.headers?.['X-Request-ID'] || 'unknown';
    // 成功响应处理（仅在开发环境记录详细信息）
    if (ENV_CONFIG.IS_DEV) {
        console.log(`[${requestId}] API响应成功:`, {
            url: response.config.url,
            status: response.status,
            data: response.data
        });
    }
    return response;
}, (error) => {
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
        // 记录错误详情
        console.error(`[${requestId}] API响应错误:`, {
            status,
            data: error.response.data,
            url: error.config?.url
        });
    }
    else if (error.request) {
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
    }
    else {
        // 请求配置有误
        console.error(`[${requestId}] API请求配置错误:`, error.message);
    }
    return Promise.reject(error);
});
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
            return await apiClient.get(url, config);
        }
        catch (error) {
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
    async post(url, data, config) {
        try {
            return await apiClient.post(url, data, config);
        }
        catch (error) {
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
    async put(url, data, config) {
        try {
            return await apiClient.put(url, data, config);
        }
        catch (error) {
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
    async delete(url, config) {
        try {
            return await apiClient.delete(url, config);
        }
        catch (error) {
            console.error(`DELETE ${url} 失败:`, error);
            throw error;
        }
    },
    /**
     * 发送表单数据（用于登录等需要x-www-form-urlencoded的请求）
     * @param url 请求URL
     * @param data 表单数据
     * @returns Promise<AxiosResponse>
     */
    async postForm(url, data) {
        try {
            const params = new URLSearchParams();
            Object.entries(data).forEach(([key, value]) => {
                params.append(key, value);
            });
            return await apiClient.post(url, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        }
        catch (error) {
            console.error(`POST Form ${url} 失败:`, error);
            throw error;
        }
    }
};
export default apiService;
//# sourceMappingURL=apiService.js.map