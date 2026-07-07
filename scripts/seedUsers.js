/**
 * Seeds the default accounts for CampusShelf:
 *   - admin@campusshelf.com / admin123   (isAdmin: true, for /admin)
 *   - student@campusshelf.com / student123 (demo buyer/seller)
 *
 * Run once with: node scripts/seedUsers.js
 * Idempotent: re-running keeps existing accounts and only adds the two defaults
 * if their emails are not present.
 */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jsonStore = require('../utilities/jsonStore');

const USERS_FILE = 'users/users.json';
const users = jsonStore.readJson(USERS_FILE) || [];

function ensure(email, password, extra) {
  if (users.find(u => u.email === email)) {
    console.log('exists:', email);
    return;
  }
  users.push(Object.assign({
    _id: uuidv4(),
    firstName: extra.firstName,
    lastName: extra.lastName,
    email,
    password: bcrypt.hashSync(password),
    shoppingCart: [],
    purchases: [],
    favorites: [],
    isAdmin: !!extra.isAdmin
  }, extra.profile || {}));
  console.log('added :', email);
}

ensure('admin@campusshelf.com', 'admin123', { firstName: 'Admin', lastName: '', isAdmin: true });
ensure('student@campusshelf.com', 'student123', { firstName: 'Demo', lastName: 'Student', isAdmin: false });

jsonStore.writeJson(USERS_FILE, users);
console.log('Done. Users now:', users.length);
