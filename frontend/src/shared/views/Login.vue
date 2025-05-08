<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { apiService } from '../services/apiService'
import { API_CONFIG } from '../../config'

// 检查本地存储中的令牌
const token = localStorage.getItem('auth_token')
console.log('Login.vue - Token in localStorage:', token ? 'exists' : 'not found')

// 组件挂载时检查登录状态
onMounted(() => {
  console.log('Login.vue - 组件挂载，检查登录状态')

  // 检查用户是否已登录
  const isAuthenticatedUser = userService.checkAuth()
  const isAuthenticatedAuth = authService.checkAuth()
  const isAuthenticated = isAuthenticatedUser || isAuthenticatedAuth || !!token

  console.log('Login.vue - 登录状态检查结果:', {
    isAuthenticatedUser,
    isAuthenticatedAuth,
    token: !!token,
    isAuthenticated
  })

  // 如果已登录，重定向到首页
  if (isAuthenticated) {
    console.log('Login.vue - 用户已登录，重定向到首页')
    router.replace('/')
  }
})

const username = ref('')
const password = ref('')
const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)
const showResendVerification = ref(false)
const resendLoading = ref(false)
const router = useRouter()

const login = async () => {
  try {
    errorMessage.value = ''
    loading.value = true
    console.log('Login.vue - 开始登录流程')

    if (!username.value || !password.value) {
      errorMessage.value = '请输入用户名和密码'
      loading.value = false
      return
    }

    // 使用认证服务进行登录
    console.log('Login.vue - 调用 authService.login')
    const loginResult = await authService.login({
      username: username.value,
      password: password.value
    });

    console.log('Login.vue - 登录结果:', loginResult)

    // 检查登录后的令牌
    const token = localStorage.getItem('auth_token')
    console.log('Login.vue - 登录后 Token in localStorage:', token ? 'exists' : 'not found')

    // 如果令牌存在，检查格式
    if (token && !token.startsWith('Bearer ')) {
      console.log('Login.vue - 令牌格式不正确，添加 Bearer 前缀')
      const correctedToken = `Bearer ${token}`
      localStorage.setItem('auth_token', correctedToken)
      localStorage.setItem('token', correctedToken)
      console.log('Login.vue - 令牌已修正')
    }

    if (loginResult) {
      console.log('Login.vue - 登录成功，用户状态已更新')

      // 检查 authService 中的用户状态
      console.log('Login.vue - authService.currentUser:', authService.currentUser.value)
      console.log('Login.vue - authService.isLoggedIn:', authService.isLoggedIn.value)

      // 重定向到首页
      router.push('/')
    } else {
      console.error('Login.vue - 登录失败:', authService.error.value)
      errorMessage.value = authService.error.value || '登录失败'
    }
  } catch (error: any) {
    console.error('Login.vue - 登录异常:', error)
    if (error.response) {
      console.error('Login.vue - 错误详情:', error.response.data)

      // 检查是否是邮箱未验证的错误
      if (error.response.data.detail === "邮箱未验证，请检查您的邮箱并点击验证链接") {
        errorMessage.value = "邮箱未验证，请检查您的邮箱并点击验证链接"
        showResendVerification.value = true
        // 保存用户名，用于重新发送验证邮件
        email.value = username.value
      } else {
        errorMessage.value = error.response.data.detail || '登录失败，请检查用户名和密码'
      }
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

// 重新发送验证邮件
const resendVerificationEmail = async () => {
  try {
    resendLoading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    // 确保有邮箱地址
    if (!email.value) {
      errorMessage.value = '请输入您的邮箱地址'
      return
    }

    // 调用重新发送验证邮件API
    const response = await apiService.post(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email: email.value }
    )

    // 显示成功消息
    successMessage.value = response.data.message || '验证邮件已重新发送，请查收'
    showResendVerification.value = false
  } catch (error: any) {
    console.error('重新发送验证邮件失败:', error)
    errorMessage.value = error.response?.data?.detail || '重新发送验证邮件失败，请稍后再试'
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <a-card class="login-card">
      <div class="login-header">
        <h2>欢迎回来</h2>
        <p class="subtitle">登录您的账号继续学习之旅</p>
      </div>

      <a-alert
        v-if="errorMessage"
        type="error"
        :message="errorMessage"
        show-icon
        class="message-alert"
      />

      <a-alert
        v-if="successMessage"
        type="success"
        :message="successMessage"
        show-icon
        class="message-alert"
      />

      <!-- 重新发送验证邮件表单 -->
      <a-card v-if="showResendVerification" class="resend-verification">
        <p>没有收到验证邮件？请输入您的邮箱地址，我们将重新发送验证链接。</p>
        <a-form layout="vertical">
          <a-form-item label="邮箱">
            <a-input
              v-model:value="email"
              placeholder="请输入您的邮箱"
              :disabled="resendLoading"
            >
              <template #prefix>
                <mail-outlined />
              </template>
            </a-input>
          </a-form-item>
          <a-button
            type="default"
            @click="resendVerificationEmail"
            :loading="resendLoading"
            block
          >
            重新发送验证邮件
          </a-button>
        </a-form>
      </a-card>

      <a-form layout="vertical" v-if="!showResendVerification">
        <a-form-item label="用户名">
          <a-input
            v-model:value="username"
            placeholder="请输入用户名"
            :disabled="loading"
            @keyup.enter="login"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码">
          <a-input-password
            v-model:value="password"
            placeholder="请输入密码"
            :disabled="loading"
            @keyup.enter="login"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <div class="actions">
          <a-button
            type="primary"
            @click="login"
            :loading="loading"
            block
            class="login-button"
          >
            登录
          </a-button>
          <a-button
            @click="goToRegister"
            :disabled="loading"
            block
            class="register-button"
          >
            注册新账号
          </a-button>
        </div>

        <div class="register-link">
          还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f5f7fa;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

h2 {
  margin-bottom: 8px;
  color: var(--primary-color);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  margin-bottom: 8px;
}

.message-alert {
  margin-bottom: 16px;
}

.resend-verification {
  margin-bottom: 16px;
  background-color: #f6f6f6;
  border: none;
}

.resend-verification p {
  margin-bottom: 16px;
  color: rgba(0, 0, 0, 0.65);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.login-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
}

.register-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 4px;
}

.register-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
    margin: 0 10px;
  }

  h2 {
    font-size: 22px;
  }

  .subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .login-header {
    margin-bottom: 16px;
  }

  .login-button, .register-button {
    height: 36px;
    font-size: 14px;
  }
}
</style>