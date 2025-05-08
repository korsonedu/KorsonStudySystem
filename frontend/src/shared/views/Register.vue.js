import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const invitationCode = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const loading = ref(false);
const router = useRouter();
const register = async () => {
    try {
        errorMessage.value = '';
        successMessage.value = '';
        loading.value = true;
        // 表单验证
        if (!username.value || !password.value) {
            errorMessage.value = '用户名和密码不能为空';
            loading.value = false;
            return;
        }
        if (password.value !== confirmPassword.value) {
            errorMessage.value = '两次输入的密码不一致';
            loading.value = false;
            return;
        }
        // 创建用户对象
        const userData = {
            username: username.value,
            email: email.value || undefined, // 如果为空字符串则设为undefined
            password: password.value,
            invitation_code: invitationCode.value || undefined // 添加邀请码
        };
        // 使用认证服务发送注册请求
        const success = await authService.register(userData);
        if (success) {
            // 注册成功，显示成功消息和邮箱验证提示
            successMessage.value = '注册成功！我们已向您的邮箱发送了验证链接，请查收并点击链接完成验证。验证后即可登录。';
            // 清空表单
            username.value = '';
            email.value = '';
            password.value = '';
            confirmPassword.value = '';
            invitationCode.value = '';
            // 延迟5秒后跳转到登录页，让用户有足够时间阅读提示信息
            setTimeout(() => {
                router.push('/login');
            }, 5000);
        }
        else {
            // 注册失败，显示错误信息
            errorMessage.value = authService.error.value || '注册失败，请稍后再试';
        }
    }
    catch (error) {
        console.error('注册失败:', error);
        errorMessage.value = error.response?.data?.detail || '注册失败，请稍后再试';
    }
    finally {
        loading.value = false;
    }
};
const goToLogin = () => {
    router.push('/login');
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['register-card']} */ ;
/** @type {__VLS_StyleScopedClasses['primary-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['secondary-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['login-link']} */ ;
/** @type {__VLS_StyleScopedClasses['login-link']} */ ;
/** @type {__VLS_StyleScopedClasses['register-card']} */ ;
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
//# sourceMappingURL=Register.vue.js.map