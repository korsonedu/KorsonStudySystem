<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

// 注册Chart.js组件
ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  data: Array<{
    hour: number,
    duration: number
  }>
}>()

// 准备图表数据
const chartData = computed(() => {
  // 将24小时分为4个时间段
  const morningHours = [6, 7, 8, 9, 10, 11]
  const afternoonHours = [12, 13, 14, 15, 16, 17]
  const eveningHours = [18, 19, 20, 21, 22, 23]
  const nightHours = [0, 1, 2, 3, 4, 5]

  // 计算每个时间段的总时长
  const morning = props.data
    .filter(item => morningHours.includes(item.hour))
    .reduce((sum, item) => sum + item.duration, 0)

  const afternoon = props.data
    .filter(item => afternoonHours.includes(item.hour))
    .reduce((sum, item) => sum + item.duration, 0)

  const evening = props.data
    .filter(item => eveningHours.includes(item.hour))
    .reduce((sum, item) => sum + item.duration, 0)

  const night = props.data
    .filter(item => nightHours.includes(item.hour))
    .reduce((sum, item) => sum + item.duration, 0)

  return {
    labels: ['早晨 (6-12点)', '下午 (12-18点)', '晚上 (18-24点)', '深夜 (0-6点)'],
    datasets: [
      {
        backgroundColor: [
          '#FF9800', // 早晨 - 橙色
          '#2196F3', // 下午 - 蓝色
          '#673AB7', // 晚上 - 紫色
          '#263238'  // 深夜 - 深灰色
        ],
        borderColor: 'white',
        borderWidth: 2,
        hoverBackgroundColor: [
          '#FF9800', // 早晨 - 橙色
          '#2196F3', // 下午 - 蓝色
          '#673AB7', // 晚上 - 紫色
          '#263238'  // 深夜 - 深灰色
        ],
        hoverBorderColor: 'white',
        hoverBorderWidth: 2,
        data: [morning, afternoon, evening, night]
      }
    ]
  }
})

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',  // 设置为环形图
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 12,
          weight: '500'
        },
        color: '#424242'
      }
    },
    tooltip: {
      backgroundColor: 'white',
      titleColor: '#424242',
      bodyColor: '#212121',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      cornerRadius: 4,
      padding: 10,
      callbacks: {
        label: function(context: any) {
          const value = context.raw || 0
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0)
          const percentage = Math.round((value / total) * 100)
          return `${context.label}: ${value} 分钟 (${percentage}%)`
        }
      }
    }
  },
  elements: {
    arc: {
      borderWidth: 1,
      borderRadius: 4,
      hoverOffset: 4
    }
  },
  animation: {
    duration: 500
  }
}
</script>

<template>
  <div class="time-distribution-chart">
    <h3>学习时间分布</h3>
    <div class="chart-container">
      <div v-if="props.data && props.data.length > 0" class="chart-wrapper">
        <Pie :data="chartData" :options="chartOptions" height="300" />
      </div>
      <div v-else class="empty-chart">
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无数据</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-distribution-chart {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  height: 100%;
  min-height: 350px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
}

.time-distribution-chart:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

h3 {
  text-align: center;
  margin: 0 0 20px;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.chart-container {
  height: 300px;
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}

.empty-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #9e9e9e;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.3;
}

.empty-text {
  font-size: 1rem;
  opacity: 0.7;
}
</style>
