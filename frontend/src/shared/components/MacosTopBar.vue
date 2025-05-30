<template>
  <div class="macos-top-bar">
    <div class="left-section">
      <!-- Logo with Icon -->
      <a href="https://www.korsonedu.com" target="_blank" class="app-logo">
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-text-cn">科晟智慧</span>
          <span class="logo-text-en">KORSON ACADEMY</span>
        </div>
      </a>

      <!-- App Menu Items -->
      <div class="app-menu">
        <router-link to="/" class="menu-item" :class="{ 'active': isCurrentApp('study') }">
          <span class="menu-icon">📚</span>
          <span class="menu-text">学习追踪</span>
        </router-link>
        <a href="#" class="menu-item disabled">
          <span class="menu-icon">🎓</span>
          <span class="menu-text">课程系统</span>
        </a>
        <a href="#" class="menu-item disabled">
          <span class="menu-icon">🏆</span>
          <span class="menu-text">排行榜</span>
        </a>
        <a href="#" class="menu-item disabled">
          <span class="menu-icon">📝</span>
          <span class="menu-text">题库系统</span>
        </a>
      </div>
    </div>

    <div class="right-section">
      <!-- Login/Register Buttons (if not logged in) -->
      <div v-if="!isLoggedIn" class="auth-buttons">
        <router-link to="/login" class="auth-button login-button">登录</router-link>
        <router-link to="/register" class="auth-button register-button">注册</router-link>
      </div>

      <!-- Current Date and Time (仅在非移动设备上显示) -->
      <div class="datetime desktop-only">
        <span>{{ currentDateTime }}</span>
      </div>

      <!-- User Menu (if logged in) -->
      <div v-if="isLoggedIn" class="user-menu" @click.stop="toggleUserDropdown">
        <div class="user-avatar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="username">{{ username }}</span>
        <div class="dropdown-indicator">▾</div>

        <!-- Dropdown Menu -->
        <div v-if="showUserDropdown" class="user-dropdown">
          <div class="dropdown-item" @click.stop="goToProfile">
            <span class="dropdown-icon">👤</span>
            <span>个人资料</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click.stop="handleLogout">
            <span class="dropdown-icon">🚪</span>
            <span>退出登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 确认对话框 -->
  <ConfirmDialog
    :show="showConfirmDialog"
    :title="confirmDialogTitle"
    :message="confirmDialogMessage"
    @confirm="confirmLogout"
    @cancel="cancelLogout"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/userStore';
import apiService from '../../shared/services/apiService';
import { API_CONFIG } from '../../config';
import ConfirmDialog from './ConfirmDialog.vue';

const router = useRouter();
const userStore = useUserStore();
const currentDateTime = ref('');
const showUserDropdown = ref(false);
let clockInterval: number | null = null;

// 确认对话框状态
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('退出登录');
const confirmDialogMessage = ref('确定要退出登录吗？');

// 计算属性：是否已登录
const isLoggedIn = computed(() => {
  // 使用Pinia用户存储检查登录状态
  const loggedIn = userStore.isLoggedIn;
  console.log('MacosTopBar - userStore.isLoggedIn:', loggedIn);
  return loggedIn;
});

// 计算属性：用户名
const username = computed(() => {
  // 使用Pinia用户存储获取用户名
  const name = userStore.username;
  console.log('MacosTopBar - userStore.username:', name);
  return name || '';
});

// 更新当前日期和时间
const updateDateTime = () => {
  const now = new Date();

  // 格式化日期和时间 - 使用中文格式
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');

  // 获取星期几
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[now.getDay()];

  // 组合成最终格式
  currentDateTime.value = `${month}月${day}日 ${weekday} ${hour}:${minute}`;
};

// 判断当前应用
const isCurrentApp = (appName: string) => {
  // 根据路由判断当前应用
  if (appName === 'study') {
    return true; // 目前只有学习追踪应用
  }
  return false;
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
  router.push('/profile');
};

// 退出登录
const handleLogout = () => {
  console.log('退出登录 - 开始');
  console.log('showConfirmDialog 之前:', showConfirmDialog.value);

  // 关闭用户下拉菜单
  showUserDropdown.value = false;

  // 显示确认对话框
  showConfirmDialog.value = true;
  confirmDialogTitle.value = '退出登录';
  confirmDialogMessage.value = '确定要退出登录吗？';

  console.log('showConfirmDialog 之后:', showConfirmDialog.value);
  console.log('退出登录 - 结束');
};

// 确认退出登录
const confirmLogout = async () => {
  console.log('确认退出登录 - 开始');

  try {
    // 使用Pinia用户存储登出
    await userStore.logout();

    console.log('用户已登出，状态已重置');

    // 隐藏确认对话框
    showConfirmDialog.value = false;

    console.log('确认退出登录 - 结束，即将重定向到登录页面');

    // 使用setTimeout确保日志能显示完成
    setTimeout(() => {
      // 强制清除所有可能的存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('username');

      // 使用router.push可能会被拦截，所以直接修改location
      window.location.href = '/login';
    }, 300);
  } catch (error) {
    console.error('退出登录时发生错误:', error);
    showConfirmDialog.value = false;

    // 即使出错也尝试重定向到登录页面
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  }
};

