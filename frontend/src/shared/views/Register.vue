<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

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
    successMessage.value = ''
    loading.value = true

    // 表单验证
    if (!username.value || !password.value) {
      errorMessage.value = '用户名和密码不能为空'
      loading.value = false
      return
    }

    // 验证密码长度至少为8个字符
    if (password.value.length < 8) {
      errorMessage.value = '密码长度必须至少为8个字符'
      loading.value = false
      return
    }

    if (password.value !== confirmPassword.value) {
      errorMessage.value = '两次输入的密码不一致'
      loading.value = false
      return
    }

    // 创建用户对象
    const userData = {
      username: username.value,
      email: email.value || undefined, // 如果为空字符串则设为undefined
      password: password.value,
      invitation_code: invitationCode.value || undefined // 添加邀请码
    }

    // 使用认证服务发送注册请求
    const success = await authService.register(userData)

    if (success) {
      // 注册成功，显示成功消息和邮箱验证提示
      successMessage.value = '注册成功！我们已向您的邮箱发送了验证链接，请查收并点击链接完成验证。验证后即可登录。'
      // 清空表单
      username.value = ''
      email.value = ''
      password.value = ''
      confirmPassword.value = ''
      invitationCode.value = ''

      // 延迟5秒后跳转到登录页，让用户有足够时间阅读提示信息
      setTimeout(() => {
        router.push('/login')
      }, 5000)
    } else {
      // 注册失败，显示错误信息
      errorMessage.value = authService.error.value || '注册失败，请稍后再试'
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
    <a-card class="register-card">
      <div class="register-header">
        <h2>创建新账号</h2>
        <p class="subtitle">加入我们，开启您的学习之旅</p>
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

      <a-form layout="vertical">
        <a-form-item label="用户名">
          <a-input
            v-model:value="username"
            placeholder="请输入用户名"
            :disabled="loading"
          >
            <template #prefix>
              <user-outlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="邮箱">
          <a-input
            v-model:value="email"
            placeholder="请输入邮箱"
            :disabled="loading"
          >
            <template #prefix>
              <mail-outlined />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码">
          <a-input-password
            v-model:value="password"
            placeholder="请输入密码"
            :disabled="loading"
          >
            <template #prefix>
              <lock-outlined />
            </template>
          </a-input-password>
          <div class="password-hint">
            <info-circle-outlined />
            <span>密码长度必须至少为8个字符</span>
          </div>
        </a-form-item>

        <a-form-item label="确认密码">
          <a-input-password
            v-model:value="confirmPassword"
            placeholder="请再次输入密码"
            :disabled="loading"
            @keyup.enter="register"
          >
            <template #prefix>
              <safety-outlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="邀请码">
          <a-input
            v-model:value="invitationCode"
            placeholder="请输入邀请码（仅支持邀请注册）"
            :disabled="loading"
          >
            <template #prefix>
              <gift-outlined />
            </template>
          </a-input>
        </a-form-item>

        <div class="actions">
          <a-button
            type="primary"
            @click="register"
            :loading="loading"
            block
            class="register-button"
          >
            创建账号
          </a-button>
          <a-button
            @click="goToLogin"
            :disabled="loading"
            block
            class="login-button"
          >
            返回登录
          </a-button>
        </div>

        <div class="login-link">
          已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f5f7fa;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.register-header {
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

.password-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}

.register-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
}

.login-button {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 4px;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.login-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-card {
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
  .register-header {
    margin-bottom: 16px;
  }

  .register-button, .login-button {
    height: 36px;
    font-size: 14px;
  }

  .password-hint {
    font-size: 12px;
  }
}
</style>