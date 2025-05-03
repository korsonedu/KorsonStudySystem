<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
// 使用直接API存储服务
// @ts-ignore
import { taskService } from '../../../shared/services/taskService'
// @ts-ignore
import { planService } from '../../../shared/services/planService'
// @ts-ignore
import { userService } from '../../../shared/services/userService'
import CircularTimer from '../../../shared/components/CircularTimer.vue'
import ShareButton from '../../../shared/components/ShareButton.vue'
import DebugPanel from '../../../shared/components/DebugPanel.vue'
import { STORAGE_CONFIG, SERVER_CONFIG } from '../../../config'
// 导入工具函数
// @ts-ignore
import { formatDate, formatTime } from '../../../shared/utils/dateUtils'
// @ts-ignore
import { getPlanId, sortPlansByCompletionAndDate, filterTodayPlans } from '../../../shared/utils/sortUtils'
// @ts-ignore
import { executeWithRetry, logErrorOnly } from '../../../shared/utils/errorUtils'

// State for Pomodoro timer
const taskName = ref('')
const taskTime = ref(25)
const timer = ref('25:00')
const isRunning = ref(false)
const intervalId = ref<number | null>(null)
const totalSeconds = ref(25 * 60)
const buttonText = computed(() => isRunning.value ? '⏸️ 暂停' : '▶️ 开始')

// 检查当前用户是否是 testuser
const isTestUser = computed(() => {
  return userService.currentUser.value?.username === 'testuser'
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

// 调试模式 - 只对 testuser 可见
const debugMode = ref(false)
const toggleDebugMode = () => {
  // 使用计算属性检查是否是 testuser
  if (!isTestUser.value) {
    console.warn('Debug mode is only available for testuser')
    return
  }

  debugMode.value = !debugMode.value
  if (debugMode.value) {
    // 当开启调试模式时，显示更多信息
    updateCurrentUser()
    console.log('Debug mode enabled')
  }
}

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

  console.log('Drag started with plan:', plan, 'ID:', planId)
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
    console.log('Stored dragged plan ID:', planId)
  } else {
    currentDraggedPlanId.value = null
  }

  // 设置任务名称
  taskName.value = planText
  console.log('Plan dropped into task input:', planText, 'with ID:', planId)
}

// 当前用户信息
const currentUser = ref('')
const tokenInfo = ref('')
const apiStatus = ref('')
const updateCurrentUser = () => {
  const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY)
  const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)
  currentUser.value = username || '未登录'
  tokenInfo.value = token ? `${token.substring(0, 15)}...` : '无令牌'
  console.log('Current user:', username, 'Has token:', !!token)
  if (token) {
    console.log('Token preview:', token.substring(0, 20) + '...')
  }
}

// 检查可用的API端点 - 仅供调试使用
const checkAPIEndpoints = async () => {
  if (!isTestUser.value) return

  planError.value = '检查API端点中...'

  try {
    // 使用配置文件中的服务器配置
    const backendUrl = SERVER_CONFIG.BACKEND.URL;

    // 尝试主要API端点
    const endpoints = [
      '/api/tasks',
      '/api/plans',
      '/api/auth/me'
    ]

    let foundEndpoints = []

    for (const endpoint of endpoints) {
      try {
        planError.value = `测试端点: ${endpoint}...`
        const response = await fetch(endpoint)

        foundEndpoints.push({
          url: endpoint,
          status: response.status,
          statusText: response.statusText
        })
      } catch (err) {
        console.error(`Error checking endpoint ${endpoint}:`, err)
      }
    }

    if (foundEndpoints.length > 0) {
      planError.value = `API端点状态:\n${foundEndpoints.map(e => `${e.url}: ${e.status} ${e.statusText}`).join('\n')}`
    } else {
      planError.value = '未找到任何可用的API端点'
    }

    // 3秒后清除消息
    setTimeout(() => {
      planError.value = ''
    }, 3000)
  } catch (err: any) {
    console.error('API endpoint check failed:', err)
    planError.value = `检查失败: ${err.message}`

    // 3秒后清除错误消息
    setTimeout(() => {
      planError.value = ''
    }, 3000)
  }
}

