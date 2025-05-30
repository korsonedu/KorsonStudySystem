<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useOnlineUsersStore } from '../../../stores/onlineUsersStore'
import { useUserStore } from '../../../stores/userStore'
import { useTaskStatusStore } from '../../../stores/taskStatusStore'
import eventBus, { EVENT_NAMES } from '../../../utils/eventBus'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../../components/ui/hover-card'
import { toast } from 'vue-sonner'
import type { Task as TaskType } from '../../../types/task'
import { taskService } from '../../../shared/services/taskService'

// 使用状态存储
const onlineUsersStore = useOnlineUsersStore()
const userStore = useUserStore()
const taskStatusStore = useTaskStatusStore()

// 计算属性：格式化在线时间
const formatOnlineTime = (timestamp: string | number | undefined) => {
  if (!timestamp) return '刚刚'
  
  // 将时间转换为时间戳
  let timestampMs: number
  if (typeof timestamp === 'string') {
    timestampMs = new Date(timestamp).getTime()
  } else {
    // 如果时间戳是秒，转换为毫秒
    timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  }
  
  const now = Date.now()
  const diff = now - timestampMs
  if (diff < 0) return '刚刚'
  
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

// 计算属性：排序后的用户列表
const sortedUsers = computed(() => {
  const users = [...onlineUsersStore.onlineUsers]
  // 将当前用户放在第一位
  const currentUserId = userStore.currentUser?.id
  if (currentUserId) {
    const currentUserIndex = users.findIndex(user => user.id === currentUserId)
    if (currentUserIndex !== -1) {
      const currentUser = users.splice(currentUserIndex, 1)[0]
      users.unshift(currentUser)
    }
  }
  return users
})

// 计算属性：过滤后的用户列表
const filteredUsers = computed(() => {
  return sortedUsers.value.filter(user => {
    // 始终显示当前用户
    if (user.id === userStore.currentUser?.id) return true
    // 如果用户开启了隐私模式，则不显示
    return !user.privacyMode
  })
})

// 计算属性：当前用户是否在线
const isCurrentUserOnline = computed(() => {
  const currentUserId = userStore.currentUser?.id
  return currentUserId ? onlineUsersStore.onlineUsers.some(user => user.id === currentUserId) : false
})

// 监听当前用户的隐私模式变化
watch(() => userStore.currentUser?.privacyMode, (newValue) => {
  if (onlineUsersStore.isConnected) {
    // 延迟发送更新请求，避免频繁请求
    setTimeout(() => {
      onlineUsersStore.requestUpdate()
    }, 1000)
  }
})

// 组件挂载时检查连接状态并设置事件监听
onMounted(() => {
  console.log('OnlineUsersCard 组件挂载')

  // 监听隐私模式变化
  eventBus.on(EVENT_NAMES.PRIVACY_MODE_CHANGED, (enabled: boolean) => {
    console.log('隐私模式状态变更:', enabled)
    if (onlineUsersStore.isConnected) {
      onlineUsersStore.sendMessage({ type: 'get_online_users' })
    }
  })

  // 如果用户已登录但WebSocket未连接，则连接
  if (userStore.isLoggedIn && !onlineUsersStore.isConnected) {
    console.log('OnlineUsersCard: 用户已登录但WebSocket未连接，尝试连接')
    onlineUsersStore.connect()
  }

  // 初始化所有在线用户的任务信息
  if (onlineUsersStore.onlineCount > 0) {
    console.log('有在线用户，初始化任务信息')
    initializeUserTasks()
  }

  // 监听WebSocket连接成功事件
  eventBus.on(EVENT_NAMES.WS_CONNECTED, () => {
    console.log('收到WebSocket连接成功事件，初始化任务信息')
    // 连接成功后立即请求在线用户列表
    onlineUsersStore.sendMessage({ type: 'get_online_users' })
    
    // 延迟一点再初始化任务信息，确保用户列表已更新
    setTimeout(initializeUserTasks, 1000)
  })

  // 监听WebSocket消息事件
  eventBus.on(EVENT_NAMES.WS_MESSAGE, (message: any) => {
    console.log('收到WebSocket消息:', message)
    if (message.type === 'task_update' && message.task && message.sender_id) {
      taskStatusStore.handleTaskUpdate(message)
    }
  })

  // 监听任务更新事件
  eventBus.on(EVENT_NAMES.TASK_STARTED, (task: TaskType) => {
    console.log('收到任务开始事件:', task)
    if (task.user_id) {
      taskStatusStore.fetchUserTasks(task.user_id)
    }
  })

  eventBus.on(EVENT_NAMES.TASK_COMPLETED, (task: TaskType) => {
    console.log('收到任务完成事件:', task)
    if (task.user_id) {
      taskStatusStore.fetchUserTasks(task.user_id)
    }
  })

  // 监听在线用户更新事件
  eventBus.on(EVENT_NAMES.ONLINE_USERS_UPDATED, (users: any[]) => {
    console.log('收到在线用户更新事件:', users)
    // 更新所有在线用户的任务信息
    users.forEach(user => {
      if (!user.privacyMode) {
        taskStatusStore.fetchUserTasks(user.id)
      }
    })
  })

  // 启动定期刷新
  const stopPeriodicRefresh = taskStatusStore.startPeriodicRefresh()

  // 组件卸载时清除定时器和事件监听
  onBeforeUnmount(() => {
    stopPeriodicRefresh()
    eventBus.off(EVENT_NAMES.TASK_STARTED)
    eventBus.off(EVENT_NAMES.TASK_COMPLETED)
    eventBus.off(EVENT_NAMES.ONLINE_USERS_UPDATED)
    eventBus.off(EVENT_NAMES.WS_CONNECTED)
    eventBus.off(EVENT_NAMES.WS_MESSAGE)
    eventBus.off(EVENT_NAMES.PRIVACY_MODE_CHANGED)
  })
})

// 初始化所有用户的任务信息
const initializeUserTasks = async () => {
  console.log('开始初始化所有用户任务信息')
  const onlineUsers = onlineUsersStore.sortedUsers
  console.log('在线用户列表:', onlineUsers)
  
  // 使用 Promise.all 并行获取所有用户的任务信息
  await Promise.all(
    onlineUsers.map(async (user) => {
      if (!user.privacyMode) {
        console.log('获取用户任务信息:', user.id)
        await taskStatusStore.fetchUserTasks(user.id)
      }
    })
  )
  console.log('所有用户任务信息初始化完成')
}

// 获取用户当前正在进行的任务（最多一个）
const getCurrentOngoingTask = (userId: number) => {
  const task = taskStatusStore.getOngoingTask(userId)
  console.log('获取用户进行中任务:', userId, task)
  return task
}

// 获取用户已完成的任务
const getCompletedTasks = (userId: number) => {
  const tasks = taskStatusStore.getCompletedTasks(userId)
  console.log('获取用户已完成任务:', userId, tasks)
  return tasks
}

// 获取用户统计信息
const getUserStats = (userId: number) => {
  const stats = taskStatusStore.getUserStats(userId)
  console.log('获取用户统计信息:', userId, stats)
  return stats
}

// 获取用户加载状态
const getLoadingState = (userId: number) => {
  return taskStatusStore.getLoadingState(userId)
}

// 获取用户错误信息
const getErrorState = (userId: number) => {
  return taskStatusStore.getErrorState(userId)
}

// 强制刷新所有用户数据
const forceRefreshAllUsers = async () => {
  console.log('手动强制刷新所有用户数据')
  await initializeUserTasks()
}

// 格式化时长（分钟转为小时和分钟）
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}
</script>

