/**
 * 认证服务
 * 为了向后兼容，从用户服务重新导出
 */
import { authService, userService } from './userService';
export * from './userService';

// 默认导出认证服务
export default authService;
