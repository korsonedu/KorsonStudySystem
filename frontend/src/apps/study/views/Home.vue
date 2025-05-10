<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { taskService } from '../../../shared/services/taskService'
import { planService } from '../../../shared/services/planService'
import CircularTimer from '../components/CircularTimer.vue'
import { formatDate, formatTime, toChineseTimezone, formatChineseDate, formatTimeOnly } from '../../../utils/dateUtils'
import { getPlanId, sortPlansByCompletionAndDate, filterTodayPlans } from '../../../shared/utils/sortUtils'

// 导入shadcn组件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'

// State for Pomodoro timer
const taskName = ref('')
const taskTime = ref(25)
const isRunning = ref(false)
const totalSeconds = ref(25 * 60)
const buttonText = computed(() => isRunning.value ? '⏸️ 暂停' : '▶️ 开始')

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

// Task records
const taskRecords = ref<Array<any>>([])
const dailyTotal = ref(0)
const totalHours = ref(0)
const error = ref('')

// Plans
const plans = ref<Array<any>>([])
const planInput = ref('')
const planError = ref('')

// 确认对话框状态
const showConfirmDialog = ref(false)
const confirmDialogTitle = ref('确认')
const confirmDialogMessage = ref('')
const confirmDialogCallback = ref(() => {})

// 拖拽功能
const handleDragStart = (event: DragEvent, plan: any) => {
  if (!event.dataTransfer) return

  // 设置拖拽数据 - 传递计划文本
  event.dataTransfer.setData('text/plain', plan.text || plan.title || '')

  // 传递计划ID，以便在完成任务时更新计划状态
  const planId = getPlanId(plan)
  if (planId) {
    event.dataTransfer.setData('application/plan-id', planId.toString())
  }

  event.dataTransfer.effectAllowed = 'copy'

  // 添加视觉反馈
  if (event.target instanceof HTMLElement) {
    event.target.classList.add('dragging')
  }

  // 拖拽开始
}

const handleDragEnd = (event: Event) => {
  // 移除视觉反馈
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('dragging')
  }
}

const handleDragOver = (event: DragEvent) => {
  // 允许放置
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }

  // 添加视觉反馈
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.add('drag-over')
  }
}

const handleDragLeave = (event: DragEvent) => {
  // 移除视觉反馈
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 创建一个引用来存储当前拖拽的计划ID
const currentDraggedPlanId = ref<string | number | null>(null)

const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  // 移除视觉反馈
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.remove('drag-over')
  }

  // 获取拖拽数据
  if (!event.dataTransfer) return
  const planText = event.dataTransfer.getData('text/plain')
  if (!planText) return

  // 获取计划ID
  const planId = event.dataTransfer.getData('application/plan-id')
  if (planId) {
    currentDraggedPlanId.value = planId
  } else {
    currentDraggedPlanId.value = null
  }

  // 设置任务名称
  taskName.value = planText
}



// 记录实际开始时间
const taskStartTime = ref<Date | null>(null)

// 开始/暂停计时器
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

    // 更新总秒数
    totalSeconds.value = taskTime.value * 60

    // 记录开始时间
    taskStartTime.value = new Date()

    // 切换运行状态
    isRunning.value = true
  } else {
    // 暂停计时
    isRunning.value = false
  }
}

