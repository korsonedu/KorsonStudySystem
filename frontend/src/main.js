import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
// Create and mount app
const app = createApp(App);
// 使用路由
app.use(router);
// 全局错误处理
app.config.errorHandler = (err, _instance, _info) => {
    // 生产环境中只记录错误，不输出到控制台
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err);
    }
};
// 挂载应用
app.mount('#app');
//# sourceMappingURL=main.js.map