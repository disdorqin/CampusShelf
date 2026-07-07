/**
 * User data access (registration, login, shopping cart, purchases).
 *
 * Original version used MongoDB for persistence. This version uses a local
 * JSON file (data/users/users.json) via utilities/jsonStore.js so the app
 * runs without a MongoDB server. Function signatures are preserved.
 *
 * Password hashing uses bcryptjs (pure JS, no native build) instead of the
 * deprecated bcrypt-nodejs.
 */
const jsonStore = require('../../utilities/jsonStore');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const lodash = require('lodash');
const moment = require('moment');

const USERS_FILE = 'users/users.json';
const loadUsers = () => jsonStore.readJson(USERS_FILE) || [];
const saveUsers = (users) => jsonStore.writeJson(USERS_FILE, users);

// Returns a users information based on the passed in email
const findByEmail = (userEmail, callback) => {
    const user = loadUsers().find(u => u.email === userEmail);

    if (user) {
        callback(null, user);
    } else {
        callback("User does not exist", null);
    }
};

// Returns a users information based on the passed in id
const findUserByID = (id) => {
    const userItem = loadUsers().find(u => u._id === id);
    return userItem || null;
};

// Inserts a new user
const insertNewUser = (userData) => {
    const users = loadUsers();
    const newUser = {
        _id: uuidv4(),
        firstName: userData.firstNameInput,
        lastName: userData.lastNameInput,
        email: userData.emailInput,
        password: bcrypt.hashSync(userData.passwordInput),
        shoppingCart: [],
        purchases: [],
        favorites: []
    };

    users.push(newUser);
    saveUsers(users);

    return newUser;
};

// Updates a user's information
const updateUser = (id, newData) => {
    if (!id) throw "ID is needed to update";
    if (!newData) throw "Need an update object.";

    const users = loadUsers();
    const idx = users.findIndex(u => u._id === id);
    if (idx === -1) throw "User not found";

    const u = users[idx];
    if (newData.firstNameInput) u.firstName = newData.firstNameInput;
    if (newData.lastNameInput) u.lastName = newData.lastNameInput;
    if (newData.emailInput) u.email = newData.emailInput;
    if (newData.passwordInput) u.password = bcrypt.hashSync(newData.passwordInput);

    users[idx] = u;
    saveUsers(users);
    return u;
};

// Adds a book to the user's shopping cart
const addToCart = (userEmail, bookItem) => {
    const users = loadUsers();
    const user = users.find(u => u.email === userEmail);
    if (!user) return false;

    const book = Array.isArray(bookItem) ? bookItem[0] : bookItem;
    const existing = user.shoppingCart.find(item => item.book.isbn === book.isbn);

    if (existing) {
        existing.book.quantity = (existing.book.quantity || 1) + 1;
    } else {
        user.shoppingCart.push({ book: Object.assign({}, book, { quantity: 1 }) });
    }

    saveUsers(users);
    return true;
};

// Increments the quantity of a book inside the shopping cart.
const incrementQuantity = (user, isbn, incrementAmount) => {
    if (!user) throw "incrementQuantity expected a user";
    if (!isbn) throw "incrementQuantity expected an isbn";
    if (!incrementAmount) throw "incrementQuantity expected an incrementAmount";

    const users = loadUsers();
    const u = users.find(x => x.email === user.email);
    const item = u && u.shoppingCart.find(i => i.book.isbn === isbn);
    if (item) {
        item.book.quantity = (item.book.quantity || 1) + incrementAmount;
        saveUsers(users);
        return { result: { ok: 1 } };
    }
    return { result: { ok: 0 } };
};

// Updates the quantity of a book inside the shopping cart.
const updateQuantity = (user, isbn, updateQuantity) => {
    if (!user) throw "updateQuantity expected a user";
    if (!isbn) throw "updateQuantity expected an isbn";
    if (!updateQuantity) throw "updateQuantity expected an updateQuantity";

    const users = loadUsers();
    const u = users.find(x => x.email === user.email);
    const item = u && u.shoppingCart.find(i => i.book.isbn === isbn);
    if (item) {
        item.book.quantity = updateQuantity;
        saveUsers(users);
        return { result: { ok: 1 } };
    }
    return { result: { ok: 0 } };
};

// Removes a book from the shopping cart.
const removeBookFromCart = (user, isbn) => {
    if (!user) throw "removeBookFromCart expected a user";
    if (!isbn) throw "removeBookFromCart expected an isbn";

    const users = loadUsers();
    const u = users.find(x => x.email === user.email);
    if (u) {
        u.shoppingCart = u.shoppingCart.filter(i => i.book.isbn !== isbn);
        saveUsers(users);
    }
    return { result: { ok: 1 } };
};

// ---- CampusShelf favorites (server-side, requires login) ----
const toggleFavorite = (userEmail, resourceId) => {
    const users = loadUsers();
    const u = users.find(x => x.email === userEmail);
    if (!u) return { ok: false };
    u.favorites = u.favorites || [];
    const i = u.favorites.indexOf(resourceId);
    let favorited;
    if (i >= 0) { u.favorites.splice(i, 1); favorited = false; }
    else { u.favorites.push(resourceId); favorited = true; }
    saveUsers(users);
    return { ok: true, favorited };
};

const isFavorite = (userEmail, resourceId) => {
    const u = loadUsers().find(x => x.email === userEmail);
    return !!(u && u.favorites && u.favorites.includes(resourceId));
};

const getFavoriteIds = (userEmail) => {
    const u = loadUsers().find(x => x.email === userEmail);
    return (u && u.favorites) || [];
};

// Admin: list all users (lightweight projection)
const listUsers = () => loadUsers().map(u => ({
    _id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    isAdmin: !!u.isAdmin,
    favorites: (u.favorites || []).length
}));

// Returns information about the user's cart (number of items, total amount and the books.)
const getCartInformation = (user) => {
    if (!user) throw "getCartInformation expected a user";

    let numOfItems = 0;
    let totalAmount = 0;

    lodash.forEach(user.shoppingCart, function (item) {
        numOfItems += Number(item.book.quantity);
        totalAmount += (item.book.quantity * item.book.price);
    });

    return {
        numOfItems: numOfItems,
        totalAmount: totalAmount,
        cart: user.shoppingCart
    };
};

// "Completes" the users order. Moves everything in the shopping cart to the purchases history.
const completePurchaseOrder = (user) => {
    if (!user) throw "completePurchaseOrder expected a user";

    const users = loadUsers();
    const u = users.find(x => x.email === user.email);
    if (!u) return;

    for (let i = 0; i < u.shoppingCart.length; i++) {
        let book = Object.assign({}, u.shoppingCart[i].book, {
            datePurchased: moment().format('MMMM Do YYYY')
        });
        u.purchases.push({ book });
    }
    u.shoppingCart = [];
    saveUsers(users);
};

module.exports = {
    findByEmail: findByEmail,
    findUserByID: findUserByID,
    insertNewUser: insertNewUser,
    updateUser: updateUser,
    addToCart: addToCart,
    incrementQuantity: incrementQuantity,
    updateQuantity: updateQuantity,
    removeBookFromCart: removeBookFromCart,
    getCartInformation: getCartInformation,
    completePurchaseOrder: completePurchaseOrder,
    toggleFavorite: toggleFavorite,
    isFavorite: isFavorite,
    getFavoriteIds: getFavoriteIds,
    listUsers: listUsers
};
