const express = require('express');
const router = express.Router();
const functions = require('../../utilities/functions');
const data = require('../../data');
const wantedAPI = data.wanted;

router.get("/", async (req, res) => {
  try {
    const authData = functions.isUserAuthenticated(req.user);
    const postsRaw = await wantedAPI.getAll();
    const posts = (postsRaw || []).map(p => ({
      ...p,
      createdAt: new Date(p.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }));
    res.render("wanted/list", {
      authData,
      pageTitle: "求购墙 - CampusShelf",
      posts
    });
  } catch (error) {
    res.render("error/static", { error });
  }
});

module.exports = router;
