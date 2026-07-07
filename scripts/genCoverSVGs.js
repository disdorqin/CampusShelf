/**
 * Generate category cover SVGs for CampusShelf.
 * Each cover has: gradient background + illustration + category label.
 * Run: node scripts/genCoverSVGs.js
 */
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'public', 'images', 'covers');

const covers = {
  textbook: ['二手教材', '#4F46E5', '#7C3AED', '📚'],
  notes: ['课程笔记', '#059669', '#10B981', '📝'],
  exam: ['考研资料', '#DC2626', '#F59E0B', '🎯'],
  report: ['实验报告', '#0891B2', '#06B6D4', '🔬'],
  ebook: ['电子书', '#7C3AED', '#A855F7', '📖'],
  supplies: ['学习用品', '#D97706', '#F59E0B', '✏️']
};

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

Object.entries(covers).forEach(([key, [label, c1, c2, emoji]]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g-${key}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${c1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${c2};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.2"/>
    </filter>
  </defs>
  <rect width="400" height="300" rx="16" fill="url(#g-${key})"/>
  <text x="200" y="100" text-anchor="middle" font-size="72" filter="url(#shadow)">${emoji}</text>
  <text x="200" y="190" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#fff" filter="url(#shadow)">${label}</text>
  <text x="200" y="230" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">CampusShelf</text>
  <rect x="60" y="250" width="280" height="24" rx="12" fill="rgba(255,255,255,0.2)"/>
</svg>`;
  fs.writeFileSync(path.join(OUT, `${key}.svg`), svg);
  console.log(`✓ ${key}.svg`);
});

console.log('Done. Generated', Object.keys(covers).length, 'cover SVGs');
