const express = require('express');
const router = express.Router();
const functions = require('../../utilities/functions');
const authenticationMiddleware = require('../../config/authentication/middleware');
const { CATEGORIES } = require('../../utilities/campusConstants');
const { decorateResource, decorateList } = require('../../utilities/viewModel');
const cache = require('../../utilities/cache');

const data = require('../../data');
const resourceAPI = data.resources;
const commentAPI = data.comments;
const userAPI = data.users;
const orderAPI = data.orders;

const PAGE_SIZE = 8;

// GET /resources  — list with filters + pagination
router.get("/", async(req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const opts = {
    category: req.query.category || 'all',
    keyword: req.query.keyword || '',
    condition: req.query.condition || 'all',
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    free: req.query.free,
    negotiable: req.query.negotiable,
    sort: req.query.sort || 'newest'
  };
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    const filtered = await resourceAPI.listResources(Object.assign({}, opts, { status: 'approved' }));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const favoriteIds = authData.isLoggedIn ? await userAPI.getFavoriteIds(req.user.email) : [];
    const counts = await resourceAPI.countByCategory();
    const categories = CATEGORIES.map(c => ({ ...c, count: counts[c.key] || 0 }));

    const _qs = () => {
      const q = new URLSearchParams();
      if (opts.keyword) q.set('keyword', opts.keyword);
      if (opts.category && opts.category !== 'all') q.set('category', opts.category);
      if (opts.condition && opts.condition !== 'all') q.set('condition', opts.condition);
      if (opts.minPrice) q.set('minPrice', opts.minPrice);
      if (opts.maxPrice) q.set('maxPrice', opts.maxPrice);
      return q;
    };
    const buildQuery = (p) => {
      const q = _qs();
      if (opts.sort) q.set('sort', opts.sort);
      q.set('page', p);
      return '/resources?' + q.toString();
    };
    const sortLabels = {
      newest: '最新',
      price_asc: '价格从低到高',
      price_desc: '价格从高到低',
      views: '浏览最多',
      rating: '评分最高'
    };
    const sortIcons = {
      newest: 'clock',
      price_asc: 'sort-ascending',
      price_desc: 'sort-descending',
      views: 'eye',
      rating: 'star'
    };
    const sortButtons = Object.keys(sortLabels).map(s => {
      const q = _qs();
      q.set('sort', s);
      q.set('page', 1);
      return { label: sortLabels[s], iconName: sortIcons[s], url: '/resources?' + q.toString(), active: opts.sort === s };
    });
    const pages = [];
    for (let p = 1; p <= totalPages; p++) pages.push({ n: p, url: buildQuery(p), active: p === safePage });

    res.render("resources/list", {
      authData,
      pageTitle: "资源列表 - CampusShelf",
      categories,
      resources: decorateList(pageItems, { favoriteIds }),
      filters: opts,
      sortButtons,
      pagination: { page: safePage, totalPages, total, pageSize: PAGE_SIZE,
        hasPrev: safePage > 1, hasNext: safePage < totalPages,
        prevUrl: safePage > 1 ? buildQuery(safePage - 1) : null,
        nextUrl: safePage < totalPages ? buildQuery(safePage + 1) : null,
        pages },
      conditionOptions: ['全新', '几乎全新', '轻微笔记', '有明显使用痕迹']
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// GET /resources/publish — publish form (login required)
router.get("/publish", authenticationMiddleware, (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  res.render("resources/publish", {
    authData,
    pageTitle: "发布资源 - CampusShelf",
    categories: CATEGORIES,
    isEdit: false
  });
});

// POST /resources/publish — create resource
router.post("/publish", authenticationMiddleware, async (req, res) => {
  try {
    const body = req.body;
    await resourceAPI.createResource({
      title: body.title,
      category: body.category,
      price: body.price,
      condition: body.condition,
      description: body.description,
      imageUrl: body.imageUrl,
      sellerId: req.user._id,
      sellerName: (req.user.firstName + ' ' + (req.user.lastName || '')).trim() || req.user.email,
      sellerContact: body.sellerContact,
      campus: body.campus,
      courseName: body.courseName,
      tags: body.tags
    });
    req.session.flash = { type: 'success', msg: '发布成功，等待管理员审核通过后即可展示。' };
    res.redirect('/user?tab=publish');
  } catch (error) {
    req.session.flash = { type: 'error', msg: '发布失败：' + error.message };
    res.redirect('/resources/publish');
  }
});

// GET /resources/:id — detail
router.get("/:id", async(req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  try {
    const r = await resourceAPI.getResourceDetail(req.params.id);
    if (!r || r.status !== 'approved') {
      return res.render("error/static", { error: "资源不存在或待审核。" });
    }
    await resourceAPI.incrementViews(req.params.id);
    cache.incr('campusshelf:views:' + req.params.id).catch(() => {});

    const [comments, rating, favoriteIds] = await Promise.all([
      commentAPI.getByResource(req.params.id),
      commentAPI.getAverageRating(req.params.id),
      authData.isLoggedIn ? userAPI.getFavoriteIds(req.user.email) : Promise.resolve([])
    ]);

    // JSON response for compare feature
    if (req.query.json) {
      const dr = decorateResource(r, { favoriteIds });
      return res.json(Object.assign({}, dr, { avgRating: rating.avg, ratingCount: rating.count }));
    }

    const [sellerResources, sellerOrderCount] = await Promise.all([
      resourceAPI.getBySeller(r.sellerId),
      orderAPI.countByUser(r.sellerId)
    ]);
    const sellerResourceCount = sellerResources.length;
    const sellerReviewCount = comments.length;
    const sellerRating = rating.avg || '暂无';

    const relatedList = await resourceAPI.listResources({ category: r.category, status: 'approved' });
    const relatedResources = decorateList(
      relatedList.filter(x => String(x.id) !== String(r.id)).slice(0, 4),
      { favoriteIds }
    );

    res.render("resources/detail", {
      authData,
      pageTitle: r.title + " - CampusShelf",
      resource: decorateResource(r, { favoriteIds }),
      comments,
      avgRating: rating.avg,
      ratingCount: rating.count,
      sellerRating,
      sellerResourceCount,
      sellerReviewCount,
      sellerOrderCount,
      relatedResources
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// GET /resources/:id/edit — edit form (seller or admin)
router.get("/:id/edit", authenticationMiddleware, async (req, res) => {
  try {
    const r = await resourceAPI.getResourceDetail(req.params.id);
    if (!r) return res.render("error/static", { error: "资源不存在。" });
    if (r.sellerId !== req.user._id && !req.user.isAdmin) {
      return res.render("error/static", { error: "无权编辑该资源。" });
    }
    res.render("resources/edit", {
      authData: functions.isUserAuthenticated(req.user),
      pageTitle: "编辑资源 - CampusShelf",
      categories: CATEGORIES,
      resource: r,
      isEdit: true
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// POST /resources/:id/edit
router.post("/:id/edit", authenticationMiddleware, async (req, res) => {
  try {
    const r = await resourceAPI.getResourceDetail(req.params.id);
    if (!r) return res.render("error/static", { error: "资源不存在。" });
    if (r.sellerId !== req.user._id && !req.user.isAdmin) {
      return res.render("error/static", { error: "无权编辑该资源。" });
    }
    await resourceAPI.updateResource(req.params.id, req.body);
    req.session.flash = { type: 'success', msg: '资源已更新。' };
    res.redirect('/resources/' + req.params.id);
  } catch (error) {
    res.render("error/static", { error });
  }
});

// POST /resources/:id/delete
router.post("/:id/delete", authenticationMiddleware, async (req, res) => {
  try {
    const r = await resourceAPI.getResourceDetail(req.params.id);
    if (!r) return res.render("error/static", { error: "资源不存在。" });
    if (r.sellerId !== req.user._id && !req.user.isAdmin) {
      return res.render("error/static", { error: "无权删除该资源。" });
    }
    await resourceAPI.deleteResource(req.params.id);
    cache.del('campusshelf:hot-resources').catch(() => {});
    cache.del('campusshelf:ranking').catch(() => {});
    req.session.flash = { type: 'success', msg: '资源已删除。' };
    res.redirect('/user?tab=publish');
  } catch (error) {
    res.render("error/static", { error });
  }
});

// POST /resources/:id/addToCart
router.post("/:id/addToCart", authenticationMiddleware, async(req, res) => {
  try {
    const r = await resourceAPI.getResourceDetail(req.params.id);
    if (!r) return res.render("error/static", { error: "资源不存在。" });
    await userAPI.addToCart(req.user.email, {
      isbn: r.id,
      title: r.title,
      price: r.price,
      imageURL: { thumbnail: r.imageUrl },
      category: r.category
    });
    req.session.flash = { type: 'success', msg: '已加入购物车。' };
    res.redirect('/user/shoppingCart');
  } catch (error) {
    res.render("error/static", { error });
  }
});

module.exports = router;
