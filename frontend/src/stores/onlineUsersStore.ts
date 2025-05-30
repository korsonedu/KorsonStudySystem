/**
 * 在线用户状态管理
 *
 * 该模块负责管理在线用户的WebSocket连接和状态。
 * 功能包括：
 * 1. 建立和维护WebSocket连接
 * 2. 用户认证和会话管理
 * 3. 在线用户列表的实时更新
 * 4. 心跳机制保持连接活跃
 * 5. 自动重连和错误处理
 *
 * 使用方式：
 * ```
 * import { useOnlineUsersStore } from '@/stores/onlineUsersStore';
 *
 * // 在组件中使用
 * const onlineUsersStore = useOnlineUsersStore();
 * onlineUsersStore.connect(); // 连接WebSocket
 *
 * // 获取在线用户列表
 * const users = onlineUsersStore.sortedUsers;
 * ```
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { API_CONFIG, STORAGE_CONFIG } from '../config';
import { toast } from 'vue-sonner';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useUserStore } from './userStore';
import type { OnlineUser as OnlineUserType } from '../types/user';

// 为Window对象添加全局WebSocket连接属性
declare global {
  interface Window {
    __websocketConnection: WebSocket | null;
  }
}

// 初始化全局WebSocket连接
if (typeof window !== 'undefined') {
  window.__websocketConnection = null;
}

/**
 * 在线用户接口定义
 * @property id - 用户ID
 * @property username - 用户名
 * @property lastActivity - 最后活动时间戳（毫秒）
 * @property privacyMode - 隐私模式状态
 */
export interface OnlineUser {
  id: number;
  username: string;
  lastActivity: number;
  privacyMode?: boolean;
  avatar?: string;
}

/**
 * 定义在线用户状态存储
 * 使用Pinia管理WebSocket连接和在线用户状态
 */
