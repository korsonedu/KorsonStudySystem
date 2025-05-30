<template>
  <div class="profile-container">
    <!-- 头像选择器对话框 -->
    <div v-if="showAvatarSelector" class="avatar-selector-modal">
      <div class="avatar-selector-content">
        <div class="avatar-selector-header">
          <h2>自定义头像</h2>
          <button @click="showAvatarSelector = false" class="close-button">
            <span>&times;</span>
          </button>
        </div>
        <AvatarSelector @save="saveNewAvatar" @cancel="showAvatarSelector = false" />
      </div>
    </div>

    <!-- 个人资料卡片 - 苹果风格设计 -->
    <Card class="profile-card">
      <div class="profile-header">
        <div class="avatar-container">
          <Avatar class="profile-avatar">
            <AvatarImage
              :src="userInfo.avatar"
              alt="用户头像"
            />
            <AvatarFallback class="avatar-fallback">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
          <button @click="showAvatarSelector = true" class="edit-avatar-button">
            <span class="edit-icon">✏️</span>
          </button>
        </div>

        <div class="user-info">
          <h1 class="username">{{ userInfo.username }}</h1>
          <p class="user-email">{{ userInfo.email || '未设置邮箱' }}</p>
          <div class="user-badges">
            <Badge v-if="userInfo.email && userInfo.email_verified" variant="success" class="badge">已验证邮箱</Badge>
            <Badge v-else-if="userInfo.email && !userInfo.email_verified" variant="destructive" class="badge">未验证邮箱</Badge>
            <Badge variant="outline" class="badge">加入时间: {{ formatDate(userInfo.created_at) }}</Badge>
          </div>
        </div>
      </div>

      <!-- 用户统计信息 - 苹果风格卡片 -->
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ formatDuration(userStats.totalStudyTime) }}</div>
          <div class="stat-label">总学习时间</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ userStats.completedTasks }}</div>
          <div class="stat-label">完成任务</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">{{ userStats.unlockedAchievements }}</div>
          <div class="stat-label">解锁成就</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ userStats.studyDays }}</div>
          <div class="stat-label">学习天数</div>
        </div>
      </div>
    </Card>

    <!-- 苹果风格标签页 -->
    <div class="apple-tabs">
      <div class="tab-buttons">
        <button
          @click="activeTab = 'profile'"
          :class="['tab-button', { active: activeTab === 'profile' }]"
        >
          个人资料
        </button>
        <button
          @click="activeTab = 'exam'"
          :class="['tab-button', { active: activeTab === 'exam' }]"
        >
          考研信息
        </button>
      </div>

      <!-- 个人资料标签页 -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <Card class="info-card">
          <CardHeader class="info-card-header">
            <CardTitle class="info-card-title">基本信息</CardTitle>
            <CardDescription class="info-card-description">查看和更新您的个人资料</CardDescription>
          </CardHeader>
          <CardContent class="info-card-content">
            <div v-if="!isEditing" class="info-display">
              <div class="info-grid">
                <div class="info-item">
                  <Label class="info-label">用户名</Label>
                  <p class="info-value">{{ userInfo.username }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">邮箱</Label>
                  <p class="info-value">{{ userInfo.email || '未设置' }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">账号状态</Label>
                  <p class="info-value">{{ userInfo.is_active ? '正常' : '已禁用' }}</p>
                </div>
              </div>
              <Button class="edit-button" @click="startEditing">编辑资料</Button>
            </div>

            <div v-else class="edit-form">
              <div class="form-grid">
                <div class="form-item">
                  <Label for="username" class="form-label">用户名</Label>
                  <Input id="username" v-model="editForm.username" class="form-input" />
                </div>
                <div class="form-item">
                  <Label for="email" class="form-label">邮箱</Label>
                  <Input id="email" type="email" v-model="editForm.email" class="form-input" />
                </div>
                <div class="form-item">
                  <Label for="password" class="form-label">新密码 (留空则不修改)</Label>
                  <Input id="password" type="password" v-model="editForm.password" class="form-input" />
                </div>
                <div class="form-item">
                  <Label for="confirmPassword" class="form-label">确认新密码</Label>
                  <Input id="confirmPassword" type="password" v-model="editForm.confirmPassword" class="form-input" />
                </div>
              </div>
              <div class="form-actions">
                <Button @click="saveProfile" class="save-button">保存</Button>
                <Button variant="outline" @click="cancelEditing" class="cancel-button">取消</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 考研信息标签页 -->
      <div v-if="activeTab === 'exam'" class="tab-content">
        <Card class="info-card">
          <CardHeader class="info-card-header">
            <CardTitle class="info-card-title">考研信息</CardTitle>
            <CardDescription class="info-card-description">设置您的考研目标和计划</CardDescription>
          </CardHeader>
          <CardContent class="info-card-content">
            <div v-if="!isEditingExam" class="info-display">
              <div class="info-grid">
                <div class="info-item">
                  <Label class="info-label">目标院校</Label>
                  <p class="info-value">{{ examInfo.targetSchool || '未设置' }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">目标专业</Label>
                  <p class="info-value">{{ examInfo.targetMajor || '未设置' }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">考试年份</Label>
                  <p class="info-value">{{ examInfo.examYear || '未设置' }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">备考阶段</Label>
                  <p class="info-value">{{ examInfo.prepPhase || '未设置' }}</p>
                </div>
                <div class="info-item">
                  <Label class="info-label">每日目标</Label>
                  <p class="info-value">{{ examInfo.dailyGoal ? `${examInfo.dailyGoal} 小时` : '未设置' }}</p>
                </div>
              </div>
              <Button class="edit-button" @click="startEditingExam">编辑考研信息</Button>
            </div>

            <div v-else class="edit-form">
              <div class="form-grid">
                <div class="form-item">
                  <Label for="targetSchool" class="form-label">目标院校</Label>
                  <Input id="targetSchool" v-model="examEditForm.targetSchool" placeholder="例如：北京大学、清华大学" class="form-input" />
                </div>
                <div class="form-item">
                  <Label for="targetMajor" class="form-label">目标专业</Label>
                  <Input id="targetMajor" v-model="examEditForm.targetMajor" placeholder="例如：金融学、会计学" class="form-input" />
                </div>
                <div class="form-item">
                  <Label for="examYear" class="form-label">考试年份</Label>
                  <Select v-model="examEditForm.examYear" class="form-select">
                    <SelectTrigger class="select-trigger">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent class="select-content">
                      <SelectItem value="" class="select-item">请选择</SelectItem>
                      <SelectItem value="2024" class="select-item">2025年</SelectItem>
                      <SelectItem value="2025" class="select-item">2026年</SelectItem>
                      <SelectItem value="2026" class="select-item">2027年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="form-item">
                  <Label for="prepPhase" class="form-label">备考阶段</Label>
                  <Select v-model="examEditForm.prepPhase" class="form-select">
                    <SelectTrigger class="select-trigger">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent class="select-content">
                      <SelectItem value="" class="select-item">请选择</SelectItem>
                      <SelectItem value="初期准备" class="select-item">初期准备</SelectItem>
                      <SelectItem value="基础强化" class="select-item">基础强化</SelectItem>
                      <SelectItem value="真题训练" class="select-item">真题训练</SelectItem>
                      <SelectItem value="冲刺阶段" class="select-item">冲刺阶段</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="form-item">
                  <Label for="dailyGoal" class="form-label">每日学习目标（小时）</Label>
                  <Input id="dailyGoal" type="number" v-model="examEditForm.dailyGoal" min="1" max="16" step="0.5" class="form-input" />
                </div>
              </div>
              <div class="form-actions">
                <Button @click="saveExamInfo" class="save-button">保存</Button>
                <Button variant="outline" @click="cancelEditingExam" class="cancel-button">取消</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/userService'
import { useUserStore } from '../../stores/userStore'
import { API_CONFIG, STORAGE_CONFIG } from '../../config'
import { apiService } from '../services/apiService'
import AvatarSelector from '../components/AvatarSelector.vue'

// 导入shadcn组件
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'vue-sonner'

// 使用用户状态存储
const userStore = useUserStore()
// 头像选择器状态
const showAvatarSelector = ref(false)
// 活动标签页
const activeTab = ref('profile')

const router = useRouter()
const isEditing = ref(false)
const isEditingExam = ref(false)
// 扩展User类型以包含额外的字段
interface ExtendedUser {
  id?: number;
  username: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  created_at?: string;
  email_verified?: boolean;
  avatar?: string;
  [key: string]: any;
}

const userInfo = ref<ExtendedUser>({
  id: 0,
  username: '',
  email: '',
  is_active: true,
  is_superuser: false,
  created_at: '',
  email_verified: false,
  avatar: ''
})

const userStats = ref({
  totalStudyTime: 0,
  completedTasks: 0,
  unlockedAchievements: 0,
  studyDays: 0
})

const editForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 考研信息
const examInfo = ref({
  targetSchool: '',
  targetMajor: '',
  examYear: '',
  prepPhase: '',
  dailyGoal: null
})

const examEditForm = ref({
  targetSchool: '',
  targetMajor: '',
  examYear: '',
  prepPhase: '',
  dailyGoal: null
})

// 计算用户名首字母作为头像
const userInitials = computed(() => {
  if (!userInfo.value.username) return '?'
  return userInfo.value.username.charAt(0).toUpperCase()
})

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 格式化时长
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} 分钟`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours} 小时 ${remainingMinutes} 分钟`
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    console.log('fetchUserInfo: 开始从后端获取用户信息')
    const response = await userService.getCurrentUser()

    if (response) {
      userInfo.value = response

      // 检查后端返回的头像数据
      if (response.avatar) {
        console.log('fetchUserInfo: 后端返回了头像数据')
        userInfo.value.avatar = response.avatar

        // 更新本地存储中的头像
        localStorage.setItem('user_avatar', response.avatar)
        console.log('fetchUserInfo: 已将后端头像保存到本地存储')

        // 如果后端返回的头像是data:URL或dicebear URL，直接使用
        if (response.avatar.startsWith('data:') || response.avatar.includes('dicebear.com')) {
          console.log('fetchUserInfo: 使用后端返回的头像 (data URL 或 dicebear URL)')
        } else {
          console.log('fetchUserInfo: 使用后端返回的头像 (其他格式)')
        }
      } else {
        console.log('fetchUserInfo: 后端没有返回头像数据')
        // 注意：这里不再尝试从本地存储获取头像
        // 这部分逻辑已移至 onMounted 钩子中，确保先尝试使用后端数据
      }
    }
  } catch (error) {
    console.error('fetchUserInfo: 获取用户信息失败:', error)
    toast.error('获取用户信息失败')

    // 在获取失败的情况下，才尝试从本地存储获取头像
    const localAvatar = localStorage.getItem('user_avatar')
    if (localAvatar) {
      console.log('fetchUserInfo: 获取失败，使用本地存储的头像')
      userInfo.value.avatar = localAvatar
    } else {
      // 如果本地也没有，生成一个默认头像
      console.log('fetchUserInfo: 生成默认头像')
      const username = userInfo.value.username || 'User'
      userInfo.value.avatar = `https://api.dicebear.com/7.x/initials/svg?chars=${username.charAt(0).toUpperCase()}`
      // 保存到本地存储
      localStorage.setItem('user_avatar', userInfo.value.avatar)
    }
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    // 获取任务统计
    const tasksResponse = await apiService.get(API_CONFIG.ENDPOINTS.STATISTICS.TOTAL)
    if (tasksResponse.data) {
      userStats.value.totalStudyTime = tasksResponse.data.total_duration || 0
      userStats.value.completedTasks = tasksResponse.data.total_tasks || 0
      userStats.value.studyDays = tasksResponse.data.unique_days || 0
    }

    // 获取成就统计
    const achievementsResponse = await apiService.get(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.BASE)
    if (achievementsResponse.data) {
      userStats.value.unlockedAchievements = achievementsResponse.data.filter(
        (achievement: any) => achievement.unlocked
      ).length
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
  }
}

// 开始编辑
const startEditing = () => {
  editForm.value.username = userInfo.value.username
  editForm.value.email = userInfo.value.email || ''
  editForm.value.password = ''
  editForm.value.confirmPassword = ''
  isEditing.value = true
}

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false
}

// 保存个人资料
const saveProfile = async () => {
  // 验证密码
  if (editForm.value.password && editForm.value.password !== editForm.value.confirmPassword) {
    toast.error('密码不匹配', {
      description: '两次输入的密码不一致',
      position: 'top-right'
    })
    return
  }

  try {
    const updateData: any = {
      username: editForm.value.username,
      email: editForm.value.email
    }

    // 如果输入了密码，则更新密码
    if (editForm.value.password) {
      updateData.password = editForm.value.password
    }

    // 调用API更新用户信息
    await apiService.put('/api/users/me', updateData)

    // 更新成功后刷新用户信息
    await fetchUserInfo()
    isEditing.value = false

    toast.success('更新成功', {
      description: '个人资料已更新',
      position: 'top-right'
    })
  } catch (error: any) {
    console.error('更新个人资料失败:', error)

    toast.error('更新失败', {
      description: error.response?.data?.detail || '未知错误',
      position: 'top-right'
    })
  }
}

// 开始编辑考研信息
const startEditingExam = () => {
  examEditForm.value.targetSchool = examInfo.value.targetSchool || ''
  examEditForm.value.targetMajor = examInfo.value.targetMajor || ''
  examEditForm.value.examYear = examInfo.value.examYear || ''
  examEditForm.value.prepPhase = examInfo.value.prepPhase || ''
  examEditForm.value.dailyGoal = examInfo.value.dailyGoal || null
  isEditingExam.value = true
}

// 取消编辑考研信息
const cancelEditingExam = () => {
  isEditingExam.value = false
}

// 保存考研信息
const saveExamInfo = () => {
  // 更新考研信息
  examInfo.value = { ...examEditForm.value }

  // 保存到本地存储
  localStorage.setItem('examInfo', JSON.stringify(examInfo.value))

  isEditingExam.value = false

  toast.success('更新成功', {
    description: '考研信息已更新',
    position: 'top-right'
  })
}

// 从本地存储加载考研信息
const loadExamInfo = () => {
  const savedExamInfo = localStorage.getItem('examInfo')
  if (savedExamInfo) {
    try {
      examInfo.value = JSON.parse(savedExamInfo)
    } catch (error) {
      console.error('加载考研信息失败:', error)
    }
  }
}

// 保存新头像
const saveNewAvatar = async (avatarUrl: string) => {
  try {
    // 更新用户头像状态
    await userStore.setAvatar(avatarUrl)

    // 更新本地用户信息
    userInfo.value.avatar = avatarUrl

    // 关闭头像选择器
    showAvatarSelector.value = false

    toast.success('头像已更新', {
      description: '您的新头像已保存',
      position: 'top-right'
    })
  } catch (error: any) {
    console.error('保存头像失败:', error)
    toast.error('保存失败', {
      description: error.response?.data?.detail || '未知错误',
      position: 'top-right'
    })
  }
}

// 组件挂载时获取用户信息和统计数据
onMounted(async () => {
  console.log('Profile: 组件挂载，开始获取用户信息')

  // 首先获取最新的用户信息（从后端）
  await fetchUserInfo()

  // 如果后端没有返回头像数据，才尝试使用本地缓存
  if (!userInfo.value.avatar) {
    console.log('Profile: 后端未返回头像，尝试使用本地缓存')
    const savedAvatar = localStorage.getItem('user_avatar')
    if (savedAvatar) {
      userInfo.value.avatar = savedAvatar
      console.log('Profile: 从本地存储加载头像成功')
    }
  }

  // 获取用户统计数据
  await fetchUserStats()

  // 加载考研信息
  loadExamInfo()
})
</script>

<style>
/* 苹果风格设计 */
:root {
  /* 基础颜色 - 苹果风格色调 */
  --background: 0 0% 100%;
  --foreground: 0 0% 12%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 12%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 12%;

  /* 主色调 - 苹果蓝 */
  --primary: 210 100% 45%;
  --primary-foreground: 0 0% 100%;

  /* 次要颜色 - 苹果灰 */
  --secondary: 0 0% 96%;
  --secondary-foreground: 0 0% 12%;

  /* 静音颜色 - 苹果浅灰 */
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;

  /* 强调色 - 苹果浅灰 */
  --accent: 0 0% 96%;
  --accent-foreground: 0 0% 12%;

  /* 警告色 - 苹果红 */
  --destructive: 0 100% 50%;
  --destructive-foreground: 0 0% 100%;

  /* 边框和输入框 - 苹果灰 */
  --border: 0 0% 90%;
  --input: 0 0% 90%;
  --ring: 210 100% 45%;

  /* 圆角 - 苹果风格圆角 */
  --radius: 0.8rem;

  /* 颜色变量 - 更高级的配色方案 */
  /* 蓝色系列 - 更深沉、高级 */
  --blue-50: #f0f7ff;
  --blue-100: #e0f0ff;
  --blue-200: #bae0ff;
  --blue-300: #7cc5ff;
  --blue-400: #36a3ff;
  --blue-500: #0086ff;
  --blue-600: #0067d6;
  --blue-700: #0054b0;
  --blue-800: #003e82;
  --blue-900: #002c5c;
  --blue-950: #001a38;

  /* 靛蓝色系列 - 更优雅 */
  --indigo-50: #eef2ff;
  --indigo-100: #e0e7ff;
  --indigo-200: #c7d2fe;
  --indigo-300: #a5b4fc;
  --indigo-400: #818cf8;
  --indigo-500: #6366f1;
  --indigo-600: #4f46e5;
  --indigo-700: #4338ca;
  --indigo-800: #3730a3;
  --indigo-900: #312e81;
  --indigo-950: #1e1b4b;

  /* 绿色系列 - 更柔和、高级 */
  --green-50: #f0fdf4;
  --green-100: #dcfce7;
  --green-200: #bbf7d0;
  --green-300: #86efac;
  --green-400: #4ade80;
  --green-500: #22c55e;
  --green-600: #16a34a;
  --green-700: #15803d;
  --green-800: #166534;
  --green-900: #14532d;
  --green-950: #052e16;

  /* 琥珀色系列 - 更温暖、高级 */
  --amber-50: #fffbeb;
  --amber-100: #fef3c7;
  --amber-200: #fde68a;
  --amber-300: #fcd34d;
  --amber-400: #fbbf24;
  --amber-500: #f59e0b;
  --amber-600: #d97706;
  --amber-700: #b45309;
  --amber-800: #92400e;
  --amber-900: #78350f;
  --amber-950: #451a03;

  /* 紫色系列 - 更高贵、精致 */
  --purple-50: #faf5ff;
  --purple-100: #f3e8ff;
  --purple-200: #e9d5ff;
  --purple-300: #d8b4fe;
  --purple-400: #c084fc;
  --purple-500: #a855f7;
  --purple-600: #9333ea;
  --purple-700: #7e22ce;
  --purple-800: #6b21a8;
  --purple-900: #581c87;
  --purple-950: #3b0764;

  /* 棕色系列 - 更高级、优雅 */
  --brown-50: #fdf8f6;
  --brown-100: #f2e8e5;
  --brown-200: #eaddd7;
  --brown-300: #e0cec7;
  --brown-400: #d2bab0;
  --brown-500: #bfa094;
  --brown-600: #a18072;
  --brown-700: #977669;
  --brown-800: #846358;
  --brown-900: #43302b;
}

.dark {
  /* 暗色模式基础颜色 - 更精致的深色调 */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  /* 主色调 - 更明亮但不刺眼的蓝色 */
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;

  /* 次要颜色 - 更精致的深灰色 */
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  /* 静音颜色 - 更柔和的深灰色 */
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  /* 强调色 - 更精致的深灰色 */
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  /* 警告色 - 更柔和的红色 */
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  /* 边框和输入框 - 更精致的深灰色 */
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;

  /* 暗色模式颜色变量 - 更精致的配色 */
  --blue-950: #0f172a;
  --blue-900: #1e293b;
  --blue-800: #1e40af;
  --blue-700: #1d4ed8;
  --blue-600: #2563eb;
  --blue-500: #3b82f6;
  --blue-400: #60a5fa;
  --blue-300: #93c5fd;
  --blue-200: #bfdbfe;
  --blue-100: #dbeafe;
  --blue-50: #eff6ff;

  --green-950: #052e16;
  --green-900: #14532d;
  --green-800: #166534;
  --green-700: #15803d;
  --green-600: #16a34a;
  --green-500: #22c55e;
  --green-400: #4ade80;
  --green-300: #86efac;
  --green-200: #bbf7d0;
  --green-100: #dcfce7;
  --green-50: #f0fdf4;

  --amber-950: #451a03;
  --amber-900: #78350f;
  --amber-800: #92400e;
  --amber-700: #b45309;
  --amber-600: #d97706;
  --amber-500: #f59e0b;
  --amber-400: #fbbf24;
  --amber-300: #fcd34d;
  --amber-200: #fde68a;
  --amber-100: #fef3c7;
  --amber-50: #fffbeb;

  --purple-950: #3b0764;
  --purple-900: #581c87;
  --purple-800: #6b21a8;
  --purple-700: #7e22ce;
  --purple-600: #9333ea;
  --purple-500: #a855f7;
  --purple-400: #c084fc;
  --purple-300: #d8b4fe;
  --purple-200: #e9d5ff;
  --purple-100: #f3e8ff;
  --purple-50: #faf5ff;

  --brown-900: #43302b;
  --brown-800: #846358;
  --brown-700: #977669;
  --brown-600: #a18072;
  --brown-500: #bfa094;
  --brown-400: #d2bab0;
  --brown-300: #e0cec7;
  --brown-200: #eaddd7;
  --brown-100: #f2e8e5;
  --brown-50: #fdf8f6;
}
</style>

<style scoped>
/* 苹果风格设计 - 个人资料页面 */
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f5f5f7;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
}

/* 头像选择器对话框 */
.avatar-selector-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.avatar-selector-content {
  width: 90%;
  max-width: 550px;
  border-radius: 20px;
  background-color: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.avatar-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f7;
}

.avatar-selector-header h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #86868b;
}

