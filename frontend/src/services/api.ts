import axios from 'axios'
import { API_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG } from '../config'

// 根据环境选择基础URL
const getBaseUrl = () => {
  // 开发环境下，如果前端和后端端口不同，需要指定完整的后端URL
  if (ENV_CONFIG.IS_DEV && SERVER_CONFIG.FRONTEND.PORT !== SERVER_CONFIG.BACKEND.PORT) {
    return SERVER_CONFIG.BACKEND.URL;
  }
  // 生产环境下，通常使用相对路径
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
})

// Add request interceptor to automatically add token to request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)

    if (token) {
      // 确保令牌格式正确
      const cleanToken = token.trim()

      // 使用标准的方式设置认证头
      config.headers['Authorization'] = `Bearer ${cleanToken}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration issues
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // If 401 error (unauthorized), it might be due to token expiration
    if (error.response && error.response.status === 401) {
      // 获取请求URL
      const requestUrl = error.config?.url || ''

      // 记录当前时间和请求路径
      const currentTime = new Date().getTime()
      const currentPath = window.location.pathname

      // 记录最近的401错误，防止短时间内多次重定向
      const lastRedirectTime = localStorage.getItem('lastRedirectTime')
      const redirectThreshold = 5000 // 5秒内不重复重定向
      const recentlyRedirected = lastRedirectTime && (currentTime - parseInt(lastRedirectTime)) < redirectThreshold

      // 如果是登录或注册请求，不进行重定向
      if (requestUrl.includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN) || requestUrl.includes(API_CONFIG.ENDPOINTS.AUTH.REGISTER)) {
        return Promise.reject(error)
      }

      // 如果是创建任务请求，不进行重定向（计时器结束时的请求）
      if (requestUrl.includes('/tasks') && error.config?.method === 'post') {
        return Promise.reject(error)
      }

      // 如果最近已经重定向过，不重复重定向
      if (recentlyRedirected) {
        return Promise.reject(error)
      }

      // 检查是否刚刚登录
      const lastLoginTime = localStorage.getItem('lastLoginTime')
      const timeSinceLogin = lastLoginTime ? (currentTime - parseInt(lastLoginTime)) : null
      const justLoggedIn = lastLoginTime && timeSinceLogin !== null && timeSinceLogin < 120000 // 2分钟内

      if (justLoggedIn) {
        // 不清除凭证，不重定向
        return Promise.reject(error)
      }

      // 如果已经在登录页面，不进行重定向
      if (currentPath === '/login') {
        return Promise.reject(error)
      }

      // 记录重定向时间
      localStorage.setItem('lastRedirectTime', currentTime.toString())

      // 清除凭证
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY)
      localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY)

      // 重定向到登录页面
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// Authentication APIs
export const authAPI = {
  register: (userData: any) => api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData),
  login: (credentials: any) => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials),
  logout: () => api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
  getCurrentUser: () => api.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER)
}

// Tasks APIs
export const tasksAPI = {
  getTasks: async () => {
    try {
      return await api.get(API_CONFIG.ENDPOINTS.TASKS.BASE)
    } catch (error: any) {
      throw error
    }
  },
  createTask: async (taskData: any) => {
    try {
      const response = await api.post(API_CONFIG.ENDPOINTS.TASKS.BASE, taskData)
      return response
    } catch (error: any) {
      throw error
    }
  },
  updateTask: (taskId: number, taskData: any) => api.put(API_CONFIG.ENDPOINTS.TASKS.DETAIL(taskId), taskData),
  deleteTask: (taskId: number) => api.delete(API_CONFIG.ENDPOINTS.TASKS.DETAIL(taskId)),
  completeTask: (taskId: number) => api.post(API_CONFIG.ENDPOINTS.TASKS.COMPLETE(taskId))
}

// Plans APIs
export const plansAPI = {
  getPlans: async () => {
    try {
      // 获取当前用户的token
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await api.get(API_CONFIG.ENDPOINTS.PLANS.BASE)
      return response
    } catch (error: any) {
      throw error
    }
  },

  createPlan: async (planData: any) => {
    try {
      // 获取当前用户的token
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await api.post(API_CONFIG.ENDPOINTS.PLANS.BASE, planData)
      return response
    } catch (error: any) {
      throw error
    }
  },

  updatePlan: async (planId: number | string, planData: any) => {
    try {
      const response = await api.put(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId), planData)
      return response
    } catch (error: any) {
      throw error
    }
  },

  deletePlan: async (planId: number | string) => {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.PLANS.DETAIL(planId))
      return response
    } catch (error: any) {
      throw error
    }
  }
}

// Achievements APIs
export const achievementsAPI = {
  getAchievements: () => api.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.BASE),
  getAchievementDetails: (achievementId: number) => api.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.DETAIL(achievementId)),
  unlockAchievement: (achievementId: number) => api.post(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.UNLOCK(achievementId))
}

// Statistics APIs
export const statisticsAPI = {
  getDailyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY),
  getWeeklyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY),
  getMonthlyStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY),
  getTotalStats: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
  getHeatmapData: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP),
  getTimeDistribution: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION),
  getUserInfo: () => api.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO) // 使用新的用户信息API
}

export default api