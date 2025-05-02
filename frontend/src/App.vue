<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './apps/study/components/NavBar.vue'
import MacosTopBar from './shared/components/MacosTopBar.vue'
import { authService } from './shared/services/authService'

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
onMounted(() => {
  // 检查用户登录状态
  authService.checkAuth()

  // 如果有令牌，尝试获取当前用户信息
  if (authService.isLoggedIn.value) {
    authService.getCurrentUser()
      .then(user => {
        if (user) {
          console.log('Current user loaded:', user)
        }
      })
      .catch(err => {
        console.error('Error loading current user:', err)
      })
  }
})
</script>

<template>
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
</style>
