/**
 * 环境变量加载工具
 * 用于从.env文件加载环境变量
 */

// 使用Vite的内置环境变量支持，不需要额外的dotenv包
// Vite会自动加载.env文件中的变量

// 获取环境变量，带有默认值
export function getEnvVariable(key: string, defaultValue: string = ''): string {
  // 首先尝试从window.__ENV__获取（运行时注入的环境变量）
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }

  // 然后尝试从import.meta.env获取（Vite编译时注入的环境变量）
  // 先尝试带VITE_前缀的变量
  const viteKey = `VITE_${key}`;
  if ((import.meta.env as any)[viteKey] !== undefined) {
    return (import.meta.env as any)[viteKey];
  }

  // 再尝试不带前缀的变量
  if ((import.meta.env as any)[key] !== undefined) {
    return (import.meta.env as any)[key];
  }

  // 最后使用默认值
  return defaultValue;
}

// 加载根目录的.env文件
// 注意：Vite已经自动处理了这个过程，这个函数主要是为了保持API兼容性
export function loadRootEnv(): Record<string, string> {
  // 在Vite中，环境变量已经被自动加载到import.meta.env中
  // 这里我们只需要返回一个空对象，实际的环境变量会通过getEnvVariable获取
  return {};
}

// 导出环境变量对象
export const env = {
  // 后端配置
  BACKEND_PROTOCOL: getEnvVariable('BACKEND_PROTOCOL', 'https'),
  BACKEND_HOST: getEnvVariable('BACKEND_HOST', 'localhost'),
  BACKEND_PORT: getEnvVariable('BACKEND_PORT', ''),
  BACKEND_BASE_PATH: getEnvVariable('BACKEND_BASE_PATH', ''),
  API_BASE_URL: getEnvVariable('API_BASE_URL', ''),

  // 前端配置
  FRONTEND_PROTOCOL: getEnvVariable('FRONTEND_PROTOCOL', 'https'),
  FRONTEND_HOST: getEnvVariable('FRONTEND_HOST', 'plt.korsonedu.com'),
  FRONTEND_PORT: getEnvVariable('FRONTEND_PORT', ''),
  FRONTEND_BASE_PATH: getEnvVariable('FRONTEND_BASE_PATH', ''),

  // API配置
  API_TIMEOUT: getEnvVariable('API_TIMEOUT', '30000'),
  API_RETRY_COUNT: getEnvVariable('API_RETRY_COUNT', '3'),
  API_RETRY_DELAY: getEnvVariable('API_RETRY_DELAY', '1000'),
  API_WITH_CREDENTIALS: getEnvVariable('API_WITH_CREDENTIALS', 'false'),
  API_CACHE_CONTROL: getEnvVariable('API_CACHE_CONTROL', 'no-cache'),
  PROD_API_TIMEOUT: getEnvVariable('PROD_API_TIMEOUT', '60000'),

  // 应用配置
  APP_NAME: getEnvVariable('APP_NAME', '科晟智慧学习系统'),
  APP_DESCRIPTION: getEnvVariable('APP_DESCRIPTION', '帮助你追踪学习时间和进度的工具'),
  APP_VERSION: getEnvVariable('APP_VERSION', '1.0.0'),

  // 时区配置
  TIMEZONE: getEnvVariable('TIMEZONE', 'Asia/Shanghai'),
  TIMEZONE_OFFSET: getEnvVariable('TIMEZONE_OFFSET', '8'),

  // 番茄钟配置
  DEFAULT_POMODORO_TIME: getEnvVariable('DEFAULT_POMODORO_TIME', '25'),
  DEFAULT_BREAK_TIME: getEnvVariable('DEFAULT_BREAK_TIME', '5'),

  // 环境
  NODE_ENV: process.env.NODE_ENV || 'development',

  // 辅助函数
  get IS_DEV(): boolean {
    return this.NODE_ENV === 'development';
  },

  get IS_PROD(): boolean {
    return this.NODE_ENV === 'production';
  },

  get IS_TEST(): boolean {
    return this.NODE_ENV === 'test';
  }
};

export default env;
