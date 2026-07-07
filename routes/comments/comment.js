const express = require('express');
const router = express.Router();
const authenticationMiddleware = require('../../config/authentication/middleware');
const data = require('../../data');
const commentAPI = data.comments;
const resourceAPI = data.resources;

// POST /comments — add a comment + rating to a resource (login required)
router.post("/", authenticationMiddleware, async (req, res) => {
  try {
    const { resourceId, text, rating } = req.body;
    const r = await resourceAPI.getResourceDetail(resourceId);
    if (!r) return res.render("error/static", { error: "资源不存在。" });
    await commentAPI.createComment({
      resourceId,
      userId: req.user._id,
      rating: parseInt(rating) || 5,
      text
    });
    res.redirect('/resources/' + resourceId);
  } catch (error) {
    res.render("error/static", { error });
  }
});

// POST /comments/:id/delete — admin only
router.post("/:id/delete", authenticationMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.render("error/static", { error: "无权操作。" });
    await commentAPI.deleteComment(req.params.id);
    res.redirect(req.headers.referer || '/admin/comments');
  } catch (error) {
    res.render("error/static", { error });
  }
});

module.exports = router;
