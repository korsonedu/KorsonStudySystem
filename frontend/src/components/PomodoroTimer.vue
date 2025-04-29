<template>
    <div class="pomodoro-card">
      <div class="time-setter">
        <input v-model="taskName" placeholder="输入学习任务 📖">
        <input v-model.number="duration" type="number" min="1" placeholder="分钟 ⏳">
      </div>
      
      <div class="timer-display">
        {{ formattedTime }}
      </div>
  
      <div class="controls">
        <button @click="toggleTimer">{{ buttonLabel }}</button>
        <button @click="completeTask">✅ 结束</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        taskName: '',
        duration: 25,
        timeLeft: 0,
        isRunning: false,
        interval: null
      };
    },
    computed: {
      formattedTime() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      },
      buttonLabel() {
        return this.isRunning ? '⏸ 暂停' : '▶️ 开始';
      }
    },
    methods: {
      toggleTimer() {
        if (!this.validateInput()) return;
        
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
          this.startTimer();
        } else {
          clearInterval(this.interval);
        }
      },
      startTimer() {
        if (this.timeLeft <= 0) {
          this.timeLeft = this.duration * 60;
        }
        this.interval = setInterval(() => {
          if (this.timeLeft <= 0) {
            this.completeTask(true);
            return;
          }
          this.timeLeft--;
        }, 1000);
      },
      completeTask(auto = false) {
        // 触发任务完成逻辑
      }
    }
  };
  </script>