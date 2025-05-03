<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { apiService } from '../../../shared/services/apiService'
import studyApi from '../services/studyApi'
import AchievementCard from '../../../shared/components/AchievementCard.vue'
import { ACHIEVEMENTS } from '../../../config/achievements'

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

// 存储上一次的成就状态，用于检测新解锁的成就
const previousAchievements = ref<any[]>([]);

// Fetch achievements
const fetchAchievements = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('正在获取成就数据...')
    const response = await studyApi.achievements.getAchievements()
    console.log('成就数据获取成功:', response.data)

    if (response.data) {
      // 处理后端返回的成就数据
      const backendAchievements = response.data.achievements || []
      userStats.value = response.data.user_stats || {}

      console.log('后端成就数据:', backendAchievements)
      console.log('用户统计数据:', userStats.value)

      // 保存上一次的成就状态，用于检测新解锁的成就
      const oldAchievements = [...achievements.value];

      // 将后端数据与前端定义结合
      const newAchievements = ACHIEVEMENTS.map(frontendAchievement => {
        // 查找对应的后端成就数据
        const backendAchievement = backendAchievements.find(
          (ba: any) => ba.id === frontendAchievement.id
        )

        // 如果存在后端成就数据且已解锁，使用后端数据
        if (backendAchievement && backendAchievement.is_unlocked) {
          // 处理等级信息
          const levels = frontendAchievement.levels.map((level, index) => {
            const backendLevel = backendAchievement.levels[index]
            // 确保后端数据存在，避免出现null或undefined
            return {
              id: index + 1,
              level: level.level,
              description: level.description,
              unlocked: backendLevel ? backendLevel.unlocked : false,
              unlockedAt: backendLevel ? backendLevel.unlocked_at : null
            }
          })

          // 返回合并后的成就数据
          return {
            id: frontendAchievement.id,
            name: frontendAchievement.name,
            description: frontendAchievement.description,
            icon: frontendAchievement.icon,
            unlocked: backendAchievement.is_unlocked,
            progress: calculateProgress(backendAchievement),
            currentLevel: backendAchievement.highest_level,
            maxLevel: frontendAchievement.levels.length,
            levels: levels
          }
        } else {
          // 如果后端没有对应数据或未解锁，使用前端默认值
          return {
            id: frontendAchievement.id,
            name: frontendAchievement.name,
            description: frontendAchievement.description,
            icon: frontendAchievement.icon,
            unlocked: backendAchievement ? backendAchievement.is_unlocked : false,
            progress: backendAchievement ? calculateProgress(backendAchievement) : 0,
            currentLevel: backendAchievement ? backendAchievement.highest_level : 0,
            maxLevel: frontendAchievement.levels.length,
            levels: frontendAchievement.levels.map((level, index) => ({
              id: index + 1,
              level: level.level,
              description: level.description,
              unlocked: backendAchievement && backendAchievement.levels && backendAchievement.levels[index] ?
                      backendAchievement.levels[index].unlocked : false,
              unlockedAt: backendAchievement && backendAchievement.levels && backendAchievement.levels[index] ?
                        backendAchievement.levels[index].unlocked_at : null
            }))
          }
        }
      })

      // 检查是否有新解锁的成就
      if (achievements.value.length > 0) {
        newAchievements.forEach(newAchievement => {
          const oldAchievement = oldAchievements.find(a => a.id === newAchievement.id)

          // 如果成就是新解锁的或者等级提升了
          if (oldAchievement &&
              (!oldAchievement.unlocked && newAchievement.unlocked ||
               newAchievement.currentLevel > oldAchievement.currentLevel)) {
            // 显示解锁通知
            showUnlockNotification(newAchievement)
          }
        })
      }

      // 更新成就列表
      achievements.value = newAchievements
      console.log('处理后的成就数据:', achievements.value)
    } else {
      throw new Error('获取成就数据失败')
    }

    loading.value = false
  } catch (err: any) {
    console.error('Error fetching achievements:', err)
    error.value = err.response?.data?.detail || err.message || '获取成就数据失败，请稍后再试'
    loading.value = false

    // 即使出错，也确保初始化数据
    achievements.value = ACHIEVEMENTS.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      unlocked: false,
      progress: 0,
      currentLevel: 0,
      maxLevel: achievement.levels.length,
      levels: achievement.levels.map((level, index) => ({
        id: index + 1,
        level: level.level,
        description: level.description,
        unlocked: false,
        unlockedAt: null
      }))
    }))
  }
}

// 计算成就进度百分比
const calculateProgress = (achievement: any) => {
  if (!achievement) return 0

  const unlockedLevels = achievement.levels.filter((l: any) => l.unlocked).length
  const totalLevels = achievement.levels.length

  return totalLevels > 0 ? Math.round((unlockedLevels / totalLevels) * 100) : 0
}

// Toggle achievement expansion
const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

// 计算已解锁成就数量
const unlockedCount = computed(() => {
  return achievements.value.filter(a => a.unlocked).length
})

// 计算总成就数量
const totalCount = computed(() => {
  return achievements.value.length
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
const toggleAchievement = (id: number, event: Event, unlocked: boolean) => {
  // 阻止事件冒泡
  event.stopPropagation()

  // 如果成就未解锁，不执行任何操作
  if (!unlocked) {
    return
  }

  // 如果点击的是当前展开的成就，则收起
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    // 如果有其他展开的成就，先将其收起
    if (expandedId.value !== null) {
      // 使用 setTimeout 确保先收起当前展开的成就，再展开新的成就
      expandedId.value = null
      setTimeout(() => {
        expandedId.value = id
      }, 50)
    } else {
      // 如果没有展开的成就，直接展开点击的成就
      expandedId.value = id
    }
  }
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

    <div v-else class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        class="achievement-item"
        :class="{ 'unlocked': achievement.unlocked }"
      >
        <AchievementCard
          :achievement="achievement"
          :expanded="expandedId === achievement.id"
          @toggle="toggleAchievement(achievement.id, $event, achievement.unlocked)"
        />
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
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

h2 {
  font-size: 2.2rem;
  color: #2c3e50;
  margin-bottom: 5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.emoji {
  font-size: 1.8rem;
  margin-left: 8px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-top: 5px;
}

.progress-section {
  background: white;
  border-radius: 16px;
  padding: 25px 30px;
  margin-bottom: 40px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
}

.progress-overview h3 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin-bottom: 15px;
  font-weight: 600;
}

.progress-data {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-count {
  font-size: 1.1rem;
}

.current {
  color: #2ecc71;
  font-weight: 700;
}

.separator {
  color: #bdc3c7;
  margin: 0 5px;
}

.total {
  color: #7f8c8d;
}

.progress-percentage {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2ecc71;
}

.progress-bar-container {
  height: 12px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.achievement-item {
  transition: transform 0.3s ease;
}

.achievement-item:hover {
  transform: translateY(-5px);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(46, 204, 113, 0.2);
  border-radius: 50%;
  border-top-color: #2ecc71;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
  padding: 50px 20px;
  background: rgba(231, 76, 60, 0.05);
  border-radius: 12px;
  margin: 20px 0;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 20px;
}

.retry-button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.achievement-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.notification-content {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(46, 204, 113, 0.3);
  display: flex;
  align-items: center;
  min-width: 300px;
}

.notification-icon {
  font-size: 1.5rem;
  margin-right: 12px;
}

.notification-content p {
  flex: 1;
  margin: 0;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.close-button:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: 1fr;
  }

  .achievement-notification {
    bottom: 20px;
    right: 20px;
    left: 20px;
  }

  .notification-content {
    min-width: 0;
  }
}
</style>