/**
 * Generates lightweight SVG placeholder images for each resource category
 * (so the site renders nicely offline, no external image host required).
 * Output: public/img/cat-<category>.svg  +  logo.svg  +  favicon.svg
 */
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'public', 'img');
fs.mkdirSync(IMG_DIR, { recursive: true });

const CATS = {
  textbook: { label: '二手教材', sub: 'Textbook', c1: '#6366f1', c2: '#4f46e5' },
  notes:    { label: '课程笔记', sub: 'Notes',    c1: '#06b6d4', c2: '#0891b2' },
  exam:     { label: '考研资料', sub: 'Exam',     c1: '#ec4899', c2: '#db2777' },
  report:   { label: '实验报告', sub: 'Report',   c1: '#22c55e', c2: '#16a34a' },
  ebook:    { label: '电子书',   sub: 'E-Book',   c1: '#f97316', c2: '#ea580c' },
  supplies: { label: '学习用品', sub: 'Supplies', c1: '#eab308', c2: '#ca8a04' }
};

function svg(c1, c2, label, sub, glyph) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)"/>
  <circle cx="200" cy="120" r="58" fill="rgba(255,255,255,0.18)"/>
  <text x="200" y="138" font-size="56" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif">${glyph}</text>
  <text x="200" y="220" font-size="30" font-weight="700" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif">${label}</text>
  <text x="200" y="250" font-size="16" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">${sub.toUpperCase()}</text>
</svg>`;
}

const GLYPHS = { textbook: '📚', notes: '📝', exam: '🎯', report: '🧪', ebook: '📱', supplies: '🛠️' };

Object.entries(CATS).forEach(([k, v]) => {
  fs.writeFileSync(path.join(IMG_DIR, `cat-${k}.svg`), svg(v.c1, v.c2, v.label, v.sub, GLYPHS[k]), 'utf-8');
});

// Logo
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#0891b2"/></linearGradient></defs>
  <rect x="10" y="10" width="100" height="100" rx="24" fill="url(#lg)"/>
  <text x="60" y="74" font-size="52" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif">📚</text>
</svg>`;
fs.writeFileSync(path.join(IMG_DIR, 'logo.svg'), logo, 'utf-8');

console.log('Generated category SVGs + logo in', IMG_DIR);