// 清空计划
const clearPlans = async () => {
  try {
    planError.value = '正在清空计划...'

    // 使用直接API存储服务获取所有计划
    const allPlans = await planService.getAllPlans()
    console.log('Plans to clear:', allPlans.length)

    // 删除每个计划
    let deletedCount = 0
    for (let i = 0; i < allPlans.length; i++) {
      const plan = allPlans[i]

      // 检查是否是有效的对象
      if (!plan || typeof plan !== 'object') {
        console.error(`Invalid plan at index ${i}:`, plan)
        continue
      }

      try {
        // 检查计划ID的位置
        // 使用类型断言来避免TypeScript错误
        const planId = plan.id || (plan as any)._id || (plan as any).planId

        if (!planId) {
          console.error(`Plan at index ${i} has no valid ID:`, plan)
          continue
        }

        // 使用直接API存储服务删除计划
        await planService.deletePlan(planId)
        console.log(`Deleted plan ${planId}`)
        deletedCount++
      } catch (err) {
        console.error(`Failed to delete plan at index ${i}:`, plan, err)
      }
    }

    // 刷新计划列表
    await fetchPlans()

    planError.value = `成功清空 ${deletedCount} 个计划`
    setTimeout(() => {
      planError.value = ''
    }, 3000)
  } catch (err: any) {
    console.error('Error clearing plans:', err)
    planError.value = `清空计划失败: ${err.message}`
  }
}

// 测试API连接 - 仅供调试使用
const testApiConnection = async () => {
  if (!isTestUser.value) return

  apiStatus.value = '测试中...'

  try {
    // 测试基本连接
    apiStatus.value = '测试后端连接...'

    // 测试认证
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)
    if (!token) {
      apiStatus.value = '错误: 无认证令牌'
      return
    }

    // 获取用户信息
    const userResponse = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!userResponse.ok) {
      apiStatus.value = `认证失败: 状态码 ${userResponse.status}`
      return
    }

    const userData = await userResponse.json()
    apiStatus.value = `认证成功: 用户ID ${userData.id}, 用户名 ${userData.username}`

    // 3秒后清除消息
    setTimeout(() => {
      apiStatus.value = ''
    }, 3000)
  } catch (err: any) {
    console.error('API test failed:', err)
    apiStatus.value = `错误: ${err.message}`

    // 3秒后清除错误消息
    setTimeout(() => {
      apiStatus.value = ''
    }, 3000)
  }
}

// 记录实际开始时间
const taskStartTime = ref<Date | null>(null)

// Start/Pause timer
const toggleTimer = () => {
  if (isRunning.value) {
    // Pause timer
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
    isRunning.value = false
  } else {
    // Start timer
    isRunning.value = true
    // 记录开始时间
    if (!taskStartTime.value) {
      taskStartTime.value = new Date()
      console.log('Task started at:', taskStartTime.value)
    }

    intervalId.value = setInterval(() => {
      if (totalSeconds.value > 0) {
        totalSeconds.value--
        updateTimerDisplay()
      } else {
        completeTask()
      }
    }, 1000) as unknown as number
  }
}

