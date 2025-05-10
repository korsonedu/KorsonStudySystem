<script setup lang="ts">
import { ref, defineProps } from 'vue'
import { Button } from '@/components/ui/button'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { toast } from 'vue-sonner'

// 定义组件属性
const props = defineProps({
  courseName: {
    type: String,
    required: true
  },
  courseId: {
    type: Number,
    required: true
  }
})

// 使用番茄钟状态存储
const pomodoroStore = usePomodoroStore()

// 番茄钟时间选项（分钟）
const pomodoroTimeOptions = [
  { label: '25分钟', value: 25 },
  { label: '30分钟', value: 30 },
  { label: '45分钟', value: 45 },
  { label: '60分钟', value: 60 }
]

// 选中的番茄钟时间
const selectedTime = ref(25)

/**
 * 启动番茄钟
 */
const startPomodoro = () => {
  // 使用番茄钟存储启动计时器
  const success = pomodoroStore.startFromCourse(props.courseName, selectedTime.value)
  
  if (success) {
    toast.success('番茄钟已启动', {
      description: `开始学习 ${props.courseName}，持续 ${selectedTime.value} 分钟`,
    })
  } else {
    toast.error('启动失败', {
      description: '无法启动番茄钟，请稍后再试',
    })
  }
}
</script>

<template>
  <div class="course-actions">
    <h3 class="actions-title">课程操作</h3>
    
    <div class="action-group">
      <div class="action-label">番茄钟学习</div>
      
      <div class="time-selector">
        <select v-model="selectedTime" class="time-select">
          <option v-for="option in pomodoroTimeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <Button @click="startPomodoro" class="action-button">
        开始专注学习
      </Button>
    </div>
  </div>
</template>

<style scoped>
.course-actions {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.actions-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.action-label {
  font-size: 14px;
  color: #555;
  min-width: 80px;
}

.time-selector {
  position: relative;
}

.time-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #ddd;
  background-color: white;
  font-size: 14px;
  min-width: 100px;
  appearance: none;
  cursor: pointer;
}

.time-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.action-button {
  background-color: var(--primary-color);
  color: white;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .action-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .time-select, .action-button {
    width: 100%;
  }
}
</style>
