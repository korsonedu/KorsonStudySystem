import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
// @ts-ignore
import { userService } from '../shared/services/userService'
import { authService } from '../shared/services/authService'

// 检查令牌函数 - 尝试多种可能的键名
function checkToken() {
  // 尝试多种可能的键名
  let token = localStorage.getItem('auth_token');
  if (!token) token = localStorage.getItem('token');

  // 如果找到令牌，确保它被正确存储在所有可能的键下
  if (token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);
    return token;
  }

  return null;
}

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
  // 检查令牌是否存在
  const token = checkToken();

  // 如果令牌存在，确保用户名也存在
  if (token && !localStorage.getItem('username')) {
    localStorage.setItem('username', 'user');
  }

  // 使用两个服务检查登录状态
  const isAuthenticatedUser = userService.checkAuth();
  const isAuthenticatedAuth = authService.checkAuth();
  const isAuthenticated = isAuthenticatedUser || isAuthenticatedAuth || !!token;

  console.log(`路由守卫 - 路径: ${to.path}`);
  console.log(`路由守卫 - 是否已登录: ${isAuthenticated}`);
  console.log(`路由守卫 - Token: ${!!token}`);
  console.log(`路由守卫 - User Service: ${isAuthenticatedUser}`);
  console.log(`路由守卫 - Auth Service: ${isAuthenticatedAuth}`);

  // 如果用户已登录且尝试访问登录或注册页面，重定向到主页
  if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    console.log('路由守卫 - 已登录用户尝试访问登录/注册页面，重定向到主页');
    next({ path: '/', replace: true });
    return;
  }

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
