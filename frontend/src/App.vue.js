import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { userService } from './shared/services/userService';
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
onMounted(() => {
    console.log('App mounted');
    // 检查用户登录状态
    const isLoggedIn = userService.checkAuth();
    console.log('User is logged in:', isLoggedIn);
    // 如果有令牌，尝试获取当前用户信息
    if (userService.isLoggedIn.value) {
        console.log('Trying to get current user');
        userService.getCurrentUser()
            .then(user => {
            if (user) {
                console.log('Current user loaded:', user);
            }
            else {
                console.log('No user data returned');
            }
        })
            .catch(err => {
            console.error('Error loading current user:', err);
        });
    }
    else {
        console.log('No token found, user not logged in');
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