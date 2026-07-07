/**
 * MySQL Database Connection Layer
 *
 * Uses mysql2/promise with connection pooling.
 * Reads config from .env via dotenv.
 */
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const mysql = require('mysql2/promise');

const DB_TYPE = (process.env.DB_TYPE || 'json').toLowerCase();

let pool = null;

function getConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'campusshelf',
    password: process.env.DB_PASSWORD || 'Zlt20060313#',
    database: process.env.DB_NAME || 'campusshelf',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  };
}

/**
 * Initialize the MySQL connection pool.
 * Tests connectivity and returns the pool.
 */
async function initPool() {
  if (pool) return pool;
  const config = getConfig();
  pool = mysql.createPool(config);
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('[db] ✅ MySQL connected (pool)');
  } catch (e) {
    console.error('[db] ❌ MySQL connection failed.');
    console.error('[db]    Please check Docker MySQL is running and .env DB_* config is correct.');
    console.error('[db]    Error: ' + e.message);
    pool = null;
    throw e;
  }
  return pool;
}

/**
 * Execute a single query (returns rows).
 */
async function query(sql, params = []) {
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

/**
 * Execute a single query and return the first row (or null).
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an insert and return the insertId.
 */
async function insert(sql, params = []) {
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result.insertId;
}

/**
 * Execute a raw query (for migrations, multi-statement, DDL).
 */
async function rawQuery(sql) {
  const p = await getPool();
  const [result] = await p.query(sql);
  return result;
}

/**
 * Execute within a transaction.
 * callback: async (conn) => { ... }
 */
async function transaction(callback) {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Get the pool (initializes if needed).
 */
async function getPool() {
  if (!pool) {
    await initPool();
  }
  return pool;
}

/**
 * Close the pool (for graceful shutdown).
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[db] Connection pool closed');
  }
}

function isMySQL() {
  return DB_TYPE === 'mysql';
}

module.exports = {
  initPool, getPool, query, queryOne, insert, rawQuery, transaction, close, isMySQL, DB_TYPE,
};
