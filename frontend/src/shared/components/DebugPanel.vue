<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 调试结果状态
const debugData = ref<any>(null)
const loading = ref(false)
const error = ref('')

// 测试接口状态
const testEndpointStatus = ref({
  test: { status: 'pending', data: null, error: null as string | null },
  tasksDebug: { status: 'pending', data: null, error: null as string | null },
  tasks: { status: 'pending', data: null, error: null as string | null },
  plans: { status: 'pending', data: null, error: null as string | null },
})

// 执行所有API调试
const testAllEndpoints = async () => {
  loading.value = true
  error.value = ''
  const token = localStorage.getItem('token')
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  // 测试基本API接口
  try {
    testEndpointStatus.value.test.status = 'loading'
    const testResponse = await axios.get('http://127.0.0.1:8000/api/test')
    testEndpointStatus.value.test = {
      status: 'success',
      data: testResponse.data,
      error: null
    }
  } catch (err: any) {
    testEndpointStatus.value.test = {
      status: 'error',
      data: null,
      error: err.message + (err.response ? ` (${err.response.status})` : '')
    }
  }

  // 测试调试API接口
  try {
    testEndpointStatus.value.tasksDebug.status = 'loading'
    const debugResponse = await axios.get('http://127.0.0.1:8000/api/tasks/debug', {
      headers: authHeader
    })
    testEndpointStatus.value.tasksDebug = {
      status: 'success',
      data: debugResponse.data,
      error: null
    }
  } catch (err: any) {
    testEndpointStatus.value.tasksDebug = {
      status: 'error',
      data: null,
      error: err.message + (err.response ? ` (${err.response.status})` : '')
    }
  }

  // 测试任务API接口
  try {
    testEndpointStatus.value.tasks.status = 'loading'
    const tasksResponse = await axios.get('http://127.0.0.1:8000/api/tasks', {
      headers: authHeader
    })
    testEndpointStatus.value.tasks = {
      status: 'success',
      data: tasksResponse.data,
      error: null
    }
  } catch (err: any) {
    testEndpointStatus.value.tasks = {
      status: 'error',
      data: null,
      error: err.message + (err.response ? ` (${err.response.status})` : '')
    }
  }

  // 测试计划API接口
  try {
    testEndpointStatus.value.plans.status = 'loading'
    const plansResponse = await axios.get('http://127.0.0.1:8000/api/plans', {
      headers: authHeader
    })
    testEndpointStatus.value.plans = {
      status: 'success',
      data: plansResponse.data,
      error: null
    }
  } catch (err: any) {
    testEndpointStatus.value.plans = {
      status: 'error',
      data: null,
      error: err.message + (err.response ? ` (${err.response.status})` : '')
    }
  }

  loading.value = false
}

