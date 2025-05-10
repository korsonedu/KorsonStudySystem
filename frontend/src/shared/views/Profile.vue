<template>
  <div class="container mx-auto p-4 pt-16 max-w-5xl">
    <Card class="mb-8 overflow-hidden">
      <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 flex flex-col md:flex-row items-center gap-6 user-header">
        <Avatar class="w-24 h-24 border-4 border-white shadow-lg">
          <AvatarImage v-if="userInfo.avatar" :src="userInfo.avatar" alt="用户头像" />
          <AvatarFallback class="text-3xl">
            {{ userInitials }}
          </AvatarFallback>
        </Avatar>

        <div class="text-center md:text-left">
          <h1 class="text-2xl font-bold">{{ userInfo.username }}</h1>
          <p class="text-muted-foreground">{{ userInfo.email || '未设置邮箱' }}</p>
          <div class="flex items-center gap-2 mt-2 justify-center md:justify-start user-badges">
            <Badge v-if="userInfo.email && userInfo.email_verified" class="badge-success">已验证邮箱</Badge>
            <Badge v-else-if="userInfo.email && !userInfo.email_verified" class="badge-destructive">未验证邮箱</Badge>
            <Badge variant="outline">加入时间: {{ formatDate(userInfo.created_at) }}</Badge>
          </div>
        </div>
      </div>
    </Card>

    <Tabs default-value="profile" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="profile">个人资料</TabsTrigger>
        <TabsTrigger value="exam">考研信息</TabsTrigger>
        <TabsTrigger value="stats">学习统计</TabsTrigger>
      </TabsList>

      <!-- 个人资料标签页 -->
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>查看和更新您的个人资料</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="!isEditing">
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label>用户名</Label>
                  <p class="text-base">{{ userInfo.username }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>邮箱</Label>
                  <p class="text-base">{{ userInfo.email || '未设置' }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>账号状态</Label>
                  <p class="text-base">{{ userInfo.is_active ? '正常' : '已禁用' }}</p>
                </div>
              </div>
              <Button class="mt-6" @click="startEditing">编辑资料</Button>
            </div>

            <div v-else class="space-y-4">
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label for="username">用户名</Label>
                  <Input id="username" v-model="editForm.username" />
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="email">邮箱</Label>
                  <Input id="email" type="email" v-model="editForm.email" />
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="password">新密码 (留空则不修改)</Label>
                  <Input id="password" type="password" v-model="editForm.password" />
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="confirmPassword">确认新密码</Label>
                  <Input id="confirmPassword" type="password" v-model="editForm.confirmPassword" />
                </div>
              </div>
              <div class="flex gap-2">
                <Button @click="saveProfile">保存</Button>
                <Button variant="outline" @click="cancelEditing">取消</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- 考研信息标签页 -->
      <TabsContent value="exam">
        <Card>
          <CardHeader>
            <CardTitle>考研信息</CardTitle>
            <CardDescription>设置您的考研目标和计划</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="!isEditingExam">
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label>目标院校</Label>
                  <p class="text-base">{{ examInfo.targetSchool || '未设置' }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>目标专业</Label>
                  <p class="text-base">{{ examInfo.targetMajor || '未设置' }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>考试年份</Label>
                  <p class="text-base">{{ examInfo.examYear || '未设置' }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>备考阶段</Label>
                  <p class="text-base">{{ examInfo.prepPhase || '未设置' }}</p>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label>每日目标</Label>
                  <p class="text-base">{{ examInfo.dailyGoal ? `${examInfo.dailyGoal} 小时` : '未设置' }}</p>
                </div>
              </div>
              <Button class="mt-6" @click="startEditingExam">编辑考研信息</Button>
            </div>

            <div v-else class="space-y-4">
              <div class="grid gap-4">
                <div class="flex flex-col space-y-1.5">
                  <Label for="targetSchool">目标院校</Label>
                  <Input id="targetSchool" v-model="examEditForm.targetSchool" placeholder="例如：北京大学、清华大学" />
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="targetMajor">目标专业</Label>
                  <Input id="targetMajor" v-model="examEditForm.targetMajor" placeholder="例如：金融学、会计学" />
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="examYear">考试年份</Label>
                  <Select v-model="examEditForm.examYear">
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">请选择</SelectItem>
                      <SelectItem value="2024">2024年</SelectItem>
                      <SelectItem value="2025">2025年</SelectItem>
                      <SelectItem value="2026">2026年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="prepPhase">备考阶段</Label>
                  <Select v-model="examEditForm.prepPhase">
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">请选择</SelectItem>
                      <SelectItem value="初期准备">初期准备</SelectItem>
                      <SelectItem value="基础强化">基础强化</SelectItem>
                      <SelectItem value="真题训练">真题训练</SelectItem>
                      <SelectItem value="冲刺阶段">冲刺阶段</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <Label for="dailyGoal">每日学习目标（小时）</Label>
                  <Input id="dailyGoal" type="number" v-model="examEditForm.dailyGoal" min="1" max="16" step="0.5" />
                </div>
              </div>
              <div class="flex gap-2">
                <Button @click="saveExamInfo">保存</Button>
                <Button variant="outline" @click="cancelEditingExam">取消</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- 学习统计标签页 -->
      <TabsContent value="stats">
        <Card>
          <CardHeader>
            <CardTitle>学习统计</CardTitle>
            <CardDescription>查看您的学习进度和成就</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card class="card-stats">
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="rounded-full bg-blue-100 dark:bg-blue-900 p-3 text-blue-600 dark:text-blue-300 text-xl">⏱️</div>
                  <div>
                    <p class="text-sm text-muted-foreground">总学习时间</p>
                    <p class="text-2xl font-bold">{{ formatDuration(userStats.totalStudyTime) }}</p>
                  </div>
                </CardContent>
              </Card>

              <Card class="card-stats">
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="rounded-full bg-green-100 dark:bg-green-900 p-3 text-green-600 dark:text-green-300 text-xl">📊</div>
                  <div>
                    <p class="text-sm text-muted-foreground">完成任务数</p>
                    <p class="text-2xl font-bold">{{ userStats.completedTasks }}</p>
                  </div>
                </CardContent>
              </Card>

              <Card class="card-stats">
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="rounded-full bg-amber-100 dark:bg-amber-900 p-3 text-amber-600 dark:text-amber-300 text-xl">🏆</div>
                  <div>
                    <p class="text-sm text-muted-foreground">解锁成就</p>
                    <p class="text-2xl font-bold">{{ userStats.unlockedAchievements }}</p>
                  </div>
                </CardContent>
              </Card>

              <Card class="card-stats">
                <CardContent class="p-6 flex items-center gap-4">
                  <div class="rounded-full bg-purple-100 dark:bg-purple-900 p-3 text-purple-600 dark:text-purple-300 text-xl">📅</div>
                  <div>
                    <p class="text-sm text-muted-foreground">学习天数</p>
                    <p class="text-2xl font-bold">{{ userStats.studyDays }}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '../services/userService'
import { API_CONFIG } from '../../config'
import axios from 'axios'

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
    const response = await userService.getCurrentUser()
    if (response) {
      // 将response转换为ExtendedUser类型
      userInfo.value = {
        ...response,
        // 确保所有必需的字段都存在
        id: response.id || 0,
        username: response.username,
        email: response.email || '',
        is_active: response.is_active !== undefined ? response.is_active : true,
        is_superuser: response.is_superuser !== undefined ? response.is_superuser : false,
        created_at: response.created_at || new Date().toISOString(),
        email_verified: response.email_verified !== undefined ? response.email_verified : false,
        avatar: response.avatar || ''
      }
      console.log('获取到用户信息:', userInfo.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    // 获取用户统计数据
    const statsResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/users/me/statistics`)
    if (statsResponse.data) {
      userStats.value.totalStudyTime = statsResponse.data.total_study_time || 0
      userStats.value.completedTasks = statsResponse.data.completed_tasks || 0
      userStats.value.studyDays = statsResponse.data.study_days || 0
      userStats.value.unlockedAchievements = statsResponse.data.unlocked_achievements || 0
    }
  } catch (error) {
    console.error('获取用户统计数据失败:', error)

    // 设置默认值，确保UI正常显示
    userStats.value = {
      totalStudyTime: 120, // 默认2小时
      completedTasks: 5,
      unlockedAchievements: 2,
      studyDays: 3
    }

    toast.error('获取统计数据失败', {
      description: '无法连接到服务器，显示默认数据',
      position: 'top-right'
    })
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
    await axios.put(`${API_CONFIG.BASE_URL}/api/users/me`, updateData)

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

// 组件挂载时获取用户信息和统计数据
onMounted(async () => {
  // 检查用户是否已登录
  if (!userService.isLoggedIn) {
    router.push('/login')
    return
  }

  await fetchUserInfo()
  await fetchUserStats()
  loadExamInfo()
})
</script>

<style scoped>
/* 自定义样式 */
:deep(.avatar-fallback) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-weight: 600;
}

:deep(.badge) {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

:deep(.badge-success) {
  background-color: #10b981;
  color: white;
}

:deep(.badge-destructive) {
  background-color: #ef4444;
  color: white;
}

/* 卡片动画效果 */
:deep(.card) {
  transition: all 0.3s ease;
}

:deep(.card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .user-header {
    flex-direction: column;
    text-align: center;
  }

  .user-badges {
    justify-content: center;
  }
}


</style>
