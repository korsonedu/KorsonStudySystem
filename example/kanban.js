let timer;
let isRunning = false;
let timeLeft;
let originalDuration = 0;
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM Elements
const timerDisplay = document.getElementById('timer');
const startPauseBtn = document.getElementById('startPauseBtn');
const completeBtn = document.getElementById('completeBtn');
const resetBtn = document.getElementById('resetBtn');
const taskNameInput = document.getElementById('taskName');
const taskTimeInput = document.getElementById('taskTime');
let taskRecords; // 改为let声明

document.addEventListener('DOMContentLoaded', () => {
    taskRecords = document.getElementById('taskRecords');
    init();
});

function updateTimeStatistics() {
    const now = new Date();
    const today = now.toDateString();
    
    // 计算今日时长
    const dailyTotal = tasks
        .filter(task => new Date(task.end).toDateString() === today)
        .reduce((sum, task) => sum + task.duration, 0);

    // 计算总时长（单位：小时）
    const totalHours = tasks
        .reduce((sum, task) => sum + task.duration, 0) / 60;

    // 更新DOM
    document.getElementById('dailyTotal').textContent = dailyTotal;
    document.getElementById('totalTime').textContent = totalHours.toFixed(1);
}

function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        const taskName = taskNameInput.value.trim();
        const minutes = parseInt(taskTimeInput.value);

        // 新增输入验证
        if (!taskName) {
            alert('请填写学习任务名称');
            taskNameInput.focus();
            return;
        }
        if (isNaN(minutes) || minutes < 1) {
            alert('请输入有效的任务时间（至少1分钟）');
            taskTimeInput.focus();
            return;
        }

        if (timeLeft === undefined) {
            originalDuration = minutes * 60;
            timeLeft = originalDuration;
        }

        // 禁用输入框（新增）
        taskNameInput.disabled = true;
        taskTimeInput.disabled = true;

        isRunning = true;
        startPauseBtn.textContent = '⏸ 暂停';
        completeBtn.disabled = false;

        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timer);
                isRunning = false;
                completeTask(true);
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isRunning = false;
        startPauseBtn.textContent = '▶️ 继续';
    }
}

class AchievementNotifier {
    constructor() {
        this.unlockedHistory = JSON.parse(localStorage.getItem('unlockedHistory')) || [];
    }

    showToast(title, level) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <span class="emoji">🎉</span>
            <div class="toast-content">
                <div class="toast-title">${title} Lv.${level}</div>
                <div class="toast-desc">新成就解锁！</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showFirstTimePopup(title, level) {
        if (!this.unlockedHistory.includes(`${title}-${level}`)) {
            Swal.fire({
                title: '新成就解锁!',
                html: `<h3>${title} Lv.${level}</h3>
                       <p>你已达成新的成就等级！</p>`,
                icon: 'success'
            });
            this.unlockedHistory.push(`${title}-${level}`);
            localStorage.setItem('unlockedHistory', JSON.stringify(this.unlockedHistory));
        }
    }
}

function completeTask(autoComplete = false) {
    if (!autoComplete && !confirm('确定要提前结束当前任务吗？')) return;

    const taskName = taskNameInput.value.trim();
    const actualMinutes = Math.max(1, Math.ceil((originalDuration - timeLeft) / 60));

    if (taskName && actualMinutes > 0) {
        addTaskRecord(taskName, actualMinutes);
        updateStatistics();
    }
    resetTimer(true); // 添加完成标记
    updateTimeStatistics(); // 更新统计信息
    triggerAchievementCheck();
    
    const notifier = new AchievementNotifier();
    notifier.showToast('入门学者', 1);
    notifier.showFirstTimePopup('入门学者', 1);
}

// 修改后的重置函数
function resetTimer(isCompleted = false) {
    clearInterval(timer);
    isRunning = false;
    
    // 仅当不是完成任务时清空输入
    if (!isCompleted) {
        taskNameInput.value = '';
        taskTimeInput.value = '25';
    }

    // 关键修复：重置时间状态
    timeLeft = undefined;
    originalDuration = 0;

    // 恢复界面状态
    taskNameInput.disabled = false;
    taskTimeInput.disabled = false;
    updateTimerDisplay(25 * 60); // 显示初始25分钟
    startPauseBtn.textContent = '▶️ 开始';
    completeBtn.disabled = true;
}

function createTaskHTML(task) {
    const start = new Date(task.start);
    const end = new Date(task.end);
    
    return `
        <div class="record-grid">
            <span class="task-name">${task.name}</span>
            <span class="task-duration">${task.duration}分钟</span>
            <span class="time-range">
                ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} -
                ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span class="task-date">
                ${end.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
            </span>
            <button class="delete-btn" aria-label="删除任务">🗑️</button>
        </div>
    `;
}

function addTaskRecord(taskName, duration) {
    const now = new Date();
    const newTask = {
        id: Date.now(),
        name: taskName,
        duration: duration,
        start: new Date(now - duration * 60000).toISOString(),
        end: now.toISOString()
    };

    // 将新任务添加到数组开头
    tasks.unshift(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));

    // 创建列表元素
    const li = document.createElement('li');
    li.className = 'task-record';
    li.dataset.taskId = newTask.id;
    li.innerHTML = createTaskHTML(newTask);

    const taskRecords = document.getElementById('taskRecords');
    if (taskRecords.children.length > 0) {
        taskRecords.insertBefore(li, taskRecords.firstChild);
    } else {
        taskRecords.appendChild(li);
    }

    // 关键修复2：增强删除功能
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== newTask.id);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        
        // 触发全局更新
        window.dispatchEvent(new Event('storage'));
        if (typeof updateCharts === 'function') updateCharts();
        
        li.remove();
        updateTimeStatistics(); // 新增统计更新
    });

    // 触发 storage 事件以更新统计页面
    window.dispatchEvent(new Event('storage'));
}

function updateStatistics() {
    if (window.updateCharts) {
        window.updateCharts();
    }
}

function triggerAchievementCheck() {
    const manager = new AchievementManager();
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    manager.check(tasks);
}

function init() {
    const taskRecords = document.getElementById('taskRecords');
    taskRecords.innerHTML = ''; // 清空现有内容
    
    // 按时间倒序排列
    tasks.sort((a, b) => new Date(b.end) - new Date(a.end))
         .slice(0, 10)
         .forEach(task => {
             const li = document.createElement('li');
             li.className = 'task-record';
             li.dataset.taskId = task.id;
             li.innerHTML = createTaskHTML(task);

             const deleteBtn = li.querySelector('.delete-btn');
             deleteBtn.addEventListener('click', () => {
                 tasks = tasks.filter(t => t.id !== task.id);
                 localStorage.setItem('tasks', JSON.stringify(tasks));
                 window.dispatchEvent(new Event('storage'));
                 li.remove();
                 updateTimeStatistics();
             });

             taskRecords.appendChild(li);
         });

    updateTimeStatistics();
}

// 事件监听
startPauseBtn.addEventListener('click', startTimer);
completeBtn.addEventListener('click', () => completeTask());
resetBtn.addEventListener('click', () => resetTimer());