<template>
  <Card class="online-users-card">
    <CardHeader class="card-header">
      <CardTitle class="card-title">在线用户 ({{ filteredUsers.length }})</CardTitle>
      <button v-if="userStore.isLoggedIn" @click="forceRefreshAllUsers" class="refresh-button" title="刷新在线用户数据">
        🔄
      </button>
    </CardHeader>
    <CardContent>
      <div v-if="!userStore.isLoggedIn" class="not-logged-in-state">
        <div class="state-icon">🔒</div>
        <p>请登录后查看在线用户</p>
      </div>

      <div v-else-if="onlineUsersStore.isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="onlineUsersStore.isReconnecting" class="reconnecting-state">
        <div class="loading-spinner"></div>
        <p>正在尝试重新连接... ({{ onlineUsersStore.reconnectAttempts }}/{{ onlineUsersStore.maxReconnectAttempts }})</p>
      </div>

      <div v-else-if="onlineUsersStore.error" class="error-state">
        <div class="state-icon">⚠️</div>
        <p>{{ onlineUsersStore.error }}</p>
        <p class="connection-status">连接状态: {{ onlineUsersStore.checkWebSocketStatus() }}</p>
        <button @click="onlineUsersStore.connect()" class="retry-button">重试</button>
      </div>

      <div v-else-if="onlineUsersStore.onlineCount === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <p>当前没有其他用户在线</p>
      </div>

      <div v-else class="users-list">
        <HoverCard v-for="user in filteredUsers" :key="user.id">
          <HoverCardTrigger>
            <div class="user-item" :class="{ 'current-user': user.id === userStore.userId }">
              <div class="user-avatar">
                <div v-if="user.avatar" class="avatar-circle-img" :class="{ 'current-user': user.id === userStore.userId }">
                  <img :src="user.avatar" alt="用户头像" class="avatar-img" @error="user.avatar = null" />
                </div>
                <div v-else class="avatar-circle" :class="{ 'current-user': user.id === userStore.userId }">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div class="online-indicator"></div>
              </div>
              <div class="user-info">
                <div class="username">
                  {{ user.username }}
                  <span v-if="user.id === userStore.userId" class="current-user-tag">(我)</span>
                </div>
                <div class="last-activity">在线时间: {{ formatOnlineTime(user.lastActivity) }}</div>
              </div>
            </div>
          </HoverCardTrigger>

          <HoverCardContent class="apple-style-hover-card" @mouseenter="() => {
            console.log('鼠标悬停，强制刷新用户任务数据');
            taskStatusStore.fetchUserTasks(user.id);
          }">
            <div class="apple-card-content">
              <div class="apple-card-header">
                <div class="apple-user-info">
                  <div class="apple-avatar">
                    <div v-if="user.avatar" class="apple-avatar-circle-img">
                      <img :src="user.avatar" alt="用户头像" class="avatar-img" @error="user.avatar = null" />
                    </div>
                    <div v-else class="apple-avatar-circle">{{ user.username.charAt(0).toUpperCase() }}</div>
                  </div>
                  <div class="apple-user-details">
                    <span class="apple-username">{{ user.username }}</span>
                    <span class="apple-user-description">学习中的用户</span>
                  </div>
                </div>
                <div class="apple-focus-time">
                  <span class="apple-focus-icon">⏱️</span>
                  <span>今日专注: {{ formatDuration(getUserStats(user.id).totalDuration) }}</span>
                </div>
              </div>

              <!-- 加载状态 -->
              <div v-if="getLoadingState(user.id)" class="loading-container">
                <div class="loading-spinner-small"></div>
                <p>{{ getErrorState(user.id) || '加载中...' }}</p>
              </div>

              <div v-else class="apple-tasks-container">
                <!-- 正在学习的任务 - 精简版 -->
                <div v-if="getCurrentOngoingTask(user.id)" class="apple-ongoing-section">
                  <div class="apple-task-header">
                    <div class="apple-task-icon">🔍</div>
                    <div class="apple-task-title">正在专注</div>
                  </div>
                  <div class="apple-ongoing-task">
                    <span class="apple-ongoing-task-name">{{ getCurrentOngoingTask(user.id).title }}</span>
                    <span class="apple-ongoing-task-time">
                      {{ getCurrentOngoingTask(user.id).startTime ? new Date(getCurrentOngoingTask(user.id).startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '刚刚' }}
                    </span>
                  </div>
                </div>

                <!-- 今日已完成任务 -->
                <div v-if="getCompletedTasks(user.id).length" class="apple-completed-tasks">
                  <div class="apple-task-header">
                    <div class="apple-task-icon">✅</div>
                    <div class="apple-task-title">今日已完成</div>
                  </div>
                  <ul class="apple-completed-list">
                    <li v-for="task in getCompletedTasks(user.id)" :key="task.id" class="apple-completed-item">
                      <span class="apple-task-dot"></span>
                      <span class="apple-completed-name">{{ task.title }}</span>
                    </li>
                  </ul>
                </div>

                <!-- 无任务状态 -->
                <div v-if="(!getCurrentOngoingTask(user.id)) && !getCompletedTasks(user.id).length"
                     class="apple-no-tasks">
                  <p>今日暂无学习记录</p>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </CardContent>
  </Card>
</template>

<style>
/* 全局样式，确保覆盖组件库样式 */
.apple-style-hover-card {
  width: 340px !important;
  background-color: #2a1a18 !important; /* 更深的红棕色背景 */
  border-radius: 8px !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(255, 204, 0, 0.2) !important; /* 黄色边框增加对比度 */
  padding: 0 !important;
  overflow: hidden !important;
}

.apple-card-content {
  width: 100%;
}

.apple-card-header {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 204, 0, 0.3); /* 黄色边框增加对比度 */
  background-color: #3a2a28; /* 更亮的红棕色背景，增加对比度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* 添加阴影增加立体感 */
}

