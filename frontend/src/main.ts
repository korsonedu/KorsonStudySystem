import { createApp } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import './style.css'
import App from './App.vue'
import { authService } from './shared/services/authService'

// Import pages
import Home from './apps/study/views/Home.vue'
import Statistics from './apps/study/views/Statistics.vue'
import Achievements from './apps/study/views/Achievements.vue'
import Login from './shared/views/Login.vue'
import Register from './shared/views/Register.vue'
import VerifyEmail from './shared/views/VerifyEmail.vue'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/statistics',
    component: Statistics,
    meta: { requiresAuth: true }
  },
  {
    path: '/achievements',
    component: Achievements,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/verify-email',
    component: VerifyEmail
  }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，检查用户是否已登录
router.beforeEach((to, from, next) => {
  // 使用认证服务检查登录状态
  const isAuthenticated = authService.checkAuth()

  // 如果需要认证但用户未登录，重定向到登录页
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

// Create and mount app
const app = createApp(App)
app.use(router)
app.mount('#app')
