import { defineStore } from 'pinia';
import { taskService } from '../shared/services/taskService';
import { APP_CONFIG } from '../config';
import eventBus, { EVENT_NAMES } from '../utils/eventBus';
import { useUserStore } from './userStore';

// 任务类型定义
export interface Task {
  id?: number;
  name: string;
  duration: number;
  completed: boolean;
  start: string;
  end?: string;
  [key: string]: any;
}

// 定义番茄钟状态存储
export const usePomodoroStore = defineStore('pomodoro', {
  // 状态
  state: () => ({
    taskName: '',
    taskTime: APP_CONFIG.DEFAULT_POMODORO_TIME,
    isRunning: false,
    totalSeconds: APP_CONFIG.DEFAULT_POMODORO_TIME * 60,
    progress: 0,
    taskStartTime: null as Date | null,
    isLoading: false,
    error: '',
    timerId: null as number | null,
  }),

  // 计算属性
  getters: {
    buttonText: (state) => state.isRunning ? '⏸️ 暂停' : '▶️ 开始',
    formattedTime: (state) => {
      const minutes = Math.floor(state.totalSeconds / 60);
      const seconds = state.totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
  },

  // 操作
  actions: {
    /**
     * 设置任务名称
     * @param name 任务名称
     */
    setTaskName(name: string) {
      this.taskName = name;
    },

    /**
     * 设置任务时间
     * @param time 任务时间（分钟）
     */
    setTaskTime(time: number) {
      // 确保时间不超过120分钟
      if (time > 120) {
        time = 120;
      }

      this.taskTime = time;

      // 只在非运行状态下更新总秒数
      if (!this.isRunning) {
        this.totalSeconds = time * 60;
      }
    },

    /**
     * 清除计时器
     */
    clearTimer() {
      if (this.timerId !== null) {
        window.clearInterval(this.timerId);
        this.timerId = null;
      }
    },

    /**
     * 启动计时器
     */
    startTimer() {
      // 清除现有计时器
      this.clearTimer();

      // 记录开始时间和初始总秒数
      const startTime = Date.now();
      const initialSeconds = this.totalSeconds;

      // 创建新计时器
      this.timerId = window.setInterval(() => {
        // 如果不在运行状态，清除计时器
        if (!this.isRunning) {
          this.clearTimer();
          return;
        }

        // 计算剩余时间
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = Math.max(initialSeconds - elapsedSeconds, 0);

        // 更新剩余时间
        this.totalSeconds = newRemaining;

        // 更新进度条
        this.progress = 100 - (newRemaining / (this.taskTime * 60) * 100);

        // 如果时间到了，触发完成事件
        if (newRemaining <= 0) {
          this.clearTimer();
          this.isRunning = false;
          this.completeTask();
        }
      }, 500);
    },

    /**
     * 开始/暂停计时器
     */
    toggleTimer() {
      // 如果当前未运行，且要开始计时，需要检查时间是否有效
      if (!this.isRunning) {
        // 检查是否设置了有效的时间
        if (!this.taskTime || this.taskTime <= 0) {
          return false;
        }

        // 确保时间不超过120分钟
        if (this.taskTime > 120) {
          this.taskTime = 120;
        }

        // 更新总秒数
        this.totalSeconds = this.taskTime * 60;

        // 记录开始时间
        this.taskStartTime = new Date();

        // 切换运行状态
        this.isRunning = true;

        // 启动计时器
        this.startTimer();
      } else {
        // 暂停计时
        this.isRunning = false;
        this.clearTimer();
      }

      return true;
    },

    /**
     * 重置计时器
     */
    resetTimer() {
      // 停止计时器
      this.isRunning = false;
      this.clearTimer();

      // 清空任务名称
      this.taskName = '';

      // 重置开始时间
      this.taskStartTime = null;

      // 重置为默认时间
      this.taskTime = APP_CONFIG.DEFAULT_POMODORO_TIME;
      this.totalSeconds = this.taskTime * 60;

      // 重置进度条
      this.progress = 0;
    },

    /**
     * 完成任务
     */
    async completeTask() {
      if (!this.taskName.trim()) {
        return false;
      }

      this.isLoading = true;
      this.error = '';

      try {
        // 获取当前时间
        const currentTime = new Date();

        // 计算实际持续时间（分钟）
        let taskDuration = this.taskTime;

        // 如果有开始时间，计算实际持续时间
        if (this.taskStartTime) {
          const durationMs = currentTime.getTime() - this.taskStartTime.getTime();
          taskDuration = Math.round(durationMs / (1000 * 60));
        }

        // 格式化日期为后端API需要的格式
        const formatDateForBackend = (date: Date) => {
          return date.toISOString();
        };

        // 确保任务数据符合后端API要求
        const newTask: Task = {
          name: this.taskName,
          duration: taskDuration,
          completed: true,
          start: formatDateForBackend(this.taskStartTime || currentTime),
          end: formatDateForBackend(currentTime)
        };

        // 使用任务服务保存任务
        const savedTask = await taskService.addTask(newTask);

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
            }
          };

          // 通过EventBus广播任务完成事件
          eventBus.emit(EVENT_NAMES.TASK_COMPLETED, taskWithUser);
        }

        // 重置计时器
        this.resetTimer();

        return true;
      } catch (err: any) {
        console.error('完成任务失败:', err);
        this.error = err.response?.data?.detail || '完成任务失败';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 从课程页面启动番茄钟
     * @param courseName 课程名称
     * @param duration 持续时间（分钟）
     */
    startFromCourse(courseName: string, duration: number = APP_CONFIG.DEFAULT_POMODORO_TIME): boolean {
      // 重置当前计时器
      this.resetTimer();

      // 设置任务名称和时间
      this.setTaskName(courseName);
      this.setTaskTime(duration);

      // 启动计时器
      return this.toggleTimer();
    },
  },
});
