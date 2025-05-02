import { onMounted } from 'vue';
import { userService } from './services/userService';
// 初始化时检查用户状态
onMounted(() => {
    // 检查用户登录状态
    userService.checkAuth();
    // 如果有令牌，尝试获取当前用户信息
    if (userService.isLoggedIn.value) {
        userService.getCurrentUser()
            .then(user => {
            if (user) {
                console.log('Current user loaded:', user);
            }
        })
            .catch(err => {
            console.error('Error loading current user:', err);
        });
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