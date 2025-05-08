<script setup lang="ts">
/**
 * 内容分布图表组件
 * 显示学习内容的分布情况
 */
import { defineProps, computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// 注册ChartJS组件
ChartJS.register(ArcElement, Tooltip, Legend);

// 定义组件属性
const props = defineProps<{
  // 内容统计数据
  contentStats: Array<{
    name: string;
    duration: number;
  }>;
}>();

// 生成随机颜色
const generateColors = (count: number): string[] => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 137) % 360; // 使用黄金角分布获取不同的色相
    colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
  }
  return colors;
};

// 处理内容统计数据
const processContentStats = (contentStats: any[]): any[] => {
  // 打印传入的内容统计数据，用于调试
  console.log('Content stats received by chart:', contentStats);

  if (!Array.isArray(contentStats)) {
    console.log('Content stats is not an array');
    return [{
      name: '未分类',
      duration: 1 // 使用1分钟作为默认值，确保图表能够显示
    }];
  }

  if (contentStats.length === 0) {
    console.log('Content stats array is empty');
    // 如果没有数据，创建一个默认的"未分类"项
    return [{
      name: '未分类',
      duration: 1 // 使用1分钟作为默认值，确保图表能够显示
    }];
  }

  // 处理数据，确保有name和duration字段
  const processedStats = contentStats.map((item: any) => {
    // 确保name字段有值
    let name = '未分类';
    if (item.name) name = item.name;
    else if (item.category) name = item.category;
    else if (item.content) name = item.content;
    else if (item.title) name = item.title;

    // 确保duration字段有值
    let duration = 0;
    if (typeof item.duration === 'number') duration = item.duration;
    else if (typeof item.value === 'number') duration = item.value;
    else if (typeof item.count === 'number') duration = item.count;
    else if (typeof item.time === 'number') duration = item.time;

    // 确保duration至少为1分钟
    duration = Math.max(duration, 1);

    return { name, duration };
  });

  // 过滤掉duration为0的项
  let filteredStats = processedStats.filter((item: any) => item.duration > 0);

  // 如果过滤后没有数据，创建一个默认的"未分类"项
  if (filteredStats.length === 0) {
    filteredStats = [{
      name: '未分类',
      duration: 1 // 使用1分钟作为默认值，确保图表能够显示
    }];
  }

  // 合并相同名称的项
  const mergedStats = new Map<string, number>();
  filteredStats.forEach(item => {
    const currentDuration = mergedStats.get(item.name) || 0;
    mergedStats.set(item.name, currentDuration + item.duration);
  });

  // 转换回数组格式
  let result = Array.from(mergedStats.entries())
    .map(([name, duration]) => ({ name, duration }))
    .sort((a, b) => b.duration - a.duration); // 按时长降序排序

  // 限制数据项数量，避免图表过于复杂
  if (result.length > 10) {
    console.log('ContentDistributionChart - 数据项过多，只显示前10项');
    result = result.slice(0, 10);
  }

  // 打印处理后的内容统计数据，用于调试
  console.log('Processed content stats:', result);

  return result;
};

// 图表数据
const chartData = computed(() => {
  // 打印原始内容统计数据，用于调试
  console.log('ContentDistributionChart - 原始内容统计数据:', props.contentStats);

  // 处理内容统计数据
  const filteredStats = processContentStats(props.contentStats);

  // 打印处理后的内容统计数据，用于调试
  console.log('ContentDistributionChart - 处理后的内容统计数据:', filteredStats);

  // 如果没有有效数据，返回默认数据
  if (filteredStats.length === 0) {
    console.log('ContentDistributionChart - 没有有效数据，使用默认数据');
    const defaultLabels = ['未分类'];
    const defaultData = [1];
    const defaultColors = ['rgba(200, 200, 200, 0.8)'];

    return {
      labels: defaultLabels,
      datasets: [{
        backgroundColor: defaultColors,
        data: defaultData
      }]
    };
  }

  // 限制数据项数量，避免图表过于复杂
  if (filteredStats.length > 10) {
    console.log('ContentDistributionChart - 数据项过多，只显示前10项');
    filteredStats = filteredStats.slice(0, 10);
  }

  // 提取标签和数据
  const labels = filteredStats.map((item: any) => item.name);
  const data = filteredStats.map((item: any) => item.duration);
  const backgroundColor = generateColors(labels.length);

  // 打印图表数据，用于调试
  console.log('ContentDistributionChart - 图表标签:', labels);
  console.log('ContentDistributionChart - 图表数据:', data);

  return {
    labels,
    datasets: [{
      backgroundColor,
      data
    }]
  };
});

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 10
  },
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 15,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} 分钟 (${percentage}%)`;
        }
      }
    }
  }
};

// 检查是否有数据
const hasData = computed(() => {
  return chartData.value.datasets[0].data && chartData.value.datasets[0].data.length > 0;
});
</script>

<template>
  <div class="chart-card">
    <div class="card-header">
      <div class="card-icon">🍩</div>
      <h3>学习内容分布</h3>
    </div>
    <div class="chart-container">
      <div v-if="!hasData" class="empty-message">
        <span class="empty-icon">📚</span>
        <span class="empty-text">暂无数据</span>
        <span class="empty-subtext">您还没有记录学习内容</span>
      </div>
      <Doughnut v-else :data="chartData" :options="chartOptions" :height="300" :width="400" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 450px;
  max-height: 450px;
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.chart-card .card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(33, 150, 243, 0.1);
  padding-bottom: 15px;
  flex-shrink: 0;
}

.chart-card .card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.chart-card .card-header h3 {
  margin: 0;
  color: #1976d2;
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
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  flex: 1;
  font-size: 1rem;
  color: #9e9e9e;
  position: relative;
  padding: 20px;
  text-align: center;
}

.empty-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #757575;
}

.empty-subtext {
  font-size: 0.9rem;
  color: #9e9e9e;
}
</style>
