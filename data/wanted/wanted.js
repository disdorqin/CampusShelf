const jsonStore = require('../../utilities/jsonStore');
const WANTED_FILE = 'wanted/wanted.json';
let _cached = null;

const getAll = () => {
  if (!_cached) _cached = jsonStore.readJson(WANTED_FILE) || [];
  return _cached;
};

const getRecent = (n = 4) => getAll().slice(0, n);

module.exports = { getAll, getRecent };
