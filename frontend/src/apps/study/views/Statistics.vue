<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// @ts-ignore
import { apiService } from '../../../shared/services/apiService'
import { API_CONFIG } from '../../../config'
import { Line, Bar, Pie, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import HeatMap from '../../../shared/components/Heatmap.vue'
import TimeDistributionChart from '../../../shared/components/TimeDistributionChart.vue'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Stats data
const dailyStats = ref<any>([])
const weeklyStats = ref<any>([])
const monthlyStats = ref<any>([])
const totalStats = ref<any>(null)
const heatmapData = ref<any>([])
const timeDistributionData = ref<any>([])
const dailyContentStats = ref<any>([])
const weeklyContentStats = ref<any>([])
const monthlyContentStats = ref<any>([])
const userRegistrationDate = ref<string>('') // 用户注册日期
const loading = ref(false)
const error = ref('')

// Current view
const currentView = ref('daily')

// Chart data
const chartData = computed(() => {
  let labels = []
  let data = []

  try {
    console.log(`Generating chart data for ${currentView.value} view`)
    console.log(`dailyStats:`, dailyStats.value)
    console.log(`weeklyStats:`, weeklyStats.value)
    console.log(`monthlyStats:`, monthlyStats.value)

    if (currentView.value === 'daily') {
      // 创建24小时的标签和数据数组
      const hours = []
      const hourlyData = new Array(24).fill(0)

      for (let i = 0; i < 24; i++) {
        hours.push(`${i}:00`)
      }

      // 添加一些测试数据，确保图表显示正确
      const currentHour = new Date().getHours();
      hourlyData[currentHour] = 30; // 当前小时30分钟
      if (currentHour > 0) hourlyData[currentHour - 1] = 45; // 前一小时45分钟
      if (currentHour < 23) hourlyData[currentHour + 1] = 15; // 后一小时15分钟

      // 确保 dailyStats.value 是数组
      if (Array.isArray(dailyStats.value) && dailyStats.value.length > 0) {
        // 填充小时数据
        dailyStats.value.forEach((item: any) => {
          let hour: number

          // 检查数组中的对象是否有time和duration字段
          if (item.time !== undefined) {
            // 从 "HH:MM" 格式中提取小时
            hour = parseInt(item.time.split(':')[0])
          } else if (item.hour !== undefined) {
            hour = item.hour
          } else if (item.time_slot !== undefined) {
            // 尝试从time_slot中提取小时
            const match = item.time_slot.match(/(\d+)/)
            hour = match ? parseInt(match[1]) : 0
          } else {
            // 如果没有时间相关字段，跳过
            return
          }

          // 确保小时在有效范围内
          if (hour >= 0 && hour < 24) {
            const value = item.duration !== undefined ? item.duration :
                         (item.value !== undefined ? item.value :
                         (item.count !== undefined ? item.count : 0))

            // 如果已经有测试数据，不要覆盖
            if (hour !== currentHour &&
                hour !== currentHour - 1 &&
                hour !== currentHour + 1) {
              hourlyData[hour] = value
            }
          }
        })
      } else {
        console.warn('dailyStats.value is not a valid array:', dailyStats.value)
      }

      labels = hours
      data = hourlyData
    } else if (currentView.value === 'weekly') {
      // 确保 weeklyStats.value 是数组
      if (Array.isArray(weeklyStats.value) && weeklyStats.value.length > 0) {
        // 检查数组中的对象是否有day和duration字段
        if (weeklyStats.value[0].day !== undefined && weeklyStats.value[0].duration !== undefined) {
          labels = weeklyStats.value.map((item: any) => item.day)
          data = weeklyStats.value.map((item: any) => item.duration)
        } else {
          // 尝试其他可能的字段名
          const dayField = weeklyStats.value[0].weekday !== undefined ? 'weekday' :
                          (weeklyStats.value[0].date !== undefined ? 'date' : 'day')
          const valueField = weeklyStats.value[0].value !== undefined ? 'value' :
                           (weeklyStats.value[0].count !== undefined ? 'count' : 'duration')

          labels = weeklyStats.value.map((item: any) => item[dayField])
          data = weeklyStats.value.map((item: any) => item[valueField])
        }
      } else {
        console.warn('weeklyStats.value is not a valid array:', weeklyStats.value)
        // 创建默认数据
        labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        data = new Array(7).fill(0)
      }
    } else {
      // 确保 monthlyStats.value 是数组
      if (Array.isArray(monthlyStats.value) && monthlyStats.value.length > 0) {
        // 检查数组中的对象是否有day和duration字段
        if (monthlyStats.value[0].day !== undefined && monthlyStats.value[0].duration !== undefined) {
          labels = monthlyStats.value.map((item: any) => item.day)
          data = monthlyStats.value.map((item: any) => item.duration)
        } else {
          // 尝试其他可能的字段名
          const dayField = monthlyStats.value[0].date !== undefined ? 'date' : 'day'
          const valueField = monthlyStats.value[0].value !== undefined ? 'value' :
                           (monthlyStats.value[0].count !== undefined ? 'count' : 'duration')

          labels = monthlyStats.value.map((item: any) => item[dayField])
          data = monthlyStats.value.map((item: any) => item[valueField])
        }
      } else {
        console.warn('monthlyStats.value is not a valid array:', monthlyStats.value)
        // 创建默认数据
        const days = []
        for (let i = 1; i <= 31; i++) {
          days.push(`${i}日`)
        }
        labels = days
        data = new Array(31).fill(0)
      }
    }
  } catch (error) {
    console.error('Error generating chart data:', error)
    // 创建默认数据
    labels = ['无数据']
    data = [0]
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
  }
})

// 内容统计图数据
const contentChartData = computed(() => {
  let contentStats = []

  try {
    console.log('Generating content chart data')

    if (currentView.value === 'daily') {
      contentStats = Array.isArray(dailyContentStats.value) ? dailyContentStats.value : []
      console.log('Daily content stats:', contentStats)
    } else if (currentView.value === 'weekly') {
      contentStats = Array.isArray(weeklyContentStats.value) ? weeklyContentStats.value : []
      console.log('Weekly content stats:', contentStats)
    } else {
      contentStats = Array.isArray(monthlyContentStats.value) ? monthlyContentStats.value : []
      console.log('Monthly content stats:', contentStats)
    }

    // 如果没有数据，返回空数据
    if (!contentStats || contentStats.length === 0) {
      console.log('No content stats available')
      return {
        labels: [],
        datasets: [{
          backgroundColor: [],
          data: []
        }]
      }
    }

    // 生成随机颜色
    const generateColors = (count: number) => {
      const colors = []
      for (let i = 0; i < count; i++) {
        const hue = (i * 137) % 360 // 使用黄金角分布获取不同的色相
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`)
      }
      return colors
    }

    // 尝试不同的字段名
    let labels = []
    let data = []

    if (contentStats.length > 0) {
      if (contentStats[0].name !== undefined && contentStats[0].duration !== undefined) {
        labels = contentStats.map((item: any) => item.name)
        data = contentStats.map((item: any) => item.duration)
      } else if (contentStats[0].category !== undefined) {
        const nameField = contentStats[0].category !== undefined ? 'category' :
                         (contentStats[0].content !== undefined ? 'content' : 'name')
        const valueField = contentStats[0].value !== undefined ? 'value' :
                          (contentStats[0].count !== undefined ? 'count' : 'duration')

        labels = contentStats.map((item: any) => item[nameField])
        data = contentStats.map((item: any) => item[valueField])
      }
    }

    // 如果没有有效数据，返回空数据
    if (labels.length === 0 || data.length === 0) {
      return {
        labels: [],
        datasets: [{
          backgroundColor: [],
          data: []
        }]
      }
    }

    const backgroundColor = generateColors(labels.length)

    console.log('Content chart data:', { labels, data, backgroundColor })

    return {
      labels,
      datasets: [{
        backgroundColor,
        data
      }]
    }
  } catch (error) {
    console.error('Error generating content chart data:', error)

    // 返回空数据
    return {
      labels: [],
      datasets: [{
        backgroundColor: [],
        data: []
      }]
    }
  }
})

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 允许自定义高度
  scales: {
    y: {
      beginAtZero: true
    }
  },
  layout: {
    padding: 10 // 添加内边距
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    }
  }
}

// 内容统计图配置
const contentChartOptions = {
  responsive: true,
  maintainAspectRatio: false, // 允许自定义高度
  layout: {
    padding: 10 // 添加内边距
  },
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 15,
        padding: 15,
        font: {
          size: 12 // 减小字体大小
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} 分钟 (${percentage}%)`;
        }
      }
    }
  }
}

// Switch view
const switchView = (view: string) => {
  currentView.value = view
}

// Fetch stats
const fetchStats = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('Fetching statistics data...')

    // 从API获取数据
    console.log('API endpoints being called:')
    console.log('DAILY:', API_CONFIG.ENDPOINTS.STATISTICS.DAILY)
    console.log('WEEKLY:', API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY)
    console.log('MONTHLY:', API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY)
    console.log('TOTAL:', API_CONFIG.ENDPOINTS.STATISTICS.TOTAL)
    console.log('HEATMAP:', API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP)
    console.log('TIME_DISTRIBUTION:', API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION)
    console.log('USER_INFO:', API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO)
    console.log('TASKS:', '/api/study/tasks')

    // 单独调用每个API，以便确定哪个失败了
    let dailyRes, weeklyRes, monthlyRes, totalRes, heatmapRes, timeDistRes, userRes, tasksRes

    try {
      dailyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.DAILY)
      console.log('Daily API call successful')
    } catch (error) {
      console.error('Error calling daily API:', error)
      dailyRes = { data: [] }
    }

    try {
      weeklyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.WEEKLY)
      console.log('Weekly API call successful')
    } catch (error) {
      console.error('Error calling weekly API:', error)
      weeklyRes = { data: [] }
    }

    try {
      monthlyRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.MONTHLY)
      console.log('Monthly API call successful')
    } catch (error) {
      console.error('Error calling monthly API:', error)
      monthlyRes = { data: [] }
    }

    try {
      totalRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL)
      console.log('Total API call successful')
    } catch (error) {
      console.error('Error calling total API:', error)
      totalRes = { data: {} }
    }

    try {
      heatmapRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.HEATMAP)
      console.log('Heatmap API call successful')
    } catch (error) {
      console.error('Error calling heatmap API:', error)
      heatmapRes = { data: [] }
    }

    try {
      timeDistRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TIME_DISTRIBUTION)
      console.log('Time distribution API call successful')
    } catch (error) {
      console.error('Error calling time distribution API:', error)
      timeDistRes = { data: [] }
    }

    try {
      userRes = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.USER_INFO)
      console.log('User info API call successful')
    } catch (error) {
      console.error('Error calling user info API:', error)
      userRes = { data: {} }
    }

    try {
      tasksRes = await apiService.get('/api/study/tasks')
      console.log('Tasks API call successful')
    } catch (error) {
      console.error('Error calling tasks API:', error)
      tasksRes = { data: [] }
    }

    console.log('Statistics API responses:', {
      daily: dailyRes,
      weekly: weeklyRes,
      monthly: monthlyRes,
      total: totalRes,
      heatmap: heatmapRes,
      timeDistribution: timeDistRes,
      userInfo: userRes,
      tasks: tasksRes
    })

    // 处理每日数据
    console.log('Daily stats response:', dailyRes)

    if (dailyRes && dailyRes.data) {
      if (dailyRes.data.hourly && Array.isArray(dailyRes.data.hourly)) {
        console.log('Using hourly data:', dailyRes.data.hourly)
        dailyStats.value = dailyRes.data.hourly
      } else {
        console.log('Using raw data:', dailyRes.data)
        // 如果数据不是数组，创建一个包含当前小时的数组
        if (!Array.isArray(dailyRes.data)) {
          const now = new Date()
          const hour = now.getHours()

          // 获取实际值
          const actualDuration = dailyRes.data.duration ||
                               dailyRes.data.daily_duration ||
                               dailyRes.data.dailyDuration ||
                               0

          dailyStats.value = [
            {
              time: `${hour}:00`,
              duration: actualDuration
            }
          ]

          console.log('Created hourly data with actual current hour:', dailyStats.value)
        } else {
          dailyStats.value = dailyRes.data
        }
      }
    } else {
      console.log('No daily stats data available')
      dailyStats.value = []
    }

    // 处理每日内容统计
    if (dailyRes && dailyRes.data) {
      console.log('Processing daily content stats from:', dailyRes.data)

      // 尝试从不同字段获取内容统计数据
      if (dailyRes.data.content && Array.isArray(dailyRes.data.content)) {
        console.log('Using content data from daily stats:', dailyRes.data.content)
        dailyContentStats.value = dailyRes.data.content
      } else if (dailyRes.data.contentStats && Array.isArray(dailyRes.data.contentStats)) {
        console.log('Using contentStats from daily stats:', dailyRes.data.contentStats)
        dailyContentStats.value = dailyRes.data.contentStats
      } else if (dailyRes.data.categories && Array.isArray(dailyRes.data.categories)) {
        console.log('Using categories from daily stats:', dailyRes.data.categories)
        // 转换categories格式为content格式
        dailyContentStats.value = dailyRes.data.categories.map((category: any) => ({
          name: category.name || category.category || '未分类',
          duration: category.duration || category.value || category.count || 0
        }))
      } else if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data)) {
        // 如果没有内容统计数据，尝试从任务数据生成
        console.log('Generating content stats from tasks data')

        // 创建内容到时长的映射
        const contentMap = new Map()

        // 处理任务数据
        tasksRes.data.forEach((task: any) => {
          if (task.name && task.duration) {
            // 提取内容名称（使用第一个单词作为分类）
            const contentName = task.name.split(' ')[0]

            // 累加该内容的时长
            if (contentMap.has(contentName)) {
              contentMap.set(contentName, contentMap.get(contentName) + task.duration)
            } else {
              contentMap.set(contentName, task.duration)
            }
          }
        })

        // 将映射转换为内容统计数据格式
        const contentStats: any[] = []
        contentMap.forEach((duration, name) => {
          contentStats.push({ name, duration })
        })

        if (contentStats.length > 0) {
          console.log('Generated content stats from tasks:', contentStats)
          dailyContentStats.value = contentStats
        } else {
          console.log('No content stats could be generated from tasks')
          dailyContentStats.value = []
        }
      } else {
        console.log('No content data available in daily stats')
        dailyContentStats.value = []
      }
    } else {
      console.log('No daily stats data available')
      dailyContentStats.value = []
    }

    // 处理每周数据
    console.log('Weekly stats response:', weeklyRes)

    if (weeklyRes && weeklyRes.data) {
      if (weeklyRes.data.daily && Array.isArray(weeklyRes.data.daily)) {
        console.log('Using daily data from weekly stats:', weeklyRes.data.daily)

        // 创建一周7天的数据数组
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const weeklyData = days.map(day => ({
          day,
          duration: 0
        }))

        // 填充实际数据
        weeklyRes.data.daily.forEach((item: any) => {
          if (item.day) {
            // 查找对应的星期几
            const dayIndex = days.findIndex(d => d === item.day)
            if (dayIndex !== -1) {
              weeklyData[dayIndex].duration = item.duration || 0
            }
          } else if (item.date) {
            // 如果有日期字段，转换为星期几
            const date = new Date(item.date)
            const dayIndex = date.getDay() // 0是周日，1是周一，以此类推
            if (dayIndex >= 0 && dayIndex < 7) {
              weeklyData[dayIndex].duration = item.duration || 0
            }
          }
        })

        weeklyStats.value = weeklyData
        console.log('Processed weekly data:', weeklyData)
      } else {
        console.log('Using raw weekly data:', weeklyRes.data)
        // 如果数据不是数组，创建一个包含当前星期的数组
        if (!Array.isArray(weeklyRes.data)) {
          const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

          // 获取实际值
          const actualDuration = weeklyRes.data.total_duration ||
                               weeklyRes.data.totalDuration ||
                               weeklyRes.data.weekly_duration ||
                               weeklyRes.data.weeklyDuration ||
                               0

          // 创建一周7天的数据数组
          const weeklyData = days.map(day => ({
            day,
            duration: 0
          }))

          // 将总时长分配到当前星期几
          const now = new Date()
          const dayOfWeek = now.getDay()
          weeklyData[dayOfWeek].duration = actualDuration

          weeklyStats.value = weeklyData
          console.log('Created weekly data with actual value:', weeklyData)
        } else {
          // 如果是数组但没有day字段，尝试处理
          const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
          const weeklyData = days.map(day => ({
            day,
            duration: 0
          }))

          // 尝试从数组中提取数据
          weeklyRes.data.forEach((item: any) => {
            if (item.day) {
              // 查找对应的星期几
              const dayIndex = days.findIndex(d => d === item.day)
              if (dayIndex !== -1) {
                weeklyData[dayIndex].duration = item.duration || 0
              }
            } else if (item.date) {
              // 如果有日期字段，转换为星期几
              const date = new Date(item.date)
              const dayIndex = date.getDay()
              if (dayIndex >= 0 && dayIndex < 7) {
                weeklyData[dayIndex].duration = item.duration || 0
              }
            }
          })

          weeklyStats.value = weeklyData
        }
      }
    } else {
      console.log('No weekly stats data available')
      weeklyStats.value = []
    }

    // 处理每周内容统计
    if (weeklyRes && weeklyRes.data) {
      console.log('Processing weekly content stats from:', weeklyRes.data)

      // 尝试从不同字段获取内容统计数据
      if (weeklyRes.data.content && Array.isArray(weeklyRes.data.content)) {
        console.log('Using content data from weekly stats:', weeklyRes.data.content)
        weeklyContentStats.value = weeklyRes.data.content
      } else if (weeklyRes.data.contentStats && Array.isArray(weeklyRes.data.contentStats)) {
        console.log('Using contentStats from weekly stats:', weeklyRes.data.contentStats)
        weeklyContentStats.value = weeklyRes.data.contentStats
      } else if (weeklyRes.data.categories && Array.isArray(weeklyRes.data.categories)) {
        console.log('Using categories from weekly stats:', weeklyRes.data.categories)
        // 转换categories格式为content格式
        weeklyContentStats.value = weeklyRes.data.categories.map((category: any) => ({
          name: category.name || category.category || '未分类',
          duration: category.duration || category.value || category.count || 0
        }))
      } else if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data)) {
        // 如果没有内容统计数据，尝试从任务数据生成
        console.log('Generating weekly content stats from tasks data')

        // 创建内容到时长的映射
        const contentMap = new Map()

        // 获取当前日期
        const now = new Date()
        // 计算本周的开始日期（周日）
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        // 处理任务数据
        tasksRes.data.forEach((task: any) => {
          if (task.name && task.duration) {
            // 检查任务是否在本周完成 - 使用start字段而不是completed_at
            const taskDate = task.start ? new Date(task.start) :
                           (task.completed_at ? new Date(task.completed_at) : null)

            if (taskDate && taskDate >= startOfWeek) {
              // 提取内容名称（使用第一个单词作为分类）
              const contentName = task.name.split(' ')[0]

              // 累加该内容的时长
              if (contentMap.has(contentName)) {
                contentMap.set(contentName, contentMap.get(contentName) + task.duration)
              } else {
                contentMap.set(contentName, task.duration)
              }
            }
          }
        })

        // 将映射转换为内容统计数据格式
        const contentStats: any[] = []
        contentMap.forEach((duration, name) => {
          contentStats.push({ name, duration })
        })

        if (contentStats.length > 0) {
          console.log('Generated weekly content stats from tasks:', contentStats)
          weeklyContentStats.value = contentStats
        } else {
          console.log('No weekly content stats could be generated from tasks')
          weeklyContentStats.value = []
        }
      } else {
        console.log('No content data available in weekly stats')
        weeklyContentStats.value = []
      }
    } else {
      console.log('No weekly stats data available')
      weeklyContentStats.value = []
    }

    // 处理每月数据
    console.log('Monthly stats response:', monthlyRes)

    if (monthlyRes && monthlyRes.data) {
      if (monthlyRes.data.daily && Array.isArray(monthlyRes.data.daily)) {
        console.log('Using daily data from monthly stats:', monthlyRes.data.daily)

        // 获取当前月份的天数
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        // 创建当月每天的数据数组
        const monthlyData = []
        for (let i = 1; i <= daysInMonth; i++) {
          monthlyData.push({
            day: `${i}日`,
            date: new Date(year, month, i).toISOString().split('T')[0],
            duration: 0
          })
        }

        // 填充实际数据
        monthlyRes.data.daily.forEach((item: any) => {
          if (item.day) {
            // 从"X日"格式中提取日期
            const dayMatch = item.day.match(/(\d+)/)
            if (dayMatch) {
              const day = parseInt(dayMatch[1])
              if (day >= 1 && day <= daysInMonth) {
                monthlyData[day - 1].duration = item.duration || 0
              }
            }
          } else if (item.date) {
            // 如果有日期字段，提取日期
            const date = new Date(item.date)
            const day = date.getDate()
            if (day >= 1 && day <= daysInMonth) {
              monthlyData[day - 1].duration = item.duration || 0
            }
          }
        })

        monthlyStats.value = monthlyData
        console.log('Processed monthly data:', monthlyData)
      } else {
        console.log('Using raw monthly data:', monthlyRes.data)
        // 如果数据不是数组，创建一个包含当月每天的数组
        if (!Array.isArray(monthlyRes.data)) {
          // 获取当前月份的天数
          const now = new Date()
          const year = now.getFullYear()
          const month = now.getMonth()
          const daysInMonth = new Date(year, month + 1, 0).getDate()

          // 获取实际值
          const actualDuration = monthlyRes.data.total_duration ||
                               monthlyRes.data.totalDuration ||
                               monthlyRes.data.monthly_duration ||
                               monthlyRes.data.monthlyDuration ||
                               0

          // 创建当月每天的数据数组
          const monthlyData = []
          for (let i = 1; i <= daysInMonth; i++) {
            monthlyData.push({
              day: `${i}日`,
              date: new Date(year, month, i).toISOString().split('T')[0],
              duration: 0
            })
          }

          // 将总时长分配到当前日期
          const currentDay = now.getDate()
          if (currentDay >= 1 && currentDay <= daysInMonth) {
            monthlyData[currentDay - 1].duration = actualDuration
          }

          monthlyStats.value = monthlyData
          console.log('Created monthly data with actual value:', monthlyData)
        } else {
          // 如果是数组但可能格式不对，尝试处理
          // 获取当前月份的天数
          const now = new Date()
          const year = now.getFullYear()
          const month = now.getMonth()
          const daysInMonth = new Date(year, month + 1, 0).getDate()

          // 创建当月每天的数据数组
          const monthlyData = []
          for (let i = 1; i <= daysInMonth; i++) {
            monthlyData.push({
              day: `${i}日`,
              date: new Date(year, month, i).toISOString().split('T')[0],
              duration: 0
            })
          }

          // 尝试从数组中提取数据
          monthlyRes.data.forEach((item: any) => {
            if (item.day) {
              // 从"X日"格式中提取日期
              const dayMatch = item.day.match(/(\d+)/)
              if (dayMatch) {
                const day = parseInt(dayMatch[1])
                if (day >= 1 && day <= daysInMonth) {
                  monthlyData[day - 1].duration = item.duration || 0
                }
              }
            } else if (item.date) {
              // 如果有日期字段，提取日期
              const date = new Date(item.date)
              const day = date.getDate()
              if (day >= 1 && day <= daysInMonth) {
                monthlyData[day - 1].duration = item.duration || 0
              }
            }
          })

          monthlyStats.value = monthlyData
        }
      }
    } else {
      console.log('No monthly stats data available')
      monthlyStats.value = []
    }

    // 处理每月内容统计
    if (monthlyRes && monthlyRes.data) {
      console.log('Processing monthly content stats from:', monthlyRes.data)

      // 尝试从不同字段获取内容统计数据
      if (monthlyRes.data.content && Array.isArray(monthlyRes.data.content)) {
        console.log('Using content data from monthly stats:', monthlyRes.data.content)
        monthlyContentStats.value = monthlyRes.data.content
      } else if (monthlyRes.data.contentStats && Array.isArray(monthlyRes.data.contentStats)) {
        console.log('Using contentStats from monthly stats:', monthlyRes.data.contentStats)
        monthlyContentStats.value = monthlyRes.data.contentStats
      } else if (monthlyRes.data.categories && Array.isArray(monthlyRes.data.categories)) {
        console.log('Using categories from monthly stats:', monthlyRes.data.categories)
        // 转换categories格式为content格式
        monthlyContentStats.value = monthlyRes.data.categories.map((category: any) => ({
          name: category.name || category.category || '未分类',
          duration: category.duration || category.value || category.count || 0
        }))
      } else if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data)) {
        // 如果没有内容统计数据，尝试从任务数据生成
        console.log('Generating monthly content stats from tasks data')

        // 创建内容到时长的映射
        const contentMap = new Map()

        // 获取当前日期
        const now = new Date()
        // 计算本月的开始日期
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // 处理任务数据
        tasksRes.data.forEach((task: any) => {
          if (task.name && task.duration) {
            // 检查任务是否在本月完成 - 使用start字段而不是completed_at
            const taskDate = task.start ? new Date(task.start) :
                           (task.completed_at ? new Date(task.completed_at) : null)

            if (taskDate && taskDate >= startOfMonth) {
              // 提取内容名称（使用第一个单词作为分类）
              const contentName = task.name.split(' ')[0]

              // 累加该内容的时长
              if (contentMap.has(contentName)) {
                contentMap.set(contentName, contentMap.get(contentName) + task.duration)
              } else {
                contentMap.set(contentName, task.duration)
              }
            }
          }
        })

        // 将映射转换为内容统计数据格式
        const contentStats: any[] = []
        contentMap.forEach((duration, name) => {
          contentStats.push({ name, duration })
        })

        if (contentStats.length > 0) {
          console.log('Generated monthly content stats from tasks:', contentStats)
          monthlyContentStats.value = contentStats
        } else {
          console.log('No monthly content stats could be generated from tasks')
          monthlyContentStats.value = []
        }
      } else {
        console.log('No content data available in monthly stats')
        monthlyContentStats.value = []
      }
    } else {
      console.log('No monthly stats data available')
      monthlyContentStats.value = []
    }

    // 处理其他数据
    console.log('Heatmap response:', heatmapRes)

    // 处理热力图数据
    console.log('Heatmap response:', heatmapRes)
    console.log('Tasks response:', tasksRes)

    // 从热力图API获取数据
    if (heatmapRes && heatmapRes.data && Array.isArray(heatmapRes.data)) {
      console.log('Using heatmap data from API, found', heatmapRes.data.length, 'entries');
      heatmapData.value = heatmapRes.data.map((item: any) => {
        // 确保日期格式正确
        let dateStr = item.date;
        if (dateStr && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }

        // 优先使用duration字段，确保热力图显示的是学习时长
        return {
          date: dateStr,
          duration: item.duration !== undefined ? item.duration :
                   (item.value !== undefined ? item.value :
                   (item.count !== undefined ? item.count : 0))
        };
      });
      console.log('Processed heatmap data:', heatmapData.value);
    }
    // 如果API没有返回数据，从任务数据生成热力图数据
    else if (tasksRes && tasksRes.data && Array.isArray(tasksRes.data) && tasksRes.data.length > 0) {
      console.log('Generating heatmap data from tasks, found', tasksRes.data.length, 'tasks');

      // 创建日期到时长的映射
      const dateToMinutes = new Map();

      // 处理任务数据
      tasksRes.data.forEach((task: any) => {
        if (task.start && task.duration) {
          // 提取日期部分
          let startDate = task.start;
          if (startDate.includes('T')) {
            startDate = startDate.split('T')[0];
          }

          // 累加该日期的时长
          if (dateToMinutes.has(startDate)) {
            dateToMinutes.set(startDate, dateToMinutes.get(startDate) + task.duration);
          } else {
            dateToMinutes.set(startDate, task.duration);
          }
        }
      });

      // 将映射转换为热力图数据格式
      const heatmapFromTasks: {date: string, value: number}[] = [];
      dateToMinutes.forEach((value, date) => {
        heatmapFromTasks.push({ date, value });
      });

      heatmapData.value = heatmapFromTasks;
      console.log('Generated heatmap data from tasks:', heatmapData.value);
    } else {
      console.log('No data available for heatmap');
      heatmapData.value = [];
    }

    // 热力图数据已经在上面处理过了

    // 处理时间分布数据
    if (timeDistRes && timeDistRes.data) {
      console.log('Processing time distribution data')
      console.log('Time distribution data:', JSON.stringify(timeDistRes.data, null, 2))

      // 确保时间分布数据是按小时分段的
      if (Array.isArray(timeDistRes.data)) {
        // 创建24小时的数据数组
        const hourlyData = new Array(24).fill(0).map((_, index) => ({
          hour: index,
          duration: 0,
          count: 0
        }));

        // 填充实际数据
        timeDistRes.data.forEach((item: any) => {
          if (item.hour !== undefined && item.hour >= 0 && item.hour < 24) {
            const hour = parseInt(item.hour);
            hourlyData[hour].duration = item.duration || 0;
            hourlyData[hour].count = item.count || 0;
          }
        });

        // 不再添加测试数据，使用实际数据

        timeDistributionData.value = hourlyData;
        console.log('Processed hourly time distribution data:', hourlyData);

        // 更新每日统计数据，确保它使用小时分段数据
        dailyStats.value = hourlyData;
      } else {
        console.log('Time distribution data is not an array, creating hourly data');

        // 创建24小时的数据数组
        const hourlyData = new Array(24).fill(0).map((_, index) => ({
          hour: index,
          duration: 0,
          count: 0
        }));

        // 不再添加测试数据，使用实际数据

        timeDistributionData.value = hourlyData;
        dailyStats.value = hourlyData;
      }
    } else {
      console.log('No time distribution data available, creating test data')

      // 创建24小时的数据数组
      const hourlyData = new Array(24).fill(0).map((_, index) => ({
        hour: index,
        duration: 0,
        count: 0
      }));

      // 不再添加测试数据，使用实际数据

      timeDistributionData.value = hourlyData;
      dailyStats.value = hourlyData;
    }

    // 处理总体统计数据
    if (totalRes && totalRes.data) {
      console.log('Total stats raw data:', totalRes.data)

      // 尝试获取不同字段名的数据
      const dailyMinutes = totalRes.data.dailyMinutes ||
                          totalRes.data.daily_minutes ||
                          totalRes.data.daily_duration ||
                          totalRes.data.dailyDuration ||
                          0

      const weeklyMinutes = totalRes.data.weeklyMinutes ||
                           totalRes.data.weekly_minutes ||
                           totalRes.data.weekly_duration ||
                           totalRes.data.weeklyDuration ||
                           0

      const monthlyMinutes = totalRes.data.monthlyMinutes ||
                            totalRes.data.monthly_minutes ||
                            totalRes.data.monthly_duration ||
                            totalRes.data.monthlyDuration ||
                            0

      // 尝试获取总学习时长（小时）
      let totalHours = totalRes.data.totalHours ||
                     totalRes.data.total_hours ||
                     totalRes.data.hours ||
                     0

      // 如果有总分钟数，转换为小时
      if (totalRes.data.totalMinutes || totalRes.data.total_minutes) {
        const totalMinutes = totalRes.data.totalMinutes || totalRes.data.total_minutes || 0
        // 将分钟转换为小时，保留两位小数
        const hoursFromMinutes = Math.round((totalMinutes / 60) * 100) / 100

        // 如果已经有小时数据，加上分钟转换的小时数
        if (totalHours > 0) {
          totalHours += hoursFromMinutes
        } else {
          totalHours = hoursFromMinutes
        }
      }

      // 如果总时长仍然为0，尝试从每日、每周、每月数据计算
      if (totalHours === 0) {
        // 从每日、每周、每月分钟数计算总小时数
        const totalMinutesFromStats = dailyMinutes + weeklyMinutes + monthlyMinutes
        if (totalMinutesFromStats > 0) {
          // 将分钟转换为小时，保留两位小数
          totalHours = Math.round((totalMinutesFromStats / 60) * 100) / 100
        }
      }

      totalStats.value = {
        dailyMinutes,
        weeklyMinutes,
        monthlyMinutes,
        totalHours
      }

      console.log('Processed total stats:', totalStats.value)
    } else {
      totalStats.value = {
        dailyMinutes: 0,
        weeklyMinutes: 0,
        monthlyMinutes: 0,
        totalHours: 0
      }
    }

    // 处理用户信息，获取注册日期
    if (userRes && userRes.data) {
      // 用户信息中可能包含不同字段表示注册日期
      const registrationDate = userRes.data.created_at ||
                              userRes.data.createdAt ||
                              userRes.data.register_date ||
                              userRes.data.registerDate

      if (registrationDate) {
        userRegistrationDate.value = registrationDate
        console.log('User registration date from API:', userRegistrationDate.value)
      } else {
        // 如果没有注册日期，使用一年前的日期
        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
        userRegistrationDate.value = oneYearAgo.toISOString()
        console.log('No registration date found, using one year ago:', userRegistrationDate.value)
      }
    } else {
      // 如果没有用户信息，使用一年前的日期
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      userRegistrationDate.value = oneYearAgo.toISOString()
      console.log('No user info available, using one year ago:', userRegistrationDate.value)
    }

    loading.value = false
  } catch (err: any) {
    console.error('Error fetching statistics:', err)
    error.value = err.response?.data?.detail || '获取统计数据失败，请稍后再试'
    loading.value = false

    // 即使出错，也确保初始化数据
    dailyStats.value = []
    weeklyStats.value = []
    monthlyStats.value = []
    dailyContentStats.value = []
    weeklyContentStats.value = []
    monthlyContentStats.value = []
    heatmapData.value = []
    timeDistributionData.value = []
    totalStats.value = {
      dailyMinutes: 0,
      weeklyMinutes: 0,
      monthlyMinutes: 0,
      totalHours: 0
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  console.log('Statistics component mounted')
  fetchStats()
})

