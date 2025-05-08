<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './apps/study/components/NavBar.vue'
import MacosTopBar from './shared/components/MacosTopBar.vue'
import { userService } from './shared/services/userService'
import { authService } from './shared/services/authService'

// 检查本地存储中的令牌 - 尝试多种可能的键名
function checkToken() {
  // 尝试多种可能的键名
  let token = localStorage.getItem('auth_token');
  if (!token) token = localStorage.getItem('token');

  // 如果找到令牌，确保它被正确存储在所有可能的键下
  if (token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);
    console.log('App.vue - Token found and synchronized across all keys');
    return token;
  }

  return null;
}

const token = checkToken();
console.log('App.vue - Token in localStorage:', token ? 'exists' : 'not found')

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

  // 再次检查令牌，确保它在所有可能的键下都存在
  const token = checkToken();

  if (token) {
    console.log('App.vue - Token exists, setting up authentication');

    // 确保用户名存在
    if (!localStorage.getItem('username')) {
      localStorage.setItem('username', 'user');
      console.log('App.vue - Username not found, using default: user');
    }

    // 强制更新认证状态
    authService.checkAuth();
    userService.checkAuth();

    console.log('App.vue - Auth service says user is logged in:', authService.isLoggedIn.value);
    console.log('App.vue - User service says user is logged in:', userService.isLoggedIn.value);

    // 尝试获取当前用户信息
    try {
      console.log('App.vue - Trying to get current user');
      const user = await authService.getCurrentUser();

      if (user) {
        console.log('App.vue - Current user loaded:', user);
      } else {
        console.log('App.vue - No user data returned, but continuing with token auth');
      }
    } catch (err) {
      console.error('App.vue - Error loading current user:', err);
      console.log('App.vue - Continuing with token auth despite error');
    }
  } else {
    console.log('App.vue - No token found, user not logged in');
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
