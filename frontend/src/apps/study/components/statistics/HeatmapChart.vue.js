import { defineProps, computed, ref, onMounted, watch } from 'vue';
const props = defineProps();
// 获取标准化的日期字符串 YYYY-MM-DD（中国时区）
function getFormattedDate(date) {
    // 使用中国时区（UTC+8）
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// 获取当前中国时区的日期对象
function getNowInChinaTimezone() {
    const now = new Date();
    // 中国时区偏移量（+8小时）
    const chinaTimezoneOffset = 8 * 60 * 60 * 1000;
    // 获取当前时区偏移量
    const localTimezoneOffset = now.getTimezoneOffset() * 60 * 1000;
    // 调整为中国时区
    return new Date(now.getTime() + localTimezoneOffset + chinaTimezoneOffset);
}
// 创建今天的日期对象和日期字符串（中国时区）
const today = getNowInChinaTimezone();
const todayStr = getFormattedDate(today);
console.log('今日日期（中国时区）:', todayStr);
// 创建日期到值的映射
const dateMap = ref(new Map());
// 今日学习时间
const todayMinutes = computed(() => {
    if (!dateMap.value)
        return 0;
    return dateMap.value.get(todayStr) || 0;
});
// 处理数据并更新dateMap
function processData() {
    // 清空dateMap
    dateMap.value.clear();
    // 打印传入的热力图数据，用于调试
    console.log('Heatmap data received:', props.data);
    // 如果数据为空或不是数组，直接返回空映射
    if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
        console.log('热力图数据为空，不创建任何默认数据');
        return;
    }
    // 处理每一条数据
    props.data.forEach(item => {
        if (!item)
            return;
        // 尝试获取日期
        const dateStr = item.date || item.day || '';
        if (!dateStr)
            return;
        // 标准化日期格式
        let normalizedDateStr = dateStr;
        // 如果日期包含时间部分，只保留日期部分
        if (normalizedDateStr.includes('T')) {
            normalizedDateStr = normalizedDateStr.split('T')[0];
        }
        // 尝试标准化日期格式（确保是YYYY-MM-DD）
        try {
            const date = new Date(normalizedDateStr);
            if (!isNaN(date.getTime())) {
                // 如果是有效日期，转换为标准格式
                normalizedDateStr = date.toISOString().split('T')[0];
                // 获取持续时间
                const duration = parseInt(String(item.duration || item.time || item.count || '0'));
                // 确保时长至少为1分钟
                const validDuration = Math.max(isNaN(duration) ? 0 : duration, 1);
                // 更新该日期的学习时长
                if (validDuration > 0) {
                    const currentDuration = dateMap.value.get(normalizedDateStr) || 0;
                    dateMap.value.set(normalizedDateStr, currentDuration + validDuration);
                }
            }
        }
        catch (e) {
            console.error('Error parsing date:', dateStr, e);
        }
    });
    // 打印处理后的日期映射，用于调试
    console.log('Processed date map size:', dateMap.value.size);
    if (dateMap.value.size > 0) {
        // 打印前5个日期的数据
        const entries = Array.from(dateMap.value.entries()).slice(0, 5);
        console.log('Processed date map sample:', entries);
    }
}
// 打印今日学习时长，用于调试
console.log('Today\'s study duration:', dateMap.value.get(todayStr));
// 在组件挂载时处理数据
onMounted(() => {
    processData();
});
// 监听数据变化，重新处理数据
watch(() => props.data, () => {
    processData();
}, { deep: true });
// 热力图数据计算
const heatmapData = computed(() => {
    // 使用用户注册日期作为开始日期，没有则默认为一年前
    let startDate;
    if (props.registrationDate && props.registrationDate.trim()) {
        startDate = new Date(props.registrationDate);
        // 确保日期有效
        if (isNaN(startDate.getTime())) {
            // 默认为一年前
            startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 1);
        }
    }
    else {
        // 默认为一年前
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
    }
    console.log('热力图开始日期（注册日期）:', startDate.toISOString());
    // 设置结束日期为注册日期次年的3月31日
    const registrationYear = startDate.getFullYear();
    const endDate = new Date(registrationYear + 1, 2, 31); // 2表示3月（0-11）
    console.log('热力图结束日期（次年3月31日）:', endDate.toISOString());
    // 如果结束日期已经过去，使用今天作为结束日期
    if (endDate < today) {
        endDate.setTime(today.getTime());
        console.log('结束日期已过去，使用今天作为结束日期:', today.toISOString());
    }
    // 调整开始日期到所在周的周日
    const firstDayOfWeek = startDate.getDay(); // 0=周日, 1=周一, ...
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setDate(adjustedStartDate.getDate() - firstDayOfWeek);
    // 生成网格数据
    const grid = [];
    // 计算总天数
    const totalDays = Math.ceil((endDate.getTime() - adjustedStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    // 填充每一天的数据
    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(adjustedStartDate);
        currentDate.setDate(adjustedStartDate.getDate() + i);
        // 如果超过了结束日期，停止
        if (currentDate > endDate) {
            break;
        }
        const dateStr = getFormattedDate(currentDate);
        const isInRange = currentDate >= startDate && currentDate <= today;
        const isToday = dateStr === todayStr;
        // 从映射中获取值，如果没有则为0
        const value = dateMap.value.get(dateStr) || 0;
        grid.push({
            date: dateStr,
            value: isInRange ? value : null, // 只有在范围内的日期才显示值
            count: isInRange ? value : null, // 保持count字段与value一致
            month: currentDate.getMonth(),
            year: currentDate.getFullYear(),
            isToday: isToday
        });
    }
    return grid;
});
// 预处理格子数据，减少模板中的计算
const processedGridData = computed(() => {
    return heatmapData.value.map(day => {
        // 提取日期值
        const value = day.value !== null ? day.value : (day.count !== null ? day.count : 0);
        // 计算颜色
        const color = getColor(value);
        // 格式化标题
        const title = day.date ? `${formatDate(day.date)}: ${value}分钟` : '';
        return {
            ...day,
            color,
            title
        };
    });
});
// 根据值获取对应的颜色
function getColor(value) {
    // 如果传入的是对象，尝试提取value或count字段
    if (typeof value === 'object' && value !== null) {
        // 优先使用value字段，如果没有则使用count字段
        value = value.value !== undefined ? value.value : (value.count !== undefined ? value.count : null);
    }
    if (value === null || value === undefined) {
        return 'transparent'; // 范围外的日期显示为透明
    }
    // 确保是数字类型
    const numValue = Number(value);
    // 检查无效值或0值
    if (isNaN(numValue) || numValue <= 0) {
        return '#ebedf0'; // 默认灰色
    }
    // 根据值的大小返回不同深浅的蓝色
    if (numValue < 30)
        return '#9be9ff';
    if (numValue < 60)
        return '#4fc3f7';
    if (numValue < 120)
        return '#2196f3';
    if (numValue < 180)
        return '#1976d2';
    return '#0d47a1'; // 180以上使用最深的蓝色
}
// 格式化日期为中文格式
function formatDate(dateStr) {
    if (!dateStr)
        return '';
    try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
    catch (e) {
        return '';
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
//# sourceMappingURL=HeatmapChart.vue.js.map