/**
 * 错误处理工具函数
 * 提供统一的错误处理方法
 */

/**
 * 带重试机制的异步函数执行器
 * @param fetchFn 要执行的异步函数
 * @param name 函数名称（用于日志）
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟基数（毫秒）
 * @returns Promise<void>
 */
export const executeWithRetry = async (
  fetchFn: Function,
  name: string,
  maxRetries = 3,
  retryDelay = 2000
): Promise<void> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await fetchFn();
      return; // 成功则返回
    } catch (err: any) {
      retries++;
      // 只在开发环境输出警告
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`${name} failed (attempt ${retries}/${maxRetries}):`, err.message);
      }

      if (retries >= maxRetries) {
        // 只在开发环境输出错误
        if (process.env.NODE_ENV !== 'production') {
          console.error(`${name} failed after ${maxRetries} attempts`);
        }
        return;
      }

      // 等待一段时间再重试，时间随重试次数增加
      await new Promise(resolve => setTimeout(resolve, retryDelay * retries));
    }
  }
};

/**
 * 处理API错误并返回用户友好的错误消息
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @returns 用户友好的错误消息
 */
export const handleApiError = (error: any, defaultMessage = '操作失败，请稍后重试'): string => {
  // 如果是Axios错误且有响应
  if (error.response && error.response.data) {
    // 如果后端返回了详细错误信息
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    // 如果后端返回了错误消息
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }

  // 网络错误
  if (error.message === 'Network Error') {
    return '网络连接失败，请检查您的网络连接';
  }

  // 超时错误
  if (error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试';
  }

  // 默认错误消息
  return defaultMessage;
};

/**
 * 记录错误到控制台，但不显示给用户
 * 在生产环境中不输出错误
 * @param context 错误上下文
 * @param error 错误对象
 */
export const logErrorOnly = (context: string, error: any): void => {
  // 只在开发环境输出错误
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error in ${context}:`, error);

    // 如果有详细错误信息，也记录下来
    if (error.response && error.response.data) {
      console.error(`Error details:`, error.response.data);
    }
  }
};
