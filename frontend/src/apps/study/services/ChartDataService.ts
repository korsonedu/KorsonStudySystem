/**
 * 图表数据服务
 */
import { generateColors, processContentStats } from '../utils/StatisticsUtils';

/**
 * 生成图表数据
 * @param currentView 当前视图 ('daily', 'weekly', 'monthly')
 * @param dailyStats 每日统计数据
 * @param weeklyStats 每周统计数据
 * @param monthlyStats 每月统计数据
 * @param timeDistributionData 时间分布数据
 * @returns 图表数据
 */
export const generateChartData = (
  currentView: string,
  dailyStats: any[],
  weeklyStats: any[],
  monthlyStats: any[],
  timeDistributionData: any[]
) => {
  let labels = [];
  let data = [];

  try {
    if (currentView === 'daily') {
      // 创建24小时的标签和数据数组
      const hours = [];
      const hourlyData = new Array(24).fill(0);

      for (let i = 0; i < 24; i++) {
        hours.push(`${i}:00`);
      }

      // 优先使用timeDistributionData，这是按小时分布的数据
      if (Array.isArray(timeDistributionData) && timeDistributionData.length > 0) {
        console.log('Using timeDistributionData for hourly chart:', timeDistributionData.length, 'items');

        // 重置小时数据
        for (let i = 0; i < 24; i++) {
          hourlyData[i] = 0;
        }

        timeDistributionData.forEach((item: any) => {
          let hour: number;

          if (item.hour !== undefined) {
            hour = parseInt(item.hour);
          } else if (item.time !== undefined) {
            // 从 "HH:MM" 格式中提取小时
            hour = parseInt(item.time.split(':')[0]);
          } else if (item.time_slot !== undefined) {
            // 尝试从time_slot中提取小时
            const match = item.time_slot.match(/(\d+)/);
            hour = match ? parseInt(match[1]) : 0;
          } else {
            // 如果没有时间相关字段，跳过
            return;
          }

          // 确保小时在有效范围内
          if (hour >= 0 && hour < 24) {
            const value = item.duration !== undefined ? item.duration :
                         (item.value !== undefined ? item.value :
                         (item.count !== undefined ? item.count : 0));

            // 累加该小时的值
            hourlyData[hour] += value;
          }
        });

        // 打印生成的小时数据，帮助调试
        console.log('Generated hourly data:', hourlyData);
      }

      // 如果timeDistributionData没有数据，尝试使用dailyStats
      if (hourlyData.every(val => val === 0) && Array.isArray(dailyStats) && dailyStats.length > 0) {
        console.log('Using dailyStats for hourly data');

        // 填充小时数据
        dailyStats.forEach((item: any) => {
          let hour: number;

          // 检查数组中的对象是否有time和duration字段
          if (item.time !== undefined) {
            // 从 "HH:MM" 格式中提取小时
            hour = parseInt(item.time.split(':')[0]);
          } else if (item.hour !== undefined) {
            hour = parseInt(item.hour);
          } else if (item.time_slot !== undefined) {
            // 尝试从time_slot中提取小时
            const match = item.time_slot.match(/(\d+)/);
            hour = match ? parseInt(match[1]) : 0;
          } else if (item.start !== undefined && typeof item.start === 'string') {
            // 尝试从start字段提取小时
            try {
              const startDate = new Date(item.start);
              hour = startDate.getHours();
            } catch (e) {
              // 如果解析失败，跳过
              return;
            }
          } else {
            // 如果没有时间相关字段，跳过
            return;
          }

          // 确保小时在有效范围内
          if (hour >= 0 && hour < 24) {
            const value = item.duration !== undefined ? item.duration :
                         (item.value !== undefined ? item.value :
                         (item.count !== undefined ? item.count : 0));

            // 累加该小时的值
            if (value > 0) {
              hourlyData[hour] += value;
            }
          }
        });
      }



      labels = hours;
      data = hourlyData;
    } else if (currentView === 'weekly') {
      // 确保 weeklyStats 是数组
      if (Array.isArray(weeklyStats) && weeklyStats.length > 0) {
        // 直接使用weeklyStats中的数据
        labels = weeklyStats.map((item: any) => item.day || item.date || '');
        data = weeklyStats.map((item: any) => item.duration || item.value || 0);
      } else {
        // 尝试从任务数据生成周统计
        if (Array.isArray(dailyStats) && dailyStats.length > 0) {
          console.log('Generating weekly data from dailyStats');

          // 创建周数据结构
          const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const weekData = new Array(7).fill(0);

          // 获取本周的开始日期（周日）
          const today = new Date();
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // 设置为本周日
          weekStart.setHours(0, 0, 0, 0);

          console.log('Week start date:', weekStart.toISOString());

          // 处理每日数据
          dailyStats.forEach((item: any) => {
            let dateStr = '';

            // 尝试从不同字段获取日期
            if (item.date) {
              dateStr = item.date;
            } else if (item.start) {
              dateStr = typeof item.start === 'string' ? item.start : '';
            } else if (item.created_at) {
              dateStr = item.created_at;
            } else if (item.createdAt) {
              dateStr = item.createdAt;
            }

            // 如果有日期，计算星期几
            if (dateStr) {
              try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  // 只处理本周的数据
                  if (date >= weekStart && date <= today) {
                    const dayOfWeek = date.getDay(); // 0-6，0表示周日
                    const value = item.duration || item.value || item.minutes || item.count || 0;
                    if (value > 0) {
                      weekData[dayOfWeek] += value;
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing date:', dateStr, e);
              }
            }
          });

          console.log('Generated weekly data:', weekData);



          labels = weekDays;
          data = weekData;
        } else {
          // 创建默认数据
          labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          data = new Array(7).fill(0);
        }
      }
    } else {
      // 确保 monthlyStats 是数组
      if (Array.isArray(monthlyStats) && monthlyStats.length > 0) {
        // 直接使用monthlyStats中的数据
        labels = monthlyStats.map((item: any) => item.day || item.date || '');
        data = monthlyStats.map((item: any) => item.duration || item.value || 0);
      } else {
        // 尝试从任务数据生成月统计
        if (Array.isArray(dailyStats) && dailyStats.length > 0) {
          console.log('Generating monthly data from dailyStats');

          // 获取当前月份的天数
          const today = new Date();
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

          // 获取本月的开始日期
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          monthStart.setHours(0, 0, 0, 0);

          console.log('Month start date:', monthStart.toISOString(), 'Days in month:', daysInMonth);

          // 创建月数据结构
          const monthDays = Array.from({length: daysInMonth}, (_, i) => `${i + 1}日`);
          const monthData = new Array(daysInMonth).fill(0);

          // 处理每日数据
          dailyStats.forEach((item: any) => {
            let dateStr = '';

            // 尝试从不同字段获取日期
            if (item.date) {
              dateStr = item.date;
            } else if (item.start) {
              dateStr = typeof item.start === 'string' ? item.start : '';
            } else if (item.created_at) {
              dateStr = item.created_at;
            } else if (item.createdAt) {
              dateStr = item.createdAt;
            }

            // 如果有日期，计算月中的日期
            if (dateStr) {
              try {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  // 只处理当前月份的数据
                  if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
                    const dayOfMonth = date.getDate() - 1; // 0-30
                    const value = item.duration || item.value || item.minutes || item.count || 0;
                    if (value > 0 && dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
                      monthData[dayOfMonth] += value;
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing date:', dateStr, e);
              }
            }
          });

          console.log('Generated monthly data:', monthData);



          labels = monthDays;
          data = monthData;
        } else {
          // 创建默认数据
          const days = [];
          for (let i = 1; i <= 31; i++) {
            days.push(`${i}日`);
          }
          labels = days;
          data = new Array(31).fill(0);
        }
      }
    }
  } catch (error) {
    console.error('Error generating chart data:', error);
    // 创建默认数据
    labels = ['无数据'];
    data = [0];
  }

  return {
    labels,
    datasets: [
      {
        label: '学习时长 (分钟)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        data
      }
    ]
  };
};

/**
 * 生成内容图表数据
 * @param currentView 当前视图 ('daily', 'weekly', 'monthly')
 * @param dailyContentStats 每日内容统计数据
 * @param weeklyContentStats 每周内容统计数据
 * @param monthlyContentStats 每月内容统计数据
 * @returns 内容图表数据
 */
export const generateContentChartData = (
  currentView: string,
  dailyContentStats: any[],
  weeklyContentStats: any[],
  monthlyContentStats: any[]
) => {
  let contentStats = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD

  try {
    if (currentView === 'daily') {
      // 确保只使用今日的数据
      if (Array.isArray(dailyContentStats) && dailyContentStats.length > 0) {
        console.log('Processing daily content stats:', dailyContentStats.length, 'items');

        // 尝试从任务名称生成内容分布
        const contentMap = new Map<string, number>();

        dailyContentStats.forEach((item: any) => {
          // 尝试获取内容名称
          const name = item.name || item.content || item.category || item.task_name || '未分类';

          // 尝试获取时长
          let duration = 0;
          if (typeof item.duration === 'number') {
            duration = item.duration;
          } else if (typeof item.value === 'number') {
            duration = item.value;
          } else if (typeof item.minutes === 'number') {
            duration = item.minutes;
          } else if (typeof item.count === 'number') {
            duration = item.count;
          } else {
            // 尝试转换为数字
            duration = Number(item.duration || item.value || item.minutes || item.count || 0);
            if (isNaN(duration)) duration = 0;
          }

          // 累加该内容的时长
          if (contentMap.has(name)) {
            contentMap.set(name, contentMap.get(name)! + duration);
          } else {
            contentMap.set(name, duration);
          }
        });

        // 转换为内容统计数据
        contentStats = Array.from(contentMap.entries()).map(([name, duration]) => ({
          name,
          duration
        }));

        console.log('Generated daily content stats:', contentStats.length, 'items');
      } else {
        contentStats = [];
      }
    } else if (currentView === 'weekly') {
      // 使用本周的数据
      if (Array.isArray(weeklyContentStats) && weeklyContentStats.length > 0) {
        console.log('Using weekly content stats:', weeklyContentStats.length, 'items');
        contentStats = weeklyContentStats;
      } else {
        contentStats = [];
      }
    } else {
      // 使用本月的数据
      if (Array.isArray(monthlyContentStats) && monthlyContentStats.length > 0) {
        console.log('Using monthly content stats:', monthlyContentStats.length, 'items');
        contentStats = monthlyContentStats;
      } else {
        contentStats = [];
      }
    }

    // 如果没有数据，尝试从其他视图获取数据
    if (!contentStats || contentStats.length === 0) {
      console.log('No content stats for', currentView, 'view, trying other views');

      // 尝试从其他视图获取数据
      if (Array.isArray(dailyContentStats) && dailyContentStats.length > 0) {
        console.log('Using dailyContentStats:', dailyContentStats.length, 'items');
        contentStats = dailyContentStats;
      } else if (Array.isArray(weeklyContentStats) && weeklyContentStats.length > 0) {
        console.log('Using weeklyContentStats:', weeklyContentStats.length, 'items');
        contentStats = weeklyContentStats;
      } else if (Array.isArray(monthlyContentStats) && monthlyContentStats.length > 0) {
        console.log('Using monthlyContentStats:', monthlyContentStats.length, 'items');
        contentStats = monthlyContentStats;
      }

      // 如果仍然没有数据，返回空数据
      if (!contentStats || contentStats.length === 0) {
        console.log('No content stats available');
        return {
          labels: [],
          datasets: [{
            backgroundColor: [],
            data: []
          }]
        };
      }
    }

    // 处理内容统计数据
    const filteredStats = processContentStats(contentStats);

    // 如果没有有效数据，返回空数据
    if (filteredStats.length === 0) {
      return {
        labels: [],
        datasets: [{
          backgroundColor: [],
          data: []
        }]
      };
    }

    // 提取标签和数据
    const labels = filteredStats.map((item: any) => item.name);
    const data = filteredStats.map((item: any) => item.duration);
    const backgroundColor = generateColors(labels.length);

    return {
      labels,
      datasets: [{
        backgroundColor,
        data
      }]
    };
  } catch (error) {
    console.error('Error generating content chart data:', error);

    // 返回空数据
    return {
      labels: [],
      datasets: [{
        backgroundColor: [],
        data: []
      }]
    };
  }
};
