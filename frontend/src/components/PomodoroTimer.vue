<template>
  <div class="pomodoro-card">
    <div class="time-setter">
      <input type="text" v-model="taskName" placeholder="输入学习任务 📖">
      <input type="number" v-model.number="taskTime" min="1" placeholder="分钟 ⏳">
    </div>
    <div class="timer-display">
      <span>{{ timerDisplay }}</span>
    </div>
    <div class="controls">
      <button @click="startTimer">{{ isRunning ? '⏸ 暂停' : '▶️ 开始' }}</button>
      <button @click="completeTask" :disabled="!isRunning">✅ 结束</button>
      <button @click="resetTimer">🔄 重置</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      taskName: '',
      taskTime: 25,
      isRunning: false,
      timeLeft: null,
      originalDuration: 0,
      timer: null
    };
  },
  computed: {
    timerDisplay() {
      if (this.timeLeft === null) {
        return '25:00';
      }
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  },
  methods: {
    startTimer() {
      if (!this.isRunning) {
        if (this.taskName.trim() === '') {
          alert('请填写学习任务名称');
          return;
        }
        if (isNaN(this.taskTime) || this.taskTime < 1) {
          alert('请输入有效的任务时间（至少1分钟）');
          return;
        }

        if (this.timeLeft === null) {
          this.originalDuration = this.taskTime * 60;
          this.timeLeft = this.originalDuration;
        }

        this.isRunning = true;
        this.timer = setInterval(() => {
          this.timeLeft--;
          if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            this.isRunning = false;
            this.completeTask(true);
          }
        }, 1000);
      } else {
        clearInterval(this.timer);
        this.isRunning = false;
      }
    },
    completeTask(autoComplete = false) {
      if (!autoComplete && !confirm('确定要提前结束当前任务吗？')) return;

      if (this.taskName && this.timeLeft !== null && this.timeLeft >= 0) {
        const actualMinutes = Math.max(1, Math.ceil((this.originalDuration - this.timeLeft) / 60));
        this.$emit('task-completed', { name: this.taskName, duration: actualMinutes });
        this.resetTimer(true);
      }
    },
    resetTimer(isCompleted = false) {
      clearInterval(this.timer);
      this.isRunning = false;
      if (!isCompleted) {
        this.taskName = '';
        this.taskTime = 25;
      }
      this.timeLeft = null;
      this.originalDuration = 0;
    }
  }
}
</script>

<style scoped>
.pomodoro-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.time-setter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.time-setter input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.timer-display {
  font-size: 4em;
  text-align: center;
  margin: 30px 0;
  font-weight: bold;
  color: #2c3e50;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.controls button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>