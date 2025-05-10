<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import apiService from '../services/apiService';
import { API_CONFIG, POSTER_CONFIG } from '../config';
import { authService } from '../../../shared/services/authService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { calculateTotalDuration } from '../services/UserTasksService';

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

interface Plan {
  id: number;
  text: string;
  completed: boolean;
  started: boolean;
}

interface UserData {
  username: string;
  totalTasks: number;
  totalTime: number;
  tasksList: Task[];
  plansList: Plan[];
  taskDistribution: TaskType[];
  streakDays: number;
}

// 用户数据
const userData = ref<UserData>({
  username: '',
  totalTasks: 0,
  totalTime: 0,
  tasksList: [],
  plansList: [],
  taskDistribution: [],
  streakDays: 0
});

// 计算属性
const completionRate = computed(() => {
  // 确保只使用今日计划计算完成率
  if (userData.value.plansList.length === 0) return 0;

  // 计算已完成的计划数量
  const completedPlans = userData.value.plansList.filter(plan => plan.completed).length;

  // 计算完成率
  return Math.round((completedPlans / userData.value.plansList.length) * 100);
});

// 格式化日期
const formattedDate = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
});

// 格式化时间（将分钟转换为小时和分钟）
const formatTime = (minutes: number): string => {
  if (!minutes || isNaN(minutes)) return '0分钟';

  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }

  return `${hours}小时${remainingMinutes}分钟`;
};

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
        backgroundColor: [],
        data: []
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
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('username');

    // 强制更新登录状态
    authService.checkAuth();

    if (!authService.isLoggedIn.value) {
      error.value = '请先登录后再生成海报';
      return;
    }

    // 显示加载状态
    isGenerating.value = true;
    error.value = '';

    // 并行获取所有需要的数据
    const [profileRes, tasksRes, plansRes, statsRes] = await Promise.all([
      apiService.get(API_CONFIG.ENDPOINTS.AUTH.CURRENT_USER),
      apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE),
      apiService.get(API_CONFIG.ENDPOINTS.PLANS.BASE),
      apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY)
    ]);

    // 获取用户信息
    const profile = profileRes.data;

    // 获取任务列表
    const tasks = tasksRes.data || [];

    // 获取计划列表
    const plans = plansRes.data || [];

    // 获取统计数据
    const statsData = statsRes.data || {};

    // 初始化今日学习时长
    let dailyDuration = 0;

    // 筛选今日任务
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    const todayTasks = tasks.filter((task: any) => {
      const taskDate = new Date(task.start);
      return taskDate >= new Date(todayStart) && taskDate <= new Date(todayEnd);
    });

    // 使用与统计页面相同的计算函数，不再强制最小为1分钟
    dailyDuration = calculateTotalDuration(todayTasks);

    console.log('今日学习时长（分钟）:', dailyDuration);

    // 使用上面已经筛选好的今日任务

    // 筛选今日计划
    const todayPlans = plans.filter((plan: any) => {
      // 检查计划是否属于当前用户
      if (plan.user_id !== profile.id) return false;

      // 如果计划没有创建时间，则检查开始时间
      if (!plan.created_at && !plan.start_time) return false;

      // 使用创建时间或开始时间来判断是否是今天的计划
      const planDate = new Date(plan.start_time || plan.created_at);
      return planDate >= new Date(todayStart) && planDate <= new Date(todayEnd);
    });

    // 今日计划数据准备完成

    // 计算今日总学习时间（分钟），不再使用默认值
    const totalTime = todayTasks.reduce((sum: number, task: any) => sum + (task.duration || 0), 0);

    // 获取用户统计数据
    const userStatsRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_STATS);
    const userStats = userStatsRes.data || {};

    // 更新用户数据
    userData.value = {
      username: profile.username,
      totalTasks: todayPlans.length, // 使用计划数量而不是任务数量
      totalTime: dailyDuration, // 使用统计API返回的今日学习时长
      tasksList: todayTasks.map((task: any) => ({
        id: task.id,
        name: task.name,
        duration: task.duration || 0,
        start: task.start,
        end: task.end,
        completed: task.completed,
        type: task.type || 'default'
      })),
      plansList: todayPlans.map((plan: any) => ({
        id: plan.id,
        text: plan.text,
        completed: plan.completed,
        started: plan.started
      })),
      // 使用今日任务计算任务分布
      taskDistribution: (() => {
        // 计算今日任务分布
        const distribution: Record<string, number> = {};
        todayTasks.forEach((task: any) => {
          const type = task.type || 'default';
          distribution[type] = (distribution[type] || 0) + 1;
        });

        // 如果没有任务，返回空数组
        if (todayTasks.length === 0) {
          return [];
        }

        // 转换为数组格式
        return Object.entries(distribution).map(([type, count]) => ({
          type,
          count: Number(count),
          total: todayTasks.length
        }));
      })(),
      // 确保连续学习天数正确获取
      streakDays: userStats.streak_days || 0
    };

    // 海报数据准备完成

    // 更新图表数据
    updateChartData();
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('加载用户数据失败');
    }
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