export const useOnlineUsersStore = defineStore('onlineUsers', () => {
  // 引入用户状态存储
  const userStore = useUserStore();

  // 状态定义
  /** 在线用户列表 */
  const users = ref<OnlineUserType[]>([]);
  /** WebSocket连接状态 */
  const isConnected = ref(false);
  /** 加载状态 */
  const isLoading = ref(false);
  /** 错误信息 */
  const error = ref('');
  /** WebSocket连接实例 */
  const socket = ref<WebSocket | null>(null);
  /** 重连尝试次数 */
  const reconnectAttempts = ref(0);
  /** 最大重连尝试次数 */
  const maxReconnectAttempts = 5;
  /** 重连超时计时器 */
  const reconnectTimeout = ref<number | null>(null);
  /** 最大重连延迟时间（毫秒） */
  const maxReconnectDelay = 3000; // 最大重连间隔3秒
  /** 同步间隔计时器 */
  const syncInterval = ref<number | null>(null);
  /** 是否正在重连中 */
  const isReconnecting = ref(false);
  /** 隐私模式状态 */
  const privacyMode = ref(localStorage.getItem('privacy_mode') === 'true');

  // 计算属性
  /** 在线用户数量 */
  const onlineCount = computed(() => users.value.length);

  /** 按最后活动时间排序的用户列表（最近活动的用户排在前面） */
  const sortedUsers = computed(() => {
    return [...users.value].sort((a, b) => b.lastActivity - a.lastActivity);
  });

  /**
   * 节流函数 - 限制函数调用频率
   *
   * @param func 要节流的函数
   * @param limit 时间限制（毫秒）
   * @returns 节流后的函数
   *
   * 用于限制WebSocket消息发送频率，防止过多请求
   */
  function throttle(func: Function, limit: number) {
    let lastFunc: number | null = null;
    let lastRan: number | null = null;
    return function(this: any, ...args: any[]) {
      const context = this;
      if (!lastRan) {
        // 首次调用立即执行
        func.apply(context, args);
        lastRan = Date.now();
      } else {
        // 后续调用在时间限制内
        if (lastFunc) clearTimeout(lastFunc);
        lastFunc = window.setTimeout(function() {
          if ((Date.now() - (lastRan as number)) >= limit) {
            func.apply(context, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - (lastRan as number)));
      }
    }
  }

  /**
   * 连接WebSocket
   *
   * 建立与在线用户服务的WebSocket连接，包括：
   * - 浏览器兼容性检查
   * - 全局连接复用
   * - 用户认证
   * - 事件监听设置
   * - 心跳机制启动
   */
  function connect() {
    // 检查浏览器是否支持WebSocket
    if (!('WebSocket' in window)) {
      error.value = '您的浏览器不支持WebSocket，无法显示在线用户';
      console.error('浏览器不支持WebSocket');
      return;
    }

    // 检查是否已有全局连接
    if (window.__websocketConnection?.readyState === WebSocket.OPEN) {
      socket.value = window.__websocketConnection;
      isConnected.value = true;
      isLoading.value = false;

      // 请求在线用户列表
      sendMessage({ type: 'get_online_users' });
      return;
    }

    // 如果已有连接且状态正常，直接返回
    if (socket.value?.readyState === WebSocket.OPEN) {
      return;
    }

    // 如果正在重连中，不重复连接
    if (isReconnecting.value) {
      return;
    }

    isLoading.value = true;
    error.value = '';

    try {
      // 获取认证令牌
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
      if (!token) {
        error.value = '未登录，无法连接到在线用户服务';
        isLoading.value = false;
        return;
      }

      // 确保token格式正确（不包含Bearer前缀）
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

      // 创建WebSocket连接
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // 尝试多种可能的WebSocket URL配置
      // 1. 首先尝试通过API路径连接（适用于Nginx代理）
      let wsUrl = `${protocol}//${window.location.host}/api/online-users/ws`;

      // 调试信息
      console.log('尝试连接WebSocket:', wsUrl);
      console.log('当前用户ID:', userStore.userId);
      console.log('当前用户名:', userStore.username);
      console.log('认证令牌:', cleanToken ? `${cleanToken.substring(0, 10)}...` : 'null');

      // 创建WebSocket连接
      socket.value = new WebSocket(wsUrl);

      // 处理连接错误的情况，如果代理连接失败，尝试直接连接
      socket.value.onerror = (err) => {
        console.error('通过代理连接WebSocket失败，尝试直接连接端口8002', err);

        // 关闭之前的连接尝试
        socket.value?.close();

        // 尝试直接连接8002端口
        const directWsUrl = `${protocol}//${window.location.hostname}:8002/ws`;
        console.log('尝试直接连接WebSocket:', directWsUrl);

        socket.value = new WebSocket(directWsUrl);

        // 设置基本事件处理
        setupWebSocketEvents(socket.value, cleanToken);
      };

      // 设置基本事件处理
      setupWebSocketEvents(socket.value, cleanToken);

      // 保存为全局连接
      window.__websocketConnection = socket.value;

      // 辅助函数：配置WebSocket事件处理
      function setupWebSocketEvents(ws: WebSocket, token: string) {
        // 连接打开时
        ws.onopen = () => {
          console.log('WebSocket连接已打开，发送认证消息');
          isConnected.value = true;
          isLoading.value = false;
          isReconnecting.value = false;
          reconnectAttempts.value = 0;
          error.value = '';

          // 发送认证消息
          sendMessage({ type: 'authenticate', token: token });

          // 等待认证完成后再发送其他消息
          setTimeout(() => {
          // 发送隐私模式状态
          if (privacyMode.value) {
            console.log('发送隐私模式状态: 开启');
            sendMessage({ type: 'privacy_mode', enabled: true });
          }

          // 请求在线用户列表
            console.log('请求在线用户列表');
          sendMessage({ type: 'get_online_users' });

          // 启动心跳和同步
          startHeartbeat();
          startSyncInterval();

          // 通知连接成功
          eventBus.emit(EVENT_NAMES.WS_CONNECTED);
          }, 500); // 等待500ms确保认证完成
        };

        // 接收消息时
        ws.onmessage = (event) => {
          console.log('收到WebSocket消息:', event.data);
          try {
            const message = JSON.parse(event.data);

            // 处理消息
            handleMessage(message);

            // 使用Event Bus广播消息
            if (message.action === 'online_users_updated') {
              eventBus.emit(EVENT_NAMES.ONLINE_USERS_UPDATED, message.users);
            }

            // 广播所有WebSocket消息
            eventBus.emit(EVENT_NAMES.WS_MESSAGE, message);
          } catch (err) {
            console.error('解析WebSocket消息失败:', err);
          }
        };

        // 连接关闭时
        ws.onclose = (event) => {
          console.error('WebSocket连接关闭:', event.code, event.reason);
          isConnected.value = false;
          isLoading.value = false;

          // 清除全局连接引用
          if (window.__websocketConnection === ws) {
            window.__websocketConnection = null;
          }

          // 通知连接断开
          eventBus.emit(EVENT_NAMES.WS_DISCONNECTED, event);

          // 如果是正常关闭或用户登出，不进行重连
          const noReconnectReasons = ['user_logout', 'max_connections_reached', 'max_user_connections_reached'];
          if (event.code === 1000 || noReconnectReasons.includes(event.reason)) {
            // 显示适当的错误消息
            if (event.reason === 'max_connections_reached') {
              error.value = '服务器连接数已达上限，请稍后再试';
              toast.error('服务器繁忙', {
                description: '服务器连接数已达上限，请稍后再试',
                duration: 5000,
              });
            } else if (event.reason === 'max_user_connections_reached') {
              error.value = '您的连接数已达上限，请关闭其他标签页后重试';
              toast.error('连接数已达上限', {
                description: '您的连接数已达上限，请关闭其他标签页后重试',
                duration: 5000,
              });
            }
            return;
          }

          // 尝试重连
          if (reconnectAttempts.value < maxReconnectAttempts) {
            isReconnecting.value = true;
            const delay = Math.min(1000 * (2 ** reconnectAttempts.value), maxReconnectDelay);
            console.log(`WebSocket连接断开，${delay/1000}秒后尝试重连...`);

            reconnectTimeout.value = window.setTimeout(() => {
              reconnectAttempts.value++;
              connect();
            }, delay);
          } else {
            isReconnecting.value = false;
            error.value = '无法连接到在线用户服务，请刷新页面重试';
            toast.error('连接失败', {
              description: '无法连接到在线用户服务，请刷新页面重试',
              duration: 5000,
            });
          }
        };
      }
    } catch (err) {
      console.error('创建WebSocket连接失败:', err);
      error.value = '无法连接到在线用户服务';
      isLoading.value = false;
      isReconnecting.value = false;
    }
  }

  // 断开WebSocket连接
  function disconnect() {
    if (reconnectTimeout.value) {
      clearTimeout(reconnectTimeout.value);
      reconnectTimeout.value = null;
    }

    if (socket.value) {
      socket.value.close();
      socket.value = null;
    }

    isConnected.value = false;
    users.value = [];
  }

  // 发送消息
  function sendMessage(message: any) {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 处理接收到的消息
  function handleMessage(message: any) {
    // 处理在线用户更新消息
    if (message.action === 'online_users_updated') {
      console.log('收到online_users_updated消息:', message.users.length, '名用户在线')
      
      // 更新用户列表
      users.value = message.users
      
      // 通知其他组件用户列表已更新
      eventBus.emit(EVENT_NAMES.ONLINE_USERS_UPDATED, message.users)
      return
    }

    // 处理错误消息
    if (message.type === 'error') {
      error.value = message.message
      return
    }

    // 心跳响应，不需要处理
    if (message.type === 'heartbeat_ack') {
      return
    }

    // 处理任务更新消息
    if (message.type === 'task_update') {
      const { action, task, sender_id } = message
      
      // 根据不同的任务更新类型触发不同的事件
      if (action === 'started') {
        eventBus.emit(EVENT_NAMES.TASK_STARTED, {
          ...task,
          user_id: sender_id
        })
      } else if (action === 'completed') {
        eventBus.emit(EVENT_NAMES.TASK_COMPLETED, {
          ...task,
          user_id: sender_id
        })
      }
      
      return
    }
  }

  // 节流版本的发送消息函数
  const throttledSendMessage = throttle(sendMessage, 1000); // 限制每秒最多发送一次

  // 检查WebSocket连接状态
  function checkWebSocketStatus() {
    if (!socket.value) {
      return "未创建连接";
    }

    switch (socket.value.readyState) {
      case WebSocket.CONNECTING:
        return "正在连接";
      case WebSocket.OPEN:
        return "已连接";
      case WebSocket.CLOSING:
        return "正在关闭";
      case WebSocket.CLOSED:
        return "已关闭";
      default:
        return "未知状态";
    }
  }

  // 心跳机制，保持连接活跃
  let heartbeatInterval: number | null = null;

  function startHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    heartbeatInterval = window.setInterval(() => {
      if (isConnected.value) {
        sendMessage({ type: 'heartbeat' });
      }
    }, 30000); // 每30秒发送一次心跳
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  // 定期同步在线用户列表
  function startSyncInterval() {
    if (syncInterval.value) {
      clearInterval(syncInterval.value);
    }

    syncInterval.value = window.setInterval(() => {
      if (isConnected.value) {
        sendMessage({ type: 'get_online_users' });
      }
    }, 60000); // 每分钟同步一次
  }

  function stopSyncInterval() {
    if (syncInterval.value) {
      clearInterval(syncInterval.value);
      syncInterval.value = null;
    }
  }

  /**
   * 设置隐私模式
   * @param enabled 是否启用隐私模式
   */
  function setPrivacyMode(enabled: boolean) {
    // 先更新本地状态
    privacyMode.value = enabled
    localStorage.setItem('privacy_mode', enabled.toString())

    // 如果WebSocket已连接，发送隐私模式状态到服务器
    if (isConnected.value && socket.value) {
      // 发送隐私模式状态到服务器
      sendMessage({
        type: 'privacy_mode',
        enabled: enabled
      })

      // 通知其他组件隐私模式已更改
      eventBus.emit(EVENT_NAMES.PRIVACY_MODE_CHANGED, enabled)
    }
  }

  // 清理函数
  function cleanup() {
    stopHeartbeat();
    stopSyncInterval();
    disconnect();
  }

  // 监听用户登出事件
  function setupEventListeners() {
    // 使用Event Bus监听用户登出事件
    eventBus.on(EVENT_NAMES.USER_LOGOUT, () => {
      cleanup();
    });

    // 兼容旧的事件监听方式
    window.addEventListener('user:logout', () => {
      cleanup();
    });
  }

  // 初始化时设置事件监听
  setupEventListeners();

  // 初始化时检查隐私模式状态
  if (privacyMode.value) {
    console.log('初始化：隐私模式已启用');
  }

  const onlineUsers = computed(() => users.value);

  const requestUpdate = () => {
    if (isConnected.value && socket.value) {
      socket.value.send(JSON.stringify({ type: 'get_online_users' }));
    }
  }

  return {
    users,
    isConnected,
    isLoading,
    error,
    socket,
    onlineUsers,
    sortedUsers,
    requestUpdate,
    onlineCount,
    reconnectAttempts,
    maxReconnectAttempts,
    isReconnecting,
    privacyMode,
    connect,
    disconnect,
    sendMessage,
    throttledSendMessage,
    checkWebSocketStatus,
    cleanup,
    setPrivacyMode
  };
});
