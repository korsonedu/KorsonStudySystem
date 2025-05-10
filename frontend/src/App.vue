<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './apps/study/components/NavBar.vue'
import MacosTopBar from './shared/components/MacosTopBar.vue'
import { Toaster } from '@/components/ui/sonner'
import { useUserStore } from '@/stores/userStore'

// 使用用户状态存储
const userStore = useUserStore()
const route = useRoute()

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

    <!-- 番茄钟组件 -->
    <PomodoroTimer />
  </div>
</template>

<style>
:root {
  --primary-color: #3498db;
  --secondary-color: #2980b9;
  --accent-color: #f39c12;
  --success-color: #2ecc71;
  --danger-color: #e74c3c;
  --text-color: #2c3e50;
  --text-light: #7f8c8d;
  --bg-color: #f8f9fa;
  --card-bg: white;
  --border-radius: 12px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  line-height: 1.6;
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
  background: var(--primary-color);
  color: white;
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
