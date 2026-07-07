/**
 * Comments & ratings data access for CampusShelf resources.
 * Backed by data/comments/comments.json. Pure offline JSON store.
 */
const { v4: uuidv4 } = require('uuid');
const jsonStore = require('../../utilities/jsonStore');

const COM_FILE = 'comments/comments.json';
const load = () => jsonStore.readJson(COM_FILE) || [];
const save = (list) => jsonStore.writeJson(COM_FILE, list);

const getByResource = (resourceId) =>
  load().filter(c => c.resourceId === resourceId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const getAverageRating = (resourceId) => {
  const list = getByResource(resourceId);
  if (!list.length) return { avg: 0, count: 0 };
  const sum = list.reduce((s, c) => s + (c.rating || 0), 0);
  return { avg: +(sum / list.length).toFixed(1), count: list.length };
};

const addComment = (resourceId, userName, text, rating) => {
  const list = load();
  const c = {
    id: uuidv4(),
    resourceId,
    userName: userName || '匿名用户',
    text: text || '',
    rating: Number(rating) || 0,
    createdAt: new Date().toISOString()
  };
  list.push(c);
  save(list);
  return c;
};

const removeComment = (id) => {
  const list = load();
  const next = list.filter(c => c.id !== id);
  if (next.length === list.length) return false;
  save(next);
  return true;
};

const countAll = () => load().length;

module.exports = { getByResource, getAverageRating, addComment, removeComment, countAll };
