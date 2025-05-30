export interface Task {
  id: number
  title: string
  name?: string
  status: 'ongoing' | 'completed'
  completed: boolean
  startTime?: string
  endTime?: string
  start?: string
  end?: string
  duration?: number
  userId?: number
  user_id?: number
  user?: {
    id: number
    username: string
  }
  // 兼容旧版本字段
  start_time?: string
  end_time?: string
} 