<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  achievement: {
    id: number
    name: string
    description: string
    unlocked: boolean
    progress: number
    levels: Array<{
      id: number
      level: number
      description: string
      unlocked: boolean
    }>
  }
  expanded: boolean
}>()

const emit = defineEmits(['toggle'])

// 切换展开状态
const toggleExpand = (event: Event) => {
  emit('toggle', props.achievement.id, event)
}

// 计算状态文本
const statusText = computed(() => {
  return props.achievement.unlocked ? '已解锁' : '未解锁'
})

// 计算解锁的等级数量
const unlockedLevels = computed(() => {
  return props.achievement.levels.filter(level => level.unlocked).length
})

// 计算总等级数量
const totalLevels = computed(() => {
  return props.achievement.levels.length
})

// 计算最高解锁等级
const highestLevel = computed(() => {
  const unlockedLevels = props.achievement.levels.filter(level => level.unlocked)
  return unlockedLevels.length > 0
    ? Math.max(...unlockedLevels.map(level => level.level))
    : 0
})
</script>

<template>
  <div
    class="achievement-card"
    :class="{
      expanded,
      unlocked: achievement.unlocked,
      locked: !achievement.unlocked
    }"
    @click="toggleExpand"
  >
    <!-- 卡片内容 -->
    <div class="card-content">
      <div class="card-header">
        <h3>{{ achievement.name }}</h3>
        <span class="status-badge">
          {{ statusText }}
        </span>
      </div>

      <p class="description">{{ achievement.description }}</p>

      <div class="progress-container">
        <div
          class="progress-bar"
          :style="{ width: `${achievement.progress}%` }"
        ></div>
      </div>

      <div class="progress-text">
        {{ unlockedLevels }} / {{ totalLevels }} 级
      </div>

      <!-- 展开指示器 -->
      <div class="expand-indicator" v-if="!expanded && achievement.unlocked">
        <span class="expand-icon">▼</span>
      </div>
    </div>

    <!-- 锁图标 (仅未解锁成就显示) -->
    <div class="lock-overlay" v-if="!achievement.unlocked">
      <span class="lock-icon">🔒</span>
    </div>

    <!-- 等级详情弹出层 -->
    <div class="levels-popup" v-if="expanded">
      <div class="levels-content">
        <div class="levels-header">
          <h4>等级详情</h4>
          <span class="highest-level" v-if="highestLevel > 0">
            当前等级: Lv.{{ highestLevel }}
          </span>
        </div>

        <div class="levels-grid">
          <div
            v-for="level in achievement.levels"
            :key="level.id"
            class="level"
            :class="{ unlocked: level.unlocked, locked: !level.unlocked }"
          >
            <span class="level-number">Lv.{{ level.level }}</span>
            <span class="level-desc">{{ level.description }}</span>
            <span class="level-status">{{ level.unlocked ? '✓' : '🔒' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-card {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 12px;
  padding: 18px;
  margin: 14px 0;
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.03),
    0 1px 5px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition:
    box-shadow 0.2s ease-out,
    border-color 0.2s ease-out,
    transform 0.2s ease-out;
  overflow: visible;
}

/* 科技感边框效果 */
.achievement-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(52, 152, 219, 0.1) 50%,
    rgba(46, 204, 113, 0.1) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.5;
}

.achievement-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 12px 12px 0 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.achievement-card.unlocked {
  border-color: rgba(46, 204, 113, 0.15);
  background: linear-gradient(145deg, #fcfffe, #f7fdf7);
}

.achievement-card.unlocked::before {
  opacity: 1;
}

.achievement-card.locked {
  border-color: rgba(0, 0, 0, 0.05);
  /* 未解锁的成就添加高斯模糊效果 */
  filter: grayscale(1) blur(4px);
  opacity: 0.6;
  pointer-events: none;
}

.achievement-card.expanded {
  z-index: 10;
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.03);
}

/* 锁图标覆盖层 */
.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(2px);
  z-index: 5;
  border-radius: 12px;
}

