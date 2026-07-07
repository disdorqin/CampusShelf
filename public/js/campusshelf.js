/**
 * CampusShelf v3 — 前端增强版
 * 搜索历史 / 最近浏览 / 收藏切换 / 实时搜索 / 资源对比 / 主题切换 / Flash 消息
 */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  var LS = window.localStorage;
  var HISTORY_KEY = 'cs_search_history';
  var RECENT_KEY = 'cs_recent_views';
  var THEME_KEY = 'cs_theme';
  var FILTER_KEY = 'cs_last_filter';
  var COMPARE_KEY = 'cs_compare_list';
  var MAX_HISTORY = 8;
  var MAX_RECENT = 10;

  function $(id) { return document.getElementById(id); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function qs(sel) { return document.querySelector(sel); }
  function escapeHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  /* ---------- Flash Messages ---------- */
  function showFlash(type, msg) {
    var container = qs('.flash-messages');
    if (!container) {
      container = document.createElement('div');
      container.className = 'flash-messages';
      document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.className = 'flash-message ' + type;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(function () { el.remove(); }, 300);
    }, 3500);
  }
  window.showFlash = showFlash;

  /* ---------- Search History ---------- */
  function renderSearchHistory() {
    var el = $('searchHistory');
    if (!el) return;
    var items = JSON.parse(LS.getItem(HISTORY_KEY) || '[]');
    if (!items.length) { el.classList.remove('show'); return; }
    el.classList.add('show');
    el.innerHTML = items.map(function (kw) {
      return '<span class="item" data-kw="' + escapeHtml(kw) + '">🔍 ' + escapeHtml(kw) + '</span>';
    }).join('') + '<span class="clear" id="clearHistory">清空 ×</span>';
    el.querySelectorAll('.item').forEach(function (s) {
      s.addEventListener('click', function () {
        var kw = this.getAttribute('data-kw');
        window.location.href = '/resources?keyword=' + encodeURIComponent(kw);
      });
    });
    var cl = $('clearHistory');
    if (cl) cl.addEventListener('click', function () { LS.removeItem(HISTORY_KEY); renderSearchHistory(); });
  }

  function addSearchHistory(kw) {
    if (!kw) return;
    kw = kw.trim();
    if (!kw) return;
    var items = JSON.parse(LS.getItem(HISTORY_KEY) || '[]');
    items = items.filter(function (x) { return x !== kw; });
    items.unshift(kw);
    if (items.length > MAX_HISTORY) items = items.slice(0, MAX_HISTORY);
    LS.setItem(HISTORY_KEY, JSON.stringify(items));
    renderSearchHistory();
  }

  // Hook home page search button
  var homeSearchBtn = qs('.hero-search-wrap button');
  var homeSearchInput = $('globalSearch');
  if (homeSearchBtn && homeSearchInput) {
    homeSearchBtn.addEventListener('click', function (e) {
      addSearchHistory(homeSearchInput.value);
    });
    homeSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addSearchHistory(this.value);
    });
  }

  /* ---------- Recent Views ---------- */
  function addRecentView(id, title, price, imageUrl) {
    var items = JSON.parse(LS.getItem(RECENT_KEY) || '[]');
    items = items.filter(function (x) { return x.id !== id; });
    items.unshift({ id: id, title: title, price: price, imageUrl: imageUrl });
    if (items.length > MAX_RECENT) items = items.slice(0, MAX_RECENT);
    LS.setItem(RECENT_KEY, JSON.stringify(items));
  }

  function renderRecentViews() {
    var section = $('recentViewSection');
    var scroll = $('recentScroll');
    if (!section || !scroll) return;
    var items = JSON.parse(LS.getItem(RECENT_KEY) || '[]');
    if (!items.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    scroll.innerHTML = items.map(function (r) {
      return '<div class="recent-item"><a href="/resources/' + r.id + '">'
        + '<img src="' + escapeHtml(r.imageUrl || '/images/logo.svg') + '" alt="" loading="lazy" onerror="this.src=\'/images/logo.svg\'">'
        + '<div class="info"><div class="title">' + escapeHtml(r.title) + '</div>'
        + '<div class="price">¥' + parseFloat(r.price).toFixed(2) + '</div></div></a></div>';
    }).join('');
  }

  // Auto-add current detail page to recent
  var meta = $('resMeta');
  if (meta) {
    addRecentView(meta.dataset.id, meta.dataset.title, meta.dataset.price, meta.dataset.img);
    renderRecentViews();
  } else {
    renderRecentViews();
  }

  /* ---------- Favorite Toggle (Enhanced) ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.fav-btn, .fav-btn-detail');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-id');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/user/favorite/' + id, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var r = JSON.parse(xhr.responseText);
        if (r.favorited) {
          btn.innerHTML = '❤️';
          btn.classList.add('active');
          btn.style.transform = 'scale(1.3)';
          setTimeout(function () { btn.style.transform = ''; }, 200);
        } else {
          btn.innerHTML = '🤍';
          btn.classList.remove('active');
        }
      } else {
        if (xhr.status === 302 || xhr.status === 403) window.location.href = '/login';
      }
    };
    xhr.send();
  });

  /* ---------- Live Search (debounce 300ms) ---------- */
  var searchInput = $('globalSearch');
  if (searchInput) {
    var drop = document.createElement('div');
    drop.id = 'liveResults';
    searchInput.parentElement.style.position = 'relative';
    searchInput.parentElement.appendChild(drop);
    var t;
    searchInput.addEventListener('input', function () {
      clearTimeout(t);
      var kw = searchInput.value.trim();
      if (kw.length < 1) { drop.style.display = 'none'; return; }
      t = setTimeout(function () {
        drop.innerHTML = '<div style="padding:14px;color:var(--text-muted);text-align:center">搜索中…</div>';
        drop.style.display = 'block';
        fetch('/api/search?keyword=' + encodeURIComponent(kw))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.resources.length) {
              drop.innerHTML = '<div style="padding:14px;color:var(--text-muted);text-align:center">😕 未找到相关资源</div>';
              return;
            }
            var html = '';
            data.resources.slice(0, 6).forEach(function (r) {
              html += '<a href="/resources/' + r.id + '">'
                + '<img src="' + escapeHtml(r.coverUrl || r.imageUrl) + '" onerror="this.src=\'/images/logo.svg\'">'
                + '<div class="result-info"><div class="result-title">' + escapeHtml(r.title) + '</div>'
                + '<div class="result-price">' + r.priceText + '</div></div></a>';
            });
            drop.innerHTML = html;
          })
          .catch(function () { drop.innerHTML = '<div style="padding:14px;color:var(--text-muted);text-align:center">搜索失败，请重试</div>'; });
      }, 300);
    });
    document.addEventListener('click', function (e) {
      if (!drop.contains(e.target) && e.target !== searchInput) drop.style.display = 'none';
    });
  }

  /* ---------- Theme Toggle (Smooth) ---------- */
  var themeToggle = $('themeToggle');
  if (themeToggle) {
    var cur = LS.getItem(THEME_KEY) || 'light';
    if (cur === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = cur === 'dark' ? '☀️' : '🌙';
    themeToggle.addEventListener('click', function () {
      var d = document.documentElement;
      var next = d.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      d.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      d.setAttribute('data-theme', next);
      LS.setItem(THEME_KEY, next);
      themeToggle.innerHTML = next === 'dark' ? '☀️' : '🌙';
    });
  }

  /* ---------- List Page: Sort Buttons ---------- */
  $$('.sort-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var sort = this.getAttribute('data-sort');
      if (sort) {
        e.preventDefault();
        var u = new URL(window.location.href);
        u.searchParams.set('sort', sort);
        u.searchParams.set('page', '1');
        var ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:999';
        ov.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(ov);
        window.location.href = u.toString();
      }
    });
  });

  /* ---------- List Page: Filter preserve ---------- */
  var ff = $('filterForm');
  if (ff) {
    var saved = JSON.parse(LS.getItem(FILTER_KEY) || '{}');
    if (!window.location.search) {
      Object.keys(saved).forEach(function (k) {
        var el = ff.querySelector('[name="' + k + '"]');
        if (el && !el.value) el.value = saved[k];
      });
    }
    ff.addEventListener('submit', function () {
      var obj = {};
      ['keyword', 'category', 'condition', 'campus', 'minPrice', 'maxPrice', 'sort', 'freeOnly', 'bargain'].forEach(function (k) {
        var el = ff.querySelector('[name="' + k + '"]');
        if (el && el.value) obj[k] = el.value;
      });
      LS.setItem(FILTER_KEY, JSON.stringify(obj));
    });
  }

  /* ---------- Compare Feature (Enhanced) ---------- */
  var COMPARE = JSON.parse(LS.getItem(COMPARE_KEY) || '[]');
  var compareBar = $('compareBar');
  var compareOverlay = $('compareOverlay');

  function renderCompareBar() {
    if (!compareBar) return;
    if (!COMPARE.length) { compareBar.classList.remove('show'); return; }
    compareBar.classList.add('show');
    var html = '<span style="display:flex;align-items:center;gap:6px;font-size:14px">📊 已选 <strong>' + COMPARE.length + '</strong>/3 个资源</span>';
    COMPARE.forEach(function (r, i) {
      html += '<div class="compare-item">'
        + '<img src="' + escapeHtml(r.img || '/images/logo.svg') + '" onerror="this.src=\'/images/logo.svg\'">'
        + '<div class="info"><div class="name">' + escapeHtml(r.title) + '</div><div class="price">¥' + parseFloat(r.price).toFixed(2) + '</div></div>'
        + '<button onclick="window.removeCompare(' + i + ')" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-muted)">×</button></div>';
    });
    html += '<button class="compare-btn" onclick="window.showCompare()">开始对比</button>';
    html += '<button class="btn btn-ghost" onclick="window.clearCompare()">清空</button>';
    compareBar.innerHTML = html;
  }

  function removeCompare(i) { COMPARE.splice(i, 1); LS.setItem(COMPARE_KEY, JSON.stringify(COMPARE)); renderCompareBar(); }
  window.removeCompare = removeCompare;

  function clearCompare() { COMPARE = []; LS.removeItem(COMPARE_KEY); renderCompareBar(); }
  window.clearCompare = clearCompare;

  function toggleCompare(id, title, price, img) {
    var i = COMPARE.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { COMPARE.splice(i, 1); }
    else {
      if (COMPARE.length >= 3) { showFlash('info', '最多选择 3 个资源进行对比'); return; }
      COMPARE.push({ id: id, title: title, price: price, img: img });
    }
    LS.setItem(COMPARE_KEY, JSON.stringify(COMPARE));
    renderCompareBar();
  }
  window.toggleCompare = toggleCompare;

  function showCompare() {
    if (!compareOverlay || COMPARE.length < 2) {
      if (COMPARE.length < 2) showFlash('info', '请至少勾选 2 个资源（每个资源卡片下方有「对比」复选框）');
      return;
    }
    var promises = COMPARE.map(function (r) {
      return fetch('/resources/' + r.id + '?json=1').then(function (resp) {
        if (!resp.ok) return null;
        return resp.json().catch(function () { return null; });
      });
    });
    Promise.all(promises).then(function (results) {
      var validResults = results.filter(Boolean);
      if (validResults.length < 2) { showFlash('error', '获取资源详情失败'); return; }
      var html = '<div class="compare-modal" onclick="event.stopPropagation()">'
        + '<button class="close-modal" onclick="window.closeCompare()">×</button>'
        + '<h2>📊 资源对比</h2>'
        + '<table class="compare-table"><thead><tr><th>项目</th>';
      validResults.forEach(function (d) {
        html += '<th><div class="img-cell"><img src="' + escapeHtml(d.coverUrl || '/images/logo.svg') + '" onerror="this.src=\'/images/logo.svg\'"></div></th>';
      });
      html += '</tr></thead><tbody>';
      var rows = [
        { key: '标题', fn: function (d) { return '<strong>' + escapeHtml(d.title) + '</strong>'; } },
        { key: '价格', fn: function (d) { return '<span style="color:var(--accent);font-weight:700;font-size:16px">¥' + parseFloat(d.price).toFixed(2) + '</span>'; } },
        { key: '成色', fn: function (d) { return d.condition || '-'; } },
        { key: '校区', fn: function (d) { return d.campus || '-'; } },
        { key: '课程', fn: function (d) { return d.courseName || '-'; } },
        { key: '评分', fn: function (d) { return d.avgRating ? '<span style="color:var(--warning)">★ ' + d.avgRating + '</span>' : '-'; } },
        { key: '浏览量', fn: function (d) { return '👁 ' + (d.views || 0); } },
        { key: '收藏数', fn: function (d) { return '❤️ ' + (d.favoritesCount || 0); } },
        { key: '卖家', fn: function (d) { return escapeHtml(d.sellerName || '-'); } },
        { key: '标签', fn: function (d) { return d.tags ? d.tags.join(', ') : '-'; } }
      ];
      rows.forEach(function (row) {
        html += '<tr><td><strong>' + row.key + '</strong></td>';
        validResults.forEach(function (d) {
          html += '<td>' + (d ? row.fn(d) : '-') + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      compareOverlay.innerHTML = html;
      compareOverlay.classList.add('show');
    });
  }
  window.showCompare = showCompare;

  function closeCompare() { if (compareOverlay) compareOverlay.classList.remove('show'); }
  window.closeCompare = closeCompare;

  if (compareOverlay) compareOverlay.addEventListener('click', closeCompare);

  // Compare checkboxes
  document.addEventListener('change', function (e) {
    var cb = e.target.closest('.compare-cb');
    if (!cb) return;
    var card = cb.closest('[data-compare-id]');
    if (card) {
      toggleCompare(
        card.getAttribute('data-compare-id'),
        card.getAttribute('data-compare-title'),
        card.getAttribute('data-compare-price'),
        card.getAttribute('data-compare-img')
      );
    }
  });

  renderCompareBar();

  /* ---------- Search History on page load ---------- */
  renderSearchHistory();

  /* ---------- Card Animations ---------- */
  // Lazy reveal cards as they scroll into view
  if (window.IntersectionObserver) {
    var cards = $$('.resource-card, .cat-card, .step-card, .wanted-card, .free-card');
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach(function (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(card);
    });
  }

})();
