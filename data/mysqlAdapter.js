/**
 * MySQL Data Adapter
 *
 * Provides a unified interface so routes can use JSON or MySQL storage
 * via a single API, controlled by DB_TYPE in .env.
 *
 * DB_TYPE=json → uses original JSON files (data/*)
 * DB_TYPE=mysql → uses MySQL models (models/*)
 */
const db = require('../utilities/db');

// ---- User Model ----
const userModel = {
  async listUsers() {
    return db.query('SELECT id, name, email, role, campus, status, created_at FROM users');
  },
  async findByEmail(email) {
    return db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  },
  async findById(id) {
    return db.queryOne('SELECT id, name, email, role, campus, status, created_at FROM users WHERE id = ?', [id]);
  },
  async create({ name, email, passwordHash, role = 'student', campus = '' }) {
    return db.insert(
      'INSERT INTO users (name, email, password_hash, role, campus) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, role, campus]
    );
  },
  async getFavoriteIds(userId) {
    const rows = await db.query('SELECT resource_id FROM favorites WHERE user_id = ?', [userId]);
    return rows.map(r => String(r.resource_id));
  },
  async toggleFavorite(userId, resourceId) {
    const existing = await db.queryOne(
      'SELECT id FROM favorites WHERE user_id = ? AND resource_id = ?', [userId, resourceId]
    );
    if (existing) {
      await db.query('DELETE FROM favorites WHERE id = ?', [existing.id]);
      await db.query('UPDATE resources SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = ?', [resourceId]);
      return { favorited: false };
    } else {
      await db.insert('INSERT INTO favorites (user_id, resource_id) VALUES (?, ?)', [userId, resourceId]);
      await db.query('UPDATE resources SET favorites_count = favorites_count + 1 WHERE id = ?', [resourceId]);
      return { favorited: true };
    }
  },
};

