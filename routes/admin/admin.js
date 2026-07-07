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
router.get("/", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const [resCount, orderCount, commentCount, users] = await Promise.all([
      resourceAPI.countAll(),
      orderAPI.countByStatus(),
      commentAPI.countAll(),
      userAPI.listUsers()
    ]);
    const userCount = Array.isArray(users) ? users.length : 0;

    const [trend, catCounts, rankingArr, recentArr, todayCount] = await Promise.all([
      resourceAPI.getTrend(7),
      resourceAPI.countByCategory(),
      resourceAPI.getRanking(8),
      resourceAPI.listResources({ sort: 'newest' }),
      resourceAPI.countToday()
    ]);

    const categoryPie = CATEGORIES.map(c => ({ label: c.label, value: catCounts[c.key] || 0, color: c.color }));
    const ranking = decorateList(rankingArr);
    const recent = decorateList(recentArr.slice(0, 5));
    const cacheMode = cache.getMode();

    res.render("admin/dashboard", {
      authData, pageTitle: "管理后台 - CampusShelf",
      stats: {
        users: userCount,
        resources: resCount.approved || 0,
        resourcesTotal: resCount.total || 0,
        pending: resCount.pending || 0,
        today: todayCount || 0,
        orders: orderCount.total || 0,
        comments: commentCount || 0
      },
      trend, categoryPie, ranking, recent, cacheMode
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// Resources management (review workflow)
router.get("/resources", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const status = req.query.status || 'all';
    const list = await resourceAPI.listResources({ status, sort: 'newest' });
    res.render("admin/resources", {
      authData, pageTitle: "资源管理 - CampusShelf",
      resources: decorateList(list),
      status, statuses: ['all', 'pending', 'approved', 'rejected', 'sold']
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

router.post("/resources/:id/approve", async (req, res) => {
  await resourceAPI.changeStatus(req.params.id, 'approved');
  cache.del('campusshelf:hot-resources').catch(() => {});
  res.redirect('/admin/resources?status=pending');
});
router.post("/resources/:id/reject", async (req, res) => {
  await resourceAPI.changeStatus(req.params.id, 'rejected');
  res.redirect('/admin/resources?status=pending');
});
router.post("/resources/:id/sold", async (req, res) => {
  await resourceAPI.changeStatus(req.params.id, 'sold');
  cache.del('campusshelf:hot-resources').catch(() => {});
  res.redirect('/admin/resources?status=approved');
});

// Users management
router.get("/users", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const userList = await userAPI.listUsers();
    const users = await Promise.all((userList || []).map(async u => ({
      ...u,
      resourceCount: await resourceAPI.countBySeller(u.id || u._id),
      orderCount: await orderAPI.countByUser(u.id || u._id)
    })));
    res.render("admin/users", {
      authData, pageTitle: "用户管理 - CampusShelf", users
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// Orders management
router.get("/orders", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const ordersList = await orderAPI.getAll();
    const orders = (ordersList || []).map(decorateOrder);
    res.render("admin/orders", {
      authData, pageTitle: "订单管理 - CampusShelf", orders
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

router.post("/orders/:id/status", async (req, res) => {
  await orderAPI.updateStatus(req.params.id, req.body.status);
  res.redirect('/admin/orders');
});

// Comments management
router.get("/comments", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const resources = await resourceAPI.listResources({ status: 'all' });
    const all = [];
    if (resources && resources.length) {
      for (const r of resources) {
        const comments = await commentAPI.getByResource(r.id);
        (comments || []).forEach(c => {
          all.push(Object.assign({}, c, { resourceTitle: r.title, resourceId: r.id }));
        });
      }
    }
    res.render("admin/comments", {
      authData, pageTitle: "评论管理 - CampusShelf", comments: all
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// Statistics (charts)
router.get("/stats", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const [trend, catCounts, rankingArr, ordersList] = await Promise.all([
      resourceAPI.getTrend(7),
      resourceAPI.countByCategory(),
      resourceAPI.getRanking(10),
      orderAPI.getAll()
    ]);
    const categoryPie = CATEGORIES.map(c => ({ label: c.label, value: catCounts[c.key] || 0, color: c.color }));
    const ranking = decorateList(rankingArr);

    const orderTrend = (() => {
      const buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(Date.now() - (6 - i) * 86400000);
        return { date: d.toISOString().slice(0, 10), count: 0, amount: 0 };
      });
      (ordersList || []).forEach(o => {
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
  } catch (error) {
    res.render("error/static", { error });
  }
});

module.exports = router;
