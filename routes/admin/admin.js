const express = require('express');
const router = express.Router();
const functions = require('../../utilities/functions');
const { CATEGORIES } = require('../../utilities/campusConstants');
const { decorateList, decorateOrder } = require('../../utilities/viewModel');
const cache = require('../../utilities/cache');

const data = require('../../data');
const resourceAPI = data.resources;
const userAPI = data.users;
const orderAPI = data.orders;
const commentAPI = data.comments;

// Admin guard: only isAdmin users may enter.
function ensureAdmin(req, res, next) {
  res.locals.layout = 'admin';
  if (!req.isAuthenticated()) return res.redirect('/login');
  if (req.user.isAdmin) return next();
  return res.status(403).render('error/static', { error: '当前账号没有管理员权限，无法访问后台。' });
}

router.use(ensureAdmin);
router.use((req, res, next) => {
  const seg = (req.path.split('/')[1] || '');
  res.locals.active = seg === '' ? 'dashboard' : seg;
  next();
});

// Dashboard
router.get("/", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const resCount = resourceAPI.countAll();
  const orderCount = orderAPI.countByStatus();
  const commentCount = commentAPI.countAll();
  const userCount = userAPI.listUsers().length;

  const trend = resourceAPI.getTrend(7);
  const catCounts = resourceAPI.countByCategory();
  const categoryPie = CATEGORIES.map(c => ({ label: c.label, value: catCounts[c.key] || 0, color: c.color }));
  const ranking = decorateList(resourceAPI.getRanking(8));
  const recent = decorateList(resourceAPI.listResources({ sort: 'newest' }).slice(0, 5));
  const cacheMode = cache.getMode();

  res.render("admin/dashboard", {
    authData, pageTitle: "管理后台 - CampusShelf",
    stats: {
      users: userCount,
      resources: resCount.approved,
      resourcesTotal: resCount.total,
      pending: resCount.pending,
      today: resourceAPI.countToday(),
      orders: orderCount.total,
      comments: commentCount
    },
    trend, categoryPie, ranking, recent, cacheMode
  });
});

// Resources management (review workflow)
router.get("/resources", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const status = req.query.status || 'all';
  const list = resourceAPI.listResources({ status, sort: 'newest' });
  res.render("admin/resources", {
    authData, pageTitle: "资源管理 - CampusShelf",
    resources: decorateList(list),
    status, statuses: ['all', 'pending', 'approved', 'rejected', 'sold']
  });
});

router.post("/resources/:id/approve", (req, res) => {
  resourceAPI.changeStatus(req.params.id, 'approved');
  cache.del('campusshelf:hot-resources').catch(() => {});
  res.redirect('/admin/resources?status=pending');
});
router.post("/resources/:id/reject", (req, res) => {
  resourceAPI.changeStatus(req.params.id, 'rejected');
  res.redirect('/admin/resources?status=pending');
});
router.post("/resources/:id/sold", (req, res) => {
  resourceAPI.changeStatus(req.params.id, 'sold');
  cache.del('campusshelf:hot-resources').catch(() => {});
  res.redirect('/admin/resources?status=approved');
});

// Users management
router.get("/users", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const users = userAPI.listUsers().map(u => ({
    ...u,
    resourceCount: resourceAPI.countBySeller(u._id),
    orderCount: orderAPI.countByUser(u._id)
  }));
  res.render("admin/users", {
    authData, pageTitle: "用户管理 - CampusShelf", users
  });
});

// Orders management
router.get("/orders", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const orders = orderAPI.getAll().map(decorateOrder);
  res.render("admin/orders", {
    authData, pageTitle: "订单管理 - CampusShelf", orders
  });
});

router.post("/orders/:id/status", (req, res) => {
  orderAPI.updateStatus(req.params.id, req.body.status);
  res.redirect('/admin/orders');
});

// Comments management
router.get("/comments", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  // comments across all resources
  const all = [];
  const byResource = {};
  resourceAPI.listResources({ status: 'all' }).forEach(r => {
    commentAPI.getByResource(r.id).forEach(c => {
      all.push(Object.assign({}, c, { resourceTitle: r.title, resourceId: r.id }));
    });
  });
  res.render("admin/comments", {
    authData, pageTitle: "评论管理 - CampusShelf", comments: all
  });
});

// Statistics (charts)
router.get("/stats", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const trend = resourceAPI.getTrend(7);
  const catCounts = resourceAPI.countByCategory();
  const categoryPie = CATEGORIES.map(c => ({ label: c.label, value: catCounts[c.key] || 0, color: c.color }));
  const ranking = decorateList(resourceAPI.getRanking(10));

  // order trend (last 7 days)
  const orderTrend = (() => {
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      return { date: d.toISOString().slice(0, 10), count: 0, amount: 0 };
    });
    orderAPI.getAll().forEach(o => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const b = buckets.find(x => x.date === key);
      if (b) { b.count++; b.amount += (o.total || 0); }
    });
    return buckets;
  })();

  res.render("admin/stats", {
    authData, pageTitle: "数据统计 - CampusShelf",
    trend, categoryPie, ranking, orderTrend
  });
});

module.exports = router;