.apple-user-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.apple-avatar {
  margin-right: 10px;
}

.apple-avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 204, 0, 0.2);
  color: #ffcc00;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.apple-avatar-circle-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background-color: rgba(255, 204, 0, 0.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.apple-user-details {
  display: flex;
  flex-direction: column;
}

.apple-username {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 2px;
}

.apple-user-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.apple-focus-time {
  font-size: 12px;
  color: #ffcc00;
  display: flex;
  align-items: center;
  align-self: flex-end;
}

.apple-focus-icon {
  margin-right: 3px;
}

.apple-tasks-container {
  padding: 10px 12px;
}

.apple-ongoing-section {
  margin-bottom: 10px;
}

.apple-task-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.apple-task-icon {
  font-size: 14px;
  margin-right: 6px;
  background-color: rgba(255, 204, 0, 0.2);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.apple-task-title {
  font-size: 14px;
  font-weight: 600;
  color: #ffcc00;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.3px;
}

.apple-task-item {
  background-color: #3a2a28; /* 更亮的红棕色背景，增加对比度 */
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3); /* 增强阴影 */
  border-left: 4px solid #ffcc00; /* 加粗边框 */
  transition: all 0.2s ease;
}

.apple-task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.4);
  background-color: #4a3a38; /* 悬停时背景更亮 */
}

