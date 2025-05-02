<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiService } from '../../../shared/services/apiService'
import { API_CONFIG } from '../../../config/api'
import { Line, Bar, Pie, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import HeatMap from '../components/HeatMap.vue'
import TimeDistributionChart from '../components/TimeDistributionChart.vue'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Stats data
const dailyStats = ref<any>([])
const weeklyStats = ref<any>([])
const monthlyStats = ref<any>([])
const totalStats = ref<any>(null)
const heatmapData = ref<any>([])
const timeDistributionData = ref<any>([])
const dailyContentStats = ref<any>([])
const weeklyContentStats = ref<any>([])
const monthlyContentStats = ref<any>([])
const userRegistrationDate = ref<string>('') // 用户注册日期
const loading = ref(false)
const error = ref('')

// Current view
const currentView = ref('daily')

// Chart data
const chartData = computed(() => {
  let labels = []
  let data = []

  if (currentView.value === 'daily') {
    labels = dailyStats.value.map((item: any) => item.time)
    data = dailyStats.value.map((item: any) => item.duration)
  } else if (currentView.value === 'weekly') {
    labels = weeklyStats.value.map((item: any) => item.day)
    data = weeklyStats.value.map((item: any) => item.duration)
  } else {
    labels = monthlyStats.value.map((item: any) => item.day)
    data = monthlyStats.value.map((item: any) => item.duration)
  }

  return {
    labels,
    datasets: [
      {
        label: '学习时长 (分钟)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        data
      }
    ]
  }
})

// 内容统计图数据
const contentChartData = computed(() => {
  let contentStats = []

  if (currentView.value === 'daily') {
    contentStats = dailyContentStats.value
  } else if (currentView.value === 'weekly') {
    contentStats = weeklyContentStats.value
  } else {
    contentStats = monthlyContentStats.value
  }

  // 如果没有数据，返回空数据
  if (!contentStats || contentStats.length === 0) {
    return {
      labels: [],
      datasets: [{
        backgroundColor: [],
        data: []
      }]
    }
  }

  // 生成随机颜色
  const generateColors = (count: number) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const hue = (i * 137) % 360 // 使用黄金角分布获取不同的色相
      colors.push(`hsla(${hue}, 70%, 60%, 0.8)`)
    }
    return colors
  }

  const labels = contentStats.map((item: any) => item.name)
  const data = contentStats.map((item: any) => item.duration)
  const backgroundColor = generateColors(labels.length)

  return {
    labels,
    datasets: [{
      backgroundColor,
      data
    }]
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 允许自定义高度
  scales: {
    y: {
      beginAtZero: true
    }
  },
  layout: {
    padding: 10 // 添加内边距
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    }
  }
}