// Reset timer - 简化版本，使用CircularTimer组件处理计时逻辑
const resetTimer = () => {
  // 停止计时器
  isRunning.value = false

  // 清空任务名称
  taskName.value = ''

  // 重置开始时间
  taskStartTime.value = null

  // 重置为默认25分钟
  taskTime.value = 25
  totalSeconds.value = taskTime.value * 60
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
    // 不设置加载状态，提升界面流畅感
    error.value = ''

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

    // 任务开始和结束时间已设置为中国时区

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

    // 确保任务时长至少为1分钟

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

    // 确保任务数据符合后端API要求
    const newTask = {
      name: taskName.value,
      duration: taskDuration, // 使用计算出的实际时长
      completed: true,
      start: formatDateForBackend(startTime),
      end: formatDateForBackend(currentTime)
      // 不指定用户ID，由后端根据token自动关联当前用户
    }

    // 使用直接API存储服务保存任务
    const savedTask = await taskService.addTask(newTask)

    // 刷新任务列表
    await fetchTasks()

    // 如果有对应的计划ID，将该计划标记为已完成
    if (currentDraggedPlanId.value) {
      // 更新对应计划的状态

      // 查找对应的计划
      const planToUpdate = plans.value.find(plan => {
        const planId = getPlanId(plan)
        return planId && planId.toString() === currentDraggedPlanId.value?.toString()
      })

      if (planToUpdate && !planToUpdate.completed) {
        // 找到要更新的计划

        // 调用togglePlan方法将计划标记为已完成
        await togglePlan(planToUpdate)
        // 计划已标记为完成
      } else if (planToUpdate) {
        // 计划已经完成，无需更新
      } else {
        // 找不到指定ID的计划
      }

      // 重置当前拖拽的计划ID
      currentDraggedPlanId.value = null
    }

    // Reset for next task
    resetTimer()
    taskName.value = ''
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('完成任务失败')
    }
    // 只在控制台输出错误，不显示错误消息

    // 重置当前拖拽的计划ID
    currentDraggedPlanId.value = null
  }
}

// 由于已经添加了watch监听器，这个函数已不再需要
// 删除冗余函数

// 获取任务列表
const fetchTasks = async () => {
  try {
    error.value = ''

    // 获取今日任务列表
    const todayTasks = await taskService.getTodayTasks()
    taskRecords.value = todayTasks

    // 今日任务获取成功

    // 获取统计信息
    try {
      const dailyStats = await taskService.getDailyStats()
      const totalStats = await taskService.getTotalStats()

      dailyTotal.value = dailyStats?.duration || 0
      totalHours.value = totalStats?.hours || 0
    } catch (statsErr) {
      dailyTotal.value = 0
      totalHours.value = 0
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('获取今日任务失败')
    }
    taskRecords.value = []
    dailyTotal.value = 0
    totalHours.value = 0
  }
}

// 获取计划列表
const fetchPlans = async () => {
  try {
    planError.value = ''

    // 获取所有计划
    const plansData = await planService.getAllPlans()

    // 过滤今天的计划并排序
    const todayPlans = filterTodayPlans(plansData)
    const sortedPlans = sortPlansByCompletionAndDate(todayPlans)

    plans.value = sortedPlans
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('获取计划失败')
    }
    plans.value = []
  }
}

// 添加新计划
const addPlan = async () => {
  if (planInput.value.trim() === '') {
    return
  }

  try {
    planError.value = ''

    // 获取当前时间（中国时区）
    const now = new Date();
    const chinaTime = toChineseTimezone(now);

    // 格式化日期为ISO格式字符串（不带时区信息）
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

    // 创建新计划对象
    const newPlan = {
      text: planInput.value,
      completed: false,
      started: false,
      createdAt: formatDateForBackend(chinaTime)
    }

    // 添加计划
    const createdPlan = await planService.addPlan(newPlan)

    // 清空输入框
    planInput.value = ''

    // 重新获取计划列表
    fetchPlans()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('添加计划失败')
    }
    fetchPlans()
  }
}

// 切换计划完成状态
const togglePlan = async (plan: any) => {
  try {
    planError.value = ''

    // 获取计划ID
    const planId = getPlanId(plan)
    if (!planId) {
      return
    }

    // 创建更新后的计划对象
    const updatedPlan = {
      text: plan.text || plan.title || '',
      completed: !plan.completed,
      started: plan.started || false
    }

    // 更新计划
    await planService.updatePlan(planId, updatedPlan)

    // 在前端更新状态并重新排序
    const planIndex = plans.value.findIndex(p => getPlanId(p) === planId)
    if (planIndex !== -1) {
      plans.value[planIndex].completed = !plan.completed
      plans.value = sortPlansByCompletionAndDate(plans.value)
    }

    // 重新获取计划列表
    fetchPlans()
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('更新计划失败')
    }
    fetchPlans()
  }
}

