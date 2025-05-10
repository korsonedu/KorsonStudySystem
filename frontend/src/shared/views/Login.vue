<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '../services/apiService'
import { API_CONFIG } from '../../config'
import { useUserStore } from '../../stores/userStore'

// Import shadcn-vue components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from 'vue-sonner'

// 使用用户状态存储
const userStore = useUserStore()
const router = useRouter()

// 组件挂载时检查登录状态
onMounted(() => {
  console.log('Login.vue - 组件挂载，检查登录状态')

  // 检查用户是否已登录
  const isAuthenticated = userStore.checkAuth()

  console.log('Login.vue - 登录状态检查结果:', {
    isAuthenticated,
    username: userStore.username
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

const login = async () => {
  try {
    errorMessage.value = ''
    loading.value = true
    console.log('Login.vue - 开始登录流程')

    if (!username.value || !password.value) {
      toast.error('错误', {
        description: '请输入用户名和密码',
      })
      loading.value = false
      return
    }

    // 使用Pinia用户存储进行登录
    console.log('Login.vue - 调用 userStore.login')
    const loginResult = await userStore.login({
      username: username.value,
      password: password.value
    });

    console.log('Login.vue - 登录结果:', loginResult)

    if (loginResult) {
      console.log('Login.vue - 登录成功，用户状态已更新')

      // 检查用户状态
      console.log('Login.vue - 用户名:', userStore.username)
      console.log('Login.vue - 是否登录:', userStore.isLoggedIn)

      // 显示登录成功提示
      toast.success('登录成功', {
        description: '欢迎回来！',
      })

      // 重定向到首页
      router.push('/')
    } else {
      console.error('Login.vue - 登录失败:', userStore.error)
      toast.error('登录失败', {
        description: userStore.error || '请检查用户名和密码',
      })
    }
  } catch (error: any) {
    console.error('Login.vue - 登录异常:', error)
    if (error.response) {
      console.error('Login.vue - 错误详情:', error.response.data)

      // 检查是否是邮箱未验证的错误
      if (error.response.data.detail === "邮箱未验证，请检查您的邮箱并点击验证链接") {
        toast.error('邮箱未验证', {
          description: '请检查您的邮箱并点击验证链接',
        })
        showResendVerification.value = true
        // 保存用户名，用于重新发送验证邮件
        email.value = username.value
      } else {
        toast.error('登录失败', {
          description: error.response.data.detail || '请检查用户名和密码',
        })
      }
    } else {
      toast.error('登录失败', {
        description: '请检查网络连接',
      })
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
      toast.error('错误', {
        description: '请输入您的邮箱地址',
      })
      return
    }

    // 调用重新发送验证邮件API
    const response = await apiService.post(
      API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email: email.value }
    )

    // 显示成功消息
    toast.success('邮件已发送', {
      description: response.data.message || '验证邮件已重新发送，请查收',
    })
    showResendVerification.value = false
  } catch (error: any) {
    console.error('重新发送验证邮件失败:', error)
    toast.error('发送失败', {
      description: error.response?.data?.detail || '重新发送验证邮件失败，请稍后再试',
    })
  } finally {
    resendLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <Card class="login-card">
      <CardHeader class="card-header">
        <CardTitle class="card-title">欢迎回来</CardTitle>
        <p class="subtitle">登录您的账号继续学习之旅</p>
      </CardHeader>

      <CardContent class="card-content">

        <!-- 重新发送验证邮件表单 -->
        <Card v-if="showResendVerification" class="resend-verification">
          <CardContent>
            <p class="resend-text">没有收到验证邮件？请输入您的邮箱地址，我们将重新发送验证链接。</p>
            <div class="form-group">
              <div class="input-group">
                <Label for="email" class="input-label">邮箱</Label>
                <Input
                  id="email"
                  v-model="email"
                  placeholder="请输入您的邮箱"
                  :disabled="resendLoading"
                  class="input-field"
                />
              </div>
              <Button
                @click="resendVerificationEmail"
                :disabled="resendLoading"
                class="submit-button"
              >
                {{ resendLoading ? '发送中...' : '重新发送验证邮件' }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div v-if="!showResendVerification" class="form-group">
          <div class="input-group">
            <Label for="username" class="input-label">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="请输入用户名"
              :disabled="loading"
              @keyup.enter="login"
              class="input-field"
            />
          </div>

          <div class="input-group">
            <Label for="password" class="input-label">密码</Label>
            <Input
              id="password"
              type="password"
              v-model="password"
              placeholder="请输入密码"
              :disabled="loading"
              @keyup.enter="login"
              class="input-field"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter v-if="!showResendVerification" class="card-footer">
        <Button
          @click="login"
          :disabled="loading"
          class="submit-button"
        >
          {{ loading ? '登录中...' : '登录' }}
        </Button>

        <Button
          @click="goToRegister"
          :disabled="loading"
          variant="outline"
          class="secondary-button"
        >
          注册新账号
        </Button>

        <div class="register-link">
          还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
        </div>
      </CardFooter>
    </Card>
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
  max-width: 480px; /* 增加宽度 */
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

/* 卡片头部样式 */
.card-header {
  padding: 24px 24px 0;
  border-bottom: none;
}

.card-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 卡片内容样式 */
.card-content {
  padding: 24px 32px; /* 增加水平内边距 */
}

/* 表单样式 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.input-field {
  height: 42px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  padding: 0 16px; /* 增加内边距 */
  width: 100%; /* 确保宽度填满父容器 */
}

.input-field:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* 卡片底部样式 */
.card-footer {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: none;
}

/* 按钮样式 */
.submit-button, .secondary-button {
  height: 44px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  width: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
}

.submit-button {
  background-color: var(--primary-color);
  color: white;
}

.secondary-button {
  background-color: transparent;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #666;
}

.submit-button:hover, .secondary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 提示信息样式 */
.alert-message {
  margin-bottom: 20px;
  border-radius: 8px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 重发验证邮件样式 */
.resend-verification {
  background-color: rgba(0, 0, 0, 0.02);
  border: none;
  border-radius: 8px;
  margin-bottom: 20px;
}

.resend-text {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 链接样式 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.register-link a {
  color: var(--primary-color);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
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

  :deep(.button) {
    height: 42px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
}
</style>