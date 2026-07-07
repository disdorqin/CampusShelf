/**
 * CampusShelf Data Layer — Unified Interface
 *
 * Auto-selects between JSON file storage and MySQL based on DB_TYPE in .env.
 * DB_TYPE=json  → use original JSON files (backup-compatible)
 * DB_TYPE=mysql → use MySQL via mysqlAdapter
 *
 * This file preserves the same export shape as the original data/index.js
 * so routes don't need to change — they keep calling data.resources.list(), etc.
 */
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
try { require('dotenv').config({ path: envPath }); } catch (e) { /* no dotenv */ }

const DB_TYPE = (process.env.DB_TYPE || 'json').toLowerCase();

let adapter;

if (DB_TYPE === 'mysql') {
  // ---- MySQL Adapter ----
  adapter = require('./mysqlAdapter');

  // Wrap MySQL model methods to match old JSON API signatures
  // (routes expect plain objects with id, title, price, etc.)
  module.exports = {
    search: {
      // search used by /api/search route
    },
    users: {
      listUsers: async () => {
        try { return await adapter.userModel.listUsers(); }
        catch (e) { console.error('[data] MySQL error:', e.message); return []; }
      },
      findByEmail: async (email) => {
        try { return await adapter.userModel.findByEmail(email); }
        catch (e) { return null; }
      },
      findById: async (id) => {
        try { return await adapter.userModel.findById(id); }
        catch (e) { return null; }
      },
      createUser: async ({ name, email, passwordHash, role, campus }) => {
        try { return { _id: await adapter.userModel.create({ name, email, passwordHash, role, campus }) }; }
        catch (e) { throw e; }
      },
      getFavoriteIds: async (userId) => {
        try { return await adapter.userModel.getFavoriteIds(userId); }
        catch (e) { return []; }
      },
      toggleFavorite: async (userId, resourceId) => {
        try { return await adapter.userModel.toggleFavorite(userId, resourceId); }
        catch (e) { return { favorited: false }; }
      },
      addToCart: async (userId, item) => {
        try {
          const user = await adapter.userModel.findById(userId);
          if (!user) return;
          const cart = await adapter.cartModel.getOrCreate(user.id);
          await adapter.cartModel.addItem(cart.id, item.isbn);
        } catch (e) { /* silent */ }
      },
    },
    resources: {
      listResources: async (opts = {}) => {
        try {
          const rows = await adapter.resourceModel.list(opts);
          return rows.map(r => ({
            id: String(r.id),
            title: r.title,
            category: r.category,
            price: r.price,
            condition: r.item_condition,
            description: r.description,
            imageUrl: r.image_url,
            sellerId: r.seller_id,
            sellerName: r.seller_name,
            sellerContact: r.seller_contact,
            campus: r.campus,
            courseName: r.course_name,
            tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',') : r.tags) : [],
            status: r.status,
            views: r.views,
            favoritesCount: r.favorites_count,
            avgRating: r.avg_rating || 0,
            createdAt: r.created_at,
          }));
        } catch (e) { console.error('[data] MySQL error:', e.message); return []; }
      },
      getResourceDetail: async (id) => {
        try {
          const r = await adapter.resourceModel.getById(id);
          if (!r) return null;
          return {
            id: String(r.id),
            title: r.title,
            category: r.category,
            price: r.price,
            condition: r.item_condition,
            description: r.description,
            imageUrl: r.image_url,
            sellerId: r.seller_id,
            sellerName: r.seller_name,
            sellerContact: r.seller_contact,
            campus: r.campus,
            courseName: r.course_name,
            tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',') : r.tags) : [],
            status: r.status,
            views: r.views,
            favoritesCount: r.favorites_count,
            avgRating: r.avg_rating || 0,
            createdAt: r.created_at,
          };
        } catch (e) { return null; }
      },
      getBySeller: async (sellerId) => {
        try {
          const rows = await adapter.resourceModel.getBySeller(sellerId);
          return rows.map(r => ({ id: String(r.id), title: r.title }));
        } catch (e) { return []; }
      },
      countBySeller: async (sellerId) => {
        try { const rows = await adapter.resourceModel.getBySeller(sellerId); return rows.length; }
        catch (e) { return 0; }
      },
      createResource: async (data) => {
        try { return { id: String(await adapter.resourceModel.create(data)) }; }
        catch (e) { throw e; }
      },
      updateResource: async (id, data) => {
        try { await adapter.resourceModel.update(id, data); }
        catch (e) { /* silent */ }
      },
      deleteResource: async (id) => {
        try { await adapter.resourceModel.delete(id); return true; }
        catch (e) { return false; }
      },
      incrementViews: async (id) => {
        try { await adapter.resourceModel.incrementViews(id); }
        catch (e) { /* silent */ }
      },
      changeStatus: async (id, status) => {
        try { await adapter.resourceModel.changeStatus(id, status); }
        catch (e) { /* silent */ }
      },
      getHotResources: async (limit = 8) => {
        try {
          const rows = await adapter.resourceModel.getHot(limit);
          return rows.map(r => ({
            id: String(r.id), title: r.title, category: r.category,
            price: r.price, condition: r.item_condition,
            imageUrl: r.image_url, sellerName: r.seller_name,
            campus: r.campus, courseName: r.course_name,
            tags: r.tags ? (typeof r.tags === 'string' ? r.tags.split(',') : r.tags) : [],
            views: r.views, favoritesCount: r.favorites_count,
            avgRating: r.avg_rating || 0,
          }));
        } catch (e) { return []; }
      },
      getRanking: async (limit = 10) => {
        try {
          const rows = await adapter.resourceModel.getRanking(limit);
          return rows.map(r => ({
            id: String(r.id), title: r.title, category: r.category,
            price: r.price, condition: r.item_condition,
            imageUrl: r.image_url, sellerName: r.seller_name,
            campus: r.campus, courseName: r.course_name,
            views: r.views, favoritesCount: r.favorites_count,
          }));
        } catch (e) { return []; }
      },
      getTrend: async (days = 7) => {
        try { return await adapter.resourceModel.getTrend(days); }
        catch (e) { return []; }
      },
      countByCategory: async () => {
        try { return await adapter.resourceModel.countByCategory(); }
        catch (e) { return {}; }
      },
      countAll: async () => {
        try { return await adapter.resourceModel.countAll(); }
        catch (e) { return { total: 0, approved: 0, pending: 0, sold: 0 }; }
      },
      countToday: async () => {
        try { return await adapter.resourceModel.countToday(); }
        catch (e) { return 0; }
      },
    },
    comments: {
      getByResource: async (resourceId) => {
        try {
          const rows = await adapter.commentModel.getByResource(resourceId);
          return rows.map(r => ({
            id: String(r.id),
            userId: r.user_id,
            resourceId: r.resource_id,
            rating: r.rating,
            text: r.content,
            userName: r.user_name,
            createdAt: r.created_at,
          }));
        } catch (e) { return []; }
      },
      createComment: async (data) => {
        try { return { id: String(await adapter.commentModel.create(data)) }; }
        catch (e) { throw e; }
      },
      getAverageRating: async (resourceId) => {
        try { return await adapter.commentModel.getAverageRating(resourceId); }
        catch (e) { return { avg: 0, count: 0 }; }
      },
      countAll: async () => {
        try { return await adapter.commentModel.countAll(); }
        catch (e) { return 0; }
      },
      deleteComment: async (id) => {
        try { await adapter.commentModel.delete(id); }
        catch (e) { /* silent */ }
      },
      getAll: async () => {
        try {
          const rows = await adapter.commentModel.getAll();
          return rows.map(r => ({
            id: String(r.id), userName: r.user_name,
            resourceTitle: r.resource_title, resourceId: r.resource_id,
            text: r.content, rating: r.rating, createdAt: r.created_at,
          }));
        } catch (e) { return []; }
      },
    },
    orders: {
      getAll: async () => {
        try {
          const rows = await adapter.orderModel.getAll();
          return rows.map(r => ({
            id: String(r.id), userName: r.user_name,
            userId: r.user_id, total: r.total_amount,
            status: r.status, createdAt: r.created_at,
          }));
        } catch (e) { return []; }
      },
      countByStatus: async () => {
        try { return await adapter.orderModel.countByStatus(); }
        catch (e) { return { total: 0 }; }
      },
      countByUser: async (userId) => {
        try { return await adapter.orderModel.countByUser(userId); }
        catch (e) { return 0; }
      },
      updateStatus: async (id, status) => {
        try { await adapter.orderModel.updateStatus(id, status); }
        catch (e) { /* silent */ }
      },
    },
    wanted: {
      getAll: async () => {
        try {
          const rows = await adapter.wantedModel.getAll();
          return rows.map(r => ({
            id: String(r.id), title: r.title, category: r.category,
            budget: r.budget, courseName: r.course_name, campus: r.campus,
            description: r.description, posterName: r.poster_name,
            contact: '', createdAt: r.created_at,
          }));
        } catch (e) { return []; }
      },
      getRecent: async (n = 4) => {
        try {
          const rows = await adapter.wantedModel.getRecent(n);
          return rows.map(r => ({
            id: String(r.id), title: r.title, category: r.category,
            budget: r.budget, courseName: r.course_name, campus: r.campus,
            description: r.description, posterName: r.poster_name,
            contact: '', createdAt: r.created_at,
          }));
        } catch (e) { return []; }
      },
    },
  };

  // Initialize MySQL pool (async, non-blocking)
  try {
    const db = require('../utilities/db');
    db.initPool().catch(err => {
      console.warn('[data] MySQL init deferred — will retry on first query');
    });
  } catch (e) {
    console.warn('[data] MySQL pool init skipped:', e.message);
  }

} else {
  // ---- JSON file storage (original, fallback) ----
  const searchData = require('./store/search');
  const userData = require('./users/user');
  const resourceData = require('./resources/resource');
  const commentData = require('./comments/comment');
  const orderData = require('./orders/order');
  const wantedData = require('./wanted/wanted');

  module.exports = {
    search: searchData,
    users: userData,
    resources: resourceData,
    comments: commentData,
    orders: orderData,
    wanted: wantedData
  };
}