/* 个人资料卡片 */
.profile-card {
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
  border: none;
  transition: all 0.3s ease;
}

.profile-header {
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  background: linear-gradient(135deg, #f0f0f3 0%, #ffffff 100%);
  border-bottom: 1px solid #f5f5f7;
}

@media (min-width: 768px) {
  .profile-header {
    flex-direction: row;
    align-items: center;
  }
}

.avatar-container {
  position: relative;
}

.profile-avatar {
  width: 130px !important;
  height: 130px !important;
  border-radius: 65px !important;
  border: 5px solid white !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1) !important;
  transition: transform 0.3s ease !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  overflow: hidden !important;
  background-color: #f0f0f3 !important;
}

.profile-avatar:hover {
  transform: scale(1.05);
}

.avatar-fallback {
  font-size: 3rem !important;
  background: linear-gradient(135deg, #0071e3 0%, #42a1ec 100%) !important;
  color: white !important;
  font-weight: 600 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
  height: 100% !important;
}

.edit-avatar-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid #f5f5f7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 1;
}

.edit-avatar-button:hover {
  transform: scale(1.15);
  background-color: #f5f5f7;
}

.edit-icon {
  font-size: 18px;
}

.user-info {
  text-align: center;
}

@media (min-width: 768px) {
  .user-info {
    text-align: left;
  }
}