// 删除计划
const deletePlan = async (planId: number | string | undefined) => {
  if (!planId) {
    return
  }

  // 显示确认对话框
  confirmDialogTitle.value = '删除计划'
  confirmDialogMessage.value = '确定要删除这个学习计划吗？'

  // 设置确认回调函数
  confirmDialogCallback.value = async () => {
    try {
      planError.value = ''

      // 删除计划
      await planService.deletePlan(planId)

      // 重新加载计划列表
      await fetchPlans()

      // 隐藏对话框
      showConfirmDialog.value = false
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('删除计划失败')
      }
      showConfirmDialog.value = false
    }
  }

  // 显示对话框
  showConfirmDialog.value = true
}

// 删除任务
const deleteTask = async (taskId: number) => {
  // 显示确认对话框
  confirmDialogTitle.value = '删除学习记录'
  confirmDialogMessage.value = '确定要删除这条学习记录吗？'

  // 设置确认回调函数
  confirmDialogCallback.value = async () => {
    try {
      error.value = ''

      // 删除任务
      await taskService.deleteTask(taskId)

      // 重新加载任务列表
      await fetchTasks()

      // 隐藏对话框
      showConfirmDialog.value = false
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('删除任务失败')
      }
      showConfirmDialog.value = false
    }
  }

  // 显示对话框
  showConfirmDialog.value = true
}

// 组件挂载时获取数据
onMounted(() => {
  fetchTasks()
  fetchPlans()
})
</script>

