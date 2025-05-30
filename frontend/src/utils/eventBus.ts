/**
 * 事件总线 (Event Bus)
 * 用于组件间通信，特别是非父子组件之间的通信
 */

type EventCallback = (...args: any[]) => void;

interface EventBusType {
  on(event: string, callback: EventCallback): void;
  once(event: string, callback: EventCallback): void;
  off(event: string, callback?: EventCallback): void;
  emit(event: string, ...args: any[]): void;
}

class EventBus implements EventBusType {
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  /**
   * 监听事件
   * @param event 事件名称
   * @param callback 回调函数
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 监听事件，但只触发一次
   * @param event 事件名称
   * @param callback 回调函数
   */
  once(event: string, callback: EventCallback): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }

  /**
   * 取消监听事件
   * @param event 事件名称
   * @param callback 可选的回调函数，如果不提供则移除该事件的所有监听器
   */
  off(event: string, callback?: EventCallback): void {
    if (!this.events.has(event)) {
      return;
    }

    if (!callback) {
      this.events.delete(event);
      return;
    }

    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 传递给回调函数的参数
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) {
      return;
    }

    const callbacks = this.events.get(event)!.slice();
    for (const callback of callbacks) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events.clear();
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

// 定义常用事件名称常量
export const EVENT_NAMES = {
  // 用户相关
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_PROFILE_UPDATED: 'user:profile:updated',

  // 在线用户相关
  ONLINE_USERS_UPDATED: 'online_users:updated',
  ONLINE_USERS_CONNECTED: 'online_users:connected',
  ONLINE_USERS_DISCONNECTED: 'online_users:disconnected',

  // WebSocket相关
  WS_CONNECTED: 'ws:connected',
  WS_DISCONNECTED: 'ws:disconnected',
  WS_ERROR: 'ws:error',
  WS_MESSAGE: 'ws:message',

  // 任务相关
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  TASK_DELETED: 'task:deleted',
  TASK_STARTED: 'task:started',
  TASK_STATUS_UPDATED: 'task:status:updated',

  // 计划相关
  PLAN_CREATED: 'plan:created',
  PLAN_UPDATED: 'plan:updated',
  PLAN_COMPLETED: 'plan:completed',
  PLAN_DELETED: 'plan:deleted',

  // 隐私模式相关
  PRIVACY_MODE_CHANGED: 'privacy_mode:changed'
} as const;

export default eventBus;
