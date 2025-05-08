/**
 * 错误处理工具函数
 */

/**
 * 带重试的执行函数
 * @param fn 要执行的函数
 * @param retries 重试次数
 * @param delay 重试延迟（毫秒）
 * @returns 函数执行结果的Promise
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.warn(`执行失败，将在 ${delay}ms 后重试，剩余重试次数: ${retries}`, error);
    
    // 等待指定时间
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 递归重试，减少重试次数
    return executeWithRetry(fn, retries - 1, delay);
  }
}

/**
 * 只记录错误，不抛出异常
 * @param fn 要执行的函数
 * @param errorMessage 错误消息
 * @returns 函数执行结果的Promise，失败时返回null
 */
export async function logErrorOnly<T>(
  fn: () => Promise<T>,
  errorMessage: string = '操作失败'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
}

/**
 * 格式化错误消息
 * @param error 错误对象
 * @returns 格式化后的错误消息
 */
export function formatErrorMessage(error: any): string {
  if (!error) {
    return '未知错误';
  }
  
  // 处理API错误响应
  if (error.response && error.response.data) {
    if (error.response.data.detail) {
      return error.response.data.detail;
    }
    if (typeof error.response.data === 'string') {
      return error.response.data;
    }
    return JSON.stringify(error.response.data);
  }
  
  // 处理网络错误
  if (error.message === 'Network Error') {
    return '网络错误，请检查您的网络连接';
  }
  
  // 处理超时错误
  if (error.message && error.message.includes('timeout')) {
    return '请求超时，请稍后再试';
  }
  
  // 处理一般错误
  return error.message || '操作失败，请稍后再试';
}

/**
 * 处理表单验证错误
 * @param error 错误对象
 * @returns 表单错误对象
 */
export function handleFormErrors(error: any): Record<string, string> {
  const formErrors: Record<string, string> = {};
  
  if (error.response && error.response.data) {
    const data = error.response.data;
    
    // 处理FastAPI验证错误格式
    if (data.detail && Array.isArray(data.detail)) {
      data.detail.forEach((item: any) => {
        if (item.loc && item.loc.length > 1) {
          const field = item.loc[1];
          formErrors[field] = item.msg;
        }
      });
    }
    
    // 处理一般字段错误
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(data).forEach(key => {
        if (key !== 'detail') {
          formErrors[key] = Array.isArray(data[key]) ? data[key][0] : data[key];
        }
      });
    }
  }
  
  return formErrors;
}

export default {
  executeWithRetry,
  logErrorOnly,
  formatErrorMessage,
  handleFormErrors
};
