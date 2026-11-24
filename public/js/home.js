(async () => {
  const { I, $, $$, esc, api, productCard, cacheProducts, renderLayout, reveal, avatar, stars, toast, loadCategories } = TOF;
  await renderLayout();
  $$('[data-i]').forEach((el) => (el.innerHTML = I[el.dataset.i] || ''));

  // Categories
  const cats = await loadCategories();
  $('#cat-grid').innerHTML = cats
    .map(
      (c) => `
      <a class="cat-tile reveal" href="/shop.html?category=${c.slug}">
        <img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">
        <span class="go">${I.arrow.replace('<svg', '<svg width="18"')}</span>
        <div class="info"><h3>${esc(c.name)}</h3><span>${c.count} products · ${esc(c.description)}</span></div>
      </a>`
    )
    .join('');

  // Featured + stats
  const [featured, all, sellers] = await Promise.all([
    api('/api/products?featured=1&limit=8'),
    api('/api/products?limit=60'),
    api('/api/sellers?limit=8'),
  ]);
  cacheProducts(featured.items);
  cacheProducts(all.items);
  $('#featured-grid').innerHTML = featured.items.map(productCard).join('') || '<p class="muted">No products yet.</p>';
  $('#stat-products').textContent = all.total + '+';
  $('#stat-sellers').textContent = sellers.length;

  // A row per category with its listings
  const byCat = {};
  all.items.forEach((p) => {
    const slug = p.category?.slug;
    if (slug) (byCat[slug] = byCat[slug] || []).push(p);
  });
  $('#category-rows').innerHTML = cats
    .filter((c) => byCat[c.slug]?.length)
    .map(
      (c) => `
      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="section-head">
            <div><span class="eyebrow">${esc(c.description)}</span><h2>${esc(c.name)}</h2></div>
            <a href="/shop.html?category=${c.slug}" class="link-arrow">Shop ${esc(c.name)} ${I.arrow.replace('<svg', '<svg width="16"')}</a>
          </div>
          <div class="product-grid">${byCat[c.slug].slice(0, 4).map(productCard).join('')}</div>
        </div>
      </section>`
    )
    .join('');

  // Sellers
  $('#seller-grid').innerHTML = sellers
    .map(
      (s) => `
      <a class="seller-card reveal" href="/seller.html?id=${s._id}">
        ${avatar(s)}
        <h3>${esc(s.shopName || s.name)}</h3>
        <div class="rating-line" style="justify-content:center">${stars(s.rating)} ${s.rating || '—'}</div>
        <div class="meta"><div><strong>${s.products}</strong>Products</div><div><strong>${s.sales}</strong>Sales</div></div>
      </a>`
    )
    .join('');

  reveal();

  $('#newsletter-form').addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Thanks for subscribing! Check your inbox for 10% off.', 'success');
    e.target.reset();
  });
})();