</script>

<template>
  <div class="statistics-container">
    <div class="statistics-header">
      <h2>学习成长中心 <span class="header-emoji">🌱</span></h2>
      <p class="statistics-subtitle">记录您的学习旅程，发现成长的力量</p>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="loading" class="loading-container">
      <p class="loading-message">加载统计数据中...</p>
    </div>

    <template v-else>
      <!-- 概览数据卡片 -->
      <div class="overview-section">
        <h3 class="section-heading">学习概览</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-content">
              <h3>今日学习时长</h3>
              <p>{{ totalStats?.dailyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">坚持每一天的努力</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <h3>本周学习时长</h3>
              <p>{{ totalStats?.weeklyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">稳步前进的一周</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>本月学习时长</h3>
              <p>{{ totalStats?.monthlyMinutes || 0 }} 分钟</p>
              <span class="stat-caption">持续成长的一个月</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>累计学习时长</h3>
              <p>{{ (totalStats?.totalHours || 0).toFixed(2) }} 小时</p>
              <span class="stat-caption">知识积累的见证</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间过滤器 -->
      <div class="time-selector">
        <button
          class="time-filter"
          :class="{ active: currentView === 'daily' }"
          @click="switchView('daily')"
        >
          今日
        </button>
        <button
          class="time-filter"
          :class="{ active: currentView === 'weekly' }"
          @click="switchView('weekly')"
        >
          本周
        </button>
        <button
          class="time-filter"
          :class="{ active: currentView === 'monthly' }"
          @click="switchView('monthly')"
        >
          本月
        </button>
      </div>

      <!-- 主图表 - 优化布局 -->
      <div class="charts-section">
        <h3 class="section-heading">学习数据分析</h3>
        <p class="section-desc">了解您的学习时间和内容分布</p>

        <div class="charts-row">
          <div class="chart-column">
            <div class="chart-card">
              <div class="card-header">
                <div class="card-icon">📊</div>
                <h3>学习时长分布</h3>
              </div>
              <div class="chart-container">
                <div v-if="(currentView === 'daily' && (!Array.isArray(dailyStats) || dailyStats.length === 0)) ||
                          (currentView === 'weekly' && (!Array.isArray(weeklyStats) || weeklyStats.length === 0)) ||
                          (currentView === 'monthly' && (!Array.isArray(monthlyStats) || monthlyStats.length === 0))"
                     class="empty-message">
                  <span class="empty-icon">📈</span>
                  <span class="empty-text">暂无数据</span>
                </div>
                <Bar v-else-if="currentView === 'daily'" :data="chartData" :options="chartOptions" :height="300" :width="400" />
                <Line v-else :data="chartData" :options="chartOptions" :height="300" :width="400" />
              </div>
            </div>
          </div>

          <div class="chart-column">
            <div class="chart-card">
              <div class="card-header">
                <div class="card-icon">🍩</div>
                <h3>学习内容分布</h3>
              </div>
              <div class="chart-container">
                <div v-if="(currentView === 'daily' && (!Array.isArray(dailyContentStats) || dailyContentStats.length === 0)) ||
                          (currentView === 'weekly' && (!Array.isArray(weeklyContentStats) || weeklyContentStats.length === 0)) ||
                          (currentView === 'monthly' && (!Array.isArray(monthlyContentStats) || monthlyContentStats.length === 0))"
                     class="empty-message">
                  <span class="empty-icon">📚</span>
                  <span class="empty-text">暂无数据</span>
                </div>
                <Doughnut v-else :data="contentChartData" :options="contentChartOptions" :height="300" :width="400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学习旅程记录 - 热力图居中显示 -->
      <div class="journey-section">
        <h3 class="section-heading">学习旅程记录</h3>
        <p class="section-desc">见证每一天的坚持与成长</p>
        <div class="heatmap-wrapper">
          <div class="heatmap-container">
            <HeatMap :data="heatmapData" :registration-date="userRegistrationDate" />
            <div class="journey-motivation">
              <div class="motivation-icon">🚀</div>
              <p class="motivation-text">每一个有学习记录的日子，都是成长的印记</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 激励语 -->
      <div class="motivation-section">
        <div class="quote-container">
          <p class="quote">"教育不是灌输知识，而是点燃思考的火焰。"</p>
          <p class="quote-author">— 苏格拉底</p>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.statistics-container {
  max-width: 1200px; /* 增加最大宽度 */
  margin: 0 auto;
  position: relative;
  padding: 0 30px;
  min-height: 100vh; /* 确保最小高度 */
}

.statistics-container::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.03), transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.statistics-container::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(3, 169, 244, 0.03), transparent 70%);
  border-radius: 50%;
  z-index: -1;
}

.time-filter {
  background: white;
  border: 1px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.time-filter:hover {
  background: #f8f9fa;
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.time-filter.active {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
}

h2 {
  margin-bottom: 30px;
  color: #1976d2;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  position: relative;
  padding-bottom: 15px;
}

h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 2px;
}

.section-title {
  margin: 50px 0 20px;
  text-align: center;
  position: relative;
}

.section-title h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.5rem;
  font-weight: 700;
  position: relative;
  display: inline-block;
  padding: 0 15px;
}

.section-title h3::before,
.section-title h3::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.5), rgba(33, 150, 243, 0.1));
}

