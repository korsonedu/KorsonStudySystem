import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/userStore'

// 导入共享视图
import Login from '../shared/views/Login.vue'
import Register from '../shared/views/Register.vue'
import VerifyEmail from '../shared/views/VerifyEmail.vue'
import AntTest from '../shared/components/AntTest.vue'

// 导入学习追踪系统视图
import StudyHome from '../apps/study/views/Home.vue'
import StudyStatistics from '../apps/study/views/Statistics.vue'
import StudyAchievements from '../apps/study/views/Achievements.vue'
import PomodoroTimer from '../apps/study/views/PomodoroTimer.vue'

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
  {
    path: '/pomodoro',
    component: PomodoroTimer,
    name: 'pomodoro',
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
  },
  {
    path: '/profile',
    component: () => import('../shared/views/Profile.vue'),
    name: 'profile',
    meta: { requiresAuth: true }
  },
  // Ant Design测试路由
  {
    path: '/ant-test',
    component: AntTest,
    name: 'ant-test'
  }
]

// 创建路由
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查用户是否已登录
router.beforeEach((to, from, next) => {
  console.log(`路由守卫 - 开始处理路由: ${from.path} -> ${to.path}`);

  // 如果用户正在访问登录页或注册页，直接允许访问
  if (to.path === '/login' || to.path === '/register') {
    console.log('路由守卫 - 用户正在访问登录/注册页面，直接允许访问');
    next();
    return;
  }

  // 使用Pinia store检查登录状态
  const userStore = useUserStore();
  const isAuthenticated = userStore.checkAuth();

  console.log(`路由守卫 - 认证状态:`, {
    isAuthenticated,
    username: userStore.username,
    path: to.path,
    requiresAuth: !!to.meta.requiresAuth
  });

  // 如果需要认证但用户未登录，重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('路由守卫 - 未登录用户尝试访问需要认证的页面，重定向到登录页');
    next({ path: '/login', replace: true });
  } else {
    console.log('路由守卫 - 允许访问');
    next();
  }
})

export default router
