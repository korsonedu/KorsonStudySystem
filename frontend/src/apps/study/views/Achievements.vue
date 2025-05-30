<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AchievementCard from '../components/AchievementCard.vue'
import { achievementService } from '../../../shared/services/achievementService'

// Achievements data
const achievements = ref<Array<any>>([])
const expandedId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')
const userStats = ref<any>(null)

// 通知相关
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationTimeout = ref<number | null>(null)

// Fetch achievements
const fetchAchievements = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('正在获取成就数据...')

    // 首先获取成就定义
    const definitions = await achievementService.getAchievementDefinitions()

    // 然后获取用户成就状态
    const userAchievements = await achievementService.getUserAchievements()

    if (userAchievements) {
      // 处理后端返回的成就数据
      const backendAchievements = userAchievements || []
      userStats.value = achievementService.userStats || {}

      // 使用后端数据，结合成就定义
      achievements.value = backendAchievements.map((backendAchievement: any) => {
        // 查找对应的成就定义
        const achievementDef = definitions.find(
          (def: any) => def.id === backendAchievement.id
        ) || {
          id: backendAchievement.id,
          name: backendAchievement.name || `成就 #${backendAchievement.id}`,
          description: backendAchievement.description || '',
          levels: []
        }

        // 处理等级信息
        const levels = backendAchievement.levels.map((backendLevel: any, index: number) => {
          const levelDef = achievementDef.levels[index] || {
            level: index + 1,
            description: backendLevel.description || `等级 ${index + 1}`
          }

          return {
            id: index + 1,
            level: levelDef.level,
            description: levelDef.description,
            unlocked: backendLevel.unlocked,
            unlockedAt: backendLevel.unlocked_at
          }
        })

        // 返回成就数据
        return {
          id: backendAchievement.id,
          name: achievementDef.name,
          description: achievementDef.description,
          icon: achievementService.getAchievementIcon(backendAchievement.id),
          unlocked: backendAchievement.is_unlocked,
          progress: calculateProgress(backendAchievement),
          currentLevel: backendAchievement.highest_level,
          maxLevel: levels.length,
          levels: levels
        }
      })
    } else {
      throw new Error('获取成就数据失败')
    }

    loading.value = false
  } catch (err: any) {
    console.error('Error fetching achievements:', err)
    error.value = achievementService.error || err.message || '获取成就数据失败，请稍后再试'
    loading.value = false

    // 出错时不使用模拟数据，显示错误信息
    achievements.value = []
  }
}

// 计算成就进度百分比
const calculateProgress = (achievement: any) => {
  if (!achievement) return 0

  const unlockedLevels = achievement.levels.filter((l: any) => l.unlocked).length
  const totalLevels = achievement.levels.length

  return totalLevels > 0 ? Math.round((unlockedLevels / totalLevels) * 100) : 0
}

// 计算已解锁等级总数
const unlockedCount = computed(() => {
  // 计算所有成就的已解锁等级总数
  return achievements.value.reduce((total, achievement) => {
    return total + achievement.currentLevel;
  }, 0);
})

// 计算总等级数
const totalCount = computed(() => {
  // 计算所有成就的总等级数
  return achievements.value.reduce((total, achievement) => {
    return total + achievement.maxLevel;
  }, 0);
})

// 计算总进度
const totalProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((unlockedCount.value / totalCount.value) * 100)
})

// 刷新成就数据
const refreshAchievements = () => {
  fetchAchievements()
}

// 切换成就展开/收起状态
const toggleAchievement = (id: number, event: Event | undefined, unlocked: boolean) => {
  // 如果成就未解锁，不执行任何操作
  if (!unlocked) {
    return
  }

  // 切换展开状态
  expandedId.value = expandedId.value === id ? null : id
}

// 点击空白处关闭展开的卡片
const handleOutsideClick = (event: MouseEvent) => {
  // 如果没有展开的卡片，不做任何处理
  if (expandedId.value === null) return

  // 检查点击的元素是否在展开的卡片内
  const expandedCard = document.querySelector('.achievement-card.expanded')
  if (expandedCard && !expandedCard.contains(event.target as Node)) {
    expandedId.value = null
  }
}

// 成就解锁通知
const showUnlockNotification = (achievement: any) => {
  // 清除之前的定时器
  if (notificationTimeout.value) {
    clearTimeout(notificationTimeout.value)
  }

  // 设置通知内容
  notificationMessage.value = `恭喜您解锁了"${achievement.name}"成就！`
  showNotification.value = true

  // 5秒后自动关闭通知
  notificationTimeout.value = window.setTimeout(() => {
    hideNotification()
  }, 5000)
}

// 隐藏通知
const hideNotification = () => {
  showNotification.value = false
}

