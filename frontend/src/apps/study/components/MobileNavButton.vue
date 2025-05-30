<template>
  <button class="mobile-nav-button" @click="$emit('click')">
    <div class="hamburger">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </button>
</template>

<script setup lang="ts">
defineEmits(['click']);
</script>

<style scoped>
.mobile-nav-button {
  display: none;
  background-color: rgba(74, 106, 138, 0.1);
  border: 1px solid rgba(74, 106, 138, 0.3);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: all var(--transition-fast) ease;
  align-items: center;
  justify-content: center;
}

.mobile-nav-button:hover {
  background-color: rgba(74, 106, 138, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.hamburger {
  width: 20px;
  height: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--color-text-white);
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mobile-nav-button {
    display: flex;
  }
}
</style>
