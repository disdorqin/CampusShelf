/**
 * CampusShelf cache layer.
 *
 * Tries to use Redis when available; otherwise transparently falls back to an
 * in-memory store so the app ALWAYS runs (even with no Redis installed/running).
 *
 * Redis is an OPTIONAL dependency: if the `redis` package is not installed, or a
 * Redis server is not reachable, the app logs "Redis unavailable, using memory
 * cache" and continues in memory mode. To enable Redis:
 *   1) npm install redis
 *   2) start a Redis server (redis-server, or docker compose up)
 *   3) restart the app -> logs "Redis cache enabled"
 *
 * Key design (see docs/REDIS_OPTIMIZATION.md):
 *   campusshelf:hot-resources   ttl 300s
 *   campusshelf:search:<kw>     ttl 180s
 *   campusshelf:google:<query>  ttl 3600s
 *   campusshelf:views:<id>      (counter)
 *   campusshelf:ranking         (no ttl)
 */
const memoryStore = new Map(); // key -> { value, exp }
let redisClient = null;
let redisReady = false;
let mode = 'memory';

function logMode() {
  if (mode === 'redis' && redisReady) {
    console.log('\x1b[32m[cache] Redis cache enabled\x1b[0m');
  } else {
    console.log('\x1b[33m[cache] Redis unavailable, using memory cache\x1b[0m');
  }
}

try {
  const redis = require('redis');
  mode = 'redis'; // package present, will verify connection below
  redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379' });
  redisClient.on('error', () => { /* swallow: stay in memory mode */ });
  redisClient.connect()
    .then(() => { redisReady = true; console.log('\x1b[32m[cache] Redis cache enabled\x1b[0m'); })
    .catch(() => { redisReady = false; console.log('\x1b[33m[cache] Redis unavailable, using memory cache\x1b[0m'); });
} catch (e) {
  mode = 'memory';
  redisClient = null;
  console.log('\x1b[33m[cache] Redis unavailable, using memory cache\x1b[0m');
}

async function get(key) {
  if (mode === 'redis' && redisReady && redisClient) {
    try {
      const v = await redisClient.get(key);
      return v ? JSON.parse(v) : null;
    } catch (e) { /* fall through to memory */ }
  }
  const e = memoryStore.get(key);
  if (!e) return null;
  if (e.exp && Date.now() > e.exp) { memoryStore.delete(key); return null; }
  return e.value;
}

async function set(key, value, ttl) {
  if (mode === 'redis' && redisReady && redisClient) {
    try {
      if (ttl) await redisClient.set(key, JSON.stringify(value), { EX: ttl });
      else await redisClient.set(key, JSON.stringify(value));
      return;
    } catch (e) { /* fall through to memory */ }
  }
  memoryStore.set(key, { value, exp: ttl ? Date.now() + ttl * 1000 : 0 });
}

async function del(key) {
  if (mode === 'redis' && redisReady && redisClient) {
    try { await redisClient.del(key); } catch (e) {}
  }
  memoryStore.delete(key);
}

async function incr(key) {
  const cur = (await get(key)) || 0;
  const next = cur + 1;
  await set(key, next, 0);
  return next;
}

/**
 * Returns { value, hit } – caches the fallback result for `ttl` seconds.
 */
async function cacheGet(key, ttl, fallback) {
  const cached = await get(key);
  if (cached !== null) return { value: cached, hit: true };
  const value = await fallback();
  await set(key, value, ttl);
  return { value, hit: false };
}

function getMode() {
  return (mode === 'redis' && redisReady) ? 'redis' : 'memory';
}

module.exports = { get, set, del, incr, cacheGet, getMode, logMode };
