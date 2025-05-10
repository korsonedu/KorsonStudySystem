import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './assets/global.css' // Import shadcn-vue global CSS
import App from './App.vue'
import router from './router'

// 创建Pinia实例
const pinia = createPinia()

// Create and mount app
const app = createApp(App)

// 使用路由和Pinia
app.use(router)
app.use(pinia)

// 全局错误处理
app.config.errorHandler = (err, _instance, _info) => {
  // 生产环境中只记录错误，不输出到控制台
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err)
  }
}

// 挂载应用
app.mount('#app')
