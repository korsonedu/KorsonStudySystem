<script setup lang="ts">
/**
 * 番茄钟计时器组件
 *
 * 功能：
 * - 设置学习任务名称和专注时长
 * - 开始/暂停/重置计时器
 * - 完成任务并保存记录
 * - 支持从学习计划拖放任务
 * - 自动计算实际学习时长
 *
 * 使用方式：
 * <PomodoroTimer />
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { taskService } from '../../../shared/services/taskService'
import { toChineseTimezone } from '../../../utils/dateUtils'
import { useUserStore } from '../../../stores/userStore'
import eventBus, { EVENT_NAMES } from '../../../utils/eventBus'

// Import shadcn-vue components
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue'

// 番茄钟状态
/** 学习任务名称 */
const taskName = ref('')
/** 专注时长（分钟） */
const taskTime = ref(25)
/** 计时器是否运行中 */
const isRunning = ref(false)
/** 剩余总秒数 */
const totalSeconds = ref(25 * 60)
/** 按钮文本（根据运行状态变化） */
const buttonText = computed(() => isRunning.value ? '⏸️ 暂停' : '▶️ 开始')
/** 进度条百分比 */
const progress = ref(0)

/** 记录实际开始时间 */
const taskStartTime = ref<Date | null>(null)

// 确认对话框状态
/** 是否显示确认对话框 */
const showConfirmDialog = ref(false)
/** 确认对话框标题 */
const confirmDialogTitle = ref('确认')
/** 确认对话框消息内容 */
const confirmDialogMessage = ref('')
/** 确认对话框确认按钮回调函数 */
const confirmDialogCallback = ref(() => {})

// 监听taskTime的变化，实时更新时钟显示
watch(taskTime, (newValue) => {
  // 只在有值且不在运行状态时更新时钟
  if (newValue && !isRunning.value) {
    // 限制最大值为120分钟
    if (newValue > 120) taskTime.value = 120
    totalSeconds.value = taskTime.value * 60
  } else if (!newValue && !isRunning.value) {
    // 当输入框为空时，显示0分钟
    totalSeconds.value = 0
  }
})

// 计时器逻辑
/** 计时器ID，用于清除计时器 */
let timerId: number | null = null

/**
 * 格式化时间显示
 * 将秒数转换为 MM:SS 格式
 *
 * @param seconds 总秒数
 * @returns 格式化后的时间字符串，如 "25:00"
 */
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 清除计时器
 * 停止当前运行的计时器并释放资源
 */
