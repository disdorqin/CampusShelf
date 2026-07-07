/**
 * Orders data access for CampusShelf.
 * Global order store (data/orders/orders.json) so the admin console can manage
 * every order. Each order references the buyer userId and the purchased items.
 */
const { v4: uuidv4 } = require('uuid');
const jsonStore = require('../../utilities/jsonStore');

const ORD_FILE = 'orders/orders.json';
const load = () => jsonStore.readJson(ORD_FILE) || [];
const save = (list) => jsonStore.writeJson(ORD_FILE, list);

const createOrder = ({ userId, userName, items, total }) => {
  const list = load();
  const now = new Date().toISOString();
  const order = {
    id: uuidv4(),
    userId,
    userName: userName || '匿名用户',
    items: items || [],
    total: Number(total) || 0,
    status: 'pending',          // pending | completed | cancelled
    createdAt: now,
    updatedAt: now
  };
  list.push(order);
  save(list);
  return order;
};

const getByUser = (userId) =>
  load().filter(o => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const getAll = () =>
  load().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const updateStatus = (id, status) => {
  const list = load();
  const o = list.find(x => x.id === id);
  if (!o) return null;
  o.status = status;
  o.updatedAt = new Date().toISOString();
  save(list);
  return o;
};

const countByStatus = () => {
  const map = { pending: 0, completed: 0, cancelled: 0, total: 0 };
  load().forEach(o => { map[o.status] = (map[o.status] || 0) + 1; map.total++; });
  return map;
};

const countByUser = (userId) => load().filter(o => o.userId === userId).length;

const countToday = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return load().filter(o => new Date(o.createdAt) >= start).length;
};

module.exports = { createOrder, getByUser, getAll, updateStatus, countByStatus, countByUser, countToday };
