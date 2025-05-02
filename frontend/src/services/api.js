import axios from 'axios';
import { API_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG } from '../config';
// 根据环境选择基础URL
const getBaseUrl = () => {
    // 开发环境下，如果前端和后端端口不同，需要指定完整的后端URL
    if (ENV_CONFIG.IS_DEV && SERVER_CONFIG.FRONTEND.PORT !== SERVER_CONFIG.BACKEND.PORT) {
        console.log('Using backend URL:', SERVER_CONFIG.BACKEND.URL);
        return SERVER_CONFIG.BACKEND.URL;
    }
    // 生产环境下，通常使用相对路径
    console.log('Using relative URL');
    return API_CONFIG.BASE_URL;
};
// Create the axios instance with default config
const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: API_CONFIG.REQUEST.TIMEOUT,
    withCredentials: API_CONFIG.REQUEST.WITH_CREDENTIALS
});
// 输出当前使用的基础URL
console.log(`API using baseURL: ${getBaseUrl()}`);
// Add request interceptor to automatically add token to request headers
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    const url = config.url || '';
    // 跳过登录和注册请求的日志
    if (!url.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) && !url.includes(API_CONFIG.ENDPOINTS.AUTH.REGISTER)) {
        console.log(`API Request to ${url}:`, {
            hasAuth: !!token,
            method: config.method,
            headers: config.headers
        });
    }
    if (token) {
        // 确保令牌格式正确
        const cleanToken = token.trim();
        // 使用标准的方式设置认证头
        config.headers['Authorization'] = `Bearer ${cleanToken}`;
        // 跳过登录和注册请求的日志
        if (!url.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) && !url.includes(API_CONFIG.ENDPOINTS.AUTH.REGISTER)) {
            console.log('Added Authorization header with clean token');
        }
    }
    else {
        // 跳过登录和注册请求的日志
        if (!url.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) && !url.includes(API_CONFIG.ENDPOINTS.AUTH.REGISTER)) {
            console.log('No token available for request');
        }
    }
    return config;
}, (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});
// Add response interceptor to handle token expiration issues
api.interceptors.response.use((response) => {
    console.log(`Response from ${response.config.url}:`, {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data
    });
    return response;
}, (error) => {
    console.error('Response Error:', error.message);
    // If 401 error (unauthorized), it might be due to token expiration
    if (error.response && error.response.status === 401) {
        // 获取请求URL
        const requestUrl = error.config?.url || '';
        // 记录当前时间和请求路径
        const currentTime = new Date().getTime();
        const currentPath = window.location.pathname;
        // 记录最近的401错误，防止短时间内多次重定向
        const lastRedirectTime = localStorage.getItem('lastRedirectTime');
        const redirectThreshold = 5000; // 5秒内不重复重定向
        const recentlyRedirected = lastRedirectTime && (currentTime - parseInt(lastRedirectTime)) < redirectThreshold;
        // 如果是登录或注册请求，不进行重定向
        if (requestUrl.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) || requestUrl.includes(API_CONFIG.ENDPOINTS.AUTH.REGISTER)) {
            console.log('Auth endpoint returned 401, not redirecting');
            return Promise.reject(error);
        }
        // 如果是创建任务请求，不进行重定向（计时器结束时的请求）
        if (requestUrl.includes('/tasks') && error.config?.method === 'post') {
            console.log('Task creation returned 401, not redirecting');
            return Promise.reject(error);
        }
        // 如果最近已经重定向过，不重复重定向
        if (recentlyRedirected) {
            console.log('Recently redirected, not redirecting again');
            return Promise.reject(error);
        }
        console.warn('Unauthorized access (401), checking conditions');
        // 检查是否刚刚登录
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        const timeSinceLogin = lastLoginTime ? (currentTime - parseInt(lastLoginTime)) : null;
        const justLoggedIn = lastLoginTime && timeSinceLogin !== null && timeSinceLogin < 120000; // 2分钟内
        console.log('Auth check:', {
            requestUrl,
            lastLoginTime,
            currentTime,
            timeSinceLogin,
            justLoggedIn,
            currentPath,
            recentlyRedirected
        });
        if (justLoggedIn) {
            console.log('Recently logged in, not redirecting to login page');
            // 不清除凭证，不重定向
            return Promise.reject(error);
        }
        // 如果已经在登录页面，不进行重定向
        if (currentPath === '/login') {
            console.log('Already on login page, not redirecting');
            return Promise.reject(error);
        }
        // 记录重定向时间
        localStorage.setItem('lastRedirectTime', currentTime.toString());
        // 清除凭证
        localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
        localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
        console.log('Credentials cleared');
        // 重定向到登录页面
        console.log('Redirecting to login page');
        window.location.href = '/login';
    }
    else if (error.response) {
        console.error('Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
        });
    }
    else if (error.request) {
        console.error('No response received for request');
    }
    return Promise.reject(error);
});
// Authentication APIs
export const authAPI = {
    register: (userData) => api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
    login: (credentials) => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
    logout: () => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
    getCurrentUser: () => api.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER)
};
// Tasks APIs
export const tasksAPI = {
    getTasks: async () => {
        console.log('Calling getTasks API...');
        try {
            return await api.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
        }
        catch (error) {
            console.error('GetTasks API Error:', error);
            if (error.response) {
                console.error('Server responded with:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            else if (error.request) {
                console.error('No response received - backend might be down');
            }
            else {
                console.error('Error creating request:', error.message);
            }
            throw error;
        }
    },
    createTask: async (taskData) => {
        console.log('Creating task with API:', taskData);
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.TASKS.BASE, taskData);
            console.log('Task created successfully:', response.data);
            return response;
        }
        catch (error) {
            console.error('Error creating task:', error);
            if (error.response) {
                console.error('Server response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            else if (error.request) {
                console.error('No response received:', error.request);
            }
            else {
                console.error('Error setting up request:', error.message);
            }
            throw error;
        }
    },
    updateTask: (taskId, taskData) => api.put(API_CONFIG.ENDPOINTS.TASKS.DETAIL(taskId), taskData),
    deleteTask: (taskId) => api.delete(API_CONFIG.ENDPOINTS.TASKS.DETAIL(taskId)),
    completeTask: (taskId) => api.post(API_CONFIG.ENDPOINTS.TASKS.COMPLETE(taskId))
};
// Plans APIs
export const plansAPI = {
    getPlans: async () => {
        console.log('Calling getPlans API...');
        try {
            // 获取当前用户的token
            const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
            if (!token) {
                console.warn('No token available for fetching plans');
                throw new Error('Not authenticated');
            }
            const response = await api.get(API_CONFIG.ENDPOINTS.PLANS.BASE);
            console.log('Plans fetched successfully:', response.data);
            return response;
        }
        catch (error) {
            console.error('Error fetching plans:', error);
            if (error.response) {
                console.error('Server response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            }
            throw error;
        }
    },
    createPlan: async (planData) => {
        console.log('Creating plan with API:', planData);
        try {
            // 获取当前用户的token
            const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
            if (!token) {
                console.warn('No token available for creating plan');
                throw new Error('Not authenticated');
            }
            const response = await api.post(API_CONFIG.ENDPOINTS.PLANS.BASE, planData);
            console.log('Plan created successfully:', response.data);
            return response;
        }
        catch (error) {
            console.error('Error creating plan:', error);
            if (error.response) {
                console.error('Server response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
                // 如果是422错误，输出请求数据以便调试
                if (error.response.status === 422) {
                    console.error('Request data that caused 422 error:', planData);
                }
            }
            throw error;
        }
    },
    updatePlan: async (planId, planData) => {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId), planData);
            console.log(`Plan ${planId} updated successfully`);
            return response;
        }
        catch (error) {
            console.error(`Error updating plan ${planId}:`, error);
            throw error;
        }
    },
    deletePlan: async (planId) => {
        try {
            const response = await api.delete(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId));
            console.log(`Plan ${planId} deleted successfully`);
            return response;
        }
        catch (error) {
            console.error(`Error deleting plan ${planId}:`, error);
            throw error;
        }
    }
};
// Achievements APIs
export const achievementsAPI = {
    getAchievements: () => api.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.BASE),
    getAchievementDetails: (achievementId) => api.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.DETAIL(achievementId)),
    unlockAchievement: (achievementId) => api.post(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.UNLOCK(achievementId))
};
// Statistics APIs
export const statisticsAPI = {
    getDailyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY),
    getWeeklyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY),
    getMonthlyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY),
    getTotalStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
    getHeatmapData: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP),
    getTimeDistribution: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION),
    getUserInfo: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO) // 使用新的用户信息API
};
export default api;
//# sourceMappingURL=api.js.map