<template>
  <div class="task-list">
    <h2>任务记录 📝</h2>
    <ul id="taskRecords">
      <li v-for="task in tasks" :key="task.id" class="task-record">
        <div class="record-grid">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-duration">{{ task.duration }}分钟</span>
          <span class="time-range">
            {{ new Date(task.start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }} -
            {{ new Date(task.end).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
          </span>
          <span class="task-date">
            {{ new Date(task.end).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) }}
          </span>
          <button class="delete-btn" @click="deleteTask(task.id)">🗑️</button>
        </div>
      </li>
    </ul>
    <div class="summary">
      <p>今日学习时长: <span>{{ dailyTotal }}</span> 分钟</p>
      <p>总学习时长: <span>{{ totalTime }}</span> 小时</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      tasks: []
    };
  },
  computed: {
    dailyTotal() {
      const now = new Date();
      const today = now.toDateString();
      return this.tasks
        .filter(task => new Date(task.end).toDateString() === today)
        .reduce((sum, task) => sum + task.duration, 0);
    },
    totalTime() {
      return this.tasks.reduce((sum, task) => sum + task.duration, 0) / 60;
    }
  },
  created() {
    this.fetchTasks();
  },
  methods: {
    async fetchTasks() {
      try {
        const response = await axios.get('/api/tasks');
        this.tasks = response.data.tasks;
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    },
    async deleteTask(id) {
      try {
        await axios.delete(`/api/tasks/${id}`);
        this.tasks = this.tasks.filter(task => task.id !== id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  }
}
</script>

<style scoped>
.task-list {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.task-record {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.task-record:last-child {
  border-bottom: none;
}

.record-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 1fr auto;
  gap: 15px;
  align-items: center;
}

.task-name {
  font-weight: 500;
}

.task-duration {
  color: #3498db;
}

.task-date {
  text-align: right;
}

.delete-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 18px;
}

.summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>