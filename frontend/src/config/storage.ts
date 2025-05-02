/**
 * 存储配置
 */

export const STORAGE_CONFIG = {
  // 本地存储键名
  KEYS: {
    // 认证相关
    TOKEN: 'token',
    USER: 'user',
    
    // 学习追踪系统
    TASKS: 'tasks',
    PLANS: 'plans',
    CURRENT_TASK: 'currentTask',
    TASK_START_TIME: 'taskStartTime',
    
    // 课程系统
    COURSE_PROGRESS: 'courseProgress',
    
    // 题库系统
    QUIZ_HISTORY: 'quizHistory'
  },
  
  // 缓存过期时间（毫秒）
  EXPIRATION: {
    SHORT: 5 * 60 * 1000, // 5分钟
    MEDIUM: 30 * 60 * 1000, // 30分钟
    LONG: 24 * 60 * 60 * 1000 // 1天
  }
};
