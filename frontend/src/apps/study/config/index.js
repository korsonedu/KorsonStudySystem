/**
 * 学习追踪应用配置
 * 导入全局配置并添加应用特定配置
 */
import { API_CONFIG as GlobalAPIConfig } from '../../../config';
// 导出全局API配置
export const API_CONFIG = GlobalAPIConfig;
// 应用特定配置
export const APP_CONFIG = {
    // 默认番茄钟时间（分钟）
    DEFAULT_POMODORO_TIME: 25,
    // 默认休息时间（分钟）
    DEFAULT_BREAK_TIME: 5,
    // 应用名称
    APP_NAME: '学习追踪系统',
    // 应用描述
    APP_DESCRIPTION: '帮助你追踪学习时间和进度的工具'
};
export default {
    API: API_CONFIG,
    APP: APP_CONFIG
};
//# sourceMappingURL=index.js.map