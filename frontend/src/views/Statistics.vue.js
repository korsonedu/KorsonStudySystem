import { ref, onMounted, computed } from 'vue';
import apiService from '../services/apiService';
import { API_CONFIG } from '../config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);
// Stats data
const dailyStats = ref([]);
const weeklyStats = ref([]);
const monthlyStats = ref([]);
const totalStats = ref(null);
const heatmapData = ref([]);
const timeDistributionData = ref([]);
const dailyContentStats = ref([]);
const weeklyContentStats = ref([]);
const monthlyContentStats = ref([]);
const userRegistrationDate = ref(''); // 用户注册日期
const loading = ref(false);
const error = ref('');
// Current view
const currentView = ref('daily');
// Chart data
const chartData = computed(() => {
    let labels = [];
    let data = [];
    if (currentView.value === 'daily') {
        labels = dailyStats.value.map((item) => item.time);
        data = dailyStats.value.map((item) => item.duration);
    }
    else if (currentView.value === 'weekly') {
        labels = weeklyStats.value.map((item) => item.day);
        data = weeklyStats.value.map((item) => item.duration);
    }
    else {
        labels = monthlyStats.value.map((item) => item.day);
        data = monthlyStats.value.map((item) => item.duration);
    }
    return {
        labels,
        datasets: [
            {
                label: '学习时长 (分钟)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                data
            }
        ]
    };
});
// 内容统计图数据
const contentChartData = computed(() => {
    let contentStats = [];
    if (currentView.value === 'daily') {
        contentStats = dailyContentStats.value;
    }
    else if (currentView.value === 'weekly') {
        contentStats = weeklyContentStats.value;
    }
    else {
        contentStats = monthlyContentStats.value;
    }
    // 如果没有数据，返回空数据
    if (!contentStats || contentStats.length === 0) {
        return {
            labels: [],
            datasets: [{
                    backgroundColor: [],
                    data: []
                }]
        };
    }
    // 生成随机颜色
    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 137) % 360; // 使用黄金角分布获取不同的色相
            colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
        }
        return colors;
    };
    const labels = contentStats.map((item) => item.name);
    const data = contentStats.map((item) => item.duration);
    const backgroundColor = generateColors(labels.length);
    return {
        labels,
        datasets: [{
                backgroundColor,
                data
            }]
    };
});
// Chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 允许自定义高度
    scales: {
        y: {
            beginAtZero: true
        }
    },
    layout: {
        padding: 10 // 添加内边距
    },
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    }
};
// 内容统计图配置
const contentChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // 允许自定义高度
    layout: {
        padding: 10 // 添加内边距
    },
    plugins: {
        legend: {
            position: 'right',
            labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                    size: 12 // 减小字体大小
                }
            }
        },
        tooltip: {
            callbacks: {
                label: function (context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} 分钟 (${percentage}%)`;
                }
            }
        }
    }
};
// Switch view
const switchView = (view) => {
    currentView.value = view;
};
// Fetch stats
const fetchStats = async () => {
    try {
        loading.value = true;
        error.value = '';
        console.log('Fetching statistics data...');
        // 从API获取数据
        const [dailyRes, weeklyRes, monthlyRes, totalRes, heatmapRes, timeDistRes, userRes] = await Promise.all([
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION),
            apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO) // 获取用户信息，包括注册日期
        ]);
        console.log('Statistics API responses:', {
            daily: dailyRes,
            weekly: weeklyRes,
            monthly: monthlyRes,
            total: totalRes,
            heatmap: heatmapRes,
            timeDistribution: timeDistRes,
            userInfo: userRes
        });
        // 处理每日数据
        if (dailyRes && dailyRes.data) {
            if (dailyRes.data.hourly) {
                dailyStats.value = dailyRes.data.hourly || [];
            }
            else {
                dailyStats.value = dailyRes.data || [];
            }
        }
        else {
            dailyStats.value = [];
        }
        // 处理每日内容统计
        if (dailyRes && dailyRes.data && dailyRes.data.content) {
            dailyContentStats.value = dailyRes.data.content || [];
        }
        else {
            dailyContentStats.value = [];
        }
        // 处理每周数据
        if (weeklyRes && weeklyRes.data) {
            if (weeklyRes.data.daily) {
                weeklyStats.value = weeklyRes.data.daily || [];
            }
            else {
                weeklyStats.value = weeklyRes.data || [];
            }
        }
        else {
            weeklyStats.value = [];
        }
        // 处理每周内容统计
        if (weeklyRes && weeklyRes.data && weeklyRes.data.content) {
            weeklyContentStats.value = weeklyRes.data.content || [];
        }
        else {
            weeklyContentStats.value = [];
        }
        // 处理每月数据
        if (monthlyRes && monthlyRes.data) {
            if (monthlyRes.data.daily) {
                monthlyStats.value = monthlyRes.data.daily || [];
            }
            else {
                monthlyStats.value = monthlyRes.data || [];
            }
        }
        else {
            monthlyStats.value = [];
        }
        // 处理每月内容统计
        if (monthlyRes && monthlyRes.data && monthlyRes.data.content) {
            monthlyContentStats.value = monthlyRes.data.content || [];
        }
        else {
            monthlyContentStats.value = [];
        }
        // 处理其他数据
        heatmapData.value = heatmapRes && heatmapRes.data ? heatmapRes.data : [];
        timeDistributionData.value = timeDistRes && timeDistRes.data ? timeDistRes.data : [];
        totalStats.value = totalRes && totalRes.data ? totalRes.data : {
            dailyMinutes: 0,
            weeklyMinutes: 0,
            monthlyMinutes: 0,
            totalHours: 0
        };
        // 处理用户信息，获取注册日期
        if (userRes && userRes.data) {
            // 用户信息中包含 created_at 字段表示注册日期
            userRegistrationDate.value = userRes.data.created_at || '';
            console.log('User registration date:', userRegistrationDate.value);
        }
        loading.value = false;
    }
    catch (err) {
        console.error('Error fetching statistics:', err);
        error.value = err.response?.data?.detail || '获取统计数据失败，请稍后再试';
        loading.value = false;
        // 即使出错，也确保初始化数据
        dailyStats.value = [];
        weeklyStats.value = [];
        monthlyStats.value = [];
        dailyContentStats.value = [];
        weeklyContentStats.value = [];
        monthlyContentStats.value = [];
        heatmapData.value = [];
        timeDistributionData.value = [];
        totalStats.value = {
            dailyMinutes: 0,
            weeklyMinutes: 0,
            monthlyMinutes: 0,
            totalHours: 0
        };
    }
};
// 组件挂载时获取数据
onMounted(() => {
    console.log('Statistics component mounted');
    fetchStats();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['statistics-container']} */ ;
/** @type {__VLS_StyleScopedClasses['statistics-container']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-message']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['peak-time-card']} */ ;
/** @type {__VLS_StyleScopedClasses['peak-time-card']} */ ;
/** @type {__VLS_StyleScopedClasses['peak-time-card']} */ ;
/** @type {__VLS_StyleScopedClasses['peak-time-card']} */ ;
/** @type {__VLS_StyleScopedClasses['charts-row']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-column']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['section-heading']} */ ;
/** @type {__VLS_StyleScopedClasses['habit-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['heatmap-container']} */ ;
/** @type {__VLS_StyleScopedClasses['content-card']} */ ;
/** @type {__VLS_StyleScopedClasses['quote-container']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['habits-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-column']} */ ;
/** @type {__VLS_StyleScopedClasses['content-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['stats-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['time-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['time-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-column']} */ ;
/** @type {__VLS_StyleScopedClasses['quote']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Statistics.vue.js.map