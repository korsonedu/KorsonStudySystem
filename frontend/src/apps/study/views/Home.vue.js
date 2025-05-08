import { ref, onMounted, computed, watch } from 'vue';
import { taskService } from '../../../shared/services/taskService';
import { planService } from '../../../shared/services/planService';
import { toChineseTimezone } from '../../../utils/dateUtils';
import { getPlanId, sortPlansByCompletionAndDate, filterTodayPlans } from '../../../shared/utils/sortUtils';
// State for Pomodoro timer
const taskName = ref('');
const taskTime = ref(25);
const isRunning = ref(false);
const totalSeconds = ref(25 * 60);
const buttonText = computed(() => isRunning.value ? '⏸️ 暂停' : '▶️ 开始');
// 监听taskTime的变化，实时更新时钟显示
watch(taskTime, (newValue) => {
    // 只在有值且不在运行状态时更新时钟
    if (newValue && !isRunning.value) {
        // 限制最大值为120分钟
        if (newValue > 120)
            taskTime.value = 120;
        totalSeconds.value = taskTime.value * 60;
    }
    else if (!newValue && !isRunning.value) {
        // 当输入框为空时，显示0分钟
        totalSeconds.value = 0;
    }
});
// Task records
const taskRecords = ref([]);
const dailyTotal = ref(0);
const totalHours = ref(0);
const error = ref('');
// Plans
const plans = ref([]);
const planInput = ref('');
const planError = ref('');
// 确认对话框状态
const showConfirmDialog = ref(false);
const confirmDialogTitle = ref('确认');
const confirmDialogMessage = ref('');
const confirmDialogCallback = ref(() => { });
// 拖拽功能
const handleDragStart = (event, plan) => {
    if (!event.dataTransfer)
        return;
    // 设置拖拽数据 - 传递计划文本
    event.dataTransfer.setData('text/plain', plan.text || plan.title || '');
    // 传递计划ID，以便在完成任务时更新计划状态
    const planId = getPlanId(plan);
    if (planId) {
        event.dataTransfer.setData('application/plan-id', planId.toString());
    }
    event.dataTransfer.effectAllowed = 'copy';
    // 添加视觉反馈
    if (event.target instanceof HTMLElement) {
        event.target.classList.add('dragging');
    }
    // 拖拽开始
};
const handleDragEnd = (event) => {
    // 移除视觉反馈
    if (event.target instanceof HTMLElement) {
        event.target.classList.remove('dragging');
    }
};
const handleDragOver = (event) => {
    // 允许放置
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
    }
    // 添加视觉反馈
    if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.add('drag-over');
    }
};
const handleDragLeave = (event) => {
    // 移除视觉反馈
    if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.remove('drag-over');
    }
};
// 创建一个引用来存储当前拖拽的计划ID
const currentDraggedPlanId = ref(null);
const handleDrop = (event) => {
    event.preventDefault();
    // 移除视觉反馈
    if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.classList.remove('drag-over');
    }
    // 获取拖拽数据
    if (!event.dataTransfer)
        return;
    const planText = event.dataTransfer.getData('text/plain');
    if (!planText)
        return;
    // 获取计划ID
    const planId = event.dataTransfer.getData('application/plan-id');
    if (planId) {
        currentDraggedPlanId.value = planId;
    }
    else {
        currentDraggedPlanId.value = null;
    }
    // 设置任务名称
    taskName.value = planText;
};
// 记录实际开始时间
const taskStartTime = ref(null);
// 开始/暂停计时器
const toggleTimer = () => {
    // 如果当前未运行，且要开始计时，需要检查时间是否有效
    if (!isRunning.value) {
        // 检查是否设置了有效的时间
        if (!taskTime.value || taskTime.value <= 0) {
            alert('请设置有效的专注时长');
            return;
        }
        // 确保时间不超过120分钟
        if (taskTime.value > 120) {
            taskTime.value = 120;
        }
        // 更新总秒数
        totalSeconds.value = taskTime.value * 60;
        // 记录开始时间
        taskStartTime.value = new Date();
        // 切换运行状态
        isRunning.value = true;
    }
    else {
        // 暂停计时
        isRunning.value = false;
    }
};
// Reset timer - 简化版本，使用CircularTimer组件处理计时逻辑
const resetTimer = () => {
    // 停止计时器
    isRunning.value = false;
    // 清空任务名称
    taskName.value = '';
    // 重置开始时间
    taskStartTime.value = null;
    // 重置为默认25分钟
    taskTime.value = 25;
    totalSeconds.value = taskTime.value * 60;
};
// 完成当前任务
const completeTask = async () => {
    // 检查任务名称
    if (taskName.value.trim() === '') {
        return;
    }
    // 显示自定义确认对话框
    confirmDialogTitle.value = '完成学习任务';
    confirmDialogMessage.value = `确定要结束"${taskName.value}"任务吗？`;
    // 设置确认回调函数
    confirmDialogCallback.value = async () => {
        // 停止计时器
        isRunning.value = false;
        // 隐藏对话框
        showConfirmDialog.value = false;
        // 继续执行保存任务的逻辑
        await saveCompletedTask();
    };
    // 显示对话框
    showConfirmDialog.value = true;
};
// 保存已完成的任务
const saveCompletedTask = async () => {
    try {
        // 不设置加载状态，提升界面流畅感
        error.value = '';
        // 获取当前时间作为结束时间（中国时区）
        const now = new Date();
        // 转换为中国时区
        const currentTime = toChineseTimezone(now);
        // 使用实际开始时间，如果没有则使用当前时间
        let startTime;
        if (taskStartTime.value) {
            // 转换为中国时区
            startTime = toChineseTimezone(taskStartTime.value);
        }
        else {
            startTime = currentTime;
        }
        // 任务开始和结束时间已设置为中国时区
        // 计算实际时长（从开始到结束的分钟数）
        let taskDuration = taskTime.value; // 默认使用设置的时长
        // 如果有开始时间，计算实际时长
        if (taskStartTime.value) {
            // 计算实际时长（毫秒）
            const durationMs = currentTime.getTime() - startTime.getTime();
            // 转换为分钟并四舍五入
            const actualDuration = Math.round(durationMs / 60000);
            // 使用实际时长，但确保至少为1分钟
            taskDuration = Math.max(actualDuration, 1);
        }
        else {
            // 确保默认时长至少为1分钟
            taskDuration = Math.max(taskDuration, 1);
        }
        // 确保任务时长至少为1分钟
        // 将日期格式化为ISO格式字符串（不带时区信息）
        const formatDateForBackend = (date) => {
            // 确保日期是中国时区
            const chinaDate = toChineseTimezone(date);
            // 获取年月日时分秒
            const year = chinaDate.getFullYear();
            const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
            const day = String(chinaDate.getDate()).padStart(2, '0');
            const hours = String(chinaDate.getHours()).padStart(2, '0');
            const minutes = String(chinaDate.getMinutes()).padStart(2, '0');
            const seconds = String(chinaDate.getSeconds()).padStart(2, '0');
            // 返回格式化的日期时间字符串（不带时区信息）
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };
        // 确保任务数据符合后端API要求
        const newTask = {
            name: taskName.value,
            duration: taskDuration, // 使用计算出的实际时长
            completed: true,
            start: formatDateForBackend(startTime),
            end: formatDateForBackend(currentTime)
            // 不指定用户ID，由后端根据token自动关联当前用户
        };
        // 使用直接API存储服务保存任务
        const savedTask = await taskService.addTask(newTask);
        // 刷新任务列表
        await fetchTasks();
        // 如果有对应的计划ID，将该计划标记为已完成
        if (currentDraggedPlanId.value) {
            // 更新对应计划的状态
            // 查找对应的计划
            const planToUpdate = plans.value.find(plan => {
                const planId = getPlanId(plan);
                return planId && planId.toString() === currentDraggedPlanId.value?.toString();
            });
            if (planToUpdate && !planToUpdate.completed) {
                // 找到要更新的计划
                // 调用togglePlan方法将计划标记为已完成
                await togglePlan(planToUpdate);
                // 计划已标记为完成
            }
            else if (planToUpdate) {
                // 计划已经完成，无需更新
            }
            else {
                // 找不到指定ID的计划
            }
            // 重置当前拖拽的计划ID
            currentDraggedPlanId.value = null;
        }
        // Reset for next task
        resetTimer();
        taskName.value = '';
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('完成任务失败');
        }
        // 只在控制台输出错误，不显示错误消息
        // 重置当前拖拽的计划ID
        currentDraggedPlanId.value = null;
    }
};
// 由于已经添加了watch监听器，这个函数已不再需要
// 删除冗余函数
// 获取任务列表
const fetchTasks = async () => {
    try {
        error.value = '';
        // 获取今日任务列表
        const todayTasks = await taskService.getTodayTasks();
        taskRecords.value = todayTasks;
        // 今日任务获取成功
        // 获取统计信息
        try {
            const dailyStats = await taskService.getDailyStats();
            const totalStats = await taskService.getTotalStats();
            dailyTotal.value = dailyStats?.duration || 0;
            totalHours.value = totalStats?.hours || 0;
        }
        catch (statsErr) {
            dailyTotal.value = 0;
            totalHours.value = 0;
        }
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取今日任务失败');
        }
        taskRecords.value = [];
        dailyTotal.value = 0;
        totalHours.value = 0;
    }
};
// 获取计划列表
const fetchPlans = async () => {
    try {
        planError.value = '';
        // 获取所有计划
        const plansData = await planService.getAllPlans();
        // 过滤今天的计划并排序
        const todayPlans = filterTodayPlans(plansData);
        const sortedPlans = sortPlansByCompletionAndDate(todayPlans);
        plans.value = sortedPlans;
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('获取计划失败');
        }
        plans.value = [];
    }
};
// 添加新计划
const addPlan = async () => {
    if (planInput.value.trim() === '') {
        return;
    }
    try {
        planError.value = '';
        // 获取当前时间（中国时区）
        const now = new Date();
        const chinaTime = toChineseTimezone(now);
        // 格式化日期为ISO格式字符串（不带时区信息）
        const formatDateForBackend = (date) => {
            // 确保日期是中国时区
            const chinaDate = toChineseTimezone(date);
            // 获取年月日时分秒
            const year = chinaDate.getFullYear();
            const month = String(chinaDate.getMonth() + 1).padStart(2, '0');
            const day = String(chinaDate.getDate()).padStart(2, '0');
            const hours = String(chinaDate.getHours()).padStart(2, '0');
            const minutes = String(chinaDate.getMinutes()).padStart(2, '0');
            const seconds = String(chinaDate.getSeconds()).padStart(2, '0');
            // 返回格式化的日期时间字符串（不带时区信息）
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };
        // 创建新计划对象
        const newPlan = {
            text: planInput.value,
            completed: false,
            started: false,
            createdAt: formatDateForBackend(chinaTime)
        };
        // 添加计划
        const createdPlan = await planService.addPlan(newPlan);
        // 清空输入框
        planInput.value = '';
        // 重新获取计划列表
        fetchPlans();
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('添加计划失败');
        }
        fetchPlans();
    }
};
// 切换计划完成状态
const togglePlan = async (plan) => {
    try {
        planError.value = '';
        // 获取计划ID
        const planId = getPlanId(plan);
        if (!planId) {
            return;
        }
        // 创建更新后的计划对象
        const updatedPlan = {
            text: plan.text || plan.title || '',
            completed: !plan.completed,
            started: plan.started || false
        };
        // 更新计划
        await planService.updatePlan(planId, updatedPlan);
        // 在前端更新状态并重新排序
        const planIndex = plans.value.findIndex(p => getPlanId(p) === planId);
        if (planIndex !== -1) {
            plans.value[planIndex].completed = !plan.completed;
            plans.value = sortPlansByCompletionAndDate(plans.value);
        }
        // 重新获取计划列表
        fetchPlans();
    }
    catch (err) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('更新计划失败');
        }
        fetchPlans();
    }
};
// 删除计划
const deletePlan = async (planId) => {
    if (!planId) {
        return;
    }
    // 显示确认对话框
    confirmDialogTitle.value = '删除计划';
    confirmDialogMessage.value = '确定要删除这个学习计划吗？';
    // 设置确认回调函数
    confirmDialogCallback.value = async () => {
        try {
            planError.value = '';
            // 删除计划
            await planService.deletePlan(planId);
            // 重新加载计划列表
            await fetchPlans();
            // 隐藏对话框
            showConfirmDialog.value = false;
        }
        catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('删除计划失败');
            }
            showConfirmDialog.value = false;
        }
    };
    // 显示对话框
    showConfirmDialog.value = true;
};
// 删除任务
const deleteTask = async (taskId) => {
    // 显示确认对话框
    confirmDialogTitle.value = '删除学习记录';
    confirmDialogMessage.value = '确定要删除这条学习记录吗？';
    // 设置确认回调函数
    confirmDialogCallback.value = async () => {
        try {
            error.value = '';
            // 删除任务
            await taskService.deleteTask(taskId);
            // 重新加载任务列表
            await fetchTasks();
            // 隐藏对话框
            showConfirmDialog.value = false;
        }
        catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('删除任务失败');
            }
            showConfirmDialog.value = false;
        }
    };
    // 显示对话框
    showConfirmDialog.value = true;
};
// 组件挂载时获取数据
onMounted(() => {
    fetchTasks();
    fetchPlans();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-over']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-content']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['list-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-date']} */ ;
/** @type {__VLS_StyleScopedClasses['task-date']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-task-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['debug-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['debug-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['debug-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['debug-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-control']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-control']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-control']} */ ;
/** @type {__VLS_StyleScopedClasses['add-plan-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-plan-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['plus-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['add-plan-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['plus-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['add-plan-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-checkbox-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-text']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-status']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['completed']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['completed']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['completed']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-text']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['completed']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['test-api-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['api-test-link']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-plans-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-plans-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['check-api-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['check-api-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-message']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-message']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-message']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-main']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['study-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['task-group']} */ ;
/** @type {__VLS_StyleScopedClasses['time-group']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-details']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-details']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['study-tips']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['list-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
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
//# sourceMappingURL=Home.vue.js.map