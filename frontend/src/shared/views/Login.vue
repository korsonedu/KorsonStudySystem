<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

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

    // 使用认证服务进行登录
    const loginResult = await authService.login({
      username: username.value,
      password: password.value
    });

    if (loginResult) {
      console.log('Login successful, user state updated')
      // 重定向到首页
      router.push('/')
    } else {
      errorMessage.value = authService.error.value || '登录失败'
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
      <div class="login-header">
        <h2>欢迎回来</h2>
        <p class="subtitle">登录您的账号继续学习之旅</p>
      </div>

      <div v-if="errorMessage" class="error-message">
        <i class="error-icon">⚠️</i>
        {{ errorMessage }}
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
            @keyup.enter="login"
            :disabled="loading"
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
            @keyup.enter="login"
            :disabled="loading"
          >
        </div>
      </div>

      <div class="actions">
        <button class="primary-btn" @click="login" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <button class="secondary-btn" @click="goToRegister" :disabled="loading">注册新账号</button>
      </div>

      <div class="register-link">
        还没有账号？<a href="#" @click.prevent="goToRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: linear-gradient(135deg, rgba(240, 247, 255, 0.5), rgba(240, 247, 255, 0.8));
  padding: 20px;
}

.login-card {
  background: var(--card-bg);
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 15px 30px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05);
  width: 100%;
  max-width: 420px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1);
}

.login-header {
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
  margin-bottom: 25px;
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

.register-link {
  text-align: center;
  margin-top: 25px;
  font-size: 15px;
  color: #666;
}

.register-link a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.register-link a:hover {
  color: var(--secondary-color);
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
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