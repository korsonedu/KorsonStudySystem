<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

// 组件属性
const props = defineProps<{
  totalSeconds: number;
  isRunning: boolean;
}>();

// 事件
const emit = defineEmits<{
  (e: 'timeUp'): void;
}>();

// 计算属性
const progress = computed(() => {
  // 假设默认总时间是25分钟
  const defaultTotal = 25 * 60;
  const total = props.totalSeconds > 0 ? props.totalSeconds : defaultTotal;
  return (1 - props.totalSeconds / total) * 100;
});

// 格式化时间
const formattedTime = computed(() => {
  const minutes = Math.floor(props.totalSeconds / 60);
  const seconds = props.totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// 计算圆环路径
const radius = 90; // 圆的半径
const circumference = 2 * Math.PI * radius;

// 计算圆环描边长度
const strokeDashoffset = computed(() => {
  return circumference - (progress.value / 100) * circumference;
});

// 监听时间变化
watch(() => props.totalSeconds, (newValue) => {
  if (newValue <= 0 && props.isRunning) {
    emit('timeUp');
  }
});

// 计算颜色
const timerColor = computed(() => {
  // 根据剩余时间变化颜色
  const ratio = props.totalSeconds / (25 * 60); // 假设默认是25分钟
  if (ratio > 0.6) return '#4CAF50'; // 绿色
  if (ratio > 0.3) return '#FFC107'; // 黄色
  return '#F44336'; // 红色
});
</script>

<template>
  <div class="circular-timer">
    <svg class="timer-svg" viewBox="0 0 200 200">
      <!-- 背景圆 -->
      <circle
        class="timer-circle-bg"
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="#e0e0e0"
        stroke-width="8"
      />
      
      <!-- 进度圆 -->
      <circle
        class="timer-circle-progress"
        cx="100"
        cy="100"
        r="90"
        fill="none"
        :stroke="timerColor"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        transform="rotate(-90 100 100)"
      />
      
      <!-- 时间文本 -->
      <text
        x="100"
        y="110"
        text-anchor="middle"
        class="timer-text"
        :fill="timerColor"
      >
        {{ formattedTime }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.circular-timer {
  position: relative;
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.timer-svg {
  width: 100%;
  height: auto;
}

.timer-circle-bg {
  opacity: 0.3;
}

.timer-circle-progress {
  transition: stroke-dashoffset 0.5s ease;
}

.timer-text {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
}

@media (max-width: 480px) {
  .circular-timer {
    max-width: 150px;
  }
  
  .timer-text {
    font-size: 20px;
  }
}
</style>
