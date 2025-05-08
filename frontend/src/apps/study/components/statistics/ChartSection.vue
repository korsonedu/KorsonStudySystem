<script setup lang="ts">
/**
 * 图表区域组件
 * 包含时间分布图和内容分布图
 */
import { defineProps } from 'vue';
import TimeDistributionChart from './TimeDistributionChart.vue';
import ContentDistributionChart from './ContentDistributionChart.vue';

// 定义组件属性
const props = defineProps<{
  // 当前视图 ('daily', 'weekly', 'monthly')
  currentView: string;
  // 每日统计数据
  hourlyStats: Array<{
    hour: number;
    time: string;
    duration: number;
  }>;
  // 每周统计数据
  weeklyStats: Array<{
    day: string;
    duration: number;
  }>;
  // 每月统计数据
  monthlyStats: Array<{
    day: string;
    duration: number;
  }>;
  // 内容统计数据
  contentStats: Array<{
    name: string;
    duration: number;
  }>;
}>();
</script>

<template>
  <div class="charts-section">
    <h3 class="section-heading">学习数据分析</h3>
    <p class="section-desc">了解您的学习时间和内容分布</p>

    <div class="charts-row">
      <div class="chart-column">
        <TimeDistributionChart
          :current-view="currentView"
          :hourly-stats="hourlyStats"
          :weekly-stats="weeklyStats"
          :monthly-stats="monthlyStats"
        />
      </div>

      <div class="chart-column">
        <ContentDistributionChart :content-stats="contentStats" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts-section {
  margin-bottom: 50px;
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

.section-desc {
  margin: 10px 0 0;
  color: #5c6bc0;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.8;
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
  min-height: 400px;
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
}
</style>
