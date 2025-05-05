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
