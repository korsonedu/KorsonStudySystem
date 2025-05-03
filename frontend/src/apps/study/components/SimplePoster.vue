<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import apiService from '../services/apiService';
import { API_CONFIG, POSTER_CONFIG } from '../config';
import { authService } from '../../../shared/services/authService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// 组件属性
const props = defineProps<{
  showModal: boolean;
}>();

// 事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'generated', imageUrl: string): void;
}>();

// 状态
const posterRef = ref<HTMLElement | null>(null);
const isGenerating = ref(false);
const generatedImageUrl = ref('');
const error = ref('');

interface Task {
  id: number;
  name: string;
  duration: number;
  start: string;
  end: string;
  completed: boolean;
  type: string;
}

interface TaskType {
  type: string;
  count: number;
  total: number;
}

interface UserData {
  username: string;
  totalTasks: number;
  totalTime: number;
  tasksList: Task[];
  taskDistribution: TaskType[];
  streakDays: number;
}

// 用户数据
const userData = ref<UserData>({
  username: '',
  totalTasks: 0,
  totalTime: 0,
  tasksList: [],
  taskDistribution: [],
  streakDays: 0
});

// 计算属性
const completionRate = computed(() => {
  if (userData.value.totalTasks === 0) return 0;
  return Math.round((userData.value.tasksList.filter(task => task.completed).length / userData.value.totalTasks) * 100);
});

// 格式化日期
const formattedDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});

// 获取今日开始时间
const getTodayStart = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

// 获取今日结束时间
const getTodayEnd = () => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
};

// 计算图表数据
const chartData = ref({
  labels: ['暂无数据'],
  datasets: [{
    backgroundColor: ['#7f7f7f'],
    data: [1]
  }]
});

// 更新图表数据
const updateChartData = () => {
  if (!userData.value.taskDistribution || userData.value.taskDistribution.length === 0) {
    chartData.value = {
      labels: ['暂无数据'],
      datasets: [{
        backgroundColor: ['#7f7f7f'],
        data: [1]
      }]
    };
    return;
  }

  const labels = userData.value.taskDistribution.map(item => item.type || '未知类型');
  const data = userData.value.taskDistribution.map(item => item.count || 0);
  const backgroundColor = labels.map((_, index) => {
    const hue = (index * 137) % 360;
    return `hsla(${hue}, 70%, 60%, 0.8)`;
  });

  chartData.value = {
    labels,
    datasets: [{
      backgroundColor,
      data
    }]
  };
};

// 监听用户数据变化
watch(() => userData.value.taskDistribution, () => {
  updateChartData();
}, { deep: true });

// 加载用户数据
const loadUserData = async () => {
  try {
    // 检查用户是否已登录
    if (!authService.isLoggedIn.value) {
      error.value = '请先登录后再生成海报';
      return;
    }

    // 显示加载状态
    isGenerating.value = true;
    error.value = '';

    console.log('开始加载用户数据...');

    // 获取用户信息
    const profile = await authService.getProfile();
    console.log('用户信息:', profile);

    // 获取任务列表
    const tasks = await authService.getTasks();
    console.log('任务列表:', tasks);

    // 获取统计数据
    const stats = await authService.getDailyStats();
    console.log('统计数据:', stats);

    // 筛选今日任务
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    const todayTasks = tasks.filter((task: any) => {
      const taskDate = new Date(task.start);
      return taskDate >= new Date(todayStart) && taskDate <= new Date(todayEnd);
    });

    // 计算今日总学习时间（分钟）
    const totalTime = todayTasks.reduce((sum: number, task: any) => sum + (task.duration || 0), 0);

    userData.value = {
      username: profile.username,
      totalTasks: todayTasks.length,
      totalTime: totalTime,
      tasksList: todayTasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        duration: task.duration || 0,
        start: task.start,
        end: task.end,
        completed: task.completed,
        type: task.type || 'default'
      })),
      taskDistribution: Object.entries(stats.taskDistribution || {}).map(([type, count]) => ({
        type,
        count: Number(count),
        total: stats.totalTasks
      })),
      streakDays: stats.streakDays || 0
    };

    // 更新图表数据
    updateChartData();

    console.log('用户数据加载完成:', userData.value);
  } catch (err: any) {
    console.error('加载用户数据失败:', err);
    if (err.response?.status === 401) {
      error.value = '请先登录后再生成海报';
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else {
      error.value = '加载数据失败，请稍后再试';
    }
  } finally {
    isGenerating.value = false;
  }
};

