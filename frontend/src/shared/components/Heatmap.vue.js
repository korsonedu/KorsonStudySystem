import { computed } from 'vue';
const props = defineProps();
/*  */
// 计算热力图数据
const heatmapData = computed(() => {
    // 获取当前日期
    const today = new Date();
    // 从后端获取的用户注册日期
    let userRegistrationDate;
    // 检查是否有有效的注册日期
    if (props.registrationDate && props.registrationDate.trim() !== '') {
        try {
            userRegistrationDate = new Date(props.registrationDate);
            // 检查日期是否有效
            if (isNaN(userRegistrationDate.getTime())) {
                throw new Error('Invalid date');
            }
        }
        catch (e) {
            console.error('Error parsing registration date:', e);
            // 如果解析失败，使用当前日期的前一年作为默认值
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            userRegistrationDate = oneYearAgo;
        }
    }
    else {
        // 如果没有提供注册日期，使用当前日期的前一年作为默认值
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        userRegistrationDate = oneYearAgo;
    }
    console.log('Registration date (raw):', props.registrationDate);
    console.log('Parsed registration date:', userRegistrationDate);
    // 使用用户注册日期作为起始日期
    const startDate = userRegistrationDate;
    // 结束日期为用户注册日期次年的3月31日
    const registrationYear = userRegistrationDate.getFullYear();
    const endDate = new Date(registrationYear + 1, 2, 31); // 注册年份的次年3月31日
    console.log('Start date for heatmap:', startDate);
    console.log('End date for heatmap:', endDate);
    // 计算起始日期是星期几 (0 = 周日, 1 = 周一, ..., 6 = 周六)
    const firstDayOfWeek = startDate.getDay();
    // 调整起始日期，使其从所在周的周日开始
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(startDate.getDate() - firstDayOfWeek);
    // 创建日期映射
    const dateMap = new Map();
    console.log('Heatmap component received data:', props.data);
    console.log('Heatmap data length:', props.data.length);
    console.log('Registration date:', props.registrationDate);
    console.log('Start date:', startDate);
    console.log('End date:', endDate);
    // 确保数据是有效的
    console.log('Heatmap data type:', typeof props.data);
    console.log('Heatmap data:', JSON.stringify(props.data, null, 2));
    if (Array.isArray(props.data)) {
        console.log('Heatmap data is an array with length:', props.data.length);
        // 添加今天的数据用于测试
        const today = new Date().toISOString().split('T')[0];
        let hasTodayData = false;
        props.data.forEach(item => {
            if (item && item.date) {
                // 使用 value 字段，如果没有则使用 duration 或 count 字段
                const value = item.value !== undefined ? item.value :
                    (item.duration !== undefined ? item.duration :
                        (item.count !== undefined ? item.count :
                            (item.minutes !== undefined ? item.minutes : 0)));
                // 确保日期格式正确（YYYY-MM-DD）
                let dateStr = item.date;
                if (dateStr.includes('T')) {
                    dateStr = dateStr.split('T')[0];
                }
                // 检查是否有今天的数据
                if (dateStr === today) {
                    hasTodayData = true;
                    console.log(`Found today's data: ${value} minutes`);
                }
                dateMap.set(dateStr, value);
                console.log(`Added heatmap data: ${dateStr} -> ${value}`);
            }
        });
        // 如果没有今天的数据，添加一些测试数据
        if (!hasTodayData) {
            console.log('Adding test data for today');
            dateMap.set(today, 60); // 添加60分钟作为测试数据
        }
    }
    else {
        console.error('Heatmap data is not an array:', props.data);
        // 添加一些测试数据
        const today = new Date().toISOString().split('T')[0];
        console.log('Adding test data for today');
        dateMap.set(today, 60); // 添加60分钟作为测试数据
    }
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
        // 检查是否是今天的日期
        const isToday = dateStr === today.toISOString().split('T')[0];
        // 如果是今天，确保显示值
        if (isToday) {
            console.log(`Today's date: ${dateStr}, value: ${value}`);
            // 如果今天的值为0，尝试从任务数据中重新计算
            if (value === 0 && Array.isArray(props.data)) {
                // 查找今天的所有任务
                let todayTotal = 0;
                props.data.forEach(item => {
                    if (item && item.date) {
                        let itemDate = item.date;
                        if (itemDate.includes('T')) {
                            itemDate = itemDate.split('T')[0];
                        }
                        if (itemDate === dateStr) {
                            const itemValue = item.value !== undefined ? item.value :
                                (item.duration !== undefined ? item.duration :
                                    (item.count !== undefined ? item.count : 0));
                            todayTotal += itemValue;
                        }
                    }
                });
                if (todayTotal > 0) {
                    console.log(`Recalculated today's value: ${todayTotal}`);
                    grid.push({
                        date: dateStr,
                        value: isInRange ? todayTotal : null,
                        month: isInRange ? month : null,
                        year,
                        isToday: true
                    });
                    return;
                }
            }
        }
        grid.push({
            date: dateStr,
            value: isInRange ? value : null,
            month: isInRange ? month : null,
            year,
            isToday: isToday
        });
    }
    return grid;
});
// 计算颜色强度
const getColor = (value) => {
    if (value === null || value === undefined)
        return 'transparent';
    if (value === 0)
        return '#ebedf0';
    console.log(`Calculating color for value: ${value}`);
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
/** @type {__VLS_StyleScopedClasses['today-cell']} */ ;
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