// Update timer display
const updateTimerDisplay = () => {
  const minutes = Math.floor(totalSeconds.value / 60)
  const seconds = totalSeconds.value % 60
  timer.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Reset timer
const resetTimer = () => {
  console.log('Reset timer called')
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  isRunning.value = false

  // 清空任务名称
  taskName.value = ''

  // 重置开始时间
  taskStartTime.value = null

  // 重置为默认25分钟
  taskTime.value = 25
  totalSeconds.value = taskTime.value * 60
  updateTimerDisplay()

  console.log('Timer reset to 25 minutes')
}

// Complete current task
const completeTask = async () => {
  console.log('Complete task called')

  // 停止计时器
  isRunning.value = false
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }

  // 检查任务名称
  if (taskName.value.trim() === '') {
    // 不显示错误提示，提升界面流畅感
    return
  }

  try {
    // 不设置加载状态，提升界面流畅感
    error.value = ''
    console.log('Saving task:', taskName.value, 'duration:', taskTime.value)

    // 获取当前时间作为结束时间（中国时区）
    const now = new Date();
    // 转换为中国时区
    const currentTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);

    // 使用实际开始时间，如果没有则使用当前时间
    let startTime;
    if (taskStartTime.value) {
      // 转换为中国时区
      startTime = new Date(taskStartTime.value.getTime() + (taskStartTime.value.getTimezoneOffset() + 480) * 60000);
    } else {
      startTime = currentTime;
    }

    console.log('Task start time (China timezone):', startTime, 'End time (China timezone):', currentTime);

    // 计算实际持续时间（分钟）
    const actualDurationMs = currentTime.getTime() - startTime.getTime();
    const actualDurationMinutes = Math.ceil(actualDurationMs / (1000 * 60));
    console.log('Actual duration:', actualDurationMinutes, 'minutes');

    // 将日期格式化为中国时区的ISO格式字符串（带+08:00后缀）
    const formatDateForBackend = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      // 格式: YYYY-MM-DDThh:mm:ss.sss+08:00
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`;
    };

    // 确保任务数据符合后端API要求
    const newTask = {
      name: taskName.value,
      duration: actualDurationMinutes, // 使用实际持续时间
      completed: true,
      start: formatDateForBackend(startTime),
      end: formatDateForBackend(currentTime)
      // 不指定用户ID，由后端根据token自动关联当前用户
    }

    console.log('Creating task with data:', newTask)

    // 使用直接API存储服务保存任务
    const savedTask = await taskService.addTask(newTask)
    console.log('Task saved successfully:', savedTask)

    // 刷新任务列表
    await fetchTasks()

    // 如果有对应的计划ID，将该计划标记为已完成
    if (currentDraggedPlanId.value) {
      console.log('Updating plan status for ID:', currentDraggedPlanId.value)

      // 查找对应的计划
      const planToUpdate = plans.value.find(plan => {
        const planId = getPlanId(plan)
        return planId && planId.toString() === currentDraggedPlanId.value?.toString()
      })

      if (planToUpdate && !planToUpdate.completed) {
        console.log('Found plan to update:', planToUpdate)

        // 调用togglePlan方法将计划标记为已完成
        await togglePlan(planToUpdate)
        console.log('Plan marked as completed')
      } else if (planToUpdate) {
        console.log('Plan already completed, no update needed')
      } else {
        console.warn('Could not find plan with ID:', currentDraggedPlanId.value)
      }

      // 重置当前拖拽的计划ID
      currentDraggedPlanId.value = null
    }

    // Reset for next task
    resetTimer()
    taskName.value = ''
  } catch (err: any) {
    console.error('Error completing task:', err)
    if (err.response && err.response.data) {
      console.error('Error details:', err.response.data)
    }
    // 只在控制台输出错误，不显示错误消息

    // 重置当前拖拽的计划ID
    currentDraggedPlanId.value = null
  }
}

// Handle task time input change
const handleTimeChange = () => {
  if (taskTime.value < 1) taskTime.value = 1
  if (!isRunning.value) {
    totalSeconds.value = taskTime.value * 60
    updateTimerDisplay()
  }
}

// Fetch tasks using the taskService
const fetchTasks = async () => {
  try {
    // 不设置加载状态，提升界面流畅感
    error.value = ''

    // 使用直接API存储服务获取任务
    const tasks = await taskService.getAllTasks()
    console.log('Tasks loaded from API:', tasks.length)

    // 设置任务记录（已按开始时间排序）
    taskRecords.value = tasks

    // 输出详细的任务列表信息
    if (taskRecords.value.length > 0) {
      console.log('First task example:', taskRecords.value[0])
    } else {
      console.warn('No tasks available to display')
    }

    // 计算统计信息
    try {
      // 使用存储服务获取统计信息，无论是否有任务记录
      const dailyStats = await taskService.getDailyStats()
      const totalStats = await taskService.getTotalStats()

      console.log('Daily stats:', dailyStats)
      console.log('Total stats:', totalStats)

      // 设置统计数据，确保有默认值
      dailyTotal.value = dailyStats?.duration || 0
      totalHours.value = totalStats?.hours || 0
    } catch (statsErr) {
      console.error('Error fetching statistics:', statsErr)
      // 设置默认值
      dailyTotal.value = 0
      totalHours.value = 0
    }

    // 不显示成功消息，提升界面流畅感
  } catch (err: any) {
    console.error('Error in fetchTasks:', err)
    // 只在控制台输出错误，不显示错误消息

    // 初始化空数据
    taskRecords.value = []
    dailyTotal.value = 0
    totalHours.value = 0
  }
}

// Fetch plans using the planService
const fetchPlans = async () => {
  try {
    // 不设置加载状态，提升界面流畅感
    planError.value = ''

    // 使用直接API存储服务获取计划
    const plansData = await planService.getAllPlans()
    console.log('Plans loaded from API:', plansData.length)

    // 输出计划数据信息
    if (plansData.length > 0) {
      console.log('First plan example:', plansData[0])
    } else {
      console.warn('No plans available to display')
    }

    // 使用工具函数过滤出今天的计划
    const todayPlans = filterTodayPlans(plansData)
    console.log('Today\'s plans:', todayPlans.length)

    // 使用工具函数对计划进行排序
    const sortedPlans = sortPlansByCompletionAndDate(todayPlans)

    plans.value = sortedPlans
  } catch (err: any) {
    console.error('Error fetching plans:', err)
    // 只在控制台输出错误，不显示错误消息

    // 即使出错，也确保初始化数据
    plans.value = []
  }
}

// Add a new plan using the planService
const addPlan = async () => {
  if (planInput.value.trim() === '') {
    // 不显示错误提示，提升界面流畅感
    return
  }

  try {
    // 不设置加载状态，提升界面流畅感
    planError.value = ''

    // 获取当前时间（中国时区）
    const now = new Date();
    const chinaTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);

    // 将日期格式化为中国时区的ISO格式字符串（带+08:00后缀）
    const formatDateForBackend = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

      // 格式: YYYY-MM-DDThh:mm:ss.sss+08:00
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`;
    };

    // 根据后端文档，使用正确的数据格式
    const newPlan = {
      text: planInput.value,  // 后端使用text字段而不是title
      completed: false,  // 完成状态
      started: false,  // 开始状态
      createdAt: formatDateForBackend(chinaTime)  // 添加创建时间字段，用于排序和过滤
    }

    console.log('Creating plan with data:', newPlan)

    // 使用直接API存储服务创建计划
    const createdPlan = await planService.addPlan(newPlan)
    console.log('Plan created successfully:', createdPlan)

    // 显示详细的计划信息，包括ID
    if (createdPlan && createdPlan.id) {
      console.log(`Plan created with ID: ${createdPlan.id}, text: ${createdPlan.text}`)
    } else {
      console.warn('Created plan has no ID or is incomplete:', createdPlan)
    }

    // 清空输入框
    planInput.value = ''

    // 在前端先添加计划，然后重新排序
    // 这样可以避免在等待API响应时的闪烁
    if (createdPlan) {
      // 添加新计划到列表
      plans.value.push(createdPlan)

      // 重新排序计划列表
      plans.value = [...plans.value].sort((a, b) => {
        // 首先按完成状态排序
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1 // 未完成的排在前面
        }

        // 然后在各自分组内按创建时间排序（如果有）
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }

        // 如果没有创建时间，保持原有顺序
        return 0
      })
    }

    // 同时在后台重新加载计划列表，确保数据同步
    fetchPlans()
  } catch (err: any) {
    console.error('Error adding plan:', err)
    // 只在控制台输出错误，不显示错误消息

    // 如果出错，重新加载计划列表以确保数据一致性
    fetchPlans()
  }
}

