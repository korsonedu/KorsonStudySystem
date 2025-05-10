<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

// Import shadcn-vue components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert'

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
    <Card class="register-card">
      <CardHeader>
        <CardTitle class="text-center">创建新账号</CardTitle>
        <p class="subtitle text-center">加入我们，开启您的学习之旅</p>
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

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="username">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="请输入用户名"
              :disabled="loading"
            />
          </div>

          <div class="space-y-2">
            <Label for="email">邮箱</Label>
            <Input
              id="email"
              v-model="email"
              placeholder="请输入邮箱"
              :disabled="loading"
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
            />
            <div class="password-hint">
              <span>密码长度必须至少为8个字符</span>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              placeholder="请再次输入密码"
              :disabled="loading"
              @keyup.enter="register"
            />
          </div>

          <div class="space-y-2">
            <Label for="invitationCode">邀请码</Label>
            <Input
              id="invitationCode"
              v-model="invitationCode"
              placeholder="请输入邀请码（仅支持邀请注册）"
              :disabled="loading"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter class="flex flex-col space-y-4">
        <Button
          @click="register"
          :disabled="loading"
          class="w-full"
        >
          {{ loading ? '注册中...' : '创建账号' }}
        </Button>

        <Button
          @click="goToLogin"
          :disabled="loading"
          variant="outline"
          class="w-full"
        >
          返回登录
        </Button>

        <div class="login-link text-center text-sm">
          已有账号？<a href="#" @click.prevent="goToLogin" class="text-primary font-medium">立即登录</a>
        </div>
      </CardFooter>
    </Card>
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

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  margin-bottom: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .register-card {
    max-width: 100%;
    margin: 0 10px;
  }
}
</style>