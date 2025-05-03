import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { userService } from '../services/userService';
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
        loading.value = true;
        // 表单验证
        if (!username.value || !password.value || !email.value || !invitationCode.value) {
            errorMessage.value = '用户名、邮箱、密码和邀请码不能为空';
            loading.value = false;
            return;
        }
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            errorMessage.value = '请输入有效的邮箱地址';
            loading.value = false;
            return;
        }
        if (password.value !== confirmPassword.value) {
            errorMessage.value = '两次输入的密码不一致';
            loading.value = false;
            return;
        }
        // 验证邀请码
        if (invitationCode.value !== 'korsonacademy') {
            errorMessage.value = '邀请码不正确';
            loading.value = false;
            return;
        }
        // 创建用户对象
        const userData = {
            username: username.value,
            email: email.value || undefined, // 如果为空字符串则设为undefined
            password: password.value,
            invitation_code: invitationCode.value
        };
        // 使用用户服务发送注册请求
        const success = await userService.register(userData);
        if (success) {
            // 注册成功，显示成功消息
            successMessage.value = '注册成功！正在跳转到登录页面...';
            // 清空表单
            username.value = '';
            email.value = '';
            password.value = '';
            confirmPassword.value = '';
            invitationCode.value = '';
            // 3秒后自动跳转到登录页
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        }
        else {
            // 注册失败，显示错误信息
            errorMessage.value = userService.error.value;
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