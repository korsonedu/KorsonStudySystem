<script setup lang="ts">
/**
 * 时间分布图表组件
 * 显示学习时长在不同时间段的分布
 */
import { computed, onMounted, onUnmounted } from 'vue';
// defineProps 是编译器宏，不需要导入
import { Bar, Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// 注册ChartJS组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

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
}>();

// 图表数据
const chartData = computed(() => {
  let labels = [];
  let data = [];

  console.log('Current view in TimeDistributionChart:', props.currentView);
  console.log('Hourly stats:', props.hourlyStats);
  console.log('Weekly stats:', props.weeklyStats);
  console.log('Monthly stats:', props.monthlyStats);

  if (props.currentView === 'daily') {
    // 创建24小时的标签和数据数组
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyData = Array(24).fill(0);

    // 填充小时数据
    if (Array.isArray(props.hourlyStats) && props.hourlyStats.length > 0) {
      props.hourlyStats.forEach(item => {
        const hour = item.hour;
        if (hour >= 0 && hour < 24) {
          hourlyData[hour] = item.duration;
        }
      });
    }

    labels = hours;
    data = hourlyData;
  } else if (props.currentView === 'weekly') {
    // 默认周数据 - 中国习惯，周一到周日
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const weeklyData = Array(7).fill(0);

    // 使用每周数据
    if (Array.isArray(props.weeklyStats) && props.weeklyStats.length > 0) {
      // 创建一个映射，用于存储每天的学习时长
      const dayMap = new Map();
      weekDays.forEach((day, index) => dayMap.set(day, index));

      props.weeklyStats.forEach(item => {
        const dayIndex = dayMap.get(item.day);
        if (dayIndex !== undefined) {
          weeklyData[dayIndex] = item.duration;
        }
      });
    }

    labels = weekDays;
    data = weeklyData;
  } else {
    // 默认月数据
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
    const monthlyData = Array(daysInMonth).fill(0);

    // 使用每月数据
    if (Array.isArray(props.monthlyStats) && props.monthlyStats.length > 0) {
      // 创建一个映射，用于存储每天的学习时长
      const dayMap = new Map();
      monthDays.forEach((day, index) => dayMap.set(day, index));

      props.monthlyStats.forEach(item => {
        // 尝试提取日期数字
        let dayText = item.day;
        if (!dayText.includes('日')) {
          const dayNumber = parseInt(dayText);
          if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
            dayText = `${dayNumber}日`;
          }
        }

        const dayIndex = dayMap.get(dayText);
        if (dayIndex !== undefined) {
          monthlyData[dayIndex] = item.duration;
        }
      });
    }

    labels = monthDays;
    data = monthlyData;
  }

  console.log('Chart labels:', labels);
  console.log('Chart data:', data);

  // 确保数据是数字类型
  const numericData = data.map(val => typeof val === 'number' ? val : 0);

  return {
    labels,
    datasets: [
      {
        label: '学习时长 (分钟)',
        backgroundColor: 'rgba(227, 207, 87, 0.3)', // 使用淡黄色，更好的对比度
        borderColor: 'rgba(227, 207, 87, 0.8)', // 使用黄色边框，更好的可见度
        borderWidth: 2,
        data: numericData,
        tension: 0.3 // 添加曲线平滑度
      }
    ]
  };
});

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: 'rgba(255, 255, 255, 0.8)',
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    },
    x: {
      ticks: {
        color: 'rgba(255, 255, 255, 0.8)',
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      }
    }
  },
  layout: {
    padding: 10
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 12,
          weight: '500'
        },
        padding: 10
      }
    }
  }
};

// 响应式调整图表选项
const updateChartOptions = () => {
  if (window.innerWidth <= 600) {
    chartOptions.scales.x.ticks.font.size = 9;
    chartOptions.scales.y.ticks.font.size = 9;
    chartOptions.plugins.legend.labels.font.size = 10;
    chartOptions.layout.padding = 5;
  } else {
    chartOptions.scales.x.ticks.font.size = 11;
    chartOptions.scales.y.ticks.font.size = 11;
    chartOptions.plugins.legend.labels.font.size = 12;
    chartOptions.layout.padding = 10;
  }
};

// 监听窗口大小变化
onMounted(() => {
  updateChartOptions();
  window.addEventListener('resize', updateChartOptions);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateChartOptions);
});

// 检查是否有数据
const hasData = computed(() => {
  return chartData.value.datasets[0].data.some(val => val > 0);
});
</script>

<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="card-icon">📊</div>
      <h3>学习时长分布</h3>
    </div>
    <div class="chart-container">
      <div v-if="!hasData" class="empty-message">
        <span class="empty-icon">📈</span>
        <span class="empty-text">暂无数据</span>
        <span class="empty-subtext">您还没有记录学习时间</span>
      </div>
      <Bar v-else-if="currentView === 'daily'" :data="chartData" :options="chartOptions" :height="300" :width="400" />
      <Line v-else :data="chartData" :options="chartOptions" :height="300" :width="400" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background-color: rgba(74, 106, 138, 0.05);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 450px;
  max-height: 450px;
  border: 1px solid rgba(74, 106, 138, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: 0 15px 35px rgba(74, 106, 138, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
  background-color: rgba(74, 106, 138, 0.08);
}

.chart-card .card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(74, 106, 138, 0.2);
  padding-bottom: 15px;
  flex-shrink: 0;
}

.chart-card .card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: var(--color-text-white);
  opacity: 0.8;
}

.chart-card .card-header h3 {
  margin: 0;
  color: var(--color-text-white);
  font-size: 1.2rem;
  font-weight: 600;
}

.chart-container {
  height: 350px;
  max-height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.empty-message {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(74, 106, 138, 0.03);
  border-radius: 10px;
  flex: 1;
  font-size: 1rem;
  color: var(--color-text-gray);
  position: relative;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(74, 106, 138, 0.1);
}

.empty-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
  color: var(--color-text-light-gray);
}

.empty-text {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: var(--color-text-light-gray);
}

.empty-subtext {
  font-size: 0.9rem;
  color: var(--color-text-gray);
}
</style>
