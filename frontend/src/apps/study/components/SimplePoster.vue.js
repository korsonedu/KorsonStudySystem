import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import apiService from '../services/apiService';
import { API_CONFIG, POSTER_CONFIG } from '../config';
import { authService } from '../../../shared/services/authService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { calculateTotalDuration } from '../services/UserTasksService';
// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);
const props = defineProps();
const emit = defineEmits();
// 状态
const posterRef = ref(null);
const isGenerating = ref(false);
const generatedImageUrl = ref('');
const error = ref('');
// 用户数据
const userData = ref({
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
    if (userData.value.plansList.length === 0)
        return 0;
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
const formatTime = (minutes) => {
    if (!minutes || isNaN(minutes))
        return '0分钟';
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
        const todayTasks = tasks.filter((task) => {
            const taskDate = new Date(task.start);
            return taskDate >= new Date(todayStart) && taskDate <= new Date(todayEnd);
        });
        // 使用与统计页面相同的计算函数，确保时长至少为1分钟
        dailyDuration = calculateTotalDuration(todayTasks);
        console.log('今日学习时长（分钟）:', dailyDuration);
        // 使用上面已经筛选好的今日任务
        // 筛选今日计划
        const todayPlans = plans.filter((plan) => {
            // 检查计划是否属于当前用户
            if (plan.user_id !== profile.id)
                return false;
            // 如果计划没有创建时间，则检查开始时间
            if (!plan.created_at && !plan.start_time)
                return false;
            // 使用创建时间或开始时间来判断是否是今天的计划
            const planDate = new Date(plan.start_time || plan.created_at);
            return planDate >= new Date(todayStart) && planDate <= new Date(todayEnd);
        });
        // 今日计划数据准备完成
        // 计算今日总学习时间（分钟）
        const totalTime = todayTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
        // 获取用户统计数据
        const userStatsRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_STATS);
        const userStats = userStatsRes.data || {};
        // 更新用户数据
        userData.value = {
            username: profile.username,
            totalTasks: todayPlans.length, // 使用计划数量而不是任务数量
            totalTime: dailyDuration, // 使用统计API返回的今日学习时长
            tasksList: todayTasks.map((task) => ({
                id: task.id,
                name: task.name,
                duration: task.duration || 0,
                start: task.start,
                end: task.end,
                completed: task.completed,
                type: task.type || 'default'
            })),
            plansList: todayPlans.map((plan) => ({
                id: plan.id,
                text: plan.text,
                completed: plan.completed,
                started: plan.started
            })),
            // 使用今日任务计算任务分布
            taskDistribution: (() => {
                // 计算今日任务分布
                const distribution = {};
                todayTasks.forEach((task) => {
                    const type = task.type || 'default';
                    distribution[type] = (distribution[type] || 0) + 1;
                });
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
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('加载用户数据失败');
        }
        if (err.response?.status === 401) {
            error.value = '请先登录后再生成海报';
        }
        else if (err.response?.data?.detail) {
            error.value = err.response.data.detail;
        }
        else {
            error.value = '加载数据失败，请稍后再试';
        }
    }
    finally {
        isGenerating.value = false;
    }
};
// 辅助函数：获取任务类型对应的颜色
const getTaskTypeColor = (type) => {
    const colorMap = {
        study: '#4e79a7', // 更柔和的蓝色
        review: '#59a14f', // 更柔和的绿色
        practice: '#b07aa1', // 更柔和的紫色
        default: '#7f7f7f' // 更柔和的灰色
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
            position: 'right',
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
                label: function (context) {
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
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
    if (!posterRef.value)
        return;
    isGenerating.value = true;
    error.value = '';
    try {
        // 获取海报元素的宽高比
        const posterElement = posterRef.value;
        const posterWidth = posterElement.offsetWidth;
        const posterHeight = posterElement.offsetHeight;
        const aspectRatio = posterHeight / posterWidth;
        // 使用固定宽度和计算的高度
        const fixedWidth = 400;
        const fixedHeight = Math.round(fixedWidth * aspectRatio);
        // 使用更高的缩放比例以获得更清晰的图像
        const canvas = await html2canvas(posterRef.value, {
            scale: 3, // 提高缩放比例，获得更高质量的图像
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#2c3e50',
            onclone: (clonedDoc) => {
                // 获取克隆的海报元素
                const clonedElement = clonedDoc.querySelector('.poster');
                if (clonedElement) {
                    // 确保背景渐变正确应用
                    clonedElement.style.background = 'linear-gradient(135deg, #2c3e50, #3498db)';
                    // 设置固定宽度和高度，保持宽高比
                    clonedElement.style.width = `${fixedWidth}px`;
                    clonedElement.style.height = `${fixedHeight}px`;
                    // 确保统计数据样式正确
                    const statItems = clonedElement.querySelectorAll('.stat-item');
                    statItems.forEach((item) => {
                        item.style.background = 'rgba(255, 255, 255, 0.15)';
                        item.style.backdropFilter = 'blur(5px)';
                        item.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    });
                    // 确保统计数值样式正确
                    const statValues = clonedElement.querySelectorAll('.stat-value');
                    statValues.forEach((item) => {
                        item.style.color = '#ffffff';
                        item.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                    });
                    // 确保任务列表样式正确
                    const taskItems = clonedElement.querySelectorAll('.task-item');
                    taskItems.forEach((item) => {
                        item.style.background = 'rgba(255, 255, 255, 0.08)';
                        item.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    });
                    // 确保底部样式正确
                    const footer = clonedElement.querySelector('.poster-footer');
                    if (footer) {
                        footer.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.4))';
                    }
                    // 确保名言样式正确
                    const quoteText = clonedElement.querySelector('.quote-text');
                    if (quoteText) {
                        quoteText.style.color = '#ffffff';
                        quoteText.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }
                }
            }
        });
        // 将画布转换为图像URL
        generatedImageUrl.value = canvas.toDataURL('image/png');
        emit('generated', generatedImageUrl.value);
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('生成海报失败');
        }
        error.value = '生成海报失败，请稍后再试';
    }
    finally {
        isGenerating.value = false;
    }
};
// 下载海报
const downloadPoster = () => {
    if (!generatedImageUrl.value)
        return;
    try {
        // 创建一个新的图片对象，确保图片已完全加载
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 允许跨域
        img.onload = () => {
            // 创建canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            // 在canvas上绘制图片
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('无法获取canvas上下文');
                }
                return;
            }
            ctx.drawImage(img, 0, 0);
            // 将canvas转换为Blob
            canvas.toBlob((blob) => {
                if (!blob) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.error('无法创建Blob');
                    }
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
        // 设置图片源
        img.src = generatedImageUrl.value;
        // 如果图片已经加载完成，手动触发onload事件
        if (img.complete) {
            img.dispatchEvent(new Event('load'));
        }
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('下载海报失败');
        }
        alert('下载海报失败，请稍后再试');
    }
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['poster-header']} */ ;
/** @type {__VLS_StyleScopedClasses['poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-user']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-item']} */ ;
/** @type {__VLS_StyleScopedClasses['poster-tasks']} */ ;
/** @type {__VLS_StyleScopedClasses['task-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-tasks']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-section']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-section']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-section']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-section']} */ ;
/** @type {__VLS_StyleScopedClasses['generated-poster']} */ ;
/** @type {__VLS_StyleScopedClasses['generate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['download-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['regenerate-btn']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SimplePoster.vue.js.map