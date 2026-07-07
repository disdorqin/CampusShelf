const searchRoute = require('./store/search');
const loginRoute = require('./users/login');
const registerRoute = require('./users/registration');
const userRoute = require('./users/user');
const resourceRoute = require('./resources/resource');
const commentRoute = require('./comments/comment');
const adminRoute = require('./admin/admin');
const apiRoute = require('./api');
const wantedRoute = require('./wanted/wanted');

const constructorMethod = (app) => {
    app.use("/", searchRoute);
    app.use("/login", loginRoute);
    app.use("/register", registerRoute);
    app.use("/user", userRoute);
    app.use("/resources", resourceRoute);
    app.use("/comments", commentRoute);
    app.use("/admin", adminRoute);
    app.use("/api", apiRoute);
    app.use("/wanted", wantedRoute);

    app.use("*", (req, res) => {
        res.status(404).render("error/static", {
            error: "Page not found."
        });
    });
};

module.exports = constructorMethod;
