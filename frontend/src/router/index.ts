import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { authService } from '../shared/services/authService';

// 导入各个应用的路由
import studyApp from '../apps/study';
import courseApp from '../apps/course';
import leaderboardApp from '../apps/leaderboard';
import quizApp from '../apps/quiz';

// 导入认证相关页面
import Login from '../shared/views/Login.vue';
import Register from '../shared/views/Register.vue';
import VerifyEmail from '../shared/views/VerifyEmail.vue';

// 合并所有应用的路由
const appRoutes: RouteRecordRaw[] = [
  ...studyApp.routes,
  ...courseApp.routes,
  ...leaderboardApp.routes,
  ...quizApp.routes
];

// 认证相关路由
const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: {
      requiresAuth: false,
      title: '注册'
    }
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: VerifyEmail,
    meta: {
      requiresAuth: false,
      title: '验证邮箱'
    }
  }
];

// 错误处理路由
const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/'
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...appRoutes,
    ...authRoutes,
    ...errorRoutes
  ]
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title as string || 'Korson学习系统';

  // 检查是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = authService.isLoggedIn.value || authService.checkAuth();

  if (requiresAuth && !isLoggedIn) {
    // 需要认证但未登录，重定向到登录页
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register') && isLoggedIn) {
    // 已登录但访问登录或注册页，重定向到首页
    next({ name: 'home' });
  } else {
    // 其他情况正常导航
    next();
  }
});

export default router;
