export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      CURRENT_USER: '/api/auth/me'
    },
    USER: {
      PROFILE: '/api/users/me',
      UPDATE: '/api/users/me',
      DELETE: '/api/users/me'
    },
    TASKS: {
      BASE: '/api/study/tasks',
      LIST: '/api/study/tasks',
      DETAIL: (id: number) => `/api/study/tasks/${id}`,
      COMPLETE: (id: number) => `/api/study/tasks/${id}/complete`,
      TODAY: '/api/study/tasks/today',
      HEATMAP: '/api/study/tasks/heatmap'
    },
    PLANS: {
      BASE: '/api/study/plans',
      LIST: '/api/study/plans',
      DETAIL: (id: string | number) => `/api/study/plans/${id}`,
      COMPLETE: (id: string | number) => `/api/study/plans/${id}/complete`
    },
    ACHIEVEMENTS: {
      BASE: '/api/study/achievements',
      LIST: '/api/study/achievements',
      DETAIL: (id: number) => `/api/study/achievements/${id}`,
      UNLOCK: (id: number) => `/api/study/achievements/${id}/unlock`
    },
    STATISTICS: {
      BASE: '/api/study/statistics',
      DAILY: '/api/study/statistics/daily',
      WEEKLY: '/api/study/statistics/weekly',
      MONTHLY: '/api/study/statistics/monthly',
      TOTAL: '/api/study/statistics/total',
      HEATMAP: '/api/study/statistics/heatmap',
      TIME_DISTRIBUTION: '/api/study/statistics/time-distribution',
      USER_INFO: '/api/study/statistics/user'
    }
  }
};