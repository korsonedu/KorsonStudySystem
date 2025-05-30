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

  // 记录开始时间和当前剩余秒数
  const startTime = Date.now()
  const initialSeconds = remainingSeconds.value // 使用当前剩余时间，而不是总时间

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
    <div class="circular-timer" :class="{ 'running': props.isRunning }">
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
  position: relative;
  z-index: 1;
}

.circular-timer {
  --text-weight: 0;
  position: relative;
  width: 320px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-input-gray);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-gray);
}

@media (max-width: 480px) {
  .edu-timer {
    padding: 10px;
  }

  .circular-timer {
    width: 280px;
    height: 140px;
  }

  .time-display {
    font-size: 3rem;
    margin-bottom: 2px; /* 减少底部间距 */
  }

  .timer-status {
    font-size: 0.7rem;
    margin-top: 0; /* 移除顶部间距 */
    padding: 1px 0; /* 减少内边距 */
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
  color: var(--color-text-white);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: 1px;
  margin-bottom: 4px; /* 减少底部间距 */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  transition: all 0.3s ease;
}

.timer-status {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-gray);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  padding: 2px 0; /* 减少内边距 */
  margin-top: 0; /* 移除顶部间距 */
  transition: all 0.3s ease;
  opacity: 0.8;
}

.timer-status.active {
  color: var(--color-accent-orange);
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

/* 运行状态样式 - 苹果风格 */
.circular-timer.running {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  background-color: var(--color-accent-greengray-dim);
  border-color: var(--color-accent-red-dim);
}

.circular-timer.running .time-display {
  color: #ecab86; /* 砖红色，与页面整体设计和谐 */
}
</style>