/* 正在专注任务样式 */
.apple-ongoing-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 204, 0, 0.05);
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 4px;
  transition: all 0.2s ease;
}

.apple-ongoing-task:hover {
  background-color: rgba(255, 204, 0, 0.08);
}

.apple-ongoing-task-name {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}

.apple-ongoing-task-time {
  font-size: 11px;
  color: #ffcc00;
  white-space: nowrap;
}

.apple-ongoing-task-time::before {
  content: "⏱️";
  margin-right: 2px;
  font-size: 10px;
}

.apple-task-content {
  display: flex;
  flex-direction: column;
}

.apple-task-name {
  font-size: 15px; /* 增大字体 */
  font-weight: 500; /* 加粗字体 */
  color: #ffffff;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* 添加文字阴影 */
}

.apple-task-start-time {
  font-size: 13px;
  color: #ffcc00;
  font-weight: 500; /* 加粗字体 */
  display: flex;
  align-items: center;
}

.apple-task-start-time::before {
  content: "⏱️";
  margin-right: 4px;
  font-size: 12px;
}

.apple-completed-tasks {
  margin-top: 8px;
}

.apple-completed-list {
  list-style: none;
  padding: 4px 6px;
  margin: 4px 0 0 0;
  max-height: 100px;
  overflow-y: auto;
  background-color: rgba(44, 44, 46, 0.5);
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.apple-completed-list::-webkit-scrollbar {
  width: 3px;
}

.apple-completed-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.apple-completed-list::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.apple-completed-item {
  display: flex;
  align-items: center;
  padding: 4px 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.apple-completed-item:last-child {
  border-bottom: none;
}

.apple-task-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #ffcc00;
  margin-right: 6px;
}

.apple-completed-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apple-no-tasks {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  background-color: rgba(44, 44, 46, 0.3);
  border-radius: 4px;
  margin: 4px 0;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.apple-no-tasks p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-align: center;
  font-style: italic;
}

/* 调试信息样式 - 已移除 */

/* 原始样式保留 */
.online-users-card {
  width: 100%;
  background-color: var(--color-card-gray);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-top: 20px;
  position: relative;
}

.online-users-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.2rem;
  color: var(--color-text-white);
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
}

.card-title::before {
  content: "👥";
  margin-right: 8px;
  font-size: 1.1rem;
}

/* 隐私模式相关样式已移除 */

.loading-state,
.error-state,
.empty-state,
.not-logged-in-state,
.reconnecting-state {
  padding: 30px 20px;
  text-align: center;
  color: var(--color-text-gray);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon,
.state-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  opacity: 0.7;
}

.loading-spinner {
  margin: 0 auto 15px;
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-text-yellow);
  animation: spin 1s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.1);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: var(--color-text-yellow);
  color: var(--color-dark-gray);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.retry-button:hover {
  background-color: #ffda85;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
}

