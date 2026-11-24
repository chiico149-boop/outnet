// Seller dashboard API: listings, catalog ("Choose Products"), stats
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const upload = require('../middleware/upload');
const { requireSeller } = require('../middleware/auth');

const router = express.Router();
router.use(requireSeller);

const isId = (id) => mongoose.isValidObjectId(id);
const list = (v) =>
  String(v || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

function removeUpload(url) {
  if (url && url.startsWith('/uploads/')) {
    fs.unlink(path.join(__dirname, '..', 'public', url), () => {});
  }
}

// GET /api/seller/stats
router.get('/stats', async (req, res) => {
  const sellerId = req.user._id;
  const [listings, orders] = await Promise.all([
    Product.find({ seller: sellerId, isCatalog: false }).lean(),
    Order.find({ 'items.seller': sellerId }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  const myOrders = orders.map((o) => {
    const items = o.items.filter((i) => String(i.seller) === String(sellerId));
    return {
      _id: o._id,
      orderNumber: o.orderNumber,
      status: o.status,
      createdAt: o.createdAt,
      buyer: { name: o.buyer.name, city: o.buyer.city, country: o.buyer.country },
      items,
      amount: items.reduce((a, i) => a + i.price * i.qty, 0),
    };
  });
  res.json({
    balance: req.user.balance,
    listings: listings.length,
    active: listings.filter((p) => p.status === 'active').length,
    sales: listings.reduce((a, p) => a + (p.sales || 0), 0),
    reviews: listings.reduce((a, p) => a + (p.numReviews || 0), 0),
    orders: myOrders,
  });
});

// GET /api/seller/products
router.get('/products', async (req, res) => {
  const items = await Product.find({ seller: req.user._id, isCatalog: false })
    .sort({ createdAt: -1 })
    .populate('category', 'name slug')
    .lean();
  res.json(items);
});

// POST /api/seller/products  (multipart: images[] + fields)
router.post('/products', upload.array('images', 6), async (req, res) => {
  try {
    const { title, description, price, comparePrice, category, stock, sizes, colors, imageUrls } = req.body;
    if (!title || title.trim().length < 3) throw new Error('Title must be at least 3 characters');
    const p = Number(price);
    if (!(p > 0)) throw new Error('Enter a valid price');
    if (!isId(category) || !(await Category.exists({ _id: category }))) throw new Error('Choose a category');

    const images = (req.files || []).map((f) => '/uploads/' + f.filename);
    list(imageUrls).forEach((u) => /^https?:\/\//.test(u) && images.push(u));
    if (!images.length) throw new Error('Add at least one product photo');

    const product = await Product.create({
      title: title.trim(),
      description: description || '',
      price: Math.round(p * 100) / 100,
      comparePrice: Number(comparePrice) || 0,
      category,
      stock: Math.max(0, parseInt(stock, 10) || 0),
      sizes: list(sizes),
      colors: list(colors),
      images,
      seller: req.user._id,
    });
    res.status(201).json(product);
  } catch (err) {
    (req.files || []).forEach((f) => removeUpload('/uploads/' + f.filename));
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/seller/products/:id
router.put('/products/:id', upload.array('images', 6), async (req, res) => {
  try {
    if (!isId(req.params.id)) throw new Error('Product not found');
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id, isCatalog: false });
    if (!product) throw new Error('Product not found');

    const { title, description, price, comparePrice, category, stock, sizes, colors, status, keepImages } = req.body;
    if (title !== undefined) product.title = String(title).trim().slice(0, 140);
    if (description !== undefined) product.description = String(description).slice(0, 3000);
    if (price !== undefined && Number(price) > 0) product.price = Math.round(Number(price) * 100) / 100;
    if (comparePrice !== undefined) product.comparePrice = Number(comparePrice) || 0;
    if (category && isId(category)) product.category = category;
    if (stock !== undefined) product.stock = Math.max(0, parseInt(stock, 10) || 0);
    if (sizes !== undefined) product.sizes = list(sizes);
    if (colors !== undefined) product.colors = list(colors);
    if (['active', 'hidden'].includes(status)) product.status = status;

    if (keepImages !== undefined) {
      const keep = list(keepImages);
      product.images.filter((i) => !keep.includes(i)).forEach(removeUpload);
      product.images = product.images.filter((i) => keep.includes(i));
    }
    (req.files || []).forEach((f) => product.images.push('/uploads/' + f.filename));
    if (!product.images.length) throw new Error('A product needs at least one photo');

    await product.save();
    res.json(product);
  } catch (err) {
    (req.files || []).forEach((f) => removeUpload('/uploads/' + f.filename));
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/seller/products/:id
router.delete('/products/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Product not found' });
  const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id, isCatalog: false });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  if (!product.sourceProduct) product.images.forEach(removeUpload);
  res.json({ ok: true });
});

// GET /api/seller/catalog  - master catalog to choose products from
router.get('/catalog', async (req, res) => {
  const filter = { isCatalog: true, status: 'active' };
  if (req.query.category && isId(req.query.category)) filter.category = req.query.category;
  const [items, mine] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).populate('category', 'name slug').lean(),
    Product.find({ seller: req.user._id, sourceProduct: { $exists: true } }).distinct('sourceProduct'),
  ]);
  const chosen = mine.map(String);
  res.json(items.map((p) => ({ ...p, chosen: chosen.includes(String(p._id)) })));
});

// POST /api/seller/catalog/:id/choose  { price }
router.post('/catalog/:id/choose', async (req, res) => {
  if (!isId(req.params.id)) return res.status(404).json({ message: 'Catalog product not found' });
  const src = await Product.findOne({ _id: req.params.id, isCatalog: true, status: 'active' });
  if (!src) return res.status(404).json({ message: 'Catalog product not found' });
  const already = await Product.exists({ seller: req.user._id, sourceProduct: src._id });
  if (already) return res.status(409).json({ message: 'You already list this product' });

  const price = Number(req.body.price) || Math.round(src.price * 1.35 * 100) / 100;
  if (price < src.price) return res.status(400).json({ message: `Price must be at least the supplier cost ($${src.price.toFixed(2)})` });

  const listing = await Product.create({
    title: src.title,
    description: src.description,
    price: Math.round(price * 100) / 100,
    comparePrice: src.comparePrice > price ? src.comparePrice : 0,
    images: src.images,
    category: src.category,
    stock: src.stock,
    sizes: src.sizes,
    colors: src.colors,
    seller: req.user._id,
    sourceProduct: src._id,
  });
  res.status(201).json(listing);
});

module.exports = router;