// 辅助函数：获取任务类型对应的颜色
const getTaskTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    study: '#4e79a7',  // 更柔和的蓝色
    review: '#59a14f', // 更柔和的绿色
    practice: '#b07aa1', // 更柔和的紫色
    default: '#7f7f7f'  // 更柔和的灰色
  };
  return colorMap[type] || colorMap.default;
};

// 图表配置
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: 12,
          weight: '500'
        },
        color: '#ffffff'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#2c3e50',
      bodyColor: '#2c3e50',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      cornerRadius: 4,
      padding: 10,
      callbacks: {
        label: function(context: { raw: number; label: string; chart: { data: { datasets: { data: number[] }[] } } }) {
          const value = context.raw || 0;
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${context.label}: ${value} 个 (${percentage}%)`;
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
};

// 生成海报
const generatePoster = async () => {
  if (!posterRef.value) return;

  isGenerating.value = true;
  error.value = '';

  try {
    const canvas = await html2canvas(posterRef.value, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#2c3e50',
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.poster') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.background = 'linear-gradient(135deg, #2c3e50, #3498db)';
          const statItems = clonedElement.querySelectorAll('.stat-value');
          statItems.forEach((item: Element) => {
            (item as HTMLElement).style.color = '#ffffff';
            (item as HTMLElement).style.background = 'none';
            (item as HTMLElement).style.webkitBackgroundClip = 'unset';
            (item as HTMLElement).style.webkitTextFillColor = '#ffffff';
          });
        }
      }
    });

    generatedImageUrl.value = canvas.toDataURL('image/png');
    emit('generated', generatedImageUrl.value);
    console.log('海报生成成功');
  } catch (err) {
    console.error('生成海报失败:', err);
    error.value = '生成海报失败，请稍后再试';
  } finally {
    isGenerating.value = false;
  }
};

// 下载海报
const downloadPoster = () => {
  if (!generatedImageUrl.value) return;

  const link = document.createElement('a');
  link.href = generatedImageUrl.value;
  link.download = `学习海报-${formattedDate.value}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 关闭模态框
const closeModal = () => {
  emit('close');
  generatedImageUrl.value = '';
  error.value = '';
};

// 监听showModal变化
watch(() => props.showModal, (newVal) => {
  if (newVal) {
    loadUserData();
  }
});

// 组件挂载时加载数据
onMounted(() => {
  if (props.showModal) {
    loadUserData();
  }
});

// 名人名言列表
const quotes = [
  { text: "经济学是一门研究人类如何选择使用稀缺资源的科学。", author: "保罗·萨缪尔森" },
  { text: "市场是一只无形的手，引导着资源的有效配置。", author: "亚当·斯密" },
  { text: "通货膨胀是货币贬值的过程，而不是物价上涨的过程。", author: "米尔顿·弗里德曼" },
  { text: "经济周期是市场经济不可避免的规律。", author: "约瑟夫·熊彼特" },
  { text: "经济增长的最终目的是提高人民的生活水平。", author: "阿马蒂亚·森" },
  { text: "自由贸易是促进经济增长和繁荣的重要途径。", author: "大卫·李嘉图" },
  { text: "经济危机往往孕育着新的机遇。", author: "约翰·梅纳德·凯恩斯" },
  { text: "创新是经济发展的核心动力。", author: "罗伯特·索洛" },
  { text: "经济政策的目标是实现充分就业和物价稳定。", author: "威廉·菲利普斯" },
  { text: "市场经济需要政府适度干预，以维护公平竞争。", author: "约翰·肯尼思·加尔布雷斯" },
  { text: "金融市场的波动性既是风险，也是机遇。", author: "乔治·索罗斯" },
  { text: "经济全球化是不可逆转的历史趋势。", author: "托马斯·弗里德曼" },
  { text: "可持续发展是经济增长的必由之路。", author: "罗伯特·肯尼迪" },
  { text: "数字经济正在重塑传统商业模式。", author: "埃里克·施密特" },
  { text: "经济决策需要平衡短期利益和长期发展。", author: "约瑟夫·斯蒂格利茨" },
  { text: "金融创新应该服务于实体经济。", author: "迈克尔·布隆伯格" },
  { text: "经济教育是提升国民素质的关键。", author: "加里·贝克尔" },
  { text: "经济改革需要勇气和智慧。", author: "林毅夫" },
  { text: "经济全球化需要更加包容的治理。", author: "克里斯蒂娜·拉加德" },
];

// 海报配置
const posterSize = POSTER_CONFIG.SIZE;
const posterImages = POSTER_CONFIG.IMAGES;
const posterText = POSTER_CONFIG.TEXT;

// 随机获取一条名言
const randomQuote = computed(() => {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
});
</script>

<template>
  <div class="poster-modal" @click.self="closeModal">
    <div class="poster-container">
      <div class="poster-header">
        <h2>学习海报</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="poster-content">
        <!-- 海报预览 -->
        <div v-if="!generatedImageUrl" class="poster-preview">
          <div ref="posterRef" class="poster">
            <!-- 顶部信息 -->
            <div class="poster-top">
              <div class="poster-logo">
                <img :src="posterImages.LOGO.URL" :width="posterImages.LOGO.WIDTH / 5" :height="posterImages.LOGO.HEIGHT / 5" :alt="posterText.INSTITUTION_NAME" />
                <span>{{ posterText.INSTITUTION_NAME }}</span>
              </div>
              <div class="poster-date">{{ formattedDate }}</div>
            </div>

            <!-- 用户信息 -->
            <div class="poster-user">
              <h1>{{ userData.username }}&nbsp;&nbsp;{{ posterText.TITLE }}</h1>
            </div>

            <!-- 统计数据 -->
            <div class="poster-stats">
              <div class="stat-item">
                <div class="stat-value">{{ userData.totalTasks }}</div>
                <div class="stat-label">今日计划</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userData.totalTime }}</div>
                <div class="stat-label">学习分钟</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userData.streakDays }}</div>
                <div class="stat-label">连续学习</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ completionRate }}%</div>
                <div class="stat-label">完成率</div>
              </div>
            </div>

            <!-- 任务列表 -->
            <div class="poster-tasks">
              <h2>今日任务</h2>
              <div class="tasks-list">
                <div v-for="(task, index) in userData.tasksList.slice(0, 5)" :key="index" class="task-item">
                  <div class="task-status" :class="{ completed: task.completed }">
                    {{ task.completed ? '✓' : '○' }}
                  </div>
                  <div class="task-name">{{ task.name }}</div>
                  <div class="task-duration">{{ task.duration }}分钟</div>
                </div>
                <div v-if="userData.tasksList.length > 5" class="more-tasks">
                  还有 {{ userData.tasksList.length - 5 }} 个任务...
                </div>
              </div>
            </div>

            <!-- 添加名人名言部分 -->
            <div class="quote-section">
              <p class="quote-text">"{{ randomQuote.text }}"</p>
              <p class="quote-author">—— {{ randomQuote.author }}</p>
            </div>

            <!-- 底部信息 -->
            <div class="poster-footer">
              <div class="footer-content">
                <div class="company-info">
                  <h3 class="company-name">{{ posterText.INSTITUTION_NAME }}</h3>
                </div>
                <div class="slogan">
                  <p>{{ posterText.SUBTITLE }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的海报图片 -->
        <div v-else class="generated-poster">
          <img :src="generatedImageUrl" alt="Generated Poster" />
        </div>

        <!-- 操作按钮 -->
        <div class="poster-actions">
          <button v-if="!generatedImageUrl" class="generate-btn" @click="generatePoster" :disabled="isGenerating">
            {{ isGenerating ? '生成中...' : '生成海报' }}
          </button>

          <div v-else class="download-options">
            <button class="download-btn" @click="downloadPoster">
              <span>💾</span> 保存到设备
            </button>
            <button class="regenerate-btn" @click="generatedImageUrl = ''">
              <span>🔄</span> 重新生成
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.poster-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  transition: opacity 0.3s ease;
}

