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

.heatmap-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.heatmap-container {
  position: relative;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  max-width: 900px;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.heatmap-container:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.journey-motivation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 10px;
}

.motivation-icon {
  font-size: 1.8rem;
  margin-right: 15px;
}

.motivation-text {
  color: #1976d2;
  font-size: 1rem;
  font-weight: 500;
}
</style>
