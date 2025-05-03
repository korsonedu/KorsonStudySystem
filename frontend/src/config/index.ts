/**
 * 应用配置文件
 * 集中管理所有可配置项，便于维护和部署
 */

// 从环境变量获取配置（如果有的话）
const getEnvConfig = () => {
  // 在浏览器环境中，尝试从window.__ENV__获取配置
  // 这允许在部署时通过注入脚本设置环境变量
  const windowEnv = typeof window !== 'undefined' && (window as any).__ENV__;

  return {
    // 后端配置
    BACKEND_PROTOCOL: windowEnv?.BACKEND_PROTOCOL || import.meta.env.VITE_BACKEND_PROTOCOL || 'http',
    BACKEND_HOST: windowEnv?.BACKEND_HOST || import.meta.env.VITE_BACKEND_HOST || 'localhost',
    BACKEND_PORT: windowEnv?.BACKEND_PORT || import.meta.env.VITE_BACKEND_PORT || 8000,
    BACKEND_BASE_PATH: windowEnv?.BACKEND_BASE_PATH || import.meta.env.VITE_BACKEND_BASE_PATH || '',

    // 前端配置
    FRONTEND_PROTOCOL: windowEnv?.FRONTEND_PROTOCOL || import.meta.env.VITE_FRONTEND_PROTOCOL || 'http',
    FRONTEND_HOST: windowEnv?.FRONTEND_HOST || import.meta.env.VITE_FRONTEND_HOST || 'localhost',
    FRONTEND_PORT: windowEnv?.FRONTEND_PORT || import.meta.env.VITE_FRONTEND_PORT || 5174,
    FRONTEND_BASE_PATH: windowEnv?.FRONTEND_BASE_PATH || import.meta.env.VITE_FRONTEND_BASE_PATH || '',
  };
};

// 获取环境配置
const envConfig = getEnvConfig();

// 服务器配置
export const SERVER_CONFIG = {
  // 后端服务器配置
  BACKEND: {
    PROTOCOL: envConfig.BACKEND_PROTOCOL,
    HOST: envConfig.BACKEND_HOST,
    PORT: envConfig.BACKEND_PORT,
    BASE_PATH: envConfig.BACKEND_BASE_PATH,

    // 获取完整的后端URL
    get URL() {
      return `${this.PROTOCOL}://${this.HOST}${this.PORT ? `:${this.PORT}` : ''}${this.BASE_PATH}`;
    }
  },

  // 前端服务器配置
  FRONTEND: {
    PROTOCOL: envConfig.FRONTEND_PROTOCOL,
    HOST: envConfig.FRONTEND_HOST,
    PORT: envConfig.FRONTEND_PORT,
    BASE_PATH: envConfig.FRONTEND_BASE_PATH,

    // 获取完整的前端URL
    get URL() {
      return `${this.PROTOCOL}://${this.HOST}${this.PORT ? `:${this.PORT}` : ''}${this.BASE_PATH}`;
    }
  }
};

// API配置
export const API_CONFIG = {
  // 基础URL，根据环境自动选择
  // 开发环境下可能需要指定完整的后端URL，生产环境通常使用相对路径
  BASE_URL: '',  // 空字符串表示使用相对路径（同源请求）
  // 如果需要指定后端URL，可以使用：SERVER_CONFIG.BACKEND.URL

  // 请求配置
  REQUEST: {
    TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // 请求超时时间（毫秒）
    RETRY_COUNT: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3, // 请求失败重试次数
    RETRY_DELAY: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000, // 请求失败重试延迟（毫秒）
    WITH_CREDENTIALS: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true' ? true : false, // 跨域请求是否需要凭证

    // 生产环境特定配置
    PRODUCTION: {
      CACHE_CONTROL: import.meta.env.VITE_API_CACHE_CONTROL || 'no-cache', // 缓存控制
      TIMEOUT: Number(import.meta.env.VITE_PROD_API_TIMEOUT) || 60000, // 生产环境超时时间（更长）
    }
  },

  // 响应状态码
  STATUS: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  },

  // API端点
  ENDPOINTS: {
    // 认证相关
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      CURRENT_USER: '/api/auth/me',
      VERIFY_EMAIL: '/api/auth/verify-email'
    },

    // 任务相关
    TASKS: {
      BASE: '/api/study/tasks',
      DETAIL: (id: number) => `/api/study/tasks/${id}`,
      COMPLETE: (id: number) => `/api/study/tasks/${id}/complete`
    },

    // 计划相关
    PLANS: {
      BASE: '/api/study/plans',
      DETAIL: (id: number | string) => `/api/study/plans/${id}`
    },

    // 成就相关
    ACHIEVEMENTS: {
      BASE: '/api/study/achievements',
      DETAIL: (id: number) => `/api/study/achievements/${id}`,
      UNLOCK: (id: number) => `/api/study/achievements/${id}/unlock`
    },

    // 统计相关
    STATISTICS: {
      DAILY: '/api/study/statistics/daily',
      WEEKLY: '/api/study/statistics/weekly',
      MONTHLY: '/api/study/statistics/monthly',
      TOTAL: '/api/study/statistics/total',
      HEATMAP: '/api/study/statistics/heatmap', // 热力图数据
      TIME_DISTRIBUTION: '/api/study/statistics/time-distribution',
      USER_INFO: '/api/study/statistics/user',
      USER_STATS: '/api/study/statistics/user'  // 用户任务统计
    }
  },

  // 请求配置已在上面定义
};

// 存储配置
export const STORAGE_CONFIG = {
  PREFIX: 'studytool_',  // 本地存储键前缀
  TOKEN_KEY: 'token',    // 认证令牌存储键
  USERNAME_KEY: 'username'  // 用户名存储键
};

// 应用配置
export const APP_CONFIG = {
  // 默认番茄钟时间（分钟）
  DEFAULT_POMODORO_TIME: 25,

  // 默认休息时间（分钟）
  DEFAULT_BREAK_TIME: 5
};

// 环境配置
export const ENV_CONFIG = {
  // 当前环境（development, production, test）
  NODE_ENV: process.env.NODE_ENV || 'development',

  // 是否为开发环境
  get IS_DEV() {
    return this.NODE_ENV === 'development';
  },

  // 是否为生产环境
  get IS_PROD() {
    return this.NODE_ENV === 'production';
  },

  // 是否为测试环境
  get IS_TEST() {
    return this.NODE_ENV === 'test';
  }
};

// 导出成就配置
export { ACHIEVEMENTS } from './achievements';

// 导出所有配置
export default {
  SERVER: SERVER_CONFIG,
  API: API_CONFIG,
  STORAGE: STORAGE_CONFIG,
  APP: APP_CONFIG,
  ENV: ENV_CONFIG
};
