# backend/app/achievements_definitions.py
"""
成就定义文件
包含所有成就的名称、描述、解锁条件和等级
"""

ACHIEVEMENTS = [
    {
        "id": 1,
        "name": "速通！学习入门",
        "description": "每一段伟大的旅程都始于第一步，你已经踏上了知识的征程",
        "levels": [
            {
                "level": 1,
                "description": "完成1个番茄钟任务",
                "condition": lambda user_stats: user_stats["total_tasks"] >= 1
            },
            {
                "level": 2,
                "description": "完成20个番茄钟任务",
                "condition": lambda user_stats: user_stats["total_tasks"] >= 20
            },
            {
                "level": 3,
                "description": "完成60个番茄钟任务",
                "condition": lambda user_stats: user_stats["total_tasks"] >= 60
            }
        ]
    },
    {
        "id": 2,
        "name": "别吵，我在烧烤！",
        "description": "当别人在睡觉时，你在点亮知识的明灯，夜晚是你的主场",
        "levels": [
            {
                "level": 1,
                "description": "在晚上10点后完成1个任务",
                "condition": lambda user_stats: user_stats["night_tasks"] >= 1
            },
            {
                "level": 2,
                "description": "在晚上10点后完成12个任务",
                "condition": lambda user_stats: user_stats["night_tasks"] >= 12
            },
            {
                "level": 3,
                "description": "在晚上10点后完成30个任务",
                "condition": lambda user_stats: user_stats["night_tasks"] >= 30
            }
        ]
    },
    {
        "id": 3,
        "name": "时间管理大法师",
        "description": "投资时间是最有价值的决策，你已经开始积累丰厚的知识回报",
        "levels": [
            {
                "level": 1,
                "description": "累计学习时间达到1小时",
                "condition": lambda user_stats: user_stats["total_minutes"] >= 60
            },
            {
                "level": 2,
                "description": "累计学习时间达到15小时",
                "condition": lambda user_stats: user_stats["total_minutes"] >= 900
            },
            {
                "level": 3,
                "description": "累计学习时间达到50小时",
                "condition": lambda user_stats: user_stats["total_minutes"] >= 3000
            }
        ]
    },
    {
        "id": 4,
        "name": "早起的鸟儿真香",
        "description": "清晨的阳光照在你的书本上，知识的光芒照进你的大脑",
        "levels": [
            {
                "level": 1,
                "description": "在早上6点前开始1个任务",
                "condition": lambda user_stats: user_stats["early_tasks"] >= 1
            },
            {
                "level": 2,
                "description": "在早上6点前开始8个任务",
                "condition": lambda user_stats: user_stats["early_tasks"] >= 8
            },
            {
                "level": 3,
                "description": "在早上6点前开始20个任务",
                "condition": lambda user_stats: user_stats["early_tasks"] >= 20
            }
        ]
    },
    {
        "id": 5,
        "name": "连续签到王",
        "description": "学习不是短跑，而是马拉松，你已经证明了自己的耐力",
        "levels": [
            {
                "level": 1,
                "description": "连续3天完成至少1个任务",
                "condition": lambda user_stats: user_stats["streak_days"] >= 3
            },
            {
                "level": 2,
                "description": "连续10天完成至少1个任务",
                "condition": lambda user_stats: user_stats["streak_days"] >= 10
            },
            {
                "level": 3,
                "description": "连续21天完成至少1个任务",
                "condition": lambda user_stats: user_stats["streak_days"] >= 21
            }
        ]
    },
    {
        "id": 6,
        "name": "计划通！",
        "description": "你的大脑就像一个知识的仓库，不断地囤积着智慧的财富",
        "levels": [
            {
                "level": 1,
                "description": "创建5个学习计划",
                "condition": lambda user_stats: user_stats["total_plans"] >= 5
            },
            {
                "level": 2,
                "description": "创建18个学习计划",
                "condition": lambda user_stats: user_stats["total_plans"] >= 18
            },
            {
                "level": 3,
                "description": "创建40个学习计划",
                "condition": lambda user_stats: user_stats["total_plans"] >= 40
            }
        ]
    },
    {
        "id": 7,
        "name": "任务粉碎机",
        "description": "如果效率有CEO，那一定是你，没有任务能逃过你的火眼金睛",
        "levels": [
            {
                "level": 1,
                "description": "完成3个计划中的任务",
                "condition": lambda user_stats: user_stats["completed_plans"] >= 3
            },
            {
                "level": 2,
                "description": "完成12个计划中的任务",
                "condition": lambda user_stats: user_stats["completed_plans"] >= 12
            },
            {
                "level": 3,
                "description": "完成25个计划中的任务",
                "condition": lambda user_stats: user_stats["completed_plans"] >= 25
            }
        ]
    },
    {
        "id": 8,
        "name": "专注力MAX",
        "description": "在这个充满干扰的世界里，你的专注力就是超能力",
        "levels": [
            {
                "level": 1,
                "description": "完成一个25分钟以上的任务",
                "condition": lambda user_stats: user_stats["long_tasks"] >= 1
            },
            {
                "level": 2,
                "description": "完成10个25分钟以上的任务",
                "condition": lambda user_stats: user_stats["long_tasks"] >= 10
            },
            {
                "level": 3,
                "description": "完成25个25分钟以上的任务",
                "condition": lambda user_stats: user_stats["long_tasks"] >= 25
            }
        ]
    },
    {
        "id": 9,
        "name": "周末不摆烂",
        "description": "别人周末在玩耍，你却在知识的海洋里遨游，这才是真正的强者",
        "levels": [
            {
                "level": 1,
                "description": "在周末完成1个任务",
                "condition": lambda user_stats: user_stats["weekend_tasks"] >= 1
            },
            {
                "level": 2,
                "description": "在周末完成10个任务",
                "condition": lambda user_stats: user_stats["weekend_tasks"] >= 10
            },
            {
                "level": 3,
                "description": "在周末完成20个任务",
                "condition": lambda user_stats: user_stats["weekend_tasks"] >= 20
            }
        ]
    },
    {
        "id": 10,
        "name": "学习机器人",
        "description": "你对知识的渴望让人敬畏，你的大脑永不满足，学习永不停歇",
        "levels": [
            {
                "level": 1,
                "description": "单日完成3个任务",
                "condition": lambda user_stats: user_stats["max_daily_tasks"] >= 3
            },
            {
                "level": 2,
                "description": "单日完成7个任务",
                "condition": lambda user_stats: user_stats["max_daily_tasks"] >= 7
            },
            {
                "level": 3,
                "description": "单日完成12个任务",
                "condition": lambda user_stats: user_stats["max_daily_tasks"] >= 12
            }
        ]
    },
    {
        "id": 11,
        "name": "凯恩斯亲传弟子",
        "description": "你对经济学的理解如同凯恩斯再世，宏观调控在你手中如同儿戏",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"经济\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("economics_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"经济\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("economics_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"经济\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("economics_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 12,
        "name": "数学小天才",
        "description": "数字和公式在你手中如同魔法，揭示世界的奥秘",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"数学\"或\"统计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("math_stats_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"数学\"或\"统计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("math_stats_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"数学\"或\"统计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("math_stats_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 13,
        "name": "英语小达人",
        "description": "语言是沟通的桥梁，你已经掌握了这把打开世界的钥匙",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"英语\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("english_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"英语\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("english_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"英语\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("english_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 14,
        "name": "央行行长候选人",
        "description": "你对货币和银行体系的理解让央行行长都自愧不如",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"货币\"或\"银行\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("money_banking_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"货币\"或\"银行\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("money_banking_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"货币\"或\"银行\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("money_banking_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 15,
        "name": "华尔街之狼",
        "description": "你对金融理论的理解深入骨髓，成为你思考的基础",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"金融\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("finance_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"金融\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("finance_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"金融\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("finance_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 16,
        "name": "会计界的扫地僧",
        "description": "数字背后是企业的命脉，你已经掌握了解读它们的能力",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"财务\"或\"会计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("accounting_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"财务\"或\"会计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("accounting_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"财务\"或\"会计\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("accounting_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 17,
        "name": "巴菲特接班人",
        "description": "你对投资理论的掌握让你能够在任何市场环境中找到机会",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"投资\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("investment_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"投资\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("investment_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"投资\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("investment_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 18,
        "name": "考研战神",
        "description": "考研路上的每一步都充满挑战，而你正在勇敢前行",
        "levels": [
            {
                "level": 1,
                "description": "完成3个包含\"考研\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("exam_prep_tasks", 0) >= 3
            },
            {
                "level": 2,
                "description": "完成10个包含\"考研\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("exam_prep_tasks", 0) >= 10
            },
            {
                "level": 3,
                "description": "完成20个包含\"考研\"关键词的任务",
                "condition": lambda user_stats: user_stats.get("exam_prep_tasks", 0) >= 20
            }
        ]
    },
    {
        "id": 19,
        "name": "知识就是力量",
        "description": "你的学习范围广泛而深入，是真正的知识探索者",
        "levels": [
            {
                "level": 1,
                "description": "获得3个其他成就",
                "condition": lambda user_stats: user_stats.get("total_achievements", 0) >= 3
            },
            {
                "level": 2,
                "description": "获得8个其他成就",
                "condition": lambda user_stats: user_stats.get("total_achievements", 0) >= 8
            },
            {
                "level": 3,
                "description": "获得15个其他成就",
                "condition": lambda user_stats: user_stats.get("total_achievements", 0) >= 15
            }
        ]
    },
    {
        "id": 20,
        "name": "人生赢家",
        "description": "你已经征服了所有挑战，站在了知识的巅峰，未来将属于你",
        "levels": [
            {
                "level": 1,
                "description": "解锁5个成就",
                "condition": lambda user_stats: user_stats.get("unlocked_achievements", 0) >= 5
            },
            {
                "level": 2,
                "description": "解锁12个成就",
                "condition": lambda user_stats: user_stats.get("unlocked_achievements", 0) >= 12
            },
            {
                "level": 3,
                "description": "解锁18个成就",
                "condition": lambda user_stats: user_stats.get("unlocked_achievements", 0) >= 18
            }
        ]
    }
]

def get_achievement_by_id(achievement_id):
    """获取指定ID的成就定义"""
    for achievement in ACHIEVEMENTS:
        if achievement["id"] == achievement_id:
            return achievement
    return None

def get_all_achievements():
    """获取所有成就定义"""
    return ACHIEVEMENTS
