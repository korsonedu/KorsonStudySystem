import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import axios from 'axios';

// 全局配置 axios 基础 URL
axios.defaults.baseURL = 'http://localhost:8000/api';

const app = createApp(App);
app.use(router);
app.mount('#app');