<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import { apiService } from '../../services/apiService';
import { API_CONFIG } from '../../config';
import { userService } from '../../services/userService';
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
const tab = ref<'daily' | 'weekly' | 'monthly'>('daily');

// 数据类型定义
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

interface Stats {
  totalTasks: number;
  totalTime: number;
  dailyMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  totalHours: number;
  streakDays: number;
  taskDistribution: Record<string, number>;
}

interface UserData {
  username: string;
  stats: Stats;
  tasks: Task[];
}

// 用户数据
const userData = ref<UserData>({
  username: '',
  stats: {
    totalTasks: 0,
    totalTime: 0,
    dailyMinutes: 0,
    weeklyMinutes: 0,
    monthlyMinutes: 0,
    totalHours: 0,
    streakDays: 0,
    taskDistribution: {}
  },
  tasks: []
});

// 计算属性
const completionRate = computed(() => {
  if (userData.value.stats.totalTasks === 0) return 0;
  return Math.round((userData.value.tasks.filter(task => task.completed).length / userData.value.stats.totalTasks) * 100);
});

// 获取当前选择的时间段数据
const currentTimeData = computed(() => {
  switch(tab.value) {
    case 'daily':
      return userData.value.stats.dailyMinutes;
    case 'weekly':
      return userData.value.stats.weeklyMinutes;
    case 'monthly':
      return userData.value.stats.monthlyMinutes;
    default:
      return 0;
  }
});

// 格式化当前日期
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

// 图表数据
const chartData = ref({
  labels: ['暂无数据'],
  datasets: [{
    backgroundColor: ['#7f7f7f'],
    data: [1]
  }]
});

// 更新图表数据
const updateChartData = () => {
  const distribution = userData.value.stats.taskDistribution;
  
  if (!distribution || Object.keys(distribution).length === 0) {
    chartData.value = {
      labels: ['暂无数据'],
      datasets: [{
        backgroundColor: ['#7f7f7f'],
        data: [1]
      }]
    };
    return;
  }

  const labels = Object.keys(distribution);
  const data = Object.values(distribution);
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
watch(() => userData.value.stats.taskDistribution, () => {
  updateChartData();
}, { deep: true });

// 切换标签页
const switchTab = (newTab: 'daily' | 'weekly' | 'monthly') => {
  tab.value = newTab;
};

// 加载用户数据
const loadUserData = async () => {
  try {
    // 检查用户是否已登录
    if (!localStorage.getItem('token')) {
      error.value = '请先登录后再生成海报';
      return;
    }

    // 显示加载状态
    isGenerating.value = true;
    error.value = '';

    console.log('开始加载用户数据...');

    // 并行请求数据
    const [profileRes, tasksRes, statsRes] = await Promise.all([
      apiService.get('/api/auth/me'),
      apiService.get('/api/study/tasks'),
      apiService.get('/api/study/statistics')
    ]);

    console.log('用户信息:', profileRes.data);
    console.log('任务列表:', tasksRes.data);
    console.log('统计数据:', statsRes.data);

    // 额外获取统计详情
    const userStatsRes = await apiService.get('/api/study/statistics/user');
    console.log('用户统计:', userStatsRes.data);

    // 筛选今日任务
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    const todayTasks = tasksRes.data.filter((task: any) => {
      const taskDate = new Date(task.start);
      return taskDate >= new Date(todayStart) && taskDate <= new Date(todayEnd);
    });

    // 处理任务分布
    const taskTypes: Record<string, number> = {};
    todayTasks.forEach((task: any) => {
      const type = task.category || '未分类';
      taskTypes[type] = (taskTypes[type] || 0) + 1;
    });

    // 整合所有数据
    userData.value = {
      username: profileRes.data.username,
      stats: {
        totalTasks: todayTasks.length,
        totalTime: todayTasks.reduce((sum: number, task: any) => sum + (task.duration || 0), 0),
        dailyMinutes: statsRes.data.daily_duration || 0,
        weeklyMinutes: statsRes.data.weekly_duration || statsRes.data.total_duration || 0,
        monthlyMinutes: statsRes.data.monthly_duration || statsRes.data.total_duration || 0,
        totalHours: userStatsRes.data.total_hours || 0,
        streakDays: userStatsRes.data.streak_days || 0,
        taskDistribution: taskTypes
      },
      tasks: todayTasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        duration: task.duration || 0,
        start: task.start,
        end: task.end,
        completed: task.completed,
        type: task.category || '未分类'
      }))
    };

    // 更新图表数据
    updateChartData();

    console.log('用户数据加载完成:', userData.value);
    isGenerating.value = false;
  } catch (err: any) {
    console.error('加载用户数据失败:', err);
    if (err.response?.status === 401) {
      error.value = '请先登录后再生成海报';
    } else {
      error.value = '加载数据失败，请稍后再试';
    }
    isGenerating.value = false;
  }
};

