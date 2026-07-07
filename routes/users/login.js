const express = require('express');
const router = express.Router();
const passport = require('passport');
const authenticationMiddleware = require('../../config/authentication')
let Strategy = require('passport-local').Strategy;

// Login route
router.get("/", (req, res) => {
    res.render("user/loginView/login", {
        pageTitle: "Login"
    });
});

// Login post. Using Passport to verify that the user is authenticated.
router.post("/", (req, res, next) => {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            return res.render("user/loginView/login", {
                pageTitle: "Error",
                error: "登录过程中发生错误，请重试。"
            });
        }

        if (!user) {
            return res.render("user/loginView/login", {
                pageTitle: "Error",
                error: "邮箱或密码错误。"
            });
        }

        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            res.redirect("/");
        });
    })(req, res, next);
});

module.exports = router;
