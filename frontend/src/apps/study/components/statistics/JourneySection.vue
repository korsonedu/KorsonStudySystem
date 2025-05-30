<script setup lang="ts">
/**
 * 学习旅程记录组件
 * 显示热力图和激励语
 */
import { defineProps } from 'vue';
import HeatmapChart from './HeatmapChart.vue';

// 定义组件属性
const props = defineProps<{
  // 热力图数据
  heatmapData: Array<{
    date: string;
    duration: number;
  }>;
  // 用户注册日期
  registrationDate: string;
}>();
</script>

<template>
  <div class="journey-section">
    <h3 class="section-heading">学习旅程记录</h3>
    <p class="section-desc">见证每一天的坚持与成长</p>
    <div class="heatmap-wrapper">
      <div class="heatmap-container">
        <HeatmapChart :data="heatmapData" :registration-date="registrationDate" />
        <div class="journey-motivation">
          <div class="motivation-icon">🚀</div>
          <p class="motivation-text">每一个有学习记录的日子，都是成长的印记</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journey-section {
  margin-bottom: 50px;
  position: relative;
}

.section-heading {
  color: var(--color-text-white);
  font-size: 1.5rem;
  font-weight: 600;
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
  background: rgba(74, 106, 138, 0.8);
  border-radius: 1.5px;
}

.section-desc {
  margin: 10px 0 0;
  color: var(--color-text-light-gray);
  font-size: 0.95rem;
  font-weight: 500;
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
  background-color: rgba(74, 106, 138, 0.05);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid rgba(74, 106, 138, 0.3);
  max-width: 900px;
  width: 100%;
  transition: all var(--transition-normal) ease;
}

.heatmap-container:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-5px);
  background-color: rgba(74, 106, 138, 0.08);
}

.journey-motivation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(74, 106, 138, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(74, 106, 138, 0.2);
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
</style>