// 生成海报
const generatePoster = async () => {
  if (!posterRef.value) return;
  
  try {
    isGenerating.value = true;
    error.value = '';
    
    // 生成海报图片
    const canvas = await html2canvas(posterRef.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // 转换为图片URL
    const imageUrl = canvas.toDataURL('image/png');
    generatedImageUrl.value = imageUrl;
    
    // 触发生成完成事件
    emit('generated', imageUrl);
    
    isGenerating.value = false;
    console.log('海报生成成功');
  } catch (err: any) {
    console.error('生成海报失败:', err);
    error.value = '生成海报失败，请稍后再试';
    isGenerating.value = false;
  }
};

// 下载海报
const downloadPoster = () => {
  if (!generatedImageUrl.value) return;
  
  const link = document.createElement('a');
  link.download = `学习汇报_${formattedDate.value}.png`;
  link.href = generatedImageUrl.value;
  link.click();
};

// 关闭弹窗
const closeModal = () => {
  emit('close');
  // 重置状态
  generatedImageUrl.value = '';
  error.value = '';
};

// 组件挂载时加载数据
onMounted(() => {
  if (props.showModal) {
    loadUserData();
  }
});

// 监听showModal属性变化
watch(() => props.showModal, (newVal) => {
  if (newVal) {
    loadUserData();
  }
});
</script>

<template>
  <div v-if="showModal" class="poster-modal">
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h2>生成学习海报 <span class="emoji">🎨</span></h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
      </div>
      
      <div v-if="isGenerating" class="loading-container">
        <div class="spinner"></div>
        <p>{{ generatedImageUrl ? '正在生成海报...' : '正在加载数据...' }}</p>
      </div>
      
      <div v-else-if="generatedImageUrl" class="generated-poster">
        <div class="preview-container">
          <img :src="generatedImageUrl" alt="生成的海报" class="poster-preview">
        </div>
        <div class="action-buttons">
          <button class="download-button" @click="downloadPoster">
            <span class="button-icon">💾</span> 下载海报
          </button>
          <button class="close-button outline" @click="closeModal">
            <span class="button-icon">✖️</span> 关闭
          </button>
        </div>
      </div>
      
      <div v-else class="poster-editor">
        <div class="tab-container">
          <button 
            v-for="(label, key) in { daily: '今日', weekly: '本周', monthly: '本月' }" 
            :key="key"
            class="tab-button" 
            :class="{ active: tab === key }"
            @click="switchTab(key as 'daily' | 'weekly' | 'monthly')"
          >
            {{ label }}
          </button>
        </div>
        
        <div ref="posterRef" class="poster-template">
          <div class="poster-header">
            <h2>学习数据报告</h2>
            <p class="date">{{ formattedDate }}</p>
          </div>
          
          <div class="user-section">
            <div class="avatar">{{ userData.username ? userData.username[0].toUpperCase() : 'U' }}</div>
            <div class="user-info">
              <h3>{{ userData.username || '学习者' }}</h3>
              <p>连续学习 {{ userData.stats.streakDays }} 天</p>
            </div>
          </div>
          
          <div class="stats-section">
            <div class="stat-card">
              <div class="stat-icon">⏱️</div>
              <div class="stat-content">
                <h4>{{ tab === 'daily' ? '今日' : tab === 'weekly' ? '本周' : '本月' }}学习时长</h4>
                <p class="stat-value">{{ currentTimeData }} 分钟</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-content">
                <h4>{{ tab === 'daily' ? '今日' : tab === 'weekly' ? '本周' : '本月' }}完成任务</h4>
                <p class="stat-value">{{ userData.stats.totalTasks }} 个</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🔄</div>
              <div class="stat-content">
                <h4>累计学习时长</h4>
                <p class="stat-value">{{ userData.stats.totalHours.toFixed(1) }} 小时</p>
              </div>
            </div>
          </div>
          
          <div class="chart-section">
            <h3>学习内容分布</h3>
            <div class="chart-container" style="height: 200px; position: relative;">
              <Doughnut 
                :data="chartData" 
                :options="{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 15,
                        padding: 10,
                        font: { size: 12 }
                      }
                    }
                  }
                }"
              />
            </div>
          </div>
          
          <div class="tasks-section" v-if="tab === 'daily' && userData.tasks.length > 0">
            <h3>今日任务概览</h3>
            <ul class="tasks-list">
              <li v-for="task in userData.tasks.slice(0, 3)" :key="task.id" class="task-item">
                <span class="task-name">{{ task.name }}</span>
                <span class="task-duration">{{ task.duration }} 分钟</span>
              </li>
              <li v-if="userData.tasks.length > 3" class="task-more">
                还有 {{ userData.tasks.length - 3 }} 个任务...
              </li>
            </ul>
          </div>
          
          <div class="poster-footer">
            <p class="motivation">继续坚持，每天进步！</p>
            <p class="app-name">学习助手 · Study Companion</p>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="generate-button" @click="generatePoster" :disabled="isGenerating">
            <span class="button-icon">🖼️</span> 生成海报
          </button>
          <button class="cancel-button" @click="closeModal">
            <span class="button-icon">✖️</span> 取消
          </button>
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
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1001;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  color: #1976d2;
}