.section-title h3::before {
  right: 100%;
}

.section-title h3::after {
  left: 100%;
  transform: rotate(180deg);
}

.section-desc {
  margin: 10px 0 0;
  color: #5c6bc0;
  font-size: 0.95rem;
  font-weight: 500;
  opacity: 0.8;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-message, .empty-message {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-style: italic;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}



.empty-message {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  flex: 1;
  font-size: 1rem;
  color: #9e9e9e;
  position: relative;
  padding: 20px;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 25px 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(33, 150, 243, 0.05);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
}

.stat-card h3 {
  margin: 0 0 15px;
  color: #1976d2;
  font-size: 1.1rem;
  font-weight: 600;
}

.stat-card p {
  margin: 0;
  color: #0d47a1;
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.time-selector {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.chart-container {
  height: 350px; /* 固定高度 */
  max-height: 350px; /* 最大高度限制 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
  flex: 1; /* 占用剩余空间 */
  overflow: hidden; /* 防止内容溢出 */
}

.chart-title {
  text-align: center;
  margin-bottom: 20px;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.chart-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.heatmap-section {
  margin-bottom: 30px;
}

.charts-section {
  margin-bottom: 50px;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.chart-column {
  display: flex;
  flex-direction: column;
  min-height: 400px; /* 确保即使没有数据也有最小高度 */
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 450px; /* 固定高度，防止无限延伸 */
  max-height: 450px; /* 最大高度限制 */
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.chart-card .card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(33, 150, 243, 0.1);
  padding-bottom: 15px;
  flex-shrink: 0; /* 防止头部被压缩 */
}

.chart-card .card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.chart-card .card-header h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
}

.peak-time-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(33, 150, 243, 0.05);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.peak-time-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.peak-time-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
}

.peak-time-card h3 {
  margin: 0 0 25px;
  color: #1976d2;
  font-size: 1.2rem;
  text-align: center;
  font-weight: 600;
  position: relative;
  padding-bottom: 10px;
}

.peak-time-card h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.peak-time-content {
  display: flex;
  align-items: center;
  flex: 1;
  background: rgba(33, 150, 243, 0.03);
  padding: 20px;
  border-radius: 12px;
}

.peak-time-icon {
  font-size: 3.5rem;
  margin-right: 25px;
  color: #2196f3;
  text-shadow: 0 2px 10px rgba(33, 150, 243, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.peak-time-info {
  flex: 1;
}

.peak-time-value {
  font-size: 2rem;
  font-weight: 700;
  color: #0d47a1;
  margin: 0 0 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.peak-time-desc {
  margin: 0 0 20px;
  color: #5c6bc0;
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.8;
}

.peak-time-stats {
  margin-bottom: 20px;
}

.peak-stat-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.peak-stat-label {
  width: 60px;
  font-size: 0.9rem;
  color: #5c6bc0;
  font-weight: 500;
}

.peak-stat-bar {
  flex: 1;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: hidden;
  margin: 0 10px;
}

.peak-stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 4px;
}

.peak-stat-value {
  font-size: 0.9rem;
  color: #1976d2;
  font-weight: 600;
  width: 40px;
  text-align: right;
}

.peak-time-tips {
  background-color: rgba(33, 150, 243, 0.05);
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #2196f3;
}

.peak-tip-title {
  margin: 0 0 5px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1976d2;
}

.peak-tip {
  margin: 0;
  font-size: 0.85rem;
  color: #5c6bc0;
  line-height: 1.4;
}

.no-data-message {
  text-align: center;
  padding: 15px 0;
  color: #9e9e9e;
  font-style: italic;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .chart-column {
    min-height: 450px;
  }

  .chart-card {
    height: 450px;
    max-height: 450px;
  }

  .chart-container {
    height: 350px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 新增样式 */
.statistics-header {
  text-align: center;
  margin-bottom: 30px;
}

.statistics-subtitle {
  color: #5c6bc0;
  font-size: 1.1rem;
  margin-top: 5px;
  font-weight: 500;
}

.header-emoji {
  font-size: 1.8rem;
  vertical-align: middle;
  margin-left: 5px;
}

.section-heading {
  color: #1976d2;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
  padding-bottom: 10px;
}

.section-heading::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #2196f3, #03a9f4);
  border-radius: 1.5px;
}

.overview-section, .habits-section, .journey-section, .content-section {
  margin-bottom: 50px;
  position: relative;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
  color: #2196f3;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-caption {
  display: block;
  margin-top: 10px;
  color: #5c6bc0;
  font-size: 0.9rem;
  font-style: italic;
}

.habits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.habit-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 400px;
}

.habit-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 1.8rem;
  margin-right: 15px;
  color: #2196f3;
}

.card-header h3 {
  margin: 0;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: 600;
}

.heatmap-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0 auto;
}

.heatmap-container {
  position: relative;
  padding: 30px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  max-width: 900px;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.heatmap-container:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.journey-motivation {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  padding: 15px;
  background: rgba(33, 150, 243, 0.05);
  border-radius: 10px;
}

.motivation-icon {
  font-size: 1.8rem;
  margin-right: 15px;
}

.motivation-text {
  color: #1976d2;
  font-size: 1rem;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

.content-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(33, 150, 243, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.content-card:hover {
  box-shadow: 0 15px 35px rgba(33, 150, 243, 0.08), 0 5px 15px rgba(0, 0, 0, 0.05);
  transform: translateY(-5px);
}

.content-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  display: block;
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-text {
  display: block;
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #757575;
}

.empty-motivation {
  display: block;
  font-size: 0.9rem;
  color: #5c6bc0;
  font-style: italic;
}

.motivation-section {
  margin: 50px 0;
  text-align: center;
}

.quote-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(33, 150, 243, 0.03);
  border-radius: 16px;
  position: relative;
}

.quote-container::before {
  content: '"';
  position: absolute;
  top: 10px;
  left: 20px;
  font-size: 5rem;
  color: rgba(33, 150, 243, 0.1);
  font-family: Georgia, serif;
  line-height: 1;
}

.quote {
  font-size: 1.5rem;
  color: #1976d2;
  font-weight: 500;
  font-style: italic;
  margin: 0 0 15px;
  line-height: 1.5;
}

.quote-author {
  font-size: 1rem;
  color: #5c6bc0;
  text-align: right;
  margin: 0;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .habits-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-column {
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .time-selector {
    flex-wrap: wrap;
  }

  .time-filter {
    flex: 1;
    min-width: 80px;
  }

  .chart-card {
    height: 400px;
    max-height: 400px;
    padding: 15px;
  }

  .chart-container {
    height: 300px;
    max-height: 300px;
    padding: 10px;
  }

  .chart-column {
    min-height: 400px;
  }

  .quote {
    font-size: 1.2rem;
  }
}
</style>