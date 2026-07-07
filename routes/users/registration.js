const express = require('express');
const router = express.Router();
const passport = require('passport');
const data = require('../../data');
const usersAPI = data.users;

router.get("/", (req, res) => {
    res.render("user/registrationView/register", {
        pageTitle: "Registration"
    });
});

router.post("/", (req, res) => {
    const data = req.body;

    usersAPI.findByEmail(data.emailInput, (err, existing) => {
        if (existing) {
            return res.render("user/registrationView/register", {
                pageTitle: "Registration - Error",
                error: "该邮箱已被注册，请直接登录。"
            });
        }

        try {
            const user = usersAPI.insertNewUser(data);
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    return res.render("error/static", { pageTitle: "Error", error: "注册成功但自动登录失败，请手动登录。" });
                }
                res.redirect("/");
            });
        } catch (e) {
            res.render("error/static", { pageTitle: "Error", error: e.message || String(e) });
        }
    });
});

module.exports = router;