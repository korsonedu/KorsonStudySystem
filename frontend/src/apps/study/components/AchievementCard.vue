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
const toggleExpand = () => {
  emit('toggle', props.achievement.id)
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
    
    <div class="levels-container">
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
</template>

<style scoped>
.achievement-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: 
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease,
    max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 180px;
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
}

.achievement-card.unlocked {
  border-color: #2ecc71;
}

.achievement-card.locked {
  border-color: #e74c3c;
}

.achievement-card.expanded {
  max-height: 600px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.card-header h3 {
  margin: 0;
  font-size: 1.3em;
  color: #2c3e50;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.unlocked .status-badge {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 204, 113, 0.3);
}

.locked .status-badge {
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  color: #95a5a6;
}

.description {
  margin: 16px 0;
  color: #7f8c8d;
  font-size: 0.95em;
}

.progress-container {
  height: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  margin: 18px 0 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #2ecc71, #27ae60);
  width: 0;
  border-radius: 8px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.progress-text {
  text-align: right;
  font-size: 0.85em;
  color: #7f8c8d;
  margin-bottom: 16px;
}

.levels-container {
  opacity: 0;
  transform: translateY(-10px);
  transition: 
    opacity 0.4s ease 0.2s,
    transform 0.4s ease 0.2s;
}

.achievement-card.expanded .levels-container {
  opacity: 1;
  transform: translateY(0);
}

.level {
  display: grid;
  grid-template-columns: 40px 1fr 30px;
  align-items: center;
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.level.unlocked {
  background: rgba(46, 204, 113, 0.1);
}

.level-number {
  font-weight: 600;
  font-size: 0.9em;
  color: #34495e;
}

.level-desc {
  font-size: 0.95em;
  color: #7f8c8d;
}

.level.unlocked .level-desc {
  color: #2c3e50;
}

.level-status {
  font-size: 1.1em;
  text-align: right;
}

.level.unlocked .level-status {
  color: #2ecc71;
}

.level.locked .level-status {
  color: #bdc3c7;
}

.achievement-card:hover:not(.expanded) {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.12);
}

.achievement-card:active {
  transform: scale(0.98);
}

@media (max-width: 768px) {
  .achievement-card {
    padding: 18px;
    margin: 12px 0;
  }
  
  .level {
    grid-template-columns: 30px 1fr 24px;
    padding: 12px;
  }
  
  .level-desc {
    font-size: 0.95em;
    padding: 0 12px;
  }
}
</style>
