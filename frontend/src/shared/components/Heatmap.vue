<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps<{
  data: Array<{
    date: string,
    duration?: number,
    count?: number,
    value?: number
  }>,
  registrationDate?: string // 用户注册日期，可选参数
}>()

/*  */
// 计算热力图数据
const heatmapData = computed(() => {
  // 获取当前日期
  const today = new Date()

  // 从后端获取的用户注册日期
  let userRegistrationDate;

  // 检查是否有有效的注册日期
  if (props.registrationDate && props.registrationDate.trim() !== '') {
    try {
      userRegistrationDate = new Date(props.registrationDate);
      // 检查日期是否有效
      if (isNaN(userRegistrationDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (e) {
      console.error('Error parsing registration date:', e);
      // 如果解析失败，使用当前日期的前一年作为默认值
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      userRegistrationDate = oneYearAgo;
    }
  } else {
    // 如果没有提供注册日期，使用当前日期的前一年作为默认值
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    userRegistrationDate = oneYearAgo;
  }

  console.log('Registration date (raw):', props.registrationDate);
  console.log('Parsed registration date:', userRegistrationDate);

  // 使用用户注册日期作为起始日期
  const startDate = userRegistrationDate;

  // 结束日期为用户注册日期次年的3月31日
  const registrationYear = userRegistrationDate.getFullYear();
  const endDate = new Date(registrationYear + 1, 2, 31); // 注册年份的次年3月31日

  console.log('Start date for heatmap:', startDate);
  console.log('End date for heatmap:', endDate);

  // 计算起始日期是星期几 (0 = 周日, 1 = 周一, ..., 6 = 周六)
  const firstDayOfWeek = startDate.getDay()

  // 调整起始日期，使其从所在周的周日开始
  const adjustedStartDate = new Date(startDate)
  adjustedStartDate.setDate(startDate.getDate() - firstDayOfWeek)

  // 创建日期映射
  const dateMap = new Map()

  console.log('Heatmap component received data:', props.data)
  console.log('Heatmap data length:', props.data.length)
  console.log('Registration date:', props.registrationDate)
  console.log('Start date:', startDate)
  console.log('End date:', endDate)

  // 确保数据是有效的
  console.log('Heatmap data type:', typeof props.data)
  console.log('Heatmap data:', JSON.stringify(props.data, null, 2))

  if (Array.isArray(props.data)) {
    console.log('Heatmap data is an array with length:', props.data.length)

    const today = new Date().toISOString().split('T')[0]

    props.data.forEach(item => {
      if (item && item.date) {
        // 使用 value 字段，如果没有则使用 duration 或 count 字段
        const value = item.value !== undefined ? item.value :
                     (item.duration !== undefined ? item.duration :
                     (item.count !== undefined ? item.count : 0))

        // 确保日期格式正确（YYYY-MM-DD）
        let dateStr = item.date
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0]
        }

        dateMap.set(dateStr, value)
        console.log(`Added heatmap data: ${dateStr} -> ${value}`)
      }
    })
  } else {
    console.error('Heatmap data is not an array:', props.data)
  }

  // 生成网格数据
  const grid = []

  // 计算从起始日期到结束日期的总天数
  const totalDays = Math.ceil((endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // 填充所有日期，从调整后的起始日期到结束日期
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(adjustedStartDate)
    currentDate.setDate(adjustedStartDate.getDate() + i)

    // 如果超过了结束日期，就停止
    if (currentDate > endDate) {
      break
    }

    const dateStr = currentDate.toISOString().split('T')[0]
    const value = dateMap.get(dateStr) || 0
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()

    // 只有在日期范围内的日期才显示值，范围外的显示为空白但保持网格结构
    const isInRange = (currentDate >= startDate && currentDate <= endDate)

    // 检查是否是今天的日期
    const isToday = dateStr === today.toISOString().split('T')[0]

    grid.push({
      date: dateStr,
      value: isInRange ? value : null,
      month: isInRange ? month : null,
      year,
      isToday: isToday
    })
  }

  return grid
})


// 计算颜色强度
const getColor = (value: number) => {
  if (value === null || value === undefined) return 'transparent'
  if (value === 0) return '#ebedf0'

  console.log(`Calculating color for value: ${value}`)

  // 使用更现代的蓝色渐变色调
  if (value < 30) return '#9be9ff'
  if (value < 60) return '#4fc3f7'
  if (value < 90) return '#2196f3'
  if (value < 120) return '#1976d2'
  return '#0d47a1'
}

// 格式化日期显示，使用中国时区
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''

  // 创建一个新的Date对象
  const date = new Date(dateStr)

  // 获取UTC时间
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)

  // 调整为中国时区（UTC+8）
  const chinaDate = new Date(utcDate.getTime() + 8 * 60 * 60000)

  return `${chinaDate.getFullYear()}年${chinaDate.getMonth() + 1}月${chinaDate.getDate()}日`
}

// 不再需要月份标签计算
</script>

<template>
  <div class="heatmap-container">
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

.heatmap-container::before {
  content: '';
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.05), transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.heatmap-container::after {
  content: '';
  position: absolute;
  bottom: -30px;
  left: -30px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(3, 169, 244, 0.05), transparent 70%);
  border-radius: 50%;
  z-index: 0;
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
