<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SimplePoster from './SimplePoster.vue'
import { userService } from '../services/userService'

const router = useRouter()
const showUserMenu = ref(false)
const showPosterModal = ref(false)
const generatedImageUrl = ref('')

// 使用用户服务的响应式状态
const username = computed(() => userService.currentUser.value?.username || '')
const isLoggedIn = computed(() => userService.isLoggedIn.value)

// 登出
const logout = async () => {
  await userService.logout()
  showUserMenu.value = false
  router.push('/login')
}

// 切换用户菜单显示状态
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// 显示海报生成模态框
const showPoster = () => {
  showPosterModal.value = true
  // 在下一个事件循环中触发自动生成
  setTimeout(() => {
    // 通过事件总线或其他方式触发自动生成
    window.dispatchEvent(new CustomEvent('auto-generate-poster'))
  }, 100)
}

// 处理海报生成完成事件
const handlePosterGenerated = (imageUrl: string) => {
  generatedImageUrl.value = imageUrl
}

// 监听点击事件，如果点击的不是用户菜单，则关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu') && !target.closest('.user-btn')) {
    showUserMenu.value = false
  }
}

// 添加点击事件监听器
document.addEventListener('click', handleClickOutside)
</script>

<template>
  <header class="navbar">
    <h1>学习看板 📋</h1>
    <div class="nav-container">
      <nav v-if="isLoggedIn">
        <router-link to="/" class="nav-btn">🍅 番茄钟</router-link>
        <router-link to="/statistics" class="nav-btn">📈 统计</router-link>
        <router-link to="/achievements" class="nav-btn">🏅 成就</router-link>
        <button class="nav-btn" @click="showPoster">🖼️ 下载海报</button>
      </nav>

      <!-- 用户菜单 -->
      <div v-if="isLoggedIn" class="user-container">
        <button class="nav-btn user-btn" @click="toggleUserMenu">
          <span class="username">{{ username }}</span>
          <span class="user-icon">👤</span>
        </button>

        <div v-if="showUserMenu" class="user-menu">
          <div class="menu-item" @click="logout">退出登录</div>
        </div>
      </div>

      <!-- 登录/注册按钮 -->
      <div v-else class="auth-buttons">
        <router-link to="/login" class="nav-btn">登录</router-link>
        <router-link to="/register" class="nav-btn">注册</router-link>
      </div>
    </div>

    <!-- 海报模态框 -->
    <Teleport to="body">
      <SimplePoster
        v-if="showPosterModal"
        :showModal="true"
        @close="showPosterModal = false"
        @generated="handlePosterGenerated"
      />
    </Teleport>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

h1 {
  color: var(--primary-color);
  font-size: 1.8em;
  margin: 0;
}

.nav-container {
  display: flex;
  align-items: center;
}

nav {
  display: flex;
  gap: 15px;
  align-items: center;
}

.nav-btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 20px;
  color: var(--text-color);
  font-weight: 500;
  transition: all 0.3s ease;
  background: rgba(52, 152, 219, 0.05);
  border: none;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: 38px;
}

.nav-btn:hover {
  background: rgba(52, 152, 219, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.15);
}

.router-link-active {
  background: var(--primary-color);
  color: white;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.user-container {
  position: relative;
  margin-left: 15px;
}

.user-btn {
  background: var(--primary-color);
  color: white;
}

.username {
  margin-right: 8px;
  font-weight: 500;
}

.user-icon {
  font-size: 1.2em;
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  min-width: 150px;
  z-index: 1000;
  animation: menuAppear 0.2s ease;
}

@keyframes menuAppear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.3s;
}

.menu-item:hover {
  background: rgba(0,0,0,0.05);
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.auth-buttons .nav-btn {
  background: var(--primary-color);
  color: white;
}

.auth-buttons .nav-btn:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .nav-container {
    width: 100%;
    justify-content: space-between;
  }

  nav {
    gap: 8px;
    flex-wrap: wrap;
  }

  .nav-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
    height: 34px;
  }
}

/* 小屏幕设备 */
@media (max-width: 480px) {
  nav {
    width: 100%;
    justify-content: space-between;
  }

  .nav-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .user-container {
    margin-top: 10px;
    margin-left: 0;
  }

  .auth-buttons {
    margin-top: 10px;
    width: 100%;
    justify-content: space-between;
  }

  .auth-buttons .nav-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
