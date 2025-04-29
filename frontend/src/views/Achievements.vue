<template>
    <div class="achievements-container">
      <div class="header">
        <h1>学习成就系统 🏆</h1>
        <router-link to="/" class="back-btn">返回看板</router-link>
      </div>
  
      <div class="achievement-list">
        <div 
          v-for="(achievement, key) in achievementConfig"
          :key="key"
          class="achievement-card"
          :class="{ unlocked: currentLevels[key] > 0 }"
          @click="toggleDetails(key)"
        >
          <div class="card-header">
            <div class="title">
              <span class="icon">{{ achievement.icon }}</span>
              <h3>{{ achievement.title }}</h3>
            </div>
            <span class="level">Lv.{{ currentLevels[key] }}</span>
          </div>
  
          <div class="progress-bar">
            <div 
              class="progress" 
              :style="{ width: progressWidth(key) }"
            ></div>
          </div>
  
          <transition name="expand">
            <div class="level-details">
              <div 
                v-for="(level, index) in achievement.levels"
                :key="index"
                class="level"
              >
                <span class="level-icon">
                  {{ index < currentLevels[key] ? '✅' : '🔒' }}
                </span>
                <span class="description">{{ level.description }}</span>
                <span class="condition">{{ level.condition }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapState } from 'vuex'
  import { ACHIEVEMENT_CONFIG } from '@/config/achievements'
  
  export default {
    data: () => ({
      expanded: null,
      achievementConfig: ACHIEVEMENT_CONFIG
    }),
    computed: {
      ...mapState(['achievements']),
      currentLevels() {
        return Object.entries(this.achievements).reduce((acc, [key, val]) => {
          acc[key] = val.level
          return acc
        }, {})
      }
    },
    methods: {
      toggleDetails(key) {
        this.expanded = this.expanded === key ? null : key
      },
      progressWidth(key) {
        const maxLevel = this.achievementConfig[key].levels.length
        return `${(this.currentLevels[key] / maxLevel) * 100}%`
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .achievements-page {
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
  }
  
  .achievement-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  
    &.unlocked {
      border-left: 4px solid var(--secondary-color);
    }
  
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
  
    .status-badge {
      background: var(--secondary-color);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.9em;
    }
  
    .progress-bar {
      height: 4px;
      background: var(--secondary-color);
      transition: width 0.5s ease;
    }
  
    .level-details {
      margin-top: 15px;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
  
    .level {
      display: flex;
      align-items: center;
      padding: 8px;
      margin: 5px 0;
      background: rgba(52, 152, 219, 0.05);
  
      &.unlocked {
        background: rgba(46, 204, 113, 0.1);
      }
  
      .level-number {
        width: 50px;
        font-weight: bold;
      }
  
      .level-desc {
        flex: 1;
      }
  
      .level-status {
        width: 30px;
        text-align: center;
      }
    }
  }
  </style>