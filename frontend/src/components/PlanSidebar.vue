<template>
    <div class="plan-sidebar">
      <!-- 添加计划输入框 -->
      <div class="plan-input">
        <input 
          v-model="newPlan" 
          placeholder="添加新计划"
          @keyup.enter="addPlan"
        >
        <button @click="addPlan">➕</button>
      </div>
  
      <!-- 计划列表 -->
      <draggable 
        v-model="sortedPlans"
        group="plans"
        @end="saveOrder"
        handle=".drag-handle"
      >
        <transition-group name="list">
          <div 
            v-for="plan in sortedPlans"
            :key="plan.id"
            class="plan-item"
            :class="{ completed: plan.completed }"
          >
            <span class="drag-handle">☰</span>
            <input 
              type="checkbox" 
              v-model="plan.completed"
              @change="togglePlanStatus(plan.id)"
            >
            <span class="plan-text">{{ plan.text }}</span>
            <button @click="removePlan(plan.id)" class="delete-btn">×</button>
          </div>
        </transition-group>
      </draggable>
    </div>
  </template>
  
  <script>
  import { mapState, mapMutations } from 'vuex'
  import draggable from 'vuedraggable'
  
  export default {
    components: { draggable },
    data: () => ({
      newPlan: ''
    }),
    computed: {
      ...mapState(['plans']),
      sortedPlans: {
        get() { return this.plans },
        set(value) { this.$store.commit('UPDATE_PLANS', value) }
      }
    },
    methods: {
      ...mapMutations(['ADD_PLAN', 'TOGGLE_PLAN', 'DELETE_PLAN', 'UPDATE_PLANS']),
      addPlan() {
        if (this.newPlan.trim()) {
          this.ADD_PLAN({
            id: Date.now(),
            text: this.newPlan.trim(),
            completed: false
          })
          this.newPlan = ''
        }
      },
      togglePlanStatus(id) {
        this.TOGGLE_PLAN(id)
      },
      removePlan(id) {
        this.DELETE_PLAN(id)
      },
      saveOrder() {
        localStorage.setItem('plans', JSON.stringify(this.sortedPlans))
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .plan-sidebar {
    background: var(--card-bg);
    padding: 20px;
    border-radius: 15px;
    height: calc(100vh - 160px);
    overflow-y: auto;
  }
  
  .plan-input {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  
    input {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #eee;
      border-radius: 8px;
    }
  
    button {
      padding: 0 12px;
      background: var(--secondary-color);
      color: white;
    }
  }
  
  .plan-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    margin: 8px 0;
    background: rgba(52, 152, 219, 0.05);
    border-radius: 8px;
    transition: all 0.2s;
  
    &.completed .plan-text {
      text-decoration: line-through;
      opacity: 0.6;
    }
  
    .drag-handle {
      cursor: move;
      opacity: 0.4;
      &:hover { opacity: 1 }
    }
  
    .plan-text {
      flex: 1;
      word-break: break-word;
    }
  
    .delete-plan {
      background: none;
      border: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 1.2em;
      padding: 0 5px;
    }
  }
  </style>