// 获取实际海报高度
const getActualPosterHeight = () => {
  // 如果海报元素存在，直接获取其实际高度
  if (posterRef.value) {
    return posterRef.value.offsetHeight;
  }

  // 如果无法获取实际高度，使用计算的高度作为备选
  return calculatePosterHeight();
};

// 计算海报高度（备选方法）
const calculatePosterHeight = () => {
  // 基础高度
  let baseHeight = 0;

  // 顶部信息高度
  baseHeight += 60; // poster-top

  // 用户信息高度
  baseHeight += 80; // poster-user

  // 统计数据高度 (2行)
  baseHeight += 180; // poster-stats

  // 任务列表高度 (标题 + 每个任务30px)
  const tasksCount = userData.value.tasksList.length;
  const tasksHeight = 50 + Math.min(tasksCount, 5) * 40 + (tasksCount > 5 ? 30 : 0);
  baseHeight += tasksHeight;

  // 名言高度
  baseHeight += 100; // quote-section

  // 底部信息高度 (更紧凑的设计)
  baseHeight += 120; // poster-footer - 减少高度

  // 内边距
  baseHeight += 50; // 上下padding各25px，减少底部空间

  return baseHeight;
};

// 生成海报
const generatePoster = async () => {
  if (!posterRef.value) return;

  isGenerating.value = true;
  error.value = '';

  try {
    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768;

    // 计算合适的海报宽度和高度
    const posterWidth = isMobile ? 320 : 400;
    const posterHeight = getActualPosterHeight(); // 使用实际高度

    // 创建一个临时的海报容器，用于生成图像
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    // 克隆原始海报
    const posterClone = posterRef.value.cloneNode(true) as HTMLElement;

    // 设置克隆海报的样式
    posterClone.style.width = `${posterWidth}px`;
    posterClone.style.height = `${posterHeight}px`;
    posterClone.style.minHeight = 'auto';
    posterClone.style.background = 'linear-gradient(135deg, #2c3e50, #3498db)';
    posterClone.style.position = 'relative';
    posterClone.style.display = 'flex';
    posterClone.style.flexDirection = 'column';
    posterClone.style.padding = '20px';
    posterClone.style.boxSizing = 'border-box';
    posterClone.style.borderRadius = '16px';
    posterClone.style.overflow = 'hidden';

    // 添加到临时容器
    tempContainer.appendChild(posterClone);

    // 应用样式到克隆元素的子元素
    // 统计数据样式
    const statItems = posterClone.querySelectorAll('.stat-item');
    statItems.forEach((item: Element) => {
      const statItem = item as HTMLElement;
      statItem.style.background = 'rgba(255, 255, 255, 0.15)';
      statItem.style.backdropFilter = 'blur(5px)';
      statItem.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      statItem.style.borderRadius = '12px';
      statItem.style.padding = '15px';
      statItem.style.display = 'flex';
      statItem.style.flexDirection = 'column';
      statItem.style.alignItems = 'center';
      statItem.style.justifyContent = 'center';
      statItem.style.transition = 'all 0.3s ease';
    });

    // 统计数值样式
    const statValues = posterClone.querySelectorAll('.stat-value');
    statValues.forEach((item: Element) => {
      const statValue = item as HTMLElement;
      statValue.style.color = '#ffffff';
      statValue.style.fontSize = '24px';
      statValue.style.fontWeight = 'bold';
      statValue.style.marginBottom = '5px';
      statValue.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    });

    // 任务列表样式
    const taskItems = posterClone.querySelectorAll('.task-item');
    taskItems.forEach((item: Element) => {
      const taskItem = item as HTMLElement;
      taskItem.style.background = 'rgba(255, 255, 255, 0.08)';
      taskItem.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      taskItem.style.borderRadius = '8px';
      taskItem.style.padding = '10px 15px';
      taskItem.style.marginBottom = '8px';
      taskItem.style.display = 'flex';
      taskItem.style.alignItems = 'center';
      taskItem.style.gap = '10px';
    });

    // 底部样式 - 更紧凑的设计
    const footer = posterClone.querySelector('.poster-footer') as HTMLElement;
    if (footer) {
      footer.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4))';
      footer.style.margin = '0 -20px -20px -20px';
      footer.style.padding = '20px 15px';
      footer.style.borderRadius = '0 0 16px 16px';
      footer.style.marginTop = 'auto';
      footer.style.display = 'flex';
      footer.style.flexDirection = 'row';
      footer.style.justifyContent = 'space-between';
      footer.style.minHeight = '120px'; // 减少底部高度
    }

    // 确保slogan样式正确
    const slogan = posterClone.querySelector('.slogan') as HTMLElement;
    if (slogan) {
      slogan.style.textAlign = 'center';
      slogan.style.marginTop = '15px';
      slogan.style.color = 'white';
      slogan.style.fontSize = '16px';
      slogan.style.fontWeight = '500';
    }

    // 名言样式
    const quoteText = posterClone.querySelector('.quote-text') as HTMLElement;
    if (quoteText) {
      quoteText.style.color = '#ffffff';
      quoteText.style.fontSize = '18px';
      quoteText.style.lineHeight = '1.6';
      quoteText.style.fontStyle = 'italic';
      quoteText.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    // 确保公司logo样式正确
    const companyLogo = posterClone.querySelector('.company-logo img') as HTMLElement;
    if (companyLogo) {
      companyLogo.style.borderRadius = '8px';
      companyLogo.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }

    // 使用html2canvas将临时元素转换为canvas
    const canvas = await html2canvas(posterClone, {
      scale: 3, // 提高缩放比例，获得更高质量的图像
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#2c3e50',
      width: posterWidth,
      height: posterHeight
    });

    // 清理临时元素
    document.body.removeChild(tempContainer);

    // 将画布转换为图像URL
    generatedImageUrl.value = canvas.toDataURL('image/png');
    emit('generated', generatedImageUrl.value);
  } catch (err) {
    console.error('生成海报失败:', err);
    error.value = '生成海报失败，请稍后再试';
  } finally {
    isGenerating.value = false;
  }
};

