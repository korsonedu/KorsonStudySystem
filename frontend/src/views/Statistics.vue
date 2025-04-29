<template>
    <div class="stats-page">
      <div class="container">
        <header class="header">
          <h1>学习数据分析中心 📊</h1>
          <router-link to="/" class="btn btn-primary">返回看板</router-link>
        </header>
        <div class="filters">
          <button
            v-for="range in ['day', 'week', 'month']"
            :key="range"
            :class="['btn', 'btn-filter', { active: selectedRange === range }]"
            @click="setRange(range)"
          >
            {{ rangeMap[range] }}
          </button>
        </div>
  
        <div class="metric-grid">
          <div class="metric-item">
            <h3>🎯 学习次数</h3>
            <div class="value">{{ filteredTasks.length }}</div>
          </div>
          <div class="metric-item">
            <h3>⏱️ 总时长</h3>
            <div class="value">{{ totalHours }} 小时</div>
          </div>
          <div class="metric-item">
            <h3>📈 日均时长</h3>
            <div class="value">{{ dailyAverage }} 分钟</div>
          </div>
          <div class="metric-item">
            <h3>⏰ 最佳时段</h3>
            <div class="value">{{ peakTime }}</div>
          </div>
          <div class="metric-item">
            <h3>📝 计划完成率</h3>
            <div class="value">{{ completionRate }}%</div>
          </div>
        </div>
  
        <div class="chart-container">
          <h3>学习时段分布</h3>
          <Heatmap :data="heatmapData" />
        </div>
        <div class="chart-container">
          <h3>学习时长分布</h3>
          <DurationChart :data="filteredTasks" />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import Heatmap from '@/components/Heatmap.vue'
  import DurationChart from '@/components/DurationChart.vue'
  
  export default {
    components: { Heatmap, DurationChart },
    computed: {
      rangeMap() {
        return {
          day: '今日',
          week: '本周',
          month: '本月'
        }
      },
      selectedRange() {
        return this.$store.state.selectedRange
      },
      filteredTasks() {
        return this.$store.getters.filteredTasks
      },
      totalHours() {
        const total = this.filteredTasks.reduce((sum, t) => sum + t.duration, 0) / 60
        return total.toFixed(1)
      },
      dailyAverage() {
        const days = new Set(this.filteredTasks.map(t => 
          new Date(t.end).toDateString()
        )).size
        return days > 0 ? (this.totalHours * 60 / days).toFixed(1) : 0
      },
      peakTime() {
        const hours = Array(24).fill(0)
        this.filteredTasks.forEach(t => {
          const h = new Date(t.end).getHours()
          hours[h] += t.duration
        })
        const peak = hours.indexOf(Math.max(...hours))
        return `${peak.toString().padStart(2, '0')}:00 - ${(peak + 1).toString().padStart(2, '0')}:00`
      },
      completionRate() {
        const taskNames = this.filteredTasks.map(t => t.name)
        const completed = this.$store.state.plans.filter(p => 
          taskNames.includes(p.text)
        ).length
        return this.$store.state.plans.length > 0 
          ? ((completed / this.$store.state.plans.length) * 100).toFixed(1)
          : 0
      },
      heatmapData() {
        return this.$store.getters.heatmapData
      }
    },
    methods: {
      setRange(range) {
        this.$store.commit('SET_RANGE', range)
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #eee;
  }
  
  .filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }
  </style>