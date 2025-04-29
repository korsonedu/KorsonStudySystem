/**
 * 成就定义文件
 * 包含所有成就的前端展示信息
 */

export interface AchievementLevel {
  level: number;
  description: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  levels: AchievementLevel[];
}

// 成就图标映射
const ACHIEVEMENT_ICONS: Record<number, string> = {
  1: '💰', // 金融启蒙者
  2: '🌙', // 夜间交易员
  3: '📈', // 巴菲特的学徒
  4: '🌅', // 晨间市场分析师
  5: '📊', // 长线投资者
  6: '📚', // 知识投资组合管理者
  7: '🚀', // 高效执行交易员
  8: '🧠', // 深度研究分析师
  9: '🎯', // 周末金融学者
  10: '⚡', // 高频学习交易员
  11: '🌍', // 宏观经济学大师
  12: '🔬', // 微观经济学探索者
  13: '📊', // 计量经济学统计大师
  14: '💵', // 货币银行学专家
  15: '🌐', // 国际金融理论家
  16: '🏢', // 公司金融策略师
  17: '💎', // 投资学精算师
  18: '🔄', // 金融衍生品工程师
  19: '🛡️', // 风险管理守护者
  20: '🤖', // 金融科技创新者
};

// 成就定义
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    name: '速通！',
    description: '每一段伟大的旅程都始于第一步，你已经踏上了知识的征程',
    icon: ACHIEVEMENT_ICONS[1],
    levels: [
      { level: 1, description: '完成1个番茄钟任务' },
      { level: 2, description: '完成20个番茄钟任务' },
      { level: 3, description: '完成60个番茄钟任务' }
    ]
  },
  {
    id: 2,
    name: '别吵，我在烧烤',
    description: '当别人在睡觉时，你在点亮知识的明灯，夜晚是你的主场',
    icon: ACHIEVEMENT_ICONS[2],
    levels: [
      { level: 1, description: '在晚上10点后完成1个任务' },
      { level: 2, description: '在晚上10点后完成12个任务' },
      { level: 3, description: '在晚上10点后完成30个任务' }
    ]
  },
  {
    id: 3,
    name: '时间管理大法师',
    description: '投资时间是最有价值的决策，你已经开始积累丰厚的知识回报',
    icon: ACHIEVEMENT_ICONS[3],
    levels: [
      { level: 1, description: '累计学习时间达到1小时' },
      { level: 2, description: '累计学习时间达到15小时' },
      { level: 3, description: '累计学习时间达到50小时' }
    ]
  },
  {
    id: 4,
    name: '早起的鸟儿真香',
    description: '清晨的阳光照在你的书本上，知识的光芒照进你的大脑',
    icon: ACHIEVEMENT_ICONS[4],
    levels: [
      { level: 1, description: '在早上6点前开始1个任务' },
      { level: 2, description: '在早上6点前开始8个任务' },
      { level: 3, description: '在早上6点前开始20个任务' }
    ]
  },
  {
    id: 5,
    name: '马拉松选手',
    description: '学习不是短跑，而是马拉松，你已经证明了自己的耐力',
    icon: ACHIEVEMENT_ICONS[5],
    levels: [
      { level: 1, description: '连续3天完成至少1个任务' },
      { level: 2, description: '连续10天完成至少1个任务' },
      { level: 3, description: '连续21天完成至少1个任务' }
    ]
  },
  {
    id: 6,
    name: '计划通',
    description: '你的大脑就像一个知识的仓库，不断地囤积着智慧的财富',
    icon: ACHIEVEMENT_ICONS[6],
    levels: [
      { level: 1, description: '创建5个学习计划' },
      { level: 2, description: '创建18个学习计划' },
      { level: 3, description: '创建40个学习计划' }
    ]
  },
  {
    id: 7,
    name: '任务粉碎机',
    description: '如果效率有CEO，那一定是你，没有任务能逃过你的火眼金睛',
    icon: ACHIEVEMENT_ICONS[7],
    levels: [
      { level: 1, description: '完成3个计划中的任务' },
      { level: 2, description: '完成12个计划中的任务' },
      { level: 3, description: '完成25个计划中的任务' }
    ]
  },
  {
    id: 8,
    name: '专注力MAX',
    description: '在这个充满干扰的世界里，你的专注力就是超能力',
    icon: ACHIEVEMENT_ICONS[8],
    levels: [
      { level: 1, description: '完成一个25分钟以上的任务' },
      { level: 2, description: '完成10个25分钟以上的任务' },
      { level: 3, description: '完成25个25分钟以上的任务' }
    ]
  },
  {
    id: 9,
    name: '周末不摆烂',
    description: '别人周末在玩耍，你却在知识的海洋里遨游，这才是真正的强者',
    icon: ACHIEVEMENT_ICONS[9],
    levels: [
      { level: 1, description: '在周末完成1个任务' },
      { level: 2, description: '在周末完成10个任务' },
      { level: 3, description: '在周末完成20个任务' }
    ]
  },
  {
    id: 10,
    name: '学习机器人',
    description: '你对知识的渴望让人敬畏，你的大脑永不满足，学习永不停歇',
    icon: ACHIEVEMENT_ICONS[10],
    levels: [
      { level: 1, description: '单日完成3个任务' },
      { level: 2, description: '单日完成7个任务' },
      { level: 3, description: '单日完成12个任务' }
    ]
  },
  {
    id: 11,
    name: '凯恩斯亲传弟子',
    description: '你对经济学的理解如同凯恩斯再世，宏观调控在你手中如同儿戏',
    icon: ACHIEVEMENT_ICONS[11],
    levels: [
      { level: 1, description: '完成3个包含"经济"关键词的任务' },
      { level: 2, description: '完成10个包含"经济"关键词的任务' },
      { level: 3, description: '完成20个包含"经济"关键词的任务' }
    ]
  },
  {
    id: 12,
    name: '数学小天才',
    description: '数字和公式在你手中如同魔法，揭示世界的奥秘',
    icon: ACHIEVEMENT_ICONS[12],
    levels: [
      { level: 1, description: '完成3个包含"数学"或"统计"关键词的任务' },
      { level: 2, description: '完成10个包含"数学"或"统计"关键词的任务' },
      { level: 3, description: '完成20个包含"数学"或"统计"关键词的任务' }
    ]
  },
  {
    id: 13,
    name: '英语小达人',
    description: '语言是沟通的桥梁，你已经掌握了这把打开世界的钥匙',
    icon: ACHIEVEMENT_ICONS[13],
    levels: [
      { level: 1, description: '完成3个包含"英语"关键词的任务' },
      { level: 2, description: '完成10个包含"英语"关键词的任务' },
      { level: 3, description: '完成20个包含"英语"关键词的任务' }
    ]
  },
  {
    id: 14,
    name: '央行行长候选人',
    description: '你对货币和银行体系的理解让央行行长都自愧不如',
    icon: ACHIEVEMENT_ICONS[14],
    levels: [
      { level: 1, description: '完成3个包含"货币"或"银行"关键词的任务' },
      { level: 2, description: '完成10个包含"货币"或"银行"关键词的任务' },
      { level: 3, description: '完成20个包含"货币"或"银行"关键词的任务' }
    ]
  },
  {
    id: 15,
    name: '华尔街之狼',
    description: '你对金融理论的理解深入骨髓，成为你思考的基础',
    icon: ACHIEVEMENT_ICONS[15],
    levels: [
      { level: 1, description: '完成3个包含"金融"关键词的任务' },
      { level: 2, description: '完成10个包含"金融"关键词的任务' },
      { level: 3, description: '完成20个包含"金融"关键词的任务' }
    ]
  },
  {
    id: 16,
    name: '会计界的扫地僧',
    description: '数字背后是企业的命脉，你已经掌握了解读它们的能力',
    icon: ACHIEVEMENT_ICONS[16],
    levels: [
      { level: 1, description: '完成3个包含"财务"或"会计"关键词的任务' },
      { level: 2, description: '完成10个包含"财务"或"会计"关键词的任务' },
      { level: 3, description: '完成20个包含"财务"或"会计"关键词的任务' }
    ]
  },
  {
    id: 17,
    name: '巴菲特接班人',
    description: '你对投资理论的掌握让你能够在任何市场环境中找到机会',
    icon: ACHIEVEMENT_ICONS[17],
    levels: [
      { level: 1, description: '完成3个包含"投资"关键词的任务' },
      { level: 2, description: '完成10个包含"投资"关键词的任务' },
      { level: 3, description: '完成20个包含"投资"关键词的任务' }
    ]
  },
  {
    id: 18,
    name: '考研战神',
    description: '考研路上的每一步都充满挑战，而你正在勇敢前行',
    icon: ACHIEVEMENT_ICONS[18],
    levels: [
      { level: 1, description: '完成3个包含"考研"关键词的任务' },
      { level: 2, description: '完成10个包含"考研"关键词的任务' },
      { level: 3, description: '完成20个包含"考研"关键词的任务' }
    ]
  },
  {
    id: 19,
    name: '知识就是力量',
    description: '你的学习范围广泛而深入，是真正的知识探索者',
    icon: ACHIEVEMENT_ICONS[19],
    levels: [
      { level: 1, description: '获得3个其他成就' },
      { level: 2, description: '获得8个其他成就' },
      { level: 3, description: '获得15个其他成就' }
    ]
  },
  {
    id: 20,
    name: '人生赢家',
    description: '你已经征服了所有挑战，站在了知识的巅峰，未来将属于你',
    icon: ACHIEVEMENT_ICONS[20],
    levels: [
      { level: 1, description: '解锁5个成就' },
      { level: 2, description: '解锁12个成就' },
      { level: 3, description: '解锁18个成就' }
    ]
  }
];

/**
 * 获取指定ID的成就定义
 * @param id 成就ID
 * @returns 成就定义对象
 */
export function getAchievementById(id: number): Achievement | undefined {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
}

/**
 * 获取所有成就定义
 * @returns 所有成就定义
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}
