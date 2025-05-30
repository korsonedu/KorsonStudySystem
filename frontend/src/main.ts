import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 导入CSS文件 - 按照优先级顺序排列
// 1. 首先导入变量定义 - 所有CSS变量的单一来源
import './assets/css/variables.css'

// 2. 导入shadcn-vue全局CSS
import './assets/global.css'

// 3. 导入基础样式
import './style.css'

// 4. 导入自定义组件和布局样式
import './assets/css/components.css'
import './assets/css/layout.css'
import './assets/css/animations.css'

// 5. 导入认证相关样式
import './assets/css/auth.css'

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