<template>
  <div class="main-content">
    <!-- shadcn Dialog 确认对话框 -->
    <Dialog>
      <DialogContent v-if="showConfirmDialog" class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ confirmDialogTitle }}</DialogTitle>
          <DialogDescription>
            {{ confirmDialogMessage }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showConfirmDialog = false">取消</Button>
          <Button @click="confirmDialogCallback">确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <!-- 主要内容区域 - 番茄钟为焦点 -->
    <main class="pomodoro-main">
      <!-- 番茄钟卡片 - 作为页面焦点 -->
      <div class="pomodoro-card">
        <h2 class="pomodoro-title">专注学习时钟 <span class="emoji">⏱️</span></h2>
        <p class="pomodoro-subtitle">使用番茄工作法提高学习效率</p>

        <div v-if="error" class="error-message">{{ error }}</div>

        <!-- 任务输入区域 - 支持拖放计划 - 横排在上方 -->
        <div class="time-setter"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div class="input-group task-group">
            <label for="task-input">学习任务</label>
            <input
              id="task-input"
              type="text"
              v-model="taskName"
              placeholder="输入你要专注的学习内容 📖"
              class="task-input"
            >
          </div>
          <div class="input-group time-group">
            <label for="time-input">专注时长</label>
            <input
              id="time-input"
              type="number"
              v-model="taskTime"
              max="120"
              placeholder="分钟 ⏳"
              :disabled="isRunning"
              class="time-input"
            >
          </div>
        </div>

        <!-- 番茄钟主体 -->
        <div class="timer-container">
          <CircularTimer
            :totalSeconds="totalSeconds"
            :isRunning="isRunning"
            @timeUp="completeTask"
          />
        </div>

        <!-- 控制按钮 -->
        <div class="controls">
          <button class="control-btn primary-btn" @click="toggleTimer" :disabled="!taskName.trim()">{{ buttonText }}</button>
          <button class="control-btn success-btn" @click="completeTask" :disabled="!taskName.trim()">✅ 结束</button>
          <button class="control-btn reset-btn" @click="resetTimer">🔄 重置</button>
        </div>
      </div>

      <!-- 任务记录列表 -->
      <div class="task-list">
        <div class="list-header">
          <h2>今日学习记录 📝</h2>
        </div>
        <p v-if="taskRecords.length === 0" class="empty-message">今天还没有学习记录，开始你的第一个学习任务吧！</p>
        <ul v-else class="task-records">
          <li v-for="(task, index) in taskRecords" :key="index" class="task-record-item">
            <div class="task-record-content">
              <div class="task-record-header">
                <span class="task-name">{{ task.name }}</span>
                <button class="delete-task-btn" @click="deleteTask(task.id)" title="删除任务">❌</button>
              </div>
              <div class="task-record-details">
                <span class="task-date">
                  <span class="label">日期:</span> {{ formatChineseDate(task.start, false) }}
                </span>
                <span class="task-time">
                  <span class="label">开始:</span> {{ formatTimeOnly(task.start) }}
                </span>
                <span class="task-time">
                  <span class="label">结束:</span> {{ formatTimeOnly(task.end) }}
                </span>
                <span class="task-duration">
                  <span class="label">时长:</span> {{ task.duration }} 分钟
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </main>

    <!-- 侧边栏 - 今日计划 -->
    <aside class="plan-sidebar">
      <div class="sidebar-header">
        <h2>今日学习计划 📋</h2>
        <p class="sidebar-subtitle">可以拖动计划到番茄钟任务栏</p>
      </div>
      <div v-if="planError" class="error-message">{{ planError }}</div>

      <div class="plan-control">
        <input
          type="text"
          v-model="planInput"
          placeholder="添加今日学习计划"
          @keyup.enter="addPlan"
        >
        <button class="add-plan-btn" @click="addPlan" :disabled="!planInput.trim()">
          <span class="plus-icon">+</span>
        </button>
      </div>

      <p v-if="plans.length === 0" class="empty-message">暂无学习计划，添加一个吧！</p>
      <ul v-else class="tech-plan-list">
        <li
          v-for="plan in plans"
          :key="getPlanId(plan)"
          class="tech-plan-item"
          :class="{ completed: plan.completed }"
          draggable="true"
          @dragstart="(e) => handleDragStart(e, plan)"
          @dragend="handleDragEnd"
        >
          <div class="tech-plan-content">
            <div class="tech-plan-checkbox-container">
              <input
                type="checkbox"
                :checked="plan.completed"
                @change="togglePlan(plan)"
                class="tech-plan-checkbox"
                :id="`plan-checkbox-${getPlanId(plan)}`"
              >
              <label
                :for="`plan-checkbox-${getPlanId(plan)}`"
                class="tech-plan-checkbox-label"
              ></label>
            </div>
            <div class="tech-plan-text-container">
              <span class="tech-plan-text">{{ plan.text || plan.title || '无标题' }}</span>
              <div v-if="plan.completed" class="tech-plan-status">已完成</div>
              <div v-else class="tech-plan-status pending">待完成</div>
            </div>
          </div>
          <button
            class="tech-plan-delete-btn"
            @click="deletePlan(getPlanId(plan))"
            :disabled="!getPlanId(plan)"
            aria-label="删除计划"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.main-content {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.pomodoro-main {
  flex: 3;
  width: 100%;
}

.plan-sidebar {
  width: 350px; /* 增加宽度到350px */
  background: linear-gradient(145deg, #ffffff, #f0f7ff);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 8px 30px rgba(0, 120, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
  height: fit-content;
  font-size: 0.85rem;
  border: 1px solid rgba(0, 120, 255, 0.1);
  position: relative;
  overflow: hidden; /* 保持overflow: hidden，防止内容溢出 */
}

.plan-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle at top right, rgba(52, 152, 219, 0.1), transparent 70%);
  z-index: 0;
}

.plan-sidebar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle at bottom left, rgba(155, 89, 182, 0.1), transparent 70%);
  z-index: 0;
}

.plan-sidebar > * {
  position: relative;
  z-index: 1;
}

