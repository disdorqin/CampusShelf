/**
 * SVG Icon Cache — loads Tabler SVG icons into memory at startup.
 * Used by the Handlebars `icon` helper to render inline SVGs.
 */
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons/tabler');
let cache = {};

function loadAll() {
  try {
    const files = fs.readdirSync(ICON_DIR);
    files.forEach(f => {
      if (!f.endsWith('.svg')) return;
      const name = f.replace('.svg', '');
      const content = fs.readFileSync(path.join(ICON_DIR, f), 'utf-8');
      // Strip XML comment block if present
      const cleaned = content.replace(/<!--[\s\S]*?-->/g, '').trim();
      cache[name] = cleaned;
    });
    console.log('[icons] Loaded ' + Object.keys(cache).length + ' SVG icons');
  } catch (e) {
    console.warn('[icons] Failed to load icons:', e.message);
  }
}

function get(name) {
  if (typeof name !== 'string') return '';
  // Try exact match first, then fall back to name with modifiers
  return cache[name] || cache[name.replace(/-.+$/, '')] || '';
}

function list() {
  return Object.keys(cache).sort();
}

loadAll();

module.exports = { get, list, loadAll };