.poster-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
}

.poster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.poster-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 22px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #7f8c8d;
}

.poster-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.poster-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

/* 海报样式 */
.poster {
  width: 100%;
  max-width: 400px;
  min-height: 700px;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  border-radius: 16px;
  padding: 20px;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.poster::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  opacity: 0.1;
  z-index: 0;
}

.poster > * {
  position: relative;
  z-index: 1;
}

/* 顶部信息 */
.poster-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.poster-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.poster-logo img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.poster-logo span {
  font-size: 18px;
  font-weight: bold;
}

.poster-date {
  font-size: 14px;
  opacity: 0.9;
}

/* 用户信息 */
.poster-user {
  text-align: center;
  margin-bottom: 24px;
}

.poster-user h1 {
  font-size: 24px;
  margin: 0 0 20px 0;
  text-align: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 统计数据 */
.poster-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.15);
  padding: 15px;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
  pointer-events: none;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 任务列表 */
.poster-tasks {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.poster-tasks h2 {
  font-size: 18px;
  margin: 0 0 15px 0;
  text-align: center;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: transform 0.3s;
}

.task-item:hover {
  transform: translateX(5px);
}

.task-status {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.task-status.completed {
  background: #59a14f;
  border-color: #59a14f;
  box-shadow: 0 0 10px rgba(89, 161, 79, 0.3);
}

.task-name {
  flex: 1;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-duration {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

.more-tasks {
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
  margin-top: 10px;
}

/* 修改名人名言样式 */
.quote-section {
  padding: 30px 20px;
  text-align: center;
  position: relative;
}

.quote-section::before,
.quote-section::after {
  content: '"';
  font-size: 60px;
  color: rgba(255, 255, 255, 0.2);
  position: absolute;
  font-family: Georgia, serif;
}

.quote-section::before {
  left: 20px;
  top: 10px;
}

.quote-section::after {
  right: 20px;
  bottom: -20px;
}

.quote-text {
  font-size: 18px;
  line-height: 1.8;
  color: #ffffff;
  margin-bottom: 15px;
  font-style: italic;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quote-author {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
  margin: 0;
  font-weight: 500;
}

/* 美化底部样式 */
.poster-footer {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
  margin: 0 -20px -20px;
  padding: 30px 20px;
  border-radius: 0 0 16px 16px;
  backdrop-filter: blur(10px);
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.company-info {
  text-align: center;
}

.company-name {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #ffffff;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.company-name-en {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 5px 0 0 0;
  letter-spacing: 1px;
  font-weight: 500;
}

.slogan {
  display: flex;
  align-items: center;
  gap: 15px;
}

.slogan-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.slogan-cn {
  font-size: 16px;
  color: #ffffff;
  font-weight: 500;
}

.slogan-en {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
}

.slogan-divider {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  margin-top: -10px;
}

/* 生成的海报 */
.generated-poster {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.generated-poster img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 按钮样式 */
.poster-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 16px;
}

.generate-btn, .download-btn, .regenerate-btn {
  padding: 12px 24px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.generate-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  min-width: 180px;
}

.download-options {
  display: flex;
  gap: 16px;
}

.download-btn {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.regenerate-btn {
  background: #ecf0f1;
  color: #34495e;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  width: 100%;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
