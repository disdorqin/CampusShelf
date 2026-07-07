/**
 * View-model helpers: decorate raw resource/order objects with display fields
 * (category label, status label, colors, price text, favorite flag) so the
 * Handlebars templates stay simple.
 */
const { CATEGORY_MAP, STATUS_MAP } = require('./campusConstants');

function decorateResource(r, opts = {}) {
  if (!r) return r;
  const cat = CATEGORY_MAP[r.category] || { label: r.category, color: '#888', icon: '📦' };
  const st = STATUS_MAP[r.status] || { label: r.status, color: '#888' };
  // Use category cover when imageUrl is a placeholder (cat-*.svg or missing)
  const isPlaceholder = !r.imageUrl || r.imageUrl.includes('cat-') || r.imageUrl.includes('/logo.svg');
  const coverUrl = isPlaceholder
    ? '/images/covers/' + (r.category || 'textbook') + '.svg'
    : r.imageUrl;
  return Object.assign({}, r, {
    categoryLabel: cat.label,
    categoryColor: cat.color,
    categoryIcon: cat.icon,
    statusLabel: st.label,
    statusColor: st.color,
    isFavorited: opts.favoriteIds ? opts.favoriteIds.includes(r.id) : (r.isFavorited || false),
    priceText: '¥' + Number(r.price || 0).toFixed(2),
    coverUrl: coverUrl
  });
}

function decorateList(list, opts = {}) {
  return list.map(r => decorateResource(r, opts));
}

function decorateOrder(o) {
  if (!o) return o;
  const st = STATUS_MAP[o.status] || { label: o.status, color: '#888' };
  return Object.assign({}, o, {
    statusLabel: st.label,
    statusColor: st.color,
    totalText: '¥' + Number(o.total || 0).toFixed(2)
  });
}

module.exports = { decorateResource, decorateList, decorateOrder };
