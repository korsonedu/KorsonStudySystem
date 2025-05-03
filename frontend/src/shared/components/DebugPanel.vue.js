import { ref, onMounted } from 'vue';
import axios from 'axios';
// 调试结果状态
const debugData = ref(null);
const loading = ref(false);
const error = ref('');
// 测试接口状态
const testEndpointStatus = ref({
    test: { status: 'pending', data: null, error: null },
    tasksDebug: { status: 'pending', data: null, error: null },
    tasks: { status: 'pending', data: null, error: null },
    plans: { status: 'pending', data: null, error: null },
});
// 执行所有API调试
const testAllEndpoints = async () => {
    loading.value = true;
    error.value = '';
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    // 测试基本API接口
    try {
        testEndpointStatus.value.test.status = 'loading';
        const testResponse = await axios.get('http://127.0.0.1:8000/api/test');
        testEndpointStatus.value.test = {
            status: 'success',
            data: testResponse.data,
            error: null
        };
    }
    catch (err) {
        testEndpointStatus.value.test = {
            status: 'error',
            data: null,
            error: err.message + (err.response ? ` (${err.response.status})` : '')
        };
    }
    // 测试调试API接口
    try {
        testEndpointStatus.value.tasksDebug.status = 'loading';
        const debugResponse = await axios.get('http://127.0.0.1:8000/api/tasks/debug', {
            headers: authHeader
        });
        testEndpointStatus.value.tasksDebug = {
            status: 'success',
            data: debugResponse.data,
            error: null
        };
    }
    catch (err) {
        testEndpointStatus.value.tasksDebug = {
            status: 'error',
            data: null,
            error: err.message + (err.response ? ` (${err.response.status})` : '')
        };
    }
    // 测试任务API接口
    try {
        testEndpointStatus.value.tasks.status = 'loading';
        const tasksResponse = await axios.get('http://127.0.0.1:8000/api/study/tasks', {
            headers: authHeader
        });
        testEndpointStatus.value.tasks = {
            status: 'success',
            data: tasksResponse.data,
            error: null
        };
    }
    catch (err) {
        testEndpointStatus.value.tasks = {
            status: 'error',
            data: null,
            error: err.message + (err.response ? ` (${err.response.status})` : '')
        };
    }
    // 测试计划API接口
    try {
        testEndpointStatus.value.plans.status = 'loading';
        const plansResponse = await axios.get('http://127.0.0.1:8000/api/study/plans', {
            headers: authHeader
        });
        testEndpointStatus.value.plans = {
            status: 'success',
            data: plansResponse.data,
            error: null
        };
    }
    catch (err) {
        testEndpointStatus.value.plans = {
            status: 'error',
            data: null,
            error: err.message + (err.response ? ` (${err.response.status})` : '')
        };
    }
    loading.value = false;
};
// 测试创建单个任务
const testTaskCreation = async () => {
    try {
        loading.value = true;
        error.value = '';
        const token = localStorage.getItem('token');
        if (!token) {
            error.value = '没有认证令牌，请先登录';
            loading.value = false;
            return;
        }
        // 获取当前时间作为结束时间
        const currentTime = new Date();
        // 计算开始时间（当前时间减去任务时长）
        const startTime = new Date(currentTime.getTime() - 25 * 60 * 1000);
        const testTask = {
            name: '测试任务 ' + new Date().toLocaleTimeString(),
            duration: 25,
            completed: true,
            start: startTime.toISOString(),
            end: currentTime.toISOString()
        };
        const response = await axios.post('http://127.0.0.1:8000/api/study/tasks', testTask, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        debugData.value = {
            status: 'success',
            message: '任务创建成功',
            requestData: testTask,
            responseData: response.data
        };
        loading.value = false;
    }
    catch (err) {
        console.error('测试创建任务失败:', err);
        debugData.value = {
            status: 'error',
            message: '任务创建失败',
            error: err.message,
            requestError: err.request ? '请求错误' : (err.response ? `服务器返回 ${err.response.status}` : '未知错误'),
            errorDetails: err.response ? err.response.data : null
        };
        error.value = err.response?.data?.detail || '任务创建失败，请检查控制台查看详细错误';
        loading.value = false;
    }
};
// 组件加载时自动执行测试
onMounted(() => {
    // 暂不自动运行，需要用户手动点击按钮
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['loading-message']} */ ;
/** @type {__VLS_StyleScopedClasses['error-message']} */ ;
/** @type {__VLS_StyleScopedClasses['result-status']} */ ;
/** @type {__VLS_StyleScopedClasses['result-status']} */ ;
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
//# sourceMappingURL=DebugPanel.vue.js.map