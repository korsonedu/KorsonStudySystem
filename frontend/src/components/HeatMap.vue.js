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
    // 调整结束日期，确保包含完整的一周
    const lastDayOfWeek = endDate.getDay(); // 0 = 周日, 6 = 周六
    const daysToAdd = 6 - lastDayOfWeek;
    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setDate(endDate.getDate() + daysToAdd);
    // 创建日期映射
    const dateMap = new Map();
    props.data.forEach(item => {
        dateMap.set(item.date, item.value);
    });
    // 生成网格数据
    const grid = [];
    // 填充所有日期，从调整后的起始日期到调整后的结束日期
    let currentDate = new Date(adjustedStartDate);
    while (currentDate <= adjustedEndDate) {
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
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
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
// 格式化日期显示
const formatDate = (dateStr) => {
    if (!dateStr)
        return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
// 计算月份标签
const monthLabels = computed(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const labels = [];
    // 获取所有月份的第一天在网格中的位置
    const grid = heatmapData.value;
    if (!grid || grid.length === 0)
        return [];
    let currentMonth = -1;
    let currentYear = -1;
    let position = 0;
    grid.forEach((day, index) => {
        if (!day.date)
            return;
        const date = new Date(day.date);
        const month = date.getMonth();
        const year = date.getFullYear();
        // 如果是新的月份，添加标签
        if (month !== currentMonth || year !== currentYear) {
            // 计算位置（列索引）
            position = Math.floor(index / 7);
            labels.push({
                month: months[month],
                position
            });
            currentMonth = month;
            currentYear = year;
        }
    });
    return labels;
});
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
//# sourceMappingURL=HeatMap.vue.js.map