// 使用从工具函数导入的 getPlanId

// Toggle plan completion using the planService
const togglePlan = async (plan: any) => {
  try {
    // 不设置加载状态，提升界面流畅感
    planError.value = ''

    // 获取计划ID
    const planId = getPlanId(plan)
    if (!planId) {
      console.error('Plan has no valid ID:', plan)
      return
    }

    // 根据后端文档，使用正确的数据格式
    const updatedPlan = {
      text: plan.text || plan.title || '',  // 使用text字段，兼容title
      completed: !plan.completed,  // 切换完成状态
      started: plan.started || false  // 保持开始状态
    }

    // 使用直接API存储服务更新计划
    await planService.updatePlan(planId, updatedPlan)
    console.log('Plan updated successfully:', planId)

    // 在前端先更新计划状态，然后重新排序
    // 这样可以避免在等待API响应时的闪烁
    const planIndex = plans.value.findIndex(p => getPlanId(p) === planId)
    if (planIndex !== -1) {
      // 更新完成状态
      plans.value[planIndex].completed = !plan.completed

      // 使用工具函数重新排序计划列表
      plans.value = sortPlansByCompletionAndDate(plans.value)
    }

    // 同时在后台重新加载计划列表，确保数据同步
    fetchPlans()
  } catch (err: any) {
    console.error('Error updating plan:', err)
    // 只在控制台输出错误，不显示错误消息

    // 如果出错，重新加载计划列表以确保数据一致性
    fetchPlans()
  }
}

