import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '../services/userService';
const username = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);
const router = useRouter();
const login = async () => {
    try {
        errorMessage.value = '';
        loading.value = true;
        if (!username.value || !password.value) {
            errorMessage.value = '请输入用户名和密码';
            loading.value = false;
            return;
        }
        // 使用用户服务进行登录
        const loginResult = await userService.login({
            username: username.value,
            password: password.value
        });
        if (loginResult) {
            console.log('Login successful, user state updated');
            // 重定向到首页
            router.push('/');
        }
        else {
            errorMessage.value = userService.error.value || '登录失败';
        }
    }
    catch (error) {
        console.error('登录失败:', error);
        if (error.response) {
            console.error('错误详情:', error.response.data);
            errorMessage.value = error.response.data.detail || '登录失败，请检查用户名和密码';
        }
        else {
            errorMessage.value = '登录失败，请检查网络连接';
        }
    }
    finally {
        loading.value = false;
    }
};
const goToRegister = () => {
    router.push('/register');
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['primary-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-btn']} */ ;
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
//# sourceMappingURL=Login.vue.js.map