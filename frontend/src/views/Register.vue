<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../services/api'
import { userService } from '../services/userService'
import { API_CONFIG } from '../config'
import axios from 'axios'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const invitationCode = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)
const router = useRouter()

const register = async () => {
  try {
    errorMessage.value = ''
    loading.value = true

    // 表单验证
    if (!username.value || !password.value || !email.value || !invitationCode.value) {
      errorMessage.value = '用户名、邮箱、密码和邀请码不能为空'
      loading.value = false
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.value)) {
      errorMessage.value = '请输入有效的邮箱地址'
      loading.value = false
      return
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = '两次输入的密码不一致'
      loading.value = false
      return
    }

    // 验证邀请码
    if (invitationCode.value !== 'korsonacademy') {
      errorMessage.value = '邀请码不正确'
      loading.value = false
      return
    }

    // 创建用户对象
    const userData = {
      username: username.value,
      email: email.value || undefined, // 如果为空字符串则设为undefined
      password: password.value,
      invitation_code: invitationCode.value
    }

    // 使用用户服务发送注册请求
    const success = await userService.register(userData)

    if (success) {
      // 注册成功，显示成功消息
      successMessage.value = '注册成功！正在跳转到登录页面...'
      // 清空表单
      username.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      invitationCode.value = ''

      // 3秒后自动跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      // 注册失败，显示错误信息
      errorMessage.value = userService.error.value
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    errorMessage.value = error.response?.data?.detail || '注册失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h2>注册账号</h2>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>

      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="请输入用户名"
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          type="email"
          id="email"
          v-model="email"
          placeholder="请输入邮箱"
          :disabled="loading"
          required
        >
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="请输入密码"
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="confirm-password">确认密码</label>
        <input
          type="password"
          id="confirm-password"
          v-model="confirmPassword"
          placeholder="请再次输入密码"
          @keyup.enter="register"
          :disabled="loading"
        >
      </div>

      <div class="form-group">
        <label for="invitation-code">邀请码</label>
        <input
          type="text"
          id="invitation-code"
          v-model="invitationCode"
          placeholder="请输入邀请码（仅支持邀请注册）"
          :disabled="loading"
          required
        >
      </div>

      <div class="actions">
        <button class="primary-btn" @click="register" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <button class="secondary-btn" @click="goToLogin" :disabled="loading">返回登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.register-card {
  background: var(--card-bg);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 600px;
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

.success-message {
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  text-align: center;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 14px;
  color: #777;
}
</style>