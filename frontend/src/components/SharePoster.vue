<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import { POSTER_SIZE, POSTER_IMAGES, POSTER_TEXT, POSTER_COLORS, POSTER_FONTS } from '../config/poster';
import apiService from '../services/apiService';
import { API_CONFIG } from '../config';

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
const error = ref('');

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

// 专注力波形图数据点
const focusWavePoints = computed(() => {
  // 如果有时间分布数据，使用实际数据
  if (userData.value.timeDistribution && userData.value.timeDistribution.length > 0) {
    // 使用24小时的数据
    const hourlyData = Array(24).fill(0);
    userData.value.timeDistribution.forEach(item => {
      hourlyData[item.hour] = item.duration;
    });

    // 找出最大值，用于归一化
    const maxDuration = Math.max(...hourlyData, 1);

    // 归一化数据到0-100的范围（反转Y轴，因为SVG坐标系Y轴向下）
    return hourlyData.map(value => {
      // 将值映射到10-110范围（留出一些边距）
      return 110 - (value / maxDuration * 100 + 10);
    });
  }

  // 如果没有实际数据，生成平滑的随机数据
  // 使用正弦波和随机值的组合，创建更自然的波形
  return Array(24).fill(0).map((_, i) => {
    const base = Math.sin(i / 3.8) * 30 + 50; // 基础正弦波
    const random = Math.random() * 15 - 7.5;  // 随机波动
    return Math.max(10, Math.min(110, base + random)); // 限制在10-110范围内
  });
});

// 生成SVG波形路径
const focusWavePath = computed(() => {
  const points = focusWavePoints.value;
  const width = 400;
  const pointWidth = width / (points.length - 1);

  // 使用贝塞尔曲线创建平滑的波形
  let path = `M 0,${points[0]}`;

  for (let i = 0; i < points.length - 1; i++) {
    const x1 = i * pointWidth;
    const y1 = points[i];
    const x2 = (i + 1) * pointWidth;
    const y2 = points[i + 1];

    // 控制点，用于创建平滑曲线
    const cpx1 = x1 + pointWidth / 3;
    const cpy1 = y1;
    const cpx2 = x2 - pointWidth / 3;
    const cpy2 = y2;

    path += ` C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x2},${y2}`;
  }

  return path;
});

// 生成波形填充路径（添加底部边界）
const focusWaveFillPath = computed(() => {
  return `${focusWavePath.value} L ${400},80 L 0,80 Z`;
});

// 任务类型分布数据
const taskTypeSegments = computed(() => {
  // 优先使用从statistics获取的分类数据
  if (userData.value.taskTypeDistribution && userData.value.taskTypeDistribution.length > 0) {
    return userData.value.taskTypeDistribution;
  }

  // 如果没有从statistics获取到数据，尝试从任务列表生成
  if (userData.value.dailyTasksList && userData.value.dailyTasksList.length > 0) {
    // 统计不同类型任务的数量
    const typeCounts: Record<string, number> = {};
    let total = 0;

    userData.value.dailyTasksList.forEach(task => {
      const type = task.type || '其他';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      total++;
    });

    // 转换为百分比
    const result = [];
    const colors = ['#74b9ff', '#55efc4', '#a29bfe', '#ffeaa7', '#fab1a0'];

    let i = 0;
    for (const type in typeCounts) {
      const percentage = Math.round((typeCounts[type] / total) * 100);
      result.push({
        name: type,
        percentage,
        color: colors[i % colors.length]
      });
      i++;
    }

    return result;
  }

  // 如果没有任何数据，返回默认分布
  return [  ];
});

