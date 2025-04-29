<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '../services/api'
import AchievementCard from '../components/AchievementCard.vue'
import ShareButton from '../components/ShareButton.vue'
import { ACHIEVEMENTS } from '../config/achievements'

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

    const response = await api.get('/api/achievements')

    if (response.data && response.data.status === 'success') {
      // 处理后端返回的成就数据
      const backendAchievements = response.data.achievements || []
      userStats.value = response.data.user_stats || {}

      // 保存上一次的成就状态
      const oldAchievements = [...achievements.value];

      // 将后端数据与前端定义结合
      const newAchievements = ACHIEVEMENTS.map(frontendAchievement => {
        // 查找对应的后端成就数据
        const backendAchievement = backendAchievements.find(
          (ba: any) => ba.id === frontendAchievement.id
        )

        if (backendAchievement) {
          // 处理等级信息
          const levels = frontendAchievement.levels.map((level, index) => {
            const backendLevel = backendAchievement.levels[index]
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
          // 如果后端没有对应数据，使用前端默认值
          return {
            id: frontendAchievement.id,
            name: frontendAchievement.name,
            description: frontendAchievement.description,
            icon: frontendAchievement.icon,
            unlocked: false,
            progress: 0,
            currentLevel: 0,
            maxLevel: frontendAchievement.levels.length,
            levels: frontendAchievement.levels.map((level, index) => ({
              id: index + 1,
              level: level.level,
              description: level.description,
              unlocked: false,
              unlockedAt: null
            }))
          }
        }
      })

      // 检查是否有新解锁的成就
      if (achievements.value.length > 0) {
        newAchievements.forEach(newAchievement => {
          const oldAchievement = achievements.value.find(a => a.id === newAchievement.id)

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
    } else {
      throw new Error(response.data?.message || '获取成就数据失败')
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
    <!-- 成就解锁通知 -->
    <div v-if="showNotification" class="achievement-notification" @click="hideNotification">
      <div class="notification-icon">🏆</div>
      <div class="notification-content">
        <h3>成就解锁!</h3>
        <p>{{ notificationMessage }}</p>
      </div>
      <div class="notification-close">×</div>
    </div>

    <div class="achievements-header">
      <h2>金融考研成就系统 🏅</h2>
      <ShareButton title="我的金融考研成就" text="查看我的金融考研学习成就和解锁进度！" />
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div class="progress-overview">
      <div class="progress-text">
        <span class="progress-label">成就进度</span>
        <span class="progress-value">{{ unlockedCount }} / {{ totalCount }}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: `${totalProgress}%` }"></div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <p class="loading-message">加载成就数据中...</p>
    </div>

    <div v-else-if="achievements.length === 0" class="empty-container">
      <p class="empty-message">暂无成就数据</p>
      <p>继续学习，解锁更多成就！</p>
    </div>

    <div v-else class="achievements-list">
      <div v-for="achievement in achievements" :key="achievement.id" class="achievement-wrapper">
        <div
          class="achievement-card"
          :class="{
            'locked': !achievement.unlocked,
            'expanded': expandedId === achievement.id
          }"
          @click="(event) => toggleAchievement(achievement.id, event, achievement.unlocked)"
        >
          <div class="card-header">
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <h3>{{ achievement.name }}</h3>
            <span class="status-badge" :class="{ 'unlocked': achievement.unlocked }">
              {{ achievement.unlocked ? '已解锁' : '未解锁' }}
            </span>
          </div>

          <p class="description">{{ achievement.description }}</p>

          <div class="progress-section">
            <div class="progress-container">
              <div
                class="progress-bar"
                :style="{ width: `${achievement.progress}%` }"
              ></div>
            </div>

            <div class="progress-text">
              <span class="level-label">等级:</span> <span class="level-value">{{ achievement.currentLevel }} / {{ achievement.maxLevel }}</span>
            </div>
          </div>

          <div class="levels-container" v-show="expandedId === achievement.id">
            <div
              v-for="(level, index) in achievement.levels"
              :key="level.id"
              class="level"
              :class="{ unlocked: level.unlocked, locked: !level.unlocked }"
              :style="{ '--index': index }"
            >
              <span class="level-number">Lv.{{ level.level }}</span>
              <span class="level-desc">{{ level.description }}</span>
              <span class="level-status">{{ level.unlocked ? '✓' : '🔒' }}</span>
            </div>
          </div>

          <!-- 锁定遮罩 -->
          <div class="locked-overlay" v-if="!achievement.unlocked">
            <div class="locked-icon">🔒</div>
            <div class="locked-text">LV1 解锁</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievements-container {
  max-width: 1200px; /* 增加页面宽度，与统计页面保持一致 */
  margin: 0 auto;
  padding: 0 20px;
}

.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.8rem;
}

.progress-overview {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-label {
  font-weight: 500;
  color: #2c3e50;
}

.progress-value {
  font-weight: 600;
  color: var(--secondary-color);
}

.progress-container {
  height: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
  position: relative;
}

.progress-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    transparent 0%, rgba(255, 255, 255, 0.2) 50%,
    transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  opacity: 0.5;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
}

.achievements-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 固定一行显示三个卡片 */
  gap: 25px;
  margin-top: 20px;
}

.achievement-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.achievement-card {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 12px;
  padding: 20px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.05),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease,
    background 0.3s ease,
    margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  width: 100%;
  height: 100%;
  min-height: 200px; /* 增加最小高度 */
  display: flex;
  flex-direction: column;
}

.achievement-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.achievement-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2980b9);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.achievement-card.unlocked {
  background: linear-gradient(135deg, #f8fffa, #f0fff0);
  border-color: rgba(46, 204, 113, 0.2);
}

.achievement-card.unlocked::before {
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  opacity: 1;
}

.achievement-card.locked {
  background: linear-gradient(135deg, #fafafa, #f5f5f5);
  border-color: rgba(231, 76, 60, 0.1);
}

.achievement-card.locked::before {
  background: linear-gradient(90deg, #e74c3c, #c0392b);
  opacity: 0.5;
}

.achievement-card.expanded {
  position: absolute;
  width: 100%;
  height: auto;
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.15),
    0 5px 10px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  background: linear-gradient(135deg, #ffffff, #f0f8ff);
  z-index: 20;
  margin: 0;
  transform: translateY(-5px) scale(1.02);
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s ease,
    background 0.4s ease;
  min-height: auto;
  left: 0;
  right: 0;
}

.unlock-button-container {
  display: flex;
  justify-content: center;
  margin-top: -10px;
  margin-bottom: 10px;
  position: relative;
  z-index: 10;
}

.unlock-button {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.unlock-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(243, 156, 18, 0.4);
}

.unlock-button:active:not(:disabled) {
  transform: translateY(0);
}

.unlock-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-container {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  margin: 30px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.loading-message, .empty-message {
  font-size: 1.2em;
  margin-bottom: 10px;
  color: #7f8c8d;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

/* 锁定状态样式 */
.achievement-card.locked {
  position: relative;
}

.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10; /* 提高z-index，确保遮罩显示在卡片上方 */
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
  pointer-events: auto; /* 恢复点击事件，使锁定卡片不可点击 */
}

/* 当卡片展开时隐藏锁定遮罩 */
.achievement-card.expanded .locked-overlay {
  opacity: 0;
  visibility: hidden;
}

.locked-overlay::before {
  content: '';
  position: absolute;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shine 3s infinite linear;
  z-index: -1;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%);
  }
  100% {
    transform: translateX(100%) translateY(100%);
  }
}

.locked-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  color: #95a5a6;
  background: rgba(149, 165, 166, 0.1);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(149, 165, 166, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(149, 165, 166, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(149, 165, 166, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(149, 165, 166, 0);
  }
}

.locked-text {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.05);
  padding: 6px 16px;
  border-radius: 20px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.achievement-icon {
  font-size: 2rem;
  margin-right: 12px;
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(52, 152, 219, 0.1);
}

.achievement-card:hover .achievement-icon {
  transform: scale(1.1) rotate(5deg);
  background: rgba(52, 152, 219, 0.15);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.card-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, #3498db, transparent);
  transition: width 0.3s ease;
}

.achievement-card:hover .card-header::after {
  width: 100px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  flex: 1;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 24px;
  margin-left: 10px;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
}

.status-badge.unlocked {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
}

.status-badge.unlocked::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(45deg);
  animation: shimmerBadge 2s infinite;
}

@keyframes shimmerBadge {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.status-badge:not(.unlocked) {
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  color: #95a5a6;
}

.description {
  margin: 15px 0;
  color: #5d6d7e;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  padding-left: 5px;
  font-style: italic;
}

.description::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #3498db, transparent);
  border-radius: 2px;
}

.achievement-card.expanded .description {
  -webkit-line-clamp: initial;
  line-clamp: initial;
  max-height: none;
  margin-bottom: 20px;
}

.progress-section {
  margin-top: auto;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
}

.progress-text {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 5px;
  font-size: 0.85rem;
  height: 24px; /* 固定高度确保对齐 */
}

.level-label {
  color: #7f8c8d;
  margin-right: 5px;
}

.level-value {
  color: #3498db;
  font-weight: 600;
  background: rgba(52, 152, 219, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

/* 等级容器样式 */
.levels-container {
  max-height: 0;
  overflow: hidden;
  transition:
    max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  margin-top: 0;
  padding: 0 5px;
}

.achievement-card.expanded .levels-container {
  opacity: 1;
  max-height: 300px; /* 设置一个固定的最大高度 */
  overflow-y: auto;
  padding: 15px 10px;
  margin-top: 20px;
  /* 添加科技感滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(52, 152, 219, 0.5) rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.achievement-card.expanded .levels-container::-webkit-scrollbar {
  width: 6px;
}

.achievement-card.expanded .levels-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.achievement-card.expanded .levels-container::-webkit-scrollbar-thumb {
  background: rgba(52, 152, 219, 0.5);
  border-radius: 3px;
}

.level {
  display: grid;
  grid-template-columns: 36px 1fr 24px;
  align-items: center;
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8f9fa, #f5f5f5);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transform: translateY(10px);
  opacity: 0;
  animation: fadeInUp 0.3s forwards;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.level.unlocked {
  background: linear-gradient(135deg, #f0fff0, #e8f8e8);
  border-color: rgba(46, 204, 113, 0.1);
  box-shadow: 0 1px 3px rgba(46, 204, 113, 0.1);
}

.level-number {
  font-weight: 600;
  font-size: 0.8rem;
  color: #34495e;
  background: rgba(52, 152, 219, 0.1);
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.level.unlocked .level-number {
  background: rgba(46, 204, 113, 0.15);
  color: #27ae60;
}

.level-desc {
  font-size: 0.8rem;
  color: #7f8c8d;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level.unlocked .level-desc {
  color: #2c3e50;
  font-weight: 500;
}

.level-status {
  font-size: 1rem;
  text-align: right;
}

.level.unlocked .level-status {
  color: #2ecc71;
  text-shadow: 0 0 5px rgba(46, 204, 113, 0.3);
}

.level.locked .level-status {
  color: #bdc3c7;
}

@media (max-width: 1200px) {
  .achievements-list {
    grid-template-columns: repeat(2, 1fr); /* 中等屏幕显示两列 */
  }
}

/* 成就解锁通知样式 */
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ffffff, #f0f8ff);
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  z-index: 1000;
  max-width: 400px;
  border-left: 4px solid #3498db;
  animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  cursor: pointer;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-icon {
  font-size: 2.5rem;
  margin-right: 15px;
  color: #f39c12;
  animation: pulse 2s infinite;
}

.notification-content {
  flex: 1;
}

.notification-content h3 {
  margin: 0 0 5px;
  color: #2c3e50;
  font-size: 1.2rem;
}

.notification-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.95rem;
}

.notification-close {
  font-size: 1.5rem;
  color: #95a5a6;
  cursor: pointer;
  margin-left: 10px;
  transition: color 0.3s ease;
}

.notification-close:hover {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .achievements-header {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  .achievements-list {
    grid-template-columns: 1fr; /* 小屏幕显示一列 */
  }

  .locked-icon {
    font-size: 2rem;
  }

  .locked-text {
    font-size: 1rem;
  }

  .achievement-icon {
    width: 40px;
    height: 40px;
    font-size: 1.8rem;
  }

  .card-header h3 {
    font-size: 1rem;
    max-width: 140px;
  }

  .achievement-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>