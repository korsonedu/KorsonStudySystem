export const API_CONFIG = {
    BASE_URL: '',
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/api/auth/register',
            LOGIN: '/api/auth/login',
            LOGOUT: '/api/auth/logout',
            CURRENT_USER: '/api/auth/me',
            VERIFY_EMAIL: '/api/auth/verify-email'
        },
        USER: {
            PROFILE: '/api/users/me',
            UPDATE: '/api/users/me',
            DELETE: '/api/users/me'
        },
        TASKS: {
            BASE: '/api/study/tasks',
            LIST: '/api/study/tasks',
            DETAIL: (id) => `/api/study/tasks/${id}`,
            COMPLETE: (id) => `/api/study/tasks/${id}/complete`,
            TODAY: '/api/study/tasks/today'
        },
        PLANS: {
            BASE: '/api/study/plans',
            LIST: '/api/study/plans',
            DETAIL: (id) => `/api/study/plans/${id}`,
            COMPLETE: (id) => `/api/study/plans/${id}/complete`
        },
        ACHIEVEMENTS: {
            BASE: '/api/study/achievements',
            LIST: '/api/study/achievements',
            DETAIL: (id) => `/api/study/achievements/${id}`,
            UNLOCK: (id) => `/api/study/achievements/${id}/unlock`
        },
        STATISTICS: {
            BASE: '/api/study/statistics',
            DAILY: '/api/study/statistics/daily',
            WEEKLY: '/api/study/statistics/weekly',
            MONTHLY: '/api/study/statistics/monthly',
            TOTAL: '/api/study/statistics',
            HEATMAP: '/api/study/statistics/heatmap',
            TIME_DISTRIBUTION: '/api/study/statistics/time-distribution',
            USER_INFO: '/api/study/statistics/user'
        }
    }
};
//# sourceMappingURL=api.js.map