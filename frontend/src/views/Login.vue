<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/userService'

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)
const router = useRouter()

const login = async () => {
  try {
    errorMessage.value = ''
    loading.value = true

    if (!username.value || !password.value) {
      errorMessage.value = '请输入用户名和密码'
      loading.value = false
      return
    }

    // 使用用户服务进行登录
    const loginResult = await userService.login({
      username: username.value,
      password: password.value
    });

    if (loginResult) {
      console.log('Login successful, user state updated')
      // 重定向到首页
      router.push('/')
    } else {
      errorMessage.value = userService.error.value || '登录失败'
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    if (error.response) {
      console.error('错误详情:', error.response.data)
      errorMessage.value = error.response.data.detail || '登录失败，请检查用户名和密码'
    } else {
      errorMessage.value = '登录失败，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>登录</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="请输入用户名"
          @keyup.enter="login"
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="请输入密码"
          @keyup.enter="login"
          :disabled="loading"
        >
      </div>

      <div class="actions">
        <button class="primary-btn" @click="login" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <button class="secondary-btn" @click="goToRegister" :disabled="loading">注册新账号</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.login-card {
  background: var(--card-bg);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  margin-bottom: 20px;
  color: var(--primary-color);
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.primary-btn {
  background: var(--secondary-color);
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.secondary-btn {
  background: transparent;
  color: var(--secondary-color);
  padding: 12px 20px;
  border: 1px solid var(--secondary-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 10px rgba(0,0,0,0.1);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.error-message {
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}
</style>