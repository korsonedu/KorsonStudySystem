<template>
    <div class="container">
      <header>
        <h1>学习看板 📋</h1>
        <nav>
          <router-link to="/statistics" class="nav-btn">📊 统计</router-link>
          <router-link to="/achievements" class="nav-btn">🏅 成就</router-link>
          <button class="nav-btn" @click="exportData">📄 导出</button>
        </nav>
      </header>
  
      <div class="main-content">
        <div class="pomodoro-section">
          <PomodoroTimer @task-completed="handleTaskComplete" />
          <TaskList :tasks="recentTasks" @delete-task="deleteTask" />
        </div>
  
        <PlanSidebar :plans="plans" @add-plan="addPlan" @toggle-plan="togglePlan" />
      </div>
    </div>
  </template>
  
  <script>
  import { mapState, mapMutations } from 'vuex'
  import PomodoroTimer from '@/components/PomodoroTimer.vue'
  import TaskList from '@/components/TaskList.vue'
  import PlanSidebar from '@/components/PlanSidebar.vue'
  
  export default {
    components: {
      PomodoroTimer,
      TaskList,
      PlanSidebar
    },
    computed: {
      ...mapState(['tasks', 'plans']),
      recentTasks() {
        return this.tasks.slice(0, 10)
      }
    },
    methods: {
      ...mapMutations(['ADD_PLAN', 'TOGGLE_PLAN', 'DELETE_TASK']),
      handleTaskComplete(task) {
        this.$store.commit('ADD_TASK', task)
      },
      addPlan(text) {
        this.ADD_PLAN({
          id: Date.now(),
          text: text.trim(),
          completed: false
        })
      },
      togglePlan(id) {
        this.TOGGLE_PLAN(id)
      },
      deleteTask(id) {
        this.DELETE_TASK(id)
      },
      exportData() {
        // 导出逻辑
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .main-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 30px;
    margin-top: 20px;
  }
  
  .pomodoro-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .nav-btn {
    margin-left: 10px;
    padding: 8px 16px;
    background: var(--secondary-color);
    color: white;
    border-radius: 20px;
    text-decoration: none;
  }
  </style>