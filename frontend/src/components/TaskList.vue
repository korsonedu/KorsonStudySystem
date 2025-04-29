<template>
    <div class="task-list">
      <h2>任务记录 📝</h2>
      <div class="summary">
        <span>今日学习：{{ dailyTotal }}分钟</span>
        <span>总计：{{ totalHours }}小时</span>
      </div>
      <ul v-if="tasks.length">
        <li v-for="task in tasks" :key="task.id" class="task-item">
          <div class="task-info">
            <span class="task-name">{{ task.name }}</span>
            <span class="task-duration">{{ task.duration }}分钟</span>
            <span class="task-time">{{ formatTime(task.end) }}</span>
          </div>
          <button @click="$emit('delete-task', task.id)" class="delete-btn">🗑️</button>
        </li>
      </ul>
      <div v-else class="empty-state">暂无任务记录</div>
    </div>
  </template>
  
  <script>
  import { mapGetters } from 'vuex'
  
  export default {
    props: ['tasks'],
    computed: {
      ...mapGetters(['dailyTotal', 'totalHours'])
    },
    methods: {
      formatTime(isoString) {
        const date = new Date(isoString)
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .task-list {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 15px;
  
    h2 {
      margin: 0 0 15px;
      font-size: 1.3rem;
    }
  }
  
  .task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
  
    &:last-child {
      border-bottom: none;
    }
  }
  
  .task-info {
    flex: 1;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 10px;
  }
  
  .task-name {
    font-weight: 500;
  }
  
  .task-duration {
    color: var(--secondary-color);
    font-weight: bold;
  }
  
  .task-time {
    color: #666;
    font-size: 0.9em;
  }
  
  .delete-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    padding: 5px;
    
    &:hover {
      opacity: 0.8;
    }
  }
  
  .empty-state {
    text-align: center;
    color: #666;
    padding: 20px;
  }
  
  .summary {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    color: #666;
    font-size: 0.9em;
  }
  </style>