// 取消退出登录
const cancelLogout = () => {
  console.log('取消退出登录');

  // 隐藏确认对话框
  showConfirmDialog.value = false;
};


// 组件挂载时
onMounted(() => {
  // 立即更新一次时间
  updateDateTime();

  // 计算到下一分钟的毫秒数
  const now = new Date();
  const nextMinute = new Date(now);
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);
  const delay = nextMinute.getTime() - now.getTime();

  // 首先设置一个定时器，在下一分钟整点触发
  setTimeout(() => {
    // 更新时间
    updateDateTime();

    // 然后设置每分钟更新一次的定时器
    clockInterval = window.setInterval(updateDateTime, 60000);
  }, delay);

  // 添加点击事件监听器
  document.addEventListener('click', closeUserDropdown);
});

// 组件卸载时
onUnmounted(() => {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  document.removeEventListener('click', closeUserDropdown);
});
</script>

<style scoped>
.macos-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 38px;
  background: #0a3d62; /* 深海军蓝 - 按用户要求 */
  color: white;
  font-size: 13px;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.left-section, .right-section {
  display: flex;
  align-items: center;
}

.app-logo {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-right: 24px;
  color: white;
  position: relative;
  padding-right: 2px;
  transition: all 0.2s ease;
  text-decoration: none; /* 移除下划线 */
}

.app-logo:hover {
  opacity: 0.9;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.logo-text-cn {
  font-size: 15px;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.logo-text-en {
  font-size: 10px;
  letter-spacing: 0.5px;
  opacity: 0.85;
  margin-top: 2px;
}

.logo-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: #1890ff;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.app-logo:hover .logo-icon {
  opacity: 0.9;
}

.app-menu {
  display: flex;
  gap: 12px;
}

.menu-item {
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  padding: 0 10px;
  height: 30px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  gap: 6px;
  position: relative;
  font-weight: 500;
}

.menu-icon {
  font-size: 14px;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.active {
  color: white;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.1);
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 2px;
  background-color: #1890ff;
  transform: translateX(-50%);
}

.menu-item.disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.auth-buttons {
  display: flex;
  gap: 8px;
  margin-right: 16px;
}

.auth-button {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.login-button {
  color: white;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.register-button {
  color: white;
  background-color: #1890ff;
  border: none;
}

.register-button:hover {
  background-color: #40a9ff;
}

.datetime {
  display: flex;
  align-items: center;
  margin-right: 16px;
  color: rgba(255, 255, 255, 0.85);
  padding: 0 10px;
  height: 24px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 12px;
}

.datetime:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: white;
}

.datetime-icon {
  font-size: 12px;
  opacity: 0.8;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
  padding: 0 12px;
  height: 30px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1));
  border: 1px solid rgba(52, 152, 219, 0.15);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-menu:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.15));
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  border-color: rgba(52, 152, 219, 0.25);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.user-menu:hover .user-avatar {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(52, 152, 219, 0.4);
}

.dropdown-indicator {
  font-size: 10px;
  opacity: 0.7;
}

.username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(135deg, rgba(23, 32, 42, 0.95), rgba(44, 62, 80, 0.95));
  backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(52, 152, 219, 0.2);
  min-width: 200px;
  margin-top: 8px;
  overflow: hidden;
  z-index: 1001;
  transform-origin: top right;
  animation: dropdown-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(52, 152, 219, 0.15);
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dropdown-item {
  padding: 10px 16px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-icon {
  font-size: 14px;
  opacity: 0.8;
}

.dropdown-item:hover {
  background: rgba(59, 130, 246, 0.15);
}

.dropdown-divider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

/* 桌面专用元素 */
.desktop-only {
  display: flex;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .macos-top-bar {
    padding: 0 10px;
  }

  .logo-text-en {
    display: none;
  }

  .menu-text {
    display: none;
  }

  .menu-item {
    padding: 0 8px;
  }

  .auth-button {
    padding: 4px 8px;
    font-size: 12px;
  }

  .desktop-only {
    display: none; /* 在平板和手机上隐藏桌面专用元素 */
  }
}

@media (max-width: 480px) {
  .macos-top-bar {
    height: 44px;
    padding: 0 8px;
  }

  .app-menu {
    gap: 2px;
  }

  .menu-item {
    padding: 0 6px;
  }

  .menu-icon {
    font-size: 16px;
  }

  .menu-text {
    display: none; /* 在手机竖屏下隐藏菜单文字，只显示emoji */
  }

  .logo-text {
    display: none; /* 在手机竖屏下隐藏logo文字 */
  }

  .username {
    display: none;
  }

  .dropdown-indicator {
    display: none;
  }

  .user-menu {
    padding: 0 8px;
    height: 28px;
  }

  .user-avatar {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .auth-buttons {
    margin-right: 6px;
  }

  .auth-button {
    padding: 3px 6px;
    font-size: 11px;
  }
}
</style>