.pomodoro-card {
  background: linear-gradient(135deg, #ffffff, #f8f9ff);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(94, 114, 228, 0.1), 0 5px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 380px;
  width: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(94, 114, 228, 0.1);
}

.pomodoro-card::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(94, 114, 228, 0.05), transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.pomodoro-card::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(17, 205, 239, 0.05), transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.pomodoro-card > * {
  position: relative;
  z-index: 1;
}

.pomodoro-title {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 5px;
  text-align: center;
  font-weight: 700;
}

.pomodoro-subtitle {
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 20px;
  font-size: 1rem;
}

.emoji {
  font-size: 1.6rem;
  vertical-align: middle;
  margin-left: 5px;
}

.timer-container {
  display: flex;
  justify-content: center;
  margin: 20px 0 30px;
  transform: scale(1.5);
  flex: 1;
  min-height: 200px;
}

.time-setter {
  display: flex;
  flex-direction: row;
  gap: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 800px;
  position: relative;
  transition: all 0.3s ease;
  padding: 20px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.time-setter.drag-over {
  border: 2px dashed rgba(94, 114, 228, 0.5);
  background-color: rgba(94, 114, 228, 0.05);
  transform: scale(1.01);
}

.time-setter.drag-over::after {
  content: '拖放计划到这里开始学习';
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(94, 114, 228, 0.9);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  animation: bounce 1s infinite;
  z-index: 10;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-group {
  flex: 2; /* 调整比例为2:1，更加平衡 */
}

.time-group {
  flex: 1;
  min-width: 150px; /* 增加最小宽度，使时间输入框更宽 */
}

.input-group label {
  font-size: 0.9rem;
  color: #5e72e4;
  font-weight: 600;
  margin-left: 5px;
}

.time-setter input {
  width: 100%;
  padding: 14px 15px; /* 增加高度 */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);
}

.time-setter input.task-input {
  border-left: 3px solid #5e72e4;
}

.time-setter input.time-input {
  border-left: 3px solid #2dce89;
  font-size: 1.1rem; /* 增加字体大小 */
  font-weight: 500; /* 加粗 */
  text-align: center; /* 居中显示 */
}

.time-setter input:focus {
  border-color: #5e72e4;
  outline: none;
  box-shadow: 0 0 0 3px rgba(94, 114, 228, 0.2);
  background: white;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
  width: 100%;
  max-width: 500px;
}

.control-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
  font-size: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
}

.control-btn:hover::before {
  left: 100%;
}

.primary-btn {
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  color: white;
}

.success-btn {
  background: linear-gradient(135deg, #2dce89, #2eca72);
  color: white;
}

.reset-btn {
  background: linear-gradient(135deg, #f5365c, #f3545d);
  color: white;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
}

.control-btn:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.1s;
}

.control-btn:disabled {
  background: linear-gradient(135deg, #d1d8e6, #a0aec0);
  cursor: not-allowed;
  opacity: 0.7;
}

/* 学习统计卡片 */
.study-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 500px;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 15px;
  color: #5e72e4;
}

.stat-content h3 {
  margin: 0 0 5px;
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-content p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

/* 学习提示 */
.study-tips {
  margin-top: 20px;
  background: rgba(94, 114, 228, 0.05);
  border-radius: 12px;
  padding: 15px 20px;
  width: 100%;
  max-width: 500px;
  border-left: 4px solid #5e72e4;
}

.study-tips h4 {
  margin: 0 0 10px;
  color: #5e72e4;
  font-size: 1rem;
  font-weight: 600;
}

.study-tips ul {
  margin: 0;
  padding-left: 20px;
}

.study-tips li {
  margin-bottom: 8px;
  color: #2c3e50;
  font-size: 0.9rem;
  line-height: 1.5;
}

.task-list {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 15px;
}

.list-header h2 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.task-records {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 5px;
}

.task-record-item {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 3px solid #5e72e4;
}

.task-record-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
  background-color: #f5f7ff;
}

.task-record-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: 10px;
}

.task-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
}

.task-record-details {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.9rem;
  color: #666;
}

.task-time, .task-duration, .task-date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(94, 114, 228, 0.05);
  padding: 5px 10px;
  border-radius: 20px;
  margin-right: 5px;
  margin-bottom: 5px;
}

.task-date {
  background: rgba(45, 206, 137, 0.05);
}

.task-date .label {
  color: #2dce89;
}

.label {
  font-weight: 600;
  color: #5e72e4;
}

.delete-task-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.6;
  transition: all 0.2s ease;
  padding: 5px;
  border-radius: 4px;
}

.delete-task-btn:hover {
  opacity: 1;
  background: rgba(245, 54, 92, 0.1);
}

.empty-message {
  text-align: center;
  padding: 30px;
  color: #95a5a6;
  font-style: italic;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}

/* 侧边栏样式 */
.sidebar-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar-header h2 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0 0 5px 0;
  font-weight: 600;
}

