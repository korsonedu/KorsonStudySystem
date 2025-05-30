<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { taskService } from '../../../shared/services/taskService'
import { planService } from '../../../shared/services/planService'
import eventBus, { EVENT_NAMES } from '../../../utils/eventBus'
import { useUserStore } from '../../../stores/userStore'
import { useOnlineUsersStore } from '../../../stores/onlineUsersStore'
import CircularTimer from '../components/CircularTimer.vue'
import { formatDate, formatTime, toChineseTimezone, formatChineseDate, formatTimeOnly } from '../../../utils/dateUtils'
import { getPlanId, sortPlansByCompletionAndDate, filterTodayPlans } from '../../../shared/utils/sortUtils'
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue'
import OnlineUsersCard from '../components/OnlineUsersCard.vue'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { toast } from 'vue-sonner'

// 使用状态存储
const userStore = useUserStore()
const onlineUsersStore = useOnlineUsersStore()

// 隐私模式状态
const privacyMode = ref(localStorage.getItem('privacy_mode') === 'true')

// 切换隐私模式
const togglePrivacyMode = (checked: boolean) => {
  console.log('隐私模式切换:', checked)
  privacyMode.value = checked
  localStorage.setItem('privacy_mode', checked.toString())

  if (checked) {
    // 如果开启隐私模式，从在线用户列表中移除自己
    onlineUsersStore.setPrivacyMode(true)
    toast.success('隐私模式已开启', {
      description: '您的信息将不会向其他用户显示',
      duration: 3000,
    })
  } else {
    // 如果关闭隐私模式，重新加入在线用户列表
    onlineUsersStore.setPrivacyMode(false)
    toast.success('隐私模式已关闭', {
      description: '您的信息将会向其他用户显示',
      duration: 3000,
    })
  }
}

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

// 在 script setup 部分的开头添加
const timeLeft = ref(0);

/**
 * 拖拽功能
 *
 * 实现学习计划与番茄钟之间的拖放交互，允许用户：
 * 1. 从计划列表拖动计划到番茄钟
 * 2. 自动填充任务名称
 * 3. 自动开始计时
 * 4. 完成后自动标记计划为已完成
 */

/**
 * 处理拖拽开始事件
 *
 * @param event 拖拽事件对象
 * @param plan 被拖拽的计划对象
 */
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

  // 立即显示拖放提示卡片
  const taskInputSection = document.querySelector('.task-input-section')
  if (taskInputSection) {
    taskInputSection.classList.add('plan-dragging')
  }

  // 拖拽开始
}

/**
 * 处理拖拽结束事件
 *
 * @param event 事件对象
 */
const handleDragEnd = (event: Event) => {
  // 移除视觉反馈
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('dragging')
  }

  // 移除拖放提示卡片
  const taskInputSection = document.querySelector('.task-input-section')
  if (taskInputSection) {
    taskInputSection.classList.remove('plan-dragging')
  }
}

/**
 * 处理拖拽经过目标区域事件
 *
 * @param event 拖拽事件对象
 */
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

/**
 * 处理拖拽离开目标区域事件
 *
 * @param event 拖拽事件对象
 */
const handleDragLeave = (event: DragEvent) => {
  // 移除视觉反馈
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.remove('drag-over')
  }
}

// 创建一个引用来存储当前拖拽的计划ID
const currentDraggedPlanId = ref<string | number | null>(null)

