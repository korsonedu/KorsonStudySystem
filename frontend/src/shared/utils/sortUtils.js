/**
 * 排序工具函数
 */
/**
 * 获取计划ID
 * @param plan 计划对象
 * @returns 计划ID
 */
export function getPlanId(plan) {
    if (!plan)
        return undefined;
    // 兼容不同的ID字段名称
    return plan.id || plan._id || plan.planId || plan.plan_id;
}
/**
 * 按完成状态和日期排序计划
 * @param plans 计划数组
 * @returns 排序后的计划数组
 */
export function sortPlansByCompletionAndDate(plans) {
    // 如果没有计划，直接返回空数组
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
        return [];
    }
    return [...plans].sort((a, b) => {
        // 首先按完成状态排序（未完成的在前）
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        // 然后按创建日期排序（新的在前）
        // 兼容不同的日期字段名称
        const dateStrA = a.createdAt || a.created_at || a.createTime || a.create_time || 0;
        const dateStrB = b.createdAt || b.created_at || b.createTime || b.create_time || 0;
        try {
            const dateA = new Date(dateStrA).getTime();
            const dateB = new Date(dateStrB).getTime();
            return dateB - dateA;
        }
        catch (e) {
            console.error('Error sorting dates:', e);
            return 0;
        }
    });
}
/**
 * 过滤今日计划
 * @param plans 计划数组
 * @returns 今日计划数组
 */
export function filterTodayPlans(plans) {
    // 如果没有计划，直接返回空数组
    if (!plans || !Array.isArray(plans) || plans.length === 0) {
        console.log('No plans to filter');
        return [];
    }
    console.log('Filtering plans:', plans.length, 'Sample plan:', plans[0]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // 兼容不同的日期字段名称
    return plans.filter(plan => {
        // 尝试多种可能的日期字段名
        const dateStr = plan.createdAt || plan.created_at || plan.createTime || plan.create_time;
        if (!dateStr) {
            console.log('Plan has no date field:', plan);
            return true; // 如果没有日期字段，默认显示
        }
        try {
            const planDate = new Date(dateStr);
            return planDate >= today && planDate < tomorrow;
        }
        catch (e) {
            console.error('Error parsing date:', dateStr, e);
            return true; // 如果日期解析错误，默认显示
        }
    });
}
/**
 * 按日期排序任务
 * @param tasks 任务数组
 * @param ascending 是否升序（默认降序）
 * @returns 排序后的任务数组
 */
export function sortTasksByDate(tasks, ascending = false) {
    return [...tasks].sort((a, b) => {
        const dateA = new Date(a.start || 0).getTime();
        const dateB = new Date(b.start || 0).getTime();
        return ascending ? dateA - dateB : dateB - dateA;
    });
}
/**
 * 按持续时间排序任务
 * @param tasks 任务数组
 * @param ascending 是否升序（默认降序）
 * @returns 排序后的任务数组
 */
export function sortTasksByDuration(tasks, ascending = false) {
    return [...tasks].sort((a, b) => {
        const durationA = a.duration || 0;
        const durationB = b.duration || 0;
        return ascending ? durationA - durationB : durationB - durationA;
    });
}
/**
 * 按名称排序任务
 * @param tasks 任务数组
 * @param ascending 是否升序（默认升序）
 * @returns 排序后的任务数组
 */
export function sortTasksByName(tasks, ascending = true) {
    return [...tasks].sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
}
/**
 * 按完成状态排序任务
 * @param tasks 任务数组
 * @returns 排序后的任务数组（未完成的在前）
 */
export function sortTasksByCompletion(tasks) {
    return [...tasks].sort((a, b) => {
        return a.completed ? 1 : -1;
    });
}
/**
 * 按类型分组任务
 * @param tasks 任务数组
 * @returns 分组后的任务对象
 */
export function groupTasksByType(tasks) {
    return tasks.reduce((groups, task) => {
        const type = task.type || 'default';
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(task);
        return groups;
    }, {});
}
export default {
    getPlanId,
    sortPlansByCompletionAndDate,
    filterTodayPlans,
    sortTasksByDate,
    sortTasksByDuration,
    sortTasksByName,
    sortTasksByCompletion,
    groupTasksByType
};
//# sourceMappingURL=sortUtils.js.map