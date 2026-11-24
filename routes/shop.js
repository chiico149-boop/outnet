// Public storefront API: categories, products, reviews, sellers, checkout
const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const { validEmail, validateCard, cardBrand } = require('../utils/payments');

const router = express.Router();
const isId = (id) => mongoose.isValidObjectId(id);
const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function blockedSellerIds() {
  return User.find({ status: 'blocked' }).distinct('_id');
}

// Base filter for products visible on the storefront
async function publicFilter(extra = {}) {
  return {
    isCatalog: false,
    status: 'active',
    seller: { $nin: await blockedSellerIds() },
    ...extra,
  };
}

const SELLER_FIELDS = 'name shopName avatar country createdAt';

// GET /api/images/:id  - uploaded photos stored in MongoDB
router.get('/images/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).end();
  const Image = require('../models/Image');
  const img = await Image.findById(req.params.id).lean();
  if (!img) return res.status(404).end();
  res.set('Content-Type', img.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(Buffer.from(img.data.buffer || img.data));
});

// GET /api/categories
router.get('/categories', async (req, res) => {
  const cats = await Category.find().sort({ order: 1, name: 1 }).lean();
  const base = await publicFilter();
  const counts = await Product.aggregate([{ $match: base }, { $group: { _id: '$category', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(cats.map((c) => ({ ...c, count: map[String(c._id)] || 0 })));
});

// GET /api/products?category=slug&q=&sort=&seller=&featured=1&min=&max=&page=&limit=
router.get('/products', async (req, res) => {
  const { category, q, sort, seller, featured, min, max } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 24, 60);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  const extra = {};
  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (!cat) return res.json({ items: [], total: 0, page, pages: 0 });
    extra.category = cat._id;
  }
  if (seller && isId(seller)) extra.seller = seller;
  if (featured === '1') extra.featured = true;
  if (q) extra.title = { $regex: escapeRx(q), $options: 'i' };
  if (min || max) {
    extra.price = {};
    if (min) extra.price.$gte = Number(min);
    if (max) extra.price.$lte = Number(max);
  }

  const filter = await publicFilter(extra);
  if (extra.seller) {
    // keep blocked check while filtering by a specific seller
    const blocked = (await blockedSellerIds()).map(String);
    if (blocked.includes(String(seller))) return res.json({ items: [], total: 0, page, pages: 0 });
    filter.seller = extra.seller;
  }

  const sorts = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    popular: { sales: -1 },
  };

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sorts[sort] || { featured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('seller', SELLER_FIELDS)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
  const product = await Product.findOne({ _id: req.params.id, isCatalog: false })
    .populate('category', 'name slug')
    .populate('seller', SELLER_FIELDS + ' status bio')
    .lean();
  if (!product || product.status !== 'active' || product.seller?.status === 'blocked') {
    return res.status(404).json({ message: 'Product not found' });
  }
  const [reviews, related, sellerCount] = await Promise.all([
    Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Product.find(await publicFilter({ category: product.category._id, _id: { $ne: product._id } }))
      .limit(4)
      .populate('seller', SELLER_FIELDS)
      .lean(),
    Product.countDocuments({ seller: product.seller._id, isCatalog: false, status: 'active' }),
  ]);
  delete product.seller.status;
  res.json({ product, reviews, related, sellerProducts: sellerCount });
});

// POST /api/products/:id/reviews
router.post('/products/:id/reviews', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
  const { name, rating, comment } = req.body;
  const r = parseInt(rating, 10);
  if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Please enter your name' });
  if (!(r >= 1 && r <= 5)) return res.status(400).json({ message: 'Rating must be 1-5 stars' });
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  const review = await Review.create({ product: product._id, name: name.trim(), rating: r, comment: String(comment || '').slice(0, 1000) });
  await Review.recalc(product._id);
  res.status(201).json(review);
});

// GET /api/sellers  (top sellers)
router.get('/sellers', async (req, res) => {
  const blocked = await blockedSellerIds();
  const stats = await Product.aggregate([
    { $match: { isCatalog: false, status: 'active', seller: { $nin: blocked } } },
    { $group: { _id: '$seller', products: { $sum: 1 }, rating: { $avg: '$rating' }, sales: { $sum: '$sales' } } },
    { $sort: { sales: -1, products: -1 } },
    { $limit: parseInt(req.query.limit, 10) || 8 },
  ]);
  const users = await User.find({ _id: { $in: stats.map((s) => s._id) } }).select(SELLER_FIELDS + ' bio').lean();
  const byId = Object.fromEntries(users.map((u) => [String(u._id), u]));
  res.json(
    stats
      .filter((s) => byId[String(s._id)])
      .map((s) => ({ ...byId[String(s._id)], products: s.products, rating: Math.round((s.rating || 0) * 10) / 10, sales: s.sales }))
  );
});

// GET /api/sellers/:id
router.get('/sellers/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Seller not found' });
  const seller = await User.findOne({ _id: req.params.id, role: 'seller' }).lean();
  if (!seller || seller.status === 'blocked') return res.status(404).json({ message: 'Seller not found' });
  const products = await Product.find({ seller: seller._id, isCatalog: false, status: 'active' })
    .sort({ createdAt: -1 })
    .populate('category', 'name slug')
    .lean();
  const rated = products.filter((p) => p.numReviews > 0);
  const rating = rated.length ? rated.reduce((a, p) => a + p.rating, 0) / rated.length : 0;
  res.json({
    seller: {
      _id: seller._id,
      name: seller.name,
      shopName: seller.shopName || seller.name,
      bio: seller.bio,
      avatar: seller.avatar,
      country: seller.country,
      createdAt: seller.createdAt,
      rating: Math.round(rating * 10) / 10,
      reviews: products.reduce((a, p) => a + p.numReviews, 0),
      sales: products.reduce((a, p) => a + p.sales, 0),
    },
    products,
  });
});

