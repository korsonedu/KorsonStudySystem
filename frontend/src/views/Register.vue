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
      <div class="register-header">
        <h2>创建新账号</h2>
        <p class="subtitle">加入我们，开启您的学习之旅</p>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="error-icon">⚠️</i>
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="success-message">
        <i class="success-icon">✅</i>
        {{ successMessage }}
      </div>

      <div class="form-group">
        <label for="username">用户名</label>
        <div class="input-wrapper">
          <i class="input-icon">👤</i>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="请输入用户名"
            :disabled="loading"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="email">邮箱</label>
        <div class="input-wrapper">
          <i class="input-icon">📧</i>
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="请输入邮箱"
            :disabled="loading"
            required
          >
        </div>
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <div class="input-wrapper">
          <i class="input-icon">🔒</i>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="请输入密码"
            :disabled="loading"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="confirm-password">确认密码</label>
        <div class="input-wrapper">
          <i class="input-icon">🔐</i>
          <input
            type="password"
            id="confirm-password"
            v-model="confirmPassword"
            placeholder="请再次输入密码"
            @keyup.enter="register"
            :disabled="loading"
          >
        </div>
      </div>

      <div class="form-group">
        <label for="invitation-code">邀请码</label>
        <div class="input-wrapper">
          <i class="input-icon">🎟️</i>
          <input
            type="text"
            id="invitation-code"
            v-model="invitationCode"
            placeholder="请输入邀请码（仅支持邀请注册）"
            :disabled="loading"
            required
          >
        </div>
      </div>

      <div class="actions">
        <button class="primary-btn" @click="register" :disabled="loading">
          {{ loading ? '注册中...' : '创建账号' }}
        </button>
        <button class="secondary-btn" @click="goToLogin" :disabled="loading">返回登录</button>
      </div>

      <div class="login-link">
        已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: linear-gradient(135deg, rgba(240, 247, 255, 0.5), rgba(240, 247, 255, 0.8));
  padding: 20px;
}

.register-card {
  background: var(--card-bg);
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 600px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  margin-bottom: 10px;
  color: var(--primary-color);
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  color: #666;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
  font-size: 15px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-style: normal;
  color: #888;
}

input {
  width: 100%;
  padding: 14px 14px 14px 40px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: rgba(255, 255, 255, 0.8);
}

input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  outline: none;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 35px;
  gap: 15px;
}

.primary-btn {
  flex: 1;
  background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
  color: white;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.2);
}

.secondary-btn {
  flex: 1;
  background: transparent;
  color: var(--secondary-color);
  padding: 14px 20px;
  border: 2px solid var(--secondary-color);
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.3);
  background: linear-gradient(135deg, #2980b9, #3498db);
}

.secondary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.15);
  background: rgba(52, 152, 219, 0.05);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 12px 15px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: center;
  border-left: 4px solid #e74c3c;
}

.error-icon {
  margin-right: 10px;
  font-style: normal;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  padding: 12px 15px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: center;
  border-left: 4px solid #2ecc71;
}

.success-icon {
  margin-right: 10px;
  font-style: normal;
}

.form-text {
  display: block;
  margin-top: 5px;
  font-size: 14px;
  color: #777;
}

.login-link {
  text-align: center;
  margin-top: 25px;
  font-size: 15px;
  color: #666;
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.login-link a:hover {
  color: var(--secondary-color);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-card {
    padding: 25px;
  }

  .actions {
    flex-direction: column;
  }

  .primary-btn, .secondary-btn {
    width: 100%;
  }
}
</style>