// Delete a plan using the planService
const deletePlan = async (planId: number | string | undefined) => {
  // 检查计划ID是否有效
  if (!planId) {
    console.error('Cannot delete plan with invalid ID:', planId)
    return
  }

  try {
    // 不设置加载状态，提升界面流畅感
    planError.value = ''

    // 使用直接API存储服务删除计划
    await planService.deletePlan(planId)
    console.log('Plan deleted successfully:', planId)

    // 重新加载计划列表
    await fetchPlans()
  } catch (err: any) {
    console.error(`Error deleting plan ${planId}:`, err)
    // 只在控制台输出错误，不显示错误消息
  }
}

// 使用从工具函数导入的 formatDate 和 formatTime

// Delete a task using the taskService
const deleteTask = async (taskId: number) => {
  if (!confirm('确定要删除这个任务吗？')) {
    return
  }

  try {
    // 不设置加载状态，提升界面流畅感
    error.value = ''

    console.log('Deleting task:', taskId)

    // 使用直接API存储服务删除任务
    await taskService.deleteTask(taskId)
    console.log('Task deleted successfully:', taskId)

    // 重新加载任务列表
    await fetchTasks()
  } catch (err: any) {
    console.error('Error deleting task:', err)
    // 只在控制台输出错误，不显示错误消息
  }
}

// Watch for changes in taskTime
watch(taskTime, (_newVal) => {
  handleTimeChange()
})

