/**
 * CampusShelf MySQL Seed Script
 *
 * Seeds the MySQL database with demo data:
 * - 2 users (admin + student)
 * - 36+ resources (6 per category, inc. free ones)
 * - 10+ comments
 * - 5+ orders with items
 * - 8 wanted posts
 *
 * Safe to re-run: checks for existing data before inserting.
 */
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// ----- Configuration -----
const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'campusshelf',
  password: process.env.DB_PASSWORD || 'Zlt20060313#',
  database: process.env.DB_NAME || 'campusshelf',
  multipleStatements: true,
};

// ----- Seed Data -----
const CATEGORIES = [
  { key: 'textbook', label: '二手教材' },
  { key: 'notes',    label: '课程笔记' },
  { key: 'exam',     label: '考研资料' },
  { key: 'report',   label: '实验报告' },
  { key: 'ebook',    label: '电子书' },
  { key: 'supplies', label: '学习用品' },
];

const CAMPUSES = ['徐汇校区', '闵行校区', '奉贤校区', '杨浦校区'];
const CONDITIONS = ['全新', '几乎全新', '轻微笔记', '有明显使用痕迹'];
const COURSES = ['高等数学', '大学英语', '数据结构', 'Python程序设计', '大学物理', '线性代数', '操作系统', '计算机网络'];

const USERS = [
  { name: '管理员', email: 'admin@campusshelf.com', password: 'admin123', role: 'admin', campus: '徐汇校区' },
  { name: '演示学生', email: 'student@campusshelf.com', password: 'student123', role: 'student', campus: '闵行校区' },
];

function resourceTitles(cat, idx) {
  const titles = {
    textbook: ['高等数学（同济第七版）上下册', '大学英语四级考试真题集（2023）', '数据结构（C语言版）严蔚敏',
               '线性代数（第六版）', '概率论与数理统计', 'C Primer Plus 第六版'],
    notes:    ['Python 课程重点笔记', '高数上期末复习笔记', '数据结构考点整理',
               '大学物理公式汇总', '线代知识点思维导图', '操作系统期末复习提纲'],
    exam:     ['2024考研数学一真题解析', '考研英语词汇红宝书', '考研政治肖秀荣精讲精练',
               '考研专业课-数据结构真题', '考研数学二历年真题', '考研英语阅读理解精析'],
    report:   ['大学物理实验报告-力学', '模电实验报告全系列', '计算机网络实验报告',
               '数据库课程设计报告', '嵌入式系统实验报告', '化学实验报告-有机化学'],
    ebook:    ['JavaScript高级程序设计（第4版）', '算法导论（CLRS）电子版', '深入理解计算机系统',
               'Clean Code 代码整洁之道', 'Think Python 中文版', '计算机网络-自顶向下方法'],
    supplies: ['卡西欧科学计算器 FX-991CNX', '绘图套尺+T 型尺套装', '电子工程实验箱',
               '全新笔记本 A5 硬面抄', '二手微积分教材（赠送）', '四级词汇书+配套练习'],
  };
  return titles[cat]?.[idx] || `${cat} 资源 #${idx + 1}`;
}

function resourceTags(cat) {
  const map = {
    textbook: ['教材', '数学', '英语', '计算机', '参考书'],
    notes:    ['笔记', '期末', '考点', '复习', '知识点'],
    exam:     ['考研', '真题', '数学', '英语', '政治'],
    report:   ['实验', '报告', '物理', '电路', '化学'],
    ebook:    ['电子书', '编程', '算法', '计算机', '自学'],
    supplies: ['文具', '工具', '计算器', '笔记本', '实验箱'],
  };
  return map[cat] || ['综合'];
}

