/* Admin panel */
(() => {
  const { I, $, $$, esc, money, date, dateTime, api, avatar, toast, modal } = TOF;
  $$('[data-i]').forEach((el) => (el.innerHTML = I[el.dataset.i] || ''));
  const main = $('#admin-main');

  const PILL = { pending: 'warning', approved: 'success', rejected: 'danger', active: 'success', blocked: 'danger', hidden: 'neutral', paid: 'success', shipped: 'info', delivered: 'success', cancelled: 'danger' };
  const pill = (s) => `<span class="pill ${PILL[s] || 'neutral'}">${esc(s)}</span>`;
  const TX = { deposit: 'Deposit', withdraw: 'Withdrawal', admin_credit: 'Admin deposit', admin_debit: 'Admin debit', sale: 'Sale' };
  const txDetails = (t) => {
    const d = t.details || {};
    if (t.method === 'card') return `${esc(d.cardBrand || 'Card')} •••• ${esc(d.cardLast4 || '')}<div class="hint">${esc(d.cardName || '')}</div>`;
    if (t.method === 'paypal') return `PayPal<div class="hint">${esc(d.paypalEmail || '')}</div>`;
    if (t.method === 'usdt') return `USDT ${esc(d.network || '')}<div class="hint" style="word-break:break-all;max-width:260px">${t.type === 'withdraw' ? 'To: ' + esc(d.address || '') : 'TX: ' + esc(d.txHash || '')}</div>`;
    if (t.method === 'order') return 'Order ' + esc(d.orderId || '');
    return esc(t.note || 'Admin');
  };

  // ---------- Auth ----------
  async function boot() {
    try {
      await api('/api/admin/stats');
      showPanel();
    } catch {
      $('#login-view').classList.remove('hidden');
    }
  }
  $('#admin-login-form').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/api/auth/admin/login', { method: 'POST', body: { username: $('#a-user').value, password: $('#a-pass').value } });
      $('#login-view').classList.add('hidden');
      showPanel();
    } catch (err) {
      $('#login-msg').innerHTML = `<div class="alert error">${esc(err.message)}</div>`;
    }
  };
  $('#admin-logout').onclick = async () => {
    await api('/api/auth/admin/logout', { method: 'POST' });
    location.reload();
  };
  function showPanel() {
    $('#panel-view').classList.remove('hidden');
    go(tabs[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard');
  }
  async function refreshCounts() {
    const s = await api('/api/admin/stats');
    const set = (id, n) => { $(id).textContent = n; $(id).classList.toggle('hidden', !n); };
    set('#cnt-tx', s.pendingTx);
    set('#cnt-rep', s.openReports);
    return s;
  }

  // ---------- Shared actions ----------
  const actions = {
    credit(id, name) {
      modal('Deposit money for seller', `
        <form id="credit-form">
          <p class="text-2">Add funds to <strong style="color:var(--text)">${esc(name)}</strong>'s balance.</p>
          <div class="field"><label for="cr-amount">Amount (USD)</label><input class="input" type="number" step="0.01" min="0.01" id="cr-amount" required></div>
          <div class="field"><label for="cr-note">Note</label><input class="input" id="cr-note" placeholder="e.g. Bonus, refund, manual deposit"></div>
          <div class="flex"><button class="btn btn-success grow" id="cr-submit">${I.down} Deposit</button><button type="button" class="btn btn-danger" id="cr-debit">Debit instead</button></div>
        </form>`, { onOpen: (m, close) => {
          const send = async (kind) => {
            try {
              const r = await api(`/api/admin/sellers/${id}/${kind}`, { method: 'POST', body: { amount: m.querySelector('#cr-amount').value, note: m.querySelector('#cr-note').value } });
              toast(`${kind === 'credit' ? 'Deposited' : 'Debited'}. New balance ${money(r.balance)}`, 'success');
              close(); reload();
            } catch (e) { toast(e.message, 'error'); }
          };
          m.querySelector('#credit-form').onsubmit = (e) => { e.preventDefault(); send('credit'); };
          m.querySelector('#cr-debit').onclick = () => m.querySelector('#cr-amount').reportValidity() && send('debit');
        }});
    },
    async block(id, blocked) {
      if (!confirm(blocked ? 'Unblock this seller?' : 'Block this seller? They will not be able to log in and their listings will be hidden.')) return;
      try { await api(`/api/admin/sellers/${id}/${blocked ? 'unblock' : 'block'}`, { method: 'POST' }); toast(blocked ? 'Seller unblocked' : 'Seller blocked', 'success'); reload(); }
      catch (e) { toast(e.message, 'error'); }
    },
    report(id, name) {
      modal('Report / warn seller', `
        <form id="rep-form">
          <p class="text-2">The warning is recorded on <strong style="color:var(--text)">${esc(name)}</strong>'s account and shown in their dashboard.</p>
          <div class="field"><label for="rep-reason">Reason</label><textarea class="input" id="rep-reason" required minlength="3" placeholder="e.g. Late shipping, policy violation…"></textarea></div>
          <button class="btn btn-warning btn-block" id="rep-submit">${I.flag} Submit report</button>
        </form>`, { onOpen: (m, close) => {
          m.querySelector('#rep-form').onsubmit = async (e) => {
            e.preventDefault();
            try { await api(`/api/admin/sellers/${id}/report`, { method: 'POST', body: { reason: m.querySelector('#rep-reason').value } }); toast('Seller reported', 'success'); close(); reload(); }
            catch (err) { toast(err.message, 'error'); }
          };
        }});
    },
    async del(id) {
      if (!confirm('Delete this seller and ALL their listings permanently?')) return;
      try { await api('/api/admin/sellers/' + id, { method: 'DELETE' }); toast('Seller deleted', 'success'); reload(); } catch (e) { toast(e.message, 'error'); }
    },
    async view(id) {
      const { seller: s, products, transactions } = await api('/api/admin/sellers/' + id);
      modal(esc(s.shopName || s.name), `
        <div class="flex" style="gap:18px;align-items:center">${avatar(s)}<div>
          <strong>${esc(s.name)}</strong> ${pill(s.status)} ${s.flagged ? '<span class="pill warning">flagged</span>' : ''}
          <div class="hint">${esc(s.email)} · ${esc(s.phone || '—')} · ${esc(s.country || '—')}</div>
          <div class="hint">Joined ${date(s.createdAt)} · Last login ${s.lastLogin ? dateTime(s.lastLogin) : '—'}</div></div></div>
        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin:20px 0">
          <div class="stat highlight"><span>Balance</span><strong>${money(s.balance)}</strong></div>
          <div class="stat"><span>Listings</span><strong>${products.length}</strong></div>
          <div class="stat"><span>Reports</span><strong>${s.reports.length}</strong></div></div>
        <h4>Payment information</h4>
        <div class="table-wrap"><table><tbody>
          <tr><td class="muted">PayPal</td><td>${esc(s.payout?.paypalEmail || '—')}</td></tr>
          <tr><td class="muted">USDT</td><td>${esc(s.payout?.usdtNetwork || '')} <span style="word-break:break-all">${esc(s.payout?.usdtAddress || '—')}</span></td></tr></tbody></table></div>
        <div class="flex wrap mt-2">
          <button class="btn btn-success btn-sm" data-act="credit">Deposit</button>
          <button class="btn btn-sm ${s.status === 'blocked' ? 'btn-success' : 'btn-danger'}" data-act="block">${s.status === 'blocked' ? 'Unblock' : 'Block'}</button>
          <button class="btn btn-warning btn-sm" data-act="report">Report</button>
          <a class="btn btn-sm" href="/seller.html?id=${s._id}" target="_blank">Open shop</a></div>
        <h4 class="mt-3">Reports</h4>
        ${s.reports.length ? `<div class="table-wrap"><table><tbody>${s.reports.map((r) => `<tr><td>${date(r.createdAt)}</td><td>${r.byAdmin ? '<span class="pill">admin</span>' : esc(r.reporterName)}</td><td>${esc(r.reason)}</td><td>${r.resolved ? pill('resolved') : `<button class="btn btn-sm" data-resolve="${r._id}">Resolve</button>`}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No reports</p>'}
        <h4 class="mt-3">Listings</h4>
        <div class="table-wrap"><table><tbody>${products.map((p) => `<tr><td><div class="td-product"><img src="${esc(p.images[0])}"><span>${esc(p.title)}</span></div></td><td>${money(p.price)}</td><td>${pill(p.status)}</td></tr>`).join('') || '<tr><td class="muted">No listings</td></tr>'}</tbody></table></div>
        <h4 class="mt-3">Transactions</h4>
        <div class="table-wrap"><table><tbody>${transactions.map((t) => `<tr><td>${dateTime(t.createdAt)}</td><td>${TX[t.type]}</td><td>${txDetails(t)}</td><td>${money(t.amount)}</td><td>${pill(t.status)}</td></tr>`).join('') || '<tr><td class="muted">No transactions</td></tr>'}</tbody></table></div>
      `, { wide: true, onOpen: (m, close) => {
        m.querySelector('[data-act=credit]').onclick = () => { close(); actions.credit(s._id, s.shopName || s.name); };
        m.querySelector('[data-act=block]').onclick = () => { close(); actions.block(s._id, s.status === 'blocked'); };
        m.querySelector('[data-act=report]').onclick = () => { close(); actions.report(s._id, s.shopName || s.name); };
        m.querySelectorAll('[data-resolve]').forEach((b) => (b.onclick = async () => {
          await api(`/api/admin/sellers/${s._id}/reports/${b.dataset.resolve}/resolve`, { method: 'POST' });
          toast('Report resolved', 'success'); close(); actions.view(s._id); refreshCounts();
        }));
      }});
    },
  };

  // ---------- Tabs ----------
  let current = 'dashboard';
  const reload = () => go(current);

  const sellerRows = (list) => list.map((s) => `<tr>
      <td><strong>${esc(s.shopName || s.name)}</strong><div class="hint">${esc(s.name)} · ${esc(s.email)}</div></td>
      <td>${money(s.balance)}</td><td>${s.products}</td>
      <td>${s.openReports ? `<span class="pill danger">${s.openReports}</span>` : '0'}</td>
      <td>${pill(s.status)} ${s.flagged ? '<span class="pill warning">flagged</span>' : ''}</td>
      <td>${date(s.createdAt)}</td>
      <td><div class="actions">
        <button class="btn btn-sm" data-a="view" data-id="${s._id}">View</button>
        <button class="btn btn-sm btn-success" data-a="credit" data-id="${s._id}" data-name="${esc(s.shopName || s.name)}">Deposit</button>
        <button class="btn btn-sm ${s.status === 'blocked' ? 'btn-success' : 'btn-danger'}" data-a="block" data-id="${s._id}" data-blocked="${s.status === 'blocked'}">${s.status === 'blocked' ? 'Unblock' : 'Block'}</button>
        <button class="btn btn-sm btn-warning" data-a="report" data-id="${s._id}" data-name="${esc(s.shopName || s.name)}">Report</button>
        <button class="btn btn-sm btn-danger" data-a="del" data-id="${s._id}" title="Delete">${I.x.replace('<svg', '<svg width="14"')}</button>
      </div></td></tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">No sellers found</td></tr>';
  const sellerTable = (list) => `<div class="table-wrap"><table><thead><tr><th>Seller</th><th>Balance</th><th>Listings</th><th>Reports</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>${sellerRows(list)}</tbody></table></div>`;
  function bindSellerActions() {
    $$('[data-a]', main).forEach((b) => (b.onclick = () => {
      const { a, id, name, blocked } = b.dataset;
      if (a === 'view') actions.view(id);
      if (a === 'credit') actions.credit(id, name);
      if (a === 'block') actions.block(id, blocked === 'true');
      if (a === 'report') actions.report(id, name);
      if (a === 'del') actions.del(id);
    }));
  }

  const txRows = (txs) => txs.map((t) => `<tr>
      <td>${dateTime(t.createdAt)}</td>
      <td><strong>${esc(t.user?.shopName || t.user?.name || '—')}</strong><div class="hint">${esc(t.user?.email || '')}</div></td>
      <td>${TX[t.type] || t.type}</td><td>${txDetails(t)}</td><td><strong>${money(t.amount)}</strong></td><td>${pill(t.status)}</td>
      <td>${t.status === 'pending' ? `<div class="actions"><button class="btn btn-sm btn-success" data-approve="${t._id}">Approve</button><button class="btn btn-sm btn-danger" data-reject="${t._id}">Reject</button></div>` : `<span class="hint">${t.reviewedAt ? dateTime(t.reviewedAt) : ''}</span>`}</td>
    </tr>`).join('') || '<tr><td colspan="7" class="center muted" style="padding:30px">No transactions</td></tr>';
  function bindTx() {
    $$('[data-approve]', main).forEach((b) => (b.onclick = async () => {
      try { await api(`/api/admin/transactions/${b.dataset.approve}/approve`, { method: 'POST' }); toast('Approved', 'success'); reload(); } catch (e) { toast(e.message, 'error'); }
    }));
    $$('[data-reject]', main).forEach((b) => (b.onclick = async () => {
      if (!confirm('Reject this transaction? Withdrawals will be refunded to the seller balance.')) return;
      try { await api(`/api/admin/transactions/${b.dataset.reject}/reject`, { method: 'POST' }); toast('Rejected', 'success'); reload(); } catch (e) { toast(e.message, 'error'); }
    }));
  }

  const tabs = {
    async dashboard() {
      const s = await refreshCounts();
      const [pending, sellers] = await Promise.all([api('/api/admin/transactions?status=pending'), api('/api/admin/sellers')]);
      main.innerHTML = `
        <h1>Dashboard</h1><p class="text-2">Overview of THE OUT FIT marketplace.</p>
        <div class="stat-grid">
          <div class="stat highlight"><span>Seller balances</span><strong>${money(s.totalBalances)}</strong></div>
          <div class="stat"><span>Sellers</span><strong>${s.sellers}</strong><span class="hint">${s.blocked} blocked</span></div>
          <div class="stat"><span>Listings</span><strong>${s.products}</strong><span class="hint">${s.catalog} in catalog</span></div>
          <div class="stat"><span>Orders</span><strong>${s.orders}</strong><span class="hint">${money(s.revenue)} paid</span></div>
        </div>
        <div class="flex between"><h3>Pending transactions (${pending.length})</h3><button class="btn btn-sm" id="see-tx">View all</button></div>
        <div class="table-wrap mb-2"><table><thead><tr><th>Date</th><th>Seller</th><th>Type</th><th>Details</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${txRows(pending.slice(0, 8))}</tbody></table></div>
        <div class="flex between mt-3"><h3>Recent sellers</h3><button class="btn btn-sm" id="see-sellers">Manage sellers</button></div>
        ${sellerTable(sellers.slice(0, 6))}`;
      bindTx(); bindSellerActions();
      $('#see-tx').onclick = () => go('transactions');
      $('#see-sellers').onclick = () => go('sellers');
    },

    async sellers(q = '', status = '') {
      const list = await api(`/api/admin/sellers?q=${encodeURIComponent(q)}&status=${status}`);
      main.innerHTML = `
        <h1>Seller accounts</h1><p class="text-2">Check, deposit, block and report sellers.</p>
        <form class="search-row" id="s-search"><input class="input" id="s-q" placeholder="Search name, email, shop…" value="${esc(q)}">
          <select class="input" id="s-status" style="max-width:180px"><option value="">All statuses</option><option value="active" ${status === 'active' ? 'selected' : ''}>Active</option><option value="blocked" ${status === 'blocked' ? 'selected' : ''}>Blocked</option></select>
          <button class="btn">Search</button></form>
        ${sellerTable(list)}`;
      bindSellerActions();
      $('#s-search').onsubmit = (e) => { e.preventDefault(); tabs.sellers($('#s-q').value, $('#s-status').value); };
      $('#s-status').onchange = () => tabs.sellers($('#s-q').value, $('#s-status').value);
    },

    async transactions(status = 'pending') {
      await refreshCounts();
      const txs = await api('/api/admin/transactions' + (status ? '?status=' + status : ''));
      main.innerHTML = `
        <h1>Transactions</h1><p class="text-2">Approve deposits to credit seller balances. Approve withdrawals after you've sent the payout; rejecting refunds the seller.</p>
        <div class="tabs">${['pending', 'approved', 'rejected', ''].map((s) => `<button class="tab ${s === status ? 'active' : ''}" data-st="${s}">${s || 'All'}</button>`).join('')}</div>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Seller</th><th>Type</th><th>Details</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${txRows(txs)}</tbody></table></div>`;
      bindTx();
      $$('[data-st]', main).forEach((b) => (b.onclick = () => tabs.transactions(b.dataset.st)));
    },

    async reports() {
      await refreshCounts();
      const reps = await api('/api/admin/reports');
      main.innerHTML = `
        <h1>Reports</h1><p class="text-2">Reports submitted by customers and admin warnings.</p>
        <div class="table-wrap"><table><thead><tr><th>Date</th><th>Seller</th><th>From</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${reps.map((r) => `<tr><td>${date(r.createdAt)}</td><td><strong>${esc(r.seller.shopName || r.seller.name)}</strong><div class="hint">${esc(r.seller.email)}</div></td>
          <td>${r.byAdmin ? '<span class="pill">Admin</span>' : esc(r.reporterName) + (r.reporterEmail ? `<div class="hint">${esc(r.reporterEmail)}</div>` : '')}</td>
          <td style="max-width:360px">${esc(r.reason)}</td><td>${r.resolved ? pill('resolved') : '<span class="pill danger">open</span>'}</td>
          <td><div class="actions">${r.resolved ? '' : `<button class="btn btn-sm btn-success" data-res="${r._id}" data-sid="${r.seller._id}">Resolve</button>`}
            <button class="btn btn-sm" data-a="view" data-id="${r.seller._id}">Seller</button>
            <button class="btn btn-sm ${r.seller.status === 'blocked' ? 'btn-success' : 'btn-danger'}" data-a="block" data-id="${r.seller._id}" data-blocked="${r.seller.status === 'blocked'}">${r.seller.status === 'blocked' ? 'Unblock' : 'Block'}</button></div></td></tr>`).join('') ||
          '<tr><td colspan="6" class="center muted" style="padding:30px">No reports 🎉</td></tr>'}
        </tbody></table></div>`;
      bindSellerActions();
      $$('[data-res]', main).forEach((b) => (b.onclick = async () => {
        await api(`/api/admin/sellers/${b.dataset.sid}/reports/${b.dataset.res}/resolve`, { method: 'POST' });
        toast('Resolved', 'success'); reload();
      }));
    },

    async products(q = '') {
      const items = await api('/api/admin/products?q=' + encodeURIComponent(q));
      main.innerHTML = `
        <h1>Product listings</h1><p class="text-2">All seller listings. Hide, feature or delete products.</p>
        <form class="search-row" id="p-search"><input class="input" id="p-q" placeholder="Search products…" value="${esc(q)}"><button class="btn">Search</button></form>
        <div class="table-wrap"><table><thead><tr><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${items.map((p) => `<tr>
          <td><div class="td-product"><img src="${esc(p.images[0])}"><div><a href="/product.html?id=${p._id}" target="_blank">${esc(p.title)}</a>${p.featured ? ' <span class="pill">★ featured</span>' : ''}</div></div></td>
          <td>${esc(p.seller?.shopName || p.seller?.name || '—')} ${p.seller?.status === 'blocked' ? pill('blocked') : ''}</td>
          <td>${esc(p.category?.name || '')}</td><td>${money(p.price)}</td><td>${p.rating ? p.rating.toFixed(1) + ' ★' : '—'}</td><td>${pill(p.status)}</td>
          <td><div class="actions">
            <button class="btn btn-sm" data-feat="${p._id}" data-v="${!p.featured}">${p.featured ? 'Unfeature' : 'Feature'}</button>
            <button class="btn btn-sm" data-vis="${p._id}" data-v="${p.status === 'active' ? 'hidden' : 'active'}">${p.status === 'active' ? 'Hide' : 'Show'}</button>
            <button class="btn btn-sm btn-danger" data-pdel="${p._id}">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="center muted">No products</td></tr>'}
        </tbody></table></div>`;
      $('#p-search').onsubmit = (e) => { e.preventDefault(); tabs.products($('#p-q').value); };
      const upd = async (id, body) => { try { await api('/api/admin/products/' + id, { method: 'PUT', body }); tabs.products(q); } catch (e) { toast(e.message, 'error'); } };
      $$('[data-feat]', main).forEach((b) => (b.onclick = () => upd(b.dataset.feat, { featured: b.dataset.v === 'true' })));
      $$('[data-vis]', main).forEach((b) => (b.onclick = () => upd(b.dataset.vis, { status: b.dataset.v })));
      $$('[data-pdel]', main).forEach((b) => (b.onclick = async () => {
        if (!confirm('Delete this listing?')) return;
        await api('/api/admin/products/' + b.dataset.pdel, { method: 'DELETE' }); toast('Deleted', 'success'); tabs.products(q);
      }));
    },

    async catalog() {
      const [items, cats] = await Promise.all([api('/api/admin/products?catalog=1'), api('/api/admin/categories')]);
      main.innerHTML = `
        <div class="flex between wrap"><div><h1>Supplier catalog</h1><p class="text-2">Products sellers can pick with the "Choose products" button.</p></div><button class="btn btn-gold" id="cat-add">${I.plus} Add catalog product</button></div>
        <div class="table-wrap mt-2"><table><thead><tr><th>Product</th><th>Category</th><th>Supplier cost</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        ${items.map((p) => `<tr><td><div class="td-product"><img src="${esc(p.images[0])}"><span>${esc(p.title)}</span></div></td><td>${esc(p.category?.name || '')}</td>
          <td>${money(p.price)}</td><td>${p.stock}</td><td>${pill(p.status)}</td>
          <td><div class="actions"><button class="btn btn-sm" data-vis="${p._id}" data-v="${p.status === 'active' ? 'hidden' : 'active'}">${p.status === 'active' ? 'Hide' : 'Show'}</button><button class="btn btn-sm btn-danger" data-pdel="${p._id}">Delete</button></div></td></tr>`).join('')}
        </tbody></table></div>`;
      $$('[data-vis]', main).forEach((b) => (b.onclick = async () => { await api('/api/admin/products/' + b.dataset.vis, { method: 'PUT', body: { status: b.dataset.v } }); tabs.catalog(); }));
      $$('[data-pdel]', main).forEach((b) => (b.onclick = async () => { if (confirm('Delete catalog product?')) { await api('/api/admin/products/' + b.dataset.pdel, { method: 'DELETE' }); tabs.catalog(); } }));
      $('#cat-add').onclick = () => modal('Add catalog product', `
        <form id="catalog-form">
          <div class="field"><label>Title</label><input class="input" name="title" required></div>
          <div class="grid-2"><div class="field"><label>Category</label><select class="input" name="category">${cats.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Supplier cost (USD)</label><input class="input" type="number" step="0.01" min="0.01" name="price" required></div></div>
          <div class="grid-2"><div class="field"><label>Sizes</label><input class="input" name="sizes" placeholder="S, M, L"></div><div class="field"><label>Colors</label><input class="input" name="colors"></div></div>
          <div class="field"><label>Description</label><textarea class="input" name="description"></textarea></div>
          <div class="field"><label>Photos</label><input class="input" type="file" name="images" accept="image/*" multiple required></div>
          <button class="btn btn-gold btn-block">Add to catalog</button>
        </form>`, { onOpen: (m, close) => {
          m.querySelector('#catalog-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
              const fd = new FormData(e.target);
              fd.delete('images');
              for (const f of e.target.images.files) fd.append('images', await TOF.compressImage(f));
              await api('/api/admin/catalog', { method: 'POST', body: fd }); toast('Catalog product added', 'success'); close(); tabs.catalog();
            }
            catch (err) { toast(err.message, 'error'); }
          };
        }});
    },

    async orders() {
      const orders = await api('/api/admin/orders');
      main.innerHTML = `
        <h1>Orders</h1><p class="text-2">Mark an order as <strong>paid</strong> once payment is verified — each seller's balance is credited automatically.</p>
        <div class="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>
        ${orders.map((o) => `<tr><td><strong>${esc(o.orderNumber)}</strong></td><td>${dateTime(o.createdAt)}</td>
          <td>${esc(o.buyer.name)}<div class="hint">${esc(o.buyer.email)}<br>${esc([o.buyer.address, o.buyer.city, o.buyer.country].filter(Boolean).join(', '))}</div></td>
          <td>${o.items.map((i) => `${esc(i.title)} ×${i.qty}<div class="hint">${esc(i.seller?.shopName || '')}</div>`).join('')}</td>
          <td>${esc(o.paymentMethod.toUpperCase())}<div class="hint" style="max-width:200px;word-break:break-all">${esc(o.paymentRef || '')}</div></td>
          <td><strong>${money(o.total)}</strong></td>
          <td><select class="input" data-ord="${o._id}" style="min-width:130px;padding:8px 36px 8px 12px">${['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') ||
          '<tr><td colspan="7" class="center muted" style="padding:30px">No orders yet</td></tr>'}
        </tbody></table></div>`;
      $$('[data-ord]', main).forEach((s) => (s.onchange = async () => {
        try { await api(`/api/admin/orders/${s.dataset.ord}/status`, { method: 'POST', body: { status: s.value } }); toast('Order updated', 'success'); }
        catch (e) { toast(e.message, 'error'); }
      }));
    },
  };

  async function go(tab) {
    current = tab;
    $$('#admin-nav [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    history.replaceState(null, '', '#' + tab);
    try { await tabs[tab](); } catch (e) {
      if (e.status === 401) location.reload();
      else main.innerHTML = `<div class="alert error">${esc(e.message)}</div>`;
    }
  }
  $$('#admin-nav [data-tab]').forEach((b) => (b.onclick = () => go(b.dataset.tab)));
  boot();
})();