// 计算环形图分段的偏移量
const getSegmentOffset = (index: number) => {
  let offset = 25; // 初始偏移量

  // 累加前面所有分段的百分比
  for (let i = 0; i < index; i++) {
    offset += taskTypeSegments.value[i].percentage;
  }

  return offset;
};

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

    // 首先获取当前用户信息，确保我们有正确的用户昵称
    try {
      console.log('获取当前用户信息...');
      const currentUserResponse = await apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER);
      if (currentUserResponse && currentUserResponse.data) {
        userData.value.username = currentUserResponse.data.username || '';
        userData.value.nickname = currentUserResponse.data.username || '学习达人'; // 使用用户名作为昵称
        console.log('成功获取当前用户信息:', currentUserResponse.data);
      } else {
        console.warn('获取当前用户信息返回空数据');
      }
    } catch (err) {
      console.error('获取当前用户信息失败:', err);
    }

    // 获取用户信息（包括注册日期和昵称）
    try {
      console.log('获取用户统计信息...');
      const userInfoResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO);
      if (userInfoResponse && userInfoResponse.data) {
        userData.value.registrationDate = userInfoResponse.data.created_at || '';
        userData.value.username = userInfoResponse.data.username || userData.value.username || '';
        // 优先使用后端返回的nickname，如果没有则使用username
        userData.value.nickname = userInfoResponse.data.nickname || userInfoResponse.data.username || userData.value.nickname || '学习达人';
        console.log('成功获取用户统计信息:', userInfoResponse.data);
      } else {
        console.warn('获取用户统计信息返回空数据');
      }
    } catch (err) {
      console.error('获取用户统计信息失败:', err);
    }

    // 获取总计统计数据
    try {
      console.log('获取总计统计数据...');
      const statsResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL);
      if (statsResponse && statsResponse.data) {
        // 从总计统计中获取数据
        userData.value.totalDuration = statsResponse.data.totalHours * 60 || 0;
        userData.value.dailyMinutes = statsResponse.data.dailyMinutes || 0;
        console.log('成功获取总计统计数据:', statsResponse.data);
      } else {
        console.warn('获取总计统计数据返回空数据');
      }
    } catch (err) {
      console.error('获取总计统计数据失败:', err);
    }

    // 获取用户任务统计
    try {
      console.log('获取用户任务统计...');
      const userStatsResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_STATS);
      if (userStatsResponse && userStatsResponse.data) {
        userData.value.totalTasks = userStatsResponse.data.total_tasks || 0;
        userData.value.completedTasks = userStatsResponse.data.completed_tasks || 0;
        userData.value.streak = userStatsResponse.data.streak || 0;

        // 获取今日任务数据
        userData.value.dailyTasks = userStatsResponse.data.daily_tasks || 0;
        userData.value.dailyCompletedTasks = userStatsResponse.data.daily_completed_tasks || 0;

        console.log('成功获取用户任务统计:', userStatsResponse.data);
      } else {
        console.warn('获取用户任务统计返回空数据');
      }
    } catch (err) {
      console.error('获取用户任务统计失败:', err);
    }

    // 获取时间分布数据（用于专注力波形图）
    try {
      console.log('获取时间分布数据...');
      const timeDistResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION);
      if (timeDistResponse && timeDistResponse.data && Array.isArray(timeDistResponse.data)) {
        // 确保数据格式正确
        const validData = timeDistResponse.data.filter(item =>
          typeof item === 'object' &&
          item !== null &&
          'hour' in item &&
          'duration' in item
        );

        if (validData.length > 0) {
          userData.value.timeDistribution = validData;
          console.log('成功加载时间分布数据:', validData);
        } else {
          console.warn('时间分布数据格式正确但内容无效');
          userData.value.timeDistribution = [];
        }
      } else {
        console.warn('时间分布数据格式不正确:', timeDistResponse?.data);
        userData.value.timeDistribution = [];
      }
    } catch (err) {
      console.error('获取时间分布数据失败:', err);
      userData.value.timeDistribution = [];
    }

    // 获取任务分类分布数据（从daily统计获取）
    try {
      console.log('获取每日任务分类数据...');
      const dailyResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY);

      // 检查响应数据
      if (!dailyResponse || !dailyResponse.data) {
        console.warn('每日统计响应为空');
        return;
      }

      console.log('每日统计原始数据:', dailyResponse.data);

      // 处理内容数据
      if (dailyResponse.data.content && Array.isArray(dailyResponse.data.content)) {
        const contentData = dailyResponse.data.content;
        console.log('获取到内容数据:', contentData);

        if (contentData.length > 0) {
          // 过滤掉无效数据
          const validContentData = contentData.filter(item =>
            typeof item === 'object' &&
            item !== null &&
            'name' in item &&
            'duration' in item &&
            item.duration > 0
          );

          if (validContentData.length === 0) {
            console.warn('过滤后的内容数据为空');
            return;
          }

          console.log('有效内容数据:', validContentData);

          // 计算总时长
          const total = validContentData.reduce((sum, item) => sum + (item.duration || 0), 0);
          console.log('总时长:', total);

          if (total > 0) {
            const result = [];
            const colors = ['#74b9ff', '#55efc4', '#a29bfe', '#ffeaa7', '#fab1a0'];

            validContentData.forEach((item, index) => {
              const duration = item.duration || 0;
              const percentage = Math.round((duration / total) * 100);
              if (percentage > 0) {
                result.push({
                  name: item.name || '其他',
                  percentage,
                  color: colors[index % colors.length]
                });
              }
            });

            // 更新任务类型分布数据
            if (result.length > 0) {
              userData.value.taskTypeDistribution = result;
              console.log('成功加载内容分布数据:', result);

              // 同时更新任务列表
              userData.value.dailyTasksList = validContentData.map(item => ({
                name: item.name || '未命名任务',
                completed: true,
                type: item.name || '其他',
                duration: item.duration || 0
              }));
              console.log('成功更新任务列表:', userData.value.dailyTasksList);
            } else {
              console.warn('内容分布数据为空');
            }
          } else {
            console.warn('总时长为0，无法计算百分比');
          }
        } else {
          console.warn('内容数据为空');
        }
      } else {
        // 尝试处理hourly数据
        if (dailyResponse.data.hourly && Array.isArray(dailyResponse.data.hourly)) {
          console.log('尝试从hourly数据获取信息:', dailyResponse.data.hourly);

          // 使用hourly数据更新时间分布
          const hourlyData = dailyResponse.data.hourly;
          if (hourlyData.length > 0) {
            const timeDistData = hourlyData.map(item => ({
              hour: parseInt(item.time) || 0,
              duration: item.duration || 0
            })).filter(item => !isNaN(item.hour) && item.hour >= 0 && item.hour < 24);

            if (timeDistData.length > 0) {
              userData.value.timeDistribution = timeDistData;
              console.log('从hourly数据更新时间分布:', timeDistData);
            }
          }
        } else {
          console.warn('每日统计数据格式不正确:', dailyResponse.data);
        }
      }
    } catch (err) {
      console.error('获取任务分类分布失败:', err);
      // 不使用默认数据，保持空数组
      userData.value.taskTypeDistribution = [];
    }

    // 注意：每日统计数据已经在上面获取过了，这里不需要重复获取
    // 如果需要使用 hourly 数据，可以在上面的 dailyResponse 处理中添加相关逻辑

    // 如果从daily统计中没有获取到任务列表，则尝试从计划数据获取
    if (userData.value.dailyTasksList.length === 0) {
      try {
        console.log('从计划数据获取任务列表...');
        const plansResponse = await apiService.get(API_CONFIG.ENDPOINTS.PLANS.BASE);

        if (plansResponse && plansResponse.data && Array.isArray(plansResponse.data)) {
          console.log('获取到计划数据:', plansResponse.data.length, '条');

          // 检查计划数据格式
          const validPlans = plansResponse.data.filter((plan: any) =>
            typeof plan === 'object' &&
            plan !== null &&
            (plan.createdAt || plan.created_at)
          );

          if (validPlans.length === 0) {
            console.warn('没有有效的计划数据');
            return;
          }

          console.log('有效计划数据:', validPlans.length, '条');

          // 过滤出今天的计划
          const today = new Date();
          const todayString = today.toDateString();

          const todayPlans = validPlans.filter((plan: any) => {
            // 检查计划是否为今天创建的
            const planDate = new Date(plan.createdAt || plan.created_at);
            const isToday = planDate.toDateString() === todayString;

            if (isToday) {
              console.log('找到今日计划:', plan);
            }

            return isToday;
          });

          console.log('今日计划数量:', todayPlans.length);

          // 只有在没有从daily统计获取到任务列表时，才使用计划数据
          if (userData.value.dailyTasksList.length === 0 && todayPlans.length > 0) {
            // 将计划转换为任务格式
            userData.value.dailyTasksList = todayPlans.map((plan: any) => ({
              name: plan.text || plan.title || '未命名计划',
              completed: plan.completed || false,
              type: '学习',
              duration: 0
            }));

            console.log('从计划数据设置今日任务列表:', userData.value.dailyTasksList);

            // 更新今日计划数量
            userData.value.dailyTasks = todayPlans.length;
            userData.value.dailyCompletedTasks = todayPlans.filter((plan: any) => plan.completed).length;

            console.log('更新今日计划统计:', {
              dailyTasks: userData.value.dailyTasks,
              dailyCompletedTasks: userData.value.dailyCompletedTasks
            });
          }
        } else {
          console.warn('计划数据格式不正确或为空');
        }
      } catch (err) {
        console.error('获取计划数据失败:', err);
      }
    }

    // 如果没有任何任务数据，创建一些默认数据以便海报能够正常显示
    if (userData.value.dailyTasksList.length === 0) {
      console.log('没有任何任务数据，使用默认数据');

      // 创建默认任务分布数据
      userData.value.taskTypeDistribution = [
        { name: '学习', percentage: 60, color: '#74b9ff' },
        { name: '工作', percentage: 30, color: '#55efc4' },
        { name: '其他', percentage: 10, color: '#a29bfe' }
      ];

      // 创建默认任务列表
      userData.value.dailyTasksList = [
        { name: '学习任务', completed: true, type: '学习', duration: 60 },
        { name: '工作任务', completed: false, type: '工作', duration: 30 },
        { name: '其他任务', completed: false, type: '其他', duration: 10 }
      ];

      console.log('设置默认任务数据完成');
    }

  } catch (err) {
    console.error('加载用户数据失败:', err);
    error.value = '加载数据失败，请稍后再试';
  }
};

// 生成并显示海报
const generateAndShowPoster = async () => {
  if (!posterRef.value) return;

  isGenerating.value = true;
  error.value = '';

  try {
    // 使用html2canvas将DOM元素转换为canvas
    const canvas = await html2canvas(posterRef.value, {
      scale: 2, // 提高分辨率
      useCORS: true, // 允许加载跨域图片
      allowTaint: true,
      backgroundColor: 'transparent' // 透明背景，保留设计效果
    });

    // 将canvas转换为图片URL
    generatedImageUrl.value = canvas.toDataURL('image/png');

    // 触发生成完成事件
    emit('generated', generatedImageUrl.value);

    // 添加生成成功的视觉反馈
    setTimeout(() => {
      // 可以添加一些动画或提示
      console.log('海报生成成功，可以下载或分享');
    }, 500);
  } catch (err) {
    console.error('生成海报失败:', err);
    error.value = '生成海报失败，请稍后再试';
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

  generateAndShowPoster();
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
            @click="generateAndShowPoster"
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