// 内容统计图配置
const contentChartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 允许自定义高度
  layout: {
    padding: 10 // 添加内边距
  },
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 15,
        padding: 15,
        font: {
          size: 12 // 减小字体大小
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} 分钟 (${percentage}%)`;
        }
      }
    }
  }
}

// Switch view
const switchView = (view: string) => {
  currentView.value = view
}

// Fetch stats
const fetchStats = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('Fetching statistics data...')

    // 从API获取数据
    const [dailyRes, weeklyRes, monthlyRes, totalRes, heatmapRes, timeDistRes, userRes] = await Promise.all([
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO) // 获取用户信息，包括注册日期
    ])

    console.log('Statistics API responses:', {
      daily: dailyRes,
      weekly: weeklyRes,
      monthly: monthlyRes,
      total: totalRes,
      heatmap: heatmapRes,
      timeDistribution: timeDistRes,
      userInfo: userRes
    })

    // 处理每日数据
    console.log('Daily response:', dailyRes)
    if (dailyRes && dailyRes.hourly) {
      dailyStats.value = dailyRes.hourly || []
    } else if (dailyRes) {
      dailyStats.value = dailyRes.daily || []
    } else {
      dailyStats.value = []
    }

    // 处理每日内容统计
    if (dailyRes && dailyRes.content) {
      dailyContentStats.value = dailyRes.content || []
    } else {
      dailyContentStats.value = []
    }

    // 处理每周数据
    if (weeklyRes && weeklyRes.daily) {
      weeklyStats.value = weeklyRes.daily || []
    } else if (weeklyRes) {
      weeklyStats.value = weeklyRes || []
    } else {
      weeklyStats.value = []
    }

    // 处理每周内容统计
    if (weeklyRes && weeklyRes.content) {
      weeklyContentStats.value = weeklyRes.content || []
    } else {
      weeklyContentStats.value = []
    }

    // 处理每月数据
    if (monthlyRes && monthlyRes.daily) {
      monthlyStats.value = monthlyRes.daily || []
    } else if (monthlyRes) {
      monthlyStats.value = monthlyRes || []
    } else {
      monthlyStats.value = []
    }

    // 处理每月内容统计
    if (monthlyRes && monthlyRes.content) {
      monthlyContentStats.value = monthlyRes.content || []
    } else {
      monthlyContentStats.value = []
    }

    // 处理其他数据
    heatmapData.value = heatmapRes || []
    timeDistributionData.value = timeDistRes || []
    totalStats.value = totalRes || {
      dailyMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      totalHours: 0
    }

    // 处理用户信息，获取注册日期
    if (userRes) {
      // 用户信息中包含 created_at 字段表示注册日期
      userRegistrationDate.value = userRes.created_at || ''
      console.log('User registration date:', userRegistrationDate.value)
    }

    loading.value = false
  } catch (err: any) {
    console.error('Error fetching statistics:', err)
    error.value = err.response?.data?.detail || '获取统计数据失败，请稍后再试'
    loading.value = false

    // 即使出错，也确保初始化数据
    dailyStats.value = []
    weeklyStats.value = []
    monthlyStats.value = []
    dailyContentStats.value = []
    weeklyContentStats.value = []
    monthlyContentStats.value = []
    heatmapData.value = []
    timeDistributionData.value = []
    totalStats.value = {
      dailyMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      totalHours: 0
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('Statistics component mounted')
  fetchStats()
})

</script>

<template>
  <div class="statistics-container">
    <div class="statistics-header">
      <h2>学习成长中心 <span class="header-emoji">🌱</span></h2>
      <p class="statistics-subtitle">记录您的学习旅程，发现成长的力量</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="loading" class="loading-container">
      <p class="loading-message">加载统计数据中...</p>
    </div>

    <template v-else>
      <!-- 概览数据卡片 -->
      <div class="overview-section">
        <h3 class="section-heading">学习概览</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-content">
              <h3>今日学习时长</h3>
              <p>{{ totalStats?.dailyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">坚持每一天的努力</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <h3>本周学习时长</h3>
              <p>{{ totalStats?.weeklyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">稳步前进的一周</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>本月学习时长</h3>
              <p>{{ totalStats?.monthlyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">持续成长的一个月</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>累计学习时长</h3>
              <p>{{ totalStats?.totalHours || 0 }} 小时</p>
              <span class="stat-caption">知识积累的见证</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间过滤器 -->
      <div class="time-selector">
        <button
          class="time-filter"
          :class="{ active: currentView === 'daily' }"
          @click="switchView('daily')"
        >
          今日
        </button>
        <button
          class="time-filter"
          :class="{ active: currentView === 'weekly' }"
          @click="switchView('weekly')"
        >
          本周
        </button>
        <button
          class="time-filter"
          :class="{ active: currentView === 'monthly' }"
          @click="switchView('monthly')"
        >
          本月
        </button>
      </div>

      <!-- 主图表 - 优化布局 -->
      <div class="charts-section">
        <h3 class="section-heading">学习数据分析</h3>
        <p class="section-desc">了解您的学习时间和内容分布</p>

        <div class="charts-row">
          <div class="chart-column">
            <div class="chart-card">
              <div class="card-header">
                <div class="card-icon">📊</div>
                <h3>学习时长分布</h3>
              </div>
              <div class="chart-container">
                <div v-if="(currentView === 'daily' && dailyStats.length === 0) ||
                          (currentView === 'weekly' && weeklyStats.length === 0) ||
                          (currentView === 'monthly' && monthlyStats.length === 0)"
                     class="empty-message">
                  <span class="empty-icon">📈</span>
                  <span class="empty-text">暂无数据</span>
                </div>
                <Bar v-else-if="currentView === 'daily'" :data="chartData" :options="chartOptions" :height="300" :width="400" />
                <Line v-else :data="chartData" :options="chartOptions" :height="300" :width="400" />
              </div>
            </div>
          </div>

          <div class="chart-column">
            <div class="chart-card">
              <div class="card-header">
                <div class="card-icon">🍩</div>
                <h3>学习内容分布</h3>
              </div>
              <div class="chart-container">
                <div v-if="(currentView === 'daily' && dailyContentStats.length === 0) ||
                          (currentView === 'weekly' && weeklyContentStats.length === 0) ||
                          (currentView === 'monthly' && monthlyContentStats.length === 0)"
                     class="empty-message">
                  <span class="empty-icon">📚</span>
                  <span class="empty-text">暂无数据</span>
                </div>
                <Doughnut v-else :data="contentChartData" :options="contentChartOptions" :height="300" :width="400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习旅程记录 - 热力图居中显示 -->
      <div class="journey-section">
        <h3 class="section-heading">学习旅程记录</h3>
        <p class="section-desc">见证每一天的坚持与成长</p>
        <div class="heatmap-wrapper">
          <div class="heatmap-container">
            <HeatMap :data="heatmapData" :registration-date="userRegistrationDate" />
            <div class="journey-motivation">
              <div class="motivation-icon">🚀</div>
              <p class="motivation-text">每一个有学习记录的日子，都是成长的印记</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 激励语 -->
      <div class="motivation-section">
        <div class="quote-container">
          <p class="quote">"教育不是灌输知识，而是点燃思考的火焰。"</p>
          <p class="quote-author">— 苏格拉底</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.statistics-container {
  max-width: 1200px; /* 增加最大宽度 */
  margin: 0 auto;
  position: relative;
  padding: 0 30px;
  min-height: 100vh; /* 确保最小高度 */
}

.statistics-container::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.03), transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.statistics-container::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(3, 169, 244, 0.03), transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.time-filter {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.time-filter:hover {
  background: #f8f9fa;
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.time-filter.active {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

h2 {
  margin-bottom: 30px;
  color: #1976d2;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  position: relative;
  padding-bottom: 15px;
}

h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 2px;
}

.section-title {
  margin: 50px 0 20px;
  text-align: center;
  position: relative;
}

.section-title h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  display: inline-block;
  padding: 0 15px;
}

.section-title h3::before,
.section-title h3::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.5), rgba(33, 150, 243, 0.1));
}

.section-title h3::before {
  right: 100%;
}

.section-title h3::after {
  left: 100%;
  transform: rotate(180deg);
}

.section-desc {
  margin: 10px 0 0;
  color: #5c6bc0;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.8;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-message, .empty-message {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-style: italic;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}



.empty-message {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  flex: 1;
  font-size: 1rem;
  color: #9e9e9e;
  position: relative;
  padding: 20px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 25px 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(33, 150, 243, 0.05);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
}

.stat-card h3 {
  margin: 0 0 15px;
  color: #1976d2;
  font-size: 1.1rem;
  font-weight: 600;
}

.stat-card p {
  margin: 0;
  color: #0d47a1;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.time-selector {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.chart-container {
  height: 350px; /* 固定高度 */
  max-height: 350px; /* 最大高度限制 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
  flex: 1; /* 占用剩余空间 */
  overflow: hidden; /* 防止内容溢出 */
}

.chart-title {
  text-align: center;
  margin-bottom: 20px;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.chart-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.heatmap-section {
  margin-bottom: 30px;
}

.charts-section {
  margin-bottom: 50px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  min-height: 400px; /* 确保即使没有数据也有最小高度 */
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 450px; /* 固定高度，防止无限延伸 */
  max-height: 450px; /* 最大高度限制 */
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.chart-card .card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(33, 150, 243, 0.1);
  padding-bottom: 15px;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.chart-card .card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.chart-card .card-header h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
}

.peak-time-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(33, 150, 243, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.peak-time-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.peak-time-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.peak-time-card h3 {
  margin: 0 0 25px;
  color: #1976d2;
  font-size: 1.2rem;
  text-align: center;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.peak-time-card h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.peak-time-content {
  display: flex;
  align-items: center;
  flex: 1;
  background: rgba(33, 150, 243, 0.03);
  padding: 20px;
  border-radius: 12px;
}

.peak-time-icon {
  font-size: 3.5rem;
  margin-right: 25px;
  color: #2196f3;
  text-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.peak-time-info {
  flex: 1;
}

.peak-time-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0d47a1;
  margin: 0 0 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.peak-time-desc {
  margin: 0 0 20px;
  color: #5c6bc0;
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.8;
}

.peak-time-stats {
  margin-bottom: 20px;
}

.peak-stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.peak-stat-label {
  width: 60px;
  font-size: 0.9rem;
  color: #5c6bc0;
  font-weight: 500;
}

.peak-stat-bar {
  flex: 1;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 10px;
}

.peak-stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 4px;
}

.peak-stat-value {
  font-size: 0.9rem;
  color: #1976d2;
  font-weight: 600;
  width: 40px;
  text-align: right;
}

.peak-time-tips {
  background-color: rgba(33, 150, 243, 0.05);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #2196f3;
}

.peak-tip-title {
  margin: 0 0 5px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1976d2;
}

.peak-tip {
  margin: 0;
  font-size: 0.85rem;
  color: #5c6bc0;
  line-height: 1.4;
}

.no-data-message {
  text-align: center;
  padding: 15px 0;
  color: #9e9e9e;
  font-style: italic;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .chart-column {
    min-height: 450px;
  }

  .chart-card {
    height: 450px;
    max-height: 450px;
  }

  .chart-container {
    height: 350px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 新增样式 */
.statistics-header {
  text-align: center;
  margin-bottom: 30px;
}

.statistics-subtitle {
  color: #5c6bc0;
  font-size: 1.1rem;
  margin-top: 5px;
  font-weight: 500;
}

.header-emoji {
  font-size: 1.8rem;
  vertical-align: middle;
  margin-left: 5px;
}

.section-heading {
  color: #1976d2;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
  padding-bottom: 10px;
}

.section-heading::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.overview-section, .habits-section, .journey-section, .content-section {
  margin-bottom: 50px;
  position: relative;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #2196f3;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-caption {
  display: block;
  margin-top: 10px;
  color: #5c6bc0;
  font-size: 0.9rem;
  font-style: italic;
}

.habits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.habit-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 400px;
}

.habit-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.card-header h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
}

.heatmap-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.heatmap-container {
  position: relative;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  max-width: 900px;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.heatmap-container:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.journey-motivation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 10px;
}

.motivation-icon {
  font-size: 1.8rem;
  margin-right: 15px;
}

.motivation-text {
  color: #1976d2;
  font-size: 1rem;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.content-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.content-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #757575;
}

.empty-motivation {
  display: block;
  font-size: 0.9rem;
  color: #5c6bc0;
  font-style: italic;
}

.motivation-section {
  margin: 50px 0;
  text-align: center;
}

.quote-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(33, 150, 243, 0.03);
  border-radius: 16px;
  position: relative;
}

.quote-container::before {
  content: '"';
  position: absolute;
  top: 10px;
  left: 20px;
  font-size: 5rem;
  color: rgba(33, 150, 243, 0.1);
  font-family: Georgia, serif;
  line-height: 1;
}

.quote {
  font-size: 1.5rem;
  color: #1976d2;
  font-weight: 500;
  font-style: italic;
  margin: 0 0 15px;
  line-height: 1.5;
}

.quote-author {
  font-size: 1rem;
  color: #5c6bc0;
  text-align: right;
  margin: 0;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .habits-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-column {
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .time-selector {
    flex-wrap: wrap;
  }

  .time-filter {
    flex: 1;
    min-width: 80px;
  }

  .chart-card {
    height: 400px;
    max-height: 400px;
    padding: 15px;
  }

  .chart-container {
    height: 300px;
    max-height: 300px;
    padding: 10px;
  }

  .chart-column {
    min-height: 400px;
  }

  .quote {
    font-size: 1.2rem;
  }
}
</style>