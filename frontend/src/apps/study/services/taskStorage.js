/**
 * 任务存储服务
 * 提供任务的本地存储能力，作为API的备份
 */
// 本地存储键
const TASKS_STORAGE_KEY = 'tasks';
/**
 * 任务存储类
 */
export class TaskStorage {
    /**
     * 保存任务到本地存储
     * @param task 任务数据
     */
    saveTask(task) {
        // 获取现有任务
        const tasks = this.getTasks();
        // 如果任务没有ID，生成一个临时ID
        if (!task.id) {
            task.id = Date.now();
        }
        // 检查是否存在相同ID的任务
        const index = tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
            // 更新已存在的任务
            tasks[index] = task;
        }
        else {
            // 添加新任务
            tasks.push(task);
        }
        // 保存到本地存储
        this.saveTasks(tasks);
        return task;
    }
    /**
     * 从本地存储获取所有任务
     */
    getTasks() {
        // 从本地存储获取任务
        const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
        if (!tasksJson) {
            return [];
        }
        try {
            return JSON.parse(tasksJson);
        }
        catch (error) {
            console.error('解析本地任务失败:', error);
            return [];
        }
    }
    /**
     * 从本地存储删除任务
     * @param taskId 任务ID
     */
    deleteTask(taskId) {
        // 获取现有任务
        const tasks = this.getTasks();
        // 过滤掉要删除的任务
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        // 如果数量不同，说明有任务被删除
        if (filteredTasks.length !== tasks.length) {
            // 保存更新后的任务列表
            this.saveTasks(filteredTasks);
            return true;
        }
        return false;
    }
    /**
     * 清除所有本地任务
     */
    clearTasks() {
        localStorage.removeItem(TASKS_STORAGE_KEY);
    }
    /**
     * 保存任务列表到本地存储
     * @param tasks 任务列表
     */
    saveTasks(tasks) {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    }
}
//# sourceMappingURL=taskStorage.js.map