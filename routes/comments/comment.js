const express = require('express');
const router = express.Router();
const authenticationMiddleware = require('../../config/authentication/middleware');
const data = require('../../data');
const commentAPI = data.comments;
const resourceAPI = data.resources;

// POST /comments — add a comment + rating to a resource (login required)
router.post("/", authenticationMiddleware, (req, res) => {
  const { resourceId, text, rating } = req.body;
  const r = resourceAPI.getResourceDetail(resourceId);
  if (!r) return res.render("error/static", { error: "资源不存在。" });
  commentAPI.addComment(resourceId, (req.user.firstName + ' ' + (req.user.lastName || '')).trim() || req.user.email, text, rating);
  res.redirect('/resources/' + resourceId);
});

// POST /comments/:id/delete — admin only
router.post("/:id/delete", authenticationMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.render("error/static", { error: "无权操作。" });
  commentAPI.removeComment(req.params.id);
  res.redirect(req.headers.referer || '/admin/comments');
});

module.exports = router;