// ---- Resource Model ----
const resourceModel = {
  async list(opts = {}) {
    let sql = 'SELECT r.*, COALESCE(AVG(c.rating), 0) AS avg_rating, COUNT(c.id) AS review_count FROM resources r LEFT JOIN comments c ON c.resource_id = r.id WHERE 1=1';
    const params = [];

    if (opts.category && opts.category !== 'all') {
      sql += ' AND r.category = ?'; params.push(opts.category);
    }
    if (opts.status && opts.status !== 'all') {
      sql += ' AND r.status = ?'; params.push(opts.status);
    }
    if (opts.keyword) {
      const kw = '%' + opts.keyword.trim() + '%';
      sql += ' AND (r.title LIKE ? OR r.course_name LIKE ? OR r.seller_name LIKE ?)';
      params.push(kw, kw, kw);
    }
    if (opts.condition && opts.condition !== 'all') {
      sql += ' AND r.item_condition = ?'; params.push(opts.condition);
    }
    if (opts.minPrice !== undefined && opts.minPrice !== '' && !isNaN(opts.minPrice)) {
      sql += ' AND r.price >= ?'; params.push(Number(opts.minPrice));
    }
    if (opts.maxPrice !== undefined && opts.maxPrice !== '' && !isNaN(opts.maxPrice)) {
      sql += ' AND r.price <= ?'; params.push(Number(opts.maxPrice));
    }
    if (opts.free === true || opts.free === '1') {
      sql += ' AND r.price = 0';
    }
    if (opts.negotiable === true || opts.negotiable === '1') {
      sql += ' AND r.negotiable = 1';
    }

    sql += ' GROUP BY r.id';

    const sort = opts.sort || 'newest';
    if (sort === 'price_asc') sql += ' ORDER BY r.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY r.price DESC';
    else if (sort === 'views') sql += ' ORDER BY r.views DESC';
    else if (sort === 'rating') sql += ' ORDER BY avg_rating DESC';
    else sql += ' ORDER BY r.created_at DESC';

    return db.query(sql, params);
  },

  async getById(id) {
    return db.queryOne(
      `SELECT r.*, COALESCE(AVG(c.rating), 0) AS avg_rating, COUNT(c.id) AS review_count
       FROM resources r LEFT JOIN comments c ON c.resource_id = r.id
       WHERE r.id = ? GROUP BY r.id`, [id]
    );
  },

  async getHot(limit = 8) {
    return db.query(
      `SELECT r.*, COALESCE(AVG(c.rating), 0) AS avg_rating
       FROM resources r LEFT JOIN comments c ON c.resource_id = r.id
       WHERE r.status = 'approved'
       GROUP BY r.id ORDER BY (r.views + r.favorites_count * 3) DESC LIMIT ?`, [limit]
    );
  },

  async getBySeller(sellerId) {
    return db.query('SELECT * FROM resources WHERE seller_id = ? ORDER BY created_at DESC', [sellerId]);
  },

  async create(data) {
    return db.insert(
      `INSERT INTO resources (title, category, price, item_condition, description, image_url,
        seller_id, seller_name, seller_contact, campus, course_name, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.category, data.price, data.condition, data.description, data.imageUrl || '',
       data.sellerId, data.sellerName, data.sellerContact || '', data.campus || '', data.courseName || '',
       data.tags ? (Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags) : '',
       data.status || 'pending']
    );
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowed = ['title', 'category', 'price', 'item_condition', 'description', 'image_url',
      'seller_name', 'seller_contact', 'campus', 'course_name', 'status'];
    for (const f of allowed) {
      if (data[f] !== undefined) {
        fields.push(f + '=?');
        params.push(data[f]);
      }
    }
    if (data.tags !== undefined) {
      fields.push('tags=?');
      params.push(Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
    }
    if (fields.length > 0) {
      params.push(id);
      await db.query('UPDATE resources SET ' + fields.join(', ') + ', updated_at=NOW() WHERE id=?', params);
    }
  },

  async incrementViews(id) {
    await db.query('UPDATE resources SET views = views + 1 WHERE id = ?', [id]);
  },

  async changeStatus(id, status) {
    await db.query('UPDATE resources SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
  },

  async countByCategory() {
    const rows = await db.query("SELECT category, COUNT(*) AS cnt FROM resources WHERE status='approved' GROUP BY category");
    const map = {};
    rows.forEach(r => { map[r.category] = r.cnt; });
    return map;
  },

  async countAll() {
    const rows = await db.query(`SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status='sold' THEN 1 ELSE 0 END) AS sold
      FROM resources`);
    return rows[0] || { total: 0, approved: 0, pending: 0, sold: 0 };
  },

  async getTrend(days = 7) {
    const buckets = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const rows = await db.query(
      "SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM resources WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY DATE(created_at)",
      [days]
    );
    rows.forEach(r => {
      const b = buckets.find(x => x.date === r.d.toISOString().slice(0, 10));
      if (b) b.count = r.cnt;
    });
    return buckets;
  },

  async getRanking(limit = 10) {
    return db.query(
      "SELECT * FROM resources WHERE status='approved' ORDER BY favorites_count DESC LIMIT ?", [limit]
    );
  },

  async countToday() {
    const rows = await db.query("SELECT COUNT(*) AS cnt FROM resources WHERE DATE(created_at) = CURDATE()");
    return rows[0].cnt;
  },

  async delete(id) {
    await db.query('DELETE FROM resources WHERE id = ?', [id]);
  },
};

// ---- Comment Model ----
const commentModel = {
  async getByResource(resourceId) {
    return db.query(
      'SELECT c.*, u.name AS user_name FROM comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.resource_id = ? ORDER BY c.created_at DESC',
      [resourceId]
    );
  },
  async create({ userId, resourceId, rating, text }) {
    return db.insert(
      'INSERT INTO comments (user_id, resource_id, rating, content) VALUES (?, ?, ?, ?)',
      [userId, resourceId, rating, text]
    );
  },
  async getAverageRating(resourceId) {
    const row = await db.queryOne(
      'SELECT COALESCE(AVG(rating), 0) AS avg, COUNT(*) AS count FROM comments WHERE resource_id = ?',
      [resourceId]
    );
    return row || { avg: 0, count: 0 };
  },
  async countAll() {
    const rows = await db.query('SELECT COUNT(*) AS cnt FROM comments');
    return rows[0].cnt;
  },
  async delete(id) {
    await db.query('DELETE FROM comments WHERE id = ?', [id]);
  },
  async getAll() {
    return db.query(
      'SELECT c.*, u.name AS user_name FROM comments c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.created_at DESC'
    );
  },
};

// ---- Order Model ----
const orderModel = {
  async getAll() {
    return db.query(
      'SELECT o.*, u.name AS user_name FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC'
    );
  },
  async countByStatus() {
    const rows = await db.query('SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status');
    const result = { total: 0, pending: 0, completed: 0, cancelled: 0 };
    rows.forEach(r => { result[r.status] = r.cnt; result.total += r.cnt; });
    return result;
  },
  async countByUser(userId) {
    const row = await db.queryOne('SELECT COUNT(*) AS cnt FROM orders WHERE user_id = ?', [userId]);
    return row ? row.cnt : 0;
  },
  async updateStatus(id, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  },
  async create({ userId, totalAmount, status = 'pending', items = [] }) {
    return db.transaction(async (conn) => {
      const [orderResult] = await conn.execute(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [userId, totalAmount, status]
      );
      const orderId = orderResult.insertId;
      for (const item of items) {
        await conn.execute(
          'INSERT INTO order_items (order_id, resource_id, title, price, quantity) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.resourceId, item.title, item.price, item.quantity || 1]
        );
      }
      return orderId;
    });
  },
  async getByUser(userId) {
    return db.query(
      'SELECT o.* FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC', [userId]
    );
  },
};

// ---- Wanted Model ----
const wantedModel = {
  async getAll() {
    return db.query(
      'SELECT w.*, u.name AS poster_name FROM wanted_posts w LEFT JOIN users u ON u.id = w.user_id ORDER BY w.created_at DESC'
    );
  },
  async getRecent(n = 4) {
    return db.query(
      'SELECT w.*, u.name AS poster_name FROM wanted_posts w LEFT JOIN users u ON u.id = w.user_id ORDER BY w.created_at DESC LIMIT ?', [n]
    );
  },
  async create(data) {
    return db.insert(
      'INSERT INTO wanted_posts (user_id, title, category, budget, course_name, campus, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.userId, data.title, data.category, data.budget, data.courseName, data.campus, data.description]
    );
  },
};

// ---- Cart Model ----
const cartModel = {
  async getOrCreate(userId) {
    let cart = await db.queryOne('SELECT * FROM carts WHERE user_id = ?', [userId]);
    if (!cart) {
      const id = await db.insert('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      cart = { id, user_id: userId };
    }
    return cart;
  },
  async addItem(cartId, resourceId, quantity = 1) {
    const existing = await db.queryOne(
      'SELECT * FROM cart_items WHERE cart_id = ? AND resource_id = ?', [cartId, resourceId]
    );
    if (existing) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
    } else {
      await db.insert('INSERT INTO cart_items (cart_id, resource_id, quantity) VALUES (?, ?, ?)', [cartId, resourceId, quantity]);
    }
  },
  async getItems(cartId) {
    return db.query(
      `SELECT ci.*, r.title, r.price, r.image_url AS imageUrl, r.category
       FROM cart_items ci
       LEFT JOIN resources r ON r.id = ci.resource_id
       WHERE ci.cart_id = ?`, [cartId]
    );
  },
  async removeItem(itemId) {
    await db.query('DELETE FROM cart_items WHERE id = ?', [itemId]);
  },
  async clearCart(cartId) {
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
  },
};

module.exports = {
  userModel, resourceModel, commentModel, orderModel, wantedModel, cartModel,
};