// Load data on component mount
onMounted(() => {
  fetchAchievements()

  // 添加点击事件监听器，用于点击空白处关闭展开的卡片
  document.addEventListener('click', handleOutsideClick)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div class="achievements-container">
    <div class="header">
      <h2>成就中心 <span class="emoji">🏆</span></h2>
      <p class="subtitle">记录您的学习里程碑和进步</p>
    </div>

    <div class="progress-section">
      <div class="progress-overview">
        <h3>总体进度</h3>
        <div class="progress-data">
          <div class="progress-count">
            <span class="current">{{ unlockedCount }}</span>
            <span class="separator">/</span>
            <span class="total">{{ totalCount }}</span>
          </div>
          <div class="progress-percentage">{{ totalProgress }}%</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${totalProgress}%` }"></div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>加载成就中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="refreshAchievements">重试</button>
    </div>

    <div v-else>
      <!-- 所有成就 -->
      <div class="achievements-section">
        <h3 class="section-title">所有成就</h3>
        <div class="achievements-grid">
          <div
            v-for="achievement in achievements"
            :key="achievement.id"
            class="achievement-item"
            :class="{ 'locked-item': !achievement.unlocked }"
          >
            <AchievementCard
              :achievement="achievement"
              :expanded="expandedId === achievement.id"
              @toggle="toggleAchievement(achievement.id, $event, achievement.unlocked)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 成就解锁通知 -->
    <div v-if="showNotification" class="achievement-notification">
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <p>{{ notificationMessage }}</p>
        <button class="close-button" @click="hideNotification">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievements-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  position: relative;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.header {
  text-align: center;
  margin-bottom: 30px;
  position: relative;
}

.header::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: rgba(74, 106, 138, 0.8);
  border-radius: 2px;
}

h2 {
  font-size: 1.8rem;
  color: var(--color-text-white);
  margin-bottom: 5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.3px;
}

.emoji {
  font-size: 1.6rem;
  margin-left: 8px;
}

.subtitle {
  color: var(--color-text-light-gray);
  font-size: 1rem;
  margin-top: 6px;
  font-weight: 400;
}

.progress-section {
  background-color: rgba(74, 106, 138, 0.05);
  border-radius: 16px;
  padding: 20px 25px;
  margin-bottom: 35px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(74, 106, 138, 0.3);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-normal) ease;
}

.progress-section:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-3px);
  background-color: rgba(74, 106, 138, 0.08);
}

.progress-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(74, 106, 138, 0.8);
  opacity: 0.8;
}

.progress-overview h3 {
  color: var(--color-text-white);
  font-size: 1.1rem;
  margin-bottom: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
  position: relative;
  display: inline-block;
}

.progress-overview h3::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 30px;
  height: 2px;
  background: rgba(74, 106, 138, 0.8);
  opacity: 0.7;
}

.progress-data {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-count {
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.current {
  color: rgba(227, 207, 87, 0.9);
  font-weight: 700;
  font-size: 1.1rem;
}

.separator {
  color: var(--color-text-gray);
  margin: 0 6px;
}

.total {
  color: var(--color-text-light-gray);
  font-size: 1rem;
}

.progress-percentage {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(227, 207, 87, 0.9);
  background: rgba(227, 207, 87, 0.1);
  padding: 3px 10px;
  border-radius: 8px;
}

.progress-bar-container {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: rgba(227, 207, 87, 0.8);
  border-radius: 6px;
  transition: width 0.5s ease-out;
  position: relative;
  z-index: 2;
}

.achievements-section {
  margin-bottom: 40px;
  animation: fadeIn 0.4s ease-out;
  animation-fill-mode: both;
}

.section-title {
  font-size: 1.3rem;
  color: var(--color-text-white);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(74, 106, 138, 0.2);
  position: relative;
  font-weight: 600;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: rgba(74, 106, 138, 0.8);
  border-radius: 2px;
  margin-right: 10px;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.achievement-item {
  transition: all var(--transition-normal) ease;
}

.achievement-item:hover {
  transform: translateY(-3px);
}

.locked-item {
  opacity: 0.6;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: var(--color-text-light-gray);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 106, 138, 0.2);
  border-top-color: rgba(227, 207, 87, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  background-color: rgba(218, 88, 78, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin: 30px 0;
  border: 1px solid rgba(218, 88, 78, 0.3);
}

.error-message {
  color: rgba(218, 88, 78, 0.9);
  margin-bottom: 15px;
}

.retry-button {
  background-color: rgba(218, 88, 78, 0.8);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all var(--transition-fast) ease;
}

.retry-button:hover {
  background-color: rgba(218, 88, 78, 1);
  transform: translateY(-1px);
}

.achievement-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.notification-content {
  background-color: rgba(74, 106, 138, 0.95);
  border-radius: 12px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  box-shadow: var(--card-shadow);
  border-left: 4px solid rgba(227, 207, 87, 0.8);
  max-width: 300px;
}

.notification-icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.notification-content p {
  margin: 0;
  flex: 1;
  font-size: 0.95rem;
  color: var(--color-text-white);
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-light-gray);
  cursor: pointer;
  font-size: 1rem;
  padding: 0 0 0 10px;
  transition: all var(--transition-fast) ease;
}

.close-button:hover {
  color: var(--color-text-white);
}

@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 480px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .achievements-container {
    padding: 20px 15px;
  }

  .progress-section {
    padding: 15px 20px;
  }
}
</style>