.sidebar-subtitle {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.sidebar-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.refresh-btn, .debug-btn {
  padding: 5px 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-btn:hover, .debug-btn:hover {
  background-color: #e9ecef;
}

.debug-btn {
  background-color: #f8e9ff;
  border-color: #e5caff;
}

.debug-btn:hover {
  background-color: #f0d9ff;
}

.refresh-btn:disabled, .debug-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.summary {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  display: flex;
  justify-content: space-between;
}

.summary p {
  margin: 5px 0;
  color: #7f8c8d;
}

.summary span {
  font-weight: 600;
  color: #3498db;
}

.plan-control {
  display: flex;
  margin-bottom: 16px;
  position: relative;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.plan-control:focus-within {
  box-shadow: 0 4px 15px rgba(94, 114, 228, 0.15);
  transform: translateY(-2px);
}

.plan-control input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  font-size: 0.95rem;
  background: transparent;
  transition: all 0.3s ease;
}

.plan-control input:focus {
  outline: none;
}

.add-plan-btn {
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  color: white;
  border: none;
  width: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus-icon {
  font-size: 22px;
  font-weight: 300;
  line-height: 1;
  transition: all 0.3s ease;
}

.add-plan-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4a5bd4, #6f4dd4);
  width: 60px;
}

.add-plan-btn:hover:not(:disabled) .plus-icon {
  transform: scale(1.2);
}

.add-plan-btn:active:not(:disabled) .plus-icon {
  transform: scale(1);
}

.add-plan-btn:disabled {
  background: linear-gradient(135deg, #d1d8e6, #a0aec0);
  cursor: not-allowed;
}

/* 科技感计划列表 */
.tech-plan-list {
  margin: 0;
  padding: 0;
  max-height: 500px; /* 设置最大高度 */
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 隐藏水平滚动条 */
  padding-right: 5px; /* 添加右侧内边距，为滚动条留出空间 */
}

.tech-plan-item {
  display: flex;
  flex-direction: column;
  margin: 14px 0;
  background: rgba(255, 255, 255, 0.8);
  padding: 14px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 120, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
  cursor: grab;
  backdrop-filter: blur(5px);
}

.tech-plan-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, #5e72e4, #825ee4);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.tech-plan-item::after {
  content: '';
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(94, 114, 228, 0.1), transparent 70%);
  z-index: 0;
  transition: all 0.3s ease;
}

.tech-plan-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-3px); /* 移除scale效果，防止卡片变大导致溢出 */
  box-shadow: 0 8px 20px rgba(94, 114, 228, 0.15);
}

.tech-plan-item:hover::before {
  width: 6px;
  opacity: 1;
  background: linear-gradient(to bottom, #11cdef, #1171ef);
}

.tech-plan-item:hover::after {
  transform: scale(1.2);
}

.tech-plan-item:active {
  cursor: grabbing;
  transform: translateY(-1px) scale(1.01);
  transition: all 0.1s ease;
}

.tech-plan-item.dragging {
  opacity: 0.7;
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(94, 114, 228, 0.2);
  border: 2px dashed #5e72e4;
  background: rgba(255, 255, 255, 0.95);
  position: relative;
  z-index: 100;
}

.tech-plan-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
}

.tech-plan-checkbox-container {
  position: relative;
  margin-right: 12px;
  margin-top: 2px;
}

.tech-plan-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.tech-plan-checkbox-label {
  display: inline-block;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #5e72e4;
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(94, 114, 228, 0.2);
}

.tech-plan-checkbox-label:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 8px rgba(94, 114, 228, 0.3);
  border-color: #11cdef;
}

.tech-plan-checkbox:checked + .tech-plan-checkbox-label {
  background: linear-gradient(135deg, #5e72e4, #825ee4);
  border-color: transparent;
}

.tech-plan-checkbox:checked + .tech-plan-checkbox-label::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  animation: checkmark 0.2s ease-in-out;
}

@keyframes checkmark {
  0% { opacity: 0; transform: rotate(45deg) scale(0.8); }
  50% { opacity: 1; transform: rotate(45deg) scale(1.2); }
  100% { opacity: 1; transform: rotate(45deg) scale(1); }
}

