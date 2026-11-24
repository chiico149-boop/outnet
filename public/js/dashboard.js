/* Seller dashboard */
(async () => {
  const { I, $, $$, esc, money, date, dateTime, api, avatar, toast, modal, renderLayout, qs } = TOF;
  await renderLayout();
  $$('[data-i]').forEach((el) => (el.innerHTML = I[el.dataset.i] || ''));

  let me;
  try {
    me = (await api('/api/auth/me')).user;
  } catch {
    location.href = '/login.html';
    return;
  }
  let categories = await TOF.loadCategories();
  const main = $('#dash-main');

  function renderWho() {
    $('#who').innerHTML = `${avatar(me)}<div><strong style="display:block;line-height:1.2">${esc(me.shopName || me.name)}</strong><span class="hint">${esc(me.email)}</span></div>`;
    $('#view-store').href = '/seller.html?id=' + me._id;
  }
  renderWho();

  const STATUS_PILL = { pending: 'warning', approved: 'success', rejected: 'danger', paid: 'success', shipped: 'info', delivered: 'success', cancelled: 'danger', active: 'success', hidden: 'neutral' };
  const pill = (s) => `<span class="pill ${STATUS_PILL[s] || 'neutral'}">${esc(s)}</span>`;
  const TX_LABEL = { deposit: 'Deposit', withdraw: 'Withdrawal', admin_credit: 'Admin deposit', admin_debit: 'Admin adjustment', sale: 'Sale' };
  const txDetails = (t) => {
    const d = t.details || {};
    if (t.method === 'card') return `${esc(d.cardBrand || 'Card')} •••• ${esc(d.cardLast4 || '')}`;
    if (t.method === 'paypal') return `PayPal · ${esc(d.paypalEmail || '')}`;
    if (t.method === 'usdt') return `USDT ${esc(d.network || '')} · <span title="${esc(d.address || d.txHash)}">${esc((d.txHash || d.address || '').slice(0, 14))}…</span>`;
    if (t.method === 'order') return 'Order ' + esc(d.orderId || '');
    return esc(t.note || 'Admin');
  };
  const isCredit = (t) => ['deposit', 'admin_credit', 'sale'].includes(t.type);
  const txTable = (txs) => `
    <div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Type</th><th>Method / details</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${txs.map((t) => `<tr>
        <td>${dateTime(t.createdAt)}</td><td>${TX_LABEL[t.type] || t.type}</td><td>${txDetails(t)}</td>
        <td style="color:${isCredit(t) ? 'var(--success)' : 'var(--danger)'};font-weight:600">${isCredit(t) ? '+' : '−'}${money(t.amount)}</td>
        <td>${pill(t.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted center">No transactions yet</td></tr>'}</tbody>
    </table></div>`;

  // ---------------- Tabs ----------------
  const tabs = {
    async overview() {
      const s = await api('/api/seller/stats');
      const warn = (me.warnings || []).map((w) => `<div class="alert warning">${I.flag.replace('<svg', '<svg width="14" style="vertical-align:-2px"')} <strong>Admin notice:</strong> ${esc(w.reason)}</div>`).join('');
      main.innerHTML = `
        ${qs('welcome') ? '<div class="alert success">🎉 Welcome to THE OUT FIT! Start by choosing products from our catalog or adding your own listing.</div>' : ''}
        ${warn}
        <div class="flex between wrap"><div><h1>Hello, ${esc(me.name.split(' ')[0])}</h1><p class="text-2 mb-0">Here's what's happening with your shop.</p></div>
          <div class="flex wrap"><button class="btn btn-gold" id="ov-add">${I.plus} Add listing</button><button class="btn" id="ov-choose">Choose products</button></div></div>
        <div class="stat-grid">
          <div class="stat highlight"><span>Balance</span><strong>${money(s.balance)}</strong></div>
          <div class="stat"><span>Active listings</span><strong>${s.active}/${s.listings}</strong></div>
          <div class="stat"><span>Total sales</span><strong>${s.sales}</strong></div>
          <div class="stat"><span>Reviews</span><strong>${s.reviews}</strong></div>
        </div>
        <div class="flex wrap" style="gap:12px;margin-bottom:30px">
          <button class="btn btn-success" id="ov-deposit">${I.down} Deposit</button>
          <button class="btn btn-warning" id="ov-withdraw">${I.up} Withdraw</button>
        </div>
        <h3>Recent orders</h3>
        ${ordersTable(s.orders.slice(0, 5))}`;
      $('#ov-add').onclick = () => listingForm();
      $('#ov-choose').onclick = () => go('catalog');
      $('#ov-deposit').onclick = () => go('wallet', 'deposit');
      $('#ov-withdraw').onclick = () => go('wallet', 'withdraw');
    },

    async listings() {
      const items = await api('/api/seller/products');
      main.innerHTML = `
        <div class="flex between wrap"><div><h1>My listings</h1><p class="text-2">Products listed here appear on the home page and in their category.</p></div>
          <div class="flex wrap"><button class="btn" id="ls-choose">Choose from catalog</button><button class="btn btn-gold" id="ls-add">${I.plus} Add listing</button></div></div>
        <div class="table-wrap mt-2"><table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${items.map((p) => `<tr>
            <td><div class="td-product"><img src="${esc(p.images[0])}" alt=""><div><a href="/product.html?id=${p._id}" target="_blank"><strong>${esc(p.title)}</strong></a>${p.sourceProduct ? '<div class="hint">From catalog</div>' : ''}</div></div></td>
            <td>${esc(p.category?.name || '')}</td><td>${money(p.price)}</td><td>${p.stock}</td>
            <td>${p.rating ? p.rating.toFixed(1) + ' ★ (' + p.numReviews + ')' : '—'}</td><td>${pill(p.status)}</td>
            <td><div class="actions"><button class="btn btn-sm" data-edit="${p._id}">Edit</button>
              <button class="btn btn-sm" data-toggle="${p._id}" data-status="${p.status}">${p.status === 'active' ? 'Hide' : 'Show'}</button>
              <button class="btn btn-sm btn-danger" data-del="${p._id}">Delete</button></div></td></tr>`).join('') ||
            '<tr><td colspan="7" class="center muted" style="padding:40px">No listings yet. Add your first product!</td></tr>'}</tbody>
        </table></div>`;
      $('#ls-add').onclick = () => listingForm();
      $('#ls-choose').onclick = () => go('catalog');
      $$('[data-edit]').forEach((b) => (b.onclick = () => listingForm(items.find((p) => p._id === b.dataset.edit))));
      $$('[data-toggle]').forEach((b) => (b.onclick = async () => {
        const fd = new FormData();
        fd.append('status', b.dataset.status === 'active' ? 'hidden' : 'active');
        try { await api('/api/seller/products/' + b.dataset.toggle, { method: 'PUT', body: fd }); tabs.listings(); } catch (e) { toast(e.message, 'error'); }
      }));
      $$('[data-del]').forEach((b) => (b.onclick = async () => {
        if (!confirm('Delete this listing permanently?')) return;
        try { await api('/api/seller/products/' + b.dataset.del, { method: 'DELETE' }); toast('Listing deleted', 'success'); tabs.listings(); } catch (e) { toast(e.message, 'error'); }
      }));
    },

    async catalog() {
      const items = await api('/api/seller/catalog');
      main.innerHTML = `
        <h1>Choose products</h1>
        <p class="text-2">Pick products from our supplier catalog, set your selling price and they'll be listed in your shop instantly. We handle sourcing &amp; shipping.</p>
        <div class="flex wrap mt-2 mb-2">
          <select class="input" id="cat-filter" style="max-width:260px"><option value="">All categories</option>${categories.map((c) => `<option value="${c._id}">${esc(c.name)}</option>`).join('')}</select>
          <span class="hint">${items.length} catalog products</span>
        </div>
        <div class="catalog-grid" id="catalog-grid"></div>`;
      const draw = (list) => {
        $('#catalog-grid').innerHTML = list.map((p) => {
          const suggested = Math.round(p.price * 1.6 * 100) / 100;
          return `<div class="catalog-item">
            <img src="${esc(p.images[0])}" alt="${esc(p.title)}" loading="lazy">
            <div class="body">
              <span class="hint">${esc(p.category?.name || '')}</span>
              <h4>${esc(p.title)}</h4>
              <div class="costs"><span>Supplier cost</span><strong>${money(p.price)}</strong></div>
              <div class="costs"><span>Suggested price</span><strong>${money(suggested)}</strong></div>
              <div class="costs"><span>Your profit</span><span class="profit">${money(suggested - p.price)}</span></div>
              ${p.chosen ? `<button class="btn btn-sm btn-block mt-1" disabled>${I.check} In your shop</button>`
                : `<button class="btn btn-gold btn-sm btn-block mt-1" data-choose="${p._id}" data-cost="${p.price}" data-suggest="${suggested}" data-title="${esc(p.title)}">${I.plus} Choose product</button>`}
            </div></div>`;
        }).join('') || '<p class="muted">No catalog products in this category.</p>';
        $$('[data-choose]').forEach((b) => (b.onclick = () => chooseModal(b.dataset)));
      };
      draw(items);
      $('#cat-filter').onchange = (e) => draw(e.target.value ? items.filter((p) => p.category?._id === e.target.value) : items);
    },

    async wallet(mode = 'deposit') {
      const w = await api('/api/wallet');
      main.innerHTML = `
        <h1>Wallet</h1><p class="text-2">Deposit funds and withdraw your earnings via card, PayPal or USDT.</p>
        <div class="stat-grid">
          <div class="stat highlight"><span>Available balance</span><strong>${money(w.balance)}</strong></div>
          <div class="stat"><span>Pending deposits</span><strong>${money(w.pendingDeposits)}</strong></div>
          <div class="stat"><span>Pending withdrawals</span><strong>${money(w.pendingWithdrawals)}</strong></div>
          <div class="stat"><span>Transactions</span><strong>${w.transactions.length}</strong></div>
        </div>
        <div class="card">
          <div class="tabs" style="margin-top:-8px">
            <button class="tab ${mode === 'deposit' ? 'active' : ''}" data-mode="deposit" id="tab-deposit">Deposit</button>
            <button class="tab ${mode === 'withdraw' ? 'active' : ''}" data-mode="withdraw" id="tab-withdraw">Withdraw</button>
          </div>
          <label class="hint">Payment method</label>
          <div class="methods mt-1" style="max-width:620px">
            <div class="method active" data-m="card" id="m-card"><div class="m-ico">${I.card}</div><strong>Card</strong><span>Visa · Mastercard</span></div>
            <div class="method" data-m="paypal" id="m-paypal"><div class="m-ico">${I.paypal}</div><strong>PayPal</strong><span>Fast &amp; secure</span></div>
            <div class="method" data-m="usdt" id="m-usdt"><div class="m-ico">${I.usdt}</div><strong>USDT</strong><span>TRC20 · ERC20 · BEP20</span></div>
          </div>
          <form id="wallet-form" style="max-width:620px"></form>
        </div>
        <h3 class="mt-4">Transaction history</h3>
        ${txTable(w.transactions)}`;
      let method = 'card';
      const draw = () => drawWalletForm(mode, method, w);
      $$('[data-mode]').forEach((t) => (t.onclick = () => { mode = t.dataset.mode; $$('[data-mode]').forEach((x) => x.classList.toggle('active', x === t)); draw(); }));
      $$('[data-m]').forEach((m) => (m.onclick = () => { method = m.dataset.m; $$('[data-m]').forEach((x) => x.classList.toggle('active', x === m)); draw(); }));
      draw();
    },

    async orders() {
      const s = await api('/api/seller/stats');
      main.innerHTML = `<h1>Orders</h1><p class="text-2">Orders containing your products. Your balance is credited when payment is confirmed.</p>${ordersTable(s.orders)}`;
    },

    async settings() {
      main.innerHTML = `
        <h1>Settings</h1>
        <div class="grid-2 mt-3" style="gap:24px;align-items:start">
          <form class="card" id="profile-form">
            <h3>Shop profile</h3>
            <div class="field"><label>Full name</label><input class="input" name="name" value="${esc(me.name)}"></div>
            <div class="field"><label>Shop name</label><input class="input" name="shopName" value="${esc(me.shopName || '')}"></div>
            <div class="field"><label>Bio</label><textarea class="input" name="bio" maxlength="500">${esc(me.bio || '')}</textarea></div>
            <div class="grid-2"><div class="field"><label>Country</label><input class="input" name="country" value="${esc(me.country || '')}"></div>
            <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(me.phone || '')}"></div></div>
            <div class="field"><label>Avatar image URL</label><input class="input" name="avatar" value="${esc(me.avatar || '')}" placeholder="https://…"></div>
            <button class="btn btn-gold" id="save-profile">Save profile</button>
          </form>
          <div>
            <form class="card" id="payout-form">
              <h3>Payment information</h3>
              <p class="hint">Default payout details used for withdrawals.</p>
              <div class="field"><label>PayPal email</label><input class="input" type="email" name="paypalEmail" value="${esc(me.payout?.paypalEmail || '')}"></div>
              <div class="field"><label>USDT network</label><select class="input" name="usdtNetwork">${['', 'TRC20', 'ERC20', 'BEP20'].map((n) => `<option value="${n}" ${me.payout?.usdtNetwork === n ? 'selected' : ''}>${n || 'Select network'}</option>`).join('')}</select></div>
              <div class="field"><label>USDT wallet address</label><input class="input" name="usdtAddress" value="${esc(me.payout?.usdtAddress || '')}" placeholder="T… or 0x…"></div>
              <button class="btn btn-gold" id="save-payout">Save payment info</button>
            </form>
            <form class="card mt-3" id="password-form">
              <h3>Change password</h3>
              <div class="field"><label>Current password</label><input class="input" type="password" name="current" required></div>
              <div class="field"><label>New password</label><input class="input" type="password" name="next" required minlength="6"></div>
              <button class="btn" id="save-password">Update password</button>
            </form>
          </div>
        </div>`;
      const save = (form) => async (e) => {
        e.preventDefault();
        try {
          me = (await api('/api/auth/profile', { method: 'PUT', body: Object.fromEntries(new FormData(form)) })).user;
          renderWho();
          toast('Saved', 'success');
        } catch (err) { toast(err.message, 'error'); }
      };
      $('#profile-form').onsubmit = save($('#profile-form'));
      $('#payout-form').onsubmit = save($('#payout-form'));
      $('#password-form').onsubmit = async (e) => {
        e.preventDefault();
        try { await api('/api/auth/password', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) }); toast('Password updated', 'success'); e.target.reset(); }
        catch (err) { toast(err.message, 'error'); }
      };
    },
  };

  function ordersTable(orders) {
    return `<div class="table-wrap"><table>
      <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${orders.map((o) => `<tr><td><strong>${esc(o.orderNumber)}</strong></td><td>${date(o.createdAt)}</td>
        <td>${esc(o.buyer.name)}<div class="hint">${esc([o.buyer.city, o.buyer.country].filter(Boolean).join(', '))}</div></td>
        <td>${o.items.map((i) => `${esc(i.title)} ×${i.qty}${i.size ? ' (' + esc(i.size) + ')' : ''}`).join('<br>')}</td>
        <td>${money(o.amount)}</td><td>${pill(o.status)}</td></tr>`).join('') || '<tr><td colspan="6" class="center muted" style="padding:30px">No orders yet</td></tr>'}</tbody></table></div>`;
  }

  // ---------------- Wallet forms ----------------
  async function drawWalletForm(mode, method, w) {
    const f = $('#wallet-form');
    const amountField = `<div class="field"><label for="w-amount">Amount (USD)</label><input class="input" type="number" step="0.01" min="${mode === 'deposit' ? w.limits.minDeposit : w.limits.minWithdraw}" id="w-amount" required placeholder="0.00">
      <span class="hint">Minimum ${money(mode === 'deposit' ? w.limits.minDeposit : w.limits.minWithdraw)}${mode === 'withdraw' ? ' · Available ' + money(w.balance) : ''}</span></div>`;
    const submitLabel = mode === 'deposit' ? 'Submit deposit' : 'Request withdrawal';

    if (method === 'card') {
      f.innerHTML = `
        <div class="card-preview"><span class="brand" id="cp-brand">CARD</span><div class="chip-ico"></div>
          <div class="num" id="cp-num">•••• •••• •••• ••••</div>
          <div class="row"><div><small>Card holder</small><span id="cp-name">YOUR NAME</span></div><div><small>Expires</small><span id="cp-exp">MM/YY</span></div></div></div>
        ${amountField}
        <div class="field"><label for="c-num">Card number</label><input class="input" id="c-num" inputmode="numeric" maxlength="23" placeholder="1234 5678 9012 3456" required autocomplete="cc-number"></div>
        <div class="field"><label for="c-name">Cardholder name</label><input class="input" id="c-name" required autocomplete="cc-name"></div>
        ${mode === 'deposit' ? `<div class="grid-2"><div class="field"><label for="c-exp">Expiry</label><input class="input" id="c-exp" placeholder="MM/YY" maxlength="5" required autocomplete="cc-exp"></div>
        <div class="field"><label for="c-cvc">CVC</label><input class="input" id="c-cvc" placeholder="123" maxlength="4" required autocomplete="cc-csc"></div></div>` : ''}
        <p class="hint">${I.shield.replace('<svg', '<svg width="14" style="vertical-align:-2px"')} Card details are encrypted in transit. We never store your full card number or CVC.</p>
        <button class="btn btn-gold btn-lg btn-block" id="wallet-submit">${submitLabel}</button>`;
      const brand = (n) => (/^4/.test(n) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(n) ? 'MASTERCARD' : /^3[47]/.test(n) ? 'AMEX' : 'CARD');
      $('#c-num').oninput = (e) => {
        const d = e.target.value.replace(/\D/g, '').slice(0, 19);
        e.target.value = d.replace(/(.{4})/g, '$1 ').trim();
        $('#cp-num').textContent = (d + '•'.repeat(Math.max(0, 16 - d.length))).replace(/(.{4})/g, '$1 ').trim();
        $('#cp-brand').textContent = brand(d);
      };
      $('#c-name').oninput = (e) => ($('#cp-name').textContent = e.target.value.toUpperCase() || 'YOUR NAME');
      if ($('#c-exp')) $('#c-exp').oninput = (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
        e.target.value = v;
        $('#cp-exp').textContent = v || 'MM/YY';
      };
    } else if (method === 'paypal') {
      f.innerHTML = mode === 'deposit'
        ? `${amountField}
          <div class="alert warning" style="color:var(--text-2)">Send the payment to our PayPal account <strong style="color:var(--text)">${esc(w.paypalReceiver)}</strong>, then confirm below with the email you paid from.</div>
          <div class="field"><label for="pp-email">Your PayPal email</label><input class="input" type="email" id="pp-email" required value="${esc(w.payout?.paypalEmail || '')}"></div>
          <button type="submit" class="paypal-btn" id="wallet-submit">Pay with ${I.paypal}</button>`
        : `${amountField}
          <div class="field"><label for="pp-email">PayPal email to receive funds</label><input class="input" type="email" id="pp-email" required value="${esc(w.payout?.paypalEmail || '')}"></div>
          <button type="submit" class="paypal-btn" id="wallet-submit">Withdraw to ${I.paypal}</button>`;
    } else {
      f.innerHTML = `
        ${amountField}
        <div class="field"><label for="u-net">Network</label><select class="input" id="u-net">
          ${['TRC20', 'ERC20', 'BEP20'].map((n) => `<option value="${n}" ${(mode === 'withdraw' && w.payout?.usdtNetwork === n) ? 'selected' : ''}>USDT · ${n} ${n === 'TRC20' ? '(Tron)' : n === 'ERC20' ? '(Ethereum)' : '(BNB Smart Chain)'}</option>`).join('')}
        </select></div>
        ${mode === 'deposit'
          ? `<div class="usdt-box" id="usdt-box"><div class="skeleton" style="width:170px;height:170px"></div><div></div></div>
             <div class="field"><label for="u-tx">Transaction hash (TXID)</label><input class="input" id="u-tx" required placeholder="Paste the TXID after sending"></div>`
          : `<div class="field"><label for="u-addr">Your USDT wallet address</label><input class="input" id="u-addr" required value="${esc(w.payout?.usdtAddress || '')}" placeholder="T… (TRC20) or 0x… (ERC20/BEP20)"></div>
             <p class="hint">⚠ Make sure the address matches the selected network, otherwise funds may be lost.</p>`}
        <button class="btn btn-gold btn-lg btn-block" id="wallet-submit">${submitLabel}</button>`;
      if (mode === 'deposit') {
        const loadQr = async () => {
          const net = $('#u-net').value;
          try {
            const q = await api('/api/wallet/qr/' + net);
            $('#usdt-box').innerHTML = `<img src="${q.qr}" alt="QR code for ${net} deposit address">
              <div><span class="pill" style="margin-bottom:10px">Send only USDT (${net})</span>
              <p class="hint mb-0" style="margin-top:10px">Deposit address</p>
              <div class="addr"><span class="grow">${esc(q.address)}</span><button type="button" class="icon-btn" style="width:34px;height:34px" id="copy-addr" title="Copy">${I.copy}</button></div>
              <p class="hint mt-1 mb-0">Credited after network confirmation &amp; review.</p></div>`;
            $('#copy-addr').onclick = () => navigator.clipboard.writeText(q.address).then(() => toast('Address copied', 'success'));
          } catch (e) { toast(e.message, 'error'); }
        };
        $('#u-net').onchange = loadQr;
        loadQr();
      }
    }

    f.onsubmit = async (e) => {
      e.preventDefault();
      const body = { method, amount: $('#w-amount').value };
      if (method === 'card') body.card = { number: $('#c-num').value, name: $('#c-name').value, expiry: $('#c-exp')?.value, cvc: $('#c-cvc')?.value };
      if (method === 'paypal') body.paypalEmail = $('#pp-email').value;
      if (method === 'usdt') { body.network = $('#u-net').value; if (mode === 'deposit') body.txHash = $('#u-tx').value; else body.address = $('#u-addr').value; }
      const btn = $('#wallet-submit'); btn.disabled = true;
      try {
        const r = await api('/api/wallet/' + mode, { method: 'POST', body });
        toast(r.message, 'success');
        me = (await api('/api/auth/me')).user;
        tabs.wallet(mode);
      } catch (err) { toast(err.message, 'error'); btn.disabled = false; }
    };
  }

  // ---------------- Choose product modal ----------------
  function chooseModal(d) {
    modal('Choose product', `
      <form id="choose-form">
        <p class="text-2"><strong style="color:var(--text)">${esc(d.title)}</strong></p>
        <div class="grid-2">
          <div class="field"><label>Supplier cost</label><input class="input" value="${money(d.cost)}" disabled></div>
          <div class="field"><label for="ch-price">Your selling price</label><input class="input" type="number" step="0.01" min="${d.cost}" id="ch-price" value="${d.suggest}" required></div>
        </div>
        <p class="hint">Profit per sale: <strong id="ch-profit" style="color:var(--success)">${money(d.suggest - d.cost)}</strong></p>
        <button class="btn btn-gold btn-block" id="ch-submit">Add to my shop</button>
      </form>`, { onOpen: (m, close) => {
        m.querySelector('#ch-price').oninput = (e) => (m.querySelector('#ch-profit').textContent = money(Math.max(0, e.target.value - d.cost)));
        m.querySelector('#choose-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            await api(`/api/seller/catalog/${d.choose}/choose`, { method: 'POST', body: { price: m.querySelector('#ch-price').value } });
            toast('Product added to your shop and listed on the home page!', 'success');
            close(); tabs.catalog();
          } catch (err) { toast(err.message, 'error'); }
        };
      }});
  }

  // ---------------- Listing form (create / edit) ----------------
  function listingForm(p) {
    let files = [];
    let keep = p ? [...p.images] : [];
    modal(p ? 'Edit listing' : 'Add new listing', `
      <form id="listing-form">
        <div class="field"><label for="lf-title">Product title</label><input class="input" id="lf-title" name="title" required value="${esc(p?.title || '')}"></div>
        <div class="grid-2">
          <div class="field"><label for="lf-cat">Category</label><select class="input" id="lf-cat" name="category" required>${categories.map((c) => `<option value="${c._id}" ${(p?.category?._id || p?.category) === c._id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="lf-stock">Stock</label><input class="input" type="number" min="0" id="lf-stock" name="stock" value="${p?.stock ?? 50}"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label for="lf-price">Price (USD)</label><input class="input" type="number" step="0.01" min="0.01" id="lf-price" name="price" required value="${p?.price ?? ''}"></div>
          <div class="field"><label for="lf-compare">Compare-at price</label><input class="input" type="number" step="0.01" min="0" id="lf-compare" name="comparePrice" value="${p?.comparePrice || ''}" placeholder="Optional"></div>
        </div>
        <div class="grid-2">
          <div class="field"><label for="lf-sizes">Sizes</label><input class="input" id="lf-sizes" name="sizes" value="${esc((p?.sizes || []).join(', '))}" placeholder="S, M, L, XL"></div>
          <div class="field"><label for="lf-colors">Colors</label><input class="input" id="lf-colors" name="colors" value="${esc((p?.colors || []).join(', '))}" placeholder="Black, White"></div>
        </div>
        <div class="field"><label for="lf-desc">Description</label><textarea class="input" id="lf-desc" name="description">${esc(p?.description || '')}</textarea></div>
        <div class="field"><label>Product photos</label>
          <label class="dropzone" id="dropzone">${I.plus.replace('<svg', '<svg width="26" style="margin:0 auto 6px;color:var(--gold)"')}<div>Click or drag photos here</div><span class="hint">JPG, PNG, WEBP · up to 5MB · max 6</span>
            <input type="file" id="lf-files" accept="image/*" multiple hidden></label>
          <div class="previews" id="previews"></div>
        </div>
        <button class="btn btn-gold btn-block btn-lg" id="lf-submit">${p ? 'Save changes' : 'Publish listing'}</button>
      </form>`, { wide: true, onOpen: (m, close) => {
        const drawPreviews = () => {
          m.querySelector('#previews').innerHTML =
            keep.map((src, i) => `<div class="pv"><img src="${esc(src)}"><button type="button" data-k="${i}">×</button></div>`).join('') +
            files.map((f, i) => `<div class="pv"><img src="${URL.createObjectURL(f)}"><button type="button" data-f="${i}">×</button></div>`).join('');
          m.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { keep.splice(b.dataset.k, 1); drawPreviews(); }));
          m.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { files.splice(b.dataset.f, 1); drawPreviews(); }));
        };
        const addFiles = (list) => { files = [...files, ...[...list].filter((f) => f.type.startsWith('image/'))].slice(0, 6 - keep.length); drawPreviews(); };
        const dz = m.querySelector('#dropzone');
        m.querySelector('#lf-files').onchange = (e) => addFiles(e.target.files);
        dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('drag'); };
        dz.ondragleave = () => dz.classList.remove('drag');
        dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('drag'); addFiles(e.dataTransfer.files); };
        drawPreviews();

        m.querySelector('#listing-form').onsubmit = async (e) => {
          e.preventDefault();
          if (!files.length && !keep.length) return toast('Add at least one product photo', 'error');
          const fd = new FormData(e.target);
          for (const f of files) fd.append('images', await TOF.compressImage(f));
          if (p) fd.append('keepImages', keep.join(','));
          const btn = m.querySelector('#lf-submit'); btn.disabled = true; btn.textContent = 'Saving…';
          try {
            await api('/api/seller/products' + (p ? '/' + p._id : ''), { method: p ? 'PUT' : 'POST', body: fd });
            toast(p ? 'Listing updated' : 'Listing published — it now appears on the home page!', 'success');
            close(); go('listings');
          } catch (err) { toast(err.message, 'error'); btn.disabled = false; btn.textContent = p ? 'Save changes' : 'Publish listing'; }
        };
      }});
  }

  // ---------------- Navigation ----------------
  async function go(tab, arg) {
    $$('#dash-nav [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    history.replaceState(null, '', '#' + tab);
    try { await tabs[tab](arg); } catch (e) {
      if (e.status === 401 || e.status === 403) { toast(e.message, 'error'); setTimeout(() => (location.href = '/login.html'), 1200); }
      else main.innerHTML = `<div class="alert error">${esc(e.message)}</div>`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('#dash-nav [data-tab]').forEach((b) => (b.onclick = () => go(b.dataset.tab)));
  $('#logout-btn').onclick = async () => { await api('/api/auth/logout', { method: 'POST' }); location.href = '/'; };
  go(tabs[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
})();
