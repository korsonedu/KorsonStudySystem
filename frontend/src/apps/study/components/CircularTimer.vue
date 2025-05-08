  <script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  totalSeconds: number
  isRunning: boolean
}>()

const emit = defineEmits(['timeUp'])

// 简单状态变量
const remainingSeconds = ref(props.totalSeconds)
let timerId: number | null = null

// 格式化时间显示
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 清除计时器
function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

// 启动计时器
function startTimer() {
  // 清除现有计时器
  clearTimer()

  // 记录开始时间和初始总秒数
  const startTime = Date.now()
  const initialSeconds = props.totalSeconds

  // 创建新计时器
  timerId = window.setInterval(() => {
    // 如果不在运行状态，清除计时器
    if (!props.isRunning) {
      clearTimer()
      return
    }

    // 计算剩余时间
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    const newRemaining = Math.max(initialSeconds - elapsedSeconds, 0)

    // 更新剩余时间
    remainingSeconds.value = newRemaining

    // 如果时间到了，触发完成事件
    if (newRemaining <= 0) {
      clearTimer()
      emit('timeUp')
    }
  }, 500)
}

// 监听totalSeconds变化
watch(() => props.totalSeconds, (newValue) => {
  remainingSeconds.value = newValue

  // 如果正在运行，重新启动计时器
  if (props.isRunning) {
    startTimer()
  }
})

// 监听isRunning变化
watch(() => props.isRunning, (isRunning) => {
  if (isRunning) {
    startTimer()
  } else {
    clearTimer()
  }
})

// 组件挂载时启动计时器
onMounted(() => {
  if (props.isRunning) {
    startTimer()
  }
})

// 组件卸载时清除计时器
onBeforeUnmount(clearTimer)
</script>

<template>
  <div class="edu-timer">
    <div class="timer-container" :class="{ 'running': props.isRunning }">
      <div class="timer-inner">
        <div class="time-display">{{ formatTime(remainingSeconds) }}</div>
        <div class="timer-status" :class="{ 'active': props.isRunning }">
          {{ props.isRunning ? 'ACTIVE' : 'STANDBY' }}
        </div>
      </div>
      <div class="timer-decoration"></div>
    </div>
  </div>
</template>

<style scoped>
.edu-timer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.timer-container {
  --text-weight: 0;
  position: relative;
  width: 320px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ffffff;
  border-radius: var(--border-radius);
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.06),
    0 1px 4px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: all 0.3s ease, box-shadow 0.5s ease, border-color 0.5s ease, background 0.5s ease, --text-weight 0.5s ease;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

@media (max-width: 480px) {
  .edu-timer {
    padding: 10px;
  }

  .timer-container {
    width: 280px;
    height: 140px;
  }

  .time-display {
    font-size: 3rem;
    margin-bottom: 8px;
  }

  .timer-status {
    font-size: 0.7rem;
    margin-top: 2px;
  }
}

/* 移除悬停效果 */

.timer-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.time-display {
  font-size: 3.6rem;
  font-weight: 600;
  color: #2c3e50;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: calc(1px - 0.2px * var(--text-weight));
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: all 0.3s ease, color 0.5s ease, text-shadow 0.5s ease, letter-spacing 0.5s ease;
  text-shadow:
    0 0 calc(0.1px * var(--text-weight)) currentColor,
    0 0 calc(0.2px * var(--text-weight)) currentColor,
    0 0 calc(0.3px * var(--text-weight)) currentColor;
}

.timer-status {
  font-size: 0.75rem;
  font-weight: 500;
  color: #7f8c8d;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: 'Montserrat', sans-serif;
  padding: 4px 0;
  margin-top: 5px;
  transition: all 0.3s ease, color 0.5s ease, opacity 0.5s ease;
  opacity: 0.8;
}

.timer-status.active {
  color: var(--primary-color);
  opacity: 1;
}

.timer-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.timer-decoration::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(240, 240, 240, 0.5) 0%,
    rgba(255, 255, 255, 0) 10%
  );
  z-index: -1;
}

.timer-decoration::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
  opacity: 0.3;
  transition: opacity 0.5s ease, height 0.5s ease, background 0.5s ease;
}

/* 移除过于花哨的动画效果 */

/* 运行状态样式 - 更加高级但不过于花哨 */
.timer-container.running {
  --text-weight: 1;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.02);
  background: #ffffff;
  border-color: rgba(52, 152, 219, 0.15);
}

.timer-container.running .time-display {
  color: var(--primary-color);
}

.timer-container.running .timer-decoration::after {
  background: var(--primary-color);
  opacity: 0.5;
  height: 3px;
}
</style>