// 检测设备类型
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 检测iOS设备
const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// 下载海报
const downloadPoster = async () => {
  if (!generatedImageUrl.value) return;

  try {
    // 创建一个新的图片对象，确保图片已完全加载
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域

    // 使用Promise包装图片加载过程
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = generatedImageUrl.value;
      if (img.complete) resolve();
    });

    // 创建canvas
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    // 在canvas上绘制图片
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('无法获取canvas上下文');
      return;
    }
    ctx.drawImage(img, 0, 0);

    // 检测是否为移动设备
    if (isMobileDevice()) {
      try {
        // 移动设备：优先使用分享API
        if (navigator.share && typeof navigator.canShare === 'function') {
          try {
            // 将canvas转换为Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) {
              throw new Error('无法创建图片Blob');
            }

            // 创建文件对象
            const file = new File([blob], `学习海报-${formattedDate.value}.png`, { type: 'image/png' });

            // 尝试分享文件
            const shareData = { files: [file] };
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return;
            }
          } catch (shareError) {
            console.log('分享失败，回退到其他方法', shareError);
          }
        }

        // 对于iOS设备，使用特殊处理
        if (isIOSDevice()) {
          // 创建一个临时的a标签，打开图片在新窗口
          const dataUrl = canvas.toDataURL('image/png');

          // 创建一个临时的img元素，设置样式使其填满屏幕
          const tempImg = document.createElement('img');
          tempImg.src = dataUrl;
          tempImg.style.position = 'fixed';
          tempImg.style.top = '0';
          tempImg.style.left = '0';
          tempImg.style.width = '100%';
          tempImg.style.height = '100%';
          tempImg.style.objectFit = 'contain';
          tempImg.style.backgroundColor = 'rgba(0,0,0,0.8)';
          tempImg.style.zIndex = '10000';

          // 添加关闭按钮
          const closeBtn = document.createElement('button');
          closeBtn.textContent = '关闭';
          closeBtn.style.position = 'fixed';
          closeBtn.style.top = '20px';
          closeBtn.style.right = '20px';
          closeBtn.style.zIndex = '10001';
          closeBtn.style.padding = '8px 16px';
          closeBtn.style.backgroundColor = '#fff';
          closeBtn.style.border = 'none';
          closeBtn.style.borderRadius = '4px';
          closeBtn.style.fontSize = '16px';

          // 添加提示文本
          const helpText = document.createElement('div');
          helpText.textContent = '长按图片保存到相册';
          helpText.style.position = 'fixed';
          helpText.style.bottom = '40px';
          helpText.style.left = '0';
          helpText.style.width = '100%';
          helpText.style.textAlign = 'center';
          helpText.style.color = '#fff';
          helpText.style.fontSize = '16px';
          helpText.style.zIndex = '10001';

          // 添加到文档
          document.body.appendChild(tempImg);
          document.body.appendChild(closeBtn);
          document.body.appendChild(helpText);

          // 点击关闭按钮移除元素
          closeBtn.onclick = () => {
            document.body.removeChild(tempImg);
            document.body.removeChild(closeBtn);
            document.body.removeChild(helpText);
          };

          return;
        }

        // 对于Android设备，尝试使用下载API
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `学习海报-${formattedDate.value}.png`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
          }, 100);
        } catch (downloadErr) {
          console.error('Android下载失败:', downloadErr);
          fallbackDownload(canvas);
        }
      } catch (err) {
        console.error('移动设备保存失败:', err);
        fallbackDownload(canvas);
      }
    } else {
      // 桌面设备：使用传统下载方法
      fallbackDownload(canvas);
    }
  } catch (err) {
    console.error('下载海报失败:', err);
    alert('下载海报失败，请稍后再试');
  }
};

