<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

// 注册Chart.js组件
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// 时间数据项接口
interface TimeDataItem {
  hour?: number;
  duration?: number;
  count?: number;
  value?: number;
  time?: string;
  time_slot?: string;
  [key: string]: any;
}

const props = defineProps<{
  data: Array<TimeDataItem>
}>()

// 图表数据计算
const chartData = computed(() => {
  const labels = []
  const data = []

  // 创建24小时的标签
  for (let i = 0; i < 24; i++) {
    labels.push(`${i}:00`)
  }

  // 创建数据数组
  const values = new Array(24).fill(0)

  // 填充实际数据
  if (Array.isArray(props.data)) {
    props.data.forEach(item => {
      let hour: number | undefined

      // 尝试从不同字段获取小时数据
      if (item.hour !== undefined) {
        hour = Number(item.hour)
      } else if (item.time) {
        // 从 "HH:MM" 格式中提取小时
        const match = item.time.match(/^(\d+):/)
        hour = match ? Number(match[1]) : undefined
      } else if (item.time_slot) {
        // 尝试从time_slot中提取小时
        const match = item.time_slot.match(/(\d+)/)
        hour = match ? Number(match[1]) : undefined
      }

      // 确保小时在有效范围内
      if (hour !== undefined && hour >= 0 && hour < 24) {
        // 尝试从不同字段获取值
        const value = Number(
          item.duration !== undefined ? item.duration :
          item.value !== undefined ? item.value :
          item.count !== undefined ? item.count : 0
        )

        if (!isNaN(value)) {
          values[hour] = value
        }
      }
    })
  }

  return {
    labels,
    datasets: [
      {
        label: '学习时长 (分钟)',
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(33, 150, 243, 0.9)',
        data: values
      }
    ]
  }
})

// 计算峰值时段
const peakHour = computed(() => {
  if (!props.data || props.data.length === 0) return '暂无数据';

  let maxHour = 0;
  let maxValue = 0;

  // 查找最大值对应的小时
  for (let i = 0; i < 24; i++) {
    const hourData = props.data.find(item => item.hour === i);
    if (hourData) {
      const value = Number(hourData.duration || hourData.value || hourData.count || 0);
      if (value > maxValue) {
        maxValue = value;
        maxHour = i;
      }
    }
  }

  // 格式化输出
  return maxValue > 0 ? `${maxHour}:00 - ${maxHour+1}:00` : '暂无数据';
});

// 计算活跃时段数
const activeHours = computed(() => {
  if (!props.data || props.data.length === 0) return 0;

  // 统计时长大于0的小时数
  let count = 0;
  for (let i = 0; i < 24; i++) {
    const hourData = props.data.find(item => item.hour === i);
    if (hourData) {
      const value = Number(hourData.duration || hourData.value || hourData.count || 0);
      if (value > 0) count++;
    }
  }

  return count;
});

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const value = context.raw || 0;
          return `${value} 分钟`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '学习时长(分钟)'
      }
    },
    x: {
      title: {
        display: true,
        text: '小时'
      }
    }
  }
}
</script>

<template>
  <div class="time-distribution-chart">
    <h3>学习时间分布</h3>

    <!-- 统计信息 -->
    <div class="stats-summary">
      <div class="stat-item">
        <div class="stat-label">峰值时段</div>
        <div class="stat-value">{{ peakHour }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">活跃时段</div>
        <div class="stat-value">{{ activeHours }}小时</div>
      </div>
    </div>

    <div class="chart-container">
      <div v-if="props.data && props.data.length > 0" class="chart-wrapper">
        <Bar :data="chartData" :options="chartOptions" height="300" />
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
  margin: 0 0 15px;
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

.stats-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  background: rgba(33, 150, 243, 0.05);
  padding: 12px;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #5c6bc0;
  margin-bottom: 5px;
  font-weight: 500;
}

.stat-value {
  font-size: 1.1rem;
  color: #1976d2;
  font-weight: 600;
}

.chart-container {
  height: 250px;
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
