import { defineStore } from 'pinia';
import { apiService } from '../shared/services/apiService';
import { API_CONFIG, STORAGE_CONFIG } from '../config';
import { ref, computed } from 'vue';
import type { User } from '../types/user';

// 为Window对象添加全局WebSocket连接属性
declare global {
  interface Window {
    __websocketConnection: WebSocket | null;
  }
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求参数
export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  invitation_code?: string;
}

// 定义用户状态存储
export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref('');
  const token = ref<string | null>(null);
  const tokenExpiry = ref<number | null>(null);

  const user = computed(() => currentUser.value);
  const isLoggedIn = computed(() => !!currentUser.value);
  const userId = computed(() => currentUser.value?.id);

  // 计算属性
  const username = computed(() => user.value?.username || '');
  const avatar = computed(() => user.value?.avatar || '');
  const isTokenValid = computed(() => {
    if (!token.value) return false;
    if (!tokenExpiry.value) return false;
    return tokenExpiry.value > Date.now();
  });

  // 操作
  const actions = {
    /**
     * 初始化用户状态
     * 从本地存储加载用户信息
     */
    init() {
      // 从localStorage获取认证信息
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      const userDataStr = localStorage.getItem(STORAGE_CONFIG.USER_DATA_KEY);
      const tokenExpiryStr = localStorage.getItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);
      const localAvatar = localStorage.getItem('user_avatar');

      console.log('init: 初始化用户状态', {
        hasToken: !!token,
        hasUserData: !!userDataStr,
        hasLocalAvatar: !!localAvatar,
        tokenExpiry: tokenExpiryStr ? new Date(parseInt(tokenExpiryStr)).toISOString() : null
      });

      // 如果没有token，直接清除状态并返回
      if (!token) {
        console.log('init: 未找到有效的令牌');
        this.clearAuthState();
        return;
      }

      // 尝试从JWT token解析过期时间
      let tokenExpiry: number | null = null;
      let isExpired = false;

      try {
        // 解析JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // JWT的exp是秒级时间戳，需要转换为毫秒
        tokenExpiry = payload.exp * 1000;

        // 检查是否过期
        isExpired = tokenExpiry <= Date.now();

        console.log('init: 从JWT解析的过期时间:', new Date(tokenExpiry).toISOString(), '是否过期:', isExpired);

        // 更新localStorage中的过期时间
        localStorage.setItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY, tokenExpiry.toString());
      } catch (e) {
        console.error('init: 解析JWT失败:', e);

        // 如果解析失败，尝试使用localStorage中的过期时间
        if (tokenExpiryStr) {
          tokenExpiry = parseInt(tokenExpiryStr);
          isExpired = tokenExpiry <= Date.now();
        } else {
          // 如果没有过期时间，认为token未过期，但需要验证
          isExpired = false;
        }
      }

      // 如果token已过期，清除认证状态并返回
      if (isExpired) {
        console.log('init: token已过期，清除认证状态');
        this.clearAuthState();
        return;
      }

      // 设置token和过期时间
      this.token = token;
      if (tokenExpiry) {
        this.tokenExpiry = tokenExpiry;
      }

      // 尝试从localStorage恢复用户数据
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);

          // 确保头像数据正确
          if (!userData.avatar && localAvatar) {
            console.log('init: 用户数据中没有头像，但本地存储中有，使用本地存储的头像');
            userData.avatar = localAvatar;
          }

          this.currentUser = userData;
          console.log('init: 从本地存储恢复用户数据成功', {
            username: userData.username,
            hasAvatar: !!userData.avatar
          });

          // 专门保存用户头像到localStorage，方便其他组件直接访问
          if (userData.avatar) {
            localStorage.setItem('user_avatar', userData.avatar);
          }
        } catch (e) {
          console.error('init: 解析用户数据失败', e);
          // 解析失败，清除无效数据
          localStorage.removeItem(STORAGE_CONFIG.USER_DATA_KEY);
        }
      }

      // 无论是否有用户数据，都尝试从服务器获取最新信息（包括最新的头像URL）
      console.log('init: 尝试从服务器获取最新用户数据');
      // 使用Promise.resolve().then确保异步操作在当前事件循环之后执行
      Promise.resolve().then(() => {
        this.getCurrentUser().catch(err => {
          console.error('init: 获取用户信息失败', err);
          // 如果获取失败且token过期，清除登录状态
          if (err.response?.status === 401) {
            this.clearAuthState();
          }
        });
      });
    },

    /**
     * 用户注册
     * @param userData 用户数据
     * @returns 是否注册成功
     */
    async register(userData: RegisterRequest): Promise<boolean> {
      this.isLoading = true;
      this.error = '';

      try {
        const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

        if (response && response.data) {
          return true;
        }
        return false;
      } catch (err: any) {
        console.error('注册失败:', err);
        this.error = err.response?.data?.detail || '注册失败，请稍后再试';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 用户登录
     * @param credentials 登录凭证
     * @returns 是否登录成功
     */
    async login(credentials: LoginRequest): Promise<boolean> {
      this.isLoading = true;
      this.error = '';

      try {
        console.log('login: 开始登录流程', { username: credentials.username });

        // 先清除所有现有的认证信息
        this.clearAuthState();

        // 验证输入
        if (!credentials.username || !credentials.password) {
          this.error = '请输入用户名和密码';
          return false;
        }

        // 直接使用表单格式 - FastAPI OAuth2PasswordRequestForm 需要表单格式
        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        // 处理响应
        return this.handleLoginResponse(response, credentials.username);
      } catch (err: any) {
        console.error('登录失败:', err);

        // 如果是502错误，显示服务器不可用
        if (err.response?.status === 502) {
          this.error = '服务器暂时不可用，请稍后再试';
        } else {
          this.error = err.response?.data?.detail || '登录失败，请检查用户名和密码';
        }

        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 用户登出
     */
    async logout(): Promise<void> {
      this.isLoading = true;
      console.log('userStore.logout - 开始登出流程');

      try {
        // 尝试调用登出API
        await apiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        console.log('userStore.logout - API请求成功');
      } catch (err: any) {
        console.error('userStore.logout - 登出请求失败:', err);
      } finally {
        // 清除所有认证状态
        this.clearAuthState();

        // 清除所有会话存储
        sessionStorage.clear();

        // 清除所有相关cookie
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          }
        });

        // 触发自定义事件，通知其他组件用户已登出
        window.dispatchEvent(new CustomEvent('user:logout'));

        // 如果有全局WebSocket连接，确保关闭
        if (window.__websocketConnection) {
          try {
            window.__websocketConnection.close(1000, 'user_logout');
            window.__websocketConnection = null;
          } catch (e) {
            console.error('userStore.logout - 关闭WebSocket连接失败:', e);
          }
        }

        this.isLoading = false;
        console.log('userStore.logout - 登出完成，状态已重置');
      }
    },

    /**
     * 从服务器获取当前用户信息
     * @returns 用户信息
     */
    async getCurrentUser(): Promise<User | null> {
      this.isLoading = true;
      this.error = '';

      // 如果没有token，不能获取用户信息
      if (!this.token) {
        this.isLoading = false;
        console.log('getCurrentUser: 没有令牌，无法获取用户信息');
        return null;
      }

      try {
        console.log('getCurrentUser: 从API获取用户信息');

        // 从/me接口获取用户信息
        const response = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);

        if (response && response.data) {
          console.log('getCurrentUser: 获取用户信息成功', {
            username: response.data.username,
            hasAvatar: !!response.data.avatar
          });

          // 检查是否有头像数据
          if (response.data.avatar) {
            console.log('getCurrentUser: 后端返回了头像数据:', {
              avatarType: response.data.avatar.startsWith('data:') ? 'data URL' :
                         (response.data.avatar.includes('dicebear.com') ? 'dicebear URL' : '其他格式')
            });
          } else {
            // 如果后端没有返回头像，检查本地存储是否有
            const localAvatar = localStorage.getItem('user_avatar');
            if (localAvatar) {
              console.log('getCurrentUser: 后端没有头像数据，使用本地存储的头像');
              response.data.avatar = localAvatar;

              // 尝试将本地头像同步到后端
              try {
                console.log('getCurrentUser: 尝试将本地头像同步到后端');
                await apiService.put('/api/users/me/avatar', { avatar: localAvatar });
                console.log('getCurrentUser: 本地头像已同步到后端');
              } catch (syncError) {
                console.error('getCurrentUser: 同步头像到后端失败:', syncError);
              }
            } else {
              // 如果本地也没有，生成一个默认头像
              console.log('getCurrentUser: 后端和本地都没有头像数据，生成默认头像');
              const username = response.data.username || 'User';
              response.data.avatar = `https://api.dicebear.com/7.x/initials/svg?chars=${username.charAt(0).toUpperCase()}`;
            }
          }

          // 更新用户状态
          this.currentUser = response.data;

          // 保存用户数据到localStorage
          localStorage.setItem(STORAGE_CONFIG.USER_DATA_KEY, JSON.stringify(response.data));
          localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, response.data.username);

          // 专门保存头像到localStorage，确保头像即使在新设备也能正确获取
          if (response.data.avatar) {
            localStorage.setItem('user_avatar', response.data.avatar);
            console.log('getCurrentUser: 保存头像到本地存储成功');

            // 如果头像是后端返回的，尝试更新到后端
            // 这确保了本地缓存的头像会被同步到后端
            const localAvatar = localStorage.getItem('user_avatar');
            if (localAvatar && localAvatar !== response.data.avatar &&
                !response.data.avatar.startsWith('data:') &&
                !response.data.avatar.includes('dicebear.com')) {
              console.log('getCurrentUser: 本地头像与后端不同，尝试更新到后端');
              this.setAvatar(localAvatar).catch(e => {
                console.error('getCurrentUser: 更新头像到后端失败', e);
              });
            }
          }

          return this.currentUser;
        } else {
          throw new Error('没有接收到有效的用户数据');
        }
      } catch (err: any) {
        console.error('getCurrentUser: 获取用户信息失败', err);

        // 如果是401错误（未授权），则清除认证状态
        if (err.response?.status === 401) {
          console.log('getCurrentUser: 令牌无效，清除认证状态');
          this.clearAuthState();
        }

        this.error = err.response?.data?.detail || '获取用户信息失败';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 检查是否已登录
     * 检查token是否有效，如果有效则返回true
     */
    checkAuth(): boolean {
      // 如果状态中已有token和用户信息，直接检查
      if (this.token && this.currentUser && this.tokenExpiry) {
        // 检查token是否过期
        const isValid = this.tokenExpiry > Date.now();

        console.log('checkAuth: 从状态检查登录状态', {
          hasToken: true,
          username: this.currentUser.username,
          tokenExpiry: new Date(this.tokenExpiry).toISOString(),
          isValid
        });

        // 如果token已过期，清除认证状态
        if (!isValid) {
          console.log('checkAuth: token已过期，清除认证状态');
          this.clearAuthState();
          return false;
        }

        return true;
      }

      // 如果状态中没有完整信息，尝试从localStorage恢复
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      const userDataStr = localStorage.getItem(STORAGE_CONFIG.USER_DATA_KEY);

      if (!token) {
        console.log('checkAuth: localStorage中没有token');
        this.clearAuthState();
        return false;
      }

      // 尝试从JWT token解析过期时间
      let tokenExpiry: number | null = null;
      let isExpired = false;

      try {
        // 解析JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // JWT的exp是秒级时间戳，需要转换为毫秒
        tokenExpiry = payload.exp * 1000;

        // 检查是否过期
        isExpired = tokenExpiry <= Date.now();

        console.log('checkAuth: 从JWT解析的过期时间:', new Date(tokenExpiry).toISOString(), '是否过期:', isExpired);

        // 更新localStorage中的过期时间
        localStorage.setItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY, tokenExpiry.toString());
      } catch (e) {
        console.error('checkAuth: 解析JWT失败:', e);

        // 如果解析失败，尝试使用localStorage中的过期时间
        const tokenExpiryStr = localStorage.getItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);
        if (tokenExpiryStr) {
          tokenExpiry = parseInt(tokenExpiryStr);
          isExpired = tokenExpiry <= Date.now();
        } else {
          // 如果没有过期时间，假设token有效（设置一个默认的过期时间）
          tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期
          localStorage.setItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY, tokenExpiry.toString());
          isExpired = false;
          console.log('checkAuth: 无法解析JWT，设置默认过期时间:', new Date(tokenExpiry).toISOString());
        }
      }

      // 如果token已过期，清除认证状态
      if (isExpired) {
        console.log('checkAuth: token已过期，清除认证状态');
        this.clearAuthState();
        return false;
      }

      // 如果token有效，尝试恢复用户数据
      if (userDataStr) {
        try {
          // 恢复用户数据
          const userData = JSON.parse(userDataStr);

          // 更新状态
          this.token = token;
          this.currentUser = userData;
          this.tokenExpiry = tokenExpiry;

          console.log('checkAuth: 从localStorage恢复登录状态成功');
          return true;
        } catch (e) {
          console.error('checkAuth: 解析用户数据失败', e);
        }
      } else {
        // 如果没有用户数据，但token有效，尝试获取用户信息
        console.log('checkAuth: token有效但没有用户数据，尝试获取用户信息');
        this.token = token;
        this.tokenExpiry = tokenExpiry;

        // 异步获取用户信息，但不等待结果
        this.getCurrentUser().catch(err => {
          console.error('checkAuth: 获取用户信息失败', err);
          if (err.response?.status === 401) {
            this.clearAuthState();
          }
        });

        // 暂时认为已登录，等待getCurrentUser更新状态
        return true;
      }

      // 如果没有有效的认证信息或token已过期，清除状态
      this.clearAuthState();
      return false;
    },

    /**
     * 获取用户个人资料
     */
    async getProfile(): Promise<any> {
      this.isLoading = true;
      this.error = '';

      try {
        const response = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO);
        return response.data;
      } catch (err: any) {
        this.error = err.response?.data?.detail || '获取用户信息失败';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 处理登录响应
     * @param response 登录响应
     * @param username 用户名
     * @returns 是否登录成功
     */
    handleLoginResponse(response: any, username: string): boolean {
      // 检查响应是否有效
      if (!response || !response.data) {
        console.error('handleLoginResponse: 登录失败，服务器响应无效');
        this.error = '登录失败，服务器响应无效';
        return false;
      }

      // 获取token
      let token = response.data.access_token;
      if (!token && response.data.token) {
        token = response.data.token;
      }

      // 如果没有token，登录失败
      if (!token) {
        console.error('handleLoginResponse: 登录失败，响应中没有有效的令牌', response.data);
        this.error = '登录失败，服务器响应无效';
        return false;
      }

      console.log('handleLoginResponse: 登录成功，保存令牌和用户信息');

      // 获取用户信息
      const userData = response.data.user || { username: username };

      // 解析JWT token获取过期时间
      let expiryTime: number;
      try {
        // 解析JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // JWT的exp是秒级时间戳，需要转换为毫秒
        expiryTime = payload.exp * 1000;
        console.log('handleLoginResponse: 从JWT解析的过期时间:', new Date(expiryTime).toISOString());
      } catch (e) {
        console.error('handleLoginResponse: 解析JWT失败，使用默认过期时间:', e);
        // 如果解析失败，使用默认24小时
        expiryTime = Date.now() + 24 * 60 * 60 * 1000;
      }

      // 保存到状态
      this.token = token;
      this.currentUser = userData;
      this.tokenExpiry = expiryTime;

      // 保存到localStorage
      localStorage.setItem(STORAGE_CONFIG.TOKEN_KEY, token);
      localStorage.setItem(STORAGE_CONFIG.USERNAME_KEY, userData.username);
      localStorage.setItem(STORAGE_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
      localStorage.setItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY, expiryTime.toString());

      // 如果有头像信息，专门保存到localStorage
      if (userData.avatar) {
        localStorage.setItem('user_avatar', userData.avatar);
        console.log('handleLoginResponse: 保存头像到本地存储', {
          hasAvatar: true
        });
      }

      console.log('handleLoginResponse: 用户状态已更新', {
        username: userData.username,
        hasToken: !!token,
        tokenExpiry: new Date(expiryTime).toISOString(),
        hasAvatar: !!userData.avatar
      });

      return true;
    },

    /**
     * 清除认证状态
     * 清除所有本地存储和状态
     */
    clearAuthState() {
      console.log('clearAuthState: 清除所有认证状态');

      // 清除所有本地存储
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY);
      localStorage.removeItem(STORAGE_CONFIG.USERNAME_KEY);
      localStorage.removeItem(STORAGE_CONFIG.USER_DATA_KEY);
      localStorage.removeItem(STORAGE_CONFIG.TOKEN_EXPIRY_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('user_avatar_options');

      // 清除状态
      this.currentUser = null;
      this.token = null;
      this.tokenExpiry = null;
      this.error = '';

      console.log('clearAuthState: 认证状态已清除');
    },

    /**
     * 更新用户头像
     * @param avatarUrl 新的头像URL
     */
    async setAvatar(avatarUrl: string) {
      if (!this.currentUser) {
        console.warn('setAvatar: 用户未登录，无法更新头像');
        return;
      }

      try {
        // 调用后端 API 保存头像
        const response = await apiService.put('/api/users/me/avatar', { avatar: avatarUrl });

        if (response && response.data) {
          // 更新状态中的头像
          this.currentUser.avatar = response.data.avatar;

          // 更新localStorage中的用户数据
          const userDataStr = localStorage.getItem(STORAGE_CONFIG.USER_DATA_KEY);
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              userData.avatar = response.data.avatar;
              localStorage.setItem(STORAGE_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
              // 专门保存头像到localStorage
              localStorage.setItem('user_avatar', response.data.avatar);
            } catch (e) {
              console.error('setAvatar: 更新localStorage中的用户头像失败', e);
            }
          }
        }
      } catch (error) {
        console.error('setAvatar: 保存头像到服务器失败', error);
        throw error;
      }
    },
  };

  return {
    currentUser,
    isLoading,
    error,
    token,
    tokenExpiry,
    user,
    isLoggedIn,
    userId,
    username,
    avatar,
    isTokenValid,
    ...actions,
  };
});
