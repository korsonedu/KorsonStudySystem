<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps<{
  data: Array<{
    date: string,
    value: number
  }>,
  registrationDate?: string // 用户注册日期，可选参数
}>()

/*  */
// 计算热力图数据
const heatmapData = computed(() => {
  // 获取当前日期
  const today = new Date()

  // 从后端获取的用户注册日期
  const userRegistrationDate = props.registrationDate
    ? new Date(props.registrationDate)
    : new Date(today.getFullYear() - 1, 0, 1) // 如果没有提供注册日期，默认使用去年1月1日

  // 使用用户注册日期作为起始日期
  const startDate = userRegistrationDate

  // 结束日期为用户注册日期次年的3月31日
  const registrationYear = userRegistrationDate.getFullYear()
  const endDate = new Date(registrationYear + 1, 2, 31) // 注册年份的次年3月31日

  // 计算起始日期是星期几 (0 = 周日, 1 = 周一, ..., 6 = 周六)
  const firstDayOfWeek = startDate.getDay()

  // 调整起始日期，使其从所在周的周日开始
  const adjustedStartDate = new Date(startDate)
  adjustedStartDate.setDate(startDate.getDate() - firstDayOfWeek)

  // 调整结束日期，确保包含完整的一周
  const lastDayOfWeek = endDate.getDay() // 0 = 周日, 6 = 周六
  const daysToAdd = 6 - lastDayOfWeek
  const adjustedEndDate = new Date(endDate)
  adjustedEndDate.setDate(endDate.getDate() + daysToAdd)

  // 创建日期映射
  const dateMap = new Map()
  props.data.forEach(item => {
    dateMap.set(item.date, item.value)
  })

  // 生成网格数据
  const grid = []

  // 填充所有日期，从调整后的起始日期到调整后的结束日期
  let currentDate = new Date(adjustedStartDate)
  while (currentDate <= adjustedEndDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const value = dateMap.get(dateStr) || 0
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()

    // 只有在日期范围内的日期才显示值，范围外的显示为空白但保持网格结构
    const isInRange = (currentDate >= startDate && currentDate <= endDate)

    grid.push({
      date: dateStr,
      value: isInRange ? value : null,
      month: isInRange ? month : null,
      year
    })

    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return grid
})


// 计算颜色强度
const getColor = (value: number) => {
  if (value === null) return 'transparent'
  if (value === 0) return '#ebedf0'

  // 使用更现代的蓝色渐变色调
  if (value < 30) return '#9be9ff'
  if (value < 60) return '#4fc3f7'
  if (value < 90) return '#2196f3'
  if (value < 120) return '#1976d2'
  return '#0d47a1'
}

// 格式化日期显示
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

// 计算月份标签
const monthLabels = computed(() => {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const labels = []

  // 获取所有月份的第一天在网格中的位置
  const grid = heatmapData.value
  if (!grid || grid.length === 0) return []

  let currentMonth = -1
  let currentYear = -1
  let position = 0

  grid.forEach((day, index) => {
    if (!day.date) return

    const date = new Date(day.date)
    const month = date.getMonth()
    const year = date.getFullYear()

    // 如果是新的月份，添加标签
    if (month !== currentMonth || year !== currentYear) {
      // 计算位置（列索引）
      position = Math.floor(index / 7)

      labels.push({
        month: months[month],
        position
      })

      currentMonth = month
      currentYear = year
    }
  })

  return labels
})
</script>

<template>
  <div class="heatmap-container">
    <div class="heatmap-scroll">
      <!-- 月份标签 -->
      <div class="month-labels">
        <div
          v-for="(label, index) in monthLabels"
          :key="index"
          class="month-label"
          :style="{ left: `${label.position * 15}px` }"
        >
          {{ label.month }}
        </div>
      </div>

      <!-- 热力图网格 -->
      <div class="heatmap-grid">
        <div
          v-for="(day, index) in heatmapData"
          :key="index"
          class="heatmap-cell"
          :style="{ backgroundColor: getColor(day.value) }"
          :title="day.date ? `${formatDate(day.date)}: ${day.value}分钟` : ''"
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
  padding-top: 25px;
  z-index: 1;
  width: 100%;
  overflow: visible;
}



.month-labels {
  position: relative;
  height: 25px;
}

.month-label {
  position: absolute;
  top: 0;
  font-size: 11px;
  color: #5c6bc0;
  transform: translateX(-50%);
  font-weight: 500;
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
  max-width: 100%;
  margin: 0 auto; /* 居中显示 */
}

.heatmap-cell {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.heatmap-cell:hover {
  transform: scale(1.3);
  z-index: 2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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
