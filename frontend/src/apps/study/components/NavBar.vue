<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SimplePoster from './SimplePoster.vue'
import { userService } from '../../../shared/services/userService'

const router = useRouter()
const showPosterModal = ref(false)
const generatedImageUrl = ref('')

// 使用用户服务的响应式状态
const isLoggedIn = computed(() => userService.isLoggedIn.value)

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

// 不再需要监听点击事件，因为用户菜单已移至顶栏
</script>

<template>
  <header class="navbar">
    <h1>学习看板 📋</h1>
    <div class="nav-container">
      <nav v-if="isLoggedIn">
        <router-link to="/" class="nav-btn">📋 任务</router-link>
        <router-link to="/pomodoro" class="nav-btn">🍅 番茄钟</router-link>
        <router-link to="/statistics" class="nav-btn">📈 统计</router-link>
        <router-link to="/achievements" class="nav-btn">🏅 成就</router-link>
        <button class="nav-btn" @click="showPoster">🖼️ 下载海报</button>
      </nav>

      <!-- 用户菜单已移至顶栏 -->

      <!-- 不显示登录/注册按钮，这些按钮应该只在顶部MacOS栏中显示 -->
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
    gap: 12px;
    margin-bottom: 20px;
  }

  .nav-container {
    width: 100%;
  }

  nav {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .nav-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
    height: 36px;
    text-align: center;
    justify-content: center;
  }
}

/* 小屏幕设备 */
@media (max-width: 480px) {
  .navbar {
    margin-bottom: 15px;
    padding-bottom: 10px;
  }

  h1 {
    font-size: 1.5em;
  }

  nav {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .nav-btn {
    padding: 6px 8px;
    font-size: 0.8rem;
    height: 34px;
    border-radius: 16px;
  }
}
</style>
