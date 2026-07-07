const express = require('express');
const router = express.Router();
const functions = require('../../utilities/functions');
const cache = require('../../utilities/cache');
const { CATEGORIES } = require('../../utilities/campusConstants');
const { decorateList } = require('../../utilities/viewModel');

const data = require('../../data');
const resourceAPI = data.resources;
const wantedAPI = data.wanted;
const userAPI = data.users;
const orderAPI = data.orders;
const commentAPI = data.comments;

// Landing page: hero + stats + categories + hot + latest + free + wanted + steps
router.get("/", async(req, res) => {
  const authData = functions.isUserAuthenticated(req.user);

  try {
    const hot = await cache.cacheGet('campusshelf:hot-resources', 300, () =>
      resourceAPI.getHotResources(8)
    );
    const all = await resourceAPI.listResources({ status: 'approved', sort: 'newest' });
    const latest = all.slice(0, 8);
    const free = all.filter(r => Number(r.price) === 0).slice(0, 4);
    const wanted = wantedAPI.getRecent(4);

    const userCount = (await userAPI.listUsers()).length;
    const orderCount = orderAPI.countByStatus().total;
    const approvalRate = 98; // mock value

    const counts = await resourceAPI.countByCategory();
    const categories = CATEGORIES.map(c => ({
      ...c,
      count: counts[c.key] || 0
    }));
    const totalResources = Object.values(counts).reduce((a, b) => a + b, 0);

    res.render("store/landingPage/static", {
      authData,
      pageTitle: "CampusShelf 校园学习资源交易平台",
      categories,
      hotResources: decorateList(hot.value),
      latestResources: decorateList(latest),
      freeResources: decorateList(free),
      wanted,
      stats: {
        resources: totalResources,
        users: userCount,
        orders: orderCount,
        approval: approvalRate
      }
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

// Search box submits here -> list page.
router.post("/search", (req, res) => {
  const kw = (req.body.keyword || '').trim();
  const params = new URLSearchParams();
  if (kw) params.set('keyword', kw);
  if (req.body.category) params.set('category', req.body.category);
  res.redirect('/resources?' + params.toString());
});

module.exports = router;
