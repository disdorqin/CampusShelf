/**
 * Campus resource data access (the core entity of CampusShelf).
 *
 * Replaces the original Google-Books-only model with a local, offline-capable
 * resource store backed by data/resources/resources.json. Supports filtering,
 * pagination, views/favorites counters, publishing, editing and review workflow.
 *
 * Signatures mirror a typical CRUD service so routes stay small.
 */
const { v4: uuidv4 } = require('uuid');
const jsonStore = require('../../utilities/jsonStore');
const { CATEGORY_MAP } = require('../../utilities/campusConstants');

const RES_FILE = 'resources/resources.json';
const load = () => jsonStore.readJson(RES_FILE) || [];
const save = (list) => jsonStore.writeJson(RES_FILE, list);

const getById = (id) => load().find(r => r.id === id) || null;

// Build a filter query from request params.
const listResources = (opts = {}) => {
  let list = load();

  if (opts.category && opts.category !== 'all') {
    list = list.filter(r => r.category === opts.category);
  }
  if (opts.status && opts.status !== 'all') {
    list = list.filter(r => r.status === opts.status);
  }
  if (opts.keyword) {
    const q = String(opts.keyword).trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.courseName && r.courseName.toLowerCase().includes(q)) ||
        (r.sellerName && r.sellerName.toLowerCase().includes(q)) ||
        (r.tags && r.tags.join(' ').toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
  }
  if (opts.condition && opts.condition !== 'all') {
    list = list.filter(r => r.condition === opts.condition);
  }
  if (opts.minPrice !== undefined && opts.minPrice !== '' && !isNaN(opts.minPrice)) {
    list = list.filter(r => r.price >= Number(opts.minPrice));
  }
  if (opts.maxPrice !== undefined && opts.maxPrice !== '' && !isNaN(opts.maxPrice)) {
    list = list.filter(r => r.price <= Number(opts.maxPrice));
  }
  // Free resources filter
  if (opts.free === true || opts.free === '1') {
    list = list.filter(r => Number(r.price) === 0);
  }
  // Negotiable filter
  if (opts.negotiable === true || opts.negotiable === '1') {
    list = list.filter(r => r.negotiable === true || r.negotiable === 'true');
  }

  // Sort: default by newest.
  const sort = opts.sort || 'newest';
  list.sort((a, b) => {
    if (sort === 'price_asc' || sort === 'priceAsc') return a.price - b.price;
    if (sort === 'price_desc' || sort === 'priceDesc') return b.price - a.price;
    if (sort === 'views') return (b.views || 0) - (a.views || 0);
    if (sort === 'favorites') return (b.favoritesCount || 0) - (a.favoritesCount || 0);
    if (sort === 'rating') return (b.avgRating || 0) - (a.avgRating || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return list;
};

const getResourceDetail = (id) => getById(id);

const getBySeller = (sellerId) => load().filter(r => r.sellerId === sellerId)
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const countBySeller = (sellerId) => load().filter(r => r.sellerId === sellerId).length;

const createResource = (data) => {
  const list = load();
  const now = new Date().toISOString();
  const resource = {
    id: uuidv4(),
    title: data.title,
    category: data.category,
    price: Number(data.price) || 0,
    condition: data.condition || '几乎全新',
    description: data.description || '',
    imageUrl: data.imageUrl || `/img/cat-${data.category}.svg`,
    sellerId: data.sellerId || null,
    sellerName: data.sellerName || '匿名用户',
    sellerContact: data.sellerContact || '',
    campus: data.campus || '',
    courseName: data.courseName || '',
    tags: data.tags ? String(data.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
    status: 'pending',            // new resources need admin approval
    views: 0,
    favoritesCount: 0,
    createdAt: now,
    updatedAt: now
  };
  list.push(resource);
  save(list);
  return resource;
};

const updateResource = (id, data) => {
  const list = load();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const r = list[idx];
  const fields = ['title', 'category', 'price', 'condition', 'description', 'imageUrl',
    'sellerName', 'sellerContact', 'campus', 'courseName', 'status'];
  fields.forEach(f => { if (data[f] !== undefined) r[f] = f === 'price' ? Number(data[f]) : data[f]; });
  if (data.tags !== undefined) r.tags = String(data.tags).split(',').map(t => t.trim()).filter(Boolean);
  r.updatedAt = new Date().toISOString();
  list[idx] = r;
  save(list);
  return r;
};

const deleteResource = (id) => {
  const list = load();
  const next = list.filter(r => r.id !== id);
  if (next.length === list.length) return false;
  save(next);
  return true;
};

const incrementViews = (id) => {
  const list = load();
  const r = list.find(x => x.id === id);
  if (!r) return;
  r.views = (r.views || 0) + 1;
  save(list);
};

const changeStatus = (id, status) => {
  const list = load();
  const r = list.find(x => x.id === id);
  if (!r) return null;
  r.status = status;
  r.updatedAt = new Date().toISOString();
  save(list);
  return r;
};

// Hot resources = approved, sorted by views+favorites. Used by home + cache.
const getHotResources = (limit = 8) =>
  load().filter(r => r.status === 'approved')
    .sort((a, b) => (b.views + b.favoritesCount * 3) - (a.views + a.favoritesCount * 3))
    .slice(0, limit);

// Ranking by favorites count.
const getRanking = (limit = 10) =>
  load().filter(r => r.status === 'approved')
    .sort((a, b) => (b.favoritesCount || 0) - (a.favoritesCount || 0))
    .slice(0, limit);

// Resources published in the last `days` days (for the trend chart).
const getTrend = (days = 7) => {
  const since = Date.now() - days * 86400000;
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    return { date: d.toISOString().slice(0, 10), count: 0 };
  });
  load().forEach(r => {
    const t = new Date(r.createdAt).getTime();
    if (t >= since) {
      const key = new Date(r.createdAt).toISOString().slice(0, 10);
      const b = buckets.find(x => x.date === key);
      if (b) b.count++;
    }
  });
  return buckets;
};

const countByCategory = () => {
  const map = {};
  load().filter(r => r.status === 'approved').forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
  return map;
};

const countAll = () => {
  const all = load();
  return {
    total: all.length,
    approved: all.filter(r => r.status === 'approved').length,
    pending: all.filter(r => r.status === 'pending').length,
    sold: all.filter(r => r.status === 'sold').length
  };
};

// Today's new resources (approved or not, used by dashboard).
const countToday = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return load().filter(r => new Date(r.createdAt) >= start).length;
};

module.exports = {
  listResources, getResourceDetail, getBySeller, countBySeller, createResource, updateResource,
  deleteResource, incrementViews, changeStatus, getHotResources,
  getRanking, getTrend, countByCategory, countAll, countToday, getById
};
