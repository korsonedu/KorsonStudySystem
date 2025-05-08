<script setup lang="ts">
/**
 * 统计页面
 * 显示用户学习统计数据
 */
import { ref, onMounted } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
// 导入服务
import { fetchAllStatistics, getContentStatsByView } from '../services'
import { STORAGE_CONFIG } from '../../../config'

// 导入组件
import StatsOverview from '../components/statistics/StatsOverview.vue'
import TimeSelector from '../components/statistics/TimeSelector.vue'
import ChartSection from '../components/statistics/ChartSection.vue'
import JourneySection from '../components/statistics/JourneySection.vue'
import MotivationQuote from '../components/statistics/MotivationQuote.vue'

// 注册ChartJS组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// 统计数据
const dailyDuration = ref(0)
const weeklyDuration = ref(0)
const monthlyDuration = ref(0)
const totalHours = ref(0)
const hourlyStats = ref<any[]>([])
const weeklyStats = ref<any[]>([])
const monthlyStats = ref<any[]>([])
const heatmapData = ref<any[]>([])
const timeDistribution = ref<any[]>([])
const dailyContentStats = ref<any[]>([])
const weeklyContentStats = ref<any[]>([])
const monthlyContentStats = ref<any[]>([])
const userRegistrationDate = ref('')
const loading = ref(false)
const error = ref('')

// 当前视图
const currentView = ref('daily')

// 获取当前视图的内容统计数据
const currentContentStats = ref<any[]>([])

// 切换视图
const switchView = (view: string) => {
  currentView.value = view
  updateContentStats()
}

// 更新内容统计数据
const updateContentStats = () => {
  currentContentStats.value = getContentStatsByView(
    currentView.value,
    dailyContentStats.value,
    weeklyContentStats.value,
    monthlyContentStats.value
  );
}

// 获取统计数据
const fetchStats = async () => {
  try {
    loading.value = true
    error.value = ''

    // 使用统计数据服务获取数据
    const result = await fetchAllStatistics()

    // 更新组件状态
    dailyDuration.value = result.dailyDuration
    weeklyDuration.value = result.weeklyDuration
    monthlyDuration.value = result.monthlyDuration
    totalHours.value = result.totalHours
    hourlyStats.value = result.hourlyStats
    weeklyStats.value = result.weeklyStats
    monthlyStats.value = result.monthlyStats
    heatmapData.value = result.heatmapData
    timeDistribution.value = result.timeDistribution
    userRegistrationDate.value = result.userRegistrationDate

    // 使用真实的内容统计数据
    dailyContentStats.value = result.dailyContentStats || []
    weeklyContentStats.value = result.weeklyContentStats || []
    monthlyContentStats.value = result.monthlyContentStats || []

    // 更新当前视图的内容统计数据
    updateContentStats()
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('获取统计数据失败')
    }

    // 检查是否是认证错误（401）
    if (err.response && err.response.status === 401) {
      error.value = '获取统计数据需要登录权限，请确保您已登录'

      // 尝试重新获取认证令牌
      const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY)
      if (token) {

        try {
          // 只处理JWT格式的令牌
          if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length === 3) {
              const base64Url = parts[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));

              if (payload.exp) {
                const expTime = new Date(payload.exp * 1000);
                const now = new Date();

                if (expTime > now) {
                  // 令牌有效，尝试自动重新获取数据
                  setTimeout(() => {
                    fetchStats()
                  }, 1000)
                  return
                } else {
                  // 令牌已过期，需要重新登录
                  localStorage.removeItem(STORAGE_CONFIG.TOKEN_KEY)
                  error.value = '登录已过期，请重新登录'
                  // 重定向到登录页面
                  window.location.href = '/login'
                  return
                }
              }
            }
          }

          // 如果无法解析令牌，尝试重新获取数据
          setTimeout(() => {
            fetchStats()
          }, 1000)

        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('无法解析令牌')
          }
          error.value = '登录状态异常，请尝试重新登录'
        }
      } else {
        error.value = '未找到有效的登录凭证，请重新登录'
        // 重定向到登录页面
        window.location.href = '/login'
      }
    } else {
      error.value = err.message || '获取统计数据失败，请稍后再试'
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
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
      <StatsOverview
        :daily-duration="dailyDuration"
        :weekly-duration="weeklyDuration"
        :monthly-duration="monthlyDuration"
        :total-hours="totalHours"
      />

      <!-- 时间过滤器 -->
      <TimeSelector :current-view="currentView" @change="switchView" />

      <!-- 图表区域 -->
      <ChartSection
        :current-view="currentView"
        :hourly-stats="hourlyStats"
        :weekly-stats="weeklyStats"
        :monthly-stats="monthlyStats"
        :content-stats="currentContentStats"
      />

      <!-- 学习旅程记录 -->
      <JourneySection
        :heatmap-data="heatmapData"
        :registration-date="userRegistrationDate"
      />

      <!-- 激励语 -->
      <MotivationQuote />
    </template>
  </div>
</template>

<style scoped>
.statistics-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  padding: 0 30px;
  min-height: 100vh;
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

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 1.2rem;
  font-weight: 500;
  color: #757575;
  margin-bottom: 5px;
}

.empty-subtext {
  font-size: 0.9rem;
  color: #9e9e9e;
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

/* 统计页面头部样式 */
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

.overview-section, .journey-section {
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

/* 响应式布局 */
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
