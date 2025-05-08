/**
 * 混合存储工具类
 * 实现本地存储和后端存储的混合使用策略
 */
// 默认配置
const DEFAULT_CONFIG = {
    prefix: 'studytool_',
    defaultExpiry: 7 * 24 * 60 * 60 * 1000 // 7天
};
/**
 * 混合存储类
 * 提供本地存储和后端同步功能
 */
export class HybridStorage {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * 获取完整的存储键
     */
    getFullKey(key) {
        return `${this.config.prefix}${key}`;
    }
    /**
     * 设置本地存储项
     */
    setItem(key, value, expiry) {
        const fullKey = this.getFullKey(key);
        const item = {
            key,
            value,
            expiry: expiry || this.config.defaultExpiry
                ? Date.now() + (expiry || this.config.defaultExpiry)
                : undefined
        };
        try {
            localStorage.setItem(fullKey, JSON.stringify(item));
        }
        catch (error) {
            console.error(`Error saving to localStorage: ${error}`);
            // 如果存储失败（例如配额超出），尝试清理过期项
            this.clearExpired();
            try {
                localStorage.setItem(fullKey, JSON.stringify(item));
            }
            catch (retryError) {
                console.error(`Failed to save after cleanup: ${retryError}`);
            }
        }
    }
    /**
     * 获取本地存储项
     */
    getItem(key, defaultValue = null) {
        const fullKey = this.getFullKey(key);
        try {
            const itemStr = localStorage.getItem(fullKey);
            if (!itemStr)
                return defaultValue;
            const item = JSON.parse(itemStr);
            // 检查是否过期
            if (item.expiry && item.expiry < Date.now()) {
                localStorage.removeItem(fullKey);
                return defaultValue;
            }
            return item.value;
        }
        catch (error) {
            console.error(`Error retrieving from localStorage: ${error}`);
            return defaultValue;
        }
    }
    /**
     * 移除本地存储项
     */
    removeItem(key) {
        const fullKey = this.getFullKey(key);
        try {
            localStorage.removeItem(fullKey);
        }
        catch (error) {
            console.error(`Error removing from localStorage: ${error}`);
        }
    }
    /**
     * 清理所有过期项
     */
    clearExpired() {
        try {
            const now = Date.now();
            const prefixLength = this.config.prefix.length;
            for (let i = 0; i < localStorage.length; i++) {
                const fullKey = localStorage.key(i);
                if (fullKey && fullKey.startsWith(this.config.prefix)) {
                    try {
                        const itemStr = localStorage.getItem(fullKey);
                        if (itemStr) {
                            const item = JSON.parse(itemStr);
                            if (item.expiry && item.expiry < now) {
                                localStorage.removeItem(fullKey);
                            }
                        }
                    }
                    catch (e) {
                        // 如果单个项解析失败，继续处理其他项
                        console.warn(`Failed to parse item ${fullKey}:`, e);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error clearing expired items: ${error}`);
        }
    }
    /**
     * 获取所有符合前缀的项
     */
    getAllItems(keyPrefix = '') {
        const result = {};
        const fullPrefix = this.getFullKey(keyPrefix);
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const fullKey = localStorage.key(i);
                if (fullKey && fullKey.startsWith(fullPrefix)) {
                    const itemStr = localStorage.getItem(fullKey);
                    if (itemStr) {
                        try {
                            const item = JSON.parse(itemStr);
                            // 检查是否过期
                            if (item.expiry && item.expiry < Date.now()) {
                                localStorage.removeItem(fullKey);
                                continue;
                            }
                            // 提取原始键（移除前缀）
                            const originalKey = fullKey.substring(this.config.prefix.length);
                            result[originalKey] = item.value;
                        }
                        catch (e) {
                            // 只在开发环境输出警告
                            if (process.env.NODE_ENV !== 'production') {
                                console.warn(`Failed to parse item ${fullKey}:`, e);
                            }
                        }
                    }
                }
            }
            return result;
        }
        catch (error) {
            // 只在开发环境输出错误
            if (process.env.NODE_ENV !== 'production') {
                console.error(`Error getting all items: ${error}`);
            }
            return {};
        }
    }
}
// 创建默认实例
export const storage = new HybridStorage();
export default storage;
//# sourceMappingURL=storage.js.map