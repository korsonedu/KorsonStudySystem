import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { userService } from './shared/services/userService';
import { authService } from './shared/services/authService';
// 检查本地存储中的令牌 - 尝试多种可能的键名
function checkToken() {
    // 尝试多种可能的键名
    let token = localStorage.getItem('auth_token');
    if (!token)
        token = localStorage.getItem('token');
    // 如果找到令牌，确保它被正确存储在所有可能的键下
    if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('token', token);
        console.log('App.vue - Token found and synchronized across all keys');
        return token;
    }
    return null;
}
const token = checkToken();
console.log('App.vue - Token in localStorage:', token ? 'exists' : 'not found');
const route = useRoute();
// 计算属性：是否显示应用内导航栏
const showAppNavBar = computed(() => {
    // 在登录和注册页面不显示应用内导航栏
    return !['login', 'register'].includes(route.name);
});
// 计算属性：是否显示顶部状态栏
const showTopBar = computed(() => {
    // 在所有页面都显示顶部状态栏
    return true;
});
// 初始化时检查用户状态
onMounted(async () => {
    console.log('App.vue - App mounted');
    // 再次检查令牌，确保它在所有可能的键下都存在
    const token = checkToken();
    if (token) {
        console.log('App.vue - Token exists, setting up authentication');
        // 确保用户名存在
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', 'user');
            console.log('App.vue - Username not found, using default: user');
        }
        // 强制更新认证状态
        authService.checkAuth();
        userService.checkAuth();
        console.log('App.vue - Auth service says user is logged in:', authService.isLoggedIn.value);
        console.log('App.vue - User service says user is logged in:', userService.isLoggedIn.value);
        // 尝试获取当前用户信息
        try {
            console.log('App.vue - Trying to get current user');
            const user = await authService.getCurrentUser();
            if (user) {
                console.log('App.vue - Current user loaded:', user);
            }
            else {
                console.log('App.vue - No user data returned, but continuing with token auth');
            }
        }
        catch (err) {
            console.error('App.vue - Error loading current user:', err);
            console.log('App.vue - Continuing with token auth despite error');
        }
    }
    else {
        console.log('App.vue - No token found, user not logged in');
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map