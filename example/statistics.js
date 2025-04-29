// statistics.js
let charts = {
    time: null,
    duration: null,
    timeSlot: null,
    heatmap: null,
    category: null
};

// 核心初始化函数
function initStatistics() {
    // 确保DOM加载完成
    if (!document.getElementById('timeChart')) {
        setTimeout(initStatistics, 100);
        return;
    }

    // 绑定事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    window.addEventListener('storage', handleStorageUpdate);

    // 初始渲染
    updateCharts();
}

// 事件处理
function handleFilterClick(e) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    updateCharts();
}

function handleStorageUpdate() {
    updateCharts();
}

// 主更新函数
function updateCharts() {
    const tasks = loadValidTasks();
    const plans = loadPlans();
    const range = document.querySelector('.filter-btn.active').dataset.range;
    const filteredTasks = filterTasks(tasks, range);
    
    updateMetrics(filteredTasks);
    updatePlanCompletionRate(filteredTasks, plans);
    renderCharts(filteredTasks);
}

// 数据加载
function loadValidTasks() {
    try {
        const raw = localStorage.getItem('tasks') || '[]';
        const tasks = JSON.parse(raw);
        
        return tasks.filter(task => 
            task?.id &&
            typeof task?.name === 'string' &&
            Number.isInteger(task?.duration) &&
            task.duration > 0 &&
            !isNaN(new Date(task.end).getTime())
        );
    } catch (e) {
        console.error('数据加载失败:', e);
        return [];
    }
}

function loadPlans() {
    try {
        const raw = localStorage.getItem('plans') || '[]';
        const plans = JSON.parse(raw);
        return plans;
    } catch (e) {
        console.error('计划数据加载失败:', e);
        return [];
    }
}

// 数据过滤
function filterTasks(tasks, range) {
    const now = new Date();
    let startDate;

    switch(range) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0,0,0,0);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        default: // day
            startDate = new Date(now);
            startDate.setHours(0,0,0,0);
    }

    return tasks.filter(task => {
        const taskDate = new Date(task.end);
        return taskDate >= startDate;
    });
}

// 指标更新
function updateMetrics(tasks) {
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    const dayCount = new Set(tasks.map(t => new Date(t.end).toDateString())).size;

    document.getElementById('totalSessions').textContent = tasks.length;
    document.getElementById('totalHours').textContent = (totalDuration / 60).toFixed(1);
    document.getElementById('dailyAverage').textContent = dayCount > 0 
        ? (totalDuration / dayCount).toFixed(1) 
        : '0';

    updatePeakTime(tasks);
}

function updatePeakTime(tasks) {
    const hours = Array(24).fill(0);
    tasks.forEach(t => {
        const h = new Date(t.end).getHours();
        hours[h] += t.duration;
    });
    const peakHour = hours.indexOf(Math.max(...hours));
    document.getElementById('peakTime').textContent = 
        `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour+1).toString().padStart(2, '0')}:00`;
}

function updatePlanCompletionRate(tasks, plans) {
    const taskNames = tasks.map(task => task.name);
    const completedPlans = plans.filter(plan => taskNames.includes(plan.text)).length;
    const totalPlans = plans.length;

    const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;
    document.getElementById('planCompletionRate').textContent = `${completionRate.toFixed(1)}%`;
}

// 图表渲染
function renderCharts(tasks) {
    // 销毁旧图表
    if (charts.time) charts.time.destroy();
    if (charts.duration) charts.duration.destroy();
    if (charts.timeSlot) charts.timeSlot.destroy();
    if (charts.heatmap) charts.heatmap.destroy();
    if (charts.category) charts.category.destroy();

    // 渲染新图表
    renderTimeChart(tasks);
    renderDurationChart(tasks);
    renderTimeSlotChart(tasks);
    renderHeatmapChart(tasks);
    renderCategoryChart(tasks);
}

function renderTimeChart(tasks) {
    const ctx = document.getElementById('timeChart');
    const taskMap = new Map();

    tasks.forEach(task => {
        const key = task.name.trim().toLowerCase();
        taskMap.set(key, (taskMap.get(key) || 0) + task.duration);
    });

    charts.time = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Array.from(taskMap.keys()),
            datasets: [{
                data: Array.from(taskMap.values()),
                backgroundColor: generateColors(taskMap.size),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed}分钟`
                    }
                }
            }
        }
    });
}

function renderDurationChart(tasks) {
    const ctx = document.getElementById('durationChart');
    const data = {
        short: tasks.filter(t => t.duration <= 25).length,
        medium: tasks.filter(t => t.duration > 25 && t.duration <= 50).length,
        long: tasks.filter(t => t.duration > 50).length
    };

    charts.duration = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['短时 (≤25m)', '中时 (26-50m)', '长时 (>50m)'],
            datasets: [{
                label: '任务数量',
                data: [data.short, data.medium, data.long],
                backgroundColor: ['#3498db', '#2ecc71', '#9b59b6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderTimeSlotChart(tasks) {
    const ctx = document.getElementById('timeSlotChart');
    const data = {
        morning: tasks.filter(t => {
            const h = new Date(t.end).getHours();
            return h >= 5 && h < 12;
        }).length,
        afternoon: tasks.filter(t => {
            const h = new Date(t.end).getHours();
            return h >= 12 && h < 18;
        }).length,
        night: tasks.filter(t => {
            const h = new Date(t.end).getHours();
            return h >= 18 || h < 5;
        }).length
    };

    charts.timeSlot = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['早晨', '下午', '晚间'],
            datasets: [{
                data: [data.morning, data.afternoon, data.night],
                backgroundColor: ['#FFB347', '#77DD77', '#779ECB']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderHeatmapChart(tasks) {
    const ctx = document.getElementById('heatmapChart');
    
    // 创建24小时的时间段
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const heatmapData = hours.map(hour => ({
        x: hour,
        y: tasks.filter(t => new Date(t.end).getHours() === hour).length
    }));

    // 确保有数据再创建图表
    if (heatmapData && heatmapData.length > 0) {
        charts.heatmap = new Chart(ctx, {
            type: 'heatmap',
            data: {
                datasets: [{
                    label: '学习时段热力图',
                    data: heatmapData,
                    backgroundColor: function(context) {
                        const value = context.dataset.data[context.dataIndex].y;
                        const max = Math.max(...heatmapData.map(d => d.y)) || 1; // 防止除以零
                        const ratio = value / max;
                        return `rgba(46, 204, 113, ${ratio})`;
                    }
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 23,
                        title: {
                            display: true,
                            text: '小时'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: '学习次数'
                        }
                    }
                }
            }
        });
    } else {
        // 如果没有数据，可以显示一个提示信息
        const canvas = document.getElementById('heatmapChart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
    }
}

function renderCategoryChart(tasks) {
    const ctx = document.getElementById('categoryChart');
    const categoryMap = new Map();

    // 假设任务名称中包含分类信息，例如 "数学-复习"、"英语-阅读"
    // 如果任务名称中没有分类信息，则使用 "其他" 作为默认分类
    tasks.forEach(task => {
        const category = task.name.split('-')[0] || '其他';
        categoryMap.set(category, (categoryMap.get(category) || 0) + task.duration);
    });

    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from(categoryMap.keys()),
            datasets: [{
                label: '学习时长（分钟）',
                data: Array.from(categoryMap.values()),
                backgroundColor: generateColors(categoryMap.size)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// 工具函数
function generateColors(count) {
    const palette = ['#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22'];
    return Array.from({length: count}, (_, i) => palette[i % palette.length]);
}

// 启动
document.addEventListener('DOMContentLoaded', initStatistics);