import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const validateTask = task => {
  return task?.id &&
    typeof task?.name === 'string' &&
    Number.isInteger(task?.duration) &&
    task.duration > 0 &&
    !isNaN(new Date(task.end).getTime())
}

export default new Vuex.Store({
  state: {
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    plans: JSON.parse(localStorage.getItem('plans')) || [],
    achievements: JSON.parse(localStorage.getItem('achievements')) || {},
    selectedRange: 'day'
  },
  mutations: {
    ADD_TASK(state, task) {
      if (!validateTask(task)) return
      state.tasks.unshift(task)
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    DELETE_TASK(state, taskId) {
      state.tasks = state.tasks.filter(t => t.id !== taskId)
      localStorage.setItem('tasks', JSON.stringify(state.tasks))
    },
    ADD_PLAN(state, plan) {
      if (!plan.text?.trim()) return
      state.plans.push({
        id: Date.now(),
        text: plan.text.trim(),
        completed: false
      })
      localStorage.setItem('plans', JSON.stringify(state.plans))
    },
    TOGGLE_PLAN(state, planId) {
      state.plans = state.plans.map(p => 
        p.id === planId ? { ...p, completed: !p.completed } : p
      )
      localStorage.setItem('plans', JSON.stringify(state.plans))
    },
    UPDATE_ACHIEVEMENTS(state, achievements) {
      state.achievements = achievements
      localStorage.setItem('achievements', JSON.stringify(achievements))
    },
    SET_RANGE(state, range) {
      state.selectedRange = range
    }
  },
  actions: {
    checkAchievements({ commit, state }) {
      const validTasks = state.tasks.filter(validateTask)
      const achievements = {}

      // 成就检查逻辑
      Object.entries({
        beginner: tasks => Math.floor(tasks.length / 10),
        serious: tasks => Math.floor(Math.max(...tasks.map(t => t.duration)))/ 60
      }).forEach(([key, calcLevel]) => {
        achievements[key] = {
          level: Math.min(calcLevel(validTasks), 3)
        }
      })

      commit('UPDATE_ACHIEVEMENTS', achievements)
    }
  },
  getters: {
    filteredTasks: (state) => {
      const now = new Date()
      let startDate

      switch(state.selectedRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - now.getDay()))
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default: // day
          startDate = new Date(now.setHours(0,0,0,0))
      }

      return state.tasks.filter(task => 
        new Date(task.end) >= startDate
      )
    },
    heatmapData: (state, getters) => {
      const hours = Array(24).fill(0)
      getters.filteredTasks.forEach(t => {
        hours[new Date(t.end).getHours()]++
      })
      return hours.map((count, hour) => ({ hour, count }))
    }
  }
})