.tech-plan-text-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tech-plan-text {
  font-size: 0.95rem;
  color: #2c3e50;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.tech-plan-item:hover .tech-plan-text {
  color: #1a365d;
}

.tech-plan-status {
  font-size: 0.7rem;
  color: #fff;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  padding: 3px 8px;
  border-radius: 20px;
  display: inline-block;
  margin-top: 6px;
  font-weight: 600;
  width: fit-content;
  box-shadow: 0 2px 5px rgba(46, 204, 113, 0.2);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.tech-plan-status.pending {
  color: #fff;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  box-shadow: 0 2px 5px rgba(230, 126, 34, 0.2);
}

.tech-plan-debug-info {
  font-size: 0.7rem;
  color: #888;
  margin-top: 8px;
  font-family: 'Roboto Mono', monospace;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px 8px;
  border-radius: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-left: 2px solid #3498db;
}

.tech-plan-item.completed {
  background: rgba(236, 240, 241, 0.7);
  border-color: rgba(46, 204, 113, 0.2);
}

.tech-plan-item.completed::before {
  background: linear-gradient(to bottom, #27ae60, #2ecc71);
}

.tech-plan-item.completed::after {
  background: radial-gradient(circle, rgba(46, 204, 113, 0.1), transparent 70%);
}

.tech-plan-item.completed .tech-plan-text {
  text-decoration: line-through;
  color: #95a5a6;
}

.tech-plan-item.completed:hover {
  box-shadow: 0 8px 20px rgba(46, 204, 113, 0.15);
}

.tech-plan-delete-btn {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 6px;
  opacity: 0.6;
  transition: all 0.3s ease;
  position: absolute;
  top: 10px;
  right: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.tech-plan-delete-btn:hover {
  opacity: 1;
  color: #fff;
  background: linear-gradient(135deg, #f5365c, #e74c3c);
  box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
  transform: translateY(-2px);
}

.tech-plan-delete-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(231, 76, 60, 0.2);
}

.tech-plan-delete-btn svg {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.tech-plan-delete-btn:hover svg {
  transform: scale(1.1);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: rgba(231, 76, 60, 0.08);
  color: #e74c3c;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 0.85rem;
  border-left: 3px solid #e74c3c;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.1);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-info {
  background: rgba(52, 152, 219, 0.1);
  color: #3498db;
  padding: 8px;
  border-radius: 5px;
  margin-bottom: 10px;
  text-align: left;
  font-size: 0.9rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.api-status {
  white-space: pre-line;
  margin-top: 5px;
  padding: 5px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  max-height: 100px;
  overflow-y: auto;
}

.debug-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.test-api-btn {
  padding: 5px 10px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.test-api-btn:hover {
  background-color: #2980b9;
}

.api-test-link {
  padding: 5px 10px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: none;
  display: inline-block;
}

.api-test-link:hover {
  background-color: #27ae60;
}

.plan-debug {
  margin-bottom: 10px;
  display: flex;
  gap: 5px;
}

.clear-plans-btn, .check-api-btn {
  flex: 1;
  padding: 5px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s;
}

.clear-plans-btn {
  background-color: #e74c3c;
}

.clear-plans-btn:hover {
  background-color: #c0392b;
}

.check-api-btn {
  background-color: #e67e22;
}

.check-api-btn:hover {
  background-color: #d35400;
}

.loading-message, .empty-message {
  text-align: center;
  padding: 15px;
  color: #7f8c8d;
  font-style: italic;
  background: rgba(236, 240, 241, 0.5);
  border-radius: 8px;
  margin: 10px 0;
  font-size: 0.9rem;
  border: 1px dashed rgba(127, 140, 141, 0.2);
}

.loading-message::before {
  content: '⏳';
  margin-right: 6px;
  animation: pulse 1.5s infinite;
  display: inline-block;
}

.empty-message::before {
  content: '📝';
  margin-right: 6px;
  display: inline-block;
}

@keyframes pulse {
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.5; transform: scale(1); }
}

ul {
  list-style: none;
  padding: 0;
  max-height: 400px;
  overflow-y: auto;
}

h2 {
  color: var(--primary-color);
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.sidebar-header h2 {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #5e72e4, #11cdef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  position: relative;
}

.sidebar-header h2::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(to right, #3498db, transparent);
}

/* 响应式布局 */
/* 平板设备 */
@media (max-width: 1200px) {
  .main-content {
    gap: 20px;
  }

  .pomodoro-card {
    padding: 30px;
  }

  .study-tips {
    max-width: 100%;
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .plan-sidebar {
    width: 100%;
    margin-top: 30px;
  }

  .pomodoro-main {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .timer-container {
    transform: scale(1.3);
  }

  .study-stats {
    flex-direction: row;
    max-width: 100%;
  }
}

/* 小平板和大手机 */
@media (max-width: 768px) {
  .pomodoro-card {
    padding: 25px;
  }

  .timer-container {
    margin: 20px 0;
    transform: scale(1.2);
  }

  .controls {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .control-btn {
    width: 100%;
  }

  .time-setter {
    flex-direction: column;
    padding: 10px;
  }

  .task-group, .time-group {
    width: 100%;
  }

  .task-record-details {
    flex-wrap: wrap;
  }
}

/* 手机设备 */
@media (max-width: 480px) {
  .main-content {
    padding: 0 8px;
  }

  .pomodoro-card, .task-list, .plan-sidebar {
    padding: 12px;
    border-radius: 10px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 15px;
  }

  .pomodoro-title {
    font-size: 1.3rem;
    margin-top: 0;
    margin-bottom: 5px;
  }

  .pomodoro-subtitle {
    font-size: 0.8rem;
    margin-bottom: 8px;
  }

  .timer-container {
    transform: scale(0.9);
    margin: 0;
    height: 150px;
  }

  .time-setter {
    flex-direction: row;
    gap: 6px;
    margin-bottom: 5px;
  }

  .input-group {
    margin-bottom: 5px;
  }

  .input-group label {
    font-size: 0.8rem;
    margin-bottom: 3px;
  }

  .task-input, .time-input {
    padding: 8px;
    font-size: 0.9rem;
  }

  .control-btn {
    padding: 8px;
    font-size: 0.85rem;
    height: 36px;
  }

  .control-buttons {
    margin-top: 5px;
    gap: 8px;
  }

  /* 学习记录部分 */
  .list-header {
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .list-header h2 {
    font-size: 1.1rem;
  }

  .task-records {
    max-height: 300px;
  }

  .task-record-item {
    padding: 8px;
    margin-bottom: 8px;
  }

  .task-record-header {
    padding-bottom: 5px;
    margin-bottom: 5px;
  }

  .task-name {
    font-size: 0.95rem;
  }

  .task-record-details {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  .task-time, .task-duration, .task-date {
    padding: 3px 6px;
    font-size: 0.75rem;
    margin-right: 3px;
    margin-bottom: 3px;
  }

  /* 计划部分 */
  .sidebar-header h2 {
    font-size: 1.1rem;
    margin-bottom: 5px;
  }

  .sidebar-subtitle {
    font-size: 0.8rem;
    margin-bottom: 8px;
  }

  .plan-control {
    margin-bottom: 10px;
  }

  .plan-control input {
    padding: 8px;
    font-size: 0.9rem;
  }

  .tech-plan-item {
    padding: 8px;
    margin-bottom: 8px;
  }

  .tech-plan-text {
    font-size: 0.9rem;
  }

  .study-tips {
    padding: 10px;
    margin-top: 10px;
  }

  .study-tips h4 {
    font-size: 0.9rem;
    margin-bottom: 5px;
  }

  .study-tips li {
    font-size: 0.8rem;
    margin-bottom: 3px;
  }

  .empty-message {
    padding: 15px;
    font-size: 0.85rem;
  }
}

/* 小手机设备 */
@media (max-width: 360px) {
  .pomodoro-card {
    padding: 12px;
  }

  .timer-container {
    transform: scale(0.9);
  }

  .control-btn {
    padding: 8px;
    font-size: 0.85rem;
  }

  .list-header h2, .sidebar-header h2 {
    font-size: 1.2rem;
  }
}
</style>