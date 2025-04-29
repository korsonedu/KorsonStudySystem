const routes = [
  { path: '/', component: () => import('@/views/Kanban.vue') },
  { path: '/statistics', component: () => import('@/views/Statistics.vue') },
  { path: '/achievements', component: () => import('@/views/Achievements.vue') }
]

export default new VueRouter({
  mode: 'history',
  routes
}) // 移除末尾分号