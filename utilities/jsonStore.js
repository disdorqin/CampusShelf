/**
 * Lightweight JSON-file data store.
 *
 * Original Bookstore relied on a live MongoDB server (mongodb://localhost:27017).
 * To guarantee the project runs on any Windows laptop without installing MongoDB,
 * this helper provides a simple file-backed store. The data-access modules
 * (data/store/search.js, data/users/user.js) use it as the DEFAULT backend.
 *
 * MongoDB can still be enabled later by swapping the data layer (see docs).
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(file) {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeJson(file, data) {
    const p = path.join(DATA_DIR, file);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJson, writeJson, DATA_DIR };
