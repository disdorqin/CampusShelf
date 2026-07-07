const express = require('express');
const router = express.Router();
const functions = require('../../utilities/functions');
const data = require('../../data');
const wantedAPI = data.wanted;

router.get("/", (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const posts = wantedAPI.getAll().map(p => ({
    ...p,
    createdAt: new Date(p.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }));
  res.render("wanted/list", {
    authData,
    pageTitle: "求购墙 - CampusShelf",
    posts
  });
});

module.exports = router;
