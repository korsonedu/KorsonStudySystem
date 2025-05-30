<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/userStore'

// Import shadcn-vue components
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { toast } from 'vue-sonner'

// 使用用户状态存储
const userStore = useUserStore()


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
      toast.error('验证失败', {
        description: '用户名和密码不能为空',
      })
      loading.value = false
      return
    }

    // 验证密码长度至少为8个字符
    if (password.value.length < 8) {
      toast.error('验证失败', {
        description: '密码长度必须至少为8个字符',
      })
      loading.value = false
      return
    }

    if (password.value !== confirmPassword.value) {
      toast.error('验证失败', {
        description: '两次输入的密码不一致',
      })
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

    // 使用Pinia用户存储发送注册请求
    const success = await userStore.register(userData)

    if (success) {
      // 注册成功，显示成功消息和邮箱验证提示
      toast.success('注册成功', {
        description: '我们已向您的邮箱发送了验证链接，请查收并点击链接完成验证。验证后即可登录。',
        duration: 5000,
      })

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
      toast.error('注册失败', {
        description: userStore.error || '请稍后再试',
      })
    }
  } catch (error: any) {
    console.error('注册失败:', error)
    toast.error('注册失败', {
      description: error.response?.data?.detail || '请稍后再试',
    })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="auth-container">
    <Card class="auth-card">
      <CardHeader class="auth-header">
        <CardTitle class="auth-title">创建新账号</CardTitle>
        <p class="auth-subtitle">加入我们，开启您的学习之旅</p>
      </CardHeader>

      <CardContent class="auth-content">

        <div class="auth-form">
          <div class="auth-input-group">
            <Label for="username" class="auth-label">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="请输入用户名"
              :disabled="loading"
              class="auth-input"
              autocomplete="username"
            />
          </div>

          <div class="auth-input-group">
            <Label for="email" class="auth-label">邮箱</Label>
            <Input
              id="email"
              v-model="email"
              placeholder="请输入邮箱"
              :disabled="loading"
              class="auth-input"
              autocomplete="email"
            />
          </div>

          <div class="auth-input-group">
            <Label for="password" class="auth-label">密码</Label>
            <Input
              id="password"
              type="password"
              v-model="password"
              placeholder="请输入密码"
              :disabled="loading"
              class="auth-input"
              autocomplete="new-password"
            />
            <div class="password-hint">
              <span>密码长度必须至少为8个字符</span>
            </div>
          </div>

          <div class="auth-input-group">
            <Label for="confirmPassword" class="auth-label">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              placeholder="请再次输入密码"
              :disabled="loading"
              @keyup.enter="register"
              class="auth-input"
              autocomplete="new-password"
            />
          </div>

          <div class="auth-input-group">
            <Label for="invitationCode" class="auth-label">邀请码</Label>
            <Input
              id="invitationCode"
              v-model="invitationCode"
              placeholder="请输入邀请码（仅支持邀请注册）"
              :disabled="loading"
              class="auth-input"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter class="auth-footer">
        <Button
          @click="register"
          :disabled="loading"
          class="auth-submit-btn"
        >
          {{ loading ? '注册中...' : '创建账号' }}
        </Button>

        <Button
          @click="goToLogin"
          :disabled="loading"
          variant="outline"
          class="auth-secondary-btn"
        >
          返回登录
        </Button>

        <div class="auth-link-text">
          已有账号？<a href="#" @click.prevent="goToLogin" class="auth-link">立即登录</a>
        </div>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>
/* 所有样式已移至全局CSS文件 */
</style>