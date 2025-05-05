<template>
  <div class="macos-top-bar">
    <div class="left-section">
      <!-- Logo with Icon -->
      <div class="app-logo">
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span>科晟智慧</span>
      </div>

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

      <!-- Current Date and Time -->
      <div class="datetime">
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
import { userService } from '../../shared/services/userService';
import { authService } from '../../shared/services/authService';
import apiService from '../../shared/services/apiService';
import { API_CONFIG } from '../../config';
import ConfirmDialog from './ConfirmDialog.vue';

const router = useRouter();
const currentDateTime = ref('');
const showUserDropdown = ref(false);
let clockInterval: number | null = null;

// 确认对话框状态
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('退出登录');
const confirmDialogMessage = ref('确定要退出登录吗？');

// 计算属性：是否已登录
const isLoggedIn = computed(() => {
  // 优先使用 authService，如果 authService 显示未登录，则检查 userService
  const authLoggedIn = authService.isLoggedIn.value;
  const userLoggedIn = userService.isLoggedIn.value;
  console.log('MacosTopBar - authService.isLoggedIn:', authLoggedIn);
  console.log('MacosTopBar - userService.isLoggedIn:', userLoggedIn);
  return authLoggedIn || userLoggedIn;
});

// 计算属性：用户名
const username = computed(() => {
  // 优先使用 authService 的用户名，如果没有则使用 userService 的用户名
  const authUsername = authService.currentUser.value?.username;
  const userUsername = userService.currentUser.value?.username;
  console.log('MacosTopBar - authService.username:', authUsername);
  console.log('MacosTopBar - userService.username:', userUsername);
  return authUsername || userUsername || '';
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
  console.log('showConfirmDialog 之后:', showConfirmDialog.value);
  console.log('退出登录 - 结束');
};

// 确认退出登录
const confirmLogout = () => {
  console.log('确认退出登录 - 开始');

  try {
    // 清除所有本地存储
    console.log('清除localStorage前:', Object.keys(localStorage));
    localStorage.clear();
    console.log('清除localStorage后:', Object.keys(localStorage));
    
    console.log('清除sessionStorage前:', Object.keys(sessionStorage));
    sessionStorage.clear();
    console.log('清除sessionStorage后:', Object.keys(sessionStorage));

    // 清除所有cookie
    console.log('清除cookies前:', document.cookie);
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        console.log('清除cookie:', name);
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    }
    console.log('清除cookies后:', document.cookie);

    // 重置服务状态
    console.log('重置authService前:', authService.currentUser.value);
    if (authService && authService.currentUser) {
      authService.currentUser.value = null;
    }
    console.log('重置authService后:', authService.currentUser.value);
    
    console.log('重置userService前:', userService.currentUser.value);
    if (userService && userService.currentUser) {
      userService.currentUser.value = null;
    }
    console.log('重置userService后:', userService.currentUser.value);

    // 隐藏确认对话框
    showConfirmDialog.value = false;
    
    console.log('确认退出登录 - 结束，即将重定向到登录页面');
    
    // 使用setTimeout确保日志能显示完成
    setTimeout(() => {
      // 重定向到登录页面
      window.location.href = '/login';
    }, 500);
  } catch (error) {
    console.error('退出登录时发生错误:', error);
    showConfirmDialog.value = false;
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
  background: linear-gradient(135deg, rgba(23, 32, 42, 0.95), rgba(44, 62, 80, 0.95));
  backdrop-filter: blur(15px);
  color: white;
  font-size: 13px;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.left-section, .right-section {
  display: flex;
  align-items: center;
}

.app-logo {
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-right: 28px;
  font-size: 14px;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.95);
  position: relative;
  padding-right: 2px;
  transition: all 0.3s ease;
}

.app-logo:hover {
  transform: scale(1.02);
  color: #3498db;
}

.logo-icon {
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.app-logo:hover .logo-icon {
  transform: rotate(10deg);
  box-shadow: 0 3px 8px rgba(52, 152, 219, 0.4);
}

.app-menu {
  display: flex;
  gap: 16px;
}

.menu-item {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: all 0.3s ease;
  transform: translateX(-50%);
  opacity: 0;
}

.menu-icon {
  font-size: 14px;
  opacity: 0.9;
}

.menu-item:hover {
  background-color: rgba(59, 130, 246, 0.15);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.menu-item:hover::before {
  width: 80%;
  opacity: 1;
}

.menu-item.active {
  color: white;
  font-weight: 500;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.2), rgba(41, 128, 185, 0.2));
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.25);
}

.menu-item.active::before {
  width: 90%;
  opacity: 1;
  background: linear-gradient(90deg, #3498db, #2ecc71);
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
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.auth-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.4s ease;
  z-index: -1;
}

.auth-button:hover::before {
  left: 0;
}

.login-button {
  color: white;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
}

.login-button:hover {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

.register-button {
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
}

.register-button:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.4);
}

.datetime {
  display: flex;
  align-items: center;
  margin-right: 16px;
  color: rgba(255, 255, 255, 0.9);
  gap: 8px;
  padding: 0 12px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1));
  border: 1px solid rgba(52, 152, 219, 0.2);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.datetime:hover {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.15), rgba(41, 128, 185, 0.15));
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .app-logo span {
    display: none;
  }

  .menu-text {
    display: none;
  }

  .datetime span {
    display: none;
  }

  .menu-item {
    padding: 0 8px;
  }

  .auth-button {
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .app-menu {
    gap: 4px;
  }

  .username {
    display: none;
  }

  .dropdown-indicator {
    display: none;
  }

  .auth-buttons {
    margin-right: 8px;
  }

  .datetime {
    margin-right: 8px;
  }
}
</style>