.refresh-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: var(--color-text-gray);
}

.refresh-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-yellow);
  transform: rotate(180deg);
}


.connection-status {
  font-size: 12px;
  color: var(--color-text-gray);
  margin-top: 5px;
  margin-bottom: 10px;
}

.users-list {
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  transition: all 0.3s ease;
  margin: 8px 12px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.user-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.user-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-accent-orange);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.avatar-circle-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-accent-orange);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
  border: 2px solid var(--color-card-gray);
  box-shadow: 0 0 4px rgba(76, 175, 80, 0.5);
}

.user-info {
  flex: 1;
}

.username {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-white);
  margin-bottom: 4px;
}

.last-activity {
  font-size: 12px;
  color: var(--color-text-gray);
  display: flex;
  align-items: center;
}

.last-activity .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #4CAF50;
  margin-right: 6px;
  display: inline-block;
}

.current-user .username {
  color: var(--color-text-yellow);
  font-weight: 600;
}

.current-user-tag {
  font-size: 12px;
  color: var(--color-text-yellow);
  margin-left: 4px;
  opacity: 0.8;
}

.avatar-circle.current-user {
  background-color: var(--color-text-yellow);
  color: var(--color-dark-gray);
}

.user-item.current-user {
  background-color: rgba(255, 215, 0, 0.05);
  border: 1px solid rgba(255, 215, 0, 0.15);
}

/* Hover Card 样式 - 优雅深沉风格 */
:deep(.user-hover-card) {
  width: 380px !important; /* 加宽卡片 */
  padding: 0 !important;
  border-radius: 20px !important; /* 减小圆角 */
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4), 0 4px 10px rgba(0, 0, 0, 0.25) !important; /* 增强阴影 */
  border: 1px solid rgba(255, 255, 255, 0.405) !important;
  overflow: hidden !important;
  animation: card-appear 0.25s ease-out !important;
  /* 使用深沉但有活力的背景色 - 深红棕色调，参考图片 */
  background: #2e2218 !important; /* 使用纯色背景，避免半透明效果 */
  backdrop-filter: none !important; /* 移除模糊效果 */
  -webkit-backdrop-filter: none !important; /* 移除模糊效果 */
  opacity: 1 !important; /* 确保不透明 */
}

/* 悬浮卡片动画效果 */
.apple-style-hover-card {
  animation: card-appear 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  transform-origin: var(--radix-hover-card-content-transform-origin);
  will-change: transform, opacity;
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

@keyframes card-appear {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3) !important;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
  }
}

/* 悬浮卡片消失动画 */
.apple-style-hover-card[data-state="closed"] {
  animation: card-disappear 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
  pointer-events: none !important;
}

@keyframes card-disappear {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
  }
  100% {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3) !important;
  }
}

.user-hover-card-content {
  padding: 0;
  /* 内容区域不需要额外背景色，使用卡片的背景色 */
}

:deep(.user-info-header) {
  display: flex;
  align-items: center;
  padding: 12px 16px !important; /* 减少内边距使布局更紧密 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: #2a1a18 !important; /* 使用纯色背景 */
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.15) !important; /* 添加微妙阴影 */
}

/* 新的水平布局用户信息行 */
.user-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 新的小尺寸用户名 */
.user-name-small {
  font-size: 0.85rem !important; /* 减小字体大小 */
  font-weight: 600 !important;
  color: var(--color-text-white) !important;
  letter-spacing: 0.01em !important; /* 统一字间距 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important; /* 添加文字阴影 */
}

.user-focus-time {
  display: flex;
  align-items: center;
  font-size: 0.8rem !important; /* 减小字体大小 */
  color: var(--color-text-yellow) !important; /* 使用黄色，与图片一致 */
  letter-spacing: 0.01em !important; /* 统一字间距 */
  opacity: 0.9 !important;
}

.focus-icon {
  margin-right: 3px;
  font-size: 0.75rem;
  color: var(--color-text-yellow);
  opacity: 0.9;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
}

.loading-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-text-yellow);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 6px;
}

.loading-container p {
  font-size: 0.7rem;
  color: var(--color-text-gray);
  margin: 0;
  opacity: 0.8;
}

:deep(.user-tasks-container) {
  padding: 12px 16px !important; /* 减少内边距使布局更紧密 */
  background-color: #2a1a18 !important; /* 使用纯色背景 */
}

:deep(.current-task) {
  margin-bottom: 10px !important;
}