/**
 * 处理拖拽放置事件
 *
 * 当计划被拖放到番茄钟区域时：
 * 1. 提取计划文本和ID
 * 2. 设置为当前任务名称
 * 3. 显示确认对话框询问是否开始计时
 *
 * @param event 拖拽事件对象
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()

  // 移除视觉反馈
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.remove('drag-over')
  }

  // 移除拖放提示卡片
  const taskInputSection = document.querySelector('.task-input-section')
  if (taskInputSection) {
    taskInputSection.classList.remove('plan-dragging')
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

  // 检查是否可以开始计时
  if (!isRunning.value && taskName.value.trim() && taskTime.value > 0) {
    // 确保时间不超过120分钟
    if (taskTime.value > 120) {
      taskTime.value = 120
    }

    // 显示确认对话框
    confirmDialogTitle.value = '开始学习任务'
    confirmDialogMessage.value = `您确认开始此次任务吗？\n\n任务名：${taskName.value}\n时长：${taskTime.value} 分钟`

    // 设置确认回调函数
    confirmDialogCallback.value = () => {
      // 启动计时器
      toggleTimer()

      // 隐藏对话框
      showConfirmDialog.value = false
    }

    // 显示对话框
    showConfirmDialog.value = true
  }
}



// 记录实际开始时间
const taskStartTime = ref<Date | null>(null)

// 当前正在进行的任务ID
const currentTaskId = ref<number | null>(null)

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

    // 创建并开始任务
    createAndStartTask()
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

  // 重置当前任务ID
  currentTaskId.value = null
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

// 创建并开始任务
const createAndStartTask = async () => {
  try {
    // 检查任务名称
    if (!taskName.value.trim()) {
      return;
    }

    // 获取当前时间
    const now = new Date();
    // 转换为中国时区
    const currentTime = toChineseTimezone(now);

    // 保存开始时间
    taskStartTime.value = currentTime;

    // 获取当前用户信息
    const userStore = useUserStore();

    // 广播任务开始事件
    const taskWithUser = {
      name: taskName.value,
      duration: taskTime.value,
      start: currentTime,
      user: {
        id: userStore.userId,
        username: userStore.username
      },
      status: 'ongoing',
      completed: false
    };

    console.log('广播任务开始事件:', taskWithUser);
    // 通过EventBus广播任务开始事件
    eventBus.emit(EVENT_NAMES.TASK_STARTED, taskWithUser);
  } catch (err) {
    console.error('创建并开始任务失败:', err);
  }
};

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

    // 确保任务数据符合后端API要求
    const taskData = {
      name: taskName.value,
      duration: taskDuration, // 使用计算出的实际时长
      completed: true,
      start: formatDateForBackend(startTime),
      end: formatDateForBackend(currentTime)
      // 不指定用户ID，由后端根据token自动关联当前用户
    }

    let savedTask;

    // 如果有当前任务ID，则更新任务而不是创建新任务
    if (currentTaskId.value) {
      console.log('更新现有任务:', currentTaskId.value);
      // 使用completeTask方法更新任务
      savedTask = await taskService.completeTask(currentTaskId.value, taskData);
    } else {
      console.log('创建新的已完成任务');
      // 如果没有当前任务ID，创建新任务
      savedTask = await taskService.addTask(taskData);
    }

    // 获取当前用户信息
    const userStore = useUserStore();

    // 广播任务完成事件
    if (savedTask && savedTask.id) {
      console.log('广播任务完成事件:', savedTask);

      // 添加用户信息到任务对象
      const taskWithUser = {
        ...savedTask,
        user: {
          id: userStore.userId,
          username: userStore.username
        },
        status: 'completed',
        completed: true
      };

      // 通过EventBus广播任务完成事件
      eventBus.emit(EVENT_NAMES.TASK_COMPLETED, taskWithUser);
    }

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

    // 重置当前任务ID
    currentTaskId.value = null
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('完成任务失败')
    }
    // 只在控制台输出错误，不显示错误消息

    // 重置当前拖拽的计划ID和任务ID
    currentDraggedPlanId.value = null
    currentTaskId.value = null
  }
}

// 监听倒计时结束事件
watch(() => timeLeft.value, (newValue) => {
  if (newValue === 0 && isRunning.value) {
    // 倒计时自然结束，保存任务
    saveCompletedTask();
  }
});

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
    await planService.addPlan(newPlan)

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

// 组件卸载前清理资源
onBeforeUnmount(() => {
  // 清理资源
})
</script>

<template>
  <div class="main-content">
    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogTitle"
      :message="confirmDialogMessage"
      @confirm="confirmDialogCallback"
      @cancel="showConfirmDialog = false"
    />
    <!-- 主要内容区域 - 番茄钟为焦点 -->
    <main class="pomodoro-main">
      <!-- 番茄钟卡片 - 作为页面焦点 -->
      <Card class="pomodoro-card">
        <CardHeader>
          <div class="pomodoro-header">
            <CardTitle class="pomodoro-title">专注学习时钟 <span class="emoji">🚀</span></CardTitle>
            <div v-if="userStore.isLoggedIn" class="privacy-mode-wrapper">
              <div class="privacy-mode-control">
                <span class="privacy-mode-label">隐私模式</span>
                <div
                  class="custom-switch"
                  :class="{ 'switch-on': privacyMode }"
                  @click="togglePrivacyMode(!privacyMode)"
                >
                  <div class="switch-thumb"></div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="error" class="error-message">{{ error }}</div>

          <!-- 任务和时长输入区域 - 两列布局 -->
          <div class="input-container">
            <!-- 第一列：学习任务 -->
            <div class="input-column">
              <Label for="task-input" class="input-label">学习任务</Label>
              <div class="task-input-section"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
              >
                <Input
                  id="task-input"
                  type="text"
                  v-model="taskName"
                  placeholder="输入你要专注的学习内容 📖"
                  class="task-input"
                  autocomplete="off"
                />
              </div>
            </div>

            <!-- 第二列：专注时长 -->
            <div class="input-column">
              <Label for="time-input" class="input-label">专注时长</Label>
              <div class="time-input-section">
                <Input
                  id="time-input"
                  type="number"
                  v-model="taskTime"
                  max="120"
                  placeholder="分钟 ⏳"
                  :disabled="isRunning"
                  class="time-input"
                  autocomplete="off"
                />
              </div>
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
            <Button class="control-btn primary-btn" @click="toggleTimer" :disabled="!taskName.trim()">
              <span class="button-content">{{ buttonText }}</span>
            </Button>
            <Button class="control-btn success-btn" @click="completeTask" :disabled="!taskName.trim()">
              <span class="button-content">✅ 结束</span>
            </Button>
            <Button class="control-btn reset-btn" @click="resetTimer">
              <span class="button-content">🔄 重置</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 任务记录列表 -->
      <Card class="task-list">
        <CardHeader>
          <CardTitle>今日学习记录 📝</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="taskRecords.length === 0" class="empty-message">今天还没有学习记录，开始你的第一个学习任务吧！</p>
          <ul v-else class="task-records">
            <li v-for="(task, index) in taskRecords" :key="index" class="task-record-item">
              <div class="task-record-content">
                <div class="task-record-header">
                  <span class="task-name">{{ task.name }}</span>
                  <Button
                    class="delete-task-btn"
                    @click="deleteTask(task.id)"
                    title="删除任务"
                    variant="ghost"
                    size="icon"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </Button>
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
        </CardContent>
      </Card>
    </main>

    <!-- 侧边栏 - 今日计划 -->
    <div class="sidebar-container">
      <Card class="plan-sidebar">
        <CardHeader>
          <CardTitle>今日学习计划 📋</CardTitle>
          <p class="sidebar-subtitle">可以拖动计划到番茄钟任务栏</p>
        </CardHeader>
        <CardContent>
          <div v-if="planError" class="error-message">{{ planError }}</div>

          <div class="plan-control">
            <Input
              type="text"
              v-model="planInput"
              placeholder="添加今日学习计划"
              @keyup.enter="addPlan"
              class="plan-input"
              autocomplete="off"
            />
            <Button class="add-plan-btn" @click="addPlan" :disabled="!planInput.trim()">
              <span class="plus-icon">+</span>
            </Button>
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
              <Button
                class="tech-plan-delete-btn"
                @click="deletePlan(getPlanId(plan))"
                :disabled="!getPlanId(plan)"
                aria-label="删除计划"
                variant="ghost"
                size="icon"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- 在线用户卡片 -->
      <OnlineUsersCard />
    </div>
  </div>
</template>

<style scoped>
/* 组件特定样式 - 其他通用样式已移至全局CSS文件 */
/* 表情符号样式 */
.emoji {
  font-size: 1.5rem;
  vertical-align: middle;
  margin-left: 6px;
}

