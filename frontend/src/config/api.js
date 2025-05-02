export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    ENDPOINTS: {
        AUTH: {
            REGISTER: '/auth/register',
            LOGIN: '/auth/login',
            LOGOUT: '/auth/logout',
            CURRENT_USER: '/auth/me'
        },
        USER: {
            PROFILE: '/users/me',
            UPDATE: '/users/me',
            DELETE: '/users/me'
        },
        TASKS: {
            BASE: '/tasks',
            LIST: '/tasks',
            DETAIL: (id) => `/tasks/${id}`,
            COMPLETE: (id) => `/tasks/${id}/complete`
        },
        PLANS: {
            BASE: '/plans',
            LIST: '/plans',
            DETAIL: (id) => `/plans/${id}`,
            COMPLETE: (id) => `/plans/${id}/complete`
        },
        ACHIEVEMENTS: {
            BASE: '/achievements',
            LIST: '/achievements',
            DETAIL: (id) => `/achievements/${id}`,
            UNLOCK: (id) => `/achievements/${id}/unlock`
        },
        STATISTICS: {
            BASE: '/statistics',
            DAILY: '/statistics/daily',
            WEEKLY: '/statistics/weekly',
            MONTHLY: '/statistics/monthly'
        }
    }
};
//# sourceMappingURL=api.js.map