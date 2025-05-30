<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

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
const cardRef = ref<HTMLElement | null>(null)

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

// 获取弹出层样式
const getPopupStyle = () => {
  if (!cardRef.value) return {}

  const rect = cardRef.value.getBoundingClientRect()
  return {
    position: 'absolute',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
  }
}

// 在组件挂载后获取卡片元素引用
onMounted(() => {
  cardRef.value = document.querySelector(`.achievement-card[data-id="${props.achievement.id}"]`) as HTMLElement
})
</script>

<template>
  <div
    class="achievement-card"
    :class="{
      expanded,
      unlocked: achievement.unlocked,
      locked: !achievement.unlocked,
      'level-1': achievement.unlocked && highestLevel === 1,
      'level-2': achievement.unlocked && highestLevel === 2,
      'level-3': achievement.unlocked && highestLevel === 3
    }"
    :data-id="achievement.id"
    ref="cardRef"
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
    <teleport to="body">
      <div class="levels-popup" v-if="expanded" :style="getPopupStyle()">
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
    </teleport>
  </div>
</template>

<style scoped>
.achievement-card {
  background-color: rgba(74, 106, 138, 0.05);
  border-radius: 12px;
  padding: 18px;
  margin: 14px 0;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  position: relative;
  border: 1px solid rgba(74, 106, 138, 0.3);
  transition: all var(--transition-normal) ease;
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
    rgba(255, 255, 255, 0.2) 0%,
    rgba(74, 106, 138, 0.1) 50%,
    rgba(227, 207, 87, 0.1) 100%
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
  background: rgba(102, 205, 170, 0.8); /* 默认使用优雅的中海蓝绿色 */
  border-radius: 12px 12px 0 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.achievement-card.unlocked {
  border-color: rgba(102, 205, 170, 0.3);
  background-color: rgba(74, 106, 138, 0.08);
}

.achievement-card.unlocked::before {
  opacity: 1;
}

/* 根据最高解锁等级设置不同的边框颜色 */
.achievement-card.level-1 {
  border-color: rgba(100, 149, 237, 0.3); /* 矢车菊蓝 - 1级 */
}

.achievement-card.level-1::before {
  background: rgba(100, 149, 237, 0.8); /* 矢车菊蓝 - 1级 */
  opacity: 1;
}

.achievement-card.level-2 {
  border-color: rgba(102, 205, 170, 0.3); /* 中海蓝绿色 - 2级 */
}

.achievement-card.level-2::before {
  background: rgba(102, 205, 170, 0.8); /* 中海蓝绿色 - 2级 */
  opacity: 1;
}

.achievement-card.level-3 {
  border-color: rgba(147, 112, 219, 0.3); /* 中紫色 - 3级 */
}

.achievement-card.level-3::before {
  background: rgba(147, 112, 219, 0.8); /* 中紫色 - 3级 */
  opacity: 1;
}

.achievement-card.locked {
  border-color: rgba(74, 106, 138, 0.2);
  /* 未解锁的成就添加高斯模糊效果 */
  filter: grayscale(1) blur(2px);
  opacity: 0.5;
  pointer-events: none;
}

.achievement-card.expanded {
  z-index: 30; /* 提高展开卡片的z-index，确保它在悬停卡片之上 */
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-3px);
}

.achievement-card:hover:not(.expanded):not(.locked) {
  z-index: 5; /* 悬停卡片的z-index */
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-3px);
  background-color: rgba(74, 106, 138, 0.1);
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
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  z-index: 5;
  border-radius: 12px;
}

.lock-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.5);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* 等级详情弹出层 */
.levels-popup {
  position: fixed; /* 改为固定定位，避免受父元素影响 */
  top: auto; /* 取消顶部定位 */
  left: auto; /* 取消左侧定位 */
  right: auto; /* 取消右侧定位 */
  width: 100%; /* 设置宽度与父元素相同 */
  z-index: 1000; /* 使用更高的z-index值 */
  animation: fadeIn 0.2s ease-out;
  pointer-events: auto; /* 确保弹出层可以接收鼠标事件 */
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
  border-bottom: 1px solid rgba(74, 106, 138, 0.2);
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
  background: rgba(102, 205, 170, 0.8); /* 默认使用优雅的中海蓝绿色 */
  opacity: 0.7;
}

/* 根据最高解锁等级设置不同的头部横线颜色 */
.level-1 .card-header::after {
  background: rgba(100, 149, 237, 0.8); /* 矢车菊蓝 - 1级 */
}

.level-2 .card-header::after {
  background: rgba(102, 205, 170, 0.8); /* 中海蓝绿色 - 2级 */
}

.level-3 .card-header::after {
  background: rgba(147, 112, 219, 0.8); /* 中紫色 - 3级 */
}

.card-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: var(--color-text-white);
  font-weight: 600;
  letter-spacing: 0.2px;
}

.unlocked .card-header h3 {
  color: var(--color-text-white);
}

