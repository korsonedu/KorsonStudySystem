/**
 * 排序和过滤工具函数
 * 提供数据排序和过滤的通用函数
 */
import { isToday } from './dateUtils';
/**
 * 获取计划ID的辅助函数，处理不同的ID字段名称
 * @param plan 计划对象
 * @returns 计划ID
 */
export const getPlanId = (plan) => {
    if (!plan)
        return undefined;
    return plan.id || plan._id || plan.planId;
};
/**
 * 按完成状态和创建时间排序计划
 * 未完成的在前，已完成的在后
 * 在各自分组内按创建时间排序
 * @param plans 计划数组
 * @returns 排序后的计划数组
 */
export const sortPlansByCompletionAndDate = (plans) => {
    return [...plans].sort((a, b) => {
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
};
/**
 * 过滤出今天创建的计划
 * @param plans 计划数组
 * @returns 今天创建的计划数组
 */
export const filterTodayPlans = (plans) => {
    return plans.filter(plan => {
        // 如果计划有创建时间字段，检查是否是今天创建的
        if (plan.createdAt) {
            return isToday(plan.createdAt);
        }
        // 如果没有创建时间字段，默认显示（可能是旧数据）
        return true;
    });
};
//# sourceMappingURL=sortUtils.js.map