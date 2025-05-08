import { computed } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
// 注册ChartJS组件
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);
const props = defineProps();
// 图表数据
const chartData = computed(() => {
    let labels = [];
    let data = [];
    console.log('Current view in TimeDistributionChart:', props.currentView);
    console.log('Hourly stats:', props.hourlyStats);
    console.log('Weekly stats:', props.weeklyStats);
    console.log('Monthly stats:', props.monthlyStats);
    if (props.currentView === 'daily') {
        // 创建24小时的标签和数据数组
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const hourlyData = Array(24).fill(0);
        // 填充小时数据
        if (Array.isArray(props.hourlyStats) && props.hourlyStats.length > 0) {
            props.hourlyStats.forEach(item => {
                const hour = item.hour;
                if (hour >= 0 && hour < 24) {
                    hourlyData[hour] = item.duration;
                }
            });
        }
        labels = hours;
        data = hourlyData;
    }
    else if (props.currentView === 'weekly') {
        // 默认周数据 - 中国习惯，周一到周日
        const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const weeklyData = Array(7).fill(0);
        // 使用每周数据
        if (Array.isArray(props.weeklyStats) && props.weeklyStats.length > 0) {
            // 创建一个映射，用于存储每天的学习时长
            const dayMap = new Map();
            weekDays.forEach((day, index) => dayMap.set(day, index));
            props.weeklyStats.forEach(item => {
                const dayIndex = dayMap.get(item.day);
                if (dayIndex !== undefined) {
                    weeklyData[dayIndex] = item.duration;
                }
            });
        }
        labels = weekDays;
        data = weeklyData;
    }
    else {
        // 默认月数据
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthDays = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
        const monthlyData = Array(daysInMonth).fill(0);
        // 使用每月数据
        if (Array.isArray(props.monthlyStats) && props.monthlyStats.length > 0) {
            // 创建一个映射，用于存储每天的学习时长
            const dayMap = new Map();
            monthDays.forEach((day, index) => dayMap.set(day, index));
            props.monthlyStats.forEach(item => {
                // 尝试提取日期数字
                let dayText = item.day;
                if (!dayText.includes('日')) {
                    const dayNumber = parseInt(dayText);
                    if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
                        dayText = `${dayNumber}日`;
                    }
                }
                const dayIndex = dayMap.get(dayText);
                if (dayIndex !== undefined) {
                    monthlyData[dayIndex] = item.duration;
                }
            });
        }
        labels = monthDays;
        data = monthlyData;
    }
    console.log('Chart labels:', labels);
    console.log('Chart data:', data);
    // 确保数据是数字类型
    const numericData = data.map(val => typeof val === 'number' ? val : 0);
    return {
        labels,
        datasets: [
            {
                label: '学习时长 (分钟)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                data: numericData
            }
        ]
    };
});
// 图表配置
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        y: {
            beginAtZero: true
        }
    },
    layout: {
        padding: 10
    },
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    }
};
// 检查是否有数据
const hasData = computed(() => {
    return chartData.value.datasets[0].data.some(val => val > 0);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=TimeDistributionChart.vue.js.map