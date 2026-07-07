const express = require('express');
const session = require('express-session');
const passport = require('passport');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const auth = require('./authentication');
const static = express.static(__dirname + '/../public');
const configRoutes = require('../routes');
const { CATEGORIES } = require('../utilities/campusConstants');

const app = express();

const handlebarsInstance = exphbs.create({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../views/layouts'),
    partialsDir: path.join(__dirname, '../views/partials'),
    helpers: {
        json: (obj) => JSON.stringify(obj),
        eq: (a, b) => a === b,
        ne: (a, b) => a !== b,
        inc: (n) => Number(n) + 1,
        firstChar: (s) => (s && s.length ? s.charAt(0) : 'U'),
        stars: (n) => '★'.repeat(Math.round(Number(n))) + '☆'.repeat(5 - Math.round(Number(n))),
        split: (str, sep) => {
          if (Array.isArray(str)) return str;
          return (str || '').split(sep || ',');
        },
        gt: (a, b) => Number(a) > Number(b),
        gte: (a, b) => Number(a) >= Number(b),
        lt: (a, b) => Number(a) < Number(b),
        or: (...args) => args.slice(0, -1).some(Boolean),
        and: (...args) => args.slice(0, -1).every(Boolean),
        not: (val) => !val,
        includes: (arr, val) => arr && arr.includes(val),
        add: (a, b) => Number(a) + Number(b),
        sub: (a, b) => Number(a) - Number(b),
        getCategoryLabel: (key) => {
          const map = { textbook:'二手教材', notes:'课程笔记', exam:'考研资料', report:'实验报告', ebook:'电子书', supplies:'学习用品' };
          return map[key] || key;
        }
    }
});

auth.init(app);

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "bookstore",
    resave: false,
    saveUninitialized: false
}));

// Configure view engine to render handlebars templates
// Serve static files from /public at root level AND /public prefix (backward compat)
app.use(static);                    // e.g. /images/logo.svg
app.use('/public', static);         // e.g. /public/css/campusshelf.css
app.engine('handlebars', handlebarsInstance.engine);
app.set('view engine', 'handlebars');

// Morgan logger
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
//app.use(morganDebug('myapp', 'combined'));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Expose common view data to every template (auth state, cart count, categories).
app.use((req, res, next) => {
    res.locals.authData = { isLoggedIn: !!req.user };
    if (req.user) {
        res.locals.authData.user = req.user;
        res.locals.isAdmin = !!req.user.isAdmin;
        res.locals.cartCount = (req.user.shoppingCart || []).reduce((s, i) => s + Number(i.book.quantity), 0);
    }
    res.locals.categories = CATEGORIES;
    next();
});

configRoutes(app);

module.exports = app