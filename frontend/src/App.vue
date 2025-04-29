<script setup lang="ts">
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { userService } from './services/userService'

// 初始化时检查用户状态
onMounted(() => {
  // 检查用户登录状态
  userService.checkAuth()

  // 如果有令牌，尝试获取当前用户信息
  if (userService.isLoggedIn.value) {
    userService.getCurrentUser()
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
  <div class="container">
    <NavBar />
    <router-view />
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

.container {
  max-width: 1400px; /* 增加最大宽度从1200px到1400px */
  margin: 0 auto;
  padding: 20px;
}

.router-link-active {
  background: var(--primary-color);
  color: white;
}
</style>
