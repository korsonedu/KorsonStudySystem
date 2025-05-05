/**
 * API服务类型声明文件
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: any;
}

export interface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
  [key: string]: any;
}

export interface ApiService {
  get<T = any>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any, config?: ApiConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: ApiConfig): Promise<ApiResponse<T>>;
  postForm<T = any>(url: string, data: Record<string, any>): Promise<ApiResponse<T>>;
}

export const apiService: ApiService;

export default apiService;
