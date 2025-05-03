import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
// @ts-ignore
import { userService } from '../shared/services/userService'

// 导入共享视图
import Login from '../shared/views/Login.vue'
import Register from '../shared/views/Register.vue'
import VerifyEmail from '../shared/views/VerifyEmail.vue'

// 导入学习追踪系统视图
import StudyHome from '../apps/study/views/Home.vue'
import StudyStatistics from '../apps/study/views/Statistics.vue'
import StudyAchievements from '../apps/study/views/Achievements.vue'

// 课程系统视图（未来实现）
const CourseHome = { template: '<div>课程系统 - 开发中</div>' }

// 排行榜系统视图（未来实现）
const LeaderboardHome = { template: '<div>排行榜系统 - 开发中</div>' }

// 题库系统视图（未来实现）
const QuizHome = { template: '<div>题库系统 - 开发中</div>' }

// 定义路由
const routes: RouteRecordRaw[] = [
  // 默认重定向到学习追踪系统
  {
    path: '/',
    redirect: '/study',
    name: 'home'
  },

  // 学习追踪系统路由
  {
    path: '/study',
    component: StudyHome,
    name: 'study',
    meta: { requiresAuth: true, app: 'study' }
  },
  {
    path: '/statistics',
    component: StudyStatistics,
    name: 'statistics',
    meta: { requiresAuth: true, app: 'study' }
  },
  {
    path: '/achievements',
    component: StudyAchievements,
    name: 'achievements',
    meta: { requiresAuth: true, app: 'study' }
  },

  // 课程系统路由
  {
    path: '/course',
    component: CourseHome,
    name: 'course',
    meta: { requiresAuth: true, app: 'course' }
  },

  // 排行榜系统路由
  {
    path: '/leaderboard',
    component: LeaderboardHome,
    name: 'leaderboard',
    meta: { requiresAuth: true, app: 'leaderboard' }
  },

  // 题库系统路由
  {
    path: '/quiz',
    component: QuizHome,
    name: 'quiz',
    meta: { requiresAuth: true, app: 'quiz' }
  },

  // 认证相关路由
  {
    path: '/login',
    component: Login,
    name: 'login'
  },
  {
    path: '/register',
    component: Register,
    name: 'register'
  },
  {
    path: '/verify-email',
    component: VerifyEmail,
    name: 'verify-email'
  }
]

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查用户是否已登录
router.beforeEach((to, _from, next) => {
  // 使用用户服务检查登录状态
  const isAuthenticated = userService.checkAuth()

  // 如果需要认证但用户未登录，重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
