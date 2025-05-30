<script setup lang="ts">
/**
 * 学习概览组件
 * 显示今日、本周、本月和累计学习时长
 */
import { defineProps } from 'vue';

// 定义组件属性
const props = defineProps<{
  dailyDuration: number;
  weeklyDuration: number;
  monthlyDuration: number;
  totalHours: number;
}>();
</script>

<template>
  <div class="overview-section">
    <h3 class="section-heading">学习概览</h3>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-content">
          <h3>今日学习时长</h3>
          <p>{{ dailyDuration || 0 }} 分钟</p>
          <span class="stat-caption">坚持每一天的努力</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <h3>本周学习时长</h3>
          <p>{{ weeklyDuration || 0 }} 分钟</p>
          <span class="stat-caption">稳步前进的一周</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h3>本月学习时长</h3>
          <p>{{ monthlyDuration || 0 }} 分钟</p>
          <span class="stat-caption">持续成长的一个月</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-content">
          <h3>累计学习时长</h3>
          <p>{{ (totalHours || 0).toFixed(2) }} 小时</p>
          <span class="stat-caption">知识积累的见证</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-section {
  margin-bottom: 50px;
  position: relative;
}

.section-heading {
  color: var(--color-text-white);
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background-color: rgba(74, 106, 138, 0.05); /* 使用 #4A6A8A 作为底纹 */
  border-radius: 12px;
  padding: 25px 20px;
  text-align: center;
  box-shadow: var(--card-shadow);
  transition: all var(--transition-normal) ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(74, 106, 138, 0.3); /* 使用 #4A6A8A 作为边框 */
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--card-shadow-hover);
  background-color: rgba(74, 106, 138, 0.08); /* 使用 #4A6A8A 作为悬停底纹 */
}

.stat-card h3 {
  margin: 0 0 15px;
  color: var(--color-text-white);
  font-size: 1.1rem;
  font-weight: 500;
}

.stat-card p {
  margin: 0;
  color: var(--color-text-white);
  font-size: 2rem;
  font-weight: 600;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  opacity: 0.8;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-caption {
  display: block;
  margin-top: 10px;
  color: var(--color-text-gray);
  font-size: 0.9rem;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