function clearTimer() {
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

/**
 * 启动计时器
 *
 * 创建一个新的计时器，每500毫秒更新一次时间和进度
 * 当时间结束时自动触发任务完成事件
 */
function startTimer() {
  // 清除现有计时器
  clearTimer()

  // 记录开始时间和初始总秒数
  const startTime = Date.now()
  const initialSeconds = totalSeconds.value

  // 创建新计时器
  timerId = window.setInterval(() => {
    // 如果不在运行状态，清除计时器
    if (!isRunning.value) {
      clearTimer()
      return
    }

    // 计算剩余时间
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
    const newRemaining = Math.max(initialSeconds - elapsedSeconds, 0)

    // 更新剩余时间
    totalSeconds.value = newRemaining

    // 更新进度条
    progress.value = 100 - (newRemaining / (taskTime.value * 60) * 100)

    // 如果时间到了，触发完成事件
    if (newRemaining <= 0) {
      clearTimer()
      isRunning.value = false
      completeTask()
    }
  }, 500)
}

/**
 * 开始/暂停计时器
 *
 * 根据当前状态切换计时器的运行状态：
 * - 如果未运行，则启动计时器
 * - 如果正在运行，则暂停计时器
 *
 * 启动前会进行时间有效性检查和限制
 */
const toggleTimer = () => {
  // 如果当前未运行，且要开始计时，需要检查时间是否有效
  if (!isRunning.value) {
    // 检查是否设置了有效的时间
    if (!taskTime.value || taskTime.value <= 0) {
      alert('请设置有效的专注时长')
      return
    }

    // 确保时间不超过120分钟
    if (taskTime.value > 120) {
      taskTime.value = 120
    }

    // 更新总秒数（始终重置总秒数）
    totalSeconds.value = taskTime.value * 60

    // 记录开始时间
    taskStartTime.value = new Date()

    // 切换运行状态
    isRunning.value = true

    // 启动计时器
    startTimer()
  } else {
    // 暂停计时
    isRunning.value = false
    clearTimer()
  }
}

// Reset timer
const resetTimer = () => {
  // 停止计时器
  isRunning.value = false
  clearTimer()

  // 清空任务名称
  taskName.value = ''

  // 重置开始时间
  taskStartTime.value = null

  // 重置为默认25分钟
  taskTime.value = 25
  totalSeconds.value = taskTime.value * 60

  // 重置进度条
  progress.value = 0
}

// 完成当前任务
const completeTask = async () => {
  // 检查任务名称
  if (taskName.value.trim() === '') {
    return
  }

  // 显示自定义确认对话框
  confirmDialogTitle.value = '完成学习任务'
  confirmDialogMessage.value = `确定要结束"${taskName.value}"任务吗？`

  // 设置确认回调函数
  confirmDialogCallback.value = async () => {
    // 停止计时器
    isRunning.value = false
    clearTimer()

    // 隐藏对话框
    showConfirmDialog.value = false

    // 继续执行保存任务的逻辑
    await saveCompletedTask()
  }

  // 显示对话框
  showConfirmDialog.value = true
}

// 保存已完成的任务
const saveCompletedTask = async () => {
  try {
    // 获取当前时间作为结束时间（中国时区）
    const now = new Date();
    // 转换为中国时区
    const currentTime = toChineseTimezone(now);

    // 使用实际开始时间，如果没有则使用当前时间
    let startTime;
    if (taskStartTime.value) {
      // 转换为中国时区
      startTime = toChineseTimezone(taskStartTime.value);
    } else {
      startTime = currentTime;
    }

    // 计算实际时长（从开始到结束的分钟数）
    let taskDuration = taskTime.value; // 默认使用设置的时长

    // 如果有开始时间，计算实际时长
    if (taskStartTime.value) {
      // 计算实际时长（毫秒）
      const durationMs = currentTime.getTime() - startTime.getTime();
      // 转换为分钟并四舍五入
      const actualDuration = Math.round(durationMs / 60000);
      // 使用实际时长，但确保至少为1分钟
      taskDuration = Math.max(actualDuration, 1);
    } else {
      // 确保默认时长至少为1分钟
      taskDuration = Math.max(taskDuration, 1);
    }

    // 将日期格式化为ISO格式字符串（不带时区信息）
    const formatDateForBackend = (date: Date) => {
      // 确保日期是中国时区
      const chinaDate = toChineseTimezone(date);
      // 获取年月日时分秒
      const year = chinaDate.getFullYear();
      const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
      const day = String(chinaDate.getDate()).padStart(2, '0');
      const hours = String(chinaDate.getHours()).padStart(2, '0');
      const minutes = String(chinaDate.getMinutes()).padStart(2, '0');
      const seconds = String(chinaDate.getSeconds()).padStart(2, '0');

      // 返回格式化的日期时间字符串（不带时区信息）
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // 创建任务数据
    const taskData = {
      name: taskName.value,
      duration: taskDuration, // 使用计算出的实际时长
      completed: true,
      start: formatDateForBackend(startTime),
      end: formatDateForBackend(currentTime)
    }

    console.log('创建已完成任务:', taskData);
    // 直接创建新任务，只有在任务完成时才创建记录
    const savedTask = await taskService.addTask(taskData);

    // 获取当前用户信息
    const userStore = useUserStore();

    // 如果任务保存成功，广播任务完成事件
    if (savedTask && savedTask.id) {
      console.log('任务完成，准备广播任务完成事件:', savedTask);

      // 添加用户信息到任务对象
      const taskWithUser = {
        ...savedTask,
        user: {
          id: userStore.userId,
          username: userStore.username
        }
      };

      console.log('广播任务完成事件:', taskWithUser);
      // 通过EventBus广播任务完成事件
      eventBus.emit(EVENT_NAMES.TASK_COMPLETED, taskWithUser);
    }

    // Reset for next task
    resetTimer()
  } catch (err: any) {
    console.error('完成任务失败:', err)
  }
}

// 监听倒计时结束事件
watch(() => totalSeconds.value, (newValue) => {
  if (newValue === 0 && isRunning.value) {
    // 倒计时自然结束，保存任务
    saveCompletedTask();
  }
});

// 组件挂载时
onMounted(() => {
  console.log('PomodoroTimer 组件挂载');
});

// 组件卸载时清除计时器
onBeforeUnmount(() => {
  console.log('PomodoroTimer 组件卸载');
  clearTimer();
});
</script>

<template>
  <div class="pomodoro-container">
    <Card class="pomodoro-card">
      <CardHeader class="card-header">
        <CardTitle class="card-title">番茄钟</CardTitle>
        <div v-if="isRunning" class="task-status running">
          任务进行中
        </div>
        <div v-else-if="taskStartTime && !isRunning" class="task-status">
          任务已暂停
        </div>
      </CardHeader>
      <CardContent>
        <div class="timer-display">
          <div class="timer-circle" :style="{ '--progress': progress + '%' }">
            <div class="time-text">{{ formatTime(totalSeconds) }}</div>
            <div class="timer-status" :class="{ 'active': isRunning }">
              {{ isRunning ? 'ACTIVE' : 'STANDBY' }}
            </div>
          </div>
        </div>

        <div class="task-input">
          <Input
            v-model="taskName"
            placeholder="输入任务名称"
            class="task-name-input"
            :disabled="isRunning"
          />

          <div class="time-input-container">
            <Input
              v-model="taskTime"
              type="number"
              min="1"
              max="120"
              class="time-input"
              :disabled="isRunning"
            />
            <span class="time-unit">分钟</span>
          </div>
        </div>
      </CardContent>
      <CardFooter class="timer-controls">
        <Button @click="toggleTimer" class="control-button" :class="{ 'running': isRunning }">
          {{ buttonText }}
        </Button>
        <Button @click="resetTimer" class="control-button reset-button" :disabled="isRunning">
          🔄 重置
        </Button>
        <Button @click="completeTask" class="control-button complete-button" :disabled="!taskName.trim()">
          ✓ 完成
        </Button>
      </CardFooter>
    </Card>

    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      @confirm="confirmDialogCallback"
      @cancel="showConfirmDialog = false"
    />
  </div>
</template>

<style scoped>
.pomodoro-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  min-height: 80vh;
}

.pomodoro-card {
  width: 100%;
  max-width: 500px;
  background-color: var(--color-card-gray);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border-gray);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  padding: 24px;
}

