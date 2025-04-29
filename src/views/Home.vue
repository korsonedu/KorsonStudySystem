const fetchTasks = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await apiService.get(API_CONFIG.ENDPOINTS.TASKS.BASE);
    if (response?.data) {
      tasks.value = response.data;
      // 计算今日总时长
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.value.filter(task => task.start.startsWith(today));
      dailyTotal.value = todayTasks.reduce((total, task) => total + task.duration, 0);
      // 计算总时长
      totalTime.value = tasks.value.reduce((total, task) => total + task.duration, 0);
      // 计算任务统计
      taskStats.value = {
        total: tasks.value.length,
        completed: tasks.value.filter(task => task.completed).length,
        completionRate: tasks.value.length > 0 
          ? Math.round((tasks.value.filter(task => task.completed).length / tasks.value.length) * 100)
          : 0
      };
    }
  } catch (err) {
    console.error('获取任务失败:', err);
    error.value = '获取任务失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}; 