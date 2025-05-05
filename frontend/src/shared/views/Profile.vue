<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-avatar">
        <div class="avatar-circle">
          <span v-if="!userInfo.avatar">{{ userInitials }}</span>
          <img v-else :src="userInfo.avatar" alt="用户头像" />
        </div>
      </div>
      <div class="profile-info">
        <h1>{{ userInfo.username }}</h1>
        <p class="email">{{ userInfo.email || '未设置邮箱' }}</p>
        <p class="join-date">加入时间: {{ formatDate(userInfo.created_at) }}</p>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-section">
        <h2>基本信息</h2>
        <div class="form-group" v-if="!isEditing">
          <div class="info-item">
            <span class="label">用户名:</span>
            <span class="value">{{ userInfo.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">邮箱:</span>
            <span class="value">{{ userInfo.email || '未设置' }}</span>
            <span v-if="userInfo.email && userInfo.email_verified" class="verified-badge">已验证</span>
            <span v-else-if="userInfo.email && !userInfo.email_verified" class="unverified-badge">未验证</span>
          </div>
          <div class="info-item">
            <span class="label">账号状态:</span>
            <span class="value">{{ userInfo.is_active ? '正常' : '已禁用' }}</span>
          </div>
          <button class="edit-btn" @click="startEditing">编辑资料</button>
        </div>

        <div class="form-group" v-else>
          <div class="form-item">
            <label for="username">用户名</label>
            <input type="text" id="username" v-model="editForm.username" />
          </div>
          <div class="form-item">
            <label for="email">邮箱</label>
            <input type="email" id="email" v-model="editForm.email" />
          </div>
          <div class="form-item">
            <label for="password">新密码 (留空则不修改)</label>
            <input type="password" id="password" v-model="editForm.password" />
          </div>
          <div class="form-item">
            <label for="confirmPassword">确认新密码</label>
            <input type="password" id="confirmPassword" v-model="editForm.confirmPassword" />
          </div>
          <div class="form-actions">
            <button class="save-btn" @click="saveProfile">保存</button>
            <button class="cancel-btn" @click="cancelEditing">取消</button>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>考研信息</h2>
        <div class="form-group" v-if="!isEditingExam">
          <div class="info-item">
            <span class="label">目标院校:</span>
            <span class="value">{{ examInfo.targetSchool || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">目标专业:</span>
            <span class="value">{{ examInfo.targetMajor || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">考试年份:</span>
            <span class="value">{{ examInfo.examYear || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">备考阶段:</span>
            <span class="value">{{ examInfo.prepPhase || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">每日目标:</span>
            <span class="value">{{ examInfo.dailyGoal ? `${examInfo.dailyGoal} 小时` : '未设置' }}</span>
          </div>
          <button class="edit-btn" @click="startEditingExam">编辑考研信息</button>
        </div>

        <div class="form-group" v-else>
          <div class="form-item">
            <label for="targetSchool">目标院校</label>
            <input type="text" id="targetSchool" v-model="examEditForm.targetSchool" placeholder="例如：北京大学、清华大学" />
          </div>
          <div class="form-item">
            <label for="targetMajor">目标专业</label>
            <input type="text" id="targetMajor" v-model="examEditForm.targetMajor" placeholder="例如：金融学、会计学" />
          </div>
          <div class="form-item">
            <label for="examYear">考试年份</label>
            <select id="examYear" v-model="examEditForm.examYear">
              <option value="">请选择</option>
              <option value="2024">2024年</option>
              <option value="2025">2025年</option>
              <option value="2026">2026年</option>
            </select>
          </div>
          <div class="form-item">
            <label for="prepPhase">备考阶段</label>
            <select id="prepPhase" v-model="examEditForm.prepPhase">
              <option value="">请选择</option>
              <option value="初期准备">初期准备</option>
              <option value="基础强化">基础强化</option>
              <option value="真题训练">真题训练</option>
              <option value="冲刺阶段">冲刺阶段</option>
            </select>
          </div>
          <div class="form-item">
            <label for="dailyGoal">每日学习目标（小时）</label>
            <input type="number" id="dailyGoal" v-model="examEditForm.dailyGoal" min="1" max="16" step="0.5" />
          </div>
          <div class="form-actions">
            <button class="save-btn" @click="saveExamInfo">保存</button>
            <button class="cancel-btn" @click="cancelEditingExam">取消</button>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>学习统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <h3>总学习时间</h3>
              <p>{{ formatDuration(userStats.totalStudyTime) }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>完成任务数</h3>
              <p>{{ userStats.completedTasks }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <h3>解锁成就</h3>
              <p>{{ userStats.unlockedAchievements }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <h3>学习天数</h3>
              <p>{{ userStats.studyDays }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { API_CONFIG } from '../../config'
import axios from 'axios'

const router = useRouter()
const isEditing = ref(false)
const isEditingExam = ref(false)
const userInfo = ref({
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
    const response = await authService.getCurrentUser()
    if (response) {
      userInfo.value = response
      console.log('获取到用户信息:', userInfo.value)
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    // 获取任务统计
    const tasksResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/study/statistics/tasks`)
    if (tasksResponse.data) {
      userStats.value.totalStudyTime = tasksResponse.data.total_duration || 0
      userStats.value.completedTasks = tasksResponse.data.total_tasks || 0
      userStats.value.studyDays = tasksResponse.data.unique_days || 0
    }

    // 获取成就统计
    const achievementsResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/study/achievements`)
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
    alert('两次输入的密码不一致')
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
    alert('个人资料更新成功')
  } catch (error: any) {
    console.error('更新个人资料失败:', error)
    alert(`更新失败: ${error.response?.data?.detail || '未知错误'}`)
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
  if (!userService.isLoggedIn.value) {
    router.push('/login')
    return
  }

  await fetchUserInfo()
  await fetchUserStats()
  loadExamInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.profile-avatar {
  margin-right: 30px;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  border: 3px solid white;
}

.avatar-circle img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info h1 {
  margin: 0 0 5px;
  color: #2c3e50;
  font-size: 28px;
}

.email {
  color: #7f8c8d;
  margin: 0 0 5px;
  font-size: 16px;
}

.join-date {
  color: #95a5a6;
  margin: 0;
  font-size: 14px;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.profile-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.profile-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 20px;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 10px;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.label {
  font-weight: 600;
  width: 100px;
  color: #7f8c8d;
}

.value {
  color: #2c3e50;
}

.verified-badge {
  background: #2ecc71;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 10px;
}

.unverified-badge {
  background: #e74c3c;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 10px;
}

.edit-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 15px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #7f8c8d;
}

.form-item input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border 0.3s ease;
}

.form-item input:focus,
.form-item select:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-item select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border 0.3s ease;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.save-btn {
  background: #2ecc71;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
}

.cancel-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #f5f7fa, #e4e8f0);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  font-size: 2rem;
  margin-right: 15px;
  color: #3498db;
}

.stat-content h3 {
  margin: 0 0 5px;
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-content p {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-avatar {
    margin-right: 0;
    margin-bottom: 20px;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .label {
    width: auto;
    margin-bottom: 5px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