// POST /api/sellers/:id/report
router.post('/sellers/:id/report', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Seller not found' });
  const { reason, name, email } = req.body;
  if (!reason || reason.trim().length < 5) return res.status(400).json({ message: 'Please describe the problem (min 5 characters)' });
  const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
  if (!seller) return res.status(404).json({ message: 'Seller not found' });
  seller.reports.push({ reason: reason.trim().slice(0, 500), reporterName: name || 'Anonymous', reporterEmail: email || '' });
  await seller.save();
  res.status(201).json({ ok: true, message: 'Report sent. Our team will review it.' });
});

// POST /api/orders  (guest checkout)
router.post('/orders', async (req, res) => {
  try {
    const { items, buyer, paymentMethod, payment = {} } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Your cart is empty' });
    if (!buyer || !buyer.name || !validEmail(buyer.email) || !buyer.address) {
      return res.status(400).json({ message: 'Please fill in name, valid email and address' });
    }
    if (!['card', 'paypal', 'usdt'].includes(paymentMethod)) return res.status(400).json({ message: 'Choose a payment method' });

    let paymentRef = '';
    if (paymentMethod === 'card') {
      const err = validateCard(payment);
      if (err) return res.status(400).json({ message: err });
      paymentRef = `${cardBrand(payment.number)} •••• ${String(payment.number).replace(/\D/g, '').slice(-4)}`;
    } else if (paymentMethod === 'paypal') {
      if (!validEmail(payment.paypalEmail)) return res.status(400).json({ message: 'Enter your PayPal email' });
      paymentRef = 'PayPal ' + payment.paypalEmail;
    } else {
      if (!payment.txHash || payment.txHash.length < 10) return res.status(400).json({ message: 'Enter the USDT transaction hash' });
      paymentRef = `USDT ${payment.network || ''} ${payment.txHash}`;
    }

    const blocked = (await blockedSellerIds()).map(String);
    const orderItems = [];
    let total = 0;
    for (const it of items.slice(0, 50)) {
      if (!isId(it.id)) continue;
      const p = await Product.findOne({ _id: it.id, isCatalog: false, status: 'active' });
      if (!p || blocked.includes(String(p.seller))) continue;
      const qty = Math.max(1, Math.min(parseInt(it.qty, 10) || 1, 20));
      orderItems.push({ product: p._id, seller: p.seller, title: p.title, image: p.images[0], price: p.price, qty, size: it.size || '' });
      total += p.price * qty;
    }
    if (!orderItems.length) return res.status(400).json({ message: 'Products in your cart are no longer available' });

    const order = await Order.create({
      items: orderItems,
      buyer,
      total: Math.round(total * 100) / 100,
      paymentMethod,
      paymentRef,
    });
    res.status(201).json({ ok: true, orderNumber: order.orderNumber, total: order.total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not place order' });
  }
});

module.exports = router;
