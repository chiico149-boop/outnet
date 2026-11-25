/* THE OUT FIT — shared frontend utilities (header, footer, API, cart, UI helpers) */
const TOF = (() => {
  // ---------- Icons ----------
  const I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"/><path d="M4 4v4h4M20 20v-4h-4"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16"/><path d="M9 20v-6h6v6"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5L20 7"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    card: '<svg viewBox="0 0 48 32" fill="none"><rect x="1" y="1" width="46" height="30" rx="5" stroke="currentColor" stroke-width="2"/><path d="M1 10h46" stroke="currentColor" stroke-width="4"/><rect x="6" y="20" width="12" height="4" rx="1" fill="currentColor"/></svg>',
    paypal: '<svg viewBox="0 0 100 32"><path fill="#003087" d="M12.2 3.6H4.6c-.5 0-1 .4-1 .9L.5 24.2c0 .4.3.7.6.7h3.6c.5 0 1-.4 1-.9l.9-5.4c.1-.5.5-.9 1-.9h2.4c5 0 7.9-2.4 8.7-7.2.3-2.1 0-3.8-1-4.9-1.1-1.3-3.1-2-5.5-2z"/><path fill="#009cde" d="M13 10.7c-.4 2.7-2.5 2.7-4.5 2.7H7.3l.8-5c0-.3.3-.5.6-.5h.5c1.4 0 2.7 0 3.3.8.4.5.6 1.1.5 2z"/><text x="24" y="22" font-family="Verdana,Arial" font-weight="bold" font-style="italic" font-size="17" fill="#003087">Pay</text><text x="56" y="22" font-family="Verdana,Arial" font-weight="bold" font-style="italic" font-size="17" fill="#009cde">Pal</text></svg>',
    usdt: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#26A17B"/><path fill="#fff" d="M17.9 17.4v0c-.1 0-.7.1-2 .1-1 0-1.8 0-2-.1v0c-3.9-.2-6.8-.9-6.8-1.7s2.9-1.5 6.8-1.7v2.7c.3 0 1 .1 2 .1 1.2 0 1.8-.1 2-.1V14c3.9.2 6.8.9 6.8 1.7s-2.9 1.5-6.8 1.7zm0-3.6V11.4h5.4V7.8H8.6v3.6H14v2.4c-4.4.2-7.7 1.1-7.7 2.1s3.3 1.9 7.7 2.1v7.6h3.9V18c4.4-.2 7.7-1.1 7.7-2.1s-3.3-1.9-7.7-2.1z"/></svg>',
  };

  // ---------- Helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dateTime = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const qs = (k) => new URLSearchParams(location.search).get(k);
  const initials = (n) => String(n || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  async function api(url, opts = {}) {
    const o = { credentials: 'same-origin', headers: {}, ...opts };
    if (o.body && !(o.body instanceof FormData)) {
      o.headers['Content-Type'] = 'application/json';
      o.body = JSON.stringify(o.body);
    }
    if (o.method && o.method !== 'GET' && !o.body) {
      o.headers['Content-Type'] = 'application/json';
      o.body = '{}';
    }
    const res = await fetch(url, o);
    let data = {};
    try {
      data = await res.json();
    } catch {}
    if (!res.ok) {
      const err = new Error(data.message || 'Something went wrong');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function stars(r, size) {
    let h = '<span class="stars"' + (size ? ` style="--s:${size}px"` : '') + '>';
    for (let i = 1; i <= 5; i++) h += `<span class="${r >= i - 0.25 ? '' : 'off'}">${I.star}</span>`;
    return h + '</span>';
  }

  function avatar(user, cls = 'avatar') {
    if (user?.avatar) return `<img class="${cls}" src="${esc(user.avatar)}" alt="${esc(user.shopName || user.name)}">`;
    return `<div class="${cls} avatar-fallback">${esc(initials(user?.shopName || user?.name))}</div>`;
  }

  function productCard(p) {
    const off = p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
    const s = p.seller || {};
    return `
      <article class="product-card reveal">
        <a href="/product?id=${p._id}" class="media">
          ${off ? `<span class="tag">-${off}%</span>` : p.featured ? '<span class="tag">BESTSELLER</span>' : ''}
          <img src="${esc(p.images?.[0])}" alt="${esc(p.title)}" loading="lazy">
          <div class="quick"><button class="btn btn-gold btn-block btn-sm" data-add="${p._id}">${I.bag} Add to bag</button></div>
        </a>
        <div class="body">
          <span class="cat">${esc(p.category?.name || '')}</span>
          <h3><a href="/product?id=${p._id}">${esc(p.title)}</a></h3>
          <div class="rating-line">${stars(p.rating)} <span>${p.rating ? p.rating.toFixed(1) : '—'} (${p.numReviews || 0})</span></div>
          <div class="seller-line">${I.store.replace('<svg', '<svg width="14" height="14"')}<a href="/seller?id=${s._id}">${esc(s.shopName || s.name || 'Seller')}</a></div>
          <div class="price-row"><span class="price">${money(p.price)}</span>${off ? `<span class="compare">${money(p.comparePrice)}</span>` : ''}</div>
        </div>
      </article>`;
  }

  // ---------- Toast & modal ----------
  function toast(msg, type = '') {
    let wrap = $('.toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toasts';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'all .4s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(40px)';
      setTimeout(() => t.remove(), 400);
    }, 3400);
  }

  function modal(title, html, { wide = false, onOpen } = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}"><div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close>${I.x}</button></div><div class="modal-body">${html}</div></div>`;
    const close = () => bg.remove();
    bg.addEventListener('click', (e) => {
      if (e.target === bg || e.target.closest('[data-close]')) close();
    });
    document.body.appendChild(bg);
    onOpen && onOpen(bg.querySelector('.modal'), close);
    return close;
  }

  // ---------- Cart (localStorage) ----------
  const CART_KEY = 'tof_cart';
  const cart = {
    get: () => {
      try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
      } catch {
        return [];
      }
    },
    save(items) {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      updateCartCount();
    },
    add(p, qty = 1, size = '') {
      const items = cart.get();
      const found = items.find((i) => i.id === p._id && i.size === size);
      if (found) found.qty = Math.min(20, found.qty + qty);
      else items.push({ id: p._id, title: p.title, price: p.price, image: p.images?.[0], seller: p.seller?.shopName || p.seller?.name || '', size, qty });
      cart.save(items);
      toast(`Added "${p.title}" to your bag`, 'success');
    },
    count: () => cart.get().reduce((a, i) => a + i.qty, 0),
    clear: () => cart.save([]),
  };
  function updateCartCount() {
    const el = $('#cart-count');
    if (el) {
      const n = cart.count();
      el.textContent = n;
      el.classList.toggle('hidden', !n);
    }
  }

  // Delegate "Add to bag" buttons on product cards
  const productCache = new Map();
  function cacheProducts(list) {
    list.forEach((p) => productCache.set(p._id, p));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault();
    const p = productCache.get(b.dataset.add);
    if (p) {
      if (p.sizes?.length) location.href = '/product?id=' + p._id;
      else cart.add(p);
    }
  });

  // ---------- Layout: header & footer ----------
  let categories = [];
  async function loadCategories() {
    if (categories.length) return categories;
    try {
      categories = await api('/api/categories');
    } catch (err) {
      categories = [];
      if (err.status === 503 && !$('#config-error')) {
        document.body.insertAdjacentHTML('afterbegin', `<div id="config-error" class="alert error" style="margin:0;border-radius:0;text-align:center">⚠ ${esc(err.message)}</div>`);
      }
    }
    return categories;
  }

  async function renderLayout() {
    const header = document.createElement('div');
    const activeCat = qs('category');
    header.innerHTML = `
      <div class="announce">Free worldwide shipping on orders over $150 · Become a seller today</div>
      <header class="site-header">
        <div class="container header-row">
          <a href="/" class="logo" aria-label="THE OUT FIT home">THE <span>OUT</span> FIT</a>
          <form class="search" action="/shop" role="search">
            ${I.search}
            <input class="input" type="search" name="q" id="global-search" placeholder="Search dresses, sneakers, watches…" value="${esc(qs('q') || '')}">
          </form>
          <div class="header-actions">
            <a href="/shop" class="btn btn-sm btn-dark"><span class="btn-text">Shop all</span>${I.grid.replace('<svg', '<svg class="m-only"')}</a>
            <a href="/login" class="btn btn-sm" id="account-btn">${I.user}<span class="btn-text">Seller login</span></a>
            <a href="/cart" class="icon-btn" id="cart-btn" aria-label="Shopping bag">${I.bag}<span class="badge-count hidden" id="cart-count">0</span></a>
          </div>
        </div>
        <nav class="cat-nav" aria-label="Categories"><div class="container"><ul id="cat-nav-list">
          <li><a href="/shop" class="${location.pathname.startsWith('/shop') && !activeCat ? 'active' : ''}">All</a></li>
        </ul></div></nav>
      </header>`;
    document.body.prepend(...header.children);

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="/" class="logo">THE <span>OUT</span> FIT</a>
            <p class="muted mt-2" style="max-width:320px">A curated fashion marketplace connecting independent sellers with style lovers worldwide.</p>
            <div class="pay-icons"><span>PAYPAL</span><span>USDT · TRC20</span></div>
          </div>
          <div><h4>Shop</h4><ul id="footer-cats"></ul></div>
          <div><h4>Sellers</h4><ul>
            <li><a href="/signup">Become a seller</a></li>
            <li><a href="/login">Seller login</a></li>
            <li><a href="/dashboard">Seller dashboard</a></li>
          </ul></div>
          <div><h4>Help</h4><ul>
            <li><a href="/shop">All products</a></li>
            <li><a href="/cart">Shopping bag</a></li>
            <li><a href="mailto:support@theoutfit.com">support@theoutfit.com</a></li>
          </ul></div>
        </div>
        <div class="footer-bottom"><span>© ${new Date().getFullYear()} THE OUT FIT. All rights reserved.</span><span>Secure payments · PayPal · USDT</span></div>
      </div>`;
    document.body.appendChild(footer);

    updateCartCount();

    // Account state
    api('/api/auth/me')
      .then(({ user }) => {
        const b = $('#account-btn');
        b.href = '/dashboard';
        b.innerHTML = `${I.user}<span class="btn-text">${esc(user.shopName || user.name)}</span>`;
      })
      .catch(() => {});

    const cats = await loadCategories();
    $('#cat-nav-list').insertAdjacentHTML(
      'beforeend',
      cats.map((c) => `<li><a href="/shop?category=${c.slug}" class="${activeCat === c.slug ? 'active' : ''}">${esc(c.name)}</a></li>`).join('')
    );
    $('#footer-cats').innerHTML = cats.slice(0, 6).map((c) => `<li><a href="/shop?category=${c.slug}">${esc(c.name)}</a></li>`).join('');
  }

  // Reveal-on-scroll
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.08 })
    : null;
  function reveal(root = document) {
    $$('.reveal:not(.in)', root).forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
  }

  // Resize/compress a photo in the browser before upload (keeps requests small for serverless hosting)
  function compressImage(file, max = 1400, quality = 0.82) {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif') return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => resolve(b ? new File([b], 'photo.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  return { I, $, $$, esc, money, date, dateTime, qs, initials, api, stars, avatar, productCard, toast, modal, cart, cacheProducts, loadCategories, renderLayout, reveal, compressImage };
})();
