// achievements.js 完整修正代码
const ACHIEVEMENTS = {
    beginner: {
        title: '🎓 入门学者',
        levels: [
            { condition: tasks => tasks?.length >= 3, desc: '完成3次学习任务' },
            { condition: tasks => tasks?.length >= 10, desc: '完成10次学习任务' },
            { condition: tasks => tasks?.length >= 30, desc: '完成30次学习任务' }
        ]
    },
    serious: {
        title: '⏳ 认真一刻',
        levels: [
            { condition: tasks => tasks?.some(t => t.duration >= 1), desc: '完成至少1分钟的学习' },
            { condition: tasks => tasks?.some(t => t.duration >= 15), desc: '完成至少15分钟的学习' },
            { condition: tasks => tasks?.some(t => t.duration >= 60), desc: '完成至少60分钟的学习' }
        ]
    }
};

class AchievementManager {
    constructor() {
        this.state = this.loadState();
    }

    loadState() {
        try {
            const stored = localStorage.getItem('achievements');
            return stored ? this.validateState(JSON.parse(stored)) : this.initDefaultState();
        } catch (e) {
            console.error('成就状态加载失败:', e);
            return this.initDefaultState();
        }
    }

    validateState(state) {
        return Object.keys(ACHIEVEMENTS).reduce((acc, key) => {
            acc[key] = {
                level: Math.min(
                    state?.[key]?.level || 0,
                    ACHIEVEMENTS[key].levels.length
                )
            };
            return acc;
        }, {});
    }

    initDefaultState() {
        return Object.keys(ACHIEVEMENTS).reduce((acc, key) => {
            acc[key] = { level: 0 };
            return acc;
        }, {});
    }

    saveState() {
        localStorage.setItem('achievements', JSON.stringify(this.state));
    }

    check(tasks = []) {
        this.state = this.initDefaultState();
        const validTasks = tasks.filter(t => 
            t?.id &&
            typeof t?.name === 'string' &&
            Number.isInteger(t?.duration) &&
            t.duration > 0 &&
            !isNaN(new Date(t?.end).getTime())
        );

        Object.entries(ACHIEVEMENTS).forEach(([id, config]) => {
            let currentLevel = 0;
            const maxLevel = config.levels.length;

            while (currentLevel < maxLevel) {
                if (config.levels[currentLevel].condition(validTasks)) {
                    currentLevel++;
                } else {
                    break;
                }
            }

            this.state[id].level = currentLevel;
        });
        this.saveState();
    }
}

class AchievementRenderer {
    constructor() {
        this.handleCardClick = this.handleCardClick.bind(this);
    }

    createCard(config, state) {
        const card = document.createElement('div');
        card.className = `achievement-card ${state.level > 0 ? 'unlocked' : 'locked'}`;
        
        const totalLevels = config.levels.length;
        const progress = totalLevels > 0 ? 
            Math.round((state.level / totalLevels) * 100) : 0;

        card.innerHTML = `
            <div class="card-header">
                <h3>${config.title}</h3>
                <div class="status">${state.level > 0 ? '✅ 已解锁' : '🔒 未解锁'}</div>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="levels-container">
                ${config.levels.map((level, index) => `
                    <div class="level ${index < state.level ? 'unlocked' : 'locked'}">
                        <span class="level-number">Lv.${index + 1}</span>
                        <span class="level-desc">${level.desc}</span>
                        <span class="level-status">${index < state.level ? '✅' : '🔒'}</span>
                    </div>
                `).join('')}
            </div>
        `;
        return card;
    }

    handleCardClick(e) {
        const card = e.target.closest('.achievement-card');
        if (!card) return;

        // 排除等级元素点击
        if (e.target.closest('.level')) return;

        const wasExpanded = card.classList.contains('expanded');
        document.querySelectorAll('.achievement-card').forEach(c => {
            c.classList.remove('expanded');
        });

        if (!wasExpanded) {
            card.classList.add('expanded');
            const clickOutside = (event) => {
                if (!card.contains(event.target)) {
                    card.classList.remove('expanded');
                    document.removeEventListener('click', clickOutside);
                }
            };
            setTimeout(() => document.addEventListener('click', clickOutside));
        }
    }

    render(manager) {
        const container = document.getElementById('achievementsContainer');
        container.innerHTML = '';
        
        // 移除旧监听器
        container.removeEventListener('click', this.handleCardClick);
        
        // 添加新监听器
        container.addEventListener('click', this.handleCardClick);

        Object.entries(ACHIEVEMENTS).forEach(([id, config]) => {
            const state = manager.state[id];
            container.appendChild(this.createCard(config, state));
        });
    }
}

function initAchievementSystem() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    const manager = new AchievementManager();
    const renderer = new AchievementRenderer();

    window.addEventListener('storage', () => {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        manager.check(tasks);
        renderer.render(manager);
    });

    try {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        manager.check(tasks);
        renderer.render(manager);
    } catch (e) {
        console.error('成就系统初始化失败:', e);
        container.innerHTML = '<div class="error">成就数据加载失败</div>';
    }
}

document.addEventListener('DOMContentLoaded', initAchievementSystem);