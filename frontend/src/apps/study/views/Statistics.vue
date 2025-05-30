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

.time-filter {
  background-color: var(--color-input-gray);
  border: 1px solid var(--color-border-gray);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all var(--transition-fast) ease;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text-white);
}

.time-filter:hover {
  background-color: var(--color-hover-gray);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow);
}

.time-filter.active {
  background-color: rgba(90, 122, 154, 0.3); /* 低饱和度蓝灰色背景 */
  color: var(--color-text-white);
  border-color: rgba(90, 122, 154, 0.5); /* 低饱和度蓝灰色边框 */
  box-shadow: 0 0 0 1px rgba(90, 122, 154, 0.2);
}

h2 {
  margin-bottom: 30px;
  color: var(--color-text-white);
  text-align: center;
  font-size: 2rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 15px;
}

.section-title {
  margin: 50px 0 20px;
  text-align: center;
  position: relative;
}

.section-title h3 {
  margin: 0;
  color: var(--color-text-white);
  font-size: 1.5rem;
  font-weight: 600;
  position: relative;
  display: inline-block;
  padding: 0 15px;
}

.section-desc {
  margin: 10px 0 0;
  color: var(--color-text-light-gray);
  font-size: 0.95rem;
  font-weight: 500;
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
  color: var(--color-text-gray);
  font-style: italic;
}

.error-message {
  background-color: rgba(160, 122, 122, 0.1); /* 低饱和度红褐色背景 */
  color: var(--color-text-white);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  border: 1px solid rgba(160, 122, 122, 0.3); /* 低饱和度红褐色边框 */
}

.empty-message {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(90, 122, 154, 0.05); /* 低饱和度蓝灰色背景 */
  border-radius: 10px;
  flex: 1;
  font-size: 1rem;
  color: var(--color-text-gray);
  position: relative;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(90, 122, 154, 0.2); /* 低饱和度蓝灰色边框 */
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
  opacity: 0.7;
}

.empty-text {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-text-light-gray);
  margin-bottom: 5px;
}

.empty-subtext {
  font-size: 0.9rem;
  color: var(--color-text-gray);
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
  background-color: rgba(74, 106, 138, 0.05); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 12px;
  padding: 25px;
  box-shadow: var(--card-shadow);
  height: 450px; /* 固定高度，防止无限延伸 */
  max-height: 450px; /* 最大高度限制 */
  border: 1px solid rgba(74, 106, 138, 0.3); /* 使用 #4A6A8A 作为边框 */
  transition: all var(--transition-normal) ease;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-5px);
  background-color: rgba(74, 106, 138, 0.08); /* 使用 #4A6A8A 作为悬停底纹 */
}

.chart-card .card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(74, 106, 138, 0.2); /* 使用 #4A6A8A 作为边框 */
  padding-bottom: 15px;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.chart-card .card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: var(--color-text-white);
  opacity: 0.8;
}

.chart-card .card-header h3 {
  margin: 0;
  color: var(--color-text-white);
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
  background-color: rgba(74, 106, 138, 0.05); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(74, 106, 138, 0.3); /* 使用 #4A6A8A 作为边框 */
  max-width: 900px;
  width: 100%;
  transition: all var(--transition-normal) ease;
}

.heatmap-container:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-5px);
  background-color: rgba(74, 106, 138, 0.08); /* 使用 #4A6A8A 作为悬停底纹 */
}

.journey-motivation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(74, 106, 138, 0.1); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 10px;
  border: 1px solid rgba(74, 106, 138, 0.2); /* 使用 #4A6A8A 作为边框 */
}

.motivation-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: var(--color-text-white);
  opacity: 0.8;
}

.motivation-text {
  color: var(--color-text-white);
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
  background-color: rgba(74, 106, 138, 0.05); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 12px;
  position: relative;
  border: 1px solid rgba(74, 106, 138, 0.2); /* 使用 #4A6A8A 作为边框 */
  transition: all var(--transition-normal) ease;
}

.quote-container:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-3px);
  background-color: rgba(74, 106, 138, 0.08); /* 使用 #4A6A8A 作为悬停底纹 */
}

.quote-container::before {
  content: '"';
  position: absolute;
  top: 10px;
  left: 20px;
  font-size: 5rem;
  color: rgba(74, 106, 138, 0.2); /* 使用 #4A6A8A 作为底纹 */
  font-family: Georgia, serif;
  line-height: 1;
}

.quote {
  font-size: 1.5rem;
  color: var(--color-text-white);
  font-weight: 500;
  font-style: italic;
  margin: 0 0 15px;
  line-height: 1.5;
}

.quote-author {
  font-size: 1rem;
  color: var(--color-text-light-gray);
  text-align: right;
  margin: 0;
}

/* 统计页面头部样式 */
.statistics-header {
  text-align: center;
  margin-bottom: 30px;
}

.statistics-subtitle {
  color: var(--color-text-gray);
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
  color: var(--color-text-white);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
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
  .statistics-container {
    padding: 0 15px;
  }

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
    height: 350px;
    max-height: 350px;
    padding: 15px;
  }

  .chart-container {
    height: 250px;
    max-height: 250px;
    padding: 10px;
  }

  .chart-column {
    min-height: 350px;
  }

  .quote {
    font-size: 1.2rem;
  }

  .heatmap-container {
    padding: 15px;
  }

  .section-title h3 {
    font-size: 1.3rem;
  }

  .card-header h3 {
    font-size: 1.1rem;
  }

  .card-icon {
    font-size: 1.5rem;
  }
}
</style>