// 测试创建单个任务
const testTaskCreation = async () => {
  try {
    loading.value = true
    error.value = ''
    const token = localStorage.getItem('token')
    
    if (!token) {
      error.value = '没有认证令牌，请先登录'
      loading.value = false
      return
    }

    // 获取当前时间作为结束时间
    const currentTime = new Date()
    // 计算开始时间（当前时间减去任务时长）
    const startTime = new Date(currentTime.getTime() - 25 * 60 * 1000)

    const testTask = {
      name: '测试任务 ' + new Date().toLocaleTimeString(),
      duration: 25,
      completed: true,
      start: startTime.toISOString(),
      end: currentTime.toISOString()
    }

    const response = await axios.post('http://127.0.0.1:8000/api/tasks', testTask, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    debugData.value = {
      status: 'success',
      message: '任务创建成功',
      requestData: testTask,
      responseData: response.data
    }
    
    loading.value = false
  } catch (err: any) {
    console.error('测试创建任务失败:', err)
    
    debugData.value = {
      status: 'error',
      message: '任务创建失败',
      error: err.message,
      requestError: err.request ? '请求错误' : (err.response ? `服务器返回 ${err.response.status}` : '未知错误'),
      errorDetails: err.response ? err.response.data : null
    }
    
    error.value = err.response?.data?.detail || '任务创建失败，请检查控制台查看详细错误'
    loading.value = false
  }
}

// 组件加载时自动执行测试
onMounted(() => {
  // 暂不自动运行，需要用户手动点击按钮
})
</script>

<template>
  <div class="debug-panel">
    <h2>API 调试面板</h2>
    
    <div class="debug-controls">
      <button @click="testAllEndpoints" :disabled="loading" class="btn btn-primary">
        测试所有API接口
      </button>
      <button @click="testTaskCreation" :disabled="loading" class="btn btn-success">
        测试创建任务
      </button>
    </div>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="loading" class="loading-message">正在执行API调试...</div>

    <!-- API 端点测试结果 -->
    <div class="endpoint-tests" v-if="testEndpointStatus.test.status !== 'pending'">
      <h3>API端点测试结果</h3>
      
      <div class="endpoint-item">
        <div class="endpoint-header">
          <span class="endpoint-name">/api/test</span>
          <span :class="'endpoint-status status-' + testEndpointStatus.test.status">
            {{ testEndpointStatus.test.status === 'success' ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
        <div v-if="testEndpointStatus.test.error" class="endpoint-error">
          {{ testEndpointStatus.test.error }}
        </div>
        <pre v-if="testEndpointStatus.test.data" class="endpoint-data">{{ JSON.stringify(testEndpointStatus.test.data, null, 2) }}</pre>
      </div>

      <div class="endpoint-item">
        <div class="endpoint-header">
          <span class="endpoint-name">/api/tasks/debug</span>
          <span :class="'endpoint-status status-' + testEndpointStatus.tasksDebug.status">
            {{ testEndpointStatus.tasksDebug.status === 'success' ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
        <div v-if="testEndpointStatus.tasksDebug.error" class="endpoint-error">
          {{ testEndpointStatus.tasksDebug.error }}
        </div>
        <pre v-if="testEndpointStatus.tasksDebug.data" class="endpoint-data">{{ JSON.stringify(testEndpointStatus.tasksDebug.data, null, 2) }}</pre>
      </div>

      <div class="endpoint-item">
        <div class="endpoint-header">
          <span class="endpoint-name">/api/tasks</span>
          <span :class="'endpoint-status status-' + testEndpointStatus.tasks.status">
            {{ testEndpointStatus.tasks.status === 'success' ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
        <div v-if="testEndpointStatus.tasks.error" class="endpoint-error">
          {{ testEndpointStatus.tasks.error }}
        </div>
        <pre v-if="testEndpointStatus.tasks.data" class="endpoint-data">{{ JSON.stringify(testEndpointStatus.tasks.data, null, 2) }}</pre>
      </div>

      <div class="endpoint-item">
        <div class="endpoint-header">
          <span class="endpoint-name">/api/plans</span>
          <span :class="'endpoint-status status-' + testEndpointStatus.plans.status">
            {{ testEndpointStatus.plans.status === 'success' ? '✅ 成功' : '❌ 失败' }}
          </span>
        </div>
        <div v-if="testEndpointStatus.plans.error" class="endpoint-error">
          {{ testEndpointStatus.plans.error }}
        </div>
        <pre v-if="testEndpointStatus.plans.data" class="endpoint-data">{{ JSON.stringify(testEndpointStatus.plans.data, null, 2) }}</pre>
      </div>
    </div>

    <!-- 任务创建测试结果 -->
    <div v-if="debugData" class="debug-results">
      <h3>任务创建测试结果</h3>
      <div class="result-status" :class="{ success: debugData.status === 'success', error: debugData.status === 'error' }">
        {{ debugData.message }}
      </div>
      
      <div v-if="debugData.error" class="error-details">
        <h4>错误信息</h4>
        <p>{{ debugData.error }}</p>
        <p v-if="debugData.requestError">{{ debugData.requestError }}</p>
        <pre v-if="debugData.errorDetails">{{ JSON.stringify(debugData.errorDetails, null, 2) }}</pre>
      </div>
      
      <div v-if="debugData.status === 'success'" class="success-details">
        <h4>请求数据</h4>
        <pre>{{ JSON.stringify(debugData.requestData, null, 2) }}</pre>
        
        <h4>响应数据</h4>
        <pre>{{ JSON.stringify(debugData.responseData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.debug-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.debug-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.loading-message, .error-message {
  margin: 10px 0;
  padding: 10px;
  border-radius: 6px;
}

.loading-message {
  background: #f8f9fa;
  color: #666;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

.endpoint-tests, .debug-results {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.endpoint-item {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.endpoint-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.endpoint-name {
  font-weight: 600;
  color: #2c3e50;
}

.endpoint-status {
  font-weight: 500;
}

.status-success {
  color: #2ecc71;
}

.status-error {
  color: #e74c3c;
}

.endpoint-error {
  color: #e74c3c;
  margin-bottom: 10px;
}

.endpoint-data, pre {
  background: #f1f3f5;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.9em;
  max-height: 200px;
  overflow-y: auto;
}

.result-status {
  font-weight: 600;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.result-status.success {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
}

.result-status.error {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

h4 {
  margin: 10px 0;
  color: #34495e;
}

.error-details, .success-details {
  margin-top: 15px;
}
</style> 