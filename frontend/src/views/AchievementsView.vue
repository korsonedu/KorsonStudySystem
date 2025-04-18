<template>
    <div class="container">
      <header>
        <h1>学习成就 🏅</h1>
        <button @click="navigateTo('home')">← 返回看板</button>
      </header>
  
      <div class="achievements-grid" id="achievementsContainer">
        <div v-for="(config, id) in achievements" :key="id" class="achievement-card" :class="{ unlocked: state[id].level > 0 }">
          <div class="card-header">
            <h3>{{ config.title }}</h3>
            <div class="status">{{ state[id].level > 0 ? '✅ 已解锁' : '🔒 未解锁' }}</div>
          </div>
          <div class="progress-container">
            <div class="progress-bar" :style="{ width: `${(state[id].level / config.levels.length) * 100}%` }"></div>
          </div>
          <div class="levels-container">
            <div v-for="(level, index) in config.levels" :key="index" class="level" :class="{ unlocked: index < state[id].level }">
              <span class="level-number">Lv.{{ index + 1 }}</span>
              <span class="level-desc">{{ level.desc }}</span>
              <span class="level-status">{{ index < state[id].level ? '✅' : '🔒' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        achievements: {
          beginner: {
            title: '🎓 入门学者',
            levels: [
              { desc: '完成3次学习任务' },
              { desc: '完成10次学习任务' },
              { desc: '完成30次学习任务' }
            ]
          },
          serious: {
            title: '⏳ 认真一刻',
            levels: [
              { desc: '完成至少1分钟的学习' },
              { desc: '完成至少15分钟的学习' },
              { desc: '完成至少60分钟的学习' }
            ]
          }
        },
        state: {
          beginner: { level: 0 },
          serious: { level: 0 }
        }
      };
    },
    created() {
      this.fetchAchievements();
    },
    methods: {
      navigateTo(path) {
        this.$router.push(path);
      },
      fetchAchievements() {
        // 从后端获取成就数据
        this.axios.get('/achievements')
          .then(response => {
            this.state = response.data;
          })
          .catch(error => {
            console.error('Error fetching achievements:', error);
          });
      }
    }
  }
  </script>
  
  <style scoped>
  /* 组件样式 */
  </style>