// 传统下载方法
const fallbackDownload = (canvas) => {
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('无法创建Blob');
      return;
    }
    // 创建一个临时URL
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = `学习海报-${formattedDate.value}.png`;
    link.style.display = 'none';

    // 添加到文档并触发点击
    document.body.appendChild(link);
    link.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }, 'image/png');
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

// 随机选择一条名人名言
const selectedQuote = ref(quotes[Math.floor(Math.random() * quotes.length)]);

// 海报配置
const posterSize = POSTER_CONFIG.SIZE;
const posterImages = POSTER_CONFIG.IMAGES;
const posterText = POSTER_CONFIG.TEXT;

// 注意：名人名言直接在模板中随机选择
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
                <img src="../../../assets/kslogo.png" width="40" height="40" alt="科晟智慧" />
                <span>科晟智慧</span>
              </div>
              <div class="poster-date">{{ formattedDate }}</div>
            </div>

            <!-- 用户信息 -->
            <div class="poster-user">
              <h1>{{ userData.username }} 的学习成果</h1>
            </div>

            <!-- 统计数据 -->
            <div class="poster-stats">
              <div class="stat-item">
                <div class="stat-value">{{ userData.totalTasks }} 项</div>
                <div class="stat-label">今日计划</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatTime(userData.totalTime) }}</div>
                <div class="stat-label">学习时长</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ completionRate }}%</div>
                <div class="stat-label">完成率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userData.streakDays }} 天</div>
                <div class="stat-label">连续学习</div>
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
                <div v-if="userData.tasksList.length === 0" class="empty-tasks">
                  今日暂无学习任务
                </div>
              </div>
            </div>

            <!-- 添加名人名言部分 -->
            <div class="quote-section">
              <p v-if="selectedQuote" class="quote-text">"{{ selectedQuote.text }}"</p>
              <p v-if="selectedQuote" class="quote-author">—— {{ selectedQuote.author }}</p>
            </div>

            <!-- 底部信息 - 更紧凑的布局 -->
            <div class="poster-footer">
              <div class="footer-content">
                <div class="company-info">
                  <h3 class="company-name">科晟智慧</h3>
                  <p class="company-name-en">KORSON ACADEMY</p>
                </div>
                <div class="company-logo">
                  <img src="../../../assets/kslogo.png" width="40" height="40" alt="科晟智慧" />
                </div>
                <div class="slogan">
                  <p>探索·学习·创造</p>
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
              <span>💾</span> {{ isMobileDevice() ? '保存到相册' : '下载海报' }}
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
  min-height: 800px; /* 增加最小高度，确保底部显示 */
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

