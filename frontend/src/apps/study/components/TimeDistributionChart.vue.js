import { computed } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
// 注册Chart.js组件
ChartJS.register(ArcElement, Tooltip, Legend);
const props = defineProps();
// 准备图表数据
const chartData = computed(() => {
    // 将24小时分为4个时间段
    const morningHours = [6, 7, 8, 9, 10, 11];
    const afternoonHours = [12, 13, 14, 15, 16, 17];
    const eveningHours = [18, 19, 20, 21, 22, 23];
    const nightHours = [0, 1, 2, 3, 4, 5];
    // 计算每个时间段的总时长
    const morning = props.data
        .filter(item => morningHours.includes(item.hour))
        .reduce((sum, item) => sum + item.duration, 0);
    const afternoon = props.data
        .filter(item => afternoonHours.includes(item.hour))
        .reduce((sum, item) => sum + item.duration, 0);
    const evening = props.data
        .filter(item => eveningHours.includes(item.hour))
        .reduce((sum, item) => sum + item.duration, 0);
    const night = props.data
        .filter(item => nightHours.includes(item.hour))
        .reduce((sum, item) => sum + item.duration, 0);
    return {
        labels: ['早晨 (6-12点)', '下午 (12-18点)', '晚上 (18-24点)', '深夜 (0-6点)'],
        datasets: [
            {
                backgroundColor: [
                    '#FF9800', // 早晨 - 橙色
                    '#2196F3', // 下午 - 蓝色
                    '#673AB7', // 晚上 - 紫色
                    '#263238' // 深夜 - 深灰色
                ],
                borderColor: 'white',
                borderWidth: 2,
                hoverBackgroundColor: [
                    '#FF9800', // 早晨 - 橙色
                    '#2196F3', // 下午 - 蓝色
                    '#673AB7', // 晚上 - 紫色
                    '#263238' // 深夜 - 深灰色
                ],
                hoverBorderColor: 'white',
                hoverBorderWidth: 2,
                data: [morning, afternoon, evening, night]
            }
        ]
    };
});
// 图表配置
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%', // 设置为环形图
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
                color: '#424242'
            }
        },
        tooltip: {
            backgroundColor: 'white',
            titleColor: '#424242',
            bodyColor: '#212121',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            callbacks: {
                label: function (context) {
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${value} 分钟 (${percentage}%)`;
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['time-distribution-chart']} */ ;
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