.username {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1d1d1f;
}

.user-email {
  font-size: 1rem;
  color: #86868b;
  margin: 0 0 0.75rem 0;
}

.user-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

@media (min-width: 768px) {
  .user-badges {
    justify-content: flex-start;
  }
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

/* 统计卡片 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f8fa 100%);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f3;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #0071e3 0%, #42a1ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 0.9rem;
  color: #86868b;
  margin: 0;
  font-weight: 500;
}

/* 标签页 */
.apple-tabs {
  padding: 0 1.5rem 1.5rem;
}

.tab-buttons {
  display: flex;
  background-color: #f5f5f7;
  border-radius: 12px;
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tab-button {
  flex: 1;
  padding: 0.75rem 1rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 500;
  color: #86868b;
  background: none;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.tab-button.active {
  color: #1d1d1f;
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  border-radius: 10px;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s ease;
  z-index: -1;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.tab-button.active::before {
  opacity: 1;
  transform: scale(1);
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 信息卡片 */
.info-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: white;
  border: none;
  transition: all 0.3s ease;
}

.info-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.info-card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f5f5f7;
  background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
}

.info-card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 0.5rem 0;
}

.info-card-description {
  font-size: 0.9rem;
  color: #86868b;
  margin: 0;
}

.info-card-content {
  padding: 2rem;
}

/* 信息展示 */
.info-display {
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.9rem;
  color: #86868b;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #1d1d1f;
  font-weight: 500;
  padding: 0.5rem 0;
  margin: 0;
}

/* 编辑按钮 */
.edit-button {
  background-color: #0071e3;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1.5rem;
  transition: all 0.2s ease;
}

.edit-button:hover {
  background-color: #0077ed;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 113, 227, 0.3);
}

/* 编辑表单 */
.edit-form {
  animation: fadeIn 0.3s ease;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  color: #86868b;
  font-weight: 500;
}

.form-input {
  font-size: 1rem;
  color: #1d1d1f;
  border: 1px solid #e5e5ea;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  background-color: #f5f5f7;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: #0071e3;
  box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.15);
  background-color: white;
}

/* 表单操作按钮 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.save-button {
  background-color: #0071e3;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-button:hover {
  background-color: #0077ed;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 113, 227, 0.3);
}

.cancel-button {
  background-color: transparent;
  color: #0071e3;
  border: 1px solid #0071e3;
  border-radius: 20px;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background-color: rgba(0, 113, 227, 0.05);
  transform: translateY(-2px);
}

/* 成就和考研信息卡片 */
.exam-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: white;
  border: none;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.exam-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.exam-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f5f5f7;
  background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .profile-container {
    padding: 15px;
  }
}

/* 小屏幕手机适配 */
@media (max-width: 480px) {
  .profile-container {
    padding: 10px;
  }
}
</style>
