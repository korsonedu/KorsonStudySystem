<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{
    date: string,
    duration?: number,
    count?: number,
    value?: number
  }>,
  registrationDate?: string // 用户注册日期，可选参数
}>()

// 获取标准化的日期字符串 YYYY-MM-DD
function getFormattedDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 热力图数据计算
const heatmapData = computed(() => {
  // 创建今天的日期对象和日期字符串
  const today = new Date();
  const todayStr = getFormattedDate(today);
  
  // 使用用户注册日期作为开始日期，没有则默认为一年前
  let startDate: Date;
  if (props.registrationDate && props.registrationDate.trim()) {
    startDate = new Date(props.registrationDate);
    // 确保日期有效
    if (isNaN(startDate.getTime())) {
      // 默认为一年前
      startDate = new Date(today);
    }
  } else {
    // 默认为一年前
    startDate = new Date(today);
  }
  
  // 设置结束日期为当前日期
  const currentYear = today.getFullYear();
  const endDate = new Date(currentYear, 11, 31); // 11表示12月（0-11）
  
  // 调整开始日期到所在周的周日
  const firstDayOfWeek = startDate.getDay(); // 0=周日, 1=周一, ...
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setDate(adjustedStartDate.getDate() - firstDayOfWeek);
  
  // 创建日期到值的映射
  const dateMap = new Map<string, number>();
  
  // 处理传入的数据
  if (Array.isArray(props.data)) {
    props.data.forEach(item => {
      if (item && item.date) {
        // 标准化日期格式
        let dateStr = item.date;
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        // 提取并确保值是数字
        let value = 0;
        if (typeof item.duration === 'number') {
          value = item.duration;
        } else if (typeof item.value === 'number') {
          value = item.value;
        } else if (typeof item.count === 'number') {
          value = item.count;
        } else {
          // 尝试转换为数字
          value = Number(item.duration || item.value || item.count || 0);
          if (isNaN(value)) value = 0;
        }
        
        // 添加到日期映射
        dateMap.set(dateStr, value);
      }
    });
  }

  // 生成网格数据
  const grid = [];
  
  // 计算总天数
  const totalDays = Math.ceil(
    (endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  
  // 填充每一天的数据
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(adjustedStartDate);
    currentDate.setDate(adjustedStartDate.getDate() + i);
    
    // 如果超过了结束日期，停止
    if (currentDate > endDate) {
      break;
    }
    
    const dateStr = getFormattedDate(currentDate);
    const isInRange = currentDate >= startDate && currentDate <= today;
    const isToday = dateStr === todayStr;
    
    // 从映射中获取值，如果没有则为0
    const value = dateMap.get(dateStr) || 0;
    
    grid.push({
      date: dateStr,
      value: isInRange ? value : null, // 只有在范围内的日期才显示值
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      isToday: isToday
    });
  }

  return grid;
})

// 根据值获取对应的颜色
function getColor(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'transparent'; // 范围外的日期显示为透明
  }
  
  // 确保是数字类型
  const numValue = Number(value);
  
  // 检查无效值
  if (isNaN(numValue)) {
    return '#ebedf0'; // 默认灰色
  }
  
  // 0值显示为灰色
  if (numValue === 0) {
    return '#9be9ff';
  }
  
  // 根据值的大小返回不同深浅的蓝色
  if (numValue < 60) return '#9be9ff';
  if (numValue < 120) return '#4fc3f7';
  if (numValue < 150) return '#2196f3';
  if (numValue < 300) return '#1976d2';
  return '#0d47a1'; // 120以上使用最深的蓝色
}

// 格式化日期为中文格式
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } catch (e) {
    return '';
  }
}
</script>

<template>
  <div class="heatmap-container">
    <!-- 今日数据展示 -->
    <div class="today-data">
      <div class="data-item">
        <div class="data-label">今日学习</div>
        <div class="data-value">
          {{ heatmapData.find(day => day.isToday)?.value || 0 }} 分钟
        </div>
      </div>
    </div>
    
    <div class="heatmap-scroll">
      <!-- 热力图网格 -->
      <div class="heatmap-grid">
        <div
          v-for="(day, index) in heatmapData"
          :key="index"
          class="heatmap-cell"
          :class="{ 'today-cell': day.isToday }"
          :style="{ backgroundColor: getColor(day.value) }"
          :title="day.date ? `${formatDate(day.date)}: ${day.value || 0}分钟` : ''"
        ></div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <span>少</span>
      <div class="legend-item" style="background-color: #ebedf0"></div>
      <div class="legend-item" style="background-color: #9be9ff"></div>
      <div class="legend-item" style="background-color: #4fc3f7"></div>
      <div class="legend-item" style="background-color: #2196f3"></div>
      <div class="legend-item" style="background-color: #1976d2"></div>
      <div class="legend-item" style="background-color: #0d47a1"></div>
      <span>多</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  margin: 20px 0;
  padding: 20px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.today-data {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: rgba(33, 150, 243, 0.05);
  border-radius: 8px;
}

.data-item {
  text-align: center;
}

.data-label {
  font-size: 14px;
  color: #5c6bc0;
  margin-bottom: 5px;
}

.data-value {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}

.heatmap-scroll {
  position: relative;
  z-index: 1;
  width: 100%;
  overflow-x: auto; /* 添加水平滚动 */
  overflow-y: hidden;
  padding-bottom: 10px; /* 为滚动条留出空间 */
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 16px);
  grid-template-rows: repeat(7, 16px);
  grid-auto-flow: column;
  gap: 3px;
  padding-bottom: 10px;
  /* 确保网格从周日开始，到周六结束 */
  grid-template-areas:
    "sun"
    "mon"
    "tue"
    "wed"
    "thu"
    "fri"
    "sat";
  min-width: min-content; /* 确保网格不会被压缩 */
  margin: 0 auto; /* 居中显示 */
  width: fit-content; /* 确保网格宽度适应内容 */
}

.heatmap-cell {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05); /* 添加边框使单元格更明显 */
}

.heatmap-cell:hover {
  transform: scale(1.3);
  z-index: 2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.1); /* 悬停时边框更明显 */
}

/* 今天的单元格样式 */
.today-cell {
  border: 2px solid #ff5722 !important; /* 使用醒目的橙色边框 */
  box-shadow: 0 0 5px rgba(255, 87, 34, 0.5) !important; /* 添加发光效果 */
  z-index: 1; /* 确保今天的单元格在其他单元格之上 */
}

.today-cell:hover {
  transform: scale(1.4); /* 悬停时放大更多 */
  box-shadow: 0 0 8px rgba(255, 87, 34, 0.7) !important; /* 悬停时发光效果更强 */
}

.legend {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  gap: 6px;
  font-size: 12px;
  color: #5c6bc0;
  font-weight: 500;
  background: rgba(33, 150, 243, 0.03);
  padding: 8px 15px;
  border-radius: 20px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.legend-item {
  width: 15px;
  height: 15px;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
