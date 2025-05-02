<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import html2canvas from 'html2canvas';
import { POSTER_SIZE, POSTER_IMAGES, POSTER_TEXT, POSTER_COLORS, POSTER_FONTS } from '../../../config/poster';
import apiService from '../../../shared/services/apiService';
import { API_CONFIG } from '../../../config/api';

// 海报配置
const POSTER_CONFIG = {
  width: 750,
  height: 1334,
  padding: 40,
  borderRadius: 20,
  backgroundColor: '#ffffff'
};

// 组件属性
const props = defineProps<{
  title?: string;
  subtitle?: string;
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
const error = ref<string | null>(null);

// 用户数据
const userData = ref({
  username: '',
  nickname: '',
  totalTasks: 0,
  completedTasks: 0,
  totalDuration: 0,
  registrationDate: '',
  streak: 0,
  dailyTasks: 0,
  dailyCompletedTasks: 0,
  dailyMinutes: 0,
  timeDistribution: [] as { hour: number, duration: number }[],
  dailyTasksList: [] as { name: string, completed: boolean, type: string, duration: number }[],
  taskTypeDistribution: [] as { name: string, percentage: number, color: string }[]
});

// 计算属性
const posterTitle = computed(() => props.title || POSTER_TEXT.TITLE);
const posterSubtitle = computed(() => props.subtitle || POSTER_TEXT.SUBTITLE);
const completionRate = computed(() => {
  if (userData.value.dailyTasks === 0) return 0;
  return Math.round((userData.value.dailyCompletedTasks / userData.value.dailyTasks) * 100);
});
const totalHours = computed(() => Math.round(userData.value.totalDuration / 60));
const daysRegistered = computed(() => {
  if (!userData.value.registrationDate) return 0;
  const regDate = new Date(userData.value.registrationDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - regDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// 格式化日期
const formattedDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});


// 加载用户数据
const loadUserData = async () => {
  try {
    console.log('开始加载海报数据...', new Date().toLocaleTimeString());
    // 清空之前的数据，确保不会显示旧数据
    userData.value = {
      username: '',
      nickname: '',
      totalTasks: 0,
      completedTasks: 0,
      totalDuration: 0,
      registrationDate: '',
      streak: 0,
      dailyTasks: 0,
      dailyCompletedTasks: 0,
      dailyMinutes: 0,
      timeDistribution: [],
      dailyTasksList: [],
      taskTypeDistribution: []
    };

    // 获取当前用户信息
    try {
      console.log('获取当前用户信息...');
      const currentUserResponse = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
      if (currentUserResponse?.data) {
        userData.value.username = currentUserResponse.data.username || '';
        userData.value.nickname = currentUserResponse.data.nickname || currentUserResponse.data.username || '学习达人';
        userData.value.registrationDate = currentUserResponse.data.created_at || new Date().toISOString();
        console.log('成功获取当前用户信息:', currentUserResponse.data);
      }
    } catch (err) {
      console.error('获取当前用户信息失败:', err);
    }

    // 获取用户统计数据
    try {
      console.log('获取用户统计数据...');
      const [totalStats, dailyStats] = await Promise.all([
        apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
        apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY)
      ]);

      if (totalStats?.data) {
        userData.value.totalTasks = totalStats.data.totalTasks || 0;
        userData.value.completedTasks = totalStats.data.completedTasks || 0;
        userData.value.totalDuration = totalStats.data.totalMinutes || 0;
        userData.value.streak = totalStats.data.streak || 0;
        console.log('成功获取总统计数据:', totalStats.data);
      }

      if (dailyStats?.data) {
        userData.value.dailyTasks = dailyStats.data.totalTasks || 0;
        userData.value.dailyCompletedTasks = dailyStats.data.completedTasks || 0;
        userData.value.dailyMinutes = dailyStats.data.totalMinutes || 0;
        userData.value.timeDistribution = dailyStats.data.timeDistribution || [];
        console.log('成功获取每日统计数据:', dailyStats.data);
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }

    // 获取今日任务列表
    try {
      console.log('获取今日任务列表...');
      const tasksResponse = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE, {
        params: {
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (tasksResponse?.data) {
        userData.value.dailyTasksList = tasksResponse.data.map((task: any) => ({
          name: task.name,
          completed: task.completed,
          type: task.type || 'default',
          duration: task.duration || 0
        }));

        // 计算任务类型分布
        const typeCount: Record<string, number> = {};
        userData.value.dailyTasksList.forEach((task: any) => {
          typeCount[task.type] = (typeCount[task.type] || 0) + 1;
        });

        const total = userData.value.dailyTasksList.length;
        userData.value.taskTypeDistribution = Object.entries(typeCount).map(([type, count]) => ({
          name: type,
          percentage: Math.round((count / total) * 100),
          color: getTaskTypeColor(type)
        }));

        console.log('成功获取任务列表:', userData.value.dailyTasksList);
      }
    } catch (err) {
      console.error('获取任务列表失败:', err);
    }

    // 如果没有数据，使用默认数据
    if (userData.value.dailyTasksList.length === 0) {
      userData.value.dailyTasksList = [
        { name: '学习任务', completed: true, type: 'study', duration: 30 },
        { name: '复习任务', completed: false, type: 'review', duration: 20 },
        { name: '练习任务', completed: false, type: 'practice', duration: 15 }
      ];

      userData.value.taskTypeDistribution = [
        { name: 'study', percentage: 60, color: '#3498db' },
        { name: 'review', percentage: 30, color: '#2ecc71' },
        { name: 'practice', percentage: 10, color: '#9b59b6' }
      ];

      console.log('使用默认任务数据');
    }

  } catch (err) {
    console.error('加载用户数据失败:', err);
    error.value = '加载数据失败，请稍后再试';
  }
};

// 辅助函数：获取任务类型对应的颜色
const getTaskTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    study: '#3498db',
    review: '#2ecc71',
    practice: '#9b59b6',
    default: '#95a5a6'
  };
  return colorMap[type] || colorMap.default;
};

// 生成并显示海报
const generatePoster = async () => {
  try {
    console.log('开始生成海报...', new Date().toLocaleTimeString());
    isGenerating.value = true;
    error.value = null;

    // 确保数据已加载
    if (!userData.value.nickname) {
      await loadUserData();
    }

    // 等待DOM更新
    await nextTick();

    // 获取海报容器元素
    const posterElement = document.getElementById('poster-container');
    if (!posterElement) {
      throw new Error('找不到海报容器元素');
    }

    // 配置html2canvas选项
    const options = {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许加载跨域图片
      backgroundColor: '#ffffff',
      logging: true,
      width: POSTER_CONFIG.width,
      height: POSTER_CONFIG.height,
      windowWidth: POSTER_CONFIG.width,
      windowHeight: POSTER_CONFIG.height,
      onclone: (clonedDoc: Document) => {
        // 在克隆的文档中应用样式
        const clonedElement = clonedDoc.getElementById('poster-container');
        if (clonedElement) {
          clonedElement.style.width = `${POSTER_CONFIG.width}px`;
          clonedElement.style.height = `${POSTER_CONFIG.height}px`;
          clonedElement.style.transform = 'none';
          clonedElement.style.position = 'absolute';
          clonedElement.style.left = '0';
          clonedElement.style.top = '0';
        }
      }
    };

    console.log('开始渲染海报...');
    const canvas = await html2canvas(posterElement, options);
    console.log('海报渲染完成');

    // 转换为图片
    const image = canvas.toDataURL('image/png', 1.0);
    console.log('海报转换为图片完成');

    // 创建下载链接
    const link = document.createElement('a');
    link.download = `学习记录_${userData.value.nickname}_${new Date().toLocaleDateString()}.png`;
    link.href = image;
    link.click();

    console.log('海报生成完成');
    return image;
  } catch (err) {
    console.error('生成海报失败:', err);
    error.value = '生成海报失败，请稍后再试';
    throw err;
  } finally {
    isGenerating.value = false;
  }
};

// 分享海报
const sharePoster = async () => {
  if (!generatedImageUrl.value) return;

  try {
    // 检查Web Share API是否可用
    if (navigator.share) {
      // 将Base64图片转换为Blob
      const response = await fetch(generatedImageUrl.value);
      const blob = await response.blob();
      const file = new File([blob], 'study-poster.png', { type: 'image/png' });

      await navigator.share({
        title: '我的学习海报',
        text: '查看我的学习进度！',
        files: [file]
      });

      console.log('海报分享成功');
    } else {
      // 如果Web Share API不可用，提供复制链接的选项
      // 这里简化处理，实际应用中可能需要先上传图片到服务器获取链接
      alert('您的浏览器不支持直接分享功能，请使用保存图片后手动分享');
      downloadPoster();
    }
  } catch (err) {
    console.error('分享海报失败:', err);
    alert('分享失败，请尝试保存图片后手动分享');
  }
};

// 下载海报
const downloadPoster = () => {
  if (!generatedImageUrl.value) return;

  const link = document.createElement('a');
  link.href = generatedImageUrl.value;
  link.download = `${posterTitle.value}-${new Date().toISOString().split('T')[0]}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 关闭模态框
const closeModal = () => {
  emit('close');
  // 重置状态
  generatedImageUrl.value = '';
  error.value = '';
};

// 组件挂载时加载数据
onMounted(() => {
  loadUserData();

  // 监听自动生成事件
  window.addEventListener('auto-generate-poster', autoGeneratePoster);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('auto-generate-poster', autoGeneratePoster);
});

// 自动生成海报函数
const autoGeneratePoster = async () => {
  // 先确保数据已加载
  if (userData.value.dailyTasks === 0 && userData.value.totalTasks === 0) {
    console.log('数据尚未加载完成，正在加载...');
    await loadUserData();

    // 再等待一段时间确保数据处理完成
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 无论数据是否完整，都尝试生成海报
  console.log('开始生成海报，数据状态:', {
    dailyTasks: userData.value.dailyTasks,
    totalTasks: userData.value.totalTasks,
    taskTypeDistribution: userData.value.taskTypeDistribution?.length || 0,
    dailyTasksList: userData.value.dailyTasksList?.length || 0
  });

  generatePoster();
};

// 监听showModal变化，当打开时重新加载数据
watch(() => props.showModal, (newVal) => {
  if (newVal) {
    loadUserData();
  }
});
</script>

<template>
  <!-- 使用v-show而不是v-if，避免重新渲染导致的闪烁 -->
  <div class="poster-modal" @click.self="closeModal">
    <div class="poster-container" @click.stop>
      <div class="poster-header">
        <h2>生成分享海报</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="poster-content">
        <!-- 海报预览区域 -->
        <div v-if="!generatedImageUrl" class="poster-preview">
          <div ref="posterRef" class="poster">
            <!-- 顶部Logo和标题 -->
            <div class="poster-header-section">
              <div class="poster-logo">
                <img :src="POSTER_IMAGES.LOGO.URL" alt="Logo" />
                <h1>{{ POSTER_TEXT.INSTITUTION_NAME }}</h1>
              </div>
              <div class="poster-date">
                <div class="date-value">{{ formattedDate }}</div>
                <div class="date-label">今日学习报告</div>
              </div>
            </div>

            <!-- 标题和用户昵称 -->
            <div class="poster-title">
              <div class="user-nickname">{{ userData.nickname || userData.username || '学习达人' }}的</div>
              <h2>{{ posterTitle }}</h2>
              <p>{{ posterSubtitle }}</p>
            </div>

            <!-- 主要数据展示区 -->
            <div class="poster-main-content">
              <!-- 左侧数据统计 -->
              <div class="poster-stats">
                <div class="data-item">
                  <div class="data-icon">📋</div>
                  <div class="data-info">
                    <div class="data-value">{{ userData.dailyTasks || 0 }}</div>
                    <div class="data-label">今日计划</div>
                  </div>
                </div>
                <div class="data-item">
                  <div class="data-icon">✅</div>
                  <div class="data-info">
                    <div class="data-value">{{ userData.dailyCompletedTasks || 0 }}</div>
                    <div class="data-label">已完成</div>
                  </div>
                </div>
                <div class="data-item">
                  <div class="data-icon">⏱️</div>
                  <div class="data-info">
                    <div class="data-value">{{ userData.dailyMinutes || 0 }}分钟</div>
                    <div class="data-label">学习时间</div>
                  </div>
                </div>
                <div class="data-item">
                  <div class="data-icon">🔥</div>
                  <div class="data-info">
                    <div class="data-value">{{ userData.streak || 0 }}天</div>
                    <div class="data-label">连续学习</div>
                  </div>
                </div>
              </div>

              <!-- 右侧环形图 -->
              <div class="poster-donut-chart">
                <div class="donut-container">
                  <svg width="150" height="150" viewBox="0 0 42 42">
                    <!-- 渐变定义 -->
                    <defs>
                      <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#74b9ff" />
                        <stop offset="100%" stop-color="#0984e3" />
                      </linearGradient>
                    </defs>

                    <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke-width="3"></circle>
                    <circle
                      class="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke-width="3"
                      :stroke-dasharray="`${completionRate} ${100-completionRate}`"
                      stroke-dashoffset="25"
                    ></circle>
                    <g class="donut-text">
                      <text x="50%" y="50%" class="donut-number">
                        {{ completionRate }}%
                      </text>
                      <text x="50%" y="50%" class="donut-label">
                        计划完成率
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 今日任务概览 -->
            <div class="task-summary">
              <h3 class="summary-title">今日任务概览</h3>

              <div class="task-overview-container">
                <!-- 左侧任务列表 -->
                <div class="task-list">
                  <div v-if="userData.dailyTasksList && userData.dailyTasksList.length > 0">
                    <div v-for="(task, index) in userData.dailyTasksList.slice(0, 4)" :key="index" class="task-item">
                      <div class="task-status" :class="{ 'completed': task.completed }">
                        {{ task.completed ? '✓' : '○' }}
                      </div>
                      <div class="task-name">{{ task.name }}</div>
                    </div>
                    <div v-if="userData.dailyTasksList.length > 4" class="more-tasks">
                      还有 {{ userData.dailyTasksList.length - 4 }} 个任务...
                    </div>
                  </div>
                  <div v-else class="no-tasks">
                    今日暂无任务记录
                  </div>
                </div>

                <!-- 右侧任务类型分布图 -->
                <div class="task-distribution">
                  <div class="distribution-title">任务分布</div>
                  <svg width="100" height="100" viewBox="0 0 42 42">
                    <!-- 任务类型分布环形图 -->
                    <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke-width="3"></circle>

                    <!-- 不同类型的任务分段 -->
                    <circle v-for="(segment, i) in taskTypeSegments" :key="i"
                      class="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      :stroke="segment.color"
                      stroke-width="3"
                      :stroke-dasharray="`${segment.percentage} ${100-segment.percentage}`"
                      :stroke-dashoffset="-1 * getSegmentOffset(i)"
                    ></circle>
                  </svg>

                  <!-- 简化的图例 -->
                  <div class="mini-legend">
                    <div v-for="(segment, i) in taskTypeSegments.slice(0, 3)" :key="i" class="mini-legend-item">
                      <span class="legend-color" :style="{ backgroundColor: segment.color }"></span>
                      <span class="legend-text">{{ segment.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 波形图（专注力） -->
            <div class="poster-chart">
              <h3 class="chart-title">今日专注力波形图</h3>
              <div class="wave-chart">
                <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                  <!-- 背景网格 -->
                  <g class="grid">
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#e0e0e0" stroke-width="0.5" />
                    <line x1="0" y1="40" x2="400" y2="40" stroke="#e0e0e0" stroke-width="0.5" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#e0e0e0" stroke-width="0.5" />

                    <line x1="100" y1="0" x2="100" y2="80" stroke="#e0e0e0" stroke-width="0.5" />
                    <line x1="200" y1="0" x2="200" y2="80" stroke="#e0e0e0" stroke-width="0.5" />
                    <line x1="300" y1="0" x2="300" y2="80" stroke="#e0e0e0" stroke-width="0.5" />
                  </g>

                  <!-- 波形路径 -->
                  <path :d="focusWavePath" fill="none" stroke="url(#focusGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                  <!-- 波形填充 -->
                  <path :d="focusWaveFillPath" fill="url(#focusGradient)" opacity="0.2" />

                  <!-- 渐变定义 - 更柔和的颜色 -->
                  <defs>
                    <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#74b9ff" />
                      <stop offset="50%" stop-color="#a29bfe" />
                      <stop offset="100%" stop-color="#55efc4" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <!-- 底部信息 -->
            <div class="poster-footer">
              <div class="qr-code">
                <img :src="POSTER_IMAGES.QR_CODE.URL" alt="QR Code" />
                <p>扫码关注</p>
              </div>
              <div class="footer-text">
                <p class="brand-name">科晟智慧金融</p>
                <p>{{ POSTER_TEXT.XIAOHONGSHU_ID }}</p>
                <p>{{ POSTER_TEXT.FOOTER }}</p>
                <p>{{ formattedDate }}</p>
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
          <button
            v-if="!generatedImageUrl"
            class="generate-btn"
            @click="generatePoster"
            :disabled="isGenerating"
          >
            {{ isGenerating ? '生成中...' : '生成海报' }}
          </button>

          <div v-else class="download-options">
            <p class="download-tip">海报已生成，请选择操作：</p>
            <div class="download-buttons">
              <button
                class="download-btn"
                @click="downloadPoster"
              >
                <span class="btn-icon">💾</span> 保存到设备
              </button>

              <button
                class="share-btn"
                @click="sharePoster"
              >
                <span class="btn-icon">📤</span> 分享
              </button>

              <button
                class="regenerate-btn"
                @click="generatedImageUrl = ''"
              >
                <span class="btn-icon">🔄</span> 重新生成
              </button>
            </div>
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
  /* 添加过渡效果，使模态框平滑显示 */
  transition: opacity 0.3s ease;
  /* 防止鼠标事件穿透 */
  pointer-events: auto;
}

.poster-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.poster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.poster-header h2 {
  margin: 0;
  color: var(--primary-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #777;
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
  margin-bottom: 20px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 10px;
}

.poster {
  width: 100%;
  max-width: 400px;
  height: 820px; /* 调整为最佳高度 */
  /* 使用更柔和的渐变背景 */
  background: linear-gradient(125deg, #3a7bd5, #3a6073);
  border: none;
  border-radius: 20px;
  padding: 12px; /* 进一步减小内边距以增加内容空间 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden; /* 改回hidden以防止内容溢出 */
  position: relative;
  color: white;
  justify-content: flex-start; /* 改为从顶部开始排列 */
  gap: 3px; /* 最小化间距 */
}

/* 增强玻璃态背景效果 */
.poster::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 0;
}

/* 添加柔和的装饰元素 */
.poster::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
  z-index: 0;
  animation: rotate 80s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.poster > * {
  position: relative;
  z-index: 1;
}

/* 顶部区域 */
.poster-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.poster-logo {
  display: flex;
  align-items: center;
}

.poster-logo img {
  width: 40px;
  height: 40px;
  margin-right: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.poster-logo h1 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.poster-date {
  text-align: right;
}

.date-value {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.date-label {
  font-size: 12px;
  color: #7f8c8d;
}

/* 标题区域 */
.poster-title {
  text-align: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
}

/* 添加装饰线 */
.poster-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #74b9ff, #0984e3);
  border-radius: 2px;
}

.user-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #74b9ff;
  margin-bottom: 2px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.poster-title h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 3px 0;
  color: white;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.poster-title p {
  font-size: 12px;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

/* 主要内容区域 */
.poster-main-content {
  display: flex;
  margin-bottom: 8px;
}

.poster-stats {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.data-item {
  display: flex;
  align-items: center;
  /* 增强玻璃态效果 */
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
  margin-bottom: 3px; /* 减少间距 */
}

.data-item:hover {
  transform: translateX(5px) translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  background-color: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.data-icon {
  font-size: 16px;
  margin-right: 10px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.data-item:hover .data-icon {
  transform: rotate(10deg) scale(1.1);
}

.data-info {
  flex: 1;
}

.data-value {
  font-size: 16px;
  font-weight: 700;
  color: white;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.data-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1px;
}

/* 环形图 */
.poster-donut-chart {
  flex: 2;
  display: flex;
  justify-content: center;
  align-items: center;
}

.donut-container {
  position: relative;
  width: 120px;
  height: 120px;
}

.donut-ring {
  stroke: rgba(255, 255, 255, 0.2);
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
}

.donut-segment {
  stroke: url(#donutGradient);
  transition: stroke-dasharray 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
}

.donut-text {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  text-anchor: middle;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.donut-number {
  font-size: 4px;
  line-height: 1;
  transform: translateY(-0.4em);
  font-weight: bold;
  fill: white;
}

.donut-label {
  font-size: 4px;
  transform: translateY(1.2em);
  fill: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.05em;
}

.donut-small-label {
  font-size: 0.18em;
  transform: translateY(0.2em);
  fill: rgba(255, 255, 255, 0.8);
}

/* 任务概述区域样式 */
.task-summary {
  margin-bottom: 5px;
  background-color: rgba(58, 123, 213, 0.2); /* 使用与海报背景相协调的颜色 */
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-title {
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px 0;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.task-overview-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.task-list {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.15);
}

.task-item {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1); /* 恢复为半透明背景 */
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 3px;
}

.task-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.task-status {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.task-status.completed {
  color: #55efc4;
}

.task-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  font-size: 11px;
}

.more-tasks, .no-tasks {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  margin-top: 5px;
  text-align: center;
}

.task-distribution {
  flex: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
}

.distribution-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: white;
  text-align: center;
}

.mini-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 5px;
  width: 100%;
}

.mini-legend-item {
  display: flex;
  align-items: center;
  font-size: 10px;
  margin-bottom: 2px;
}

.legend-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  padding: 6px 10px;
  border-radius: 20px;
  transition: all 0.2s ease;
}

.legend-item:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: translateX(2px);
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.legend-text {
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* 波形图 */
.poster-chart {
  margin-bottom: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-title {
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin: 0 0 3px 0;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.wave-chart {
  display: flex;
  align-items: flex-end;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
}

/* 添加波形图的动画效果 */
.wave-chart svg {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.3));
}

.wave-chart .grid line {
  stroke: rgba(255, 255, 255, 0.15);
}

/* 添加脉冲动画效果 */
.wave-chart::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.2);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* 移除时间标签 */

/* 底部区域 */
.poster-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(0, 0, 0, 0.1);
  margin: auto -12px -12px -12px;
  padding: 8px 12px;
  margin-top: auto; /* 使用auto将底部区域推到底部 */
}

.qr-code {
  text-align: center;
}

.qr-code img {
  width: 50px;
  height: 50px;
  margin-bottom: 3px;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.qr-code p {
  font-size: 10px;
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.footer-text {
  flex: 1;
  margin-left: 10px;
}

.footer-text p {
  font-size: 9px;
  margin: 0 0 3px 0;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.2;
}

.brand-name {
  font-size: 12px !important;
  font-weight: 600;
  color: white !important;
  margin-bottom: 4px !important;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 删除重复的样式 */

.generated-poster {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.generated-poster img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.poster-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.poster-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.download-options {
  width: 100%;
  text-align: center;
}

.download-tip {
  margin-bottom: 15px;
  color: #555;
  font-size: 14px;
}

.download-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.generate-btn, .download-btn, .share-btn, .regenerate-btn {
  padding: 12px 24px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 18px;
}

.generate-btn {
  background: linear-gradient(135deg, #3a7bd5, #3a6073);
  color: white;
  min-width: 180px;
}

.download-btn {
  background: linear-gradient(135deg, #11998e, #38ef7d);
  color: white;
}

.share-btn {
  background: linear-gradient(135deg, #2193b0, #6dd5ed);
  color: white;
}

.regenerate-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border: 1px solid #ddd;
}

.generate-btn:hover, .download-btn:hover, .share-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 7px 15px rgba(0, 0, 0, 0.2);
}

.regenerate-btn:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.generate-btn:active, .download-btn:active, .share-btn:active, .regenerate-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
  width: 100%;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
</style>
