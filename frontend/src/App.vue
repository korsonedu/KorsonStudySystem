<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from './apps/study/components/NavBar.vue'
import MacosTopBar from './shared/components/MacosTopBar.vue'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/userStore'
import { useOnlineUsersStore } from '@/stores/onlineUsersStore'

// 为Window对象添加全局WebSocket连接属性
declare global {
  interface Window {
    __websocketConnection: WebSocket | null;
  }
}

// 初始化全局WebSocket连接
if (typeof window !== 'undefined' && window.__websocketConnection === undefined) {
  window.__websocketConnection = null;
}

// 使用状态存储
const userStore = useUserStore()
const onlineUsersStore = useOnlineUsersStore()
const route = useRoute()
const router = useRouter()

// 计算属性：是否显示应用内导航栏
const showAppNavBar = computed(() => {
  // 在登录和注册页面不显示应用内导航栏
  return !['login', 'register'].includes(route.name as string)
})

// 计算属性：是否显示顶部状态栏
const showTopBar = computed(() => {
  // 在所有页面都显示顶部状态栏
  return true
})

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, (isLoggedIn, oldValue) => {
  console.log('App.vue - 用户登录状态变化:', isLoggedIn, '之前状态:', oldValue)

  if (isLoggedIn) {
    // 用户登录后，连接WebSocket
    console.log('App.vue - 用户已登录，连接WebSocket')
    // 延迟一点连接，确保token已经保存到localStorage
    setTimeout(() => {
      onlineUsersStore.connect()
    }, 500)
  } else if (oldValue) { // 只有在之前是登录状态时才执行清理
    // 用户登出后，断开WebSocket
    console.log('App.vue - 用户已登出，断开WebSocket')
    onlineUsersStore.cleanup()

    // 如果有全局WebSocket连接，确保关闭
    if (window.__websocketConnection) {
      try {
        window.__websocketConnection.close(1000, 'user_logout')
        window.__websocketConnection = null
      } catch (e) {
        console.error('关闭WebSocket连接失败:', e)
      }
    }
  }
}, { immediate: true })

// 处理认证失败事件
const handleAuthUnauthorized = (event: CustomEvent) => {
  console.log('App.vue - 收到认证失败事件:', event.detail)

  // 清除用户状态
  userStore.clearAuthState()

  // 显示通知
  toast.error('登录已过期，请重新登录', {
    description: '您的登录状态已失效，请重新登录以继续使用系统',
    duration: 5000,
  })

  // 如果当前不在登录页，重定向到登录页
  if (route.name !== 'login') {
    router.push('/login')
  }
}

// 初始化时检查用户状态
onMounted(async () => {
  console.log('App.vue - App mounted')

  // 初始化用户状态
  userStore.init()

  // 检查用户是否已登录
  if (userStore.isLoggedIn) {
    console.log('App.vue - User is logged in:', userStore.username)
  } else {
    console.log('App.vue - User is not logged in')
  }

  // 监听认证失败事件
  window.addEventListener('auth:unauthorized', handleAuthUnauthorized as EventListener)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('auth:unauthorized', handleAuthUnauthorized as EventListener)
})
</script>

<template>
  <Toaster position="top-right" />
  <div class="app-wrapper">
    <!-- macOS风格顶部状态栏 -->
    <MacosTopBar v-if="showTopBar" />

    <div class="content-wrapper">
      <!-- 应用内导航栏 -->
      <NavBar v-if="showAppNavBar" />

      <!-- 主内容区域 -->
      <div class="container">
        <router-view />
      </div>
    </div>


  </div>
</template>

<style>
/*
 * 注意：主要的CSS变量已经移至 variables.css
 * 这里只保留一些特定于App.vue的兼容性变量
 */
:root {
  /* 兼容旧变量 */
  --text-color: var(--color-text-white);
  --text-light: var(--color-text-gray);
  --border-radius: var(--radius-md);
  --box-shadow: var(--shadow-card);
  --card-bg: var(--color-card-gray);
  --bg-color: var(--color-dark-gray);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--color-dark-gray);
  color: var(--color-text-white);
  line-height: 1.6;
  min-height: 100vh;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-wrapper {
  flex: 1;
  margin-top: 28px; /* 顶部状态栏的高度 */
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.router-link-active {
  background: var(--color-text-yellow);
  color: var(--color-dark-gray);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }
}
</style>