.pomodoro-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

/* 输入框样式 - 苹果风格 */
:deep(.input) {
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--color-border-gray);
  background-color: var(--color-input-gray);
  color: var(--color-text-white);
  transition: all 0.2s ease;
}

:deep(.input:focus) {
  border-color: var(--color-accent-orange);
  box-shadow: 0 0 0 1px var(--color-accent-orange-dim);
}

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.timer-circle {
  position: relative;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--color-input-gray);
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.2);
  --progress: 0%;
}

.timer-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(var(--color-accent-orange) var(--progress), transparent var(--progress));
  mask: radial-gradient(transparent 65%, black 66%);
  -webkit-mask: radial-gradient(transparent 65%, black 66%);
}

.time-text {
  font-size: 3.6rem;
  font-weight: 600;
  color: var(--color-text-white);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: 1px;
}

.timer-status {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-gray);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
  opacity: 0.8;
}

.timer-status.active {
  color: var(--color-accent-orange);
  opacity: 1;
}

.task-input {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-input {
  width: 100px;
}

.time-unit {
  font-size: 14px;
  color: var(--color-text-gray);
  font-weight: 500;
}

.timer-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}

.control-button {
  flex: 1;
  transition: all 0.2s ease;
  height: 44px;
  font-weight: 500;
  border-radius: 8px;
  background-color: var(--color-input-gray);
  color: var(--color-text-white);
  border: none;
}

.control-button:hover {
  filter: brightness(1.1);
}

.control-button:active {
  transform: scale(0.98);
  filter: brightness(0.95);
}

.control-button.running {
  background-color: var(--color-accent-orange);
  color: var(--color-text-white);
}

.reset-button {
  background-color: var(--color-input-gray);
}

.complete-button {
  background-color: var(--color-accent-green);
}

.card-header {
  padding: 0 0 16px 0;
  border-bottom: none;
  text-align: center;
}

.card-title {
  font-size: 1.5rem;
  color: var(--color-text-white);
  margin-bottom: 6px;
  text-align: center;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.task-status {
  font-size: 0.85rem;
  font-weight: 500;
  color: #888;
  padding: 3px 8px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
}

.task-status.running {
  color: var(--color-accent-orange);
  background-color: rgba(255, 147, 38, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

@media (max-width: 480px) {
  .pomodoro-container {
    padding: 10px;
  }

  .timer-circle {
    width: 180px;
    height: 180px;
  }

  .time-text {
    font-size: 3rem;
  }

  .timer-controls {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
