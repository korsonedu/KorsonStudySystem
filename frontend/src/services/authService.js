/**
 * 认证服务
 * 处理用户登录、注册、登出等认证相关功能
 */
import { apiService } from './apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../config';
/**
 * 认证服务类
 */
export const authService = {
    /**
     * 用户登录
     * @param credentials 登录凭证
     * @returns 登录结果
     */
    async login(credentials) {
        try {
            const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
            // 保存token和用户信息
            let token = response.data.access_token;
            // 确保令牌格式正确 - 检查是否已经包含 Bearer 前缀
            if (token && !token.startsWith('Bearer ')) {
                token = `Bearer ${token}`;
            }
            localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, token);
            localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, credentials.username);

            // 记录登录时间，用于防止立即重定向
            localStorage.setItem('lastLoginTime', Date.now().toString());
            return response.data.user;
        }
        catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    },
    /**
     * 用户注册
     * @param userData 用户数据
     * @returns 注册结果
     */
    async register(userData) {
        try {
            const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
            return response.data;
        }
        catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    },
    /**
     * 用户登出
     */
    async logout() {
        try {
            await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        }
        catch (error) {
            console.error('登出请求失败:', error);
        }
        finally {
            // 无论API请求是否成功，都清除本地存储
            localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
            localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
        }
    },
    /**
     * 获取当前登录用户信息
     * @returns 用户信息
     */
    async getCurrentUser() {
        try {
            const response = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
            return response.data;
        }
        catch (error) {
            console.error('获取当前用户信息失败:', error);
            return null;
        }
    },
    /**
     * 检查用户是否已登录
     * @returns 是否已登录
     */
    isLoggedIn() {
        return !!localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    },
    /**
     * 获取当前用户名
     * @returns 用户名
     */
    getUsername() {
        return localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);
    }
};
export default authService;
//# sourceMappingURL=authService.js.map