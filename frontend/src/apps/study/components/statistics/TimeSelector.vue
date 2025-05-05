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
  gap: 15px;
  margin-bottom: 20px;
}

.time-filter {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.time-filter:hover {
  background: #f8f9fa;
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.time-filter.active {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
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
