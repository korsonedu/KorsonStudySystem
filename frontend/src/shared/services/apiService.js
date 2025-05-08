/**
 * API服务
 * 提供统一的API调用方法，处理错误和认证
 */
import axios from 'axios';
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
apiClient.interceptors.request.use((config) => {
    // 确保headers对象存在
    config.headers = config.headers || {};
    // 添加认证token
    let token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    if (token) {
        // 确保令牌格式正确 - 检查是否已经包含 Bearer 前缀
        if (!token.startsWith('Bearer ')) {
            token = `Bearer ${token}`;
            // 更新本地存储中的令牌格式
            localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, token);
        }
        // 添加认证头
        config.headers.Authorization = token;
        // 确保URL没有尾部斜杠
        if (config.url && config.url.endsWith('/') && !config.url.endsWith('//')) {
            config.url = config.url.slice(0, -1);
        }
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
}, (error) => {
    console.error('API请求准备失败:', error);
    return Promise.reject(error);
});
// 响应拦截器 - 处理身份验证错误
apiClient.interceptors.response.use((response) => {
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
}, (error) => {
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
            // 检查是否是/me请求
            const isMeRequest = url.includes('/api/auth/me');
            if (isMeRequest) {
                console.log(`[${requestId}] 收到401未授权响应，但不会自动重定向`);
                // 检查是否有token
                const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
                if (token) {
                    console.log(`[${requestId}] 令牌存在但可能已过期，尝试刷新令牌`);
                    // 这里可以添加刷新令牌的逻辑
                }
                console.error(`[${requestId}] API认证失败 (401)，URL: ${url}`);
            }
            else if (!isAuthRequest) {
                // 如果不是登录相关请求，清除认证信息并重定向
                console.log(`[${requestId}] 401未授权，清除认证信息并重定向到登录页`);
                // 清除本地存储的认证信息
                localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
                localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
                // 如果不是登录页面，重定向到登录页
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
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
        }
        catch (error) {
            console.error(`POST FORM ${url} 失败:`, error);
            throw error;
        }
    }
};
// 默认导出API服务
export default apiService;
//# sourceMappingURL=apiService.js.map