<template>
  <div class="plan-sidebar">
    <div class="plan-control">
      <input type="text" v-model="newPlan" placeholder="添加今日计划">
      <button @click="addPlan">➕</button>
    </div>
    <ul id="planList">
      <li v-for="plan in plans" :key="plan.id" class="plan-item" :class="{ completed: plan.completed }" draggable="true" @dragstart="handleDragStart(plan.id)">
        <div class="plan-content">
          <input type="checkbox" v-model="plan.completed" @change="togglePlan(plan.id)">
          <span class="plan-text">{{ plan.text }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      newPlan: '',
      plans: []
    };
  },
  created() {
    this.fetchPlans();
  },
  methods: {
    async fetchPlans() {
      try {
        const response = await axios.get('/api/plans');
        this.plans = response.data.plans;
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
    },
    async addPlan() {
      if (this.newPlan.trim() === '') return;
      try {
        const response = await axios.post('/api/plans', { text: this.newPlan });
        this.plans.push(response.data.plan);
        this.newPlan = '';
      } catch (error) {
        console.error('Error adding plan:', error);
      }
    },
    async togglePlan(id) {
      try {
        const plan = this.plans.find(p => p.id === id);
        await axios.put(`/api/plans/${id}`, { completed: !plan.completed });
        plan.completed = !plan.completed;
      } catch (error) {
        console.error('Error updating plan:', error);
      }
    },
    handleDragStart(planId) {
      event.dataTransfer.setData('text/plain', planId);
    }
  }
}
</script>

<style scoped>
.plan-sidebar {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.plan-control {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.plan-control input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.plan-control button {
  padding: 10px 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.plan-item {
  padding: 12px 15px;
  margin: 8px 0;
  background: rgba(52, 152, 219, 0.03);
  border-radius: 8px;
  cursor: grab;
}

.plan-item.completed .plan-text {
  text-decoration: line-through;
  color: #95a5a6;
}

.plan-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plan-content input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #2ecc71;
}
</style>