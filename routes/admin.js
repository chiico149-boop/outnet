// Admin API (protected by admin cookie)
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const upload = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

const isId = (id) => mongoose.isValidObjectId(id);
const money = (v) => Math.round(Number(v) * 100) / 100;
const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [sellers, blocked, products, catalog, pendingTx, orders, balances, openReports, revenue] = await Promise.all([
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'seller', status: 'blocked' }),
    Product.countDocuments({ isCatalog: false }),
    Product.countDocuments({ isCatalog: true }),
    Transaction.countDocuments({ status: 'pending' }),
    Order.countDocuments(),
    User.aggregate([{ $match: { role: 'seller' } }, { $group: { _id: null, total: { $sum: '$balance' } } }]),
    User.aggregate([{ $match: { role: 'seller' } }, { $unwind: '$reports' }, { $match: { 'reports.resolved': false } }, { $count: 'n' }]),
    Order.aggregate([{ $match: { status: { $in: ['paid', 'shipped', 'delivered'] } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);
  res.json({
    sellers,
    blocked,
    products,
    catalog,
    pendingTx,
    orders,
    totalBalances: balances[0]?.total || 0,
    openReports: openReports[0]?.n || 0,
    revenue: revenue[0]?.total || 0,
  });
});

// ---------------- Sellers ----------------
router.get('/sellers', async (req, res) => {
  const filter = { role: 'seller' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    const rx = { $regex: escapeRx(req.query.q), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { shopName: rx }];
  }
  const sellers = await User.find(filter).sort({ createdAt: -1 }).lean();
  const counts = await Product.aggregate([{ $match: { isCatalog: false } }, { $group: { _id: '$seller', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(
    sellers.map((s) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      shopName: s.shopName,
      country: s.country,
      phone: s.phone,
      balance: s.balance,
      status: s.status,
      flagged: s.flagged,
      products: map[String(s._id)] || 0,
      openReports: (s.reports || []).filter((r) => !r.resolved).length,
      createdAt: s.createdAt,
      lastLogin: s.lastLogin,
    }))
  );
});

router.get('/sellers/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const seller = await User.findOne({ _id: req.params.id, role: 'seller' }).lean();
  if (!seller) return res.status(404).json({ message: 'Not found' });
  const [products, transactions] = await Promise.all([
    Product.find({ seller: seller._id, isCatalog: false }).populate('category', 'name').sort({ createdAt: -1 }).lean(),
    Transaction.find({ user: seller._id }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  res.json({ seller, products, transactions });
});

// POST /api/admin/sellers/:id/credit  { amount, note }   (admin deposits money for seller)
router.post('/sellers/:id/credit', async (req, res) => {
  const amount = money(req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ message: 'Enter a valid amount' });
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const seller = await User.findOneAndUpdate({ _id: req.params.id, role: 'seller' }, { $inc: { balance: amount } }, { new: true });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });
  await Transaction.create({
    user: seller._id,
    type: 'admin_credit',
    method: 'admin',
    amount,
    note: String(req.body.note || 'Deposit by admin').slice(0, 200),
    status: 'approved',
    reviewedAt: new Date(),
  });
  res.json({ ok: true, balance: seller.balance });
});

// POST /api/admin/sellers/:id/debit  { amount, note }
router.post('/sellers/:id/debit', async (req, res) => {
  const amount = money(req.body.amount);
  if (!(amount > 0)) return res.status(400).json({ message: 'Enter a valid amount' });
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const seller = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'seller', balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!seller) return res.status(400).json({ message: 'Seller not found or insufficient balance' });
  await Transaction.create({
    user: seller._id,
    type: 'admin_debit',
    method: 'admin',
    amount,
    note: String(req.body.note || 'Adjustment by admin').slice(0, 200),
    status: 'approved',
    reviewedAt: new Date(),
  });
  res.json({ ok: true, balance: seller.balance });
});

router.post('/sellers/:id/block', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const s = await User.findOneAndUpdate({ _id: req.params.id, role: 'seller' }, { status: 'blocked' }, { new: true });
  if (!s) return res.status(404).json({ message: 'Seller not found' });
  res.json({ ok: true, status: s.status });
});

router.post('/sellers/:id/unblock', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const s = await User.findOneAndUpdate({ _id: req.params.id, role: 'seller' }, { status: 'active' }, { new: true });
  if (!s) return res.status(404).json({ message: 'Seller not found' });
  res.json({ ok: true, status: s.status });
});

// POST /api/admin/sellers/:id/report { reason }  - admin flags/warns a seller (shown in seller dashboard)
router.post('/sellers/:id/report', async (req, res) => {
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 3) return res.status(400).json({ message: 'Enter a reason' });
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const s = await User.findOne({ _id: req.params.id, role: 'seller' });
  if (!s) return res.status(404).json({ message: 'Seller not found' });
  s.reports.push({ reason: reason.slice(0, 500), reporterName: 'Admin', byAdmin: true });
  s.flagged = true;
  await s.save();
  res.json({ ok: true });
});

