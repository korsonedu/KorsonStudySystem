import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Task as TaskType } from '../types/task'
import { taskService } from '../shared/services/taskService'
import eventBus, { EVENT_NAMES } from '../utils/eventBus'

// 进行中的任务存储（每个用户最多一个）
const ongoingTasks = ref<Map<number, TaskType | null>>(new Map())
// 已完成的任务存储（每个用户一个数组）
const completedTasks = ref<Map<number, TaskType[]>>(new Map())
// 用户统计信息
const userStats = ref<Map<number, { totalCompleted: number; totalDuration: number }>>(new Map())
// 加载状态
const loadingStates = ref<Map<number, boolean>>(new Map())
// 错误信息
const errorStates = ref<Map<number, string>>(new Map())

export const useTaskStatusStore = defineStore('taskStatus', () => {
  // 初始化用户状态
  const initUserState = (userId: number) => {
    console.log('初始化用户状态:', userId)
    if (!loadingStates.value.has(userId)) {
      loadingStates.value.set(userId, false)
    }
    if (!errorStates.value.has(userId)) {
      errorStates.value.set(userId, '')
    }
    if (!userStats.value.has(userId)) {
      userStats.value.set(userId, { totalCompleted: 0, totalDuration: 0 })
    }
    if (!completedTasks.value.has(userId)) {
      completedTasks.value.set(userId, [])
    }
    if (!ongoingTasks.value.has(userId)) {
      ongoingTasks.value.set(userId, null)
    }
  }

  // 获取用户进行中的任务
  const getOngoingTask = (userId: number) => {
    const task = ongoingTasks.value.get(userId)
    console.log('获取用户进行中任务:', userId, task)
    return task || null
  }

  // 获取用户已完成的任务
  const getCompletedTasks = (userId: number) => {
    const tasks = completedTasks.value.get(userId) || []
    console.log('获取用户已完成任务:', userId, tasks)
    return tasks
  }

  // 获取用户统计信息
  const getUserStats = (userId: number) => {
    const stats = userStats.value.get(userId) || { totalCompleted: 0, totalDuration: 0 }
    console.log('获取用户统计信息:', userId, stats)
    return stats
  }

  // 获取用户加载状态
  const getLoadingState = (userId: number) => {
    return loadingStates.value.get(userId) || false
  }

  // 获取用户错误信息
  const getErrorState = (userId: number) => {
    return errorStates.value.get(userId) || ''
  }

  // 判断任务是否已完成
  const isTaskCompleted = (task: TaskType) => {
    return task.completed || !!task.endTime || task.status === 'completed'
  }

  // 判断任务是否正在进行
  const isTaskOngoing = (task: TaskType) => {
    return !isTaskCompleted(task) && (!!task.startTime || task.status === 'ongoing')
  }

  // 处理任务开始
  const handleTaskStart = (task: TaskType, userId: number) => {
    console.log('处理任务开始:', { task, userId })
    initUserState(userId)
    ongoingTasks.value.set(userId, task)
    // 从已完成任务中移除（如果存在）
    const completed = completedTasks.value.get(userId) || []
    completedTasks.value.set(userId, completed.filter(t => t.id !== task.id))
  }

  // 处理任务完成
  const handleTaskComplete = (task: TaskType, userId: number) => {
    console.log('处理任务完成:', { task, userId })
    initUserState(userId)
    // 从进行中任务移除
    ongoingTasks.value.set(userId, null)
    
    // 添加到已完成任务列表
    const completed = completedTasks.value.get(userId) || []
    completed.unshift(task)
    completedTasks.value.set(userId, completed)

    // 更新统计信息
    const stats = userStats.value.get(userId) || { totalCompleted: 0, totalDuration: 0 }
    stats.totalCompleted++
    stats.totalDuration += task.duration || 0
    userStats.value.set(userId, stats)
  }

  // 处理任务更新消息
  const handleTaskUpdate = (message: { action: string; task: TaskType; sender_id: number }) => {
    const { action, task, sender_id } = message
    console.log('处理任务更新消息:', { action, task, sender_id })

    if (action === 'started') {
      handleTaskStart(task, sender_id)
    } else if (action === 'completed') {
      handleTaskComplete(task, sender_id)
    }
  }

  // 获取用户任务信息
  const fetchUserTasks = async (userId: number) => {
    if (loadingStates.value.get(userId)) {
      console.log('已有正在进行的请求，等待完成，用户ID:', userId)
      return
    }

    console.log('开始获取用户任务信息:', userId)
    initUserState(userId)
    loadingStates.value.set(userId, true)
    errorStates.value.set(userId, '')

    try {
      const todayTasks = await taskService.getTodayTasks()
      console.log('获取到今日任务列表:', todayTasks)
      
      const userTasks = todayTasks.filter((task: TaskType) => {
        const taskUserId = task.userId || task.user_id
        return taskUserId === userId
      })
      console.log('过滤出用户任务:', userTasks)

      // 重置用户状态
      ongoingTasks.value.set(userId, null)
      completedTasks.value.set(userId, [])
      userStats.value.set(userId, { totalCompleted: 0, totalDuration: 0 })

      // 处理每个任务
      userTasks.forEach((task: TaskType) => {
        console.log('处理任务:', task)
        if (isTaskCompleted(task)) {
          handleTaskComplete(task, userId)
        } else if (isTaskOngoing(task)) {
          handleTaskStart(task, userId)
        }
      })

      // 打印最终状态
      console.log('用户任务状态更新完成:', {
        userId,
        ongoingTask: ongoingTasks.value.get(userId),
        completedTasks: completedTasks.value.get(userId),
        stats: userStats.value.get(userId)
      })
    } catch (error: any) {
      console.error('获取用户任务信息失败:', error)
      errorStates.value.set(userId, error.response?.data?.detail || error.message || '获取数据失败')
    } finally {
      loadingStates.value.set(userId, false)
    }
  }

  // 刷新所有用户数据
  const refreshAllUsers = async () => {
    console.log('刷新所有用户数据')
    const userIds = Array.from(ongoingTasks.value.keys())
    await Promise.all(userIds.map(userId => fetchUserTasks(userId)))
  }

  // 启动定期刷新
  const startPeriodicRefresh = () => {
    const interval = setInterval(() => {
      refreshAllUsers()
    }, 60000) // 每分钟刷新一次

    return () => clearInterval(interval)
  }

  return {
    getOngoingTask,
    getCompletedTasks,
    getUserStats,
    getLoadingState,
    getErrorState,
    fetchUserTasks,
    handleTaskUpdate,
    refreshAllUsers,
    startPeriodicRefresh
  }
}) 