// Load data on component mount
onMounted(() => {
  console.log('Home component mounted')

  const token = localStorage.getItem('token')
  if (!token) {
    console.warn('No authentication token found, may affect data fetching')
  }

  // 更新当前用户信息
  updateCurrentUser()

  // 检查当前用户是否是 testuser，如果是则允许开启调试模式
  userService.getCurrentUser()
    .then(user => {
      if (user && user.username === 'testuser') {
        console.log('Debug mode available for testuser')
        // 不自动启用调试模式，但允许用户手动开启
      } else {
        // 确保非 testuser 用户无法开启调试模式
        debugMode.value = false
      }
    })
    .catch(err => {
      console.error('Error checking user for debug mode:', err)
    })

  // 给服务器一点启动时间后再请求数据
  setTimeout(() => {
    console.log('Initiating data fetch')

    // 使用工具函数添加重试机制
    executeWithRetry(() => fetchTasks())
    executeWithRetry(() => fetchPlans())
  }, 1000)
})

// Clean up when component is unmounted
onBeforeUnmount(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
})
</script>

<template>
  <div class="main-content">
    <main class="pomodoro-main">
      <div class="pomodoro-card">
        <div v-if="debugMode && isTestUser" class="user-info">
          <div>当前用户: {{ currentUser }}</div>
          <div>令牌信息: {{ tokenInfo }}</div>
          <div v-if="apiStatus" class="api-status">状态: {{ apiStatus }}</div>
          <div class="debug-actions">
            <button class="test-api-btn" @click="testApiConnection">测试API连接</button>
            <router-link to="/api-test" class="api-test-link">打开API测试页面</router-link>
          </div>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="time-setter"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <input
            type="text"
            v-model="taskName"
            placeholder="输入学习任务 📖"
            class="task-input"
          >
          <input
            type="number"
            v-model="taskTime"
            min="1"
            placeholder="分钟 ⏳"
            :disabled="isRunning"
          >
        </div>

        <div class="timer-container">
          <CircularTimer
            :totalSeconds="totalSeconds"
            :isRunning="isRunning"
            @timeUp="completeTask"
          />
        </div>

        <div class="controls">
          <button class="control-btn primary-btn" @click="toggleTimer" :disabled="!taskName.trim()">{{ buttonText }}</button>
          <button class="control-btn success-btn" @click="completeTask" :disabled="!taskName.trim()">✅ 结束</button>
          <button class="control-btn reset-btn" @click="resetTimer">🔄 重置</button>
        </div>
      </div>

      <div class="task-list">
        <div class="list-header">
          <h2>任务记录 📝</h2>
          <div class="header-controls">
            <button
              v-if="isTestUser"
              class="debug-btn"
              @click="toggleDebugMode"
              title="开发者调试模式"
            >
              🛠️ 调试
            </button>
          </div>
        </div>
        <p v-if="taskRecords.length === 0" class="empty-message">暂无任务记录</p>
        <ul v-else class="task-records">
          <li v-for="(task, index) in taskRecords" :key="index" class="task-record-item">
            <div class="task-record-content">
              <div class="task-record-header">
                <span class="task-name">{{ task.name }}</span>
                <button class="delete-task-btn" @click="deleteTask(task.id)" title="删除任务">❌</button>
              </div>
              <div class="task-record-details">
                <span class="task-time">
                  <span class="label">开始:</span> {{ formatTime(task.start) }}
                </span>
                <span class="task-time">
                  <span class="label">结束:</span> {{ formatTime(task.end) }}
                </span>
                <span class="task-duration">
                  <span class="label">时长:</span> {{ task.duration }} 分钟
                </span>
                <span v-if="debugMode" class="task-id">
                  <span class="label">ID:</span> {{ task.id || '无ID' }}
                </span>
              </div>
            </div>
          </li>
        </ul>
        <div class="summary">
          <p>今日学习时长: <span>{{ dailyTotal || 0 }}</span> 分钟</p>
          <p>总学习时长: <span>{{ (totalHours || 0).toFixed(2) }}</span> 小时</p>
        </div>
      </div>

      <!-- 调试面板 - 只对 testuser 可见 -->
      <DebugPanel v-if="debugMode && isTestUser" />
    </main>

    <aside class="plan-sidebar">
      <div class="sidebar-header">
        <h2>今日计划 📋</h2>
      </div>
      <div v-if="planError" class="error-message">{{ planError }}</div>

      <div v-if="debugMode && isTestUser" class="plan-debug">
        <button class="clear-plans-btn" @click="clearPlans">清空计划</button>
        <button class="check-api-btn" @click="checkAPIEndpoints">检查API端点</button>
      </div>

      <div class="plan-control">
        <input
          type="text"
          v-model="planInput"
          placeholder="添加今日计划"
          @keyup.enter="addPlan"
        >
        <button @click="addPlan" :disabled="!planInput.trim()">➕</button>
      </div>

      <p v-if="plans.length === 0" class="empty-message">暂无计划</p>
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
          <div v-if="debugMode && isTestUser" class="tech-plan-debug-info">
            ID: {{ getPlanId(plan) || '无ID' }}
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
  margin-bottom: 20px;
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

