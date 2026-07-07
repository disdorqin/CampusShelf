const express = require('express');
const router = express.Router();
const cache = require('../utilities/cache');
const { decorateList } = require('../utilities/viewModel');

const data = require('../data');
const resourceAPI = data.resources;

// GET /api/search?keyword=&category=  -> cached JSON results (approved only)
router.get("/search", async(req, res) => {
  const keyword = (req.query.keyword || '').trim();
  const category = req.query.category || 'all';
  const key = 'campusshelf:search:' + (category !== 'all' ? category + ':' : '') + keyword.toLowerCase();
  try {
    const result = await cache.cacheGet(key, 180, () =>
      resourceAPI.listResources({ keyword, category, status: 'approved', sort: 'newest' }).slice(0, 12)
    );
    res.json({ hit: result.hit, resources: decorateList(result.value) });
  } catch (e) {
    res.json({ hit: false, resources: [] });
  }
});

// GET /api/resources/by-ids?ids=id1,id2  -> for client-side "recent views"
router.get("/resources/by-ids", (req, res) => {
  const ids = (req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
  const list = ids.map(id => resourceAPI.getById(id)).filter(Boolean).filter(r => r.status === 'approved');
  res.json({ resources: decorateList(list) });
});

// GET /api/ranking -> hot ranking (cached)
router.get("/ranking", async(req, res) => {
  const result = await cache.cacheGet('campusshelf:ranking', 300, () => resourceAPI.getRanking(10));
  res.json({ ranking: decorateList(result.value) });
});

module.exports = router;
