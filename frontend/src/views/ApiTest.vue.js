import { ref, onMounted } from 'vue';
// 状态变量
const username = ref('');
const tokenPreview = ref('');
const basicConnectionResult = ref('');
const basicConnectionSuccess = ref(false);
const authResult = ref('');
const authSuccess = ref(false);
const taskResult = ref('');
const taskSuccess = ref(false);
// URL选项
const urls = [
    '/api/study/tasks/',
    '/api/study/tasks',
    'http://127.0.0.1:8000/api/study/tasks/',
    'http://localhost:8000/api/study/tasks/'
];
const selectedUrl = ref(urls[0]);
// 获取用户信息
onMounted(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('username');
    username.value = user || '';
    if (token) {
        tokenPreview.value = `${token.substring(0, 15)}...`;
    }
});
// 测试基本连接
const testBasicConnection = async () => {
    basicConnectionResult.value = '测试中...';
    basicConnectionSuccess.value = false;
    try {
        // 尝试不同的端点
        const endpoints = [
            '/api/ping',
            '/api/health',
            '/api'
        ];
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    basicConnectionResult.value = `连接成功! 端点: ${endpoint}, 状态: ${response.status}`;
                    basicConnectionSuccess.value = true;
                    return;
                }
            }
            catch (e) {
                console.error(`Error with endpoint ${endpoint}:`, e);
            }
        }
        // 如果所有端点都失败，尝试直接连接后端
        try {
            const response = await fetch('http://127.0.0.1:8000/api');
            if (response.ok) {
                basicConnectionResult.value = `直接连接成功! 状态: ${response.status}`;
                basicConnectionSuccess.value = true;
                return;
            }
        }
        catch (e) {
            console.error('Error with direct connection:', e);
        }
        basicConnectionResult.value = '所有连接尝试均失败，请确保后端服务器正在运行';
    }
    catch (err) {
        basicConnectionResult.value = `错误: ${err.message}`;
        console.error('Connection test error:', err);
    }
};
// 测试认证
const testAuthentication = async () => {
    authResult.value = '测试中...';
    authSuccess.value = false;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            authResult.value = '错误: 无认证令牌，请先登录';
            return;
        }
        // 尝试获取用户信息
        try {
            // 确保令牌格式正确
            const cleanToken = token.trim();
            console.log('Using token for auth test:', cleanToken.substring(0, 20) + '...');
            const response = await fetch('/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${cleanToken}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                authResult.value = `认证成功! 用户ID: ${data.id}, 用户名: ${data.username}`;
                authSuccess.value = true;
                return;
            }
            else {
                authResult.value = `认证失败，状态码: ${response.status}`;
                try {
                    const errorText = await response.text();
                    authResult.value += `\n错误: ${errorText}`;
                }
                catch (e) { }
            }
        }
        catch (e) {
            authResult.value = `请求错误: ${e.message}`;
        }
        // 尝试直接连接
        try {
            const response = await fetch('http://127.0.0.1:8000/api/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                authResult.value = `直接连接认证成功! 用户ID: ${data.id}, 用户名: ${data.username}`;
                authSuccess.value = true;
                return;
            }
        }
        catch (e) {
            console.error('Error with direct auth:', e);
        }
    }
    catch (err) {
        authResult.value = `错误: ${err.message}`;
        console.error('Auth test error:', err);
    }
};
// 测试任务创建
const testTaskCreation = async () => {
    taskResult.value = '测试中...';
    taskSuccess.value = false;
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            taskResult.value = '错误: 无认证令牌，请先登录';
            return;
        }
        // 创建测试任务
        const testTask = {
            name: '测试任务-' + new Date().toISOString(),
            duration: 1,
            completed: true,
            start: new Date().toISOString(),
            end: new Date().toISOString()
        };
        try {
            taskResult.value = `尝试URL: ${selectedUrl.value}...`;
            // 确保令牌格式正确
            const cleanToken = token.trim();
            console.log('Using token for task creation:', cleanToken.substring(0, 20) + '...');
            // 构建请求头
            const headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('Authorization', `Bearer ${cleanToken}`);
            // 检查请求头是否有效
            console.log('Request headers:', [...headers.entries()]);
            const response = await fetch(selectedUrl.value, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(testTask)
            });
            if (response.ok) {
                const data = await response.json();
                taskResult.value = `任务创建成功! ID: ${data.id}`;
                taskSuccess.value = true;
                return;
            }
            else {
                taskResult.value = `创建失败，状态码: ${response.status}`;
                try {
                    const errorText = await response.text();
                    taskResult.value += `\n错误: ${errorText}`;
                }
                catch (e) { }
            }
        }
        catch (e) {
            taskResult.value = `请求错误: ${e.message}`;
        }
    }
    catch (err) {
        taskResult.value = `错误: ${err.message}`;
        console.error('Task creation test error:', err);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['test-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['url-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-link']} */ ;
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
//# sourceMappingURL=ApiTest.vue.js.map