<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { apiService } from '../services/apiService'
import { API_CONFIG } from '../../config'

// Import shadcn-vue components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert'

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
    <Card class="login-card">
      <CardHeader>
        <CardTitle class="text-center">欢迎回来</CardTitle>
        <p class="subtitle text-center">登录您的账号继续学习之旅</p>
      </CardHeader>

      <CardContent>
        <Alert v-if="errorMessage" variant="destructive" class="mb-4">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>

        <Alert v-if="successMessage" variant="success" class="mb-4">
          <AlertTitle>成功</AlertTitle>
          <AlertDescription>{{ successMessage }}</AlertDescription>
        </Alert>

        <!-- 重新发送验证邮件表单 -->
        <Card v-if="showResendVerification" class="resend-verification mb-4">
          <CardContent>
            <p class="mb-4">没有收到验证邮件？请输入您的邮箱地址，我们将重新发送验证链接。</p>
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="email">邮箱</Label>
                <Input
                  id="email"
                  v-model="email"
                  placeholder="请输入您的邮箱"
                  :disabled="resendLoading"
                />
              </div>
              <Button
                @click="resendVerificationEmail"
                :disabled="resendLoading"
                class="w-full"
              >
                {{ resendLoading ? '发送中...' : '重新发送验证邮件' }}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div v-if="!showResendVerification" class="space-y-4">
          <div class="space-y-2">
            <Label for="username">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="请输入用户名"
              :disabled="loading"
              @keyup.enter="login"
            />
          </div>

          <div class="space-y-2">
            <Label for="password">密码</Label>
            <Input
              id="password"
              type="password"
              v-model="password"
              placeholder="请输入密码"
              :disabled="loading"
              @keyup.enter="login"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter v-if="!showResendVerification" class="flex flex-col space-y-4">
        <Button
          @click="login"
          :disabled="loading"
          class="w-full"
        >
          {{ loading ? '登录中...' : '登录' }}
        </Button>

        <Button
          @click="goToRegister"
          :disabled="loading"
          variant="outline"
          class="w-full"
        >
          注册新账号
        </Button>

        <div class="register-link text-center text-sm">
          还没有账号？<a href="#" @click.prevent="goToRegister" class="text-primary font-medium">立即注册</a>
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
  max-width: 420px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  margin-bottom: 8px;
}

.resend-verification {
  background-color: #f6f6f6;
  border: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
    margin: 0 10px;
  }
}
</style>