/**
 * 应用配置文件
 * 集中管理所有可配置项，便于维护和部署
 */

// 导入环境变量
import { env } from './env';

// 服务器配置
export const SERVER_CONFIG = {
  // 后端服务器配置
  BACKEND: {
    PROTOCOL: env.BACKEND_PROTOCOL,
    HOST: env.BACKEND_HOST,
    PORT: env.BACKEND_PORT,
    BASE_PATH: env.BACKEND_BASE_PATH,

    // 获取完整的后端URL
    get URL() {
      return `${this.PROTOCOL}://${this.HOST}${this.PORT ? `:${this.PORT}` : ''}${this.BASE_PATH}`;
    }
  },

  // 前端服务器配置
  FRONTEND: {
    PROTOCOL: env.FRONTEND_PROTOCOL,
    HOST: env.FRONTEND_HOST,
    PORT: env.FRONTEND_PORT,
    BASE_PATH: env.FRONTEND_BASE_PATH,

    // 获取完整的前端URL
    get URL() {
      return `${this.PROTOCOL}://${this.HOST}${this.PORT ? `:${this.PORT}` : ''}${this.BASE_PATH}`;
    }
  }
};

// API配置
export const API_CONFIG = {
  // 基础URL，使用相对路径避免混合内容问题
  BASE_URL: '',

  // 请求配置
  REQUEST: {
    TIMEOUT: Number(env.API_TIMEOUT) || 30000, // 请求超时时间（毫秒）
    RETRY_COUNT: Number(env.API_RETRY_COUNT) || 3, // 请求失败重试次数
    RETRY_DELAY: Number(env.API_RETRY_DELAY) || 1000, // 请求失败重试延迟（毫秒）
    WITH_CREDENTIALS: env.API_WITH_CREDENTIALS === 'true' ? true : false, // 跨域请求是否需要凭证

    // 生产环境特定配置
    PRODUCTION: {
      CACHE_CONTROL: env.API_CACHE_CONTROL || 'no-cache', // 缓存控制
      TIMEOUT: Number(env.PROD_API_TIMEOUT) || 60000, // 生产环境超时时间（更长）
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
      VERIFY_EMAIL: '/api/auth/verify-email',
      RESEND_VERIFICATION: '/api/auth/resend-verification'
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
      BASE: '/api/study/statistics',  // 基础统计端点
      DAILY: '/api/study/statistics/daily',
      WEEKLY: '/api/study/statistics/weekly',
      MONTHLY: '/api/study/statistics/monthly',
      TOTAL: '/api/study/statistics/total',  // 总计统计端点
      HEATMAP: '/api/study/statistics/heatmap', // 热力图数据
      TIME_DISTRIBUTION: '/api/study/statistics/time-distribution',
      USER_INFO: '/api/study/statistics/user',
      USER_STATS: '/api/study/statistics/user'  // 用户统计端点，获取连续学习天数等统计信息
    }
  },

  // 请求配置已在上面定义
};

// 存储配置
export const STORAGE_CONFIG = {
  PREFIX: 'studytool_',  // 本地存储键前缀
  TOKEN_KEY: 'auth_token',    // 认证令牌存储键 - 必须与服务文件中的 TOKEN_KEY 常量一致
  USERNAME_KEY: 'username'  // 用户名存储键
};

// 应用配置
export const APP_CONFIG = {
  // 默认番茄钟时间（分钟）
  DEFAULT_POMODORO_TIME: Number(env.DEFAULT_POMODORO_TIME) || 25,

  // 默认休息时间（分钟）
  DEFAULT_BREAK_TIME: Number(env.DEFAULT_BREAK_TIME) || 5,

  // 应用名称
  APP_NAME: env.APP_NAME || '科晟智慧学习系统',

  // 应用描述
  APP_DESCRIPTION: env.APP_DESCRIPTION || '帮助你追踪学习时间和进度的工具',

  // 时区配置
  TIMEZONE: {
    // 时区名称
    NAME: env.TIMEZONE || 'Asia/Shanghai',

    // 时区偏移（小时）
    OFFSET: Number(env.TIMEZONE_OFFSET) || 8,

    // 时区显示名称
    DISPLAY_NAME: '中国标准时间 (GMT+8)'
  }
};

// 海报配置
export const POSTER_CONFIG = {
  // 海报尺寸配置
  SIZE: {
    WIDTH: 800,
    HEIGHT: 1200,
    PADDING: 40
  },

  // 海报图片配置
  IMAGES: {
    // 顶部机构3D logo
    LOGO: {
      URL: '/images/logo-3d-placeholder.svg',
      WIDTH: 200,
      HEIGHT: 200
    },

    // 底部二维码
    QR_CODE: {
      URL: '/images/qrcode-placeholder.svg',
      WIDTH: 150,
      HEIGHT: 150
    }
  },

  // 海报文本配置
  TEXT: {
    INSTITUTION_NAME: '科晟智慧',
    XIAOHONGSHU_ID: '小红书账号  @科晟智慧金融',
    TITLE: '我的学习成果',
    SUBTITLE: '坚持学习，成就未来',
    FOOTER: '专注高效率的金融硕士教育'
  }
};

// 环境配置
export const ENV_CONFIG = {
  // 当前环境（development, production, test）
  NODE_ENV: env.NODE_ENV || 'development',

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
  ENV: ENV_CONFIG,
  POSTER: POSTER_CONFIG
};
