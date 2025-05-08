import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { apiService } from '../services/apiService';
import { API_CONFIG } from '../../config';
// 检查本地存储中的令牌
const token = localStorage.getItem('auth_token');
console.log('Login.vue - Token in localStorage:', token ? 'exists' : 'not found');
// 组件挂载时检查登录状态
onMounted(() => {
    console.log('Login.vue - 组件挂载，检查登录状态');
    // 检查用户是否已登录
    const isAuthenticatedUser = userService.checkAuth();
    const isAuthenticatedAuth = authService.checkAuth();
    const isAuthenticated = isAuthenticatedUser || isAuthenticatedAuth || !!token;
    console.log('Login.vue - 登录状态检查结果:', {
        isAuthenticatedUser,
        isAuthenticatedAuth,
        token: !!token,
        isAuthenticated
    });
    // 如果已登录，重定向到首页
    if (isAuthenticated) {
        console.log('Login.vue - 用户已登录，重定向到首页');
        router.replace('/');
    }
});
const username = ref('');
const password = ref('');
const email = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);
const showResendVerification = ref(false);
const resendLoading = ref(false);
const router = useRouter();
const login = async () => {
    try {
        errorMessage.value = '';
        loading.value = true;
        console.log('Login.vue - 开始登录流程');
        if (!username.value || !password.value) {
            errorMessage.value = '请输入用户名和密码';
            loading.value = false;
            return;
        }
        // 使用认证服务进行登录
        console.log('Login.vue - 调用 authService.login');
        const loginResult = await authService.login({
            username: username.value,
            password: password.value
        });
        console.log('Login.vue - 登录结果:', loginResult);
        // 检查登录后的令牌
        const token = localStorage.getItem('auth_token');
        console.log('Login.vue - 登录后 Token in localStorage:', token ? 'exists' : 'not found');
        // 如果令牌存在，检查格式
        if (token && !token.startsWith('Bearer ')) {
            console.log('Login.vue - 令牌格式不正确，添加 Bearer 前缀');
            const correctedToken = `Bearer ${token}`;
            localStorage.setItem('auth_token', correctedToken);
            localStorage.setItem('token', correctedToken);
            console.log('Login.vue - 令牌已修正');
        }
        if (loginResult) {
            console.log('Login.vue - 登录成功，用户状态已更新');
            // 检查 authService 中的用户状态
            console.log('Login.vue - authService.currentUser:', authService.currentUser.value);
            console.log('Login.vue - authService.isLoggedIn:', authService.isLoggedIn.value);
            // 重定向到首页
            router.push('/');
        }
        else {
            console.error('Login.vue - 登录失败:', authService.error.value);
            errorMessage.value = authService.error.value || '登录失败';
        }
    }
    catch (error) {
        console.error('Login.vue - 登录异常:', error);
        if (error.response) {
            console.error('Login.vue - 错误详情:', error.response.data);
            // 检查是否是邮箱未验证的错误
            if (error.response.data.detail === "邮箱未验证，请检查您的邮箱并点击验证链接") {
                errorMessage.value = "邮箱未验证，请检查您的邮箱并点击验证链接";
                showResendVerification.value = true;
                // 保存用户名，用于重新发送验证邮件
                email.value = username.value;
            }
            else {
                errorMessage.value = error.response.data.detail || '登录失败，请检查用户名和密码';
            }
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
// 重新发送验证邮件
const resendVerificationEmail = async () => {
    try {
        resendLoading.value = true;
        errorMessage.value = '';
        successMessage.value = '';
        // 确保有邮箱地址
        if (!email.value) {
            errorMessage.value = '请输入您的邮箱地址';
            return;
        }
        // 调用重新发送验证邮件API
        const response = await apiService.post(API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION, { email: email.value });
        // 显示成功消息
        successMessage.value = response.data.message || '验证邮件已重新发送，请查收';
        showResendVerification.value = false;
    }
    catch (error) {
        console.error('重新发送验证邮件失败:', error);
        errorMessage.value = error.response?.data?.detail || '重新发送验证邮件失败，请稍后再试';
    }
    finally {
        resendLoading.value = false;
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['resend-verification']} */ ;
/** @type {__VLS_StyleScopedClasses['register-link']} */ ;
/** @type {__VLS_StyleScopedClasses['register-link']} */ ;
/** @type {__VLS_StyleScopedClasses['login-card']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
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