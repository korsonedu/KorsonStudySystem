export interface User {
  id: number
  username: string
  email?: string
  privacyMode?: boolean
  lastActivity?: number
  avatar?: string
  role?: string
  createdAt?: string
  updatedAt?: string
}

export interface OnlineUser {
  id: number
  username: string
  lastActivity: number
  privacyMode?: boolean
  avatar?: string
} 