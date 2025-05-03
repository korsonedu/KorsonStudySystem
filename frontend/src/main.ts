import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Create and mount app
const app = createApp(App)

// 使用路由
app.use(router)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Error info:', info)
}

// 挂载应用
app.mount('#app')

console.log('App initialized')
