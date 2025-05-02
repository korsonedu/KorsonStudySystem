export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/token',
      LOGOUT: '/api/auth/logout',
      CURRENT_USER: '/api/auth/me'
    },
    USER: {
      PROFILE: '/api/users/me',
      UPDATE: '/api/users/me',
      DELETE: '/api/users/me'
    },
    TASKS: {
      BASE: '/api/tasks',
      LIST: '/api/tasks',
      DETAIL: (id: number) => `/api/tasks/${id}`,
      COMPLETE: (id: number) => `/api/tasks/${id}/complete`
    },
    PLANS: {
      BASE: '/api/plans',
      LIST: '/api/plans',
      DETAIL: (id: string | number) => `/api/plans/${id}`,
      COMPLETE: (id: string | number) => `/api/plans/${id}/complete`
    },
    ACHIEVEMENTS: {
      BASE: '/api/achievements',
      LIST: '/api/achievements',
      DETAIL: (id: number) => `/api/achievements/${id}`,
      UNLOCK: (id: number) => `/api/achievements/${id}/unlock`
    },
    STATISTICS: {
      BASE: '/api/study/statistics',
      DAILY: '/api/study/statistics',
      WEEKLY: '/api/study/statistics',
      MONTHLY: '/api/study/statistics',
      TOTAL: '/api/study/statistics',
      HEATMAP: '/api/study/statistics/heatmap',
      TIME_DISTRIBUTION: '/api/study/statistics/time-distribution',
      USER_INFO: '/api/auth/me'
    }
  }
};