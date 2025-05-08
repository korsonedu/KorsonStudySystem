/**
 * 统计数据处理工具函数
 */
/**
 * 过滤指定日期的数据
 * @param data 数据数组
 * @param dateStr 日期字符串 (YYYY-MM-DD)
 * @returns 过滤后的数据数组
 */
export const filterDataByDate = (data, dateStr) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }
    return data.filter((item) => {
        // 如果有日期字段，检查是否是指定日期
        if (item.date) {
            return item.date.startsWith(dateStr);
        }
        // 如果没有日期字段，不包含在过滤结果中
        return false;
    });
};
/**
 * 创建24小时的空数据数组
 * @param dateStr 日期字符串 (YYYY-MM-DD)
 * @returns 24小时的空数据数组
 */
export const createEmptyHourlyData = (dateStr) => {
    return new Array(24).fill(0).map((_, index) => ({
        hour: index,
        time: `${index}:00`,
        duration: 0,
        count: 0,
        date: dateStr
    }));
};
/**
 * 从任务数据生成热力图数据
 * @param tasks 任务数据数组
 * @returns 热力图数据数组
 */
export const generateHeatmapFromTasks = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) {
        console.log('No tasks data for heatmap');
        return [];
    }
    console.log('Generating heatmap from', tasks.length, 'tasks');
    // 创建日期到时长的映射
    const dateToMinutes = new Map();
    // 获取今天的日期字符串
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
    // 查找今日的任务
    const todayTasks = tasks.filter(task => {
        if (!task.start)
            return false;
        let startDate = '';
        if (typeof task.start === 'string') {
            startDate = task.start;
        }
        else if (task.date) {
            startDate = typeof task.date === 'string' ? task.date : '';
        }
        if (startDate && startDate.includes('T')) {
            startDate = startDate.split('T')[0];
        }
        return startDate === todayStr;
    });
    // 计算今日总时长
    let todayDuration = 0;
    todayTasks.forEach(task => {
        if (task.duration) {
            todayDuration += Number(task.duration);
        }
    });
    // 确保今天的日期存在于映射中，使用计算出的时长或默认为0
    dateToMinutes.set(todayStr, todayDuration);
    // 处理任务数据
    tasks.forEach((task) => {
        // 尝试从不同字段获取日期和时长
        let startDate = '';
        let duration = 0;
        // 获取日期
        if (task.start) {
            startDate = typeof task.start === 'string' ? task.start : '';
        }
        else if (task.date) {
            startDate = typeof task.date === 'string' ? task.date : '';
        }
        else if (task.created_at) {
            startDate = typeof task.created_at === 'string' ? task.created_at : '';
        }
        else if (task.createdAt) {
            startDate = typeof task.createdAt === 'string' ? task.createdAt : '';
        }
        // 提取日期部分
        if (startDate && startDate.includes('T')) {
            startDate = startDate.split('T')[0];
        }
        // 如果没有有效的日期，跳过
        if (!startDate) {
            return;
        }
        // 获取时长
        if (typeof task.duration === 'number') {
            duration = task.duration;
        }
        else if (typeof task.minutes === 'number') {
            duration = task.minutes;
        }
        else if (typeof task.time === 'number') {
            duration = task.time;
        }
        else {
            // 尝试转换为数字
            duration = Number(task.duration || task.minutes || task.time || 0);
            if (isNaN(duration))
                duration = 0;
        }
        // 累加该日期的时长
        if (dateToMinutes.has(startDate)) {
            dateToMinutes.set(startDate, dateToMinutes.get(startDate) + duration);
        }
        else {
            dateToMinutes.set(startDate, duration);
        }
    });
    // 将映射转换为热力图数据格式
    const heatmapData = [];
    dateToMinutes.forEach((value, date) => {
        // 同时设置count和value字段，确保两者一致
        heatmapData.push({
            date,
            count: value,
            value: value // 添加value字段，与count保持一致
        });
    });
    console.log('Generated heatmap data:', heatmapData.length, 'days with data');
    console.log('Today\'s data:', dateToMinutes.get(todayStr) || 0, 'minutes');
    // 打印今日数据，帮助调试
    const todayData = heatmapData.find(item => item.date === todayStr);
    if (todayData) {
        console.log('Today\'s heatmap data:', todayData);
    }
    else {
        console.log('Today\'s data not found in heatmap data');
    }
    // 确保今日数据存在且正确
    if (todayData) {
        // 确保count和value字段一致
        if (todayData.count !== todayData.value) {
            console.log('Fixing inconsistent today\'s data:', todayData);
            todayData.value = todayData.count;
        }
    }
    else {
        // 如果今日数据不存在，添加一个
        const todayDuration = dateToMinutes.get(todayStr) || 0;
        heatmapData.push({
            date: todayStr,
            count: todayDuration,
            value: todayDuration
        });
        console.log('Added missing today\'s data:', todayDuration, 'minutes');
    }
    // 打印一些示例数据，帮助调试
    if (heatmapData.length > 0) {
        console.log('Sample heatmap data:', heatmapData.slice(0, 5));
    }
    return heatmapData;
};
/**
 * 生成随机颜色
 * @param count 颜色数量
 * @returns 颜色数组
 */
export const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 137) % 360; // 使用黄金角分布获取不同的色相
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    return colors;
};
/**
 * 处理内容统计数据
 * @param contentStats 内容统计数据数组
 * @returns 处理后的内容统计数据数组
 */
export const processContentStats = (contentStats) => {
    if (!Array.isArray(contentStats) || contentStats.length === 0) {
        return [];
    }
    // 处理数据，确保有name和duration字段
    const processedStats = contentStats.map((item) => {
        return {
            name: item.name || item.category || item.content || '未分类',
            duration: item.duration || item.value || item.count || 0
        };
    });
    // 过滤掉duration为0的项
    return processedStats.filter((item) => item.duration > 0);
};
/**
 * 获取图表配置
 */
export const getChartOptions = () => {
    return {
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
};
/**
 * 获取内容图表配置
 */
export const getContentChartOptions = () => {
    return {
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
};
//# sourceMappingURL=StatisticsUtils.js.map