.lock-icon {
  font-size: 2rem;
  color: rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 等级详情弹出层 */
.levels-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 20;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.card-content {
  position: relative;
  z-index: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  margin-bottom: 12px;
}

.card-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  opacity: 0.7;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.unlocked .card-header h3 {
  color: #2c3e50;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.unlocked .status-badge {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 1px 3px rgba(46, 204, 113, 0.2);
}

.locked .status-badge {
  background: #f0f0f0;
  color: #95a5a6;
}

.description {
  margin: 12px 0;
  color: #5d6d7e;
  font-size: 0.9em;
  line-height: 1.5;
  font-weight: 400;
}

.progress-container {
  height: 5px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 6px;
  margin: 12px 0 6px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.02);
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  width: 0;
  border-radius: 6px;
  transition: width 0.5s ease-out;
  position: relative;
  z-index: 2;
}

.progress-text {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 0.8em;
  font-weight: 500;
  color: #7f8c8d;
  margin: 6px 0;
}

.levels-content {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow:
    0 5px 20px rgba(0, 0, 0, 0.05),
    0 2px 8px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-top: 8px;
}

.levels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.levels-header h4 {
  margin: 0;
  font-size: 0.95em;
  color: #2c3e50;
  font-weight: 600;
  position: relative;
  padding-left: 10px;
}

.levels-header h4::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  background: linear-gradient(to bottom, #3498db, #2ecc71);
  border-radius: 2px;
}

.highest-level {
  font-size: 0.75em;
  font-weight: 600;
  color: #2ecc71;
  background: rgba(46, 204, 113, 0.08);
  padding: 3px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
}

.highest-level::before {
  content: '✓';
  margin-right: 4px;
  font-size: 0.9em;
}

.levels-grid {
  display: grid;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 4px;
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.05) transparent;
}

.levels-grid::-webkit-scrollbar {
  width: 3px;
}

.levels-grid::-webkit-scrollbar-track {
  background: transparent;
}

.levels-grid::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.level {
  display: grid;
  grid-template-columns: 30px 1fr 24px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f9f9f9;
  border: 1px solid rgba(0, 0, 0, 0.02);
  position: relative;
  overflow: hidden;
}

.level::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: #e0e0e0;
}

.level.unlocked {
  background: rgba(46, 204, 113, 0.02);
}

.level.unlocked::before {
  background: linear-gradient(to bottom, #3498db, #2ecc71);
  height: 70%;
  top: 15%;
  border-radius: 2px;
}

.level-number {
  font-weight: 600;
  font-size: 0.8em;
  color: #34495e;
  background: rgba(52, 152, 219, 0.05);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.level.unlocked .level-number {
  background: rgba(46, 204, 113, 0.05);
  color: #27ae60;
}

.level-desc {
  font-size: 0.85em;
  color: #7f8c8d;
  padding-left: 6px;
  line-height: 1.4;
}

.level.unlocked .level-desc {
  color: #2c3e50;
  font-weight: 500;
}

.level-status {
  font-size: 0.9em;
  text-align: right;
}

.level.unlocked .level-status {
  color: #2ecc71;
}

.level.locked .level-status {
  color: #bdc3c7;
}

/* 展开指示器 */
.expand-indicator {
  text-align: center;
  margin-top: 8px;
  height: 12px;
}

.expand-icon {
  font-size: 0.7em;
  color: rgba(52, 152, 219, 0.5);
  display: inline-block;
}

.achievement-card:hover:not(.expanded) {
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.04),
    0 2px 5px rgba(0, 0, 0, 0.02);
}

.achievement-card:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .achievement-card {
    padding: 16px;
    margin: 10px 0;
  }

  .level {
    grid-template-columns: 28px 1fr 24px;
    padding: 8px;
  }

  .level-desc {
    font-size: 0.85em;
    padding: 0 6px;
  }

  .levels-content {
    padding: 12px;
  }

  .levels-grid {
    max-height: 200px;
  }

  .card-header h3 {
    font-size: 1.1em;
  }

  .status-badge {
    padding: 3px 8px;
    font-size: 0.75em;
  }

  .levels-popup {
    left: -5px;
    right: -5px;
  }
}
</style>
