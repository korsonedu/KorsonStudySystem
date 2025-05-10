/**
 * 内容数据服务
 * 处理学习内容统计数据
 */

/**
 * 获取当前视图的内容统计数据
 * @param currentView 当前视图 ('daily', 'weekly', 'monthly')
 * @param dailyContentStats 每日内容统计数据
 * @param weeklyContentStats 每周内容统计数据
 * @param monthlyContentStats 每月内容统计数据
 * @returns 当前视图的内容统计数据
 */
export const getContentStatsByView = (
  currentView: string,
  dailyContentStats: any[],
  weeklyContentStats: any[],
  monthlyContentStats: any[]
): any[] => {
  // 打印传入的内容统计数据，用于调试
  console.log('Current view:', currentView);
  console.log('Daily content stats:', dailyContentStats);
  console.log('Weekly content stats:', weeklyContentStats);
  console.log('Monthly content stats:', monthlyContentStats);

  // 创建空的内容统计数据 - 不再使用默认值
  const emptyStats: any[] = [];

  // 根据当前视图选择对应的内容统计数据
  let result: any[] = [];

  if (currentView === 'daily') {
    // 检查每日内容统计数据
    if (Array.isArray(dailyContentStats) && dailyContentStats.length > 0) {
      // 过滤掉duration为0的项
      const filteredStats = dailyContentStats.filter(item => item.duration > 0);
      result = filteredStats;
    } else {
      result = emptyStats;
    }
  } else if (currentView === 'weekly') {
    // 检查每周内容统计数据
    if (Array.isArray(weeklyContentStats) && weeklyContentStats.length > 0) {
      // 过滤掉duration为0的项
      const filteredStats = weeklyContentStats.filter(item => item.duration > 0);
      result = filteredStats;
    } else {
      result = emptyStats;
    }
  } else {
    // 检查每月内容统计数据
    if (Array.isArray(monthlyContentStats) && monthlyContentStats.length > 0) {
      // 过滤掉duration为0的项
      const filteredStats = monthlyContentStats.filter(item => item.duration > 0);
      result = filteredStats;
    } else {
      result = emptyStats;
    }
  }

  // 限制数据项数量，避免图表过于复杂
  if (result.length > 10) {
    console.log('ContentDataService - 数据项过多，只显示前10项');
    result = result.slice(0, 10);
  }

  // 打印选择的内容统计数据，用于调试
  console.log('ContentDataService - 选择的内容统计数据:', result);

  return result;
};

/**
 * 从任务数据生成内容统计数据
 * @param tasks 任务数据
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 内容统计数据
 */
export const generateContentStatsFromTasks = (
  tasks: any[],
  startDate: Date,
  endDate: Date
): any[] => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return [];
  }

  // 创建内容映射
  const contentMap = new Map<string, number>();

  // 处理任务数据
  tasks.forEach((task: any) => {
    // 尝试获取任务的开始时间
    const startTime = task.start || task.start_time || task.startTime || task.date || '';
    if (!startTime) return;

    // 尝试获取任务的持续时间
    let duration = parseInt(task.duration || task.time || '0');
    if (isNaN(duration)) duration = 0;

    // 确保时长至少为1分钟
    duration = Math.max(duration, 1);

    try {
      const taskDate = new Date(startTime);
      if (isNaN(taskDate.getTime())) return; // 无效日期

      // 只处理指定日期范围内的任务
      if (taskDate >= startDate && taskDate <= endDate) {
        // 确保使用任务名称，如果没有则使用未分类
        const name = task.name || task.content || task.title || task.task || task.category || '未分类';

        console.log(`ContentDataService - 处理任务: ${name}, 日期: ${taskDate.toISOString()}, 时长: ${duration}`);

        // 更新内容映射
        if (contentMap.has(name)) {
          contentMap.set(name, contentMap.get(name)! + duration);
        } else {
          contentMap.set(name, duration);
        }
      }
    } catch (e) {
      console.error('Error parsing task date:', startTime, e);
    }
  });

  // 转换为内容统计数据
  const result = Array.from(contentMap.entries())
    .map(([name, duration]) => ({
      name,
      duration
    }))
    .sort((a, b) => b.duration - a.duration); // 按时长降序排序

  // 不再添加默认数据，允许返回空数组
  // 这样当没有数据时，图表会显示"暂无数据"

  console.log('ContentDataService - 生成的内容统计数据:', result);

  return result;
};

/**
 * 获取今日内容统计数据
 * @param tasks 任务数据
 * @returns 今日内容统计数据
 */
export const getDailyContentStats = (tasks: any[]): any[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return generateContentStatsFromTasks(tasks, today, tomorrow);
};

/**
 * 获取本周内容统计数据
 * @param tasks 任务数据
 * @returns 本周内容统计数据
 */
export const getWeeklyContentStats = (tasks: any[]): any[] => {
  const today = new Date();

  // 获取本周的开始日期（周一）- 中国习惯
  const weekStart = new Date(today);
  const dayOfWeek = today.getDay(); // 0是周日，1是周一，...
  // 如果今天是周日(0)，则设置为前一周的周一，否则设置为本周的周一
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(today.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);

  console.log('ContentDataService - 本周开始日期:', weekStart.toISOString());

  return generateContentStatsFromTasks(tasks, weekStart, today);
};

/**
 * 获取本月内容统计数据
 * @param tasks 任务数据
 * @returns 本月内容统计数据
 */
export const getMonthlyContentStats = (tasks: any[]): any[] => {
  const today = new Date();

  // 获取本月的开始日期
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  console.log('ContentDataService - 本月开始日期:', monthStart.toISOString(), '当前日期:', today.toISOString());

  return generateContentStatsFromTasks(tasks, monthStart, today);
};
