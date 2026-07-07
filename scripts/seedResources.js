/**
 * Seed generator for CampusShelf campus resources.
 *
 * Run once with:  node scripts/seedResources.js
 * It writes data/resources/resources.json (>=30 resources across all 6 categories)
 * and data/comments/comments.json (a few sample comments).
 *
 * The script is idempotent-ish: it always regenerates the files so the demo
 * data stays consistent. Dates are spread across the last ~25 days so the
 * "最近 7 天发布趋势" chart in the admin dashboard has real data to show.
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RES_FILE = path.join(DATA_DIR, 'resources', 'resources.json');
const COM_FILE = path.join(DATA_DIR, 'comments', 'comments.json');

const CATEGORIES = ['textbook', 'notes', 'exam', 'report', 'ebook', 'supplies'];
const CAMPUSES = ['奉贤校区', '徐汇校区', '闵行校区', '松江校区'];
const CONDITIONS = ['全新', '几乎全新', '轻微笔记', '有明显使用痕迹'];
const SELLERS = ['张明', '李思', '王芳', '陈晨', '赵磊', '刘洋', '孙悦', '周婷', '吴昊', '郑爽', '黄磊', '徐静'];

const SEED = {
  textbook: [
    { title: '高等数学（同济第七版）上下册', courseName: '高等数学', price: 35, tags: ['教材', '数学', '同济'] },
    { title: '大学英语四级考试真题集（2023）', courseName: '大学英语', price: 20, tags: ['英语', '四级', '真题'] },
    { title: '数据结构（C语言版）严蔚敏', courseName: '数据结构', price: 28, tags: ['计算机', '教材', 'C语言'] },
    { title: '计算机网络（谢希仁 第7版）', courseName: '计算机网络', price: 30, tags: ['计算机', '网络', '教材'] },
    { title: '线性代数（同济第六版）', courseName: '线性代数', price: 18, tags: ['数学', '教材'] },
    { title: '有机化学（高鸿宾 第四版）', courseName: '有机化学', price: 33, tags: ['化学', '教材'] }
  ],
  notes: [
    { title: '信号与系统 手写精华笔记', courseName: '信号与系统', price: 15, tags: ['笔记', '期末', '手写'] },
    { title: '操作系统 期末复习笔记', courseName: '操作系统', price: 12, tags: ['计算机', '笔记', '期末'] },
    { title: '概率论与数理统计 高分笔记', courseName: '概率论', price: 14, tags: ['数学', '笔记'] },
    { title: '电路分析 考点笔记', courseName: '电路分析', price: 13, tags: ['电子', '笔记'] },
    { title: '微观经济学 课堂笔记', courseName: '微观经济学', price: 16, tags: ['经管', '笔记'] },
    { title: 'Python程序设计 实验笔记', courseName: 'Python程序设计', price: 10, tags: ['编程', '笔记', 'Python'] }
  ],
  exam: [
    { title: '2024考研数学一 历年真题详解', courseName: '考研数学', price: 40, tags: ['考研', '数学', '真题'] },
    { title: '考研英语（一）阅读理解精练', courseName: '考研英语', price: 25, tags: ['考研', '英语', '阅读'] },
    { title: '计算机408 统考真题汇编', courseName: '考研408', price: 45, tags: ['考研', '408', '计算机'] },
    { title: '考研政治 冲刺背诵手册', courseName: '考研政治', price: 22, tags: ['考研', '政治'] },
    { title: '考研专业课 数据结构题库', courseName: '考研专业课', price: 30, tags: ['考研', '数据结构', '题库'] },
    { title: '考研复试 面试经验合集', courseName: '考研复试', price: 18, tags: ['考研', '复试', '经验'] }
  ],
  report: [
    { title: '大学物理实验报告模板（含数据）', courseName: '大学物理实验', price: 8, tags: ['实验', '模板', '物理'] },
    { title: '化学分析实验报告范例', courseName: '化学分析实验', price: 9, tags: ['实验', '化学', '范例'] },
    { title: '单片机课程设计报告', courseName: '单片机原理', price: 15, tags: ['实验', '单片机', '课程设计'] },
    { title: '生物化学实验报告范文', courseName: '生物化学实验', price: 10, tags: ['实验', '生物', '范文'] },
    { title: '工程训练 金工实习报告', courseName: '工程训练', price: 12, tags: ['实验', '金工', '实习'] },
    { title: '传感器原理 实验报告', courseName: '传感器原理', price: 11, tags: ['实验', '传感器'] }
  ],
  ebook: [
    { title: '《算法导论》中文PDF电子版', courseName: '算法', price: 5, tags: ['电子书', '算法', 'PDF'] },
    { title: '考研词汇闪过 电子讲义', courseName: '考研英语', price: 6, tags: ['电子书', '考研', '词汇'] },
    { title: '计量经济学 电子教材', courseName: '计量经济学', price: 7, tags: ['电子书', '经管'] },
    { title: '简明日语教程 电子书', courseName: '二外日语', price: 6, tags: ['电子书', '日语'] },
    { title: '考研数学公式手册 PDF', courseName: '考研数学', price: 4, tags: ['电子书', '公式', 'PDF'] },
    { title: '雅思写作高分范文集 PDF', courseName: '雅思', price: 8, tags: ['电子书', '雅思', '写作'] }
  ],
  supplies: [
    { title: '九成新 得力科学计算器', courseName: '通用', price: 25, tags: ['用品', '计算器'] },
    { title: 'A4活页笔记本 5本套装', courseName: '通用', price: 18, tags: ['用品', '笔记本'] },
    { title: '荧光笔记号笔 12色套装', courseName: '通用', price: 15, tags: ['用品', '笔'] },
    { title: '二手 iPad 2021 学习平板', courseName: '通用', price: 1200, tags: ['用品', '平板', '二手'] },
    { title: '桌面护眼台灯', courseName: '通用', price: 35, tags: ['用品', '台灯'] },
    { title: '考研倒计时日历 定制款', courseName: '通用', price: 12, tags: ['用品', '日历', '考研'] }
  ]
};

const DESC = {
  textbook: '校内正版教材，成色良好，无缺页，适合本学期课程使用，价格低于书店新书。',
  notes: '本人期末整理的高分笔记，重点突出、条理清晰，配合课本复习事半功倍。',
  exam: '考研核心资料，涵盖真题与解析，助你高效备考、少走弯路。',
  report: '实验报告标准模板与范文，格式规范、数据完整，可作参考范例。',
  ebook: '高清电子版，即刻发送，方便在手机/平板上随时阅读与标注。',
  supplies: '实用学习好物，自用闲置转让，成色如实描述，诚心出。'
};

const now = Date.now();
const DAY = 86400000;
const resources = [];
let idx = 0;

CATEGORIES.forEach((cat) => {
  SEED[cat].forEach((item, i) => {
    idx++;
    const status = i === 0 && cat === 'exam' ? 'pending'   // one pending to demo review
      : (cat === 'supplies' && i === 3) ? 'sold'            // one sold
      : 'approved';
    const createdOffset = (idx % 25) + 1; // spread across ~25 days
    const created = new Date(now - createdOffset * DAY);
    resources.push({
      id: uuidv4(),
      title: item.title,
      category: cat,
      price: item.price,
      condition: CONDITIONS[idx % CONDITIONS.length],
      description: DESC[cat],
      imageUrl: `/img/cat-${cat}.svg`,
      sellerName: SELLERS[idx % SELLERS.length],
      sellerContact: `qq${(10000 + idx * 137) % 99999}@qq.com`,
      campus: CAMPUSES[idx % CAMPUSES.length],
      courseName: item.courseName,
      tags: item.tags,
      status: status,
      views: 20 + ((idx * 37) % 480),
      favoritesCount: (idx * 7) % 60,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString()
    });
  });
});

fs.mkdirSync(path.dirname(RES_FILE), { recursive: true });
fs.writeFileSync(RES_FILE, JSON.stringify(resources, null, 2), 'utf-8');

// A few sample comments on the first few approved resources.
const sampleComments = [];
const approved = resources.filter(r => r.status === 'approved').slice(0, 6);
const commentTexts = [
  { user: '学妹小白', text: '资料很新，和描述一致，推荐！', rating: 5 },
  { user: '考研党阿强', text: '内容详实，对我帮助很大。', rating: 4 },
  { user: '匿名用户', text: '发货快，沟通顺畅。', rating: 5 }
];
approved.forEach((r, ri) => {
  const c = commentTexts[ri % commentTexts.length];
  sampleComments.push({
    id: uuidv4(),
    resourceId: r.id,
    userName: c.user,
    text: c.text,
    rating: c.rating,
    createdAt: new Date(now - (ri + 1) * DAY).toISOString()
  });
});

fs.mkdirSync(path.dirname(COM_FILE), { recursive: true });
fs.writeFileSync(COM_FILE, JSON.stringify(sampleComments, null, 2), 'utf-8');

console.log(`Seeded ${resources.length} resources (categories: ${CATEGORIES.join(', ')}) and ${sampleComments.length} comments.`);
console.log(`pending=${resources.filter(r => r.status === 'pending').length}, sold=${resources.filter(r => r.status === 'sold').length}`);
