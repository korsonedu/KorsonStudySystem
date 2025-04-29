let plans = JSON.parse(localStorage.getItem('plans')) || [];

function addPlan() {
    const input = document.getElementById('planInput');
    const text = input.value.trim();
    if (!text) return;

    const newPlan = {
        id: Date.now(),
        text: text,
        completed: false
    };

    plans.push(newPlan);
    localStorage.setItem('plans', JSON.stringify(plans));
    input.value = '';
    renderPlans();
}

function renderPlans() {
    const list = document.getElementById('planList');
    list.innerHTML = plans.map(plan => `
        <li class="plan-item ${plan.completed ? 'completed' : ''}" 
            draggable="true"
            data-plan-id="${plan.id}">
            <div class="plan-content">
                <input type="checkbox" ${plan.completed ? 'checked' : ''} 
                    onchange="togglePlan(${plan.id})">
                <span class="plan-text">${plan.text}</span>
            </div>
        </li>
    `).join('');

    // 添加拖拽事件
    document.querySelectorAll('.plan-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
    });
}

function togglePlan(id) {
    plans = plans.map(plan => 
        plan.id === id ? {...plan, completed: !plan.completed} : plan
    );
    localStorage.setItem('plans', JSON.stringify(plans));
    renderPlans();
}

function handleDragStart(e) {
    const planId = e.target.dataset.planId;
    e.dataTransfer.setData('text/plain', planId);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderPlans();
    // 番茄钟输入区接收拖放
    document.querySelector('.time-setter').addEventListener('drop', e => {
        const planId = e.dataTransfer.getData('text/plain');
        const plan = plans.find(p => p.id == planId);
        taskNameInput.value = plan.text;
        e.preventDefault();
    });
    document.querySelector('.time-setter').addEventListener('dragover', e => {
        e.preventDefault();
    });
});