/* 番茄钟标题栏样式 */
.pomodoro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 隐私模式包装器 */
.privacy-mode-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

/* 隐私模式控制区域 */
.privacy-mode-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.privacy-mode-control:hover {
  background-color: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 隐私模式标签样式 */
.privacy-mode-label {
  font-size: 0.85rem;
  color: var(--color-text-yellow);
  font-weight: 500;
  white-space: nowrap;
}

/* 自定义开关样式 */
.custom-switch {
  position: relative;
  width: 36px;
  height: 18px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.custom-switch.switch-on {
  background-color: #FFCC00;
  border-color: #FFCC00;
  box-shadow: 0 0 6px rgba(255, 204, 0, 0.5);
}

.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.switch-on .switch-thumb {
  left: calc(100% - 14px);
}



/* 计划列表样式 - 苹果风格 */
.tech-plan-list {
  margin: 0;
  padding: 0 20px;
  list-style: none;
  max-height: 500px;
  overflow-y: auto;
}

.tech-plan-item {
  padding: 16px;
  margin-bottom: 12px;
  background-color: rgba(74, 106, 138, 0.05); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 10px;
  border: 1px solid var(--color-border-gray);
  transition: all var(--transition-normal) ease;
  cursor: grab;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tech-plan-item:hover {
  transform: translateY(-2px);
  background-color: rgba(74, 106, 138, 0.08); /* 使用 #4A6A8A 作为悬停底纹 */
  box-shadow: var(--card-shadow);
}

.tech-plan-item.dragging {
  opacity: 0.7;
  transform: scale(0.98);
  box-shadow: var(--card-shadow-hover);
}

.tech-plan-item.completed {
  background-color: rgba(106, 141, 127, 0.05); /* 低饱和度青绿色背景 */
  border: 1px solid rgba(106, 141, 127, 0.3); /* 低饱和度青绿色边框 */
}

.tech-plan-item:not(.completed) {
  border: 1px solid rgba(90, 122, 154, 0.3); /* 低饱和度蓝灰色边框 */
}

.tech-plan-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.tech-plan-checkbox-container {
  position: relative;
  margin-right: 14px;
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
  width: 22px;
  height: 22px;
  background-color: transparent;
  border: 2px solid var(--color-accent-blue);
  border-radius: 6px;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
}

.tech-plan-checkbox-label:hover {
  background-color: rgba(10, 132, 255, 0.1);
}

.tech-plan-checkbox:checked + .tech-plan-checkbox-label {
  background-color: var(--color-accent-green);
  border-color: var(--color-accent-green);
}

.tech-plan-checkbox:checked + .tech-plan-checkbox-label::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 11px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.tech-plan-text-container {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.tech-plan-text {
  font-size: 0.95rem;
  color: var(--color-text-white);
  transition: all var(--transition-fast) ease;
  line-height: 1.4;
  font-weight: 400;
}

.tech-plan-item.completed .tech-plan-text {
  text-decoration: line-through;
  color: var(--color-text-gray);
}

.tech-plan-status {
  font-size: 0.7rem;
  color: var(--color-text-white);
  background-color: var(--color-accent-green);
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 6px;
  font-weight: 500;
  width: fit-content;
  letter-spacing: 0.02em;
}

.tech-plan-status.pending {
  background-color: var(--color-accent-blue);
  color: var(--color-text-white);
}

.tech-plan-delete-btn {
  background: none;
  border: none;
  color: var(--color-text-gray);
  cursor: pointer;
  padding: 6px;
  transition: all var(--transition-fast) ease;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  min-height: 32px;
  min-width: 32px;
}

.tech-plan-delete-btn:hover {
  color: var(--color-accent-red);
  background-color: rgba(255, 69, 58, 0.1);
}

.tech-plan-delete-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 任务删除按钮样式 - 与计划删除按钮保持一致 */
.delete-task-btn {
  background: none;
  border: none;
  color: var(--color-text-gray);
  cursor: pointer;
  padding: 6px;
  transition: all var(--transition-fast) ease;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  min-height: 32px;
  min-width: 32px;
}

.delete-task-btn:hover {
  color: var(--color-accent-red);
  background-color: rgba(255, 69, 58, 0.1);
}

.delete-task-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 计划控制区域 - 苹果风格 */
.plan-control {
  display: flex;
  margin-bottom: 16px;
  margin-top: 8px;
  position: relative;
  background-color: var(--color-input-gray);
  border-radius: 8px;
  overflow: hidden;
  transition: all var(--transition-fast) ease;
  border: 1px solid var(--color-border-gray);
  height: 40px;
  margin-left: 20px;
  margin-right: 20px;
  padding: 0;
}

.plan-control:focus-within {
  border-color: var(--color-accent-blue-dim);
  box-shadow: 0 0 0 1px rgba(74, 106, 138, 0.3);
}

.plan-input {
  flex: 1;
  border: none !important;
  border-radius: 8px 0 0 8px !important;
  font-size: 0.95rem !important;
  background-color: transparent !important;
  color: var(--color-text-white) !important;
  transition: all var(--transition-fast) ease !important;
  height: 100% !important;
  box-shadow: none !important;
  padding: 0 14px !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
}

.plan-input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.add-plan-btn {
  background-color: var(--color-accent-blue);
  color: var(--color-text-white);
  border: none;
  width: 40px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 8px 8px 0;
  height: 100%;
  font-weight: 600;
  line-height: 1;
  padding: 0;
  margin-right: 0;
}

.add-plan-btn:hover {
  background-color: var(--color-accent-blue-dim);
  filter: brightness(1.1);
}

.add-plan-btn:active {
  transform: scale(0.98);
}

.plus-icon {
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  transition: all var(--transition-normal) ease;
}

/* 侧边栏容器 */
.sidebar-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 空状态消息 */
.empty-message {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-style: italic;
  font-weight: 400;
}

/* 控制按钮容器 */
.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  position: relative;
  z-index: 10; /* 确保按钮在最上层 */
}

/* 按钮内容样式 - 确保文字可点击 */
.button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 确保事件穿透到按钮 */
}

/* 输入容器 - 两列布局 - 苹果风格 */
.input-container {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  width: 100%;
  align-items: stretch; /* 确保子元素高度一致 */
}

/* 输入列 */
.input-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 计时器容器 - 确保不遮挡按钮 */
.timer-container {
  position: relative;
  margin-bottom: 24px;
  z-index: 1; /* 确保不会遮挡按钮 */
  pointer-events: none; /* 防止遮挡按钮点击 */
}

.timer-container > * {
  pointer-events: auto; /* 恢复计时器本身的点击事件 */
}

.task-input-section {
  padding: 12px;
  background-color: rgba(90, 122, 154, 0.05); /* 低饱和度蓝灰色背景 */
  border-radius: 10px;
  border: 1px solid rgba(90, 122, 154, 0.2); /* 低饱和度蓝灰色边框 */
  box-shadow: var(--card-shadow);
  transition: all var(--transition-fast) ease;
  display: flex;
  flex-direction: column;
  height: 50px; /* 更窄的高度 */
  margin-top: 0; /* 添加顶部边距 */
  flex: 1;
}

.time-input-section {
  padding: 12px;
  background-color: rgba(106, 141, 127, 0.05); /* 低饱和度青绿色背景 */
  border-radius: 10px;
  border: 1px solid rgba(106, 141, 127, 0.2); /* 低饱和度青绿色边框 */
  box-shadow: var(--card-shadow);
  transition: all var(--transition-fast) ease;
  display: flex;
  flex-direction: column;
  height: 50px; /* 更窄的高度 */
  flex: 1;
  margin-top: 0; /* 添加顶部边距 */
}

.task-input-section:focus-within, .time-input-section:focus-within {
  border-color: rgba(90, 122, 154, 0.4); /* 低饱和度蓝灰色边框 - 聚焦状态 */
  background-color: rgba(90, 122, 154, 0.08); /* 稍微深一点的背景 - 聚焦状态 */
}

.input-label {
  color: var(--color-text-light-gray);
  font-weight: 500;
  margin-bottom: 8px;
  display: block;
  font-size: 0.9rem;
}

/* 输入框样式 */
.task-input, .time-input {
  border: none !important;
  background-color: transparent !important;
  height: 100% !important;
  padding: 0 8px !important;
  color: var(--color-text-white) !important;
  font-size: 0.95rem !important;
}

.task-input:focus, .time-input:focus {
  outline: none !important;
  box-shadow: none !important;
}
</style>