.more-tasks, .empty-tasks {
  text-align: center;
  font-size: 14px;
  opacity: 0.8;
  margin-top: 10px;
}

.empty-tasks {
  padding: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
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

/* 美化底部样式 - 更紧凑的设计 */
.poster-footer {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4));
  margin: 0 -20px -20px;
  padding: 20px 15px;
  border-radius: 0 0 16px 16px;
  backdrop-filter: blur(10px);
  margin-top: auto; /* 将底部推到最下方 */
  min-height: 120px; /* 减少底部高度 */
}

.footer-content {
  display: flex;
  flex-direction: row; /* 改为横向布局 */
  align-items: center;
  justify-content: space-between; /* 两侧对齐 */
  height: 100%;
}

.company-info {
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0;
}

.company-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.company-name-en {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin: 2px 0 0 0;
  letter-spacing: 1px;
  font-weight: 500;
}

.company-logo {
  margin-left: 10px;
}

.company-logo img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.slogan {
  display: flex;
  align-items: center;
  font-size: 14px;
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
  width: 400px; /* 固定宽度，与预览海报宽度一致 */
  height: auto; /* 保持宽高比 */
  border-radius: 16px; /* 与预览海报圆角一致 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); /* 与预览海报阴影一致 */
  object-fit: contain; /* 确保图片不会被拉伸或压缩 */
  max-width: 100%; /* 确保在小屏幕上不会溢出 */
  display: block; /* 防止底部出现额外空间 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .poster-container {
    padding: 16px;
    width: 95%;
  }

  .poster {
    max-width: 350px;
    min-height: auto; /* 移除最小高度限制 */
  }

  .poster-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-item {
    padding: 12px;
  }

  .generated-poster img {
    width: 350px;
  }

  .download-options {
    flex-direction: column;
    width: 100%;
    gap: 10px;
  }

  .download-btn, .regenerate-btn, .generate-btn {
    width: 100%;
    padding: 10px 16px;
    font-size: 15px;
  }

  .quote-section {
    padding: 20px 15px;
  }

  .quote-section::before {
    left: 10px;
    top: 5px;
    font-size: 50px;
  }

  .quote-section::after {
    right: 10px;
    bottom: -15px;
    font-size: 50px;
  }
}

@media (max-width: 480px) {
  .poster-container {
    padding: 12px;
    width: 100%;
  }

  .poster-header h2 {
    font-size: 18px;
  }

  .poster {
    max-width: 320px;
    padding: 15px;
  }

  .poster-top {
    padding: 8px 12px;
    font-size: 12px;
  }

  .poster-user {
    margin-top: 15px;
  }

  .poster-user h1 {
    font-size: 20px;
  }

  .poster-user p {
    font-size: 12px;
  }

  .poster-stats {
    margin-top: 15px;
    gap: 8px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-label {
    font-size: 11px;
  }

  .tasks-section {
    margin-top: 15px;
  }

  .tasks-header {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .task-item {
    padding: 8px 12px;
    font-size: 13px;
  }

  .quote-text {
    font-size: 15px;
    line-height: 1.6;
  }

  .quote-author {
    font-size: 12px;
  }

  /* 移动端底部样式优化 */
  .poster-footer {
    padding: 15px 10px;
    min-height: 100px;
  }

  .footer-content {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .company-name {
    font-size: 16px;
  }

  .company-name-en {
    font-size: 10px;
  }

  .company-logo img {
    width: 35px;
    height: 35px;
  }

  .slogan {
    font-size: 12px;
    width: 100%;
    justify-content: center;
    margin-top: 5px;
  }
}
</style>
