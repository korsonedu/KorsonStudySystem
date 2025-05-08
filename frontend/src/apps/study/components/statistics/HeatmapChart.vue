<script setup lang="ts">
/**
 * 热力图组件
 * 显示从注册日期到次年3月31日的学习记录
 */
import { defineProps, computed, ref, onMounted, watch } from 'vue';

// 定义组件属性
const props = defineProps<{
  // 热力图数据
  data: Array<{
    date?: string;
    day?: string;
    duration?: number;
    time?: number;
    count?: number;
    [key: string]: any; // 允许任何其他属性
  }>;
  // 用户注册日期
  registrationDate: string;
}>();

// 获取标准化的日期字符串 YYYY-MM-DD（中国时区）
function getFormattedDate(date: Date): string {
  // 使用中国时区（UTC+8）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取当前中国时区的日期对象
function getNowInChinaTimezone(): Date {
  const now = new Date();
  // 中国时区偏移量（+8小时）
  const chinaTimezoneOffset = 8 * 60 * 60 * 1000;
  // 获取当前时区偏移量
  const localTimezoneOffset = now.getTimezoneOffset() * 60 * 1000;
  // 调整为中国时区
  return new Date(now.getTime() + localTimezoneOffset + chinaTimezoneOffset);
}

// 创建今天的日期对象和日期字符串（中国时区）
const today = getNowInChinaTimezone();
const todayStr = getFormattedDate(today);
console.log('今日日期（中国时区）:', todayStr);

// 创建日期到值的映射
const dateMap = ref(new Map<string, number>());

// 今日学习时间
const todayMinutes = computed(() => {
  if (!dateMap.value) return 0;
  return dateMap.value.get(todayStr) || 0;
});

// 处理数据并更新dateMap
function processData() {
  // 清空dateMap
  dateMap.value.clear();

  // 打印传入的热力图数据，用于调试
  console.log('Heatmap data received:', props.data);

  // 如果数据为空或不是数组，直接返回空映射
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    console.log('热力图数据为空，不创建任何默认数据');
    return;
  }

  // 处理每一条数据
  props.data.forEach(item => {
    if (!item) return;

    // 尝试获取日期
    const dateStr = item.date || item.day || '';
    if (!dateStr) return;

    // 标准化日期格式
    let normalizedDateStr = dateStr;

    // 如果日期包含时间部分，只保留日期部分
    if (normalizedDateStr.includes('T')) {
      normalizedDateStr = normalizedDateStr.split('T')[0];
    }

    // 尝试标准化日期格式（确保是YYYY-MM-DD）
    try {
      const date = new Date(normalizedDateStr);
      if (!isNaN(date.getTime())) {
        // 如果是有效日期，转换为标准格式
        normalizedDateStr = date.toISOString().split('T')[0];

        // 获取持续时间
        const duration = parseInt(String(item.duration || item.time || item.count || '0'));

        // 确保时长至少为1分钟
        const validDuration = Math.max(isNaN(duration) ? 0 : duration, 1);

        // 更新该日期的学习时长
        if (validDuration > 0) {
          const currentDuration = dateMap.value.get(normalizedDateStr) || 0;
          dateMap.value.set(normalizedDateStr, currentDuration + validDuration);
        }
      }
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
    }
  });

  // 打印处理后的日期映射，用于调试
  console.log('Processed date map size:', dateMap.value.size);
  if (dateMap.value.size > 0) {
    // 打印前5个日期的数据
    const entries = Array.from(dateMap.value.entries()).slice(0, 5);
    console.log('Processed date map sample:', entries);
  }
}

  // 打印今日学习时长，用于调试
  console.log('Today\'s study duration:', dateMap.value.get(todayStr));


// 在组件挂载时处理数据
onMounted(() => {
  processData();
});

// 监听数据变化，重新处理数据
watch(() => props.data, () => {
  processData();
}, { deep: true });

// 热力图数据计算
const heatmapData = computed(() => {
  // 使用用户注册日期作为开始日期，没有则默认为一年前
  let startDate: Date;
  if (props.registrationDate && props.registrationDate.trim()) {
    startDate = new Date(props.registrationDate);
    // 确保日期有效
    if (isNaN(startDate.getTime())) {
      // 默认为一年前
      startDate = new Date(today);
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
  } else {
    // 默认为一年前
    startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  console.log('热力图开始日期（注册日期）:', startDate.toISOString());

  // 设置结束日期为注册日期次年的3月31日
  const registrationYear = startDate.getFullYear();
  const endDate = new Date(registrationYear + 1, 2, 31); // 2表示3月（0-11）

  console.log('热力图结束日期（次年3月31日）:', endDate.toISOString());

  // 如果结束日期已经过去，使用今天作为结束日期
  if (endDate < today) {
    endDate.setTime(today.getTime());
    console.log('结束日期已过去，使用今天作为结束日期:', today.toISOString());
  }

  // 调整开始日期到所在周的周日
  const firstDayOfWeek = startDate.getDay(); // 0=周日, 1=周一, ...
  const adjustedStartDate = new Date(startDate);
  adjustedStartDate.setDate(adjustedStartDate.getDate() - firstDayOfWeek);

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
    const value = dateMap.value.get(dateStr) || 0;

    grid.push({
      date: dateStr,
      value: isInRange ? value : null, // 只有在范围内的日期才显示值
      count: isInRange ? value : null, // 保持count字段与value一致
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      isToday: isToday
    });
  }

  return grid;
});

// 预处理格子数据，减少模板中的计算
const processedGridData = computed(() => {
  return heatmapData.value.map(day => {
    // 提取日期值
    const value = day.value !== null ? day.value : (day.count !== null ? day.count : 0);

    // 计算颜色
    const color = getColor(value);

    // 格式化标题
    const title = day.date ? `${formatDate(day.date)}: ${value}分钟` : '';

    return {
      ...day,
      color,
      title
    };
  });
});

// 根据值获取对应的颜色
function getColor(value: number | null | undefined | any): string {
  // 如果传入的是对象，尝试提取value或count字段
  if (typeof value === 'object' && value !== null) {
    // 优先使用value字段，如果没有则使用count字段
    value = value.value !== undefined ? value.value : (value.count !== undefined ? value.count : null);
  }

  if (value === null || value === undefined) {
    return 'transparent'; // 范围外的日期显示为透明
  }

  // 确保是数字类型
  const numValue = Number(value);

  // 检查无效值或0值
  if (isNaN(numValue) || numValue <= 0) {
    return '#ebedf0'; // 默认灰色
  }

  // 根据值的大小返回不同深浅的蓝色
  if (numValue < 30) return '#9be9ff';
  if (numValue < 60) return '#4fc3f7';
  if (numValue < 120) return '#2196f3';
  if (numValue < 180) return '#1976d2';
  return '#0d47a1'; // 180以上使用最深的蓝色
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
          {{ todayMinutes }} 分钟
          <span v-if="todayMinutes === 0" class="data-note">
            (今日暂无学习记录)
          </span>
        </div>
      </div>
    </div>

    <div class="heatmap-scroll">
      <!-- 热力图网格 -->
      <div class="heatmap-grid">
        <div
          v-for="(day, index) in processedGridData"
          :key="index"
          class="heatmap-cell"
          :class="{ 'today-cell': day.isToday }"
          :style="{ backgroundColor: day.color }"
          :title="day.title"
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

.data-note {
  font-size: 12px;
  font-weight: normal;
  color: #9e9e9e;
  display: block;
  margin-top: 5px;
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
