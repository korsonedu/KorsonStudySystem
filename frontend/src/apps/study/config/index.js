/**
 * 学习追踪应用配置
 * 导入全局配置
 */
import { API_CONFIG, APP_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG, POSTER_CONFIG } from '../../../config';
import { STUDY_API_CONFIG } from './api';
// 导出所有全局配置
export { API_CONFIG, APP_CONFIG, STORAGE_CONFIG, SERVER_CONFIG, ENV_CONFIG, POSTER_CONFIG, STUDY_API_CONFIG };
// 导出默认配置
export default {
    API: API_CONFIG,
    STUDY_API: STUDY_API_CONFIG,
    APP: APP_CONFIG,
    STORAGE: STORAGE_CONFIG,
    SERVER: SERVER_CONFIG,
    ENV: ENV_CONFIG,
    POSTER: POSTER_CONFIG
};
//# sourceMappingURL=index.js.map