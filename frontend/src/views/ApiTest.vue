<template>
  <div class="api-test-container">
    <h1>API 测试页面</h1>

    <div class="test-section">
      <h2>基本连接测试</h2>
      <button @click="testBasicConnection" class="test-btn">测试基本连接</button>
      <div v-if="basicConnectionResult" class="result" :class="{ success: basicConnectionSuccess, error: !basicConnectionSuccess }">
        {{ basicConnectionResult }}
      </div>
    </div>

    <div class="test-section">
      <h2>认证测试</h2>
      <button @click="testAuthentication" class="test-btn">测试认证</button>
      <div v-if="authResult" class="result" :class="{ success: authSuccess, error: !authSuccess }">
        {{ authResult }}
      </div>
    </div>

    <div class="test-section">
      <h2>任务创建测试</h2>
      <div class="url-selector">
        <label>选择URL:</label>
        <select v-model="selectedUrl">
          <option v-for="url in urls" :key="url" :value="url">{{ url }}</option>
        </select>
      </div>
      <button @click="testTaskCreation" class="test-btn">测试创建任务</button>
      <div v-if="taskResult" class="result" :class="{ success: taskSuccess, error: !taskSuccess }">
        {{ taskResult }}
      </div>
    </div>

    <div class="test-section">
      <h2>用户信息</h2>
      <div class="user-info">
        <p><strong>用户名:</strong> {{ username || '未登录' }}</p>
        <p><strong>令牌:</strong> {{ tokenPreview || '无' }}</p>
      </div>
    </div>

    <div class="navigation">
      <router-link to="/" class="nav-link">返回主页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 状态变量
const username = ref('')
const tokenPreview = ref('')
const basicConnectionResult = ref('')
const basicConnectionSuccess = ref(false)
const authResult = ref('')
const authSuccess = ref(false)
const taskResult = ref('')
const taskSuccess = ref(false)

// URL选项
const urls = [
  '/api/tasks/',
  '/api/tasks',
  'http://127.0.0.1:8000/api/tasks/',
  'http://localhost:8000/api/tasks/'
]
const selectedUrl = ref(urls[0])

// 获取用户信息
onMounted(() => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('username')

  username.value = user || ''
  if (token) {
    tokenPreview.value = `${token.substring(0, 15)}...`
  }
})

// 测试基本连接
const testBasicConnection = async () => {
  basicConnectionResult.value = '测试中...'
  basicConnectionSuccess.value = false

  try {
    // 尝试不同的端点
    const endpoints = [
      '/api/ping',
      '/api/health',
      '/api'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint)
        if (response.ok) {
          basicConnectionResult.value = `连接成功! 端点: ${endpoint}, 状态: ${response.status}`
          basicConnectionSuccess.value = true
          return
        }
      } catch (e) {
        console.error(`Error with endpoint ${endpoint}:`, e)
      }
    }

    // 如果所有端点都失败，尝试直接连接后端
    try {
      const response = await fetch('http://127.0.0.1:8000/api')
      if (response.ok) {
        basicConnectionResult.value = `直接连接成功! 状态: ${response.status}`
        basicConnectionSuccess.value = true
        return
      }
    } catch (e) {
      console.error('Error with direct connection:', e)
    }

    basicConnectionResult.value = '所有连接尝试均失败，请确保后端服务器正在运行'
  } catch (err: any) {
    basicConnectionResult.value = `错误: ${err.message}`
    console.error('Connection test error:', err)
  }
}

// 测试认证
const testAuthentication = async () => {
  authResult.value = '测试中...'
  authSuccess.value = false

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      authResult.value = '错误: 无认证令牌，请先登录'
      return
    }

    // 尝试获取用户信息
    try {
      // 确保令牌格式正确
      const cleanToken = token.trim()
      console.log('Using token for auth test:', cleanToken.substring(0, 20) + '...')

      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${cleanToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        authResult.value = `认证成功! 用户ID: ${data.id}, 用户名: ${data.username}`
        authSuccess.value = true
        return
      } else {
        authResult.value = `认证失败，状态码: ${response.status}`
        try {
          const errorText = await response.text()
          authResult.value += `\n错误: ${errorText}`
        } catch (e) {}
      }
    } catch (e: any) {
      authResult.value = `请求错误: ${e.message}`
    }

    // 尝试直接连接
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        authResult.value = `直接连接认证成功! 用户ID: ${data.id}, 用户名: ${data.username}`
        authSuccess.value = true
        return
      }
    } catch (e) {
      console.error('Error with direct auth:', e)
    }
  } catch (err: any) {
    authResult.value = `错误: ${err.message}`
    console.error('Auth test error:', err)
  }
}

// 测试任务创建
const testTaskCreation = async () => {
  taskResult.value = '测试中...'
  taskSuccess.value = false

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      taskResult.value = '错误: 无认证令牌，请先登录'
      return
    }

    // 创建测试任务
    const testTask = {
      name: '测试任务-' + new Date().toISOString(),
      duration: 1,
      completed: true,
      start: new Date().toISOString(),
      end: new Date().toISOString()
    }

    try {
      taskResult.value = `尝试URL: ${selectedUrl.value}...`

      // 确保令牌格式正确
      const cleanToken = token.trim()
      console.log('Using token for task creation:', cleanToken.substring(0, 20) + '...')

      // 构建请求头
      const headers = new Headers()
      headers.append('Content-Type', 'application/json')
      headers.append('Authorization', `Bearer ${cleanToken}`)

      // 检查请求头是否有效
      console.log('Request headers:', [...headers.entries()])

      const response = await fetch(selectedUrl.value, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(testTask)
      })

      if (response.ok) {
        const data = await response.json()
        taskResult.value = `任务创建成功! ID: ${data.id}`
        taskSuccess.value = true
        return
      } else {
        taskResult.value = `创建失败，状态码: ${response.status}`
        try {
          const errorText = await response.text()
          taskResult.value += `\n错误: ${errorText}`
        } catch (e) {}
      }
    } catch (e: any) {
      taskResult.value = `请求错误: ${e.message}`
    }
  } catch (err: any) {
    taskResult.value = `错误: ${err.message}`
    console.error('Task creation test error:', err)
  }
}
</script>

<style scoped>
.api-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.test-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #3498db;
  margin-top: 0;
  font-size: 1.3rem;
}

.test-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.test-btn:hover {
  background: #2980b9;
}

.result {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-line;
  font-family: monospace;
}

.success {
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
  border-left: 4px solid #27ae60;
}

.error {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border-left: 4px solid #e74c3c;
}

.user-info {
  background: rgba(52, 152, 219, 0.1);
  padding: 10px;
  border-radius: 4px;
}

.url-selector {
  margin-bottom: 15px;
}

.url-selector select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  margin-left: 10px;
  width: 300px;
}

.navigation {
  text-align: center;
  margin-top: 30px;
}

.nav-link {
  display: inline-block;
  padding: 10px 20px;
  background: #2c3e50;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-link:hover {
  background: #1a252f;
}
</style>
