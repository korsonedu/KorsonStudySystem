import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
// 使用直接API存储服务
// @ts-ignore
import { taskService } from '../../../shared/services/taskService';
// @ts-ignore
import { planService } from '../../../shared/services/planService';
// @ts-ignore
import { userService } from '../../../shared/services/userService';
import { STORAGE_CONFIG, SERVER_CONFIG } from '../../../config';
// @ts-ignore
import { getPlanId, sortPlansByCompletionAndDate, filterTodayPlans } from '../../../shared/utils/sortUtils';
// @ts-ignore
import { executeWithRetry } from '../../../shared/utils/errorUtils';
// State for Pomodoro timer
const taskName = ref('');
const taskTime = ref(25);
const timer = ref('25:00');
const isRunning = ref(false);
const intervalId = ref(null);
const totalSeconds = ref(25 * 60);
const buttonText = computed(() => isRunning.value ? '⏸️ 暂停' : '▶️ 开始');
// 检查当前用户是否是 testuser
const isTestUser = computed(() => {
    return userService.currentUser.value?.username === 'testuser';
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
// 调试模式 - 只对 testuser 可见
const debugMode = ref(false);
const toggleDebugMode = () => {
    // 使用计算属性检查是否是 testuser
    if (!isTestUser.value) {
        console.warn('Debug mode is only available for testuser');
        return;
    }
    debugMode.value = !debugMode.value;
    if (debugMode.value) {
        // 当开启调试模式时，显示更多信息
        updateCurrentUser();
        console.log('Debug mode enabled');
    }
};
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
    console.log('Drag started with plan:', plan, 'ID:', planId);
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
        console.log('Stored dragged plan ID:', planId);
    }
    else {
        currentDraggedPlanId.value = null;
    }
    // 设置任务名称
    taskName.value = planText;
    console.log('Plan dropped into task input:', planText, 'with ID:', planId);
};
// 当前用户信息
const currentUser = ref('');
const tokenInfo = ref('');
const apiStatus = ref('');
const updateCurrentUser = () => {
    const username = localStorage.getItem(STORAGE_CONFIG.USERNAME_KEY);
    const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
    currentUser.value = username || '未登录';
    tokenInfo.value = token ? `${token.substring(0, 15)}...` : '无令牌';
    console.log('Current user:', username, 'Has token:', !!token);
    if (token) {
        console.log('Token preview:', token.substring(0, 20) + '...');
    }
};
// 检查可用的API端点 - 仅供调试使用
const checkAPIEndpoints = async () => {
    if (!isTestUser.value)
        return;
    planError.value = '检查API端点中...';
    try {
        // 使用配置文件中的服务器配置
        const backendUrl = SERVER_CONFIG.BACKEND.URL;
        // 尝试主要API端点
        const endpoints = [
            '/api/tasks',
            '/api/plans',
            '/api/auth/me'
        ];
        let foundEndpoints = [];
        for (const endpoint of endpoints) {
            try {
                planError.value = `测试端点: ${endpoint}...`;
                const response = await fetch(endpoint);
                foundEndpoints.push({
                    url: endpoint,
                    status: response.status,
                    statusText: response.statusText
                });
            }
            catch (err) {
                console.error(`Error checking endpoint ${endpoint}:`, err);
            }
        }
        if (foundEndpoints.length > 0) {
            planError.value = `API端点状态:\n${foundEndpoints.map(e => `${e.url}: ${e.status} ${e.statusText}`).join('\n')}`;
        }
        else {
            planError.value = '未找到任何可用的API端点';
        }
        // 3秒后清除消息
        setTimeout(() => {
            planError.value = '';
        }, 3000);
    }
    catch (err) {
        console.error('API endpoint check failed:', err);
        planError.value = `检查失败: ${err.message}`;
        // 3秒后清除错误消息
        setTimeout(() => {
            planError.value = '';
        }, 3000);
    }
};
// 清空计划
const clearPlans = async () => {
    try {
        planError.value = '正在清空计划...';
        // 使用直接API存储服务获取所有计划
        const allPlans = await planService.getAllPlans();
        console.log('Plans to clear:', allPlans.length);
        // 删除每个计划
        let deletedCount = 0;
        for (let i = 0; i < allPlans.length; i++) {
            const plan = allPlans[i];
            // 检查是否是有效的对象
            if (!plan || typeof plan !== 'object') {
                console.error(`Invalid plan at index ${i}:`, plan);
                continue;
            }
            try {
                // 检查计划ID的位置
                // 使用类型断言来避免TypeScript错误
                const planId = plan.id || plan._id || plan.planId;
                if (!planId) {
                    console.error(`Plan at index ${i} has no valid ID:`, plan);
                    continue;
                }
                // 使用直接API存储服务删除计划
                await planService.deletePlan(planId);
                console.log(`Deleted plan ${planId}`);
                deletedCount++;
            }
            catch (err) {
                console.error(`Failed to delete plan at index ${i}:`, plan, err);
            }
        }
        // 刷新计划列表
        await fetchPlans();
        planError.value = `成功清空 ${deletedCount} 个计划`;
        setTimeout(() => {
            planError.value = '';
        }, 3000);
    }
    catch (err) {
        console.error('Error clearing plans:', err);
        planError.value = `清空计划失败: ${err.message}`;
    }
};
// 测试API连接 - 仅供调试使用
const testApiConnection = async () => {
    if (!isTestUser.value)
        return;
    apiStatus.value = '测试中...';
    try {
        // 测试基本连接
        apiStatus.value = '测试后端连接...';
        // 测试认证
        const token = localStorage.getItem(STORAGE_CONFIG.TOKEN_KEY);
        if (!token) {
            apiStatus.value = '错误: 无认证令牌';
            return;
        }
        // 获取用户信息
        const userResponse = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!userResponse.ok) {
            apiStatus.value = `认证失败: 状态码 ${userResponse.status}`;
            return;
        }
        const userData = await userResponse.json();
        apiStatus.value = `认证成功: 用户ID ${userData.id}, 用户名 ${userData.username}`;
        // 3秒后清除消息
        setTimeout(() => {
            apiStatus.value = '';
        }, 3000);
    }
    catch (err) {
        console.error('API test failed:', err);
        apiStatus.value = `错误: ${err.message}`;
        // 3秒后清除错误消息
        setTimeout(() => {
            apiStatus.value = '';
        }, 3000);
    }
};
// 记录实际开始时间
const taskStartTime = ref(null);
// Start/Pause timer
const toggleTimer = () => {
    if (isRunning.value) {
        // Pause timer
        if (intervalId.value) {
            clearInterval(intervalId.value);
            intervalId.value = null;
        }
        isRunning.value = false;
    }
    else {
        // Start timer
        isRunning.value = true;
        // 记录开始时间
        if (!taskStartTime.value) {
            taskStartTime.value = new Date();
            console.log('Task started at:', taskStartTime.value);
        }
        intervalId.value = setInterval(() => {
            if (totalSeconds.value > 0) {
                totalSeconds.value--;
                updateTimerDisplay();
            }
            else {
                completeTask();
            }
        }, 1000);
    }
};
// Update timer display
const updateTimerDisplay = () => {
    const minutes = Math.floor(totalSeconds.value / 60);
    const seconds = totalSeconds.value % 60;
    timer.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
// Reset timer
const resetTimer = () => {
    console.log('Reset timer called');
    if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
    }
    isRunning.value = false;
    // 清空任务名称
    taskName.value = '';
    // 重置开始时间
    taskStartTime.value = null;
    // 重置为默认25分钟
    taskTime.value = 25;
    totalSeconds.value = taskTime.value * 60;
    updateTimerDisplay();
    console.log('Timer reset to 25 minutes');
};
// Complete current task
const completeTask = async () => {
    console.log('Complete task called');
    // 停止计时器
    isRunning.value = false;
    if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
    }
    // 检查任务名称
    if (taskName.value.trim() === '') {
        // 不显示错误提示，提升界面流畅感
        return;
    }
    try {
        // 不设置加载状态，提升界面流畅感
        error.value = '';
        console.log('Saving task:', taskName.value, 'duration:', taskTime.value);
        // 获取当前时间作为结束时间（中国时区）
        const now = new Date();
        // 转换为中国时区
        const currentTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
        // 使用实际开始时间，如果没有则使用当前时间
        let startTime;
        if (taskStartTime.value) {
            // 转换为中国时区
            startTime = new Date(taskStartTime.value.getTime() + (taskStartTime.value.getTimezoneOffset() + 480) * 60000);
        }
        else {
            startTime = currentTime;
        }
        console.log('Task start time (China timezone):', startTime, 'End time (China timezone):', currentTime);
        // 计算实际持续时间（分钟）
        const actualDurationMs = currentTime.getTime() - startTime.getTime();
        const actualDurationMinutes = Math.ceil(actualDurationMs / (1000 * 60));
        console.log('Actual duration:', actualDurationMinutes, 'minutes');
        // 将日期格式化为中国时区的ISO格式字符串（带+08:00后缀）
        const formatDateForBackend = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
            // 格式: YYYY-MM-DDThh:mm:ss.sss+08:00
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`;
        };
        // 确保任务数据符合后端API要求
        const newTask = {
            name: taskName.value,
            duration: actualDurationMinutes, // 使用实际持续时间
            completed: true,
            start: formatDateForBackend(startTime),
            end: formatDateForBackend(currentTime)
            // 不指定用户ID，由后端根据token自动关联当前用户
        };
        console.log('Creating task with data:', newTask);
        // 使用直接API存储服务保存任务
        const savedTask = await taskService.addTask(newTask);
        console.log('Task saved successfully:', savedTask);
        // 刷新任务列表
        await fetchTasks();
        // 如果有对应的计划ID，将该计划标记为已完成
        if (currentDraggedPlanId.value) {
            console.log('Updating plan status for ID:', currentDraggedPlanId.value);
            // 查找对应的计划
            const planToUpdate = plans.value.find(plan => {
                const planId = getPlanId(plan);
                return planId && planId.toString() === currentDraggedPlanId.value?.toString();
            });
            if (planToUpdate && !planToUpdate.completed) {
                console.log('Found plan to update:', planToUpdate);
                // 调用togglePlan方法将计划标记为已完成
                await togglePlan(planToUpdate);
                console.log('Plan marked as completed');
            }
            else if (planToUpdate) {
                console.log('Plan already completed, no update needed');
            }
            else {
                console.warn('Could not find plan with ID:', currentDraggedPlanId.value);
            }
            // 重置当前拖拽的计划ID
            currentDraggedPlanId.value = null;
        }
        // Reset for next task
        resetTimer();
        taskName.value = '';
    }
    catch (err) {
        console.error('Error completing task:', err);
        if (err.response && err.response.data) {
            console.error('Error details:', err.response.data);
        }
        // 只在控制台输出错误，不显示错误消息
        // 重置当前拖拽的计划ID
        currentDraggedPlanId.value = null;
    }
};
// Handle task time input change
const handleTimeChange = () => {
    if (taskTime.value < 1)
        taskTime.value = 1;
    if (!isRunning.value) {
        totalSeconds.value = taskTime.value * 60;
        updateTimerDisplay();
    }
};
// Fetch tasks using the taskService
const fetchTasks = async () => {
    try {
        // 不设置加载状态，提升界面流畅感
        error.value = '';
        // 使用直接API存储服务获取任务
        const tasks = await taskService.getAllTasks();
        console.log('Tasks loaded from API:', tasks.length);
        // 设置任务记录（已按开始时间排序）
        taskRecords.value = tasks;
        // 输出详细的任务列表信息
        if (taskRecords.value.length > 0) {
            console.log('First task example:', taskRecords.value[0]);
        }
        else {
            console.warn('No tasks available to display');
        }
        // 计算统计信息
        try {
            // 使用存储服务获取统计信息，无论是否有任务记录
            const dailyStats = await taskService.getDailyStats();
            const totalStats = await taskService.getTotalStats();
            console.log('Daily stats:', dailyStats);
            console.log('Total stats:', totalStats);
            // 设置统计数据，确保有默认值
            dailyTotal.value = dailyStats?.duration || 0;
            totalHours.value = totalStats?.hours || 0;
        }
        catch (statsErr) {
            console.error('Error fetching statistics:', statsErr);
            // 设置默认值
            dailyTotal.value = 0;
            totalHours.value = 0;
        }
        // 不显示成功消息，提升界面流畅感
    }
    catch (err) {
        console.error('Error in fetchTasks:', err);
        // 只在控制台输出错误，不显示错误消息
        // 初始化空数据
        taskRecords.value = [];
        dailyTotal.value = 0;
        totalHours.value = 0;
    }
};
// Fetch plans using the planService
const fetchPlans = async () => {
    try {
        // 不设置加载状态，提升界面流畅感
        planError.value = '';
        // 使用直接API存储服务获取计划
        const plansData = await planService.getAllPlans();
        console.log('Plans loaded from API:', plansData.length);
        // 输出计划数据信息
        if (plansData.length > 0) {
            console.log('First plan example:', plansData[0]);
        }
        else {
            console.warn('No plans available to display');
        }
        // 使用工具函数过滤出今天的计划
        const todayPlans = filterTodayPlans(plansData);
        console.log('Today\'s plans:', todayPlans.length);
        // 使用工具函数对计划进行排序
        const sortedPlans = sortPlansByCompletionAndDate(todayPlans);
        plans.value = sortedPlans;
    }
    catch (err) {
        console.error('Error fetching plans:', err);
        // 只在控制台输出错误，不显示错误消息
        // 即使出错，也确保初始化数据
        plans.value = [];
    }
};
// Add a new plan using the planService
const addPlan = async () => {
    if (planInput.value.trim() === '') {
        // 不显示错误提示，提升界面流畅感
        return;
    }
    try {
        // 不设置加载状态，提升界面流畅感
        planError.value = '';
        // 获取当前时间（中国时区）
        const now = new Date();
        const chinaTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
        // 将日期格式化为中国时区的ISO格式字符串（带+08:00后缀）
        const formatDateForBackend = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
            // 格式: YYYY-MM-DDThh:mm:ss.sss+08:00
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`;
        };
        // 根据后端文档，使用正确的数据格式
        const newPlan = {
            text: planInput.value, // 后端使用text字段而不是title
            completed: false, // 完成状态
            started: false, // 开始状态
            createdAt: formatDateForBackend(chinaTime) // 添加创建时间字段，用于排序和过滤
        };
        console.log('Creating plan with data:', newPlan);
        // 使用直接API存储服务创建计划
        const createdPlan = await planService.addPlan(newPlan);
        console.log('Plan created successfully:', createdPlan);
        // 显示详细的计划信息，包括ID
        if (createdPlan && createdPlan.id) {
            console.log(`Plan created with ID: ${createdPlan.id}, text: ${createdPlan.text}`);
        }
        else {
            console.warn('Created plan has no ID or is incomplete:', createdPlan);
        }
        // 清空输入框
        planInput.value = '';
        // 在前端先添加计划，然后重新排序
        // 这样可以避免在等待API响应时的闪烁
        if (createdPlan) {
            // 添加新计划到列表
            plans.value.push(createdPlan);
            // 重新排序计划列表
            plans.value = [...plans.value].sort((a, b) => {
                // 首先按完成状态排序
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1; // 未完成的排在前面
                }
                // 然后在各自分组内按创建时间排序（如果有）
                if (a.createdAt && b.createdAt) {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                }
                // 如果没有创建时间，保持原有顺序
                return 0;
            });
        }
        // 同时在后台重新加载计划列表，确保数据同步
        fetchPlans();
    }
    catch (err) {
        console.error('Error adding plan:', err);
        // 只在控制台输出错误，不显示错误消息
        // 如果出错，重新加载计划列表以确保数据一致性
        fetchPlans();
    }
};
// 使用从工具函数导入的 getPlanId
// Toggle plan completion using the planService
const togglePlan = async (plan) => {
    try {
        // 不设置加载状态，提升界面流畅感
        planError.value = '';
        // 获取计划ID
        const planId = getPlanId(plan);
        if (!planId) {
            console.error('Plan has no valid ID:', plan);
            return;
        }
        // 根据后端文档，使用正确的数据格式
        const updatedPlan = {
            text: plan.text || plan.title || '', // 使用text字段，兼容title
            completed: !plan.completed, // 切换完成状态
            started: plan.started || false // 保持开始状态
        };
        // 使用直接API存储服务更新计划
        await planService.updatePlan(planId, updatedPlan);
        console.log('Plan updated successfully:', planId);
        // 在前端先更新计划状态，然后重新排序
        // 这样可以避免在等待API响应时的闪烁
        const planIndex = plans.value.findIndex(p => getPlanId(p) === planId);
        if (planIndex !== -1) {
            // 更新完成状态
            plans.value[planIndex].completed = !plan.completed;
            // 使用工具函数重新排序计划列表
            plans.value = sortPlansByCompletionAndDate(plans.value);
        }
        // 同时在后台重新加载计划列表，确保数据同步
        fetchPlans();
    }
    catch (err) {
        console.error('Error updating plan:', err);
        // 只在控制台输出错误，不显示错误消息
        // 如果出错，重新加载计划列表以确保数据一致性
        fetchPlans();
    }
};
// Delete a plan using the planService
const deletePlan = async (planId) => {
    // 检查计划ID是否有效
    if (!planId) {
        console.error('Cannot delete plan with invalid ID:', planId);
        return;
    }
    try {
        // 不设置加载状态，提升界面流畅感
        planError.value = '';
        // 使用直接API存储服务删除计划
        await planService.deletePlan(planId);
        console.log('Plan deleted successfully:', planId);
        // 重新加载计划列表
        await fetchPlans();
    }
    catch (err) {
        console.error(`Error deleting plan ${planId}:`, err);
        // 只在控制台输出错误，不显示错误消息
    }
};
// 使用从工具函数导入的 formatDate 和 formatTime
// Delete a task using the taskService
const deleteTask = async (taskId) => {
    if (!confirm('确定要删除这个任务吗？')) {
        return;
    }
    try {
        // 不设置加载状态，提升界面流畅感
        error.value = '';
        console.log('Deleting task:', taskId);
        // 使用直接API存储服务删除任务
        await taskService.deleteTask(taskId);
        console.log('Task deleted successfully:', taskId);
        // 重新加载任务列表
        await fetchTasks();
    }
    catch (err) {
        console.error('Error deleting task:', err);
        // 只在控制台输出错误，不显示错误消息
    }
};
// Watch for changes in taskTime
watch(taskTime, (_newVal) => {
    handleTimeChange();
});
// Load data on component mount
onMounted(() => {
    console.log('Home component mounted');
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found, may affect data fetching');
    }
    // 更新当前用户信息
    updateCurrentUser();
    // 检查当前用户是否是 testuser，如果是则允许开启调试模式
    userService.getCurrentUser()
        .then(user => {
        if (user && user.username === 'testuser') {
            console.log('Debug mode available for testuser');
            // 不自动启用调试模式，但允许用户手动开启
        }
        else {
            // 确保非 testuser 用户无法开启调试模式
            debugMode.value = false;
        }
    })
        .catch(err => {
        console.error('Error checking user for debug mode:', err);
    });
    // 给服务器一点启动时间后再请求数据
    setTimeout(() => {
        console.log('Initiating data fetch');
        // 使用工具函数添加重试机制
        executeWithRetry(() => fetchTasks());
        executeWithRetry(() => fetchPlans());
    }, 1000);
});
// Clean up when component is unmounted
onBeforeUnmount(() => {
    if (intervalId.value) {
        clearInterval(intervalId.value);
        intervalId.value = null;
    }
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
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-over']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-id']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-task-btn']} */ ;
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
/** @type {__VLS_StyleScopedClasses['plan-control']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-control']} */ ;
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
/** @type {__VLS_StyleScopedClasses['loading-message']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-message']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['main-content']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['time-setter']} */ ;
/** @type {__VLS_StyleScopedClasses['task-input']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-details']} */ ;
/** @type {__VLS_StyleScopedClasses['task-record-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tech-plan-item']} */ ;
/** @type {__VLS_StyleScopedClasses['summary']} */ ;
/** @type {__VLS_StyleScopedClasses['pomodoro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timer-container']} */ ;
/** @type {__VLS_StyleScopedClasses['control-btn']} */ ;
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