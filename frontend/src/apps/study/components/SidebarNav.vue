<template>
  <div class="sidebar-container" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-backdrop" @click="closeSidebar"></div>
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>导航菜单</h3>
        <button class="close-btn" @click="closeSidebar">×</button>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="sidebar-nav-btn" :class="{ 'router-link-active': $route.path === '/' || $route.path === '/study' }" @click="closeSidebar">
          <span class="sidebar-nav-icon">🍅</span>
          <span class="sidebar-nav-text">番茄钟</span>
        </router-link>
        <router-link to="/statistics" class="sidebar-nav-btn" @click="closeSidebar">
          <span class="sidebar-nav-icon">📈</span>
          <span class="sidebar-nav-text">统计</span>
        </router-link>
        <router-link to="/achievements" class="sidebar-nav-btn" @click="closeSidebar">
          <span class="sidebar-nav-icon">🏅</span>
          <span class="sidebar-nav-text">成就</span>
        </router-link>
        <button class="sidebar-nav-btn" @click="showPosterAndClose">
          <span class="sidebar-nav-icon">🖼️</span>
          <span class="sidebar-nav-text">下载海报</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'show-poster']);

const closeSidebar = () => {
  emit('close');
};

const showPosterAndClose = () => {
  emit('show-poster');
  closeSidebar();
};
</script>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1001;
  pointer-events: none;
  transition: all var(--transition-normal) ease;
  opacity: 0;
}

.sidebar-container.sidebar-open {
  opacity: 1;
  pointer-events: auto;
}

.sidebar-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 80%;
  max-width: 300px;
  height: 100%;
  background-color: rgba(42, 54, 65, 0.95);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  transform: translateX(-100%);
  transition: transform var(--transition-normal) ease;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(74, 106, 138, 0.3);
}

.sidebar-open .sidebar {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(74, 106, 138, 0.3);
}

.sidebar-header h3 {
  margin: 0;
  color: var(--color-text-white);
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background-color: rgba(74, 106, 138, 0.2);
  border: 1px solid rgba(74, 106, 138, 0.3);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 20px;
  cursor: pointer;
  color: var(--color-text-white);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast) ease;
}

.close-btn:hover {
  background-color: rgba(218, 88, 78, 0.2);
  border-color: rgba(218, 88, 78, 0.4);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  overflow-y: auto;
}

.sidebar-nav-btn {
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 10px;
  color: var(--color-text-white);
  font-weight: 500;
  transition: all var(--transition-fast) ease;
  background-color: rgba(74, 106, 138, 0.1);
  border: 1px solid rgba(74, 106, 138, 0.3);
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.3px;
}

.sidebar-nav-btn:hover {
  background-color: rgba(74, 106, 138, 0.2);
  border-color: rgba(74, 106, 138, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(74, 106, 138, 0.2);
}

.router-link-active.sidebar-nav-btn {
  background-color: rgba(102, 205, 170, 0.2);
  color: var(--color-text-white);
  border-color: rgba(102, 205, 170, 0.5);
  box-shadow: 0 4px 10px rgba(102, 205, 170, 0.15);
  font-weight: 600;
}

.sidebar-nav-icon {
  font-size: 1.2rem;
  margin-right: 12px;
}

.sidebar-nav-text {
  flex: 1;
}
</style>
