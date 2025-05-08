import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import * as Icons from '@ant-design/icons-vue'

// Create and mount app
const app = createApp(App)

// 使用路由
app.use(router)
// 使用Ant Design Vue
app.use(Antd)

// 注册所有图标组件
for (const [key, component] of Object.entries(Icons)) {
  app.component(key, component)
}

// 全局错误处理
app.config.errorHandler = (err, _instance, _info) => {
  // 生产环境中只记录错误，不输出到控制台
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err)
  }
}

// 挂载应用
app.mount('#app')