.timer-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
  transform: scale(1.5);
  flex: 1;
}

.time-setter {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 500px;
}

.time-setter {
  position: relative;
  transition: all 0.3s ease;
}

.time-setter.drag-over {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(94, 114, 228, 0.3);
  border-radius: 8px;
}

.time-setter.drag-over::after {
  content: '放置计划到这里';
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

.time-setter input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
}

.time-setter input.task-input {
  border-left: 3px solid #5e72e4;
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
  margin-top: 20px;
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

.task-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.task-records {
  margin: 0;
  padding: 0;
  list-style: none;
}

.task-record-item {
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.task-record-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-record-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.task-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
}

.task-record-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.9rem;
  color: #666;
}

.task-time, .task-duration, .task-id {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.task-id {
  color: #9b59b6;
  font-family: monospace;
}

.label {
  font-weight: 500;
  color: #888;
}

.delete-task-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.delete-task-btn:hover {
  opacity: 1;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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
  gap: 8px;
  margin-bottom: 16px;
  position: relative;
}

.plan-control input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.plan-control input:focus {
  border-color: var(--secondary-color);
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.15);
  outline: none;
}

.plan-control button {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(52, 152, 219, 0.2);
}

.plan-control button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #1a5276);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.plan-control button:disabled {
  background: linear-gradient(135deg, #bdc3c7, #95a5a6);
  cursor: not-allowed;
  box-shadow: none;
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
@media (max-width: 1024px) {
  .main-content {
    gap: 10px;
  }

  .pomodoro-card {
    padding: 30px;
  }

  .timer-container {
    transform: scale(1.3);
  }
}

/* 小平板和大手机 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }

  .plan-sidebar {
    width: 100%;
    margin-top: 20px;
  }

  .pomodoro-card {
    padding: 25px;
    min-height: 320px;
  }

  .timer-container {
    margin: 30px 0;
    transform: scale(1.2);
  }

  .controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .control-btn {
    margin: 5px;
  }
}

/* 手机设备 */
@media (max-width: 480px) {
  .main-content {
    padding: 0 10px;
  }

  .pomodoro-card, .task-list, .plan-sidebar {
    padding: 15px;
    border-radius: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .pomodoro-card {
    min-height: 300px;
  }

  .task-list {
    margin-top: 15px;
  }

  .timer-container {
    transform: scale(1);
    margin: 20px 0;
  }

  .time-setter {
    flex-direction: column;
    gap: 8px;
  }

  .task-input {
    width: 100%;
  }

  .controls {
    width: 100%;
  }

  .control-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .task-record-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .task-record-item {
    padding: 10px;
  }

  .tech-plan-item {
    padding: 10px;
  }

  .summary {
    flex-direction: column;
    gap: 5px;
  }
}

/* 小手机设备 */
@media (max-width: 360px) {
  .pomodoro-card {
    padding: 15px;
  }

  .timer-container {
    transform: scale(0.9);
  }

  .control-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
    margin: 3px;
  }
}
</style>