<template>
  <div class="macos-top-bar">
    <div class="left-section">
      <!-- Logo -->
      <div class="app-logo">
        <span>Korson</span>
      </div>

      <!-- App Menu Items -->
      <div class="app-menu">
        <router-link to="/" class="menu-item" :class="{ 'active': isCurrentApp('study') }">
          学习追踪
        </router-link>
        <router-link to="/course" class="menu-item" :class="{ 'active': isCurrentApp('course') }">
          课程系统
        </router-link>
        <router-link to="/leaderboard" class="menu-item" :class="{ 'active': isCurrentApp('leaderboard') }">
          排行榜
        </router-link>
        <router-link to="/quiz" class="menu-item" :class="{ 'active': isCurrentApp('quiz') }">
          题库系统
        </router-link>
      </div>
    </div>

    <div class="right-section">
      <!-- Current Date and Time -->
      <div class="datetime">
        {{ currentDateTime }}
      </div>

      <!-- User Menu (if logged in) -->
      <div v-if="isLoggedIn" class="user-menu" @click="toggleUserDropdown">
        <span class="username">{{ username }}</span>
        <div class="user-icon">👤</div>

        <!-- Dropdown Menu -->
        <div v-if="showUserDropdown" class="user-dropdown">
          <div class="dropdown-item" @click="goToProfile">个人资料</div>
          <div class="dropdown-item" @click="logout">退出登录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../../shared/services/authService';

const router = useRouter();
const currentDateTime = ref('');
const showUserDropdown = ref(false);
let clockInterval: number | null = null;

// 计算属性：是否已登录
const isLoggedIn = computed(() => authService.isLoggedIn.value);

// 计算属性：用户名
const username = computed(() => authService.currentUser.value?.username || '');

// 更新当前日期和时间
const updateDateTime = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  currentDateTime.value = now.toLocaleDateString('zh-CN', options);
};

// 判断当前应用
const isCurrentApp = (appName: string) => {
  const path = router.currentRoute.value.path;

  // 根据路由路径判断当前应用
  switch (appName) {
    case 'study':
      return path === '/' || path.startsWith('/statistics') || path.startsWith('/achievements');
    case 'course':
      return path.startsWith('/course');
    case 'leaderboard':
      return path.startsWith('/leaderboard');
    case 'quiz':
      return path.startsWith('/quiz');
    default:
      return false;
  }
};

// 切换用户下拉菜单
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
};

// 关闭用户下拉菜单（点击外部区域时）
const closeUserDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.user-menu')) {
    showUserDropdown.value = false;
  }
};

// 跳转到个人资料页面
const goToProfile = () => {
  showUserDropdown.value = false;
  // 暂时没有个人资料页面，可以根据需要添加
  // router.push('/profile');
};

// 退出登录
const logout = async () => {
  await authService.logout();
  showUserDropdown.value = false;
  router.push('/login');
};

// 组件挂载时
onMounted(() => {
  updateDateTime();
  // 每分钟更新一次时间
  clockInterval = window.setInterval(updateDateTime, 60000);
  // 添加点击事件监听器
  document.addEventListener('click', closeUserDropdown);
});

// 组件卸载时
onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  document.removeEventListener('click', closeUserDropdown);
});
</script>

<style scoped>
.macos-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  background: rgba(40, 40, 40, 0.8);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 13px;
  padding: 0 15px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.left-section, .right-section {
  display: flex;
  align-items: center;
}

.app-logo {
  font-weight: bold;
  margin-right: 20px;
  font-size: 14px;
}

.app-menu {
  display: flex;
  gap: 15px;
}

.menu-item {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0 8px;
  height: 28px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.active {
  color: white;
  font-weight: 500;
}

.menu-item.disabled {
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.datetime {
  margin-right: 15px;
  color: rgba(255, 255, 255, 0.8);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  position: relative;
  padding: 0 8px;
  height: 28px;
  border-radius: 4px;
}

.user-menu:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-icon {
  font-size: 14px;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(50, 50, 50, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 150px;
  margin-top: 5px;
  overflow: hidden;
  z-index: 1001;
}

.dropdown-item {
  padding: 10px 15px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-logo span {
    display: none;
  }

  .datetime {
    display: none;
  }

  .menu-item {
    padding: 0 5px;
  }
}

@media (max-width: 480px) {
  .app-menu {
    gap: 5px;
  }

  .username {
    display: none;
  }
}
</style>
