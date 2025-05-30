<script setup lang="ts">
/**
 * 时间选择器组件
 * 用于切换统计视图（今日、本周、本月）
 */
// defineProps 和 defineEmits 是编译器宏，不需要导入

// 定义组件属性
const props = defineProps<{
  currentView: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'change', view: string): void;
}>();

// 切换视图
const switchView = (view: string) => {
  emit('change', view);
};
</script>

<template>
  <div class="time-selector">
    <button
      class="time-filter"
      :class="{ active: currentView === 'daily' }"
      @click="switchView('daily')"
    >
      今日
    </button>
    <button
      class="time-filter"
      :class="{ active: currentView === 'weekly' }"
      @click="switchView('weekly')"
    >
      本周
    </button>
    <button
      class="time-filter"
      :class="{ active: currentView === 'monthly' }"
      @click="switchView('monthly')"
    >
      本月
    </button>
  </div>
</template>

<style scoped>
.time-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.time-filter {
  background-color: rgba(74, 106, 138, 0.05);
  border: 1px solid rgba(74, 106, 138, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-light-gray);
  height: 36px;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-filter:hover {
  background-color: rgba(74, 106, 138, 0.1);
  transform: translateY(-1px);
  color: var(--color-text-white);
}

.time-filter.active {
  background-color: rgba(74, 106, 138, 0.2);
  color: var(--color-text-white);
  border-color: rgba(74, 106, 138, 0.4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 响应式布局 */
@media (max-width: 600px) {
  .time-selector {
    flex-wrap: wrap;
  }

  .time-filter {
    flex: 1;
    min-width: 80px;
  }
}
</style>