.emoji {
  margin-left: 8px;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #757575;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-button:hover {
  color: #e53935;
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  color: #e53935;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.error-icon {
  font-size: 1.2rem;
  margin-right: 10px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(25, 118, 210, 0.1);
  border-radius: 50%;
  border-top-color: #1976d2;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.poster-editor {
  display: flex;
  flex-direction: column;
}

.tab-container {
  display: flex;
  margin-bottom: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 5px;
}

.tab-button {
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #616161;
}

.tab-button.active {
  background: #1976d2;
  color: white;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.poster-template {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  color: #333;
}

.poster-header {
  text-align: center;
  margin-bottom: 20px;
}

.poster-header h2 {
  margin: 0 0 5px;
  color: #1976d2;
  font-size: 24px;
}

.date {
  margin: 0;
  color: #757575;
  font-size: 14px;
}

.user-section {
  display: flex;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #42a5f5, #1976d2);
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 15px;
}

.user-info h3 {
  margin: 0 0 5px;
  color: #333;
  font-size: 18px;
}

.user-info p {
  margin: 0;
  color: #757575;
  font-size: 14px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-right: 12px;
}

.stat-content h4 {
  margin: 0 0 5px;
  font-size: 14px;
  color: #757575;
}

.stat-value {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}

.chart-section {
  margin-bottom: 25px;
}

.chart-section h3,
.tasks-section h3 {
  margin: 0 0 15px;
  font-size: 16px;
  color: #333;
}

.tasks-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 8px;
}

.task-name {
  font-weight: 500;
  color: #333;
}

.task-duration {
  color: #1976d2;
  font-weight: 600;
}

.task-more {
  text-align: center;
  color: #757575;
  font-style: italic;
  font-size: 13px;
  margin-top: 5px;
}

.poster-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.motivation {
  margin: 0 0 5px;
  font-size: 16px;
  font-weight: 500;
  color: #1976d2;
}

.app-name {
  margin: 0;
  font-size: 12px;
  color: #9e9e9e;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.generate-button,
.download-button {
  background: linear-gradient(135deg, #42a5f5, #1976d2);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.generate-button:hover,
.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
}

.cancel-button {
  background: #f5f5f5;
  color: #757575;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background: #e0e0e0;
}

.button-icon {
  margin-right: 8px;
}

.generated-poster {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-container {
  max-width: 100%;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.poster-preview {
  width: 100%;
  height: auto;
  display: block;
}

.close-button.outline {
  background: transparent;
  border: 1px solid #e0e0e0;
  color: #757575;
}

.close-button.outline:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 20px;
    width: 90%;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .generate-button,
  .download-button,
  .cancel-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
