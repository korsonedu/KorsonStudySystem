import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import { userService } from '../services/userService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
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
    taskDistribution: [],
    streakDays: 0
});
// 计算属性
const completionRate = computed(() => {
    if (userData.value.totalTasks === 0)
        return 0;
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
        if (!userService.isLoggedIn.value) {
            error.value = '请先登录后再生成海报';
            return;
        }
        // 显示加载状态
        isGenerating.value = true;
        error.value = '';
        console.log('开始加载用户数据...');
        // 获取用户信息
        const profile = await userService.getProfile();
        console.log('用户信息:', profile);
        // 获取任务列表
        const tasks = await userService.getTasks();
        console.log('任务列表:', tasks);
        // 获取统计数据
        const stats = await userService.getDailyStats();
        console.log('统计数据:', stats);
        // 筛选今日任务
        const todayStart = getTodayStart();
        const todayEnd = getTodayEnd();
        const todayTasks = tasks.filter((task) => {
            const taskDate = new Date(task.start);
            return taskDate >= new Date(todayStart) && taskDate <= new Date(todayEnd);
        });
        // 计算今日总学习时间（分钟）
        const totalTime = todayTasks.reduce((sum, task) => sum + (task.duration || 0), 0);
        userData.value = {
            username: profile.username,
            totalTasks: todayTasks.length,
            totalTime: totalTime,
            tasksList: todayTasks.map((task) => ({
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
    }
    catch (err) {
        console.error('加载用户数据失败:', err);
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
        const canvas = await html2canvas(posterRef.value, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#2c3e50',
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.querySelector('.poster');
                if (clonedElement) {
                    clonedElement.style.background = 'linear-gradient(135deg, #2c3e50, #3498db)';
                    const statItems = clonedElement.querySelectorAll('.stat-value');
                    statItems.forEach((item) => {
                        item.style.color = '#ffffff';
                        item.style.background = 'none';
                        item.style.webkitBackgroundClip = 'unset';
                        item.style.webkitTextFillColor = '#ffffff';
                    });
                }
            }
        });
        generatedImageUrl.value = canvas.toDataURL('image/png');
        emit('generated', generatedImageUrl.value);
        console.log('海报生成成功');
    }
    catch (err) {
        console.error('生成海报失败:', err);
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
// 随机获取一条名言
const randomQuote = computed(() => {
    const index = Math.floor(Math.random() * quotes.length);
    return quotes[index];
});
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