:deep(.task-header) {
  display: flex !important;
  align-items: center !important;
  margin-bottom: 6px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding-bottom: 5px !important;
}

:deep(.task-icon) {
  font-size: 0.85rem !important;
  margin-right: 6px !important;
  opacity: 0.9 !important;
  color: var(--color-text-yellow) !important;
}

:deep(.task-title) {
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  color: var(--color-text-white) !important;
  opacity: 0.9 !important;
  letter-spacing: 0.01em !important; /* 统一字间距 */
}

:deep(.task-item) {
  background-color: rgba(255, 255, 255, 0.05) !important; /* 稍微亮一点的背景 */
  border-radius: 4px !important; /* 减小圆角 */
  padding: 8px 10px !important; /* 减少内边距使布局更紧密 */
  margin-bottom: 6px !important; /* 减少下边距使布局更紧密 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important; /* 增强阴影 */
  transition: all 0.2s ease !important; /* 添加过渡效果 */
  border: 1px solid rgba(255, 255, 255, 0.08) !important; /* 添加边框 */
}

:deep(.task-item:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important; /* 悬停时稍微亮一点 */
  transform: translateY(-1px) !important; /* 悬停时微微上浮 */
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25) !important; /* 悬停时增强阴影 */
}

:deep(.task-content) {
  display: flex !important;
  flex-direction: column !important;
}

:deep(.task-name) {
  font-size: 0.85rem !important; /* 统一字体大小 */
  font-weight: 500 !important;
  color: var(--color-text-white) !important;
  margin-bottom: 4px !important; /* 减少下边距使布局更紧密 */
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  letter-spacing: 0.01em !important; /* 统一字间距 */
}

:deep(.task-start-time) {
  font-size: 0.8rem !important; /* 统一字体大小 */
  color: var(--color-text-yellow) !important; /* 使用黄色，与图片一致 */
  display: flex !important;
  align-items: center !important;
  opacity: 0.85 !important;
}

:deep(.completed-tasks) {
  margin-top: 8px !important;
}

:deep(.completed-list) {
  list-style: none !important;
  padding: 0 !important;
  margin: 6px 0 0 0 !important; /* 减少上边距使布局更紧密 */
  max-height: 120px !important; /* 减少最大高度使布局更紧密 */
  overflow-y: auto !important;
  scrollbar-width: thin !important;
  background-color: rgba(0, 0, 0, 0.15) !important; /* 添加微妙背景色 */
  border-radius: 4px !important; /* 减小圆角 */
  padding: 4px 6px !important; /* 减少内边距使布局更紧密 */
  border: 1px solid rgba(255, 255, 255, 0.05) !important; /* 添加边框 */
}

:deep(.completed-list::-webkit-scrollbar) {
  width: 3px !important;
}

:deep(.completed-list::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 3px !important;
}

:deep(.completed-list::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  border-radius: 3px !important;
}

:deep(.completed-item) {
  display: flex !important;
  align-items: center !important;
  padding: 4px 3px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: background-color 0.2s ease !important;
}

:deep(.completed-item:hover) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.completed-item:last-child) {
  border-bottom: none !important;
}

:deep(.task-dot) {
  width: 4px !important;
  height: 4px !important;
  border-radius: 50% !important;
  background-color: var(--color-text-yellow) !important;
  margin-right: 6px !important;
  opacity: 0.8 !important;
}

:deep(.completed-name) {
  font-size: 0.8rem !important;
  color: var(--color-text-white) !important;
  opacity: 0.9 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  letter-spacing: 0.01em !important; /* 统一字间距 */
}

:deep(.no-tasks) {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 10px 0 !important;
  background-color: rgba(255, 255, 255, 0.03) !important;
  border-radius: 4px !important;
  margin: 6px 0 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important; /* 添加边框 */
}

:deep(.no-tasks p) {
  font-size: 0.8rem !important;
  color: var(--color-text-gray) !important;
  margin: 0 !important;
  text-align: center !important;
  font-style: italic !important;
  letter-spacing: 0.01em !important; /* 统一字间距 */
}

@media (max-width: 480px) {
  .card-title {
    font-size: 1rem;
  }

  .user-item {
    padding: 8px 12px;
  }

  .avatar-circle {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .user-hover-card {
    width: 280px;
  }

  .user-hover-header {
    padding: 16px;
  }

  .user-hover-details {
    padding: 12px 16px 16px;
  }
}
</style>
