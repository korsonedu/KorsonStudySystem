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
      // 获取小时值
      let hour = typeof item.hour === 'number' ? item.hour : -1;
      
      // 尝试从时间字符串中提取小时
      if (hour < 0 && item.time) {
        try {
          const timeStr = item.time.toString();
          if (timeStr.includes(':')) {
            hour = parseInt(timeStr.split(':')[0]);
          } else if (!isNaN(Number(timeStr))) {
            hour = Number(timeStr);
          }
        } catch (error) {
          console.error('无法从时间字符串提取小时:', item.time);
        }
      }
      
      // 如果还是无法获取小时，尝试从time_slot字段提取
      if (hour < 0 && item.time_slot) {
        try {
          const timeSlot = item.time_slot.toString();
          if (timeSlot.includes('-')) {
            const startHour = timeSlot.split('-')[0].trim();
            hour = parseInt(startHour.split(':')[0]);
          } else if (timeSlot.includes(':')) {
            hour = parseInt(timeSlot.split(':')[0]);
          }
        } catch (error) {
          console.error('无法从time_slot提取小时:', item.time_slot);
        }
      }
      
      // 检查小时是否有效
      if (hour >= 0 && hour < 24) {
        // 获取值（优先使用duration字段）
        let value = 0
        if (typeof item.duration === 'number') {
          value = item.duration
        } else if (typeof item.value === 'number') {
          value = item.value
        } else if (typeof item.count === 'number') {
          value = item.count
        } else {
          // 尝试转换为数字
          value = Number(item.duration || item.value || item.count || 0)
          if (isNaN(value)) value = 0
        }
        
        // 设置值到对应小时
        values[hour] = value
      }
    })
  }
  
  return {
    labels,
    datasets: [{
      label: '学习时长(分钟)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2,
      data: values,
      hoverBackgroundColor: 'rgba(75, 192, 192, 0.4)',
      borderRadius: 4,
      maxBarThickness: 30
    }]
  }
})

// 计算峰值时段
const peakHour = computed(() => {
  if (!props.data || props.data.length === 0) return '无数据';
  
  let maxIndex = 0;
  let maxValue = 0;
  
  // 遍历所有小时，找出值最大的小时
  for (let i = 0; i < 24; i++) {
    const hourData = props.data.find(item => item.hour === i);
    if (hourData) {
      const value = Number(hourData.duration || hourData.value || hourData.count || 0);
      if (value > maxValue) {
        maxValue = value;
        maxIndex = i;
      }
    }
  }
  
  return maxValue > 0 ? `${maxIndex}:00` : '无数据';
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
      display: true,
      position: 'top'
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
  <div class="time-distribution">
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
    
    <!-- 图表 -->
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.time-distribution {
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: rgba(33, 150, 243, 0.05);
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #5c6bc0;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}

.chart-container {
  height: 300px;
  position: relative;
}
</style>