.status-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.75em;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.unlocked .status-badge {
  background: rgba(102, 205, 170, 0.8); /* 默认使用优雅的中海蓝绿色 */
  color: var(--color-text-black);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 根据最高解锁等级设置不同的状态徽章颜色 */
.level-1 .status-badge {
  background: rgba(100, 149, 237, 0.8); /* 矢车菊蓝 - 1级 */
}

.level-2 .status-badge {
  background: rgba(102, 205, 170, 0.8); /* 中海蓝绿色 - 2级 */
}

.level-3 .status-badge {
  background: rgba(147, 112, 219, 0.8); /* 中紫色 - 3级 */
}

.locked .status-badge {
  background: rgba(74, 106, 138, 0.2);
  color: var(--color-text-light-gray);
}

.description {
  margin: 12px 0;
  color: var(--color-text-light-gray);
  font-size: 0.9em;
  line-height: 1.5;
  font-weight: 400;
}

.progress-container {
  height: 5px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin: 12px 0 6px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 100%;
  background: rgba(102, 205, 170, 0.8); /* 使用优雅的中海蓝绿色 */
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
  color: var(--color-text-light-gray);
  margin: 6px 0;
}

.levels-content {
  background-color: rgba(42, 54, 65, 0.95); /* 深色不透明背景 */
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(74, 106, 138, 0.5);
  margin-top: 8px;
}

.levels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(74, 106, 138, 0.2);
}

.levels-header h4 {
  margin: 0;
  font-size: 0.95em;
  color: var(--color-text-white);
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
  background: rgba(102, 205, 170, 0.8); /* 使用优雅的中海蓝绿色 */
  border-radius: 2px;
}

.highest-level {
  font-size: 0.75em;
  font-weight: 600;
  color: var(--color-text-black);
  background: rgba(102, 205, 170, 0.8); /* 使用优雅的中海蓝绿色 */
  padding: 3px 8px;
  border-radius: 8px;
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
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.levels-grid::-webkit-scrollbar {
  width: 3px;
}

.levels-grid::-webkit-scrollbar-track {
  background: transparent;
}

.levels-grid::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.level {
  display: grid;
  grid-template-columns: 30px 1fr 24px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: rgba(74, 106, 138, 0.05);
  border: 1px solid rgba(74, 106, 138, 0.2);
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
  background: rgba(74, 106, 138, 0.3);
}

.level.unlocked {
  background-color: rgba(227, 207, 87, 0.05);
  border-color: rgba(227, 207, 87, 0.2);
}

.level.unlocked::before {
  background: rgba(227, 207, 87, 0.8);
  height: 70%;
  top: 15%;
  border-radius: 2px;
}

/* 为不同等级的成就添加不同的颜色 - 使用更优雅的色调 */
.level.unlocked:nth-child(3n+1)::before {
  background: rgba(100, 149, 237, 0.8); /* 矢车菊蓝 - 1级 */
}

.level.unlocked:nth-child(3n+2)::before {
  background: rgba(102, 205, 170, 0.8); /* 中海蓝绿色 - 2级 */
}

.level.unlocked:nth-child(3n+3)::before {
  background: rgba(147, 112, 219, 0.8); /* 中紫色 - 3级 */
}

.level-number {
  font-weight: 600;
  font-size: 0.8em;
  color: var(--color-text-light-gray);
  background-color: rgba(74, 106, 138, 0.1);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.level.unlocked .level-number {
  background-color: rgba(102, 205, 170, 0.1);
  color: rgba(102, 205, 170, 0.9);
}

/* 为不同等级的成就添加不同的颜色 - 使用更优雅的色调 */
.level.unlocked:nth-child(3n+1) .level-number {
  background-color: rgba(100, 149, 237, 0.1);
  color: rgba(100, 149, 237, 0.9);
}

.level.unlocked:nth-child(3n+2) .level-number {
  background-color: rgba(102, 205, 170, 0.1);
  color: rgba(102, 205, 170, 0.9);
}

.level.unlocked:nth-child(3n+3) .level-number {
  background-color: rgba(147, 112, 219, 0.1);
  color: rgba(147, 112, 219, 0.9);
}

.level-desc {
  font-size: 0.85em;
  color: var(--color-text-light-gray);
  padding-left: 6px;
  line-height: 1.4;
}

.level.unlocked .level-desc {
  color: var(--color-text-white);
  font-weight: 500;
}

.level-status {
  font-size: 0.9em;
  text-align: right;
}

.level.unlocked .level-status {
  color: rgba(102, 205, 170, 0.9);
}

/* 为不同等级的成就添加不同的颜色 - 使用更优雅的色调 */
.level.unlocked:nth-child(3n+1) .level-status {
  color: rgba(100, 149, 237, 0.9);
}

.level.unlocked:nth-child(3n+2) .level-status {
  color: rgba(102, 205, 170, 0.9);
}

.level.unlocked:nth-child(3n+3) .level-status {
  color: rgba(147, 112, 219, 0.9);
}

.level.locked .level-status {
  color: var(--color-text-gray);
}

/* 展开指示器 */
.expand-indicator {
  text-align: center;
  margin-top: 8px;
  height: 12px;
}

.expand-icon {
  font-size: 0.7em;
  color: rgba(102, 205, 170, 0.7); /* 默认使用优雅的中海蓝绿色 */
  display: inline-block;
}

/* 根据最高解锁等级设置不同的展开指示器颜色 */
.level-1 .expand-icon {
  color: rgba(100, 149, 237, 0.7); /* 矢车菊蓝 - 1级 */
}

.level-2 .expand-icon {
  color: rgba(102, 205, 170, 0.7); /* 中海蓝绿色 - 2级 */
}

.level-3 .expand-icon {
  color: rgba(147, 112, 219, 0.7); /* 中紫色 - 3级 */
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