async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONFIG);
    console.log('[seed] Connected to MySQL');
  } catch (e) {
    console.error('[seed] MySQL connection failed:', e.message);
    console.error('[seed] Make sure Docker MySQL is running. Try: docker-compose up -d mysql');
    process.exit(1);
  }

  try {
    // Check if already seeded
    const [rows] = await conn.execute('SELECT COUNT(*) AS cnt FROM users');
    if (rows[0].cnt > 0) {
      console.log('[seed] Data already exists, skipping seed (users=' + rows[0].cnt + ').');
      console.log('[seed] To re-seed, run: TRUNCATE on all tables first.');
      await conn.end();
      return;
    }
  } catch (e) {
    // Tables might not exist yet
    console.log('[seed] Tables not found, will create...');
  }

  // 1. Users
  const hashedPasswords = await Promise.all(
    USERS.map(u => bcrypt.hash(u.password, SALT_ROUNDS))
  );
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    await conn.execute(
      'INSERT INTO users (name, email, password_hash, role, campus) VALUES (?, ?, ?, ?, ?)',
      [u.name, u.email, hashedPasswords[i], u.role, u.campus]
    );
  }
  console.log('[seed] Inserted ' + USERS.length + ' users');

  // 2. Resources (36+)
  const adminId = 1;
  const studentId = 2;
  let resourceCount = 0;
  for (const cat of CATEGORIES) {
    for (let i = 0; i < 6; i++) {
      const title = resourceTitles(cat.key, i);
      const price = Math.random() < 0.15 ? 0 : (Math.random() * 80 + 5).toFixed(2);
      const condition = CONDITIONS[i % CONDITIONS.length];
      const campus = CAMPUSES[Math.floor(Math.random() * CAMPUSES.length)];
      const courseName = COURSES[Math.floor(Math.random() * COURSES.length)];
      const tags = resourceTags(cat.key);
      const sellerId = i < 2 ? adminId : studentId;
      const sellerName = i < 2 ? '管理员' : '演示学生';
      const views = Math.floor(Math.random() * 200);
      const faves = Math.floor(Math.random() * 20);
      const status = i === 5 ? 'pending' : 'approved';

      await conn.execute(
        `INSERT INTO resources (title, category, price, item_condition, description, image_url,
          seller_id, seller_name, seller_contact, campus, course_name, tags, status, views, favorites_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, cat.key, price, condition, title + ' — 校内资源，成色良好，价格实惠。适合相关课程学习使用。',
         '', sellerId, sellerName, 'contact@campusshelf.com', campus, courseName,
         JSON.stringify(tags), status, views, faves]
      );
      resourceCount++;
    }
  }
  console.log('[seed] Inserted ' + resourceCount + ' resources');

  // 3. Comments (12+)
  const commentTexts = [
    '资料很有用，帮了大忙！', '成色不错，和描述一致', '价格公道，已入手', '内容很详细，推荐',
    '学长人很好，交易愉快', '笔记非常清晰', '有点旧但能接受', '考研必备，强烈推荐',
    '实验报告很完整', '电子书排版很好', '快递很快，包装也很好', '二手教材质量不错',
    '讲解很透彻，五星好评', '性价比很高', '发货速度快'
  ];
  let commentCount = 0;
  for (let i = 0; i < 12; i++) {
    const userId = (i % 2) + 1;
    const resourceId = (i % 18) + 1;
    const rating = Math.floor(Math.random() * 3) + 3; // 3-5
    const text = commentTexts[i % commentTexts.length];
    try {
      await conn.execute(
        'INSERT INTO comments (user_id, resource_id, rating, content) VALUES (?, ?, ?, ?)',
        [userId, resourceId, rating, text]
      );
      commentCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log('[seed] Inserted ' + commentCount + ' comments');

  // 4. Orders + Order Items (5+)
  const orderStatuses = ['pending', 'completed', 'completed', 'completed', 'cancelled'];
  let orderCount = 0;
  for (let i = 0; i < 5; i++) {
    const userId = (i % 2) + 1;
    const amount = (Math.random() * 100 + 10).toFixed(2);
    const status = orderStatuses[i];
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, amount, status]
    );
    const orderId = orderResult.insertId;

    // Add 1-3 items per order
    const itemCount = (i % 3) + 1;
    for (let j = 0; j < itemCount; j++) {
      const resId = ((i * 3 + j) % 18) + 1;
      const price = (Math.random() * 40 + 5).toFixed(2);
      await conn.execute(
        'INSERT INTO order_items (order_id, resource_id, title, price, quantity) VALUES (?, ?, ?, ?, 1)',
        [orderId, resId, 'Resource #' + resId, price]
      );
    }
    orderCount++;
  }
  console.log('[seed] Inserted ' + orderCount + ' orders');

  // 5. Wanted Posts (8+)
  const wantedData = [
    { title: '求购《高等数学（同济第七版）》上下册', category: 'textbook', budget: 60, course: '高等数学', desc: '本学期选课需要，新旧均可，最好有笔记。' },
    { title: '收一门 Python 课程笔记或项目报告', category: 'notes', budget: 30, course: 'Python 程序设计', desc: '求 Python 课的大作业报告或重点笔记。' },
    { title: '收考研数学历年真题 + 解析', category: 'exam', budget: 80, course: '考研数学', desc: '23/24/25 年真题最好带解析。' },
    { title: '收一份物理实验报告模板', category: 'report', budget: 15, course: '大学物理实验', desc: '大一物理实验模板参考格式。' },
    { title: '求《数据结构与算法》参考书', category: 'textbook', budget: 45, course: '数据结构', desc: '严蔚敏版或其它版本均可。' },
    { title: '求《线性代数》课后习题详解', category: 'ebook', budget: 20, course: '线性代数', desc: '电子版或纸质版均可。' },
    { title: '收二手科学计算器', category: 'supplies', budget: 35, course: '各类考试', desc: '卡西欧或同类品牌，功能正常。' },
    { title: '收英语六级复习资料 + 真题', category: 'exam', budget: 50, course: '大学英语', desc: '六级真题、听力材料、词汇书。' },
  ];
  for (const w of wantedData) {
    const userId = Math.random() < 0.5 ? 1 : 2;
    await conn.execute(
      'INSERT INTO wanted_posts (user_id, title, category, budget, course_name, campus, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, w.title, w.category, w.budget, w.course, CAMPUSES[Math.floor(Math.random() * CAMPUSES.length)], w.desc]
    );
  }
  console.log('[seed] Inserted ' + wantedData.length + ' wanted posts');

  console.log('[seed] ✅ Seed completed successfully!');
  await conn.end();
}

seed().catch(err => {
  console.error('[seed] ❌ Seed failed:', err.message);
  process.exit(1);
});
