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
  <div class="register-container">
    <Card class="register-card">
      <CardHeader class="card-header">
        <CardTitle class="card-title">创建新账号</CardTitle>
        <p class="subtitle">加入我们，开启您的学习之旅</p>
      </CardHeader>

      <CardContent class="card-content">

        <div class="form-group">
          <div class="input-group">
            <Label for="username" class="input-label">用户名</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="请输入用户名"
              :disabled="loading"
              class="input-field"
            />
          </div>

          <div class="input-group">
            <Label for="email" class="input-label">邮箱</Label>
            <Input
              id="email"
              v-model="email"
              placeholder="请输入邮箱"
              :disabled="loading"
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
              class="input-field"
            />
            <div class="password-hint">
              <span>密码长度必须至少为8个字符</span>
            </div>
          </div>

          <div class="input-group">
            <Label for="confirmPassword" class="input-label">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              placeholder="请再次输入密码"
              :disabled="loading"
              @keyup.enter="register"
              class="input-field"
            />
          </div>

          <div class="input-group">
            <Label for="invitationCode" class="input-label">邀请码</Label>
            <Input
              id="invitationCode"
              v-model="invitationCode"
              placeholder="请输入邀请码（仅支持邀请注册）"
              :disabled="loading"
              class="input-field"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter class="card-footer">
        <Button
          @click="register"
          :disabled="loading"
          class="submit-button"
        >
          {{ loading ? '注册中...' : '创建账号' }}
        </Button>

        <Button
          @click="goToLogin"
          :disabled="loading"
          variant="outline"
          class="secondary-button"
        >
          返回登录
        </Button>

        <div class="login-link">
          已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a>
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
  max-width: 550px; /* 增加宽度 */
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.register-card:hover {
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

.password-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 0, 0, 0.02);
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
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

/* 链接样式 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.login-link a {
  color: var(--primary-color);
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
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

  :deep(.button) {
    height: 42px;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 15px;
  }

  .password-hint {
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>