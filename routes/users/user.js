const express = require('express');
const router = express.Router();
const lodash = require('lodash');
const functions = require('../../utilities/functions');
const authenticationMiddleware = require('../../config/authentication/middleware');
const { decorateResource, decorateList, decorateOrder } = require('../../utilities/viewModel');

const data = require('../../data');
const userAPI = data.users;
const resourceAPI = data.resources;
const orderAPI = data.orders;
const commentAPI = data.comments;

// User center: my publishes / favorites / orders / recent (recent via localStorage on client)
const renderCenter = (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const user = req.user;

  const favoriteIds = userAPI.getFavoriteIds(user.email);
  const favorites = decorateList(
    favoriteIds.map(id => resourceAPI.getById(id)).filter(Boolean).filter(r => r.status === 'approved'),
    { favoriteIds }
  );
  const myPublish = decorateList(resourceAPI.getBySeller(user._id));
  const orders = orderAPI.getByUser(user._id).map(decorateOrder);
  const flash = req.session.flash; req.session.flash = null;

  res.render("user/center", {
    authData,
    pageTitle: "个人中心 - CampusShelf",
    user,
    favorites,
    myPublish,
    orders,
    flash,
    activeTab: req.query.tab || 'publish'
  });
};
router.get("/", authenticationMiddleware, renderCenter);
router.get("/center", authenticationMiddleware, renderCenter);

// Toggle favorite (AJAX). Returns JSON { favorited }.
router.post("/favorite/:id", authenticationMiddleware, (req, res) => {
  const result = userAPI.toggleFavorite(req.user.email, req.params.id);
  if (result.ok) {
    const r = resourceAPI.getById(req.params.id);
    if (r) {
      r.favoritesCount = (r.favoritesCount || 0) + (result.favorited ? 1 : -1);
      resourceAPI.updateResource(req.params.id, { favoritesCount: r.favoritesCount });
    }
  }
  res.json({ ok: result.ok, favorited: result.favorited });
});

// Edit profile (kept from original Bookstore)
router.get("/account", authenticationMiddleware, (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  res.render("user/accountView/account", {
    authData, pageTitle: "账户设置 - CampusShelf", user: req.user
  });
});

// Shopping cart
router.get("/shoppingCart", authenticationMiddleware, (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const user = req.user;
  let numOfItems = 0, totalAmount = 0;
  lodash.forEach(user.shoppingCart, item => {
    numOfItems += Number(item.book.quantity);
    totalAmount += (item.book.quantity * item.book.price);
  });
  const flash = req.session.flash; req.session.flash = null;
  res.render("user/accountView/shoppingCart", {
    authData, pageTitle: "购物车 - CampusShelf",
    numOfItems, totalAmount, cart: user.shoppingCart, flash
  });
});

// Purchases history
router.get("/purchases", authenticationMiddleware, (req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  res.render("user/accountView/purchases", {
    authData, pageTitle: "购买记录 - CampusShelf", purchases: req.user.purchases
  });
});

// Checkout: create an order (status=pending) and clear the cart.
router.get("/confirmation", authenticationMiddleware, async(req, res) => {
  const authData = functions.isUserAuthenticated(req.user);
  const user = req.user;
  const cart = user.shoppingCart || [];
  if (cart.length === 0) return res.redirect('/user/shoppingCart');

  const items = cart.map(i => ({
    resourceId: i.book.isbn,
    title: i.book.title,
    price: i.book.price,
    quantity: i.book.quantity
  }));
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  orderAPI.createOrder({ userId: user._id, userName: user.email, items, total });
  // mark purchased resources as sold
  items.forEach(i => {
    const r = resourceAPI.getById(i.resourceId);
    if (r && r.status === 'approved') resourceAPI.changeStatus(i.resourceId, 'sold');
  });
  await userAPI.completePurchaseOrder(user);

  res.render("user/accountView/purchaseConfirmation", {
    authData, pageTitle: "下单成功 - CampusShelf", totalAmount: total, cart: items
  });
});

router.get("/logout", (req, res) => {
  req.logout(() => res.redirect('/'));
});

// Update account
router.post("/account", authenticationMiddleware, async(req, res) => {
  const updated = await userAPI.updateUser(req.user._id, req.body);
  req.login(updated, err => {
    if (err) return res.render("user/accountView/account", { pageTitle: "Error", error: "更新失败" });
    res.redirect("account");
  });
});

// Cart update (qty / remove) — book.isbn is the resource id
router.post("/shoppingCart/update/:isbn", authenticationMiddleware, async(req, res) => {
  const user = req.user, isbn = req.params.isbn;
  if ('remove' in req.body) {
    await userAPI.removeBookFromCart(user, isbn);
  } else if ('update' in req.body) {
    await userAPI.updateQuantity(user, isbn, req.body.quantity);
  }
  res.redirect("/user/shoppingCart");
});

module.exports = router;
