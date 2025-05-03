import { computed } from 'vue';
const props = defineProps();
/*  */
// 计算热力图数据
const heatmapData = computed(() => {
    // 获取当前日期
    const today = new Date();
    // 从后端获取的用户注册日期
    const userRegistrationDate = props.registrationDate
        ? new Date(props.registrationDate)
        : new Date(today.getFullYear() - 1, 0, 1); // 如果没有提供注册日期，默认使用去年1月1日
    // 使用用户注册日期作为起始日期
    const startDate = userRegistrationDate;
    // 结束日期为用户注册日期次年的3月31日
    const registrationYear = userRegistrationDate.getFullYear();
    const endDate = new Date(registrationYear + 1, 2, 31); // 注册年份的次年3月31日
    // 计算起始日期是星期几 (0 = 周日, 1 = 周一, ..., 6 = 周六)
    const firstDayOfWeek = startDate.getDay();
    // 调整起始日期，使其从所在周的周日开始
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(startDate.getDate() - firstDayOfWeek);
    // 创建日期映射
    const dateMap = new Map();
    props.data.forEach(item => {
        dateMap.set(item.date, item.value);
    });
    // 生成网格数据
    const grid = [];
    // 计算从起始日期到结束日期的总天数
    const totalDays = Math.ceil((endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // 填充所有日期，从调整后的起始日期到结束日期
    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(adjustedStartDate);
        currentDate.setDate(adjustedStartDate.getDate() + i);
        // 如果超过了结束日期，就停止
        if (currentDate > endDate) {
            break;
        }
        const dateStr = currentDate.toISOString().split('T')[0];
        const value = dateMap.get(dateStr) || 0;
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        // 只有在日期范围内的日期才显示值，范围外的显示为空白但保持网格结构
        const isInRange = (currentDate >= startDate && currentDate <= endDate);
        grid.push({
            date: dateStr,
            value: isInRange ? value : null,
            month: isInRange ? month : null,
            year
        });
    }
    return grid;
});
// 计算颜色强度
const getColor = (value) => {
    if (value === null)
        return 'transparent';
    if (value === 0)
        return '#ebedf0';
    // 使用更现代的蓝色渐变色调
    if (value < 30)
        return '#9be9ff';
    if (value < 60)
        return '#4fc3f7';
    if (value < 90)
        return '#2196f3';
    if (value < 120)
        return '#1976d2';
    return '#0d47a1';
};
// 格式化日期显示，使用中国时区
const formatDate = (dateStr) => {
    if (!dateStr)
        return '';
    // 创建一个新的Date对象
    const date = new Date(dateStr);
    // 获取UTC时间
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    // 调整为中国时区（UTC+8）
    const chinaDate = new Date(utcDate.getTime() + 8 * 60 * 60000);
    return `${chinaDate.getFullYear()}年${chinaDate.getMonth() + 1}月${chinaDate.getDate()}日`;
};
// 不再需要月份标签计算
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['heatmap-container']} */ ;
/** @type {__VLS_StyleScopedClasses['heatmap-container']} */ ;
/** @type {__VLS_StyleScopedClasses['heatmap-cell']} */ ;
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
//# sourceMappingURL=Heatmap.vue.js.map