// POST /api/admin/sellers/:id/reports/:rid/resolve
router.post('/sellers/:id/reports/:rid/resolve', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const s = await User.findOne({ _id: req.params.id, role: 'seller' });
  if (!s) return res.status(404).json({ message: 'Seller not found' });
  const r = s.reports.id(req.params.rid);
  if (!r) return res.status(404).json({ message: 'Report not found' });
  r.resolved = true;
  s.flagged = s.reports.some((x) => x.byAdmin && !x.resolved);
  await s.save();
  res.json({ ok: true });
});

router.delete('/sellers/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const s = await User.findOneAndDelete({ _id: req.params.id, role: 'seller' });
  if (!s) return res.status(404).json({ message: 'Seller not found' });
  await Product.deleteMany({ seller: s._id });
  res.json({ ok: true });
});

// GET /api/admin/reports  - all open reports across sellers
router.get('/reports', async (req, res) => {
  const sellers = await User.find({ role: 'seller', 'reports.0': { $exists: true } }).select('name shopName email reports status').lean();
  const out = [];
  sellers.forEach((s) =>
    s.reports.forEach((r) =>
      out.push({ ...r, seller: { _id: s._id, name: s.name, shopName: s.shopName, email: s.email, status: s.status } })
    )
  );
  out.sort((a, b) => Number(a.resolved) - Number(b.resolved) || new Date(b.createdAt) - new Date(a.createdAt));
  res.json(out);
});

// ---------------- Transactions ----------------
router.get('/transactions', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  const txs = await Transaction.find(filter).sort({ createdAt: -1 }).limit(300).populate('user', 'name email shopName').lean();
  res.json(txs);
});

router.post('/transactions/:id/approve', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { status: 'approved', reviewedAt: new Date(), note: req.body.note || '' },
    { new: true }
  );
  if (!tx) return res.status(400).json({ message: 'Transaction not found or already processed' });
  // Deposits credit the balance; withdrawals were already held at request time
  if (tx.type === 'deposit') await User.updateOne({ _id: tx.user }, { $inc: { balance: tx.amount } });
  res.json({ ok: true });
});

router.post('/transactions/:id/reject', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { status: 'rejected', reviewedAt: new Date(), note: req.body.note || '' },
    { new: true }
  );
  if (!tx) return res.status(400).json({ message: 'Transaction not found or already processed' });
  // Refund held funds for rejected withdrawals
  if (tx.type === 'withdraw') await User.updateOne({ _id: tx.user }, { $inc: { balance: tx.amount } });
  res.json({ ok: true });
});

// ---------------- Products ----------------
router.get('/products', async (req, res) => {
  const filter = { isCatalog: req.query.catalog === '1' };
  if (req.query.q) filter.title = { $regex: escapeRx(req.query.q), $options: 'i' };
  const items = await Product.find(filter)
    .sort({ createdAt: -1 })
    .limit(500)
    .populate('category', 'name')
    .populate('seller', 'name shopName status')
    .lean();
  res.json(items);
});

router.put('/products/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const update = {};
  if (['active', 'hidden'].includes(req.body.status)) update.status = req.body.status;
  if (typeof req.body.featured === 'boolean') update.featured = req.body.featured;
  if (req.body.price !== undefined && Number(req.body.price) > 0) update.price = money(req.body.price);
  const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
});

router.delete('/products/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  await Product.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// POST /api/admin/catalog - add a product to the master catalog (sellers can choose it)
router.post('/catalog', upload.array('images', 6), async (req, res) => {
  try {
    const { title, description, price, category, stock, sizes, colors } = req.body;
    if (!title || !(Number(price) > 0) || !isId(category)) throw new Error('Title, supplier price and category are required');
    const images = (req.files || []).map((f) => '/uploads/' + f.filename);
    if (!images.length) throw new Error('Add at least one photo');
    const split = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    const p = await Product.create({
      title,
      description: description || '',
      price: money(price),
      category,
      stock: parseInt(stock, 10) || 100,
      sizes: split(sizes),
      colors: split(colors),
      images,
      seller: req.admin._id,
      isCatalog: true,
    });
    res.status(201).json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/categories', async (req, res) => res.json(await Category.find().sort({ order: 1 }).lean()));

// ---------------- Orders ----------------
router.get('/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(300).populate('items.seller', 'name shopName').lean();
  res.json(orders);
});

// POST /api/admin/orders/:id/status { status }
// Marking an order "paid" credits each seller's balance with their items' total (once).
router.post('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Not found' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = status;
  if (['paid', 'shipped', 'delivered'].includes(status) && !order.credited) {
    const perSeller = {};
    order.items.forEach((i) => {
      perSeller[i.seller] = (perSeller[i.seller] || 0) + i.price * i.qty;
    });
    for (const [sellerId, amt] of Object.entries(perSeller)) {
      const amount = money(amt);
      await User.updateOne({ _id: sellerId }, { $inc: { balance: amount } });
      await Transaction.create({
        user: sellerId,
        type: 'sale',
        method: 'order',
        amount,
        details: { orderId: order.orderNumber },
        note: 'Sale ' + order.orderNumber,
        status: 'approved',
        reviewedAt: new Date(),
      });
    }
    for (const i of order.items) await Product.updateOne({ _id: i.product }, { $inc: { sales: i.qty, stock: -i.qty } });
    order.credited = true;
  }
  await order.save();
  res.json({ ok: true });
});

module.exports = router;
